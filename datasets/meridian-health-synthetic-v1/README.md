# Meridian Health Synthetic Substrate Pack v1

Synthetic healthcare-vertical substrate for Meridian Health System.

This scaffold mirrors the existing synthetic data-pack shape with Meridian
identity, healthcare systems, HIPAA/CMS regulatory overlays, clinical AI
tooling, application portfolio, vendor contracts, DORA baselines, context
source files, and Sentinel verification targets.

Tenant key: `meridian`
Display name: Meridian Health System

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
- `docs/build/meridian/MERIDIAN_CONTEXT_LAYER_SHOWCASE.md`: buyer-facing
  walkthrough of the context-layer build path and remaining healthcare corpus
  gap.
