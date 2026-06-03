# OFAC Screening Manifest

Date: 2026-06-03
Status: candidate
Backlog: T121
Release lane: internal-admin

## What Changed

Added the repository foundation for customer sanctions screening before
onboarding.

## Included

- Deterministic evaluator:
  `src/lib/compliance/ofac-screening.ts`
- Compliance posture card:
  `src/lib/admin/compliance-config.ts`
- Broker pass-through:
  `src/lib/admin/broker/compliance-posture-broker.ts`
- Admin compliance UI card:
  `src/components/admin/CompliancePostureGrid.tsx`
- Unit tests and verifier.
- Runbook and release record.

## Guardrails

- High-confidence OFAC matches block onboarding.
- Possible matches require manual review.
- Low-confidence hits fail closed until a manual disposition is recorded.
- Clear screenings still require evidence retention.

## Boundary

No live OFAC API integration, customer onboarding workflow, database write, or
screening evidence store is added in this slice.

T121 remains `In progress` until a live screening workflow or approved manual
process stores the screening evidence for new customers.
