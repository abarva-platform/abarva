# 2026-07-18-intelligence-followup-cleanup — Suggested Question Cleanup

## Release ID

`2026-07-18-intelligence-followup-cleanup`

## Status

`candidate`

## Plain-English Summary

After the Intelligence client-grounding deploy, live proof showed one generated suggested question included the actual question plus appended evidence/decision-boundary footer prose. This release keeps suggested questions as clean questions only by stripping policy footer prose after generation.

## Layer Impact

- `global-control-lane`: Shared Intelligence suggested-question generation.
- `experience`: Cleans the visible suggested-question rail without changing answer synthesis or retrieval.

## Client Applicability

- All clients: Yes, for Intelligence aVa suggested questions.
- Specific clients: Healthcare Demo/Meridian exposed the issue during live proof.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/followups.ts`
- `src/lib/intelligence/ask/__tests__/followups.test.ts`

## QA / Validation

Status: `pass` for local focused test and TypeScript; `pending` for CI, deploy, and live signed-in proof until this candidate is merged and deployed.

Validation:

- `pass`: `npx jest src/lib/intelligence/ask/__tests__/followups.test.ts --runInBand`
- `pass`: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`
- `pending`: `npm run release:check`
- `pending`: production deploy through the repo-owned ACA workflow
- `pending`: live signed-in Meridian/Healthcare Demo proof confirming suggested questions render as questions only

## Rollout Plan

Merge through PR, then deploy through the repo-owned ACA main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: No worker code change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR or redeploy the prior ACA digest through the approved main deploy workflow.

## Audit Evidence

- PR: pending
- Live defect proof: `/tmp/intelligence-client-grounding-live-proof-20260719/live-api-proof.json`
- Deployment proof: pending

## Known Gaps

The underlying answer and grounding packet are already deployed by the prior release. This candidate only cleans the suggested-question rail. It does not change retrieval, answer synthesis, companion canvas content, exports, or tenant data. If future product-truth policy text is added by downstream suggested-question sanitizers, it should be normalized in the same rail before display.
