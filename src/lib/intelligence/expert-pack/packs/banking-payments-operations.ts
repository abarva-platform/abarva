// Consilium expert — Banking & Payments Operations.
//
// Backlog-wave industry-function ExpertPack v2. Domain: retail + commercial
// banking operations — core banking and account servicing, deposits and lending
// operations, payments money-movement (ACH, wire, RTP/instant, cards, ISO 20022
// migration), branch and digital channel operations, KYC/onboarding, collections,
// and reg/compliance OPERATIONS. Anchored to the realities operators actually
// live: core-banking modernization is a multi-year, high-risk program that most
// "transformations" stall on at the integration layer; payments margin is
// compressing while real-time rails and the fraud controls they demand raise cost
// per transaction; deposit beta and funding cost dominate net interest margin;
// and digital onboarding abandonment plus KYC friction are the silent leakage no
// dashboard headline shows.
//
// Excludes fraud / financial crime (a separate expert), credit risk modeling,
// market/treasury ALM strategy, and wealth/capital-markets — this expert owns the
// operational spine that moves money, services accounts, and runs the channels.
//
// Product-aware, not product-locked: references the dominant categories of
// systems (core banking platforms, payment switches/hubs, AML/KYC engines)
// without assuming a single vendor.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";
import type { ExpertPackIdentity } from "@/lib/intelligence/expert-pack/expert-pack";

