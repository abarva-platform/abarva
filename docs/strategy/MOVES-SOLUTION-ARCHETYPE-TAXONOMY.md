# Moves — Agentic Solution Archetype Taxonomy

> Owner: founder + AI engineering. Status: draft methodology spec (Wave 0,
> Slice 0.2). This is the encoded taxonomy of agentic solution archetypes the
> Moves surface (Nexus agent) reasons over when it shapes a customer's agentic
> software / solution initiative. It is the doc counterpart of
> `src/lib/programs/taxonomy/solution-archetype-taxonomy.ts`, and a child of
> `MOVES-AGENTIC-SHAPING-METHODOLOGY.md`.

---

## 1. Why this document exists

The shaping methodology (`MOVES-AGENTIC-SHAPING-METHODOLOGY.md`) tells Moves to
behave like a principal solution architect: challenge the use case, surface the
traps, ground every output in the tenant's actual `it_landscape` and data. But
to do that consistently Nexus needs a **finite, encoded vocabulary** of the
solution shapes an agentic bet can take. This taxonomy is that vocabulary.

Eight archetypes. For each one: **when it fits / when it does not**, the
**readiness gates** it needs (data, control, eval maturity), the **typical
evidence inputs** (which tenant context the shaping depends on), and the
**anti-patterns** that signal a mis-selection.

**Scope boundary.** This is the taxonomy *and* the behaviour-test fixtures that
prove a proposed Move can be classified into it. The **classifier** that
performs the classification at runtime is **Slice 2.1 — Agentic suitability
assessment** and is deliberately NOT in scope here. The fixtures are the
contract; the classifier is built against them later.

---

## 2. The three readiness dimensions

Every archetype is gated on three maturity dimensions. They come straight from
the shaping methodology — §6 data-readiness and the §5 production-readiness
gate.

| Dimension | What it measures |
|---|---|
| **Data** | Is the grounding context the solution needs available, accessible, and *fresh*? |
| **Control** | Are guardrails, human checkpoints, approvals, observability, and a tested kill switch in place for the consequences this solution can cause? |
| **Eval** | Is there a golden / adversarial / regression eval harness adequate to know whether quality is improving or degrading? |

Each is rated on a four-rung maturity scale: `none → low → moderate → high`.
An archetype declares a **minimum** rung per dimension. A proposed Move whose
tenant readiness sits below a minimum has a **readiness gap** — and the honest
Moves output is "close this gap first," not "ship it anyway."

The single most important rule the taxonomy encodes: **agentic ambition must
not exceed readiness.** Choosing a full agentic workflow when data-readiness is
low is the canonical failure this taxonomy exists to prevent.

---

## 3. The 8 archetypes

Ambition rises down the list (1 = deterministic, 6 = autonomous multi-step).
Two of the eight — data remediation and process redesign — are *not* agentic
solutions at all; they are the preconditions a real agentic bet often needs
first. Naming them as archetypes lets Moves say "this is not an AI project
yet" without falling out of its own vocabulary.

### 3.1 Deterministic Automation

A rule-bound, deterministic flow — RPA, scripted integration, a workflow engine
— that removes manual effort from a stable, well-specified process. No model
judgement on the critical path.

- **When it fits:** the process is stable, high-volume, fully specifiable as
  rules; inputs are structured; the correct output is unambiguous; value is
  labour displacement on a known unit-cost task; failure is cheap to detect and
  reverse.
- **When it does not fit:** the task needs judgement or unstructured-input
  handling; rules change faster than they can be maintained; the real problem
  is a broken process (→ process redesign).
- **Readiness gates:** data `moderate` (structured, reliable inputs); control
  `low` (an exception queue and reversibility); eval `low` (correctness checked
  by reconciliation, not a model eval).
- **Evidence inputs:** `process_maps`, `systems_integrations`,
  `kpi_dictionary`.
- **Anti-patterns:** `automating_a_broken_process` — automating something that
  should be redesigned first; `ai_label_on_rpa` — marketing deterministic RPA
  as an "AI agent" to win demo attention.

### 3.2 Conversational Assistant

A model-fronted assistant that drafts, summarises, rewrites, or answers within
a bounded domain. The human always reviews and owns the output.

- **When it fits:** the work product is text the user reviews before use;
  value is throughput and quality lift for knowledge workers; the domain is
  bounded and a competent human is in the loop by construction; a thin,
  low-risk first bet is wanted.
- **When it does not fit:** the assistant needs authoritative, fresh tenant
  facts it cannot retrieve (→ retrieval copilot); the output must be acted on
  without review; accuracy on tenant-specific facts is load-bearing.
