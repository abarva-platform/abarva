# Tenant Packet Contract

Status: official architecture baseline.

A Tenant Packet is an input contract, not a database representation.

## Manifest Fields

- tenant identity / cover name
- packet contract version
- source classification
- real/synthetic status
- sensitivity classification
- source owner
- effective/as-of date
- intended domains
- intended modules
- file inventory
- source authority
- parser/mapping profile
- required quality rules
- optional extensions

## Minimum Bundle

| Input | Classification |
| --- | --- |
| enterprise profile | mandatory |
| organizational/functions map | mandatory |
| applications/systems | mandatory |
| data assets/integrations | mandatory |
| vendors/contracts | mandatory for Source/commercial use cases |
| spend/value | mandatory for Tower/value claims |
| programs/priorities | mandatory for Moves/AI portfolio use cases |
| risks/controls | mandatory for governed recommendations |
| metric definitions | mandatory for Tower |
| evidence registry | mandatory |

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
10. Load Evidence Registry
11. Load Canonical Fact Store
12. Resolve graph relationships
13. Generate candidate tenant data version
14. Build Derived Intelligence
15. Calculate first-wave analytics
16. Calculate module readiness
17. Run safety and tenant-isolation tests
18. Generate proof bundle
19. Require promotion approval
20. Promote candidate to active version
21. Verify Home, Intelligence, Moves, Source, and Tower consumption
