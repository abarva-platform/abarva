# 2026-06-23-moves-agent-policy-uuid-fix — Moves Agent UUID Policy Fix

## Release ID

`2026-06-23-moves-agent-policy-uuid-fix`

## Status

`candidate`

## Plain-English Summary

The dedicated Ava automation users can now keep their tenant-scoped Moves admin permissions after the signed-in request JIT-provisions them into a real `persons` UUID. The previous fix covered Clerk fallback ids but not the post-provisioned UUID path, which left `agent-meridian` authenticated but still blocked from creating Moves.

## Layer Impact

- `global-control-lane`: Shared Programs authorization now recognizes exact agent-roster emails for their matching tenant whether the user id is a Clerk fallback or a UUID person id.

## Client Applicability

- All clients: Yes, limited to the six dedicated automation users in `AGENT_CLIENT_LOGINS`.
- Specific clients: Apex Retail, Meridian, First Capital, Northstar, SkyHarbor, and Lakeshore automation accounts.
- Internal only: Yes, automation/proof identities only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/auth/program-access-policy.ts`
- `src/lib/auth/__tests__/program-access-policy.test.ts`

## QA / Validation

- `npx jest src/lib/auth/__tests__/program-access-policy.test.ts --runInBand`: passed, 11 tests.
- `npx eslint src/lib/auth/program-access-policy.ts src/lib/auth/__tests__/program-access-policy.test.ts`: passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deployment workflow, then rerun the live acceptance gate: `agent-meridian` signs in, creates a Move, and the created Move resolves to `clientKey=meridian`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow for app.abarva.ai.
- Shared runtime mutators: Programs authorization policy only.
- Approved image digest: To be recorded after ACA image build.
- ACA runtime invariant: Production runtime remains Azure Container Apps.
- Worker image invariant: Worker jobs should use the same deployed image if the workflow updates them.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian automation Move creation and tenant-binding readback.

## Rollback Plan

Revert this release commit and redeploy the previous ACA image. No schema or data migration rollback is required.

## Audit Evidence

- PR: to be created from `codex/moves-agent-policy-uuid-fix`.
- CI/deploy: to be attached after push.
- Live proof: pending.

## Known Gaps

If the follow-up live proof creates a Move under a non-Meridian tenant, the remaining issue is active-client pinning in `resolveTenant` / `resolvePinnedSessionClientKey`, not Programs permission.
