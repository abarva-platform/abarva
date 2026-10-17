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

The four offline fresh-writing outputs render, but independent automated visual
reviews score 71, 70, 72 and 71 out of 100. The required minimum is 85 for each.
This is an incomplete candidate, not an accepted export release.

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

## QA / Validation

- PASS: 76 orchestrator suites, 1,182 tests, including the labelled claim corpus,
  contradictory bundle gaps, authorization mutations, citation scope and logos.
- PASS: Node 24 typecheck with 12 GiB heap; changed-file ESLint; diff whitespace.
- PASS: release checks 11/11. Private HTML review opens all 36 page images and
  linked files without missing assets or horizontal overflow at 1440/390 pixels.
- PASS: native golden P1/P2 text, 432 blocks, zero claim-policy flags.
- LIMITED: the text oracle is not an authoring-schema or all-page-validator pass.
  The older frozen chart narrative conflicts with the current computed-title
  requirement. That discrepancy remains open; it is not waived for this candidate.
- PASS: four fresh outputs render at 150 dpi. Current drafts have 36 total pages.
  Source re-extraction verifies 31 figure bindings and 24 chart points, with input
  hashes and row/line locators. This is traceability, not financial validation.
- NOT ACCEPTED: independent automated Claude page scores are below 85 in all four
  cases. Reviewed image hashes match the delivered pages. This is not human sign-off.
- NOT RUN: live product generation, signed-in export acceptance or runtime proof.

## Rollout Plan

No rollout in this draft. Keep the feature disabled and do not start later-phase
expansion. Resolve writing quality, the golden chart-policy discrepancy and
production typed-number/chart bindings before requesting enrollment. A later
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

- Writing repeats conditions, omits some supported comparisons and leaves sparse
  or uneven pages. All four scores remain below acceptance.
- Textual claim support is conservative, not general semantic entailment.
  Bundle completeness is explicit in offline tests; it is not inferred for live inputs.
- Native text validation does not establish every structural/page-policy oracle.
- Production numeric/chart adapters and live evidence-to-export proof remain open.
- This draft does not establish runtime flag state; it leaves the checked-in
  enrollment empty and makes no runtime changes.
