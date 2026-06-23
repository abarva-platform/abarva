# 2026-06-23-moves-agent-tenant-binding — Moves Agent Tenant Binding

## Release ID

`2026-06-23-moves-agent-tenant-binding`

## Status

`candidate`

## Plain-English Summary

The dedicated Ava automation users now resolve to their intended tenant from their roster email alone. A Meridian automation session such as `meridian-agent@abarva.example.com` can no longer fall back to Apex Retail when Clerk metadata is missing or stale.

## Layer Impact

- `global-control-lane`: Shared session-routing and tenant inference now treat the existing automation roster as an explicit tenant binding source.

## Client Applicability

- All clients: Yes, for the six existing automation users in `AGENT_CLIENT_LOGINS`.
- Specific clients: Apex Retail, Meridian, First Capital, Northstar, SkyHarbor, and Lakeshore automation accounts.
- Internal only: Yes, automation/proof identities only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/client-config.ts`
- `src/lib/auth/access-routing.ts`
- `src/lib/auth/__tests__/tenant-isolation-probes.test.ts`

## QA / Validation

- Passed: `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts --runInBand` (65 tests).
- Passed: `npx eslint src/lib/client-config.ts src/lib/auth/access-routing.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts`.
- Passed: `NODE_OPTIONS=--max-old-space-size=8192 /Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/typescript/bin/tsc --noEmit`.
- Passed: `npm run audit:control-plane-purity:check`.
- Passed: `npm run release:check -- --base origin/main --head HEAD`.
- Passed: `E2E_BASE_URL=https://app.abarva.ai E2E_MOVE_ID=2dbed99d-cca5-4f80-978a-c1175cc1714f E2E_STORAGE_STATE=.auth/agent-meridian.json npx playwright test tests/e2e/moves-deliverable-redo.spec.ts --workers=1` (1 passed, 1 skipped pending `E2E_ARTIFACT_URL`).
- Passed: `npx jest src/lib/deliverables/__tests__/golden-bar.test.ts --runInBand` (5 tests).
- Passed: SkyHarbor signed-in smoke with `.auth/agent-skyharbor.json` against `https://app.abarva.ai/strategic-moves?client=skyharbor` (HTTP 200, authenticated, no Apex/Meridian/Lakeshore copy).
- Not run yet: merge/deploy and live signed-in Meridian move-creation proof.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deployment workflow, then rerun the live acceptance gate: `agent-meridian` signs in, creates a new Move, and the created Move resolves to `clientKey=meridian`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow for app.abarva.ai.
- Shared runtime mutators: Session tenant inference and pinned-client routing only.
- Approved image digest: To be recorded after ACA image build.
- ACA runtime invariant: Production runtime remains Azure Container Apps.
- Worker image invariant: No worker-specific change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian automation Move creation and tenant-binding readback.

## Rollback Plan

Revert this release commit and redeploy the previous ACA image. No schema or data migration rollback is required.

## Audit Evidence

- PR: to be created from `codex/moves-tenant-binding-live-run`.
- CI/deploy: to be attached after push.
- Live proof: pending.

## Known Gaps

The full P0→P5 Meridian Slice 7 run remains gated separately after tenant-binding proof. This release only hardens deterministic automation-session tenant binding.
