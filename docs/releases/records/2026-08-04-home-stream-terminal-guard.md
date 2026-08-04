# 2026-08-04-home-stream-terminal-guard - Home Stream Terminal Guard

## Release ID

`2026-08-04-home-stream-terminal-guard`

## Status

`candidate`

## Plain-English Summary

Home streaming answers now fail closed with a visible blocked answer and a terminal `done` event if the governed read path cannot complete. This prevents a streaming response from ending after progress-only events and leaving the user with no answer.

## Layer Impact

Release lane: `global-control-lane`.

Product layer: updates the Home answer route behavior for streamed responses.

Agent context layer: preserves the existing governed-context boundary and does not add any retired data fallback.

## Client Applicability

- All clients: yes, for Home streaming answer behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/home/know/ask/route.ts`: adds terminal answer emission for Home streaming exceptions and close guards.
- `src/app/api/home/know/ask/__tests__/route-visible-contract.test.ts`: adds a regression test for streaming terminal behavior.

## QA / Validation

- PASS: `npx jest src/app/api/home/know/ask/__tests__/route-visible-contract.test.ts src/lib/agent/__tests__/visible-answer-contract.test.ts --runInBand`
- PASS: `npx eslint src/app/api/home/know/ask/route.ts src/app/api/home/know/ask/__tests__/route-visible-contract.test.ts src/lib/agent/visible-answer-contract.ts`
- PASS: `git diff --check`

## Rollout Plan

Merge through pull request. The repository-owned Azure Container Apps main deploy workflow builds and deploys the resulting web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: verify active revision, digest-pinned image, and 100% traffic after deployment.
- Worker image invariant: verify worker jobs remain aligned when the main deploy workflow updates them.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, rerun the Home/Tower streaming audit after deployment.

## Rollback Plan

Revert the PR and allow the repository-owned main deploy workflow to publish the previous behavior.

## Audit Evidence

- Pull request, focused Jest output, focused ESLint output, release check output, deployment workflow run, and post-deploy Home/Tower streaming audit.

## Known Gaps

This does not tune answer brevity or add native chart rendering. It only guarantees a terminal answer event for the Home streaming route.
