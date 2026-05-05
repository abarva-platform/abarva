# Knowledge Gap Backlog
**Audit date:** 2026-05-05  
**Branch:** `claude/laughing-kare-a04314`  
**Severity scale:** P0 = blocks agent correctness now · P1 = degrades answer quality or coverage · P2 = design debt, no immediate breakage

---

## Summary

| Severity | Count |
|----------|-------|
| P0 | 4 |
| P1 | 7 |
| P2 | 5 |
| **Total** | **16** |

---

## P0 — Blocks Agent Correctness Now

### GAP-P0-1 · Two unreconciled failure-mode catalogs

**What:** Two parallel failure-mode catalogs exist and are never merged at runtime.

- **Programs module catalog** (`src/lib/programs/failure-modes.ts`): 10 failure modes, integer IDs 1–10, structured with `primaryPhases[]`, `researchAnchors`, `preventionMechanism`. Referenced by phase packs, gate evaluators, and `failure-mode-prompt.ts`.
- **Intelligence module catalog** (`src/lib/intelligence/ai-program-failure-modes.ts`): 12 failure modes, string keys (`weak_data_foundation`, `pilot_purgatory`, etc.), structured with `phaseWhereDetected[]`, `gateImplication`, `primaryAgent`. Referenced by intelligence surfaces and the Sentinel agent.

**Conflict:** The two catalogs use different phase vocabulary. Programs catalog uses `primaryPhases: [0..5]` aligned to the 6-phase doctrine. Intelligence catalog uses phase names (`origination`, `charter`, `diagnose`, `design`, `execute`, `verify`) — `execute` and `verify` have no equivalent in the 6-phase Strategic Moves model. The catalogs also cover different failure modes: `pilot_purgatory` and `ai_tool_sprawl_without_value` exist only in the intelligence catalog.

**Agent impact:** Nexus on the Programs surface loads the programs catalog; Sentinel loads the intelligence catalog. They cannot correlate failures across surfaces without a shared ID space. Cross-surface escalation (Sentinel flags FM → Nexus acts on program) is broken by design.

**Affected files:**
- `src/lib/programs/failure-modes.ts:1–end`
- `src/lib/intelligence/ai-program-failure-modes.ts:1–end`
- `src/lib/programs/failure-mode-prompt.ts` (assembles programs catalog only)
- `src/lib/intelligence/detection-rules.ts` (references intelligence catalog only)

**Resolution:** See GAP-IMPL-1 in Implementation Plan.

---

### GAP-P0-2 · Source stage packs (S0–S8) unaligned with 6-phase model

**What:** The Source module's `source-lifecycle-patterns.ts` defines stage-based lifecycle patterns (Plan, RFI, Shortlist, RFP, Q&A, Initial-Bid, BAFO, Selection, Award, Onboard — 10 stages for AMS; similar for other patterns). These stage labels do not map to P0–P5. No binding table or bridge exists.

**Agent impact:** When a program spans a Strategic Move (P2 Discovery involves an RFP event), Nexus has no way to reference the Source lifecycle pattern for the same sourcing event. The two surfaces operate in silos. Context bundles from `programs-broker-adapter.ts` do not include Source event context.

**Affected files:**
- `src/lib/intelligence/source-lifecycle-patterns.ts` (AMS stages: Plan→Onboard)
- `src/lib/programs/programs-broker-adapter.ts` (no `source` domain in default request)
- `src/lib/knowledge/agent-context-broker.ts` (domain routing logic)

**Resolution:** See GAP-IMPL-2 in Implementation Plan.

---

### GAP-P0-3 · Missing archetype primers for 4 of ~10 live archetypes

**What:** The archetype primer registry (`src/lib/programs/archetype-primers/index.ts`) has 6 primers:
CDP, CC-AI, Demand Forecasting, M365 Copilot, AI Coding, Loyalty AI.

The demo seed and live Apex Retail programs include archetypes with no primer:
- PLATFORM MODERNIZATION (RETAIL-UNIFIED-2026 — Unified Customer Data Platform)
- SUPPLY CHAIN AI (RETAIL-SUPPLY-2026)
- PRICING AI (RETAIL-9-2026 — Digital Personalization Strategy)
- STORE OPERATIONS AI (RETAIL-9-2026 — Store Associate Productivity)

**Agent impact:** When Nexus encounters a program whose `archetype` does not match any primer key, `getArchetypePrimer()` returns `null`. Nexus falls back to generic coaching with no phase-specific SME guidance, data-asset checklist, workshop playbook, or template references. The P0 classification step cannot resolve, and the P1 charter template cannot be populated.

