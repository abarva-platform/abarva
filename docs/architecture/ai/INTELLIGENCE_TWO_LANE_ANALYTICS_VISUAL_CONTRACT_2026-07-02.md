# Intelligence two-lane analytics and visual contract

Date: 2026-07-02
Lane: global-control-lane
Status: implementation contract

## Executive position

Intelligence should not behave like one large chat completion. The target runtime is two-lane:

1. Fast advisory lane: the left aVa answer returns the executive point of view quickly.
2. Progressive exhibit lane: the right decision canvas renders a lightweight frame immediately, then upgrades into richer exhibits as model and analytics outputs arrive.

The product moat is not "Claude plus context." The moat is governed decision synthesis:

- tenant evidence and dossier packets define the factual boundary,
- deterministic analytics compute ranking, gaps, outliers, readiness, risk, and scenario math,
- Claude expresses the advisory judgment,
- AbarVa renders that judgment as a consistent executive exhibit.

## Open-source analytics position

Open-source analytics can help, but it should not replace the advisory model.

Use open-source analytics for deterministic work:

- ranking initiatives,
- detecting outliers,
- computing normalized value/readiness/risk,
- clustering similar bets,
- calculating Pareto frontiers,
- scenario and sensitivity analysis,
- dependency centrality,
- evidence coverage scoring,
- latency and response-quality telemetry.

Do not use open-source ML to generate the CXO answer. The answer remains Claude-owned and traceable. Analytics produces computed facts and exhibit geometry that Claude can reference and the renderer can trust.

Recommended stack by role:

| Role | Candidate | Why |
|---|---|---|
| React-native charts already in repo | Recharts | Fastest path. Already installed. Good for simple bars, lines, scatter, radar, and composed charts. |
| Premium executive custom visuals | D3 utilities under custom React components | Best for highly branded value/readiness matrices, sequencing maps, and roadmap geometry. Use D3 for scales/layout only, not as an unmanaged DOM renderer. |
| Declarative chart specifications | Vega-Lite | Good future option for governed, JSON-based chart specs, but should be allowed only through a strict allowlist. |
| Exploratory/internal analytics | Observable Plot | Good for internal eval dashboards and research prototypes, not first-choice production CXO canvas. |
| Browser/server analytical SQL | DuckDB-Wasm or DuckDB server-side | Useful for local proof bundles, CSV/Parquet regression, and high-volume eval analysis. Do not put large tenant-sensitive analytics in browser by default. |
| Browser ML inference | ONNX Runtime Web or TensorFlow.js | Optional later for small classifiers or embeddings. Not needed for first two-lane runtime slice. |
| Node/graph exhibits | React Flow | Useful later for dependency maps, gate roadmaps, and operating-model flows when the canvas needs editable or inspectable nodes. |

## Deterministic analytics module

Add a small analytics layer before richer visualization work:

`src/lib/intelligence/analytics/`

Initial functions:

- `normalizeScore(value, min, max)`: stable 0-100 scoring.
- `normalizeValueScore(candidate)`: candidate value signal normalized to 0-10.
- `normalizeReadinessScore(candidate)`: candidate readiness signal normalized to 0-10.
- `normalizeRiskScore(candidate)`: candidate risk signal normalized to 0-10 with control/dependency penalties.
- `calculateProofBoundaryScore(candidate)`: evidence, confidence, owner, control, baseline, and dependency completeness score.
- `assignInvestmentPosture(candidate)`: scale now, certify then scale, fund readiness, or hold with an explanation.
- `calculateQuadrantPlacement(candidate)`: value/readiness placement with human-readable quadrant.
- `rankPortfolioItems(items, weights)`: weighted value/readiness/risk/evidence ranking.
- `rankPortfolioCandidates(candidates)`: typed candidate ranking using value, readiness, proof, risk penalty, and completeness.
- `bucketInvestmentPosture(item)`: scale now, certify then scale, fund readiness, hold/stop.
- `computeValueReadinessQuadrants(items)`: quadrant placement and labels.
- `computeGateToValueRoadmap(gates)`: gate sequence, owner, value unlocked, dependency state.
- `computeProofBoundary(evidence)`: known, missing, assumed, decision required.
- `detectPortfolioOutliers(candidates)`: high-value/low-proof, high-readiness/high-risk, missing owner, missing baseline, and dependency uncertainty flags.
- `detectOutliers(series)`: IQR/z-score based anomalies for operational and financial metrics.
- `computeSensitivityCases(baseCase)`: low/base/high planning cases with assumption labels.
- `buildFastCanvasAnalytics(candidates, context)`: lane assignments, quadrant placements, top recommendation, proof gaps, outliers, decision required, follow-up questions, and native canvas payload.

