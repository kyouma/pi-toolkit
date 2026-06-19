# pi-toolkit

Extensions, skills, and prompts for [pi coding agent](https://github.com/earendil-works/pi-coding-agent).

## What's inside

> **Note:** This repo is a mixed bag of polished and experimental components.
> Only the items marked **✓ polished** below are production-ready.
> For those, copy them directly into your Pi folders rather than
> installing the whole package — that way you avoid pulling in unfinished
> extensions alongside them.
>
> **Polished items (copy these individually):**
>
> ```bash
> # Extensions → ~/.pi/agent/extensions/
> cp extensions/web-search.ts ~/.pi/agent/extensions/
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
| `web-search` ✓ | `web_search` | Web search (Exa → Tavily → Brave → DuckDuckGo fallback) |
| | `academic_search` | Academic search (arXiv + OpenAlex + CrossRef) |
| | `code_search` | GitHub repository search |
| | `web_fetch` | Fetch URL content (HTML text or file download) |
| `no-inline-python` ✓ | — | Blocks inline Python scripts in bash commands |
| `no-unsolicited-modifications` | — | Prevents unsolicited file modifications (used with `APPEND_SYSTEM.md`) |
| `read-pdf` | `read_pdf` | Extract text & math from PDFs as Markdown+LaTeX |
| `zhiguai` | — | TUI themes inspired by Chinese 志怪小说 (搜神记 · 稽神录 · 聊斋志异) |

### Skills

| Skill | Purpose |
|---|---|
| `literature-survey` ✓ | Systematic literature survey with PRISMA synthesis |
| `markdown-to-pdf` | Compile Markdown + LaTeX math to A4 PDF via Pandoc |
| `research-assistant` | Full research workflow: survey → prototype → experiment → publish |
| `symbolic-computation` | Symbolic math with SymPy (algebra, calculus, ODEs, PDEs) |

### System prompt append

✓ **Polished.** Copy `APPEND_SYSTEM.md` to prevent unsolicited file modifications:

```bash
cp APPEND_SYSTEM.md ~/.pi/agent/
```

## Install

```bash
pi install git:github.com/kyouma/pi-toolkit
```

Or try without installing:

```bash
pi -e git:github.com/kyouma/pi-toolkit
```

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
