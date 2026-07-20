# 2026-07-20-tower-chat-visual-artifacts — Tower aVa Visual Artifacts

## Release ID

`2026-07-20-tower-chat-visual-artifacts`

## Status

`deployed-with-follow-up-candidate`

## Plain-English Summary

Tower aVa chat now sends governed Tower answer tables and metric cards through the same typed aVa answer packet used by the shared chat renderer. This lets Tower render polished tables and Recharts-based visual artifacts in the chat instead of dropping structured content after Claude returns the answer.

## Layer Impact

- Global control lane: updates the shared Atlas/Tower chat adapter and Tower page wiring for all tenants with Tower chat enabled.
- Product UI: adds a Tower-specific adapter from the `/api/tower/cio-chat` visible answer contract into the governed `AvaAnswerPacket` contract.
- Data plane: no schema, migration, or ingestion change.
- Model/prompt path: no prompt relaxation and no post-model answer rewriting; this only renders structured artifacts already returned by the governed Tower answer path.

## Client Applicability

- All clients: Tower tenants using the shared Tower aVa chat surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- PR #5091: Tower aVa visual artifact packet and chat wiring.
- PR #5097: Tower quadrant chart generation from business-language quadrant rows.
- PR #5104: shared quadrant chart label polish for crowded 2x2 visuals.
- `src/lib/cio-tower/tower-chat-artifacts.ts` converts Tower visible-answer tables, tab tables, and metric cards into `AvaAnswerPacket` artifacts.
- `src/lib/cio-tower/tower-chat-artifacts.ts` also converts business-language quadrant rows such as `High Value / Lower Complexity` into deterministic Recharts quadrant points when a 2x2 chart is requested.
- `src/components/tower/TowerIndexPage.tsx` attaches the Tower artifact packet to chat responses.
- `src/components/atlas/AtlasChatPanel.tsx` forwards governed aVa packets into `AgentDock`.
- `src/components/agent-answer/AgentAnswerRenderer.tsx` renders crowded quadrant matrices with compact numbered markers plus a readable chart key, preserving full labels in tooltip/title text.
- `src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts` covers horizontal bar, line/trend, and 2x2 matrix artifact generation.
- `src/components/atlas/__tests__/AtlasChatPanel.test.tsx` covers artifact pass-through into the shared dock renderer.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts --runInBand` — passed.
- `npx jest src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts --runInBand` — passed.
- `npx eslint src/components/agent-answer/AgentAnswerRenderer.tsx src/lib/cio-tower/tower-chat-artifacts.ts src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — passed.
- `npm run release:check` — passed locally.
- ACA deploy and live signed-in 25-question Tower proof after PR #5097 — deployed revision `ca-abarva-web-lab-eastus--me9d32443`; runtime invariant passed; 25Q API proof passed 25/25 with 9.72/10 average and 7/7 visual-intent prompts returning structured artifacts. Browser proof passed for matrix, trend, and readout prompts with Recharts plus tables and no raw chart JSON.
- PR #5104 shared renderer label-key polish is pending CI, merge, ACA deploy, and final browser screenshot proof.

## Rollout Plan

Merge the PR to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`. After deploy, run signed-in Tower proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending ACA deploy.
- Latest deployed digest after PR #5097: `sha256:eb101a9d2faca95f86282d58e7e3cab250166aecf88ed7b571e77ea413fbb729`.
- ACA runtime invariant after PR #5097: passed.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous healthy `main` image through the ACA main lane. No data rollback is required.

## Audit Evidence

- PR URLs: https://github.com/abarva-platform/abarva/pull/5091, https://github.com/abarva-platform/abarva/pull/5097, https://github.com/abarva-platform/abarva/pull/5104
- CI run: pending.
- ACA deployment evidence after PR #5097: `/tmp/aca-main-deploy-29715096821-evidence-1784519432/runtime-invariant/runtime-invariant-proof.json`
- Live signed-in 25-question Tower report after PR #5097: `/Users/anand/Downloads/tower-ava-25q-live-2026-07-20T03-53-04-701Z/summary.md`
- Live signed-in browser visual proof after PR #5097: `/Users/anand/Downloads/tower-ava-25q-live-2026-07-20T03-15-57-385Z/ui-proof/matrix.png`

## Known Gaps

PR #5104 must deploy and be browser-proven to confirm crowded quadrant labels render as compact chart markers plus a readable key.
