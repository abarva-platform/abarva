# 2026-08-16-source-ava-event-provenance-wording — Source aVa Event Provenance Wording

## Release ID

`2026-08-16-source-ava-event-provenance-wording`

## Status

`candidate`

## Plain-English Summary

This release tightens Source aVa prompt instructions for event-level provenance questions. When a user asks what the sourcing event learned from upstream context such as Foundation or Vendor 360, aVa must name those sources explicitly and explain which facts changed scope, value, evidence, scoring, or approval posture. The fix stays in the prompt/context contract and does not add a response scrubber.

## Layer Impact

- Lane: `global-control-lane`
- PRODUCTS: Source aVa answer generation is refined for event provenance questions. No product route, workflow state, chart renderer, or visible UI layout is changed.
- CANONICAL MODEL: No change.
- SOURCE ADAPTERS: No change.
- CLIENT INTAKE: No change.

## Client Applicability

- All clients: Yes, for Source aVa event chat responses.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`

## QA / Validation

- PASS: Focused Source aVa prompt regression test.
- PASS: ESLint on touched files.
- PASS: TypeScript compile.
- PASS: Release check after this record is corrected.
- REQUIRED AFTER DEPLOY: Live signed-in Source aVa hard-QA rerun.

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Not allowed.
- Approved image digest: To be captured from the ACA deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun Source aVa hard-QA.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow.

## Audit Evidence

- PR URL and merge commit.
- GitHub Actions deploy run.
- ACA runtime invariant proof.
- Live Source aVa hard-QA capture and score report.

## Known Gaps

- This release does not perform production data-plane uploads or parser readback.
