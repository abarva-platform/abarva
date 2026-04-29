# Session Brief — Sourcing Module (Sentinel + Sourcer) anchored on Knowledge Layer

**Sender:** Anand (founder, AbarVa)
**Recipient:** Whichever fresh session picks this up — Claude or Codex
**Why a separate session:** Programs is in active Wave-2 broker integration; Intelligence shipped its surface (PR-INT-A through E). Sourcing is the next module — different domain (procurement workflow), different stage taxonomy (RFI → BAFO instead of Discovery → Operate), and parallelizable. The existing Programs/Intelligence sessions stay focused on their ongoing work.
**Boundary you're respecting:** [`feedback_broker_boundary.md`](../../) (in user memory) — app-tier code routes through `AgentContextBroker` only, never directly imports `EnterpriseDataRoom` / vector / graph from `src/app/**` or `src/lib/agent/**`. Same boundary that's now load-bearing across Programs and Intelligence.
**Companion docs (read first):**
- [`AGENT_INTELLIGENCE_SURFACE_AREA.md`](AGENT_INTELLIGENCE_SURFACE_AREA.md) — overall architecture map
- [`SESSION_BRIEF_INTELLIGENCE.md`](SESSION_BRIEF_INTELLIGENCE.md) — the brief that worked for the parallel session model (Sentinel surface). Mirror the structure.
- [`CODEX_BRIEF_BROKER_BUNDLE.md`](CODEX_BRIEF_BROKER_BUNDLE.md) — the broker handoff (PR-V/W/X all merged)
- [`GRAPH_VECTOR_READINESS.md`](GRAPH_VECTOR_READINESS.md) — Codex's persistence decisions
- [`SOURCING_CORPUS_BUILD_KICKOFF_V1.md`](SOURCING_CORPUS_BUILD_KICKOFF_V1.md) and [`SOURCING_CORPUS_BUILD_KICKOFF_V2.md`](SOURCING_CORPUS_BUILD_KICKOFF_V2.md) — the **corpus** authoring track. **NOT this session's scope.** This session does the **module**. Codex continues corpus authoring in parallel.

---

## §0 · The strategic split (read this first)

The two prior corpus kickoffs (v1, v2) conflated two different jobs:

| Track | What it ships | Owner |
|---|---|---|
| **Corpus** | ~150–375 typed `PAT-SRC-*` patterns: vendor profiles, contract clauses, pricing benchmarks, contradictions, risks. Pure content. | Codex (continues) |
| **Module** | The user-facing `/source` surface — Sentinel chat dominant, reactive panel materializing vendor cards / clause cards / BAFO scoreboards / walkaway signals as events progress through stages. Pure UX + behavior. | **This session** |

**This brief is the module track.** It explicitly forbids re-authoring corpus patterns. The 152+ patterns Codex shipped (and continues to author) are the doctrine layer; the module consumes them via the broker.

If anything in this brief seems to suggest pattern authoring, that's a bug in the brief — flag it in the PR body, don't author content.

---

## §1 · What you're building

`/source` becomes the **procurement workspace** — the Sentinel-led canvas where IT procurement runs sourcing events. Two operational modes:

**Mode A · Embedded.** A Program (P3 Design or P4 Build) spawns a Sourcing event with program context: problem statement, evaluation criteria, constraint set, sponsor, kill criterion. Returns a selected vendor + contract terms + onboarding plan back to the Program. Same canvas — no eject when navigating.

**Mode B · Standalone.** IT procurement enters `/source` directly without a Program. Same canvas, same primitives, but the brief / scope is authored fresh (the way Steward authors the program brief on `/programs/new`).

Both modes share one canvas pattern.

### Wireframe (matches Programs / Intelligence)

