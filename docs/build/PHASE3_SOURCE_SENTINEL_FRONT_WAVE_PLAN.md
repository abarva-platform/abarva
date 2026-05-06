# Phase 3 · Source Sentinel-front refactor · Wave plan

| | |
|---|---|
| **Doc ID** | `PHASE3_SOURCE_SENTINEL_FRONT_WAVE_PLAN_2026-05-06` |
| **Status** | Ready to dispatch as a dedicated session |
| **Scope** | Replace Source's parallel-all `SourceMultiAgentBriefing` with a Sentinel-orchestrator routing to specialists |
| **Estimated effort** | 1–2 weeks (40–80 hours) of focused work |
| **Prerequisites** | Phase 1a (`SOURCE_LEAD_AGENT='Sentinel'`) ✓ · Phase 4 (voice doctrines) ✓ · Specialist catalog scaffold ✓ |
| **Successor** | Phase 5 per-user RLS (independent track) |
| **Reference audit** | [docs/build/audit-out/SOURCE_AUDIT_M4_AGENTS.md](docs/build/audit-out/SOURCE_AUDIT_M4_AGENTS.md) F-M4-101 |

---

## 1 · The problem this wave solves

The Source code currently runs all four agents (Nexus, Sentinel, Atlas, Steward) on every stage in parallel via `SourceMultiAgentBriefing`. The user-visible result is a four-perspective briefing every turn — voice fragmentation rather than depth.

