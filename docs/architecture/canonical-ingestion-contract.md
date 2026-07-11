# Canonical Ingestion Contract

Status: operational contract baseline.

The Canonical Ingestion Contract decouples tenant source packets from the physical data layer. Source templates, client extracts, documents, historical packs, Source events, Moves artifacts, and Tower metrics all become the same neutral record shape before persistence.

## Principle

A source adapter parses source material into `CanonicalIngestionRecord` objects. The adapter does not know database tables, generated IDs, foreign keys, module-local identifiers, or persistence rules. The Target Data-Layer Writer owns those concerns.

## Canonical Record Shape

```ts
interface CanonicalIngestionRecord {
  tenantKey: string;
  deploymentKey?: string;
  packetVersion: string;
  domain: CanonicalDomain;
  objectType: string;
  sourceObjectId: string;
  canonicalObjectKey?: string;
  attributes: Record<string, CanonicalValue>;
  relationships: CanonicalRelationship[];
  evidenceReferences: EvidenceReference[];
  sourceAuthority: SourceAuthority;
  effectiveDate?: string;
  observedAt?: string;
  confidence?: number;
  sensitivity: DataClassification;
  dataStatus: "real" | "synthetic" | "curated" | "benchmark";
  qualityStatus: "valid" | "warning" | "quarantined";
  lineage: TransformationLineage[];
}
```

## Required Validation Gates

- `tenantKey`, `packetVersion`, `domain`, `objectType`, and `sourceObjectId` are present.
- At least one evidence reference exists for tenant-owned facts.
- Every relationship has a relationship type, target type, target key, and evidence basis.
- `dataStatus` and `sensitivity` are explicit.
- `qualityStatus` is `valid`, `warning`, or `quarantined`; invalid records cannot be silently dropped.
- Transformation lineage records adapter, mapping profile, contract version, and timestamp.

## Required Concepts

- tenant and deployment identity
- packet contract version
- canonical domain and object type
- stable source object identifier
- canonical object key when known
- attributes with value type, units, and confidence
- typed relationships
- evidence references
- source authority
- effective date and observed time
- sensitivity and real/synthetic status
- quality status
- transformation lineage

## Independence Rules

The contract must remain independent of:

- physical table names
- schema names
- database-generated IDs
- module-local IDs
- historical file names
- storage technology
- current module implementation details

The record shape is also independent of historical source-template names. Compatibility names are allowed only in lineage or `legacyMigrationName` fields.

## Distinctions

- A source file is not a fact.
- A source row is not a canonical object until mapped and validated.
- A canonical fact is not a client-facing claim until evidence-bound.
- A recommendation is not an outcome measurement.
- A value commitment is not realized value.
- A generated artifact is not durable enterprise memory until promoted.

## Target Writer Handoff

The Canonical Ingestion Contract stops at validated neutral records. The Target Data-Layer Writer owns:

- database IDs and foreign keys
- canonical object identity resolution
- fact versioning and supersession
- deduplication and idempotency
- evidence/source linkage
- relationship materialization
- candidate tenant data version creation
- quarantine persistence and proof bundle links
