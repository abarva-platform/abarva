// Consilium expert — Retail Omnichannel Fulfillment (industry-function).
//
// W3 wave4 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). An industry-function
// expert for the retail OMNICHANNEL ORDER FULFILLMENT layer: BOPIS / buy-online-
// pickup-in-store, ship-from-store, last-mile & delivery, distribution-center
// outbound, inventory accuracy & cross-channel availability, order orchestration
// / routing, returns & reverse logistics, and fulfillment cost-to-serve.
// Product-aware (OMS / DOM, store-fulfillment apps, WMS, last-mile platforms),
// not product-locked.
//
// DISTINCT FROM ADJACENT EXPERTS. This is NOT cross-cutting Supply Chain
// Transformation (planning / S&OP / supplier risk / inbound) and NOT Retail
// Merchandising & Pricing (assortment / price / markdown). This expert owns the
// point where a CONSUMER ORDER gets sourced, picked, and delivered across
// channels, and the unit economics of that promise.
//
// CORE HONESTY — TWO HARD TRUTHS THE EXPERT REFUSES TO WAVE AWAY:
//   (1) INVENTORY ACCURACY GATES OMNICHANNEL. Every omni promise — pick it in
//       store, ship it from store, reserve it online — is only as good as the
//       belief about where units physically are. When perpetual-inventory
//       accuracy is low, the OMS sources to phantom stock: orders cancel,
//       split, or re-route, and customer trust and cost both suffer. No routing
//       algorithm fixes a wrong on-hand. Accuracy is the binding precondition.
//   (2) SHIP-FROM-STORE IS OFTEN MARGIN-DILUTIVE IF MISMANAGED. Turning stores
//       into mini-fulfillment-centers can recover sales and cut split shipments
//       — OR quietly destroy margin through high pick labor, expensive parcel
//       zones, sub-optimal node selection, and markdown cannibalization of
//       store stock. The value is real but conditional; cost-to-serve must be
//       measured per node and per order, never assumed.
// Every value claim here is hedged against these two gates.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const retailOmnichannelFulfillmentExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.retail.omnichannel-fulfillment",
    expertName: "Retail Omnichannel Fulfillment Expert",
    kind: "industry-function",
    industry: "retail",
    functionKey: "omnichannel-fulfillment",
    scopeNote:
      "The retail omnichannel ORDER FULFILLMENT layer: BOPIS / curbside, " +
      "ship-from-store, last-mile & delivery, distribution-center outbound " +
      "fulfillment, inventory accuracy and cross-channel availability, order " +
      "orchestration / routing (OMS / distributed order management), returns & " +
      "reverse logistics, and fulfillment cost-to-serve. Spans the " +
      "order-to-doorstep / order-to-pickup loop for a consumer order. " +
      "Product-aware across OMS/DOM, store-fulfillment apps, WMS, and last-mile " +
      "platforms — not product-locked. CORE DOCTRINE: inventory accuracy gates " +
      "omnichannel (the OMS sources to phantom stock when on-hands are wrong) " +
      "and ship-from-store is often margin-dilutive if mismanaged, so value is " +
      "sized on cost-to-serve per node/order, not assumed. EXCLUDES inbound " +
      "supply-chain planning / S&OP / supplier risk (Supply Chain " +
      "Transformation expert), merchandising / assortment / pricing (Retail " +
      "Merchandising & Pricing expert), and store-operations labor at large — " +
      "this expert owns the cross-channel fulfillment promise and its economics.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "fulfillment_cost_per_order",
        name: "Fulfillment cost per order (cost-to-serve)",
        definition:
          "Fully loaded cost to source, pick, pack, and deliver/hand off one " +
          "order — pick labor, packaging, parcel/last-mile freight, node " +
          "overhead, and returns provision — across the chosen fulfillment node " +
          "and method. The unit economics of the omni promise.",
        unit: "USD / order",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 20,
          basis:
            "Retail fulfillment cost-to-serve ranges; basket size, node " +
            "(DC vs store), method (BOPIS vs parcel vs same-day), and zone " +
            "drive wide variance — same-day and store-ship sit at the top",
          label: "planning-range",
        },
        dataSource:
          "OMS + WMS/store-fulfillment labor + parcel/last-mile freight-pay + " +
          "GL allocations, joined per order across the sourcing node and method",
        whyItMatters:
          "The headline economics unit of omnichannel and the number that " +
          "decides whether ship-from-store creates or destroys value. Margins " +
          "are thin, so a poorly-routed or labor-heavy order can erase the item " +
          "margin it carries — this is the metric the CFO ties the channel to.",
      },
      {
        key: "inventory_accuracy",
        name: "Inventory accuracy (perpetual vs physical)",
        definition:
          "Share of SKU x location records where the perpetual (system) on-hand " +
          "matches the physical count within tolerance — the trustworthiness of " +
          "the inventory position the OMS sources against.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 65,
          high: 98,
          basis:
            "Retail perpetual-inventory accuracy ranges; manual / non-RFID store " +
            "estates often sit 65-80%, RFID- and cycle-count-disciplined estates " +
            "reach 95-98% at unit level",
          label: "planning-range",
        },
        dataSource:
          "Cycle-count / RFID audit results versus perpetual on-hand in the " +
          "inventory system, at SKU x location grain",
        whyItMatters:
          "The BINDING CONSTRAINT on omnichannel: every BOPIS, ship-from-store, " +
          "and online availability decision trusts this number. Low accuracy " +
          "means the OMS sources to phantom stock, driving cancellations, " +
          "splits, and re-routes — no algorithm recovers from a wrong on-hand.",
      },
      {
        key: "in_stock_rate_omni",
        name: "In-stock rate (omni-available)",
        definition:
          "Share of demand-weighted SKU x node combinations available to " +
          "promise across channels at the time of order — the cross-channel " +
          "availability the customer actually experiences online and in app.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 99,
          basis:
            "Omni availability benchmarks; world-class available-to-promise " +
            "holds 97-99% on core assortment, undermanaged or thin-safety " +
            "estates drop to ~90% on the long tail",
          label: "planning-range",
        },
        dataSource:
          "OMS available-to-promise (ATP) versus demand, netting reservations, " +
          "safety buffers, and accuracy-derated on-hands across nodes",
        whyItMatters:
          "What the shopper sees as 'available' drives conversion and trust. " +
          "Honest omni availability is accuracy-derated — buffering for unreliable " +
          "on-hands protects against cancellations but suppresses available-to-" +
          "promise, so it must be read alongside inventory accuracy.",
      },
      {
        key: "on_time_delivery_rate",
        name: "On-time delivery / pickup rate",
        definition:
          "Share of orders delivered (or made ready for pickup) by the promised " +
          "date/window — the kept-promise measure across delivery and BOPIS.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 99,
          basis:
            "Last-mile / pickup service benchmarks; strong programs hold 96-99%, " +
            "peak-season and same-day promises degrade toward 90% under capacity " +
            "strain",
          label: "planning-range",
        },
        dataSource:
          "OMS promise dates versus carrier delivery scans / pickup-ready " +
          "timestamps, by method and node",
        whyItMatters:
          "The kept-promise unit that drives repeat purchase and review scores. " +
          "Over-aggressive promise dates lift conversion but erode on-time " +
          "performance — the promise engine and the fulfillment network must be " +
          "calibrated together, not optimized separately.",
      },
      {
        key: "perfect_order_rate",
        name: "Perfect order rate",
        definition:
          "Share of orders delivered complete, on time, accurate (right items), " +
          "and undamaged — the multiplicative all-or-nothing fulfillment-quality " +
          "measure for a consumer order.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 97,
          basis:
            "Order-quality benchmarks; world-class omni fulfillment 95-97%, " +
            "median 88-93%, weak store-pick accuracy and split orders pull it " +
            "below 85% once components multiply",
          label: "planning-range",
        },
        dataSource:
          "OMS/WMS order records joined for completeness, timeliness, item " +
          "accuracy, and damage/return-on-arrival flags per order",
        whyItMatters:
          "The composite customer-experience unit — because it multiplies its " +
          "components, small failures in accuracy or timeliness compound. Store " +
          "picking and split shipments are the usual drags on the omni figure.",
      },
      {
        key: "split_shipment_rate",
        name: "Split-shipment rate",
        definition:
          "Share of multi-line orders fulfilled from more than one node, " +
          "incurring multiple parcels/handoffs — a direct cost-to-serve and " +
          "experience drag driven by inventory positioning and routing logic.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Omni order-routing benchmarks; tight assortment positioning and " +
            "good DOM logic hold splits ~10-20%, fragmented inventory and naive " +
            "routing drive 30-40%+",
          label: "planning-range",
        },
        dataSource:
          "OMS order-to-node assignment records: parcels/nodes per order versus " +
          "order lines, by routing policy",
        whyItMatters:
          "Each split adds freight, packaging, and labor and slows delivery — " +
          "it is where fulfillment cost-per-order quietly inflates. High splits " +
          "signal mispositioned inventory or routing tuned for speed without a " +
          "cost objective.",
      },
      {
        key: "ship_from_store_mix",
        name: "Ship-from-store mix",
        definition:
          "Share of digital orders fulfilled from store inventory (store-ship " +
          "or store-pick) rather than from a distribution / fulfillment center — " +
          "the lever that recovers sales and cuts zones but can dilute margin.",
        unit: "% of digital orders",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 15,
          high: 50,
          basis:
            "Store-fulfillment adoption ranges; right level is contingent — used " +
            "to clear store stock, shorten zones, and protect sales, but high " +
            "mix with poor node economics dilutes margin",
          label: "planning-range",
        },
        dataSource:
          "OMS sourcing decisions by node type (store vs DC) over total digital " +
          "orders, joined to per-node cost-to-serve",
        whyItMatters:
          "Ship-from-store is in-range, NOT higher-is-better: it can recover " +
          "otherwise-lost sales and shrink parcel zones, or destroy margin via " +
          "store pick labor and bad node selection. The right mix is the one " +
          "where marginal cost-to-serve beats the DC alternative and the sale.",
      },
      {
        key: "fulfillment_cycle_time",
        name: "Fulfillment cycle time (order-to-ship / order-to-ready)",
        definition:
          "Elapsed time from order capture to shipment dispatch (or pickup-" +
          "ready) — the internal node throughput portion of the promise, " +
          "distinct from total transit.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 48,
          basis:
            "Node-throughput benchmarks; store BOPIS-ready in 1-4 hours, DC " +
            "same-day cutoffs in hours, slower store-ship batches run 24-48 hours",
          label: "planning-range",
        },
        dataSource:
          "OMS/WMS/store-fulfillment timestamps: order capture to dispatch / " +
          "pickup-ready, by node and method",
        whyItMatters:
          "The controllable, internal portion of the speed promise — before the " +
          "carrier. Slow store-pick cycle times break same-day promises and push " +
          "customers to cancel, so it is the first lever for speed without buying " +
          "faster freight.",
      },
      {
        key: "click_to_deliver_time",
        name: "Click-to-deliver time",
        definition:
          "Total elapsed time from order placement to delivery (or customer " +
          "pickup) — the end-to-end speed the customer experiences, combining " +
          "cycle time and transit.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 5,
          basis:
            "End-to-end delivery-speed benchmarks; same-day / next-day on core " +
            "metros at the fast end, standard ground 3-5 days, set by network " +
            "node density and carrier mix",
          label: "planning-range",
        },
        dataSource:
          "OMS order timestamp versus delivery scan / pickup timestamp, " +
          "end-to-end across node and carrier",
        whyItMatters:
          "The speed metric the customer judges and competitors set " +
          "expectations on. Faster click-to-deliver lifts conversion but raises " +
          "cost-to-serve (closer nodes, premium freight) — the speed-versus-cost " +
          "trade-off is the central omnichannel design choice.",
      },
      {
        key: "return_rate",
        name: "Return rate",
        definition:
          "Share of fulfilled units (or order value) returned by customers — " +
          "the reverse-logistics volume that drives recovery cost and net " +
          "fulfillment economics, especially in apparel and online.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 8,
          high: 30,
          basis:
            "Retail return-rate ranges; general merchandise 8-12%, online " +
            "apparel/footwear 20-30%+ with bracketing behavior the swing factor",
          label: "planning-range",
        },
        dataSource:
          "Returns management system / OMS returns records over fulfilled units " +
          "or order value, by category and channel",
        whyItMatters:
          "Returns are a large, often-ignored cost-to-serve component and a " +
          "margin leak — the return trip, processing, restocking, and markdown " +
          "of returned goods. Net fulfillment economics are wrong if returns are " +
          "excluded from cost-per-order.",
      },
      {
        key: "bopis_adoption_rate",
        name: "BOPIS / pickup adoption rate",
        definition:
          "Share of digital orders fulfilled via buy-online-pickup-in-store / " +
          "curbside rather than delivery — the pickup mix that lowers last-mile " +
          "cost and can drive incremental store basket.",
        unit: "% of digital orders",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 45,
          basis:
            "BOPIS adoption ranges; mature omni retailers with strong store " +
            "density reach 30-45%, early or low-density programs sit 10-20%",
          label: "planning-range",
        },
        dataSource:
          "OMS fulfillment-method records: BOPIS/curbside orders over total " +
          "digital orders, by store and category",
        whyItMatters:
          "BOPIS shifts last-mile cost to the customer and can add an in-store " +
          "attachment basket — usually the cheapest fulfillment method per " +
          "order. But adoption only pays off if pickup-ready cycle times and " +
          "in-store readiness hold; a slow, painful pickup kills repeat use.",
      },
      {
        key: "order_accuracy_rate",
        name: "Order / pick accuracy rate",
        definition:
          "Share of orders fulfilled with the correct items and quantities — " +
          "the item-accuracy component that store picking most often degrades " +
          "and that drives avoidable returns and re-ships.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 99.5,
          basis:
            "Pick-accuracy benchmarks; automated DC picking 99%+, manual store " +
            "picking under interrupt-heavy floor conditions can fall to ~95%",
          label: "planning-range",
        },
        dataSource:
          "OMS/WMS pick-confirm versus shipped/received contents, and " +
          "return-reason 'wrong item' rates, by node",
        whyItMatters:
          "Wrong-item picks create returns, re-ships, and trust damage — a " +
          "double cost-to-serve hit. Store picking under floor interruptions is " +
          "the usual accuracy weak point, which is why ship-from-store economics " +
          "must include rework, not just pick labor.",
      },
    ],

    painThemes: [
      {
        key: "phantom_inventory",
        name: "Phantom inventory & accuracy-driven cancellations",
        description:
          "Perpetual on-hand says a unit is available, but it is not physically " +
          "there (shrink, misplacement, mis-scan, RTV not processed), so the OMS " +
          "sources an order to phantom stock and it cancels, splits, or " +
          "re-routes — eroding trust and inflating cost on every recovery.",
        detectionSignal:
          "High online-order cancellation/short rate concentrated in low-accuracy " +
          "stores, frequent manual re-sourcing, store associates rejecting pick " +
          "tasks for items 'not found', accuracy below ~90% with no RFID/cycle-" +
          "count discipline.",
        diagnosticQuestion:
          "What is your perpetual-inventory accuracy at SKU x store, and what " +
          "share of your omni cancellations and re-routes trace back to on-hand " +
          "inaccuracy rather than genuine demand?",
      },
      {
        key: "margin_dilutive_sfs",
        name: "Margin-dilutive ship-from-store",
        description:
          "Stores are turned into fulfillment nodes to recover sales and cut " +
          "zones, but pick labor, packaging, expensive parcel zones, poor node " +
          "selection, and rework on inaccurate picks push per-order cost above " +
          "the DC alternative — quietly diluting the very margin the channel was " +
          "meant to protect.",
        detectionSignal:
          "Ship-from-store cost-per-order above the DC equivalent, store labor " +
          "diverted from selling to picking, high store-pick split/rework rates, " +
          "node selection that ignores zone cost, no per-node cost-to-serve view.",
        diagnosticQuestion:
          "Do you measure fulfillment cost-to-serve PER NODE and per order, and " +
          "does your routing logic optimize for total cost-to-serve or only for " +
          "speed / inventory clearance?",
      },
      {
        key: "split_shipment_overspend",
        name: "Split-shipment & node-routing overspend",
        description:
          "Multi-line orders fragment across nodes because inventory is " +
          "mispositioned and the order-routing logic chases speed or local stock " +
          "without a cost objective, multiplying parcels, packaging, and labor " +
          "and slowing delivery — a steady, hidden inflation of cost-per-order.",
        detectionSignal:
          "Split-shipment rate above ~25-30%, multiple parcels for small " +
          "baskets, routing rules with no consolidation/cost weighting, freight " +
          "spend rising faster than order volume.",
        diagnosticQuestion:
          "What is your split-shipment rate, and does your distributed order " +
          "management weigh consolidation and total cost-to-serve, or just " +
          "nearest-available-stock?",
      },
      {
        key: "promise_capacity_mismatch",
        name: "Promise vs node-capacity mismatch",
        description:
          "The promise engine quotes aggressive delivery/pickup windows to lift " +
          "conversion, but node throughput, store labor, and carrier capacity " +
          "cannot keep pace — especially at peak — so on-time performance and " +
          "perfect-order rate fall and cancellations rise.",
        detectionSignal:
          "On-time delivery degrading at peak, promise dates set independent of " +
          "live node/labor capacity, cycle-time SLA breaches, customer " +
          "complaints about late pickups despite 'ready' notifications.",
        diagnosticQuestion:
          "Is your delivery/pickup promise calibrated to LIVE node and labor " +
          "capacity, or does it quote a static window that breaks under peak " +
          "load?",
      },
      {
        key: "returns_blind_spot",
        name: "Returns & reverse-logistics blind spot",
        description:
          "Returns are treated as an afterthought rather than part of " +
          "fulfillment economics: the return trip, grading, restock, and " +
          "markdown of returned goods are uncosted, so net cost-to-serve is " +
          "understated and high-return SKUs/customers go unmanaged.",
        detectionSignal:
          "Return rate excluded from cost-per-order, no return-reason analytics, " +
          "returned goods slow to re-enter sellable stock, no policy " +
          "differentiation for serial returners or bracketing behavior.",
        diagnosticQuestion:
          "Is your return cost (transport, grading, restock, markdown) included " +
          "in fulfillment cost-to-serve, and do you analyze return reasons by " +
          "SKU and customer?",
      },
      {
        key: "siloed_channel_inventory",
        name: "Siloed channel inventory & no single ATP",
        description:
          "Online and store inventory are managed in separate pools with no " +
          "unified available-to-promise, so the enterprise cannot see or sell " +
          "all stock to all channels — leaving sales stranded in one channel " +
          "while another stocks out, and blocking true omni sourcing.",
        detectionSignal:
          "Separate online and store stock pools, no single ATP/inventory " +
          "service, frequent stockouts in one channel beside excess in another, " +
          "manual stock transfers to chase demand, OMS unaware of store on-hand.",
        diagnosticQuestion:
          "Do you have a single available-to-promise across all nodes and " +
          "channels, or are online and store inventory still managed as separate " +
          "pools?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "intelligent_order_routing",
        name: "AI distributed order routing & sourcing optimization",
        valueMechanism:
          "Replace rule-based 'nearest available stock' sourcing with an OMS/DOM " +
          "optimizer that scores each candidate node on total cost-to-serve — " +
          "pick labor, parcel zone, split penalty, markdown/clearance value, and " +
          "promise feasibility — so orders source where they cost least to fulfill " +
          "while keeping the promise, cutting splits and shrinking store-ship " +
          "margin dilution. HONEST BOUND: the optimizer is only as good as the " +
          "inventory-accuracy and per-node cost data it scores against; on " +
          "phantom stock it routes confidently to nothing.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Accurate per-node on-hand (accuracy-derated available-to-promise)",
          "Per-node cost-to-serve: pick labor, packaging, parcel zone rates",
          "Markdown/clearance value and demand signal by node for trade-offs",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Routing to phantom stock when inventory accuracy is low causes confident cancellations",
          "Optimizing only for speed or clearance without a cost objective inflates cost-to-serve",
          "Node-capacity and labor limits must constrain routing or promises break",
        ],
        metricsMoved: [
          "fulfillment_cost_per_order",
          "split_shipment_rate",
          "ship_from_store_mix",
        ],
      },
      {
        key: "demand_aware_availability",
        name: "Accuracy-derated, demand-aware available-to-promise",
        valueMechanism:
          "Compute cross-channel available-to-promise that nets reservations, " +
          "safety buffers, AND an inventory-accuracy derate per node — so the OMS " +
          "promises only what it can actually deliver, lifting honest in-stock " +
          "while cutting accuracy-driven cancellations. Learns store-level " +
          "accuracy patterns to set buffers tighter where stock is trustworthy " +
          "and looser where it is not.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "SKU x node inventory-accuracy history (cycle-count / RFID)",
          "Live on-hand, reservations, and in-transit positions per node",
          "Demand signal to weight availability where it matters",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Over-derating suppresses sellable inventory; under-derating drives cancellations",
          "Accuracy estimates per node need ongoing audit data or they drift",
          "Buffer policy must be segment-aware, not a blanket safety level",
        ],
        metricsMoved: [
          "in_stock_rate_omni",
          "inventory_accuracy",
          "perfect_order_rate",
        ],
      },
      {
        key: "predictive_promise_engine",
        name: "Predictive delivery/pickup promise engine",
        valueMechanism:
          "Quote each customer a delivery or pickup window predicted from LIVE " +
          "node throughput, store labor, carrier capacity, and transit models — " +
          "instead of a static SLA — so promises are aggressive where capacity " +
          "allows and conservative where it does not, lifting on-time performance " +
          "and conversion together rather than trading one for the other.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Live node cycle-time and store-labor capacity signals",
          "Carrier transit-time and capacity models by lane",
          "Historical promise-versus-actual performance for calibration",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Over-promising to lift conversion erodes on-time and trust — calibrate to capacity",
          "Stale capacity signals make the promise no better than a static SLA",
          "Peak-season behavior must be modeled explicitly, not extrapolated",
        ],
        metricsMoved: [
          "on_time_delivery_rate",
          "click_to_deliver_time",
          "fulfillment_cycle_time",
        ],
      },
      {
        key: "rfid_cv_inventory_accuracy",
        name: "RFID / computer-vision inventory-accuracy automation",
        valueMechanism:
          "Use RFID cycle counting and computer-vision shelf/backroom audits to " +
          "drive perpetual-inventory accuracy up toward unit-level truth — " +
          "attacking the binding constraint directly so every downstream omni " +
          "decision (routing, ATP, BOPIS) sources to real stock, cutting " +
          "cancellations and enabling tighter availability buffers.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "RFID tagging coverage or CV camera/scan infrastructure in stores",
          "Cycle-count cadence and exception-resolution workflow",
          "Perpetual-inventory system able to ingest frequent count updates",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Tag/read coverage gaps leave accuracy blind spots that still source phantom stock",
          "Accuracy gains decay without sustained cycle-count discipline and exception fixing",
          "Capital and tagging cost must be justified against cancellation/cost-to-serve savings",
        ],
        metricsMoved: [
          "inventory_accuracy",
          "in_stock_rate_omni",
          "order_accuracy_rate",
        ],
      },
      {
        key: "returns_intelligence",
        name: "Returns intelligence & reverse-logistics optimization",
        valueMechanism:
          "Predict return likelihood, optimize return routing and grading/" +
          "disposition (restock vs liquidate vs refurbish), and detect serial-" +
          "return / bracketing behavior — pulling return cost into fulfillment " +
          "economics, speeding returned goods back to sellable stock, and " +
          "tailoring policy to protect margin without punishing good customers.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Return-reason, condition, and disposition history by SKU and customer",
          "Reverse-logistics cost data (transport, grading, restock, markdown)",
          "Customer-level return behavior signal for policy differentiation",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Return-behavior scoring must avoid unfair or discriminatory customer treatment",
          "Disposition automation needs human review on high-value or fraud-flagged returns",
          "Policy changes affect demand and loyalty — test before broad rollout",
        ],
        metricsMoved: [
          "return_rate",
          "fulfillment_cost_per_order",
        ],
      },
      {
        key: "store_pick_optimization",
        name: "AI store-pick batching & task optimization",
        valueMechanism:
          "Batch and sequence store/curbside pick tasks by location path, " +
          "deadline, and associate availability — and route pickers around floor " +
          "interruptions — so store fulfillment picks faster and more accurately, " +
          "shrinking cycle time and rework that otherwise make ship-from-store " +
          "and BOPIS margin-dilutive.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Store planogram / location data for pick-path optimization",
          "Live order queue, deadlines, and associate task availability",
          "Pick-accuracy and exception history by associate/store",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Pick-task pressure can trade accuracy for speed — guard the accuracy metric",
          "Floor interruptions (customer service) must be modeled or batches break",
          "Diverting too much labor from selling to picking has its own cost",
        ],
        metricsMoved: [
          "fulfillment_cycle_time",
          "order_accuracy_rate",
          "bopis_adoption_rate",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_oms_dom",
        name: "Unified OMS / distributed order management",
        description:
          "A single order-management / distributed-order-management layer that " +
          "owns the cross-channel order lifecycle and sources every order across " +
          "all nodes against one available-to-promise — replacing siloed channel " +
          "fulfillment with cost-and-promise-aware routing.",
        boundary:
          "Owns order orchestration, sourcing/routing, and ATP across channels; " +
          "does not own warehouse/store pick execution (WMS / store-fulfillment " +
          "apps), the carrier last mile, or merchandising/pricing.",
        humanAccountabilityPoint: "VP Omnichannel Fulfillment / Head of Order Management",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "single_inventory_atp",
        name: "Single enterprise inventory & available-to-promise service",
        description:
          "A unified inventory service that aggregates on-hand, in-transit, and " +
          "reservations across all nodes into one accuracy-derated available-to-" +
          "promise — so all stock is sellable to all channels and the OMS sources " +
          "against trustworthy positions rather than siloed pools.",
        boundary:
          "Owns the cross-node inventory position and ATP calculation; does not " +
          "own physical inventory accuracy capture (RFID/cycle count) or the " +
          "sourcing decision (it informs the OMS that makes it).",
        humanAccountabilityPoint: "Director of Inventory / Omni Availability Owner",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "inventory_accuracy_program",
        name: "Inventory-accuracy program (RFID + cycle-count discipline)",
        description:
          "A governed program — RFID and/or computer vision plus disciplined " +
          "cycle counting and exception resolution — that maintains perpetual-" +
          "inventory accuracy as the acknowledged binding constraint on " +
          "omnichannel, without which routing and ATP source to phantom stock.",
        boundary:
          "Owns physical-to-perpetual accuracy capture and remediation; does not " +
          "own the OMS sourcing logic or the ATP service (it makes their inputs " +
          "trustworthy).",
        humanAccountabilityPoint: "Store Operations / Inventory Control Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "cost_to_serve_node_model",
        name: "Per-node cost-to-serve & node-strategy model",
        description:
          "An economics framework that measures fulfillment cost-to-serve per " +
          "node and per order (labor, packaging, zone, splits, returns) and sets " +
          "node roles — which stores ship, which only pick for BOPIS — so ship-" +
          "from-store mix is tuned where it creates value rather than dilutes " +
          "margin.",
        boundary:
          "Owns the cost-to-serve measurement and node-role policy; does not own " +
          "the real-time routing engine or store labor scheduling (it sets the " +
          "objectives and constraints they run against).",
        humanAccountabilityPoint: "Omnichannel Finance / Fulfillment Economics Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Omnichannel-fulfillment value is realized on four linked levers, and " +
        "the order of durability matters. (1) COST-TO-SERVE REDUCTION — cost-and-" +
        "promise-aware order routing, fewer split shipments, optimized store " +
        "picking, and returns intelligence lower fulfillment cost per order, the " +
        "lever most directly tied to the thin retail margin. (2) SALES RECOVERY " +
        "& AVAILABILITY — single ATP and ship-from-store let the enterprise sell " +
        "all stock to all channels, recovering otherwise-lost sales and lifting " +
        "honest in-stock. (3) SPEED & SERVICE — a capacity-calibrated promise " +
        "engine and faster node cycle times lift on-time and conversion " +
        "together. (4) ACCURACY FOUNDATION VALUE — RFID/cycle-count accuracy " +
        "cuts cancellations and unlocks tighter buffers. THE TWO HONEST GATES: " +
        "(a) INVENTORY ACCURACY GATES EVERYTHING — routing, ATP, and BOPIS all " +
        "source against the on-hand belief, so dirty inventory caps realizable " +
        "value regardless of algorithm; and (b) SHIP-FROM-STORE IS MARGIN-" +
        "DILUTIVE IF MISMANAGED — its value is conditional on per-node cost-to-" +
        "serve beating the DC alternative, so the headline 'omni sales recovery' " +
        "must be sized NET of fulfillment cost and returns, never as gross sales " +
        "saved. The durable, defensible value sits in cost-to-serve reduction " +
        "and the accuracy foundation; the sales-recovery lever is real but must " +
        "be margin-tested per node.",
      dominantHaircutFactors: [
        {
          factor: "Inventory accuracy (the binding constraint)",
          rationale:
            "Order routing, available-to-promise, and BOPIS all trust the " +
            "perpetual on-hand. When SKU x store accuracy is low, the OMS sources " +
            "to phantom stock and value leaks to cancellations, splits, and " +
            "re-routes — the single largest and most common haircut, and the one " +
            "no algorithm overcomes.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between routing/ATP potential and realized benefit " +
              "where perpetual-inventory accuracy was unfit at SKU x store",
            label: "planning-range",
          },
        },
        {
          factor: "Ship-from-store node economics & margin dilution",
          rationale:
            "Store fulfillment recovers sales but carries pick labor, parcel " +
            "zone, and rework cost that can exceed the DC alternative. Value " +
            "sized on gross sales recovered, not net of per-node cost-to-serve " +
            "and returns, over-states the prize — the deeper the store-ship mix " +
            "without node economics, the deeper this haircut.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Erosion of gross omni-sales-recovery value once per-node cost-to-" +
              "serve, splits, and returns are netted against the saved sale",
            label: "planning-range",
          },
        },
        {
          factor: "Execution & adoption (store labor, recommend-to-realize gap)",
          rationale:
            "A routing or promise recommendation only creates value if the store " +
            "actually picks accurately and on time and associates adopt the " +
            "workflow. Store labor constraints, floor interruptions, and weak " +
            "adoption leave modeled value unrealized at the shelf.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Fulfillment-transformation experience where store execution and " +
              "associate adoption lagged the routing/promise technology",
            label: "planning-range",
          },
        },
        {
          factor: "Network & carrier-capacity constraints",
          rationale:
            "Optimal routing and aggressive promises collide with real node " +
            "throughput, store labor capacity, and carrier limits — especially " +
            "at peak — so the executable plan captures less than the " +
            "unconstrained optimum and promises must be pulled back.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Gap between unconstrained routing/promise optimization and the " +
              "executable plan under live node, labor, and carrier capacity",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Fulfillment cost-per-order reduction",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported cost-to-serve reduction from cost-aware order routing, " +
              "split reduction, and store-pick optimization; node- and accuracy-" +
              "dependent",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in fully-loaded fulfillment cost per order at " +
            "held or improved service level",
        },
        {
          lever: "Split-shipment-rate reduction",
          range: {
            low: 0.1,
            high: 0.4,
            basis:
              "Reported relative reduction in split shipments from consolidation-" +
              "aware distributed order management and better inventory positioning",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in the share of multi-line orders fulfilled from " +
            "more than one node",
        },
        {
          lever: "Cancellation / availability improvement from accuracy",
          range: {
            low: 0.02,
            high: 0.1,
            basis:
              "Percentage-point reduction in accuracy-driven cancellations / " +
              "lift in honest in-stock from RFID/cycle-count accuracy programs, " +
              "as a fraction; larger from a low-accuracy base",
            label: "planning-range",
          },
          measuredAs:
            "Percentage-point change (as a fraction) in cancellation rate / " +
            "omni in-stock attributable to inventory-accuracy improvement",
        },
      ],
      timeToValueBand:
        "Order-routing / split-reduction value: 2-3 quarters once a unified OMS " +
        "and ATP exist. Promise-engine and store-pick optimization: 2-4 quarters " +
        "as workflows and adoption land. Inventory-accuracy programs (RFID/cycle " +
        "count): 2-4 quarters to lift accuracy, longer for full RFID rollout. " +
        "Full omnichannel-fulfillment transformation (unified OMS + single ATP + " +
        "accuracy foundation + node-economics model): 18-36 months, gated by the " +
        "inventory-accuracy foundation.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Order management system / distributed order management (OMS/DOM)",
          role:
            "System of record for the cross-channel order lifecycle, sourcing/" +
            "routing decisions, and available-to-promise across nodes.",
          examples: [
            "Manhattan Active Omni",
            "IBM Sterling Order Management",
            "Salesforce Order Management",
            "Fluent Commerce",
          ],
        },
        {
          name: "Store-fulfillment / BOPIS execution app",
          role:
            "In-store pick, pack, curbside, and pickup execution for ship-from-" +
            "store and BOPIS orders, capturing cycle time and pick accuracy.",
          examples: [
            "Manhattan Active Omni store fulfillment",
            "Radial",
            "Deck Commerce",
            "Native retailer store-fulfillment apps",
          ],
        },
        {
          name: "Warehouse / distribution-center WMS",
          role:
            "System of record for DC inventory and outbound pick/pack/ship " +
            "execution feeding parcel and last-mile.",
          examples: [
            "Manhattan Associates WMS",
            "Blue Yonder WMS",
            "Körber",
            "Oracle WMS",
          ],
        },
        {
          name: "Last-mile / parcel & carrier platform",
          role:
            "Carrier selection, rating, label generation, last-mile/same-day " +
            "dispatch, and delivery tracking for fulfilled orders.",
          examples: ["FedEx", "UPS", "Bringg", "DoorDash Drive / Uber Direct"],
        },
        {
          name: "Inventory accuracy / RFID & returns platform",
          role:
            "Perpetual-inventory accuracy capture (RFID / cycle count) and " +
            "reverse-logistics / returns processing and disposition.",
          examples: ["Nedap iD Cloud", "Impinj", "Optoro", "Loop Returns"],
        },
      ],
      roles: [
        {
          title: "VP / Head of Omnichannel Fulfillment",
          accountability:
            "End-to-end cross-channel fulfillment cost, speed, service, and the " +
            "economics of the omni promise — the executive owner of the outcome.",
        },
        {
          title: "Director of Order Management / OMS Owner",
          accountability:
            "Order orchestration, sourcing/routing policy, and available-to-" +
            "promise configuration across nodes and channels.",
        },
        {
          title: "Inventory Control / Accuracy Lead",
          accountability:
            "Perpetual-inventory accuracy, cycle-count and RFID discipline, and " +
            "the binding-constraint health that omni sourcing depends on.",
        },
        {
          title: "Store Operations Fulfillment Lead",
          accountability:
            "Store pick/pack/curbside execution, pick accuracy and cycle time, " +
            "and the store-labor balance between selling and fulfilling.",
        },
        {
          title: "Reverse Logistics / Returns Manager",
          accountability:
            "Returns processing, grading/disposition, return cost-to-serve, and " +
            "speed of returned goods back to sellable stock.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Consumer protection & delivery/returns disclosure (e.g. FTC, EU consumer rights)",
          relevance:
            "Delivery-date promises, shipping/restocking fees, and return rights " +
            "are regulated consumer disclosures; the promise engine and returns " +
            "policy must honor advertised terms and avoid deceptive timing.",
        },
        {
          name: "Data privacy for customer address & delivery data (e.g. GDPR/CCPA)",
          relevance:
            "Fulfillment and last-mile handle customer address, location, and " +
            "contact data; routing, delivery-tracking, and return systems inherit " +
            "privacy and data-minimization obligations.",
        },
        {
          name: "Last-mile labor & gig-driver classification",
          relevance:
            "Same-day / crowdsourced last-mile relies on gig and contract " +
            "drivers; worker-classification and labor rules constrain delivery " +
            "network design and cost assumptions.",
        },
        {
          name: "Product safety, age-restricted & hazmat shipping",
          relevance:
            "Shipping age-restricted, regulated, or hazmat goods (alcohol, " +
            "batteries, aerosols) constrains carrier/mode choice and requires " +
            "compliant labeling and handling in fulfillment.",
        },
      ],
      canonicalTerms: [
        {
          term: "BOPIS / curbside",
          definition:
            "Buy-online-pickup-in-store (and curbside) — a fulfillment method " +
            "where the customer collects an order at a store, shifting last-mile " +
            "cost off the retailer.",
        },
        {
          term: "Ship-from-store",
          definition:
            "Fulfilling a digital order by picking and shipping from store " +
            "inventory rather than a distribution center — recovers sales and " +
            "shortens zones but can dilute margin if node economics are poor.",
        },
        {
          term: "Available-to-promise (ATP)",
          definition:
            "The inventory the OMS can commit to a new order across nodes, net " +
            "of reservations and buffers — and, done honestly, derated for " +
            "inventory accuracy.",
        },
        {
          term: "Distributed order management (DOM)",
          definition:
            "The OMS capability that decides which node(s) source each order, " +
            "ideally optimizing total cost-to-serve and promise feasibility, not " +
            "just nearest stock.",
        },
        {
          term: "Cost-to-serve",
          definition:
            "The fully-loaded cost to fulfill one order — pick labor, packaging, " +
            "freight/zone, split penalty, node overhead, and returns provision.",
        },
        {
          term: "Perpetual inventory accuracy",
          definition:
            "How closely the system on-hand matches physical stock at SKU x " +
            "location — the binding constraint that gates every omni sourcing " +
            "decision.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Fulfillment cost-to-serve per order",
        authoritativeSource:
          "OMS + store/DC labor + parcel freight-pay + GL allocations joined " +
          "per order across sourcing node and method",
        whatGoodEvidenceLooksLike:
          "Fully-loaded cost per order BY NODE and method (DC vs store, BOPIS vs " +
          "parcel vs same-day) WITH the split-shipment and returns components " +
          "isolated, so the margin impact of each method is visible.",
        weakEvidenceToReject:
          "A single blended 'fulfillment costs $X per order' with no node/method " +
          "split, no returns provision, and no comparison to the DC alternative.",
      },
      {
        claim: "Inventory accuracy (the binding constraint)",
        authoritativeSource:
          "Cycle-count / RFID audit results versus perpetual on-hand at SKU x " +
          "location grain",
        whatGoodEvidenceLooksLike:
          "Unit-level accuracy by SKU x store over a recent audit window, WITH " +
          "the share of omni cancellations/re-routes traced to inaccuracy, so the " +
          "binding-constraint impact is quantified.",
        weakEvidenceToReject:
          "An aggregate 'inventory is accurate' claim, a value-level (not unit-" +
          "level) match, or accuracy quoted with no link to cancellations.",
      },
      {
        claim: "Service & order quality (on-time, perfect order, accuracy)",
        authoritativeSource:
          "OMS promise dates versus carrier/pickup timestamps, and order records " +
          "joined for completeness, accuracy, and damage",
        whatGoodEvidenceLooksLike:
          "On-time and perfect-order rate by method and node with the failure-" +
          "reason breakdown (late vs wrong-item vs damaged) and peak-vs-normal " +
          "performance distinguished.",
        weakEvidenceToReject:
          "A headline 'service is ~95%' with no method/node split, no failure-" +
          "reason decomposition, and peak performance hidden in a blended average.",
      },
      {
        claim: "Ship-from-store mix and its margin impact",
        authoritativeSource:
          "OMS sourcing-by-node-type records joined to per-node cost-to-serve " +
          "and saved-sale value",
        whatGoodEvidenceLooksLike:
          "Store-ship mix WITH per-node cost-to-serve compared to the DC " +
          "alternative and to the saved sale, so margin dilution or accretion is " +
          "explicit per node — not gross sales recovered.",
        weakEvidenceToReject:
          "Ship-from-store value claimed as gross sales recovered with no per-" +
          "node cost-to-serve, no returns netting, and no DC-alternative compare.",
      },
      {
        claim: "Split shipments and order-routing efficiency",
        authoritativeSource:
          "OMS order-to-node assignment records: parcels/nodes per order versus " +
          "order lines by routing policy",
        whatGoodEvidenceLooksLike:
          "Split-shipment rate by routing policy and category WITH the freight/" +
          "packaging cost of splits quantified and the inventory-positioning " +
          "driver identified.",
        weakEvidenceToReject:
          "A split-shipment percentage with no cost attached and no link to " +
          "routing logic or inventory positioning.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your perpetual-inventory accuracy at SKU x store, and what share of omni cancellations and re-routes trace back to on-hand inaccuracy rather than real demand?",
      "Do you measure fulfillment cost-to-serve PER NODE and per order (labor, packaging, zone, splits, returns), and does ship-from-store beat the DC alternative net of those costs?",
      "Does your distributed order management optimize total cost-to-serve and promise feasibility, or route to nearest-available-stock / clearance only — and what is your split-shipment rate?",
      "Do you have a single available-to-promise across all nodes and channels, or are online and store inventory still managed as separate pools?",
      "Is your delivery/pickup promise calibrated to LIVE node and labor capacity, or a static window that breaks under peak load — and how does on-time hold up at peak?",
      "Is return cost (transport, grading, restock, markdown) included in your fulfillment cost-to-serve, and do you analyze return reasons by SKU and customer?",
      "What are your fulfillment cost per order, on-time delivery, perfect order, split-shipment, BOPIS adoption, and click-to-deliver versus planning ranges, by method and node?",
    ],
    maturitySignals: [
      "Perpetual-inventory accuracy is measured at SKU x store with RFID/cycle-count discipline and treated as the acknowledged binding constraint on omni sourcing.",
      "A single OMS/DOM sources every order against one accuracy-derated available-to-promise, optimizing total cost-to-serve rather than nearest stock.",
      "Fulfillment cost-to-serve is measured per node and per order (including returns), and node roles / ship-from-store mix are set where they create value.",
      "The delivery/pickup promise is calibrated to live node and labor capacity, so on-time holds through peak rather than collapsing.",
      "Returns are part of fulfillment economics — return cost is in cost-per-order and return reasons/behavior are analyzed and acted on.",
    ],
    redFlags: [
      "Order routing and available-to-promise run on inventory accuracy below ~90% with no RFID/cycle-count program — the OMS is sourcing to phantom stock.",
      "Ship-from-store value is claimed as gross sales recovered, with no per-node cost-to-serve and no DC-alternative comparison — margin dilution is invisible.",
      "Split-shipment rate is high and routing optimizes only for speed or local clearance with no cost objective, while freight spend outpaces order volume.",
      "Delivery/pickup promises are static SLAs set independent of live capacity, so on-time and perfect-order rates collapse at peak and cancellations rise.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "OMS / distributed order management (Manhattan, IBM Sterling, Salesforce OM, Fluent)",
        category: "Cross-channel order orchestration, sourcing/routing, ATP",
        switchingCost:
          "High — the OMS holds the configured routing logic, node model, ATP rules, and channel integrations; replacement is a multi-quarter re-implementation, not a swap.",
        renewalDynamics:
          "Subscription by order volume / nodes; AI routing, promise-optimization, and store-fulfillment modules increasingly upsold as premium tiers at renewal.",
      },
      {
        vendorName: "Store-fulfillment / BOPIS execution platforms (Radial, Deck Commerce, native apps)",
        category: "In-store pick/pack/curbside and BOPIS execution",
        switchingCost:
          "Moderate — value depends on store-workflow configuration and device fleet, but order data is portable; lock-in is the store-process integration.",
        renewalDynamics:
          "Subscription by store/order volume; pick-productivity and accuracy outcomes are the negotiation levers.",
      },
      {
        vendorName: "Last-mile / same-day platforms (Bringg, DoorDash Drive, Uber Direct, carriers)",
        category: "Last-mile dispatch, same-day delivery, carrier rating",
        switchingCost:
          "Low-to-moderate — carrier/courier networks are re-connectable and rate-shoppable; lock-in is mainly integration and SLA history, keeping this layer competitive.",
        renewalDynamics:
          "Per-delivery / per-shipment pricing; network coverage, zone rates, and same-day capacity are the levers, and multi-carrier strategy disciplines price.",
      },
      {
        vendorName: "Inventory-accuracy & returns platforms (Nedap, Impinj, Optoro, Loop Returns)",
        category: "RFID / accuracy capture and reverse-logistics / returns",
        switchingCost:
          "Moderate — RFID tagging investment and returns-workflow integration accrete, but the accuracy data and return records are portable; lock-in rises with rollout depth.",
        renewalDynamics:
          "Subscription plus hardware/tag cost (RFID) or per-return pricing; coverage breadth and measured accuracy/recovery lift drive price and stickiness.",
      },
    ],
    switchingCosts:
      "The OMS/DOM core is effectively non-switchable in isolation — the " +
      "configured routing logic, node model, ATP rules, and channel " +
      "integrations are the lock-in, and a re-platform is a multi-quarter " +
      "program. Store-fulfillment, last-mile, and inventory-accuracy/returns " +
      "layers are more replaceable, with the integration estate (store " +
      "workflows, carrier connections, RFID rollout) the true switching cost. " +
      "The negotiable frontier is in the AI routing/promise add-ons around the " +
      "OMS core and in the competitive last-mile and returns layers.",
    negotiationLevers: [
      "Outcome/value pricing on AI routing and promise add-ons tied to measured cost-per-order, split-rate, or on-time lift rather than seats/volume tiers",
      "Phase-gated pilot-to-scale with inventory-accuracy and cost-to-serve parity proof per node type before enterprise commitment",
      "Multi-carrier / multi-courier strategy and rate-shopping to discipline last-mile pricing and avoid single-network lock-in",
      "Data-export and model-portability rights so routing logic, node model, and ATP configuration are not trapped in the OMS",
      "Re-price store-fulfillment and returns platforms on realized productivity / recovery (picks/hour, accuracy, restock speed) rather than promised scope",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      cost_to_serve_claim: [
        "fully-loaded cost per order by node and method",
        "split-shipment and returns components isolated",
        "comparison to the DC alternative for store-ship",
      ],
      inventory_accuracy_claim: [
        "unit-level accuracy by SKU x location from cycle-count/RFID audit",
        "share of cancellations/re-routes traced to inaccuracy",
        "audit window and method stated",
      ],
      service_level_claim: [
        "on-time / perfect-order rate by method and node",
        "failure-reason decomposition (late vs wrong-item vs damaged)",
        "peak-versus-normal performance distinguished",
      ],
      ship_from_store_claim: [
        "store-ship mix with per-node cost-to-serve",
        "net-of-returns margin compared to DC alternative and saved sale",
        "node-selection / zone driver identified",
      ],
      split_shipment_claim: [
        "split rate by routing policy and category",
        "freight/packaging cost of splits quantified",
        "inventory-positioning / routing-logic driver named",
      ],
      value_projection: [
        "the inventory-accuracy state as the gating assumption",
        "benchmark planning-range with node-economics sensitivity",
        "explicit haircut factors (accuracy, node economics, execution/adoption)",
      ],
    },
    citationStandard:
      "Quantitative omnichannel-fulfillment claims cite the system of record " +
      "(OMS/DOM, WMS/store-fulfillment app, carrier/freight-pay, returns " +
      "platform), the node and method, and the period. Cost claims show cost " +
      "per order by node/method with splits and returns isolated. Inventory " +
      "claims state unit-level accuracy by SKU x location and link it to " +
      "cancellations. Ship-from-store claims are net of per-node cost-to-serve " +
      "and returns and compared to the DC alternative — never gross sales " +
      "recovered. Value projections state inventory accuracy as the gating " +
      "assumption, give a labelled planning range with node-economics " +
      "sensitivity, and name the haircut factors applied — never a single " +
      "asserted cost saving or sales-recovery number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant inventory accuracy at SKU x store is unknown or below ~90% — frame routing/ATP/BOPIS value as a planning range explicitly gated on accuracy readiness.",
      "A ship-from-store benefit is quoted as sales recovered — flag that it must be sized NET of per-node cost-to-serve and returns and compared to the DC alternative.",
      "A delivery-speed or on-time figure is quoted from a normal period — flag that it degrades at peak under node/labor/carrier capacity strain.",
      "Vendor-reported cost-per-order, on-time, or accuracy outcomes are cited — mark as provider claims pending validation on the tenant's own nodes and data.",
    ],
    inferenceLanguage: [
      "Across omni retailers at this scale, fulfillment cost per order at this method typically runs... but it inflates with splits and store-pick labor...",
      "Without your SKU x store accuracy and per-node cost data, the industry pattern suggests cost-to-serve reduction of roughly... contingent on inventory accuracy...",
      "Peer retailers commonly hold on-time / perfect-order in the range of... once promises are calibrated to live capacity...",
      "Treating this as a planning range gated on inventory accuracy and node economics rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific cost-per-order reduction or sales-recovery number for this tenant",
      "This tenant's actual inventory accuracy, on-time rate, split rate, or fulfillment cost per order",
      "A ship-from-store benefit asserted as gross sales recovered without netting per-node cost-to-serve and returns",
      "A claim that inventory accuracy is sufficient for omni sourcing without SKU x store audit evidence",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "fulfillment cost-to-serve by node and method / where does cost-per-order concentrate",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack cost per order by node/method (DC, store-ship, BOPIS, same-day) with pick labor, packaging, freight/zone, split penalty, and returns isolated to show the avoidable, mismanaged-store-ship component.",
    },
    {
      questionPattern:
        "ship-from-store / cost-to-serve value story net of margin dilution",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current fulfillment cost to routing, split-reduction, and store-pick contributions to target, with inventory-accuracy and node-economics haircuts shown.",
    },
    {
      questionPattern:
        "inventory accuracy versus omni cancellations by store / the binding-constraint view",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap of SKU x store inventory accuracy against cancellation/re-route rate to expose where the OMS is sourcing to phantom stock.",
    },
    {
      questionPattern: "value sensitivity to inventory accuracy and node economics",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of value sensitivity to the dominant haircut factors (inventory accuracy, ship-from-store node economics, execution/adoption, capacity).",
    },
    {
      questionPattern: "omnichannel-fulfillment KPI scorecard",
      exhibitKind: "table",
      note: "Fulfillment cost per order, on-time delivery, perfect order, inventory accuracy, in-stock (omni), split-shipment, ship-from-store mix, BOPIS adoption, cycle time, click-to-deliver, return rate, order accuracy versus planning ranges by node/method.",
    },
    {
      questionPattern: "on-time / perfect-order performance trend including peak",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend on-time and perfect-order rate against the planning range, annotating peak periods to show capacity-driven degradation honestly.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Inventory accuracy is fixed first (RFID/cycle-count discipline) — the binding constraint is treated as a prerequisite, not an afterthought",
      "A single OMS/DOM sources against one accuracy-derated available-to-promise and optimizes total cost-to-serve, not nearest stock",
      "Ship-from-store mix is set per node on measured cost-to-serve net of returns, beating the DC alternative — not pushed for sales recovery alone",
      "Delivery/pickup promises are calibrated to live node and labor capacity so on-time holds through peak, and store associates adopt the pick workflow",
    ],
    failureDrivers: [
      "Building routing and available-to-promise on inventory below ~90% accuracy — the OMS sources to phantom stock and cancellations/splits eat the value",
      "Scaling ship-from-store on gross sales recovered while per-node cost-to-serve and returns quietly dilute margin below the DC alternative",
      "Routing optimized for speed or clearance with no cost objective, inflating split shipments and freight faster than order volume",
      "Static promise SLAs and weak store-pick execution that collapse on-time and perfect-order rate at peak, driving cancellations",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Cost-aware order routing and single ATP adopt first because the cost-to-" +
      "serve and split-reduction value is measurable and the OMS already owns " +
      "the order. Store-pick optimization and BOPIS scale next, gated by store " +
      "labor and process change. The predictive promise engine and returns " +
      "intelligence are emerging and adopt later. Inventory-accuracy programs " +
      "(RFID) are the unlock for the whole stack but adopt on a capital and " +
      "rollout cadence — and without them the rest sources to phantom stock. " +
      "Scale is gated by the inventory-accuracy foundation, not by routing " +
      "algorithm sophistication.",
    roiClarity: "medium",
    roiClarityBasis:
      "Cost-to-serve reduction (routing, split reduction, store-pick " +
      "productivity) and last-mile savings are reasonably firm and measurable " +
      "in OMS/WMS/freight-pay records. The soft spots are two: ship-from-store " +
      "value is conditional on per-node economics and can be margin-dilutive if " +
      "sized on gross sales recovered, and accuracy-driven sales/cancellation " +
      "value depends on attributing cancellations to inaccuracy cleanly — which " +
      "is why the value model leans on durable cost-to-serve and the accuracy " +
      "foundation and the evidence/hedge rules force an inventory-accuracy gate " +
      "and net-of-cost ship-from-store sizing rather than a single saving or " +
      "sales-recovery number.",
  },

  regulatoryFrame: {
    name: "Consumer protection, delivery/returns disclosure & last-mile labor/privacy",
    relevance:
      "The dominant regulatory frame for omnichannel fulfillment: delivery-date " +
      "promises, shipping/restocking fees, and return rights are regulated " +
      "consumer disclosures the promise engine and returns policy must honor; " +
      "customer address and delivery data carry privacy obligations; same-day/" +
      "crowdsourced last mile inherits gig-driver classification and labor " +
      "rules; and shipping age-restricted/hazmat goods constrains carrier and " +
      "mode choice. AI routing, promising, and returns decisions must respect " +
      "these constraints (see vocabulary.regulatoryFrames for the specific frames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave4)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
