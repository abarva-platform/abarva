// Domain Function Pack — Retail · Returns & reverse logistics.
//
// Function key: `returns_reverse_logistics`.
//
// Returns & reverse logistics is the function that runs the merchandise flow
// backward — from the customer's hand back into the retailer's network — and
// decides what happens to a unit once it is no longer a sale. It owns the
// returns policy and the returns experience at the point of intake (in store,
// by carrier, by drop-off, or keep-it), the reverse transportation that moves
// returned units back to a node, the disposition decision that grades each
// unit and routes it to restock, refurbish, liquidation, donation, vendor
// return-to-vendor, or destruction, the recovery of value from that unit, and
// the returns-fraud and abuse controls that protect the policy from being
// exploited. It is judged on a hard triple bind: returns must be easy enough
// that the policy converts the original sale and keeps the customer loyal,
// cheap enough that the reverse-logistics and processing cost does not consume
// the margin, and fast enough that a returned unit re-enters sellable stock
// before its value decays — all while abuse and fraud are held down.
//
// The operating reality the pack encodes: returns are a structural cost line
// that omnichannel growth has made larger and more variable, and the function
// fails in three coupled ways at once. It leaks recovery value — units routed
// to liquidation or destruction that could have been restocked or refurbished,
// returned stock that ages in a processing backlog until it is worth far less
// than at intake. It over-spends on the reverse flow — returns consolidated
// poorly, shipped on expensive lanes, processed by hand with no triage. And it
// bleeds to fraud and abuse — wardrobing, receipt and refund fraud, serial
// returners, and policy exploitation that the intake point cannot see in the
// moment. The AI archetypes are the recurring bets against that reality:
// returns-disposition optimisation, returns-fraud and abuse detection, returns
// demand and rate forecasting, the returns-experience and self-service agent,
// reverse-logistics network optimisation, and recommerce and resale grading.
//
// The companion retail packs — supply-chain-fulfillment owns the forward flow
// and the order-management routing, demand-inventory-planning owns the
// inventory position a restocked return re-enters, merchandising-assortment
// and digital-commerce shape the products and the buying experience that
// determine how much is returned in the first place. Returns & reverse
// logistics owns everything that happens after the customer decides to send
// the unit back.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const returnsReverseLogisticsPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'returns_reverse_logistics',
  functionLabel: 'Returns & reverse logistics',
  summary:
    'Returns & reverse logistics is the function that runs the merchandise ' +
    'flow backward — from the customer back into the retailer’s network — ' +
    'and decides what happens to a unit once it is no longer a sale. It ' +
    'owns the returns policy and the intake experience (in store, by ' +
    'carrier, by drop-off, or keep-it), the reverse transportation that ' +
    'moves units back to a node, the disposition decision that grades each ' +
    'unit and routes it to restock, refurbish, liquidation, donation, ' +
    'return-to-vendor, or destruction, the recovery of value from that ' +
    'unit, and the fraud and abuse controls that protect the policy. The ' +
    'function is judged on a triple bind: returns must be easy enough that ' +
    'the policy converts the original sale and keeps the customer loyal, ' +
    'cheap enough that the reverse-logistics and processing cost does not ' +
    'consume the margin, and fast enough that a returned unit re-enters ' +
    'sellable stock before its value decays — all while fraud and abuse are ' +
    'held down. It fails in three coupled ways at once: it leaks recovery ' +
    'value through poor disposition and processing backlogs, it over-spends ' +
    'on a poorly consolidated reverse flow, and it bleeds to wardrobing, ' +
    'refund fraud, and serial-returner abuse the intake point cannot see in ' +
    'the moment.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'gross_return_rate',
      name: 'Gross return rate',
      definition:
        'The share of sold units — or sold dollars — returned within the ' +
        'returns window, measured against the original sale, before any ' +
        'recovery is netted.',
      unit: '% of sold units (or sold dollars) returned',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 8,
        high: 30,
        basis:
          'Return rate is structural by category and channel — hardlines ' +
          'and grocery return low, apparel and online-purchased apparel ' +
          'return far higher. A planning range; the category and channel ' +
          'mix set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The point-of-sale and order-management systems, joining returned ' +
        'units and credit-memo lines back to the original sales ' +
        'transaction.',
      whyItMatters:
        'The return rate sizes the entire reverse flow — every cost, ' +
        'recovery, and fraud number in the function scales off it — and a ' +
        'rising rate is the first signal that fit, content, or buying ' +
        'experience upstream is generating returns the function then has ' +
        'to absorb.',
    },
    {
      key: 'return_processing_cost_per_unit',
      name: 'Returns processing cost per unit',
      definition:
        'The fully-loaded cost to handle one returned unit — reverse ' +
        'transportation, intake and inspection labour, grading, ' +
        'repackaging, and the disposition handling — excluding the refund ' +
        'itself.',
      unit: 'USD per returned unit',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 30,
        basis:
          'Per-unit reverse cost spans a wide band — a low-value in-store ' +
          'return processed at the counter sits at the low end, a bulky ' +
          'carrier-shipped online return needing inspection and ' +
          'repackaging at the high end. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The reverse-logistics, transportation, and warehouse-management ' +
        'systems for handling and freight cost, allocated per processed ' +
        'unit.',
      whyItMatters:
        'It is the core cost-efficiency measure of the reverse flow — the ' +
        'figure every routing, consolidation, and triage decision moves, ' +
        'and the number that decides whether a low-value return is worth ' +
        'recovering at all.',
    },
    {
      key: 'recovery_rate',
      name: 'Returns recovery rate',
      definition:
        'The value recovered from returned merchandise — through restock, ' +
        'refurbishment, resale, liquidation, or vendor credit — expressed ' +
        'as a percentage of the original retail value of the returned ' +
        'units.',
      unit: '% of original retail value recovered',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 85,
        basis:
          'Recovery depends on how much returned stock is restocked at ' +
          'full value versus liquidated or destroyed; the band spans a ' +
          'weak disposition operation to a strong, fast one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The returns-disposition and inventory systems, comparing the ' +
        'realised value of each disposition path against the original ' +
        'retail value of the returned units.',
      whyItMatters:
        'Recovery rate is the net-margin measure of the function — it is ' +
        'the difference between a return being a recoverable asset and a ' +
        'near-total write-off, and it is where good disposition and fast ' +
        'processing show up directly in the P&L.',
    },
    {
      key: 'restock_yield',
      name: 'Restock-to-sellable yield',
      definition:
        'The share of returned units graded sellable and returned to ' +
        'primary, full-price sellable inventory — rather than routed to a ' +
        'secondary, liquidation, refurbishment, or write-off path.',
      unit: '% of returned units restocked as full-price sellable',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 45,
        high: 80,
        basis:
          'Restock yield depends on grading discipline, processing speed, ' +
          'and category — fast-fashion and seasonal goods miss the resale ' +
          'window more often than basics. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The returns-disposition and grading system reconciled against ' +
        'the inventory system’s sellable on-hand position.',
      whyItMatters:
        'Restock yield is the single highest-value disposition path — a ' +
        'unit returned to full-price sellable stock recovers far more than ' +
        'any secondary channel — so this metric tests whether the ' +
        'operation captures recoverable value or surrenders it to ' +
        'discount.',
    },
    {
      key: 'return_cycle_time',
      name: 'Return cycle time',
      definition:
        'The elapsed time from a return being initiated by the customer ' +
        'to the unit being graded, dispositioned, and — where applicable — ' +
        'available again as sellable inventory.',
      unit: 'days, return initiation to disposition complete',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 21,
        basis:
          'Cycle time depends on reverse-transit distance, consolidation ' +
          'cadence, and processing-centre throughput; the band spans a ' +
          'fast, well-run reverse network to a backlogged one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The reverse-logistics and order-management systems, timestamping ' +
        'return initiation through to the disposition decision and ' +
        'inventory re-entry.',
      whyItMatters:
        'Return cycle time is the clock on recovery value — every day a ' +
        'returned unit sits in transit or a processing backlog it loses ' +
        'sellable value and resale-window relevance, so cycle time and ' +
        'recovery rate move together.',
    },
    {
      key: 'return_fraud_rate',
      name: 'Returns fraud and abuse rate',
      definition:
        'The share of returned value attributable to fraudulent or ' +
        'abusive returns — wardrobing, receipt and refund fraud, ' +
        'price-arbitrage, stolen-goods returns, and policy abuse — as a ' +
        'percentage of total returned value.',
      unit: '% of returned value identified as fraud or abuse',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 15,
        basis:
          'Fraud-and-abuse share varies with policy generosity, channel ' +
          'mix, and the maturity of detection; the band spans a tightly ' +
          'controlled programme to an exposed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The returns-authorisation and fraud-analytics systems, joining ' +
        'flagged and confirmed cases to total returned value.',
      whyItMatters:
        'Returns fraud is a direct, dollar-for-dollar margin loss and a ' +
        'magnet for organised abuse — it is value refunded against goods ' +
        'the retailer never recovers, and an uncontrolled rate forces the ' +
        'policy tighter at the cost of honest customers.',
    },
    {
      key: 'return_disposition_accuracy',
      name: 'Disposition-decision accuracy',
      definition:
        'The share of returned units routed to the disposition path that ' +
        'maximises net recovery value — restock, refurbish, liquidate, ' +
        'donate, return-to-vendor, destroy — rather than a default or a ' +
        'value-destroying path.',
      unit: '% of units routed to the value-maximising disposition path',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 55,
        high: 90,
        basis:
          'Disposition accuracy depends on grading consistency and ' +
          'whether routing rules reflect real per-channel recovery ' +
          'economics; the band spans a default-routed operation to an ' +
          'optimised one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The returns-disposition system, comparing the chosen path ' +
        'against the realised recovery of each available path for ' +
        'comparable units.',
      whyItMatters:
        'A returned unit can be worth full price or near zero depending ' +
        'on where it is sent — disposition accuracy is the decision ' +
        'quality that separates the two, and a low rate means recoverable ' +
        'value is being routed away by default rules rather than economics.',
    },
    {
      key: 'keep_it_resolution_share',
      name: 'Returnless-resolution (keep-it) share',
      definition:
        'The share of return requests resolved without the unit being ' +
        'shipped back — the customer is refunded or credited and keeps or ' +
        'locally disposes of the item — where that is the lowest-net-cost ' +
        'outcome.',
      unit: '% of resolved returns settled as returnless (keep-it)',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 5,
        high: 25,
        basis:
          'The returnless share is a managed lever — too low forgoes a ' +
          'cheaper resolution for low-value items, too high invites abuse; ' +
          'the band spans a conservative to an aggressive policy. A ' +
          'planning range, not a target.',
        label: 'planning-range',
      },
      dataSource:
        'The returns-authorisation system, identifying resolutions ' +
        'settled without a reverse shipment.',
      whyItMatters:
        'For a low-value item the reverse freight and processing cost can ' +
        'exceed the unit’s recoverable value — a calibrated returnless ' +
        'share captures that saving, but read as a balance because an ' +
        'over-generous policy is itself an abuse vector.',
    },
    {
      key: 'refund_cycle_time',
      name: 'Refund cycle time',
      definition:
        'The elapsed time from a return being received or validated to ' +
        'the customer’s refund or credit being issued and visible to ' +
        'them.',
      unit: 'days, return receipt to refund issued',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 10,
        basis:
          'Refund speed depends on whether the refund is triggered at ' +
          'intake scan or only after full inspection; the band spans an ' +
          'instant-refund model to an inspection-gated one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The returns-authorisation and payment systems, timestamping ' +
        'return receipt through to refund settlement.',
      whyItMatters:
        'The refund is the customer’s lived experience of the return — a ' +
        'slow or uncertain refund is one of the most cited reasons a ' +
        'customer abandons a retailer, so refund speed is loyalty and ' +
        'repurchase at the close of the return.',
    },
    {
      key: 'return_related_repurchase_rate',
      name: 'Return-experience repurchase rate',
      definition:
        'The share of customers who, after completing a return, place ' +
        'another order within a defined window — the read on whether the ' +
        'return experience retained the customer rather than ending the ' +
        'relationship.',
      unit: '% of returning customers who repurchase within the window',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 25,
        high: 60,
        basis:
          'Post-return repurchase depends on how smooth and fair the ' +
          'return felt and whether an exchange was offered in the moment; ' +
          'the band spans a friction-heavy return to a recovery-focused ' +
          'one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The customer-data platform, joining return events to subsequent ' +
        'order history within the measurement window.',
      whyItMatters:
        'A return is a moment of truth in the customer relationship — ' +
        'handled well it converts a refund into a retained, often ' +
        'higher-trust customer; handled badly it is a quiet exit, so this ' +
        'metric is the loyalty verdict on the function.',
    },
    {
      key: 'return_to_vendor_recovery_share',
      name: 'Return-to-vendor / chargeback recovery share',
      definition:
        'The share of eligible returned units for which the cost is ' +
        'recovered from the vendor — through return-to-vendor authorisation ' +
        'or a defect chargeback — rather than absorbed by the retailer.',
      unit: '% of vendor-eligible returns recovered from the vendor',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 75,
        basis:
          'Vendor recovery depends on contract terms, defect-attribution ' +
          'evidence, and the discipline of the RTV process; the band ' +
          'spans a leaky claims process to a rigorous one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The vendor-management and returns-disposition systems, tracking ' +
        'RTV authorisations and chargeback claims against eligible units.',
      whyItMatters:
        'When a return is caused by a vendor defect or covered by vendor ' +
        'terms, the cost belongs to the vendor — recovery share tests ' +
        'whether the retailer is collecting what its contracts allow or ' +
        'silently absorbing cost that is not its own.',
    },
    {
      key: 'reverse_freight_cost_pct',
      name: 'Reverse freight cost as a percent of returned value',
      definition:
        'Total reverse transportation cost — carrier return labels, ' +
        'consolidation and line-haul, drop-off network fees — expressed ' +
        'as a percentage of the original retail value of the returned ' +
        'units it moved.',
      unit: '% of returned retail value',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 12,
        basis:
          'Reverse freight intensity depends on parcel mix, consolidation ' +
          'discipline, and how far returns travel before processing; the ' +
          'band spans a consolidated network to a parcel-by-parcel one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The transportation-management and reverse-logistics systems for ' +
        'return freight cost, set against returned retail value.',
      whyItMatters:
        'Reverse freight is the largest controllable cost line in the ' +
        'reverse flow after labour — consolidation, drop-off routing, and ' +
        'returnless decisions all move it, and it is where a poorly ' +
        'designed reverse network silently erodes recovery.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'default_disposition_value_leak',
      name: 'Default disposition and recovery-value leak',
      description:
        'Returned units are routed to disposition by a fixed default ' +
        'rule — everything to liquidation, everything to a single ' +
        'secondary channel — rather than by the real per-channel recovery ' +
        'economics of that unit. Sellable goods are liquidated, ' +
        'refurbishable goods are destroyed, and recoverable value is ' +
        'surrendered by default.',
      detectionSignal:
        'Restock yield and recovery rate sit low; the disposition mix is ' +
        'flat across very different categories; comparable units in good ' +
        'condition end up in low-value channels.',
      diagnosticQuestion:
        'Is each returned unit routed to disposition by its real ' +
        'per-channel recovery economics, or by a fixed default rule — and ' +
        'how much sellable value goes to liquidation?',
    },
    {
      key: 'returns_processing_backlog',
      name: 'Returns processing backlog and value decay',
      description:
        'Returned units sit in a processing backlog — in transit, in an ' +
        'intake queue, awaiting grading — while their sellable value ' +
        'decays. By the time a unit is dispositioned the resale window ' +
        'has narrowed or closed, and a unit that could have been ' +
        'restocked at full price is now a markdown or a write-off.',
      detectionSignal:
        'Return cycle time runs long and variable; aged returned ' +
        'inventory accumulates at processing nodes; restock yield falls ' +
        'for seasonal and fast-moving categories.',
      diagnosticQuestion:
        'How long does a returned unit take to reach a disposition ' +
        'decision, and how much sellable value is lost to the processing ' +
        'backlog?',
    },
    {
      key: 'returns_fraud_blind_intake',
      name: 'Fraud and abuse invisible at intake',
      description:
        'The return-intake point — a store counter, a carrier drop-off, ' +
        'an online portal — cannot see a customer’s return history, ' +
        'fraud signals, or cross-channel pattern in the moment, so ' +
        'wardrobing, refund fraud, price-arbitrage, and serial-returner ' +
        'abuse are accepted at face value and discovered, if at all, ' +
        'long after the refund.',
      detectionSignal:
        'Returns fraud rate is high or unmeasured; a small share of ' +
        'customers drive a large share of returned value; abuse patterns ' +
        'surface only in retrospective audits.',
      diagnosticQuestion:
        'What return history and fraud signal is visible at the intake ' +
        'point in the moment, and how much fraud and abuse is caught ' +
        'before the refund is issued?',
    },
    {
      key: 'reverse_network_fragmentation',
      name: 'Fragmented, un-consolidated reverse network',
      description:
        'Returns move back through the network parcel by parcel, with no ' +
        'consolidation, no drop-off routing, and no lane optimisation — ' +
        'so the reverse flow is expensive, slow, and uncoordinated, and ' +
        'each return carries far more freight cost than its recovery ' +
        'value can support.',
      detectionSignal:
        'Reverse freight cost as a percent of returned value is high; ' +
        'returns travel long distances to a single processing node; ' +
        'consolidation and drop-off options are unused.',
      diagnosticQuestion:
        'How is the reverse flow consolidated and routed, and how does ' +
        'reverse freight cost compare to the recovery value it is moving?',
    },
    {
      key: 'return_rate_root_cause_blindness',
      name: 'Return-rate root-cause blindness',
      description:
        'The return rate is tracked as a single number with no ' +
        'attribution to its causes — fit and sizing, inaccurate product ' +
        'content, damage in the forward flow, buyer’s remorse, ' +
        'wardrobing — so the function absorbs returns it could have ' +
        'prevented and never feeds the signal back to merchandising, ' +
        'content, or fulfillment.',
      detectionSignal:
        'Return reasons are captured as a coarse free-text or a single ' +
        'generic code; the same SKUs and vendors return at high rates ' +
        'with no corrective action; no return-driver feedback reaches ' +
        'upstream functions.',
      diagnosticQuestion:
        'Is every return attributed to a specific, actionable root ' +
        'cause, and does that signal reach the merchandising, content, ' +
        'and fulfillment teams that can reduce it?',
    },
    {
      key: 'returns_experience_friction',
      name: 'Returns-experience friction and lost loyalty',
      description:
        'The return is hard for the customer — an opaque policy, a ' +
        'manual authorisation step, a slow or uncertain refund, no ' +
        'exchange offered in the moment — so a routine return becomes a ' +
        'reason to leave, and the chance to convert the return into an ' +
        'exchange or a retained customer is lost.',
      detectionSignal:
        'Refund cycle time is long; return-experience survey and ' +
        'contact-centre volume cite returns friction; post-return ' +
        'repurchase rate is low.',
      diagnosticQuestion:
        'How smooth, fast, and certain is the return for the customer, ' +
        'and how often does the return convert into an exchange or a ' +
        'retained relationship rather than an exit?',
    },
    {
      key: 'vendor_recovery_leakage',
      name: 'Vendor cost-recovery leakage',
      description:
        'Returns caused by vendor defects or covered by vendor ' +
        'return-to-vendor and chargeback terms are absorbed by the ' +
        'retailer instead of recovered — because defect attribution is ' +
        'weak, the RTV process is manual and slow, or claim windows ' +
        'lapse — so cost that contractually belongs to the vendor stays ' +
        'on the retailer’s P&L.',
      detectionSignal:
        'Return-to-vendor recovery share is low; defect-driven returns ' +
        'are not separated from customer-choice returns; RTV claims lapse ' +
        'against contractual windows.',
      diagnosticQuestion:
        'How are defect-driven returns identified and attributed, and ' +
        'what share of vendor-eligible cost is actually recovered before ' +
        'the claim window closes?',
    },
    {
      key: 'recommerce_capability_gap',
      name: 'Recommerce and resale-channel capability gap',
      description:
        'The retailer has no graded, trusted secondary channel for ' +
        'returned and open-box goods, so units that cannot be restocked ' +
        'at full price are dumped to bulk liquidation at a steep ' +
        'discount — forgoing the materially higher recovery a managed ' +
        'open-box, refurbished, or resale channel would capture.',
      detectionSignal:
        'Non-restockable returns flow almost entirely to bulk ' +
        'liquidation; there is no consistent condition grading; recovery ' +
        'rate for non-restocked units is low and undifferentiated.',
      diagnosticQuestion:
        'For units that cannot return to full-price stock, is there a ' +
        'graded recommerce or open-box channel, or do they default to ' +
        'bulk liquidation at the lowest recovery?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'returns_disposition_optimization',
      name: 'Returns-disposition optimisation',
      valueMechanism:
        'A model grades each returned unit — condition, category, ' +
        'seasonality, demand, and current inventory position — and routes ' +
        'it to the disposition path that maximises net recovery value: ' +
        'restock, refurbish, open-box resale, liquidation, donation, ' +
        'return-to-vendor, or destruction. Value comes from lifting ' +
        'restock yield, recovery rate, and disposition accuracy at once — ' +
        'moving units away from default value-destroying paths toward the ' +
        'channel that actually pays the most for that specific unit.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Returned-unit condition grades and inspection results',
        'Per-channel realised recovery economics — restock, refurbish, ' +
          'liquidation, resale',
        'Current inventory position and forward demand for the SKU',
        'Vendor return-to-vendor eligibility and contract terms',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends the disposition path; the returns ' +
          'operations lead owns the routing policy and any exception.',
        'Recovery economics must be kept current — a routing rule built ' +
          'on stale liquidation prices quietly destroys value.',
        'Health, safety, and recall rules override recovery economics — ' +
          'a recalled or unsafe unit can never be routed to restock or ' +
          'resale.',
      ],
      metricsMoved: [
        'recovery_rate',
        'restock_yield',
        'return_disposition_accuracy',
        'return_to_vendor_recovery_share',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'returns_fraud_abuse_detection',
      name: 'Returns-fraud and abuse detection',
      valueMechanism:
        'A model scores each return request in real time against the ' +
        'customer’s cross-channel return history, receipt and payment ' +
        'signals, item and price patterns, and known abuse archetypes — ' +
        'wardrobing, refund fraud, price-arbitrage, serial returns — and ' +
        'recommends an action at the intake point: approve, request ' +
        'verification, deny, or refer. Value comes from cutting the ' +
        'returns fraud rate without tightening the policy on honest ' +
        'customers, so abuse is caught before the refund rather than ' +
        'discovered after it.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Cross-channel customer return and purchase history',
        'Receipt, payment-instrument, and refund-method signals',
        'Item, price, and condition patterns on the returned units',
        'Confirmed fraud and abuse case history for model training',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model scores and recommends; an associate or fraud analyst ' +
          'owns the decision to deny or escalate — a score is never an ' +
          'accusation.',
        'A denial that wrongly hits an honest customer is a loyalty and ' +
          'reputational loss — false-positive rate and fairness must be ' +
          'monitored and the customer given recourse.',
        'The model must be reviewed for bias across protected groups and ' +
          'governed by consumer-protection and data-privacy rules.',
      ],
      metricsMoved: [
        'return_fraud_rate',
        'recovery_rate',
        'gross_return_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'returns_demand_forecasting',
      name: 'Returns demand and rate forecasting',
      valueMechanism:
        'A model forecasts the volume, mix, and timing of returns by ' +
        'SKU, category, channel, and node — folding in sales, ' +
        'seasonality, promotion calendars, and historical return ' +
        'behaviour — and serves it as the planning signal for ' +
        'reverse-logistics capacity, processing-centre labour, and the ' +
        'inventory position a restocked return will re-enter. Value comes ' +
        'from staffing and routing the reverse flow to a real forecast ' +
        'rather than reacting to returns as they arrive, cutting backlog ' +
        'and processing cost.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Historical returns by SKU, category, channel, and node',
        'Forward sales and promotion calendars',
        'Seasonality and event patterns that drive return surges',
        'Returns-window policy and channel-mix data',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The forecast is a planning input; reverse-logistics and ' +
          'processing leaders own the capacity and labour decisions built ' +
          'on it.',
        'Post-peak and post-promotion return surges carry wide ' +
          'uncertainty and must be presented as ranges, not point ' +
          'forecasts.',
        'A forecast trained on a constrained, backlogged history learns ' +
          'that constraint as normal — the signal must be corrected for ' +
          'it.',
      ],
      metricsMoved: [
        'return_cycle_time',
        'return_processing_cost_per_unit',
        'gross_return_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'returns_experience_agent',
      name: 'Returns-experience and self-service agent',
      valueMechanism:
        'A conversational agent runs the customer’s return end to end — ' +
        'confirming eligibility against policy, capturing a precise ' +
        'return reason, recommending the lowest-net-cost resolution ' +
        '(reverse ship, drop-off, or returnless), offering an exchange or ' +
        'replacement in the moment, and giving a clear refund timeline. ' +
        'Value comes from a faster, more certain return experience that ' +
        'lifts post-return repurchase, converts returns into exchanges, ' +
        'and routes resolutions to the cheapest viable path.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'The returns policy, eligibility rules, and returns-window data',
        'Order and item history for the customer',
        'Real-time inventory for exchange and replacement offers',
        'Reverse-logistics options and their per-resolution cost',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The agent guides the return; a customer can always reach a ' +
          'human, and a contested or high-value case is routed to a ' +
          'person.',
        'Eligibility and refund-timeline answers must be grounded in ' +
          'current policy and order data — a confidently wrong answer ' +
          'damages trust at a sensitive moment.',
        'A returnless or exchange recommendation must respect the fraud ' +
          'controls — the experience agent cannot override an abuse flag.',
      ],
      metricsMoved: [
        'return_related_repurchase_rate',
        'refund_cycle_time',
        'keep_it_resolution_share',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'reverse_network_optimization',
      name: 'Reverse-logistics network optimisation',
      valueMechanism:
        'A model decides, for each return, the lowest-net-cost reverse ' +
        'path — which drop-off or carrier option, which consolidation ' +
        'point, which processing node — and where a returnless resolution ' +
        'beats shipping the unit back at all, balancing freight, ' +
        'processing, and recovery economics. Value comes from cutting ' +
        'reverse freight cost and per-unit processing cost while shrinking ' +
        'return cycle time, by routing the reverse flow deliberately ' +
        'rather than parcel by parcel.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Reverse carrier, drop-off, and consolidation options and costs',
        'Processing-node capacity, location, and per-unit cost',
        'Return origin, destination, and unit characteristics',
        'Per-unit recovery value to weigh against reverse cost',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model recommends the reverse path; reverse-logistics ' +
          'operations owns the network policy and carrier commitments.',
        'A returnless recommendation must be bounded by the fraud ' +
          'controls and a value threshold — an over-broad keep-it rule ' +
          'is itself an abuse vector.',
        'Cost minimisation must not route returns to a node that cannot ' +
          'process them in time — saving freight to create a backlog ' +
          'destroys recovery value.',
      ],
      metricsMoved: [
        'reverse_freight_cost_pct',
        'return_processing_cost_per_unit',
        'return_cycle_time',
        'keep_it_resolution_share',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'recommerce_resale_grading',
      name: 'Recommerce and resale grading',
      valueMechanism:
        'A computer-vision and model-driven grading step inspects ' +
        'returned and open-box units, assigns a consistent condition ' +
        'grade, generates resale-ready descriptions and pricing, and ' +
        'lists the unit into a managed open-box, refurbished, or resale ' +
        'channel. Value comes from lifting recovery rate on units that ' +
        'cannot return to full-price stock — capturing the materially ' +
        'higher resale recovery instead of dumping the unit into bulk ' +
        'liquidation.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Returned-unit imagery and condition-inspection data',
        'A consistent condition-grading taxonomy and standards',
        'Resale and open-box channel demand and realised pricing',
        'Product catalogue and attribute data for resale listings',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The grading model proposes a condition grade and price; a ' +
          'reviewer owns the standard and audits the grade — a ' +
          'mis-graded resale unit damages the channel’s trust.',
        'Resale listings must be accurate about condition and defects — ' +
          'an overstated grade is a consumer-protection and returns risk ' +
          'in the resale channel itself.',
        'Recalled, unsafe, and brand-restricted goods must be excluded ' +
          'from resale by hard rule, never by model judgement.',
      ],
      metricsMoved: [
        'recovery_rate',
        'restock_yield',
        'return_disposition_accuracy',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'value_maximizing_disposition_engine',
      name: 'Value-maximising disposition engine',
      description:
        'A pattern that grades every returned unit and routes it through ' +
        'a single decision engine to the disposition path with the ' +
        'highest net recovery — restock, refurbish, open-box resale, ' +
        'liquidation, donation, return-to-vendor, or destruction — using ' +
        'live per-channel recovery economics and the current inventory ' +
        'and demand position.',
      boundary:
        'It grades and recommends the disposition path; the returns ' +
        'operations lead owns the routing policy and exceptions. Health, ' +
        'safety, and recall rules override its economics — it cannot ' +
        'route an unsafe unit to resale.',
      humanAccountabilityPoint:
        'The director of returns and reverse logistics accountable for ' +
        'recovery value and the disposition policy.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'intake_point_fraud_screen',
      name: 'Intake-point fraud and abuse screen',
      description:
        'A pattern that scores every return at the moment of intake — ' +
        'store counter, drop-off, or online portal — against ' +
        'cross-channel return history and abuse archetypes, and surfaces ' +
        'a recommended action so wardrobing, refund fraud, and ' +
        'serial-returner abuse are caught before the refund is issued.',
      boundary:
        'It scores and recommends; an associate or fraud analyst owns ' +
        'every decision to deny or escalate, and the customer always has ' +
        'recourse. A score is a signal to verify, never a finding of ' +
        'fraud.',
      humanAccountabilityPoint:
        'The returns-fraud / asset-protection lead accountable for the ' +
        'fraud rate and the fairness of every denial.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'consolidated_reverse_network_pattern',
      name: 'Consolidated reverse-network pattern',
      description:
        'A pattern that routes every return through a deliberate reverse ' +
        'network — drop-off and consolidation points, optimised line-haul ' +
        'lanes, and the right processing node — and decides where a ' +
        'returnless resolution beats a reverse shipment, balancing ' +
        'freight, processing, and recovery economics.',
      boundary:
        'It optimises the reverse path; reverse-logistics operations ' +
        'owns the network design and carrier commitments. It cannot route ' +
        'a return to a node that cannot process it within the recovery ' +
        'window.',
      humanAccountabilityPoint:
        'The reverse-logistics operations leader accountable for reverse ' +
        'freight cost and return cycle time.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'closed_loop_return_experience',
      name: 'Closed-loop return-experience pattern',
      description:
        'A pattern that runs the customer’s return as a single guided ' +
        'flow — eligibility, precise reason capture, lowest-cost ' +
        'resolution, an exchange offer in the moment, and a clear refund ' +
        'timeline — and closes the loop by feeding the captured return ' +
        'reason back to merchandising, content, and fulfillment.',
      boundary:
        'It guides the return and routes the reason signal; a human is ' +
        'always reachable and a contested case escalates. It does not ' +
        'override the fraud screen or the disposition engine.',
      humanAccountabilityPoint:
        'The returns-experience and customer-care lead accountable for ' +
        'the return experience and the post-return repurchase outcome.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'graded_recommerce_channel',
      name: 'Graded recommerce-channel pattern',
      description:
        'A pattern that inspects and consistently grades returned and ' +
        'open-box units, generates resale-ready listings and pricing, ' +
        'and feeds a managed open-box, refurbished, or resale channel — ' +
        'so non-restockable units recover materially more than bulk ' +
        'liquidation would pay.',
      boundary:
        'It grades, prices, and lists; a reviewer owns the grading ' +
        'standard and audits accuracy. Recalled, unsafe, and ' +
        'brand-restricted goods are excluded by hard rule, not model ' +
        'judgement.',
      humanAccountabilityPoint:
        'The recommerce / asset-recovery lead accountable for secondary-' +
        'channel recovery and resale-listing accuracy.',
      controlPosture: 'human-on-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Returns & reverse-logistics value is realised in four connected ' +
      'ways and a forecast must keep them distinct. First, recovered ' +
      'value: better disposition, faster processing, and a graded ' +
      'recommerce channel move units away from liquidation and write-off ' +
      'toward restock, resale, and vendor recovery — a recurring lift in ' +
      'recovery rate that shows up directly as margin retained, not as a ' +
      'cost cut. Second, lower cost to serve: a consolidated reverse ' +
      'network, calibrated returnless resolutions, and forecast-driven ' +
      'processing capacity cut reverse freight and per-unit processing ' +
      'cost. Third, fraud and abuse contained: real-time intake screening ' +
      'cuts the share of returned value lost to wardrobing, refund fraud, ' +
      'and serial abuse — recovered margin at little added cost and ' +
      'without tightening the policy on honest customers. Fourth, ' +
      'retained customers: a smooth, fast, certain return experience ' +
      'converts returns into exchanges and repeat purchases rather than ' +
      'quiet exits. The dominant constraint is that recovery value decays ' +
      'with time and depends on the condition data and channel ' +
      'infrastructure actually in place — so a forecast must be read ' +
      'against the retailer’s grading discipline, reverse-network ' +
      'maturity, and the realism of its recovery-channel economics, not a ' +
      'model-perfect operation. All four levers are recurring once ' +
      'realised, but they compound only as the reverse network and ' +
      'disposition discipline mature.',
    dominantHaircutFactors: [
      {
        factor: 'Recovery-channel economics and resale-market depth',
        rationale:
          'Every disposition and recommerce gain depends on real, ' +
          'realisable prices in the restock, refurbishment, resale, and ' +
          'liquidation channels. Thin resale demand, weak open-box ' +
          'channels, and soft liquidation markets cap how much of the ' +
          'modelled recovery uplift can actually be banked.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled recovery-value gain not realised ' +
            'because secondary-channel demand and pricing fall short of ' +
            'the assumed economics; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Condition data and grading-discipline readiness',
        rationale:
          'Disposition optimisation, recommerce grading, and ' +
          'vendor-recovery claims all rest on accurate, consistent ' +
          'condition data captured at intake. Inconsistent grading and ' +
          'missing inspection data cap how precisely a unit can be routed ' +
          'to its value-maximising path.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Value erosion from inconsistent condition grading and ' +
            'incomplete inspection data; a planning range widening with ' +
            'grading immaturity.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Returns-volume and surge-forecast accuracy',
        rationale:
          'Reverse-network and processing-capacity gains rest on a ' +
          'returns forecast. Post-peak and post-promotion return surges ' +
          'are volatile and hard to predict, so forecast error caps how ' +
          'much of the modelled cost and cycle-time gain is reachable.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from volatile, hard-to-predict return ' +
            'surges after peak and promotional periods; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Policy, consumer-protection, and fraud-fairness limits',
        rationale:
          'Returns-fraud screening and returnless resolutions are ' +
          'bounded by consumer-protection rules, the need to keep the ' +
          'policy fair to honest customers, and the false-positive cost ' +
          'of a wrong denial. Those limits cap how aggressively the fraud ' +
          'and cost levers can be pulled.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled fraud-and-cost gain bounded by ' +
            'consumer-protection rules and the false-positive cost of ' +
            'mis-aimed denials; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Recovery-rate improvement',
        range: {
          low: 5,
          high: 20,
          basis:
            'Percentage-point improvement in recovered value as a share ' +
            'of returned retail value from better disposition, faster ' +
            'processing, and a graded recommerce channel; a planning ' +
            'range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in value recovered as a share of the ' +
          'original retail value of returned units.',
      },
      {
        lever: 'Reverse cost-to-serve reduction',
        range: {
          low: 10,
          high: 30,
          basis:
            'Relative reduction in reverse freight and per-unit ' +
            'processing cost from a consolidated network, calibrated ' +
            'returnless resolutions, and forecast-driven capacity; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in combined reverse freight and ' +
          'processing cost per returned unit.',
      },
      {
        lever: 'Returns-fraud-and-abuse reduction',
        range: {
          low: 15,
          high: 40,
          basis:
            'Relative reduction in the share of returned value lost to ' +
            'fraud and abuse from real-time intake screening; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in returned value identified as ' +
          'fraud or abuse.',
      },
      {
        lever: 'Post-return repurchase uplift',
        range: {
          low: 2,
          high: 8,
          basis:
            'Percentage-point uplift in the share of returning customers ' +
            'who repurchase within the window, from a smoother, faster ' +
            'return experience and in-moment exchanges; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the post-return repurchase rate.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first operational signal in a pilot ' +
      'category and node group (disposition routing, intake fraud catch, ' +
      'reverse-lane consolidation); 9–18 months to a settled, fleet-wide ' +
      'result, because recovery and cost gains only prove out once ' +
      'grading discipline, the reverse network, and the recommerce ' +
      'channel are mature and a full peak-and-return-surge cycle has run.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Returns-management and authorisation system',
        role:
          'The system of record for the return itself — return ' +
          'authorisation, eligibility against policy, return reason, and ' +
          'refund status. The backbone of the return rate, refund-cycle, ' +
          'and returnless-resolution metrics.',
        examples: [
          'Returnly / Loop returns management',
          'Narvar returns',
          'ReverseLogix returns management',
          'in-house returns-authorisation platforms',
        ],
      },
      {
        name: 'Order-management and point-of-sale system',
        role:
          'Holds the original sale, the order and item history, and the ' +
          'transaction the return is matched back to — the join between a ' +
          'return and the sale it reverses.',
        examples: [
          'Manhattan Active Omni',
          'Oracle Retail order management',
          'Oracle Retail Xstore POS',
          'cloud-native order-management platforms',
        ],
      },
      {
        name: 'Reverse-logistics and processing-centre system',
        role:
          'Runs the physical reverse flow — intake, inspection, grading, ' +
          'consolidation, and the processing-centre operation — and the ' +
          'per-unit handling and freight cost.',
        examples: [
          'ReverseLogix',
          'Optoro returns processing',
          'warehouse-management systems configured for returns',
        ],
      },
      {
        name: 'Returns-fraud and abuse-analytics system',
        role:
          'Holds cross-channel return history, fraud scoring, and ' +
          'abuse-case management — the source of the fraud rate and the ' +
          'intake-point screening signal.',
        examples: [
          'Appriss Retail returns-fraud analytics',
          'The Retail Equation verified returns',
          'in-house returns-fraud scoring platforms',
        ],
      },
      {
        name: 'Disposition, liquidation, and recommerce system',
        role:
          'Holds the disposition decision, the secondary-channel ' +
          'economics, and the open-box, refurbishment, resale, and ' +
          'liquidation listings — the source of disposition accuracy and ' +
          'recovery rate.',
        examples: [
          'Optoro disposition and recommerce',
          'B-Stock liquidation marketplace',
          'in-house recommerce and open-box platforms',
        ],
      },
      {
        name: 'Inventory and vendor-management systems',
        role:
          'Hold the sellable inventory a restocked return re-enters and ' +
          'the vendor contracts and return-to-vendor terms — the ' +
          'reference for restock yield and vendor-recovery share.',
        examples: [
          'Oracle Retail Merchandising',
          'enterprise inventory-management systems',
          'vendor-management and RTV-claims platforms',
        ],
      },
    ],
    roles: [
      {
        title: 'VP / Director of Returns & Reverse Logistics',
        accountability:
          'Owns the end-to-end reverse flow — the returns policy ' +
          'economics, recovery value, reverse cost to serve, and the ' +
          'returns-experience outcome.',
      },
      {
        title: 'Reverse-logistics operations manager',
        accountability:
          'Owns the physical reverse network — consolidation, reverse ' +
          'transportation, and processing-centre throughput and cost.',
      },
      {
        title: 'Returns-disposition / asset-recovery manager',
        accountability:
          'Owns the disposition decision and the recovery channels — ' +
          'restock, refurbishment, recommerce, liquidation, and ' +
          'return-to-vendor.',
      },
      {
        title: 'Returns-fraud / asset-protection lead',
        accountability:
          'Owns the returns-fraud and abuse controls, the intake ' +
          'screening, and the fairness of every return denial.',
      },
      {
        title: 'Returns-experience / customer-care lead',
        accountability:
          'Owns the customer’s return experience — policy clarity, ' +
          'refund speed, exchanges, and the post-return relationship.',
      },
      {
        title: 'Recommerce / open-box channel lead',
        accountability:
          'Owns the graded secondary channels — open-box, refurbished, ' +
          'and resale — and the recovery they generate.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Consumer-protection and returns / refund law',
        relevance:
          'Sets the minimum return and refund rights, cooling-off ' +
          'periods, and disclosure rules — the legal floor any returns ' +
          'policy and any fraud denial must respect.',
      },
      {
        name: 'Product-safety and recall regulation',
        relevance:
          'Governs which returned and recalled goods may re-enter ' +
          'sellable or resale stock and which must be quarantined or ' +
          'destroyed — a hard override on the disposition decision.',
      },
      {
        name: 'Data-privacy and consumer-data regulation',
        relevance:
          'Governs the cross-channel customer return history and the ' +
          'profiling used in fraud scoring — the frame that bounds ' +
          'returns-fraud detection and customer-history use.',
      },
      {
        name: 'Environmental, e-waste, and disposal regulation',
        relevance:
          'Governs the destruction and disposal of unsellable returns, ' +
          'e-waste handling, and extended-producer-responsibility ' +
          'obligations — constraints on the destruction disposition ' +
          'path.',
      },
      {
        name: 'Hazardous-materials and restricted-goods rules',
        relevance:
          'Govern the reverse transport and handling of batteries, ' +
          'aerosols, and other restricted goods — constraints on reverse ' +
          'lanes and processing-centre handling.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Reverse logistics',
        definition:
          'The end-to-end process of moving merchandise backward — from ' +
          'the customer back into the retailer’s network — and ' +
          'recovering its value.',
      },
      {
        term: 'Disposition',
        definition:
          'The decision of what to do with a returned unit — restock, ' +
          'refurbish, resell as open-box, liquidate, donate, return to ' +
          'vendor, or destroy.',
      },
      {
        term: 'Recovery rate',
        definition:
          'The value recovered from returned merchandise as a share of ' +
          'its original retail value.',
      },
      {
        term: 'Restock-to-sellable',
        definition:
          'Returning a graded-sellable unit to primary, full-price ' +
          'sellable inventory — the highest-value disposition path.',
      },
      {
        term: 'Wardrobing',
        definition:
          'Returns abuse in which a customer buys, uses, and then ' +
          'returns an item — a worn garment, a used appliance — within ' +
          'the returns window.',
      },
      {
        term: 'Returnless resolution (keep-it)',
        definition:
          'A return settled without a reverse shipment — the customer ' +
          'is refunded or credited and keeps or locally disposes of the ' +
          'item — used when that is the lowest-net-cost outcome.',
      },
      {
        term: 'Return-to-vendor (RTV)',
        definition:
          'Returning a defective or contractually-eligible unit to the ' +
          'vendor and recovering its cost rather than absorbing it.',
      },
      {
        term: 'Recommerce',
        definition:
          'The managed resale of returned, open-box, and refurbished ' +
          'goods through a graded secondary channel.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Returns & Reverse-Logistics Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the reverse flow is leaking recovery value, ' +
        'over-spending on cost to serve, and bleeding to fraud and abuse ' +
        '— with baseline evidence — before a solution is shaped.',
      sections: [
        {
          heading: 'Returns operating context',
          guidance:
            'Name the categories, channels, and nodes in scope, the ' +
            'returns policy and windows, the reverse-network design, and ' +
            'the disposition and recommerce channels in use. State which ' +
            'returns-management, order-management, reverse-logistics, ' +
            'fraud-analytics, and disposition systems run the function.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — gross return rate, processing cost per ' +
            'unit, recovery rate, restock yield, return and refund cycle ' +
            'time, fraud rate, disposition accuracy, returnless share, ' +
            'post-return repurchase, vendor-recovery share, reverse ' +
            'freight percent. For any metric not recorded, name it as a ' +
            'precise seed gap with its expected data source.',
        },
        {
          heading: 'Recovery-value and disposition diagnostic',
          guidance:
            'Analyse the disposition mix, restock yield, and recovery ' +
            'rate by category — how much sellable value is routed to ' +
            'liquidation or write-off by default, how processing backlog ' +
            'erodes recovery, and how vendor-eligible cost is recovered ' +
            'or absorbed.',
        },
        {
          heading: 'Reverse cost-to-serve diagnostic',
          guidance:
            'Analyse reverse freight cost and per-unit processing cost ' +
            'against returned value, the degree of network consolidation, ' +
            'the use of drop-off and returnless resolutions, and where ' +
            'the reverse flow is uneconomic for the unit it moves.',
        },
        {
          heading: 'Fraud, abuse, and returns-experience diagnostic',
          guidance:
            'Analyse the returns fraud and abuse rate, what signal is ' +
            'visible at intake in the moment, the concentration of ' +
            'returned value among serial returners, refund cycle time, ' +
            'and the post-return repurchase rate.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — default disposition value ' +
            'leak, processing backlog, fraud invisible at intake, ' +
            'fragmented reverse network, return-rate root-cause ' +
            'blindness, returns-experience friction, vendor-recovery ' +
            'leakage, recommerce capability gap — and state which are ' +
            'present, with the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — recovery uplift, cost-to-serve reduction, ' +
            'fraud reduction, repurchase uplift — explicitly haircut by ' +
            'recovery-channel economics, condition-data readiness, ' +
            'forecast accuracy, and policy and fairness limits. Every ' +
            'figure a labelled planning range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — ' +
            'consistent condition grades, per-channel recovery economics ' +
            '— is a named ask, not a vague unknown.',
        },
        {
          heading: 'Recommended Move framing',
          guidance:
            'State which AI use-case archetype(s) the evidence points to ' +
            'and why, and what the Move would and would not attempt.',
        },
      ],
    },
    {
      artifact: 'business_case',
      label: 'Returns & Reverse-Logistics Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a returns and ' +
        'reverse-logistics AI Move — baseline, forecast, cost, and the ' +
        'honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recovered value, lower cost to serve, fraud contained, and ' +
            'retained customers, the time-to-value band, and the go / ' +
            'hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — recovery rate, restock yield, processing cost per ' +
            'unit, fraud rate, reverse freight percent. Where a baseline ' +
            'is a seed gap (consistent condition grading and per-channel ' +
            'recovery economics are common ones), say so and state what ' +
            'closing it requires before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — recovery-channel ' +
            'economics, condition-data readiness, forecast accuracy, ' +
            'policy and fairness limits — explicitly and show the haircut ' +
            'math. Keep recovered value, cost, fraud, and repurchase ' +
            'gains distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the returns-management, ' +
            'order-management, reverse-logistics, fraud-analytics, and ' +
            'disposition systems, any inspection and grading hardware, ' +
            'and the operating-model change across reverse operations and ' +
            'customer care.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under softer resale and liquidation ' +
            'markets, weaker condition-data discipline, and a more ' +
            'volatile return-surge pattern. State the downside the CFO is ' +
            'underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example no consistent condition grading at ' +
            'intake, or recovery-channel economics too thin to model — ' +
            'and the evidence that must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged post-return repurchase and recovery-rate metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Returns & Reverse-Logistics Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for ' +
        'the returns and reverse-logistics AI capability, grounded in the ' +
        'function reference patterns, the disposition controls, and the ' +
        'consumer-protection and safety frames.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — value-maximising disposition engine, intake-point ' +
            'fraud screen, consolidated reverse network, closed-loop ' +
            'return experience, graded recommerce channel — and state ' +
            'which apply and how they connect.',
        },
        {
          heading: 'Data and grading architecture',
          guidance:
            'Specify the returns-management, order-management, ' +
            'reverse-logistics, fraud-analytics, disposition, and ' +
            'inventory integrations, the condition-grading taxonomy and ' +
            'any inspection or vision capture, data freshness, and the ' +
            'per-channel recovery-economics feed the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and ' +
            'how a reviewer approves a disposition, a denial, or a ' +
            'resale grade. Define the safety, recall, and consumer-' +
            'protection rules as hard overrides on the model.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how reverse-operations, customer-care, fraud, and ' +
            'recommerce workflows change, how the disposition and intake ' +
            'cadence is reshaped, how the return-reason signal is fed ' +
            'back upstream, and who owns each change.',
        },
        {
          heading: 'Responsible-AI, fairness, and safety controls',
          guidance:
            'State the consumer-protection floor on returns and refunds, ' +
            'the false-positive and fairness controls on fraud denials ' +
            'with customer recourse, the data-privacy governance on ' +
            'cross-channel return history, and the product-safety, ' +
            'recall, and environmental rules that bound the disposition ' +
            'decision.',
        },
        {
          heading: 'Integration and rollout approach',
          guidance:
            'Describe the build sequence, the integration patterns to ' +
            'the returns and reverse-logistics stack, and the phased ' +
            'rollout by category, channel, and processing node.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Returns & Reverse-Logistics Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the returns and ' +
        'reverse-logistics AI capability so value reaches recovered ' +
        'margin, cost to serve, and the customer experience — not just ' +
        'the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot category and node group, reverse-operations and ' +
            'customer-care onboarding, scale across categories and nodes ' +
            '— with milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, condition-data and grading readiness, ' +
            'reverse-operations adoption, fraud and customer-care ' +
            'process, recommerce channel, Tower measurement.',
        },
        {
          heading: 'Reverse-operations and customer-care adoption approach',
          guidance:
            'Define the change runway for reverse-operations, fraud, ' +
            'and customer-care teams — training, the shift in the ' +
            'disposition and intake workflow, and the new return-' +
            'experience flow — and how adoption is measured, not assumed.',
        },
        {
          heading: 'Recovery-channel and recommerce readiness plan',
          guidance:
            'Define how the disposition channels and the graded ' +
            'recommerce channel are stood up and proven, how recovery ' +
            'economics are kept current, and how channel performance is ' +
            'monitored so disposition routing stays accurate.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged repurchase and ' +
            'recovery-rate metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — soft recovery-channel markets, ' +
            'inconsistent condition grading, return-surge forecast error, ' +
            'fraud false positives, consumer-protection friction — with ' +
            'the escalation owner and the trigger for each.',
        },
        {
          heading: 'Go-decision verdict',
          guidance:
            'State the explicit go / no-go verdict for launch and the ' +
            'conditions attached to it.',
        },
      ],
    },
  ],

  // ── Layer 8 — Evidence anchors ────────────────────────────────────────────
  evidenceAnchors: [
    {
      claim: 'Recovered value from returned merchandise',
      authoritativeSource:
        'The returns-disposition and inventory systems, comparing the ' +
        'realised value of each disposition path against the original ' +
        'retail value of the returned units.',
      whatGoodEvidenceLooksLike:
        'A recovery rate and restock yield computed from realised ' +
        'disposition outcomes, broken down by category and disposition ' +
        'path, with the value lost to liquidation and write-off ' +
        'quantified.',
      weakEvidenceToReject:
        'A blended recovery figure with no disposition-path breakdown, ' +
        'or a recovery estimate based on assumed rather than realised ' +
        'secondary-channel prices.',
    },
    {
      claim: 'Reverse cost to serve per returned unit',
      authoritativeSource:
        'The reverse-logistics, transportation, and warehouse-management ' +
        'systems for handling and freight cost, allocated per processed ' +
        'unit.',
      whatGoodEvidenceLooksLike:
        'A fully-loaded per-unit reverse cost separating reverse ' +
        'freight, intake and inspection labour, grading, and ' +
        'repackaging, set against the returned value it moved.',
      weakEvidenceToReject:
        'A single chain-wide reverse-logistics cost with no per-unit or ' +
        'per-component breakdown, or a freight figure that omits ' +
        'processing labour.',
    },
    {
      claim: 'Returns fraud and abuse loss',
      authoritativeSource:
        'The returns-authorisation and fraud-analytics systems, joining ' +
        'flagged and confirmed cases to total returned value.',
      whatGoodEvidenceLooksLike:
        'A fraud-and-abuse rate built from confirmed cases and ' +
        'cross-channel return-history patterns, with the concentration ' +
        'among serial returners quantified.',
      weakEvidenceToReject:
        'An unmeasured fraud assumption, or a generic industry ' +
        'fraud-percentage applied with no tenant return-history ' +
        'evidence.',
    },
    {
      claim: 'The forecast value of a returns and reverse-logistics AI Move',
      authoritativeSource:
        'The value model — recovered-value, cost-to-serve, fraud-' +
        'contained, and retained-customer components, each haircut by ' +
        'its dominant factors — read against the retailer’s grading ' +
        'discipline and reverse-network maturity.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recovered-value, cost, fraud, and ' +
        'repurchase gains kept distinct, and every figure a labelled ' +
        'planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at ' +
        'face value, or a forecast that ignores the recovery-channel and ' +
        'condition-data haircuts.',
    },
    {
      claim: 'Return-rate root cause and the returns it drives',
      authoritativeSource:
        'The returns-management system’s captured return reasons joined ' +
        'to SKU, vendor, and channel data in the merchandising and ' +
        'order-management systems.',
      whatGoodEvidenceLooksLike:
        'A return rate attributed to specific, actionable root causes — ' +
        'fit, content accuracy, forward-flow damage, buyer’s remorse, ' +
        'wardrobing — traced to the SKUs and vendors that drive it.',
      weakEvidenceToReject:
        'A single chain-wide return rate with no reason attribution, or ' +
        'return reasons captured only as coarse free text with no ' +
        'actionable code.',
    },
  ],
};
