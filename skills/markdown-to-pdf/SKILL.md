---
name: markdown-to-pdf
description: Compile Markdown with LaTeX math to A4 PDF via Pandoc + LuaLaTeX. Handles display/inline math, tables, cross-references, multi-language text, bibliography, and custom preamble. Use for papers, reports, lecture notes, and preprints.
---

# Markdown to A4 PDF Compilation

## Requirements

```bash
# Check that Pandoc and a LaTeX engine are available
which pandoc lualatex          # → /usr/bin/pandoc, /usr/bin/lualatex
# (install with: sudo apt install pandoc texlive-luatex texlive-fonts-recommended)
```

## Quick Start

```bash
cd /path/to/your/document
pandoc input.md \
  --pdf-engine=lualatex \
  --from markdown+tex_math_dollars+pipe_tables+raw_tex+fenced_divs+table_captions \
  -o output.pdf \
  -V geometry:"a4paper, margin=2.5cm" \
  -V documentclass:article \
  -V fontsize:11pt \
  --pdf-engine-opt=-shell-escape
```

Add `-V mainfont:"..."` for non-default fonts, `-V lang:russian` for Cyrillic text.

### With Cyrillic / non-Latin text

```bash
pandoc input.md \
  --pdf-engine=lualatex \
  --from markdown+tex_math_dollars+pipe_tables+raw_tex+fenced_divs+table_captions \
  -o output.pdf \
  -V geometry:"a4paper, margin=2.5cm" \
  -V documentclass:article \
  -V mainfont:"DejaVu Serif" \     # Cyrillic-capable font
  -V mathfont:"Latin Modern Math" \
  -V fontsize:12pt \
  -V lang:russian \
  --pdf-engine-opt=-shell-escape
```

## Recommended Template

Create `template.yaml` alongside your document:

```yaml
pdf-engine: lualatex
from: markdown+tex_math_dollars+pipe_tables+raw_tex+fenced_divs+table_captions
to: pdf

variables:
  documentclass: article
  classoption:
    - a4paper
    - 12pt
  geometry: "a4paper, margin=2.5cm, top=3cm, bottom=3cm"
  mainfont: "DejaVu Serif"
  mathfont: "Latin Modern Math"
  fontsize: 12pt
  linestretch: 1.15
  numbersections: true
  toc: true
  secnumdepth: 3

metadata:
  title: "Document Title"
  author: "Author Name"
  date: "\\today"

include-in-header:
  - text: |
      \usepackage{amssymb, amsmath, amsthm}
      \usepackage{mathtools}
      \usepackage{unicode-math}
      \usepackage{booktabs, longtable}
      \usepackage{hyperref}
      \hypersetup{colorlinks=true, linkcolor=blue, urlcolor=blue}
      \usepackage{microtype}
      \usepackage{float}
      \usepackage{caption}
      \captionsetup{font=small, labelfont=bf}
```

Then compile:

```bash
pandoc input.md --template template.yaml -o output.pdf
```

## Handling Common Issues

### Issue 1: `$$` display math not recognized

Make sure the input format includes `tex_math_dollars`:

```bash
--from markdown+tex_math_dollars
```

### Issue 2: Non-Latin text shows as missing characters

Use LuaLaTeX with a font that supports your script:

```bash
--pdf-engine=lualatex
-V mainfont:"DejaVu Serif"        # has Cyrillic, Greek, Vietnamese
-V lang:russian                   # or ukrainian, bulgarian, etc.
```

Other font options: `CMU Serif` (install `fonts-cmu`), `Noto Serif` (install `fonts-noto`).

### Issue 3: Tables overflow page width

Use `\small` or `\footnotesize` inside wide tables, or add to the preamble:

```yaml
include-in-header:
  - text: |
      \usepackage{tabularx}
      \newcolumntype{L}{>{\raggedright\arraybackslash}X}
```

### Issue 4: Custom LaTeX environments (theorem, definition, proof)

Use `fenced_divs` with raw LaTeX for custom theorem-like blocks:

```markdown
::: theorem
**Theorem (Central Limit Theorem).** Let $X_1, \ldots, X_n$ be i.i.d. with
$\mathbb{E}[X_i] = \mu$ and $\operatorname{Var}(X_i) = \sigma^2 < \infty$.
Then:
$$ \frac{\sqrt{n}(\bar{X}_n - \mu)}{\sigma} \xrightarrow{d} \mathcal{N}(0, 1) $$
:::
```

Register environments in the preamble:

```yaml
include-in-header:
  - text: |
      \usepackage{amsthm}
      \theoremstyle{definition}
      \newtheorem{theorem}{Theorem}[section]
      \newtheorem{definition}{Definition}[section]
      \newtheorem{lemma}{Lemma}[section]
      \newtheorem{corollary}{Corollary}[section]
      \newtheorem{example}{Example}[section]
```

### Issue 5: Long code blocks

Enable line wrapping and small fonts:

```yaml
include-in-header:
  - text: |
      \usepackage{fancyvrb}
      \VerbatimFootnotes
      \fvset{fontsize=\small, breaklines=true}
```

Or use the `minted` package (needs `-shell-escape`):

```yaml
--pdf-engine-opt=-shell-escape
include-in-header:
  - text: |
      \usepackage{minted}
      \setminted{fontsize=\small, breaklines=true}
```

### Issue 6: Cross-references between sections / equations

Pandoc's `-V numbersections` enables numbered sections. For equation references
inside `$$` / `$`, use `\label` and `\ref`:

```markdown
$$ \mathcal{M}f(z) = \int_0^\infty f(t) t^{z-1} dt \label{eq:mellin} $$

From \ref{eq:mellin} we see that...
```

Compile twice for references to resolve.

## Precompiled Headers (for speed)

For repeated compilations, cache the preamble:

```bash
# Create a format file once
cat > preamble.tex << 'EOF'
\documentclass[a4paper,12pt]{article}
\usepackage{amssymb, amsmath, amsthm, mathtools}
\usepackage{unicode-math}
\usepackage{booktabs, longtable}
\usepackage[colorlinks=true, linkcolor=blue]{hyperref}
\usepackage{microtype}
\setmainfont{DejaVu Serif}
\setmathfont{Latin Modern Math}
\newtheorem{theorem}{Theorem}[section]
\newtheorem{definition}{Definition}[section]
EOF

# Precompile
pdflatex -ini -jobname="myformat" "&pdflatex preamble.tex\dump"

# Use
pandoc input.md --pdf-engine=lualatex -o output.pdf -V documentclass:myformat
```

## Using Pi's built-in preview_export

For quick drafts without Pandoc, Pi's `preview_export` renders
Markdown+LaTeX inline:

```
preview_export(format="pdf", markdown="...", inputFormat="markdown")
```

For production-quality A4 output with full preamble control (custom fonts,
theorem environments, bibliography), use the Pandoc pipeline above.

## Bibliography

Use Pandoc's `--citeproc` filter with a `.bib` file:

```bash
pandoc input.md \
  --pdf-engine=lualatex \
  --citeproc \
  --bibliography=refs.bib \
  --csl=ieee.csl \
  -o output.pdf
```

Markdown citations: `[@author2024]`, `[@author2024, p. 42]`, `[-@author2024]`.
Download CSL styles from <https://github.com/citation-style-language/styles>.
