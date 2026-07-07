# Claude Design brief — Moves phase workspace, in the Source look, with a data-intelligence layer + Recharts

## Context (read first)

You redesigned **Source** into a stage-gated event workspace (standalone HTML we have): stage-head + lede, **Input templates / Generated deliverables** split, per-stage **findings surfaced inline** ("✦ What Source read," anomalies→"Clarifications to vendors," "The scorecard — live," "Recommendation"), **gate-as-human-attestations** ("Findings reviewed," "Scorecard agreed"), an honesty model ("the gate can't arm until two inputs land… no recommendation until they're in"), progress bars, and a contextual Ava. That is the target pattern.

**Moves** is the same archetype as Source — a governed journey — but its phases are **P0 Originate → P1 Charter → P2 Discover & Diagnose → P3 Solution Design → P4 Plan/Business Case → P5 Operate → Tower handoff**. Today Moves' intelligence is **trapped inside generated deliverables** (Word/HTML). This redesign brings Moves to the Source look/feel AND surfaces the intelligence on the page for collaboration/feedback.

## Deliverable

Standalone HTML mockup(s) in the **same self-contained format and visual language as the Source redesign** (match that palette/type — Fraunces + Inter + JetBrains Mono, cream surfaces, muted lines, the same button/gate/progress vocabulary). Produce **two phase pages** because they carry the richest intelligence:
1. **P2 Discover & Diagnose**
2. **P4 Plan / Business Case**

(One shared shell, two phase configs.)

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

### 4. Archetype-benchmarked, not generic — and the archetype is a *classified shape*, not a use-case label
Do **not** invent a use-case archetype (like "AI-assisted intake/triage"). Use cases are unbounded; the archetype is the bounded **solution *shape*** a move is *classified into* — one of 8 governed shapes that already exist in code (`automation`, `assistant`, `retrieval_copilot`, `human_in_loop_agent`, `full_agentic_workflow`, `data_remediation`, `vendor_led_implementation`, `process_redesign`). The design should show, per phase:
- **The resolved shape** (e.g., "Classified as: Human-in-the-Loop Agent") — output of the existing classifier, not a hand-picked label.
- **Readiness on 3 dimensions** (data / control / eval) with a small "ambition vs readiness" indicator — the governing rule is *ambition must not exceed readiness*; surface the gaps to close.
- **Composed benchmarks** next to this move's actuals — the typical value lever / baseline / classic trap for `(shape × industry × function)`, tagged by source (taxonomy trap · industry baseline · or **"empirical — N comparable moves"** once the case corpus has data).

For the mockup, the benchmark panel reads as *"for this shape, in this industry, similar moves see X; you're at Y"* — composed and learned, never a static per-use-case card. (See `MOVES_ANALYTICS_LAYER_SPEC.md` §5.)

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
