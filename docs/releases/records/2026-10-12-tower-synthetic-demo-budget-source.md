# Tower synthetic demo FY26 budget source

## Release ID

`2026-10-12-tower-synthetic-demo-budget-source`

## Status

`candidate`

## Plain-English Summary

Adds one exact-hash synthetic Finance extract to an inactive Tower candidate. Its FY26 line-item budget is selected for demonstration only. The annual spend scenario remains separate, and neither source establishes independent Finance sign-off or a budget variance.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: a registered synthetic intake declares the selected Finance file and its exact hash. The file bytes are preserved from the synthetic source pack.
- Layer 2: a pure Finance adapter validates declared source IDs, year, period, six money fields, and the source's forecast-less-budget variance. It preserves field-level provenance.
- Layer 3: a declared aggregate metric, two source-recorded run/change component measures, and six source-specific measures per line item retain the source amounts and their distinct scenarios. The aggregate and components are marked nonadditive to one another and to the annual spend scenario.
- Layer 4: an inactive Cost row and executive summary label the selected amount and its existing-operations/new-work split as synthetic demo figures. No actual-versus-budget or modeled-spend-versus-budget variance is shown.

## Client Applicability

- All clients: no automatic change.
- Specific clients: one registered synthetic tenant can build a new inactive candidate. The source selection is a demo decision, not a private load or serving approval.
- Internal only: candidate build and review.
- Public/demo only: the eventual Tower presentation must retain the synthetic-demo qualifier.
- Feature flag: none.

## Changes Included

- Selects one Finance extract by registered file name and exact SHA-256; a changed file cannot inherit its demo source-selection status.
- Keeps the linked legacy structured budget rows as an offline parity check. They are neither loaded nor added to the chosen Finance total.
- Preserves budget, Q2-YTD actual, forecast, commitment, invoice, and signed variance at their source-record grain. The reported variance is forecast less budget, not actual overspend.
- Preserves the source-declared split of the budget into existing operations and new work; the two components reconcile exactly to the selected total and are not an operating/capital classification.
- Keeps independent Finance-attested and claimable product amounts null. Existing evidence and cross-feed limitations remain.
- Replaces the previous exact-version private load approval with a separately human-authored approval bound to this assessment and source hash. Serving approval remains null.

## QA / Validation

- Node 24 focused source/physical tests: 13/13 passed. Focused reader/presentation tests: 91/91 passed. Focused ESLint and TypeScript `--noEmit` passed.
- Exact source hash, 70 declared IDs, six amount fields, signed variance equation, 31/39 run/change rows, component sum, nonadditivity, and canonical measure links are covered by fail-closed tests and physical-plan parity.
- Manifest validator and all 11 release-control gates passed. Full quote-mode Tower lineage reports the selected FY26 budget as `ONE_SOURCE`; the separate modeled annual spend remains `ONE_SOURCE` on a different basis.
- Dry physical validation and quality gate passed with 23 physically selected files, 3,934 raw source records, 1,480 canonical objects, 1,991 measures, and 1,595 projection rows across ten views. The 25-entry source manifest additionally includes two hash/count-only extracts. The private load preflight accepted the exact human-authored approval but the write guard still refused absent ACA job identity; no data write occurred.
- Review artifact: `/tmp/tower-v6-demo-budget-approved-review`. Assessment `tower-registry-candidate-2cbd979c8437468d`; source-set SHA-256 `ecbc7bbb1e812ba492e6a96efec32d26c844388e964abf20eee9ddf5916e5914`; exact candidate SHA-256 `1687ecedd033f6c95bdbb1bb6182eaa69b3743e14f1022ce43cba8ef2d1d2e6f`. The local dry path is review evidence, not durable private proof.

## Rollout Plan

Review and merge through a PR. Deploy only via the repo-owned ACA main workflow, then verify digest-pinned web, traffic revision, and worker parity. Complete the separate Tower-only schema lane with exact ledger and private readback proof. The new exact-version private load approval is recorded in the manifest; the private job still requires its ACA identity, isolated operator slot, and proof contract. Require private schema, database, and Blob proof before considering a separate serving approval and signed-in review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this candidate.
- Approved image digest: capture only after deployment.
- ACA runtime invariant and worker image invariant: verify after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: after a separately approved serving promotion.

## Rollback Plan

The current active assessment remains the rollback target. This candidate performs no database write or active-selector change. If a future private stage occurs, keep it inactive until independent readback and serving approval; do not delete the prior assessment. The source selection can be withdrawn in a later reviewed registry release without treating either financial scenario as an actual.

## Audit Evidence

The final dry candidate, exact source file hash, source-to-measure parity output, quote-mode lineage, and focused tests are review evidence only. They are not private staging or serving proof.

## Known Gaps

The selected budget is synthetic and has no independent Finance attestation. The Finance extract's period text does not make YTD actuals a full-year actual. The revenue-derived annual spend scenario has a different basis and cannot support a variance against this budget. Benefit claims, unapproved evidence, and missing identity links remain outside approved outcomes.
