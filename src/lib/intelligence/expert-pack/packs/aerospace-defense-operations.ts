// Consilium expert — Aerospace & Defense: Program, Supply & Sustainment Operations.
//
// W3 industry-wave ExpertPack (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// An industry-function expert covering the operating system of an aerospace &
// defense (A&D) enterprise — primes, defense contractors, and A&D suppliers —
// across the lifecycle that actually governs their economics: program
// management (cost/schedule/EVM), complex engineering & systems integration,
// defense acquisition & contracting (FAR/DFARS, cost-plus vs fixed-price), the
// supply chain (long-lead, sole-source, obsolescence/DMSMS, counterfeit parts),
// low-volume / high-complexity manufacturing, and MRO / sustainment / readiness.
//
// This is DISTINCT from the airline-operations expert (an OPERATOR of aircraft,
// flying schedules) and from the manufacturing-operations expert (high-volume
// discrete/process plant floor). A&D is low-rate, high-mix, program-funded, and
// security/export bounded — its economics are program cost+schedule control and
// supply continuity, not OEE on a fast line or load factor on a route.
//
// CORE DOCTRINE — five honest bounding truths are baked into the content:
// (1) COST & SCHEDULE OVERRUNS ARE ENDEMIC, AND EVM SIGNALS LAG/ARE GAMED.
//     CPI/SPI are the contractual truth language, but they are reported monthly,
//     trail reality, and are routinely managed (re-baselining, optimistic ETCs,
//     rubber-band BCWP). Any AI bet here improves the HONESTY and timeliness of
//     the signal — it does not magically make programs run to plan.
// (2) THE SUPPLY CHAIN IS THE CHRONIC RISK. Sole-source, long-lead, obsolescence
//     (DMSMS), and counterfeit parts drive more program slips than engineering
//     ever does. This is where the durable value and the durable risk both live.
// (3) CONTRACT TYPE BOUNDS THE INCENTIVE. Cost-plus blunts the efficiency
//     incentive (the customer carries overrun risk); fixed-price shifts risk to
//     the contractor and has sunk programs. The contract type — not the
//     technology — sets who wins or loses from an efficiency gain.
// (4) ITAR/EAR EXPORT CONTROL + CMMC/NIST 800-171 ARE HARD CONSTRAINTS, NOT
//     PREFERENCES. They bound where data may live, which models may touch it,
//     which nationals may see it, and which cloud/AI services are even eligible.
//     AI capability is gated by classification and export control, not by model
//     quality — and value that requires crossing that line is not realizable.
// (5) SUSTAINMENT / MRO IS WHERE LIFECYCLE VALUE & READINESS ACTUALLY LIVE. The
//     fielded fleet's mission-capable rate and total ownership cost dwarf the
//     production margin; readiness, not unit cost, is the customer's real
//     objective and the most defensible value pool.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";
import type { ExpertPackIdentity } from "@/lib/intelligence/expert-pack/expert-pack";

const identity = {
  id: "xp.aerospace-defense.program-supply-operations",
  expertName: "Aerospace & Defense Program, Supply & Sustainment Expert",
  kind: "industry-function",
  industry: "aerospace_defense",
  functionKey: "program-supply-operations",
  scopeNote:
    "Industry-function expert for aerospace & defense enterprises — primes, " +
    "defense contractors, and A&D suppliers — spanning the program-to-" +
    "sustainment lifecycle that governs their economics: program management " +
    "(cost/schedule/EVM CPI-SPI, estimate-at-completion), complex engineering " +
    "& systems integration, defense acquisition & contracting (FAR/DFARS, " +
    "cost-plus vs fixed-price risk allocation), supply chain (long-lead, sole-" +
    "source, obsolescence/DMSMS, counterfeit-parts), low-volume/high-complexity " +
    "manufacturing, and MRO/sustainment/readiness. CORE DOCTRINE: cost+schedule " +
    "overruns are endemic and EVM signals lag and are gamed; the supply chain " +
    "is the chronic risk; contract type (cost-plus vs fixed-price) bounds the " +
    "efficiency incentive; ITAR/EAR export control and CMMC/NIST 800-171 are " +
    "hard constraints that bound any data/AI move; and sustainment/MRO is where " +
    "lifecycle value and readiness actually live. Excludes airline-operator " +
    "flight operations (airline-operations expert), high-volume discrete plant-" +
    "floor OEE (manufacturing-operations expert), and corporate M&A (corporate-" +
    "development expert) — this expert owns running A&D programs and their " +
    "supply and sustainment under security and export-control constraints.",
} satisfies ExpertPackIdentity;

