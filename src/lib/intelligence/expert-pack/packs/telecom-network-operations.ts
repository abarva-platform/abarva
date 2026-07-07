// Consilium expert — Telecom: Network & Customer Operations (cross-cutting).
//
// Wave-3 cross-cutting ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// Mirrors the contact-center-cx and energy-grid-operations exemplar depth bar.
//
// Domain: a communications service provider's twin operational engines —
// the NETWORK (assurance, capacity/capex planning, field service, OSS/BSS)
// and the CUSTOMER (care, churn, monetization). The two are inseparable:
// network experience drives churn, and churn economics justify network capex.
//
// Honest bounding truths baked into the content:
// (1) CHURN and NETWORK CAPEX EFFICIENCY dominate the economics — telecom is a
//     high-fixed-cost, retention-driven business where a point of churn or a
//     point of capex-to-revenue moves more value than most AI efficiency plays.
// (2) NETWORK DATA INTEGRATION gates AI — OSS/BSS/EMS/probe/CRM data is siloed,
//     mis-time-aligned, and inconsistently mapped to the inventory; the
//     integration effort, not the model, is the binding constraint on most bets.
// (3) PRICE COMPETITION compresses margin — unlimited plans and aggressive
//     promotions mean ARPU is structurally pressured, so cost-out and retention
//     value can be quietly eroded by the next round of market pricing.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const telecomNetworkOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.telecom-network-operations",
    expertName: "Telecom Network & Customer Operations Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "telecom-network-operations",
    scopeNote:
      "Communications service provider operations spanning the network and the " +
      "customer: network assurance/availability, capex and capacity planning, " +
      "field service/dispatch, customer care and churn, BSS/OSS, fraud, and " +
      "5G/fiber monetization. Treats network experience and churn as one system " +
      "— network quality drives retention, and retention economics justify " +
      "network capital. Cross-segment (mobile, broadband/fiber, B2B/wholesale). " +
      "Excludes content/media production, handset retail merchandising, spectrum " +
      "policy/M&A, and pure IT back-office (HR/finance) — those route elsewhere.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "churn_rate",
        name: "Customer churn rate (monthly)",
        definition:
          "Share of the subscriber base that disconnects in a period, " +
          "expressed monthly; voluntary (switching) plus involuntary " +
          "(non-pay) churn, net of in-base migrations.",
        unit: "% / month",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1.0,
          high: 3.0,
          basis:
            "Postpaid mobile runs low (~1-2%/mo); prepaid and value broadband " +
            "run higher; B2B lower still — segment mix swings the range widely",
          label: "planning-range",
        },
        dataSource:
          "BSS/CRM disconnect events over average subscribers, split voluntary " +
          "vs involuntary, by product and segment",
        whyItMatters:
          "The single most economically dominant metric in telecom: a high-" +
          "fixed-cost base means lifetime value and capex justification both " +
          "hinge on retention. A fraction of a churn point outweighs most cost-" +
          "out programs — and most network experience value shows up here.",
      },
      {
        key: "arpu",
        name: "Average revenue per user (ARPU)",
        definition:
          "Recurring service revenue divided by average subscribers over the " +
          "period, by product line (mobile, broadband, B2B).",
        unit: "USD / subscriber / month",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 60,
          basis:
            "Prepaid/value mobile at the low end, postpaid + converged + fiber " +
            "and B2B at the high end; structurally pressured by price competition",
          label: "planning-range",
        },
        dataSource:
          "BSS billed recurring revenue / average subscribers by product and plan",
        whyItMatters:
          "The revenue side of unit economics. ARPU is under constant downward " +
          "pressure from unlimited plans and promotions, so monetization (5G/" +
          "fiber upsell, converged bundles) is about defending ARPU as much as " +
          "growing it — and any value case must net out competitive price erosion.",
      },
      {
        key: "network_availability",
        name: "Network availability",
        definition:
          "Share of time the network (or a service/element class) is available " +
          "and meeting service thresholds, weighted by customers or traffic " +
          "affected, excluding planned maintenance windows.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 99.9,
          high: 99.999,
          basis:
            "Carrier-grade targets; core/transport higher (five-nines), access/" +
            "RAN and last-mile lower; enterprise SLAs sit at the top",
          label: "planning-range",
        },
        dataSource:
          "EMS/NMS element-availability and probe/assurance data weighted by " +
          "affected customers or traffic",
        whyItMatters:
          "The headline network-quality proxy customers and regulators anchor " +
          "on. Availability gaps drive care contacts and churn, so it is the " +
          "operational metric that connects network spend to retention value.",
      },
      {
        key: "mean_time_to_repair",
        name: "Mean time to repair (MTTR)",
        definition:
          "Average elapsed time from fault detection to service restoration " +
          "across network incidents, including localization, dispatch, and fix.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 8,
          basis:
            "Fault-class and access-type dependent; core/automated faster, " +
            "field-dispatch last-mile slower; major events excluded",
          label: "planning-range",
        },
        dataSource:
          "Trouble-ticketing/assurance timestamps (detect → localize → dispatch " +
          "→ restore) by fault class",
        whyItMatters:
          "The restoration lever behind availability and customer experience. " +
          "AI fault localization and dispatch optimization compress the detect-" +
          "to-restore chain, but cutting MTTR without fixing root cause just " +
          "speeds up firefighting.",
      },
      {
        key: "capex_to_revenue",
        name: "Capex to revenue (capex intensity)",
        definition:
          "Capital expenditure as a share of total service revenue over the " +
          "period — the network investment intensity of the business.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 15,
          high: 22,
          basis:
            "Typical telecom intensity band; spikes during 5G densification or " +
            "fiber build-out, falls in harvest years — too low starves the network",
          label: "planning-range",
        },
        dataSource:
          "Capital actuals / service revenue from finance, decomposed by " +
          "build vs maintenance vs growth capex",
        whyItMatters:
          "Telecom's defining cost discipline alongside churn: capital intensity " +
          "determines free cash flow. The prize is capex EFFICIENCY — buying the " +
          "same coverage/capacity/reliability for fewer dollars through better " +
          "targeting — not simply cutting spend and starving the network.",
      },
      {
        key: "first_call_resolution",
        name: "First-call resolution (FCR)",
        definition:
          "Share of care contacts resolved on the first interaction with no " +
          "follow-up contact for the same issue within a defined window.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 65,
          high: 80,
          basis:
            "Cross-industry care benchmarks; telecom drags lower when network/" +
            "billing issues need back-office or truck-roll resolution",
          label: "planning-range",
        },
        dataSource:
          "CRM case threading joined to contact records over a trailing window, " +
          "by issue type (network, billing, device, provisioning)",
        whyItMatters:
          "The quality-and-cost lever in care: low FCR means repeat contacts, " +
          "truck rolls, and frustrated customers who churn. Network-rooted " +
          "contacts that care can't resolve are a key FCR drag and a churn signal.",
      },
      {
        key: "truck_roll_rate",
        name: "Truck-roll rate",
        definition:
          "Field dispatches (truck rolls) per 100 active subscribers (or per " +
          "100 service orders/trouble tickets) over the period.",
        unit: "rolls / 100 subscribers",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 8,
          basis:
            "Access-type dependent; fiber/HFC install- and repair-heavy at the " +
            "high end, mobile lower; avoidable rolls are a major cost lever",
          label: "planning-range",
        },
        dataSource:
          "Field-service/dispatch system roll counts joined to subscriber and " +
          "ticket volumes, flagged install vs repair vs avoidable",
        whyItMatters:
          "Each truck roll is a large, direct field cost. A material share are " +
          "avoidable — no-fault-found, repeat visits, wrong-skill/parts — which " +
          "is where remote diagnostics and dispatch optimization pay off.",
      },
      {
        key: "network_utilization",
        name: "Network utilization (peak)",
        definition:
          "Peak-hour traffic as a share of provisioned capacity on the " +
          "constraining network elements (RAN cells, transport links, ports).",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 50,
          high: 75,
          basis:
            "Headroom planning band — below wastes capital, above ~80% risks " +
            "congestion and experience degradation at peak",
          label: "planning-range",
        },
        dataSource:
          "EMS/probe peak-busy-hour traffic counters vs provisioned capacity " +
          "per element/cell/link",
        whyItMatters:
          "The capex-efficiency lever: under-utilized capacity is stranded " +
          "capital; over-utilized elements degrade experience and drive churn. " +
          "AI capacity forecasting keeps elements in the productive band and " +
          "defers or targets augmentation spend.",
      },
      {
        key: "nps",
        name: "Net promoter score (NPS)",
        definition:
          "Promoters minus detractors on the 0-10 likelihood-to-recommend " +
          "question, at the relationship level and influenced by network and " +
          "service experience.",
        unit: "points",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 45,
          basis:
            "Telecom NPS is structurally lower than many sectors; converged/" +
            "fiber and premium-care providers sit at the top of the range",
          label: "planning-range",
        },
        dataSource:
          "Relationship and transactional NPS surveys linked to recent network " +
          "experience and care contacts",
        whyItMatters:
          "The loyalty proxy that leads churn. Network experience and care " +
          "quality are the dominant NPS drivers in telecom, so it is the metric " +
          "that connects operational improvement to retention before churn moves.",
      },
      {
        key: "fraud_loss",
        name: "Fraud loss rate",
        definition:
          "Revenue lost to fraud (subscription, SIM-swap, IRSF/bypass, " +
          "device/handset, account-takeover) as a share of total revenue.",
        unit: "% of revenue",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 2.5,
          basis:
            "Industry fraud-loss estimates; varies by fraud type exposure, " +
            "international traffic mix, and control maturity",
          label: "planning-range",
        },
        dataSource:
          "Fraud-management system confirmed-loss cases and write-offs over " +
          "revenue, by fraud type",
        whyItMatters:
          "A direct, recoverable margin leak that scales with traffic and " +
          "promotions. AI anomaly detection shifts fraud from reactive write-off " +
          "to real-time prevention — but false positives that block good " +
          "customers carry their own churn and care cost.",
      },
      {
        key: "cost_per_subscriber",
        name: "Cost per subscriber (cost to serve)",
        definition:
          "Fully-loaded operating cost (network O&M, care, field, billing, IT) " +
          "divided by average subscribers — the opex unit economics.",
        unit: "USD / subscriber / month",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 8,
          high: 25,
          basis:
            "Mobile lower, fiber/B2B with more field and support higher; the " +
            "denominator every efficiency case is judged on",
          label: "planning-range",
        },
        dataSource:
          "Operating cost centers (network, care, field, billing, IT) / average " +
          "subscribers from the GL and operational systems",
        whyItMatters:
          "The opex side of unit economics where most AI efficiency plays land. " +
          "Cost-out only compounds if it survives the next price round — under " +
          "margin compression, cost-to-serve discipline defends profitability " +
          "rather than simply growing it.",
      },
      {
        key: "service_provisioning_time",
        name: "Service provisioning / activation time",
        definition:
          "Mean elapsed time from order to service activation (order-to-cash " +
          "fulfillment), by product (mobile port, broadband/fiber install, B2B).",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 10,
          basis:
            "Mobile near-instant; fiber/broadband install days-to-weeks with " +
            "field and right-of-way dependencies; B2B circuits longer",
          label: "planning-range",
        },
        dataSource:
          "OSS/BSS order-management fulfillment timestamps (order → provision → " +
          "activate) by product and journey",
        whyItMatters:
          "Activation is the first experience and an early-churn driver: slow, " +
          "failed, or fallout-prone provisioning sours the relationship and " +
          "generates care contacts. Order-fallout automation and right-first-" +
          "time provisioning compress this and reduce early churn.",
      },
    ],

    painThemes: [
      {
        key: "churn_economics_blind_spot",
        name: "Churn economics treated as a care problem, not a network one",
        description:
          "Churn is managed downstream with retention offers and save desks " +
          "while its upstream network and experience drivers (poor coverage, " +
          "congestion, repeat faults) go unaddressed — so the business pays to " +
          "retain customers the network keeps pushing out.",
        detectionSignal:
          "Retention spend rising while gross churn is flat; no link between " +
          "cell/feeder experience and churn cohorts; network experience absent " +
          "from churn models; saves concentrated in price discounts not fixes.",
        diagnosticQuestion:
          "Do your churn models include network-experience features (coverage, " +
          "drops, congestion, repeat faults), and can you tie churn cohorts back " +
          "to specific network elements?",
      },
      {
        key: "network_data_fragmentation",
        name: "Network/customer data fragmentation (the binding constraint)",
        description:
          "OSS, BSS, EMS/NMS, probes, inventory, and CRM hold the data AI " +
          "needs, but it is siloed, mis-time-aligned, and inconsistently mapped " +
          "to the network inventory — so the integration effort, not the model, " +
          "gates almost every use case here.",
        detectionSignal:
          "No unified network/customer data model; analysts hand-merge exports; " +
          "inventory disagrees with as-deployed; probe/EMS tags not mapped to " +
          "subscribers or cells; customer can't be joined to serving element.",
        diagnosticQuestion:
          "Can you join a subscriber to their serving network elements, the " +
          "element's performance, and their care/billing history without manual " +
          "reconciliation across OSS/BSS/EMS/CRM?",
      },
      {
        key: "margin_compression_price_war",
        name: "Margin compression from price competition",
        description:
          "Unlimited plans, aggressive promotions, and converged-bundle " +
          "discounting structurally pressure ARPU, so efficiency and retention " +
          "gains can be quietly erased by the next pricing round — and value " +
          "cases that ignore competitive response overstate the prize.",
        detectionSignal:
          "Declining ARPU despite usage growth; promotion-driven gross adds with " +
          "high early churn; margin erosion outpacing cost-out; value cases that " +
          "assume static pricing.",
        diagnosticQuestion:
          "How has ARPU trended net of promotions, and do your AI value cases " +
          "net out the competitive price response, or assume today's pricing holds?",
      },
      {
        key: "capex_misallocation",
        name: "Capex misallocation / capacity-led overbuild",
        description:
          "Network augmentation is driven by blanket rules, vendor roadmaps, or " +
          "the loudest escalation rather than demand and experience risk — so " +
          "capital lands where it buys least reliability/experience while real " +
          "congestion and churn hotspots wait.",
        detectionSignal:
          "Augmentation by uniform thresholds not demand forecast; stranded " +
          "capacity beside congested elements; weak link from capex projects to " +
          "measured experience/churn improvement; capex intensity rising without " +
          "experience gains.",
        diagnosticQuestion:
          "How is augmentation capital prioritized — by demand and experience-" +
          "risk forecasting tied to churn, or by uniform thresholds and roadmaps?",
      },
      {
        key: "avoidable_truck_rolls",
        name: "Avoidable truck rolls & field inefficiency",
        description:
          "A large share of field dispatches are avoidable — no-fault-found, " +
          "repeat visits, wrong skill/parts — because remote diagnostics are " +
          "thin and dispatch is rules-based, inflating field cost and slowing " +
          "restoration of the hardest faults.",
        detectionSignal:
          "High no-fault-found and repeat-visit rates; low first-time-fix; high " +
          "truck-roll rate per ticket; limited remote diagnostics on CPE/access; " +
          "aging field workforce concentrating scarce expertise.",
        diagnosticQuestion:
          "What is your no-fault-found rate and first-time-fix rate, and how " +
          "much of a fault is diagnosed remotely before a truck is dispatched?",
      },
      {
        key: "reactive_fraud_revenue_leak",
        name: "Reactive fraud & revenue leakage",
        description:
          "Fraud (subscription, SIM-swap, IRSF/bypass, account-takeover) and " +
          "billing/provisioning revenue leakage are caught after the loss by " +
          "rules that lag new attack patterns, so margin leaks continuously and " +
          "controls fight the last fraud, not the next.",
        detectionSignal:
          "Fraud detected post-write-off; static rules missing new patterns; " +
          "revenue-assurance gaps between usage, rating, and billing; high " +
          "involuntary churn from bad-debt and fraud-linked disconnects.",
        diagnosticQuestion:
          "Is fraud caught before or after the loss, how quickly do controls " +
          "adapt to new patterns, and what is your measured revenue leakage " +
          "between usage and billing?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "churn_prediction_retention",
        name: "Network-aware churn prediction & proactive retention",
        valueMechanism:
          "Fuse network-experience signals (coverage, drops, congestion, repeat " +
          "faults) with usage, care, and billing data to predict churn at the " +
          "subscriber level and trigger the RIGHT intervention — a network fix, " +
          "a care outreach, or a targeted offer — before the customer leaves, " +
          "raising retention without blanket discounting.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Subscriber-to-serving-element mapping (inventory + CRM)",
          "Network experience signals (EMS/probe: drops, throughput, congestion)",
          "Usage, care-contact, and billing history",
          "Historical churn outcomes and prior-offer response",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Discount-led saves can train customers to churn for offers — bias toward fixing the network/experience driver",
          "Privacy and fair-treatment constraints on using behavioral data for differential offers",
          "Measure on net retained value, not raw save rate, to avoid retaining unprofitable churners",
        ],
        metricsMoved: [
          "churn_rate",
          "nps",
          "arpu",
          "cost_per_subscriber",
        ],
      },
      {
        key: "network_assurance_aiops",
        name: "AI network assurance & fault localization (AIOps)",
        valueMechanism:
          "Correlate alarms, KPIs, and probe data across layers to detect " +
          "anomalies, suppress noise, and localize root-cause faults — " +
          "compressing the detect-to-localize-to-restore chain and catching " +
          "degradations before they become outages or care contacts.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "EMS/NMS alarms and performance KPIs across layers",
          "Probe / active-test and passive-monitoring data",
          "Network inventory and topology",
          "Trouble-ticket and historical incident records",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Automated remediation touches live network — actions stay within change-control and rollback guards",
          "Topology/inventory errors mislead correlation; operators retain override on closed-loop actions",
          "Alarm-suppression false-negatives can hide real degradations — tune for recall on customer-affecting faults",
        ],
        metricsMoved: [
          "mean_time_to_repair",
          "network_availability",
          "first_call_resolution",
        ],
      },
      {
        key: "capacity_capex_planning",
        name: "AI capacity & capex planning (demand-driven augmentation)",
        valueMechanism:
          "Forecast element-level demand and experience risk and rank " +
          "augmentation by reliability/experience bought per dollar — so capital " +
          "targets real congestion and churn hotspots, defers stranded builds, " +
          "and raises capex efficiency instead of blanket overbuild.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Element-level traffic and utilization history (EMS/probe)",
          "Demand drivers (subscriber growth, device/usage mix, 5G/fiber uptake)",
          "Experience and churn linkage by element/area",
          "Capital project cost and lead-time data",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Capital decisions carry large, irreversible commitments — planners own the call, AI ranks",
          "Forecast misses under-build congestion or strand capital — surface uncertainty, not point values",
          "Must respect coverage/regulatory build obligations that override pure efficiency ranking",
        ],
        metricsMoved: [
          "capex_to_revenue",
          "network_utilization",
          "network_availability",
        ],
      },
      {
        key: "field_service_optimization",
        name: "Field service & truck-roll optimization",
        valueMechanism:
          "Diagnose faults remotely before dispatch, and optimize crew " +
          "scheduling, routing, and parts/skills matching — cutting avoidable " +
          "and repeat truck rolls, raising first-time-fix, and compressing " +
          "restoration on the faults that genuinely need a visit.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "CPE/access remote diagnostics and telemetry",
          "Field workforce dispatch, routing, and timesheet data",
          "Work order, parts/inventory, and crew skill data",
          "Trouble-ticket symptoms and fault history",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Dispatch must respect safety, union work rules, and access constraints",
          "Over-suppressing rolls risks leaving real faults unresolved — track no-fault-found both ways",
          "Remote-fix actions on customer premises equipment need clear consent and rollback",
        ],
        metricsMoved: [
          "truck_roll_rate",
          "mean_time_to_repair",
          "cost_per_subscriber",
        ],
      },
      {
        key: "fraud_revenue_assurance",
        name: "Real-time fraud detection & revenue assurance",
        valueMechanism:
          "Score transactions, usage, and account events in real time for " +
          "anomalous patterns (SIM-swap, IRSF/bypass, subscription, account-" +
          "takeover) and reconcile usage-to-rating-to-billing — shifting fraud " +
          "and leakage from post-loss write-off to prevention and recovery.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Real-time CDR/usage and signaling events",
          "Account, provisioning, and SIM/device change events",
          "Rating and billing records for usage-to-bill reconciliation",
          "Historical confirmed-fraud and leakage cases",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "False positives block legitimate customers — calibrate to limit care and churn cost of friction",
          "Fraud-control actions (suspends, blocks) need audit trail and fast human review/appeal",
          "PII and lawful-intercept/data-handling constraints on signaling and usage data",
        ],
        metricsMoved: [
          "fraud_loss",
          "arpu",
          "cost_per_subscriber",
        ],
      },
      {
        key: "provisioning_orchestration",
        name: "AI order/provisioning orchestration & fallout resolution",
        valueMechanism:
          "Predict and auto-resolve order fallout, recommend right-first-time " +
          "provisioning paths, and orchestrate OSS/BSS fulfillment — speeding " +
          "activation, cutting manual rework and early-life care contacts, and " +
          "reducing the early churn slow/failed activations cause.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "OSS/BSS order-management and fulfillment workflow data",
          "Network inventory and serviceability/feasibility data",
          "Historical fallout patterns and manual-resolution outcomes",
          "Care-contact linkage to activation experience",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Auto-resolution must not commit incorrect network config — guard with validation and rollback",
          "Order/inventory data quality caps accuracy — bad serviceability data drives wrong provisioning",
          "Fulfillment changes touch billing — reconcile to avoid revenue leakage",
        ],
        metricsMoved: [
          "service_provisioning_time",
          "first_call_resolution",
          "churn_rate",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "network_customer_data_foundation",
        name: "Unified network & customer data foundation",
        description:
          "A governed integration layer that time-aligns OSS/BSS, EMS/NMS, " +
          "probe, inventory, and CRM into a trustworthy model where a subscriber " +
          "can be joined to their serving elements, those elements' performance, " +
          "and their care/billing history — the prerequisite every other " +
          "use case here depends on.",
        boundary:
          "Owns data integration, quality, and the common network/customer " +
          "model; does not own real-time network control (stays read-aligned " +
          "with EMS/OSS) or the billing system of record.",
        humanAccountabilityPoint: "VP Network & Customer Data / Analytics",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "closed_loop_assurance",
        name: "Closed-loop network assurance over existing OSS",
        description:
          "An AIOps assurance layer overlaying the existing EMS/NMS and " +
          "ticketing — anomaly detection, alarm correlation, root-cause " +
          "localization, and guarded automated remediation — that lands value " +
          "without ripping and replacing the OSS or network management stack.",
        boundary:
          "Owns detection, correlation, and remediation recommendations; " +
          "automated actions stay under change-control and operator authority; " +
          "does not own the underlying EMS/NMS or physical network.",
        humanAccountabilityPoint: "NOC / Network Operations Director",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "experience_driven_capex_engine",
        name: "Experience- and churn-driven capex prioritization engine",
        description:
          "A planning capability that ranks network augmentation by experience " +
          "and churn risk per dollar — tying capacity forecasts to retention " +
          "value so capital targets the elements where reliability buys the most " +
          "loyalty, instead of blanket threshold-driven overbuild.",
        boundary:
          "Owns demand/experience forecasting and capital ranking; does not make " +
          "final capital approvals or override coverage/regulatory build " +
          "obligations.",
        humanAccountabilityPoint: "VP Network Planning / Investment",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "retention_orchestration_layer",
        name: "Network-aware retention orchestration layer",
        description:
          "A decisioning layer that consumes churn-risk scores and routes each " +
          "at-risk subscriber to the right intervention — network remediation, " +
          "proactive care, or a targeted offer — across care, digital, and " +
          "field channels, so retention attacks the actual driver rather than " +
          "defaulting to discounts.",
        boundary:
          "Owns intervention selection and orchestration; does not own the " +
          "underlying network fix, the offer catalog/pricing, or the channel " +
          "execution systems it triggers.",
        humanAccountabilityPoint: "VP Customer Value Management / Retention",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Telecom value is dominated by two economic forces, and the durable " +
        "program serves both. CHURN is the largest prize: in a high-fixed-cost " +
        "base a fraction of a churn point outweighs most cost-out, and the " +
        "biggest, most under-exploited lever is fixing the NETWORK drivers of " +
        "churn rather than buying saves with discounts. CAPEX EFFICIENCY is the " +
        "second: demand- and experience-driven augmentation buys the same " +
        "reliability for fewer dollars — value is in targeting, not in starving " +
        "the network. Around these sit faster, lower-risk wins — assurance/MTTR, " +
        "truck-roll reduction, fraud prevention, provisioning. But every number " +
        "must be haircut for two telecom realities: the network/customer data " +
        "foundation gates how much is realizable, and price competition can " +
        "erode ARPU and cost-out faster than a program delivers. The honest case " +
        "leads with retention and capex efficiency, sequences the data " +
        "foundation first, and nets out competitive price response.",
      dominantHaircutFactors: [
        {
          factor: "Network/customer data readiness & quality",
          rationale:
            "OSS/BSS/EMS/probe/CRM data is frequently siloed, mis-aligned, or " +
            "un-mapped to inventory; until subscribers, elements, and experience " +
            "can be joined, modeled churn/assurance/capex value is largely " +
            "unrealizable — the single largest haircut.",
          typicalHaircut: {
            low: 0.25,
            high: 0.5,
            basis:
              "Repeated experience where network/customer data quality and " +
              "integration capped delivered value",
            label: "planning-range",
          },
        },
        {
          factor: "Competitive price erosion (margin compression)",
          rationale:
            "Unlimited plans and promotions pressure ARPU, so retention and " +
            "cost-out value can be partly eroded by the market's next pricing " +
            "round; value held flat-priced overstates the realized prize.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Observed gap between modeled and realized value once competitive " +
              "ARPU erosion is netted out",
            label: "planning-range",
          },
        },
        {
          factor: "Operations & field adoption",
          rationale:
            "NOC, care, field, and planning teams must trust and act on " +
            "recommendations; union work rules, change-control, and tribal " +
            "knowledge slow adoption and leave value on the table.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis:
              "NOC/field/care change-management experience on closed-loop and " +
              "decisioning programs",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Churn reduction from network-aware proactive retention",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported relative churn reductions where network-experience " +
              "features and proactive intervention were used and data was adequate",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in churn_rate",
        },
        {
          lever: "Capex efficiency from demand-driven augmentation",
          range: {
            low: 0.05,
            high: 0.15,
            basis:
              "Capital deferral/avoidance from experience- and demand-targeted " +
              "augmentation vs blanket thresholds",
            label: "planning-range",
          },
          measuredAs: "Reduction in augmentation capex for equivalent experience",
        },
        {
          lever: "Truck-roll / field cost reduction",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Avoidable-roll and repeat-visit reductions from remote diagnostics " +
              "and dispatch optimization",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in truck_roll_rate",
        },
      ],
      timeToValueBand:
        "Network/customer data foundation: 3-6 quarters (the gating " +
        "investment). Field/truck-roll and fraud wins: 2-3 quarters. Network " +
        "assurance/MTTR: 2-4 quarters. Churn and capex-efficiency value " +
        "compounds over 3-6 quarters once the data foundation and experience-to-" +
        "churn linkage are trustworthy.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "BSS (Business Support Systems)",
          role:
            "Billing, charging, CRM, order-to-cash, and the system of record " +
            "for subscribers, plans, and revenue.",
          examples: [
            "Amdocs",
            "Netcracker",
            "Ericsson BSS",
            "Salesforce / Vlocity Communications Cloud",
          ],
        },
        {
          name: "OSS (Operations Support Systems)",
          role:
            "Inventory, service fulfillment/provisioning, activation, and " +
            "service assurance orchestration.",
          examples: [
            "Amdocs OSS",
            "Netcracker OSS",
            "Blue Planet (Ciena)",
            "ServiceNow Telecom OM",
          ],
        },
        {
          name: "EMS / NMS & assurance / probes",
          role:
            "Element/network management, performance KPIs, alarms, and active/" +
            "passive probe and service-assurance data.",
          examples: [
            "Nokia NetAct / AVA",
            "Ericsson OSS-RC / EMS",
            "NETSCOUT / EXFO probes",
            "Anritsu / Spirent assurance",
          ],
        },
        {
          name: "Field service / workforce management",
          role:
            "Dispatch, scheduling, routing, and crew/work-order management for " +
            "installs and repairs.",
          examples: [
            "Salesforce Field Service",
            "ServiceNow Field Service Management",
            "IFS / Click",
            "Oracle Field Service",
          ],
        },
        {
          name: "Fraud management & revenue assurance",
          role:
            "Fraud detection/case management and usage-to-rating-to-billing " +
            "reconciliation for revenue leakage.",
          examples: [
            "Subex",
            "Mobileum",
            "WeDo (Mobileum)",
            "Amdocs Revenue Guard",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Network Officer / VP Network Operations",
          accountability:
            "Network availability, MTTR, capex efficiency, and operating cost of the network.",
        },
        {
          title: "Chief Commercial / Customer Officer",
          accountability:
            "ARPU, churn, NPS, and the end-to-end customer experience and value.",
        },
        {
          title: "VP Network Planning / Investment",
          accountability:
            "Capacity planning, augmentation prioritization, and capital efficiency.",
        },
        {
          title: "VP Customer Value Management / Retention",
          accountability:
            "Churn, retention economics, and proactive intervention strategy.",
        },
        {
          title: "VP Customer Care / Service Operations",
          accountability:
            "FCR, cost to serve, care quality, and field/truck-roll performance.",
        },
        {
          title: "Director Revenue Assurance & Fraud",
          accountability:
            "Fraud loss, revenue leakage, and the assurance control framework.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Telecom regulator licensing & QoS obligations (e.g. FCC, Ofcom, BEREC, TRAI)",
          relevance:
            "Coverage/build obligations, quality-of-service and outage " +
            "reporting, and consumer rules constrain network operations and can " +
            "override pure capex-efficiency ranking.",
        },
        {
          name: "Lawful intercept & CALEA-style obligations",
          relevance:
            "Network and signaling data handling, retention, and access are " +
            "governed by lawful-intercept regimes that shape what assurance/" +
            "fraud data can be used and how.",
        },
        {
          name: "Data protection & privacy (GDPR / CCPA / ePrivacy)",
          relevance:
            "Subscriber usage, location, and behavioral data used for churn, " +
            "targeting, and fraud are personal data subject to lawful-basis, " +
            "consent, and fair-treatment constraints.",
        },
        {
          name: "Number portability & switching / consumer-protection rules",
          relevance:
            "Porting, contract, and switching rules govern retention and save " +
            "practices — retention offers and friction must stay within conduct rules.",
        },
      ],
      canonicalTerms: [
        {
          term: "Churn",
          definition:
            "The rate at which subscribers disconnect; voluntary (switching) " +
            "vs involuntary (non-pay), the dominant economic driver in telecom.",
        },
        {
          term: "ARPU",
          definition:
            "Average revenue per user — recurring service revenue per " +
            "subscriber, structurally pressured by price competition.",
        },
        {
          term: "OSS / BSS",
          definition:
            "Operations Support Systems (inventory, fulfillment, assurance) and " +
            "Business Support Systems (billing, charging, CRM, order-to-cash).",
        },
        {
          term: "MTTR",
          definition:
            "Mean time to repair — average detect-to-restore time for network " +
            "faults; the restoration lever behind availability.",
        },
        {
          term: "Truck roll",
          definition:
            "A field dispatch to install or repair service; a large direct cost " +
            "with a material avoidable (no-fault-found / repeat) share.",
        },
        {
          term: "Capex intensity",
          definition:
            "Capital expenditure as a share of revenue; telecom's defining " +
            "investment discipline, spiking during 5G/fiber build.",
        },
        {
          term: "AIOps / network assurance",
          definition:
            "Anomaly detection, alarm correlation, and root-cause localization " +
            "across network management and probe data, with guarded automation.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Churn rate and drivers",
        authoritativeSource:
          "BSS/CRM disconnect events over average subscribers, split voluntary " +
          "vs involuntary, joined to network-experience and care signals",
        whatGoodEvidenceLooksLike:
          "Monthly churn by product and segment, with voluntary/involuntary " +
          "split and churn cohorts tied to serving network elements and " +
          "experience, over a trailing period.",
        weakEvidenceToReject:
          "A single blended annual churn number with no segment split, no " +
          "voluntary/involuntary breakdown, and no network/experience linkage.",
      },
      {
        claim: "Network availability and MTTR",
        authoritativeSource:
          "EMS/NMS and assurance/probe data weighted by affected customers/" +
          "traffic, and ticketing detect-to-restore timestamps",
        whatGoodEvidenceLooksLike:
          "Availability weighted by customers/traffic with planned maintenance " +
          "excluded, and MTTR by fault class over a defined period.",
        weakEvidenceToReject:
          "A raw element-uptime percentage presented as customer-experienced " +
          "availability, or an MTTR figure with no fault-class breakdown or " +
          "major-event treatment.",
      },
      {
        claim: "Capex efficiency / capacity utilization",
        authoritativeSource:
          "Capital actuals vs measured experience/utilization deltas by " +
          "project, and EMS/probe peak utilization vs provisioned capacity",
        whatGoodEvidenceLooksLike:
          "Augmentation projects tied to measured before/after utilization and " +
          "experience/churn improvement, with capex intensity decomposed by " +
          "build/maintenance/growth.",
        weakEvidenceToReject:
          "Capex intensity quoted alone with no link from projects to measured " +
          "experience, or utilization averaged across non-constraining elements.",
      },
      {
        claim: "Fraud loss / revenue leakage",
        authoritativeSource:
          "Fraud-management confirmed cases/write-offs over revenue, and usage-" +
          "to-rating-to-billing reconciliation",
        whatGoodEvidenceLooksLike:
          "Confirmed fraud loss by type over revenue and a measured leakage gap " +
          "between usage, rating, and billing, over a defined period.",
        weakEvidenceToReject:
          "A vendor 'up to X% recoverable' figure with no confirmed-loss " +
          "baseline or reconciliation methodology.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your monthly churn by product and segment, split voluntary vs involuntary, and do your churn models include network-experience features tied to serving elements?",
      "Can you join a subscriber to their serving network elements, those elements' performance, and their care/billing history without manual reconciliation across OSS/BSS/EMS/CRM?",
      "How has ARPU trended net of promotions, and do your AI value cases net out competitive price response or assume today's pricing holds?",
      "How is augmentation capital prioritized — by demand and experience/churn-risk forecasting, or by uniform thresholds and vendor roadmaps — and what is your capex intensity trend?",
      "What is your no-fault-found rate, first-time-fix rate, and truck-roll rate, and how much of a fault is diagnosed remotely before dispatch?",
      "Is fraud caught before or after the loss, how fast do controls adapt to new patterns, and what is your measured revenue leakage between usage and billing?",
      "What is your network availability (weighted by customers) and MTTR by fault class, and how do network-rooted contacts show up in FCR and churn?",
    ],
    maturitySignals: [
      "Churn models include network-experience features and churn cohorts can be tied back to specific network elements.",
      "A governed data foundation joins subscriber, serving element, performance, and care/billing without hand-merging.",
      "Augmentation capital is ranked by experience/churn risk per dollar, not uniform thresholds.",
      "Faults are diagnosed remotely before dispatch and field metrics distinguish avoidable from genuine rolls.",
      "Fraud and revenue leakage are caught in real time with controls that adapt, not static post-loss rules.",
    ],
    redFlags: [
      "Retention spend is rising while gross churn is flat and saves are concentrated in discounts, not network/experience fixes.",
      "Subscribers cannot be joined to their serving elements and experience without manual reconciliation — no usable data foundation.",
      "Capex intensity is rising without measured experience/churn improvement, and augmentation is threshold- or roadmap-driven.",
      "AI value cases assume static pricing and ignore competitive ARPU erosion.",
      "Fraud is caught only after write-off and revenue leakage between usage and billing is unmeasured.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "BSS suite vendors (Amdocs, Netcracker, Ericsson)",
        category: "Billing / charging / CRM / order-to-cash system of record",
        switchingCost:
          "Extreme — billing and charging are the revenue system of record with " +
          "deep product/catalog and integration entanglement; replacement is a " +
          "multi-year, high-risk transformation rarely done standalone.",
        renewalDynamics:
          "Long enterprise terms tied to digital-BSS transformation programs; " +
          "incumbents bundle their own AI/analytics add-ons at renewal to defend the account.",
      },
      {
        vendorName: "OSS / inventory / fulfillment vendors (Amdocs, Netcracker, Blue Planet)",
        category: "Inventory / provisioning / service assurance orchestration",
        switchingCost:
          "Very high — inventory and fulfillment workflows are deeply embedded " +
          "with the network and BSS; migration is a major program.",
        renewalDynamics:
          "Tied to network-modernization and automation programs; negotiate on " +
          "open APIs (TM Forum) and orchestration extensibility.",
      },
      {
        vendorName: "Assurance / AIOps & probe vendors (NETSCOUT, EXFO, Nokia AVA, plus AIOps best-of-breed)",
        category: "Service assurance / probes / AIOps analytics",
        switchingCost:
          "Moderate — analytics/AIOps overlay is swappable with data-mapping " +
          "effort; probe hardware and tuned correlation models raise the cost.",
        renewalDynamics:
          "Fast-moving market; per-element or outcome-based pricing emerging — " +
          "favor parity proof and data/model portability before scaling.",
      },
      {
        vendorName: "Fraud / revenue-assurance vendors (Subex, Mobileum/WeDo)",
        category: "Fraud management / revenue assurance",
        switchingCost:
          "Moderate — integrates via CDR/usage and billing feeds; replaceable " +
          "with rule/model migration effort, watch case-history lock-in.",
        renewalDynamics:
          "Outcome/recovery-share terms common; press on measured prevented-loss " +
          "proof and adaptive-detection commitments at renewal.",
      },
    ],
    switchingCosts:
      "The BSS/OSS revenue-and-fulfillment core is effectively non-switchable in " +
      "isolation — the high-lock-in layer. The negotiable value frontier is the " +
      "assurance/AIOps, fraud, field, and analytics layer around it, where " +
      "switching cost is moderate and outcome-based terms and TM Forum open-API " +
      "exit rights are achievable. Beware incumbent BSS/OSS AI bundling that " +
      "quietly re-locks the analytics layer at renewal.",
    negotiationLevers: [
      "Outcome-based pricing tied to measured churn reduction, capex efficiency, or prevented fraud loss — not licenses alone",
      "TM Forum open-API / Open Digital Architecture conformance and data/model portability as contractual exit rights",
      "Parity proof on the operator's own data in a controlled pilot before enterprise scale-up",
      "Unbundle incumbent BSS/OSS AI add-ons from the core renewal to keep best-of-breed leverage",
      "Recovery-share / prevented-loss terms for fraud and revenue assurance to align cost with delivered value",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      churn_claim: [
        "BSS/CRM disconnect events over average subscribers",
        "voluntary vs involuntary split",
        "segment/product breakdown and network-experience linkage",
      ],
      network_quality_claim: [
        "EMS/probe data weighted by affected customers/traffic",
        "planned-maintenance exclusion",
        "MTTR by fault class with major-event treatment",
      ],
      capex_efficiency_claim: [
        "capital actuals by project",
        "measured experience/utilization deltas",
        "capex intensity decomposition (build/maintenance/growth)",
      ],
      fraud_leakage_claim: [
        "confirmed-fraud cases/write-offs over revenue",
        "usage-to-rating-to-billing reconciliation",
        "fraud-type breakdown",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (esp. data readiness and price erosion)",
      ],
    },
    citationStandard:
      "Quantitative telecom claims cite the BSS/OSS/EMS/probe/fraud source and " +
      "the period, state network metrics weighted by customers/traffic with " +
      "maintenance excluded, and state churn split voluntary vs involuntary by " +
      "segment. Value projections cite a baseline plus a labelled planning range " +
      "and the haircut factors applied (data readiness and competitive price " +
      "erosion always considered) — never a single asserted savings or ROI " +
      "number, and never a vendor 'up to X%' figure without a baseline and control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant's network/customer data foundation is immature — frame churn/assurance/capex value as conditional on data readiness, not as an achievable number.",
      "Churn is quoted without voluntary/involuntary split or network linkage — present drivers as industry patterns until cohorts are tied to elements.",
      "Value cases assume static pricing — flag that competitive ARPU erosion can partly erase retention and cost-out value.",
      "Benchmarks are cited without the tenant's own baseline — present as planning ranges, not their numbers.",
      "Vendor-reported assurance/fraud/churn outcomes are cited — mark as vendor claims pending validation on the tenant's data.",
    ],
    inferenceLanguage: [
      "Across operators at this scale and segment mix, churn typically runs...",
      "Without your network-to-churn linkage, the industry pattern is that network experience drives a large share of voluntary churn...",
      "Peer operators commonly see capex efficiency improve by... where augmentation is demand-targeted",
      "As an industry pattern (not your measured figure)...",
      "Where the data foundation is solid, programs of this type have delivered...",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings, churn reduction, or ROI for this tenant",
      "This tenant's actual churn drivers or network-to-churn attribution",
      "A claim that a specific cell, feeder, or region is driving churn for this tenant",
      "A specific fraud-loss or revenue-leakage figure without the tenant's confirmed cases and reconciliation",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "churn drivers and where churn concentrates / network vs care vs price",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap of segments x churn driver (network experience / care / price / billing) shaded by churn contribution.",
    },
    {
      questionPattern: "cost to serve breakdown / where opex concentrates",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack cost per subscriber by function (network O&M, care, field/truck-roll, billing, IT) to show where cost-to-serve sits.",
    },
    {
      questionPattern: "value of a churn or network program / savings and retention bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross modeled value to net, with data-readiness and competitive-price-erosion haircuts shown.",
    },
    {
      questionPattern: "what drives value at risk / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (data readiness, price erosion, adoption) on realizable value.",
    },
    {
      questionPattern: "network and customer KPI scorecard",
      exhibitKind: "table",
      note: "Churn, ARPU, availability, MTTR, capex-to-revenue, FCR, truck-roll rate, utilization, NPS, fraud loss, cost per subscriber vs planning ranges.",
    },
    {
      questionPattern: "churn or ARPU trend over time / are we losing the base",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend churn_rate and ARPU over periods to expose retention and margin pressure together.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The network/customer data foundation is funded and treated as the first deliverable, so subscriber-to-element-to-experience joins are real",
      "Retention attacks the network and experience drivers of churn, not just discount-led saves",
      "Capital is re-targeted by experience and churn risk per dollar, with planners owning the call",
      "Assurance automation stays within change-control so NOC and field teams trust and adopt it",
      "Value cases net out competitive price erosion and measure on net retained/realized value",
    ],
    failureDrivers: [
      "Analytics bought before the data foundation exists — churn and assurance models are confident but unusable",
      "Retention defaulting to discounts that train customers to churn while the network driver goes unfixed",
      "Capex intensity rising without measured experience/churn improvement — overbuild dressed as modernization",
      "Value cases that assume static pricing and are erased by the next promotion round",
      "Fraud and assurance controls that fight the last pattern, with false positives adding care and churn cost",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Field/truck-roll optimization and fraud detection adopt first because the " +
      "value is tangible and the workflow change is contained. Network assurance/" +
      "AIOps follows as correlation accuracy proves out and operators trust " +
      "guarded automation. Network-aware churn and experience-driven capex are " +
      "last and largest — they need the joined data foundation and the network-" +
      "to-churn linkage before commercial and planning teams act on them at scale.",
    roiClarity: "medium",
    roiClarityBasis:
      "Field, fraud, and assurance value is directly measurable in roll counts, " +
      "prevented loss, and MTTR. Churn and capex-efficiency value — the largest " +
      "prizes — are firm only when network-to-churn attribution and project-to-" +
      "experience linkage exist, and both are muddied by competitive price moves " +
      "and the heavy dependence on data readiness, which holds overall clarity at medium.",
  },

  regulatoryFrame: {
    name: "Telecom QoS/licensing obligations + data-protection & lawful-intercept rules",
    relevance:
      "The dominant regulatory frame for telecom operations: licensing, " +
      "coverage/build, and quality-of-service obligations can override pure " +
      "capex-efficiency ranking, while lawful-intercept and data-protection/" +
      "ePrivacy rules govern how network, usage, and behavioral data can be used " +
      "for assurance, churn, targeting, and fraud. Number-portability and " +
      "consumer-protection rules bound retention/save practices (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (industries)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
