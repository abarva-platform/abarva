# Codex Brief — Broker Integration Bundle (PR-V + PR-W + PR-X)

**Sender:** Anand (founder, AbarVa)
**Recipient:** Codex
**Why this bundle is yours:** you just shipped the data layer (vector + graph + patterns + broker contract) and have warm context on the actual choices made. Three PRs that genuinely benefit from that knowledge — generic UI work would waste it.
**Boundary you set (and we're respecting):** `feedback_broker_boundary.md` — app-tier code goes through `AgentContextBroker`, never directly imports `EnterpriseDataRoom` / vector / graph from `src/app/**` or `src/lib/agent/**`.
**Companion docs:**
- `docs/build/AGENT_INTELLIGENCE_SURFACE_AREA.md` (architecture map · §6 = the broker boundary)
- `src/lib/knowledge/agent-context-broker.ts` (the contract itself)

---

## What's in the bundle

| PR | Title | Scope |
|---|---|---|
| **PR-V** | `ProgramsBrokerAdapter` (read-only) | Thin wrapper around `buildEnterpriseAgentContextBundle` |
| **PR-W** | Evidence-binding tests | Verify each phase pack's `evaluationHint` maps to a known concept |
| **PR-X** | Graph/vector readiness doc | Document choices made; gates Wave 5 persistence |

These three can ship as one PR or three sequential PRs at your discretion. Title prefixes for sequencing if separate:
- `feat(programs/broker): ProgramsBrokerAdapter (Surface 2 PR-V)`
- `test(programs/phase-packs): evidence-binding (Surface 2 PR-W)`
- `docs(build): graph + vector readiness (Surface 2 PR-X)`

---

## PR-V · `ProgramsBrokerAdapter`

### Why

Today, `src/app/api/chat/agent/route.ts` builds Nexus's system block from per-pattern + per-phase static knowledge. It has no path to live tenant evidence (deliverables, vendors, systems, evidence items) because the broker boundary forbids direct data-room imports from app-tier.

`ProgramsBrokerAdapter` is the **single allowed seam**. It wraps `buildEnterpriseAgentContextBundle` so future Programs work (Wave 2 evidence runner, Wave 3 sponsor-health drift, Wave 4 portfolio reasoning) can request bundle-shaped context without each touching the broker contract directly.

### Where

Create `src/lib/programs/programs-broker-adapter.ts`. It is a server-side module (broker work is sync but reads enterprise data room state which lives server-side). No React, no client-only imports.

### Contract

```typescript
import {
  buildEnterpriseAgentContextBundle,
  type EnterpriseAgentContextBundle,
  type EnterpriseAgentName,
  type EnterpriseContextSurface,
} from '@/lib/knowledge/agent-context-broker';

export interface ProgramsBrokerRequest {
  /** Tenant client key, e.g. 'apex-retail'. */
  tenantKey: string;
  /** Program id. */
  programId: string;
  /** Agent acting in this turn (Nexus/Sentinel/etc). Determines what the broker reveals. */
  agentName: EnterpriseAgentName;
  /** Optional override; defaults to '/programs/<id>'. */
  surface?: EnterpriseContextSurface;
  /** Forwarded to the broker contract — defaults to `false`. */
  allowL4RawContext?: boolean;
  /** Forwarded — defaults to `false`. */
  includeGraphNeighborhood?: boolean;
  /** Forwarded — defaults to undefined (broker chooses). */
  requestedDomains?: EnterpriseAgentContextRequest['requestedDomains'];
}

export function buildProgramsContextBundle(
  request: ProgramsBrokerRequest,
): EnterpriseAgentContextBundle;
```

The implementation is a 5-line passthrough. The reason it's a separate module: it gives Wave 2/3/4 PRs a single import path to update if the broker contract evolves, AND it gives us a focused place to add Programs-specific defaults (e.g. always include graph neighborhood for `/programs/<id>` because Nexus benefits from cross-program awareness).

### Hard rules

1. **No direct EnterpriseDataRoom imports.** Only `agent-context-broker` exports.
2. **Read-only.** No mutation paths. Write-back is PR-Y in the surface area doc, not this PR.
3. **No app-tier coupling.** Don't add this to any agent route yet — that's a follow-up PR. This bundle just creates the seam.
4. **No silent fallbacks.** If the tenant is unknown, return whatever `buildEnterpriseAgentContextBundle` returns (which already has a "blockedItems" path for `unknown_tenant`). Don't paper over.

### Tests

`src/lib/programs/__tests__/programs-broker-adapter.test.ts`:
- Round-trip: pass a valid tenant + program → returns a bundle with matching `tenantKey` / `agentName` / `surface`.
- Surface default: omit `surface` → defaults to `/programs/<id>`.
- L4 raw default: omit `allowL4RawContext` → bundle reflects `false`.
- Unknown tenant: bundle has `blockedItems` with `reason: 'unknown_tenant'`.
- Adapter does not throw on any valid input.

---

## PR-W · Evidence-binding tests for Phase Packs

### Why

Phase Packs ([`src/lib/programs/phase-packs/`](../../src/lib/programs/phase-packs/)) have `definitionOfDone[].evaluationHint` strings that *describe* how Nexus would know the evidence exists — referencing tables, columns, or data-room concepts. Today these hints are free-text. When the broker goes live, we need confidence that the vocabulary actually maps to either a current DB concept OR a data-room artifact concept.

This PR is a **string/vocabulary matching test**, not a runtime test. It does NOT call the broker, does NOT query DBs. It just asserts that each hint contains at least one term from a known vocabulary.

### Where

`src/lib/programs/phase-packs/__tests__/evidence-binding.test.ts`

### Implementation

1. Build two known-vocabulary sets:
   - **DB concepts** — extract table.column references from the supabase migrations under `supabase/migrations/*.sql`. Lower-case, deduped. e.g. `deliverables_v2.status`, `engagement_participants.approval_authority`, `program_modules.module_key`.
   - **Data-room concepts** — extract artifact / evidence / system / vendor concept names from `src/lib/knowledge/enterprise-data-room.ts` (and adjacent files in `src/lib/knowledge/`). e.g. `evidence`, `vendor_landscape`, `artifact`, `data_classification`.

2. For each pack and each `definitionOfDone[]` item:
   - Tokenize the `evaluationHint` (lower-case, split on whitespace + punctuation).
   - Assert the hint contains **at least one** known term.
   - When it doesn't match, fail with the pack name + item id + hint text + suggested vocabulary terms.

3. Cross-phase consistency check (already covered by schema-sanity but extend it): every `producesForNext` line should reference at least one term that appears in the next phase's `requiresFromPrior`. (P2 → P3 already passes; verify all 6 transitions.)

### Acceptance

The test must pass on the current set of 7 packs without any pack content changes. If hints don't match, that's a finding — open issues against specific packs rather than relaxing the test.

---

## PR-X · Graph + Vector readiness doc

### Why

Wave 5 (longitudinal pack evolution + outcome telemetry) and Wave 4 (cross-program portfolio reasoning) both need persistence beyond what Postgres + JSONB give us today. Before any persistence migration lands, we need ONE document that says what we're actually doing and why.

Recommended defaults from your earlier message — captured here so we have a record:
- Embedding: `text-embedding-3-small`, 1536 dims
- Vector store: Supabase pgvector with `vector(1536)` if pgvector is the choice
- Graph: Postgres tables first, NOT Neo4j-first

### Where

`docs/build/GRAPH_VECTOR_READINESS.md`

### Sections

1. **Status snapshot** — what's live as of this doc's date. (You shipped the broker contract + edge nodes + patterns; document what that actually means in concrete terms — schemas, generated files, contracts.)
2. **Embedding model decision** — chosen model, dim, tokenization, cost rationale, fallback.
3. **Vector store decision** — pgvector vs alternatives. If pgvector, the `vector(N)` shape, ANN index type (HNSW recommended), distance metric (cosine).
4. **Graph store decision** — Postgres-first rationale (operational simplicity, single-DB transaction guarantees, no separate ops). What edges types exist today; how `enterprise_graph_*` tables (or whatever they're named) shape up.
5. **Migration sequencing** — which migration adds which capability; ordering constraints (e.g., embeddings before similarity search; graph tables before cross-program queries).
6. **App-tier impact** — how the broker contract surfaces these stores without violating the boundary. ProgramsBrokerAdapter (PR-V) is the seam.
7. **Open decisions** — flag anything we haven't decided so it's not buried.

### Acceptance

Anand reviews. The doc should let any new reader (or a future agent) understand the persistence story without reading any migration SQL or broker source.

---

## Boundary rules across the whole bundle

These rules apply to all three PRs:

1. **Phase Packs are static doctrine.** Don't modify pack files. PR-W is a test against existing packs, not a pack-content edit.
2. **App-tier (`src/app/**`, `src/lib/agent/**`) imports must NOT include EnterpriseDataRoom seeds, broker internals, vector, or graph stores.** Only `src/lib/knowledge/agent-context-broker` is allowed.
3. **`src/lib/programs/**` is allowed to host `programs-broker-adapter.ts`.** That's the seam; it imports from `@/lib/knowledge/agent-context-broker` only.
4. **Read-only.** No write-back contracts in this bundle. PR-Y handles writes, separately.

---

## Verification

Before opening any PR:

```bash
npx tsc --noEmit
npx eslint src/lib/programs/ src/lib/programs/__tests__/
npx jest src/lib/programs --silent
```

All three must be clean. If `evidence-binding.test.ts` reports failures, those are findings — capture them in the PR body, don't relax the assertion.

For the doc PR (PR-X), no code checks needed; just confirm Markdown renders cleanly in the GitHub PR preview.

---

## What Codex should NOT do

- Do not modify `agent-context-broker.ts`. The contract is yours; you set it. If something is missing, flag in the PR body.
- Do not author any new agent tools (advance_phase territory).
- Do not modify any phase pack files.
- Do not wire ProgramsBrokerAdapter into any route. That's the next PR (Wave 2's evidence-binding runner) — not this bundle.
- Do not add embedding generation or DB queries inline in app-tier — go through the broker, even after this bundle.

---

## Founder review focus

Anand will review for:
1. PR-V is genuinely thin (5-line wrapper plus types) — bloat is a smell.
2. PR-W's vocabulary sets are genuinely complete (not 20 terms when there are 200).
3. PR-X reads like real documentation — concrete decisions, not "we will consider X."
4. Boundary respected end-to-end. Any direct EnterpriseDataRoom import from app-tier is a rejection.

If PR-V's contract feels wrong (defaults, surface naming, request shape), open the PR and flag it — the contract isn't sacred yet, it's just designed-not-shipped.
