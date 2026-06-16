# AbarVa data-display tokens — the canonical standard for data / files / tables

Reference render: `abarva-intelligence-context-corpus-explorer.html` (Context/Corpus Explorer). Every surface that shows data, files, tables, facts, or a rendered deliverable must read like that. This is the source of truth; do not invent per-component colors or sizes.

## Fonts — two only
- **Serif — Georgia** (`Georgia,'Times New Roman',serif`): headings, names, big stat numbers. Weight **400** (never bold; size carries hierarchy).
- **Sans — DM Sans** (`'DM Sans',-apple-system,sans-serif`): all body, labels, table data, controls.
- Rule: *headings get bigger-and-serif; data labels get smaller-uppercase-muted.* Hierarchy = serif-vs-sans + size + muted color, **not weight**.

## Type scale
| Use | Size | Treatment |
|---|---|---|
| Body / base | **13.5px** / line-height 1.45 | DM Sans |
| Page / pane heading | 21px | Georgia 400 |
| Section / doc title | 16px | Georgia 400 |
| Big stat number | 20px | Georgia |
| **Table cell** | **12.5px** | DM Sans |
| **Table header** | **10px UPPERCASE**, letter-spacing .5px, muted | the headers recede |
| Card / section label | 11.5px UPPERCASE, .5px, muted, 600 | |
| Fact line | 12.5px | key muted · value 600 |
| Pill / badge | 10–10.5px | |
| Micro-label | 9–10px UPPERCASE | |

## Palette
```
--bg:#F8F7F4   --panel:#FFFFFF   --ink:#1B1A17   --muted:#6F6A61
--line:#E6E2DA (header/card borders)   --line2:#EFECE5 (row dividers)   --chip:#F1EEE7
```
Status (use for ALL state — never raw navy/teal):
```
fresh #3F7A5B   attention #B5852A   stale #B4513C   unknown #A39C90   review #7A5BA8   blue #39627F
```
Render status as **soft-bg pills**: `color: <status>`, `background: <status>14–18` (alpha hex), + an 8px status dot. Never loud fills.

## Tables — the clean recipe
- `border-collapse`, body **12.5px**.
- Header: **10px UPPERCASE muted**, **bottom border only** (`1px solid --line`); NO per-cell borders.
- Rows: **1px `--line2`** divider; **last row no border**; hover `#fbfaf6`.
- Cell padding **9–10px**.
- **`font-variant-numeric: tabular-nums` on every number** — the detail that makes numeric columns align.
- Clickable rows: `cursor:pointer`.
- Do NOT fill the header row navy/dark. Do NOT box every cell.

## Cards / facts / stats
- **Card**: panel bg, `1px --line`, radius 8px, padding 14–15px, uppercase micro-title.
- **Fact line** (`field: value`): muted key left, **600 value right**, thin `--line2` top border between; first has none.
- **Stat cell**: 20px serif value + 11px muted key.
- **Heat/coverage grid**: status-bg cells, corner micro-number + label.

## Rendered deliverables (DOCX / HTML the client opens)
- **Render the markdown properly** — headings, bold, ordered/unordered lists, nested items, and inline tables must survive. Never `split('\n') → <p>` (this strips structure and is the most common quality failure).
- HTML deliverable: max-width ~820–960px, 40px top padding, Georgia headings at the scale above, DM Sans body 13.5px, the clean table recipe, status pills for confidence, hairline section rules (`--line`), recommendation block left-bordered in **fresh-green** (not teal).
- DOCX deliverable: DM Sans body / Georgia display, numbered headings, banded-but-light tables (muted header text, no heavy gridlines), source register, confidential footer.
- Source register / confidence: confidence as a status pill, `as-of` muted, `[n]` tabular.

## Anti-patterns (seen in current code — fix on sight)
- `#0C1A3A` navy / `#2DD4C8` teal anywhere → use `--ink` + the status palette.
- Navy/dark table-header fills → muted uppercase headers, bottom border only.
- `bodyMarkdown.split('\n').map(<p>)` → real markdown rendering.
- Bold-for-hierarchy → serif + size + muted instead.
- Inter / Fraunces in deliverable output → DM Sans / Georgia.