Under the refined architecture (front-agent-per-product · specialists hidden), Source's chat front is **Sentinel**. The other three agents' Source-side responsibilities (Nexus's orchestration, Atlas's executive briefs, Steward's gate enforcement) become **specialists** that Sentinel routes to internally. Output is presented through one voice; the user never sees the routing.

Existing code — particularly the four `build*SourceMissions()` generators in [src/lib/source/agent-missions.ts](src/lib/source/agent-missions.ts) — survives with no rewrite. They become specialists; only the orchestrator and output layer change.

---

## 2 · Scope

### In scope

- Replace `buildSourceMultiAgentBriefing()` with a Sentinel-orchestrator that calls specialists, ranks their output, and emits a single Sentinel-voice briefing
- Add a `SentinelSourceBriefing` output type alongside the existing `SourceMultiAgentBriefing` (the latter retained as an internal intermediate)
- Migrate all consumers of `SourceMultiAgentBriefing` to `SentinelSourceBriefing`
- Wire the new specialists into the published catalog (entries already exist as code; just add formal routing references)
- Update tests to assert single-voice output rather than four-voice
- Run M3 Chrome verification on the deployed AMS-Out 2026 event flow at 3 stages (Strategy, Pricing Normalization, BAFO) to confirm voice coherence

### Out of scope

- Substrate changes (atlas_threads → agent_threads is Phase 2; already shipped as additive)
- Per-user RLS (Phase 5; independent track)
- Voice doctrine for the other three agents (Phase 4; already shipped — the doctrines exist; this wave just consumes them when those specialists run)
- Setup, Moves, Tower, Intelligence refactors (those products already comply per the cross-product audit)
- New specialists beyond what already exists in code (those are future waves)

### Explicit non-goals

- Do not rename the existing `build*SourceMissions()` functions; they become the specialist implementations behind Sentinel. Renaming creates merge conflict surface for parallel work.
- Do not delete `SourceMultiAgentBriefing` type. It becomes an internal aggregation step the orchestrator runs.
- Do not change the substrate `source_context_receipts` shape; provenance tracking continues unchanged.

---

## 3 · Prerequisites — confirm before starting

Run this checklist as a pre-fly. Stop if any item is `NO`.

| Check | How to verify | Expected |
|---|---|---|
| Phase 1a complete | `grep "SOURCE_LEAD_AGENT" src/lib/source/constants.ts` | Returns `'Sentinel'` |
| `leadAgent` types updated | `grep "leadAgent: 'Nexus'" src/` | No matches |
| Phase 4 doctrines exist | `ls src/lib/agent/voice-doctrine/{nexus,atlas,steward,sentinel}.ts` | All four files present |
| Sentinel doctrine wired | `grep "isSentinelVoiceDoctrineEnabled" src/app/api/chat/agent/route.ts` | Found |
| Specialist catalog has Source entries | `head -50 docs/architecture/specialist-catalog.md` | §3 Source specialists section present |
| TypeScript clean baseline | `npx tsc --noEmit -p .` | Empty output (no errors) |
| Pre-existing test baseline | Run `npm test -- --testPathPatterns="source/__tests__" --silent` and record pass count | Note baseline; do not introduce regressions |
| Worktree clean | `git status` | No uncommitted changes from prior wave |

---

## 4 · The refactor model

### Today (parallel-all)

```
User → /api/chat/agent route
       ↓
       buildSourceMultiAgentBriefing(input)
       ↓
       [buildNexusSourceMissions, buildSentinelSourceMissions,
        buildAtlasSourceMissions, buildStewardSourceMissions]
       (all four run in parallel)
       ↓
       SourceMultiAgentBriefing { nexus, sentinel, atlas, steward, ... }
       ↓
       UI renders four sections (or one of them — depends on consumer)
```

### Target (Sentinel-front + specialists)

```
User → /api/chat/agent route
       ↓
       buildSentinelSourceBriefing(input)
       ↓
       SentinelOrchestrator:
         1. Run all specialist-equivalent generators (existing build*SourceMissions)
         2. Rank their output by stage relevance + priority
         3. Compose unified Sentinel-voice presentation
         4. Apply Sentinel voice doctrine (existing 17 banned patterns)
         5. Emit specialist-attribution metadata for trace drill-down
       ↓
       SentinelSourceBriefing {
         primaryVoice: SentinelBriefing,        // single Sentinel voice block
         specialistContributions: SpecialistContribution[],   // hidden by default; visible in trace
         contextScope, generatedAt, blockers, defers, recommendedNextSlice
       }
       ↓
       UI renders single Sentinel-voice block (specialists in trace drawer)
```

### Specialists that run behind Sentinel (catalog mapping)

| Existing code | Becomes specialist | Notes |
|---|---|---|
| `buildNexusSourceMissions` next_action | `next-action-recommender` | Orchestration concern |
| `buildNexusSourceMissions` data_readiness | `minimum-data-request-generator` | Data gap surfacing |
| `buildNexusSourceMissions` pattern_signal | `pattern-signal-detector` | Pattern matching |
| `buildSentinelSourceMissions` validation_defer | `context-validation-checker` | Native Sentinel concern |
| `buildSentinelSourceMissions` evidence_gap | `evidence-gap-detector` | Native Sentinel concern |
| `buildSentinelSourceMissions` low_context_warning | `low-context-warner` | Native Sentinel concern |
| `buildAtlasSourceMissions` value_risk | `value-at-stake-summarizer` | Atlas-flavored, routed through Sentinel |
| `buildAtlasSourceMissions` executive_brief | `executive-decision-brief-writer` | Atlas-flavored, routed through Sentinel |
| `buildStewardSourceMissions` workflow_blocker | `workflow-blocker-detector` | Steward-flavored, routed through Sentinel |
| `buildStewardSourceMissions` validation_defer | (deduplicated with Sentinel's defer) | Merge concern |

The specialists' agent-flavored output is the underlying *capability*; Sentinel is the front-of-house presenter. The user sees one voice; trace shows which specialists contributed.

---

## 5 · Phased steps · file-level

### Step 1 · Type scaffolding (1-2 hours)

Add new types in [src/lib/source/multi-agent-types.ts](src/lib/source/multi-agent-types.ts):

```ts
export interface SpecialistContribution {
  specialistId: string;        // catalog id, e.g., 'pricing-normalizer'
  specialistFlavor: SourceAgentName;   // for trace badging only
  missionType: string;          // existing mission type tag
  contribution: SourceAgentMission;
}

export interface SentinelSourceBriefing {
  eventId?: string;
  contextScope: SourceAgentContextScope;
  generatedAt: string;
  primaryVoice: SourceAgentBriefing;          // single Sentinel-voiced briefing
  specialistContributions: SpecialistContribution[];   // for trace drawer
  combinedSummary: string;
  highestPriorityAction: string;
  overallReadiness: SourceMultiAgentOverallReadiness;
  blockers: string[];
  defers: string[];
  recommendedNextSlice: string;
}
```

**Diff target:** `src/lib/source/multi-agent-types.ts` — add ~25 lines, no removals.

### Step 2 · Sentinel orchestrator (4-6 hours)

Create [src/lib/source/sentinel-source-orchestrator.ts](src/lib/source/sentinel-source-orchestrator.ts):

Responsibilities:
1. Build the existing four agent briefings (call `buildSourceMultiAgentBriefing` internally — preserves logic)
2. Convert each agent's missions into `SpecialistContribution` records
3. Rank specialists by stage relevance + mission priority
4. Compose `primaryVoice` — a single `SourceAgentBriefing` with `agentName: 'sentinel'` whose `summary` and `primaryFinding` synthesize the top-ranked specialists
5. Apply Sentinel voice doctrine (`composeSentinelSystemPrompt` informs framing; `checkSentinelVoice` validates output)
6. Emit `SentinelSourceBriefing`

Public API:

```ts
export function buildSentinelSourceBriefing(
  input: SourceAgentBriefingInput,
): SentinelSourceBriefing;
```

**Diff target:** new file ~250-300 lines.

### Step 3 · Migrate consumers (4-6 hours)

Find all consumers of `SourceMultiAgentBriefing`:

```bash
grep -rn "SourceMultiAgentBriefing\|buildSourceMultiAgentBriefing" src/ \
  | grep -v "__tests__\|.test."
```

Expected ~8-12 consumers. For each:
1. If consumer reads `briefing.sentinel.primaryFinding` → migrate to `briefing.primaryVoice.primaryFinding`
2. If consumer reads `briefing.nexus.suggestedActions` → migrate to filtered `briefing.specialistContributions` where `specialistFlavor === 'nexus'`
3. If consumer iterates all four agents → migrate to single `primaryVoice` + (optional) trace drawer for `specialistContributions`

Adapter pattern for consumers that are too risky to migrate directly:

```ts
// Adapter — temporary; remove after all consumers migrated
export function adaptSentinelBriefingToMultiAgent(
  brief: SentinelSourceBriefing,
): SourceMultiAgentBriefing {
  // Reconstructs the SourceMultiAgentBriefing shape from specialist contributions.
  // Lossy but back-compat; consumers using this should migrate within the wave.
}
```

**Diff target:** ~8-12 files modified, mostly in `src/components/source/**` and `src/app/api/v1/source/**`.

### Step 4 · UI changes (3-4 hours)

Two patterns to update:

1. **Single-voice display** — components that show all four agent briefings collapse to showing `primaryVoice` only. Specialist contributions move to a "Show what produced this answer" trace drawer.

2. **Trace drawer** — new component `SourceSpecialistTraceDrawer.tsx`:
   - Lists each `SpecialistContribution` with specialist id, flavor badge, contribution summary
   - Shows the catalog entry link for each specialist (`docs/architecture/specialist-catalog.md` deep-link)
   - Rendered behind a "What produced this answer?" affordance — never default-visible

Components to touch (most-likely):
- `SourceMultiAgentMissionsPanel.tsx` (if exists)
- `PersistentNexusPanel.tsx` (now renders Sentinel)
- `NexusEngagementCanvas.tsx` (now SentinelEngagementCanvas? — decide)
- `AgentColumn.tsx` (already supports single-agent mode)

**Diff target:** ~6-10 component files modified, 1-2 new components.

### Step 5 · Test migration (3-5 hours)

Tests to update:

1. **Unit tests** — `src/lib/source/__tests__/multi-agent-briefing.test.ts` (and adjacent) gain new test file `sentinel-source-orchestrator.test.ts`:
   - All four agents' content still surfaces (specialist contributions)
   - Single primaryVoice is Sentinel
   - Voice doctrine validation passes
   - Ranking logic deterministic

2. **Integration tests** — Source surface integration tests assert single-voice rendering:
   - `src/__tests__/integration/source/source-*.test.ts`

3. **Existing tests preserve** — Don't delete `multi-agent-briefing.test.ts`. The internal aggregation still happens; only the consumer surface changes.

**Diff target:** ~2-3 new test files, ~5-8 modified test files.

### Step 6 · Voice doctrine integration (1-2 hours)

The Sentinel voice doctrine (Phase 4 ✓ shipped) needs to apply to the Sentinel orchestrator output. Wire `composeSentinelSystemPrompt` into the orchestrator's voice composition. Run `checkSentinelVoice` on the composed `primaryVoice.summary` and `primaryVoice.primaryFinding`; surface drift via the existing `VoiceDriftViolation` machinery.

**Diff target:** part of Step 2 orchestrator file.

### Step 7 · Specialist catalog wiring (2-3 hours)

For each existing mission generator becoming a specialist, add the catalog reference:

1. In the orchestrator, when emitting `SpecialistContribution`, set `specialistId` to the catalog entry id (e.g., `'next-action-recommender'`)
2. Update [docs/architecture/specialist-catalog.md](docs/architecture/specialist-catalog.md) §3 entries:
   - Move `status` from `partial` to `shipped` for the ones that now route through orchestrator
   - Add `routes_through: sentinel-orchestrator` field to each Source specialist

**Diff target:** specialist-catalog.md edits.

### Step 8 · Migrate /api/chat/agent route (1-2 hours)

The agent route at `src/app/api/chat/agent/route.ts` may call into Source briefings. Find and migrate to the Sentinel orchestrator:

```bash
grep -n "buildSourceMultiAgentBriefing\|SourceMultiAgentBriefing" src/app/api/chat/agent/route.ts
```

If found: replace with `buildSentinelSourceBriefing`.

The Sentinel voice doctrine wiring (already shipped in Phase 4) governs the surface prompt; this step ensures the briefing payload also carries Sentinel-voice presentation.

### Step 9 · Run typecheck + tests (30 min)

```bash
npx tsc --noEmit -p .
npm test -- --testPathPatterns="source"
```

Target: clean typecheck, no new test failures relative to the baseline recorded in §3.

### Step 10 · M3 Chrome verification (4-6 hours)

This is the user-visible verification. Per the audit's M3 runbook:

1. Load Chrome MCP tools
2. Log into `nexus-vert-kappa.vercel.app` as Apex client (`Demo2026!`)
3. Navigate to AMS-Out 2026 event at three stages:
   - Step 2 Scope (early)
   - Step 6 Pricing Normalization (middle)
   - Step 7 BAFO (late)
4. At each stage, capture:
   - Screenshot of the chat lane / agent column
   - DOM text of the agent voice block
5. Verify:
   - Single voice ("Sentinel") not four
   - Voice differs meaningfully across stages (not just stage label injection)
   - Trace drawer (if visible) shows underlying specialists
6. Re-run on `/source/events/[id]/scorecard` and `/source/value` — same single-voice expectation
7. Document findings in `docs/build/audit-out/SOURCE_AUDIT_M3_CHROME.md` (replaces the existing runbook stub)

### Step 11 · Update memory (15 min)

Add a memory entry documenting Phase 3 ship:

```markdown
- [Source Phase 3 ship — Sentinel-front orchestrator](project_source_phase3_ship.md) — 2026-XX-XX; SourceMultiAgentBriefing replaced by SentinelSourceBriefing; specialists hidden in trace drawer; voice coherence verified at 3 stages on Apex AMS-Out 2026
```

---

## 6 · Risk + mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| Voice ranking logic produces inconsistent priorities across stages | Medium | Make ranking deterministic; lock with snapshot tests |
| Consumer migration misses an edge case → runtime null | Medium | Use the adapter shim; migrate incrementally; keep types strict |
| Trace drawer rendering breaks the existing chat layout | Low | Behind affordance; default-hidden; no impact on primary view |
| Apex AMS-Out 2026 demo flow regresses | Medium | M3 Chrome verification at 3 stages catches this; runs at end |
| Voice doctrine drift on the orchestrator's composed primaryVoice | Medium | Run `checkSentinelVoice` in orchestrator; emit drift as build-time failure in CI |
| Tests fragile to specialist ranking changes | Low | Mock the ranker in tests; test orchestrator with deterministic specialist order |
| `SourceMultiAgentBriefing` consumer still expects all four fields | Medium | Adapter pattern; document in PR description; hard-deprecate next wave |
| Voice cap (120 words on `/source`) overflows when synthesizing 4 specialists | Medium | Orchestrator must trim; specialists don't all fit, so ranking matters |

---

## 7 · Acceptance criteria

The wave is done when ALL of the following are true:

1. ✅ `buildSentinelSourceBriefing` exists and is the canonical entry point
2. ✅ All consumers of `SourceMultiAgentBriefing` migrated to `SentinelSourceBriefing` (or use the adapter with documented retirement plan)
3. ✅ TypeScript clean (`npx tsc --noEmit`)
4. ✅ All Source-related tests pass (no new failures vs baseline)
5. ✅ Source UI renders single Sentinel-voice block at every stage; specialists in trace drawer
6. ✅ M3 Chrome verification at 3 AMS-Out 2026 stages confirms voice coherence + meaningful per-stage differentiation
7. ✅ Specialist catalog (§3 Source) updated to reflect `shipped` status + `routes_through` field
8. ✅ Memory entry added documenting the ship
9. ✅ No regressions in cross-product audits — Moves, Tower, Intelligence, Setup unaffected
10. ✅ Voice doctrine drift detector running in CI on orchestrator output

---

## 8 · Dispatcher's note · how to start the next session

When starting the Phase 3 session, do the following in order:

1. **Read this plan first** — top to bottom. ~15 min.
2. **Run the prerequisite checklist (§3)** — confirm every box. Stop if any item fails; resolve before starting.
3. **Establish the test baseline** — `npm test -- --testPathPatterns="source/__tests__" --silent`. Record pass/fail counts. This is the regression gate.
4. **Create a worktree** — `git worktree add` if running in parallel with other work.
5. **Work step-by-step (§5)** — don't batch step 1+2+3. Each step has its own verification (typecheck, test).
6. **Spawn parallel research agents** for narrow lookups (e.g., "find every consumer of `SourceMultiAgentBriefing`") — but synthesis stays in the main session.
7. **Save progress per step** — commit after each step lands. The wave is large; checkpoints reduce risk.
8. **Run M3 Chrome at the end (Step 10)** — not the middle. Earlier Chrome verification gives false signal because the orchestrator isn't done yet.
9. **Update memory only on full ship** — not partial.

The wave is large but well-scoped. The existing voice generators in code already do most of the work; this wave is mostly orchestration and presentation, not new logic.

---

## 9 · Effort breakdown

| Step | Hours |
|---|---|
| 1 · Type scaffolding | 1-2 |
| 2 · Sentinel orchestrator | 4-6 |
| 3 · Migrate consumers | 4-6 |
| 4 · UI changes | 3-4 |
| 5 · Test migration | 3-5 |
| 6 · Voice doctrine integration | 1-2 |
| 7 · Specialist catalog wiring | 2-3 |
| 8 · Agent route migration | 1-2 |
| 9 · Typecheck + tests | 0.5 |
| 10 · M3 Chrome verification | 4-6 |
| 11 · Memory update | 0.25 |
| **Total** | **~25-37 focused hours** |

Calendar: 1 week with one focused session-per-day; 2 weeks with parallel work.

---

## 10 · What this wave does NOT do

- **Doesn't refactor specialists.** The four `build*SourceMissions` functions stay as-is. Their *role* changes (specialists not co-equal agents), not their implementation.
- **Doesn't update the dossier.** Dossier section §6 implementation status update is a separate doc-update wave.
- **Doesn't touch other products.** Moves, Tower, Intelligence, Setup all comply per cross-product audit. They're not in scope.
- **Doesn't ship per-user RLS.** Phase 5 is independent and pilot-blocking on its own track.

---

## 11 · Optional follow-ups · post-Phase 3

These are good ideas that should NOT be bundled into Phase 3 (would expand scope):

- Specialist registry as substrate (catalog → DB-backed for runtime routing)
- Cross-product specialist sharing (e.g., Moves' `pattern-match-classifier` consumed in Source)
- Voice cross-product audit (does Nexus voice in Source feel consistent with Nexus voice in Moves?)
- Per-persona voice variation (CFO sees different Atlas-flavored output than CISO)
- Specialist quality metrics (which specialists' contributions are most user-clicked?)

Each is its own wave. Ship Phase 3 first.

---

End of wave plan.
