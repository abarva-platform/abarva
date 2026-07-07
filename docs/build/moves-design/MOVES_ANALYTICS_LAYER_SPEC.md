# Moves Data-Intelligence Layer — Engineering Spec (`src/lib/programs/analytics/`)

Companion to `MOVES_REDESIGN_CLAUDE_DESIGN_BRIEF.md`. The brief is the *look*; this is the *substance*. The redesigned phase page renders live, evidence-cited, archetype-benchmarked intelligence — that requires a typed analytics layer Moves does not have yet. Build it as a direct mirror of Source's `src/lib/source/analytics/*` + `src/lib/source/archetypes/*`.

## 1. Goal & the "un-trap" principle

Today Moves generates findings straight into HTML/Word (`src/lib/programs/board-artifacts/*`, `deliverables/board-deliverable.ts`, `deliverable-narrative.ts`). The root cause, the value bridge, the baselines — all trapped in prose. This layer makes each finding a **first-class typed object** that:

1. Renders on the phase page as a reviewable card (collaboration/feedback).
2. Feeds Recharts view-models (advanced visuals).
3. Is **consumed by** the deliverable generators (single source of truth) — the doc renders findings, it does not re-author them. Page and doc can never disagree.

## 2. File structure (mirror `src/lib/source/analytics`)

```
src/lib/programs/analytics/
  types.ts                 // MoveFinding, EvidenceRef, RechartsViewModel, MovePhaseAnalytics, per-phase payloads
  index.ts                 // buildMovePhaseAnalytics(moveId, phase) => MovePhaseAnalytics
  extractors/
    p0-originate.ts        // archetype classification + value-hypothesis band
    p1-charter.ts          // scope in/out, decision rights, success targets
    p2-discover.ts         // current-state baselines, root-cause Pareto, failure modes
    p3-solution.ts         // option matrix, decision scoring
    p4-business-case.ts    // value bridge, cost scenarios, sensitivity, ROI
    p5-operate.ts          // KPI targets, realized-vs-projected
  archetype/
    resolve.ts             // thin adapter over the EXISTING classifier — does NOT define archetypes
    compose-benchmark.ts   // shape(taxonomy) + industry(corpus) + function(kpis) + case-corpus => ArchetypeBenchmark
    case-corpus.ts         // completed-move case library; nearest-neighbor empirical benchmarks
  view-models/
    recharts.ts            // MoveFinding.chart => Recharts component props
  fixtures.ts              // deterministic sample (Lakeshore legal contract intake)
  __tests__/
```

> **Do NOT build a registry that enumerates use-case archetypes.** Use cases are unbounded (industry × function × problem); the archetype *shapes* are bounded and already governed (see §5). This layer **resolves → composes → learns**; it never re-enumerates.

## 3. Core types (`types.ts`)

```ts
export type MovePhase = 'P0'|'P1'|'P2'|'P3'|'P4'|'P5';
export type Confidence = 'high'|'medium'|'low';
export type FindingKind = 'baseline'|'root_cause'|'option'|'value'|'risk'|'kpi';
export type FindingStatus = 'surfaced'|'reviewed'|'challenged'|'accepted';

export interface EvidenceRef { id: string; label: string; source: string; asOf?: string; }

// Archetype = a governed solution SHAPE (1 of 8), NOT a use-case label. See §5.
export type ArchetypeShapeKey =
  | 'automation' | 'assistant' | 'retrieval_copilot' | 'human_in_loop_agent'
  | 'full_agentic_workflow' | 'data_remediation' | 'vendor_led_implementation' | 'process_redesign';

export interface ArchetypeBenchmark {
  shape: ArchetypeShapeKey;                 // resolved by the classifier, not enumerated
  typical: string;                          // the composed expectation for this shape × industry × function
  thisMove?: string;                        // this move's actual
  source: 'taxonomy_antipattern' | 'industry_baseline' | 'function_kpi' | 'case_corpus_empirical';
  n?: number;                               // # of comparable completed moves (when source = case_corpus_empirical)
}

export type RechartsKind = 'waterfall'|'pareto'|'tornado'|'scatter'|'grouped_bar'|'distribution'|'line'|'radar';
export interface RechartsViewModel {
  kind: RechartsKind;
  title: string;
  data: Array<Record<string, string | number>>;   // recharts <XType>Chart data prop
  series: Array<{ key: string; label: string; color?: string }>;
  axes?: { x?: string; y?: string; unit?: string };
  annotations?: Array<{ at: string | number; label: string }>;   // benchmark line, target, tail marker
}

export interface MoveFinding {
  id: string;
  phase: MovePhase;
  kind: FindingKind;
  statement: string;               // one board-grade sentence
  detail?: string;                 // optional supporting line
  evidence: EvidenceRef[];         // never empty for an accepted finding
  confidence: Confidence;
  archetypeBenchmark?: ArchetypeBenchmark;
  chart?: RechartsViewModel;
  owner?: string;
  status: FindingStatus;
  comments?: Array<{ author: string; body: string; at: string }>;
}

export interface MovePhaseAnalytics {
  moveId: string;
  phase: MovePhase;
  archetype: ArchetypeProfile;
  findings: MoveFinding[];
  charts: RechartsViewModel[];      // phase-level charts (may aggregate several findings)
  gate: Array<{ id: string; label: string; attestation: string; met: boolean }>;
  missingInputs: string[];          // honesty model: what's not in yet
}
```

