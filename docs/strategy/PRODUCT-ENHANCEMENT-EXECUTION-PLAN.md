# AbarVa Product Enhancement Execution Plan

**Date:** 2026-05-16
**Purpose:** Convert the product enhancement thesis into incremental, PR-sized execution cycles with explicit expert value, dependencies, QA, and validation gates.
**Operating principle:** Do not add surfaces for the sake of breadth. Every enhancement must make AbarVa behave more like an expert sourcing advisor, transformation partner, solution architect, portfolio operator, or enterprise context steward.

Pairs with `SOURCE-SOURCING-METHODOLOGY.md` and `MOVES-AGENTIC-SHAPING-METHODOLOGY.md` — the encoded expert backbones the Wave 0–2 slices build on.

---

## 1. North-Star Product Loop

AbarVa should not feel like four modules. It should feel like one closed-loop operating system:

```text
Context Layer
  -> Intelligence identifies and pressure-tests the right bet
  -> Moves shapes it into a governed initiative
  -> Source determines the right commercial / partner / vendor path
  -> Tower tracks value, risk, adoption, dependencies, and outcomes
  -> Outcome evidence feeds the context layer and pattern graph
```

The enhancement plan should deepen this loop. If a feature does not improve one of these transitions, it is probably secondary.

---

## 2. Expert Value Standard

Before starting any PR, answer these questions:

1. **Which expert would this emulate?** IT sourcing advisor, enterprise architect, transformation partner, AI product leader, CFO portfolio operator, security/governance lead.
2. **What judgment does the expert add?** Should-cost, scope decomposition, build/buy/partner decision, vendor risk, mobilization plan, adoption risk, value leakage, control gap.
3. **What evidence does the expert need?** Tenant context, org, systems, vendors, contracts, KPIs, source artifacts, policies, programs, telemetry.
4. **What should the product produce?** Recommendation, artifact, decision packet, scorecard, exception, workflow step, or audit event.
5. **How do we prove it works?** Unit tests, behavior tests, golden Q&A, visual smoke, tenant-specific demo script, source-to-tower trace.

No feature starts without this mapping.

---

## 3. Execution Waves

### Wave 0 — Product Contracts and Evaluation Harness

**Goal:** Define the expert playbook contracts before changing UX. This prevents feature sprawl.

| Slice | PR Scope | Parallel? | QA / Validation | Exit Criteria |
|---|---|---:|---|---|
| 0.1 Source expert taxonomy | Add docs + typed contracts for sourcing categories: AMS, data/AI platform, AI engineering partner, SaaS renewal, cloud/FinOps, BPO/contact center, cyber/GRC, staff aug vs managed service. | Yes | Type-only tests if contracts added; doc review against Source examples. | Each category has decision questions, evidence inputs, output artifacts, and anti-patterns. |
| 0.2 Moves solution-shaping taxonomy | Define solution archetypes: automation, assistant, retrieval/copilot, human-in-loop agent, full agentic workflow, data remediation, vendor-led implementation, process redesign. | Yes | Behavior-test prompt fixtures; no UI required. | Nexus can classify a proposed Move into an archetype with reasons and readiness gaps. |
| 0.3 Tower outcome taxonomy | Define projected/tracked/verified value, adoption, spend at risk, renewal risk, dependency risk, and executive-action triggers. | Yes | Unit tests for taxonomy builders. | Tower can explain why a metric matters and which executive action it implies. |
| 0.4 End-to-end scenario scripts | Write 3 demo scripts: Apex retail workforce/contact-center, Meridian population health/ambient clinical, First Capital model-risk/FedNow. | Yes | Script review; later used by Playwright/manual QA. | Each scenario shows Context -> Intelligence -> Move -> Source -> Tower -> Outcome. |

**Why Wave 0 first:** It gives Source/Moves/Tower shared language. Without it, each module invents its own expert model.

### Wave 1 — Source as Expert IT Sourcing Advisor

**Goal:** Make Source visibly smarter than an RFP tracker.

