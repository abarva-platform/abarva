# Mapping Registry

Status: official architecture baseline.

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

## Coverage Reporting

Every load reports:

- mapped fields
- unmapped fields
- quarantined records
- transformation warnings
- coverage by domain
- coverage by intended module
- compatibility warnings
