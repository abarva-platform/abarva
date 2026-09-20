# 2026-09-19 Overlap Treatment Is Narrative

## Release ID

`2026-09-19-overlap-treatment-is-narrative`

## Status

`candidate`

## Plain-English Summary

A field describing how an optimization opportunity's value is kept from double-counting against another had no constraint, and short placeholder words sat where full sentences sat elsewhere. The open question was whether it should become a controlled vocabulary. Measured against the canonical set, the answer is no: every real value names what the amount is kept separate from and under what condition, and neither half survives becoming an enum. This records that decision and fixes the surface defect the mixed appearance was hiding.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 read boundary plus one rendered surface.
- No schema change, no migration, no constraint added — the decision is that the column should not be constrained.

## Client Applicability

- All clients: one rendered line changes. Where the field is absent, the surface previously showed a sentence about approval under a heading asking about overlap; it now says the overlap has not been recorded.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Record the decision in the module that makes it: the field is a narrative, because an enum can carry neither what the amount is separated from nor the condition under which it is separated.
- Add a read-boundary presenter with three states — explained, unexplained, unrecorded — so a bare placeholder is never shown as though it were an explanation.
- Fix the rendered fallback. A missing overlap explanation was filled with a true sentence about approval state, which answers a different question than the heading asks.
- Detect a placeholder by shape rather than by a list of known words, so a new placeholder nobody has seen is caught the same way.

## QA / Validation

- PASS: new behavior suite passes 5 of 5; the affected view-model suite passes 28 of 28, unchanged.
- PASS: mutation harness catches 5 of 5 seeded defects, including both directions of the placeholder rule — accepting every placeholder as an explanation, and rejecting every real explanation as a placeholder.
- Measured before deciding: every value in the canonical opportunity module is a full sentence. The short placeholder values that made the field look like a half-built vocabulary appear only in test fixtures, which is why it read as both at once.
- The case covering the canonical values reads them out of that module's own source rather than from a fixture written here. The builders need inputs, and a fixture assembled for the test would only prove the rule agrees with what the test author chose.
- PASS: TypeScript (`npx tsc -p tsconfig.json --noEmit`, Node 24 with an 8 GB heap), exit code 0.
- PASS: scoped ESLint on all three files, exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow.

## Rollback Plan

Revert the three files. The surface returns to showing the approval sentence where an overlap explanation is missing. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: The rendered line changes, so a reader should confirm it once deployed. Nothing here claims that proof.

## Audit Evidence

- Measurement of every value in the canonical module and of where the placeholder values actually live.
- New and existing suite output.
- Mutation harness output covering both directions of the placeholder rule.
- TypeScript and lint exit codes.

## Known Gaps

The paired table's own overlap columns are untouched and were not measured; whether they carry the same shape is a separate question.

Test fixtures still use placeholder values, and those placeholders are what made the field read as a half-built vocabulary in the first place. The presenter now refuses to show one as an explanation, which contains the consequence without correcting the fixtures. Replacing them is worth doing and is not attempted here, because a fixture change that sweeps several suites is a different review.
