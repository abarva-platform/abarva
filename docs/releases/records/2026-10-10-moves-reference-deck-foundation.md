# 2026-10-10 — Moves reference deck foundation

## Release ID

`2026-10-10-moves-reference-deck-foundation`

## Status

`candidate — dormant foundation; no tenant enrollment`

## Plain-English Summary

Adds an editable PowerPoint rendering path for governed Move business-case
editions. Its tables, KPI blocks, flows, architecture layers, bars, and timelines
are PowerPoint shapes and text boxes. The new path is dormant until a server-side
edition builder supplies a governed figure ledger and the companion workbook.
The existing Move deck download path remains the active path.

The value engine now exposes credited and program value, measured when earned
and when paid, over the first three years. These figures are engine outputs,
not slide arithmetic.

## Layer Impact

- Release lane: `global-control-lane`, dormant and not tenant enrolled.
- Layer 3: additive value-engine result fields; no schema or data mutation.
- Layer 4: an optional native deck renderer and file-level fidelity inspection.

## Client Applicability

- All clients: no active surface change.
- Synthetic demo tenant: no enrollment yet.
- Internal operators: may exercise the pure renderer on synthetic inputs in a
  local review; it is not a product entry point.

## Changes Included

- Editable shape-and-text components for the reference archetypes, plus a
  structural fidelity judge that inspects the rendered PPTX and its notes.
- A validation-edition rule that blocks cost, plan, and solution material.
- Figure checks against an explicit governed ledger entry and workbook cell.
- Additive three-year value bases in the value engine.

## QA / Validation

- **Pass** — Synthetic reference-deck test renders every archetype and reopens the PPTX:
  no chart, table, or picture objects; shape-built tables and business-case notes
  are present. Planted missing chip, answer bar, source line, notes, and picture
  defects are detected. Invented figures and validation-edition violations block.
- **Pass** — Value-engine cases cover all four counting bases and zero-cost ROI handling.
- **Pass** — Three source mutations were applied one at a time and restored:
  removing the validation plan rule, the figure-ledger match, and editable
  table-cell markers each made the reference-deck suite fail.
- **Pass** — Targeted Jest (88 tests), TypeScript, ESLint, library-orphan audit,
  route and export reachability, and manual check. Tenancy census and release
  check are run as candidate gates before a pull request.
- **Pass with gap** — A synthetic visual render was inspected; the generic fixture is sparse and
  correctly receives archetype-completeness findings. It is not a client deck.

## Rollout Plan

Keep the new renderer dormant. A later candidate must build both editions from
the approved synthetic Move data, bind every figure to a real workbook cell,
pass visual review and the fidelity score, and then enroll only the synthetic
demo tenant behind a dedicated flag. Shared runtime rollout remains with the
repository-owned ACA main deploy workflow.

## Deployment Authority

This candidate does not deploy, change runtime flags, shift traffic, run data
jobs, or touch a database. Live status requires the approved deploy workflow,
digest checks, and signed-in proof.

## Rollback Plan

Revert this candidate through a pull request. The existing renderer remains
the active deck path.

## Audit Evidence

The pull request, test output, synthetic rendered-file inspection, and local
visual review. No private reference file or client content is included.

## Known Gaps

- Neither edition is composed from live governed synthetic data yet. The
  product path therefore does not invoke this renderer.
- The companion value-case and assumptions workbook tabs, approved ROM detail
  binding, and exact workbook-cell readback remain to be built.
- The assumptions-register fields for decisive rows and confirming data need
  a separately reviewed migration and UI change; no migration is in this PR.
- The board-grade costed-case path is still active; its sunset remains open.
- The offline Anthropic Skill comparison has not run. No API data was sent.
- The current generic synthetic fixture does not meet the full archetype
  content standard, and its fidelity score reflects that gap.
