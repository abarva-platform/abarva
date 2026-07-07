// Consilium expert — Retail Store Operations & Associate Productivity (industry-function).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). An industry-function
// expert for the STORE EXECUTION layer of retail: labor scheduling and demand-
// based staffing, task management and in-store execution/compliance, shrink and
// loss prevention at the store, associate productivity and enablement, checkout/
// queue and self-checkout, planogram/on-shelf execution, and in-store customer
// service. Product-aware (workforce-management, task-management, LP analytics,
// queue/checkout), not product-locked.
//
// DISTINCT from two neighbors this expert deliberately does NOT cover:
//   - Retail Merchandising & Pricing (assortment, price/markdown, demand
//     forecasting at SKU) — that expert sets WHAT goes on the shelf and at what
//     price; this expert owns whether the shelf, the label, and the associate
//     EXECUTE it consistently across hundreds of stores.
//   - The cross-cutting future-of-work / workforce-economics expert — that one
//     reasons about labor models across industries; this one is the retail
//     store floor specifically.
//
// CORE HONESTY — LABOR COST + TURNOVER DOMINATE, AND CONSISTENCY IS THE HARD
// PART. Store labor is the single largest controllable store-operating expense,
// and hourly associate turnover routinely runs at or above 60% a year, so every
// productivity gain is in a race against re-staffing and re-training cost. The
// real difficulty is NOT designing a good process — it is EXECUTING it
// identically across a long tail of stores run by different managers with
// different local realities. Variance across stores, not the average, is where
// the money leaks: the best-quartile store and the worst-quartile store run the
// same planogram and the same labor model to wildly different results. Every
// value claim here is hedged against (1) the schedule-to-execution gap (a good
// labor plan that store managers override), (2) execution variance across the
// fleet, and (3) the constraint that labor-law (predictive scheduling, breaks,
// minor rules) and union/works-council rules cap how aggressively labor can be
// optimized.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const retailStoreOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.retail.store-operations",
    expertName: "Retail Store Operations & Associate Productivity Expert",
    kind: "industry-function",
    industry: "retail",
    functionKey: "store-operations",
    scopeNote:
      "The store-execution layer of retail: labor scheduling and demand-based " +
      "staffing, task management and in-store execution/compliance (resets, " +
      "audits, directives), shrink and loss prevention at the store, associate " +
      "productivity, onboarding and enablement, checkout/queue and self-checkout " +
      "operations, planogram and on-shelf execution, and in-store customer " +
      "service. Owns whether what merchandising decides actually happens on the " +
      "floor, consistently, across the whole fleet. Excludes assortment, price, " +
      "and SKU-level demand forecasting (the Merchandising & Pricing expert), " +
      "DC/supply-chain logistics, e-commerce/digital storefront, and cross-" +
      "industry workforce strategy (the future-of-work expert). The honest " +
      "center of gravity is labor cost, associate turnover, and execution " +
      "consistency across stores — not the single-store average.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "sales_per_labor_hour",
        name: "Sales per labor hour (SPLH)",
        definition:
          "Net store sales divided by total paid associate labor hours over the " +
          "period; the headline labor-productivity unit on the store floor.",
        unit: "USD / labor hour",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 100,
          high: 400,
          basis:
            "Highly format-dependent (grocery/big-box low per-hour, specialty/" +
            "apparel high); tracked as a trend and against same-format peers, " +
            "not as an absolute; operator experience",
          label: "planning-range",
        },
        dataSource:
          "POS net sales joined to workforce-management paid hours by store/day/" +
          "department",
        whyItMatters:
          "The single number that ties the largest controllable store expense " +
          "to output. Because labor dominates store operating cost, a small SPLH " +
          "improvement held across the fleet is worth more than most merchandising " +
          "wins — but it must be earned by matching labor to traffic, not by " +
          "under-staffing into lost sales and service collapse.",
      },
      {
        key: "labor_cost_pct_sales",
        name: "Labor cost % of sales",
        definition:
          "Total store labor cost (wages, premium/overtime, benefits load) as a " +
          "percentage of net sales for the period.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 8,
          high: 20,
          basis:
            "Format-dependent (grocery lower, service-heavy/specialty higher); " +
            "in-range because too low signals understaffing and lost sales, too " +
            "high erodes thin retail margin",
          label: "planning-range",
        },
        dataSource:
          "Payroll/WFM labor cost over POS net sales by store/period",
        whyItMatters:
          "The constraint every other store-ops lever runs into. It is the " +
          "metric the CFO watches, and it is in-range not lower-is-better: cutting " +
          "labor past the point where service, availability, and shrink controls " +
          "hold destroys more value than it saves. The art is the right hours in " +
          "the right place, not fewer hours.",
      },
      {
        key: "associate_turnover_rate",
        name: "Associate turnover rate (annualized)",
        definition:
          "Annualized rate at which hourly store associates leave (voluntary + " +
          "involuntary) as a percentage of average headcount; often split into " +
          "90-day early attrition.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 40,
          high: 100,
          basis:
            "Hourly retail turnover commonly runs 60%+ annually and far higher " +
            "in the first 90 days; varies by wage position, labor market, and " +
            "management quality",
          label: "planning-range",
        },
        dataSource:
          "HRIS/WFM termination and headcount records by store, with tenure " +
          "buckets",
        whyItMatters:
          "Turnover is the silent tax on every productivity program. Each exit " +
          "carries rehire and retraining cost and drags a new associate down the " +
          "learning curve, so high turnover caps task-completion, service, and " +
          "shrink-control quality no matter how good the process is. It is the " +
          "honest reason store-ops gains are hard to hold.",
      },
      {
        key: "schedule_adherence",
        name: "Schedule adherence",
        definition:
          "Share of scheduled labor that is actually worked as planned — clock-" +
          "in/out matching the schedule, net of no-shows, swaps, and unplanned " +
          "overtime.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 95,
          basis:
            "Gap to 100% reflects no-shows, call-outs, unapproved swaps, and " +
            "manager off-plan staffing; varies by workforce stability",
          label: "planning-range",
        },
        dataSource:
          "WFM scheduled vs actual worked hours by associate/shift/store",
        whyItMatters:
          "The bridge between a good labor PLAN and what actually happens. A " +
          "demand-matched schedule creates zero value if managers and associates " +
          "do not run it; low adherence is the first sign the schedule-to-" +
          "execution gap is eating the labor-optimization prize.",
      },
      {
        key: "task_completion_rate",
        name: "Task completion rate (on-time)",
        definition:
          "Share of assigned in-store tasks (resets, audits, price changes, " +
          "directives, replenishment) completed on time and verified.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "On-time, verified completion; the gap reflects over-tasking, time " +
            "starvation, and unverified self-report; varies by task-management " +
            "maturity",
          label: "planning-range",
        },
        dataSource:
          "Task-management system: assigned vs completed-and-verified tasks by " +
          "store/period",
        whyItMatters:
          "What turns corporate directives into shelf reality. Low or unverified " +
          "completion is how planogram resets, price changes, and compliance " +
          "directives silently fail in the back half of the fleet — the variance " +
          "that separates the best and worst stores running the same plan.",
      },
      {
        key: "shrink_rate",
        name: "Shrink rate",
        definition:
          "Inventory loss from theft (external/internal), fraud, process error, " +
          "and damage as a percentage of net sales, measured at the store.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 3,
          basis:
            "Retail shrink commonly runs ~1.5-2% of sales and higher in exposed " +
            "categories/formats; self-checkout and organized retail crime push " +
            "the high end",
          label: "planning-range",
        },
        dataSource:
          "Physical/cycle counts vs book inventory, plus LP exception and POS " +
          "void/refund analytics by store",
        whyItMatters:
          "Direct, controllable margin loss owned at the store. On thin retail " +
          "margins a half-point of shrink can equal a meaningful share of store " +
          "profit, and a large slice is internal/process — exactly the part " +
          "store-level controls, audits, and analytics can move.",
      },
      {
        key: "on_shelf_availability",
        name: "On-shelf availability (OSA)",
        definition:
          "Share of intended SKU/store facings that are actually present, " +
          "shoppable, and correctly placed on the shelf during selling hours.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 92,
          high: 98,
          basis:
            "On-shelf availability targets; below ~95% phantom-stockout lost " +
            "sales grow sharply even when inventory exists in the building",
          label: "planning-range",
        },
        dataSource:
          "Shelf audits / image-recognition vs planogram, reconciled to on-hand " +
          "inventory by SKU/store",
        whyItMatters:
          "The execution check on the store: inventory can exist in the back " +
          "room and still be a lost sale if it is not on the shelf. OSA is where " +
          "merchandising's plan meets the store's labor and process — a phantom " +
          "stockout is an execution failure, not a buying failure.",
      },
      {
        key: "planogram_compliance",
        name: "Planogram compliance",
        definition:
          "Share of audited shelves/fixtures where actual product placement, " +
          "facings, and pricing match the approved planogram and reset directive.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 75,
          high: 95,
          basis:
            "Audited match-to-planogram; the gap reflects unexecuted resets, " +
            "local overrides, and out-of-stock holes; varies by audit rigor",
          label: "planning-range",
        },
        dataSource:
          "Shelf audits or shelf-image recognition compared to the approved " +
          "planogram by store/category",
        whyItMatters:
          "Compliance is where merchandising and vendor agreements turn into " +
          "actual on-floor reality — or do not. Low or fleet-variable compliance " +
          "quietly breaks promotions, vendor commitments, and the assortment the " +
          "merchants paid to design.",
      },
      {
        key: "checkout_queue_time",
        name: "Checkout / queue wait time",
        definition:
          "Average customer wait time in the checkout queue (staffed and self-" +
          "checkout) during the selling day, often tracked against peak windows.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 5,
          basis:
            "Wait-time tolerance is format-dependent; beyond a few minutes " +
            "abandonment and satisfaction loss rise sharply, especially at peak",
          label: "planning-range",
        },
        dataSource:
          "Queue analytics / POS transaction-timing and traffic sensors by " +
          "store/daypart",
        whyItMatters:
          "The most visible service failure and a direct driver of basket " +
          "abandonment and dissatisfaction. Queue time is the sharpest test of " +
          "whether labor was scheduled to actual traffic — the exact thing " +
          "demand-based scheduling exists to fix.",
      },
      {
        key: "conversion_rate",
        name: "In-store conversion rate",
        definition:
          "Share of store visitors (traffic) who make a purchase, computed from " +
          "door/traffic counts against transactions.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Strongly format-dependent (grocery very high, specialty/big-ticket " +
            "lower); tracked as a trend and against format peers",
          label: "planning-range",
        },
        dataSource:
          "Traffic counters joined to POS transactions by store/daypart",
        whyItMatters:
          "Where service and execution show up in sales. Conversion falls when " +
          "the floor is understaffed at peak, queues are long, or product is not " +
          "on the shelf — it is the revenue consequence of the store-ops levers, " +
          "and the reason cutting labor too far is a false economy.",
      },
      {
        key: "units_per_transaction",
        name: "Units per transaction (UPT)",
        definition:
          "Average number of units (or basket value, when tracked as ATV) per " +
          "completed transaction.",
        unit: "units / transaction",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1.5,
          high: 4,
          basis:
            "Format- and category-dependent; lifted by service, attachment, and " +
            "in-stock adjacencies; tracked as a trend and vs peers",
          label: "planning-range",
        },
        dataSource:
          "POS transaction-level units/value per basket by store/associate",
        whyItMatters:
          "The associate-enablement and service lever on the floor. Trained, " +
          "available associates and well-executed adjacencies lift UPT without " +
          "discounting — the margin-friendly path to comp that store execution " +
          "(not pricing) owns.",
      },
      {
        key: "in_store_nps",
        name: "In-store customer satisfaction / NPS",
        definition:
          "Customer-reported satisfaction or net promoter score for the in-store " +
          "experience, captured at or after the visit by store.",
        unit: "score",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "NPS scales vary widely by retailer and method; tracked as a trend " +
            "and against same-format peers, not as an absolute",
          label: "planning-range",
        },
        dataSource:
          "Post-visit survey / feedback platform linked to store and, where " +
          "possible, daypart",
        whyItMatters:
          "The outcome customers actually feel — driven by staffing at peak, " +
          "queue time, availability, and associate competence. It is the leading " +
          "indicator of comp and loyalty, and the human check that labor cuts " +
          "have not hollowed out the experience.",
      },
    ],

    painThemes: [
      {
        key: "labor_not_matched_to_traffic",
        name: "Labor not matched to demand/traffic",
        description:
          "Schedules are built on fixed templates, sales budgets, or last year " +
          "rather than forecasted traffic and workload by daypart, so stores are " +
          "over-staffed in slow hours and under-staffed at peak — paying for idle " +
          "labor while losing sales to queues and an empty floor when it counts.",
        detectionSignal:
          "Flat staffing across very different traffic dayparts, queue spikes " +
          "and abandonment at peak, SPLH varying widely by daypart, no traffic-" +
          "or workload-based labor model.",
        diagnosticQuestion:
          "Is store labor scheduled to forecasted traffic and task workload by " +
          "daypart, or built on fixed templates and a sales-budget hours number?",
      },
      {
        key: "schedule_to_execution_gap",
        name: "Schedule-to-execution gap (manager override)",
        description:
          "A demand-matched schedule is produced centrally but store managers " +
          "override it, swaps and call-outs go unmanaged, and unplanned overtime " +
          "fills gaps — so the optimized labor plan that justified the investment " +
          "never actually runs on the floor.",
        detectionSignal:
          "Low schedule adherence, high last-minute edits and unplanned overtime, " +
          "large gap between WFM-scheduled and actually-worked hours, managers " +
          "distrusting the schedule tool.",
        diagnosticQuestion:
          "What is your schedule adherence, and how big is the gap between the " +
          "WFM schedule and the hours actually worked once managers adjust it?",
      },
      {
        key: "execution_variance_across_stores",
        name: "Execution variance across the fleet",
        description:
          "The same planogram, directive, and labor model produce very different " +
          "results store to store — best-quartile and worst-quartile stores run " +
          "identical plans to wildly different compliance, availability, and " +
          "service — because execution depends on individual managers and there " +
          "is no closed-loop visibility or coaching to compress the tail.",
        detectionSignal:
          "Wide store-to-store spread in planogram compliance, task completion, " +
          "OSA, and shrink that does not track demographics; the average looks " +
          "fine while the bottom quartile is failing.",
        diagnosticQuestion:
          "How wide is the spread between your best- and worst-executing stores " +
          "on compliance, availability, and task completion — and what closes it?",
      },
      {
        key: "over_tasking_time_starvation",
        name: "Over-tasking and time starvation",
        description:
          "Corporate functions push more tasks, audits, and directives to stores " +
          "than the scheduled labor can absorb, with no time-to-task budgeting, " +
          "so associates triage silently, self-report completion that did not " +
          "happen, and customer-facing time is the first casualty.",
        detectionSignal:
          "Task volume exceeding available labor hours, high unverified self-" +
          "reported completion, complaints of 'no time for customers', resets and " +
          "audits chronically late.",
        diagnosticQuestion:
          "Is task volume budgeted against available labor hours per store, or " +
          "do corporate teams push tasks with no time-to-task accounting?",
      },
      {
        key: "high_turnover_thin_training",
        name: "High turnover and thin onboarding/enablement",
        description:
          "Hourly turnover runs high (often 60%+), early (90-day) attrition is " +
          "worst, and onboarding/enablement is thin, so a large share of the " +
          "floor is perpetually low on the learning curve — capping productivity, " +
          "service, and compliance regardless of process design.",
        detectionSignal:
          "High annualized and 90-day turnover, long time-to-productivity for " +
          "new hires, training completed inconsistently, knowledge held in a few " +
          "tenured associates.",
        diagnosticQuestion:
          "What is your hourly turnover (and 90-day early attrition), and how " +
          "long until a new associate is fully productive?",
      },
      {
        key: "shrink_blind_spots",
        name: "Shrink and loss blind spots (incl. self-checkout)",
        description:
          "Shrink is found late at physical count rather than detected in near-" +
          "real-time, internal/process loss and self-checkout/return fraud are " +
          "under-instrumented, and LP attention is spread evenly instead of " +
          "concentrated on the highest-loss stores and behaviors.",
        detectionSignal:
          "Large unexplained shrink at count, no exception analytics on voids/" +
          "refunds/self-checkout, LP staffing not risk-weighted, rising organized-" +
          "retail-crime and self-checkout loss.",
        diagnosticQuestion:
          "Do you detect shrink and loss exceptions (internal, refund, self-" +
          "checkout) in near-real-time and risk-weight LP effort, or find it at " +
          "the physical count?",
      },
      {
        key: "compliance_visibility_gap",
        name: "Compliance and on-shelf visibility gap",
        description:
          "Corporate cannot see, in near-real-time, whether resets, price " +
          "changes, and directives actually executed and whether shelves are " +
          "full and compliant, relying on unverified self-report — so on-shelf " +
          "availability and planogram compliance degrade invisibly in the tail " +
          "of the fleet.",
        detectionSignal:
          "Compliance and OSA known only from audits or self-report, no shelf-" +
          "image/sensing signal, phantom stockouts (inventory in back room, hole " +
          "on shelf), promotions failing to show up in stores.",
        diagnosticQuestion:
          "How do you verify that resets, price changes, and on-shelf " +
          "availability actually happened in each store — audit, self-report, or " +
          "a real sensing/image signal?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "demand_based_labor_scheduling",
        name: "Demand-based labor scheduling & forecasting",
        valueMechanism:
          "Forecast store traffic and task workload by daypart and generate " +
          "schedules that put the right hours in the right place — staffing peak " +
          "to protect service and conversion, trimming idle hours in slow " +
          "windows, and respecting labor-law and availability constraints — so " +
          "labor cost falls where it is waste and rises only where it earns sales.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Store traffic/sales history by daypart and a labor-standards/workload model",
          "Associate availability, skills, and labor-law/predictive-scheduling constraints",
          "Actual worked hours for schedule-vs-actual feedback",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Predictive-scheduling and break/minor laws and union rules constrain " +
            "the optimization — encode them as hard constraints, not soft penalties",
          "Optimizing to cost alone can under-staff peak and crush service — " +
            "constrain on coverage/service, not just hours",
        ],
        metricsMoved: [
          "sales_per_labor_hour",
          "labor_cost_pct_sales",
          "schedule_adherence",
          "checkout_queue_time",
        ],
      },
      {
        key: "intelligent_task_management",
        name: "Intelligent task management & prioritization",
        valueMechanism:
          "Budget tasks against available labor hours, prioritize and route work " +
          "to the right associate and time, and verify completion — so directives, " +
          "resets, and audits actually get done on time without over-tasking the " +
          "floor or starving customer-facing time, compressing the execution gap " +
          "between corporate intent and shelf reality.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Task catalog with time-to-task estimates and priorities",
          "Available scheduled labor hours by store/daypart",
          "Completion and verification signal (scan, photo, or system confirmation)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Garbage time-to-task estimates produce impossible plans — calibrate " +
            "against actuals before trusting the budget",
          "Verification must be real (not self-report) or completion metrics lie",
        ],
        metricsMoved: [
          "task_completion_rate",
          "planogram_compliance",
          "sales_per_labor_hour",
        ],
      },
      {
        key: "loss_prevention_analytics",
        name: "Shrink & loss-prevention analytics",
        valueMechanism:
          "Detect loss in near-real-time — POS void/refund/discount exceptions, " +
          "self-checkout and return fraud, internal-theft patterns, and computer-" +
          "vision at self-checkout — and risk-weight LP effort to the highest-loss " +
          "stores and behaviors, converting shrink from a number found at count " +
          "into a controllable, store-actionable signal.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "POS transaction, void/refund/discount, and self-checkout event logs",
          "Inventory count/cycle-count and exception history by store",
          "Camera/computer-vision feed where deployed (with privacy governance)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "False-positive theft flags carry employee-relations and legal risk — " +
            "require human review before any accusatory action",
          "Surveillance/biometric analytics raise privacy and worker-monitoring " +
            "law exposure — govern data use and disclosures",
        ],
        metricsMoved: [
          "shrink_rate",
          "labor_cost_pct_sales",
        ],
      },
      {
        key: "shelf_vision_compliance",
        name: "Shelf vision: availability & planogram compliance",
        valueMechanism:
          "Use image recognition (associate phone, fixed camera, or robot) to " +
          "sense on-shelf availability and planogram compliance continuously, " +
          "flag holes/phantom stockouts and non-compliant sets, and trigger " +
          "targeted replenishment and reset tasks — turning compliance and OSA " +
          "from an audited guess into a near-real-time, fleet-wide signal that " +
          "compresses store-to-store variance.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Shelf images and the approved planogram/realogram by store/category",
          "On-hand inventory to distinguish phantom stockouts from true outs",
          "Task-management integration to action the flagged gaps",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Recognition accuracy varies by category and lighting — validate " +
            "precision before auto-generating tasks or it floods the store",
          "Detecting a gap creates no value unless labor exists to fix it — pair " +
            "with the labor/task model",
        ],
        metricsMoved: [
          "on_shelf_availability",
          "planogram_compliance",
          "conversion_rate",
        ],
      },
      {
        key: "associate_enablement_copilot",
        name: "Associate enablement & in-store copilot",
        valueMechanism:
          "Give associates a mobile assistant for product lookup, stock/where-is " +
          "queries, procedures, and onboarding/just-in-time guidance — shortening " +
          "time-to-productivity for new hires and lifting service and attachment " +
          "on the floor, partly offsetting the productivity drag of high turnover.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Product, inventory-location, and procedure/policy knowledge base",
          "Onboarding and training content mapped to role/task",
          "Associate device and identity for personalized, role-scoped answers",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Answers must be grounded in current product/inventory/policy data or " +
            "the copilot misinforms customers — cite the source of record",
          "Adoption fails if it adds steps — it must save time on the floor, not " +
            "add a screen between associate and customer",
        ],
        metricsMoved: [
          "units_per_transaction",
          "associate_turnover_rate",
          "in_store_nps",
        ],
      },
      {
        key: "queue_checkout_optimization",
        name: "Queue & checkout optimization",
        valueMechanism:
          "Predict checkout demand and dynamically open lanes, balance staffed vs " +
          "self-checkout, and (where deployed) frictionless/scan-and-go — cutting " +
          "wait time at peak to protect conversion and satisfaction while keeping " +
          "checkout labor matched to actual flow rather than a fixed roster.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Real-time traffic/queue sensing and checkout throughput by daypart",
          "Labor availability and cross-trained checkout coverage",
          "Self-checkout utilization and shrink/intervention signal",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Pushing volume to self-checkout to save labor can raise shrink — " +
            "balance against loss, not labor alone",
          "Dynamic lane-opening only works if cross-trained labor is actually " +
            "available to call — encode the staffing constraint",
        ],
        metricsMoved: [
          "checkout_queue_time",
          "conversion_rate",
          "in_store_nps",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "workforce_management_platform",
        name: "Demand-based workforce-management platform",
        description:
          "A WFM platform that forecasts traffic/workload, generates labor-law-" +
          "compliant demand-matched schedules, and closes the loop on schedule-vs-" +
          "actual — the system of record for store labor planning, time, and " +
          "attendance.",
        boundary:
          "Owns labor forecasting, scheduling, and adherence measurement; does " +
          "NOT set the labor budget or wage strategy (finance/HR) and does not " +
          "execute the floor — it plans the hours others run.",
        humanAccountabilityPoint: "VP Store Operations / Director of Workforce Management",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "task_execution_platform",
        name: "Store task & execution platform",
        description:
          "A task-management platform that budgets work against labor hours, " +
          "routes and prioritizes tasks/directives/resets to associates, and " +
          "verifies completion — the closed loop between corporate intent and " +
          "on-floor execution across the fleet.",
        boundary:
          "Owns task assignment, prioritization, and verified completion; does " +
          "not author the merchandising directive or the planogram (merchandising) " +
          "— it executes and proves them.",
        humanAccountabilityPoint: "Director of Store Operations / Field Execution Lead",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "loss_prevention_analytics_hub",
        name: "Loss-prevention analytics & exception hub",
        description:
          "An analytics layer over POS, self-checkout, returns, and (where " +
          "deployed) computer vision that surfaces loss exceptions in near-real-" +
          "time and risk-weights LP effort, with human review before any " +
          "accusatory action.",
        boundary:
          "Owns loss detection, prioritization, and case support; does not make " +
          "the employment/legal decision — it equips the human LP investigator " +
          "and store leader who do.",
        humanAccountabilityPoint: "VP Asset Protection / Loss Prevention Director",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "shelf_intelligence_layer",
        name: "Shelf-intelligence (availability & compliance) layer",
        description:
          "An image-recognition/sensing layer that measures on-shelf " +
          "availability and planogram compliance continuously and feeds gaps to " +
          "the task platform as actionable replenishment and reset work, reconciled " +
          "to on-hand inventory.",
        boundary:
          "Owns the sensing signal (what is on the shelf vs the plan); does not " +
          "own the planogram itself or the labor — it detects and hands off, and " +
          "depends on the task and labor platforms to act.",
        humanAccountabilityPoint: "Director of Store Operations / Merchandising Execution Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "field_performance_management",
        name: "Field performance management & coaching loop",
        description:
          "A field-leadership operating rhythm and analytics that surface store-" +
          "to-store execution variance (compliance, availability, task, shrink, " +
          "service) and drive targeted coaching to lift the bottom quartile — the " +
          "human system that converts data into compressed fleet variance.",
        boundary:
          "Owns the coaching/operating-rhythm loop and the variance analytics; " +
          "does not replace the WFM/task/LP systems — it is the management layer " +
          "that makes their signals change store behavior.",
        humanAccountabilityPoint: "Regional VP / District Manager leadership",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Store-operations value is dominated by labor — the largest controllable " +
        "store expense — and gated by execution consistency across the fleet. " +
        "Demand-based scheduling and task-against-hours budgeting recover idle " +
        "labor and redeploy it to peak, lifting sales-per-labor-hour and " +
        "protecting service; shelf-intelligence and task verification lift on-" +
        "shelf availability and conversion; loss-prevention analytics convert " +
        "shrink from a count-time surprise into a controllable margin lever; and " +
        "associate enablement softens the productivity drag of high turnover. But " +
        "the prize is gated at three honest points this expert refuses to assume " +
        "away: (1) the schedule-to-execution gap — a demand-matched plan that " +
        "store managers override realizes a fraction of its modeled saving; " +
        "(2) execution variance across stores — the average improves while the " +
        "bottom quartile lags, so fleet-wide value depends on compressing the " +
        "tail, not on the pilot store; and (3) labor-law, union/works-council, " +
        "and service-floor constraints that cap how aggressively labor can be " +
        "cut. Turnover is the recurring tax underneath all of it: every " +
        "productivity gain races re-staffing and re-training cost. Forward value " +
        "must therefore be discounted for adherence, fleet variance, and " +
        "turnover, never quoted as the pilot-store or modeled-schedule number.",
      dominantHaircutFactors: [
        {
          factor: "Schedule-to-execution / adherence gap",
          rationale:
            "Modeled labor savings assume the optimized schedule actually runs, " +
            "but manager overrides, swaps, call-outs, and unplanned overtime mean " +
            "a large share never executes — so labor value must be discounted by " +
            "the adherence gap, not the planning-tool headline.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between modeled schedule savings and realized labor " +
              "cost where adherence was not measured or enforced",
            label: "planning-range",
          },
        },
        {
          factor: "Execution variance across the fleet",
          rationale:
            "Pilot or best-store results overstate fleet-wide value because the " +
            "bottom quartile executes far worse on the same plan; rolled-up value " +
            "must be discounted for the long tail until coaching compresses it.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Spread between best- and worst-quartile store execution on the " +
              "same labor/task/planogram model",
            label: "planning-range",
          },
        },
        {
          factor: "Turnover & ramp drag",
          rationale:
            "High hourly turnover keeps a large share of the floor low on the " +
            "learning curve and consumes savings in rehire/retrain cost, so " +
            "productivity gains realize more slowly and partially than a stable-" +
            "workforce model implies.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Erosion of productivity/service gains attributable to ongoing " +
              "turnover and new-hire ramp at typical hourly attrition",
            label: "planning-range",
          },
        },
        {
          factor: "Labor-law, union & service-floor constraints",
          rationale:
            "Predictive-scheduling, break/minor, and union/works-council rules " +
            "plus a minimum service floor cap how aggressively hours can be cut, " +
            "so the theoretically optimal schedule is not the legally/operationally " +
            "feasible one.",
          typicalHaircut: {
            low: 0.05,
            high: 0.25,
            basis:
              "Reduction in addressable labor savings once predictive-scheduling, " +
              "union, and minimum-coverage constraints are applied",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Labor productivity / cost recovery",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Relative store-labor cost reduction (or equivalent SPLH gain) " +
              "from demand-based scheduling and task-against-hours, after the " +
              "adherence haircut and holding service",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in labor_cost_pct_sales (or SPLH uplift) at held service",
        },
        {
          lever: "Shrink reduction",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Relative shrink-rate reduction from near-real-time loss analytics " +
              "and risk-weighted LP effort, varies with starting maturity",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in shrink_rate",
        },
        {
          lever: "Sales lift from availability/compliance",
          range: {
            low: 0.005,
            high: 0.03,
            basis:
              "Comp-sales lift from closing phantom stockouts and lifting on-" +
              "shelf availability/compliance, net of execution variance",
            label: "planning-range",
          },
          measuredAs:
            "Relative comp-sales lift attributable to on_shelf_availability gain",
        },
        {
          lever: "Turnover / early-attrition reduction",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Relative reduction in 90-day early attrition from better " +
              "scheduling stability, onboarding, and enablement",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in associate_turnover_rate (90-day cohort)",
        },
      ],
      timeToValueBand:
        "Demand-based scheduling: 2-4 quarters to demand-matched schedules with " +
        "measured adherence (the adherence loop is the long pole, not the model). " +
        "Task management: 1-3 quarters once the task catalog and time-to-task are " +
        "calibrated. Loss-prevention analytics: 2-3 quarters on existing POS/SCO " +
        "data. Shelf vision: 3-6 quarters for fleet rollout and recognition " +
        "calibration. Fleet-wide value always lags the pilot — compressing store-" +
        "to-store variance through the field coaching loop is the longest pole.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Workforce management (WFM) / labor scheduling",
          role:
            "System of record for labor forecasting, scheduling, time & " +
            "attendance, and schedule-vs-actual adherence across stores.",
          examples: [
            "Legion",
            "UKG (Kronos) Workforce Dimensions",
            "Blue Yonder Workforce",
            "Reflexis / Zebra Workcloud",
          ],
        },
        {
          name: "Task & execution management",
          role:
            "Assigns, prioritizes, and verifies in-store tasks, directives, and " +
            "resets and budgets them against labor hours.",
          examples: [
            "Zebra Workcloud (Reflexis) Task",
            "Theatro",
            "YOOBIC",
            "SimpleClosure / retail execution apps",
          ],
        },
        {
          name: "Loss prevention / asset protection analytics",
          role:
            "Surfaces POS/self-checkout/returns exceptions and (where deployed) " +
            "computer-vision loss signals and supports LP cases.",
          examples: [
            "Appriss Retail",
            "Everseen / self-checkout vision",
            "Sensormatic / Tyco",
            "ThinkLP / case management",
          ],
        },
        {
          name: "Shelf intelligence / on-shelf availability",
          role:
            "Senses on-shelf availability and planogram compliance via image " +
            "recognition or in-store robots, reconciled to inventory.",
          examples: [
            "Trax",
            "Focal Systems",
            "Simbe (Tally robot)",
            "shelf-image recognition platforms",
          ],
        },
        {
          name: "POS / transaction & traffic",
          role:
            "Captures transactions, voids/refunds, basket and conversion signal, " +
            "and (with traffic counters) the demand the floor must serve.",
          examples: [
            "NCR / Toshiba POS",
            "Aptos",
            "traffic-counting (RetailNext / ShopperTrak)",
          ],
        },
      ],
      roles: [
        {
          title: "VP / SVP Store Operations",
          accountability:
            "End-to-end store P&L execution, labor productivity, service, and " +
            "execution consistency across the fleet.",
        },
        {
          title: "Regional VP / District Manager",
          accountability:
            "A group of stores' execution, staffing, and performance — the field " +
            "leadership layer that compresses store-to-store variance.",
        },
        {
          title: "Store Manager",
          accountability:
            "A single store's labor, execution, shrink, service, and the " +
            "associate team — where the schedule-to-execution gap is won or lost.",
        },
        {
          title: "Director of Workforce Management",
          accountability:
            "Labor forecasting, scheduling model, labor-law compliance, and " +
            "schedule adherence across stores.",
        },
        {
          title: "VP Asset Protection / Loss Prevention",
          accountability:
            "Shrink, theft, fraud, and the loss-prevention program and " +
            "investigations across the fleet.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Predictive scheduling / fair workweek laws",
          relevance:
            "Advance-notice, schedule-change premium, and rest-between-shift " +
            "rules in many jurisdictions constrain how labor optimization can " +
            "build and change schedules — hard constraints, not preferences.",
        },
        {
          name: "Wage & hour / break & minor labor law (FLSA and state)",
          relevance:
            "Overtime, meal/rest break, and minor-employment rules govern " +
            "scheduling and time-and-attendance; violations carry direct legal " +
            "and financial exposure.",
        },
        {
          name: "Worker monitoring & privacy (cameras/biometrics, BIPA, GDPR/CCPA)",
          relevance:
            "Loss-prevention computer vision, biometric checkout, and associate " +
            "monitoring trigger privacy, consent, and biometric-data law — " +
            "governance and disclosure are required.",
        },
        {
          name: "Union / works-council labor agreements",
          relevance:
            "Collective-bargaining and works-council rules on scheduling, " +
            "staffing, and monitoring cap and shape labor and surveillance " +
            "automation in unionized and EU operations.",
        },
      ],
      canonicalTerms: [
        {
          term: "SPLH (sales per labor hour)",
          definition:
            "Net sales divided by paid associate labor hours — the headline " +
            "store-floor labor-productivity unit.",
        },
        {
          term: "Schedule adherence",
          definition:
            "The share of the labor schedule actually worked as planned — the " +
            "bridge between the optimized plan and realized labor cost.",
        },
        {
          term: "On-shelf availability (OSA) / phantom stockout",
          definition:
            "Whether intended product is actually on the shelf and shoppable; a " +
            "phantom stockout is inventory in the building but a hole on the shelf.",
        },
        {
          term: "Planogram compliance",
          definition:
            "How closely actual shelf placement, facings, and pricing match the " +
            "approved planogram and reset directive.",
        },
        {
          term: "Time-to-task / task-against-hours",
          definition:
            "Budgeting assigned store work against the labor hours actually " +
            "available, so tasking does not exceed capacity.",
        },
        {
          term: "Shrink",
          definition:
            "Inventory loss from theft, fraud, process error, and damage as a " +
            "percentage of sales — a directly store-controllable margin leak.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Labor productivity & cost (SPLH, labor % of sales)",
        authoritativeSource:
          "WFM paid hours and payroll cost joined to POS net sales by store/" +
          "daypart/department",
        whatGoodEvidenceLooksLike:
          "SPLH and labor % of sales by store and daypart with scheduled-vs-" +
          "actual hours, so productivity is separated from the adherence gap.",
        weakEvidenceToReject:
          "A single chain-wide labor % of sales with no store/daypart spread or " +
          "schedule-vs-actual breakdown.",
      },
      {
        claim: "Schedule adherence / schedule-to-execution gap",
        authoritativeSource:
          "WFM scheduled vs actually-worked hours by associate/shift/store, with " +
          "edit and overtime logs",
        whatGoodEvidenceLooksLike:
          "Adherence by store with the size and cause of edits (overrides, swaps, " +
          "call-outs, overtime) — the measured gap between plan and floor.",
        weakEvidenceToReject:
          "A planning-tool's modeled labor saving with no measurement of what " +
          "schedule actually ran.",
      },
      {
        claim: "Execution variance across stores (compliance, task, OSA)",
        authoritativeSource:
          "Store-level distribution of planogram compliance, task completion, " +
          "OSA, and shrink from task/audit/shelf-sensing systems",
        whatGoodEvidenceLooksLike:
          "Best-to-worst-quartile spread by store (not just the average) on " +
          "compliance/availability/task, normalized for store size/format.",
        weakEvidenceToReject:
          "A fleet-average compliance or availability number presented as if it " +
          "held in every store.",
      },
      {
        claim: "Shrink rate and loss composition",
        authoritativeSource:
          "Physical/cycle counts vs book inventory plus LP exception analytics " +
          "(voids/refunds/self-checkout) by store",
        whatGoodEvidenceLooksLike:
          "Shrink by store split by source (external/internal/process/self-" +
          "checkout) reconciled to counts, with exception-rate trends.",
        weakEvidenceToReject:
          "A single book-shrink number found only at annual count, with no " +
          "source split or exception signal.",
      },
      {
        claim: "Turnover and time-to-productivity",
        authoritativeSource:
          "HRIS/WFM termination and headcount records with tenure buckets and " +
          "new-hire ramp data",
        whatGoodEvidenceLooksLike:
          "Annualized and 90-day turnover by store with time-to-productivity for " +
          "new hires — the recurring tax under every productivity claim.",
        weakEvidenceToReject:
          "A company-wide annual turnover figure with no 90-day cohort or store-" +
          "level spread.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Is store labor scheduled to forecasted traffic and task workload by daypart, or built on fixed templates and a sales-budget hours number?",
      "What is your schedule adherence, and how big is the gap between the WFM schedule and the hours actually worked after managers adjust it?",
      "How wide is the spread between your best- and worst-executing stores on planogram compliance, on-shelf availability, and task completion?",
      "Is task volume budgeted against available labor hours per store, and is completion verified or self-reported?",
      "What is your hourly turnover and 90-day early attrition, and how long until a new associate is fully productive?",
      "Do you detect shrink and loss exceptions (internal, refund, self-checkout) in near-real-time and risk-weight LP effort, or find it at the physical count?",
      "How do you verify that resets, price changes, and on-shelf availability actually happened in each store — audit, self-report, or a real sensing signal?",
    ],
    maturitySignals: [
      "Labor is scheduled to forecasted traffic/workload by daypart with measured schedule adherence, not fixed templates.",
      "Tasks are budgeted against available hours and completion is verified (scan/photo/system), not self-reported.",
      "Store-to-store execution variance is measured and a field coaching loop is actively compressing the bottom quartile.",
      "Shrink and loss exceptions are detected in near-real-time across POS/self-checkout/returns and LP effort is risk-weighted.",
    ],
    redFlags: [
      "Schedules are built on fixed templates or a sales-budget hours number with no traffic/workload signal — and adherence is unmeasured.",
      "Corporate cannot verify in near-real-time whether resets, price changes, and on-shelf availability actually happened per store.",
      "Store-to-store execution variance is wide and unmanaged while only the fleet average is reported.",
      "Hourly turnover runs very high with thin onboarding, and productivity programs are launched as if the workforce were stable.",
      "Labor is cut to a cost target past the point where service, queue time, availability, and shrink controls hold.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Workforce-management suites (Legion, UKG/Kronos, Blue Yonder, Zebra/Reflexis)",
        category: "Labor forecasting, scheduling, time & attendance",
        switchingCost:
          "High — WFM holds the labor model, time & attendance, and labor-law rule configuration and is fused to payroll and store process; replacement is a multi-quarter program with re-training and parallel runs.",
        renewalDynamics:
          "Per-employee/per-store subscription; AI/auto-scheduling and demand-forecasting modules increasingly upsold at renewal; watch labor-law content updates as a tie-in.",
      },
      {
        vendorName: "Task & execution platforms (Zebra/Reflexis, Theatro, YOOBIC)",
        category: "Store task management & execution verification",
        switchingCost:
          "Moderate-to-high — integrates via task feeds and is embedded in the store associate's daily workflow and device; the lock-in is workflow habit and verification history, not raw data.",
        renewalDynamics:
          "Per-store or per-user subscription; favor outcome terms tied to measured task completion and execution-variance reduction.",
      },
      {
        vendorName: "Loss-prevention analytics & self-checkout vision (Appriss, Everseen, Sensormatic)",
        category: "Shrink/loss detection and asset protection",
        switchingCost:
          "Moderate — runs on POS/SCO/returns feeds; the stickiness is tuned exception models, case history, and camera/vision integration where deployed.",
        renewalDynamics:
          "Subscription plus hardware (vision/EAS); leverage measured shrink reduction and false-positive rates at renewal; scrutinize data/biometric terms.",
      },
      {
        vendorName: "Shelf-intelligence (Trax, Focal Systems, Simbe)",
        category: "On-shelf availability & planogram compliance sensing",
        switchingCost:
          "Moderate — image/sensing pipelines and planogram mappings accrete configuration; hardware (robots/fixed cameras) raises switching cost where deployed.",
        renewalDynamics:
          "Per-store/usage pricing, sometimes hardware-bundled; tie value to measured OSA/compliance lift and recognition accuracy by category.",
      },
    ],
    switchingCosts:
      "The WFM core is the hardest to switch because it carries the labor model, " +
      "time & attendance, and labor-law rules fused to payroll — effectively a " +
      "multi-quarter platform decision. The negotiable frontier is the execution " +
      "layer around it (task, loss-prevention, shelf-intelligence), where " +
      "switching cost is moderate and the real lock-in is tuned models, " +
      "verification history, and workflow habit. Protect data and model " +
      "portability and labor-law content terms to keep that frontier negotiable.",
    negotiationLevers: [
      "Outcome pricing tied to measured labor-cost-at-held-service, schedule adherence, task completion, or shrink reduction — net of the adherence and variance haircuts",
      "Labor-law / predictive-scheduling content currency and accuracy as a contracted SLA, not a best-effort add-on",
      "Data and model portability and worker-monitoring/biometric data-ownership rights to prevent lock-in and manage privacy exposure",
      "Pilot-to-scale gating with fleet-wide (not pilot-store) execution proof per region before enterprise commitment",
      "Bundle WFM-native task/AI modules against best-of-breed at renewal to discipline pricing",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      labor_metric: [
        "WFM paid hours and payroll cost joined to POS net sales by store/daypart",
        "scheduled-vs-actual (adherence) breakdown",
        "service/coverage held constant (so a 'saving' is not lost sales)",
      ],
      execution_claim: [
        "store-level distribution (best-to-worst quartile), not just the fleet average",
        "verified completion signal (scan/photo/system), not self-report",
      ],
      shrink_claim: [
        "shrink reconciled to physical/cycle counts",
        "source split (external/internal/process/self-checkout) and exception trend",
      ],
      turnover_claim: [
        "annualized and 90-day cohort turnover by store",
        "time-to-productivity / ramp basis",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (adherence gap, fleet variance, turnover, labor-law constraints)",
      ],
    },
    citationStandard:
      "Quantitative store-ops claims cite the WFM/task/LP/POS source and the " +
      "store/daypart grain, and labor claims cite both scheduled and actual hours " +
      "with service held — never a fleet-average presented as if it held in every " +
      "store, and never a modeled-schedule saving presented as realized. " +
      "Execution claims cite the best-to-worst-quartile spread, not just the " +
      "average. Value projections cite a baseline, a labelled planning range, and " +
      "the haircut factors applied (adherence gap, fleet variance, turnover, " +
      "labor-law constraints) — never a single asserted savings or ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no schedule-vs-actual (adherence) data — frame labor savings as an industry planning range with an explicit adherence-gap haircut, not their measured number.",
      "Only pilot-store or fleet-average results exist — flag that fleet-wide value is gated by store-to-store execution variance until the bottom quartile is proven.",
      "Turnover and time-to-productivity are unknown — caveat that productivity gains are taxed by re-staffing/ramp at typical hourly attrition.",
      "Loss claims rest on book shrink found at count — flag that without near-real-time exception data the source split and controllability are estimates.",
      "Labor-law/union constraints are unconfirmed — caveat that predictive-scheduling and collective-bargaining rules may cap the addressable saving.",
    ],
    inferenceLanguage: [
      "Across retailers at this format, sales per labor hour typically runs...",
      "Without your schedule-vs-actual data, the industry pattern suggests demand-based scheduling recovers roughly... before the adherence gap...",
      "Peer fleets commonly see a wide best-to-worst-quartile execution spread of around...",
      "Treating this as a planning range rather than your measured figure...",
      "Hourly turnover at this wage position usually runs around..., which taxes the productivity case by...",
    ],
    flagWithoutEvidence: [
      "A specific dollar labor saving or ROI for this tenant",
      "This tenant's actual schedule adherence, shrink rate, turnover, or fleet execution variance",
      "A modeled-schedule saving claimed as realized without schedule-vs-actual adherence",
      "A pilot-store result presented as a fleet-wide outcome",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "labor productivity value bridge — scheduling/task savings to realized value",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current labor cost to demand-based-scheduling and task savings to net realized value, showing the adherence-gap, fleet-variance, and turnover haircuts.",
    },
    {
      questionPattern:
        "store execution variance — best vs worst quartile across the fleet",
      exhibitKind: "chart",
      chartKind: "range-bar",
      chartBuilder: "rangeBar",
      note: "Show the best-to-worst-quartile spread by store on compliance, OSA, and task completion to make the long tail (not the average) the decision object.",
    },
    {
      questionPattern:
        "labor matched to traffic / SPLH or adherence trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend SPLH, schedule adherence, or queue time by daypart against the planning range to show whether labor is tracking demand.",
    },
    {
      questionPattern: "store-operations KPI scorecard",
      exhibitKind: "table",
      note: "SPLH, labor % of sales, schedule adherence, task completion, shrink, OSA, planogram compliance, queue time, conversion, turnover vs planning ranges and format peers.",
    },
    {
      questionPattern:
        "shrink composition — where loss concentrates by source and store",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack shrink dollars by source (external/internal/process/self-checkout) and highlight the highest-loss stores to risk-weight LP effort.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Labor is scheduled to forecasted traffic/workload AND schedule adherence is measured and enforced, so modeled savings actually run on the floor",
      "A field coaching/operating-rhythm loop actively compresses store-to-store execution variance, so fleet value follows the pilot",
      "Task volume is budgeted against available hours and completion is verified, not self-reported",
      "The program protects a service/coverage floor and works within labor-law/union constraints, so cuts do not boomerang into lost sales and grievances",
    ],
    failureDrivers: [
      "An optimized schedule that managers override — the schedule-to-execution gap eats the saving and discredits the tool",
      "Pilot-store results rolled out as fleet-wide value while the bottom quartile keeps failing the same plan",
      "Labor cut to a cost target past the service/availability/shrink-control floor, so conversion and shrink quietly worsen",
      "High turnover ignored — productivity programs launched onto a perpetually green floor never reach steady-state gains",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Task management and demand-based scheduling adopt first because the pain " +
      "(missed directives, queues, idle hours) is visible and the tools are " +
      "mature. Loss-prevention analytics follow on existing POS/self-checkout " +
      "data. Shelf vision and queue/checkout optimization are later, gated on " +
      "hardware rollout and recognition accuracy. Adoption hinges on store-" +
      "manager trust and the field coaching loop — the schedule and task tools " +
      "create value only when district leadership runs them and closes the " +
      "execution gap, not on model quality alone.",
    roiClarity: "medium",
    roiClarityBasis:
      "Store-ops ROI is only moderately firm because the prize is large and " +
      "measurable in labor cost, shrink, availability, and turnover, but three " +
      "factors blur it: the schedule-to-execution (adherence) gap between modeled " +
      "and realized labor savings, execution variance that makes pilot results " +
      "overstate fleet value, and attribution against a moving baseline (traffic, " +
      "weather, wage market, turnover). Because labor cuts can boomerang into " +
      "lost sales and worse shrink, ROI must be quoted with explicit adherence, " +
      "fleet-variance, and turnover haircuts and a held-service constraint, not " +
      "as a clean modeled number.",
  },

  regulatoryFrame: {
    name: "Labor & scheduling law plus worker-monitoring/privacy",
    relevance:
      "The dominant regulatory frame for store operations: predictive-scheduling/" +
      "fair-workweek, wage & hour, and break/minor labor laws constrain how labor " +
      "can be forecast, scheduled, and changed, while loss-prevention computer " +
      "vision, biometric checkout, and associate monitoring raise privacy, " +
      "consent, and biometric-data law (BIPA, GDPR/CCPA) exposure — and union/" +
      "works-council agreements cap scheduling and surveillance automation. Labor " +
      "and LP automation must encode these as hard constraints, not preferences " +
      "(see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave4)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
