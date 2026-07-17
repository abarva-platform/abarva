# 2026-07-16-legacy-context-language-burndown-pr1 — Legacy Context Language Burndown PR1

## Release ID

`2026-07-16-legacy-context-language-burndown-pr1`

## Status

`candidate`

## Plain-English Summary

This release makes the active legacy-context language gate pass by removing or neutralizing old architecture words from visible runtime copy and generated proof metadata, while recording remaining internal compatibility terms separately. It does not delete legacy folders, rename routes, load Azure/Postgres, promote candidate context, or deploy.

## Layer Impact

Release lane: `global-control-lane` for shared runtime language, audit, and proof guardrails.

Runtime UI language layer: Active Home, Knowledge/learn, Source, Moves, Tower, Intelligence, setup, and product copy no longer expose the blocked legacy words caught by the PR1 language gate.

Audit/proof layer: `audit:no-legacy-context-language` now separates blocked visible/generated/proof findings from allowed internal/test/API/admin compatibility uses and writes the PR1 burndown evidence bundle.

Data-plane layer: No Azure/Postgres mutation, tenant context promotion, candidate load, or deployment is included.

## Client Applicability

- All clients: Yes, for shared UI language and audit behavior.
- Specific clients: Meridian, SkyHarbor Air, and First Capital remain the currently proof-gated tenants for generated local context/advisory artifacts.
- Internal only: Audit reports and allowed-internal legacy-use inventory.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- Neutral visible copy replacements for old architecture terms in active runtime source.
- CXO story-block audit metadata now emits neutral artifact store labels instead of legacy dataset paths.
- `scripts/audit/legacy-context-retirement.mjs` now writes:
  - `reports/legacy-context-retirement/language-burndown-summary.md`
  - `reports/legacy-context-retirement/language-burndown-fixed.csv`
  - `reports/legacy-context-retirement/language-burndown-remaining.csv`
  - `reports/legacy-context-retirement/allowed-internal-legacy-uses.csv`
  - `reports/legacy-context-retirement/proof.html`

## QA / Validation

- Pass: `npm run audit:no-legacy-context-language`
- Pass: `npm run audit:knowledge-cxo-story-blocks`
- Additional validation is recorded in the final PR/agent summary for this slice.

## Rollout Plan

Merge through the normal PR path if approved. No deployment, data-plane load, tenant promotion, or Azure runtime mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Not invoked.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not claimed.

## Rollback Plan

Revert the PR1 commit. No database rollback is required because the release is local source/report/audit only.

## Audit Evidence

- `reports/legacy-context-retirement/language-burndown-summary.md`
- `reports/legacy-context-retirement/language-burndown-fixed.csv`
- `reports/legacy-context-retirement/language-burndown-remaining.csv`
- `reports/legacy-context-retirement/allowed-internal-legacy-uses.csv`
- `reports/legacy-context-retirement/language-audit.csv`
- `reports/legacy-context-retirement/proof.html`

## Known Gaps

Physical archive/delete and legacy route/schema/file renames are still out of scope. Remaining legacy terms are allowed internal/test/API/admin compatibility uses recorded in `allowed-internal-legacy-uses.csv`.
