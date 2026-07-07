// Consilium expert — IT Strategy, Operating Model & CIO Advisory.
//
// W3 wave (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 spanning the CIO OFFICE / strategy-and-operating-
// model layer of every enterprise: IT strategy and roadmap, the IT operating
// model (org design — centralized vs federated, product vs project), IT
// governance, demand and portfolio management, value realization, talent and
// sourcing STRATEGY, and the CIO's own agenda and board narrative. This expert
// is the brain behind "what is IT's strategy, how is IT organized to deliver it,
// and how does the CIO tell that story to the board".
//
// SCOPE FENCE — this is the CIO's STRATEGY + OPERATING MODEL, NOT the technical
// architecture and NOT the cost discipline. It is DISTINCT from Enterprise
// Architecture (target-state architecture, reference models, technology standards,
// architecture runway — the WHAT and HOW of the technology estate) — this expert
// owns the strategy that DIRECTS architecture and the operating model that
// DELIVERS it, not the architecture itself. It is also DISTINCT from IT Spend
// Optimization & TBM (the cost layer — cost transparency, shelfware, FinOps,
// rationalization economics) — this expert owns where IT is GOING and how IT is
// ORGANIZED and GOVERNED to get there, treating spend only as the investment
// portfolio the strategy allocates, not as the cost model being optimized.
//
// CORE DOCTRINE — OPERATING-MODEL CHANGE IS A PEOPLE-AND-GOVERNANCE PROBLEM,
// BUSINESS-IT ALIGNMENT IS THE PERENNIAL GAP, AND STRATEGY WITHOUT AN OPERATING
// MODEL TO DELIVER IT STALLS. Three honest truths gate every CIO-strategy claim.
// (1) The bottleneck in operating-model transformation (centralized→federated,
// project→product, demand governance) is almost never the org chart on the
// slide — it is the people, incentives, decision rights, and governance behind
// it; reorgs that move boxes without changing who decides, who funds, and how
// teams are incentivized revert. (2) Business-IT alignment is the perennial,
// never-fully-solved gap — IT optimizes for its own roadmap, the business for its
// own outcomes, and the two drift; durable strategy is co-owned, funded by value
// stream, and measured on business outcomes, not IT throughput. (3) A "digital
// strategy" deck with no operating model to deliver it — no funding model, no
// decision rights, no demand governance, no talent plan — is shelf-ware that
// stalls within a year. So strategy value is sized on the OPERATING MODEL that
// will actually deliver it, weighted to the governance and talent changes that
// make it durable, and haircut for the reorg-reverts-without-incentive-change and
// alignment-drift reality — never on a headline "digital transformation" ambition
// with no delivery model behind it.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const itStrategyOperatingModelExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.it-strategy-operating-model",
    expertName:
      "IT Strategy, Operating Model & CIO Advisory Expert (IT strategy / operating model / governance / CIO agenda)",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "it-strategy-operating-model",
    scopeNote:
      "Cross-cutting, cross-industry expert for the CIO OFFICE / strategy-and-" +
      "operating-model layer of the enterprise: IT strategy and roadmap, the IT " +
      "operating model (org design — centralized vs federated, product vs " +
      "project), IT governance, demand and portfolio management, value " +
      "realization, talent and sourcing STRATEGY, and the CIO's own agenda and " +
      "board narrative. CORE DOCTRINE: operating-model change is mostly a people-" +
      "and-governance problem (reorgs that move boxes without changing decision " +
      "rights, funding, and incentives revert); business-IT alignment is the " +
      "perennial gap (durable strategy is co-owned and measured on business " +
      "outcomes, not IT throughput); and a digital strategy with no operating " +
      "model to deliver it stalls — so strategy value is sized on the delivery " +
      "operating model, weighted to governance and talent, and haircut for reorg-" +
      "revert and alignment-drift. DISTINCT FROM Enterprise Architecture (target-" +
      "state architecture, reference models, technology standards — the WHAT/HOW " +
      "of the estate; this expert owns the strategy that DIRECTS architecture and " +
      "the operating model that DELIVERS it) and from IT Spend Optimization & TBM " +
      "(the cost layer — cost transparency, shelfware, FinOps, rationalization; " +
      "this expert owns where IT is GOING and how it is ORGANIZED and GOVERNED to " +
      "get there, treating spend as the investment portfolio the strategy " +
      "allocates, not the cost model being optimized).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "strategic_vs_run_spend_pct",
        name: "% IT spend on strategic (change/grow) vs run",
        definition:
          "Share of total IT investment directed at strategic/change/grow " +
          "initiatives (new capability, transformation, innovation) versus run " +
          "(operate and maintain) — the investment-capacity expression of " +
          "strategy, read as strategic % of total.",
        unit: "% strategic of total",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 45,
          basis:
            "IT investment-mix benchmarks; many enterprises direct only 15-25% to " +
            "strategic change, leaders push toward 35-45% to fund the strategy — " +
            "direction and the trend matter more than the absolute point",
          label: "planning-range",
        },
        dataSource:
          "IT investment / portfolio model: initiatives classified strategic-vs-" +
          "run across the project/product portfolio, reconciled to the IT plan",
        whyItMatters:
          "The strategy-has-funding metric — a strategy is only real if the " +
          "investment portfolio actually backs it. A run-heavy mix means the " +
          "strategy is aspiration; the CIO's first job is to free and redirect " +
          "capacity toward the stated priorities.",
      },
      {
        key: "business_it_alignment_score",
        name: "Business-IT alignment score",
        definition:
          "A composite (survey + governance-evidence) measure of how well the IT " +
          "strategy, roadmap, and priorities are co-owned with and trusted by " +
          "business leadership — the perennial-gap signal expressed as a 0-100 " +
          "index or maturity band.",
        unit: "index 0-100",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 80,
          basis:
            "Business-IT alignment / IT-maturity survey benchmarks; most " +
            "enterprises sit mid-band (chronic drift), leaders with co-owned, " +
            "value-stream-funded strategy reach the high band — read directionally",
          label: "planning-range",
        },
        dataSource:
          "Business-stakeholder alignment survey plus governance evidence (joint " +
          "prioritization, value-stream funding, shared outcome metrics)",
        whyItMatters:
          "The perennial-gap metric made visible — IT optimizing for its roadmap " +
          "and the business for its outcomes drift apart unless alignment is " +
          "actively governed. A low score predicts stalled strategy and shadow IT " +
          "regardless of how good the technology is.",
      },
      {
        key: "roadmap_delivery_pct",
        name: "Strategic roadmap delivery %",
        definition:
          "Share of committed strategic-roadmap milestones (capabilities, " +
          "outcomes, releases) delivered on the committed scope and time horizon — " +
          "the does-IT-deliver-what-it-promised signal.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 85,
          basis:
            "IT delivery / portfolio-throughput benchmarks; immature delivery " +
            "lands well under 60% of committed roadmap, mature product-operating " +
            "models with disciplined intake reach 75-85% — interpret with scope " +
            "stability",
          label: "planning-range",
        },
        dataSource:
          "Portfolio / product-management system: committed roadmap milestones vs " +
          "delivered, with scope-change tracked",
        whyItMatters:
          "The credibility metric — chronic under-delivery on the roadmap erodes " +
          "the business's trust faster than anything, and trust is the currency " +
          "the CIO spends to win funding and alignment. Honest delivery beats an " +
          "ambitious roadmap that never lands.",
      },
      {
        key: "product_vs_project_mix",
        name: "Product vs project funding mix",
        definition:
          "Share of IT investment funded through persistent, outcome-owning " +
          "PRODUCT teams (stable funding, business-aligned product owners) versus " +
          "temporary, scope-funded PROJECTS — the operating-model-shift signal.",
        unit: "% funded as product",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 70,
          basis:
            "Product-operating-model adoption benchmarks; many enterprises remain " +
            "majority project-funded, those further along the product shift fund " +
            "the majority of strategic spend as product — a transition state, not a " +
            "fixed target",
          label: "planning-range",
        },
        dataSource:
          "Funding / portfolio model: investment classified product-funded vs " +
          "project-funded across the strategic portfolio",
        whyItMatters:
          "The operating-model-maturity metric — shifting from project to product " +
          "is the dominant operating-model change of the decade, but it is a " +
          "funding-and-governance change (stable funding, product owners, outcome " +
          "accountability), not a rename of teams. The mix shows how real the " +
          "shift is.",
      },
      {
        key: "governance_decision_cycle_time",
        name: "Governance / time-to-decision cycle time",
        definition:
          "Median elapsed time from a strategic decision (investment approval, " +
          "architecture exception, prioritization) entering governance to a " +
          "decision being made — the governance-velocity signal.",
        unit: "business days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "IT-governance cycle-time benchmarks; heavyweight stage-gate " +
            "governance runs 30-60+ days and bottlenecks delivery, streamlined " +
            "decision rights and thresholds get routine decisions under 10 days — " +
            "read against decision materiality",
          label: "planning-range",
        },
        dataSource:
          "Governance / portfolio workflow system: decision-intake to decision-" +
          "made timestamps by decision type and materiality",
        whyItMatters:
          "The governance-as-enabler-vs-bottleneck metric — slow governance is " +
          "where strategy goes to die; teams route around it (shadow IT) or stall. " +
          "Right-sized decision rights and thresholds let governance accelerate " +
          "rather than throttle delivery.",
      },
      {
        key: "it_value_realization_pct",
        name: "IT value realization %",
        definition:
          "Share of the business value (benefits, outcomes) committed in approved " +
          "IT business cases that is actually measured and realized post-delivery " +
          "— the does-the-promised-value-show-up signal.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "Benefits-realization benchmarks; most enterprises never measure " +
            "realized value at all (so it defaults low), disciplined value-" +
            "management offices track and realize the majority of committed " +
            "benefits — gap is often measurement, not delivery",
          label: "planning-range",
        },
        dataSource:
          "Value/benefits-realization tracking: committed business-case benefits " +
          "vs measured post-delivery outcomes, owned with the business",
        whyItMatters:
          "The strategy-actually-paid-off metric — IT routinely delivers the " +
          "system and never proves the value, so the next funding ask is harder. " +
          "Realized value, co-owned with the business, is how the CIO converts " +
          "delivery into durable trust and investment.",
      },
      {
        key: "demand_intake_cycle_time",
        name: "Demand-intake cycle time",
        definition:
          "Median elapsed time from a business demand request entering IT intake " +
          "to a prioritization decision (accepted/sequenced/declined) — the " +
          "responsiveness-of-the-front-door signal.",
        unit: "business days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 45,
          basis:
            "Demand-management benchmarks; an ungoverned or overloaded front door " +
            "runs 45-90+ days (and breeds shadow IT), a disciplined demand-" +
            "management process with clear criteria responds in 2-4 weeks — read " +
            "with demand volume",
          label: "planning-range",
        },
        dataSource:
          "Demand-management / intake system: request-submitted to prioritization-" +
          "decision timestamps, with the demand backlog and decline rate",
        whyItMatters:
          "The is-IT-easy-to-do-business-with metric — a slow, opaque front door " +
          "is the single biggest driver of shadow IT and business frustration. " +
          "Fast, transparent demand intake is where business-IT alignment is won " +
          "or lost day to day.",
      },
      {
        key: "span_of_control",
        name: "Average span of control",
        definition:
          "Average number of direct reports per people-manager across the IT " +
          "organization — the org-design efficiency and layering signal that " +
          "exposes over-layering and management bloat.",
        unit: "reports per manager",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 5,
          high: 9,
          basis:
            "Org-design / span-and-layers benchmarks; healthy knowledge-work spans " +
            "run 6-8, narrow spans (<5) signal over-layering and slow decisions, " +
            "very wide spans signal under-supported teams — interpret against work " +
            "type",
          label: "planning-range",
        },
        dataSource:
          "HRIS org structure: reporting relationships and management layers " +
          "across the IT organization",
        whyItMatters:
          "The org-design-health metric — narrow spans and deep layers slow " +
          "decisions, dilute accountability, and inflate management cost, while " +
          "the operating-model redesign's value often hinges on de-layering. It " +
          "is a structural lever, but only real if decision rights move with it.",
      },
      {
        key: "value_stream_funded_pct",
        name: "% IT investment funded by product / value stream",
        definition:
          "Share of strategic IT investment funded through business value streams " +
          "or products with co-owned outcomes (jointly governed with the business) " +
          "versus funded as IT-owned cost-center initiatives — the co-ownership " +
          "signal behind durable alignment.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 65,
          basis:
            "Value-stream / product-funding maturity benchmarks; most enterprises " +
            "fund the minority through value streams, leaders co-fund the majority " +
            "of strategic spend with the business — a maturity trajectory, not a " +
            "fixed bar",
          label: "planning-range",
        },
        dataSource:
          "Funding / portfolio model: investment classified value-stream/product-" +
          "co-funded vs IT-cost-center-funded across the strategic portfolio",
        whyItMatters:
          "The durable-alignment metric — co-funding by value stream is what makes " +
          "business-IT alignment structural rather than relational. When the " +
          "business owns the outcome and the funding, the perennial alignment gap " +
          "narrows because incentives are shared, not negotiated.",
      },
      {
        key: "it_nps_business_satisfaction",
        name: "IT NPS / business satisfaction",
        definition:
          "Net-promoter-style score (or equivalent satisfaction index) from " +
          "business stakeholders on IT as a partner — would they recommend / how " +
          "satisfied are they with IT's responsiveness, delivery, and value.",
        unit: "NPS (-100 to +100)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 40,
          basis:
            "Internal-IT NPS benchmarks; many IT organizations sit near or below " +
            "zero (net detractors), trusted-partner IT organizations reach +20 to " +
            "+40 — read alongside delivery and demand-cycle metrics, not alone",
          label: "planning-range",
        },
        dataSource:
          "Business-stakeholder NPS / satisfaction survey on IT as a partner, by " +
          "business unit and over time",
        whyItMatters:
          "The relationship-health metric and the CIO's leading indicator of " +
          "political capital — low satisfaction predicts funding fights, shadow " +
          "IT, and stalled strategy. It is soft and easily gamed, so it is read " +
          "as a trend alongside hard delivery and value metrics, not as a verdict.",
      },
      {
        key: "strategic_initiative_throughput",
        name: "Strategic-initiative throughput",
        definition:
          "Number of strategic initiatives completed to a defined outcome per " +
          "period (e.g. per year) relative to the active strategic portfolio — the " +
          "does-the-organization-finish-things signal versus chronic WIP overload.",
        unit: "initiatives completed / year",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 20,
          basis:
            "Portfolio-throughput benchmarks vary widely by initiative size; the " +
            "diagnostic is throughput vs active WIP — overloaded portfolios start " +
            "many and finish few, disciplined ones limit WIP and finish more — read " +
            "as a ratio, not an absolute",
          label: "planning-range",
        },
        dataSource:
          "Portfolio system: strategic initiatives completed-to-outcome per period " +
          "against active in-flight WIP and the started count",
        whyItMatters:
          "The finish-rate metric — overloaded portfolios start everything and " +
          "complete little, so strategy delivers slowly regardless of effort. " +
          "Throughput against WIP exposes whether governance is sequencing and " +
          "limiting work or just accepting it all and stalling.",
      },
      {
        key: "critical_skills_coverage_pct",
        name: "Critical-skills coverage %",
        definition:
          "Share of strategy-critical capability areas (e.g. cloud, data/AI, " +
          "product management, cyber, architecture) with adequate internal talent " +
          "coverage versus dependent on contractors or simply absent — the can-IT-" +
          "actually-deliver-the-strategy talent signal.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "IT talent / skills-gap benchmarks; strategy-critical skills (data/AI, " +
            "product, cloud, cyber) are commonly the scarcest, with heavy " +
            "contractor reliance; mature talent strategies build the majority " +
            "internally — read against the sourcing strategy",
          label: "planning-range",
        },
        dataSource:
          "Skills inventory / workforce-planning model: critical capability areas " +
          "mapped to internal vs contracted vs gapped talent",
        whyItMatters:
          "The strategy-is-deliverable metric — a strategy that depends on skills " +
          "the organization neither has nor can source will stall in execution. " +
          "Talent and sourcing strategy is the often-ignored half of operating-" +
          "model design, and the perennial constraint on transformation pace.",
      },
    ],

    painThemes: [
      {
        key: "strategy_without_operating_model",
        name: "Digital strategy with no operating model to deliver it",
        description:
          "A glossy strategy/transformation deck sets ambition (cloud-first, AI-" +
          "led, product-centric) but is unaccompanied by a delivery operating " +
          "model: no funding model, no decision rights, no demand governance, no " +
          "talent plan. The strategy is real on slides and absent in execution, so " +
          "it stalls within a year and resurfaces as next year's strategy.",
        detectionSignal:
          "A strategy document with vision and themes but no operating-model, " +
          "funding-model, governance, or talent section; the same strategy " +
          "re-launched annually; strategic % of spend not actually shifting.",
        diagnosticQuestion:
          "Behind your IT/digital strategy, is there an explicit operating model " +
          "to deliver it — a funding model, decision rights, demand governance, " +
          "and a talent plan — or is the strategy a deck with no delivery engine?",
      },
      {
        key: "operating_model_reorg_reverts",
        name: "Reorg moves boxes but not decision rights or incentives",
        description:
          "An operating-model change (centralized→federated, project→product, new " +
          "platform teams) is executed as a box-moving reorg — new titles and " +
          "reporting lines — without changing who decides, who funds, and how " +
          "people are incentivized. Old behaviors persist under new labels and the " +
          "model reverts to the prior power structure within quarters.",
        detectionSignal:
          "A reorg announced with new org charts but unchanged funding model, " +
          "decision rights, and incentives; 'product teams' that still take orders " +
          "and project-fund; pre-reorg behaviors and bottlenecks unchanged after.",
        diagnosticQuestion:
          "In your last operating-model change, did decision rights, the funding " +
          "model, and incentives actually move — or did you redraw the org chart " +
          "while the same people kept deciding and funding the same way?",
      },
      {
        key: "business_it_misalignment",
        name: "Business-IT misalignment — the perennial gap",
        description:
          "IT optimizes for its own roadmap and standards; the business optimizes " +
          "for its own outcomes and timelines; the two drift apart. The business " +
          "sees IT as slow and self-serving, IT sees the business as unreasonable " +
          "and undisciplined, and the strategy neither side fully owns stalls — " +
          "while shadow IT fills the gap.",
        detectionSignal:
          "Low business-IT alignment score and IT NPS, business buying its own " +
          "tech (shadow IT), IT roadmap and business priorities visibly divergent, " +
          "value-stream funding rare, recurring 'IT doesn't get the business' " +
          "complaints.",
        diagnosticQuestion:
          "Is your IT strategy genuinely co-owned with the business — funded by " +
          "value stream and measured on business outcomes — or does IT run its own " +
          "roadmap while the business routes around it with shadow IT?",
      },
      {
        key: "governance_bottleneck",
        name: "Governance as bottleneck — strategy dies in the stage gate",
        description:
          "Heavyweight, one-size governance (every decision through the same " +
          "stage-gate board, undifferentiated by materiality) becomes the " +
          "bottleneck: decisions take weeks, teams stall or route around the " +
          "process, and architecture exceptions pile up. Governance meant to " +
          "de-risk instead throttles delivery and breeds shadow workarounds.",
        detectionSignal:
          "Long governance cycle time, every decision through one board " +
          "regardless of size, a backlog of pending approvals/exceptions, teams " +
          "complaining governance blocks them, shadow IT to avoid the process.",
        diagnosticQuestion:
          "Is your governance right-sized to decision materiality with clear " +
          "decision rights and thresholds — or does every decision queue behind " +
          "one heavyweight board, so strategy stalls and teams route around it?",
      },
      {
        key: "portfolio_overload_low_throughput",
        name: "Portfolio overload — too much WIP, low throughput",
        description:
          "Demand governance is weak, so the portfolio accepts far more than it " +
          "can deliver. Everything is 'priority one', teams are spread across too " +
          "many in-flight initiatives, context-switching kills productivity, and " +
          "the organization starts everything and finishes little — strategy " +
          "delivers slowly regardless of effort or headcount.",
        detectionSignal:
          "High active WIP vs completion throughput, a long started-not-finished " +
          "list, no demand prioritization or WIP limits, low roadmap delivery %, " +
          "everything labelled top priority, chronic re-planning.",
        diagnosticQuestion:
          "How much is in flight versus actually finishing — is your portfolio " +
          "overloaded with WIP and starting everything, or does demand governance " +
          "sequence work and limit WIP so initiatives actually complete?",
      },
      {
        key: "talent_gap_blocks_strategy",
        name: "Talent and sourcing gap blocks the strategy",
        description:
          "The strategy assumes capabilities — cloud, data/AI, product management, " +
          "cyber, modern engineering — the organization neither has internally nor " +
          "has a credible sourcing strategy to build or buy. Critical roles sit " +
          "vacant or are filled by churning contractors, key-person risk is high, " +
          "and execution stalls on the skills the strategy quietly depended on.",
        detectionSignal:
          "Low critical-skills coverage, heavy contractor reliance on strategy-" +
          "critical roles, long vacancies, high attrition in scarce skills, no " +
          "talent/sourcing strategy tied to the IT strategy, key-person risk.",
        diagnosticQuestion:
          "Does your IT strategy have a matching talent and sourcing strategy — do " +
          "you have or can you credibly source the critical skills it depends on — " +
          "or is execution quietly blocked on capabilities you don't have?",
      },
      {
        key: "no_value_realization",
        name: "Value never realized — IT delivers systems, not outcomes",
        description:
          "IT delivers the system on the business case's promise of value, then " +
          "no one measures whether the value showed up. Benefits are claimed at " +
          "approval and never tracked post-delivery, so IT cannot prove the " +
          "strategy paid off, the business discounts future asks, and the funding " +
          "argument gets harder each cycle despite real delivery.",
        detectionSignal:
          "Low or unmeasured IT value realization, business cases with benefits " +
          "that are never tracked post-go-live, no value-management office, " +
          "benefit owners undefined, 'we delivered it' reported instead of 'it " +
          "delivered value'.",
        diagnosticQuestion:
          "After you deliver a strategic initiative, do you measure and prove the " +
          "business value it actually realized against the case — or do you report " +
          "that the system shipped and never close the loop on the outcome?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_strategy_roadmap_synthesis",
        name: "AI-assisted strategy synthesis & roadmap shaping",
        valueMechanism:
          "Synthesize the enterprise's business strategy, capability gaps, peer/" +
          "industry patterns, and the current estate into a coherent IT strategy " +
          "narrative and a sequenced roadmap with explicit operating-model and " +
          "funding implications — turning a slow, consultant-heavy strategy cycle " +
          "into a faster, evidence-grounded one that ties ambition to a delivery " +
          "model, lifting the strategic-vs-run mix and alignment.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "The enterprise business strategy, priorities, and value streams",
          "Current IT estate, capability map, and initiative portfolio",
          "Peer/industry strategy patterns and benchmark planning ranges",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Strategy is a leadership judgement — AI shapes and grounds it, the CIO and business own the choices",
          "Roadmaps are planning ranges with assumptions, not commitments — flag the operating-model dependencies",
          "Peer patterns are inputs, not targets — a strategy must fit this enterprise's context, not copy a benchmark",
        ],
        metricsMoved: [
          "strategic_vs_run_spend_pct",
          "business_it_alignment_score",
          "roadmap_delivery_pct",
        ],
      },
      {
        key: "ai_portfolio_demand_intelligence",
        name: "AI portfolio & demand-intake intelligence",
        valueMechanism:
          "Score and sequence incoming demand and the active portfolio against " +
          "strategic fit, value, capacity, and dependency, surface WIP overload " +
          "and stalled initiatives, and recommend prioritization and intake " +
          "decisions — accelerating the demand front door and improving throughput " +
          "so the portfolio finishes strategy rather than accepting everything and " +
          "stalling.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Demand-intake requests with business sponsor and value rationale",
          "Active portfolio WIP, capacity, and dependency data",
          "Strategic priorities and value-stream alignment to score fit against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Prioritization is a governance decision — AI ranks and exposes trade-offs, the governance body decides",
          "Value/strategic-fit scores carry assumptions that must be transparent, not a black-box ranking",
          "Capacity and dependency data must be current, or sequencing recommendations mislead",
        ],
        metricsMoved: [
          "demand_intake_cycle_time",
          "strategic_initiative_throughput",
          "roadmap_delivery_pct",
        ],
      },
      {
        key: "ai_value_realization_tracking",
        name: "AI value-realization tracking & benefits intelligence",
        valueMechanism:
          "Instrument committed business-case benefits, continuously match them to " +
          "measured post-delivery outcomes, flag drift and unrealized value, and " +
          "attribute realized value to initiatives and value streams — closing the " +
          "value loop IT usually leaves open, so the CIO can prove the strategy " +
          "paid off and defend the next funding ask with evidence.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Business-case committed benefits with named owners and measures",
          "Post-delivery outcome/operational data to measure realized value",
          "Value-stream and initiative mapping to attribute outcomes",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Value attribution is contestable — co-own measures with the business and state the attribution basis",
          "Distinguish measured realized value from projected/claimed benefit, never conflate them",
          "Benefit owners must validate — automated value claims without business sign-off lose credibility",
        ],
        metricsMoved: [
          "it_value_realization_pct",
          "business_it_alignment_score",
          "strategic_vs_run_spend_pct",
        ],
      },
      {
        key: "ai_org_design_operating_model_analytics",
        name: "AI org-design & operating-model analytics",
        valueMechanism:
          "Analyze the IT organization's structure, spans and layers, role mix, " +
          "and decision-flow to model operating-model options (centralized vs " +
          "federated, product vs project) and quantify the span, layering, and " +
          "decision-rights changes each implies — making operating-model redesign " +
          "an evidence-based, decision-rights-explicit exercise rather than a " +
          "box-moving reorg that reverts.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "HRIS org structure, reporting relationships, and role taxonomy",
          "Decision-flow / governance data on who decides and funds what",
          "Funding model (product vs project) across the portfolio",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Org design is a people decision with real human impact — AI informs options, leadership owns and is accountable for the change",
          "Structure without decision-rights and incentive changes reverts — flag that the box-move alone is insufficient",
          "Span/layer optimization must respect work type and team support needs, not just a ratio",
        ],
        metricsMoved: [
          "span_of_control",
          "product_vs_project_mix",
          "value_stream_funded_pct",
        ],
      },
      {
        key: "ai_governance_decision_support",
        name: "AI governance & decision-support intelligence",
        valueMechanism:
          "Triage governance items by materiality, pre-assemble the evidence " +
          "(strategic fit, risk, dependency, precedent) for decision bodies, and " +
          "route routine decisions to the right decision-right holder under " +
          "thresholds — compressing time-to-decision and unclogging the stage-gate " +
          "bottleneck so governance accelerates rather than throttles delivery.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Governance decision queue with item type, materiality, and sponsor",
          "Decision-rights model and approval thresholds",
          "Strategic, risk, and dependency context to assemble decision evidence",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Material decisions require human authority — AI triages and prepares, accountable bodies decide, never auto-approve material items",
          "Decision-rights routing must be governed and auditable, not an opaque automation",
          "Pre-assembled evidence must be transparent and challengeable, not a rubber stamp",
        ],
        metricsMoved: [
          "governance_decision_cycle_time",
          "strategic_initiative_throughput",
          "roadmap_delivery_pct",
        ],
      },
      {
        key: "ai_talent_sourcing_strategy",
        name: "AI talent & sourcing-strategy intelligence",
        valueMechanism:
          "Map strategy-critical capabilities to the internal skills inventory, " +
          "contractor reliance, and market scarcity, and model build-vs-buy-vs-" +
          "partner sourcing options against the roadmap — exposing the talent gaps " +
          "that quietly block strategy and shaping a sourcing strategy so " +
          "execution is not stalled on skills the organization lacks.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Skills inventory and critical-capability map tied to the strategy",
          "Contractor reliance, vacancy, and attrition data on critical roles",
          "Roadmap capability demand and labor-market scarcity signals",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Workforce and sourcing decisions affect people — AI informs the strategy, HR and IT leadership own the decisions",
          "Skills data is often stale and self-reported — flag confidence on coverage figures",
          "Build-vs-buy options carry assumptions on market availability and ramp time that must be explicit",
        ],
        metricsMoved: [
          "critical_skills_coverage_pct",
          "roadmap_delivery_pct",
          "it_nps_business_satisfaction",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "it_strategy_operating_model_blueprint",
        name: "IT strategy + operating-model blueprint (strategy WITH a delivery model)",
        description:
          "A paired artifact: an IT/digital strategy (ambition, priorities, " +
          "roadmap) explicitly bound to an operating model that will deliver it — " +
          "funding model, decision rights, demand governance, org design, and " +
          "talent plan. The binding-prerequisite pattern that prevents a strategy " +
          "deck with no delivery engine; every strategy theme traces to an " +
          "operating-model and funding change.",
        boundary:
          "Owns the strategy narrative, the operating-model design, and the " +
          "roadmap-to-funding trace; does not own the technology architecture " +
          "(that is EA's) or the cost model (that is TBM's) — it directs and " +
          "delivers, not designs the estate.",
        humanAccountabilityPoint: "CIO (with the executive leadership team and CFO)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "product_operating_model_transition",
        name: "Product operating-model transition (project → product)",
        description:
          "A structured shift from temporary, scope-funded projects to persistent, " +
          "outcome-owning product teams with stable funding, business-aligned " +
          "product owners, and outcome accountability — changing the funding model " +
          "and decision rights, not just the team names, so the operating-model " +
          "change actually sticks rather than reverting to project behavior.",
        boundary:
          "Owns the funding-model shift, product-team design, and outcome-" +
          "accountability governance; does not own the product's business strategy " +
          "(co-owned with the business product owner) or the engineering practices " +
          "themselves (that is delivery/EA).",
        humanAccountabilityPoint: "CIO / Head of Product & Engineering (with business product owners)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "demand_portfolio_governance",
        name: "Demand & portfolio governance (right-sized, WIP-limited)",
        description:
          "A governed demand-intake and portfolio-management discipline: a clear " +
          "front door with prioritization criteria, decision rights and thresholds " +
          "sized to materiality, WIP limits, and value-based sequencing — making " +
          "governance an enabler that accelerates throughput rather than a " +
          "heavyweight stage-gate bottleneck that stalls strategy and breeds " +
          "shadow IT.",
        boundary:
          "Owns demand intake, prioritization governance, decision rights, and " +
          "portfolio sequencing; does not own the business's demand itself or the " +
          "delivery execution (it governs what gets done and in what order, not " +
          "how it is built).",
        humanAccountabilityPoint: "CIO / Head of IT Portfolio & Demand (with the IT governance board)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "value_management_office",
        name: "Value-management office (benefits realization & co-ownership)",
        description:
          "A value/benefits-realization discipline that defines committed benefits " +
          "with named business owners at approval, measures realized outcomes " +
          "post-delivery, and co-owns the value story with the business — closing " +
          "the loop IT usually leaves open so the CIO can prove the strategy paid " +
          "off and convert delivery into durable trust and funding.",
        boundary:
          "Owns benefits definition, realization tracking, and the value " +
          "narrative; does not own the business outcome itself (co-owned with the " +
          "named business benefit owner) or the operational system that produces " +
          "it.",
        humanAccountabilityPoint: "CIO / Value-Management Office Lead (with named business benefit owners)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "IT-strategy value is realized through the OPERATING MODEL that delivers " +
        "the strategy, and the binding truths gate every lever. The PREREQUISITE " +
        "is a strategy bound to a delivery operating model: a strategy deck with " +
        "no funding model, decision rights, demand governance, or talent plan is " +
        "shelf-ware, so the first value is simply making the strategy deliverable. " +
        "On that base, the durable value comes from OPERATING-MODEL change — " +
        "shifting investment from run to strategic, project to product, and IT-" +
        "owned to value-stream-co-funded — but operating-model change is a people-" +
        "and-governance problem: reorgs that move boxes without changing decision " +
        "rights, funding, and incentives REVERT, so value must be discounted for " +
        "the share that snaps back. BUSINESS-IT ALIGNMENT is the perennial gap " +
        "that decides whether strategy lands at all — co-ownership and value-" +
        "stream funding narrow it, but it is never fully solved, so alignment " +
        "drift is a standing haircut. GOVERNANCE and DEMAND discipline convert " +
        "ambition into throughput (right-sized decision rights, WIP limits), and " +
        "VALUE REALIZATION proves the strategy paid off so the next ask is funded. " +
        "But TALENT is the quiet constraint — a strategy that depends on skills " +
        "the organization lacks and cannot source stalls regardless of governance. " +
        "So durable, defensible value is sized on the OPERATING MODEL that will " +
        "actually deliver, weighted to the governance and talent changes that make " +
        "it stick, and explicitly haircut for reorg-revert, alignment drift, " +
        "talent gaps, and value-realization measurement — never on a headline " +
        "'digital transformation' ambition with no delivery model behind it.",
      dominantHaircutFactors: [
        {
          factor: "Operating-model revert without decision-rights & incentive change",
          rationale:
            "The dominant durability haircut: operating-model changes (federation, " +
            "product shift, demand governance) that move boxes without moving " +
            "decision rights, the funding model, and incentives snap back to the " +
            "prior power structure within quarters. Forward value must be " +
            "discounted by the share that reverts absent real authority and " +
            "incentive change.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Observed revert of operating-model/reorg change where decision " +
              "rights, funding, and incentives did not move with the org chart; " +
              "widens where the change threatens established power",
            label: "planning-range",
          },
        },
        {
          factor: "Business-IT alignment drift",
          rationale:
            "The perennial-gap haircut: even a well-designed strategy underdelivers " +
            "where the business does not co-own it, fund it by value stream, and " +
            "measure it on its own outcomes. Alignment drifts back without standing " +
            "governance, so projected value must be discounted for the share lost " +
            "to misalignment and shadow IT.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Reduction in realized strategy value where business co-ownership " +
              "and value-stream funding were weak and alignment drifted back to " +
              "IT-run roadmaps",
            label: "planning-range",
          },
        },
        {
          factor: "Talent & sourcing-capacity gap",
          rationale:
            "The quiet constraint: a strategy that depends on critical skills " +
            "(cloud, data/AI, product, cyber) the organization neither has nor can " +
            "credibly source stalls in execution. Gross strategy value must be " +
            "haircut for the share blocked or slowed by talent gaps, contractor " +
            "churn, and key-person risk.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Strategy value delayed or unrealized where critical-skills coverage " +
              "was low and no credible build/buy/partner sourcing strategy backed " +
              "the roadmap",
            label: "planning-range",
          },
        },
        {
          factor: "Value-realization measurement & attribution gap",
          rationale:
            "Strategy value that is never measured cannot be proven or defended, " +
            "so it functionally erodes: benefits claimed at approval and untracked " +
            "post-delivery default to unrealized in the next funding fight. " +
            "Projected value must be haircut for the share that will go unmeasured " +
            "and uncontestably attributable without a value-management discipline.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Committed business-case value that went unmeasured or " +
              "unattributable post-delivery where no value-realization discipline " +
              "closed the loop",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Run-to-strategic investment-capacity shift",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Relative increase in strategic/change investment capacity from " +
              "operating-model and demand discipline freeing run consumption, " +
              "before revert",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in the strategic (change/grow) share of the IT " +
            "investment portfolio redeployed toward the strategy, net of run " +
            "obligations",
        },
        {
          lever: "Portfolio throughput / delivery uplift",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Relative throughput and roadmap-delivery improvement from demand " +
              "governance, WIP limits, and right-sized decision rights in " +
              "overloaded portfolios",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in strategic-initiative completion throughput and " +
            "roadmap delivery % from demand and governance discipline",
        },
        {
          lever: "Realized value uplift from value management",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Relative increase in measured-and-realized business value from " +
              "closing the benefits-realization loop versus delivering systems " +
              "without tracking outcomes",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in IT value realization % — committed business-case " +
            "benefits measured and realized post-delivery and co-owned with the " +
            "business",
        },
      ],
      timeToValueBand:
        "Strategy-with-operating-model blueprint and demand/governance redesign: " +
        "1-2 quarters to stand up and start shifting throughput. Run-to-strategic " +
        "mix shift and portfolio-throughput uplift: 2-4 quarters as governance and " +
        "WIP discipline take hold. Product operating-model transition and org/" +
        "decision-rights change: 12-24 months, with value lagging the box-move " +
        "until incentives and funding actually shift. Business-IT alignment and a " +
        "value-management discipline that makes strategy durable: compound over " +
        "12-30 months. Full operating-model maturity (federated decision rights, " +
        "product funding, co-owned value streams, talent strategy): 24-48 months.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Strategic portfolio / project-and-product management (PPM/SPM)",
          role:
            "The portfolio source of truth — strategic initiatives, roadmap, " +
            "product vs project funding, WIP, throughput, and roadmap delivery — " +
            "where the strategy meets the work.",
          examples: ["Planview", "ServiceNow SPM", "Jira Align", "Microsoft Project / Planner"],
        },
        {
          name: "Demand-management / intake system",
          role:
            "The IT front door — business demand requests, prioritization, " +
            "decision rights, and the demand backlog — the responsiveness and " +
            "shadow-IT-prevention source of truth.",
          examples: ["ServiceNow Demand Management", "Planview demand modules", "Jira Service Management intake", "Aha!"],
        },
        {
          name: "HRIS / workforce & org-design system",
          role:
            "The org structure, reporting relationships, spans and layers, role " +
            "taxonomy, and skills inventory — the operating-model and talent-" +
            "strategy source of truth.",
          examples: ["Workday HCM", "SAP SuccessFactors", "Oracle HCM", "OrgVue (org-design analytics)"],
        },
        {
          name: "Value / benefits-realization tracking",
          role:
            "Committed business-case benefits, named benefit owners, and measured " +
            "post-delivery outcomes — the value-realization and strategy-paid-off " +
            "source of truth.",
          examples: ["Value-management modules in PPM/SPM", "Benefits-realization registers", "Apptio / IT-planning value tracking", "EVM tooling"],
        },
        {
          name: "IT financial / investment planning (planning, not cost-model)",
          role:
            "The IT investment plan — strategic vs run allocation, the funding " +
            "model, and the budget the strategy is expressed in — the investment-" +
            "portfolio source of truth the strategy allocates against.",
          examples: ["Apptio (IT planning view)", "Anaplan IT planning", "Workday Adaptive Planning", "ServiceNow ITFM (planning lens)"],
        },
      ],
      roles: [
        {
          title: "Chief Information Officer (CIO)",
          accountability:
            "The IT strategy, the operating model, the board narrative, business-" +
            "IT alignment, and the credibility of IT as a value partner — the owner " +
            "of where IT is going and how it is organized to get there.",
        },
        {
          title: "IT Chief of Staff / Head of IT Strategy & Planning",
          accountability:
            "The strategy-to-operating-model trace, the roadmap, the planning " +
            "cycle, and the strategic-vs-run investment mix — the CIO's strategy " +
            "engine.",
        },
        {
          title: "Head of IT Portfolio & Demand Management",
          accountability:
            "Demand intake, prioritization governance, portfolio throughput, WIP " +
            "discipline, and roadmap delivery — the front door and the delivery " +
            "throughput.",
        },
        {
          title: "Head of IT Operating Model / Org Design",
          accountability:
            "Org design (centralized vs federated, product vs project), spans and " +
            "layers, decision rights, and the funding model — the operating-model " +
            "owner.",
        },
        {
          title: "Business Relationship Manager (BRM) / Value-stream lead",
          accountability:
            "Business-IT alignment at the value-stream level — co-ownership, " +
            "value-stream funding, demand shaping, and IT satisfaction with the " +
            "business partner.",
        },
        {
          title: "Value-Management Office Lead",
          accountability:
            "Benefits definition, value-realization tracking, and the co-owned " +
            "value narrative — proving the strategy paid off.",
        },
      ],
      regulatoryFrames: [
        {
          name: "IT governance & board-oversight expectations (e.g. COBIT, board technology oversight)",
          relevance:
            "IT strategy and governance operate under board and audit-committee " +
            "technology-oversight expectations — decision rights, investment " +
            "governance, and risk oversight must be defensible and auditable, " +
            "shaping the operating model's governance design.",
        },
        {
          name: "Workforce, labor & change-management obligations",
          relevance:
            "Operating-model and org-design change is bounded by employment law, " +
            "works-council/union consultation (where applicable), and change-" +
            "management obligations — the people side of the reorg is constrained, " +
            "not free.",
        },
        {
          name: "Sourcing, outsourcing & vendor-governance regulation",
          relevance:
            "Talent and sourcing strategy (outsourcing, offshoring, managed " +
            "services) is bounded by procurement governance, data-protection on " +
            "outsourced work, and (in regulated industries) outsourcing/concentration-" +
            "risk rules that constrain the sourcing options.",
        },
        {
          name: "Capital allocation, investment-governance & financial controls",
          relevance:
            "IT investment governance must respect capital-allocation, business-" +
            "case, and financial-control standards so the strategy's funding model " +
            "and value claims are defensible to the CFO, audit, and the board.",
        },
      ],
      canonicalTerms: [
        {
          term: "IT operating model",
          definition:
            "How IT is organized to deliver value — the structure (centralized/" +
            "federated), the funding model (product/project), decision rights, " +
            "demand governance, talent model, and how all of these fit together to " +
            "deliver the strategy.",
        },
        {
          term: "Centralized vs federated (vs hybrid)",
          definition:
            "The org-design axis for IT — centralized (one IT, scale and standards) " +
            "vs federated (IT distributed to business units, proximity and speed) " +
            "vs hybrid/federated-with-shared-platform; the trade-off is control and " +
            "scale vs responsiveness and alignment.",
        },
        {
          term: "Product vs project operating model",
          definition:
            "Funding and organizing work through persistent, outcome-owning " +
            "PRODUCT teams (stable funding, product owners) vs temporary, scope-" +
            "funded PROJECTS; the dominant operating-model shift, and a funding-and-" +
            "governance change, not a rename.",
        },
        {
          term: "Decision rights",
          definition:
            "Who is authorized to decide what — investment approvals, architecture " +
            "exceptions, prioritization — sized to materiality; the often-ignored " +
            "core of operating-model change, because moving boxes without moving " +
            "decision rights reverts.",
        },
        {
          term: "Demand management",
          definition:
            "The governed front door for business demand into IT — intake, " +
            "prioritization criteria, decision rights, and WIP limits — that " +
            "prevents portfolio overload and shadow IT and makes IT easy to do " +
            "business with.",
        },
        {
          term: "Value realization / benefits realization",
          definition:
            "Measuring whether the business value committed in an IT business case " +
            "actually showed up post-delivery, co-owned with named business benefit " +
            "owners — closing the loop IT usually leaves open.",
        },
        {
          term: "Business-IT alignment",
          definition:
            "The degree to which the IT strategy and roadmap are co-owned with, " +
            "funded by, and measured on the outcomes of the business — the " +
            "perennial, never-fully-solved gap that decides whether strategy lands.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "IT strategy is bound to a deliverable operating model",
        authoritativeSource:
          "The IT strategy + operating-model blueprint: strategy themes traced to " +
          "an explicit funding model, decision rights, demand governance, org " +
          "design, and talent plan",
        whatGoodEvidenceLooksLike:
          "Every strategy theme tied to an operating-model and funding change, the " +
          "strategic-vs-run mix actually shifting, decision rights and demand " +
          "governance defined, and a talent plan backing the critical capabilities.",
        weakEvidenceToReject:
          "A vision/transformation deck with themes and ambition but no operating-" +
          "model, funding-model, governance, or talent section — strategy with no " +
          "delivery engine.",
      },
      {
        claim: "Operating-model change moved decision rights and incentives, not just boxes",
        authoritativeSource:
          "Operating-model design evidence: the before/after decision-rights " +
          "model, funding model, and incentive changes alongside the org chart",
        whatGoodEvidenceLooksLike:
          "Decision rights, the funding model (product vs project), and incentives " +
          "demonstrably changed with the structure, with product teams that own " +
          "outcomes and stable funding — not project work under a product label.",
        weakEvidenceToReject:
          "A new org chart and titles with unchanged decision rights, funding, and " +
          "incentives — a box-moving reorg presented as operating-model change.",
      },
      {
        claim: "Business-IT alignment and value-stream co-ownership",
        authoritativeSource:
          "Alignment evidence: co-owned roadmap, value-stream funding, shared " +
          "outcome metrics, and the business-IT alignment score / IT NPS trend",
        whatGoodEvidenceLooksLike:
          "A roadmap co-owned and value-stream-funded with the business, shared " +
          "outcome metrics, alignment score and IT NPS trending up, and demand " +
          "flowing through a governed front door rather than shadow IT.",
        weakEvidenceToReject:
          "An IT-authored roadmap asserted as 'aligned' with no business co-" +
          "ownership, no value-stream funding, and no alignment/satisfaction " +
          "evidence — alignment claimed, not demonstrated.",
      },
      {
        claim: "Strategy value was realized and measured post-delivery",
        authoritativeSource:
          "Value-realization tracking: committed business-case benefits matched to " +
          "measured post-delivery outcomes with named owners and attribution basis",
        whatGoodEvidenceLooksLike:
          "Committed benefits with named business owners, measured realized " +
          "outcomes post-delivery, a stated attribution basis, and value " +
          "realization % trended — the loop closed and co-owned with the business.",
        weakEvidenceToReject:
          "'We delivered the system' reported as success with benefits claimed at " +
          "approval and never tracked, no named benefit owner, and no measured " +
          "post-delivery outcome.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Behind your IT/digital strategy, is there an explicit operating model to deliver it — a funding model, decision rights, demand governance, and a talent plan — or is the strategy a deck with no delivery engine?",
      "In your last operating-model change, did decision rights, the funding model, and incentives actually move — or did you redraw the org chart while the same people kept deciding and funding the same way?",
      "Is your IT strategy genuinely co-owned with the business — funded by value stream and measured on business outcomes — or does IT run its own roadmap while the business routes around it with shadow IT?",
      "Is your governance right-sized to decision materiality with clear decision rights and thresholds — or does every decision queue behind one heavyweight board, so strategy stalls and teams route around it?",
      "How much is in flight versus actually finishing — is your portfolio overloaded with WIP and starting everything, or does demand governance sequence work and limit WIP so initiatives complete?",
      "Does your IT strategy have a matching talent and sourcing strategy — do you have or can you credibly source the critical skills it depends on — or is execution quietly blocked on capabilities you don't have?",
      "After you deliver a strategic initiative, do you measure and prove the business value it realized against the case — or do you report that the system shipped and never close the loop on the outcome?",
      "What share of your IT investment is going to strategic change versus run, and is the trend actually shifting toward the strategy — or is the strategy aspiration that the portfolio never backs?",
    ],
    maturitySignals: [
      "The IT strategy is paired with an explicit operating model — funding model, decision rights, demand governance, org design, and talent plan — and every strategy theme traces to an operating-model change, not just a slide.",
      "Operating-model changes move decision rights, the funding model, and incentives with the org chart, so product teams own outcomes and stable funding rather than reverting to project behavior under new labels.",
      "The strategy is co-owned with the business and value-stream-funded, with shared outcome metrics, a rising alignment score and IT NPS, and demand flowing through a governed front door instead of shadow IT.",
      "Governance is right-sized to materiality with clear decision rights and WIP limits, so time-to-decision is fast, throughput is high, and the portfolio finishes initiatives rather than starting everything.",
      "A value-management discipline measures realized business value post-delivery against committed benefits with named owners, so the CIO can prove the strategy paid off and fund the next ask with evidence.",
    ],
    redFlags: [
      "A glossy IT/digital strategy with no operating model behind it — no funding model, decision rights, demand governance, or talent plan — so it stalls within a year and resurfaces as next year's strategy.",
      "An operating-model 'transformation' executed as a box-moving reorg — new titles and reporting lines with unchanged decision rights, funding, and incentives — that reverts to the prior power structure within quarters.",
      "IT runs its own roadmap while the business routes around it with shadow IT — low alignment score and IT NPS, no value-stream funding, and the perennial business-IT gap never actively governed.",
      "Every decision queues behind one heavyweight governance board regardless of materiality, the portfolio is overloaded with WIP and finishes little, and delivered systems are reported as success with value never measured.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Strategic portfolio / SPM-PPM platforms (Planview, ServiceNow SPM, Jira Align)",
        category: "Strategic portfolio, roadmap, product/project funding, throughput, value tracking",
        switchingCost:
          "High — the curated portfolio taxonomy, roadmap history, funding model, and value-tracking configuration accrete; re-platforming the planning backbone is a multi-quarter program and the real lock-in.",
        renewalDynamics:
          "Subscription by user/portfolio scope; agile/value-stream, product-funding, and value-realization modules increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Demand-management / intake (ServiceNow, Planview, Aha!)",
        category: "Demand intake, prioritization, decision rights, demand governance",
        switchingCost:
          "Moderate-to-high — the configured intake workflows, prioritization criteria, decision-rights model, and demand history accrete; re-implementing the front door is costly even though feeds re-map.",
        renewalDynamics:
          "Often bundled with the SPM/ITSM suite; the lock-in is the governed front-door configuration and its integration to the portfolio backbone.",
      },
      {
        vendorName: "Org-design & workforce analytics (OrgVue, Workday/SuccessFactors org modules)",
        category: "Org design, spans and layers, decision-flow, skills inventory, operating-model modeling",
        switchingCost:
          "Moderate — the org model, scenario library, and skills taxonomy accrete, but data is re-ingestible from HRIS; switching cost rises with the depth of curated operating-model scenarios.",
        renewalDynamics:
          "Subscription by employee/scope or bundled with the HRIS; the value lever is realized de-layering and operating-model redesign, and stickiness is the curated scenario model.",
      },
      {
        vendorName: "Strategy / management-consulting & advisory firms",
        category: "IT strategy, operating-model design, transformation advisory (the human delivery)",
        switchingCost:
          "Low-to-moderate per engagement, but high relationship/knowledge lock-in — the firm holds the strategy context, the operating-model design, and the change-program momentum; switching mid-transformation is disruptive.",
        renewalDynamics:
          "Project/retainer-based; the lever is in-housing strategy and operating-model capability (the CIO's own strategy office) to reduce dependence and cost over time.",
      },
      {
        vendorName: "IT financial / investment-planning platforms (Apptio planning, Anaplan, Adaptive)",
        category: "IT investment planning, strategic-vs-run allocation, funding model (the planning lens)",
        switchingCost:
          "Moderate-to-high — the planning model, allocation logic, and history accrete; re-building the investment-planning model on a new platform is a multi-quarter effort.",
        renewalDynamics:
          "Subscription by planning scope/users; bundling with the broader FP&A or TBM stack and planning-model depth drive stickiness and price.",
      },
    ],
    switchingCosts:
      "The strategic-portfolio/SPM platform is the stickiest layer — the curated " +
      "portfolio taxonomy, roadmap history, funding model, and value-tracking " +
      "configuration are the lock-in, and a re-platform is a multi-quarter " +
      "program. Demand-management and investment-planning configurations are " +
      "moderately sticky (the governed front-door and planning-model logic, more " +
      "than the data). Org-design analytics and the curated operating-model " +
      "scenarios are replaceable but accrete value. The largest non-tooling " +
      "dependency is the strategy/transformation ADVISORY relationship — the firm " +
      "holds the strategy context and change momentum — so the durable lever is " +
      "in-housing the CIO's own strategy and operating-model capability rather " +
      "than re-buying it every cycle.",
    negotiationLevers: [
      "Re-price SPM/portfolio platform subscriptions on realized adoption (active portfolio, governed demand, tracked value) rather than promised seat scope",
      "Bundle demand-management and value-realization modules against the broader SPM/ITSM suite versus best-of-breed at renewal to discipline premium-tier pricing",
      "In-house strategy and operating-model capability (a CIO strategy office) to reduce advisory-firm dependence, and contract advisory on outcomes/capability-transfer rather than open-ended retainers",
      "Tie org-design and investment-planning tooling spend to realized operating-model change and investment-mix shift, not to scope or headcount",
      "Secure data-export, model-portability, and taxonomy-ownership rights on the portfolio and planning backbones to prevent strategy-model lock-in",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      strategy_claim: [
        "the strategy traced to an explicit delivery operating model (funding, decision rights, demand governance, talent)",
        "the strategic-vs-run investment mix and whether it is actually shifting",
        "business co-ownership and value-stream funding basis",
      ],
      operating_model_claim: [
        "the before/after decision-rights model, not just the org chart",
        "the funding-model change (product vs project) and incentive changes",
        "evidence the change held rather than reverting to prior behavior",
      ],
      alignment_claim: [
        "co-owned roadmap and value-stream funding evidence",
        "business-IT alignment score / IT NPS and its trend",
        "shared outcome metrics, not IT-throughput metrics presented as alignment",
      ],
      governance_claim: [
        "decision rights and thresholds sized to materiality",
        "time-to-decision cycle time and demand-intake cycle time",
        "WIP vs throughput, not started-count presented as delivery",
      ],
      value_claim: [
        "committed business-case benefits with named business owners",
        "measured realized outcomes post-delivery with the attribution basis",
        "value realization % co-owned with the business, not claimed at approval",
      ],
      value_projection: [
        "value sized on the operating model that will deliver it (not a headline transformation ambition)",
        "lever ranges weighted to governance/talent durability, given as labelled planning ranges",
        "explicit haircut factors (operating-model revert, alignment drift, talent gap, value-realization gap)",
        "the business co-ownership and decision-rights assumptions behind durability",
      ],
    },
    citationStandard:
      "Strategy and operating-model claims cite the source of truth (SPM/" +
      "portfolio, demand-management, HRIS/org-design, value-realization, " +
      "investment-planning) and the period. Strategy claims trace ambition to an " +
      "explicit delivery operating model — never a vision deck with no funding " +
      "model, decision rights, or talent plan. Operating-model claims show the " +
      "decision-rights and funding/incentive change, not just the org chart, and " +
      "whether it held. Alignment claims cite co-ownership, value-stream funding, " +
      "and the alignment/NPS trend — never IT-throughput metrics presented as " +
      "alignment. Value claims state committed benefits with named owners and " +
      "MEASURED realized outcomes with an attribution basis — never benefits " +
      "claimed at approval and untracked. Value projections size against the " +
      "delivery operating model, give labelled planning ranges weighted to " +
      "governance and talent durability, name the haircut factors (operating-model " +
      "revert, alignment drift, talent gap, value-realization gap), and state the " +
      "co-ownership and decision-rights assumptions — never a headline digital-" +
      "transformation number with no operating model behind it.",
  },

  hedgeRules: {
    whenToHedge: [
      "A strategy is described without an operating model to deliver it — gate any value estimate on the operating-model readiness and surface the missing funding/decision-rights/talent plan before quoting a prize.",
      "An operating-model change is cited as done on the basis of a new org chart — flag whether decision rights, funding, and incentives actually moved and apply a revert planning haircut if they did not.",
      "Alignment is asserted without business co-ownership evidence — frame as IT-asserted alignment pending alignment-score/value-stream-funding evidence, and apply an alignment-drift haircut.",
      "Strategy value is sized as a headline transformation ambition with no delivery model — frame as aspiration, not a realizable prize, until the operating model and talent plan that deliver it are evidenced.",
    ],
    inferenceLanguage: [
      "Across enterprise IT organizations at this scale, the strategic-vs-run investment mix and business-IT alignment typically run... (industry pattern, not your measured figure)...",
      "Without your decision-rights and funding-model evidence, the industry pattern suggests operating-model reorgs that move only boxes revert by roughly... within a year...",
      "Peer IT organizations commonly sit mid-band on business-IT alignment and IT NPS before value-stream co-funding narrows the gap...",
      "Treating this as a planning range on the operating model that would deliver the strategy rather than your measured delivery model...",
    ],
    flagWithoutEvidence: [
      "A specific realized strategy-value or transformation-ROI number for this tenant",
      "This tenant's actual strategic-vs-run mix, business-IT alignment score, roadmap delivery %, or value realization %",
      "An operating-model change asserted as durable without decision-rights, funding, and incentive evidence",
      "A strategy-value prize sized as a headline transformation ambition with no operating model and talent plan behind it",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "strategy-to-operating-model trace / how the strategy will actually be delivered",
      exhibitKind: "chart",
      chartKind: "swimlane",
      note: "Swimlane mapping each strategy theme to its operating-model changes (funding model, decision rights, demand governance, org design, talent) so the delivery engine behind the ambition is visible — or its absence is exposed.",
    },
    {
      questionPattern:
        "strategy value story / from ambition to durable realized value",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      note: "Bridge from the strategy ambition to realizable value on the delivering operating model to durable value, with the operating-model-revert, alignment-drift, talent-gap, and value-realization haircuts shown explicitly.",
    },
    {
      questionPattern:
        "value sensitivity to operating-model revert, alignment drift, and talent gap",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of strategy-value sensitivity to the dominant haircut factors (operating-model revert without decision-rights/incentive change, business-IT alignment drift, talent and sourcing gap, value-realization measurement gap).",
    },
    {
      questionPattern: "CIO strategy & operating-model KPI scorecard vs benchmarks",
      exhibitKind: "table",
      note: "Strategic-vs-run spend %, business-IT alignment score, roadmap delivery %, product-vs-project mix, governance decision-cycle time, IT value realization %, demand-intake cycle time, span of control, value-stream-funded %, IT NPS, strategic-initiative throughput, critical-skills coverage % versus planning ranges.",
    },
    {
      questionPattern: "operating-model options / centralized vs federated vs product",
      exhibitKind: "table",
      note: "Per operating-model option: structure (centralized/federated/hybrid), funding model (product/project), decision-rights change, span/layer impact, alignment and throughput implications, talent implications, and the revert-risk if decision rights/incentives don't move.",
    },
    {
      questionPattern: "investment-mix shift over time / strategic vs run capacity",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend the strategic (change/grow) share of investment and roadmap delivery % against the planning range, annotating where freed run capacity was redeployed to the strategy.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The strategy is bound to an explicit operating model FIRST — funding model, decision rights, demand governance, and talent plan — so ambition has a delivery engine rather than being a deck that stalls",
      "Operating-model change moves decision rights, the funding model, and incentives with the org chart, so the change sticks instead of reverting to the prior power structure under new labels",
      "The strategy is co-owned with the business and value-stream-funded, narrowing the perennial alignment gap so the business pulls the strategy rather than routing around IT with shadow IT",
      "A value-management discipline measures realized value post-delivery and a right-sized governance + WIP discipline lifts throughput, so the strategy demonstrably delivers and funds its next stage",
    ],
    failureDrivers: [
      "A glossy strategy with no operating model behind it — no funding, decision rights, demand governance, or talent plan — that stalls within a year and re-launches as next year's strategy",
      "An operating-model change executed as a box-moving reorg with unchanged decision rights, funding, and incentives, so old behaviors persist and the model reverts within quarters",
      "IT running its own roadmap while the business routes around it — the perennial alignment gap never governed, no value-stream funding, low IT NPS, and pervasive shadow IT",
      "Heavyweight one-size governance that bottlenecks delivery, a portfolio overloaded with WIP that finishes little, and delivered systems reported as success with value never measured",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Strategy-to-operating-model framing and demand/governance discipline adopt " +
      "first because they are mostly process and make delivery tangible. Run-to-" +
      "strategic mix shift and throughput uplift follow as governance and WIP " +
      "limits take hold. The hard, slow, cultural changes — the project-to-product " +
      "shift, federated decision rights, value-stream co-funding, and a value-" +
      "management discipline — lag because they require the business to co-own " +
      "outcomes and funding and require decision rights and incentives to actually " +
      "move. They are where durability is won or lost, so they decide whether the " +
      "strategy lands and stays landed.",
    roiClarity: "low",
    roiClarityBasis:
      "IT-strategy ROI is inherently softer than cost or architecture ROI because " +
      "value flows through the BUSINESS outcomes the strategy enables, attribution " +
      "is shared and contestable, and the operating-model changes that drive " +
      "durability (decision rights, alignment, talent) are hard to isolate from " +
      "other factors. ROI is firmer where a value-management discipline measures " +
      "realized benefits against committed cases with named owners and where the " +
      "investment-mix shift is tracked — but soft where value is claimed at " +
      "approval and never measured, where alignment and operating-model change " +
      "revert, or where the strategy was a headline ambition with no delivery " +
      "model. This is why the value model insists on sizing against the delivering " +
      "operating model, explicit haircuts for revert and drift, co-ownership " +
      "assumptions, and measured realized value rather than a transformation " +
      "headline.",
  },

  regulatoryFrame: {
    name: "IT governance, board-oversight, workforce-change & investment-control frames",
    relevance:
      "The dominant constraints on IT strategy and operating-model change: IT " +
      "governance and investment decisions operate under board/audit-committee " +
      "technology-oversight expectations and capital-allocation/financial-control " +
      "standards, so decision rights and value claims must be defensible and " +
      "auditable; operating-model and org-design change is bounded by employment " +
      "law, works-council/union consultation (where applicable), and change-" +
      "management obligations (the people side is constrained, not free); and " +
      "talent/sourcing strategy is bounded by procurement and (in regulated " +
      "industries) outsourcing/concentration-risk rules (see vocabulary." +
      "regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (cio)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
