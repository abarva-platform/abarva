# 2026-06-29-moves-real-module-stale-language-guard — Moves Real Module Stale Language Guard

## Release ID

`2026-06-29-moves-real-module-stale-language-guard`

## Status

`candidate`

## Plain-English Summary

This release closes the remaining real Moves module presentation gap caught by signed-in browser proof. It updates the phase workspace empty state and adds a Moves-only client-side wording guard so stale rail text from older sessions cannot keep showing gate-centric copy in the real signed-in module.

## Layer Impact

- `global-control-lane`: Updates shared AgentDock rendering behavior only when mounted on Moves surfaces.
- `public-demo`: Keeps the sanitized demo Move cleaner for recorded product videos.

## Client Applicability

- All clients: Moves detail pages using the shared AgentDock receive the wording guard.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: Normalizes stale Moves rail wording from gate-centric language to phase/readiness language.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`: Replaces the missed P5 empty-state gate copy with readiness-checkpoint copy.
- `src/components/agent/__tests__/AgentDock.test.tsx`: Adds regression coverage for stale Moves gate wording.

## QA / Validation

- Pass: scoped ESLint for touched files.
- Pass: focused Jest for AgentDock and Strategic Moves detail tests.
- In progress: TypeScript `tsc --noEmit`.
- In progress: `npm run release:check`.
- Not run yet: signed-in browser crawl on `https://app.abarva.ai/strategic-moves/49c77bca-471d-4398-8b13-fa8ed1487597`; this must run after ACA deployment.

## Rollout Plan

Merge to `main`, build an Azure Container Apps image from the merge SHA, deploy to `ca-abarva-web-lab-eastus`, assign 100% traffic to the healthy revision, then run signed-in browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy lane.
- Shared runtime mutators: None.
- Approved image digest: To be recorded after ACR build.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` healthy with 100% ingress on the new revision.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by assigning ACA ingress traffic to the prior healthy revision or reverting the merge commit and redeploying.

## Audit Evidence

- PR URL: To be added.
- CI run: GitHub checks on PR.
- Live proof: Downloads proof folder and screenshots after deployment.

## Known Gaps

Live signed-in proof is still pending until the final image is merged, built, and deployed through Azure Container Apps. The change is intentionally scoped to user-facing Moves chrome; it does not rename the internal gate/governance domain model, API route names, or stored historical artifact text.
