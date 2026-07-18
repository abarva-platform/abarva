# 2026-07-18-moves-phase-intelligence-binding-fallback — Moves Phase Intelligence Function Pack Fallback

## Release ID

`2026-07-18-moves-phase-intelligence-binding-fallback`

## Status

`candidate`

## Plain-English Summary

Moves Phase Intelligence now prefers the persisted Function Pack key, but can use the existing deterministic classifier as a read-only fallback for older Moves that clearly describe a curated function and do not yet carry `functionPackKey`.

## Layer Impact

- `global-control-lane`: shared Moves read-path behavior only. No database writes, migrations, candidate promotion, or gate changes.

## Client Applicability

- All clients: yes, where Moves Phase Intelligence is available.
- Specific clients: Meridian benefits immediately for legacy Agent Assist Moves missing a persisted Function Pack key.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/lib/programs/phase-intelligence-summary.ts`
- `src/lib/programs/__tests__/phase-intelligence-summary.test.ts`

## QA / Validation

- Pass: `npx eslint src/lib/programs/phase-intelligence-summary.ts src/lib/programs/__tests__/phase-intelligence-summary.test.ts`
- Pass: `npx jest src/lib/programs/__tests__/phase-intelligence-summary.test.ts --runInBand`
- Pending: typecheck, release check, PR CI, ACA deploy, signed-in proof.

## Rollout Plan

Merge by PR to `main`, then deploy through the repo-owned ACA main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the main deploy workflow
- Approved image digest: pending deploy
- ACA runtime invariant: pending deploy
- Worker image invariant: pending deploy
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. The fallback is read-only, so rollback has no data migration constraint.

## Audit Evidence

- PR URL: pending
- CI run: pending
- Live proof: pending

## Known Gaps

- This does not backfill `functionPackKey` onto old Moves. It only improves read-time Phase Intelligence behavior when the classifier can confidently bind a pack.