```
/source                          → portfolio canvas
┌──────────────────────────────────┬──────────────────────────┐
│  CHAT WITH SENTINEL (~60%)       │  REACTIVE EVENT PANEL    │
│  • "What's open in sourcing?"    │  • Open event cards      │
│  • "Show me events at risk"      │  • Stage status pills    │
│  • "Stand up an EHR sourcing"    │  • Walkaway signals      │
├──────────────────────────────────┴──────────────────────────┤
│  ▸ Source events · grid view · 3 active · 1 awarded         │
└─────────────────────────────────────────────────────────────┘

/source/events/<event-id>        → active event canvas
┌─────────────────────────────────────────────────────────────┐
│  Stage Navigator: S0 Intake · S1 Market · S2 Shortlist ·    │
│                   S3 RFP · S4 Demo · S5 BAFO · S6 Contract  │
├──────────────────────────────────┬──────────────────────────┤
│  CHAT WITH SENTINEL              │  REACTIVE PANEL          │
│  • "Compare these 3 vendors"     │  • Vendor cards          │
│  • "Run BAFO check"              │  • Pricing benchmarks    │
│  • "Advance to Contract"         │  • Clause callouts       │
│  • Stage pack drives questions   │  • BAFO scoreboard       │
│  • Anti-pattern flags surface    │  • Walkaway credibility  │
├──────────────────────────────────┴──────────────────────────┤
│  ▸ Event details · evidence · vendor matrix · contract      │
└─────────────────────────────────────────────────────────────┘
```

Same `<AgentCanvas>` primitive from [`src/components/programs/AgentCanvas.tsx`](../../src/components/programs/AgentCanvas.tsx). No new layout primitive — reuse.

---

## §2 · What's already shipped that you build on top of

### Source surface infrastructure (predates agent-centric pattern, needs reshape)
- 14 page routes under `src/app/(maestro)/source/**`
- 64 components under `src/components/source/**` (e.g. `SourceEventDetailPage.tsx`, `SourceJourneyTracker.tsx`, `SourceCommercialWorkflowCanvas.tsx`)
- Rich `src/lib/source/**` modules (bafo-negotiation, agent-missions, ams-outsourcing-2026-view, agent-context, etc.)
- An anchored seed event: `apex-retail-ams-outsourcing-2026` (Stage 7 BAFO)

**These are pre-reshape — same situation `/home` and `/programs` were in before PR-F/I/J.** Static dashboards. The session's job is to put `<AgentCanvas>` at the top and collapse the legacy content into a `<details>` accordion. Static work doesn't disappear; it moves below the fold and stays accessible.

### Knowledge layer (Codex, complete and growing)
- `buildEnterpriseAgentContextBundle()` in `src/lib/knowledge/agent-context-broker.ts`
- `SentinelBrokerAdapter` in `src/lib/agent/tools/intelligence/` (PR-INT-A) — already present and will need a **`SourcingBrokerAdapter`** parallel for sourcing-specific surface keys
- 152+ `PAT-SRC-*` patterns shipped (Codex v1 + v2 in flight)
- Sentinel tools (`search_patterns`, `pattern_neighborhood`, `evidence_lookup`, `validate_synthesis`) — registered for `/intelligence` already; surface filter extension needed for `/source/**`

### Agent shell (Programs work, complete)
- **`AgentCanvas`** at [`src/components/programs/AgentCanvas.tsx`](../../src/components/programs/AgentCanvas.tsx) — chat-dominant 60/35 layout (REUSE)
- **`AtlasDrawer` embedded mode** — chat renders inline, no overlay
- **`AtlasPageStateProvider`** parses + dispatches structured artifacts (PR-L)
- **Surface canonicalization** in [`src/lib/agent/surface.ts`](../../src/lib/agent/surface.ts) — handles `'source'` → `/source`; will need extension for `'source-detail'` ↔ `/source/events/<id>`
- **Existing artifact types** Sourcing reuses: `pattern-match`, `evidence-highlight`, `cross-program-dependency`, `classification`, `contradiction-flag`, `gate-evaluation` (rename concept), `phase-progress` (rename concept)
- **Origination → active continuity (PR-K)** — the persistent-canvas + handoff-marker pattern. Reuse for **Mode A** Programs ↔ Sourcing handoff.
- **In-place advance (PR-L)** — `advance_phase` tool emits `program-phase-changed` artifact → `router.refresh()` keeps the React tree mounted. The same pattern shape goes into `advance_sourcing_stage`.

### Surface key conventions (THREE layers — don't conflate)

| Layer | Convention | Example for Sourcing |
|---|---|---|
| AppShell / `AtlasPageStateProvider` | Semantic | `'source'`, `'source-detail'` |
| Agent tools + artifact-channel gate | URL-shaped | `/source`, `/source/events/<id>` |
| **Broker** | **Semantic** | `'source'` |

