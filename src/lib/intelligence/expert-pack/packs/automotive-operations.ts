// Consilium expert — Automotive: Industry Operations (OEM, tier-1, dealer, SDV/EV).
//
// W3 industry-wave ExpertPack (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// An industry-function expert spanning the operating system of the automotive
// value chain end to end: vehicle program / launch, manufacturing & supply
// (semiconductors, battery, harness/casting), dealer network & aftersales,
// connected-vehicle data/services, ADAS/autonomy, EV powertrain & charging, and
// warranty/recall quality. Spans OEM, tier-1 supplier, and dealer/retail — the
// three actors that share a vehicle's lifecycle economics.
//
// CORE DOCTRINE — four honest bounding truths are baked into the content:
// (1) THE MARGIN IS MIGRATING FROM HARDWARE TO SOFTWARE/SERVICES, BUT MOST OEMs
//     CANNOT YET MONETIZE CONNECTED DATA. "Software-defined vehicle" is real as
//     a direction and oversold as a present capability: legacy E/E architecture,
//     tier-1 ECU sprawl, and org silos mean OTA/feature revenue is mostly
//     aspiration. Sizing value on connected-services ARPU the org cannot yet
//     bill is the most common over-promise.
// (2) EV ECONOMICS ARE BRUTAL. Battery cost ($/kWh), charging anxiety, and price
//     wars compress EV contribution margin; many EV programs are loss-making per
//     unit. Value cases that assume legacy ICE margins on EV volume are wrong.
// (3) RECALL / WARRANTY + CHIP / BATTERY SUPPLY DOMINATE RISK. Quality escapes
//     (recall rate, warranty cost per vehicle) and supply shocks (semiconductor,
//     cell) move more enterprise value than most efficiency programs — and AI's
//     defensible early wins are here, not in autonomy.
// (4) AUTONOMY AND SAFETY ARE HARD CONSTRAINTS, NOT TRADE-OFFS. ADAS/AV and any
//     vehicle-control action are bounded by FMVSS, NHTSA, and functional-safety
//     (ISO 26262 / SOTIF) regimes; value that requires crossing the human-control
//     and homologation line is not realizable and must not be promised.

import type { ExpertPack, ExpertPackIdentity } from "@/lib/intelligence/expert-pack/expert-pack";

