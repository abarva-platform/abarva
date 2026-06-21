// Consilium expert — Agriculture & Agribusiness Operations (industry-function).
//
// W3 industry-wave ExpertPack (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md).
// An industry expert for the PRIMARY production agriculture + ag-commodity value
// chain: crop & livestock production, precision agriculture, ag inputs (seed /
// crop-protection / fertilizer), grain origination, merchandising & commodity
// risk, processing, cold chain / perishables, farm-to-processor supply, and
// sustainability (regenerative, water, emissions / traceability). Product-aware
// across farm-management and agronomy / trading platforms (John Deere Operations
// Center, Climate FieldView, Bayer Cropwise, grain ERP/trading systems), not
// product-locked. DISTINCT from a branded-CPG maker (Consumer Products expert)
// and from generic freight (Logistics expert) — this is the field, the elevator,
// the crush, and the basis, not the brand or the truck.
//
// CORE DOCTRINE — honest bounding truths baked into the content:
// (1) WEATHER + COMMODITY PRICE VOLATILITY DOMINATE EVERYTHING. You manage risk,
//     yield, and basis — you do NOT control the flat price. Biological and
//     weather variability cap predictability, so model RANGES, not point
//     forecasts; a confident single-number yield or price call is a tell.
// (2) MARGINS ARE THIN AND CYCLICAL. Cost of production per bushel/ton and basis
//     capture decide the year; a few cents of input cost or a few cents of basis
//     swing the whole P&L. Value claims must survive a down-cycle, not just a
//     good year.
// (3) PRECISION-AG / DATA ROI IS REAL BUT FRAGMENTED — across equipment OEMs,
//     agronomy data silos, and in-field connectivity gaps. Value that assumes a
//     clean, unified, connected field signal that does not exist is not
//     realizable. Origination is a working-capital + basis-risk game, and
//     traceability/sustainability data from the farm is sparse and moving from
//     optional to buyer-mandated. Every value claim here is hedged against
//     weather/biological variability, price exogeneity, and farm-data sparsity.

import type {
  ExpertPack,
  ExpertPackIdentity,
} from "@/lib/intelligence/expert-pack/expert-pack";

// "agriculture" is in CANONICAL_INDUSTRIES, so the identity types cleanly with
// `satisfies` and no cast — the runtime value is verbatim what the router uses.
const identity = {
  id: "xp.agriculture.agribusiness-operations",
  expertName: "Agriculture & Agribusiness Operations Expert",
  kind: "industry-function",
  industry: "agriculture",
  functionKey: "agribusiness-operations",
  scopeNote:
    "The operating system of the primary-production agriculture and " +
    "ag-commodity value chain: crop and livestock production, precision " +
    "agriculture (variable-rate, telematics, agronomy/data), ag inputs (seed, " +
    "crop protection, fertilizer) demand and prescription, grain & oilseed " +
    "origination, merchandising and commodity / basis risk management, " +
    "first-stage processing (crush, mill, elevator, pack house), cold chain " +
    "and perishables handling, farm-to-processor supply, and farm-level " +
    "sustainability (regenerative practices, water-use efficiency, emissions " +
    "and traceability). Product-aware across farm-management, agronomy, and " +
    "grain-trading platforms (John Deere Operations Center, Climate FieldView, " +
    "Bayer Cropwise, Granular, grain ERP / merchandising / risk systems), not " +
    "product-locked. CORE DOCTRINE: weather and commodity-price volatility " +
    "dominate — you manage yield, risk, and basis, not the flat price; margins " +
    "are thin and cyclical so cost of production per unit and basis capture " +
    "decide the year; precision-ag data ROI is real but fragmented across OEMs, " +
    "agronomy silos, and field-connectivity gaps; origination is a " +
    "working-capital and basis-risk game; and traceability/sustainability data " +
    "from the farm is sparse but increasingly buyer-mandated. Biological and " +
    "weather variability cap predictability, so this expert models ranges, not " +
    "point forecasts. EXCLUDES branded-CPG demand/trade/RGM (Consumer Products " +
    "expert), generic freight network design (Logistics expert), and " +
    "downstream foodservice/retail merchandising — this expert owns the field, " +
    "the elevator, the first crush/process node, and the basis behind them.",
} satisfies ExpertPackIdentity;