These functions must be deterministic, unit-tested, and independent of Claude.

Typed candidate input:

```ts
interface IntelligencePortfolioCandidate {
  id: string;
  name: string;
  domain: string;
  tenantKey: string;
  valueSignal: number;
  readinessSignal: number;
  riskSignal: number;
  evidenceCount: number;
  missingEvidenceCount: number;
  ownerKnown: boolean;
  controlKnown: boolean;
  baselineKnown: boolean;
  dependenciesKnown: boolean;
  sourceConfidence: number;
  notes?: string;
}
```

The first implementation includes demo fixtures for SkyHarbor and Industrial/Morgan Street so the fast canvas can be useful immediately. In the production data-plane version, these candidate inputs should come from precomputed tenant evidence packets, not from prompt text.

## Canvas payload contract

Claude should not produce arbitrary HTML or hand-drawn charts. Claude emits advisory structure and structured data:

```json
{
  "canvasType": "valueReadinessMatrix",
  "title": "AI funding posture for SkyHarbor",
  "grounding": "tenant-evidence-with-industry-context",
  "items": [
    {
      "label": "IROPS Decision Assistant",
      "shortLabel": "IROPS",
      "value": 10,
      "readiness": 3,
      "risk": 8,
      "evidenceConfidence": 0.72,
      "posture": "Fund readiness",
      "owner": "EVP Operations + CDAO",
      "gate": "Certified operational event data"
    }
  ],
  "proofBoundary": {
    "known": ["Crew and aircraft recovery data readiness is below scale threshold"],
    "missing": ["Signed freshness SLA for operational event store"],
    "assumed": ["Planning value uses industry-context range, not tenant actual"],
    "decisionRequired": "Give CDAO authority to block AI capital below data-product certification"
  }
}
```

Renderer rules:

- renderer draws only allowlisted canvas types,
- renderer never executes HTML from model output,
- renderer shortens labels for geometry and puts full names in legends or footnotes,
- renderer must not rewrite the left answer,
- renderer must not expose raw JSON, tab markers, or debug labels,
- renderer must show context boundaries when a visual uses industry or assumption data.

## Native exhibit library

Prioritize AbarVa-native exhibits over generic chart dumps.

| Exhibit | Best use | Renderer behavior |
|---|---|---|
| `investmentSequencingMap` | Funding, prioritization, scale/hold/stop | Columns: Scale now, Certify then scale, Fund readiness, Hold/stop. Each initiative card shows value, readiness, risk, gate, owner. |
| `valueReadinessMatrix` | Portfolio tradeoffs | Scatter/quadrant map with numbered markers and a legend. Avoid text overlap. Show high-value/high-readiness region clearly. |
| `gateToValueRoadmap` | What happens first | Horizontal or vertical gate path. Each gate shows owner, proof needed, value unlocked, blocker state. |
| `proofBoundary` | Trust, evidence, board readiness | Known, missing, assumed, decision required. Distinguish tenant fact from industry context. |
| `riskControlHeatmap` | Control gaps, compliance, safety | Rows = risk dimensions; columns = functions/domains; cells = severity/confidence. |
| `portfolioBubbleMap` | Spend/value/risk comparison | Bubble size = value or spend; x/y = readiness/risk or value/readiness; color = posture. |
| `dependencyMap` | Systems, vendors, data products | Node-link map with critical dependencies and tenant isolation guard. |
| `scenarioWaterfall` | TCO/value/benefit cases | Low/base/high scenario bridge with assumption labels. |

First implementation should use Recharts plus custom SVG/React for the first four exhibits. Add React Flow only when dependency maps become a real product requirement.

## Two-lane runtime behavior

### Fast left lane

Goal:

- first visible useful answer under 5 seconds,
- concise left response complete under 12-18 seconds,
- no blocking tab/canvas repair,
- no large table or evidence dump,
- no dependency on right-canvas completion.

Prompt contract:

- compact tenant facts,
- direct POV,
- one short executive answer,
- 2-3 adaptive follow-up choices,
- include trace id but do not show it.

### Progressive right lane

Goal:

- initial canvas frame visible under 2 seconds,
- full canvas available when Claude/analytics finish,
- no interruption to the left answer if the canvas fails,
- show useful right-side content for every question.

Render sequence:

