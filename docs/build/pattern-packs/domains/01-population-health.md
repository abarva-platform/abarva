# Pattern Pack — Population Health (`POPH`)

**Pack code:** `POPH` · **Type:** Domain (vertical) · **Created:** 2026-06-06

The clinical and business workflows AI addresses in population health management (PHM). Patterns here are written in the native vocabulary a CMO, population-health medical director, VP of quality, or ACO executive would use — HEDIS measure IDs, CMS-HCC v28 risk adjustment, SDOH Z-codes, Star Ratings, PDC, PMPM. Generic "we will surface insights" language is disqualified; every pattern names the measure, the model, the cohort, and the intervention.

**Composition note.** A domain pattern is incomplete on its own. It selects cross-cutting patterns to stand up: e.g. risk stratification (`POPH-04`) composes with `INGEST-06` (Epic Clarity/Caboodle config), `MODEL-02` (OMOP CDM on lakehouse), `MLOPS-03` (model serving + monitoring), `GOV-02` (HITRUST), `GOV-05` (subgroup/bias evaluation). For domain packs the schema fields read as:
- **Solution shape** = the clinical + data + AI approach (cohort logic, model family, intervention pathway).
- **Own-it vs rent** = which solution *stack* — own-it registries/risk models built on the client's lakehouse vs rented pop-health SaaS that holds the data and the logic.
- **Evidence anchors** = the value math, benchmark ranges, and the measure definitions themselves.

**The own-it stake in population health (read this first).** The intelligence in PHM *is* the asset: the risk logic that decides who gets a care manager, the gap logic that drives Star bonus dollars, the cohort definitions that segment a population. When that logic lives on a vendor's cloud (Innovaccer, Health Catalyst, Arcadia, Lightbeam, Cotiviti), the client rents access to insight about their own members and cannot audit *why* a patient was flagged, cannot extend a national measure to a local/contract-specific one, and is locked out of their population intelligence the day the contract ends. Own-it here means the registries, risk scores, and cohort logic are code and data products in the client's own lakehouse (Unity Catalog / medallion), versioned, auditable, and extensible. This is not ideology — for a value-based contract, the risk and gap logic *is* the P&L engine, and you do not outsource your P&L engine.

Three concrete things own-it buys you in PHM, each of which the rent posture forecloses:
1. **Auditability.** When a RADV auditor, a state Medicaid quality reviewer, or your own compliance officer asks "why was this member flagged / coded / enrolled," you produce a diff-able definition and a lineage trace — not a vendor support ticket and a multi-week SLA. In a coding-integrity (RADV) or quality-audit context, "we can't show you the vendor's logic" is not an acceptable answer.
2. **Extensibility.** National measures (HEDIS, Stars) are the floor, not the ceiling. Real contracts carry payer-specific, state-specific, or local quality measures. Own-it cohort and gap logic forks a national measure into a contract measure in a pull request; rented logic waits for the vendor's roadmap, if it ever comes.
3. **Continuity.** The day the platform contract ends, an own-it client keeps its registries, risk scores, and twelve years of accumulated cohort intelligence. A rent client gets an export of dashboards and starts over. For a risk-bearing entity that has spent years tuning who-gets-a-care-manager, that intelligence is the moat.

**A note on the recurring failure mode across this pack.** The single most common way PHM AI programs fail is *prediction without an intervention pathway* — a beautiful rising-risk model, high-cost-claimant score, or readmission model that nobody is staffed or designed to act on. Almost every anti-pattern below is a variant of it. Treat "what is the named intervention, who executes it, and how is closure captured" as a gating question for every predictive pattern. A second recurring failure is *alert fatigue from un-prioritized output* (ten thousand gaps, an infinite worklist). Prioritization and capacity-awareness are not polish; they are the difference between a program that closes gaps and one that produces reports.

---

## Pattern index

| ID | Name | Maturity |
|---|---|---|
| POPH-01 | Population segmentation / cohort-building data product | production-ready |
| POPH-02 | Member attribution & total-cost-of-care (PMPM) modeling | production-ready |
| POPH-03 | Quality measure performance management (the measure→close→re-measure loop) | production-ready |
| POPH-04 | HCC-based risk stratification (CMS-HCC v28) | production-ready |
| POPH-05 | Clinical risk models (ACG, LACE, readmission) | production-ready |
| POPH-06 | Care-gap identification & closure (HEDIS) | production-ready |
| POPH-07 | Rising-risk identification (predictive, the high-leverage cohort) | production-ready |
| POPH-08 | High-cost claimant prediction & management | emerging |
| POPH-09 | Avoidable utilization — ED overuse, ACS admissions, readmissions | production-ready |
| POPH-10 | Chronic disease registries & interventions (DM, CHF, COPD, CKD) | production-ready |
| POPH-11 | Medication adherence (PDC; Part D Star MAD/MAH/MAC) | production-ready |
| POPH-12 | Polypharmacy / high-risk medication patterns | emerging |
| POPH-13 | SDOH capture, screening & resource referral (Z-codes, PRAPARE) | emerging |
| POPH-14 | Behavioral-health integration & risk | emerging |
| POPH-15 | Maternal health / high-risk pregnancy | emerging |
| POPH-16 | Care management & coordination workflow (panel mgmt, outreach) | production-ready |
| POPH-17 | Next-best-action / intervention recommendation (HIL gate) | emerging |
| POPH-18 | Member/patient engagement & outreach optimization | emerging |
| POPH-19 | Pop-health AI use-case portfolio ranking (value × feasibility × data × risk) | production-ready |

---

### PATTERN POPH-01 · Population segmentation / cohort-building data product

**Intent** — Stand up the reusable cohort engine that almost every other PHM use case sits on: a governed, queryable way to define "the population" and slice it into clinically and financially meaningful segments.

**Applies to** — All PHM domains. Foundational data product consumed by POPH-03 through POPH-18. Move lifecycle: Architecture and Discovery (it is the substrate that makes everything else estimable).

**Solution shape** — A *cohort-as-code* layer on the lakehouse. Define the denominator population (attributed members, panel, contract line) and reusable segment definitions as versioned SQL/dbt models or Databricks notebooks in the Gold layer, sourced from a normalized clinical model (OMOP CDM or a claims-anchored member-month table, see `MODEL-02`). Key design choices:
- **Segment axes** — demographics; payer / line-of-business (Commercial, Medicare Advantage, Medicaid, ACO/MSSP, dual-eligible); chronic-condition flags (from CMS **CCW / Chronic Conditions Warehouse** logic or governed ICD-10 value sets); utilization tier; risk band (POPH-04/05); care-program enrollment.
- **One definition, many consumers** — cohort definitions publish as governed views with documented value sets (ICD-10, CPT/HCPCS, NDC, LOINC) so a HEDIS measure, a chronic registry, and a dashboard all use the *same* diabetes definition. This is the single most important property: it ends the "whose number is right" argument.
- **Versioned value sets** — each value set is a versioned table (syncable from NLM **VSAC**), and each cohort carries lineage to the value-set version it was computed with, so an audit can reproduce exactly who was in the cohort on a given date.

**Own-it vs rent** — **OWN.** Cohort logic is dbt/SQL/notebook code in the client's repo and Unity Catalog; value sets are versioned tables the client controls (and can sync from VSAC/NLM). Contrast **RENT**: Innovaccer/Health Catalyst/Arcadia ship pre-built cohorts whose definitions live in the vendor's semantic layer — you cannot see the exact value set, cannot pin its version for an audit, and cannot fork it for a local measure. Why own-it matters here: a cohort definition is the unit everyone argues about ("is this patient really a diabetic?"); owning it means you can answer that question with a diff-able definition rather than a vendor support ticket.

**Where it sits** — Gold layer (published cohort/segment views). Lifecycle: Architecture (data-product design), Discovery (population sizing). Architecture tier: serving / semantic layer.

**Evidence anchors** — A typical attributed PHM population segments into roughly: ~50% low-risk/healthy, ~35–45% with ≥1 chronic condition (rising/stable), ~5% high-cost driving ~50% of spend (the classic 5/50 concentration — confirm with client claims; the "5% drive ~50%" concentration is a long-standing AHRQ/MEPS finding, ranges vary by population). Value sets: align to NCQA HEDIS Value Set Directory and CMS CCW condition algorithms. Source: NCQA HEDIS MY2024/2025 technical specs; CMS Chronic Conditions Warehouse condition definitions; AHRQ MEPS spend-concentration statistics.

**Anti-patterns** — (1) *Cohort sprawl* — every analyst defining "diabetics" their own way, so the registry, the HEDIS measure, and the dashboard disagree; fix with a single governed value set. (2) Renting cohort definitions you cannot inspect, then being unable to defend them in a quality audit or extend them to a payer-specific contract measure. (3) Building cohorts on raw claims only, ignoring clinical data, so you miss lab-confirmed conditions and over-rely on coding.

