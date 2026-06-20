// Consilium expert — IT Operations & Service Management (cross-cutting RUN-IT layer).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It answers the
// question every infrastructure-and-operations (I&O) and service-management
// leader is asking: "across the run-IT estate — incident/problem/change, the
// service desk, infrastructure and cloud operations, the digital workplace,
// observability/SRE, FinOps and asset/CMDB — how does AI actually cut downtime,
// deflect tickets, and tame cloud cost WITHOUT trading reliability for it, what
// does that realistically buy me, and how do I tell real service improvement
// from a dashboard that merely looks busy?"
//
// Honesty doctrine. This expert is built around two non-negotiable truths the
// I&O world keeps re-learning. First, change is the dominant cause of
// self-inflicted outage: a large share of major incidents trace to a change,
// so any AI that accelerates change WITHOUT proportionate testing, rollback,
// and review discipline manufactures incidents — change velocity is only a gain
// when change success rate and change-related incident % hold or improve.
// Second, automation and AIOps are gated by DATA QUALITY: a stale, inaccurate
// CMDB / asset inventory caps every downstream bet (auto-remediation,
// impact-aware routing, dependency-aware change risk) because the AI inherits
// the garbage. And cloud cost sprawl is a structural, ever-present drain that
// FinOps must attack continuously, not a one-time clean-up. The expert refuses
// the "we deployed an AIOps tool therefore MTTR drops" leap and insists on
// paired reliability-and-change measurement, CMDB accuracy as the foundation,
// and honest deflection accounting before any business case lands.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const itOperationsItsmExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.it-operations-itsm",
    expertName: "IT Operations & Service Management Expert (RUN-IT / ITSM / AIOps)",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "it-operations-itsm",
    scopeNote:
      "Horizontal across every enterprise IT organization and industry: the " +
      "RUN-IT / service-management layer — ITSM (incident, problem, change), the " +
      "service desk, infrastructure and cloud operations, end-user computing / " +
      "digital workplace, observability and SRE, cloud cost management (FinOps), " +
      "and IT asset and configuration management (CMDB). It answers how AI cuts " +
      "downtime, deflects and auto-resolves tickets, and controls cloud spend, " +
      "held to two honest positions: change-related incidents are the dominant " +
      "self-inflicted outage cause, and CMDB / asset data quality gates every " +
      "automation bet. Explicitly DISTINCT from Software & Engineering " +
      "Productivity (the SDLC / build-IT layer — code assistants, DORA, " +
      "developer experience) and from the Data & Analytics Platform expert (the " +
      "data-engineering / BI layer); excludes application security / SOC " +
      "operations (a separate cybersecurity expert) and the commercial sourcing " +
      "of the broader IT vendor stack beyond the tool-rationalization levers noted here.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "mttr_incidents",
        name: "Mean time to restore (MTTR) — incidents",
        definition:
          "Average elapsed time from incident detection to service restoration " +
          "across IT incidents — the headline reliability/responsiveness signal " +
          "for the operations and service-management estate.",
        unit: "hours (or minutes for high-severity)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 24,
          basis:
            "Restore times vary widely by severity and estate maturity — minutes " +
            "for well-instrumented services with runbook automation to a day-plus " +
            "for complex, poorly-observed estates; the directional ask is downward",
          label: "planning-range",
        },
        dataSource:
          "ITSM incident records + observability/monitoring restore timestamps (e.g. ServiceNow, Datadog, Splunk)",
        whyItMatters:
          "The core run-IT reliability outcome and the metric AIOps bets target. " +
          "Honest only when read WITH mean time to detect and change success rate: " +
          "faster restore that comes from shipping risky changes faster is not a gain.",
      },
      {
        key: "mttd",
        name: "Mean time to detect (MTTD)",
        definition:
          "Average time from the onset of a service-degrading condition to its " +
          "detection by monitoring or a human — the leading half of incident " +
          "lifecycle, ahead of restoration.",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 60,
          basis:
            "Well-instrumented estates detect in minutes via anomaly detection; " +
            "gaps and alert noise push detection to tens of minutes or customer-reported",
          label: "planning-range",
        },
        dataSource:
          "Observability / monitoring platform event timestamps vs incident onset (e.g. Datadog, Dynatrace, Splunk, Grafana)",
        whyItMatters:
          "Most of MTTR is often detection and triage, not the fix. AIOps anomaly " +
          "detection and noise reduction move MTTD first — and detecting from " +
          "customer tickets rather than monitoring is a sign of an observability gap.",
      },
      {
        key: "first_contact_resolution",
        name: "First-contact resolution rate (service desk)",
        definition:
          "Share of service-desk contacts resolved at first interaction without " +
          "escalation, transfer, or a follow-up — the core service-desk " +
          "effectiveness and end-user-experience signal.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 65,
          high: 85,
          basis:
            "Service-desk benchmarks place healthy first-contact resolution in a " +
            "two-thirds-to-mid-eighties band; below signals knowledge or routing gaps",
          label: "planning-range",
        },
        dataSource:
          "ITSM / service-desk platform interaction records (e.g. ServiceNow, Zendesk, Jira Service Management)",
        whyItMatters:
          "Drives both cost and experience: low first-contact resolution means " +
          "rework, escalation, and user frustration. AI knowledge assist and " +
          "agent copilots target it — but must not lift it by closing tickets prematurely.",
      },
      {
        key: "ticket_auto_resolution_rate",
        name: "Ticket auto-resolution / deflection rate",
        definition:
          "Share of service requests and incidents resolved or deflected without " +
          "live-agent effort — via self-service, virtual agent, or automated " +
          "fulfilment — measured as genuine resolution, not abandonment.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Virtual-agent and self-service deflection commonly lands in a low-tens " +
            "to ~40% band for suitable request types; higher claims often conflate " +
            "deflection with abandonment",
          label: "planning-range",
        },
        dataSource:
          "ITSM virtual-agent / self-service portal telemetry joined to ticket outcomes (resolved vs reopened/escalated)",
        whyItMatters:
          "The primary AI cost lever on the service desk — but the most gamed. " +
          "Honest deflection requires excluding tickets that were merely abandoned " +
          "or that bounced back as reopens; otherwise it is a vanity number.",
      },
      {
        key: "change_success_rate",
        name: "Change success rate",
        definition:
          "Share of changes implemented as planned without causing an incident, " +
          "rollback, or emergency remediation — the core change-management quality " +
          "metric.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 99,
          basis:
            "Mature change practices sustain high-90s success; sub-90 indicates " +
            "weak testing, review, or change-risk assessment discipline",
          label: "planning-range",
        },
        dataSource:
          "ITSM change records correlated to post-change incidents (e.g. ServiceNow Change, deployment + incident join)",
        whyItMatters:
          "Change is the dominant self-inflicted outage cause. Any AI that " +
          "accelerates change must hold or raise this — speed bought by skipping " +
          "testing/review shows up here and in change-related incident %.",
      },
      {
        key: "change_related_incident_pct",
        name: "Change-related incident percentage",
        definition:
          "Share of incidents (especially major incidents) traceable to a recent " +
          "change — the honesty check that pairs with change velocity and change " +
          "success rate.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 50,
          basis:
            "A large share of significant incidents trace to change across the " +
            "industry; the directional ask is downward as change risk assessment " +
            "and testing mature",
          label: "planning-range",
        },
        dataSource:
          "Incident records linked to change records (root-cause attribution in ITSM)",
        whyItMatters:
          "The single most important honesty metric for change automation: it " +
          "exposes whether faster change is being financed by more outages. AI " +
          "change-risk scoring should drive it DOWN, never just speed changes up.",
      },
      {
        key: "system_availability",
        name: "System availability / uptime",
        definition:
          "Share of time critical services are available and meeting their " +
          "performance threshold over a period — the reliability outcome behind " +
          "SLAs and the user-facing reality of run-IT quality.",
        unit: "% (e.g. 99.9)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 99,
          high: 99.99,
          basis:
            "Business-critical services target three-to-four-nines; the cost and " +
            "engineering to add each nine rises steeply, so the target is per-service",
          label: "planning-range",
        },
        dataSource:
          "Observability / synthetic monitoring uptime data per service (e.g. Datadog, Dynatrace, status/SLO tooling)",
        whyItMatters:
          "The bottom-line reliability promise to the business. AI helps via " +
          "earlier detection and faster restore, but availability is gated by " +
          "change discipline and architecture, not by a monitoring tool alone.",
      },
      {
        key: "sla_attainment",
        name: "SLA attainment",
        definition:
          "Share of incidents and service requests resolved within their " +
          "committed service-level target (response and resolution SLAs), by " +
          "priority tier.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 98,
          basis:
            "Mature service operations sustain low-to-high-90s SLA attainment; " +
            "chronic breaches signal capacity, routing, or prioritization problems",
          label: "planning-range",
        },
        dataSource:
          "ITSM SLA/SLM records (response and resolution clocks vs targets by priority)",
        whyItMatters:
          "The contractual/operational commitment the service org is measured on. " +
          "AI routing and triage can lift attainment, but only if it speeds the " +
          "RIGHT work — attainment gamed by re-tiering or clock-pausing is not real.",
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
          "Cloud billing + FinOps platform (e.g. AWS Cost Explorer, Azure Cost Management, CloudHealth, Apptio Cloudability)",
        whyItMatters:
          "Cloud cost sprawl is a structural drain. Tracked IN-RANGE (over-spend " +
          "is bad, but chronic under-spend can mean stalled delivery); AI " +
          "anomaly detection and rightsizing recommendations target it continuously.",
      },
      {
        key: "cost_per_ticket",
        name: "Cost per ticket",
        definition:
          "Fully-loaded service-desk and operations cost divided by tickets " +
          "handled — the unit economics of the service org and the denominator " +
          "any deflection/automation business case must move honestly.",
        unit: "USD per ticket",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 50,
          basis:
            "Per-contact cost varies sharply by channel and complexity — self-" +
            "service is a fraction of a live or escalated contact; the band reflects " +
            "blended desk economics",
          label: "planning-range",
        },
        dataSource:
          "Service-desk cost model (loaded labor + tooling) divided by ITSM ticket volume by channel",
        whyItMatters:
          "Where deflection and automation value actually shows up — or doesn't. " +
          "Deflecting cheap tickets while expensive escalations are untouched moves " +
          "volume but not cost, so this must be read by channel and complexity.",
      },
      {
        key: "cmdb_accuracy",
        name: "CMDB / asset data accuracy",
        definition:
          "Share of configuration items and assets in the CMDB/inventory that are " +
          "present, correct, and current (verified against discovery) — the data-" +
          "quality foundation that gates downstream automation.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "CMDB accuracy is a notorious weak spot; many estates sit well below " +
            "their target, and accuracy degrades fast without automated discovery " +
            "reconciliation",
          label: "planning-range",
        },
        dataSource:
          "Discovery/reconciliation reports vs CMDB of record (e.g. ServiceNow Discovery, asset-management tooling)",
        whyItMatters:
          "The gating metric for nearly every AI/automation bet: impact-aware " +
          "routing, dependency-aware change risk, and auto-remediation all inherit " +
          "the CMDB's quality. Low accuracy caps the realizable value of everything downstream.",
      },
      {
        key: "alert_noise_ratio",
        name: "Alert noise ratio (actionable vs total alerts)",
        definition:
          "Share of monitoring alerts that are non-actionable noise (duplicates, " +
          "flapping, low-value) versus alerts that warrant action — the signal-to-" +
          "noise health of the observability estate.",
        unit: "% of alerts that are noise",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 60,
          basis:
            "Un-tuned estates drown in noise (a majority of alerts ignored); " +
            "AIOps correlation/dedup aims to compress this sharply, but baselines vary",
          label: "planning-range",
        },
        dataSource:
          "Observability/event-management platform alert volumes vs acted-on alerts (e.g. event correlation, PagerDuty)",
        whyItMatters:
          "Alert fatigue is both a reliability risk (real signals missed) and a " +
          "toil drain. AIOps correlation/dedup targets it directly — and a falling " +
          "noise ratio is often the first honest, measurable AIOps win, ahead of MTTR.",
      },
    ],

    painThemes: [
      {
        key: "change_induced_incidents",
        name: "Change-induced incidents (self-inflicted outage)",
        description:
          "A large share of major incidents trace to a recent change — failed " +
          "deployments, mis-configurations, untested dependencies. Pressure to " +
          "move faster (including AI-accelerated change) raises volume without " +
          "proportionate testing, review, and rollback discipline, so the estate " +
          "breaks itself.",
        detectionSignal:
          "High change-related incident %, recurring post-change rollbacks, " +
          "frequent emergency/standard-change abuse, change success rate below the " +
          "high-90s, and major incidents clustering after change windows.",
        diagnosticQuestion:
          "What share of your major incidents trace to a change, and is your " +
          "change success rate and change-related incident % holding as change " +
          "volume (or automation) rises?",
      },
      {
        key: "cloud_cost_sprawl",
        name: "Cloud cost sprawl and unattributed spend",
        description:
          "Cloud spend grows faster than budget through idle/oversized resources, " +
          "orphaned assets, lack of rightsizing, no commitment-discount coverage, " +
          "and spend that cannot be attributed to a team or product — a structural, " +
          "continuous drain rather than a one-time clean-up.",
        detectionSignal:
          "Persistent double-digit cloud cost variance to budget, large share of " +
          "untagged/unattributed spend, low reserved/savings-plan coverage, idle " +
          "resource and oversized-instance findings, no showback/chargeback.",
        diagnosticQuestion:
          "What is your cloud cost variance to budget, what share of spend is " +
          "untagged or unattributed, and is FinOps a continuous practice or a " +
          "periodic clean-up?",
      },
      {
        key: "stale_cmdb",
        name: "Stale / inaccurate CMDB and asset data",
        description:
          "The CMDB and asset inventory drift out of date — missing CIs, wrong " +
          "ownership, broken dependency maps — because discovery and reconciliation " +
          "are weak. This caps every downstream automation: AI cannot route by " +
          "impact, score change risk by dependency, or auto-remediate safely on bad data.",
        detectionSignal:
          "Low CMDB accuracy against discovery, manual CI updates, unknown service " +
          "ownership at incident time, dependency maps nobody trusts, and " +
          "automation projects stalled 'pending CMDB clean-up'.",
        diagnosticQuestion:
          "How accurate is your CMDB against automated discovery, and which of " +
          "your AI/automation ambitions are gated by that data quality?",
      },
      {
        key: "alert_fatigue",
        name: "Alert fatigue and observability noise",
        description:
          "Monitoring generates a flood of alerts, most non-actionable; on-call " +
          "engineers tune them out, real signals get missed, and detection/triage " +
          "dominate MTTR. Tool sprawl across siloed monitoring stacks compounds the " +
          "noise and blind spots.",
        detectionSignal:
          "High alert noise ratio, many ignored/auto-closed alerts, incidents " +
          "first reported by users rather than monitoring, multiple disconnected " +
          "monitoring tools, on-call burnout signals.",
        diagnosticQuestion:
          "What share of your alerts are actionable, how many incidents are " +
          "user-reported rather than monitoring-detected, and how many monitoring " +
          "tools must an engineer correlate by hand?",
      },
      {
        key: "service_desk_toil",
        name: "Service-desk toil and repetitive ticket volume",
        description:
          "A large share of service-desk volume is repetitive, low-complexity work " +
          "— password resets, access requests, how-to questions, software " +
          "installs — handled by live agents at high cost per ticket, with " +
          "knowledge scattered and first-contact resolution capped by poor knowledge access.",
        detectionSignal:
          "High volume of password/access/how-to tickets, low self-service " +
          "deflection, high cost per ticket, long handle times for routine " +
          "requests, stale or unsearchable knowledge base.",
        diagnosticQuestion:
          "What share of your ticket volume is repetitive and self-service-" +
          "eligible, what is your genuine deflection rate (net of reopens), and how " +
          "current is your knowledge base?",
      },
      {
        key: "deflection_vanity",
        name: "Vanity deflection (abandonment counted as resolution)",
        description:
          "Self-service and virtual-agent 'deflection' is reported as savings when " +
          "much of it is users abandoning the bot and re-contacting, or tickets " +
          "that bounce back as reopens — a vanity number that overstates value and " +
          "erodes user trust while real cost per ticket barely moves.",
        detectionSignal:
          "Headline deflection rate with no reopen/abandonment netting, rising " +
          "repeat-contact rate, falling CSAT on the self-service channel, and cost " +
          "per ticket flat despite a high reported deflection number.",
        diagnosticQuestion:
          "Is your deflection rate net of abandonment and reopens, and has cost " +
          "per ticket and repeat-contact rate actually moved — or only the " +
          "deflection headline?",
      },
      {
        key: "tool_sprawl",
        name: "Operations tool sprawl and integration debt",
        description:
          "Redundant, overlapping ITSM, monitoring, automation, and endpoint tools " +
          "accumulate across teams and acquisitions, with brittle integrations, " +
          "duplicated spend, and no single pane — so data is fragmented and AI " +
          "bolted onto the mess amplifies inconsistency rather than scaling operations.",
        detectionSignal:
          "Many overlapping tools with duplicated capability, high integration/" +
          "maintenance burden, fragmented data across stacks, shelfware licenses, " +
          "and no consolidated view of the estate.",
        diagnosticQuestion:
          "How many overlapping operations tools do you run, what is the duplicated " +
          "spend and integration burden, and is your operational data consolidated " +
          "enough for AI to reason across it?",
      },
      {
        key: "euc_digital_workplace_friction",
        name: "End-user-computing / digital-workplace friction",
        description:
          "Slow device provisioning, patch and software-distribution failures, and " +
          "poor digital-employee-experience (DEX) drive avoidable tickets and lost " +
          "productivity; problems are reactive (user reports) rather than proactive " +
          "(telemetry-detected and self-healed).",
        detectionSignal:
          "High EUC/device ticket volume, slow provisioning, patch-compliance gaps, " +
          "low DEX scores, no proactive endpoint telemetry, and recurring issues " +
          "fixed one ticket at a time rather than at the fleet level.",
        diagnosticQuestion:
          "How much of your ticket volume is end-user-computing friction, and are " +
          "device/experience problems detected proactively from telemetry or only " +
          "when a user complains?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "aiops_incident_intelligence",
        name: "AIOps event correlation & incident intelligence",
        valueMechanism:
          "Correlate, deduplicate, and enrich monitoring alerts across siloed " +
          "tools, detect anomalies early, and surface probable root cause and " +
          "impact — compressing detection and triage so engineers act on signal, " +
          "not noise. Value shows up first as a falling alert noise ratio and " +
          "MTTD, then MTTR, at held availability — NOT as 'we bought an AIOps tool'.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Consolidated monitoring/event telemetry across observability tools",
          "Baseline MTTD, MTTR, and alert noise ratio per service",
          "CMDB/service dependency data accurate enough for impact correlation",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Correlation/root-cause suggestions are advisory — humans own incident command and the fix",
          "Garbage-in: poor CMDB/dependency data produces wrong impact and root-cause inferences",
        ],
        metricsMoved: [
          "mttd",
          "mttr_incidents",
          "alert_noise_ratio",
          "system_availability",
        ],
      },
      {
        key: "virtual_agent_deflection",
        name: "Service-desk virtual agent & self-service deflection",
        valueMechanism:
          "A conversational virtual agent resolves common requests end-to-end — " +
          "password resets, access requests, how-to, status — and routes the rest " +
          "with context, deflecting repetitive volume from live agents. Value is " +
          "GENUINE deflection (net of abandonment and reopens) lowering cost per " +
          "ticket, not a vanity deflection headline.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Curated, current knowledge base and request catalog",
          "Integrations to fulfil actions (identity, access, provisioning)",
          "Baseline deflection, reopen/abandonment, and cost per ticket by channel",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Count only genuine resolutions — exclude abandonment and reopens, or value is overstated",
          "Easy hand-off to a human is mandatory; trapping users in the bot erodes trust and CSAT",
        ],
        metricsMoved: [
          "ticket_auto_resolution_rate",
          "first_contact_resolution",
          "cost_per_ticket",
        ],
      },
      {
        key: "agent_assist_knowledge",
        name: "Service-desk agent assist & knowledge copilot",
        valueMechanism:
          "An AI copilot for live agents surfaces relevant knowledge, suggests " +
          "resolutions, drafts responses, and auto-summarizes tickets — raising " +
          "first-contact resolution and SLA attainment and cutting handle time for " +
          "the work the bot cannot deflect, without closing tickets prematurely.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Searchable, current knowledge base and historical resolution data",
          "Baseline first-contact resolution, SLA attainment, and handle time",
          "Ticket-text access within data-handling and privacy policy",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Suggestions are drafts — the agent owns the resolution and the quality bar",
          "Do not lift first-contact resolution by premature closure; watch reopen rate",
        ],
        metricsMoved: [
          "first_contact_resolution",
          "sla_attainment",
          "cost_per_ticket",
        ],
      },
      {
        key: "ai_change_risk_automation",
        name: "AI change-risk scoring & guarded change automation",
        valueMechanism:
          "Score each change's risk from history, dependencies (CMDB), and blast " +
          "radius; auto-approve genuinely low-risk standard changes and route risky " +
          "ones to deeper review, with automated testing and rollback. Value is " +
          "FEWER change-related incidents and higher change success rate while " +
          "change throughput holds — never speed bought by skipping review.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Change and incident history linked for risk modeling",
          "Accurate CMDB/dependency data for blast-radius and impact scoring",
          "Baseline change success rate and change-related incident %",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Auto-approval is bounded to provably low-risk standard changes; humans own risky changes",
          "Inaccurate CMDB makes risk/blast-radius scoring unreliable — accuracy gates this bet",
        ],
        metricsMoved: [
          "change_success_rate",
          "change_related_incident_pct",
          "system_availability",
        ],
      },
      {
        key: "auto_remediation_runbooks",
        name: "Automated remediation & self-healing runbooks",
        valueMechanism:
          "Trigger pre-approved, idempotent runbooks for known failure patterns — " +
          "restart, scale, clear, failover — to remediate routine incidents without " +
          "human toil, escalating only exceptions. Value is lower MTTR and recovered " +
          "on-call capacity at held availability, gated by safe, reversible actions.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Library of known failure patterns mapped to tested runbooks",
          "Accurate CMDB/topology so automation acts on the right CI",
          "Baseline MTTR and incident recurrence for the targeted patterns",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Only automate well-understood, reversible actions; unbounded auto-remediation can widen blast radius",
          "Acting on stale CMDB data can remediate the wrong resource — accuracy is a precondition",
        ],
        metricsMoved: [
          "mttr_incidents",
          "system_availability",
          "alert_noise_ratio",
        ],
      },
      {
        key: "finops_cost_intelligence",
        name: "FinOps cloud-cost anomaly detection & rightsizing",
        valueMechanism:
          "Detect cost anomalies, recommend rightsizing, idle-resource cleanup, " +
          "and commitment-discount coverage, and attribute spend to teams/products " +
          "— turning cloud cost control into a continuous, AI-assisted practice. " +
          "Value is cloud cost variance held in-range and structural waste removed, " +
          "as a recommendations engine humans act on, not autonomous spend changes.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Granular cloud billing/usage data with resource tagging",
          "Baseline cloud cost variance to budget and waste/utilization metrics",
          "Ownership/attribution mapping (tags → teams/products) for showback",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Rightsizing/decommission actions need owner confirmation — aggressive cuts can degrade service",
          "Attribution depends on tagging hygiene; untagged spend limits both insight and accountability",
        ],
        metricsMoved: [
          "cloud_cost_variance_to_budget",
          "system_availability",
        ],
      },
      {
        key: "proactive_dex_endpoint",
        name: "Proactive digital-employee-experience & endpoint self-heal",
        valueMechanism:
          "Use endpoint and experience telemetry (DEX) to detect device/" +
          "application problems before users notice, auto-remediate at the fleet " +
          "level, and prevent ticket creation — shifting end-user computing from " +
          "reactive break-fix to proactive self-healing, deflecting EUC volume and " +
          "lifting first-contact resolution on what remains.",
        adoptionProfile: "early",
        dataDependencies: [
          "Endpoint/DEX telemetry across the device fleet",
          "Baseline EUC ticket volume, provisioning time, and DEX scores",
          "Fleet-level remediation tooling integrated with the service desk",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Fleet-wide auto-actions need staged rollout and rollback to avoid mass disruption",
          "Experience telemetry is employee data — govern it for privacy, not surveillance",
        ],
        metricsMoved: [
          "first_contact_resolution",
          "ticket_auto_resolution_rate",
          "cost_per_ticket",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "reliability_change_paired_baseline",
        name: "Paired reliability-and-change measurement baseline",
        description:
          "An instrumentation and evaluation layer that measures reliability " +
          "(MTTD, MTTR, availability, SLA attainment) and change quality (change " +
          "success rate, change-related incident %) as a PAIRED system per service " +
          "— establishing the honest baseline any AI ops claim must move. It is the " +
          "antidote to dashboard theater: it refuses to report faster restore or " +
          "deflection without the stability and change-quality counterweights.",
        boundary:
          "Owns the measurement methodology, paired baselines, and diagnostic " +
          "dashboards at the service level; does not set reliability targets or " +
          "make the investment decision — it supplies the honest numbers those use.",
        humanAccountabilityPoint:
          "Head of IT Operations / Service Management (with the SRE / observability lead)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "cmdb_data_quality_foundation",
        name: "CMDB / asset data-quality foundation (discovery + reconciliation)",
        description:
          "A foundation pattern that makes the CMDB and asset inventory " +
          "trustworthy: automated discovery, continuous reconciliation, ownership " +
          "and dependency mapping, and an accuracy SLA — because impact-aware " +
          "routing, dependency-aware change risk, and auto-remediation all inherit " +
          "this data's quality. The explicit precondition that gates the AIOps and " +
          "automation bets.",
        boundary:
          "Owns discovery, reconciliation, the accuracy metric, and the dependency " +
          "model; does not own the downstream automations that consume it, nor the " +
          "individual remediation decision.",
        humanAccountabilityPoint:
          "IT Asset & Configuration Manager (CMDB owner)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "observability_aiops_layer",
        name: "Consolidated observability & AIOps correlation layer",
        description:
          "A pattern that unifies telemetry across siloed monitoring tools and " +
          "applies AI correlation, deduplication, and anomaly detection to compress " +
          "alert noise and detection time, feeding incident intelligence and " +
          "(eventually) auto-remediation — so signal beats noise and detection " +
          "stops depending on user reports.",
        boundary:
          "Owns telemetry consolidation, correlation, and alert quality; does not " +
          "own incident command or the remediation action, which stay with " +
          "accountable on-call engineers.",
        humanAccountabilityPoint:
          "SRE / Observability lead (with on-call incident commanders)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "guarded_change_automation",
        name: "Guarded change automation & risk-tiered approval",
        description:
          "A pattern that pairs AI change-risk scoring with tiered approval and " +
          "automated test/rollback: provably low-risk standard changes flow with " +
          "minimal friction, risky changes route to deeper review, and every change " +
          "carries a rollback — so change accelerates inside a discipline that " +
          "drives change-related incidents DOWN, not up.",
        boundary:
          "Owns change-risk scoring, the approval tiering, and the test/rollback " +
          "harness; does not own the change content itself or the merge/release " +
          "authority, which stays with accountable change owners.",
        humanAccountabilityPoint:
          "Change Manager / Change Advisory Board (CAB) owner",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "finops_operating_model",
        name: "FinOps operating model & continuous cost governance",
        description:
          "A standing FinOps capability — tagging/attribution standards, " +
          "showback/chargeback, AI-assisted anomaly detection and rightsizing, and " +
          "a cross-functional cadence — that treats cloud cost as a continuous, " +
          "accountable practice rather than a periodic clean-up, holding variance " +
          "in-range and removing structural waste.",
        boundary:
          "Owns cost visibility, attribution, optimization recommendations, and the " +
          "governance cadence; does not own engineering architecture decisions or " +
          "the spend authority of product/engineering teams.",
        humanAccountabilityPoint:
          "FinOps lead / Cloud Cost Governance owner (with Finance and engineering)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "IT-operations value is realized as more reliable, lower-toil, " +
        "lower-cost run-IT — measured as the PAIRING of reliability (MTTD/MTTR/" +
        "availability/SLA) with change quality (change success rate, " +
        "change-related incident %), plus genuine ticket deflection and cloud " +
        "cost held in-range. The honest chain is: AI removes alert noise and " +
        "detection toil, deflects repetitive tickets, and scores change risk; " +
        "that lowers MTTD/MTTR, cost per ticket, and change-related incidents IF " +
        "the foundations hold — an accurate CMDB, consolidated telemetry, and " +
        "review discipline. Each step is haircut: CMDB/data-quality ceilings cap " +
        "every automation bet; deflection give-back (abandonment and reopens) " +
        "shrinks the headline; change-risk give-back appears if speed outruns " +
        "testing; and attribution uncertainty (many things move MTTR at once) " +
        "erodes credit. Recovered operations capacity is value only if reinvested " +
        "in higher-value reliability/engineering work — and the business case must " +
        "never book a deflection headline, a tool purchase, or 'fewer alerts' as " +
        "savings. The discipline that keeps it honest is measuring reliability and " +
        "change quality together, on a foundation of trustworthy asset data.",
      dominantHaircutFactors: [
        {
          factor: "CMDB / data-quality ceiling",
          rationale:
            "AIOps correlation, impact-aware routing, dependency-aware change " +
            "risk, and auto-remediation all inherit the CMDB/telemetry quality; a " +
            "stale, inaccurate inventory caps the realizable value of every " +
            "downstream bet, often more than any other factor.",
          typicalHaircut: {
            low: 0.2,
            high: 0.6,
            basis:
              "Automation value lost where CMDB/asset accuracy and dependency " +
              "data are too weak for safe, impact-aware action",
            label: "planning-range",
          },
        },
        {
          factor: "Deflection give-back (abandonment & reopens)",
          rationale:
            "Reported self-service/virtual-agent deflection overstates value when " +
            "users abandon the bot and re-contact or tickets reopen; genuine cost " +
            "reduction is materially below the headline deflection number.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between headline deflection and genuine resolution net of " +
              "abandonment and reopens across service-desk virtual-agent rollouts",
            label: "planning-range",
          },
        },
        {
          factor: "Change-risk / stability give-back",
          rationale:
            "Faster or automated change pays back as more change-related incidents " +
            "and lower change success rate if testing, review, and rollback do not " +
            "keep pace; net value must subtract the stability give-back.",
          typicalHaircut: {
            low: 0.05,
            high: 0.3,
            basis:
              "Stability give-back from accelerated change before risk scoring, " +
              "testing, and rollback discipline mature",
            label: "planning-range",
          },
        },
        {
          factor: "Attribution uncertainty",
          rationale:
            "MTTR, availability, and cost move for many reasons at once " +
            "(architecture, demand, process, team changes); without a baseline or " +
            "matched comparison, AI/automation is credited for changes it did not cause.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Counterfactual gaps where no baseline or matched comparison isolates " +
              "the AI/automation contribution to reliability or cost",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "MTTR / MTTD reduction (availability held)",
          range: {
            low: 0.15,
            high: 0.45,
            basis:
              "Reported detect/restore-time improvement from AIOps correlation and " +
              "runbook automation where telemetry and CMDB foundations hold",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in mttr_incidents / mttd at held-or-improved system_availability",
        },
        {
          lever: "Genuine ticket deflection / cost-per-ticket reduction",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Cost-per-ticket reduction from virtual-agent + agent-assist net of " +
              "abandonment and reopens, by channel and complexity",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in cost_per_ticket with ticket_auto_resolution_rate netted of reopens",
        },
        {
          lever: "Cloud cost waste removed (variance held in-range)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Structural cloud waste removed via rightsizing, idle cleanup, and " +
              "commitment coverage where FinOps is a continuous practice",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in addressable cloud waste with cloud_cost_variance_to_budget held in-range",
        },
      ],
      timeToValueBand:
        "Virtual-agent deflection and agent-assist: 1-2 quarters to first measured " +
        "deflection and cost-per-ticket gains (faster where the knowledge base is " +
        "curated). AIOps correlation/noise reduction: 1-3 quarters to move alert " +
        "noise and MTTD once telemetry is consolidated. FinOps anomaly/rightsizing: " +
        "1-2 quarters to first waste removal, ongoing thereafter. Change-risk " +
        "automation and auto-remediation: 3-6+ quarters, gated by CMDB accuracy, " +
        "runbook libraries, and review discipline.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "ITSM platform",
          role: "System of record for incident, problem, change, request, and the service desk — the spine of run-IT process and SLA data.",
          examples: ["ServiceNow", "Jira Service Management", "BMC Helix", "Zendesk", "Cherwell/Ivanti"],
        },
        {
          name: "Observability / monitoring & event management",
          role: "Telemetry, alerting, and event correlation — the source for MTTD, alert noise, and availability.",
          examples: ["Datadog", "Dynatrace", "Splunk", "Grafana/Prometheus", "New Relic", "PagerDuty"],
        },
        {
          name: "CMDB / IT asset management & discovery",
          role: "Configuration items, assets, ownership, and dependency maps — the data-quality foundation gating automation.",
          examples: ["ServiceNow CMDB/Discovery", "Device42", "Flexera", "Lansweeper"],
        },
        {
          name: "Cloud billing & FinOps platform",
          role: "Granular cloud usage/cost, tagging/attribution, and optimization recommendations — the source for cost variance and waste.",
          examples: ["AWS Cost Explorer", "Azure Cost Management", "GCP Billing", "Apptio Cloudability", "CloudHealth"],
        },
        {
          name: "Endpoint / digital-workplace & DEX",
          role: "Device fleet management, patching, software distribution, and digital-employee-experience telemetry for EUC.",
          examples: ["Microsoft Intune", "Jamf", "Nexthink", "Tanium", "1E/ControlUp"],
        },
        {
          name: "Automation / orchestration & runbooks",
          role: "Workflow automation and runbook execution for fulfilment and remediation across the estate.",
          examples: ["ServiceNow Orchestration", "Ansible", "Rundeck", "Terraform", "PagerDuty Runbook Automation"],
        },
      ],
      roles: [
        {
          title: "CIO / VP of IT Operations (I&O)",
          accountability:
            "The run-IT estate, reliability and cost outcomes, and the AI/automation program for operations end-to-end.",
        },
        {
          title: "Head of Service Management / Service Desk",
          accountability:
            "ITSM process discipline (incident/problem/change), the service desk, SLA attainment, and deflection/automation quality.",
        },
        {
          title: "SRE / Observability lead",
          accountability:
            "Reliability engineering, observability, MTTD/MTTR, alert quality, and AIOps correlation/remediation.",
        },
        {
          title: "Change Manager / CAB owner",
          accountability:
            "Change success rate, change-related incident %, and the risk-tiered approval discipline (including AI risk scoring).",
        },
        {
          title: "IT Asset & Configuration Manager",
          accountability:
            "CMDB/asset accuracy, discovery and reconciliation, and the dependency model that automation depends on.",
        },
        {
          title: "FinOps lead / Cloud Cost Governance owner",
          accountability:
            "Cloud cost variance, attribution/tagging, optimization, and the continuous cost-governance cadence (with Finance).",
        },
      ],
      regulatoryFrames: [
        {
          name: "ITIL / service-management best practice",
          relevance:
            "The dominant operating framework for ITSM (incident/problem/change/SLA), shaping process definitions AI automates within.",
        },
        {
          name: "IT general controls & audit (SOX ITGC, change-management controls)",
          relevance:
            "Change and access controls are audited; AI change automation and auto-approval must preserve segregation of duties and an audit trail.",
        },
        {
          name: "Operational resilience & service-continuity standards (e.g. ISO 22301, DORA for financial services)",
          relevance:
            "Availability, incident response, and recovery obligations constrain how reliability and remediation are governed and evidenced.",
        },
        {
          name: "Data privacy & employee-monitoring frameworks (GDPR/CCPA)",
          relevance:
            "Endpoint/DEX and operational telemetry can be employee data; it must improve service, not surveil individuals, within privacy law.",
        },
      ],
      canonicalTerms: [
        {
          term: "MTTR / MTTD",
          definition:
            "Mean time to restore (detection-to-recovery) and mean time to detect (onset-to-detection) — the two halves of the incident lifecycle, read together.",
        },
        {
          term: "Change success rate / change-related incident %",
          definition:
            "The paired change-quality metrics: share of changes implemented without incident, and share of incidents traceable to a change — the honesty check on change velocity.",
        },
        {
          term: "CMDB / configuration item (CI)",
          definition:
            "The configuration management database and its records of assets, services, and dependencies — the foundation whose accuracy gates impact-aware automation.",
        },
        {
          term: "AIOps",
          definition:
            "AI for IT operations: correlation, deduplication, anomaly detection, and root-cause/impact inference over operational telemetry to compress noise and detection time.",
        },
        {
          term: "Deflection rate",
          definition:
            "Share of contacts resolved without a live agent via self-service/virtual agent — only honest when netted of abandonment and reopens (otherwise a vanity metric).",
        },
        {
          term: "FinOps",
          definition:
            "The continuous practice of cloud financial management — visibility, attribution, optimization, and accountability — treating cost as an engineering responsibility, not a periodic clean-up.",
        },
        {
          term: "Toil",
          definition:
            "Manual, repetitive, automatable operational effort (alert triage, routine tickets, runbook execution) that AI/automation is well-suited to remove.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Reliability improvement (MTTR/MTTD/availability)",
        authoritativeSource:
          "ITSM incident records + observability restore/detect timestamps per service, before vs after, on a defined baseline",
        whatGoodEvidenceLooksLike:
          "MTTD, MTTR, and availability measured per service against a baseline, reported ALONGSIDE change success rate and change-related incident %.",
        weakEvidenceToReject:
          "A vendor 'AIOps reduces MTTR by X%' claim, a tool-purchase, or a fewer-alerts figure presented as reliability improvement.",
      },
      {
        claim: "Genuine ticket deflection / cost reduction",
        authoritativeSource:
          "Virtual-agent/self-service telemetry joined to ticket outcomes (resolved vs reopened/escalated) and a cost-per-ticket model by channel",
        whatGoodEvidenceLooksLike:
          "Deflection netted of abandonment and reopens, with cost per ticket moving by channel/complexity — not just the routine, cheap tickets.",
        weakEvidenceToReject:
          "A headline deflection rate with no reopen/abandonment netting, or a saving computed as (tickets × cost) with cost per ticket unchanged.",
      },
      {
        claim: "Change quality held while change accelerated",
        authoritativeSource:
          "Change records linked to post-change incidents (change success rate and change-related incident % over the same window)",
        whatGoodEvidenceLooksLike:
          "Change success rate and change-related incident % flat or improving as change throughput (or automation) rises, with rollback evidence.",
        weakEvidenceToReject:
          "Change velocity reported with no change-quality metric, or auto-approval volume cited as a benefit with incidents untracked.",
      },
      {
        claim: "Cloud cost waste removed / variance controlled",
        authoritativeSource:
          "Cloud billing/usage with tagging plus FinOps optimization records, reconciled with Finance",
        whatGoodEvidenceLooksLike:
          "Variance-to-budget held in-range with specific, attributed waste removed (rightsizing/idle/commitment), traced to owners.",
        weakEvidenceToReject:
          "A theoretical saving from a recommendation never actioned, or an unattributed 'cloud spend down' figure with no baseline or owner.",
      },
      {
        claim: "Automation readiness rests on CMDB accuracy",
        authoritativeSource:
          "Discovery/reconciliation reports vs CMDB of record, with a tracked accuracy metric and dependency coverage",
        whatGoodEvidenceLooksLike:
          "A measured CMDB accuracy figure against automated discovery and dependency coverage adequate for the targeted automation.",
        weakEvidenceToReject:
          "An assertion that the CMDB is 'good enough' with no measured accuracy, or automation value claimed on unverified inventory data.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your major incidents trace to a change, and are change success rate and change-related incident % holding as change volume rises?",
      "How accurate is your CMDB against automated discovery, and which of your AI/automation ambitions are gated by that data quality?",
      "What is your genuine ticket deflection rate net of abandonment and reopens, and has cost per ticket actually moved (by channel) — not just the deflection headline?",
      "What share of your alerts are actionable, and how many incidents are detected by monitoring versus first reported by users?",
      "Do you measure reliability (MTTD/MTTR/availability/SLA) and change quality as a PAIRED system, and what are your current bands per critical service?",
      "What is your cloud cost variance to budget, what share of spend is untagged or unattributed, and is FinOps continuous or a periodic clean-up?",
      "How many overlapping operations tools do you run, and is your operational data consolidated enough for AI to reason across the estate?",
      "Are device/digital-workplace problems detected proactively from endpoint telemetry, or only when a user opens a ticket?",
    ],
    maturitySignals: [
      "Reliability and change quality are measured as a paired system per critical service, with MTTD/MTTR and change-related incident % read together.",
      "CMDB/asset accuracy is measured against automated discovery and treated as the gating foundation for automation, not an afterthought.",
      "Deflection is reported net of abandonment and reopens, and cost per ticket is tracked by channel and complexity.",
      "AIOps correlation has compressed alert noise so on-call acts on signal, and detection comes from monitoring rather than user reports.",
      "FinOps is a continuous practice with tagging/attribution, showback/chargeback, and variance held in-range — not a periodic clean-up.",
    ],
    redFlags: [
      "Change velocity (or change-automation volume) is celebrated while change success rate and change-related incident % are untracked or worsening.",
      "A headline deflection rate is reported with no abandonment/reopen netting, while cost per ticket has not moved — vanity deflection.",
      "Automation projects are stalled 'pending CMDB clean-up', and CMDB accuracy is asserted but never measured.",
      "Most alerts are non-actionable and ignored, and incidents are routinely first reported by users rather than monitoring.",
      "Cloud cost variance runs persistently double-digit over budget with a large share of spend untagged and unattributed.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Enterprise ITSM platforms (ServiceNow, BMC, Jira Service Management, others)",
        category: "ITSM / service-desk / change platform of record (increasingly AI-augmented)",
        switchingCost:
          "High — fused to process, workflow, integrations, CMDB, and reporting across the org; replatforming ITSM is a multi-quarter program, not a tool swap, which creates strong renewal leverage for the incumbent.",
        renewalDynamics:
          "Platform/enterprise agreements with rising AI/'now-assist' upsell; negotiate AI capability inclusion, true active-user/consumption basis, and avoid paying for modules that duplicate existing tooling.",
      },
      {
        vendorName: "Observability / AIOps platforms (Datadog, Dynatrace, Splunk, others)",
        category: "Monitoring, observability, event correlation, and AIOps",
        switchingCost:
          "Moderate-to-high — instrumentation, dashboards, and alert logic embed deeply; data-volume-based pricing makes both switching and growth costly, so the lever is data-volume control and consolidation.",
        renewalDynamics:
          "Often ingest/host/data-volume pricing that scales unpredictably; negotiate volume commitments, data-tiering/retention controls, and consolidation of overlapping monitoring tools to cut spend.",
      },
      {
        vendorName: "Cloud hyperscalers + FinOps tools (AWS/Azure/GCP, Cloudability, CloudHealth)",
        category: "Cloud infrastructure consumption and cloud cost management",
        switchingCost:
          "Very high for the hyperscaler (architecture and data gravity); low-to-moderate for the FinOps tool layer over the top.",
        renewalDynamics:
          "Enterprise discount programs and committed-use/savings-plan coverage are the primary cost levers; FinOps tooling should pay for itself in waste removed — negotiate on demonstrated savings, not list price.",
      },
      {
        vendorName: "Endpoint / digital-workplace & automation vendors (Intune, Tanium, Nexthink, Ansible, others)",
        category: "End-user computing, DEX, and orchestration/runbook automation",
        switchingCost:
          "Moderate — agent deployment and integrations create stickiness, but the layer is more replaceable than the ITSM/hyperscaler core; watch data export and policy portability.",
        renewalDynamics:
          "Per-device/per-node subscriptions; right-size to the managed fleet, consolidate overlapping endpoint/automation tools, and tie renewal to measured EUC ticket deflection and DEX improvement.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the ITSM platform of record and the hyperscaler estate the operations tools ride on; the observability, FinOps, and endpoint/automation layers are more portable, so the value frontier (and negotiating room) is in tool rationalization/consolidation, data-volume and consumption control, AI-capability inclusion in existing platform agreements, and avoiding duplicate-capability shelfware.",
    negotiationLevers: [
      "Rationalize and consolidate overlapping ITSM/monitoring/endpoint tools to kill duplicate-capability shelfware before renewing",
      "Control observability data volume and retention tiering — the dominant driver of ingest-priced monitoring cost",
      "Include AI/assist capabilities in the existing platform agreement rather than as a separate premium upsell",
      "Tie cloud and FinOps commercials to committed-use/savings-plan coverage and demonstrated waste removed, not list price",
      "Right-size seats/nodes/devices to active managed scale, and gate pilot-to-scale on a measured reliability/deflection graduation metric",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      reliability_claim: [
        "ITSM incident + observability restore/detect timestamps per service",
        "defined baseline (before/after) per service",
        "paired change-quality metric reported alongside",
      ],
      change_quality_claim: [
        "change records linked to post-change incidents",
        "change success rate and change-related incident % over the same window",
        "rollback / remediation evidence",
      ],
      deflection_claim: [
        "virtual-agent/self-service telemetry joined to ticket outcomes",
        "abandonment and reopen netting",
        "cost-per-ticket movement by channel and complexity",
      ],
      cost_claim: [
        "cloud billing/usage with tagging/attribution",
        "baseline cloud cost variance to budget",
        "actioned (not theoretical) waste removed, reconciled with Finance",
      ],
      automation_readiness_claim: [
        "measured CMDB/asset accuracy against discovery",
        "dependency coverage adequate for the targeted automation",
        "runbook/test/rollback safety evidence for the targeted patterns",
      ],
      value_projection: [
        "baseline operating metric",
        "benchmark planning-range",
        "explicit haircut factors (CMDB/data-quality, deflection give-back, change-risk give-back, attribution)",
      ],
    },
    citationStandard:
      "Run-IT claims cite the ITSM/observability/billing source, the period, the " +
      "service/estate scope, and the comparison basis (baseline + matched scope). " +
      "Reliability claims (MTTD/MTTR/availability/SLA) MUST be reported alongside " +
      "the paired change-quality metrics (change success rate, change-related " +
      "incident %). Deflection claims MUST be netted of abandonment and reopens " +
      "and tied to cost-per-ticket movement by channel. Cost claims cite actioned " +
      "waste with attribution, not theoretical recommendations. Automation-value " +
      "claims cite measured CMDB accuracy as the gating precondition. Value " +
      "projections cite a baseline plus a labelled planning range and the haircut " +
      "factors applied — never a single asserted ROI, a tool purchase, or a " +
      "'fewer alerts' / headline-deflection figure extrapolated to savings.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no reliability/change baseline — frame MTTR/deflection gains as an industry planning range, not their measured number.",
      "CMDB accuracy is unknown or unmeasured — flag that automation value is gated by data quality and treat ambitious automation claims as conditional.",
      "Only a headline deflection rate is available — present as gross deflection, flag that genuine cost reduction depends on abandonment/reopen netting.",
      "Reliability is improving but change quality is untracked — hedge any 'more reliable' claim until change success rate and change-related incident % are measured.",
      "Vendor-reported AIOps/MTTR or deflection outcomes are cited — mark as vendor claims pending tenant validation against a baseline.",
    ],
    inferenceLanguage: [
      "Across enterprise run-IT estates, AIOps-driven MTTD/MTTR improvements typically run...",
      "Without your CMDB accuracy figure, the industry pattern is that automation value is capped until inventory data is trustworthy.",
      "Peer service desks at this scale commonly see genuine deflection (net of reopens) plateau around...",
      "This is a recovered-operations-capacity figure read with reliability and change quality held; converting it to headcount/cost is a leadership decision your data hasn't yet made.",
    ],
    flagWithoutEvidence: [
      "A specific headcount or dollar saving for this tenant's operations or service desk",
      "This tenant's actual MTTR, change success rate, deflection net of reopens, or cloud cost variance",
      "A claim that this tenant's CMDB is accurate enough for safe auto-remediation without a measured accuracy figure",
      "A specific ROI number for this tenant's AIOps / automation / FinOps program",
      "A reliability or cost improvement attributed to AI without a baseline or matched comparison for this tenant",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "reliability and change quality together (run-IT scorecard view)",
      exhibitKind: "chart",
      chartKind: "bar",
      chartBuilder: "bar",
      note: "MTTD, MTTR, availability/SLA alongside change success rate and change-related incident %, so reliability is never read without change quality.",
    },
    {
      questionPattern: "operations value bridge (baseline to realized, with haircuts)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from baseline run-IT cost/reliability to AI-assisted, showing recovered capacity and each haircut (CMDB/data-quality, deflection give-back, change-risk give-back, attribution).",
    },
    {
      questionPattern: "value sensitivity / which haircut bites hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of CMDB/data-quality ceiling, deflection give-back, change-risk give-back, and attribution on realized value.",
    },
    {
      questionPattern: "cloud cost stack / where the spend and waste sit",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Cloud cost decomposed by team/service with addressable waste (idle, oversized, uncommitted) called out against variance-to-budget.",
    },
    {
      questionPattern: "incident / reliability trend over time / where AI moved the curve",
      exhibitKind: "chart",
      chartKind: "line",
      chartBuilder: "line",
      note: "Trend MTTD, MTTR, and change-related incident % together to show reliability improving while change quality holds (or not).",
    },
    {
      questionPattern: "IT operations scorecard",
      exhibitKind: "table",
      note: "MTTR, MTTD, first-contact resolution, deflection (net), change success rate, change-related incident %, availability, SLA attainment, cloud cost variance, cost per ticket, CMDB accuracy, alert noise vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Reliability and change quality are measured as a paired system before any AI ops claim is made",
      "CMDB/asset accuracy is measured and remediated as the gating foundation before scaling automation",
      "Deflection is counted net of abandonment and reopens, and value is read in cost per ticket by channel",
      "Observability is consolidated and alert noise compressed so detection comes from monitoring, not users",
      "Change automation runs inside risk-tiered approval with testing and rollback, driving change-related incidents down",
    ],
    failureDrivers: [
      "Celebrating change velocity or automation volume while change success rate and change-related incident % are untracked or worsening",
      "Booking vanity deflection (abandonment counted as resolution) while cost per ticket does not move",
      "Scaling AIOps/auto-remediation on a stale, inaccurate CMDB so automation acts on wrong or missing data",
      "Bolting AI onto fragmented tool sprawl and noisy telemetry, amplifying inconsistency instead of scaling operations",
      "Treating cloud cost as a periodic clean-up rather than a continuous FinOps practice, letting sprawl re-accumulate",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Service-desk virtual agents and agent-assist adopt first and fastest where " +
      "the knowledge base is curated — visible ticket/cost relief. AIOps " +
      "correlation and noise reduction follow once telemetry is consolidated, often " +
      "the first credible reliability win. FinOps anomaly/rightsizing adopts " +
      "steadily as a recommendations practice. Change-risk automation and " +
      "auto-remediation adopt last and most cautiously — gated by CMDB accuracy, " +
      "runbook maturity, audit/change controls, and operator trust that automation " +
      "will not widen blast radius. CMDB data quality is the recurring gate that " +
      "either unlocks or stalls the deeper bets.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is better here than in diffuse productivity domains because " +
      "run-IT is heavily instrumented — MTTR, deflection, change success rate, " +
      "cloud cost, and SLA attainment are measurable per service. But it is only " +
      "MEDIUM, not high: reliability and cost move for many reasons at once " +
      "(architecture, demand, process), most estates lack clean baselines or " +
      "matched comparisons, deflection headlines overstate genuine savings, and " +
      "the honest number must net out the change-risk give-back and the CMDB/" +
      "data-quality ceiling on what is even automatable. The discipline that earns " +
      "clarity is measuring reliability AND change quality together against a " +
      "baseline, on trustworthy asset data — and refusing to book deflection " +
      "headlines, tool purchases, or fewer-alerts as ROI.",
  },

  regulatoryFrame: {
    name: "IT operations governance: service-management controls, change/audit, and operational resilience",
    relevance:
      "The dominant cross-cutting frame for the run-IT layer: ITSM operates within " +
      "ITIL/service-management practice; change and access controls are audited " +
      "(SOX ITGC) so AI change automation and auto-approval must preserve " +
      "segregation of duties and an audit trail; availability and recovery are " +
      "governed by operational-resilience and continuity obligations (ISO 22301, " +
      "and DORA for financial services); and endpoint/DEX and operational " +
      "telemetry can constitute employee data subject to privacy law — it must " +
      "improve service, not surveil individuals (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (shared-svcs)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
