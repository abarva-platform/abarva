# Setup AI Governance Runbook

This runbook covers T244 and T245.

## Purpose

Setup and Admin can use AI to identify configuration suggestions and anomalies,
but AI must never silently apply setup changes or remediate anomalies.

## T244 Rule

AI-suggested tenant configuration changes require:

- admin approval,
- named admin user id,
- recorded reason,
- evidence ids,
- audit evidence retained before execution.

Admin approval with a recorded reason is required before applying the
AI-suggested setup change.

## T245 Rule

AI-detected setup anomalies require:

- human triage acknowledgement,
- named triage admin user id,
- recorded reason,
- acknowledgement timestamp,
- evidence ids,
- audit evidence retained before remediation.

Human triage acknowledgement is required before any AI-detected anomaly
remediation.

## Repository Control

The deterministic model lives at:

`src/lib/admin/setup-ai-governance.ts`

The operator-facing Data Loads control panel surfaces:

- AI setup suggestions: admin approval required,
- AI anomaly triage: no silent remediation.

## Validation

```bash
node scripts/admin/verify-setup-ai-governance.mjs
npx jest src/lib/admin/__tests__/setup-ai-governance.test.ts src/lib/admin/__tests__/setup-load-studio-view.test.ts --runInBand
```

## Completion Boundary

The repository-side foundation is complete when the model, Data Loads controls,
tests, verifier, runbook, build manifest, and release record merge.

T244 and T245 remain `In progress` until live setup/admin actions persist
approval or triage evidence into the audit ledger before applying changes or
remediation.
