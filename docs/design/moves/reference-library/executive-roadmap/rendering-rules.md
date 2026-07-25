# REF_EXECUTIVE_ROADMAP — rendering rules

Mirrors the actual implementation in `svgRoadmapExhibit()`
(`src/lib/deliverables/orchestrator/renderers.tsx`). This is a specification of what's built, not
an aspirational target — the gold-standard/bad-example SVGs in this directory were authored against
these exact rules.

## Canvas

- Full grid width: `labelWidth (190) + colWidth (320) × horizonCount + 24` — scales with the number
  of horizons (max 4), so ~1,466px wide at full width.
- Row height: 56px per workstream lane, 8px gap between lanes.
- Header row: 40px, one cell per horizon.

## Typography

- Horizon header labels: 11px, weight 700.
- Workstream row labels: 11px, weight 700.
- Cell content: 9.5px, `var(--muted)`.
- Legend labels: 10px, `var(--muted)`.

No more than these two weights (700 for labels, 400/regular for content) — matching the "no more
than two font weights" rule from the broader visual spec.

## Shapes

| Element        | Shape                     | Fill / stroke                                                                                                                                                          |
| -------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Horizon header | Rounded rect              | `var(--chip)` fill                                                                                                                                                     |
| Grid cell      | Rounded rect (6px radius) | white fill, `var(--line)` stroke                                                                                                                                       |
| Decision gate  | Diamond                   | `#FDF6E3` fill, `#E8CF8A` stroke — same gate color already used by `svgAgentOrchestrationExhibit`'s policy/approval gates, for visual consistency across exhibit kinds |
| Dependency     | Dashed line               | `var(--muted)` stroke, `4 3` dash pattern                                                                                                                              |

## Colors (reuses the existing `SVG_TOKEN_HEX` palette — no second color system)

| Semantic               | Token                                         |
| ---------------------- | --------------------------------------------- |
| Current / out-of-scope | `var(--muted)`                                |
| Proposed / approved    | `var(--fresh)`                                |
| Risk / gate            | `#E8CF8A` / `#FDF6E3` (existing gate palette) |

## Layout algorithm (what the renderer actually does)

1. Split the model's free-text exhibit description into clauses (`exhibitClauses()`, shared with
   every other generic exhibit renderer).
2. Bucket each clause into one of the 6 workstream lanes by keyword match
   (`ROADMAP_WORKSTREAM_LANES`, same `assignToLanes()` pattern already used for the three
   architecture-view renderers) — a clause mentioning "governance" or "compliance" lands in the
   Governance & Controls row, for example.
3. Within each workstream's bucket, distribute clauses round-robin across the 4 horizon columns
   (at most 3 per cell) — this guarantees every cell in the grid renders something, even when the
   model's own wording clusters unevenly, the same design choice already made for architecture
   lanes ("use judgment — no clause matched this layer" placeholder text).
4. Draw one diamond gate marker between each pair of adjacent horizon columns.
5. Draw the dependency/gate legend below the grid.

## Legend (always present)

- Diamond icon + "decision gate"
- Dashed line + "dependency"
