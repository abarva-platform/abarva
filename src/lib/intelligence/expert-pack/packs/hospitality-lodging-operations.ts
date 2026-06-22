// Consilium expert — Hospitality & Lodging Operations (industry × function).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). An industry-function
// expert for HOTEL AND RESORT operations at enterprise scale: the company that
// owns, manages, and/or franchises lodging across a portfolio of properties.
// It owns rooms-division operations (front office, housekeeping, maintenance),
// revenue management and RevPAR optimization, distribution and channel mix (OTA
// vs direct, GDS, brand.com, wholesale/group), loyalty and the guest
// relationship, brand-standard vs owner-economics tension, labor management, the
// guest experience, and the CRS/PMS/RMS technology estate. Property-system-aware
// (Opera/Oracle Hospitality, Amadeus, Sabre, Duetto), not product-locked.
//
// DISTINCT FROM FOODSERVICE-HOSPITALITY-OPERATIONS: that expert covers
// CONTRACT/MANAGED restaurant, cafe, catering, and dining operations (food cost,
// menu, food safety). THIS expert is LODGING — the room is the perishable unit
// of inventory, the night is the unit of time, and F&B appears only as the
// in-hotel restaurant/banquet line WITHIN a property, not as the business. It
// deliberately does NOT cover casino gaming floor economics, real-estate
// acquisition/development capital, or airline/cruise travel.
//
// CORE HONESTY — OTA COMMISSION + CHANNEL-MIX EROSION IS THE STRUCTURAL MARGIN
// DRAIN, LABOR IS THE #1 COST AND SCARCEST INPUT, REVPAR OPTIMIZATION IS REAL BUT
// CAPPED BY DATA FRAGMENTATION, AND PERSONALIZATION MOSTLY STALLS AT LOYALTY-TIER.
// The dominant structural truth is that online travel agencies (OTAs) take a
// 15-25% commission and own the customer relationship, so every point of channel
// mix that shifts toward intermediaries is a permanent margin leak — and the
// "direct-booking shift" everyone sells is hard, slow, and routinely overstated
// because the OTA's marketing reach and the billboard effect are real. Labor is
// the largest controllable cost and, post-pandemic, the scarcest input: you can
// price a room perfectly and still fail if you cannot staff housekeeping to flip
// it. RevPAR/ADR optimization through revenue management is genuinely valuable,
// but it is capped by PMS/CRS/RMS data fragmentation and by the group-vs-
// transient mix decision (block the wrong rooms for a group and you displace
// higher-rate transient demand). The brand-standard-vs-owner-economics tension is
// constant (the brand mandates standards the owner pays for and may not earn back).
// And "personalization" in lodging mostly stalls at loyalty-tier recognition, not
// true 1:1 — the data and the moment-of-stay execution rarely support more. Every
// value claim is hedged against (1) channel-mix / OTA-commission reality and the
// overstated direct-shift, (2) labor availability and cost, not just labor
// efficiency, (3) PMS/CRS/RMS data fragmentation and group-vs-transient
// displacement that cap RevPAR gains, and (4) the brand-vs-owner economic split
// that determines who actually keeps a margin improvement.

import type {
  ExpertPack,
  ExpertPackIdentity,
} from "@/lib/intelligence/expert-pack/expert-pack";

