# Canonical Corpus Persistence Read Contract

Date: 2026-05-09

Status: PR-A1 contract. Additive schema only. No backfill writes.

## Purpose

`canonical_industry_ai_patterns` is the durable system of record for canonical Industry AI patterns. It turns the Wave 1 canonical contract into a persisted Supabase table while keeping existing corpus sources intact.

Generated JSON, in-memory indexes, and draft-builder outputs are projections or migration aids. They are not the long-term source of truth.

## Table

Table: `canonical_industry_ai_patterns`

Primary key: `canonical_id`

Persistence metadata:

- `schema_version`: persisted canonical schema version
- `content_hash`: optional deterministic hash for idempotent backfill/change detection
- `source_snapshot_at`: timestamp of the source snapshot used for a backfill row
- `duplicate_risk`: `low`, `medium`, or `high` when crosswalk review identifies overlap risk

Scope fields:

- `visibility_scope`: `global`, `tenant`, or `private`
- `tenant_key`: optional text tenant key for tenant overlays
- `client_id`: optional `clients.id` foreign key for tenant overlays

Global rows are readable by authenticated users. Tenant/private rows are readable when `can_read_tenant_by_key(tenant_key)` or `can_read_tenant_by_id(client_id)` allows access. Writes are reserved for `service_role` paths.

## First-Class Retrieval Columns

The table stores these retrieval fields as first-class columns:

- `industry`
- `enterprise_area`
- `function`
- `process_area`
- `use_case_category`
- `strategic_move_phases`
- `maturity_level`
- `confidence_level`
- `lifecycle_status`
- `source_systems`
- `source_ids`
- `value_levers`

These columns are indexed for exact filters and deterministic fallback retrieval. Full-text search covers title, summary, function, process area, use-case category, business problem, and value hypothesis.

## Provenance Columns

The table stores provenance and trust fields directly:

- `source_crosswalk`
- `source_basis`
- `source_references`
- `confidence_rationale`
- `quantitative_claims`
- `unsupported_claim_flags`
- `content_hash`
- `source_snapshot_at`
- `duplicate_risk`
- `missing_required_fields`
- `missing_provenance`

Agents must surface source basis and confidence when recommending a pattern. Unsupported quantitative claims must not be presented as verified facts.

## Payload Compatibility

`full_pattern` stores the full canonical payload as JSONB. The first-class columns remain authoritative for ranking and filtering. `full_pattern` exists to make migrations, validation, and future schema evolution safer.

## RLS And Access Assumptions

RLS policy:

- `service_role`: full access for controlled migration/backfill/API paths
- `authenticated`: read-only access to global rows plus tenant-visible rows allowed by existing tenant helper functions

No authenticated insert, update, or delete grants are added in PR-A1.

## Backfill Status

PR-A1 does not write data. Backfill is a separate reviewed step:

1. generate deterministic preview from source systems
2. reconcile counts/provenance/duplicates
3. validate missing fields and unsupported claims
4. execute service-role backfill only after preview passes

## Runtime Read Contract

Runtime readers should import:

- `CANONICAL_INDUSTRY_AI_PATTERNS_TABLE`
- `PersistedCanonicalIndustryAIPatternRow`
- `CanonicalPatternReadFilters`
- `CanonicalPatternReadResult`

from `src/lib/intelligence/canonical/persistence-contract.ts`.

The runtime index must read from `canonical_industry_ai_patterns` when available. In-memory indexes may cache rows, but they are not the source of truth.
