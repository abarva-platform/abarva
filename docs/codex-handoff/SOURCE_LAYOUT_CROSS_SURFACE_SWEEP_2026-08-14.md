# Source Layout Cross-Surface Sweep

## Scope

This sweep followed the Source Responses matrix fix and looked for the same
class of layout failure across Source, Home, Tower, Moves, and Intelligence:
fixed-width grids or tables that can force page-level horizontal overflow
instead of using contained scroll or responsive wrapping.

## Executed Slice

### Source Responses

Implemented and verified in this branch:

- Repeatable harness command: `npm run qa:source-responses-layout`
- Viewports measured: `1440`, `1292`, `1100`, `900`, `768`
- Result: pass after fixing the package cockpit requirement strip and table
  containment.

## Ranked Backlog

### 1. Source Responses Remaining Panel Sweep

Demo impact: High

Risk: Medium

Why: The Responses stage now has one repeatable harness, but several later
stage panels still contain wide tables or multi-card grids. The current harness
passes the composed fixture, but future fixture-rich data could expose similar
issues in file readiness, ingestion path, intelligence brief, BAFO, or scorecard
panels.

Implementable change:

- Extend `qa:source-responses-layout` with fixture variants for sparse,
  many-vendor, long-vendor-name, and parser-rich response sets.
- Add panel-level offender reporting by `data-testid`.

### 2. Source Workspace Preview Lenses

Demo impact: Medium

Risk: Low

Observed candidates:

- `src/app/(maestro)/source/preview/workspace/lenses/ExploreLens.tsx`
- `src/app/(maestro)/source/preview/workspace/lenses/RenewalsLens.tsx`
- `src/app/(maestro)/source/preview/workspace/lenses/ConcentrationLens.tsx`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`

Why: Several preview lenses use fixed minimum widths for SVGs, tables, and card
grids. Some are likely intentional analytical scroll regions, but they need the
same page-overflow guard to prevent the workflow canvas from being starved.

Implementable change:

- Add a preview-workspace layout harness with the same overflow-offender logic.
- Fix only regions that overflow the page outside an intentional scrollport.

### 3. Source Setup Admin Table

Demo impact: Medium

Risk: Low

Observed candidate:

- `src/app/(maestro)/source/setup/page.tsx`

Why: The setup page has an intentionally large table with `minWidth: 2560`.
That may be acceptable for admin review, but it should be explicitly contained
and measured so it does not create full-page overflow.

Implementable change:

- Add a setup-page harness.
- Confirm the large table scrolls inside its wrapper.
- Add `minWidth: 0` to containing grid/card regions if needed.

### 4. Tower Dense Matrix/Card Surfaces

Demo impact: Medium

Risk: Medium

Observed candidates:

- `src/components/tower/ProgramPressureCards.tsx`
- `src/components/tower/DependencyManagerPanel.tsx`
- Tower command-center matrix and chart regions.

Why: Tower has dense executive matrices and charts where overflow can quietly
break a demo at tablet or small-desktop widths.

Implementable change:

- Add a Tower layout pressure harness for executive dashboard routes.
- Validate page-level overflow separately from intentional chart/table scroll.

### 5. Moves Workflow Panels

Demo impact: Medium

Risk: Low

Observed candidates:

- `src/components/strategic-moves/MoveEvidenceNeedsPanel.tsx`
- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `src/components/strategic-moves/SessionPlaybookPanel.tsx`

Why: Moves has linear workflow panels with flexible cards, file cabinets, and
scrollable evidence tables. These are likely mostly safe, but they should be
measured because the workflow mental model depends on clear next-step layout.

Implementable change:

- Add a Moves panel harness focused on active step, evidence, files, and
  approvals regions.

### 6. Home / Intelligence Learning And Overview Surfaces

Demo impact: Low to Medium

Risk: Low

Observed candidates:

- `src/components/home/learn/WelcomeSection.tsx`
- `src/components/home/HomeOverviewV2.tsx`
- Intelligence app routes did not show a high-confidence fixed-width offender
  in the initial static sweep.

Why: Home and Intelligence have fewer immediate Source-demo blockers in this
scan, but large learning tables and overview grids should still receive the
same guardrail over time.

Implementable change:

- Fold Home and Intelligence into a shared layout pressure harness after Source
  and Tower are covered.

## Notes

This sweep deliberately did not make broad visual changes across unrelated
surfaces. The only code fix in this slice is the proven Source Responses package
cockpit overflow issue.
