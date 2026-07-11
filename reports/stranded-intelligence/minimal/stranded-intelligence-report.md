# Stranded Intelligence Report

Tenant: `minimal-demo`
Packet: `packet-minimal-demo-2026-07-11`
Generated: `2026-07-11T00:00:00.000Z`

This report is dry-run only. It identifies canonical intelligence that has been parsed and planned,
but is not yet persisted, promoted, derived, graphed, or proven through module consumption.

## Summary

- Canonical records evaluated: 5
- Target operations evaluated: 10
- Stranded records: 5
- Target writes physical tables: false
- Candidate version persisted: false
- Active promotion proven: false
- Module consumption proven: false
- Quality gate: pass

## Findings

| Source object | Object type | Planned stores | Why stranded |
| --- | --- | --- | --- |
| ent-minimal-001 | enterprise_profile | canonical_fact_store, evidence_registry | target_write_planned_not_persisted, candidate_version_not_persisted, module_readiness_not_proven, derived_intelligence_not_materialized |
| func-ops-001 | enterprise_profile | canonical_fact_store, evidence_registry | target_write_planned_not_persisted, candidate_version_not_persisted, module_readiness_not_proven, derived_intelligence_not_materialized |
| sys-analytics-001 | enterprise_profile | canonical_fact_store, evidence_registry | target_write_planned_not_persisted, candidate_version_not_persisted, module_readiness_not_proven, derived_intelligence_not_materialized |
| ev-minimal-profile | evidence_registry_entry | canonical_fact_store, evidence_registry | target_write_planned_not_persisted, candidate_version_not_persisted, module_readiness_not_proven, derived_intelligence_not_materialized |
| ev-minimal-analytics | evidence_registry_entry | canonical_fact_store, evidence_registry | target_write_planned_not_persisted, candidate_version_not_persisted, module_readiness_not_proven, derived_intelligence_not_materialized |
