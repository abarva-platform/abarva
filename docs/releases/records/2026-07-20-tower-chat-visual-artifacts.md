# 2026-07-20-tower-chat-visual-artifacts — Tower aVa Visual Artifacts

## Release ID

`2026-07-20-tower-chat-visual-artifacts`

## Status

`candidate`

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

- PR: pending.
- `src/lib/cio-tower/tower-chat-artifacts.ts` converts Tower visible-answer tables, tab tables, and metric cards into `AvaAnswerPacket` artifacts.
- `src/components/tower/TowerIndexPage.tsx` attaches the Tower artifact packet to chat responses.
- `src/components/atlas/AtlasChatPanel.tsx` forwards governed aVa packets into `AgentDock`.
- `src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts` covers horizontal bar, line/trend, and 2x2 matrix artifact generation.
- `src/components/atlas/__tests__/AtlasChatPanel.test.tsx` covers artifact pass-through into the shared dock renderer.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts --runInBand` — passed.
- Focused combined Jest, ESLint, TypeScript, release check — pending final run.
- ACA deploy and live signed-in 25-question Tower proof — pending after merge.

## Rollout Plan

Merge the PR to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`. After deploy, run signed-in Tower proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending ACA deploy.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous healthy `main` image through the ACA main lane. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deployment evidence: pending.
- Live signed-in 25-question Tower report: pending.

## Known Gaps

Live production proof is pending until the PR is merged and deployed.