| Slice | PR Scope | Dependencies | Parallel? | QA / Validation | Expert Value |
|---|---|---|---:|---|---|
| 1.1 Source category strategy classifier | Map a sourcing event to category, buying motion, risk profile, and evidence gaps. | 0.1 | Yes | Unit tests across 7 categories; Source chat behavior test. | Prevents the wrong sourcing motion before RFP starts. |
| 1.2 Build / buy / partner / SI decision gate | Structured gate that forces delivery-model choice before RFP package generation. | 1.1 | Yes after 1.1 | Behavior test with Apex CDP, Meridian ambient, First Capital model-risk examples. | Stops premature vendor selection and over-scoped SI packages. |
| 1.3 Should-cost and role-mix model v1 | Estimator: role mix, on/offshore split, duration, cloud/model costs, transition cost, vendor margin. | 0.1 | Yes | Deterministic unit tests; no tenant data required. | Gives sourcing expert economics, not generic vendor comparison. |
| 1.4 Proposal normalization matrix | Normalize vendor responses: scope exceptions, assumptions, rates, accelerators, IP, security, transition, SLAs/XLAs. | 1.1 | Yes | Parser/transformer tests; Source event fixture. | Makes apples-to-apples comparison possible. |
| 1.5 Negotiation posture generator | Top 5 negotiation levers, walk-away risks, concessions, incumbent leverage, clause issues. | 1.3, 1.4 | No | Golden answer tests; manual Source scenario QA. | Turns sourcing artifacts into executive commercial advice. |
| 1.6 Source-to-Move handoff | Link a Source event back to a Move with sourcing recommendation, cost/risk deltas, mobilization assumptions. | 1.2, 1.5 | No | Integration test; UI smoke; trace appears in Move and Source. | Closes the gap between sourcing and transformation execution. |

### Wave 2 — Moves as Agentic Solution and Mobilization Architect

**Goal:** Make Moves shape solutions, not only track lifecycle state.

| Slice | PR Scope | Dependencies | Parallel? | QA / Validation | Expert Value |
|---|---|---|---:|---|---|
| 2.1 Agentic suitability assessment | Readiness scoring for automation vs assistant vs human-in-loop agent vs full agentic workflow. | 0.2 | Yes | Unit tests; Nexus behavior tests. | Prevents overbuilding agentic solutions when data/control maturity is low. |
| 2.2 Workflow decomposition canvas | Structured breakdown: tasks, decisions, handoffs, exceptions, human approvals, controls. | 2.1 | Yes after 2.1 | Component tests; P0 origination scenario. | Converts "AI idea" into implementable workflow architecture. |
| 2.3 Solution architecture options | 2-3 solution patterns with data sources, retrieval, tools, model gateway, audit, security, integration. | 2.1 | Yes | Golden answer tests; architecture snapshot tests if rendered. | Gives CIO/CTO-level solution-shaping depth. |
| 2.4 Mobilization plan generator | 30/60/90 plan: squad, backlog, data work, integrations, evals, pilot, rollout, change/adoption. | 2.2, 2.3 | No | Behavior tests; generated artifact snapshot. | Moves from idea to executable plan. |
| 2.5 Control and eval matrix | Risk controls: hallucination, PHI/PII, model drift, adoption, vendor lock-in, security review, human approvals. | 2.3 | Yes | NIST AI RMF / SSDF-inspired checklist tests. | Makes enterprise approval safer and faster. |
| 2.6 Move-to-Source trigger | From a Move, create a Source recommendation when delivery model requires partner/vendor selection. | 1.2, 2.4 | No | End-to-end scenario test. | Makes Source a natural execution lane, not a disconnected module. |

### Wave 3 — Tower as Executive Outcome and Value Control Room

**Goal:** Make Tower the place a CXO trusts to decide what needs action this week.

| Slice | PR Scope | Dependencies | Parallel? | QA / Validation | Expert Value |
|---|---|---|---:|---|---|
| 3.1 Outcome ledger schema/view model | Track projected, tracked, and verified value by Move/Source event/use case. | 0.3 | Yes | Migration dry-run; unit tests; RLS coverage if persisted. | Stops inflated AI value claims. |
| 3.2 Executive action queue | Rank interventions: sponsor gap, vendor risk, adoption gap, value leakage, dependency blocker, renewal risk. | 0.3 | Yes | Tower view model tests; visual smoke. | Turns dashboards into next actions. |
| 3.3 Source risk in Tower | Surface sourcing risk and vendor delivery posture alongside Move portfolio health. | 1.6, 3.1 | No | Integration test with Source event linked to Move. | Shows commercial execution risk in portfolio governance. |
| 3.4 Adoption and value-realization instrumentation | Adoption and benefit-realization fields on Tower cards and executive brief. | 3.1 | Yes | Snapshot tests; tenant scenario validation. | Makes Tower about realized outcomes, not only program status. |
| 3.5 Board/ELT pack generator | Board-ready one-pager: top decisions, spend at risk, value changes, actions required, evidence links. | 3.2, 3.4 | No | Golden artifact snapshot; manual CXO review. | Gives CXOs the artifact they actually need. |
| 3.6 Outcome feedback to pattern graph | Persist outcome learning that can later feed anonymized cross-tenant patterns. | 3.1 | No | Data tests; privacy review. | Starts the Layer 2 -> Layer 3 moat path. |

