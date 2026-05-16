# Scenario · First Capital — FedNow Fraud Monitoring & Model Risk

**Tenant:** First Capital Financial (Truist-class super-regional bank composite)
**Decision archetype:** Regulated AI / model-risk — ML fraud-and-AML monitoring for real-time (FedNow) payments, under SR 11-7 model-risk governance
**North-Star loop covered:** Context → Intelligence → Move → Source → Tower → Outcome
**Why this decision:** First Capital is launching/scaling real-time payments (FedNow). Real-time settlement removes the clawback window, so fraud and AML transaction monitoring must move from batch rules to ML scoring — and any ML model in financial crimes is gated by SR 11-7 model risk management and the bank's active BSA/AML consent-order context. This is the bank's hardest governance test.

> **How to use this script.** Each step names the surface, what it shows, the expert judgment applied, the artifact produced, and the seed evidence drawn on. Surfaces: Intelligence (Sentinel) · Moves = `/programs` (Nexus) · Source (Sentinel) · Tower (Atlas). Sign in as the First Capital CIO demo account. **Disclosure note:** AML KPIs carry *legal-privileged + program-scoped* disclosure — the script respects that throughout.

---

## Step 0 · Context Layer — what the tenant already knows

**Surface:** Setup / Data Trust view (Steward).
**Shows:** First Capital intelligence-layer overlay loaded — 36 KPIs, 7 pattern packs, 9 telemetry sources, regulatory-aware dual-scope access control. Relevant segments:

- KPI cluster **2.8 Risk & Compliance** — AML False Positive Rate **96%** vs 85% target; SAR Filings ~140/month; **Regulatory Exam Findings (Open) = 12** (low-severity through Matters Requiring Attention); Operational Risk Losses $28M; Consumer Fraud Loss Rate 4.2 bps vs <3.5 bps target.
- KPI cluster **2.9 Cross-functional** — **Model Risk Management Maturity (SR 11-7) = Intermediate**, target Advanced; AI Governance Maturity Stage 2 → Stage 4.
- Pattern **3.1 AML/BSA Compliance Modernization** — active consent-order context, 96% false-positive rate, ML adoption *blocked by the model risk management process*, legacy monitoring platform.
- Pattern **3.3 Shadow AI in Lending and Customer Operations** — fair-lending / model-discrimination sensitivities.
- Vendor landscape — AML/BSA monitoring: **NICE Actimize, SAS, Oracle FSAA, Verafin**; analytics: Snowflake, Databricks, Azure; AI/ML: Microsoft Azure (with FIDS BAA-equivalents), internal ML platforms.

**Expert judgment:** Steward enforces the regulatory dual-scope — AML KPIs are *legal-privileged*, disclosed only to BSA/AML, Compliance, Legal and Executive scopes; everything else sees aggregate-only. External disclosure is prohibited.
**Artifact:** Context readiness snapshot — risk/compliance and model-risk segments green within privileged scope; legal-privileged handling flagged for every downstream artifact.

---

## Step 1 · Intelligence — identify and pressure-test the bet

**Surface:** Intelligence (`/intelligence`), Sentinel-fronted.
**Shows:** The pattern-to-Move funnel. Sentinel surfaces **Pattern 3.1 AML/BSA Compliance Modernization** crossed with the FedNow operating reality: real-time settlement compresses the fraud-detection window to seconds.
**Expert judgment (AI product leader + security/governance lead):** Sentinel pressure-tests:

- *Right bet?* Yes — batch rule monitoring cannot govern real-time payments; 96% false-positive rate plus 12 open exam findings means the current posture will not survive a FedNow volume increase.
- *The decisive risk — model risk:* Pattern 3.1's root cause is explicit: *ML adoption is blocked by the model risk management process*. SR 11-7 maturity is only Intermediate. So the bet is not "buy a fraud model" — it is "build the MRM capability that lets an ML monitoring model be approved and supervised." Without that, the model cannot be deployed.
- *Regulatory gating:* The active consent-order context means the regulator must be engaged constructively on the modernisation roadmap — this is a regulator-visible program, not a quiet build.
- *Fair-treatment caveat (Pattern 3.3):* an ML model influencing customer transactions carries fair-treatment/discrimination exposure.

