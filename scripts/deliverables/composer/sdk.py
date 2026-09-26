"""Presentation SDK for model-authored composition.

Primitives, not templates. A library of pre-designed slide layouts would give
back exactly the sameness this increment exists to remove — the composer is meant
to choose a different composition for a different idea, the way the reference
deck does.

Two invariants the composer cannot opt out of:

  * It cannot set the canvas. `Deck` fixes 13.333 x 7.5in once. The defect that
    started this work was a renderer positioning wide-canvas content on a narrow
    canvas, and no caller should be able to reintroduce it.

  * It cannot place a shape off the canvas. Every primitive validates its own
    bounds and raises. Catching this at inspection time is too late to be useful
    to the composer; raising here means the sandbox run fails with a line number
    while the model can still be asked to fix it.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

CANVAS_W = 13.333
CANVAS_H = 7.5
EPS = 0.005  # a rounding allowance, not a licence: ~4.5 thousandths of an inch


class OutOfCanvas(ValueError):
    pass


class DeckLimit(ValueError):
    pass


MAX_SLIDES = 40
MAX_SHAPES_PER_SLIDE = 80
MAX_SHAPES_TOTAL = 1200


def _hex(value: str) -> RGBColor:
    return RGBColor.from_string(value.lstrip("#").upper())


@dataclass
class Theme:
    """Brand tokens. The composer picks from these; it does not invent colours."""

    navy: str = "1B2B5C"
    ink: str = "12182B"
    body: str = "3C4358"
    muted: str = "6B7488"
    rule: str = "D8DCE6"
    wash: str = "F4F6FA"
    paper: str = "FFFFFF"
    accent: str = "C9A227"
    positive: str = "1F7A5C"
    caution: str = "B4632A"
    critical: str = "9B2C2C"
    display_font: str = "Inter"
    body_font: str = "Inter"

    def color(self, name: str) -> RGBColor:
        value = getattr(self, name, None)
        if not isinstance(value, str) or not re.fullmatch(r"#?[0-9A-Fa-f]{6}", value):
            raise ValueError(f"unknown theme colour {name!r}")
        return _hex(value)


from widths import CHAR_W, CHAR_W_BOLD, DEFAULT_W, DEFAULT_W_BOLD

# Text measurement is done against a REAL font width table, generated at build
# time by build_width_table.py from a deliberately wide fallback face.
#
# The first version guessed per-character weights and under-measured by about a
# quarter. fit_text then under-wrapped, every box was sized for fewer lines than
# its text needed, and the overflow landed on whatever was beneath it — visible
# text-on-text across five slides of the first composed deck. The deck declares
# Inter, but Inter is frequently absent and the renderer substitutes something
# wider, so measuring the brand font would be measuring a font that may never be
# used. Over-measuring costs slack; under-measuring costs a broken slide.
SAFETY = 1.04


def measure_text(text: str, size_pt: float, bold: bool = False) -> float:
    """Rendered width of one line, in inches. Conservative by construction."""
    table = CHAR_W_BOLD if bold else CHAR_W
    default = DEFAULT_W_BOLD if bold else DEFAULT_W
    em = sum(table.get(ord(ch), default) for ch in text)
    return em * (size_pt / 72.0) * SAFETY


def _split_long_token(token: str, width_in: float, size_pt: float, bold: bool) -> list[str]:
    """Hard-break a token that cannot fit on a line of its own.

    PowerPoint breaks mid-word when a word is wider than its box. If fit_text
    refused to, it would return one line where the renderer draws three, the box
    would be sized for one, and the extra two would be drawn over whatever is
    beneath. "Never splits a word" was the wrong invariant: matching the renderer
    is the invariant.
    """
    pieces: list[str] = []
    current = ""
    for ch in token:
        if current and measure_text(current + ch, size_pt, bold) > width_in:
            pieces.append(current)
            current = ch
        else:
            current += ch
    if current:
        pieces.append(current)
    return pieces or [token]


def fit_text(text: str, width_in: float, size_pt: float, bold: bool = False) -> list[str]:
    """Break `text` into lines that each fit `width_in`, as the renderer would."""
    lines: list[str] = []
    current = ""
    for word in text.split():
        if measure_text(word, size_pt, bold) > width_in:
            if current:
                lines.append(current)
                current = ""
            pieces = _split_long_token(word, width_in, size_pt, bold)
            lines.extend(pieces[:-1])
            current = pieces[-1]
            continue
        candidate = f"{current} {word}".strip()
        if current and measure_text(candidate, size_pt, bold) > width_in:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines or [""]


def text_height(lines: int, size_pt: float, line_spacing: float = 1.34) -> float:
    """Height of a wrapped block.

    1.34 rather than a tight 1.22: PowerPoint adds leading above the first line
    and below the last, and a box sized to the exact glyph height clips its own
    descenders and crowds whatever sits under it.
    """
    return lines * (size_pt / 72.0) * line_spacing


def align(items: list[float], to: float) -> list[float]:
    """Snap a list of coordinates to one value. Alignment by intent, not by eye."""
    return [to for _ in items]


def distribute(start: float, end: float, count: int, gap: float) -> list[float]:
    """`count` equal spans between `start` and `end` separated by `gap`."""
    if count <= 0:
        raise ValueError("count must be positive")
    span = (end - start - gap * (count - 1)) / count
    if span <= 0:
        raise ValueError("no room to distribute: reduce count or gap")
    return [start + i * (span + gap) for i in range(count)]


def span_width(start: float, end: float, count: int, gap: float) -> float:
    return (end - start - gap * (count - 1)) / count


@dataclass
class Slide:
    _slide: object
    theme: Theme
    _deck: "Deck"
    shape_count: int = 0
    _title_text: str = ""

    # ── internals ────────────────────────────────────────────────────────────
    def _check(self, x: float, y: float, w: float, h: float, what: str) -> None:
        if w <= 0 or h <= 0:
            raise OutOfCanvas(f"{what}: width and height must be positive ({w}x{h})")
        if x < -EPS or y < -EPS or x + w > CANVAS_W + EPS or y + h > CANVAS_H + EPS:
            raise OutOfCanvas(
                f"{what}: [{x:.2f},{y:.2f} {w:.2f}x{h:.2f}] falls outside the "
                f"{CANVAS_W}x{CANVAS_H}in canvas"
            )
        self.shape_count += 1
        self._deck.total_shapes += 1
        if self.shape_count > MAX_SHAPES_PER_SLIDE:
            raise DeckLimit(f"slide exceeds {MAX_SHAPES_PER_SLIDE} shapes")
        if self._deck.total_shapes > MAX_SHAPES_TOTAL:
            raise DeckLimit(f"deck exceeds {MAX_SHAPES_TOTAL} shapes")

    def _textbox(self, x, y, w, h):
        return self._slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))

    def _style_run(self, run, size, color, bold, font=None):
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.name = font or self.theme.body_font
        run.font.color.rgb = self.theme.color(color)

    # ── primitives ───────────────────────────────────────────────────────────
    def add_title(
        self,
        text: str,
        x: float = 0.75,
        y: float = 0.45,
        w: float = 11.8,
        size: float = 25,
        color: str = "navy",
        rule: bool = True,
    ) -> float:
        """Message-led slide title. Returns the y the body can start at."""
        lines = fit_text(text, w, size, bold=True)
        h = text_height(len(lines), size) + 0.12
        self._check(x, y, w, h, "title")
        box = self._textbox(x, y, w, h)
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        for i, line in enumerate(lines):
            p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            self._style_run(p.add_run(), size, color, True, self.theme.display_font)
            p.runs[0].text = line
        self._title_text = text
        bottom = y + h
        if rule:
            self.add_shape("line", x, bottom + 0.10, w, 0.012, fill="rule")
            bottom += 0.10
        return bottom + 0.22

    def add_text(
        self,
        text: str,
        x: float,
        y: float,
        w: float,
        size: float = 12,
        color: str = "body",
        bold: bool = False,
        align_h: str = "left",
        h: float | None = None,
    ) -> float:
        lines = fit_text(text, w - 0.02, size, bold)
        height = h if h is not None else text_height(len(lines), size) + 0.06
        self._check(x, y, w, height, "text")
        box = self._textbox(x, y, w, height)
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.alignment = {"left": PP_ALIGN.LEFT, "center": PP_ALIGN.CENTER, "right": PP_ALIGN.RIGHT}[align_h]
        self._style_run(p.add_run(), size, color, bold)
        p.runs[0].text = text
        return y + height

    def add_bullets(
        self,
        items: list[str],
        x: float,
        y: float,
        w: float,
        size: float = 12,
        color: str = "body",
        gap: float = 0.10,
        marker: str = "—",
    ) -> float:
        cursor = y
        for item in items:
            lines = fit_text(item, w - 0.30, size)
            h = text_height(len(lines), size) + 0.04
            self._check(x, cursor, w, h, "bullet")
            self.add_text(marker, x, cursor, 0.25, size, "accent", True)
            box = self._textbox(x + 0.30, cursor, w - 0.30, h)
            tf = box.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            self._style_run(p.add_run(), size, color, False)
            p.runs[0].text = item
            cursor += h + gap
        return cursor

    def add_label(self, text: str, x: float, y: float, w: float, color: str = "muted", size: float = 9.5) -> float:
        return self.add_text(text.upper(), x, y, w, size, color, True)

    def add_shape(
        self,
        kind: str,
        x: float,
        y: float,
        w: float,
        h: float,
        fill: str | None = "wash",
        line: str | None = None,
        text: str | None = None,
        text_color: str = "ink",
        text_size: float = 11,
        bold: bool = False,
    ):
        shapes = {
            "rect": MSO_SHAPE.RECTANGLE,
            "round": MSO_SHAPE.ROUNDED_RECTANGLE,
            "oval": MSO_SHAPE.OVAL,
            "chevron": MSO_SHAPE.CHEVRON,
            "line": MSO_SHAPE.RECTANGLE,
            "triangle": MSO_SHAPE.ISOSCELES_TRIANGLE,
            "diamond": MSO_SHAPE.DIAMOND,
        }
        if kind not in shapes:
            raise ValueError(f"unknown shape {kind!r}")
        self._check(x, y, w, h, f"shape:{kind}")
        shp = self._slide.shapes.add_shape(shapes[kind], Inches(x), Inches(y), Inches(w), Inches(h))
        if fill:
            shp.fill.solid()
            shp.fill.fore_color.rgb = self.theme.color(fill)
        else:
            shp.fill.background()
        if line:
            shp.line.color.rgb = self.theme.color(line)
            shp.line.width = Pt(1)
        else:
            shp.line.fill.background()
        shp.shadow.inherit = False
        tf = shp.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = tf.margin_right = Inches(0.10)
        tf.margin_top = tf.margin_bottom = Inches(0.05)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        if text:
            self._style_run(p.add_run(), text_size, text_color, bold)
            p.runs[0].text = text
        return shp

    def add_card(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        title: str,
        body: str | None = None,
        accent: str | None = None,
        fill: str = "wash",
        title_size: float = 12.5,
        body_size: float = 10.5,
    ):
        self.add_shape("rect", x, y, w, h, fill=fill)
        if accent:
            self.add_shape("rect", x, y, 0.055, h, fill=accent)
        pad = 0.22 if accent else 0.18
        cursor = self.add_text(title, x + pad, y + 0.16, w - pad - 0.16, title_size, "ink", True)
        if body:
            self.add_text(body, x + pad, cursor + 0.07, w - pad - 0.16, body_size, "body")

    def add_metric(
        self,
        x: float,
        y: float,
        w: float,
        value: str,
        label: str,
        caption: str | None = None,
        value_color: str = "navy",
        value_size: float = 30,
    ) -> float:
        cursor = self.add_text(value, x, y, w, value_size, value_color, True)
        cursor = self.add_text(label, x, cursor + 0.04, w, 11, "ink", True)
        if caption:
            cursor = self.add_text(caption, x, cursor + 0.04, w, 9.5, "muted")
        return cursor

    def add_connector(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        color: str = "muted",
        width_pt: float = 1.25,
        arrow: bool = True,
    ):
        for px, py in ((x1, y1), (x2, y2)):
            if px < -EPS or py < -EPS or px > CANVAS_W + EPS or py > CANVAS_H + EPS:
                raise OutOfCanvas(f"connector endpoint ({px:.2f},{py:.2f}) is off-canvas")
        self.shape_count += 1
        self._deck.total_shapes += 1
        conn = self._slide.shapes.add_connector(
            MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2)
        )
        conn.line.color.rgb = self.theme.color(color)
        conn.line.width = Pt(width_pt)
        if arrow:
            from pptx.oxml.ns import qn

            ln = conn.line._get_or_add_ln()
            tail = ln.makeelement(qn("a:tailEnd"), {"type": "triangle", "w": "med", "len": "med"})
            ln.append(tail)
        return conn

    def add_table_like_grid(
        self,
        x: float,
        y: float,
        w: float,
        rows: list[list[str]],
        col_weights: list[float] | None = None,
        row_h: float = 0.36,
        header: bool = True,
        size: float = 10.5,
        header_fill: str = "navy",
        zebra: bool = True,
    ) -> float:
        """A grid drawn from shapes.

        Native PPTX tables carry their own inherited styling and resist theming;
        drawn grids read better and let the composer control emphasis per cell.
        """
        if not rows:
            raise ValueError("grid needs at least one row")
        cols = len(rows[0])
        weights = col_weights or [1.0] * cols
        if len(weights) != cols:
            raise ValueError("col_weights length must match column count")
        total = sum(weights)
        widths = [w * (weight / total) for weight in weights]
        cursor = y
        for r, row in enumerate(rows):
            if len(row) != cols:
                raise ValueError(f"row {r} has {len(row)} cells, expected {cols}")
            is_header = header and r == 0
            lines_needed = max(
                len(fit_text(str(cell), widths[c] - 0.22, size, is_header))
                for c, cell in enumerate(row)
            )
            h = max(row_h, text_height(lines_needed, size) + 0.18)
            cx = x
            for c, cell in enumerate(row):
                fill = header_fill if is_header else ("paper" if (not zebra or r % 2) else "wash")
                self.add_shape(
                    "rect", cx, cursor, widths[c], h,
                    fill=fill,
                    line=None if is_header else "rule",
                )
                self.add_text(
                    str(cell),
                    cx + 0.11,
                    cursor + (h - text_height(lines_needed, size)) / 2,
                    widths[c] - 0.22,
                    size,
                    "paper" if is_header else "body",
                    is_header,
                )
                cx += widths[c]
            cursor += h
        return cursor

    def add_image(self, path: str, x: float, y: float, w: float, h: float):
        self._check(x, y, w, h, "image")
        return self._slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))

    def add_footer(self, text: str, page: int | None = None) -> None:
        y = CANVAS_H - 0.42
        self.add_text(text, 0.75, y, 9.5, 8.5, "muted")
        if page is not None:
            self.add_text(str(page), 12.05, y, 0.5, 8.5, "muted", align_h="right")

    @property
    def title_text(self) -> str:
        return self._title_text


@dataclass
class Deck:
    theme: Theme = field(default_factory=Theme)
    total_shapes: int = 0
    slides: list[Slide] = field(default_factory=list)
    _prs: object = None

    def __post_init__(self) -> None:
        self._prs = Presentation()
        # The canvas is set here, once, and nowhere else.
        self._prs.slide_width = Inches(CANVAS_W)
        self._prs.slide_height = Inches(CANVAS_H)

    def add_slide(self, background: str | None = None) -> Slide:
        if len(self.slides) >= MAX_SLIDES:
            raise DeckLimit(f"deck exceeds {MAX_SLIDES} slides")
        layout = self._prs.slide_layouts[6]  # blank
        raw = self._prs.slides.add_slide(layout)
        slide = Slide(_slide=raw, theme=self.theme, _deck=self)
        if background:
            bg = raw.shapes.add_shape(
                MSO_SHAPE.RECTANGLE, Emu(0), Emu(0), Inches(CANVAS_W), Inches(CANVAS_H)
            )
            bg.fill.solid()
            bg.fill.fore_color.rgb = self.theme.color(background)
            bg.line.fill.background()
            bg.shadow.inherit = False
        self.slides.append(slide)
        return slide

    def save(self, path: str) -> None:
        if not self.slides:
            raise DeckLimit("deck has no slides")
        self._prs.save(path)