**Affected files:**
- `src/lib/programs/archetype-primers/index.ts:18–24` (PRIMERS array, 6 entries)
- `src/lib/programs/archetype-primers/types.ts` (ArchetypePrimer interface)
- Demo seed: `scripts/seed/` programs with archetypes PLATFORM MODERNIZATION, SUPPLY CHAIN, PRICING AI, STORE OPS

**Resolution:** See GAP-IMPL-3 in Implementation Plan.

---

### GAP-P0-4 · Nexus thread mode C (CXO takeover) stubbed — no actual model call

**What:** `src/lib/programs/nexus.ts` defines three operating modes:
- Mode A: Side-panel Q&A
- Mode B: Module drafting
- Mode C: CXO takeover (structured Q→A, writes to phase findings)

Comment in `nexus.ts` (line ~9): *"composer calls are stubbed with a clear attachment point."* The file creates thread lifecycle and context assembly but does not wire up an actual Claude API call. No composer invocation exists for mode B or C.

**Agent impact:** The entire programmatic agent interaction loop (Nexus writes drafts, Nexus captures phase findings) is currently a UI shell with no model execution. Mode A may function via the `/api/chat/agent` route separately, but modes B and C are not connected.

**Affected files:**
- `src/lib/programs/nexus.ts` (entire file — thread lifecycle exists, no model call)
- `src/lib/nexus/` (composer layer — relationship to programs/nexus.ts unclear)
- `/api/chat/agent` route (may handle some mode A traffic separately)

**Resolution:** See GAP-IMPL-4 in Implementation Plan.

---

## P1 — Degrades Answer Quality or Coverage

### GAP-P1-1 · Phase pack `steps[]` field unpopulated for P3, P4

**What:** The `PhasePack` type (`src/lib/programs/phase-packs/types.ts:162`) has an optional `steps?: PhaseStep[]` field added in OV2-5-types. Steps are authored for P0, P1, P2, P5 (verified in phase pack files). P3 and P4 do not have `steps` arrays.

**Impact:** Step decomposition is unavailable for P3 (Design Future State) and P4 (Roadmap & Business Case) — these are the highest-complexity phases with the most off-platform work. Without steps, Nexus cannot present the structured intent-capture → off-platform → upload loop for P3 design workshops and P4 business-case reviews.

**Affected files:**
- `src/lib/programs/phase-packs/P3_design.ts` (no `steps` field)
- `src/lib/programs/phase-packs/P4_build.ts` (no `steps` field)

---

### GAP-P1-2 · `getFailureModesForPhase()` returns programs catalog only; no intelligence catalog cross-walk

**What:** `src/lib/programs/failure-modes.ts` exports `getFailureModesForPhase(phase: number)` which filters `FAILURE_MODES` by `primaryPhases`. This function is used in `failure-mode-prompt.ts` to assemble Nexus's per-phase doctrine block. It does not pull from `ai-program-failure-modes.ts`.

**Impact:** Nexus is unaware of `pilot_purgatory` (a critical late-phase failure mode) and `ai_tool_sprawl_without_value` when coaching P4/P5. These modes are exclusive to the intelligence catalog.

**Affected files:**
- `src/lib/programs/failure-modes.ts:~180` (`getFailureModesForPhase`)
- `src/lib/programs/failure-mode-prompt.ts` (calls `getFailureModesForPhase`)

---

### GAP-P1-3 · Context broker does not include phase pack in Programs context bundle

**What:** `programs-broker-adapter.ts` calls `buildEnterpriseAgentContextBundle()` with domains including `people`, `programs`, and optionally `worldview`. The active phase's `PhasePack` (questions, anti-patterns, coaching arc, evidence items) is not included in the broker bundle.

**Impact:** Nexus receives tenant context (who is who) and program context (what phase, what status) but not the phase pack doctrine (what questions to ask, what anti-patterns to detect). Phase pack content is assembled separately in `failure-mode-prompt.ts` and injected as a separate system-prompt block. This split means broker context and phase pack context can fall out of sync.

**Affected files:**
- `src/lib/programs/programs-broker-adapter.ts:1–end`
- `src/lib/knowledge/agent-context-broker.ts` (domain routing)

---

### GAP-P1-4 · Pattern manifest (`generated/pattern-manifest.json`) not validated against active primer set

**What:** `src/lib/intelligence/generated/pattern-manifest.json` exists (file present, content not read in this audit) but there is no CI check or test that validates the manifest keys match the primer keys in `archetype-primers/index.ts`. Manifest can drift from registered primers silently.

