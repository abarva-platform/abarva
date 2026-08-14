# 2026-08-14-ava-readiness-ledger — aVa readiness state ledger

## Release ID

`2026-08-14-ava-readiness-ledger`

## Status

`candidate`

## Plain-English Summary

aVa readiness now has a local machine-readable ledger that separates source evidence, loaded
readback, indexing, retrievability, and citation-render proof. In this safe lane the ledger records
local report evidence but marks loaded, indexed, retrievable, and cited as `not_verified`, so no
tenant-surface row is promoted to `agentReady` without the required proof chain.

No data-plane read/write, indexing job, retrieval query, signed-in citation proof, Active Tenant
Access promotion, or product/runtime change is included.

## Layer Impact

Release lane: `client-data-lane`. This is an offline readiness-control report.

- **Layer 1:** unchanged; local proof artifacts from prior audits are referenced only.
- **Layer 2:** existing dry-run results are summarized as readiness blockers where applicable.
- **Layer 3:** graph quarantine counts are summarized as readiness blockers where applicable.
- **Layer 4:** no product consumes the ledger; it only records whether aVa readiness gates are proven.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/ava-readiness-ledger.mjs` — adds the readiness ledger generator.
- `scripts/audit/__tests__/run-ava-readiness-ledger-tests.mjs` — verifies state separation and no
  automatic `agentReady` promotion.
- `package.json` — adds `npm run audit:ava-readiness-ledger`.
- `reports/ava-readiness-ledger-2026-08/` — report-only readiness ledger for all active tenants and
  five aVa surfaces.

## QA / Validation

| Check                       | Command                                                                                                        | Result                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Readiness ledger harness    | `node scripts/audit/__tests__/run-ava-readiness-ledger-tests.mjs`                                              | pass                                                                                                                  |
| Readiness ledger generation | `npm run audit:ava-readiness-ledger -- --tenant all --out reports/ava-readiness-ledger-2026-08`                | pass — 35 ledger rows, 0 loaded verified, 0 indexed verified, 0 retrievable verified, 0 cited verified, 0 agent-ready |
| Script lint                 | `npx eslint scripts/audit/ava-readiness-ledger.mjs scripts/audit/__tests__/run-ava-readiness-ledger-tests.mjs` | pass                                                                                                                  |

## Rollout Plan

Merge to `main`. No runtime rollout. Future approved data-plane readback, indexing, retrieval, and
signed-in cite-render proofs can update the ledger in separate gated lanes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: yes before claiming any row is live or agent-ready.

## Rollback Plan

Revert the squash commit and remove the generated readiness ledger. No tenant data or runtime state
needs rollback because none is mutated.

## Audit Evidence

- Ledger summary: `reports/ava-readiness-ledger-2026-08/summary.json`.
- Ledger rows: `reports/ava-readiness-ledger-2026-08/ava-readiness-ledger.csv`.

## Known Gaps

- The ledger is intentionally conservative until separate approved proof captures loaded,
  indexed, retrievable, and cited states.
- No aVa runtime route consumes this ledger in this release.
