# 2026-08-15-fact-lineage-proof-scope — Clarify Fact-Lineage Proof Scope

## Release ID

`2026-08-15-fact-lineage-proof-scope`

## Status

`candidate`

## Plain-English Summary

Clarifies that the Tower fact-lineage report proves Tower and tenant-intake headline metrics, not every number shown in every product surface. Source read-model, Contract 360, cube, and consumption figures must be proved through their owning Source projection or query with an explicit counting basis.

## Layer Impact

- Governance / operating instructions: narrows proof language so agents use the right evidence path for each metric family.
- Product layer: no runtime product behavior changes.
- Data layer: no schema, load, migration, or data-plane changes.

## Client Applicability

- All clients: applies to agent/operator proof discipline.
- Specific clients: none.
- Internal only: yes, instructions for product and data proof.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `AGENTS.md`: clarifies that `scripts/tower/fact-lineage-report.mjs` governs Tower and tenant-intake headline metrics.
- `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`: aligns the architecture enforcement table and "before you state a number" instruction with the tool's actual coverage.

## QA / Validation

- PASS: `git diff --check`.
- PASS: `node --check scripts/tower/fact-lineage-report.mjs`.
- PASS: `node scripts/tower/fact-lineage-report.mjs --metric promised_value_usd` completed in default quote mode and emitted `ONE_SOURCE 7`, confirming the script still runs with the scoped quote behavior.
- PASS: `npm run release:check` after adding this release record.

## Rollout Plan

Merge through a PR. No Azure Container Apps runtime rollout, data-plane load, migration, feature flag, or signed-in browser proof is required because this is documentation and governance wording only.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR to restore the prior broad wording. No data rollback or runtime rollback is required.

## Audit Evidence

- PR diff for `AGENTS.md`.
- PR diff for `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`.
- Local validation command output listed above.

## Known Gaps

This does not add Source metrics to `scripts/tower/fact-lineage-report.mjs`. Source read-model and cube figures still require their owning Source proof path.
