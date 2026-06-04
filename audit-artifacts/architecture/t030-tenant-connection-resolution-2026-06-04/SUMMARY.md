## T030 — Tenant connection resolution

Status: Partial

Date: 2026-06-04

What was run

- `npm run data-plane:tenant-connection:verify`
- `npm run db:azure:verify`
- `npm run db:azure:verify-data-parity`
- Negative fail-closed probe with invalid `DATABASE_URL`
- Live Azure connectivity job execution review

Evidence files

- `data-plane-tenant-connection-verify.txt`
- `db-azure-verify.txt`
- `db-azure-verify-data-parity.txt`
- `db-azure-verify-negative-invalid-url.txt`
- `../t029-client-tenant-iac-2026-06-04/azure-connectivity-job-execution-show-current-final.json`
- `../t029-client-tenant-iac-2026-06-04/azure-connectivity-job-logs-current.txt`

What passed

- Tenant-connection resolution verifier passed.
- Azure Postgres schema verification passed.
- Live Azure connectivity job showed private Postgres, Key Vault, Blob, Service Bus, and Azure AI Search access succeeding under the job's managed-identity/runtime context.
- The connectivity job env proves secret projection for `DATABASE_URL`.
- Negative fail-closed test passed: invalid `DATABASE_URL` produced `ECONNREFUSED` instead of falling back silently.

Live data truth

- Apex Retail currently passes the data-parity thresholds.
- Meridian Health, First Capital, and Northstar Clinical currently fail one or more parity thresholds in the verifier output.

Why this is not Done

- The remaining gap is closure-grade request-local tenant scope proof from an actual app/request path, not just repo verification plus background-job secret projection.

Concrete remediation

- Capture one authenticated request path that resolves tenant-scoped connection selection live, with redacted evidence showing the request-local tenant choice and fail-closed behavior for missing tenant secrets.
