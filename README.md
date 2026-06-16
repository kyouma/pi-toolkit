# pi-toolkit

Extensions, skills, and prompts for [pi coding agent](https://github.com/earendil-works/pi-coding-agent).

## What's inside

### Extensions

| Extension | Tool | Description |
|---|---|---|
| `web-search` | `web_search` | Web search (Exa → Tavily → Brave → DuckDuckGo fallback) |
| | `academic_search` | Academic search (arXiv + OpenAlex + CrossRef) |
| | `code_search` | GitHub repository search |
| | `web_fetch` | Fetch URL content (HTML text or file download) |
| `read-pdf` | `read_pdf` | Extract text & math from PDFs as Markdown+LaTeX |

### Skills

| Skill | Purpose |
|---|---|
| `literature-survey` | Systematic literature survey with PRISMA synthesis |
| `markdown-to-pdf` | Compile Markdown + LaTeX math to A4 PDF via Pandoc |
| `research-assistant` | Full research workflow: survey → prototype → experiment → publish |
| `symbolic-computation` | Symbolic math with SymPy (algebra, calculus, ODEs, PDEs) |

### Prompts

| Prompt | Description |
|---|---|
| `no-unsolicited-modifications` | Forbids pi from creating/editing/deleting files without explicit command |

## Install

```bash
pi install git:github.com/kyouma/pi-toolkit
```

Or try without installing:

```bash
pi -e git:github.com/kyouma/pi-toolkit
```

## Dependencies

- **read_pdf**: requires `python3`, `pdfminer.six` (`pip install pdfminer.six`), and optionally `mutool` (`sudo apt install mupdf-tools`) for page-range extraction
- **markdown-to-pdf**: requires Pandoc + LuaLaTeX
- **symbolic-computation**: requires SymPy (`pip install sympy`)
