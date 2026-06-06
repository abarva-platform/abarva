# Pattern Pack — Payer / Health Plan (`PAYER`)

**Pack code:** `PAYER`
**Domain:** Health plans, with emphasis on Medicare Advantage (MA), D-SNP, and integrated payer-provider organizations (e.g., Presbyterian Health Services — a plan that also owns delivery).
**Composition:** Domain patterns here compose with cross-cutting packs (`ARCH`, `INGEST`, `MODEL`, `MLOPS`, `GOV`, `FINOPS`) and adjacent domain packs (`POPH` population health, `CLIN` clinical performance). A payer Move artifact selects PAYER patterns for the *business + data + AI approach* and cross-cutting patterns for the *platform underneath*.

**The two value spines.** For an MA plan, value almost always concentrates on two axes: **CMS Star Ratings** (the 4-star bonus + rebate retention) and **Medical Loss Ratio (MLR)** (the 85% floor + medical cost trend). Risk adjustment accuracy (RAF) sits underneath both — it scales revenue (and therefore the MLR denominator) but carries the heaviest compliance load in the entire domain. Most other patterns in this pack are levers on one of these three.

**The own-it thesis for an integrated payer-provider.** The defining structural advantage is that an integrated payer-provider holds *both* the claims/enrollment/Star data (plan side) *and* the EHR/clinical/encounter data (provider side). A point-solution SaaS vendor sees only one slice and holds the model on its own cloud. An own-it lakehouse is the only architecture that can unify plan + provider data to drive Stars, RAF recapture, care-management targeting, and VBC reconciliation off a single source of truth — and keep the models, features, and IP with the client. Every pattern's Own-it field returns to this.

**A regulatory note up front — risk adjustment.** Several patterns touch HCC coding and RAF. The own-it value is *accurate, defensible, fully documented* coding — recapture of conditions that are genuinely present and supported in the medical record. It is **never** inflating RAF without documentation. That is upcoding, and it carries RADV recoupment and DOJ False Claims Act exposure. The compliance anti-pattern is repeated deliberately wherever it applies. Treat it as a hard constraint, not a tuning knob.

**The D-SNP dimension.** For an integrated payer-provider like PHS, **Dual Eligible Special Needs Plans (D-SNP)** are a distinct and growing segment with their own mechanics layered on top of standard MA:
- **Higher acuity, higher RAF, higher SDOH burden** — dual-eligibles carry more chronic disease and social need, so the risk-adjustment (PAYER-05), care-management (PAYER-13), and SDOH-informed Star outreach (PAYER-01/02) patterns matter disproportionately.
- **Medicare-Medicaid integration** — D-SNPs require a State Medicaid Agency Contract (SMAC) and increasing integration (the push toward **FIDE-SNP / HIDE-SNP / applicable integrated plans**), meaning the lakehouse must unify Medicare *and* Medicaid data — another own-it advantage no single point vendor spans.
- **Health Equity Index (HEI)** — CMS replaced the reward factor with the **Health Equity Index reward** (first applied to the 2027 Star year, based on 2024–2025 performance), which rewards plans for strong Star performance among members with **social risk factors (SRF)** — dual/LIS/disabled. This makes equity-stratified Star performance (especially in D-SNP membership) a direct Star-revenue lever — fold it into PAYER-01 and PAYER-19.

> Benchmark figures below are industry ranges from CMS, KFF, MedPAC, AHIP, and actuarial sources. Plan-specific dollar values are illustrative and **must be confirmed against the client's own membership, bid, and financials.** Flagged inline as "estimate — confirm with client data."

---

## Index

| ID | Pattern | Value spine |
|---|---|---|
| PAYER-01 | CMS Star Ratings improvement engine | Stars |
| PAYER-02 | CAHPS / member-experience measure lift | Stars |
| PAYER-03 | Part D adherence Star measures (MAD/MAH/MAC) | Stars |
| PAYER-04 | Medical Loss Ratio (MLR) management | MLR |
| PAYER-05 | Risk adjustment / HCC coding accuracy (compliant recapture) | RAF (both) |
| PAYER-06 | RADV audit readiness + coding defensibility | RAF compliance |
| PAYER-07 | Prior authorization automation (CMS PA final rule, FHIR) | MLR / abrasion |
| PAYER-08 | Utilization management + site-of-care optimization | MLR |
| PAYER-09 | High-cost case management targeting | MLR |
| PAYER-10 | Member retention / disenrollment prediction | Stars / revenue |
| PAYER-11 | Complaints, appeals & grievances analytics | Stars |
| PAYER-12 | Fraud, waste & abuse (FWA) detection | MLR |
| PAYER-13 | Care-management ROI targeting | MLR |
| PAYER-14 | Network adequacy + high-value provider identification | MLR / Stars |
| PAYER-15 | Value-based contract (VBC) management + attribution | MLR |
| PAYER-16 | Claims auto-adjudication + pended-claim reduction | Admin cost |
| PAYER-17 | Pharmacy / Part D trend + specialty drug management | MLR |
| PAYER-18 | Actuarial trend forecasting + bid support | MLR / revenue |
| PAYER-19 | Payer AI use-case portfolio (value × feasibility × reg-risk × data-readiness) | Strategy |

---

### PATTERN PAYER-01 · CMS Star Ratings improvement engine

**Intent** — Move and hold an MA contract at/above 4.0 Stars by quantifying the gap to the next half-star on every weighted measure and directing intervention where the marginal dollar of effort buys the most rating.

**Applies to** — MA / MA-PD and D-SNP contracts; Discovery (current-state Star diagnostic), Strategy (the Stars value spine), Business Case (bonus + rebate math). Composes with PAYER-02, -03, -11.

**Solution shape** — A unified Star measure model on the lakehouse spanning the four measure families:
- **HEDIS** (clinical process/outcome — e.g., breast cancer screening, controlling blood pressure, diabetes eye exam, statin therapy) drawn from claims + supplemental clinical/EHR data;
- **CAHPS** (member experience survey — see PAYER-02), now heavily weighted;
- **HOS** (Health Outcomes Survey — physical/mental functioning, fall-risk, bladder control);
- **Operational / administrative** (CTM complaints, appeals timeliness, call-center foreign-language/TTY, MTM completion).

Each measure is scored against current-year **cut points** (the score thresholds CMS sets, retrospectively, that map a rate to 1–5 Stars). Because cut points are set on the *distribution of all contracts* and are subject to **Tukey outer-fence outlier removal** (effective from the 2024 Star year for non-CAHPS measures) plus **guardrails** (±5% year-over-year cap on most cut-point movement), the engine must model cut points as *moving and uncertain*, not fixed targets. AI does four things: (1) predicts each measure's year-end rate and the probability of clearing each cut point; (2) computes the **weighted-Star marginal value** of closing a given gap (a measure carries weight 1 for process, up to weight 3 for outcome and — in recent Star years — weight 2–4 for patient-experience/access depending on the applicable year); (3) ranks interventions by Stars-per-effort, accounting for the **reward-factor / categorical-adjustment-index** (CAI) mechanics, the new **Health Equity Index (HEI) reward** that replaces the reward factor from the 2027 Star year, and the all-important question of whether the contract is near the **4.0 threshold** where the Quality Bonus Payment turns on; (4) stratifies measure performance by **social risk factor (SRF)** so the plan can both close equity gaps and earn the HEI reward — for a D-SNP-heavy integrated payer-provider this is a first-class lever, not an afterthought.

The **measure-weight changes** matter to the ranking: CMS has repeatedly reweighted measures (the patient-experience/access weight rose to 4×, then is reduced to 2× from the 2026 Star year; outcome/intermediate-outcome measures generally carry weight 3). The engine must use the *applicable Star year's* weights, not a stale table — a measure's Stars-per-effort changes when its weight changes.

**Own-it vs rent** — **OWN.** Star measure logic, cut-point prediction models, and member-level gap lists live on the client lakehouse, fed by the client's own claims + supplemental + (for integrated payer-providers) EHR data. **RENT** = a Stars-vendor SaaS (e.g., point platforms) that ingests the plan's data to *its* cloud, scores on *its* logic, and returns dashboards — the plan never owns the measure models or the unified member view, and cannot fuse provider-side data it already holds. For an integrated payer-provider, own-it is decisive: the provider EHR closes HEDIS gaps (e.g., documented BP control, eye exams) that a claims-only vendor cannot see.

**Where it sits** — Gold (Star measure marts, cut-point predictions, member gap registry); serving tier (care-gap worklists, broker/SDOH outreach, provider scorecards). Lifecycle: Strategy + Business Case spine.

