/**
 * 志怪异闻 — Pi TUI Extension
 *
 * Decorates the Pi terminal UI in the style of Chinese 志怪小说:
 *   搜神记 (干宝) · 稽神录 (徐铉) · 聊斋志异 (蒲松龄)
 *
 * Features:
 *   - Two themes: 古卷 (aged manuscript) and 水墨 (ink-wash painting)
 *   - Elaborate ASCII-art headers with 3 rotating atmospheric scenes
 *   - Ghost-fire (狐火) flickering working indicator
 *   - Rotating footer with authentic 志怪 quotes
 *   - Decorative widget line with classical couplets
 *   - /zhiguai command to toggle, switch styles, and cycle scenes
 *
 * Usage:
 *   /zhiguai manuscript  — 古卷风格 (aged manuscript)
 *   /zhiguai inkwash     — 水墨风格 (ink-wash painting)
 *   /zhiguai off         — 关闭 (turn off)
 *   /zhiguai             — toggle on / show current status
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import path from "node:path";
import { getRandomQuote } from "./quotes";

// ─── Types ────────────────────────────────────────────────────────────────────
type ThemeVariant = "manuscript" | "inkwash" | "nightwalk";

// ─── ANSI Color Helpers ───────────────────────────────────────────────────────
const RESET = "\x1b[39m";
function fn(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}
function c(text: string, color: string): string {
  return color + text + RESET;
}

// ─── Ghost Fire Working Indicator ─────────────────────────────────────────────
const GHOST_FIRE_MANUSCRIPT: string[] = [
  c("燚", fn(212, 164, 74)),
  c("焱", fn(196, 160, 90)),
  c("火", fn(180, 140, 60)),
  c("·", fn(107, 123, 107)),
  c("火", fn(180, 140, 60)),
  c("焱", fn(196, 160, 90)),
  c("燚", fn(212, 164, 74)),
  c("焱", fn(196, 160, 90)),
];

const GHOST_FIRE_INKWASH: string[] = [
  c("燚", fn(139, 164, 200)),
  c("焱", fn(155, 176, 208)),
  c("火", fn(106, 128, 160)),
  c("·", fn(58, 64, 72)),
  c("火", fn(106, 128, 160)),
  c("焱", fn(155, 176, 208)),
  c("燚", fn(139, 164, 200)),
  c("焱", fn(155, 176, 208)),
];

const GHOST_FIRE_NIGHTWALK: string[] = [
  c("燚", fn(123, 224, 200)),
  c("焱", fn(91, 200, 168)),
  c("火", fn(74, 160, 128)),
  c("·", fn(58, 72, 80)),
  c("火", fn(74, 160, 128)),
  c("焱", fn(91, 200, 168)),
  c("燚", fn(123, 224, 200)),
  c("焱", fn(91, 200, 168)),
];

function getGhostFireFrames(variant: ThemeVariant): string[] {
  switch (variant) {
    case "manuscript": return GHOST_FIRE_MANUSCRIPT;
    case "inkwash":   return GHOST_FIRE_INKWASH;
    default:          return GHOST_FIRE_NIGHTWALK;
  }
}

// ─── Terminal Titles ──────────────────────────────────────────────────────────
const TITLES: Record<ThemeVariant, string> = {
  manuscript: "π · 志怪异闻 · 古卷",
  inkwash: "π · 志怪异闻 · 水墨",
  nightwalk: "π · 志怪异闻 · 夜行",
};

// ─── Visible-String Length (strip ANSI) ───────────────────────────────────────
function visibleLen(str: string): number {
  return str.replace(/\x1b\[[0-9;]*m/g, "").length;
}

// ─── Header Scenes ────────────────────────────────────────────────────────────
//
// Three elaborate ASCII-art scenes, each available in warm (manuscript) and
// cool (ink-wash) color palettes.  Scenes rotate every ~25 seconds.

interface HeaderColors {
  A: string; // accent (gold / ghost-blue)
  D: string; // dim (faded-ink / fog)
  B: string; // bright (bright-gold / bright-ghost)
  R: string; // red (vermillion — only on manuscript; on ink-wash it maps to accent)
}

function manuscriptColors(): HeaderColors {
  return {
    A: fn(196, 164, 90),   // aged gold
    D: fn(107, 123, 107),  // faded ink green-grey
    B: fn(212, 164, 74),   // bright amber-gold
    R: fn(192, 64, 64),    // vermillion red
  };
}

function inkwashColors(): HeaderColors {
  return {
    A: fn(139, 164, 200),  // ghost blue
    D: fn(106, 112, 120),  // fog grey
    B: fn(155, 176, 208),  // bright ghost
    R: fn(180, 122, 122),  // pale crimson
  };
}

function nightwalkColors(): HeaderColors {
  return {
    A: fn(123, 224, 200),  // phosphorescent ghost-green
    D: fn(90, 100, 115),   // deep night grey
    B: fn(139, 232, 208),  // bright ghost fire
    R: fn(160, 80, 80),    // dark blood red
  };
}

function colorsFor(variant: ThemeVariant): HeaderColors {
  switch (variant) {
    case "manuscript": return manuscriptColors();
    case "inkwash":   return inkwashColors();
    default:          return nightwalkColors();
  }
}

/** Scene A: 月下孤墳 — Lonely Grave Under the Moon */
function headerSceneA(colors: HeaderColors): string[] {
  const { A, D, B, R } = colors;
  return [
    "",
    `                              ${c("☽", B)}`,
    `                   ${c("·", D)}   ${c("*", B)}       ${c("*", A)}   ${c("·", D)}`,
    `               ${c("·", A)}      ${c("*", D)}  ${c("狐", R)}  ${c("火", B)}  ${c("*", A)}      ${c("·", D)}`,
    `                      ${c("*", B)}    ${c("·", A)}    ${c("*", D)}`,
    `       ${c("╔═══════════ 志 怪 異 聞 ═══════════╗", A)}`,
    `       ${c("║", A)}    ${c("搜神記", R)}  ${c("·", D)}  ${c("稽神錄", B)}  ${c("·", D)}  ${c("聊齋", R)}    ${c("║", A)}`,
    `       ${c("╚═══════════════════════════════════╝", A)}`,
    `           ${c("狐燈夜照孤墳冷    ", D)}${c("古木蒼煙鬼語幽", A)}`,
    "",
  ];
}

