# 2026-07-09-ava-suggested-question-submit — aVa Suggested Questions Submit

## Release ID

`2026-07-09-ava-suggested-question-submit`

## Status

`candidate`

## Plain-English Summary

Changes default aVa suggested-question behavior so clicking a generated question submits it immediately instead of merely filling the composer. This matches the expected CXO chat flow: suggested follow-ups should continue the advisory session without requiring a second manual send action.

## Layer Impact

- `global-control-lane`: Updates shared `AgentDock` behavior used across aVa/chat surfaces.
- Presentation/workflow layer: Suggested questions become direct follow-up actions by default.
- QA layer: Adds a regression test for generated follow-up submission.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`
- `src/components/agent/__tests__/AgentDock.test.tsx`

## QA / Validation

- Pass: `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand -t "submits default suggested questions|exports the current chat session"`
- Pass: `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx`
- Pending: focused TypeScript check.
- Pending: post-deploy signed-in six-turn suggested follow-up audit.

## Rollout Plan

Merge to `main` and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No data or migration rollback is needed.

## Audit Evidence

- PR URL: Pending.
- Local tests: Pending.
- Live suggested-follow-up audit screenshots: Pending after deploy.

## Known Gaps

The local regression proves default suggestion clicks invoke `onMessage`; the full end-to-end proof still requires deployment because the live Intelligence page owns answer streaming, suggested-question generation, and the next-turn thread update. That post-deploy audit must click at least five generated follow-ups and confirm each click produces a new relevant answer, not a stale repeated response.
