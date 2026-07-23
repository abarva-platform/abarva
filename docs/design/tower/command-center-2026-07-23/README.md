# Tower Command Center — approved design (2026-07-23)

## Files

| File                               | What it is                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tower-command-center-design.html` | **The pixel contract.** Open it in a browser. Self-contained, runs standalone, all six tabs + seven sub-views + four drawers work.                                         |
| `ORIGINAL-artifact-bundle.html`    | The untouched artifact bundle as delivered. Kept only so the unpacking can be re-verified. Do not read this one — it is 1 MB of base64 fonts wrapped around the same page. |

## What was changed during unpacking

`tower-command-center-design.html` was extracted from `ORIGINAL-artifact-bundle.html`
(`<script type="__bundler/template">`, a JSON-encoded HTML string). Exactly three mechanical
changes were made so it opens standalone:

1. Inlined `@font-face` woff2 blocks removed; Fraunces / Inter / JetBrains Mono now load from
   Google Fonts. Same three families, same weights.
2. The AbarVa wordmark, referenced by bundle uuid, inlined as a `data:` URI.
3. `class Component extends DCLogic` renamed to `class TowerCommandCenterDesign` and
   self-bootstrapped on `DOMContentLoaded` (the artifact runtime is not present).

**CSS, markup, mock data, view logic, drawers and charts are byte-identical to the artifact.**
Rendering was verified tab-by-tab against the original bundle before this copy was committed.

## How to read it

- Lines beginning `/* ─` in the first `<style>` block: the **token palette the design was
  authored against**. It is NOT identical to `docs/design/strategic-moves/tokens.css` — six
  neutrals differ. See the handoff prompt.
- Second `<style>` block: ~290 lines of component CSS. This is the layout contract, verbatim.
- `<script type="module">`: `data()` holds the mock dataset; `viewCommand()` / `viewFunnel()` /
  `viewLanes()` / `viewAI()` / `viewEvidence()` / `viewActions()` are the six tabs;
  `progDrawer()` / `aiDrawer()` / `gapDrawer()` / `actionDrawer()` are the four drawers;
  `chart_week` / `chart_waterfall` / `chart_quad` / `chart_bubble` / `chart_lens` are the
  five Recharts figures.

## Standing rule

Where this file and any written spec disagree, **this file wins**.

Build instructions: `docs/codex-handoff/TOWER_COMMAND_CENTER_NEW_PAGE_PROMPT_2026-07-23.md`.
