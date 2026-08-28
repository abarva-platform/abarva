# 2026-08-28-source-layer4-readback-fix - Source Layer 4 Readback Fix

## Release ID

`2026-08-28-source-layer4-readback-fix`

## Status

`candidate`

## Plain-English Summary

Fixes the Source Layer 4 operator readiness check so it validates canonical contract rows using the load-run boundary that actually exists on the table. This keeps the Layer 4 plan gate from failing before any projection work begins.

Also keeps the Layer 4 refresh path non-destructive by replacing views in place instead of dropping them first. This preserves dependent read-model views during the refresh and lets Postgres surface any incompatible view-signature change as an explicit operator failure.

## Layer Impact

Release lane: `client-data-lane`.

Layer 4 - Products/projections operator path. The change affects only the readiness/readback query used by the Source Layer 4 projection job and its regression test. It does not change intake files, adapter rows, canonical data, schemas, product UI, or tenant data.

## Client Applicability

- All clients: The operator readiness check is safer for any tenant-scoped Source Layer 4 run.
- Specific clients: No tenant-specific runtime behavior changes without a separately approved operator job.
- Internal only: The change is an internal operator-script fix.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/source/project-contract-depth-package-layer4.ts`
- `scripts/source/__tests__/project-contract-depth-package-layer4.test.ts`
- Non-destructive `CREATE OR REPLACE VIEW` refresh behavior for Source Layer 4 read models.

## QA / Validation

- `npx jest scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` - passed.
- `npx eslint scripts/source/project-contract-depth-package-layer4.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.test.ts` - passed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` - passed.
- `npm run release:check` - passed locally before adding this follow-up record; CI release gate validates this record against `main`.
- Follow-up validation after the non-destructive view-refresh correction repeated the same focused Jest, ESLint, and TypeScript checks successfully.

## Rollout Plan

Merge to main, deploy through the repo-owned Azure Container Apps main deploy workflow, then rerun the Source Layer 4 operator job in `plan` mode before any `apply`. If `CREATE OR REPLACE VIEW` reports an incompatible view signature, stop and treat that as a schema-change decision rather than using `DROP VIEW ... CASCADE`.

## Deployment Authority

- Repo-owned deploy workflow: Required before rerunning the operator job with this fix.
- Shared runtime mutators: No direct shared web runtime mutation outside the repo-owned workflow.
- Approved image digest: Captured after the main ACA deploy succeeds.
- ACA runtime invariant: Required after deploy before claiming the operator fix is live.
- Worker image invariant: Required before running the operator job.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after the later Layer 4 apply/verify path.

## Rollback Plan

Revert this PR and rerun the Source Layer 4 plan gate with the previous deployed image only if the prior query behavior is intentionally restored. No tenant data rollback is required because this change does not write data.

## Audit Evidence

- PR and commit for this release candidate.
- Local focused Jest, ESLint, TypeScript, and release-check output.
- ACA operator failure evidence for the prior plan attempt: `/tmp/source-contract-depth-package-layer4-plan-20260828T2052Z/summary.json`.
- ACA operator failure evidence for the destructive-drop apply attempt: `/tmp/source-contract-depth-package-layer4-apply-20260828T2120Z/summary.json`.

## Known Gaps

Layer 4 plan/apply/verify still need to be rerun after this fix is merged and deployed.
