# Claude Design brief — Moves phase workspace, in the Source look, with a data-intelligence layer + Recharts

## Required reading (companion docs, same folder)
Read these first — they define the model this design must render:
- `MOVES_SOLUTION_BUILDING_BLOCKS.md` — the 10 blocks + playbooks (a Move = a *bundle*, not a label).
- `MOVES_BUILDING_BLOCK_SPINE.md` — **blocks are phase *lanes*** that run P2→P3→P4→P5→Tower; a phase never starts blank.
- `MOVES_DYNAMIC_PATTERN_ASSEMBLY.md` — AbarVa builds the packet + validates; Claude assembles the pattern (governs the "what we found / recommended / not-yet" tone).
- `MOVES_ANALYTICS_LAYER_SPEC.md` — the engine + the `MoveFinding` contract.

## Context (read first)

You redesigned **Source** into a stage-gated event workspace (standalone HTML we have): stage-head + lede, **Input templates / Generated deliverables** split, per-stage **findings surfaced inline** ("✦ What Source read," anomalies→"Clarifications to vendors," "The scorecard — live," "Recommendation"), **gate-as-human-attestations** ("Findings reviewed," "Scorecard agreed"), an honesty model ("the gate can't arm until two inputs land… no recommendation until they're in"), progress bars, and a contextual Ava. That is the target pattern.

**Moves** is the same archetype as Source — a governed journey — but its phases are **P0 Originate → P1 Charter → P2 Discover & Diagnose → P3 Solution Design → P4 Plan/Business Case → P5 Operate → Tower handoff**. Today Moves' intelligence is **trapped inside generated deliverables** (Word/HTML). This redesign brings Moves to the Source look/feel AND surfaces the intelligence on the page for collaboration/feedback.

## Deliverable

Standalone HTML mockup(s) in the **same self-contained format and visual language as the Source redesign** (match that palette/type — Fraunces + Inter + JetBrains Mono, cream surfaces, muted lines, the same button/gate/progress vocabulary). Produce **three phase pages** (one shared shell, three phase configs) — these carry the richest intelligence and are the top demo-priority screens:
1. **P2 Discover & Diagnose** — current-state findings + evidence contract.
2. **P3 Solution Design** — the **Building-Blocks Canvas** (the solution-lanes screen; see §5).
3. **P4 Plan / Business Case** — value bridge + workstreams.

The three should visibly **carry the same blocks forward as lanes** (a block that appears in P2 as a finding reappears in P3 as a design lane and in P4 as a workstream) — that continuity is the product story.

## Requirements

### 1. Port the Source stage shell to a Moves phase
- Stage head: agent chip (aVa · Moves) + phase name + one-line **lede/purpose**.
- **Input templates** (human-provided) vs **Generated deliverables** (AI-produced, never user-filled) split.
- **Gate = human attestations** on the phase's findings, plus the honesty model (gate stays closed and says what's missing rather than guessing).
- Progress bar; contextual Ava.

### 2. Surface the intelligence inline — "What we found this phase"
Each phase renders its findings as **discrete, reviewable cards** (not a wall of prose), each with: statement · evidence chip · confidence · a review affordance (accept / challenge / comment). This is the un-trapped intelligence. Advancing the phase = attesting to these findings.

### 3. Advanced visuals with **Recharts** (`recharts@3.8.1` is a project dependency)
Use Recharts (or, in the standalone mockup, faithful SVG that matches Recharts output and is trivially swappable for real Recharts). Per phase:

**P2 Discover:**
- **Cycle-time distribution** (histogram/box) — e.g. avg 31.6d, P75 43d, P90 52d tail.
- **Root-cause Pareto** — incomplete intake (81.5% missing-field), inconsistent triage, missing obligation ownership, manual cross-system handoffs. Headline: *root cause is structural, not attorney capacity.*
- Volume / deflection bars; failure-mode breakdown.

**P4 Business Case:**
- **Value-bridge waterfall** (should-cost + price-normalization + trap-$ + concessions → net).
- **Cost-scenario grouped bars** — Big 4 (1.8–2.8M) vs boutique-hybrid (0.95–1.45M) vs offshore-heavy (0.62–0.98M).
- **Sensitivity tornado**; first-year value range.

### 4. Solution building blocks — a *bundle*, not a single archetype label
**Canonical model: `MOVES_SOLUTION_BUILDING_BLOCKS.md` (read it).** A Move is **not** one archetype — it is a **composed bundle of 3–6 reusable building blocks** drawn from a governed set of **10**: process redesign · data readiness/remediation · knowledge/retrieval copilot · AI-assisted decision support · workflow automation · human-in-the-loop agent · analytics/intelligence layer · system/platform implementation · controls/governance/risk · value-tracking/operating-cadence. Do **not** invent use-case labels; do **not** reduce it to a single shape.

The design must show, per phase:
- **A simple "Recommended solution building blocks" card** — the bundle for this Move (e.g., *"Redesign the intake process · Clean up contract metadata · Add AI-assisted triage · Configure workflow inside CLM · Keep attorney approval controls · Track value in Tower"*), plus a **"Not recommended yet"** line with a reason (e.g., *"Fully autonomous contract review — legal/control readiness not high enough"*). That "not yet" line is the `ambition ≤ readiness` guardrail made visible.
- **Blocks drive the phase content** (this is the point, not the label): in **P2** the selected blocks dictate *what evidence to ask for*; in **P4** they become *workstreams*; each finding/chart on the page hangs under the block it belongs to (process · data-quality · AI-adoption · control · value metric groups).
- **Benchmarks are composed** for `(block × industry × function)`, tagged by source (block-playbook trap · industry baseline · or *"empirical — N comparable moves"*). Never a static per-use-case card.

