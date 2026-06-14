# Client Preprod Template

Status: scaffold-ready, not executed

Client Preprod is the client private data-plane rehearsal environment. It is not Product Preview. It may contain client-approved test data, redacted client data, and synthetic client-reference data under explicit onboarding controls.

## Required Parameters

- client code
- client legal/display name
- environment key: `client-preprod`
- approved region
- budget owner and threshold recipients
- client/preprod RBAC groups
- policy assignment bundle
- Key Vault naming prefix
- private network CIDR assumptions
- data retention period
- approved data classifications

## Required Evidence

- subscription id after approved creation
- management group path
- budget id
- RBAC assignment export
- policy assignment export
- storage/database/search private endpoint proof
- Azure Blob staged source-file proof
- enterprise context records/facts/chunks counts
- search index proof
- retrieval/citation proof
- context bundle trace proof
- rollback or abandon plan

## Stop Conditions

Stop for PHI, unapproved PII, missing budget, missing RBAC approval, public database access, missing context-bundle proof, wrong-tenant retrieval, or client data in Product Dev/Preview/Prod.
