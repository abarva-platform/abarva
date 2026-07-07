# 2026-06-27-moves-live-stabilization — Moves Live Stabilization

## Release ID

`2026-06-27-moves-live-stabilization`

## Status

`candidate`

## Plain-English Summary

This release fixes the immediate Strategic Moves correctness issues found in
the live audit. Tenant-pinned canonical client admins keep full visibility to
their own tenant's Moves after Clerk user provisioning resolves them to a real
person UUID. The Living Move reference surface no longer defaults a signed-in
client into another tenant's case. The Moves workspace also gains the missing
evidence-readiness API wrapper over the existing deterministic readiness
evaluator.

## Layer Impact

- `global-control-lane`: updates shared Moves access policy, Strategic Moves
  route behavior, and a tenant-scoped API route used by the workspace.
- `client-data-lane`: no schema or data changes. Reads remain scoped to the
  active tenant and existing program/evidence tables.

## Client Applicability

- All clients: yes, for tenant-scoped Strategic Moves access behavior.
- Specific clients: no client-specific code.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/auth/program-access-policy.ts`
- `src/lib/auth/__tests__/program-access-policy.test.ts`
- `src/app/(maestro)/strategic-moves/living/page.tsx`
- `src/components/moves/living/LivingMoveView.tsx`
- `src/components/moves/living/__tests__/LivingMoveView.test.tsx`
- `src/app/api/programs/workspace/[moveId]/evidence-readiness/route.ts`

## QA / Validation

- Pass: targeted Jest for program access policy, Living Move view,
  discovery readiness, artifact generation, and phase gate guard.
- Pass: scoped ESLint for touched source/test/API files.
- Pass: release check.
- Blocked: full TypeScript check is blocked by pre-existing missing type/module
  dependencies unrelated to this patch: `js-yaml`,
  `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- Not run yet: signed-in browser proof that Lakeshore no longer sees Apex
  content in `/strategic-moves/living`.
- Not run yet: signed-in browser proof that Lakeshore active Moves appear and
  direct detail routes resolve once deployed against the live data plane.

## Rollout Plan

Merge to main, build the exact git SHA into ACR, deploy through the approved
Azure Container Apps main lane, wait for the healthy revision, route 100%
traffic to it, then run the signed-in Lakeshore proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main lane.
- Shared runtime mutators: no direct DB/data-plane mutation.
- Approved image digest: assigned at deploy time.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the merged SHA at
  100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback the ACA web app to the previous healthy image/revision. No migration
rollback is needed because this release does not change schema or data.

## Audit Evidence

- Targeted test output.
- Release check output.
- Post-deploy ACA revision/image proof.
- Signed-in Lakeshore browser screenshots for portfolio/detail/living routes.

## Known Gaps

This release stabilizes the live path. It does not implement the later dynamic
Move Phase Workplan/adaptive rigor layer.
