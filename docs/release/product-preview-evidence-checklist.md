# Product Preview Evidence Checklist

Status: non-mutating scaffold

Attach this evidence to the release record and execution ledger before Product Preview can support a Product Prod promotion decision.

## Evidence Checklist

- Release record with lane, client applicability, rollout, rollback, and validation.
- PR URL and merge commit.
- CI status summary.
- Image tag and immutable digest.
- Azure Container Apps revision export where deployed.
- `/` and `/api/health` HTTP 200 proof.
- Header proof showing no Vercel runtime headers.
- Secret scan proof.
- Azure policy assignment export.
- RBAC assignment export.
- Budget export.
- Diagnostic settings export.
- Context healthcheck report if data-backed surfaces changed.
- Signed-in browser QA screenshots or JSON.
- Rollback command and owner.
- Human approval before Product Prod.

## Data Boundary

Product Preview may use synthetic, pilot-reference, and client-approved redacted data. It must not contain PHI, PII, or raw client private documents. Client Preprod and Client Prod evidence stays in the client private data-plane packet.