export const bankingPaymentsOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.financial-services-banking.payments-operations",
    expertName: "Banking & Payments Operations Expert",
    kind: "industry-function",
    industry: "financial_services_banking",
    functionKey: "banking-payments-operations",
    scopeNote:
      "Retail and commercial banking operations: core banking and account " +
      "servicing; deposit and lending operations; payments money-movement " +
      "across ACH, wire, RTP/instant, cards, and the ISO 20022 migration; " +
      "branch and digital channel operations and channel migration; " +
      "KYC/onboarding and account opening; collections; and the operational " +
      "side of reg/compliance (Reg E/Reg DD, Nacha). Excludes fraud/financial " +
      "crime, credit-risk modeling, treasury/ALM strategy, and wealth/capital " +
      "markets (separate experts).",
  } satisfies ExpertPackIdentity,

  domain: {
    operatingMetrics: [
      {
        key: "cost_to_serve_per_account",
        name: "Cost-to-serve per account",
        definition:
          "Fully-loaded operating cost (servicing, channel, and back-office) " +
          "allocated per active deposit/loan account per year.",
        unit: "USD/account/yr",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 35,
          high: 150,
          basis:
            "Varies sharply by product, channel mix, and digital maturity; " +
            "branch-heavy retail accounts run high, digital-native run low, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Activity-based cost allocation over active accounts (finance + ops cost pools)",
        whyItMatters:
          "The unit economic that determines whether thin-margin deposit and " +
          "transaction accounts are profitable. It is the number channel " +
          "migration and servicing automation are ultimately trying to move.",
      },
      {
        key: "digital_onboarding_completion",
        name: "Digital onboarding completion rate",
        definition:
          "Share of started digital account-open applications that complete to " +
          "a funded, fully-verified account, by channel.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 35,
          high: 70,
          basis:
            "Digital deposit account-opening abandonment is high; identity/KYC " +
            "friction and funding steps drive most drop-off, industry surveys + operator experience",
          label: "planning-range",
        },
        dataSource:
          "Onboarding funnel analytics: applications started vs funded/verified completes",
        whyItMatters:
          "The silent leakage. Every abandoned application is acquisition spend " +
          "wasted and a customer lost to a competitor — and it rarely shows in a " +
          "headline KPI because abandoned applications never become accounts.",
      },
      {
        key: "payment_stp_rate",
        name: "Payment straight-through-processing (STP) rate",
        definition:
          "Share of payments (ACH/wire/RTP) processed end-to-end with no manual " +
          "intervention, repair, or exception handling.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 99,
          basis:
            "Wire/cross-border STP runs lower due to data quality; domestic ACH " +
            "and RTP higher; ISO 20022 richer data can lift STP, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Payment hub processing logs: auto-processed vs repaired/exception payments",
        whyItMatters:
          "STP is the direct lever on payment operating cost: every point of " +
          "non-STP is a manual repair touch. As volume shifts to real-time rails " +
          "with no repair window, STP becomes a hard requirement, not a nicety.",
      },
      {
        key: "payment_exception_rate",
        name: "Payment exception / repair rate",
        definition:
          "Share of payments requiring manual repair, investigation, or " +
          "exception handling (the inverse pressure to STP), by rail.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 15,
          basis:
            "Cross-border/wire repair runs high from incomplete data; domestic " +
            "rails lower; data-quality and sanctions-hold driven, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Payment operations queues: repair/investigation/exception volumes over total",
        whyItMatters:
          "Exceptions are where payment ops cost and risk concentrate — each one " +
          "is a manual touch, a potential SLA/value-date miss, and a fraud or " +
          "sanctions-hold decision point. The repair queue is the true cost center.",
      },
      {
        key: "core_batch_window_utilization",
        name: "Core-system batch-window utilization",
        definition:
          "Share of the nightly core-banking batch window consumed by " +
          "end-of-day processing (posting, interest, statements, settlement).",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "Legacy cores run long nightly batches; high utilization leaves no " +
            "headroom for growth or real-time demands, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Core batch job scheduler / run logs: batch duration over available window",
        whyItMatters:
          "The architecture fight made measurable. A batch window near saturation " +
          "is why a bank cannot offer real-time balances or 24x7 availability — " +
          "and why instant-payment rails strain a batch-era core. It is the " +
          "clearest signal that modernization is no longer optional.",
      },
      {
        key: "net_interest_margin",
        name: "Net interest margin (NIM)",
        definition:
          "Net interest income as a percentage of average interest-earning " +
          "assets — the spread the bank earns between asset yields and funding cost.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2.5,
          high: 4,
          basis:
            "Rate-environment and balance-sheet-mix dependent; community/retail " +
            "banks often higher, large diversified lower, published call-report ranges",
          label: "planning-range",
        },
        dataSource:
          "Financial reporting: net interest income over average earning assets",
        whyItMatters:
          "The economic backdrop every operations decision sits inside. " +
          "Operations cannot set NIM, but funding cost and deposit retention " +
          "(which ops and channels influence) are what defend it when rates move.",
      },
      {
        key: "deposit_beta",
        name: "Deposit beta",
        definition:
          "Share of a benchmark-rate move that passes through to deposit rates " +
          "paid — how fast funding cost reprices when rates rise.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis:
            "Cumulative deposit beta varies by deposit mix, competition, and " +
            "rate cycle; non-operating/CD deposits reprice faster, industry analysis",
          label: "planning-range",
        },
        dataSource:
          "Treasury/ALM deposit repricing analysis over the rate cycle",
        whyItMatters:
          "Deposit beta and funding cost dominate NIM. Low-beta, sticky " +
          "operating deposits are the prize; high beta means the bank pays away " +
          "its spread to retain balances — which is why deposit experience and " +
          "retention are operational levers, not just treasury ones.",
      },
      {
        key: "fraud_loss_bps",
        name: "Fraud loss (bps of volume) — reference only",
        definition:
          "Net fraud losses as basis points of payment/transaction volume. " +
          "Carried as a reference constraint; fraud detection is a separate expert.",
        unit: "bps",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 12,
          basis:
            "Channel-dependent; real-time rails run hotter; carried as a cost " +
            "the payments-ops case must respect, not optimize, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Fraud loss ledger over channel volume (owned by the FinCrime function)",
        whyItMatters:
          "Real-time rails raise fraud exposure because funds are irrevocable " +
          "and instant — so every payments-ops modernization case must price in " +
          "the fraud-control cost the rail demands. Referenced here, owned there.",
      },
      {
        key: "branch_cost_to_income",
        name: "Branch cost-to-income ratio",
        definition:
          "Operating cost of the branch channel as a share of the revenue " +
          "(spread + fee) attributable to it.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 55,
          high: 85,
          basis:
            "Branch economics deteriorate as transactions migrate to digital " +
            "while fixed property/staff cost stays, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Branch P&L: channel operating cost over channel-attributed revenue",
        whyItMatters:
          "The structural cost problem of physical banking: as transactions " +
          "leave the branch, the fixed-cost base does not, so cost-to-income " +
          "rises unless the network and its role are actively reshaped.",
      },
      {
        key: "time_to_fund_loan",
        name: "Time to fund a loan",
        definition:
          "Average elapsed time from application to disbursed/funded loan, by " +
          "product (consumer, small-business, commercial).",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 30,
          basis:
            "Consumer/auto can be same-day; small-business and commercial run " +
            "days to weeks due to documentation and underwriting, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Loan origination system timestamps: application to funded/disbursed",
        whyItMatters:
          "Cycle time is the competitive frontier in lending operations: slow " +
          "funding loses deals to faster lenders and inflates origination cost " +
          "per loan. It is where document and decisioning automation pay off.",
      },
      {
        key: "kyc_turnaround_time",
        name: "KYC turnaround time",
        definition:
          "Average elapsed time to complete identity verification and CDD for a " +
          "new customer/account, from application to KYC-clear.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 10,
          basis:
            "Retail digital is fast; commercial with beneficial-ownership and " +
            "EDD runs days to weeks, operator experience",
          label: "planning-range",
        },
        dataSource:
          "Onboarding workflow timestamps: application to KYC/CDD-complete",
        whyItMatters:
          "KYC friction is the largest single driver of onboarding abandonment. " +
          "It is the point where compliance obligation and growth collide — the " +
          "function is judged on protecting the bank WITHOUT strangling acquisition.",
      },
      {
        key: "channel_migration_rate",
        name: "Channel migration % (digital share of transactions)",
        definition:
          "Share of servicing transactions and interactions completed in digital " +
          "self-service channels rather than branch or contact center.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "Most routine transactions have migrated digital; the residual in " +
            "branch/call is higher-value or lower-digital-affinity segments, industry data",
          label: "planning-range",
        },
        dataSource:
          "Channel analytics: transactions by channel over total interactions",
        whyItMatters:
          "Migration is what lets cost-to-serve and branch cost-to-income fall — " +
          "but only if the migrated volume actually leaves the expensive channel " +
          "rather than adding a digital channel on top of an unchanged branch base.",
      },
      {
        key: "instant_payment_adoption",
        name: "RTP / instant-payment adoption",
        definition:
          "Share of eligible payment volume (or eligible customers) actively " +
          "using real-time rails (RTP, FedNow) rather than ACH/wire.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2,
          high: 25,
          basis:
            "Instant-payment volume is small but fast-growing; receive-side " +
            "ubiquity outpaces send-side adoption, industry reporting",
          label: "planning-range",
        },
        dataSource:
          "Payment rail volumes: RTP/FedNow over total eligible payment volume",
        whyItMatters:
          "Real-time rails are where payments are headed, but they invert the " +
          "operating model: no repair window, irrevocable funds, 24x7 availability, " +
          "and richer fraud-control needs. Adoption is both an opportunity and the " +
          "forcing function for core and ops modernization.",
      },
    ],

    painThemes: [
      {
        key: "core_modernization_stall",
        name: "Core-banking modernization stalls at the integration layer",
        description:
          "Multi-year core replacement/coexistence programs routinely stall not " +
          "on the new core itself but on the integration layer — the hundreds of " +
          "downstream systems, batch feeds, and channel integrations that the " +
          "legacy core silently anchors. Cost and timeline overrun where the data " +
          "and interface mapping live.",
        detectionSignal:
          "A multi-year core program past its original date, scope re-cut to " +
          "'coexistence', integration backlog growing, benefits deferred repeatedly.",
        diagnosticQuestion:
          "Where is your core-modernization program against its original plan, " +
          "and is the slippage in the new core or in the integration/coexistence layer?",
      },
      {
        key: "batch_vs_realtime_architecture",
        name: "Legacy batch core vs real-time rail demands",
        description:
          "A batch-era core cannot natively support real-time balances, 24x7 " +
          "availability, or instant payments. Banks bolt real-time facades onto a " +
          "batch core, creating reconciliation gaps, memo-post complexity, and a " +
          "batch window with no headroom.",
        detectionSignal:
          "High batch-window utilization, memo-post/shadow-balance workarounds, " +
          "instant-payment volume constrained by core availability windows.",
        diagnosticQuestion:
          "Can your core post in real time and stay available 24x7, or do " +
          "instant payments rely on memo-posting around a nightly batch window?",
      },
      {
        key: "payments_margin_compression",
        name: "Payments margin compression vs rising rail/control cost",
        description:
          "Interchange and payment fees are under regulatory and competitive " +
          "pressure while real-time rails and the fraud controls they require " +
          "raise cost per transaction — squeezing payments economics from both ends.",
        detectionSignal:
          "Flat/declining payment fee revenue, rising per-transaction processing " +
          "and fraud-control cost, real-time volume growing faster than its revenue.",
        diagnosticQuestion:
          "Is your cost per payment falling as fast as your payment revenue per " +
          "transaction, and how is real-time rail cost trending against its revenue?",
      },
      {
        key: "onboarding_abandonment_leakage",
        name: "Digital onboarding abandonment (silent leakage)",
        description:
          "A large share of started digital account applications never complete " +
          "to a funded account, lost at identity verification, document upload, or " +
          "funding. Because abandoned applications never become accounts, the loss " +
          "is invisible in account-level KPIs.",
        detectionSignal:
          "Onboarding completion well below benchmark, drop-off concentrated at " +
          "KYC/identity and funding steps, no funnel instrumentation at all.",
        diagnosticQuestion:
          "What is your digital onboarding completion rate, and at which step — " +
          "identity, document, or funding — does most abandonment happen?",
      },
      {
        key: "deposit_funding_cost_pressure",
        name: "Deposit beta and funding-cost pressure on NIM",
        description:
          "When rates rise, deposit beta determines how fast funding cost " +
          "repays away the bank's spread. Banks without sticky operating deposits " +
          "pay up to retain balances, compressing NIM, while deposit experience " +
          "and pricing tooling lag.",
        detectionSignal:
          "Rising cumulative deposit beta, deposit outflow/migration to higher-rate " +
          "products, NIM compression, manual/slow deposit-rate decisioning.",
        diagnosticQuestion:
          "What is your cumulative deposit beta this cycle, and how sticky is your " +
          "operating-deposit base versus rate-sensitive balances?",
      },
      {
        key: "kyc_friction_vs_growth",
        name: "KYC/onboarding friction strangling acquisition",
        description:
          "Compliance-mandated KYC/CDD steps add friction that drives abandonment, " +
          "yet weakening them raises regulatory and fraud risk. Customer, identity, " +
          "and beneficial-ownership data are fragmented, so verification is slow " +
          "and re-keyed across lines of business.",
        detectionSignal:
          "Long KYC turnaround, abandonment spiking at identity steps, duplicate " +
          "KYC across products, manual beneficial-ownership lookups.",
        diagnosticQuestion:
          "How long does KYC take, and is identity/CDD reused across products from " +
          "a single customer view, or re-collected each time?",
      },
      {
        key: "exception_repair_drag",
        name: "Payment exception/repair drag on operations",
        description:
          "Incomplete or non-standard payment data — especially in wires and " +
          "cross-border — forces manual repair and investigation, concentrating " +
          "cost, SLA risk, and value-date misses in the exception queue. The " +
          "ISO 20022 migration is both the cause of churn and the eventual fix.",
        detectionSignal:
          "High repair/exception rate, large investigation queues, value-date " +
          "misses, ISO 20022 readiness behind rail mandates.",
        diagnosticQuestion:
          "What share of payments hit a repair or exception queue, and how ready " +
          "is your stack for the ISO 20022 data standard that should reduce it?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "payment_exception_resolution",
        name: "AI payment exception & repair resolution",
        valueMechanism:
          "Use models to auto-repair common payment defects (incomplete " +
          "beneficiary data, format/standard mismatches, routing) and pre-package " +
          "the rest for an operator — lifting STP and cutting the manual repair " +
          "touches where payment-ops cost concentrates.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical payment repairs and their resolutions",
          "Payment message data (ACH/wire/ISO 20022) and reference/routing data",
          "Counterparty and beneficiary master data",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "A wrong auto-repair can misdirect funds — high-value/cross-border repairs need operator confirmation",
          "Sanctions and value-date implications must be preserved, never bypassed by an auto-repair",
          "Auto-repairs need a full audit trail for reconciliation and exam",
        ],
        metricsMoved: [
          "payment_stp_rate",
          "payment_exception_rate",
          "cost_to_serve_per_account",
        ],
      },
      {
        key: "onboarding_kyc_automation",
        name: "AI onboarding & KYC document/identity automation",
        valueMechanism:
          "Automate identity verification, document extraction, and CDD checks " +
          "during onboarding, and intervene on drop-off in real time — lifting " +
          "onboarding completion and cutting KYC turnaround without weakening the " +
          "compliance controls.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Onboarding funnel telemetry (step-level drop-off)",
          "Identity/document data and verification provider results",
          "Customer/KYC master and beneficial-ownership data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Identity/CDD decisions carry regulatory weight — high-risk cases route to human review, not auto-approve",
          "Document extraction errors must not propagate into the customer record unchecked",
          "Risk-rating logic is a model under SR 11-7 — must be validated and explainable",
        ],
        metricsMoved: [
          "digital_onboarding_completion",
          "kyc_turnaround_time",
          "cost_to_serve_per_account",
        ],
      },
      {
        key: "servicing_assistant",
        name: "Account-servicing assistant & self-service deflection",
        valueMechanism:
          "Deploy a grounded conversational assistant in digital channels to " +
          "resolve routine servicing requests (balances, transfers, disputes " +
          "initiation, status) end-to-end — migrating volume out of branch and " +
          "contact center and lowering cost-to-serve.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Account and transaction data via secure servicing APIs",
          "Servicing knowledge base and policy/procedure content",
          "Channel interaction and containment analytics",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Money-movement and dispute actions need step-up auth and clear human escalation paths",
          "Reg E error-resolution and disclosure obligations must be honored in any servicing flow",
          "Assistant answers must be grounded in account data, never fabricated balances or terms",
        ],
        metricsMoved: [
          "channel_migration_rate",
          "cost_to_serve_per_account",
          "branch_cost_to_income",
        ],
      },
      {
        key: "lending_ops_automation",
        name: "AI lending-operations document & decisioning support",
        valueMechanism:
          "Extract and validate documents (income, collateral, business " +
          "financials), pre-assemble the credit file, and surface decision-ready " +
          "packages — compressing time-to-fund and origination cost per loan while " +
          "the underwriter keeps the credit decision.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Loan application and document corpus",
          "Origination-system workflow and stage data",
          "Bureau/financial-data feeds for validation",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "The credit decision and any adverse-action reasons remain the underwriter's — no auto-decline on opaque scores",
          "Fair-lending and ECOA exposure means decisioning support must be explainable and tested for disparate impact",
          "Extracted financials must be validated before entering the credit file",
        ],
        metricsMoved: [
          "time_to_fund_loan",
          "cost_to_serve_per_account",
        ],
      },
      {
        key: "deposit_pricing_intelligence",
        name: "Deposit-pricing & retention intelligence",
        valueMechanism:
          "Model deposit elasticity and attrition risk by segment to target " +
          "rate offers and retention actions at the balances most likely to leave " +
          "— defending NIM by holding sticky operating deposits without paying " +
          "up across the whole book.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Deposit balances, repricing history, and attrition outcomes",
          "Customer relationship and product-holding data",
          "Competitive rate and market signals",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Differential pricing must be tested for fair-banking/UDAAP and disclosure compliance",
          "Pricing recommendations are decision support — rate-setting stays with treasury/ALM",
          "Retention models can entrench bias if segment features proxy protected classes",
        ],
        metricsMoved: [
          "deposit_beta",
          "net_interest_margin",
          "cost_to_serve_per_account",
        ],
      },
      {
        key: "reconciliation_close_automation",
        name: "AI reconciliation & operational close automation",
        valueMechanism:
          "Auto-match transactions across core, payment, and ledger systems, " +
          "and triage breaks for investigation — shrinking the reconciliation and " +
          "operational-close burden that batch-era integration creates and " +
          "freeing the batch window.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Core, payment-hub, and general-ledger transaction feeds",
          "Historical reconciliation breaks and resolutions",
          "Settlement and clearing data",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Auto-matched items still need exception thresholds and an audit trail for controls",
          "Unresolved breaks must escalate, never silently clear, to preserve ledger integrity",
          "Matching logic changes are controlled changes under operational-risk governance",
        ],
        metricsMoved: [
          "core_batch_window_utilization",
          "payment_exception_rate",
          "cost_to_serve_per_account",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "payment_hub",
        name: "Centralized payment hub / orchestration layer",
        description:
          "A rail-agnostic payment hub that normalizes initiation, validation, " +
          "routing, and exception handling across ACH, wire, RTP/FedNow, and cards " +
          "— decoupling channels and products from individual rails and centralizing " +
          "ISO 20022 translation and STP logic.",
        boundary:
          "Owns payment orchestration, validation, and exception routing; does " +
          "NOT own the core ledger posting or fraud-detection decisioning.",
        humanAccountabilityPoint: "Head of Payment Operations",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "core_coexistence_strangler",
        name: "Core coexistence / strangler modernization pattern",
        description:
          "Incrementally peel capabilities (deposits, payments, onboarding) off " +
          "the legacy core onto a modern platform behind an integration/abstraction " +
          "layer, running coexistence rather than big-bang replacement — managing " +
          "the integration-layer risk that stalls most core programs.",
        boundary:
          "Owns the migration sequencing and abstraction layer; does not, by " +
          "itself, decommission the legacy core until each capability is proven.",
        humanAccountabilityPoint: "Core Modernization Program Sponsor (COO/CIO)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "digital_onboarding_orchestration",
        name: "Digital onboarding & KYC orchestration",
        description:
          "An orchestration layer over identity verification, document capture, " +
          "CDD, and funding that instruments the funnel step-by-step, automates " +
          "low-risk paths, and routes high-risk cases to review — built to lift " +
          "completion while preserving compliance.",
        boundary:
          "Owns onboarding flow orchestration and funnel instrumentation; does " +
          "not make the final high-risk KYC/EDD decision — that routes to compliance.",
        humanAccountabilityPoint: "Head of Onboarding / Account Opening",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "omnichannel_servicing",
        name: "Omnichannel servicing & channel-migration architecture",
        description:
          "A common servicing API/orchestration layer feeding digital self-service, " +
          "assisted, branch, and contact-center channels from one source of truth — " +
          "so volume migrates to lower-cost channels without fragmenting the " +
          "customer record or duplicating servicing logic.",
        boundary:
          "Owns the shared servicing layer and channel orchestration; does not " +
          "own the underlying core ledger or the branch-network footprint decision.",
        humanAccountabilityPoint: "Head of Channels / Digital Banking",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "realtime_ledger_overlay",
        name: "Real-time ledger / availability overlay",
        description:
          "A real-time balance and availability layer (memo-post, event-driven " +
          "ledger, or modern deposit core) that fronts the batch core to deliver " +
          "24x7 availability and instant-payment posting, with disciplined " +
          "reconciliation back to the system of record.",
        boundary:
          "Owns real-time availability and instant posting; does not replace the " +
          "core system-of-record ledger — it must reconcile to it without drift.",
        humanAccountabilityPoint: "Head of Core Banking Operations",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Banking-operations value is dominated by unit cost and leakage, not " +
        "headline revenue: the durable prize is lower cost-to-serve (channel " +
        "migration, servicing automation, STP, reconciliation) and closing the " +
        "silent leakage of onboarding abandonment — both measurable and " +
        "controllable. Funding-cost defense (deposit beta) is high-value but " +
        "largely a treasury/market lever operations only influences. The biggest " +
        "discount is core/integration risk: modernization benefits are real but " +
        "deeply haircut for the integration-layer stall and multi-year horizon " +
        "that sink most core programs.",
      dominantHaircutFactors: [
        {
          factor: "Core / integration-layer risk",
          rationale:
            "Most benefits depend on touching or modernizing the core, where the " +
            "integration layer, coexistence complexity, and multi-year horizon " +
            "make the largest share of forecast value the most likely to slip.",
          typicalHaircut: {
            low: 0.3,
            high: 0.55,
            basis:
              "Core-modernization programs routinely overrun on integration, not the new core, operator experience",
            label: "planning-range",
          },
        },
        {
          factor: "Channel-migration leakage (cost not removed)",
          rationale:
            "Migrating volume to digital only lowers cost if the expensive " +
            "branch/call base is actually reduced; adding digital on top of an " +
            "unchanged footprint captures little of the modeled saving.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Cost-to-income gains erode when fixed channel cost is not removed, operator experience",
            label: "planning-range",
          },
        },
        {
          factor: "Regulatory / compliance gating",
          rationale:
            "Onboarding, deposit-pricing, and lending automation are gated by " +
            "KYC, Reg E/Reg DD, fair-lending, and model-governance obligations " +
            "that cap how far controls can be relaxed for speed.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Compliance constraints limit automation depth in regulated flows, operator experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Cost-to-serve reduction (channel + servicing automation)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported servicing cost reductions from digital migration and " +
              "self-service deflection, net of cost not removed",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in cost_to_serve_per_account",
        },
        {
          lever: "Onboarding completion uplift (leakage recovered)",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Completion-rate gains from KYC/identity automation and funnel " +
              "intervention at drop-off points",
            label: "planning-range",
          },
          measuredAs: "Absolute uplift in digital_onboarding_completion",
        },
        {
          lever: "Payment STP uplift / exception reduction",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Repair-volume reductions from auto-repair and ISO 20022 richer data, at held risk controls",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in payment_exception_rate",
        },
      ],
      timeToValueBand:
        "Servicing automation / onboarding orchestration: 2-3 quarters. " +
        "Payment hub / exception automation: 3-4 quarters including rail and " +
        "control integration. Core coexistence / real-time overlay: 4+ quarters " +
        "(often multi-year), gated by integration-layer risk.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Core banking platform",
          role: "System of record for accounts, balances, posting, interest, and end-of-day batch.",
          examples: [
            "FIS",
            "Fiserv",
            "Temenos",
            "Jack Henry",
          ],
        },
        {
          name: "Payment switch / hub",
          role: "Orchestrates initiation, validation, routing, and settlement across rails.",
          examples: [
            "Enterprise payment hubs across ACH/wire/RTP/FedNow",
            "Card authorization switches",
          ],
        },
        {
          name: "Loan origination system (LOS)",
          role: "System of record for application, underwriting workflow, and funding.",
          examples: ["Consumer/SMB/commercial origination platforms"],
        },
        {
          name: "Digital banking / channel platform",
          role: "Online and mobile servicing, transfers, and self-service interactions.",
          examples: ["Digital banking platforms + servicing API layers"],
        },
        {
          name: "KYC / onboarding & customer master",
          role: "Identity verification, CDD/beneficial ownership, and customer master data.",
          examples: ["Onboarding/CDD workflow + identity-verification providers"],
        },
        {
          name: "AML / sanctions screening engine",
          role: "Screens customers and payments against sanctions/PEP/watchlists (FinCrime-owned, referenced here).",
          examples: ["Real-time payment filtering + name screening"],
        },
      ],
      roles: [
        {
          title: "Chief Operating Officer (Banking Ops)",
          accountability:
            "End-to-end operating model, cost-to-serve, and the core-modernization program.",
        },
        {
          title: "Head of Payment Operations",
          accountability:
            "Payment STP, exception/repair, rail readiness (ISO 20022, RTP/FedNow), and settlement.",
        },
        {
          title: "Head of Deposit / Account Operations",
          accountability:
            "Account servicing, deposit operations, and servicing cost-to-serve.",
        },
        {
          title: "Head of Onboarding / Account Opening",
          accountability:
            "Onboarding completion, KYC turnaround, and the acquisition-vs-compliance balance.",
        },
        {
          title: "Head of Channels / Digital Banking",
          accountability:
            "Channel migration, digital servicing experience, and branch-network economics.",
        },
        {
          title: "Head of Lending Operations",
          accountability:
            "Time-to-fund, origination cost per loan, and lending-ops document/decisioning flow.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Regulation E (EFTA) / Regulation DD (TISA)",
          relevance:
            "Govern electronic-fund-transfer error resolution and deposit-account disclosures — binding on servicing, disputes, and onboarding flows.",
        },
        {
          name: "Nacha Operating Rules",
          relevance:
            "Govern ACH origination, processing, returns, and risk obligations — the rulebook payment operations runs on.",
        },
        {
          name: "BSA/AML & FinCEN CDD / beneficial ownership",
          relevance:
            "Mandate KYC/CDD at onboarding and ongoing monitoring — the compliance floor under onboarding and account servicing.",
        },
        {
          name: "ISO 20022 payments messaging standard",
          relevance:
            "The richer-data payment message standard adopted across wire/RTP/cross-border rails — both a migration burden and the eventual fix for repair/STP.",
        },
        {
          name: "FFIEC guidance & PCI-DSS",
          relevance:
            "FFIEC examination guidance on operations/IT risk and PCI-DSS card-data security frame how channels and payment systems must be controlled.",
        },
      ],
      canonicalTerms: [
        {
          term: "STP (straight-through processing)",
          definition:
            "End-to-end processing of a payment with no manual intervention — the core efficiency lever in payment ops.",
        },
        {
          term: "ISO 20022",
          definition:
            "A structured, data-rich payment messaging standard replacing legacy formats across wire, RTP, and cross-border rails.",
        },
        {
          term: "RTP / FedNow",
          definition:
            "U.S. real-time payment rails offering instant, irrevocable, 24x7 settlement — distinct from batch ACH.",
        },
        {
          term: "Deposit beta",
          definition:
            "The share of a benchmark-rate change that passes through to deposit rates paid — the driver of funding-cost repricing.",
        },
        {
          term: "NIM (net interest margin)",
          definition:
            "Net interest income as a percentage of average interest-earning assets — the bank's core spread.",
        },
        {
          term: "Memo-post / shadow balance",
          definition:
            "A real-time available-balance layer fronting a batch core, reconciled to the system of record at end-of-day.",
        },
        {
          term: "KYC / CDD / EDD",
          definition:
            "Know Your Customer / Customer Due Diligence / Enhanced Due Diligence — the onboarding and ongoing risk-assessment ladder.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Cost-to-serve and channel economics",
        authoritativeSource:
          "Activity-based cost allocation joined to channel and account data",
        whatGoodEvidenceLooksLike:
          "Fully-loaded cost per account by product and channel over a trailing period, with channel-migration trend.",
        weakEvidenceToReject:
          "A blended cost-to-serve figure with no channel or product breakdown, or a vendor-quoted saving with no baseline.",
      },
      {
        claim: "Digital onboarding completion / abandonment",
        authoritativeSource:
          "Onboarding funnel instrumentation (step-level analytics)",
        whatGoodEvidenceLooksLike:
          "Applications started vs funded/verified completes with step-level drop-off (identity, document, funding) over a period.",
        weakEvidenceToReject:
          "An account-open count with no funnel/abandonment data — completed accounts hide the leakage.",
      },
      {
        claim: "Payment STP / exception posture",
        authoritativeSource:
          "Payment hub processing and repair-queue logs by rail",
        whatGoodEvidenceLooksLike:
          "STP and repair/exception rates by rail (ACH/wire/RTP) over a period, with the drivers of non-STP.",
        weakEvidenceToReject:
          "A single blended STP percentage with no rail breakdown or repair-driver detail.",
      },
      {
        claim: "Core modernization / batch-window posture",
        authoritativeSource:
          "Core batch job logs and the modernization program plan/status",
        whatGoodEvidenceLooksLike:
          "Batch-window utilization trend plus program status against the original plan, with integration-layer dependencies named.",
        weakEvidenceToReject:
          "A statement that the bank is 'modernizing the core' with no batch metrics or program-status evidence.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your cost-to-serve per account by channel, and how much volume has actually left branch and contact center?",
      "What is your digital onboarding completion rate, and at which step — identity, document, or funding — does most abandonment occur?",
      "What are your payment STP and exception/repair rates by rail, and how ready is your stack for ISO 20022?",
      "Where is your core-modernization program against its original plan, and is the slippage in the new core or the integration/coexistence layer?",
      "Can your core post in real time and stay available 24x7, or do instant payments rely on memo-posting around a nightly batch window?",
      "What is your cumulative deposit beta this cycle, and how sticky is your operating-deposit base versus rate-sensitive balances?",
      "How long does it take to fund a loan and to clear KYC, and is identity/CDD reused across products from a single customer view?",
      "How is real-time (RTP/FedNow) volume trending, and is its revenue keeping pace with its processing and fraud-control cost?",
    ],
    maturitySignals: [
      "Cost-to-serve is tracked per account by channel, and migrated volume provably reduces the expensive channel base.",
      "Onboarding is instrumented step-by-step, so abandonment is visible and acted on, not hidden behind account counts.",
      "Payments run through a rail-agnostic hub with high STP and ISO 20022 readiness, not rail-by-rail point integrations.",
      "The core supports real-time availability and instant posting, or a disciplined overlay reconciles cleanly to it.",
      "Deposit pricing and retention are data-driven by segment, defending NIM without paying up across the whole book.",
    ],
    redFlags: [
      "Core modernization is years past plan with the slippage sitting in the integration/coexistence layer.",
      "Instant payments depend on memo-posting around a batch window that is near saturation.",
      "Onboarding is measured only by accounts opened, with no funnel or abandonment instrumentation.",
      "Digital channels were added on top of an unchanged branch/call base, so cost-to-income did not fall.",
      "Payment exceptions are cleared by ever-growing manual repair teams with no STP or ISO 20022 roadmap.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Core banking platform providers",
        category: "Core banking system of record",
        switchingCost:
          "Very high — the core anchors hundreds of downstream integrations, batch " +
          "feeds, and channels; replacement is a multi-year coexistence program with " +
          "deep conversion and parallel-run risk.",
        renewalDynamics:
          "Long enterprise terms; watch for transaction/account-based pricing escalators " +
          "and module/professional-services lock-in around conversion.",
      },
      {
        vendorName: "Payment hub / orchestration vendors",
        category: "Payment processing + orchestration",
        switchingCost:
          "Moderate-to-high — hubs are designed to abstract rails, but rail " +
          "certifications, tuned exception logic, and ISO 20022 mappings create stickiness.",
        renewalDynamics:
          "Often transaction-volume or per-payment pricing; scrutinize unit economics " +
          "as real-time volume grows and bundle rail-certification support.",
      },
      {
        vendorName: "Digital banking / channel platform vendors",
        category: "Online/mobile servicing platform",
        switchingCost:
          "Moderate — replatforming is disruptive to customers, but API-led " +
          "architectures reduce lock-in versus monolithic channel suites.",
        renewalDynamics:
          "Per-user or per-account subscription; feature-module upsell and " +
          "professional-services dependence are the cost levers.",
      },
      {
        vendorName: "Onboarding / identity & KYC data providers",
        category: "Identity verification + KYC/CDD data",
        switchingCost:
          "Low-to-moderate — feeds are replaceable via mapping, but coverage and " +
          "match-quality differences carry compliance and abandonment risk.",
        renewalDynamics:
          "Per-check or subscription pricing; coverage, false-reject rate, and " +
          "pass-through cost per application are the real levers.",
      },
    ],
    switchingCosts:
      "The core is the stickiest asset in banking — switching it is a multi-year, " +
      "high-risk conversion that anchors every downstream system, which is exactly " +
      "why modernization stalls at the integration layer. The negotiable frontier " +
      "is the abstraction layer above the core: payment hub, channel/servicing " +
      "platform, and onboarding/identity data, where API-led architectures and " +
      "competitive data providers create real leverage.",
    negotiationLevers: [
      "Transaction/account-based pricing tiers and caps as volume scales, not open-ended escalators",
      "Conversion and parallel-run support obligations contractually committed for any core migration",
      "ISO 20022 and rail-certification support baked into payment-hub terms",
      "Data portability and API exit rights to avoid lock-in on the channel/servicing layer",
      "Per-application pricing tied to verified-completion (not started applications) on onboarding/identity data",
      "Unbundling KYC/identity data subscriptions from platform fees to expose true per-check cost",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      cost_to_serve_claim: [
        "activity-based cost allocation",
        "channel and product breakdown",
        "trailing-period aggregation",
      ],
      onboarding_claim: [
        "onboarding funnel instrumentation",
        "step-level drop-off (identity/document/funding)",
        "started vs funded-complete counts",
      ],
      payment_metric: [
        "payment hub processing/repair logs",
        "rail breakdown (ACH/wire/RTP)",
        "STP and exception denominators",
      ],
      core_modernization_claim: [
        "core batch logs / batch-window utilization",
        "program status vs original plan",
        "named integration-layer dependencies",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (core/integration risk, channel leakage, compliance gating)",
      ],
    },
    citationStandard:
      "Quantitative banking-ops claims cite the source system (core, payment hub, " +
      "onboarding funnel, finance cost allocation) and the period, and are broken " +
      "down by channel or rail rather than blended. Onboarding claims ALWAYS cite " +
      "funnel/abandonment data, not just accounts opened. Value projections cite a " +
      "baseline plus a labelled planning range and the haircut factors applied " +
      "(core/integration risk especially) — never a single asserted cost-saving or " +
      "ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has not shared cost-allocation or funnel data — frame cost-to-serve and onboarding completion as industry patterns, not their number.",
      "A modernization saving is cited without the tenant's integration-layer status — present core benefits as heavily discounted for integration risk.",
      "Vendor-reported STP or saving figures are cited — mark as vendor claims pending the tenant's own baseline.",
      "Deposit-beta or NIM impact is discussed without the tenant's balance-sheet mix — flag funding cost as a treasury/market lever ops only influences.",
    ],
    inferenceLanguage: [
      "Across banks at this scale, digital onboarding completion typically runs...",
      "Without your channel-level cost data, the industry pattern suggests cost-to-serve sits...",
      "Most core programs slip at the integration layer, so a benefit like this is usually discounted by...",
      "Subject to your deposit mix, cumulative beta in this rate cycle commonly lands toward...",
    ],
    flagWithoutEvidence: [
      "A specific cost-to-serve reduction or ROI for this tenant",
      "This tenant's actual onboarding completion, STP, or deposit-beta number",
      "A claim that this tenant's core can or cannot support real-time/24x7 posting",
      "A funding-cost or NIM outcome stated as a settled result rather than a rate-dependent planning range",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "cost-to-serve by channel / channel-migration economics",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack servicing cost by channel (branch, call, digital) to show where cost sits and how migration moves it.",
    },
    {
      questionPattern: "onboarding funnel / abandonment drop-off",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Waterfall from started applications through identity, document, and funding steps to funded accounts, exposing leakage.",
    },
    {
      questionPattern: "cost-to-serve reduction value / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current cost-to-serve to recoverable value, applying core/integration-risk and channel-leakage haircuts.",
    },
    {
      questionPattern: "payment STP / exception posture by rail",
      exhibitKind: "table",
      note: "STP and exception/repair rates by rail (ACH/wire/RTP) with ISO 20022 readiness vs planning ranges.",
    },
    {
      questionPattern: "banking-operations KPI scorecard",
      exhibitKind: "table",
      note: "Cost-to-serve, onboarding completion, STP, batch-window utilization, time-to-fund, KYC turnaround, channel migration vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Targeting unit cost and leakage (cost-to-serve, onboarding completion, STP) where benefits are measurable and controllable",
      "Sequencing core modernization as coexistence with the integration layer de-risked first, not big-bang replacement",
      "Removing the expensive channel base as volume migrates, so cost-to-income actually falls",
      "Treating real-time rails as a forcing function with fraud-control cost priced in from the start",
      "Instrumenting the onboarding funnel so the silent leakage becomes visible and actionable",
    ],
    failureDrivers: [
      "A big-bang core replacement that stalls at the integration layer and consumes years of benefit",
      "Adding digital channels on top of an unchanged branch/call base, so promised cost savings never land",
      "Bolting instant payments onto a saturated batch core, creating reconciliation and availability risk",
      "Measuring onboarding only by accounts opened, leaving abandonment invisible and uncorrected",
      "Underpricing the fraud-control and compliance cost that real-time rails and KYC obligations demand",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Servicing automation, onboarding orchestration, and payment exception tooling " +
      "land first because the pain (cost-to-serve, abandonment, repair queues) is " +
      "visible and the controls are containable; channel migration follows as " +
      "experience and trust build. Core modernization and real-time overlays are the " +
      "slow tail — gated by integration-layer risk, conversion caution, and a " +
      "multi-year horizon — and scale only after early operational wins fund and " +
      "de-risk the deeper program.",
    roiClarity: "medium",
    roiClarityBasis:
      "Operational efficiency (cost-to-serve, STP, recovered onboarding leakage) is " +
      "firmly attributable in cost-allocation and funnel data, but the largest " +
      "modernization benefits are softer — they ride on a multi-year core program " +
      "whose integration-layer risk and channel-cost-removal assumptions can erode " +
      "much of the modeled return, and funding-cost (NIM) impact is rate-dependent " +
      "and only partly within operations' control.",
  },

  regulatoryFrame: {
    name: "Reg E/Reg DD, Nacha & ISO 20022 (payments/servicing operations frame)",
    relevance:
      "The dominant operational regulatory frame: Regulation E and Regulation DD " +
      "govern electronic-transfer error resolution and deposit disclosures across " +
      "servicing and onboarding; the Nacha Operating Rules govern ACH; and the " +
      "ISO 20022 standard reshapes payment messaging across wire/RTP/cross-border " +
      "rails — together making compliant servicing, accurate disclosures, and rail " +
      "data-standard readiness binding constraints on operations and automation " +
      "(BSA/AML KYC, FFIEC, and PCI-DSS also apply; see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
