# Approval Pattern Review Manifest

Date: 2026-06-03
Status: candidate
Backlog: T218
Release lane: internal-admin

## What Changed

Added the repository foundation for quarterly anti-rubber-stamp approval review.

## Included

- Pure review engine:
  `src/lib/ai-liability/approval-pattern-review.ts`
- Unit tests:
  `src/lib/ai-liability/__tests__/approval-pattern-review.test.ts`
- Verifier:
  `scripts/ai-liability/verify-approval-pattern-review.mjs`
- Runbook:
  `docs/runbooks/approval-pattern-review.md`
- Release record:
  `docs/releases/records/2026-06-03-approval-pattern-review.md`

## Control Coverage

The review flags:

- approvals below the fast-review threshold,
- thin human rationale,
- missing evidence ids,
- high-risk approvals decided too quickly,
- reviewer-level fast-approval patterns,
- reviewer-level missing-evidence patterns.

## Boundary

No DB writes, scheduled jobs, admin notifications, or live approval-event exports
are added in this slice.

T218 remains `In progress` until a scheduled quarterly job or admin workflow
feeds real approval events into the review, sends critical summaries to tenant
admins and AbarVa, and stores the evidence packet.
