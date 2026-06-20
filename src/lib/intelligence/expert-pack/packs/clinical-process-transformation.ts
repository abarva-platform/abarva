// Consilium expert — Clinical Process Transformation (provider, Epic-anchored).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). The clinical
// counterpart to the Healthcare Revenue Cycle expert. Where the RCM expert owns
// the money, this expert owns the CLINICAL WORKFLOW end to end — how care gets
// scheduled, documented, decided, ordered, coordinated across transitions, and
// measured for quality. Ambient documentation (DAX-style) is one piece, not the
// whole; the value frontier is the full clinical process, not just the note.
//
// Domain: end-to-end clinical process transformation for a healthcare provider.
// Anchored to Epic clinical modules (EpicCare ambulatory & inpatient, In Basket,
// CDS / Best Practice Advisories, Healthy Planet) and ambient documentation
// (Nuance DAX Copilot, Abridge, Suki) as the systems of record — product-aware,
// not product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const clinicalProcessTransformationExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.healthcare-provider.clinical-process-transformation",
    expertName: "Clinical Process Transformation Expert",
    kind: "industry-function",
    industry: "healthcare_provider",
    functionKey: "clinical-process-transformation",
    scopeNote:
      "End-to-end clinical workflow for a healthcare provider: intake & " +
      "scheduling, clinical documentation (including ambient listening), " +
      "clinical decision support, orders/CPOE, care coordination & transitions " +
      "of care, and clinical quality/safety. Anchored to Epic clinical modules " +
      "(EpicCare, In Basket, Best Practice Advisories, Healthy Planet) and " +
      "ambient scribes (DAX, Abridge, Suki). EXPLICITLY EXCLUDES revenue cycle " +
      "— eligibility, prior auth, coding/CDI for billing, claims, denials, " +
      "patient AR — which is owned by the separate Healthcare Revenue Cycle " +
      "expert. Coding here means clinical care decisions, not billing optimization.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "documentation_time_per_encounter",
        name: "Documentation time per encounter",
        definition:
          "Average active clinician time spent documenting a single patient " +
          "encounter, from note start to signed note, measured from EHR audit " +
          "logs (e.g. Epic Signal / Provider Efficiency Profile).",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 12,
          basis:
            "EHR audit-log (Signal) ranges across ambulatory specialties; " +
            "varies widely by visit complexity and specialty",
          label: "planning-range",
        },
        dataSource: "EHR audit logs / Provider Efficiency Profile (Epic Signal)",
        whyItMatters:
          "The most direct measure of documentation burden — the single biggest " +
          "driver of clinician time-on-keyboard and the primary metric ambient " +
          "documentation is bought to move.",
      },
      {
        key: "after_hours_documentation_time",
        name: 'After-hours documentation ("pajama time")',
        definition:
          "Time spent in the EHR outside scheduled clinic hours (evenings, " +
          "weekends), per clinician per week, from EHR audit logs.",
        unit: "minutes per clinic-day",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 15,
          high: 60,
          basis:
            "Epic Signal 'time outside scheduled hours' distributions; " +
            "primary care typically higher than procedural specialties",
          label: "planning-range",
        },
        dataSource: "EHR audit logs (time outside scheduled hours)",
        whyItMatters:
          "Pajama time is the clearest leading indicator of burnout and the " +
          "experience metric clinicians feel most — it is where documentation " +
          "burden converts into attrition risk.",
      },
      {
        key: "clinician_burnout_rate",
        name: "Clinician burnout rate",
        definition:
          "Share of clinicians scoring in the burnout range on a validated " +
          "instrument (e.g. Maslach Burnout Inventory or Mini-Z) in periodic " +
          "well-being surveys.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 35,
          high: 55,
          basis:
            "National physician well-being surveys; post-pandemic ranges " +
            "remain elevated vs historical baselines",
          label: "planning-range",
        },
        dataSource: "Clinician well-being survey (validated instrument)",
        whyItMatters:
          "Burnout drives turnover, reduced clinical hours, and safety risk; it " +
          "is the human outcome most clinical-process AI is justified against and " +
          "the hardest to attribute to any single intervention.",
      },
      {
        key: "note_quality_completeness",
        name: "Note quality / completeness score",
        definition:
          "Share of clinical notes meeting a documentation-integrity rubric " +
          "(complete HPI, assessment-and-plan present, no copy-forward bloat, " +
          "key elements substantiated) on structured chart audit.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 90,
          basis:
            "Internal documentation-integrity audits; rubrics vary by org, so " +
            "treat as a calibration band not a fixed standard",
          label: "planning-range",
        },
        dataSource: "Clinical documentation integrity chart audit (rubric-scored)",
        whyItMatters:
          "Note quality is the guardrail on ambient and AI-drafted notes — the " +
          "thing that must not degrade as documentation gets faster; poor notes " +
          "propagate into clinical errors and downstream care decisions.",
      },
      {
        key: "order_turnaround_time",
        name: "Order turnaround time",
        definition:
          "Median elapsed time from clinical order entry (CPOE) to order " +
          "completion/result available, for a defined order set (e.g. STAT labs, " +
          "imaging, consults).",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 120,
          basis:
            "Operator experience; varies sharply by order type, setting " +
            "(ED/inpatient/ambulatory), and resource availability",
          label: "planning-range",
        },
        dataSource: "CPOE order timestamps to result/completion (EHR)",
        whyItMatters:
          "Order turnaround paces throughput and length of stay; delays in " +
          "diagnostics and consults are a common, fixable cause of trapped " +
          "patient flow and adverse events.",
      },
      {
        key: "length_of_stay",
        name: "Length of stay (LOS)",
        definition:
          "Average inpatient days per discharge, often expressed as observed " +
          "over expected (O/E) against a risk-adjusted geometric-mean LOS.",
        unit: "days (or O/E ratio)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.9,
          high: 1.1,
          basis:
            "Risk-adjusted O/E benchmarks (e.g. Vizient); absolute LOS varies " +
            "by case mix, so O/E is the comparable measure",
          label: "planning-range",
        },
        dataSource: "ADT / discharge data vs risk-adjusted expected LOS",
        whyItMatters:
          "LOS is the integrated measure of clinical-process efficiency — " +
          "documentation, orders, care coordination, and discharge planning all " +
          "surface here; excess days consume capacity and raise complication risk.",
      },
      {
        key: "readmission_rate",
        name: "30-day all-cause readmission rate",
        definition:
          "Share of discharges with an unplanned all-cause readmission within " +
          "30 days, often risk-adjusted and reported by condition cohort.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 12,
          high: 18,
          basis:
            "CMS readmission measure ranges; condition-specific cohorts " +
            "(HF, COPD, pneumonia) run higher",
          label: "planning-range",
        },
        dataSource: "Claims/encounter data with 30-day lookforward by cohort",
        whyItMatters:
          "Readmissions are the headline transitions-of-care quality measure, " +
          "carry CMS penalties, and expose gaps in discharge instructions, " +
          "follow-up, and post-acute coordination.",
      },
      {
        key: "care_gap_closure_rate",
        name: "Care-gap closure rate",
        definition:
          "Share of identified evidence-based care gaps (screenings, chronic-" +
          "disease controls, immunizations, follow-ups) closed within the " +
          "measurement period for the attributed population.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 80,
          basis:
            "HEDIS/quality-program ranges by measure; preventive measures " +
            "typically lag chronic-control measures",
          label: "planning-range",
        },
        dataSource: "Population-health registry (e.g. Epic Healthy Planet)",
        whyItMatters:
          "Care-gap closure is where clinical process meets quality and " +
          "value-based-care outcomes; AI care-gap detection only pays off if " +
          "gaps are actually worked and closed at the point of care.",
      },
      {
        key: "patient_throughput",
        name: "Patient throughput (visits per clinic-day)",
        definition:
          "Completed patient encounters per clinician per scheduled clinic day, " +
          "or equivalent census/turnover for inpatient and procedural settings.",
        unit: "encounters per clinic-day",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 12,
          high: 24,
          basis:
            "Ambulatory operator experience; varies greatly by specialty and " +
            "visit length, so treat as a directional capacity band",
          label: "planning-range",
        },
        dataSource: "Scheduling / encounter completion data (EHR)",
        whyItMatters:
          "Throughput is the capacity payoff of reduced documentation burden — " +
          "but only if freed time is redeployed to access, not absorbed; the " +
          "honest test of whether efficiency gains became real capacity.",
      },
      {
        key: "ambient_adoption_rate",
        name: "Ambient documentation adoption rate",
        definition:
          "Share of eligible encounters by enrolled clinicians where the " +
          "ambient scribe is actively used to draft the note, among licensed " +
          "clinicians.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Early ambient deployment usage data; sustained active use is " +
            "typically far below licenses purchased",
          label: "planning-range",
        },
        dataSource: "Ambient platform usage telemetry joined to EHR encounters",
        whyItMatters:
          "Adoption is the make-or-break variable for ambient ROI — licenses " +
          "purchased without sustained active use is the dominant failure mode, " +
          "so usage telemetry, not seat count, is the real denominator.",
      },
      {
        key: "in_basket_message_volume",
        name: "In-basket message volume per clinician",
        definition:
          "Inbound clinical messages (patient portal, results, refills, staff) " +
          "received per clinician per clinic-day in the EHR in-basket.",
        unit: "messages per clinic-day",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "EHR in-basket analytics; patient-message volume rose sharply " +
            "post-pandemic and varies by specialty",
          label: "planning-range",
        },
        dataSource: "EHR in-basket analytics (Epic Signal / in-basket reports)",
        whyItMatters:
          "In-basket overload is the second documentation burden — message " +
          "triage and drafting now rivals the visit note as a driver of " +
          "after-hours work and is the target of message-draft AI.",
      },
      {
        key: "cds_alert_override_rate",
        name: "CDS alert override rate",
        definition:
          "Share of clinical decision support alerts (Best Practice Advisories) " +
          "that fire and are overridden or dismissed without action by clinicians.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 80,
          high: 95,
          basis:
            "Published alert-override literature; override rates of 80-95% are " +
            "common and signal alert fatigue, not necessarily wrong alerts",
          label: "planning-range",
        },
        dataSource: "CDS / BPA firing and action logs (EHR)",
        whyItMatters:
          "A very high override rate is the quantitative signature of alert " +
          "fatigue — it tells you the CDS layer has lost clinician trust and " +
          "that adding more alerts (including AI ones) will be ignored.",
      },
    ],

    painThemes: [
      {
        key: "documentation_burden_burnout",
        name: "Documentation burden & clinician burnout",
        description:
          "Clinicians spend more time documenting than with patients, and a " +
          "large share of documentation spills into evenings and weekends, " +
          "driving burnout, reduced clinical hours, and attrition.",
        detectionSignal:
          "High documentation-time-per-encounter, high after-hours (pajama) " +
          "time in EHR audit logs, and elevated burnout scores concentrated in " +
          "specific specialties or clinicians.",
        diagnosticQuestion:
          "What is your documentation time per encounter and after-hours EHR " +
          "time by specialty, and how does that track against burnout scores?",
      },
      {
        key: "alert_fatigue",
        name: "Clinical decision support alert fatigue",
        description:
          "Decision support fires too often with low specificity, so clinicians " +
          "override the vast majority of alerts reflexively — and miss the few " +
          "that matter — eroding trust in the CDS layer.",
        detectionSignal:
          "CDS/BPA override rates above ~90%, repeated alerts on the same " +
          "patient, and clinician complaints that alerts are noise.",
        diagnosticQuestion:
          "What is your alert override rate by BPA, and which alerts are fired " +
          "most yet acted on least — i.e. which are pure noise?",
      },
      {
        key: "fragmented_care_transitions",
        name: "Fragmented care transitions",
        description:
          "Hand-offs between settings (ED to inpatient, inpatient to discharge, " +
          "hospital to post-acute/primary care) lose information, leaving " +
          "follow-ups, medication reconciliation, and instructions to fall " +
          "through the cracks.",
        detectionSignal:
          "High 30-day readmission rates, missed post-discharge follow-up " +
          "appointments, medication-reconciliation discrepancies, and absent or " +
          "delayed discharge summaries to downstream providers.",
        diagnosticQuestion:
          "What share of discharges get a timely follow-up appointment and a " +
          "discharge summary to the receiving provider within 48 hours?",
      },
      {
        key: "unwarranted_care_variation",
        name: "Unwarranted variation in care",
        description:
          "Similar patients receive materially different work-ups, orders, and " +
          "treatment depending on the individual clinician rather than evidence, " +
          "producing inconsistent outcomes and avoidable cost.",
        detectionSignal:
          "Wide variation in order patterns, LOS, and outcomes for matched " +
          "diagnosis-related cohorts across clinicians or sites; low adherence " +
          "to order sets and care pathways.",
        diagnosticQuestion:
          "For your top DRGs, how much does LOS and ordering vary across " +
          "clinicians for similar patients, and is order-set adherence measured?",
      },
      {
        key: "in_basket_overload",
        name: "In-basket / message overload",
        description:
          "Patient portal messages, results, and refill requests pile up in the " +
          "in-basket, becoming a second uncompensated documentation shift that " +
          "delays patient responses and worsens after-hours work.",
        detectionSignal:
          "Rising in-basket message volume per clinician, long message " +
          "turnaround times, and after-hours time increasingly spent in the " +
          "in-basket rather than on visit notes.",
        diagnosticQuestion:
          "What is your in-basket volume and median response time per clinician, " +
          "and how much of after-hours EHR time is in-basket vs visit notes?",
      },
      {
        key: "ambient_pilots_dont_scale",
        name: "Ambient pilots that don't scale",
        description:
          "Ambient documentation is piloted with enthusiastic early adopters, " +
          "shows promising satisfaction, then stalls: licenses go unused, edit " +
          "burden offsets time saved, and the program never reaches enterprise " +
          "scale or a defensible ROI.",
        detectionSignal:
          "Low or declining sustained active-use rate among licensed clinicians, " +
          "high note-edit time after ambient draft, and a gap between seats " +
          "purchased and encounters actually documented with ambient.",
        diagnosticQuestion:
          "Of the ambient licenses you bought, what share are in sustained " +
          "active use, and how much note-editing time remains after the draft?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ambient_documentation",
        name: "Ambient clinical documentation",
        valueMechanism:
          "An ambient scribe listens to the patient encounter and drafts the " +
          "clinical note for clinician review and sign-off, removing most " +
          "real-time typing — converting documentation time into patient-facing " +
          "or capacity time and reducing after-hours work.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Encounter audio capture with patient consent",
          "EHR note templates and specialty context",
          "Problem list, meds, and history for accurate drafting",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Every note must be clinician-reviewed and signed — the AI drafts, the " +
            "clinician attests; the note is a legal and clinical record",
          "Guard against hallucinated findings and copy-forward bloat; edit " +
            "burden can silently erase the time savings",
          "Consent and PHI handling for ambient audio is a hard requirement",
        ],
        metricsMoved: [
          "documentation_time_per_encounter",
          "after_hours_documentation_time",
          "clinician_burnout_rate",
          "ambient_adoption_rate",
        ],
      },
      {
        key: "in_basket_message_drafting",
        name: "In-basket / patient-message draft generation",
        valueMechanism:
          "AI drafts replies to patient portal messages and results-release " +
          "notes grounded in the chart, which the clinician edits and approves — " +
          "cutting the time and cognitive load of in-basket triage that has " +
          "become a second documentation shift.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Patient message text and conversation history",
          "Relevant chart context (results, problem list, meds)",
          "Approved message templates and tone guidance",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Drafts must be clinician-reviewed before send — never auto-reply on " +
            "clinical content",
          "Avoid over-reassurance or advice not supported by the chart; medical " +
            "advice carries liability",
          "Measure whether drafts actually reduce time or just add an edit step",
        ],
        metricsMoved: [
          "in_basket_message_volume",
          "after_hours_documentation_time",
          "clinician_burnout_rate",
        ],
      },
      {
        key: "clinical_decision_support",
        name: "Evidence-based clinical decision support",
        valueMechanism:
          "AI surfaces context-aware, high-specificity recommendations (risk " +
          "scores, sepsis/deterioration early warning, guideline prompts) at the " +
          "point of care — reducing variation and catching deterioration earlier " +
          "while replacing low-value alerts to fight alert fatigue.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Real-time vitals, labs, and clinical events",
          "Validated risk models and guideline logic",
          "Outcome feedback to monitor model drift and performance",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Clinical judgment stays with the clinician — CDS advises, never " +
            "auto-acts on a patient",
          "Models that influence care may be regulated as Software as a Medical " +
            "Device (SaMD); validation, monitoring, and bias review are required",
          "More alerts worsen fatigue; specificity and replacing noise matter " +
            "more than adding signals",
        ],
        metricsMoved: [
          "cds_alert_override_rate",
          "readmission_rate",
          "length_of_stay",
        ],
      },
      {
        key: "care_gap_detection",
        name: "Care-gap detection & point-of-care prompts",
        valueMechanism:
          "AI scans the chart and population registry to surface open " +
          "evidence-based care gaps (screenings, chronic-disease controls, " +
          "follow-ups) at the point of care and via outreach worklists — closing " +
          "gaps that drive quality scores and downstream outcomes.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Population-health registry and quality-measure logic",
          "Problem list, results, and immunization/screening history",
          "Attribution and panel data for the population",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Clinician decides whether a gap applies to this patient — prompts can " +
            "be wrong for the individual context",
          "Gap lists must be specific and worked, or they become another ignored " +
            "alert stream",
          "Outreach must respect patient communication and consent rules",
        ],
        metricsMoved: ["care_gap_closure_rate", "readmission_rate"],
      },
      {
        key: "discharge_care_coordination",
        name: "Discharge & care-coordination automation",
        valueMechanism:
          "AI drafts discharge summaries and patient instructions, flags missing " +
          "follow-ups and medication-reconciliation gaps, and orchestrates " +
          "transition tasks — tightening hand-offs to reduce readmissions and " +
          "accelerate safe discharge.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Inpatient documentation, orders, and medication records",
          "Follow-up scheduling and post-acute network data",
          "Discharge-criteria and care-pathway logic",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Discharge readiness and instructions require clinician sign-off — " +
            "premature discharge is a safety risk",
          "Medication reconciliation errors are high-harm; AI flags, pharmacists " +
            "and clinicians confirm",
          "Hand-off content to downstream providers must be accurate and timely",
        ],
        metricsMoved: [
          "readmission_rate",
          "length_of_stay",
          "order_turnaround_time",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "ambient_documentation_platform",
        name: "Ambient documentation platform with sign-off discipline",
        description:
          "An ambient scribe integrated into the EHR drafts notes that " +
          "clinicians review and sign, governed by adoption monitoring, note-" +
          "quality auditing, and a redeployment plan for freed time (access vs " +
          "wellness) so the program reaches scale and a defensible outcome.",
        boundary:
          "Owns note drafting, adoption, and note-quality guardrails; does not " +
          "make clinical decisions or replace the clinician's attestation of the " +
          "record.",
        humanAccountabilityPoint: "Chief Medical Information Officer (CMIO)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "cds_governance_layer",
        name: "Governed clinical decision support layer",
        description:
          "A managed CDS portfolio with an alert-governance committee that " +
          "tunes specificity, retires low-value alerts, validates and monitors " +
          "any AI/risk models, and tracks override rates — restoring clinician " +
          "trust in decision support.",
        boundary:
          "Owns the CDS/BPA portfolio, model validation, and alert tuning; does " +
          "not override clinical judgment at the bedside.",
        humanAccountabilityPoint:
          "Chief Medical Officer (CMO) / CDS governance committee chair",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "transitions_of_care_hub",
        name: "Transitions-of-care coordination hub",
        description:
          "A coordination control point that orchestrates discharge planning, " +
          "medication reconciliation, follow-up scheduling, and hand-off " +
          "communication across settings, with AI flagging gaps and drafting " +
          "summaries for clinician and pharmacist review.",
        boundary:
          "Owns transition task orchestration and hand-off completeness; does " +
          "not make discharge-readiness decisions, which stay with the care team.",
        humanAccountabilityPoint:
          "Chief Nursing Officer (CNO) / Care Coordination Director",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "care_pathway_standardization",
        name: "Care-pathway standardization with order sets",
        description:
          "Evidence-based care pathways encoded as order sets and decision " +
          "support, with adherence measured and variation surfaced back to " +
          "service-line leaders, narrowing unwarranted variation while leaving " +
          "room for justified clinical exceptions.",
        boundary:
          "Owns pathway design, order-set content, and variation reporting; does " +
          "not remove clinician discretion for patient-specific deviation.",
        humanAccountabilityPoint:
          "Service-Line Chief / Physician Quality Officer",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Clinical-process value is mostly CAPACITY, QUALITY, and EXPERIENCE — " +
        "not a direct cash line. Reducing documentation and in-basket burden " +
        "frees clinician time that can become added access (revenue/capacity) or " +
        "recovered well-being (retention) — and the split is a leadership choice, " +
        "not an automatic gain. Decision support and care-gap closure improve " +
        "quality and outcomes (readmissions, variation) whose financial value is " +
        "real but indirect and slow to attribute. Be honest: the dollar case " +
        "rests on retention/turnover avoided, throughput actually redeployed, and " +
        "quality-program outcomes — never a clean per-clinician ROI from time " +
        "saved alone.",
      dominantHaircutFactors: [
        {
          factor: "Clinician adoption & sustained use",
          rationale:
            "Ambient and message-draft value only accrues from sustained active " +
            "use; licenses bought but unused, or abandoned after novelty, are the " +
            "dominant way the value evaporates.",
          typicalHaircut: {
            low: 0.25,
            high: 0.5,
            basis:
              "Observed gap between licenses purchased and sustained active use " +
              "in early ambient deployments",
            label: "planning-range",
          },
        },
        {
          factor: "Safety, governance & validation overhead",
          rationale:
            "Clinical AI requires review workflows, model validation/monitoring, " +
            "and (for some CDS) SaMD-grade governance; this caps deployable scope " +
            "and adds cost that discounts net value.",
          typicalHaircut: {
            low: 0.15,
            high: 0.35,
            basis:
              "Clinical governance, validation, and review-workflow burden " +
              "observed in regulated clinical AI programs",
            label: "planning-range",
          },
        },
        {
          factor: "EHR integration & freed-time redeployment",
          rationale:
            "Value depends on deep EHR integration and on whether freed time is " +
            "deliberately redeployed to access or wellness; absorbed time and " +
            "shallow integration both silently erase the benefit.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Implementation experience where freed time was not redeployed or " +
              "integration was partial",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Documentation time reduction",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported reductions in documentation/after-hours time from " +
              "ambient programs; wide spread and self-reported, treat as planning",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in documentation_time_per_encounter / after-hours time",
        },
        {
          lever: "After-hours (pajama) time reduction",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Audit-log after-hours reductions reported in ambient deployments",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in after_hours_documentation_time",
        },
        {
          lever: "Readmission reduction (transitions programs)",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported relative readmission reductions from transitions-of-care " +
              "and coordination programs; condition-dependent",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in readmission_rate",
        },
      ],
      timeToValueBand:
        "Ambient documentation: 1-3 quarters to clinician-felt relief, longer to " +
        "scaled adoption and a defensible ROI. In-basket drafting: 1-2 quarters. " +
        "CDS tuning and care-gap closure: 2-4 quarters. Transitions/readmission " +
        "outcomes: 3-6 quarters given the lag in outcome measurement.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Ambulatory & inpatient clinical EHR",
          role: "System of record for the clinical encounter, documentation, problem list, and orders — the clinical core.",
          examples: [
            "Epic EpicCare Ambulatory",
            "Epic EpicCare Inpatient (ClinDoc)",
            "Epic ASAP (ED)",
          ],
        },
        {
          name: "Ambient clinical documentation",
          role: "Captures the encounter and drafts the clinical note for clinician review and sign-off.",
          examples: [
            "Nuance DAX Copilot",
            "Abridge",
            "Suki",
          ],
        },
        {
          name: "Clinical decision support",
          role: "Surfaces guideline prompts, risk scores, and advisories at the point of care.",
          examples: [
            "Epic Best Practice Advisories (BPA)",
            "Epic Cognitive Computing / predictive models",
            "Third-party deterioration/sepsis models",
          ],
        },
        {
          name: "Clinical messaging / in-basket",
          role: "Inbound and outbound clinical communication — patient messages, results, refills, staff.",
          examples: ["Epic In Basket", "Epic MyChart (patient messaging)"],
        },
        {
          name: "Population health / registry",
          role: "Identifies care gaps and manages the attributed population for quality and value-based care.",
          examples: ["Epic Healthy Planet"],
        },
        {
          name: "Health information exchange / interoperability",
          role: "Shares clinical data across organizations to support transitions of care.",
          examples: [
            "Epic Care Everywhere",
            "Regional/national HIE (e.g. TEFCA QHINs)",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Medical Officer (CMO)",
          accountability:
            "Clinical quality, safety, and care standards across the enterprise.",
        },
        {
          title: "Chief Medical Information Officer (CMIO)",
          accountability:
            "Clinical informatics, EHR usability, documentation, and clinical AI adoption.",
        },
        {
          title: "Chief Nursing Officer (CNO)",
          accountability:
            "Nursing practice, care coordination, and transitions of care.",
        },
        {
          title: "Service-Line Chief / Physician Quality Officer",
          accountability:
            "Care-pathway standardization and unwarranted-variation reduction within a service line.",
        },
        {
          title: "Clinical Informaticist / CDS Governance Lead",
          accountability:
            "CDS portfolio tuning, alert governance, and clinical-model validation.",
        },
      ],
      regulatoryFrames: [
        {
          name: "HIPAA / HITECH",
          relevance:
            "Governs PHI handling across all clinical systems and AI processing of patient data, including ambient audio.",
        },
        {
          name: "Clinical documentation integrity (CDI) standards",
          relevance:
            "Defines complete, accurate, non-bloated documentation — the guardrail on AI-drafted notes (clinical integrity, not billing CDI).",
        },
        {
          name: "FDA Software as a Medical Device (SaMD)",
          relevance:
            "Some clinical decision support and predictive models meet the device definition and require FDA oversight, validation, and monitoring.",
        },
        {
          name: "The Joint Commission accreditation standards",
          relevance:
            "Sets standards for medication reconciliation, hand-off communication, and care continuity that shape transitions of care.",
        },
      ],
      canonicalTerms: [
        {
          term: "Ambient (documentation)",
          definition:
            "AI that listens to the clinical encounter and drafts the note for clinician review and sign-off — e.g. DAX Copilot, Abridge.",
        },
        {
          term: "In-basket",
          definition:
            "The EHR inbox where results, patient portal messages, refills, and staff messages queue for clinician action.",
        },
        {
          term: "CDS / BPA",
          definition:
            "Clinical Decision Support / Best Practice Advisory — guideline prompts and alerts surfaced at the point of care.",
        },
        {
          term: "Care gap",
          definition:
            "A missing evidence-based action for a patient (screening, control, immunization, follow-up) identified against quality-measure logic.",
        },
        {
          term: "LOS",
          definition:
            "Length of Stay — inpatient days per discharge, often expressed as observed-over-expected (O/E) against risk-adjusted norms.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Documentation burden and after-hours time",
        authoritativeSource:
          "EHR audit logs / Provider Efficiency Profile (Epic Signal)",
        whatGoodEvidenceLooksLike:
          "Per-clinician documentation time and time-outside-scheduled-hours from audit logs, segmented by specialty over a trailing period.",
        weakEvidenceToReject:
          "A clinician's self-estimate of hours spent documenting with no audit-log basis.",
      },
      {
        claim: "Ambient documentation impact",
        authoritativeSource:
          "Ambient usage telemetry joined to EHR audit logs (before/after, with a comparison group)",
        whatGoodEvidenceLooksLike:
          "Sustained active-use rate and pre/post documentation-time change for enrolled clinicians vs a matched comparison group.",
        weakEvidenceToReject:
          "Vendor-reported time-savings or a satisfaction survey of early adopters presented as enterprise ROI.",
      },
      {
        claim: "Alert fatigue / CDS performance",
        authoritativeSource: "CDS/BPA firing and action logs from the EHR",
        whatGoodEvidenceLooksLike:
          "Override rates by individual alert, fired-vs-acted counts, and alerts ranked by noise-to-action ratio.",
        weakEvidenceToReject:
          "A single aggregate 'our alerts are fine' assertion with no per-alert breakdown.",
      },
      {
        claim: "Transitions of care / readmissions",
        authoritativeSource:
          "Encounter/claims data with 30-day readmission lookforward, risk-adjusted by cohort",
        whatGoodEvidenceLooksLike:
          "Risk-adjusted readmission rates by condition cohort with follow-up-appointment and discharge-summary timeliness measures.",
        weakEvidenceToReject:
          "A raw, un-risk-adjusted readmission percentage with no cohort or follow-up context.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your documentation time per encounter and after-hours EHR time by specialty, from audit logs?",
      "Of the ambient licenses you have, what share are in sustained active use, and how much note-editing remains after the draft?",
      "What is your in-basket message volume and median response time per clinician, and how much after-hours time is in-basket vs visit notes?",
      "What is your CDS/BPA override rate, and which alerts fire most yet are acted on least?",
      "For your top DRGs, how much do LOS and ordering vary across clinicians for similar patients, and is order-set adherence measured?",
      "What share of discharges get a timely follow-up appointment and a discharge summary to the receiving provider within 48 hours?",
      "How do you measure note quality/completeness today, and would you detect if AI-drafted notes degraded it?",
    ],
    maturitySignals: [
      "Documentation burden is measured per clinician from audit logs, not surveyed anecdotally.",
      "Ambient adoption is tracked as sustained active use against eligible encounters, not seats purchased.",
      "CDS is actively governed — low-value alerts are retired and override rates are tracked by alert.",
      "Transitions of care have measured follow-up and discharge-summary timeliness, and clinical models are validated and monitored.",
    ],
    redFlags: [
      "Ambient is reported as 'deployed' by license count with no sustained-use telemetry.",
      "CDS override rates are unknown, or new AI alerts are added on top of an already-fatigued alert layer.",
      "Note quality has no audit, so degradation from AI drafting would go undetected.",
      "Freed clinician time has no redeployment plan, so efficiency gains have no path to capacity or wellness value.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Ambient documentation vendors (DAX, Abridge, Suki)",
        category: "Ambient clinical documentation / AI scribe",
        switchingCost:
          "Low-to-moderate — workflow-embedded but built on EHR integration points; swappable with clinician re-enrollment and retraining effort.",
        renewalDynamics:
          "Per-clinician/per-encounter pricing in a fast-moving market; negotiate on sustained-active-use, not seats, and keep exit rights.",
      },
      {
        vendorName: "Clinical decision support & predictive-model vendors",
        category: "CDS / deterioration & risk models",
        switchingCost:
          "Moderate — model-embedded in clinical workflow; watch for validation/monitoring lock-in and SaMD documentation portability.",
        renewalDynamics:
          "Emerging pricing; require validation evidence, performance monitoring access, and the right to retire models that underperform.",
      },
      {
        vendorName: "EHR-native clinical AI (Epic)",
        category: "EHR-embedded clinical AI / note + message drafting",
        switchingCost:
          "High — fused to the clinical record and rolled out with the EHR; rarely sourced standalone, so leverage is at the EHR-agreement level.",
        renewalDynamics:
          "Bundled with the enterprise EHR agreement; negotiate AI capabilities into the platform contract rather than as separate buys.",
      },
    ],
    switchingCosts:
      "The clinical EHR core (Epic) is effectively non-switchable in isolation; ambient and best-of-breed clinical AI around it carry low-to-moderate switching cost, so leverage and the value frontier sit in those swappable layers.",
    negotiationLevers: [
      "Price on sustained active use / measured documentation-time reduction, not licenses purchased",
      "Validation, performance-monitoring, and audit access as contractual requirements (especially for any SaMD-class model)",
      "Pilot-to-scale gating with a clinician-satisfaction and note-quality bar before enterprise commitment",
      "Data portability and exit rights to avoid model and workflow lock-in",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      documentation_burden: [
        "EHR audit logs (Signal)",
        "specialty segmentation",
        "trailing-period basis",
      ],
      ambient_impact: [
        "usage telemetry (sustained active use)",
        "pre/post audit-log change",
        "comparison group",
      ],
      cds_performance: ["per-alert firing logs", "override/action counts"],
      quality_outcome: [
        "risk-adjusted cohort data",
        "measurement period",
        "follow-up/timeliness measures",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (adoption, redeployment)",
      ],
    },
    citationStandard:
      "Quantitative clinical-process claims cite the audit-log / telemetry / " +
      "registry source and the period. Value projections cite a baseline plus a " +
      "labelled planning range and the haircut factors applied (especially " +
      "adoption and freed-time redeployment) — never a single asserted ROI or " +
      "time-saved number, and vendor outcome claims are marked as such pending " +
      "tenant validation.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no audit-log baseline — frame documentation burden as an industry pattern, not their measured number.",
      "Ambient time-savings are quoted from vendor or pilot data — present as vendor/pilot claims pending tenant validation.",
      "Capacity or financial value is asserted without a freed-time redeployment plan — flag that time saved is not automatically value.",
    ],
    inferenceLanguage: [
      "Across provider clinical workflows, documentation time typically runs...",
      "Without your audit-log data, the industry pattern suggests...",
      "Reported ambient programs commonly see reductions in the range of... though results vary widely and are often self-reported...",
    ],
    flagWithoutEvidence: [
      "A specific time-saved or ROI figure for this tenant",
      "This tenant's actual documentation time, burnout rate, or adoption rate",
      "A claim that a specific AI model improves clinical outcomes for this tenant without validation evidence",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "documentation burden by specialty / where is the burden",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Bar of documentation time and after-hours time by specialty to show where burden concentrates.",
    },
    {
      questionPattern: "ambient adoption funnel / licenses vs sustained use",
      exhibitKind: "chart",
      chartKind: "range-bar",
      note: "Range bar from seats purchased to sustained active use, exposing the adoption gap.",
    },
    {
      questionPattern: "capacity / value bridge from documentation time saved",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from time saved through adoption and redeployment haircuts to realizable capacity/value.",
    },
    {
      questionPattern: "care variation / LOS by clinician for a DRG cohort",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of LOS or order-count variation across clinicians for a matched cohort.",
    },
    {
      questionPattern: "clinical-process KPI scorecard",
      exhibitKind: "table",
      note: "Documentation time, after-hours time, in-basket volume, override rate, LOS, readmissions vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Adoption is measured and managed as sustained active use, with clinician champions and re-engagement, not seat counts",
      "Freed time has a deliberate redeployment plan to access or well-being so efficiency becomes real value",
      "Note quality and clinical safety are governed and audited so speed does not degrade the record",
      "CDS is tuned and noise retired before adding AI alerts, so new signals are trusted and acted on",
    ],
    failureDrivers: [
      "Ambient bought by seat count and declared 'done' with no sustained-use telemetry or champion support",
      "Time saved is absorbed rather than redeployed, so there is no capacity, access, or financial outcome to point to",
      "AI alerts piled onto an already-fatigued CDS layer, deepening override behavior",
      "No note-quality audit, so AI-drafted documentation degrades undetected and creates clinical risk",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Enthusiastic early-adopter clinicians sign on first and report relief; the " +
      "hard part is the middle — moving from willing pilots to sustained " +
      "enterprise-wide active use. Adoption hinges on clinician trust: notes and " +
      "drafts must be reliably good, edit burden must stay low, and leadership " +
      "must protect (not reclaim) the freed time. Without that, usage decays " +
      "after the novelty period.",
    roiClarity: "low",
    roiClarityBasis:
      "Clinical-process value is mostly capacity, quality, and experience rather " +
      "than a direct cash line. Time saved only becomes money if it is " +
      "deliberately redeployed; burnout/retention and quality outcomes are real " +
      "but indirect and slow to attribute. Combined with self-reported vendor " +
      "figures and adoption variability, the ROI case is honestly soft — defend " +
      "it on retention, redeployed throughput, and quality outcomes, not a clean " +
      "per-clinician time-saved calculation.",
  },

  regulatoryFrame: {
    name: "HIPAA + clinical safety governance (CDI integrity & FDA SaMD)",
    relevance:
      "The dominant regulatory frame for clinical-process AI: HIPAA/HITECH " +
      "governs PHI including ambient audio; clinical documentation integrity " +
      "standards guard note quality; and FDA SaMD oversight applies to decision-" +
      "support models that influence care. The Joint Commission standards shape " +
      "transitions of care (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (W3 draft)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
