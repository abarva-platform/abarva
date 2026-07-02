# Source Deterministic Sourcing Analytics Contract

## Purpose

Source needs its own deterministic analytics layer so the product does not become generic document Q&A with nicer formatting. The sourcing advisor can use Claude/aVa for judgment and executive language, but AbarVa must own the commercial math, evidence boundary, scoring, exposure calculation, confidence, and missing-data rules.

The operating split is:

| Layer | Responsibility |
|---|---|
| AbarVa Source analytics | Calculates exposure, leakage, risk, completeness, scoring, ranking, BAFO impact, evidence gaps, and confidence. |
| Claude / aVa | Explains the result, frames the tradeoff, and writes the executive narrative from the deterministic payload. |
| React / export renderers | Render premium sourcing exhibits, board-pack visuals, tables, charts, and decision artifacts. |

## Product Boundary

Source is not a broad contract browser and not "chat with documents." Extracted data must support a Source decision, gate, artifact, exhibit, or sourcing action.

In scope:

- Strategy
- Scope
- RFP
- Responses
- Evaluation
- Pricing
- BAFO
- Executive Decision
- Contract Optimization
- Transition
- Evidence trail

Out of scope for this layer:

- Arbitrary document Q&A
- Generic contract browsing
- Messy 100-page proposal parsing
- Claude-owned score calculation
- Heavy visualization library changes
- Retrieval restructuring

## Evidence Modes

Every analytic output carries a readiness boundary.

| Mode | Meaning | Allowed output |
|---|---|---|
| `evidence_rich` | Required sourcing evidence is present. | Quantified exposure, weighted scoring, BAFO levers, high-confidence recommendations. |
| `evidence_partial` | Some required evidence is missing. | Preliminary findings, directional exposure, assumptions, missing-evidence list, conditional recommendation. |
| `evidence_light` | Only baseline evidence exists. | Contract baseline, likely risk areas, readiness score, data request pack, no quantified exposure. |

## Required Evidence Sets

Contract optimization requires:

- contract / MSA
- statement of work
- pricing schedule / rate card
- invoice history
- SLA reports
- ticket history
- staffing model
- change-order / amendment history
- renewal notice / expiration dates

Vendor response evaluation requires:

- sectioned vendor response narrative
- vendor claim register
- pricing workbook
- staffing and location model
- SLA commitment table
- assumptions / exclusions log
- commercial exceptions table
- transition plan

## Modules

The analytics layer lives under `src/lib/source/analytics/`.

| Module | Responsibility |
|---|---|
| `types.ts` | Shared evidence, readiness, finding, scoring, BAFO, and story payload contracts. |
| `evidence-readiness.ts` | Evidence completeness, missing evidence, proof boundary score, data request pack, evidence mode. |
| `contract-optimization.ts` | Invoice leakage, change-order leakage, staffing variance, SLA weakness, operational pressure, renewal urgency, exposure range. |
| `vendor-response.ts` | MVE response completeness, unsupported claims, pricing comparability, transition readiness, SLA strength, staffing risk. |
| `evaluation-scorecard.ts` | Weighted score, risk-adjusted score, post-BAFO score, vendor ranking, readiness, tradeoff summaries. |
| `bafo-leverage.ts` | Negotiation levers, value-at-stake, score impact, cure conditions, BAFO scenario table. |
| `executive-story.ts` | Deterministic executive story payload for aVa, renderers, and board-pack artifacts. |
| `fixtures.ts` | Deterministic SkyHarbor fixtures for rich, partial, light, vendor evaluation, and BAFO cases. |

## Executive Exhibits Supported

The analytics payload supports:

- Commercial Opportunity Map
- Exposure Driver View
- Vendor Comparison Matrix
- Weighted Scorecard
- BAFO Scenario Table
- Do-Nothing Scenario
- Renewal Timeline
- Evidence Gap Map
- Negotiation Leverage Map
- Business Impact Map

These exhibits are decision exhibits, not decorative charts.

## No-Overclaim Rule

When evidence is complete, Source can quantify.

When evidence is partial, Source must qualify the answer, show assumptions, and produce a data request pack.

When evidence is missing, Source must not quantify exposure. It should say what cannot be quantified and what evidence is required.

## Current Slice Boundary

This slice is library, fixtures, tests, and documentation only. It does not change live UI behavior and does not deploy. Runtime wiring should be a later slice that feeds these deterministic payloads into Source panels, aVa packets, and exported artifacts.
