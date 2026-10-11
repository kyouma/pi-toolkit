# pi-toolkit

Extensions, skills, and prompts for [pi coding agent](https://github.com/earendil-works/pi-coding-agent).

## What's inside

> **Note:** This repo is a mixed bag of polished and experimental components.
> Only the items marked **✓ polished** below are production-ready.
> This repo is a collection of independent items — take what you want,
> nothing pulls in the unfinished components.
>
> **Polished items (take these):**
>
> ```bash
> # internet-search — standalone Pi package (own repo, see packages/internet-search):
> pi install git:github.com/kyouma/pi-internet-search
>
> # Other extensions → ~/.pi/agent/extensions/
> cp extensions/no-inline-python.ts ~/.pi/agent/extensions/
>
> # Skills → ~/.pi/agent/skills/
> cp -r skills/literature-survey ~/.pi/agent/skills/
>
> # System prompt append → ~/.pi/agent/
> cp APPEND_SYSTEM.md ~/.pi/agent/
> ```

### Extensions

| Extension | Tool | Description |
|---|---|---|
| `internet-search` ✓ | `internet_search` | Web search (Exa → Tavily → Brave → DuckDuckGo fallback) — package: [`kyouma/pi-internet-search`](https://github.com/kyouma/pi-internet-search) (moved to its own repo, see `packages/internet-search`) |
| | `academic_search` | Academic search (arXiv + OpenAlex + CrossRef) |
| | `code_search` | GitHub repository search |
| | `web_fetch` | Fetch URL content (HTML text or file download) |
| `no-inline-python` ✓ | — | Blocks inline Python scripts in bash commands |
| `no-unsolicited-modifications` | — | Prevents unsolicited file modifications |
| `read-pdf` | `read_pdf` | Extract text & math from PDFs as Markdown+LaTeX |
| `zhiguai` | — | TUI themes inspired by Chinese 志怪小说 (搜神记 · 稽神录 · 聊斋志异) |

### Skills

| Skill | Purpose |
|---|---|
| `literature-survey` ✓ | Systematic literature survey with PRISMA synthesis |
| `markdown-to-pdf` | Compile Markdown + LaTeX math to A4 PDF via Pandoc |
| `research-assistant` | Full research workflow: survey → prototype → experiment → publish |
| `research-frontier-prospecting` | Prospect a research (sub)field and produce validated, auditable project task definitions with gates, floors and withdrawal checks — not a literature survey |
| `symbolic-computation` | Symbolic math with SymPy (algebra, calculus, ODEs, PDEs) |

### System prompt append

✓ **Polished.** Copy `APPEND_SYSTEM.md` into `~/.pi/agent/` to prevent unsolicited file modifications:

```bash
cp APPEND_SYSTEM.md ~/.pi/agent/
```

## Useful third-party extensions

Extensions written by other authors that work well alongside this toolkit.
They are **not** part of this repository — install them from their own
sources and review their licenses and requirements.

| Extension | Author | Description |
|---|---|---|
| [`pi-tool-display`](https://github.com/MasuRii/pi-tool-display) | [MasuRii](https://github.com/MasuRii) | Compact tool-call rendering, adaptive edit/write diffs, output truncation, thinking labels, and an optional native user prompt box for a cleaner TUI. Three presets: `opencode`, `balanced`, `verbose`. |
| [`pi-web-access`](https://github.com/nicobailon/pi-web-access) | [Nico Bailon](https://github.com/nicobailon) | Web search across 20+ providers, URL fetching, GitHub repo cloning, PDF extraction, and YouTube/local video understanding (`web_search`, `source_check`, `fetch_content`). Its `web_search` tool is why this toolkit's extension registers as `internet_search` — both can be installed side by side without a name collision. |
| [`pi-docparser`](https://github.com/maxedapps/pi-docparser) | [maxedapps](https://github.com/maxedapps) | Local document understanding powered by LiteParse v2: parse, phrase-search with bounding boxes, and screenshot pages of PDFs, DOCX, PPTX, XLSX, CSV, and images (`document_parse`, `document_search`, `document_screenshot`), plus a companion skill. |

```bash
pi install npm:pi-tool-display
# or
pi install git:github.com/MasuRii/pi-tool-display

pi install npm:pi-web-access
pi install npm:pi-docparser
```

After installing `pi-tool-display`, open its settings with `/tool-display`.

## Install

This repo is a collection of independent items — there is no all-in-one
installation. Take what you want (see "What's inside" above).

`internet-search` is a proper Pi package with declared dependencies, living in
its own repo ([kyouma/pi-internet-search](https://github.com/kyouma/pi-internet-search)):

```bash
pi install git:github.com/kyouma/pi-internet-search
```

Or try it without installing:

```bash
pi -e git:github.com/kyouma/pi-internet-search
```

The other items are plain files and directories — copy them into your Pi
folders (`~/.pi/agent/extensions/`, `~/.pi/agent/skills/`, `~/.pi/agent/`).

### Usage

#### zhiguai

```
/zhiguai manuscript  — 古卷风格 (aged manuscript)
/zhiguai inkwash     — 水墨风格 (ink-wash painting)
/zhiguai nightwalk   — 夜行风格 (ghost-fire night journey)
/zhiguai off         — 关闭 (turn off)
/zhiguai             — interactive menu
```

## Dependencies

- **read_pdf**: requires `python3`, `pdfminer.six` (`pip install pdfminer.six`), and optionally `mutool` (`sudo apt install mupdf-tools`) for page-range extraction
- **markdown-to-pdf**: requires Pandoc + LuaLaTeX
- **symbolic-computation**: requires SymPy (`pip install sympy`)
- **internet-search** (optional): Tavily/Brave API keys in `~/.pi/agent/internet-search.json` (`"tavilyApiKey"`, `"braveApiKey"`) or the `TAVILY_API_KEY`/`BRAVE_API_KEY` env vars (env wins). Without keys, `internet_search` falls back to free Exa and DuckDuckGo.
