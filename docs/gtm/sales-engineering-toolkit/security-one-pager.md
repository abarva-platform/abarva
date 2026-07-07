# Security One-Pager

Status: sales-engineering draft
Audience: security review, procurement, enterprise architecture

This is a first-pass summary. It does not replace the canonical security docs:

- `docs/pilot/SECURITY_POSTURE.md`
- `docs/pilot/SECURITY_CONTROLS_MATRIX.md`
- `docs/security/INFOSEC-ACCELERATOR.md`
- `docs/security/encryption-posture.md`
- `docs/architecture/ABARVA_PLANES_ARCHITECTURE.md`

## Summary

AbarVa is an early-stage enterprise SaaS product for evidence-backed AI and
business decision workflows. The architecture separates shared application
control-plane behavior from customer-scoped data-plane processing. AbarVa's
sales and pilot posture should be transparent: name the controls that exist,
name the controls in progress, and do not claim certifications or tests that
are not complete.

## Control Areas

| Area | Current sales-engineering position | Buyer follow-up |
| --- | --- | --- |
| Identity | Auth is based on Clerk; enterprise SAML/OIDC/SCIM is a pilot configuration path. | Confirm IdP, groups, roles, and provisioning requirements. |
| Authorization | Application permissions and data access are tenant-scoped; per-user RLS is part of the data-plane control posture. | Confirm role model and least-privilege requirements. |
| Data plane | Enterprise target posture is customer-scoped Azure data-plane processing for sensitive data. | Decide whether shared SaaS posture is acceptable for pilot or private data plane is required. |
| Evidence handling | Product outputs should cite evidence and carry human approval/accountability controls. | Confirm which decisions require approval evidence. |
| AI governance | AI outputs are decision support; consequential decisions require human owner and attestation. | Confirm buyer policy for AI-generated recommendations and drafts. |
| Release governance | Release lanes, release records, branch protection, and required CI checks are documented in repo governance. | Provide PR/release evidence when requested. |
| Security evidence | Existing posture docs and control matrices are available for review. | Route detailed questions to canonical docs, not ad hoc answers. |

## What To Say

"AbarVa is designed around a control-plane / data-plane split. The shared app
orchestrates workflow, governance, and decision records. Customer data handling
can be scoped into an Azure data plane for enterprise pilots that require
stricter residency and isolation. AI output is treated as decision support:
recommendations require evidence, citations, and accountable human approval."

## What Not To Say

- Do not claim SOC 2 certification unless the audit is complete.
- Do not claim an external penetration test has been completed unless the
  current security source docs say so.
- Do not claim live private data-plane setup for a buyer unless it has been
  provisioned and validated for that buyer.
- Do not claim the demo tenant contains buyer data.
- Do not claim AI agents take autonomous external actions.

## Standard Security Packet

| Packet item | Path |
| --- | --- |
| Security posture overview | `docs/pilot/SECURITY_POSTURE.md` |
| Security controls matrix | `docs/pilot/SECURITY_CONTROLS_MATRIX.md` |
| InfoSec accelerator / CAIQ-style material | `docs/security/INFOSEC-ACCELERATOR.md` |
| Encryption posture | `docs/security/encryption-posture.md` |
| Architecture overview | `docs/architecture/ABARVA_PLANES_ARCHITECTURE.md` |
| Model/provider governance | `docs/architecture/MODEL1_AZURE_CLAUDE_ROUTE_VALIDATION.md` |
| ADR index | `docs/architecture/adr/README.md` |
| Release records | `docs/releases/records/` |

## Pilot Security Discovery

| Question | Why it matters |
| --- | --- |
| Which datasets are in pilot scope? | Determines data-plane and ingestion controls. |
| Is PHI, PII, financial non-public data, or regulated data in scope? | Determines scanning, quarantine, and residency requirements. |
| Which IdP and groups are required? | Determines SSO/SCIM configuration. |
| What audit evidence is mandatory before launch? | Determines release packet and approval evidence. |
| Does the buyer require client-owned Azure infrastructure? | Determines deployment model and timeline. |
| What is the required incident contact and notification path? | Determines support model and contractual commitments. |

## Known Gap Handling

When a gap appears, answer in this form:

| Field | Required answer |
| --- | --- |
| Gap | Name the control not yet complete. |
| Current mitigation | Name the current protection or limitation. |
| Pilot impact | Say whether the gap blocks pilot start. |
| Owner | Name who must close it. |
| Evidence | Link to source doc, release record, or future PR. |

Example:
"External penetration testing is not complete. Current mitigation is internal
review plus CI security gates and dependency scanning. Whether this blocks pilot
start depends on the buyer's security policy. If required, it must be scheduled
as an external engagement and referenced in the pilot security packet."