Extend `canonicalizeSurface()` for `'source-detail'` → `/source/events/<id>` (same shape as `'programs-detail'` → `/programs/<id>`). The ProgramsBrokerAdapter pattern proves the shape; copy it into `SourcingBrokerAdapter`.

---

## §3 · Stage Packs — the procurement analogue to Phase Packs

Stage Packs are the **load-bearing piece of this brief**. They're the procurement equivalent of Phase Packs — opinionated coaching doctrine that drives Sentinel's questions, anti-pattern detection, and gate evidence at each stage.

**Same TypeScript shape as `PhasePack`** ([`src/lib/programs/phase-packs/types.ts`](../../src/lib/programs/phase-packs/types.ts)). Copy the type, adapt the field semantics:

```typescript
export interface StagePack {
  stage: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  label: string;            // exactly matches STAGE_LABEL_MAP
  outcome: string;          // one paragraph, ≥80 chars — what stage close produces
  definitionOfDone: StageEvidenceItem[];   // ≥1 must be severity:'hard'
  rightQuestions: {
    open: StageQuestion[];     // ≥1 — first turns of the stage
    converge: StageQuestion[]; // ≥1 — drive to decisions
    close: StageQuestion[];    // ≥1 — pre-gate
  };
  antiPatterns: StageAntiPattern[];   // ≥3 — observable signals
  coachingArc: { entry: string; midPhase: string; exit: string };
  dependencies: { requiresFromPrior: string[]; producesForNext: string[] };
}
```

Re-export `StageEvidenceItem` / `StageQuestion` / `StageAntiPattern` as type aliases over `PhaseEvidenceItem` / `PhaseQuestion` / `PhaseAntiPattern` — same shape, different name. (Future refactor can unify into `<TPack>` generic, not now.)

### The eight stages

| Stage | Focus | Pack covers |
|---|---|---|
| **S0 Intake** | Triggering event, scope, kill criterion | Business owner, problem statement, scope boundary, why-now, "what would have to be true to NOT do this" |
| **S1 Market shape** | RFI design, capability research | Named-practitioner backchannel, vendor universe, walkaway-credibility test, scope-vs-readiness gap |
| **S2 Shortlist** | Scoring rubric, evaluation panel | Weights set BEFORE responses received, named challenger, dissenter on the panel, mandatory vs scored |
| **S3 RFP** | Functional vs outcome questions, Q&A discipline | Q&A as ambiguity surface, evaluation orchestration, multi-stakeholder alignment |
| **S4 Demo / POC** | Demo design, POC structure | Demo scenarios buyer-designed not vendor-curated, success criteria locked, red-team scenarios |
| **S5 BAFO** | Multi-day calendar, walkaway, hold-vs-reveal | What goes in BAFO vs side-conversation, sequence (incumbent first or last), price-only vs commercial-terms BAFO |
| **S6 Contract** | Clause hygiene, MFN, exit | Auto-renewal notice, escalator caps, exit-assistance pricing, signature authority, sub-tier supplier disclosure |
| **S7 Activate** | Onboarding, transition, lessons | 90-day window after award, kickoff design, vendor relationship ownership, dual-run, lessons-learned setup |

### Authoring guidance per pack

**Author S5 BAFO first as the gold-standard reference** (parallel to P2 Synthesis for Phase Packs). It's the most operator-coded stage, the most distinctive, the most likely to land voice/structure right. Once it's reviewed and merged, author the other 7 against the same quality bar.

Each pack:
- ≥3 anti-patterns with observable detection hints (no vibes — what would Sentinel *see* in chat or evidence)
- Right-questions have a `why` (used by Sentinel to detect when satisfied)
- Evidence items have an `evaluationHint` describing how the broker would know it exists in the data room
- Coaching arc changes Sentinel's posture across the stage (entry / mid / exit are different)

**Hard rule:** stage packs are static doctrine, just like phase packs. They MUST NOT be wired to tenant data persistence. The runtime evidence-evaluation lives in the broker (or future knowledge-broker layer), not in the pack files.

---

## §4 · PR sequence

8 PRs total, sequenced like Wave-1 for Programs.

