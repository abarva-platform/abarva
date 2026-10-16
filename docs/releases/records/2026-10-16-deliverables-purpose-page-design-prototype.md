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

This is the first implementation slice, not completion of the design brief.
The local layout probe is minimal synthetic test content, not a client artifact
or a generation from an approved evidence package.

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
- Native editable tables and a native line chart with an embedded workbook.
- Frame, citations, speaker notes, geometry and native-object checks on exported bytes.
- Minimal synthetic fixtures, two test suites and an offline probe script.
- Generated feature documentation and test-coverage census.

## QA / Validation

- PASS: 75 orchestrator suites / 1,097 tests.
- PASS: nine exported-file corruptions rejected: removed status, citation, notes,
  chart and table; tiny font; undersized text box; overlap; off-slide content.
  These are artifact mutation probes, not a claim of exhaustive source-code mutation coverage.
- PASS: changed-file ESLint.
- PASS: library orphan audit, no baseline change.
- PASS: route reachability, no new unreachable components or exports.
- PASS: census credits both new suites, covered files 2,902 to 2,904;
  uncovered files remain 166. Both are swept by the AI surface control catalog.
- PASS: local 11-slide probe and 2-page Charter rendered through bundled
  LibreOffice and inspected page by page. This validates those fixtures only.
- PASS: Node 24 typecheck, zero errors; release checks 11/11.
- PASS: export reachability, exactly the existing seven-declaration baseline.
- NOT RUN: real evidence-to-generation benchmark, visual fidelity judge,
  native PowerPoint acceptance of this prototype, signed-in product acceptance.

## Rollout Plan

Keep the flag off. Do not merge or deploy as completion of the design brief.
Finish the golden-source benchmark and design review, production chart binding,
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
- Tests inspect actual PPTX XML, the native chart values and its embedded workbook.
- Layout probe and comparison files remain in the local review package.
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
- Chart production inputs still need the governed read binding; the chart in the
  probe uses explicit synthetic test rows only.
- No source-matched golden comparison or end-to-end client generation was performed.
- Existing governed reference-deck payloads and public-source citation payloads
  are refused pending dedicated adapters, never silently discarded by this renderer.
- Long/unsupported labels, rows and graph topologies fail rather than inventing
  content, deleting edges or shrinking fonts. Those refusals need broader coverage
  before enrollment.
