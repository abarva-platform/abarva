// Consilium expert — Healthcare Revenue Cycle (provider, Epic-anchored).
//
// W3.1 exemplar (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). This is the
// first hand-authored ExpertPack v2 — it proves the schema end-to-end before
// the ~210-pack authoring run. It clears EXPERT_PACK_DEPTH_MINIMUMS and is the
// reference depth bar every subsequent expert is held to.
//
// Domain: provider revenue cycle management (RCM). Anchored to Epic Resolute
// (PB/HB), Tapestry, and MyChart as the dominant systems of record, but the
// content is product-aware, not product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const healthcareRevenueCycleExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.healthcare-provider.revenue-cycle",
    expertName: "Healthcare Revenue Cycle Expert",
    kind: "industry-function",
    industry: "healthcare_provider",
    functionKey: "revenue-cycle",
    scopeNote:
      "Provider-side revenue cycle: patient access (eligibility, prior auth, " +
      "estimates, POS collections), mid-cycle (charge capture, coding/CDI, " +
      "DNFB), and back-end (claims, denials, underpayments, patient AR, bad " +
      "debt). Anchored to Epic Resolute PB/HB. Excludes payer-side adjudication " +
      "and clinical care delivery (separate experts).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "net_collection_rate",
        name: "Net collection rate",
        definition:
          "Payments collected as a percentage of the contractually allowed " +
          "amount (net of contractual adjustments). Measures how much of what " +
          "is actually owed gets collected.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 99,
          basis:
            "MAP Keys / HFMA peer ranges for provider RCM, operator experience",
          label: "planning-range",
        },
        dataSource:
          "835 remittances vs contractual allowed amounts (Resolute PB/HB)",
        whyItMatters:
          "The truest measure of yield — isolates collection performance from " +
          "contractual write-offs. A 2pt gap on a $2B net-revenue system is ~$40M.",
      },
      {
        key: "ar_days",
        name: "Days in accounts receivable (AR days)",
        definition:
          "Net AR divided by average daily net patient service revenue. How " +
          "long, on average, revenue sits uncollected.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 35,
          high: 50,
          basis:
            "HFMA MAP Keys provider ranges; varies by payer mix and service line",
          label: "planning-range",
        },
        dataSource: "AR aging from Resolute (PB and HB ledgers)",
        whyItMatters:
          "Working-capital proxy. Every day of AR on a large system is tens of " +
          "millions in tied-up cash; the trend matters more than the absolute.",
      },
      {
        key: "initial_denial_rate",
        name: "Initial denial rate",
        definition:
          "Share of claims denied on first submission, by count or by charge " +
          "value. Excludes informational/zero-pay adjustments.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 10,
          basis: "Industry surveys (denials commonly 6-13%); best-in-class <5%",
          label: "planning-range",
        },
        dataSource: "835 remit denial codes (CARC/RARC) joined to 837 claims",
        whyItMatters:
          "The single biggest controllable leakage. ~65% of denials are never " +
          "reworked, so the initial rate is largely permanent revenue loss.",
      },
      {
        key: "clean_claim_rate",
        name: "Clean claim rate",
        definition:
          "Percentage of claims that pass payer edits and adjudicate without " +
          "manual intervention on first pass.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 98,
          basis: "Clearinghouse benchmarks; best-in-class >98%",
          label: "planning-range",
        },
        dataSource: "Clearinghouse acceptance + 277CA responses",
        whyItMatters:
          "Leading indicator for denials and AR days. Front-end and edit quality " +
          "show up here weeks before they show up in cash.",
      },
      {
        key: "cost_to_collect",
        name: "Cost to collect",
        definition:
          "Total revenue-cycle operating cost as a percentage of net patient " +
          "service revenue.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 4,
          basis: "HFMA cost-to-collect ranges; best-in-class ~2-2.5%",
          label: "planning-range",
        },
        dataSource: "RCM department cost centers / NPSR (GL + Resolute)",
        whyItMatters:
          "The efficiency denominator for any automation business case — AI bets " +
          "are judged on whether they move yield without inflating this.",
      },
      {
        key: "pos_collection_rate",
        name: "Point-of-service collection rate",
        definition:
          "Patient liability collected at or before service as a share of total " +
          "patient liability that is collectable up front.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 40,
          basis: "Peer ranges; high-deductible exposure widens the spread",
          label: "planning-range",
        },
        dataSource:
          "POS payment postings vs estimated patient liability (MyChart/registration)",
        whyItMatters:
          "Pre-service dollars are the cheapest to collect; every point of POS " +
          "lift avoids downstream statements, calls, and bad debt.",
      },
      {
        key: "dnfb_days",
        name: "Discharged-not-final-billed (DNFB) days",
        definition:
          "Gross dollars of accounts discharged but not yet billed, expressed " +
          "in days of revenue.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 7,
          basis: "HFMA MAP Keys; best-in-class ~3-4 days",
          label: "planning-range",
        },
        dataSource: "DNFB workqueues (Resolute HB; coding/CDI hold reasons)",
        whyItMatters:
          "Pure timing leakage — revenue earned but trapped behind coding and " +
          "documentation. The fastest cash-acceleration lever.",
      },
      {
        key: "denial_overturn_rate",
        name: "Denial overturn rate",
        definition:
          "Percentage of appealed denials that are overturned and paid.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 60,
          basis:
            "Appeal outcome data; clinical denials overturn higher than technical",
          label: "planning-range",
        },
        dataSource: "Appeal tracking + subsequent 835 payments",
        whyItMatters:
          "Proves how much denied revenue is genuinely recoverable — and where " +
          "rework effort is worth spending vs writing off.",
      },
      {
        key: "underpayment_rate",
        name: "Payer underpayment rate",
        definition:
          "Share of paid claims where the payment is below the contractually " +
          "expected amount, by count or dollars.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 5,
          basis:
            "Contract-management vendor findings; varies by payer and contract complexity",
          label: "planning-range",
        },
        dataSource:
          "Expected-vs-actual from contract terms applied to 835 lines",
        whyItMatters:
          "Silent leakage — payments that look fine but breach contract. Often " +
          "uncaught without a variance engine; recoveries are high-margin.",
      },
      {
        key: "charge_lag_days",
        name: "Charge lag (days)",
        definition:
          "Average elapsed days from date of service to charge posting.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 5,
          basis: "Operator experience; service-line dependent",
          label: "planning-range",
        },
        dataSource: "Charge entry timestamps vs service dates (Resolute)",
        whyItMatters:
          "Late charges drive DNFB and timely-filing denials; the upstream cause " +
          "of several downstream metrics.",
      },
      {
        key: "bad_debt_rate",
        name: "Bad debt rate",
        definition:
          "Patient balances written off to bad debt as a share of gross patient " +
          "revenue.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 6,
          basis: "Peer ranges; high-deductible and self-pay mix widen it",
          label: "planning-range",
        },
        dataSource: "Bad-debt write-off transactions / gross patient revenue",
        whyItMatters:
          "The end-state of weak patient access and self-pay strategy; rising " +
          "bad debt is the lagging signal that front-end controls have failed.",
      },
    ],

    painThemes: [
      {
        key: "denial_spiral",
        name: "Front-end-seeded denial spiral",
        description:
          "Eligibility, registration, and authorization errors at the front " +
          "desk surface weeks later as back-end denials, where rework is " +
          "expensive and timely-filing windows are closing.",
        detectionSignal:
          "High share of denials in CARC categories for eligibility (CO-27), " +
          "auth (CO-197), and registration; denials concentrated in specific " +
          "access points or registrars.",
        diagnosticQuestion:
          "What share of your denials trace to front-end eligibility/auth " +
          "errors, and do you measure denials back to the originating access point?",
      },
      {
        key: "prior_auth_bottleneck",
        name: "Prior authorization bottleneck",
        description:
          "Manual, payer-by-payer prior auth delays scheduling, creates " +
          "auth-related denials, and consumes scarce staff on portal lookups " +
          "and faxes.",
        detectionSignal:
          "Auth-related denials (CO-197), long lead time from order to " +
          "scheduled service, large auth workqueues, high overtime in access.",
        diagnosticQuestion:
          "How many FTEs are on prior auth today, and what is your order-to-auth " +
          "turnaround by payer and service line?",
      },
      {
        key: "underpayment_leakage",
        name: "Silent underpayment leakage",
        description:
          "Payers pay below contracted rates and the variance is never " +
          "detected because expected reimbursement isn't modeled per contract.",
        detectionSignal:
          "No expected-vs-actual variance report; recoveries spike whenever a " +
          "contract-management tool is first switched on.",
        diagnosticQuestion:
          "Do you model expected reimbursement per payer contract and " +
          "systematically pursue variances, or rely on staff to spot shortfalls?",
      },
      {
        key: "patient_ar_balloon",
        name: "Patient-responsibility AR balloon",
        description:
          "High-deductible plans shift balances to patients post-insurance, " +
          "where collection rates collapse and bad debt climbs without a " +
          "pre-service estimate and POS strategy.",
        detectionSignal:
          "Rising self-pay-after-insurance AR, falling POS collection rate, " +
          "growing statement and call volumes, bad debt trending up.",
        diagnosticQuestion:
          "What is your POS collection rate, and do patients get an accurate " +
          "good-faith estimate before service?",
      },
      {
        key: "coding_cdi_gaps",
        name: "Coding & CDI specificity gaps",
        description:
          "Incomplete documentation and under-specific coding drive DRG " +
          "downgrades, missed severity/HCC capture, and clinical-validation " +
          "denials.",
        detectionSignal:
          "DRG downgrade rate, low CC/MCC capture, clinical-validation denials, " +
          "CDI query response lag.",
        diagnosticQuestion:
          "What is your DRG downgrade rate and CC/MCC capture, and how fast do " +
          "clinicians respond to CDI queries?",
      },
      {
        key: "dnfb_backlog",
        name: "DNFB / late-charge backlog",
        description:
          "Coding capacity, documentation holds, and late charges trap earned " +
          "revenue behind the bill-drop, inflating DNFB and timely-filing risk.",
        detectionSignal:
          "DNFB days above target, growing coding workqueues, charge lag rising, " +
          "timely-filing denials (CO-29).",
        diagnosticQuestion:
          "What is sitting in DNFB right now by hold reason, and how much is " +
          "coding capacity vs documentation vs charge lag?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "denial_prediction_prevention",
        name: "Denial prediction & prevention",
        valueMechanism:
          "Score claims pre-submission for denial risk and route high-risk " +
          "claims to correction before they go out — converting downstream " +
          "rework and write-offs into first-pass payments.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical 837 claims + 835 denial outcomes",
          "Payer/plan and CARC/RARC history",
          "Eligibility and authorization status at submission",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Model must explain why a claim is high-risk so staff can act",
          "Guard against suppressing legitimate claims (false positives delay cash)",
        ],
        metricsMoved: [
          "initial_denial_rate",
          "clean_claim_rate",
          "net_collection_rate",
        ],
      },
      {
        key: "ai_prior_auth",
        name: "AI-assisted prior authorization",
        valueMechanism:
          "Automate auth requirement determination, packet assembly, and status " +
          "follow-up across payer portals — cutting turnaround and auth denials " +
          "while freeing access staff.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Payer auth requirement rules by code/plan",
          "Order and clinical documentation",
          "Payer portal / 278 transaction connectivity",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Clinical-necessity judgment stays with humans",
          "Payer portal automation must respect terms and rate limits",
        ],
        metricsMoved: ["initial_denial_rate", "ar_days", "cost_to_collect"],
      },
      {
        key: "autonomous_coding",
        name: "Computer-assisted / autonomous coding",
        valueMechanism:
          "Suggest or auto-assign codes from clinical documentation, clearing " +
          "DNFB faster and improving specificity, with coders reviewing " +
          "exceptions rather than coding every chart.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Clinical documentation (notes, op reports)",
          "Coding guidelines and payer-specific edits",
          "Historical coded charts for calibration",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Coding accuracy is a compliance exposure — audit trail mandatory",
          "Autonomous assignment only for low-complexity, well-evidenced charts",
        ],
        metricsMoved: ["dnfb_days", "charge_lag_days", "net_collection_rate"],
      },
      {
        key: "underpayment_variance_detection",
        name: "Contract underpayment variance detection",
        valueMechanism:
          "Model expected reimbursement per contract and flag every line paid " +
          "below terms, turning silent leakage into pursued, high-margin recoveries.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Digitized payer contract terms and fee schedules",
          "835 remittance detail at line level",
          "Charge master / expected allowed amounts",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Contract modeling errors create false variances — validate before pursuit",
          "Recovery pursuit must respect payer dispute timelines",
        ],
        metricsMoved: ["underpayment_rate", "net_collection_rate"],
      },
      {
        key: "propensity_to_pay",
        name: "Patient propensity-to-pay & personalized outreach",
        valueMechanism:
          "Segment patient balances by likelihood and ability to pay and tailor " +
          "channel, timing, and financial-assistance routing — lifting patient " +
          "collections while reducing wasted statements and calls.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Patient balance, plan, and payment history",
          "Prior outreach response data",
          "Financial-assistance eligibility signals",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Avoid steering eligible patients away from financial assistance",
          "Outreach must comply with patient-communication and collections rules",
        ],
        metricsMoved: ["pos_collection_rate", "bad_debt_rate", "ar_days"],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "financial_clearance_hub",
        name: "Front-end financial clearance hub",
        description:
          "A pre-service control point that verifies eligibility, secures " +
          "authorization, estimates patient liability, and collects at POS — " +
          "stopping denials and bad debt at the source.",
        boundary:
          "Owns pre-service financial readiness; does not own clinical " +
          "scheduling decisions or post-service collections.",
        humanAccountabilityPoint: "Patient Access Director",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "denials_triage_workflow",
        name: "AI-triaged denials management workflow",
        description:
          "Denials are categorized, prioritized by recoverability, and routed " +
          "to the right work team with prediction feeding prevention back upstream.",
        boundary:
          "Owns post-denial rework and root-cause feedback; does not replace " +
          "front-end prevention controls.",
        humanAccountabilityPoint: "Denials Management Lead",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "autonomous_coding_pipeline",
        name: "Autonomous coding pipeline with HITL review",
        description:
          "Documentation flows to a coding engine that auto-assigns low-complexity " +
          "charts and routes the rest to coders, with full audit trail and CDI " +
          "query integration.",
        boundary:
          "Owns code assignment and DNFB clearance; does not make clinical " +
          "documentation judgments — those route to CDI/physicians.",
        humanAccountabilityPoint: "Coding & CDI Director",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "contract_variance_engine",
        name: "Contract management & payment variance engine",
        description:
          "A digitized contract model computes expected reimbursement per line " +
          "and surfaces underpayments and denials for systematic recovery.",
        boundary:
          "Owns expected-vs-actual variance and recovery queues; does not " +
          "negotiate contracts.",
        humanAccountabilityPoint: "Managed Care / Payer Contracting Director",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Revenue-cycle value compounds front-to-back: front-end prevention " +
        "(eligibility, auth, estimates, POS) reduces denials and bad debt; " +
        "mid-cycle acceleration (coding, DNFB) frees trapped cash; back-end " +
        "recovery (denials, underpayments) reclaims leakage. The durable wins " +
        "are prevention and yield, not just faster rework.",
      dominantHaircutFactors: [
        {
          factor: "Payer behavior & contract complexity",
          rationale:
            "Payers adapt edits and policies; recovered dollars can erode as " +
            "payers tighten, so forward value must be discounted for payer response.",
          typicalHaircut: {
            low: 0.15,
            high: 0.35,
            basis:
              "Observed erosion of denial/underpayment recoveries over time",
            label: "planning-range",
          },
        },
        {
          factor: "Data readiness (contracts, remits, documentation)",
          rationale:
            "Variance and coding automation are only as good as digitized " +
            "contracts and structured documentation; gaps cap realizable value.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Implementation experience where contract/doc data was incomplete",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption & workflow change",
          rationale:
            "Value requires registrars, coders, and follow-up staff to change " +
            "workflow; partial adoption leaves benefit on the table.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis: "RCM change-management experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Initial denial rate reduction",
          range: {
            low: 0.2,
            high: 0.4,
            basis:
              "Reported reductions from prediction + front-end prevention programs",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in initial_denial_rate",
        },
        {
          lever: "Underpayment recovery",
          range: {
            low: 0.005,
            high: 0.02,
            basis: "Net-revenue uplift from contract-variance programs",
            label: "planning-range",
          },
          measuredAs:
            "Incremental net patient service revenue as a fraction of NPSR",
        },
        {
          lever: "DNFB / cash acceleration",
          range: {
            low: 1,
            high: 3,
            basis: "Days of DNFB removed by coding automation",
            label: "planning-range",
          },
          measuredAs: "Days of DNFB reduced (one-time working-capital release)",
        },
      ],
      timeToValueBand:
        "Front-end and denials prevention: 2-4 quarters. Underpayment recovery: " +
        "1-2 quarters once contracts are modeled. Coding automation: 2-3 quarters " +
        "including HITL ramp.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Patient accounting / billing (PB & HB)",
          role: "System of record for charges, claims, AR, and remits — the RCM core.",
          examples: [
            "Epic Resolute Professional Billing",
            "Epic Resolute Hospital Billing",
          ],
        },
        {
          name: "Patient access / registration & scheduling",
          role: "Captures demographics, coverage, and authorization at the front end.",
          examples: ["Epic Cadence", "Epic Prelude", "Epic Welcome"],
        },
        {
          name: "Patient engagement / portal",
          role: "Patient-facing estimates, statements, and digital payments.",
          examples: ["Epic MyChart"],
        },
        {
          name: "Health plan / payer admin (for provider-sponsored plans)",
          role: "Adjudication and care management where the system bears risk.",
          examples: ["Epic Tapestry"],
        },
        {
          name: "Clearinghouse / claims edits",
          role: "Scrubs and transmits claims; returns acceptance and denial responses.",
          examples: [
            "Clearinghouse claim status (277CA), eligibility (270/271)",
          ],
        },
      ],
      roles: [
        {
          title: "VP / Chief Revenue Cycle Officer",
          accountability: "End-to-end net revenue yield and cost to collect.",
        },
        {
          title: "Patient Access Director",
          accountability:
            "Eligibility, authorization, estimates, and POS collections.",
        },
        {
          title: "Coding & CDI Director",
          accountability:
            "Coding accuracy, DNFB, and documentation specificity.",
        },
        {
          title: "Denials Management Lead",
          accountability: "Denial prevention, rework, and appeals outcomes.",
        },
        {
          title: "Managed Care / Payer Contracting Director",
          accountability: "Contract terms and payment integrity.",
        },
      ],
      regulatoryFrames: [
        {
          name: "HIPAA / HITECH",
          relevance:
            "Governs PHI handling across all RCM systems and AI processing of patient data.",
        },
        {
          name: "No Surprises Act",
          relevance:
            "Requires good-faith estimates and balance-billing protections — shapes estimation and patient liability.",
        },
        {
          name: "Hospital Price Transparency rule",
          relevance:
            "Mandates machine-readable standard charges and shoppable services.",
        },
        {
          name: "Medicare conditions of participation & billing rules",
          relevance:
            "Define compliant coding, billing, and documentation for the largest payer.",
        },
      ],
      canonicalTerms: [
        {
          term: "DNFB",
          definition:
            "Discharged Not Final Billed — earned revenue held before the bill drops, usually for coding or documentation.",
        },
        {
          term: "CARC / RARC",
          definition:
            "Claim Adjustment / Remittance Advice Reason Codes on the 835 that explain denials and adjustments.",
        },
        {
          term: "Net collection rate",
          definition:
            "Collections as a share of contractually allowed amounts — yield net of write-offs.",
        },
        {
          term: "CC / MCC",
          definition:
            "Complication-or-Comorbidity / Major CC — documentation that raises DRG severity and reimbursement.",
        },
        {
          term: "835 / 837",
          definition:
            "EDI remittance (835) and claim (837) transactions — the backbone of claims and payment data.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Initial denial rate and its drivers",
        authoritativeSource: "835 remittances (CARC/RARC) joined to 837 claims",
        whatGoodEvidenceLooksLike:
          "Denial counts and charge dollars by reason code, payer, and originating access point over a trailing period.",
        weakEvidenceToReject:
          "A single staff-reported percentage with no remit-level breakdown.",
      },
      {
        claim: "Days in AR",
        authoritativeSource: "AR aging from Resolute PB/HB",
        whatGoodEvidenceLooksLike:
          "Net AR and average daily net revenue computed from the ledger, with payer-mix context.",
        weakEvidenceToReject:
          "A dashboard figure with no definition of numerator/denominator or date range.",
      },
      {
        claim: "Payer underpayment",
        authoritativeSource:
          "Expected reimbursement (digitized contract terms) vs 835 line-level payments",
        whatGoodEvidenceLooksLike:
          "Expected-vs-actual variance by contract and line, validated against contract documents.",
        weakEvidenceToReject:
          "Anecdotal 'we think payer X underpays' without a modeled expected amount.",
      },
      {
        claim: "Net collection rate",
        authoritativeSource: "Posted payments vs contractual allowed amounts",
        whatGoodEvidenceLooksLike:
          "Collections over allowed (not gross charges), with contractual adjustments isolated.",
        weakEvidenceToReject:
          "Gross collection rate presented as if it were net.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your initial denial rate, and can you break it down by payer and root cause (eligibility, auth, coding, timely filing)?",
      "What share of denials is never reworked, and what is your appeal overturn rate?",
      "Do you model expected reimbursement per payer contract and systematically pursue underpayments?",
      "What is your POS collection rate, and do patients receive an accurate good-faith estimate before service?",
      "What is sitting in DNFB right now, and how much is coding capacity vs documentation holds vs charge lag?",
      "How many FTEs are on prior authorization, and what is order-to-auth turnaround by payer?",
      "What is your net (not gross) collection rate and cost to collect?",
    ],
    maturitySignals: [
      "Denials are measured back to the originating access point and registrar, not just totaled.",
      "Expected reimbursement is modeled per contract and variances are worked systematically.",
      "Pre-service estimates are generated and POS collection is a managed metric.",
      "Coding/CDI operate with query workflows and DRG-downgrade tracking, not just chart throughput.",
    ],
    redFlags: [
      "Only a gross collection rate is reported — net yield is invisible.",
      "No expected-vs-actual contract variance reporting exists.",
      "Denials are tracked in aggregate with no root-cause-to-front-end linkage.",
      "POS collection rate is unknown or untracked while patient AR and bad debt rise.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "EHR-native RCM (Epic Resolute)",
        category: "Core patient accounting / billing",
        switchingCost:
          "Extreme — the billing core is fused to the clinical record; replacement is a multi-year platform decision.",
        renewalDynamics:
          "Bundled with the enterprise EHR agreement; rarely sourced standalone.",
      },
      {
        vendorName: "Denials & contract-management point solutions",
        category: "Denials prediction / underpayment variance",
        switchingCost:
          "Moderate — integrates via remits/claims feeds; replaceable with data-mapping effort.",
        renewalDynamics:
          "Often contingency/percentage-of-recovery pricing; scrutinize as recoveries mature.",
      },
      {
        vendorName: "AI prior-auth & coding automation vendors",
        category: "Front-end auth automation / computer-assisted coding",
        switchingCost:
          "Moderate — workflow-embedded but swappable; watch model lock-in and audit access.",
        renewalDynamics:
          "Emerging market, fast-moving pricing; favor outcome-based terms and exit rights.",
      },
    ],
    switchingCosts:
      "The billing core (Epic) is effectively non-switchable in isolation; the value frontier is in best-of-breed automation around it, where switching cost is moderate and negotiable.",
    negotiationLevers: [
      "Outcome/contingency pricing tied to measured denial reduction or recovery",
      "Audit and explainability access as a contractual requirement",
      "Data portability and exit rights to avoid model lock-in",
      "Pilot-to-scale gating with parity proof before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      denial_metric: [
        "835 remit detail",
        "837 claim join",
        "trailing-period aggregation",
      ],
      yield_metric: ["posted payments", "contractual allowed amounts"],
      underpayment_claim: [
        "digitized contract terms",
        "835 line-level payments",
      ],
      ar_metric: ["AR aging ledger", "net daily revenue basis"],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors",
      ],
    },
    citationStandard:
      "Quantitative RCM claims cite the remit/ledger/contract source and the " +
      "period. Value projections cite a baseline plus a labelled planning range " +
      "and the haircut factors applied — never a single asserted ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no contract-variance data — frame underpayment as an industry pattern, not their measured number.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges.",
      "Vendor-reported outcomes are cited — mark as vendor claims pending validation.",
    ],
    inferenceLanguage: [
      "Across provider revenue cycles, denial rates typically run...",
      "Without your remit-level data, the industry pattern suggests...",
      "Peer systems at this scale commonly see...",
    ],
    flagWithoutEvidence: [
      "A specific dollar recovery or ROI for this tenant",
      "This tenant's actual denial or underpayment rate",
      "A claim that a specific payer is underpaying this tenant",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "denial rate breakdown / denials by payer or reason",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack denial dollars by reason code or payer to show where leakage concentrates.",
    },
    {
      questionPattern: "AR days trend / days in AR over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend AR days over monthly periods to show whether collections velocity is improving or deteriorating.",
    },
    {
      questionPattern: "cash impact of denial reduction / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current leakage to recoverable net revenue with haircuts.",
    },
    {
      questionPattern: "payer underpayment / expected-vs-actual variance",
      exhibitKind: "table",
      note: "Variance by contract/payer: expected, actual, variance, recoverable.",
    },
    {
      questionPattern: "revenue cycle KPI scorecard",
      exhibitKind: "table",
      note: "Net collection rate, AR days, denial rate, clean claim rate, DNFB vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "high",
    successDrivers: [
      "Front-end prevention (eligibility/auth/estimates) is funded, not just back-end rework",
      "Denials are measured back to the originating access point so root causes get fixed",
      "Payer contracts are digitized so expected reimbursement can be modeled",
      "Coding/CDI capacity and query workflows exist to absorb automation output",
    ],
    failureDrivers: [
      "Automation bolted onto back-end rework while front-end errors keep flowing",
      "Contract terms not digitized — variance detection has nothing to compare against",
      "Staff workflow unchanged, so predicted denials are flagged but not prevented",
      "Treating gross collection rate as success and missing true net yield",
    ],
    adoptionReadiness: "high",
    adoptionCurve:
      "Back-office RCM staff adopt readily because the work is measurable and the " +
      "incentives align with cash; denials and variance teams first, then front-end " +
      "access, then coding automation once HITL review is trusted.",
    roiClarity: "high",
    roiClarityBasis:
      "Revenue-cycle outcomes are directly attributable in remit/ledger data " +
      "(denials, AR days, recoveries), so ROI is unusually firm — the main haircut " +
      "is payer response eroding recoveries over time, not measurement difficulty.",
  },

  regulatoryFrame: {
    name: "No Surprises Act & Hospital Price Transparency",
    relevance:
      "The dominant patient-facing regulatory frame for revenue cycle: drives " +
      "good-faith estimates, balance-billing protection, and machine-readable " +
      "price transparency. HIPAA/HITECH and Medicare billing rules also apply " +
      "(see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude/opus-4-8 (W3.1 exemplar)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
