# Pattern Pack 07 — Responsible AI & Clinical Operations (`RAI`)

**Pack code:** `RAI`
**Layer:** Cross-cutting (horizontal · reusable across all domains; sharpest in healthcare)
**Created:** 2026-06-06

---

## What this pack covers

This is the **operating spine for putting AI near a patient, a claim, or a payment without harming anyone and without losing the right to defend the decision later.** Where the MLOPS pack (`04`) covers how a model is built, served, and monitored on the lakehouse, and the GOV pack (`05`) covers how the data and platform are made compliant, this pack covers the layer between the model and the human consequence: **who is accountable for the model, on what evidence it was allowed to act, what it is and is not allowed to do, how its behavior is watched and rolled back, and what every person affected by it is owed in transparency.**

It is the governance answer to a single question a regulator, a Chief Medical Officer, or a plaintiff's attorney will ask: *"A model influenced this clinical or financial decision — show me that a qualified human was accountable, that the model was validated for this use, that you watched it for harm, and that you could stop it."* Every pattern here exists to make the answer "yes, here is the evidence."

### The one rule that overrides everything: no autonomous clinical or payment action

The single non-negotiable principle of this pack, stated up front so it is never ambiguous downstream:

> **A model never takes a consequential clinical or payment action on its own.** It recommends; a qualified, accountable human decides and acts. The AI does not diagnose-and-treat, does not deny-or-pay a claim, does not admit-or-discharge, does not dose, and does not move money — without a human in the decision who can see the recommendation, its evidence, and its limits, and who owns the outcome.

This is not a maturity stage to graduate out of. For high-stakes, irreversible decisions it is the permanent operating posture. Every pattern in this pack either enforces this rule (`RAI-01`, `RAI-02`, `RAI-14`) or makes the human's decision genuine, informed, and defensible rather than ceremonial.

### The own-it framing for governance

For a responsible-AI pack, "own-it" rarely means building a governance product from scratch. It means: **the client owns the governance — the committee, the policies, the model inventory, the approval records, and the incident history — and the models themselves are auditable and recalibratable inside the client's own estate.** The client can inspect the model's behavior, re-run its evaluation, recalibrate or retrain it, and turn it off, without asking a vendor's permission. We mark:

- **OWN** — the governance artifact and authority live entirely with the client (the committee, the policy, the model inventory, the incident record, the approval gate).
- **MANAGED-OWN-DESTINATION** — a managed model or service is in the loop, but it is auditable, recalibratable, and stoppable by the client, with the evidence landing in the client's estate (e.g. a Databricks-hosted Foundation Model serving inside the client account, evaluated and monitored by the client).
- **RENT / DISQUALIFIED** — a closed model or service that takes or shapes a clinical/payment decision where the client cannot inspect its behavior, cannot reproduce its evaluation, cannot recalibrate it, and cannot prove a human was accountable. For high-stakes healthcare use this is disqualified by default; flag explicitly with surfaced rationale.

The governance own-it argument is the same shape as the data own-it argument in GOV-03: **you cannot certify, recalibrate, or defend what you cannot see.** A clinical model whose weights, training data, evaluation, and behavior are the vendor's black box leaves the client holding the clinical and legal accountability for a decision it cannot inspect — the worst of both worlds.

### Regulatory frame this pack is built against

The patterns are written to satisfy, in plain terms, the convergent requirements of:

- **FDA Good Machine Learning Practice (GMLP)** — the 10 guiding principles (FDA/Health Canada/MHRA, 2021) for Software as a Medical Device, plus the FDA's Predetermined Change Control Plan (PCCP) guidance for models that learn/update.
- **HHS / OCR Section 1557** — the 2024 final rule (45 CFR Part 92) prohibiting discrimination through "patient care decision support tools," including AI, and requiring covered entities to make reasonable efforts to identify and mitigate discrimination risk.
- **NIST AI Risk Management Framework (AI RMF 1.0)** — Govern / Map / Measure / Manage functions, used as the in-house governance scaffold.
- **EU AI Act** — Article 14 (human oversight for high-risk AI), Article 9 (risk management), Article 12 (record-keeping/logging), and the high-risk obligations relevant to any client with EU exposure.
- **The Coalition for Health AI (CHAI)** assurance-lab / model-card direction and **ONC HTI-1** decision-support transparency (DSI) requirements for certified health IT.

> **Sourcing note:** regulatory citations name the instrument and article/section; specific clause numbers should be confirmed against the current text with the client's regulatory/compliance counsel, as these instruments are actively evolving (the EU AI Act phases in through 2026–2027; the Section 1557 AI provisions and FDA PCCP guidance are recent). Every quantitative claim is sourced to a named study or flagged **"estimate — confirm with client data."**

---

## Pattern index

| ID | Name | Maturity |
|---|---|---|
| RAI-01 | No autonomous clinical or payment action — the prime directive | Production-ready |
| RAI-02 | Human-in-the-loop / human-approval gate, calibrated to stakes | Production-ready |
| RAI-03 | Model card + intended-use statement | Production-ready |
| RAI-04 | Model approval workflow + named accountability | Production-ready |
| RAI-05 | Clinical AI governance committee | Production-ready |
| RAI-06 | Model inventory + risk tiering | Production-ready |
| RAI-07 | Scope-of-use limits + off-label guardrail | Production-ready |
| RAI-08 | Subgroup / bias evaluation (the Obermeyer discipline) | Production-ready |
| RAI-09 | Clinical validation + local performance evidence | Production-ready |
| RAI-10 | Drift detection + revalidation cadence (the Epic Sepsis lesson) | Production-ready |
| RAI-11 | Adverse-event monitoring + safe rollback / kill-switch | Production-ready |
| RAI-12 | AI incident response + reporting | Emerging |
| RAI-13 | Patient & clinician transparency + disclosure | Emerging |
| RAI-14 | Evidence + immutable decision audit trail | Production-ready |
| RAI-15 | Regulatory mapping — GMLP / 1557 / NIST AI RMF / EU AI Act | Production-ready |
| RAI-16 | Change control for learning models (PCCP) | Emerging |
| RAI-17 | Responsible-AI policy + workforce competency | Emerging |

---

### PATTERN RAI-01 · No autonomous clinical or payment action — the prime directive

**Intent** — Make it a hard, architected rule that no model takes a consequential clinical or payment action without a qualified, accountable human in the decision — so the worst failure mode in healthcare AI (a machine acting on a person with no human owner) cannot occur by design, not merely by policy.

**Applies to** — Every model that touches a clinical decision (diagnosis, treatment, triage, admission/discharge, dosing, alerting) or a payment/coverage decision (claim adjudication, prior authorization, eligibility, denial). All domains where AI output affects a person. Lifecycle: Architecture (the decision-flow design) → run/operate. **The pattern every other pattern in this pack serves.**