## 4. Per-phase extractor contracts

Each extractor reads the move's **canonical phase-capture keys** (the same contract that fixed P0 promote — `business_trigger`, `problem_statement`, `initial_value_hypothesis`, etc.), its **evidence** (uploaded/ingested), and prior-phase findings. It emits `MoveFinding[]` + charts. **Deterministic** — no fabricated numbers; if an input is missing, emit the finding with `status:'surfaced'` and a `chart` flagged "needs evidence" (never guess).

| Phase | Reads | Emits (findings) | Recharts |
|---|---|---|---|
| **P0** | P0 capture (business_trigger, problem_statement, initial_value_hypothesis, …) | archetype classification, value-hypothesis band | radar (archetype fit), band |
| **P1** | P1 charter (scope in/out, decision rights, success criteria) | scope boundary, decision-rights map, success targets | in/out split, RACI heat |
| **P2** | current-state evidence + baselines | baseline metrics (cycle time, missing-field %, aged queue), **root-cause decomposition**, failure modes | **distribution** (cycle-time tail), **pareto** (root causes), grouped_bar (volume/deflection) |
| **P3** | solution options, decision matrix | option set, scored comparison, recommended option | **scatter** (value×feasibility), grouped_bar (scores) |
| **P4** | cost model, value assumptions, scenarios | **value bridge**, cost scenarios, sensitivity, ROI band | **waterfall** (value bridge), grouped_bar (Big4/boutique/offshore), **tornado** (sensitivity) |
| **P5** | KPI defs, measurement plan | KPI targets vs baseline, realized-vs-projected | grouped_bar (target vs baseline), line (realized vs projected), adoption curve |

## 5. Archetype — dynamic resolution, NOT an enumerated corpus

**Design principle (this is the important one).** Moves *use cases* are effectively infinite — industry × function × problem × how-work-changes. You must never enumerate them. What IS bounded and governed is the **solution *shape*** a move takes. The specificity of a real move comes from **composition + a learning case library**, not a bigger list.

### 5.1 The archetype is a bounded shape — already built, reuse it
The 8 shapes, their readiness gates, and their anti-patterns already exist:
- `src/lib/programs/taxonomy/solution-archetype-taxonomy.ts` — `SOLUTION_ARCHETYPES` (`automation`, `assistant`, `retrieval_copilot`, `human_in_loop_agent`, `full_agentic_workflow`, `data_remediation`, `vendor_led_implementation`, `process_redesign`), each with `readinessGates` on 3 dimensions (`data` / `control` / `eval`) and `antiPatterns` with reason codes.
- **Do not redefine these in the analytics layer. Import them.**

### 5.2 Resolution is dynamic — reuse the existing classifier
`archetype/resolve.ts` is a thin adapter over the **already-shipped** classifier:
- `src/lib/programs/suitability/agentic-suitability.ts` → `SuitabilityAssessment { recommendedArchetype, recommendedName, intendedArchetype, readinessScore (0–100), gaps: SuitabilityGap[] }`.
- It classifies *any* move (from P0 capture: business_trigger, problem_statement, affected_function_process, initial_value_hypothesis) into one of the 8 shapes, scores readiness on data/control/eval, detects **over-reach** (intended more ambitious than readiness supports → recommends a less ambitious shape + names the gaps to close). This is how infinite use cases map to bounded shapes.

