# Moves — Deliverable, Business-Case & Expert-Kernel Spec

**Date:** 2026-05-18
**Status:** design spec — v2, incorporates an external second-opinion review.
**Author:** AI engineering, at founder direction.
**Pairs with:** `ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md`, `MOVES-AGENTIC-SHAPING-METHODOLOGY.md`.

> **What changed in v2.** v1 specified the *outputs* — deliverables, formats,
> grounding. A reviewer's verdict: that under-specifies the *expert mind* that
> produces them. Without a reasoning layer underneath, the agent "sounds smart but
> behaves like a document generator." v2 adds that layer — the **Moves Expert
> Kernel** — as the foundation the deliverables sit on, and reverses the build
> order: kernel first, UI later.

---

## 1. What AbarVa and Moves are

**AbarVa** — a tenant-grounded decision OS for C-suite AI / business bets. Four
surfaces: **Intelligence** (which bet), **Moves** (shape it), **Source** (commercial
path), **Tower** (track outcomes). **Moves** takes an initiative from idea to
ready-to-execute across four phases: **Discover → Charter → Design & Plan → Mobilize
& Handoff.** Moves *shapes and recommends*; it does not execute.

## 2. Why we are doing this — the core problem

AbarVa's premise is helping a CXO decide *which AI bets to fund and how to shape
them*. A funding decision is a **business case**. Today Moves produces **structure**
(phased plans, a squad, decompositions, architecture options) but not the
**financial-and-evidence spine**: no captured baseline, no quantified value
hypothesis, no effort estimate (the recommended plan literally has no numbers), no
costed roadmap, no assembled business case. So the product cannot put a costed,
risk-adjusted business case in front of a CXO — the core thing its name promises.

## 3. The deeper finding — the missing layer is reasoning, not deliverables

A second-opinion review accepted v1's direction but identified the real gap: v1
named the right deliverables and under-specified the **expert reasoning** behind
them. "Generated" is not a quality bar. The agent must not invent a business case
from prose — it must **orchestrate deterministic expert modules** and **challenge
itself** before answering.

So the foundation, built **before** any business-case UI, is the **Moves Expert
Kernel** (§5). The deliverables (§8) become *what the kernel produces*.

## 4. Scope boundary — what this does NOT do

