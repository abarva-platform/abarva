# 2026-07-20-source-ava-artifact-standards-context — Source aVa Artifact Standards Context

## Release ID

`2026-07-20-source-ava-artifact-standards-context`

## Status

`candidate`

## Plain-English Summary

Source aVa now receives the same canonical artifact-standard guidance that the
Files workspace shows in the lifecycle matrix. When a user asks what an RFP
pack, scope memo, workbook, workshop/session output, or other deliverable
should look like, aVa can answer from the governed Source artifact profile:
audience, required exhibits, page/depth guidance, prompt model, token budget,
export route, evidence controls, source-register policy, and the rule that
AI-prepared drafts require human review before a client-final artifact is
accepted as final.

## Layer Impact

- `global-control-lane`: Adds deterministic artifact-standard context to the
  Source ask route and answer engine for all Source events.
- `client-data-lane`: No schema, migration, or new query. The route reuses
  already-loaded Source artifact registry rows plus the existing canonical
  artifact profile registry.

## Client Applicability

- All clients: Yes, for Source event aVa questions in the redesigned Source
  shell.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/artifact-lifecycle-matrix.ts`: exports reusable Source
  artifact-standard context rows.
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: injects artifact
  standards into live Source context as governed evidence rows.
- `src/lib/source/source-answer-engine.ts`: adds a deterministic Artifact
  Standards answer path for questions about document quality, required
  sections, page guidance, prompt/token budget, workshops/session guidance, and
  human approval.
- `src/lib/source/nexus-api.ts`: preserves the deterministic standards answer
  text through the quality shaper.
- Focused tests cover the context rows and aVa answer behavior.

## QA / Validation

- PASS: `npx jest src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/lib/source/__tests__/source-answer-engine.test.ts --runInBand`.
- PASS: `npx eslint src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/lib/source/source-answer-engine.ts src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/nexus-api.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts'`.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run release:check`.
- PENDING: PR checks for `https://github.com/abarva-platform/abarva/pull/5116`.
- PENDING: ACA deploy and signed-in Source aVa proof after merge.

## Rollout Plan

Open a PR, merge to `main`, deploy through the repo-owned Azure Container Apps
main deploy workflow, wait for the new revision to become healthy with 100%
traffic, verify the ACA runtime invariant, then run signed-in proof against the
Source event aVa chat.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this release.
- Approved image digest: To be produced by the ACA main deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment per shared runbook.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source event aVa question about the RFP
  artifact standard.

## Rollback Plan

Revert the PR and redeploy the prior healthy main revision through the ACA main
deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: `https://github.com/abarva-platform/abarva/pull/5116`.
- Local validation: To be added before PR.
- ACA deployment run: To be added after merge.
- Signed-in screenshot: To be added after deployment.

## Known Gaps

This slice gives aVa deterministic artifact-standard context. It does not
redesign the visible aVa dock, add new artifact-generation prompts, or change
the human client-final acceptance workflow.
