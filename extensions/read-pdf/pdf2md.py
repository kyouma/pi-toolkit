#!/usr/bin/env python3
"""
PDF to Markdown+TeX converter.

Extracts characters with font+position info from PDFs using pdfminer.six,
detects math regions via font analysis, and outputs Markdown with:
  - $...$ for inline math
  - $$...$$ for display math
  - LaTeX commands for all symbols
  - Detected subscripts, superscripts, fractions
  - Integrals, sums, products with limits
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Optional

# Check pdfminer availability early
try:
    from pdfminer.high_level import extract_pages
    from pdfminer.layout import LTChar, LTAnno, LAParams
except ImportError:
    print(
        "Error: The 'pdfminer.six' Python package is required.\n"
        "Install it with: pip install pdfminer.six",
        file=sys.stderr,
    )
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════════════════
# Configuration (set via CLI or env)
# ═══════════════════════════════════════════════════════════════════════════

DEBUG: bool = False

# Fraction of page height below which content is considered a page number/footer
# and may be filtered. Default 0.06 = bottom 6% (~48pt on US Letter).
Y_THRESHOLD_FACTOR: float = 0.06


def debug(msg: str) -> None:
    """Print debug message to stderr if DEBUG is enabled."""
    if DEBUG:
        print(f"[pdf2md DEBUG] {msg}", file=sys.stderr)


# ═══════════════════════════════════════════════════════════════════════════
# Unicode / font → LaTeX mapping
# ═══════════════════════════════════════════════════════════════════════════

UNICODE_TO_TEX: dict[str, str] = {
    # Operators
    "\u2212": "-", "\u00b1": "\\pm", "\u00d7": "\\times", "\u00f7": "\\div",
    "\u221a": "\\sqrt", "\u222b": "\\int", "\u222e": "\\oint",
    "\u2211": "\\sum", "\u220f": "\\prod", "\u2210": "\\coprod",
    # Greek lowercase
    "\u03b1": "\\alpha", "\u03b2": "\\beta", "\u03b3": "\\gamma", "\u03b4": "\\delta",
    "\u03b5": "\\varepsilon", "\u03b6": "\\zeta", "\u03b7": "\\eta",
    "\u03b8": "\\theta", "\u03d1": "\\vartheta", "\u03b9": "\\iota", "\u03ba": "\\kappa",
    "\u03bb": "\\lambda", "\u03bc": "\\mu", "\u00b5": "\\mu", "\u03bd": "\\nu", "\u03be": "\\xi",
    "\u03c0": "\\pi", "\u03c1": "\\rho", "\u03c3": "\\sigma", "\u03c4": "\\tau",
    "\u03c5": "\\upsilon", "\u03d5": "\\varphi", "\u03c6": "\\varphi", "\u03c7": "\\chi",
    "\u03c8": "\\psi", "\u03c9": "\\omega",
    # Greek uppercase
    "\u0393": "\\Gamma", "\u0394": "\\Delta", "\u0398": "\\Theta", "\u039b": "\\Lambda",
    "\u039e": "\\Xi", "\u03a0": "\\Pi", "\u03a3": "\\Sigma", "\u03a6": "\\Phi",
    "\u03a8": "\\Psi", "\u03a9": "\\Omega",
    # Relations & symbols
    "\u2207": "\\nabla", "\u2202": "\\partial", "\u221e": "\\infty",
    "\u2208": "\\in", "\u2209": "\\notin", "\u220b": "\\ni",
    "\u2282": "\\subset", "\u2283": "\\supset", "\u2286": "\\subseteq", "\u2287": "\\supseteq",
    "\u222a": "\\cup", "\u2229": "\\cap", "\u2228": "\\lor", "\u2227": "\\land", "\u00ac": "\\neg",
    "\u21d2": "\\Rightarrow", "\u21d4": "\\Leftrightarrow", "\u2192": "\\to", "\u21a6": "\\mapsto",
    "\u2248": "\\approx", "\u2260": "\\neq", "\u2264": "\\le", "\u2265": "\\ge",
    "\u221d": "\\propto", "\u22a5": "\\perp", "\u223c": "\\sim", "\u2245": "\\cong", "\u2261": "\\equiv",
    "\u2200": "\\forall", "\u2203": "\\exists",
    "\u2297": "\\otimes", "\u2295": "\\oplus", "\u2299": "\\odot",
    "\u22c5": "\\cdot", "\u2218": "\\circ", "\u2217": "\\ast", "\u22c6": "\\star",
    "\u2032": "'", "\u2033": "''",
    "\u27e8": "\\langle", "\u27e9": "\\rangle", "\u2225": "\\parallel",
    "\u2113": "\\ell", "\u210f": "\\hbar", "\u211c": "\\Re", "\u2111": "\\Im", "\u2118": "\\wp",
    "\u2135": "\\aleph",
    "\u2220": "\\angle", "\u2022": "\\bullet",
    "\u2234": "\\therefore", "\u2235": "\\because",
    "\u2019": "'", "\u2018": "'", "\u201c": "\"", "\u201d": "\"",
    # Spacing variants → normal space
    "\u2009": " ", "\u200a": " ", "\u202f": " ", "\u00a0": " ",
}

# CID → TeX for CMEX (Computer Modern EXtended) font
CMEX_CID: dict[int, str] = {
    0: "(", 1: ")", 2: "(", 3: ")", 4: "(", 5: ")",
    6: "(", 7: ")", 8: "(", 9: ")",
    10: "[", 11: "]", 12: "[", 13: "]", 14: "[", 15: "]",
    16: "[", 17: "]", 18: "(", 19: ")",  # extra-large parens (matrices)
    20: "\\{", 21: "\\}", 22: "\\{", 23: "\\}",
    24: "\\{", 25: "\\}", 26: "\\{", 27: "\\}",
    68: "\\lfloor", 69: "\\rfloor", 70: "\\lceil", 71: "\\rceil",
    72: "\\lfloor", 73: "\\rfloor", 74: "\\lceil", 75: "\\rceil",
    80: "\\sum",  # non-standard CID for sum in some encodings
    88: "\\sum", 89: "\\prod", 90: "\\int", 91: "\\oint",
    92: "\\bigcap", 93: "\\bigcup", 94: "\\bigsqcup",
    96: "(", 97: ")", 98: "[", 99: "]",
}

# CID → TeX for CMSY (Computer Modern SYmbols) font
CMSY_CID: dict[int, str] = {
    0: "\\Gamma", 1: "\\Delta", 2: "\\Theta", 3: "\\Lambda",
    4: "\\Xi", 5: "\\Pi", 6: "\\Sigma", 7: "\\Upsilon",
    8: "\\Phi", 9: "\\Psi", 10: "\\Omega",
    11: "\\alpha", 12: "\\beta", 13: "\\gamma", 14: "\\delta",
    15: "\\epsilon", 16: "\\zeta", 17: "\\eta", 18: "\\theta",
    19: "\\iota", 20: "\\kappa", 21: "\\lambda", 22: "\\mu",
    23: "\\nu", 24: "\\xi", 25: "\\pi", 26: "\\rho",
    27: "\\sigma", 28: "\\tau", 29: "\\upsilon", 30: "\\phi",
    31: "\\chi", 32: "\\psi", 33: "\\omega",
    34: "\\varepsilon", 35: "\\vartheta", 36: "\\varpi", 37: "\\varphi",
    48: "\\le", 49: "\\ge", 50: "\\equiv", 51: "\\prec", 52: "\\succ",
    53: "\\sim", 54: "\\perp", 55: "\\subset", 56: "\\supset",
    57: "\\subseteq", 58: "\\supseteq", 59: "\\in", 60: "\\ni",
    61: "\\notin", 62: "\\wedge", 63: "\\vee",
    64: "\\setminus", 67: "\\mid", 68: "\\parallel",
    69: "\\neq", 70: "\\approx", 73: "\\propto",
    74: "\\models", 75: "\\simeq", 76: "\\cong", 77: "\\Join",
    80: "\\aleph", 81: "\\ell", 82: "\\hbar", 83: "\\wp",
    84: "\\Re", 85: "\\Im", 86: "\\partial", 87: "\\infty",
    88: "\\prime", 89: "\\emptyset", 90: "\\nabla",
    91: "\\surd", 92: "\\angle", 93: "\\triangle",
    94: "\\Box", 95: "\\Diamond",
    100: "\\forall", 101: "\\exists", 102: "\\neg",
    103: "\\flat", 104: "\\natural", 105: "\\sharp",
    110: "\\leftrightarrow", 111: "\\leftarrow", 112: "\\uparrow",
    113: "\\rightarrow", 114: "\\downarrow",
    115: "\\leftrightarrow", 116: "\\Leftarrow", 117: "\\Uparrow",
    118: "\\Rightarrow", 119: "\\Downarrow", 120: "\\Leftrightarrow",
    125: "\\div", 126: "\\times", 127: "\\cdot",
}

MATH_FONT_PREFIXES: set[str] = {"CMMI", "CMSY", "CMEX", "MSAM", "MSBM", "EUFM"}


def font_base(fontname: str) -> str:
    """Extract base font family from a name like 'ABCDEF+CMMI10'."""
    if "+" in fontname:
        fontname = fontname.split("+", 1)[1]
    # Strip digits
    name = fontname.rstrip("0123456789")
    return name


def is_math_font(fontname: str) -> bool:
    """Return True if *fontname* is a known math font."""
    base = font_base(fontname)
    if base in MATH_FONT_PREFIXES:
        return True
    return any(m in fontname for m in ["Math", "math", "Symbol", "STIX", "Asana", "XITS"])


def is_bold_font(fontname: str) -> bool:
    """Return True if *fontname* is a bold variant."""
    base = font_base(fontname)
    return base in ("CMBX",) or "bold" in fontname.lower()


# ═══════════════════════════════════════════════════════════════════════════
# Character-level data
# ═══════════════════════════════════════════════════════════════════════════

class Glyph:
    """A single positioned character with font metadata."""
    __slots__ = ("text", "fontname", "fontsize", "x", "y", "tex", "is_math", "is_bold")

    def __init__(self, text: str, fontname: str, fontsize: float, x: float, y: float) -> None:
        self.text: str = text
        self.fontname: str = fontname
        self.fontsize: float = fontsize
        self.x: float = x
        self.y: float = y
        self.is_math: bool = is_math_font(fontname)
        self.is_bold: bool = is_bold_font(fontname)
        self.tex: str = self._to_tex()

    def _to_tex(self) -> str:
        """Convert this character to its TeX representation."""
        # CID codes from CMEX/CMSY fonts
        m = re.match(r"\(cid:(\d+)\)", self.text)
        if m:
            cid = int(m.group(1))
            base = font_base(self.fontname)
            if base == "CMEX" and cid in CMEX_CID:
                return CMEX_CID[cid]
            if base == "CMSY" and cid in CMSY_CID:
                return CMSY_CID[cid]
            debug(f"unknown CID {cid} in {base} font — returning empty string")
            return ""

        # Unicode math symbols
        if self.text in UNICODE_TO_TEX:
            return UNICODE_TO_TEX[self.text]

        # Regular letter/digit in math font: keep as-is
        if self.is_math:
            if self.is_bold and self.text.isalpha():
                return f"\\mathbf{{{self.text}}}"
            return self.text
        return ""

    def __repr__(self) -> str:
        return (
            f"Glyph({self.text!r}→{self.tex!r} "
            f"f={self.fontname} s={self.fontsize:.0f} "
            f"x={self.x:.0f} y={self.y:.0f})"
        )


def extract_glyphs(pdf_path: str) -> list[list[list[Glyph]]]:
    """Extract pages of glyphs from a PDF.

    Collects ALL characters (LTChar + LTAnno spaces) from the page tree
    and groups them into horizontal bands (lines) by Y-position.

    Returns: list of pages, each is a list of lines, each line is a list of Glyphs.
    """
    pages: list[list[list[Glyph]]] = []
    for page in extract_pages(pdf_path, laparams=LAParams(all_texts=True)):
        all_glyphs: list[Glyph] = []

        # Determine page geometry for adaptive thresholds
        page_bbox = page.bbox  # (x0, y0, x1, y1)
        page_height: float = abs(page_bbox[3] - page_bbox[1]) if page_bbox and len(page_bbox) >= 4 else 792.0
        # Threshold: bottom Y_THRESHOLD_FACTOR of page height (configurable)
        y_threshold: float = max(50.0, page_height * Y_THRESHOLD_FACTOR)

        def collect_all(elt: object) -> None:
            """Collect every LTChar (and LTAnno spaces) into all_glyphs."""
            if hasattr(elt, '__iter__'):
                for child in elt:  # type: ignore[union-attr]
                    if isinstance(child, LTChar):
                        all_glyphs.append(Glyph(
                            child.get_text(), child.fontname, child.size,
                            child.bbox[0], child.bbox[1],
                        ))
                    elif isinstance(child, LTAnno):
                        ch = child.get_text()
                        if ch == " ":
                            # Compute space position reliably
                            if hasattr(child, 'bbox') and child.bbox and len(child.bbox) >= 4:
                                x, y = child.bbox[0], child.bbox[1]
                            elif all_glyphs:
                                # Estimate from previous glyph metrics
                                prev = all_glyphs[-1]
                                avg_char_width = prev.fontsize * 0.55
                                x = prev.x + avg_char_width
                                y = prev.y
                            else:
                                x, y = 0.0, 0.0
                            if y > y_threshold:
                                all_glyphs.append(Glyph(" ", "CMR10", 10, x, y))
                    else:
                        collect_all(child)

        collect_all(page)

        # Filter out stray glyphs below the adaptive threshold
        all_glyphs = [g for g in all_glyphs if g.y > y_threshold or (g.text.strip() and g.y > 0)]

        if not all_glyphs:
            pages.append([])
            continue

        # Group all glyphs into horizontal bands (lines) by Y-proximity
        # Sort by y DESCENDING (pdfminer y increases upward; we want top-to-bottom)
        all_glyphs.sort(key=lambda g: (-g.y, g.x))
        lines: list[list[Glyph]] = []
        cur: list[Glyph] = [all_glyphs[0]]
        for g in all_glyphs[1:]:
            if abs(g.y - cur[-1].y) < 5:
                cur.append(g)
            else:
                if cur:
                    lines.append(sorted(cur, key=lambda x: x.x))
                cur = [g]
        if cur:
            lines.append(sorted(cur, key=lambda x: x.x))

        pages.append(lines)
    return pages


def compute_page_widths(pages_data: list[list[list[Glyph]]], default_width: float = 612.0) -> list[float]:
    """Compute the maximum content x-extent for each page from glyph data.

    This replaces the previous mutool-based approach — no external
    dependency needed. Falls back to *default_width* for empty pages.
    """
    widths: list[float] = []
    for glyph_lines in pages_data:
        max_x: float = default_width
        for line in glyph_lines:
            for g in line:
                est_width = g.x + max(g.fontsize * 0.5, 4)
                if est_width > max_x:
                    max_x = est_width
        widths.append(max_x)
    return widths


# ═══════════════════════════════════════════════════════════════════════════
# TeX reconstruction
# ═══════════════════════════════════════════════════════════════════════════

def glyphs_to_tex(glyphs: list[Glyph]) -> str:
    """Convert math glyphs to TeX, detecting sub/superscripts and multi-line."""
    if not glyphs:
        return ""

    # Sort by reading order (y then x)
    sorted_g = sorted(glyphs, key=lambda g: (g.y, g.x))

    # Group into horizontal bands (lines)
    bands: list[list[Glyph]] = []
    cur: list[Glyph] = [sorted_g[0]]
    for g in sorted_g[1:]:
        if abs(g.y - cur[-1].y) < 5:
            cur.append(g)
        else:
            bands.append(sorted(cur, key=lambda x: x.x))
            cur = [g]
    bands.append(sorted(cur, key=lambda x: x.x))

    if len(bands) == 1:
        return _single_band_tex(bands[0])
    elif len(bands) == 2:
        return _two_band_tex(bands)
    else:
        return _multi_band_tex(bands)


def _single_band_tex(glyphs: list[Glyph]) -> str:
    """Single horizontal band → TeX with sub/superscript detection."""
    result: list[str] = []
    i: int = 0
    n: int = len(glyphs)

    while i < n:
        g: Glyph = glyphs[i]
        tex: str = g.tex if g.tex else g.text

        # Look ahead for superscript or subscript
        if i + 1 < n:
            nxt: Glyph = glyphs[i + 1]
            size_ratio: float = nxt.fontsize / max(g.fontsize, 0.1)

            if size_ratio < 0.85:
                y_diff: float = g.y - nxt.y  # positive = nxt is higher

                if y_diff < -3:
                    # Superscript: nxt is higher on page (larger y in pdfminer coords)
                    sup: str = ""
                    j: int = i + 1
                    while j < n and glyphs[j].fontsize < g.fontsize * 0.85:
                        if j > i + 1 and abs(glyphs[j].y - glyphs[i + 1].y) > 4:
                            break
                        sup += glyphs[j].tex if glyphs[j].tex else glyphs[j].text
                        j += 1
                    result.append(f"{tex}^{{{sup}}}")
                    i = j
                    continue

                if y_diff > 3:
                    # Subscript: nxt is lower on page (smaller y in pdfminer coords)
                    sub: str = ""
                    j: int = i + 1
                    while j < n and glyphs[j].fontsize < g.fontsize * 0.85:
                        if j > i + 1 and abs(glyphs[j].y - glyphs[i + 1].y) > 4:
                            break
                        sub += glyphs[j].tex if glyphs[j].tex else glyphs[j].text
                        j += 1
                    result.append(f"{tex}_{{{sub}}}")
                    i = j
                    continue

        result.append(tex)
        i += 1

    return "".join(result)


def _two_band_tex(bands: list[list[Glyph]]) -> str:
    """Two bands → check for fraction pattern.

    In pdfminer coords, y increases upward. bands[0] has lower y (lower on page).
    For a fraction, the numerator is the band with HIGHER y (higher on page).
    """
    lower = bands[0]  # lower y = lower on page = denominator
    upper = bands[1]  # higher y = higher on page = numerator

    # Compute center and overlap
    up_x0 = min(g.x for g in upper)
    up_x1 = max(g.x + g.fontsize * 0.5 for g in upper)
    low_x0 = min(g.x for g in lower)
    low_x1 = max(g.x + g.fontsize * 0.5 for g in lower)
    up_cx = (up_x0 + up_x1) / 2
    low_cx = (low_x0 + low_x1) / 2
    overlap = min(up_x1, low_x1) - max(up_x0, low_x0)

    up_y_min = min(g.y for g in upper)
    low_y_max = max(g.y + g.fontsize for g in lower)
    gap = up_y_min - low_y_max

    # Scale gap thresholds with average font size (not hardcoded 2–30pt)
    all_glyphs = list(upper) + list(lower)
    avg_fontsize = sum(g.fontsize for g in all_glyphs) / max(len(all_glyphs), 1)
    gap_min = max(2.0, avg_fontsize * 0.2)
    gap_max = max(30.0, avg_fontsize * 3.0)

    # Fraction: overlapping x-ranges, vertical gap scaled to font size
    if overlap > 0 and gap_min < gap < gap_max and abs(up_cx - low_cx) < 50:
        num_tex = _single_band_tex(upper)
        den_tex = _single_band_tex(lower)
        if num_tex and den_tex:
            return f"\\frac{{{num_tex}}}{{{den_tex}}}"

    # Otherwise join
    return _single_band_tex(lower) + _single_band_tex(upper)


def _multi_band_tex(bands: list[list[Glyph]]) -> str:
    """Three+ bands → check for operator with limits (∫/∑/∏)."""
    # Find a band that contains a large operator (CMEX font)
    for mid_i in range(len(bands)):
        mid = bands[mid_i]
        has_op = any("CMEX" in g.fontname for g in mid)

        if has_op:
            top_bands = bands[:mid_i]
            bot_bands = bands[mid_i + 1:]
            op_tex = _single_band_tex(mid)
            top_tex = " ".join(_single_band_tex(b) for b in top_bands) if top_bands else ""
            bot_tex = " ".join(_single_band_tex(b) for b in bot_bands) if bot_bands else ""

            if top_tex and bot_tex:
                return f"{op_tex}_{{{bot_tex}}}^{{{top_tex}}}"
            elif top_tex:
                return f"{op_tex}^{{{top_tex}}}"
            elif bot_tex:
                return f"{op_tex}_{{{bot_tex}}}"
            return op_tex

    # No operator — join with \\ (newline)
    return " \\\\ ".join(_single_band_tex(b) for b in bands)


def render_inline_text(glyphs: list[Glyph]) -> str:
    """Render a mixed body+math text box. Math fragments get $...$ wrapping."""
    parts: list[str] = []
    math_buf: list[Glyph] = []
    text_buf: list[str] = []

    for g in glyphs:
        if g.is_math and g.tex:
            if text_buf:
                parts.append("".join(text_buf))
                text_buf = []
            math_buf.append(g)
        else:
            if math_buf:
                tex = glyphs_to_tex(math_buf)
                if tex.strip():
                    parts.append(f"${tex.strip()}$")
                math_buf = []
            text_buf.append(g.text if not g.tex else g.tex)

    if math_buf:
        tex = glyphs_to_tex(math_buf)
        if tex.strip():
            parts.append(f"${tex.strip()}$")
    if text_buf:
        parts.append("".join(text_buf))

    return re.sub(r" +", " ", "".join(parts)).strip()


def _insert_word_spaces(glyphs: list[Glyph]) -> list[Glyph]:
    """Insert space Glyphs between words that have a large x-gap.

    Skips insertion when both surrounding glyphs are in math font
    context (tightly spaced math expressions).
    """
    if len(glyphs) < 2:
        return glyphs
    result: list[Glyph] = [glyphs[0]]
    for i in range(1, len(glyphs)):
        prev = glyphs[i - 1]
        curr = glyphs[i]
        avg_size = (prev.fontsize + curr.fontsize) / 2
        gap = curr.x - (prev.x + prev.fontsize * 0.5)

        # Skip space insertion if both glyphs are in math font context
        # (tightly spaced math formulas shouldn't get extra spaces)
        if gap > avg_size * 1.2 and not (prev.is_math and curr.is_math):
            # Insert a space glyph
            space_x = prev.x + prev.fontsize * 0.5
            space_y = (prev.y + curr.y) / 2
            result.append(Glyph(" ", "CMR10", avg_size, space_x, space_y))
        result.append(curr)
    return result


def render_plain_text(glyphs: list[Glyph]) -> str:
    """Render plain (non-math) glyphs as text."""
    spaced = _insert_word_spaces(glyphs)
    text = "".join(g.text for g in spaced)
    # Apply Unicode → char mappings
    for u, c in UNICODE_TO_TEX.items():
        text = text.replace(u, c)
    return re.sub(r" +", " ", text).strip()


# ═══════════════════════════════════════════════════════════════════════════
# Main conversion
# ═══════════════════════════════════════════════════════════════════════════

def _line_metrics(glyphs: list[Glyph], page_height: float = 792.0) -> tuple:
    """Compute metrics for a line of glyphs.

    Returns (x0, x1, y0, y1, cx, math_ratio, avg_size, has_bold, plain, y_rel).
    The last element *y_rel* is the line's bottom y (y0) as a fraction of page_height,
    used for relative (page-size-independent) footer detection.
    """
    x0 = min(g.x for g in glyphs)
    x1 = max(g.x + max(g.fontsize * 0.5, 4) for g in glyphs)
    y0 = min(g.y for g in glyphs)
    y1 = max(g.y + g.fontsize for g in glyphs)
    cx = (x0 + x1) / 2
    n = len(glyphs)
    n_math = sum(1 for g in glyphs if g.is_math)
    math_ratio = n_math / max(n, 1)
    avg_size = sum(g.fontsize for g in glyphs) / max(n, 1)
    has_bold = any(g.is_bold for g in glyphs)
    plain = "".join(g.text for g in glyphs).strip()
    y_rel = y0 / max(page_height, 1.0)
    return x0, x1, y0, y1, cx, math_ratio, avg_size, has_bold, plain, y_rel


def pdf_to_markdown(pdf_path: str) -> str:
    """Convert a PDF to Markdown with TeX math."""
    pages_data = extract_glyphs(pdf_path)
    page_widths = compute_page_widths(pages_data)

    parts: list[str] = []

    for page_idx, glyph_lines in enumerate(pages_data):
        if page_idx > 0:
            parts.append("")

        page_w = page_widths[page_idx]
        # Determine page height from glyph y-range
        all_page_y = [g.y for line in glyph_lines for g in line]
        page_height = (max(all_page_y) - min(all_page_y) + 100) if all_page_y else 792.0
        if page_height < 100:
            page_height = 792.0

        result_lines: list[str] = []

        i = 0
        while i < len(glyph_lines):
            glyphs = glyph_lines[i]
            if not glyphs:
                i += 1
                continue

            x0, x1, y0, y1, cx, math_ratio, avg_size, has_bold, plain, y_rel = _line_metrics(
                glyphs, page_height,
            )

            if not plain:
                i += 1
                continue

            # Skip page numbers: bottom 8% of page AND matches a number-ish pattern
            # Uses relative page-height threshold instead of absolute 100pt
            is_footer = y_rel < 0.08
            if is_footer and re.match(r"^[\d\s\-—–.()ivxlcdmIVXLCDM]+$", plain) and len(plain) <= 8:
                debug(f"skipping page number: {plain!r} at y_rel={y_rel:.3f}")
                i += 1
                continue

            # Heading
            if has_bold and avg_size >= 12 and len(plain.split()) <= 8:
                level = 1 if avg_size >= 16 else 2
                heading = render_plain_text(glyphs)
                result_lines.append(f"\n{'#' * level} {heading}\n")
                i += 1
                continue

            is_centered = abs(cx - page_w / 2) < page_w * 0.2

            # ── Display math (single or multi-line) ─────────────────────
            if math_ratio > 0.3 or (is_centered and math_ratio > 0.15):
                # Multi-line: only merge lines that are EXTREMELY close (fraction parts)
                # This catches \frac{num}{den} and operator limits
                merged = [glyphs]
                j = i + 1
                max_lookahead = min(i + 5, len(glyph_lines))
                while j < max_lookahead:
                    nx = glyph_lines[j]
                    nx0, nx1, ny0, ny1, ncx, nr, ns, nh, np, nyr = _line_metrics(nx, page_height)
                    prev_bot = max(g.y + g.fontsize for g in merged[-1])
                    this_top = min(g.y for g in nx)
                    gap = this_top - prev_bot
                    # Only merge if: super tight gap (<10pt) AND both math-heavy
                    if gap > 10 or nr < 0.2:
                        break
                    merged.append(nx)
                    j += 1

                all_g = [g for line in merged for g in line]
                all_g.sort(key=lambda g: (-g.y, g.x))
                bands: list[list[Glyph]] = []
                cur: list[Glyph] = [all_g[0]]
                for g in all_g[1:]:
                    if abs(g.y - cur[-1].y) < 5:
                        cur.append(g)
                    else:
                        bands.append(sorted(cur, key=lambda x: x.x))
                        cur = [g]
                if cur:
                    bands.append(sorted(cur, key=lambda x: x.x))

                if len(bands) == 1:
                    tex = _single_band_tex(bands[0])
                elif len(bands) == 2:
                    tex = _two_band_tex(bands)
                else:
                    tex = _multi_band_tex(bands)

                if tex.strip():
                    result_lines.append(f"$$\n{tex.strip()}\n$$\n")
                i = j
                continue

            # ── Single line: inline math or plain text ─────────────────────
            if math_ratio > 0.0:
                line = render_inline_text(glyphs)
            else:
                glyphs_with_spaces = _insert_word_spaces(glyphs)
                line = render_plain_text(glyphs_with_spaces)

            if line:
                result_lines.append(line + "\n")

            i += 1

        page_md = re.sub(r"\n{4,}", "\n\n", "".join(result_lines))
        parts.append(page_md.strip())

    return re.sub(r"\n{5,}", "\n\n\n", "\n\n".join(p.strip() for p in parts if p.strip()))


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════

def parse_args(argv: list[str]) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Convert a PDF to Markdown with LaTeX math.",
    )
    parser.add_argument("path", help="Path to the PDF file")
    parser.add_argument(
        "--debug", action="store_true", default=False,
        help="Print debug info to stderr",
    )
    parser.add_argument(
        "--y-threshold", type=float, default=0.06,
        help="Fraction of page height for bottom footer cutoff (default: 0.06)",
    )
    return parser.parse_args(argv)


if __name__ == "__main__":
    args = parse_args(sys.argv[1:])

    DEBUG = args.debug
    Y_THRESHOLD_FACTOR = args.y_threshold

    path = args.path
    if not Path(path).exists():
        print(f"Error: file not found: {path}", file=sys.stderr)
        sys.exit(1)

    try:
        print(pdf_to_markdown(path))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