export const agribusinessOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity,

  domain: {
    operatingMetrics: [
      {
        key: "yield_per_acre",
        name: "Yield per acre / hectare",
        definition:
          "Harvested crop output per unit of land (bushels, tons, or kg per " +
          "acre/hectare) for a crop and field, against the agronomic and " +
          "genetic potential for that geography and season.",
        unit: "bu (or t) / acre",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 100,
          basis:
            "Illustrative as a percentage of agronomic yield potential (a " +
            "70-100% realized-vs-potential band); absolute yield is crop-, " +
            "soil-, and weather-specific and varies enormously by geography",
          label: "planning-range",
        },
        dataSource:
          "Yield monitor / combine telemetry and farm-management system (John " +
          "Deere Operations Center, Climate FieldView), reconciled to scale " +
          "tickets at the elevator",
        whyItMatters:
          "The top line of production economics, but biologically and " +
          "weather-capped — most of the variance is exogenous. Closing the gap " +
          "to potential is where agronomy and precision-ag actually pay; " +
          "chasing yield past the weather ceiling destroys margin.",
      },
      {
        key: "input_cost_per_acre",
        name: "Input cost per acre",
        definition:
          "Total variable input spend per acre — seed, fertilizer, crop " +
          "protection, fuel, and applied custom services — for a crop and season.",
        unit: "USD / acre",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 350,
          high: 700,
          basis:
            "Illustrative row-crop variable-input band; highly crop-, " +
            "region-, and fertilizer-price dependent and cyclical with input " +
            "commodity markets — operator/extension planning data",
          label: "planning-range",
        },
        dataSource:
          "Farm accounting / ERP and agronomy prescriptions, joined to as-" +
          "applied records from variable-rate equipment",
        whyItMatters:
          "The largest controllable cost block and the lever precision-ag " +
          "targets via variable-rate placement. But fertilizer is itself a " +
          "volatile commodity, so a 'savings' claim must net out input-price " +
          "swings the grower does not control.",
      },
      {
        key: "cost_of_production_per_unit",
        name: "Cost of production per bushel / ton",
        definition:
          "Fully-loaded cost (variable inputs plus land, machinery, labor, and " +
          "overhead) divided by harvested output, expressed per bushel or ton — " +
          "the breakeven the season is judged against.",
        unit: "USD / bu (or t)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3.5,
          high: 5.5,
          basis:
            "Illustrative corn-equivalent fully-loaded cost-per-bushel band; " +
            "swings with yield (the denominator) and land cost — extension " +
            "and operator budgets, cyclical",
          label: "planning-range",
        },
        dataSource:
          "Farm financial system: total cost allocated to crop divided by " +
          "graded harvested output from scale tickets",
        whyItMatters:
          "The single number that decides whether a thin, cyclical year is " +
          "profitable. Because yield (the denominator) is weather-driven, " +
          "cost-per-unit is itself a range, not a point — and a small move in " +
          "it flips the whole P&L.",
      },
      {
        key: "basis_capture",
        name: "Basis capture / merchandising margin",
        definition:
          "Margin captured on origination and merchandising — the spread " +
          "between the cash price paid to the producer (local basis to the " +
          "futures board) and the realized sale, net of carry, handling, and " +
          "shrink.",
        unit: "USD / bu (or t)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.1,
          high: 0.6,
          basis:
            "Illustrative per-bushel handle/basis margin band for grain " +
            "origination and merchandising; widens in carry markets and " +
            "logistics squeezes, compresses in inverse markets — operator data",
          label: "planning-range",
        },
        dataSource:
          "Grain trading / merchandising system: cash purchases vs sales and " +
          "hedge positions, reconciled to futures/basis",
        whyItMatters:
          "Origination makes money on BASIS and carry, not on flat price — the " +
          "elevator/merchandiser is long the handle, not the market. Capturing " +
          "basis is a working-capital and logistics-timing game, and it is the " +
          "core merchandising P&L lever.",
      },
      {
        key: "grain_shrink_rate",
        name: "Grain shrink / spoilage rate",
        definition:
          "Quantity loss between intake and shipment — moisture shrink, " +
          "handling/dust loss, and spoilage/out-of-condition grain — as a " +
          "percentage of bushels handled.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 2.0,
          basis:
            "Illustrative elevator/storage shrink band; rises with high-" +
            "moisture intake, long storage, and aeration/condition issues — " +
            "operator and storage-management experience",
          label: "planning-range",
        },
        dataSource:
          "Elevator / grain-accounting system: intake vs shipped bushels by " +
          "bin, with moisture and grade adjustments",
        whyItMatters:
          "Shrink is a direct, recurring leak on already-thin handle margins " +
          "and a quality-risk signal. On a low-basis year, controlling shrink " +
          "and condition is the difference between a profitable and a losing " +
          "storage position.",
      },
      {
        key: "working_capital_days",
        name: "Working-capital days (inventory + receivables - payables)",
        definition:
          "Cash conversion cycle in days — grain/input inventory days plus " +
          "receivable days less payable days — measuring how long cash is tied " +
          "up in the origination and inputs book.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 90,
          basis:
            "Illustrative ag-origination/inputs cash-cycle band; swings " +
            "seasonally with harvest carry and input pre-buy — operator " +
            "treasury experience",
          label: "planning-range",
        },
        dataSource:
          "ERP / treasury: inventory, receivables, and payables aging across " +
          "grain and inputs books",
        whyItMatters:
          "Origination is a working-capital business — grain inventory and " +
          "grower receivables consume cash that funds the next position. In a " +
          "thin-margin, high-volume game, days tied up is a real financing " +
          "cost that often exceeds the trading margin.",
      },
      {
        key: "hedge_coverage_pct",
        name: "Commodity price hedge coverage %",
        definition:
          "Share of priced/owned physical commodity position (and forward " +
          "input cost where hedged) covered by offsetting futures/options " +
          "positions, against policy limits.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 70,
          high: 100,
          basis:
            "Illustrative hedge-coverage band against a risk policy; the right " +
            "level is policy- and view-dependent, not a maximize-it metric — " +
            "risk-management practice",
          label: "planning-range",
        },
        dataSource:
          "Trading / risk system: physical long/short position vs futures and " +
          "options hedge positions, marked to market against limits",
        whyItMatters:
          "Flat price is exogenous and brutal — the discipline is to hedge the " +
          "price you cannot control and trade the basis you can. Under- or " +
          "over-hedging against policy is where unmanaged price risk silently " +
          "enters a thin-margin book; in-range to policy is the honest target.",
      },
      {
        key: "on_time_delivery_to_processor",
        name: "On-time delivery to processor",
        definition:
          "Share of contracted loads delivered to the processor/end buyer on " +
          "the agreed date and grade specification, against the delivery " +
          "schedule.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 92,
          high: 99,
          basis:
            "Illustrative contract-delivery reliability band; below ~95% risks " +
            "demurrage, rejected loads, and relationship/contract penalties — " +
            "operator experience",
          label: "planning-range",
        },
        dataSource:
          "Merchandising / logistics system: contracted vs actual delivery " +
          "dates and grade acceptance by load and contract",
        whyItMatters:
          "Farm-to-processor supply runs on contracts with delivery windows " +
          "and grade specs; missing them triggers demurrage, rejection, and " +
          "lost basis. Reliability protects the buyer relationship that the " +
          "next origination season depends on.",
      },
      {
        key: "perishable_waste_pct",
        name: "Perishable waste / spoilage %",
        definition:
          "Share of perishable product (produce, fresh protein, dairy) lost " +
          "to spoilage, cold-chain breaks, or grade-out between harvest/intake " +
          "and shipment.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 15,
          basis:
            "Illustrative perishable shrink band; highly commodity-specific — " +
            "leafy greens and soft fruit far higher than hardy crops; cold-" +
            "chain and harvest-timing dependent — operator experience",
          label: "planning-range",
        },
        dataSource:
          "Pack-house / cold-chain system: intake vs shipped/graded volume " +
          "with temperature-excursion and reject reason codes",
        whyItMatters:
          "For perishables, waste is the dominant margin leak and a biological " +
          "clock that no software repeals — cold chain and harvest-to-pack " +
          "timing cap it. Cutting it a few points materially moves a thin, " +
          "spoilage-exposed P&L.",
      },
      {
        key: "traceability_coverage_pct",
        name: "Traceability coverage %",
        definition:
          "Share of volume that can be traced to its farm/field of origin with " +
          "the practice and input records buyers require (one-up/one-down or " +
          "field-level lineage).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis:
            "Illustrative farm-origin traceability coverage band; rising fast " +
            "under buyer and regulatory mandates but gated by sparse farm-level " +
            "data — operator and program experience",
          label: "planning-range",
        },
        dataSource:
          "Origination + farm-data systems: share of intake with verifiable " +
          "field-of-origin and practice/input records",
        whyItMatters:
          "Traceability is moving from optional to buyer-mandated (deforestation, " +
          "food-safety, sustainability claims), but the data lives on the farm " +
          "and is sparse. Coverage gates access to premium and contracted " +
          "channels and is a leading constraint on sustainability programs.",
      },
      {
        key: "water_use_efficiency",
        name: "Water-use efficiency",
        definition:
          "Crop output produced per unit of water applied (yield per acre-inch " +
          "or per cubic meter of irrigation), measuring how productively scarce " +
          "water is converted to output.",
        unit: "bu (or t) / acre-inch",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 4,
          high: 8,
          basis:
            "Illustrative irrigated-crop water-productivity band; crop-, soil-, " +
            "and climate-specific and highly variable — extension/irrigation " +
            "planning data",
          label: "planning-range",
        },
        dataSource:
          "Irrigation/telemetry and yield-monitor data: applied water vs " +
          "harvested output by field and zone",
        whyItMatters:
          "In water-stressed geographies water is the binding constraint and a " +
          "rising regulatory/cost exposure. Efficiency is where variable-rate " +
          "irrigation and soil-moisture sensing pay, but the gain is capped by " +
          "weather and water-right limits, not chosen freely.",
      },
      {
        key: "sustainability_enrolled_acres_pct",
        name: "Sustainability-program enrolled acres %",
        definition:
          "Share of supplying acres enrolled in a verified sustainability / " +
          "regenerative program (cover crop, reduced-till, nutrient-management, " +
          "carbon, or buyer scheme) with measurement-and-verification in place.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 40,
          basis:
            "Illustrative enrolled-acre band; rising under buyer schemes and " +
            "carbon/ESG programs but gated by grower economics and M&V cost — " +
            "program and operator experience",
          label: "planning-range",
        },
        dataSource:
          "Sustainability-program / origination system: enrolled acres with " +
          "verified practice and outcome (MRV) records",
        whyItMatters:
          "Buyer-mandated sustainability is reshaping which acres can supply " +
          "which channels, but enrollment hinges on grower economics and on " +
          "credible measurement that farm data rarely supports yet. It is a " +
          "leading indicator of mandated-channel access, not a vanity figure.",
      },
    ],

    painThemes: [
      {
        key: "price_weather_exogeneity",
        name: "Price & weather exogeneity (planning point forecasts on chaos)",
        description:
          "The two largest drivers of the result — flat commodity price and " +
          "weather — are exogenous and high-variance, yet plans, budgets, and " +
          "vendor ROI cases are built on single-point yield and price " +
          "assumptions, so the operation is repeatedly surprised and over- or " +
          "under-committed against a range it pretended was a number.",
        detectionSignal:
          "Budgets and value cases stated as point yields/prices, no scenario " +
          "or probability band, hedge and input decisions made on a single " +
          "forecast, repeated large variance-to-plan blamed on 'the weather'.",
        diagnosticQuestion:
          "Do you plan yield, price, and margin as probability ranges with " +
          "scenarios and hedge/contract triggers, or as single-point forecasts " +
          "that the weather and the board then blow up?",
      },
      {
        key: "thin_cyclical_margin_blindness",
        name: "Thin, cyclical margins managed without unit-cost discipline",
        description:
          "Margins are thin and swing with the commodity cycle, but the " +
          "operation tracks gross revenue and yield rather than fully-loaded " +
          "cost of production per bushel/ton against a breakeven, so it cannot " +
          "tell a good-price year from genuine cost competitiveness and gets " +
          "caught when the cycle turns down.",
        detectionSignal:
          "No fully-loaded cost-per-unit by crop/field, land and overhead not " +
          "allocated, decisions framed on yield or topline, profitability " +
          "swings with price rather than tracked to cost discipline.",
        diagnosticQuestion:
          "What is your fully-loaded cost of production per bushel/ton by " +
          "crop, and how does it sit against breakeven through a down-cycle — " +
          "not just in a good-price year?",
      },
      {
        key: "fragmented_precision_ag_data",
        name: "Fragmented precision-ag data (OEM silos + connectivity gaps)",
        description:
          "Agronomy, machine, soil, imagery, and as-applied data sit in " +
          "incompatible OEM and agronomy-vendor silos, and in-field " +
          "connectivity is patchy, so the unified field signal that " +
          "variable-rate and analytics ROI assume does not actually exist — " +
          "data is collected but not joined or trusted.",
        detectionSignal:
          "Data split across John Deere / Climate / Cropwise with no common " +
          "field/boundary ID, manual re-keying of prescriptions, as-applied " +
          "not reconciled to plan, dead zones where data never syncs.",
        diagnosticQuestion:
          "Can you join agronomy, machine, soil, imagery, and as-applied data " +
          "to a common field boundary and trust it — or is precision-ag value " +
          "stranded in OEM/agronomy silos and connectivity gaps?",
      },
      {
        key: "basis_workingcapital_squeeze",
        name: "Basis & working-capital squeeze in origination",
        description:
          "Origination profit lives in basis and carry, not flat price, but " +
          "the book is managed on volume and flat-price view rather than basis " +
          "position and cash-cycle days, so working capital gets trapped in " +
          "inventory and grower receivables and basis opportunities are missed " +
          "or mis-hedged.",
        detectionSignal:
          "Trading discussed in flat-price terms not basis, hedge coverage " +
          "drifting from policy, large grain inventory and grower-receivable " +
          "days, carry not captured when the market pays to store.",
        diagnosticQuestion:
          "Is your merchandising book managed on basis and carry with hedge " +
          "coverage to policy and a working-capital-days target — or on flat " +
          "price and volume, with cash trapped in inventory and receivables?",
      },
      {
        key: "perishable_coldchain_clock",
        name: "Perishable / cold-chain biological clock",
        description:
          "Perishable product runs against a biological spoilage clock that no " +
          "optimization repeals, yet harvest timing, cold-chain integrity, and " +
          "grade-out are managed reactively, so waste, rejections, and quality " +
          "downgrades quietly consume a thin, time-critical margin.",
        detectionSignal:
          "High and variable spoilage/grade-out, temperature excursions not " +
          "tracked to lots, harvest-to-pack timing unmanaged, rejections at " +
          "the buyer dock surfacing late.",
        diagnosticQuestion:
          "Do you manage harvest timing and cold-chain integrity to the " +
          "perishability clock with lot-level temperature and grade tracking, " +
          "or discover spoilage and rejections after the margin is already lost?",
      },
      {
        key: "traceability_sustainability_data_gap",
        name: "Traceability & sustainability data gap (buyer-mandated, farm-sparse)",
        description:
          "Buyers and regulators increasingly mandate field-of-origin " +
          "traceability and verified sustainability practice, but the data " +
          "originates on the farm where it is sparse, inconsistent, and costly " +
          "to capture, so the operation cannot prove claims and risks losing " +
          "access to premium and contracted channels.",
        detectionSignal:
          "Low traceability coverage, manual/affidavit-based practice records, " +
          "no field-level MRV, buyers requesting evidence the operation cannot " +
          "produce, premium channels gated on unmet data requirements.",
        diagnosticQuestion:
          "What share of your volume can you trace to field of origin with " +
          "verifiable practice records — and can you meet buyer/regulatory " +
          "traceability and sustainability mandates with the farm data you " +
          "actually have?",
      },
      {
        key: "input_prescription_disconnect",
        name: "Input prescription / as-applied disconnect",
        description:
          "Agronomic prescriptions (seed rate, nutrient, crop-protection) are " +
          "generated but not reliably executed or reconciled against as-applied " +
          "machine records, so the operation pays for variable-rate value it " +
          "never realizes and cannot attribute yield or cost outcomes back to " +
          "the agronomy decision.",
        detectionSignal:
          "Prescriptions not matched to as-applied logs, flat-rate fallback in " +
          "the field, no plan-vs-actual on inputs, yield response to agronomy " +
          "not measured, input cost unexplained by prescription.",
        diagnosticQuestion:
          "Are your agronomic prescriptions reconciled to as-applied records so " +
          "you can prove the variable-rate input value — or is the prescription " +
          "a plan that the field never actually executes or measures?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "yield_agronomy_prediction",
        name: "Yield & agronomy prediction (range-based, weather-bounded)",
        valueMechanism:
          "Fuse soil, imagery, weather, machine, and as-applied data to model " +
          "yield potential and agronomic response by zone — guiding variable-" +
          "rate seed, nutrient, and crop-protection placement toward the gap " +
          "to potential while honestly bounding the forecast as a weather-" +
          "conditioned range, so inputs go where they pay and not past the " +
          "biological ceiling.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Multi-season yield-monitor, soil, and as-applied records joined to a common field boundary",
          "Satellite/drone imagery and in-season weather/soil-moisture signal",
          "Agronomy prescriptions and input/genetics catalog",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Yield is weather- and biology-capped — present a scenario range, " +
            "never a point forecast, and let the agronomist own the call",
          "Models trained on fragmented OEM/agronomy data inherit the silo and " +
            "connectivity gaps; flag where the field signal is missing rather " +
            "than imputing it",
        ],
        metricsMoved: [
          "yield_per_acre",
          "input_cost_per_acre",
          "cost_of_production_per_unit",
        ],
      },
      {
        key: "variable_rate_input_optimization",
        name: "Variable-rate input optimization & prescription reconciliation",
        valueMechanism:
          "Generate zone-level seed, nutrient, and crop-protection " +
          "prescriptions and reconcile them against as-applied machine records " +
          "— placing inputs where the agronomic response justifies them, " +
          "cutting blanket over-application, and proving plan-vs-actual so the " +
          "variable-rate value is realized and attributable, net of volatile " +
          "input-commodity prices.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Soil tests, zone/management-area maps, and yield-response history",
          "Variable-rate-capable equipment with as-applied logging",
          "Input cost and product label/agronomic constraints",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Label rates, agronomic safety, and environmental limits constrain " +
            "the prescription — the agronomist of record signs it, not the model",
          "Savings claims must net out input-commodity price swings the grower " +
            "does not control, or a price-driven cost rise reads as a model failure",
        ],
        metricsMoved: [
          "input_cost_per_acre",
          "cost_of_production_per_unit",
          "yield_per_acre",
          "water_use_efficiency",
        ],
      },
      {
        key: "basis_hedge_decision_support",
        name: "Basis & hedge decision support (price-risk + working capital)",
        valueMechanism:
          "Track basis, carry, and physical position against the futures " +
          "board and risk policy to surface when to buy/sell basis, capture " +
          "carry, and adjust hedge coverage — keeping the book hedged on the " +
          "exogenous flat price while trading the basis it can influence, and " +
          "flagging where working capital is trapped in inventory and " +
          "receivables.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Physical purchase/sale and inventory positions from the merchandising system",
          "Futures, options, and local-basis market data with policy limits",
          "Carry economics (storage, financing, logistics) and receivable/payable aging",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Flat price is exogenous — decision support hedges and trades basis; " +
            "it must never be framed as predicting price direction",
          "Hedge actions are bounded by the risk policy and limits; the " +
            "merchandising/risk manager holds the position, not the model",
        ],
        metricsMoved: [
          "basis_capture",
          "hedge_coverage_pct",
          "working_capital_days",
        ],
      },
      {
        key: "perishable_quality_coldchain",
        name: "Perishable quality grading & cold-chain monitoring",
        valueMechanism:
          "Use image-based grading and lot-level cold-chain telemetry to " +
          "predict shelf-life and spoilage risk, prioritize first-out routing " +
          "of at-risk lots, and catch temperature excursions before grade-out " +
          "— converting the biological perishability clock into earlier, " +
          "cheaper interventions that cut waste and buyer rejections.",
        adoptionProfile: "early",
        dataDependencies: [
          "Lot-level temperature/cold-chain telemetry and intake timing",
          "Image/sensor grading data with quality and reject reason codes",
          "Buyer grade specs and delivery schedules",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Spoilage is a biological floor no software repeals — value is in " +
            "earlier intervention, not eliminating perishability; size it honestly",
          "Grading/quality calls affecting food safety stay with the QA lead; " +
            "the model triages, it does not certify",
        ],
        metricsMoved: [
          "perishable_waste_pct",
          "on_time_delivery_to_processor",
          "grain_shrink_rate",
        ],
      },
      {
        key: "traceability_sustainability_mrv",
        name: "Traceability & sustainability measurement/verification (MRV)",
        valueMechanism:
          "Assemble field-of-origin lineage and practice/input evidence from " +
          "farm, machine, and remote-sensing data to populate traceability and " +
          "sustainability MRV — proving the claims buyers and regulators now " +
          "mandate, unlocking premium and contracted channels, and lowering the " +
          "cost of verification on sparse farm data.",
        adoptionProfile: "early",
        dataDependencies: [
          "Field boundaries, origination/intake lineage, and grower practice records",
          "Remote-sensing (cover crop, tillage, land-use) and as-applied input data",
          "Buyer/regulatory program rules and MRV protocols",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Sustainability/traceability claims carry greenwashing and compliance " +
            "liability — model-derived evidence enters a review queue and a " +
            "human certifies before any buyer/regulator claim is made",
          "Farm data is sparse and self-reported; flag inferred vs verified " +
            "practice rather than asserting coverage the records do not support",
        ],
        metricsMoved: [
          "traceability_coverage_pct",
          "sustainability_enrolled_acres_pct",
          "water_use_efficiency",
        ],
      },
      {
        key: "irrigation_water_optimization",
        name: "Irrigation & water-use optimization",
        valueMechanism:
          "Combine soil-moisture sensing, weather, and crop-stage models to " +
          "schedule variable-rate irrigation to where and when water actually " +
          "lifts yield — raising water productivity in water-stressed, " +
          "regulated geographies and reducing applied water and energy without " +
          "sacrificing the yield the weather allows.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Soil-moisture and in-field weather telemetry by zone",
          "Crop-stage / evapotranspiration models and yield-response history",
          "Water-right limits, allocation, and pumping/energy cost",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Water rights, allocation limits, and regulatory caps bound the " +
            "schedule — recommendations operate inside those limits, the water " +
            "manager owns compliance",
          "Yield response to water is weather-conditioned; present efficiency " +
            "gains as ranges, not guaranteed savings",
        ],
        metricsMoved: [
          "water_use_efficiency",
          "yield_per_acre",
          "input_cost_per_acre",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_field_data_foundation",
        name: "Unified field-data foundation (boundary-keyed agronomy lake)",
        description:
          "A governed data platform that ingests machine/OEM, agronomy, soil, " +
          "imagery, weather, and as-applied data and joins it to common field " +
          "boundaries and a grower/field master — the trusted field signal that " +
          "yield prediction, variable-rate, irrigation, and MRV all draw from, " +
          "bridging the OEM and connectivity silos.",
        boundary:
          "Owns data ingestion, field-boundary master, and governance; does " +
          "not make the agronomic or trading decision — it is the dependency " +
          "the decision tools rely on. Gates the trustworthiness of everything " +
          "downstream and cannot manufacture data the field never captured.",
        humanAccountabilityPoint: "Head of Agronomy Data / Chief Data Officer",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "agronomy_decision_platform",
        name: "Agronomy decision & prescription platform",
        description:
          "A precision-agriculture platform that turns the unified field signal " +
          "into zone-level seed/nutrient/crop-protection and irrigation " +
          "prescriptions, pushes them to variable-rate equipment, and " +
          "reconciles as-applied results — closing the loop from agronomy plan " +
          "to executed, measured outcome.",
        boundary:
          "Owns prescription generation and plan-vs-actual reconciliation; does " +
          "not override the agronomist of record or the label/agronomic-safety " +
          "constraints, and depends on the field-data foundation for trustworthy " +
          "inputs.",
        humanAccountabilityPoint: "Lead Agronomist / VP Agronomy",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "merchandising_risk_platform",
        name: "Grain merchandising & commodity-risk platform",
        description:
          "An origination, merchandising, and risk platform that manages cash " +
          "purchases/sales, basis and carry, hedge coverage against policy, and " +
          "the working-capital position across the grain book — managing the " +
          "operation as a basis-and-carry business hedged on exogenous flat " +
          "price.",
        boundary:
          "Owns position, basis/hedge tracking, and settlement; does not take " +
          "the market view or set risk policy — it executes and surfaces " +
          "against the policy and limits the risk committee sets. Depends on " +
          "clean futures/basis and physical-position data.",
        humanAccountabilityPoint: "Director of Merchandising / Head of Commodity Risk",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "traceability_sustainability_ledger",
        name: "Traceability & sustainability MRV ledger",
        description:
          "A lineage-and-verification layer that links field-of-origin, " +
          "practice, and input evidence to lots through origination and " +
          "processing, supporting buyer/regulatory traceability and " +
          "sustainability claims with a measurement-reporting-verification " +
          "trail and a human certification gate.",
        boundary:
          "Owns lineage capture, MRV assembly, and the review/certification " +
          "workflow; does not make sustainability claims autonomously — a human " +
          "certifies before any buyer/regulator assertion. Depends on sparse, " +
          "improving farm-level data and cannot certify beyond what is verified.",
        humanAccountabilityPoint: "Head of Sustainability / Quality & Compliance Lead",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Agribusiness value concentrates on production cost-per-unit, basis/" +
        "merchandising margin, and waste/shrink — never on flat commodity price, " +
        "which is exogenous and must be hedged, not forecast. The biggest, most " +
        "defensible prizes are (1) input efficiency via variable-rate placement " +
        "(real, but capped by the weather ceiling and confounded by volatile " +
        "input-commodity prices), (2) basis capture and working-capital " +
        "efficiency in origination (a basis-and-carry game, not a price call), " +
        "and (3) waste/shrink reduction in storage and perishables (bounded by " +
        "a biological clock that no software repeals). Sustainability/" +
        "traceability is moving from optional to buyer-mandated, so its value is " +
        "increasingly about channel ACCESS, not just premium. Every forward " +
        "value claim must be discounted for weather and biological variability " +
        "(yield is a range), price exogeneity (you do not control the top line), " +
        "and farm-data sparsity and OEM/connectivity fragmentation (the unified " +
        "field signal value assumes often does not exist). On thin, cyclical " +
        "margins, value is modeled as a range that survives a down-year — never " +
        "as a clean single number from a good-price season.",
      dominantHaircutFactors: [
        {
          factor: "Weather & biological variability (yield is a range)",
          rationale:
            "Yield and quality are weather- and biology-capped and high-" +
            "variance; agronomy value only closes the gap to a moving potential " +
            "and a bad season removes it, so forward value must be discounted to " +
            "a weather-conditioned range, never a point.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed share of modeled agronomy/yield value not realized in " +
              "adverse-weather seasons relative to a favorable-season model",
            label: "planning-range",
          },
        },
        {
          factor: "Commodity-price exogeneity & cyclicality",
          rationale:
            "Flat price and volatile input commodities set the top and a large " +
            "part of the cost line and are not controllable; value framed in a " +
            "good-price year evaporates when the cycle turns, so it must be " +
            "discounted to hold through a down-cycle.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Implementation experience where price/input-cycle moves swamped " +
              "modeled efficiency gains in down years",
            label: "planning-range",
          },
        },
        {
          factor: "Farm-data sparsity & OEM/connectivity fragmentation",
          rationale:
            "Precision-ag and MRV value assume a joined, trusted field signal; " +
            "where data is siloed across OEMs, sparse at the farm, or stranded " +
            "by connectivity gaps, the modeled value cannot be realized.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed throttling of precision-ag/MRV value where field data " +
              "could not be joined, trusted, or captured at the farm",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption & grower-economics ceiling",
          rationale:
            "Practice change, variable-rate execution, and sustainability " +
            "enrollment hinge on grower economics and behavior across a " +
            "fragmented supplier base; without grower buy-in and reliable " +
            "as-applied execution, prescriptions and programs stall.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Share of modeled agronomy/sustainability value lost to slow " +
              "grower adoption and incomplete field execution",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Input-cost reduction from variable-rate placement",
          range: {
            low: 0.03,
            high: 0.12,
            basis:
              "Reported relative variable-input reduction at equal-or-better " +
              "yield from zone-based placement, after the weather and " +
              "input-price haircuts",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in input_cost_per_acre at held yield",
        },
        {
          lever: "Basis / merchandising margin capture",
          range: {
            low: 0.02,
            high: 0.1,
            basis:
              "Incremental handle/basis margin from disciplined basis-and-carry " +
              "merchandising and hedge-to-policy execution, per unit handled",
            label: "planning-range",
          },
          measuredAs:
            "Incremental USD/bu basis_capture net of carry and shrink",
        },
        {
          lever: "Shrink & perishable-waste reduction",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Relative reduction in storage shrink / perishable spoilage from " +
              "condition monitoring and first-out routing, bounded by the " +
              "biological floor",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in grain_shrink_rate / perishable_waste_pct",
        },
        {
          lever: "Working-capital release in origination",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Relative reduction in cash-conversion days from tighter " +
              "inventory and receivable management on the grain/inputs book",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in working_capital_days",
        },
      ],
      timeToValueBand:
        "Variable-rate input optimization: 1-2 seasons once field data is " +
        "joined and equipment logs as-applied. Yield/agronomy prediction and " +
        "irrigation optimization: 2-3 seasons to calibrate against local " +
        "weather and soils. Basis/hedge decision support: 2-4 quarters once the " +
        "merchandising and position data are clean. Perishable quality / cold " +
        "chain: 2-4 quarters. Traceability & sustainability MRV: 2-4 seasons, " +
        "gated on farm-data capture and buyer-program rules. Realization is " +
        "season-paced and weather-gated — a single good or bad year is not " +
        "proof; value is read across cycles, not from one harvest.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Farm-management & machine-data platform",
          role:
            "System of record for field boundaries, agronomic operations, " +
            "yield-monitor, and as-applied machine data.",
          examples: [
            "John Deere Operations Center",
            "Climate FieldView (Bayer)",
            "Trimble Ag / PTx",
            "Granular (Corteva)",
          ],
        },
        {
          name: "Agronomy / precision-ag decision platform",
          role:
            "Generates soil/zone-based prescriptions and agronomic " +
            "recommendations and pushes them to variable-rate equipment.",
          examples: [
            "Bayer Cropwise",
            "Corteva Granular Insights",
            "Sentera / Taranis (imagery agronomy)",
          ],
        },
        {
          name: "Grain ERP / merchandising & commodity-risk system",
          role:
            "Manages origination, cash contracts, inventory, basis/carry, " +
            "hedge positions, and grain accounting.",
          examples: [
            "AGRIS / Cultura (Greenstone)",
            "Bushel / Levridge",
            "CXT Software / merchandising & risk (CTRM) systems",
          ],
        },
        {
          name: "Cold-chain / pack-house & quality system",
          role:
            "Tracks perishable intake, grading, lot-level temperature/cold-" +
            "chain, and reject/quality reason codes.",
          examples: [
            "Pack-house management / produce traceability systems",
            "Cold-chain IoT telemetry platforms",
            "QA / food-safety (HACCP) systems",
          ],
        },
        {
          name: "Sustainability / traceability MRV platform",
          role:
            "Captures field-of-origin lineage, practice/input evidence, and " +
            "measurement-reporting-verification for buyer/regulatory claims.",
          examples: [
            "Regrow / Truterra (regenerative MRV)",
            "carbon and sustainability program platforms",
            "remote-sensing land-use / deforestation monitoring",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Operating Officer / VP Operations (Ag)",
          accountability:
            "End-to-end production and origination operations, asset " +
            "utilization, and the operating P&L across the value chain.",
        },
        {
          title: "Lead Agronomist / VP Agronomy",
          accountability:
            "Agronomic prescriptions, input/genetics decisions, yield " +
            "outcomes, and the agronomic-safety/label compliance of record.",
        },
        {
          title: "Director of Merchandising / Head of Commodity Risk",
          accountability:
            "Origination, basis and carry capture, hedge coverage to policy, " +
            "and the commodity-risk position and limits.",
        },
        {
          title: "VP Supply / Processing & Quality",
          accountability:
            "Farm-to-processor delivery reliability, processing/cold-chain " +
            "throughput, shrink/waste, and grade/quality acceptance.",
        },
        {
          title: "Head of Sustainability & Traceability",
          accountability:
            "Traceability coverage, sustainability-program enrollment, MRV " +
            "integrity, and certification of buyer/regulatory claims.",
        },
      ],
      regulatoryFrames: [
        {
          name: "USDA programs & grading standards",
          relevance:
            "Crop programs, grading and inspection standards, and reporting " +
            "shape eligibility, grade-based pricing, and origination practice.",
        },
        {
          name: "EPA / FIFRA pesticide regulation",
          relevance:
            "Crop-protection registration, label rates, and application/record " +
            "rules bound what agronomy prescriptions and variable-rate inputs " +
            "may do.",
        },
        {
          name: "FSMA / food-safety regulation",
          relevance:
            "Produce-safety and preventive-controls rules govern perishable " +
            "handling, traceability, and the cold chain from farm to processor.",
        },
        {
          name: "CFTC commodity-hedging & position rules",
          relevance:
            "Futures/options hedging, position limits, and reporting govern " +
            "how commodity price risk is managed and disclosed.",
        },
        {
          name: "Traceability & sustainability mandates (deforestation/EUDR, EPR, disclosure)",
          relevance:
            "Buyer and regulatory traceability and sustainability mandates " +
            "increasingly gate channel access and require verifiable field-" +
            "level evidence.",
        },
      ],
      canonicalTerms: [
        {
          term: "Basis",
          definition:
            "The difference between the local cash price and the futures " +
            "board price for a commodity; the spread an originator/merchandiser " +
            "trades and captures rather than the flat price.",
        },
        {
          term: "Carry",
          definition:
            "The market's payment for storing grain over time (futures " +
            "spread less storage and financing cost); a positive carry rewards " +
            "holding inventory.",
        },
        {
          term: "Variable-rate application (VRA) / prescription",
          definition:
            "Applying seed, nutrient, or crop protection at rates that vary by " +
            "management zone according to an agronomic prescription, rather " +
            "than a single blanket rate.",
        },
        {
          term: "As-applied",
          definition:
            "The machine-logged record of what was actually applied in the " +
            "field, reconciled against the prescription to prove and measure " +
            "execution.",
        },
        {
          term: "Shrink",
          definition:
            "Quantity loss in handling and storage — from moisture, dust/" +
            "handling, and out-of-condition or spoiled product — netted from " +
            "bushels/units handled.",
        },
        {
          term: "MRV (measurement, reporting, verification)",
          definition:
            "The evidence trail that substantiates sustainability and " +
            "traceability claims (practices, inputs, outcomes) to a buyer or " +
            "regulatory standard.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Yield response to an agronomy/precision-ag decision",
        authoritativeSource:
          "Multi-season yield-monitor data joined to as-applied records and " +
          "agronomic treatment, ideally with check strips or replicated trials",
        whatGoodEvidenceLooksLike:
          "Yield difference attributable to the treatment across zones and " +
          "multiple seasons with weather context and a control/check strip, " +
          "presented as a range — not a single favorable-field result.",
        weakEvidenceToReject:
          "A single field or single good-weather season presented as proof of " +
          "a yield gain, with no control and no multi-season weather context.",
      },
      {
        claim: "Input-cost saving from variable-rate placement",
        authoritativeSource:
          "Prescription vs as-applied records and input invoices, with input " +
          "commodity prices netted out of the comparison",
        whatGoodEvidenceLooksLike:
          "Reduction in applied input per acre at held-or-better yield, " +
          "reconciled plan-to-as-applied, with fertilizer/chemistry price " +
          "movement separated from the placement effect.",
        weakEvidenceToReject:
          "A lower input-spend total that is actually driven by a fall in " +
          "fertilizer/chemistry prices, claimed as a variable-rate saving.",
      },
      {
        claim: "Basis / merchandising margin captured",
        authoritativeSource:
          "Merchandising-system cash purchase/sale and hedge positions " +
          "reconciled to futures and local basis, net of carry, handling, and " +
          "shrink",
        whatGoodEvidenceLooksLike:
          "Realized basis-and-carry margin per unit handled with the hedge " +
          "position shown, separating basis/handle margin from flat-price " +
          "movement.",
        weakEvidenceToReject:
          "A flat-price trading gain or a favorable price move presented as " +
          "merchandising margin, with no basis decomposition or hedge context.",
      },
      {
        claim: "Shrink / perishable-waste reduction",
        authoritativeSource:
          "Intake-vs-shipped reconciliation by bin/lot with moisture/grade and " +
          "temperature-excursion records",
        whatGoodEvidenceLooksLike:
          "Measured reduction in shrink or spoilage by lot against a baseline, " +
          "with condition/temperature data tying the change to the " +
          "intervention.",
        weakEvidenceToReject:
          "An aggregate shrink figure with no lot-level reconciliation, or a " +
          "good year credited to a program with no baseline.",
      },
      {
        claim: "Traceability / sustainability coverage and claims",
        authoritativeSource:
          "Field-of-origin lineage and verified practice/input MRV records to " +
          "the buyer/regulatory program standard, with a human certification",
        whatGoodEvidenceLooksLike:
          "Share of volume with verifiable field-of-origin and practice " +
          "evidence meeting the program's MRV protocol, flagging inferred vs " +
          "verified, and certified before any external claim.",
        weakEvidenceToReject:
          "Self-reported affidavits or modeled/inferred practice presented as " +
          "verified coverage, or a sustainability claim with no MRV trail or " +
          "certification.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Do you plan yield, price, and margin as probability ranges with scenarios and hedge/contract triggers, or as single-point forecasts that the weather then blows up?",
      "What is your fully-loaded cost of production per bushel/ton by crop, and how does it sit against breakeven through a down-cycle — not just in a good-price year?",
      "Can you join agronomy, machine, soil, imagery, and as-applied data to a common field boundary and trust it, or is precision-ag value stranded in OEM/agronomy silos and connectivity gaps?",
      "Is your merchandising book managed on basis and carry with hedge coverage to policy and a working-capital-days target, or on flat price and volume with cash trapped in inventory and receivables?",
      "Do you manage harvest timing and cold-chain integrity to the perishability clock with lot-level temperature and grade tracking, or discover spoilage and rejections after the margin is lost?",
      "What share of your volume can you trace to field of origin with verifiable practice records, and can you meet buyer/regulatory traceability and sustainability mandates with the farm data you actually have?",
      "Are your agronomic prescriptions reconciled to as-applied records so you can prove and measure the variable-rate input value, or is the prescription a plan the field never executes?",
    ],
    maturitySignals: [
      "Yield, price, and margin are planned as scenario ranges with hedge and contract triggers, and decisions name the weather/price assumption explicitly.",
      "Fully-loaded cost of production per unit is tracked by crop/field against breakeven, and the book is judged on cost competitiveness, not the price year.",
      "Field data from machines, agronomy, soil, and imagery is joined to common boundaries and trusted, with prescriptions reconciled to as-applied.",
      "Origination is run on basis and carry with hedge coverage to policy and a working-capital-days target, and perishables/storage are managed to lot-level condition.",
    ],
    redFlags: [
      "Yield, price, and margin are planned as single-point forecasts with no scenario range or hedge/contract triggers, and variance is blamed on the weather after the fact.",
      "There is no fully-loaded cost of production per unit, so a good-price year is mistaken for cost competitiveness and the operation is exposed when the cycle turns.",
      "Precision-ag and MRV value is assumed on a unified field signal that does not exist — data is siloed across OEMs/agronomy vendors with connectivity gaps and unreconciled as-applied.",
      "The merchandising book is run on flat-price view and volume rather than basis, carry, and hedge-to-policy, with working capital trapped in inventory and grower receivables.",
      "Traceability/sustainability claims are made on self-reported or inferred farm data with no MRV trail or human certification, risking greenwashing and lost channel access.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Equipment OEM data platforms (John Deere, Climate/Bayer, Trimble)",
        category: "Farm-management / machine-data / precision-ag",
        switchingCost:
          "High — the OEM platform is tied to the equipment fleet and accretes years of field-boundary, machine, and as-applied history; data portability across OEMs is limited, which is itself the fragmentation problem.",
        renewalDynamics:
          "Bundled with equipment and connectivity subscriptions; agronomy/data modules increasingly upsold — negotiate data-export and field-boundary portability rights at renewal.",
      },
      {
        vendorName: "Agronomy / precision-ag decision vendors (Cropwise, Granular, imagery agronomy)",
        category: "Agronomy decision / prescription / imagery",
        switchingCost:
          "Moderate-to-high — embedded in the agronomic workflow with zone maps and prescription history; replaceable but accretes agronomist trust and calibrated zones.",
        renewalDynamics:
          "Per-acre subscription pricing; leverage proven yield-response and input-saving evidence and demand prescription/zone-map portability.",
      },
      {
        vendorName: "Grain ERP / merchandising & CTRM vendors (Greenstone, Bushel, Levridge)",
        category: "Grain ERP / merchandising / commodity-risk",
        switchingCost:
          "High — holds origination, contracts, inventory, grain accounting, and hedge positions and is fused to settlement; re-implementation disrupts the trade book mid-season.",
        renewalDynamics:
          "Module/subscription pricing; favor outcome terms tied to working-capital and basis-capture improvement and protect position/contract data portability.",
      },
      {
        vendorName: "Sustainability / traceability MRV vendors (Regrow, Truterra, program platforms)",
        category: "Sustainability / traceability / MRV",
        switchingCost:
          "Moderate — newer layer, more replaceable, but lineage history and buyer-program certification create growing stickiness as mandates harden.",
        renewalDynamics:
          "Program- and acre-based pricing often co-funded by buyers/CPG partners; negotiate data ownership, multi-buyer reuse of MRV, and protocol portability.",
      },
    ],
    switchingCosts:
      "The grain ERP/merchandising core and the OEM machine-data platform are " +
      "the hardest to move — the ERP because it holds positions, contracts, and " +
      "settlement, and the OEM because data binds to the fleet and does not " +
      "port cleanly across vendors (the fragmentation that strands precision-ag " +
      "value). The negotiable frontier is the agronomy-decision and MRV layer, " +
      "where switching cost is moderate and the real lock-in is calibrated " +
      "zones, prescription history, and lineage records. Protect field-boundary, " +
      "as-applied, position, and MRV data portability to keep that frontier " +
      "open — and recognize that the dominant constraint is weather and price, " +
      "not vendor lock-in.",
    negotiationLevers: [
      "Field-boundary, as-applied, prescription, and position data portability and ownership rights to break OEM/ERP lock-in",
      "Outcome pricing tied to measured input-cost, basis-capture, or working-capital improvement — net of the weather and price-cycle haircuts",
      "Buyer/CPG co-funding of sustainability-program and MRV cost, with multi-buyer reuse of one MRV record",
      "Per-acre and per-bushel pricing scope negotiation, with pilot-to-scale gating on proven season-over-season agronomic and basis results",
      "Connectivity and edge-sync terms (in-field data capture) negotiated alongside the platform, since stranded data kills the value case",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      yield_claim: [
        "multi-season yield-monitor data joined to as-applied records",
        "weather context and a control/check strip or replicated trial",
        "presented as a range, not a point forecast",
      ],
      input_cost_claim: [
        "prescription vs as-applied reconciliation",
        "input invoices with input-commodity price movement netted out",
        "yield held or improved alongside the cost change",
      ],
      basis_merchandising_claim: [
        "cash purchase/sale and hedge positions reconciled to futures and local basis",
        "carry, handling, and shrink netted out",
        "basis/handle margin separated from flat-price movement",
      ],
      shrink_waste_claim: [
        "intake-vs-shipped reconciliation by bin/lot",
        "moisture/grade and temperature-excursion records",
        "baseline to measure the reduction against",
      ],
      traceability_sustainability_claim: [
        "field-of-origin lineage and verified practice/input MRV records",
        "inferred-vs-verified flagged explicitly",
        "human certification before any external claim",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (weather/biological variability, price exogeneity, farm-data sparsity, adoption)",
      ],
    },
    citationStandard:
      "Quantitative claims cite the farm-management / agronomy / merchandising / " +
      "MRV source and the season or period, and state the field/lot grain — never " +
      "a single favorable field or good-price year presented as the norm. Yield " +
      "and agronomy claims cite multi-season data with weather context and a " +
      "control, presented as a range. Merchandising claims cite the basis and " +
      "hedge decomposition, separating basis/carry from flat price. " +
      "Sustainability/traceability claims cite the MRV trail, flag inferred vs " +
      "verified, and require certification. Value projections cite a baseline, a " +
      "labelled planning range, and the haircut factors applied (weather/" +
      "biological variability, price exogeneity, farm-data sparsity, adoption) — " +
      "never a single asserted ROI or savings number.",
  },

  hedgeRules: {
    whenToHedge: [
      "A yield, price, or margin number is quoted as a point — reframe it as a weather/price-conditioned range with scenarios, since biological and weather variability cap predictability.",
      "Agronomy or input-saving value is cited from one field or one good-weather season — caveat that it needs multi-season, control-backed evidence before it generalizes.",
      "Precision-ag or MRV value assumes a unified, connected field signal — flag that OEM/agronomy fragmentation and connectivity gaps may make the data unavailable or untrusted.",
      "Merchandising value is framed on flat price — restate it as basis-and-carry margin, since the originator does not control or forecast the flat price.",
      "A sustainability/traceability claim rests on self-reported or inferred farm data — flag inferred vs verified and that certification is required before any external assertion.",
      "Vendor-reported agronomic or basis outcomes are cited — mark as vendor claims pending season-over-season, field-level validation.",
    ],
    inferenceLanguage: [
      "Across operations of this crop and geography, yield typically realizes... of agronomic potential in an average-weather year, but the season's weather sets the actual range...",
      "Without your multi-season, control-backed data, the industry pattern suggests variable-rate placement reduces input cost by roughly... before the weather and input-price haircuts...",
      "Because flat price is exogenous, treat this as a basis-and-carry planning range, not a price-direction call...",
      "Peer originators commonly run working-capital cycles in the... range; on a thin-margin book that financing cost often rivals the trading margin...",
      "Farm-level traceability data is typically sparse at this maturity, so treat the coverage figure as a verified-vs-inferred range rather than a settled number...",
    ],
    flagWithoutEvidence: [
      "A specific point yield, flat-price, or margin forecast for this tenant",
      "This tenant's actual cost of production, basis capture, shrink, or traceability coverage",
      "A modeled agronomy/input saving claimed as realizable without multi-season, control-backed evidence",
      "A merchandising gain claimed from flat-price movement rather than basis and carry",
      "A sustainability or traceability claim with no MRV trail, no inferred-vs-verified flag, and no certification",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "cost of production per bushel/ton vs breakeven and price scenarios",
      exhibitKind: "chart",
      chartKind: "range-bar",
      note: "Show fully-loaded cost of production per unit as a range across yield/price scenarios against breakeven and the planning range, making the cyclical, range-not-point reality explicit.",
    },
    {
      questionPattern:
        "input-cost / agronomy value bridge — where the per-acre dollar moves",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      note: "Bridge from baseline input cost per acre to variable-rate placement and agronomy uplift to net realized value, showing the weather, input-price, and adoption haircuts.",
    },
    {
      questionPattern:
        "basis / merchandising margin decomposition — flat price vs basis vs carry",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Decompose the realized merchandising result into flat-price (hedged), basis, carry, handling, and shrink to show that the handle margin lives in basis and carry, not flat price.",
    },
    {
      questionPattern: "yield, shrink, fill-rate, or traceability trend across seasons",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend yield vs potential, grain shrink/perishable waste, on-time delivery, or traceability coverage across seasons against planning ranges to show direction net of weather noise.",
    },
    {
      questionPattern: "agribusiness operations KPI scorecard",
      exhibitKind: "table",
      note: "Yield per acre, input cost per acre, cost per unit, basis capture, shrink rate, working-capital days, hedge coverage, on-time delivery, perishable waste, traceability coverage, water-use efficiency, and enrolled acres vs planning ranges and peers.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Field, machine, agronomy, soil, and imagery data are joined to common boundaries and trusted, with prescriptions reconciled to as-applied so value is provable",
      "The operation plans in ranges and scenarios — yield, price, and margin — and hedges the exogenous flat price while trading the basis it can influence",
      "Cost of production per unit is tracked against breakeven through the cycle, so investments are judged on durable cost competitiveness, not a good-price year",
      "Growers and operators adopt the practice and execution change, and sustainability/MRV is co-funded by buyers as channel access, not a standalone cost",
    ],
    failureDrivers: [
      "Plans and ROI cases are built on point yields/prices, so a normal bad-weather or down-price season is treated as a program failure and the value case collapses",
      "Precision-ag value is promised on a unified field signal that OEM silos and connectivity gaps never deliver, stranding the data the model needs",
      "Merchandising is run on flat-price view rather than basis, carry, and hedge discipline, so working capital and price risk quietly erode a thin book",
      "Sustainability/traceability is pursued on sparse, self-reported farm data with no MRV or certification, exposing greenwashing risk and losing mandated channels",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Variable-rate input optimization adopts first where equipment already " +
      "logs as-applied and the input-cost pain is acute. Yield/agronomy " +
      "prediction and irrigation follow as multi-season data calibrates. " +
      "Basis/hedge decision support adopts where the merchandising book is data-" +
      "mature. Perishable quality and cold-chain scale with pack-house workflow " +
      "change. Traceability/sustainability MRV is last and buyer-driven, gated " +
      "on farm-data capture and program economics. Adoption hinges on grower " +
      "trust, field-data connectivity, and accepting the weather/price reality — " +
      "and it is season-paced, so scaling takes years, not quarters.",
    roiClarity: "medium",
    roiClarityBasis:
      "Agribusiness ROI is only moderately firm because the prizes — input " +
      "efficiency, basis capture, shrink/waste, working capital — are real and " +
      "measurable, but three factors blur them: weather and biological " +
      "variability (yield is a range and a bad season removes the gain), " +
      "commodity-price exogeneity and cyclicality (a good-price year flatters " +
      "the case), and farm-data sparsity and OEM/connectivity fragmentation " +
      "(the unified signal value assumes often is not there). On thin, cyclical " +
      "margins ROI must be quoted as a range that survives a down-cycle with " +
      "explicit weather, price, and data-readiness haircuts — never as a clean " +
      "modeled number from one harvest.",
  },

  regulatoryFrame: {
    name: "Agricultural production, food-safety, commodity-hedging & sustainability law",
    relevance:
      "The dominant regulatory frame for the agribusiness operation: USDA " +
      "programs and grading standards, EPA/FIFRA pesticide registration and " +
      "application/record rules that bound agronomy and variable-rate inputs, " +
      "FSMA food-safety and produce-traceability rules governing perishable " +
      "handling and the cold chain, CFTC commodity-hedging position and " +
      "reporting rules for price-risk management, and rising traceability and " +
      "sustainability mandates (deforestation/EUDR, EPR, ESG disclosure) that " +
      "increasingly gate channel access and require verifiable field-level " +
      "evidence (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
