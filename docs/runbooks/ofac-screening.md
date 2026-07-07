# OFAC Screening Runbook

This runbook covers T121: customer sanctions screening before onboarding.

## Purpose

New customers must be screened against OFAC sanctions data before contracting or
provisioning. Possible matches fail closed until a manual compliance disposition
is recorded.

## Repository Control

The deterministic evaluator lives at:

`src/lib/compliance/ofac-screening.ts`

The compliance posture card lives in:

`src/lib/admin/compliance-config.ts`

## Decision Rules

- No hits: customer may proceed, with screening evidence retained.
- High-confidence OFAC match: block onboarding until counsel/compliance clears.
- Possible match: block onboarding until manual review disposition is recorded.
- Low-confidence hit: fail closed and require manual review.

## Evidence Required

- customer name,
- alias list,
- country when available,
- screened timestamp,
- screening method,
- watchlist source/version,
- matched name when present,
- match score when present,
- source URL when present,
- manual review disposition or compliance clearance when required.

## Validation

```bash
node scripts/compliance/verify-ofac-screening.mjs
npx jest src/lib/compliance/__tests__/ofac-screening.test.ts src/lib/admin/broker/__tests__/compliance-posture-broker.test.ts --runInBand
```

## Completion Boundary

The repository-side T121 foundation is complete when the evaluator, compliance
posture, tests, verifier, runbook, build manifest, and release record merge.

T121 remains `In progress` until a live screening workflow or approved manual
process stores the screening evidence for new customers.
