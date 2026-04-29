# Session Brief — Intelligence (Sentinel) Surface anchored on Knowledge Layer

**Sender:** Anand (founder, AbarVa)
**Recipient:** Whichever fresh session picks this up — Claude or Codex
**Why a separate session:** the existing Programs session is 200+ turns of Programs context. Intelligence is a different domain (knowledge retrieval, citation discipline) and should be designed clean. Claude's Programs session continues `/programs` list reshape (PR-I) and `/home` reshape (PR-J) in parallel.
**Boundary you're respecting:** [`feedback_broker_boundary.md`](../../) (in user memory) — app-tier code routes through `AgentContextBroker` only, never directly imports `EnterpriseDataRoom` / vector / graph from `src/app/**` or `src/lib/agent/**`.
**Companion docs (read first):**
- [`AGENT_INTELLIGENCE_SURFACE_AREA.md`](AGENT_INTELLIGENCE_SURFACE_AREA.md) (overall architecture map; §6 = broker boundary)
- [`GRAPH_VECTOR_READINESS.md`](GRAPH_VECTOR_READINESS.md) (Codex's persistence decisions; landed in PR #1132)
- [`CODEX_BRIEF_BROKER_BUNDLE.md`](CODEX_BRIEF_BROKER_BUNDLE.md) (the broker handoff, all three PRs merged: V #1129, W #1130, X #1132)

---

## What you're building

`/intelligence` is the **knowledge-layer surface** — Sentinel's territory. The Programs work (PR-A through PR-L, all merged) gave Nexus a coaching playbook for one program at a time. Intelligence makes the **corpus** itself navigable by conversation: patterns, evidence, cross-references, contradictions, vector similarities.

### Wireframe (matches the agent-centric pattern from PR-F)

```
┌─────────────────────────────────────────────────────────────┐
│  Intelligence header · pattern count · corpus version       │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│  CHAT WITH SENTINEL              │  REACTIVE KNOWLEDGE PANE │
│  (~60% of viewport)              │  (~35% of viewport)      │
│                                  │                          │
│  • "Show me patterns like CDP    │  • Pattern cards         │
│     activation"                  │  • Graph neighborhood    │
│  • "What programs share          │  • Evidence citations    │
│     dependencies with            │  • Contradiction flags   │
│     apx-cdp-2026?"               │  • Provenance links      │
│  • "Validate this synthesis      │                          │
│     against KLAS data"           │                          │
│  • "Find a precedent for         │                          │
│     vendor lock-in failure"      │                          │
├──────────────────────────────────┴──────────────────────────┤
│  ▸ Pattern library · graph view · evidence search           │
│    (collapsed corpus browser for direct navigation)         │
└─────────────────────────────────────────────────────────────┘
```

Same `<AgentCanvas>` primitive from `src/components/programs/AgentCanvas.tsx` — extract a reusable shell or mirror the pattern. **Don't reinvent the layout — reuse the primitive that founder approved during the Programs walk.**

---

## What's already shipped that you build on top of

### Knowledge layer (Codex, complete)
- **`buildEnterpriseAgentContextBundle()`** in `src/lib/knowledge/agent-context-broker.ts` — pure function returning a context bundle. Vector + graph + patterns + evidence; broker stays contract-only (no DB queries from app-tier).
- **`ProgramsBrokerAdapter`** in `src/lib/programs/programs-broker-adapter.ts` (PR-V #1129) — thin wrapper around the broker for Programs work. Defaults `surface: 'programs'`. **Pattern to copy for Sentinel.**
- **Evidence-binding tests** (PR-W #1130) — pack `evaluationHint` strings already verified to map to known DB / data-room concepts.
- **Vector + graph defaults** (PR-X #1132 → `GRAPH_VECTOR_READINESS.md`): text-embedding-3-small, 1536 dims, `vector(1536)` via Supabase pgvector, Postgres-first graph fallback.

### Agent shell (Claude's Programs work, complete)
- **`AgentCanvas`** at `src/components/programs/AgentCanvas.tsx` — chat-dominant 60/35 layout
- **`AtlasDrawer` embedded mode** — chat renders inline, no overlay
- **`AtlasPageStateProvider`** parses + dispatches structured artifacts (PR-L) — Sentinel's emissions will flow into the reactive panel automatically
- **Surface canonicalization** in `src/lib/agent/surface.ts` (PR-G) — for tools + artifact gate
- **Existing artifact types** Sentinel can REUSE: `pattern-match`, `evidence-highlight`, `cross-program-dependency`, `classification`. New types proposed below.

### Surface key conventions (THREE layers — don't conflate)

| Layer | Convention | Example for Intelligence |
|---|---|---|
| AppShell / `AtlasPageStateProvider` | Semantic | `'intelligence'` |
| Agent tools + artifact-channel gate | URL-shaped | `'/intelligence'` |
| **Broker** | **Semantic** | `'intelligence'` |

`canonicalizeFromBody()` in `src/lib/agent/surface.ts` already handles `'programs-detail'` → `/programs/<id>`. You may need to extend it for any URL-shaped Intelligence surfaces (e.g. `/intelligence/patterns/<id>` if you add detail routes). For the bare `/intelligence` list surface, `'intelligence'` is the same in both semantic and URL-shaped forms (single-segment) so canonicalization may be unnecessary at first.

---

## PR sequence — start small, layer up

Each PR ships demonstrable value. Don't queue speculative scope from later PRs.

### Sequence

| PR | Title | Scope | Depends on |
|---|---|---|---|
| **PR-INT-A** | `SentinelBrokerAdapter` (read-only) | Thin wrapper, copy of `ProgramsBrokerAdapter`. Default surface: `'intelligence'`. ~5-line implementation plus types. | PR-V (live) |
| **PR-INT-B** | `/intelligence` agent-centric layout reshape | Wrap the page in `AgentCanvas` with Sentinel agent voice. Reactive pane shows existing pattern/evidence cards from artifact channel. Static corpus browser collapses. | PR-F (live) |
| **PR-INT-C** | Sentinel tools (`search_patterns`, `pattern_neighborhood`, `evidence_lookup`) | Three new tools registered for `'intelligence'` surface. Each calls `SentinelBrokerAdapter`. Tool results dispatch as `pattern-match`, `cross-program-dependency`, `evidence-highlight` artifacts (already in the channel). | PR-INT-A + B |
| **PR-INT-D** | New artifact types: `graph-neighborhood`, `contradiction-flag` | When pack/broker contradiction templates fire, surface them. Graph neighborhood as a card showing top edges. | PR-INT-C |
| **PR-INT-E** | `validate_synthesis` tool — Sentinel's quality gate | Tool that validates a synthesis text against the pattern corpus. Returns matches + contradictions. The Sentinel-as-quality-gate role from `quality-gates.ts`. | PR-INT-D |
| **PR-INT-F** | Production walk + polish | Chrome MCP walk verifying each tool fires + each artifact renders. Polish empty states, fonts, density. | PR-INT-A through E |

Total: ~5-6 PRs. Same shape Wave 1 took for Programs.

### What NOT to ship in this brief's scope

- **No write-back from Sentinel.** Read-only contract only. (Write-back is a future cross-cutting PR-Y; not in this bundle.)
- **No vector/graph index management.** That's persistence-layer work, not Intelligence-surface work.
- **No new pattern authoring tools.** Pattern authoring is Codex-territory; Sentinel surfaces existing patterns.
- **No corpus-mutation operations.** Sentinel reads + curates by reasoning, not by editing the corpus directly. (If editing is needed, route through Founder approval — same pattern as Programs.)

---

## Tool contracts (PR-INT-C and PR-INT-E)

All four tools register for surface `'/intelligence'` (URL-shaped) AND `'intelligence'` (semantic) — pick whichever the tool registry's surfaceMatches resolves cleanly. Probably URL-shaped to match the existing convention, with a `canonicalizeSurface` extension if needed.

### `search_patterns`

```typescript
{
  name: 'search_patterns',
  description: 'Vector-similarity search across the AbarVa pattern corpus. Use when the user describes a problem, scenario, or solution shape and wants to find precedents or related patterns. Emits one pattern-match artifact per result so the right pane materializes them.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Natural-language description of what to match against.' },
      scope: {
        type: 'string',
        enum: ['all', 'sourcing', 'lifecycle', 'programs', 'evidence'],
        description: 'Restrict by pattern domain. Defaults to "all".',
      },
      limit: { type: 'number', description: 'Max results, default 5, max 20.' },
    },
    required: ['query'],
  },
  handler: async (input, ctx) => {
    // Resolve tenant from ctx
    // Call SentinelBrokerAdapter with surface='intelligence' + a vector-search request
    // (broker contract may need extension if vector search isn't yet a first-class
    //  request type — flag this in the PR; don't reach around to vector tables)
    // Convert each result into [[artifact:pattern-match]] tuples via ctx.writer
    // Return success with summary
  },
}
```

### `pattern_neighborhood`

```typescript
{
  name: 'pattern_neighborhood',
  description: 'Graph-neighborhood query: what patterns are referenced by, share dependencies with, or contradict the named pattern? Use when the user asks about precedent connections, co-applies, or contradictions.',
  input_schema: {
    type: 'object',
    properties: {
      patternId: { type: 'string' },
      depth: { type: 'number', description: 'Edge-traversal depth, default 1, max 3.' },
      edgeTypes: {
        type: 'array',
        items: { type: 'string', enum: ['co_applies_with', 'contradicts', 'depends_on', 'precedes'] },
      },
    },
    required: ['patternId'],
  },
  handler: async (input, ctx) => {
    // SentinelBrokerAdapter with includeGraphNeighborhood: true
    // Emit [[artifact:graph-neighborhood]] (new type) + per-edge cross-program-dependency
  },
}
```

### `evidence_lookup`

```typescript
{
  name: 'evidence_lookup',
  description: 'Find evidence in the Enterprise Data Room that supports or contradicts a claim. Use when the user makes a factual assertion that should be cited or challenged.',
  input_schema: {
    type: 'object',
    properties: {
      claim: { type: 'string', description: 'The claim to evidence-check.' },
      programId: { type: 'string', description: 'Optional — scope to a specific program.' },
    },
    required: ['claim'],
  },
  handler: async (input, ctx) => {
    // SentinelBrokerAdapter — bundle has `citations` already
    // Emit [[artifact:evidence-highlight]] per citation
  },
}
```

### `validate_synthesis` (PR-INT-E)

```typescript
{
  name: 'validate_synthesis',
  description: 'Run Sentinel quality gates against a synthesis text. Surfaces patterns the synthesis aligns with, contradictions it triggers, evidence it requires. Use when the user asks Sentinel to vet, audit, or stress-test their synthesis.',
  input_schema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The synthesis text to validate.' },
      againstPatterns: { type: 'array', items: { type: 'string' }, description: 'Optional pattern IDs to validate against.' },
    },
    required: ['text'],
  },
  handler: async (input, ctx) => {
    // 1. Vector-search the synthesis text against patterns
    // 2. Run runQualityGates() from src/lib/programs/quality-gates.ts (existing)
    // 3. Surface contradictions via [[artifact:contradiction-flag]] (new type)
    // 4. Surface aligned patterns via [[artifact:pattern-match]]
  },
}
```

---

## New artifact types (PR-INT-D)

Add two to `src/lib/agent/artifacts.ts`:

### `graph-neighborhood`

```typescript
export interface GraphNeighborhoodArtifact {
  type: 'graph-neighborhood';
  rootId: string;
  rootLabel: string;
  nodeCount: number;
  edgeCount: number;
  /** Top edges, max 8 in the card; the bundle has more available. */
  topEdges: Array<{
    targetId: string;
    targetLabel: string;
    edgeType: 'co_applies_with' | 'contradicts' | 'depends_on' | 'precedes';
  }>;
}
```

Card render: ASCII-edge-style layout or a compact hub-and-spoke visualization. Keep it under 200px tall.

### `contradiction-flag`

```typescript
export interface ContradictionFlagArtifact {
  type: 'contradiction-flag';
  contradictionId: string;
  label: string;             // e.g. "Vendor claim vs measured reality"
  severity: 'low' | 'medium' | 'high';
  partyA: string;
  partyB: string;
  detectionDescription: string;
  resolutionPath: string;
}
```

Reuses the shape of `ContradictionTemplate` from `src/lib/intelligence/seed-types.ts` so Codex's pattern data flows through unchanged.

Update `isKnownArtifactType()`, the parser switch, the discriminated union, the `ARTIFACT_CHANNEL_INSTRUCTIONS` documentation, and add tests in `src/lib/agent/__tests__/artifacts.test.ts`.

---

## Boundary rules (the non-negotiable parts)

1. **Never directly import** `EnterpriseDataRoom` seeds, vector store, or graph store from `src/app/**` or `src/lib/agent/**`. Go through `SentinelBrokerAdapter`.
2. **Phase Packs are doctrine — don't modify pack content** in this scope. (PR-W's identified P1→P2 wording gap is on the future-pack-copyedit list, not this bundle.)
3. **Read-only.** No write-back paths. Curation flows are out of scope.
4. **Keep the broker contract symmetric.** If `SentinelBrokerAdapter` needs new request fields (e.g. `includeVectorMatches`, `vectorQuery`), update `EnterpriseAgentContextRequest` in `src/lib/knowledge/agent-context-broker.ts` rather than reaching around it. Flag in PR body.
5. **No schema migrations** in this bundle. Persistence is Codex's lane.

---

## Verification (per PR)

```bash
npx tsc --noEmit
npx eslint src/lib/programs/ src/lib/agent/ src/components/intelligence/  # whichever directories you touch
npx jest src/lib/agent src/lib/programs --silent
```

For the production walk PR (PR-INT-F), use Chrome MCP to walk:

1. Sign in as admin (OTP `424242` → `anand+clerk_test@abarva.com` per `demo_accounts.md`)
2. Navigate to `/intelligence`
3. Verify agent-centric layout: Sentinel chat dominant, knowledge pane right
4. Test each tool with a real prompt:
   - "Show me patterns like CDP activation" → `search_patterns` fires → pattern cards render
   - "What does AMS Consolidation contradict?" → `pattern_neighborhood` → contradictions render
   - "Cite evidence for vendor lock-in risk" → `evidence_lookup` → evidence cards render
5. Verify NO direct vector/graph imports in any file under `src/app/**` or `src/lib/agent/**` (grep for the import paths).

---

## Founder review focus

1. **Boundary respected end-to-end.** Any direct EnterpriseDataRoom / vector / graph import from app-tier is a rejection.
2. **Tools genuinely call the broker.** Mocking the broker in handler code is a smell; the real adapter call should run.
3. **Reactive panel actually populates.** If a tool fires but no artifact lands in the right pane, the channel is broken — same bug class as PR-G (surface mismatch) and PR-L (missing dispatch).
4. **Sentinel voice differs from Nexus.** Sentinel is the librarian — terse, citation-first, contradiction-aware. Don't let the voice drift into Nexus's coaching tone.
5. **Each PR is genuinely small.** PR-INT-A should be 5 lines; PR-INT-B should reuse AgentCanvas; etc. Bloat is a smell.

---

## Open decisions (flag in PR body, don't decide unilaterally)

1. **`/intelligence` surface naming.** Current AppShell type uses `'intelligence'`. The Sentinel-detail layer (per-pattern, per-evidence) doesn't exist yet — should it? If yes, what URL? `/intelligence/patterns/<id>`?
2. **Vector-search request shape on the broker.** `EnterpriseAgentContextRequest` doesn't currently have a `vectorQuery` field. Add it? Or expose vector search as a separate broker function `searchPatternsByVector()`?
3. **Graph-neighborhood depth.** Default 1 vs 2 vs 3? Trade-off: depth-3 gives richer context but the card overflows on noisy patterns.
4. **Pack ↔ Sentinel composition.** Should Sentinel surface phase-pack `contradictionTemplates` automatically when on a `/programs/<id>` surface (cross-agent visibility)? That's PR-INT-C-extension or a future cross-agent PR.

---

## What this unblocks

After this bundle ships:
- Wave 2 cross-agent state (Sentinel→Nexus contradiction relay) becomes implementable
- Wave 4 portfolio reasoning gets real data (graph queries between programs)
- Wave 5 longitudinal pack evolution can use the broker-emitted contradiction signal as input

This is the first surface that **genuinely demonstrates the knowledge layer's value**. Programs surface needs the knowledge layer too, but its primary mode is workflow — Intelligence's primary mode is *retrieval and citation discipline*, which is what makes the data layer's existence felt.
