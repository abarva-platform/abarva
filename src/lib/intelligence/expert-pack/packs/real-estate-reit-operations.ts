// Consilium expert — Real Estate & REIT: Asset, Portfolio & Operations
// (industry × function).
//
// W3 backlog-wave (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). An
// INDUSTRY × FUNCTION ExpertPack v2 for the OWNER / INVESTOR / LANDLORD side of
// commercial real estate — REITs, real-estate private-equity funds, developers,
// and operating owners of office, industrial/logistics, residential/multifamily,
// retail, and specialty property. It owns the investment-and-operating questions
// that decide a property company's returns: asset & portfolio management,
// acquisitions/dispositions & underwriting, development, leasing & tenant
// management, property operations (NOI optimization), capital markets/financing,
// fund/investor reporting, and valuation.
//
// CORE DOCTRINE — VALUE IS NOI GROWTH × CAP-RATE, AND THE RATE REGIME SWAMPS THE
// OPERATING STORY. (1) A property's value is, to first order, NOI ÷ cap rate, so
// the two value drivers are net-operating-income growth and the cap rate the
// market applies — and the HONEST, uncomfortable truth is that cap-rate moves
// (driven by interest rates and risk appetite, largely EXOGENOUS) routinely
// dwarf operating improvements: a 50 bp cap-rate shift can move value more than a
// year of hard-won NOI growth, so returns are rate-regime-dependent and partly
// outside the operator's control. (2) CASH FLOW IS DRIVEN BY LEASING VELOCITY,
// TENANT CREDIT, AND RETENTION: an asset is only worth its leased, collectible,
// durable income — time-to-lease, tenant credit quality, retention, and the rent
// roll's weighted-average lease term decide the cash flow far more than headline
// "asking rent". (3) DEVELOPMENT IS A LONG-DATED CAPITAL AND ENTITLEMENT-RISK
// GAME: ground-up and major redevelopment is a multi-year bet on yield-on-cost
// beating the exit cap rate, gated on entitlement, construction cost, and lease-
// up risk — and the spread can vanish if rates move against you mid-build. (4)
// THE SECTORS HAVE DIVERGED: office is structurally challenged post-hybrid (the
// occupier demand the workplace expert governs has fallen), while industrial/
// logistics and residential have their own, different supply-demand dynamics —
// "real estate" is not one asset class and must be reasoned per property type.
// (5) DATA IS FRAGMENTED across property-management, lease, and investment-
// accounting systems with inconsistent property/unit identifiers, so a single
// reconciled view of NOI, the rent roll, valuation, and debt is itself hard work.
//
// DISTINCT FROM the cross-cutting Corporate Real Estate & Workplace expert
// (xp.x.real-estate-workplace), which owns the corporate OCCUPIER / TENANT side —
// workplace strategy, space utilization, and lease-AS-COST for a company that
// consumes space. THIS expert is the OWNER / INVESTOR / LANDLORD side: it owns
// the property as an income-and-value ASSET, NOI optimization, cap rates,
// underwriting, leasing as REVENUE, development, and fund/investor returns. The
// occupier expert's tenant is THIS expert's customer (the lessee on the rent
// roll). Do not duplicate the occupier angle — stay on the investment/operating-
// owner side, and hand corporate-occupier workplace questions to that expert.
// Returns are honest about themselves: largely rate-regime-driven and exogenous,
// so the operating levers this expert owns are necessary but not sufficient.

import type { ExpertPack, ExpertPackIdentity } from "@/lib/intelligence/expert-pack/expert-pack";

