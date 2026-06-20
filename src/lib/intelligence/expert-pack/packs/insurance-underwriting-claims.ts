// Consilium expert — Insurance: Underwriting, Claims & Policy Operations (cross-cutting).
//
// A cross-cutting expert spanning the insurance value chain across P&C and life:
// underwriting (risk selection and pricing), claims (FNOL → adjudication →
// settlement, with fraud/SIU), policy administration, distribution, reserving,
// and the customer/agent experience that wraps them. Anchored to the realities
// carriers actually live by — not the AI marketing gloss:
//
//   - LOSS-RATIO DISCIPLINE IS THE GAME. The economics live in the combined
//     ratio (loss ratio + expense ratio). A point of loss ratio dwarfs almost
//     any expense-side automation win, so every claim of value is read against
//     whether it bends the loss ratio or merely the expense ratio.
//   - CLAIMS LEAKAGE IS THE LARGEST RECOVERABLE POOL. Indemnity paid above what
//     was actually owed (over-payment, missed subrogation, missed recovery,
//     weak reserving) is the dominant inefficiency — bigger than handling cost.
//   - ACTUARIAL & REGULATORY RIGOR BOUNDS AI IN UNDERWRITING. Rates are filed
//     and approved; models that drive price must be explainable, non-
//     discriminatory, and actuarially justified. Governance, not accuracy, is
//     usually the binding constraint on AI in pricing.
//   - FRAUD IS FAT-TAILED. A small share of claims carries a large share of
//     loss; fraud detection is a rare-event problem where recall, not headline
//     accuracy, is what protects the book.
//
// Product-aware, not product-locked: references the dominant categories of
// systems (policy admin, claims, underwriting workbench, rating/pricing) without
// assuming a single vendor.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const insuranceUnderwritingClaimsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.insurance-underwriting-claims",
    expertName: "Insurance Underwriting, Claims & Policy Operations Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "insurance-underwriting-claims",
    scopeNote:
      "Cross-cutting transformation of the insurance value chain across P&C and " +
      "life: underwriting (risk selection, triage, and pricing), claims " +
      "(FNOL → adjudication → settlement, subrogation, and fraud/SIU), policy " +
      "administration (new business, endorsements, renewals, billing), " +
      "distribution (agent/broker and direct), and the loss-ratio / combined-" +
      "ratio economics, reserving, and customer/agent experience that bind them. " +
      "The economics are governed by loss-ratio discipline and claims leakage; " +
      "actuarial and regulatory rate-filing rigor bounds AI in pricing, and " +
      "claims fraud is fat-tailed. Excludes investment/ALM, reinsurance treaty " +
      "structuring, and corporate finance (separate experts) — this expert owns " +
      "underwriting, claims, and policy operations throughput and economics.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "loss_ratio",
        name: "Loss ratio",
        definition:
          "Incurred losses (paid claims plus changes in reserves, with loss-" +
          "adjustment expense for the combined view) divided by earned premium " +
          "over the period.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 55,
          high: 75,
          basis:
            "P&C personal/commercial lines vary widely by line and accident " +
            "year; soft/hard market and cat exposure swing it materially, " +
            "operator experience",
          label: "planning-range",
        },
        dataSource:
          "Actuarial/finance: incurred losses (paid + reserve change) over " +
          "earned premium from the policy and claims systems",
        whyItMatters:
          "The dominant economic lever in insurance. A single point of loss " +
          "ratio almost always dwarfs an expense-side automation win, so every " +
          "value claim must be read against whether it bends loss ratio or only " +
          "expense ratio. This is the number, not handling cost.",
      },
      {
        key: "combined_ratio",
        name: "Combined ratio",
        definition:
          "Loss ratio plus expense ratio — the share of premium consumed by " +
          "claims and the cost of running the book. Below 100% means an " +
          "underwriting profit before investment income.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 92,
          high: 103,
          basis:
            "An underwriting-profitable book runs below 100; many lines and " +
            "years run above 100 and rely on investment income, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Finance: loss ratio + expense ratio from the GL, policy, and claims systems",
        whyItMatters:
          "The board-level scorecard for underwriting profitability. It frames " +
          "every initiative: loss-side moves (underwriting, claims leakage, " +
          "fraud) and expense-side moves (automation, STP) both land here, but " +
          "the loss side carries the larger lever.",
      },
      {
        key: "expense_ratio",
        name: "Expense ratio",
        definition:
          "Underwriting and operating expenses (acquisition, policy admin, " +
          "claims handling overhead, G&A) divided by premium.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 22,
          high: 35,
          basis:
            "Acquisition + operating expense as share of premium; direct " +
            "writers run leaner than agency-distributed, line- and channel-dependent",
          label: "planning-range",
        },
        dataSource:
          "Finance: underwriting/operating expense over premium from the GL",
        whyItMatters:
          "The expense side of the combined ratio and where most automation " +
          "value lands. Real but bounded — honest cases never let an expense-" +
          "ratio win masquerade as a loss-ratio improvement.",
      },
      {
        key: "claims_leakage_pct",
        name: "Claims leakage %",
        definition:
          "Share of claim payments above what should have been paid on accurate " +
          "adjudication — over-indemnity, missed subrogation/recovery, weak " +
          "reserving, and avoidable loss-adjustment expense.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 12,
          basis:
            "Leakage studies vary by line and method; commonly a mid-single-" +
            "digit to low-double-digit share of indemnity, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Claims audit / leakage study: closed-claim file review vs paid amounts",
        whyItMatters:
          "The largest recoverable pool in claims — bigger than handling cost. " +
          "Bending leakage feeds straight into loss ratio, which is why claims " +
          "transformation should be framed on indemnity accuracy, not just speed.",
      },
      {
        key: "claims_cycle_time",
        name: "Claims cycle time (FNOL to settlement)",
        definition:
          "Average elapsed time from first notice of loss to final settlement / " +
          "claim closure, by line and severity.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 45,
          basis:
            "Simple auto/property claims close in days; complex bodily-injury " +
            "and liability run weeks to months, severity-dependent, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Claims system timestamps: FNOL to settlement/closure by line and severity",
        whyItMatters:
          "The headline customer-experience and handling-cost metric — but it " +
          "must be read against leakage, because settling fast can mean over-" +
          "paying. Speed without indemnity accuracy is a false win.",
      },
      {
        key: "straight_through_uw_rate",
        name: "Straight-through underwriting rate",
        definition:
          "Share of new-business or renewal submissions auto-underwritten and " +
          "bound without manual underwriter touch, by line.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Simple personal lines reach high STP; complex commercial and life " +
            "with underwriting rules and evidence run lower, line-dependent",
          label: "planning-range",
        },
        dataSource:
          "Underwriting workbench / rating engine: auto-bound vs underwriter-touched",
        whyItMatters:
          "The direct expense-side automation lever for new business — every " +
          "point of STP is underwriter capacity freed for the complex, " +
          "judgment-heavy risks where selection actually moves loss ratio.",
      },
      {
        key: "quote_to_bind_ratio",
        name: "Quote-to-bind ratio",
        definition:
          "Share of quotes issued that convert to a bound, in-force policy, by " +
          "line and channel.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Highly channel- and line-dependent; comparison-rated personal " +
            "lines low, relationship commercial higher, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Distribution/policy system: bound policies over quotes issued by channel",
        whyItMatters:
          "The growth-side counterpart to underwriting discipline. Lifting it " +
          "must not come from under-pricing risk — a higher bind rate bought " +
          "with rate inadequacy shows up later as loss-ratio deterioration.",
      },
      {
        key: "fraud_detection_rate",
        name: "Fraud detection rate (recall)",
        definition:
          "Share of truly fraudulent claims (by count or dollars) that the " +
          "detection process refers to SIU before payment, versus total realized " +
          "plus detected fraud.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Fraud is fat-tailed and under-detected; reported detection of " +
            "true fraud is modest and typology-dependent, operator experience",
          label: "planning-range",
        },
        dataSource:
          "SIU outcomes: confirmed-fraud claims referred/caught vs missed (paid) fraud",
        whyItMatters:
          "Fraud is a fat-tailed, rare-event problem — a small share of claims " +
          "carries a large share of loss. Recall (catching true fraud) protects " +
          "the book; headline accuracy is meaningless when the base rate is low.",
      },
      {
        key: "siu_referral_precision",
        name: "SIU referral precision (hit rate)",
        definition:
          "Share of claims referred to the Special Investigations Unit that are " +
          "confirmed as fraud or materially adjusted, versus all referrals.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 50,
          basis:
            "Over-referral floods SIU with false positives; precision varies " +
            "by typology and model maturity, operator experience",
          label: "planning-range",
        },
        dataSource:
          "SIU case outcomes: confirmed/adjusted referrals over total referrals",
        whyItMatters:
          "The precision counterpart to detection recall. SIU capacity is " +
          "scarce, so low precision drowns investigators in noise; detection " +
          "lift is only honest when reported with its referral precision.",
      },
      {
        key: "reserve_adequacy",
        name: "Reserve adequacy (development ratio)",
        definition:
          "How well case and IBNR reserves anticipate ultimate losses — measured " +
          "as the ratio of ultimate developed losses to originally booked " +
          "reserves (≈1.0 is adequate; >1.0 is adverse development).",
        unit: "ratio",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 0.95,
          high: 1.05,
          basis:
            "Reserves should develop close to booked; persistent adverse or " +
            "favorable development signals mis-reserving, actuarial experience",
          label: "planning-range",
        },
        dataSource:
          "Actuarial reserve triangles: ultimate developed losses vs booked reserves",
        whyItMatters:
          "Reserves are an estimate that flows into loss ratio and earnings. " +
          "Persistent under-reserving flatters current results and creates " +
          "future adverse development; adequacy is a direct earnings-quality " +
          "and regulatory-solvency concern.",
      },
      {
        key: "average_claim_cost",
        name: "Average claim cost (severity)",
        definition:
          "Average total incurred cost per claim (indemnity plus loss-adjustment " +
          "expense), by line and peril.",
        unit: "USD / claim",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1500,
          high: 25000,
          basis:
            "Severity ranges enormously by line and peril — minor auto vs " +
            "bodily-injury or large-property; band is illustrative, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Claims system: total incurred per closed claim by line and peril",
        whyItMatters:
          "The severity driver behind loss ratio. Rising average cost can be " +
          "genuine inflation (social/medical) or a leakage/reserving symptom — " +
          "the diagnosis matters, because the response is different.",
      },
      {
        key: "customer_retention",
        name: "Customer retention (policy persistency)",
        definition:
          "Share of policies that renew / remain in force versus those eligible " +
          "to renew over the period, by line.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 92,
          basis:
            "Personal-lines retention commonly low-to-high 80s; relationship " +
            "commercial and life persistency higher, line- and channel-dependent",
          label: "planning-range",
        },
        dataSource:
          "Policy admin system: renewed/in-force policies over renewal-eligible",
        whyItMatters:
          "Acquisition is expensive and the loss ratio of seasoned books is " +
          "better understood, so persistency is a core profitability lever. But " +
          "retention bought by under-pricing renewals erodes loss ratio — it " +
          "must be read with rate adequacy.",
      },
    ],

    painThemes: [
      {
        key: "claims_leakage",
        name: "Claims leakage on indemnity",
        description:
          "Claims are over-paid versus what was actually owed — through over-" +
          "indemnity, missed subrogation and recovery, weak reserving, and " +
          "avoidable loss-adjustment expense — quietly inflating loss ratio more " +
          "than handling cost ever does.",
        detectionSignal:
          "Closed-claim audits surfacing over-payments, low subrogation recovery " +
          "rates, settlements above reserve, and severity rising faster than " +
          "underlying inflation.",
        diagnosticQuestion:
          "What does your closed-claim leakage study show as the share of " +
          "indemnity over-paid, and how much subrogation and recovery is being missed?",
      },
      {
        key: "loss_ratio_blind_automation",
        name: "Expense automation blind to loss ratio",
        description:
          "Transformation is sized on handling-cost and cycle-time savings " +
          "(expense ratio) while the far larger loss-ratio lever — selection, " +
          "leakage, fraud, reserving — goes unaddressed, so the combined ratio " +
          "barely moves.",
        detectionSignal:
          "Business cases dominated by FTE/cycle-time savings, STP rates rising " +
          "while loss ratio is flat or worsening, no loss-side initiatives in the roadmap.",
        diagnosticQuestion:
          "Of your AI roadmap value, how much bends loss ratio versus expense " +
          "ratio — and is the larger lever actually being worked?",
      },
      {
        key: "rate_filing_governance_drag",
        name: "Rate-filing & actuarial governance drag",
        description:
          "Models that influence price must be filed, actuarially justified, " +
          "explainable, and non-discriminatory. The filing-and-approval cycle and " +
          "fair-lending/unfair-discrimination scrutiny — not model accuracy — " +
          "usually gate deploying AI in underwriting and pricing.",
        detectionSignal:
          "Pricing models stalled in actuarial/legal review, regulators " +
          "questioning rating variables or proxy discrimination, inability to " +
          "explain a price to a regulator or policyholder.",
        diagnosticQuestion:
          "Can every variable in your pricing model be actuarially justified, " +
          "explained, and defended as non-discriminatory in a rate filing?",
      },
      {
        key: "fraud_fat_tail",
        name: "Fat-tailed fraud under-detection",
        description:
          "A small share of claims carries a large share of fraudulent loss, but " +
          "rules-based detection catches the obvious and misses organized and " +
          "emerging schemes, while over-referring floods a scarce SIU with noise.",
        detectionSignal:
          "Detection concentrated on simple typologies, SIU buried in low-" +
          "precision referrals, post-payment recoveries showing fraud that " +
          "slipped through, severity outliers unexplained.",
        diagnosticQuestion:
          "What is your fraud detection recall versus SIU referral precision, " +
          "and how much fraud are you finding only after you have paid it?",
      },
      {
        key: "legacy_policy_admin",
        name: "Legacy policy-admin & fragmented data",
        description:
          "Policy, underwriting, and claims data live in aging, line-siloed " +
          "policy-admin and claims systems, so a single customer/risk view is " +
          "reassembled manually, endorsements are slow, and AI is starved of " +
          "clean, joined data.",
        detectionSignal:
          "Multiple policy-admin platforms by line, manual re-keying across " +
          "underwriting and claims, slow endorsements/renewals, no unified " +
          "policyholder or risk view.",
        diagnosticQuestion:
          "Is there a single policyholder and risk view across underwriting, " +
          "policy admin, and claims, or is it reassembled by hand per line?",
      },
      {
        key: "underwriter_capacity_misallocation",
        name: "Underwriter capacity on the wrong risks",
        description:
          "Underwriters spend time clearing simple, low-judgment submissions that " +
          "should auto-bind, leaving too little capacity for the complex risks " +
          "where selection and pricing judgment genuinely move loss ratio.",
        detectionSignal:
          "Low straight-through rate on simple lines, underwriters re-keying and " +
          "chasing data, backlog on complex submissions, quote turnaround slipping.",
        diagnosticQuestion:
          "What share of underwriter time goes to submissions that could auto-" +
          "bind, and is the complex book getting the attention selection requires?",
      },
      {
        key: "reserving_lag_and_adverse_development",
        name: "Reserving lag & adverse development",
        description:
          "Case reserves are set late or inconsistently and IBNR is slow to " +
          "react, so booked reserves develop adversely, flattering current loss " +
          "ratio and surfacing as earnings hits and regulatory concern later.",
        detectionSignal:
          "Persistent adverse development in reserve triangles, settlements " +
          "above case reserve, inconsistent reserving across adjusters, " +
          "actuarial true-ups recurring.",
        diagnosticQuestion:
          "How does your reserve development behave over recent accident years, " +
          "and is case reserving consistent enough to trust the booked loss ratio?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "claims_leakage_detection",
        name: "Claims leakage & subrogation detection",
        valueMechanism:
          "Score open and closing claims for over-indemnity, missed subrogation/" +
          "recovery, and reserving inconsistency, and route flagged files to " +
          "specialists before payment — recovering the largest loss-side pool in " +
          "claims and feeding directly into loss ratio.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Claim file history with paid amounts and dispositions",
          "Closed-claim leakage-audit labels for tuning",
          "Subrogation/recovery outcomes and liability data",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Adjusters retain the indemnity and settlement decision — model flags, it does not adjust",
          "Recovery and subrogation referrals must respect statute-of-limitation and policy terms",
          "Flag reasons must be explainable so adjusters can act on and defend them",
        ],
        metricsMoved: [
          "claims_leakage_pct",
          "loss_ratio",
          "average_claim_cost",
          "reserve_adequacy",
        ],
      },
      {
        key: "fnol_claims_triage",
        name: "FNOL intake & claims triage automation",
        valueMechanism:
          "Capture first notice of loss across channels, extract structured " +
          "data, assess severity/complexity, and route simple claims to fast-" +
          "track or straight-through settlement while escalating complex ones — " +
          "cutting cycle time and handling cost without over-paying.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "FNOL intake (voice, photo, telematics, forms) and policy coverage data",
          "Historical claim severity/complexity outcomes for triage labels",
          "Coverage and policy-terms data to confirm what is owed",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Straight-through settlement is bounded to low-severity, clearly-covered claims",
          "Triage must not fast-track a claim into over-payment — leakage controls still apply",
          "Coverage determination errors are a bad-faith risk — confirm coverage before auto-settle",
        ],
        metricsMoved: [
          "claims_cycle_time",
          "expense_ratio",
          "average_claim_cost",
        ],
      },
      {
        key: "underwriting_triage_assist",
        name: "Underwriting triage & submission assist",
        valueMechanism:
          "Ingest and enrich submissions, auto-bind the simple and clearly " +
          "in-appetite risks, and assemble a decision-ready package for " +
          "underwriters on the complex ones — lifting straight-through rate and " +
          "redirecting scarce underwriter judgment to risks that move loss ratio.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Submission data and third-party/enrichment risk data",
          "Underwriting appetite, rules, and historical bind/decline outcomes",
          "Loss history and exposure data for the risk",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Auto-bind is bounded to in-appetite, well-understood risk; complex risks stay with underwriters",
          "Any variable influencing price must be filing-justifiable and non-discriminatory",
          "Enrichment data quality and bias must be governed — garbage in is a pricing and fairness risk",
        ],
        metricsMoved: [
          "straight_through_uw_rate",
          "quote_to_bind_ratio",
          "expense_ratio",
          "loss_ratio",
        ],
      },
      {
        key: "fraud_siu_scoring",
        name: "Fraud detection & SIU prioritization",
        valueMechanism:
          "Score claims with behavioral, network/graph, and anomaly signals to " +
          "surface organized and emerging fraud that rules miss, and rank SIU " +
          "referrals by genuine suspicion — lifting recall on a fat-tailed loss " +
          "while protecting scarce SIU capacity from false positives.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Claim, party, and provider history with confirmed-fraud labels",
          "Entity/network graph linking claimants, providers, and vehicles",
          "External fraud-typology and watchlist signals",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "A fraud score never denies a claim — SIU investigators confirm before action (bad-faith/UCSPA risk)",
          "Models must avoid proxy discrimination against protected classes",
          "Score reasons must be explainable enough to support an investigation and defend a decision",
        ],
        metricsMoved: [
          "fraud_detection_rate",
          "siu_referral_precision",
          "loss_ratio",
          "claims_leakage_pct",
        ],
      },
      {
        key: "pricing_risk_modeling",
        name: "AI-assisted pricing & risk modeling",
        valueMechanism:
          "Use richer signals and ML to sharpen risk segmentation and price " +
          "adequacy within an actuarially-governed, filed framework — improving " +
          "rate adequacy and selection so loss ratio improves without simply " +
          "shedding profitable business.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Exposure, loss, and premium history at policy/risk grain",
          "Approved rating structure and filing constraints",
          "Vetted third-party risk data with fairness governance",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Every rating variable must be actuarially justified, filed, and non-discriminatory",
          "Explainability is mandatory — a black-box price cannot clear filing or regulator scrutiny",
          "Governance/filing cadence, not accuracy, is the binding constraint on deployment",
        ],
        metricsMoved: [
          "loss_ratio",
          "combined_ratio",
          "quote_to_bind_ratio",
          "customer_retention",
        ],
      },
      {
        key: "reserving_copilot",
        name: "Reserving copilot & adverse-development early warning",
        valueMechanism:
          "Surface case-reserve inconsistency and early signals of adverse " +
          "development across the book for actuary and adjuster review — improving " +
          "reserve adequacy and earnings quality while the reserving decision " +
          "stays with the actuary.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Reserve triangles and claim-level reserve history",
          "Settlement-vs-reserve outcomes by adjuster and segment",
          "Severity and development patterns by line/accident year",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Reserve setting is an actuarial/financial-reporting control — the actuary owns the booked number",
          "Signals inform; they never auto-post a reserve change",
          "Methodology must be documented and defensible to auditors and regulators",
        ],
        metricsMoved: [
          "reserve_adequacy",
          "loss_ratio",
          "average_claim_cost",
        ],
      },
      {
        key: "policy_servicing_copilot",
        name: "Policy-servicing & agent copilot",
        valueMechanism:
          "A grounded copilot handles policy-admin servicing — endorsements, " +
          "billing questions, coverage explanations, renewal prep — and assists " +
          "agents/CSRs, deflecting routine contact and speeding servicing so " +
          "expense ratio falls and retention holds.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Policy, coverage, and billing data from the policy-admin system",
          "Product/coverage knowledge base and servicing procedures",
          "Entitlement data to scope answers to the policyholder/agent",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Must not surface another policyholder's data or make a coverage determination it cannot support",
          "Coverage and billing answers must be grounded in policy terms, never fabricated",
          "Sensitive servicing (cancellations, claims disputes) escalates to humans",
        ],
        metricsMoved: [
          "expense_ratio",
          "customer_retention",
          "claims_cycle_time",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "loss_side_value_model",
        name: "Loss-side-first value model (loss ratio over expense ratio)",
        description:
          "A value-sizing discipline that separates loss-ratio levers (selection, " +
          "leakage, fraud, reserving) from expense-ratio levers (automation, STP) " +
          "and sequences the larger loss-side prize first — so the combined ratio " +
          "actually moves rather than only handling cost.",
        boundary:
          "Owns value sizing, lever separation, and sequencing against the " +
          "combined ratio; does not execute claims or pricing decisions or own " +
          "the actuarial booking.",
        humanAccountabilityPoint: "Chief Underwriting Officer / Chief Actuary",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "claims_leakage_platform",
        name: "Claims leakage & recovery platform",
        description:
          "An overlay on the claims system that scores files for over-indemnity, " +
          "missed subrogation/recovery, and reserving inconsistency, routing " +
          "flagged claims to specialists before payment with explainable reasons.",
        boundary:
          "Owns leakage/recovery flagging and routing; does not make the " +
          "indemnity, settlement, or subrogation-pursuit decision — that stays " +
          "with adjusters and recovery specialists.",
        humanAccountabilityPoint: "VP Claims / Head of Claims Operations",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "governed_underwriting_workbench",
        name: "Governed straight-through underwriting workbench",
        description:
          "A submission-to-bind flow that ingests and enriches submissions, " +
          "auto-binds in-appetite simple risk under filed rating rules, and " +
          "assembles decision-ready packages for underwriters on complex risk — " +
          "all under actuarial and fair-pricing governance.",
        boundary:
          "Owns submission triage, enrichment, and straight-through binding " +
          "within filed rules; does not set rates or override actuarial pricing " +
          "and filing governance.",
        humanAccountabilityPoint: "Chief Underwriting Officer",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "fraud_siu_orchestration",
        name: "Fraud detection & SIU orchestration layer",
        description:
          "A scoring and case-orchestration layer combining behavioral, graph/" +
          "network, and anomaly signals to lift fraud recall and rank SIU " +
          "referrals by genuine suspicion, with investigator feedback closing the loop.",
        boundary:
          "Owns fraud scoring and referral prioritization; does not deny claims " +
          "or make the fraud determination — SIU investigators confirm and act.",
        humanAccountabilityPoint: "Head of SIU / Claims Fraud",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "actuarial_pricing_governance",
        name: "Actuarial pricing & rate-filing governance layer",
        description:
          "A governance layer over every model that influences price — " +
          "documentation, actuarial justification, fairness/bias testing, " +
          "explainability, and filing evidence — so AI in pricing can clear " +
          "regulatory approval rather than stall in review.",
        boundary:
          "Owns pricing-model governance, fairness testing, and filing evidence; " +
          "does not build the pricing models or own the final filed rate (the " +
          "chief actuary does).",
        humanAccountabilityPoint: "Chief Actuary / Chief Pricing Actuary",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Insurance value is governed by the combined ratio, and the two sides " +
        "are NOT equal. The loss side — risk selection, claims leakage, fraud, " +
        "and reserving — carries the larger lever, because a single point of " +
        "loss ratio typically dwarfs an expense-side automation win. The most " +
        "durable, largest pool is claims leakage: indemnity paid above what was " +
        "owed, missed subrogation/recovery, and weak reserving feed straight " +
        "into loss ratio. Fraud is fat-tailed — a small share of claims carries " +
        "a large share of loss — so detection value is sized on recall against " +
        "rare events, not headline accuracy. The expense side (FNOL/claims " +
        "triage, straight-through underwriting, servicing copilots) is real but " +
        "bounded, and must never be dressed up as a loss-ratio gain. The hardest " +
        "haircut is regulatory: AI that drives price only realizes value once it " +
        "clears actuarial justification, fairness testing, and rate filing — " +
        "governance, not accuracy, gates the pricing prize.",
      dominantHaircutFactors: [
        {
          factor: "Regulatory / rate-filing & fairness governance",
          rationale:
            "Any model influencing price must be filed, actuarially justified, " +
            "explainable, and non-discriminatory; opaque or unfiled pricing value " +
            "is discounted heavily because approval, not accuracy, gates it.",
          typicalHaircut: {
            low: 0.25,
            high: 0.55,
            basis:
              "Filing cycles and fair-pricing scrutiny on AI in underwriting/" +
              "pricing, operator experience",
            label: "planning-range",
          },
        },
        {
          factor: "Loss-side vs expense-side mislabeling",
          rationale:
            "Expense-ratio automation wins are real but bounded; when value is " +
            "sized as if expense gains were loss-ratio gains, the combined-ratio " +
            "impact is over-stated and must be discounted.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Observed gap between projected combined-ratio impact and realized " +
              "when value was expense-side only, operator experience",
            label: "planning-range",
          },
        },
        {
          factor: "Data fragmentation & legacy policy admin",
          rationale:
            "Leakage scoring, fraud graphs, and underwriting enrichment depend " +
            "on joined policy/claims/party data; siloed legacy systems and dirty " +
            "data cap realizable value.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Implementation experience where line-siloed policy-admin and " +
              "claims data throttled AI value",
            label: "planning-range",
          },
        },
        {
          factor: "Fraud adversary adaptation & rare-event uncertainty",
          rationale:
            "Fraudsters adapt to controls and the base rate is low, so detection " +
            "lift decays and avoided-loss estimates are counterfactual and " +
            "inherently uncertain.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed decay of fraud-detection performance as typologies shift, " +
              "operator experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Claims leakage reduction (loss-side)",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Reported reductions in identified leakage from scoring and " +
              "subrogation/recovery programs, operator experience",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in claims_leakage_pct flowing into loss_ratio",
        },
        {
          lever: "Loss-ratio improvement from selection + leakage + fraud",
          range: {
            low: 0.01,
            high: 0.04,
            basis:
              "Combined loss-side improvement expressed as loss-ratio points, " +
              "net of regulatory and adversary haircuts, operator experience",
            label: "planning-range",
          },
          measuredAs: "Absolute reduction in loss_ratio (loss-ratio points)",
        },
        {
          lever: "Expense-ratio reduction from automation / STP (expense-side)",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Run-rate handling-cost reduction in claims and underwriting ops " +
              "from triage, STP, and servicing copilots",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in operating cost feeding expense_ratio (not loss ratio)",
        },
      ],
      timeToValueBand:
        "Claims triage / servicing automation (expense-side): 2-3 quarters. " +
        "Claims leakage & fraud scoring (loss-side): 3-5 quarters including " +
        "labeling and SIU/claims integration. Straight-through underwriting: " +
        "2-4 quarters within filed rules. AI-assisted pricing: 4+ quarters, " +
        "gated by actuarial governance and rate filing.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Policy administration system",
          role:
            "System of record for policies, coverages, endorsements, renewals, " +
            "and billing across the policy lifecycle.",
          examples: [
            "Guidewire PolicyCenter",
            "Duck Creek Policy",
            "Sapiens / FINEOS (life) policy admin",
          ],
        },
        {
          name: "Claims management system",
          role:
            "System of record for FNOL, claim files, reserves, payments, and " +
            "settlement across the claim lifecycle.",
          examples: ["Guidewire ClaimCenter", "Duck Creek Claims", "Snapsheet"],
        },
        {
          name: "Underwriting workbench / rating engine",
          role:
            "Submission intake, risk enrichment, appetite/rules, rating, and " +
            "bind decisions for new business and renewals.",
          examples: [
            "Underwriting workbenches + rating/pricing engines (e.g. Earnix, Akur8 for pricing)",
          ],
        },
        {
          name: "Actuarial / reserving & pricing platform",
          role:
            "Reserve triangles, loss development, pricing models, and rate-filing " +
            "support under actuarial governance.",
          examples: ["Actuarial reserving + pricing toolsets and model platforms"],
        },
        {
          name: "Fraud / SIU detection platform",
          role:
            "Scores claims for fraud, manages SIU referrals, and supports " +
            "investigation case management.",
          examples: ["Claims-fraud scoring + SIU case management platforms"],
        },
        {
          name: "Distribution / agency & CRM",
          role:
            "Agent/broker and direct distribution, quoting, and policyholder " +
            "relationship management.",
          examples: ["Agency management systems + insurance CRM/quoting portals"],
        },
      ],
      roles: [
        {
          title: "Chief Underwriting Officer (CUO)",
          accountability:
            "Underwriting profitability, risk appetite/selection, and the loss " +
            "ratio of the book.",
        },
        {
          title: "Chief Actuary / Chief Pricing Actuary",
          accountability:
            "Pricing adequacy, reserving, rate filings, and the actuarial " +
            "justification and fairness of every model that influences price.",
        },
        {
          title: "VP Claims / Head of Claims Operations",
          accountability:
            "Claims cycle time, indemnity accuracy and leakage, settlement " +
            "quality, and claims handling cost.",
        },
        {
          title: "Head of SIU / Claims Fraud",
          accountability:
            "Fraud detection recall and SIU referral precision, investigation " +
            "outcomes, and recovered/avoided fraudulent loss.",
        },
        {
          title: "Head of Policy Operations / Servicing",
          accountability:
            "Policy-admin throughput, endorsement/renewal speed, billing, and " +
            "servicing cost and quality.",
        },
        {
          title: "Chief Distribution Officer",
          accountability:
            "Agent/broker and direct production, quote-to-bind conversion, and " +
            "persistency/retention.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Rate filing & actuarial soundness (state DOI / rate regulation)",
          relevance:
            "Rates and rating variables must be filed, actuarially justified, " +
            "and not excessive/inadequate/unfairly discriminatory — the binding " +
            "constraint on AI in pricing.",
        },
        {
          name: "Unfair claims-settlement practices / bad faith (UCSPA)",
          relevance:
            "Claims must be handled and settled fairly and in good faith; auto-" +
            "settlement, denials, and fraud actions carry bad-faith exposure if " +
            "not properly grounded.",
        },
        {
          name: "Unfair discrimination & fair-pricing / proxy-bias rules",
          relevance:
            "Pricing and underwriting models must not discriminate against " +
            "protected classes or use prohibited proxies — fairness testing is " +
            "mandatory for AI in underwriting.",
        },
        {
          name: "Solvency & reserve adequacy (statutory reserving / RBC)",
          relevance:
            "Reserves must be adequate and reported under statutory accounting; " +
            "under-reserving is a solvency and earnings-quality concern.",
        },
      ],
      canonicalTerms: [
        {
          term: "Loss ratio / combined ratio",
          definition:
            "Incurred losses over earned premium; combined ratio adds the " +
            "expense ratio — the core measures of underwriting profitability.",
        },
        {
          term: "Claims leakage",
          definition:
            "The difference between what was paid on a claim and what should " +
            "have been paid on accurate adjudication — the largest recoverable " +
            "loss-side pool.",
        },
        {
          term: "FNOL",
          definition:
            "First Notice of Loss — the initial report of a claim that starts " +
            "the claims lifecycle.",
        },
        {
          term: "IBNR / case reserves",
          definition:
            "Incurred-But-Not-Reported reserves and per-claim case reserves — " +
            "the estimates of ultimate loss that drive loss ratio and earnings.",
        },
        {
          term: "Subrogation",
          definition:
            "Recovery of paid losses from a responsible third party — a direct " +
            "offset to loss ratio when pursued, and a leakage source when missed.",
        },
        {
          term: "SIU",
          definition:
            "Special Investigations Unit — the team that investigates claims " +
            "referred as potentially fraudulent.",
        },
        {
          term: "Straight-through processing (STP)",
          definition:
            "A submission or claim that completes without manual touch — the " +
            "direct expense-side automation lever.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Claims leakage size and recoverable pool",
        authoritativeSource:
          "Closed-claim leakage study / claims audit joined to paid amounts and subrogation outcomes",
        whatGoodEvidenceLooksLike:
          "A file-level closed-claim review quantifying over-indemnity, missed " +
          "subrogation/recovery, and reserving variance by line over a trailing period.",
        weakEvidenceToReject:
          "A vendor-quoted 'reduces leakage by X%' with no tenant closed-claim baseline or audit.",
      },
      {
        claim: "Loss-ratio vs expense-ratio impact of an initiative",
        authoritativeSource:
          "Finance/actuarial: combined-ratio decomposition tying the initiative to loss or expense ratio",
        whatGoodEvidenceLooksLike:
          "An explicit split of projected value into loss-ratio points and " +
          "expense-ratio points, each tied to its lever and the GL.",
        weakEvidenceToReject:
          "A combined 'improves the combined ratio' claim with no loss-vs-" +
          "expense decomposition (usually expense-only dressed as loss).",
      },
      {
        claim: "Fraud detection recall and SIU precision",
        authoritativeSource:
          "SIU case outcomes joined to claim payments (confirmed fraud caught vs missed; referrals confirmed)",
        whatGoodEvidenceLooksLike:
          "Detection recall and referral precision reported together by typology " +
          "over a period, with post-payment fraud recoveries shown.",
        weakEvidenceToReject:
          "A headline fraud-detection 'accuracy' number with no recall, " +
          "precision, or base-rate context.",
      },
      {
        claim: "Reserve adequacy / development",
        authoritativeSource:
          "Actuarial reserve triangles and ultimate-loss development by accident year",
        whatGoodEvidenceLooksLike:
          "Development ratios over recent accident years showing whether booked " +
          "reserves develop adequately or adversely, with method documented.",
        weakEvidenceToReject:
          "An assertion that 'reserves are adequate' with no triangle, " +
          "development history, or actuarial basis.",
      },
      {
        claim: "Pricing-model defensibility (filing & fairness)",
        authoritativeSource:
          "Actuarial documentation, rate-filing record, and fairness/bias-test results for the model",
        whatGoodEvidenceLooksLike:
          "Each rating variable actuarially justified and filed, with " +
          "explainability and proxy-discrimination testing evidence.",
        weakEvidenceToReject:
          "A claim that an AI pricing model 'improves loss ratio' with no filing " +
          "status, explainability, or fairness testing.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Of your AI/transformation value, how much bends loss ratio versus expense ratio — and is the larger loss-side lever actually being worked?",
      "What does your closed-claim leakage study show as the share of indemnity over-paid, and how much subrogation and recovery is being missed?",
      "What is your fraud detection recall versus SIU referral precision, and how much fraud are you finding only after you have paid it?",
      "Can every variable in your pricing model be actuarially justified, explained, and defended as non-discriminatory in a rate filing?",
      "What is your straight-through underwriting rate by line, and is underwriter capacity going to the complex risks where selection moves loss ratio?",
      "How does your reserve development behave over recent accident years, and is case reserving consistent enough to trust the booked loss ratio?",
      "Is there a single policyholder and risk view across underwriting, policy admin, and claims, or is it reassembled by hand per line?",
      "What is your claims cycle time by severity, and is settlement speed being bought at the cost of indemnity accuracy (leakage)?",
    ],
    maturitySignals: [
      "Every initiative is sized explicitly as loss-ratio points versus expense-ratio points, not a blended 'combined-ratio' claim.",
      "Claims leakage is measured by closed-claim audit and worked as the largest loss-side pool, not just handling cost.",
      "Fraud is managed on recall and SIU precision together, with post-payment recoveries tracked, not a headline accuracy number.",
      "Every model that influences price is actuarially justified, filed, explainable, and fairness-tested before deployment.",
      "Reserve development is monitored by accident year and case reserving is consistent, so the booked loss ratio is trustworthy.",
    ],
    redFlags: [
      "The AI roadmap is dominated by handling-cost/cycle-time (expense) savings while loss ratio is flat or worsening.",
      "Settlement speed is improving while leakage and severity rise — fast claims are being over-paid.",
      "A pricing model 'improves loss ratio' but cannot be explained, filed, or shown to be non-discriminatory.",
      "Fraud is reported as 'accuracy' with no recall/precision, while post-payment recoveries reveal fraud that slipped through.",
      "Reserves develop adversely year after year, so the current booked loss ratio cannot be trusted.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Core policy & claims platforms (Guidewire, Duck Creek, Sapiens)",
        category: "Policy administration + claims management cores",
        switchingCost:
          "Extreme — the policy/claims core holds in-force books, configured " +
          "products, and years of claim history; replacement is a multi-year " +
          "platform migration rarely sourced standalone.",
        renewalDynamics:
          "Long enterprise/cloud-subscription terms; AI/automation increasingly " +
          "upsold as native modules at renewal.",
      },
      {
        vendorName: "Pricing & rating engines (Earnix, Akur8, ratabase-class)",
        category: "Rating, pricing optimization, and rate management",
        switchingCost:
          "High — rating logic is filed and embedded in quote-to-bind; switching " +
          "requires re-implementation and re-filing of rating structures.",
        renewalDynamics:
          "Subscription or premium-volume pricing; explainability and filing " +
          "support are the real levers as regulators scrutinize AI pricing.",
      },
      {
        vendorName: "Claims fraud / SIU & analytics vendors",
        category: "Fraud scoring + SIU case management + leakage analytics",
        switchingCost:
          "Moderate — integrates via claims feeds and is replaceable with " +
          "mapping effort, but models trained on tenant claim history add stickiness.",
        renewalDynamics:
          "Often per-claim or subscription pricing; favor outcome terms tied to " +
          "recall/precision and audit access.",
      },
      {
        vendorName: "Data / risk enrichment & third-party data providers",
        category: "Underwriting enrichment, telematics, and risk/loss data",
        switchingCost:
          "Moderate — feeds are replaceable via mapping, but coverage, accuracy, " +
          "and fairness/bias characteristics carry pricing and compliance risk.",
        renewalDynamics:
          "Per-query or subscription data pricing; coverage and fairness/bias " +
          "quality are the negotiation levers, not just unit price.",
      },
    ],
    switchingCosts:
      "The policy and claims cores are effectively non-switchable in isolation " +
      "because they hold the in-force book, configured products, and claim " +
      "history, and rating engines carry filed logic. The negotiable value " +
      "frontier is the AI overlay (leakage, fraud, triage, underwriting assist, " +
      "servicing copilots) and the underlying third-party data — where outcome " +
      "pricing, explainability, and audit rights are the real levers.",
    negotiationLevers: [
      "Outcome-based pricing tied to measured loss-side impact (leakage reduction, fraud recall at held precision) — not just expense savings",
      "Explainability, filing-support, and full audit-trail access as contractual requirements for regulatory defense",
      "Fairness/bias testing and proxy-discrimination guarantees built into data and pricing-model contracts",
      "Model and data portability / exit rights to avoid lock-in on tenant-trained models",
      "Unbundling third-party data subscriptions from platform fees to expose true unit cost and coverage value",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      loss_ratio_metric: [
        "incurred losses (paid + reserve change)",
        "earned premium basis",
        "line/accident-year segmentation",
      ],
      leakage_claim: [
        "closed-claim leakage study / audit",
        "paid-vs-owed file review",
        "subrogation/recovery outcomes",
      ],
      fraud_metric: [
        "SIU confirmed-fraud outcomes",
        "detection recall AND referral precision",
        "base-rate / typology context",
      ],
      reserving_claim: [
        "actuarial reserve triangles",
        "development by accident year",
        "documented reserving method",
      ],
      pricing_claim: [
        "actuarial justification per rating variable",
        "rate-filing status",
        "fairness / proxy-discrimination test results",
      ],
      value_projection: [
        "loss-ratio vs expense-ratio decomposition",
        "benchmark planning-range",
        "explicit haircut factors (regulatory/filing, adversary adaptation)",
      ],
    },
    citationStandard:
      "Quantitative insurance claims cite the policy/claims/actuarial source and " +
      "the period, and every value projection is DECOMPOSED into loss-ratio " +
      "points versus expense-ratio points — never a blended combined-ratio claim. " +
      "Loss-side claims cite their basis (leakage audit, SIU outcomes, reserve " +
      "triangles); fraud claims ALWAYS cite recall and precision together; " +
      "pricing claims cite filing status and fairness testing. Value projections " +
      "cite a baseline plus a labelled planning range and the haircut factors " +
      "applied — never a single asserted loss-reduction or ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not shared loss-ratio or leakage data — frame combined-ratio impact as an industry planning range, not their measured number.",
      "Value is sized on expense/handling savings — flag that loss-ratio impact is not yet evidenced and present the loss-vs-expense split explicitly.",
      "A pricing-model benefit is cited without filing status or fairness testing — mark regulatory/filing governance as the binding uncertainty.",
      "Fraud detection lift is cited without referral precision — present recall and precision as a trade-off, not a one-sided gain.",
    ],
    inferenceLanguage: [
      "Across P&C carriers at this scale, loss ratio typically runs... and claims leakage commonly sits at...",
      "Without your closed-claim leakage study, the industry pattern suggests the recoverable pool is...",
      "Subject to rate filing and fairness testing, an AI pricing model like this could improve loss ratio by...",
      "Treating this as an expense-side win and a planning range rather than your measured loss-ratio figure...",
    ],
    flagWithoutEvidence: [
      "A specific loss-ratio improvement or ROI for this tenant",
      "This tenant's actual leakage %, fraud recall, or reserve adequacy",
      "A claim that this tenant's pricing models are filing-compliant or non-discriminatory",
      "A claim that a specific claim is fraudulent or that a specific policy was over-paid",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "combined-ratio value decomposition / where does value land (loss vs expense)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current combined ratio through loss-side levers (selection, leakage, fraud, reserving) and expense-side levers (STP, triage) to target, with regulatory and adversary haircuts shown.",
    },
    {
      questionPattern:
        "claims leakage breakdown / where is indemnity leaking",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack leakage by source (over-indemnity, missed subrogation/recovery, reserving variance, avoidable LAE) to show the recoverable pool.",
    },
    {
      questionPattern:
        "fraud detection recall vs SIU referral precision / operating point",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Plot detection recall against SIU referral precision to show the operating point and the achievable frontier on a fat-tailed loss.",
    },
    {
      questionPattern: "reserve development by accident year / adequacy",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend reserve development ratios by accident year against the adequacy planning range to expose adverse development.",
    },
    {
      questionPattern: "insurance KPI scorecard",
      exhibitKind: "table",
      note: "Loss ratio, combined ratio, expense ratio, claims leakage %, claims cycle time, STP underwriting rate, quote-to-bind, fraud recall/precision, reserve adequacy, retention vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Value sized explicitly as loss-ratio points versus expense-ratio points, so the larger loss-side lever is actually worked",
      "Claims leakage attacked as the largest recoverable pool, with subrogation/recovery and reserving included — not just handling speed",
      "Actuarial and filing governance engaged early so AI pricing clears justification, fairness testing, and rate filing in parallel",
      "Fraud managed on recall AND SIU precision together, protecting scarce investigator capacity while lifting catch on a fat-tailed loss",
      "Joined policy/claims/party data and a single risk view so leakage, fraud, and underwriting models are not starved",
    ],
    failureDrivers: [
      "Chasing expense-ratio automation (cycle time, FTE) while loss ratio stays flat or worsens — the combined ratio barely moves",
      "Settling claims faster while over-paying them — speed bought at the cost of leakage and severity",
      "Deploying opaque pricing models that cannot clear filing, justification, or fairness scrutiny, so value never ships",
      "Treating fraud as an accuracy problem on a low base rate, flooding SIU with false positives or missing organized schemes",
      "Building on fragmented legacy policy-admin data, starving the loss-side models that carry the real prize",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Expense-side automation (FNOL/claims triage, straight-through " +
      "underwriting, servicing copilots) adopts first and fastest because the " +
      "work is measurable and the controls are lighter. Loss-side bets (leakage, " +
      "fraud, reserving) follow as data joins and trust builds. AI in pricing is " +
      "deliberately last and slowest — gated by the chief actuary, rate filing, " +
      "and fair-pricing scrutiny — so the largest lever scales only after " +
      "governance comfort.",
    roiClarity: "medium",
    roiClarityBasis:
      "Expense-side ROI is firm because handling cost, cycle time, and STP are " +
      "directly measurable. Loss-side ROI is softer: leakage recovery is " +
      "auditable but fraud avoidance is counterfactual on a fat-tailed " +
      "distribution, selection benefits take accident years to emerge, and the " +
      "whole pricing case is discounted by how long actuarial governance and " +
      "rate filing take to let a model ship — which is why the evidence and " +
      "hedge rules force a loss-vs-expense decomposition.",
  },

  regulatoryFrame: {
    name: "Rate filing & actuarial soundness, unfair-discrimination, UCSPA bad-faith & statutory reserving",
    relevance:
      "The dominant regulatory frame for insurance operations: rates and rating " +
      "variables must be filed and actuarially justified and may not be unfairly " +
      "discriminatory — making actuarial/filing governance and fairness, not raw " +
      "model accuracy, the binding constraint on AI in pricing. Claims handling " +
      "is bound by unfair-claims-settlement / bad-faith rules (no ungrounded " +
      "auto-settlement or denial), and reserves must be adequate under statutory " +
      "accounting (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (industries)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
