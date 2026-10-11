# 2026-10-10 — Moves reference deck standard

## Release ID

`2026-10-10-moves-reference-deck-standard`

## Status

`candidate — demo-only read-only preview; no live proof`

## Plain-English Summary

Adds an in-memory preview of validation and investment editions for the synthetic
demo Move. The route reads the signed-in value case, assumptions register,
approved ROM snapshot, approved public-source feed, phase capture, and Move
record through the existing tenant-scoped readers. A failed read is shown as
a gap. No artifact row, deliverable run, or sign-off is made. Every preview
response states that it was not persisted. The existing Move deck download
path remains active.

The PowerPoint exhibits are editable shapes and text. PDF and workbook companions
are rendered from the same edition specification in each request. Claude drafts
only neutral titles, answer bars, and notes through audited egress; its design
profile varies by edition, the Move's use-case category and phase stage, and
read availability. No raw capture,
register, ROM, or public-source text goes into that prompt. If egress fails,
those words are marked `draft words unavailable`.

The value engine now exposes credited and program value, measured when earned
and when paid, over the first three years. These figures are engine outputs,
not slide arithmetic. The investment value exhibit now shows those four bases,
their engine-computed ROI, and the case cost basis. The slide source line stays
readable while the exact source IDs and workbook cells remain in speaker notes
and the companion workbook.

## Layer Impact

- Release lane: `experimental`, enrolled only for the synthetic demo tenant.
- Layer 3: additive value-engine result fields; no schema or data mutation.
- Layer 4: flagged preview routes, native deck renderer, PDF and workbook companions, and
  file-level fidelity inspection. Existing product paths are unchanged.

## Client Applicability

- Specific clients: the synthetic demo tenant only. Signed-in users who may read the Move can request a
  non-persisted preview; figure visibility follows the register and value-case
  readers.
- Feature flag: `moves_reference_deck_v1` enrolls that tenant alone. Other
  tenants are refused before the Move is read.

## Changes Included

- Editable shape-and-text components for the reference archetypes, plus a
  structural fidelity judge that inspects the rendered PPTX and its notes.
- A validation-edition rule that blocks cost, plan, and solution material.
- Figure checks against an explicit governed ledger entry and workbook cell.
- Additive three-year value bases in the value engine.
- Signed-in in-memory PPTX/PDF preview, demo-only feature flag, and a dynamic
  prompt lens selected from the canonical Move archetype, phase stage, edition,
  and source readiness.
- Phase readback includes the accepted P3 owner record and P1/P2 captured
  wording. The approved ROM's unit-hour drivers are used when available.
- A prominent gap component replaces repeated blank ROM cells when the
  approval is absent or stale.
- Signed-in walk test requests both editions and formats, checks non-persistence
  headers, counts slides, checks workbook figure hashes, and uploads files with a fidelity-score JSON report.

## QA / Validation

- **Pass** — Synthetic reference-deck test renders every archetype and reopens the PPTX:
  no chart, table, or picture objects; shape-built tables and business-case notes
  are present. Planted missing chip, answer bar, source line, notes, and picture
  defects are detected. Invented figures and validation-edition violations block.
- **Pass** — Value-engine cases cover all four counting bases and zero-cost ROI handling.
- **Pass** — Three source mutations were applied one at a time and restored:
  removing the validation plan rule, the figure-ledger match, and editable
  table-cell markers each made the reference-deck suite fail.
- **Pass** — New synthetic edition tests render both editions from typed
  governed-read fixtures, inspect the physical PPTX, expose failed reads as
  gaps, and block an invented amount. The companion workbook test reads back
  each slide figure from its promised cell. Preview-route tests cover flag
  refusal, the response contract, both formats, and workbook mismatch refusal.
  A missing register source leaves a visible figure gap instead of inventing
  a source label.
- **Pass** — Local synthetic visual inspection of the big-number, three-year,
  architecture, and missing-ROM slides. The synthetic validation deck scores
  100; the investment deck scores 90 because the fixture intentionally lacks
  an approved ROM, so its release and ROM-hour exhibits remain incomplete.
- **Pass** — The in-memory PDF renderer was exercised with the same synthetic
  edition specifications; the files open at 11 and 22 landscape pages.
- **Pass** — The two new deck routes answer both tenancy refusals and unexpected
  authentication failures with named JSON errors. The catch-site ratchet remains
  at its previous ceiling.
- **Pass** — A synthetic-only Anthropic pptx Skill lab generated the validation
  edition. Both decks scored 100 on the same mechanical editability, notes,
  source-line, answer-bar and bounds checks. Visual review found that the Skill
  version crowds the title and footer on its dense value slide; the component
  version preserves space for both. This score does not measure visual fit.
- **Pass** — The same lab generated the 22-slide investment edition. Its
  component deck scored 100 on the neutral structural rubric and 90 on the
  product fidelity rubric because the fixture has no approved ROM. The Skill
  deck scored 40 on the neutral rubric: answer-area objects extend below the
  slide on 20 content slides. Visual review confirmed a clipped answer area
  on the three-year value slide. These are synthetic-only comparisons, not
  live Move scores.
- **Pending** — The signed-in walk after the repository-owned main deploy.

## Rollout Plan

Merge behind the demo-only feature flag once CI is green and the Moves
coverage-count collision check is clear. The repository-owned ACA main deploy
workflow owns rollout. After deployment, the signed-in walk must upload both
PPTX and PDF editions with scores. The preview route does not shift traffic or
persist deck artifacts.

## Deployment Authority

This candidate does not deploy, shift traffic, run data jobs, or issue direct
database commands. Audited model egress writes its standard audit record; the
preview makes no deck, deliverable, or sign-off write. Live status requires the
approved deploy workflow, digest checks, and signed-in proof.

## Rollback Plan

Remove the demo tenant from `moves_reference_deck_v1` or revert this candidate
through a pull request. The existing renderer remains the active deck path.

## Audit Evidence

The pull request, test output, synthetic rendered-file inspection, and local
visual review. No private reference file or client content is included.

## Known Gaps

- Live signed-in rendering has not run. The deck scores above come from a
  synthetic fixture; they do not prove the deployed route or current Move data.
- The companion workbook binds each slide figure to a cell on `Deck Figures`.
  The approved ROM workbook requires a current formula recomputation matching
  its approved snapshot; the live parity check is pending signed-in proof.
- The assumptions-register fields for decisive rows and confirming data need
  a separately reviewed migration and UI change; no migration is in this PR.
- The board-grade costed-case path is still active; its sunset remains open.
- The synthetic-only Anthropic Skill comparison is a lab script outside the
  product path. No client data was sent to the Skill. Only the standard audited
  words call is in the preview path.
- The Move, value-case, register, capture, ROM, and public-source readers do
  not return the `agent_ready`, retrieval, and cite-render evidence needed to
  assemble a model-visible context bundle. The prompt therefore uses only
  canonical use-case type and read-state controls. Context-specific factual
  prose awaits a governed bundle; no readiness is inferred from a successful
  product read.
