# Repeatable New-Client Onboarding Proof

Generated: `2026-07-13T00:00:00.000Z`

This proof defines the minimum pilot packet, onboarding workflow, target data
layers, and proof gates for a repeatable new-client onboarding process. It does
not load new-client data or promote any tenant.

## Required Input Files

- tenant_manifest: tenant-manifest.yaml, tenant-profile.json -> Tenant Packet
- enterprise_profile: enterprise-profile.csv, systems-vendors-initiatives.xlsx -> Canonical Fact Store
- evidence_registry: evidence-registry.csv, source-file-index.xlsx -> Evidence Registry
- source_events: contracts.csv, vendors.csv, rfp-events.csv -> Source Adapter Input
- moves_artifacts: moves.csv, initiative-dossiers.zip, phase-evidence.csv -> Module Memory
- tower_value_baselines: value-baselines.csv, outcome-metrics.xlsx -> Outcome Ledger
- mapping_profiles: mapping-profile.yaml, field-map.csv -> Canonical Ingestion Contract

## Workflow

- packet-intake: Collect the standardized Tenant Packet. (client)
- contract-validation: Validate required files and attest synthetic/client-safe boundaries. (abarva)
- adapter-dry-run: Run source adapters into canonical ingestion records. (abarva)
- target-writer-plan: Build the target writer dry-run plan. (abarva)
- candidate-version: Persist candidate metadata only. (abarva)
- preview-and-readiness: Generate module preview and readiness proof. (joint)
- promotion-dry-run: Rehearse promotion execution and rollback. (abarva)
- operator-decision: Approve or reject active access promotion. (joint)

## Guardrails

- Production tenant data written: false
- Active Tenant Access updated: false
- New client data loaded: false