**Feeds artifacts** — Architecture target state (the cohort/semantic data product); Business case (population sizing → addressable value); every downstream use-case spec cites the cohort definition it consumes.

**Maturity** — production-ready.

---

### PATTERN POPH-02 · Member attribution & total-cost-of-care (PMPM) modeling

**Intent** — Answer "whose costs and outcomes are we accountable for, and what is the trend" — the financial spine of every value-based contract.

**Applies to** — ACO/MSSP, Medicare Advantage, value-based commercial, Medicaid managed care. Move lifecycle: Business Case (value math), Strategy (contract economics), Architecture (attribution data product).

**Solution shape** — Two coupled data products on the lakehouse:
- **(1) Attribution** — implement the contract's attribution algorithm as code: prospective vs retrospective; plurality-of-primary-care-E&M-visits attribution for MSSP; payer-specified panels for MA. Attribution is contract-specific and changes annually, so it must be *parameterized and versioned* — one engine, many contract configurations — not hard-coded to a single rule.
- **(2) Total cost of care (TCOC)** — member-month spend aggregated to **PMPM** (per-member-per-month), decomposed by service category (inpatient, outpatient, professional, Rx, post-acute/SNF), and **risk-adjusted** (POPH-04) so trend is comparable across populations and over time. Build the standard PHM views: PMPM trend, **utilization per 1,000** (admits/1,000, ED/1,000, bed-days/1,000), and budget-vs-actual against the contract benchmark/target.
- **AI layer** — forecast PMPM trend and flag emerging cost drivers early (a specialty-drug spike, a post-acute/SNF leakage pattern, a high-cost-claimant cluster — POPH-08) before they show up in the quarterly settlement.

**Own-it vs rent** — **OWN.** Attribution logic and the TCOC model are the contract P&L engine — code in the client estate, parameterized per contract. **RENT** pop-health platforms compute attribution and PMPM inside their black box; for a risk-bearing entity this means you cannot reconcile the vendor's number against the payer's number, which is exactly the dispute that costs money. Owning the attribution code lets finance reconcile to the penny and model "what if the algorithm changes next year."

**Where it sits** — Silver (member-month claims) → Gold (attribution + TCOC marts). Lifecycle: Business Case, Strategy. Tier: serving.

**Evidence anchors** — PMPM is the canonical PHM unit; benchmark trend against national medical-cost-trend estimates (recent payer/actuary medical cost trend has run roughly **7–8%** gross in recent years — confirm with current PwC HRI / actuarial benchmark and the client's own contract). Spend concentration: top 5% of members ≈ ~50% of spend (AHRQ MEPS — confirm with client claims). Attribution definitions: CMS MSSP attribution methodology; payer contract terms (must be sourced from the client's actual contracts). Source: CMS MSSP program rules; PwC Health Research Institute medical cost trend (confirm current year); client claims data.

**Anti-patterns** — (1) Comparing raw PMPM across populations without risk adjustment — you "discover" sicker panels cost more, which is noise. (2) Hard-coding one attribution algorithm when the client has contracts with different rules. (3) Renting the number you are financially accountable for and being unable to reconcile it in a payer dispute.

**Feeds artifacts** — Business case (the value baseline and the savings denominator); Strategy (contract portfolio economics); Architecture (attribution + TCOC data products).

**Maturity** — production-ready.

---

### PATTERN POPH-03 · Quality measure performance management — the operational loop

**Intent** — Run the closed loop that converts quality measures into closed gaps and Star/bonus dollars: **measure → identify gap → prioritize → outreach → close → re-measure.** This is the operating system of a quality program.

