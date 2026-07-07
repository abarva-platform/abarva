# PHS-Inspired Population Health Command Center Design Package

**Status:** draft docs only
**Created:** 2026-06-05
**Lane:** PHS / Meridian execution lane
**Scope:** Moves design package for a Meridian Health synthetic demo inspired by public Presbyterian Healthcare Services context

This package defines the draft design contract for a Meridian Health demo named:

**Meridian Health - AI-Enabled Population Health and Clinical Performance Command Center**

The demo should show AbarVa helping an integrated payer-provider make a governed AI strategy, architecture, and business-case decision for population health performance on Azure Databricks. It must not imply access to confidential Presbyterian Healthcare Services data, and it must not show later-stage execution or realized value unless the evidence, artifacts, gates, approvals, and storage paths are materialized as auditable synthetic demo objects.

## Source Inputs

These docs were drafted from the main repo source packet:

| Source | How it is used |
|---|---|
| `docs/build/meridian-phs-demo/PHS_AI_STRATEGY_DEMO_PLAN_2026-06-05.md` | Primary demo strategy, stage alignment, evidence model, artifact list, and responsible AI pattern. |
| `docs/build/meridian-phs-demo/PHS_AI_STRATEGY_PROMPT_SOURCE_2026-06-05.md` | Canonical generation posture, evidence keys, non-negotiables, required demo objects, and artifact prompt template. |

## Reading Order

| # | File | Purpose | Audience |
|---|---|---|---|
| 1 | [01-phs-market-research-brief.md](./01-phs-market-research-brief.md) | Public-evidence brief and demo narrative guardrails. | Product, design, demo authoring, QA. |
| 3 | [03-artifact-contracts.md](./03-artifact-contracts.md) | Artifact-by-artifact contracts for Moves, Setup/Admin, Value, and optional Source use. | Codex, design module, loader/materializer agents. |

The `02` slot is intentionally left open for a future visual or IA spec. Agent C was scoped to draft only `README.md`, `01-phs-market-research-brief.md`, and `03-artifact-contracts.md`.

## Demo Northstar

**Question:** How should an integrated New Mexico payer-provider use Azure Databricks, governed AI, and human-led operating routines to improve Stars, chronic disease outcomes, care-gap closure, avoidable utilization, and margin performance?

Recommended first demo posture:

| Surface | Visible posture | Rationale |
|---|---|---|
| Moves | Phase 3 - Architecture and Business Case Review | Credible stage for strategy, evidence, architecture options, value model, and human approval without pretending implementation is done. |
| Setup/Admin | Evidence loader and artifact materialization cockpit | Public facts, synthetic current-state rows, rate cards, workload inventory, gates, and approval records must exist before the demo relies on them. |
| Value | Baseline and forecast only | Forecast value can be modeled; realized outcomes should not be shown without clearly labeled future-state synthetic evidence. |
| Source | Optional follow-on at Strategy or Scope | Use only if the storyline includes procurement of a Databricks SI, managed services, analytics SI, or implementation partner. |

Do not show BAFO, Selection, Transition, or Value Realization until prior phases are persisted, parseable, evidence-linked, and approved or waived by a named human.

## Evidence Posture

The package uses three evidence classes:

| Class | Meaning | UX implication |
|---|---|---|
| Public PHS evidence | Public Presbyterian Healthcare Services or market evidence loaded with citation keys such as `PHS-PUBLIC-001`. | Can ground demo context, but must not be presented as confidential client data. |
| Synthetic Meridian evidence | Demo-specific current-state inventory, quality baseline, rate cards, approvals, and artifacts. | Must be loader-backed before used as inspectable proof. |
| Generated recommendation | Live AbarVa output drafted from approved evidence. | Must show citations, assumptions, missing evidence, and required human approval. |

## Non-Negotiables

1. Use OpenAI-only generation paths when this package becomes executable.
2. Do not fabricate confidential PHS data.
3. Distinguish public evidence, synthetic internal demo evidence, and generated recommendations.
4. Cite evidence keys for every material claim.
5. Do not invent realized outcomes.
6. Use Setup/Admin loader-backed evidence and artifacts, not inline placeholders.
7. Require named human approval before any generated artifact becomes externally usable.
8. If evidence is missing, display the evidence request instead of filling the gap with confident language.

## Build Boundary For This Draft

This package is documentation only. It does not add or change:

- Runtime code.
- Loader code.
- Tests.
- Database migrations.
- Release records.

## Open Proof Items

These items are intentionally not claimed as done in this package:

| Item | Status |
|---|---|
| Public PHS evidence loaded with citation keys | TODO: needs Setup/Admin loader proof. |
| Synthetic Meridian workload inventory | TODO: needs loader-backed rows and storage path. |
| Synthetic data quality baseline | TODO: needs loader-backed rows and approval owner. |
| Rate card and estimation model | TODO: needs loader-backed source rows and effective dates. |
| Databricks pattern pack | TODO: needs approved pack ID or storage path. |
| Gate criteria and approval records | TODO: needs persisted records and named synthetic approvers. |
| Live OpenAI generation harness | TODO: out of scope for this docs-only package. |
| Browser QA crawl | TODO: requires runtime artifact surfaces after materialization. |
