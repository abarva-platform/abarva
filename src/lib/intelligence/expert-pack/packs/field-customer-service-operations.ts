// Consilium expert — Field Service & Customer Service Operations.
//
// W3 draft ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A
// cross-cutting, post-sale SERVICE DELIVERY expert: field service management
// (dispatch/scheduling/technicians/parts), service contracts & warranty,
// remote/connected diagnostics & predictive maintenance, and customer
// service/support operations (case management, self-service, knowledge).
//
// Honesty posture: this domain is run as a cost center when it should be a
// margin + retention engine. The truth metrics are first-time-fix and
// truck-roll avoidance — everything else is downstream of getting the right
// technician, with the right part, to the right job, the first time.
// Predictive-maintenance ROI is real but gated by sensor/connectivity and
// parts-data quality; deflection-to-self-service erodes the moment it degrades
// resolution. DISTINCT from contact-center-cx (inbound contact center / CX) —
// this is service DELIVERY across field, case, and asset uptime, not front-
// office channel transformation. Cross-industry (industrial/OEM, medical
// devices, telecom/cable, utilities, building systems, high-tech).

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const fieldCustomerServiceOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.field-customer-service",
    expertName: "Field Service & Customer Service Operations Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "field-customer-service",
    scopeNote:
      "Post-sale service delivery across the field and the case queue: field " +
      "service management (dispatch, scheduling, technician enablement, parts/" +
      "van-stock), service contracts & warranty, remote/connected diagnostics " +
      "and predictive maintenance, and customer service/support operations " +
      "(case management, self-service, knowledge). Treats service as a margin " +
      "and retention engine, not just a cost center, and is blunt about the two " +
      "truth metrics — first-time fix and truck-roll avoidance. Cross-industry " +
      "(industrial/OEM, medical devices, telecom/cable, utilities, building " +
      "systems, high-tech). Excludes inbound contact-center / CX channel " +
      "transformation (routes to the contact-center-cx expert), product " +
      "engineering, and the manufacturing line itself (manufacturing-operations).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "first_time_fix_rate",
        name: "First-time-fix rate (FTF)",
        definition:
          "Share of field service jobs fully resolved on the first visit with " +
          "no follow-up dispatch required for the same issue — counting only " +
          "genuine resolution, not jobs closed and then re-opened.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 88,
          basis:
            "Cross-industry field-service ranges; best-in-class >85% on " +
            "well-instrumented assets, lower on complex/legacy equipment with " +
            "poor parts data",
          label: "planning-range",
        },
        dataSource:
          "FSM work-order records linked by asset + fault over a trailing " +
          "window to detect repeat dispatches for the same issue",
        whyItMatters:
          "The single truth metric of field service — high FTF cuts repeat " +
          "truck rolls, lifts CSAT, and protects margin simultaneously. Every " +
          "AI/scheduling bet that raises utilization but depresses FTF (wrong " +
          "tech, missing part) is net-negative even if the dispatch board looks busy.",
      },
      {
        key: "mean_time_to_repair",
        name: "Mean time to repair (MTTR)",
        definition:
          "Average elapsed time from fault/case open to confirmed resolution, " +
          "spanning triage, dispatch wait, travel, and on-site repair.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 48,
          basis:
            "Wide variance by SLA tier and asset criticality — critical-uptime " +
            "contracts run hours, routine break-fix runs days; range is a " +
            "planning band, not a single target",
          label: "planning-range",
        },
        dataSource:
          "FSM/CRM case timestamps (open → dispatch → on-site → resolved) joined " +
          "to SLA clock state",
        whyItMatters:
          "The customer-felt measure of downtime and the SLA-attainment driver. " +
          "Remote diagnostics and better triage compress the dispatch-and-travel " +
          "portion most; cutting on-site time by skipping diagnosis just trades " +
          "MTTR for repeat-visit rate.",
      },
      {
        key: "truck_rolls_per_resolution",
        name: "Truck rolls per resolution",
        definition:
          "Average number of physical site visits required to resolve one " +
          "service issue, including the avoidable second/third visits caused by " +
          "wrong diagnosis, missing parts, or wrong skill.",
        unit: "visits",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1.1,
          high: 1.6,
          basis:
            "Best-in-class approaches 1.0 (true first-time fix); 1.4-1.6 is " +
            "common where diagnosis and parts data are weak",
          label: "planning-range",
        },
        dataSource:
          "FSM dispatch records grouped by resolved issue, counting visits per " +
          "closure",
        whyItMatters:
          "The cost twin of FTF and the second truth metric — a truck roll is " +
          "the most expensive unit of service (labor + travel + vehicle). " +
          "Avoiding the second visit (remote resolution, right-first-time " +
          "dispatch) is where the hard dollars are, not shaving minutes on site.",
      },
      {
        key: "technician_utilization",
        name: "Technician utilization (wrench time)",
        definition:
          "Share of a technician's paid working time spent on productive on-site " +
          "repair/install work ('wrench time'), versus travel, idle, admin, and " +
          "waiting for parts.",
        unit: "%",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 60,
          high: 75,
          basis:
            "Sustainable wrench-time band; persistently >80% usually means " +
            "travel/admin are undercounted or techs are overbooked, <55% signals " +
            "poor scheduling or excess capacity",
          label: "planning-range",
        },
        dataSource:
          "FSM time-on-task and GPS/route data separating wrench time from " +
          "travel, idle, and after-job admin",
        whyItMatters:
          "The capacity-and-cost lever — but dangerous as a sole target. " +
          "Optimizing utilization at the expense of first-time fix (rushing, " +
          "skipping the right tech) inflates truck rolls; the two must be read " +
          "together.",
      },
      {
        key: "sla_attainment",
        name: "SLA attainment",
        definition:
          "Share of contracted service commitments (response time, restore time, " +
          "uptime) met within the agreed window, by SLA tier.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 92,
          high: 99,
          basis:
            "Contractual SLAs typically target 95-99%; penalty/credit clauses " +
            "make the last points expensive — band reflects tier mix",
          label: "planning-range",
        },
        dataSource:
          "FSM/CRM SLA clocks measured against contract terms, with " +
          "penalty/credit reconciliation",
        whyItMatters:
          "The contractual obligation and the source of penalty exposure. Missed " +
          "SLAs cost cash credits and renewal risk; AI scheduling and predictive " +
          "dispatch protect attainment by pre-positioning the right tech and part.",
      },
      {
        key: "service_contract_attach_renewal",
        name: "Service contract attach & renewal rate",
        definition:
          "Attach: share of installed-base assets covered by a paid service " +
          "contract/warranty. Renewal: share of expiring contracts renewed. " +
          "Tracked together as the recurring-service penetration of the base.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 80,
          basis:
            "Attach varies widely by industry and channel; renewal best-in-class " +
            ">85% where service quality and proactive outreach are strong",
          label: "planning-range",
        },
        dataSource:
          "Installed-base/asset registry joined to contract records (CRM/ERP " +
          "service contracts) for coverage and renewal tracking",
        whyItMatters:
          "The margin-and-retention engine — service contracts are high-margin " +
          "recurring revenue and the lever that turns service from a cost center " +
          "into a profit center. Attach/renewal is tightly coupled to felt " +
          "service quality (FTF, uptime), so it is the commercial payoff of the " +
          "operational metrics.",
      },
      {
        key: "cost_to_serve_per_case",
        name: "Cost to serve per case",
        definition:
          "Fully-loaded cost to resolve one service case or work order " +
          "(technician labor + travel + parts + dispatch/back-office + tech " +
          "overhead) divided by resolved volume, by service type.",
        unit: "USD",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 80,
          high: 600,
          basis:
            "Channel-dependent: remote/case resolution tens of dollars, a field " +
            "truck roll hundreds; range spans case-only vs full field dispatch",
          label: "planning-range",
        },
        dataSource:
          "Service cost centers (field labor + travel + parts + support) / " +
          "resolved case volume from the GL, FSM, and parts systems",
        whyItMatters:
          "The economic denominator every deflection/predictive bet is judged " +
          "on. Cost-to-serve only falls if truck rolls are genuinely avoided " +
          "(remote/first-time fix), not deferred — the link back to " +
          "truck_rolls_per_resolution.",
      },
      {
        key: "self_service_deflection_rate",
        name: "Self-service deflection rate",
        definition:
          "Share of service issues fully resolved by customer self-service " +
          "(portal, knowledge, guided troubleshooting, remote fix) without a " +
          "case reaching a live agent or a field dispatch — counting genuine " +
          "resolution, not abandons.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 45,
          basis:
            "Depends on issue shoppability and knowledge quality; degrades fast " +
            "if deflection pushes unresolved customers away rather than fixing them",
          label: "planning-range",
        },
        dataSource:
          "Self-service/portal analytics joined to case and dispatch records to " +
          "net out issues that re-surface as cases or truck rolls",
        whyItMatters:
          "The cheapest resolution path — but erodes the moment it degrades " +
          "resolution. Deflection counted at portal-visit rather than fix " +
          "inflates the number while the issue re-contacts as a costly truck " +
          "roll; must be read net of re-contact and downstream dispatch.",
      },
      {
        key: "asset_uptime",
        name: "Asset uptime / availability",
        definition:
          "Share of contracted time a serviced asset is available and " +
          "operational, the inverse of unplanned downtime, for uptime-based " +
          "service contracts.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 95,
          high: 99.5,
          basis:
            "Uptime guarantees commonly 95-99%+; each additional nine is " +
            "disproportionately expensive and requires predictive maintenance",
          label: "planning-range",
        },
        dataSource:
          "Connected-asset/IoT telemetry and downtime logs measured against " +
          "contracted availability windows",
        whyItMatters:
          "The outcome metric for connected/predictive service and the basis of " +
          "uptime-as-a-service contracts. Predictive maintenance is justified by " +
          "uptime protection, but only realizable where sensors, connectivity, " +
          "and parts logistics actually support pre-emptive intervention.",
      },
      {
        key: "parts_availability_first_visit",
        name: "Parts availability at first visit",
        definition:
          "Share of jobs where the correct part(s) were on the technician's van " +
          "or pre-shipped in time for the first visit, enabling completion " +
          "without a return trip for parts.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 95,
          basis:
            "Best-in-class >90% via van-stock optimization and predictive parts; " +
            "weak parts data and poor forecasting drag this into the low 80s",
          label: "planning-range",
        },
        dataSource:
          "FSM work-order parts usage joined to van-stock/inventory and " +
          "return-trip-for-parts flags",
        whyItMatters:
          "The most under-managed driver of first-time fix — a perfectly " +
          "scheduled tech still fails if the part isn't there. Parts data quality " +
          "is the silent gate on both FTF and predictive maintenance ROI.",
      },
      {
        key: "customer_satisfaction_effort",
        name: "Service CSAT / customer effort score",
        definition:
          "Post-service satisfaction (top-2-box on a 5-point scale) and/or " +
          "customer-effort score for resolving the issue, captured after case or " +
          "field-visit closure.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 92,
          basis:
            "Post-service CSAT ranges; low response rates and survey timing widen " +
            "the real spread — effort score is often more predictive of churn",
          label: "planning-range",
        },
        dataSource:
          "Post-service surveys joined to case/work-order records, segmented by " +
          "first-time-fix vs repeat-visit journeys",
        whyItMatters:
          "The honesty check on every efficiency play and the leading indicator " +
          "of renewal. Pushing utilization or deflection past the point customers " +
          "tolerate erodes effort score and contract renewal — the metric that " +
          "must be watched alongside every cost move.",
      },
      {
        key: "repeat_visit_rate",
        name: "Repeat-visit rate",
        definition:
          "Share of resolved issues that require a follow-up dispatch for the " +
          "same fault within a defined window — the inverse signal of true " +
          "first-time fix and the tell-tale of false closures.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 18,
          basis:
            "Best-in-class <8%; high repeat rates expose wrong-diagnosis, " +
            "missing-parts, and pressure-to-close-the-job behaviors",
          label: "planning-range",
        },
        dataSource:
          "FSM work orders linked by asset + fault over a trailing window to " +
          "detect follow-up dispatches for the same issue",
        whyItMatters:
          "The integrity check on FTF and utilization — a high FTF claim with a " +
          "rising repeat-visit rate means jobs are being closed, not fixed. It is " +
          "the field-service equivalent of false containment and where vanity " +
          "first-time-fix numbers get exposed.",
      },
    ],

    painThemes: [
      {
        key: "service_as_cost_center",
        name: "Service run as a cost center, not a margin engine",
        description:
          "Service is managed purely to minimize cost — utilization and " +
          "headcount targets — while the high-margin contract/parts revenue and " +
          "retention value it drives are invisible to the P&L owner, so " +
          "investment that would lift attach, renewal, and uptime is starved.",
        detectionSignal:
          "Service reports up through operations/cost with no margin or " +
          "attach/renewal line; utilization is the headline KPI; no view of " +
          "service contract profitability or installed-base penetration.",
        diagnosticQuestion:
          "Is service measured on cost-to-serve alone, or do you see service " +
          "contract margin, attach, and renewal — and who owns that P&L?",
      },
      {
        key: "false_first_time_fix",
        name: "False first-time-fix (close-the-job pressure)",
        description:
          "Technicians are incentivized on jobs-closed or utilization, so jobs " +
          "are marked resolved that recur within days — the headline FTF looks " +
          "strong while repeat-visit rate, truck rolls, and cost-to-serve quietly " +
          "climb and CSAT on the repeat cohort craters.",
        detectionSignal:
          "High reported FTF alongside a rising repeat-visit rate for the same " +
          "asset/fault; truck-rolls-per-resolution above 1.4; CSAT lowest on " +
          "multi-visit journeys; closure-rate incentives in the comp plan.",
        diagnosticQuestion:
          "How is first-time fix defined — does it net out jobs re-opened for " +
          "the same fault within the window — and what is your repeat-visit rate?",
      },
      {
        key: "parts_data_gap",
        name: "Parts-data gap (the silent FTF killer)",
        description:
          "The bill-of-materials, fault-to-part mapping, and van-stock data are " +
          "incomplete or wrong, so the right part isn't on the truck — the most " +
          "perfectly scheduled, AI-optimized dispatch still fails and becomes a " +
          "return trip. Parts data is the silent dependency under FTF and " +
          "predictive maintenance alike.",
        detectionSignal:
          "Frequent return-trips-for-parts; low parts-availability-at-first-" +
          "visit; no reliable fault-to-part mapping; van-stock set by habit not " +
          "demand; predictive-maintenance pilots that can't act because the part " +
          "can't be sourced in time.",
        diagnosticQuestion:
          "What share of your truck rolls fail for a missing part, and how good " +
          "is your fault-to-part mapping and van-stock optimization?",
      },
      {
        key: "predictive_maintenance_stall",
        name: "Predictive-maintenance pilot stall",
        description:
          "Connected-diagnostics and predictive-maintenance pilots generate " +
          "alerts but never scale to value because connectivity is patchy, sensor " +
          "coverage is thin, the parts/logistics chain can't act on the warning " +
          "in time, or the contract model gives no one the incentive to act " +
          "pre-emptively.",
        detectionSignal:
          "Perpetual pilots; alerts that don't trigger a pre-emptive work order; " +
          "low connected-asset coverage; uptime contracts absent so prevention " +
          "isn't rewarded; predicted failures that still become emergency truck rolls.",
        diagnosticQuestion:
          "What share of your installed base is connected, and when a predictive " +
          "alert fires, can the parts and dispatch chain actually act before failure?",
      },
      {
        key: "deflection_degrades_resolution",
        name: "Self-service deflection that degrades resolution",
        description:
          "Aggressive deflection to portal/knowledge contains issues on paper " +
          "but pushes unresolved customers into frustration — the issue re-" +
          "surfaces as a case or, worse, a costly truck roll, and the 'savings' " +
          "are recycled cost plus a churn risk.",
        detectionSignal:
          "Rising self-service deflection with rising downstream case or dispatch " +
          "volume for the same issues; falling effort score on deflected-then-" +
          "escalated journeys; knowledge with no resolution-confirmation signal.",
        diagnosticQuestion:
          "Of issues deflected to self-service, what share re-surface as a case " +
          "or a dispatch, and do you measure effort score for the deflected cohort?",
      },
      {
        key: "scheduling_skills_mismatch",
        name: "Scheduling & skills mismatch",
        description:
          "Dispatch optimizes for proximity or utilization rather than the " +
          "right skill/certification and the right part, so the wrong technician " +
          "arrives, can't complete the job, and a second visit is required — " +
          "inflating truck rolls while the dispatch board reports high utilization.",
        detectionSignal:
          "High utilization with high repeat-visit/second-dispatch rate; manual " +
          "or proximity-only scheduling; no skills/certification or parts " +
          "constraint in the dispatch logic; techs frequently re-assigned mid-route.",
        diagnosticQuestion:
          "Does your scheduling consider skill, certification, and parts " +
          "availability — not just location and utilization — and how often does " +
          "a job need a second tech because the first couldn't complete it?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "remote_diagnostics_resolution",
        name: "Remote / connected diagnostics & resolution",
        valueMechanism:
          "Connected-asset telemetry and AI triage diagnose faults remotely and " +
          "resolve a share of issues without a dispatch — and, when a visit is " +
          "still needed, tell the technician the exact fault and part in advance " +
          "— removing truck rolls and lifting first-time fix rather than merely " +
          "deferring the problem.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Connected-asset / IoT telemetry with adequate sensor coverage",
          "Reliable connectivity from the installed base",
          "Fault-to-part mapping so a diagnosed fault can be actioned",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Misdiagnosis that suppresses a needed dispatch risks an asset failure and SLA breach — keep a human escalation path",
          "Remote-resolution claims must net out issues that re-surface as a later truck roll",
          "Telemetry and remote-access carry data-privacy and cyber-physical safety obligations",
        ],
        metricsMoved: [
          "truck_rolls_per_resolution",
          "first_time_fix_rate",
          "mean_time_to_repair",
          "cost_to_serve_per_case",
        ],
      },
      {
        key: "predictive_maintenance",
        name: "Predictive maintenance (failure prediction)",
        valueMechanism:
          "Models on asset telemetry and service history predict failures before " +
          "they happen and trigger a pre-emptive, parts-ready work order — " +
          "converting emergency break-fix into planned maintenance, protecting " +
          "uptime, and avoiding the most expensive emergency truck rolls.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Sensor/telemetry history and labelled failure events",
          "Connectivity and connected-asset coverage of the installed base",
          "A parts and dispatch chain able to act on the alert before failure",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "ROI is real but gated by sensor coverage, connectivity, and parts logistics — alerts no one can act on create cost without value",
          "False positives drive unnecessary visits; false negatives breach uptime — tune to the contract's cost of each",
          "Prevention pays only where the contract model (uptime-as-a-service) rewards acting early",
        ],
        metricsMoved: [
          "asset_uptime",
          "truck_rolls_per_resolution",
          "sla_attainment",
          "cost_to_serve_per_case",
        ],
      },
      {
        key: "intelligent_scheduling_dispatch",
        name: "AI scheduling & dispatch optimization",
        valueMechanism:
          "An optimizer assigns jobs by skill, certification, SLA urgency, parts " +
          "availability, and route — not just proximity or utilization — so the " +
          "right technician arrives with the right part the first time, lifting " +
          "first-time fix and wrench time together while protecting SLA attainment.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Technician skills/certification and availability data",
          "Van-stock / parts availability per technician",
          "SLA terms, asset location, and travel/route data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Optimizing utilization alone inflates repeat visits — constrain on skill and parts, not just proximity",
          "Dispatchers must be able to override for context the model lacks (customer sensitivity, site access)",
          "Avoid schedules that quietly bury hard jobs to protect a utilization metric",
        ],
        metricsMoved: [
          "first_time_fix_rate",
          "technician_utilization",
          "sla_attainment",
          "parts_availability_first_visit",
        ],
      },
      {
        key: "technician_copilot_knowledge",
        name: "Technician copilot & knowledge retrieval",
        valueMechanism:
          "A field copilot retrieves the right repair procedure, schematic, and " +
          "fault history on-site (incl. AR/visual assist and RAG over service " +
          "manuals), guiding the technician to the correct fix — raising first-" +
          "time fix and shortening on-site time, especially for less-tenured techs.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Indexed service manuals, schematics, and repair procedures",
          "Asset service history and fault-to-resolution records",
          "Fault-to-part mapping for guided part selection",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Guidance quality is capped by manual/knowledge freshness — stale procedures produce wrong fixes",
          "The technician is accountable for the repair; suggestions must be grounded and overridable, citations shown",
          "Safety-critical repairs require verified procedures, not generative guesses",
        ],
        metricsMoved: [
          "first_time_fix_rate",
          "mean_time_to_repair",
          "repeat_visit_rate",
        ],
      },
      {
        key: "service_self_service_assistant",
        name: "Customer self-service & case assistant",
        valueMechanism:
          "A grounded self-service assistant resolves common service issues " +
          "(setup, troubleshooting, warranty status, scheduling) end-to-end and " +
          "auto-triages cases that need a human or a dispatch — genuinely " +
          "resolving qualifying issues and pre-diagnosing the rest so the right " +
          "resolution path is chosen the first time.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Curated, fresh customer-facing knowledge with resolution confirmation",
          "Case/intent taxonomy and historical resolution outcomes",
          "Action access to warranty, scheduling, and order systems",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Deflection that degrades resolution re-surfaces as a costly truck roll — measure net of downstream case/dispatch",
          "Warranty/eligibility answers carry contractual risk — ground in policy and constrain to verified responses",
          "Always offer a clean path to a human or a dispatch; never trap the customer",
        ],
        metricsMoved: [
          "self_service_deflection_rate",
          "cost_to_serve_per_case",
          "customer_satisfaction_effort",
        ],
      },
      {
        key: "parts_demand_van_stock",
        name: "Parts demand forecasting & van-stock optimization",
        valueMechanism:
          "AI forecasts parts demand by fault pattern, asset population, and " +
          "geography and optimizes van-stock and pre-shipment — so the correct " +
          "part is on the truck for the first visit, directly attacking the " +
          "silent first-time-fix killer and cutting return-trips-for-parts.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Fault-to-part (BOM) mapping and historical parts usage",
          "Installed-base population and failure-rate data",
          "Inventory, van-stock, and supplier lead-time data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Forecast value is capped by parts-data quality — wrong fault-to-part mapping defeats the optimization",
          "Over-stocking vans ties up working capital; under-stocking re-creates the return trip — tune to carrying cost",
          "Planners must be able to override for new-product or recall surges the model hasn't seen",
        ],
        metricsMoved: [
          "parts_availability_first_visit",
          "first_time_fix_rate",
          "truck_rolls_per_resolution",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "connected_asset_remote_resolution",
        name: "Connected-asset remote resolution with clean dispatch fallback",
        description:
          "A connected-diagnostics layer triages and resolves qualifying faults " +
          "remotely and, when a visit is unavoidable, pre-diagnoses the fault and " +
          "stages the part so the dispatch is right-first-time — designed so " +
          "remote resolution never suppresses a genuinely needed visit.",
        boundary:
          "Owns remote triage/resolution and the dispatch-handoff with diagnosis " +
          "and part; does not own the field execution itself or the asset's " +
          "embedded firmware.",
        humanAccountabilityPoint: "VP Service Operations / Connected Service Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "skills_parts_aware_scheduling",
        name: "Skills- and parts-aware scheduling layer",
        description:
          "A dispatch optimizer that constrains on technician skill, " +
          "certification, SLA urgency, and parts availability — not just " +
          "proximity and utilization — overlaid on the existing FSM so the right " +
          "tech arrives with the right part the first time, without ripping out " +
          "the scheduling platform.",
        boundary:
          "Owns the assignment/optimization decision; does not own the FSM system " +
          "of record, the parts inventory, or the technician's repair workflow.",
        humanAccountabilityPoint: "Field Service Operations Director / Dispatch Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "governed_service_knowledge_layer",
        name: "Governed service-knowledge layer (manuals + fault-to-part)",
        description:
          "A single governed knowledge source — service manuals, schematics, " +
          "fault-to-part mapping, and resolution history, owned and freshness-" +
          "SLA'd — that feeds technician copilots, remote diagnostics, and " +
          "customer self-service alike, so every AI bet draws from one current truth.",
        boundary:
          "Owns content authoring, freshness, and fault-to-part accuracy; does " +
          "not own the surfaces (copilot, portal, diagnostics) that consume it.",
        humanAccountabilityPoint: "Service Knowledge / Engineering Content Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "installed_base_service_spine",
        name: "Installed-base & contract service spine",
        description:
          "A unified installed-base registry linking each asset to its service " +
          "history, warranty/contract coverage, connectivity, and SLA tier — the " +
          "foundation that lets service be run as a margin engine (attach/renewal " +
          "targeting, uptime contracts) and that every predictive and dispatch " +
          "bet reads and writes against.",
        boundary:
          "Owns asset-to-contract-to-history linkage and coverage state; does not " +
          "own field execution, billing, or the diagnostics models that consume it.",
        humanAccountabilityPoint: "Service P&L Owner / Installed-Base Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Value comes from two engines that must be held together. The OPERATIONAL " +
        "engine attacks the two truth metrics: first-time fix and truck-roll " +
        "avoidance. Skills-and-parts-aware scheduling and a technician copilot are " +
        "the fastest, lowest-risk wins — right tech, right part, right fix, first " +
        "time — compressing repeat visits and cost-to-serve. Remote diagnostics " +
        "and predictive maintenance remove or pre-empt the truck roll entirely — " +
        "the largest prize — but ROI is real only where sensor coverage, " +
        "connectivity, and the parts chain can actually act on the signal. The " +
        "COMMERCIAL engine turns operational quality into margin: better felt " +
        "service (FTF, uptime) lifts contract attach and renewal, moving service " +
        "from cost center to profit center. Self-service deflection is the " +
        "cheapest path but the most fragile — it pays only as far as it genuinely " +
        "resolves, and erodes the moment it degrades resolution. The durable " +
        "program fixes first-time fix and parts data first, layers predictive on " +
        "a connected base, and books the margin in attach/renewal — watching " +
        "repeat-visit rate and effort score on every move.",
      dominantHaircutFactors: [
        {
          factor: "Sensor / connectivity / parts-chain readiness (predictive cap)",
          rationale:
            "Predictive-maintenance and remote-diagnostics value is capped by " +
            "how much of the installed base is connected and whether the parts " +
            "and dispatch chain can act on an alert before failure; thin coverage " +
            "or a slow parts chain strands the value regardless of model quality.",
          typicalHaircut: {
            low: 0.25,
            high: 0.55,
            basis:
              "Observed gap between predictive-pilot promise and realized uptime/" +
              "truck-roll value once connectivity and parts logistics are accounted",
            label: "planning-range",
          },
        },
        {
          factor: "Parts-data / fault-to-part quality",
          rationale:
            "First-time fix and parts-availability gains are capped by the " +
            "accuracy of fault-to-part mapping and van-stock data; the best " +
            "scheduler still sends a tech without the right part if the parts " +
            "data is wrong.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Implementation experience where parts-data gaps limited first-" +
              "time-fix and van-stock optimization value",
            label: "planning-range",
          },
        },
        {
          factor: "Deflection / resolution erosion",
          rationale:
            "Self-service deflection savings overstate when issues re-surface as " +
            "cases or truck rolls; the realizable cost saving is materially below " +
            "the headline deflection number once downstream dispatch is netted out.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Gap between reported deflection and net cost-to-serve improvement " +
              "once re-surfaced cases and dispatches are removed",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "First-time-fix uplift (scheduling + copilot + parts)",
          range: {
            low: 0.05,
            high: 0.15,
            basis:
              "Absolute FTF percentage-point gains from skills/parts-aware " +
              "dispatch and technician copilot programs",
            label: "planning-range",
          },
          measuredAs: "Absolute lift in first_time_fix_rate",
        },
        {
          lever: "Truck-roll reduction (remote + predictive)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported reductions in truck-rolls-per-resolution from remote " +
              "resolution and pre-emptive dispatch, net of re-surfaced visits",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in truck_rolls_per_resolution",
        },
        {
          lever: "Service-contract renewal / attach uplift",
          range: {
            low: 0.03,
            high: 0.1,
            basis:
              "Renewal/attach percentage-point gains attributable to improved " +
              "felt service quality (FTF, uptime); attribution is loose",
            label: "planning-range",
          },
          measuredAs:
            "Absolute lift in service_contract_attach_renewal",
        },
      ],
      timeToValueBand:
        "Scheduling optimization and technician copilot: 1-2 quarters (overlay on " +
        "existing FSM). Customer self-service: 2-3 quarters including knowledge " +
        "curation. Remote diagnostics and predictive maintenance: 3-6+ quarters, " +
        "gated by connectivity rollout and parts-chain readiness. Contract " +
        "attach/renewal effects compound over 2-4 quarters as service quality lifts.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Field service management (FSM)",
          role:
            "Work-order, dispatch, scheduling, technician mobile, and parts/van-" +
            "stock — the operational core field service runs on.",
          examples: [
            "Salesforce Field Service",
            "ServiceNow Field Service Management",
            "SAP Field Service Management",
            "IFS Field Service Management",
            "Oracle Field Service",
          ],
        },
        {
          name: "Customer service management (CSM) / CRM case",
          role:
            "System of record for customer, case/ticket state, and service " +
            "history across channels.",
          examples: [
            "ServiceNow CSM",
            "Salesforce Service Cloud",
            "Zendesk",
            "Microsoft Dynamics 365 Customer Service",
          ],
        },
        {
          name: "Service contract / warranty & installed base",
          role:
            "Registry of assets, warranty/contract coverage, entitlements, and " +
            "SLA tiers — the spine for running service as a margin engine.",
          examples: [
            "SAP Service & Asset Management",
            "Oracle Service Contracts",
            "Salesforce Service Cloud (Asset & Entitlement)",
            "PTC Servigistics (parts/warranty)",
          ],
        },
        {
          name: "Connected-asset / IoT & remote monitoring",
          role:
            "Asset telemetry, remote diagnostics, and predictive-maintenance " +
            "models for connected service.",
          examples: [
            "PTC ThingWorx",
            "Microsoft Azure IoT",
            "AWS IoT",
            "GE Digital APM",
          ],
        },
        {
          name: "Service knowledge / parts & logistics",
          role:
            "Service manuals, schematics, fault-to-part mapping, and service-" +
            "parts planning that feed copilots, diagnostics, and van-stock.",
          examples: [
            "ServiceNow Knowledge Management",
            "PTC Servigistics (service-parts management)",
            "Syncron Service Parts",
            "Confluence (engineering content)",
          ],
        },
      ],
      roles: [
        {
          title: "VP Service / Chief Service Officer (Service P&L owner)",
          accountability:
            "End-to-end service economics — cost-to-serve, contract margin, " +
            "attach/renewal, and customer retention.",
        },
        {
          title: "Field Service Operations Director",
          accountability:
            "Dispatch, scheduling, technician productivity, first-time fix, and " +
            "SLA attainment.",
        },
        {
          title: "Customer Service / Support Operations Leader",
          accountability:
            "Case management, self-service deflection, CSAT/effort, and case " +
            "resolution quality.",
        },
        {
          title: "Connected Service / Reliability Lead",
          accountability:
            "Remote diagnostics, predictive maintenance, and connected-asset " +
            "uptime.",
        },
        {
          title: "Service Parts & Logistics Lead",
          accountability:
            "Fault-to-part data, van-stock optimization, and parts availability " +
            "at first visit.",
        },
        {
          title: "Service Knowledge / Engineering Content Lead",
          accountability:
            "Freshness and accuracy of manuals, schematics, and fault-to-part " +
            "mapping.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Equipment & worker safety standards (e.g. OSHA, IEC/UL, medical-device servicing rules)",
          relevance:
            "Field repairs on regulated or hazardous equipment must follow " +
            "verified, certified procedures; AI-guided repair must not substitute " +
            "generative guesses for safety-critical steps, and technician " +
            "certification gates who can perform a job.",
        },
        {
          name: "Medical-device service & post-market obligations (e.g. FDA QSR/21 CFR 820, MDR)",
          relevance:
            "Servicing medical devices carries documentation, traceability, and " +
            "post-market surveillance obligations; service records and " +
            "predictive interventions are part of the regulated quality system.",
        },
        {
          name: "Consumer-protection & warranty law (e.g. Magnuson-Moss, EU consumer-rights)",
          relevance:
            "Warranty eligibility and service-contract communications must be " +
            "accurate and non-deceptive; automated entitlement answers carry " +
            "conduct and warranty-law risk.",
        },
        {
          name: "Connected-asset data privacy & cyber-physical security (e.g. GDPR, IEC 62443)",
          relevance:
            "Remote monitoring and remote-access service collect and act on asset/" +
            "site data and can affect physical operation — privacy, lawful basis, " +
            "and OT/cyber-physical security controls apply.",
        },
      ],
      canonicalTerms: [
        {
          term: "First-time fix (FTF)",
          definition:
            "An issue fully resolved on the first visit with no follow-up " +
            "dispatch for the same fault — honest only when it nets out re-opened jobs.",
        },
        {
          term: "Truck roll",
          definition:
            "A physical technician site visit — the most expensive unit of " +
            "service (labor + travel + vehicle); avoiding the second one is the prize.",
        },
        {
          term: "Wrench time",
          definition:
            "The share of a technician's paid time spent on productive on-site " +
            "repair work, versus travel, idle, and admin.",
        },
        {
          term: "Van stock",
          definition:
            "The parts inventory a technician carries; van-stock optimization " +
            "raises parts availability at first visit.",
        },
        {
          term: "Contract attach / renewal",
          definition:
            "The share of the installed base covered by a paid service contract " +
            "(attach) and the share of expiring contracts renewed — the recurring " +
            "service-revenue engine.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "First-time-fix rate",
        authoritativeSource:
          "FSM work-order records linked by asset + fault over a trailing window, " +
          "with repeat-dispatch detection",
        whatGoodEvidenceLooksLike:
          "FTF measured net of jobs re-opened for the same fault within the " +
          "window, with the matching repeat-visit rate shown alongside, by asset class.",
        weakEvidenceToReject:
          "A dispatch-board 'fixed on first visit' flag set by the technician at " +
          "closure, with no re-open netting and no repeat-visit cross-check.",
      },
      {
        claim: "Truck-roll / cost-to-serve reduction",
        authoritativeSource:
          "FSM dispatch counts per resolved issue and fully-loaded service cost " +
          "centers divided by resolved volume from the GL",
        whatGoodEvidenceLooksLike:
          "A reconciliation showing truck rolls genuinely removed (remote/first-" +
          "time fix), tied back to the blended cost-to-serve trend, net of re-" +
          "surfaced visits.",
        weakEvidenceToReject:
          "Projected savings extrapolated from a deflection or remote-resolution " +
          "percentage alone, never tied to the actual dispatch count or cost line.",
      },
      {
        claim: "Predictive-maintenance uptime impact",
        authoritativeSource:
          "Connected-asset telemetry and downtime logs measured against " +
          "contracted availability, with pre-emptive-vs-emergency work-order tagging",
        whatGoodEvidenceLooksLike:
          "A controlled comparison of uptime and emergency truck rolls on " +
          "connected vs unconnected assets, with the share of alerts actually " +
          "actioned before failure.",
        weakEvidenceToReject:
          "A vendor 'up to X% downtime reduction' with no connectivity coverage, " +
          "action rate, or control population.",
      },
      {
        claim: "Service-contract margin & renewal",
        authoritativeSource:
          "Installed-base registry joined to contract records (CRM/ERP service " +
          "contracts) and the service P&L",
        whatGoodEvidenceLooksLike:
          "Attach and renewal rates on the installed base with contract margin, " +
          "and a link from felt service quality (FTF/uptime) to renewal cohort " +
          "behavior.",
        weakEvidenceToReject:
          "A blended service-revenue number with no installed-base penetration, " +
          "margin, or renewal-cohort view.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "How is first-time fix defined — does it net out jobs re-opened for the same fault within the window — and what is your repeat-visit rate alongside it?",
      "What is your truck-rolls-per-resolution, and can you reconcile claimed remote/deflection savings to the actual dispatch count and cost-to-serve line?",
      "What share of your truck rolls fail for a missing part, and how good is your fault-to-part mapping and van-stock optimization?",
      "What share of your installed base is connected, and when a predictive alert fires, can the parts and dispatch chain act before failure?",
      "Is service run as a cost center on utilization, or do you see service-contract margin, attach, and renewal — and who owns that P&L?",
      "Of issues deflected to self-service, what share re-surface as a case or a dispatch, and do you measure effort score for the deflected cohort?",
      "Does your scheduling consider skill, certification, and parts availability — not just location and utilization — and how often does a job need a second tech to complete?",
    ],
    maturitySignals: [
      "First-time fix is measured net of re-opened jobs, with repeat-visit rate tracked as the integrity check, by asset class.",
      "Service is run as a P&L with contract margin, attach, and renewal visible alongside cost-to-serve.",
      "Fault-to-part mapping and van-stock are demand-optimized, and parts availability at first visit is a tracked KPI.",
      "Predictive alerts trigger pre-emptive, parts-ready work orders on a meaningfully connected installed base.",
      "Self-service deflection is measured net of re-surfaced cases and dispatches, with effort score segmented by journey.",
    ],
    redFlags: [
      "First-time fix is reported high while repeat-visit rate is unmeasured or rising — jobs are being closed, not fixed.",
      "Truck rolls fail frequently for missing parts and there is no reliable fault-to-part mapping or van-stock optimization.",
      "Predictive-maintenance pilots generate alerts no one can act on — low connectivity coverage and a parts chain that can't pre-empt.",
      "Service is measured on utilization alone with no view of contract margin, attach, or renewal.",
      "Self-service deflection is rising while downstream case/dispatch volume for the same issues is also rising.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "FSM platform (Salesforce Field Service, ServiceNow FSM, SAP FSM, IFS, Oracle Field Service)",
        category: "Field service management / dispatch / scheduling",
        switchingCost:
          "High — work-order data, scheduling logic, technician mobile, parts/" +
          "van-stock, and deep ERP/CRM integration make replacement a multi-" +
          "quarter program; suite-native (Salesforce/ServiceNow) raises lock-in further.",
        renewalDynamics:
          "Multi-year seat/technician commitments; incumbents bundle native " +
          "AI scheduling and copilot add-ons at renewal to defend the account.",
      },
      {
        vendorName: "CSM / CRM case (ServiceNow CSM, Salesforce Service Cloud, Zendesk)",
        category: "System of record / case + service knowledge",
        switchingCost:
          "Very high — the customer and case system of record with deep " +
          "integration and embedded knowledge; rarely sourced for service in isolation.",
        renewalDynamics:
          "Enterprise agreements; embedded AI (Now Assist, Einstein) bundled to " +
          "extend the platform and raise switching cost further.",
      },
      {
        vendorName: "Connected-asset / predictive (PTC ThingWorx, GE Digital APM, Azure/AWS IoT)",
        category: "IoT / remote diagnostics / predictive maintenance",
        switchingCost:
          "Moderate-to-high — device firmware integration and trained models are " +
          "sticky, but the analytics layer is more portable than the asset connectivity.",
        renewalDynamics:
          "Per-asset or consumption pricing; press for proof of actioned alerts " +
          "and realized uptime before scaling beyond pilot.",
      },
      {
        vendorName: "Service-parts & van-stock (PTC Servigistics, Syncron, SAP)",
        category: "Service-parts planning / van-stock optimization",
        switchingCost:
          "Moderate — forecasting models and fault-to-part data take effort to " +
          "rebuild, but the layer is replaceable independently of the FSM core.",
        renewalDynamics:
          "Subscription pricing tied to SKUs/assets; outcome terms on parts-" +
          "availability-at-first-visit are negotiable.",
      },
    ],
    switchingCosts:
      "The CSM/system-of-record and FSM core are the high-lock-in layers; the " +
      "value frontier (predictive/connected, scheduling optimization, parts " +
      "forecasting) sits in moderate-switching-cost layers where outcome-based " +
      "terms and exit rights are negotiable. Beware incumbent native-AI bundling " +
      "that quietly re-locks the stack at renewal and discourages best-of-breed " +
      "predictive or parts tools.",
    negotiationLevers: [
      "Outcome pricing tied to net (re-open-adjusted) first-time fix and truck-roll reduction, not raw utilization",
      "Proof of actioned predictive alerts and realized uptime in a controlled pilot before per-asset scale-up",
      "Parts-availability-at-first-visit SLAs on van-stock/parts-planning vendors",
      "Data and model portability (telemetry, fault-to-part, embeddings) + exit rights to avoid lock-in",
      "Unbundle native AI scheduling/copilot from the FSM core renewal to keep best-of-breed leverage",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      first_time_fix_claim: [
        "work orders linked by asset + fault",
        "re-open window netting",
        "matching repeat-visit rate",
      ],
      truck_roll_claim: [
        "dispatch count per resolved issue",
        "remote/first-visit resolution flag",
        "reconciliation to cost-to-serve line",
      ],
      uptime_claim: [
        "connected-asset telemetry vs contracted availability",
        "pre-emptive-vs-emergency work-order tagging",
        "alert action-rate and control population",
      ],
      parts_claim: [
        "fault-to-part mapping",
        "parts-availability-at-first-visit",
        "return-trip-for-parts flag",
      ],
      contract_margin_claim: [
        "installed-base registry joined to contracts",
        "attach/renewal by cohort",
        "service-contract margin",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors",
      ],
    },
    citationStandard:
      "Quantitative service claims cite the FSM/CSM/telemetry/GL source and the " +
      "period, and first-time fix is always stated net of re-opened jobs with " +
      "the matching repeat-visit rate. Truck-roll and cost-to-serve claims tie " +
      "back to the dispatch count and the GL cost line; uptime claims cite the " +
      "alert action-rate, not just predicted failures. Value projections cite a " +
      "baseline plus a labelled planning range and the haircut factors applied — " +
      "never a single asserted savings or ROI number, and never a vendor " +
      "'up to X%' figure without a baseline and control.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant reports first-time fix without re-open netting — frame it as likely overstated and ask for the repeat-visit rate.",
      "Predictive-maintenance value is cited without connectivity coverage or an alert action-rate — flag the value as gated on sensor/parts readiness.",
      "Self-service deflection is reported without downstream case/dispatch netting — note the saving is likely recycled cost.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges, not their numbers.",
    ],
    inferenceLanguage: [
      "Across field-service operations at this scale, first-time fix typically runs...",
      "Without your repeat-visit data, the industry pattern is that reported first-time fix overstates true resolution by...",
      "Predictive-maintenance ROI is real but gated — peer programs realize it only where connectivity and the parts chain can act...",
      "As an industry pattern (not your measured figure)...",
    ],
    flagWithoutEvidence: [
      "A specific cost-to-serve saving or ROI for this tenant",
      "This tenant's actual net first-time-fix or repeat-visit rate",
      "A claim that predictive maintenance will lift uptime for this tenant's specific connectivity and parts-chain reality",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "where AI fits across service / remote vs schedule vs predict vs deflect by issue type",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap issue/asset class x lever (remote/schedule/predict/deflect) shaded by net value and resolution risk.",
    },
    {
      questionPattern: "cost-to-serve breakdown / where field cost concentrates (truck rolls, parts, travel)",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack fully-loaded cost per case by component (labor, travel, parts, return trips) to show where truck-roll economics bite.",
    },
    {
      questionPattern: "value of a first-time-fix / truck-roll-avoidance program / savings bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross truck-roll/deflection saving to net cost-to-serve with parts-data, connectivity, and re-surface haircuts.",
    },
    {
      questionPattern: "first-time fix vs repeat-visit trend / are we closing jobs or fixing them",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Dual-trend first_time_fix_rate and repeat_visit_rate over time to expose false-first-time-fix.",
    },
    {
      questionPattern: "service KPI scorecard",
      exhibitKind: "table",
      note: "FTF, MTTR, truck rolls/resolution, utilization, SLA attainment, parts availability, cost-to-serve, contract attach/renewal vs planning ranges.",
    },
    {
      questionPattern: "what drives value at risk in this program / haircut sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of haircut factors (connectivity/parts readiness, parts-data quality, deflection erosion) on realizable value.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "First-time fix and parts data fixed first — the truth metrics and the gate on every downstream bet",
      "Skills- and parts-aware scheduling sequenced early — fast, low-risk wins on FTF and truck rolls",
      "Predictive/connected layered only on a meaningfully connected base with a parts chain that can act on alerts",
      "Service run as a P&L so operational quality is booked as contract attach, renewal, and margin",
      "First-time fix measured net of re-opens, deflection net of re-surfaced dispatches, with effort score watched throughout",
    ],
    failureDrivers: [
      "False first-time fix from close-the-job incentives — repeat visits and cost-to-serve erase the headline gain",
      "Predictive-maintenance pilots that never scale because connectivity is thin or the parts chain can't pre-empt",
      "Parts-data gaps that defeat even a perfect scheduler — the right tech without the right part still fails",
      "Self-service deflection that degrades resolution and re-surfaces as costly truck rolls and churn",
      "Service run as a cost center on utilization alone, starving the investment that lifts attach, renewal, and uptime",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Scheduling optimization and technician copilot adopt fastest because they " +
      "visibly help dispatchers and technicians and show up in first-time fix and " +
      "wrench time within a quarter; less-tenured techs benefit most. Customer " +
      "self-service scales issue-by-issue as net deflection and effort score hold. " +
      "Remote diagnostics and predictive maintenance adopt slowest — gated by " +
      "connectivity rollout, sensor coverage, and a parts/dispatch chain able to " +
      "act on alerts — and scale only as actioned-alert rates and uptime prove out.",
    roiClarity: "medium",
    roiClarityBasis:
      "First-time-fix and truck-roll value is directly measurable in FSM dispatch " +
      "counts and cleanly attributable when re-opens are netted out. Predictive/" +
      "uptime ROI is firm only where alert action-rates and connected-vs-" +
      "unconnected comparisons exist — without that it is routinely overstated. " +
      "Contract-margin and retention effects are real but loosely attributable to " +
      "felt service quality, which is what holds overall clarity at medium.",
  },

  regulatoryFrame: {
    name: "Equipment/worker safety + warranty & connected-asset data obligations",
    relevance:
      "The dominant regulatory frame for AI in service delivery: field repairs " +
      "on regulated or hazardous equipment must follow verified, certified " +
      "procedures (safety standards; medical-device QSR/MDR where applicable), so " +
      "AI repair guidance must not substitute generative guesses for safety-" +
      "critical steps. Warranty/entitlement answers carry consumer-protection and " +
      "warranty-law conduct risk, and connected-asset monitoring carries data-" +
      "privacy and cyber-physical security obligations (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
