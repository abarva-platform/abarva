# SkyHarbor Air Corporate Policies and AI Use Context

Synthetic source document for context-layer ingestion.

## Policy Context

SkyHarbor's AI, data, sourcing, and technology work is constrained by a board-approved responsible AI policy, an enterprise data classification standard, a cyber architecture standard, sourcing and vendor-risk rules, and aviation operations control procedures.

The responsible AI policy requires human approval before any agent can alter customer commitments, crew legality decisions, aircraft maintenance disposition, loyalty account status, refund authorization, or disruption recovery obligations. Generative AI outputs used in airport operations, call-center servicing, crew operations, revenue management, or maintenance workflows must retain prompt, response, model, source, and reviewer evidence for audit.

The data classification standard treats PNR records, loyalty profiles, payment tokens, employee records, crew scheduling data, maintenance event notes, and irregular-operations recovery plans as restricted or confidential data. Restricted data cannot be sent to unapproved AI tooling. Any model using customer, employee, or operational safety data requires privacy, cyber, legal, and business-owner approval before production use.

The sourcing policy requires AI vendors to disclose model hosting location, subprocessor list, data retention, training-data use, incident-notification obligations, and exit rights. Vendor tools that touch customer service, operations, revenue management, or maintenance must pass security architecture review and vendor risk review before pilot expansion.

## Controls That Affect AI Use Cases

- IROPS agentic workflows require human dispatch/operations approval for customer rebooking, crew legality changes, DOT obligation handling, and station recovery decisions.
- Customer experience AI requires consent, identity resolution, and loyalty-data governance before proactive personalization at scale.
- Maintenance and reliability AI requires safety review, engineering signoff, and clear distinction between advisory recommendations and airworthiness decisions.
- Revenue management AI requires pricing governance, auditability, and market/fare-rule compliance.
- Enterprise copilots require restricted-data controls, logging, and approved knowledge repositories.

## Sourcing Implications

The CIO and CDAO should treat policy readiness as a sequencing gate. The strongest SkyHarbor AI cases are not blocked by lack of ambition; they are blocked by the need to prove data classification, human approval, source evidence, and vendor controls before autonomous scale.
