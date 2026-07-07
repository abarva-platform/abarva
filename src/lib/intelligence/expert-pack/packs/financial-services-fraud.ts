// Consilium expert — Financial Services Fraud & Financial Crime (FinCrime).
//
// Wave-3 industry-function ExpertPack v2. Domain: bank-side fraud and financial
// crime — fraud detection (card/ACH/wire/check/digital), AML/KYC, transaction
// monitoring, sanctions/watchlist screening, case management/investigations,
// and model risk for FinCrime models. Anchored to the realities operators
// actually live: false-positive rates that drown investigators, SR 11-7 model
// risk governance over every score, and regulators who scrutinize
// explainability harder than they scrutinize raw detection lift.
//
// Product-aware, not product-locked: references the dominant categories of
// systems (TM platforms, screening engines, case managers, fraud orchestration)
// without assuming a single vendor.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const fsFinancialCrimeExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.financial-services-banking.fraud-financial-crime",
    expertName: "Financial Services Fraud & Financial Crime Expert",
    kind: "industry-function",
    industry: "financial_services_banking",
    functionKey: "fraud-financial-crime",
    scopeNote:
      "Bank-side fraud and financial crime: real-time fraud detection across " +
      "card, ACH, wire, check, and digital channels; AML/KYC (CDD/EDD, " +
      "onboarding, beneficial ownership); transaction monitoring and SAR " +
      "filing; sanctions/PEP/watchlist screening; case management and " +
      "investigations; and the SR 11-7 model-risk governance that sits over " +
      "every FinCrime model. Excludes credit risk/underwriting, market risk, " +
      "and core payments processing (separate experts).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "fraud_loss_bps",
        name: "Net fraud loss (bps of volume)",
        definition:
          "Net fraud losses (gross losses minus recoveries) as basis points " +
          "of total transaction or payment volume, by channel.",
        unit: "bps",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 12,
          basis:
            "Card/payments peer ranges vary widely by channel and product; " +
            "card-not-present and faster-payments rails run hotter, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Fraud loss ledger (gross losses + recoveries) over channel volume",
        whyItMatters:
          "The headline outcome the board cares about — but it must be read " +
          "against false-positive cost, because losses can be driven to zero by " +
          "blocking good customers. The trade-off, not the number alone, is the story.",
      },
      {
        key: "false_positive_rate",
        name: "False-positive rate",
        definition:
          "Share of alerts/declines that turn out to be legitimate activity, " +
          "by count. The flip side of detection.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 90,
          high: 98,
          basis:
            "AML transaction-monitoring alerts are notoriously 90%+ false " +
            "positive; card-fraud declines lower but still material; published " +
            "surveys + operator experience",
          label: "planning-range",
        },
        dataSource:
          "Alert/decline dispositions: legitimate vs confirmed-fraud outcomes",
        whyItMatters:
          "The defining pain of the function. In AML, 90-98% of alerts close " +
          "with no action — investigators drown, and the marginal true positive " +
          "is buried. Every detection claim is meaningless without this denominator.",
      },
      {
        key: "alert_to_sar_rate",
        name: "Alert-to-SAR conversion rate",
        definition:
          "Share of AML transaction-monitoring alerts that ultimately result " +
          "in a filed Suspicious Activity Report.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 2,
          high: 10,
          basis:
            "Industry surveys; very low conversion signals over-alerting, very " +
            "high may signal under-tuned thresholds missing activity",
          label: "planning-range",
        },
        dataSource: "TM alert outcomes joined to filed SAR records",
        whyItMatters:
          "Direction-of-good is in-range, not lower: too low means the bank " +
          "burns investigators on noise; too high can mean thresholds are set so " +
          "tight that genuinely suspicious activity is escaping detection.",
      },
      {
        key: "investigator_caseload",
        name: "Investigator caseload (cases per FTE)",
        definition:
          "Average number of open cases/alerts assigned per investigator FTE " +
          "over a period.",
        unit: "cases/FTE",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Varies by case complexity and alert type; operator experience and " +
            "staffing benchmarks",
          label: "planning-range",
        },
        dataSource: "Case management system: open cases / active investigator FTEs",
        whyItMatters:
          "The capacity constraint that turns a tuning problem into a staffing " +
          "crisis. Backlogs here create regulatory exposure (untimely SARs) and " +
          "are the first thing examiners probe.",
      },
      {
        key: "detection_rate",
        name: "Fraud detection rate (recall)",
        definition:
          "Share of true fraud (by dollars or count) that the detection system " +
          "catches before loss, vs total realized + detected fraud.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Strongly channel- and typology-dependent; mature card programs run " +
            "high, emerging scam/APP fraud much lower, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Confirmed-fraud outcomes labeled as caught (alerted/blocked) vs missed",
        whyItMatters:
          "The other half of the precision/recall trade-off. Detection rate is " +
          "only honest when reported alongside false_positive_rate — lift on one " +
          "at the cost of the other is not a win.",
      },
      {
        key: "time_to_disposition",
        name: "Time to disposition (alert/case)",
        definition:
          "Average elapsed time from alert generation (or case open) to final " +
          "disposition decision.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "AML case cycle times; SAR filing deadlines (30 days from detection, " +
            "+30 with no identified subject) bound the upper end",
          label: "planning-range",
        },
        dataSource: "Case management timestamps: alert/open to disposition",
        whyItMatters:
          "Slow disposition both inflates caseload and risks blowing statutory " +
          "SAR-filing deadlines — a direct examination and enforcement trigger.",
      },
      {
        key: "sanctions_hit_rate",
        name: "Sanctions screening hit rate",
        definition:
          "Share of screened names/transactions that generate a potential " +
          "match requiring manual review (before true-match adjudication).",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 5,
          basis:
            "Fuzzy-matching thresholds drive hit volume; the vast majority are " +
            "false matches resolved at L1, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Screening engine: potential matches vs total names/payments screened",
        whyItMatters:
          "Sanctions screening is zero-tolerance, so banks set fuzzy thresholds " +
          "loose — generating a flood of false matches. The hit rate sizes the " +
          "L1 review burden that no bank can risk under-staffing.",
      },
      {
        key: "kyc_onboarding_time",
        name: "KYC onboarding time",
        definition:
          "Average elapsed time from application to fully verified, " +
          "CDD-complete account open.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 10,
          basis:
            "Retail digital onboarding is fast; commercial/EDD with beneficial " +
            "ownership runs days to weeks, operator experience",
          label: "planning-range",
        },
        dataSource: "Onboarding workflow timestamps: application to CDD-complete",
        whyItMatters:
          "The friction tax FinCrime imposes on growth. Long onboarding drives " +
          "abandonment; the function is judged on protecting the bank WITHOUT " +
          "strangling acquisition.",
      },
      {
        key: "model_validation_coverage",
        name: "Model validation coverage",
        definition:
          "Share of in-scope FinCrime models with current, independent " +
          "validation per SR 11-7 (not expired, not overdue).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 100,
          basis:
            "Regulatory expectation trends toward full coverage; gaps are direct " +
            "MRM findings, operator experience",
          label: "planning-range",
        },
        dataSource: "Model inventory + validation status (MRM/model-risk register)",
        whyItMatters:
          "Under SR 11-7 every model is governed. Coverage gaps are an automatic " +
          "exam finding and the first thing that blocks deploying a new AI model — " +
          "governance, not accuracy, is usually the binding constraint.",
      },
      {
        key: "chargeback_rate",
        name: "Chargeback rate",
        definition:
          "Share of card transactions (by count or value) that result in a " +
          "chargeback, including fraud and dispute chargebacks.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.05,
          high: 0.9,
          basis:
            "Card-network monitoring thresholds (e.g. excessive-program limits " +
            "near ~0.9-1.0%); merchant/issuer mix dependent, operator experience",
          label: "planning-range",
        },
        dataSource: "Card processor / network chargeback records over volume",
        whyItMatters:
          "A direct loss and dispute-cost driver, and breaching network " +
          "monitoring thresholds triggers fines and program scrutiny — a hard " +
          "external ceiling on tolerable fraud leakage.",
      },
      {
        key: "first_party_fraud_share",
        name: "First-party / scam (APP) fraud share",
        definition:
          "Share of fraud losses attributable to first-party fraud and " +
          "authorized-push-payment (scam) fraud where the customer was deceived " +
          "into authorizing.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 15,
          high: 50,
          basis:
            "Scam/APP fraud is the fastest-growing category and hardest to " +
            "detect because the customer authorizes it, industry reporting",
          label: "planning-range",
        },
        dataSource:
          "Fraud loss classification by typology (third-party vs first-party/scam)",
        whyItMatters:
          "Traditional detection assumes an unauthorized actor; scam fraud " +
          "breaks that assumption. A rising share here means the current model " +
          "stack is structurally blind to where losses are migrating.",
      },
    ],

    painThemes: [
      {
        key: "false_positive_flood",
        name: "False-positive flood drowning investigators",
        description:
          "Transaction-monitoring and screening systems generate enormous alert " +
          "volume, 90%+ of which is noise. Investigators spend their day clearing " +
          "false positives, and the marginal true positive gets the least attention.",
        detectionSignal:
          "Alert-to-SAR conversion in low single digits, caseload backlogs, " +
          "overtime in investigations, alerts auto-aging without review.",
        diagnosticQuestion:
          "What is your alert-to-SAR conversion rate, and how many alerts per " +
          "investigator FTE close with no action taken?",
      },
      {
        key: "scam_app_fraud_blindspot",
        name: "Scam / authorized-push-payment blind spot",
        description:
          "Detection models built for unauthorized third-party fraud cannot see " +
          "fraud the customer was manipulated into authorizing, so losses migrate " +
          "to scam typologies the existing stack does not catch.",
        detectionSignal:
          "Rising first-party/scam share of losses, faster-payments rail losses " +
          "climbing, customer-reported 'I sent it myself' disputes growing.",
        diagnosticQuestion:
          "What share of your fraud losses is now scam/APP fraud, and does your " +
          "model stack score for customer manipulation, not just account takeover?",
      },
      {
        key: "model_risk_governance_drag",
        name: "Model-risk governance drag (SR 11-7)",
        description:
          "Every FinCrime model must be inventoried, documented, independently " +
          "validated, and monitored. The governance cycle — not model accuracy — " +
          "is usually what gates deploying a better model, especially opaque AI.",
        detectionSignal:
          "Model validation backlog, models running past validation expiry, new " +
          "model deployments stalled in MRM review, examiners citing model docs.",
        diagnosticQuestion:
          "What is your model validation coverage, and how long does it take a " +
          "new FinCrime model to clear validation and reach production?",
      },
      {
        key: "explainability_gap",
        name: "Explainability gap with regulators",
        description:
          "Regulators and validators require that a decision to file (or not " +
          "file) a SAR, or to decline a transaction, be explainable. Black-box " +
          "models that lift detection but cannot justify a specific decision " +
          "struggle to clear validation and supervisory review.",
        detectionSignal:
          "Validation findings on interpretability, investigators unable to " +
          "articulate why an alert fired, reliance on vendor 'score' with no reason codes.",
        diagnosticQuestion:
          "For any given alert or decline, can an investigator and a validator " +
          "see the specific reasons, or only an opaque risk score?",
      },
      {
        key: "fragmented_kyc_data",
        name: "Fragmented KYC / customer-risk data",
        description:
          "Customer, beneficial-ownership, and transaction data are scattered " +
          "across onboarding, core, and channel systems, so customer risk rating " +
          "and EDD are slow, inconsistent, and re-keyed.",
        detectionSignal:
          "Long onboarding times, periodic-review backlogs, duplicate KYC across " +
          "lines of business, manual beneficial-ownership lookups.",
        diagnosticQuestion:
          "Is customer risk rating computed from a single customer view, or " +
          "reassembled manually per review across multiple systems?",
      },
      {
        key: "sanctions_screening_overmatch",
        name: "Sanctions screening over-matching",
        description:
          "Because sanctions exposure is zero-tolerance, fuzzy-match thresholds " +
          "are set loose, producing huge volumes of false matches that L1 teams " +
          "must clear name-by-name — costly, and a fatigue risk that can let a " +
          "true match slip.",
        detectionSignal:
          "High screening hit rate with very low true-match rate, large L1 review " +
          "queues, repeated clearing of the same recurring false matches.",
        diagnosticQuestion:
          "What is your screening hit rate versus true-match rate, and how much " +
          "of your L1 effort is re-clearing the same recurring false positives?",
      },
      {
        key: "siloed_fraud_aml",
        name: "Siloed fraud and AML operations (FRAML gap)",
        description:
          "Fraud and AML run as separate systems, teams, and data — so a mule " +
          "account flagged by fraud and the laundering it enables in AML are never " +
          "connected, and effort is duplicated.",
        detectionSignal:
          "Separate fraud and AML alert queues with no shared entity view, the " +
          "same accounts investigated twice, no cross-typology link analysis.",
        diagnosticQuestion:
          "Do fraud and AML share a common entity/customer view, or investigate " +
          "the same accounts independently with no shared signal?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "alert_triage_scoring",
        name: "AI alert triage & prioritization",
        valueMechanism:
          "Score and rank TM/screening alerts by genuine suspicion so " +
          "investigators work the highest-risk first and provably low-risk alerts " +
          "are auto-deprioritized — converting wasted false-positive effort into " +
          "throughput without raising missed-SAR risk.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Historical alert dispositions (SAR vs no-action outcomes)",
          "Customer risk rating and KYC profile",
          "Transaction and behavioral history feeding the alert",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Auto-deprioritization must never auto-close — every alert stays reviewable to satisfy examiners",
          "Score must carry reason codes so investigators and validators can see why",
          "Threshold changes are model changes under SR 11-7 — require validation",
        ],
        metricsMoved: [
          "false_positive_rate",
          "alert_to_sar_rate",
          "investigator_caseload",
          "time_to_disposition",
        ],
      },
      {
        key: "behavioral_fraud_detection",
        name: "Behavioral / graph-based fraud detection",
        valueMechanism:
          "Use behavioral biometrics, device, and graph/network signals to catch " +
          "account takeover, mule networks, and emerging typologies that rules " +
          "miss — lifting detection while holding false positives down.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Real-time transaction and session/device telemetry",
          "Entity graph linking accounts, devices, and counterparties",
          "Labeled confirmed-fraud outcomes for supervised tuning",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Real-time blocking false positives directly harm good customers — calibrate decline thresholds carefully",
          "Behavioral data raises privacy/consent obligations",
          "Graph inferences must be explainable enough to justify a decline",
        ],
        metricsMoved: [
          "detection_rate",
          "false_positive_rate",
          "fraud_loss_bps",
          "first_party_fraud_share",
        ],
      },
      {
        key: "scam_app_detection",
        name: "Scam / APP-fraud detection",
        valueMechanism:
          "Score outbound payments for signs the customer is being manipulated " +
          "(unusual payee, social-engineering patterns, session anomalies) and " +
          "intervene with friction or warnings — addressing the loss category " +
          "traditional unauthorized-fraud models are blind to.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Outbound payment and payee history",
          "Session/behavioral signals during the payment",
          "Scam typology labels and victim-reported outcomes",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Customer authorized the payment, so blocking outright is contentious — warn/friction first",
          "Liability and reimbursement rules for scam fraud are evolving — align with policy/legal",
          "Over-warning trains customers to dismiss alerts",
        ],
        metricsMoved: [
          "first_party_fraud_share",
          "fraud_loss_bps",
          "detection_rate",
        ],
      },
      {
        key: "screening_match_resolution",
        name: "AI sanctions match resolution (L1 assist)",
        valueMechanism:
          "Use entity-resolution and context models to auto-clear obvious false " +
          "matches and pre-package genuine ones for L2 — cutting the L1 burden " +
          "from loose fuzzy thresholds without lowering screening sensitivity.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Screening engine match candidates and prior dispositions",
          "Watchlist/PEP reference data with identifiers",
          "Customer master with strong identity attributes",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Sanctions is zero-tolerance — auto-clear only on high-confidence, fully-evidenced non-matches",
          "Every auto-clear needs an audit trail and reason for examiners",
          "Model cannot lower the fuzzy threshold; it resolves matches, it does not screen",
        ],
        metricsMoved: ["sanctions_hit_rate", "time_to_disposition", "investigator_caseload"],
      },
      {
        key: "perpetual_kyc",
        name: "Perpetual KYC & dynamic customer risk rating",
        valueMechanism:
          "Continuously update customer risk from behavior, news, and network " +
          "signals (instead of periodic reviews), and automate document/identity " +
          "checks at onboarding — speeding onboarding and focusing EDD where risk " +
          "actually rises.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Unified customer view (KYC, beneficial ownership, transactions)",
          "Adverse-media and watchlist feeds",
          "Behavioral and relationship signals over time",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Risk-rating logic is a model under SR 11-7 — must be validated and explainable",
          "Adverse-media matching is error-prone — confirm before downgrading a customer",
          "Onboarding automation must preserve CDD/beneficial-ownership rigor",
        ],
        metricsMoved: [
          "kyc_onboarding_time",
          "false_positive_rate",
          "alert_to_sar_rate",
        ],
      },
      {
        key: "investigation_copilot",
        name: "Investigation copilot & SAR narrative drafting",
        valueMechanism:
          "Assemble case context across systems and draft the SAR narrative for " +
          "investigator review — cutting disposition time and improving narrative " +
          "consistency while the investigator keeps the filing decision.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Case management records and linked transactions",
          "Customer/KYC context and prior cases",
          "SAR narrative templates and historical filings",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "The decision to file and the narrative's accuracy remain the investigator's — no auto-filing",
          "Generated narratives must be grounded in case evidence, never fabricated facts",
          "Drafting tool must not leak case detail across customers/tenants",
        ],
        metricsMoved: ["time_to_disposition", "investigator_caseload"],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "risk_scored_alert_queue",
        name: "Risk-scored alert triage queue",
        description:
          "An overlay on TM/screening that scores every alert for genuine " +
          "suspicion, ranks the queue, and routes by risk — with low-risk alerts " +
          "deprioritized (never auto-closed) and reason codes attached for review.",
        boundary:
          "Owns alert prioritization and routing; does NOT change detection " +
          "thresholds or auto-dispose alerts — disposition stays with investigators.",
        humanAccountabilityPoint: "BSA/AML Officer",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "unified_framl_platform",
        name: "Unified fraud + AML (FRAML) entity platform",
        description:
          "A shared entity/customer view and signal layer across fraud and AML so " +
          "a mule flagged by fraud and the laundering it enables are connected, " +
          "and detection/investigation are not duplicated.",
        boundary:
          "Owns the shared entity graph and cross-domain signals; does not " +
          "replace channel-specific real-time fraud decisioning.",
        humanAccountabilityPoint: "Head of Financial Crime",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "realtime_fraud_orchestration",
        name: "Real-time fraud decisioning & orchestration",
        description:
          "A low-latency layer that combines rules, ML scores, device, and " +
          "behavioral signals to approve, challenge (step-up), or decline a " +
          "transaction in real time, with case feedback closing the loop.",
        boundary:
          "Owns the real-time approve/challenge/decline decision; does not own " +
          "back-office AML monitoring or SAR filing.",
        humanAccountabilityPoint: "Head of Fraud Operations",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "model_risk_governance_layer",
        name: "FinCrime model-risk governance layer",
        description:
          "A model inventory, documentation, independent validation, and ongoing " +
          "monitoring workflow over every FinCrime model, with explainability and " +
          "audit evidence packaged for examiners per SR 11-7.",
        boundary:
          "Owns model governance, validation status, and audit evidence; does " +
          "not build the detection models themselves.",
        humanAccountabilityPoint: "Head of Model Risk Management",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "perpetual_kyc_engine",
        name: "Perpetual KYC & dynamic risk-rating engine",
        description:
          "Continuously recomputes customer risk from behavior, adverse media, " +
          "and network signals, triggering EDD only when risk materially changes " +
          "instead of fixed periodic-review cycles.",
        boundary:
          "Owns customer risk rating and review triggering; does not make the " +
          "final EDD or exit decision — that routes to investigators/relationship owners.",
        humanAccountabilityPoint: "Head of KYC / CDD",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "FinCrime value is a trade-off curve, not a single lever: the prize is " +
        "moving the precision/recall frontier — fewer false positives at equal " +
        "or better detection — which simultaneously cuts investigator cost, " +
        "speeds disposition, and protects good-customer experience. Durable wins " +
        "come from triage and unified entity data (efficiency that is safe under " +
        "exam), with detection lift (loss reduction) as the upside that is " +
        "always discounted for adversary adaptation and model-governance lag.",
      dominantHaircutFactors: [
        {
          factor: "Regulatory / model-governance lag",
          rationale:
            "A better model only realizes value once it clears SR 11-7 " +
            "validation and supervisory comfort; opaque models are discounted " +
            "heavily because governance, not accuracy, gates deployment.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Validation cycles and supervisory caution on AI in FinCrime, operator experience",
            label: "planning-range",
          },
        },
        {
          factor: "Adversary adaptation",
          rationale:
            "Fraudsters and launderers actively probe and adapt to controls, so " +
            "detection lift erodes over time and forward value must be discounted.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis: "Observed decay of detection performance as typologies shift",
            label: "planning-range",
          },
        },
        {
          factor: "Data quality & unification",
          rationale:
            "Triage, entity resolution, and risk rating are only as good as the " +
            "unified customer/transaction data; fragmentation caps realizable value.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis: "Implementation experience where KYC/transaction data was siloed",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "False-positive reduction (alert triage)",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported reductions in reviewable false positives from AI triage " +
              "at equal detection",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in false_positive_rate at held detection",
        },
        {
          lever: "Investigator capacity released",
          range: {
            low: 0.15,
            high: 0.35,
            basis: "Effort reclaimed from auto-cleared false positives and copilot drafting",
            label: "planning-range",
          },
          measuredAs: "Fraction of investigator hours redirected to true positives",
        },
        {
          lever: "Net fraud loss reduction",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Loss reduction from improved detection, net of adversary adaptation",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in fraud_loss_bps",
        },
      ],
      timeToValueBand:
        "Alert triage / efficiency: 2-3 quarters (gated by validation). " +
        "Real-time detection lift: 2-4 quarters including tuning and decline " +
        "calibration. Perpetual KYC and FRAML unification: 4+ quarters given " +
        "data integration and governance.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Transaction monitoring (TM) platform",
          role: "System of record for AML alerts, scenarios/rules, and dispositions.",
          examples: [
            "AML transaction-monitoring engines (scenario + behavioral)",
          ],
        },
        {
          name: "Sanctions / watchlist screening engine",
          role: "Screens names and payments against sanctions, PEP, and watchlists.",
          examples: ["Real-time payment filtering + customer/name screening"],
        },
        {
          name: "Case management / investigations",
          role: "System of record for cases, evidence, dispositions, and SAR filing.",
          examples: ["FinCrime case managers with SAR e-filing"],
        },
        {
          name: "Fraud detection / decisioning platform",
          role: "Real-time and near-real-time scoring and approve/challenge/decline decisions.",
          examples: ["Fraud orchestration + ML scoring across card/ACH/wire/digital"],
        },
        {
          name: "KYC / CDD onboarding & customer master",
          role: "Identity verification, beneficial ownership, and customer risk rating.",
          examples: ["Onboarding/CDD workflow + customer risk-rating store"],
        },
        {
          name: "Model risk inventory (MRM)",
          role: "Inventory, documentation, and validation status for every FinCrime model.",
          examples: ["Model-risk register aligned to SR 11-7"],
        },
      ],
      roles: [
        {
          title: "Chief Compliance Officer / BSA Officer",
          accountability:
            "BSA/AML program effectiveness, SAR filing, and regulatory standing.",
        },
        {
          title: "Head of Financial Crime",
          accountability:
            "End-to-end FinCrime strategy across fraud, AML, sanctions, and KYC.",
        },
        {
          title: "Head of Fraud Operations",
          accountability:
            "Real-time fraud loss, false-positive/decline rates, and customer impact.",
        },
        {
          title: "Head of Model Risk Management",
          accountability:
            "SR 11-7 model inventory, independent validation, and monitoring.",
        },
        {
          title: "Head of KYC / CDD",
          accountability:
            "Onboarding integrity, customer risk rating, and periodic review.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Bank Secrecy Act (BSA) / AML program rules",
          relevance:
            "Mandates the AML program, transaction monitoring, and SAR/CTR filing obligations.",
        },
        {
          name: "OFAC sanctions",
          relevance:
            "Zero-tolerance screening of customers and payments against sanctions lists.",
        },
        {
          name: "FinCEN CDD / beneficial ownership rule",
          relevance:
            "Defines customer due diligence and beneficial-ownership identification at onboarding.",
        },
        {
          name: "SR 11-7 (model risk management)",
          relevance:
            "Governs every FinCrime model: inventory, documentation, independent validation, monitoring — the binding constraint on deploying AI models.",
        },
      ],
      canonicalTerms: [
        {
          term: "SAR / CTR",
          definition:
            "Suspicious Activity Report / Currency Transaction Report — the regulatory filings AML investigations produce.",
        },
        {
          term: "KYC / CDD / EDD",
          definition:
            "Know Your Customer / Customer Due Diligence / Enhanced Due Diligence — the onboarding and ongoing risk-assessment ladder.",
        },
        {
          term: "False positive",
          definition:
            "An alert or decline that turns out to be legitimate activity — the dominant cost in AML and screening.",
        },
        {
          term: "APP / scam fraud",
          definition:
            "Authorized Push Payment fraud — the customer is manipulated into authorizing the payment, defeating unauthorized-fraud detection.",
        },
        {
          term: "FRAML",
          definition:
            "Convergence of Fraud and AML into a shared data, signal, and operations model.",
        },
        {
          term: "PEP",
          definition:
            "Politically Exposed Person — a higher-risk customer category requiring enhanced screening and due diligence.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "False-positive rate and investigator burden",
        authoritativeSource:
          "Alert/decline dispositions from the TM/screening and case systems",
        whatGoodEvidenceLooksLike:
          "Alert outcomes (SAR vs no-action) over a trailing period, with caseload per FTE and aging, by alert type.",
        weakEvidenceToReject:
          "A vendor-quoted 'reduces false positives by X%' with no tenant alert baseline.",
      },
      {
        claim: "Fraud detection vs loss trade-off",
        authoritativeSource:
          "Confirmed-fraud outcomes (caught vs missed) joined to the fraud loss ledger",
        whatGoodEvidenceLooksLike:
          "Detection rate and net fraud loss bps reported together by channel and typology over time.",
        weakEvidenceToReject:
          "A detection-rate or loss number presented alone, with no false-positive or trade-off context.",
      },
      {
        claim: "Alert-to-SAR conversion",
        authoritativeSource: "TM alert records joined to filed SAR records",
        whatGoodEvidenceLooksLike:
          "Alerts generated vs SARs filed over a period, segmented by scenario/typology.",
        weakEvidenceToReject:
          "An asserted conversion percentage with no SAR-record linkage or period.",
      },
      {
        claim: "Model validation coverage / governance posture",
        authoritativeSource: "Model inventory + validation status (MRM register)",
        whatGoodEvidenceLooksLike:
          "Inventory of in-scope models with current validation dates, expirations, and open findings.",
        weakEvidenceToReject:
          "A statement that 'models are validated' with no inventory or validation dates.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your false-positive rate and alert-to-SAR conversion, and how many alerts per investigator FTE close with no action?",
      "What is your fraud detection rate, and is it reported alongside false positives — or in isolation?",
      "What share of fraud losses is now scam/APP fraud, and does your model stack score for customer manipulation?",
      "What is your model validation coverage, and how long does a new FinCrime model take to clear SR 11-7 validation and reach production?",
      "For any given alert or decline, can an investigator and a validator see the specific reasons, or only an opaque score?",
      "Do fraud and AML share a common entity/customer view, or investigate the same accounts independently?",
      "What is your sanctions screening hit rate versus true-match rate, and how much L1 effort is re-clearing recurring false positives?",
      "What is your KYC onboarding time, and is customer risk computed from a single customer view or reassembled per review?",
    ],
    maturitySignals: [
      "Detection is always reported with its false-positive denominator, not in isolation.",
      "Every model is in an inventory with current independent validation and explainable reason codes.",
      "Fraud and AML share an entity view (FRAML), so mule and laundering signals are connected.",
      "Customer risk rating is dynamic/perpetual, not only periodic-review driven.",
      "Scam/APP fraud is measured as a distinct typology with dedicated detection, not lumped into general fraud.",
    ],
    redFlags: [
      "Detection or loss numbers are quoted with no false-positive context.",
      "Alert-to-SAR conversion is in low single digits with a growing investigator backlog.",
      "Models run in production past validation expiry, or new models stall indefinitely in MRM review.",
      "Alerts or declines cannot be explained to an investigator or validator beyond an opaque score.",
      "Fraud and AML operate as fully separate silos investigating the same accounts twice.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Enterprise AML / transaction-monitoring suites",
        category: "Transaction monitoring + case management",
        switchingCost:
          "High — scenarios are tuned over years, dispositions and audit history " +
          "live in the platform, and re-validation of a new platform is a multi-year program.",
        renewalDynamics:
          "Long enterprise terms; watch for module/seat-based expansion pricing and " +
          "validation/professional-services lock-in.",
      },
      {
        vendorName: "Sanctions / watchlist screening engines",
        category: "Real-time payment + name screening",
        switchingCost:
          "High — embedded in payment rails, list management and tuning are " +
          "examiner-scrutinized, and parallel-run proof is required to switch.",
        renewalDynamics:
          "Often bundled with list/data subscriptions; data licensing can dominate cost.",
      },
      {
        vendorName: "Fraud decisioning / orchestration platforms",
        category: "Real-time fraud scoring + orchestration",
        switchingCost:
          "Moderate — orchestration layers are designed to swap models/signals, " +
          "but channel integrations and tuned rules create stickiness.",
        renewalDynamics:
          "Often transaction-volume or per-decision pricing; scrutinize unit economics at scale.",
      },
      {
        vendorName: "KYC / identity & adverse-media data providers",
        category: "Identity verification, watchlist & adverse-media data",
        switchingCost:
          "Moderate — data feeds are replaceable via mapping, but coverage and " +
          "match-quality differences carry compliance risk.",
        renewalDynamics:
          "Per-check or subscription data pricing; coverage and false-match quality are the real levers.",
      },
    ],
    switchingCosts:
      "The monitoring and screening cores are effectively sticky because " +
      "switching requires re-tuning, re-validation under SR 11-7, and parallel-run " +
      "proof to satisfy examiners. The negotiable frontier is the AI overlay " +
      "(triage, decisioning, copilots) and the underlying data subscriptions.",
    negotiationLevers: [
      "Outcome-based pricing tied to measured false-positive reduction at held detection",
      "Explainability and full audit-trail access as a contractual requirement for exam defense",
      "Parallel-run / model-validation support obligations baked into the contract",
      "Data portability and model exit rights to avoid lock-in on tuned scenarios",
      "Unbundling data subscriptions from platform fees to expose true unit cost",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      detection_metric: [
        "confirmed-fraud outcomes (caught vs missed)",
        "false-positive denominator",
        "trailing-period aggregation by channel/typology",
      ],
      aml_alert_metric: [
        "TM alert dispositions",
        "filed SAR records",
        "investigator caseload basis",
      ],
      sanctions_claim: [
        "screening hit volume",
        "true-match vs false-match adjudication",
      ],
      model_governance_claim: [
        "model inventory",
        "validation status and dates",
        "open MRM findings",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (governance lag, adversary adaptation)",
      ],
    },
    citationStandard:
      "Quantitative FinCrime claims cite the alert/case/loss/model-inventory " +
      "source and the period, and detection claims ALWAYS cite their " +
      "false-positive denominator. Value projections cite a baseline plus a " +
      "labelled planning range and the haircut factors applied — never a single " +
      "asserted loss-reduction or ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not shared alert dispositions — frame false-positive and conversion rates as industry patterns, not their number.",
      "Detection lift is cited without the tenant's false-positive baseline — present as a trade-off, not a one-sided gain.",
      "Vendor-reported reductions are cited — mark as vendor claims pending parallel-run validation.",
      "A model's deployment timeline is discussed without the tenant's validation cadence — flag governance lag as the binding uncertainty.",
    ],
    inferenceLanguage: [
      "Across bank AML programs, alerts typically run 90%+ false positive...",
      "Without your alert-level data, the industry pattern suggests...",
      "Peer institutions at this scale commonly see scam/APP fraud climbing toward...",
      "Subject to SR 11-7 validation, a model like this could move detection by...",
    ],
    flagWithoutEvidence: [
      "A specific fraud-loss reduction or ROI for this tenant",
      "This tenant's actual false-positive, detection, or alert-to-SAR rate",
      "A claim that this tenant's models are or are not SR 11-7 compliant",
      "A claim that a specific customer or transaction is fraudulent or sanctioned",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "detection vs false-positive trade-off / precision-recall frontier",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Plot detection rate against false-positive rate to show the operating point and the achievable frontier.",
    },
    {
      questionPattern: "alert funnel / alerts to cases to SARs",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack alert volume by disposition (auto-clear, no-action, escalated, SAR) to expose where effort goes.",
    },
    {
      questionPattern: "fraud loss reduction value / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current net fraud loss to recoverable value, applying governance-lag and adversary-adaptation haircuts.",
    },
    {
      questionPattern: "model inventory / validation coverage status",
      exhibitKind: "table",
      note: "Models in scope with validation status, expiry, and open findings vs the coverage planning range.",
    },
    {
      questionPattern: "FinCrime KPI scorecard",
      exhibitKind: "table",
      note: "False-positive rate, detection rate, alert-to-SAR, caseload, time-to-disposition, sanctions hit rate vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Efficiency framing (false-positive reduction at held detection) that is provably safe under exam",
      "Model governance engaged early so SR 11-7 validation runs in parallel, not after build",
      "Detection always measured with its false-positive denominator, so wins are real not optical",
      "Unified fraud + AML entity data (FRAML) so signals compound instead of duplicating effort",
      "Explainability and reason codes built in, so investigators and validators can trust decisions",
    ],
    failureDrivers: [
      "Chasing detection lift while false positives and investigator backlog quietly rise",
      "Deploying opaque models that cannot clear validation or justify a specific decision",
      "Treating governance as an afterthought, so a better model never reaches production",
      "Auto-closing alerts to cut caseload and creating untimely-SAR regulatory exposure",
      "Ignoring scam/APP fraud because the existing stack reports the typologies it can already see",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Investigators adopt triage and copilots readily once trust is earned, because " +
      "the work is measurable and false positives are the visible pain; the gating " +
      "force is the second/third line (model risk, compliance) and examiners — " +
      "efficiency overlays land first, autonomous detection scales only after " +
      "validation and supervisory comfort.",
    roiClarity: "medium",
    roiClarityBasis:
      "Efficiency gains (false-positive reduction, capacity released) are firmly " +
      "attributable in alert/case data, but loss-reduction ROI is softer because " +
      "adversaries adapt and avoided losses are counterfactual — and the whole case " +
      "is discounted by how long SR 11-7 governance takes to let a model ship.",
  },

  regulatoryFrame: {
    name: "BSA/AML, OFAC sanctions & SR 11-7 model risk",
    relevance:
      "The dominant regulatory frame for FinCrime: BSA/AML mandates monitoring " +
      "and SAR/CTR filing, OFAC imposes zero-tolerance sanctions screening, and " +
      "SR 11-7 governs every model — making model governance and explainability, " +
      "not raw detection accuracy, the binding constraint on deploying AI " +
      "(FinCEN CDD/beneficial-ownership rules also apply; see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave3)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
