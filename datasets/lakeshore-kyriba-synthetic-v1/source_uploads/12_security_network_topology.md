# Security And Network Topology For Kyriba Rollout

Synthetic demo evidence. No real client confidential data.

## Identity
Okta is the preferred identity provider. Kyriba must support SAML/OIDC, MFA, role claims, and quarterly access review exports.

## Network And Egress
Bank connectivity uses a mix of host-to-host, SFTP, bank APIs, and portal exports today. Target state should centralize certificate/key rotation and monitor ACK/NACK responses.

## Data Protection
Treasury data includes bank account metadata, payment instructions, and cash position facts. It should be treated as confidential financial data. No payment-card or payroll-personal data should be loaded into AbarVa without private data-lane approval.

## Audit Requirements
Every generated artifact must show evidence lineage. Every control change must have a named approver. Direct send to vendors remains out of scope; AbarVa drafts communications for review.
