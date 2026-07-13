# Meridian Health Corporate Policies and AI Use Context

Synthetic source document for context-layer ingestion.

## Policy Context

Meridian's clinical, claims, call-center, and finance modernization work is governed by HIPAA, PHI handling rules, data classification, clinical safety review, utilization-management policy, payer compliance, vendor risk, cyber architecture, and AI governance policies.

The AI governance policy requires clinical, legal, privacy, security, and business-owner approval before AI can influence prior authorization, utilization management, coding, care management, member outreach, provider scoring, claims payment, or denial rationale. Human review remains mandatory for adverse member or provider-impacting decisions unless a specific control waiver is approved.

The data classification policy treats EMR notes, diagnosis/procedure data, claims, pharmacy records, call transcripts, member identifiers, provider contracts, payment data, and care-management notes as restricted PHI or confidential business data. Restricted data requires approved storage, access controls, lineage, retention policy, and audit logging before AI or analytics use.

The sourcing policy requires healthcare AI vendors to disclose model hosting, PHI retention, training-data use, BAAs, subprocessors, clinical safety controls, audit rights, and incident-notification terms. AI vendors touching PHI or claims decisions must pass privacy, security, and compliance review before pilot expansion.

## Controls That Affect AI Use Cases

- Prior authorization AI requires medical-policy evidence, denial rationale, appeal support, clinical oversight, and bias monitoring.
- Call-center agent assist requires consent handling, transcript governance, member identity controls, and next-best-action audit trail.
- Provider quality analytics requires HEDIS/STAR definitions, attribution logic, measure stewardship, and source lineage.
- Payment integrity AI requires false-positive control, recovery tracking, provider-pattern evidence, and appeal defensibility.
- Clinical + claims lakehouse data products require PHI governance, Unity Catalog controls, semantic ownership, and stewardship.

## Sourcing Implications

Meridian should sequence automation around governed data products and policy-cleared workflows. The highest-value AI use cases depend on clinical trust, PHI control, and audit-ready evidence more than on model selection alone.
