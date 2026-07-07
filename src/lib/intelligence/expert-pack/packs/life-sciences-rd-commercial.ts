// Consilium expert — Life Sciences R&D & Commercial (cross-cutting).
//
// A cross-cutting ExpertPack v2 with no industry×function key. It spans the
// pharma / biotech value chain end-to-end: discovery & translational, clinical
// development, regulatory affairs, pharmacovigilance, GxP manufacturing/quality,
// and the commercial engine (market access, field/medical, patient services).
//
// HONESTY POSTURE built into the content: in this domain trial timelines and
// regulatory rigor dominate the calendar (years, not quarters); data integrity
// (GxP / CSV / ALCOA+) gates what AI is even allowed to touch in validated
// environments; and commercial ROI is throttled by payer/access dynamics and
// gross-to-net erosion, not by demand-generation cleverness. The pack refuses
// to promise compressed timelines where the rate limiter is regulatory or
// enrollment, and frames AI value as cycle-time, quality, and yield gains
// inside hard governance boundaries.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const lifeSciencesRdCommercialExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.life-sciences-rd-commercial",
    expertName: "Life Sciences R&D & Commercial Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "life-sciences-rd-commercial",
    scopeNote:
      "Pharma / biotech across R&D and commercial: drug discovery & " +
      "translational, clinical development & operations, regulatory affairs, " +
      "pharmacovigilance/safety, GxP manufacturing & quality, and the " +
      "commercial engine (market access/payer, field & medical, patient " +
      "services). Anchored to validated (GxP) systems — Veeva Vault, EDC/CTMS, " +
      "LIMS/MES, safety databases. Excludes provider revenue cycle, payer " +
      "adjudication, and pure med-device hardware engineering (separate experts).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "clinical_trial_cycle_time",
        name: "Clinical trial cycle time",
        definition:
          "Elapsed time across a phase or study from a defined start milestone " +
          "(e.g. protocol approval or first-site-initiated) to a defined end " +
          "milestone (e.g. last-patient-last-visit or database lock).",
        unit: "months",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 18,
          high: 42,
          basis:
            "Phase II/III study durations from industry benchmarking (e.g. " +
            "Tufts CSDD-style ranges); therapeutic area and indication dependent",
          label: "planning-range",
        },
        dataSource: "CTMS milestone dates + EDC/eTMF (e.g. Veeva Vault CTMS)",
        whyItMatters:
          "Time is the dominant cost and value lever in development — each month " +
          "of delay on a launch carries large per-day revenue-at-risk and " +
          "shortens effective patent life. Most AI bets are judged on cycle time.",
      },
      {
        key: "patient_enrollment_rate",
        name: "Patient enrollment rate",
        definition:
          "Randomized/enrolled patients per active site per month, against the " +
          "enrollment plan for the study.",
        unit: "patients/site/month",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.5,
          high: 2.5,
          basis:
            "Site productivity ranges vary widely by therapeutic area; rare " +
            "disease and oncology sit at the low end",
          label: "planning-range",
        },
        dataSource: "EDC enrollment logs + CTMS site activation status",
        whyItMatters:
          "Enrollment is the single most common cause of trial delay — slow or " +
          "stalled accrual extends cycle time and burns site and CRO cost. It " +
          "is the rate limiter AI feasibility/site-selection bets target.",
      },
      {
        key: "screen_failure_rate",
        name: "Screen failure rate",
        definition:
          "Share of screened patients who fail eligibility screening and are " +
          "not randomized, by count.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 50,
          basis:
            "Eligibility-criteria complexity drives wide variation; tighter " +
            "biomarker-defined trials screen-fail more",
          label: "planning-range",
        },
        dataSource: "EDC screening/enrollment disposition (CONSORT flow)",
        whyItMatters:
          "High screen failure wastes site effort and patient goodwill and " +
          "inflates enrollment cost per randomized patient — a direct lever on " +
          "trial cost and timeline that protocol-design AI can move.",
      },
      {
        key: "trial_cost_per_patient",
        name: "Trial cost per randomized patient",
        definition:
          "Fully-loaded study cost (site payments, CRO, monitoring, drug " +
          "supply, data management) divided by randomized patients.",
        unit: "USD/patient",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 40000,
          high: 120000,
          basis:
            "Per-patient cost varies by phase, therapeutic area, and visit " +
            "intensity; oncology and rare disease sit high",
          label: "planning-range",
        },
        dataSource: "Clinical finance / CTMS payments + CRO invoices",
        whyItMatters:
          "The denominator for development efficiency — AI in monitoring " +
          "(RBQM), data management, and site selection is judged on whether it " +
          "lowers this without compromising data quality.",
      },
      {
        key: "time_to_market",
        name: "Time to market (program timeline)",
        definition:
          "Elapsed time from a defined development milestone (e.g. IND/CTA or " +
          "first-in-human) to regulatory approval / first commercial sale.",
        unit: "years",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 6,
          high: 12,
          basis:
            "End-to-end clinical-to-approval timelines; modality and " +
            "therapeutic area dependent, expedited pathways shorten the low end",
          label: "planning-range",
        },
        dataSource:
          "Program milestone tracker (portfolio/PPM) + regulatory submission dates",
        whyItMatters:
          "The headline value driver — effective patent life and net present " +
          "value of a program are dominated by how fast it reaches market. The " +
          "honest rate limiters here are trial enrollment and regulatory review, " +
          "not authoring speed.",
      },
      {
        key: "regulatory_submission_quality",
        name: "Regulatory submission quality",
        definition:
          "Quality of regulatory submissions, proxied by first-cycle approval " +
          "rate and the inverse of information-request / refuse-to-file events " +
          "per submission.",
        unit: "% first-cycle (and IR count)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "First-cycle approval rates vary by agency, modality, and review " +
            "division; complete-response/IR rates are the inverse signal",
          label: "planning-range",
        },
        dataSource:
          "Regulatory information management (RIM/Veeva Vault RIM) + agency correspondence",
        whyItMatters:
          "A second review cycle or refuse-to-file costs quarters of revenue " +
          "and erodes patent life — submission quality is where regulatory " +
          "rigor, not speed, decides program economics.",
      },
      {
        key: "batch_right_first_time",
        name: "Manufacturing batch right-first-time (RFT)",
        definition:
          "Share of GMP production batches released without a deviation, " +
          "rejection, or rework, on first pass.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 99,
          basis:
            "RFT ranges for commercial GMP manufacturing; biologics and " +
            "sterile fill-finish sit lower than small-molecule",
          label: "planning-range",
        },
        dataSource: "MES / batch records + QMS deviation system (e.g. Veeva QMS)",
        whyItMatters:
          "RFT is the quality-and-cost backbone of supply — deviations trigger " +
          "investigations (CAPA), scrap, and supply risk. It is the GxP metric " +
          "AI in deviation triage and batch-record review is held to.",
      },
      {
        key: "deviation_investigation_cycle_time",
        name: "Deviation / investigation cycle time",
        definition:
          "Average elapsed time to close a GMP deviation or quality " +
          "investigation from initiation to CAPA closure.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 15,
          high: 45,
          basis:
            "Quality-investigation closure ranges; overdue investigations are " +
            "a common inspection finding",
          label: "planning-range",
        },
        dataSource: "QMS deviation/CAPA records (validated quality system)",
        whyItMatters:
          "Overdue investigations are an inspection liability and a supply " +
          "bottleneck. Cutting cycle time without weakening rigor is a core GxP " +
          "AI use case — and the place data integrity (ALCOA+) gates automation.",
      },
      {
        key: "adverse_event_processing_time",
        name: "Adverse-event (ICSR) processing time",
        definition:
          "Median time to process an individual case safety report (ICSR) from " +
          "intake to assessed/submission-ready, relative to expedited reporting " +
          "clocks.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 12,
          basis:
            "Case processing ranges against 7/15-day expedited regulatory " +
            "reporting clocks; serious cases prioritized",
          label: "planning-range",
        },
        dataSource: "Safety database (e.g. Argus) case timestamps",
        whyItMatters:
          "Late expedited reports are a compliance and patient-safety failure. " +
          "Case-volume growth makes intake/triage the top pharmacovigilance AI " +
          "target — under human medical-judgment accountability.",
      },
      {
        key: "case_volume_per_fte",
        name: "Safety case volume per FTE",
        definition:
          "ICSRs processed per pharmacovigilance FTE per period — the capacity " +
          "measure for the safety operation.",
        unit: "cases/FTE/month",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 200,
          basis:
            "Case-processing productivity ranges; complexity (serious, " +
            "literature, solicited) drives the spread",
          label: "planning-range",
        },
        dataSource: "Safety database throughput / staffing model",
        whyItMatters:
          "Adverse-event volume scales super-linearly with marketed products " +
          "and channels; cost-to-serve safety is set here, and is the headline " +
          "metric for safety-automation business cases.",
      },
      {
        key: "field_medical_reach",
        name: "Field / medical reach & frequency",
        definition:
          "Share of target HCP / KOL audience reached at planned frequency by " +
          "field (sales) and medical (MSL) engagement in a period.",
        unit: "% of target reached",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Reach attainment against segmented target lists; access-restricted " +
            "specialties sit lower",
          label: "planning-range",
        },
        dataSource: "CRM engagement data (e.g. Veeva CRM) + target lists",
        whyItMatters:
          "Commercial and medical impact is gated by getting the right message " +
          "to the right HCP at the right time within compliance lines — the " +
          "metric next-best-action AI is judged on.",
      },
      {
        key: "market_access_time",
        name: "Time to market access / formulary coverage",
        definition:
          "Elapsed time from launch (or approval) to achieving target payer " +
          "formulary coverage / reimbursement across priority plans.",
        unit: "months",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 6,
          high: 24,
          basis:
            "Payer coverage build-out ranges post-launch; varies by therapy " +
            "class, evidence, and HTA requirements",
          label: "planning-range",
        },
        dataSource: "Payer coverage trackers + claims/formulary data",
        whyItMatters:
          "A drug with no coverage has no real demand — access timing, not " +
          "promotion, is the dominant commercial value gate, and the honest cap " +
          "on early-launch ROI.",
      },
      {
        key: "gross_to_net",
        name: "Gross-to-net (GTN) erosion",
        definition:
          "Share of gross sales given back as rebates, discounts, chargebacks, " +
          "and fees — gross minus net as a percent of gross.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "GTN deductions vary enormously by channel and class (e.g. branded " +
            "specialty vs. heavily-rebated therapeutic categories)",
          label: "planning-range",
        },
        dataSource: "Revenue management / contracts + claims & rebate accruals",
        whyItMatters:
          "GTN is where headline price and realized revenue diverge — payer " +
          "rebate dynamics can halve net price. Commercial ROI is gated here, " +
          "which is why access/contracting matters more than list price.",
      },
      {
        key: "rd_productivity",
        name: "R&D productivity (return on R&D / per-launch cost)",
        definition:
          "Capitalized R&D investment required per approved asset (or " +
          "risk-adjusted internal rate of return on the R&D portfolio).",
        unit: "USD per approval (or % IRR)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1500000000,
          high: 2800000000,
          basis:
            "Capitalized cost-per-approval estimates (including failures and " +
            "cost of capital); methodology- and portfolio-dependent",
          label: "planning-range",
        },
        dataSource: "Portfolio / finance models across the development pipeline",
        whyItMatters:
          "The board-level scorecard for R&D — high attrition (most assets " +
          "fail) means productivity is dominated by picking and killing assets " +
          "well, the place AI in target/translational science aims highest.",
      },
    ],

    painThemes: [
      {
        key: "enrollment_shortfall",
        name: "Enrollment shortfall & site under-performance",
        description:
          "Studies miss enrollment plans because sites are mis-selected, " +
          "eligibility criteria are over-tight, or patient populations are " +
          "scarce — extending cycle time and inflating cost per patient.",
        detectionSignal:
          "Actual-vs-plan enrollment curve falling behind, high share of " +
          "non-enrolling (zero-randomization) sites, rising screen failure, " +
          "protocol amendments to loosen criteria.",
        diagnosticQuestion:
          "What share of your sites are non-enrolling, and how does actual " +
          "enrollment track against plan by therapeutic area?",
      },
      {
        key: "protocol_amendment_churn",
        name: "Protocol amendment churn",
        description:
          "Avoidable mid-study protocol amendments (often from unworkable " +
          "eligibility or operational design) trigger re-consent, re-training, " +
          "and re-submission — each amendment costs time and money.",
        detectionSignal:
          "High count of substantial amendments per study, amendments " +
          "concentrated on eligibility/visit schedule, re-consent burden.",
        diagnosticQuestion:
          "How many substantial protocol amendments do your studies average, " +
          "and what share are avoidable design issues vs. genuine new evidence?",
      },
      {
        key: "data_integrity_gate",
        name: "Data integrity (GxP/ALCOA+) gating AI adoption",
        description:
          "In validated (GxP) environments, AI cannot touch records or " +
          "decisions without computer-system-validation, audit trails, and " +
          "ALCOA+ data integrity — so promising pilots stall before reaching " +
          "production in QC, manufacturing, and safety.",
        detectionSignal:
          "AI proofs-of-concept that never leave sandbox, validation/CSV " +
          "backlog, unclear data lineage, audit findings on system controls.",
        diagnosticQuestion:
          "Which of your AI use cases touch GxP-validated systems, and is there " +
          "a CSV/data-integrity path to production or do they stall as pilots?",
      },
      {
        key: "case_volume_surge",
        name: "Pharmacovigilance case-volume surge",
        description:
          "Adverse-event case volume grows faster than safety headcount as " +
          "products and channels expand, pressuring expedited reporting clocks " +
          "and pushing manual intake/triage to its limits.",
        detectionSignal:
          "Rising ICSR volume vs. flat staffing, late expedited submissions, " +
          "growing case backlog, overtime in case processing.",
        diagnosticQuestion:
          "How is your ICSR volume trending against safety capacity, and are " +
          "you meeting 7/15-day expedited reporting clocks reliably?",
      },
      {
        key: "submission_rework",
        name: "Regulatory submission rework & review cycles",
        description:
          "Incomplete or inconsistent submissions draw information requests, " +
          "additional review cycles, or refuse-to-file — each a multi-quarter " +
          "loss of revenue and effective patent life.",
        detectionSignal:
          "Below-peer first-cycle approval, high information-request volume, " +
          "inconsistent data across modules, late document readiness.",
        diagnosticQuestion:
          "What is your first-cycle approval rate, and how many information " +
          "requests do your submissions typically generate?",
      },
      {
        key: "access_payer_gate",
        name: "Market-access / payer coverage gate",
        description:
          "A launched product underperforms because payer coverage is slow, " +
          "restricted (prior auth/step therapy), or won on deep rebates — so " +
          "realized net revenue lags the headline forecast.",
        detectionSignal:
          "Slow formulary wins, high prior-auth/step-edit burden, rising " +
          "gross-to-net, demand concentrated where coverage exists.",
        diagnosticQuestion:
          "What is your covered-lives ramp and gross-to-net by channel, and " +
          "where is access — not awareness — the binding constraint on uptake?",
      },
      {
        key: "deviation_backlog",
        name: "Quality deviation / CAPA backlog",
        description:
          "Open deviations and overdue investigations accumulate, creating " +
          "inspection exposure and supply risk while right-first-time erodes.",
        detectionSignal:
          "Overdue investigation count, aging CAPA queue, repeat deviations on " +
          "the same root cause, falling batch RFT.",
        diagnosticQuestion:
          "How many deviations/investigations are overdue, and what is your " +
          "batch right-first-time trend by product and site?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "trial_design_feasibility",
        name: "AI-assisted trial design & site/feasibility selection",
        valueMechanism:
          "Use historical trial, claims, and EHR-derived data to optimize " +
          "eligibility criteria and rank sites by likely enrollment — cutting " +
          "screen failure, enrollment time, and avoidable amendments before the " +
          "protocol is locked.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical study enrollment and site performance",
          "Real-world data (claims / EHR) for population sizing",
          "Protocol eligibility criteria and prior amendment history",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Real-world data and AI selection can encode access/equity bias — " +
            "diversity of enrolled population must be monitored",
          "Recommendations inform, but medical and operational leads own final " +
            "protocol and site decisions",
        ],
        metricsMoved: [
          "patient_enrollment_rate",
          "screen_failure_rate",
          "clinical_trial_cycle_time",
        ],
      },
      {
        key: "rbqm_central_monitoring",
        name: "Risk-based quality management & central monitoring",
        valueMechanism:
          "Detect data anomalies, site risk signals, and protocol deviations " +
          "centrally and continuously, so monitoring effort targets risk rather " +
          "than 100% source-data verification — lowering cost per patient while " +
          "protecting data quality.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "EDC clinical data and query history",
          "Site operational and CTMS metrics",
          "Predefined risk indicators / quality tolerance limits",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Risk signals must be explainable so monitors can act and document",
          "Reduced SDV requires a validated risk framework and audit trail to " +
            "satisfy GCP inspection",
        ],
        metricsMoved: ["trial_cost_per_patient", "clinical_trial_cycle_time"],
      },
      {
        key: "regulatory_authoring_intelligence",
        name: "Regulatory document authoring & submission intelligence",
        valueMechanism:
          "Draft and quality-check structured regulatory content (CSRs, " +
          "summaries, responses) and check cross-module consistency against " +
          "source data — raising first-cycle submission quality and shortening " +
          "authoring, without claiming to compress agency review.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Structured study data and prior submissions",
          "Regulatory templates and health-authority guidance",
          "Controlled vocabularies / data standards (e.g. CDISC)",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Every assertion in a submission must trace to source data — " +
            "generated content is reviewed and accountable to a regulatory lead",
          "Honest scope: AI speeds authoring and consistency, not the agency's " +
            "statutory review clock",
        ],
        metricsMoved: ["regulatory_submission_quality", "time_to_market"],
      },
      {
        key: "pv_case_intake_triage",
        name: "Pharmacovigilance case intake, triage & coding",
        valueMechanism:
          "Auto-extract case data from intake sources, code events (MedDRA), " +
          "and triage seriousness/expedited status — clearing routine case " +
          "volume so safety physicians focus on assessment and signal detection.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "ICSR intake streams (forms, literature, solicited reports)",
          "MedDRA and product dictionaries",
          "Validated safety database and historical coded cases",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Causality and medical assessment remain a human physician decision",
          "Safety systems are GxP-validated — automation needs CSV, audit " +
            "trail, and reconciliation to be production-grade",
        ],
        metricsMoved: [
          "adverse_event_processing_time",
          "case_volume_per_fte",
        ],
      },
      {
        key: "gmp_deviation_intelligence",
        name: "GMP deviation triage & batch-record review",
        valueMechanism:
          "Classify deviations, suggest probable root cause from history, and " +
          "flag batch-record exceptions for review-by-exception — shortening " +
          "investigation cycle time and protecting right-first-time without " +
          "weakening rigor.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "QMS deviation/CAPA history with root-cause coding",
          "Electronic batch records (MES) and specifications",
          "Process and equipment context",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Disposition and CAPA decisions are quality-unit accountable, not " +
            "automated",
          "Operates inside GxP/ALCOA+ — data integrity and validated state are " +
            "preconditions, not afterthoughts",
        ],
        metricsMoved: [
          "deviation_investigation_cycle_time",
          "batch_right_first_time",
        ],
      },
      {
        key: "commercial_next_best_action",
        name: "Commercial / medical next-best-action & access analytics",
        valueMechanism:
          "Segment HCPs and patients, prioritize field/medical engagement, and " +
          "surface access barriers (coverage, prior-auth) so commercial and " +
          "patient-services effort targets where it changes outcomes — lifting " +
          "reach and accelerating realized access.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "CRM engagement and target-list data",
          "Claims / formulary and payer coverage data",
          "Patient-services / hub enrollment and barrier data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Promotional and medical communication must stay within label and " +
            "compliance (e.g. off-label and PhRMA-code lines)",
          "Patient data use is governed by privacy and consent — analytics must " +
            "respect HIPAA/GDPR boundaries",
        ],
        metricsMoved: [
          "field_medical_reach",
          "market_access_time",
          "gross_to_net",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "validated_ai_in_gxp",
        name: "Validated AI inside a GxP environment (CSV / data-integrity gate)",
        description:
          "A reference operating model for putting AI into validated R&D, QC, " +
          "manufacturing, or safety systems: defined intended use, computer " +
          "system validation, ALCOA+ data lineage, audit trail, and ongoing " +
          "model monitoring — the path that moves a pilot to production.",
        boundary:
          "Owns the validation, data-integrity, and audit controls around AI in " +
          "GxP scope; does not make the quality/medical disposition itself, " +
          "which stays with the accountable unit.",
        humanAccountabilityPoint: "Head of Quality / Quality Unit",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "central_monitoring_hub",
        name: "Central monitoring & risk-based quality hub",
        description:
          "A centralized analytics function that ingests EDC and operational " +
          "data, computes risk indicators, and routes targeted monitoring " +
          "actions to sites — the operating model behind RBQM at scale.",
        boundary:
          "Owns central risk detection and monitoring prioritization; does not " +
          "replace on-site source verification where risk requires it, or own " +
          "medical-safety review.",
        humanAccountabilityPoint: "Head of Clinical Operations",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "safety_intake_automation",
        name: "Safety case-intake automation with physician assessment",
        description:
          "An automated intake/triage/coding layer in front of the validated " +
          "safety database that clears routine cases and escalates serious or " +
          "ambiguous ones to safety physicians, with reconciliation and audit.",
        boundary:
          "Owns structured case capture, coding suggestions, and triage; does " +
          "not own causality assessment, signal decisions, or regulatory " +
          "submission sign-off.",
        humanAccountabilityPoint: "Qualified Person for Pharmacovigilance (QPPV)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "integrated_access_command",
        name: "Integrated market-access & patient-services command center",
        description:
          "A connected view across payer coverage, contracting/GTN, field & " +
          "medical engagement, and patient hub services that prioritizes effort " +
          "against access barriers and adherence — the commercial operating " +
          "model where ROI is gated by access, not promotion.",
        boundary:
          "Owns access-and-engagement prioritization and analytics; does not " +
          "set price, negotiate payer contracts, or deliver medical advice to " +
          "patients (those stay with accountable commercial/medical roles).",
        humanAccountabilityPoint: "VP Market Access / Commercial Operations",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value in life sciences is dominated by TIME and YIELD under hard " +
        "governance, not by promotional cleverness. In R&D, the prize is " +
        "shortened cycle time and higher program success (better-enrolled, " +
        "better-designed, cleaner trials and submissions) — but the rate " +
        "limiters are enrollment and regulatory review, so AI value shows up as " +
        "honest cycle-time and quality gains, not magic timeline compression. " +
        "In quality/manufacturing, value is right-first-time and faster " +
        "investigation closure inside validated systems. On the commercial side, " +
        "the prize is faster, broader access and protected gross-to-net — but " +
        "payer dynamics cap how fast demand can be realized.",
      dominantHaircutFactors: [
        {
          factor: "Regulatory & enrollment rate limits",
          rationale:
            "Trial enrollment timelines and statutory agency review clocks set " +
            "the calendar; AI can improve quality and authoring but cannot " +
            "compress the binding regulatory/enrollment path, so timeline value " +
            "must be discounted heavily.",
          typicalHaircut: {
            low: 0.3,
            high: 0.6,
            basis:
              "Share of program timeline that is enrollment/review-bound and " +
              "not addressable by tooling",
            label: "planning-range",
          },
        },
        {
          factor: "Data integrity / validation (GxP) friction",
          rationale:
            "AI in validated environments needs CSV, ALCOA+ lineage, and audit " +
            "controls before production; the path from pilot to validated " +
            "production removes a large share of nominal benefit.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Observed gap between pilot benefit and validated-production " +
              "benefit in GxP scope",
            label: "planning-range",
          },
        },
        {
          factor: "Payer / market-access response",
          rationale:
            "Commercial value is gated by coverage timing, utilization " +
            "controls, and rebate-driven gross-to-net erosion that the " +
            "manufacturer only partly controls.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between gross-demand uplift and net realized revenue after " +
              "access constraints and GTN",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Trial cycle-time reduction",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Relative cycle-time reduction from design/feasibility + central " +
              "monitoring programs, net of regulatory-bound time",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in clinical_trial_cycle_time",
        },
        {
          lever: "Trial cost-per-patient reduction",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Monitoring and data-management efficiency from RBQM / central " +
              "monitoring programs",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in trial_cost_per_patient",
        },
        {
          lever: "Safety case-processing productivity",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Throughput uplift from intake/triage/coding automation under " +
              "physician oversight",
            label: "planning-range",
          },
          measuredAs: "Relative increase in case_volume_per_fte",
        },
      ],
      timeToValueBand:
        "Commercial/safety analytics and authoring assist: 2-4 quarters. RBQM / " +
        "central monitoring on active studies: 2-4 quarters. Validated AI in GxP " +
        "manufacturing/QC: 4-8 quarters including CSV. Full-program time-to-market " +
        "effects play out over years and are enrollment/review-bound.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Clinical operations (EDC / CTMS / eTMF)",
          role:
            "Systems of record for trial data capture, study/site management, " +
            "and the trial master file — the spine of clinical development.",
          examples: [
            "Veeva Vault CTMS / eTMF",
            "Medidata Rave EDC",
            "Oracle Clinical / OC RDC",
          ],
        },
        {
          name: "Regulatory information management (RIM)",
          role:
            "System of record for submissions, registrations, and health-" +
            "authority correspondence across markets.",
          examples: ["Veeva Vault RIM", "Regulatory submission/publishing tools"],
        },
        {
          name: "Safety / pharmacovigilance database",
          role:
            "Validated system of record for individual case safety reports and " +
            "signal management.",
          examples: ["Oracle Argus Safety", "ArisGlobal LifeSphere"],
        },
        {
          name: "Quality & manufacturing (QMS / LIMS / MES)",
          role:
            "GxP systems for quality management (deviations/CAPA), lab results, " +
            "and electronic batch records on the shop floor.",
          examples: ["Veeva Vault QMS", "LabWare / LIMS", "MES / electronic batch records"],
        },
        {
          name: "Commercial (CRM / market access / patient services)",
          role:
            "Field & medical engagement, payer coverage and contracting, and " +
            "patient hub/services data.",
          examples: ["Veeva CRM", "Revenue-management / GTN platforms", "Patient-services hub systems"],
        },
      ],
      roles: [
        {
          title: "Chief Medical Officer / Head of R&D",
          accountability:
            "Pipeline strategy, clinical development decisions, and program " +
            "success across the portfolio.",
        },
        {
          title: "Head of Clinical Operations",
          accountability:
            "Trial execution — enrollment, site/CRO performance, monitoring, and timelines.",
        },
        {
          title: "Head of Regulatory Affairs",
          accountability:
            "Submission strategy, quality, and health-authority interactions.",
        },
        {
          title: "Qualified Person for Pharmacovigilance (QPPV)",
          accountability:
            "Drug safety system, case processing compliance, and signal management.",
        },
        {
          title: "Head of Quality (Quality Unit)",
          accountability:
            "GxP compliance, batch disposition, deviations/CAPA, and inspection readiness.",
        },
        {
          title: "VP Market Access / Commercial Operations",
          accountability:
            "Payer coverage, contracting/gross-to-net, and field/medical/patient-services performance.",
        },
      ],
      regulatoryFrames: [
        {
          name: "GxP (GCP / GMP / GVP / GLP)",
          relevance:
            "The good-practice quality frameworks governing trials, manufacturing, " +
            "pharmacovigilance, and labs — they define what AI may touch and how.",
        },
        {
          name: "Data integrity & computer system validation (ALCOA+ / GAMP 5 / 21 CFR Part 11 / Annex 11)",
          relevance:
            "Records and systems in GxP scope must be attributable, legible, " +
            "contemporaneous, original, accurate (and complete/consistent), with " +
            "validated, audit-trailed software — the gate on production AI.",
        },
        {
          name: "Expedited & periodic safety reporting (ICH E2B/E2D; 7/15-day clocks)",
          relevance:
            "Defines case-processing and submission obligations that " +
            "pharmacovigilance AI must operate within.",
        },
        {
          name: "Promotional & data-privacy rules (FDA/OPDP & PhRMA Code; HIPAA / GDPR)",
          relevance:
            "Constrain commercial messaging (on-label) and the use of patient/HCP " +
            "data in analytics and engagement.",
        },
      ],
      canonicalTerms: [
        {
          term: "ALCOA+",
          definition:
            "Data-integrity principles — Attributable, Legible, Contemporaneous, " +
            "Original, Accurate (plus Complete, Consistent, Enduring, Available).",
        },
        {
          term: "ICSR",
          definition:
            "Individual Case Safety Report — a single adverse-event case processed " +
            "and assessed in pharmacovigilance.",
        },
        {
          term: "CSV / GAMP 5",
          definition:
            "Computer System Validation — documented assurance a GxP system performs " +
            "as intended; GAMP 5 is the risk-based validation framework.",
        },
        {
          term: "Gross-to-net (GTN)",
          definition:
            "The bridge from gross (list-priced) sales to net revenue after rebates, " +
            "discounts, chargebacks, and fees.",
        },
        {
          term: "RBQM",
          definition:
            "Risk-Based Quality Management — risk-targeted monitoring and central " +
            "data review in lieu of universal source-data verification.",
        },
        {
          term: "CTA / IND",
          definition:
            "Clinical Trial Application / Investigational New Drug — the regulatory " +
            "authorization to begin human studies.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Clinical trial cycle time and enrollment performance",
        authoritativeSource: "CTMS milestone dates + EDC enrollment logs",
        whatGoodEvidenceLooksLike:
          "Milestone-to-milestone durations and actual-vs-plan enrollment curves " +
          "by study and therapeutic area, with site-level breakdown.",
        weakEvidenceToReject:
          "A single program-level 'we expect to enroll faster' assertion with no " +
          "milestone or site data.",
      },
      {
        claim: "Manufacturing right-first-time and deviation cycle time",
        authoritativeSource: "MES batch records + QMS deviation/CAPA system",
        whatGoodEvidenceLooksLike:
          "Batch RFT by product/site and investigation closure times with overdue " +
          "counts, drawn from the validated quality system.",
        weakEvidenceToReject:
          "A verbal quality claim with no QMS extract or audit-trailed record.",
      },
      {
        claim: "Adverse-event processing time and compliance",
        authoritativeSource: "Validated safety database (case timestamps)",
        whatGoodEvidenceLooksLike:
          "Median processing time vs. 7/15-day clocks and any late-submission " +
          "count from the safety system of record.",
        weakEvidenceToReject:
          "A staffing-model estimate of capacity with no actual case-throughput data.",
      },
      {
        claim: "Market access and gross-to-net",
        authoritativeSource:
          "Payer coverage trackers + claims/formulary and rebate-accrual data",
        whatGoodEvidenceLooksLike:
          "Covered-lives ramp by plan and a GTN bridge by channel reconciled to " +
          "rebate accruals.",
        weakEvidenceToReject:
          "A headline net-price assumption with no coverage or rebate detail.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your active sites are non-enrolling, and how does actual enrollment track against plan by therapeutic area?",
      "Which of your AI use cases touch GxP-validated systems, and is there a CSV / data-integrity path to production or do they stall as pilots?",
      "How is your pharmacovigilance case volume trending against capacity, and are you reliably meeting 7/15-day expedited reporting clocks?",
      "What is your first-cycle approval rate, and how many information requests do your submissions typically generate?",
      "What is your batch right-first-time and deviation/investigation cycle time by product and site, and how many investigations are overdue?",
      "What is your covered-lives ramp and gross-to-net by channel, and where is access — not awareness — the binding constraint on uptake?",
      "How many substantial protocol amendments do your studies average, and what share are avoidable design issues?",
    ],
    maturitySignals: [
      "Site selection and protocol eligibility are informed by real-world / historical enrollment data, not just relationships.",
      "Central monitoring / RBQM is operating with a validated risk framework and audit trail, not 100% SDV everywhere.",
      "There is a defined CSV / data-integrity path that moves GxP AI from pilot to validated production.",
      "Market access, contracting, field/medical, and patient services share a connected view of access barriers and GTN.",
    ],
    redFlags: [
      "AI proofs-of-concept in QC/manufacturing/safety never leave the sandbox because there is no validation path.",
      "Enrollment is tracked only at program level with no site-level or actual-vs-plan visibility.",
      "Expedited safety reports are missed or case backlog is growing against flat staffing.",
      "Commercial forecasts assume demand uptake with no covered-lives ramp or gross-to-net bridge behind them.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Clinical & regulatory platform suites (e.g. Veeva, Medidata)",
        category: "EDC / CTMS / eTMF / RIM",
        switchingCost:
          "High — validated, deeply-integrated systems of record with migrated " +
          "study data and trained users; replacement is a multi-year, " +
          "revalidation-heavy program.",
        renewalDynamics:
          "Enterprise suite agreements; bundling across Vault modules increases " +
          "lock-in and shapes renewal leverage.",
      },
      {
        vendorName: "Safety / pharmacovigilance systems (e.g. Argus, ArisGlobal)",
        category: "Validated safety database",
        switchingCost:
          "High — validated system with regulatory case history and audit " +
          "trail; migration carries data-integrity and compliance risk.",
        renewalDynamics:
          "Often bundled with case-processing BPO/services; scrutinize the " +
          "software-vs-services split.",
      },
      {
        vendorName: "AI / analytics point solutions (design, monitoring, PV, commercial)",
        category: "AI overlays around the validated core",
        switchingCost:
          "Moderate — integrate via data feeds and are replaceable with mapping " +
          "effort, but watch model lock-in and validated-state dependencies.",
        renewalDynamics:
          "Fast-moving, often outcome- or volume-priced; favor exit rights and " +
          "validation/audit access.",
      },
      {
        vendorName: "CROs & case-processing service providers",
        category: "Outsourced trial execution / safety operations",
        switchingCost:
          "Moderate-to-high — embedded in study conduct and SOPs; transitions " +
          "are timeline-sensitive on active programs.",
        renewalDynamics:
          "FTE or unit/transaction pricing; rebid leverage rises between " +
          "program phases.",
      },
    ],
    switchingCosts:
      "The validated systems of record (clinical, regulatory, safety, quality) " +
      "are effectively non-switchable in isolation because of data migration and " +
      "revalidation cost; the negotiable frontier is the AI/analytics and " +
      "services layer around them, where switching cost is moderate.",
    negotiationLevers: [
      "Outcome / volume-based pricing tied to measured cycle-time or throughput gains",
      "Validation, audit, and explainability access written into the contract",
      "Data portability and exit rights to avoid validated-state lock-in",
      "Pilot-to-validated-production gating before enterprise commitment",
      "Software-vs-services unbundling for safety and clinical operations",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      trial_metric: [
        "CTMS milestone dates",
        "EDC enrollment / disposition data",
        "therapeutic-area context",
      ],
      quality_metric: [
        "MES batch records",
        "QMS deviation/CAPA extract",
        "validated-system audit trail",
      ],
      safety_metric: [
        "validated safety database timestamps",
        "expedited-clock compliance record",
      ],
      access_metric: [
        "payer coverage tracker",
        "claims/formulary data",
        "rebate-accrual / GTN bridge",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (regulatory/validation/access)",
      ],
    },
    citationStandard:
      "Quantitative claims cite the validated system of record (CTMS/EDC, QMS/MES, " +
      "safety database, or payer/claims source) and the period. Value projections " +
      "cite a baseline plus a labelled planning range and the haircut factors " +
      "applied — never a single asserted ROI or compressed-timeline number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no site-level enrollment data — frame enrollment improvement as an industry pattern, not their measured number.",
      "An AI use case touches GxP-validated systems — flag that benefit is gated by a CSV / data-integrity path before claiming production value.",
      "Timeline value is discussed — separate authoring/quality gains from the enrollment- and regulatory-bound calendar that tooling cannot compress.",
      "Commercial uplift is discussed without coverage/GTN data — present as gross potential subject to access constraints.",
    ],
    inferenceLanguage: [
      "Across pharma development programs, enrollment delays typically run...",
      "Without your validated-system data, the industry pattern suggests...",
      "In GxP scope, this benefit is realizable only after a validation path, so we frame it as...",
      "Subject to payer coverage and gross-to-net, peer launches commonly see...",
    ],
    flagWithoutEvidence: [
      "A specific cycle-time or time-to-market reduction for this tenant",
      "A claim that AI will compress this program's regulatory review or enrollment timeline",
      "This tenant's actual batch RFT, case-processing time, or gross-to-net",
      "A specific net-revenue or access-ramp figure for this tenant",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "trial enrollment vs plan / accrual curve",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend actual vs. planned enrollment over time to expose accrual shortfall early.",
    },
    {
      questionPattern: "program timeline / phases to market",
      exhibitKind: "chart",
      chartKind: "swimlane",
      note: "Lay out development phases and regulatory milestones to show where time is enrollment/review-bound.",
    },
    {
      questionPattern: "value of cycle-time or throughput gain / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from baseline to realizable value with regulatory/validation/access haircuts shown explicitly.",
    },
    {
      questionPattern: "gross-to-net / net revenue bridge by channel",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Waterfall from gross sales through rebates/discounts/chargebacks to net revenue.",
    },
    {
      questionPattern: "R&D and commercial KPI scorecard",
      exhibitKind: "table",
      note: "Cycle time, enrollment, RFT, AE processing time, market-access time, GTN vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "AI is scoped to cycle-time, quality, and throughput gains — not to compressing the regulatory/enrollment calendar",
      "A CSV / data-integrity path exists so GxP use cases reach validated production, not pilot purgatory",
      "Real-world / historical data is available and governed for trial design and feasibility",
      "Commercial effort is anchored to access (coverage, GTN) where ROI actually moves, not just promotion",
    ],
    failureDrivers: [
      "Promising AI compressed timelines where the binding constraint is enrollment or regulatory review",
      "Pilots that never clear validation/data-integrity and so never reach GxP production",
      "Ignoring payer/access dynamics so commercial value never converts gross demand to net revenue",
      "Treating safety, quality, or coding automation as fully autonomous and losing human medical/quality accountability",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Lowest-friction adoption is in non-GxP analytics and authoring assist " +
      "(commercial, medical writing, feasibility) and in central monitoring; GxP " +
      "manufacturing/QC and safety lag because validation and data-integrity gate " +
      "production. Adoption scales once a repeatable CSV path turns pilots into " +
      "validated, audit-trailed deployments.",
    roiClarity: "medium",
    roiClarityBasis:
      "Cycle-time and throughput gains are measurable in validated systems, so " +
      "operational ROI is fairly firm; but program-level and commercial ROI are " +
      "clouded by high R&D attrition, enrollment/regulatory rate limits, and " +
      "payer/gross-to-net dynamics the manufacturer only partly controls — so the " +
      "honest clarity sits at medium, not high.",
  },

  regulatoryFrame: {
    name: "GxP & data integrity (CSV / ALCOA+ / Part 11 / Annex 11)",
    relevance:
      "The dominant frame for AI in life sciences: anything touching validated " +
      "clinical, manufacturing, quality, or safety records must satisfy computer " +
      "system validation and ALCOA+ data integrity with full audit trails. This " +
      "is the gate that decides whether an AI use case can leave pilot. Safety " +
      "reporting clocks (ICH E2B) and promotional/privacy rules (OPDP/PhRMA Code; " +
      "HIPAA/GDPR) also apply (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (industries)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