### 5.3 Specificity comes from COMPOSITION, not enumeration
`archetype/compose-benchmark.ts` builds each finding's `archetypeBenchmark` by composing three governed sources for the resolved `(shape × industry × function)` — never a per-use-case lookup:
- **Shape** → value-mechanism, classic anti-patterns/traps, cost shape, human-gate posture (from the taxonomy).
- **Industry corpus** → baselines/benchmarks (`V6_15_industry_corpus_patterns` / `intelligence_v7` industry-market dimension).
- **Function** → the KPIs that matter for that operating area.
A never-before-seen use case still gets archetype-grade intelligence because all three inputs are bounded and governed.

### 5.4 The learning layer — the case corpus (`archetype/case-corpus.ts`)
This is what makes benchmarks *empirical* over time instead of hand-guessed. Every **completed** move is indexed by its signature `(shape × industry × function × readiness)` with its actual baselines, realized value, and traps hit. `nearestNeighbors(signature)` returns comparable prior moves; when ≥ N comparables exist, the benchmark source becomes `case_corpus_empirical` (carry `n`). So the system *learns* archetypes from experience — no one hand-authors a new use-case profile.

### 5.5 Governance
Shapes, industries, functions, and readiness rungs are **canonical governed vocabularies** (no free-text archetype labels — same discipline as tenants / relationship-types). A genuinely new *shape* is rare and added deliberately to `solution-archetype-taxonomy.ts`; new use cases require **zero** new definitions — they just classify + compose + accrue to the case corpus. Enforce the taxonomy's core rule: **agentic ambition must not exceed readiness** (surface `SuitabilityGap[]` on the P0/P1 findings).

## 6. Recharts view-model mapping (`view-models/recharts.ts`)

Pure mapping `MoveFinding.chart` → props for the Recharts components (`recharts@3.8.1`, already a dependency). Component set: `waterfall` (BarChart with cumulative base), `pareto` (composed Bar + cumulative Line), `tornado` (horizontal diverging BarChart), `scatter` (ScatterChart), `grouped_bar` (BarChart multi-series), `distribution` (BarChart histogram + reference lines for P75/P90), `line`, `radar` (RadarChart). Theme tokens match the Source redesign palette (mirror `src/components/source/canvas/analytics/analytics-tokens.ts`).

## 7. Single source of truth — deliverables consume findings

Refactor `deliverables/board-deliverable.ts` / `deliverable-narrative.ts` to **read `MovePhaseAnalytics.findings`** and render them (prose + embedded chart snapshots), rather than re-authoring analysis. Result: the phase page, the Word doc, and the HTML export all render the same governed findings.

## 8. Collaboration lifecycle (`finding.status`)

`surfaced → reviewed → challenged | accepted`. The phase **gate attestations** aggregate accepted findings ("Findings reviewed", "Value case agreed"). Comments attach to a finding id. Advancing a phase requires the phase's required findings to be `accepted`. This is the page-native review surface that replaces red-lining a document.

## 9. Wiring

- API: `GET /api/v1/programs/{id}/phase-analytics?phase=n` → `MovePhaseAnalytics`.
- The redesigned phase page (from the design brief) calls it, renders finding cards + Recharts + gate attestations.
- Deterministic + governed: evidence-cited, no fabricated numbers, honesty model for missing inputs (mirror the discipline in `src/lib/source/analytics/*`).

## 10. Build sequence

1. `types.ts` + `fixtures.ts` (Lakeshore legal intake) → unblocks the design mockup with real shapes.
2. `archetype/resolve.ts` (adapter over the existing `agentic-suitability` classifier) + `compose-benchmark.ts` (shape × industry × function). **No new archetype registry.**
3. Extractors P2 + P4 first (richest intelligence), then P0/P1/P3/P5. P0 attaches the resolved shape + readiness gaps.
4. `view-models/recharts.ts` + wire into the redesigned page.
5. Refactor deliverable generators to consume findings.
6. `phase-analytics` API + `finding.status` collaboration lifecycle.
7. `archetype/case-corpus.ts` — start recording completed moves; benchmarks upgrade from composed → empirical as comparables accrue.