**Evidence anchors** —
- The **Quality Bonus Payment** for a ≥4-star contract is a **5% increase to the benchmark** (the county rate against which bids are compared), plus a higher **rebate share** (≥4 stars retains 70% of the bid-to-benchmark savings vs 65% at 3.5–<4.5 and 50% below 3.5). The combined effect is commonly cited as **~$400–$500 per member per year** in additional revenue/rebate value (CMS rate methodology; AHIP/actuarial summaries — *estimate, confirm with client membership and county benchmarks*).
- Moving a single weight-4 measure across a cut point can shift the overall rating when the contract sits on a threshold; near 4.0 the marginal value of *any* clearing measure is disproportionate.
- Tukey outlier removal compressed many cut points and made several measures harder to clear at the top end (CMS 2024+ Star Technical Notes).
- The **HEI reward** (first applied to 2027 Star ratings, computed on 2024–2025 performance) rewards plans that perform well on Star measures among **SRF members (dual/LIS/disabled)** — directly monetizing equity performance and replacing the prior reward factor (CMS HEI methodology).
- Source anchors: CMS Medicare 2024/2025 Part C&D Star Ratings Technical Notes; CMS Health Equity Index methodology; KFF MA Star Ratings briefs; MedPAC MA chapters.

**Anti-patterns** —
- **Chasing low-weight process measures while ignoring the heavily weighted CAHPS / patient-experience / admin measures.** A plan that "moves the needle" on weight-1 HEDIS items but lets CAHPS slide is optimizing the wrong objective function — patient-experience and complaints weighting dominates the composite.
- **Treating cut points as fixed.** Targeting last year's threshold ignores guardrails, Tukey removal, and distributional drift; the engine must predict the *moving* cut point.
- **Fragmented Stars vendor that can't fuse provider EHR data** an integrated payer-provider already owns (see PAYER-19 anti-pattern).

**Feeds artifacts** — Strategy (Stars value spine, target rating trajectory); Business Case (QBP + rebate revenue line); Architecture (Star marts + gap registry on Gold); Mobilization (Star "war room" operating cadence).

**Maturity** — production-ready.

---

### PATTERN PAYER-02 · CAHPS / member-experience measure lift

**Intent** — Raise the heavily weighted patient-experience measures (CAHPS) that now dominate the Star composite, by mining every member touchpoint for experience signal and acting before the survey fields.

**Applies to** — MA-PD / D-SNP; Strategy, Business Case. Composes with PAYER-01, -11.

**Solution shape** — CAHPS measures (Getting Needed Care, Getting Care Quickly, Rating of Health Plan, Rating of Drug Plan, Care Coordination, Customer Service, etc.) are *survey-based* and lagging — you cannot retroactively fix a member's year. The solution is a **leading-indicator model**: ingest call-center transcripts, IVR/abandonment data, complaint/CTM records, claims-denial and appeal events, pharmacy fill friction, and provider-access metrics; predict which members are at risk of a poor experience rating and trigger proactive service recovery (callbacks, care-coordination outreach, benefit navigation). Use NLP on call transcripts to detect dissatisfaction, effort, and unresolved issues in near-real-time. Because CAHPS carries high weight and is *not* subject to Tukey outlier removal (CAHPS measures use a different cut-point methodology), it is frequently the highest-leverage Star investment.

**Own-it vs rent** — **OWN** for the predictive experience model and the unified member-touchpoint feature store on the lakehouse. Telephony/transcription and survey administration are reasonably **RENT** (specialized vendors; CAHPS surveys are CMS-contracted to approved vendors anyway), but the *signal extraction, prediction, and next-best-action* stay on the client estate so the plan owns the member-experience intelligence and can join it to clinical + claims data.

**Where it sits** — Silver (touchpoint event streams), Gold (experience-risk scores), serving (service-recovery worklists). Strategy + Business Case.

