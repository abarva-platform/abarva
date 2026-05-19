# Moves — Deliverable & Business-Case Spec

**Date:** 2026-05-18
**Status:** design spec — for review, including an external second opinion.
**Author:** AI engineering, at founder direction.
**Pairs with:** `ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md`, `MOVES-AGENTIC-SHAPING-METHODOLOGY.md`.

> This document is written to be read cold. Sections 1–3 give the context and the
> "why"; Section 4 is the honest gap analysis; Section 5 is the scope boundary
> (what we deliberately will NOT do); Section 6 is the design; Section 7 is how we
> guarantee it is real; Section 8 lists what a reviewer should pressure-test.

---

## 1. What AbarVa and Moves are

**AbarVa** is a tenant-grounded decision OS for C-suite AI / business bets. It has four
product surfaces:

- **Intelligence** — identify and pressure-test *which* bet to make.
- **Moves** — shape a bet into a governed, executable initiative.
- **Source** — determine the commercial / vendor / partner path.
- **Tower** — track value, risk, adoption and outcomes.

**Moves** takes an AI / transformation initiative from idea to ready-to-execute,
across four phases:

```
Discover  →  Charter  →  Design & Plan  →  Mobilize & Handoff
```

Moves' job is to **shape and recommend** — not to execute. Execution (building the
solution, running the change programme) and outcome-tracking happen downstream of
Moves; realized value is Tower's to track.

---

## 2. Why we are doing this — the core problem

AbarVa's premise is helping a CXO decide **which AI bets to fund and how to shape
them**. A funding decision is, by definition, a **business case**.

Today, Moves produces **structure** — phased plans, a delivery squad, workflow
decompositions, solution-architecture options, a control matrix. It does **not**
produce the **financial-and-evidence spine** that turns structure into a business
case:

- no captured **current-state baseline**;
- no **quantified, falsifiable value hypothesis**;
- no **effort estimate** of any kind — the recommended plan literally contains no
  numbers (verified: the mobilization-plan module has a squad and 30/60/90 horizons,
  but no `effort`, `hours`, `days`, or `cost`);
- no **costed roadmap**;
- no **assembled business case** (investment / return / payback / risk).

**Consequence:** the product cannot today put a costed, time-phased, risk-adjusted
business case in front of a CXO — which is the core thing its name promises. A
"decision OS for which AI bets to fund" that cannot cost the bet has a hole in its
centre.

This gap was identified through founder-led review. It is assessed as the highest-
leverage product gap currently open — ahead of further per-surface feature depth.

---

## 3. The principle the fix must respect

The enhancement must **not** turn Moves into a transformation-consulting platform.
Moves shapes and recommends; it does not execute. Concretely:

> Moves produces the **costed business case and the roadmap**. It does **not** run
> the change programme, design the operating model, or deliver the work. Those are
> execution, owned by the client and their delivery partners; Tower tracks the
> realized result.

Everything below is **recommend + estimate**, never **do**. This boundary is what
keeps the enhancement bounded.

---

## 4. The gaps — by Moves phase (before / after)

| Phase | Before (today) | What is missing — to be added |
|---|---|---|
| **Discover** | Agentic-suitability read; data-readiness read | Current-state **baseline capture** (cost, cycle time, quality, pain); **opportunity sizing**; a **kill-capable go/no-go** |
| **Charter** | A qualitative value hypothesis; archetype decision | A **quantified, falsifiable value hypothesis** + stated assumptions; a **named accountable sponsor**; explicit **stop/kill criteria**; a **business-case skeleton** |
| **Design & Plan** | Solution-architecture options; workflow decomposition; control matrix; mobilization-plan *skeleton* (squad + horizons, no numbers) | The **value-and-effort roadmap** (phased, costed, dependency-mapped, foundational + data-governance + business-change workstreams); the **value forecast curve**; the **assembled costed business case**; a production-readiness gate |
| **Mobilize & Handoff** | Mobilization plan (squad, 30/60/90, backlog) | An **adoption & change approach**; the **value-measurement model + baseline handed to Tower**; named execution owners; a **go-decision pack** |

**The through-line being added** is a single spine running across all four phases:

```
baseline  →  quantified value hypothesis  →  costed business case  →  measurement model wired back to the baseline
```

Each phase today produces *structure* but not its half of that spine.

---

## 5. Scope boundary — what this spec deliberately does NOT do

This is the most important section for a reviewer, because it is where an enhancement
of this kind usually over-reaches.

| We DO | We do NOT |
|---|---|
| Capture the current-state baseline | Re-engineer the current process |
| Estimate the effort to do process redesign / operating-model stand-up / change | **Design** the process redesign or the operating model |
| Surface that business change is required, and gate a phase on it being confronted | Run the change programme |
| Produce a costed roadmap and business case | Execute the roadmap |
| Hand Tower a measurement model | Track realized value (that is Tower) |

