# Purpose export claim calibration and pagination

## Release ID

`2026-10-16-purpose-export-claim-calibration`

## Status

`draft` - not accepted, not merged, not deployed, no tenant enrollment.

## Plain-English Summary

Separates draft status, decision conditions, input-bundle gaps and factual negative
claims so honest limits do not fail the same check as unsupported business claims.
Preserves the prohibition on self-authorizing drafts. Input approval state is
carried independently from confidence and source presence. Also deduplicates
citations, balances overflowing tables and replaces the supplied print logos.

Four offline fresh-writing lineages, including audited editorial revisions,
render. Independent automated visual reviews remain below the required minimum
of 85 per artifact. This is an incomplete candidate, not an accepted export
release. Original responses, rejected attempts and prior reviews are retained.

## Layer Impact

- Primary release lane: `experimental`; layer 4 prompts, quality controls and exports.
- Shared impact: `global-control-lane`; approval metadata on evidence/register
  prompts, corrected print assets and removal of a repeated logo on ordinary
  reference-deck pages also affect shared export code. These are not all flag-gated.
- No layer 1 intake, layer 2 ingestion, layer 3 canonical values, approvals or
  tenancy changes. No database writes, uploads or migrations.

## Client Applicability

- Feature flag: `moves_purpose_page_design_v1`, tenant policy, empty enrollment.
- Experimental compositions remain limited to P1 Charter and P2 Discovery.
- All clients: shared metadata and export branding would apply only after a
  separately approved merge/deployment; this draft performs neither.
- Internal only: synthetic offline proof scripts and private review outputs.
- Public/demo only: none. Source documents and review narratives stay private.

## Changes Included

- Clause-aware absence classification and a labelled rejection corpus.
- Input approval-state propagation, retained authorization guard and bounded
  source-support checks. A planned input is not evidence of historical absence.
- Citation deduplication within claims, visible page citations and capped footers.
- Compact table widths, balanced continuation rows, reserved takeaway space,
  readable source groups, semantic status labels and computed chart headlines.
- Corrected transparent print assets with edge-alpha regression tests.
- Native Office text oracle and hash-gated fresh-source replay diagnostics.
- Local support for structured proposal rows and quoted negative claims; separate
  cells cannot combine a prohibited behavior and an owner label into proof of a fact.
- A shared scope-note layout contract, readable two-line scopes, adaptive table
  columns, compact row spacing and semantic status-table fallback before splitting.
- Charter table-width balancing, native bullets and section-aware page keeps.
- Source-bound chart measurement comparisons, alongside computed endpoint messages.
- Audited editorial revision mode for the offline proof harness. This is not
  production generation wiring or a substitute for independent acceptance.
- Distinguishes reporting conditions, double-counting restrictions and hypothetical
  consequences from asserted absence, with counterexample tests. Bundle-wide
  approval disclosures require the explicit state of every supplied input.
- Prevents measure-column headings from leaking into outcome rows; short charter
  condition lists stay together and governance notes stay with their tables.
- Removes redundant status prefixes and single-source table citation noise while
  retaining mixed-source row citations. Line-chart bounds are computed and disclosed.
- Preserves date-token roles so source month/day fragments cannot masquerade as
  years or quantities. Exact source-declared version references remain identifiers.
- Rebalances two-page tables across alternate readable column widths before
  rejecting a sparse continuation; the new fallback has a killed mutation test.
- Charter recommendations preserve native labelled decision bullets rather than
  flattening the recommendation into one paragraph.
- Tries readable 15/14-point compact tables before splitting, preserving every
  row and the reserved conclusion band. A five-row table now fits on one page.
- Requires explicit calendar units to remain attached to source-bound figures
  and reserves chart-caption height for unit, period and axis-bound disclosures.
- Distinguishes a page's coordinated non-approval limits and prospective value
  recognition from claims about historical collection or absent records.

## QA / Validation

- PASS: 76 orchestrator suites, 1,225 tests, including the labelled claim corpus,
  contradictory bundle gaps, authorization mutations, citation scope and logos.
- PASS: Node 24 typecheck with 8 GiB heap; changed-file ESLint; diff whitespace.
- PASS: release check, 11 of 11. Private review HTML checked at 1440 px and 390 px:
  full-page renders and golden comparisons load with local links; no console
  errors or horizontal overflow.
- PASS: native golden P1/P2 text, 432 blocks, zero claim-policy flags.
- LIMITED: the text oracle is not an authoring-schema pass. Native Office text
  does not contain the current authoring keys. The frozen narrative now renders
  through the page and geometry checks with explicit source-bound measurement
  metadata; it does not authorize arbitrary narrative over a chart.
- PASS: four fresh-writing outputs render at 150 dpi, with 39 total pages.
  Re-extraction verifies 130 source-slot bindings and 24 chart points against input
  hashes and row/line locators. This proves provenance, not that every citation supports
  its surrounding interpretation, nor financial validation.
- NOT ACCEPTED: independent automated Claude page scores are 74, 73, 72 and 72,
  below 85 in all four cases. Reviewed image hashes match the delivered pages.
  This is not human sign-off, first-attempt generation success or a claim that
  successive editorial revisions improve monotonically.
- NOT RUN: live product generation, signed-in export acceptance or runtime proof.
- Verification continued on 2026-10-17. A date-role mutation and a disabled
  pagination fallback were both rejected; unchanged valid responses still render.
  Disabling the compact-font fallback also fails the five-row single-page assertion.
- The broad Jest run emits an existing MaxListenersExceededWarning; all suites pass.

## Rollout Plan

No rollout in this draft. Keep the feature disabled and do not start later-phase
expansion. Resolve writing quality, citation-to-claim fit and production
typed-number/chart bindings before requesting enrollment. A later
release must include signed-in generation/export acceptance separately.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none executed.
- Approved image digest: none assigned.
- ACA runtime and worker invariants: not tested for this unshipped draft.
- Feature/env update path: no feature or environment update authorized by this record.
- Live signed-in proof required before any live-proven statement.

## Rollback Plan

No data rollback is needed. Keep enrollment empty. Revert shared metadata or
branding changes through a reviewed PR if they are later merged and regress.

## Audit Evidence

- `purpose-r4-controls.test.ts` and `__fixtures__/purpose-r3-claims.json`.
- `scripts/deliverables/proof/purpose-native-text-oracle.ts`.
- `scripts/deliverables/proof/purpose-fresh-source.ts` requires explicit per-input
  approval state, hash-matched sources and audited response provenance for replay.
- Private R4 package contains source bindings, original responses and refusals,
  native files, PDFs, all page images, automated reviews and output hashes.
- Source inputs remain not reviewed and not indexed; no agent-ready promotion.

## Known Gaps

- Writing still repeats conditions and leaves sparse or uneven pages. Review also
  found proposed owner assignments and evidence-status interpretations requiring
  correction. A sourced figure alone does not establish its claimed business use.
- Required improvements include route classification, explicit next decisions,
  source-use limitations and measurement-period clarity. The transfer readout
  still splits its cohort trend across pages and overuses a single table layout.
- Textual claim support is conservative, not general semantic entailment.
  Bundle completeness is explicit in offline tests; it is not inferred for live inputs.
- Native text validation does not establish every structural/page-policy oracle.
- Production numeric/chart adapters and live evidence-to-export proof remain open.
- This draft does not establish runtime flag state; it leaves the checked-in
  enrollment empty and makes no runtime changes.
