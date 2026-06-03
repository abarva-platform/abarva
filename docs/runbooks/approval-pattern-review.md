# Approval Pattern Review Runbook

This runbook covers T218: quarterly anti-rubber-stamp review for human approval
decisions.

## Purpose

Approval controls are only useful when reviewers actually review. The quarterly
pattern review detects reviewer behavior that may indicate rubber-stamping:

- approvals made too quickly,
- approvals with thin rationale,
- approvals without evidence ids,
- high-risk approvals decided below the review-time threshold.

## Repository Control

The deterministic review engine lives at:

`src/lib/ai-liability/approval-pattern-review.ts`

It is pure and does not write to the database. It accepts approval decision
events and returns reviewer summaries, event flags, and an escalation summary.

## Default Thresholds

- fast approval: below 30 seconds,
- thin rationale: below 24 characters,
- reviewer fast-approval-rate flag: more than 50 percent,
- missing-evidence-rate flag: more than 20 percent,
- reviewer-level flag minimum: 3 events.

## Operating Process

1. Export approval decision events for the quarter.
2. Run the pattern review.
3. Send critical reviewer summaries to the tenant admin and AbarVa owner.
4. Require remediation notes before the next quarterly approval cycle closes.
5. Attach the report to the release, audit, or governance evidence packet.

## Validation

```bash
npx jest src/lib/ai-liability/__tests__/approval-pattern-review.test.ts --runInBand
node scripts/ai-liability/verify-approval-pattern-review.mjs
```

## Completion Boundary

The repository-side T218 foundation is complete when the review engine, tests,
verifier, runbook, build manifest, and release record merge.

T218 remains `In progress` until a scheduled quarterly job or admin workflow
feeds real approval events into this review, sends critical summaries to tenant
admins and AbarVa, and stores the resulting evidence packet.
