// Consilium expert — Corporate Real Estate & Workplace (cross-cutting).
//
// W3 backlog-wave (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-industry ExpertPack v2 with no industry×function key. It owns the
// corporate real estate (CRE) and workplace question every large enterprise now
// lives with after hybrid work: "do we know how much of our office portfolio is
// actually used, are we paying long-dated leases for capacity we stranded, are
// our buildings run reactively when condition-based would be cheaper, and is the
// workplace one people want to come to — or just cost we can't get out of?"
//
// CORE DOCTRINE — THE LEASE-VS-UTILIZATION MISMATCH IS THE DOMINANT COST STORY,
// AND THE HONEST EXPERT REFUSES FOUR COMFORTABLE STORIES. (1) HYBRID WORK HAS
// STRANDED 20-40% OF OFFICE CAPACITY: actual desk/space utilization sits far
// below the leased and built footprint, so the single biggest cost lever is
// right-sizing the portfolio to real demand — but the prize is gated on
// utilization data the firm usually does not trust. (2) RIGHT-SIZING RUNS ON
// GUESSWORK BECAUSE UTILIZATION DATA IS FRAGMENTED AND PRIVACY-SENSITIVE: badge,
// sensor, Wi-Fi, and booking signals are partial, inconsistent, and collected
// under employee-privacy and works-council constraints, so most "we'll cut X%"
// claims rest on an unrepresentative sample — the data-quality and consent
// posture is the binding constraint, not the analysis. (3) LEASE OBLIGATIONS ARE
// LONG-DATED, ILLIQUID, AND HIGH-STAKES: you cannot exit a 10-year lease on a
// quarter's notice, so decisions hinge on lease-event timing (breaks, renewals,
// expiries) and the value is realized at those events, not on demand — a
// right-sizing thesis with no lease-event runway is a slide, not a saving. (4)
// FACILITIES IS RUN REACTIVELY (BREAK-FIX) WHEN CONDITION-BASED IS CHEAPER: most
// FM spend is reactive maintenance and flat-rate soft services, while planned and
// condition-based maintenance and demand-based service lower lifecycle cost — but
// the shift requires asset and condition data the CMMS usually lacks. ESG/energy
// retrofit (deep-energy retrofit, electrification, building EUI reduction) is a
// real and growing lever but is CAPITAL-GATED and slow, and the honest expert
// hands the carbon-accounting and assurance depth to the ESG & Sustainability
// expert while owning the building/energy-efficiency and retrofit-economics
// slice. DISTINCT from the ESG & Sustainability expert (which owns the enterprise
// carbon footprint, decarbonization roadmap, and assured disclosure — this expert
// consumes building energy as a CRE cost-and-retrofit lever and hands the
// footprint up) and from the Field & Facility Service Operations expert (which
// owns the dispatch/technician/work-order EXECUTION engine and SLA performance —
// this expert owns the CRE PORTFOLIO and FM STRATEGY/SOURCING decisions and
// consumes that execution layer as the maintenance delivery surface, not its
// owner). Value is therefore sized on the lease-vs-utilization mismatch, gated on
// utilization-data quality and lease-event runway, weighted to portfolio right-
// sizing and FM efficiency, and haircut for the long-dated illiquidity and the
// stranded-cost drag — never on a headline "cut X% of real estate" with no
// utilization evidence or lease-event runway behind it.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const realEstateWorkplaceExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.real-estate-workplace",
    expertName: "Corporate Real Estate & Workplace Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "real-estate-workplace",
    scopeNote:
      "Cross-cutting, cross-industry corporate real estate (CRE) and workplace " +
      "of the enterprise: portfolio and lease management (the owned/leased " +
      "footprint, lease administration, lease-event timing and accounting); " +
      "space utilization and the hybrid-work footprint (occupancy, desk/space " +
      "use, right-sizing); facilities management (planned vs reactive " +
      "maintenance, energy, and soft services); workplace experience and " +
      "employee satisfaction with the space; capital projects and fit-out; " +
      "location strategy; and occupancy planning. DOCTRINE: hybrid work has " +
      "stranded 20-40% of office capacity, so the lease-vs-utilization mismatch " +
      "is the dominant cost story; utilization data (badge/sensor/Wi-Fi/booking) " +
      "is fragmented and privacy-sensitive, so most right-sizing runs on " +
      "guesswork and data quality is the binding constraint; lease obligations " +
      "are long-dated and illiquid, so decisions are slow, high-stakes, and " +
      "gated on lease-event runway; facilities is run reactively (break-fix) " +
      "when condition-based is cheaper; and ESG/energy retrofit is real but " +
      "capital-gated. DISTINCT from the ESG & Sustainability expert (owns the " +
      "carbon footprint, decarbonization roadmap, and assured disclosure; this " +
      "expert consumes building energy as a CRE cost/retrofit lever and hands " +
      "the footprint up) and from the Field & Facility Service Operations expert " +
      "(owns the dispatch/work-order EXECUTION and SLA engine; this expert owns " +
      "the CRE portfolio and FM strategy/sourcing decisions and consumes that " +
      "execution layer as the maintenance delivery surface). Excludes property-" +
      "development/investment-management depth (a REIT/landlord discipline) and " +
      "deep capital-construction engineering those specialist domains own.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "space_utilization_rate",
        name: "Space / desk utilization rate",
        definition:
          "Average share of available desks or usable space actually occupied " +
          "during working hours over a representative period — the inverse of " +
          "idle, paid-for capacity, measured from badge, sensor, Wi-Fi, and " +
          "booking signals.",
        unit: "% of available capacity occupied",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 35,
          high: 70,
          basis:
            "Post-hybrid peak-day office utilization commonly sits in the 40-60% " +
            "band with average-day far lower; 'too low' means stranded capacity " +
            "and 'too high' (sustained 85%+) means crowding and no flex — so the " +
            "good zone is a calibrated range, not a maximum, and depends on the " +
            "sensing method's coverage",
          label: "planning-range",
        },
        dataSource:
          "Utilization sensing — badge/access logs, occupancy sensors, Wi-Fi " +
          "device counts, and room/desk booking systems — normalized to usable " +
          "capacity from the space-management (IWMS/CAFM) system",
        whyItMatters:
          "THE headline mismatch metric — it is the evidence that gates the " +
          "biggest cost lever (portfolio right-sizing). But it is only as good as " +
          "the sensing coverage and consent posture behind it; a number from one " +
          "partial source on an unrepresentative week is guesswork dressed as a " +
          "fact, so it is always read with its data-quality basis.",
      },
      {
        key: "cost_per_seat",
        name: "Fully-loaded cost per seat / desk",
        definition:
          "Total occupancy cost (rent, operating expense, FM, energy, " +
          "amortized fit-out) divided by the number of usable seats/desks — the " +
          "unit economics of the workplace, comparable across a portfolio.",
        unit: "USD per seat per year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 8000,
          high: 25000,
          basis:
            "Fully-loaded cost per seat varies widely by market (gateway-city " +
            "CBD vs secondary), density, and fit-out grade; the meaningful read " +
            "is the trend and the cross-site comparison within the portfolio, not " +
            "a cross-market absolute",
          label: "planning-range",
        },
        dataSource:
          "Lease administration and FM cost from the IWMS joined to usable-seat " +
          "counts from the space-management system",
        whyItMatters:
          "The unit-economics lens that normalizes occupancy cost for size and " +
          "exposes the expensive, under-used sites — but it must be read together " +
          "with utilization: a low cost-per-seat on a half-empty floor is still " +
          "waste, and the real target is cost per OCCUPIED seat.",
      },
      {
        key: "occupancy_density",
        name: "Occupancy density (sq ft per person)",
        definition:
          "Usable area divided by the assigned or peak-present headcount — the " +
          "spatial-efficiency measure that, post-hybrid, is read against actual " +
          "presence rather than assigned seats.",
        unit: "usable sq ft per person",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 100,
          high: 250,
          basis:
            "Densification pushed assigned density toward 100-150 sq ft/person " +
            "pre-hybrid; effective density against actual presence is now far " +
            "higher (more space per present person), and too-dense designs hurt " +
            "experience — so the good zone is a calibrated range balancing cost " +
            "and experience, not a minimum",
          label: "planning-range",
        },
        dataSource:
          "Space-management (IWMS/CAFM) usable-area and occupancy data joined to " +
          "HR headcount and presence signals",
        whyItMatters:
          "The design-efficiency metric that translates a right-sizing thesis " +
          "into a floorplate — but assigned-seat density badly overstates " +
          "efficiency when only a fraction of people are present, so it is read " +
          "against measured presence and balanced against workplace experience, " +
          "not driven to a crowding maximum.",
      },
      {
        key: "lease_cost_per_sqft",
        name: "Lease cost per square foot",
        definition:
          "Annualized base rent plus recoverable operating cost per leased " +
          "square foot, net of incentives — the core real-estate price signal " +
          "for benchmarking sites and timing lease events.",
        unit: "USD per sq ft per year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 120,
          basis:
            "Effective rent per sq ft spans an enormous range by market and " +
            "grade (secondary-market suburban vs gateway-CBD trophy); read " +
            "against the local market clearing rate and the lease vintage, not as " +
            "a cross-portfolio absolute",
          label: "planning-range",
        },
        dataSource:
          "Lease administration / lease-accounting system (the lease abstracts, " +
          "rent schedules, and recoveries) benchmarked to market data",
        whyItMatters:
          "The price lens that flags over-market leases ripe for renegotiation, " +
          "relocation, or surrender at the next event — but a per-sq-ft rate is " +
          "only actionable alongside the lease-event runway (you cannot act on an " +
          "over-market lease with eight years left and no break).",
      },
      {
        key: "portfolio_vacancy_stranded_pct",
        name: "Portfolio vacancy / stranded space %",
        definition:
          "Share of the leased/owned portfolio that is vacant, dark, or " +
          "structurally under-used (chronically below a utilization floor) — the " +
          "stranded-capacity measure created largely by the hybrid demand shift.",
        unit: "% of portfolio sq ft",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 40,
          basis:
            "Post-hybrid stranded/under-used office capacity commonly runs " +
            "20-40% of the footprint where the portfolio was sized for full " +
            "in-office presence; a low figure signals either a well-right-sized " +
            "estate or, more often, that under-use isn't measured",
          label: "planning-range",
        },
        dataSource:
          "Space-management occupancy data and lease administration, combining " +
          "outright vacancy with chronic-under-utilization flags from sensing",
        whyItMatters:
          "The size of the prize — stranded space IS the lease-vs-utilization " +
          "mismatch made concrete. But the cost of it is locked in by long-dated " +
          "leases, so the metric must be paired with lease-event timing to know " +
          "how much of the stranded cost is actually recoverable and when.",
      },
      {
        key: "facilities_cost_per_sqft",
        name: "Facilities (FM) cost per square foot",
        definition:
          "Total facilities-management operating cost (maintenance, energy, and " +
          "soft services — cleaning, security, catering, reception) per " +
          "occupied/usable square foot — the run-cost of operating the estate.",
        unit: "USD per sq ft per year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 6,
          high: 25,
          basis:
            "FM cost per sq ft varies by building grade, service scope, and " +
            "market labor cost; the meaningful read is the cross-site trend and " +
            "the planned-vs-reactive and demand-based-service mix behind it, not " +
            "an absolute",
          label: "planning-range",
        },
        dataSource:
          "FM and CMMS spend (hard-service maintenance, energy, and soft-service " +
          "contracts) per square foot from the IWMS/CAFM and FM contracts",
        whyItMatters:
          "The operating-efficiency lens on the estate — but a low FM cost per " +
          "sq ft can hide deferred maintenance and a reactive break-fix posture " +
          "that costs more over the asset lifecycle, so it is read with the " +
          "planned-vs-reactive ratio and asset-condition, not alone.",
      },
      {
        key: "work_order_first_time_fix",
        name: "Work-order first-time-fix rate",
        definition:
          "Share of maintenance work orders resolved on the first visit without " +
          "a return trip, repeat call, or escalation — the FM-execution-quality " +
          "and efficiency signal.",
        unit: "% of work orders",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "FM first-time-fix benchmarks; well-run, parts-and-data-equipped " +
            "operations reach 80-90%, reactive operations with poor asset data " +
            "and stock-outs sit lower with costly repeat visits",
          label: "planning-range",
        },
        dataSource:
          "CMMS / work-order management system: completion, return-visit, and " +
          "repeat-call tracking by asset and trade",
        whyItMatters:
          "The execution-efficiency tell — low first-time-fix means repeat " +
          "visits, longer downtime, and higher cost per fault. It is consumed " +
          "from the field/facility-service execution layer; this expert reads it " +
          "to judge whether the FM operating model and sourcing are working, not " +
          "to run the dispatch.",
      },
      {
        key: "planned_reactive_maintenance_ratio",
        name: "Planned vs reactive maintenance ratio",
        definition:
          "Share of maintenance effort/cost that is planned, preventive, or " +
          "condition-based versus reactive break-fix — the FM-maturity measure " +
          "that drives lifecycle cost and asset reliability.",
        unit: "% planned of total maintenance",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "FM maturity benchmarks; leading operations run 70-85% planned/" +
            "condition-based, reactive-dominated estates sit well below 50% and " +
            "pay the break-fix premium — direction matters more than the absolute " +
            "point",
          label: "planning-range",
        },
        dataSource:
          "CMMS work-order classification (planned/preventive/condition-based vs " +
          "reactive) and asset-condition data",
        whyItMatters:
          "The honest FM-cost-trajectory metric — a reactive estate looks cheap " +
          "until assets fail, then pays in emergency callouts, downtime, and " +
          "premature replacement. Shifting the mix to planned and condition-based " +
          "lowers lifecycle cost, but requires asset and condition data the CMMS " +
          "often lacks.",
      },
      {
        key: "energy_use_intensity",
        name: "Energy use intensity (EUI)",
        definition:
          "Annual building energy consumption per square foot of floor area " +
          "(e.g. kBtu or kWh per sq ft per year) — the building-efficiency and " +
          "energy-cost measure that also drives Scope 1+2 emissions.",
        unit: "kWh (or kBtu) per sq ft per year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 150,
          basis:
            "Building EUI varies by climate, use-type, and vintage (an efficient " +
            "modern office vs an old, poorly-controlled building differ several-" +
            "fold); read against building type, climate zone, and a retrofit " +
            "baseline, not a single cross-portfolio number",
          label: "planning-range",
        },
        dataSource:
          "Building-management-system (BMS) and utility-meter data per building " +
          "normalized to floor area, joined to the space inventory",
        whyItMatters:
          "The building-efficiency lever that is also a cost AND emissions win — " +
          "EUI reduction cuts energy opex and Scope 1+2 together, which is the " +
          "honest cost-positive slice of the ESG retrofit story. This expert owns " +
          "the building-energy and retrofit economics and hands the enterprise " +
          "carbon footprint up to the ESG expert.",
      },
      {
        key: "workplace_experience_satisfaction",
        name: "Workplace experience / satisfaction score",
        definition:
          "Employee-reported satisfaction with the physical workplace " +
          "(amenities, comfort, ability to do focused and collaborative work, " +
          "ease of finding space) — the experience counterweight to pure cost " +
          "reduction.",
        unit: "index / score (e.g. 0-100 or NPS-style)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "Workplace-experience scores vary by instrument and scale; the " +
            "meaningful read is the trend through a change (a densification or " +
            "consolidation that craters experience defeats the purpose) and the " +
            "link to attendance, not a cross-firm absolute",
          label: "planning-range",
        },
        dataSource:
          "Workplace-experience surveys and pulse tools, ideally joined to " +
          "attendance/utilization and amenity-booking data",
        whyItMatters:
          "The honest constraint on cost-cutting — the post-hybrid office has to " +
          "earn the commute, so a right-sizing that strands people in a crowded, " +
          "unpleasant space loses the attendance it was trying to support. " +
          "Experience and utilization are read together; cost reduction that " +
          "tanks experience is not a win.",
      },
      {
        key: "capital_project_on_time_on_budget",
        name: "Capital project / fit-out on-time, on-budget %",
        definition:
          "Share of capital projects and fit-outs delivered within the approved " +
          "schedule and budget tolerance — the delivery-reliability measure for " +
          "the build/fit-out program.",
        unit: "% of projects within tolerance",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Construction/fit-out delivery benchmarks; well-governed programs " +
            "land 75-85% within tolerance, weakly-governed ones routinely overrun " +
            "on cost and schedule given scope change and supply-chain volatility",
          label: "planning-range",
        },
        dataSource:
          "Capital-project / project-management system: approved baseline vs " +
          "actual cost and schedule, with change-order tracking",
        whyItMatters:
          "The execution-credibility metric for the capital plan — fit-out and " +
          "consolidation projects ARE how a right-sizing thesis is realized, so " +
          "chronic overruns erode the very savings case that justified them. " +
          "Cost-to-achieve overrun nets directly against portfolio savings.",
      },
      {
        key: "lease_event_lead_time",
        name: "Lease-event (renewal / break) decision lead-time",
        definition:
          "Average time before a lease event (renewal, break option, or expiry) " +
          "at which the hold/renegotiate/relocate/surrender decision is made and " +
          "actioned — the governance measure for capturing real-estate value at " +
          "the only moments it is available.",
        unit: "months of lead-time before the event",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 6,
          high: 24,
          basis:
            "Effective lease-event governance starts the decision 12-24 months " +
            "ahead to allow market search, negotiation, fit-out, and relocation; " +
            "reactive estates decide inside 6 months and lose leverage, default " +
            "to costly holdover, or miss break windows entirely",
          label: "planning-range",
        },
        dataSource:
          "Lease administration / lease-accounting system: the critical-date " +
          "calendar (breaks, renewals, expiries) and the decision/action log " +
          "against it",
        whyItMatters:
          "THE timing metric that makes the whole portfolio thesis actionable — " +
          "because leases are long-dated and illiquid, value is captured only at " +
          "events, and a missed break or a late decision means another full lease " +
          "term of stranded cost. Short lead-time is why right-sizing analyses " +
          "die on the shelf.",
      },
    ],

    painThemes: [
      {
        key: "lease_utilization_mismatch",
        name: "Lease-vs-utilization mismatch — paying for stranded capacity",
        description:
          "The portfolio was sized for full in-office presence, but hybrid work " +
          "dropped actual utilization 20-40% below the leased footprint — so the " +
          "firm pays long-dated rent and operating cost on space that is " +
          "structurally empty, and the single biggest cost lever (right-sizing) " +
          "is locked behind lease terms it cannot exit on demand.",
        detectionSignal:
          "Utilization sitting far below leased capacity, high portfolio " +
          "vacancy/stranded %, occupancy planned on assigned seats not measured " +
          "presence, rent paid on floors that are chronically empty, no link " +
          "between the demand shift and the lease portfolio.",
        diagnosticQuestion:
          "How far below your leased and built capacity does actual utilization " +
          "run, and how much of that stranded cost can you actually recover given " +
          "your lease-event runway?",
      },
      {
        key: "utilization_data_guesswork",
        name: "Right-sizing runs on fragmented, privacy-constrained guesswork",
        description:
          "Utilization is inferred from partial, inconsistent badge, sensor, " +
          "Wi-Fi, and booking signals collected under employee-privacy and " +
          "works-council constraints — so the data behind a multi-million-dollar " +
          "consolidation decision is an unrepresentative sample, and 'we'll cut " +
          "X%' rests on a number no one fully trusts.",
        detectionSignal:
          "One partial sensing source extrapolated to the whole estate, no " +
          "documented sensing coverage or representativeness, privacy/consent " +
          "posture unaddressed, utilization figures that swing with the sampling " +
          "method, decisions justified by a single peak-week snapshot.",
        diagnosticQuestion:
          "What is your utilization actually measured from, how representative " +
          "and privacy-compliant is that sensing, and would the data survive " +
          "scrutiny as the basis for a portfolio decision?",
      },
      {
        key: "lease_illiquidity_slow_decisions",
        name: "Long-dated, illiquid leases make decisions slow and high-stakes",
        description:
          "Leases are multi-year, illiquid obligations that can only be acted on " +
          "at breaks, renewals, and expiries — so a right-sizing thesis with no " +
          "near-term lease-event runway is unactionable, critical dates get " +
          "missed, and the estate defaults into costly holdover or auto-renewal " +
          "rather than a governed decision.",
        detectionSignal:
          "Missed break options, last-minute renewal scrambles, short lease-" +
          "event decision lead-time, no critical-date calendar driving the " +
          "occupancy plan, consolidation plans with no lease-event sequencing, " +
          "holdover/auto-renewal as the default outcome.",
        diagnosticQuestion:
          "What does your lease-event calendar look like over the next 24-36 " +
          "months, and is your occupancy plan sequenced to those breaks and " +
          "expiries — or is it a slide with no runway to act?",
      },
      {
        key: "reactive_break_fix_facilities",
        name: "Facilities run reactively when condition-based is cheaper",
        description:
          "FM is dominated by reactive break-fix maintenance and flat-rate soft " +
          "services billed to a static footprint, while planned, condition-based " +
          "maintenance and demand-based services would lower lifecycle cost — but " +
          "the shift is blocked by missing asset registers, condition data, and " +
          "utilization-linked service triggers.",
        detectionSignal:
          "Low planned-vs-reactive ratio, low first-time-fix, emergency callouts " +
          "and asset failures, soft-service contracts priced on full occupancy " +
          "while the building is half-empty, no asset-condition data in the CMMS, " +
          "deferred-maintenance backlog growing.",
        diagnosticQuestion:
          "What share of your maintenance is planned/condition-based versus " +
          "reactive break-fix, and are your soft-service contracts still priced " +
          "for full occupancy you no longer have?",
      },
      {
        key: "experience_vs_cost_tension",
        name: "Cost-cutting that craters the workplace and loses attendance",
        description:
          "Consolidation and densification are run as pure cost exercises with " +
          "no experience counterweight — so the resulting workplace is crowded, " +
          "hard to book, and unpleasant, the post-hybrid office fails to 'earn " +
          "the commute', attendance falls further, and the firm strands MORE " +
          "capacity, defeating the saving it chased.",
        detectionSignal:
          "Falling workplace-experience scores through a consolidation, " +
          "complaints about finding space and booking rooms, attendance " +
          "declining after densification, no experience metric in the business " +
          "case, cost reduction with no link to whether people show up.",
        diagnosticQuestion:
          "When you densify or consolidate, do you track workplace experience " +
          "and attendance alongside cost — or are you cutting space in a way that " +
          "drives the very absence that strands more of it?",
      },
      {
        key: "fragmented_cre_no_single_source",
        name: "Fragmented CRE data with no single source of portfolio truth",
        description:
          "Lease administration, space management, utilization sensing, the " +
          "CMMS, energy/BMS, and the capital-project system run in separate tools " +
          "with different building identifiers and area definitions — so no one " +
          "can produce one reconciled view of cost, utilization, lease events, " +
          "and condition per building, and every portfolio decision is assembled " +
          "by hand.",
        detectionSignal:
          "Different sq-ft figures in different systems, building IDs that don't " +
          "reconcile, utilization disconnected from lease and cost data, a " +
          "portfolio review stitched together from spreadsheets each cycle, no " +
          "IWMS or a half-populated one.",
        diagnosticQuestion:
          "Can you produce one reconciled, current view of cost, utilization, " +
          "lease events, and condition for every building on one area definition " +
          "— or is each portfolio decision hand-assembled from disconnected " +
          "systems?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_utilization_intelligence",
        name: "AI occupancy / utilization intelligence & right-sizing",
        valueMechanism:
          "Fuse fragmented badge, sensor, Wi-Fi, and booking signals into a " +
          "privacy-respecting, representativeness-aware utilization model, detect " +
          "chronically under-used space, and quantify the right-sizing " +
          "opportunity against the lease portfolio — turning guesswork into a " +
          "defensible, evidence-based view of how much capacity is stranded and " +
          "where. HONEST BOUND: AI fusion improves the estimate but cannot " +
          "manufacture coverage the sensing doesn't have or consent the firm " +
          "hasn't secured — it accelerates the read, it does not fix the data-" +
          "quality or privacy gap.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Badge/access logs, occupancy sensors, Wi-Fi device counts, and room/desk booking data",
          "Space-management (IWMS/CAFM) usable-area and seat inventory to normalize against",
          "Employee-privacy/consent and works-council constraints governing the sensing data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Sensing coverage and representativeness must be stated — extrapolating one partial source to the whole estate is the core data-quality risk",
          "Occupancy data is employee-privacy- and works-council-sensitive; aggregation, consent, and anonymization posture must be explicit, not assumed",
          "A utilization read is an input to a right-sizing decision, not the decision — a human owns the consolidation call against lease and experience constraints",
        ],
        metricsMoved: [
          "space_utilization_rate",
          "portfolio_vacancy_stranded_pct",
          "occupancy_density",
        ],
      },
      {
        key: "portfolio_lease_optimization",
        name: "Portfolio & lease-event optimization",
        valueMechanism:
          "Model the lease portfolio against measured demand and the critical-" +
          "date calendar (breaks, renewals, expiries), and optimize the hold/" +
          "renegotiate/relocate/consolidate/surrender sequence to capture the " +
          "stranded-capacity saving at the lease events where it is actually " +
          "available — converting a right-sizing thesis into a runway-sequenced, " +
          "actionable portfolio plan rather than a slide with no exit path.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Lease abstracts, rent schedules, and the critical-date (break/renewal/expiry) calendar",
          "Measured utilization/demand and the cost-per-seat and lease-cost-per-sqft economics",
          "Market rent and availability data to evaluate relocate/renegotiate options",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Portfolio moves are large, long-dated, and hard to reverse — they require executive approval, not algorithmic action",
          "Demand forecasts are planning ranges; sequencing must be stress-tested against attendance and growth uncertainty before committing to surrenders",
          "Lease-accounting (ASC 842 / IFRS 16) consequences of modifications must be evaluated with finance, not just the cash saving",
        ],
        metricsMoved: [
          "lease_cost_per_sqft",
          "lease_event_lead_time",
          "portfolio_vacancy_stranded_pct",
        ],
      },
      {
        key: "predictive_condition_based_fm",
        name: "Predictive & condition-based facilities maintenance",
        valueMechanism:
          "Apply analytics to BMS, IoT, and asset-condition data to predict " +
          "failures and shift maintenance from reactive break-fix to planned and " +
          "condition-based, while right-sizing soft-service delivery to measured " +
          "occupancy — lowering FM lifecycle cost, raising first-time-fix and " +
          "asset reliability, and cutting the break-fix premium and the cost of " +
          "servicing space no one is using.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Asset register, CMMS work-order history, and asset-condition data",
          "BMS/IoT sensor telemetry on equipment health and building systems",
          "Occupancy/utilization data to drive demand-based soft-service delivery",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Condition-based maintenance depends on asset and condition data the CMMS often lacks — confidence is capped by data completeness",
          "Predictions inform scheduling; safety-critical and compliance maintenance (life-safety, lifts, fire) keep their mandated cadence regardless",
          "Demand-based soft-service changes must respect contractual minimums and health/cleaning standards, not just occupancy",
        ],
        metricsMoved: [
          "planned_reactive_maintenance_ratio",
          "work_order_first_time_fix",
          "facilities_cost_per_sqft",
        ],
      },
      {
        key: "energy_retrofit_optimization",
        name: "AI building-energy optimization & retrofit prioritization",
        valueMechanism:
          "Use BMS telemetry and analytics to optimize building energy (HVAC " +
          "scheduling to real occupancy, fault detection, load control) and to " +
          "prioritize the capital-gated retrofit pipeline by EUI reduction, cost, " +
          "and payback — capturing the genuinely cost-positive slice of " +
          "decarbonization (energy opex and Scope 1+2 fall together) and sizing " +
          "deep-retrofit bets honestly against their capital and payback rather " +
          "than as free carbon.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "BMS/utility-meter energy telemetry per building normalized to floor area (EUI)",
          "Occupancy/utilization data to align HVAC and lighting to real presence",
          "Retrofit-option cost, EUI-reduction potential, and payback data, plus the capital plan",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Energy savings are sized on metered baseline-vs-actual consumption, not modeled assumptions, to keep the business case honest",
          "Optimization must respect comfort, indoor-air-quality, and safety constraints — efficiency cannot override occupant health",
          "Deep retrofits are capital-gated and slow; the enterprise carbon footprint and assured disclosure are handed to the ESG expert, not owned here",
        ],
        metricsMoved: [
          "energy_use_intensity",
          "facilities_cost_per_sqft",
          "workplace_experience_satisfaction",
        ],
      },
      {
        key: "workplace_experience_copilot",
        name: "Workplace experience & smart-booking copilot",
        valueMechanism:
          "Ground assistants and booking tools on real-time occupancy, desk/room " +
          "availability, amenities, and team presence so employees find and book " +
          "the right space, and feed experience and attendance signals back into " +
          "occupancy planning — protecting the experience that earns the commute " +
          "so right-sizing improves utilization instead of driving the absence " +
          "that strands more capacity.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Real-time desk/room booking and occupancy/availability data",
          "Workplace-experience survey/pulse data and attendance signals",
          "Amenity, team-presence, and floorplan data to guide space selection",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Presence and team-location features are employee-privacy-sensitive; surfacing colleague location requires consent and aggregation safeguards",
          "Experience tooling supports the workplace strategy; it does not substitute for adequate, well-located space if the right-sizing went too far",
          "Recommendations are suggestions to employees, not mandates — a human chooses where and when to work",
        ],
        metricsMoved: [
          "workplace_experience_satisfaction",
          "space_utilization_rate",
          "occupancy_density",
        ],
      },
      {
        key: "cre_capital_project_intelligence",
        name: "CRE capital-project & fit-out delivery intelligence",
        valueMechanism:
          "Apply AI to capital-project estimating, scheduling, and risk early-" +
          "warning across the fit-out and consolidation program — flagging cost " +
          "and schedule overrun risk, scope creep, and change-order drivers " +
          "early — so the projects that REALIZE the portfolio right-sizing land " +
          "closer to on-time and on-budget and their cost-to-achieve does not " +
          "erode the savings case that justified them.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Capital-project baselines (cost, schedule), actuals, and change-order history",
          "Vendor/contractor performance and market cost data for estimating",
          "The portfolio/occupancy plan the projects deliver against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Estimates and risk flags are decision support; the PM and capital-governance board own scope, budget, and the go/no-go",
          "Cost-to-achieve overrun nets directly against portfolio savings and must be tracked into the business case, not reported separately",
          "Construction risk depends on supply-chain and labor-market volatility the model cannot fully see; confidence must be flagged",
        ],
        metricsMoved: [
          "capital_project_on_time_on_budget",
          "cost_per_seat",
          "facilities_cost_per_sqft",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "integrated_workplace_management_system",
        name: "Integrated workplace management system (IWMS) — the CRE backbone",
        description:
          "A single IWMS/CAFM backbone that unifies lease administration, space " +
          "and occupancy management, the CMMS/maintenance, capital projects, and " +
          "energy on one building/area definition — the system of record the " +
          "utilization model, the lease-event plan, the FM program, and the " +
          "retrofit pipeline all bind to, replacing the spreadsheet-and-" +
          "disconnected-tools estate.",
        boundary:
          "Owns the reconciled portfolio data model — leases, space, assets, " +
          "projects, energy — on one identifier; does not own the portfolio " +
          "decision, the lease negotiation, or the maintenance execution itself " +
          "(it makes them fact-based and reconciled).",
        humanAccountabilityPoint:
          "Head of Corporate Real Estate (with the CRE Data / Systems lead)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "utilization_sensing_platform",
        name: "Occupancy / utilization sensing & analytics platform",
        description:
          "A privacy-governed sensing and analytics layer that fuses badge, " +
          "occupancy-sensor, Wi-Fi, and booking signals into a representative " +
          "utilization picture with stated coverage and consent posture — the " +
          "platform that turns the lease-vs-utilization mismatch from anecdote " +
          "into measured, decision-grade evidence.",
        boundary:
          "Owns utilization measurement, data fusion, and the privacy/consent " +
          "controls over occupancy data; does not own the space-management " +
          "inventory it normalizes against, nor the right-sizing decision (it " +
          "supplies the evidence the portfolio plan consumes).",
        humanAccountabilityPoint:
          "Head of Workplace / Occupancy Planning (with Privacy / Works-Council liaison)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "lease_portfolio_governance",
        name: "Lease portfolio & critical-date governance",
        description:
          "A lease-administration and portfolio-governance practice that " +
          "maintains the critical-date calendar (breaks, renewals, expiries), " +
          "sequences hold/renegotiate/relocate/surrender decisions to those " +
          "events with adequate lead-time, and ties each to the lease-accounting " +
          "(ASC 842 / IFRS 16) consequence — the discipline that makes the " +
          "right-sizing thesis actually actionable and durable.",
        boundary:
          "Owns the lease data, critical-date calendar, decision lead-time, and " +
          "the accounting-aware option evaluation; does not own the corporate " +
          "real-estate strategy or the negotiation outcome (it runs the timing " +
          "and option discipline that makes them executable).",
        humanAccountabilityPoint:
          "Head of Corporate Real Estate / Lease Administration (with the Controller for lease accounting)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "fm_operating_model_sourcing",
        name: "FM operating model & condition-based maintenance sourcing",
        description:
          "An FM operating-model and sourcing pattern that shifts maintenance " +
          "from reactive break-fix to planned and condition-based, structures " +
          "hard- and soft-service contracts on outcome and demand (not flat full-" +
          "occupancy pricing), and uses the CMMS and asset-condition data to " +
          "lower lifecycle cost — consuming the field/facility-service execution " +
          "layer as the delivery surface it sources and governs.",
        boundary:
          "Owns the FM strategy, sourcing, contract structure, and the planned-" +
          "vs-reactive/demand-based operating model; does not own the dispatch, " +
          "technician scheduling, or SLA execution engine (that is the field/" +
          "facility-service expert's; this pattern sources and governs it).",
        humanAccountabilityPoint:
          "Head of Facilities Management (with Procurement for the FM contracts)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "building_energy_retrofit_program",
        name: "Building energy optimization & retrofit program",
        description:
          "A building-energy program that optimizes operations to real occupancy " +
          "(occupancy-aware HVAC/lighting, fault detection) and prioritizes the " +
          "capital-gated retrofit pipeline by EUI reduction, cost, and payback — " +
          "the pattern that delivers the genuinely cost-positive energy slice " +
          "(opex and Scope 1+2 down together) and feeds the building footprint up " +
          "to the enterprise ESG program.",
        boundary:
          "Owns building-energy operations and the retrofit-economics pipeline; " +
          "does not own the enterprise carbon footprint, decarbonization roadmap, " +
          "or assured disclosure (handed to the ESG & Sustainability expert) nor " +
          "the deep mechanical/electrical engineering design.",
        humanAccountabilityPoint:
          "Head of Facilities / Energy (with the CSO for the enterprise footprint)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Corporate real estate value is realized on linked levers, and the " +
        "binding truths gate every one. The DOMINANT prize is the lease-vs-" +
        "utilization mismatch: hybrid work stranded 20-40% of office capacity, so " +
        "PORTFOLIO RIGHT-SIZING (consolidating, surrendering, and renegotiating " +
        "under-used space) is the largest cost lever — but it is GATED on two " +
        "things the headline ignores. First, utilization-DATA quality: the prize " +
        "is only as real as the sensing coverage and consent posture behind the " +
        "utilization read, so value resting on right-sizing is capped by data " +
        "representativeness and privacy constraints. Second, lease-event RUNWAY: " +
        "leases are long-dated and illiquid, so the saving is captured only at " +
        "breaks, renewals, and expiries — a stranded-cost number with no near-" +
        "term lease-event runway is unrecoverable for years, and the realizable " +
        "value is the slice that lines up with the critical-date calendar. Beyond " +
        "right-sizing, FM EFFICIENCY (planned/condition-based maintenance and " +
        "demand-based soft services in place of reactive break-fix and full-" +
        "occupancy pricing) and BUILDING-ENERGY efficiency (the genuinely cost-" +
        "positive slice where opex and Scope 1+2 fall together) add durable value. " +
        "The honest constraints: cost reduction that craters workplace experience " +
        "drives the absence that strands MORE capacity (so experience is a " +
        "counterweight, not an afterthought); capital projects that realize the " +
        "consolidation carry cost-to-achieve that nets against the saving; and " +
        "deep ESG retrofit is real but capital-gated and slow. So durable value " +
        "is sized on the mismatch, gated on utilization-data quality and lease-" +
        "event runway, weighted to right-sizing and FM efficiency, and haircut for " +
        "long-dated illiquidity, fit-out cost-to-achieve, and the experience " +
        "constraint — never on a headline 'cut X% of real estate' with no " +
        "utilization evidence or runway behind it.",
      dominantHaircutFactors: [
        {
          factor: "Lease-event runway & long-dated illiquidity (the binding timing gate)",
          rationale:
            "The dominant haircut: stranded-capacity cost can only be acted on " +
            "at breaks, renewals, and expiries. The share of the right-sizing " +
            "prize with no near-term lease event is unrecoverable for years " +
            "(holdover, term remaining, surrender penalties), so gross stranded " +
            "cost must be discounted to the slice the critical-date calendar " +
            "actually makes available in the planning horizon.",
          typicalHaircut: {
            low: 0.2,
            high: 0.6,
            basis:
              "Gap between gross stranded-capacity cost and the portion " +
              "recoverable within the lease-event runway, widening where leases " +
              "are long-dated with few near-term breaks",
            label: "planning-range",
          },
        },
        {
          factor: "Utilization-data quality & privacy/consent constraint",
          rationale:
            "The right-sizing thesis rests on utilization that is fused from " +
            "partial, inconsistent sensing collected under privacy and works-" +
            "council constraints. Low coverage, unrepresentative sampling, and " +
            "consent limits cap how aggressively and defensibly capacity can be " +
            "cut — value built on a number no one trusts is discounted until the " +
            "sensing is representative and compliant.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Reduction in defensible/realizable right-sizing where utilization " +
              "sensing coverage was partial, unrepresentative, or privacy-" +
              "constrained",
            label: "planning-range",
          },
        },
        {
          factor: "Fit-out / capital-project cost-to-achieve",
          rationale:
            "Consolidation and right-sizing are realized through fit-out, " +
            "relocation, and lease-exit projects that carry one-time cost — " +
            "construction, make-good/dilapidations, moving, and change effort — " +
            "that nets against the recurring saving. Gross portfolio savings must " +
            "be haircut to net, with overrun risk on the slowest, largest " +
            "projects.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Cost-to-achieve (fit-out, dilapidations/make-good, relocation, " +
              "change) and overrun drag netting gross portfolio savings down to " +
              "realized",
            label: "planning-range",
          },
        },
        {
          factor: "Workplace-experience & attendance counterweight",
          rationale:
            "Over-aggressive densification or consolidation that craters " +
            "workplace experience drives the absence that strands more capacity " +
            "and erodes the talent/attendance the office exists to support. Value " +
            "from cutting space must be discounted by the share that backfires " +
            "into lower utilization and experience cost.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Erosion of right-sizing value where consolidation degraded " +
              "experience and attendance, offsetting part of the cost saving",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Portfolio right-sizing occupancy-cost reduction (runway-realizable)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported occupancy-cost reduction from consolidating and " +
              "surrendering under-used space at lease events in post-hybrid, " +
              "over-sized estates — the realizable slice, net of cost-to-achieve",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in total occupancy cost (rent + opex + FM) from " +
            "right-sizing to measured demand, realized at lease events and net of " +
            "fit-out/exit cost-to-achieve",
        },
        {
          lever: "Facilities (FM) cost reduction — planned/condition-based & demand-based",
          range: {
            low: 0.08,
            high: 0.25,
            basis:
              "Reported FM cost reduction from shifting reactive break-fix to " +
              "planned/condition-based maintenance and right-sizing soft services " +
              "to measured occupancy in reactive-dominated estates",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in FM cost per occupied sq ft from the planned/" +
            "condition-based and demand-based-service shift, lifting first-time-" +
            "fix and planned-vs-reactive ratio",
        },
        {
          lever: "Building-energy cost reduction (hard-dollar, EUI)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported energy-cost reduction from occupancy-aware operational " +
              "optimization and efficiency retrofit that lowers EUI and Scope " +
              "1+2 together — sized on metered consumption, before capital-gated " +
              "deep retrofit",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in energy cost and energy_use_intensity, with " +
            "the Scope 1+2 reduction it also delivers (bookable efficiency saving)",
        },
      ],
      timeToValueBand:
        "IWMS/utilization-sensing stand-up to a decision-grade utilization read: " +
        "1-3 quarters, gated on sensing coverage and consent. FM operating-model " +
        "and energy-optimization savings: 1-3 quarters once asset/condition and " +
        "BMS data are in place. Portfolio right-sizing: the saving is paced by the " +
        "lease-event calendar — first realized at the nearest break/expiry and " +
        "compounding over 12-36+ months as the runway opens, with fit-out cost-to-" +
        "achieve worked off ahead of the recurring saving. Deep-energy retrofit: " +
        "capital-gated and multi-year. Full CRE operating-model maturity across " +
        "the portfolio: 24-48 months.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Integrated workplace management system (IWMS) / CAFM",
          role:
            "The CRE backbone — lease administration, space and occupancy " +
            "management, maintenance/CMMS, capital projects, and energy on one " +
            "building/area definition; the source of truth for cost, space, and " +
            "lease events.",
          examples: [
            "IBM TRIRIGA",
            "Planon",
            "Archibus (Eptura)",
            "Nuvolo",
          ],
        },
        {
          name: "Lease administration & lease-accounting system",
          role:
            "Holds lease abstracts, rent schedules, recoveries, the critical-" +
            "date (break/renewal/expiry) calendar, and the ASC 842 / IFRS 16 " +
            "lease-accounting treatment — the lease-event and obligation source " +
            "of truth.",
          examples: [
            "LeaseAccelerator",
            "Visual Lease",
            "MRI Software",
            "Nakisa Lease Administration",
          ],
        },
        {
          name: "Occupancy / utilization sensing & space-analytics platform",
          role:
            "Collects and fuses badge, occupancy-sensor, Wi-Fi, and booking " +
            "signals into a utilization picture with coverage and consent " +
            "posture — the source for the lease-vs-utilization evidence and " +
            "right-sizing.",
          examples: [
            "VergeSense",
            "Density",
            "Locatee (Spacewell)",
            "badge/Wi-Fi analytics + sensor systems",
          ],
        },
        {
          name: "CMMS / maintenance & building-management systems",
          role:
            "Work-order management, asset register, condition data, and BMS/IoT " +
            "telemetry — the source for planned-vs-reactive, first-time-fix, " +
            "energy (EUI), and condition-based maintenance.",
          examples: [
            "IBM Maximo",
            "Nuvolo / ServiceNow FSM",
            "Schneider EcoStruxure (BMS)",
            "Honeywell Forge",
          ],
        },
        {
          name: "Workplace experience & room/desk booking platform",
          role:
            "Real-time desk/room booking, wayfinding, amenity, and experience-" +
            "survey data — the source for workplace-experience and smart-booking " +
            "and the attendance counterweight to right-sizing.",
          examples: [
            "Envoy",
            "Robin",
            "Eptura (Condeco/iOFFICE)",
            "Microsoft Places",
          ],
        },
      ],
      roles: [
        {
          title: "Head of Corporate Real Estate (CRE) / Workplace",
          accountability:
            "Owns the portfolio strategy, total occupancy cost, the lease " +
            "portfolio and right-sizing thesis, location strategy, and the " +
            "credibility of the CRE cost story with the CFO and the board.",
        },
        {
          title: "Head of Workplace / Occupancy Planning",
          accountability:
            "Owns space and occupancy planning, the utilization read and its " +
            "data quality/privacy posture, density and the hybrid-work footprint, " +
            "and workplace experience.",
        },
        {
          title: "Head of Facilities Management (FM)",
          accountability:
            "Owns the FM operating model and cost, the planned-vs-reactive and " +
            "demand-based-service mix, soft- and hard-service sourcing, energy/" +
            "EUI, and asset condition.",
        },
        {
          title: "Lease Administration / CRE Finance Lead",
          accountability:
            "Owns lease abstracts, the critical-date calendar, lease-event " +
            "decision lead-time, lease accounting (ASC 842 / IFRS 16), and the " +
            "reconciliation of CRE cost to the GL.",
        },
        {
          title: "Head of Capital Projects / Fit-out",
          accountability:
            "Owns the capital-project and fit-out program, on-time/on-budget " +
            "delivery, change control, and the cost-to-achieve that realizes the " +
            "portfolio plan.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Lease accounting — ASC 842 (US GAAP) / IFRS 16",
          relevance:
            "Brings operating leases onto the balance sheet as right-of-use " +
            "assets and lease liabilities, so portfolio moves, renegotiations, " +
            "and surrenders carry accounting consequences (remeasurement, " +
            "impairment of stranded ROU assets) that must be evaluated with " +
            "finance, not just the cash saving.",
        },
        {
          name: "Accessibility & building codes (ADA / equivalents)",
          relevance:
            "Workplace design, fit-out, densification, and consolidation must " +
            "preserve accessibility (ADA and local equivalents) and meet " +
            "building, occupancy-load, egress, and fire/life-safety codes — " +
            "constraints that bound how far space can be cut or re-stacked.",
        },
        {
          name: "Building energy codes, performance standards & disclosure",
          relevance:
            "Energy codes, building-performance standards (e.g. local EUI/" +
            "emissions caps and energy-disclosure mandates), and certification " +
            "schemes shape the retrofit pipeline and can force capital spend — " +
            "the link between the building-energy lever and the ESG agenda.",
        },
        {
          name: "Occupancy-data privacy & works-council / employee constraints",
          relevance:
            "Badge, sensor, Wi-Fi, and presence data is employee personal data " +
            "under GDPR/equivalents and is subject to works-council and consent " +
            "constraints — governing how utilization can be sensed, aggregated, " +
            "and used in workplace decisions.",
        },
      ],
      canonicalTerms: [
        {
          term: "Space / desk utilization",
          definition:
            "The share of available desks or usable space actually occupied " +
            "during working hours, measured from badge/sensor/Wi-Fi/booking " +
            "signals — the inverse of stranded, paid-for capacity.",
        },
        {
          term: "Stranded space / lease-vs-utilization mismatch",
          definition:
            "Capacity the firm leases and pays for but no longer uses because " +
            "hybrid work cut presence below the built footprint — the dominant " +
            "post-hybrid CRE cost story.",
        },
        {
          term: "Lease event (break / renewal / expiry) & critical date",
          definition:
            "The contractual moments — break options, renewals, and expiries — " +
            "at which a lease can be acted on; the critical-date calendar is the " +
            "runway that makes right-sizing actionable, since leases are illiquid " +
            "between events.",
        },
        {
          term: "Planned / condition-based vs reactive maintenance",
          definition:
            "Maintenance scheduled preventively or triggered by measured asset " +
            "condition, versus break-fix done after failure; the planned/" +
            "condition-based shift lowers lifecycle cost over reactive break-fix.",
        },
        {
          term: "Energy use intensity (EUI)",
          definition:
            "Annual building energy consumption per square foot of floor area — " +
            "the building-efficiency measure that drives both energy opex and " +
            "Scope 1+2 emissions and ranks the retrofit pipeline.",
        },
        {
          term: "IWMS / CAFM (integrated workplace management)",
          definition:
            "The integrated system of record for corporate real estate — leases, " +
            "space, maintenance, projects, and energy on one building/area model " +
            "— that replaces disconnected spreadsheets and tools.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Space utilization and the lease-vs-utilization mismatch",
        authoritativeSource:
          "Occupancy/utilization sensing (badge, sensor, Wi-Fi, booking) fused " +
          "and normalized to usable capacity from the IWMS, with stated sensing " +
          "coverage and consent posture",
        whatGoodEvidenceLooksLike:
          "Utilization by site and floor over a representative period with the " +
          "sensing method and coverage stated, the stranded/under-used capacity " +
          "quantified against leased footprint, and the privacy/consent basis " +
          "documented — a number with its data-quality, not a single peak-week " +
          "snapshot.",
        weakEvidenceToReject:
          "A blanket utilization % extrapolated from one partial source over an " +
          "unrepresentative week, with no coverage, no consent posture, and no " +
          "link to the lease footprint — guesswork presented as measured.",
      },
      {
        claim: "Portfolio right-sizing opportunity and lease-event runway",
        authoritativeSource:
          "Lease administration / lease-accounting system: the critical-date " +
          "calendar, rent schedules, and lease abstracts joined to measured " +
          "demand and market data",
        whatGoodEvidenceLooksLike:
          "Stranded-capacity cost mapped to the break/renewal/expiry calendar " +
          "showing the recoverable slice within the runway, the hold/renegotiate/" +
          "relocate/surrender sequence, and the ASC 842 / IFRS 16 consequence — " +
          "net of fit-out cost-to-achieve.",
        weakEvidenceToReject:
          "A headline 'cut X% of real estate' with no lease-event calendar, no " +
          "runway, no cost-to-achieve, and no accounting treatment — a slide with " +
          "no exit path.",
      },
      {
        claim: "Facilities cost, maintenance mix, and asset condition",
        authoritativeSource:
          "CMMS work-order classification and asset-condition data with FM and " +
          "soft-service contract costs from the IWMS",
        whatGoodEvidenceLooksLike:
          "FM cost per occupied sq ft with the planned-vs-reactive ratio, first-" +
          "time-fix, asset-condition, and deferred-maintenance backlog shown, and " +
          "soft-service pricing reconciled to measured occupancy — lifecycle " +
          "cost, not just a low headline FM number.",
        weakEvidenceToReject:
          "A low FM cost per sq ft asserted as efficiency with no planned-vs-" +
          "reactive split, no condition data, and a hidden deferred-maintenance " +
          "backlog and full-occupancy soft-service contracts.",
      },
      {
        claim: "Building energy intensity and the retrofit/efficiency saving",
        authoritativeSource:
          "BMS/utility-meter energy data per building normalized to floor area " +
          "(EUI) with measured baseline-vs-actual consumption and retrofit " +
          "cost/payback",
        whatGoodEvidenceLooksLike:
          "EUI by building against a baseline, energy-cost saving sized on " +
          "metered consumption with the Scope 1+2 reduction shown together, and " +
          "retrofit options ranked by EUI reduction, cost, and payback against " +
          "the capital plan.",
        weakEvidenceToReject:
          "A claimed energy or 'green building' saving with no metered baseline, " +
          "no EUI, no payback, or carbon claimed as free without the capital and " +
          "the enterprise-footprint treatment.",
      },
      {
        claim: "Workplace experience and attendance counterweight",
        authoritativeSource:
          "Workplace-experience survey/pulse data joined to attendance and " +
          "utilization signals through a workplace change",
        whatGoodEvidenceLooksLike:
          "Experience score trended through a consolidation/densification " +
          "alongside attendance and utilization, showing the change improved (or " +
          "at least held) experience and presence rather than driving absence.",
        weakEvidenceToReject:
          "A cost-saving consolidation case with no experience or attendance " +
          "measurement, ignoring whether the resulting workplace drives the very " +
          "absence that strands more capacity.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "How far below your leased and built capacity does actual utilization run, and how much of that stranded cost can you actually recover given your lease-event runway?",
      "What is your utilization actually measured from — badge, sensors, Wi-Fi, booking — how representative and privacy/works-council-compliant is that sensing, and would it survive scrutiny as the basis for a portfolio decision?",
      "What does your lease-event calendar look like over the next 24-36 months, and is your occupancy plan sequenced to those breaks and expiries — or is it a slide with no runway to act?",
      "What share of your maintenance is planned/condition-based versus reactive break-fix, and are your soft-service contracts still priced for a full occupancy you no longer have?",
      "When you densify or consolidate, do you track workplace experience and attendance alongside cost — or could you be cutting space in a way that drives the very absence that strands more of it?",
      "What is your building energy intensity (EUI) and which retrofit and occupancy-aware operational levers actually save money (opex and Scope 1+2 together) versus require capital you haven't funded?",
      "Can you produce one reconciled, current view of cost, utilization, lease events, and condition for every building on one area definition — or is each portfolio decision hand-assembled from disconnected systems?",
    ],
    maturitySignals: [
      "Utilization is measured from fused badge/sensor/Wi-Fi/booking data with stated coverage and a documented privacy/consent posture — not a single partial source extrapolated to the estate.",
      "The occupancy plan is sequenced to the lease-event critical-date calendar with adequate decision lead-time, and each move carries its ASC 842 / IFRS 16 consequence — right-sizing has a runway, not just a thesis.",
      "Facilities runs a high planned/condition-based maintenance ratio with asset-condition data and demand-based soft services priced to measured occupancy, not flat full-occupancy contracts.",
      "Building energy is optimized to real occupancy with EUI tracked per building, and the cost-positive efficiency slice is separated from the capital-gated deep retrofit and handed up to the ESG program.",
      "Lease, space, utilization, FM, energy, and capital-project data reconcile in one IWMS on one building/area definition, and workplace experience and attendance are tracked alongside cost through every change.",
    ],
    redFlags: [
      "A right-sizing or consolidation case built on a blanket utilization % from one partial source over an unrepresentative period, with no sensing coverage or privacy/consent posture — guesswork presented as measured.",
      "A 'cut X% of real estate' target with no lease-event calendar, no runway, no cost-to-achieve, and no lease-accounting treatment — a saving with no exit path that dies on the shelf.",
      "Facilities dominated by reactive break-fix with a growing deferred-maintenance backlog and soft-service contracts still priced for full occupancy the building no longer has.",
      "Consolidation run as pure cost with no workplace-experience or attendance measurement, degrading the office so it drives the absence that strands more capacity — and lease, space, FM, and energy data that don't reconcile across systems.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "IWMS / CAFM platforms (IBM TRIRIGA, Planon, Archibus/Eptura, Nuvolo)",
        category: "Integrated workplace management — lease, space, maintenance, projects, energy",
        switchingCost:
          "High — the IWMS holds the configured building/area model, lease abstracts, space inventory, asset register, and the historical data spine; replacement is a re-implementation and re-data-migration program, not a swap, and it is deeply integrated to HR, finance, and BMS.",
        renewalDynamics:
          "Subscription/module licensing by building, area, or user; lease-accounting, occupancy-analytics, and energy modules are increasingly upsold as premium tiers, and implementation/integration sunk cost drives renewal stickiness.",
      },
      {
        vendorName: "Lease administration & lease-accounting (LeaseAccelerator, Visual Lease, MRI, Nakisa)",
        category: "Lease abstracts, critical dates, and ASC 842 / IFRS 16 accounting",
        switchingCost:
          "High — the lease abstracts, critical-date calendar, accounting configuration, and audit/assurance trail are embedded; switching mid-reporting-cycle risks the lease-accounting audit trail and is rarely attempted.",
        renewalDynamics:
          "Subscription by lease count/entity and standards covered; the embedded ASC 842/IFRS 16 audit trail and the cost of re-abstracting leases are the stickiness; portfolio scale is the negotiation lever.",
      },
      {
        vendorName: "Occupancy / utilization sensing (VergeSense, Density, Locatee/Spacewell)",
        category: "Sensor/badge/Wi-Fi occupancy sensing and space analytics",
        switchingCost:
          "Moderate — the hardware sensor estate (where deployed) and the calibrated baselines accrete, but software-only badge/Wi-Fi analytics are more portable; switching cost rises with installed sensor density and historical baseline depth.",
        renewalDynamics:
          "Subscription by sensor/space count plus hardware; analytics depth, privacy-governance features, and integration to the IWMS/booking stack drive price and stickiness as hybrid right-sizing demand grows.",
      },
      {
        vendorName: "FM service providers & outsourcers (integrated-FM and self-perform)",
        category: "Hard- and soft-service facilities-management delivery (the execution surface)",
        switchingCost:
          "Moderate-to-high — TUPE/transfer of FM staff, mobilization/demobilization cost, and embedded site knowledge make re-tendering disruptive, but the FM market is competitive and contracts are periodically re-bid.",
        renewalDynamics:
          "Multi-year integrated-FM or bundled-service contracts re-tendered at term; the levers are scope, the planned-vs-reactive/demand-based pricing structure, and KPI/outcome terms (first-time-fix, condition-based) rather than flat full-occupancy rates.",
      },
    ],
    switchingCosts:
      "The IWMS and lease-accounting platforms are the deep lock-in: the " +
      "configured building/area model, lease abstracts, critical-date calendar, " +
      "asset register, accounting configuration, and the audit/assurance trail " +
      "make replacement a re-implementation and re-abstraction program, and " +
      "switching mid-cycle threatens the lease-accounting audit trail. Occupancy " +
      "sensing locks in to the extent of installed hardware and historical " +
      "baseline, but software-only analytics are more portable. FM service " +
      "providers carry mobilization, staff-transfer (TUPE), and site-knowledge " +
      "switching cost but are re-tendered competitively at term. The negotiable " +
      "frontier is in IWMS modules and analytics tiers, sensing scope, and the " +
      "FM contract's pricing structure and outcome KPIs.",
    negotiationLevers: [
      "Outcome/scope pricing on the IWMS by buildings and modules actually used (lease-accounting, occupancy-analytics, energy) rather than a blanket enterprise license, as right-sizing shrinks the estate",
      "Data-portability and lease-abstract/historical-baseline export rights to prevent IWMS and lease-accounting lock-in at the next portfolio review",
      "Re-tender integrated-FM contracts on planned/condition-based and demand-based pricing with first-time-fix and condition KPIs, not flat full-occupancy soft-service rates",
      "Phase-gated pilot-to-scale on occupancy sensing with representativeness and privacy-governance proof before estate-wide hardware commitment",
      "Leverage the shrinking footprint and lease-event timing as commitment volume to renegotiate IWMS, sensing, and FM contracts in step with the consolidation program",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      utilization_claim: [
        "the sensing method (badge/sensor/Wi-Fi/booking) and its coverage/representativeness",
        "utilization normalized to usable capacity from the space inventory",
        "the privacy/consent and works-council posture behind the data",
      ],
      portfolio_rightsizing_claim: [
        "stranded/under-used capacity mapped to the lease-event critical-date calendar",
        "the runway-recoverable slice and the hold/renegotiate/relocate/surrender sequence",
        "the ASC 842 / IFRS 16 consequence and the fit-out/exit cost-to-achieve",
      ],
      facilities_claim: [
        "FM cost per occupied sq ft with the planned-vs-reactive ratio and first-time-fix",
        "asset-condition and deferred-maintenance backlog",
        "soft-service pricing reconciled to measured occupancy",
      ],
      energy_claim: [
        "EUI per building against a baseline from metered/BMS data",
        "energy-cost saving sized on measured consumption with the Scope 1+2 reduction shown",
        "retrofit cost, EUI-reduction potential, and payback against the capital plan",
      ],
      experience_claim: [
        "workplace-experience score joined to attendance and utilization through a change",
        "the survey instrument and population, not an anecdote",
        "the link between the workplace change and presence/attendance",
      ],
      value_projection: [
        "benchmark planning-range with the lease-event-runway and utilization-data-quality gates stated",
        "explicit haircut factors (lease runway/illiquidity, utilization data, cost-to-achieve, experience)",
        "net-of-cost-to-achieve framing, not a gross headline cut",
      ],
    },
    citationStandard:
      "Quantitative CRE/workplace claims cite the system of record (IWMS, lease-" +
      "accounting, occupancy sensing, CMMS/BMS) and the building/area definition " +
      "and period. Utilization claims ALWAYS state the sensing method, its " +
      "coverage/representativeness, and the privacy/consent posture — a " +
      "utilization number is never asserted as fact without its data quality. " +
      "Right-sizing claims map stranded cost to the lease-event critical-date " +
      "calendar and give the runway-recoverable slice net of cost-to-achieve and " +
      "the ASC 842/IFRS 16 consequence, never a gross 'cut X%'. Facilities claims " +
      "give the planned-vs-reactive ratio and asset condition, not just a low FM " +
      "cost. Energy claims give EUI against a baseline sized on metered " +
      "consumption with the Scope 1+2 reduction, and hand the enterprise footprint " +
      "to the ESG expert. Value projections give a labelled planning range gated " +
      "on lease-event runway and utilization-data quality and name the haircut " +
      "factors applied — never a single asserted saving or ROI.",
  },

  hedgeRules: {
    whenToHedge: [
      "Utilization sensing coverage, representativeness, or consent posture is unknown or partial — frame utilization figures and any value resting on right-sizing as a planning range explicitly gated on utilization-data quality, and label extrapolated samples as estimates.",
      "A right-sizing or consolidation saving is cited without a lease-event runway — flag that stranded cost is recoverable only at breaks/renewals/expiries and give the runway-realizable slice, not the gross mismatch.",
      "FM or energy savings are presented as a clean number — separate planned/condition-based and demand-based FM efficiency and metered energy efficiency from capital-gated deep retrofit, and net portfolio savings of fit-out cost-to-achieve.",
      "A consolidation case ignores workplace experience and attendance, or a building energy claim crosses into the enterprise carbon footprint — flag the experience/attendance counterweight and hand the footprint and assured disclosure to the ESG expert.",
    ],
    inferenceLanguage: [
      "Across large enterprises post-hybrid, office utilization commonly runs 20-40% below the leased footprint, so without your measured, representative sensing this stranded-capacity number carries material uncertainty...",
      "Because leases are long-dated and illiquid, the industry pattern is that only the slice lining up with near-term breaks and expiries is recoverable — treat the saving as gated on your lease-event runway, not the gross mismatch...",
      "Peer estates typically realize FM efficiency in the range of... from shifting reactive break-fix to planned/condition-based and demand-based services, before capital-gated retrofit...",
      "Treating this as a planning-range estimate gated on utilization-data quality and lease-event runway, and net of fit-out cost-to-achieve, rather than your measured, runway-confirmed figure...",
    ],
    flagWithoutEvidence: [
      "This tenant's actual space utilization, stranded-capacity %, cost per seat, or portfolio occupancy cost",
      "A specific real-estate cost-reduction or right-sizing number, or that stranded cost is recoverable, without the lease-event runway",
      "A utilization figure presented as measured when its sensing coverage, representativeness, or consent posture is unknown",
      "That a consolidation will not harm attendance, or an enterprise carbon/footprint claim that belongs to the ESG & Sustainability expert",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "where is space stranded / lease-vs-utilization mismatch by site",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap of utilization vs leased capacity by site/floor, exposing where the largest stranded cost sits on the most leased space — the right-sizing target, read with sensing coverage.",
    },
    {
      questionPattern:
        "portfolio right-sizing saving sequenced to lease events / runway",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Waterfall from current occupancy cost down each runway-realizable move (renegotiate/relocate/surrender) at its lease event to the right-sized run-rate, net of fit-out cost-to-achieve — exposing the unrecoverable, no-runway slice honestly.",
    },
    {
      questionPattern:
        "facilities cost stack / planned-vs-reactive and demand-based opportunity",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "FM cost stack by service line with the planned-vs-reactive and full-occupancy-vs-demand split, ordering the efficiency levers from condition-based maintenance to demand-based soft services.",
    },
    {
      questionPattern:
        "CRE value sensitivity to lease runway, utilization data, and cost-to-achieve",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of value sensitivity to the dominant haircut factors (lease-event runway/illiquidity, utilization-data quality, fit-out cost-to-achieve, experience/attendance counterweight).",
    },
    {
      questionPattern:
        "occupancy cost and utilization benchmarking across the portfolio",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Bar comparison of cost per seat, cost per OCCUPIED seat, and utilization by site against planning ranges, surfacing the expensive, under-used sites to target.",
    },
    {
      questionPattern: "corporate real estate & workplace KPI scorecard",
      exhibitKind: "table",
      note: "Space utilization, cost per seat (and per occupied seat), occupancy density, lease cost per sq ft, portfolio vacancy/stranded %, FM cost per sq ft, first-time-fix, planned-vs-reactive ratio, EUI, workplace-experience score, capital-project on-time/on-budget %, and lease-event lead-time versus planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Right-sizing rests on representative, privacy-compliant utilization sensing fused into a decision-grade read, so the biggest cost lever is evidence-based rather than guesswork",
      "The occupancy plan is sequenced to the lease-event critical-date calendar with adequate lead-time and lease-accounting treatment, so the saving is actually actionable and captured at the events where it's available",
      "Facilities shifts to planned/condition-based maintenance and demand-based soft services, and building energy is optimized to real occupancy, turning reactive run-cost into durable efficiency",
      "Workplace experience and attendance are tracked alongside cost, so consolidation improves utilization rather than driving the absence that strands more capacity",
    ],
    failureDrivers: [
      "A consolidation is decided on a partial, unrepresentative, privacy-questionable utilization sample, so the right-sizing is wrong-sized and either over-cuts (crowding) or misses the stranded cost",
      "A right-sizing thesis is built with no lease-event runway, so the stranded cost is locked in for years, breaks are missed, and the estate defaults into costly holdover",
      "Facilities stays reactive break-fix with full-occupancy soft-service contracts and a growing deferred-maintenance backlog, paying the lifecycle premium while the building is half-empty",
      "Cost is cut without an experience counterweight, the office fails to earn the commute, attendance falls, and the firm strands more capacity than it removed",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Occupancy sensing/IWMS and building-energy and workplace-experience " +
      "tooling adopt first because the utilization read is the prerequisite and " +
      "energy/experience deliver tangible, near-term wins. FM operating-model and " +
      "condition-based maintenance follow as asset and condition data mature. " +
      "Portfolio right-sizing adopts last and is paced not by software but by the " +
      "lease-event calendar — the saving lands at breaks and expiries and " +
      "compounds over years, which is exactly why right-sizing theses outrun the " +
      "runway to execute them. Deep-energy retrofit is slowest, gated on capital.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is honestly MEDIUM. The hard-dollar core is real and " +
      "measurable: occupancy cost (rent + opex + FM) is a large, visible line, " +
      "and right-sizing, FM efficiency, and building-energy savings are sized on " +
      "lease economics and metered consumption rather than asserted. What softens " +
      "the clarity is timing and gating: the biggest lever (portfolio right-" +
      "sizing) is only recoverable at long-dated lease events, so realization is " +
      "paced over years and the gross-vs-runway-realizable gap is large; the " +
      "utilization data the saving rests on is fragmented and privacy-" +
      "constrained, capping how defensibly capacity can be cut; and fit-out cost-" +
      "to-achieve and the experience/attendance counterweight net against the " +
      "headline. That is why the value model gates on lease-event runway and " +
      "utilization-data quality, sizes net of cost-to-achieve, and the evidence/" +
      "hedge rules force a runway check, a data-quality basis, and an experience " +
      "counterweight rather than a single 'cut X%' number.",
  },

  regulatoryFrame: {
    name: "Lease accounting (ASC 842 / IFRS 16) with accessibility, building-energy, and occupancy-data-privacy constraints",
    relevance:
      "The dominant regulatory frame for corporate real estate & workplace: " +
      "leases sit on the balance sheet as right-of-use assets and lease " +
      "liabilities under ASC 842 / IFRS 16, so portfolio moves, renegotiations, " +
      "and surrenders carry remeasurement and stranded-ROU-asset impairment " +
      "consequences that finance must evaluate alongside the cash saving. " +
      "Workplace design, densification, and fit-out are bounded by accessibility " +
      "(ADA/equivalents) and building/occupancy/life-safety codes; the building-" +
      "energy lever is shaped by energy codes and building-performance/disclosure " +
      "standards (the link to the ESG agenda); and occupancy sensing is " +
      "constrained by employee-data privacy (GDPR/equivalents) and works-council " +
      "consent (see vocabulary.regulatoryFrames for the specifics).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
