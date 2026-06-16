import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { Text } from "@earendil-works/pi-tui";
import { exec } from "node:child_process";
import { existsSync, statSync, unlinkSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Path to our Python converter script (sibling of this .ts file)
const __dirname = dirname(fileURLToPath(import.meta.url));
const PY_SCRIPT = join(__dirname, "pdf2md.py");

/**
 * Run a command and return stdout. Wraps child_process.exec in a promise.
 * Supports cancellation via AbortSignal.
 */
function run(
  cmd: string,
  options: { timeout?: number; maxBuffer?: number; signal?: AbortSignal } = {},
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      cmd,
      {
        encoding: "utf-8" as const,
        maxBuffer: options.maxBuffer ?? 50 * 1024 * 1024,
        timeout: options.timeout ?? 60_000,
        signal: options.signal,
      },
      (error, stdout) => {
        if (error) {
          if (error.name === "AbortError" || (error as NodeJS.ErrnoException).code === "ABORT_ERR") {
            reject(new Error("Cancelled"));
          } else {
            reject(error);
          }
        } else {
          resolve(stdout);
        }
      },
    );
  });
}

/**
 * Probe whether a command exists in PATH.
 */
async function checkCommand(cmd: string): Promise<boolean> {
  try {
    await run(`which ${JSON.stringify(cmd)}`, { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Probe whether Python 3 and pdfminer.six are available.
 * Returns null if all good, or a missing-dependency name string.
 */
async function checkPythonPdfminer(): Promise<string | null> {
  const hasPython = await checkCommand("python3");
  if (!hasPython) return "python3";
  try {
    await run("python3 -c \"import pdfminer; print('ok')\"", { timeout: 5_000 });
    return null; // all good
  } catch {
    return "pdfminer";
  }
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "read_pdf",
    label: "Read PDF",
    description:
      "Read a PDF file and convert its content to Markdown with LaTeX math formulas. " +
      "Extracts text from the PDF's text layer (works with LaTeX-generated PDFs that have " +
      "computer modern fonts, and other PDFs with embedded text). " +
      "Detects math formulas via font analysis and renders them as TeX " +
      "($...$ inline, $$...$$ display) with subscripts, superscripts, and fractions.",
    promptSnippet: "Extract text and math from PDF files as Markdown+TeX (read_pdf path)",
    promptGuidelines: [
      "Use read_pdf to extract content from PDFs — the output is Markdown with inline $...$ and display $$...$$ math notation.",
      "Works best with LaTeX-generated PDFs (math symbols, fractions, sub/superscripts detected).",
      "Use read_pdf with arxiv PDF URLs to extract paper content programmatically.",
    ],
    parameters: Type.Object({
      path: Type.String({
        description: "Path to the PDF file (relative or absolute)",
      }),
      firstPage: Type.Optional(
        Type.Integer({
          description: "First page to extract (1-indexed, default: 1)",
        }),
      ),
      lastPage: Type.Optional(
        Type.Integer({
          description: "Last page to extract (default: last page of document)",
        }),
      ),
      debug: Type.Optional(
        Type.Boolean({
          description: "Enable debug output from the PDF parser",
        }),
      ),
      yThreshold: Type.Optional(
        Type.Number({
          description:
            "Fraction of page height for bottom footer cutoff (default: 0.06). " +
            "Lower values clip less. Pass 0 to disable footer filtering.",
        }),
      ),
    }),
    async execute(
      _toolCallId: string,
      params: {
        path: string;
        firstPage?: number;
        lastPage?: number;
        debug?: boolean;
        yThreshold?: number;
      },
      signal: AbortSignal | undefined,
      onUpdate:
        | ((update: { content: Array<{ type: string; text: string }> }) => void)
        | undefined,
      ctx: ExtensionContext,
    ) {
      const { path, firstPage, lastPage, debug, yThreshold } = params;

      // ── Path check ──────────────────────────────────────────────────────
      if (!existsSync(path)) {
        return {
          content: [{ type: "text", text: `Error: File not found: ${path}` }],
          isError: true,
          details: {},
        };
      }

      // ── File size check ─────────────────────────────────────────────────
      try {
        const sizeMb = statSync(path).size / (1024 * 1024);
        if (sizeMb > 100) {
          onUpdate?.({
            content: [
              {
                type: "text",
                text:
                  `Warning: PDF is ${sizeMb.toFixed(0)} MB. ` +
                  `Processing may take a while…`,
              },
            ],
          });
        }
      } catch { /* stat may fail on special paths; ignore */ }

      // ── Prerequisite checks ────────────────────────────────────────────
      const needsPageRange = firstPage !== undefined || lastPage !== undefined;
      let canUsePageRange = needsPageRange;
      if (needsPageRange) {
        const hasMutool = await checkCommand("mutool");
        if (!hasMutool) {
          // Fall back to processing the whole PDF
          onUpdate?.({
            content: [
              {
                type: "text",
                text:
                  "Note: 'mutool' is not installed (needed for page-range extraction).\n" +
                  "Install it with: sudo apt install mupdf-tools\n" +
                  "Processing the full PDF instead.",
              },
            ],
          });
          canUsePageRange = false;
        }
      }

      const missingDep = await checkPythonPdfminer();
      if (missingDep === "python3") {
        return {
          content: [
            {
              type: "text",
              text:
                "Error: python3 is required for PDF extraction. " +
                "Install it with: sudo apt install python3",
            },
          ],
          isError: true,
          details: {},
        };
      }
      if (missingDep === "pdfminer") {
        return {
          content: [
            {
              type: "text",
              text:
                "Error: The 'pdfminer.six' Python package is required. " +
                "Install it with: pip install pdfminer.six",
            },
          ],
          isError: true,
          details: {},
        };
      }

      // ── Temp directory for sub-PDF / extraction ───────────────────────
      const workDir = mkdtempSync(join(tmpdir(), "pi-read-pdf-"));
      let targetPath = path;
      let needsCleanup = false;

      try {
        // Notify: starting
        onUpdate?.({
          content: [{ type: "text", text: "Parsing PDF with pdfminer..." }],
        });

        // If pages specified (and mutool is available), extract a sub-PDF first
        if (canUsePageRange) {
          const pageSpec: string[] = [];
          if (firstPage !== undefined) pageSpec.push(String(firstPage));
          if (lastPage !== undefined) pageSpec.push(String(lastPage));
          targetPath = join(workDir, "subset.pdf");

          onUpdate?.({
            content: [
              {
                type: "text",
                text: `Extracting pages ${pageSpec.join("-")} with mutool...`,
              },
            ],
          });

          await run(
            `mutool clean ${JSON.stringify(path)} ${JSON.stringify(targetPath)} ${pageSpec.join("-")}`,
            { signal, timeout: 30_000 },
          );
          needsCleanup = true;
        }

        // Build the python command with optional flags
        const pyFlags: string[] = [];
        if (debug) pyFlags.push("--debug");
        if (yThreshold !== undefined) {
          pyFlags.push(`--y-threshold ${JSON.stringify(yThreshold)}`);
        }

        const pyCmd = `python3 ${JSON.stringify(PY_SCRIPT)} ${pyFlags.join(" ")} ${JSON.stringify(targetPath)}`;

        onUpdate?.({
          content: [{ type: "text", text: "Converting PDF to Markdown+TeX..." }],
        });

        // Call the Python converter
        const stdout = await run(pyCmd, { signal, timeout: 60_000 });

        const markdown = stdout.trim();

        if (!markdown) {
          return {
            content: [
              {
                type: "text",
                text:
                  "No text content was extracted from this PDF. " +
                  "It may be a scanned document without a text layer, or contain only images.",
              },
            ],
            details: {},
          };
        }

        return {
          content: [{ type: "text", text: markdown }],
          details: { path, length: markdown.length },
        };
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === "Cancelled") {
          return {
            content: [{ type: "text", text: "PDF reading was cancelled." }],
            isError: true,
            details: {},
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Error reading PDF: ${err.message}`,
            },
          ],
          isError: true,
          details: {},
        };
      } finally {
        // Clean up temp files
        if (needsCleanup) {
          try {
            unlinkSync(targetPath);
          } catch { /* ignore */ }
        }
        try {
          rmSync(workDir, { recursive: true, force: true });
        } catch { /* ignore */ }
      }
    },

    renderResult(result, { expanded, isPartial }, theme, _context) {
      if (isPartial) return new Text(theme.fg("warning", "Reading PDF..."), 0, 0);
      if (result.isError) return new Text(theme.fg("error", "PDF read failed"), 0, 0);
      const details = result.details as { path?: string; length?: number } | undefined;
      const path = details?.path ?? "unknown";
      const size = details?.length ?? 0;
      const sizeStr = size > 1000 ? `${(size / 1000).toFixed(0)}K chars` : `${size} chars`;
      let text = theme.fg("success", "PDF read");
      text += theme.fg("accent", ` ${path}`);
      text += theme.fg("dim", ` (${sizeStr})`);
      if (expanded) {
        const content = result.content[0]?.type === "text" ? result.content[0].text : "";
        const lines = content.split("\n").slice(0, 30);
        for (const line of lines) text += `\n${theme.fg("dim", line)}`;
        const total = content.split("\n").length;
        if (total > 30) text += `\n${theme.fg("muted", `... ${total - 30} more lines`)}`;
      }
      return new Text(text, 0, 0);
    },
  });
}