1. deterministic pending frame from question intent and tenant identity,
2. analytics-backed shell from typed portfolio candidates,
3. Claude-authored canvas payload,
4. renderer converts payload into native exhibit,
5. failed or incomplete payload falls back to proof boundary and next-move cards.

## 500-question pressure test

Test set:

- 200 SkyHarbor airline questions across IROPS, AI portfolio, loyalty, predictive maintenance, crew, product development, CTO governance, and operational resilience.
- 200 Industrial/Morgan Street questions across HR, Finance, Treasury, Legal, FP&A, shared services, value office, controls, and automation operating model.
- 50 cross-tenant isolation and no-bleed tests.
- 50 adversarial tests: vague prompts, missing data, benchmark requests, conflicting assumptions, board artifact wording, and "be concise" variants.

Every run captures:

- tenant/user,
- question,
- fast-lane prompt,
- fast-lane raw model output,
- rendered left answer,
- canvas prompt or deterministic canvas input,
- Claude canvas payload,
- rendered canvas payload,
- screenshots at 2s, 6s, 12s, 25s, 45s, final,
- latency timestamps,
- visible DOM leak scan,
- tenant-bleed scan,
- rubric score.

Pass gates:

| Gate | Target |
|---|---:|
| First useful left answer | 95% under 5s |
| Left answer complete | 95% under 18s |
| Right canvas skeleton | 90% under 2s |
| Full canvas complete | 85% under 45s |
| Raw marker/JSON leak | 0 |
| Tenant bleed | 0 |
| Trace captured | 100% |
| CXO quality score | 90% >= 4/5 |

Quality rubric:

- decision clarity,
- business relevance,
- concision,
- tenant grounding,
- executive tone,
- next-step usefulness,
- visual usefulness,
- proof-boundary clarity.

## 100-question production pressure gate

Before using the analytics-backed fast canvas in a live CXO demo, run the production pressure gate:

```bash
npm run qa:intelligence:pressure100 -- \
  --base-url https://app.abarva.ai
```

Use `--dry-run` before deploy to generate the bank and validate harness wiring without claiming browser proof. The full run requires signed-in production auth. Prefer tenant storage states:

```bash
INTELLIGENCE_PRESSURE_STORAGE_STATE_SKYHARBOR=.auth/agent-skyharbor-cto.json \
INTELLIGENCE_PRESSURE_STORAGE_STATE_INDUSTRIAL=.auth/agent-lakeshore-cio.json \
npm run qa:intelligence:pressure100 -- --base-url https://app.abarva.ai
```

The harness executes 100 medium-to-complex questions:

- 51 Industrial/Morgan Street questions,
- 49 SkyHarbor/Airline questions,
- categories covering prioritization, scale/certify/readiness/hold, governance, roadmap, proof boundary, risk/controls, drilldowns, and adversarial prompts.

It captures:

- deployment metadata,
- question bank,
- per-question request body,
- raw API stream when Playwright can read it,
- parsed direct answer,
- parsed companion tabs,
- parsed native canvas payloads,
- fast analytics canvas DOM snapshot,
- screenshot,
- console/network logs,
- latency timings,
- quality score,
- analytics-vs-Claude alignment classification.

Pass/fail is intentionally strict:

- fast canvas target under 500 ms, hard fail above 2 seconds,
- first model response target under 3 seconds, hard fail above 10 seconds,
- primary answer target under 35 seconds, hard fail above 60 seconds,
- final UI settle target under 45 seconds, hard fail above 75 seconds,
- raw JSON/marker leak is a technical fail,
- missing five-tab companion structure is a technical fail,
- analytics-vs-Claude contradiction is flagged for manual review.

## First implementation slice

Do this next:

1. Add `src/lib/intelligence/analytics/portfolio.ts` with deterministic portfolio ranking, posture bucketing, and value/readiness quadrant placement.
2. Add unit tests for the ranking and quadrant math using SkyHarbor and Industrial examples.
3. Add a right-lane `pendingCanvas` builder that uses deterministic analytics where possible before Claude finishes.
4. Split API trace events into:
   - `fast_answer.start`
   - `fast_answer.first_token`
   - `fast_answer.done`
   - `canvas_frame.visible`
   - `canvas_generation.start`
   - `canvas_generation.done`
   - `canvas_render.done`
5. Update the 500-question harness to score left lane and right lane separately.
6. Keep the existing no-blocking-repair invariant.

## Non-goals

- Do not add arbitrary chart HTML from Claude.
- Do not introduce browser-heavy ML in the first slice.
- Do not make every question wait for canvas completion.
- Do not treat industry assumptions as tenant facts.
- Do not add more tabs just because the right pane has space.