**Solution shape** — Architect the action boundary explicitly, per decision type:
1. Enumerate every decision the model influences and classify each as **reversible/low-stakes** (the model may act with human spot-audit, e.g. routing a message, pre-populating a draft) or **irreversible/high-stakes** (the model may *only recommend* — a human decides and acts). Clinical actions affecting care and payment actions affecting coverage are high-stakes by default.
2. For high-stakes decisions, the system surfaces a **recommendation + confidence + explanation + provenance** (composes MLOPS-09, MLOPS-16, RAI-14) and **stops there**. The consequential action (the order, the denial, the dose, the discharge) requires a human's affirmative action.
3. The autonomy level for each decision type is a **documented architecture decision**, signed off by the governance committee (`RAI-05`), not an emergent property of how a UI was wired.
4. The rule is enforced in code where feasible (the model's output path cannot reach the action API without passing through the human-decision step), not just in a policy document.

This is the operational expression of EU AI Act Art. 14 (human oversight), FDA GMLP (human-AI team performance), and the spirit of the Section 1557 decision-support rule. It is also the own-it safety story: a client that owns its decision-flow can prove the boundary; a client renting a closed auto-actioning service cannot.

**Own-it vs rent** — **OWN.** The decision-flow, the action boundary, and the enforcement are the client's architecture and the client's accountability. **RENT / DISQUALIFIED:** a vendor product that auto-adjudicates claims or auto-actions clinical decisions on the vendor's side with no client-visible human gate — both an own-it failure and a safety/regulatory failure.

**Where it sits** — Architecture tier (decision-flow) + the application workflow + governance. Lifecycle: Architecture + run/operate.

**Evidence anchors** — EU AI Act Article 14 (human oversight for high-risk AI); FDA GMLP principle on human-AI team performance and clinical decision support (FDA/HC/MHRA, "Good Machine Learning Practice for Medical Device Development: Guiding Principles," 2021); HHS/OCR Section 1557 final rule (45 CFR Part 92) on nondiscriminatory use of patient-care decision support tools; NIST AI RMF (Govern/Manage — human oversight). The boundary is qualitative, not quantitative — no numeric claim.

**Anti-patterns** — **The autonomous denial / autonomous clinical action.** A model that auto-denies a claim, auto-discharges, auto-doses, or closes a care gap as an action with no human in the decision — the canonical catastrophic failure; unsafe, indefensible, and the kind of thing that produces litigation and regulatory action. *Boundary-by-accident:* the autonomy level is whatever the UI happened to allow, never deliberately decided or signed off. *"Advisory" that is really autonomous:* a recommendation a human rubber-stamps under such time pressure that it is autonomous in practice (mitigated by `RAI-02`).

**Feeds artifacts** — Architecture decision-flow + action-boundary statement; Governance human-oversight control; Business case (the boundary is the safety/compliance story, not friction); domain clinical/payment workflow specs.

**Maturity** — Production-ready.

---

### PATTERN RAI-02 · Human-in-the-loop / human-approval gate, calibrated to stakes

**Intent** — Make the human's decision in the loop *genuine* — informed, low-friction-to-disagree, and proportionate to the stakes — so the gate is real accountability rather than a rubber stamp, and the human's accept/override is captured as a first-class signal.

**Applies to** — Every high-stakes decision flowing from `RAI-01`. Clinical and payment workflows especially. Lifecycle: Architecture (gate design) → run/operate. Composes with MLOPS-09 (the lakehouse mechanism) and RAI-14 (the audit).

**Solution shape** — Design the gate so review is possible and disagreement is easy:
1. **Surface the reasoning inline** — the recommendation arrives with its confidence, its explanation (SHAP/feature attribution via MLOPS-16), and its provenance/source evidence, so the reviewer can interrogate it rather than trust it blindly.
2. **Calibrate the gate to stakes and reversibility** — define autonomy tiers explicitly: (a) *auto-act with audit* for low-stakes/reversible; (b) *human confirm* for medium; (c) *human decides, model advises* for high-stakes/irreversible (clinical care, denial, money movement). The tier per decision type is documented and committee-approved (`RAI-05`).
3. **Make "override" as cheap as "accept."** If disagreeing requires more clicks or a free-text justification while accepting is one button, the gate biases toward agreement and the override signal is suppressed. Capture an optional structured override reason without making it a barrier.
4. **Triage reviewer attention** — rank/queue so humans spend scrutiny where the model is uncertain or the stakes are highest; do not flood reviewers with hundreds of high-confidence low-stakes items that train them to click-through (the alarm-fatigue failure).
5. **Capture every accept/override + identity + (optional) reason** into the immutable trail (`RAI-14`); feed the **override rate and override outcomes** into monitoring (`RAI-10`) — a rising override rate is a drift/trust signal, and an override that turns out right is a model-error signal.

**Own-it vs rent** — **OWN.** The gate UX, the autonomy tiers, and the override record are the client's workflow and evidence. A RENT auto-actioning product with no client-visible gate fails this by construction.

**Where it sits** — Serving + governance + the application workflow. Lifecycle: Architecture + run/operate.

**Evidence anchors** — EU AI Act Art. 14 (effective human oversight — the human must be able to understand, monitor, override, and disregard); NIST AI RMF (Manage — human oversight and intervention); FDA GMLP (human-AI team performance; usability to avoid automation bias). Override-rate baselines are workload-specific — *estimate — confirm with client data.* Automation-bias and alert-fatigue risk is well-documented in clinical decision support (e.g. CDS alert-override literature).

**Anti-patterns** — *Rubber-stamp HIL:* a human who approves hundreds of recommendations a shift with no real review — the gate exists on paper only. *Asymmetric friction:* override is hard, accept is easy — the captured agreement is meaningless. *Alarm fatigue:* so many low-value alerts that reviewers reflexively dismiss, including the rare true positive. *Discarding overrides:* losing the single richest signal of where humans disagree with the model.

**Feeds artifacts** — Architecture HIL/gate design + autonomy-tier table; Governance human-oversight control; Mobilization workflow build; Business case (the gate as safety feature).

**Maturity** — Production-ready.

---

### PATTERN RAI-03 · Model card + intended-use statement

**Intent** — Require every model headed toward a clinical or payment use to carry a structured, honest description of what it is, what it is for, how it performs (overall **and by subgroup**), and — critically — what it is **not** for and where it fails — so approvers, clinicians, and auditors decide on disclosed facts, not on a demo.

**Applies to** — Every model influencing a person; mandatory for clinical, eligibility, and payment models. Lifecycle: Mobilization (authored before approval) → run/operate (kept current). Composes with MLOPS-08, RAI-04, RAI-08.

**Solution shape** — Author a **model card** (Mitchell et al., 2019, "Model Cards for Model Reporting") attached to the model version in the registry (MLOPS-03), structured to the emerging health-AI norm (CHAI model card / ONC HTI-1 DSI source attributes). It states:
- **Intended use & population** — the decision it supports, the patient/claim population it was built for, the care setting. Explicitly bounds the population (`RAI-07`).
- **Inputs & outputs** — what data it consumes, what it produces (a score, a flag, a recommendation), and how the output should be interpreted (and how it should *not*).
- **Performance** — metrics overall *and broken out by subgroup* (`RAI-08`), with the operating threshold and what it means; calibration; the validation dataset and date.
- **Limitations & known failure modes** — populations or conditions where it underperforms, distribution assumptions, and the consequences of error.
- **Fairness assessment summary** — the subgroup analysis and the chosen fairness criterion (`RAI-08`).
- **Provenance** — training data source + version, model type, owner, approval status, and revalidation date.
- **Funding/development source & whether it is locked or learning** (PCCP status, `RAI-16`) — required transparency under ONC HTI-1 DSI for certified health IT.

The card is a **living artifact**, versioned with the model; a card that no longer matches the deployed model is worse than none.

**Own-it vs rent** — **OWN.** The model card is the client's documentation and approval evidence. For a third-party model, the client must obtain enough of this disclosure to author an equivalent card; **a vendor model that cannot supply intended use, subgroup performance, and limitations is unfit for high-stakes use** — you cannot approve what you cannot describe.

**Where it sits** — Governance tier; attached to the registered model version. Lifecycle: Mobilization + run/operate.

**Evidence anchors** — Mitchell et al., "Model Cards for Model Reporting," FAccT 2019; CHAI (Coalition for Health AI) Applied Model Card direction; ONC HTI-1 final rule decision-support intervention (DSI) "source attributes" transparency requirements (45 CFR Part 170); FDA GMLP transparency principle. Sourced.

**Anti-patterns** — *No-limitations card:* a card listing only strengths and a headline accuracy, hiding the failure modes and subgroup gaps an approver needs. *Aggregate-only performance:* a card with one accuracy number and no subgroup breakdown (`RAI-08`). *Stale card:* a card describing v1 while v3 is deployed. *Demo-as-evidence:* approving on a polished demo with no card at all.

**Feeds artifacts** — Governance approval evidence; Mobilization model documentation; clinical-review packet; the transparency disclosure for `RAI-13`.

**Maturity** — Production-ready.

---

### PATTERN RAI-04 · Model approval workflow + named accountability

**Intent** — Make production deployment of a clinical/payment model an explicit, evidenced, **named-human-approved** gate with a second set of eyes — so no model reaches a patient or a payment decision on its builder's say-so, and there is always an accountable owner.

**Applies to** — Every production model in a high-stakes use; mandatory for clinical and payment. Lifecycle: Mobilization (the gate). Composes with MLOPS-08, RAI-03, RAI-05, RAI-08, RAI-09.

**Solution shape** — A defined gate before the model goes live (or its production alias moves):
1. **Required evidence bundle** — the model card (`RAI-03`), subgroup/bias assessment (`RAI-08`), clinical/local validation evidence (`RAI-09`), drift baseline + monitoring plan (`RAI-10`), explainability summary (MLOPS-16), and the intended-use/scope statement (`RAI-07`).
2. **Named approvers, never the builder alone** — the model owner *plus* an independent reviewer; for clinical, a clinical lead / physician sponsor; for payment, a compliance/risk officer; for high-risk-tier models (`RAI-06`), the governance committee (`RAI-05`).
3. **Recorded decision** — the approval (who, when, on what evidence, with what conditions/monitoring requirements) is written immutably and tied to the model version (RAI-14, MLOPS-03 tags/aliases).
4. **The AI never self-approves.** An automated retraining pipeline may *produce* a challenger, but a human approves its promotion to a high-stakes decision (ties to AbarVa's gate model: admin/maestro-only in production; the AI is never an approver).

**Own-it vs rent** — **OWN.** The approval workflow, the evidence bundle, and the accountability record are the client's governance. A RENT model the vendor "approves" on its side gives the client no client-side accountability record and no second set of eyes the client controls.

**Where it sits** — Governance tier; the Mobilization production-promotion gate. Lifecycle: Mobilization.

**Evidence anchors** — FDA GMLP (validation, human oversight, total product lifecycle); model-card practice (Mitchell et al. 2019); NIST AI RMF (Govern — accountability roles); AbarVa gate model (production = admin/maestro-only; AI never self-approves). Sourced.

**Anti-patterns** — *Self-promotion:* the engineer who built the model flips it live with no second reviewer. *Approval with no evidence bundle:* a sign-off that never saw subgroup performance, validation, or limitations — a rubber stamp. *AI-approving-AI:* a pipeline auto-promoting a model into a clinical decision with no human gate. *No named owner:* a production model nobody is accountable for when it fails.

**Feeds artifacts** — Governance approval workflow + record; Mobilization gate definition; compliance evidence; the input to `RAI-05` committee review.

**Maturity** — Production-ready.

---

### PATTERN RAI-05 · Clinical AI governance committee

**Intent** — Stand up the standing, multidisciplinary body that owns AI risk decisions across the organization — what gets approved, on what evidence, with what monitoring, and when something gets pulled — so accountability is institutional and continuous, not ad hoc per project.

**Applies to** — Any organization deploying more than a handful of clinical/payment models; the governance home for `RAI-04`, `RAI-06`, `RAI-11`, `RAI-12`. Lifecycle: Architecture (charter) → run/operate (standing cadence).

**Solution shape** — Charter a **Clinical AI Governance Committee** (or AI Oversight Committee) with:
- **Composition** — clinical leadership (CMO/CMIO or delegate), data science/ML, compliance & privacy, legal/risk, health equity, IT security, and a patient-safety/quality representative; for payment models, revenue-cycle/utilization-management leadership. Equity representation is deliberate, not optional, given `RAI-08`.
- **Mandate** — approve high-risk models into production (`RAI-04`/`RAI-06`), set the risk-tiering policy, review monitoring and adverse-event reports (`RAI-11`/`RAI-12`) on a standing cadence, own the decision to pause/roll back a model, and maintain the responsible-AI policy (`RAI-17`).
- **Cadence & evidence** — a regular meeting reviewing the model inventory (`RAI-06`), new approvals, drift/quality dashboards (`RAI-10`), incidents, and override trends (`RAI-02`); decisions are recorded.
- **Authority to stop** — explicit authority and a defined path to pause or retire a model (`RAI-11`), independent of the team that built it.

This mirrors the institutional-review-board model clinicians already trust and is the human structure NIST AI RMF "Govern" assumes exists. It is the body that makes "the client owns the governance" concrete.

**Own-it vs rent** — **OWN.** The committee is the client's institutional accountability — it cannot be outsourced to a vendor. A vendor may supply evidence into it, but the approve/monitor/stop authority is the client's.

**Where it sits** — Governance tier (organizational). Lifecycle: Architecture (charter) + run/operate.

**Evidence anchors** — NIST AI RMF Govern function (organizational accountability structures); emerging health-system AI governance practice (e.g. published frameworks from academic medical centers; CHAI assurance-lab direction); analogous to the IRB / P&T committee model. Committee cadence and composition are organizational choices — *confirm with client governance leadership.*

**Anti-patterns** — *No standing body:* each model team self-governs, so risk decisions are inconsistent and nobody owns the portfolio. *Committee with no teeth:* a body that reviews but cannot stop a model. *No equity seat:* a committee with no health-equity representation approving clinical models — the structural precondition for the `RAI-08` failure. *Vendor-run governance:* outsourcing the approve/stop authority to the model vendor.

**Feeds artifacts** — Governance operating model + committee charter; Mobilization governance milestone; the standing review of `RAI-06`/`RAI-10`/`RAI-11`.

**Maturity** — Production-ready (the discipline; institutional maturity varies by client).

---

### PATTERN RAI-06 · Model inventory + risk tiering

**Intent** — Keep a complete register of every AI/ML model in use, classified by risk, so governance attention, evidence requirements, and monitoring intensity scale to the stakes — and so "what AI do we have running, and where?" has a single answer.

**Applies to** — Every organization with more than a couple of models; the foundation the committee (`RAI-05`) governs against. Lifecycle: Architecture → run/operate (living register).

**Solution shape** — Maintain a **model inventory** (a governed table / register, ideally backed by the UC Model Registry, MLOPS-03) with one row per model: name, version, owner, intended use, population, the decision it influences, deployment status, last validation/revalidation date, monitoring status, and **risk tier**. Define risk tiers by impact and reversibility, mapped to the EU AI Act's risk categories where relevant:
- **High risk** — influences a clinical care decision or a payment/coverage decision affecting a person (diagnosis, triage, dosing, denial, eligibility). Full evidence bundle (`RAI-04`), committee approval (`RAI-05`), mandatory subgroup eval (`RAI-08`), clinical validation (`RAI-09`), continuous monitoring (`RAI-10`), HIL (`RAI-02`).
- **Medium risk** — operational/administrative with indirect patient or financial impact (scheduling optimization, documentation assist, coding suggestion). Lighter but defined gate; monitoring required.
- **Low risk** — back-office, no patient/payment impact (e.g. internal search ranking). Standard MLOps hygiene.
The tier sets the evidence bar and review cadence; "shadow IT" models (a clinician using a consumer LLM off-platform) are a governance gap the inventory is designed to surface.

**Own-it vs rent** — **OWN.** The inventory and tiering policy are the client's governance asset — including rows for **third-party/vendor** models in use, which must be inventoried and tiered like any other (a vendor model influencing a clinical decision is high-risk regardless of who built it).

**Where it sits** — Governance tier. Lifecycle: Architecture + run/operate.

**Evidence anchors** — EU AI Act risk-tier structure (unacceptable/high/limited/minimal); NIST AI RMF Map (context and risk categorization); ONC HTI-1 expectation that organizations know their decision-support interventions. UC Model Registry as the inventory substrate (MLOPS-03). Sourced.

**Anti-patterns** — *No inventory:* nobody can answer "what models are live and who owns them," so governance can't scale and an incident can't be scoped. *One-size governance:* applying full clinical-validation rigor to a low-risk back-office model (slows everything) or, far worse, applying low rigor to a high-risk clinical model. *Vendor models excluded:* inventorying only home-built models while bought/embedded AI runs ungoverned. *Shadow AI invisible:* off-platform consumer-LLM use by clinicians never captured.

**Feeds artifacts** — Governance model inventory + risk-tier policy; the register the committee (`RAI-05`) reviews; Mobilization governance milestone; regulatory mapping (`RAI-15`).

**Maturity** — Production-ready.

---

### PATTERN RAI-07 · Scope-of-use limits + off-label guardrail

**Intent** — Bound each model to the population, setting, and decision it was validated for, and prevent its silent use outside that scope — because a model accurate for its intended population can be wrong and harmful when applied "off-label" to a different one.

**Applies to** — Every clinical/payment model; especially models that are easy to point at a new use. Lifecycle: Architecture (define scope) → run/operate (enforce + monitor). Composes with RAI-03, RAI-08, RAI-10.

**Solution shape** — Treat scope-of-use like a drug label:
1. **Define the validated scope** in the model card (`RAI-03`) — the population (age, condition, care setting), the decision it supports, the inputs it assumes. State the **out-of-scope** uses explicitly.
2. **Guard the boundary** — where feasible, technically gate the model so it only runs on in-scope inputs (e.g. a sepsis model that fires only in the validated care setting and patient population, not silently extended to pediatrics or a different ward); flag out-of-distribution inputs rather than scoring them confidently (composes MLOPS-07 data-drift detection at the input).
3. **Govern scope changes** — extending a model to a new population or decision is a **new intended use** that re-enters the approval gate (`RAI-04`) and requires its own validation (`RAI-09`) and subgroup eval (`RAI-08`) — not a config change someone makes quietly.
4. **Monitor for scope creep** — watch for the input distribution drifting outside the validated population (the model getting used off-label in practice) and alert.

**Own-it vs rent** — **OWN.** The scope definition and the guardrail are the client's governance. A RENT model whose vendor silently extends its scope (or whose scope the client can't pin down) is a governance risk the client can't control.

**Where it sits** — Governance + serving (input guardrail). Lifecycle: Architecture + run/operate.

**Evidence anchors** — FDA SaMD intended-use / indications-for-use framing (a model's clearance is bounded to its intended use); GMLP (clinically relevant performance for the intended use and population); out-of-distribution detection literature. The off-label-use risk is qualitative — no numeric claim.

**Anti-patterns** — *Off-label deployment:* a model validated on adults silently applied to children, or a one-hospital-validated model rolled to a different population with different base rates — accuracy collapses. *Scope creep by config:* extending the model to a new decision without re-validation or re-approval. *Confident OOD scoring:* a model emitting a confident score for an input far outside its training distribution instead of flagging "I don't know."

**Feeds artifacts** — Architecture scope/guardrail design; model card intended-use section; Governance scope-change policy; Mobilization input-guardrail build.

**Maturity** — Production-ready.

---

### PATTERN RAI-08 · Subgroup / bias evaluation — the Obermeyer discipline

**Intent** — Detect and mitigate biased or inequitable model behavior across protected and clinically-relevant subgroups before deployment and continuously after — because aggregate accuracy hides subgroup harm, and the label itself can encode historical inequity. **Ethically and legally non-negotiable for clinical, eligibility, and payment models.**

**Applies to** — Every model affecting people; **mandatory** for clinical-risk, eligibility, and payment models. Lifecycle: Mobilization (eval gate) → run/operate (subgroup drift). **One of the two most important patterns in this pack.** Composes with MLOPS-15, RAI-04, RAI-10.

**Solution shape** — Bake equity into the evaluation and approval gate:
1. **Subgroup performance** — report metrics (sensitivity/recall, specificity, precision, AUC, **calibration**) **broken out by subgroup**: race/ethnicity, sex, age, language, disability, payer, geography. A model 90% accurate overall can be dangerous for a minority subgroup.
2. **Choose and justify a fairness criterion for the context** — demographic parity, **equal opportunity** (equal true-positive rate — often right for "who gets care/intervention"), equalized odds, or **calibration-within-groups**. State which and why; the right criterion is a clinical/ethical judgment, not a default.
3. **The proxy/label-bias interrogation** — ask whether the **label or features encode historical inequity.** The canonical case: a widely-used commercial care-management risk algorithm used **healthcare cost as a proxy for health need**; because the health system historically spent less on Black patients at equal sickness, the algorithm systematically under-identified them for extra care — it reduced the number of Black patients flagged for additional help to roughly **half** what an unbiased need-based measure would (**Obermeyer, Powers, Vogeli & Mullainathan, *Science* 366:447–453, 2019**). The model was not "wrong" on its label — *the label was the bias.*
4. **Mitigation, documented** — re-define the label to the actual health outcome (not cost), reweight/resample, apply fairness constraints, or per-subgroup threshold adjustment **with explicit clinical justification** — never silent, always recorded in the model card.
5. **Gate on it** — `RAI-04` does not approve a high-stakes model without the subgroup assessment; `RAI-10` monitors subgroup performance over time (a model can drift into bias).

**Own-it vs rent** — **OWN.** The fairness assessment, subgroup data, and mitigation decisions are the client's auditable equity record. **A RENT model whose fairness you cannot inspect (closed weights, no subgroup reporting) is disqualified for high-stakes use** — you cannot certify, under Section 1557, equity you cannot see.

**Where it sits** — Governance + Mobilization gate; subgroup drift in monitoring (`RAI-10`). Lifecycle: Mobilization + run/operate.

**Evidence anchors** — Obermeyer et al., "Dissecting racial bias in an algorithm used to manage the health of populations," *Science* 366:447–453 (2019) — the "~half" figure is from this paper. Fairness definitions: Hardt, Price & Srebro, "Equality of Opportunity in Supervised Learning," NeurIPS 2016. Regulatory: **HHS/OCR Section 1557 final rule (45 CFR Part 92)** — covered entities must make reasonable efforts to identify and mitigate discrimination from patient-care decision-support tools; FDA GMLP (representativeness of data, bias management); NIST AI RMF (Measure — harmful bias); CHAI assurance direction. Client-specific disparities are *estimate — confirm with client data.*

**Anti-patterns** — **Ship a clinical/payment model with no subgroup/bias evaluation** — the flagship anti-pattern: an aggregate-accurate model that systematically under-serves a protected group, deployed because nobody disaggregated. *Cost-as-proxy-for-need* (or any proxy label encoding historical inequity) used unexamined — the Obermeyer trap. *Aggregate-only reporting* hiding subgroup harm. *Silent per-group thresholding* with no clinical/ethical justification. *One-time check:* evaluating bias at launch and never again as the population drifts.

**Feeds artifacts** — Governance responsible-AI/equity control; Mobilization fairness gate; model card subgroup section; Business case (equity + Section 1557 defensibility); domain clinical-validation spec.

**Maturity** — Production-ready (the discipline; methods evolving).

---

### PATTERN RAI-09 · Clinical validation + local performance evidence

**Intent** — Require that a model is validated for clinical performance **on the client's own population and workflow** — not only on its development data or a vendor's external benchmark — before it influences care, because external accuracy rarely transfers unchanged to a new site's case-mix and data.

**Applies to** — Every clinical model and every bought/embedded clinical model before local go-live. Lifecycle: Mobilization (validation gate) → periodic revalidation (`RAI-10`). Composes with RAI-04, RAI-08, RAI-10.

**Solution shape** — Establish a **local validation** step distinct from the developer's internal eval:
1. **Silent/shadow evaluation on local data** — run the model on the client's own recent population without acting on its output (composes MLOPS-10 shadow deployment), and compare predictions to local ground-truth outcomes. This catches the case where a model with strong published metrics performs poorly on the local case-mix, coding patterns, or EHR data quirks.
2. **Clinically meaningful metrics at the operating threshold** — not just AUC, but sensitivity/specificity, positive/negative predictive value at the chosen alert threshold, and number-needed-to-alert / alert burden, because a model with great AUC can still generate an unworkable false-alarm rate at the threshold the workflow uses.
3. **Subgroup validation locally** (`RAI-08`) — equity on the local population, not the developer's.
4. **Clinical sign-off** — a physician sponsor / clinical lead reviews the local evidence and signs off as part of `RAI-04`. This is the difference between "the vendor says it works" and "we have evidence it works *here*."

**Own-it vs rent** — **OWN / MANAGED-OWN-DESTINATION.** The local validation, its data, and the clinical sign-off are the client's evidence. For a bought model, the client must still be *able* to validate it locally — **a vendor model that cannot be evaluated on the client's own data before go-live is unfit for high-stakes clinical use.** This is the recalibratable-in-house own-it requirement made concrete.

**Where it sits** — Governance + Mobilization gate. Lifecycle: Mobilization (validation) + run/operate (revalidation feeds back).

**Evidence anchors** — FDA GMLP (clinical evaluation; performance for the intended use/population/site); the well-documented external-validation performance drop in clinical prediction models (calibration drift across sites); the alert-burden / PPV-at-threshold consideration in clinical decision support. Local performance numbers are inherently *estimate — confirm with client data.*

**Anti-patterns** — *Trust the brochure:* deploying on the vendor's external accuracy with no local validation — the most common way a "validated" model underperforms at a new site. *AUC-only validation:* declaring success on discrimination while the calibration and the threshold-level false-alarm rate make it unusable in workflow. *No clinical sign-off:* a data-science-only validation with no physician accountable for the clinical claim. *Can't validate it:* accepting a black-box model you cannot run on your own data.

**Feeds artifacts** — Governance clinical-validation evidence; Mobilization local-validation milestone; model card performance section; clinical sign-off record for `RAI-04`.

**Maturity** — Production-ready.

---

### PATTERN RAI-10 · Drift detection + revalidation cadence — the Epic Sepsis lesson

**Intent** — Watch a deployed clinical/payment model continuously for input drift, prediction drift, and — the true signal — **real-world performance decay against ground truth**, and revalidate on a defined cadence, so a model does not silently degrade into harm while still emitting confident output.

**Applies to** — Every production clinical/payment model. **Non-negotiable.** Lifecycle: run/operate (continuous) + scheduled revalidation. Composes with MLOPS-07, MLOPS-17, RAI-08, RAI-09, RAI-11.

**Solution shape** — Two layers — automated monitoring and periodic human revalidation:
1. **Automated drift + quality monitoring** (the MLOPS-07 mechanism on the lakehouse): feature/input drift, prediction-distribution drift, and — once ground-truth outcomes are joined back — **model quality over time** (sensitivity, PPV, calibration, AUC), broken out by subgroup (`RAI-08`). Alert thresholds wired to the governance committee (`RAI-05`) and the rollback path (`RAI-11`).
2. **Periodic clinical revalidation** — on a cadence set by how fast the data/clinical practice moves (e.g. quarterly to annually — *confirm with client*), re-run the local validation (`RAI-09`) and re-assess subgroup equity, with clinical sign-off; record the result against the model version.
3. **Trigger-based revalidation** — a regime change (new EHR version, a coding/fee-schedule change, a population shift, a care-pathway change) forces an off-cycle revalidation.

**The lesson this pattern exists for:** the **Epic Sepsis Model**, deployed widely as a vendor-provided early-warning score, was externally validated by Wong et al. on >27,000 patients at a major health system and found to perform **substantially worse than its marketing claimed** — an AUC of roughly **0.63** in external validation versus the **0.76–0.83** the developer reported — missing about **two-thirds of sepsis cases** while generating a high false-alert burden, and the model had **not been independently validated at scale before widespread deployment** (**Wong et al., *JAMA Internal Medicine* 181(8):1065–1070, 2021**). The lessons are exactly this pack: validate locally (`RAI-09`), watch performance against ground truth continuously (`RAI-10`), do not trust the developer's reported metrics as your operating evidence, and retain the ability to recalibrate or pull the model (`RAI-11`).

**Own-it vs rent** — **OWN.** The monitoring data, the drift dashboards, the revalidation evidence, and the recalibration capability are the client's. **A RENT model the client cannot monitor against local ground truth, cannot recalibrate, and cannot independently revalidate is exactly the Epic-Sepsis failure mode** — disqualified for high-stakes use.

**Where it sits** — Governance + serving. Lifecycle: run/operate (continuous) + scheduled.

**Evidence anchors** — Wong, Otles, Donnelly, et al., "External Validation of a Widely Implemented Proprietary Sepsis Prediction Model in Hospitalized Patients," *JAMA Internal Medicine* 181(8):1065–1070 (2021) — the AUC and missed-case figures are from this study and its reporting. FDA GMLP (monitoring deployed performance; total product lifecycle); NIST AI RMF (Measure/Manage — ongoing monitoring); EU AI Act Art. 9 (continuous risk management) & Art. 72 (post-market monitoring). Revalidation cadence and drift thresholds are workload-specific — *estimate — confirm with client data.*

**Anti-patterns** — **No performance monitoring against ground truth — the model silently rots** while emitting confident scores (the Epic-Sepsis failure). *Inputs-only monitoring:* tracking feature drift but never joining outcomes, so you never learn the model got worse. *Trust developer metrics as operating evidence:* using the vendor's reported AUC instead of measured local performance. *No revalidation cadence:* validate once at go-live and never again.

**Feeds artifacts** — Governance monitoring + revalidation control; Mobilization monitoring milestone; the standing dashboard for `RAI-05`; the trigger into `RAI-11`; Business case (sustaining assurance cost).

**Maturity** — Production-ready.

---

### PATTERN RAI-11 · Adverse-event monitoring + safe rollback / kill-switch

**Intent** — Detect AI-related harm or near-misses quickly and be able to **stop a model fast and safely** — pause it, roll back to the prior version, or fall back to the non-AI workflow — so a degrading or harmful model can be pulled before it harms more people, with the fallback already designed.

**Applies to** — Every high-stakes clinical/payment model. Lifecycle: run/operate. Composes with RAI-05, RAI-10, RAI-12, RAI-14, MLOPS-10.

**Solution shape** — Build the stop capability and the harm signal before go-live:
1. **Adverse-event / near-miss signals** — define what "AI-related harm or near-miss" looks like for this model (a harmful recommendation acted on, a dangerous miss, a systematic error pattern), capture it from override outcomes (`RAI-02`), monitoring (`RAI-10`), and a **clinician/staff reporting channel** (a one-click "this recommendation was wrong/unsafe" path), and route it to the committee (`RAI-05`).
2. **Pre-designed fallback** — every high-stakes model has a defined **non-AI fallback workflow** (the workflow that ran before the model) so turning the model off does not leave the clinical/payment process broken. The fallback is tested, not assumed.
3. **Kill-switch + rollback** — a fast, authorized path to (a) **pause** the model (stop surfacing its output), (b) **roll back** to the prior approved version (composes MLOPS-10 alias repointing), or (c) **disable** it entirely and revert to the fallback. Authority to invoke is held by the committee / clinical leadership, not gated behind the build team.
4. **Every stop is audited and reviewed** — the invocation, reason, and post-incident review land in the trail (`RAI-14`) and feed `RAI-12`.

**Own-it vs rent** — **OWN.** The kill-switch, the rollback, and the fallback are the client's operational control. **A RENT model the client cannot pause or roll back without the vendor — or that has no non-AI fallback — is an unacceptable safety dependency** for a high-stakes use.

**Where it sits** — Serving + governance + the application workflow. Lifecycle: run/operate.

**Evidence anchors** — FDA post-market surveillance / medical-device adverse-event reporting concepts; EU AI Act Art. 72 (post-market monitoring) & serious-incident reporting (Art. 73); patient-safety event-reporting practice (analogous to a clinical safety reporting system); MLOPS-10 (alias rollback mechanism). The need for a tested non-AI fallback is qualitative.

**Anti-patterns** — *No kill-switch:* a harmful model that takes days and a vendor ticket to turn off. *No fallback:* pulling the model breaks the workflow because the manual process atrophied — so nobody dares stop it. *No harm-reporting channel:* clinicians have no fast way to flag a dangerous recommendation, so harm signals are lost. *Build-team-gated stop:* the only people who can pull the model are the people least likely to want to.

**Feeds artifacts** — Governance rollback/fallback runbook; Mobilization kill-switch + fallback design; the path from `RAI-10`/`RAI-12` to action; Business case (safety control).

**Maturity** — Production-ready.

---

### PATTERN RAI-12 · AI incident response + reporting

**Intent** — Treat an AI failure (a harmful recommendation, a systematic error, a bias discovery, a model outage affecting care) as an **incident with a defined response and reporting path** — so it is investigated, contained, reported to the right parties, learned from, and not quietly buried.

**Applies to** — Every high-stakes AI deployment; the response side of `RAI-11`. Lifecycle: run/operate. Composes with RAI-05, RAI-11, RAI-14, and the GOV pack incident patterns.

**Solution shape** — Extend the organization's incident-response process to AI:
1. **Detect & triage** — an AI incident arrives from monitoring (`RAI-10`), the harm-reporting channel (`RAI-11`), an override-outcome pattern (`RAI-02`), or an external report. Triage by severity (patient harm? systematic? ongoing?).
2. **Contain** — invoke the kill-switch/rollback/fallback (`RAI-11`) to stop ongoing exposure.
3. **Investigate** — root-cause using the immutable decision trail (`RAI-14`): what did the model see, what did it output, who acted, was it drift / data issue / scope creep / bias / a genuine model defect.
4. **Report** — to the governance committee (`RAI-05`) always; to patient-safety/quality, to the vendor (for a bought model), and **to regulators where required** (FDA adverse-event reporting for a regulated SaMD; EU AI Act serious-incident reporting for high-risk systems; breach reporting if PHI was involved). Define the reporting thresholds and owners in advance.
5. **Learn** — corrective action (revalidate, recalibrate, fix the pipeline, adjust scope/threshold, retire), recorded; feed back into the model card and the policy (`RAI-17`).

**Own-it vs rent** — **OWN.** The incident process, the investigation, and the corrective-action record are the client's. For a vendor model the client still owns the incident response *to its own patients* and the regulatory-reporting obligation — it cannot be wholly delegated to the vendor.

**Where it sits** — Governance tier; ties to serving (containment) and audit (investigation). Lifecycle: run/operate.

**Evidence anchors** — EU AI Act Art. 73 (serious-incident reporting for high-risk AI); FDA medical-device adverse-event / MDR reporting for regulated SaMD; NIST AI RMF (Manage — incident response); existing healthcare incident-management practice (analogous to a patient-safety event and a security incident process). Reporting thresholds are regulatory/contractual — *confirm with client compliance/legal.*

**Anti-patterns** — *No AI incident process:* an AI harm handled (or not) ad hoc, with no investigation or reporting. *Under-reporting:* failing to make a required regulatory report because no threshold/owner was defined. *No root-cause:* turning the model back on after an incident without understanding why it failed. *No learning loop:* the same failure recurs because corrective action was never recorded or fed back.

**Feeds artifacts** — Governance AI incident-response runbook + reporting matrix; Mobilization IR milestone; the corrective-action record into `RAI-17`; compliance evidence.

**Maturity** — Emerging.

---

### PATTERN RAI-13 · Patient & clinician transparency + disclosure

**Intent** — Be honest, to clinicians and to patients, about where AI is influencing a decision — what it does, its limits, and the fact that a human decides — so trust is earned, autonomy is respected, and the emerging transparency obligations are met.

**Applies to** — Any AI influencing care or coverage that a clinician or patient interacts with or is affected by. Lifecycle: Architecture (decide the disclosure) → run/operate. Composes with RAI-03, RAI-16.

**Solution shape** — Two audiences, two disclosures:
1. **Clinician-facing transparency** — at the point of use, the clinician sees that the recommendation is AI-generated, its confidence, its explanation (MLOPS-16), its provenance, and a link to its intended-use/limitations (the model card, `RAI-03`). ONC HTI-1 DSI **source attributes** require certified health IT to surface this kind of "nutrition label" for decision-support interventions. The clinician must be able to tell an AI suggestion from a clinical rule from a guideline.
2. **Patient-facing disclosure** — a clear, policy-defined position on when and how patients are told AI was involved in a decision affecting them, consistent with the organization's consent and communication norms and any applicable law (some jurisdictions and the EU AI Act's transparency provisions push toward disclosure of AI interaction). The disclosure states, in plain language, that AI assisted and a clinician/qualified human made the decision (ties to `RAI-01`).
3. **No deception** — never present AI output as a human's, and never present a recommendation as a certainty.

**Own-it vs rent** — **OWN.** The disclosure policy and the in-workflow transparency are the client's. A vendor model embedded with no surfaced source attributes makes the client unable to meet its transparency obligation — a procurement requirement (ties to the SISRC pack and ONC HTI-1).

**Where it sits** — The application workflow + governance (policy). Lifecycle: Architecture + run/operate.

**Evidence anchors** — ONC HTI-1 final rule decision-support intervention (DSI) source-attribute transparency for certified health IT (45 CFR Part 170); EU AI Act transparency provisions (users informed they are interacting with / affected by AI); AMA and professional-society guidance on disclosure of AI use in care; FDA GMLP transparency principle. The patient-disclosure threshold is policy/jurisdiction-specific — *confirm with client legal/ethics.*

**Anti-patterns** — *Hidden AI:* a model shaping care or coverage with neither clinician nor patient aware. *AI-as-oracle:* presenting a recommendation as certainty with no confidence or limits, inviting automation bias. *No source attributes:* certified health IT surfacing decision support with none of the required transparency metadata. *Disclosure theater:* a buried, unreadable AI disclaimer nobody sees.

**Feeds artifacts** — Governance transparency/disclosure policy; the in-workflow transparency UI spec; model card public-facing summary; Mobilization transparency milestone.

**Maturity** — Emerging.

---

### PATTERN RAI-14 · Evidence + immutable decision audit trail

**Intent** — Keep an immutable, queryable record of every consequential AI-influenced decision — the inputs, the model version, the output, the explanation, and the **human's accept/override** — so any decision can be reconstructed, defended to a regulator or in litigation, and analyzed for harm or bias.

**Applies to** — Every high-stakes clinical/payment model; the evidentiary backbone of HIL (`RAI-02`), incident response (`RAI-12`), and bias monitoring (`RAI-08`). Lifecycle: run/operate. Composes with MLOPS-20, GOV-07.

**Solution shape** — Persist, per consequential decision, an immutable row (a Delta decision-ledger table in the client's Unity Catalog, MLOPS-20; protected like any audit log, GOV-07 — Object Lock immutability): timestamp; **model name + resolved version** (alias → concrete version); input feature values (or a governed reference); prediction + score; the **explanation** (MLOPS-16); retrieved sources for any GenAI (MLOPS-13); and the **human's accept/override + identity + (optional) rationale**. The ledger answers, for any decision, "what did the model see, what did it say, who decided, and why," and supports cohort queries ("show every decision this model version made for this subgroup") that feed `RAI-08` and `RAI-10`. It is the evidence base for `RAI-12` investigations and for a malpractice or regulatory defense.

**Own-it vs rent** — **OWN.** The decision ledger is a client-owned, immutable asset in the client's estate. **A RENT system where the decision trail lives on the vendor's side fails audit, fails litigation-readiness, and fails the recalibratable/inspectable own-it test.**

**Where it sits** — Governance + serving. Lifecycle: run/operate.

**Evidence anchors** — MLOPS-20 (inference/decision ledger mechanism); GOV-07 (immutable audit, S3 Object Lock); EU AI Act Art. 12 (automatic record-keeping/logging for high-risk AI); HIPAA audit-control requirement (45 CFR §164.312(b)); FDA GMLP (traceability). Sourced.

**Anti-patterns** — *No decision trail:* AI-influenced clinical/payment decisions with no record of inputs, version, or who acted — indefensible and un-investigable after a bad outcome. *Prediction-only logging:* capturing the score but not the human decision — losing the override signal and the accountability link. *Mutable logs:* a decision record editable after the fact — useless as evidence. *Trail on the vendor's side:* the client cannot produce its own decision evidence.

**Feeds artifacts** — Governance audit/record-keeping control; Mobilization auditability milestone; the data source for `RAI-08`/`RAI-10`/`RAI-12`; Business case (litigation/regulatory defensibility); HIL workflow spec.

**Maturity** — Production-ready.

---

### PATTERN RAI-15 · Regulatory mapping — GMLP / Section 1557 / NIST AI RMF / EU AI Act

**Intent** — Produce the artifact that makes a clinical-AI deployment defensible to a regulator and a Chief Compliance/Medical Officer: a control-by-control mapping from the relevant AI regulatory frameworks to the **specific patterns in this pack** that satisfy each requirement — so the responsible-AI posture is asserted with evidence, not assumed.

**Applies to** — Every clinical/payment AI deployment, especially regulated SaMD, Section-1557-covered entities, and clients with EU exposure. Lifecycle: Architecture, Business Case (de-risking), Mobilization (control backlog).

**Solution shape** — Build a living mapping table. For each framework requirement, name the satisfying pattern and the evidence reference. The reference mapping:

| Framework requirement | Satisfying pattern(s) | Evidence reference |
|---|---|---|
| **FDA GMLP** — clinical validation for intended use/population | RAI-09, RAI-03, RAI-07 | Local validation report + intended-use statement |
| **FDA GMLP** — human-AI team / human oversight | RAI-01, RAI-02 | Decision-flow + HIL gate design |
| **FDA GMLP** — bias/representativeness management | RAI-08 | Subgroup assessment + mitigation record |
| **FDA GMLP** — monitor deployed performance (TPLC) | RAI-10, RAI-11 | Monitoring dashboards + revalidation cadence |
| **FDA GMLP** — transparency | RAI-03, RAI-13 | Model card + clinician disclosure |
| **FDA** — change control for learning models | RAI-16 | Predetermined Change Control Plan (PCCP) |
| **HHS/OCR Section 1557** — nondiscrimination in decision-support tools | RAI-08, RAI-06 | Equity assessment per tool + tool inventory |
| **NIST AI RMF — Govern** | RAI-05, RAI-06, RAI-17 | Committee charter + inventory + policy |
| **NIST AI RMF — Map** | RAI-06, RAI-07 | Risk tiering + scope-of-use |
| **NIST AI RMF — Measure** | RAI-08, RAI-09, RAI-10 | Validation + subgroup + monitoring evidence |
| **NIST AI RMF — Manage** | RAI-02, RAI-11, RAI-12 | HIL + rollback + incident response |
| **EU AI Act Art. 9** — risk management system | RAI-06, RAI-10, RAI-12 | Risk register + monitoring + incident process |
| **EU AI Act Art. 12** — record-keeping/logging | RAI-14 | Immutable decision ledger |
| **EU AI Act Art. 14** — human oversight | RAI-01, RAI-02 | Action boundary + HIL gate |
| **EU AI Act Art. 72/73** — post-market monitoring + incident reporting | RAI-10, RAI-11, RAI-12 | Monitoring + rollback + reporting matrix |
| **ONC HTI-1 DSI** — decision-support transparency (source attributes) | RAI-03, RAI-13 | Model card + in-workflow source attributes |

Each delivered row carries the requirement, the pattern, the evidence reference (the actual artifact), the owner, and a status (Implemented / Planned / N-A-with-rationale). Process-only requirements (workforce training, organizational policy) are marked as the client's responsibility with the owner named. The mapping is re-validated at each material release — a stale mapping asserts a posture that no longer holds.

**Own-it vs rent** — **OWN.** The regulatory mapping and its evidence artifacts are the client's compliance IP — they survive any vendor change. **RENT contrast:** relying on a vendor's "FDA-cleared" claim for *their* product as the client's compliance — clearance covers the vendor's intended use and validation, not the client's local deployment, population, monitoring, or equity obligation (the Epic-Sepsis lesson again).

**Where it sits** — Governance tier; produced in Architecture, executed across Mobilization.

**Evidence anchors** — FDA GMLP guiding principles (2021) + Predetermined Change Control Plan guidance; HHS/OCR Section 1557 final rule (45 CFR Part 92); NIST AI RMF 1.0 (Govern/Map/Measure/Manage); EU AI Act (Reg. (EU) 2024/1689) Articles 9/12/14/72/73; ONC HTI-1 (45 CFR Part 170). *Confirm current article/section numbers and effective dates with client regulatory counsel — these instruments are actively evolving.*

**Anti-patterns** — *"It's FDA-cleared, so we're compliant":* clearance ≠ the client's deployment obligations (validation, monitoring, equity, transparency). *Borrowing the vendor's regulatory posture:* it covers the wrong boundary. *Mapping to slideware, not evidence:* an auditor wants the validation report and the decision ledger, not a claim. *Stale mapping:* never re-validated as the frameworks (and the model) change.

**Feeds artifacts** — Architecture responsible-AI compliance section (the defensibility centerpiece); Business case risk-reduction line; Mobilization control-implementation backlog; the regulatory evidence package.

**Maturity** — Production-ready.

---

### PATTERN RAI-16 · Change control for learning models (PCCP)

**Intent** — Govern how a model that updates over time (retraining, recalibration, threshold changes) is allowed to change, with a **pre-specified, approved change envelope** — so model updates stay within validated bounds and do not silently alter clinical behavior without re-review.

**Applies to** — Any model that retrains/updates in production, especially regulated SaMD. Lifecycle: Architecture (the plan) → run/operate. Composes with MLOPS-17, RAI-04, RAI-09, RAI-10.

**Solution shape** — Adopt an FDA-style **Predetermined Change Control Plan (PCCP)** mindset even where not strictly regulated:
1. **Pre-specify the allowed changes** — what may change without a full re-approval (e.g. periodic retraining on new local data using the *same* pipeline, recalibration within a bound) versus what is a **new intended use / material change** requiring full re-validation and committee re-approval (`RAI-04`): a new population, a new decision, a new feature set, a threshold change that alters clinical behavior.
2. **Define the validation each change type triggers** — automated retraining still produces a *challenger* that must pass eval + subgroup (`RAI-08`) + local validation (`RAI-09`) and beat the champion before a **human-approved** promotion (`RAI-04`). *Retraining is automated; promotion to a high-stakes decision is not* (composes MLOPS-17).
3. **Record every change** against the model version (`RAI-14`, MLOPS-03) — what changed, the validation evidence, who approved.
4. **The change envelope is itself committee-approved** (`RAI-05`) and reviewed periodically.

**Own-it vs rent** — **OWN.** The change-control plan and the change history are the client's governance. **A RENT model the vendor silently updates — changing clinical behavior without the client's re-validation or knowledge — is a governance and safety failure** (the client is accountable for behavior it didn't approve); the procurement contract (SISRC pack) must require change notification and the right to re-validate.

**Where it sits** — Governance + the MLOps lifecycle. Lifecycle: Architecture + run/operate.

**Evidence anchors** — FDA "Predetermined Change Control Plan for Machine Learning-Enabled Device Software Functions" guidance (2024/2025); FDA GMLP (the model evolves through its total product lifecycle); MLOPS-17 (drift-triggered retraining with a human-approved promotion gate). Sourced.

**Anti-patterns** — *Silent auto-update:* a model that retrains and self-promotes into a clinical decision with no validation gate or human approval (composes the MLOPS-17 anti-pattern). *Scope-changing "update":* a "retrain" that quietly becomes a new intended use without re-approval (`RAI-07`). *Vendor silent updates:* a bought model whose behavior changes via a vendor push with no client notification or re-validation. *No change record:* model behavior changed and nobody can say when, why, or who approved.

**Feeds artifacts** — Governance change-control plan (PCCP); Mobilization change-management runbook; the change history in `RAI-14`; regulatory mapping (`RAI-15`).

**Maturity** — Emerging.

---

### PATTERN RAI-17 · Responsible-AI policy + workforce competency

**Intent** — Codify the organization's responsible-AI principles in a policy everyone is held to, and build the workforce competency to use AI safely — so the patterns above are backed by a stated standard and by people trained to apply it, not just by tooling.

**Applies to** — The whole organization deploying clinical/payment AI. Lifecycle: Architecture (author) → run/operate (train, enforce, revise). The organizational wrapper around the pack.

**Solution shape** — Two complements:
1. **Responsible-AI policy** — a board/executive-endorsed statement of principles (safety, equity/non-discrimination, transparency, human accountability, privacy, the no-autonomous-clinical-action rule `RAI-01`) and the operating requirements that implement them (the gates, the committee, the inventory, the monitoring, the incident process). It names the governance committee (`RAI-05`) as the owner and references the pattern set as the implementation. NIST AI RMF "Govern" assumes this policy exists.
2. **Workforce competency** — role-based education: clinicians/reviewers trained on automation bias, on how to interrogate a recommendation's explanation, and on when/how to override and report harm (`RAI-02`/`RAI-11`); data scientists trained on the equity and validation obligations (`RAI-08`/`RAI-09`); leadership and the committee trained on the regulatory frame (`RAI-15`). HITRUST/HIPAA-style awareness training extended to responsible AI.

**Own-it vs rent** — **OWN.** The policy and the trained workforce are the client's — they cannot be outsourced. A vendor can supply tooling and evidence, but the organizational standard and the competency are the client's accountability.

**Where it sits** — Governance tier (organizational). Lifecycle: Architecture + run/operate.

**Evidence anchors** — NIST AI RMF Govern (policy, accountability, workforce); HITRUST/HIPAA workforce-training analogues extended to AI; emerging health-system responsible-AI policy practice; the automation-bias literature motivating clinician training. Policy content and training cadence are organizational — *confirm with client.*

**Anti-patterns** — *Tooling without policy:* gates and monitoring exist but no stated standard, so there is nothing to hold a team to and no executive ownership. *Untrained reviewers:* a HIL gate (`RAI-02`) staffed by clinicians never taught about automation bias or how to override — the gate degrades to a rubber stamp. *Policy-on-a-shelf:* a responsible-AI policy authored for show, never operationalized into the gates and the committee. *No revision:* a policy never updated as the regulatory frame (`RAI-15`) evolves.

**Feeds artifacts** — Governance responsible-AI policy; Mobilization training/enablement milestone; the organizational wrapper referenced by `RAI-05` and `RAI-15`.

**Maturity** — Emerging.

---

## Composition notes — how this pack feeds a Move artifact

A defensible clinical or payment AI use case composes nearly the whole pack, anchored by the prime directive and the two non-skippable healthcare disciplines:

```
PRIME DIRECTIVE:    RAI-01 (no autonomous clinical/payment action)
                    RAI-02 (genuine HIL gate, calibrated to stakes)
   ×
ACCOUNTABILITY:     RAI-05 (governance committee — owns approve/monitor/stop)
                    RAI-04 (approval gate + named accountability)
                    RAI-06 (model inventory + risk tiering)
                    RAI-17 (policy + workforce competency)
   ×
EVIDENCE TO DEPLOY: RAI-03 (model card + intended use) · RAI-07 (scope-of-use)
                    RAI-08 (subgroup/bias — the Obermeyer discipline)
                    RAI-09 (local clinical validation)
   ×
KEEP IT SAFE:       RAI-10 (drift + revalidation — the Epic-Sepsis lesson)
                    RAI-11 (adverse-event monitoring + kill-switch/rollback)
                    RAI-12 (AI incident response) · RAI-16 (change control / PCCP)
   ×
TRUST & PROOF:      RAI-13 (patient/clinician transparency)
                    RAI-14 (immutable decision audit trail)
                    RAI-15 (regulatory mapping — GMLP/1557/NIST/EU AI Act)
   ×
   composes the MLOPS pack (serving, monitoring, explainability, HIL mechanism)
   × the GOV pack (HIPAA, audit immutability, access control)
   × domain patterns (POPH / CLIN / PAYER)
```

**The three things to never skip for a clinical or payment model:** `RAI-01` (no autonomous action), `RAI-08` (subgroup/bias evaluation), and `RAI-10` (drift + revalidation against local ground truth). A clinical or payment AI artifact that does not cite all three is incomplete by definition — and is, respectively, the autonomous-harm failure, the Obermeyer failure, and the Epic-Sepsis failure waiting to happen. Every quantitative claim above that is not sourced to a cited study is flagged "estimate — confirm with client data."