**Affected files:**
- `src/lib/intelligence/generated/pattern-manifest.json`
- `src/lib/programs/archetype-primers/index.ts`
- No validation test found.

---

### GAP-P1-5 · `improvement_areas` and `industry_context` in context broker are fixture-only; Apex tenant data not bridged

**What:** The `agent-context-broker.ts` builds context bundles from `EnterpriseDataRoom` (fixture) and `enterprise-data-room-persistence.ts` (Supabase). Apex tenant data was loaded directly into Supabase 2026-04-30 (14 segments / 403 records / 257 nodes / 275 edges per MEMORY). However the integration adapter mapping Apex broker keys to Supabase tenant rows is not yet authored (confirmed in memory: "integration adapter not yet authored").

**Impact:** Apex programs receive fixture context, not their actual 403-record tenant corpus. The $388M at-stake portfolio is being coached on generic fixture data.

**Affected files:**
- `src/lib/knowledge/enterprise-data-room-persistence.ts`
- `src/lib/knowledge/private-data-plane/registry.ts`
- Apex integration adapter: **does not exist yet**

---

### GAP-P1-6 · `programs-control-tower-signals.ts` has no live Tower data connection

**What:** `src/lib/programs/programs-control-tower-signals.ts` exists but its connection to live Tower monitoring data is unverified in this audit. P5 gate logic requires Tower metric plan confirmation, but if Tower signals are fixture-only, the P5 handoff verification cannot be automated.

**Affected files:**
- `src/lib/programs/programs-control-tower-signals.ts`
- `src/lib/tower/` (not audited in depth)

---

### GAP-P1-7 · Workshop template library not bound to phase packs

**What:** `src/lib/programs/workshop-template-library.ts` exists as a standalone library. Phase packs reference workshop types in their `steps[]` arrays (e.g., `coach_workshop` role). No binding exists between a phase pack step's `templateRefs[]` and the actual template objects in `workshop-template-library.ts`.

**Impact:** Nexus cannot auto-populate a workshop prep guide from a phase step — a facilitator must manually locate the right template.

**Affected files:**
- `src/lib/programs/workshop-template-library.ts`
- `src/lib/programs/phase-packs/types.ts:73` (`templateRefs: string[]` field exists but is string-only)

---

## P2 — Design Debt

### GAP-P2-1 · `types.ts` split deferred (programs types coexistence)

**What:** `src/lib/programs/types.ts` coexists with `types.db.ts` and `types.ui.ts` — the split is incomplete. UI view-models and DB types are intermixed in `types.ts`, creating import confusion. The plan to fully separate is captured in memory but deferred post-Prat demo.

**Affected files:** `src/lib/programs/types.ts`, `types.db.ts`, `types.ui.ts`

---

### GAP-P2-2 · `lifecycle-operating-system/` parallel implementation

**What:** `src/lib/lifecycle-operating-system/` contains a `builders.ts` and test that appear to duplicate phase-lifecycle logic. Relationship to `phase-packs/` is undefined — whether this is a predecessor, parallel design, or superseded approach is not documented.

**Affected files:** `src/lib/lifecycle-operating-system/builders.ts`

---

### GAP-P2-3 · No telemetry binding from failure mode detections to `failure_mode_telemetry` table

**What:** `src/lib/programs/failure-mode-telemetry.ts` exists and presumably defines a telemetry schema. The anti-pattern detection hints in phase packs (e.g., `detectionHint` in `PhaseAntiPattern`) are defined but there is no runtime path that fires a telemetry event when an anti-pattern is detected in chat.

**Affected files:**
- `src/lib/programs/failure-mode-telemetry.ts`
- Phase pack `antiPatterns[].detectionHint` fields (not wired to runtime signal)

---

### GAP-P2-4 · Source stage vocabulary (Plan, RFI, BAFO…) not mapped to `LifecycleStage` IDs used by broker

**What:** The source lifecycle stages in `source-lifecycle-patterns.ts` use string IDs (`'Plan'`, `'RFI'`, `'BAFO'`) that differ from the numeric Phase IDs used in the Programs module. There is no mapping table, no shared `LifecycleStage` type, and no broker domain that bridges source events to program phases.

---

### GAP-P2-5 · No per-phase pattern bundle validation test

**What:** There is no test that asserts: for each registered `ArchetypePrimer`, all expected phase-specific guidance fields are non-null for phases where the primer is active. Primers can be authored with empty phase sections and tests would not catch it.

**Affected files:** `src/lib/programs/archetype-primers/__tests__/` (existing tests validate specific fields but not cross-phase coverage)
