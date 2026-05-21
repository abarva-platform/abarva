// Domain Function Pack — Retail · Supply chain & fulfillment.
//
// Function key: `supply_chain_fulfillment`.
//
// This pack covers the retail supply chain & fulfillment function: the
// end-to-end physical and operational network that moves merchandise from the
// vendor to the customer — inbound logistics and vendor compliance, the
// distribution-centre and fulfillment-centre operation, transportation across
// the inbound, between-node, and final-mile legs, the order-management and
// ship-from decision that routes a customer order to a node, the delivery
// promise made at checkout, and the reverse flow of returns. It is the
// function that converts an inventory position into a delivered order, on
// time and at a cost the margin can carry.
//
// The operating reality the pack encodes: in an omnichannel retailer the cost
// to serve and the speed of delivery are decided here, and the function is
// squeezed from two sides at once — customers expect a fast, certain, free
// delivery promise, while every order routed to the wrong node, shipped on an
// expensive lane, or split into multiple parcels erodes the margin the sale
// was meant to earn. Fulfillment leaks at every node — a promise the network
// cannot keep, an order shipped from a distant DC because the routing logic
// ignored a closer store, a final-mile lane priced without optimisation, a
// return that takes weeks to process back into sellable stock. The AI
// archetypes are the recurring bets against exactly that reality —
// fulfillment-node and ship-from optimisation, delivery-promise and ETA
// prediction, transportation and route optimisation, warehouse labour and
// slotting optimisation, supply-disruption detection, and inventory-to-
// fulfillment balancing.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const supplyChainFulfillmentPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'supply_chain_fulfillment',
  functionLabel: 'Supply chain & fulfillment',
  summary:
    'Supply chain & fulfillment is the function that moves merchandise ' +
    'from the vendor to the customer — inbound logistics and vendor ' +
    'compliance, the distribution- and fulfillment-centre operation, ' +
    'transportation across the inbound, between-node, and final-mile legs, ' +
    'the order-management and ship-from decision, the delivery promise made ' +
    'at checkout, and the reverse flow of returns. It converts an inventory ' +
    'position into a delivered order, on time and at a cost the margin can ' +
    'carry. Its economics are the cost to serve and the delivery experience: ' +
    'customers expect a fast, certain delivery promise, while every order ' +
    'routed to the wrong node, shipped on an expensive lane, or split into ' +
    'multiple parcels erodes margin. Fulfillment leaks at every node — a ' +
    'promise the network cannot keep, an order shipped from a distant DC ' +
    'because routing ignored a closer store, a final-mile lane priced ' +
    'without optimisation, a return that takes weeks to re-enter sellable ' +
    'stock — so the function is judged on the joint outcome of reliability, ' +
    'speed, and cost across the whole network.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'on_time_in_full',
      name: 'On-time-in-full (OTIF)',
      definition:
        'The share of orders — inbound vendor orders, or outbound customer ' +
        'and store orders — delivered both complete (every line and unit ' +
        'shipped) and on the committed date. A single joint measure of ' +
        'delivery reliability; an order is OTIF only if it is on time AND ' +
        'in full.',
      unit: '% of orders delivered on time and in full',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 85,
        high: 97,
        basis:
          'OTIF varies with network maturity, vendor reliability, and ' +
          'the strictness of the on-time window; the band spans a well-' +
          'run network to a strained one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The order-management and transportation systems, joining order ' +
        'lines and committed dates to delivery scan and receipt ' +
        'confirmation.',
      whyItMatters:
        'OTIF is the headline reliability measure of the function — it ' +
        'fuses completeness and timeliness into one number, so it cannot ' +
        'be flattered by being fast but short, or complete but late, and ' +
        'it is what a vendor scorecard and a customer promise are judged ' +
        'on.',
    },
    {
      key: 'order_cycle_time',
      name: 'Order cycle time',
      definition:
        'The elapsed time from a customer order being placed to it being ' +
        'delivered — spanning order processing, picking and packing, and ' +
        'all transportation legs.',
      unit: 'hours or days, order placement to delivery',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 6,
        basis:
          'Order cycle time depends on the fulfillment model and service ' +
          'level — same-day and store-fulfilled orders sit at the low end, ' +
          'standard ground parcel at the high end; the band is in days ' +
          'and spans those models. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The order-management system, timestamping order placement ' +
        'through to the final delivery scan.',
      whyItMatters:
        'Order cycle time is the speed the customer experiences and the ' +
        'promise the retailer competes on — it is the lever between ' +
        'meeting a delivery expectation and losing the order to a faster ' +
        'competitor.',
    },
    {
      key: 'perfect_order_rate',
      name: 'Perfect-order rate',
      definition:
        'The share of orders fulfilled with no defect of any kind — on ' +
        'time, complete, undamaged, accurately picked, and correctly ' +
        'documented and invoiced. The strictest joint quality measure of ' +
        'the function.',
      unit: '% of orders with no defect on any dimension',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 95,
        basis:
          'The perfect-order rate is multiplicative across several ' +
          'independent quality dimensions, so it always sits below any ' +
          'single one; the band spans network maturity. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The order-management, warehouse-management, and transportation ' +
        'systems combined, joining each order to its on-time, complete, ' +
        'damage-free, accuracy, and documentation status.',
      whyItMatters:
        'The perfect-order rate is the true end-to-end quality verdict — ' +
        'because it is multiplicative, it exposes a defect on any one ' +
        'dimension that a single metric like OTIF would miss, and it ' +
        'predicts the returns and service-cost that follow a flawed order.',
    },
    {
      key: 'cost_to_serve_per_order',
      name: 'Cost-to-serve / cost per order',
      definition:
        'The fully loaded cost of fulfilling one customer order — order ' +
        'processing, warehouse pick-pack, packaging, all transportation ' +
        'legs, and the allocated cost of returns — expressed per order.',
      unit: 'USD per order',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 6,
        high: 25,
        basis:
          'Cost to serve varies widely with basket value, parcel size and ' +
          'weight, delivery speed, and fulfillment model; the band spans ' +
          'a dense, store-fulfilled small parcel to a fast, distant, ' +
          'multi-parcel order. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'A cost-to-serve model joining the warehouse-management, ' +
        'transportation, and returns systems to allocate fulfillment cost ' +
        'to the order.',
      whyItMatters:
        'Cost to serve is the margin verdict of the function — an ' +
        'omnichannel order can cost more to fulfill than its margin earns, ' +
        'so this metric is what tells the retailer whether a delivery ' +
        'promise is profitable or quietly loss-making.',
    },
    {
      key: 'fill_rate',
      name: 'Fill rate',
      definition:
        'The share of ordered units or lines that can be shipped from ' +
        'available inventory at the point of order — without a backorder, ' +
        'a substitution, or a cancellation.',
      unit: '% of ordered units shipped from available stock',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 90,
        high: 99,
        basis:
          'Fill rate depends on inventory accuracy and positioning across ' +
          'the network; the band spans a well-positioned network to one ' +
          'with frequent inventory gaps. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The order-management system, comparing ordered units against ' +
        'units shipped from available inventory by node.',
      whyItMatters:
        'Fill rate is where inventory position becomes a fulfillment ' +
        'outcome — a low fill rate forces backorders, splits, and ' +
        'cancellations that all raise cost to serve and damage the ' +
        'delivery promise.',
    },
    {
      key: 'transportation_cost_pct_sales',
      name: 'Transportation cost as % of sales',
      definition:
        'Total transportation spend — inbound freight, between-node ' +
        'transfers, and outbound and final-mile delivery — as a share of ' +
        'net sales over the same period.',
      unit: '% of net sales',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 3,
        high: 10,
        basis:
          'Transportation intensity varies with product weight and cube, ' +
          'network density, and the channel mix; the band spans a dense, ' +
          'light-product network to a heavy, dispersed one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'The transportation-management and finance systems, totalling ' +
        'freight spend across all legs against net sales.',
      whyItMatters:
        'Transportation is the largest single controllable cost in ' +
        'fulfillment — it is the line where routing, mode, and carrier ' +
        'decisions either protect or erode margin, and the ratio is the ' +
        'board-level measure of whether it is in control.',
    },
    {
      key: 'warehouse_throughput',
      name: 'Warehouse throughput / productivity',
      definition:
        'The volume processed per unit of warehouse labour — units or ' +
        'lines or orders picked, packed, and shipped per labour hour — ' +
        'across the distribution and fulfillment centres.',
      unit: 'units (or lines) per labour hour',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 40,
        high: 150,
        basis:
          'Throughput depends heavily on automation level, order profile, ' +
          'and pick methodology; the band spans a manual operation to a ' +
          'highly automated one and is meaningful only within a ' +
          'comparable model. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The warehouse-management and labour-management systems, ' +
        'comparing processed volume against paid labour hours.',
      whyItMatters:
        'Warehouse throughput is the productivity engine of the ' +
        'fulfillment cost line — labour is the largest controllable cost ' +
        'inside the four walls, so throughput is what governs how much ' +
        'volume the network can serve at a given cost.',
    },
    {
      key: 'last_mile_cost_per_delivery',
      name: 'Last-mile cost per delivery',
      definition:
        'The cost of the final delivery leg — from the last node to the ' +
        'customer’s address — per delivered order, including failed-' +
        'delivery and re-attempt cost.',
      unit: 'USD per final-mile delivery',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 18,
        basis:
          'Last-mile cost varies with drop density, parcel size, delivery ' +
          'speed, and the urban / rural mix; the band spans a dense urban ' +
          'route to a dispersed rural one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The transportation-management system and final-mile carrier ' +
        'settlement, allocated to the delivered order.',
      whyItMatters:
        'The last mile is the most expensive and least efficient leg of ' +
        'the journey — it is where the bulk of delivery cost concentrates, ' +
        'so it is the leg where routing and density decisions move cost ' +
        'to serve the most.',
    },
    {
      key: 'delivery_promise_accuracy',
      name: 'Delivery-promise accuracy',
      definition:
        'The share of orders delivered within the delivery date or window ' +
        'promised to the customer at the point of checkout — a measure of ' +
        'how truthful the promise is, not how fast.',
      unit: '% of orders delivered within the promised window',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 88,
        high: 98,
        basis:
          'Promise accuracy depends on how realistically the promise is ' +
          'set and how reliably the network executes it; the band spans a ' +
          'conservative, well-executed promise to an aggressive, ' +
          'unreliable one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The order-management system, comparing the checkout-time ' +
        'promised date against the actual final delivery scan.',
      whyItMatters:
        'A delivery promise is a commitment to the customer — promise ' +
        'accuracy is where the function’s credibility lives; a fast ' +
        'promise that is frequently missed damages trust more than a ' +
        'slower promise that is always kept.',
    },
    {
      key: 'returns_processing_time',
      name: 'Returns processing time',
      definition:
        'The elapsed time from a returned item arriving at a return node ' +
        'to it being dispositioned — restocked as sellable, routed to ' +
        'liquidation, or scrapped — and, where sellable, made available ' +
        'to sell again.',
      unit: 'days from receipt to disposition',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 2,
        high: 14,
        basis:
          'Returns processing time depends on the reverse-logistics ' +
          'design and the disposition complexity; the band spans a ' +
          'streamlined returns operation to a manual, backlogged one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The returns-management / reverse-logistics system, timestamping ' +
        'return receipt through to disposition and re-availability.',
      whyItMatters:
        'Returns processing time is where reverse logistics either ' +
        'recovers value or destroys it — every day a sellable return sits ' +
        'undispositioned is a day of lost selling opportunity and ' +
        'depreciation, especially in fast-lifecycle categories.',
    },
    {
      key: 'split_shipment_rate',
      name: 'Split-shipment rate',
      definition:
        'The share of multi-line customer orders fulfilled in more than ' +
        'one shipment — from more than one node — rather than consolidated ' +
        'into a single parcel and delivery.',
      unit: '% of multi-line orders shipped in multiple parcels',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 5,
        high: 30,
        basis:
          'Split rate depends on inventory positioning and the ' +
          'sophistication of the order-routing logic; the band spans a ' +
          'well-positioned network with consolidation logic to a poorly ' +
          'positioned one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The order-management system, comparing the number of shipments ' +
        'against the number of multi-line orders.',
      whyItMatters:
        'Every split adds a parcel, a pick, and a transportation leg — ' +
        'the split rate is a direct, controllable driver of cost to serve ' +
        'and a frequent silent erosion of omnichannel margin.',
    },
    {
      key: 'inbound_vendor_compliance_rate',
      name: 'Inbound vendor-compliance rate',
      definition:
        'The share of inbound vendor shipments that arrive compliant with ' +
        'routing, labelling, packaging, advance-ship-notice, and on-time ' +
        'requirements — and so flow through receiving without an ' +
        'exception or a chargeback.',
      unit: '% of inbound shipments compliant',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 95,
        basis:
          'Vendor compliance depends on the vendor base and how actively ' +
          'a compliance program is enforced; the band spans a well-managed ' +
          'vendor program to a loose one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The warehouse-management and vendor-compliance systems, scoring ' +
        'inbound receipts against the routing and compliance guide.',
      whyItMatters:
        'Non-compliant inbound freight is the upstream cause of receiving ' +
        'delays, mis-stocked inventory, and ASN errors — it degrades ' +
        'every downstream metric, so compliance is the leverage point at ' +
        'the front of the network.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'suboptimal_order_routing',
      name: 'Sub-optimal order routing and node selection',
      description:
        'The order-management system routes a customer order to a node on ' +
        'a fixed hierarchy or a nearest-DC rule that ignores true cost — ' +
        'so orders ship from a distant or expensive node when a closer ' +
        'store or DC could have fulfilled them faster and cheaper, and ' +
        'multi-line orders split unnecessarily.',
      detectionSignal:
        'Last-mile cost and transportation cost as a percent of sales are ' +
        'high; the split-shipment rate is elevated; orders frequently ' +
        'ship from a node that was not the lowest-cost feasible option.',
      diagnosticQuestion:
        'On what logic does the order-management system choose a ' +
        'fulfillment node, and does that logic weigh true cost to serve ' +
        'and consolidation, or only distance and a node hierarchy?',
    },
    {
      key: 'unreliable_delivery_promise',
      name: 'Unreliable or mis-set delivery promise',
      description:
        'The delivery date shown at checkout is set on a static rule that ' +
        'does not reflect real node capacity, carrier performance, or ' +
        'current conditions — so the promise is either too aggressive and ' +
        'frequently missed, or too conservative and loses the order to a ' +
        'faster competitor.',
      detectionSignal:
        'Delivery-promise accuracy is below target; customer contacts ' +
        'about late delivery are a material share of service volume; ' +
        'promised windows do not move with node load or carrier ' +
        'conditions.',
      diagnosticQuestion:
        'How is the delivery promise at checkout calculated, and how ' +
        'often is the promised date actually met across the order ' +
        'profile?',
    },
    {
      key: 'transportation_cost_leakage',
      name: 'Transportation cost leakage',
      description:
        'Freight is tendered without optimising mode, carrier, lane, and ' +
        'consolidation — expedited shipping is used as a default rather ' +
        'than an exception, less-than-truckload freight is not ' +
        'consolidated, and final-mile routes are not density-optimised — ' +
        'so transportation spend runs above what the volume requires.',
      detectionSignal:
        'Transportation cost as a percent of sales exceeds the category ' +
        'planning range; expedited-freight charges are a recurring share ' +
        'of spend; carrier and lane performance is not benchmarked.',
      diagnosticQuestion:
        'How are mode, carrier, and lane chosen for each shipment, and ' +
        'what share of freight spend is expedited or un-consolidated when ' +
        'it did not need to be?',
    },
    {
      key: 'warehouse_labour_inefficiency',
      name: 'Warehouse labour and slotting inefficiency',
      description:
        'Warehouse labour is planned on a flat headcount and a static ' +
        'slotting layout that do not flex with order volume or velocity — ' +
        'so fast-moving items sit far from pack-out, travel distance per ' +
        'pick is excessive, and labour is over- or under-staffed against ' +
        'the actual order wave.',
      detectionSignal:
        'Warehouse throughput per labour hour is below the comparable ' +
        'model; pick travel distance is high; labour cost per unit swings ' +
        'with volume because staffing does not flex to the wave.',
      diagnosticQuestion:
        'How is warehouse labour planned against the forecast order wave, ' +
        'and how recently was slotting re-optimised against current item ' +
        'velocity?',
    },
    {
      key: 'slow_returns_recovery',
      name: 'Slow returns processing and value recovery',
      description:
        'Returned items sit in a reverse-logistics backlog before being ' +
        'inspected and dispositioned — so sellable stock is unavailable ' +
        'to sell for days or weeks, disposition decisions are made without ' +
        'value data, and recoverable value depreciates or is scrapped ' +
        'that did not need to be.',
      detectionSignal:
        'Returns processing time is long; a standing backlog of ' +
        'un-dispositioned returns; a high share of returns scrapped or ' +
        'liquidated rather than restocked as sellable.',
      diagnosticQuestion:
        'How long does a returned item take to be dispositioned and made ' +
        'sellable again, and how is the restock-versus-liquidate decision ' +
        'made?',
    },
    {
      key: 'inbound_vendor_noncompliance',
      name: 'Inbound vendor non-compliance',
      description:
        'Vendors ship outside the routing, labelling, packaging, and ' +
        'advance-ship-notice requirements — so inbound freight jams ' +
        'receiving, inventory is mis-recorded or delayed to the sales ' +
        'floor, and the compliance program generates chargeback disputes ' +
        'instead of behaviour change.',
      detectionSignal:
        'Inbound vendor-compliance rate is low; receiving exceptions and ' +
        'ASN mismatches are frequent; the same vendors recur in ' +
        'compliance failures without improving.',
      diagnosticQuestion:
        'What share of inbound vendor shipments arrive fully compliant, ' +
        'and how is non-compliance detected, charged back, and turned ' +
        'into vendor behaviour change?',
    },
    {
      key: 'fragmented_network_visibility',
      name: 'Fragmented network and inventory visibility',
      description:
        'Order management, warehouse management, transportation, and the ' +
        'store inventory systems do not share a single real-time view of ' +
        'inventory and orders — so the routing engine decides on stale ' +
        'positions, the promise is set on guessed capacity, and ' +
        'exceptions are discovered at the dock rather than anticipated.',
      detectionSignal:
        'Available-to-promise inventory diverges from physical reality; ' +
        'orders are routed to nodes that cannot fulfill them; disruptions ' +
        'are discovered late because no system holds the end-to-end view.',
      diagnosticQuestion:
        'Is there a single real-time view of inventory and order status ' +
        'across nodes, or do routing and promising decisions run on ' +
        'lagged, system-specific data?',
    },
    {
      key: 'supply_disruption_exposure',
      name: 'Supply-disruption and capacity-shock exposure',
      description:
        'A port delay, a carrier capacity shortage, a weather event, or a ' +
        'node outage hits the network with no early signal and no ' +
        'pre-planned re-routing — so the function reacts late, defaults ' +
        'to expedited freight, and misses delivery promises across a wide ' +
        'set of orders at once.',
      detectionSignal:
        'Disruptions are discovered as missed deliveries rather than ' +
        'forecast; expedited freight and promise misses spike around ' +
        'external events; there is no maintained re-routing or ' +
        'contingency-capacity plan.',
      diagnosticQuestion:
        'How early does the function see a developing disruption — a port ' +
        'backup, a carrier capacity squeeze, a node outage — and is there ' +
        'a pre-planned re-routing response before deliveries are missed?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'fulfillment_node_ship_from_optimization',
      name: 'Fulfillment-node & ship-from optimisation',
      valueMechanism:
        'A model chooses the fulfillment node — DC, fulfillment centre, ' +
        'or ship-from store — for each customer order by minimising true ' +
        'cost to serve subject to the delivery promise: weighing ' +
        'transportation cost, the value of consolidating lines into one ' +
        'parcel, node labour capacity, and the markdown risk of the ' +
        'inventory at each node. Value comes from routing orders to the ' +
        'genuinely lowest-cost feasible node and cutting unnecessary ' +
        'splits — lowering cost to serve and the split-shipment rate ' +
        'without missing the promise.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Real-time inventory positions across every node',
        'Lane- and node-level transportation cost and time data',
        'Node labour capacity and current order load',
        'The order contents, destination, and the promised delivery date',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model routes orders automatically within governed rules; a ' +
          'fulfillment operations lead monitors and owns the routing ' +
          'policy and the exception thresholds.',
        'Routing decisions are only as good as inventory accuracy — a ' +
          'phantom on-hand routes an order to a node that cannot fulfill ' +
          'it, so accuracy is a prerequisite, not an afterthought.',
        'Ship-from-store routing must respect store-level labour capacity ' +
          'and the in-store customer experience — fulfillment cannot be ' +
          'pushed onto a store that the in-store demand already saturates.',
      ],
      metricsMoved: [
        'cost_to_serve_per_order',
        'split_shipment_rate',
        'transportation_cost_pct_sales',
        'order_cycle_time',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'delivery_promise_eta_prediction',
      name: 'Delivery-promise & ETA prediction',
      valueMechanism:
        'A model predicts the deliverable date at checkout from real node ' +
        'capacity, carrier and lane performance, current order load, and ' +
        'conditions — and updates the ETA in flight — replacing a static ' +
        'promise rule. Value comes from making the promise both more ' +
        'accurate and as fast as the network can truthfully support, ' +
        'lifting delivery-promise accuracy and removing the late-delivery ' +
        'service contacts a missed promise generates.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Historical carrier and lane transit-time performance',
        'Current node capacity, order load, and cut-off times',
        'Order destination and service-level options at checkout',
        'Real-time disruption and weather signals',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model sets and updates the promised date within governed ' +
          'bounds; a fulfillment lead owns the promise policy and the ' +
          'conservatism setting.',
        'The promise must be tuned for the asymmetry of error — a missed ' +
          'promise costs customer trust more than a slightly conservative ' +
          'one, so the model is not optimised for speed alone.',
        'An in-flight ETA change must be communicated clearly and not ' +
          'used to quietly walk back a promise the customer relied on.',
      ],
      metricsMoved: [
        'delivery_promise_accuracy',
        'order_cycle_time',
        'on_time_in_full',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'transportation_route_optimization',
      name: 'Transportation & route optimisation',
      valueMechanism:
        'A model optimises mode, carrier, lane, load consolidation, and — ' +
        'for the final mile — delivery route and stop sequence, choosing ' +
        'the lowest-cost option that still meets the service commitment. ' +
        'Value comes from cutting transportation spend through better ' +
        'consolidation, mode selection, and density-optimised final-mile ' +
        'routing — lowering transportation cost as a percent of sales and ' +
        'last-mile cost per delivery.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Carrier, lane, and mode rate and performance data',
        'Shipment dimensions, weight, origin, destination, and service ' +
          'commitment',
        'Final-mile delivery addresses, time windows, and vehicle ' +
          'capacity',
        'Real-time traffic and condition data for route execution',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes and can execute routing and carrier ' +
          'selection within governed rules; a transportation manager owns ' +
          'carrier strategy and the service-cost trade-off thresholds.',
        'Cost optimisation must not silently degrade the service ' +
          'commitment — the cheapest mode is not chosen when it breaches ' +
          'the delivery promise the order was sold on.',
        'Final-mile route optimisation must respect driver hours, vehicle ' +
          'capacity, and committed delivery windows.',
      ],
      metricsMoved: [
        'transportation_cost_pct_sales',
        'last_mile_cost_per_delivery',
        'cost_to_serve_per_order',
        'on_time_in_full',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'warehouse_labour_slotting_optimization',
      name: 'Warehouse labour & slotting optimisation',
      valueMechanism:
        'A model forecasts the inbound and outbound order wave, plans ' +
        'warehouse labour against it shift by shift, and continuously ' +
        're-optimises slotting so fast-moving items sit closest to ' +
        'pack-out and pick paths are short. Value comes from raising ' +
        'units processed per labour hour and flexing staffing to the ' +
        'wave — lifting warehouse throughput and steadying labour cost ' +
        'per unit.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Historical and forecast order-volume and order-profile data',
        'Item velocity, dimensions, and current slot assignments',
        'Labour-management data — task times, headcount, shift patterns',
        'Warehouse layout and pick-path topology',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes labour plans and slotting moves; a warehouse ' +
          'operations manager reviews and owns the staffing and re-slot ' +
          'decisions.',
        'Labour planning must respect scheduling rules, fair-workweek ' +
          'commitments, and the realistic ramp of new staff — it cannot ' +
          'optimise headcount as if labour were perfectly elastic.',
        'A slotting re-optimisation must be sequenced so the physical ' +
          're-slotting effort does not cost more than the pick-travel ' +
          'saving it captures.',
      ],
      metricsMoved: [
        'warehouse_throughput',
        'cost_to_serve_per_order',
        'order_cycle_time',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'supply_disruption_detection',
      name: 'Supply-disruption detection & re-routing',
      valueMechanism:
        'An agent monitors external and internal signals — port and ' +
        'carrier status, weather, node throughput, lane transit drift — ' +
        'to detect a developing disruption early, predict which orders ' +
        'and lanes are exposed, and propose a re-routing and contingency ' +
        'plan. Value comes from acting ahead of the disruption — ' +
        're-routing before deliveries are missed — instead of reacting ' +
        'with expedited freight and a wave of missed promises.',
      adoptionProfile: 'early',
      dataDependencies: [
        'External port, carrier-capacity, and weather signal feeds',
        'Internal node-throughput and lane transit-time telemetry',
        'The forward order book and its exposure by node and lane',
        'A maintained set of alternate nodes, lanes, and carriers',
      ],
      controlPosture: 'human-approval-required',
      controlRiskNotes: [
        'The agent detects and proposes a re-routing plan; a supply-chain ' +
          'control-tower lead approves any network-level re-routing or ' +
          'contingency activation.',
        'A disruption signal must be calibrated against false positives — ' +
          'an over-sensitive model that re-routes on noise creates cost ' +
          'and churn of its own.',
        'Contingency capacity and alternate lanes must be genuinely ' +
          'available and pre-qualified — a re-routing plan to a node ' +
          'without capacity is no plan at all.',
      ],
      metricsMoved: [
        'on_time_in_full',
        'delivery_promise_accuracy',
        'transportation_cost_pct_sales',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'inventory_to_fulfillment_balancing',
      name: 'Inventory-to-fulfillment balancing',
      valueMechanism:
        'A model positions and rebalances inventory across the ' +
        'fulfillment network — DCs, fulfillment centres, and ship-from ' +
        'stores — so that demand for each item is met from a node close ' +
        'to its customers, proposing pre-positioning and inter-node ' +
        'transfers ahead of demand. Value comes from raising the fill ' +
        'rate and cutting splits and long-haul shipments — lowering cost ' +
        'to serve by making the right inventory available at the right ' +
        'node before the order arrives.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Inventory positions across every fulfillment node',
        'Channel- and geography-level demand forecasts',
        'Inter-node transfer cost, lead time, and capacity',
        'Order-routing outcomes and the split and long-haul history',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes pre-positioning and transfers; an inventory ' +
          'and fulfillment planning lead reviews and owns the network ' +
          'rebalancing decisions.',
        'A transfer must be costed against its freight and handling so ' +
          'the rebalancing does not cost more than the routing saving it ' +
          'unlocks.',
        'Balancing for fulfillment must stay consistent with the ' +
          'merchandise plan — it positions inventory, it does not ' +
          'override what the assortment and the buy decided.',
      ],
      metricsMoved: [
        'fill_rate',
        'split_shipment_rate',
        'cost_to_serve_per_order',
        'last_mile_cost_per_delivery',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'cost_aware_order_orchestration',
      name: 'Cost-aware order-orchestration layer',
      description:
        'A pattern that routes every customer order through a single ' +
        'orchestration engine that selects the fulfillment node on true ' +
        'cost to serve, consolidation value, and the delivery promise — ' +
        'rather than a fixed node hierarchy — and sets and updates the ' +
        'promise from the same real-time view.',
      boundary:
        'It routes orders and sets the promise within a governed routing ' +
        'and promise policy; a fulfillment operations lead owns the ' +
        'policy and the exception thresholds. It does not change the ' +
        'service-level options offered or the carrier strategy.',
      humanAccountabilityPoint:
        'The director of fulfillment operations, accountable for cost to ' +
        'serve and delivery-promise accuracy.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'transportation_optimization_layer',
      name: 'Transportation-optimisation pattern',
      description:
        'A pattern that optimises mode, carrier, lane, consolidation, and ' +
        'final-mile route as one connected problem — choosing the lowest-' +
        'cost option that still meets each shipment’s service commitment ' +
        '— and executes carrier tendering and route plans against it.',
      boundary:
        'It optimises and executes routing within governed service-cost ' +
        'rules; a transportation manager owns carrier strategy and the ' +
        'service-cost trade-off thresholds. It does not set service-level ' +
        'commitments or change the carrier base.',
      humanAccountabilityPoint:
        'The director of transportation, accountable for transportation ' +
        'cost as a percent of sales and on-time delivery.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'adaptive_warehouse_operations',
      name: 'Adaptive warehouse-operations pattern',
      description:
        'A pattern that runs the warehouse against a forecast order wave ' +
        '— flexing labour shift by shift and continuously re-optimising ' +
        'slotting to item velocity — so throughput per labour hour rises ' +
        'and staffing tracks volume rather than a flat headcount.',
      boundary:
        'It proposes labour plans and slotting moves; a warehouse ' +
        'operations manager owns the staffing and re-slot decisions ' +
        'within scheduling and fair-workweek rules. It does not set ' +
        'headcount policy or scheduling rules.',
      humanAccountabilityPoint:
        'The distribution-centre / fulfillment-centre general manager, ' +
        'accountable for warehouse throughput and labour cost.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'network_control_tower',
      name: 'Network control-tower pattern',
      description:
        'A pattern that maintains a single real-time view of inventory, ' +
        'orders, and transit across the network, detects developing ' +
        'disruptions early, and runs a pre-planned re-routing and ' +
        'contingency response — turning disruption management from ' +
        'reactive expediting into a governed control-tower process.',
      boundary:
        'It detects, predicts exposure, and proposes a re-routing plan; a ' +
        'control-tower lead approves any network-level re-routing or ' +
        'contingency activation. It does not activate contingency ' +
        'capacity autonomously.',
      humanAccountabilityPoint:
        'The supply-chain control-tower lead, accountable for network ' +
        'resilience and disruption response.',
      controlPosture: 'human-approval-required',
      relatedCanonicalPatternId: 'workflow_automation',
    },
    {
      key: 'closed_loop_reverse_logistics',
      name: 'Closed-loop reverse-logistics pattern',
      description:
        'A pattern that runs returns as a fast, value-aware closed loop — ' +
        'predicting the best disposition for each returned item, routing ' +
        'it to restock, liquidation, or repair accordingly, and getting ' +
        'sellable stock back into the available pool quickly.',
      boundary:
        'It recommends disposition and routes the return; a returns ' +
        'operations owner reviews exceptions and owns the disposition ' +
        'policy and the liquidation-channel choices. It does not set ' +
        'returns or refund policy.',
      humanAccountabilityPoint:
        'The reverse-logistics / returns operations manager, accountable ' +
        'for returns processing time and recovered value.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Supply chain & fulfillment value is realised along four distinct ' +
      'levers and a forecast must keep them separate. First, ' +
      'transportation and routing cost: smarter node selection, mode and ' +
      'carrier optimisation, consolidation, and density-optimised final ' +
      'mile lower the cost of moving every order — a recurring cost ' +
      'reduction and usually the largest single lever. Second, warehouse ' +
      'productivity: labour planned to the wave and slotting optimised to ' +
      'velocity raise units per labour hour — a recurring labour-cost ' +
      'reduction. Third, the delivery experience: a more accurate, ' +
      'reliably-kept promise lifts conversion and retention and removes ' +
      'late-delivery service cost — a recurring revenue and cost effect, ' +
      'real but harder to attribute precisely. Fourth, recovered value ' +
      'and avoided cost: faster returns disposition returns sellable ' +
      'stock to the pool sooner, and disruption detection avoids the ' +
      'expedited-freight and missed-promise cost of a reactive response. ' +
      'The dominant constraint is that the cost levers and the experience ' +
      'lever pull against each other — the cheapest fulfillment is rarely ' +
      'the fastest — so a credible forecast optimises cost subject to the ' +
      'service commitment and never claims maximum cost reduction and ' +
      'maximum speed from the same plan.',
    dominantHaircutFactors: [
      {
        factor: 'Network and inventory-visibility data quality',
        rationale:
          'Order routing, promise prediction, and inventory balancing ' +
          'all assume a real-time, accurate view of inventory and order ' +
          'status across nodes. Inventory inaccuracy and fragmented, ' +
          'lagged system data cap how much of the modelled value any ' +
          'optimisation can deliver — a routing decision on a phantom ' +
          'on-hand is wrong however good the model.',
        typicalHaircut: {
          low: 0.2,
          high: 0.4,
          basis:
            'The share of a modelled fulfillment gain not reachable ' +
            'because inventory and network data are not accurate or ' +
            'real-time enough; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Carrier capacity, rates, and external volatility',
        rationale:
          'Transportation savings depend on carrier capacity and rates ' +
          'and on a stable lane environment — all outside the retailer’s ' +
          'control and volatile through peak, fuel-price swings, and ' +
          'disruption. Volatility caps the transportation-cost gain a ' +
          'plan can lock in.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Value erosion from carrier-capacity, rate, and external ' +
            'volatility outside the function’s control; a planning range ' +
            'widest through peak season.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Operating-model and labour adoption',
        rationale:
          'Routing, labour-planning, and slotting gains only land if the ' +
          'warehouse and transportation teams adopt the new workflow and ' +
          'the labour model can flex within scheduling and fair-workweek ' +
          'rules. Partial adoption and labour rigidity realise a fraction ' +
          'of the modelled saving.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Value erosion from partial operating-model adoption and ' +
            'labour-flexibility constraints; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Service-commitment floor',
        rationale:
          'Cost optimisation is bounded by the delivery promise the ' +
          'retailer has sold — the cheapest routing, mode, or node cannot ' +
          'be chosen when it breaches the service commitment, so a share ' +
          'of the theoretical cost saving is unreachable without ' +
          'degrading the customer experience.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled cost saving unreachable without ' +
            'breaching the delivery-service commitment; a planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Transportation and routing cost reduction',
        range: {
          low: 4,
          high: 15,
          basis:
            'Relative reduction in total transportation and routing cost ' +
            'from node optimisation, mode and carrier selection, ' +
            'consolidation, and final-mile routing; a planning range ' +
            'spanning early and mature optimisation.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in total transportation and ' +
          'routing cost.',
      },
      {
        lever: 'Cost-to-serve reduction per order',
        range: {
          low: 5,
          high: 18,
          basis:
            'Relative reduction in fully loaded cost per order from ' +
            'fewer splits, better node selection, and warehouse ' +
            'productivity; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in cost to serve per order.',
      },
      {
        lever: 'Warehouse labour-productivity gain',
        range: {
          low: 8,
          high: 25,
          basis:
            'Relative improvement in units processed per labour hour ' +
            'from wave-based labour planning and slotting optimisation; a ' +
            'planning range, larger where the starting operation is ' +
            'manual.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent improvement in warehouse throughput per ' +
          'labour hour.',
      },
      {
        lever: 'Returns value recovery from faster disposition',
        range: {
          low: 10,
          high: 35,
          basis:
            'Relative improvement in value recovered from returned ' +
            'inventory through faster, value-aware disposition that ' +
            'returns sellable stock to the pool sooner; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent improvement in value recovered per returned ' +
          'unit.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first measurable signal on cost to serve and ' +
      'transportation cost once routing and transportation optimisation ' +
      'are live on a node or lane subset; 12–18 months to a settled ' +
      'network-wide result, because warehouse-labour, returns, and ' +
      'disruption-resilience effects need a full peak-season cycle to be ' +
      'proven rather than projected.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Order-management system (OMS)',
        role:
          'Orchestrates the customer order — inventory availability, the ' +
          'ship-from / node decision, the delivery promise, and order ' +
          'status — the brain of omnichannel fulfillment.',
        examples: [
          'Manhattan Active Omni',
          'IBM Sterling Order Management',
          'Fluent Commerce / Salesforce Order Management',
        ],
      },
      {
        name: 'Warehouse-management system (WMS)',
        role:
          'Runs the distribution and fulfillment centre — receiving, ' +
          'put-away, slotting, picking, packing, and shipping — and is the ' +
          'system of record for inventory inside the four walls.',
        examples: [
          'Manhattan Active Warehouse Management',
          'Blue Yonder Warehouse Management',
          'Körber / HighJump WMS',
        ],
      },
      {
        name: 'Transportation-management system (TMS)',
        role:
          'Plans, tenders, executes, and settles freight across inbound, ' +
          'between-node, and outbound legs — mode, carrier, lane, and ' +
          'load consolidation.',
        examples: [
          'Oracle Transportation Management',
          'Blue Yonder Transportation Management',
          'project44 / FourKites for visibility',
        ],
      },
      {
        name: 'Returns / reverse-logistics system',
        role:
          'Manages the return from initiation through receipt, ' +
          'inspection, and disposition — restock, liquidation, repair, or ' +
          'scrap — and the recovered-value accounting.',
        examples: [
          'Returnly / Loop returns platforms',
          'Optoro reverse-logistics',
          'WMS-native returns modules',
        ],
      },
      {
        name: 'Labour-management system (LMS)',
        role:
          'Holds engineered task standards, labour planning, and ' +
          'productivity tracking for the warehouse workforce — the source ' +
          'of throughput and labour-cost data.',
        examples: [
          'Manhattan Labour Management',
          'Blue Yonder Workforce Management',
          'Easy Metrics labour analytics',
        ],
      },
    ],
    roles: [
      {
        title: 'VP / Director of Supply Chain & Fulfillment',
        accountability:
          'Owns the end-to-end network — cost to serve, delivery ' +
          'reliability, and the fulfillment economics of every channel.',
      },
      {
        title: 'Director of fulfillment operations',
        accountability:
          'Owns order orchestration and the ship-from decision — cost to ' +
          'serve per order and delivery-promise accuracy.',
      },
      {
        title: 'Director of transportation / logistics',
        accountability:
          'Owns transportation strategy and execution — carrier ' +
          'management, transportation cost as a percent of sales, and ' +
          'on-time delivery.',
      },
      {
        title: 'Distribution-centre / fulfillment-centre general manager',
        accountability:
          'Owns the warehouse operation — receiving, throughput, labour ' +
          'productivity, and shipping accuracy.',
      },
      {
        title: 'Reverse-logistics / returns operations manager',
        accountability:
          'Owns the returns flow — returns processing time, disposition ' +
          'quality, and recovered value.',
      },
      {
        title: 'Supply-chain control-tower lead',
        accountability:
          'Owns end-to-end network visibility and the disruption-' +
          'detection and re-routing response.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Carrier and freight regulation (hours-of-service, weight ' +
          'and safety rules)',
        relevance:
          'Driver hours-of-service limits, vehicle weight rules, and ' +
          'transport safety regulation bound how routes and loads can be ' +
          'planned and executed.',
      },
      {
        name: 'Customs, import, and trade-compliance requirements',
        relevance:
          'Inbound international freight is governed by customs ' +
          'documentation, duty, and trade rules that shape inbound lead ' +
          'time, cost, and the feasibility of re-routing.',
      },
      {
        name: 'Hazardous-materials and restricted-goods shipping rules',
        relevance:
          'Hazmat, lithium-battery, and other restricted-goods rules ' +
          'constrain how affected items can be packaged, moded, and ' +
          'routed across legs.',
      },
      {
        name: 'Labour and workplace-safety regulation (warehouse, ' +
          'fair-workweek)',
        relevance:
          'Warehouse safety standards and predictable-scheduling / fair-' +
          'workweek laws constrain how labour can be planned and flexed ' +
          'to the order wave.',
      },
      {
        name: 'Consumer delivery and returns disclosure rules',
        relevance:
          'Regulation on advertised delivery dates and returns terms ' +
          'makes the delivery promise and the returns policy a compliance ' +
          'matter, not only a service choice.',
      },
    ],
    canonicalTerms: [
      {
        term: 'On-time-in-full (OTIF)',
        definition:
          'A delivery measured as successful only if it is both complete ' +
          'on every line and unit and delivered on the committed date.',
      },
      {
        term: 'Available-to-promise (ATP)',
        definition:
          'The inventory that can be committed to a new customer order ' +
          'across the network, after accounting for existing commitments ' +
          '— the basis of the delivery promise.',
      },
      {
        term: 'Ship-from-store',
        definition:
          'Fulfilling an online order from a retail store’s inventory ' +
          'rather than a distribution centre — extending the fulfillment ' +
          'network to the store estate.',
      },
      {
        term: 'Cost to serve',
        definition:
          'The fully loaded cost of fulfilling an order or serving a ' +
          'channel — processing, warehouse, packaging, transportation, ' +
          'and returns.',
      },
      {
        term: 'Split shipment',
        definition:
          'A single customer order fulfilled in more than one shipment ' +
          'from more than one node, each adding parcel and freight cost.',
      },
      {
        term: 'Final mile / last mile',
        definition:
          'The last leg of delivery, from the final node to the ' +
          'customer’s address — the most expensive and least efficient ' +
          'leg of the journey.',
      },
      {
        term: 'Advance ship notice (ASN)',
        definition:
          'An electronic notification of an inbound shipment’s contents ' +
          'and timing, sent ahead of arrival so receiving can be planned.',
      },
      {
        term: 'Perfect order',
        definition:
          'An order delivered with no defect on any dimension — on time, ' +
          'complete, undamaged, accurately picked, and correctly ' +
          'documented.',
      },
      {
        term: 'Control tower',
        definition:
          'A function or capability that maintains end-to-end network ' +
          'visibility and coordinates the response to exceptions and ' +
          'disruptions.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Supply Chain & Fulfillment Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the fulfillment network is leaking cost and ' +
        'failing the delivery promise — across routing, transportation, ' +
        'the warehouse, returns, and resilience — with baseline evidence, ' +
        'before a solution is shaped.',
      sections: [
        {
          heading: 'Network and channel context',
          guidance:
            'Name the fulfillment network in scope — the DC, fulfillment-' +
            'centre, and ship-from-store nodes, the channel mix, the ' +
            'delivery promises offered, and the carrier base. State which ' +
            'OMS, WMS, TMS, returns, and labour-management systems are in ' +
            'use and how connected they are.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — OTIF, order cycle time, perfect-order ' +
            'rate, cost to serve per order, fill rate, transportation ' +
            'cost as a percent of sales, warehouse throughput, last-mile ' +
            'cost, delivery-promise accuracy, returns processing time, ' +
            'split-shipment rate, inbound vendor compliance. For any ' +
            'metric not recorded — cost to serve and perfect-order are ' +
            'common gaps — name it as a precise seed gap with its data ' +
            'source.',
        },
        {
          heading: 'Order-routing and cost-to-serve analysis',
          guidance:
            'Analyse how orders are routed to nodes, how often routing ' +
            'misses the lowest-cost feasible node, and decompose cost to ' +
            'serve into processing, warehouse, transportation, and ' +
            'returns components — isolating the split-shipment cost.',
        },
        {
          heading: 'Transportation and last-mile analysis',
          guidance:
            'Profile transportation spend by leg and mode, quantify ' +
            'expedited and un-consolidated freight, benchmark carrier and ' +
            'lane performance, and analyse last-mile cost against drop ' +
            'density.',
        },
        {
          heading: 'Warehouse and returns analysis',
          guidance:
            'Assess warehouse throughput against the comparable model, ' +
            'pick-travel and slotting efficiency, and labour flex to the ' +
            'wave; profile returns processing time and the disposition ' +
            'mix and the recovered value it implies.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — sub-optimal routing, ' +
            'unreliable promise, transportation cost leakage, warehouse ' +
            'labour inefficiency, slow returns recovery, inbound vendor ' +
            'non-compliance, fragmented network visibility, supply-' +
            'disruption exposure — and state which are present, with the ' +
            'detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — transportation-cost reduction, cost-to-' +
            'serve reduction, warehouse-productivity gain, returns value ' +
            'recovery — explicitly haircut by network-data quality, ' +
            'carrier volatility, and operating-model adoption. Every ' +
            'figure a labelled planning range, and the cost / service ' +
            'trade-off shown honestly.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — a ' +
            'true cost-to-serve model, a perfect-order measure — is a ' +
            'named ask, not a vague unknown.',
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
      label: 'Supply Chain & Fulfillment Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a supply-chain & ' +
        'fulfillment AI Move on this network — baseline, forecast, cost, ' +
        'and the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring transportation and cost-to-serve reduction, ' +
            'recurring warehouse-productivity gain, and the delivery-' +
            'experience and returns-recovery effects, the time-to-value ' +
            'band, and the go / hold recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — cost to serve, transportation cost ratio, OTIF, ' +
            'warehouse throughput, returns processing time. Where a ' +
            'baseline is a seed gap — a true cost-to-serve model is a ' +
            'common one — say so and state what closing it requires ' +
            'before funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — network-data ' +
            'quality, carrier volatility, operating-model adoption, the ' +
            'service-commitment floor — explicitly and show the haircut ' +
            'math. Show the cost / service trade-off and never claim ' +
            'maximum cost cut and maximum speed from the same plan.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the OMS, WMS, TMS, ' +
            'returns, and labour-management systems, the network-' +
            'visibility and inventory-accuracy remediation the models ' +
            'depend on, and the operating-model change across fulfillment, ' +
            'transportation, and warehouse teams.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under worse network-data quality, a ' +
            'volatile carrier-rate environment, slower operating-model ' +
            'adoption, and a tighter service commitment. State the ' +
            'downside the CFO is underwriting.',
        },
        {
          heading: 'Service and customer-experience posture',
          guidance:
            'State how the delivery promise and the service commitment ' +
            'are protected as cost is optimised — the guardrails that ' +
            'stop the cheapest routing breaching the promise — and how ' +
            'the experience effects are estimated honestly rather than ' +
            'over-claimed.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example, network inventory visibility too ' +
            'fragmented to route against — and the evidence that must be ' +
            'in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the metrics — warehouse productivity, returns recovery, ' +
            'resilience — that need a full peak-season cycle.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Supply Chain & Fulfillment Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'supply-chain & fulfillment AI capability, grounded in the ' +
        'function reference patterns.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — cost-aware order orchestration, transportation ' +
            'optimisation, adaptive warehouse operations, the network ' +
            'control tower, closed-loop reverse logistics — and state ' +
            'which apply and how they connect across the network.',
        },
        {
          heading: 'Data architecture and integrations',
          guidance:
            'Specify the OMS, WMS, TMS, returns, and labour-management ' +
            'integrations, the real-time inventory and order-status ' +
            'visibility the models depend on, and the data-quality ' +
            'baseline — inventory accuracy, network visibility — required ' +
            'before go-live.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and the ' +
            'escalation path. Define the routing rules, the service-cost ' +
            'thresholds, and the promise-conservatism settings that ' +
            'govern the autonomous decisions.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how the fulfillment-operations, transportation, ' +
            'warehouse, and returns workflows change, how staff capacity ' +
            'is redeployed from manual routing and expediting to ' +
            'exception management, and who owns each change.',
        },
        {
          heading: 'Responsible-AI and governance controls',
          guidance:
            'State the service-commitment guardrails, the disruption-' +
            'signal false-positive controls, the labour-scheduling and ' +
            'fair-workweek constraints, and the regulatory frames ' +
            '(carrier, customs, hazmat, labour, consumer disclosure) that ' +
            'bound the design.',
        },
        {
          heading: 'Integration and build approach',
          guidance:
            'Describe the build sequence — network-visibility and ' +
            'inventory-accuracy remediation first, then order routing and ' +
            'transportation optimisation, then warehouse, returns, and ' +
            'the control tower — the integration patterns, and the phased ' +
            'rollout across nodes and lanes.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Supply Chain & Fulfillment Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the supply-chain & fulfillment ' +
        'AI capability so value reaches cost to serve and the delivery ' +
        'experience, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — network-visibility remediation and ' +
            'integration validation, a pilot node or lane subset, ' +
            'routing and transportation rollout, warehouse and returns ' +
            'extension — with milestones tied to the operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, network-visibility governance, fulfillment ' +
            'operations, transportation, warehouse operations, returns, ' +
            'and Tower measurement.',
        },
        {
          heading: 'Operations adoption and redeployment approach',
          guidance:
            'Define the change runway for fulfillment, transportation, ' +
            'warehouse, and returns teams — training, the new exception-' +
            'management workflow, and the redeployment of capacity freed ' +
            'from manual routing and expediting — and how adoption is ' +
            'measured, not assumed.',
        },
        {
          heading: 'Peak-season readiness plan',
          guidance:
            'Define how the capability is hardened and validated ahead ' +
            'of peak — the load and disruption rehearsals, the fallback ' +
            'plan if a model degrades under peak volume, and the decision ' +
            'point for running peak on the new capability or holding.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the metrics that need a full peak ' +
            'cycle to settle.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — network-data decay, carrier-capacity ' +
            'shocks, partial operating-model adoption, a disruption-' +
            'detection false-positive storm — with the escalation owner ' +
            'and the trigger for each.',
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
      claim: 'Delivery reliability — OTIF and perfect-order rate',
      authoritativeSource:
        'The order-management, warehouse-management, and transportation ' +
        'systems combined, joining each order to its on-time, complete, ' +
        'damage-free, accuracy, and documentation status.',
      whatGoodEvidenceLooksLike:
        'OTIF and the perfect-order rate measured at the order grain ' +
        'across all defect dimensions, so a defect on any single ' +
        'dimension is captured rather than averaged away.',
      weakEvidenceToReject:
        'An on-time figure that ignores order completeness, or a ' +
        'perfect-order claim that only checks the on-time and complete ' +
        'dimensions and not damage, accuracy, and documentation.',
    },
    {
      claim: 'Cost to serve and the transportation-cost position',
      authoritativeSource:
        'A cost-to-serve model joining the warehouse-management, ' +
        'transportation, and returns systems to allocate fully loaded ' +
        'fulfillment cost to the order.',
      whatGoodEvidenceLooksLike:
        'Cost to serve decomposed into processing, warehouse, ' +
        'transportation, and returns components at the order grain, with ' +
        'the split-shipment cost isolated and transportation benchmarked ' +
        'by leg and mode.',
      weakEvidenceToReject:
        'A blended average shipping cost with no allocation to the ' +
        'order, or a transportation figure that omits the final-mile and ' +
        'returns legs.',
    },
    {
      claim: 'Warehouse throughput and labour productivity',
      authoritativeSource:
        'The warehouse-management and labour-management systems, ' +
        'comparing processed volume against paid labour hours with ' +
        'engineered task standards.',
      whatGoodEvidenceLooksLike:
        'Units or lines per labour hour measured against engineered ' +
        'standards for a comparable operating model, with pick-travel ' +
        'and slotting efficiency analysed alongside.',
      weakEvidenceToReject:
        'A throughput figure with no labour-hour denominator, or a ' +
        'productivity claim that compares operations with different ' +
        'automation levels as if they were alike.',
    },
    {
      claim: 'Returns processing time and recovered value',
      authoritativeSource:
        'The returns / reverse-logistics system, timestamping return ' +
        'receipt through to disposition and re-availability, with the ' +
        'disposition-mix and recovered-value accounting.',
      whatGoodEvidenceLooksLike:
        'Returns processing time measured receipt-to-disposition, with ' +
        'the disposition mix — restock, liquidate, repair, scrap — and ' +
        'the recovered value per returned unit.',
      weakEvidenceToReject:
        'A returns-rate figure with no processing-time or disposition ' +
        'detail, or a recovered-value claim with no link to the time the ' +
        'return spent un-dispositioned.',
    },
    {
      claim: 'The forecast value of a supply-chain & fulfillment AI Move',
      authoritativeSource:
        'The value model — transportation-cost, cost-to-serve, warehouse-' +
        'productivity, and returns-recovery components, each haircut by ' +
        'its dominant factors — read against the specific network and ' +
        'channel mix.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, the cost / service trade-off shown, ' +
        'and every figure a labelled planning range.',
      weakEvidenceToReject:
        'A single-point savings number, a carrier or vendor ROI claim ' +
        'taken at face value, or a forecast that claims maximum cost ' +
        'reduction and maximum delivery speed from the same plan.',
    },
  ],
};
