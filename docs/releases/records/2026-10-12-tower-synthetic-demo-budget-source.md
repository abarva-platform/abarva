# Tower synthetic demo FY26 budget source

## Release ID

`2026-10-12-tower-synthetic-demo-budget-source`

## Status

`candidate`

## Plain-English Summary

Adds one exact-hash synthetic Finance extract to a staged Tower candidate. Its FY26 line-item budget is selected for demonstration only. The annual spend scenario remains separate, and neither source establishes independent Finance sign-off nor a budget variance. A separate named approval now permits this exact loaded version to be considered for Tower serving; the active version has not yet switched.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: a registered synthetic intake declares the selected Finance file and its exact hash. The file bytes are preserved from the synthetic source pack.
- Layer 2: a pure Finance adapter validates declared source IDs, year, period, six money fields, and the source's forecast-less-budget variance. It preserves field-level provenance.
- Layer 3: a declared aggregate metric, two source-recorded run/change component measures, and six source-specific measures per line item retain the source amounts and their distinct scenarios. The aggregate and components are marked nonadditive to one another and to the annual spend scenario.
- Layer 4: an inactive Cost row and executive summary label the selected amount and its existing-operations/new-work split as synthetic demo figures. No actual-versus-budget or modeled-spend-versus-budget variance is shown.

## Client Applicability

- All clients: no automatic change.
- Specific clients: one registered synthetic tenant has an inactive candidate with separate private load and Tower serving approvals for the exact assessment and source set.
- Internal only: candidate build and review.
- Public/demo only: the eventual Tower presentation must retain the synthetic-demo qualifier.
- Feature flag: none.

## Changes Included

- Selects one Finance extract by registered file name and exact SHA-256; a changed file cannot inherit its demo source-selection status.
- Keeps the linked legacy structured budget rows as an offline parity check. They are neither loaded nor added to the chosen Finance total.
- Preserves budget, Q2-YTD actual, forecast, commitment, invoice, and signed variance at their source-record grain. The reported variance is forecast less budget, not actual overspend.
- Preserves the source-declared split of the budget into existing operations and new work; the two components reconcile exactly to the selected total and are not an operating/capital classification.
- Keeps independent Finance-attested and claimable product amounts null. Existing evidence and cross-feed limitations remain.
- Records separate human-authored private load and Tower serving approvals bound to this exact assessment and source hash. The serving approval does not itself change the active selector.

## QA / Validation

- Node 24 focused source/physical tests: 13/13 passed. Focused reader/presentation tests: 91/91 passed. Focused ESLint and TypeScript `--noEmit` passed.
- Exact source hash, 70 declared IDs, six amount fields, signed variance equation, 31/39 run/change rows, component sum, nonadditivity, and canonical measure links are covered by fail-closed tests and physical-plan parity.
- Manifest validator and all 11 release-control gates passed. Full quote-mode Tower lineage reports the selected FY26 budget as `ONE_SOURCE`; the separate modeled annual spend remains `ONE_SOURCE` on a different basis.
- Dry physical validation and quality gate passed with 23 physically selected files, 3,934 raw source records, 1,480 canonical objects, 1,991 measures, and 1,595 projection rows across ten views. The 25-entry source manifest additionally includes two hash/count-only extracts.
- The private ACA stage succeeded with the exact approved assessment and source hash. A separate private readback matched 23 source files, 3,934 records, 1,480 objects, all ten page counts and fingerprints, the proof bundle, and the unchanged prior active selector. The pre-approval readback reported only the then-absent serving approval; a fresh ready preflight is required after this approval is merged and deployed.
- Review artifact: `/tmp/tower-v6-demo-budget-approved-review`. Assessment `tower-registry-candidate-2cbd979c8437468d`; source-set SHA-256 `ecbc7bbb1e812ba492e6a96efec32d26c844388e964abf20eee9ddf5916e5914`; exact candidate SHA-256 `1687ecedd033f6c95bdbb1bb6182eaa69b3743e14f1022ce43cba8ef2d1d2e6f`. The local dry path is review evidence, not durable private proof.

## Rollout Plan

The Tower-only schema lane and inactive private stage have passed their exact ledger, database, and Blob readbacks. Merge this approval through a protected PR and deploy only through the repo-owned ACA main workflow. Verify digest-pinned web, healthy 100% traffic revision, and worker parity. Run a fresh private preflight on that image, then use its exact proof for the controlled Tower selector promotion. Independently verify serving and review all six signed-in Tower sections before calling the candidate live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this candidate.
- Approved image digest: capture from the approval PR's successful main deployment before promotion.
- ACA runtime invariant and worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: after the separately approved serving promotion.

## Rollback Plan

The prior active assessment remains the rollback target and is retained. This approval PR changes no database rows or active selector. If promotion verification fails, use the exact promotion proof to restore the prior selector through the guarded Tower rollback path, then verify the restored serving fingerprints. The source selection can be withdrawn in a later reviewed registry release without treating either financial scenario as an actual.

## Audit Evidence

The final dry candidate, exact source file hash, source-to-measure parity output, quote-mode lineage, and focused tests are review evidence. The private stage and separate readback proof are retained in the private operator lane. They prove inactive physical loading, not serving; promotion and signed-in proof are still pending.

## Known Gaps

The selected budget is synthetic and has no independent Finance attestation. The Finance extract's period text does not make YTD actuals a full-year actual. The revenue-derived annual spend scenario has a different basis and cannot support a variance against this budget. Benefit claims, unapproved evidence, and missing identity links remain outside approved outcomes.
