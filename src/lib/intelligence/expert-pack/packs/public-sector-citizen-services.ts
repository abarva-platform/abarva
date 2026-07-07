// Consilium expert — Public Sector: Citizen Services & Government Operations
// (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert spanning the operations of a government agency that serves the public:
// citizen-facing digital services, benefits / case management, permitting and
// licensing, contact centers, procurement, fraud / improper payments, and the
// public-sector workforce. Applies across federal, state, and local agencies.
//
// CORE DOCTRINE — VALUE IS A TRIPLE BOTTOM LINE, NOT PROFIT. Public-sector
// "value" is the joint optimization of (1) SERVICE — does the citizen get the
// outcome they are entitled to, accessibly; (2) COST — fully-loaded cost to
// serve, since the budget is appropriated and fixed; and (3) EQUITY — does the
// service work for every population, not just the digitally fluent. A change
// that cuts cost but pushes vulnerable citizens off the channel they rely on is
// a FAILURE, not a saving. Three hard realities bound everything: AI is fenced
// by transparency, due-process, and equity obligations (decisions affecting
// rights need explainability and appeal, not a black box); legacy systems
// (mainframe systems of record, batch eligibility engines, paper intake) GATE
// modernization — you cannot automate on top of a system you cannot read or
// write to in real time; and PROCUREMENT rules (competition, fair-source) slow
// and shape what can be bought and how fast. Honest by design: this expert
// sizes service + cost + equity, never an ROI that ignores the mission.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const publicSectorCitizenServicesExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.public-sector-citizen-services",
    expertName: "Public Sector — Citizen Services & Government Operations Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "public-sector-citizen-services",
    scopeNote:
      "Cross-cutting transformation of how a government agency serves the " +
      "public: citizen-facing digital services and channel strategy, benefits " +
      "and case management (eligibility, adjudication, redetermination), " +
      "permitting and licensing, citizen contact centers, public procurement, " +
      "fraud and improper-payment prevention, and the public-sector workforce. " +
      "Spans federal, state, and local agencies. Optimizes the TRIPLE BOTTOM " +
      "LINE of service, cost, and equity — never profit. Bounded throughout by " +
      "transparency / due-process / equity obligations on automated decisions, " +
      "by legacy systems of record that gate what can be modernized, and by " +
      "public procurement rules. Excludes defense/intelligence mission systems, " +
      "tax policy design, and the legislative/policy-making process itself — " +
      "this expert owns service delivery and operations, not policy.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "digital_adoption_rate",
        name: "Digital self-service adoption rate",
        definition:
          "Share of eligible citizen transactions (applications, renewals, " +
          "status checks, payments) completed through a digital self-service " +
          "channel rather than in-person, mail, or assisted phone.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Government digital-services benchmarks; mature digital agencies " +
            "(e.g. leading DMV / tax / benefits portals) reach 70-80%, " +
            "paper-heavy programs sit below 40%",
          label: "planning-range",
        },
        dataSource:
          "Web/mobile analytics and channel-mix reporting from the citizen " +
          "portal joined to transaction volumes in the case/benefits system",
        whyItMatters:
          "The headline channel-shift unit. Higher digital adoption lowers " +
          "cost-to-serve and frees assisted channels for citizens who need " +
          "them — but it must be read alongside equity: adoption gains that " +
          "exclude low-access populations are not real wins.",
      },
      {
        key: "self_service_rate",
        name: "Self-service completion rate",
        definition:
          "Share of citizens who start a digital transaction and complete it " +
          "without needing an agent, office visit, or callback to finish.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 85,
          basis:
            "Service-design benchmarks; well-designed flows complete 75-85%, " +
            "complex eligibility flows with poor UX drop below 50%",
          label: "planning-range",
        },
        dataSource:
          "Funnel analytics on the digital service flow (start, abandon, " +
          "assisted-handoff, complete) from the portal",
        whyItMatters:
          "Distinguishes a channel that truly deflects work from one that " +
          "merely moves it: a high start rate with low completion pushes load " +
          "back onto the contact center and field offices.",
      },
      {
        key: "case_backlog",
        name: "Case backlog",
        definition:
          "Count of open citizen cases (applications, claims, permits, " +
          "appeals) awaiting action beyond their target service standard at " +
          "period-end.",
        unit: "cases",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 30,
          basis:
            "Expressed as % of monthly intake aged past standard; well-run " +
            "programs hold aged backlog under ~10-15% of intake, distressed " +
            "programs run 30%+ and growing",
          label: "planning-range",
        },
        dataSource:
          "Case/benefits management system aging report (open cases by age " +
          "bucket against service-level standard)",
        whyItMatters:
          "The most politically visible operational number in government — a " +
          "growing backlog means citizens wait for benefits or decisions they " +
          "are entitled to, draws oversight and litigation, and is the first " +
          "thing leadership is held to account on.",
      },
      {
        key: "processing_time",
        name: "Average case processing time",
        definition:
          "Average elapsed time from a complete citizen submission to a final " +
          "determination/decision on the case.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 45,
          basis:
            "Wide by program; same-day/instant for simple license renewals, " +
            "2-6 weeks for benefits eligibility, far longer for contested or " +
            "document-heavy adjudications — read against the program's standard",
          label: "planning-range",
        },
        dataSource:
          "Case lifecycle timestamps in the case/benefits system (submission " +
          "complete to determination)",
        whyItMatters:
          "Directly governs the citizen experience and statutory/timeliness " +
          "obligations. Automation that triages and pre-populates compresses " +
          "the elapsed time manual adjudication cannot.",
      },
      {
        key: "application_approval_cycle_time",
        name: "Application approval cycle time",
        definition:
          "End-to-end elapsed time from a citizen first starting an " +
          "application to an approved/denied outcome, including time the case " +
          "waits on the citizen for missing documents.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 60,
          basis:
            "Program-dependent; includes citizen-side wait for documentation, " +
            "which often dominates and is the largest compressible component",
          label: "planning-range",
        },
        dataSource:
          "Application lifecycle timestamps across the portal and case system, " +
          "including document-request and resubmission events",
        whyItMatters:
          "The citizen's lived end-to-end wait. Much of it is document " +
          "back-and-forth, not adjudication — prefill, document AI, and " +
          "proactive status reduce the part the agency controls.",
      },
      {
        key: "cost_per_transaction",
        name: "Cost per transaction (cost to serve)",
        definition:
          "Fully-loaded agency cost (labor, technology, overhead) to complete " +
          "one citizen transaction, reported by channel.",
        unit: "USD / transaction",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.3,
          high: 30,
          basis:
            "Channel-cost studies; digital self-service transactions run cents " +
            "to low single dollars, assisted phone and in-person run many " +
            "dollars to tens of dollars — the channel-shift prize is this spread",
          label: "planning-range",
        },
        dataSource:
          "Workforce Economics substrate (channel staffing rate-card x FTE) " +
          "plus technology cost over transaction volume by channel",
        whyItMatters:
          "Government budgets are appropriated and fixed, so cost-to-serve is " +
          "about doing more within the same dollars. The digital-vs-assisted " +
          "spread is the core economic case for channel shift — sized against " +
          "equity, not in spite of it.",
      },
      {
        key: "first_contact_resolution",
        name: "First-contact resolution rate",
        definition:
          "Share of citizen contacts (call, chat, visit) fully resolved in the " +
          "first interaction without a transfer, callback, or repeat contact.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 80,
          basis:
            "Contact-center benchmarks; well-run public contact centers reach " +
            "70-80%, fragmented programs with poor knowledge access sit lower",
          label: "planning-range",
        },
        dataSource:
          "Contact-center platform disposition and repeat-contact analysis " +
          "(resolved-on-first vs transferred/repeat)",
        whyItMatters:
          "Low first-contact resolution multiplies citizen effort and agency " +
          "cost — every repeat contact is a citizen still without an answer and " +
          "a second transaction the agency pays for.",
      },
      {
        key: "call_abandonment_rate",
        name: "Call abandonment rate",
        definition:
          "Share of inbound citizen calls that disconnect before reaching an " +
          "agent or completing in self-service (a proxy for unmet demand).",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 25,
          basis:
            "Contact-center benchmarks; healthy operations hold abandonment " +
            "under ~5-8%, surge/understaffed public lines exceed 20%+",
          label: "planning-range",
        },
        dataSource:
          "Contact-center telephony / IVR reporting (offered, abandoned, " +
          "handled by queue)",
        whyItMatters:
          "A spiking abandonment rate is the equity alarm: citizens who cannot " +
          "get through the phone line are disproportionately those who cannot " +
          "use the digital channel, so unmet phone demand hides excluded need.",
      },
      {
        key: "improper_payment_rate",
        name: "Improper payment rate",
        definition:
          "Share of program payment dollars made in error — overpayments, " +
          "underpayments, or payments lacking required documentation — as a " +
          "percentage of total program outlays.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 15,
          basis:
            "Government improper-payment reporting ranges; many large benefit " +
            "programs report mid-single-digit to low-double-digit rates, much " +
            "of it documentation error rather than fraud",
          label: "planning-range",
        },
        dataSource:
          "Program-integrity payment-accuracy reviews and post-payment audit " +
          "samples against the payment system",
        whyItMatters:
          "Improper payments are the headline program-integrity number under " +
          "oversight. The honest split matters: most is eligibility/" +
          "documentation error, not fraud — so the fix is better verification " +
          "and prefill, not just enforcement, and recovery must protect " +
          "due-process and avoid harming wrongly-flagged citizens.",
      },
      {
        key: "citizen_satisfaction",
        name: "Citizen satisfaction score",
        definition:
          "Standardized satisfaction/experience score for citizens completing " +
          "a service interaction (e.g. a CSAT or government experience index).",
        unit: "index (0-100)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 80,
          basis:
            "Government customer-experience index ranges; leading services " +
            "score in the high 70s-low 80s, distressed services well below 60",
          label: "planning-range",
        },
        dataSource:
          "Post-interaction surveys and a government experience index across " +
          "channels",
        whyItMatters:
          "The mission-side counterweight to cost: a cheaper service that " +
          "citizens experience as worse has not improved value. Satisfaction " +
          "must be read by population segment to catch equity gaps an average " +
          "hides.",
      },
      {
        key: "channel_shift_pct",
        name: "Channel shift to digital",
        definition:
          "Year-over-year change in the share of transactions handled by " +
          "lower-cost digital channels versus assisted channels.",
        unit: "percentage points / year",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2,
          high: 15,
          basis:
            "Digital-transformation program ranges; sustained shift of 5-10 " +
            "points/year is strong, with diminishing returns as the willing " +
            "population is captured and the residual is access-constrained",
          label: "planning-range",
        },
        dataSource:
          "Channel-mix trend reporting from the portal and contact-center " +
          "platforms over time",
        whyItMatters:
          "The dynamic measure of the cost-to-serve transformation. The honest " +
          "ceiling is equity: the last cohort to shift cannot, so the residual " +
          "assisted channel must be funded, not assumed away.",
      },
      {
        key: "equity_access_gap",
        name: "Equity access gap",
        definition:
          "The spread in successful service completion (or satisfaction) " +
          "between the best- and worst-served citizen population segments — by " +
          "language, disability, broadband access, age, or geography.",
        unit: "percentage points",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 20,
          basis:
            "Service-equity analyses; a gap under ~5-10 points indicates the " +
            "service works broadly, 20+ points signals a population being left " +
            "behind by the current channel/design",
          label: "planning-range",
        },
        dataSource:
          "Segmented service-outcome analytics (completion, satisfaction, " +
          "denial-for-procedural-reasons) by population characteristic, where " +
          "lawfully collected",
        whyItMatters:
          "Equity is a first-class outcome, not a footnote. This metric makes " +
          "the third bottom line measurable so a cost or adoption gain that " +
          "widens the access gap is correctly scored as a regression, not a win.",
      },
    ],

    painThemes: [
      {
        key: "legacy_system_gate",
        name: "Legacy systems of record gate modernization",
        description:
          "Core eligibility, case, and payment systems run on mainframe or " +
          "batch architectures that cannot be read or written in real time, so " +
          "modern digital front-ends and AI sit on top of a system that " +
          "responds overnight — capping how much can actually be automated or " +
          "made real-time.",
        detectionSignal:
          "Batch eligibility runs, overnight status updates, screen-scraping " +
          "integrations, a multi-year 'system modernization' already underway, " +
          "COBOL/vendor-locked cores, no real-time API to the system of record.",
        diagnosticQuestion:
          "Can your front-end and any automation read and write the system of " +
          "record in real time, or is eligibility/status still batch-processed?",
      },
      {
        key: "channel_fragmentation_exclusion",
        name: "Channel fragmentation & digital exclusion",
        description:
          "Citizens are pushed to digital channels that exclude those without " +
          "broadband, devices, language support, or digital literacy, while the " +
          "assisted channels they depend on are underfunded — so cost savings " +
          "are realized by quietly shifting burden onto the most vulnerable.",
        detectionSignal:
          "Rising digital adoption alongside rising call abandonment, " +
          "procedural denials concentrated in specific populations, no offline/" +
          "assisted fallback, satisfaction gaps by language or geography.",
        diagnosticQuestion:
          "When you shift a transaction to digital, what happens to the " +
          "citizens who cannot use it — is the assisted channel still funded " +
          "and is the access gap measured?",
      },
      {
        key: "structural_backlog",
        name: "Structural case backlog",
        description:
          "Backlogs persist not from a one-time surge but from a structural " +
          "mismatch — manual document review, serial hand-offs, redetermination " +
          "waves, and fixed appropriated headcount — so the queue grows faster " +
          "than it can be worked and recovery efforts only hold steady.",
        detectionSignal:
          "Aged-case count growing despite overtime, redetermination/renewal " +
          "spikes, high document-related rework, intake outpacing disposition " +
          "month over month.",
        diagnosticQuestion:
          "Is your backlog a surge that will clear, or a structural gap where " +
          "intake exceeds capacity — and what share is waiting on documents " +
          "versus on adjudication?",
      },
      {
        key: "document_burden",
        name: "Documentation & verification burden",
        description:
          "Citizens are asked to gather and resubmit documents the government " +
          "often already holds, and staff manually verify them, so cycle time " +
          "is dominated by document back-and-forth and procedural denials hit " +
          "eligible citizens who simply could not produce paperwork in time.",
        detectionSignal:
          "Large share of cycle time in document-request status, high rate of " +
          "denials for failure-to-provide rather than ineligibility, repeated " +
          "requests for the same document, low data-matching/prefill use.",
        diagnosticQuestion:
          "What share of your processing time and denials is driven by missing " +
          "documents the agency could verify through data matching instead?",
      },
      {
        key: "improper_payments_vs_due_process",
        name: "Improper payments vs. due-process tension",
        description:
          "Pressure to cut improper payments drives aggressive fraud flags and " +
          "verification hurdles that wrongly burden or deny eligible citizens, " +
          "while genuine error and fraud are conflated — so integrity programs " +
          "can reduce a number while increasing harm and procedural denials.",
        detectionSignal:
          "Fraud models with no appeal path, rising procedural denials, " +
          "improper-payment 'recoveries' from citizens later found eligible, no " +
          "split between documentation error and actual fraud.",
        diagnosticQuestion:
          "Does your improper-payment number separate documentation error from " +
          "fraud, and does every flag a citizen receives carry an explanation " +
          "and a path to appeal?",
      },
      {
        key: "procurement_drag",
        name: "Procurement & acquisition drag",
        description:
          "Competition, fair-source, and approval requirements mean technology " +
          "and services take many months to a year-plus to buy, locking " +
          "agencies into long vendor contracts and slowing iteration — so the " +
          "pace of modernization is set by the acquisition calendar, not the " +
          "technology.",
        detectionSignal:
          "Multi-month procurement cycles, large monolithic system contracts, " +
          "vendor lock-in, modernization timelines dominated by acquisition " +
          "milestones, limited modular/agile contracting.",
        diagnosticQuestion:
          "How long does it take to procure and deploy a new capability, and " +
          "are you locked into monolithic contracts that prevent iteration?",
      },
      {
        key: "workforce_capacity_capability",
        name: "Workforce capacity & capability constraint",
        description:
          "An aging, hard-to-hire public workforce on fixed appropriated " +
          "headcount, with hiring lead times measured in months and limited " +
          "AI/data skills, means neither surge capacity nor new capability can " +
          "be added quickly — capping how fast operations can scale or modernize.",
        detectionSignal:
          "High retirement eligibility, long time-to-hire, vacancy rates in " +
          "key roles, thin data/AI skills, reliance on contractors for core " +
          "capability, no reskilling path as work automates.",
        diagnosticQuestion:
          "Given fixed headcount and long hiring cycles, where will the " +
          "capacity and the AI/data skills to run a modernized operation come " +
          "from?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "citizen_virtual_assistant",
        name: "Citizen virtual assistant & contact-center deflection",
        valueMechanism:
          "A grounded virtual assistant answers citizens' program, eligibility, " +
          "and status questions and completes simple transactions across web, " +
          "chat, and voice — deflecting routine contacts from agents and " +
          "resolving more on first contact, so the contact center handles the " +
          "complex residual at lower cost while staying open to those who need a " +
          "human.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Program policy and FAQ knowledge base grounded to official sources",
          "Case/benefits status data for authenticated status answers",
          "Multilingual content and accessibility-compliant channels",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Must not give incorrect eligibility/legal guidance — answers ground to cited policy, with a human path always offered",
          "Equity guardrail: deflection must not strand citizens who need assisted help; an easy human handoff is mandatory",
        ],
        metricsMoved: [
          "first_contact_resolution",
          "call_abandonment_rate",
          "cost_per_transaction",
          "self_service_rate",
        ],
      },
      {
        key: "intelligent_document_processing",
        name: "Intelligent document processing & data matching",
        valueMechanism:
          "Extract and classify data from citizen-submitted documents and match " +
          "it against records the government already holds, so applications are " +
          "verified and pre-populated automatically instead of through manual " +
          "review and repeated document requests — cutting the documentation " +
          "burden that dominates cycle time and procedural denials.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Citizen document corpora (forms, proofs, supporting evidence)",
          "Authoritative government data sources for cross-matching",
          "Case-system field schemas to prefill into",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Low-confidence extractions and adverse matches route to human review, never auto-deny",
          "Documents carry sensitive PII — handling must respect privacy and records-retention law",
        ],
        metricsMoved: [
          "processing_time",
          "application_approval_cycle_time",
          "improper_payment_rate",
        ],
      },
      {
        key: "ai_assisted_eligibility_triage",
        name: "AI-assisted eligibility triage & adjudication support",
        valueMechanism:
          "Triage incoming cases, surface the relevant policy and prior " +
          "decisions, and draft a recommended determination for a human " +
          "adjudicator to review — so caseworkers spend their judgment on the " +
          "hard cases and clear the routine ones faster, working down backlog " +
          "without adding headcount.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Codified eligibility rules and current policy",
          "Case history and prior adjudication outcomes",
          "Real-time access to the case/eligibility system of record",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Decisions affecting benefits/rights require human accountability, an explanation, and a documented appeal path — not autonomous denial",
          "Models must be tested for disparate impact across populations before and during use",
        ],
        metricsMoved: [
          "processing_time",
          "case_backlog",
          "application_approval_cycle_time",
        ],
      },
      {
        key: "improper_payment_anomaly_detection",
        name: "Improper-payment & fraud anomaly detection",
        valueMechanism:
          "Score payments and claims for anomaly and error patterns so " +
          "program-integrity staff investigate the highest-risk cases first and " +
          "documentation errors are caught before payment — reducing improper " +
          "payments while reserving scarce investigative capacity for genuine " +
          "fraud rather than blanket citizen burden.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical payment and adjudication data with labeled outcomes",
          "Cross-program and third-party verification data",
          "Documented error-vs-fraud taxonomy",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Flags are investigative leads, not determinations — no automated denial or recovery without human review and citizen appeal",
          "Models must be monitored for false-positive bias that wrongly burdens specific populations",
        ],
        metricsMoved: [
          "improper_payment_rate",
          "processing_time",
        ],
      },
      {
        key: "permitting_licensing_automation",
        name: "Permitting & licensing automation",
        valueMechanism:
          "Guide applicants through permit/license requirements, validate " +
          "completeness up front, auto-approve clearly-compliant low-risk " +
          "applications under rules, and route the rest with a recommendation — " +
          "compressing approval cycle time and shifting routine renewals to " +
          "instant self-service.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Permit/license rules, codes, and requirement matrices",
          "Applicant and property/business records for validation",
          "Geospatial / inspection data where relevant",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-approval is bounded to low-risk, rules-clear cases with audit trail; anything affecting safety/zoning stays human-reviewed",
          "Denials and conditions must be explainable and appealable",
        ],
        metricsMoved: [
          "application_approval_cycle_time",
          "self_service_rate",
          "cost_per_transaction",
        ],
      },
      {
        key: "proactive_outreach_status",
        name: "Proactive status & outreach (no-wrong-door)",
        valueMechanism:
          "Proactively notify citizens of case status, missing documents, " +
          "upcoming redeterminations, and benefits they are eligible for across " +
          "programs — reducing inbound status calls, preventing procedural " +
          "denials and coverage gaps, and improving equity by reaching citizens " +
          "who would not otherwise act.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Case status and deadline events from the case system",
          "Cross-program eligibility signals (no-wrong-door)",
          "Verified, accessible, multilingual contact channels",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Outreach content must be accurate and not create a legal entitlement claim it cannot honor",
          "Notification channels must respect consent, accessibility, and privacy",
        ],
        metricsMoved: [
          "call_abandonment_rate",
          "citizen_satisfaction",
          "equity_access_gap",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "omnichannel_no_wrong_door",
        name: "Omnichannel 'no-wrong-door' service platform",
        description:
          "A unified service layer where digital, phone, chat, and in-person " +
          "channels share one case view and one knowledge base, so a citizen " +
          "can start in any channel and be served consistently — with the " +
          "assisted channels deliberately retained and funded as the equity " +
          "backstop, not deprecated.",
        boundary:
          "Owns the service-delivery and channel-orchestration layer; does not " +
          "own program policy or eligibility rules (set by statute/regulation) " +
          "or the system-of-record data it reads.",
        humanAccountabilityPoint: "Chief Customer / Service Delivery Officer",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "triple_bottom_line_value_model",
        name: "Triple-bottom-line value model (service + cost + equity)",
        description:
          "A scoring model that sizes every initiative on three axes — citizen " +
          "service outcome, fully-loaded cost to serve, and equity/access " +
          "impact — and rejects gains on one axis that regress another, so the " +
          "business case reflects the public mission rather than cost alone.",
        boundary:
          "Owns value sizing, sequencing, and the equity gate; does not own " +
          "budget appropriation or the policy choices that set program scope.",
        humanAccountabilityPoint: "Agency CFO / Performance Officer",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "human_in_loop_adjudication",
        name: "Human-in-the-loop adjudication with explainability & appeal",
        description:
          "An adjudication pattern where AI triages, surfaces policy, and " +
          "drafts recommendations but a human makes every determination that " +
          "affects rights, each decision carries a citizen-readable explanation, " +
          "and an appeal path is built in — making automation defensible under " +
          "due-process and transparency obligations.",
        boundary:
          "Owns decision support and the explanation/appeal scaffolding; does " +
          "not make the final benefit/rights determination, which a human " +
          "officer owns.",
        humanAccountabilityPoint: "Program Adjudication / Hearings Officer",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "modular_procurement_legacy_strangler",
        name: "Modular procurement & legacy strangler modernization",
        description:
          "Modernize the legacy core incrementally — wrapping the system of " +
          "record with APIs and replacing capability module by module through " +
          "smaller, agile, competitively-sourced contracts — rather than a " +
          "single multi-year monolithic replacement, so value lands sooner and " +
          "procurement/legacy risk is contained.",
        boundary:
          "Owns the modernization sequencing and integration approach; does not " +
          "own the procurement authority or the underlying records-retention " +
          "obligations of the legacy system.",
        humanAccountabilityPoint: "Agency CIO / Modernization Program Executive",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Public-sector value is realized on a TRIPLE BOTTOM LINE — service, " +
        "cost, and equity — sized together and never traded silently. The cost " +
        "lever is channel shift and automation: moving transactions from " +
        "assisted channels (many dollars each) to digital self-service (cents " +
        "to low dollars), and deflecting/automating routine work so the same " +
        "appropriated dollars and headcount serve more citizens. The service " +
        "lever is cycle-time and backlog reduction: document AI, prefill, and " +
        "adjudication support compress the wait, while proactive outreach " +
        "prevents procedural denials. The equity lever is the binding " +
        "constraint, not an afterthought: every cost gain is scored net of its " +
        "access impact, and the assisted channel is funded as the backstop for " +
        "the population that cannot shift — so a saving that widens the access " +
        "gap is booked as a loss. Two hard realities cap realizable value and " +
        "must be modeled explicitly: legacy systems of record gate how much can " +
        "be made real-time/automated, and procurement cycles set the pace. " +
        "Cost models bind to the Workforce Economics substrate (channel " +
        "staffing rate-cards x FTE) so cost-to-serve traces to the budget.",
      dominantHaircutFactors: [
        {
          factor: "Legacy system of record constraint",
          rationale:
            "Batch eligibility engines, mainframe cores, and absent real-time " +
            "APIs cap how much front-end automation can actually achieve; " +
            "modernization value is gated by what the system of record can " +
            "support until it is replaced.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between modeled automation potential and what " +
              "legacy-bound integrations can realize before core modernization",
            label: "planning-range",
          },
        },
        {
          factor: "Equity / assisted-channel retention",
          rationale:
            "The residual population that cannot use digital must keep funded " +
            "assisted channels, so cost-to-serve cannot fall to the digital " +
            "unit cost across the board — the equity backstop is a real, " +
            "non-removable cost.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Share of transactions and cost that must remain assisted to " +
              "avoid widening the access gap",
            label: "planning-range",
          },
        },
        {
          factor: "Procurement & implementation timeline",
          rationale:
            "Acquisition cycles, competition requirements, and phased rollout " +
            "delay benefit realization and add one-time cost, so net-present " +
            "value is discounted versus a private-sector pace assumption.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Delay-to-value from public procurement cycles and staged " +
              "deployment versus an idealized timeline",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption, trust & workforce change",
          rationale:
            "Citizen trust in automated government decisions, staff adoption of " +
            "AI assistance under fixed headcount, and reskilling all gate " +
            "realized value; public trust and transparency requirements slow " +
            "rollout where rights are affected.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Government change-management and citizen-trust experience on " +
              "automated-service rollouts",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Channel shift cost reduction",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported cost-to-serve reduction from moving transactions to " +
              "digital self-service, net of the retained assisted channel",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in blended cost_per_transaction across the " +
            "channel mix (after the equity-retention haircut)",
        },
        {
          lever: "Backlog & cycle-time reduction",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Processing-time and aged-backlog reduction from document AI, " +
              "prefill, and adjudication support in case-driven programs",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in processing_time and aged case_backlog " +
            "against the program's service standard",
        },
        {
          lever: "Improper-payment reduction",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Reduction in documentation-error-driven improper payments from " +
              "data matching and pre-payment verification (fraud share lower)",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in improper_payment_rate, separating error from " +
            "fraud and net of false-positive citizen burden",
        },
      ],
      timeToValueBand:
        "Contact-center deflection and proactive outreach: 2-4 quarters. " +
        "Document AI / prefill and permitting/licensing automation: 3-6 " +
        "quarters, gated by legacy integration. AI-assisted adjudication and " +
        "improper-payment programs: 4-8 quarters including disparate-impact " +
        "testing and appeal scaffolding. Core legacy modernization (the " +
        "constraint that unlocks the rest): multi-year, sequenced via a " +
        "modular strangler approach rather than a single big-bang replacement.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Benefits / case management system",
          role:
            "System of record for citizen cases — eligibility, adjudication, " +
            "redetermination, and benefit issuance for a program.",
          examples: [
            "State integrated eligibility systems (SNAP/Medicaid/TANF)",
            "Salesforce / Microsoft Dynamics public-sector case platforms",
            "Custom mainframe eligibility engines",
          ],
        },
        {
          name: "Citizen digital service / portal",
          role:
            "The citizen-facing application, status, and self-service layer " +
            "across web and mobile; the digital channel front door.",
          examples: [
            "Login.gov / state identity-proofed portals",
            "Custom benefits and permitting portals",
            "GOV.UK-style unified service front-ends",
          ],
        },
        {
          name: "Permitting & licensing system",
          role:
            "Manages permit/license applications, reviews, inspections, " +
            "approvals, and renewals.",
          examples: [
            "Accela",
            "Tyler Technologies EnerGov",
            "OpenGov permitting & licensing",
          ],
        },
        {
          name: "Citizen contact center platform",
          role:
            "Telephony, IVR, chat, and case routing for citizen inquiries; the " +
            "assisted-channel surface and deflection point.",
          examples: [
            "Amazon Connect (gov)",
            "Genesys Cloud",
            "NICE CXone",
          ],
        },
        {
          name: "Payment & financial system",
          role:
            "Issues benefit/refund payments and records program outlays; the " +
            "basis for improper-payment measurement.",
          examples: [
            "Treasury/disbursement systems",
            "EBT issuance platforms",
            "Agency financial / ERP systems",
          ],
        },
        {
          name: "Procurement / acquisition system",
          role:
            "Manages solicitations, awards, and contract administration under " +
            "public procurement rules.",
          examples: [
            "SAM.gov / federal acquisition systems",
            "State eProcurement platforms",
            "Periscope / Bonfire sourcing tools",
          ],
        },
      ],
      roles: [
        {
          title: "Agency Head / Commissioner / Secretary",
          accountability:
            "The agency's mission delivery, public accountability, and the " +
            "service-cost-equity balance to oversight and the public.",
        },
        {
          title: "Chief Customer / Service Delivery Officer",
          accountability:
            "Citizen experience across channels, service standards, and the " +
            "equity of access — that the service works for every population.",
        },
        {
          title: "Agency CIO / Chief Digital Officer",
          accountability:
            "The technology estate, legacy modernization sequencing, digital " +
            "service delivery, and the security/privacy of citizen data.",
        },
        {
          title: "Program Integrity / Inspector General function",
          accountability:
            "Improper-payment prevention and detection, fraud investigation, " +
            "and the due-process integrity of integrity controls.",
        },
        {
          title: "Chief Procurement / Acquisition Officer",
          accountability:
            "Compliant, competitive acquisition of technology and services and " +
            "contract performance against public procurement rules.",
        },
        {
          title: "Program Adjudication / Hearings Officer",
          accountability:
            "The lawful, explainable determination on citizen cases and the " +
            "integrity of the appeals/hearings process.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Due process & administrative procedure",
          relevance:
            "Decisions affecting benefits, licenses, or rights must be " +
            "explainable, notice-bearing, and appealable — automation may " +
            "assist but cannot remove the citizen's right to an understandable " +
            "decision and a hearing.",
        },
        {
          name: "Algorithmic transparency & AI accountability requirements",
          relevance:
            "Government use of automated decision systems is increasingly " +
            "governed by transparency, impact-assessment, and disparate-impact " +
            "testing obligations, fencing where AI can make or shape decisions.",
        },
        {
          name: "Accessibility & language access (e.g. Section 508 / WCAG, LEP)",
          relevance:
            "Digital services must be accessible to people with disabilities " +
            "and provide meaningful access to limited-English-proficiency " +
            "populations — a hard constraint on channel design and an equity " +
            "obligation, not a preference.",
        },
        {
          name: "Privacy, records & data-protection law (e.g. Privacy Act / state equivalents)",
          relevance:
            "Citizen PII handling, data matching across programs, records " +
            "retention, and AI use on personal data are bound by privacy and " +
            "records law that limits what data can be combined and how.",
        },
        {
          name: "Public procurement & acquisition regulation (e.g. FAR / state codes)",
          relevance:
            "Competition, fair-source, and approval rules govern how and how " +
            "fast technology and services can be bought, shaping modernization " +
            "pace and contract structure.",
        },
        {
          name: "Improper Payments & program-integrity statutes",
          relevance:
            "Agencies are statutorily required to measure, report, and reduce " +
            "improper payments and to recover overpayments — within due-process " +
            "limits that protect wrongly-flagged citizens.",
        },
      ],
      canonicalTerms: [
        {
          term: "Channel shift",
          definition:
            "Moving citizen transactions from higher-cost assisted channels " +
            "(phone, in-person) to lower-cost digital self-service, measured " +
            "and bounded by equity of access.",
        },
        {
          term: "No-wrong-door",
          definition:
            "A service principle that a citizen can enter through any channel " +
            "or program and be connected to everything they are eligible for, " +
            "without bouncing between agencies.",
        },
        {
          term: "Improper payment",
          definition:
            "A payment made in error — overpayment, underpayment, or one " +
            "lacking required documentation — most of which is eligibility/" +
            "documentation error rather than fraud.",
        },
        {
          term: "Procedural denial",
          definition:
            "A denial driven by a process failure (e.g. failure to provide a " +
            "document on time) rather than substantive ineligibility — an " +
            "equity red flag when concentrated in vulnerable populations.",
        },
        {
          term: "Redetermination / recertification",
          definition:
            "The periodic re-verification of a citizen's continued eligibility " +
            "for a benefit — a recurring workload wave and a major source of " +
            "coverage loss when citizens miss it.",
        },
        {
          term: "Digital exclusion",
          definition:
            "The exclusion of citizens who lack broadband, devices, language " +
            "support, or digital literacy from digital-only services — the core " +
            "equity risk of channel shift.",
        },
        {
          term: "System of record (legacy core)",
          definition:
            "The authoritative, often mainframe/batch, system holding " +
            "eligibility and case data; the constraint that gates how much can " +
            "be automated or made real-time.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Cost to serve and the channel-shift prize",
        authoritativeSource:
          "Workforce Economics substrate (channel staffing rate-card x FTE) " +
          "plus technology cost over transaction volume by channel",
        whatGoodEvidenceLooksLike:
          "Fully-loaded cost-per-transaction by channel (digital vs assisted) " +
          "with the volume mix, so the shiftable spread is sized against the " +
          "retained-assisted floor.",
        weakEvidenceToReject:
          "A vendor 'digital saves 90%' claim with no link to the agency's own " +
          "channel cost base or to the assisted channel that must be retained.",
      },
      {
        claim: "Backlog and processing time",
        authoritativeSource:
          "Case/benefits system aging report and lifecycle timestamps against " +
          "the program's service standard",
        whatGoodEvidenceLooksLike:
          "Open cases by age bucket and average processing time, split into " +
          "document-wait versus adjudication, with intake-vs-disposition trend " +
          "to show whether the backlog is structural.",
        weakEvidenceToReject:
          "A single headline backlog number with no aging, no service standard, " +
          "and no document-vs-adjudication split.",
      },
      {
        claim: "Improper payments",
        authoritativeSource:
          "Program-integrity payment-accuracy reviews and post-payment audit " +
          "samples against the payment system",
        whatGoodEvidenceLooksLike:
          "Improper-payment rate decomposed into documentation error versus " +
          "actual fraud, with false-positive/citizen-burden impact of any " +
          "flagging program quantified.",
        weakEvidenceToReject:
          "A blended improper-payment percentage presented as fraud, with no " +
          "error-vs-fraud split and no measure of harm to wrongly-flagged " +
          "citizens.",
      },
      {
        claim: "Equity of access",
        authoritativeSource:
          "Segmented service-outcome analytics by population characteristic " +
          "(language, disability, broadband, geography) where lawfully collected",
        whatGoodEvidenceLooksLike:
          "Completion, satisfaction, and procedural-denial rates broken out by " +
          "population segment, showing the access gap and how a proposed change " +
          "moves it.",
        weakEvidenceToReject:
          "An agency-wide average satisfaction or adoption number with no " +
          "segmentation, which hides the populations being left behind.",
      },
      {
        claim: "Digital adoption and channel mix",
        authoritativeSource:
          "Portal and contact-center channel-mix reporting over time joined to " +
          "case-system transaction volumes",
        whatGoodEvidenceLooksLike:
          "Channel mix and digital adoption trended by transaction type, read " +
          "alongside call abandonment to confirm shift did not strand demand.",
        weakEvidenceToReject:
          "A rising digital-adoption figure cited alone, without the " +
          "abandonment/assisted-demand counter-evidence that would reveal " +
          "exclusion.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Can your front-end and any automation read and write the system of record in real time, or is eligibility/status still batch-processed on a legacy core?",
      "When you shift a transaction to digital, what happens to citizens who cannot use it — is the assisted channel still funded and is the access gap measured by population segment?",
      "Is your backlog a one-time surge that will clear or a structural gap where intake exceeds capacity, and what share of cycle time is document-wait versus adjudication?",
      "Does your improper-payment number separate documentation error from fraud, and does every flag a citizen receives carry an explanation and an appeal path?",
      "What is your cost-per-transaction by channel, and what is the realistic shiftable spread after the assisted channel you must retain for equity?",
      "How long does it take to procure and deploy a new capability, and are you locked into monolithic contracts that prevent iteration?",
      "Given fixed appropriated headcount and long hiring cycles, where will the capacity and the AI/data skills to run a modernized operation come from?",
    ],
    maturitySignals: [
      "Service is measured on three axes — service outcome, cost-to-serve, and equity/access by segment — not cost alone.",
      "The legacy core exposes real-time APIs (or a strangler modernization is underway), so automation is not capped by batch processing.",
      "Assisted channels are deliberately funded as the equity backstop, and the access gap is tracked, not assumed away.",
      "Every automated decision affecting rights carries a citizen-readable explanation and a working appeal path, with disparate-impact testing in place.",
    ],
    redFlags: [
      "Digital adoption is rising while call abandonment and procedural denials also rise — cost savings are being taken by excluding vulnerable citizens.",
      "An improper-payment program flags or denies citizens with no explanation or appeal, and conflates documentation error with fraud.",
      "Automation is being layered on a batch/mainframe core that cannot support real-time decisions, so projected benefits cannot land.",
      "The business case scores cost savings with no equity or service axis, so a regression in access is invisible.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Integrated eligibility / case-system vendors",
        category: "Benefits & case management core (system of record)",
        switchingCost:
          "Extreme — the eligibility core holds program rules and citizen case history; replacement is a multi-year, high-risk modernization rarely undertaken outside a funded program.",
        renewalDynamics:
          "Long multi-year contracts with large maintenance tails; modernization is the renewal event and the main negotiating window.",
      },
      {
        vendorName: "Digital-government platform providers (Salesforce, Microsoft, ServiceNow)",
        category: "Citizen portal / case / service-delivery platform",
        switchingCost:
          "High — citizen workflows, integrations, and configuration accrete; re-platforming the service layer is disruptive but more feasible than the eligibility core.",
        renewalDynamics:
          "Per-seat or per-transaction public-sector pricing; AI capabilities increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Permitting & licensing suite vendors (Accela, Tyler, OpenGov)",
        category: "Permitting / licensing / inspections",
        switchingCost:
          "High — embedded in code/rule configuration, inspector workflows, and citizen-facing portals; data and rule migration is the real cost.",
        renewalDynamics:
          "Subscription or module-based pricing; leverage realized cycle-time and self-service improvements at renewal.",
      },
      {
        vendorName: "Contact-center / CCaaS providers (Amazon Connect, Genesys, NICE)",
        category: "Citizen contact center + AI deflection",
        switchingCost:
          "Moderate — telephony and routing are portable, but knowledge bases and trained deflection models add stickiness over time.",
        renewalDynamics:
          "Consumption or per-agent pricing; AI/deflection upsold as add-ons — favor outcome terms tied to measured first-contact resolution and deflection.",
      },
      {
        vendorName: "Systems integrators / professional-services primes",
        category: "Implementation, integration, and modernization delivery",
        switchingCost:
          "High — institutional knowledge of the legacy estate and program rules concentrates with the incumbent SI; re-competing mid-program carries ramp and continuity risk.",
        renewalDynamics:
          "Large task-order or program contracts; modular/agile contracting and recompetition are the levers against incumbent lock-in.",
      },
    ],
    switchingCosts:
      "The eligibility/case system of record is effectively non-switchable outside a funded modernization, and incumbent SIs hold legacy/program knowledge — so the negotiable frontier is the service-delivery, contact-center, and permitting layers around the core, and the contracting model itself (modular, competitively-recompeted, outcome-linked) rather than a wholesale core replacement.",
    negotiationLevers: [
      "Modular, agile contracting against the legacy core instead of a single monolithic replacement — buy capability in increments to preserve competition and reduce lock-in",
      "Outcome-linked terms tied to measured cost-to-serve, cycle-time, first-contact resolution, and equity metrics rather than effort/seats alone",
      "Data portability, model-transparency, and exit rights so citizen data and trained models are not hostage to one vendor",
      "Competitive recompetition and small-business/fair-source set-asides used as price discipline within procurement rules",
      "Accessibility, security (e.g. authorization-to-operate), and disparate-impact testing as mandatory acceptance gates, not change orders",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      service_metric: [
        "case/benefits system lifecycle timestamps",
        "service-standard the metric is read against",
        "trailing-period aggregation",
      ],
      cost_to_serve_claim: [
        "Workforce Economics substrate channel staffing basis (rate-card x FTE)",
        "transaction volume by channel",
        "retained-assisted-channel floor applied",
      ],
      equity_claim: [
        "segmented outcomes by population characteristic (lawfully collected)",
        "access-gap measurement, not an aggregate average",
      ],
      improper_payment_claim: [
        "payment-accuracy review or audit sample",
        "documentation-error vs fraud split",
        "false-positive / citizen-burden impact",
      ],
      automation_decision_claim: [
        "explainability of the decision",
        "human accountability point",
        "appeal path and disparate-impact testing",
      ],
      value_projection: [
        "triple-bottom-line sizing (service + cost + equity)",
        "benchmark planning-range",
        "explicit haircut factors (legacy / equity / procurement)",
        "budget/appropriation reconciliation path",
      ],
    },
    citationStandard:
      "Quantitative public-sector claims cite the case/benefits system or " +
      "contact-center platform for service metrics and the Workforce Economics " +
      "substrate (channel rate-card x FTE) for cost-to-serve, with the period " +
      "and the service standard. Cost-savings projections cite the channel " +
      "spread NET of the retained assisted channel, a labelled planning range, " +
      "and the legacy/equity/procurement haircuts. Equity claims cite SEGMENTED " +
      "outcomes, never an aggregate average. Any claim about an automated " +
      "decision affecting a citizen cites its explainability and appeal path. " +
      "Improper-payment claims cite the error-vs-fraud split — never a blended " +
      "number presented as fraud.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no channel-level cost basis or substrate — frame cost-to-serve and the channel-shift prize as an industry planning range, not their measured number.",
      "A cost or adoption gain is quoted without its equity/access impact — flag that the saving is unverified until the access gap is measured by segment.",
      "Automation potential is cited without confirming real-time access to the legacy system of record — present the legacy-gated ceiling explicitly.",
      "An improper-payment or fraud figure is cited without the error-vs-fraud split — mark it as blended and not attributable to fraud.",
    ],
    inferenceLanguage: [
      "Across government agencies at this scale, digital cost-per-transaction typically runs cents to low dollars versus many dollars assisted, so...",
      "Without your segmented outcome data, the industry pattern suggests channel shift can widen the access gap unless the assisted channel is retained...",
      "Peer agencies commonly cap realizable automation at... where the system of record is still batch-processed...",
      "Treating this as a planning range rather than your measured figure, and net of the equity-retention floor...",
    ],
    flagWithoutEvidence: [
      "A specific cost saving or ROI for this agency stated without the equity and service axes",
      "This agency's actual digital-adoption, backlog, processing-time, or improper-payment figure",
      "A claim that a transaction can be fully shifted to digital without measuring who it excludes",
      "A claim that an automated decision is compliant without naming its explanation and appeal path",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "cost-to-serve by channel / where does the cost of serving citizens sit",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack fully-loaded cost by channel (digital, phone, in-person, mail) to show the shiftable spread against the retained-assisted floor.",
    },
    {
      questionPattern:
        "channel-shift savings story / triple-bottom-line value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current cost-to-serve to channel shift to automation to net cost, with the legacy, equity-retention, and procurement haircuts shown explicitly.",
    },
    {
      questionPattern: "backlog and processing-time trend versus the service standard",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend aged backlog and processing time against the program's standard to show whether the gap is closing or structural.",
    },
    {
      questionPattern:
        "equity access gap by population segment",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Completion / satisfaction / procedural-denial by population segment, highlighting the access gap a proposed change must not widen.",
    },
    {
      questionPattern: "citizen-services KPI scorecard",
      exhibitKind: "table",
      note: "Digital adoption, self-service rate, backlog, processing time, cost-per-transaction, first-contact resolution, abandonment, improper-payment rate, satisfaction, and the equity access gap versus planning ranges.",
    },
    {
      questionPattern: "improper-payment decomposition: error vs fraud",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      note: "Split the improper-payment rate into documentation error vs fraud and show false-positive citizen burden, so integrity efforts target the right driver.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Value is governed on the triple bottom line so cost gains that regress equity or service are caught and rejected before they ship",
      "The legacy system of record exposes real-time access (or a modular strangler modernization is funded and underway) so automation can actually land",
      "Assisted channels are funded as the equity backstop and the access gap is measured by segment, keeping channel shift honest",
      "Automated decisions affecting rights carry explainability, human accountability, and appeal — making them defensible and trusted",
    ],
    failureDrivers: [
      "Automation is layered on a batch/mainframe core that cannot support real-time decisions, so the projected benefits never materialize",
      "Cost savings are taken by quietly excluding citizens who cannot use digital, widening the access gap and inviting litigation and oversight",
      "Improper-payment programs flag and deny without explanation or appeal, conflating documentation error with fraud and harming eligible citizens",
      "Monolithic multi-year procurement locks the agency into a vendor and a timeline, so the technology is obsolete before it deploys",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Contact-center deflection and proactive outreach adopt first because " +
      "they are low-risk, measurable, and do not make rights decisions. " +
      "Document AI, prefill, and permitting/licensing automation follow as " +
      "legacy integration allows. AI-assisted adjudication and improper-payment " +
      "programs adopt last and slowest because they touch citizens' rights and " +
      "require explainability, appeal scaffolding, and disparate-impact testing " +
      "before scale. Core legacy modernization is the long pole that gates how " +
      "far the rest can go.",
    roiClarity: "medium",
    roiClarityBasis:
      "Cost-to-serve and cycle-time gains are measurable in the case system and " +
      "the Workforce Economics substrate, so the COST axis of ROI is reasonably " +
      "firm. But public-sector ROI is deliberately not just cost: equity and " +
      "service outcomes are first-class and harder to monetize, appropriated " +
      "budgets mean 'savings' often become reinvested capacity rather than " +
      "cash, and the legacy and procurement constraints make timing uncertain. " +
      "ROI clarity sits at medium because the honest value is a triple bottom " +
      "line, not a single discounted-cash-flow number.",
  },

  regulatoryFrame: {
    name: "Due process, algorithmic transparency, accessibility & public procurement",
    relevance:
      "The dominant frame for public-sector citizen services: decisions " +
      "affecting benefits, licenses, or rights require explainability, notice, " +
      "and appeal (due process), and government use of automated decision " +
      "systems is increasingly bound by transparency and disparate-impact " +
      "obligations — so AI assists but cannot autonomously decide. Accessibility " +
      "and language-access law fence digital channel design, privacy/records law " +
      "limits cross-program data matching, and public procurement rules shape " +
      "how fast and how modular modernization can be. Improper-payment statutes " +
      "require measurement and recovery within due-process limits (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (industries)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
