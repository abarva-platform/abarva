# 2026-09-17-agent-chat-wide-artifacts - Wider expanded answer lane

## Release ID

`2026-09-17-agent-chat-wide-artifacts`

## Status

`candidate`

## Plain-English Summary

Expanded chat now gives structured answer artifacts more horizontal room while keeping conversational prose at a readable width. Pinned layouts are unchanged.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 shared chat presentation only. No answer, retrieval, data, approval, or action changes.

## Client Applicability

- All clients: Shared expanded aVa dock.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: widen the expanded agent turn for rich artifacts; center and constrain prose, byline, and evidence notices.
- `src/components/agent/__tests__/AgentDock.test.tsx`: check the artifact-lane and prose-width contract.

## QA / Validation

- Focused expanded-chat tests: 5 passed.
- Scoped lint, TypeScript no-emit, and release gate: passed (one existing hook-dependency warning).
- Full dock suite: 58 passed, three pre-existing failures remain on the base commit; no added failures.
- Signed-in visual proof: pending deployment.

## Rollout Plan

Merge by PR, then deploy through the repo-owned ACA main deploy workflow. No migration or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Check template, 100% traffic revision, and required worker images after deploy.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Compare a long structured answer in expanded chat before and after deployment, including horizontal scroll and composer placement.

## Rollback Plan

Revert this PR and redeploy through the repo-owned main workflow. No data rollback is involved.

## Audit Evidence

PR and CI URLs, deploy SHA/digest, and signed-in visual check to be attached after rollout.

## Known Gaps

Very wide tables may still require horizontal scrolling. Table content and answer brevity are separate concerns.