Process redesign, operating-model design and change management are genuine
transformation work — stakeholder workshops, months of effort. A software module
that tries to *author* them is a category error. Moves' contribution to those is to
**provoke, capture, gate, and estimate** — not design. The *estimate of the business-
change effort* belongs **inside the business case**; the change *work itself* is
execution.

---

## 6. The design — how the gaps are filled

### 6.1 The phase deliverable model

For every Moves deliverable: what it is, the format it is produced in, what tenant
substrate grounds it, and — critically — whether it can be **genuinely real** when
generated against the Apex demo tenant's actual seeded Move ("Contact Center AI
Routing", phase P3).

| Phase | Deliverable | Format | Grounded in | Real on Apex? |
|---|---|---|---|---|
| Discover | Problem statement | In-app panel (typed view-model) | Apex process + `kpi_dictionary` | Yes |
| Discover | Current-state baseline | Metrics table — metric · value · source · as-of · confidence | `operating_telemetry`, `it_financials` | **Audit** |
| Discover | Opportunity sizing | Value-at-stake range, calculation shown | baseline × pattern band | Depends on baseline |
| Discover | Go / no-go | Recommendation card — verdict · rationale · kill-test | composed | Yes |
| Charter | Value hypothesis | Structured — falsifiable claim · target · assumptions | baseline + value pattern | Depends on baseline |
| Charter | Business-case skeleton | Financial summary block — investment / return / time-to-value ranges | estimator + value forecast | New — build |
| Charter | Stop / kill criteria | Explicit condition list | composed | Yes |
| Design&Plan | Solution-architecture options | 2–3 option cards, scored vs reference architecture | exists (Slice 2.3) | Yes |
| Design&Plan | Workflow decomposition | Node list — task / decision / handoff | exists (Slice 2.2) | Yes |
| Design&Plan | Human+agent RACI / decision rights | Matrix table | composed | New — build |
| Design&Plan | Value-and-effort roadmap | Phased roadmap — phases × workstreams, effort estimate, dependency arrows, value milestones | estimator + rate card + patterns | New — build |
| Design&Plan | Costed business case | Generated pack — in-app **and exportable** (board-pack) | all of the above, assembled | New — build |
| Mobilize | Mobilization plan | 30/60/90 — squad, backlog | exists (Slice 2.4) | Yes |
| Mobilize | Adoption & change approach | Structured approach section | composed + change patterns | New — build |
| Mobilize | Value-measurement model → Tower | Measurement spec — metrics · baseline · cadence | handoff to Tower outcome ledger | New — build |
| Mobilize | Go-decision pack | Decision packet — in-app and exportable | assembles the above | New — build |

Formats in this product are of two kinds: **in-app views** (React rendered from typed
view-models) and **exportable artifacts** (the business case and the go-decision pack
must export as a board-circulation document).

### 6.2 The solution-effort estimator

A single estimator that produces **phased effort estimates across every workstream** —
AI / agent build, integration, data work, **foundational platform** (for greenfield),
**data management / governance**, **process redesign**, **change & adoption**, and run.

- Built on the existing should-cost role-mix engine (Slice 1.3, `RoleMixEntry` /
  `RoleRateCard` / `RoleMixSummary`) so the Moves *solution* estimate and the Source
  *should-cost* estimate share one engine and reconcile.
- **Human / agent-mix aware** — the estimate reflects how much work the agent does vs.
  the human.
- Outputs: effort **by phase**, **by workstream**, and the **AI-build vs. business-
  change split** (so no one mistakes the technology for the whole job).
- All estimates are **ranges / t-shirt sizes with stated assumptions** — labeled
  planning estimates, not commitments.

### 6.3 The rate card

A **researched, three-dimensional benchmark** — not a guessed two-tier table:

1. **SI archetype** — US Tier-1 (Accenture, Deloitte) · India-HQ Tier-1 (TCS, Infosys,
   Wipro) · Big-4 advisory · boutique / specialist. Note: a US Tier-1 carries **its
   own** onshore *and* offshore (Global Delivery Network) rates — "offshore" is not a
   separate firm.
