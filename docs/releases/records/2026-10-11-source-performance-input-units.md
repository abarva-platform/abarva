# Explicit units in synthetic performance inputs

## Release ID

`2026-10-11-source-performance-input-units`

## Status

`candidate` - source correction only; not applied to any database.

## Plain-English Summary

Five synthetic contract-depth performance CSVs now declare a unit for all 136 rows. Percentages, minutes, hours and counts are distinguished at the source. Existing observations, targets, dates, identifiers, credits and legacy value headers are unchanged. One alternate-schema metric can now pass the existing importer's offline preflight without adding a name-based inference rule.

The existing loaded-status summary is scoped to its historical input hash; corrected input is explicitly not reloaded. No new load approval is recorded.

## Layer Impact

- Release lane: `client-data-lane`, synthetic input artifacts only.
- Layer 1: explicit units in source inputs; no change to the owner-organized intake model or client template.
- Layer 2: existing parser behavior remains unchanged. Tests now require units in every checked-in performance fixture and verify alternate column aliases preserve them.
- Layers 3-4: no canonical write, projection refresh, financial change or UI change.

## Client Applicability

- Public/demo only: synthetic contract-depth fixtures.
- All clients: no live data or runtime change.
- Real client source data, private landing zones and production records are untouched. This does not approve a package replay.

## Changes Included

- Five performance CSVs: one additive `unit` column, 136 rows; all prior fields preserved.
- Existing package summary: historical load declaration retained against the old package hash, current correction marked not reloaded.
- Existing loader regression suite: covers both performance schemas and proves explicit units survive normalization. No new test file or CI census change.

## QA / Validation

- Red-first: explicit-unit fixture assertion failed on the old inputs.
- Loader suite: 31 tests passed after correction; the existing unit workflow executes this exact file.
- Structured CSV round-trip comparison verified every original field unchanged on all 136 rows. Before/after file hashes retained in private proof.
- Seven offline plans: six pass; one still refuses eight missing managed-service evidence inputs. The alternate-schema package now passes both adapter and projection gates. No gate was weakened.
- Plan mode runs before database connection; DATABASE_URL was empty. No verify or apply mode was used.
- Mutation: forcing normalization to overwrite a declared minutes unit with percent caused the new alternate-schema assertion to fail. Mutation restored; baseline rerun.

## Rollout Plan

Merge reviewed source artifacts. Any future apply requires a new exact-hash plan, live before-images, affected-record diff, scoped authorization, ACA data-build job, independent readback and signed-in acceptance. Prior approvals and prior input hashes do not authorize this correction's reload.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only; image publication does not apply these inputs.
- Shared runtime mutators: none.
- Approved image digest: not established for this source-only candidate.
- ACA runtime invariant and worker image invariant: required for any later runtime claim, not asserted here.
- Live signed-in proof required: after a separately approved data apply and independent readback, not after merely merging CSVs.
- Data mutation authority: a future scoped ACA data-build job; no apply in this release.

## Rollback Plan

Revert this PR through a reviewed PR to restore prior input artifacts. There are no database mutations to undo. A later authorized data load needs its own rollback plan.

## Audit Evidence

Private offline proof retains source hashes, original-field equality checks, plan output, quality-gate results and test output. No live database acceptance is claimed. Public records describe only the correction mechanism.

## Known Gaps

- Explicit units do not execute lever formulas, validate monetary claims, repair free-text citations or establish reporting cutoff and completeness.
- The base package still fails its evidence-quality gate.
- Historical generated previews are not refreshed by this source-only change and must not be treated as current load proof.
- Missing package summaries and broader workbook corrections remain separate slices.
