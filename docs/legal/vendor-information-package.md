# Vendor Information Package

Status: procurement/security draft
Owner: founder
Backlog task: T017

## Purpose

This package gives procurement, legal, security, and enterprise architecture a
single index of AbarVa vendor-review materials. It should be attached to or
referenced from pilot diligence responses instead of answering from memory.

## Company Snapshot

| Field | Current answer |
| --- | --- |
| Legal entity | AbarVa Inc., Delaware C Corporation |
| Founded | 2026 |
| Headquarters / operating location | Founder-operated; final legal address to be confirmed in contracting packet. |
| Product | Governed AI decision-support platform for enterprise strategy, sourcing, portfolio, and setup workflows. |
| First pilot posture | Founder-led enterprise pilot with controlled release, support, security, and Responsible AI artifacts. |
| Certifications | Do not claim SOC 2, ISO 27001, or third-party penetration test completion until evidence exists. |

## Standard Attachments

| Need | Artifact |
| --- | --- |
| Security posture | `docs/pilot/SECURITY_POSTURE.md` |
| Security controls | `docs/pilot/SECURITY_CONTROLS_MATRIX.md` |
| Canonical security answers | `docs/security/security-questionnaire-canonical-answers.md` |
| Reference architecture | `docs/security/REFERENCE_ARCHITECTURE_SECURITY_REVIEW_DECK.md` |
| Subprocessors | Public `/subprocessors` page and supporting repo content |
| Responsible AI | `docs/legal/responsible-ai-policy.md`, public `/responsible-ai` page |
| AI decision support | `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md` |
| Contract redlines | `docs/legal/contract-redline-brief.md` |
| Private data use | `docs/legal/PILOT_PRIVATE_DATA_USE_POLICY_PACK_2026-06-01.md` |
| Release governance | `GOVERNANCE.md`, `docs/releases/RELEASE_CONTROL_POLICY.md`, release records |
| Architecture ADRs | `docs/architecture/adr/README.md` |
| SSO/connectivity testing | `docs/runbooks/enterprise-sso-connectivity-test-plan.md` |
| Release environments | `docs/runbooks/product-release-environment-plan.md` |
| Support model | `docs/pilot/SUPPORT-MODEL.md` |
| Managed services scope | `docs/pilot/MANAGED_SERVICES_SCOPE.md` |

## Procurement Answers

| Topic | Standard position |
| --- | --- |
| Pricing | Pilot and production pricing follow the current pricing workbook and `docs/gtm/pilot-pricing-and-packaging.md`. |
| Payment terms | Prefer Net 30 or annual/prepaid options where discount applies. Avoid Net 60/90 for first pilot. |
| Liability | Use the redline brief; avoid unlimited liability or broad AI-output reliance indemnity. |
| IP ownership | Client owns client data and approved client-specific outputs; AbarVa retains platform, corpus, patterns, prompts, and improvements. |
| Data use | Client data is used only for the contracted client scope unless separately agreed. |
| AI use | AI is decision support; humans remain accountable for consequential decisions. |
| Sensitive data | PHI/PII/payment/secrets content requires explicit policy, quarantine, and approval path. |

## Security Review Answers

Use the canonical security answers first. If a buyer asks for stronger claims,
respond with one of:

- "In place" when evidence exists.
- "Planned" when only roadmap/runbook exists.
- "Customer-specific" when the control must be configured and evidenced for
  that customer.
- "Not currently certified" for SOC 2, ISO 27001, or third-party pen-test
  unless later evidence exists.

## Due Diligence Checklist

- [ ] Company legal name and address confirmed.
- [ ] Certificate of incorporation available.
- [ ] W-9 or equivalent ready if requested.
- [ ] Insurance quotes or COI available if required before signing.
- [ ] Security packet attached.
- [ ] Responsible AI and AI decision-support language attached.
- [ ] Data-use policy and sensitive-data restrictions attached.
- [ ] Pricing/order form/SOW aligned to current pricing posture.
- [ ] Redline positions reviewed before client paper is accepted.
- [ ] Any customer-specific private data-plane claims backed by evidence.

## Known Gaps

These should remain explicit until closed:

- DUNS number pending.
- Insurance COI pending until bound.
- SOC 2 / ISO certification not complete.
- Third-party penetration test not complete.
- Customer-specific private data-plane setup requires its own evidence pack.
- Final legal address and tax forms must be prepared for contracting.
