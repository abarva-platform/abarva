# Packet 25 — Provenance UI Live-Data Binding (Codex Lane B)

**Status:** Ready for Codex. Self-contained brief — no further coordination required.
**Companion to:** PACKET_24_TENANT_SUBSTRATE_LOADER.md (Claude shipped this; Northstar substrate now in Supabase).
**Why this exists:** the architectural review asked us to "trace back to the process of loading data and show them how we did that." The admin UI currently reads from hardcoded mock constants in `src/lib/context-ingestion/northstar-read-model.ts` — every number you see at `/admin/context-layer` is fiction. Now that the loader writes real ingestion records, the UI needs to read them.

---

## Goal

Replace every hardcoded constant in `/admin/context-layer/*` with a server-side query against live Supabase. The CXO walkthrough must show actual numbers tied to actual loaded files, with click-through to the source-file → chunk → embedding evidence chain.

## Inputs you have

Already in Supabase (Northstar today; other tenants coming):

| Table | What's in it | Where it came from |
|---|---|---|
| `enterprise_context_chunks` | 720 Northstar rows, one per loaded chunk. Columns: `id, client_id, tenant_key, chunk_id, source_segment_id, source_record_id, source_doc, source_path, chunk_index, chunk_text, token_count, embedding_status, embedding_model, embedded_at, provenance (JSONB), chunk_metadata (JSONB), embedding (vector 1536)` | Packet 24 loader |
| `ai_egress_audit` | 720 Northstar rows with `workflow='substrate-loader-embed'`. Columns: `id, tenant_id, workflow, artifact_id, artifact_type, provider, model, route, data_class, policy_decision, decision_reason, prompt_hash, request_metadata (JSONB), created_at` | Packet 24 loader writes one row per embedding call |
| `clients` | One row per tenant with `id, name, tenant_key, ai_policy` | Pre-existing |

## What you MUST NOT touch

- `src/app/api/intelligence/ask/*` — Sentinel grounding pipeline. Tenant resolver and synthesizer are stable; do not refactor.
- `src/lib/active-client.ts` — tenant resolver. Already shipped + fixed.
- `scripts/seed/load-tenant-substrate.ts` — Claude's lane.
- Any tests under `src/__tests__/` — your changes must keep these passing.

## File-by-file checklist

### 1. `src/lib/context-ingestion/northstar-read-model.ts`

**Action:** rename to `src/lib/context-ingestion/tenant-context-read-model.ts`. Remove every hardcoded constant. Replace with tenant-parameterized async queries.

Replace exports with these signatures:

```ts
export interface TenantContextSummary {
  tenantKey: string;
  displayName: string;
  ingestionFilesCount: number;
  chunksCount: number;
  chunksEmbedded: number;
  chunksPending: number;
  chunksFailed: number;
  lastEmbeddedAt: string | null;
  embeddingProviders: string[]; // unique providers used
  embeddingModels: string[];    // unique models used
  totalEmbeddingCalls: number;  // count of ai_egress_audit rows
}

export interface IngestionStageRow {
  stage: 'Upload Received' | 'Classified' | 'Parsed' | 'Mapped' | 'Validated' | 'Awaiting Approval' | 'Committed' | 'Available to Agents';
  files: number;
  facts: number;
  issues: number;
  approved: number;
}

export async function getTenantContextSummary(clientId: string): Promise<TenantContextSummary>;
export async function getTenantIngestionStages(clientId: string): Promise<IngestionStageRow[]>;
export async function getTenantSourceFiles(clientId: string, opts?: { limit?: number }): Promise<Array<{ source_doc: string; chunk_count: number; first_loaded_at: string; sample_chunk_id: string }>>;
export async function getTenantEmbeddingHistory(clientId: string, opts?: { limit?: number }): Promise<Array<{ id: string; chunk_id: string; provider: string; model: string; policy_decision: string; created_at: string }>>;
export async function getTenantEvidenceMapForFile(clientId: string, sourceDoc: string): Promise<Array<{ chunk_id: string; chunk_index: number; chunk_text: string; embedding_status: string; embedded_at: string | null }>>;
```

The mapping of ingestion stages to live numbers (your responsibility to implement these queries):

