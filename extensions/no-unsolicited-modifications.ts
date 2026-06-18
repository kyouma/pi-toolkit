/**
 * no-unsolicited-modifications — Pi Extension
 *
 * Enforces the "No Unsolicited Modifications" rule at the tool level.
 * Intercepts write, edit, and destructive bash calls before execution,
 * prompting the user with "allow this action" / "allow all" / "block".
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

let writeAllAllowed = false;
let editAllAllowed = false;
let bashAllAllowed = false;

function splitSegments(command: string): string[] {
  const segments: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let i = 0;
  while (i < command.length) {
    const ch = command[i];
    if (escaped) { current += ch; escaped = false; i++; continue; }
    if (ch === "\\") { current += ch; escaped = true; i++; continue; }
    if (ch === "'" && !inDouble) { inSingle = !inSingle; current += ch; i++; continue; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; current += ch; i++; continue; }
    if (inSingle || inDouble) { current += ch; i++; continue; }
    if (ch === ";" || ch === "\n") {
      const t = current.trim(); if (t) segments.push(t); current = ""; i++; continue;
    }
    if (ch === "|") {
      const t = current.trim(); if (t) segments.push(t); current = "";
      i++; if (i < command.length && command[i] === "|") i++; continue;
    }
    if (ch === "&" && i + 1 < command.length && command[i + 1] === "&") {
      const t = current.trim(); if (t) segments.push(t); current = ""; i += 2; continue;
    }
    current += ch; i++;
  }
  const final = current.trim();
  if (final) segments.push(final);
  return segments;
}

function stripEnvVars(tokens: string[]): string[] {
  let i = 0;
  while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++;
  return tokens.slice(i);
}

function normalizeExe(token: string): string {
  const s = token.lastIndexOf("/");
  return s >= 0 ? token.slice(s + 1) : token;
}

const destructiveFirstToken = new Set([
  "rm", "mv", "cp", "touch", "mkdir",
  "chmod", "chown", "truncate", "tee",
]);

const destructiveSubcommands: string[][] = [
  ["git", "push"],
  ["pip", "install"], ["pip3", "install"],
  ["python", "-m", "pip", "install"],
  ["python3", "-m", "pip", "install"],
  ["npm", "install"], ["npm", "uninstall"],
  ["yarn", "add"], ["gem", "install"], ["cargo", "install"],
];

function isBashDestructive(command: string): boolean {
  const segments = splitSegments(command);
  for (const seg of segments) {
    const rawTokens = seg.split(/\s+/).filter((t) => t.length > 0);
    if (rawTokens.length === 0) continue;
    const tokens = stripEnvVars(rawTokens);
    if (tokens.length === 0) continue;
    const exe = normalizeExe(tokens[0]);
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === ">" || tokens[i] === ">>" || tokens[i] === ">|") return true;
    }
    if (destructiveFirstToken.has(exe)) {
      if (exe === "sed") {
        const hasInPlace = tokens.some(
          (t) => t === "-i" || t === "--in-place" || /^-[A-Za-z]*i/.test(t),
        );
        if (!hasInPlace) continue;
      }
      return true;
    }
    for (const sub of destructiveSubcommands) {
      if (tokens.length < sub.length) continue;
      let match = true;
      for (let j = 0; j < sub.length; j++) {
        if (normalizeExe(tokens[j]) !== sub[j]) { match = false; break; }
      }
      if (match) return true;
    }
  }
  return false;
}

type SelectOptions = string[];

async function promptAllowDeny(
  ctx: Parameters<Parameters<ExtensionAPI["on"]>[1]>[1],
  actionKind: string,
): Promise<"allow" | "allow-all" | "block"> {
  if (!ctx.hasUI) return "allow";
  const options: SelectOptions = [
    "Allow this " + actionKind,
    "Allow all " + actionKind + "s (this session)",
    "Block",
  ];
  const choice = await ctx.ui.select("Allow " + actionKind + "?", options);
  if (!choice || choice === "Block") return "block";
  if (choice.startsWith("Allow all")) return "allow-all";
  return "allow";
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    writeAllAllowed = false;
    editAllAllowed = false;
    bashAllAllowed = false;
  });

  pi.registerCommand("allow-modifications", {
    description: "Allow all file modifications for this session.",
    handler: async (_args, ctx) => {
      writeAllAllowed = true; editAllAllowed = true; bashAllAllowed = true;
      ctx.ui.notify("All modifications allowed for this session.", "info");
    },
  });

  pi.registerCommand("allow-writes", {
    description: "Allow all writes for this session.",
    handler: async (_args, ctx) => {
      writeAllAllowed = true;
      ctx.ui.notify("All writes allowed for this session.", "info");
    },
  });

  pi.registerCommand("allow-edits", {
    description: "Allow all edits for this session.",
    handler: async (_args, ctx) => {
      editAllAllowed = true;
      ctx.ui.notify("All edits allowed for this session.", "info");
    },
  });

  pi.registerCommand("allow-bash", {
    description: "Allow all destructive bash commands for this session.",
    handler: async (_args, ctx) => {
      bashAllAllowed = true;
      ctx.ui.notify("All destructive bash commands allowed for this session.", "info");
    },
  });

  pi.on("tool_call", async (event, ctx) => {
    const toolName = event.toolName;

    if (toolName === "write") {
      if (writeAllAllowed) return;
      const decision = await promptAllowDeny(ctx, "write");
      if (decision === "block") {
        return { block: true, reason: "Write blocked. Run /allow-writes or /allow-modifications to permit." };
      }
      if (decision === "allow-all") writeAllAllowed = true;
      return;
    }

    if (toolName === "edit") {
      if (editAllAllowed) return;
      const decision = await promptAllowDeny(ctx, "edit");
      if (decision === "block") {
        return { block: true, reason: "Edit blocked. Run /allow-edits or /allow-modifications to permit." };
      }
      if (decision === "allow-all") editAllAllowed = true;
      return;
    }

    if (toolName === "bash") {
      if (bashAllAllowed) return;
      const input = event.input as { command?: string };
      const command = input.command?.trim() ?? "";
      if (!command) return;
      if (!isBashDestructive(command)) return;
      const decision = await promptAllowDeny(ctx, "command");
      if (decision === "block") {
        return { block: true, reason: "Command blocked. Run /allow-bash or /allow-modifications to permit." };
      }
      if (decision === "allow-all") bashAllAllowed = true;
      return;
    }
  });
}