/** Scene B: 深山古寺 — Ancient Temple in Deep Mountains */
function headerSceneB(colors: HeaderColors): string[] {
  const { A, D, B, R } = colors;
  return [
    "",
    `                 ${c("╱╲", D)}      ${c("╱╲", A)}      ${c("╱╲", D)}`,
    `               ${c("╱", A)}    ${c("╲", D)}  ${c("╱", B)}    ${c("╲", A)}  ${c("╱", D)}    ${c("╲", B)}`,
    `             ${c("╱", B)}        ${c("╲", A)}${c("╱", D)}        ${c("╲", B)}${c("╱", A)}      ${c("╲", D)}`,
    `             ${c("╲", D)}        ${c("╱", B)}${c("╲", A)}        ${c("╱", D)}${c("╲", B)}      ${c("╱", A)}`,
    `               ${c("╲", A)}    ${c("╱", D)}    ${c("╲", B)}    ${c("╱", A)}    ${c("╲", D)}    ${c("╱", B)}`,
    `                 ${c("╲╱", B)}        ${c("╲╱", D)}        ${c("╲╱", A)}`,
    `      ${c("~ ~ ~ ~ ~", D)}${c(" 雲深不知處 ", A)}${c("~ ~ ~ ~ ~", D)}`,
    `       ${c("╔═══════════ 志 怪 異 聞 ═══════════╗", A)}`,
    `       ${c("║", A)}    ${c("搜神記", R)}  ${c("·", D)}  ${c("稽神錄", B)}  ${c("·", D)}  ${c("聊齋", R)}    ${c("║", A)}`,
    `       ${c("╚═══════════════════════════════════╝", A)}`,
    `           ${c("夜半鐘聲到客船    ", D)}${c("深山古寺鬼談禪", B)}`,
    "",
  ];
}

