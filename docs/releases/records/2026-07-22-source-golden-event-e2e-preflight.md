# 2026-07-22-source-golden-event-e2e-preflight — Source Golden Event E2E Preflight

## Release ID

`2026-07-22-source-golden-event-e2e-preflight`

## Status

`candidate`

## Plain-English Summary

This release candidate makes the Source SRC-004 golden-event browser test report the real environment blocker before it tries to sign in or acknowledge Responsible AI. The full governed test still requires a VNet-connected runner because SRC-004 reset, active-client lookup, and Source state all depend on the private Azure/Postgres lab database. The spec now skips with that explicit blocker from a laptop instead of failing first on a misleading Responsible AI acknowledgment 503.

## Layer Impact

- Test harness: improves the Source golden-event Playwright spec and shared Source auth error message.
- Product runtime: no runtime behavior changes.
- Data plane: no schema, seed, migration, or data mutation changes.

## Client Applicability

- All clients: no runtime effect.
- Specific clients: none.
- Internal only: Source QA/operators running the SRC-004 golden-event e2e.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `tests/e2e/source/golden-event-apex-ams.spec.ts`
  - Removes the laptop-side direct read of `source_event_approvals`.
  - Uses the governed approval API response plus rendered approval-ledger rows as the SOURCE-SHELL-003 evidence path.
  - Adds a local/VNet/database preflight that skips the serial mutating run when the private Azure/Postgres hostname is not resolvable.
- `tests/e2e/source/_auth.ts`
  - Includes the Responsible AI acknowledgment API response body in failures so setup blockers are diagnosable.

## QA / Validation

- PASS: `npx eslint tests/e2e/source/golden-event-apex-ams.spec.ts tests/e2e/source/_auth.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- PASS: `npm run release:check`
- HONEST BLOCK/SKIP: `BASE_URL=http://localhost:3001 npx playwright test tests/e2e/source/golden-event-apex-ams.spec.ts --project=chromium --workers=1 --reporter=list` returned 15 skipped because local DNS cannot resolve `pg-abarva-context-lab-001.postgres.database.azure.com`.
- Diagnostic proof: direct `pg` DNS probe from the laptop failed with `getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`.

## Rollout Plan

Merge to `main`. No Azure Container Apps runtime deploy is required for this test-harness-only change. The actual governed SRC-004 browser crawl must be run later from an approved VNet-connected test runner or equivalent private-runtime path.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes for the future full SRC-004 e2e claim; not produced by this harness correction.

## Rollback Plan

Revert the PR commit. No data rollback is required.

## Audit Evidence

- PR diff for the Source e2e spec and auth helper.
- Local validation output listed above.
- Future evidence needed: VNet-connected SRC-004 golden-event Playwright report under `reports/source-golden-event/<run-stamp>/`.

## Known Gaps

- The full governed SRC-004 e2e has not run green in this environment.
- A VNet-connected browser-capable runner is still needed to execute the reset, stage approvals, artifact acceptance, vendor coverage, and future-stage fallback checks end to end.
