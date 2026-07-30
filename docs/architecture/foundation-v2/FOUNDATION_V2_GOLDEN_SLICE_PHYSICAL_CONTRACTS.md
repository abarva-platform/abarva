# Foundation V2 Golden Slice Physical Contracts

Status: implementation slice in progress.

Migration: `supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql`

## Boundary

The `foundation_v2` schema is V2-only and isolated for golden-slice proof. It does not rewrite live V1 governed history, active baseline membership, publications, projections, Cube objects, providers, or product runtime bindings.

## Concrete Contract Pattern

Every tenant-scoped golden-slice table carries:

- `tenant_key text not null`
- `test_namespace text not null`
- typed primary key
- typed foreign keys where the layer consumes upstream objects
- non-empty checks for every required text identity, key, state and proof field
- timestamped creation metadata
- enum checks for authority, review, disposition, parity or render states
- tenant/test namespace indexes
- row-level security requiring an exact `app.tenant_key` or `app.client_key` match and an exact `app.foundation_v2_test_namespace` match

## Golden-Slice Tables

| Layer         | Tables                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| L0/L1         | `source_releases`, `source_files`, `source_records`                                      |
| L2            | `source_field_values`, `parser_executions`                                               |
| L3            | `normalized_objects`                                                                     |
| L4/L5         | `knowledge_candidates`, `review_batches`, `review_decisions`                             |
| L6            | `canonical_objects`                                                                      |
| L7/L8         | `domain_publications`, `publication_members`, `baselines`, `baseline_object_memberships` |
| L9            | `projection_authority`, `projection_rows`, `projection_field_lineage`                    |
| L10           | `cube_parity_results`                                                                    |
| L11/L12       | `product_binding_proofs`, `ava_packet_proofs`                                            |
| Cross-cutting | `gate_results`                                                                           |

## Isolation Controls

`source_releases.isolation_scope` is constrained to `ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY`.

`baselines.baseline_state` permits isolated and candidate states only; production activation is outside this migration.

`ava_packet_proofs.unsupported_claim_count` is constrained to zero.

`product_binding_proofs` prevents `render_gate_status = 'passed'` when unsupported claims are present.

The migration includes no `public` table creation or mutation statements.

## Validation

Run:

```bash
npm run test:foundation-v2-migration
npm run test:foundation-v2-migration:apply
npm run test:foundation-v2-golden-slice
```

The test validates required tables, exact-match RLS registration, isolation markers, enum constraints, non-empty required text checks, product/aVa unsupported-claim guards, composite tenant/test foreign keys, and absence of public/V1 mutation tokens.

The migration apply test starts a temporary local PostgreSQL cluster, applies only the Foundation V2 migration, inspects catalog state for table count, RLS, composite FKs, non-empty required-text constraints, RLS bypass absence and product guard presence, then shuts the cluster down.

The golden-slice test validates the 21-row fixture matrix, layer counts, expected object and lineage IDs, zero unexplained transition variance, and executable negative coverage for the 17 named failure injections. It does not mutate PostgreSQL or Azure; migration dry-run and live golden-slice layer proof remain separate downstream proof steps.
