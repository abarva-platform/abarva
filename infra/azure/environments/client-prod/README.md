# Client Prod IaC Scaffold

Status: scaffold-ready, not deployed

Client Prod is the production private data plane for one client. It is separate from Product Prod and Client Preprod.

## Parameter Placeholders

- environment key: `client-prod`
- client code: `<approved-client-code>`
- subscription id: `<client-prod-subscription-id-after-approval>`
- region and data residency: `<approved-region-and-residency>`
- required tags from the client private-plane factory
- budget placeholder: client prod budget
- RBAC group placeholders: client owner, data owner, AbarVa platform operator, security reviewer, breakglass
- policy assignment placeholders: public access denial, required tags, diagnostics, private endpoints
- Key Vault placeholder: client-prod scoped
- private endpoint/private networking placeholder: database, storage, search, worker path
- retention/deletion/backup/restore placeholder: client-approved policy

## Data Boundary

Client-approved production data only under contract. No PHI. No unapproved PII. Context bundle proof is required before agent use.

## Deployment Rule

This scaffold does not deploy. Client Prod requires final go/no-go approval, rollback readiness, monitoring readiness, and client signoff.