2. **Delivery location** — onshore · nearshore · offshore (the firm's own GDN).
3. **Work specialization** — strategy / advisory · solution architecture · AI/ML
   engineering · data engineering · integration · process redesign · change
   management · program management · run / AMS. Each commands a different rate.

The rate card requires **genuine market research** to populate (it is a research
deliverable in its own right), is labeled "benchmark, not a quote," is refreshed
periodically, and is **client-overridable** — the client uploads their own rates via
a structured template (`role · specialization · delivery location · seniority ·
rate · currency`). The estimator works day-one on the benchmark and is sharpened by
the client's actual card.

### 6.4 Seed patterns

Per use-case archetype (automation / assistant / human-in-loop agent / full agentic
workflow), encoded **expert-prior patterns** that give the new capabilities sensible
defaults before any real outcome data exists:

- typical **value-realization curve** (when value lands across phases);
- typical **AI-build vs. business-change effort split**;
- typical **foundational-capability dependency shape** (what must exist first);
- typical **baseline metrics** to capture for that use-case type.

These start as encoded expert priors and are **later sharpened by real outcomes** via
the outcome→pattern feedback already shipped (Slice 3.6) — i.e. they are the on-ramp
to the cross-tenant pattern moat.

### 6.5 The costed business case — the assembly artifact

The business case is **not new analysis**. It is an **assembly** of:

```
baseline  +  solution-effort estimate  +  run cost  +  business-change effort
          +  value forecast  +  time-to-value (the roadmap)  +  risk / confidence
          →  investment · return · payback · sensitivity · fund / shape / kill recommendation
```

It is produced as a **generated pack** — viewable in-app and **exportable as a board-
circulation document**. It spans Charter (the skeleton) → Design & Plan (the full
case), and it hands its measurement model to Tower.

### 6.6 The baseline-and-measurement spine

- **Discover** captures the baseline (value cannot be proven later without a "before").
- **Charter** sets the falsifiable value hypothesis *against* that baseline.
- **Design & Plan** builds the value forecast curve and the costed case.
- **Mobilize** hands Tower the measurement model **wired to the same baseline**, so
  realized value can be compared to forecast.

This is the loop that makes value provable rather than asserted.

---

## 7. How we guarantee it is real — the Apex validation discipline

The recurring failure mode this enhancement must avoid is *structure without
substance* (a plan with no numbers, a deliverable that is a template). The discipline:

1. **Apex-realness audit, run first.** Before building, query Apex's actual seeded
   substrate and confirm, per deliverable, what data genuinely exists. Every "Audit"
   row in §6.1 gets a definitive *Yes* or *seed-gap* verdict **up front**.
2. **No-fabrication rule, enforced.** Where Apex lacks the data, the deliverable shows
   an honest "not recorded / seed gap" — never invented numbers. (The same discipline
   already enforced in the shipped board-pack and evidence-trace drawer.)
3. **Definition of done, per deliverable.** A deliverable is not "shipped" until it
   has been generated against Apex's **real** "Contact Center AI Routing" Move and
   visually verified grounded — not a lorem-ipsum stub.
4. **Seed gaps become explicit tasks.** Where the audit finds a genuine gap, either
   Apex is seeded properly or the deliverable honestly shows the gap. No pretending.

---

## 8. What a reviewer should pressure-test (open questions)

An honest second opinion should challenge these:

1. **Phase model.** Is Discover → Charter → Design & Plan → Mobilize the right
   structure, or do phases belong elsewhere?
2. **The scope boundary (§5).** Is "estimate the business-change effort but do not
   design the redesign" the right line? Is it stable, or will it erode in practice?
3. **The rate card.** Can a benchmark rate card be credible enough to anchor an
   estimate — or is effort estimation only meaningful once the client supplies real
   data? How much does a wrong benchmark mislead?
4. **The value forecast — the hardest one.** How does the product forecast value
   *honestly* without becoming a vendor's optimism engine? What stops the value
   hypothesis from being a number the user wanted to see?
5. **The business case as a software artifact.** Is a costed business case generated
   by software believable to a CFO — or does it always need a human consultant's
   judgement on top? If the latter, what is the product's honest role?
6. **Seed patterns.** Is shipping expert-prior patterns (before real outcome data
   exists) sound, or does it bake in assumptions that look like data?
7. **Estimator accuracy expectations.** Planning-grade ranges are honest — but will
   users treat them as commitments regardless? How is that managed?

---

## 9. Build sequencing

1. Apex-realness audit + this spec locked (after review).
2. The rate-card research + the solution-effort estimator.
3. Discover: baseline capture + opportunity sizing; Charter: value hypothesis +
   business-case skeleton + kill criteria.
4. Design & Plan: the value-and-effort roadmap + the assembled costed business case +
   the RACI / decision-rights matrix.
5. Mobilize: adoption & change approach + the value-measurement handoff to Tower +
   go-decision pack.
6. Seed patterns throughout, feeding defaults.

Each deliverable is gated on its §7 "real on Apex" check.

---

## 10. Definition of done

The enhancement succeeds when, for Apex's real "Contact Center AI Routing" Move,
Moves produces a **costed, time-phased, risk-adjusted business case grounded in
Apex's actual substrate** — and an informed reviewer agrees it is a business case a
CFO would accept.
