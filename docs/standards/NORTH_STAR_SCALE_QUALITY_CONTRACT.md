# AbarVa North-Star Scale Quality Contract

## Release Principle

Quality must be verifiable by construction as dimensions multiply.

The recurring failure pattern is a proxy being accepted as quality while the artifact underneath is hollow, mixed, or generic. Fact counts, source counts, green matrices, and broad readiness labels are useful telemetry, but they are not proof that the content is real. A release is only north-star compliant when the actual answer, dossier, metric, chart, graph, or rendered artifact can be checked automatically against the same substrate that produced it.

## One Substrate, Many Surfaces

The product architecture is:

`L1 Sources -> L2 Entities/Facts/Relationships -> L3 Dimension Dossiers -> L4 Read Models -> L5 Bounded Advisory Packets -> L6 Quality Gate + Renderer`

Home, Intelligence, Tower, Source, and Moves are different purposes over one substrate. They are not allowed to become five data systems.

| Surface | Purpose | Contract Boundary |
|---|---|---|
| Home KNOW | What do we know? | Evidence, coverage, gaps, citations. No recommendations or expert theater. |
| Intelligence ANALYZE | What does it mean? | Interpretation, options, tradeoffs, benchmarks, patterns, expert lenses, cited tenant facts. |
| Tower CONTROL | Is value real? | Budget, spend, value, risk, adoption, and outcome proof from controlled metric contracts. |
| Source SOURCE | What should we source? | Procurement and supplier decision packets over source/procurement evidence. |
| Moves EXECUTE | What do we execute? | Action packets, workstreams, decisions, owners, gates, and proof artifacts. |

Surfaces may differ in mode, copy, and renderer, but they must not own a separate data path.

## Dimension Lifecycle

Every new dimension enters the same assembly line:

`extract -> bind -> assemble L3 dossier -> content gate -> readiness state -> surface consumption -> continuous proof`

The readiness states are:

- `ready`: populated facts and relationships pass the content gate for the dimension contract.
- `partial`: related content exists, but required fields, mappings, or relationships are missing.
- `not_ready`: the dimension has no usable content for user-visible answers.

Surfaces consume dimensions by readiness state. They must not hardcode special-case readiness logic.

## Invariants

### 1. One Path

Every surface reads the substrate through the shared assembler and shared answer shaper. A surface-specific fallback lane is a quality risk unless it is explicitly documented as a temporary exception with a removal date.

### 2. Content-Gated Readiness

`ready` is never a row-count label. It means the required facts, field values, relationship edges, citations, freshness, and display labels exist for the dimension contract.

### 3. Contract Computed Once

Every metric, amount, chart series, graph edge set, and table row family is computed in one function/read-model contract. Tiles, chat, dossiers, and reports all call that same contract. No surface re-derives spend, value, pressure, exposure, ROI, or readiness.

### 4. Determinism Owns Facts; The Model Owns Prose

AbarVa computes facts, joins, metric values, artifact data, citations, gaps, and conflicts. The model receives a bounded packet and writes synthesis. Factual lookup questions should bypass the model when deterministic output is enough.

### 5. Proof Is Continuous, By Dimension

Each dimension and surface must be proven from:

- the final bounded packet or prompt sent to the model,
- the raw model output when a model is used,
- the rendered artifact,
- literal checks for tenant grounding, raw-ID leakage, scope leakage, metric consistency, and artifact presence.

A green score without artifact inspection is not proof.

### 6. Capacity Is Based On Populated Content

Volumetrics, cost, storage, caching, and latency planning are sized on validated populated facts and runtime-assembled packets. Raw shell counts and pre-materialized question x dimension x tenant packets are not capacity inputs.

### 7. Locked Control Plane

Autonomous agents and crawlers do not get unrestricted production mutation power. Only approved deployment and data-ingestion paths can move shared runtime, data, or readiness state. Destructive changes require snapshot, rollback, and audit evidence.

## Scaling Math

| Shape | Rule |
|---|---|
| Per-surface code | Must stay flat as dimensions grow. |
| LLM surface area | Must stay bounded; deterministic answers should not call the model. |
| Data paths | Must stay one shared path. |
| Builders and dossiers | May grow linearly by dimension. |
| Eval questions and answer contracts | May grow linearly by dimension and question family. |
| Surface x dimension forks | Must not grow. |
| Prebuilt question x dimension x tenant packets | Must not be materialized as the core architecture. |

## Current Gap Register

| Gap | North-Star Violation | Required Closure |
|---|---|---|
| Hollow dossiers can pass on counts | Content-gated readiness missing or weak | Add content gates that inspect populated fields, display labels, citations, and relationships. |
| Intelligence fallback lanes | One Path | Collapse answer assembly onto the shared dossier-first path or document temporary exceptions. |
| Divergent metrics between dashboard and chat | Contract Computed Once | Route dashboard tiles and chat answers through the same read-model metric functions. |
| Release proof run manually per episode | Proof Continuous By Dimension | Promote scorer/crawl proof into a release gate for affected paths. |
| Rogue runtime mutation | Locked Control Plane | Enforce deploy authority and drift checks. |
| Capacity based on raw counts | Capacity On Populated Content | Recompute volumetrics from validated facts and ready dossiers only. |

## Release Checklist

Any change to semantic layers, L3 dossiers, Home KNOW, Intelligence ANALYZE, Tower CONTROL, Source, Moves, shared answer shapers, renderers, or QA harnesses must answer these questions in the release record:

1. Does it preserve one shared substrate path?
2. What content gate proves readiness beyond counts?
3. Which metric/read-model contract computes each surfaced number?
4. Which facts/artifacts are deterministic, and where is model prose allowed?
5. What dimension/surface proof was run, and where is the raw prompt/output/render evidence?
6. What is the rollback path if the readiness or metric contract is wrong?

## One-Line Decision Test

Does this make quality verifiable by construction as we add dimensions, or does it add a proxy we have to trust?

If it adds a proxy, it is debt, even when the demo looks good.
