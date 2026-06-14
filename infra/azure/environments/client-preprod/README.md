# Client Preprod IaC Scaffold

Status: scaffold-ready, not deployed

Client Preprod is a client private data-plane rehearsal environment. It is separate from Product Preview.

## Parameter Placeholders

- environment key: `client-preprod`
- client code: `<approved-client-code>`
- subscription id: `<client-preprod-subscription-id-after-approval>`
- region: `<approved-region>`
- required tags from the client private-plane factory
- budget placeholder: client preprod budget
- RBAC group placeholders: client owner, data owner, AbarVa platform operator, breakglass
- policy assignment placeholders: public access denial, required tags, diagnostics, private endpoints
- Key Vault placeholder: client-preprod scoped
- private endpoint/private networking placeholder: database, storage, search, worker path
- retention placeholder: client-approved rehearsal retention

## Data Boundary

Client-approved test data, redacted data, and synthetic client-reference data only. No PHI. No unapproved PII.

## Deployment Rule

This scaffold does not deploy. Client Preprod execution requires explicit approval and an evidence ledger entry.
