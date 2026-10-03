# Moves P2 Deck Depth Contract

## Release ID

`2026-09-27-moves-p2-deck-depth-contract`

## Status

`candidate`

## Plain-English Summary

Keeps P2 governed deck deliverables from being generated as too-short section lists. P2 Discovery and Root-Cause artifacts now request PowerPoint output by default, and the assembly layer deterministically normalizes an under-authored P2 deck to the governed slide story before quality validation.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** Products / Moves deliverable generation — changes request construction, deliverable format resolution, generated deck assembly, and the phase document format badge for P2 deck artifacts.
- **Layer:** Release control / tests — adds regression coverage for P2 deck format defaults and under-authored P2 deck normalization.

## Client Applicability

- **All clients:** Applies to any tenant that uses the governed Moves Approve & Build flow for P2 deck deliverables after deployment.
- **Specific clients:** None named.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None. This is a contract correction in the governed deliverable path.

## Changes Included

- `src/lib/deliverables/orchestrator/build-request.ts` — defaults Moves output formats from the deliverable profile, so PPTX-first profiles request PPTX at generation time.
- `src/lib/deliverables/orchestrator/section-generation.ts` — normalizes under-authored P2 discovery/root-cause decks to the governed P2 slide story using already-generated cited sections, recommendation, and next actions.
- `src/lib/programs/orchestrated-deliverable-map.ts` — treats P2 Discovery and Root-Cause artifacts as PowerPoint primary outputs.
- `src/lib/programs/deliverable-registry.ts` — records P2 Discovery and Root-Cause as PowerPoint artifacts in the Moves registry and exposes a PowerPoint format label.
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx` — renders the PowerPoint format badge.
- Tests under `src/lib/deliverables/orchestrator/__tests__/` and `src/lib/programs/__tests__/` pin the request/default-format contract and the under-authored P2 deck repair.

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts --runInBand` — Pass, 50 tests.
- `./node_modules/.bin/jest src/lib/deliverables/orchestrator/__tests__ src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts --runInBand` — Pass, 29 suites / 378 tests.
- `npx eslint src/lib/deliverables/orchestrator/build-request.ts src/lib/deliverables/orchestrator/section-generation.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts src/lib/programs/orchestrated-deliverable-map.ts src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts src/lib/programs/deliverable-registry.ts src/components/strategic-moves/PhaseDocumentsPanel.tsx` — Pass.
- `npm run typecheck` — Pass, `typecheck: clean`.
- `npm run audit:lib-orphans -- --update` — Pass; refreshed the generated reachability census after `deck-story-contract.ts` became product-reachable from the P2 assembly path.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — Pass.

## Rollout Plan

1. Merge the PR to `main`.
2. Deploy through the repo-owned Azure Container Apps main deploy workflow.
3. Verify the exact merge SHA's deploy, then confirm the ACA web template image, 100% traffic revision image, and required worker job images are digest-pinned and aligned per the runtime invariant.
4. Run signed-in product proof by building P2 deliverables through the Moves Approve & Build flow and confirming the deck artifacts pass quality, materialize for review, and can be governed through the existing sign-off path.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: do not use ad-hoc `az containerapp update` for shared web traffic.
- Approved image digest: captured by the main deploy workflow after merge.
- ACA runtime invariant: required before claiming the change live.
- Worker image invariant: required because deliverable generation is worker-executed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No database migration or data-plane rollback is required. Existing generated artifacts remain in their prior state; failed or blocked runs can be retried after rollback or after a corrected forward deploy.

## Audit Evidence

- PR URL: to be added after the PR is opened.
- Local targeted tests and broader orchestrator suite listed above.
- Typecheck and lint listed above.
- Post-merge deployment run, runtime invariant proof, and signed-in Moves P2 generation proof to be attached before marking released/live-proven.

## Known Gaps

- Candidate only until merged, deployed, and live-proven.
- This does not change sponsor sign-off policy or client-readiness scanning. It only prevents deck-contracted P2 artifacts from being too short to pass their own quality contract.