export const realEstateReitOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.real-estate.asset-portfolio-operations",
    expertName: "Real Estate & REIT — Asset, Portfolio & Operations Expert",
    kind: "industry-function",
    industry: "real_estate",
    functionKey: "asset-portfolio-operations",
    scopeNote:
      "Industry × function expert for the OWNER / INVESTOR / LANDLORD side of " +
      "commercial real estate — REITs, real-estate funds, developers, and " +
      "operating owners of office, industrial/logistics, residential/multifamily, " +
      "retail, and specialty property. Owns asset & portfolio management, " +
      "acquisitions/dispositions & underwriting, development, leasing & tenant " +
      "management, property operations (NOI optimization), capital markets/" +
      "financing, fund/investor reporting, and valuation. DOCTRINE: value is NOI " +
      "÷ cap rate, so NOI growth and the (largely exogenous, rate-driven) cap " +
      "rate are the two value drivers — and cap-rate/interest-rate moves routinely " +
      "swamp operating improvements (a 50 bp cap-rate shift dwarfs most NOI gains), " +
      "so returns are rate-regime-dependent; leasing velocity, tenant credit, and " +
      "retention drive cash flow; development is a long-dated capital + entitlement-" +
      "risk game; office is structurally challenged post-hybrid while industrial " +
      "and residential diverge; and data is fragmented across property-management, " +
      "lease, and investment systems. DISTINCT from the cross-cutting Corporate " +
      "Real Estate & Workplace expert, which owns the corporate OCCUPIER / TENANT " +
      "side (workplace, facilities, lease-as-cost): that expert's tenant is this " +
      "expert's customer on the rent roll. This expert stays on the investment/" +
      "operating-owner side and hands corporate-occupier workplace questions up.",
  } satisfies ExpertPackIdentity,

  domain: {
    operatingMetrics: [
      {
        key: "noi_growth",
        name: "Net operating income (NOI) growth",
        definition:
          "Year-over-year change in net operating income — property rental and " +
          "other income less direct operating expenses, before debt service, " +
          "capital expenditure, depreciation, and corporate overhead — at the " +
          "asset or portfolio level.",
        unit: "% YoY",
        directionOfGood: "higher",
        benchmarkRange: {
          low: -3,
          high: 8,
          basis:
            "Sector- and cycle-dependent: industrial/residential in strong " +
            "markets post mid-single-digit NOI growth, stabilized assets run " +
            "low-single-digit, and structurally-challenged office can be flat to " +
            "negative; read against the property type and market, not a single " +
            "cross-sector number",
          label: "planning-range",
        },
        dataSource:
          "Property-management / accounting system NOI by asset, reconciled to " +
          "the investment-accounting general ledger and the rent roll",
        whyItMatters:
          "One of the two value drivers (value ≈ NOI ÷ cap rate) and the lever " +
          "the operator actually controls. But NOI growth is read honestly " +
          "against the cap-rate regime: a year of hard-won NOI growth can be " +
          "erased by a modest cap-rate widening, so it is necessary but not " +
          "sufficient for value creation.",
      },
      {
        key: "occupancy_leased_rate",
        name: "Occupancy / leased rate",
        definition:
          "Share of net rentable area (or units) that is leased — distinguishing " +
          "physical occupancy (in place and paying) from economic/leased " +
          "occupancy (signed, including not-yet-commenced leases).",
        unit: "% of rentable area leased",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 97,
          basis:
            "Stabilized institutional assets typically run 90-95%+ leased; " +
            "industrial/residential in tight markets push higher, while " +
            "challenged office sub-markets sit well below — read against property " +
            "type, sub-market, and the lease-up vs stabilized stage",
          label: "planning-range",
        },
        dataSource:
          "Rent roll and lease administration in the property-management system, " +
          "reconciled to leasing pipeline for signed-not-commenced space",
        whyItMatters:
          "The headline cash-flow capacity of the asset — vacant space earns " +
          "nothing while still carrying cost. But occupancy is read with tenant " +
          "credit and lease term: high occupancy on weak-credit, short-WALT " +
          "tenants is fragile income, not durable value.",
      },
      {
        key: "leasing_velocity_time_to_lease",
        name: "Leasing velocity (time-to-lease)",
        definition:
          "Average time vacant space takes to lease — from availability (or move-" +
          "out) to a signed lease — and the rate at which the leasing pipeline " +
          "converts tours to signed leases.",
        unit: "months to lease (downtime)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 18,
          basis:
            "Highly market- and sector-dependent: residential and tight " +
            "industrial lease in weeks-to-a-few-months, while large office or " +
            "specialty space in soft markets can take a year or more; the " +
            "meaningful read is the trend against the sub-market absorption rate",
          label: "planning-range",
        },
        dataSource:
          "Leasing CRM / pipeline and the rent roll: availability date, lease " +
          "signature date, and tour-to-lease conversion",
        whyItMatters:
          "Downtime is foregone NOI and a direct drag on value — every month of " +
          "vacancy is rent never collected. Velocity exposes whether asking rents, " +
          "concessions, and the leasing team are calibrated to real market " +
          "absorption rather than to a stale pro forma.",
      },
      {
        key: "tenant_retention_rate",
        name: "Tenant retention rate",
        definition:
          "Share of expiring leases (by area or count) renewed or retained in " +
          "place rather than vacating — the renewal-success measure that governs " +
          "rollover risk and re-leasing cost.",
        unit: "% of expiring leases retained",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 80,
          basis:
            "Retention varies by sector and asset quality; well-run assets retain " +
            "60-75%+ of expiring area, and low retention signals re-leasing cost, " +
            "downtime, and concession drag ahead — read against the rollover " +
            "schedule, not in isolation",
          label: "planning-range",
        },
        dataSource:
          "Lease-expiry schedule and renewal outcomes in the lease-administration " +
          "system, with re-leasing cost (TI/LC) per renewal vs new lease",
        whyItMatters:
          "Retention is far cheaper than re-leasing: keeping a tenant avoids " +
          "downtime, tenant-improvement and leasing-commission (TI/LC) cost, and " +
          "concession resets. Low retention quietly erodes NOI through the cost " +
          "and vacancy of churning the rent roll.",
      },
      {
        key: "rent_collection_rate",
        name: "Rent collection rate",
        definition:
          "Share of billed rent and recoverable charges actually collected in the " +
          "period, net of write-offs — the realized-income measure that turns a " +
          "rent roll into cash.",
        unit: "% of billed rent collected",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 99.5,
          basis:
            "Institutional assets with strong-credit tenants collect 98%+; " +
            "stressed sectors, weak-credit tenants, or downturns push collections " +
            "and the delinquency/bad-debt reserve materially lower",
          label: "planning-range",
        },
        dataSource:
          "Accounts-receivable / billing in the property-management system: billed " +
          "vs collected, aged delinquency, and bad-debt reserve",
        whyItMatters:
          "Income is only real when collected — a strong rent roll with rising " +
          "delinquency is overstated NOI. Collection and aged-delinquency trend is " +
          "the early-warning signal of tenant distress before it shows up as " +
          "vacancy.",
      },
      {
        key: "same_store_noi_margin",
        name: "Same-store NOI margin",
        definition:
          "NOI as a percentage of total property revenue for the same-store pool " +
          "(assets owned and stabilized across both comparison periods) — the " +
          "operating-efficiency and organic-growth measure stripped of " +
          "acquisitions and dispositions.",
        unit: "% (NOI / revenue, same-store)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 55,
          high: 75,
          basis:
            "Sector-dependent: net-lease and industrial run high margins (low " +
            "operating intensity), while operationally-intensive sectors (hotels, " +
            "some retail, multifamily with heavy services) run lower; the read is " +
            "the same-store trend, not a cross-sector absolute",
          label: "planning-range",
        },
        dataSource:
          "Property-accounting same-store pool: NOI and revenue by asset, with the " +
          "same-store definition (owned + stabilized) held constant",
        whyItMatters:
          "Same-store isolates ORGANIC operating performance from the noise of " +
          "buying and selling assets — it is how investors judge whether the " +
          "operator is actually growing income on the existing portfolio versus " +
          "manufacturing growth through acquisitions.",
      },
      {
        key: "capex_pct_of_noi",
        name: "Capital expenditure as % of NOI",
        definition:
          "Recurring and value-add capital expenditure (building capex, tenant " +
          "improvements, and leasing commissions) as a share of NOI — the measure " +
          "of how much income is reinvested to sustain and grow the asset.",
        unit: "% of NOI",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "Recurring capex + TI/LC commonly consumes 10-25% of NOI for " +
            "stabilized assets and far more in heavy re-leasing or value-add " +
            "phases; 'too low' can signal deferred capital that erodes the asset, " +
            "so the good zone is a calibrated range, not a minimum",
          label: "planning-range",
        },
        dataSource:
          "Capital-tracking in the property-accounting and investment systems: " +
          "recurring capex, TI, and LC by asset against NOI",
        whyItMatters:
          "The honest bridge from NOI to actual cash available to investors — a " +
          "high NOI consumed by TI/LC and building capex is not the free cash flow " +
          "it appears. Under-spending flatters near-term cash but defers capital " +
          "that re-emerges as obsolescence and lost rent.",
      },
      {
        key: "development_yield_on_cost_spread",
        name: "Development yield-on-cost vs market cap rate (development spread)",
        definition:
          "Stabilized NOI of a development or major redevelopment divided by total " +
          "project cost (yield-on-cost / development yield), compared with the " +
          "market exit cap rate for the finished asset — the spread that is the " +
          "development profit margin.",
        unit: "bps spread (yield-on-cost minus exit cap rate)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 75,
          high: 250,
          basis:
            "Developers typically target a 100-200+ bp spread of yield-on-cost " +
            "over the exit cap rate to compensate for entitlement, construction, " +
            "and lease-up risk; a thin or negative spread means the development " +
            "premium has evaporated — and a mid-build cap-rate move can erase it",
          label: "planning-range",
        },
        dataSource:
          "Development pro forma (stabilized NOI ÷ total project cost) versus " +
          "market exit cap-rate evidence (broker/appraisal comps) for the asset " +
          "type and market",
        whyItMatters:
          "The single number that says whether a development bet is worth its " +
          "long-dated capital and entitlement risk. The spread is the margin for " +
          "everything that can go wrong over a multi-year build — and because it " +
          "is measured against an exogenous exit cap rate, a rate move mid-build " +
          "can turn a sound project into a loss.",
      },
      {
        key: "ffo_per_share",
        name: "Funds from operations (FFO) per share",
        definition:
          "FFO — net income excluding gains/losses on property sales and adding " +
          "back real-estate depreciation and amortization (per NAREIT) — divided " +
          "by diluted shares; the REIT-standard earnings measure of recurring " +
          "operating cash generation per share.",
        unit: "currency per share",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 12,
          basis:
            "An absolute per-share figure that is meaningless cross-company; the " +
            "meaningful read is the YoY growth rate and the payout ratio (dividend " +
            "÷ FFO/AFFO), benchmarked to the peer REIT set in the same sector",
          label: "planning-range",
        },
        dataSource:
          "Investment-accounting / financial-reporting system computing FFO and " +
          "AFFO per the NAREIT definition against the share count",
        whyItMatters:
          "The headline earnings measure REIT investors and analysts track — " +
          "depreciation makes GAAP net income misleading for real estate, so FFO " +
          "(and AFFO, which deducts recurring capex and TI/LC) is the recurring-" +
          "cash yardstick that supports the dividend and the equity valuation.",
      },
      {
        key: "weighted_avg_lease_term",
        name: "Weighted-average lease term (WALT / WAULT)",
        definition:
          "The average unexpired lease term across the rent roll, weighted by rent " +
          "(or area) — the durability measure of the income stream and the inverse " +
          "of near-term rollover/re-leasing exposure.",
        unit: "years",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 3,
          high: 12,
          basis:
            "Sector-dependent: net-lease and long-lease industrial can carry " +
            "10-15+ year WALT, traditional office 4-7, and short-cycle " +
            "residential under a year — read against the sector and the lease-" +
            "expiry profile, not as a single target",
          label: "planning-range",
        },
        dataSource:
          "Lease-administration rent roll: unexpired term by lease, weighted by " +
          "contracted rent, with the lease-expiry (rollover) schedule",
        whyItMatters:
          "Longer, well-laddered lease term means more durable, predictable income " +
          "and lower near-term rollover risk — which the market rewards with a " +
          "tighter cap rate. A short or lumpy WALT concentrates re-leasing cost and " +
          "vacancy risk into a few years and is a valuation drag.",
      },
      {
        key: "debt_service_coverage_ratio",
        name: "Debt service coverage ratio (DSCR)",
        definition:
          "NOI (or net cash flow) divided by total debt service (principal + " +
          "interest) for an asset or the portfolio — the leverage-safety measure " +
          "lenders covenant and the buffer against rate and NOI shocks.",
        unit: "ratio (NOI ÷ debt service)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1.2,
          high: 2,
          basis:
            "Lenders commonly require 1.20-1.35x DSCR minimums; conservatively-" +
            "levered assets run 1.5-2.0x+, and a ratio near or below the covenant " +
            "signals refinancing and default risk, especially as floating-rate or " +
            "maturing fixed-rate debt reprices higher",
          label: "planning-range",
        },
        dataSource:
          "Investment-accounting / treasury debt schedule: NOI by asset against " +
          "the debt service (rate, amortization) and loan covenants",
        whyItMatters:
          "The pressure gauge on the capital stack — where the rate regime bites " +
          "directly. As fixed-rate debt matures into a higher-rate environment, " +
          "DSCR compresses even with flat NOI, which is precisely how rate moves " +
          "(not operations) trigger distressed sales and refinancing risk.",
      },
      {
        key: "valuation_cap_rate_spread",
        name: "Valuation cap-rate spread (vs risk-free / cost of debt)",
        definition:
          "The implied or appraised cap rate of an asset/portfolio relative to a " +
          "reference rate (the risk-free rate or cost of debt) — the risk-premium " +
          "and value-sensitivity measure that drives valuation more than NOI does.",
        unit: "bps spread (cap rate minus reference rate)",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 100,
          high: 400,
          basis:
            "The cap-rate spread over the risk-free rate compensates for real-" +
            "estate risk and illiquidity; a compressed spread signals frothy " +
            "pricing, a wide spread signals stress/repricing — the band is " +
            "sector- and cycle-dependent and is the single most value-sensitive " +
            "input",
          label: "planning-range",
        },
        dataSource:
          "Appraisal / valuation evidence (transaction comps, broker cap rates) " +
          "and the implied cap rate from the investment model, against the " +
          "reference rate",
        whyItMatters:
          "THE honesty metric of the whole doctrine — value ≈ NOI ÷ cap rate, and " +
          "the cap rate is largely set by exogenous rates and risk appetite. A " +
          "50 bp cap-rate shift can move asset value more than a full year of NOI " +
          "growth, so this spread, not operating performance, is the dominant and " +
          "least-controllable value driver. It must be sensitized, never assumed " +
          "flat.",
      },
    ],

    painThemes: [
      {
        key: "cap_rate_swamps_operations",
        name: "Cap-rate / rate-regime moves swamp the operating story",
        description:
          "Value is NOI ÷ cap rate, but cap rates are driven by interest rates " +
          "and risk appetite that are largely exogenous — so a 50 bp cap-rate " +
          "shift can erase a year of NOI growth, and business cases that promise " +
          "value from operating improvements while implicitly assuming a flat or " +
          "compressing cap rate are not honest about where returns actually come " +
          "from.",
        detectionSignal:
          "Underwriting and hold/sell models that hold the exit cap rate flat or " +
          "assume compression, value bridges that credit operations for what was " +
          "really cap-rate movement, no cap-rate sensitivity in the investment " +
          "case, surprise at marks moving with rates rather than performance.",
        diagnosticQuestion:
          "When you underwrite or value an asset, do you sensitize the exit cap " +
          "rate against the rate regime — or does your return case quietly rely on " +
          "a flat or compressing cap rate you do not control?",
      },
      {
        key: "leasing_credit_retention_drag",
        name: "Weak leasing velocity, tenant credit, and retention erode cash flow",
        description:
          "Headline asking rents and occupancy mask the real cash-flow drivers: " +
          "slow time-to-lease bleeds downtime NOI, weak-credit tenants raise " +
          "delinquency and bad debt, and poor retention churns the rent roll into " +
          "expensive re-leasing — so the collectible, durable income is far below " +
          "what the rent roll suggests.",
        detectionSignal:
          "Long time-to-lease vs sub-market absorption, rising aged delinquency, " +
          "low retention with heavy TI/LC on each renewal, occupancy propped up by " +
          "short-WALT or weak-credit tenants, asking rents disconnected from " +
          "signed-lease economics.",
        diagnosticQuestion:
          "Behind the occupancy number, what are your time-to-lease, tenant-credit " +
          "mix, retention, and collection actually doing to the collectible, " +
          "durable income?",
      },
      {
        key: "development_long_dated_entitlement_risk",
        name: "Development is a long-dated capital and entitlement-risk bet",
        description:
          "Ground-up and major redevelopment commits capital for years against a " +
          "yield-on-cost that must beat an exit cap rate set years out — exposing " +
          "the project to entitlement delay, construction-cost inflation, lease-up " +
          "risk, and a mid-build rate move that can erase the development spread " +
          "and turn a sound pro forma into a loss.",
        detectionSignal:
          "Thin or eroding yield-on-cost vs exit cap-rate spread, pro formas with " +
          "stale exit cap rates, no entitlement/cost/lease-up risk staging, " +
          "development returns that assume the rate regime at underwriting holds " +
          "through delivery, cost overruns netting against the spread.",
        diagnosticQuestion:
          "On each development, what is the yield-on-cost spread over a CURRENT " +
          "market exit cap rate, and how does it hold up against entitlement delay, " +
          "cost inflation, lease-up slippage, and a rate move mid-build?",
      },
      {
        key: "office_structural_challenge_sector_divergence",
        name: "Office is structurally challenged while sectors diverge",
        description:
          "'Real estate' is treated as one asset class when the sectors have " +
          "diverged sharply: office faces a structural post-hybrid demand decline " +
          "(the occupier footprint has shrunk), while industrial/logistics and " +
          "residential have their own supply-demand dynamics — so portfolio " +
          "strategy, valuation, and capital allocation that do not reason per " +
          "property type misjudge risk and value.",
        detectionSignal:
          "Blended cross-sector assumptions, office held at pre-hybrid value " +
          "assumptions, capital allocated as if all property types behave alike, " +
          "no sector-specific demand thesis, surprise at office marks vs " +
          "industrial/residential resilience.",
        diagnosticQuestion:
          "Does your portfolio strategy, underwriting, and valuation reason per " +
          "property type — especially honest about structural office demand — or " +
          "does it blend sectors that have genuinely diverged?",
      },
      {
        key: "fragmented_pm_lease_investment_data",
        name: "Fragmented data across property, lease, and investment systems",
        description:
          "Property-management/accounting, lease administration, and investment-" +
          "accounting (and Argus valuation models) run on different property/unit " +
          "identifiers and definitions, so producing one reconciled view of NOI, " +
          "the rent roll, valuation, and debt per asset is manual, slow, and " +
          "error-prone — and every portfolio, financing, and investor-reporting " +
          "decision is hand-assembled.",
        detectionSignal:
          "Different NOI or square-footage figures in different systems, property " +
          "IDs that do not reconcile, rent roll disconnected from the valuation " +
          "model, investor reports stitched from spreadsheets each quarter, no " +
          "single source of portfolio truth.",
        diagnosticQuestion:
          "Can you produce one reconciled, current view of NOI, the rent roll, " +
          "valuation, and debt for every asset on one identifier — or is each " +
          "portfolio and investor-reporting cycle hand-assembled?",
      },
      {
        key: "leverage_refinancing_rate_exposure",
        name: "Leverage and refinancing exposure in a higher-rate regime",
        description:
          "Capital structure is the second place the rate regime bites: floating-" +
          "rate and maturing fixed-rate debt reprices higher, compressing DSCR " +
          "even with flat NOI, and a wall of near-term maturities against tighter " +
          "lending and lower valuations forces refinancing at worse terms — or " +
          "distressed sales — independent of how well the asset operates.",
        detectionSignal:
          "Near-term debt maturity wall, high floating-rate share, DSCR near " +
          "covenant minimums, refinancing modeled at origination rates, no rate-" +
          "shock stress test on the debt schedule, loan-to-value rising as " +
          "valuations fall.",
        diagnosticQuestion:
          "What does your debt-maturity ladder and floating-rate exposure look " +
          "like against current rates, and how does DSCR and refinanceability hold " +
          "up under a rate-shock and valuation-decline stress test?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_underwriting_valuation_sensitivity",
        name: "AI-assisted underwriting & cap-rate sensitivity",
        valueMechanism:
          "Accelerate acquisition/disposition underwriting by extracting rent " +
          "rolls, leases, and operating statements, building the pro forma, and " +
          "(critically) running disciplined cap-rate and rate-regime sensitivity " +
          "and exit-scenario analysis — so the investment case is screened faster " +
          "and, more importantly, is HONEST about how much of the return depends " +
          "on an exogenous cap rate rather than on operations. HONEST BOUND: AI " +
          "speeds the analysis and enforces the sensitivity discipline; it cannot " +
          "forecast the rate regime, so the exit cap rate stays an explicit, " +
          "human-owned assumption.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Target rent roll, leases, and trailing operating statements (T-12)",
          "Market transaction comps, broker cap rates, and a reference-rate/forward-curve view",
          "Argus / investment-model pro forma structure and exit assumptions",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "The exit cap rate is an exogenous, human-owned assumption — AI runs the sensitivity, it does not predict rates",
          "Extracted rent-roll and lease data must be validated against source documents before it drives a price",
          "Underwriting output is a screen and a decision input, not an automated bid — investment committee owns the price",
        ],
        metricsMoved: [
          "valuation_cap_rate_spread",
          "development_yield_on_cost_spread",
          "noi_growth",
        ],
      },
      {
        key: "ai_lease_abstraction_rent_roll",
        name: "AI lease abstraction & rent-roll intelligence",
        valueMechanism:
          "Use document AI to abstract leases (term, rent steps, options, " +
          "recoveries, co-tenancy, breaks) into a structured, reconciled rent roll " +
          "and lease-expiry schedule — collapsing manual abstraction effort, " +
          "surfacing WALT, rollover, and recovery exposure, and creating the " +
          "single reconciled rent-roll truth that underwriting, valuation, and " +
          "investor reporting all depend on.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Lease documents and amendments, and the property/unit identifier map",
          "Lease-administration system as the system of record to write back to",
          "Recovery/CAM and escalation clause taxonomy to structure terms",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Abstracted terms drive billing, valuation, and disclosure — low-confidence extractions must route to human review, not auto-commit",
          "Source-clause citations must be preserved so every abstracted term traces to the lease language",
          "Reconciliation to the property/unit identifier is required before the abstraction feeds the rent roll",
        ],
        metricsMoved: [
          "weighted_avg_lease_term",
          "occupancy_leased_rate",
          "rent_collection_rate",
        ],
      },
      {
        key: "ai_leasing_pricing_retention",
        name: "AI leasing optimization, dynamic pricing & retention",
        valueMechanism:
          "Apply demand and pricing analytics to set asking rents and concessions " +
          "to real sub-market absorption, score and prioritize the leasing " +
          "pipeline, and flag at-risk renewals early so retention effort is " +
          "targeted — compressing time-to-lease, lifting retention, and reducing " +
          "the downtime and TI/LC drag that erode NOI.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Leasing CRM pipeline, historical lease/renewal outcomes, and concessions",
          "Sub-market absorption, comparable rents, and availability data",
          "Tenant tenure, payment history, and lease-expiry schedule for renewal risk",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Pricing and renewal recommendations are decision support; the leasing team and asset manager own the deal and the tenant relationship",
          "Fair-housing / anti-discrimination constraints apply to residential pricing and screening — models must be governed for disparate impact",
          "Recommendations must respect the credit-quality trade-off — chasing occupancy with weak-credit tenants is not a win",
        ],
        metricsMoved: [
          "leasing_velocity_time_to_lease",
          "tenant_retention_rate",
          "occupancy_leased_rate",
        ],
      },
      {
        key: "ai_noi_operations_optimization",
        name: "AI NOI & property-operations optimization",
        valueMechanism:
          "Apply analytics to operating expense, energy, recoveries, and " +
          "collections — benchmarking expense lines across the portfolio, " +
          "optimizing energy and maintenance, maximizing recoverable CAM, and " +
          "predicting delinquency early — to grow same-store NOI margin and lift " +
          "the collection rate without degrading the asset, capturing the operating " +
          "lever the owner actually controls.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Property-accounting operating-expense, recovery, and AR/collections data by asset",
          "Energy/utility and maintenance/work-order data for operating optimization",
          "Same-store pool definition and the portfolio expense-benchmark set",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Expense and recovery optimization must respect lease recovery terms and tenant-relationship limits, not just the cost line",
          "Delinquency prediction supports outreach; collection and eviction actions remain human- and compliance-governed",
          "Deferred-maintenance trade-offs must be flagged — short-term expense cuts that defer capital erode the asset",
        ],
        metricsMoved: [
          "same_store_noi_margin",
          "rent_collection_rate",
          "capex_pct_of_noi",
        ],
      },
      {
        key: "ai_portfolio_capital_allocation",
        name: "AI portfolio analytics & capital-allocation / hold-sell",
        valueMechanism:
          "Model the portfolio by asset and sector against measured NOI, " +
          "valuation, debt maturities, and rate scenarios to inform hold/sell/" +
          "refinance and capital-allocation decisions — sequencing dispositions, " +
          "flagging refinancing and DSCR risk, and reasoning per property type " +
          "(honest about structural office) so capital moves toward the best risk-" +
          "adjusted returns rather than on a blended, stale view.",
        adoptionProfile: "early",
        dataDependencies: [
          "Reconciled asset-level NOI, valuation, and the debt-maturity/DSCR schedule",
          "Sector demand theses and market cap-rate evidence by property type",
          "Rate-scenario / forward-curve assumptions for the stress test",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Hold/sell/refinance moves are large and hard to reverse — they require investment-committee approval, not algorithmic action",
          "Rate and cap-rate scenarios are planning ranges, not forecasts, and must be labelled as such in any recommendation",
          "Per-sector theses (especially office) are judgments that must be stated and stress-tested, not assumed",
        ],
        metricsMoved: [
          "valuation_cap_rate_spread",
          "debt_service_coverage_ratio",
          "ffo_per_share",
        ],
      },
      {
        key: "ai_investor_reporting_copilot",
        name: "AI fund / investor-reporting & valuation copilot",
        valueMechanism:
          "Automate the assembly of fund and investor reporting — NOI and same-" +
          "store roll-forwards, rent-roll and WALT summaries, FFO/AFFO and debt " +
          "schedules, valuation bridges — from the reconciled systems with drafted, " +
          "reviewed commentary, collapsing reporting turnaround and freeing asset-" +
          "management capacity from spreadsheet assembly for analysis.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Reconciled property-accounting, lease, and investment-accounting data on one identifier",
          "Prior investor/board reporting packs and the NAREIT FFO/AFFO definitions",
          "Valuation/appraisal evidence for the mark and the valuation bridge",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Investor-facing figures and valuation marks must be reviewed and signed off — no unverified numbers to LPs or the market",
          "FFO/AFFO and same-store must follow the disclosed definitions consistently; drafted commentary must trace to reconciled numbers",
          "Entitlements must fence confidential fund/asset data to authorized investors and roles",
        ],
        metricsMoved: [
          "ffo_per_share",
          "same_store_noi_margin",
          "noi_growth",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "single_source_portfolio_truth",
        name: "Single source of portfolio truth (PM + lease + investment accounting)",
        description:
          "One reconciled data model where property-management/accounting, lease " +
          "administration, and investment accounting (and the Argus valuation " +
          "model) share a property/unit identifier and consistent NOI, rent-roll, " +
          "valuation, and debt definitions — the backbone the underwriting, hold/" +
          "sell, financing, and investor-reporting decisions all bind to, " +
          "replacing the spreadsheet-stitched portfolio view.",
        boundary:
          "Owns the reconciled portfolio data model and definitions; does not own " +
          "the investment decision, the lease negotiation, or property operations " +
          "(it makes them fact-based and reconciled).",
        humanAccountabilityPoint:
          "Head of Asset Management / CFO (with the Real-Estate Data/Systems lead)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "disciplined_underwriting_valuation",
        name: "Disciplined underwriting & cap-rate-sensitized valuation",
        description:
          "An underwriting and valuation discipline where every acquisition, " +
          "disposition, and hold/sell case carries explicit, sensitized exit cap-" +
          "rate and rate-regime scenarios, a documented sector demand thesis, and " +
          "a walk-away price — so the investment case is honest that returns are " +
          "largely rate-regime-driven and operations are necessary but not " +
          "sufficient.",
        boundary:
          "Owns the underwriting model, sensitivity discipline, and valuation " +
          "method; does not own the rate regime (exogenous) or the investment-" +
          "committee decision (it supplies the sensitized, honest case the IC " +
          "decides on).",
        humanAccountabilityPoint:
          "Chief Investment Officer / Investment Committee",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "leasing_tenant_management_engine",
        name: "Leasing velocity & tenant-management engine",
        description:
          "A leasing and tenant-management practice that prices to real sub-market " +
          "absorption, runs a scored leasing pipeline, manages retention against " +
          "the expiry schedule, and weighs tenant credit and lease term — so the " +
          "rent roll grows collectible, durable income (velocity, retention, WALT, " +
          "collections) rather than headline occupancy.",
        boundary:
          "Owns the leasing strategy, pricing, pipeline, and tenant-management " +
          "discipline; does not own the corporate-occupier's workplace decision " +
          "(that is the Corporate Real Estate & Workplace expert's — the tenant is " +
          "this engine's customer).",
        humanAccountabilityPoint:
          "Head of Leasing / Asset Manager (with the Credit/Risk lead for tenant covenants)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "development_capital_risk_staging",
        name: "Development & capital-stack risk staging",
        description:
          "A development-and-financing pattern that gates ground-up and " +
          "redevelopment on a yield-on-cost spread over a CURRENT exit cap rate, " +
          "stages entitlement/construction/lease-up risk, and stress-tests the " +
          "debt-maturity ladder and DSCR against rate shocks — so long-dated " +
          "capital bets and refinancing exposure are sized honestly against the " +
          "rate regime, not at origination assumptions.",
        boundary:
          "Owns development pro-forma gating, risk staging, and the debt/DSCR " +
          "stress discipline; does not own construction execution or the capital-" +
          "markets transaction itself (it sizes and stress-tests the bet the " +
          "developer and treasury execute).",
        humanAccountabilityPoint:
          "Head of Development / Treasury (with the Investment Committee for the capital commitment)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Real-estate value is, to first order, NOI ÷ cap rate — so durable value " +
        "is created on the NOI side and JUDGED on the cap-rate side, and the " +
        "honest narrative keeps the two separate. The operating levers the owner " +
        "CONTROLS sit in NOI: leasing velocity and retention (less downtime and " +
        "re-leasing cost), tenant credit and collections (collectible income), " +
        "same-store NOI margin (operating efficiency and recoverable expense), and " +
        "the capex discipline that sustains the asset. AI accelerates these — " +
        "lease abstraction and a reconciled rent roll, leasing pricing and " +
        "retention, NOI/operations optimization, and faster investor reporting — " +
        "and they are the genuinely controllable, bookable slice of value. BUT the " +
        "DOMINANT and least-controllable driver is the cap rate: value ≈ NOI ÷ " +
        "cap rate means a 50 bp cap-rate shift, driven by interest rates and risk " +
        "appetite that are largely EXOGENOUS, can move value more than a year of " +
        "NOI growth — so any value case must sensitize the exit cap rate and be " +
        "honest that returns are rate-regime-dependent. Development adds value only " +
        "when yield-on-cost beats a CURRENT exit cap rate by enough to pay for " +
        "entitlement, construction, and lease-up risk over a multi-year build — a " +
        "spread a mid-build rate move can erase. And leverage is where the rate " +
        "regime bites the capital stack: maturing debt repricing higher compresses " +
        "DSCR and forces refinancing or distressed sales independent of operating " +
        "quality. So durable value is sized on controllable NOI growth, gated on " +
        "data quality and tenant credit, weighted to leasing/retention/operations, " +
        "and HAIRCUT for the exogenous cap-rate/rate regime, development long-dated " +
        "risk, and refinancing exposure — never on an operating story that quietly " +
        "assumes a flat or compressing cap rate it does not control.",
      dominantHaircutFactors: [
        {
          factor: "Cap-rate / interest-rate regime (the exogenous, dominant driver)",
          rationale:
            "The dominant haircut: value ≈ NOI ÷ cap rate, and the cap rate is " +
            "set largely by exogenous interest rates and risk appetite. A modest " +
            "cap-rate widening can erase a year of NOI growth, so any value claim " +
            "resting on operations must be discounted for the rate-regime risk the " +
            "operator does not control and cannot forecast.",
          typicalHaircut: {
            low: 0.2,
            high: 0.6,
            basis:
              "Share of an operating-improvement value thesis that is exposed to " +
              "(or can be erased by) an adverse exit cap-rate / rate-regime move " +
              "over the hold period",
            label: "planning-range",
          },
        },
        {
          factor: "Tenant credit, collections & income durability",
          rationale:
            "A rent roll is only worth its collectible, durable income. Weak-" +
            "credit tenants, rising delinquency, short WALT, and rollover " +
            "concentration mean realized NOI falls below the contracted roll, so " +
            "headline-rent value must be discounted to durable, collectible income.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Gap between contracted-rent-roll income and durable collectible " +
              "NOI given tenant credit, delinquency/bad-debt, retention, and " +
              "rollover exposure",
            label: "planning-range",
          },
        },
        {
          factor: "Development long-dated, entitlement & lease-up risk",
          rationale:
            "Development value rests on a yield-on-cost spread over an exit cap " +
            "rate years out, exposed to entitlement delay, construction-cost " +
            "inflation, lease-up slippage, and a mid-build rate move — so the " +
            "development premium must be discounted for the long-dated execution " +
            "and rate risk that can compress or erase the spread.",
          typicalHaircut: {
            low: 0.15,
            high: 0.5,
            basis:
              "Reduction in modeled development profit where entitlement, cost-" +
              "inflation, lease-up, and mid-build cap-rate risk compressed the " +
              "yield-on-cost spread",
            label: "planning-range",
          },
        },
        {
          factor: "Leverage & refinancing exposure",
          rationale:
            "Maturing fixed-rate and floating-rate debt repricing into a higher-" +
            "rate regime compresses DSCR and forces refinancing at worse terms or " +
            "distressed sales independent of operating quality — so levered " +
            "equity value must be discounted for the refinancing and rate-shock " +
            "exposure in the debt ladder.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Erosion of levered equity value from refinancing at higher rates, " +
              "DSCR compression, and loan-to-value stress as valuations fall",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Same-store NOI uplift (operations, recoveries, collections)",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Reported organic same-store NOI uplift from operating-expense and " +
              "recovery optimization, collections improvement, and energy/" +
              "maintenance efficiency on stabilized assets",
            label: "planning-range",
          },
          measuredAs:
            "Relative annual lift in same-store NOI from controllable operating " +
            "levers, net of any deferred-capital give-back",
        },
        {
          lever: "Leasing downtime & re-leasing cost reduction",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported reduction in vacancy downtime and TI/LC re-leasing cost " +
              "from faster leasing velocity, dynamic pricing, and higher retention",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in downtime (foregone NOI) and TI/LC cost per " +
            "leased area from velocity and retention improvement",
        },
        {
          lever: "Underwriting / lease-abstraction & reporting effort reduction",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported reduction in manual underwriting, lease-abstraction, and " +
              "investor-reporting assembly effort from document AI and reconciled " +
              "data",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in asset-management and analyst effort re-deployed " +
            "from assembly/abstraction to analysis and deal screening",
        },
      ],
      timeToValueBand:
        "Operating/efficiency levers (lease abstraction and a reconciled rent " +
        "roll, leasing pricing/retention, NOI/operations optimization, investor-" +
        "reporting automation): 1-3 quarters once the property/lease/investment " +
        "data is reconciled. Same-store NOI uplift compounds over 2-4 quarters of " +
        "leasing and expense cycles. Underwriting/cap-rate discipline pays off at " +
        "the next acquisition/disposition decision. Development value is paced by " +
        "the multi-year build and lease-up. Cap-rate-driven value, by contrast, is " +
        "realized (or lost) with the rate regime on a timeline NO program controls. " +
        "Full asset-and-portfolio operating-model maturity: 18-36 months.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Property management & accounting system",
          role:
            "System of record for property operations and accounting — rent " +
            "billing, AR/collections, operating expense, recoveries/CAM, and asset-" +
            "level NOI; the source for occupancy, collections, and same-store NOI.",
          examples: [
            "Yardi Voyager",
            "MRI Software",
            "RealPage",
            "AppFolio",
          ],
        },
        {
          name: "Lease administration & lease-accounting system",
          role:
            "Holds lease abstracts, the rent roll, rent steps and recoveries, the " +
            "critical-date/expiry schedule, WALT, and the ASC 842 / IFRS 16 lessor " +
            "treatment — the source of truth for the rent roll and rollover.",
          examples: [
            "Yardi / MRI lease administration",
            "Visual Lease",
            "Nakisa",
            "LeaseAccelerator (lessor)",
          ],
        },
        {
          name: "Valuation & cash-flow modeling (Argus)",
          role:
            "Discounted-cash-flow and direct-capitalization property valuation — " +
            "rent roll, assumptions, exit cap rate, and yield-on-cost — the source " +
            "for asset valuation, underwriting, and the development pro forma.",
          examples: [
            "Argus Enterprise",
            "Argus Developer",
            "internal DCF / Excel models",
            "RealPage / Yardi valuation modules",
          ],
        },
        {
          name: "Investment accounting & fund administration",
          role:
            "Fund- and entity-level accounting — FFO/AFFO, the debt schedule and " +
            "DSCR, capital accounts, and investor/LP reporting; the source for " +
            "fund returns and financial reporting.",
          examples: [
            "Yardi Investment Accounting",
            "MRI Investment Management",
            "Anaplan / EPM for fund consolidation",
            "fund-administration platforms",
          ],
        },
        {
          name: "Leasing CRM & deal/pipeline management",
          role:
            "Leasing pipeline, tour-to-lease conversion, prospect and tenant CRM, " +
            "and acquisition/disposition deal tracking — the source for leasing " +
            "velocity, pipeline, and deal flow.",
          examples: [
            "VTS",
            "Salesforce (real-estate cloud)",
            "Dealpath",
            "RealPage / Yardi CRM",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Investment Officer / Head of Acquisitions",
          accountability:
            "Owns the buy/sell/develop decision, underwriting discipline, the " +
            "exit cap-rate and rate-regime assumptions, and the walk-away price — " +
            "the investment-case honesty.",
        },
        {
          title: "Head of Asset Management",
          accountability:
            "Owns asset-level NOI, business-plan execution, hold/sell " +
            "recommendations, capex prioritization, and the reconciled view of " +
            "performance per asset.",
        },
        {
          title: "Head of Leasing",
          accountability:
            "Owns leasing velocity, the pipeline, asking rents and concessions, " +
            "tenant credit and retention, and the collectible-income quality of " +
            "the rent roll.",
        },
        {
          title: "Head of Property Operations",
          accountability:
            "Owns property-level operating cost, recoveries/CAM, maintenance and " +
            "energy, collections, and the same-store NOI margin.",
        },
        {
          title: "CFO / Head of Capital Markets & Fund Reporting",
          accountability:
            "Owns financing, the debt-maturity ladder and DSCR, FFO/AFFO, " +
            "valuation marks, and fund/investor reporting and disclosure.",
        },
      ],
      regulatoryFrames: [
        {
          name: "REIT tax qualification rules (IRS / local equivalents)",
          relevance:
            "REIT status requires meeting income, asset, and distribution tests " +
            "(e.g. the ~90% taxable-income distribution requirement and asset/" +
            "income composition tests); how income is earned and distributed is " +
            "tax-constrained, not just an operating choice.",
        },
        {
          name: "SEC reporting & NAREIT FFO/AFFO disclosure standards",
          relevance:
            "Public REITs report under SEC rules and disclose FFO/AFFO and same-" +
            "store metrics per NAREIT definitions; these non-GAAP measures must be " +
            "computed and reconciled consistently, and AI-drafted commentary must " +
            "be accurate and reviewable.",
        },
        {
          name: "Lease accounting standards (ASC 842 / IFRS 16, lessor)",
          relevance:
            "Lessor lease accounting governs how lease income, modifications, and " +
            "the rent roll are recognized and disclosed; abstracted lease terms " +
            "feed the accounting treatment and must be accurate to the lease " +
            "language.",
        },
        {
          name: "Fair-value, appraisal & fund-valuation standards (USPAP / IVS / GIPS)",
          relevance:
            "Property and fund valuations follow appraisal and valuation standards " +
            "(and performance-reporting standards like GIPS for fund returns); " +
            "marks and the cap-rate/DCF assumptions behind them must be defensible " +
            "and independently supportable.",
        },
        {
          name: "Fair-housing & tenant-protection regulation",
          relevance:
            "Residential leasing, pricing, and tenant screening are governed by " +
            "fair-housing and tenant-protection law; AI pricing and screening must " +
            "be governed for disparate impact and prohibited factors.",
        },
      ],
      canonicalTerms: [
        {
          term: "NOI (net operating income)",
          definition:
            "Property rental and other income less direct operating expenses, " +
            "before debt service, capex, depreciation, and corporate overhead — " +
            "the core operating cash-flow measure of an asset.",
        },
        {
          term: "Cap rate (capitalization rate)",
          definition:
            "Stabilized NOI divided by asset value; the market-applied yield that, " +
            "inverted, capitalizes NOI into value (value ≈ NOI ÷ cap rate) and is " +
            "driven largely by interest rates and risk appetite.",
        },
        {
          term: "FFO / AFFO (funds from operations / adjusted FFO)",
          definition:
            "REIT earnings measures: FFO is net income excluding property gains/" +
            "losses plus real-estate depreciation (NAREIT); AFFO further deducts " +
            "recurring capex and TI/LC — the recurring-cash yardsticks for the " +
            "dividend and valuation.",
        },
        {
          term: "WALT / WAULT (weighted-average (unexpired) lease term)",
          definition:
            "The rent-weighted average unexpired lease term across the rent roll — " +
            "the durability/rollover measure of the income stream.",
        },
        {
          term: "Yield-on-cost (development yield)",
          definition:
            "Stabilized NOI of a development divided by total project cost; the " +
            "spread of yield-on-cost over the market exit cap rate is the " +
            "development profit margin.",
        },
        {
          term: "TI/LC (tenant improvements / leasing commissions)",
          definition:
            "Capital and commission cost incurred to sign or renew a lease — the " +
            "re-leasing cost that nets against rent and is the reason retention " +
            "beats churn.",
        },
        {
          term: "DSCR (debt service coverage ratio)",
          definition:
            "NOI (or net cash flow) divided by total debt service; the leverage-" +
            "safety ratio lenders covenant and the buffer against rate and NOI " +
            "shocks.",
        },
        {
          term: "Same-store",
          definition:
            "The pool of assets owned and stabilized across both comparison " +
            "periods, used to isolate organic operating performance from the " +
            "effect of acquisitions and dispositions.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "NOI, same-store growth, and operating margin",
        authoritativeSource:
          "Property-accounting NOI by asset reconciled to the investment-" +
          "accounting GL, with the same-store pool definition held constant",
        whatGoodEvidenceLooksLike:
          "Asset- and same-store-level NOI and revenue across periods with the " +
          "expense and recovery detail and the same-store definition, reconciled " +
          "to the GL.",
        weakEvidenceToReject:
          "A portfolio 'NOI grew X%' with no same-store basis, no reconciliation, " +
          "or growth that is really acquisitions rather than organic.",
      },
      {
        claim: "Rent roll, occupancy, WALT, and rollover",
        authoritativeSource:
          "Lease-administration rent roll and lease-expiry schedule, with " +
          "abstracted terms traceable to the lease documents",
        whatGoodEvidenceLooksLike:
          "The current rent roll with leased vs physical occupancy, rent-weighted " +
          "WALT, the expiry/rollover schedule, and tenant-credit and retention " +
          "detail.",
        weakEvidenceToReject:
          "A headline occupancy or 'fully leased' claim with no rent roll, no " +
          "WALT/rollover detail, and no distinction of signed-not-commenced space.",
      },
      {
        claim: "Valuation, cap rate, and rate-regime sensitivity",
        authoritativeSource:
          "Appraisal/valuation evidence (transaction comps, broker cap rates) and " +
          "the implied cap rate from the investment/DCF model against a reference " +
          "rate",
        whatGoodEvidenceLooksLike:
          "An implied or appraised cap rate supported by comps, with explicit " +
          "exit-cap-rate and rate-regime sensitivity showing value's response to a " +
          "cap-rate shift.",
        weakEvidenceToReject:
          "A value or return case with a flat-held or compressing exit cap rate, " +
          "no sensitivity, and no comp support — operating-credit for cap-rate " +
          "movement.",
      },
      {
        claim: "Leverage, DSCR, and refinancing exposure",
        authoritativeSource:
          "The investment-accounting/treasury debt schedule: NOI vs debt service, " +
          "maturity ladder, floating-rate share, and loan covenants",
        whatGoodEvidenceLooksLike:
          "DSCR by asset against the covenant, the debt-maturity ladder and " +
          "floating-rate exposure, and a rate-shock stress test on refinanceability.",
        weakEvidenceToReject:
          "A 'conservatively levered' assertion with no DSCR, no maturity ladder, " +
          "and refinancing modeled at origination rates.",
      },
      {
        claim: "Development yield-on-cost and spread",
        authoritativeSource:
          "The development pro forma (stabilized NOI ÷ total project cost) versus " +
          "current market exit cap-rate evidence for the asset type and market",
        whatGoodEvidenceLooksLike:
          "Yield-on-cost against a CURRENT exit cap rate with the spread, plus " +
          "entitlement, cost, and lease-up risk staging and a mid-build rate " +
          "sensitivity.",
        weakEvidenceToReject:
          "A development return with a stale exit cap rate, no spread shown, and " +
          "no entitlement/cost/lease-up or rate-move risk staging.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "When you underwrite or value an asset, do you sensitize the exit cap rate against the rate regime — or does the return case rely on a flat/compressing cap rate you do not control?",
      "Behind your occupancy number, what are time-to-lease, tenant-credit mix, retention, and collection actually doing to collectible, durable income?",
      "What is your same-store NOI growth and margin, separated honestly from growth that is really acquisitions?",
      "On each development, what is the yield-on-cost spread over a CURRENT exit cap rate, and how does it hold up against entitlement delay, cost inflation, lease-up slippage, and a mid-build rate move?",
      "What does your debt-maturity ladder, floating-rate share, and DSCR look like against current rates under a rate-shock and valuation-decline stress test?",
      "Can you produce one reconciled, current view of NOI, the rent roll, valuation, and debt for every asset on one identifier — or is each cycle hand-assembled?",
      "Does your portfolio strategy and valuation reason per property type — especially honest about structural office demand — or does it blend sectors that have diverged?",
    ],
    maturitySignals: [
      "Every investment case carries an explicit, sensitized exit cap-rate and rate-regime scenario and a walk-away price — returns are not credited to operations that are really cap-rate movement.",
      "One reconciled source of portfolio truth (PM + lease + investment accounting on one identifier) feeds underwriting, hold/sell, financing, and investor reporting.",
      "Leasing is managed on collectible, durable income — velocity, tenant credit, retention, WALT, and collections — not headline occupancy.",
      "Development is gated on a yield-on-cost spread over a current exit cap rate with staged entitlement/cost/lease-up risk, and the debt ladder is stress-tested for rate shocks.",
    ],
    redFlags: [
      "Underwriting and hold/sell models hold the exit cap rate flat or assume compression, and value bridges credit operations for what was really cap-rate movement.",
      "Occupancy looks healthy but rests on weak-credit, short-WALT tenants with rising delinquency and low retention — collectible income is far below the rent roll.",
      "Development pro formas use stale exit cap rates with no spread shown and no entitlement/cost/lease-up or mid-build rate-move risk staging.",
      "A near-term debt-maturity wall and high floating-rate exposure sit against DSCR near covenant minimums, modeled at origination rates with no rate-shock stress test.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Property-management & accounting suites (Yardi, MRI, RealPage)",
        category: "Property operations, accounting, AR/collections, rent roll",
        switchingCost:
          "High — the rent roll, chart of accounts, recoveries, and years of " +
          "operating history are deeply embedded; re-platforming is a multi-year, " +
          "data-migration-heavy program.",
        renewalDynamics:
          "Per-unit / per-module subscription; AI, leasing, and investor-" +
          "reporting modules increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Argus (Enterprise / Developer) — valuation & modeling",
        category: "DCF/valuation, underwriting, development pro forma",
        switchingCost:
          "High — Argus is the de-facto institutional valuation standard; models, " +
          "assumptions, and investor familiarity create strong lock-in despite " +
          "Excel-model alternatives.",
        renewalDynamics:
          "Per-seat subscription; bundled within the Altus/MRI ecosystem and " +
          "pushed against in-house Excel and emerging modeling tools.",
      },
      {
        vendorName: "Lease administration / lease-accounting (Visual Lease, Nakisa, native Yardi/MRI)",
        category: "Lease abstracts, rent roll, ASC 842/IFRS 16 lessor accounting",
        switchingCost:
          "Moderate-to-high — abstracted lease data and accounting configuration " +
          "accrete; re-abstraction and re-validation are the real cost.",
        renewalDynamics:
          "Per-lease / subscription pricing; AI lease-abstraction features upsold; " +
          "often a build-vs-native-module decision against the PM suite.",
      },
      {
        vendorName: "Leasing CRM & deal management (VTS, Dealpath, Salesforce)",
        category: "Leasing pipeline, tour-to-lease, acquisition/disposition deal flow",
        switchingCost:
          "Moderate — pipeline data and process accrete but are replaceable with " +
          "re-build effort; watch broker-network and integration lock-in.",
        renewalDynamics:
          "Per-seat subscription; analytics/benchmarking and AI features upsold as " +
          "premium tiers.",
      },
      {
        vendorName: "Investment accounting & fund administration (Yardi IA, MRI IM, fund admins)",
        category: "Fund/entity accounting, FFO/AFFO, debt/DSCR, investor reporting",
        switchingCost:
          "High — fund accounting, capital accounts, and investor-reporting " +
          "configuration are deeply embedded and audit-sensitive; switching is " +
          "rare and disruptive.",
        renewalDynamics:
          "Subscription or outsourced fund-admin fee; the negotiation is often " +
          "build-vs-outsource and reporting-automation scope, not seat price.",
      },
    ],
    switchingCosts:
      "The property-management suite, Argus valuation models, and investment-" +
      "accounting configuration are effectively non-switchable in isolation — the " +
      "rent roll, accounting, and years of history are embedded and audit-" +
      "sensitive. The negotiable frontier is in AI/automation capabilities layered " +
      "on those platforms (lease abstraction, leasing analytics, reporting), in " +
      "the leasing CRM and benchmarking layer, and in the data-integration that " +
      "produces one reconciled view across PM, lease, and investment systems.",
    negotiationLevers: [
      "Tie AI/automation feature pricing (lease abstraction, leasing analytics, reporting) to measured outcomes — effort reduction, velocity, accuracy — not seat counts",
      "Data portability and an open property/unit identifier to prevent rent-roll and valuation-model lock-in across the PM, lease, and investment stack",
      "Build-vs-native-module discipline (lease admin, CRM, reporting) against the incumbent PM suite to keep the suite vendor honest at renewal",
      "Audit, explainability, and validation rights for any AI in lease abstraction, valuation, or pricing (accounting and fair-housing exposure)",
      "Pilot-to-scale gating on one fund/asset class with reconciliation parity proof before an enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      noi_operating_claim: [
        "asset- and same-store-level NOI reconciled to the GL",
        "the same-store pool definition held constant",
        "expense and recovery detail behind the margin",
      ],
      rent_roll_claim: [
        "current rent roll with leased vs physical occupancy",
        "rent-weighted WALT and the expiry/rollover schedule",
        "tenant-credit and retention detail (not headline occupancy)",
      ],
      valuation_cap_rate_claim: [
        "implied or appraised cap rate with transaction-comp support",
        "explicit exit-cap-rate and rate-regime sensitivity (no flat-held cap rate)",
        "reference-rate / forward-curve basis",
      ],
      development_claim: [
        "yield-on-cost vs a CURRENT market exit cap rate (spread shown)",
        "entitlement, construction-cost, and lease-up risk staging",
        "mid-build rate-move sensitivity",
      ],
      leverage_claim: [
        "DSCR by asset against the covenant",
        "debt-maturity ladder and floating-rate exposure",
        "rate-shock and valuation-decline refinancing stress test",
      ],
    },
    citationStandard:
      "Quantitative real-estate claims cite the governed source: NOI and same-" +
      "store cite property-accounting reconciled to the investment GL with a held-" +
      "constant same-store pool; rent-roll, occupancy, WALT, and rollover cite the " +
      "lease-administration rent roll with terms traceable to the lease documents; " +
      "collections cite billed-vs-collected and aged delinquency. A VALUATION or " +
      "RETURN claim must cite an implied/appraised cap rate with comp support AND " +
      "explicit exit-cap-rate/rate-regime sensitivity — never a value case with a " +
      "flat-held or compressing cap rate, and never operating-credit for what is " +
      "really cap-rate movement. A DEVELOPMENT claim cites yield-on-cost against a " +
      "CURRENT exit cap rate with the spread and risk staging; a LEVERAGE claim " +
      "cites DSCR, the maturity ladder, and a rate-shock stress test.",
  },

  hedgeRules: {
    whenToHedge: [
      "A value or return case credits operating improvements while implicitly assuming a flat or compressing cap rate — flag that returns are largely rate-regime-driven and exogenous, and sensitize the exit cap rate.",
      "Occupancy or rent-roll figures are cited without tenant-credit, WALT, retention, and collection detail — flag that collectible, durable income may be well below the headline.",
      "A development spread is cited against a stale exit cap rate or with no risk staging — flag the mid-build rate and entitlement/cost/lease-up risk.",
      "Benchmark ranges (NOI growth, cap rates, FM cost) are applied to a tenant without their measured figures — frame them as sector/cycle planning ranges, not their number.",
      "Cross-sector assumptions are applied uniformly — flag that office, industrial, and residential have diverged and must be reasoned per property type.",
    ],
    inferenceLanguage: [
      "Across institutional assets of this type, cap rates and NOI growth typically run... — but the exit cap rate is exogenous and must be sensitized to the rate regime",
      "Without your measured rent roll, WALT, and collections, the sector pattern suggests durable income is...",
      "Treating this as a sector/cycle planning range rather than your measured figure...",
      "Reasoned per property type — office demand is structurally weaker than this blended pattern implies...",
    ],
    flagWithoutEvidence: [
      "A specific NOI-growth, cap-rate, occupancy, WALT, DSCR, or FFO number for this tenant/asset",
      "A return or value case that holds the exit cap rate flat or assumes compression without sensitivity",
      "A development spread asserted against a stale exit cap rate with no risk staging",
      "Headline occupancy treated as durable, collectible income without tenant-credit, WALT, and collection evidence",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "valuation sensitivity / how does value move with the cap rate and rate regime",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of value sensitivity to exit cap rate, NOI, rate/discount rate, and lease-up — showing the cap rate as the dominant, exogenous swing driver.",
    },
    {
      questionPattern:
        "NOI bridge / what drove the change in NOI period over period",
      exhibitKind: "chart",
      chartKind: "waterfall",
      chartBuilder: "valueBridge",
      note: "Bridge NOI by driver (same-store rent, occupancy, recoveries, expenses, acquisitions/dispositions) separating organic same-store from portfolio change.",
    },
    {
      questionPattern:
        "rent roll & lease-expiry / rollover and WALT exposure",
      exhibitKind: "table",
      note: "Per tenant/lease: area, rent, credit, lease term and expiry, WALT contribution, and the rollover schedule with re-leasing (TI/LC) and downtime exposure.",
    },
    {
      questionPattern:
        "portfolio scorecard / asset and sector health",
      exhibitKind: "table",
      note: "NOI growth, occupancy, leasing velocity, retention, collections, same-store margin, WALT, DSCR, and implied cap rate by asset/sector vs planning ranges.",
    },
    {
      questionPattern:
        "debt-maturity ladder & DSCR stress / refinancing exposure",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      note: "Debt maturing by year split fixed/floating with DSCR and LTV under a rate-shock and valuation-decline stress test.",
    },
    {
      questionPattern:
        "development pipeline / yield-on-cost spread vs exit cap rate",
      exhibitKind: "chart",
      chartKind: "range-bar",
      note: "Per development: yield-on-cost vs current exit cap rate (the spread) with entitlement/cost/lease-up and mid-build rate-move risk range.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Underwriting and valuation are disciplined and honest: every case sensitizes the exit cap rate and rate regime and carries a walk-away price, separating controllable NOI from exogenous cap-rate movement",
      "One reconciled source of portfolio truth (PM + lease + investment accounting) feeds underwriting, hold/sell, financing, and investor reporting",
      "Leasing is managed on collectible, durable income — velocity, tenant credit, retention, WALT, and collections — not headline occupancy",
      "Capital structure is stress-tested for rate shocks (DSCR, maturity ladder, floating-rate exposure) so refinancing risk is managed before it forces distressed sales",
    ],
    failureDrivers: [
      "Return cases quietly assume a flat or compressing exit cap rate, so 'value creation' is really an exogenous rate-regime bet that reverses when rates move",
      "Occupancy is chased with weak-credit, short-WALT tenants and rising delinquency, so the rent roll overstates durable, collectible income",
      "Development is underwritten at stale exit cap rates with no risk staging, and a mid-build rate move or cost overrun erases the spread",
      "Fragmented PM/lease/investment data means no reconciled portfolio truth, so every decision is hand-assembled and slow, and a debt-maturity wall is met unprepared",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Operating and reporting efficiency adopts first where it is measurable — " +
      "AI lease abstraction and a reconciled rent roll, leasing pricing/retention, " +
      "NOI/operations optimization, and investor-reporting automation — because " +
      "the effort and velocity gains are tangible and the control posture is " +
      "governable. Underwriting and cap-rate-sensitivity discipline follows as the " +
      "investment team builds trust in AI-extracted data and the sensitivity " +
      "becomes standard at every deal. Portfolio capital-allocation and hold/sell " +
      "intelligence is adopted last and most deliberately, requiring the reconciled " +
      "data and an investment-committee mandate — and the value it points to is " +
      "still gated by an exogenous rate regime no program controls.",
    roiClarity: "medium",
    roiClarityBasis:
      "Operating ROI (lease-abstraction and reporting effort, leasing downtime " +
      "and TI/LC, same-store NOI uplift, collections) is reasonably firm because " +
      "it is measurable in the property and investment systems. But the DOMINANT " +
      "value driver — the cap rate — is exogenous and rate-regime-driven, so total " +
      "return ROI is honestly only medium: a 50 bp cap-rate move can swamp a year " +
      "of operating gains in either direction, and that is outside the program's " +
      "control. That is exactly why the evidence and hedge rules force exit-cap-" +
      "rate sensitivity and durable-income proof, and why returns are framed as " +
      "rate-regime-dependent rather than as a clean operating line.",
  },

  regulatoryFrame: {
    name: "REIT tax, SEC/NAREIT reporting, lease accounting & valuation standards",
    relevance:
      "The dominant regulatory frame for the property owner/investor: REIT tax " +
      "qualification (income, asset, and ~90% distribution tests) constrains how " +
      "income is earned and distributed; public REITs report under SEC rules and " +
      "disclose FFO/AFFO and same-store per NAREIT non-GAAP definitions; lessor " +
      "lease accounting (ASC 842 / IFRS 16) governs lease-income recognition that " +
      "abstracted terms feed; and property/fund valuations follow appraisal and " +
      "performance standards (USPAP/IVS/GIPS) so cap-rate and DCF marks must be " +
      "defensible. Residential leasing and pricing additionally fall under fair-" +
      "housing and tenant-protection law, so AI in pricing/screening must be " +
      "governed for disparate impact (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