**Artifact / decision:** A pressure-tested, **legal-privileged bet brief** — "Stand up MRM-compliant ML fraud/AML monitoring for FedNow real-time payments, with a regulator-engagement track" — promoted into Moves.
**Evidence drawn on:** Pattern packs 3.1 and 3.3; Risk & Compliance KPI cluster 2.8; Model Risk Management Maturity KPI 2.9.3.

---

## Step 2 · Move — shape it into a governed initiative

**Surface:** Moves (`/programs`), Nexus-fronted. Create / open the **FedNow Fraud & AML Monitoring** Move.
**Shows:** Phase trace P0 originate → P1 charter → P2 diagnose → P3 design, with squad, gates, and a regulatory-milestone overlay.

- **Sponsor logic (transformation partner):** Pattern 3.1 specifies the sponsor profile — **Chief Compliance Officer** as executive sponsor, with **CFO and Chief Risk Officer** partnership; high political capital given the regulatory context. Nexus proposes exactly that, plus a Model Risk / MRM owner and a Legal owner for the consent-order interface.
- **Solution archetype:** Nexus classifies this as **human-in-loop assistant**, explicitly *not* full agentic workflow. ML scores and prioritises alerts; human investigators decide SAR filing. Regulatory accountability and SR 11-7 make autonomous decisioning a non-starter.
- **Workflow decomposition:** real-time transaction stream → ML alert scoring → alert prioritisation → investigator review → SAR decision/filing → feedback loop into model tuning. Exceptions: model-low-confidence, novel typologies, model-drift triggers.
- **Control & eval matrix (the heart of this Move):** SR 11-7 model validation and independent review; model-drift monitoring; fair-treatment/discrimination testing; explainability for investigators and examiners; a **regulatory engagement plan** as a first-class deliverable; audit trail for every model decision.
- **Gate / milestone:** P3 cannot pass until MRM validation readiness and the regulator-engagement plan are in place — a hard gate.

**Artifact / decision:** P3 solution design, archetype call, SR 11-7 control matrix, regulator-engagement plan; the **sourcing strategy** deliverable opened → triggers Source.
**Evidence drawn on:** Pattern 3.1 (sponsor profile, phase-mapped deliverables, intervention options); Pattern 3.3 (fair-lending sensitivity); MRM Maturity KPI.

---

## Step 3 · Source — choose the commercial / partner / vendor path

**Surface:** Source, Sentinel-fronted, entered from the Move's sourcing-strategy deliverable. **Legal-privileged handling applies.**
**Shows:** A sourcing event for the FedNow fraud/AML monitoring capability.
**Expert judgment (IT sourcing advisor):** Sentinel runs Stage 0–2 of the sourcing methodology:

- **Demand challenge:** Three lanes, not one SI RFP — (a) the monitoring **platform / ML model** (an AML-vendor decision: NICE Actimize, SAS, Oracle FSAA, or Verafin, all in the seeded landscape), (b) **MRM / model-validation capability** — independent validation may need an external model-risk partner, and (c) **investigator workflow + regulator-engagement** work, largely internal with Compliance and Legal.
- **Build / buy / partner gate:** The ML model itself is **buy** (incumbent AML vendors offer MRM-ready models); standing up SR 11-7 validation is **partner**; regulator engagement is **internal**. Premature single-SI selection would conflate these and weaken the regulatory story.
- **Vendor risk (decisive):** Sentinel makes **MRM-readiness a hard pass/fail gate** — any vendor model must ship validation documentation, explainability suitable for examiners, drift monitoring, and a defensible fair-treatment testing record. Vendors that cannot support SR 11-7 are screened out before TCO comparison.
- **Market intelligence:** normalise vendor responses on model transparency, false-positive reduction evidence, real-time throughput, regulatory references, and transition cost from the legacy platform.

**Artifact / decision:** A **legal-privileged sourcing strategy** — three-lane decomposition, build/buy/partner gate resolved, MRM-readiness as a pass/fail screen, commercial controls — written back to the Move.
**Evidence drawn on:** Vendor landscape (NICE Actimize, SAS, Oracle FSAA, Verafin; Azure with FIDS BAA-equivalents); Pattern 3.1 false-positive baseline (96% = the cost case).

