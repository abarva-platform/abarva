// Consilium expert — Cloud & Infrastructure Modernization + FinOps (cross-cutting TRANSFORM-IT / cloud-economics layer).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It answers the
// question every infrastructure, platform, and cloud leader is asking: "across
// the cloud and infrastructure estate — migration and landing zones,
// hybrid/multi-cloud, infrastructure modernization (re-architecture, IaC,
// containers/platform engineering), cloud cost optimization (FinOps),
// resilience/DR, and sustainability — how do I actually realize cloud
// economics and agility WITHOUT just relocating the data center, where do the
// savings really come from, and how do I tell a genuinely modernized estate
// from a lifted-and-shifted one wearing a cloud badge?"
//
// Honesty doctrine. This expert is built around three non-negotiable truths the
// cloud world keeps re-learning. First, lift-and-shift WITHOUT re-architecture
// does NOT deliver cloud economics: relocating a VM-for-VM workload to the
// cloud typically RAISES run-rate cost and delivers none of the elasticity,
// managed-service, or autoscaling benefit — the savings come from
// re-architecting (managed services, autoscaling, decommissioning) and from
// FinOps discipline, not from the migration itself. Second, FinOps — not
// migration — is where the savings come from: cloud cost is pay-as-you-go and
// drifts upward continuously through idle/oversized resources, missing
// commitment coverage, and unattributed spend, so cost control is a standing
// engineering practice, never a one-time clean-up. Third, migration risk and
// SKILLS gate the pace: a multi-cloud, IaC, platform-engineering operating
// model demands scarce skills, and migrations fail on dependency surprises,
// data gravity, and change-freeze fatigue more than on technology — so the
// honest plan paces to skills and risk, not to a board deadline. The expert
// refuses the "we moved to the cloud therefore we saved money" leap and insists
// on re-architecture vs lift-shift accounting, FinOps as a continuous practice,
// and skills/risk-paced migration before any cloud business case lands.
//
// DISTINCT from the IT Operations & Service Management expert (the RUN-IT /
// service-management layer — incident/problem/change, service desk, AIOps,
// CMDB) and from the IT Spend Optimization / TBM expert (whole-IT cost and
// vendor rationalization across the full technology budget). This expert is the
// CLOUD / INFRASTRUCTURE TRANSFORM + cloud-economics (FinOps) layer
// specifically — it supports an IT investment / spend module (Tower).

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const cloudInfrastructureModernizationExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.cloud-infrastructure-modernization",
    expertName:
      "Cloud & Infrastructure Modernization + FinOps Expert (cloud economics / landing zones / platform engineering)",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "cloud-infrastructure-modernization",
    scopeNote:
      "Horizontal across every enterprise IT organization and industry: the " +
      "cloud and infrastructure TRANSFORM layer — cloud migration and landing " +
      "zones, hybrid and multi-cloud, infrastructure modernization " +
      "(re-architecture, infrastructure-as-code, containers and platform " +
      "engineering), cloud cost optimization (FinOps), resilience and disaster " +
      "recovery, and sustainability / carbon-efficient infrastructure. It " +
      "answers how an enterprise realizes cloud economics and agility, held to " +
      "three honest positions: lift-and-shift without re-architecture fails to " +
      "deliver cloud economics, FinOps discipline (not the migration itself) is " +
      "where savings come from, and migration risk and skills gate the pace. It " +
      "supports an IT investment / spend module (Tower). Explicitly DISTINCT " +
      "from the IT Operations & Service Management expert (the RUN-IT / " +
      "service-management layer — incident/problem/change, service desk, AIOps, " +
      "CMDB), and from the IT Spend Optimization / TBM expert (whole-IT cost and " +
      "vendor rationalization across the entire technology budget); this expert " +
      "is the cloud/infrastructure transform and cloud-economics (FinOps) slice " +
      "specifically. Excludes application-layer SDLC modernization (a separate " +
      "engineering-productivity expert) and security architecture (a separate " +
      "cybersecurity expert) beyond the resilience and landing-zone guardrails noted here.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "workloads_in_cloud_pct",
        name: "Share of workloads in cloud",
        definition:
          "Share of in-scope workloads (applications, infrastructure footprints) " +
          "running on public cloud or modern managed platforms versus legacy " +
          "on-premises/data-center hosting — the headline migration-progress signal.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 90,
          basis:
            "Enterprise cloud penetration varies widely by industry and legacy " +
            "estate weight — many large regulated enterprises sit between a third " +
            "and the high-eighties of workloads; the directional ask is upward, but " +
            "100% is rarely the right target given regulated/latency-bound workloads",
          label: "planning-range",
        },
        dataSource:
          "Estate / migration tracker reconciled to CMDB and cloud account inventory (e.g. migration factory tooling, ServiceNow CMDB, cloud asset inventory)",
        whyItMatters:
          "The progress headline for cloud adoption — but dangerous read alone. " +
          "High cloud penetration achieved by lift-and-shift can RAISE cost and " +
          "deliver no agility, so it must be read with % re-architected and cloud unit-cost trend.",
      },
      {
        key: "rearchitected_vs_liftshift_pct",
        name: "Share re-architected (vs lift-and-shift)",
        definition:
          "Share of migrated workloads that were re-architected (re-platformed to " +
          "managed services, refactored, or rebuilt cloud-native) versus simply " +
          "re-hosted (lift-and-shift) — the honesty check on whether cloud " +
          "economics were actually unlocked.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Most enterprise migrations are dominated by re-host (lift-and-shift) " +
            "for speed; a re-architected share in the low-tens-to-low-sixties band " +
            "reflects how far the estate actually captured managed-service and " +
            "elasticity economics versus relocating VMs",
          label: "planning-range",
        },
        dataSource:
          "Migration disposition records (the 6/7-Rs: rehost/replatform/refactor/etc.) reconciled to the workload inventory",
        whyItMatters:
          "The single most important honesty metric for cloud economics. " +
          "Lift-and-shift relocates cost; re-architecture (managed services, " +
          "autoscaling, decommissioning) is what delivers the savings and agility " +
          "— a high cloud share with a low re-architected share is a relocated data center.",
      },
      {
        key: "cloud_unit_cost_trend",
        name: "Cloud unit-cost trend",
        definition:
          "Trend in cloud cost per unit of business or technical output (e.g. cost " +
          "per transaction, per customer, per workload, per environment) over time " +
          "— the efficiency signal that strips out growth from genuine optimization.",
        unit: "% change in cost-per-unit period-over-period",
        directionOfGood: "lower",
        benchmarkRange: {
          low: -15,
          high: 5,
          basis:
            "A FinOps-mature estate drives unit cost DOWN year over year even as " +
            "total spend grows with the business; a flat-to-slightly-rising unit " +
            "cost signals optimization not keeping pace with growth",
          label: "planning-range",
        },
        dataSource:
          "Cloud billing/usage normalized by a business/technical output metric (e.g. cost per transaction from FinOps + product telemetry)",
        whyItMatters:
          "The metric that separates 'we spent less' from 'we got more efficient'. " +
          "Total cloud spend usually rises with the business; unit cost falling is " +
          "the honest proof FinOps and re-architecture are working — total spend alone misleads.",
      },
      {
        key: "cloud_cost_variance_to_budget",
        name: "Cloud cost variance to budget",
        definition:
          "Variance between actual cloud spend and budget/forecast for the period " +
          "— the headline FinOps control signal on cloud cost sprawl.",
        unit: "% over/under budget",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: -5,
          high: 10,
          basis:
            "FinOps-mature orgs hold variance within a tight band; persistent " +
            "double-digit overruns signal sprawl, weak forecasting, or unattributed spend",
          label: "planning-range",
        },
        dataSource:
          "Cloud billing + FinOps platform vs budget/forecast (e.g. AWS Cost Explorer, Azure Cost Management, Apptio Cloudability, CloudHealth)",
        whyItMatters:
          "Cloud's pay-as-you-go model drifts upward continuously. Tracked " +
          "IN-RANGE (over-spend is bad, but chronic under-spend can mean stalled " +
          "delivery); forecasting accuracy here is itself a FinOps maturity signal.",
      },
      {
        key: "committed_use_coverage",
        name: "Committed-use / reservation coverage",
        definition:
          "Share of eligible steady-state cloud usage covered by commitment-based " +
          "discounts (reserved instances, savings plans, committed-use discounts) " +
          "versus paid at on-demand rates — a primary structural FinOps cost lever.",
        unit: "% of eligible usage covered",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Mature FinOps practices cover the majority of stable workloads with " +
            "commitments while leaving headroom for elasticity; very low coverage " +
            "leaves discount on the table, while over-committing risks paying for unused reservations",
          label: "planning-range",
        },
        dataSource:
          "Cloud billing commitment/coverage reports (reservation, savings-plan, committed-use utilization and coverage)",
        whyItMatters:
          "One of the largest, lowest-risk structural savings levers — but it has " +
          "a ceiling and a downside: over-committing on volatile workloads pays for " +
          "idle reservations, so coverage is read WITH utilization, not maximized blindly.",
      },
      {
        key: "idle_waste_pct",
        name: "Idle / waste percentage",
        definition:
          "Share of cloud spend on idle, oversized, orphaned, or otherwise " +
          "non-productive resources (stopped-but-billed, oversized instances, " +
          "unattached storage, abandoned environments) — the addressable-waste signal.",
        unit: "% of spend that is addressable waste",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "Un-optimized cloud estates commonly carry a meaningful share of " +
            "addressable waste; continuous FinOps rightsizing and cleanup compress " +
            "it, but some buffer is intentional for elasticity and resilience",
          label: "planning-range",
        },
        dataSource:
          "FinOps optimization findings (rightsizing, idle/orphaned-resource, storage-tiering recommendations) vs total spend",
        whyItMatters:
          "The clearest pool of structural savings and the most actionable FinOps " +
          "output — but waste removed is only real once ACTIONED with owner " +
          "confirmation, not booked from a recommendation report nobody implemented.",
      },
      {
        key: "iac_coverage",
        name: "Infrastructure-as-code coverage",
        definition:
          "Share of infrastructure provisioned and managed declaratively through " +
          "infrastructure-as-code (vs manual/click-ops) — the foundation for " +
          "repeatable, governed, drift-free cloud operations and platform engineering.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Platform-engineering-mature estates manage most infrastructure as " +
            "code; lower coverage leaves manual, drift-prone, hard-to-govern " +
            "provisioning that caps automation, guardrails, and cost-control reliability",
          label: "planning-range",
        },
        dataSource:
          "IaC repository/state coverage vs provisioned resources (e.g. Terraform/OpenTofu state, Bicep/CloudFormation, config-management inventory)",
        whyItMatters:
          "The enabling foundation: governed landing zones, automated guardrails, " +
          "repeatable DR, and reliable cost controls all rest on infrastructure being " +
          "code, not clicks. Low IaC coverage caps the realizable value of nearly every other bet.",
      },
      {
        key: "migration_on_time_pct",
        name: "Migration on-time / on-plan percentage",
        definition:
          "Share of migration waves/workloads completed on or ahead of the planned " +
          "schedule (and within the planned cutover window) — the delivery-health " +
          "signal for the migration program.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Migration programs frequently slip on dependency surprises, data " +
            "gravity, and change-freeze constraints; a healthy program lands the " +
            "majority of waves on plan, but optimistic plans routinely miss",
          label: "planning-range",
        },
        dataSource:
          "Migration factory / program tracker (planned vs actual wave completion and cutover dates)",
        whyItMatters:
          "The honest pace signal. Chronic slippage usually means dependency or " +
          "skills gaps were underestimated — and a program rushed back on-schedule " +
          "by skipping re-architecture or DR validation trades real value for a date.",
      },
      {
        key: "mttr_infrastructure",
        name: "Mean time to recover (infrastructure / DR)",
        definition:
          "Average time to recover a critical service or environment after an " +
          "infrastructure failure or disaster-recovery event — the resilience " +
          "outcome behind recovery commitments (RTO).",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.25,
          high: 8,
          basis:
            "Cloud-native, IaC-driven, automated-failover estates recover critical " +
            "services in minutes to a couple of hours; manual, untested DR for " +
            "complex legacy can take many hours or fail outright at the moment of need",
          label: "planning-range",
        },
        dataSource:
          "DR test records and real-recovery incident timelines vs recovery-time objective (RTO) per critical service",
        whyItMatters:
          "Cloud and IaC make automated, regularly-tested recovery achievable — " +
          "but only if DR is actually exercised. A recovery plan that has never " +
          "been tested is a hope, not a capability; this metric must come from real tests.",
      },
      {
        key: "service_availability",
        name: "Service availability / uptime",
        definition:
          "Share of time critical services are available and meeting their " +
          "performance threshold over a period — the reliability outcome that a " +
          "modernized, resilient cloud architecture is meant to protect or improve.",
        unit: "% (e.g. 99.9)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 99,
          high: 99.99,
          basis:
            "Business-critical services target three-to-four-nines; the cost and " +
            "engineering to add each nine rises steeply, so the target is per-service " +
            "and resilience architecture (multi-AZ/region) is a deliberate trade-off",
          label: "planning-range",
        },
        dataSource:
          "Observability / synthetic monitoring uptime per service (e.g. Datadog, Dynatrace, cloud-native SLO tooling)",
        whyItMatters:
          "The reliability promise modernization must protect, not erode. " +
          "Re-architecture for resilience (multi-AZ, autoscaling, managed services) " +
          "should hold or raise availability — a migration that drops uptime has traded resilience for speed.",
      },
      {
        key: "carbon_per_workload",
        name: "Carbon per workload (infrastructure carbon intensity)",
        definition:
          "Estimated carbon emissions attributable to running a workload or unit " +
          "of compute (e.g. kg CO2e per workload or per compute-hour) — the " +
          "sustainability signal for the infrastructure estate.",
        unit: "kg CO2e per workload (or per compute-unit)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 100,
          basis:
            "Highly workload- and region-dependent; right-sizing, modern instance " +
            "families, region/carbon-aware placement, and managed services lower it, " +
            "but absolute figures vary enormously by workload — directional improvement is the ask",
          label: "planning-range",
        },
        dataSource:
          "Cloud-provider carbon/emissions tooling and estimation models joined to workload usage (e.g. provider carbon dashboards, emissions estimation tools)",
        whyItMatters:
          "Sustainability is increasingly a board and disclosure obligation, and " +
          "cloud efficiency and carbon efficiency overlap heavily — right-sizing and " +
          "modern instances cut both cost and carbon. The figures are estimates, so claims must be hedged as such.",
      },
      {
        key: "rightsizing_utilization",
        name: "Compute utilization / rightsizing efficiency",
        definition:
          "Average utilization of provisioned compute (CPU/memory) against " +
          "allocated capacity — the efficiency signal that exposes systematic " +
          "over-provisioning carried over from on-premises sizing habits.",
        unit: "% average utilization",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 40,
          high: 75,
          basis:
            "Healthy utilization leaves headroom for spikes and resilience while " +
            "avoiding chronic over-provisioning; very low utilization signals " +
            "lift-and-shift oversizing, while very high signals risk of throttling/instability",
          label: "planning-range",
        },
        dataSource:
          "Cloud monitoring utilization metrics vs provisioned capacity (rightsizing analysis from FinOps/observability tooling)",
        whyItMatters:
          "Tracked IN-RANGE — chronically low utilization is on-prem sizing habits " +
          "carried into pay-as-you-go (waste), but driving utilization too high " +
          "sacrifices the elasticity headroom and resilience cloud is supposed to buy.",
      },
    ],

    painThemes: [
      {
        key: "liftshift_no_economics",
        name: "Lift-and-shift that never delivers cloud economics",
        description:
          "Workloads are re-hosted VM-for-VM to the cloud for migration speed, " +
          "then left un-re-architected. The estate inherits on-premises sizing and " +
          "always-on patterns at pay-as-you-go rates, so run-rate cost RISES, no " +
          "elasticity or managed-service benefit appears, and the promised cloud " +
          "savings never materialize — a relocated data center wearing a cloud badge.",
        detectionSignal:
          "High cloud-share with a low re-architected share, rising cloud spend " +
          "with flat or rising unit cost, chronic low compute utilization, " +
          "always-on non-production environments, and a business case that booked " +
          "savings the estate never showed.",
        diagnosticQuestion:
          "What share of your migrated workloads were re-architected versus " +
          "lifted-and-shifted, and is your cloud unit cost actually falling — or " +
          "did you relocate the data center and its cost with it?",
      },
      {
        key: "cloud_cost_sprawl",
        name: "Cloud cost sprawl and unattributed spend",
        description:
          "Cloud spend grows faster than budget through idle/oversized resources, " +
          "orphaned assets, missing commitment-discount coverage, and spend that " +
          "cannot be attributed to a team or product — a structural, continuous " +
          "drain of pay-as-you-go consumption rather than a one-time clean-up, " +
          "because anyone can provision and nobody owns the bill.",
        detectionSignal:
          "Persistent double-digit cloud cost variance to budget, large share of " +
          "untagged/unattributed spend, low reserved/savings-plan coverage, high " +
          "idle/oversized-resource findings, no showback/chargeback, and FinOps " +
          "run as a periodic fire-drill not a standing practice.",
        diagnosticQuestion:
          "What is your cloud cost variance to budget, what share of spend is " +
          "untagged or unattributed, what is your commitment coverage and idle " +
          "waste, and is FinOps continuous or a periodic clean-up?",
      },
      {
        key: "skills_gap_pacing",
        name: "Skills gap and operating-model unreadiness pacing the program",
        description:
          "Cloud, IaC, platform-engineering, and FinOps skills are scarce, and the " +
          "operating model (landing zones, guardrails, product teams) is immature, " +
          "so migration and modernization outrun the organization's ability to run " +
          "the estate safely — producing rushed lift-and-shift, un-governed sprawl, " +
          "and a pace set by a board deadline rather than by capability.",
        detectionSignal:
          "Heavy reliance on a few specialists or system integrators, no platform " +
          "team or landing-zone standard, low IaC coverage, repeated migration " +
          "slippage on the same skills/dependency surprises, and modernization " +
          "scope cut to lift-and-shift to hit a date.",
        diagnosticQuestion:
          "Do you have the cloud/IaC/FinOps skills and the platform operating " +
          "model to run this estate, and is your migration pace set by capability " +
          "and risk or by a board deadline?",
      },
      {
        key: "migration_dependency_surprise",
        name: "Migration dependency surprises and data gravity",
        description:
          "Migrations slip and fail when undiscovered application dependencies, " +
          "shared services, and licensing constraints surface mid-cutover, and when " +
          "large datasets and their gravity make moving the data harder than moving " +
          "the compute — turning a planned wave into an extended, risky, " +
          "change-freeze-bound effort.",
        detectionSignal:
          "Low migration on-time %, cutovers extended or rolled back, " +
          "late-discovered dependencies and shared services, data-transfer/egress " +
          "surprises, and a dependency map nobody fully trusts going into a wave.",
        diagnosticQuestion:
          "How complete and trusted is your application-dependency and data-gravity " +
          "discovery, and how often do migration waves slip or roll back on " +
          "surprises you did not see going in?",
      },
      {
        key: "untested_dr_resilience",
        name: "Untested DR and resilience-on-paper",
        description:
          "Disaster-recovery and resilience designs exist on paper (RTO/RPO " +
          "targets, multi-region diagrams) but are rarely or never exercised, so the " +
          "real recovery capability is unknown until a real outage exposes it — and " +
          "cloud's automated, regularly-testable failover is left unused while the " +
          "estate runs on hope.",
        detectionSignal:
          "DR plans that have never been failover-tested, recovery times unknown or " +
          "asserted not measured, single-AZ/region critical workloads, no automated " +
          "failover, and resilience treated as a design artifact rather than a tested capability.",
        diagnosticQuestion:
          "When did you last actually test failover for your critical services, " +
          "what recovery time did the test produce, and is your DR a tested " +
          "capability or a diagram?",
      },
      {
        key: "multicloud_complexity_lockin",
        name: "Multi-cloud complexity and lock-in mismanagement",
        description:
          "Hybrid/multi-cloud is pursued for resilience or negotiating leverage but " +
          "creates duplicated tooling, fragmented skills, inconsistent guardrails, " +
          "and integration debt that often costs more than the lock-in it avoids; " +
          "meanwhile genuine lock-in (data gravity, managed-service dependence) is " +
          "either ignored or over-feared, distorting architecture decisions.",
        detectionSignal:
          "Multiple clouds with duplicated platform/tooling, fragmented and " +
          "thinly-spread skills, inconsistent landing zones/guardrails per cloud, " +
          "high integration burden, and a multi-cloud rationale that is reflexive " +
          "rather than tied to a specific workload or commercial need.",
        diagnosticQuestion:
          "What specific workloads or commercial leverage justify your multi-cloud " +
          "footprint, and is the duplicated tooling, skills, and integration cost " +
          "less than the lock-in risk it is meant to avoid?",
      },
      {
        key: "manual_clickops_drift",
        name: "Manual click-ops, configuration drift, and no guardrails",
        description:
          "Infrastructure is provisioned manually through the console rather than as " +
          "code, so environments drift, configurations are inconsistent and " +
          "un-auditable, guardrails are absent or bypassed, and cost/security " +
          "controls cannot be applied reliably — capping automation, governance, " +
          "and the trustworthiness of every downstream optimization.",
        detectionSignal:
          "Low IaC coverage, frequent configuration drift and snowflake " +
          "environments, manual provisioning, no automated landing-zone guardrails, " +
          "inconsistent tagging, and cost/security policy enforced by review rather than by code.",
        diagnosticQuestion:
          "What share of your infrastructure is managed as code with automated " +
          "guardrails, and how much of your estate is manually provisioned, " +
          "drifting, and un-auditable?",
      },
      {
        key: "sustainability_blindspot",
        name: "Sustainability blind spot in infrastructure decisions",
        description:
          "Infrastructure and cloud-placement decisions ignore carbon intensity " +
          "even as disclosure and board pressure rise, missing the large overlap " +
          "between cost efficiency and carbon efficiency — over-provisioned, " +
          "always-on, carbon-unaware workloads waste both money and emissions, with " +
          "no measurement to manage either.",
        detectionSignal:
          "No carbon measurement per workload, no carbon/region-aware placement, " +
          "sustainability reporting disconnected from infrastructure data, and cost " +
          "optimization pursued with no recognition of the parallel carbon win.",
        diagnosticQuestion:
          "Do you measure carbon per workload, is carbon-aware placement and " +
          "right-sizing part of your cloud decisions, and are your cost and " +
          "sustainability efforts connected or run in separate silos?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_migration_assessment",
        name: "AI-assisted estate discovery, dependency mapping & migration disposition",
        valueMechanism:
          "Analyze infrastructure, application, and dependency data to map the " +
          "estate, discover hidden dependencies and data gravity, and recommend a " +
          "migration disposition (re-host vs re-platform vs re-architect vs retire) " +
          "per workload — de-risking waves and pushing the estate toward " +
          "re-architecture rather than default lift-and-shift. Value shows up as a " +
          "higher re-architected share and higher migration on-time %, NOT as a tool purchase.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Application and infrastructure inventory with dependency/telemetry data",
          "Baseline migration on-time % and re-architected vs lift-shift mix",
          "CMDB/discovery data accurate enough for dependency and blast-radius inference",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Disposition recommendations are advisory — architects own the migration decision and the re-architecture trade-off",
          "Garbage-in: incomplete discovery data produces wrong dependency maps and dangerous cutover plans",
        ],
        metricsMoved: [
          "rearchitected_vs_liftshift_pct",
          "migration_on_time_pct",
          "workloads_in_cloud_pct",
        ],
      },
      {
        key: "finops_cost_intelligence",
        name: "FinOps cost anomaly detection, rightsizing & commitment optimization",
        valueMechanism:
          "Detect cost anomalies, recommend rightsizing and idle/orphaned-resource " +
          "cleanup, optimize commitment (reservation/savings-plan) coverage against " +
          "utilization, and attribute spend to teams/products — turning cloud cost " +
          "control into a continuous, AI-assisted practice. Value is cloud unit cost " +
          "and variance held, commitment coverage right-sized, and structural waste " +
          "removed, as a recommendations engine humans act on, not autonomous spend changes.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Granular cloud billing/usage data with resource tagging",
          "Baseline cloud cost variance, unit-cost trend, idle waste, and commitment coverage",
          "Ownership/attribution mapping (tags → teams/products) for showback/chargeback",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Rightsizing/decommission and commitment-purchase actions need owner confirmation — aggressive cuts degrade service, over-committing pays for idle reservations",
          "Attribution depends on tagging hygiene; untagged spend limits both insight and accountability",
        ],
        metricsMoved: [
          "cloud_cost_variance_to_budget",
          "cloud_unit_cost_trend",
          "idle_waste_pct",
          "committed_use_coverage",
        ],
      },
      {
        key: "ai_iac_generation",
        name: "AI-assisted infrastructure-as-code generation & guardrail authoring",
        valueMechanism:
          "Generate and refactor infrastructure-as-code, landing-zone modules, and " +
          "policy/guardrail definitions from intent, codify drifted manual " +
          "infrastructure, and accelerate platform-engineering self-service — raising " +
          "IaC coverage and the consistency of governed, auditable provisioning. " +
          "Value is higher IaC coverage and fewer drift/guardrail gaps, with all " +
          "generated code reviewed, tested, and gated before it provisions anything.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Existing IaC repositories, landing-zone standards, and policy library",
          "Baseline IaC coverage and configuration-drift incidence",
          "A tested CI/CD and policy-as-code pipeline to gate generated infrastructure",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Generated infrastructure code is a draft — it must pass review, plan/diff, policy, and test gates before apply; never auto-provision from generation",
          "AI can produce plausible but insecure or non-compliant configurations; policy-as-code and human review are the backstop",
        ],
        metricsMoved: [
          "iac_coverage",
          "service_availability",
        ],
      },
      {
        key: "ai_capacity_resilience_optimization",
        name: "AI-driven capacity, autoscaling & resilience optimization",
        valueMechanism:
          "Forecast demand, tune autoscaling and instance/family selection, and " +
          "optimize resilience placement (AZ/region, failover) so capacity follows " +
          "real load instead of on-premises always-on sizing — improving utilization " +
          "and recovery posture while holding availability. Value is utilization " +
          "moved into a healthy range, lower unit cost, and tested recovery improved, " +
          "with scaling/placement changes governed and reversible.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Utilization, demand, and performance telemetry per workload",
          "Baseline rightsizing utilization, MTTR, and service availability",
          "Resilience requirements (RTO/RPO) per critical service",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Aggressive autoscaling/instance changes can degrade performance or resilience — bound to safe ranges with rollback and resilience constraints",
          "Optimizing utilization must not strip the elasticity/resilience headroom cloud is meant to provide",
        ],
        metricsMoved: [
          "rightsizing_utilization",
          "cloud_unit_cost_trend",
          "mttr_infrastructure",
          "service_availability",
        ],
      },
      {
        key: "ai_dr_chaos_validation",
        name: "AI-assisted DR / resilience validation & chaos analysis",
        valueMechanism:
          "Orchestrate and analyze disaster-recovery tests and chaos experiments, " +
          "predict failure blast radius from dependency data, and surface resilience " +
          "gaps before a real outage finds them — turning DR from a paper design into " +
          "a continuously-validated capability. Value is measured (not asserted) " +
          "recovery time and improved availability, with all failure injection run " +
          "under controlled, approved, reversible conditions.",
        adoptionProfile: "early",
        dataDependencies: [
          "Dependency/topology data accurate enough to model blast radius",
          "Baseline MTTR (from real DR tests) and recovery-objective (RTO/RPO) targets",
          "A controlled environment and approval process for failure injection",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Chaos/failure injection in or near production requires explicit approval, blast-radius bounds, and rollback — never autonomous disruption",
          "Recovery-time claims must come from real tests, not model predictions presented as measured capability",
        ],
        metricsMoved: [
          "mttr_infrastructure",
          "service_availability",
        ],
      },
      {
        key: "ai_sustainability_placement",
        name: "AI-assisted carbon-aware placement & sustainability optimization",
        valueMechanism:
          "Estimate carbon per workload, recommend carbon-aware region/time placement " +
          "and right-sizing, and surface the joint cost-and-carbon optimization " +
          "frontier — capturing the large overlap between cloud efficiency and carbon " +
          "efficiency. Value is lower carbon per workload alongside lower unit cost, " +
          "with carbon figures flagged as estimates and placement changes governed for " +
          "latency/residency constraints.",
        adoptionProfile: "early",
        dataDependencies: [
          "Cloud-provider carbon/emissions estimates joined to workload usage",
          "Baseline carbon per workload and cloud unit-cost trend",
          "Latency, data-residency, and sovereignty constraints on placement",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Carbon figures are estimates with methodology variance — present as directional, not audited, and do not over-claim reductions",
          "Carbon-aware placement must respect latency, residency, and sovereignty constraints; optimization cannot override compliance",
        ],
        metricsMoved: [
          "carbon_per_workload",
          "cloud_unit_cost_trend",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "landing_zone_foundation",
        name: "Governed cloud landing zone & platform foundation",
        description:
          "A foundation pattern that establishes the governed cloud baseline before " +
          "workloads land: account/subscription structure, network and identity " +
          "guardrails, tagging and cost-allocation standards, security and policy " +
          "baselines, and infrastructure-as-code modules — so every migrated or new " +
          "workload inherits consistent governance, cost attribution, and guardrails " +
          "by default rather than by review. The precondition that makes FinOps, " +
          "drift-control, and safe scaling even possible.",
        boundary:
          "Owns the landing-zone standard, guardrails, tagging/attribution model, and " +
          "the IaC platform modules; does not own the individual workload " +
          "architecture or the migration decision — it supplies the governed baseline those land on.",
        humanAccountabilityPoint:
          "Head of Cloud Platform Engineering / Cloud Center of Excellence lead",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "migration_factory_disposition",
        name: "Migration factory with disposition discipline (the 6/7 Rs)",
        description:
          "A repeatable migration operating model — discovery, dependency mapping, " +
          "wave planning, and an explicit per-workload disposition decision (retire, " +
          "retain, re-host, re-platform, re-architect, repurchase) — that paces to " +
          "skills and risk and resists defaulting everything to lift-and-shift. It is " +
          "the antidote to relocated-data-center migrations: it forces an honest " +
          "re-architecture-vs-rehost decision per workload and tracks the mix.",
        boundary:
          "Owns the migration methodology, disposition decisions, wave plan, and " +
          "cutover execution; does not own the target landing zone (a foundation) or " +
          "the steady-state run of the estate after cutover.",
        humanAccountabilityPoint:
          "Cloud Migration Program Lead (with workload-owning application architects)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "finops_operating_model",
        name: "FinOps operating model & continuous cost governance",
        description:
          "A standing FinOps capability — tagging/attribution standards, " +
          "showback/chargeback, AI-assisted anomaly detection, rightsizing, and " +
          "commitment optimization, and a cross-functional cadence across " +
          "engineering, finance, and product — that treats cloud cost as a " +
          "continuous, accountable, engineering-owned practice rather than a periodic " +
          "clean-up, driving unit cost down and holding variance in-range.",
        boundary:
          "Owns cost visibility, attribution, optimization recommendations, " +
          "commitment strategy, and the governance cadence; does not own the " +
          "engineering architecture decisions or the spend authority of product/engineering teams.",
        humanAccountabilityPoint:
          "FinOps lead / Cloud Cost Governance owner (with Finance and engineering)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "iac_platform_engineering",
        name: "Infrastructure-as-code & internal developer platform",
        description:
          "A platform-engineering pattern that exposes governed, self-service " +
          "infrastructure through code and golden paths — IaC modules, policy-as-code " +
          "guardrails, and an internal developer platform — so teams provision " +
          "consistent, compliant, cost-controlled infrastructure without click-ops or " +
          "drift, raising IaC coverage and making every cost/security/resilience " +
          "guardrail enforceable by code.",
        boundary:
          "Owns the IaC modules, golden paths, policy-as-code, and the developer " +
          "platform; does not own the application code that runs on the " +
          "infrastructure or the individual team's architecture choices within the guardrails.",
        humanAccountabilityPoint:
          "Platform Engineering lead (with the security and FinOps guardrail owners)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "resilience_dr_pattern",
        name: "Tested resilience & disaster-recovery architecture",
        description:
          "A resilience pattern that designs multi-AZ/region architecture, automated " +
          "failover, and recovery objectives (RTO/RPO) AND continuously exercises them " +
          "through scheduled DR tests and chaos experiments — so recovery is a " +
          "measured, trusted capability rather than a diagram, and availability is " +
          "protected as the estate modernizes. It refuses resilience-on-paper: an " +
          "untested recovery plan does not count.",
        boundary:
          "Owns the resilience architecture standards, the DR test/chaos cadence, and " +
          "the measured recovery metrics; does not own the individual workload's " +
          "uptime commitment or the business continuity decision, which stay with service owners.",
        humanAccountabilityPoint:
          "Head of Infrastructure / Site Reliability (with business-continuity owners)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Cloud and infrastructure value is realized as a more efficient, more " +
        "agile, more resilient estate — measured as cloud UNIT cost falling " +
        "(not just total spend), structural waste removed, resilience improved, " +
        "and agility delivered, NOT as 'we moved to the cloud'. The honest chain " +
        "is: re-architecture (managed services, autoscaling, decommissioning) and " +
        "FinOps discipline (rightsizing, commitment coverage, attribution) lower " +
        "unit cost and remove waste; landing zones and infrastructure-as-code make " +
        "the gains governable and repeatable; and tested resilience protects " +
        "availability through the change. Each step is haircut: lift-and-shift " +
        "give-back is the largest — a workload re-hosted but not re-architected " +
        "captures little of the economics and can cost MORE; FinOps realization " +
        "give-back shrinks the headline because recommended savings are only real " +
        "once actioned by owners; migration/skills risk give-back appears when the " +
        "program outpaces capability and slips or rushes to lift-and-shift; and " +
        "attribution uncertainty erodes credit because cost and reliability move " +
        "for many reasons at once (growth, demand, architecture). The business case " +
        "must never book a migration milestone, a tool purchase, or a recommended " +
        "(un-actioned) saving as value — and must read total spend through UNIT " +
        "cost so business growth is not mistaken for failed optimization. The " +
        "discipline that keeps it honest is measuring re-architected share and unit " +
        "cost, treating FinOps as continuous, and pacing migration to skills and risk.",
      dominantHaircutFactors: [
        {
          factor: "Lift-and-shift give-back (re-architecture not done)",
          rationale:
            "Cloud economics come from re-architecture (managed services, " +
            "autoscaling, decommissioning), not from relocation; workloads " +
            "lifted-and-shifted but never re-architected capture little of the " +
            "modeled savings and can raise run-rate cost — the single largest drain " +
            "on a cloud business case.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "Value lost where migration defaults to re-host and the " +
              "re-architecture that delivers the economics is deferred or skipped",
            label: "planning-range",
          },
        },
        {
          factor: "FinOps realization give-back (recommended vs actioned)",
          rationale:
            "FinOps savings (rightsizing, idle cleanup, commitment coverage) are " +
            "only real once owners action them; recommendation reports overstate " +
            "value, and tagging/attribution gaps cap how much can be confidently " +
            "actioned and credited.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between identified/recommended cloud savings and savings actually " +
              "actioned and sustained across FinOps programs",
            label: "planning-range",
          },
        },
        {
          factor: "Migration / skills risk give-back",
          rationale:
            "Scarce cloud/IaC/FinOps skills and an immature operating model cause " +
            "slippage, rushed lift-and-shift, and un-governed sprawl; value must " +
            "subtract the give-back from a program that outpaces the organization's " +
            "capability to run the estate.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Value erosion from migration slippage, skills/dependency surprises, " +
              "and operating-model immaturity before platform capability matures",
            label: "planning-range",
          },
        },
        {
          factor: "Attribution uncertainty",
          rationale:
            "Cloud cost, reliability, and unit cost move for many reasons at once " +
            "(business growth, demand, architecture, process); without a baseline, " +
            "unit-cost normalization, or matched comparison, cloud/AI is credited " +
            "for changes it did not cause.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Counterfactual gaps where no baseline, unit-cost normalization, or " +
              "matched comparison isolates the modernization/FinOps contribution",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Cloud unit-cost / waste reduction (FinOps + rightsizing actioned)",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Cloud unit-cost and addressable-waste reduction from actioned " +
              "rightsizing, idle cleanup, and commitment optimization where FinOps " +
              "is a continuous practice and savings are owner-actioned",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in cloud_unit_cost_trend / idle_waste_pct with variance held in-range",
        },
        {
          lever: "Re-architecture run-rate economics (managed services + autoscaling)",
          range: {
            low: 0.15,
            high: 0.45,
            basis:
              "Run-rate cost and utilization improvement from re-platforming to " +
              "managed services and autoscaling versus the lifted-and-shifted " +
              "baseline, where re-architecture is actually completed",
            label: "planning-range",
          },
          measuredAs:
            "Relative run-rate improvement tied to rearchitected_vs_liftshift_pct and rightsizing_utilization",
        },
        {
          lever: "Resilience / recovery improvement (availability held or raised)",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Tested recovery-time improvement from IaC-driven automated failover " +
              "and resilience architecture where DR is continuously exercised, at " +
              "held-or-improved availability",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in mttr_infrastructure (from real DR tests) at held-or-improved service_availability",
        },
      ],
      timeToValueBand:
        "FinOps cost intelligence and rightsizing: 1-2 quarters to first actioned " +
        "waste removal, ongoing thereafter (the fastest, lowest-risk value). " +
        "Landing zone and IaC foundation: 1-3 quarters to stand up before scaled " +
        "migration. Migration waves: 2-6+ quarters depending on estate size, " +
        "dependency complexity, and skills — with re-architecture adding time but " +
        "delivering the economics. Resilience/DR validation and carbon-aware " +
        "optimization: ongoing practices that mature over 3-6+ quarters as the " +
        "platform and operating model stabilize.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Cloud provider consoles & control planes",
          role: "The provisioning, account/subscription, and resource control plane for the cloud estate — the source of truth for what is running.",
          examples: ["AWS", "Microsoft Azure", "Google Cloud", "Oracle Cloud Infrastructure"],
        },
        {
          name: "Cloud billing & FinOps platform",
          role: "Granular cloud usage/cost, tagging/attribution, commitment coverage, and optimization recommendations — the source for cost variance, unit cost, and waste.",
          examples: ["AWS Cost Explorer / CUR", "Azure Cost Management", "GCP Billing", "Apptio Cloudability", "CloudHealth", "Vantage"],
        },
        {
          name: "Infrastructure-as-code & platform tooling",
          role: "Declarative infrastructure definitions, state, golden paths, and policy-as-code — the source for IaC coverage and governed provisioning.",
          examples: ["Terraform / OpenTofu", "AWS CloudFormation", "Azure Bicep", "Pulumi", "Crossplane", "Backstage"],
        },
        {
          name: "Migration & discovery tooling",
          role: "Estate discovery, dependency mapping, wave planning, and disposition tracking for the migration program.",
          examples: ["AWS Migration Hub / Application Discovery", "Azure Migrate", "Google Migration Center", "Device42", "Tidal/Flexera"],
        },
        {
          name: "Container & orchestration platform",
          role: "Container runtime, orchestration, and the modern-application substrate that re-architecture targets.",
          examples: ["Kubernetes (EKS/AKS/GKE)", "OpenShift", "AWS ECS", "Docker", "Helm"],
        },
        {
          name: "Observability, resilience & sustainability tooling",
          role: "Telemetry, SLO/availability, DR/chaos validation, and carbon/emissions estimation across the infrastructure estate.",
          examples: ["Datadog", "Dynatrace", "Prometheus/Grafana", "AWS Resilience Hub", "Gremlin", "cloud-provider carbon dashboards"],
        },
      ],
      roles: [
        {
          title: "CIO / VP of Infrastructure & Cloud",
          accountability:
            "The cloud and infrastructure estate, the modernization program, and the cost/agility/resilience outcomes end-to-end.",
        },
        {
          title: "Head of Cloud Platform Engineering / Cloud CoE lead",
          accountability:
            "Landing zones, guardrails, IaC platform, golden paths, and the governed cloud operating model.",
        },
        {
          title: "Cloud Migration Program Lead",
          accountability:
            "Migration discovery, disposition discipline (re-architect vs lift-shift), wave delivery, on-time %, and cutover risk.",
        },
        {
          title: "FinOps lead / Cloud Cost Governance owner",
          accountability:
            "Cloud cost variance, unit-cost trend, commitment coverage, waste removal, attribution/tagging, and the continuous cost cadence (with Finance).",
        },
        {
          title: "Head of Infrastructure / Site Reliability",
          accountability:
            "Resilience architecture, DR/chaos testing, recovery objectives (RTO/RPO), MTTR, and availability.",
        },
        {
          title: "Cloud / Infrastructure Architect",
          accountability:
            "Per-workload target architecture, re-architecture trade-offs, multi-cloud/lock-in decisions, and sustainability/placement design.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Cloud shared-responsibility & landing-zone control frameworks (e.g. CIS Benchmarks, cloud well-architected guidance)",
          relevance:
            "Define the security, governance, and operational guardrails that landing zones and IaC must enforce; AI-generated infrastructure must comply with them.",
        },
        {
          name: "Operational resilience & continuity standards (e.g. ISO 22301, DORA for financial services)",
          relevance:
            "Availability, recovery, and resilience-testing obligations constrain DR architecture and require recovery to be evidenced, not asserted.",
        },
        {
          name: "Data residency, sovereignty & privacy frameworks (e.g. GDPR, sector and country data-localization rules)",
          relevance:
            "Constrain workload placement, multi-cloud/region choices, and carbon-aware placement — optimization cannot override residency/sovereignty.",
        },
        {
          name: "Sustainability disclosure frameworks (e.g. CSRD, GHG Protocol Scope 2/3, emerging climate disclosure rules)",
          relevance:
            "Increasingly require infrastructure carbon to be measured and reported, linking sustainability obligations to cloud-efficiency decisions.",
        },
      ],
      canonicalTerms: [
        {
          term: "Lift-and-shift (re-host) vs re-architecture (re-platform/refactor)",
          definition:
            "Re-host relocates a workload VM-for-VM with no change; re-platform/refactor changes it to use managed services, autoscaling, or cloud-native design — only the latter captures cloud economics.",
        },
        {
          term: "The 6/7 Rs (migration disposition)",
          definition:
            "The per-workload migration decision — retire, retain, re-host, re-platform, re-architect/refactor, repurchase (and relocate) — that determines how much economics a migration captures.",
        },
        {
          term: "Landing zone",
          definition:
            "The pre-built, governed cloud baseline (accounts, network, identity, guardrails, tagging) that workloads land on so governance and cost attribution are inherited by default.",
        },
        {
          term: "FinOps",
          definition:
            "The continuous practice of cloud financial management — visibility, attribution, optimization, and accountability — treating cloud cost as an engineering responsibility, not a periodic clean-up.",
        },
        {
          term: "Committed-use coverage (reservations / savings plans)",
          definition:
            "The share of steady-state usage covered by commitment-based discounts; a primary structural cost lever, read with utilization to avoid paying for idle reservations.",
        },
        {
          term: "Infrastructure-as-code (IaC) / platform engineering",
          definition:
            "Provisioning and managing infrastructure declaratively through code with policy-as-code guardrails and golden paths, enabling repeatable, governed, drift-free operations.",
        },
        {
          term: "RTO / RPO and tested DR",
          definition:
            "Recovery-time and recovery-point objectives for a service, and the discipline of actually exercising failover — an untested recovery plan is a hope, not a measured capability.",
        },
        {
          term: "Cloud unit cost",
          definition:
            "Cloud cost normalized by a unit of business or technical output; the honest efficiency metric that separates genuine optimization from total spend rising with business growth.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Cloud economics realized (unit cost / waste, not just migration)",
        authoritativeSource:
          "Cloud billing/usage normalized by a business/technical output metric, with FinOps optimization records and a defined baseline (before/after)",
        whatGoodEvidenceLooksLike:
          "Cloud UNIT cost falling and addressable waste actioned and removed, read alongside re-architected share — not total spend in isolation.",
        weakEvidenceToReject:
          "A 'we moved X% to the cloud' figure, a migration milestone, or a total-spend-down number presented as cloud economics with no unit-cost normalization.",
      },
      {
        claim: "Re-architecture vs lift-and-shift (economics actually captured)",
        authoritativeSource:
          "Migration disposition records (the 6/7 Rs) reconciled to the workload inventory, with per-workload run-rate before/after",
        whatGoodEvidenceLooksLike:
          "A measured re-architected share with run-rate and utilization improvement on re-architected workloads versus the lifted baseline.",
        weakEvidenceToReject:
          "Cloud-share progress with no disposition breakdown, or savings claimed on lifted-and-shifted workloads that were never re-architected.",
      },
      {
        claim: "FinOps savings are real (actioned, not recommended)",
        authoritativeSource:
          "Cloud billing/usage with tagging/attribution plus FinOps optimization records, reconciled with Finance, showing actioned changes",
        whatGoodEvidenceLooksLike:
          "Variance held in-range, commitment coverage right-sized to utilization, and specific attributed waste actually removed and traced to owners.",
        weakEvidenceToReject:
          "A theoretical saving from a recommendation never actioned, an unattributed 'cloud spend down' figure, or commitment coverage maximized without utilization.",
      },
      {
        claim: "Resilience / recovery is a tested capability",
        authoritativeSource:
          "DR test and chaos-experiment records with measured recovery times vs RTO/RPO per critical service",
        whatGoodEvidenceLooksLike:
          "Recovery time measured from a real failover test (not a model), at held-or-improved availability, for the critical services in scope.",
        weakEvidenceToReject:
          "A DR design or RTO target asserted with no failover test, or a predicted recovery time presented as measured capability.",
      },
      {
        claim: "Migration paced to skills and risk (delivery health)",
        authoritativeSource:
          "Migration factory tracker (planned vs actual wave completion) with dependency/discovery completeness and skills/operating-model readiness",
        whatGoodEvidenceLooksLike:
          "Migration on-time % with trusted dependency discovery and a platform/skills readiness signal — pace set by capability, not by a deadline.",
        weakEvidenceToReject:
          "An aggressive date with no dependency-discovery or skills-readiness evidence, or a program rushed on-schedule by cutting re-architecture and DR validation.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your migrated workloads were re-architected versus lifted-and-shifted, and is your cloud UNIT cost actually falling — not just total spend changing with the business?",
      "What is your cloud cost variance to budget, your commitment coverage and idle waste, and is FinOps a continuous engineering-owned practice or a periodic clean-up?",
      "Do you have the cloud/IaC/FinOps skills and the platform operating model to run this estate, and is your migration pace set by capability and risk or by a board deadline?",
      "How complete and trusted is your application-dependency and data-gravity discovery, and how often do migration waves slip or roll back on surprises you did not see going in?",
      "When did you last actually test failover for your critical services, what recovery time did the test produce, and is your DR a tested capability or a diagram?",
      "What specific workloads or commercial leverage justify your hybrid/multi-cloud footprint, and is the duplicated tooling and skills cost less than the lock-in risk it avoids?",
      "What share of your infrastructure is managed as code with automated guardrails, and how much is manually provisioned, drifting, and un-auditable?",
      "Do you measure carbon per workload, and are your cost-optimization and sustainability efforts connected or run in separate silos?",
    ],
    maturitySignals: [
      "Re-architected share and cloud unit-cost trend are measured and reported, so cloud progress is never read as migration percentage alone.",
      "FinOps is a continuous, engineering-owned practice with tagging/attribution, showback/chargeback, commitment coverage right-sized to utilization, and variance held in-range.",
      "A governed landing zone and high IaC coverage with policy-as-code guardrails mean new and migrated workloads inherit governance and cost attribution by default.",
      "Migration runs through a disposition-disciplined factory paced to skills and risk, with trusted dependency discovery and a real re-architecture-vs-rehost decision per workload.",
      "Disaster recovery is continuously exercised, recovery times are measured (not asserted), and resilience is treated as a tested capability protecting availability through change.",
    ],
    redFlags: [
      "High cloud-share is celebrated while re-architected share is low, unit cost is flat or rising, and the booked savings never appeared — a relocated data center.",
      "Cloud cost variance runs persistently double-digit over budget with a large share of spend untagged and unattributed, and FinOps is a periodic fire-drill not a standing practice.",
      "The migration pace is set by a board deadline despite scarce cloud/IaC/FinOps skills and an immature platform, producing rushed lift-and-shift and un-governed sprawl.",
      "DR and resilience exist only on paper — never failover-tested, recovery times asserted not measured — and critical workloads run single-AZ/region on hope.",
      "Infrastructure is largely manual click-ops with low IaC coverage, drifting snowflake environments, and no automated guardrails, so cost and security controls cannot be enforced reliably.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Cloud hyperscalers (AWS, Microsoft Azure, Google Cloud)",
        category: "Public cloud infrastructure and managed services — the consumption platform",
        switchingCost:
          "Very high — architecture, managed-service dependence, and data gravity create deep lock-in; egress costs and re-architecture make moving a workload between clouds a major effort, which is the central tension in any multi-cloud or lock-in decision.",
        renewalDynamics:
          "Enterprise discount programs (EDP/MACC) and committed-use/savings-plan coverage are the primary cost levers; negotiate committed-spend tiers, migration credits, and avoid over-committing spend that locks in volume you may not consume.",
      },
      {
        vendorName: "FinOps & cloud cost management tools (Apptio Cloudability, CloudHealth, Vantage, others)",
        category: "Cloud cost visibility, attribution, and optimization",
        switchingCost:
          "Low-to-moderate — a layer over the billing data; portable relative to the hyperscaler, but embedded reporting/attribution and process create some stickiness.",
        renewalDynamics:
          "Often percentage-of-spend or platform pricing; the tool should pay for itself in actioned waste removed — negotiate on demonstrated savings and a spend-based cap, not list price, and avoid paying a percentage of spend you are trying to shrink.",
      },
      {
        vendorName: "IaC / platform-engineering tooling (HashiCorp Terraform, Pulumi, Backstage ecosystem, others)",
        category: "Infrastructure-as-code, policy-as-code, and internal developer platform",
        switchingCost:
          "Moderate — state, modules, and golden paths embed into the operating model; open-source forks (e.g. OpenTofu) and standards reduce hard lock-in but migration of state and modules is real work.",
        renewalDynamics:
          "Per-resource/per-user or enterprise pricing with rising commercial pressure after licensing changes; evaluate open-source/community alternatives as leverage and negotiate on the governed-resource footprint actually under management.",
      },
      {
        vendorName: "Migration & system-integrator partners (hyperscaler professional services, SIs, migration-factory tools)",
        category: "Migration delivery, re-architecture, and modernization services",
        switchingCost:
          "Moderate — knowledge of the estate and in-flight waves creates mid-program stickiness, but the deliverable (a migrated, governed estate) is meant to be transferred back to internal teams.",
        renewalDynamics:
          "Fixed-fee waves or T&M with migration credits/funding from hyperscalers; negotiate outcome-based milestones (re-architected share, on-time %, knowledge transfer), insist on skills transfer to internal teams, and avoid open-ended T&M that incentivizes lift-and-shift volume over economics.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the hyperscaler itself — architecture, managed-service dependence, and data gravity make moving a workload between clouds a re-architecture, not a config change — so the honest posture is to manage lock-in deliberately (use managed services where the economics win, keep portability where it matters) rather than reflexively pursue multi-cloud. The FinOps, IaC, and migration-service layers over the top are materially more portable, so the negotiating room is in committed-use/discount terms with the hyperscaler, demonstrated-savings-based FinOps tooling, open-source IaC leverage, and outcome-based (not volume-based) migration engagements.",
    negotiationLevers: [
      "Negotiate committed-use / enterprise discount tiers and migration credits with the hyperscaler against realistic (not over-committed) consumption forecasts",
      "Tie FinOps tooling commercials to actioned waste removed and a spend-based cap — not a percentage of the spend you are trying to shrink",
      "Use open-source IaC alternatives (e.g. OpenTofu) and standards as leverage on platform-tooling licensing, and price to the governed-resource footprint actually managed",
      "Structure migration/SI engagements on outcomes (re-architected share, on-time %, skills transfer) rather than open-ended T&M that rewards lift-and-shift volume",
      "Manage lock-in deliberately — use managed services where economics win, preserve portability where workloads or commercial leverage warrant it — rather than paying a reflexive multi-cloud tax",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      cloud_economics_claim: [
        "cloud billing/usage normalized to a unit (cost-per-output), not total spend",
        "defined baseline (before/after) per workload or estate",
        "re-architected share reported alongside (not migration % alone)",
      ],
      rearchitecture_claim: [
        "migration disposition records (the 6/7 Rs) reconciled to the workload inventory",
        "per-workload run-rate and utilization before vs after",
        "managed-service / autoscaling / decommissioning evidence, not a re-host relabeled",
      ],
      finops_savings_claim: [
        "cloud billing/usage with tagging/attribution",
        "actioned (not recommended/theoretical) waste removed, reconciled with Finance",
        "commitment coverage read with utilization (not maximized blindly)",
      ],
      resilience_claim: [
        "DR test / chaos-experiment records with measured recovery time",
        "recovery objectives (RTO/RPO) per critical service",
        "availability held or improved over the same window",
      ],
      migration_delivery_claim: [
        "migration tracker (planned vs actual wave/cutover)",
        "dependency/discovery completeness for the waves in scope",
        "skills / operating-model readiness signal (pace set by capability, not a date)",
      ],
      sustainability_claim: [
        "cloud-provider carbon/emissions estimates joined to workload usage",
        "baseline carbon per workload",
        "explicit estimate / methodology caveat (figures are directional, not audited)",
      ],
      value_projection: [
        "baseline operating metric (unit-cost normalized where relevant)",
        "benchmark planning-range",
        "explicit haircut factors (lift-and-shift give-back, FinOps realization, migration/skills risk, attribution)",
      ],
    },
    citationStandard:
      "Cloud and infrastructure claims cite the billing/usage/migration/DR source, " +
      "the period, the workload/estate scope, and the comparison basis (baseline + " +
      "matched scope). Cost and economics claims MUST be read through UNIT cost " +
      "(normalized to output), never total spend in isolation, and reported " +
      "alongside re-architected share so migration progress is never mistaken for " +
      "cloud economics. FinOps savings claims MUST cite ACTIONED (not theoretical/" +
      "recommended) waste with attribution, reconciled with Finance, and read " +
      "commitment coverage with utilization. Resilience claims MUST come from real " +
      "failover/chaos tests with measured recovery times, not asserted RTOs. " +
      "Sustainability/carbon figures MUST be flagged as estimates with a methodology " +
      "caveat. Value projections cite a baseline plus a labelled planning range and " +
      "the haircut factors applied — never a single asserted ROI, a migration " +
      "milestone, a tool purchase, or a recommended-but-un-actioned saving extrapolated to value.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no unit-cost baseline or re-architected-share breakdown — frame cloud savings as an industry planning range, not their measured number, and flag that total-spend movement is not cloud economics.",
      "FinOps savings are recommended but not yet actioned — present as identified/addressable, flag that realized savings depend on owner action and tagging hygiene.",
      "Migration pace or skills readiness is unknown — flag that an aggressive plan is conditional on dependency discovery and cloud/IaC/FinOps capability, and treat date commitments as at-risk.",
      "DR has never been failover-tested — hedge any resilience/recovery claim as a design target, not a measured capability, until a real test produces a recovery time.",
      "Vendor-reported migration savings or carbon reductions are cited — mark as vendor/estimate claims pending tenant validation against a baseline.",
    ],
    inferenceLanguage: [
      "Across enterprise cloud estates, actioned FinOps and rightsizing unit-cost reductions typically run...",
      "Without your re-architected-share figure, the industry pattern is that lift-and-shift captures little of the modeled cloud economics and can raise run-rate cost.",
      "Peer estates at this scale commonly land migration waves on plan only when dependency discovery is trusted and platform skills are in place; absent those, slippage is the norm.",
      "This is an addressable-savings / planning figure read before owner action and re-architecture; converting it to a realized number is a decision your data hasn't yet made.",
      "Carbon-per-workload figures here are provider estimates with methodology variance — directional, not audited.",
    ],
    flagWithoutEvidence: [
      "A specific dollar saving for this tenant's cloud estate without an actioned, attributed, baseline-anchored figure",
      "This tenant's actual cloud unit cost, re-architected share, commitment coverage, or idle-waste percentage",
      "A claim that this tenant's lift-and-shift migration delivered cloud economics without re-architecture and unit-cost evidence",
      "A specific recovery time or resilience guarantee for this tenant without a real failover test",
      "A specific ROI number for this tenant's migration / modernization / FinOps program, or a carbon reduction asserted as audited fact",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "cloud economics scorecard (re-architected share, unit cost, waste, coverage together)",
      exhibitKind: "chart",
      chartKind: "bar",
      chartBuilder: "bar",
      note: "Re-architected vs lift-shift share, cloud unit-cost trend, idle waste, and commitment coverage side by side, so cloud progress is never read as migration % alone.",
    },
    {
      questionPattern: "cloud value bridge (baseline to realized, with haircuts)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from baseline infra cost to modernized run-rate, showing re-architecture and FinOps gains and each haircut (lift-and-shift give-back, FinOps realization, migration/skills risk, attribution).",
    },
    {
      questionPattern: "value sensitivity / which haircut bites hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of lift-and-shift give-back, FinOps realization give-back, migration/skills risk, and attribution on realized cloud value.",
    },
    {
      questionPattern: "cloud cost stack / where the spend and addressable waste sit",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Cloud cost decomposed by team/service/account with addressable waste (idle, oversized, uncommitted, untagged) called out against variance-to-budget and commitment coverage.",
    },
    {
      questionPattern: "cloud unit-cost and migration trend over time / where modernization moved the curve",
      exhibitKind: "chart",
      chartKind: "line",
      chartBuilder: "line",
      note: "Trend cloud unit cost, re-architected share, and total spend together so efficiency improving is distinguished from spend rising with business growth.",
    },
    {
      questionPattern: "cloud and infrastructure modernization scorecard",
      exhibitKind: "table",
      note: "Workloads-in-cloud, re-architected share, unit-cost trend, cost variance, commitment coverage, idle waste, IaC coverage, migration on-time %, MTTR (DR), availability, carbon per workload, and rightsizing utilization vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Re-architecture is treated as the source of cloud economics — disposition discipline drives a rising re-architected share, not default lift-and-shift",
      "FinOps is a continuous, engineering-owned practice with tagging/attribution, commitment coverage right-sized to utilization, and savings actually actioned",
      "A governed landing zone and high IaC coverage with policy-as-code make governance, cost attribution, and guardrails the default, not a review step",
      "Migration is paced to skills and risk with trusted dependency discovery, and the operating model and platform skills are built before scaling waves",
      "Resilience is continuously tested with measured recovery times, and cloud unit cost (not total spend) is the metric the program is judged on",
    ],
    failureDrivers: [
      "Booking cloud savings from migration milestones while workloads are lifted-and-shifted, never re-architected, and unit cost flat or rising",
      "Running FinOps as a periodic fire-drill — recommendations never actioned, spend untagged and unattributed — so sprawl re-accumulates",
      "Setting migration pace by a board deadline despite scarce cloud/IaC/FinOps skills, producing rushed lift-and-shift and un-governed sprawl",
      "Treating DR and resilience as paper designs never failover-tested, so recovery capability is unknown until a real outage exposes it",
      "Pursuing reflexive multi-cloud and manual click-ops, accumulating duplicated tooling, drift, and integration debt that costs more than the lock-in avoided",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "FinOps cost intelligence and rightsizing adopt first and fastest — visible, " +
      "low-risk savings that build the case and fund the rest. Landing zones and " +
      "infrastructure-as-code follow as the governed foundation before scaled " +
      "migration. Migration waves adopt steadily, paced by skills, dependency " +
      "complexity, and the re-architecture-vs-rehost trade-off. Resilience/DR " +
      "validation and AI-assisted IaC/capacity optimization adopt next as the " +
      "platform matures. Carbon-aware placement and chaos/resilience automation " +
      "adopt last and most cautiously, gated by measurement maturity, residency " +
      "constraints, and operator trust. Skills and platform-operating-model maturity " +
      "are the recurring gate that either unlocks or stalls the deeper, re-architecture-heavy bets.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is better here than in diffuse productivity domains because " +
      "cloud is heavily instrumented — cost, unit cost, commitment coverage, " +
      "utilization, migration progress, and availability are measurable per " +
      "workload and per account. But it is only MEDIUM, not high: total cloud " +
      "spend usually rises with the business, so without unit-cost normalization " +
      "growth is mistaken for failed optimization (or vice versa); lift-and-shift " +
      "savings are routinely booked that the re-architecture never delivered; " +
      "FinOps recommendations overstate value until actioned; and reliability and " +
      "cost move for many reasons at once. The honest number must read unit cost " +
      "(not total spend), credit only actioned savings on re-architected workloads, " +
      "net out the migration/skills-risk give-back, and refuse to book migration " +
      "milestones, tool purchases, or recommended-but-un-actioned savings as ROI.",
  },

  regulatoryFrame: {
    name: "Cloud & infrastructure governance: landing-zone controls, operational resilience, data residency, and sustainability disclosure",
    relevance:
      "The dominant cross-cutting frame for the cloud/infrastructure transform " +
      "layer: landing zones and IaC must enforce shared-responsibility and " +
      "well-architected control baselines (e.g. CIS Benchmarks), and AI-generated " +
      "infrastructure must pass policy-as-code; availability and recovery are " +
      "governed by operational-resilience and continuity obligations (ISO 22301, " +
      "and DORA for financial services) that require recovery to be evidenced not " +
      "asserted; workload placement and multi-cloud/carbon-aware decisions are " +
      "bounded by data-residency, sovereignty, and privacy law (GDPR and " +
      "localization rules); and infrastructure carbon is increasingly subject to " +
      "sustainability-disclosure obligations (CSRD, GHG Protocol) that link " +
      "cloud-efficiency decisions to reporting (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (it-estate)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