- **Readiness gates:** data `low` (a general model adds value without a tenant
  corpus); control `low` (human review is the primary control); eval `low`
  (lightweight quality sampling).
- **Evidence inputs:** `kpi_dictionary`, `org_chart`.
- **Anti-patterns:** `ungrounded_fact_assistant` — letting an assistant answer
  tenant-specific factual questions with no retrieval; `assistant_as_system_of_record`
  — treating assistant output as authoritative instead of a draft.

### 3.3 Retrieval Copilot

A grounded copilot that answers and drafts against an authoritative tenant
context source through a retrieval / broker boundary. Answers are cited and
traceable; the human still owns the action.

- **When it fits:** users need answers grounded in tenant-specific, changing
  facts; an authoritative, accessible, reasonably fresh context source exists
  or can be built; citations and traceability are required; value is faster,
  more accurate decisions, not autonomous execution.
- **When it does not fit:** the grounding corpus does not exist or is stale
  (→ data remediation first); no clean retrieval / broker boundary can be
  drawn; the use case actually needs to take action (→ human-in-loop agent).
- **Readiness gates:** data `high` (an agent is only as good as its grounding);
  control `moderate` (a broker boundary plus output-consistency guards); eval
  `moderate` (a golden corpus to track retrieval quality).
- **Evidence inputs:** `data_sources`, `it_landscape`, `kpi_dictionary`,
  `policies_controls`.
- **Anti-patterns:** `copilot_on_stale_corpus` — shipping a copilot over a
  stale or incomplete source; `no_broker_boundary` — wiring the model directly
  to data stores with no testable retrieval boundary.

### 3.4 Human-in-the-Loop Agent

An agent that plans and proposes consequential actions but executes only
through defined human checkpoints. It can take low-risk steps autonomously and
escalates high-stakes decisions to an accountable human.

- **When it fits:** actions have real consequences but a human can realistically
  review them; a grounded context source and a clear approval workflow both
  exist; the organisation wants agentic leverage without ceding accountability;
  it is the safe first step toward a fuller agentic workflow.
- **When it does not fit:** volume or latency makes human review at every
  checkpoint impractical; eval / control maturity is too low to trust even the
  autonomous low-risk steps; the work is purely informational (→ copilot).
- **Readiness gates:** data `high`; control `high` (defined checkpoints,
  role-based approvals, tested kill switch); eval `moderate` (golden +
  adversarial evals bounding the autonomous steps).
- **Evidence inputs:** `data_sources`, `process_maps`, `org_chart`,
  `policies_controls`, `risk_register`.
- **Anti-patterns:** `rubber_stamp_checkpoint` — a checkpoint reviewers approve
  without scrutiny; `skipping_to_full_agentic` — jumping past human-in-loop
  before control and eval maturity exist.

### 3.5 Full Agentic Workflow

A multi-step agentic system that plans, retrieves, calls tools, and executes an
end-to-end workflow with autonomy on the critical path. Humans supervise by
exception.

- **When it fits:** the workflow is well understood and decomposable into
  bounded steps; data, control, and eval maturity are all high and proven on a
  prior human-in-loop stage; volume or latency genuinely rules out step-by-step
  approval; failure modes are enumerated, observable, and degrade gracefully.
- **When it does not fit:** any of data, control, or eval readiness is below
  `high` — this is the highest-risk archetype; there is no prior human-in-loop
  stage; failure cost or regulatory exposure is severe and not yet bounded.
- **Readiness gates:** data `high`, control `high`, eval `high` — all three.
- **Evidence inputs:** `data_sources`, `process_maps`, `systems_integrations`,
  `policies_controls`, `risk_register`, `historical_outcomes`.
- **Anti-patterns:** `full_agentic_on_low_data_readiness` — choosing full
  autonomy when data-readiness is low (the canonical over-reach failure);
  `demo_driven_autonomy` — selecting autonomy because it demos well, with no
  production-readiness gate; `no_human_in_loop_predecessor` — going straight to
  autonomy with no stage that proved the steps.

### 3.6 Data Remediation

Not an agentic solution — a data project that must precede one. It closes the
grounding gap: builds, cleans, integrates, or refreshes the context source a
later agentic archetype will depend on.

- **When it fits:** a high-value agentic use case is blocked because its
  grounding context is missing, stale, or inaccessible; the §6 data-readiness
  assessment found context the customer does not have; the honest sequencing is
  "data project first, agentic project second."
- **When it does not fit:** the grounding context already exists, is
  accessible, and is fresh; it is being used to indefinitely defer a use case
  that is actually ready.
