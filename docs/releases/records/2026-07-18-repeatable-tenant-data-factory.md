# 2026-07-18-repeatable-tenant-data-factory - Repeatable Tenant Data Factory

## Release ID

`2026-07-18-repeatable-tenant-data-factory`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable tenant data factory command for FS Demo and Airline Demo. The command generates rich synthetic candidate context, validates the richness thresholds, creates dry-run candidate load plans, reconciles local data-plane layers, proves local module candidate consumption, and packages the required proof reports.

## Layer Impact

- Client data lane: packages candidate-only tenant data factory outputs for `first-capital-financial` and `skyharbor-air`.
- Control/proof lane: adds the `tenant:data-factory` orchestrator and factory proof reports.
- Runtime: no default runtime reader is changed.
- Data plane: no Azure/Postgres writes are performed. Candidate writes remain blocked until an approved non-prod data-build job path exists.

## Client Applicability

- All clients: no default runtime impact.
- Specific clients: FS Demo and Airline Demo candidate data only.
- Internal only: tenant-data factory command, validation reports, dry-run load plans, and proof HTML.
- Public/demo only: AbarVa-facing label contract is preserved as `FS Demo` and `Airline Demo`.
- Feature flag: none.

## Changes Included

- `package.json` adds `npm run tenant:data-factory`.
- `scripts/tenant-v3/tenant-data-factory.mjs` orchestrates generation, audit, dry-run load planning, local reconciliation, module candidate proof, default invisibility proof, and report packaging.
- `templates/<tenant-key>/guidance/` and `templates/<tenant-key>/data-dictionary/` add tenant-local template guidance and dictionaries.
- `datasets/tenant-inputs/<tenant-key>/interviews/` adds interview support files.
- `reports/<tenant-key>-data-factory/` and `reports/multi-tenant-data-factory/` contain the requested proof outputs and layer-by-layer HTML data flow.

## QA / Validation

- PASS: `npm run tenant:data-factory -- --tenant all --mode candidate --dry-run --skip-claude`
- PASS inside factory: synthetic generation for FS Demo and Airline Demo.
- PASS inside factory: synthetic richness audit.
- PASS inside factory: candidate load dry-run plans.
- PASS inside factory: local data-plane reconciliation.
- PASS inside factory: Home, Tower, Intelligence, Moves, and Source candidate consumption proofs.
- PASS inside factory: default runtime invisibility audit.
- PASS: `npm run audit:enterprise-naming`
- PASS: `NODE_PATH=/Users/anand/Projects/nexus/node_modules npm run validate:context-corpus:manifests`
- PASS: `npm run audit:architecture-rules`
- PASS: `NODE_PATH=/Users/anand/Projects/nexus/node_modules /Users/anand/Projects/nexus/node_modules/.bin/jest src/lib/__tests__/client-config-canonical.test.ts --runInBand`
- PASS: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge only. This is a source-controlled factory/proof release. Azure/Postgres candidate persistence requires a separately approved non-prod target and an approved ACA data-build job implementation. Active promotion is out of scope.

## Deployment Authority

- Repo-owned deploy workflow: not required for factory/proof files; a normal main merge may still build/deploy application code through the approved ACA workflow.
- Shared runtime mutators: none.
- Approved image digest: not applicable to this PR.
- ACA runtime invariant: not applicable unless a later main deploy is triggered.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: after a future approved candidate data-plane load, not for this factory-only PR.

## Rollback Plan

Revert this PR to remove the factory command, generated guidance/support files, and factory proof reports. No database rollback is required because this PR performs no Azure/Postgres mutation.

## Audit Evidence

- `reports/first-capital-financial-data-factory/summary.md`
- `reports/skyharbor-air-data-factory/summary.md`
- `reports/multi-tenant-data-factory/summary.md`
- `reports/multi-tenant-data-factory/proof.html`
- `reports/multi-tenant-data-factory/data-flow.html`
- `reports/multi-tenant-data-factory/command-results.csv`

## Known Gaps

- Final status is `BLOCKED_BEFORE_PROMOTION` because Azure/Postgres candidate writes are intentionally locked.
- No signed-in product page/API read-back from Azure/Postgres is claimed.
- No active tenant promotion is claimed.
