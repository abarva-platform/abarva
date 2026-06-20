// Consilium expert — Airline Network & Schedule Planning + Commercial.
//
// W3 wave-4 industry-function ExpertPack. Domain: the FORWARD planning layer of
// a network airline — route network design, schedule design, fleet assignment,
// slot/gate strategy, codeshares & alliances, network profitability, and the
// commercial/route economics that decide WHAT to fly, WHERE, WHEN, and with
// WHICH aircraft. This is the long-lead bet, not the day-of operation.
//
// DISTINCT from the Airline Operations & Revenue Management expert: that expert
// runs the schedule once it exists (IROPS recovery, crew, maintenance, RM/
// pricing day-of). THIS expert decides the schedule itself — the capital-heavy,
// long-lead network and fleet commitments made months to years ahead under
// demand uncertainty.
//
// Honesty posture baked into the content: network decisions are LONG-LEAD,
// CAPITAL-HEAVY BETS UNDER DEMAND UNCERTAINTY. A route launched today is sized
// against a demand forecast that may be wrong; fleet orders lock the cost base
// for a decade; slots and gates are scarce, regulated, and often irreversible.
// AI sharpens the forecast and the optimization, but it cannot remove the
// fundamental uncertainty or the irreversibility of the commitment — and the
// final go/no-go is a commercial leadership decision, not an algorithmic one.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const airlineNetworkPlanningExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.airline.network-schedule-planning",
    expertName: "Airline Network & Schedule Planning + Commercial Expert",
    kind: "industry-function",
    industry: "airline",
    functionKey: "network-schedule-planning",
    scopeNote:
      "The forward planning and commercial layer of a network airline: route " +
      "network design and market entry/exit, schedule design and connection " +
      "banking, fleet assignment and gauge/up-gauging decisions, slot and gate " +
      "strategy at constrained airports, codeshares and alliance/joint-venture " +
      "network design, network profitability and route economics, and capacity " +
      "(ASM) planning. These are long-lead, capital-heavy bets made months to " +
      "years ahead under demand uncertainty. Bounded by the fact that fleet, " +
      "slot, and route commitments are largely irreversible and the final go/" +
      "no-go is a commercial leadership decision — AI sharpens the forecast and " +
      "the optimization, it does not remove the uncertainty or own the bet. " +
      "EXCLUDES day-of operations, IROPS recovery, crew/maintenance scheduling, " +
      "and tactical revenue-management pricing (covered by the Airline " +
      "Operations & Revenue Management expert); also excludes aircraft " +
      "manufacturing and airport-authority operations.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "route_profitability_margin",
        name: "Route profitability (operating margin by route)",
        definition:
          "Fully-allocated operating profit of a route (or O&D market) as a " +
          "percentage of route revenue — total revenue less directly assigned " +
          "and allocated costs (fuel, crew, ownership, station, distribution).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: -5,
          high: 12,
          basis:
            "Network-carrier route P&L distributions; mature routes run high " +
            "single digits, new/seasonal/feeder routes often negative while " +
            "building or feeding hub connectivity — the range is wide by design",
          label: "planning-range",
        },
        dataSource:
          "Route profitability system: revenue accounting (prorated O&D revenue) joined to a route cost allocation model",
        whyItMatters:
          "The core decision metric of network planning — whether a route earns " +
          "its keep standalone, and (with connectivity value) whether it earns " +
          "its keep as a feeder. Cost allocation choices swing the answer, so " +
          "the allocation method matters as much as the number.",
      },
      {
        key: "network_rasm",
        name: "Network RASM (revenue per available seat-mile)",
        definition:
          "Total network operating revenue divided by total available " +
          "seat-miles — the unit revenue the whole network earns per unit of " +
          "capacity, the headline commercial-health measure of the schedule.",
        unit: "cents per ASM",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 12,
          high: 18,
          basis:
            "US network-carrier 10-Q/10-K disclosures; varies sharply by stage " +
            "length, region mix, and hub structure",
          label: "planning-range",
        },
        dataSource: "Operating revenue / ASM from revenue accounting and the published capacity plan",
        whyItMatters:
          "The unit-revenue outcome of network and schedule choices — gauge, " +
          "stage length, hub banking, and market mix all show up here. It is the " +
          "metric a capacity plan is ultimately judged on against unit cost.",
      },
      {
        key: "fleet_utilization_block_hours",
        name: "Fleet utilization (block hours per aircraft per day)",
        definition:
          "Average daily block hours flown per aircraft by fleet type — how " +
          "hard the schedule works each tail, net of overnight, maintenance, " +
          "and ground time.",
        unit: "block hours per aircraft per day",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 8,
          high: 13,
          basis:
            "Carrier fleet utilization disclosures; short-haul narrowbody runs " +
            "lower, long-haul widebody higher; LCC point-to-point models push " +
            "the high end — gauge- and network-shape dependent",
          label: "planning-range",
        },
        dataSource: "Block hours flown / active aircraft-days by fleet from the schedule and fleet plan",
        whyItMatters:
          "Aircraft are the most expensive asset; utilization spreads fixed " +
          "ownership cost across more flying. But higher utilization thins the " +
          "schedule buffer that absorbs delay, so it trades unit cost against " +
          "operational resilience — a network decision, not a free lunch.",
      },
      {
        key: "schedule_efficiency",
        name: "Schedule efficiency (productive vs available aircraft time)",
        definition:
          "Share of available aircraft time converted into revenue block hours " +
          "in the schedule — the inverse of unproductive ground, positioning, " +
          "and idle time the schedule leaves on the table.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 70,
          basis:
            "Schedule-design experience; hub-and-spoke banked schedules sacrifice " +
            "some efficiency for connectivity, point-to-point pushes higher",
          label: "planning-range",
        },
        dataSource: "Revenue block time vs available aircraft time in the schedule planning system",
        whyItMatters:
          "Measures how well the schedule design itself uses the fleet before " +
          "the day-of operation touches it. Banking for connectivity deliberately " +
          "trades efficiency for revenue, so it must be read against connectivity " +
          "and RASM, not maximized in isolation.",
      },
      {
        key: "od_connectivity_coverage",
        name: "O&D connectivity coverage",
        definition:
          "Number of origin-destination markets the network serves within a " +
          "reasonable elapsed-time / connection-quality threshold — the breadth " +
          "of sellable itineraries the schedule creates.",
        unit: "count of viable O&D markets",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 2000,
          high: 20000,
          basis:
            "Hub-carrier connectivity studies; scales enormously with hub bank " +
            "structure and alliance reach — range spans regional to global hubs",
          label: "planning-range",
        },
        dataSource: "Connection-builder / schedule analysis (e.g. minimum-connect-time feasible itineraries) on the published schedule",
        whyItMatters:
          "Connectivity is the multiplier that makes a hub worth more than its " +
          "spokes — a feeder route loses money standalone yet creates dozens of " +
          "profitable connecting itineraries. It is why route-standalone P&L " +
          "alone under-values the network.",
      },
      {
        key: "load_factor_by_route",
        name: "Load factor by route",
        definition:
          "Revenue passenger-miles divided by available seat-miles on a given " +
          "route — the share of that route's offered capacity that is sold.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 88,
          basis:
            "Route-level traffic data; mature trunk routes run mid-to-high 80s, " +
            "new and thin routes lower while spilling up — higher is not better " +
            "if achieved by dumping yield",
          label: "planning-range",
        },
        dataSource: "RPM / ASM at route level from revenue accounting and the capacity plan",
        whyItMatters:
          "The route-level capacity-fit signal that informs up-gauge / down-gauge " +
          "and frequency decisions. Read alone it misleads — a high load factor " +
          "at a low fare can mean the route is over-discounted, not right-sized.",
      },
      {
        key: "breakeven_load_factor",
        name: "Breakeven load factor",
        definition:
          "The load factor at which a route or the network covers its operating " +
          "cost at the prevailing yield — the line a route must clear to stop " +
          "losing money.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 65,
          high: 85,
          basis:
            "Carrier breakeven disclosures; rises with unit cost and falls with " +
            "yield — a route whose actual load factor sits below breakeven is " +
            "structurally loss-making at current economics",
          label: "planning-range",
        },
        dataSource: "Route/network cost per ASM divided by yield (revenue per RPM) from the cost and revenue models",
        whyItMatters:
          "The honest viability test for a route: the gap between actual and " +
          "breakeven load factor, not headline load factor, tells whether the " +
          "route makes money. It moves with both cost (gauge, stage length) and " +
          "yield (market, competition).",
      },
      {
        key: "slot_utilization",
        name: "Slot utilization",
        definition:
          "Share of held airport arrival/departure slots actually operated at a " +
          "slot-constrained (Level 3 coordinated) airport, against the regulatory " +
          "use-it-or-lose-it threshold.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 95,
          basis:
            "IATA Worldwide Airport Slot Guidelines (WASG) 80% use-it-or-lose-it " +
            "rule and carrier slot portfolios at congested hubs",
          label: "planning-range",
        },
        dataSource: "Operated vs allocated slots from the slot coordination / schedule clearance records",
        whyItMatters:
          "At constrained airports, slots are scarce, valuable, and forfeit if " +
          "under-used. Slot strategy is a near-irreversible network asset — losing " +
          "a slot can mean losing the right to serve a market, so utilization is " +
          "a strategic, not just operational, metric.",
      },
      {
        key: "codeshare_alliance_revenue_share",
        name: "Codeshare / alliance revenue share",
        definition:
          "Share of total network revenue derived from codeshare, interline, and " +
          "alliance/joint-venture itineraries rather than wholly-owned online " +
          "flying.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Network-carrier alliance contribution disclosures; deep " +
            "joint-venture carriers run the high end, point-to-point carriers " +
            "near zero — strategy-dependent, not a universal target",
          label: "planning-range",
        },
        dataSource: "Prorated codeshare/JV revenue vs total network revenue from revenue accounting and partner settlement",
        whyItMatters:
          "Partnerships extend network reach without the capital of flying it " +
          "yourself; the share signals how much of the network's value is " +
          "leveraged through partners — and how exposed the network is to " +
          "partner strategy and antitrust-immunity terms.",
      },
      {
        key: "asm_capacity_growth",
        name: "Capacity (ASM) growth",
        definition:
          "Year-over-year change in available seat-miles — the net capacity the " +
          "network adds or removes through schedule, gauge, and fleet decisions.",
        unit: "% YoY",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: -5,
          high: 8,
          basis:
            "Industry capacity-discipline ranges; growth far above demand erodes " +
            "RASM, deep cuts forfeit network presence — disciplined growth tracks " +
            "demand, hence in-range not higher-is-better",
          label: "planning-range",
        },
        dataSource: "Published vs prior-period ASM from the capacity plan and schedule",
        whyItMatters:
          "Capacity discipline is the industry's recurring profitability lever: " +
          "adding ASMs faster than demand dilutes unit revenue across the whole " +
          "network. The right answer is matched to demand, not maximized — which " +
          "is why direction-of-good is in-range.",
      },
      {
        key: "aircraft_assignment_efficiency",
        name: "Aircraft (fleet) assignment efficiency",
        definition:
          "How well the fleet-assignment solution matches aircraft gauge to " +
          "forecast demand on each leg — measured as recaptured spill plus " +
          "avoided empty-seat cost versus a single-gauge baseline.",
        unit: "% of theoretical gauge-fit value captured",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "Fleet-assignment optimization studies; bounded by fleet " +
            "commonality, maintenance routing, and crew base constraints that " +
            "prevent a perfect gauge match",
          label: "planning-range",
        },
        dataSource: "Fleet-assignment optimizer output vs realized demand and spill from the schedule and revenue systems",
        whyItMatters:
          "Putting the right-size aircraft on each leg recaptures demand that a " +
          "too-small aircraft would spill and avoids flying empty seats on a " +
          "too-large one. It is the highest-leverage schedule-planning lever that " +
          "does not require ordering a single new aircraft.",
      },
      {
        key: "stage_length",
        name: "Average stage length",
        definition:
          "Average distance flown per departure across the network — a primary " +
          "normalizer that drives unit-cost and unit-revenue comparisons.",
        unit: "miles",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 600,
          high: 2500,
          basis:
            "Carrier stage-length disclosures; short-haul/feeder networks low, " +
            "long-haul-heavy networks high — neither is intrinsically better, it " +
            "must fit the fleet and market strategy",
          label: "planning-range",
        },
        dataSource: "Total ASM / total seats departed, or block miles / departures, from the schedule",
        whyItMatters:
          "Stage length distorts RASM and CASM mechanically (longer flights have " +
          "lower unit cost and revenue), so any cross-carrier or cross-route " +
          "comparison must normalize for it. It is also a deliberate network-shape " +
          "choice that must match the fleet, hence in-range.",
      },
    ],

    painThemes: [
      {
        key: "demand_forecast_uncertainty",
        name: "Long-lead demand forecast uncertainty",
        description:
          "Network and fleet decisions are committed months to years before the " +
          "traffic materializes, against demand forecasts that are inherently " +
          "uncertain (macro shocks, competitor entry, fuel, fares). A route or " +
          "gauge sized to a forecast that proves wrong locks in losses that are " +
          "slow and expensive to unwind.",
        detectionSignal:
          "Large, recurring gaps between forecast and actual traffic on new " +
          "routes; routes repeatedly re-sized or pulled within a season; business " +
          "cases that present a single demand point estimate with no scenario band.",
        diagnosticQuestion:
          "When you launch a route, how wide is your demand forecast band, and " +
          "how often does actual traffic land outside the case you committed to?",
      },
      {
        key: "irreversible_capital_commitment",
        name: "Irreversible capital & slot commitment",
        description:
          "Fleet orders, slot holdings, and gate leases lock the cost base and " +
          "network footprint for years and are costly or impossible to reverse. A " +
          "decision optimal at order time can be stranded by a demand or fuel " +
          "shift, yet the carrier still carries the asset and the obligation.",
        detectionSignal:
          "Aircraft delivered into markets that softened; under-utilized slots at " +
          "risk of forfeit; gate/leases on stations the network has effectively " +
          "exited; fleet types that no longer fit the network being flown anyway.",
        diagnosticQuestion:
          "How much of your network footprint is locked by fleet order book, slot " +
          "holdings, and gate leases, and what is your flexibility to re-deploy if " +
          "demand shifts?",
      },
      {
        key: "route_standalone_vs_network",
        name: "Route-standalone P&L blind to network value",
        description:
          "Routes are judged on standalone profitability while their real value " +
          "is the connecting traffic and connectivity they feed into the hub. " +
          "Cutting a 'loss-making' feeder can strip profitable connections " +
          "elsewhere — the network value is invisible in a route-by-route P&L.",
        detectionSignal:
          "Route decisions made on standalone margin with no connectivity or " +
          "network-contribution view; feeder cuts followed by unexplained revenue " +
          "loss on trunk routes; no O&D / spill-recapture model behind decisions.",
        diagnosticQuestion:
          "Do you decide routes on standalone P&L or on full network contribution " +
          "including the connecting traffic they feed — and can you quantify the " +
          "connectivity value of a feeder?",
      },
      {
        key: "schedule_connectivity_efficiency_tension",
        name: "Connectivity-vs-efficiency tension in the schedule",
        description:
          "Banking flights to create connections raises connectivity and revenue " +
          "but lowers aircraft utilization and concentrates operational risk; " +
          "de-peaking smooths operations and cuts unit cost but loses sellable " +
          "connections. The schedule trades these against each other and the " +
          "tradeoff is rarely optimized explicitly.",
        detectionSignal:
          "Schedules set by historical pattern or operational convenience rather " +
          "than an explicit connectivity-vs-cost optimization; banks that no " +
          "longer match demand; de-peaking done for ops reasons without a revenue " +
          "tradeoff measured.",
        diagnosticQuestion:
          "How do you set your hub banking — is the connectivity-versus-utilization " +
          "tradeoff explicitly optimized against revenue, or set by history and " +
          "operational convenience?",
      },
      {
        key: "fleet_assignment_gauge_mismatch",
        name: "Fleet-assignment gauge mismatch",
        description:
          "The wrong-size aircraft is assigned to legs: too-small aircraft spill " +
          "high-demand demand the carrier could have carried, too-large fly empty " +
          "seats. Fleet commonality, maintenance routing, and crew-base " +
          "constraints make a perfect match impossible, but poor assignment leaves " +
          "large recapturable value on the table.",
        detectionSignal:
          "Persistent spill on legs with smaller gauge while larger aircraft fly " +
          "light elsewhere; fleet assignment done seasonally by hand or rule of " +
          "thumb rather than re-optimized against current demand; no spill/recapture " +
          "measurement.",
        diagnosticQuestion:
          "How often do you re-optimize fleet assignment against current demand, " +
          "and do you measure spill from under-gauging and empty-seat cost from " +
          "over-gauging?",
      },
      {
        key: "capacity_indiscipline",
        name: "Capacity indiscipline & RASM dilution",
        description:
          "Adding ASMs faster than demand — chasing share, defending a market, or " +
          "absorbing delivered aircraft — dilutes unit revenue across the whole " +
          "network, not just the new flying. The marginal capacity decision is " +
          "often made route-locally without its network-wide RASM cost.",
        detectionSignal:
          "Capacity growth outpacing demand growth with falling system RASM; new " +
          "capacity added to defend share rather than on a profitability case; " +
          "delivered aircraft deployed to 'keep them flying' regardless of market.",
        diagnosticQuestion:
          "When you add capacity, do you price in the RASM dilution it causes " +
          "across the rest of the network, or judge it on the new flying's " +
          "standalone economics?",
      },
      {
        key: "slot_gate_scarcity",
        name: "Slot & gate scarcity and competitive blocking",
        description:
          "At constrained hubs, slots and gates are scarce, regulated, and " +
          "strategically contested — competitors hold them to block entry, and " +
          "use-it-or-lose-it rules force flying even unprofitable schedules to " +
          "retain the asset. Network ambition collides with physical and " +
          "regulatory access limits.",
        detectionSignal:
          "Desired markets blocked by lack of slots/gates; flying retained only " +
          "to defend slots; slot portfolio managed reactively rather than as a " +
          "strategic asset; gate constraints capping hub bank size.",
        diagnosticQuestion:
          "Which growth markets are blocked by slot or gate scarcity, and are you " +
          "managing your slot/gate portfolio as a strategic asset or just operating " +
          "what you hold?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_demand_forecasting_network",
        name: "AI O&D demand forecasting for network planning",
        valueMechanism:
          "Forecast origin-destination market demand and willingness-to-pay " +
          "months to years ahead from booking curves, search/shopping signals, " +
          "macro and competitor data — and crucially produce a demand BAND with " +
          "scenarios, not a point estimate — so route, frequency, and gauge bets " +
          "are sized against honest uncertainty and fewer routes are launched " +
          "into demand that was never there.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical O&D bookings, fares, and traffic by market and season",
          "Forward signals (search/shopping, schedule filings, events, macro indicators)",
          "Competitor schedule and capacity data",
          "Spill and recapture history on existing routes",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Forecasts are bands under genuine uncertainty — they must be presented with scenarios, never as a single committed number that masks the risk",
          "Network planners own the demand assumption that goes into a capital case; the model informs, it does not commit the airline",
          "Overfitting to a calm period understates shock risk (fuel, macro, pandemic) on long-lead commitments",
        ],
        metricsMoved: [
          "route_profitability_margin",
          "load_factor_by_route",
          "network_rasm",
        ],
      },
      {
        key: "network_schedule_optimization",
        name: "Network & schedule optimization (connectivity-aware)",
        valueMechanism:
          "Optimize the route network and schedule — frequencies, departure " +
          "timings, hub banking — against full network contribution including " +
          "connecting O&D revenue, not standalone route P&L, so the schedule " +
          "maximizes sellable connectivity and revenue against utilization and " +
          "cost instead of being set by history and convenience.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "O&D demand and connecting-itinerary value (spill/recapture model)",
          "Current schedule, slot holdings, and minimum-connect-time rules",
          "Route cost allocation and aircraft ownership cost",
          "Competitor schedules and connection options",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "A schedule that optimizes revenue can be operationally fragile (over-banked) — operability and the day-of teams must vet it",
          "Connectivity value is modeled, not observed; the spill/recapture assumptions must be transparent and challengeable",
          "Final schedule publication is a commercial leadership decision with slot, crew-base, and operability constraints",
        ],
        metricsMoved: [
          "od_connectivity_coverage",
          "schedule_efficiency",
          "network_rasm",
          "route_profitability_margin",
        ],
      },
      {
        key: "ai_fleet_assignment",
        name: "AI fleet assignment & gauge optimization",
        valueMechanism:
          "Assign aircraft gauge to legs by optimizing recaptured spill against " +
          "empty-seat cost under fleet-commonality, maintenance-routing, and " +
          "crew-base constraints — and re-optimize as demand shifts — so the " +
          "right-size aircraft flies each leg and the highest-leverage " +
          "capacity-fit value is captured without ordering new aircraft.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Leg-level demand forecast and spill/recapture estimates",
          "Fleet composition, seat configurations, and commonality groups",
          "Maintenance routing and crew-base/qualification constraints",
          "Aircraft ownership and operating cost by type",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Assignment must respect maintenance routing and crew legality/base constraints — an optimal gauge plan that breaks aircraft rotation is not feasible",
          "Spill/recapture estimates are modeled and should be validated against realized demand",
          "Fleet planners retain the decision where commonality or operability outweighs the gauge-fit gain",
        ],
        metricsMoved: [
          "aircraft_assignment_efficiency",
          "fleet_utilization_block_hours",
          "load_factor_by_route",
        ],
      },
      {
        key: "route_profitability_analytics",
        name: "Network profitability & route economics analytics",
        valueMechanism:
          "Build a consistent, contestable route and O&D profitability view that " +
          "allocates cost fairly and surfaces full network contribution " +
          "(including connectivity value of feeders), so entry/exit and frequency " +
          "decisions are made on honest economics rather than a standalone P&L " +
          "that under-values the network.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Prorated O&D revenue and route-level revenue accounting",
          "Route cost allocation model (fuel, crew, ownership, station, distribution)",
          "Connectivity / connecting-traffic contribution model",
          "Capacity plan and schedule",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Cost allocation method materially changes which routes look profitable — the methodology must be transparent and consistently applied",
          "Connectivity contribution is an allocation/model choice, not an observed fact; it can be gamed to justify a favored route",
          "Entry/exit remains a commercial decision weighing strategy, competition, and slots beyond the P&L number",
        ],
        metricsMoved: [
          "route_profitability_margin",
          "breakeven_load_factor",
          "od_connectivity_coverage",
        ],
      },
      {
        key: "capacity_discipline_planning",
        name: "Capacity discipline & network-RASM-aware planning",
        valueMechanism:
          "Model the network-wide RASM impact of marginal capacity decisions so " +
          "the carrier adds ASMs matched to demand rather than chasing share, " +
          "pricing in the dilution new capacity causes across the rest of the " +
          "network and protecting system unit revenue.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "System and market-level demand elasticity and competitor capacity",
          "Current and planned ASM by market with RASM history",
          "Fleet delivery/retirement schedule (capacity that must be absorbed)",
          "Macro and fuel scenarios",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Cannibalization and competitive-response assumptions are uncertain and must be presented as scenarios",
          "Delivered-aircraft pressure to 'keep them flying' must not override the dilution signal — that is a leadership tradeoff",
          "Capacity decisions interact with antitrust and market-defense considerations beyond the model",
        ],
        metricsMoved: [
          "asm_capacity_growth",
          "network_rasm",
          "stage_length",
        ],
      },
      {
        key: "slot_gate_portfolio_optimization",
        name: "Slot & gate portfolio optimization",
        valueMechanism:
          "Optimize the use and trading of scarce slots and gates at constrained " +
          "airports — matching the highest network-contribution flying to held " +
          "slots, protecting use-it-or-lose-it thresholds, and identifying " +
          "swaps/acquisitions — so the carrier extracts maximum network value " +
          "from an irreversible, regulated, scarce asset.",
        adoptionProfile: "early",
        dataDependencies: [
          "Slot and gate holdings, coordination records, and use-it-or-lose-it status",
          "Network contribution by slot-using flight (connectivity-aware)",
          "Regulatory slot rules (WASG/Level 3) and trading market data",
          "Competitor slot positions where disclosed",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Slot allocation, trading, and forfeiture are governed by regulator and coordinator rules — recommendations must stay inside WASG/Level 3 constraints",
          "Slots are near-irreversible strategic assets; trading or dropping them is a leadership decision, not an optimizer output",
          "Defensive slot-holding (blocking entry) raises competition-policy considerations beyond the model",
        ],
        metricsMoved: [
          "slot_utilization",
          "od_connectivity_coverage",
          "route_profitability_margin",
        ],
      },
      {
        key: "codeshare_alliance_network_design",
        name: "Codeshare & alliance/JV network design",
        valueMechanism:
          "Design the codeshare, interline, and joint-venture network — which " +
          "markets to serve through partners, how to align schedules for " +
          "connectivity, and how to set proration/revenue-share — so the carrier " +
          "extends reach and connectivity without the capital of flying it, " +
          "while protecting its own yield.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Partner schedules, networks, and connecting O&D opportunity",
          "Proration and revenue-settlement data",
          "Antitrust-immunity / JV scope and metal-neutral terms",
          "Own network gaps the partnership fills",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Joint ventures operate under antitrust immunity with defined scope — network design must stay inside the immunized boundary",
          "Revenue-share/proration terms are contractual and competitively sensitive; modeling informs negotiation, it does not set policy",
          "Partner strategy risk is real — leaning on a partner's network creates dependency that must be weighed by leadership",
        ],
        metricsMoved: [
          "codeshare_alliance_revenue_share",
          "od_connectivity_coverage",
          "network_rasm",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "network_planning_decision_platform",
        name: "Network planning & profitability decision platform",
        description:
          "An integrated platform that fuses O&D demand forecasting, route/network " +
          "profitability with consistent cost allocation, connectivity (spill/" +
          "recapture) modeling, and scenario analysis into one decision surface " +
          "for entry/exit, frequency, and capacity calls — replacing spreadsheet- " +
          "and standalone-P&L-driven decisions with a network-contribution view " +
          "that planners challenge and approve.",
        boundary:
          "Owns the demand, profitability, and connectivity ANALYSIS and the " +
          "scenarios behind a recommendation; does not commit capital or publish " +
          "schedules — entry/exit and capacity bets remain commercial leadership " +
          "decisions.",
        humanAccountabilityPoint: "SVP / VP Network Planning",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "schedule_optimization_engine",
        name: "Connectivity-aware schedule & fleet-assignment engine",
        description:
          "An optimization engine that designs the schedule (frequencies, timings, " +
          "hub banking) and assigns fleet gauge against full network contribution " +
          "and operability constraints, re-optimizing as demand shifts — turning " +
          "history-and-convenience scheduling into an explicit revenue-vs-cost-vs-" +
          "operability optimization that planners and operations vet.",
        boundary:
          "Owns schedule and fleet-assignment RECOMMENDATIONS within slot, " +
          "maintenance-routing, crew-base, and operability constraints; does not " +
          "publish the schedule or override operability sign-off — that stays with " +
          "scheduling leadership and operations.",
        humanAccountabilityPoint: "VP Schedule Planning / Fleet Assignment",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "slot_gate_alliance_strategy",
        name: "Slot, gate & alliance strategy workbench",
        description:
          "A workbench for managing scarce slots/gates as strategic assets and " +
          "designing codeshare/JV network reach — matching highest-contribution " +
          "flying to held slots, protecting use-it-or-lose-it thresholds, sizing " +
          "swaps/acquisitions, and modeling partner network design inside " +
          "regulatory and antitrust-immunity bounds.",
        boundary:
          "Owns slot-utilization, swap, and partnership-design ANALYSIS within " +
          "WASG/Level 3 and antitrust-immunity rules; does not execute slot trades " +
          "or sign partnership terms — those are regulated, leadership-owned " +
          "commercial actions.",
        humanAccountabilityPoint: "VP Alliances & Network Strategy (with slot coordination authority)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "network_commercial_data_foundation",
        name: "Network & commercial data foundation",
        description:
          "A unified data layer fusing O&D bookings and prorated revenue, route " +
          "cost allocation, schedule and slot holdings, fleet plan, competitor " +
          "schedules, and forward demand signals — grounding every forecasting, " +
          "profitability, schedule, and slot/alliance model in one consistent, " +
          "contestable view.",
        boundary:
          "Owns ingestion, proration/allocation consistency, and serving of " +
          "network and commercial data with lineage; does not make planning " +
          "decisions — it is the substrate the decision platforms read.",
        humanAccountabilityPoint: "VP Commercial Planning Technology / Chief Data Officer",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value in network and schedule planning is created at the moment of the " +
        "BET — choosing the right markets, frequencies, gauge, schedule, slots, " +
        "and partners before the traffic exists. Sharper O&D forecasting and " +
        "connectivity-aware optimization recapture spill, lift route and network " +
        "RASM, and avoid launching capacity into demand that was never there; " +
        "fleet-assignment and capacity discipline protect unit revenue without " +
        "new capital. But these are LONG-LEAD, LARGELY IRREVERSIBLE commitments " +
        "under genuine demand uncertainty: the durable win is making better bets " +
        "more often with honest scenario bands, not eliminating the uncertainty. " +
        "Every projected gain is haircut by forecast error, the irreversibility " +
        "of fleet/slot commitments, competitive response, and the regulatory " +
        "scarcity of slots and gates — and the go/no-go remains a commercial " +
        "leadership decision the model informs but does not own.",
      dominantHaircutFactors: [
        {
          factor: "Demand forecast error & irreversibility",
          rationale:
            "Network bets are committed long before traffic materializes and are " +
            "costly to reverse; forecast error on a long-lead, irreversible " +
            "commitment directly destroys projected value, and no model removes " +
            "the underlying uncertainty.",
          typicalHaircut: {
            low: 0.25,
            high: 0.5,
            basis:
              "Network-planning experience where launched routes/gauge missed " +
              "the demand case on long-lead, hard-to-reverse commitments",
            label: "planning-range",
          },
        },
        {
          factor: "Competitive & capacity response",
          rationale:
            "Profitable routes attract entry and capacity matching; a new route's " +
            "modeled economics erode as competitors respond, and system RASM " +
            "gains dilute if rivals add ASMs in parallel.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed erosion of new-route and capacity advantages as " +
              "competitors enter and match capacity",
            label: "planning-range",
          },
        },
        {
          factor: "Slot, gate & regulatory access constraints",
          rationale:
            "Optimal network designs are blocked by lack of slots/gates, " +
            "use-it-or-lose-it obligations, and antitrust-immunity boundaries; the " +
            "achievable network is smaller than the theoretical optimum.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Experience where slot/gate scarcity and regulatory rules bounded " +
              "the realizable network plan",
            label: "planning-range",
          },
        },
        {
          factor: "Data & cost-allocation consistency",
          rationale:
            "Profitability and connectivity value depend on consistent prorated " +
            "revenue and cost allocation; inconsistent or gameable allocation caps " +
            "how much of the modeled value is trustworthy and actionable.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis:
              "Implementation experience where proration/cost-allocation " +
              "inconsistency undermined route-decision confidence",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Fleet-assignment spill recapture",
          range: {
            low: 0.01,
            high: 0.04,
            basis:
              "Reported gauge-optimization revenue gains from better matching " +
              "aircraft size to leg demand",
            label: "planning-range",
          },
          measuredAs: "Relative uplift in route/network revenue from recaptured spill (aircraft_assignment_efficiency)",
        },
        {
          lever: "Schedule connectivity optimization uplift",
          range: {
            low: 0.005,
            high: 0.025,
            basis:
              "Connectivity-aware schedule redesign revenue uplift on optimized hubs",
            label: "planning-range",
          },
          measuredAs: "Relative uplift in network_rasm from added sellable connectivity",
        },
        {
          lever: "Avoided unprofitable-route / capacity losses",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Reduction in losses from routes/capacity not launched once a " +
              "scenario-banded forecast flagged the demand risk",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in losses on marginal route/capacity decisions",
        },
        {
          lever: "Network-RASM protection from capacity discipline",
          range: {
            low: 0.005,
            high: 0.02,
            basis:
              "Unit-revenue protection from matching capacity growth to demand " +
              "rather than chasing share",
            label: "planning-range",
          },
          measuredAs: "Relative protection of network_rasm versus undisciplined capacity growth",
        },
      ],
      timeToValueBand:
        "Network profitability analytics and fleet-assignment optimization: 2-4 " +
        "quarters (much of the data and some engines often exist, and gauge " +
        "decisions cycle seasonally). Connectivity-aware schedule optimization " +
        "and demand-forecasting bands: 3-6 quarters including model calibration " +
        "and planner trust. Slot/gate and alliance strategy value realizes over " +
        "the multi-year horizon of the underlying commitments — the bets are " +
        "long-lead by nature, so value is measured across seasons, not weeks.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Network planning / route profitability system",
          role: "System of record for route and O&D profitability, cost allocation, and entry/exit decision analysis.",
          examples: ["Sabre AirVision Profit Manager", "Cirium / Diio Mi network analytics", "internal route P&L models"],
        },
        {
          name: "Schedule planning & optimization system",
          role: "Builds, edits, and optimizes the published schedule, frequencies, banking, and fleet assignment.",
          examples: ["Sabre AirVision Schedule Manager / Fleet Manager", "Lufthansa Systems NetLine/Plan", "Jeppesen Airline Scheduling"],
        },
        {
          name: "Fleet assignment & rotation system",
          role: "Assigns aircraft gauge to legs and builds maintenance-feasible aircraft rotations.",
          examples: ["Sabre AirVision Fleet Manager", "Lufthansa Systems NetLine/Plan (Fleet)", "Jeppesen Fleet"],
        },
        {
          name: "Slot management & coordination system",
          role: "Tracks held slots, coordination clearances, and use-it-or-lose-it status at constrained airports.",
          examples: ["PDC slot tools", "Lufthansa Systems NetLine/Sched (slots)", "airport coordinator (ACL/coordinators) feeds"],
        },
        {
          name: "Market & competitor data / demand intelligence",
          role: "External O&D traffic, fares, schedules, and forward demand signals that ground the demand forecast.",
          examples: ["Cirium / Diio", "DDS / MIDT booking data", "OAG schedules", "ARC/IATA market data"],
        },
        {
          name: "Revenue accounting & proration system",
          role: "Prorates O&D and codeshare/interline revenue to flights for route and partnership profitability.",
          examples: ["Amadeus Revenue Accounting", "SITA / Mercator revenue accounting", "internal proration engines"],
        },
      ],
      roles: [
        {
          title: "SVP / VP Network Planning",
          accountability: "The network footprint and capacity plan — which markets to serve and route profitability.",
        },
        {
          title: "VP Schedule Planning",
          accountability: "Schedule design, frequencies, hub banking, and connectivity of the published schedule.",
        },
        {
          title: "Director / VP Fleet Assignment & Planning",
          accountability: "Matching aircraft gauge and fleet to the schedule and the fleet order/retirement plan.",
        },
        {
          title: "VP Alliances & Partnerships",
          accountability: "Codeshare, interline, and joint-venture network design and revenue-share terms.",
        },
        {
          title: "Director Slot & Airport Strategy",
          accountability: "Slot and gate portfolio at constrained airports and use-it-or-lose-it compliance.",
        },
        {
          title: "Chief Commercial Officer",
          accountability: "Overall commercial strategy and the go/no-go on capital-heavy network and fleet bets.",
        },
      ],
      regulatoryFrames: [
        {
          name: "IATA Worldwide Airport Slot Guidelines (WASG) & Level 3 coordination",
          relevance:
            "Govern slot allocation, the 80% use-it-or-lose-it rule, and trading at " +
            "coordinated airports — the rules that make slots a scarce, regulated " +
            "network asset.",
        },
        {
          name: "Antitrust immunity / joint-venture regulation (DOT, EU/EC competition authorities)",
          relevance:
            "Defines the immunized scope within which alliance/JV partners may " +
            "coordinate schedules, capacity, and pricing — the boundary network " +
            "design with partners must stay inside.",
        },
        {
          name: "Air service / route rights & bilateral agreements (Open Skies)",
          relevance:
            "Govern which carriers may fly which international markets and with " +
            "what rights — a hard constraint on where the network can grow.",
        },
        {
          name: "Capacity & competition oversight (merger remedies, slot divestiture)",
          relevance:
            "Regulators can require slot divestitures or constrain capacity in " +
            "concentrated markets, shaping the feasible network and capacity plan.",
        },
      ],
      canonicalTerms: [
        {
          term: "O&D (origin-destination)",
          definition:
            "A passenger's true origin-to-destination market, possibly via connections — the unit network value is measured in, distinct from a single flight leg.",
        },
        {
          term: "Spill & recapture",
          definition:
            "Demand turned away when a flight (or gauge) is too small (spill) and the share of it the carrier recovers on another flight (recapture) — the core of fleet-assignment value.",
        },
        {
          term: "Hub banking / connection bank",
          definition:
            "Clustering arrivals and departures into time windows to maximize feasible connections, trading aircraft utilization and ops smoothness for connectivity.",
        },
        {
          term: "Gauge / up-gauging",
          definition:
            "The seating size of the aircraft on a route; up-gauging adds seats per departure (often cheaper unit cost) versus adding frequency.",
        },
        {
          term: "Slot (Level 3 / coordinated airport)",
          definition:
            "A right to an arrival or departure at a capacity-constrained airport, allocated and governed by WASG with use-it-or-lose-it rules.",
        },
        {
          term: "Breakeven load factor",
          definition:
            "The load factor at which a route or the network covers operating cost at the prevailing yield — the viability line a route must clear.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Route / O&D profitability",
        authoritativeSource: "Route profitability system: prorated O&D revenue joined to a documented route cost allocation model",
        whatGoodEvidenceLooksLike:
          "Route and O&D margin with the cost allocation method stated, connectivity contribution shown separately, over a trailing period and normalized for stage length.",
        weakEvidenceToReject:
          "A standalone route margin with no allocation method disclosed and no connectivity/network-contribution view — which under-values feeders.",
      },
      {
        claim: "Demand forecast for a network/fleet bet",
        authoritativeSource: "O&D demand model output with scenario bands joined to historical forecast-vs-actual on comparable routes",
        whatGoodEvidenceLooksLike:
          "A demand BAND with named scenarios and assumptions, plus the carrier's historical forecast accuracy on similar launches as a calibration check.",
        weakEvidenceToReject:
          "A single demand point estimate presented as fact, with no scenario band and no track record of forecast accuracy behind it.",
      },
      {
        claim: "Fleet-assignment / gauge value",
        authoritativeSource: "Fleet-assignment optimizer output compared to realized demand and measured spill/recapture",
        whatGoodEvidenceLooksLike:
          "Spill recaptured and empty-seat cost avoided versus a baseline assignment, validated against realized demand and respecting maintenance-routing/crew constraints.",
        weakEvidenceToReject:
          "A modeled gauge-optimization saving with no realized-demand validation and no check that the rotation is maintenance-feasible.",
      },
      {
        claim: "Capacity / RASM impact of a capacity decision",
        authoritativeSource: "Network demand-elasticity model joined to system RASM history and competitor capacity data",
        whatGoodEvidenceLooksLike:
          "The network-wide RASM impact of the marginal ASMs (not just the new flying), with competitive-response and cannibalization scenarios stated.",
        weakEvidenceToReject:
          "A capacity case judged only on the new flying's standalone economics with no system-wide dilution or competitive-response analysis.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "When you launch a route or change gauge, how wide is your demand forecast band, and how often does actual traffic land outside the case you committed to?",
      "Do you decide routes on standalone P&L or on full network contribution including the connecting traffic a feeder creates — and can you quantify a feeder's connectivity value?",
      "How is your fleet assignment set — re-optimized against current demand with spill/empty-seat cost measured, or set seasonally by rule of thumb?",
      "When you add capacity, do you price in the network-wide RASM dilution it causes, or judge it on the new flying's standalone economics?",
      "How do you set hub banking — is the connectivity-versus-utilization tradeoff explicitly optimized against revenue, or set by history and operational convenience?",
      "Which growth markets are blocked by slot or gate scarcity, and are you managing your slot/gate portfolio as a strategic asset or just operating what you hold?",
      "How much of your network value runs through codeshare/JV partners, and how exposed is the network to partner strategy and antitrust-immunity scope?",
    ],
    maturitySignals: [
      "Route and capacity decisions are made on full network contribution (with connectivity value) using a consistent, documented cost allocation, not standalone route P&L.",
      "Demand forecasts driving long-lead bets are scenario bands calibrated against the carrier's own forecast-vs-actual history, not single point estimates.",
      "Fleet assignment and schedule banking are explicitly optimized against revenue, utilization, and operability, and re-optimized as demand shifts.",
      "Slots, gates, and alliance reach are managed as strategic assets with network-contribution-aware portfolio decisions, not operated reactively.",
    ],
    redFlags: [
      "Routes are judged purely on standalone margin with no connectivity/network-contribution view, so profitable feeders get cut.",
      "Network and fleet bets are committed on single-point demand estimates with no scenario band or forecast-accuracy track record.",
      "Capacity is added to defend share or absorb delivered aircraft with no analysis of the RASM dilution it causes across the network.",
      "Slots are flown unprofitably only to defend use-it-or-lose-it, and the slot/gate portfolio is managed reactively rather than as a strategic asset.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Network planning & scheduling suite (Sabre AirVision, Lufthansa Systems NetLine, Jeppesen)",
        category: "Network planning, schedule optimization, fleet assignment, profitability",
        switchingCost:
          "High — the planning suite is fused to the carrier's schedule, fleet plan, cost-allocation methodology, and planner workflows; replacement is a multi-year program with deep data migration and retraining.",
        renewalDynamics:
          "Multi-year enterprise agreements bundled across planning/scheduling/fleet modules; switching is rare and gated on optimization-parity proof and methodology migration.",
      },
      {
        vendorName: "Market & demand intelligence (Cirium/Diio, OAG, MIDT/DDS providers)",
        category: "O&D traffic, fares, competitor schedules, demand signals",
        switchingCost:
          "Moderate — data feeds are swappable with mapping effort, but planners build deep workflow and history dependence on a chosen source; the lock-in is analyst habit and historical comparability.",
        renewalDynamics:
          "Subscription data deals, often per-seat or volume-based; competition among data providers gives real negotiation room.",
      },
      {
        vendorName: "Revenue accounting & proration (Amadeus, SITA/Mercator)",
        category: "O&D and codeshare/interline revenue proration",
        switchingCost:
          "High — holds the revenue allocation logic that underpins route and partnership profitability; migration risks breaking historical comparability of route economics.",
        renewalDynamics:
          "Long-tenure platform contracts; proration accuracy and codeshare settlement capability are the differentiators that matter at renewal.",
      },
      {
        vendorName: "Network/commercial analytics & AI specialists",
        category: "Demand forecasting, connectivity optimization, profitability analytics",
        switchingCost:
          "Moderate — integrate via data feeds and are swappable with mapping effort; watch model lock-in and access to the assumptions behind connectivity/cost-allocation outputs.",
        renewalDynamics:
          "Emerging, fast-moving market; favor outcome alignment, transparency of forecasting/allocation assumptions, and exit rights over multi-year lock-in.",
      },
    ],
    switchingCosts:
      "The network-planning and revenue-accounting cores are effectively non-switchable in isolation — they hold the schedule, fleet plan, cost-allocation methodology, and historical route-economics comparability the whole commercial organization trusts. The negotiable frontier is the demand-intelligence data layer and the AI/optimization layer (forecasting, connectivity optimization, profitability analytics) around that core, where switching cost is moderate and transparency/outcome terms are achievable.",
    negotiationLevers: [
      "Transparency of forecasting and cost-allocation assumptions as a contractual requirement (no black-box route economics)",
      "Outcome alignment tied to measured spill-recapture, connectivity, or forecast-accuracy improvement",
      "Data portability and exit rights to avoid model lock-in on AI/optimization add-ons",
      "Pilot on a region or hub before enterprise commitment, with optimization-parity and methodology-continuity proof gating scale",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      route_profitability_claim: ["prorated O&D revenue", "documented cost allocation method", "connectivity contribution", "trailing period"],
      demand_forecast_claim: ["scenario band (not point estimate)", "stated assumptions", "historical forecast-vs-actual calibration"],
      fleet_assignment_claim: ["optimizer output vs realized demand", "measured spill/recapture", "maintenance-routing/crew feasibility"],
      capacity_claim: ["network-wide RASM impact", "competitive-response/cannibalization scenarios", "demand-matched basis"],
      slot_alliance_claim: ["slot/coordination records or partner terms", "network-contribution basis", "WASG/antitrust-immunity bounds"],
      value_projection: ["baseline metric", "benchmark planning-range", "explicit haircut factors incl. forecast error/irreversibility"],
    },
    citationStandard:
      "Quantitative network claims cite the prorated-revenue and cost-allocation " +
      "source with the allocation method named, plus the period and breakdown " +
      "(route, O&D, market). Demand claims cite a scenario band with assumptions " +
      "and the carrier's forecast-accuracy track record — never a single point " +
      "estimate presented as fact. Fleet and capacity claims cite optimizer output " +
      "validated against realized demand and network-wide (not standalone) impact. " +
      "Value projections cite a baseline plus a labelled planning range and the " +
      "haircut factors applied — and explicitly account for forecast error and the " +
      "irreversibility of the underlying long-lead commitment.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no scenario-banded demand model or forecast-accuracy history — frame demand and route-launch outcomes as an industry pattern under uncertainty, not their measured number.",
      "Benchmarks are quoted without the tenant's own route economics — present as planning ranges normalized for stage length, hub structure, and cost-allocation method.",
      "A route or capacity case is judged standalone — flag that network contribution (connectivity value) and network-wide RASM dilution are missing from the number.",
      "Any projected gain assumes a long-lead network/fleet/slot commitment lands as forecast — flag the irreversibility and forecast-error ceiling on realizable value.",
    ],
    inferenceLanguage: [
      "Across network carriers at this scale, route and network economics typically run...",
      "Without your scenario-banded demand history, the industry pattern suggests a launch-risk range of...",
      "Peer carriers with comparable hub structure and stage length commonly see...",
      "Because this is a long-lead, largely irreversible bet under demand uncertainty, the realizable share is typically...",
    ],
    flagWithoutEvidence: [
      "A specific dollar profit or ROI for this carrier's route or network bet",
      "This carrier's actual route profitability, demand, spill, or network RASM",
      "A claim that a long-lead network/fleet/slot commitment will land as forecast without scenario bands or the irreversibility risk stated",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "route / network profitability ranking or contribution by route",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Rank routes (or O&D markets) by network contribution margin, showing standalone vs connectivity-inclusive contribution side by side.",
    },
    {
      questionPattern: "network RASM or load-factor / route-economics trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend network RASM, load factor, and breakeven load factor over periods to show whether network economics are improving or diluting.",
    },
    {
      questionPattern: "value / profit bridge of a network or fleet-assignment program",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      note: "Bridge from current network economics to recoverable value with forecast-error/irreversibility, competitive-response, and slot/data haircuts.",
    },
    {
      questionPattern: "which network levers move profitability most (sensitivity)",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of demand, gauge/fleet-assignment, schedule connectivity, capacity, and slot levers by impact range to prioritize the network agenda.",
    },
    {
      questionPattern: "network & commercial KPI scorecard",
      exhibitKind: "table",
      note: "Route margin, network RASM, fleet utilization, schedule efficiency, O&D connectivity, load/breakeven load factor, slot utilization, codeshare share, ASM growth, gauge-fit and stage length vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A consistent, contestable network/commercial data foundation (prorated O&D revenue, documented cost allocation, schedule, slots, competitor data) the models can trust",
      "Network, schedule, fleet, and alliance leadership aligned on full network contribution (with connectivity value) as the decision basis rather than standalone route P&L",
      "Demand forecasting delivered as honest scenario bands calibrated against the carrier's own forecast-vs-actual history, so planners trust and act on it",
      "Profitability analytics and fleet-assignment optimization landing fast measurable seasonal wins to fund the harder, longer-horizon network and slot work",
    ],
    failureDrivers: [
      "Treating route economics as standalone P&L so profitable feeders are cut and the network value is destroyed invisibly",
      "Committing long-lead, irreversible fleet/slot/route bets on single-point demand estimates with no scenario band and no track record",
      "Adding capacity to chase share or absorb delivered aircraft without pricing the network-wide RASM dilution",
      "Black-box forecasting or cost allocation planners cannot challenge, so the recommendations are distrusted or gamed, and gains that assume the uncertainty away never materialize",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Profitability analytics and fleet-assignment optimization adopt first " +
      "because the data largely exists, the cadence is seasonal, and the value is " +
      "measurable; scenario-banded demand forecasting and connectivity-aware " +
      "schedule optimization follow as planners build trust in the assumptions; " +
      "slot/gate and alliance strategy is the slowest because the underlying " +
      "commitments are long-lead, regulated, and leadership-owned — value there is " +
      "realized over seasons and years, not weeks, and scales only after the " +
      "analytics layer has earned credibility.",
    roiClarity: "medium",
    roiClarityBasis:
      "Fleet-assignment and profitability-analytics ROI are relatively firm " +
      "because spill recapture and route economics are directly measurable once " +
      "cost allocation is consistent. Demand-forecasting, schedule, capacity, and " +
      "slot/alliance ROI are harder to attribute: the value is a BETTER BET under " +
      "genuine demand uncertainty — avoided losses and protected RASM that must be " +
      "measured against a counterfactual network, on long-lead, largely " +
      "irreversible commitments. Cost-allocation method choice and competitive " +
      "response further blur attribution, so the case is honest-but-modeled, not a " +
      "point estimate.",
  },

  regulatoryFrame: {
    name: "Slot, route-rights & competition regulation (IATA WASG/Level 3, antitrust immunity, Open Skies/bilaterals)",
    relevance:
      "The dominant frame bounding network and schedule planning: slot allocation " +
      "and use-it-or-lose-it rules make airport access a scarce, regulated asset; " +
      "antitrust-immunity scope bounds how partners may coordinate networks; air " +
      "service agreements and bilaterals govern which international markets a " +
      "carrier may fly; and competition authorities can require slot divestiture " +
      "or constrain capacity. AI optimizes the network inside these constraints — " +
      "it does not relax them — and the final, capital-heavy go/no-go remains a " +
      "commercial leadership decision (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave4)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