---

## Step 4 · Tower — track value, risk, adoption, outcomes

**Surface:** Tower, Atlas-fronted. Open the First Capital portfolio; find **FedNow Fraud & AML Monitoring**.
**Shows:** The Move as a portfolio card — projected value, regulatory risk posture, adoption readiness, dependency on the Source event. Disclosed within privileged scope.
**Expert judgment (CFO portfolio operator + governance lead):** Atlas ranks the executive action:

- **Projected value** — false-positive rate reduction (toward 85% from 96%), investigator productivity gain, consumer fraud-loss-rate improvement, and a credible path toward closing open exam findings (12) and consent-order commitments.
- **Risk / dependency (the executive headline)** — the **SR 11-7 MRM validation gate** and the **regulator-engagement plan** are the gating dependencies. Deploying an unvalidated model into FedNow monitoring is a *regulatory* control gap, not a schedule slip — Atlas surfaces this as the top portfolio risk.
- **Renewal / vendor risk** — legacy AML platform transition risk; the incumbent contract is leverage in negotiation.
- **Executive action this week** — confirm CCO/CFO/CRO sponsorship, lock the regulator-engagement plan, and clear MRM validation readiness before vendor selection closes.

**Artifact / decision:** Tower executive action entry + a legal-privileged line in the First Capital risk/ELT brief (board pack treats it within regulatory-commentary scope).
**Evidence drawn on:** Move milestones and SR 11-7 control matrix; Source vendor MRM gate; Risk & Compliance KPI baselines.

---

## Step 5 · Outcome — evidence feeds back to the Context Layer

**Surface:** Tower outcome ledger → Context Layer.
**Shows:** During the controlled rollout, Tower records projected → tracked → verified value: AML false-positive rate, SAR investigation quality, investigator productivity, consumer fraud loss rate, open exam-findings count, and **MRM maturity progression (Intermediate → Advanced)**.
**Expert judgment:** Atlas keeps *verified* value separate from *projected* — false-positive reduction is claimed only when supervised model performance confirms it; model-drift and fair-treatment metrics are tracked continuously, not once. All outcome evidence stays legal-privileged.
**Artifact / decision:** Outcome evidence — updated false-positive, fraud-loss, exam-findings and MRM-maturity readings — written back as fresh context segments, updating the Pattern 3.1 evidence baseline and the consent-order remediation trace.
**Loop closed:** The verified outcome, the SR 11-7 control pattern, and the build/buy/partner sourcing decision feed the context layer and the pattern graph — the next regulated-AI bet at First Capital starts from a stronger model-risk baseline.

---

## Loop coverage checklist

| Step | Surface | Produced |
|---|---|---|
| Context | Setup / Data Trust (Steward) | Context readiness snapshot (regulatory dual-scope enforced) |
| Intelligence | Intelligence (Sentinel) | Legal-privileged pressure-tested bet brief |
| Move | Moves `/programs` (Nexus) | P3 solution design + CCO sponsor logic + SR 11-7 control matrix + regulator-engagement plan |
| Source | Source (Sentinel) | Three-lane sourcing strategy with MRM-readiness pass/fail gate |
| Tower | Tower (Atlas) | Executive action + privileged portfolio line |
| Outcome | Tower outcome ledger → Context | Verified-value + MRM-maturity evidence, loop closed |

**Seed realism:** Strong. Pattern 3.1, the 2.8 Risk & Compliance KPIs, the SR 11-7 / AI-governance maturity KPIs, the consent-order context, the legal-privileged disclosure scoping, and the AML vendor landscape (NICE Actimize, SAS, Oracle FSAA, Verafin) are all seeded. **Gap noted:** the seed has no explicit *FedNow / real-time-payments* segment — the scenario uses FedNow as a plausible business trigger layered on the genuine seeded AML/MRM reality (consistent with the overlay's "AI in financial services" tracked topic). All model-risk, regulatory and vendor substance is grounded in seed data.
