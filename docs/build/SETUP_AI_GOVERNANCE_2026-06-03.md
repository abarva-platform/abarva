# Setup AI Governance Manifest

Date: 2026-06-03
Status: candidate
Backlog: T244, T245
Release lane: internal-admin

## What Changed

Added the repository foundation for setup/admin AI governance:

- AI-suggested tenant configuration changes require admin approval and a reason.
- AI-detected setup anomalies require human triage acknowledgement before
  remediation.

## Included

- Pure governance model:
  `src/lib/admin/setup-ai-governance.ts`
- Data Loads operator controls:
  `src/lib/admin/setup-load-studio-view.ts`
- Unit tests:
  `src/lib/admin/__tests__/setup-ai-governance.test.ts`
  `src/lib/admin/__tests__/setup-load-studio-view.test.ts`
- Verifier:
  `scripts/admin/verify-setup-ai-governance.mjs`
- Runbook:
  `docs/runbooks/setup-ai-governance.md`

## Guardrails

- No automatic application of AI-suggested setup changes.
- No silent remediation of AI-detected anomalies.
- Evidence ids are required.
- Admin reason is required.
- Triage acknowledgement timestamp is required for anomaly remediation.

## Completion Boundary

T244 and T245 remain `In progress` until live setup/admin actions persist
approval or triage evidence into the audit ledger before applying changes or
remediation.
