# 2026-07-22-agent-renderer-remove-row-count-label — Remove CXO-Visible Table Row Counts

## Release ID

`2026-07-22-agent-renderer-remove-row-count-label`

## Status

`candidate`

## Plain-English Summary

aVa structured tables no longer display generic labels such as `5 rows` in the answer canvas. The table content remains visible, but the interface stops exposing technical table-size language that does not help executives understand the decision.

## Layer Impact

- `global-control-lane`: removes the shared `DataTable` row-count badge from the aVa answer renderer used across client surfaces.
- Presentation layer: preserves structured table rendering while keeping CXO-visible language focused on business meaning.

## Client Applicability

- All clients: yes, for any aVa answer that renders shared structured tables.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/agent-answer/AgentAnswerRenderer.tsx`
- `src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx`

## QA / Validation

- Passed: `npm test -- src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand`
- Passed: `npm test -- src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Pending until after this record update: `npm run release:check`
- Passed: `git diff --check`

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main deploy workflow builds and deploys the updated web image to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: handled by the ACA deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for a Tower/aVa answer that includes a structured table.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow.

## Audit Evidence

- PR and CI once opened.
- Signed-in Tower/aVa proof after deploy.

## Known Gaps

This removes the shared table row-count label. Other module-specific surfaces may still need separate language audits if they independently render record/node/edge counts outside the shared aVa renderer.
