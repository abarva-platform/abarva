# Rollback Runbook

## Purpose

Use this runbook when a release causes or may cause production harm. Rollback is
a controlled release action: preserve evidence, choose the smallest safe
reversal, validate after rollback, and record the result.

For the environment promotion model and T039 drill evidence checklist, see the
Release Environment and Rollback Drill Runbook:
`docs/runbooks/release-environment-and-rollback-drill.md`.

## Rollback Triggers

Rollback immediately or disable the affected feature when any of these are true:

- Cross-client data visibility or tenant isolation failure.
- Authentication, authorization, or role-gating regression.
- Production route crash on a core pilot path.
- Data-plane write, migration, or ingestion defect with client impact.
- AI output/export omits required human-decision or disclaimer controls.
- Post-deploy crawl reports P0 findings.

## Preflight

1. Identify release candidate: PR number, commit SHA, deployment id, release
   record, and affected files.
2. Identify blast radius: global control plane, specific client data plane,
   internal admin only, public demo, or experimental flag.
3. Decide rollback method:
   - Vercel deployment rollback for frontend/runtime regressions.
   - Feature flag or route disable when faster and safer.
   - Git revert for code-level rollback.
   - Database rollback only if a documented reverse migration or restore plan
     exists.
4. Confirm no newer deployment depends on the failing release. If it does,
   revert with a new PR instead of blindly restoring an old deployment.

## Vercel Rollback

1. Run the post-deploy evidence check if available:

   ```bash
   npm run crawl:post-deploy
   ```

2. For P0 findings, use the controlled rollback script in dry-run mode first:

   ```bash
   node scripts/crawl/auto-rollback.ts
   ```

3. Execute only after the incident commander approves:

   ```bash
   CRAWL_ENABLE_AUTO_ROLLBACK=true node scripts/crawl/auto-rollback.ts --execute
   ```

4. Re-run the failed smoke test or route check against the rollback target.

## Git Revert

1. Create a new branch from current `origin/main`.
2. Revert the merge commit or individual commit without touching unrelated work.
3. Add a release record for the rollback.
4. Run focused validation plus `npm run release:check`.
5. Open and merge the rollback PR after green CI.

## Database/Data-Plane Rollback

Never improvise a destructive DB rollback. Use the DB migration runbook and only
one of these paths:

- Reverse migration already reviewed and tested.
- Point-in-time restore approved for the affected data plane.
- Additive repair migration that preserves original rows and records lineage.

## Validation After Rollback

- [ ] Affected route/API no longer fails.
- [ ] Tenant/client isolation check passes.
- [ ] Auth role check passes.
- [ ] Release-control gate passes for rollback PR if code changed.
- [ ] Client-impacting evidence is attached to incident/release record.

## Evidence To Record

- PR and commit SHA.
- Deployment id before and after rollback.
- Triggering alert/check.
- Rollback command or revert PR.
- Validation command output.
- Known residual risk.
