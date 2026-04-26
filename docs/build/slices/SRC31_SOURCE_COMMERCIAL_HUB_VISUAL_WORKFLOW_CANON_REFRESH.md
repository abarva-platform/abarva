# SRC31 — Source Commercial Hub Visual + Workflow Canon Refresh

Status: code_complete
Wave: wave-17
Branch: `wave17/src31-source-commercial-hub-workflow-canon`
Type: source-ui
Owner: Code lane (SRC31)

---

## Goal

Refresh the Source Commercial UI from a generic analytics dashboard into an
AbarVa commercial-sourcing workflow canvas. Add a new
`SourceCommercialWorkflowCanvas` shell that organises commercial
intelligence as a nine-stage commercial sourcing workflow with a thin
segmented stage nav, AbarVa visual canon, and prop-slot composition.

This slice is purely visual + structural. It does not introduce new
builders, new seed data, or live vendor ingestion. Existing Wave-15 and
Wave-16 surfaces (`SourceCommercialHub`, `SourceCommercialEventSection`,
`SourceCommercialExecutiveBrief`, `SourceCommercialActionQueue`) are
unchanged.

---

## Deliverables

1. `src/components/source/SourceCommercialWorkflowCanvas.tsx`
   - `'use client'` React component.
   - Exports `CommercialWorkflowStageId`, `CommercialWorkflowStage`,
     `COMMERCIAL_WORKFLOW_STAGES`, and
     `SourceCommercialWorkflowCanvas`.
   - Nine canonical stages: `brief`, `pricing`, `comparison`, `risk`,
     `bafo`, `readiness`, `missions`, `signals`, `decision`.
   - Thin segmented stage nav (28px height, 13px DM Sans), navy
     `#1B2B5C` active, transparent default, muted `#525866` text.
   - Header with mono-style eyebrow ("Commercial intelligence canvas"),
     24px ink title, and 14px body subtitle.
   - Stage description line under the nav.
   - White panel area renders the active slot or a deterministic
     placeholder caption when the slot is undefined.
   - Always-visible footer caveat: "Commercial intelligence canvas is
     deterministic and seed-backed. Live vendor ingestion is deferred."
   - Pure prop-slot composition — no imports of panel components, no
     new builders, no view-model dependencies.

2. `src/__tests__/integration/source/source-commercial-workflow-canvas.test.ts`
   - 14 deterministic source/type tests.
   - Confirms function export, exactly nine stage entries, unique IDs,
     full stage shape, AbarVa canon colors (navy `#1B2B5C`, warm
     off-white `#FBFAF7`, no teal `#14B8A6` or `#0E9F8C`), and
     deterministic caveat language.

3. `docs/build/slices/SRC31_SOURCE_COMMERCIAL_HUB_VISUAL_WORKFLOW_CANON_REFRESH.md`
   (this document).

4. Manifest updates in `docs/build/build-slices.json`,
   `docs/build/build-waves.json`, and
   `docs/build/production-readiness.json`.

---

## Workflow stages (canonical order)

| # | Id | Label | Short |
| - | -- | ----- | ----- |
| 1 | `brief` | Event commercial brief | Brief |
| 2 | `pricing` | Pricing normalization | Pricing |
| 3 | `comparison` | Vendor comparison | Compare |
| 4 | `risk` | Commercial risk | Risk |
| 5 | `bafo` | BAFO / negotiation | BAFO |
| 6 | `readiness` | Readiness | Ready |
| 7 | `missions` | Missions / actions | Actions |
| 8 | `signals` | Tower / Intelligence signals | Signals |
| 9 | `decision` | Before executive decision | Decision |

---

## Design canon followed

- Surface `#FBFAF7`, card `#FFFFFF`, hairline border `#E8E6E1`.
- Text: ink `#0A0C12`, body `#1F2433`, muted `#525866`.
- Single accent: NAVY `#1B2B5C`. No teal, green, purple, or neon.
- DM Sans only.
- Thin segmented nav, not stacked dashboard. No icon grid.
- Restrained chips. Generous whitespace.
- Deterministic-source caveat is always visible.

---

## Out of scope

- No new view-model builders.
- No new seed data.
- No live vendor ingestion or API wiring.
- No edits to `SourceCommercialHub`, `SourceCommercialEventSection`,
  `SourceCommercialExecutiveBrief`, or `SourceCommercialActionQueue`.
- No route mounting; host event surfaces choose when to render the
  canvas alongside the existing hub.

---

## Validation

```
node_modules/.bin/tsc --noEmit --pretty false
node_modules/.bin/jest src/__tests__/integration/source/source-commercial-workflow-canvas.test.ts --no-coverage
node_modules/.bin/eslint --max-warnings=0 src/components/source/SourceCommercialWorkflowCanvas.tsx src/__tests__/integration/source/source-commercial-workflow-canvas.test.ts
```

All gates must pass.