export const hospitalityLodgingOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.hospitality.lodging-operations",
    expertName: "Hospitality & Lodging Operations Expert",
    kind: "industry-function",
    industry: "hospitality",
    functionKey: "lodging-operations",
    scopeNote:
      "Hotel and resort lodging operations across an owned/managed/franchised " +
      "portfolio: rooms-division operations (front office, housekeeping, " +
      "maintenance), revenue management and RevPAR/ADR optimization, " +
      "distribution and channel mix (OTA vs direct, GDS, brand.com, group/" +
      "wholesale), loyalty and the guest relationship, brand-standard vs " +
      "owner-economics tension, labor management, guest experience, and the " +
      "CRS/PMS/RMS technology estate. The honest center of gravity is that OTA " +
      "commission and channel-mix erosion are the structural margin drain (the " +
      "direct-booking shift is hard and overstated), labor is the #1 cost and " +
      "scarcest post-pandemic input, RevPAR optimization is real but capped by " +
      "PMS/CRS/RMS data fragmentation and group-vs-transient displacement, and " +
      "'personalization' mostly stalls at loyalty-tier recognition rather than " +
      "true 1:1. Excludes casino gaming-floor economics, real-estate " +
      "acquisition/development capital, the in-hotel restaurant as a standalone " +
      "foodservice business (the foodservice-hospitality-operations expert), and " +
      "airline/cruise travel.",
  } satisfies ExpertPackIdentity,

  domain: {
    operatingMetrics: [
      {
        key: "revpar",
        name: "RevPAR (revenue per available room)",
        definition:
          "Total rooms revenue divided by total available room-nights over the " +
          "period — the headline measure that blends rate and occupancy into one " +
          "number, at the property and rolled to the portfolio.",
        unit: "USD / available room-night",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 250,
          basis:
            "Strongly segment- and market-dependent (economy/select-service low, " +
            "upper-upscale/luxury and high-demand markets high); tracked as a " +
            "trend and as an index vs a competitive set, not as an absolute; " +
            "operator and STR-style benchmarking experience",
          label: "planning-range",
        },
        dataSource:
          "PMS/CRS rooms revenue over available room-nights by property/period, " +
          "indexed to a competitive set",
        whyItMatters:
          "The single number the asset is run to, because it captures the core " +
          "trade-off between charging more (ADR) and selling more (occupancy). " +
          "RevPAR index against the competitive set — not absolute RevPAR — is " +
          "the honest measure of whether revenue management is actually winning " +
          "share, since a rising tide lifts the whole market.",
      },
      {
        key: "adr",
        name: "ADR (average daily rate)",
        definition:
          "Total rooms revenue divided by rooms sold over the period — the " +
          "average price actually realized per occupied room-night.",
        unit: "USD / occupied room-night",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 400,
          basis:
            "Segment- and market-dependent and seasonal; tracked as a trend and " +
            "vs the competitive set; in isolation it can be 'bought' by chasing " +
            "occupancy down, so it is read alongside occupancy and RevPAR",
          label: "planning-range",
        },
        dataSource:
          "PMS/CRS rooms revenue over rooms sold by property/segment/period",
        whyItMatters:
          "The rate lever and the cleanest signal of pricing power and positioning. " +
          "It must be read with occupancy: a high ADR achieved by emptying the " +
          "hotel destroys RevPAR, and a low ADR that fills it may still be the " +
          "wrong call once channel cost and displaced higher-rate demand are netted.",
      },
      {
        key: "occupancy_pct",
        name: "Occupancy %",
        definition:
          "Rooms sold divided by rooms available over the period — the share of " +
          "perishable room-night inventory actually sold.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 60,
          high: 85,
          basis:
            "Market- and segment-dependent; in-range because chasing occupancy " +
            "by discounting erodes ADR and channel margin, while very high " +
            "occupancy can signal under-pricing and lost RevPAR upside; operator " +
            "and STR-style experience",
          label: "planning-range",
        },
        dataSource:
          "PMS/CRS rooms sold over rooms available by property/period",
        whyItMatters:
          "Room-nights are perfectly perishable — an unsold night is revenue lost " +
          "forever — so occupancy is the volume side of the equation. But it is " +
          "in-range, not higher-is-better: a hotel run at 95% occupancy is almost " +
          "always leaving rate on the table, and 'heads in beds' bought through " +
          "high-commission OTA channels can be margin-negative.",
      },
      {
        key: "goppar",
        name: "GOPPAR (gross operating profit per available room)",
        definition:
          "Gross operating profit (revenue less departmental and undistributed " +
          "operating expense, before fixed charges) divided by available " +
          "room-nights — the profit-side analogue of RevPAR.",
        unit: "USD / available room-night",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 140,
          basis:
            "Segment- and market-dependent; the honest profit metric because two " +
            "hotels at the same RevPAR can have very different GOPPAR once labor " +
            "and channel cost differ; operator and USALI-based benchmarking",
          label: "planning-range",
        },
        dataSource:
          "Property P&L (USALI structure) gross operating profit over available " +
          "room-nights by property/period",
        whyItMatters:
          "The metric that exposes whether revenue actually becomes profit. RevPAR " +
          "can rise while GOPPAR falls if the incremental demand came through " +
          "high-commission channels or required overtime labor to service — so " +
          "GOPPAR is where channel mix and labor cost show up, and the number an " +
          "owner cares about more than RevPAR.",
      },
      {
        key: "direct_booking_share",
        name: "Direct-booking share",
        definition:
          "Share of room-night bookings (or revenue) that come through the " +
          "brand's own direct channels (brand.com, app, voice, property direct) " +
          "rather than OTAs, GDS, or wholesale intermediaries.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Brand-, segment-, and chain-scale-dependent (large branded loyalty " +
            "programs drive higher direct share; independent and select-service " +
            "lean more on OTAs); the achievable ceiling is widely overstated " +
            "because OTA reach is real; operator experience",
          label: "planning-range",
        },
        dataSource:
          "CRS/channel-manager booking source-of-business mix by property/period",
        whyItMatters:
          "The lever everyone chases because a direct booking avoids the 15-25% " +
          "OTA commission and keeps the guest relationship. But the prize is " +
          "honest only when netted against the cost of driving direct (loyalty " +
          "discounts, marketing, rate parity) and against the billboard effect — " +
          "OTAs also generate demand a property could not reach alone, so a pure " +
          "direct-share target can destroy more demand than it saves in commission.",
      },
      {
        key: "ota_commission_pct",
        name: "OTA commission % of revenue",
        definition:
          "Online-travel-agency (and other intermediary) commission and " +
          "distribution cost as a percentage of rooms revenue — the explicit " +
          "channel-cost line.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 18,
          basis:
            "Blended distribution cost depends on the channel mix and the OTA " +
            "commission rate (commonly 15-25% on the OTA-booked portion); a " +
            "property heavy on OTA sits at the high end; operator experience",
          label: "planning-range",
        },
        dataSource:
          "CRS/channel-manager commission and distribution cost over rooms " +
          "revenue by channel/property/period",
        whyItMatters:
          "The structural margin drain made explicit. It is the single largest " +
          "controllable cost that revenue management and channel strategy fight " +
          "over, but it is lower-is-better only up to the point where cutting OTA " +
          "exposure costs more demand than it saves — the billboard effect means " +
          "zero OTA is rarely the profit-maximizing answer.",
      },
      {
        key: "cost_per_occupied_room",
        name: "Cost per occupied room (CPOR)",
        definition:
          "Total controllable rooms-department operating cost (housekeeping " +
          "labor, supplies, laundry, amenities) divided by rooms occupied — the " +
          "unit cost of servicing a sold room-night.",
        unit: "USD / occupied room",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 80,
          basis:
            "Segment- and service-level-dependent (select-service low, luxury " +
            "high); lower-is-better only down to the point where service standards " +
            "and brand standards hold; operator experience",
          label: "planning-range",
        },
        dataSource:
          "Rooms-department P&L controllable cost over rooms occupied by " +
          "property/period",
        whyItMatters:
          "The unit economics of actually delivering the room. It is where the " +
          "scarcest input — housekeeping and front-desk labor — shows up, and the " +
          "honest check on cost-cutting: shaving CPOR below the level that keeps " +
          "the room clean and the brand standard met trades a short-term saving " +
          "for guest-satisfaction and brand-compliance damage.",
      },
      {
        key: "labor_cost_pct",
        name: "Labor cost % of revenue",
        definition:
          "Total property labor cost (wages, premium/overtime, benefits load, " +
          "and contract/agency labor) as a percentage of total revenue.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 25,
          high: 45,
          basis:
            "Segment- and service-level-dependent (full-service/luxury and " +
            "union markets higher, select-service lower); in-range because " +
            "under-labor breaks service, housekeeping throughput, and brand " +
            "standards; operator experience",
          label: "planning-range",
        },
        dataSource:
          "Property payroll/labor-management system labor cost over total " +
          "revenue by property/period",
        whyItMatters:
          "The #1 controllable cost and, post-pandemic, the scarcest input — the " +
          "binding constraint is often labor AVAILABILITY, not just cost. It is " +
          "in-range, not lower-is-better: cutting labor past the point where " +
          "rooms can be flipped, guests checked in, and brand standards held " +
          "drives reliance on expensive agency labor, overtime, and lost revenue " +
          "from rooms that cannot be turned.",
      },
      {
        key: "loyalty_contribution_pct",
        name: "Loyalty contribution / enrolled-member revenue share",
        definition:
          "Share of room-night revenue (or stays) booked by enrolled loyalty " +
          "members, and the repeat-stay rate of those members — the measure of " +
          "how much of the business the brand owns directly through loyalty.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 65,
          basis:
            "Chain-scale- and brand-dependent (large global flags with mature " +
            "programs at the high end, independents and small flags far lower); " +
            "tracked as member-revenue share and repeat-stay rate; operator " +
            "experience",
          label: "planning-range",
        },
        dataSource:
          "CRS/loyalty platform member-tagged bookings and repeat-stay tracking " +
          "over total bookings by property/brand/period",
        whyItMatters:
          "Loyalty is the brand's primary defense against OTA disintermediation: " +
          "a member booking direct is a high-margin booking the brand owns and " +
          "can re-market to. It is also the realistic ceiling of 'personalization' " +
          "in lodging — recognition and tier benefits, not true 1:1 — so it both " +
          "drives direct share and frames what the guest relationship can deliver.",
      },
      {
        key: "guest_satisfaction_nps",
        name: "Guest satisfaction / NPS",
        definition:
          "Guest-reported satisfaction and net-promoter score from post-stay " +
          "surveys and review platforms, and the review/reputation index, by " +
          "property.",
        unit: "score",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Survey/NPS scales and method vary by brand and platform; tracked as " +
            "a trend and vs the competitive set and brand-standard threshold, not " +
            "as an absolute; review/reputation scores feed OTA ranking",
          label: "planning-range",
        },
        dataSource:
          "Guest-survey platform and review/reputation aggregation (e.g. brand " +
          "GSS, online review indices) by property/period",
        whyItMatters:
          "The leading indicator of repeat demand, rate premium, and brand-" +
          "standard compliance — and, through review scores, a direct input to " +
          "OTA search ranking and conversion. Falling satisfaction is the earliest " +
          "signal that labor or cost cuts have started to damage the product the " +
          "rate is built on.",
      },
      {
        key: "housekeeping_productivity",
        name: "Housekeeping productivity (rooms per labor-hour)",
        definition:
          "Occupied/cleaned rooms divided by paid housekeeping labor-hours — the " +
          "headline productivity unit for the rooms department and the binding " +
          "throughput constraint when labor is scarce.",
        unit: "rooms / labor-hour",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1.6,
          high: 3.2,
          basis:
            "Service-level- and room-size-dependent (select-service higher, " +
            "luxury/suite lower); tracked vs a property labor standard, not as an " +
            "absolute; operator experience",
          label: "planning-range",
        },
        dataSource:
          "Labor-management/housekeeping system rooms cleaned over paid " +
          "housekeeping hours by property/day",
        whyItMatters:
          "When labor is the scarcest input, housekeeping throughput — not " +
          "demand — often sets how many rooms can actually be sold and turned on " +
          "a given day. It must be earned by smart scheduling and routing, not by " +
          "under-cleaning: productivity bought by skipping brand-standard cleaning " +
          "steps shows up immediately in guest satisfaction and review scores.",
      },
      {
        key: "group_transient_mix",
        name: "Group vs transient mix",
        definition:
          "Share of room-nights (and revenue) booked as contracted group/block " +
          "business versus individual transient demand — the central revenue-" +
          "management mix decision.",
        unit: "% (group share)",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 15,
          high: 50,
          basis:
            "Property-type-dependent (convention/large box high group share, " +
            "select-service/resort lower); in-range because over-blocking group " +
            "displaces higher-rate transient demand while too little group leaves " +
            "base-demand and shoulder-period revenue on the table; operator " +
            "experience",
          label: "planning-range",
        },
        dataSource:
          "PMS/RMS group block and transient pickup data by property/date/period",
        whyItMatters:
          "The mix decision where revenue management most often leaves money on " +
          "the table. Accepting a group block at a contracted rate displaces " +
          "transient demand that might have booked at higher rate on the same " +
          "nights — so the right group-vs-transient mix, with displacement " +
          "explicitly priced, is a core RevPAR lever and a prime forecasting target.",
      },
    ],

    painThemes: [
      {
        key: "ota_commission_channel_erosion",
        name: "OTA commission and channel-mix margin erosion",
        description:
          "Room demand drifts toward OTAs and other intermediaries that take a " +
          "15-25% commission and own the guest relationship, so distribution cost " +
          "climbs and margin leaks structurally — while the 'direct-booking shift' " +
          "the brand counts on is slow, costly (loyalty discounts, marketing, rate " +
          "parity), and routinely overstated because the OTA's reach and billboard " +
          "effect generate demand the property cannot reach alone.",
        detectionSignal:
          "Rising OTA/intermediary share of bookings and climbing commission % of " +
          "revenue, direct-booking initiatives that move share slowly or not at " +
          "all, rate-parity constraints, and a channel-cost line that is not " +
          "actively managed against the demand each channel actually generates.",
        diagnosticQuestion:
          "What is your channel mix and blended distribution cost, how fast is " +
          "direct share actually moving net of the cost of driving it, and have " +
          "you sized the demand the OTAs generate that you would lose by cutting " +
          "them — i.e. is your direct target margin-accretive or just commission-avoidant?",
      },
      {
        key: "labor_scarcity_and_cost",
        name: "Labor scarcity and cost (availability, not just efficiency)",
        description:
          "Housekeeping and front-line labor is the largest cost and, post-" +
          "pandemic, the scarcest input, so properties cannot reliably staff to " +
          "demand — turning to expensive agency labor and overtime, leaving rooms " +
          "unturned, and letting throughput rather than demand cap revenue, while " +
          "efficiency tools assume a labor pool that does not exist.",
        detectionSignal:
          "High agency/contract-labor and overtime spend, rooms held out of " +
          "service for lack of housekeeping, labor cost % rising even as hours are " +
          "cut, turnover and open requisitions high, scheduling built on a " +
          "budgeted-hours target rather than available, retained staff.",
        diagnosticQuestion:
          "Is your binding labor constraint cost or AVAILABILITY — can you " +
          "actually staff housekeeping and the front desk to demand — and how much " +
          "revenue are you losing to rooms you cannot turn and to agency/overtime " +
          "premiums?",
      },
      {
        key: "revpar_capped_by_data_fragmentation",
        name: "RevPAR optimization capped by PMS/CRS/RMS data fragmentation",
        description:
          "Revenue management is real and valuable, but PMS, CRS, RMS, and " +
          "channel-manager data sit in separate systems with inconsistent rate, " +
          "inventory, and demand signals, so forecasts are stale or partial, " +
          "pricing decisions lag the market, and the RMS cannot see the full " +
          "demand picture it needs to optimize.",
        detectionSignal:
          "Rate and availability discrepancies across PMS/CRS/OTA, manual rate " +
          "loading and overrides, RMS recommendations frequently ignored or " +
          "un-actionable, forecasts that miss, and no single source of truth for " +
          "demand, pace, and pickup across channels.",
        diagnosticQuestion:
          "Do your PMS, CRS, RMS, and channel manager share a single, current " +
          "view of rate, inventory, and demand, or is the revenue team " +
          "reconciling fragmented systems — and how often are RMS recommendations " +
          "un-actionable because the data is stale or inconsistent?",
      },
      {
        key: "group_transient_displacement",
        name: "Group-vs-transient mix and displacement mispricing",
        description:
          "Group blocks are accepted on contracted rates without explicitly " +
          "pricing the higher-rate transient demand they displace on the same " +
          "nights, so the property fills with lower-rate group business and leaves " +
          "RevPAR on the table — or, conversely, holds too little group and loses " +
          "base demand in shoulder periods.",
        detectionSignal:
          "Group business accepted without a displacement analysis, group blocks " +
          "that wash (un-picked-up rooms) or crowd out transient on peak nights, " +
          "no policy on group ceilings by date, and a sales team incentivized on " +
          "group volume independent of transient displacement.",
        diagnosticQuestion:
          "When you accept a group block, do you explicitly price the transient " +
          "demand it displaces on those nights, and do you set group ceilings by " +
          "date — or is group accepted on contracted rate and volume without a " +
          "displacement view?",
      },
      {
        key: "brand_owner_economic_tension",
        name: "Brand-standard vs owner-economics tension",
        description:
          "The brand mandates standards, technology, renovations, and program " +
          "participation that the owner pays for and may not earn back, while " +
          "franchise/management fees, loyalty-program cost, and central-services " +
          "charges are levied on the owner — so a margin improvement at the " +
          "property does not necessarily accrue to the party investing in it, and " +
          "brand and owner optimize for different numbers.",
        detectionSignal:
          "Owner pushback on brand-mandated capex/PIP and technology, fee and " +
          "loyalty-cost disputes, management-agreement performance clauses in " +
          "play, RevPAR-index targets the owner disputes, and a misalignment " +
          "between who invests and who keeps the resulting margin.",
        diagnosticQuestion:
          "For this portfolio, is each property owned, managed, or franchised, " +
          "and how do brand standards, fees, and loyalty cost split the economics " +
          "— i.e. who actually keeps a margin improvement, the brand or the owner?",
      },
      {
        key: "personalization_stalls_at_loyalty_tier",
        name: "Personalization stalls at loyalty-tier recognition, not true 1:1",
        description:
          "The brand sells '1:1 personalization' but the data and the moment-of-" +
          "stay execution rarely support more than loyalty-tier recognition and " +
          "broad segment offers, so investment in personalization over-promises, " +
          "front-line staff cannot act on guest profiles at the desk or in the " +
          "room, and the guest experience is generic despite the marketing claim.",
        detectionSignal:
          "Guest profile data fragmented across CRS/loyalty/PMS, no profile " +
          "surfaced to front-line staff at check-in or in-room, 'personalization' " +
          "that is really tier benefits and email segments, and personalization " +
          "ROI claimed on attributed rather than measured incremental stays.",
        diagnosticQuestion:
          "Beyond loyalty-tier recognition, can your front-line staff actually " +
          "see and act on a guest's preferences at check-in and in the room, and " +
          "is your 'personalization' true 1:1 or tier benefits and segment offers " +
          "dressed up as 1:1?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_revenue_management_pricing",
        name: "AI revenue management & dynamic pricing",
        valueMechanism:
          "Forecast demand, pace, and pickup by date, segment, and channel from " +
          "PMS/CRS/RMS, competitive-set, and market signals, and recommend rate " +
          "and inventory controls (and group-displacement pricing) that lift " +
          "RevPAR index against the comp set — pricing each room-night to its " +
          "true demand instead of to static rate tiers, with the group-vs-" +
          "transient displacement explicitly priced.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "PMS/CRS rate, inventory, pace, and pickup data with a single current source of truth",
          "Competitive-set/market demand signals and forward booking data by channel",
          "Group block and transient demand data to price displacement",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Rate recommendations must respect brand-standard rate floors, rate " +
            "parity obligations, and contracted group rates — these are hard " +
            "constraints, not soft penalties on the optimizer",
          "Pricing data fragmentation across PMS/CRS/RMS caps optimization — a " +
            "model fed stale or inconsistent rate/inventory will mis-price; data " +
            "integration is the gating dependency, not model quality",
        ],
        metricsMoved: [
          "revpar",
          "adr",
          "occupancy_pct",
          "group_transient_mix",
        ],
      },
      {
        key: "channel_mix_distribution_optimization",
        name: "Channel-mix & distribution-cost optimization",
        valueMechanism:
          "Analyze the demand each channel actually generates and its fully-" +
          "loaded cost (OTA commission vs the cost of driving direct), and steer " +
          "inventory, rate, and marketing toward the margin-accretive channel by " +
          "date — recovering distribution margin where direct genuinely wins and " +
          "preserving OTA demand where the billboard effect makes it worth the " +
          "commission, instead of chasing a blanket direct-share target.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "CRS/channel-manager source-of-business mix and fully-loaded channel cost",
          "Direct-channel acquisition cost (loyalty discount, marketing, rate-parity) by segment",
          "Demand/billboard-effect signal to estimate OTA-generated incremental demand",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "A blanket direct-share target can destroy more demand than it saves — " +
            "the model must net commission saved against OTA-generated demand lost " +
            "(billboard effect), never optimize commission alone",
          "Rate-parity clauses and OTA contractual terms constrain channel steering " +
            "— differential pricing must stay within contracted parity obligations",
        ],
        metricsMoved: [
          "direct_booking_share",
          "ota_commission_pct",
          "goppar",
          "loyalty_contribution_pct",
        ],
      },
      {
        key: "labor_forecasting_scheduling",
        name: "Labor forecasting & demand-based scheduling",
        valueMechanism:
          "Forecast occupancy, arrivals/departures, and housekeeping/front-desk " +
          "workload by day and daypart from the PMS forward book, and generate " +
          "schedules that match the scarce labor pool to demand — protecting room-" +
          "turn throughput and service standards at peak, trimming idle hours, and " +
          "reducing reliance on expensive agency labor and overtime, within wage-" +
          "and-hour and union constraints.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "PMS forward occupancy, arrivals/departures, and stay-over vs check-out mix",
          "Labor standards (rooms-per-hour, front-desk coverage) and actual worked hours",
          "Associate availability, skills, and labor-law/union constraints",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "The binding constraint is often labor AVAILABILITY, not efficiency — " +
            "scheduling cannot conjure staff that do not exist; the tool must flag " +
            "demand it cannot staff, not silently under-cover rooms",
          "Wage-and-hour, break, and union work-rule constraints are hard limits " +
            "on the scheduler; under-staffing housekeeping below room-turn need " +
            "leaves sellable rooms unturned",
        ],
        metricsMoved: [
          "labor_cost_pct",
          "housekeeping_productivity",
          "cost_per_occupied_room",
          "occupancy_pct",
        ],
      },
      {
        key: "guest_experience_loyalty_personalization",
        name: "Guest-experience & loyalty personalization",
        valueMechanism:
          "Unify guest profile, stay history, and declared preferences across " +
          "CRS/loyalty/PMS and surface them to front-line staff and digital " +
          "touchpoints — and target relevant offers and upsells — lifting loyalty " +
          "repeat-stay, direct booking, and guest satisfaction, with the honest " +
          "ceiling that lodging personalization is mostly tier recognition and " +
          "segment targeting, and true 1:1 is gated by data unification and " +
          "moment-of-stay execution.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Identity-resolved guest profile, stay history, and declared preferences across CRS/loyalty/PMS",
          "Front-line surfacing (check-in, in-room, app) so staff can act on the profile",
          "Consent/permission state and offer/upsell inventory",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Personalization must honor guest privacy/consent and never surface " +
            "profile data beyond granted permission or to channels that cannot " +
            "secure it",
          "Most lodging 'personalization' stalls at tier recognition — claimed 1:1 " +
            "value must be measured incrementally (holdout), not attributed, and not " +
            "over-promised beyond what front-line execution can deliver",
        ],
        metricsMoved: [
          "loyalty_contribution_pct",
          "guest_satisfaction_nps",
          "direct_booking_share",
        ],
      },
      {
        key: "ai_guest_service_automation",
        name: "AI guest-service & operations automation",
        valueMechanism:
          "Automate high-volume guest interactions and operational tasks — " +
          "chat/voice booking and FAQ, digital check-in/out, mobile key, service " +
          "requests, and predictive maintenance routing — deflecting routine front-" +
          "desk and call-center load so scarce labor is redeployed to service " +
          "moments that matter, improving response time and guest satisfaction " +
          "while reducing cost per occupied room.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Reservation/PMS, service-request, and maintenance/asset data",
          "Guest-messaging and digital check-in/mobile-key platform integration",
          "Property operating procedures and escalation rules for human handoff",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Service automation must escalate cleanly to a human for complex, " +
            "sensitive, or safety/security situations — no autonomous handling of " +
            "guest-safety or dispute moments",
          "Automation deflects routine load but cannot replace housekeeping or the " +
            "physical service the room requires — it redeploys scarce labor, it does " +
            "not eliminate the labor constraint",
        ],
        metricsMoved: [
          "cost_per_occupied_room",
          "guest_satisfaction_nps",
          "labor_cost_pct",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "pms_crs_core_platform",
        name: "PMS + CRS core operating platform",
        description:
          "The property and central operating backbone: the PMS (property " +
          "management system) runs the front desk, room inventory, folio, and " +
          "stay lifecycle at each hotel, and the CRS (central reservation system) " +
          "holds rate, availability, and the booking funnel across channels — the " +
          "joined system of record for what is sold, at what rate, through which " +
          "channel.",
        boundary:
          "Owns reservations, room inventory, folio/stay lifecycle, and rate/" +
          "availability distribution; does NOT set the revenue-management pricing " +
          "strategy (RMS) or own the loyalty relationship — it records and " +
          "distributes what revenue management and brand decide.",
        humanAccountabilityPoint:
          "VP Operations / Corporate Director of Rooms & Distribution",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "revenue_management_system",
        name: "Revenue management system (RMS) & demand forecasting",
        description:
          "A forecasting and pricing layer over PMS/CRS, competitive-set, and " +
          "market data that predicts demand, pace, and pickup by date/segment/" +
          "channel and recommends rate and inventory controls — including group-" +
          "displacement pricing — the engine that moves the property from static " +
          "rate tiers to demand-based pricing.",
        boundary:
          "Owns demand forecasting and rate/inventory recommendations; does not " +
          "execute the booking or own the channel contracts — it recommends and " +
          "depends on clean, current PMS/CRS data to act, and operates within " +
          "brand rate floors and parity obligations.",
        humanAccountabilityPoint:
          "Director of Revenue Management (property and above-property)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "channel_manager_distribution_layer",
        name: "Channel manager & distribution-optimization layer",
        description:
          "A distribution layer that connects the CRS to OTAs, GDS, metasearch, " +
          "and brand.com, manages rate/availability parity across channels, and " +
          "surfaces the fully-loaded cost and demand of each channel — the system " +
          "where channel-mix and OTA-commission decisions are actually executed.",
        boundary:
          "Owns multi-channel rate/availability distribution and channel-cost " +
          "visibility; does not set the pricing strategy (RMS) or the loyalty/" +
          "direct strategy (brand) — it executes distribution within parity and " +
          "OTA contractual obligations.",
        humanAccountabilityPoint:
          "Director of Distribution / E-commerce (with revenue management)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "labor_management_platform",
        name: "Labor-management & demand-based scheduling platform",
        description:
          "A labor-management and time-and-attendance platform that forecasts " +
          "housekeeping and front-desk workload from the PMS forward book, builds " +
          "wage-and-hour/union-compliant schedules against labor standards, flags " +
          "demand it cannot staff, and closes the loop on schedule-vs-actual and " +
          "agency/overtime spend across the portfolio.",
        boundary:
          "Owns labor forecasting, scheduling, and adherence; does not set the " +
          "labor budget, wage strategy, or hiring (HR/finance) and cannot create " +
          "labor supply — it plans and protects the scarce hours the property has.",
        humanAccountabilityPoint:
          "Director of Operations / Executive Housekeeper & Front Office Manager",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "guest_data_loyalty_platform",
        name: "Guest-data & loyalty platform (CDP + loyalty)",
        description:
          "A guest-data platform and loyalty engine that unifies profile, stay " +
          "history, and declared preferences across CRS/PMS/loyalty into one " +
          "identity, runs the loyalty program and earn/burn, and surfaces the " +
          "profile to front-line and digital touchpoints — the foundation for " +
          "direct-booking defense and the (realistically tier-level) " +
          "personalization layer.",
        boundary:
          "Owns guest identity unification, the loyalty ledger, and profile " +
          "serving within consent; does not set pricing or distribution — it owns " +
          "the guest relationship and the data that feeds personalization, not " +
          "the room-night economics.",
        humanAccountabilityPoint:
          "VP Loyalty & Guest Experience (with privacy/data-protection sign-off)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Lodging value is made on two fronts — revenue (RevPAR/ADR through " +
        "revenue management and channel mix) and cost (labor, the #1 and " +
        "scarcest input) — and the prize concentrates there: AI revenue " +
        "management lifts RevPAR index by pricing each room-night and the group-" +
        "vs-transient mix to true demand; channel-mix optimization recovers " +
        "distribution margin where direct genuinely wins; labor forecasting and " +
        "scheduling protect room-turn throughput and trim agency/overtime spend; " +
        "guest-data and service automation defend direct share and redeploy " +
        "scarce labor. But the prize is gated at four honest points this expert " +
        "refuses to assume away: (1) channel-mix / OTA-commission reality — the " +
        "15-25% commission is a structural drain and the direct-booking shift is " +
        "slow, costly, and overstated because the billboard effect generates real " +
        "demand, so a commission 'saving' must be netted against demand lost; (2) " +
        "labor availability, not just efficiency — scheduling cannot conjure staff " +
        "that do not exist, so throughput, not the schedule, often caps revenue; " +
        "(3) PMS/CRS/RMS data fragmentation and group-vs-transient displacement, " +
        "which cap how much of the modeled RevPAR gain is actually actionable; and " +
        "(4) the brand-vs-owner economic split, which determines whether a margin " +
        "improvement accrues to the party that invested in it. Forward value must " +
        "therefore be discounted for channel/commission reality, labor " +
        "availability, data-fragmentation/displacement limits, and the brand-owner " +
        "split — and quoted as RevPAR-index and GOPPAR impact, not as an isolated " +
        "ADR or occupancy number.",
      dominantHaircutFactors: [
        {
          factor: "Channel-mix / OTA-commission reality & overstated direct shift",
          rationale:
            "A modeled distribution-margin saving assumes direct share can be " +
            "shifted from OTAs, but the shift is slow and costly (loyalty " +
            "discounts, marketing, parity) and the OTA billboard effect generates " +
            "demand the property would lose — so the realized commission saving is " +
            "far less than the gross commission line, and can be negative if demand " +
            "falls.",
          typicalHaircut: {
            low: 0.25,
            high: 0.6,
            basis:
              "Gap between gross OTA-commission 'opportunity' and the net margin " +
              "actually recoverable after the cost of driving direct and the " +
              "OTA-generated demand lost",
            label: "planning-range",
          },
        },
        {
          factor: "Labor availability, not just cost",
          rationale:
            "Labor-efficiency value assumes a staffable pool, but post-pandemic " +
            "the binding constraint is availability — rooms cannot be turned and " +
            "demand cannot be served without staff that may not exist — so a " +
            "modeled labor saving is partly unrealizable and can mask lost revenue " +
            "from unturned rooms.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Reduction in addressable labor-efficiency value once labor " +
              "availability (not just cost) and reliance on agency/overtime are " +
              "applied",
            label: "planning-range",
          },
        },
        {
          factor: "PMS/CRS/RMS data fragmentation & group-transient displacement",
          rationale:
            "RevPAR gains assume the RMS sees a single, current demand picture and " +
            "that group is priced against displaced transient — but fragmented " +
            "rate/inventory/demand data and unmodeled displacement mean a chunk of " +
            "the modeled optimization is not actionable until the data is " +
            "integrated and displacement is priced.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Share of modeled RevPAR/pricing optimization not realizable until " +
              "PMS/CRS/RMS data is integrated and group-vs-transient displacement " +
              "is explicitly priced",
            label: "planning-range",
          },
        },
        {
          factor: "Brand-vs-owner economic split & adoption friction",
          rationale:
            "Whether a margin improvement accrues to the brand or the owner " +
            "depends on the management/franchise structure, fees, and loyalty " +
            "cost, and revenue-management/scheduling adoption depends on property " +
            "teams trusting and running the tools — so the operator-realized, " +
            "actually-adopted share of a modeled gain varies sharply by deal and " +
            "by execution.",
          typicalHaircut: {
            low: 0.05,
            high: 0.3,
            basis:
              "Share of a modeled property margin gain retained by the investing " +
              "party after the brand/owner fee-and-loyalty split and after property-" +
              "team adoption",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "RevPAR-index uplift from AI revenue management",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Relative RevPAR-index gain vs the competitive set from demand-based " +
              "pricing and group-displacement optimization, after the data-" +
              "fragmentation and displacement haircuts; varies with starting RMS maturity",
            label: "planning-range",
          },
          measuredAs:
            "Relative lift in revpar (RevPAR index vs comp set), holding the market",
        },
        {
          lever: "Distribution-cost / commission recovery",
          range: {
            low: 0.01,
            high: 0.05,
            basis:
              "Relative reduction in blended distribution cost from channel-mix " +
              "optimization, net of the cost of driving direct and the OTA-" +
              "generated demand lost (billboard effect)",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in ota_commission_pct at held demand/RevPAR",
        },
        {
          lever: "Labor productivity / cost recovery",
          range: {
            low: 0.03,
            high: 0.1,
            basis:
              "Relative labor-cost reduction (or housekeeping rooms-per-hour gain) " +
              "from demand-based scheduling and automation, after the labor-" +
              "availability haircut and holding brand service standards",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in labor_cost_pct (or housekeeping_productivity gain) at held standards",
        },
        {
          lever: "Direct-share / loyalty revenue lift",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Relative lift in direct/loyalty-member revenue share from loyalty " +
              "personalization and direct-channel optimization, net of the cost of " +
              "driving direct",
            label: "planning-range",
          },
          measuredAs:
            "Relative lift in direct_booking_share / loyalty_contribution_pct, net of acquisition cost",
        },
      ],
      timeToValueBand:
        "AI revenue management / dynamic pricing: 2-4 quarters once PMS/CRS/RMS " +
        "data is integrated enough to forecast and price reliably. Channel-mix " +
        "optimization: 1-3 quarters on existing channel-manager and cost data. " +
        "Labor forecasting & scheduling: 2-4 quarters to demand-matched schedules " +
        "with measured adherence, gated on the underlying labor-availability " +
        "reality. Guest-data unification & loyalty personalization: 3-6 quarters " +
        "(identity unification across CRS/PMS/loyalty is the long pole). Portfolio-" +
        "wide value always lags the pilot property because data integration and " +
        "property-team adoption — not model quality — are the gating constraints.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Property management system (PMS)",
          role:
            "System of record at each hotel for the front desk, room inventory, " +
            "folio, stay lifecycle, and night audit — the operational core of a property.",
          examples: [
            "Oracle Hospitality OPERA Cloud",
            "Agilysys Versa / Stay",
            "Mews",
            "Cloudbeds",
          ],
        },
        {
          name: "Central reservation system (CRS) & booking engine",
          role:
            "Holds rate, availability, and the booking funnel across channels and " +
            "powers brand.com/direct booking and distribution to the property estate.",
          examples: [
            "Amadeus (TravelClick) iHotelier",
            "Sabre SynXis",
            "Oracle Hospitality OPERA CRS",
            "brand-proprietary CRS",
          ],
        },
        {
          name: "Revenue management system (RMS)",
          role:
            "Forecasts demand/pace/pickup and recommends rate and inventory " +
            "controls and group-displacement pricing by date/segment/channel.",
          examples: [
            "Duetto",
            "IDeaS (SAS)",
            "Amadeus Revenue Management",
            "Atomize / Pace",
          ],
        },
        {
          name: "Channel manager & distribution",
          role:
            "Connects the CRS to OTAs, GDS, metasearch, and direct, manages rate/" +
            "availability parity, and surfaces channel cost and source-of-business mix.",
          examples: [
            "SiteMinder",
            "Sabre / Amadeus distribution",
            "GDS (Sabre, Amadeus, Travelport)",
            "OTA extranets (Booking.com, Expedia)",
          ],
        },
        {
          name: "Labor management & time and attendance",
          role:
            "Forecasts housekeeping/front-desk workload from the forward book, " +
            "builds compliant schedules against labor standards, and tracks " +
            "agency/overtime and adherence.",
          examples: [
            "UKG (Kronos)",
            "Unifocus",
            "Hotel Effectiveness (Actabl)",
            "Legion",
          ],
        },
        {
          name: "Guest-data platform (CDP) & loyalty",
          role:
            "Unifies guest profile, stay history, and preferences into one " +
            "identity, runs the loyalty program/earn-burn, and serves the profile " +
            "to front-line and digital touchpoints.",
          examples: [
            "brand-proprietary loyalty platforms",
            "Salesforce / Adobe CDP",
            "Cendyn",
            "Revinate",
          ],
        },
      ],
      roles: [
        {
          title: "VP / SVP Operations (Lodging)",
          accountability:
            "Portfolio rooms-division execution, GOPPAR, labor, guest " +
            "satisfaction, and brand-standard compliance across properties.",
        },
        {
          title: "Director of Revenue Management",
          accountability:
            "RevPAR index, ADR/occupancy mix, group-vs-transient displacement, " +
            "and pricing/inventory strategy at and above property.",
        },
        {
          title: "Director of Distribution / E-commerce",
          accountability:
            "Channel mix, distribution cost, OTA relationships, brand.com/direct " +
            "share, rate parity, and metasearch performance.",
        },
        {
          title: "Executive Housekeeper / Director of Rooms",
          accountability:
            "Housekeeping productivity and labor, room-turn throughput, cost per " +
            "occupied room, and cleanliness/brand-standard compliance.",
        },
        {
          title: "VP Loyalty & Guest Experience",
          accountability:
            "The loyalty program, member revenue share and repeat stay, guest " +
            "profile/personalization, and the direct-relationship strategy.",
        },
        {
          title: "Owner / Asset Manager (or Franchisee)",
          accountability:
            "Property-level return on investment, capex/PIP decisions, fee and " +
            "loyalty-cost economics, and the brand-vs-owner performance terms.",
        },
      ],
      regulatoryFrames: [
        {
          name: "ADA accessibility & accommodation requirements",
          relevance:
            "Accessible-room inventory, facilities, digital booking " +
            "accessibility, and accommodation obligations are legal requirements " +
            "that constrain room allocation, renovation, and the booking experience.",
        },
        {
          name: "PCI-DSS payment-card security",
          relevance:
            "Card data captured at booking, check-in, and folio across PMS/CRS/" +
            "channels makes PCI-DSS a hard control on payment handling, " +
            "tokenization, and breach exposure.",
        },
        {
          name: "Franchise disclosure & management-agreement law (FDD)",
          relevance:
            "Franchise disclosure (FDD) and management/franchise agreements " +
            "govern brand standards, fees, territory, and performance terms — the " +
            "legal frame of the brand-vs-owner economic split.",
        },
        {
          name: "Data privacy & guest-data protection (GDPR/CCPA, loyalty consent)",
          relevance:
            "Guest profile, loyalty, and marketing data are governed by privacy " +
            "law and consent requirements, constraining personalization, profile " +
            "sharing, and cross-border guest-data use.",
        },
      ],
      canonicalTerms: [
        {
          term: "RevPAR / ADR / occupancy",
          definition:
            "RevPAR = rooms revenue per available room-night (rate × occupancy); " +
            "ADR = average realized rate per occupied room; occupancy = rooms " +
            "sold over rooms available — the three core room-night metrics.",
        },
        {
          term: "GOPPAR",
          definition:
            "Gross operating profit per available room — the profit analogue of " +
            "RevPAR that exposes whether revenue becomes profit after labor and " +
            "channel cost.",
        },
        {
          term: "RevPAR index (RGI / fair-share)",
          definition:
            "A property's RevPAR relative to its competitive set (index of 100 = " +
            "fair share) — the honest measure of whether revenue management is " +
            "winning share rather than riding the market.",
        },
        {
          term: "Channel mix / OTA / billboard effect",
          definition:
            "The split of bookings across OTA, GDS, direct/brand.com, and group; " +
            "the OTA takes a 15-25% commission, and the 'billboard effect' is the " +
            "direct demand an OTA listing generates that the property could not reach alone.",
        },
        {
          term: "Group vs transient & displacement",
          definition:
            "Contracted group/block business vs individual transient demand; " +
            "displacement is the higher-rate transient revenue forgone by holding " +
            "rooms for a group on the same nights.",
        },
        {
          term: "PMS / CRS / RMS",
          definition:
            "Property management system (front desk/inventory), central " +
            "reservation system (rate/availability/distribution), and revenue " +
            "management system (forecasting/pricing) — the lodging operating estate.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "RevPAR, ADR, occupancy, and GOPPAR performance",
        authoritativeSource:
          "PMS/CRS rooms revenue and room-night data and the USALI property P&L, " +
          "indexed to a competitive set (STR-style benchmarking)",
        whatGoodEvidenceLooksLike:
          "RevPAR, ADR, and occupancy by property/segment/period with the RevPAR " +
          "INDEX vs the competitive set, and GOPPAR from the USALI P&L — so " +
          "revenue is shown against market share and against profit, not as an " +
          "absolute.",
        weakEvidenceToReject:
          "An absolute RevPAR or ADR with no competitive-set index and no GOPPAR, " +
          "presented as performance when it may just be the market moving.",
      },
      {
        claim: "Channel mix and distribution cost",
        authoritativeSource:
          "CRS/channel-manager source-of-business mix and fully-loaded channel " +
          "cost (OTA commission and the cost of driving direct) by channel/period",
        whatGoodEvidenceLooksLike:
          "Bookings and revenue by channel with the fully-loaded cost of each " +
          "(commission for OTA, loyalty/marketing/parity cost for direct) and the " +
          "demand each channel generates — so a direct-shift claim is netted " +
          "against the OTA-generated demand it would lose.",
        weakEvidenceToReject:
          "A gross OTA-commission 'opportunity' presented as recoverable margin " +
          "with no cost of driving direct and no estimate of the demand lost by " +
          "cutting OTAs.",
      },
      {
        claim: "Labor cost, availability, and housekeeping throughput",
        authoritativeSource:
          "Labor-management/payroll system labor cost, agency/overtime spend, and " +
          "housekeeping rooms-per-hour vs labor standard by property/period",
        whatGoodEvidenceLooksLike:
          "Labor cost % and housekeeping productivity against the labor standard " +
          "WITH agency/overtime spend and rooms held out of service for staffing " +
          "— so the availability constraint, not just cost, is visible.",
        weakEvidenceToReject:
          "A labor-efficiency saving claimed with no view of agency/overtime " +
          "reliance, turnover, or rooms lost to staffing — i.e. a saving that " +
          "assumes a labor pool that may not exist.",
      },
      {
        claim: "Revenue-management forecast and pricing optimization",
        authoritativeSource:
          "RMS forecast-vs-actual, pace/pickup, and rate-recommendation adherence " +
          "joined to PMS/CRS rate and inventory by date/segment",
        whatGoodEvidenceLooksLike:
          "Forecast accuracy and RMS-recommendation adherence with the RevPAR-" +
          "index result, and group-vs-transient displacement explicitly priced — " +
          "with a single, current source of truth for rate/inventory/demand.",
        weakEvidenceToReject:
          "A modeled RevPAR uplift resting on fragmented PMS/CRS/RMS data, with " +
          "no forecast accuracy, no recommendation adherence, and no displacement " +
          "analysis.",
      },
      {
        claim: "Loyalty, direct share, and brand-vs-owner economics",
        authoritativeSource:
          "CRS/loyalty member-revenue and repeat-stay data, direct-share trend, " +
          "and the management/franchise agreement fee-and-loyalty structure",
        whatGoodEvidenceLooksLike:
          "Loyalty member-revenue share and repeat-stay trend with direct-booking " +
          "share net of acquisition cost, and the brand/owner fee-and-loyalty " +
          "split that determines who keeps a margin gain.",
        weakEvidenceToReject:
          "A loyalty/direct-share or margin claim with no acquisition cost and no " +
          "statement of whether the property is owned, managed, or franchised — " +
          "i.e. a gain whose beneficiary is unknown.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your channel mix and blended distribution cost, how fast is direct share actually moving net of the cost of driving it, and have you sized the OTA-generated demand you would lose by cutting them?",
      "Is your binding labor constraint cost or AVAILABILITY — can you actually staff housekeeping and the front desk to demand — and how much revenue are you losing to rooms you cannot turn and to agency/overtime premiums?",
      "Do your PMS, CRS, RMS, and channel manager share a single, current view of rate, inventory, and demand, or is the revenue team reconciling fragmented systems and ignoring un-actionable RMS recommendations?",
      "When you accept a group block, do you explicitly price the transient demand it displaces on those nights and set group ceilings by date, or is group accepted on contracted rate and volume?",
      "For this portfolio, is each property owned, managed, or franchised, and how do brand standards, fees, and loyalty cost split the economics — who actually keeps a margin improvement?",
      "Beyond loyalty-tier recognition, can your front-line staff see and act on a guest's preferences at check-in and in the room, and is your 'personalization' true 1:1 or tier benefits and segments dressed up as 1:1?",
      "Is your RevPAR measured as an index against a competitive set, and does GOPPAR confirm that revenue is becoming profit after channel cost and labor?",
    ],
    maturitySignals: [
      "RevPAR is managed as an index against a competitive set and confirmed through GOPPAR, not chased as absolute ADR or occupancy.",
      "PMS, CRS, RMS, and channel manager share a single current source of truth for rate, inventory, and demand, and RMS recommendations are actioned.",
      "Channel mix is managed on fully-loaded channel cost and the demand each channel generates, not on a blanket direct-share target.",
      "Labor is scheduled to the PMS forward book with agency/overtime and unturned-room loss visible, and the availability constraint is managed, not just cost.",
      "Group business is accepted with explicit transient-displacement pricing and date-level group ceilings.",
    ],
    redFlags: [
      "OTA share and commission cost are rising, direct-booking initiatives barely move share, and the direct target is set on commission avoidance without netting the demand the OTAs generate.",
      "Labor is cut to a budget target past the point where rooms can be turned and brand standards held, with agency/overtime and unturned rooms papering over a true availability shortage.",
      "PMS/CRS/RMS data is fragmented, rate/availability discrepancies and manual overrides are routine, and RMS recommendations are ignored because they are un-actionable.",
      "Group blocks are accepted on contracted rate and volume with no displacement analysis, washing rooms and crowding out higher-rate transient demand on peak nights.",
      "'Personalization' and RevPAR/loyalty value are claimed on attributed rather than measured incremental results, and who keeps the margin gain (brand vs owner) is never stated.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "PMS / CRS core (Oracle OPERA, Amadeus, Sabre SynXis, Agilysys, Mews)",
        category: "Property management and central reservation system of record",
        switchingCost:
          "High — the PMS/CRS holds reservations, inventory, folio, rate, and the " +
          "distribution funnel fused to front-desk process and payment hardware; " +
          "replacement is a multi-quarter-to-multi-year program with parallel runs " +
          "and re-training across the estate.",
        renewalDynamics:
          "Per-room/per-property subscription plus transaction/distribution fees; " +
          "cloud migration and RMS/CRS add-on modules upsold at renewal; watch " +
          "distribution-transaction and payment tie-ins.",
      },
      {
        vendorName: "Revenue management system (Duetto, IDeaS, Amadeus, Atomize)",
        category: "Demand forecasting and rate/inventory optimization",
        switchingCost:
          "Moderate-to-high — holds the demand model, pricing rules, and " +
          "competitive-set configuration and is fused to PMS/CRS data feeds; lock-" +
          "in is configured rules, history, and integration more than raw data.",
        renewalDynamics:
          "Per-room/per-property subscription; AI/automation tiers upsold; favor " +
          "outcome terms tied to measured RevPAR-index gain net of the data-" +
          "fragmentation and displacement haircuts.",
      },
      {
        vendorName: "Channel manager & distribution (SiteMinder, GDS, OTA extranets)",
        category: "Multi-channel rate/availability distribution and parity",
        switchingCost:
          "Moderate — runs the channel connections and parity rules; stickiness " +
          "is the connected-channel configuration and the OTA contractual " +
          "relationships, and OTA commission terms are set by the OTAs' market power.",
        renewalDynamics:
          "Subscription plus per-channel/transaction fees; OTA commission rates " +
          "and parity clauses are the real economics — leverage committed volume " +
          "and metasearch/direct alternatives.",
      },
      {
        vendorName: "Labor management (UKG/Kronos, Unifocus, Hotel Effectiveness, Legion)",
        category: "Demand-based scheduling and time & attendance",
        switchingCost:
          "Moderate — holds the labor model, standards, and labor-law/union rule " +
          "configuration fused to payroll; lock-in is configuration and habit " +
          "more than raw data.",
        renewalDynamics:
          "Per-employee/per-property subscription; AI/auto-scheduling tiers " +
          "upsold; favor outcome terms tied to measured labor-at-held-standard and " +
          "agency/overtime reduction.",
      },
      {
        vendorName: "Guest data & loyalty (brand loyalty platforms, Cendyn, Revinate, CDP)",
        category: "Guest-data unification, loyalty, and CRM/personalization",
        switchingCost:
          "Moderate-to-high — holds the unified guest profile, loyalty ledger, and " +
          "the member relationship; lock-in is the accumulated profile/identity " +
          "graph and program history, and for branded flags the loyalty program " +
          "is central to the brand itself.",
        renewalDynamics:
          "Subscription plus messaging/transaction volume; favor profile/identity " +
          "data portability and outcome terms on holdout-measured loyalty/direct " +
          "lift rather than attributed.",
      },
    ],
    switchingCosts:
      "The PMS/CRS core is the hardest to switch because it carries reservations, " +
      "inventory, folio, and the distribution funnel fused to front-desk process " +
      "and payment — effectively a multi-quarter-to-multi-year platform decision. " +
      "The negotiable frontier is the layers around it (RMS, channel manager, " +
      "labor management) and the guest-data/loyalty layer, where switching cost is " +
      "moderate and the real lock-in is configured rules, integration, and " +
      "accumulated history. OTA commission terms sit largely outside the " +
      "negotiable frontier (set by OTA market power) — the lever there is channel " +
      "mix, committed volume, metasearch, and direct, not the commission rate " +
      "itself. Protect rate/inventory, RMS, and guest-profile data portability to " +
      "keep the frontier negotiable.",
    negotiationLevers: [
      "Outcome pricing tied to measured RevPAR-index gain, labor-at-held-standard, or agency/overtime reduction — net of the channel, labor-availability, and data-fragmentation haircuts",
      "Channel mix, committed direct/metasearch volume, and parity-clause terms as the lever against OTA commission (the rate itself is OTA-set), not a blanket direct-share mandate",
      "PMS/CRS distribution-transaction and payment-tie-in transparency to avoid hidden per-booking cost at scale",
      "Rate/inventory, RMS-model, and guest-profile/identity data portability to prevent platform and loyalty lock-in",
      "Pilot-to-scale gating with portfolio-wide (not pilot-property) RevPAR-index and GOPPAR proof before enterprise commitment, recognizing data integration and adoption as the gating constraint",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      revenue_metric: [
        "PMS/CRS RevPAR/ADR/occupancy by property/segment/period",
        "RevPAR INDEX vs a competitive set, not absolute RevPAR",
        "GOPPAR from the USALI P&L to confirm revenue becomes profit",
      ],
      channel_claim: [
        "CRS/channel-manager source-of-business mix and fully-loaded channel cost",
        "the demand each channel generates, so a direct shift is netted against OTA-generated demand lost",
      ],
      labor_claim: [
        "labor cost and housekeeping productivity vs labor standard",
        "agency/overtime spend and rooms held out of service — the availability constraint, not just cost",
      ],
      revenue_management_claim: [
        "RMS forecast-vs-actual and recommendation adherence on a single current source of truth",
        "explicit group-vs-transient displacement pricing",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (channel/commission reality, labor availability, data fragmentation/displacement, brand-owner split)",
        "who keeps the saving (brand vs owner)",
      ],
    },
    citationStandard:
      "Quantitative lodging claims cite the PMS/CRS/RMS/labor source and the " +
      "property/segment/date grain, and revenue claims cite RevPAR INDEX against a " +
      "competitive set plus GOPPAR — never an absolute RevPAR or ADR presented as " +
      "performance when it may be the market moving. Channel claims cite the fully-" +
      "loaded cost of each channel and the demand it generates, so a commission " +
      "saving is netted against OTA-generated demand lost — never a gross OTA-" +
      "commission opportunity as recoverable margin. Labor claims cite housekeeping " +
      "productivity vs standard WITH agency/overtime and unturned-room loss — never " +
      "an efficiency saving that assumes a labor pool that may not exist. Revenue-" +
      "management claims cite forecast accuracy, recommendation adherence on a " +
      "single source of truth, and explicit group displacement. Value projections " +
      "cite a baseline, a labelled planning range, the haircut factors applied " +
      "(channel/commission reality, labor availability, data fragmentation/" +
      "displacement, brand-owner split), and who keeps the saving — never a single " +
      "asserted savings or ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no competitive-set RevPAR index — frame revenue performance as an industry planning range and flag that absolute RevPAR may just reflect the market, not won share.",
      "A direct-booking / commission saving is cited without the cost of driving direct and the OTA-generated demand at risk — flag that the net recoverable margin is far less than the gross commission and can be negative.",
      "Labor value is framed on efficiency alone — flag that the binding constraint may be AVAILABILITY, and that a modeled saving is partly unrealizable and may mask lost revenue from unturned rooms.",
      "RevPAR/pricing optimization is cited on fragmented PMS/CRS/RMS data or without displacement pricing — flag that a chunk of the modeled gain is not actionable until data is integrated and group displacement is priced.",
      "A margin or loyalty/personalization gain is cited without the brand/owner structure — flag that who keeps the gain depends on whether the property is owned, managed, or franchised, and that lodging personalization mostly stalls at tier recognition.",
    ],
    inferenceLanguage: [
      "Across lodging at this segment and market, RevPAR index against a comp set typically runs...",
      "Without your channel-cost and demand data, the industry pattern suggests the net recoverable commission saving is well below the gross OTA-commission line, around... after the cost of driving direct...",
      "Treating this as a planning range rather than your measured figure...",
      "Because post-pandemic labor is often availability-constrained, the realizable share of this labor saving is typically...",
      "Depending on whether the property is owned, managed, or franchised, the share of this margin gain the operator actually keeps is typically...",
    ],
    flagWithoutEvidence: [
      "A specific dollar RevPAR, commission, or labor saving or ROI for this tenant",
      "This tenant's actual RevPAR index, channel mix, OTA commission %, labor availability, or GOPPAR",
      "A commission saving claimed as recoverable margin without the cost of driving direct and the OTA-generated demand at risk",
      "A pilot-property result presented as a portfolio-wide outcome",
      "A margin or loyalty gain claimed as operator value without the brand/owner structure that determines who keeps it",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "RevPAR / GOPPAR value bridge — pricing, channel, and labor levers to realized value",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current RevPAR/GOPPAR to revenue-management, channel-mix, and labor levers to net realized value, showing the channel/commission, labor-availability, data-fragmentation, and brand-owner haircuts.",
    },
    {
      questionPattern:
        "channel mix and distribution cost — bookings and fully-loaded cost by channel",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      note: "Stack bookings/revenue by channel (OTA, GDS, direct/brand.com, group) with the fully-loaded cost of each to expose the commission drain and the real cost of driving direct.",
    },
    {
      questionPattern:
        "which lodging levers move value most (sensitivity)",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of RevPAR-index, distribution-cost, labor, and direct-share levers by impact range to prioritize investment, with each lever shown at its haircut.",
    },
    {
      questionPattern: "lodging operations KPI scorecard",
      exhibitKind: "table",
      note: "RevPAR (index), ADR, occupancy, GOPPAR, direct-booking share, OTA commission %, cost per occupied room, labor cost %, loyalty contribution, guest satisfaction/NPS, housekeeping productivity, and group-vs-transient mix vs planning ranges and the competitive set.",
    },
    {
      questionPattern:
        "RevPAR index / occupancy / ADR trend over time vs the competitive set",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend RevPAR index, ADR, and occupancy against the competitive set and planning ranges to show whether revenue management is winning share or riding the market.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "RevPAR is managed as an index against a competitive set and confirmed through GOPPAR, so revenue management is proven to win share and become profit, not ride the market",
      "PMS/CRS/RMS data is integrated into a single current source of truth, so RMS recommendations are actionable and the modeled RevPAR gain is realizable",
      "Channel mix is managed on fully-loaded channel cost and the demand each channel generates, so direct moves are margin-accretive rather than commission-avoidant",
      "Labor is managed on availability as well as cost and the brand/owner economic split is understood, so savings are real, staffable, retained, and never traded against brand standards",
    ],
    failureDrivers: [
      "Chasing a blanket direct-share target that cuts OTA demand worth more than the commission it saves, ignoring the billboard effect",
      "Cutting labor to a budget target past the point where rooms can be turned and brand standards held, papering over a true availability shortage with agency/overtime",
      "Modeling RevPAR gains on fragmented PMS/CRS/RMS data and unpriced group displacement, so the optimization is not actionable and the gain does not land",
      "Claiming a margin or personalization gain as operator value when the brand/owner structure means the other party keeps it, and over-promising 1:1 personalization the data and front-line cannot deliver",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "AI revenue management / dynamic pricing and channel-mix optimization adopt " +
      "first because the pain (RevPAR pressure, OTA commission) is visible and the " +
      "tools are mature — but their value is gated on PMS/CRS/RMS data integration. " +
      "Labor forecasting and scheduling follow on the PMS forward book, gated on " +
      "the real labor-availability constraint. Guest-data unification and loyalty " +
      "personalization are later and longer (identity unification across CRS/PMS/" +
      "loyalty is the long pole), and AI guest-service automation scales as " +
      "messaging/digital-key platforms mature. Adoption hinges on property-team " +
      "trust and above-property revenue/distribution leadership running the tools " +
      "— and on the brand/owner alignment that determines who invests and who " +
      "benefits — not on model quality alone.",
    roiClarity: "medium",
    roiClarityBasis:
      "Lodging ROI is only moderately firm because the prize is large and " +
      "measurable in RevPAR, GOPPAR, distribution cost, and labor, but four " +
      "factors blur it: channel-mix / OTA-commission reality and the overstated " +
      "direct shift (a gross commission line is not recoverable margin once the " +
      "cost of driving direct and the billboard effect are netted); labor " +
      "availability, not just cost, which makes a modeled efficiency saving partly " +
      "unrealizable; PMS/CRS/RMS data fragmentation and group-vs-transient " +
      "displacement that cap how much of a modeled RevPAR gain is actionable; and " +
      "the brand-vs-owner economic split that determines who actually keeps a gain. " +
      "Because cost-cutting can boomerang into lost demand, unturned rooms, or " +
      "broken brand standards, and because RevPAR can rise on a rising market, ROI " +
      "must be quoted as RevPAR-INDEX and GOPPAR impact with explicit channel, " +
      "labor-availability, data-fragmentation, and brand-owner haircuts — not as a " +
      "clean modeled number.",
  },

  regulatoryFrame: {
    name: "Accessibility, payment security, franchise/management law, and guest-data privacy",
    relevance:
      "The dominant regulatory frame for lodging operations: ADA accessibility " +
      "and accommodation requirements constrain room inventory, facilities, and " +
      "the digital booking experience; PCI-DSS is a hard control on payment-card " +
      "data captured across PMS/CRS/channels; franchise disclosure (FDD) and " +
      "management/franchise agreements govern brand standards, fees, and " +
      "performance terms — the legal frame of the brand-vs-owner economic split; " +
      "and data-privacy law (GDPR/CCPA, loyalty consent) governs guest-profile, " +
      "loyalty, and marketing data, constraining personalization and cross-border " +
      "guest-data use. These are hard constraints on revenue, distribution, labor, " +
      "and personalization optimization, not preferences (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
