# Meridian PHS Demo Readiness Plan

**Status:** active execution plan.  
**Date:** 2026-08-28.  
**Primary tenant:** `meridian-health`.  
**Release lanes:** `global-control-lane` for proof/routing contracts; `client-data-lane` for Meridian ECL data/readback; `public-demo` only for demo-facing artifacts.

This plan supersedes airline end-to-end demo work for the current sprint. SkyHarbor ECL data can
remain loaded and route-smokeable, but airline-specific findings/eval are intentionally deferred
because there is no active airline client demo lined up.

The Meridian/PHS priority is split into two demo tracks:

1. **PHS Executive Demo:** Home, Moves, Intelligence and Tower as one operating story.
2. **Source Sourcing-CXO Demo:** Source 360, commercial leverage, event workspace and sourcing
   opportunities as a separate buyer conversation.

No demo track may claim readiness from HTTP 200, CI success, or a deploy log alone. Readiness
requires the relevant route/browser proof and every visible metric must reconcile to the new ECL
source-room truth or be labeled as a gap/refusal.

---

## Current Truth

| Area | Current state | Demo implication |
|---|---|---|
| Meridian ECL source/context/commercial/review/projection/cube layers | Built, loaded and previously read back for the ECL clean-break program. | Suitable as the deterministic substrate for Home, Tower, Source and Intelligence. |
| Home | In the ECL 40-surface proof denominator. | Use for enterprise context, architecture, data flow, loaded record and performance/value narrative. |
| Tower | In the ECL 40-surface proof denominator. Tower value-chain and trajectory rows were recently repaired and live-proofed. | Use for executive control tower, value gates, evidence queue, AI portfolio and decision lanes. |
| Intelligence | In the ECL 40-surface proof denominator and has a Meridian aVa baseline/ablation eval. | Use for expert reasoning against ECL context, with refusal on unsupported claims. |
| Source | In the ECL 40-surface proof denominator. | Treat as a separate sourcing-CXO demo, not part of the PHS executive walkthrough unless explicitly needed. |
| Moves | Not included in the ECL 40-surface proof denominator. Existing generated Meridian Moves content is planning-grade and July-era. | Must get its own PHS proof lane before the executive demo can be called complete. |
| SkyHarbor | ECL substrate load/readback and route availability are not the same as demo readiness. | Airline E2E findings/eval are deferred. Do not spend current sprint budget here. |

---

## Demo Track A - PHS Executive Demo

**Goal:** a CXO can move from enterprise context to initiative selection to expert reasoning to
Tower controls without seeing builder vocabulary, stale substrate, or unsupported value claims.

| Gate | Module | Done When | Current |
|---|---|---|---|
| PHS-A1 | Home | 16 Home surfaces render from ECL, show Meridian counts, and preserve refusal/gap behavior. | Covered by ECL proof denominator; attach latest live artifact for current digest before demo. |
| PHS-A2 | Tower | 9 Tower surfaces render from ECL, value-chain rows reconcile to source measures, gated claims name evidence needed, and trajectory has real periods. | Covered by ECL proof denominator; trajectory repair live-proofed. Needs CXO polish sweep. |
| PHS-A3 | Intelligence | 6 Intelligence surfaces render from ECL, citations resolve, unsupported prompts refuse, and aVa baseline/ablation remains separated. | Covered by ECL proof denominator; rerun after final demo deploy. |
| PHS-A4 | Moves | Moves index, detail, phase workspace, evidence, trace and generated artifact paths render for Meridian and use current ECL/program source truth where they quote enterprise context. | Not in ECL denominator. Needs explicit enumeration and browser proof. |
| PHS-A5 | Cross-module handoff | Moves can name what Tower must measure, Tower can name what evidence blocks a claim, Intelligence can reason over the same context, and Source handoff is explicit when vendor/commercial evidence is needed. | Not yet a single proof. Build after Moves enumeration. |

### PHS Executive Demo Surface Denominator

The existing ECL denominator remains 40 surfaces: Home 16, Source 9, Tower 9, Intelligence 6.
For the PHS executive demo, use this separate denominator:

| Product | Surface count | Source of truth |
|---|---:|---|
| Home | 16 | `serving.home_*` |
| Tower | 9 | `serving.tower_*` |
| Intelligence | 6 | `serving.intelligence_*` |
| Moves | 6 minimum | To be enumerated from live `/strategic-moves` and `/programs` routes |

The PHS executive demo is not complete until the Moves denominator is enumerated and proven.

### Moves Proof Slice

First slice for this track:

1. Enumerate the Moves routes used in the PHS story.
2. State the data source for each visible number or claim: ECL, program operational row, generated
   deliverable, evidence ledger, or gap/refusal.
3. Replace stale planning-grade copy only where it appears on the demo route.
4. Add a browser proof that the selected Meridian Moves routes render and do not contradict Home,
   Tower or Intelligence.
5. Record proof output beside the ECL proof artifacts, but do not fold Moves into the 40-surface
   ECL denominator unless the serving contract is amended.

---

## Demo Track B - Source Sourcing-CXO Demo

**Goal:** a sourcing executive can inspect vendor concentration, contract leverage, renewal risk,
scope, evidence, value levers and sourcing events without seeing fabricated precision.

| Gate | Done When | Current |
|---|---|---|
| SRC-B1 | 9 Source serving surfaces render from ECL on default routes. | Covered by ECL proof denominator. |
| SRC-B2 | Contract 360 and Vendor 360 reconcile every headline count and dollar to ECL source-room truth. | Needs current signed-in crawl and source-to-screen spot checks before demo. |
| SRC-B3 | Leverage/protection findings render with basis: contract register, document extraction, AP invoice, SLA observation, benchmark, or explicit gap. | Covered by Meridian F1-F3/F9/F10 class assertions; still needs sourcing-CXO visual/readability sweep. |
| SRC-B4 | Event workspace and sourcing opportunities show gated next actions rather than completed value where evidence is absent. | Built in ECL; needs current browser proof and CXO copy review. |

Source can be demoed independently from PHS Executive Demo. Do not let Source readiness mask a
Moves gap, and do not let a Moves gap block the Source sourcing-CXO demo.

---

## Required Status Format

Every status update for this sprint must report these four numbers separately:

| Metric | Report As |
|---|---|
| PHS executive ECL surfaces | `Home/Tower/Intelligence: N of 31` |
| PHS Moves surfaces | `Moves: N of M, M enumerated? yes/no` |
| PHS cross-module handoffs | `Handoffs: N of 4` |
| Source sourcing-CXO surfaces | `Source: N of 9` |

Do not report one aggregate percent without these denominators.

---

## Proof Rules

- Every metric on a product page reconciles to the new ECL source-room truth, or the page labels it
  as `unknown`, `gap`, `unverified`, `model_inferred`, or `refused`.
- A value can be displayed as claimable only when its measure, metric definition, source basis and
  review state allow it.
- aVa answers must be judged against baseline and ablation. If the evidence-withheld answer still
  passes, the eval is measuring phrasing rather than grounding.
- Browser proof must be signed in when the route is Clerk-protected.
- SkyHarbor airline-specific demo proof is deferred by design for this sprint.

---

## Immediate Backlog

| Order | Slice | Output |
|---:|---|---|
| 1 | PHS Moves route/source audit | Table of PHS Moves routes, visible claims, data source, and readiness issue per route. |
| 2 | PHS demo status writer | Machine-readable status that separates Home/Tower/Intelligence, Moves, handoffs and Source. |
| 3 | Moves demo proof harness | Browser proof for the selected Meridian Moves routes. |
| 4 | Cross-module handoff proof | One deterministic proof tying Moves evidence needs to Tower gates and Intelligence context. |
| 5 | Source sourcing-CXO proof refresh | Current signed-in proof for Source 9/9 plus contract/vendor visual quality findings. |
| 6 | Final demo deploy/proof | ACA deploy through repo-owned workflow only, then signed-in proof for both tracks. |
