// Domain Function Pack — Retail · Store operations.
//
// Function key: `store_operations`.
//
// Store operations is the function that runs the physical store: it converts a
// merchandised, priced assortment into a transacted sale, shift after shift,
// across a fleet of locations. It owns the store labour model — the schedule,
// the budgeted hours, and how those hours are spent against the tasks the day
// demands — and the in-store execution disciplines that decide whether the
// product the customer wants is actually on the shelf, priced correctly, and
// findable. It is judged on a hard double bind: a store must convert the
// traffic it gets (conversion, units per transaction, on-shelf availability)
// AND it must do so inside a labour budget that is one of the largest
// controllable cost lines a retailer carries, while protecting the inventory
// from shrink and keeping the customer's wait short enough that the sale is
// not abandoned at the checkout.
//
// The operating reality the pack encodes: store operations fails in two
// coupled ways at once. It over-spends labour — hours scheduled to a flat
// template rather than to traffic and task demand, so the store is over-
// staffed in a quiet hour and under-staffed at the peak — AND it under-
// executes — tasks left undone, shelves left empty, planograms drifting,
// shrink unaddressed — and the two reinforce each other, because a store run
// short of hours at the wrong time is exactly the store that cannot keep the
// shelf full or the queue moving. The AI archetypes are the recurring bets
// against that reality: AI labour scheduling and forecasting, store task
// orchestration, vision-based on-shelf-availability detection, shrink and
// loss detection, the store-associate assistant, and store-level sales
// forecasting.
//
// The companion retail packs — merchandising-assortment, pricing-promotions,
// demand-inventory-planning, supply-chain-fulfillment — decide what the store
// sells, what it costs, and how it is replenished; store operations is where
// all of that meets the customer. Its sister function customer-loyalty-
// personalization owns who the customer is and why they come back; store
// operations owns whether the visit itself converts.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark
// is a labelled planning range, never an asserted fact (spec §6 hard fail).

import type { FunctionPack } from '../function-pack-types';

