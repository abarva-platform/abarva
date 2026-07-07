# Pattern Pack 02 · Clinical Performance — `CLIN`

**Domain:** Hospital / provider clinical performance — quality, safety, throughput, and outcomes.
**Audience for the squint test:** CMO, CMIO, CQO, VP Quality & Safety, VP Care Management, CNO.
**Pack code:** `CLIN` (patterns cited as `CLIN-01` … `CLIN-NN`).

This pack carries the **solution patterns** for the clinical-performance domain. It composes with the cross-cutting packs (`ARCH`, `INGEST`, `MODEL`, `MLOPS`, `GOV`, `FINOPS`) — a Move artifact selects domain patterns from here and grounds them on horizontal patterns from those.

## How this pack reads against the schema

For a **domain** pack the schema fields specialize:

- **Solution shape** = the clinical + data + AI approach — named scores, bundles, measures, model classes, and the workflow they live in.
- **Own-it vs rent** = the *solution stack* ownership posture. The default is OWN: models built **and validated on the client's own data**, auditable, locally calibrated, recalibratable. RENT (external proprietary models you cannot inspect or recalibrate) is disqualified by default and requires surfaced rationale.
- **Evidence anchors** = value math + benchmark ranges + the precise measure/score definitions a CMO will recognize, with sources.

### Two cross-cutting principles that dominate this domain

