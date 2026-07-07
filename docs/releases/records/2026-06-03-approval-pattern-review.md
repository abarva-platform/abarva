# 2026-06-03-approval-pattern-review — Approval Pattern Review Foundation

## Release ID

`2026-06-03-approval-pattern-review`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic approval-pattern review engine to detect potential
rubber-stamping. It flags approvals made too quickly, approvals with thin
rationale, approvals without evidence, and high-risk approvals that appear
under-reviewed.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: AI liability defense, approval governance, and audit evidence.
- Runtime impact: no database writes, scheduled jobs, notifications, route
  changes, or live approval-event exports.

## Client Applicability

- All clients: future quarterly approval review can use this control.
- Specific clients: none.
- Internal only: repository-side control foundation and runbook.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/ai-liability/approval-pattern-review.ts`
- `src/lib/ai-liability/__tests__/approval-pattern-review.test.ts`
- `scripts/ai-liability/verify-approval-pattern-review.mjs`
- `docs/runbooks/approval-pattern-review.md`
- `docs/build/APPROVAL_PATTERN_REVIEW_2026-06-03.md`

## QA / Validation

- Pass: `npx jest src/lib/ai-liability/__tests__/approval-pattern-review.test.ts --runInBand`
- Pass: `node scripts/ai-liability/verify-approval-pattern-review.mjs`
- Pass: focused ESLint for the review engine, test, and verifier.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Blocked/not run: scheduled quarterly job, tenant-admin notification, AbarVa
  notification, and live approval-event export remain future operational work.

## Rollout Plan

Merge to `main`. The review engine and runbook become available for the next
approval-governance implementation slice.

## Rollback Plan

Revert this PR. No data rollback is required.

## Audit Evidence

- This release record.
- Build manifest.
- Unit test output.
- Verifier output.
- Pull request and CI checks.

## Known Gaps

T218 remains `In progress` until a scheduled quarterly job or admin workflow
feeds real approval events into this review, sends critical summaries to tenant
admins and AbarVa, and stores the resulting evidence packet.