| Stage | Compute from |
|---|---|
| Upload Received | `count(DISTINCT source_doc) FROM enterprise_context_chunks WHERE client_id = ?` |
| Classified | same — every chunk has classification metadata in `chunk_metadata` |
| Parsed | `count(*) FROM enterprise_context_chunks WHERE client_id = ?` (rows are the parsed facts) |
| Mapped | same as Parsed (we don't have a separate mapping table; mapping is implicit in the schema) |
| Validated | `count(*) WHERE client_id = ? AND chunk_text != ''` |
| Awaiting Approval | `count(*) WHERE client_id = ? AND embedding_status = 'pending'` |
| Committed | `count(*) WHERE client_id = ? AND embedding_status = 'embedded'` |
| Available to Agents | same as Committed (Sentinel reads from `embedding` directly) |

Use the service-role supabase client (`getServerSupabase`) since these are server components.

### 2. `src/app/(maestro)/admin/context-layer/page.tsx`

**Action:** make it tenant-aware. Resolve the active tenant via `getActiveClientRow()` (already exists). Render from the new helpers.

- Drop the imports of `NORTHSTAR_PROFILE`, `NORTHSTAR_INGESTION_STAGES`, `NORTHSTAR_CONTEXT_SUMMARY`, etc. (delete them)
- Add `const activeClient = await getActiveClientRow(null);` at the top of the component
- Use `await getTenantContextSummary(activeClient.id)` and `await getTenantIngestionStages(activeClient.id)`
- Title: `${activeClient.name} Context Layer` (not hardcoded "Northstar Clinical Technologies")
- Numbers (`96 files`, `7820 facts`, etc.) now reflect the active tenant

### 3. `src/app/(maestro)/admin/context-layer/uploads/page.tsx`

**Action:** replace the hardcoded 3-row sample CSV demo with a real list.

- Remove the `runNorthstarContextIngestion({ fileName: 'ServiceNow_CMDB_Export.csv', text: sampleCsv })` call
- Replace with `const sourceFiles = await getTenantSourceFiles(activeClient.id, { limit: 50 });`
- Render a table: source_doc, chunk_count, first_loaded_at, link to evidence-map page filtered to that source_doc

### 4. `src/app/(maestro)/admin/context-layer/syncs/page.tsx`

**Action:** read embedding history from `ai_egress_audit`.

- `const history = await getTenantEmbeddingHistory(activeClient.id, { limit: 100 });`
- Render a table: created_at, chunk_id, provider, model, policy_decision, audit row link

### 5. `src/app/(maestro)/admin/context-layer/evidence-map/page.tsx`

**Action:** for a given `source_doc` query param, list its chunks.

- Read `source_doc` from URL query params
- `const evidenceRows = await getTenantEvidenceMapForFile(activeClient.id, sourceDoc);`
- Render a table: chunk_id, chunk_index, embedding_status, embedded_at, chunk_text excerpt (first 200 chars)

### 6. `src/app/(maestro)/admin/context-layer/approval-queue/page.tsx`

**Action:** show the actual pending chunks (status='pending') or an empty state.

- `const pending = chunks where embedding_status = 'pending' OR embedding_status = 'failed'`
- Render: chunk_id, last attempt at, error message (from `embedding_error`)
- If empty: "All loaded facts have been approved and embedded. No items in queue."

### 7. `src/app/(maestro)/admin/context-layer/templates/page.tsx`

**Action:** can stay as-is for now — templates are static config, not tenant-dependent.

---

## Tests you must add

Create `src/lib/context-ingestion/__tests__/tenant-context-read-model.test.ts`:

```ts
import { jest } from '@jest/globals';

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      // ... mock the query chain returning fake data
    })),
  }),
}));

import { getTenantContextSummary, getTenantIngestionStages } from '../tenant-context-read-model';

describe('tenant-context-read-model', () => {
  it('returns zeros for a tenant with no chunks', async () => { /* ... */ });
  it('returns correct counts when chunks exist', async () => { /* ... */ });
  it('groups embedding history by provider', async () => { /* ... */ });
});
```

Plus a Northstar-specific integration test that hits prod Supabase read-only and asserts the summary shape.

---

## Success criteria

1. `npm run typecheck` passes
2. `npm run lint` passes — zero `Northstar` strings remain in `src/lib/context-ingestion/` after the rename (the Northstar-zero hard-floor regression at `src/lib/__tests__/control-plane-tenant-purity.test.ts` enforces this — your PR will fail CI if any leak)
3. Opening `/admin/context-layer` while signed in as `cio@northstar-clinical.example.com` shows `Northstar MedTech Context Layer` with `720 facts` (or whatever current substrate-audit reports)
4. Opening the same page while signed in as `cdio@meridian-health.example.com` shows `Meridian Health Context Layer` with that tenant's counts (currently 0; will rise as Claude's loader runs Meridian)
5. Opening `/admin/context-layer/evidence-map?source_doc=NST-SRC-001` shows the actual chunks for that source file
6. The `ai_egress_audit` rows from the substrate loader appear in `/admin/context-layer/syncs`

---

## Out of scope (do not do)

- Building or modifying the loader script — that's Lane A (Claude)
- Adding new tables or migrations — schema is stable; query what exists
- Touching `src/app/api/intelligence/ask/*`
- Refactoring the agentRail or marketing pages
- Northstar-specific styling — every tenant must render identically
- Auth / RLS changes
- Cleanup of the 1,151-string control-plane debt — that's Lane C