export const storeOperationsPack: FunctionPack = {
  industryKey: 'retail',
  functionKey: 'store_operations',
  functionLabel: 'Store operations',
  summary:
    'Store operations is the function that runs the physical store — it ' +
    'converts a merchandised, priced assortment into a transacted sale, ' +
    'shift after shift, across a fleet of locations. It owns the store ' +
    'labour model — the schedule, the budgeted hours, and how those hours ' +
    'are spent against the day’s tasks — and the in-store execution ' +
    'disciplines that decide whether product is on the shelf, priced ' +
    'correctly, and findable. The function is judged on a double bind: a ' +
    'store must convert the traffic it gets — conversion, units per ' +
    'transaction, on-shelf availability — and do it inside a labour budget ' +
    'that is one of the largest controllable cost lines a retailer carries, ' +
    'while protecting inventory from shrink and keeping the checkout wait ' +
    'short enough that the sale is not abandoned. It fails in two coupled ' +
    'ways at once: it over-spends labour against a flat template and it ' +
    'under-executes the task list — and a store short of hours at the wrong ' +
    'time is exactly the store that cannot keep the shelf full or the queue ' +
    'moving.',
  version: '1.0.0',
  lastReviewed: '2026-05-21',

  // ── Layer 1 — Operating metrics ───────────────────────────────────────────
  operatingMetrics: [
    {
      key: 'sales_per_labor_hour',
      name: 'Sales per labour hour',
      definition:
        'Net sales generated for every worked store labour hour over the ' +
        'period — net sales divided by total worked hours across all store ' +
        'roles.',
      unit: 'net sales $ per worked labour hour',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 150,
        high: 600,
        basis:
          'Sales per labour hour varies sharply by format and segment — ' +
          'high-ticket specialty and electronics run high, low-ticket ' +
          'convenience and discount run lower. A planning range; the ' +
          'tenant format and basket size set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The point-of-sale (POS) system for net sales joined to worked ' +
        'hours from the workforce-management / time-and-attendance system.',
      whyItMatters:
        'It is the headline productivity test of the store labour model — ' +
        'the single number that joins the sales the store earned to the ' +
        'hours it spent earning them, and the figure every scheduling and ' +
        'task decision ultimately moves.',
    },
    {
      key: 'conversion_rate',
      name: 'Conversion rate',
      definition:
        'The share of store visits — counted by door-traffic sensors — ' +
        'that end in a transaction, rather than a browse that leaves with ' +
        'no purchase.',
      unit: '% of counted visits ending in a transaction',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 50,
        basis:
          'Conversion is structural by format — destination and grocery ' +
          'trips convert high, browse-heavy mall specialty and apparel ' +
          'convert lower. A planning range; format and trip intent set the ' +
          'point.',
        label: 'planning-range',
      },
      dataSource:
        'Door-traffic counters reconciled against transaction counts from ' +
        'the POS system.',
      whyItMatters:
        'It is the clearest read on whether the store is turning the ' +
        'traffic it already paid to attract into sales — a conversion gap ' +
        'is demand walking out unserved, and it is where labour coverage ' +
        'and floor execution show up first.',
    },
    {
      key: 'shrink_rate',
      name: 'Shrink rate',
      definition:
        'Inventory lost to theft, fraud, administrative error, and damage ' +
        '— the gap between book inventory and physically counted ' +
        'inventory — expressed as a percentage of net sales.',
      unit: '% of net sales',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 3,
        basis:
          'Shrink runs structurally by category and exposure — high-theft ' +
          'categories and high-traffic urban stores run higher than ' +
          'controlled formats. A planning range; the category and store ' +
          'mix set the point.',
        label: 'planning-range',
      },
      dataSource:
        'Physical inventory counts and cycle counts reconciled against ' +
        'book inventory in the merchandising / inventory system, with the ' +
        'loss-prevention exception system.',
      whyItMatters:
        'Shrink is a direct, dollar-for-dollar drain on store margin and a ' +
        'leading indicator of process and security breakdown — it is ' +
        'margin that was earned and then lost before it reached the P&L.',
    },
    {
      key: 'on_shelf_availability',
      name: 'On-shelf availability (OSA)',
      definition:
        'The share of active assortment SKUs physically present, ' +
        'shoppable, and correctly located on the shelf at the moment a ' +
        'customer would buy them — distinct from system in-stock, which ' +
        'can show stock the customer cannot find.',
      unit: '% of active SKUs available on the shelf',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 92,
        high: 98,
        basis:
          'On-shelf availability sits below system in-stock because of ' +
          'backroom stock not worked to the floor and misplaced product; ' +
          'the band spans a strong execution to a weak one. A planning ' +
          'range.',
        label: 'planning-range',
      },
      dataSource:
        'Shelf audits, vision-system shelf scans, and the gap between ' +
        'perpetual inventory and physically verified shelf presence.',
      whyItMatters:
        'An on-shelf gap is a sale lost on a product the store is paying ' +
        'to carry — and it is invisible to a system in-stock report, so ' +
        'OSA is where a fully-stocked store silently leaks both revenue ' +
        'and customer trust.',
    },
    {
      key: 'task_completion_rate',
      name: 'Store-task completion rate',
      definition:
        'The share of assigned store tasks — replenishment, resets, price ' +
        'changes, audits, freight processing — completed on time and to ' +
        'standard within the assigned window.',
      unit: '% of assigned tasks completed on time',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 70,
        high: 95,
        basis:
          'Task completion depends on how well hours are matched to the ' +
          'task load and how clearly work is prioritised; the band spans a ' +
          'task-overloaded store to a well-paced one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The store task-management system, comparing completed and ' +
        'verified tasks against tasks assigned.',
      whyItMatters:
        'It is the execution scorecard of the store — undone tasks are ' +
        'empty shelves, stale prices, and missed resets, and a chronically ' +
        'low completion rate is the early signal that labour hours do not ' +
        'cover the work the day actually demands.',
    },
    {
      key: 'checkout_wait_time',
      name: 'Customer wait / checkout time',
      definition:
        'The average elapsed time a customer spends waiting in and moving ' +
        'through the checkout — from joining the queue to completing ' +
        'payment — across staffed and self-checkout lanes.',
      unit: 'minutes per customer at checkout',
      directionOfGood: 'lower',
      benchmarkRange: {
        low: 1,
        high: 6,
        basis:
          'Acceptable wait varies by format and trip — a quick ' +
          'convenience trip tolerates far less wait than a large weekly ' +
          'shop; the band spans a fast checkout to a congested one. A ' +
          'planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Queue-measurement sensors and POS transaction timestamps, by ' +
        'lane type and time of day.',
      whyItMatters:
        'The checkout is the last step before the sale is banked — a long ' +
        'wait drives basket abandonment and is one of the most cited ' +
        'reasons a customer does not return, so wait time is conversion ' +
        'and loyalty at the point of payment.',
    },
    {
      key: 'planogram_compliance_rate',
      name: 'Planogram compliance rate',
      definition:
        'The share of audited fixtures and shelf sets where the actual ' +
        'product placement, facings, and adjacencies match the approved ' +
        'planogram.',
      unit: '% of audited fixtures compliant with the planogram',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 65,
        high: 90,
        basis:
          'Planogram compliance drifts between resets as staff make ' +
          'expedient changes; the band spans a loosely-executed floor to a ' +
          'tightly-managed one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'Planogram-compliance audits and vision-system shelf scans ' +
        'compared against the approved planogram in the space-planning ' +
        'system.',
      whyItMatters:
        'A planogram is the merchant’s demand-and-margin plan made ' +
        'physical — when the floor drifts from it, the carefully designed ' +
        'space allocation, adjacency pull, and promotional placement are ' +
        'quietly undone in the store.',
    },
    {
      key: 'labor_schedule_adherence',
      name: 'Labour-schedule adherence',
      definition:
        'The share of scheduled labour hours that are actually worked as ' +
        'planned — neither lost to no-shows and unplanned absence nor ' +
        'inflated by unscheduled overtime and early or late clock events.',
      unit: '% of scheduled hours worked as planned',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 80,
        high: 96,
        basis:
          'Adherence depends on absence rates, the discipline of clock-in ' +
          'practice, and how late the schedule is published; the band ' +
          'spans a volatile store to a stable one. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The workforce-management system, comparing actual clocked hours ' +
        'against the published schedule.',
      whyItMatters:
        'A schedule only delivers coverage if it is the schedule that is ' +
        'actually worked — poor adherence means the carefully optimised ' +
        'plan is not the plan the store runs, so coverage and cost both ' +
        'drift from intent.',
    },
    {
      key: 'store_nps',
      name: 'Store Net Promoter Score',
      definition:
        'The Net Promoter Score derived from the store-experience survey ' +
        '— the share of promoters less the share of detractors among ' +
        'recently shopped customers for that location.',
      unit: 'NPS points (−100 to +100)',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 20,
        high: 60,
        basis:
          'Store NPS varies by segment and survey method; the band spans a ' +
          'strained store experience to a strong one on a typical retail ' +
          'NPS scale. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The customer-experience survey platform, scored per store and ' +
        'segmented by visit reason and driver.',
      whyItMatters:
        'It is the customer’s verdict on the store visit — staffing, ' +
        'availability, checkout, and cleanliness all surface in it — and a ' +
        'falling store NPS is the leading indicator of the traffic and ' +
        'loyalty erosion that shows up later in sales.',
    },
    {
      key: 'units_per_transaction',
      name: 'Units per transaction (UPT)',
      definition:
        'The average number of units sold per completed transaction — a ' +
        'read on how much each converted customer buys, before price.',
      unit: 'units per transaction',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 1.5,
        high: 6,
        basis:
          'Units per transaction is structural by format — convenience ' +
          'and electronics run low, grocery and warehouse-club run high. A ' +
          'planning range; the format and trip type set the point.',
        label: 'planning-range',
      },
      dataSource:
        'The POS system, dividing units sold by completed transaction ' +
        'count over the period.',
      whyItMatters:
        'It is the store’s basket-building scorecard — once a customer ' +
        'converts, UPT measures whether floor staff, adjacencies, and ' +
        'availability turned the visit into a fuller basket rather than a ' +
        'single-item trip.',
    },
    {
      key: 'shrink_known_loss_split',
      name: 'Known-loss share of shrink',
      definition:
        'The share of total shrink attributable to identified, ' +
        'investigable causes — confirmed theft events, fraud cases, ' +
        'process errors — rather than unidentified, unexplained inventory ' +
        'loss.',
      unit: '% of total shrink with an identified cause',
      directionOfGood: 'higher',
      benchmarkRange: {
        low: 30,
        high: 70,
        basis:
          'The identified share depends on the maturity of exception ' +
          'analytics and investigation; the band spans a store that cannot ' +
          'explain its loss to one that can. A planning range.',
        label: 'planning-range',
      },
      dataSource:
        'The loss-prevention case-management and exception-reporting ' +
        'system reconciled against the total physical-count shrink.',
      whyItMatters:
        'Loss the retailer cannot attribute is loss it cannot fix — a low ' +
        'identified share means shrink is being absorbed blind, so this ' +
        'metric tests whether the loss-prevention function can act on what ' +
        'it loses.',
    },
    {
      key: 'store_labor_cost_pct',
      name: 'Store labour cost as a percent of sales',
      definition:
        'Total store labour cost — wages, premium pay, and benefits load ' +
        'for store roles — expressed as a percentage of net store sales.',
      unit: '% of net store sales',
      directionOfGood: 'in-range',
      benchmarkRange: {
        low: 8,
        high: 20,
        basis:
          'Store labour intensity is structural by format — service-heavy ' +
          'specialty runs high, low-service discount and warehouse run ' +
          'lower. A planning range, not a target — too low starves ' +
          'execution, too high erodes margin.',
        label: 'planning-range',
      },
      dataSource:
        'The payroll and workforce-management systems for store labour ' +
        'cost, reconciled against net store sales from the POS.',
      whyItMatters:
        'It is the store’s core cost-discipline metric — labour is the ' +
        'largest controllable line in the store P&L, and the figure must ' +
        'be read as a balance: cutting it below the band starves the ' +
        'execution that drives conversion and availability.',
    },
  ],

  // ── Layer 2 — Pain themes & failure modes ─────────────────────────────────
  painThemes: [
    {
      key: 'flat_template_scheduling',
      name: 'Flat-template scheduling against uneven demand',
      description:
        'Labour is scheduled to a fixed weekly template — the same hours ' +
        'every Tuesday — rather than to a forecast of traffic and task ' +
        'load. The store is over-staffed through quiet mornings and ' +
        'under-staffed at the evening and weekend peak, so it pays for ' +
        'idle hours and is short exactly when conversion is at stake.',
      detectionSignal:
        'Sales per labour hour swings widely across dayparts; conversion ' +
        'dips at predictable peak windows; the schedule shape barely ' +
        'changes week to week regardless of forecast traffic.',
      diagnosticQuestion:
        'Is the store schedule built from a traffic and task-load ' +
        'forecast, or from a fixed template — and how far does coverage ' +
        'track the actual peak?',
    },
    {
      key: 'task_overload_and_invisibility',
      name: 'Task overload and task invisibility',
      description:
        'More tasks are pushed to the store — resets, audits, price ' +
        'changes, freight, omnichannel picking — than the scheduled hours ' +
        'can absorb, and no system shows what was actually done. Staff ' +
        'silently triage, the most visible work gets done, and ' +
        'replenishment and resets are quietly dropped.',
      detectionSignal:
        'Task-completion rate is low and unmeasured; tasks arrive without ' +
        'an hours estimate; managers cannot say which tasks were skipped ' +
        'or why.',
      diagnosticQuestion:
        'Is the total task load costed in hours against the schedule, and ' +
        'can the store see which tasks were completed and which were ' +
        'dropped?',
    },
    {
      key: 'phantom_inventory_osa_gap',
      name: 'Phantom inventory and the on-shelf-availability gap',
      description:
        'The system shows stock that the customer cannot find — units ' +
        'sitting in the backroom unworked, misplaced on the wrong shelf, ' +
        'or recorded but physically missing. System in-stock looks ' +
        'healthy while on-shelf availability is materially worse, and the ' +
        'lost sale never registers.',
      detectionSignal:
        'On-shelf availability audits run well below system in-stock; ' +
        'sales for a SKU drop to zero while inventory shows on hand; ' +
        'backroom stock ages without reaching the floor.',
      diagnosticQuestion:
        'How far does audited on-shelf availability sit below system ' +
        'in-stock, and how much stock is on hand but not shoppable?',
    },
    {
      key: 'reactive_shrink_management',
      name: 'Reactive, unattributed shrink management',
      description:
        'Shrink is discovered only at the annual or semi-annual physical ' +
        'count, as a large unexplained number, with no early signal and ' +
        'no attribution. By the time the loss is visible the events that ' +
        'caused it are months past and untraceable.',
      detectionSignal:
        'Shrink is known only at count time; the identified-cause share ' +
        'is low; exception analytics on POS and inventory data are absent ' +
        'or unused between counts.',
      diagnosticQuestion:
        'How early is shrink detected between physical counts, and what ' +
        'share of it can the store attribute to an identified, ' +
        'investigable cause?',
    },
    {
      key: 'checkout_congestion',
      name: 'Checkout congestion at peak',
      description:
        'Checkout capacity — staffed lanes and self-checkout — is not ' +
        'flexed to the traffic curve, so queues build at the predictable ' +
        'peak. Customers abandon full baskets, conversion falls in the ' +
        'busiest hour, and the store loses the sale at the final step.',
      detectionSignal:
        'Wait time spikes at recurring peak windows; basket-abandonment ' +
        'and walk-out reports cluster at those times; lane coverage does ' +
        'not move with the traffic forecast.',
      diagnosticQuestion:
        'Is checkout coverage flexed to the traffic forecast, and how ' +
        'often does wait time at peak push customers to abandon the ' +
        'basket?',
    },
    {
      key: 'execution_inconsistency_across_fleet',
      name: 'Execution inconsistency across the fleet',
      description:
        'The same plan — planogram, promotion, reset, standard — is ' +
        'executed well in some stores and poorly in others, with no ' +
        'visibility into which. Best-store practice never spreads, and ' +
        'the chain’s performance is dragged by a long tail of weak ' +
        'execution it cannot see.',
      detectionSignal:
        'Planogram-compliance and task-completion rates vary widely ' +
        'store to store with no corrective loop; comparable stores show ' +
        'persistent, unexplained performance gaps.',
      diagnosticQuestion:
        'How is in-store execution measured consistently across the ' +
        'fleet, and how does best-store practice reach the lagging ' +
        'stores?',
    },
    {
      key: 'manager_admin_drag',
      name: 'Store-manager administrative drag',
      description:
        'Store and department managers spend a large share of their time ' +
        'on scheduling, reporting, ordering, and email rather than on the ' +
        'sales floor coaching staff and serving customers. The most ' +
        'experienced people in the building are pulled away from the work ' +
        'that actually moves conversion.',
      detectionSignal:
        'Managers report most of the shift in the back office; scheduling ' +
        'and reporting are manual and time-consuming; floor coaching and ' +
        'customer recovery are squeezed.',
      diagnosticQuestion:
        'What share of a store manager’s time is spent on administration ' +
        'versus on the sales floor, and what is pulling them off the ' +
        'floor?',
    },
    {
      key: 'frontline_knowledge_gap',
      name: 'Front-line knowledge and onboarding gap',
      description:
        'High store turnover means a large share of associates are new, ' +
        'and they cannot reliably answer product, policy, promotion, or ' +
        'process questions. Customers get inconsistent help, attachment ' +
        'and conversion suffer, and tribal knowledge walks out with every ' +
        'departure.',
      detectionSignal:
        'A large share of associates are within their first months; ' +
        'mystery-shop and store-NPS scores cite unhelpful or uninformed ' +
        'staff; the same questions escalate repeatedly to managers.',
      diagnosticQuestion:
        'How quickly do new associates become productive and ' +
        'knowledgeable, and how do they get reliable answers on the ' +
        'floor in the moment?',
    },
  ],

  // ── Layer 3 — AI use-case archetypes ──────────────────────────────────────
  aiUseCaseArchetypes: [
    {
      key: 'ai_labor_scheduling_forecasting',
      name: 'AI labour scheduling and forecasting',
      valueMechanism:
        'A model forecasts store traffic and the costed task load by ' +
        'daypart and builds a schedule that places hours where conversion ' +
        'and execution actually need them — flexing coverage to the peak ' +
        'and trimming idle hours in the quiet — within budget, labour-law, ' +
        'and fairness constraints. Value comes from raising sales per ' +
        'labour hour on both sides at once: better conversion at peak from ' +
        'real coverage, and lower cost from cutting over-staffed quiet ' +
        'hours.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Historical and forecast store traffic by daypart',
        'POS sales and transaction patterns by hour and day',
        'The costed store task load and its hours estimate',
        'Labour budget, labour-law, availability, and fairness constraints',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The model proposes the schedule; the store manager reviews and ' +
          'owns the final published schedule and any override.',
        'Optimisation must respect predictable-scheduling and fair-' +
          'workweek law — minimum hours, advance-notice, and rest rules ' +
          'are hard constraints, not cost trade-offs.',
        'Cost minimisation must not cut hours below the floor that ' +
          'execution and safe operation require — under-staffing a store ' +
          'destroys conversion to save on payroll.',
      ],
      metricsMoved: [
        'sales_per_labor_hour',
        'conversion_rate',
        'labor_schedule_adherence',
        'store_labor_cost_pct',
        'checkout_wait_time',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'store_task_orchestration',
      name: 'Store task orchestration',
      valueMechanism:
        'An agent receives every task pushed to the store, costs it in ' +
        'hours, sequences and prioritises it against the day’s schedule ' +
        'and traffic, routes it to the right associate, and tracks ' +
        'completion — so the store works the highest-value tasks first ' +
        'and the home office sees what was actually done. Value comes ' +
        'from lifting task-completion and planogram-compliance rates ' +
        'without adding hours, and from ending the silent triage that ' +
        'drops replenishment and resets.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'The inbound task list from merchandising, marketing, and ' +
          'operations with hours estimates',
        'The published labour schedule and associate availability',
        'Store traffic and daypart patterns',
        'Task-completion and verification history',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The agent sequences and routes tasks; the store manager owns the ' +
          'priority calls and can re-sequence against local judgement.',
        'Task estimates must be honest — a systematically low hours ' +
          'estimate simply re-creates task overload inside a tidier ' +
          'interface.',
        'Customer service on the floor must take precedence over a queued ' +
          'task — the orchestrator cannot route an associate away from a ' +
          'waiting customer.',
      ],
      metricsMoved: [
        'task_completion_rate',
        'planogram_compliance_rate',
        'on_shelf_availability',
        'sales_per_labor_hour',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'osa_vision_detection',
      name: 'On-shelf-availability detection (computer vision)',
      valueMechanism:
        'A computer-vision system — fixed cameras, shelf sensors, or ' +
        'associate and robot-captured imagery — scans the shelf, detects ' +
        'out-of-stock gaps, misplaced product, and low stock, and ' +
        'generates a prioritised replenishment task before the customer ' +
        'finds the hole. Value comes from closing the on-shelf-' +
        'availability gap that system in-stock cannot see — recovering ' +
        'the lost sale on product the store already owns.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'Shelf imagery from fixed cameras, sensors, or mobile capture',
        'The planogram and the active assortment for the fixture',
        'Perpetual inventory and backroom stock position',
        'Sales-rate data to prioritise the highest-velocity gaps',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The vision system detects the gap and raises a task; an associate ' +
          'verifies and works it — a false positive must not be allowed to ' +
          'churn labour.',
        'Camera and sensor deployment must respect customer and associate ' +
          'privacy and the applicable surveillance and consent rules.',
        'Detection accuracy degrades with poor lighting, occlusion, and ' +
          'planogram change — the model must be monitored and recalibrated, ' +
          'not trusted blind.',
      ],
      metricsMoved: [
        'on_shelf_availability',
        'conversion_rate',
        'units_per_transaction',
        'task_completion_rate',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'shrink_loss_detection',
      name: 'Shrink and loss detection',
      valueMechanism:
        'A model analyses POS exceptions, inventory movements, ' +
        'self-checkout events, refund and void patterns, and — where ' +
        'deployed — vision signal to detect theft, fraud, and process ' +
        'error early, attribute the loss to an identified cause, and ' +
        'prioritise investigations for the loss-prevention team. Value ' +
        'comes from raising the identified share of shrink and cutting ' +
        'loss between physical counts — turning an unexplained number ' +
        'into an addressable one.',
      adoptionProfile: 'emerging',
      dataDependencies: [
        'POS transaction, void, refund, and discount-exception data',
        'Inventory-movement and cycle-count data',
        'Self-checkout event and intervention logs',
        'Loss-prevention case history and, where deployed, vision signal',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The model flags an anomaly and prioritises an investigation; a ' +
          'loss-prevention professional owns the case and any accusation — ' +
          'a flag is never a finding of theft.',
        'An employee-facing flag must be handled with strict privacy, due ' +
          'process, and bias review — a mis-aimed accusation is an ethical ' +
          'and legal exposure.',
        'Vision and behaviour signals must be governed by surveillance, ' +
          'consent, and anti-discrimination rules and never used to ' +
          'profile customers.',
      ],
      metricsMoved: [
        'shrink_rate',
        'shrink_known_loss_split',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
    {
      key: 'store_associate_assist',
      name: 'Store-associate assist',
      valueMechanism:
        'A conversational assistant on the associate’s handheld answers ' +
        'product, inventory, promotion, policy, and process questions in ' +
        'the moment — grounded in the retailer’s own product, inventory, ' +
        'and policy data — so any associate, however new, can serve a ' +
        'customer like an experienced one. Value comes from lifting ' +
        'conversion, units per transaction, and store NPS by closing the ' +
        'front-line knowledge gap that high turnover keeps reopening.',
      adoptionProfile: 'experimenting',
      dataDependencies: [
        'Product catalogue, attributes, and how-to content',
        'Real-time inventory and nearby-store stock position',
        'Promotion, pricing, and policy rules',
        'Standard operating procedures and process guides',
      ],
      controlPosture: 'human-in-the-loop',
      controlRiskNotes: [
        'The assistant informs the associate, who owns the customer ' +
          'conversation and the final answer — it is a knowledge aid, not ' +
          'an autonomous agent.',
        'Answers must be grounded in the retailer’s own current data — a ' +
          'confidently wrong price, stock, or policy answer damages trust ' +
          'at the point of sale.',
        'The assistant must defer or escalate on anything outside its ' +
          'grounded knowledge rather than improvise an answer.',
      ],
      metricsMoved: [
        'conversion_rate',
        'units_per_transaction',
        'store_nps',
      ],
      relatedArchetypePlaybook: 'workflow_automation',
    },
    {
      key: 'store_level_sales_forecasting',
      name: 'Store-level sales and traffic forecasting',
      valueMechanism:
        'A model forecasts sales, traffic, and basket mix at the store ' +
        'and daypart level — folding in weather, local events, ' +
        'promotions, and seasonality — and serves it as the shared signal ' +
        'every downstream store decision consumes: the labour schedule, ' +
        'checkout coverage, replenishment, and the freight plan. Value ' +
        'comes from anchoring scheduling, coverage, and execution to a ' +
        'real demand forecast rather than to last year or a flat ' +
        'template.',
      adoptionProfile: 'mainstream',
      dataDependencies: [
        'Historical store sales and traffic by daypart',
        'Promotion, pricing, and event calendars',
        'Weather, local-event, and seasonality data',
        'Store attributes — format, trade area, demographics',
      ],
      controlPosture: 'human-on-the-loop',
      controlRiskNotes: [
        'The forecast is a planning input; store and operations leaders ' +
          'own the scheduling and coverage decisions built on it.',
        'A forecast trained on a stockout- and under-staffed history ' +
          'learns those distortions as normal — the signal must be ' +
          'corrected for them.',
        'New stores, remodels, and trend breaks carry wide uncertainty ' +
          'and must be presented as ranges, not point forecasts.',
      ],
      metricsMoved: [
        'sales_per_labor_hour',
        'conversion_rate',
        'checkout_wait_time',
        'on_shelf_availability',
      ],
      relatedArchetypePlaybook: 'analytics_modernization',
    },
  ],

  // ── Layer 4 — Reference solution patterns ─────────────────────────────────
  referenceSolutionPatterns: [
    {
      key: 'demand_driven_store_labor_model',
      name: 'Demand-driven store labour model',
      description:
        'A pattern that drives the store schedule from a forecast of ' +
        'traffic and a costed task load rather than a fixed template — ' +
        'placing hours against the peak and the work the day demands, ' +
        'within budget, labour-law, and fairness constraints, and flexing ' +
        'checkout and floor coverage to the traffic curve.',
      boundary:
        'It forecasts demand and proposes the schedule; the store manager ' +
        'reviews and owns the published schedule. It cannot schedule ' +
        'below labour-law floors or below the coverage safe operation ' +
        'requires.',
      humanAccountabilityPoint:
        'The store manager accountable for the schedule, store coverage, ' +
        'and the labour budget.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'unified_task_orchestration_layer',
      name: 'Unified task-orchestration layer',
      description:
        'A pattern that funnels every task pushed to the store through ' +
        'one orchestration layer — costing it in hours, sequencing it ' +
        'against the schedule and traffic, routing it to the right ' +
        'associate, and tracking completion — so the store works the ' +
        'highest-value work first and the home office sees true execution.',
      boundary:
        'It sequences, routes, and tracks tasks; the store manager owns ' +
        'the priority calls and customer service always pre-empts a ' +
        'queued task. It does not push more work than the costed hours ' +
        'can hold.',
      humanAccountabilityPoint:
        'The director of store operations accountable for the task load ' +
        'pushed to stores and its feasibility.',
      controlPosture: 'human-on-the-loop',
    },
    {
      key: 'sense_and_replenish_shelf_layer',
      name: 'Sense-and-replenish shelf layer',
      description:
        'A pattern that continuously senses the shelf — through vision, ' +
        'sensors, or mobile capture — detects on-shelf gaps, misplacement, ' +
        'and low stock, prioritises by sales velocity, and converts each ' +
        'detection into a replenishment task before the customer finds ' +
        'the hole, closing the loop from shelf state to floor action.',
      boundary:
        'It senses and raises prioritised tasks; an associate verifies ' +
        'and works each one. It does not move stock itself and a detection ' +
        'is verified before it consumes labour.',
      humanAccountabilityPoint:
        'The store operations and merchandising lead accountable for ' +
        'on-shelf availability.',
      controlPosture: 'human-on-the-loop',
      relatedCanonicalPatternId: 'analytics_modernization',
    },
    {
      key: 'continuous_loss_intelligence_pattern',
      name: 'Continuous loss-intelligence pattern',
      description:
        'A pattern that monitors POS exceptions, inventory movements, ' +
        'self-checkout events, and refund patterns continuously between ' +
        'physical counts, detects loss early, attributes it to an ' +
        'identified cause, and feeds a prioritised, governed investigation ' +
        'queue to the loss-prevention team.',
      boundary:
        'It detects, attributes, and prioritises; a loss-prevention ' +
        'professional owns every case and any accusation. A flag is a ' +
        'signal to investigate, never a finding.',
      humanAccountabilityPoint:
        'The loss-prevention director accountable for shrink and the ' +
        'integrity of every investigation.',
      controlPosture: 'human-in-the-loop',
    },
    {
      key: 'connected_associate_pattern',
      name: 'Connected-associate pattern',
      description:
        'A pattern that equips every store associate with a handheld ' +
        'assistant grounded in the retailer’s own product, inventory, ' +
        'promotion, and process data — so a new associate can answer a ' +
        'customer, locate stock, and follow a procedure as well as an ' +
        'experienced one, with escalation when the answer is outside ' +
        'grounded knowledge.',
      boundary:
        'It informs and guides the associate, who owns the customer ' +
        'conversation. It answers only from grounded current data and ' +
        'escalates rather than improvising.',
      humanAccountabilityPoint:
        'The store-experience and training lead accountable for ' +
        'front-line capability and service consistency.',
      controlPosture: 'human-in-the-loop',
    },
  ],

  // ── Layer 5 — Value model ─────────────────────────────────────────────────
  valueModel: {
    valueRealizationNarrative:
      'Store-operations value is realised in three connected ways and a ' +
      'forecast must keep them distinct. First, labour productivity: ' +
      'demand-driven scheduling and task orchestration place the same or ' +
      'fewer hours where conversion and execution actually need them — a ' +
      'recurring gain that shows up as a better sales-per-labour-hour and ' +
      'a labour cost held to its band, not simply a payroll cut. Second, ' +
      'captured sales: closing the on-shelf-availability gap, flexing ' +
      'checkout to the peak, and a more capable front line convert demand ' +
      'the store was already losing to empty shelves, long queues, and ' +
      'unhelpful service — recurring revenue at little added cost. Third, ' +
      'protected margin: earlier, attributed shrink detection recovers ' +
      'inventory loss before it compounds. The dominant constraint is ' +
      'that store-operations value is realised by thousands of ' +
      'associates and store managers executing differently every shift — ' +
      'so the gain is paced by adoption and by the consistency of ' +
      'execution across the fleet, and a forecast must be read against ' +
      'the retailer’s store-management capability and turnover, not a ' +
      'model-perfect store. All three levers are recurring once realised, ' +
      'but they compound only at the speed the fleet actually changes how ' +
      'it works.',
    dominantHaircutFactors: [
      {
        factor: 'Fleet adoption and execution consistency',
        rationale:
          'Every store-operations gain depends on store managers and ' +
          'associates actually working to the new schedule, task plan, ' +
          'and shelf signal — across hundreds of stores with high ' +
          'turnover. Inconsistent adoption across the fleet is the single ' +
          'largest reason the modelled gain is only partly realised.',
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            'The share of a modelled store-operations gain not realised ' +
            'because of uneven adoption and execution across the store ' +
            'fleet; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Traffic- and task-forecast accuracy',
        rationale:
          'Scheduling, checkout coverage, and task sequencing all rest on ' +
          'a traffic and task-load forecast. Weather, local events, and ' +
          'trend breaks make store-level demand volatile, so forecast ' +
          'error caps how much of the modelled scheduling and coverage ' +
          'gain is actually reachable.',
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis:
            'Value erosion from store-level traffic and task-forecast ' +
            'error; a planning range widening with demand volatility.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Data and sensing readiness',
        rationale:
          'On-shelf-availability detection, loss intelligence, and the ' +
          'associate assistant depend on traffic counters, shelf sensing ' +
          'or imagery, accurate perpetual inventory, and clean product ' +
          'and policy data. Missing sensing infrastructure and unreliable ' +
          'inventory records cap how much of the modelled value can be ' +
          'delivered.',
        typicalHaircut: {
          low: 0.1,
          high: 0.3,
          basis:
            'Forecast erosion from missing in-store sensing and ' +
            'inaccurate inventory and product data; a planning range.',
          label: 'planning-range',
        },
      },
      {
        factor: 'Labour-law and scheduling constraints',
        rationale:
          'Predictable-scheduling and fair-workweek law, minimum-hours ' +
          'commitments, availability, and any collective-bargaining terms ' +
          'bound how freely the schedule can be optimised. Those ' +
          'constraints are non-negotiable and limit how far the modelled ' +
          'labour gain can move.',
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            'The share of a modelled labour-optimisation gain bounded by ' +
            'predictable-scheduling law and contractual constraints; a ' +
            'planning range.',
          label: 'planning-range',
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: 'Store labour-productivity improvement',
        range: {
          low: 3,
          high: 12,
          basis:
            'Relative improvement in sales per labour hour from ' +
            'demand-driven scheduling and task orchestration; a planning ' +
            'range spanning early and mature adoption.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent improvement in net sales per worked labour ' +
          'hour.',
      },
      {
        lever: 'Sales lift from improved on-shelf availability',
        range: {
          low: 1,
          high: 5,
          basis:
            'Relative net-sales lift from closing the on-shelf-' +
            'availability gap on product the store already holds; a ' +
            'planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent change in net sales for the affected ' +
          'categories.',
      },
      {
        lever: 'Conversion-rate uplift',
        range: {
          low: 1,
          high: 4,
          basis:
            'Percentage-point uplift in conversion from better peak ' +
            'coverage, shorter checkout wait, and a more capable front ' +
            'line; a planning range.',
          label: 'planning-range',
        },
        measuredAs:
          'Percentage-point change in the share of visits ending in a ' +
          'transaction.',
      },
      {
        lever: 'Shrink-rate reduction',
        range: {
          low: 5,
          high: 25,
          basis:
            'Relative reduction in the shrink rate from earlier, ' +
            'attributed loss detection and intervention; a planning ' +
            'range.',
          label: 'planning-range',
        },
        measuredAs:
          'Relative percent reduction in shrink as a share of net sales.',
      },
    ],
    timeToValueBand:
      '2–4 months to a first operational signal in a pilot store group ' +
      '(scheduling fit, task completion, on-shelf availability); 9–18 ' +
      'months to a settled fleet-wide result, because the labour, ' +
      'execution, and conversion gains only prove out once the schedule ' +
      'and task disciplines are adopted consistently across hundreds of ' +
      'stores and a full seasonal traffic cycle has run.',
  },

  // ── Layer 6 — Vocabulary & entities ───────────────────────────────────────
  vocabulary: {
    systemsOfRecord: [
      {
        name: 'Workforce-management (WFM) system',
        role:
          'The system of record for store labour — the demand forecast, ' +
          'the schedule, time and attendance, and labour-budget tracking. ' +
          'The backbone of every scheduling, adherence, and labour-cost ' +
          'metric.',
        examples: [
          'UKG / Kronos workforce management',
          'Legion WFM',
          'Blue Yonder workforce management',
          'Reflexis (Zebra) workforce management',
        ],
      },
      {
        name: 'Point-of-sale (POS) and transaction system',
        role:
          'Captures every transaction, basket, void, refund, and discount ' +
          '— the source of sales, conversion, units per transaction, and ' +
          'the exception data shrink detection runs on.',
        examples: [
          'Oracle Retail Xstore',
          'NCR Voyix POS',
          'Toshiba Commerce POS',
          'cloud-native POS platforms',
        ],
      },
      {
        name: 'Store task-management and execution system',
        role:
          'Holds the task list pushed to stores, assignments, and ' +
          'completion tracking — the layer where merchandising and ' +
          'operations work reaches the floor.',
        examples: [
          'Reflexis (Zebra) task management',
          'Zipline store execution',
          'YOOBIC frontline execution',
          'in-house task platforms',
        ],
      },
      {
        name: 'Traffic-counting and store-sensing system',
        role:
          'Counts door traffic, measures queues and dwell, and — where ' +
          'deployed — provides shelf and floor imagery; the demand and ' +
          'on-shelf-availability signal for scheduling and execution.',
        examples: [
          'door-traffic counters',
          'queue-measurement sensors',
          'shelf cameras and computer-vision platforms',
        ],
      },
      {
        name: 'Loss-prevention and exception-reporting system',
        role:
          'Holds POS and inventory exception analytics, case management, ' +
          'and investigation records — the source of shrink attribution ' +
          'and the loss-intelligence queue.',
        examples: [
          'Appriss Retail / Secure exception reporting',
          'Zebra / Reflexis loss-prevention analytics',
          'in-house exception-analytics platforms',
        ],
      },
      {
        name: 'Merchandising / inventory and space-planning systems',
        role:
          'Hold the perpetual inventory, the active assortment, and the ' +
          'planograms — the reference state on-shelf-availability and ' +
          'planogram-compliance are measured against.',
        examples: [
          'Oracle Retail Merchandising',
          'Blue Yonder space planning',
          'enterprise inventory-management systems',
        ],
      },
    ],
    roles: [
      {
        title: 'Chief Stores Officer / EVP Store Operations',
        accountability:
          'Owns the total store-operations strategy, the store P&L across ' +
          'the fleet, and the labour, execution, and customer-experience ' +
          'outcome.',
      },
      {
        title: 'Regional / district manager',
        accountability:
          'Owns the performance of a group of stores — their sales, ' +
          'labour, execution consistency, and the development of store ' +
          'managers.',
      },
      {
        title: 'Store manager',
        accountability:
          'Owns a single store — the schedule, the labour budget, task ' +
          'execution, shrink, the customer experience, and the store ' +
          'team.',
      },
      {
        title: 'Assistant / department manager',
        accountability:
          'Owns a department or shift — floor coverage, replenishment and ' +
          'reset execution, and the associates on it.',
      },
      {
        title: 'Store-operations / labour-analytics leader',
        accountability:
          'Owns the labour model, the scheduling standards and labour ' +
          'budget, and the productivity and task-completion analytics ' +
          'across the fleet.',
      },
      {
        title: 'Loss-prevention / asset-protection manager',
        accountability:
          'Owns shrink, the exception-analytics and investigation ' +
          'process, and the physical-security and safe-operation posture ' +
          'of the store.',
      },
    ],
    regulatoryFrames: [
      {
        name: 'Predictable-scheduling and fair-workweek laws',
        relevance:
          'Set advance-notice, minimum-hours, rest-between-shift, and ' +
          'predictability-pay requirements for hourly retail staff — hard ' +
          'constraints any labour-scheduling optimisation must respect.',
      },
      {
        name: 'Wage-and-hour and overtime regulation',
        relevance:
          'Governs minimum wage, overtime eligibility, break and meal ' +
          'rules, and worked-hours recording — the legal frame around ' +
          'the schedule, time and attendance, and premium pay.',
      },
      {
        name: 'Workplace health, safety, and security regulation',
        relevance:
          'Sets occupational-safety, emergency-staffing, and ' +
          'lone-worker requirements — a floor on store coverage that ' +
          'scheduling can never optimise below.',
      },
      {
        name: 'Surveillance, privacy, and consumer-data rules',
        relevance:
          'Govern in-store cameras, vision systems, queue sensing, and ' +
          'any customer or associate data captured — the frame that ' +
          'bounds on-shelf-availability vision and loss-detection ' +
          'deployments.',
      },
      {
        name: 'Collective-bargaining agreements',
        relevance:
          'Where store staff are represented, set scheduling, seniority, ' +
          'and assignment rules — non-negotiable constraints the labour ' +
          'and task models operate inside.',
      },
    ],
    canonicalTerms: [
      {
        term: 'Sales per labour hour (SPLH)',
        definition:
          'Net sales generated per worked store labour hour — the core ' +
          'productivity measure of the store labour model.',
      },
      {
        term: 'Conversion rate',
        definition:
          'The share of counted store visits that end in a transaction ' +
          '— the read on whether the store turns traffic into sales.',
      },
      {
        term: 'On-shelf availability (OSA)',
        definition:
          'The share of assortment SKUs physically present and shoppable ' +
          'on the shelf — distinct from system in-stock, which can show ' +
          'stock the customer cannot find.',
      },
      {
        term: 'Shrink',
        definition:
          'Inventory lost to theft, fraud, administrative error, and ' +
          'damage — the gap between book and physically counted ' +
          'inventory.',
      },
      {
        term: 'Planogram compliance',
        definition:
          'The degree to which the actual shelf set matches the approved ' +
          'planogram — placement, facings, and adjacencies.',
      },
      {
        term: 'Daypart',
        definition:
          'A defined block of the trading day — morning, midday, evening ' +
          '— used as the unit for traffic forecasting and labour ' +
          'scheduling.',
      },
      {
        term: 'Task load',
        definition:
          'The total set of operational tasks pushed to a store for a ' +
          'period — replenishment, resets, price changes, audits, ' +
          'freight, picking — costed in labour hours.',
      },
      {
        term: 'Units per transaction (UPT)',
        definition:
          'The average number of units sold per completed transaction — ' +
          'the store’s basket-building measure.',
      },
    ],
  },

  // ── Layer 7 — Deliverable outlines ────────────────────────────────────────
  deliverableOutlines: [
    {
      artifact: 'discover_brief',
      label: 'Store-Operations Discover Brief',
      phase: 'Discover',
      purpose:
        'Diagnose where the store operation is over-spending labour and ' +
        'where it is under-executing — scheduling, task completion, ' +
        'on-shelf availability, checkout, shrink — with baseline ' +
        'evidence, before a solution is shaped.',
      sections: [
        {
          heading: 'Store fleet and operating context',
          guidance:
            'Name the store fleet in scope — formats, regions, headcount ' +
            'and turnover, the labour operating model, and the ' +
            'omnichannel demands placed on stores. State which WFM, POS, ' +
            'task-management, traffic-sensing, and loss-prevention systems ' +
            'are in use.',
        },
        {
          heading: 'Baseline performance against the operating metrics',
          guidance:
            'Report the current value for each operating metric the ' +
            'function expects — sales per labour hour, conversion, ' +
            'shrink, on-shelf availability, task completion, checkout ' +
            'wait, planogram compliance, schedule adherence, store NPS, ' +
            'units per transaction, known-loss share, labour cost percent. ' +
            'For any metric not recorded, name it as a precise seed gap ' +
            'with its expected data source.',
        },
        {
          heading: 'Labour and scheduling diagnostic',
          guidance:
            'Analyse how the schedule is built, how coverage tracks the ' +
            'traffic and task-load curve by daypart, where hours are idle ' +
            'and where the store is short, and how schedule adherence and ' +
            'labour cost compare to the band.',
        },
        {
          heading: 'Execution and availability diagnostic',
          guidance:
            'Analyse task-completion and planogram-compliance across the ' +
            'fleet, the gap between system in-stock and audited on-shelf ' +
            'availability, checkout congestion at peak, and shrink and ' +
            'its identified-cause share.',
        },
        {
          heading: 'Diagnosed pain themes',
          guidance:
            'Walk the function pain themes — flat-template scheduling, ' +
            'task overload and invisibility, phantom inventory and the ' +
            'OSA gap, reactive shrink, checkout congestion, execution ' +
            'inconsistency across the fleet, manager admin drag, the ' +
            'front-line knowledge gap — and state which are present, with ' +
            'the detection signal and supporting evidence.',
        },
        {
          heading: 'Value-at-stake hypothesis',
          guidance:
            'Frame the size of the opportunity using the value-model ' +
            'benchmark ranges — labour productivity, captured sales, ' +
            'conversion uplift, shrink reduction — explicitly haircut by ' +
            'fleet adoption, forecast accuracy, sensing readiness, and ' +
            'labour-law constraints. Every figure a labelled planning ' +
            'range.',
        },
        {
          heading: 'Evidence gaps and asks',
          guidance:
            'List the specific data the diagnosis still needs, who owns ' +
            'each source, and what each gap blocks. A missing metric — ' +
            'audited OSA, costed task load — is a named ask, not a vague ' +
            'unknown.',
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
      label: 'Store-Operations Business Case',
      phase: 'Design & Plan',
      purpose:
        'Make the costed, CFO-readable case for funding a store-' +
        'operations AI Move on this fleet — baseline, forecast, cost, and ' +
        'the honest downside.',
      sections: [
        {
          heading: 'Executive answer',
          guidance:
            'State the funding ask, the headline value separated into ' +
            'recurring labour productivity, captured sales, and protected ' +
            'margin, the time-to-value band, and the go / hold ' +
            'recommendation in one read.',
        },
        {
          heading: 'Baseline model',
          guidance:
            'Anchor every value claim to a measured baseline operating ' +
            'metric — sales per labour hour, conversion, on-shelf ' +
            'availability, shrink, labour cost percent. Where a baseline ' +
            'is a seed gap (audited OSA and a costed task load are common ' +
            'ones), say so and state what closing it requires before ' +
            'funding.',
        },
        {
          heading: 'Value forecast and haircuts',
          guidance:
            'Build the forecast from the value-model benchmark ranges, ' +
            'then apply each dominant haircut factor — fleet adoption, ' +
            'forecast accuracy, sensing readiness, labour-law constraints ' +
            '— explicitly and show the haircut math. Keep recurring ' +
            'labour, sales, and shrink gains distinct.',
        },
        {
          heading: 'Cost and effort',
          guidance:
            'Cost the build, the integration to the WFM, POS, ' +
            'task-management, traffic-sensing, and loss-prevention ' +
            'systems, any in-store sensing hardware, and the operating-' +
            'model change — store-manager and associate workflow.',
        },
        {
          heading: 'Sensitivity and downside',
          guidance:
            'Show how the case moves under weaker fleet adoption, ' +
            'partial sensing coverage, and a high-volatility traffic ' +
            'pattern. State the downside the CFO is underwriting.',
        },
        {
          heading: 'Kill criteria and conditions to proceed',
          guidance:
            'Name the conditions under which the Move should not be ' +
            'funded — for example traffic-sensing absent or inventory ' +
            'records too inaccurate to model OSA — and the evidence that ' +
            'must be in hand before the gate.',
        },
        {
          heading: 'Tower measurement plan',
          guidance:
            'State exactly which operating metrics Tower will track to ' +
            'prove the forecast, and the measurement cadence, including ' +
            'the lagged conversion, store-NPS, and shrink metrics.',
        },
      ],
    },
    {
      artifact: 'solution_architecture',
      label: 'Store-Operations Solution Architecture Pack',
      phase: 'Design & Plan',
      purpose:
        'Define the target-state architecture and operating model for the ' +
        'store-operations AI capability, grounded in the function ' +
        'reference patterns, the safety floors, and the labour-law frame.',
      sections: [
        {
          heading: 'Target-state architecture',
          guidance:
            'Lay out the architecture against the function reference ' +
            'patterns — demand-driven store labour model, unified task-' +
            'orchestration layer, sense-and-replenish shelf layer, ' +
            'continuous loss-intelligence, connected associate — and ' +
            'state which apply and how they connect.',
        },
        {
          heading: 'Data and sensing architecture',
          guidance:
            'Specify the WFM, POS, task-management, traffic-sensing, ' +
            'loss-prevention, and inventory integrations, any in-store ' +
            'camera and sensor deployment, data freshness, and the ' +
            'inventory-accuracy discipline the use cases depend on.',
        },
        {
          heading: 'AI use-case design and control posture',
          guidance:
            'For each archetype in scope, specify the value mechanism, ' +
            'the control posture, the human accountability point, and how ' +
            'a store manager reviews and overrides. Define the safe-' +
            'coverage and labour-law floors as hard constraints and the ' +
            'verification step before a vision detection consumes labour.',
        },
        {
          heading: 'Operating-model change',
          guidance:
            'Define how store-manager, associate, and loss-prevention ' +
            'workflows change, how the scheduling and task cadence is ' +
            'reshaped, how managers are freed back to the floor, and who ' +
            'owns each change.',
        },
        {
          heading: 'Responsible-AI, safety, and labour-law controls',
          guidance:
            'State the predictable-scheduling and safe-coverage floors, ' +
            'the privacy and surveillance governance for vision and ' +
            'loss-detection, the due-process and bias controls on any ' +
            'employee-facing flag, and the regulatory frames (fair-' +
            'workweek law, wage-and-hour, workplace safety, surveillance ' +
            'rules) that bound the design.',
        },
        {
          heading: 'Integration and rollout approach',
          guidance:
            'Describe the build sequence, the integration patterns to the ' +
            'store-systems stack, and the phased rollout by store group ' +
            'and format.',
        },
      ],
    },
    {
      artifact: 'mobilization_plan',
      label: 'Store-Operations Mobilization Plan',
      phase: 'Mobilize',
      purpose:
        'Plan the launch and adoption of the store-operations AI ' +
        'capability so value reaches store productivity and the customer ' +
        'experience across the fleet, not just the dashboard.',
      sections: [
        {
          heading: '30 / 60 / 90-day plan',
          guidance:
            'Sequence the launch — integration and data validation, a ' +
            'pilot store group, store-manager and associate onboarding, ' +
            'scale across the fleet — with milestones tied to the ' +
            'operating metrics.',
        },
        {
          heading: 'RACI and accountable owners',
          guidance:
            'Name the accountable owner for every workstream — ' +
            'integrations, sensing and inventory-data readiness, store-' +
            'manager and associate adoption, loss-prevention process, ' +
            'Tower measurement.',
        },
        {
          heading: 'Store-manager and associate adoption approach',
          guidance:
            'Define the change runway for store managers and associates ' +
            '— training, the shift in the scheduling and task workflow, ' +
            'and the move of manager time back to the floor — and how ' +
            'adoption is measured across the fleet, not assumed.',
        },
        {
          heading: 'Fleet-wide execution-consistency plan',
          guidance:
            'Define how execution is measured consistently across stores, ' +
            'how lagging stores are identified and supported, and how ' +
            'best-store practice is spread — the discipline that turns a ' +
            'pilot result into a fleet result.',
        },
        {
          heading: 'Tower handoff and measurement',
          guidance:
            'Hand the operating-metric measurement plan to Tower with ' +
            'baselines, targets as planning ranges, and the cadence for ' +
            'each metric, including the lagged conversion, store-NPS, and ' +
            'shrink metrics.',
        },
        {
          heading: 'Risk and escalation register',
          guidance:
            'Carry the live risks — uneven fleet adoption, traffic-' +
            'forecast error, sensing-data gaps, labour-law friction, ' +
            'store-manager change capacity — with the escalation owner ' +
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
      claim: 'Store labour productivity and how hours are spent',
      authoritativeSource:
        'The workforce-management system for scheduled and worked hours, ' +
        'joined to POS net sales and the costed task load by daypart.',
      whatGoodEvidenceLooksLike:
        'Sales per labour hour and labour cost percent measured by ' +
        'daypart against the traffic and task-load curve, exposing where ' +
        'hours are idle and where coverage is short.',
      weakEvidenceToReject:
        'A blended store-wide labour-cost percentage with no daypart ' +
        'breakdown, or a productivity figure that cannot be set against ' +
        'the traffic the store actually received.',
    },
    {
      claim: 'On-shelf availability — as distinct from system in-stock',
      authoritativeSource:
        'Shelf audits and vision-system scans compared against the ' +
        'perpetual inventory and the planogram in the merchandising ' +
        'system.',
      whatGoodEvidenceLooksLike:
        'A physically verified on-shelf-availability rate for the active ' +
        'assortment, with the gap to system in-stock quantified and ' +
        'backroom-stranded stock identified.',
      weakEvidenceToReject:
        'A system in-stock figure presented as shelf availability, with ' +
        'no physical audit and no account of stock on hand but not ' +
        'shoppable.',
    },
    {
      claim: 'Conversion and the traffic the store turns into sales',
      authoritativeSource:
        'Door-traffic counters reconciled against POS transaction counts ' +
        'by store and daypart.',
      whatGoodEvidenceLooksLike:
        'A conversion rate computed from validated traffic counts against ' +
        'transactions, broken down by daypart so peak-window conversion ' +
        'loss is visible.',
      weakEvidenceToReject:
        'A conversion figure based on an unvalidated or estimated traffic ' +
        'count, or a store-wide average that hides the peak-hour ' +
        'shortfall.',
    },
    {
      claim: 'Shrink and what is driving it',
      authoritativeSource:
        'Physical and cycle counts reconciled against book inventory, ' +
        'with the loss-prevention exception and case-management system.',
      whatGoodEvidenceLooksLike:
        'A shrink rate with the identified-cause share quantified — ' +
        'confirmed theft, fraud, and process error separated from ' +
        'unexplained loss — and traced to store and category.',
      weakEvidenceToReject:
        'A single chain-wide shrink number known only at physical-count ' +
        'time, with no attribution and no early-detection signal.',
    },
    {
      claim: 'The forecast value of a store-operations AI Move',
      authoritativeSource:
        'The value model — labour-productivity, captured-sales, and ' +
        'protected-margin components, each haircut by its dominant ' +
        'factors — read against the fleet’s store-management capability ' +
        'and turnover.',
      whatGoodEvidenceLooksLike:
        'A forecast built from measured baselines, with each haircut ' +
        'factor applied explicitly, recurring labour, sales, and shrink ' +
        'gains kept distinct, and every figure a labelled planning ' +
        'range.',
      weakEvidenceToReject:
        'A single-point savings number, a vendor ROI claim taken at face ' +
        'value, or a forecast that ignores the fleet-adoption and ' +
        'execution-consistency haircuts.',
    },
  ],
};
