# Status Page Runbook

This runbook covers T043: the customer-facing status-page foundation required
for enterprise procurement and pilot operations.

## Current State

`/status` is a public route that does not require a Clerk session. It provides a
procurement-safe status foundation and incident communication model while the
external status provider is being configured.

Do not claim monitor-backed uptime until the external provider is connected.

## Production Provider Setup

Use Instatus, Statuspage, or an equivalent provider with:

- custom domain or subdomain
- public component status
- incident timeline
- maintenance windows
- subscriber notifications
- webhook or API integration for mirroring incidents into AbarVa records
- named owner for incident communications

## Required Components

- Application control plane
- Client private data planes
- Identity and SSO
- Document ingestion
- AI reasoning services
- Notifications

## Incident Posting Rules

- Sev 1: post immediately after incident commander confirms customer impact or
  credible data-exposure suspicion.
- Sev 2: post after triage confirms material degradation or rollback event.
- Sev 3: post when externally visible and not explained by a planned
  maintenance window.

Every incident post needs severity, affected component, start time, customer
scope, current mitigation, next update time, and communications owner.

## Validation

```bash
node scripts/ops/verify-status-page-readiness.mjs
```

Then verify `/status` loads without Clerk in preview/production.

## Completion Boundary

The repository-side foundation is complete when this page, route allowlist,
runbook, and verifier merge. T043 remains `In progress` until an external
provider is configured, a customer-safe URL is approved, and at least one
synthetic incident or maintenance-window drill is posted and archived.
