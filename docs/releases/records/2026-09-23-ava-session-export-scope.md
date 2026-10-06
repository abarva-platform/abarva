# 2026-09-23-ava-session-export-scope — Label aVa Session Export Scope

## Release ID

`2026-09-23-ava-session-export-scope`

## Status

`candidate`

## Plain-English Summary

This release makes aVa export scope explicit. The existing export controls and generated HTML/PDF artifacts now state that they export the aVa answer or chat session only, not the full workspace or Home walkthrough.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Updates shared aVa chat/export presentation used by product surfaces that embed the shared dock.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Applies to shared aVa chat-session export controls and generated answer/session exports.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`
- `src/lib/ava-answer/export/render-answer-html.ts`
- `src/lib/ava-answer/export/render-answer-pdf.tsx`
- Tests for the updated export controls and exported artifact scope notice.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/agent/__tests__/AgentDock.test.tsx src/lib/ava-answer/export/__tests__/render-answer-html.test.ts`
- PASS: `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/lib/ava-answer/export/render-answer-html.ts src/lib/ava-answer/export/render-answer-pdf.tsx src/lib/ava-answer/export/__tests__/render-answer-html.test.ts`

## Rollout Plan

Merge by PR to `main`, then deploy through the repo-owned ACA main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected Home/aVa surface.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow.

## Audit Evidence

- PR URL and CI run to be attached after PR creation.
- Deploy run and runtime invariant to be attached after release.
- Live signed-in proof to be recorded after deploy.

## Known Gaps

This release does not add a full workspace or Home walkthrough export. It labels the current aVa answer/session export honestly.
