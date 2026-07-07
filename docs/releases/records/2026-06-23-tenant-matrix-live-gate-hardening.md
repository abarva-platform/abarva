# 2026-06-23-tenant-matrix-live-gate-hardening — Tenant Matrix Live Gate Hardening

## Release ID

`2026-06-23-tenant-matrix-live-gate-hardening`

## Status

`candidate`

## Plain-English Summary

The live tenant matrix proof now checks the hydrated browser text that signed-in users actually see, instead of only early HTML. It also times out slow Ask Ava calls and prints each tenant row as it completes, so the gate exposes real per-tenant failures instead of going quiet.

## Layer Impact

- `global-control-lane`: hardens the shared QA proof harness used before cross-tenant rollout decisions.
- No product runtime code changes: this does not alter Home, Intelligence, Tower, Source, Moves, data retrieval, or answer generation.

## Client Applicability

- All clients: applies to QA coverage for every tenant listed in `scripts/qa/tenant-matrix-gate.mjs`.
- Specific clients: Apex Retail, First Capital, SkyHarbor, Meridian, Lakeshore.
- Internal only: the script is an operator/CI proof harness.
- Public/demo only: no.
- Feature flag: no feature flag change.

## Changes Included

- `scripts/qa/tenant-matrix-gate.mjs`
  - Reads hydrated body text for the 19-dimension Home/Intelligence assertion when a Playwright storage state is available.
  - Adds `TENANT_MATRIX_ASK_TIMEOUT_MS` for bounded live Ask calls.
  - Streams tenant rows as each tenant completes.

## QA / Validation

- `node --check scripts/qa/tenant-matrix-gate.mjs` passed.
- Existing Clerk automation users were used to mint six signed-in Playwright states with `scripts/auth/prime-agent-client-auth-states.ts --refresh`.
- Live matrix run against `https://app.abarva.ai` proved Apex Retail and SkyHarbor fully green; First Capital, Meridian, and Lakeshore remain grounded but fail typed-visual output/readability checks as reported by the matrix.

## Rollout Plan

Merge to main. No Azure Container Apps image or feature flag rollout is required for the QA script itself, though the gate runs against the live ACA runtime.

## Deployment Authority

- Repo-owned deploy workflow: not applicable for this script-only QA hardening.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not changed.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: run `BASE_URL=https://app.abarva.ai node scripts/qa/tenant-matrix-gate.mjs` with `.auth/agent-*.json` states minted from Clerk automation users.

## Rollback Plan

Revert this script change. Product behavior is unaffected.

## Audit Evidence

- Syntax check: `node --check scripts/qa/tenant-matrix-gate.mjs`
- Live auth-state mint report: `reports/agent-client-auth/agent-client-auth-2026-06-23T02-25-28-126Z.md` (local artifact; not committed)
- Live tenant matrix output in the Codex session transcript.

## Known Gaps

The gate now surfaces that typed visual output is not reliable for all tenants. That product gap is out of scope for this QA-script hardening and should be fixed in the shared answer/exhibit generation path.
