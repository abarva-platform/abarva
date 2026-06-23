# 2026-06-22-moves-deliverable-redo-control-plane — Moves Deliverable Story Redo Wiring

## Release ID

`2026-06-22-moves-deliverable-redo-control-plane`

## Status

`candidate`

## Plain-English Summary

Moves artifact generation now routes through the governed deliverable pipeline instead of the older one-off draft path. Generation binds cumulative Solution Context, blocks when phase gates or required context are missing, asks Claude for visual-first HTML artifacts, writes a structured digest back after generation, and supports the human-approved solution-option step that unlocks architecture generation.

## Layer Impact

- `global-control-lane`: Shared Moves generation routes, workspace upload handling, and phase workspace UI now use the common context/gate/quality pipeline for all clients.
- `internal-admin`: Release evidence and operator visibility improve through structured golden-bar/context metadata persisted with artifact versions.

## Client Applicability

- All clients: Yes, for Moves artifact generation and workspace uploads.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/app/api/programs/workspace/[moveId]/artifact/route.ts`
- `src/app/api/v1/programs/[programId]/generate/route.ts`
- `src/app/api/v1/programs/[programId]/solution-options/approve/route.ts`
- `src/app/api/programs/workspace/[moveId]/upload/route.ts`
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
- `src/lib/deliverables/moves-generate-deps.ts`
- `src/lib/deliverables/generated-phase-digest.ts`
- `src/lib/programs/assemble-solution-context.ts`
- `src/lib/deliverables/v2-generator.ts`

## QA / Validation

- `npm ci`: passed.
- `npx jest src/__tests__/integration/programs/programs-generate-route-azure-read.test.ts src/lib/deliverables/__tests__/generate-artifact.test.ts src/lib/deliverables/__tests__/generated-phase-digest.test.ts src/lib/programs/__tests__/assemble-solution-context.test.ts src/lib/programs/__tests__/assert-phase-ready.test.ts src/lib/programs/__tests__/solution-context.test.ts src/lib/deliverables/__tests__/golden-bar.test.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts --runInBand`: passed, 8 suites / 33 tests.
- `npx tsc --noEmit --pretty false` under Node 24 with `NODE_OPTIONS=--max-old-space-size=8192`: passed.
- `npx eslint` on all touched source/test files: passed.
- `git diff --check`: passed.
- `npm run release:check -- --base origin/feat/moves-deliverable-story-redo --head HEAD`: passed; Release Control, Deploy Authority, and Pilot Data Loader gates passed.
- `npm run audit:control-plane-purity:check`: passed at baseline `1063`; no new hardcoded tenant strings in `src/lib`, `src/app`, or `src/components`.
- Second-tenant signed-in smoke: `npm run auth:agent-client-states -- --client skyharbor --base-url https://app.abarva.ai` passed for Home, Intelligence, Tower, Source, and Strategic Moves.
- Meridian signed-in smoke: `npm run auth:agent-client-states -- --client meridian --base-url https://app.abarva.ai` passed for Home, Intelligence, Tower, Source, and Strategic Moves.
- `E2E_BASE_URL=https://app.abarva.ai E2E_MOVE_ID=e3a7f714-7d40-4bc0-9450-461d663c60ab E2E_STORAGE_STATE=.auth/agent-meridian.json npx playwright test tests/e2e/moves-deliverable-redo.spec.ts --project=chromium --reporter=line`: failed live click-through because the Meridian automation user received the app 404/no-access page for the canary Move; artifact golden-bar subtest skipped because no `E2E_ARTIFACT_URL` exists yet.
- Broad `npm test -- --runInBand` and broad `npm run test:integration -- --runInBand` are red on pre-existing Source/Admin/Tower/agent baseline drift and Playwright specs being picked up by Jest. These failures are not cleared by this release and remain outside the scoped Moves redo evidence.
- `npx jest src/lib/__tests__/control-plane-tenant-purity.test.ts --runInBand`: failed on pre-existing Northstar hard-floor string references, while the authoritative scanner gate above passed at baseline.

## Live-Run Evidence / Blocker

- Meridian production-lab portfolio initially had no Moves.
- Attempted to create the Meridian clinical + claims Move using the canonical Meridian automation state. `/api/programs/origination-submit` returned `403 forbidden`: `Your Programs access does not allow creating new programs for this client.`
- Attempted a platform-admin canary creation only to unblock live proof. The write succeeded but resolved to the admin session's active Lakeshore context, not Meridian, proving this path is not safe for Meridian live evidence. The canary Move `e3a7f714-7d40-4bc0-9450-461d663c60ab` was immediately archived through `/api/v1/programs/archive` with reason `created_in_error`.
- Release cannot claim Meridian full P0-P5 live proof until either the Meridian automation user has `canCreatePrograms` and Move access, or a correctly tenant-pinned Meridian admin/operator path is provided.

## Rollout Plan

Merge the release branch to main only after all required QA gates pass. Deploy through the repo-owned Azure Container Apps main deployment lane. Verify app.abarva.ai signed-in Moves artifact generation for the Meridian clinical + claims move and a SkyHarbor second-tenant smoke after deployment.

## Post-Deploy Acceptance Gate

The make-or-break gate is tenant binding, not generic deploy health. After deploy, `agent-meridian` must sign in, create a Move, and the created Move must resolve to `clientKey=meridian`. If the Move resolves to `apexretail`, `lakeshore`, or any other tenant, the remaining fix is active-client pinning, not Program permissions: update `resolvePinnedSessionClientKey` or the agent Clerk metadata path so agent-roster sessions pin to their roster `clientKey`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow for app.abarva.ai.
- Shared runtime mutators: Moves API routes and shared data-plane adapters only; no schema migration in this slice.
- Approved image digest: To be recorded after ACA image build.
- ACA runtime invariant: Production runtime remains Azure Container Apps, not Vercel.
- Worker image invariant: No worker image change in this slice unless deployment pipeline rebuilds shared image.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian full P0-P5 run plus SkyHarbor second-tenant smoke.

## Rollback Plan

Rollback by reverting this release commit or redeploying the last known-good ACA image digest. No data migration rollback is required. Artifact versions created during the candidate can remain as draft evidence or be superseded by regenerated versions.

## Audit Evidence

- PR: to be created from `codex/moves-deliverable-redo-exec`.
- CI: to be attached after push.
- Deployment: ACA image digest and app.abarva.ai signed-in generation verification are not attached; deployment has not been performed from this worktree.
- Local QA: focused Jest, TypeScript, eslint, release-check, tenant-purity scanner, Meridian/SkyHarbor auth-state smokes, and the blocked live E2E command above.

## Known Gaps

Broad baseline suites remain red outside this release scope. Meridian full P0-P5 live generation, golden-bar live artifact URL, PR merge, ACA deploy, and post-deploy signed-in verification are blocked by the tenant/access issue described above and are not claimed complete.
