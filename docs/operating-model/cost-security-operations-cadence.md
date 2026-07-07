# Cost, Security, And Operations Cadence

Status: scaffold-ready

## Cost

Weekly budget alert scan. Monthly forecast and rightsizing review. Any budget creation or increase requires explicit approval.

## Security

Weekly high-risk drift scan. Monthly RBAC and policy review. Immediate review for public access, broad Owner/User Access Administrator grants, secret exposure, PHI, PII, or tenant isolation findings.

## Operations

Weekly health, incident, and rollback review. Product Preview release-candidate gates are reviewed before Product Prod. Client Preprod rehearsals are reviewed before Client Prod. Client Prod incidents require client owner notification and evidence preservation.

## Evidence

Each cadence cycle records budget export, RBAC export, policy summary, diagnostic settings, context health status, and open approval gates.
