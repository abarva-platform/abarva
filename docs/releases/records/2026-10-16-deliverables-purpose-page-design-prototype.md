# Purpose-driven P1/P2 export prototype

## Release ID

`2026-10-16-deliverables-purpose-page-design-prototype`

## Status

`candidate` - local prototype. Not merged, deployed, enrolled or live-proven.

## Plain-English Summary

Adds a disabled presentation path for P1 Charter documents and P2 Discovery decks.
The deck planner chooses a composition from structured content, splits oversized
groups and tables, preserves declared graph connections, and refuses unsupported
or unreadable inputs. It does not shorten source facts to make a page fit.
The Charter puts the requested decision first, places matching tables with their
sections and leaves a blank authorization record for a human reviewer.

This remains an incomplete, disabled implementation slice. The initial minimal
fixture is now supplemented by a full-content same-source renderer benchmark.
That benchmark freezes an already reviewed narrative and verifies its seventeen
synthetic input hashes. A separate offline experiment now generates fresh writing
from those sources and a second synthetic scenario. Neither experiment is a live
Move load or production-generation acceptance. Fresh output has not passed visual
or editorial acceptance; the flag remains disabled.

## Layer Impact

- Release lane: `experimental`.
- Layer 4 only: generation prompt metadata, presentation planning and export rendering.
- No intake, adapters, canonical values, tenancy, approval records or data-plane writes changed.
- Chart numbers are accepted only as explicit server-side input. No model-authored
  numeric table is automatically converted into a chart. The governed production
  chart-input binding is not implemented in this slice.

## Client Applicability

- Feature flag: `moves_purpose_page_design_v1`, tenant policy, zero tenants enrolled.
- Applies only to Moves `charter` and `discovery_report` when explicitly enabled.
- Flag-off generation retains the existing prompt and renderer dispatch.
- No change to P4 or other product surfaces.

## Changes Included

- Content-shaped deck planner and native PowerPoint renderer.
- Separate decision, role, option, process, layer, statement and register compositions.
- Native editable tables and line charts with embedded workbooks; paired charts
  retain separate units and explicit source-supported axis bounds.
- Page-specific scope notes, section labels, optional sourced takeaways, a cover
  with supplied edition/date, app branding and lighter role compositions.
- Compact variants and sparse-content advisory checks, without a claim of
  minimum meaningful occupied area or automatic compatible-page merging.
- Dedicated Charter renderer with native outcomes/measures tables, a reading
  guide, registered citation labels and blank human authorization fields.
- Frame, citations, speaker notes, geometry and native-object checks on exported bytes.
- Minimal synthetic fixtures, two test suites and offline probe/comparison scripts.
- Generated feature documentation and test-coverage census.
- Explicit semantic status statements and labelled conclusions, display-sized
  number comparisons, horizontal chart categories and unit captions.
- Shared-attribute option tables and purpose-grouped source registers with use
  and limitation columns. Charter title hierarchy, bold lead-ins, decision guidance
  and grouped citation labels are retained, including cover text.
- Content-height pagination for statements, full-label role-table fallback and
  strict table-body bounds. Presentation text removes supported Markdown emphasis
  syntax without deleting the words or mutating the original payload.

## QA / Validation

- PASS: 75 orchestrator suites / 1,109 tests.
- PASS: fifteen exported-file corruptions rejected: removed status, citation, notes,
  chart and table; tiny font; undersized text box; overlap; off-slide content.
  The full-content frame adds removed section, takeaway and classification checks.
  These are artifact mutation probes, not a claim of exhaustive source-code mutation coverage.
  Additional probes remove a semantic label or conclusion label and reduce a
  display number below the required size. Chart tests inspect horizontal category
  rotation and absent rotated axis titles in the exported OOXML.
- PASS: changed-file ESLint.
- PASS: library orphan audit, no baseline change.
- PASS: route reachability, no new unreachable components or exports.
- PASS: census credits both new suites, covered files 2,902 to 2,904;
  uncovered files remain 166. Both are swept by the AI surface control catalog.
- PASS: local 11-slide probe and 2-page Charter rendered through bundled
  LibreOffice and inspected page by page. This validates those fixtures only.
- PASS: full-content renderer benchmark produces five Charter pages and sixteen
  Discovery slides. Twenty-one side-by-side PNG pairs cover every page, including
  source appendices. Seventeen source hashes checked; twenty-four chart points
  read from the source CSV. Charter sources remain limited to its five phase-correct inputs.
- REVIEW PENDING: independent acceptance of the refined frozen comparison.
  Text-band occupancy is advisory, not a pixel-area fidelity score.