| PR-SRC | Title | Scope |
|---|---|---|
| **A** | Stage Pack scaffold + S5 BAFO reference | Schema (`types.ts` aliasing PhasePack types), resolver (`getStagePack`), prompt formatter, S5 reference pack, schema-sanity test suite |
| **B** | `/source` (portfolio) agent-centric reshape | AppShell with surface="source", AgentCanvas at top, FilterPillStrip in middleStrip, legacy event grid in `<details>` accordion. SourcingBrokerAdapter (thin wrapper, parallel to ProgramsBrokerAdapter). |
| **C** | `/source/events/<id>` agent-centric reshape | Same primitives. Stage Navigator at top. AgentCanvas dominant. Legacy commercial workflow / journey tracker in collapsed accordion. |
| **D** | New artifact types + renderers | `vendor-card`, `pricing-benchmark`, `contract-clause`, `bafo-scoreboard`, `walkaway-signal`, `sourcing-stage-progress`. Each with parser case, type guard, ARTIFACT_CHANNEL_INSTRUCTIONS extension, panel renderer. |
| **E** | Sourcing tools | `advance_sourcing_stage` (parallel to advance_phase, server-side gate, emits `sourcing-stage-changed` artifact for in-place refresh), `compare_vendors` (broker-routed multi-vendor scoring), `run_bafo_check` (walkaway credibility + sequence design) |
| **F** | Programs ↔ Sourcing handoff | `spawn_sourcing_event` tool on Programs side (creates event with program context, navigates with `__handoff__` marker via PR-K pattern). `link_to_program` tool on Sourcing side. SessionStorage bridge same shape as origination-handoff. |
| **G** | Author remaining 7 stage packs | S0 Intake, S1 Market, S2 Shortlist, S3 RFP, S4 Demo, S6 Contract, S7 Activate. All against the S5 quality bar. Schema-sanity test suite multiplies × 8. |
| **H** | Production walk via Chrome MCP + polish | Verify all surfaces hold the chat-dominant pattern, reactive panels populate, advance_sourcing_stage gates correctly, Programs handoff works. Polish empty-state copy, fonts, density. |

---

## §5 · Tool contracts

All tools register for `/source` (URL-shaped) AND `'source'` (semantic) — the same dual surface match `advance_phase` uses. Surface canonicalization extension may be needed for `'source-detail'` → `/source/events/<id>`.

### `advance_sourcing_stage` (PR-SRC-E)

```typescript
{
  name: 'advance_sourcing_stage',
  description:
    'Advance a sourcing event to the next stage. Always evaluate gates first — the tool returns ' +
    'gate_blocked_hard with the unmet criteria when hard-gate checks fail. When that happens, surface ' +
    'each unmet criterion to the user as gate-evaluation artifacts; do NOT announce success or pretend ' +
    'the advance happened. Only call this when the user has explicitly asked to advance ' +
    '(e.g. "move to BAFO", "advance the stage").',
  surfaces: ['/source/events/:id'],
  input_schema: {
    type: 'object',
    properties: {
      event_id: { type: 'string', description: 'Sourcing event id (e.g. apex-retail-ams-outsourcing-2026).' },
      to_stage: { type: 'number', description: 'Target stage 0-7. Must equal current_stage + 1 unless bypass_gate.' },
      rationale: { type: 'string', description: 'Plain-language rationale.' },
      bypass_gate: { type: 'boolean' },
    },
    required: ['event_id', 'to_stage'],
  },
  // Handler: same shape as advancePhase.ts. Calls existing gate evaluator
  // (or wraps existing src/lib/source modules — DON'T add a new gate engine).
  // Emits sourcing-stage-changed artifact via ctx.writer for in-place refresh.
}
```

### `compare_vendors` (PR-SRC-E)

```typescript
{
  name: 'compare_vendors',
  description:
    'Multi-vendor scoring against the active stage pack rubric. Use when the user names 2+ vendors and ' +
    'wants a comparison or wants to surface contradictions across them. Emits one vendor-card artifact ' +
    'per vendor and one bafo-scoreboard artifact summarizing the matrix.',
  surfaces: ['/source/events/:id'],
  input_schema: {
    type: 'object',
    properties: {
      event_id: { type: 'string' },
      vendor_ids: { type: 'array', items: { type: 'string' } },
      dimensions: { type: 'array', items: { type: 'string' }, description: 'Optional override of pack rubric dimensions.' },
    },
    required: ['event_id', 'vendor_ids'],
  },
  // Handler: SourcingBrokerAdapter call (broker-routed — vendor data lives
  // in the data room). Does NOT compute scores from corpus content;
  // that's broker territory.
}
```

