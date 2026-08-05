# Synthetic Healthcare Demo Model-Fit Audit

Status: candidate, audit_only, not_released

Phase A does not create or apply migrations. This audit records candidate gaps that must be reviewed before any Phase B staged load.

## Candidate Additive Gaps

| Proposed entity | Grain | Classification | Why it may be needed | Phase B recommendation |
| --- | --- | --- | --- | --- |
| canonical contract scope relationship | contract-service-application-CI | MISSING_ADDITIVE_TABLE | The package includes 720 tenant-scoped scope relationships with upstream lineage. | Add only if current relationship storage cannot preserve source lineage and confidence. |
| source service credit fact | contract-service-month | MISSING_ADDITIVE_FIELD | Eligible, claimed and unclaimed service-credit facts need deterministic reconciliation. | Prefer additive nullable fields in existing service performance projections. |
| consumption sourcing BPO normalized TCO | supplier-scenario-year | NEW_CONSUMPTION_PROJECTION_REQUIRED | The BPO event compares headline price against transition, retained org, automation and risk. | Add a consumption projection after raw and canonical load prove the grain. |
| Cube source contract economics members | contract-family-month | NEW_CUBE_MEMBER_REQUIRED | Executive drill paths need tenant/dataset/as-of cache keys. | Add Cube members only after staged PostgreSQL/Cube reconciliation. |
| doc evidence span row | document-page-span | EXISTING_TABLE_NEW_ROW | Evidence spans need accepted extraction and review state. | Reuse existing document/evidence tables if they can carry review state and provenance. |

## Rejected In Phase A

- Any tenant activation.
- Any database migration.
- Any product route or Cube runtime change.
- Any missing-tenant fallback to SkyHarbor.
- Any product-specific read of Layer 1 source extracts.