/** Scene C: 狐仙夜訪 — Fox Spirit's Night Visit */
function headerSceneC(colors: HeaderColors): string[] {
  const { A, D, B, R } = colors;
  return [
    "",
    `           ${c("░", D)}      ${c("·", A)}  ${c("·", D)}  ${c("·", B)}      ${c("░", D)}`,
    `         ${c("░░░", A)}    ${c("·", D)}   ${c("☽", B)}   ${c("·", A)}    ${c("░░░", D)}`,
    `           ${c("░", B)}   ${c("·", D)}    ${c("·", A)}    ${c("·", B)}   ${c("░", D)}`,
    `              ${c("·", A)}   ${c("·", D)}   ${c("·", B)}   ${c("·", A)}`,
    `        ${c("╭───────────────────────╮", A)}`,
    `        ${c("│", A)}     ${c("簾 外 有 影 徘 徊", B)}     ${c("│", A)}`,
    `        ${c("╰───────────────────────╯", A)}`,
    `       ${c("╔═══════════ 志 怪 異 聞 ═══════════╗", A)}`,
    `       ${c("║", A)}    ${c("搜神記", R)}  ${c("·", D)}  ${c("稽神錄", B)}  ${c("·", D)}  ${c("聊齋", R)}    ${c("║", A)}`,
    `       ${c("╚═══════════════════════════════════╝", A)}`,
    `           ${c("更深月色半人家    ", D)}${c("狐影臨窗叩夜門", R)}`,
    "",
  ];
}

/** Scene D: 荒村鬼火 — Ghost Fire in a Deserted Village */
function headerSceneD(colors: HeaderColors): string[] {
  const { A, D, B, R } = colors;
  return [
    "",
    `                       ${c("☽", B)}`,
    `              ${c("·", D)}  ${c("·", A)}  ${c("·", D)}  ${c("·", B)}  ${c("·", D)}`,
    `           ${c("·", A)}    ${c("·", D)}    ${c("·", B)}    ${c("·", A)}`,
    `              ${c("鬼", R)}     ${c("火", B)}`,
    `           ${c("╱▔▔╲", D)}  ${c("╱▔▔╲", A)}  ${c("╱▔▔╲", D)}`,
    `          ${c("╱", A)}    ${c("╲", D)}${c("╱", B)}    ${c("╲", A)}${c("╱", D)}    ${c("╲", B)}`,
    `         ${c("│", A)}   ${c("荒", R)}  ${c("村", B)}  ${c("夜", A)}  ${c("半", R)}  ${c("│", D)}`,
    `          ${c("╲", B)}    ${c("╱", A)}${c("╲", D)}    ${c("╱", B)}${c("╲", A)}    ${c("╱", D)}`,
    `           ${c("╲╱", A)}  ${c("╲╱", D)}  ${c("╲╱", B)}`,
    `      ${c("~ ~", D)}${c(" 鬼火明滅荒村寂 ", A)}${c("~ ~", D)}`,
    `       ${c("╔═══════════ 志 怪 異 聞 ═══════════╗", A)}`,
    `       ${c("║", A)}    ${c("搜神記", R)}  ${c("·", D)}  ${c("稽神錄", B)}  ${c("·", D)}  ${c("聊齋", R)}    ${c("║", A)}`,
    `       ${c("╚═══════════════════════════════════╝", A)}`,
    `           ${c("鬼火明滅荒村寂    ", D)}${c("夜半孤燈照無眠", B)}`,
    "",
  ];
}

/** Scene E: 遠山飛霧 — Distant Mountains Through Flying Mist */
function headerSceneE(colors: HeaderColors): string[] {
  const { A, D, B, R } = colors;
  return [
    "",
    `              ${c("╱╲", D)}        ${c("╱╲", A)}`,
    `            ${c("╱", A)}    ${c("╲", D)}    ${c("╱", B)}    ${c("╲", A)}`,
    `          ${c("╱", B)}        ${c("╲", A)}${c("╱", D)}        ${c("╲", B)}`,
    `    ${c("~ ~ ~ ~ ~", D)}${c(" 雲深不知處 ", A)}${c("~ ~ ~ ~ ~", D)}`,
    `  ${c("~ ~", A)}${c(" 飛霧如紗掩孤峰 ", B)}${c("~ ~", D)}`,
    `    ${c("~ ~ ~ ~ ~", A)}${c(" 山在虛無縹緲間 ", D)}${c("~ ~ ~ ~ ~", B)}`,
    `       ${c("╔═══════════ 志 怪 異 聞 ═══════════╗", A)}`,
    `       ${c("║", A)}    ${c("搜神記", R)}  ${c("·", D)}  ${c("稽神錄", B)}  ${c("·", D)}  ${c("聊齋", R)}    ${c("║", A)}`,
    `       ${c("╚═══════════════════════════════════╝", A)}`,
    `           ${c("遠山含黛雲霧繞    ", D)}${c("飛霧如紗掩孤峰", B)}`,
    "",
  ];
}

