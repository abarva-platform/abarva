# PHS Population Health Command Center — Autonomous Execution Brief

Date: 2026-06-05
Status: Draft execution brief
Lane: global-control-lane + client-data-lane

## Mission

Build the Meridian / PHS-inspired Population Health and Clinical Performance
Command Center demo as a governed Moves-led experience. The demo must prove that
AbarVa can turn public evidence, synthetic internal evidence, corpus doctrine,
and human approvals into decision-grade strategy, architecture, value, and
mobilization artifacts.

## Non-Negotiables

- Use Claude for pilot-facing live CXO execution and artifact synthesis unless
  Anand explicitly re-approves another primary model after QA evidence.
- OpenAI may be used for offline QA, comparison, evaluation, or deterministic
  secondary generation only; it is not the pilot-facing execution path until it
  passes the Meridian/PHS hard-question bar.
- Use Setup/Admin loader-backed evidence. No seed side-load shortcuts.
- Do not fabricate confidential PHS data.
- Distinguish public evidence, synthetic internal demo evidence, and generated
  recommendations.
- Every material claim must cite an evidence key.
- Do not claim realized outcomes in the first demo.
- Do not show BAFO, Selection, Transition, or Value Realization until all prior
  phases are materialized and approved.
- Source is optional and starts only if Phase 5 chooses partner-led delivery.

## Workstreams

| Workstream           | Owner            | Output                                                           |
| -------------------- | ---------------- | ---------------------------------------------------------------- |
| Design package       | docs agent       | `docs/build/moves-design/phs-population-health-command-center/`  |
| Loader contract      | setup/data agent | upload schemas, parser gaps, validation tests                    |
| Corpus and grounding | agent QA         | PHS golden questions, corpus mapping, and model-quality evidence |
| Moves runtime        | runtime agent    | gated artifact chain and stage behavior                          |
| Source optional      | source agent     | partner-event trigger only after approved delivery model         |
| QA/crawl             | QA agent         | browser proof, artifact open/download/evidence/gate behavior     |

## Phase 0 — Design And Loader Contract

Definition of done:

- Design package exists and names every artifact, evidence input, approval owner,
  export format, and gate.
- PHS packet source is committed under `docs/build/meridian-phs-demo/`.
- Loader schema gaps are listed before runtime implementation.
- PHS Phase 0 manifest validation blocks stage advance when evidence,
  artifacts, gates, or approvals are incomplete.
- Release record exists.
- `npm run release:check -- --base origin/main --head HEAD` passes.

## Phase 1 — Evidence Loader Pack

Build only after Phase 0 merges.

Definition of done:

- Public PHS evidence CSV/JSON template.
- Synthetic workload inventory template.
- Synthetic data quality baseline template.
- Rate-card template or reuse of existing rate-card path.
- Gate criteria template.
- Approval persona template.
- Loader validation tests.
- No live tenant data mutation unless explicitly approved.

## Phase 2 — Moves Artifact Chain

Build only after Phase 1 proves loader path.

Definition of done:

- Moves shows Phase 3 Architecture / Business Case Review.
- Strategy, current-state, architecture, value, and mobilization artifacts open.
- Missing evidence blocks stage advancement.
- Approval state is named and visible.
- No realized-value claim.

## Phase 3 — Pilot Generation Harness

Build only after Phase 2 artifact persistence exists.

Definition of done:

- Claude-backed pilot generation path can draft Strategy Memo, Target
  Architecture, Value Case, and Mobilization Plan from approved evidence.
- Answers cite evidence keys.
- Missing evidence produces evidence requests.
- OpenAI-only QA may run as a comparison harness, but any OpenAI output that is
  thin, missing evidence keys, or weaker than the CXO digestibility standard is
  labeled as QA evidence only, not pilot-ready execution.
- The model provider used for every captured answer is recorded in the QA report
  and surfaced in any runtime response headers or telemetry available to the
  harness.

## Phase 4 — Source Optional Trigger

Build only if Phase 5 Mobilization selects partner-led delivery.

Definition of done:

- Source event starts at Strategy or Scope.
- Event is prefilled from approved Phase 2-5 artifact IDs.
- No BAFO/Selection/Transition appears before evidence exists.

## Phase 5 — QA And Pilot Readiness

Definition of done:

- Browser crawl covers login, Setup/Admin, Moves, Source absence/presence,
  artifact open, download behavior, evidence links, approvals, logout, and
  cross-tenant probes.
- Report records prompt/response pairs, status codes, latencies, evidence keys,
  model provider, and issues.
- No P0/P1 tenant leakage or fake-precision findings.
- The hard-question deck must be Meridian/PHS-specific, not Apex-derived:
  Sacramento/30+ hospital profile grounding, CDAO org depth, Epic/ERP/claims
  ingestion, Databricks medallion and Unity Catalog architecture, payer-provider
  KPIs, MLR/Stars/utilization value framing, human-in-the-loop governance, AMS
  vendor posture, AWS lift-and-shift risk, and tenant-leak probes.

## Current Execution Rule

Do not proceed from Phase 0 to runtime implementation until the loader/data
contract map is reviewed. The first PR should be docs and control-plane design
only unless the loader review identifies a small safe schema/test addition.

## Model Policy Update — 2026-06-05

The first OpenAI-only Meridian/PHS 50-question QA capture proved useful as a
canary but was not pilot-grade: the answers were too terse and often missed
explicit source-id citations. That run remains audit evidence, not a model
approval.

Pilot-facing execution now defaults to Claude for rich CXO synthesis. OpenAI can
continue to support offline scoring, comparison, and regression testing, but it
must pass the same 50-question Meridian/PHS quality bar before being promoted to
pilot execution.