- **Readiness gates:** data `none` (this archetype starts from low/absent data
  readiness by definition); control `low`; eval `none` (success is data-quality
  metrics, not a model eval).
- **Evidence inputs:** `data_sources`, `it_landscape`, `systems_integrations`.
- **Anti-patterns:** `remediation_as_permanent_parking` — using the label to
  indefinitely stall a use case whose grounding is actually adequate;
  `remediation_without_target_use_case` — cleaning data with no named
  downstream use case to anchor scope and a stopping point.

### 3.7 Vendor-Led Implementation

A mature vertical agent or packaged solution exists; the work is selection,
integration, configuration, and governance of a vendor product rather than
building an agent in-house.

- **When it fits:** a mature vendor agent covers the use case and the use case
  is not differentiating; speed and lower build risk outweigh lost
  customisation; the customer can still own grounding, evals, and the
  production-readiness gate.
- **When it does not fit:** the use case is core differentiation needing
  proprietary context and control (→ build); no vendor product is genuinely
  mature; vendor lock-in or data-handling posture is unacceptable.
- **Readiness gates:** data `moderate` (integration grounding must be ready);
  control `moderate` (vendor security review, data-handling posture, exit /
  lock-in controls); eval `moderate` (the customer still evals vendor output
  against its own bar).
- **Evidence inputs:** `vendor_contracts`, `it_landscape`,
  `systems_integrations`, `policies_controls`.
- **Anti-patterns:** `vendor_led_on_core_differentiation` — buying a vendor
  agent for a core-differentiating capability; `accountability_outsourced` —
  assuming the vendor owns evals, grounding, and the readiness gate.
- **Hand-off:** this archetype is the natural trigger for a Source build/buy/
  partner decision (Wave 1, Slice 1.2).

### 3.8 Process Redesign

Not an agentic solution — a precondition for one. The process itself is broken
or convoluted; it must be redesigned before any automation or agent is shaped
on top of it.

- **When it fits:** the underlying process is broken, redundant, or convoluted;
  automating it would entrench a bad design; the largest value is eliminating
  steps, not accelerating them.
- **When it does not fit:** the process is already sound and only effort-heavy
  (→ automation); it is used to stall a genuinely ready agentic bet.
- **Readiness gates:** data `none`; control `low` (change-management and
  process-ownership controls); eval `none` (success is process KPIs).
- **Evidence inputs:** `process_maps`, `org_chart`, `kpi_dictionary`.
- **Anti-patterns:** `paving_the_cowpath` — automating the existing broken
  process instead of redesigning it; `redesign_without_owner` — redesigning
  with no accountable process owner to enforce the new design.

---

## 4. How Nexus uses the taxonomy

When a user proposes a Move, Nexus (via the Slice 2.1 classifier, not shipped
here) should:

1. **Classify** the proposed Move into one archetype, with reasons grounded in
   that archetype's *when it fits* conditions.
2. **Surface readiness gaps** — for each gated dimension where tenant readiness
   sits below the archetype's minimum, name the gap and what must close.
3. **Challenge the demo-driven pick.** Where the obvious pick differs from the
   expert pick, name the tempting-but-wrong archetype and the anti-pattern code
   it trips (e.g. a customer asking for a full agentic workflow on low data
   readiness is steered to a human-in-loop agent, citing
   `full_agentic_on_low_data_readiness`).

The behaviour-test fixtures in
`src/lib/programs/taxonomy/archetype-fixtures.ts` encode exactly this
expected output — proposed Move, expected archetype, reasons, readiness gaps,
and (where relevant) the tempting-but-wrong pick — across all three demo
tenants. They are the acceptance contract for the Slice 2.1 classifier.

---

## 5. Relationship to the rest of Moves

| Taxonomy element | Moves / methodology link |
|---|---|
| Archetype classification | Slice 2.1 agentic suitability assessment |
| Readiness gates | §5 production-readiness gate, §6 data-readiness |
| Evidence inputs | Grounded against `it_landscape` at shaping time (§6) |
| `deliveryLean` (build/buy/orchestrate) | §7 build/buy/orchestrate → Source hand-off |
| Anti-patterns | The §2 challenge test — generic picks are cut |

---

## 6. Deliberately deferred

- **The classifier itself** — Slice 2.1. This slice ships only the taxonomy,
  typed contracts, and fixtures.
- **Workflow decomposition** (Slice 2.2), **solution architecture options**
  (Slice 2.3), **mobilization plans** (Slice 2.4), and the **control / eval
  matrix** (Slice 2.5) all consume this taxonomy but are out of scope here.
- **No UI.** No Moves surface renders these archetypes yet.