/** Scene F: 狐火夜行 — Fox-Fire Night Journey */
function headerSceneF(colors: HeaderColors): string[] {
  const { A, D, B, R } = colors;
  return [
    "",
    `           ${c("·", D)}   ${c("*", B)}   ${c("·", A)}   ${c("*", D)}   ${c("·", B)}`,
    `         ${c("·", A)}   ${c("*", D)}   ${c("·", B)}   ${c("*", A)}   ${c("·", D)}   ${c("*", B)}`,
    `           ${c("·", B)}   ${c("*", A)}   ${c("狐", R)}   ${c("火", B)}   ${c("*", D)}   ${c("·", A)}`,
    `         ${c("░", D)}${c("░", A)}${c("░", D)}  ${c("░", B)}${c("░", A)}${c("░", D)}  ${c("░", A)}${c("░", B)}${c("░", D)}  ${c("░", B)}${c("░", A)}${c("░", D)}`,
    `        ${c("░", A)}${c("░", B)}${c("░", A)}${c("░", D)}${c("░", B)}${c("░", A)}${c("░", D)}${c("░", B)}${c("░", A)}${c("░", D)}${c("░", A)}${c("░", B)}${c("░", D)}`,
    `       ${c("░", D)}${c("░", A)}  ${c("狐", R)}  ${c("火", B)}  ${c("夜", A)}  ${c("行", R)}  ${c("░", B)}${c("░", D)}`,
    `        ${c("░", A)}${c("░", B)}${c("░", D)}${c("░", A)}${c("░", B)}${c("░", D)}${c("░", A)}${c("░", B)}${c("░", D)}${c("░", A)}${c("░", B)}${c("░", D)}${c("░", A)}${c("░", B)}`,
    `       ${c("╔═══════════ 志 怪 異 聞 ═══════════╗", A)}`,
    `       ${c("║", A)}    ${c("搜神記", R)}  ${c("·", D)}  ${c("稽神錄", B)}  ${c("·", D)}  ${c("聊齋", R)}    ${c("║", A)}`,
    `       ${c("╚═══════════════════════════════════╝", A)}`,
    `           ${c("深夜獨行狐引路    ", D)}${c("磷火為燈照歸途", B)}`,
    "",
  ];
}

type HeaderSceneFn = (colors: HeaderColors) => string[];
const HEADER_SCENES: HeaderSceneFn[] = [
  headerSceneA, headerSceneB, headerSceneC,
  headerSceneD, headerSceneE, headerSceneF,
];

// ─── Widget Factory: Atmospheric Couplet + Rotating 志怪 Quote ───────────────
//
// Two-line widget shown above the editor.  Line 1 is a static atmospheric
// couplet; line 2 is a rotating 志怪 quote that refreshes every 10 s.
// The timer is tracked at module level so removeAll() can clear it.

let widgetQuoteTimer: ReturnType<typeof setInterval> | null = null;

function createWidgetFactory(variant: ThemeVariant) {
  const col = colorsFor(variant);
  let currentQuote = getRandomQuote();

  return (tui: any, _theme: any) => {
    // Clear any previous timer before starting a new one
    if (widgetQuoteTimer) clearInterval(widgetQuoteTimer);
    widgetQuoteTimer = setInterval(() => {
      currentQuote = getRandomQuote();
      tui.requestRender();
    }, 10_000);

    const couplet =
      variant === "manuscript"
        ? `${c("◆", col.R)} ${c("狐火明滅", col.B)} ${c("·", col.D)} ${c("鬼語幽微", col.A)} ${c("·", col.D)} ${c("夜深人靜", col.B)} ${c("◆", col.R)}`
        : variant === "inkwash"
          ? `${c("◇", col.B)} ${c("煙鎖重樓", col.A)} ${c("·", col.D)} ${c("霧失樓臺", col.B)} ${c("·", col.D)} ${c("月迷津渡", col.A)} ${c("◇", col.B)}`
          : `${c("◈", col.B)} ${c("鬼火飛螢", col.A)} ${c("·", col.D)} ${c("荒村寂寂", col.B)} ${c("·", col.D)} ${c("遠山如魅", col.A)} ${c("◈", col.B)}`;

    return {
      render(width: number): string[] {
        const quoteLine = `${c("【", col.A)}${c(currentQuote.source, col.B)}${c("】", col.A)} ${c(currentQuote.text, col.D)}`;
        // Truncate both lines to fit within terminal width
        return [couplet, quoteLine].map((line) => {
          if (visibleWidth(line) > width) {
            return truncateToWidth(line, width, "…", false);
          }
          return line;
        });
      },
      invalidate() {},
    };
  };
}