**Applies to** — MA Stars, ACO MSSP quality, HEDIS/QRS commercial, Medicaid quality. Move lifecycle: Architecture (the loop's data + serving design), Mobilization (the operational cadence).

**Solution shape** — A measure engine on the lakehouse that computes HEDIS-style measures from the governed cohort layer (POPH-01): numerator/denominator/exclusions per measure spec, with member-level gap status (open/closed/excluded) and supplemental-data reconciliation (lab feeds, registries, chart-abstracted values that close gaps not visible in claims). The loop: (a) compute measure rates and member-level open gaps nightly; (b) prioritize gaps (POPH-06); (c) route to outreach/care-management workflow (POPH-16); (d) capture closure evidence and supplemental data; (e) re-measure and track rate movement toward the cut-point/threshold. AI layer: predict end-of-year measure rate given current trajectory, and recommend which gaps to work to move a measure across a Star cut-point.

**Own-it vs rent** — **OWN** the measure engine and gap logic; **MANAGED-OWN-DESTINATION** acceptable for the certified HEDIS *calculation* in the short term (NCQA-certified measure engines exist and certification has real value for official reporting) — but the gap-prioritization, supplemental-data, and re-measurement loop stays own-it on the lakehouse so the client controls the operational intelligence. **RENT** is the all-in-one Stars/quality platform that owns the whole loop: you get a dashboard, not an asset, and you cannot extend to a custom contract measure.

**Where it sits** — Gold (measure marts, gap tables). Lifecycle: Architecture, Mobilization. Tier: serving + workflow.

**Evidence anchors** — MA Star Ratings drive Quality Bonus Payments; moving a contract from 3.5 to 4.0+ Stars unlocks the QBP and a higher rebate percentage — materially worth tens of millions on a large MA contract (confirm magnitude with the client's membership and CMS QBP rules). HEDIS measures are recomputed annually to NCQA MY (measurement year) specs; Star cut-points move yearly and are not known until CMS publishes — model toward a target with margin. Star measures carry **weights** (administrative ×1, process ×1, outcome/intermediate-outcome and patient-experience higher; the three Part D adherence measures are ×3 — see POPH-11) and CMS applies the **Categorical Adjustment Index (CAI)** and a **reward factor** for high, stable performance — all of which the own-it loop must model to target the right measures.

*Worked value-math sketch (illustrative — confirm every input with client data):* For a 50,000-member MA contract, crossing from 3.5 to 4.0 overall Stars triggers the QBP (a percentage uplift on the benchmark) plus a higher rebate share. Even a modest uplift on a benchmark of several hundred dollars PMPM across 50,000 members × 12 months runs into the tens of millions annually. The loop's job is to find the *cheapest path across the cut-point*: identify the two or three measures sitting just below their 4-Star cut-point, size the gaps needed to cross, and concentrate closure there — rather than spreading effort across measures already safely above threshold. This "distance-to-cut-point × measure-weight × gaps-to-close" calculation is the core value model and must be re-run as CMS publishes new cut-points. Source: CMS Part C & D Star Ratings Technical Notes (current MY); NCQA HEDIS technical specifications (current MY); client membership and benchmark.

**Anti-patterns** — (1) Treating quality as an annual chart-chase instead of a continuous loop — gaps surface in October, too late to close. (2) Optimizing measure *rate* without regard to **cut-points** — effort spent on a measure already above the 5-Star threshold is wasted vs a measure one point below 4 Stars. (3) Renting the full loop and losing the ability to add a payer-specific or local measure.

**Feeds artifacts** — Architecture (the measure/gap/closure data products and serving loop); Business case (Star/QBP value); Mobilization (the quality operating cadence and roles).

**Maturity** — production-ready.

---

### PATTERN POPH-04 · HCC-based risk stratification (CMS-HCC v28)

**Intent** — Build the risk score that drives risk-adjusted revenue (MA/ACO) and identifies clinically complex members — using the actual CMS-HCC model, transparently and auditably.

**Applies to** — Medicare Advantage, ACO/MSSP, Medicaid (state HCC variants), any risk-bearing arrangement. Move lifecycle: Architecture (the risk data product), Business Case (RAF → revenue), Strategy.

**Solution shape** — Implement the **CMS-HCC v28** model (the model CMS is phasing in, replacing v24; phase-in blends v24/v28 over payment years — confirm the current blend year with CMS) on the lakehouse as transparent code:
- **The score pipeline** — map members' ICD-10 diagnoses to **HCCs** (Hierarchical Condition Categories) via the versioned CMS crosswalk, apply the disease hierarchies (a more-severe HCC supersedes a related less-severe one), add demographic and disease-interaction factors, and compute the member **RAF (Risk Adjustment Factor)**. Every step — diagnosis → crosswalk version → HCC → hierarchy → coefficient → RAF — is diff-able and reproducible for an audit.
- **(1) RAF accuracy / recapture** — HCCs do **not** carry over year to year; a chronic condition must be re-documented annually or its RAF contribution is lost. Surface chronic HCCs documented last year but not yet this year as *legitimate recapture opportunities for clinical review* (the member genuinely has the condition; it simply hasn't been coded this year).
- **(2) Suspecting** — surface members whose clinical evidence (labs, meds, problem list, prior history) *suggests* an undocumented HCC, as a hypothesis for clinician confirmation.
- **Hard rule** — both layers feed a clinician worklist and require documented confirmation; the system **never auto-codes** (POPH-17). This is the line between revenue integrity and fraud.

**Own-it vs rent** — **OWN.** The HCC crosswalk and RAF logic are public CMS model artifacts; implementing them on the lakehouse means the client owns a fully auditable risk engine and can reconcile RAF to the penny against CMS payment files. **RENT** (Cotiviti, vendor RAF tools, or pop-health-platform risk modules) hides the crosswalk version and the suspecting logic — a compliance liability given RADV audit exposure (you must be able to show that every coded diagnosis is supported and was clinician-confirmed, not vendor-inferred). Owning it is the only posture that survives a RADV audit cleanly.

**Where it sits** — Gold (RAF/HCC member marts). Lifecycle: Architecture, Business Case, Strategy. Tier: serving + governance (RADV-audit-grade lineage required).

**Evidence anchors** — RAF is multiplicative on the MA base rate, so a 0.1 RAF improvement on a member is directly ~10% of that member's benchmark revenue (illustrative — exact dollar depends on the county base rate; confirm with client). v28 increases the total HCC count, renumbers the HCC set, removes/constrains some lower-specificity conditions, and re-estimates coefficients on more recent data — net effect varies by population but generally lowers the coded-revenue yield of certain chronic conditions; model the revenue delta of the v24→v28 transition explicitly per the published phase-in blend.

*Worked value-math sketch (illustrative — confirm with client):* For a 50,000-member MA plan with an average county base rate of ~$1,000 PMPM, a legitimate, clinically-supported 0.05 average RAF recapture (re-documenting chronic HCCs that lapsed because HCCs reset annually) is ~5% of risk-adjusted revenue on the affected members — at scale, tens of millions annually. But the *only* defensible version of this number is the one where every recaptured HCC is clinician-confirmed and documentation-supported; an "RAF lift" achieved by suspecting-then-auto-coding is not revenue, it is RADV/False-Claims liability waiting to be clawed back with penalties. The value math must therefore be expressed as *confirmed, supportable* recapture, net of the clinical review cost to confirm it. Source: CMS Advance Notice & Rate Announcement (current PY) for the v28 phase-in blend; CMS HCC model software/crosswalk; HHS-OIG RADV audit guidance and recent DOJ/OIG MA risk-adjustment settlements.

**Anti-patterns** — (1) **Coding without clinical support** — chasing RAF via aggressive suspecting that auto-codes; this is the RADV/False-Claims-Act exposure that has produced large settlements. Every suspect must be clinician-confirmed with documentation. (2) Renting a black-box RAF tool and being unable to produce the diagnosis-to-payment audit trail. (3) Building on v24 when payment has moved to the v28 blend, so the revenue model is stale. (4) No subgroup evaluation — see POPH-05 anti-pattern; HCC capture rates vary by access and documentation patterns and can encode bias.

**Feeds artifacts** — Business case (RAF → risk-adjusted revenue line); Architecture (the auditable risk-score data product + RADV lineage); Strategy (revenue integrity program).

**Maturity** — production-ready.

---

### PATTERN POPH-05 · Clinical risk models (ACG, LACE, readmission)

**Intent** — Predict clinical risk (overall morbidity, readmission, deterioration) where HCC/financial risk is the wrong lens — to target clinical interventions, not revenue.

**Applies to** — Care management targeting, transitions-of-care, readmission programs. Move lifecycle: Architecture (predictive data product), Business Case (avoidable-utilization value), MLOps.

**Solution shape** — A family of models on the lakehouse: (1) **Morbidity/grouper** — the Johns Hopkins **ACG System** logic or an open morbidity index for overall burden and predicted utilization; (2) **LACE / LACE+** index for 30-day readmission risk at discharge (Length of stay, Acuity, Comorbidity, ED visits — a transparent, well-validated additive score, ideal as a baseline); (3) a **trained readmission model** (gradient-boosted or logistic) on the client's own claims+clinical data where LACE underperforms, with the LACE score as a feature and a baseline. Models output a risk band + the top contributing factors (so a care manager sees *why*), and write to the care-management worklist (POPH-16). Built and monitored under `MLOPS-03`; bias-evaluated under POPH-05 anti-pattern discipline and `GOV-05`.

**Own-it vs rent** — **OWN** the trained models and the model code (client's lakehouse, client's MLflow registry). **MANAGED-OWN-DESTINATION** is acceptable for *licensed grouper logic* (ACG is licensed from Johns Hopkins; LACE is public) — license the grouper but keep the orchestration, features, thresholds, and the trained readmission model own-it. **RENT** = a vendor risk score you cannot inspect, recalibrate, or bias-test — disqualified where the score decides who gets a scarce care-manager slot.

**Where it sits** — Gold (risk-prediction marts) + model registry. Lifecycle: Architecture, MLOps, Business Case. Tier: serving + ML platform.

**Evidence anchors** — LACE: a score ≥10 is the commonly cited threshold for elevated 30-day readmission/death risk (van Walraven et al., CMAJ 2010 — validation C-statistic ~0.68; confirm calibration on client data). Trained models on local data typically beat LACE modestly (AUC ~0.70–0.78 range, population-dependent — confirm). Source: van Walraven LACE derivation (CMAJ 2010); Johns Hopkins ACG System documentation; client claims/EHR for local calibration.

**Anti-patterns** — (1) **No subgroup / bias evaluation.** Clinical risk models have well-documented racial bias — most famously the Obermeyer et al. (Science 2019) finding that a widely used commercial algorithm used *cost* as a proxy for *need*, systematically under-flagging Black patients who had equal illness but lower historical spend. Any clinical risk model must be evaluated by race/ethnicity, language, payer, and geography for differential performance, and must avoid cost-as-proxy-for-need. (2) Renting a score that cannot be bias-tested. (3) Using a readmission score with no transitions-of-care intervention attached (prediction without action — see POPH-09).

**Feeds artifacts** — Architecture (predictive data products + bias-evaluation evidence); Business case (avoidable-utilization value); Mobilization (care-management targeting). Cites `GOV-05` for the fairness control.

**Maturity** — production-ready.

---

### PATTERN POPH-06 · Care-gap identification & closure (HEDIS)

**Intent** — Find the specific, named quality gaps for each member and prioritize the handful that matter — not dump 10,000 gaps on a panel.

**Applies to** — Stars, ACO quality, commercial HEDIS, Medicaid. Move lifecycle: Architecture (gap data product), Mobilization (closure workflow).

**Solution shape** — Compute member-level open gaps against the HEDIS measure set from the governed cohort layer (POPH-01). Core measures by ID:
- **CBP** — Controlling High Blood Pressure (most-recent BP <140/90 in hypertensive members 18–85; closes on a recorded in-control reading, so it is a "needs a visit with a BP check" gap).
- **HBD** — Hemoglobin A1c Control for Patients With Diabetes (the current measure family; refined/replaced the older **CDC** Comprehensive Diabetes Care). HBD's key indicator is **HbA1c poor control >9.0%** — note this is an *inverted* measure (lower rate is better), a common modeling trap.
- **EED** — Eye Exam for Patients With Diabetes (retinal/dilated eye exam; closes via an eye-care claim or a documented negative-for-retinopathy reading from the prior year).
- **GSD** — Glycemic Status Assessment for Patients With Diabetes (HbA1c result or GMI on file; the assessment-presence companion to HBD under recent NCQA updates — confirm current MY measure naming, as NCQA transitioned CDC → HBD/EED/GSD/KED).
- **KED** — Kidney Health Evaluation for Patients With Diabetes (both **eGFR** *and* **uACR** in the year — the dual-component requirement trips up gap logic that checks only one).
- **COL** — Colorectal Cancer Screening (multiple modalities qualify with different lookbacks: colonoscopy 10y, FIT/FOBT annual, sigmoidoscopy/CT-colonography/FIT-DNA at their intervals — the gap logic must honor every modality's window).
- **BCS** — Breast Cancer Screening (mammography, ~2-year lookback, women 50–74).
- **CCS** — Cervical Cancer Screening (modality- and age-dependent intervals).
- **SUPD** — Statin Use in Persons with Diabetes; **SPC** — Statin Therapy for Cardiovascular Disease (Rx-based, close to adherence — POPH-11).
Then **prioritize**: rank each member's open gaps by (a) Star/cut-point leverage (POPH-03), (b) member reachability and likely responsiveness, (c) clinical urgency, (d) effort to close, and (e) whether a single touch can close multiple gaps. The "**multi-gap visit**" is the highest-yield unit: a single comprehensive diabetic office visit can close HBD (A1c drawn and controlled), GSD (A1c on file), EED (referral/exam), KED (eGFR + uACR ordered), and CBP (BP checked) — four to five measures from one encounter. AI surfaces the prioritized, *bundled* gap list per member and per panel, with the closing action named and the bundle identified, so outreach asks for one visit, not five.

**Own-it vs rent** — **OWN** the gap and prioritization logic (lakehouse). The measure *certification* may be MANAGED-OWN-DESTINATION (NCQA-certified engine for official reporting) but the prioritization intelligence — which gap to work first, which can bundle — is the operational edge and stays own-it. **RENT** all-in-one gap platforms surface gaps but with opaque prioritization you cannot tune to your panel's reality.

**Where it sits** — Gold (gap + prioritization marts). Lifecycle: Architecture, Mobilization. Tier: serving + workflow.

**Evidence anchors** — Care-gap closure is the direct lever on HEDIS/Star rates; the value is the QBP/contract bonus tied to crossing a cut-point (POPH-03). Bundling: a single comprehensive diabetes visit can close 3–4 measures simultaneously (HBD/EED/KED/GSD) — the most efficient closure unit (confirm panel mix with client). Source: NCQA HEDIS MY2024/2025 technical specs (measure IDs and definitions); CMS Star Ratings Technical Notes.

**Anti-patterns** — (1) **Surfacing 10,000 gaps with no prioritization** — alert fatigue, panels ignore the list, nothing closes. Prioritization *is* the pattern. (2) Working gaps that don't move a cut-point or revenue while a near-threshold measure languishes. (3) Single-gap outreach when a bundled visit could close four — wasting member touches. (4) Renting prioritization you can't tune to local reachability.

**Feeds artifacts** — Architecture (gap + prioritization data products); Mobilization (the closure workflow and panel cadence); Business case (closure → Star value).

**Maturity** — production-ready.

---

### PATTERN POPH-07 · Rising-risk identification (the highest-leverage cohort)

**Intent** — Find the members *trending toward* high cost/complexity before they get there — the cohort where intervention changes the trajectory, unlike the already-high-cost who are largely committed.

**Applies to** — Care management, chronic-disease programs, value-based contracts. Move lifecycle: Strategy (the targeting thesis), Architecture (predictive product), Business Case.

**Solution shape** — A **predictive** model (not a current-state filter) on the lakehouse that scores each currently low/moderate-cost member on their probability of *escalating* to high-cost/high-utilization in the next 6–12 months. Features: trajectory of utilization, new diagnoses, gaps in chronic-disease control, medication non-adherence (POPH-11), recent ED touches, SDOH risk (POPH-13). The output is the **rising-risk register** — the actionable middle. Critically, pair every rising-risk flag with a *trajectory-changing* intervention (intensify chronic-disease management, close care gaps, address adherence/SDOH) — these are modifiable, which is the whole point vs the already-high-cost cohort.

**Own-it vs rent** — **OWN.** Rising-risk is where the trained model + local features matter most; it must be recalibrated to the client population and bias-tested (POPH-05). **RENT** rising-risk modules exist in every pop-health platform but use generic models you cannot tune to your population's escalation patterns or audit for fairness.

**Where it sits** — Gold (rising-risk register) + model registry. Lifecycle: Strategy, Architecture, Business Case. Tier: serving + ML platform.

**Evidence anchors** — The strategic case: the top-5% high-cost cohort drives ~50% of spend but their costs are substantially "locked in"; the rising-risk ~10–20% adjacent cohort is where modifiable trajectory lives — this is the canonical PHM targeting thesis (sources vary; the conceptual framing traces to the population-health pyramid / Kaiser triangle and is widely cited — confirm escalation rates with client claims).

*Worked value-math sketch (illustrative — confirm with client):* The value is the *avoided escalation*. If a rising-risk cohort of, say, ~15% of members has an observed 12-month escalation rate to high-cost of X% (compute from the client's own claims history — this base rate is the crux), and a targeted intervention bundle (chronic-disease intensification + gap closure + adherence + SDOH) reduces that escalation by a conservative relative fraction, the value is (members prevented from escalating) × (the high-cost-minus-rising-cost PMPM delta) × 12 — net of intervention cost. The honest version of this number requires the client's *own* escalation base rate and ideally a matched-comparison or holdout to attribute the reduction, because regression-to-the-mean will otherwise flatter the result. Source: population-health-pyramid literature; client claims for escalation base rates and the high-vs-rising cost delta.

**Anti-patterns** — (1) **Predicting rising risk with no intervention pathway** — prediction without action is worthless. (2) Confusing *current* high-cost with *rising* risk — the high-cost dashboard is not the rising-risk model; targeting the already-high-cost wastes the leverage. (3) A generic rented model that flags the wrong members for your population. (4) No bias evaluation (POPH-05). (5) **Claiming savings without controlling for regression-to-the-mean** — members flagged at a transient peak will tend to revert toward their mean *with or without* intervention; attributing that natural reversion to the program inflates ROI and collapses under scrutiny. Use a matched comparison or a holdout to attribute effect.

**Feeds artifacts** — Strategy (the targeting thesis and intervention design); Architecture (the predictive register); Business case (modifiable-trajectory value). Composes with POPH-10, POPH-11, POPH-13 for the intervention.

**Maturity** — production-ready.

---

### PATTERN POPH-08 · High-cost claimant prediction & management

**Intent** — Identify members likely to be high-cost next period (and the *why*), so case management and benefit/network steerage can engage early — distinct from rising-risk in that it includes already-complex members and large discrete events.

**Applies to** — Self-insured employers, MA, ACO, stop-loss/reinsurance contexts. Move lifecycle: Architecture, Business Case, Strategy.

**Solution shape** — A prospective high-cost-claimant (HCC-claimant — note: distinct from the CMS-HCC of POPH-04; "high-cost claimant" is the payer term) model on the lakehouse predicting next-period top-percentile spend, decomposed into drivers: specialty pharmacy (the fastest-growing driver), oncology, complex chronic, planned surgical, and catastrophic/NICU. Pair predictions with intervention pathways: complex case management, specialty-pharmacy management, site-of-care optimization, and benefit/network steerage where appropriate. Surface the *modifiable* portion explicitly — distinguish "expensive but unavoidable" (e.g., a transplant) from "expensive and addressable" (e.g., avoidable admissions, sub-optimal site of care).

**Own-it vs rent** — **OWN.** High-cost prediction touches benefit design, network, and stop-loss economics — too central to outsource the logic. **RENT** exists (carrier and vendor HCC-claimant tools) but they predict without surfacing the modifiable lever and without local recalibration.

**Where it sits** — Gold (high-cost prediction marts) + model registry. Lifecycle: Architecture, Business Case, Strategy. Tier: serving + ML platform.

**Evidence anchors** — Specialty pharmacy is a dominant and rising high-cost driver (specialty has grown to roughly half of total drug spend in many books — confirm with client PBM data and current benchmarks). Top-1% claimants can drive 20%+ of spend in commercial populations (confirm with client). Source: client claims + PBM data; current specialty-drug trend benchmarks (e.g., payer/PBM trend reports — confirm year).

**Anti-patterns** — (1) **Prediction without an intervention pathway** — the recurring PHM failure. (2) Treating all high cost as unavoidable (defeatist) or all as avoidable (naive); the value is in the modifiable slice. (3) Renting a score with no driver decomposition, so case management cannot act.

**Feeds artifacts** — Architecture (high-cost predictive product); Business case (avoidable high-cost value, stop-loss modeling); Strategy (specialty-pharmacy and site-of-care programs).

**Maturity** — emerging (driver decomposition and modifiable-slice rigor are still maturing in practice).

---

### PATTERN POPH-09 · Avoidable utilization — ED overuse, ACS admissions, readmissions

**Intent** — Predict and prevent the utilization that should not have happened: avoidable ED visits, ambulatory-care-sensitive (ACS) admissions, and avoidable 30-day readmissions — the clearest, most defensible PHM savings.

**Applies to** — ACO/MSSP, MA, Medicaid, any risk contract. Move lifecycle: Business Case (savings), Architecture, Mobilization.

**Solution shape** — Three coupled targets on the lakehouse, each prediction wired to a named intervention with closure tracked:
- **(1) Avoidable ED** — classify ED visits as primary-care-treatable / preventable using the NYU-Billings ED algorithm (or a successor classification), and predict members at risk of avoidable ED use. Interventions: primary-care access expansion, nurse advice line, same-day/urgent-care steerage, and post-discharge follow-up for ED frequent-utilizers (often driven by BH/SDOH — POPH-13/14).
- **(2) ACS admissions** — admissions for ambulatory-care-sensitive conditions, defined by the AHRQ **Prevention Quality Indicators (PQIs)** — diabetes short/long-term complications, CHF, COPD/asthma, hypertension, dehydration. These are *by definition* outpatient-preventable; track PQI rate per 1,000 and aim the chronic-disease programs (POPH-10) squarely at the drivers.
- **(3) Avoidable readmissions** — the LACE / trained readmission model (POPH-05) feeding a structured transitions-of-care (TOC) intervention: 48–72h post-discharge contact, medication reconciliation, timely follow-up-visit scheduling, and red-flag/teach-back education.

**Own-it vs rent** — **OWN** the prediction and the intervention-tracking; **MANAGED-OWN-DESTINATION** acceptable for standard classification logic (AHRQ PQI software is public; NYU ED algorithm is published) — adopt the standard, own the orchestration and intervention loop. **RENT** all-in-one platforms report avoidable utilization but disconnect it from the intervention, so it's a report, not a program.

**Where it sits** — Gold (utilization + PQI marts) + model registry. Lifecycle: Business Case, Architecture, Mobilization. Tier: serving + workflow.

**Evidence anchors** — Structured TOC programs reduce 30-day readmissions meaningfully — the Coleman Care Transitions Intervention and Project RED report relative reductions in the ~20–30% range in trials (Coleman et al., Arch Intern Med 2006; Jack et al., Project RED, Ann Intern Med 2009 — confirm applicability and magnitude on client population). ACS/PQI admissions are by definition outpatient-preventable (AHRQ PQI). Avoidable ED carries a large cost delta vs the appropriate primary-care setting (an avoidable ED visit commonly runs an order of magnitude more than the equivalent primary-care or urgent-care encounter — confirm with client unit costs).

*Worked value-math sketch (illustrative — confirm with client):* Avoidable utilization is usually the single largest, most defensible savings line in a PHM business case because it ties a *predicted, named* event to a *published-efficacy* intervention. Example chain: identify the ~N members per month discharged with LACE ≥10; a TOC program reaching, say, 60% of them and reducing their 30-day readmission rate by a conservative ~15–20% (a fraction of the trial effect, to be defensible) at an average readmission cost of ~$15,000 (confirm) yields the savings line — net of the TOC staffing cost. The discipline: never book the full trial effect, always net the intervention cost, and express savings as *reduction in a counted, avoidable event class* (30-day all-cause readmissions, PQI admissions per 1,000, avoidable-ED-classified visits) so finance can audit it against actuals. Source: AHRQ Prevention Quality Indicators; NYU-Billings ED classification; Coleman CTI; Project RED; client unit costs and historical rates.

**Anti-patterns** — (1) **Prediction without the intervention pathway** (TOC contact, med rec, follow-up) — the model is useless alone. (2) Counting *all* readmissions as avoidable — many are planned or clinically appropriate; use the avoidable definition. (3) Renting a dashboard disconnected from the care workflow. (4) Targeting ED super-utilizers without addressing the SDOH/behavioral drivers (POPH-13/14) that produce the visits.

**Feeds artifacts** — Business case (avoidable-utilization savings — often the headline number); Architecture (prediction + PQI products); Mobilization (TOC and access interventions).

**Maturity** — production-ready.

---

### PATTERN POPH-10 · Chronic disease registries & interventions (DM, CHF, COPD, CKD)

**Intent** — Maintain accurate, governed registries for the high-burden chronic conditions and drive condition-specific interventions and gap closure.

**Applies to** — All PHM. Move lifecycle: Architecture (registry products), Mobilization (disease-management programs).

**Solution shape** — Condition registries as Gold data products built on the governed value sets (POPH-01): **diabetes** (lab-confirmed HbA1c + dx + meds, not claims alone), **CHF/heart failure**, **COPD**, **chronic kidney disease (CKD)** (staged by eGFR/uACR — ties to the KED measure). Each registry carries control status and the open gaps for that condition. Interventions are condition-specific and named:
- **Diabetes** — HBD/EED/KED/GSD gap bundle (POPH-06) + MAD adherence (POPH-11); flag HbA1c >9.0% (uncontrolled) and members overdue for A1c; SDOH/food-insecurity link (POPH-13).
- **CHF / heart failure** — guideline-directed medical therapy (GDMT) titration tracking, weight/symptom monitoring, MAH/diuretic adherence, and a hard readmission-prevention link (CHF is a top PQI/ACS driver — POPH-09); transitions-of-care after any CHF admission.
- **COPD** — controller-inhaler adherence, exacerbation tracking, spirometry confirmation, smoking-cessation and vaccination, exacerbation-driven readmission prevention.
- **CKD** — staging by eGFR/uACR, slowing-progression management (BP/glucose control, ACE/ARB/SGLT2 use), avoidance of nephrotoxic meds (links to POPH-12), and *nephrology referral timing* and *pre-ESRD planning* — late referral to dialysis (a "crash start") is a major avoidable-cost and outcome event, so referral-timing is the high-value CKD signal.
AI surfaces uncontrolled and progressing members and recommends the next condition-specific action (to a clinician — POPH-17), never auto-acting.

**Own-it vs rent** — **OWN.** Registries are the clinical operating substrate; their definitions and control logic must be the client's, extensible to local protocols. **RENT** platform registries hide the inclusion logic and control thresholds and cannot adopt a client's specific care protocol.

**Where it sits** — Gold (condition registries). Lifecycle: Architecture, Mobilization. Tier: serving + workflow.

**Evidence anchors** — Diabetes, CHF, COPD, CKD are dominant cost and admission drivers and map directly to AHRQ PQIs (POPH-09). Tight HbA1c, BP, and CKD management reduce complications and ACS admissions (long-standing clinical evidence base — ADA Standards of Care; KDIGO CKD guidelines). Lab-confirmed registries are materially more accurate than claims-only (confirm capture-rate lift on client data). Source: ADA Standards of Care; KDIGO guidelines; AHRQ PQI; client EHR labs.

**Anti-patterns** — (1) Claims-only registries that miss lab-confirmed disease and over/under-count. (2) Renting registries whose inclusion logic you can't see or extend to a local protocol. (3) Registries with no intervention attached — a list, not a program.

**Feeds artifacts** — Architecture (registry data products); Mobilization (disease-management programs); Business case (complication/admission-avoidance value).

**Maturity** — production-ready.

---

### PATTERN POPH-11 · Medication adherence (PDC; Part D Star MAD/MAH/MAC)

**Intent** — Measure and improve medication adherence — both a clinical driver of chronic-disease control and a triple-weighted lever in MA/Part D Star Ratings.

**Applies to** — MA/Part D, ACO, chronic-disease programs. Move lifecycle: Architecture (adherence product), Mobilization (adherence interventions), Business Case (Stars).

**Solution shape** — Compute **PDC (Proportion of Days Covered)** from pharmacy claims for the Part D adherence measures: **MAD** (Medication Adherence for Diabetes — oral diabetes meds), **MAH** (Medication Adherence for Hypertension — RAS antagonists), and **MAC** (Medication Adherence for Cholesterol — statins). The Star measure threshold is **PDC ≥ 80%**. Build a member-level adherence product: current PDC, projected year-end PDC, and "days to non-adherence" — the date by which a member will drop below 80% if they don't refill, which is the actionable trigger. Interventions: refill-gap outreach, 90-day fills, sync programs, barrier resolution (cost → LIS/assistance; transport → SDOH). Prioritize members who are *close to the cliff* and *movable* (a member already at 50% PDC for the year may be unrecoverable; one at 78% with a refill due is the high-yield target).

**Own-it vs rent** — **OWN.** PDC logic and the "days-to-non-adherence" trigger are simple, public, and high-value — no reason to rent. **RENT** PBM/vendor adherence dashboards report PDC but rarely give the forward-looking, member-prioritized trigger you can wire into outreach.

**Where it sits** — Gold (adherence marts). Lifecycle: Architecture, Mobilization, Business Case. Tier: serving + workflow.

**Evidence anchors** — The three adherence measures (MAD/MAH/MAC) are **triple-weighted (×3)** in Part D Star Ratings — disproportionately valuable for the overall Star score (CMS weighting; confirm current MY weights, as CMS has adjusted measure weights). PDC ≥80% is the adherence threshold; PDC = (days covered in the measurement period) ÷ (days in the period from first fill), so the arithmetic is unforgiving — a member who misses a ~73-day stretch over a year cannot reach 80% no matter what happens afterward, which is precisely why the forward "days-to-cliff" trigger beats retrospective reporting.

*Worked value-math sketch (illustrative — confirm with client):* Because MAD/MAH/MAC are ×3, lifting one of them across its 4- or 5-Star cut-point moves the overall Star average roughly three times as much per measure as a typical ×1 administrative measure — so a dollar of adherence-outreach effort is among the highest-leverage Star spend available. Target the *near-cliff, movable* cohort: members at PDC 76–82% with a refill due in the next 30 days, where a single successful outreach flips them above or holds them above 80%. Members already at 50% for the year are arithmetically unrecoverable and should not consume outreach capacity. Source: CMS Part C & D Star Ratings Technical Notes (current MY) for weights and thresholds; PQA (Pharmacy Quality Alliance) PDC specifications.

**Anti-patterns** — (1) Reporting PDC retrospectively instead of the forward "days-to-cliff" trigger — too late to act. (2) Spending outreach on unrecoverable members (already far below 80% with no math to recover) instead of near-cliff movable members. (3) Ignoring the triple-weight — adherence is among the highest-leverage Star investments. (4) Treating non-adherence as patient non-compliance without checking cost/SDOH barriers (POPH-13).

**Feeds artifacts** — Architecture (adherence product); Mobilization (adherence interventions); Business case (triple-weighted Star value).

**Maturity** — production-ready.

---

### PATTERN POPH-12 · Polypharmacy / high-risk medication patterns

**Intent** — Surface dangerous medication patterns — polypharmacy, high-risk meds in the elderly, drug-drug interactions, opioid risk — for clinical/pharmacist review.

**Applies to** — MA (elderly), complex/frail populations, behavioral health. Move lifecycle: Architecture, Mobilization (pharmacist/clinician review).

**Solution shape** — A medication-safety data product on the lakehouse flagging: polypharmacy (e.g., ≥5 or ≥10 chronic meds), **potentially inappropriate medications in older adults (AGS Beers Criteria)**, **STOPP/START** patterns, anticholinergic burden, high-risk drug-drug and drug-disease interactions, and opioid-risk patterns (MME thresholds, opioid+benzo concomitancy). Aligns with Star measures where relevant (e.g., statin use in diabetes — **SUPD**; polypharmacy/opioid measures). Output routes to a pharmacist/clinician worklist for medication review and deprescribing recommendation — never auto-acts (POPH-17).

**Own-it vs rent** — **OWN** the pattern logic; **MANAGED-OWN-DESTINATION** acceptable for licensed clinical knowledge bases (Beers, interaction databases like First Databank/Medi-Span are licensed reference content) — license the knowledge base, own the cohorting, prioritization, and worklist. **RENT** all-in-one med-safety modules hide which rules fired and why.

**Where it sits** — Gold (med-safety marts). Lifecycle: Architecture, Mobilization. Tier: serving + workflow + governance (clinical-safety review).

**Evidence anchors** — Beers Criteria PIMs are associated with adverse drug events in older adults (AGS Beers Criteria, updated periodically — current 2023/AGS version; confirm). Opioid + benzodiazepine concomitancy carries a black-box overdose risk (FDA). Source: AGS Beers Criteria (current); STOPP/START; FDA opioid-benzo warning; PQA SUPD measure.

**Anti-patterns** — (1) Auto-flagging with no pharmacist review — clinical context (intentional, monitored use) matters; this is a recommend-not-decide domain (POPH-17). (2) Renting a rules engine you can't see, so a flagged member can't be defended. (3) Alert volume with no prioritization — same fatigue trap as POPH-06.

**Feeds artifacts** — Architecture (med-safety product); Mobilization (pharmacist-review workflow); Business case (ADE-avoidance, related Star measures).

**Maturity** — emerging.

---

### PATTERN POPH-13 · SDOH capture, screening & resource referral (Z-codes, PRAPARE)

**Intent** — Capture and act on social determinants — the upstream drivers of utilization and disparity — through structured screening, **ICD-10 Z-code** documentation, community-resource referral, and SDOH-informed risk.

**Applies to** — Medicaid, dual-eligible, MA, ACO, health equity programs. Move lifecycle: Architecture (SDOH product), Strategy (equity), Mobilization (referral workflow).

**Solution shape** — Three layers:
- **(1) Screening** — administer a validated instrument (**PRAPARE** from NACHC, the CMS **AHC HRSN** screening tool, or the client's) capturing food insecurity, housing instability, transportation, financial strain, social isolation, and interpersonal safety; store *structured* responses (not free text) so they are queryable.
- **(2) Z-code capture** — map screening results and clinical documentation to **ICD-10 Z55–Z65** social-determinant-of-health codes — e.g., **Z59.0** homelessness, **Z59.41** food insecurity, **Z59.6** low income, **Z59.82** transportation insecurity, **Z60.2** social isolation. Measure the *capture rate*: Z-code documentation is notoriously low nationally, so improving capture is itself a measurable, reportable target (and increasingly tied to quality programs and HRSN reporting requirements).
- **(3) Referral & closed-loop** — connect to community resources via a CBO referral network using **Gravity Project** / HL7 FHIR US Core SDOH data standards, and track whether the need was *resolved*, not merely *referred* — the closed loop is the whole point.
SDOH risk then feeds the risk, rising-risk, and adherence models (POPH-04/05/07/11) as features — a transportation or cost barrier explains non-adherence better than "non-compliance" ever will.

**Own-it vs rent** — **OWN** the screening data, Z-code logic, and SDOH risk features (the client's social-risk intelligence and equity evidence). **MANAGED-OWN-DESTINATION** acceptable for the *community-resource directory/referral network* (Unite Us, findhelp/Aunt Bertha are referral networks — a reasonable managed service, since the CBO directory is genuinely a network effect) — but keep the screening data, closed-loop status, and risk features own-it. **RENT** = an SDOH platform that owns your social-risk data and equity evidence — disqualified, because this is exactly the data you need to defend equity performance and feed your own models.

**Where it sits** — Silver/Gold (SDOH screening + Z-code + referral status). Lifecycle: Architecture, Strategy, Mobilization. Tier: serving + workflow + interoperability (Gravity/FHIR).

**Evidence anchors** — SDOH Z-code documentation is very low nationally (CMS analyses have found Z-code use in only ~1–2% of relevant beneficiaries — confirm current figure), so improving capture is a measurable target. SDOH explains a substantial share of health outcomes (the widely cited framing attributes a large fraction of outcomes to social/behavioral factors vs clinical care — magnitudes vary by source; cite carefully). Source: CMS Z-code utilization data briefs; Gravity Project / HL7 FHIR US Core SDOH; PRAPARE (NACHC); AHC HRSN screening tool.

**Anti-patterns** — (1) **Screen-and-abandon** — screening for needs you can't refer or resolve is harmful and erodes trust; close the loop. (2) Using cost as a proxy for need (the Obermeyer trap, POPH-05) — SDOH is precisely the corrective lens. (3) Renting an SDOH platform that holds your equity data. (4) Z-codes captured but never fed into risk models, wasting the signal.

**Feeds artifacts** — Architecture (SDOH product + closed-loop referral); Strategy (health-equity program); risk models (SDOH features); Business case (utilization impact of resolved social needs — flag as estimate).

**Maturity** — emerging.

---

### PATTERN POPH-14 · Behavioral-health integration & risk

**Intent** — Identify behavioral-health (BH) need and its medical comorbidity, and integrate BH into the PHM workflow — because untreated BH drives medical cost and is systematically under-detected in claims.

**Applies to** — All PHM; especially Medicaid, dual-eligible, complex/high-cost. Move lifecycle: Architecture, Strategy (integration model), Mobilization.

**Solution shape** — A BH-risk data product identifying: diagnosed BH conditions, screening results (**PHQ-9** depression, **GAD-7** anxiety, AUDIT/DAST for substance use), the **medical-BH comorbidity** cohort (e.g., diabetes + depression, the high-cost intersection), and members with BH need signals but no BH treatment (the under-detection gap — claims under-capture BH). Wire to a collaborative-care / integrated-care intervention and to relevant measures (**FUH** follow-up after hospitalization for mental illness; **FUM** follow-up after ED visit for mental illness; **AMM** antidepressant medication management; **IET** initiation/engagement of SUD treatment). BH risk feeds the overall risk and rising-risk models (POPH-05/07).

**Own-it vs rent** — **OWN.** BH comorbidity intelligence and the under-detection logic are core to managing total cost; rented BH carve-out vendor data is fragmented and you won't own the integrated medical+BH view — which is the entire value. **RENT** BH carve-outs are common but they silo the data; the integrated lakehouse view is the own-it advantage.

**Where it sits** — Gold (BH-risk + comorbidity marts). Lifecycle: Architecture, Strategy, Mobilization. Tier: serving + workflow. Governance note: BH data carries heightened sensitivity (**42 CFR Part 2** for SUD records) — see `GOV-05`.

**Evidence anchors** — Medical-BH comorbidity is strongly associated with higher total cost (the diabetes+depression and chronic+BH intersections are repeatedly shown to elevate cost markedly — Melek/Milliman analyses of behavioral comorbidity cost; confirm magnitude with client). FUH/FUM/AMM/IET are HEDIS/Star measures. Source: NCQA HEDIS specs (FUH/FUM/AMM/IET); Milliman behavioral-health cost analyses; client claims for comorbidity cost.

**Anti-patterns** — (1) Managing medical and BH in silos — the comorbidity is where the cost and the opportunity are. (2) Relying on claims alone for BH prevalence (massive under-detection). (3) Mishandling **42 CFR Part 2** SUD data — a compliance and trust failure; consent/segmentation rules differ from general HIPAA. (4) Screening (PHQ-9) with no follow-up pathway.

**Feeds artifacts** — Architecture (BH-risk product + Part 2 handling); Strategy (integrated-care model); Mobilization (collaborative care); risk models (BH features).

**Maturity** — emerging.

---

### PATTERN POPH-15 · Maternal health / high-risk pregnancy

**Intent** — Identify pregnant members early, stratify maternal risk, and drive interventions to reduce adverse outcomes (preterm birth, maternal morbidity, NICU) — clinically urgent and a growing quality/equity focus.

**Applies to** — Medicaid (majority payer for births), commercial, MA (rare). Move lifecycle: Architecture, Strategy (equity), Mobilization.

**Solution shape** — Early pregnancy identification (claims/clinical/lab signals — the earlier the better, since first-trimester engagement matters), maternal-risk stratification (prior preterm birth, hypertensive disorders/preeclampsia risk, diabetes/GDM, BH comorbidity, SDOH), and intervention pathways: early prenatal-care engagement, high-risk OB/maternal-fetal-medicine referral, hypertension/diabetes management, doula/home-visiting where covered. Map to measures: **PPC** (prenatal and postpartum care — timeliness of prenatal care and postpartum visit). Strong equity lens — maternal morbidity/mortality disparities by race are severe and a named national priority; subgroup evaluation is mandatory (POPH-05).

**Own-it vs rent** — **OWN.** Maternal-risk logic and the equity evidence must be the client's, auditable and tunable; this is a high-scrutiny clinical and equity domain. **RENT** maternity-management vendors exist but you cede the risk logic and the disparity evidence you need to demonstrate equity progress.

**Where it sits** — Gold (maternal-risk register). Lifecycle: Architecture, Strategy, Mobilization. Tier: serving + workflow.

**Evidence anchors** — The U.S. has high and racially disparate maternal mortality (CDC reports Black maternal mortality at roughly 2–3× the rate of White women — confirm current CDC figure); a large share of maternal deaths are deemed preventable (CDC MMRC analyses cite a majority as preventable). PPC is a HEDIS measure. Source: CDC maternal mortality and MMRC data; NCQA HEDIS PPC; client claims/clinical.

**Anti-patterns** — (1) Late identification — engaging in the third trimester misses the modifiable window. (2) No subgroup/equity evaluation in a domain defined by disparity. (3) Renting maternal-risk logic and losing the equity evidence. (4) Risk stratification with no MFM/intervention pathway.

**Feeds artifacts** — Architecture (maternal-risk register); Strategy (maternal-equity program); Mobilization (early-engagement and high-risk pathways).

**Maturity** — emerging.

---

### PATTERN POPH-16 · Care management & coordination workflow (panel mgmt, outreach)

**Intent** — Run the care-management operation: panel management, outreach prioritization, and care-manager worklists — the human delivery layer that converts every prediction and gap into an action.

**Applies to** — All PHM. Move lifecycle: Mobilization (the operating workflow), Architecture (the worklist data product).

**Solution shape** — A unified care-manager worklist on the lakehouse:
- **One view per member** — aggregate the signals from every upstream pattern into a single per-member row: risk band (POPH-04/05), rising-risk flag (POPH-07), open prioritized gaps (POPH-06), adherence cliff (POPH-11), SDOH/BH needs (POPH-13/14), recent ED/admission and TOC status (POPH-09). The care manager sees the whole patient, not five disconnected lists.
- **Panel management** — roll the per-member view up to the care-manager caseload and the PCP-panel level, so a physician or care-management lead can manage a population, not just react to individuals.
- **Outreach prioritization** — rank who to contact today by impact × reachability × urgency, and *bundle* actions per member so one contact addresses multiple needs.
- **Capacity-aware** — the worklist respects how many members a care manager can actually work and surfaces the top-N, not an infinite list. This is the difference between a usable program and a discarded one.
- **Closure feedback** — capture outcome and closure back, feeding the quality loop (POPH-03) and the models' training signal (POPH-17).

**Own-it vs rent** — **OWN** the prioritization and worklist logic (it encodes the client's care model and capacity). **MANAGED-OWN-DESTINATION** acceptable for the *care-management workflow/CRM tool* itself (the case-management application of record) — but the prioritization intelligence feeding it stays own-it on the lakehouse. **RENT** all-in-one care-management modules bundle the worklist logic opaquely, so you can't tune prioritization to your staffing reality.

**Where it sits** — Gold (unified worklist) → workflow tier. Lifecycle: Mobilization, Architecture. Tier: serving + workflow.

**Evidence anchors** — Care-management capacity is the binding constraint — a care manager works a finite panel, so prioritization quality directly determines program ROI (the value is in working the *right* members, not more members). Outreach response rates are low and channel-dependent (POPH-18). Source: client care-management staffing and historical outreach yield (engagement-specific — confirm).

**Anti-patterns** — (1) An infinite worklist ignoring capacity — care managers triage randomly and the model's value evaporates. (2) Per-signal lists (a gaps list, a separate risk list, a separate adherence list) instead of a unified per-member view — the care manager can't see the whole patient. (3) No closure capture, so the loop and the models never learn. (4) Renting the prioritization you can't tune to your staff.

**Feeds artifacts** — Mobilization (the care-management operating model, roles, cadence, capacity plan); Architecture (the unified worklist product); Business case (program ROI as a function of prioritization quality).

**Maturity** — production-ready.

---

### PATTERN POPH-17 · Next-best-action / intervention recommendation (the HIL gate)

**Intent** — Recommend the next best action for a care team — with an explicit human-in-the-loop gate: the model recommends, a clinician decides. The pattern that makes AI in PHM safe and adoptable.

**Applies to** — All PHM intervention surfaces (care management, gap closure, med safety, NBA at point of care). Move lifecycle: Architecture (the recommendation + governance design), Mobilization.

**Solution shape** — A recommendation layer on the lakehouse that, per member, proposes a ranked **next-best-action** (close this bundled gap, enroll in CHF management, address this adherence cliff, refer for this SDOH need, schedule this TOC visit) with the *reasoning surfaced* (which signals drove it) and the expected impact. Critically, it is **advisory**: every recommendation routes to a clinician/care-manager worklist (POPH-16) for accept/modify/reject, and the decision is captured (both for the audit trail and as feedback to improve the model). The HIL gate is a hard architectural boundary — the system never auto-enrolls, auto-codes (POPH-04), auto-prescribes, or auto-closes a clinical gap. Recommendations that touch coding or clinical decisions carry mandatory clinician confirmation.

**Own-it vs rent** — **OWN.** The recommendation logic, the reasoning surfacing, and the decision-capture loop are the client's clinical-governance asset and must be auditable. **RENT** "AI recommendation" features in pop-health platforms are black boxes — disqualified where a recommendation influences a clinical or coding decision and must be explainable and bias-tested.

**Where it sits** — Gold (recommendation product) + governance tier (HIL gate, decision audit). Lifecycle: Architecture, Mobilization. Tier: serving + workflow + governance. Composes with `GOV-05` (fairness) and `MLOPS-03` (monitoring).

**Evidence anchors** — HIL is both a safety and an adoption driver — clinicians reject opaque recommendations; surfacing reasoning and keeping the human decisive is what earns trust and avoids automation bias. Regulatory direction (FDA on clinical decision support; the general "recommend not decide" posture for clinical AI) reinforces the gate. Source: FDA Clinical Decision Support guidance; the documented automation-bias literature; client clinical-governance requirements.

**Anti-patterns** — (1) **Auto-acting** on a clinical or coding recommendation — the cardinal sin (RADV exposure for auto-coding, patient-safety exposure for auto-clinical-action). (2) Black-box recommendations with no surfaced reasoning — rejected by clinicians, fails adoption. (3) No decision capture — the model can't learn and there's no audit trail. (4) No bias evaluation on a recommender that allocates scarce care resources (POPH-05).

**Feeds artifacts** — Architecture (the recommendation product + the HIL gate as an explicit architectural control); Mobilization (the accept/modify/reject workflow); governance (decision audit trail, fairness evidence).

**Maturity** — emerging.

---

### PATTERN POPH-18 · Member/patient engagement & outreach optimization

**Intent** — Get the right member to take the right action via the right channel at the right time — because the best risk model and gap list are worthless if outreach doesn't land.

**Applies to** — All PHM intervention delivery. Move lifecycle: Architecture (engagement product), Mobilization.

**Solution shape** — An engagement-optimization layer on the lakehouse: model each member's **reachability and channel preference** (phone, text/SMS, portal, mail, in-person) and likely **responsiveness** to a given outreach for a given action, and the best timing. Combine with the prioritization (POPH-06/16) so outreach effort goes to high-impact *and* reachable members. Support multi-channel orchestration and capture response/outcome to close the feedback loop. Health-literacy and language-appropriate content; respect consent/contact preferences (TCPA for SMS/calls).

**Own-it vs rent** — **OWN** the reachability/response models and the outcome-feedback data (the client's engagement intelligence, which compounds over time). **MANAGED-OWN-DESTINATION** acceptable for the *delivery channel* (an omnichannel messaging vendor) — rent the pipes, own the targeting and the response data. **RENT** end-to-end engagement platforms that own the response data deny you the feedback that makes targeting improve.

**Where it sits** — Gold (engagement/reachability marts) + delivery integration. Lifecycle: Architecture, Mobilization. Tier: serving + workflow + integration.

**Evidence anchors** — Outreach response rates are low and highly channel- and population-dependent (single-digit to low-double-digit contact/response rates are common for cold outreach — confirm with client historicals); matching channel and timing materially lifts response. Source: client outreach historicals (engagement-specific — must confirm); general digital-engagement benchmarks (treat as estimate).

**Anti-patterns** — (1) One-size-fits-all outreach (everyone gets a robocall) — low yield and member annoyance. (2) Optimizing reach without impact (reaching easy-to-reach low-value members). (3) Renting the channel *and* the response data, so targeting never improves. (4) Ignoring consent/TCPA and language/literacy fit.

**Feeds artifacts** — Architecture (engagement product); Mobilization (outreach operating model); Business case (engagement lift → closure/enrollment yield).

**Maturity** — emerging.

---

### PATTERN POPH-19 · Pop-health AI use-case portfolio ranking (value × feasibility × data-readiness × risk)

**Intent** — Decide *which* PHM AI use cases to do, and in what order — a defensible, repeatable ranking that survives executive scrutiny. The meta-pattern that sequences all the others.

**Applies to** — Strategy and Discovery for any PHM AI program. Move lifecycle: Strategy (the portfolio), Discovery (candidate generation), Business Case (the prioritized roadmap).

**Solution shape** — A scored portfolio of candidate use cases (drawn from POPH-02 through POPH-18), each rated on four explicit axes:
1. **Value** — quantified annual value from the use-case's Evidence anchors (Star/QBP dollars, avoidable-utilization savings, RAF integrity, etc.), risk-adjusted and confirmed against client data.
2. **Feasibility** — model/intervention maturity, organizational readiness to act (a prediction needs a care-management arm to be feasible), and time-to-value.
3. **Data-readiness** — is the required data present, governed, and trustworthy on the lakehouse? (Adherence/PDC needs pharmacy claims; HCC needs complete dx; SDOH needs screening — many use cases are gated on data the client doesn't yet have well.)
4. **Risk** — clinical-safety and bias exposure (POPH-05/17), regulatory exposure (RADV for coding, 42 CFR Part 2 for SUD), and reputational/equity risk.
Score, weight (with the client), and sequence: typically lead with high-value/high-data-readiness/low-risk loops (gap closure, adherence, avoidable utilization on existing data) before data-gated or higher-risk use cases (SDOH closed-loop, suspecting/RAF, NBA). Output is the prioritized roadmap that the Strategy and Business Case artifacts are built on. The portfolio is a living scorecard, re-run as data-readiness improves.

*Illustrative scoring rubric (calibrate weights with the client):* score each axis 1–5 and compute a weighted composite.

| Use case (example) | Value | Feasibility | Data-readiness | Risk (5 = low risk) | Typical sequencing |
|---|---|---|---|---|---|
| Adherence (MAD/MAH/MAC, ×3 Star) | 5 | 5 | 5 (pharmacy claims usually present) | 5 | **Wave 1** — high value, ready data, low risk |
| Care-gap closure (HEDIS bundles) | 5 | 4 | 4 | 5 | **Wave 1** |
| Avoidable readmissions (TOC) | 5 | 3 (needs TOC staffing) | 4 | 4 | **Wave 1–2** — gated on intervention arm |
| Rising-risk → care management | 4 | 3 | 3 | 3 (bias-test required) | **Wave 2** |
| HCC suspecting / RAF recapture | 5 | 3 | 3 | 2 (RADV exposure) | **Wave 2–3** — only after governance |
| SDOH closed-loop referral | 3 (est.) | 2 | 2 (screening data sparse) | 3 | **Wave 3** — data-gated |
| NBA recommender (clinical) | 4 | 2 | 3 | 2 (HIL + bias gates) | **Wave 3** — highest governance bar |

The pattern is the *method and the discipline*, not these specific scores — but the shape recurs: the cheapest, fastest, lowest-risk value (adherence, gaps) funds and de-risks the harder, higher-governance use cases (suspecting, NBA, SDOH) that come later.

**Own-it vs rent** — **OWN** (it's a method/scorecard, inherently the client's) — but the deeper own-it point: a portfolio built on **own-it** building blocks (POPH-01..18 on the lakehouse) is *composable and re-sequenceable*; a portfolio built on rented platforms is locked to the vendor's roadmap and feature set. The ranking method itself is the same; the strategic flexibility differs entirely. **RENT** alternative: accept a vendor's pre-packaged use-case bundle and inherit their sequencing — disqualified for an own-it mandate because you can't re-rank to your value math.

**Where it sits** — Strategy/Discovery artifacts (not a runtime data product). Lifecycle: Strategy, Discovery, Business Case. Tier: n/a (decision artifact).

**Evidence anchors** — Each use case's value pulls from its own pattern's Evidence anchors (POPH-02..18), so the portfolio is fully provenance-traced. The four-axis frame (value/feasibility/data/risk) is the standard AI-portfolio prioritization discipline applied to PHM; weights are client-specific. Source: this pack's per-pattern Evidence anchors; client value-baseline data; standard AI-use-case prioritization practice.

**Anti-patterns** — (1) Ranking on **value alone**, ignoring data-readiness — picking the highest-value use case that's gated on data you don't have, and stalling. (2) Ignoring the **intervention-feasibility** axis — funding predictions with no operational arm to act on them (the recurring "prediction without action" failure across this pack). (3) Underweighting **risk** — leading with a high-bias-exposure or RADV-exposed use case before governance is ready. (4) Accepting a vendor's pre-bundled sequence (rent) and losing the ability to re-rank to your own value math. (5) Treating the ranking as one-time rather than a living scorecard re-run as data matures.

**Feeds artifacts** — Strategy (the prioritized PHM AI portfolio and sequencing rationale); Business case (the roadmap and phased value); Discovery (candidate inventory and data-readiness assessment). This pattern *composes* every other POPH pattern.

**Maturity** — production-ready.

---

## Composition cheat-sheet (PHM → cross-cutting)

| PHM use case | Lead domain patterns | Typical cross-cutting composition |
|---|---|---|
| Risk stratification (revenue + clinical) | POPH-04, POPH-05, POPH-01 | INGEST-06 (Epic), MODEL-02 (OMOP/claims), MLOPS-03, GOV-02 (HITRUST), GOV-05 (bias/RADV) |
| Rising-risk + care management | POPH-07, POPH-16, POPH-17 | MODEL-02/05 (identity/MPI), MLOPS-03, GOV-05 |
| Quality / Stars loop | POPH-03, POPH-06, POPH-11 | INGEST-03 (ingestion), MODEL-02, FINOPS (value math) |
| Avoidable utilization | POPH-09, POPH-05, POPH-10 | MODEL-02, MLOPS-03 |
| SDOH / equity | POPH-13, POPH-14, POPH-15 | INGEST (FHIR/Gravity), GOV-05 (42 CFR Part 2, equity), MODEL-02 |
| Portfolio / roadmap | POPH-19 (composes all) | FINOPS (rate-card effort), ARCH-01 (landing zone) |

**Provenance reminder (from README):** every Move-artifact claim cites a pattern ID + a benchmark source (or "estimate — confirm with client data") + a human input. Rent-side choices require surfaced rationale. Rejected options cite the relevant Anti-pattern field. Quantitative ranges in this pack flagged "confirm" are estimates pending client data.
