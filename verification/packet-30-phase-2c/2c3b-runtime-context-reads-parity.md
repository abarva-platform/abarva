# Packet 30 Phase 2C.3b — Runtime Context Reads Parity

## Scope

This slice moves four read-only runtime paths from direct Supabase helpers to
the Packet 30 Azure read plane:

- `src/lib/agent/retrieval.ts`
- `src/lib/enterprise-context/retrieval.ts`
- `src/lib/evidence/citations.ts`
- `src/lib/intelligence/loadKpiDetail.ts`

The slice does not change write paths, storage uploads, mutations, or schema.

## Behavior Parity

| File | Prior behavior | New behavior |
|---|---|---|
| `src/lib/agent/retrieval.ts` | Resolve client tenant key and fetch tenant context chunks through `getServerSupabase()`; fail soft to empty fallback chunks when no data. | Resolve client tenant key and fetch tenant context chunks through `azureRead`; still fail soft to empty fallback chunks on read errors. |
| `src/lib/enterprise-context/retrieval.ts` | Read latest tenant enterprise-context chunks and throw a retrieval-specific error if the query failed. | Reads the same projection through `azureRead` and preserves the retrieval-specific error message. |
| `src/lib/evidence/citations.ts` | Read one `evidence_ledger` row by id and throw on failure. | Reads one `evidence_ledger` row by id through `azureRead` and throws on failure or missing row. |
| `src/lib/intelligence/loadKpiDetail.ts` | Read KPI detail, evidence, telemetry, pattern associations, related KPIs, benchmark cohort, and KPI index through Supabase; most query errors degraded to empty/null because errors were not inspected. | Reads the same tables through `azureRead`; preserves fail-soft empty/null behavior for the KPI bundle helpers. |

## Census Delta

Baseline from current `origin/main` before this slice:

```text
148 files / 608 import-helper matches
301 files / 1426 broad matches
```

After this slice:

```text
144 files / 594 import-helper matches
298 files / 1401 broad matches
```

Delta:

```text
-4 files with import-helper matches
-14 import-helper matches
-3 files with broad matches
-25 broad matches
```

## Validation

```text
npx eslint src/lib/intelligence/loadKpiDetail.ts src/lib/enterprise-context/retrieval.ts src/lib/evidence/citations.ts src/lib/agent/retrieval.ts
```

Result: PASS.

```text
npx jest src/__tests__/integration/atlas/atlas-tower-grounding-contract.test.ts src/lib/enterprise-context/__tests__/chunking.test.ts --runInBand
```

Result: PASS, 2 suites / 8 tests.

```text
npm run audit:runtime-supabase-imports
```

Result: PASS in warn mode, with the census delta above.

```text
npx tsc --noEmit --pretty false --skipLibCheck
```

Result: BLOCKED only by the pre-existing optional dependency resolution debt:
`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`,
and `@resvg/resvg-js`.

## Rollback

Revert this slice to restore the direct Supabase reads in the four runtime
files. No data rollback is required.
