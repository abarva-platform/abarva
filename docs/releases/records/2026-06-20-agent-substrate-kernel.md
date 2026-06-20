# 2026-06-20-agent-substrate-kernel — Agent Substrate Kernel Readiness

## Release ID

`2026-06-20-agent-substrate-kernel`

## Status

`candidate`

## Plain-English Summary

Adds a repo-owned contract and audit for the database substrate that must support client-specific agent answers. The change names the difference between dataset files, database rows, retrieval/index availability, browser rendering, and signed-in answer proof so weak answer paths cannot hide behind a working UI.

## Layer Impact

- `global-control-lane`: Adds shared repository governance for all client substrate and answer-readiness checks.
- `client-data-lane`: No client data is loaded or migrated, but the audit checks the completeness of committed synthetic v4 dataset packs.
- `internal-admin`: Gives operators a local audit command for substrate readiness before rollout or migration.

## Client Applicability

- All clients: The contract applies to every shared client runtime and every Home v2 v4 client pack.
- Specific clients: None.
- Internal only: The audit command and architecture document are internal repo controls.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/architecture/agent-substrate-contract.json`
- `docs/architecture/agent-substrate-kernel.md`
- `scripts/audit/agent-substrate-readiness.mjs`
- `package.json` audit script entry

## QA / Validation

- PASS — `node scripts/audit/agent-substrate-readiness.mjs` completed with `pass=30 warn=4 critical=0`.
- PASS — `npm run release:check` completed after this release record was updated with explicit pass/fail status.

## Rollout Plan

Merge to main. No database migration, no ACA environment variable change, no DNS change, no feature flag rollout, and no data migration. The audit becomes available to run locally and in CI.

## Deployment Authority

- Repo-owned deploy workflow: Not affected.
- Shared runtime mutators: None.
- Approved image digest: Not applicable; docs/scripts only.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this docs/scripts-only kernel. Future browser-logic pushdown and live answer-path changes require signed-in proof.

## Rollback Plan

Revert the PR. No runtime or data rollback required.

## Audit Evidence

- PR diff for the contract, audit script, package script, and release record.
- Local audit output from `node scripts/audit/agent-substrate-readiness.mjs`.
- Release check output from `npm run release:check`.

## Known Gaps

- Home v2 still has browser-side ask routing/ranking/answer assembly in `public/home-v2/app.js`; this is now explicitly flagged as pushdown-required.
- Home v2 dimensions are still hardcoded in `src/lib/home-v2/data.ts`; a 20th dimension needs a durable server/database registry before it is truly data-plane-native.
- The audit is repo-local. It does not prove Azure/Postgres committed rows, search index freshness, or signed-in browser answer quality.