### `run_bafo_check` (PR-SRC-E)

```typescript
{
  name: 'run_bafo_check',
  description:
    'Pre-BAFO readiness check: walkaway credibility, sequence design, what-to-hold vs reveal. Use when ' +
    'the user is at S4 Demo close or S5 BAFO open. Emits walkaway-signal artifact and bafo-scoreboard ' +
    'preview.',
  surfaces: ['/source/events/:id'],
  // Handler: consults stage pack S5 antiPatterns + SourcingBrokerAdapter
  // for vendor history. Read-only.
}
```

### `spawn_sourcing_event` (PR-SRC-F · Programs side)

```typescript
{
  name: 'spawn_sourcing_event',
  description:
    'Spawn a new Sourcing event from the active Program. Use when the user asks to source a vendor or ' +
    'capability the program needs. The new event inherits the program context (problem statement, ' +
    'evaluation criteria, constraints, sponsor). Persists handoff turns so the conversation continues ' +
    'on /source/events/<id> via the PR-K canvas-continuity pattern.',
  surfaces: ['/programs/:id'],
  // Handler: creates event in DB, persists conversation handoff, returns
  // event_id + redirect path. Client navigates; AtlasPageStateProvider
  // hydrates from sessionStorage just like origination → active.
}
```

### `link_to_program` (PR-SRC-F · Sourcing side)

```typescript
{
  name: 'link_to_program',
  description: 'Bind this sourcing event to an existing Program for cross-surface visibility.',
  surfaces: ['/source/events/:id'],
}
```

---

## §6 · New artifact types (PR-SRC-D)

Add to [`src/lib/agent/artifacts.ts`](../../src/lib/agent/artifacts.ts) — extend the `ArtifactType` union, add typed payloads, parser cases, type guard, ARTIFACT_CHANNEL_INSTRUCTIONS examples, panel renderers.

```typescript
// Vendor summary card (post broker call)
export interface VendorCardArtifact {
  type: 'vendor-card';
  vendorId: string;
  name: string;
  tier: 'enterprise' | 'mid-market' | 'specialist' | 'emerging' | 'incumbent';
  positioning: string;
  riskFlags?: string[];
  patternId?: string; // back-reference to PAT-SRC-VEN-*
}

// Pricing benchmark callout
export interface PricingBenchmarkArtifact {
  type: 'pricing-benchmark';
  category: string;
  metric: string;          // e.g. "per-seat ARR", "per-TB-month"
  median: number;
  p25?: number;
  p75?: number;
  source: string;          // citation discipline
  sampleSize?: number;     // n=N
  patternId?: string;      // PAT-SRC-PRC-*
}

// Contract clause callout
export interface ContractClauseArtifact {
  type: 'contract-clause';
  clauseId: string;
  title: string;
  currentLanguage?: string;     // what the vendor proposed
  recommendedLanguage: string;  // what the buyer should ask for
  leverage: string;             // why the buyer can push
  patternId?: string;           // PAT-SRC-CON-*
}

// BAFO scoreboard
export interface BafoScoreboardArtifact {
  type: 'bafo-scoreboard';
  vendors: Array<{ vendorId: string; name: string }>;
  dimensions: Array<{ label: string; weight: number }>;
  scoresMatrix: number[][];     // [vendor][dimension]
  notes?: string;
}

// Walkaway credibility signal
export interface WalkawaySignalArtifact {
  type: 'walkaway-signal';
  credibility: 'strong' | 'soft' | 'theatre';
  reasoning: string;
  recommendation: string;
}

// Stage progress (parallel to phase-progress)
export interface SourcingStageProgressArtifact {
  type: 'sourcing-stage-progress';
  evidenceItemId: string;
  label: string;
  severity: 'hard' | 'soft';
  status: 'met' | 'unmet' | 'unknown';
  detail?: string;
}

// Stage advance signal (parallel to program-phase-changed) — for
// in-place advance via router.refresh()
export interface SourcingStageChangedArtifact {
  type: 'sourcing-stage-changed';
  eventId: string;
  fromStage: number;
  toStage: number;
  snapshotId?: string;
}
```

