# 2026-07-22-source-p1-approval-ux-simplification — Source P1 Approval UX Simplification

## Release ID

`2026-07-22-source-p1-approval-ux-simplification`

## Status

`candidate`

## Plain-English Summary

This release simplifies the Source event approval page so the approver sees the approval brief, required inputs, blocker state, and primary action first. The full evidence review, intake chat trail, routing details, and audit explanation remain available, but they now sit behind disclosures instead of dominating the active approval workflow.

## Layer Impact

`global-control-lane` — Changes the shared Source approval UI component for tenants using the event approval workflow. It does not change approval permissions, API payload shape, data persistence, stage-gate rules, or artifact generation.

## Client Applicability

- All clients: Source approval UI becomes more focused where this component renders.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/source/approval/EventApprovalCard.tsx`
  - Adds a compact approval brief with key intake facts and current blocker/ready state.
  - Moves full evidence, intake audit trail, routing, and next-step detail behind disclosure sections.
  - Keeps the existing approval, request-changes, reject, co-approval, self-approval, and strategy-gate confirmation semantics unchanged.
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx`
  - Adds regression coverage for the simplified approval hierarchy.
  - Keeps the existing gate-readiness and API-payload behavior tests.
- `docs/codex-handoff/SOURCE_P1_APPROVAL_UX_RECOMMENDATIONS_2026-07-22.md`
  - Captures the broader UX direction for follow-on slices.

## QA / Validation

- `npx jest src/components/source/approval/__tests__/EventApprovalCard.test.tsx --runInBand` — passed, `6/6` tests. Jest printed existing duplicate manual mock warnings for mdast/micromark mocks.
- `npx eslint src/components/source/approval/EventApprovalCard.tsx src/components/source/approval/__tests__/EventApprovalCard.test.tsx` — passed.
- `npx eslint tests/e2e/source/golden-event-apex-ams.spec.ts` — passed for the golden-event coverage added in the same draft PR.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — passed after refreshing the local temp-worktree `node_modules` install; no package or lockfile changes were required because the graph packages were already declared.
- Governed Source E2E remains blocked from this laptop because Azure Postgres lab is private-only. `pg-abarva-context-lab-001.postgres.database.azure.com` returns NXDOMAIN locally, and Azure reports `publicNetworkAccess: Disabled`.

## Rollout Plan

Merge through PR to `main`, then use the repo-owned Azure Container Apps main deploy workflow. After deployment, verify the Source approval page with a signed-in user on `https://app.abarva.ai` and capture browser proof that the approval brief is first and evidence/audit detail remains accessible.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR to restore the prior long approval-page layout. No migration, data rollback, or tenant-specific cleanup is required.

## Audit Evidence

- Draft PR: `https://github.com/abarva-platform/abarva/pull/5277`
- Focused Jest and ESLint output from local validation.
- Release-control check output after this record is included.

## Known Gaps

- Live browser proof is not yet captured because the PR is still draft and the local machine cannot reach the private Azure Postgres lab data plane.
- The broader Source P1 approval workflow may need additional follow-on UX slices for final action-bar polish, keyboard flow, and mobile-density review.