### Wave 4 — Context Layer Freshness, Confidence, and Trust

**Goal:** Make every answer visibly grounded in the freshness and trust level of client context.

| Slice | PR Scope | Dependencies | Parallel? | QA / Validation | Expert Value |
|---|---|---|---:|---|---|
| 4.1 Segment freshness model | Per-segment freshness, source date, trust rung, and "stale answer" handling. | Existing context layer | Yes | Unit tests; Data Trust UI smoke. | Prevents confident answers from stale context. |
| 4.2 Context confidence in agent answers | Sentinel/Nexus/Atlas/Source surface confidence and missing-context caveats. | 4.1 | Yes after 4.1 | Golden Q&A tests; no generic disclaimers. | Builds trust with CXOs and procurement. |
| 4.3 Day-1 load readiness checklist | Operational checklist for first trustworthy answer: minimum packs by module and industry. | 4.1 | Yes | Docs + setup UI tests if surfaced. | Productizes onboarding, attacks consulting-ware risk. |
| 4.4 Day-2 connector roadmap | Connector order: ServiceNow, Workday/org, cloud cost, contract repository, project system. | 4.1 | Yes | Architecture doc; no runtime unless connector starts. | Shows scalable path to freshness. |
| 4.5 Context-layer API/SDK v0 spec | Read-only tenant-context API for future external agents/tools. | 4.1, broker boundary | Yes | OpenAPI/design review; security review. | Moves from context store to true context layer. |

### Wave 5 — End-to-End Product Story and Demo Hardening

**Goal:** Make the closed loop obvious in product, not just in strategy docs.

| Slice | PR Scope | Dependencies | Parallel? | QA / Validation | Expert Value |
|---|---|---|---:|---|---|
| 5.1 Apex end-to-end path | Workforce/contact-center AI: Intelligence -> Move -> Source -> Tower -> outcome. | Waves 1-3 partial | Yes | Playwright + manual script. | Shows retail business impact and sourcing economics. |
| 5.2 Meridian end-to-end path | Population health/ambient: clinical/workflow risk, sponsor path, vendor/security, outcome. | Waves 1-3 partial | Yes | Playwright + manual script. | Shows healthcare expertise without PHI dependency. |
| 5.3 First Capital end-to-end path | FedNow/model-risk: regulatory gating, build/buy, controls, outcome dashboard. | Waves 1-3 partial | Yes | Playwright + manual script. | Shows financial-services rigor. |
| 5.4 Cross-module trace viewer | Show evidence trail across Intelligence, Move, Source, Tower for one decision. | 5.1 or 5.2 | No | Integration + UX smoke. | Makes the product feel like one system. |
| 5.5 Investor/CXO story pack | Board-style walkthrough of the end-to-end loop and value/outcomes. | 5.1-5.3 | No | Review artifact; no runtime. | Makes value legible to non-technical stakeholders. |

---

## 4. Parallelization Plan

**Can run immediately in parallel:** 0.1, 0.2, 0.3, 0.4, 4.1 (design), 4.4, 4.5.

**Sequential chains:**
- Source: 1.1 -> 1.2 -> 1.3/1.4 -> 1.5 -> 1.6
- Moves: 2.1 -> 2.2/2.3/2.5 -> 2.4 -> 2.6
- Tower: 3.1/3.2 -> 3.3/3.4 -> 3.5 -> 3.6
- End-to-end: 5.1/5.2/5.3 only after enough Source/Moves/Tower slices exist.

**Cross-track dependencies:**
```text
Source delivery-model gate (1.2)
  -> Move-to-Source trigger (2.6)
  -> Source risk in Tower (3.3)
  -> Cross-module trace viewer (5.4)

Outcome ledger (3.1)
  -> Board/ELT pack (3.5)
  -> Outcome feedback to pattern graph (3.6)

Segment freshness (4.1)
  -> Agent confidence behavior (4.2)
  -> Day-1 readiness checklist (4.3)
  -> Context-layer API/SDK spec (4.5)
```

---

## 5. QA and Validation Gates by PR Type

