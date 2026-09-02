# 2026-09-02-intelligence-stream-and-tenant-guards — Intelligence stream and context guards

## Release ID

`2026-09-02-intelligence-stream-and-tenant-guards`

## Status

`candidate`

## Plain-English Summary

Two module-level regression guards for Intelligence answer safety behaviour. Tests only — no runtime code changes.

One guard covers the governed follow-up fence. It asserts that the streaming fence filter removes the follow-up payload across the delivery shapes the streaming path can produce: one chunk, a marker split across chunk boundaries, an unterminated block from a truncated generation, and character-by-character delivery.

The second guard covers tenant isolation in the enterprise context spine. It derives tenant cases from the configured client list and asserts that the context spine for one tenant does not assemble another tenant's display name or distinctive alias.

## Layer Impact

Release lane: `global-control-lane` — test coverage for shared app behaviour. No runtime change.

- Layer 4 (Products — Intelligence): test coverage only.
- Layer 3 (Canonical model): unchanged.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: no behaviour change reaches any client.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/answer/__tests__/followups-leak-repro.test.ts` — new. Pins that the structured fence stream filter removes the governed follow-up payload across four delivery shapes.
- `src/lib/intelligence/__tests__/spine-tenant-isolation.test.ts` — new. Pins that the enterprise context spine never assembles another tenant's name, with tenant cases derived from code.

## QA / Validation

- `npx jest` on both new suites — 7 passed.
- `npx tsc --noEmit --pretty false` — 0 errors repo-wide.
- `npx eslint` on both added files — clean.

## Rollout Plan

Merge to main via PR (squash). Test-only; no runtime rollout, no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: unaffected by a test-only change.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. These tests add no client-visible behaviour.

## Rollback Plan

Revert the PR. Test-only, so revert carries no runtime or data risk.

## Known Gaps

- These guards do not prove the rendered browser path.
- These guards do not change runtime answer behaviour.
- These guards do not close follow-up rendering or session-context investigations.
- Neither guard asserts anything about rendered output in a browser; both operate at module level.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
