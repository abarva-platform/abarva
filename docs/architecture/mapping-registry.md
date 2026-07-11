# Mapping Registry

Status: operational contract baseline.

The Mapping Registry prevents tenant-specific loader forks. It maps source profile fields to canonical domains, objects, attributes, relationships, transformations, and validation rules.

## Mapping Rule Shape

```text
source profile + source field
-> canonical domain
-> canonical object
-> canonical attribute or relationship
-> transformation rule
-> validation rule
```

## Rule Identity

Every mapping rule has:

- `mappingRuleId`
- `mappingProfile`
- `sourceClass`
- `sourceField`
- `targetDomain`
- `targetObjectType`
- `targetAttribute` or `targetRelationshipType`
- `transform`
- `required`
- `confidenceDefault`
- `validFrom`
- optional `deprecatedAt`

## Registry Capabilities

- reusable AbarVa mappings
- tenant-specific overlays
- versioned mappings
- deprecated mappings
- mapping test fixtures
- unmapped-field reporting
- mapping coverage score
- mapping-change impact analysis

## Tenant Overlays

Tenant-specific mappings extend the canonical mapping model. They do not fork the loader and do not introduce tenant-specific persistence tables.

Overlays may rename source fields, define tenant-specific code dictionaries, or tighten validation rules. They must not create module-local schemas or bypass the Canonical Ingestion Contract.

## Coverage Reporting

Every load reports:

- mapped fields
- unmapped fields
- quarantined records
- transformation warnings
- coverage by domain
- coverage by intended module
- compatibility warnings

## Compatibility Rules

- Historical migration labels may be recorded as compatibility metadata only.
- A source template change creates a new mapping profile version, not a new target table.
- A database schema change updates the target writer, not every source adapter.
- Mapping coverage below the packet's quality gate blocks promotion to active.
