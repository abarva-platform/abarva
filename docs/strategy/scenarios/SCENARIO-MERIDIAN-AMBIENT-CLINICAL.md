# Scenario · Meridian Health — Ambient Clinical Documentation

**Tenant:** Meridian Health System (integrated health system composite)
**Decision archetype:** Workforce / clinician-experience AI — ambient clinical documentation assistant (human-in-loop)
**North-Star loop covered:** Context → Intelligence → Move → Source → Tower → Outcome
**Scope guardrail:** This scenario is about **clinician workflow, sponsor logic, vendor/security selection, and outcome economics** — *not* patient data. No PHI dependency. The clinical-data hard-limit (overlay Part 11) stays enforced throughout; the script never reasons over patient records.

> **How to use this script.** Each step names the surface, what it shows, the expert judgment the fronting agent applies, the artifact produced, and the seed evidence drawn on. Surfaces: Intelligence (Sentinel) · Moves = `/programs` (Nexus) · Source (Sentinel) · Tower (Atlas). Sign in as the Meridian CDIO or CDAO demo account.

---

## Step 0 · Context Layer — what the tenant already knows

**Surface:** Setup / Data Trust view (Steward).
**Shows:** Meridian intelligence-layer overlay loaded — 38 KPIs, 7 pattern packs, 9 telemetry sources, dual-scope config with clinical-data hard-limit enforcement. Relevant segments:

- KPI cluster **2.8 Workforce** — Physician Burnout Index 48% vs 32% target; wRVU Productivity 4,800 vs 5,200; Nursing Turnover 22%.
- KPI cluster **2.9 Cross-functional** — EHR Satisfaction 58% (`meridian` EHR-satisfaction KPI).
- Pattern **3.6 Physician Burnout and Engagement Erosion** — 48% burnout, EHR satisfaction 58%, *documentation time exceeds patient-facing time in primary care*.
- Pattern **3.3 Shadow AI in Clinical and Revenue Cycle Operations** — 16 AI tools, 9 below governance threshold, 4 with PHI exposure (BAA status unclear).
- Vendor landscape — Epic (core EHR), Cerner (legacy); AI/ML is local-first today (Palantir Foundry, on-prem GPU stack); Claude on Bedrock / Azure Foundry / OpenAI are *evaluation paths, not active runtimes* — privacy, security, IRB and data-egress controls are the gating issues.

**Expert judgment:** Steward confirms the clinical-data hard-limit is active and flags `meridian_physician_burnout_index` as **program-scoped disclosure** (physician-relations sensitivity).
**Artifact:** Context readiness snapshot — workforce KPIs and vendor landscape green; clinical-data segments locked behind the hard limit.

---

## Step 1 · Intelligence — identify and pressure-test the bet

**Surface:** Intelligence (`/intelligence`), Sentinel-fronted.
**Shows:** The pattern-to-Move funnel. Sentinel surfaces **Pattern 3.6 Physician Burnout and Engagement Erosion** as the lead pattern, with the specific detection signal: *clinical documentation time exceeding patient-facing time*.
**Expert judgment (AI product leader + governance lead):** Sentinel pressure-tests:

- *Right bet?* Burnout, wRVU productivity and EHR satisfaction all move with documentation burden — ambient documentation is a high-leverage intervention. Yes.
- *Risk framing — no PHI shortcut:* Ambient documentation touches the encounter, but the *AbarVa decision* is about workflow, sponsor and vendor logic — Sentinel explicitly keeps reasoning out of patient data, consistent with the hard limit. The genuine risks are data-egress (Epic integration), BAA coverage, and IRB/security review — see Pattern 3.3.
- *Readiness caveat:* AI/ML is local-first today; any ambient vendor is cloud-hosted, so data-egress governance is a readiness gate.

**Artifact / decision:** A pressure-tested **bet brief** — "Reduce physician documentation burden via an ambient clinical-documentation assistant, governed for data-egress and BAA" — promoted into Moves.
**Evidence drawn on:** Pattern packs 3.6 and 3.3; Workforce KPI cluster 2.8; Cross-functional KPI 2.9.3 (EHR satisfaction); vendor landscape.

---

## Step 2 · Move — shape it into a governed initiative

**Surface:** Moves (`/programs`), Nexus-fronted. Create / open the **Ambient Clinical Documentation** Move.
**Shows:** Phase trace through P0 originate → P1 charter → P2 diagnose → P3 design, with the squad and gates.

- **Sponsor logic (expert judgment, transformation partner):** Pattern 3.6 calls for a clinician-credible sponsor. Nexus proposes the **Chief Medical Officer** as executive sponsor (clinical legitimacy with physicians), with CDIO/CMIO as delivery owner and a security/compliance partner for the data-egress and BAA workstream. A purely IT-led sponsor would fail adoption — burnout is a physician-trust problem.
- **Solution archetype:** Nexus classifies this as a **human-in-loop assistant** — the physician reviews and signs the draft note; the assistant never finalises documentation autonomously. Full agentic workflow is explicitly *not* recommended (clinical accountability + validation maturity).
- **Workflow decomposition:** ambient capture → draft note generation → physician review/edit → sign-off → EHR write-back. Exceptions: low-confidence transcription, specialty edge cases, opt-out encounters.
- **Control & eval matrix:** data-egress control, BAA requirement, IRB/security review gate, hallucination/accuracy eval on draft notes, physician-adoption risk.