Renderers go in a new `SourcingReactivePanel` component (parallel to `NexusReactivePanel` and `SentinelReactivePanel`). Same dedupe-by-stable-id pattern PR-B introduced. Same empty-state pattern with **Sentinel-specific copy** (the Intelligence session set the bar — match it; don't generic-copy from Nexus).

---

## §7 · Hard rules (the non-negotiable parts)

1. **Reuse `AgentCanvas`.** Don't author a new canvas primitive. If you find yourself wanting to, that's a bug — the existing primitive should accommodate any agent surface.
2. **No corpus authoring.** This session does not author `PAT-SRC-*` patterns. The 152+ Codex shipped (and continues to author) are the doctrine layer. If a stage pack needs a pattern that doesn't exist, flag in the PR body — Codex authors, not you.
3. **No direct EnterpriseDataRoom / vector / graph imports** from `src/app/**` or `src/lib/agent/**`. Go through `SourcingBrokerAdapter`. (Same boundary as everything else.)
4. **Stage Packs are static doctrine.** Same rule as Phase Packs — TypeScript files, no DB coupling, `evaluationHint` references tables/columns as descriptive text only.
5. **Read-only.** No write-back paths. Sourcing-event mutations (vendor selection, contract sign-off) come through existing `src/lib/source/` mutation modules; you wire the agent tool to them, you don't replace them.
6. **Match Intelligence session's empty-state quality.** Their empty-state has Sentinel-specific copy ("Try 'Show me patterns like CDP activation'..."). Generic placeholder text is a smell — author Sentinel/Sourcer-specific copy that names the actual operations on this surface.
7. **Same surface canonicalization rules.** Extend `canonicalizeSurface()` in `src/lib/agent/surface.ts` — don't bypass it.
8. **Same handoff marker pattern (PR-K).** When Programs spawns a Sourcing event, use `__handoff__` agentName. When Sourcing event closes back to a Program, use the same marker shape.

---

## §8 · Open decisions (flag in PR body — do not decide unilaterally)

1. **Sentinel vs "Sourcer" persona.** Sentinel is the librarian (citation-first, contradiction-aware). Sourcing motion-running has different operator moves (BAFO orchestration, walkaway signaling, sequence design). My recommendation: **start with Sentinel** for PR-SRC-A through E. If voice testing on PR-SRC-H reveals the librarian register doesn't match active deal motion, propose a "Sourcer" persona in a separate PR. Don't introduce two agents in this scope.
2. **Stage 0 vs Stage 1 boundary.** "Intake" can be its own stage or folded into the start of "Market shape." My recommendation: keep S0 separate so the kill-criterion / scope-boundary work has its own gate. But it's the most flexible boundary — flag if your authoring suggests merging.
3. **Programs ↔ Sourcing back-link.** Should `link_to_program` be a separate tool or a parameter on `compare_vendors`? Recommendation: separate tool — keeps each tool single-purpose.
4. **Existing `src/lib/source/bafo-negotiation*` modules.** There's a real BAFO model already in the codebase. PR-SRC-E's `run_bafo_check` should wrap that, not replace. Read those modules first; flag if the existing model is incompatible with the stage-pack rubric.
5. **Sourcing events tied to multiple Programs.** Today's data model may or may not allow it. Don't widen scope to support it; flag if the founder needs to make a call.

---

## §9 · Verification (per PR)

```bash
npx tsc --noEmit
npx eslint src/components/source/ src/lib/agent/ src/lib/source/  # whichever directories you touch
npx jest src/lib/agent src/lib/source src/components/source --silent
```

For PR-SRC-H production walk via Chrome MCP:
1. Sign in as admin (OTP `424242` → `anand+clerk_test@abarva.com` per `demo_accounts.md`)
2. Visit `/source` — verify chat dominant, FilterPillStrip middle, accordion below
3. Visit `/source/events/apex-retail-ams-outsourcing-2026` — verify Stage Navigator + AgentCanvas + collapsed legacy
4. Test each tool with a real prompt:
   - "Compare AWS vs Azure for our cloud migration" → `compare_vendors` fires → vendor-card + bafo-scoreboard render
   - "Run BAFO check" → `run_bafo_check` fires → walkaway-signal renders
   - "Advance to Contract stage" → `advance_sourcing_stage` runs gate → returns blocked or success → `router.refresh()` fires
5. From `/programs/apx-cdp-2026`, test "spawn a sourcing event for the data quality vendor" → `spawn_sourcing_event` fires → navigation to `/source/events/<new-id>` with handoff marker
6. Verify NO direct vector/graph imports under `src/app/**` or `src/lib/agent/**` (grep for the import paths)

---

## §10 · Founder review focus

1. **Boundary respected end-to-end.** Any direct EnterpriseDataRoom / vector / graph import from app-tier is a rejection.
2. **Tools genuinely call the broker.** Mocked broker calls in handler code are a smell.
3. **Reactive panel actually populates.** If a tool fires but no artifact lands in the right pane, the channel is broken — same bug class as PR-G (surface mismatch) and PR-L (missing dispatch).
4. **Sentinel voice on Sourcing matches Sentinel voice on Intelligence.** Citation-first, contradiction-aware. Don't drift into Nexus's coaching tone.
5. **Each PR is genuinely small.** PR-SRC-A is the schema + 1 reference pack (small). PR-SRC-B is layout reshape (mid). PR-SRC-D is artifact types + renderers (mid). Bloat is a smell.
6. **Empty-state copy is operator-specific.** Sentinel-on-Sourcing prompts: "Compare these vendors", "Run BAFO check", "What's the walkaway?" — not generic. Match Intelligence session's bar.
7. **No corpus drift.** Any new `PAT-SRC-*` pattern in this session is a rejection — that's Codex's lane.

---

## §11 · Design consistency checklist (mandatory · the user explicitly asked for this)

- [x] Reuse `AgentCanvas` — chat-dominant 60/35 layout · same primitive across `/home`, `/programs`, `/programs/<id>`, `/intelligence`, and now `/source`, `/source/events/<id>`
- [x] Same surface canonicalization (extend `canonicalizeSurface` for `'source-detail'` → `/source/events/<id>`)
- [x] Same artifact channel grammar (`[[artifact:<type>]]<JSON>[[/artifact]]`)
- [x] Same `__handoff__` marker for cross-surface continuity (PR-K pattern)
- [x] Same broker boundary (no direct vector/graph imports)
- [x] Same color palette / typography / accordion pattern (SHELL tokens; Georgia serif; DM Sans; #F8F7F4 paper bg — locked per founder design system)
- [x] Same in-place advance via `router.refresh()` after `advance_sourcing_stage` (PR-L pattern)
- [x] Same empty-state quality bar — Sentinel-specific copy on Sourcing surfaces (Intelligence session set the bar)
- [x] Same stage-pack TypeScript shape as phase-pack — same renderer works for both
- [x] Same dedupe-by-stable-id pattern in reactive panel
- [x] Same Brand Voice Spec rules (state don't sell, specific over abstract, no marketing adjectives, citations precede claims, hedge unsourced)

If you find yourself diverging on any of these, that's a smell. Either there's a justification (in which case raise it in the PR body and let the founder decide), or there isn't (in which case, don't diverge).

---

## §12 · What this unblocks

After this bundle ships:
- **End-to-end IT lifecycle on AbarVa** — Atlas → Programs → Sourcing → Sourcing-event → back to Programs. One canvas, one continuous conversation, one agent stack.
- **Public Sourcing surface** — `/source` becomes the surface that demos most viscerally to a CIO buyer. The corpus depth (Codex's 152+ patterns) becomes visible in the right pane as cards.
- **Wave 4 cross-program portfolio reasoning** — Atlas can now reason about sourcing-vs-build decisions across the portfolio because the `/source` events are in the same data layer.
- **Public site Sourcing pages** — `abarva.ai/categories/<slug>` and `abarva.ai/vendors/<slug>` (the v1/v2 corpus kickoff §9 downstream) become genuinely populated since the corpus is bound into a working surface.

This is the first surface that shows AbarVa replacing a procurement specialist's full motion, not just augmenting it.
