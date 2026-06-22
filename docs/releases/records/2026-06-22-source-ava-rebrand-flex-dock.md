# 2026-06-22-source-ava-rebrand-flex-dock — Source Ava Rebrand And Flexible Dock

## Release ID

`2026-06-22-source-ava-rebrand-flex-dock`

## Status

`candidate`

## Plain-English Summary

Source now presents the sourcing assistant as Ava in the visible intake and next-move surfaces. The new-source intake response window can render structured Ava output, including text, readiness metrics, a table, a chart, and a recommended next action. The shared agent dock now supports explicit left, right, top, bottom, expanded, and hidden layouts.

The Source answer engine also normalizes legacy Sentinel-branded evidence excerpts to Ava at presentation time, so persisted event context does not leak the retired name back into generated answers.

## Layer Impact

`global-control-lane`: AgentDock is shared UI infrastructure, so the new right-rail mode and updated mode labels apply anywhere the shared dock is used.

`public-demo`: Source intake and active Source event canvas copy now present Ava consistently in visible user-facing actions.

## Client Applicability

- All clients: shared AgentDock mode flexibility and Source-visible Ava copy.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/agent/AgentDock.tsx`: adds right-rail docking and clearer lock/hide mode labels.
- `src/components/source/SourceOriginatePage.tsx`: wires new-intake Ava turns to structured response parts.
- `src/lib/source/ava-intake-response-parts.ts`: pure structured intake response helper.
- `src/lib/source/intake-intent.ts`, `src/lib/source/stage-next-move.ts`, and `src/lib/source/learn/learn-nav.ts`: visible Sentinel copy changed to Ava.
- `src/components/source/SourceEventAgentCanvas.tsx` and `src/components/source/SourceEventsAgentDockView.tsx`: visible Source dock roles/errors adjusted to Ava language.
- `src/lib/source/source-answer-engine.ts` and `src/lib/source/mock-seed.ts`: legacy Sentinel evidence/context strings render as Ava in Source answers and seeded Apex event context.
- Tests/docs updated for the new label and six dock modes.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/ava-intake-response-parts.test.ts src/lib/source/__tests__/stage-next-move.test.ts src/lib/source/__tests__/intake-intent.test.ts src/components/agent/__tests__/AgentDock.test.tsx --runInBand`
- PASS: `npx jest src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/__tests__/ava-intake-response-parts.test.ts src/lib/source/__tests__/stage-next-move.test.ts src/lib/source/__tests__/intake-intent.test.ts src/components/agent/__tests__/AgentDock.test.tsx --runInBand`
- PASS: `npx eslint src/lib/source/source-answer-engine.ts src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/mock-seed.ts src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/source/SourceOriginatePage.tsx src/lib/source/ava-intake-response-parts.ts src/lib/source/__tests__/ava-intake-response-parts.test.ts`
- PASS: `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/source/SourceOriginatePage.tsx src/components/source/SourceEventAgentCanvas.tsx src/components/source/SourceEventsAgentDockView.tsx src/components/source/canvas/UniversalCanvasShell.tsx src/lib/source/ava-intake-response-parts.ts src/lib/source/__tests__/ava-intake-response-parts.test.ts src/lib/source/intake-intent.ts src/lib/source/learn/learn-nav.ts src/lib/source/stage-next-move.ts src/lib/source/__tests__/stage-next-move.test.ts`
- PASS: `git diff --check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run build`
- NOTE: the first local build attempt exposed that the isolated worktree's symlinked `node_modules` lacked the already-declared `@azure-rest/ai-document-intelligence` package and hit the default 4 GB heap limit. Installing dependencies locally in the worktree and rerunning with an 8 GB heap produced a successful build.
- NOT-RUN: signed-in browser verification and ACA deployment proof are pending until this candidate is merged/deployed.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps workflow build and deploy the new image, then verify a signed-in Source intake and Source event route in production.

## Deployment Authority

- Repo-owned deploy workflow: GitHub Actions Azure Container Apps deploy from `main`.
- Shared runtime mutators: none.
- Approved image digest: pending workflow output.
- ACA runtime invariant: existing ACA app and routing remain unchanged.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source intake structured selectors and active event Ava copy/dock modes.

## Rollback Plan

Revert the release commit and allow the Azure Container Apps workflow to redeploy the previous image. No migrations or data-plane changes are included.

## Audit Evidence

Pending: PR/commit, CI output, ACA deployment run, health check, signed-in browser screenshots or selector counts.

## Known Gaps

None known in the candidate scope.
