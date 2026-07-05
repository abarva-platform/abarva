# 2026-07-05-source-p1-p2-pilot — Source Module P1/P2 Pilot Readiness Fixes

## Release ID

`2026-07-05-source-p1-p2-pilot`

## Status

`candidate`

## Plain-English Summary

Four UX and prompt-quality fixes to the Source module identified during the 2026-07-04 E2E audit at app.abarva.ai. No schema or data-plane changes.

1. **Gate Tab — "Mark met" signal clarity (P1-1):** When all gate criterion inputs are satisfied but the criterion has not been confirmed, the gap line now reads "Data present — confirm to clear · owner confirmation" and the Mark met button is promoted to primary (filled) style. Previously it read "Needs human review · owner confirmation" with a ghost button, giving no signal that data was already ready.

2. **Strategy Stage — generated draft visibility (P1-2):** Strategy deliverable cards now check both `source_event_artifact_states` (authored body) and `source_artifacts` (generated registry records) when displaying draft status. A generated strategy memo now shows "Draft exists (generated)" with green styling instead of the misleading "Draft needed."

3. **Stage preview banner (P1-3):** When the user navigates to a stage that is not their current active stage, a warning banner appears: "Previewing [Stage]. You are in the [Current Stage] stage. Clear all gate criteria there before working this stage." Previously there was no signal that the user was previewing a future or past stage.

4. **Sentinel chat thread persistence (P1-5):** aVa chat threads are now stored in `sessionStorage` keyed by `source_event_id`. Stage navigation (which changes the `?stage=` URL param and triggers a component remount) no longer wipes the chat history. The thread survives for the browser session.

5. **Sentinel chat — no gate echoing (P2-1):** Added instruction 6 to the system prompt: the model must not enumerate open gate criteria in answers unless specifically asked about gate status. Gate criteria are background context, not answer content.

6. **Evidence Tab — label precision (P2-2):** The Evidence Tab headline now reads "N of M required evidence items at usable" instead of "N of M sources at usable evidence," distinguishing required evidence items from arbitrary uploads.

## Layer Impact

- **global-control-lane** — UI behavior changes across the Source canvas (GateTab, StrategyStageView, UniversalCanvasShell, EvidenceTab). Affects all tenants that use the Source module.
- **global-control-lane** — System prompt change in `sentinel-chat-llm.ts`. Affects all Sentinel/aVa chat sessions in Source.
- No database migrations. No API route changes. No schema changes.

## Client Applicability

- All clients: All tenants using the Source module receive these fixes.
- Feature flag: None. Changes are unconditional.

## Changes Included

- `src/components/source/canvas/workspace-tabs/GateTab.tsx` — `deriveGapLine` fallthrough + Mark met button style promotion
- `src/components/source/canvas/strategy/StrategyStageView.tsx` — `registryArtifacts` prop, `registryCodeSet`, `hasRegistryDraft` passed to `StrategyDeliverableCard`, card status label update
- `src/components/source/canvas/UniversalCanvasShell.tsx` — sessionStorage chat persistence (two `useEffect` hooks); preview banner when `viewStage !== event.currentStageKey`; `registryArtifacts` threaded to `renderStageDocumentContent`
- `src/lib/source/sentinel-chat-llm.ts` — posture rule 6 added to system prompt
- `src/components/source/canvas/workspace-tabs/EvidenceTab.tsx` — headline label precision

## QA / Validation

- TypeScript compilation: pass (`tsc --noEmit` in worktree, no new errors introduced by these changes)
- ESLint: pass (`npx eslint src/components/source/ src/lib/source/sentinel-chat-llm.ts`)
- Unit tests: `npm run test:nav && npm run test:behaviors` — pass (no Source canvas unit tests cover these specific code paths; behavior tests unaffected)
- Manual smoke: changes are additive UI behavior fixes; no runtime data mutations
- CI: all checks expected to pass on PR merge (same stack as PR #4428 which passed 21/21)

**PASS** — no regressions identified in changed files.

## Rollout Plan

1. Squash-merge PR to `main`.
2. ACA auto-deploys on push to main (`ca-abarva-web-lab-eastus`).
3. No migration, no seed, no environment variable change required.
4. Verify at app.abarva.ai: open a Source event, navigate stages, confirm gate banner appears, confirm Mark met button is primary when inputs satisfied, confirm Evidence Tab label reads "required evidence items."

## Deployment Authority

- Repo-owned deploy workflow: ACA auto-deploy on `main` push (no manual image push required)
- Shared runtime mutators: None
- Approved image digest: produced by ACA CD pipeline post-merge
- ACA runtime invariant: `ca-abarva-web-lab-eastus` in `rg-abarva-controlplane-lab-eastus`
- Worker image invariant: N/A (no worker changes)
- Feature/env flag update path: None (no feature flags)
- Live signed-in proof required: Yes — QA at app.abarva.ai post-deploy

## Rollback Plan

Revert the squash-merge commit and push to main; ACA re-deploys the prior image automatically. No migration rollback needed (no schema changes).

## Audit Evidence

- PR: to be created on branch `fix/source-p1-p2-pilot`
- CI: all checks must pass before merge
- Source audit report: `~/Downloads/source-e2e-audit-2026-07-04.md`
- Prior P0 deploy: PR #4428 (merged 2026-07-04, ACA deployed)

## Known Gaps

- P1-4 (artifact download progress indicator) not addressed in this wave — export downloads are synchronous and fast for current document sizes; deferred to a future UX pass.
- `StrategyDeliverableCard` shows "Draft exists (generated)" only when `artifactKind` in `source_artifacts` exactly matches `d01_strategy_memo`. Archetype-specific keys (e.g., `ams_strategy_memo`) will not match. Mapping table deferred to next wave.