export const automotiveOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.automotive.operations",
    expertName: "Automotive Industry Operations Expert",
    kind: "industry-function",
    industry: "automotive",
    functionKey: "automotive-operations",
    scopeNote:
      "Industry-spanning operating system of the automotive value chain across " +
      "OEM, tier-1 supplier, and dealer/retail: vehicle program & launch, " +
      "manufacturing & supply (semiconductors, battery cells, harness/casting), " +
      "dealer network & aftersales/service, connected-vehicle data & services, " +
      "ADAS/autonomy, EV powertrain & charging, and warranty/recall quality. " +
      "CORE DOCTRINE: margin is migrating from hardware to software/services but " +
      "most OEMs cannot yet monetize connected data (the SDV is oversold vs the " +
      "legacy-architecture/org reality); EV unit economics are brutal (battery " +
      "cost, charging anxiety, price wars); recall/warranty and chip/battery " +
      "supply dominate enterprise risk; and autonomy/safety are hard constraints " +
      "bounded by FMVSS/NHTSA/ISO 26262, never trade-offs. Excludes captive " +
      "auto-finance underwriting (financial-services expert) and pure plant-floor " +
      "smart-factory depth (manufacturing-operations expert) beyond the " +
      "automotive program/launch and warranty/quality lens.",
  } satisfies ExpertPackIdentity,

  domain: {
    operatingMetrics: [
      {
        key: "launch_on_time_pct",
        name: "Vehicle program launch on-time / on-quality %",
        definition:
          "Share of vehicle programs (and major model-year changes) that reach " +
          "Start of Production on the committed date AND at the committed launch-" +
          "quality gate (PPAP/PPV sign-off), not slipped or launched with open " +
          "concerns.",
        unit: "% of programs",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 90,
          basis:
            "Program complexity, new-platform/EV content, and tier-2 supply " +
            "readiness drive a wide spread; first-of-platform launches sit lowest",
          label: "planning-range",
        },
        dataSource:
          "PLM / program-management system milestone gates (e.g. APQP/PPAP) vs " +
          "committed program timing and quality sign-off",
        whyItMatters:
          "Launch slips and dirty launches cascade into warranty, recall, dealer " +
          "allocation, and revenue timing — the single most expensive thing an OEM " +
          "program organization controls.",
      },
      {
        key: "warranty_cost_per_vehicle",
        name: "Warranty cost per vehicle",
        definition:
          "Total warranty and policy/goodwill expense (parts + labor + supplier " +
          "recovery net) divided by vehicles produced/sold in the cohort — the " +
          "headline read on field quality cost.",
        unit: "$ / vehicle",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 150,
          high: 1200,
          basis:
            "Segment, content, and brand-quality dependent; mass-market ICE low, " +
            "complex/EV/software-rich programs materially higher",
          label: "planning-range",
        },
        dataSource:
          "Warranty claims system + dealer claim submissions, joined to supplier-" +
          "recovery and policy/goodwill ledgers in ERP",
        whyItMatters:
          "Warranty is a multi-billion-dollar P&L line and the earliest financial " +
          "signal of a quality problem; per-vehicle normalization isolates real " +
          "quality movement from volume and mix.",
      },
      {
        key: "recall_rate",
        name: "Recall rate (campaigns per cohort / vehicles affected)",
        definition:
          "Number of safety/compliance recall campaigns and the share of a model-" +
          "year cohort's vehicles affected — a lagging but decisive read on " +
          "field-safety quality and homologation discipline.",
        unit: "campaigns & % vehicles affected",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 30,
          basis:
            "Highly variable by year and brand; software/ADAS-driven recalls have " +
            "raised affected-share volatility — track against the brand's own trend",
          label: "planning-range",
        },
        dataSource:
          "NHTSA recall filings + internal field-action management system and VIN-" +
          "level affected-population data",
        whyItMatters:
          "Recalls carry direct cost, brand damage, and regulatory exposure; rising " +
          "software-driven recalls are a defining risk of the SDV transition.",
      },
      {
        key: "dealer_same_store_service_revenue",
        name: "Dealer same-store service & parts revenue",
        definition:
          "Year-over-year change in service-bay labor + parts revenue for the same " +
          "dealer cohort, the fixed-operations engine that carries most dealer " +
          "profitability.",
        unit: "% YoY (same-store)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: -5,
          high: 12,
          basis:
            "Parc age, EV mix (fewer service hours), and recall/campaign volume " +
            "drive the spread; EV transition pressures the long-run trend",
          label: "planning-range",
        },
        dataSource:
          "Dealer DMS (dealer management system) repair-order and parts data, " +
          "aggregated across the same-store dealer cohort",
        whyItMatters:
          "Fixed operations (service + parts) is the most stable dealer profit pool; " +
          "EV's lower service content is a structural threat the network must offset.",
      },
      {
        key: "connected_services_attach_arpu",
        name: "Connected-services attach rate & ARPU",
        definition:
          "Share of in-warranty/connected vehicles with an active paid connected " +
          "service, and average recurring revenue per connected vehicle per period " +
          "— the read on whether the OEM can actually monetize the SDV.",
        unit: "% attach & $ / vehicle / yr",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 40,
          basis:
            "Most OEMs sit at the low end on paid attach after trial expiry; high " +
            "end reflects premium brands with mature feature catalogs — aspirational " +
            "for the mass market",
          label: "planning-range",
        },
        dataSource:
          "Connected-vehicle platform subscription/billing system joined to the " +
          "active connected-vehicle population",
        whyItMatters:
          "This is the test of doctrine (1): the margin shift to software is only " +
          "real to the extent paid attach and ARPU materialize after free trials " +
          "expire — and for most OEMs they do not yet.",
      },
      {
        key: "ev_mix_pct",
        name: "EV (BEV/PHEV) mix %",
        definition:
          "Share of unit sales (or production) that are battery-electric or plug-in " +
          "hybrid, the pace-of-transition metric — paired with EV contribution " +
          "margin to stay honest about whether the mix is profitable.",
        unit: "% of units",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 5,
          high: 45,
          basis:
            "Region/regulation dependent; 'in-range' because faster is not better " +
            "if EV unit economics are loss-making — mix must track profitable demand",
          label: "planning-range",
        },
        dataSource: "Sales/production reporting by powertrain, vs plan and by region",
        whyItMatters:
          "EV mix is both a regulatory-compliance lever (CAFE/ZEV) and a margin " +
          "risk; growing mix faster than battery cost and demand support destroys " +
          "contribution — the core of doctrine (2).",
      },
      {
        key: "battery_cost_per_kwh",
        name: "Battery cost ($/kWh, pack level)",
        definition:
          "Delivered pack-level cost per usable kWh across cell, module, pack, and " +
          "thermal — the dominant cost driver of EV unit economics.",
        unit: "$ / kWh (pack)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 90,
          high: 160,
          basis:
            "Chemistry (LFP vs NMC), scale, and raw-material (lithium/nickel) price " +
            "cycles drive a wide, time-sensitive band; track to the program's own " +
            "sourced cost",
          label: "planning-range",
        },
        dataSource:
          "Battery sourcing/BOM cost build-up by chemistry and supplier, vs program " +
          "cost targets",
        whyItMatters:
          "Pack cost is the largest single line in EV BOM; crossing the cost band " +
          "where EVs reach ICE parity is the pivotal economic event of the transition.",
      },
      {
        key: "plant_oee",
        name: "Plant OEE (assembly/body/paint/battery)",
        definition:
          "Availability x Performance x Quality across the major shops " +
          "(stamping/body/paint/general assembly and battery/cell lines) — the " +
          "composite read on manufacturing productivity.",
        unit: "% (0-100)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "Mature high-volume assembly runs high; new battery/cell and first-of-" +
            "platform EV lines ramp lower for several quarters",
          label: "planning-range",
        },
        dataSource:
          "MES / production-monitoring runtime, downtime, cycle, and quality data by " +
          "shop and line",
        whyItMatters:
          "Automotive is a fixed-cost, high-volume business; a point of OEE on a " +
          "high-volume line is large absolute capacity and conversion-cost value.",
      },
      {
        key: "days_supply_inventory",
        name: "Days-supply of inventory (dealer/finished)",
        definition:
          "Finished-vehicle inventory (at plant + in transit + on dealer lots) " +
          "expressed as days of selling at current sales rate — the demand/supply " +
          "balance and pricing-power read.",
        unit: "days of supply",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 30,
          high: 75,
          basis:
            "'In-range' because too low starves dealers and too high forces " +
            "incentives; ~50-60 days is a common healthy band, segment-dependent",
          label: "planning-range",
        },
        dataSource:
          "DMS dealer-inventory + OEM finished-goods and in-transit data vs sales rate",
        whyItMatters:
          "Days-supply governs incentive spend and residual values; the chip " +
          "shortage proved that both starvation and glut destroy margin and brand.",
      },
      {
        key: "fixed_first_visit_rate",
        name: "Fixed-first-visit (FFV) rate",
        definition:
          "Share of service repair orders resolved correctly on the first visit, " +
          "with no comeback for the same concern — the core service-quality and " +
          "loyalty driver in fixed operations.",
        unit: "% of repair orders",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 92,
          basis:
            "Diagnostic complexity (esp. software/ADAS faults) and technician skill " +
            "drive the spread; software-rich vehicles pressure FFV",
          label: "planning-range",
        },
        dataSource:
          "DMS repair-order and comeback data joined to diagnostic/technical-" +
          "assistance records",
        whyItMatters:
          "FFV drives service profitability, owner loyalty, and warranty cost; " +
          "rising software faults make first-time diagnosis materially harder.",
      },
      {
        key: "repurchase_loyalty_nps",
        name: "Owner loyalty / repurchase rate (with NPS)",
        definition:
          "Share of owners who repurchase the same brand at replacement, paired " +
          "with NPS/owner-satisfaction — the demand-durability read that underwrites " +
          "lifetime value across vehicle + service + connected revenue.",
        unit: "% repurchase & NPS",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 35,
          high: 65,
          basis:
            "Brand-equity and segment dependent; EV entrants and price wars are " +
            "destabilizing historical loyalty bands",
          label: "planning-range",
        },
        dataSource:
          "CRM/loyalty and registration/repurchase data joined to owner-survey NPS",
        whyItMatters:
          "Loyalty is the cheapest growth and the denominator of connected-services " +
          "and service LTV; it is where brand, quality, and ownership experience all " +
          "settle.",
      },
      {
        key: "ota_adoption_rate",
        name: "Software / OTA update adoption rate",
        definition:
          "Share of the connected fleet that successfully receives and installs an " +
          "over-the-air software/firmware update within the campaign window — the " +
          "operational read on SDV update capability (incl. recall-by-OTA).",
        unit: "% of eligible fleet",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 95,
          basis:
            "Connectivity, consent, and architecture maturity dependent; legacy " +
            "ECU-sprawl platforms sit low, modern zonal architectures high",
          label: "planning-range",
        },
        dataSource:
          "OTA/connected-vehicle platform campaign telemetry (delivered, installed, " +
          "failed) by software package and platform",
        whyItMatters:
          "OTA adoption is the practical gate on both software-revenue delivery and " +
          "recall-by-OTA cost avoidance — and exposes the gap between SDV ambition " +
          "and legacy-architecture reality (doctrine 1).",
      },
    ],

    painThemes: [
      {
        key: "sdv_monetization_gap",
        name: "Software-defined-vehicle monetization gap",
        description:
          "The SDV ambition (recurring software/feature revenue) outruns the " +
          "legacy E/E architecture, tier-1 ECU sprawl, billing capability, and org " +
          "structure required to actually deliver and bill it — so connected-" +
          "services ARPU stays a slide, not a P&L line.",
        detectionSignal:
          "High free-trial attach that collapses after expiry; no recurring-billing " +
          "infrastructure; features still hard-tied to ECUs; software org separate " +
          "from the program/commercial org; OTA adoption low.",
        diagnosticQuestion:
          "What is your PAID connected-services attach and ARPU after free trials " +
          "expire, and can you actually bill and deliver a feature OTA across the " +
          "fleet today?",
      },
      {
        key: "ev_unit_economics",
        name: "EV unit economics & price-war margin compression",
        description:
          "Battery cost, charging-anxiety-driven demand softness, and price wars " +
          "compress EV contribution margin — many programs are loss-making per " +
          "unit — while value cases quietly assume legacy ICE margins on EV volume.",
        detectionSignal:
          "EV contribution margin negative or near-zero; incentives rising; battery " +
          "cost above the program target; demand sensitive to incentives and " +
          "charging access; mix plan ahead of profitable demand.",
        diagnosticQuestion:
          "What is your EV contribution margin per unit at current battery cost and " +
          "incentive level, and how does the mix plan hold if incentives are removed?",
      },
      {
        key: "warranty_recall_exposure",
        name: "Warranty & recall exposure (esp. software-driven)",
        description:
          "Field quality problems surface late through warranty and recall, now " +
          "increasingly driven by software/ADAS, where a single OTA-eligible defect " +
          "can affect an entire fleet cohort — a dominant, volatile risk to value.",
        detectionSignal:
          "Rising warranty cost per vehicle; growing share of software-attributable " +
          "claims and recalls; weak early-warning from field data; long defect-to-" +
          "root-cause cycle; supplier recovery weak.",
        diagnosticQuestion:
          "How early can you detect an emerging field-quality issue from connected " +
          "and warranty data, and what share of recent recalls were software-driven?",
      },
      {
        key: "chip_battery_supply_shock",
        name: "Semiconductor & battery supply shock fragility",
        description:
          "Deep, opaque tier-2/3 dependence on semiconductors and battery cells/" +
          "raw materials leaves programs exposed to allocation shocks that idle " +
          "lines, force feature deletions, and whipsaw days-supply and pricing.",
        detectionSignal:
          "No visibility below tier-1; single-source critical chips/cells; " +
          "build-shy/incomplete vehicles awaiting parts; reactive allocation " +
          "scrambles; days-supply swinging violently.",
        diagnosticQuestion:
          "Do you have visibility into tier-2/3 semiconductor and cell exposure, and " +
          "what is your single-source risk on the chips and cells your top programs " +
          "depend on?",
      },
      {
        key: "launch_complexity_risk",
        name: "Program launch complexity & quality-gate risk",
        description:
          "New platforms, EV content, and software integration multiply launch " +
          "risk; gates slip or are passed dirty under timing pressure, pushing " +
          "defects into the field as warranty and recall.",
        detectionSignal:
          "Slipping APQP/PPAP milestones; open concerns carried past gates; supplier " +
          "PPAP readiness late; software not integration-tested at the gate; launch-" +
          "quality escapes.",
        diagnosticQuestion:
          "How many of your last programs hit SOP on time AND on quality, and how " +
          "many open concerns are typically carried past the launch gate?",
      },
      {
        key: "dealer_network_disruption",
        name: "Dealer network & fixed-operations disruption",
        description:
          "EV's lower service content, agency/direct-sales pressure, and shifting " +
          "owner expectations threaten the dealer fixed-operations profit pool that " +
          "carries network viability, while diagnostic complexity erodes fixed-" +
          "first-visit rates.",
        detectionSignal:
          "Same-store service revenue flat/declining; EV service hours below ICE; " +
          "FFV falling on software faults; technician shortage; channel-model " +
          "conflict (agency/direct vs franchise).",
        diagnosticQuestion:
          "How does your dealer service profit pool hold as EV mix rises, and what is " +
          "happening to fixed-first-visit on software-rich vehicles?",
      },
      {
        key: "data_silo_connected_vehicle",
        name: "Connected-vehicle data fragmentation & consent",
        description:
          "Connected-vehicle data is fragmented across platform, CRM, DMS, and " +
          "quality systems, with consent and privacy constraints — so the data that " +
          "should power quality early-warning, personalization, and monetization " +
          "stays siloed and underused.",
        detectionSignal:
          "No unified vehicle/owner data model; telematics not joined to warranty/" +
          "CRM/DMS; unclear consent posture; analytics built on hand-exported " +
          "extracts; privacy review blocking use cases.",
        diagnosticQuestion:
          "Can you join a VIN's telematics, warranty, service, and owner records " +
          "with clear consent, or does connected data sit siloed and underused?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "early_warranty_quality_detection",
        name: "Early field-quality & warranty signal detection",
        valueMechanism:
          "Fuse connected-vehicle telemetry, warranty/dealer claims, DTCs, and " +
          "social/field signals to detect emerging defects far earlier than claim-" +
          "rate trending alone — shrinking time-to-detect, narrowing recall " +
          "populations, and cutting warranty cost and field-action scope.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Connected-vehicle telemetry / DTCs by VIN",
          "Warranty and dealer claims (parts, labor, narratives)",
          "Build/genealogy and supplier traceability",
          "Field-action and recall history",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Recall and field-action decisions are regulated and safety-critical — quality/legal own the call, AI flags candidates",
          "False positives trigger costly investigations; false negatives miss a safety defect — thresholds and human review are mandatory",
        ],
        metricsMoved: [
          "warranty_cost_per_vehicle",
          "recall_rate",
          "fixed_first_visit_rate",
        ],
      },
      {
        key: "supply_risk_intelligence",
        name: "Semiconductor & battery supply-risk intelligence",
        valueMechanism:
          "Map and monitor multi-tier semiconductor and cell exposure, predict " +
          "shortage and allocation risk, and simulate build/feature trade-offs — " +
          "letting programs protect high-margin builds and stabilize days-supply " +
          "instead of reacting to shocks.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Multi-tier BOM and supplier mapping (incl. tier-2/3 where visible)",
          "Open orders, lead times, and allocation status",
          "Build plan, options/feature take-rates, and margin by configuration",
          "External supply/geopolitical and capacity signals",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Tier-2/3 visibility is often incomplete — model confidence must be honest about blind spots",
          "Allocation and feature-deletion trade-offs are commercial decisions owned by supply chain and program leadership",
        ],
        metricsMoved: [
          "days_supply_inventory",
          "plant_oee",
          "launch_on_time_pct",
        ],
      },
      {
        key: "service_diagnostic_copilot",
        name: "Service technician diagnostic & repair copilot",
        valueMechanism:
          "Give technicians AI-assisted diagnosis from DTCs, symptoms, repair " +
          "history, and technical bulletins — improving fixed-first-visit on complex " +
          "(esp. software/ADAS) faults, cutting comebacks, and protecting service " +
          "revenue and warranty cost.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "DTCs, telematics, and vehicle configuration by VIN",
          "Repair-order history and comeback data (DMS)",
          "Technical service bulletins and repair procedures",
          "Parts catalog and availability",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Misdiagnosis on safety systems (brakes/ADAS) is consequential — technician judgment and sign-off remain authoritative",
          "Recommendations must respect warranty/repair-procedure compliance, not just speed",
        ],
        metricsMoved: [
          "fixed_first_visit_rate",
          "dealer_same_store_service_revenue",
          "warranty_cost_per_vehicle",
        ],
      },
      {
        key: "connected_services_personalization",
        name: "Connected-services monetization & personalization",
        valueMechanism:
          "Use connected-vehicle and owner data to target feature offers, optimize " +
          "trial-to-paid conversion, and personalize ownership — converting the SDV " +
          "ambition into actual paid attach and ARPU, where billing and delivery " +
          "capability exists.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Connected-vehicle usage and feature-eligibility data (consented)",
          "Owner CRM and subscription/billing history",
          "Feature catalog and OTA delivery capability",
          "Consent and privacy posture by region",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Privacy/consent and regional data law bound what owner data may drive offers",
          "Monetization that feels coercive (paywalling expected features) damages loyalty — brand/legal must govern offer policy",
        ],
        metricsMoved: [
          "connected_services_attach_arpu",
          "ota_adoption_rate",
          "repurchase_loyalty_nps",
        ],
      },
      {
        key: "launch_program_intelligence",
        name: "Program launch & quality-gate intelligence",
        valueMechanism:
          "Track program milestones, supplier PPAP readiness, open concerns, and " +
          "software-integration status against gates, predicting slip and launch-" +
          "quality risk early — so the program protects on-time, on-quality SOP and " +
          "keeps defects out of the field.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "PLM/program milestone and gate (APQP/PPAP) status",
          "Supplier readiness and open-concern logs",
          "Software build/integration-test status",
          "Historical launch outcomes and escape data",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Gate pass/fail is an engineering accountability decision, not an automated call",
          "Optimistic readiness signals from suppliers must be validated, not trusted at face value",
        ],
        metricsMoved: [
          "launch_on_time_pct",
          "warranty_cost_per_vehicle",
          "plant_oee",
        ],
      },
      {
        key: "ev_charging_battery_optimization",
        name: "EV battery & charging-experience optimization",
        valueMechanism:
          "Use battery telemetry and charging-network data to optimize battery " +
          "health/warranty reserve, improve range/charging predictability, and " +
          "reduce charging anxiety — protecting EV residuals, warranty cost, and " +
          "the loyalty that underwrites the EV transition.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Battery telemetry (SOC/SOH/thermal/charge cycles) by VIN",
          "Charging-network availability and session data",
          "Battery warranty terms and degradation models",
          "Route/usage and trip context (consented)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Battery safety (thermal events) is a hard constraint — engineering owns any control-affecting recommendation",
          "Degradation/warranty-reserve estimates carry financial-statement implications and need finance/quality validation",
        ],
        metricsMoved: [
          "battery_cost_per_kwh",
          "warranty_cost_per_vehicle",
          "repurchase_loyalty_nps",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "connected_vehicle_data_foundation",
        name: "Unified connected-vehicle & owner data foundation",
        description:
          "A governed data layer that joins VIN-level telemetry, build/genealogy, " +
          "warranty/claims, DMS service, and owner CRM under clear consent — the " +
          "substrate every quality-early-warning, diagnostic, and monetization use " +
          "case depends on, decoupling consumers from fragmented source systems.",
        boundary:
          "Owns data connectivity, identity resolution (VIN/owner), contextualization, " +
          "and consent enforcement; does NOT make field-action, pricing, or vehicle-" +
          "control decisions.",
        humanAccountabilityPoint:
          "Chief Data/Digital Officer (with privacy/legal and product-quality sign-off)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "quality_early_warning_loop",
        name: "Closed-loop field-quality early-warning system",
        description:
          "A detection-to-action loop that mines connected + warranty data for " +
          "emerging defects, routes candidates to quality engineering, and links to " +
          "supplier recovery and field-action workflow — shrinking time-to-detect " +
          "and recall population.",
        boundary:
          "Owns signal detection and candidate routing; does not declare recalls or " +
          "field actions autonomously — quality/legal/regulatory own the decision.",
        humanAccountabilityPoint: "VP Quality / Field Actions Decision Authority",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "multi_tier_supply_visibility",
        name: "Multi-tier supply visibility & resilience platform",
        description:
          "A platform mapping semiconductor and cell exposure below tier-1, " +
          "monitoring allocation/lead-time risk, and simulating build/feature " +
          "trade-offs to protect high-margin builds and stabilize days-supply.",
        boundary:
          "Owns exposure mapping, risk monitoring, and scenario simulation; " +
          "allocation and feature-deletion commitments stay with supply-chain and " +
          "program leadership.",
        humanAccountabilityPoint: "VP Supply Chain / Program Supply Lead",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "ota_software_delivery_platform",
        name: "OTA software delivery & feature-monetization platform",
        description:
          "A platform that delivers validated software/feature packages OTA to the " +
          "fleet, manages campaigns and consent, and connects to recurring billing " +
          "— the operational backbone that turns SDV ambition into delivered " +
          "features and (where billing exists) revenue, including recall-by-OTA.",
        boundary:
          "Owns package delivery, campaign management, and billing integration; " +
          "does NOT certify software safety/homologation or authorize control-" +
          "affecting changes — engineering and regulatory sign-off gate every release.",
        humanAccountabilityPoint: "VP Software Platform / Vehicle Software Release Authority",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Automotive value is unlocked in a deliberate order and sized on the " +
        "right lever. The connected-vehicle and owner data foundation must exist " +
        "before quality early-warning, diagnostic copilots, and monetization can " +
        "deliver — modeled value without it is largely unrealizable. Once data is " +
        "trustworthy, the durable, defensible early economics are WARRANTY/RECALL " +
        "cost avoidance and SUPPLY resilience (protecting margin and capacity), " +
        "with manufacturing OEE and service fixed-operations as solid second-order " +
        "wins. Connected-services ARPU is real value but the SLOWEST and most " +
        "over-promised — gated by billing capability, OTA adoption, and the legacy " +
        "E/E architecture, so it must be sized as conditional, not booked. EV " +
        "programs must be valued at their true (often negative) contribution " +
        "margin, never at legacy ICE margins. And safety/homologation is never a " +
        "value lever to trade against — it caps how far autonomy and OTA control " +
        "can go.",
      dominantHaircutFactors: [
        {
          factor: "Connected-vehicle data readiness, consent & integration",
          rationale:
            "VIN-level telemetry, warranty, service, and owner data are fragmented " +
            "and consent-constrained; until the data foundation is real and lawful, " +
            "quality early-warning, diagnostics, and monetization underperform — the " +
            "largest haircut.",
          typicalHaircut: {
            low: 0.3,
            high: 0.55,
            basis:
              "Repeated experience where connected-data fragmentation and consent " +
              "gaps capped delivered value",
            label: "planning-range",
          },
        },
        {
          factor: "SDV monetization & billing capability gap",
          rationale:
            "Legacy E/E architecture, ECU sprawl, weak recurring-billing, and org " +
            "silos mean connected-services ARPU largely fails to materialize after " +
            "trials expire — so software-revenue value must be heavily discounted.",
          typicalHaircut: {
            low: 0.4,
            high: 0.75,
            basis:
              "Observed collapse of paid attach after free trials and absence of " +
              "billing/delivery capability across most OEMs",
            label: "planning-range",
          },
        },
        {
          factor: "EV unit-economics & price-war erosion",
          rationale:
            "Battery cost, incentives, and price wars compress EV contribution " +
            "margin; value tied to EV volume erodes (or inverts) when modeled at true " +
            "rather than assumed-ICE margins.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "EV programs frequently at or below breakeven contribution under " +
              "current battery cost and incentive levels",
            label: "planning-range",
          },
        },
        {
          factor: "Safety, homologation & regulatory limits on autonomy/OTA",
          rationale:
            "FMVSS/NHTSA, ISO 26262/SOTIF, and homologation bound autonomous and " +
            "control-affecting OTA actions; value requiring crossing the human-" +
            "control line is not realizable.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Automation/OTA scope limited by functional-safety and homologation " +
              "requirements",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Warranty / recall cost avoidance from early-warning + diagnostics",
          range: {
            low: 0.08,
            high: 0.25,
            basis:
              "Reported warranty-cost and recall-population reductions where " +
              "connected + warranty data were joined and acted on",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in warranty cost per vehicle and affected recall " +
            "population on targeted cohorts",
        },
        {
          lever: "Service fixed-operations uplift from diagnostic copilot + FFV",
          range: {
            low: 0.03,
            high: 0.12,
            basis:
              "Same-store service revenue and FFV gains where diagnostic assistance " +
              "reduced comebacks",
            label: "planning-range",
          },
          measuredAs:
            "Relative same-store service revenue uplift and fixed-first-visit-rate " +
            "improvement",
        },
        {
          lever: "Days-supply / capacity protection from supply-risk intelligence",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reduced line-down and build-shy events where multi-tier exposure was " +
              "monitored and builds re-prioritized",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in supply-driven downtime / build-shy units and " +
            "days-supply volatility",
        },
      ],
      timeToValueBand:
        "Connected-vehicle data foundation: 2-4 quarters (the gating investment). " +
        "Warranty/quality early-warning and service diagnostic copilot: 2-3 " +
        "quarters once VIN-level data flows. Supply-risk intelligence and launch " +
        "intelligence: 2-4 quarters. Connected-services monetization: 4-8+ quarters " +
        "and most contingent on billing/OTA capability — never assume fast.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "PLM / program-management (vehicle program & launch)",
          role:
            "System of record for vehicle programs, BOM, milestones, and APQP/PPAP " +
            "launch gates across engineering and the supply base.",
          examples: ["Siemens Teamcenter", "Dassault 3DEXPERIENCE", "PTC Windchill"],
        },
        {
          name: "Connected-vehicle / telematics platform",
          role:
            "Real-time VIN-level telemetry, DTCs, OTA campaigns, and connected-" +
            "services subscription/billing — the SDV operational backbone.",
          examples: [
            "OEM cloud (e.g. AWS/Azure connected-vehicle stacks)",
            "Sonatus / Aurora Labs (OTA & vehicle software)",
            "OEM proprietary telematics control unit + cloud",
          ],
        },
        {
          name: "Warranty & claims management",
          role:
            "Dealer warranty claim capture, validation, supplier recovery, and " +
            "field-action/recall management.",
          examples: ["SAS Warranty", "Tavant", "OEM proprietary warranty systems"],
        },
        {
          name: "DMS (dealer management system)",
          role:
            "Dealer-side system of record for sales, service repair orders, parts, " +
            "and vehicle/owner records at the retail point.",
          examples: ["CDK Global", "Reynolds and Reynolds", "Tekion", "Dealertrack"],
        },
        {
          name: "MES / manufacturing & quality (plant + battery)",
          role:
            "Production execution, OEE, genealogy, and quality dispositions across " +
            "stamping/body/paint/assembly and battery/cell lines.",
          examples: ["Siemens Opcenter", "Rockwell/Plex", "AVEVA MES"],
        },
      ],
      roles: [
        {
          title: "Chief Engineer / Vehicle Line Director (program)",
          accountability:
            "End-to-end program delivery: timing, cost, quality, and launch (SOP) " +
            "for a vehicle line.",
        },
        {
          title: "VP Quality / Field Actions Authority",
          accountability:
            "Warranty cost, recall/field-action decisions, and field-safety quality " +
            "across the parc.",
        },
        {
          title: "VP Supply Chain / Program Supply Lead",
          accountability:
            "Multi-tier supply continuity (chips, cells), allocation decisions, and " +
            "days-supply.",
        },
        {
          title: "VP Software / Vehicle Software Release Authority",
          accountability:
            "Software platform, OTA delivery and release sign-off, and connected-" +
            "services delivery.",
        },
        {
          title: "VP Aftersales / Fixed Operations",
          accountability:
            "Dealer service and parts profitability, fixed-first-visit, and " +
            "technical assistance.",
        },
        {
          title: "Chief Data/Digital Officer",
          accountability:
            "Connected-vehicle/owner data foundation, consent/privacy posture, and " +
            "monetization enablement.",
        },
      ],
      regulatoryFrames: [
        {
          name: "NHTSA / FMVSS (vehicle safety & recalls, US)",
          relevance:
            "Federal Motor Vehicle Safety Standards and NHTSA recall/defect-" +
            "reporting (incl. TREAD/early-warning) govern field-safety obligations " +
            "and bound what can be auto-actioned.",
        },
        {
          name: "ISO 26262 / SOTIF (ISO 21448) functional safety",
          relevance:
            "Automotive functional-safety and safety-of-the-intended-function " +
            "standards bound how autonomously ADAS/AV and control-affecting software " +
            "may act — a hard constraint.",
        },
        {
          name: "Emissions & fuel-economy / ZEV (CAFE, EPA, EU CO2, ZEV mandates)",
          relevance:
            "Fleet emissions and zero-emission-vehicle rules make EV mix a " +
            "compliance lever, not just a demand choice, shaping powertrain strategy.",
        },
        {
          name: "UNECE / type-approval & OTA cybersecurity (UN R155/R156, type approval)",
          relevance:
            "International type-approval, cybersecurity (R155), and software-update " +
            "(R156) regulations govern homologation and OTA, gating cross-market " +
            "software delivery.",
        },
      ],
      canonicalTerms: [
        {
          term: "SDV (software-defined vehicle)",
          definition:
            "A vehicle whose features and value are increasingly delivered and " +
            "updated through software/OTA on a centralized (often zonal) E/E " +
            "architecture, decoupling capability from fixed hardware.",
        },
        {
          term: "APQP / PPAP",
          definition:
            "Advanced Product Quality Planning and Production Part Approval Process — " +
            "the supplier quality-gate discipline governing automotive launches.",
        },
        {
          term: "BEV / PHEV / ICE",
          definition:
            "Battery-electric, plug-in-hybrid, and internal-combustion-engine " +
            "powertrains — the mix split that drives EV economics and compliance.",
        },
        {
          term: "$/kWh (pack-level battery cost)",
          definition:
            "Delivered cost per usable kilowatt-hour at pack level — the dominant " +
            "driver of EV unit economics and ICE cost-parity timing.",
        },
        {
          term: "OTA (over-the-air update)",
          definition:
            "Remote delivery of software/firmware to the vehicle fleet, used for " +
            "features, fixes, and increasingly recall remediation (recall-by-OTA).",
        },
        {
          term: "Fixed operations / fixed-first-visit",
          definition:
            "The dealer service + parts business (fixed ops) and the share of repairs " +
            "resolved correctly on the first visit — the core service-quality metric.",
        },
        {
          term: "Field action / recall (TREAD early-warning)",
          definition:
            "A safety/compliance campaign to remedy a defect across affected VINs; " +
            "TREAD early-warning reporting obligates OEMs to surface emerging field " +
            "data to NHTSA.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Warranty cost and emerging field-quality issues",
        authoritativeSource:
          "Warranty/claims system + connected-vehicle DTCs joined to build genealogy " +
          "and supplier recovery",
        whatGoodEvidenceLooksLike:
          "Warranty cost per vehicle by model-year cohort and failure mode, with " +
          "supplier attribution and a defect-to-root-cause trail, plus connected-data " +
          "early signal.",
        weakEvidenceToReject:
          "An anecdotal warranty number with no cohort, failure-mode attribution, or " +
          "claim-data basis.",
      },
      {
        claim: "Recall rate and field-action exposure",
        authoritativeSource:
          "NHTSA recall filings + internal field-action system with VIN-level " +
          "affected-population data",
        whatGoodEvidenceLooksLike:
          "Campaigns and affected-VIN share by cause (incl. software vs hardware), " +
          "with detection-to-action timing.",
        weakEvidenceToReject:
          "A claim that quality is 'good' or 'bad' with no recall history, affected " +
          "population, or cause breakdown.",
      },
      {
        claim: "EV unit economics and battery cost",
        authoritativeSource:
          "Battery sourcing/BOM cost build-up by chemistry + program contribution-" +
          "margin model",
        whatGoodEvidenceLooksLike:
          "Pack $/kWh by chemistry and supplier against program target, and EV " +
          "contribution margin per unit at current incentive level.",
        weakEvidenceToReject:
          "EV value modeled at legacy ICE margins, or a battery-cost figure with no " +
          "chemistry, scale, or sourcing basis.",
      },
      {
        claim: "Connected-services monetization (attach & ARPU)",
        authoritativeSource:
          "Connected-vehicle subscription/billing system joined to the active " +
          "connected-vehicle population",
        whatGoodEvidenceLooksLike:
          "PAID attach and ARPU after free-trial expiry, with OTA adoption and " +
          "billing-capability evidence by platform/region.",
        weakEvidenceToReject:
          "Free-trial attach or projected ARPU presented as realized recurring " +
          "revenue, with no billing/delivery proof.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your PAID connected-services attach and ARPU after free trials expire, and can you actually deliver and bill a feature OTA across the fleet today?",
      "What is your EV contribution margin per unit at current battery cost and incentive level, and how does the mix plan hold if incentives are removed?",
      "How early can you detect an emerging field-quality issue from connected and warranty data, and what share of recent recalls were software-driven?",
      "Do you have visibility into tier-2/3 semiconductor and battery-cell exposure, and what is your single-source risk on the chips and cells your top programs depend on?",
      "How many of your last programs hit SOP on time AND on quality, and how many open concerns are typically carried past the launch gate?",
      "How does your dealer service profit pool hold as EV mix rises, and what is happening to fixed-first-visit on software-rich vehicles?",
      "Can you join a VIN's telematics, warranty, service, and owner records with clear consent, or does connected-vehicle data sit siloed and underused?",
    ],
    maturitySignals: [
      "A governed connected-vehicle/owner data foundation joins VIN telemetry, warranty, service, and CRM under clear consent — without hand-merging.",
      "Field-quality issues are detected early from connected + warranty data and routed to a defect-to-root-cause and supplier-recovery loop.",
      "Multi-tier semiconductor and cell exposure is mapped below tier-1, with allocation/risk monitored proactively.",
      "EV programs are managed against true contribution margin and a credible battery-cost roadmap, not assumed-ICE economics.",
      "Connected-services have real recurring billing and high OTA adoption, so paid attach and ARPU are growing — not just free-trial attach.",
    ],
    redFlags: [
      "Connected-services value is sized on free-trial attach or projected ARPU the org cannot yet bill or deliver OTA — the SDV is over-promised.",
      "EV programs are valued at legacy ICE margins despite negative or near-zero contribution margin — the business case is fictional.",
      "Field-quality detection relies on lagging warranty-claim trending only, with no connected-data early-warning — recalls surface late and large.",
      "There is no visibility below tier-1 on chips/cells, and critical parts are single-sourced — the supply base is a latent line-down risk.",
      "AI is proposed to take autonomous vehicle-control or auto-disposition recalls/OTA without homologation, functional-safety, and human authority.",
      "VIN-level telematics, warranty, service, and owner data cannot be joined with consent — no usable connected-vehicle data foundation exists.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "DMS (dealer management system) vendors",
        category: "Dealer retail & fixed-operations system of record",
        switchingCost:
          "Extreme — DMS is embedded in dealer sales, service, parts, and accounting; replacement is a high-risk, dealer-by-dealer program.",
        renewalDynamics:
          "Long, sticky contracts with consolidated incumbents; data-access and integration fees are a recurring friction point.",
      },
      {
        vendorName: "Connected-vehicle / OTA platform vendors",
        category: "Telematics, OTA, and connected-services platform",
        switchingCost:
          "High — telematics integration, in-vehicle software stacks, and subscriber base create deep lock-in tied to vehicle architecture.",
        renewalDynamics:
          "Strategic and multi-year; negotiate on data ownership, OTA capability, and avoidance of per-vehicle/per-message cost escalation.",
      },
      {
        vendorName: "Tier-1 suppliers (ECU / ADAS / powertrain)",
        category: "Vehicle hardware + embedded software supply",
        switchingCost:
          "Very high — designed-in components and embedded software are validated per program; re-sourcing requires re-engineering and re-homologation.",
        renewalDynamics:
          "Program-lifetime sourcing; leverage sits at program nomination, not mid-cycle — and ECU sprawl raises software-control friction.",
      },
      {
        vendorName: "Battery cell / pack suppliers",
        category: "EV battery cell and pack supply",
        switchingCost:
          "Very high — chemistry, form-factor, and joint-venture/capacity commitments lock programs to suppliers for years.",
        renewalDynamics:
          "Long-term offtake and JV structures; negotiate on raw-material indexing, capacity guarantees, and chemistry roadmap, not spot price.",
      },
    ],
    switchingCosts:
      "The DMS, connected-vehicle platform, and designed-in tier-1/battery supply " +
      "are effectively non-switchable in isolation; the negotiable value frontier is " +
      "the analytics, software-services, and data layer around them. So contract for " +
      "data ownership, OTA/feature independence, and open interfaces at the " +
      "foundation to keep that frontier competitive and avoid being locked out of " +
      "your own connected-vehicle data.",
    negotiationLevers: [
      "Connected-vehicle data ownership and egress rights — the OEM must own its VIN-level data, not rent it from the platform vendor",
      "Program-nomination leverage with tier-1/battery suppliers (sourcing decisions made at nomination, with raw-material indexing and capacity guarantees)",
      "OTA/feature delivery independence so software revenue is not gated by a single platform vendor's roadmap or per-message economics",
      "Outcome-based terms tied to measured warranty/recall reduction or supply-resilience, with pilot-to-scale parity proof on the OEM's own data",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      warranty_quality_claim: [
        "warranty/claims data by cohort and failure mode",
        "connected-vehicle DTC/telemetry early signal",
        "supplier attribution and defect-to-root-cause trail",
      ],
      recall_exposure_claim: [
        "NHTSA filing / internal field-action record",
        "VIN-level affected population",
        "cause breakdown (software vs hardware) and detection timing",
      ],
      ev_economics_claim: [
        "pack $/kWh by chemistry and supplier vs target",
        "EV contribution margin per unit at current incentive level",
        "explicit statement that ICE margins are NOT assumed",
      ],
      connected_services_claim: [
        "PAID attach and ARPU after trial expiry",
        "OTA adoption rate by platform",
        "recurring-billing and delivery capability evidence",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (esp. data readiness, SDV monetization gap, EV economics, safety limits)",
      ],
    },
    citationStandard:
      "Quantitative automotive claims cite the PLM/warranty/connected-vehicle/DMS/" +
      "MES source and the cohort or period, and state VIN/program/dealer-cohort " +
      "granularity. Quality claims cite cohort and failure mode; EV claims cite " +
      "battery cost basis and true contribution margin (never assumed-ICE); " +
      "connected-services claims cite PAID (post-trial) attach/ARPU. Value " +
      "projections cite a baseline plus a labelled planning range and the haircut " +
      "factors applied — never a single asserted ROI or booked software-revenue.",
  },

  hedgeRules: {
    whenToHedge: [
      "Connected-vehicle data foundation is immature or consent-constrained — frame quality, diagnostic, and monetization value as conditional on data readiness, not achievable numbers.",
      "Connected-services value is discussed — distinguish PAID post-trial attach/ARPU from free-trial attach, and flag billing/OTA capability gaps.",
      "EV economics are discussed — present at true contribution margin and current battery cost/incentive level, never assumed-ICE, and flag price-war sensitivity.",
      "Benchmarks are cited without the OEM/dealer's own cohort data — present as planning ranges.",
      "Vendor-reported warranty-reduction or supply-resilience outcomes are cited — mark as vendor claims pending validation on the tenant's own data.",
    ],
    inferenceLanguage: [
      "Across OEMs, paid connected-services attach after trial expiry typically runs...",
      "Without your battery-cost and margin data, the industry pattern suggests EV contribution margin...",
      "OEMs at this connected-data maturity commonly see warranty early-warning lead times around...",
      "Where the connected-vehicle data foundation is solid, quality-early-warning programs have reduced recall populations by...",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings or ROI for this OEM/dealer",
      "This tenant's actual warranty cost per vehicle, recall rate, or EV contribution margin",
      "A claim that connected-services ARPU is realized recurring revenue without billing/delivery proof",
      "A claim that AI can safely take autonomous vehicle-control or auto-disposition recalls/OTA without the tenant's homologation and functional-safety review",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "warranty / recall cost drivers / where field-quality cost comes from",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack warranty + recall cost by failure mode / system (incl. software vs hardware) to show where field-quality leaks cash.",
    },
    {
      questionPattern: "EV vs ICE unit economics / contribution-margin bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from ICE contribution to EV contribution showing battery cost, incentives, and software/service offsets — true margin, not assumed-ICE.",
    },
    {
      questionPattern: "value or cost impact of an automotive AI program / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from baseline to projected with data-readiness, SDV-monetization, EV-economics, and safety haircuts shown explicitly.",
    },
    {
      questionPattern: "supply / launch risk ranking / which programs or parts are most exposed",
      exhibitKind: "table",
      note: "Risk-ranked programs/parts: single-source exposure, lead-time risk, days-supply impact, launch-gate status, recommended action.",
    },
    {
      questionPattern: "automotive operations KPI scorecard",
      exhibitKind: "table",
      note: "Launch on-time%, warranty $/vehicle, recall rate, same-store service revenue, connected attach/ARPU, EV mix%, $/kWh, plant OEE, days-supply, FFV, loyalty/NPS, OTA adoption vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The connected-vehicle/owner data foundation is funded and built first, with consent governance, so quality, diagnostic, and monetization use cases have a real substrate",
      "Value is scoped on warranty/recall avoidance and supply resilience (the defensible early wins), not on connected-services ARPU the org cannot yet bill",
      "EV programs are managed and valued at true contribution margin with a credible battery-cost roadmap, not assumed-ICE economics",
      "Autonomy/OTA scope is designed inside FMVSS/NHTSA/ISO 26262 and homologation bounds, with human authority on field actions and releases",
    ],
    failureDrivers: [
      "Sizing the case on SDV connected-services revenue the legacy architecture and billing capability cannot deliver — the headline value never materializes",
      "Valuing EV volume at legacy ICE margins, so the business case collapses when true battery cost and price-war incentives are applied",
      "Buying analytics/diagnostic AI before the connected-vehicle data foundation exists — models are confident but unusable",
      "Proposing autonomy or auto-actioned recalls/OTA that cross safety/homologation bounds, which stalls in regulatory review and erodes trust",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Warranty/field-quality early-warning and service diagnostic copilots adopt " +
      "first because the value is tangible and bounded; supply-risk and launch " +
      "intelligence follow as multi-tier data matures; connected-services " +
      "monetization and EV/charging optimization scale slowest, gated by billing/" +
      "OTA capability and battery-cost trajectory; autonomous control actions are " +
      "last, gated by homologation, functional safety, and regulatory approval.",
    roiClarity: "medium",
    roiClarityBasis:
      "Warranty cost per vehicle, recall populations, and days-supply are directly " +
      "measurable, making quality and supply ROI relatively firm where connected " +
      "data exists. But connected-services and EV-economics value is speculative — " +
      "gated by billing/OTA capability and volatile battery cost and incentive " +
      "levels — and attribution is muddied by mix and price wars, so ROI is firm on " +
      "the quality/supply levers and soft on the software/EV levers.",
  },

  regulatoryFrame: {
    name: "Vehicle safety, functional safety & homologation (NHTSA/FMVSS, ISO 26262/SOTIF, UNECE, emissions/ZEV)",
    relevance:
      "The dominant regulatory frame for automotive: NHTSA/FMVSS and TREAD early-" +
      "warning govern field-safety and recall obligations; ISO 26262/SOTIF and " +
      "UNECE type-approval/cybersecurity (R155/R156) bound how autonomously ADAS/AV " +
      "and OTA software may act — safety and homologation are hard constraints, not " +
      "trade-offs. Emissions/fuel-economy and ZEV mandates (CAFE, EPA, EU CO2) make " +
      "EV mix a compliance lever as well as a demand choice (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