For the mockup, the insight/benchmark panel reads as *"for this block, in this industry, similar moves see X; you're at Y."* (See `MOVES_SOLUTION_BUILDING_BLOCKS.md` and `MOVES_ANALYTICS_LAYER_SPEC.md` §5.)

### 5. The P3 Building-Blocks Canvas (the solution-lanes screen)
P3 must NOT be a blank solution-design page. It renders the selected bundle as **design lanes** — one lane per block — each pre-populated from what P2 found. Per lane, show:
- **What P2 found** (the finding carried forward),
- **What must be designed** (this lane's design task),
- **Options** (where the block has choices),
- **Phase one** vs. **Later**, and **Not recommended yet** (with the readiness reason — the `ambition ≤ readiness` guardrail).

Above the lanes: the **solution-approach header** (recommended phase-one approach in plain English) and, per `MOVES_DYNAMIC_PATTERN_ASSEMBLY.md`, an honesty tone — *this was assembled from your evidence + readiness; here's what's supported vs. assumed vs. needs review.* Worked example (Legal Contract Intake) for the lanes: Process → intake→triage→route→approval flow · Data → required-field contract + obligation owner · Workflow → CLM routing/SLA · Human-in-loop → attorney confirms extracted obligations · Controls → privilege fence + approval matrix · Value → Tower metric set. Full per-lane P2→P3→P4 content is in `MOVES_BUILDING_BLOCK_SPINE.md`.

## Codebase map (so the mockup maps to real wiring)

**Current Moves (to replace/upgrade):**
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — the ~2,700-line phase workspace (gate panel, capture workbench).
- `src/components/strategic-moves/EvidenceWorkbench.tsx`, `StrategicMoveOriginateClient.tsx`.
- Deliverable generators where findings are trapped: `src/lib/programs/board-artifacts/*`, `src/lib/programs/deliverables/board-deliverable.ts`, `deliverable-narrative.ts`, `deliverable-canvas-view.ts`.

**Pattern to mirror (Source's data-intelligence layer — this is the model for a NEW `src/lib/programs/analytics/`):**
- `src/lib/source/analytics/*` — typed structured findings: `types.ts` (`SourceAnalyticFinding`, `ContractOptimizationAnalytics`, `VendorResponseAnalytics`, `VendorEvaluationResult`, `BafoLever`, `EvaluationCategoryScore`), `evaluation-scorecard.ts`, `bafo-leverage.ts`, `contract-optimization.ts`, `evidence-readiness.ts`, `executive-story.ts`, `index.ts`, `fixtures.ts`.
- `src/lib/source/archetypes/*` (event-archetype-resolver, differentiation) + `src/lib/source/agent-generation/archetype-advisory.ts` + `src/lib/source/ams-intelligence-signals-view.ts`.
- Canvas view-models feeding the page: `src/components/source/canvas/analytics/view-model.ts`, `sample-view-model.ts`, `analytics-tokens.ts`.

**Moves archetype — the bounded shapes + the classifier already exist (REUSE, don't re-enumerate):**
- `src/lib/programs/taxonomy/solution-archetype-taxonomy.ts` — the 8 governed solution shapes, `readinessGates` (data/control/eval), `antiPatterns`.
- `src/lib/programs/suitability/agentic-suitability.ts` — the runtime classifier: `SuitabilityAssessment { recommendedArchetype, readinessScore, gaps }` (maps any use case → a shape; flags over-reach).
- Background: `docs/strategy/MOVES-SOLUTION-ARCHETYPE-TAXONOMY.md`, `docs/build/moves-design/strategic-move-archetype-framework.md`.

## The data contract the mockup should imply

One finding shape drives both the page and the deliverable (single source of truth — the deliverable should CONSUME findings, not re-author prose):

```
MoveFinding {
  phase: 'P0'|'P1'|'P2'|'P3'|'P4'|'P5'
  kind: 'baseline'|'root_cause'|'option'|'value'|'risk'|'kpi'
  statement: string
  evidence: EvidenceRef[]
  confidence: 'high'|'medium'|'low'
  archetypeBenchmark?: {                                          // composed, not enumerated
    shape: SolutionArchetypeKey                                   // 1 of 8, from the classifier
    typical: string; thisMove?: string
    source: 'taxonomy_antipattern'|'industry_baseline'|'function_kpi'|'case_corpus_empirical'
    n?: number                                                    // comparable moves, when empirical
  }
  chart?: RechartsViewModel                                       // recharts-ready
  owner?: string
  status: 'surfaced'|'reviewed'|'challenged'|'accepted'          // collaboration
}
```

## Constraints
- Match the **Source redesign's** visual language exactly (it's the new house style for gated journeys).
- Keep Moves' own **content** (transformation deliverables, RACI, Tower handoff) — port the *pattern*, not Source's sourcing content.
- Findings and charts must be **archetype-benchmarked and evidence-cited**, never generic filler.
- Honesty model: when inputs are missing, the gate stays closed and names what's missing.

## Out of scope
- The answer/generation engine's reasoning; the retrieval/data plane; other surfaces.
- Wiring to live data (this is the design + the implied contract; the build comes after).