- COMPLETED, NOT ACCEPTED: fresh Anthropic writing and product rendering for
  two synthetic scenarios, each with a seven-page Charter and twenty-three-slide
  Discovery readout. The first scenario uses five phase-correct Charter inputs
  and seventeen Discovery inputs. The second uses one Charter brief and eight
  Discovery files; its large baseline workbook supplies only its Summary worksheet
  to the model, with omitted worksheets declared in the coverage proof.
- PASS, LIMITED: separate offline reconciliation of the second scenario's full
  baseline cohorts. This does not establish that the model consumed those rows.
- Fresh-output review found phase-framing regression, repetitive next-action
  pages, over-broad absence wording, sparse continuations and raw numeric display
  formatting. Exact source-slot binding does not prove semantic claim correctness.
  These findings block tenant enrollment despite passing structural tests.
- PASS: Node 24 typecheck, zero errors; release checks 11/11.
- PASS: export reachability, exactly the existing seven-declaration baseline.
- NOT RUN: production governed evidence-to-generation acceptance, automated visual fidelity judge,
  native PowerPoint acceptance of this prototype, signed-in product acceptance.

## Rollout Plan

Keep the flag off. Do not merge or deploy as completion of the design brief.
Repair fresh-writing and pagination findings, then obtain independent visual review and production chart binding,
remaining layout families and render-repair requirements before tenant enrollment.
The current renderer remains available with the flag off. Unsupported inputs on
the prototype path fail explicitly; there is no silent downgrade to a weaker export.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- No workflow dispatch, Azure mutation, database operation or shared traffic change performed.
- Approved image digest: none assigned to this candidate.
- Runtime invariant and signed-in proof required before a future live-proven claim.

## Rollback Plan

Keep/remove tenant enrollment from the feature flag, or revert the implementation
through a PR. No canonical data or approval record needs rollback.

## Audit Evidence

- `scripts/deliverables/proof/purpose-pages.ts` creates local probe artifacts and
  a structured inspection report without model calls or database access.
- `scripts/deliverables/proof/purpose-same-source.ts` verifies a local source
  manifest and declared references, then renders a frozen reviewed storyline.
  It refuses later-phase source references in the Charter and writes outside the repo.
- `scripts/deliverables/proof/purpose-fresh-source.ts` is a synthetic-only offline
  writing experiment using the validated context bundle and audited Anthropic
  egress wrapper. It hashes source extracts, binds numeric literals to declared
  source slots, records coverage and retains failed/truncated attempts. Objects
  remain not reviewed and not indexed; no agent-ready status is earned. Re-rendering
  requires a response hash from the same sources in the local egress audit.
- Local generation logs retain initial validation failures and two truncated
  responses. Successful rendering is not recorded as editorial acceptance.
- Tests inspect actual PPTX XML, the native chart values and its embedded workbook.
- [Synthetic comparison index](../../design/reviews/purpose-pages-2026-10-16/README.md)
  links every requested page pair. Only explicitly synthetic rendered images are
  public. Source files, manifests, original artifact IDs and native-file metadata
  remain in the local review package.
- Full reference packages remain private. A client-name scan alone is not a
  sufficient public-disclosure review of document metadata and source identifiers.

## Known Gaps

- The full 17-family catalog, schedule/Gantt layouts, variety rule and Word
  readout/decision-memo families are not implemented.
- Existing structured synthesis is extended; a separate first-pass storyline
  generation step has not been added.
- Generated HTML preview still uses the existing design and is not export-parity proof.
- Geometry checks are not raster clipping/contrast/empty-region detection. No
  two-pass automatic raster repair loop or fidelity score of 90 is claimed.
- Chart production inputs still need the governed read binding; the comparison
  reads the supplied synthetic CSV offline, not a production projection.
- Frozen same-source rendering and fresh offline writing are separate tests.
  Fresh writing is not integrated into a new two-pass production orchestration,
  and source-slot validation does not verify every claim-to-source entailment.
- Fresh Word pagination still leaves sparse continuation pages. Fresh decks
  repeat action pages and can regress from a phase readout to an earlier request.
  These are unresolved quality defects, not approved output characteristics.
- Sparse-content support remains partial. No universal 55% fill threshold,
  compatible-page merge planner or automatic raster repair is claimed.
- Existing governed reference-deck payloads and public-source citation payloads
  are refused pending dedicated adapters, never silently discarded by this renderer.
- Long/unsupported labels, rows and graph topologies fail rather than inventing
  content, deleting edges or shrinking fonts. Those refusals need broader coverage
  before enrollment.
