# 2026-08-16-source-ava-viewed-stage-operating-context — Source aVa Viewed-Stage Operating Context

## Release ID

`2026-08-16-source-ava-viewed-stage-operating-context`

## Status

`candidate`

## Plain-English Summary

Source aVa now treats a viewed sourcing-event stage as the authority for operational asks about approval gates, templates, evidence collection, workshops, guidebooks, and next actions. This prevents aVa from answering those questions only from the event's later persisted stage when the user is inspecting an earlier stage view. The same prompt update also reinforces that pending value is not finance-confirmed value.

## Layer Impact

- `global-control-lane`: updates the shared Source aVa prompt for event-stage questions.
- Canonical model: no schema or data changes.
- Source adapters: no adapter changes.
- Client intake: no intake-template changes.

## Client Applicability

- All clients: yes, for Source aVa event sessions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`

## QA / Validation

- Targeted Source aVa polish test must pass.
- ESLint must pass for touched files.
- TypeScript must pass with `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`.
- `npm run release:check` must pass.
- Live proof requires the repo-owned ACA deploy and a post-deploy Source aVa hard-QA capture.

## Rollout Plan

Merge through PR, then deploy via the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: required before live-proof claim.
- Worker image invariant: required before live-proof claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source aVa captured-response QA.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow.

## Audit Evidence

- PR and CI checks for this release.
- ACA deploy evidence bundle and runtime invariant proof.
- Source aVa hard-QA captured-response report.

## Known Gaps

This does not change Source data, generated artifacts, or upload parsing. It only tightens aVa answer behavior for event-stage operating questions.
