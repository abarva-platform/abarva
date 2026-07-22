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

## 2026-07-22 Follow-Up Addendum

- `src/components/source/approval/EventApprovalCard.tsx`
  - Flattens the approval brief facts from tile-like blocks into a definition-list layout with subtle dividers, reducing visual nesting while preserving the same five governed facts and action logic.
- Validation:
  - `npx jest src/components/source/approval/__tests__/EventApprovalCard.test.tsx --runInBand` — passed, `6/6` tests. Jest printed existing duplicate manual mock warnings for mdast/micromark mocks.
  - `npx eslint src/components/source/approval/EventApprovalCard.tsx src/components/source/approval/__tests__/EventApprovalCard.test.tsx` — passed.
  - `git diff --check` — passed.
  - `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — passed.

## 2026-07-22 Governance History + Evidence Freshness Addendum

- `src/app/(maestro)/source/events/[eventId]/approval/page.tsx`
  - Loads the existing Source approval ledger and latest artifact acceptances through read-only repository functions for the current event.
  - Passes the event row's real `updated_at` timestamp as the honest evidence freshness source; no per-fact timestamps are fabricated.
- `src/components/source/approval/EventApprovalCard.tsx`
  - Adds the event-level freshness signal to the collapsed evidence summary.
  - Expands the audit disclosure from intake-chat-only to governance history: recorded stage approvals, recorded artifact acceptances, and the existing intake trail.
  - Keeps governed data collapsed but reachable; approval action payloads, permissions, gate confirmations, and routing behavior are unchanged.
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx`
  - Covers governance history rendering, honest empty states, and the evidence freshness summary.
- `docs/backlog/source-product-backlog.md`
  - Moves `SOURCE-APPROVAL-UX-002` and `SOURCE-APPROVAL-UX-003` to candidate status and `004` into verification pending live proof.
- Validation:
  - `npx jest src/components/source/approval/__tests__/EventApprovalCard.test.tsx --runInBand` — passed, `8/8` tests. Jest printed existing duplicate manual mock warnings for mdast/micromark mocks.
  - `npx eslint src/app/(maestro)/source/events/[eventId]/approval/page.tsx src/components/source/approval/EventApprovalCard.tsx src/components/source/approval/__tests__/EventApprovalCard.test.tsx` — passed.
  - `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — passed after refreshing the isolated temp-worktree `node_modules`; no tracked package files changed.

## 2026-07-22 Live-Proof Addendum For SOURCE-APPROVAL-UX-002/003/004

- PR: [#5299](https://github.com/abarva-platform/abarva/pull/5299), squash-merged as
  `cc81e1b1fc01a9d1c28280ec924e14bd3b206741`.
- ACA deploy workflow: `29917417511` — passed.
- Live web revision: `ca-abarva-web-lab-eastus--mcc81e1b1`.
- Live image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:797f7902a0e2a4ca1528d256c877cd7590705ca7a21cc8405d03bc5405dfa809`.
- Traffic: `100%` to `ca-abarva-web-lab-eastus--mcc81e1b1`.
- Health endpoint: `https://app.abarva.ai/api/health` returned `HTTP/2 200`.
- Worker image invariant: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event`
  are pinned to the same digest as web.
- Signed-in browser proof:
  `/tmp/source-prod-approval-governance-history-cc81e1b.png`.
  - Route:
    `https://app.abarva.ai/source/events/730a82cb-53df-4bcb-9388-2999f37a2cff/approval?proof=cc81e1b`.
  - Evidence summary showed: `Evidence reviewed · 5 facts · updated 19 d ago`.
  - Audit summary showed: `Audit history · 1 intake turn · 0 approvals · 0 acceptances`.
  - Expanded audit history showed honest empty states for stage approvals and artifact
    acceptances; render tests cover the populated governance-history case.
  - Acceptance criteria pass: approval object and primary action visible, one primary + one
    direct secondary action visible, required confirmations visible without scrolling,
    evidence/audit reachable within one click, and no unrelated future-stage or
    artifact-maintenance content shown by default.
- Backlog update:
  - `SOURCE-APPROVAL-UX-002`, `003`, and `004` marked `Merged — live-proven`.
  - Ready/in-progress pointer cleared for this Source approval UX workstream.
