// Consilium expert — ESG & Sustainability (cross-cutting).
//
// W3 backlog-wave (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-industry ExpertPack v2 with no industry×function key. It owns the
// enterprise sustainability and climate question the board, the CFO, the CSO,
// and increasingly the auditor and the regulator live with: "do we know our
// carbon footprint across all three scopes, do we have a credible (not just
// pledged) path to our targets, can we PROVE the numbers we disclose to an
// assured standard, and is any of this a business win or purely cost and
// compliance?"
//
// CORE DOCTRINE — DISCLOSURE IS BECOMING MANDATORY AND ASSURED, SO DATA LINEAGE
// BEATS NARRATIVE — AND THE HONEST EXPERT REFUSES THREE COMFORTABLE STORIES.
// (1) SCOPE 3 IS THE FOOTPRINT AND THE HARDEST PART: for most enterprises Scope 3
// (value-chain emissions) is 70%+ of the total and is measured from
// supplier/spend proxies, not meters — supplier-data quality is the binding
// constraint, and a footprint dominated by spend-based estimates is an estimate
// wearing a number's clothes. (2) NET-ZERO PLEDGES OUTRUN CREDIBLE ROADMAPS:
// the target year and the marginal-abatement-cost curve that would actually get
// there are usually disconnected, so the tell is the gap between the SBTi-style
// trajectory and the funded, costed decarbonization plan — not the pledge. (3)
// REPORTING IS NOW REGULATED AND ASSURED (CSRD/ESRS limited assurance today,
// reasonable assurance arriving; ISSB/IFRS S1-S2; SEC climate; GHG Protocol as
// the accounting bedrock; EU Taxonomy for "green"): so the maturity step that
// matters is financial-reporting-grade lineage, controls, and auditability over
// ESG data — narrative and ratings are not the work. And the honest ROI posture:
// decarbonization is mostly a COST / COMPLIANCE / RISK play (avoided regulatory
// and transition risk, license to operate, cost of capital, talent), not a
// near-term margin win — energy/resource-efficiency and green-premium/financing
// levers are the exceptions, and the expert says which is which rather than
// selling decarbonization as free money. ESG ratings are noisy, divergent across
// providers, and gameable — useful as an investor-relations signal, not as
// ground truth. DISTINCT from the Supply Chain Transformation expert (which owns
// plan-to-deliver throughput and supplier reliability) — this expert consumes
// the supply chain as the Scope-3 measurement surface — and from the Enterprise
// Risk, Compliance & Internal Audit expert (which owns the broad GRC/assurance
// layer) — this expert owns the carbon/ESG SUBJECT-MATTER depth and hands the
// disclosure-controls program to that assurance layer.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const esgSustainabilityExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.esg-sustainability",
    expertName: "ESG & Sustainability Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "esg-sustainability",
    scopeNote:
      "Cross-cutting, cross-industry sustainability and climate of the " +
      "enterprise: carbon accounting across Scope 1 (direct), Scope 2 " +
      "(purchased energy) and Scope 3 (value chain); the decarbonization " +
      "roadmap and net-zero / SBTi trajectory; ESG and sustainability reporting " +
      "and its assurance (CSRD/ESRS, ISSB/IFRS S1-S2, SEC climate, GHG " +
      "Protocol, EU Taxonomy); supply-chain / Scope-3 traceability and supplier " +
      "data; energy and resource (water, waste) efficiency; ESG ratings and " +
      "investor disclosure; and green / transition finance. DOCTRINE: Scope 3 is " +
      "70%+ of most footprints and the hardest to measure (supplier-data quality " +
      "is the bottleneck); net-zero pledges outrun credible costed roadmaps; " +
      "disclosure is becoming mandatory and ASSURED, so financial-grade data " +
      "lineage and auditability beat narrative; ratings are noisy and gameable; " +
      "and decarbonization is honestly a cost/compliance/risk play more than a " +
      "near-term margin win — except energy/resource efficiency and green-" +
      "premium/financing levers. DISTINCT from the Supply Chain Transformation " +
      "expert (consumes the supply chain as the Scope-3 surface, does not own " +
      "throughput) and the Enterprise Risk, Compliance & Internal Audit expert " +
      "(hands the disclosure-controls program to that assurance layer). Excludes " +
      "engineering-grade process / energy-systems design and deep social-and-" +
      "governance (labor, board) depth those specialist domains own.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "scope1_2_emissions",
        name: "Scope 1 & 2 emissions (tCO2e)",
        definition:
          "Total direct (Scope 1: owned combustion, fleet, fugitive) and " +
          "purchased-energy (Scope 2: electricity, steam, heat) greenhouse-gas " +
          "emissions in tonnes of CO2-equivalent, with Scope 2 reported both " +
          "location-based and market-based per the GHG Protocol.",
        unit: "tCO2e / year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20000,
          high: 2000000,
          basis:
            "Scope 1+2 for a large enterprise varies by sector by orders of " +
            "magnitude (a heavy-industrial site dwarfs a services firm), so this " +
            "is read as a trend against a base year and an intensity, not an " +
            "absolute target",
          label: "planning-range",
        },
        dataSource:
          "Carbon-accounting platform: metered energy, fuel, and refrigerant " +
          "data from utility bills, fleet/fuel systems, and facilities, with " +
          "emission factors applied per the GHG Protocol",
        whyItMatters:
          "The measurable, controllable core of the footprint and where the " +
          "firm has direct levers (efficiency, electrification, renewable " +
          "procurement). It is the most defensible part of any disclosure " +
          "because it is metered rather than estimated — but for most " +
          "enterprises it is the minority of total emissions.",
      },
      {
        key: "scope3_emissions",
        name: "Scope 3 (value-chain) emissions (tCO2e)",
        definition:
          "Total indirect value-chain emissions across the fifteen GHG " +
          "Protocol categories (purchased goods & services, capital goods, " +
          "transport, use of sold products, etc.), in tonnes CO2-equivalent.",
        unit: "tCO2e / year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 100000,
          high: 20000000,
          basis:
            "Scope 3 commonly dwarfs Scope 1+2 and is dominated by purchased " +
            "goods/services and use-of-sold-products; magnitude is sector- and " +
            "boundary-dependent and mostly estimated, so read as trend, " +
            "category mix, and data-quality, not an absolute",
          label: "planning-range",
        },
        dataSource:
          "Carbon-accounting platform: spend- and activity-based estimates " +
          "from procurement/ERP spend, supplier-reported primary data, and " +
          "product-use models, mapped to the fifteen Scope-3 categories",
        whyItMatters:
          "Usually 70%+ of the total footprint and therefore where the real " +
          "climate exposure and the real decarbonization challenge live — but " +
          "it is the hardest to measure, mostly spend-estimated rather than " +
          "supplier-measured, so the number carries far more uncertainty than " +
          "Scope 1+2 and is read alongside its data-quality split.",
      },
      {
        key: "carbon_intensity_revenue",
        name: "Carbon intensity per revenue / unit",
        definition:
          "Total (Scope 1+2, and increasingly +3) emissions divided by a " +
          "normalizing denominator — revenue, physical output, or unit produced " +
          "— so absolute footprint is comparable across growth and to peers.",
        unit: "tCO2e per $M revenue (or per unit)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 500,
          basis:
            "Intensity spans orders of magnitude by sector (services low, " +
            "heavy industry high); the meaningful read is the trend versus the " +
            "base year and the decarbonization trajectory, not a cross-sector " +
            "number",
          label: "planning-range",
        },
        dataSource:
          "Carbon-accounting platform emissions joined to ERP/finance revenue " +
          "or production-volume data at a stated boundary",
        whyItMatters:
          "Normalizes the footprint so growth doesn't mask (or falsely flatter) " +
          "progress, and is how SBTi-style intensity targets and investor " +
          "comparisons are framed — but it can hide rising absolute emissions, " +
          "so it is read together with absolute tCO2e, not instead of it.",
      },
      {
        key: "scope3_primary_data_pct",
        name: "% Scope-3 from primary supplier data",
        definition:
          "Share of Scope-3 emissions calculated from supplier-specific, " +
          "primary (measured/reported) data rather than spend- or industry-" +
          "average emission factors — the data-quality measure of the footprint.",
        unit: "% of Scope-3 tCO2e",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 50,
          basis:
            "Most enterprises start with Scope 3 almost entirely spend-/" +
            "average-estimated; even maturing programs reach only a minority on " +
            "primary supplier data because it depends on suppliers measuring and " +
            "reporting, which lags",
          label: "planning-range",
        },
        dataSource:
          "Carbon-accounting platform calculation method tags joined to the " +
          "supplier engagement / primary-data-collection program",
        whyItMatters:
          "The honesty meter on the largest part of the footprint. A Scope-3 " +
          "number built almost entirely on spend proxies is an estimate that " +
          "moves with spend, not with real decarbonization — raising primary-" +
          "data share is the precondition for a Scope-3 figure anyone can assure " +
          "or act on.",
      },
      {
        key: "decarb_target_gap",
        name: "Decarbonization vs SBTi target gap",
        definition:
          "The gap between the firm's projected emissions trajectory (under " +
          "funded, costed abatement actions) and the science-based / committed " +
          "target trajectory (e.g. SBTi-validated) for the same horizon, in " +
          "tCO2e or % off-path.",
        unit: "% off target trajectory",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 60,
          basis:
            "Many committed firms have a validated target but a funded plan " +
            "that closes only part of the required reduction; the gap between " +
            "pledge and costed roadmap is common and large, especially on " +
            "Scope 3",
          label: "planning-range",
        },
        dataSource:
          "Decarbonization roadmap model (marginal-abatement-cost curve and " +
          "funded initiative pipeline) compared to the validated target " +
          "trajectory",
        whyItMatters:
          "The single number that separates a credible plan from a pledge. A " +
          "validated net-zero target with a large unfunded gap to its own " +
          "trajectory is the central honesty risk — it is the metric that " +
          "exposes whether the commitment is backed by a costed, funded roadmap.",
      },
      {
        key: "renewable_energy_pct",
        name: "Renewable electricity %",
        definition:
          "Share of purchased/consumed electricity sourced from renewables — " +
          "via on-site generation, PPAs, or unbundled certificates — the primary " +
          "Scope-2 (market-based) reduction lever.",
        unit: "% of electricity",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 100,
          basis:
            "Renewable-electricity share ranges widely; RE100-committed firms " +
            "target 100%, but quality varies — additional PPAs vs unbundled " +
            "certificates differ materially in real impact and in assurance " +
            "credibility",
          label: "planning-range",
        },
        dataSource:
          "Energy-procurement records and certificate/PPA registry joined to " +
          "the carbon-accounting platform's market-based Scope-2 calculation",
        whyItMatters:
          "The most direct, available lever on Scope 2 and a headline net-zero " +
          "claim — but the quality of the instrument matters: unbundled " +
          "certificates lower the market-based number without necessarily " +
          "changing real grid emissions, so it is read with the instrument type, " +
          "not as a single percentage.",
      },
      {
        key: "report_assurance_level",
        name: "ESG report assurance level",
        definition:
          "The level of independent external assurance over disclosed " +
          "sustainability metrics — none, limited (negative comfort), or " +
          "reasonable (positive opinion, financial-statement-grade) — expressed " +
          "as the share of material metrics at each level.",
        unit: "% of material metrics assured (by level)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 70,
          basis:
            "Most ESG disclosure today is unassured or at limited assurance; " +
            "CSRD mandates limited assurance with reasonable assurance arriving, " +
            "so coverage is rising fast but reasonable-assurance coverage remains " +
            "low",
          label: "planning-range",
        },
        dataSource:
          "External assurance engagement records mapped to the materiality " +
          "assessment and the disclosed-metric set in the reporting platform",
        whyItMatters:
          "Disclosure is moving into regulated, assured filings, so assurance " +
          "level is the credibility of the whole report. Low or absent assurance " +
          "means disclosed metrics carry materially more uncertainty than the " +
          "financials beside them — and the assurance bar is rising faster than " +
          "ESG data quality.",
      },
      {
        key: "disclosure_restatement_rate",
        name: "ESG disclosure restatement rate",
        definition:
          "Share of previously-disclosed material ESG metrics that are " +
          "subsequently restated (beyond a materiality threshold) due to method " +
          "change, error, or boundary change — the reliability tell of the data.",
        unit: "% of material metrics restated / cycle",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 25,
          basis:
            "Restatement is common in immature ESG reporting because methods, " +
            "boundaries, and emission factors evolve and early data is estimated; " +
            "a falling rate signals maturing controls and lineage",
          label: "planning-range",
        },
        dataSource:
          "Reporting platform version history and the disclosure-controls log " +
          "tracking restatements against prior filings",
        whyItMatters:
          "The honesty signal on data reliability. Frequent restatement under a " +
          "rising assurance bar is a governance and audit risk — and the exact " +
          "problem financial-grade lineage and disclosure controls exist to " +
          "shrink; a suspiciously zero rate usually means restatements aren't " +
          "tracked rather than that the data is perfect.",
      },
      {
        key: "supplier_esg_data_coverage",
        name: "Supplier ESG data coverage",
        definition:
          "Share of in-scope suppliers (especially the spend- and emissions-" +
          "material ones) that have provided current, usable ESG / emissions " +
          "data — vs suppliers represented only by spend-based or industry-" +
          "average proxies.",
        unit: "% of material suppliers (or % of supplier spend)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 65,
          basis:
            "Supplier ESG-data coverage is the Scope-3 bottleneck; programs " +
            "typically secure data from the largest suppliers first and lag on " +
            "the long tail, so coverage by spend runs ahead of coverage by count",
          label: "planning-range",
        },
        dataSource:
          "Supplier engagement / ESG-data-collection platform (e.g. EcoVadis, " +
          "CDP Supply Chain) joined to procurement spend and the supplier master",
        whyItMatters:
          "The binding constraint on Scope-3 quality and on the decarbonization " +
          "roadmap's largest lever. Without supplier data, Scope 3 stays an " +
          "estimate and supplier-level abatement can't be targeted — coverage is " +
          "the precondition for both an assurable footprint and real value-chain " +
          "reduction.",
      },
      {
        key: "energy_intensity",
        name: "Energy intensity",
        definition:
          "Total energy consumed per unit of output or revenue (e.g. MWh or GJ " +
          "per $M revenue or per unit produced) — the efficiency measure that " +
          "underlies both cost and Scope 1+2 emissions.",
        unit: "MWh per $M revenue (or per unit)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 800,
          basis:
            "Energy intensity spans orders of magnitude by sector; the read is " +
            "the trend against the base year and against process/efficiency " +
            "investment, not a cross-sector absolute",
          label: "planning-range",
        },
        dataSource:
          "Energy/utility metering and building/process management systems " +
          "joined to output or revenue from the ERP",
        whyItMatters:
          "The one ESG lever that is also a genuine cost win — energy " +
          "efficiency cuts emissions AND opex, so it is where the decarbonization " +
          "business case is strongest and most defensible. It is the honest " +
          "counterexample to 'decarbonization is pure cost.'",
      },
      {
        key: "waste_water_intensity",
        name: "Waste & water intensity",
        definition:
          "Resource use and waste normalized to output or revenue — water " +
          "withdrawn/consumed and waste generated (and % diverted from " +
          "landfill) per unit or per $M revenue — the non-carbon environmental " +
          "footprint.",
        unit: "m³ water / waste tonnes per $M revenue (or per unit)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 1000,
          basis:
            "Water and waste intensity are highly sector- and process-specific " +
            "(water-intensive manufacturing vs services differ enormously); read " +
            "as a trend and against local water-stress context, not an absolute",
          label: "planning-range",
        },
        dataSource:
          "Facilities / EHS systems for water withdrawal and waste streams " +
          "joined to output or revenue, with waste-diversion tracking",
        whyItMatters:
          "Material under CSRD/ESRS (which is double-materiality and broader " +
          "than carbon) and increasingly a license-to-operate and resource-cost " +
          "issue, especially in water-stressed regions — a reminder that ESG is " +
          "wider than emissions and that some levers carry real cost savings.",
      },
      {
        key: "esg_rating",
        name: "ESG rating",
        definition:
          "Third-party ESG rating(s) from providers (e.g. MSCI, Sustainalytics, " +
          "CDP score, S&P) — a relative assessment of ESG risk/performance used " +
          "in investor screening and indices.",
        unit: "rating / score (provider-specific scale)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Ratings are provider-specific and notoriously divergent — the same " +
            "firm can rate very differently across providers — so a single score " +
            "is read as one noisy investor signal, not as ground truth",
          label: "planning-range",
        },
        dataSource:
          "Third-party ESG rating providers and the firm's questionnaire/" +
          "disclosure submissions (CDP, EcoVadis, provider data requests)",
        whyItMatters:
          "Matters for investor access, index inclusion, and cost of capital, " +
          "so it is managed — but it is noisy, divergent across providers, and " +
          "gameable through disclosure completeness rather than real performance. " +
          "The honest expert treats it as an IR signal to manage, never as a " +
          "measure of actual environmental impact.",
      },
      {
        key: "green_capex_pct",
        name: "% capex green-taxonomy-aligned",
        definition:
          "Share of capital expenditure that meets a green-taxonomy alignment " +
          "test (e.g. EU Taxonomy: substantial contribution, do-no-significant-" +
          "harm, minimum safeguards) — the forward-looking transition-investment " +
          "measure investors and regulators read.",
        unit: "% of capex",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 60,
          basis:
            "Taxonomy-aligned capex share varies hugely by sector and by how " +
            "strictly the technical screening and DNSH criteria are applied; " +
            "early reporters often find a small aligned share once tested " +
            "rigorously",
          label: "planning-range",
        },
        dataSource:
          "Finance/ERP capex records mapped to taxonomy eligibility and " +
          "alignment screening, with DNSH and safeguards evidence",
        whyItMatters:
          "The metric that connects the decarbonization roadmap to the capital " +
          "plan and to green/transition finance — it signals whether the firm is " +
          "actually funding the transition. But strict screening (DNSH, " +
          "safeguards) is demanding, so a credible aligned-capex number is hard-" +
          "won and a soft one is a greenwashing risk.",
      },
    ],

    painThemes: [
      {
        key: "scope3_data_bottleneck",
        name: "Scope 3 is the footprint but built on estimates",
        description:
          "Scope 3 is typically 70%+ of total emissions yet is calculated " +
          "almost entirely from spend- and industry-average proxies because " +
          "suppliers don't measure or report — so the largest, most material " +
          "part of the footprint is an estimate that moves with spend, not with " +
          "real decarbonization, and can't be assured or acted on at the " +
          "supplier level.",
        detectionSignal:
          "Scope 3 reported as a single large number with little or no primary-" +
          "data share; emission factors applied to procurement spend; no " +
          "supplier-data-collection program; Scope 3 swinging with revenue/spend " +
          "rather than with abatement actions.",
        diagnosticQuestion:
          "What share of your Scope 3 is built on primary supplier data versus " +
          "spend/average proxies, and which categories and suppliers actually " +
          "drive it?",
      },
      {
        key: "pledge_outruns_roadmap",
        name: "Net-zero pledge outruns a credible costed roadmap",
        description:
          "A net-zero or SBTi-style target is committed and disclosed, but the " +
          "funded, costed abatement plan closes only part of the required " +
          "reduction — so there is a large gap between the pledge trajectory and " +
          "the marginal-abatement-cost curve the firm is actually financing, " +
          "especially on Scope 3.",
        detectionSignal:
          "A headline target year with no decarbonization roadmap mapped to " +
          "funded initiatives; reliance on offsets or future technology to close " +
          "the gap; the abatement plan absent from the capital plan; Scope 3 " +
          "reductions assumed but not contracted with suppliers.",
        diagnosticQuestion:
          "Behind your target, what does the funded, costed abatement curve " +
          "actually deliver by the target year — and how big is the gap you're " +
          "relying on offsets or unspecified action to close?",
      },
      {
        key: "data_lineage_not_audit_ready",
        name: "ESG data scattered and not assurance-ready",
        description:
          "ESG data lives in spreadsheets across facilities, procurement, HR, " +
          "and sustainability teams with undocumented assumptions and no " +
          "financial-grade lineage — yet it is going into regulated, assured " +
          "filings under CSRD/ISSB, so disclosure outruns the data controls and " +
          "every assurance cycle becomes a scramble.",
        detectionSignal:
          "Metrics owned in spreadsheets with no source-to-disclosure trace; " +
          "emission factors and assumptions undocumented; finance and " +
          "sustainability numbers that don't reconcile; high restatement rate; " +
          "no disclosure-controls framework over ESG data.",
        diagnosticQuestion:
          "For the ESG metrics you disclose, can you trace each from source data " +
          "through method and assumptions to the filed number — and would that " +
          "trace survive a reasonable-assurance audit?",
      },
      {
        key: "decarb_seen_as_pure_cost",
        name: "Decarbonization framed as pure cost with no value lens",
        description:
          "Decarbonization is run as a compliance and cost exercise with no " +
          "explicit separation of the genuinely cost-saving levers (energy/" +
          "resource efficiency) from the cost-incurring ones — so either the " +
          "whole program is starved as overhead, or it is oversold as free " +
          "margin, and neither framing survives CFO scrutiny.",
        detectionSignal:
          "No marginal-abatement-cost curve distinguishing cost-saving from " +
          "cost-incurring actions; efficiency wins lumped with capital-heavy " +
          "abatement; business case asserted as either pure cost or pure ROI " +
          "rather than a mixed cost/compliance/risk/value story.",
        diagnosticQuestion:
          "Which of your decarbonization actions actually save money (efficiency, " +
          "energy), which are net cost for compliance/risk reasons, and is the " +
          "case framed honestly as that mix rather than as free margin or pure " +
          "overhead?",
      },
      {
        key: "ratings_chasing_over_substance",
        name: "Chasing noisy ESG ratings over real performance",
        description:
          "Effort goes into completing rating-provider questionnaires and " +
          "optimizing divergent third-party scores rather than into measured " +
          "emissions reduction and assurable data — so the firm manages a noisy, " +
          "gameable signal while the underlying footprint and data quality " +
          "stagnate.",
        detectionSignal:
          "Sustainability effort organized around rating-provider cycles; the " +
          "same firm rated very differently across providers with no reconciling " +
          "story; disclosure completeness improving while measured emissions and " +
          "primary-data share don't; greenwashing exposure in claims.",
        diagnosticQuestion:
          "How much of your sustainability effort is aimed at improving rating-" +
          "provider scores versus at measured emissions reduction and assurable " +
          "data — and do your ratings even agree with each other?",
      },
      {
        key: "siloed_esg_no_single_source",
        name: "Siloed ESG with no single source of disclosed truth",
        description:
          "Carbon accounting, supplier ESG data, energy/resource data, and the " +
          "disclosure report run in separate tools and teams with different " +
          "boundaries and taxonomies, so the same metric is computed differently " +
          "in different places and no one can produce one reconciled, current, " +
          "assurance-ready disclosure set.",
        detectionSignal:
          "Multiple emissions numbers with different boundaries; carbon-" +
          "accounting tool disconnected from the reporting/disclosure platform; " +
          "supplier data in a separate system; the disclosure report assembled " +
          "manually each cycle from spreadsheets.",
        diagnosticQuestion:
          "Can you produce one reconciled, current, source-traceable set of " +
          "disclosed ESG metrics on one boundary — or is each report stitched " +
          "together by hand from disconnected tools each cycle?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_scope3_estimation",
        name: "AI Scope-3 estimation & supplier-data enrichment",
        valueMechanism:
          "Use AI to map procurement spend and product data to the fifteen " +
          "Scope-3 categories, apply and improve emission factors, fill gaps " +
          "with modeled estimates, and progressively replace spend proxies with " +
          "ingested supplier-primary data — raising both the completeness and " +
          "the primary-data share of the largest, hardest part of the footprint " +
          "so it becomes assurable and supplier-level abatement can be targeted. " +
          "HONEST BOUND: AI estimation improves the proxy, but real quality only " +
          "comes from suppliers actually measuring — the tool accelerates, it " +
          "does not manufacture, primary data.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Procurement/ERP spend and product/category data mapped to Scope-3 categories",
          "Emission-factor libraries and supplier-master with material/spend criticality",
          "Supplier-reported primary emissions data where it exists, with method tags",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Spend-/average-based estimates must be labelled as such and never presented as measured — false precision is a disclosure risk",
          "Method changes and emission-factor updates restate prior numbers; the lineage and assumptions must be documented for assurance",
        ],
        metricsMoved: [
          "scope3_emissions",
          "scope3_primary_data_pct",
          "supplier_esg_data_coverage",
        ],
      },
      {
        key: "decarbonization_roadmap_optimizer",
        name: "Decarbonization roadmap & abatement-curve optimizer",
        valueMechanism:
          "Build and continuously update a marginal-abatement-cost curve across " +
          "candidate actions (efficiency, electrification, renewable " +
          "procurement, supplier engagement, process change) and optimize the " +
          "funded sequence against cost, abatement, and the target trajectory — " +
          "so the firm closes the gap between pledge and a costed, funded roadmap " +
          "and can see exactly which actions save money versus cost money for " +
          "compliance/risk reasons.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Activity-level emissions by source (Scope 1/2/3) and the validated target trajectory",
          "Abatement-action cost, abatement potential, and lead-time data",
          "The capital plan and financing constraints to fund the sequence",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Abatement costs and potentials are estimates — sensitivity and the cost-saving-vs-cost-incurring split must be explicit, not a single ROI",
          "Reliance on offsets or future technology to close the gap must be surfaced and bounded, not buried in the curve",
        ],
        metricsMoved: [
          "decarb_target_gap",
          "scope1_2_emissions",
          "energy_intensity",
        ],
      },
      {
        key: "esg_disclosure_lineage_controls",
        name: "ESG disclosure data lineage, controls & assurance-readiness",
        valueMechanism:
          "Bring scattered ESG data into a governed pipeline with source-to-" +
          "disclosure lineage, documented methods and assumptions, financial-" +
          "reporting-grade controls, and automated evidence assembly mapped to " +
          "CSRD/ESRS, ISSB, and SEC requirements — so disclosed metrics become " +
          "traceable, auditable, and assurance-ready and restatement risk falls, " +
          "closing the gap between rising mandatory-assurance regulation and " +
          "immature ESG data.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "ESG source systems and the spreadsheets where data currently lives, with method/assumption metadata",
          "The materiality assessment and the disclosure-standard requirement set (ESRS / ISSB / SEC)",
          "A control framework and evidence store extendable to ESG metrics",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Estimation methodologies and boundary choices are judgement a human owns — the tool tracks lineage, it does not bless the estimate",
          "ESG data feeding regulated filings inherits financial-reporting-grade control expectations; uncontrolled automation creates audit exposure",
        ],
        metricsMoved: [
          "report_assurance_level",
          "disclosure_restatement_rate",
          "scope3_primary_data_pct",
        ],
      },
      {
        key: "energy_resource_efficiency_ai",
        name: "AI energy & resource efficiency optimization",
        valueMechanism:
          "Apply AI to building, process, and fleet energy and to water/waste " +
          "streams — anomaly detection, load optimization, and predictive " +
          "control — to cut consumption and waste, which lowers both opex AND " +
          "Scope 1+2 emissions simultaneously. This is the archetype where " +
          "decarbonization is genuinely a cost WIN, and it is sized on measured " +
          "consumption reduction rather than asserted as a blanket saving.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Granular energy/utility metering and building/process management telemetry",
          "Water and waste-stream measurement from facilities/EHS systems",
          "Output/production data to normalize intensity",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Savings are sized on measured baseline-vs-actual consumption, not modeled assumptions, to keep the business case honest",
          "Optimization must respect process, comfort, and safety constraints — efficiency cannot override operational limits",
        ],
        metricsMoved: [
          "energy_intensity",
          "scope1_2_emissions",
          "waste_water_intensity",
        ],
      },
      {
        key: "sustainability_disclosure_copilot",
        name: "Sustainability disclosure & regulatory-mapping copilot",
        valueMechanism:
          "Ground a GenAI assistant on the firm's ESG data, methods, and the " +
          "disclosure-standard corpus (ESRS datapoints, ISSB, SEC, GHG Protocol, " +
          "EU Taxonomy) to draft disclosures, map data to required datapoints, " +
          "answer rating-provider and investor questionnaires from a single " +
          "source, and flag gaps and inconsistencies — compressing reporting " +
          "effort while keeping claims tied to traceable, cited data rather than " +
          "narrative.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Governed, current ESG data with lineage and the disclosure-standard requirement corpus",
          "Prior filings, the materiality assessment, and rating-provider questionnaires",
          "Citation links from every drafted claim to its source datapoint",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "A drafted disclosure is a draft — a human owns the claim, the boundary, and the assurance, and every figure must cite traceable source data",
          "Greenwashing and misstatement are legal exposures; the copilot must flag unsupported or overstated claims, not smooth them over",
        ],
        metricsMoved: [
          "report_assurance_level",
          "disclosure_restatement_rate",
          "esg_rating",
        ],
      },
      {
        key: "supplier_engagement_traceability",
        name: "Supplier ESG engagement & value-chain traceability",
        valueMechanism:
          "Automate supplier ESG-data intake, scoring, and outreach (questionnaires, " +
          "CDP/EcoVadis integration), prioritize the spend- and emissions-material " +
          "suppliers, and trace product/material flows for Scope-3 and due-" +
          "diligence reporting — raising supplier-data coverage so Scope 3 moves " +
          "from estimate to measured and supplier-level abatement and compliance " +
          "(e.g. CSRD value-chain, deforestation, forced-labor) can be targeted.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Supplier master joined to spend and emissions materiality",
          "Supplier ESG-data feeds (questionnaires, EcoVadis, CDP Supply Chain) with confidence tags",
          "Product/material flow and bill-of-material data for traceability",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Supplier-reported data is self-declared — confidence must be flagged and material claims spot-verified, not taken at face value",
          "Coverage gains concentrate on large suppliers first; the long tail stays proxy-estimated and must be labelled as such",
        ],
        metricsMoved: [
          "supplier_esg_data_coverage",
          "scope3_primary_data_pct",
          "scope3_emissions",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "carbon_accounting_platform",
        name: "Enterprise carbon-accounting & ESG-data platform",
        description:
          "A single carbon-accounting and ESG-data backbone that ingests " +
          "energy, fuel, procurement-spend, supplier, and resource data, applies " +
          "GHG-Protocol-conformant methods and emission factors, and computes " +
          "Scope 1/2/3 and resource metrics with lineage — the system of record " +
          "the footprint, the roadmap, and the disclosure all bind to, replacing " +
          "spreadsheet carbon accounting.",
        boundary:
          "Owns emissions/resource calculation, factors, and data lineage; does " +
          "not own the abatement decisions or the capital plan (the business " +
          "does) and does not provide the external assurance opinion itself.",
        humanAccountabilityPoint:
          "Chief Sustainability Officer (with the Controller for data controls)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "disclosure_controls_framework",
        name: "ESG disclosure-controls & assurance-readiness framework",
        description:
          "A disclosure-controls framework that extends financial-reporting-" +
          "grade lineage, documented methods/assumptions, control testing, and " +
          "evidence assembly to ESG metrics and maps them to CSRD/ESRS, ISSB, " +
          "and SEC requirements — making disclosed sustainability data " +
          "traceable, auditable, and ready for limited and then reasonable " +
          "external assurance.",
        boundary:
          "Owns ESG data lineage, controls, and assurance-evidence assembly and " +
          "the standard-to-datapoint mapping; does not own the sustainability " +
          "strategy or the estimation methods (it documents and controls them) " +
          "nor issue the assurance opinion. Handed to the enterprise GRC/audit " +
          "layer for the broader assurance program.",
        humanAccountabilityPoint:
          "Controller / Chief Sustainability Officer (with the external assurance provider)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "decarbonization_roadmap_engine",
        name: "Decarbonization roadmap & abatement-curve engine",
        description:
          "A roadmap engine that maintains a marginal-abatement-cost curve, " +
          "sequences funded abatement actions against the target trajectory, " +
          "tracks the pledge-to-funded-plan gap, and separates cost-saving from " +
          "cost-incurring levers — turning a net-zero pledge into a costed, " +
          "funded, trackable plan tied to the capital plan.",
        boundary:
          "Owns the abatement modeling, sequencing, and gap tracking; does not " +
          "own the target commitment (the board does) or the capital-allocation " +
          "decision (finance does) — it informs both with honest cost/abatement " +
          "economics.",
        humanAccountabilityPoint:
          "Chief Sustainability Officer (with the CFO for funding decisions)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "supplier_esg_engagement_layer",
        name: "Supplier ESG engagement & Scope-3 traceability layer",
        description:
          "A supplier-engagement and value-chain-traceability layer that " +
          "collects, scores, and integrates supplier ESG/emissions data, " +
          "prioritizes material suppliers, and traces material/product flows — " +
          "the platform that moves Scope 3 from spend-estimate toward supplier-" +
          "measured and supports value-chain due-diligence reporting.",
        boundary:
          "Owns supplier ESG-data collection, scoring, and traceability; does " +
          "not own the sourcing/commercial relationship (procurement does) or " +
          "the supplier-performance and reliability program (the supply-chain " +
          "expert owns throughput) — it consumes the supplier base as the Scope-3 " +
          "measurement surface.",
        humanAccountabilityPoint:
          "Head of Sustainable Procurement / CSO (with the CPO)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "energy_resource_optimization_platform",
        name: "Energy & resource efficiency optimization platform",
        description:
          "An efficiency platform that meters and optimizes building, process, " +
          "and fleet energy and water/waste streams with analytics and control " +
          "— the pattern that delivers the genuinely cost-positive slice of " +
          "decarbonization (efficiency cuts opex and Scope 1+2 together) and " +
          "anchors the honest business case.",
        boundary:
          "Owns energy/resource measurement and optimization; does not own the " +
          "facilities/process engineering decisions (operations does) or the " +
          "broader carbon accounting (the platform consumes its measured " +
          "consumption).",
        humanAccountabilityPoint:
          "Head of Facilities / Operations (with the CSO)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "ESG and sustainability value is realized on a mix of levers, and the " +
        "honest expert insists on naming which are cost wins and which are not. " +
        "The DOMINANT framing is risk and compliance: avoided regulatory and " +
        "transition risk (mandatory CSRD/ISSB/SEC disclosure, carbon pricing, " +
        "border adjustments), preserved license to operate, lower cost of " +
        "capital and green-financing access, index inclusion, and talent/brand — " +
        "most of which is avoided-loss and option value, not booked margin, and " +
        "must be sized as risk-adjusted and labelled as such. The GENUINE cost " +
        "wins are narrow but real: energy and resource efficiency cut opex AND " +
        "emissions together, and are the defensible hard-dollar slice; a green " +
        "premium or transition-finance advantage exists in some markets but is " +
        "market-dependent and must not be assumed. The largest decarbonization " +
        "actions (electrification, low-carbon inputs, supplier abatement, " +
        "Scope-3 reduction) are mostly NET COST incurred for compliance and risk " +
        "reasons — the expert says so rather than selling decarbonization as " +
        "free money. Three honesty constraints shape every estimate: Scope 3 is " +
        "70%+ of the footprint but built on supplier-data quality that is the " +
        "binding constraint (so value resting on Scope-3 reduction is gated on " +
        "primary-data coverage); net-zero pledges outrun costed roadmaps (so the " +
        "real plan is the funded abatement curve, not the target year); and " +
        "disclosure is becoming mandatory and ASSURED (so financial-grade data " +
        "lineage and auditability are the maturity step, and ratings are a noisy, " +
        "gameable IR signal, not value). Hard-dollar claims sit on efficiency; " +
        "the rest is sized as risk-adjusted compliance and option value.",
      dominantHaircutFactors: [
        {
          factor: "Scope-3 / supplier-data quality (the binding constraint)",
          rationale:
            "Most of the footprint and most of the decarbonization opportunity " +
            "are Scope 3, which is built on spend/average proxies until " +
            "suppliers measure and report. Value resting on Scope-3 reduction or " +
            "an assurable Scope-3 number is capped by primary-data coverage — " +
            "the single largest and most common haircut.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "Gap between modeled Scope-3 reduction / assurance potential and " +
              "what is realizable given low supplier primary-data coverage and " +
              "spend-based estimation",
            label: "planning-range",
          },
        },
        {
          factor: "Risk/compliance value is probabilistic and option-like, not booked",
          rationale:
            "The dominant benefit — avoided regulatory cost, carbon pricing, " +
            "license to operate, cost-of-capital and access advantages — is " +
            "risk-adjusted and counterfactual, realized over uncertain policy " +
            "and market paths, so finance discounts it heavily and it must be " +
            "framed as risk reduction and option value, never guaranteed saving.",
          typicalHaircut: {
            low: 0.25,
            high: 0.65,
            basis:
              "Distance between modeled avoided-risk / option value and what " +
              "finance credits as hard benefit for probabilistic, policy- and " +
              "market-dependent climate value",
            label: "planning-range",
          },
        },
        {
          factor: "Pledge-to-funded-roadmap and abatement-cost gap",
          rationale:
            "A committed target does not equal a funded plan; abatement-action " +
            "costs and potentials are estimates and the largest reductions are " +
            "net cost. Value sized on the pledge over-states realizable " +
            "reduction unless the funded, costed roadmap actually closes the gap.",
          typicalHaircut: {
            low: 0.15,
            high: 0.5,
            basis:
              "Gap between the pledged target trajectory and the abatement the " +
              "funded, costed roadmap actually delivers, especially on Scope 3",
            label: "planning-range",
          },
        },
        {
          factor: "Disclosure-data lineage, controls & assurance immaturity",
          rationale:
            "ESG value tied to disclosure (financing access, ratings, " +
            "compliance) depends on data that is scattered, estimated, and " +
            "lightly assured; under a rising mandatory-assurance bar, " +
            "restatement and misstatement risk discount any value resting on the " +
            "reported numbers until lineage and controls mature.",
          typicalHaircut: {
            low: 0.2,
            high: 0.55,
            basis:
              "Uncertainty premium on disclosure-linked value given immature " +
              "ESG data lineage, controls, and assurance relative to financial-" +
              "reporting data",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Energy / resource efficiency cost reduction (hard-dollar)",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Reported energy/resource cost reduction from AI-driven " +
              "efficiency optimization that simultaneously lowers Scope 1+2 — the " +
              "defensible hard-dollar slice, sized on measured consumption",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in energy/resource cost and energy_intensity, " +
            "with the Scope 1+2 emissions reduction it also delivers (bookable " +
            "efficiency saving)",
        },
        {
          lever: "Reporting / assurance-preparation effort reduction",
          range: {
            low: 0.25,
            high: 0.6,
            basis:
              "Reduction in manual effort and elapsed time to compile " +
              "disclosures, map standards, and assemble assurance evidence when " +
              "data is governed and lineage-traced vs spreadsheet-assembled",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in disclosure/assurance-prep effort, lifting " +
            "report_assurance_level readiness and cutting disclosure_restatement_" +
            "rate (efficiency, partially bookable)",
        },
        {
          lever: "Avoided regulatory / transition-risk and financing value",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Risk-adjusted value of avoided compliance cost, carbon-pricing " +
              "exposure, and improved green-financing / cost-of-capital access " +
              "where the roadmap is credible and disclosure assurable — " +
              "probabilistic, not booked",
            label: "planning-range",
          },
          measuredAs:
            "Risk-adjusted avoided-cost and option value tied to " +
            "decarb_target_gap closure and report_assurance_level (expected " +
            "value, explicitly not a booked saving)",
        },
      ],
      timeToValueBand:
        "Carbon-accounting platform standing up Scope 1/2 and a first spend-" +
        "based Scope 3: 1-2 quarters. Energy/resource efficiency cost wins: " +
        "1-3 quarters once metering is in place. Disclosure-controls and " +
        "assurance-readiness for a CSRD/ISSB cycle: 2-4 quarters and re-run " +
        "annually. Raising Scope-3 primary-data coverage and a funded " +
        "decarbonization roadmap that closes the target gap: 12-36+ months, " +
        "and the emissions reduction itself compounds slowly because it is " +
        "gated on supplier data and capital deployment, not software.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Carbon-accounting / ESG-data platform",
          role:
            "System of record for Scope 1/2/3 and resource emissions — ingests " +
            "energy, spend, supplier, and resource data, applies GHG-Protocol " +
            "methods and emission factors, and holds the footprint and its " +
            "lineage.",
          examples: [
            "Watershed",
            "Persefoni",
            "Sphera",
            "Microsoft Sustainability Manager",
          ],
        },
        {
          name: "ESG / sustainability reporting & disclosure platform",
          role:
            "Holds the disclosure report, maps data to CSRD/ESRS, ISSB, and " +
            "SEC datapoints, manages the disclosure-controls and assurance-" +
            "evidence trail, and produces the filed sustainability statement.",
          examples: [
            "Workiva",
            "Novata",
            "IBM Envizi",
            "Diligent ESG",
          ],
        },
        {
          name: "Supplier ESG / value-chain-data platform",
          role:
            "Collects, scores, and integrates supplier ESG and emissions data " +
            "and traces value-chain flows — the source for Scope-3 primary data " +
            "and supplier-coverage and due-diligence reporting.",
          examples: [
            "EcoVadis",
            "CDP Supply Chain",
            "Sphera Supply Chain",
            "Sustainalytics (supplier)",
          ],
        },
        {
          name: "ERP / procurement & finance",
          role:
            "Source of procurement spend (the Scope-3 estimation base), capex " +
            "for taxonomy alignment, revenue/output for intensity, and the GL " +
            "that disclosure controls reconcile financial-grade ESG data to.",
          examples: [
            "SAP S/4HANA",
            "Oracle Fusion",
            "Coupa (procurement spend)",
            "Microsoft Dynamics 365",
          ],
        },
        {
          name: "Energy / EHS & facilities management",
          role:
            "Metered energy, fuel, water, and waste data from building/process " +
            "management and EHS systems — the measured source for Scope 1+2 and " +
            "resource intensity and the efficiency-optimization substrate.",
          examples: [
            "Schneider EcoStruxure",
            "building-management systems (BMS)",
            "EHS platforms (Cority, Enablon)",
            "utility/meter data systems",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Sustainability Officer (CSO)",
          accountability:
            "Owns the sustainability and climate strategy, the carbon footprint " +
            "and decarbonization roadmap, ESG disclosure, the materiality " +
            "assessment, and ESG data quality and assurance-readiness.",
        },
        {
          title: "Chief Financial Officer (CFO) / Controller",
          accountability:
            "Owns the financial-grade controls and assurance over disclosed ESG " +
            "data (as it enters regulated filings), green/transition finance, and " +
            "the capital allocation that funds the decarbonization roadmap.",
        },
        {
          title: "Head of Sustainable Procurement / CPO",
          accountability:
            "Owns supplier ESG-data collection, supplier engagement and " +
            "abatement, and value-chain due diligence — the Scope-3 primary-data " +
            "and supplier-reduction surface.",
        },
        {
          title: "Head of Energy / Facilities & Operations",
          accountability:
            "Owns energy, water, and waste efficiency, Scope 1+2 operational " +
            "reduction levers, and the metered-consumption data behind the " +
            "footprint and the efficiency business case.",
        },
        {
          title: "Investor Relations / ESG ratings lead",
          accountability:
            "Owns the relationship with ESG rating providers and investors, " +
            "questionnaire responses, and how the disclosed ESG story is " +
            "positioned for capital access and index inclusion.",
        },
        {
          title: "Board / audit & sustainability committee",
          accountability:
            "Provides oversight of climate strategy, net-zero commitments, ESG " +
            "disclosure, and the rising assurance bar — and holds management " +
            "accountable for a credible, funded roadmap rather than a pledge.",
        },
      ],
      regulatoryFrames: [
        {
          name: "GHG Protocol (Corporate & Scope 3 Standards)",
          relevance:
            "The accounting bedrock for emissions: defines Scope 1/2/3, the " +
            "fifteen Scope-3 categories, location- vs market-based Scope 2, and " +
            "the calculation methods every carbon footprint and disclosure rests " +
            "on.",
        },
        {
          name: "CSRD / ESRS (EU Corporate Sustainability Reporting Directive)",
          relevance:
            "The most demanding mandatory regime: double-materiality reporting " +
            "across environmental and social/governance topics, with mandatory " +
            "limited assurance (reasonable assurance arriving) — the driver of " +
            "the data-lineage and assurance-readiness agenda.",
        },
        {
          name: "ISSB / IFRS S1-S2 & SEC climate disclosure",
          relevance:
            "Global and US sustainability/climate disclosure standards (IFRS S1 " +
            "general, S2 climate; SEC climate rule) requiring financial-grade, " +
            "investor-focused climate and emissions disclosure — converging the " +
            "world toward assured, comparable reporting.",
        },
        {
          name: "EU Taxonomy & green/transition finance frames",
          relevance:
            "Defines what counts as environmentally 'green' (substantial " +
            "contribution, do-no-significant-harm, minimum safeguards) for " +
            "taxonomy-aligned capex/revenue and for green-bond and transition-" +
            "finance instruments — the link between the roadmap and capital.",
        },
      ],
      canonicalTerms: [
        {
          term: "Scope 1 / 2 / 3",
          definition:
            "GHG Protocol emissions boundaries: Scope 1 = direct (owned " +
            "combustion/fleet/fugitive); Scope 2 = purchased energy " +
            "(electricity/steam/heat); Scope 3 = all other value-chain emissions " +
            "across fifteen categories — usually the majority of the footprint.",
        },
        {
          term: "Primary vs secondary (spend-based) data",
          definition:
            "Primary data = supplier-specific measured/reported emissions; " +
            "secondary = spend- or industry-average emission factors applied to " +
            "activity or spend. Scope 3 quality is measured by how much is " +
            "primary, not by the headline number.",
        },
        {
          term: "Net-zero / SBTi target & abatement curve",
          definition:
            "A committed emissions-reduction trajectory (often SBTi-validated) " +
            "and the marginal-abatement-cost curve of funded actions that would " +
            "deliver it; the credible plan is the funded curve, not the pledge " +
            "year.",
        },
        {
          term: "Limited vs reasonable assurance",
          definition:
            "Two external-assurance levels: limited gives negative comfort " +
            "('nothing came to our attention'); reasonable is the higher, " +
            "positive-opinion bar financial statements carry — most ESG sits at " +
            "limited or none, with CSRD pushing the bar up.",
        },
        {
          term: "Double materiality",
          definition:
            "The CSRD/ESRS principle that a firm reports both how " +
            "sustainability matters affect it (financial materiality) and how it " +
            "affects people and environment (impact materiality) — broader than " +
            "the investor-focused single materiality of ISSB/SEC.",
        },
        {
          term: "EU Taxonomy alignment (DNSH / safeguards)",
          definition:
            "The test for 'green' activity: substantial contribution to an " +
            "environmental objective, do-no-significant-harm to the others, and " +
            "minimum social safeguards — applied to capex/revenue and green-" +
            "finance instruments.",
        },
        {
          term: "Greenwashing",
          definition:
            "Overstated, unsupported, or misleading sustainability claims — a " +
            "rising legal and reputational exposure that makes traceable, cited, " +
            "assurable data (not narrative) the disciplined standard.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Carbon footprint (Scope 1/2/3) and its data quality",
        authoritativeSource:
          "Carbon-accounting platform: metered energy/fuel for Scope 1+2 and " +
          "method-tagged (primary vs spend-based) calculations for Scope 3, with " +
          "emission-factor and boundary documentation per the GHG Protocol",
        whatGoodEvidenceLooksLike:
          "Scope 1, 2 (location AND market-based), and 3 by category, with the " +
          "primary-vs-spend-based data split shown, a stated boundary and base " +
          "year, and documented emission factors and assumptions — Scope 3 " +
          "presented with its uncertainty, not as a hard number.",
        weakEvidenceToReject:
          "A single total or a Scope-3 number with no category breakdown, no " +
          "primary-data share, no boundary/base-year, and undocumented factors " +
          "— a spend-based estimate presented as a measured fact.",
      },
      {
        claim: "Decarbonization roadmap vs target (pledge credibility)",
        authoritativeSource:
          "Decarbonization roadmap model: the marginal-abatement-cost curve and " +
          "funded initiative pipeline compared to the validated target " +
          "trajectory, tied to the capital plan",
        whatGoodEvidenceLooksLike:
          "A funded, costed abatement curve showing the trajectory it actually " +
          "delivers, the gap to the validated target, the cost-saving-vs-cost-" +
          "incurring split, and any reliance on offsets or future technology " +
          "made explicit.",
        weakEvidenceToReject:
          "A headline net-zero target year with no funded roadmap, no abatement " +
          "curve, no gap quantified, and reductions assumed rather than costed " +
          "and contracted — a pledge without a plan.",
      },
      {
        claim: "ESG disclosure data lineage and assurance level",
        authoritativeSource:
          "Reporting platform with source-to-disclosure lineage, documented " +
          "methods/assumptions, the disclosure-controls log, and the external " +
          "assurance engagement record mapped to materiality",
        whatGoodEvidenceLooksLike:
          "Each material disclosed metric traceable from source data through " +
          "method and assumptions to the filed number, with an explicit " +
          "assurance level (none/limited/reasonable) and a tracked restatement " +
          "history.",
        weakEvidenceToReject:
          "A disclosed figure presented as fact with no lineage, undocumented " +
          "assumptions, no assurance level stated, and no restatement tracking " +
          "— narrative comfort over auditable data.",
      },
      {
        claim: "Supplier ESG data coverage and Scope-3 traceability",
        authoritativeSource:
          "Supplier ESG-data platform (EcoVadis/CDP) joined to procurement " +
          "spend and the supplier master, with data-confidence and currency tags",
        whatGoodEvidenceLooksLike:
          "Coverage measured against the material-supplier and material-spend " +
          "population, with primary-data currency, confidence flags on self-" +
          "reported data, and the long tail explicitly shown as proxy-estimated.",
        weakEvidenceToReject:
          "A count of engaged suppliers with no denominator of material " +
          "suppliers/spend, no currency or confidence, or coverage claimed on a " +
          "subset that excludes the long tail.",
      },
      {
        claim: "Energy/resource efficiency and the cost-saving slice",
        authoritativeSource:
          "Metered energy/water/waste data from EHS/facilities joined to output/" +
          "revenue, with measured baseline-vs-actual consumption",
        whatGoodEvidenceLooksLike:
          "Energy/resource intensity and absolute consumption with measured " +
          "baseline-vs-actual savings, the opex AND Scope 1+2 reduction shown " +
          "together, and the saving sized on metered consumption not modeled " +
          "assumptions.",
        weakEvidenceToReject:
          "A claimed efficiency saving with no metered baseline, no " +
          "consumption measurement, or efficiency value asserted as a blanket " +
          "percentage without normalization.",
      },
      {
        claim: "ESG rating used as performance proof",
        authoritativeSource:
          "Third-party ESG rating provider methodologies and the firm's " +
          "disclosure submissions, read across multiple providers",
        whatGoodEvidenceLooksLike:
          "Ratings presented as one IR signal with the provider, methodology, " +
          "and cross-provider divergence acknowledged, reconciled against " +
          "measured emissions and primary-data trends rather than treated as " +
          "ground truth.",
        weakEvidenceToReject:
          "A single ESG rating cited as proof of environmental performance, " +
          "with no provider/method, no cross-provider check, and no link to " +
          "measured emissions or data quality.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your footprint by Scope 1, 2 (location and market-based), and 3 by category — and for Scope 3, what share is primary supplier data versus spend/average proxies?",
      "Behind your net-zero / SBTi target, what does the funded, costed abatement curve actually deliver by the target year, and how big is the gap you're relying on offsets or unspecified action to close?",
      "For the ESG metrics you disclose, can you trace each from source data through method and assumptions to the filed number — and would that trace survive a reasonable-assurance audit under CSRD/ISSB?",
      "Which of your decarbonization actions actually save money (energy/resource efficiency) versus are net cost for compliance/risk reasons — and is the business case framed honestly as that mix?",
      "What share of your material suppliers (by spend and by emissions) have provided current primary ESG/emissions data, and how is the long tail handled?",
      "How much of your sustainability effort targets noisy ESG rating-provider scores versus measured emissions reduction and assurable data — and do your ratings across providers even agree?",
      "Can you produce one reconciled, current, source-traceable set of disclosed ESG metrics on one boundary, or is each report stitched together by hand from disconnected carbon, supplier, and energy tools?",
    ],
    maturitySignals: [
      "Scope 1/2/3 is computed in a governed carbon-accounting platform with documented boundary, base year, factors, and an explicit primary-vs-spend-based Scope-3 data split — not a single asserted number.",
      "The net-zero target is backed by a funded, costed marginal-abatement-cost curve tied to the capital plan, with the pledge-to-plan gap and any offset reliance made explicit.",
      "ESG disclosure runs on financial-grade controls and lineage mapped to ESRS/ISSB/SEC datapoints, restatement is tracked, and the assurance level (limited→reasonable) is rising.",
      "Energy/resource efficiency is run as a measured, cost-positive program (opex and Scope 1+2 reduction sized on metered consumption), separated honestly from cost-incurring abatement.",
      "Supplier ESG-data coverage is measured against material spend/emissions and rising, moving Scope 3 from estimate toward supplier-measured, with confidence flagged on self-reported data.",
    ],
    redFlags: [
      "Scope 3 is reported as a single large number with little or no primary-data share, swinging with spend rather than abatement — a spend-estimate presented as a measured fact.",
      "A net-zero pledge with no funded, costed roadmap and a large unquantified gap closed by offsets or unspecified future action — a target without a plan.",
      "ESG metrics live in spreadsheets with undocumented assumptions and no lineage, yet feed regulated assured filings — restatement and misstatement risk under a rising assurance bar.",
      "Sustainability effort is organized around chasing noisy, divergent ESG rating scores and narrative claims while measured emissions and primary-data share stagnate (greenwashing exposure).",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Carbon-accounting platforms (Watershed, Persefoni, Sphera, Microsoft Sustainability Manager)",
        category: "Scope 1/2/3 carbon accounting and ESG-data management",
        switchingCost:
          "High — the platform holds the configured boundary, emission-factor library, calculation methods, and the historical footprint baseline; replacement means re-baselining and re-validating the whole footprint, not a swap.",
        renewalDynamics:
          "Subscription by emissions/spend volume and modules; Scope-3 enrichment, supplier-engagement, and disclosure-mapping capabilities increasingly upsold as premium tiers as CSRD scope bites.",
      },
      {
        vendorName: "ESG reporting & disclosure platforms (Workiva, Novata, IBM Envizi, Diligent ESG)",
        category: "Disclosure reporting, standard mapping (ESRS/ISSB/SEC), and assurance-evidence",
        switchingCost:
          "High — the disclosure templates, control mappings, datapoint configuration, and audit/assurance trail are embedded; switching mid-reporting-cycle risks the assurance trail and is rarely attempted.",
        renewalDynamics:
          "Subscription by entity/report scope and standards covered; breadth of standard coverage and assurance-readiness features drive price and stickiness as mandatory regimes expand.",
      },
      {
        vendorName: "Supplier ESG / value-chain-data platforms (EcoVadis, CDP Supply Chain, Sphera)",
        category: "Supplier ESG scoring, primary-data collection, and Scope-3 traceability",
        switchingCost:
          "Moderate — supplier scorecards and engagement history accrete and suppliers are onboarded to a specific platform, but the data is portable; switching cost rises with the depth of supplier coverage built.",
        renewalDynamics:
          "Subscription by supplier/assessment count; depth of supplier coverage and network effects (suppliers already on the platform) are the negotiation levers.",
      },
      {
        vendorName: "ESG rating providers (MSCI, Sustainalytics, CDP, S&P)",
        category: "Third-party ESG ratings and investor-facing scoring",
        switchingCost:
          "Low-to-moderate — the firm doesn't 'switch' so much as manage multiple providers; the cost is the recurring effort to respond to divergent questionnaires, and the inability to opt out of being rated.",
        renewalDynamics:
          "Data/access subscriptions and paid questionnaire/feedback services; ratings are managed for investor access and index inclusion rather than negotiated like software.",
      },
    ],
    switchingCosts:
      "The carbon-accounting and disclosure platforms are the deep lock-in: " +
      "the configured boundary, emission-factor libraries, calculation methods, " +
      "historical baseline, and the assurance/audit trail make replacement a " +
      "re-baselining program, not a swap — and switching mid-cycle threatens " +
      "the assurance trail regulators and auditors rely on. Supplier-data " +
      "platforms are stickier the deeper supplier coverage is built, but data " +
      "is more portable. ESG rating providers are not switchable (the firm is " +
      "rated whether it engages or not); the cost there is the recurring effort " +
      "to feed divergent questionnaires. The negotiable frontier is in modules " +
      "and Scope-3/disclosure premium tiers and in supplier-coverage scope.",
    negotiationLevers: [
      "Outcome/scope pricing tied to standards actually covered (ESRS/ISSB/SEC) and emissions/supplier scope, not a blanket enterprise license, as mandatory regimes phase in",
      "Data-portability, emission-factor, and historical-baseline export rights to prevent footprint-baseline and disclosure-trail lock-in",
      "Phase-gated pilot-to-scale on Scope-3 and supplier-engagement modules with primary-data-coverage proof before enterprise commitment",
      "Bundle carbon-accounting and disclosure-reporting against best-of-breed at renewal, leveraging the rising mandatory-assurance scope as commitment volume",
      "Re-price supplier-data platforms on realized material-supplier coverage (by spend and emissions) rather than promised supplier counts",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      footprint_claim: [
        "Scope 1, 2 (location and market-based), and 3 by category",
        "primary-vs-spend-based data split for Scope 3",
        "boundary, base year, and documented emission factors/assumptions",
      ],
      decarbonization_claim: [
        "the funded, costed abatement curve and the trajectory it delivers",
        "the gap to the validated target and any offset/future-tech reliance",
        "the cost-saving-vs-cost-incurring split of the actions",
      ],
      disclosure_assurance_claim: [
        "source-to-disclosure lineage and documented methods/assumptions",
        "the explicit assurance level (none/limited/reasonable) per metric",
        "restatement history and the standard (ESRS/ISSB/SEC) mapped",
      ],
      supplier_scope3_claim: [
        "supplier-data coverage against material spend/emissions",
        "primary-data currency and confidence flag on self-reported data",
        "the long tail shown as proxy-estimated, not assumed measured",
      ],
      efficiency_value_claim: [
        "metered baseline-vs-actual consumption",
        "the opex AND Scope 1+2 reduction shown together",
        "intensity normalization to output/revenue",
      ],
      value_projection: [
        "the cost/compliance/risk-vs-margin framing made explicit per lever",
        "benchmark planning-range with the Scope-3 / data-quality gate stated",
        "explicit haircut factors (Scope-3 data, risk-adjustment, pledge gap, assurance)",
      ],
    },
    citationStandard:
      "Quantitative ESG claims cite the system of record (carbon-accounting / " +
      "reporting / supplier platform), the boundary, base year, and period, and " +
      "the GHG-Protocol/disclosure standard applied. Footprint claims state the " +
      "Scope (1/2/3), give Scope 2 location- AND market-based, and ALWAYS show " +
      "the Scope-3 primary-vs-spend-based data split — a Scope-3 number is never " +
      "asserted as measured fact without its data quality. Decarbonization " +
      "claims cite the funded abatement curve and the gap to target, not the " +
      "pledge year. Disclosure claims state the assurance level and the lineage. " +
      "Value projections name which levers are hard-dollar (efficiency) versus " +
      "risk-adjusted cost/compliance, give a labelled planning range gated on " +
      "Scope-3 data quality, and name the haircut factors applied — never a " +
      "single asserted reduction or ROI number, and never an ESG rating as proof " +
      "of performance.",
  },

  hedgeRules: {
    whenToHedge: [
      "Scope-3 primary-data coverage is unknown or low — frame Scope-3 figures and any value resting on Scope-3 reduction as a planning range explicitly gated on supplier-data quality, and label spend-based estimates as estimates.",
      "A net-zero or SBTi target is cited without a funded, costed roadmap — flag the gap between the pledge trajectory and the abatement the funded plan actually delivers rather than treating the target as the plan.",
      "Decarbonization value is presented as margin or ROI — separate the genuinely cost-saving efficiency levers from the net-cost compliance/risk actions, and frame the latter as risk-adjusted avoided-cost, not booked saving.",
      "An ESG rating or a vendor/supplier-reported figure is cited — mark ratings as a noisy, provider-divergent IR signal and supplier data as self-reported pending validation, never as ground truth.",
    ],
    inferenceLanguage: [
      "Across enterprises at this scale, Scope 3 typically runs 70%+ of the footprint and is mostly spend-estimated, so without your primary-data split this number carries material uncertainty...",
      "Without your funded abatement curve, the industry pattern is a sizeable gap between the pledged target and what a costed roadmap delivers — treat the reduction as contingent on funding, not committed...",
      "Peer programs commonly realize hard-dollar value on energy/resource efficiency in the range of... while the larger abatement is net cost for compliance/risk reasons...",
      "Treating this as a risk-adjusted, planning-range estimate gated on Scope-3 data quality and disclosure assurance rather than your measured, assured figure...",
    ],
    flagWithoutEvidence: [
      "This tenant's actual Scope 1/2/3 emissions, carbon intensity, or primary-data share",
      "A specific decarbonization reduction or value number, or that the net-zero target is achievable on the funded plan",
      "A Scope-3 figure presented as measured when its primary-vs-spend-based split is unknown",
      "That disclosed ESG metrics are assurance-ready, or that an ESG rating reflects real environmental performance, without lineage and cross-provider checks",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "carbon footprint breakdown / where do emissions and Scope-3 data quality sit",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      note: "Stacked bar of Scope 1/2/3 by category with the primary-vs-spend-based data split overlaid, so the footprint's magnitude AND its data quality are visible — not a single total.",
    },
    {
      questionPattern:
        "decarbonization roadmap / gap between the net-zero pledge and the funded abatement plan",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Waterfall from base-year emissions down each funded abatement action to the projected endpoint, against the target trajectory, exposing the unfunded gap and any offset reliance honestly.",
    },
    {
      questionPattern:
        "abatement-cost curve / which decarbonization actions save money versus cost money",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Marginal-abatement-cost stack ordering actions from cost-saving (efficiency) to cost-incurring (compliance/risk), so the honest cost-vs-value mix is explicit rather than sold as free margin.",
    },
    {
      questionPattern:
        "ESG value sensitivity to Scope-3 data quality, pledge gap, and assurance",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of value sensitivity to the dominant haircut factors (Scope-3/supplier-data quality, risk-adjustment, pledge-to-roadmap gap, disclosure assurance immaturity).",
    },
    {
      questionPattern:
        "supplier ESG / Scope-3 coverage and where primary data is missing",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap of supplier ESG-data coverage and Scope-3 contribution by category/supplier-tier to expose where the largest emissions sit on the weakest data — the bottleneck to attack.",
    },
    {
      questionPattern: "ESG / sustainability KPI scorecard",
      exhibitKind: "table",
      note: "Scope 1+2 and Scope 3 (tCO2e), carbon and energy intensity, % Scope-3 primary data, decarb-vs-target gap, renewable %, assurance level, restatement rate, supplier coverage, waste/water intensity, ESG rating, % green capex versus planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The carbon-accounting and disclosure data are governed with financial-grade lineage and controls, so the footprint and the report are traceable and assurance-ready rather than spreadsheet-assembled",
      "Decarbonization is run from a funded, costed abatement curve that closes the gap to target, with cost-saving efficiency levers separated honestly from net-cost compliance/risk actions",
      "Supplier ESG-data coverage is treated as the binding Scope-3 constraint and built deliberately, moving the largest part of the footprint from estimate toward measured",
      "The value story is framed honestly as a mix of hard-dollar efficiency and risk-adjusted compliance/risk avoidance — surviving CFO scrutiny — rather than sold as free margin",
    ],
    failureDrivers: [
      "Reporting and ratings narrative are prioritized over data lineage and assurance, so disclosures fail under the rising mandatory-assurance bar and restate",
      "A net-zero pledge is made with no funded roadmap, leaving a large gap papered over with offsets or unspecified future action that erodes credibility",
      "Scope 3 stays almost entirely spend-estimated because supplier engagement lags, so the largest part of the footprint can't be assured or reduced at the supplier level",
      "Decarbonization is framed as either pure overhead (and starved) or free margin (and oversold), and neither framing survives finance review or delivers",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Carbon accounting and energy/resource efficiency adopt first because the " +
      "footprint must be measured and efficiency delivers tangible cost wins. " +
      "Disclosure-controls and assurance-readiness follow, pulled forward fast " +
      "by mandatory CSRD/ISSB/SEC timelines. Supplier ESG engagement and " +
      "AI Scope-3 estimation are emerging and adopt next as the Scope-3 " +
      "bottleneck bites. A funded decarbonization roadmap that actually closes " +
      "the target gap adopts last and slowest because it is gated on capital " +
      "deployment and supplier abatement, not software — which is exactly where " +
      "pledges outrun plans.",
    roiClarity: "low",
    roiClarityBasis:
      "ROI clarity is honestly LOW for the program as a whole. The defensible, " +
      "measurable slice is energy/resource efficiency (metered opex and Scope " +
      "1+2 reduction) and reporting-effort reduction — but these are a minority " +
      "of the spend. The dominant value is risk-adjusted and counterfactual: " +
      "avoided regulatory cost, carbon pricing, license to operate, and cost-of-" +
      "capital/financing access, all dependent on uncertain policy and market " +
      "paths and hard to attribute. The largest decarbonization actions are net " +
      "cost incurred for compliance and risk, not margin. That is why the value " +
      "model leans on the efficiency hard-dollar levers, frames the rest as " +
      "risk-adjusted compliance/option value, and the evidence/hedge rules force " +
      "a Scope-3 data-quality gate, a pledge-to-funded-roadmap check, and a " +
      "cost-vs-value-lever split rather than a single asserted ROI.",
  },

  regulatoryFrame: {
    name: "Mandatory, assured climate & sustainability disclosure (CSRD/ESRS, ISSB/IFRS S1-S2, SEC climate) on the GHG Protocol",
    relevance:
      "The dominant regulatory frame for ESG & sustainability: emissions are " +
      "accounted on the GHG Protocol (Scope 1/2/3) and increasingly disclosed " +
      "under mandatory, externally-assured regimes — CSRD/ESRS (double " +
      "materiality, limited assurance moving to reasonable), ISSB/IFRS S1-S2, " +
      "and the SEC climate rule — with the EU Taxonomy defining 'green' for " +
      "capex/revenue and green/transition finance. This converts ESG from " +
      "voluntary narrative into controlled, assured, filed data, which is why " +
      "data lineage and auditability beat narrative (see vocabulary." +
      "regulatoryFrames for the GHG Protocol and EU Taxonomy specifics).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
