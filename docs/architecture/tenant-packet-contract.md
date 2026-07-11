# Tenant Packet Contract

Status: operational contract baseline.

A Tenant Packet is an input contract, not a database representation. It describes what a client, synthetic demo, or compatibility adapter provides before any source adapter parses it. The packet never promises table names, database IDs, module-local IDs, or a final active tenant version.

## Boundary

```text
source files/templates
-> tenant packet manifest
-> source adapters
-> canonical ingestion records
-> target data-layer writer
```

The packet is accepted only when it can be validated, classified, mapped to source profiles, and traced to intended canonical domains. Source adapters read packet entries; they do not write product tables. The Target Data-Layer Writer owns persistence, IDs, versioning, dedupe, source linkage, and candidate tenant data version creation.

## Manifest Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `contractVersion` | yes | Tenant Packet contract version. |
| `packetId` | yes | Stable packet identifier for audit and idempotency. |
| `tenantKey` | yes | Canonical cover tenant key. |
| `tenantDisplayName` | yes | Safe display name. |
| `dataStatus` | yes | `real`, `synthetic`, `curated`, or `benchmark`. |
| `sensitivity` | yes | Highest packet sensitivity. |
| `sourceOwner` | yes | Accountable owner of the packet. |
| `effectiveDate` | yes | Business as-of date. |
| `intendedDomains` | yes | Canonical domains the packet is meant to populate. |
| `intendedModules` | yes | Modules expected to consume the candidate version. |
| `sourceProfiles` | yes | Declared source classes and mapping profiles. |
| `files` | yes | File inventory with class, adapter, mapping profile, evidence basis, and sensitivity. |
| `qualityGates` | yes | Minimum validation gates before write/promotion. |
| `promotionPolicy` | yes | Rules for candidate creation and active promotion. |
| `legacyMigrationName` | optional | Compatibility label for historical migration source only. |

## Source Classes

- `enterprise_profile`
- `organization_functions`
- `applications_systems`
- `data_assets_integrations`
- `vendors_contracts`
- `spend_value`
- `programs_priorities`
- `risks_controls`
- `metric_definitions`
- `evidence_registry`
- `module_memory`
- `outcome_measurements`
- `benchmark_context`

## Minimum Bundle

| Input | Classification |
| --- | --- |
| enterprise profile | mandatory |
| organizational/functions map | mandatory |
| applications/systems | mandatory |
| data assets/integrations | mandatory |
| evidence registry | mandatory |
| vendors/contracts | mandatory for Source/commercial use cases |
| spend/value | mandatory for Tower/value claims |
| programs/priorities | mandatory for Moves/AI portfolio use cases |
| risks/controls | mandatory for governed recommendations |
| metric definitions | mandatory for Tower |

## Real, Synthetic, And Sensitive Handling

- Real client identities must be mapped to approved cover tenant names before packet validation.
- `dataStatus` is required at packet level and may be narrowed at file level.
- `restricted` files may be registered as evidence but must not become agent-ready until policy allows retrieval and citation.
- Synthetic data may support demos and planning-grade examples only; it must not be laundered into real production claims.
- Benchmark data is tenant-neutral and cannot override tenant-owned source evidence.

## Load States

1. `packet_received`
2. `manifest_validated`
3. `source_classified`
4. `adapter_selected`
5. `mapping_validated`
6. `canonical_records_generated`
7. `canonical_records_validated`
8. `unmapped_fields_reported`
9. `quarantine_reviewed`
10. `target_write_planned`
11. `candidate_version_created`
12. `proof_bundle_generated`
13. `promotion_approved`
14. `active_version_promoted`
15. `module_consumption_verified`

## Promotion Rules

- A packet creates a candidate tenant data version, never an active version directly.
- Promotion requires a proof bundle with validation output, unmapped-field summary, quarantine summary, evidence lineage, tenant isolation checks, and module readiness.
- Promotion must preserve prior active versions for rollback and comparison.
- Partial promotion is allowed only at domain level when omitted domains are explicitly marked out of scope.

## Onboarding Workflow

1. Inspect packet
2. Validate manifest
3. Classify real/synthetic/sensitive data
4. Resolve packet contract version
5. Select adapters and mapping profiles
6. Parse source inputs
7. Generate canonical ingestion objects
8. Validate canonical objects
9. Report unmapped and quarantined records
10. Plan target writes
11. Load Evidence Registry
12. Load Canonical Fact Store
13. Resolve graph relationships
14. Generate candidate tenant data version
15. Build Derived Intelligence
16. Calculate first-wave analytics
17. Calculate module readiness
18. Run safety and tenant-isolation tests
19. Generate proof bundle
20. Require promotion approval
21. Promote candidate to active version
22. Verify Home, Intelligence, Moves, Source, and Tower consumption
