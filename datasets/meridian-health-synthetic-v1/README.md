# Meridian Health Synthetic Substrate Pack v1

Synthetic healthcare-vertical substrate for Healthcare Composite Demo Tenant.

This scaffold mirrors the existing synthetic data-pack shape with Meridian
identity, healthcare systems, HIPAA/CMS regulatory overlays, clinical AI
tooling, application portfolio, vendor contracts, DORA baselines, context
source files, and Sentinel verification targets.

Tenant key: `meridian`
Display name: Healthcare Composite Demo Tenant
Canonical profile: Sacramento-based integrated delivery network with 30 hospitals,
280 ambulatory sites, 58,000 employees, and 1.4M covered lives. This profile is
the loader-facing source of truth for the PHS/Meridian pilot narrative; older
23-hospital or non-California profiles are stale and should fail verification.

## Context Layer Showcase

The pack now includes a healthcare-specific context-layer showcase:

- `17-upload-templates/`: 26 synthetic, PHI-free upload templates covering
  Epic, HL7/FHIR, prior authorization, denials, ambient documentation,
  clinical AI model governance, HIPAA AI controls, BAA contracts,
  service-line P&L, workforce, patient access, imaging AI, CMS
  interoperability, DORA, incidents, value-based care, population health,
  data lineage, digital front door, supply chain, downtime, nursing acuity,
  and AI tool footprint.
- `18-upload-scenarios/`: 8 guided scenarios that show how those files become
  classified, validated, approved, embedded, and consumed by Sentinel, Source,
  Moves, Tower, audit, and data-trust workflows.
- `19-pilot-strategy-evidence-pack/`: 10 PHI-free, phase-oriented strategy
  templates plus use-case mapping and corpus backlog for the PHA health-plan
  pilot use cases. This pack supports Moves P0-P5 strategy work without raw
  claims, EMR rows, pharmacy records, member identifiers, or call transcripts.
- `docs/build/meridian/MERIDIAN_CONTEXT_LAYER_SHOWCASE.md`: buyer-facing
  walkthrough of the context-layer build path and remaining healthcare corpus
  gap.
