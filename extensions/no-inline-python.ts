/**
 * no-inline-python — Pi Extension
 *
 * Blocks `python -c "..."` for code longer than MAX_LINES lines.
 * Handles chained commands (&&, ||, ;, |) and full-path / env-var prefixes.
 *
 * Install:
 *   Place in ~/.pi/agent/extensions/ or .pi/extensions/
 *   or test with: pi -e ~/.pi/agent/extensions/no-inline-python.ts
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// ─── Configuration ───────────────────────────────────────────────────────────

/** Maximum allowed Python inline code lines. 1-5 allowed, 6+ blocked. */
const MAX_LINES = 5;

// ─── Quote-aware command segment splitting ───────────────────────────────────

/**
 * Split a command string into pipeline/chain segments.
 * Respects single quotes, double quotes, and escape characters.
 * Splits on: &&, ||, ;, |, \n
 */
function splitSegments(command: string): string[] {
  const segments: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let i = 0;

  while (i < command.length) {
    const ch = command[i];

    if (escaped) {
      current += ch;
      escaped = false;
      i++;
      continue;
    }

    if (ch === "\\") {
      current += ch;
      escaped = true;
      i++;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      i++;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      i++;
      continue;
    }

    // Skip segment boundaries when inside quotes
    if (inSingle || inDouble) {
      current += ch;
      i++;
      continue;
    }

    // ; and \n are always segment separators
    if (ch === ";" || ch === "\n") {
      const trimmed = current.trim();
      if (trimmed) segments.push(trimmed);
      current = "";
      i++;
      continue;
    }

    // | is a segment separator (|| is logical OR, | is pipe)
    if (ch === "|") {
      const trimmed = current.trim();
      if (trimmed) segments.push(trimmed);
      current = "";
      i++;
      if (i < command.length && command[i] === "|") i++; // skip second |
      continue;
    }

    // && is a segment separator
    if (ch === "&" && i + 1 < command.length && command[i + 1] === "&") {
      const trimmed = current.trim();
      if (trimmed) segments.push(trimmed);
      current = "";
      i += 2;
      continue;
    }

    current += ch;
    i++;
  }

  const final = current.trim();
  if (final) segments.push(final);

  return segments;
}

// ─── Tokenization ────────────────────────────────────────────────────────────

/**
 * Tokenize a command segment into individual tokens (words).
 * Respects single quotes, double quotes, and escape characters.
 * Returns null if quotes are unterminated.
 */
function tokenize(segment: string): string[] | null {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }

    if (!inSingle && !inDouble && /\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (inSingle || inDouble) return null; // unterminated quotes
  if (current) tokens.push(current);

  return tokens;
}

// ─── Python -c detection ─────────────────────────────────────────────────────

/** True if the token looks like an environment variable assignment (FOO=bar). */
function isEnvVar(token: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(token);
}

/** Strip path prefix from an executable name. */
function normalizeExe(token: string): string {
  const slash = token.lastIndexOf("/");
  return slash >= 0 ? token.slice(slash + 1) : token;
}

/** True if the normalized executable is python or python3. */
function isPython(exe: string): boolean {
  return exe === "python" || exe === "python3";
}

/**
 * Given a tokenized command segment, find the Python code string
 * after `-c`. Returns null if this segment is not a python -c invocation.
 */
function extractPythonCode(tokens: string[]): string | null {
  // Skip leading env vars (e.g. PYTHONPATH=/foo python -c "...")
  let i = 0;
  while (i < tokens.length && isEnvVar(tokens[i])) i++;

  if (i >= tokens.length) return null;

  // Check executable
  const exe = normalizeExe(tokens[i]);
  if (!isPython(exe)) return null;
  i++;

  // Look for -c flag
  while (i < tokens.length) {
    const token = tokens[i];

    // Skip other flags that might precede -c
    if (token.startsWith("-")) {
      if (token === "-c") {
        i++;
        if (i >= tokens.length) return null; // -c with no argument
        return stripOuterQuotes(tokens[i]);
      }
      // Skip flag that takes a value (-X foo, -OO, etc.)
      if (token.length === 2 && token !== "-c") {
        i += 2; // skip flag and its value
        continue;
      }
      if (token.startsWith("-c")) {
        // -cfoo (attached), rare but possible
        return stripOuterQuotes(token.slice(2));
      }
      i++; // boolean flag or unknown
      continue;
    }

    // Not a flag — this shouldn't happen for `python -c` but handle gracefully
    break;
  }

  return null;
}

/** Strip one matching pair of outer single or double quotes. */
function stripOuterQuotes(s: string): string {
  if (s.length < 2) return s;
  const first = s[0];
  const last = s[s.length - 1];
  if ((first === "'" || first === '"') && first === last) {
    return s.slice(1, -1);
  }
  return s;
}

// ─── Line counting ───────────────────────────────────────────────────────────

/**
 * Count logical lines in the Python code string.
 * Base heuristic: split on both literal `\n` and actual newlines.
 *
 * This is intentionally a simple heuristic — it may overcount lines
 * if \n appears inside a Python string literal, but that's a conservative
 * choice that errs on the side of blocking risky inline code.
 */
function countLines(code: string): number {
  if (code.length === 0) return 0;
  // Replace literal \n escape sequences with actual newlines, then split
  const normalized = code.replace(/\\n/g, "\n");
  return normalized.split("\n").length;
}

// ─── Extension entry point ───────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event) => {
    if (event.toolName !== "bash") return;

    const input = event.input as { command?: string };
    const command = input.command?.trim() ?? "";
    if (!command) return;

    const segments = splitSegments(command);

    for (const segment of segments) {
      const tokens = tokenize(segment);
      if (!tokens) continue; // malformed quoting — let bash handle it

      const code = extractPythonCode(tokens);
      if (code === null) continue; // not a python -c invocation

      const lines = countLines(code);

      if (lines > MAX_LINES) {
        return {
          block: true,
          reason: `Inline Python execution blocked (\`python -c\` with ${lines} lines). Write code longer than ${MAX_LINES} lines to a .py file and run it with \`python <file>\` instead.`,
        };
      }
      // Allow ≤ MAX_LINES — no return needed, continue checking other segments
    }
  });
}