| We DO | We do NOT |
|---|---|
| Capture the baseline; estimate change effort seriously | **Design** the process redesign or operating model |
| Surface, gate and estimate the business-change work | Run the change programme |
| Produce a costed roadmap + business case + recommendation | Execute the roadmap |
| Hand Tower a measurement model | Track realized value (Tower's job) |

Moves *provokes, captures, gates, estimates, and recommends.* It never executes.

---

## 5. The Moves Expert Kernel

A set of domain modules under Moves. The agent is the **interface over the kernel** —
it orchestrates these modules; it does not free-form the answer.

| Module | Responsibility |
|---|---|
| **`phase-playbooks`** | Per phase (Discover / Charter / Design & Plan / Mobilize): the canonical **expert question tree** (diagnostic path), the **required evidence**, the **phase traps**, and the **kill triggers**. *Example — Discover for contact-centre AI:* call volume, handle time, containment, transfer rate, QA error rate, labour cost, channel mix, current tooling, bot-deflection history, workforce/union constraints, compliance exposure. |
| **`baseline-model`** | Current-state metrics with **source, source quality, as-of date, confidence**; honest "not recorded" where data is absent. |
| **`assumption-ledger`** | Every estimate's assumptions made explicit: **statement · owner · confidence · source · sensitivity impact**. A business case lives or dies on its assumptions; they must be first-class, not buried. |
| **`effort-estimator`** | Workstreams (AI build, integration, data, foundational platform, data governance, **process redesign, change & adoption**, run) → role-mix effort, **range logic** (base/conservative/upside), human/agent split. Built on the existing should-cost role-mix engine (Slice 1.3) so Moves and Source estimates reconcile. |
| **`value-forecast`** | An **adoption-adjusted** value curve — never raw optimism. Applies a **value-haircut model**: discount factors for adoption risk, data readiness, process dependency, integration complexity, control burden, sponsor strength. |
| **`business-case-compiler`** | Assembles baseline + effort + run cost + change effort + value forecast + roadmap + risk → **investment · return · payback · sensitivity · fund/shape/kill recommendation**. |
| **`critic`** | The **self-challenge loop** (§6). |
| **`qa-rubric`** | Deterministic **pass/fail validation** per deliverable (§7). |

Modules are **deterministic** where they can be (calculators, rubrics) — not prose.

### 5.1 CFO-grade sensitivity (inside `business-case-compiler`)

A single ROI is not a business case. Every case carries: **base / conservative /
upside**, an explicit **"what breaks the case"**, and **"which 3 assumptions move
80% of the outcome."**

### 5.2 Named kill logic (inside `phase-playbooks` + `business-case-compiler`)

The agent must be willing to say **"do not fund this yet"** — with the reason and the
**fix-condition** ("revisit when X is true"). Trust comes from the product's
willingness to say no.

### 5.3 Business-change effort (inside `effort-estimator`)

Moves does not *design* the operating model — but it must estimate the change effort
**seriously**: impacted roles, process variance, training load, incentive change,
manager adoption, communications, hypercare. Not a thin line item.

### 5.4 Rate-card discipline (inside `effort-estimator`)

Benchmark rates are **planning ranges**, labelled as such in the UI, always
overridable by a client-specific rate card. A 3-D researched benchmark — SI archetype
× delivery location × work specialization (see v1 §6.3) — never presented as a quote.

---

## 6. The critique loop (`critic`)

Before any deliverable is finalized, the `critic` module challenges it:

- **CFO challenge** — "what would a CFO attack? where is the optimism?"
- **Delivery challenge** — "what would a delivery partner say is underestimated?"
- **Data challenge** — "what evidence is missing? what assumption drives 80% of the
  case, and how solid is it?"

The agent's answer is not finalized until it has survived — or visibly absorbed — the
critique. The critique's findings are surfaced to the user, not hidden.

## 7. The validation harness

Per the reviewer — "generated" is not a quality bar:

- **Golden cases** — known-good inputs → expected business-case shape.
- **Adversarial cases** — thin-data, contradictory-data, optimism-trap inputs that
  the kernel must handle honestly (haircut, "not enough data", or a kill).
- **CFO review rubric** — a deterministic pass/fail checklist a CFO would apply.
- **Sourcing / implementation-expert review** — is the effort estimate credible.
- **Post-outcome calibration** — once Tower has actuals, compare forecast vs. realized
  and tune the kernel's haircut factors. This is the calibration flywheel.

## 8. The deliverable model — what the kernel produces

| Phase | Deliverable | Format | Real on Apex? |
|---|---|---|---|
| Discover | Problem statement · current-state baseline · opportunity sizing · go/no-go | In-app panels; baseline as a metrics table | baseline = **audit** |
| Charter | Quantified value hypothesis · business-case **skeleton** · stop/kill criteria | Structured + financial summary block | new — build |
| Design & Plan | Solution architecture · workflow decomposition · human+agent RACI · **value-and-effort roadmap** · **costed business case** | Roadmap view; business case = generated pack, in-app + **exportable** | new — build |
| Mobilize | Mobilization plan · adoption & change approach · value-measurement model → Tower · go-decision pack | Plan + measurement spec + exportable packet | new — build |

Every deliverable carries a **typed contract**: required inputs, the calculation, the
confidence, the named assumptions, the cited evidence, the red flags, and an explicit
**"not enough data" behavior** — and must pass its `qa-rubric`.

## 9. The product behavior standard

When a CXO asks *"Should we fund Contact Center AI Routing?"* the agent does not just
answer. It produces:

1. **Here is the answer.**
2. **Here is the business case.**
3. **Here are the 5 assumptions driving it.**
4. **Here is what would make me wrong.**
5. **Here is what I would not fund until fixed.**
6. **Here is what Tower will measure later.**
7. **Here is the evidence I used — and what is missing.**

That is the bar.

## 10. The Apex-realness discipline

1. **Apex-realness audit, run first** — query Apex's seeded substrate; every "audit"
   row gets a definitive *yes* / *seed-gap* verdict before building.
2. **No fabrication** — missing data shows "not recorded / seed gap", never invented.
3. **Definition of done** — a deliverable is shipped only after it is generated
   against Apex's **real** "Contact Center AI Routing" Move and verified grounded.
4. Seed gaps become explicit seed tasks.

## 11. Build sequencing — kernel first, UI later

Per the reviewer: **do not start with the business-case UI.** Start with the kernel
and the Apex-realness audit.

1. **Apex-realness audit** + this spec locked.
2. **First build slice — prove the kernel on one real case.** For Apex "Contact
   Center AI Routing", produce a **CFO-readable business-case skeleton** with:
   baseline facts (or explicit seed gaps) · value range · cost/effort range · named
   assumptions · sensitivity (base/conservative/upside) · kill criteria ·
   recommendation · Tower measurement handoff. The minimal kernel modules
   (`baseline-model`, `effort-estimator`, `value-forecast`, `assumption-ledger`,
   `business-case-compiler`, `critic`, `qa-rubric`) — at skeleton depth.
3. **If the skeleton works** — expand phase by phase (full Discover playbook, full
   Design & Plan roadmap, Mobilize handoff, UI). **If it does not** — stop; more
   deliverables would only produce prettier templates.

## 12. What a reviewer should still pressure-test

1. Is the kernel's module decomposition right — 8 modules, these boundaries?
2. The **value-haircut model** — are adoption / data-readiness / process-dependency /
   integration / control / sponsor the right discount factors, and how are they
   weighted without becoming arbitrary?
3. Can a software-generated business case be CFO-credible, or does it always need a
   human's judgement on top — and if so, what is the product's honest role?
4. Post-outcome calibration needs Tower actuals — which need real customers. Until
   then the kernel runs on expert priors. Is that honestly labelled?
5. Does the `critic` loop genuinely change answers, or rationalize them?

## 13. Definition of done

For Apex's real "Contact Center AI Routing" Move, Moves produces — via the kernel — a
costed, risk-adjusted, assumption-explicit business case that survives the `critic`
loop and passes the CFO rubric, and an informed reviewer agrees it is a business case
a CFO would accept.