export const aerospaceDefenseOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity,

  domain: {
    operatingMetrics: [
      {
        key: "cpi",
        name: "Cost Performance Index (CPI)",
        definition:
          "Earned value (BCWP) divided by actual cost (ACWP) on a program or " +
          "control account — the EVM ratio of work accomplished per dollar spent. " +
          "Below 1.0 means the program is overrunning cost.",
        unit: "ratio (BCWP/ACWP)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.85,
          high: 1.05,
          basis:
            "Development and early-production A&D programs commonly run 0.85-0.98; " +
            "mature production programs approach or exceed 1.0. A CPI sustained " +
            "below ~0.9 signals a program in cost trouble.",
          label: "planning-range",
        },
        dataSource:
          "EVM system / cost-processing engine (e.g. Deltek Cobra, COBRA-fed " +
          "control accounts) reconciled to the accounting system of record",
        whyItMatters:
          "CPI is the contractual language of cost performance and the leading " +
          "input to estimate-at-completion; a deteriorating CPI is the earliest " +
          "defensible signal that a program will overrun — when the data is honest.",
      },
      {
        key: "spi",
        name: "Schedule Performance Index (SPI)",
        definition:
          "Earned value (BCWP) divided by planned value (BCWS) — the EVM ratio " +
          "of work accomplished versus work scheduled. Below 1.0 means the program " +
          "is behind schedule in earned-value terms.",
        unit: "ratio (BCWP/BCWS)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.85,
          high: 1.05,
          basis:
            "Development programs frequently sit 0.85-0.95; SPI distorts late in " +
            "a program (it trends to 1.0 as work completes regardless of lateness), " +
            "so it must be read with a critical-path schedule, not alone.",
          label: "planning-range",
        },
        dataSource:
          "EVM system joined to the integrated master schedule (IMS) in the " +
          "scheduling tool of record (e.g. Microsoft Project, Primavera P6)",
        whyItMatters:
          "SPI quantifies schedule erosion in cost terms and feeds the overrun/" +
          "slip narrative — but its known end-of-program distortion is exactly why " +
          "an honest expert pairs it with critical-path and milestone evidence.",
      },
      {
        key: "eac_variance",
        name: "Estimate-at-Completion (EAC) variance to budget",
        definition:
          "The gap between the current estimate-at-completion and the budget-at-" +
          "completion (BAC), expressed as a percentage of BAC — how far the latest " +
          "honest forecast of total program cost has drifted from the baseline.",
        unit: "% of BAC",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 30,
          basis:
            "Major A&D development programs have historically overrun BAC by " +
            "double digits; GAO has repeatedly reported portfolio cost growth. A " +
            "well-controlled program holds EAC variance in the low single digits.",
          label: "planning-range",
        },
        dataSource:
          "EVM EAC computations (CPI-based, composite, and bottoms-up) versus the " +
          "performance measurement baseline; program management reviews",
        whyItMatters:
          "EAC variance is the program's bottom-line truth — the number a customer, " +
          "auditor, and CFO all care about — and the place where optimistic ETCs " +
          "and re-baselining most often hide the real overrun.",
      },
      {
        key: "otd_to_schedule",
        name: "On-time delivery to contract schedule",
        definition:
          "Share of program milestones, deliverable line items (CDRLs), and end-" +
          "item deliveries met on or before the contractually committed date.",
        unit: "% of milestones/deliveries",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 98,
          basis:
            "Highly program- and maturity-dependent; first-article and development " +
            "deliveries slip far more than steady-state production lots.",
          label: "planning-range",
        },
        dataSource:
          "Program schedule / IMS milestone completion and contract deliverables " +
          "register (CDRL tracking) versus committed dates",
        whyItMatters:
          "On-time delivery is how schedule performance shows up to the customer " +
          "and award-fee boards; chronic milestone slips precede award-fee loss, " +
          "penalties, and re-baselining.",
      },
      {
        key: "supplier_otd_quality",
        name: "Supplier on-time delivery & quality (with sole-source exposure)",
        definition:
          "Blended supplier on-time delivery and incoming-quality acceptance rate, " +
          "tracked alongside the share of spend or part numbers that are single- or " +
          "sole-sourced — the exposure that turns a supplier miss into a program slip.",
        unit: "% OTD / % acceptance / % sole-source spend",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 98,
          basis:
            "Supplier OTD in A&D runs lower than commercial discrete because of " +
            "long-lead and low-volume parts; sole-source exposure of 30-60% of " +
            "critical spend is common and is the real risk number.",
          label: "planning-range",
        },
        dataSource:
          "ERP/SRM supplier performance records (receipts vs promise dates, " +
          "incoming inspection dispositions) and the approved-supplier/sourcing master",
        whyItMatters:
          "Supplier performance and sole-source exposure are the chronic driver of " +
          "A&D program risk; a single late or rejected long-lead, sole-source part " +
          "can slip an entire program more reliably than any engineering issue.",
      },
      {
        key: "first_pass_yield",
        name: "First-pass yield (manufacturing & inspection)",
        definition:
          "Share of units, assemblies, or inspection lots that pass all quality " +
          "requirements the first time with no rework, scrap, or nonconformance — " +
          "the rolled throughput yield across a low-volume, high-complexity build.",
        unit: "% units/lots",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 75,
          high: 97,
          basis:
            "Low-rate, high-complexity A&D builds run below high-volume discrete; " +
            "first-article and new-program builds sit at the low end until the " +
            "process stabilizes.",
          label: "planning-range",
        },
        dataSource:
          "QMS / inspection records and nonconformance (MRB) data per operation, " +
          "joined to the manufacturing execution system (MES)",
        whyItMatters:
          "In low-volume A&D, each scrapped or reworked unit carries enormous sunk " +
          "value and can itself slip a delivery; first-pass yield is the cleanest " +
          "read on build quality and cost of poor quality.",
      },
      {
        key: "mission_capable_rate",
        name: "Mission-capable / readiness rate (sustainment)",
        definition:
          "Share of a fielded fleet or system population that is mission-capable " +
          "(available and able to perform its primary mission) at a point in time — " +
          "the headline readiness measure for sustainment and MRO performance.",
        unit: "% of fleet",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 90,
          basis:
            "Platform- and age-dependent; many fielded fleets have struggled to " +
            "hit mission-capable goals, and GAO has repeatedly reported shortfalls " +
            "against target readiness rates.",
          label: "planning-range",
        },
        dataSource:
          "Sustainment / fleet-management systems and customer readiness reporting " +
          "(maintenance status, supply availability, awaiting-parts data)",
        whyItMatters:
          "Readiness is the customer's true objective and the most defensible " +
          "sustainment value pool; mission-capable rate, not unit production cost, " +
          "is what determines whether the warfighter or operator can fly the fleet.",
      },
      {
        key: "mro_turnaround_time",
        name: "MRO / depot turnaround time (TAT)",
        definition:
          "Average elapsed time to induct, repair/overhaul, and return an asset or " +
          "component to service through depot or organic-level maintenance — the " +
          "throughput measure of the sustainment pipeline.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 365,
          basis:
            "Enormous spread by commodity — line-replaceable units vs full airframe " +
            "depot overhaul; awaiting-parts delays (driven by supply) often dominate " +
            "the cycle.",
          label: "planning-range",
        },
        dataSource:
          "Depot/MRO management system: induction, repair, awaiting-parts, and " +
          "return-to-service timestamps per asset/component",
        whyItMatters:
          "Turnaround time directly sets how much fleet is down at once; shrinking " +
          "TAT (especially awaiting-parts time) raises mission-capable rate without " +
          "buying more spares.",
      },
      {
        key: "dmsms_obsolescence_exposure",
        name: "Obsolescence / DMSMS risk exposure",
        definition:
          "Share of critical parts, components, or microelectronics in a program's " +
          "bill of materials that face Diminishing Manufacturing Sources & Material " +
          "Shortages (DMSMS) — at risk of going non-procurable within the support horizon.",
        unit: "% of critical BOM items at risk",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 25,
          basis:
            "Long-lifecycle defense platforms outlive their commercial component " +
            "supply chains; legacy programs commonly carry double-digit obsolescence " +
            "exposure on microelectronics and specialty parts.",
          label: "planning-range",
        },
        dataSource:
          "BOM/PLM joined to obsolescence-monitoring data and supplier lifecycle " +
          "notices (last-time-buy / end-of-life notifications)",
        whyItMatters:
          "Obsolescence is a slow, certain risk on long-lived platforms; unmanaged " +
          "DMSMS forces costly redesigns, last-time buys, and readiness gaps late " +
          "in a program's life when options are most expensive.",
      },
      {
        key: "copq",
        name: "Cost of poor quality (COPQ)",
        definition:
          "Total cost of scrap, rework, nonconformance/MRB processing, retest, and " +
          "escapes (including warranty and field corrective action) arising from " +
          "defects across build and sustainment.",
        unit: "% of cost of sales (or $)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 15,
          basis:
            "High in low-volume, high-complexity A&D where each defect is expensive " +
            "and escapes carry safety and airworthiness consequences; well-run " +
            "programs drive toward the low end.",
          label: "planning-range",
        },
        dataSource:
          "QMS nonconformance/MRB and rework data joined to ERP cost; warranty and " +
          "field-corrective-action records",
        whyItMatters:
          "COPQ is a dominant, under-measured cash drain in A&D and carries " +
          "airworthiness/safety exposure; reducing it improves both margin and the " +
          "AS9100 quality posture customers audit.",
      },
      {
        key: "proposal_win_rate",
        name: "Proposal win rate (capture)",
        definition:
          "Share of bid/proposal pursuits won, by count or by contract value, across " +
          "the new-business pipeline — the front-end measure of capture effectiveness.",
        unit: "% of pursuits won (by value)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Strongly dependent on incumbency and competition; re-competes and " +
            "sole-source follow-ons win far higher than open competitive new starts.",
          label: "planning-range",
        },
        dataSource:
          "Capture/CRM pipeline and proposal records (pursuits, bids, wins) joined " +
          "to contract award data",
        whyItMatters:
          "Win rate drives the backlog that funds the enterprise; a thin or " +
          "deteriorating win rate is an early signal of revenue risk and of bidding " +
          "the wrong programs or mis-pricing risk.",
      },
      {
        key: "contract_cost_type_mix",
        name: "Contract cost-type mix (cost-plus vs fixed-price)",
        definition:
          "Share of backlog or revenue under cost-reimbursable (cost-plus) versus " +
          "fixed-price contract types — the portfolio-level read on who carries cost-" +
          "overrun risk, the contractor or the customer.",
        unit: "% of backlog by contract type",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "No universal 'good' value — the healthy mix depends on program maturity " +
            "and risk; a heavy fixed-price tilt on immature development scope is a " +
            "known way contractors have sunk programs.",
          label: "planning-range",
        },
        dataSource:
          "Contracts/backlog system: contract type, value, and program maturity by " +
          "award (CLIN-level structure)",
        whyItMatters:
          "Cost-type mix sets the enterprise's risk allocation: cost-plus blunts the " +
          "efficiency incentive while fixed-price shifts overrun risk to the " +
          "contractor — so the same operational improvement is worth very different " +
          "amounts depending on the mix.",
      },
    ],

    painThemes: [
      {
        key: "cost_schedule_overrun_endemic",
        name: "Endemic cost & schedule overruns with lagging/gamed EVM",
        description:
          "Programs routinely overrun cost and slip schedule, while the EVM signals " +
          "meant to catch it (CPI/SPI) report monthly, trail reality, and are managed " +
          "— re-baselining, optimistic ETCs, and BCWP that does not reflect true " +
          "physical progress — so leadership learns of trouble late.",
        detectionSignal:
          "Frequent baseline changes; EAC consistently revised upward; CPI/SPI hover " +
          "near 1.0 while milestones visibly slip; large management-reserve draws; SPI " +
          "trending to 1.0 late while delivery is still late.",
        diagnosticQuestion:
          "How often is the performance measurement baseline re-baselined, and when " +
          "you compare CPI/SPI to physical milestone completion and the critical path, " +
          "do they tell the same story?",
      },
      {
        key: "supply_chain_chronic_risk",
        name: "Sole-source, long-lead supply chain as the chronic program risk",
        description:
          "Critical parts are single- or sole-sourced with long lead times; a single " +
          "supplier miss, quality reject, or capacity constraint cascades into a " +
          "program slip, and qualifying an alternate source is itself a long, costly, " +
          "certification-bound effort.",
        detectionSignal:
          "High share of sole-source critical spend; long and lengthening lead times; " +
          "expediting and recovery schedules routine; second-source qualification " +
          "rarely funded; supplier financial-health surprises.",
        diagnosticQuestion:
          "What share of your critical parts are sole-sourced, what are their lead " +
          "times, and which of them have no qualified alternate and no obsolescence plan?",
      },
      {
        key: "obsolescence_dmsms",
        name: "Obsolescence / DMSMS on long-lived platforms",
        description:
          "Defense platforms outlive their commercial component supply chains, so " +
          "microelectronics and specialty parts go non-procurable mid-life; unmanaged, " +
          "this forces emergency last-time buys, costly redesigns, and readiness gaps.",
        detectionSignal:
          "Reactive last-time-buy scrambles; end-of-life notices unmonitored; no " +
          "proactive DMSMS management plan; bridge buys depleting; redesigns triggered " +
          "by part unavailability rather than requirement change.",
        diagnosticQuestion:
          "How do you monitor end-of-life and DMSMS notices across your critical BOM, " +
          "and how much of your obsolescence response today is proactive versus a scramble?",
      },
      {
        key: "counterfeit_parts",
        name: "Counterfeit & non-conforming parts in the supply chain",
        description:
          "Gray-market and counterfeit parts — especially microelectronics sourced " +
          "outside franchised channels — introduce safety, airworthiness, and security " +
          "risk; detection is hard and the consequence of an escape is severe.",
        detectionSignal:
          "Buys from non-franchised/brokers without provenance; thin incoming " +
          "authentication/test; no chain-of-custody or DNA/marking program; reliance " +
          "on price-driven sourcing for scarce parts.",
        diagnosticQuestion:
          "When you must buy a scarce part outside franchised distribution, what " +
          "provenance, authentication, and test controls prevent a counterfeit escape?",
      },
      {
        key: "contract_type_incentive_misalignment",
        name: "Contract-type / incentive misalignment",
        description:
          "Cost-plus contracts blunt the efficiency incentive because the customer " +
          "carries overrun risk, while fixed-price contracts on immature or high-" +
          "uncertainty scope shift risk dangerously to the contractor — and an " +
          "operational improvement is worth very different amounts under each.",
        detectionSignal:
          "Fixed-price commitments on still-maturing development scope; efficiency " +
          "initiatives that reduce reimbursable cost (and thus fee) without offsetting " +
          "incentive; forward-pricing and rate disputes; loss reserves on FP programs.",
        diagnosticQuestion:
          "For each major program, what is the contract type, and does the way you'd " +
          "capture an efficiency gain actually reward the enterprise under that type?",
      },
      {
        key: "export_control_security_constraint",
        name: "ITAR/EAR export control & CMMC/NIST 800-171 as hard data/AI constraints",
        description:
          "Technical data, designs, and even where it is processed are bounded by " +
          "ITAR/EAR export control and CMMC/NIST 800-171 cybersecurity requirements; " +
          "these dictate which clouds, AI services, and people may touch the data, " +
          "and a misstep is a compliance violation, not a performance issue.",
        detectionSignal:
          "Unclear data classification (CUI/technical data); ad-hoc use of public AI " +
          "services on controlled data; gaps against CMMC/NIST 800-171; foreign-person " +
          "access not gated; no export jurisdiction/classification on technical data.",
        diagnosticQuestion:
          "Which of your data is ITAR/EAR-controlled or CUI, what is your CMMC/800-171 " +
          "posture, and which AI/cloud services are actually eligible to process it?",
      },
      {
        key: "sustainment_readiness_underfunded",
        name: "Sustainment / MRO and readiness treated as the afterthought",
        description:
          "Lifecycle value and readiness live in sustainment, yet programs optimize " +
          "for production cost and treat MRO, spares, and supportability as downstream " +
          "— so awaiting-parts delays and total ownership cost erode mission-capable " +
          "rates the production margin can never offset.",
        detectionSignal:
          "Mission-capable rate below target; large awaiting-parts time in MRO TAT; " +
          "supportability not designed in; spares provisioning reactive; total " +
          "ownership cost not modeled at design; sustainment data siloed from program.",
        diagnosticQuestion:
          "What is your fielded mission-capable rate, how much of MRO turnaround is " +
          "awaiting-parts, and was supportability and total ownership cost designed in " +
          "or bolted on?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "evm_early_warning",
        name: "EVM early-warning & honest estimate-at-completion",
        valueMechanism:
          "Continuously analyze EVM, schedule, and actuals data to surface " +
          "deteriorating control accounts before the monthly report, stress-test " +
          "optimistic ETCs against historical CPI trends and physical progress, and " +
          "flag re-baselining that masks overrun — improving the timeliness and " +
          "honesty of the cost/schedule signal so leadership intervenes earlier.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "EVM cost data (BCWS/BCWP/ACWP) by control account",
          "Integrated master schedule / critical path",
          "Actual cost and labor charging from the accounting system",
          "Historical program EAC and baseline-change history",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI improves the signal but cannot make a program run to plan — over-claiming this is the classic over-promise",
          "Garbage-in risk: if BCWP is gamed at the source, model outputs are confident but wrong; flag data-honesty, don't launder it",
        ],
        metricsMoved: [
          "cpi",
          "spi",
          "eac_variance",
          "otd_to_schedule",
        ],
      },
      {
        key: "supply_risk_intelligence",
        name: "Supply-chain risk intelligence (sole-source, lead-time, supplier health)",
        valueMechanism:
          "Fuse BOM, supplier performance, lead-time, sole-source exposure, and " +
          "external supplier-financial-health and disruption signals to rank the " +
          "parts and suppliers most likely to slip a program and recommend mitigation " +
          "(buffer, second-source qualification, bridge buys) before a miss cascades " +
          "into a delivery slip.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Indented BOM / PLM with criticality and lead times",
          "Supplier on-time-delivery and incoming-quality history (ERP/SRM)",
          "Sole-source / approved-supplier master",
          "External supplier financial-health and disruption signals (where lawful)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Mitigation actions (second-source, redesign) are certification- and contract-bound — supply chain and engineering own the decision",
          "External signal quality varies; flag inferred supplier risk as inference pending confirmation, not fact",
        ],
        metricsMoved: [
          "supplier_otd_quality",
          "otd_to_schedule",
          "dmsms_obsolescence_exposure",
        ],
      },
      {
        key: "obsolescence_dmsms_management",
        name: "Obsolescence / DMSMS predictive management",
        valueMechanism:
          "Monitor end-of-life and DMSMS notices across the critical BOM, predict " +
          "which parts will go non-procurable within the support horizon, and sequence " +
          "proactive responses (last-time buys, qualified alternates, planned " +
          "redesign) — converting reactive obsolescence scrambles into planned, lower-" +
          "cost lifecycle decisions and protecting readiness.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Critical BOM / PLM part master with lifecycle status",
          "Supplier end-of-life / last-time-buy notices",
          "Obsolescence-monitoring data feeds",
          "Support horizon and fielded-fleet demand forecast",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Redesign and alternate-part decisions are airworthiness/qualification-bound — engineering and the customer own approval",
          "Predicted obsolescence dates are probabilistic; over-buying on a wrong prediction strands capital, under-buying risks readiness",
        ],
        metricsMoved: [
          "dmsms_obsolescence_exposure",
          "mission_capable_rate",
          "mro_turnaround_time",
        ],
      },
      {
        key: "proposal_capture_assistant",
        name: "Proposal & capture intelligence (compliant, cost-honest bids)",
        valueMechanism:
          "Accelerate proposal development by retrieving and reusing compliant past-" +
          "performance and technical narrative, checking responses against the " +
          "solicitation's Section L/M and FAR/DFARS requirements, and pressure-testing " +
          "the basis-of-estimate against historical actuals — improving win rate and, " +
          "as importantly, avoiding the under-priced fixed-price bids that sink programs.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Past-performance and proposal library (export-control segregated)",
          "Solicitation text (Sections L/M, SOW, FAR/DFARS clauses)",
          "Historical cost actuals / basis-of-estimate data",
          "Win/loss and capture pipeline records",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Bid content and pricing carry legal/competitive exposure — capture and contracts leadership own and certify the proposal",
          "Proposal data is often export-controlled/competition-sensitive; the assistant must run inside the compliant enclave only",
        ],
        metricsMoved: [
          "proposal_win_rate",
          "contract_cost_type_mix",
        ],
      },
      {
        key: "sustainment_readiness_optimization",
        name: "Sustainment & MRO readiness optimization (predictive support)",
        valueMechanism:
          "Combine fleet condition, maintenance, and spares data to forecast demand, " +
          "reduce awaiting-parts time, and prioritize depot/MRO throughput at the " +
          "assets that most constrain mission-capable rate — lifting readiness and " +
          "cutting total ownership cost without simply buying more spares.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Fleet/asset condition and maintenance history",
          "Spares inventory and provisioning data",
          "MRO/depot induction-to-return timestamps",
          "Mission-capable / readiness reporting",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Maintenance and airworthiness decisions stay with certified maintainers — AI prioritizes and forecasts, humans disposition",
          "Readiness data is often customer/government-owned and access-bounded; respect data-rights and security boundaries",
        ],
        metricsMoved: [
          "mission_capable_rate",
          "mro_turnaround_time",
          "supplier_otd_quality",
        ],
      },
      {
        key: "quality_nonconformance_intelligence",
        name: "Manufacturing quality & nonconformance intelligence",
        valueMechanism:
          "Analyze inspection, nonconformance/MRB, and process data on low-volume, " +
          "high-complexity builds to surface recurring defect drivers and predict " +
          "first-article and lot quality risk — lifting first-pass yield and cutting " +
          "cost of poor quality before defects become expensive scrap or airworthiness escapes.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "QMS inspection and nonconformance/MRB records",
          "MES operation and process data",
          "As-built / as-designed configuration (PLM)",
          "Escape / corrective-action history",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Quality dispositions on flight-critical product require certified engineering/quality sign-off — AI flags, it does not disposition",
          "Low-volume data is sparse; predictions are weak early and must be presented as risk indications, not verdicts",
        ],
        metricsMoved: [
          "first_pass_yield",
          "copq",
          "otd_to_schedule",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "compliant_ai_enclave",
        name: "Export-controlled, CMMC-compliant AI/data enclave",
        description:
          "A segregated, accredited environment (e.g. GovCloud / IL-level / sovereign " +
          "enclave) where controlled technical data and CUI are processed by AI " +
          "services that meet ITAR/EAR export-control and CMMC/NIST 800-171 " +
          "requirements, with foreign-person access gating and full audit — the " +
          "prerequisite that makes ANY AI use case on controlled data eligible.",
        boundary:
          "Owns the compliant processing boundary, data classification, and access " +
          "control; does NOT relax export-control or accreditation rules to fit a " +
          "use case, and excludes uncontrolled/public AI services on controlled data.",
        humanAccountabilityPoint:
          "Empowered Official / Export Compliance Officer with the CISO (CMMC/800-171 sign-off)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "evm_program_control_layer",
        name: "Honest EVM & program-control early-warning layer",
        description:
          "An analytics layer over the EVM, schedule, and actuals systems that " +
          "decomposes CPI/SPI, stress-tests EAC against history and physical progress, " +
          "and flags re-baselining and gamed BCWP — giving program leadership an " +
          "earlier, harder-to-game read on cost and schedule trouble.",
        boundary:
          "Owns analysis and early-warning of program performance; does not author " +
          "the customer-reported EVM submission or override the program manager's " +
          "EAC of record without governance.",
        humanAccountabilityPoint: "Program Manager (with the Program Control / EVM lead)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "supply_risk_control_tower",
        name: "A&D supply-chain risk control tower",
        description:
          "A control tower joining BOM criticality, supplier performance, lead-time, " +
          "sole-source exposure, obsolescence/DMSMS, and external disruption signals " +
          "to rank and mitigate the parts and suppliers most likely to slip a program " +
          "— with counterfeit-prevention provenance controls built into sourcing.",
        boundary:
          "Owns risk ranking and mitigation recommendation; supply chain and " +
          "engineering retain authority on second-source qualification, buys, and " +
          "redesign, all certification- and contract-bound.",
        humanAccountabilityPoint: "Supply Chain / Procurement Director (with Chief Engineer)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "sustainment_readiness_platform",
        name: "Predictive sustainment & readiness platform",
        description:
          "A platform combining fleet condition, maintenance, spares, and MRO " +
          "throughput data to forecast support demand, cut awaiting-parts time, and " +
          "prioritize depot work at the assets that most constrain mission-capable " +
          "rate — managing readiness and total ownership cost as the primary outcome.",
        boundary:
          "Owns forecasting and prioritization; certified maintainers retain " +
          "airworthiness and maintenance-disposition authority, and government data-" +
          "rights and security boundaries are respected.",
        humanAccountabilityPoint: "Sustainment / Product Support Manager (with airworthiness authority)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "A&D value is unlocked in a strict order and bounded by hard constraints. " +
        "FIRST, nothing AI-driven on controlled data is realizable until a " +
        "compliant, export-controlled, CMMC-accredited enclave exists — modeled " +
        "value outside that boundary is not realizable, it is a compliance " +
        "violation waiting to happen. With that foundation, the durable, " +
        "defensible economics are program cost/schedule honesty (earlier, harder-" +
        "to-game EVM signals that let leadership intervene before overruns " +
        "compound), supply continuity (avoiding the sole-source/long-lead/" +
        "obsolescence slips that drive most program risk), and sustainment " +
        "readiness (mission-capable rate and total ownership cost, where lifecycle " +
        "value truly lives). CRUCIALLY, the worth of any efficiency gain depends " +
        "on contract type: under cost-plus the customer captures most cost savings " +
        "(and fee may even fall), while under fixed-price the contractor keeps the " +
        "gain but also the risk — so value must be sized per program, not " +
        "enterprise-wide. AI improves the honesty and timeliness of signals; it " +
        "does not make programs run to plan, and sizing value on that fiction is " +
        "the most common over-promise.",
      dominantHaircutFactors: [
        {
          factor: "Export control & security accreditation (ITAR/EAR, CMMC/800-171)",
          rationale:
            "Controlled data and CUI can only be processed in accredited, export-" +
            "compliant environments with foreign-person gating; until that enclave " +
            "exists and eligible AI services are approved, most use-case value is " +
            "simply ineligible — the single largest and hardest haircut.",
          typicalHaircut: {
            low: 0.3,
            high: 0.6,
            basis:
              "Share of theoretical AI value gated by classification, export " +
              "control, and accreditation timelines on controlled programs",
            label: "planning-range",
          },
        },
        {
          factor: "Contract type / incentive allocation (cost-plus vs fixed-price)",
          rationale:
            "Under cost-plus, efficiency savings flow to the customer and can reduce " +
            "fee, so the contractor captures little; the realizable enterprise value " +
            "of an operational gain depends entirely on the program's contract type.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Portion of operational savings not retained by the contractor on " +
              "cost-reimbursable backlog",
            label: "planning-range",
          },
        },
        {
          factor: "EVM/data honesty & program-control maturity",
          rationale:
            "If BCWP is gamed and baselines churn, AI signals inherit the dishonesty; " +
            "value depends on the program-control discipline that makes the underlying " +
            "EVM and schedule data trustworthy, which is uneven across programs.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Erosion of early-warning value where source EVM/schedule data is " +
              "gamed or low-discipline",
            label: "planning-range",
          },
        },
        {
          factor: "Supply-chain & certification rigidity",
          rationale:
            "Mitigations identified by AI (second-source, redesign, alternate parts) " +
            "are long, costly, and certification-bound, so a share of identified risk-" +
            "reduction value cannot be acted on within the program's window.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Identified supply mitigations not realizable within qualification/" +
              "certification and contract timelines",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Cost/schedule overrun avoided via earlier EVM intervention",
          range: {
            low: 0.02,
            high: 0.1,
            basis:
              "Share of program cost protected where earlier, honest EVM warning " +
              "enabled intervention before overruns compounded; expressed relative to " +
              "program cost, not as a guaranteed saving",
            label: "planning-range",
          },
          measuredAs: "Relative program cost-overrun avoided on targeted programs",
        },
        {
          lever: "Schedule-slip reduction from supply-risk & obsolescence management",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reduction in supply-driven program slips where sole-source/long-lead/" +
              "DMSMS risk was actively managed",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in supply-caused milestone slips",
        },
        {
          lever: "Mission-capable rate improvement from predictive sustainment",
          range: {
            low: 0.02,
            high: 0.12,
            basis:
              "Absolute mission-capable percentage-point gains where awaiting-parts " +
              "time and depot throughput were optimized; expressed as percentage points",
            label: "planning-range",
          },
          measuredAs: "Absolute mission-capable percentage-point improvement on the fielded fleet",
        },
      ],
      timeToValueBand:
        "Compliant export-controlled/CMMC enclave: 2-4 quarters and the gating " +
        "investment (often longer if accreditation is from scratch). EVM early-" +
        "warning and supply-risk intelligence: 2-3 quarters once data access inside " +
        "the enclave is sorted. Obsolescence/DMSMS and proposal/capture intelligence: " +
        "3-4 quarters. Predictive sustainment & readiness optimization: 4-6 quarters " +
        "and most dependent on fleet-data access and government data-rights.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "EVM / program-control system",
          role:
            "System of record for earned-value management: control accounts, BCWS/" +
            "BCWP/ACWP, CPI/SPI, EAC, and the performance measurement baseline.",
          examples: ["Deltek Cobra", "Deltek MPM", "Encore Analytics Empower", "Microsoft Project / Primavera P6 (schedule)"],
        },
        {
          name: "ERP / government-contract accounting",
          role:
            "Program cost, project accounting, indirect-rate and DCAA-compliant " +
            "cost accumulation, procurement, and inventory for contract performance.",
          examples: ["Deltek Costpoint", "SAP S/4HANA (A&D)", "Oracle", "Infor"],
        },
        {
          name: "PLM / configuration & BOM management",
          role:
            "Engineering bill of materials, configuration, as-designed/as-built, " +
            "and change/effectivity control across the product lifecycle.",
          examples: ["Siemens Teamcenter", "PTC Windchill", "Dassault ENOVIA / 3DEXPERIENCE"],
        },
        {
          name: "MES / quality (QMS)",
          role:
            "Manufacturing execution, as-built genealogy, inspection, nonconformance/" +
            "MRB, and AS9100 quality records for low-volume, high-complexity builds.",
          examples: ["Siemens Opcenter", "iBASEt Solumina (MES/MRO)", "ETQ / MasterControl (QMS)"],
        },
        {
          name: "MRO / sustainment & fleet-management system",
          role:
            "Depot/MRO induction-to-return, maintenance, spares provisioning, and " +
            "fielded-fleet readiness and configuration management.",
          examples: ["IFS (A&D/MRO)", "iBASEt Solumina MRO", "GOLDesp / GOLD (PBL sustainment)"],
        },
      ],
      roles: [
        {
          title: "Program Manager (PM)",
          accountability: "Program cost, schedule, technical performance, and customer/award-fee outcomes.",
        },
        {
          title: "Program Control / EVM Lead",
          accountability: "EVM system integrity (EVMS ANSI-748), CPI/SPI, EAC, and baseline management.",
        },
        {
          title: "Chief Engineer / Engineering Lead",
          accountability: "Technical performance, systems integration, design maturity, and airworthiness.",
        },
        {
          title: "Supply Chain / Procurement Director",
          accountability: "Supplier performance, sole-source and obsolescence risk, and counterfeit prevention.",
        },
        {
          title: "Contracts Manager / Empowered Official",
          accountability: "FAR/DFARS compliance, contract type & risk allocation, and export-control (ITAR/EAR) authorization.",
        },
        {
          title: "Product Support / Sustainment Manager",
          accountability: "Mission-capable rate, MRO turnaround, total ownership cost, and supportability.",
        },
        {
          title: "CISO / CMMC Lead",
          accountability: "CMMC / NIST 800-171 posture, CUI protection, and accreditation of compliant enclaves.",
        },
      ],
      regulatoryFrames: [
        {
          name: "FAR / DFARS (federal & defense acquisition regulation)",
          relevance:
            "Govern contract type, allowable cost, cost-accounting standards (CAS), " +
            "and the clause regime that defines how A&D contracts are priced, " +
            "performed, and audited (DCAA).",
        },
        {
          name: "ITAR / EAR (export control)",
          relevance:
            "Control defense articles, technical data, and dual-use items — bounding " +
            "where data may reside, which nationals may access it, and which AI/cloud " +
            "services are eligible; a hard constraint, not a preference.",
        },
        {
          name: "CMMC / NIST SP 800-171 (cybersecurity)",
          relevance:
            "Mandate protection of Controlled Unclassified Information (CUI) across " +
            "the defense supply chain; CMMC certification gates eligibility to hold " +
            "controlled data and therefore which environments AI may run in.",
        },
        {
          name: "AS9100 / AS9145 (aerospace quality management)",
          relevance:
            "Aerospace quality-management and advanced product-quality-planning " +
            "standards that govern build quality, nonconformance, traceability, and " +
            "what may be auto-dispositioned on flight-critical product.",
        },
        {
          name: "EVMS ANSI/EIA-748",
          relevance:
            "The earned-value management system standard major programs must comply " +
            "with; defines the integrity rules an EVM early-warning layer must respect " +
            "rather than circumvent.",
        },
      ],
      canonicalTerms: [
        {
          term: "EVM (CPI / SPI / EAC / BAC)",
          definition:
            "Earned Value Management: Cost/Schedule Performance Indices, Estimate-at-" +
            "Completion, and Budget-at-Completion — the cost/schedule control language " +
            "of A&D programs.",
        },
        {
          term: "Cost-plus vs fixed-price",
          definition:
            "Cost-reimbursable contracts where the customer carries overrun risk and " +
            "pays cost plus fee, versus firm-fixed-price where the contractor carries " +
            "the cost risk for a set price — the core risk-allocation choice.",
        },
        {
          term: "DMSMS / obsolescence",
          definition:
            "Diminishing Manufacturing Sources & Material Shortages — the loss of " +
            "manufacturers or supply for parts on long-lived platforms, forcing last-" +
            "time buys, alternates, or redesign.",
        },
        {
          term: "Sole-source / long-lead",
          definition:
            "Parts available from a single qualified supplier and/or with long " +
            "procurement lead times — the structural drivers of A&D supply risk and " +
            "program slips.",
        },
        {
          term: "MRO / sustainment / PBL",
          definition:
            "Maintenance, Repair & Overhaul and the broader sustainment of a fielded " +
            "fleet; Performance-Based Logistics ties contractor payment to readiness " +
            "outcomes rather than parts/labor.",
        },
        {
          term: "Mission-capable rate",
          definition:
            "Share of a fielded fleet able to perform its primary mission — the " +
            "headline readiness measure customers (and GAO) hold programs to.",
        },
        {
          term: "CUI / Controlled Unclassified Information",
          definition:
            "Sensitive but unclassified information requiring safeguarding under " +
            "NIST 800-171/CMMC; its presence dictates which environments and AI " +
            "services are eligible to process it.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Program cost & schedule performance (CPI/SPI/EAC)",
        authoritativeSource:
          "EVM system (BCWS/BCWP/ACWP by control account) reconciled to the " +
          "accounting system and the integrated master schedule",
        whatGoodEvidenceLooksLike:
          "CPI/SPI and EAC by control account, reconciled to actuals, with baseline-" +
          "change history and physical milestone completion that corroborate the ratios.",
        weakEvidenceToReject:
          "A single program-level CPI/SPI with no control-account decomposition, no " +
          "reconciliation to actuals, and no view of re-baselining or critical path.",
      },
      {
        claim: "Supplier and sole-source / supply-chain risk",
        authoritativeSource:
          "ERP/SRM supplier performance (receipts vs promise, incoming inspection) " +
          "joined to the BOM criticality and approved-supplier master",
        whatGoodEvidenceLooksLike:
          "Supplier OTD and acceptance by part, sole-source exposure on critical " +
          "spend, lead times, and qualified-alternate status for the riskiest parts.",
        weakEvidenceToReject:
          "An assertion that 'suppliers are mostly fine' with no OTD/quality data, " +
          "no sole-source exposure number, and no lead-time or criticality basis.",
      },
      {
        claim: "Obsolescence / DMSMS exposure",
        authoritativeSource:
          "Critical BOM/PLM joined to obsolescence-monitoring data and supplier end-" +
          "of-life / last-time-buy notices",
        whatGoodEvidenceLooksLike:
          "Share of critical BOM items at obsolescence risk within the support " +
          "horizon, with lifecycle status, mitigation status, and bridge-buy coverage.",
        weakEvidenceToReject:
          "A claim that obsolescence 'is handled' with no critical-BOM coverage, no " +
          "end-of-life monitoring, and only reactive last-time-buy anecdotes.",
      },
      {
        claim: "Sustainment readiness & MRO performance",
        authoritativeSource:
          "Sustainment/fleet-management and MRO systems: mission-capable status and " +
          "depot induction-to-return (including awaiting-parts) timestamps",
        whatGoodEvidenceLooksLike:
          "Mission-capable rate against target and MRO turnaround decomposed into " +
          "repair vs awaiting-parts time, by asset/commodity over a defined period.",
        weakEvidenceToReject:
          "A headline 'readiness is good' with no mission-capable rate, no target, " +
          "and no breakdown of where MRO turnaround time is actually lost.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "For your major programs, what are CPI and SPI by control account, how often is the baseline re-baselined, and do the ratios agree with physical milestone completion and the critical path?",
      "What share of your EAC variance to budget is acknowledged today, and how are optimistic ETCs and management-reserve draws governed?",
      "What share of your critical parts are sole-sourced, what are their lead times, and which have no qualified alternate and no obsolescence/DMSMS plan?",
      "When you must buy a scarce part outside franchised distribution, what provenance, authentication, and test controls prevent a counterfeit escape?",
      "Which of your data is ITAR/EAR-controlled or CUI, what is your CMMC / NIST 800-171 posture, and which AI/cloud services are actually eligible to process it?",
      "For each major program, what is the contract type, and does the way you'd capture an efficiency gain actually reward the enterprise under cost-plus versus fixed-price?",
      "What is your fielded mission-capable rate against target, how much of MRO turnaround is awaiting-parts, and was supportability and total ownership cost designed in or bolted on?",
    ],
    maturitySignals: [
      "A compliant, export-controlled, CMMC-accredited enclave exists and the eligible AI/cloud services for controlled data are explicitly defined.",
      "EVM is decomposed to control accounts, EAC is stress-tested against history and physical progress, and re-baselining is governed and visible.",
      "Sole-source exposure, lead times, and obsolescence/DMSMS risk are actively monitored with funded second-source and mitigation plans, not reactive scrambles.",
      "Contract type and incentive allocation are explicitly factored into how operational improvements are valued, program by program.",
      "Sustainment, supportability, and total ownership cost are designed in, and mission-capable rate is managed as a primary outcome with awaiting-parts time tracked.",
    ],
    redFlags: [
      "EVM CPI/SPI are reported only at program level, baselines churn frequently, and the ratios do not agree with physical milestone completion — the cost/schedule signal is not trustworthy.",
      "A high share of critical parts is sole-sourced with long lead times and no qualified alternate or obsolescence plan — a single supplier miss can slip the program.",
      "Controlled (ITAR/EAR) data or CUI is being processed on non-accredited or public AI services, or CMMC/800-171 gaps are open — a compliance violation, not a performance gap.",
      "Fixed-price commitments sit on still-maturing development scope, or efficiency initiatives are pursued without regard to whether the contract type lets the enterprise keep the gain.",
      "Mission-capable rate is below target with large awaiting-parts time, and supportability/total ownership cost were never designed in — readiness is eroding regardless of production margin.",
      "AI is proposed to auto-disposition flight-critical product or to make program/EAC commitments without certified human authority and export-control review.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "EVM / program-control vendors (e.g. Deltek Cobra, Encore Empower)",
        category: "Earned-value management / program control",
        switchingCost:
          "High — EVM tooling is embedded in control-account structure, customer EVMS " +
          "compliance, and historical baselines; migration is a major, audited program.",
        renewalDynamics:
          "Long enterprise terms tied to EVMS ANSI-748 compliance; rarely re-sourced " +
          "standalone; negotiate on seats, integration, and data portability.",
      },
      {
        vendorName: "Government-contract ERP vendors (e.g. Deltek Costpoint, SAP A&D)",
        category: "ERP / DCAA-compliant project accounting",
        switchingCost:
          "Extreme — embedded in DCAA-compliant cost accumulation, indirect rates, " +
          "and procurement; replacement is a multi-year, compliance-critical program.",
        renewalDynamics:
          "Very sticky; renewals leverage compliance dependency — push on modules, " +
          "support tiers, and audit-readiness commitments rather than wholesale replacement.",
      },
      {
        vendorName: "PLM vendors (e.g. Siemens Teamcenter, PTC Windchill, Dassault)",
        category: "PLM / configuration & BOM management",
        switchingCost:
          "Extreme — the configuration, BOM, and change history are the engineering " +
          "system of record; migration risks losing as-designed/as-built lineage.",
        renewalDynamics:
          "Foundational and long-term; negotiate on data egress, open exchange " +
          "standards, and digital-thread/MBSE roadmap commitments.",
      },
      {
        vendorName: "MRO / sustainment platform vendors (e.g. IFS, iBASEt, GOLDesp)",
        category: "MRO / sustainment & fleet management",
        switchingCost:
          "High — embedded in depot workflows, maintenance records, and (for PBL) " +
          "performance-payment data; switchable with significant data-migration effort.",
        renewalDynamics:
          "Often tied to sustainment contract terms and PBL arrangements; favor " +
          "outcome/readiness-linked terms and government data-rights clarity.",
      },
    ],
    switchingCosts:
      "The compliance-bound core systems (government-contract ERP, EVM, and PLM) are " +
      "effectively non-switchable in isolation because they carry DCAA cost-accounting, " +
      "EVMS compliance, and engineering configuration lineage. The negotiable frontier " +
      "is the analytics, supply-risk, obsolescence, and sustainment layer around them — " +
      "so contract for data portability, open exchange standards, and (critically) the " +
      "right to run those tools inside your own accredited, export-compliant enclave.",
    negotiationLevers: [
      "Right to deploy in your accredited, export-controlled (ITAR/CMMC) enclave — no SaaS that takes controlled data off-prem/off-region",
      "Outcome-based terms tied to measured readiness (mission-capable rate) or cost/schedule-overrun avoidance, not seats alone",
      "Open exchange standards and data-egress / digital-thread portability to avoid PLM/ERP lock-in",
      "Government data-rights and IP clarity (especially on sustainment/PBL data) negotiated up front",
      "Pilot-to-scale gating with parity proof on the contractor's own programs and controlled data before enterprise rollout",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      program_performance_claim: [
        "EVM control-account CPI/SPI",
        "EAC reconciled to actuals and baseline-change history",
        "physical milestone completion / critical-path corroboration",
      ],
      supply_risk_claim: [
        "supplier OTD/quality history",
        "sole-source exposure on critical spend",
        "lead time and qualified-alternate status",
      ],
      obsolescence_claim: [
        "critical-BOM lifecycle status",
        "end-of-life / last-time-buy notices",
        "mitigation/bridge-buy coverage",
      ],
      sustainment_claim: [
        "mission-capable rate vs target",
        "MRO turnaround decomposed (repair vs awaiting-parts)",
        "asset/commodity granularity and period",
      ],
      compliance_eligibility_claim: [
        "data classification (ITAR/EAR / CUI)",
        "CMMC / NIST 800-171 posture",
        "accreditation status of the processing environment and eligible AI services",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (esp. export-control eligibility and contract type)",
      ],
    },
    citationStandard:
      "Quantitative program claims cite the EVM/ERP/PLM/MRO source, the control-" +
      "account or asset granularity, and the period — and for CPI/SPI/EAC state the " +
      "reconciliation to actuals and any re-baselining. Supply, obsolescence, and " +
      "readiness claims cite the system of record and the criticality/asset basis. " +
      "Every compliance-eligibility claim cites the data classification and the " +
      "accreditation status of the environment. Value projections cite a baseline " +
      "plus a labelled planning range, the contract type, and the export-control and " +
      "incentive haircuts — never a single asserted ROI.",
  },

  hedgeRules: {
    whenToHedge: [
      "The compliant export-controlled/CMMC enclave is not yet in place — frame all AI value on controlled data as conditional on accreditation, not achievable today.",
      "CPI/SPI are quoted without control-account decomposition, reconciliation, or baseline-change history — present as not-yet-trustworthy and ask for the decomposition.",
      "An efficiency or savings figure is cited without the program's contract type — flag that cost-plus vs fixed-price changes who keeps the gain.",
      "Supply, obsolescence, or readiness numbers are cited without the tenant's own system-of-record data — present as industry planning ranges.",
      "Vendor- or GAO-reported overrun or readiness figures are cited — mark as external references pending validation on the tenant's own programs and fleet.",
    ],
    inferenceLanguage: [
      "Across A&D development programs, CPI/SPI commonly run...",
      "Without your EVM and schedule data, the industry pattern suggests this program is exposed to...",
      "On long-lived defense platforms, obsolescence/DMSMS exposure typically sits around...",
      "Where a compliant enclave is in place, programs of this type have seen cost-overrun avoidance of...",
      "Mission-capable rates on comparable fielded fleets have historically run...",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings or ROI for this tenant or program",
      "This tenant's actual CPI/SPI, EAC variance, or mission-capable rate",
      "A claim that a specific supplier or part is the program's binding risk without the tenant's data",
      "A claim that a given AI/cloud service is eligible for the tenant's controlled data without its classification and accreditation status",
      "A claim that AI can safely auto-disposition flight-critical product or commit an EAC without the tenant's certified human authority and export-control review",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "program cost/schedule overrun and EAC bridge / where the budget is going",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Waterfall from BAC through cost and schedule variances and management-reserve draws to the honest EAC.",
    },
    {
      questionPattern: "supply-chain risk ranking / which parts or suppliers most threaten the program",
      exhibitKind: "table",
      note: "Risk-ranked parts/suppliers: sole-source flag, lead time, OTD/quality, obsolescence/DMSMS status, mitigation, recommended action.",
    },
    {
      questionPattern: "value or savings impact of a program initiative / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from baseline to projected value with export-control-eligibility and contract-type (cost-plus vs fixed-price) haircuts shown explicitly.",
    },
    {
      questionPattern: "program / sustainment KPI scorecard",
      exhibitKind: "table",
      note: "CPI, SPI, EAC variance, on-time delivery, supplier OTD/sole-source, first-pass yield, mission-capable rate, MRO TAT, COPQ vs planning ranges.",
    },
    {
      questionPattern: "obsolescence / DMSMS exposure over the support horizon",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap of critical-BOM items by obsolescence-risk severity and time-to-non-procurable, to sequence proactive mitigation.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A compliant, export-controlled, CMMC-accredited enclave is stood up first, so AI on controlled data is eligible rather than a violation in waiting",
      "Value is scoped on cost/schedule honesty, supply continuity, and readiness — and sized per program against the actual contract type",
      "EVM, schedule, supply, and sustainment data are made trustworthy and joinable, so signals are honest rather than gamed",
      "Program, supply chain, contracts, and sustainment leadership co-own the targets, and certified human authority is preserved on every airworthiness/EAC decision",
    ],
    failureDrivers: [
      "Treating export control and CMMC as paperwork rather than a hard gate — value is modeled that can never be processed compliantly",
      "Over-promising that AI makes programs run to plan when it only improves the honesty and timeliness of an already-gamed signal",
      "Pursuing efficiency on cost-plus scope where the customer (not the contractor) captures the saving, so the enterprise sees no return",
      "Leaving the supply chain and obsolescence/DMSMS unmanaged, so a single sole-source or counterfeit-part miss slips the program regardless of analytics",
    ],
    adoptionReadiness: "low",
    adoptionCurve:
      "Adoption is gated first by the compliant enclave — nothing on controlled data " +
      "moves until accreditation exists. EVM early-warning and supply-risk intelligence " +
      "adopt first inside the enclave because the value is tangible and the workflow " +
      "change is contained; obsolescence/DMSMS and proposal/capture follow; predictive " +
      "sustainment and any quality auto-flagging are last, gated by government data-" +
      "rights, airworthiness authority, and certification. Adoption readiness is low not " +
      "for lack of value but because security, export control, and certification — not " +
      "model capability — set the pace.",
    roiClarity: "medium",
    roiClarityBasis:
      "Cost-overrun avoided, supply-driven slips reduced, and mission-capable points " +
      "gained are directly measurable, but attribution is muddied by program-control " +
      "discipline, the heavy dependence on export-control eligibility, and — decisively " +
      "— contract type: under cost-plus the contractor may capture little of a real " +
      "saving. ROI is firm where data and the enclave are mature and the contract type " +
      "lets the enterprise keep the gain, and speculative where they are not.",
  },

  regulatoryFrame: {
    name: "Defense acquisition, export-control & security frame (FAR/DFARS, ITAR/EAR, CMMC/800-171, AS9100, EVMS ANSI-748)",
    relevance:
      "The dominant regulatory frame for A&D: FAR/DFARS govern contract type, allowable " +
      "cost, and DCAA audit; ITAR/EAR export control and CMMC/NIST 800-171 are hard " +
      "constraints that bound where controlled data and CUI may live and which AI/cloud " +
      "services may touch them; AS9100/AS9145 govern build quality and what may be auto-" +
      "dispositioned on flight-critical product; and EVMS ANSI/EIA-748 defines the EVM " +
      "integrity rules any early-warning layer must respect rather than circumvent (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
