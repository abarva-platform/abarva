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
  archetypes/
    corpus.ts              // transformation-archetype registry (levers/benchmarks/traps/cost-shape/KPIs)
    resolver.ts            // resolveMoveArchetype(move) => ArchetypeProfile
  view-models/
    recharts.ts            // MoveFinding.chart => Recharts component props
  fixtures.ts              // deterministic sample (Lakeshore legal contract intake)
  __tests__/
```

## 3. Core types (`types.ts`)

```ts
export type MovePhase = 'P0'|'P1'|'P2'|'P3'|'P4'|'P5';
export type Confidence = 'high'|'medium'|'low';
export type FindingKind = 'baseline'|'root_cause'|'option'|'value'|'risk'|'kpi';
export type FindingStatus = 'surfaced'|'reviewed'|'challenged'|'accepted';

export interface EvidenceRef { id: string; label: string; source: string; asOf?: string; }

export interface ArchetypeBenchmark { archetype: string; typical: string; thisMove?: string; }

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

## 5. Archetype corpus (`archetypes/corpus.ts`)

The Moves analog of Source's AMS/IMS. Revive from `docs/build/moves-design/strategic-move-archetype-framework.md`, `docs/strategy/MOVES-SOLUTION-ARCHETYPE-TAXONOMY.md`, `src/lib/solutions/solution-archetype-registry.ts`, `docs/build/MODERNIZATION_ARCHETYPE_COEFFICIENTS_2026-06-03.md`.

```ts
export interface ArchetypeProfile {
  key: string;                       // 'ai_assisted_intake_triage'
  name: string;                      // 'AI-assisted intake & triage'
  valueLevers: string[];             // cycle-time, rework reduction, obligation completeness…
  benchmarkBaselines: Record<string, { typical: string; range: [number, number]; unit: string }>;
  classicTraps: string[];            // "attorney-capacity framing hides the real intake defect"
  costShape: { boutiqueHybrid: [number, number]; big4: [number, number]; offshore: [number, number] };
  kpis: string[];
}
```

Seed archetypes (extend later): `ai_assisted_intake_triage`, `knowledge_deflection`, `obligation_control`, `shared_services_consolidation`, `workforce_economics`. `resolveMoveArchetype(move)` maps a move's P0 archetype classification → an `ArchetypeProfile`; every finding can then carry an `archetypeBenchmark` (typical vs thisMove).

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
2. `archetypes/corpus.ts` + `resolver.ts` (seed 5 archetypes).
3. Extractors P2 + P4 first (richest intelligence), then P0/P1/P3/P5.
4. `view-models/recharts.ts` + wire into the redesigned page.
5. Refactor deliverable generators to consume findings.
6. `phase-analytics` API + `finding.status` collaboration lifecycle.