**Artifact / decision:** P3 solution design, archetype call, control matrix; the **sourcing strategy** deliverable opened — Meridian has no incumbent ambient vendor, so this triggers Source.
**Evidence drawn on:** Pattern 3.6 (sponsor profile + signals); Pattern 3.3 (BAA/data-egress sensitivities); Workforce KPI baselines locked in P2.

---

## Step 3 · Source — choose the commercial / partner / vendor path

**Surface:** Source, Sentinel-fronted, entered from the Move's sourcing-strategy deliverable.
**Shows:** A sourcing event for the ambient-documentation assistant.
**Expert judgment (IT sourcing advisor):** Sentinel runs Stage 0–2 of the sourcing methodology:

- **Demand challenge:** Two lanes — (a) the ambient-documentation product (a SaaS buy, e.g. an Epic-integrated ambient-AI category), and (b) the Epic integration + security/data-egress work, which may be internal or a managed-service lane.
- **Buying motion:** Lane (a) is a SaaS evaluation, not a full SI build. Avoid an over-scoped SI RFP.
- **Vendor risk (decisive here):** Sentinel makes the data-residency and BAA posture a **hard gate** — any vendor must offer a BAA, defensible data-egress controls, and clear handling versus Meridian's local-first AI stance. Vendors failing the gate are screened out before TCO comparison. Cloud paths already tracked as *evaluation paths* (Bedrock, Azure Foundry) inform the architecture.
- **Market intelligence:** normalise vendor responses on accuracy evals, EHR-integration depth, security attestations (HITRUST), and clinician-time-saved evidence.

**Artifact / decision:** A **sourcing strategy + vendor shortlist criteria** — two-lane decomposition, SaaS buying motion, BAA/data-egress as a pass/fail gate — written back to the Move.
**Evidence drawn on:** Vendor landscape (Epic, HITRUST-certified vendors, cloud evaluation paths); Pattern 3.3 BAA evidence.

---

## Step 4 · Tower — track value, risk, adoption, outcomes

**Surface:** Tower, Atlas-fronted. Open the Meridian portfolio; find **Ambient Clinical Documentation**.
**Shows:** The Move as a portfolio card — projected value, risk posture, adoption readiness, dependency on the Source event.
**Expert judgment (CFO portfolio operator + governance lead):** Atlas ranks the executive action:

- **Projected value** — documentation-time reduction → wRVU productivity recovery (toward 5,200), EHR satisfaction lift (from 58%), and burnout-index improvement (from 48%).
- **Risk / dependency** — the IRB/security review and BAA execution are the gating dependencies; if launched without them, data-egress is a control gap, not just a delay.
- **Adoption risk** — physician adoption is the value-leakage risk: a bought tool that physicians do not trust delivers no burnout improvement. Atlas flags adoption instrumentation as mandatory.
- **Executive action this week** — confirm CMO sponsorship and clear the security/BAA gate before vendor selection closes; that is the action.

**Artifact / decision:** Tower executive action entry + a line in the Meridian portfolio / ELT brief.
**Evidence drawn on:** Move milestones and control matrix; Source vendor gate; Workforce KPI baselines (program-scoped disclosure respected).

---

## Step 5 · Outcome — evidence feeds back to the Context Layer

**Surface:** Tower outcome ledger → Context Layer.
**Shows:** During the pilot, Tower records projected → tracked → verified value: documentation time per encounter, EHR satisfaction, wRVU productivity, physician burnout index, and **physician adoption rate** of the assistant.
**Expert judgment:** Atlas keeps *verified* value separate from *projected* — burnout improvement is claimed only when pilot telemetry confirms it, and adoption is tracked as a leading indicator. Workforce KPI movement is disclosed within program scope per the physician-relations sensitivity.
**Artifact / decision:** Outcome evidence — updated documentation-time, EHR-satisfaction and burnout readings, plus governance-coverage delta — written back as fresh context segments, updating the Pattern 3.6 evidence baseline.
**Loop closed:** The verified outcome, the human-in-loop archetype call, and the BAA/data-egress sourcing gate feed the context layer and the pattern graph for the next clinician-experience bet.

---

## Loop coverage checklist

| Step | Surface | Produced |
|---|---|---|
| Context | Setup / Data Trust (Steward) | Context readiness snapshot (clinical hard-limit enforced) |
| Intelligence | Intelligence (Sentinel) | Pressure-tested bet brief |
| Move | Moves `/programs` (Nexus) | P3 solution design + CMO sponsor logic + control matrix |
| Source | Source (Sentinel) | Sourcing strategy with BAA/data-egress pass/fail gate |
| Tower | Tower (Atlas) | Executive action + portfolio line |
| Outcome | Tower outcome ledger → Context | Verified-value + adoption evidence, loop closed |

**Seed realism:** Strong for the workforce/burnout angle — Pattern 3.6, the 2.8/2.9 KPIs, Pattern 3.3 BAA evidence, and the local-first AI vendor stance are all seeded. The seed has no named ambient-documentation vendor (correctly — AI/ML vendors are listed only as evaluation paths), so the scenario keeps Source at category/criteria level rather than naming a vendor. PHI is never touched.