| PR Type | Required Validation |
|---|---|
| Docs/spec only | Link check, exact source paths, founder-readable examples, no runtime files touched. |
| Types/contracts | Typecheck, unit tests for discriminated unions/builders, sample fixtures. |
| Agent doctrine/prompt | Behavior tests, golden Q&A, no degradation in voice/consistency tests. |
| Source logic | Unit tests for category/should-cost/normalization; Source event fixture; tenant-specific example. |
| Moves logic | Nexus behavior tests; generated artifact snapshot; lifecycle phase integrity. |
| Tower logic | View-model unit tests; visual/component smoke; deterministic executive action order. |
| Cross-module integration | Integration test proving IDs/links persist across modules; manual end-to-end script. |
| Persistence/migrations | Dry-run migration, RLS impact check, rollback note, tenant isolation probe. |
| UI | Typecheck, ESLint, targeted behavior/component tests, screenshot desktop + narrow viewport. |
| Azure/cutover relevant | L1-L11 gate impact noted; parallel-run or smoke script if data-plane behavior changes. |

Every PR includes: what expert workflow it improves; what tenant scenario proves it; what tests ran; what was deliberately not included; whether it is safe for both the Vercel/Supabase path and the Azure Postgres path.

---

## 6. 30 / 60 / 90 Day Roadmap

**First 30 days — expert contracts + first visible depth.** Source category classifier; Moves agentic suitability; Tower outcome taxonomy + executive action queue v1; context freshness/trust model v1; one Apex end-to-end scripted walkthrough.

**Days 31-60 — commercial and mobilization depth.** Source should-cost; proposal normalization; negotiation posture; Moves workflow decomposition; solution architecture options; mobilization plan; Tower projected/tracked/verified value ledger.

**Days 61-90 — closed loop and pattern flywheel foundation.** Source-to-Move / Move-to-Source triggers; Source risk in Tower; board/ELT pack; outcome feedback into context/pattern graph; Meridian + First Capital end-to-end scripts; context-layer API/SDK v0 spec.

---

## 7. First Ten PRs to Queue

| Order | PR | Track | Why First |
|---:|---|---|---|
| 1 | Source expert taxonomy | Source | Sourcing-advisor depth before UI. |
| 2 | Moves solution archetype taxonomy | Moves | Agentic solution-shaping language. |
| 3 | Tower outcome taxonomy | Tower | Value/outcome language. |
| 4 | Segment freshness/trust model spec | Context | Prevents false-confidence answers. |
| 5 | Source category classifier | Source | First product-visible expertise. |
| 6 | Agentic suitability assessment | Moves | First product-visible solution expertise. |
| 7 | Executive action queue v1 | Tower | Converts Tower from dashboard to operator. |
| 8 | Source build/buy/partner gate | Source/Moves | Connects sourcing to solution strategy. |
| 9 | Workflow decomposition canvas | Moves | Makes agentic design depth tangible. |
| 10 | Apex end-to-end script v1 | Cross-module | Forces story coherence. |

---

## 8. Product Risks

| Risk | How this plan reduces it |
|---|---|
| Feature sprawl | Every slice maps to an expert workflow and product-loop transition. |
| Consulting-ware | Cold-start, templates, classifiers, readiness checks productize expert work. |
| Generic AI answers | Context, freshness, confidence, golden Q&A force tenant-specific reasoning. |
| Source underpowered | Source becomes commercial strategy, should-cost, normalization, negotiation, mobilization. |
| Tower decorative analytics | Tower becomes executive action, value realization, risk, board pack generation. |
| Moves as lifecycle paperwork | Moves becomes solution shaping, agentic suitability, workflow architecture, mobilization. |
| Weak moat | Outcome ledger and pattern feedback begin the data flywheel. |

---

## 9. Definition of Done

The enhancement program is successful when AbarVa can demonstrate, for at least one tenant and one real-shaped business problem:

1. Context layer shows loaded/stale/missing/trusted context.
2. Intelligence ranks a decision and explains evidence, dissent, value, blockers, confidence.
3. Moves converts it into a governed initiative with solution archetype, workflow decomposition, controls, mobilization.
4. Source determines build/buy/partner/SI path, should-cost, vendor posture, sourcing artifact set.
5. Tower tracks projected/tracked/verified value, adoption, spend/risk, dependencies, executive action.
6. Outcome evidence feeds back into the pattern/context layer.
7. The whole trace is visible, cited, and auditable.

That is the product becoming a context-and-outcomes platform, not just a set of agent-fronted pages.