// ─── Main Extension ──────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  let variant: ThemeVariant = "manuscript";
  let enabled = false;

  // ── Register theme paths via resources_discover ──
  pi.on("resources_discover", async (event, _ctx) => {
    if (event.reason === "startup" || event.reason === "reload") {
      return {
        themePaths: [path.join(__dirname, "themes")],
      };
    }
  });

  // ── Theme save/restore ──
  // We snapshot the active theme before switching to zhiguai so we can restore
  // it when decorations are turned off.
  let savedTheme: string | null = null;

  // ── Apply all TUI decorations ──
  function applyAll(ctx: ExtensionContext) {
    if (!enabled) return;

    // Save currently active theme before overriding (first time only)
    if (savedTheme === null) {
      const allThemes = ctx.ui.getAllThemes?.() ?? [];
      // Heuristic: dark is the built-in default for dark terminals
      savedTheme = allThemes.some((t: { name: string }) => t.name === "dark")
        ? "dark"
        : "light";
    }

    const themeName = `zhiguai-${variant}`;
    ctx.ui.setTheme(themeName);

    // Header scenes are now shown as a widget below the editor so they don't
    // scroll away.  The built-in Pi header stays clean.

    // Scene widget below editor (stays near the bottom, doesn't scroll away)
    ctx.ui.setWidget("zhiguai-scene", (tui: any, _theme: any) => {
      const col = colorsFor(variant);
      let sceneIdx = Math.floor(Math.random() * HEADER_SCENES.length);
      const timer = setInterval(() => {
        sceneIdx = (sceneIdx + 1) % HEADER_SCENES.length;
        tui.requestRender();
      }, 25_000);

      return {
        render(_width: number): string[] {
          return HEADER_SCENES[sceneIdx]!(col);
        },
        invalidate() {},
        dispose() {
          clearInterval(timer);
        },
      };
    }, { placement: "belowEditor" });

    // Ghost-fire working indicator
    ctx.ui.setWorkingIndicator({
      frames: getGhostFireFrames(variant),
      intervalMs: 120,
    });

    // Status line in footer
    const statusLabel =
      variant === "manuscript"
        ? c("志", fn(192, 64, 64)) + c("怪", fn(196, 164, 90)) + c("異", fn(212, 164, 74)) + c("聞 · 古卷", fn(107, 123, 107))
        : variant === "inkwash"
          ? c("志", fn(123, 158, 196)) + c("怪", fn(139, 164, 200)) + c("異", fn(155, 176, 208)) + c("聞 · 水墨", fn(106, 112, 120))
          : c("志", fn(123, 224, 200)) + c("怪", fn(91, 200, 168)) + c("異", fn(139, 232, 208)) + c("聞 · 夜行", fn(90, 100, 115));
    ctx.ui.setStatus("zhiguai", statusLabel);

    // Decorative widget above editor
    ctx.ui.setWidget("zhiguai", createWidgetFactory(variant));

    // Terminal title
    ctx.ui.setTitle(TITLES[variant]);
  }

  // ── Remove all TUI decorations ──
  function removeAll(ctx: ExtensionContext) {
    ctx.ui.setWidget("zhiguai-scene", undefined);
    if (widgetQuoteTimer) {
      clearInterval(widgetQuoteTimer);
      widgetQuoteTimer = null;
    }
    ctx.ui.setWorkingIndicator();
    ctx.ui.setStatus("zhiguai", undefined);
    ctx.ui.setWidget("zhiguai", undefined);
    ctx.ui.setTitle("π");

    // Restore the theme that was active before zhiguai
    if (savedTheme) {
      ctx.ui.setTheme(savedTheme);
      savedTheme = null;
    }
  }

  // ── /zhiguai command ──
  // Inline args for quick toggling; bare /zhiguai opens an interactive menu.
  pi.registerCommand("zhiguai", {
    description: "志怪异闻主题切换：manuscript（古卷）| inkwash（水墨）| nightwalk（夜行）| off（关闭）",
    handler: async (args, ctx) => {
      const arg = args.trim().toLowerCase();

      // ── Inline quick-toggle (still works for power users) ──
      if (arg === "off" || arg === "关闭") {
        enabled = false;
        removeAll(ctx);
        ctx.ui.notify("志怪异闻已关闭", "info");
        return;
      }
      if (arg === "manuscript" || arg === "古卷" || arg === "手稿") {
        enabled = true;
        variant = "manuscript";
        applyAll(ctx);
        ctx.ui.notify("志怪异闻 · 古卷风格已启用", "info");
        return;
      }
      if (arg === "inkwash" || arg === "水墨" || arg === "墨") {
        enabled = true;
        variant = "inkwash";
        applyAll(ctx);
        ctx.ui.notify("志怪异闻 · 水墨风格已启用", "info");
        return;
      }
      if (arg === "nightwalk" || arg === "夜行" || arg === "鬼火" || arg === "荒村") {
        enabled = true;
        variant = "nightwalk";
        applyAll(ctx);
        ctx.ui.notify("志怪异闻 · 夜行风格已启用", "info");
        return;
      }

      // ── Interactive settings dialog ──
      const currentLabel = enabled
        ? variant === "manuscript"
          ? "古卷"
          : variant === "inkwash"
            ? "水墨"
            : "夜行"
        : "关闭";

      const result = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
        const items: SelectItem[] = [
          {
            value: "manuscript",
            label: "古卷风格",
            description: "Aged manuscript — 暖色古卷，朱砂印泥，燭光紙色",
          },
          {
            value: "inkwash",
            label: "水墨风格",
            description: "Ink-wash painting — 冷調水墨，雲霧繚繞，月色朦朧",
          },
          {
            value: "nightwalk",
            label: "夜行风格",
            description: "Night journey — 鬼火飛螢，荒村寂寂，遠山如魅",
          },
          {
            value: "off",
            label: "关闭志怪异闻",
            description: "Turn off all decorations — 恢復默認界面",
          },
        ];

        const container = new Container();

        // Top border
        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

        // Title
        container.addChild(new Text(theme.fg("accent", theme.bold(" 志 怪 異 聞 ")), 1, 0));
        container.addChild(
          new Text(
            theme.fg("muted", ` 當前：${currentLabel}  ·  搜神記 · 稽神錄 · 聊齋志異`),
            1,
            0,
          ),
        );

        // SelectList
        const selectList = new SelectList(items, Math.min(items.length, 8), {
          selectedPrefix: (t: string) => theme.fg("accent", t),
          selectedText: (t: string) => theme.fg("accent", t),
          description: (t: string) => theme.fg("muted", t),
          scrollInfo: (t: string) => theme.fg("dim", t),
          noMatch: (t: string) => theme.fg("warning", t),
        });
        selectList.onSelect = (item) => done(item.value);
        selectList.onCancel = () => done(null);
        container.addChild(selectList);

        // Help text
        container.addChild(
          new Text(theme.fg("dim", " ↑↓ 導航  ·  enter 選擇  ·  esc 取消"), 1, 0),
        );

        // Bottom border
        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

        return {
          render: (w: number) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data: string) => {
            selectList.handleInput(data);
            tui.requestRender();
          },
        };
      });

      // ── Handle the selection ──
      if (result === null) {
        // User cancelled (esc)
        return;
      }
      if (result === "off") {
        enabled = false;
        removeAll(ctx);
        ctx.ui.notify("志怪异闻已关闭", "info");
        return;
      }
      if (result === "manuscript" || result === "inkwash" || result === "nightwalk") {
        enabled = true;
        variant = result;
        const label = result === "manuscript" ? "古卷" : result === "inkwash" ? "水墨" : "夜行";
        applyAll(ctx);
        ctx.ui.notify(`志怪异闻 · ${label}风格已启用`, "info");
        return;
      }
    },
  });

  // ── Re-apply decorations when a new session starts ──
  pi.on("session_start", async (_event, ctx) => {
    if (enabled) applyAll(ctx);
  });

  // ── Clean up when session shuts down ──
  pi.on("session_shutdown", async (_event, ctx) => {
    removeAll(ctx);
  });
}
