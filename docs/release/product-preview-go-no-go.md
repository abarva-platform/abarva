# Product Preview Go / No-Go

Status: non-mutating scaffold

This is the decision page for promoting a Product Preview release candidate toward Product Prod. It is not a deployment command.

## Go Criteria

- Build, test, security, secret scan, and release-record gates are green.
- Product Preview health checks pass.
- Signed-in browser QA passes for affected modules.
- Context bundle proof exists for agent/data changes.
- Policy, RBAC, budget, tag, and diagnostic evidence are attached.
- Rollback path is recorded and rehearsed or explicitly accepted.
- No PHI, PII, or client private raw data is present.
- Human approval for Product Prod promotion is recorded.

## No-Go Criteria

- Any critical CI gate failed.
- Product Preview is not Azure-backed.
- Vercel runtime headers appear in product runtime proof.
- Missing budget, RBAC, policy, diagnostics, or rollback evidence.
- Tenant isolation or context-bundle proof is missing for affected data paths.
- Client private data is present in product/control-plane storage.

## Decision Table

| Decision          | Approver | Date/time     | Evidence link        | Notes     |
| ----------------- | -------- | ------------- | -------------------- | --------- |
| Go / No-Go / Hold | `<name>` | `<timestamp>` | `<ledger-or-report>` | `<notes>` |