1. **The HIL gate is non-negotiable.** Clinical patterns flag; clinicians decide. There is **no autonomous clinical action** anywhere in this pack. A model surfaces a risk score, a worklist, a suggested order — a licensed human acts. This is both a safety stance and a regulatory one (the FDA's Clinical Decision Support criteria turn on whether a clinician can independently review the basis of a recommendation).
2. **Validate on your own data before you trust a clinical model — especially one you didn't build.** The single most important teaching case in this pack is the **Epic Sepsis Model** (see `CLIN-02` anti-patterns): a widely-deployed proprietary early-warning model whose real-world discrimination (AUC ~0.63 in external validation; Wong et al., *JAMA Internal Medicine* 2021) fell far below the vendor's reported figures, while generating alerts on a large majority of hospitalized patients. The lesson generalizes to the whole pack: **own-it / locally-validated models beat black-box external models you cannot audit or recalibrate.**

### Why clinical-risk weighting is higher here

In the use-case portfolio pattern (`CLIN-17`), the scoring rubric weights **clinical-risk** more heavily than in any other domain pack. A false positive in treasury forecasting wastes an analyst's hour; a false negative in a deterioration model can kill a patient. Value × feasibility × data-readiness still matter, but clinical-risk is a gating, not merely additive, factor.

### Measure & score glossary (the native vocabulary this pack speaks)

| Term | What it is | Used in |
|---|---|---|
| **HOSPITAL score / LACE+** | Validated 30-day readmission risk scores | `CLIN-01` |
| **HRRP** | CMS Hospital Readmissions Reduction Program (up to 3% Medicare penalty) | `CLIN-01` |
| **SOFA / qSOFA / SIRS** | Sepsis severity & screening criteria (Sepsis-3) | `CLIN-02` |
| **3h / 6h bundles, SEP-1** | Surviving Sepsis Campaign / CMS sepsis bundle measures | `CLIN-02` |
| **NEWS2** | National Early Warning Score 2 (deterioration track-and-trigger) | `CLIN-03` |
| **GMLOS / O/E LOS** | Geometric-mean & observed/expected length of stay | `CLIN-04` |
| **O/E, SMR, HWM** | Observed/expected & standardized mortality ratio; CMS Hospital-Wide Mortality | `CLIN-06` |
| **AHRQ PSIs (PSI-90)** | Patient Safety Indicators; CMS HACs; CLABSI/CAUTI/SSI (NHSN) | `CLIN-07` |
| **CMI, MS-DRG, APR-DRG SOI/ROM, POA** | Case Mix Index, DRG grouping, severity/risk-of-mortality, present-on-admission | `CLIN-08` |
| **NSQIP, ERAS** | ACS surgical-quality program; Enhanced Recovery After Surgery | `CLIN-09` |
| **MME, PDMP** | Morphine milligram equivalent; prescription drug monitoring program | `CLIN-11` |
| **FDA 510(k) / De Novo CDS** | Clearance pathways & Clinical Decision Support criteria for AI devices | `CLIN-12`, `CLIN-18` |

Every quantitative claim below carries a source or an explicit "estimate — confirm with client data" flag, per the README provenance rules.

---

### PATTERN CLIN-01 · 30-Day Readmission Prediction + Prevention

**Intent** — Predict which inpatients are at high risk of an unplanned 30-day readmission, and route them into a transitional-care pathway before discharge — to improve continuity and avoid HRRP penalties.

**Applies to** — Acute inpatient (esp. the HRRP cohorts: AMI, HF, pneumonia, COPD, CABG, elective THA/TKA). Lifecycle: Discovery (penalty exposure sizing), Strategy (portfolio rank), Architecture (model + worklist), Business Case (penalty + bed-day math).

**Solution shape** —
- **Risk scoring:** start with a transparent, literature-validated score as the baseline and floor — **LACE** / **LACE+** (Length of stay, Acuity of admission, Charlson comorbidity, Emergency visits in prior 6 mo) and the **HOSPITAL score** (Hemoglobin at discharge, discharge from Oncology, Sodium at discharge, Procedure during stay, Index Type admission, # Admissions in prior year, Length of stay). These are interpretable, defensible to clinicians, and a benchmark a custom model must beat.
- **Own model on top:** a gradient-boosted or regularized-logistic model trained on the client's EHR (labs, vitals, meds, prior utilization, SDOH where available), **calibrated locally** and re-validated per cohort. Report discrimination (AUC) *and* calibration (reliability curve), not AUC alone.
- **Prevention pathway (where value is actually realized):** the model is worthless without the intervention. Route high-risk patients into a **transitional-care bundle** — medication reconciliation, teach-back patient education, **follow-up appointment scheduled before discharge** (the single highest-leverage step), 48–72h post-discharge call, and pharmacist follow-up for polypharmacy. Modeled on Coleman's Care Transitions Intervention and Project RED.
- **Closed loop:** track which flagged patients received which interventions and their 30-day outcome — this is the data that retrains the model and proves the value.

**Own-it vs rent** — **OWN.** The risk model is built and validated on the client's own admissions and outcomes, lives in the lakehouse, is auditable and recalibratable per service line. The scores (LACE+/HOSPITAL) are open, published, free. Avoid RENT readmission scores embedded in a vendor analytics platform where you cannot inspect features or recalibrate when your population shifts. Care-pathway orchestration may use the EHR's native workflow tooling (Epic/Cerner) — that's an own-destination integration, not a rented model.

**Where it sits** — Gold (risk feature store + scored worklist); serving tier (discharge-planning worklist in the care-management surface); Strategy + Architecture + Business Case artifacts.

**Evidence anchors** —
- **HRRP penalty context:** CMS penalizes up to **3% of base inpatient Medicare payments** for excess readmissions; the program penalizes the large majority of participating hospitals each year. Penalty exposure is the most concrete dollar anchor in this domain — *size it from the client's own HRRP adjustment factor and excess-readmission ratios.*
- **Intervention effect:** structured transitional-care programs have reduced 30-day readmissions by roughly **20–30% relative** in published trials (Project RED, CTI) — *estimate; confirm against the client's baseline readmission rate and realistic reach/adherence.*
- **Model performance reality:** generic readmission models typically land at modest discrimination (**AUC ~0.65–0.75**); do not over-promise. Calibration and the intervention pathway matter more than chasing AUC.
- **Avoided bed-days:** each avoided readmission ≈ one full DRG payment recovered/retained + freed bed capacity — *combine with `CLIN-04` LOS math; confirm cost per bed-day with client finance.*
- Sources: CMS HRRP program rules; Jack et al. (Project RED, *Ann Intern Med* 2009); Coleman et al. (CTI, *Arch Intern Med* 2006); van Walraven (LACE); Donzé (HOSPITAL score, *JAMA Intern Med* 2013).

**Anti-patterns** —
- **Scoring without a pathway.** A risk list nobody acts on. The model is the cheap part; the transitional-care capacity is the expensive part — fund both or don't start.
- **Optimizing LOS without a readmission guardrail** (see `CLIN-04`): discharging earlier to cut LOS, then bouncing patients back, is worse than doing nothing.
- **Using a black-box vendor readmission score you can't recalibrate** when your case-mix shifts.

**Feeds artifacts** — Strategy (portfolio entry + HRRP exposure); Architecture (risk feature store, scored worklist, EHR write-back of follow-up scheduling); Business case (penalty avoidance + bed-day recovery); Mobilization (transitional-care staffing + pathway rollout).

**Maturity** — Production-ready.

> **Worked value math (illustrative — confirm every input with client data).** Take a hospital with 25,000 annual Medicare discharges, a baseline HRRP excess-readmission ratio yielding a 1.0% payment penalty on a $200M Medicare base = **$2.0M/yr penalty exposure**. A transitional-care program reaching 60% of high-risk patients with a 25% relative reduction in their readmissions, plus the freed bed-days backfilled at contribution margin, typically recovers a mid-six- to low-seven-figure blend of penalty relief + margin. The artifact must show the chain: *flagged → reached → intervention-adherent → readmission avoided → penalty/margin recovered* — each conversion rate is a defensible assumption, not a hope.

---

### PATTERN CLIN-02 · Sepsis Early Detection + Bundle Compliance

**Intent** — Detect sepsis / septic shock hours earlier and drive timely completion of the time-sensitive sepsis bundles — to cut sepsis mortality, which remains a leading cause of inpatient death.

**Applies to** — ED, inpatient floors, ICU step-down. Lifecycle: Discovery, Strategy, Architecture, Business Case. High clinical-risk weighting.

**Solution shape** —
- **Severity scoring as the clinical backbone:** **SOFA** (Sequential Organ Failure Assessment) for organ dysfunction; **qSOFA** (RR ≥22, altered mentation, SBP ≤100) as a rapid bedside trigger; SIRS criteria as the legacy screen. These are the language; the model augments them, it does not replace clinical judgment.
- **Bundle compliance (the value lever):** the **SEP-1 / Surviving Sepsis Campaign bundles** — the **3-hour bundle** (lactate, blood cultures before antibiotics, broad-spectrum antibiotics, 30 mL/kg crystalloid for hypotension/lactate ≥4) and the **6-hour bundle** (vasopressors for refractory hypotension, repeat lactate, reassessment). The system's job is to surface the suspected-sepsis patient and drive **bundle-element completion within the clock**.
- **Own early-warning model:** a model trained and validated on the client's own ED/inpatient data, tuned for a **clinically usable specificity** (alerting on everyone is the same as alerting on no one), with the alert routed into the existing rapid-response / sepsis-coordinator workflow. HIL gate: model flags → clinician confirms suspected sepsis → bundle clock starts.
- **Measurement:** track bundle compliance %, time-to-antibiotics, and risk-adjusted sepsis mortality.

**Own-it vs rent** — **OWN, emphatically.** This pattern carries the pack's defining cautionary tale. The risk model must be built/validated on the client's own population and **monitored for drift**. The bundle order sets live in the EHR (own-destination).

**Where it sits** — Gold (streaming vitals/labs feature pipeline) + serving (real-time alert into RRT workflow); Architecture + Business Case + Governance (model-monitoring obligation).

**Evidence anchors** —
- **Bundle effect:** Surviving Sepsis Campaign data associate **timely bundle completion (esp. early antibiotics)** with meaningfully lower mortality; each hour of delay to antibiotics in septic shock is associated with measurably increased mortality (Kumar et al., *Crit Care Med* 2006). *Confirm baseline bundle compliance and time-to-antibiotics from client data.*
- **Sepsis burden:** sepsis is implicated in roughly **1 in 3 inpatient deaths** and is among the most expensive inpatient conditions (CDC; HCUP). The value case is mortality + LOS + cost-per-case.
- **Value math:** (eligible septic patients) × (achievable bundle-compliance lift) × (mortality/LOS effect) — *all rates from client baseline; flag as estimate.*
- Sources: Singer et al. (Sepsis-3, *JAMA* 2016); Surviving Sepsis Campaign guidelines; CMS SEP-1 measure; CDC sepsis data.

**Anti-patterns** —
- **THE Epic Sepsis Model lesson (the canonical anti-pattern of this pack).** Wong et al. (*JAMA Intern Med* 2021) externally validated the widely-deployed proprietary Epic Sepsis Model and found discrimination (**AUC ~0.63**) far below the vendor's marketed performance, with the model **missing ~67% of sepsis cases** while firing alerts on a large share of all patients. The teaching points:
  1. **Never deploy an external clinical model without local validation against your own labeled outcomes.**
  2. **A model you cannot inspect or recalibrate is a liability**, not an asset — you can't fix what you can't see.
  3. **Marketed AUC ≠ real-world AUC** on your population. Demand independent validation and ongoing drift monitoring.
- **Alert fatigue from low-specificity early warning:** an over-firing sepsis alert trains clinicians to ignore it — the alert that cried wolf. Tune for specificity and route to a defined responder, not to everyone.
- **Autonomous action:** no system auto-orders antibiotics. It flags; a clinician decides.

**Feeds artifacts** — Strategy (portfolio); Architecture (streaming pipeline, alert routing, **mandatory model-monitoring component**); Business case (mortality/LOS value); Governance (external-model validation policy citing this anti-pattern).

**Maturity** — Production-ready *with* own-build-and-validate discipline; the rented black-box variant is reference-only-as-cautionary.

> **The four governance demands this pattern forces onto every other CLIN model (see `CLIN-18`):** (1) pre-deployment local validation against the client's own labeled sepsis outcomes; (2) reported discrimination **and** calibration **and** subgroup performance — never marketed AUC; (3) a specificity floor and alert-burden budget agreed with the clinical responders before go-live; (4) continuous drift monitoring with a defined off-switch. If a vendor cannot support all four, the model is RENT-disqualified regardless of marketing.

---

### PATTERN CLIN-03 · Clinical Deterioration / Early Warning Systems (EWS)

**Intent** — Detect general physiologic deterioration on the wards early enough to trigger a rapid response before a patient codes or is emergently transferred to the ICU.

**Applies to** — General medical/surgical inpatient wards, step-down. Lifecycle: Discovery, Strategy, Architecture. High clinical-risk weighting.

**Solution shape** —
- **Track-and-trigger baseline:** **NEWS2** (National Early Warning Score 2 — respiratory rate, SpO2, supplemental O2, temperature, systolic BP, heart rate, consciousness/AVPU; with the SpO2 Scale 2 for hypercapnic-risk patients) as the transparent, nurse-friendly standard. Aggregate score thresholds map to escalation (e.g., NEWS2 ≥7 → urgent clinical response).
- **ML EWS on top:** a model on continuous vitals + labs + nursing assessments that predicts deterioration (ICU transfer, cardiac arrest, death) several hours ahead — trained/validated locally. The reference exemplar is the **eCART / Eric Chicago-class** continuous-score approach (published, validated EWS) — own-build an equivalent on client data rather than renting a black box.
- **Response system:** the score feeds the **Rapid Response Team (RRT)** trigger and a structured escalation protocol. HIL gate: score elevates → nurse/RRT assesses → clinical action.

**Own-it vs rent** — **OWN.** NEWS2 is open and free. The ML layer is built/validated on client data, calibrated to the client's ward population, and monitored. Same anti-rent posture as `CLIN-02`.

**Where it sits** — Gold (vitals feature pipeline) + serving (ward dashboard + RRT alert); Architecture + Business Case.

**Evidence anchors** —
- NEWS2 is the UK Royal College of Physicians national standard for acute-illness deterioration; broadly validated for predicting death/ICU transfer/cardiac arrest within 24h.
- ML EWS (e.g., eCART) have shown improved discrimination over single-parameter and aggregate-score systems in published validations — *confirm lift on client data.*
- **Value math:** avoided unplanned ICU transfers and codes × (cost + mortality delta) — *estimate; confirm.*
- Sources: RCP NEWS2 (2017); Churpek et al. (eCART, *Am J Respir Crit Care Med*); Escobar et al. (Kaiser EWS, *NEJM* 2020).

**Anti-patterns** —
- **Alert fatigue** (same trap as `CLIN-02`): a noisy EWS gets muted. Tune specificity; route to a responder.
- **Deploying an external EWS without local validation** (the sepsis-model lesson generalizes).
- **No defined response:** a score with no RRT protocol behind it changes nothing.

**Feeds artifacts** — Strategy; Architecture (streaming + RRT integration); Business case; Governance (validation + monitoring).

**Maturity** — Production-ready (NEWS2 baseline; ML layer emerging→production with local validation).

> **Why start with NEWS2, then add ML — not the reverse.** NEWS2 is transparent, free, nurse-trusted, and already embedded in many escalation protocols; it sets the floor and the explainability bar. An ML EWS earns its place only by demonstrably *beating* the aggregate score on the client's own population (better lead time, fewer false alarms at equal sensitivity) — measured, not assumed. Deploying an ML EWS that a clinician can't interrogate, *without* showing it beats the score they already trust, is how you lose the ward's confidence on day one. The composition is: NEWS2 as the safety net everyone understands, ML as the earned sharpening layer — both feeding one governed RRT trigger.

---

### PATTERN CLIN-04 · Length-of-Stay (LOS) Prediction + Management

**Intent** — Predict expected LOS at/after admission, flag patients trending to excess LOS, and drive proactive discharge planning to remove avoidable bed-days — without compromising readmission safety.

**Applies to** — All inpatient service lines; care management, hospitalist, discharge planning. Lifecycle: Discovery, Strategy, Architecture, Business Case.

**Solution shape** —
- **Expected vs observed LOS:** establish a risk-adjusted **expected LOS** (GMLOS benchmarks by DRG as a floor; a client-trained model for sharper, patient-level expectation). The actionable signal is the **observed-minus-expected gap** and the patients trending toward an outlier stay.
- **Avoidable-day analytics:** classify excess days by cause (awaiting placement / SNF bed, awaiting consult, awaiting imaging, social/SDOH barrier) — this tells the operation *what to fix*, not just *who's slow*.
- **Discharge-planning workflow:** predicted discharge date + barrier list feeds the multidisciplinary rounds / care-management worklist; integrate with placement (SNF/home-health) referral early.
- **Coupled with readmission guardrail (`CLIN-01`):** LOS optimization and readmission risk are co-monitored so the operation never trades a shorter stay for a bounce-back.

**Own-it vs rent** — **OWN.** LOS model and avoidable-day logic on the lakehouse, calibrated to client DRG mix and local placement constraints. Discharge-planning workflow rides the EHR (own-destination).

**Where it sits** — Gold (expected-LOS feature + avoidable-day classification) + serving (discharge-planning worklist); Architecture + Business Case.

**Evidence anchors** —
- **Bed-day value:** the value is `avoidable bed-days × cost-per-bed-day` (variable cost for capacity-relief framing; or contribution margin of the backfilled admission). *Cost-per-bed-day is highly client-specific — confirm with finance.*
- Reductions in geometric-mean-LOS gap of a fraction of a day across high-volume DRGs compound into large annual bed-day numbers — *estimate; size from client volumes.*
- Sources: CMS DRG GMLOS tables; AHRQ HCUP LOS statistics.

**Anti-patterns** —
- **LOS optimization without a readmission guardrail** — the headline LOS anti-pattern. Discharging too early to hit a metric, then readmitting, harms patients and (under HRRP) costs more.
- **Predicting LOS without classifying avoidable-day cause** — you get a number but no lever.
- **Treating a placement/SNF bottleneck as a clinical problem** — many excess days are operational/social, not medical.

**Feeds artifacts** — Strategy; Architecture (LOS feature store, worklist, placement integration); Business case (bed-day recovery, throughput); Mobilization (care-management process redesign).

**Maturity** — Production-ready.

> **Measure definitions a CMO will check.** *Expected LOS* must be risk-adjusted (DRG + severity), not a flat DRG GMLOS, or surgeons will (correctly) say "my patients are sicker." *Observed LOS* should be defined consistently (midnight census vs hours) and reconciled to the finance definition used for cost-per-day. The headline managed metric is the **risk-adjusted O/E LOS ratio** by service line — the LOS sibling of the mortality O/E in `CLIN-06`. Report avoidable days by *cause category* (placement, consult, imaging, social) so the operating model knows whether the fix is clinical, operational, or social.

---

### PATTERN CLIN-05 · Patient Flow / Throughput / Capacity Management

**Intent** — Improve hospital-wide flow — reduce ED boarding, smooth OR scheduling, optimize bed management, and lift discharge-before-noon — to expand effective capacity without new beds.

**Applies to** — ED, bed management / patient placement, OR, hospitalist, nursing operations. Lifecycle: Discovery, Strategy, Architecture, Business Case.

**Solution shape** —
- **Demand/supply forecasting:** predict admissions (from ED + scheduled surgical), discharges, and net bed demand by unit and hour — a forecasting model on historical census + scheduling + seasonality.
- **ED boarding reduction:** predict admit-likely ED patients early to start the bed request before disposition is final; monitor **ED boarding hours** as the headline metric.
- **OR scheduling smoothing:** reduce day-to-day surgical-volume variability (the largest controllable driver of bed-demand peaks) — block-utilization analytics + smoothing, the Litvak/IHE variability-management approach.
- **Discharge-before-noon (DBN):** predict next-day discharges to enable evening prep; DBN is the most-cited flow lever because it aligns discharge timing with morning admission demand.
- **Command-center pattern:** a flow/capacity dashboard (bed status, predicted demand, boarding, blocked beds) for the bed-management / capacity-command function.

**Own-it vs rent** — **OWN** for the forecasting/optimization models and the flow data products (lakehouse). Bed-management execution may ride the EHR/bed-board tool (own-destination). Avoid a fully rented "capacity command center as a service" where the predictive IP and data live on the vendor — that is RENT and disqualified without surfaced rationale.

**Where it sits** — Gold (census/flow forecasts) + serving (capacity command dashboard); Architecture + Business Case.

**Evidence anchors** —
- **OR smoothing** (Litvak / IHO variability methodology) has produced documented capacity gains equivalent to added beds without capital — *confirm against client OR variability.*
- **DBN** programs and boarding reduction are associated with improved throughput and reduced ED LWBS (left-without-being-seen) — *estimate; size from client boarding hours and ED volumes.*
- **Value framing:** capacity unlocked = `(reduced boarding/blocked-bed hours) → backfilled admissions × contribution margin`, plus LWBS revenue capture. *Confirm margins with finance.*
- Sources: IHI/IHO patient-flow literature; Litvak (variability methodology); ACEP ED boarding statements.

**Anti-patterns** —
- **Forecasting demand with no operational response** — a pretty dashboard nobody acts on.
- **Optimizing one node (e.g., ED) while the discharge bottleneck is unchanged** — flow is a system; local optimization just moves the queue.
- **Renting a black-box capacity platform** that owns the predictive IP.

**Feeds artifacts** — Strategy; Architecture (forecasting + command dashboard); Business case (capacity unlock / margin); Mobilization (bed-management + OR-scheduling process).

**Maturity** — Production-ready.

---

### PATTERN CLIN-06 · Risk-Adjusted Mortality Modeling (O/E Ratios)

**Intent** — Measure and monitor risk-adjusted mortality — the **Observed-to-Expected (O/E)** ratio — to surface where actual mortality exceeds risk-adjusted expectation, and to defend quality reputation (Leapfrog, US News, public reporting).

**Applies to** — Quality & safety, service-line leadership, medical staff. Lifecycle: Discovery, Strategy, Architecture. High clinical-risk weighting (mortality is the most scrutinized measure).

**Solution shape** —
- **O/E ratio:** observed deaths ÷ expected deaths, where expected is risk-adjusted for case mix / severity. O/E < 1.0 = better than expected. This is the core quality lens for mortality.
- **Risk adjustment:** the credible reference methods are **3M APR-DRG severity-of-illness/risk-of-mortality**, **Elixhauser/Charlson comorbidity adjustment**, and the CMS **Hospital-Wide Mortality (HWM)** measure logic. Build an own risk-adjustment model on client data *and* reconcile to the methodology the client is publicly judged on.
- **Drill-down:** decompose O/E by service line, DRG, attending, and condition cohort (the CMS condition-specific 30-day mortality measures: AMI, HF, pneumonia, COPD, CABG, stroke).
- **Mortality review loop:** elevated-O/E cohorts feed structured mortality review (M&M) — a quality process, not an automated judgment.

**Own-it vs rent** — **OWN** the analytics and risk-adjustment models on the lakehouse so the methodology is transparent and auditable to the medical staff. APR-DRG grouper logic is a licensed-but-standard input (own-destination). Avoid a rented mortality-analytics black box where clinicians can't see the risk model — clinicians will (rightly) reject a mortality judgment they can't interrogate.

**Where it sits** — Gold (risk-adjusted mortality data product) + serving (quality dashboard); Architecture + Business Case (reputation/penalty framing).

**Evidence anchors** —
- CMS publicly reports risk-standardized 30-day mortality for AMI, HF, pneumonia, COPD, CABG, stroke; these feed Star Ratings and public profiles.
- O/E and **SMR (Standardized Mortality Ratio)** are the standard constructs; the HWM measure is the broad national mortality lens.
- **Value framing here is reputational + regulatory**, not direct cost — Star Ratings, Leapfrog grade, payer-network inclusion, volume effects.
- Sources: CMS Hospital-Wide Mortality measure spec; 3M APR-DRG documentation; AHRQ; Leapfrog.

**Anti-patterns** —
- **Comparing raw (unadjusted) mortality** across hospitals/units — meaningless without risk adjustment; invites both false alarms and false comfort.
- **A black-box risk model the medical staff can't audit** — guarantees rejection.
- **Treating an O/E signal as a verdict** rather than a trigger for structured mortality review.

**Feeds artifacts** — Strategy; Architecture (risk-adjustment model + quality dashboard); Business case (reputation/Star-rating exposure); Governance (methodology transparency).

**Maturity** — Production-ready.

> **The CDI coupling is decisive here.** The *expected* in O/E is computed from documented severity/comorbidity. If the client under-documents (low CC/MCC capture per `CLIN-08`), expected mortality is understated and the hospital's O/E looks *worse than reality* — penalizing the institution for a coding gap, not a care gap. Conversely, the quality team must never let CDI become a tool to "inflate expected" without clinical support. The honest framing: accurate documentation makes O/E *truthful*, which usually helps a hospital that has been under-coding its acuity.

---

### PATTERN CLIN-07 · Hospital-Acquired Conditions + Patient Safety (AHRQ PSIs)

**Intent** — Detect, predict, and prevent hospital-acquired conditions (HACs) and patient-safety events — measured via **AHRQ Patient Safety Indicators (PSIs)** and CMS HAC categories — to reduce harm and avoid HAC Reduction Program and non-payment penalties.

**Applies to** — Quality & safety, infection prevention, nursing. Lifecycle: Discovery, Strategy, Architecture, Business Case. High clinical-risk weighting.

**Solution shape** —
- **Measure backbone:** the **AHRQ PSIs** (e.g., **PSI-90 composite**; PSI-03 pressure injury; PSI-08 in-hospital fall with hip fracture; PSI-12 perioperative PE/DVT; PSI-13 postop sepsis; PSI-15 accidental puncture/laceration) and the device/infection HACs reported to **NHSN** — **CLABSI**, **CAUTI**, SSI, **C. diff**, MRSA bacteremia.
- **Surveillance + prediction:** move from retrospective PSI coding to **near-real-time risk prediction** — e.g., a pressure-injury risk model (augmenting the **Braden Scale**), a CAUTI/CLABSI risk model on device-day data (flag the lingering line/catheter), a fall-risk model (augmenting **Morse Fall Scale**). Each surfaces a prevention task on a worklist.
- **Prevention bundles:** the models route into evidence-based bundles (CLABSI insertion/maintenance bundle, CAUTI catheter-necessity review, mobility/turning protocols, fall-precaution flags). HIL: model flags → nurse/IP acts.
- **CDI linkage:** PSI rates are sensitive to **present-on-admission (POA)** coding — couple with `CLIN-08` so a coding artifact isn't miscounted as harm.

**Own-it vs rent** — **OWN** the surveillance and risk models on the lakehouse (auditable, recalibratable, mapped to AHRQ/NHSN definitions). NHSN reporting is a regulatory destination (own-destination). Avoid a rented safety-surveillance black box.

**Where it sits** — Gold (device-day + risk feature products) + serving (IP/nursing safety worklist); Architecture + Business Case.

**Evidence anchors** —
- **CMS HAC Reduction Program:** the worst-performing quartile of hospitals on HAC measures lose **1% of all Medicare inpatient payments** — a concrete penalty anchor; CMS also denies the incremental payment for selected HACs not present on admission.
- Device-infection bundles have driven large relative reductions in CLABSI/CAUTI in published programs (e.g., Pronovost CLABSI checklist work in Michigan) — *estimate; confirm baseline NHSN SIRs.*
- **Value math:** `(events avoided) × (cost-per-event + LOS impact)` + HAC-program penalty exposure. *Cost-per-HAC from client/AHRQ ranges; confirm.*
- Sources: AHRQ PSI/QI specs; CMS HAC Reduction Program; CDC NHSN; Pronovost et al. (*NEJM* 2006).

**Anti-patterns** —
- **Counting PSIs without POA/CDI scrutiny** — coding artifacts inflate apparent harm (couple with `CLIN-08`).
- **Retrospective-only measurement** — you learn about the CLABSI after it happened; the value is in prediction + prevention before harm.
- **Alert fatigue** on safety flags — same discipline as the EWS patterns.

**Feeds artifacts** — Strategy; Architecture (surveillance + prevention worklist); Business case (penalty + harm-cost avoidance); Governance (measure-definition fidelity).

**Maturity** — Production-ready.

---

### PATTERN CLIN-08 · Clinical Documentation Integrity (CDI) + Coding Accuracy

**Intent** — Improve the accuracy and completeness of clinical documentation so that coded severity, risk-adjustment, and quality measures reflect the true clinical picture — which simultaneously protects quality scores (O/E denominators) **and** appropriate reimbursement.

**Applies to** — CDI specialists, HIM/coding, quality, revenue integrity. Lifecycle: Discovery, Strategy, Architecture, Business Case. This is the pattern where quality and revenue are the same lever.

**Solution shape** —
- **The dual value:** documentation drives **risk adjustment** (the *expected* in every O/E and the SOI/ROM in APR-DRG) and **DRG assignment / Case Mix Index (CMI)**. Under-documentation simultaneously *understates* expected mortality/complications (making O/E look artificially bad) *and* understates reimbursement. CDI fixes both at once.
- **NLP-driven query identification:** an own NLP model on clinical notes surfaces **documentation gaps and query opportunities** — e.g., a clinical picture consistent with a CC/MCC (complication/comorbidity) that isn't documented to coding specificity (acute vs chronic, with/without specificity, linkage of manifestations).
- **Query workflow with HIL:** the model proposes a **compliant, non-leading query** to the CDI specialist, who reviews and sends it to the physician. HIL is doubly important here — leading queries are a compliance violation; the human owns the query.
- **CMI / DRG analytics:** monitor CMI trend, CC/MCC capture rate, query response rate, and SOI/ROM distributions vs peer benchmarks.

**Own-it vs rent** — **OWN** the NLP and analytics on the lakehouse — auditable, with the query logic transparent for compliance. Many CDI tools are RENT (vendor NLP black boxes). RENT can be *defensible* here if (a) the vendor's coding logic is auditable/explainable and (b) compliance has signed off — but it must be surfaced as a rent choice with rationale, and the client should still own the underlying documentation data products.

**Where it sits** — Gold (NLP-derived documentation-gap product + CMI analytics) + serving (CDI query worklist); Architecture + Business Case (the rare quality+revenue dual case).

**Evidence anchors** —
- **CMI is a direct revenue multiplier:** inpatient reimbursement ≈ `CMI × base rate × volume`; small CMI shifts on high volume are material. *Model from client CMI and base rate.*
- CDI programs commonly report CC/MCC capture and CMI improvements; the AHIMA/ACDIS literature documents typical query-impact ranges — *estimate; confirm with client baseline.*
- **Quality side:** correcting under-documented comorbidity raises *expected* mortality/complications, improving O/E without any change in actual care.
- Sources: AHIMA/ACDIS CDI practice briefs; CMS MS-DRG/CMI definitions; 3M APR-DRG SOI/ROM.

**Anti-patterns** —
- **Leading or non-compliant queries** — the model must never be tuned to "upcode"; that is fraud. Compliant, clinically-supported queries only, human-owned.
- **Treating CDI as purely revenue** — missing the quality-measure (O/E denominator) value, which is often the larger strategic prize.
- **Rented black-box query NLP with no compliance audit trail.**

**Feeds artifacts** — Strategy (dual quality+revenue case); Architecture (NLP gap detection + query worklist); Business case (CMI revenue + O/E denominator correction); Governance (query-compliance controls).

**Maturity** — Production-ready.

---

### PATTERN CLIN-09 · Surgical Outcomes + Complications

**Intent** — Predict, monitor, and reduce surgical complications — surgical site infections (SSI), returns to OR, and risk-adjusted morbidity/mortality — using the **NSQIP** framework.

**Applies to** — Surgery service lines, perioperative quality. Lifecycle: Discovery, Strategy, Architecture, Business Case. High clinical-risk weighting.

**Solution shape** —
- **Measurement backbone:** the **ACS NSQIP** (National Surgical Quality Improvement Program) risk-adjusted, observed-vs-expected outcome model — the gold standard for surgical quality benchmarking. Use NSQIP **O/E** for mortality, morbidity, and specific complications.
- **Pre-op risk prediction:** the **ACS NSQIP Surgical Risk Calculator** for shared decision-making and surfacing high-risk cases pre-op; an own model on client peri-op data for sharper local calibration.
- **Targeted complications:** **SSI** surveillance (couple with `CLIN-07`/NHSN), **returns to OR / unplanned reoperation**, post-op VTE (PSI-12), anastomotic leaks for relevant cohorts.
- **Enhanced Recovery pathway linkage:** route risk into **ERAS** protocol adherence (the dominant evidence-based lever for surgical outcomes + LOS).

**Own-it vs rent** — **OWN** the predictive models and outcome data products. NSQIP itself is a registry/benchmark the client participates in (own-destination data contribution). Avoid renting a surgical-risk black box that can't be locally validated.

**Where it sits** — Gold (peri-op outcome + risk products) + serving (surgical-quality dashboard, pre-op risk surface); Architecture + Business Case.

**Evidence anchors** —
- NSQIP participation is associated with reduced complications/mortality in the program literature (ACS) — *estimate; confirm against client's NSQIP O/E.*
- **ERAS** pathways reduce LOS and complications across multiple surgical cohorts in the published evidence — couple LOS value with `CLIN-04`.
- **Value math:** `(complications avoided) × (cost-per-complication + LOS + reoperation cost)` — surgical complications are among the most expensive avoidable events. *Confirm costs with finance.*
- Sources: ACS NSQIP; ERAS Society guidelines; AHRQ PSI-12.

**Anti-patterns** —
- **Unadjusted surgeon comparisons** — invites gaming (case avoidance / cherry-picking) and clinician revolt; use risk-adjusted O/E.
- **Risk prediction with no pathway** (no ERAS, no pre-op optimization) — a number without a lever.
- **External risk model without local validation.**

**Feeds artifacts** — Strategy; Architecture (peri-op risk + dashboard); Business case (complication-cost avoidance); Mobilization (ERAS rollout).

**Maturity** — Production-ready.

> **The surgical-quality measure stack a CMO will expect to see.** NSQIP risk-adjusted **O/E** for 30-day mortality and morbidity; targeted **SSI** rates by procedure (reconciled to NHSN definitions in `CLIN-07`); **unplanned return-to-OR / reoperation** rate; **PSI-12** perioperative PE/DVT; readmission within 30 days post-procedure (couple with `CLIN-01`). The single most expensive avoidable surgical events — anastomotic leaks, deep SSIs requiring reoperation, post-op sepsis — are where the value math concentrates: each can add many bed-days, a reoperation, and an ICU stay. The pre-op risk surface only creates value if it routes into *action* (pre-op optimization, ERAS pathway selection, informed-consent and shared decision-making) — prediction without a peri-op lever is a dashboard.

---

### PATTERN CLIN-10 · Care Variation Reduction

**Intent** — Reduce *unwarranted* clinical variation — variation not explained by patient need — by measuring practice variation and driving adherence to evidence-based pathways and order sets.

**Applies to** — Service-line leadership, medical staff, clinical effectiveness. Lifecycle: Discovery, Strategy, Architecture, Business Case.

**Solution shape** —
- **Variation analytics:** measure variation in cost, LOS, utilization (labs, imaging, meds, implants), and outcomes across physicians/cohorts for high-volume conditions (the Dartmouth Atlas framing of warranted vs unwarranted variation). Risk-adjust to isolate the *unwarranted* component.
- **Clinical pathways + order sets:** define evidence-based pathways for target conditions; measure **pathway adherence** and **order-set utilization**; surface off-pathway decisions for review.
- **Order-set optimization:** prune, update, and standardize order sets (a major lever — order sets shape default behavior; bad defaults drive variation and waste).
- **Feedback loop:** transparent, risk-adjusted, peer-comparative physician scorecards (the Wennberg/IHI approach) — peer comparison, not punishment.

**Own-it vs rent** — **OWN** the variation analytics and pathway-adherence data products on the lakehouse. Order sets live in the EHR (own-destination). Avoid a rented variation black box clinicians can't audit.

**Where it sits** — Gold (variation + adherence products) + serving (clinical-effectiveness dashboard, physician scorecards); Strategy + Architecture + Business Case.

**Evidence anchors** —
- Unwarranted variation is a large, well-documented source of waste (Dartmouth Atlas; IOM "Best Care at Lower Cost"); standardization of high-volume pathways commonly yields cost + LOS + outcome gains — *estimate; size from client variation analysis.*
- **Value math:** `(off-pathway cases) × (cost/LOS delta of standardization)` — *confirm.*
- Sources: Dartmouth Atlas of Health Care; IOM/NAM reports; Wennberg.

**Anti-patterns** —
- **Standardizing without risk adjustment** — penalizing physicians for sicker patients; destroys trust.
- **Cookbook medicine framing** — pathways guide, clinicians retain judgment; sell it as decision support, not mandate.
- **Order-set sprawl** left unmanaged — stale order sets re-introduce the variation you removed.

**Feeds artifacts** — Strategy; Architecture (variation analytics + scorecards); Business case (waste reduction); Mobilization (pathway governance).

**Maturity** — Production-ready.

---

### PATTERN CLIN-11 · Medication Safety

**Intent** — Reduce adverse drug events (ADEs), dangerous drug-drug interactions, and opioid-related harm through smarter, higher-specificity clinical decision support and stewardship analytics.

**Applies to** — Pharmacy, medical staff, patient safety. Lifecycle: Discovery, Strategy, Architecture, Business Case. High clinical-risk weighting.

**Solution shape** —
- **ADE detection + prediction:** surveillance for ADEs (trigger-tool logic + an own model on labs/meds/notes — e.g., flag a creatinine rise on a nephrotoxic regimen, an INR spike on warfarin). Move from retrospective to predictive.
- **Smarter DDI / CDS alerting:** the core problem is **alert fatigue** — most interruptive medication alerts are overridden. The pattern is *raising specificity*: patient-contextualized alerts (dose, renal function, age, indication), tiered severity, and suppression of low-value interruptions.
- **Opioid stewardship:** **MME (morphine milligram equivalent)** monitoring, PDMP integration, co-prescribed opioid+benzodiazepine flags, and stewardship dashboards aligned to CDC opioid guidance.
- **Antimicrobial stewardship** (adjacent): de-escalation and bug-drug mismatch flags.
- HIL throughout: pharmacist/prescriber decides; the system informs.

**Own-it vs rent** — **MIXED, surfaced.** The DDI knowledge base is typically a licensed third-party content source (First Databank / Medi-Span class) — a defensible RENT for the *reference content* (it's standardized, maintained, regulated). But the **alerting logic, specificity tuning, and ADE prediction models** should be OWN — built and calibrated on client override/outcome data so the client controls the signal-to-noise. State the boundary explicitly: rent the drug-knowledge content, own the alerting intelligence.

**Where it sits** — Gold (ADE/MME feature products) + serving (CDS + stewardship dashboards); Architecture + Business Case + Governance.

**Evidence anchors** —
- ADEs are among the most common inpatient harms; preventable ADEs carry significant cost + LOS (AHRQ; IHI) — *estimate; confirm baseline.*
- Medication CDS override rates are high (often the large majority of interruptive alerts overridden) — the specificity-tuning value is in reclaiming clinician attention while preserving the catches that matter.
- Opioid stewardship (MME monitoring + PDMP) aligns with CDC guidance and reduces high-risk co-prescribing.
- Sources: AHRQ ADE resources; IHI trigger tool; CDC opioid prescribing guideline; literature on CDS alert override rates.

**Anti-patterns** —
- **Alert fatigue from low-specificity DDI alerts** — the dominant failure mode; over-alerting trains overrides and buries the dangerous interaction.
- **Autonomous medication action** — never; pharmacist/prescriber owns the decision.
- **Owning nothing** — renting the entire stack (content + logic) surrenders the specificity tuning that creates the value.

**Feeds artifacts** — Strategy; Architecture (CDS specificity + ADE prediction + stewardship); Business case (ADE-cost avoidance); Governance (alert-tuning + override monitoring).

**Maturity** — Production-ready.

> **The own/rent boundary, made concrete.** Rent the *fact base* (First Databank / Medi-Span — that a given drug pair interacts is standardized, regulated knowledge nobody should rebuild). Own the *decision* of whether to interrupt *this* clinician about *this* patient — that judgment depends on the client's renal-function context, alert-override history, severity tiering, and tolerance for noise, all of which are client-specific signal-to-noise tuning. Surfacing this split in the artifact is the difference between a credible recommendation and a hand-wave; it also shows the OWN-IT principle is about owning *intelligence and IP*, not reinventing reference content.

---

### PATTERN CLIN-12 · Imaging / Diagnostic AI

**Intent** — Use AI to triage, prioritize, and assist diagnostic imaging interpretation (e.g., flag suspected intracranial hemorrhage, large-vessel occlusion, PE, pneumothorax for faster radiologist review) — improving time-to-diagnosis for time-critical findings.

**Applies to** — Radiology, ED, stroke/PE pathways. Lifecycle: Discovery, Strategy, Architecture, Business Case. High clinical-risk weighting (diagnostic decisions).

**Solution shape** —
- **FDA-cleared algorithm landscape:** diagnostic imaging AI is the one area where a large, regulated market of **FDA-cleared (510(k)/De Novo) algorithms** exists (the FDA maintains a public list of AI/ML-enabled medical devices, the majority of which are radiology). Reference vendor classes: triage/notification (e.g., Aidoc/Viz.ai-class LVO and ICH triage), CAD, quantification tools.
- **The own-it boundary:** you generally **do not build** a diagnostic imaging model — clearance, validation, and regulatory liability sit with the cleared device. The pattern is **integration + governance**, not model-build.
- **Workflow:** the cleared algorithm flags/prioritizes a study on the radiologist worklist; the **radiologist makes the diagnosis** (HIL gate, regulatorily mandated for most of these as CDS, not autonomous diagnosis).
- **Local performance monitoring:** even with a cleared model, monitor its real-world performance on the client's population (scanner mix, protocols, demographics) for drift — the sepsis-model lesson applies even to cleared devices.

**Own-it vs rent** — **RENT, defensibly — with surfaced rationale.** This is the clearest legitimate RENT in the pack: building a diagnostic imaging model would require FDA clearance the client neither has nor should pursue. The surfaced rationale is regulatory (FDA clearance + liability) and economic (a mature cleared-device market). **What the client must still OWN:** the integration, the performance-monitoring data, and the governance — including the right to validate the device on local data and to discontinue it if it underperforms. Own the evidence about the rented model, even if you don't own the model.

**Where it sits** — Serving (radiology worklist integration) + Governance (device validation + monitoring); Architecture + Business Case.

**Evidence anchors** —
- The FDA's public list of AI/ML-enabled medical devices is dominated by radiology — a mature regulated category (FDA, ongoing).
- Triage algorithms (LVO/ICH/PE notification) are associated with reduced time-to-treatment in published evaluations — value is in time-critical pathways (stroke door-to-needle, PE response). *Confirm local impact.*
- **Value math:** time-critical-pathway improvement (e.g., stroke outcomes from faster LVO detection) + radiologist throughput — *estimate; confirm.*
- Sources: FDA AI/ML-enabled device list; published triage-algorithm time-to-treatment studies.

**Anti-patterns** —
- **Treating cleared = validated-on-your-population.** Clearance is not a guarantee on your scanner mix/demographics — monitor locally (the generalized sepsis-model lesson).
- **Autonomous diagnosis** — most clearances are for triage/CADe/CADx assist with a radiologist in the loop, not autonomous read.
- **Renting without owning the monitoring evidence** — if you can't measure the device's local performance, you can't govern it.

**Feeds artifacts** — Strategy; Architecture (worklist integration + monitoring); Business case (time-critical pathway value); Governance (FDA-device validation policy + the explicit rent rationale).

**Maturity** — Production-ready (as integrate-and-govern, not build).

---

### PATTERN CLIN-13 · Ambient Clinical Documentation (AI Scribes)

**Intent** — Reduce clinician documentation burden and burnout by auto-drafting clinical notes from the ambient patient-encounter conversation — freeing clinician time and improving note quality/timeliness.

**Applies to** — Ambulatory + inpatient clinicians, CMIO, clinician-experience/burnout programs. Lifecycle: Discovery, Strategy, Architecture, Business Case.

**Solution shape** —
- **Ambient capture → draft note:** the encounter audio is transcribed and an LLM drafts a structured note (HPI, A&P) into the EHR. Reference vendor class: **Abridge, Nuance DAX Copilot, Microsoft/Nuance, Suki, Ambience** — the mature ambient-scribe market.
- **HIL gate (mandatory):** the clinician **reviews, edits, and signs** every note. The note is a draft until the clinician attests — this is both clinical-accuracy and medico-legal necessity.
- **EHR integration:** draft lands in the note workflow; the clinician's signature is the gate.

**Own-it vs rent** — **RENT — and that is often the right call here, with surfaced rationale.** This pattern deliberately shows the nuance. Building a competitive ambient-scribe (medical-grade ASR + clinical LLM + EHR integrations + the relentless quality bar) is a multi-year, multi-hundred-person product effort the client should almost never attempt — the build-vs-buy reality strongly favors buy. **The surfaced rationale for renting:** time-to-value, the specialized ASR/clinical-LLM moat, vendor regulatory/security posture, and that this is a *productivity tool*, not a core differentiating data product. **What the client should still negotiate to OWN / control:** (1) the encounter data and generated notes (they're PHI and clinical record — must flow into the client's record, not be captively held); (2) a clear data-use/training stance (the client's PHI must not silently train the vendor's models without consent/contract); (3) exit rights and note-data portability. So: rent the *capability*, but contractually own the *data*. Contrast with `CLIN-14` — the *structured-signal extraction* from those notes is OWN.

**Where it sits** — Serving (clinician note workflow); Architecture + Business Case + Governance (PHI/data-use contracting).

**Evidence anchors** —
- Ambient scribes are associated with reduced documentation time and improved clinician-reported burnout/"pajama time" in early deployments — *estimate; confirm with client time-on-notes + burnout baseline.*
- **Value math:** here the value is primarily **clinician time + retention/burnout** (and possibly throughput / visit capacity), not a clinical-quality measure. `clinician hours saved × loaded cost`, plus a retention/recruiting argument. *Confirm with client.*
- Sources: vendor and early peer/health-system evaluations of ambient documentation (emerging evidence base).

**Anti-patterns** —
- **Building it yourself** as a non-differentiating productivity tool — a classic own-it-overreach; the OWN-IT principle does *not* mean build everything. Surface the rent rationale and move on.
- **No clinician sign-off gate** — an unreviewed AI note in the legal record is unacceptable.
- **Signing away PHI / training rights** — renting the capability is fine; surrendering the data and consent posture is not.

**Feeds artifacts** — Strategy (clinician-experience portfolio entry); Architecture (note-workflow integration); Business case (time/retention value); Governance (PHI + data-use + exit contracting). **Note this as an explicit, justified RENT in any artifact that includes it.**

**Maturity** — Production-ready (as a procured capability with governed data terms).

> **Why this pattern matters for the credibility of the whole pack.** A pattern library that only ever says "build it yourself" is dogma, not advice — a CMIO who has lived through a failed in-house scribe build will distrust the rest of the pack. `CLIN-13` is the deliberate demonstration that OWN-IT is a *test applied with judgment*, not a reflex: when the asset is non-differentiating, the market is mature, and the moat (medical ASR + clinical LLM + integration breadth) is genuinely deep, RENT is the right call — provided the data, consent, and exit terms stay client-owned. The discipline is *surfacing the rationale*, not always choosing build.

---

### PATTERN CLIN-14 · Clinical NLP on Unstructured Notes

**Intent** — Extract structured, analyzable signal from unstructured clinical notes (history, A&P, radiology/path reports) to power risk models, quality measures, CDI, registries, and cohort discovery — turning the ~80% of clinical data that's text into usable features.

**Applies to** — Every downstream clinical-analytics pattern (it's an enabling capability). Lifecycle: Architecture (foundational), Strategy.

**Solution shape** —
- **Targets:** extract problems/diagnoses (map to SNOMED CT / ICD-10), medications (RxNorm), social determinants, smoking/functional status, ejection fraction, cancer staging, family history, negation/uncertainty handling — the signal coding and structured fields miss.
- **Approach:** an **own NLP/LLM pipeline on the lakehouse** — fine-tuned/clinical LLMs and rules, validated against gold-standard annotations, with **negation and assertion** handling (a documented "no chest pain" must not become a chest-pain feature). Reference open frameworks: **cTAKES, MedSpaCy, scispaCy**, plus modern clinical LLMs deployed in the client estate.
- **Validation:** measure extraction precision/recall against annotated samples per entity type; this is a quality-gated data product, not a fire-and-forget.

**Own-it vs rent** — **OWN.** This is core: the extracted structured signal is a **client data product** feeding many downstream patterns. Build the pipeline on the lakehouse so features are auditable, recalibratable, and reusable. Contrast directly with `CLIN-13`: it's fine to *rent* the ambient scribe that *creates* a note, but the *structured intelligence extracted from* notes is an own-it data product — don't rent a black box that hands back features you can't trace.

**Where it sits** — Bronze→Silver→Gold (raw notes → extracted entities → curated clinical NLP feature product); Architecture (foundational enabling pattern).

**Evidence anchors** —
- A large majority of clinical information lives in unstructured text; NLP extraction materially improves cohort identification, risk-model features, and measure capture vs structured-only (broad clinical-NLP literature).
- **Value is enabling/multiplicative** — it lifts the performance of `CLIN-01/02/06/07/08`; size value through those downstream patterns, not standalone.
- Sources: cTAKES (Apache); MedSpaCy; clinical NLP validation literature.

**Anti-patterns** —
- **Skipping negation/assertion handling** — the classic clinical-NLP bug that turns "ruled out MI" into an MI.
- **Renting a black-box NLP** that returns features you can't validate or recalibrate — fails own-it and breaks downstream auditability.
- **No per-entity validation** — deploying extraction without precision/recall measurement.

**Feeds artifacts** — Architecture (foundational data product feeding multiple use cases); Strategy (enabling-capability investment); Governance (extraction validation).

**Maturity** — Production-ready (with validation discipline).

---

### PATTERN CLIN-15 · Nurse Staffing / Acuity Prediction

**Intent** — Forecast unit-level patient acuity and census to align nurse staffing with real demand — improving safety (nurse-to-patient ratios, missed care) and labor cost without over- or under-staffing.

**Applies to** — Nursing operations, CNO, workforce/labor management. Lifecycle: Discovery, Strategy, Architecture, Business Case.

**Solution shape** —
- **Acuity + census forecasting:** predict next-shift census and aggregate acuity by unit (from admissions/discharge forecasts in `CLIN-05`, current patient acuity, and patient-classification scores). Output a recommended staffing level by unit/shift.
- **Acuity measurement:** ground in a recognized patient-classification/acuity framework so the recommendation is clinically defensible, not just a headcount.
- **Safety linkage:** connect staffing to outcome signals — missed-nursing-care, falls (`CLIN-07`), failure-to-rescue — to show staffing isn't just a cost lever but a safety one.
- HIL: the model recommends; the nurse manager / staffing office decides and flexes.

**Own-it vs rent** — **OWN** the forecasting and acuity models on the lakehouse, calibrated to the client's units. May integrate with the workforce-management/scheduling system (own-destination). Avoid a rented staffing black box that owns the predictive logic.

**Where it sits** — Gold (acuity/census forecast product) + serving (staffing recommendation surface); Architecture + Business Case.

**Evidence anchors** —
- Nurse staffing levels are associated with patient outcomes (mortality, failure-to-rescue) in the staffing-outcomes literature (Aiken et al.) — the safety case is real, not just cost.
- **Value math:** labor optimization (reduced premium/agency hours, reduced over-staffing) **+** safety/outcome avoidance (the failure-to-rescue argument). *Confirm with client labor + outcome baselines.*
- Sources: Aiken et al. (*JAMA*/*Lancet* nurse-staffing studies); missed-nursing-care literature.

**Anti-patterns** —
- **Optimizing labor cost without the safety guardrail** — understaffing to hit a budget harms patients and raises failure-to-rescue (the staffing analog of the LOS/readmission anti-pattern).
- **Headcount without acuity** — staffing to census alone ignores that 20 low-acuity patients ≠ 20 ICU-level patients.
- **Renting the predictive logic.**

**Feeds artifacts** — Strategy; Architecture (acuity/census forecast + staffing surface); Business case (labor + safety); Mobilization (staffing-process change).

**Maturity** — Production-ready (forecasting) / emerging (tight acuity-to-staffing automation).

> **Frame staffing as a safety pattern, not a cost pattern — or lose the CNO.** The nurse-staffing-outcomes literature (Aiken and successors) ties lower staffing to higher mortality and failure-to-rescue; a recommendation that reads as "use AI to cut nursing hours" will be rejected, correctly, by clinical leadership. The defensible framing is *right-sizing*: shift premium/agency spend and chronic over-staffing on quiet units toward predicted high-acuity demand, with an explicit safety guardrail (minimum ratios, failure-to-rescue monitoring) the model is never allowed to breach. Acuity, not raw census, is the unit of demand — and the recommendation is advisory to the nurse manager, never an automated roster.

---

### PATTERN CLIN-16 · Real-Time Clinical Surveillance Platform (the shared substrate)

**Intent** — Provide the shared real-time data substrate and alert-orchestration layer that the streaming clinical patterns (`CLIN-02` sepsis, `CLIN-03` deterioration, `CLIN-07` HAC, `CLIN-11` ADE) all depend on — so each isn't rebuilt and alert governance is centralized.

**Applies to** — All real-time/streaming clinical use cases. Lifecycle: Architecture (foundational/platform).

**Solution shape** —
- **Streaming ingestion:** real-time vitals, labs, ADT, orders, and meds (HL7v2 / FHIR subscriptions) into a streaming layer landing on the lakehouse — couple with cross-cutting `INGEST` patterns.
- **Shared feature + scoring layer:** a common real-time feature store and model-serving layer so each clinical model consumes the same governed event stream.
- **Central alert orchestration:** one place to route, throttle, deduplicate, and *govern* alerts across all models — the antidote to system-wide alert fatigue. Alert-burden monitoring (alerts/clinician/shift, override rates) is a first-class metric.
- **Closed-loop telemetry:** capture which alert fired, who acted, what the outcome was — the data that retrains every real-time model.

**Own-it vs rent** — **OWN.** The streaming substrate, feature store, and alert-governance layer are core platform the client owns on the lakehouse. This is the reusable engine; renting it would mean renting the heart of clinical operations.

**Where it sits** — Bronze→Gold (streaming) + serving (alert orchestration) + governance (alert-burden monitoring); Architecture (foundational platform pattern).

**Evidence anchors** —
- Alert fatigue is a recognized patient-safety hazard (Joint Commission Sentinel Event Alert on alarm/alert fatigue) — centralized alert governance is itself a safety control.
- **Value is enabling** — it's the denominator under the streaming patterns' value; justify as shared platform amortized across `CLIN-02/03/07/11`.
- Sources: Joint Commission alarm-fatigue guidance; cross-cutting `ARCH`/`INGEST`/`MLOPS` packs.

**Anti-patterns** —
- **Per-model point solutions** each with its own ingestion + alerting — guarantees duplicated cost and ungoverned, additive alert fatigue.
- **No central alert-burden monitoring** — nobody owns the total alert load on the clinician.

**Feeds artifacts** — Architecture (foundational platform); Strategy (platform investment amortized across use cases); Governance (alert governance).

**Maturity** — Production-ready.

> **The alert-burden budget is the platform's keystone control.** Treat total interruptive alerts per clinician per shift as a *governed, finite budget* — not an unbounded sum that each new model adds to freely. When `CLIN-02` (sepsis), `CLIN-03` (deterioration), `CLIN-07` (HAC/device), and `CLIN-11` (medication) each ship their own alerts independently, the clinician's attention is the shared resource being silently depleted, and the predictable result is system-wide override behavior that blunts *every* alert — including the one that would have saved a life. Centralizing routing, deduplication, severity-tiering, and a per-responder budget in one substrate is therefore a patient-safety control, not merely an engineering convenience. The Joint Commission has named alarm/alert fatigue a sentinel-event hazard precisely because this failure mode is lethal and common.

---

### PATTERN CLIN-17 · Clinical Performance AI Use-Case Portfolio

**Intent** — Rank and sequence the clinical-performance AI use cases into a defensible portfolio using a consistent rubric — **value × feasibility × clinical-risk × data-readiness** — where **clinical-risk is weighted higher than in any other domain** because patient safety is at stake.

**Applies to** — Strategy phase, explicitly. The pattern that assembles the others into a roadmap. CMO/CMIO/CQO audience.

**Solution shape** —
- **Scoring rubric (per candidate use case):**
  1. **Value** — quantified benefit (penalty avoidance, bed-days, mortality/harm reduction, labor, revenue via CDI), grounded in each pattern's Evidence anchors.
  2. **Feasibility** — model tractability, intervention/operational capacity to act, EHR-integration effort, clinician workflow fit.
  3. **Clinical-risk** *(weighted highest — a gating factor, not merely additive)* — consequence of a false negative/positive; degree of autonomy (must be HIL); regulatory exposure (FDA CDS criteria, etc.). A high-clinical-risk use case must clear a higher feasibility/validation bar before it ranks.
  4. **Data-readiness** — availability, quality, and labeling of the data the model needs (do labeled outcomes exist to validate? is the signal in structured fields or locked in notes — invoking `CLIN-14`?).
- **Output:** a ranked, sequenced roadmap with explicit "build vs buy/rent" tags per item (most OWN; `CLIN-12` imaging and `CLIN-13` ambient flagged as justified RENT), data-readiness prerequisites called out, and the shared substrate (`CLIN-16`) sequenced first.
- **Sequencing logic:** quick-win, high-data-readiness, lower-clinical-risk items (e.g., LOS `CLIN-04`, flow `CLIN-05`, CDI `CLIN-08`) often lead; high-clinical-risk items (sepsis `CLIN-02`, deterioration `CLIN-03`) follow once validation infrastructure and the substrate (`CLIN-16`) exist.

**Own-it vs rent** — **OWN** (the portfolio/method is the client's strategic asset). The portfolio explicitly tags each constituent's posture and surfaces every RENT rationale per the README's provenance rules.

**Where it sits** — Strategy (the portfolio/roadmap artifact); informs Architecture sequencing and Business Case staging.

**Evidence anchors** —
- Value figures roll up from each pattern's Evidence anchors (every figure carries its source or an "estimate — confirm with client data" flag).
- The clinical-risk weighting is a *deliberate domain choice* — defend it explicitly in the artifact: unlike finance/treasury domains, a model error here can cause patient harm, so risk gates rather than merely discounts.

**Anti-patterns** —
- **Ranking by value alone** — chasing the biggest dollar figure (often a high-clinical-risk model) without weighting safety/validation readiness; the portfolio analog of deploying an unvalidated sepsis model.
- **Ignoring data-readiness** — ranking a use case whose validation data doesn't exist; you can't safely deploy what you can't validate.
- **Not sequencing the shared substrate first** — funding point solutions before the `CLIN-16` platform, guaranteeing rework and alert sprawl.

**Feeds artifacts** — Strategy (the use-case portfolio / roadmap — this pattern *is* that artifact's backbone); Business case (staged investment); Architecture (sequencing + platform-first).

**Maturity** — Production-ready (as a method).

**Illustrative portfolio scoring (each cell confirmed against client data before use):**

| Use case | Value | Feasibility | Clinical-risk (gating) | Data-readiness | Posture | Typical wave |
|---|---|---|---|---|---|---|
| CDI / coding (`CLIN-08`) | High (dual) | High | Low | High (notes via `CLIN-14`) | OWN (NLP) | 1 — quick win |
| LOS management (`CLIN-04`) | High | High | Low–Med | High | OWN | 1 |
| Patient flow (`CLIN-05`) | High | Med | Low | Med | OWN | 1–2 |
| HAC / PSI prevention (`CLIN-07`) | High | Med | Med | Med | OWN | 2 |
| Readmission (`CLIN-01`) | High (HRRP) | Med (needs pathway) | Med | High | OWN | 2 |
| Deterioration EWS (`CLIN-03`) | High | Med | **High** | Med (streaming) | OWN | 3 (after substrate) |
| Sepsis (`CLIN-02`) | High (mortality) | Med | **Highest** | Med (streaming + labels) | OWN | 3 (after substrate) |
| Imaging triage (`CLIN-12`) | Med (time-critical) | High (procure) | **High** | N/A (cleared device) | RENT* | 2–3 |
| Ambient scribe (`CLIN-13`) | Med (clinician time) | High (procure) | Low–Med | N/A | RENT* | 1–2 |

\* RENT with surfaced rationale per the README. Read clinical-risk as a **gate**: the two highest-risk items (`CLIN-02`, `CLIN-03`) are sequenced *after* the real-time substrate (`CLIN-16`) and governance (`CLIN-18`) exist — never first, regardless of value.

---

### PATTERN CLIN-18 · Closed-Loop Clinical Model Governance + Monitoring

**Intent** — Ensure every deployed clinical model is continuously validated on local data, monitored for performance drift and bias, and governed under a HIL/CDS regime — making the sepsis-model failure structurally impossible to repeat.

**Applies to** — Every clinical model in this pack (a mandatory wrapper). Lifecycle: Architecture + Governance; ongoing operations. Composes with cross-cutting `MLOPS` and `GOV`.

**Solution shape** —
- **Pre-deployment local validation:** no clinical model (built or procured/cleared) goes live without validation against the client's own labeled outcomes — discrimination **and calibration**, and **subgroup performance** (bias/equity by age, sex, race/ethnicity, payer) to avoid encoding disparities.
- **Continuous monitoring:** track real-world AUC, calibration drift, alert volume/override rates, and outcome impact; alert when performance degrades.
- **HIL/CDS governance:** document that every model is decision *support* with a human in the loop; map to **FDA Clinical Decision Support** criteria (can the clinician independently review the basis?) and maintain the model card / intended-use documentation.
- **Model registry + audit:** versioned registry of every clinical model, its validation evidence, owners, and review cadence — the audit trail a CMIO and compliance need.

**Own-it vs rent** — **OWN.** Governance is non-delegable. Even for RENT models (`CLIN-12` imaging, `CLIN-13` ambient), the client owns the *validation evidence and monitoring* and retains the right to discontinue. You can rent a model; you cannot rent away your duty to govern it.

**Where it sits** — Governance tier + serving (monitoring dashboards); Architecture (mandatory cross-cutting wrapper) + Governance.

**Evidence anchors** —
- **The Epic Sepsis Model case (Wong et al., *JAMA Intern Med* 2021)** is the direct justification: had local validation + monitoring been mandatory, the gap between marketed and real performance would have been caught before clinical reliance. This pattern operationalizes that lesson.
- Algorithmic-bias evidence (e.g., Obermeyer et al., *Science* 2019, on a widely-used risk algorithm under-serving Black patients) justifies mandatory subgroup/equity validation.
- Maps to FDA CDS guidance and emerging health-AI assurance frameworks (e.g., CHAI).

**Anti-patterns** —
- **Deploy-and-forget** — a validated model drifts; without monitoring it silently degrades.
- **Validating discrimination but not calibration or subgroup performance** — a well-discriminating but mis-calibrated or biased model is dangerous.
- **Assuming a cleared/vendor model is exempt from local governance** — the generalized sepsis-model lesson; clearance ≠ local validity.
- **Any autonomous clinical action** — outside the HIL/CDS envelope.

**Feeds artifacts** — Architecture (mandatory governance wrapper on every clinical model); Business case (governance cost line); Governance (model registry, validation policy, FDA-CDS mapping, equity policy). **Every other CLIN pattern's deployment cites this one.**

**Maturity** — Production-ready (and mandatory).

**Pre-deployment clinical-model gate (no model — built, procured, or FDA-cleared — goes live without all of these):**

1. **Local validation** against the client's own labeled outcomes — not the vendor's published study.
2. **Discrimination AND calibration** reported (a reliability curve, not AUC alone) — a mis-calibrated model gives confidently wrong risk.
3. **Subgroup / equity performance** by age, sex, race/ethnicity, and payer — to avoid encoding disparities (the Obermeyer lesson).
4. **Specificity floor + alert-burden budget** agreed with the responders (couple with `CLIN-16`).
5. **HIL / CDS classification** documented — the model is decision *support*; a human acts; mapped to FDA CDS criteria.
6. **Model card + intended-use** recorded in the registry, with named owner and review cadence.
7. **Drift monitoring + a defined off-switch** — who watches it, what threshold trips it, who can turn it off.

This gate exists so the Epic Sepsis Model failure (`CLIN-02`) is *structurally impossible* to repeat: every one of those seven controls, applied before clinical reliance, would have surfaced the gap between marketed and real-world performance.

---

## Composition note

A clinical-performance Move artifact composes a domain selection from this pack with the cross-cutting packs. Worked example — a sepsis early-detection use case:

```
DOMAIN:        CLIN-02 (sepsis detection + bundles)
               CLIN-16 (real-time surveillance substrate)
               CLIN-18 (closed-loop model governance) — mandatory
   ×
CROSS-CUTTING: ARCH-xx  (landing zone / lakehouse)
               INGEST-xx (HL7v2/FHIR real-time vitals+labs)
               MODEL-xx  (clinical feature store)
               MLOPS-xx  (model serving + drift monitoring)
               GOV-xx    (HIPAA/HITRUST + clinical-model audit)
               FINOPS-xx (value/effort model)
```

Every claim in the resulting artifact cites a `CLIN-NN` (or cross-cutting) pattern ID, a benchmark source (or an explicit "estimate — confirm with client data" flag), and a confirmed human input — per the README provenance rules. Every solution choice states its own-it posture; the two RENT choices in this pack (`CLIN-12`, `CLIN-13`) carry surfaced rationale; every model deployment cites `CLIN-18`.