**Evidence anchors** —
- Patient-experience / CAHPS and complaints measures collectively carry the **largest share of the Star weighting** under the current methodology (CMS reduced the patient-experience weight from 4× to 2× starting with the 2026 Star year, but it remains a top-weighted family — confirm the applicable Star year's weights).
- Service-recovery and proactive-outreach programs report CAHPS composite lifts in the **mid-single-digit percentage points** on targeted measures (industry case studies — *estimate, confirm*).
- Sources: CMS CAHPS measure specifications; CMS Star weighting changes (2026 patient-experience reweighting); AHRQ CAHPS program.

**Anti-patterns** —
- **Surveying-season scrambles** — running experience campaigns only when the survey fields; the model must run year-round because the member's experience is cumulative.
- **Ignoring call-center signal** that already predicts dissatisfaction in favor of generic satisfaction surveys.
- Under-weighting CAHPS relative to clinical HEDIS (the PAYER-01 anti-pattern, restated).

**Feeds artifacts** — Strategy (experience value spine); Business Case (CAHPS Star contribution); Architecture (touchpoint feature store); Mobilization (service-recovery operating model).

**Maturity** — production-ready.

---

### PATTERN PAYER-03 · Part D adherence Star measures (MAD / MAH / MAC)

**Intent** — Lift the three triple-weighted Part D medication-adherence Star measures by predicting non-adherence (by PDC) early and intervening before the member falls below the 80% threshold.

**Applies to** — MA-PD / D-SNP with Part D; Strategy, Business Case. Composes with PAYER-17, POPH adherence patterns.

**Solution shape** — The Part D adherence measures — **MAD** (diabetes medications), **MAH** (hypertension / RAS antagonists), **MAC** (cholesterol / statins) — are each scored on the share of members with **Proportion of Days Covered (PDC) ≥ 80%**, and each is **weight 3** in the Star composite, making them collectively one of the largest movable blocks. The solution is a **PDC trajectory model**: from pharmacy claims, project each member's year-end PDC and flag those trending below 80% with enough days left to recover; trigger refill reminders, 90-day fill conversion, sync programs, and pharmacist MTM. Layer SDOH and prior-gap features to prioritize. Distinguish *recoverable* members (a few late refills) from already-lost ones where the year is mathematically unrecoverable — effort goes to the recoverable band.

**Own-it vs rent** — **OWN** for the PDC prediction and member-prioritization models on pharmacy claims held in the lakehouse. PBM/pharmacy operations and MTM delivery may be **RENT/partner**, but the adherence intelligence and the join to medical claims (to catch, e.g., a hospitalization that broke a fill streak) stays own-it. An integrated payer-provider additionally joins provider EHR med lists.

**Where it sits** — Gold (PDC trajectory marts), serving (adherence outreach worklists). Strategy + Business Case.

**Evidence anchors** —
- MAD/MAH/MAC are each **weight 3**; the **80% PDC** threshold is the measure definition (PQA / CMS Part D Star specs).
- Adherence programs commonly report **3–8 percentage-point** PDC improvements on targeted cohorts; because three weight-3 measures move together, the Star leverage is high (industry case studies — *estimate, confirm*).
- Sources: Pharmacy Quality Alliance (PQA) measure specs; CMS Part D Star Technical Notes.

**Anti-patterns** —
- **Spraying refill reminders at the whole book** instead of the recoverable-band members where intervention changes the year-end PDC.
- **Ignoring the mathematical recoverability window** — members already below the unrecoverable line consume effort with zero Star return.

**Feeds artifacts** — Strategy (Part D Star block); Business Case (adherence Star contribution); Architecture (PDC marts); Mobilization (pharmacy outreach cadence).

**Maturity** — production-ready.

---

### PATTERN PAYER-04 · Medical Loss Ratio (MLR) management

**Intent** — Keep MLR profitably above the regulatory floor while managing it away from rebate-triggering excess, by instrumenting the numerator (medical + quality-improvement spend) and denominator (premium net of taxes/fees) and modeling the levers.

**Applies to** — MA, large-group, and (at the 80% floor) individual/small-group lines; Strategy, Business Case, Architecture. The MLR value spine. Composes with PAYER-05, -08, -13, -17.

**Solution shape** — MLR = (incurred claims + **quality-improvement activity (QIA)** expense) / (premium − federal/state taxes and regulatory fees), with **credibility adjustments** for smaller blocks (a small block's experience is partially credible, so the formula blends toward a standard). The ACA sets an **85% floor for large group and Medicare Advantage** (80% for individual/small group); a plan whose MLR falls *below* the floor owes **rebates** — for MA, remitted to CMS, and sustained sub-floor performance triggers enrollment-suspension and contract-termination sanctions. The model on the lakehouse:
1. **computes MLR** by line/segment/contract in near-real-time off claims + premium data with **IBNR / completion factors** (so the in-year ratio reflects claims not yet paid);
2. **projects year-end MLR** and the resulting **rebate exposure** (and, symmetrically, margin headroom);
3. **decomposes drivers** — utilization, unit cost, mix, risk-adjusted revenue, and QIA classification — so leadership sees *why* the ratio is moving;
4. **ranks the levers**: **care management** (PAYER-13), **utilization management / site-of-care** (PAYER-08), **network** (PAYER-14), **pharmacy trend** (PAYER-17), and **risk-adjusted revenue accuracy** (PAYER-05 — which raises the denominator *legitimately*, never via undocumented coding).

The point is that MLR is a *managed* ratio in a band: too high erodes margin; too low triggers rebates *and* signals the plan is leaving member value (richer benefits) on the table relative to competitors. The lever ranking changes as the projected ratio moves within or toward the band.

**Own-it vs rent** — **OWN.** MLR computation, IBNR/completion modeling, and lever decomposition belong on the client lakehouse joined to claims, premium, and (own-it advantage) the provider cost side. **RENT** = generic payer-analytics SaaS that returns an MLR dashboard but holds the completion models and cannot integrate the plan's own provider-cost data. Actuarial completion factors may be co-developed with the plan's actuaries but should be transparent and client-owned, not a vendor black box.

**Where it sits** — Gold (MLR marts, IBNR/completion, rebate-exposure projections); serving (finance + actuarial dashboards). Strategy + Business Case spine; Architecture.

**Evidence anchors** —
- **85% MLR floor** for large group and Medicare Advantage; **80%** for individual/small group (ACA §2718 / 45 CFR Part 158; CMS MA MLR regulations at 42 CFR §422.2410).
- A **one-point MLR move** on a large book is material: on $1B of premium, one point = **$10M** (arithmetic; the *value* depends on whether it crosses the rebate floor or flows to margin — confirm with client premium base).
- MA plans must report MLR to CMS annually and remit rebates plus face enrollment/marketing sanctions for sustained sub-floor MLR (42 CFR §422.2410).
- Sources: CFR Part 158 / 42 CFR §422.24xx; KFF MLR rebate trackers; CMS MA MLR reporting.

**Anti-patterns** —
- **Managing MLR by denying care / aggressive prior auth** — increases abrasion, complaints, appeals (hurts Stars per PAYER-11), and invites regulatory scrutiny; the durable levers are care management, site-of-care, and network, not denial.
- **Treating risk-adjusted revenue as a free MLR lever via aggressive coding** — raising the denominator through undocumented RAF is upcoding, not MLR management (see PAYER-05 / PAYER-06 compliance anti-pattern).
- **Ignoring QIA classification** — quality-improvement spend counts in the numerator; mis-classifying it understates MLR and can be a compliance finding.

**Feeds artifacts** — Strategy (MLR value spine); Business Case (margin + rebate-avoidance line); Architecture (MLR marts); Mobilization (MLR governance cadence with actuarial + medical economics).

**Maturity** — production-ready.

---

### PATTERN PAYER-05 · Risk adjustment / HCC coding accuracy (compliant recapture)

**Intent** — Ensure the plan's RAF reflects the *true, documented* burden of illness in its membership — recapturing chronic conditions that are genuinely present and supportable in the record — so revenue is accurate and the MLR denominator is fair, **without any movement toward undocumented coding.**

**Applies to** — MA / D-SNP risk-adjusted lines; Strategy, Business Case, Architecture, and (critically) Governance. Composes with PAYER-04, -06, POPH risk patterns.

**Solution shape** — CMS pays MA plans on a **risk-adjusted** basis: each member's **RAF (Risk Adjustment Factor)** is built from demographics plus **HCCs (Hierarchical Condition Categories)** mapped from documented diagnoses. CMS is phasing in the **CMS-HCC v28** model (more granular categories, several conditions reweighted or constrained vs v24), blended in over multiple payment years. The compliant solution has two legitimate halves:
- **Suspecting / prospective** — surface members with clinical evidence (labs, meds, prior-year HCCs, imaging, EHR signals) suggesting a *likely-present but uncoded* chronic condition, and route them to the provider for *assessment and documentation in the current year* (HCCs must be re-documented annually). The output is a **suspect list with the supporting evidence attached**, not a diagnosis.
- **Recapture / retrospective** — identify conditions coded in a prior year not yet recaptured this year, again routed for clinical confirmation and documentation.

The non-negotiable rule: AI **surfaces evidence and prompts a clinician**; the clinician examines, confirms, and documents per coding guidelines (ICD-10-CM + CMS RA rules: the condition must be evaluated/addressed at a qualifying **face-to-face encounter** by an acceptable provider type and documented to **MEAT** — Monitored, Evaluated, Assessed/Addressed, Treated — or **TAMPER** standards). The model's job is to find *legitimately present, under-documented* conditions and make accurate coding easier — never to assert codes the record doesn't support.

A concrete *legitimate* example: a member has an A1c of 9.2 and is on metformin (claims + lab evidence) but has **no diabetes-with-complication HCC documented this year**. The model surfaces this to the PCP with the lab and med evidence; the clinician evaluates the member, confirms the diabetic status and any complications, and documents accordingly. That is compliant recapture of a genuinely present, evidenced, clinician-confirmed condition. The illegitimate counterpart — auto-asserting a complication HCC the chart doesn't support to lift RAF — is upcoding and is out of scope by design.

Under **CMS-HCC v28**, some conditions were reweighted, constrained, or moved between payment HCCs (e.g., changes to diabetes, vascular, and several chronic-condition groupings), and the count of payment HCCs expanded; suspecting logic must be built against the *v28 (blended)* mapping for the applicable payment year, not v24, or it will mis-estimate value and mis-route suspects.

**Own-it vs rent** — **OWN.** Suspecting models, evidence assembly, and recapture tracking on the client lakehouse — for an integrated payer-provider this is uniquely powerful because the *provider EHR is in the same estate*, so a suspect can be surfaced directly in the clinician's workflow with the evidence, and documented at the point of care. **RENT** = a risk-adjustment vendor that ingests claims, runs proprietary "code-finding" on its cloud, and bills per code captured — a model that creates **financial incentive to over-suspect** and holds the audit trail off-estate. The own-it posture is also the *compliance-defensible* posture: the plan owns the full evidence-to-documentation chain for any RADV inquiry.

**Where it sits** — Gold (HCC/RAF marts, suspect registry with linked evidence); serving (provider point-of-care prompts, coder worklists); Governance (every suspect carries provenance). Strategy + Business Case; Architecture.

**Evidence anchors** —
- **CMS-HCC v28** is being phased in (blended with v24 across payment years; check the applicable year's blend); v28 expanded HCC count and reweighted/constrained several condition groups (CMS Advance Notice / Rate Announcement).
- HCCs must be **documented annually**; a chronic condition not re-documented in the current year drops from RAF — legitimate recapture of genuinely present conditions is the core of accurate RA.
- Accurate RA materially affects revenue (RAF scales the benchmark payment); a 0.1 RAF change on a member is roughly a low-single-digit-percent payment change (arithmetic against the plan's average payment — *confirm with client bid/payment data*).
- Sources: CMS Risk Adjustment (Part C) program; CMS-HCC v28 model documentation; ICD-10-CM Official Coding Guidelines; OIG/DOJ MA risk-adjustment enforcement actions.

**Anti-patterns** —
- **THE compliance anti-pattern: an AI that inflates RAF without supporting documentation.** Auto-asserting codes, "suggesting" diagnoses the record doesn't support, or chasing capture rate as the objective — this is **upcoding**, exposing the plan to **RADV recoupment with extrapolation** and **DOJ False Claims Act** liability (a sustained federal enforcement focus on MA RA). The model must optimize *documented accuracy and defensibility*, never raw RAF.
- **Per-code vendor incentives** that reward volume of codes found over documentation quality.
- **One-and-done annual sweeps** that miss in-year recapture and create year-end documentation crunches.

**Feeds artifacts** — Strategy (RA accuracy program); Business Case (accurate-revenue line, explicitly framed as documented recapture); Architecture (suspect registry + provenance); Governance (RADV-ready audit trail); Mobilization (provider point-of-care integration).

**Maturity** — production-ready (with the compliance constraints as hard requirements).

---

### PATTERN PAYER-06 · RADV audit readiness + coding defensibility

**Intent** — Make every risk-adjustment dollar defensible under a CMS or OIG **RADV (Risk Adjustment Data Validation)** audit by maintaining a complete, queryable chart-to-code provenance chain and continuously validating coding against documentation.

**Applies to** — MA / D-SNP; Governance, Architecture, Business Case (as a risk-mitigation control). Composes with PAYER-05 and GOV cross-cutting patterns.

**Solution shape** — RADV audits validate that submitted HCCs are supported by a qualifying medical record; CMS finalized **RADV extrapolation** (audit-sample error rates extrapolated across the contract), materially raising the stakes of unsupported codes. The readiness solution: (1) a **chart-to-code linkage** layer that ties every submitted diagnosis to its source encounter and document on the lakehouse; (2) **continuous internal validation** — second-pass coding/NLP that flags submitted HCCs lacking adequate documentation (MEAT/TAMPER) *before* they're submitted or *before* an audit finds them, so they can be corrected/deleted; (3) **RADV sample simulation** — model likely audit samples and estimate exposure; (4) **deletion/correction workflow** for unsupported codes (proactive deletion reduces extrapolated exposure). This is the compliance complement to PAYER-05: PAYER-05 finds legitimately present conditions; PAYER-06 proves and, where needed, retracts.

**Own-it vs rent** — **OWN, and necessarily so.** The chart-to-code provenance and validation must live on the client estate — it *is* the audit defense; you cannot subcontract owning your own evidence. External coding-audit firms may supplement, but the canonical provenance store and the validation models are own-it.

**Where it sits** — Governance + Gold (chart-to-code provenance, validation findings); serving (coder/compliance worklists). Architecture; Business Case (risk-mitigation); Governance.

**Evidence anchors** —
- CMS **RADV final rule (2023)** permits **extrapolation** of audit-sample error rates and removed the FFS adjuster — sharply increasing potential recoveries (CMS RADV final rule).
- DOJ and OIG have pursued multiple MA plans for unsupported RA codes under the **False Claims Act**; settlements have reached hundreds of millions (DOJ press releases; OIG MA RA reports).
- Proactive deletion of unsupported codes is a recognized mitigation; the value is **avoided recoupment + avoided FCA exposure** (qualitative — quantify against the plan's RA revenue at risk, *confirm with client*).
- Sources: 42 CFR §422.310 et seq.; CMS RADV final rule; OIG MA risk-adjustment audit reports; DOJ FCA MA settlements.

**Anti-patterns** —
- **Submitting first and validating never** — discovering unsupported codes only when CMS/OIG does.
- **Treating RADV as a one-time scramble** rather than continuous validation.
- **Off-estate provenance** — relying on a vendor's records as your audit defense (restatement of PAYER-05 compliance anti-pattern from the defense side).

**Feeds artifacts** — Governance (RADV control); Architecture (provenance store); Business Case (risk-mitigation line); Mobilization (compliance operating cadence).

**Maturity** — production-ready.

---

### PATTERN PAYER-07 · Prior authorization automation (CMS PA final rule, FHIR)

**Intent** — Automate prior-authorization decisioning to cut turnaround time and member/provider abrasion while meeting the CMS Interoperability and Prior Authorization Final Rule — auto-approving clearly-appropriate requests and routing only genuine edge cases to clinical review.

**Applies to** — MA, Medicaid MCO, and (per the rule) other CMS-regulated lines; Strategy, Architecture, Business Case. Composes with PAYER-08, -16, INGEST FHIR patterns.

**Solution shape** — The **CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F, 2024)** mandates (phasing to 2026/2027) FHIR-based APIs and shortened timeframes for impacted payers (MA, Medicaid/CHIP FFS and managed care, QHP issuers on the FFEs):
- **Patient Access API**, **Provider Access API**, **Payer-to-Payer API**, and a dedicated **Prior Authorization API** implementing the HL7 **Da Vinci** stack — **CRD** (Coverage Requirements Discovery), **DTR** (Documentation Templates and Rules), and **PAS** (Prior Authorization Support);
- shortened decision timeframes — **72 hours expedited / 7 calendar days standard** for non-drug PA in MA (effective 2026);
- required **specific denial-reason reporting** and public PA-metrics reporting.

The automation pattern: ingest the FHIR PA request, run **automated clinical appropriateness** against the plan's medical policy / criteria (e.g., InterQual/MCG-aligned rules expressed as own-it executable decision logic), and **auto-approve** requests that clearly meet criteria; route only ambiguous/insufficient-evidence cases to a clinician. CRD surfaces coverage requirements to the provider *at the point of order*, and DTR auto-gathers the documentation, so many requests arrive complete and clean. The objective is **abrasion reduction** — fewer touches, faster yeses, fewer back-and-forth document chases — *not* more denials. A well-built program shrinks both turnaround time and the *number of items requiring PA at all* (gold-carding low-risk providers/services).

**Own-it vs rent** — **OWN** for the decision logic, the auto-approval models, and the FHIR PA orchestration on the client estate, so the plan owns its medical-policy automation and can tune it transparently. Criteria content (InterQual/MCG) is licensed **RENT** content but should be wrapped in own-it executable rules; FHIR API infrastructure can run on the client's cloud. **RENT** = a black-box PA vendor that makes the determinations on its platform — the plan loses control of the determination logic and the abrasion outcome.

**Where it sits** — Serving (FHIR PA APIs), Gold (PA decision data, turnaround metrics), data plane (decision logic). Architecture; Strategy.

**Evidence anchors** —
- **CMS-0057-F**: FHIR PA API + Provider Access + Payer-to-Payer APIs (compliance dates **Jan 2027** for APIs); shortened PA timeframes (**72h expedited / 7d standard**) and denial-reason transparency effective **2026** (CMS final rule).
- Automated auto-approval of low-complexity requests can take **40–70%** of PA volume out of manual review in mature programs (industry — *estimate, confirm*), cutting admin cost (PAYER-16) and turnaround.
- Sources: CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F); HL7 Da Vinci CRD/DTR/PAS implementation guides.

**Anti-patterns** —
- **PA automation that increases denials or abrasion** — automating *rejection* rather than *approval* of appropriate care; this raises appeals/grievances (PAYER-11), damages CAHPS (PAYER-02), and invites regulatory and member backlash. The KPI is faster appropriate approvals, not higher denial throughput.
- **Bolting FHIR APIs on without re-engineering the decision** — meeting the letter of the rule while leaving turnaround and abrasion unchanged.
- **Black-box vendor determinations** the plan can't audit or tune.

**Feeds artifacts** — Strategy (abrasion + interop compliance); Architecture (FHIR PA target state); Business Case (admin savings + abrasion/Star benefit); Mobilization (PA operating redesign).

**Maturity** — production-ready (regulatory-driven).

---

### PATTERN PAYER-08 · Utilization management + site-of-care optimization

**Intent** — Reduce avoidable medical spend by steering care to the appropriate, lowest-acuity setting and shortening avoidable inpatient days — through concurrent review and predictive UM, without denying necessary care.

**Applies to** — MA / Medicaid; Strategy, Business Case. The MLR lever. Composes with PAYER-04, -09, -14.

**Solution shape** — Three coordinated plays:
- **Concurrent / inpatient review** — predict length-of-stay and discharge-readiness from admission data (diagnosis, comorbidity, prior utilization, social/discharge barriers); flag stays exceeding clinical expectation for case-management focus and timely, *safe* discharge planning. The model should surface the *barrier* (no SNF bed, no caregiver, pending DME) so the case manager can act, not just the day-count.
- **Site-of-care optimization** — identify procedures, infusions, and imaging being performed in high-cost settings (hospital outpatient department) that are clinically appropriate at lower-cost sites (ambulatory surgery center, freestanding imaging, home infusion); model the *steerable* population (clinically eligible + geographically feasible) and the savings, and feed the steering into benefit design and provider routing.
- **Avoidable admission / readmission prevention** — predict admissions and 30-day readmissions amenable to ambulatory, transition-of-care, or care-management intervention (ties to POPH ED/admit-avoidance and PAYER-13 impactability targeting); route to the right program before the admission, not after.

For an **integrated payer-provider**, this is delicate and powerful: the plan and the delivery system share incentives, so site-of-care steering and LOS management can be *aligned and clinically led* rather than adversarial — the owned delivery system can stand up the lower-cost sites the plan wants to steer to. The risk is the opposite failure mode: steering that looks like denial to the member.

**Own-it vs rent** — **OWN** for the LOS/admission/site-of-care models on the lakehouse joined to claims + (own-it) EHR/utilization data. Criteria content (MCG/InterQual) is licensed **RENT**; the predictive models and steering analytics are own-it.

**Where it sits** — Gold (utilization marts, LOS/site-of-care models), serving (UM/case-management worklists). Strategy + Business Case.

**Evidence anchors** —
- Site-of-care shifts (HOPD → ASC/home) commonly cited at **30–60% unit-cost reduction** for eligible procedures/infusions (industry/actuarial — *estimate, confirm*).
- Avoidable admissions and readmissions are a top MLR driver; even modest reductions move the ratio on a large block (see PAYER-04 one-point math).
- Sources: MedPAC site-neutral analyses; AHRQ avoidable-admission (PQI) measures; actuarial trend studies.

**Anti-patterns** —
- **UM as denial machine** — cutting medical cost by withholding necessary care; raises appeals/abrasion (PAYER-11, -02) and regulatory risk. Site-of-care and LOS optimization preserve care quality; denial does not.
- **Generic LOS models** that ignore social/discharge barriers and so flag stays that can't actually be shortened safely.

**Feeds artifacts** — Strategy (UM/MLR lever); Business Case (avoidable-spend line); Architecture (utilization marts); Mobilization (UM redesign).

**Maturity** — production-ready.

---

### PATTERN PAYER-09 · High-cost case management targeting

**Intent** — Identify the small cohort of members who will drive a disproportionate share of next-period cost early enough to intervene, and match them to the right intensity of case/complex-care management.

**Applies to** — MA / D-SNP / Medicaid; Strategy, Business Case. MLR lever. Composes with PAYER-08, -13, POPH rising-risk.

**Solution shape** — A small fraction of members drive a large majority of spend. The pattern is a **prospective high-cost prediction model**: rank members by predicted next-12-month total cost (and *impactability* — see PAYER-13), focusing on the **rising-risk** band where intervention can change trajectory rather than the already-catastrophic band where it often cannot. Layer drivers (poly-chronic, ESRD/oncology/transplant trajectories, polypharmacy, prior utilization, SDOH) and route to the appropriate program: complex case management, disease management, palliative/serious-illness, or transition-of-care. The output is a *targeted, impactable* enrollment list, not a raw cost ranking.

**Own-it vs rent** — **OWN.** Cost-prediction and impactability models on the lakehouse; for an integrated payer-provider, fused with EHR clinical trajectory data the plan already owns.

**Where it sits** — Gold (cost-prediction + impactability scores), serving (case-management enrollment worklists). Strategy + Business Case.

**Evidence anchors** —
- The familiar **~5% of members ≈ ~50% of spend** concentration (and **~1% ≈ ~20%+**) — verify on the client's own claims, as concentration varies by line (HCCI / AHRQ concentration-of-spend data — *confirm with client*).
- Well-targeted complex CM reports medical-cost savings net of program cost in the **single-digit to low-double-digit percent** of the managed cohort's spend (industry — *estimate, confirm*).
- Sources: AHRQ MEPS concentration-of-spend; HCCI cost reports.

**Anti-patterns** —
- **Targeting the highest-cost band instead of the impactable band** — enrolling members whose cost is already locked in (active transplant, end-stage) yields little change; the rising-risk/impactable band is where CM moves MLR (the POPH rising-risk principle).
- **Cost ranking without impactability** — see PAYER-13.

**Feeds artifacts** — Strategy (CM targeting); Business Case (CM savings line); Architecture (cost + impactability marts); Mobilization (CM enrollment workflow).

**Maturity** — production-ready.

---

### PATTERN PAYER-10 · Member retention / disenrollment prediction

**Intent** — Predict voluntary disenrollment before AEP/OEP and trigger retention next-best-action, protecting the multi-year revenue and Star value of a retained MA member.

**Applies to** — MA / MA-PD; Strategy, Business Case. Composes with PAYER-02, -11.

**Solution shape** — A **churn model** scoring each member's probability of voluntary disenrollment, with **driver attribution** so each high-risk member carries a "why":
- benefit/premium changes year over year (the dominant switching driver at AEP);
- **network disruption** — a key PCP or specialist leaving the network (an integrated payer-provider can detect this from its own provider roster before the member feels it);
- adverse claim-denial / appeal experience (links to PAYER-07/11);
- pharmacy friction (formulary changes, PA edits — links to PAYER-17);
- plan-rating dissatisfaction signal (links to PAYER-02);
- competitor benefit moves in the service area;
- life events (relocation, eligibility change).

The model fires ahead of the **Annual Enrollment Period (Oct 15 – Dec 7)** and the **MA Open Enrollment Period (Jan 1 – Mar 31)**, driving **next-best-action** retention outreach matched to the driver: benefit navigation for premium-shock members, proactive PCP reassignment for network-disruption members, supplemental-benefit education for under-utilizers, service recovery for poor-experience members. Retention compounds: an MA member is multi-year revenue, retention preserves Star continuity (a member who stays keeps contributing to HEDIS/CAHPS), and disenrollment patterns themselves feed the experience signal (PAYER-02). Distinguish *voluntary* (addressable) from *involuntary* (death, moving out of service area) disenrollment — retention spend on the latter is wasted.

**Own-it vs rent** — **OWN.** Churn models and the unified member-touchpoint feature store on the lakehouse; the retention intelligence is a strategic asset, not a vendor's.

**Where it sits** — Gold (churn scores, driver attribution), serving (retention NBA worklists). Strategy + Business Case.

**Evidence anchors** —
- MA voluntary disenrollment rates vary widely by plan; CMS publishes **disenrollment-reason** survey data — use it to ground drivers (CMS disenrollment reason survey).
- Retaining a member avoids re-acquisition cost (broker commissions, marketing) and protects multi-year margin + Star continuity; quantify against the plan's CAC and per-member margin (*confirm with client*).
- Sources: CMS disenrollment reason survey; KFF MA enrollment/switching analyses.

**Anti-patterns** —
- **Modeling churn without driver attribution** — a probability with no "why" can't drive the right NBA.
- **Treating involuntary disenrollment as addressable** — wastes retention spend.
- **Retention outreach decoupled from the experience/complaints signal** (PAYER-02, -11).

**Feeds artifacts** — Strategy (retention value); Business Case (retained-revenue + avoided-CAC line); Architecture (churn marts); Mobilization (retention NBA operating model).

**Maturity** — production-ready.

---

### PATTERN PAYER-11 · Complaints, appeals & grievances analytics

**Intent** — Mine complaints (CTM), appeals, and grievances for systemic drivers, reduce volume at the root cause, and protect the heavily weighted complaint/appeals Star and operational measures.

**Applies to** — MA / MA-PD; Strategy, Business Case. Composes with PAYER-01, -02, -07.

**Solution shape** — Ingest and NLP-classify the **Complaints Tracking Module (CTM)** complaints, organization determinations/appeals, and grievances; cluster by root cause (a confusing benefit, a PA bottleneck per PAYER-07, a pharmacy edit, a provider-access gap, an EOB/billing confusion). Model: (1) **complaint-rate prediction** by segment to pre-empt spikes; (2) **appeals overturn analysis** — a high overturn rate signals upstream determination problems (and is itself a Star/audit signal); (3) **timeliness monitoring** for the appeals/grievance operational measures. The complaints and appeals measures are weighted in the Star composite, and CTM complaint rates feed CMS oversight — so root-cause reduction is both a member-experience and a Star/compliance play.

**Own-it vs rent** — **OWN** for the NLP classification, root-cause clustering, and prediction on the lakehouse; complaints/appeals are sensitive regulated data that belong on the client estate with full provenance.

**Where it sits** — Silver (complaint/appeal event streams), Gold (root-cause clusters, overturn analytics), serving (ops dashboards). Strategy + Business Case.

**Evidence anchors** —
- Complaints (CTM) and appeals measures are part of the Star composite and CMS plan oversight; high complaint rates trigger compliance attention (CMS Star Technical Notes; CMS Part C&D appeals data).
- High appeals **overturn rates** indicate upstream over-denial (links to PAYER-07 anti-pattern) — a leading indicator worth modeling.
- Sources: CMS CTM; CMS Part C/D appeals & grievances reporting; CMS Star measures.

**Anti-patterns** —
- **Treating complaints as a queue to clear, not a signal to learn from** — closing tickets without root-cause reduction lets the driver recur.
- **Ignoring overturn rate** as a denial-quality signal.

**Feeds artifacts** — Strategy (complaint root-cause reduction); Business Case (Star + ops-cost benefit); Architecture (complaint analytics); Mobilization (root-cause remediation cadence).

**Maturity** — production-ready.

---

### PATTERN PAYER-12 · Fraud, waste & abuse (FWA) detection

**Intent** — Recover and prevent improper payment by detecting anomalous claims and outlier providers with own-it ML, focusing investigative capacity where the expected recovery is highest.

**Applies to** — MA / Medicaid / commercial; Strategy, Business Case. MLR lever. Composes with PAYER-16.

**Solution shape** — A layered detection stack on the lakehouse: (1) **rule/edit layer** for known improper-billing patterns (unbundling, upcoding of services, impossible-day, mutually-exclusive codes, NCCI-edit violations); (2) **provider-outlier models** — peer-group comparison detecting providers whose billing distribution deviates from specialty/geography norms (volume per day, code mix, service intensity, modifier abuse, member-travel-distance anomalies); (3) **claims-anomaly ML** — unsupervised/semi-supervised models on claim and member-provider network features to surface novel schemes (phantom billing, identity misuse, medically-unnecessary patterns); (4) **network/graph analysis** for collusion rings — provider-member-facility graphs that surface coordinated schemes invisible to single-claim review (e.g., kickback referral rings, patient-brokering). Outputs are scored leads with **explanations** (so SIU and any downstream legal action can stand on the reasoning) routed to the **Special Investigations Unit (SIU)**, prioritized by expected recovery × probability, with feedback loops from investigation outcomes (substantiated / not / settled) used to retrain and suppress false-positive patterns. Distinguish **fraud** (intentional), **waste** (overuse), and **abuse** (improper-but-not-clearly-intentional) — the routing and remediation differ (referral to law enforcement vs provider education vs payment edit).

**Own-it vs rent** — **OWN** for the anomaly and outlier models on the client's full claims graph — the plan's own historical fraud labels and provider network are the moat; an off-estate FWA vendor sees less context and holds the models. Some plans use a hybrid (vendor leads + own-it triage), but the own-it posture keeps the intelligence and the labeled outcomes with the plan.

**Where it sits** — Gold (FWA scores, provider-outlier marts, network graph), serving (SIU lead queues). Strategy + Business Case.

**Evidence anchors** —
- NHCAA and federal estimates put healthcare fraud at roughly **3–10% of total spend** (NHCAA; GAO improper-payment reports — broad range, *confirm scope*).
- FWA program ROI is typically expressed as **recovered + prevented dollars per investigator**; mature ML triage raises lead quality and recovery yield (industry — *estimate, confirm*).
- Sources: NHCAA; CMS/GAO improper payment reports; OIG.

**Anti-patterns** —
- **Rules-only detection** — static edits miss novel schemes; ML + graph catch what rules don't.
- **Alert floods without prioritization** — overwhelming SIU with low-yield leads; rank by expected recovery.
- **No outcome feedback loop** — models that never learn from investigation results.

**Feeds artifacts** — Strategy (FWA program); Business Case (recovery + prevention line); Architecture (FWA models + graph); Mobilization (SIU integration).

**Maturity** — production-ready.

---

### PATTERN PAYER-13 · Care-management ROI targeting

**Intent** — Enroll the members where care management produces the largest *net* MLR impact — optimizing for **impactability**, not raw risk — and prove the ROI with a defensible measurement design.

**Applies to** — MA / D-SNP / Medicaid; Strategy, Business Case. MLR lever; the bridge to the POPH pack. Composes with PAYER-04, -09, POPH risk/rising-risk.

**Solution shape** — Two model layers: (1) **predicted cost / event risk** (who is likely to incur high cost or an avoidable event) and (2) **impactability** (for whom CM is likely to *change* that trajectory — this is the uplift/treatment-effect question, not just risk). Target the intersection: high-risk **and** high-impactability. Pair with a **measurement design** — ideally a hold-out/quasi-experimental or matched-comparison so the savings claim survives finance/actuarial scrutiny (no "regression to the mean" mirage). Stratify enrollment by program type and capacity, and continuously reconcile predicted vs realized savings. This pattern *is* the payer-side instantiation of POPH care-management targeting, joined to the plan's MLR economics.

**Own-it vs rent** — **OWN.** Risk + impactability models and the measurement framework on the lakehouse; the savings-measurement methodology must be transparent and client-owned (not a vendor's self-graded ROI). Integrated payer-provider fuses EHR engagement data.

**Where it sits** — Gold (risk + impactability + realized-savings marts), serving (CM enrollment + ROI dashboards). Strategy + Business Case.

**Evidence anchors** —
- Impactability-targeted CM consistently outperforms risk-only targeting on net savings (health-services research on uplift/impactability — *confirm magnitude on client data*).
- **Regression to the mean** makes naive pre/post savings claims overstate impact — a hold-out/matched design is the credibility requirement (standard program-evaluation caution).
- Sources: AHRQ care-management evidence; health-services uplift-modeling literature.

**Anti-patterns** —
- **Risk-only targeting** — enrolling the sickest regardless of whether CM can change anything (restates PAYER-09 impactability point).
- **Self-graded ROI without a comparison group** — pre/post savings inflated by regression to the mean; finance won't (and shouldn't) trust it.

**Feeds artifacts** — Strategy (CM targeting + ROI method); Business Case (defensible CM savings line); Architecture (impactability + savings marts); Mobilization (CM operating + measurement cadence).

**Maturity** — production-ready.

---

### PATTERN PAYER-14 · Network adequacy + high-value provider identification

**Intent** — Maintain CMS network-adequacy compliance while identifying high-value providers for tiering/steering and informing narrow/tiered network design — balancing cost, quality, and access.

**Applies to** — MA / Medicaid; Strategy, Architecture, Business Case. MLR + Stars lever. Composes with PAYER-08, -15.

**Solution shape** — Two linked capabilities: (1) **network-adequacy analytics** — model time/distance and provider-count standards by county and specialty against CMS MA network-adequacy criteria, flagging gaps before they become compliance findings; (2) **provider value scoring** — combine risk-adjusted total-cost-of-care, quality (HEDIS/outcomes contribution, including Star measures the provider influences), and access into a provider value index, identifying high-value providers for **tiering, steering, preferred-network, or VBC** (PAYER-15). The value scores inform **narrow/tiered network design** — modeling the access/cost/quality/Star trade-offs of including or tiering a provider. For an integrated payer-provider, the owned delivery system is the anchor high-value tier.

**Own-it vs rent** — **OWN.** Adequacy models and provider value scoring on the lakehouse joined to claims + quality + (own-it) EHR data; provider value intelligence directly informs contracting leverage and shouldn't sit on a vendor's platform.

**Where it sits** — Gold (adequacy marts, provider value index), serving (network/contracting dashboards). Strategy + Architecture + Business Case.

**Evidence anchors** —
- CMS enforces **MA network-adequacy** time/distance and provider-count standards by specialty and county type (42 CFR §422.116; CMS network-adequacy criteria) — gaps risk application/expansion denial and member-access complaints (PAYER-11).
- Risk-adjusted TCOC variation across providers for similar populations is substantial; steering to high-value providers is a recognized MLR lever (actuarial network studies — *confirm on client data*).
- Sources: 42 CFR §422.116; CMS MA network-adequacy criteria.

**Anti-patterns** —
- **Adequacy-only networks** — meeting the standard while ignoring provider value/quality.
- **Cost-only value scoring** — steering to cheap-but-low-quality providers hurts Stars and outcomes; value = risk-adjusted cost *and* quality *and* access.

**Feeds artifacts** — Strategy (network strategy); Architecture (adequacy + value marts); Business Case (steering savings); Mobilization (contracting + tiering rollout).

**Maturity** — production-ready.

---

### PATTERN PAYER-15 · Value-based contract (VBC) management + attribution

**Intent** — Administer shared-savings / shared-risk and other VBC arrangements accurately — attribution, benchmarks, quality gates, and settlement — so both payer and provider trust the numbers.

**Applies to** — MA / Medicaid VBC; Strategy, Architecture, Business Case. Composes with PAYER-04, -13, -14, CLIN quality patterns.

**Solution shape** — A VBC engine on the lakehouse handling: (1) **attribution** — assign members to providers/ACOs per the contract's attribution logic (prospective/retrospective, plurality-of-visits, PCP-assignment) with reconciliation and dispute handling; (2) **benchmark + trend** — compute the cost benchmark and risk-adjusted target; (3) **quality gates** — track the quality measures that gate shared-savings payout (often Star-aligned HEDIS/CAHPS, tying back to PAYER-01); (4) **settlement** — compute shared savings/losses with transparent, reproducible logic both sides can audit. The recurring failure mode in VBC is **attribution disputes and opaque settlement**; the own-it engine's value is a single reproducible source of truth. For an integrated payer-provider, the plan and owned delivery system run VBC on the *same* data — eliminating the payer-vs-provider reconciliation war.

**Own-it vs rent** — **OWN.** Attribution, benchmark, quality-gate, and settlement logic on the client lakehouse, transparent and reproducible. **RENT** = a VBC-administration SaaS that computes settlements on its platform — provider distrust of a vendor black box undermines the whole arrangement; own-it reproducibility is the trust mechanism.

**Where it sits** — Gold (attribution, benchmark, settlement marts), serving (provider + plan VBC dashboards), Governance (reproducible settlement provenance). Strategy + Architecture + Business Case.

**Evidence anchors** —
- Attribution methodology materially shifts who's accountable and the savings result; transparent attribution is the most common source of payer-provider disputes (industry/CMS ACO methodology references).
- Quality gates typically condition shared-savings payout — under-performing the gate forfeits savings even when cost targets are met (CMS MSSP / MA VBC structures).
- Sources: CMS MSSP / ACO methodology; MA VBC arrangement structures; NAACOS analyses.

**Anti-patterns** —
- **Opaque, non-reproducible settlement** — providers can't verify, trust erodes, contracts fail.
- **Attribution churn** that reassigns members unpredictably year to year.
- **Vendor-held settlement logic** in an arrangement that depends on both parties trusting the math.

**Feeds artifacts** — Strategy (VBC strategy); Architecture (VBC engine); Business Case (VBC economics); Mobilization (provider onboarding + settlement cadence).

**Maturity** — production-ready.

---

### PATTERN PAYER-16 · Claims auto-adjudication + pended-claim reduction

**Intent** — Raise the straight-through (auto-adjudication) rate and cut pended/manual claims to reduce administrative cost and accelerate provider payment without sacrificing payment accuracy.

**Applies to** — MA / Medicaid / commercial; Strategy, Business Case, Architecture. Admin-cost lever. Composes with PAYER-07, -12.

**Solution shape** — Instrument the adjudication pipeline to measure the **auto-adjudication (straight-through) rate** and decompose **pend reasons** (eligibility mismatch, missing authorization, provider-data gaps, coordination-of-benefits, coding/edit failures, duplicate suspicion, pricing/contract ambiguity). Apply ML to:
- **predict which incoming claims will pend and why**, enabling upstream fixes (provider-data cleanup, eligibility reconciliation, COB updates, pre-submission edits) before the claim ever pends;
- **recommend resolution** for pended claims (next-action + likely disposition) to speed examiner handling;
- **detect payment-accuracy risks** (overpayment, duplicate, COB-recoverable) *pre-payment*, which is far cheaper than pay-and-chase recovery (links to PAYER-12);
- **monitor prompt-pay / timeliness** against contractual and regulatory clean-claim windows.

The objective is a higher *clean* auto-adjudication rate — fast, accurate payment — not blind auto-pay. Pended claims carry real admin cost (manual examiner time), provider-abrasion, and prompt-pay/timeliness consequences, and excess pay-and-chase erodes the very MLR/margin the plan is trying to protect.

**Own-it vs rent** — **OWN** for the pend-prediction and resolution models on the client estate; the core claims platform itself may be a **RENT/managed** system (many plans run a vendor adjudication core), but the *analytics and ML layer* that optimizes it should be own-it on the lakehouse so the plan owns its operational intelligence.

**Where it sits** — Gold (adjudication + pend-reason marts), serving (claims-ops dashboards, examiner assist). Strategy + Business Case + Architecture.

**Evidence anchors** —
- Auto-adjudication rates vary widely; high-performing plans operate in the **85–95%+** range, with each pended claim carrying meaningful per-claim handling cost (industry benchmarks — *confirm on client data*).
- Faster, accurate payment improves provider relations and prompt-pay compliance.
- Sources: CAQH Index (administrative-transaction efficiency); industry claims-ops benchmarks.

**Anti-patterns** —
- **Auto-adjudication rate as a vanity metric** — pushing claims through without accuracy controls creates overpayment recovery work and FWA exposure (PAYER-12).
- **Treating pends as inevitable** rather than diagnosing and fixing upstream root causes.

**Feeds artifacts** — Strategy (admin-efficiency); Business Case (admin-cost + interest/float line); Architecture (claims-ops analytics); Mobilization (claims-ops redesign).

**Maturity** — production-ready.

---

### PATTERN PAYER-17 · Pharmacy / Part D trend + specialty drug management

**Intent** — Manage Part D and specialty pharmacy trend — formulary, utilization, and specialty drug cost — while protecting the Part D adherence Star measures and member access.

**Applies to** — MA-PD / D-SNP / Medicaid pharmacy; Strategy, Business Case. MLR lever. Composes with PAYER-03, -04.

**Solution shape** — A pharmacy-analytics layer on the lakehouse covering: (1) **trend decomposition** — split Rx trend into unit cost, utilization, mix, and the **specialty-drug** driver (the dominant trend component); (2) **formulary + utilization analytics** — model the cost/access/adherence trade-offs of formulary tiers, step therapy, and PA edits (coordinating with PAYER-07 so pharmacy PA doesn't break adherence); (3) **specialty drug management** — site-of-care for infused specialty drugs (PAYER-08), biosimilar conversion opportunity, and high-cost-therapy pipeline forecasting (e.g., cell/gene therapies) for the bid (PAYER-18). The constraint: pharmacy management must **not** undermine the weight-3 MAD/MAH/MAC adherence measures (PAYER-03) — an aggressive edit that depresses adherence trades MLR savings for Star loss.

**Own-it vs rent** — **OWN** for the trend, formulary, and specialty analytics on the lakehouse; the **PBM** is typically a **RENT/managed** relationship, but the plan should own its pharmacy *intelligence* (and use it to hold the PBM accountable) rather than depend solely on PBM-supplied reporting.

**Where it sits** — Gold (Rx trend + specialty marts), serving (P&T + pharmacy-ops dashboards). Strategy + Business Case.

**Evidence anchors** —
- **Specialty drugs** are a minority of scripts but the **majority of drug spend and trend** (commonly cited >50% of pharmacy spend; *confirm on client data*) (industry/PBM trend reports).
- Biosimilar conversion and site-of-care shifts are recognized specialty-trend levers (actuarial pharmacy studies).
- Part D redesign under the **Inflation Reduction Act** (e.g., the **$2,000 OOP cap** from 2025, manufacturer discount changes) reshapes Part D liability and bid math — incorporate into trend and bid models (CMS IRA Part D guidance).
- Sources: PBM/actuarial Rx trend reports; CMS IRA Part D redesign guidance.

**Anti-patterns** —
- **Pharmacy edits that depress adherence** — trading weight-3 Star measures (PAYER-03) for short-term Rx savings.
- **Relying solely on PBM-supplied analytics** — no own-it view to verify the PBM's net cost and rebate accounting.

**Feeds artifacts** — Strategy (pharmacy trend strategy); Business Case (Rx-trend line + IRA impact); Architecture (Rx analytics); Mobilization (P&T + PBM-oversight cadence).

**Maturity** — production-ready.

---

### PATTERN PAYER-18 · Actuarial trend forecasting + bid support

**Intent** — Forecast medical cost trend accurately and assemble the data the actuaries need for the MA bid — turning the lakehouse into the single, auditable source for projection and bid development.

**Applies to** — MA / MA-PD; Strategy, Business Case, Architecture. MLR / revenue spine. Composes with PAYER-04, -05, -17.

**Solution shape** — Two linked capabilities: (1) **medical cost trend forecasting** — decompose and project trend by service category (inpatient, outpatient, professional, Rx) using utilization + unit-cost models with completion/IBNR (shared with PAYER-04), incorporating known shocks (specialty pipeline per PAYER-17, IRA Part D redesign, fee-schedule changes); (2) **bid support** — assemble the **Bid Pricing Tool (BPT)** inputs: projected allowed costs, the plan's **RAF/risk-score** projection (compliant, per PAYER-05), benefit/plan-design costing, admin load, and the county **benchmark + rebate** mechanics (linking to PAYER-01's QBP value). The lakehouse becomes the auditable evidence base the actuaries pull from, replacing fragmented spreadsheets and improving bid defensibility under CMS desk review.

**Own-it vs rent** — **OWN.** Trend models and bid-data assembly on the client lakehouse, transparent to and co-owned with the plan's actuaries. Actuarial firms/consultants are **partners**, not data owners; the projection logic and data stay on the client estate for auditability and continuity.

**Where it sits** — Gold (trend marts, bid-input data products), Governance (auditable bid evidence). Strategy + Business Case + Architecture.

**Evidence anchors** —
- The MA bid (BPT) drives the relationship between the plan's costs, the county benchmark, the rebate, and the QBP — accurate trend + RAF projection is the revenue foundation (CMS bid/BPT methodology).
- Trend mis-projection directly hits MLR and margin; under-projecting trend erodes margin, over-projecting risks uncompetitive premiums (actuarial standard).
- Sources: CMS Bid Pricing Tool / rate methodology; Academy of Actuaries MA practice notes; MedPAC MA payment chapters.

**Anti-patterns** —
- **Spreadsheet-fragmented bid development** — no single auditable source; reconciliation pain and CMS desk-review risk.
- **Optimistic RAF projection in the bid** that assumes coding capture the plan can't legitimately document (loops to the PAYER-05/06 compliance anti-pattern — the bid's RAF must be defensible, not aspirational).

**Feeds artifacts** — Strategy (trend + bid foundation); Business Case (revenue + margin projection); Architecture (trend + bid data products); Governance (bid auditability); Mobilization (actuarial integration cadence).

**Maturity** — production-ready.

---

### PATTERN PAYER-19 · Payer AI use-case portfolio (value × feasibility × reg-risk × data-readiness)

**Intent** — Rank a health plan's candidate AI use cases on a consistent four-factor scoring so the Strategy artifact sequences investment by *value realized per unit of risk and effort* — anchored on the Stars and MLR value spines.

**Applies to** — MA / MA-PD / D-SNP; Discovery, Strategy (this is the portfolio synthesis). Composes with every PAYER pattern above.

**Solution shape** — Score each candidate use case (the patterns above plus client-specific ideas) on four axes:
- **Value** — quantified against the **two value spines** (Stars: QBP + rebate retention, now amplified by the **HEI reward** for plans with significant SRF/dual membership; MLR: medical-trend levers), plus admin cost and risk-revenue accuracy. Most high-value payer use cases ladder up to Stars (PAYER-01/02/03/11) or MLR (PAYER-04/08/09/13/17) — say so explicitly in the portfolio. For a D-SNP-heavy integrated payer-provider, equity-stratified Star performance (HEI) is a value multiplier worth calling out separately.
- **Feasibility** — data availability, model maturity, workflow-integration difficulty (e.g., point-of-care provider integration is high-value but high-effort for an integrated payer-provider).
- **Regulatory risk** — explicitly rate risk-adjustment use cases (PAYER-05/06) as **high regulatory sensitivity** — they belong in the portfolio for their value but with compliance guardrails as gating requirements, never as fast-and-loose quick wins. PA automation (PAYER-07) carries interop-compliance *obligation* (a reason to do it) but abrasion risk if done wrong.
- **Data readiness** — does the lakehouse have the joined claims + clinical + (for integrated payer-providers) EHR + pharmacy data the use case needs? Data-readiness gaps reorder the roadmap.

Output a 2×2 (value × feasibility) bubble map with reg-risk as color and data-readiness as size, plus a sequenced roadmap. The portfolio's recurring conclusion for an MA plan: **Stars and MLR are the two spines**; risk adjustment is the high-value/high-compliance enabler underneath both; everything else is a lever on one of them.

**Own-it vs rent** — **OWN** the portfolio method and scoring on the client's own value/feasibility/data assessment. The portfolio's structural recommendation is the own-it lakehouse over fragmented point vendors: a single platform that serves Stars, RA, PA, UM, VBC, and FWA off unified plan + provider data — *which no point vendor can replicate* for an integrated payer-provider.

**Where it sits** — Strategy (the synthesizing artifact); informs Architecture sequencing and the Business Case stack-ranking. Discovery (candidate intake).

**Evidence anchors** —
- The four-factor scoring is a method, not a benchmark; each use case's value cites its own pattern's Evidence anchors (Stars value per PAYER-01, MLR point-value per PAYER-04, etc.).
- The Stars-and-MLR-spine framing is grounded in MA economics: QBP/rebate and medical-trend are where MA margin is made or lost (CMS rate methodology; MedPAC MA chapters; KFF MA briefs).

**Anti-patterns** —
- **Buying fragmented point-solution SaaS for Stars / RA / PA / FWA separately** — each vendor holds its slice on its own cloud, none can unify the plan + provider data an integrated payer-provider already owns, and the plan ends up with vendor lock-in and no compounding data asset. The portfolio should default to the own-it lakehouse and flag any point-vendor with surfaced rationale.
- **Scoring on value alone** — ignoring regulatory risk (lands a RA quick-win in the upcoding trap) or data readiness (sequences a use case the data can't support yet).
- **A portfolio with no spine** — a list of disconnected use cases that doesn't tie back to Stars and MLR, leaving leadership without a value narrative.

**Feeds artifacts** — Strategy (the use-case portfolio + sequenced roadmap — this is the primary artifact); Business Case (stack-ranked investment); Architecture (platform-over-point-vendors rationale); Mobilization (wave sequencing).

**Maturity** — production-ready.

---

## Composition note

A typical PHS payer Move — e.g., "MA Star Ratings + MLR improvement platform" — composes:

```
DOMAIN (this pack):  PAYER-19 (portfolio — Stars + MLR spines)
                     PAYER-01/02/03/11 (Stars block)
                     PAYER-04/08/09/13 (MLR block)
                     PAYER-05/06 (compliant RA, with guardrails)
                     PAYER-14/15 (network + VBC — integrated payer-provider edge)
   ×
CROSS-CUTTING:       ARCH-01 (landing zone), INGEST-03 (metadata-driven ingestion),
                     INGEST (claims + FHIR + EHR + pharmacy sources),
                     MODEL (member/provider identity, claims data products),
                     MLOPS (model serving + monitoring for the predictive Star/MLR/RA models),
                     GOV (HITRUST + RADV provenance + RA compliance controls),
                     FINOPS (value engineering of the Stars + MLR business case)
   ×
ADJACENT DOMAIN:     POPH (risk stratification, rising-risk, care-management evidence
                     — shared with PAYER-09/13)
                     CLIN (quality-measure clinical logic — shared with PAYER-01/15)
```

The integrated payer-provider thread runs through the whole pack: the own-it lakehouse unifying plan + provider data is the structural advantage that point vendors cannot match, and it is the recurring own-it recommendation. The compliance thread — accurate, documented risk adjustment, never upcoding — is a hard constraint on PAYER-05/06/18, restated wherever RAF appears.

---

## Pattern selection by executive persona

Different plan executives own different value spines; a Move artifact should speak to the right owner for each pattern.

| Executive | Primary concern | Lead patterns |
|---|---|---|
| **Chief Medical Officer / VP Medical Economics** | Medical trend, UM, care quality | PAYER-08, PAYER-09, PAYER-13, PAYER-04 (clinical levers) |
| **CFO** | MLR, margin, rebate exposure, bid | PAYER-04, PAYER-18, PAYER-16, PAYER-12 |
| **Chief Actuary / Pricing** | Trend forecast, RAF projection, bid | PAYER-18, PAYER-05, PAYER-04, PAYER-17 |
| **VP Stars / Quality** | Star rating trajectory, HEI | PAYER-01, PAYER-02, PAYER-03, PAYER-11 |
| **VP Risk Adjustment** | Accurate, defensible RAF | PAYER-05, PAYER-06 (compliance owner) |
| **Chief Compliance Officer** | RADV, FCA, audit defense | PAYER-06, PAYER-05, PAYER-07 (denial/abrasion risk) |
| **COO / Operations** | Claims, PA, appeals throughput | PAYER-16, PAYER-07, PAYER-11 |
| **VP Network / Contracting** | Adequacy, value, VBC | PAYER-14, PAYER-15 |
| **VP Sales & Retention / Marketing** | Growth + retention | PAYER-10, PAYER-02 |
| **CEO / Strategy** | The portfolio + the two spines | PAYER-19 (synthesizes all) |

The squint test for credibility: when the CFO asks "what's a point of MLR worth on our book?" the artifact answers in *their* arithmetic (PAYER-04); when the Stars VP asks "are we going to clear 4.0 and what's the bonus worth?" it answers with the QBP/rebate math and HEI (PAYER-01); when Compliance asks "how do we know this RA program won't put us in a DOJ headline?" it answers with documented-recapture-plus-RADV-readiness (PAYER-05/06). Generic AI language fails all three.

---

## Regulatory + cycle calendar (orientation for the Move team)

Health-plan value capture is driven by a fixed regulatory and operating calendar. A Move artifact's Mobilization plan should align to it; the data platform must support each beat.

| Beat | Window | Patterns it drives |
|---|---|---|
| **HEDIS measurement year** | Calendar year; data submission spring of following year | PAYER-01 (HEDIS), PAYER-03 (Part D adherence accrues all year) |
| **CAHPS / HOS survey fielding** | Spring (CAHPS); HOS baseline + follow-up | PAYER-02, PAYER-11 |
| **Star Ratings release** | October (for the following plan year) | PAYER-01 — drives the QBP/rebate for the bid two years out |
| **MA bid submission** | First Monday of June | PAYER-18 (bid support), PAYER-04 (MLR projection), PAYER-05 (RAF projection) |
| **Annual Enrollment Period (AEP)** | Oct 15 – Dec 7 | PAYER-10 (retention), PAYER-14 (network) |
| **MA Open Enrollment (OEP)** | Jan 1 – Mar 31 | PAYER-10 (retention) |
| **Risk-adjustment data submission** | Rolling; final reconciliation deadlines per payment year | PAYER-05, PAYER-06 |
| **MLR reporting + rebate** | Annual filing to CMS | PAYER-04 |
| **RADV audits** | CMS-initiated, ongoing | PAYER-06 |
| **CMS-0057-F prior-auth timeframes / APIs** | Timeframes 2026; APIs Jan 2027 | PAYER-07 |

A recurring sequencing lesson: Star performance in measurement year *N* sets the rating released in *N+1*, which sets the QBP/rebate in the bid for plan year *N+2*. The platform must let the plan act on *in-year* leading indicators (PAYER-01/02/03 prediction models), because by the time the rating is released the year is closed. This three-year lag is the single most important reason the predictive, own-it approach beats a retrospective vendor dashboard.

---

## Provenance reminder

Per the pattern-pack discipline: every claim in a payer Move artifact cites a PAYER pattern ID (plus the cross-cutting/adjacent IDs it composes with), every quantitative value cites a benchmark source or carries the "estimate — confirm with client data" flag, every solution choice states its own-it posture, and any rent-side choice carries surfaced rationale. The risk-adjustment patterns (PAYER-05/06) additionally require the compliance anti-pattern to be cited explicitly as a rejected option — the artifact must show it chose documented recapture over RAF inflation by design.
