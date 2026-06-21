// Consilium expert — Technology Resilience, BCDR & IT Risk (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It answers the
// question every operational/technology-resilience and business-continuity
// leader is asking: "across the estate — disaster recovery and business
// continuity (BCDR), the resilience of critical services, incident and crisis
// management, third-party and concentration risk, chaos/resilience testing, and
// the regulatory operational-resilience regimes (DORA, FFIEC, ISO 22301) — can
// we actually survive a regional cloud outage, a ransomware event, or the loss
// of a critical vendor, what does proving that cost, and how do I tell a
// resilience program that is REAL from one that exists only on paper?"
//
// HONESTY DOCTRINE. This expert is built around three non-negotiable truths the
// resilience world keeps re-learning. First, the DOMINANT FAILURE IS THE
// UNTESTED DR PLAN: a recovery plan that has never been exercised against a real
// failover is a hypothesis, not a capability — declared RTO/RPO that no test has
// proven routinely collapse on first contact with a real incident. Resilience is
// PROVEN BY TESTING, NOT BY DOCUMENTS. Second, CONCENTRATION RISK is the modern
// blind spot: consolidating onto a single cloud region, a single hyperscaler, or
// a single critical vendor (and the fourth-party dependencies beneath them)
// creates a correlated single point of failure that no amount of in-stack
// redundancy fixes — and most estates cannot even enumerate their critical
// concentrations. Third, RECOVERY IS NOT RESILIENCE: backups that restore but a
// service that cannot fail over, or a runbook nobody has rehearsed under crisis
// pressure, is recovery theater. This expert refuses the "we have a DR plan,
// therefore we are resilient" leap and insists on tested recovery objectives,
// enumerated concentration, and exercised crisis response before any assurance
// lands. It is DISTINCT from cybersecurity (which owns the threat and the SOC),
// from IT operations / ITSM (which owns run-the-business reliability and MTTR on
// day-to-day incidents), and from enterprise risk & compliance / audit (which
// owns the enterprise GRC program) — this expert owns TECHNOLOGY RESILIENCE and
// CONTINUITY: the proven ability to withstand, recover from, and adapt to
// severe-but-plausible disruption.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const technologyResilienceBcdrExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.technology-resilience-bcdr",
    expertName:
      "Technology Resilience, BCDR & IT Risk Expert (Operational Resilience / DR / Continuity)",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "technology-resilience-bcdr",
    scopeNote:
      "Horizontal across every enterprise IT organization and industry: the " +
      "technology-resilience and continuity layer — operational/technology " +
      "resilience, disaster recovery and business continuity (BCDR), the proven " +
      "reliability of critical services (resilience engineering, SRE-adjacent), " +
      "incident and crisis management, third-party/concentration and " +
      "fourth-party risk, chaos and resilience testing, and the regulatory " +
      "operational-resilience regimes (DORA, FFIEC, ISO 22301). It answers " +
      "whether the estate can actually survive severe-but-plausible disruption " +
      "(regional cloud outage, ransomware, critical-vendor loss), held to three " +
      "honest positions: the untested DR plan is the dominant failure, " +
      "resilience is proven by testing not by documents, and single-cloud / " +
      "single-vendor concentration is the modern blind spot. Explicitly DISTINCT " +
      "from Cybersecurity & AI-Augmented SecOps (which owns threat detection and " +
      "the SOC), from IT Operations & Service Management (which owns run-the-" +
      "business reliability and day-to-day incident MTTR), and from Enterprise " +
      "Risk, Compliance & Audit (which owns the enterprise GRC program) — this " +
      "expert owns the proven ability to withstand, recover from, and adapt to " +
      "disruption, not the threat, the run, or the GRC framework.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "rto_attainment",
        name: "RTO attainment (recovery within objective)",
        definition:
          "Share of critical services whose actual measured recovery time in a " +
          "test or real event met or beat their declared Recovery Time Objective " +
          "— the proof, not the promise, of how fast the estate recovers.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Tested recovery routinely undershoots declared RTO on first " +
            "exercise; mature programs that test regularly close toward the high " +
            "end, immature 'paper RTO' estates discover large gaps the first time " +
            "they actually fail over",
          label: "planning-range",
        },
        dataSource:
          "DR test / failover records and post-incident reviews vs the documented " +
          "RTO per critical service (BCM/DR tooling, e.g. Fusion, Castellan, Cutover)",
        whyItMatters:
          "The single most important honesty metric: a declared RTO no test has " +
          "validated is a hypothesis. Attainment measured against a REAL failover " +
          "is the difference between a resilience capability and a resilience document.",
      },
      {
        key: "rpo_attainment",
        name: "RPO attainment (data loss within objective)",
        definition:
          "Share of critical services whose actual measured data-loss exposure in " +
          "a test or real recovery met or beat their declared Recovery Point " +
          "Objective — how much data the estate actually loses on recovery vs the promise.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Replication lag, backup gaps, and untested restore paths cause actual " +
            "data loss to exceed declared RPO until restore is exercised end-to-end; " +
            "tested programs converge upward",
          label: "planning-range",
        },
        dataSource:
          "Restore/replication test records (last-good-data-point vs failover time) " +
          "vs documented RPO per service (backup/replication + DR tooling)",
        whyItMatters:
          "The data counterpart to RTO. Backups that exist but have never been " +
          "restored, or replication assumed but never failed over, routinely blow " +
          "RPO — making this the honesty check on the recovery-vs-resilience gap.",
      },
      {
        key: "tested_dr_coverage",
        name: "% critical services with tested DR",
        definition:
          "Share of business-critical services that have a documented recovery " +
          "plan AND a successful recovery test within the policy window — the " +
          "coverage of PROVEN, not merely documented, recoverability.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 90,
          basis:
            "Many estates have DR plans for most critical services but have " +
            "TESTED a far smaller share within the year; mature programs close the " +
            "gap, immature ones carry large untested-plan inventories",
          label: "planning-range",
        },
        dataSource:
          "BCM/DR plan inventory cross-referenced to dated successful test records " +
          "and the critical-service / business-impact-analysis list",
        whyItMatters:
          "The core resilience-by-testing metric. The gap between 'has a plan' and " +
          "'has a tested plan' is exactly where untested-DR failure lives — a high " +
          "plan-coverage number with low TESTED coverage is the dominant blind spot.",
      },
      {
        key: "dr_test_pass_rate",
        name: "DR test pass rate (objectives met)",
        definition:
          "Share of DR/failover/recovery exercises in the period that met their " +
          "defined success criteria (RTO/RPO met, no critical step failed) without " +
          "manual rescue — the quality, not just the frequency, of testing.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Early-program tests frequently fail or pass only with manual " +
            "intervention; pass rate rises as runbooks, automation, and " +
            "dependency mapping mature — a low pass rate is honest signal, not failure",
          label: "planning-range",
        },
        dataSource:
          "DR exercise records with pass/fail against defined success criteria and " +
          "manual-intervention flags (DR runbook / orchestration tooling)",
        whyItMatters:
          "Testing frequency without pass quality is theater. A program that tests " +
          "often but rarely passes cleanly is discovering its gaps (good) — but a " +
          "reported pass rate with no failure criteria is a rubber-stamp to reject.",
      },
      {
        key: "time_to_failover",
        name: "Time to failover (measured recovery time)",
        definition:
          "Measured elapsed time to fail a critical service over to its recovery " +
          "site/region and restore service in a test or real event — the actual " +
          "recovery clock behind RTO attainment.",
        unit: "hours (minutes for tier-0)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.25,
          high: 24,
          basis:
            "Active-active / automated failover reaches minutes for tier-0; " +
            "manual, runbook-driven recovery of complex stateful estates runs " +
            "hours to a day-plus, and untested paths run longer still",
          label: "planning-range",
        },
        dataSource:
          "Failover test / real-event timestamps (declare → service restored) per " +
          "service tier (DR orchestration, observability restore timestamps)",
        whyItMatters:
          "The measured number RTO attainment is computed from. It exposes whether " +
          "recovery is automated and rehearsed or manual and improvised — and " +
          "improvised recovery under crisis pressure is where declared RTOs break.",
      },
      {
        key: "critical_service_availability",
        name: "Availability of critical services",
        definition:
          "Share of time the most business-critical services are available and " +
          "meeting their performance threshold over a period, including through " +
          "disruptive events — the resilience outcome the business actually feels.",
        unit: "% (e.g. 99.95)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 99,
          high: 99.99,
          basis:
            "Business-critical / important business services target three-to-four " +
            "nines through disruption; each added nine costs steeply in redundant " +
            "architecture, so the target is per-service and impact-tolerance-driven",
          label: "planning-range",
        },
        dataSource:
          "Observability / SLO tooling availability per critical service, measured " +
          "across normal and disrupted periods (e.g. Datadog, Dynatrace, status tooling)",
        whyItMatters:
          "The bottom-line resilience promise to the business and the metric " +
          "regulators frame as 'impact tolerance'. Availability sustained THROUGH " +
          "disruption — not just on a calm day — is the real test of resilience.",
      },
      {
        key: "single_points_of_failure",
        name: "Single-points-of-failure count (critical services)",
        definition:
          "Number of critical services with a known single point of failure — a " +
          "component, region, provider, or dependency whose loss takes the service " +
          "down with no automatic alternative — that is unmitigated.",
        unit: "count",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 30,
          basis:
            "Mature programs drive unmitigated SPOFs on critical services toward " +
            "zero through architecture and supplier diversity; estates that have " +
            "never mapped dependencies carry many they cannot yet enumerate",
          label: "planning-range",
        },
        dataSource:
          "Dependency / architecture mapping and resilience assessments against the " +
          "critical-service list (architecture reviews, CMDB dependency data)",
        whyItMatters:
          "SPOFs are where resilience fails in practice. The honest danger is the " +
          "SPOF you have NOT enumerated — a low reported count on an unmapped estate " +
          "means blindness, not safety, so it is read with dependency-mapping coverage.",
      },
      {
        key: "concentration_risk_exposure",
        name: "Concentration risk exposure",
        definition:
          "Share of critical-service capability concentrated on a single cloud " +
          "region, single hyperscaler, or single critical third party (including " +
          "fourth-party dependencies beneath them) with no viable alternative — the " +
          "modern correlated-failure blind spot.",
        unit: "% of critical capability single-sourced",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 80,
          basis:
            "Cloud and vendor consolidation concentrates critical capability; " +
            "few estates have mapped or reduced it, so exposure is commonly high " +
            "and the directional ask is downward through diversity/exit capability",
          label: "planning-range",
        },
        dataSource:
          "Critical-service-to-provider/region mapping and third-party dependency " +
          "register (cloud account mapping, TPRM register, BIA dependencies)",
        whyItMatters:
          "Concentration is the modern blind spot: in-stack redundancy does not " +
          "protect against the loss of the region, the hyperscaler, or the vendor " +
          "itself. Most estates cannot even enumerate their critical concentrations.",
      },
      {
        key: "mean_time_to_recover",
        name: "Mean time to recover (severe disruption)",
        definition:
          "Average measured time to fully recover a critical service after a " +
          "severe disruptive event (not a routine incident) — from declaration to " +
          "verified business-service restoration.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 72,
          basis:
            "Recovery from severe events (region loss, ransomware, major data " +
            "corruption) runs hours for well-rehearsed estates to days for " +
            "complex, untested, or interdependent ones",
          label: "planning-range",
        },
        dataSource:
          "Crisis/major-incident records and DR exercise outcomes (declared → fully " +
          "recovered) for severe-disruption scenarios",
        whyItMatters:
          "Distinct from day-to-day ITSM MTTR: this is recovery from SEVERE, " +
          "rehearsed-scenario disruption. It is the number the board and regulators " +
          "ask about, and it is only credible when proven by exercise, not asserted.",
      },
      {
        key: "incident_recurrence_rate",
        name: "Incident recurrence rate (resilience-relevant)",
        definition:
          "Share of significant disruptive incidents that recur from the same root " +
          "cause within a period — the measure of whether post-incident learning " +
          "and resilience remediation actually close the gap.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 40,
          basis:
            "Programs with disciplined post-incident review and tracked remediation " +
            "drive recurrence low; estates that close incidents without remediating " +
            "root cause repeat the same failures",
          label: "planning-range",
        },
        dataSource:
          "Major-incident / problem records with root-cause linkage and remediation " +
          "tracking (post-incident review records, problem management)",
        whyItMatters:
          "Resilience is adaptive: an estate that keeps suffering the same outage " +
          "has a learning gap, not just a recovery gap. High recurrence means " +
          "remediation actions are logged but not landed.",
      },
      {
        key: "resilience_test_coverage",
        name: "Resilience-test coverage (scenarios exercised)",
        definition:
          "Share of severe-but-plausible disruption scenarios in the program's " +
          "scenario library (region loss, provider loss, ransomware, data " +
          "corruption, key-person loss) that have been exercised within the policy " +
          "window across the critical estate.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 85,
          basis:
            "Programs often test a narrow set of comfortable scenarios; broad " +
            "coverage across severe-but-plausible scenarios (including provider and " +
            "concentration failures) is a maturity marker most estates have not reached",
          label: "planning-range",
        },
        dataSource:
          "Scenario library cross-referenced to dated exercise records (DR tests, " +
          "tabletop exercises, chaos experiments, crisis simulations)",
        whyItMatters:
          "Testing only easy scenarios overstates resilience. Coverage across the " +
          "severe-but-plausible set — especially concentration and provider-loss " +
          "scenarios most skip — is what makes the assurance honest.",
      },
      {
        key: "dr_test_frequency",
        name: "DR test frequency (critical services)",
        definition:
          "Average number of recovery/failover exercises per critical service per " +
          "year — how often recoverability is actually re-proven rather than " +
          "assumed to persist from a one-off historic test.",
        unit: "tests / critical service / year",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 1,
          high: 12,
          basis:
            "Annual testing is a common floor; mature/regulated estates test " +
            "critical services more frequently (quarterly to continuous via " +
            "automation), since recoverability decays as the estate changes",
          label: "planning-range",
        },
        dataSource:
          "DR/BCM exercise calendar and records per critical service (BCM tooling, " +
          "DR orchestration schedules)",
        whyItMatters:
          "Recoverability decays: a service tested once two years ago has drifted " +
          "out of recoverability as code, config, and dependencies changed. " +
          "Frequency keeps the tested-DR coverage real over time, not a stale stamp.",
      },
    ],

    painThemes: [
      {
        key: "untested_dr_plans",
        name: "Untested DR plans (the dominant failure)",
        description:
          "Recovery plans exist on paper with declared RTO/RPO, but a large share " +
          "of critical services have never been failed over end-to-end — so the " +
          "objectives are hypotheses. On first contact with a real incident the " +
          "untested plan reveals broken dependencies, missing steps, stale " +
          "credentials, and recovery times that blow the declared RTO. This is the " +
          "single most common and most consequential resilience failure.",
        detectionSignal:
          "High plan coverage but low TESTED-DR coverage, RTO/RPO declared but " +
          "never measured against a real failover, last successful test dates " +
          "years old or absent, DR tests that pass only with heavy manual rescue.",
        diagnosticQuestion:
          "For your critical services, what share have a recovery plan that has " +
          "actually been failed over end-to-end within the year, and how did " +
          "measured recovery compare to the declared RTO/RPO?",
      },
      {
        key: "concentration_blind_spot",
        name: "Concentration / single-vendor blind spot",
        description:
          "Critical capability is consolidated onto a single cloud region, a " +
          "single hyperscaler, or a single critical vendor (with fourth-party " +
          "dependencies beneath) creating a correlated single point of failure no " +
          "in-stack redundancy fixes — and most estates cannot even enumerate " +
          "their critical concentrations, so the risk is invisible until the " +
          "region, provider, or vendor goes down.",
        detectionSignal:
          "No critical-service-to-provider/region map, high concentration-risk " +
          "exposure, no tested exit or alternative for a critical vendor, " +
          "unknown fourth-party dependencies, multi-region 'redundancy' all in one " +
          "provider/account/control plane.",
        diagnosticQuestion:
          "What share of your critical capability runs on a single cloud region, " +
          "provider, or vendor with no viable tested alternative, and can you " +
          "enumerate your critical fourth-party dependencies?",
      },
      {
        key: "recovery_theater",
        name: "Recovery theater (recovery ≠ resilience)",
        description:
          "The program conflates having backups, a plan, or a passed tabletop with " +
          "being resilient. Backups restore in isolation but the service cannot " +
          "fail over; a runbook exists but nobody has rehearsed it under crisis " +
          "pressure; a DR test 'passes' with no real failure criteria — so the " +
          "estate believes it is resilient until a real event proves otherwise.",
        detectionSignal:
          "DR tests with no defined RTO/RPO success criteria, passed exercises that " +
          "required undocumented manual intervention, backups verified but full " +
          "service failover never demonstrated, crisis runbooks never rehearsed " +
          "live, resilience reported as plan/document existence.",
        diagnosticQuestion:
          "Do your DR tests have explicit RTO/RPO pass criteria and run without " +
          "manual rescue, and have your crisis runbooks been rehearsed live under " +
          "realistic pressure — or only reviewed on paper?",
      },
      {
        key: "third_party_resilience_gap",
        name: "Third-party / supply-chain resilience gap",
        description:
          "Critical services depend on third (and fourth) parties whose own " +
          "resilience is unverified — no resilience SLAs, no exit plan, no tested " +
          "failover away from the vendor, and no visibility into the vendor's " +
          "concentrations. The enterprise inherits the weakest link's resilience " +
          "without knowing it.",
        detectionSignal:
          "Critical vendors with no resilience/recovery clauses, no tested exit or " +
          "substitutability, unmapped fourth-party dependencies, vendor outages " +
          "that take the enterprise down with no fallback, TPRM that scores " +
          "security but not continuity.",
        diagnosticQuestion:
          "For your critical third parties, do you have tested exit/substitution " +
          "capability, resilience commitments, and visibility into their own " +
          "concentrations — or do you inherit their resilience unverified?",
      },
      {
        key: "crisis_response_unrehearsed",
        name: "Unrehearsed crisis & incident command",
        description:
          "Crisis-management and incident-command structures exist in policy but " +
          "are not exercised: roles unclear under pressure, communications " +
          "improvised, decision authority ambiguous, and dependencies on the very " +
          "systems that are down (collaboration, identity). When a severe event " +
          "hits, response is slow and chaotic because it was never practiced.",
        detectionSignal:
          "No regular crisis simulations, slow or unclear escalation in past " +
          "incidents, recovery decisions improvised, crisis comms dependent on " +
          "impacted systems, post-incident reviews citing coordination failure.",
        diagnosticQuestion:
          "When did you last run a live crisis simulation for a severe scenario, " +
          "and did roles, decision authority, and out-of-band communications hold " +
          "up under realistic pressure?",
      },
      {
        key: "stale_recovery_drift",
        name: "Recoverability drift as the estate changes",
        description:
          "A service tested once stays in the inventory as 'recoverable', but the " +
          "estate moves underneath it — new dependencies, config drift, changed " +
          "data volumes, retired infrastructure — so recoverability silently " +
          "decays. The tested-DR stamp becomes stale, and the plan that worked " +
          "last year no longer matches reality.",
        detectionSignal:
          "Long intervals between tests, DR plans not updated with architecture " +
          "changes, tests that newly fail on a previously-passing service, " +
          "dependency maps out of date, recovery automation not maintained with the service.",
        diagnosticQuestion:
          "How frequently do you re-prove recovery for each critical service, and " +
          "how do you keep recovery plans and automation current as the estate changes?",
      },
      {
        key: "regulatory_resilience_pressure",
        name: "Regulatory operational-resilience pressure (DORA/FFIEC)",
        description:
          "Operational-resilience regimes (DORA in EU financial services, FFIEC " +
          "guidance, ISO 22301, sector rules) now require enumerated important " +
          "business services, impact tolerances, severe-but-plausible scenario " +
          "testing, third-party/concentration registers, and evidence of tested " +
          "recovery — and many estates have the policy but lack the tested evidence " +
          "the regulator demands.",
        detectionSignal:
          "Impact tolerances undefined for important business services, no " +
          "register of critical ICT third parties / concentrations, scenario " +
          "testing absent or narrow, recovery evidence anecdotal rather than " +
          "audit-grade, gaps surfaced in regulatory exams or self-assessment.",
        diagnosticQuestion:
          "Which operational-resilience regimes apply to you, and can you produce " +
          "audit-grade evidence of enumerated important services, impact tolerances, " +
          "severe-scenario testing, and tested recovery — not just policy?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_dr_runbook_orchestration",
        name: "AI-orchestrated DR runbooks & recovery validation",
        valueMechanism:
          "Generate, maintain, and orchestrate recovery runbooks from current " +
          "architecture and dependency data, then drive automated, frequently-" +
          "repeatable failover with measured RTO/RPO capture — turning recovery " +
          "from a manual, drift-prone, occasionally-tested procedure into a " +
          "rehearsed, instrumented capability. Value shows up as higher RTO/RPO " +
          "attainment and tested-DR coverage at lower time-to-failover, NOT as 'we " +
          "automated a runbook'.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Accurate service dependency / architecture map for the critical estate",
          "Current recovery runbooks and infrastructure-as-code for failover",
          "Baseline RTO/RPO attainment, time-to-failover, and tested-DR coverage",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Automated failover acts on production — actions must be bounded, reversible, and human-approved for high-blast-radius services",
          "Orchestration on a stale/inaccurate dependency map can recover the wrong order or miss dependencies",
          "A generated runbook is a draft until it passes a real failover with defined success criteria",
        ],
        metricsMoved: [
          "rto_attainment",
          "rpo_attainment",
          "tested_dr_coverage",
          "time_to_failover",
        ],
      },
      {
        key: "ai_dependency_concentration_mapping",
        name: "AI dependency & concentration-risk mapping",
        valueMechanism:
          "Ingest telemetry, CMDB, cloud account, and third-party data to build " +
          "and maintain a living map of critical-service dependencies — surfacing " +
          "single points of failure, single-region/single-provider concentration, " +
          "and fourth-party dependencies humans cannot enumerate by hand. Value is " +
          "a falling unmitigated-SPOF count and quantified concentration exposure " +
          "the estate can finally see and reduce, not a one-time diagram.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "CMDB / discovery, cloud account, and network topology data",
          "Third-party register and contract/dependency data for fourth-party tracing",
          "Baseline single-points-of-failure count and concentration-risk exposure",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Inferred dependencies are hypotheses — validate critical SPOFs and concentrations before acting on them",
          "Garbage-in: an incomplete CMDB/third-party register hides the very concentrations the map should surface",
        ],
        metricsMoved: [
          "single_points_of_failure",
          "concentration_risk_exposure",
          "tested_dr_coverage",
        ],
      },
      {
        key: "ai_resilience_scenario_chaos",
        name: "AI-driven resilience scenario design & chaos experiments",
        valueMechanism:
          "Use AI to generate severe-but-plausible disruption scenarios from the " +
          "dependency map and threat/incident history, prioritize the highest-risk " +
          "untested scenarios, and help safely design chaos/resilience experiments " +
          "that empirically expose weaknesses — broadening resilience-test coverage " +
          "beyond the comfortable scenarios. Value is wider, evidence-based " +
          "scenario coverage and discovered weaknesses fixed before a real event.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Dependency/concentration map and critical-service / impact-tolerance list",
          "Incident and outage history for scenario realism",
          "Baseline resilience-test coverage and a maintained scenario library",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Chaos experiments inject real failure — blast radius, abort conditions, and approval are mandatory, never autonomous on production-critical paths",
          "Scenario realism depends on dependency accuracy; a wrong map designs the wrong experiment",
        ],
        metricsMoved: [
          "resilience_test_coverage",
          "single_points_of_failure",
          "dr_test_pass_rate",
        ],
      },
      {
        key: "ai_crisis_copilot",
        name: "AI crisis-management & incident-command copilot",
        valueMechanism:
          "During a severe event, an out-of-band copilot surfaces the right " +
          "runbook, the affected dependency tree, recovery sequence, and decision " +
          "options, drafts stakeholder/regulator communications, and maintains the " +
          "incident timeline — compressing recovery time and reducing coordination " +
          "chaos so scarce crisis leaders decide instead of scramble. Value is " +
          "lower mean-time-to-recover on severe events, not a chatbot.",
        adoptionProfile: "early",
        dataDependencies: [
          "Recovery runbooks, dependency map, and crisis-role/escalation model",
          "Out-of-band (independent of impacted systems) access and comms channel",
          "Baseline mean-time-to-recover and incident-recurrence for severe events",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "The copilot must run out-of-band — if it depends on the systems that are down, it fails exactly when needed",
          "Recovery decisions stay human — the copilot advises sequence and options, the incident commander owns the call",
          "Generated regulator/stakeholder comms are drafts requiring human approval before issue",
        ],
        metricsMoved: [
          "mean_time_to_recover",
          "incident_recurrence_rate",
          "critical_service_availability",
        ],
      },
      {
        key: "ai_third_party_resilience_monitoring",
        name: "AI third-party & concentration resilience monitoring",
        valueMechanism:
          "Continuously monitor critical third parties for resilience signals " +
          "(outages, incidents, concentration changes, fourth-party shifts) and " +
          "model the enterprise impact of a critical-vendor loss against tested " +
          "exit/substitution capability — turning third-party resilience from a " +
          "point-in-time questionnaire into continuous, impact-aware monitoring. " +
          "Value is reduced concentration exposure and earlier warning of " +
          "supply-chain resilience erosion.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Third-party register with criticality and dependency mapping",
          "External resilience/outage signals and vendor concentration data",
          "Baseline concentration-risk exposure and tested exit/substitution status",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Monitoring is advisory — exit/diversification decisions are commercial and architectural, owned by humans",
          "Vendor resilience cannot be fully observed externally; signals supplement, not replace, contractual evidence and tested exit",
        ],
        metricsMoved: [
          "concentration_risk_exposure",
          "single_points_of_failure",
          "mean_time_to_recover",
        ],
      },
      {
        key: "ai_post_incident_learning",
        name: "AI post-incident learning & recurrence prevention",
        valueMechanism:
          "Mine incident, problem, and post-incident-review data to cluster root " +
          "causes, detect recurring failure patterns and unremediated actions, and " +
          "prioritize the resilience fixes that actually close repeat-outage risk " +
          "— making the program adaptive rather than reactive. Value is a falling " +
          "incident-recurrence rate as learning turns into landed remediation, not " +
          "a backlog of logged-but-ignored actions.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Major-incident, problem, and post-incident-review records with root-cause data",
          "Remediation-action tracking with status and ownership",
          "Baseline incident-recurrence rate and severe-event mean-time-to-recover",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Root-cause clustering is a hypothesis generator — humans confirm cause and own the remediation decision",
          "Recurrence falls only if remediation actually lands; surfacing patterns without execution accountability changes nothing",
        ],
        metricsMoved: [
          "incident_recurrence_rate",
          "mean_time_to_recover",
          "critical_service_availability",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "tested_recovery_foundation",
        name: "Tested-recovery foundation (BIA → tested RTO/RPO)",
        description:
          "A foundation pattern that makes recovery objectives REAL: a business-" +
          "impact analysis ranks critical services and sets impact tolerances, " +
          "every critical service carries an RTO/RPO, and — non-negotiably — those " +
          "objectives are PROVEN by scheduled, criteria-based failover tests with " +
          "measured RTO/RPO attainment and a pass rate. It is the antidote to the " +
          "untested-DR plan: an objective no test has validated is not admitted as " +
          "a capability.",
        boundary:
          "Owns the BIA, impact tolerances, the recovery-objective inventory, and " +
          "the test methodology and evidence; does not own the application " +
          "architecture decisions or the recovery automation build, which it " +
          "validates and depends on rather than owns.",
        humanAccountabilityPoint:
          "Head of IT Resilience / BCDR (with critical-service business owners)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "dependency_concentration_register",
        name: "Living dependency & concentration register",
        description:
          "A foundation pattern that maintains a continuously-updated map of " +
          "critical-service dependencies, single points of failure, and " +
          "single-region/provider/vendor concentration (including fourth-party " +
          "dependencies) — because you cannot reduce concentration or close a SPOF " +
          "you have not enumerated. It is the explicit precondition that turns the " +
          "concentration blind spot into a managed, quantified exposure.",
        boundary:
          "Owns dependency mapping, the SPOF and concentration inventory, and the " +
          "third/fourth-party dependency register; does not own the remediation " +
          "(architecture diversity, vendor exit) decisions that consume it.",
        humanAccountabilityPoint:
          "Resilience Architect / IT Risk lead (CMDB and TPRM owners contributing)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "resilience_engineering_architecture",
        name: "Resilience-engineering architecture (multi-region/multi-provider)",
        description:
          "A pattern that designs critical services to withstand and self-recover " +
          "from failure: redundancy across failure domains (zones, regions, and " +
          "where justified providers), automated failover, graceful degradation, " +
          "and continuous chaos/resilience testing that empirically proves the " +
          "design — moving from 'recover after it breaks' to 'keep running when a " +
          "domain fails', and reducing both SPOFs and concentration.",
        boundary:
          "Owns the resilience architecture, failover automation, and chaos-test " +
          "regime for critical services; does not own the product/feature roadmap " +
          "or the cost/architecture trade-off authority, which sit with engineering " +
          "and the business.",
        humanAccountabilityPoint:
          "Principal Resilience / SRE Architect (with service engineering owners)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "crisis_command_exercised",
        name: "Exercised crisis-management & incident-command capability",
        description:
          "A pattern that makes crisis response real: a clear incident-command " +
          "structure with defined roles and decision authority, out-of-band " +
          "communications independent of impacted systems, regulator/stakeholder " +
          "comms templates, and — critically — REGULAR LIVE EXERCISES (tabletop and " +
          "simulation) so the team has rehearsed before a real severe event. It " +
          "treats crisis competence as a practiced skill, not a policy document.",
        boundary:
          "Owns the crisis-management framework, the exercise program, and the " +
          "out-of-band comms capability; does not own the recovery execution of " +
          "individual services (the technical teams) or the business-continuity " +
          "decisions of the business units it coordinates.",
        humanAccountabilityPoint:
          "Crisis Management Lead / Business Continuity Manager",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Technology-resilience value is realized as AVOIDED LOSS and ASSURED " +
        "CONTINUITY — the cost of outages, data loss, regulatory penalty, and " +
        "reputational damage that did NOT occur because critical services survived " +
        "or recovered fast — plus the efficiency of running the resilience program " +
        "itself. The honest chain is: tested recovery objectives, enumerated " +
        "concentration, exercised crisis response, and resilience-engineered " +
        "architecture together raise RTO/RPO attainment, tested-DR coverage, and " +
        "critical-service availability through disruption, and lower " +
        "mean-time-to-recover, SPOFs, and recurrence. Each step is haircut. The " +
        "hardest part of the value case is attribution: the prize is largely " +
        "AVOIDED loss (the outage that didn't happen, the breach-of-RTO that " +
        "wasn't), which is real but probabilistic — a quiet year is not proof of " +
        "resilience, and you cannot book a counterfactual as savings. Untested " +
        "objectives must be discounted hard because a declared RTO no failover has " +
        "validated is a hypothesis, not value. Concentration give-back appears " +
        "where 'redundancy' is all inside one provider/region and does not protect " +
        "against the correlated failure. And resilience-test coverage gaps cap " +
        "credibility — testing only comfortable scenarios overstates the assurance. " +
        "The discipline that keeps it honest: size resilience value as " +
        "expected-loss-avoided anchored on TESTED recovery evidence, never on the " +
        "existence of a plan, a backup, or a passed tabletop with no failure criteria.",
      dominantHaircutFactors: [
        {
          factor: "Untested-objective discount (paper RTO/RPO)",
          rationale:
            "A declared RTO/RPO that no end-to-end failover has validated is a " +
            "hypothesis; tested recovery routinely undershoots the declared " +
            "objective on first exercise. Value claimed on untested objectives must " +
            "be discounted hard until proven — the dominant resilience haircut.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "Gap between declared (untested) recovery objectives and measured " +
              "recovery on first real failover across DR programs",
            label: "planning-range",
          },
        },
        {
          factor: "Avoided-loss attribution uncertainty",
          rationale:
            "The largest part of the prize is disruption that did NOT happen — " +
            "inherently probabilistic and hard to attribute to a specific " +
            "resilience control. A calm period is not proof, and the counterfactual " +
            "cannot be booked as realized savings.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between modeled expected-loss-avoided and what can be defensibly " +
              "attributed to a specific resilience investment",
            label: "planning-range",
          },
        },
        {
          factor: "Concentration give-back (correlated failure)",
          rationale:
            "Redundancy concentrated inside a single provider, region, or control " +
            "plane does not protect against the loss of that provider/region/vendor; " +
            "modeled resilience value must subtract the concentration give-back where " +
            "alternatives are untested or absent.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Resilience value lost where critical capability remains single-" +
              "sourced with no viable tested alternative or exit",
            label: "planning-range",
          },
        },
        {
          factor: "Scenario-coverage & data-quality ceiling",
          rationale:
            "Resilience value is only as credible as the scenarios tested and the " +
            "dependency data beneath them; narrow scenario coverage and an " +
            "incomplete dependency/concentration map cap the realizable, " +
            "evidence-backed assurance below the theoretical model.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Assurance lost where resilience-test coverage is narrow or " +
              "dependency/concentration data is too incomplete to trust",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Recovery-time / downtime-loss reduction (tested)",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Reported reduction in severe-event recovery time and downtime loss " +
              "from rehearsed, automated, tested recovery vs untested/manual recovery",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in mean_time_to_recover / time_to_failover at " +
            "held-or-improved critical_service_availability",
        },
        {
          lever: "Concentration / SPOF exposure reduced",
          range: {
            low: 0.15,
            high: 0.5,
            basis:
              "Reduction in unmitigated single-points-of-failure and single-sourced " +
              "critical capability from dependency mapping plus diversity/exit capability",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in single_points_of_failure and " +
            "concentration_risk_exposure on the critical estate",
        },
        {
          lever: "Expected disruption-loss avoided (risk reduction)",
          range: {
            low: 0.15,
            high: 0.45,
            basis:
              "Modeled reduction in expected annualized disruption loss (frequency " +
              "x impact) from tested recovery and reduced concentration — probabilistic, not booked",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in modeled expected disruption-loss, framed as " +
            "avoided loss anchored on tested-DR coverage, not realized savings",
        },
      ],
      timeToValueBand:
        "Dependency & concentration mapping: 1-2 quarters to first enumerated " +
        "SPOFs and concentration exposure. DR test orchestration and tested-DR " +
        "coverage uplift: 2-4 quarters to move RTO/RPO attainment as failover is " +
        "automated and re-tested. Resilience scenario/chaos coverage: 2-4 quarters " +
        "to broaden beyond comfortable scenarios. Crisis-command exercising: 1-2 " +
        "quarters to first live simulation, ongoing thereafter. Resilience-" +
        "engineered multi-region/provider architecture: 4-8+ quarters, gated by " +
        "architecture change, cost trade-offs, and tested-failover proof.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "BCM / DR / resilience-management platform",
          role:
            "System of record for business-impact analysis, recovery plans, " +
            "RTO/RPO objectives, the critical/important-service list, and exercise " +
            "records — the spine of the resilience program and its evidence.",
          examples: ["Fusion Framework", "Castellan", "Archer BCM", "Cutover", "ServiceNow BCM"],
        },
        {
          name: "DR orchestration & failover automation",
          role:
            "Automates and instruments failover/recovery and captures measured " +
            "RTO/RPO and time-to-failover — the source for tested-recovery evidence.",
          examples: ["Azure Site Recovery", "AWS Elastic DR", "Zerto", "Cohesity/Rubrik (recovery)", "VMware SRM"],
        },
        {
          name: "CMDB / dependency & topology mapping",
          role:
            "Configuration items, service dependencies, and topology — the data " +
            "foundation for single-point-of-failure and concentration mapping.",
          examples: ["ServiceNow CMDB/Discovery", "Device42", "cloud topology/resource graph tooling"],
        },
        {
          name: "Third-party / supplier risk register (TPRM)",
          role:
            "Critical third parties, contracts, criticality, and fourth-party " +
            "dependencies — the source for concentration and supply-chain resilience.",
          examples: ["Prevalent", "OneTrust TPRM", "ProcessUnity", "Archer Third Party"],
        },
        {
          name: "Observability / SLO & availability tooling",
          role:
            "Availability and performance of critical services through normal and " +
            "disrupted periods — the source for critical-service availability and impact tolerance.",
          examples: ["Datadog", "Dynatrace", "Grafana/Prometheus", "status/SLO tooling"],
        },
        {
          name: "Backup / replication & immutable-storage platform",
          role:
            "Backup, replication, and immutable/air-gapped copies underpinning RPO " +
            "and ransomware-recoverable data — the source for restore-test evidence.",
          examples: ["Rubrik", "Cohesity", "Veeam", "Commvault", "cloud backup vaults"],
        },
      ],
      roles: [
        {
          title: "CIO / Head of IT Resilience (Operational Resilience owner)",
          accountability:
            "The technology-resilience and BCDR program end-to-end: tested recovery, " +
            "concentration reduction, regulatory resilience evidence, and the AI/automation that supports it.",
        },
        {
          title: "BCDR / Business Continuity Manager",
          accountability:
            "Business-impact analysis, recovery plans, RTO/RPO objectives, the " +
            "exercise/test program, and tested-DR coverage and pass rate.",
        },
        {
          title: "Resilience / SRE Architect",
          accountability:
            "Resilience-engineering architecture, failover automation, chaos/" +
            "resilience testing, and reducing single points of failure.",
        },
        {
          title: "Crisis Management Lead",
          accountability:
            "Incident-command structure, crisis exercises, out-of-band comms, and " +
            "mean-time-to-recover on severe events.",
        },
        {
          title: "IT Risk / Third-Party Resilience Lead",
          accountability:
            "Concentration-risk and SPOF inventory, critical third/fourth-party " +
            "resilience, tested exit/substitution, and the dependency register.",
        },
        {
          title: "Operational Resilience / Compliance liaison",
          accountability:
            "Mapping the program to DORA/FFIEC/ISO 22301 obligations and producing " +
            "audit-grade evidence of important services, impact tolerances, and tested recovery.",
        },
      ],
      regulatoryFrames: [
        {
          name: "DORA (Digital Operational Resilience Act — EU financial services)",
          relevance:
            "Mandates ICT risk management, incident reporting, severe-but-plausible " +
            "scenario (threat-led) testing, and a register of critical ICT third " +
            "parties / concentration — the most prescriptive operational-resilience regime.",
        },
        {
          name: "FFIEC / regulatory operational-resilience guidance (US financial services)",
          relevance:
            "Sets expectations for business continuity, recovery, third-party, and " +
            "concentration-risk management for regulated financial institutions and their service providers.",
        },
        {
          name: "ISO 22301 (business continuity management systems)",
          relevance:
            "The dominant international standard for business-continuity management — " +
            "BIA, recovery strategies, exercising, and continual improvement — that resilience programs certify against.",
        },
        {
          name: "Operational-resilience & impact-tolerance regimes (e.g. UK PRA/FCA important business services)",
          relevance:
            "Require firms to identify important business services, set impact " +
            "tolerances, and prove they can stay within them through severe-but-plausible disruption.",
        },
      ],
      canonicalTerms: [
        {
          term: "RTO / RPO",
          definition:
            "Recovery Time Objective (how fast a service must be restored) and " +
            "Recovery Point Objective (how much data loss is tolerable) — meaningful " +
            "only when PROVEN by a tested failover, not merely declared on paper.",
        },
        {
          term: "Business-impact analysis (BIA) / impact tolerance",
          definition:
            "The analysis that ranks critical/important services by harm-of-" +
            "disruption and sets the maximum tolerable disruption (impact tolerance) — the basis for recovery objectives.",
        },
        {
          term: "Single point of failure (SPOF)",
          definition:
            "A component, dependency, region, or provider whose loss takes a " +
            "critical service down with no automatic alternative — the unit of resilience failure.",
        },
        {
          term: "Concentration risk",
          definition:
            "Correlated-failure exposure from consolidating critical capability on " +
            "a single cloud region, hyperscaler, or vendor (and the fourth parties beneath) — the modern resilience blind spot.",
        },
        {
          term: "Chaos engineering / resilience testing",
          definition:
            "Deliberately injecting controlled failure into systems to empirically " +
            "prove (or disprove) that they withstand and recover — resilience proven by experiment, not assertion.",
        },
        {
          term: "Severe-but-plausible scenario",
          definition:
            "A disruption scenario extreme enough to stress the estate yet " +
            "realistic enough to plan for (region loss, ransomware, critical-vendor loss) — the testing unit regulators require.",
        },
        {
          term: "Fourth-party risk",
          definition:
            "The resilience exposure inherited from a critical vendor's OWN critical " +
            "suppliers — concentrations beneath your direct third parties that few estates enumerate.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Tested recovery capability (RTO/RPO attainment, tested-DR coverage)",
        authoritativeSource:
          "DR/failover test records with measured RTO/RPO and defined success " +
          "criteria, cross-referenced to the critical-service / BIA list and last-good-test dates",
        whatGoodEvidenceLooksLike:
          "Measured RTO/RPO attainment from real end-to-end failovers with pass/" +
          "fail criteria, the share of critical services TESTED within the window, " +
          "and the manual-intervention flag — recoverability proven, not asserted.",
        weakEvidenceToReject:
          "A declared RTO/RPO with no failover test behind it, 'we have a DR plan' " +
          "as proof of recoverability, or a 'passed' test with no defined success criteria.",
      },
      {
        claim: "Concentration & single-point-of-failure exposure",
        authoritativeSource:
          "Dependency/architecture map and third-party register reconciled to the " +
          "critical-service list, with single-sourced critical capability and fourth-party dependencies traced",
        whatGoodEvidenceLooksLike:
          "An enumerated SPOF and concentration inventory (region/provider/vendor) " +
          "with fourth-party dependencies named and tested alternatives/exit status shown.",
        weakEvidenceToReject:
          "An assertion of 'multi-region redundancy' with no map (often all in one " +
          "provider/control plane), or a low SPOF count on an estate whose dependencies were never mapped.",
      },
      {
        claim: "Resilience-test breadth (scenario coverage, pass rate)",
        authoritativeSource:
          "Scenario library cross-referenced to dated exercise records (DR tests, " +
          "tabletops, chaos experiments, crisis simulations) with pass/fail outcomes",
        whatGoodEvidenceLooksLike:
          "Coverage across the severe-but-plausible scenario set — including " +
          "provider-loss and concentration scenarios — with honest pass rates and discovered weaknesses tracked to fix.",
        weakEvidenceToReject:
          "A single comfortable scenario tested repeatedly, a tabletop with no " +
          "technical failover, or a test calendar with no pass/fail criteria.",
      },
      {
        claim: "Severe-event recovery & crisis competence (MTTR, recurrence)",
        authoritativeSource:
          "Crisis/major-incident records, live-exercise outcomes, and post-incident " +
          "reviews with root-cause and remediation tracking",
        whatGoodEvidenceLooksLike:
          "Measured mean-time-to-recover on severe events or realistic simulations, " +
          "with rehearsed incident command, out-of-band comms proven, and recurrence falling as remediation lands.",
        weakEvidenceToReject:
          "A crisis plan never exercised live, recovery times asserted with no event/" +
          "simulation behind them, or post-incident actions logged but never closed.",
      },
      {
        claim: "Regulatory operational-resilience evidence (DORA/FFIEC/ISO 22301)",
        authoritativeSource:
          "Mapped important-business-service list, impact tolerances, scenario-test " +
          "evidence, and the critical ICT third-party / concentration register against the applicable regime",
        whatGoodEvidenceLooksLike:
          "Audit-grade evidence of enumerated important services, defined impact " +
          "tolerances, severe-scenario testing, and tested recovery — not policy documents alone.",
        weakEvidenceToReject:
          "A resilience policy with no tested-recovery evidence, an unmapped " +
          "important-service list, or a concentration register that does not exist or omits fourth parties.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "For your critical services, what share have a recovery plan that has actually been FAILED OVER end-to-end within the year, and how did measured RTO/RPO compare to the declared objective?",
      "What share of your critical capability runs on a single cloud region, provider, or vendor with no viable tested alternative — and can you enumerate your critical fourth-party dependencies?",
      "Do your DR tests have explicit RTO/RPO pass criteria and run without manual rescue, and have your crisis runbooks been rehearsed LIVE under realistic pressure or only reviewed on paper?",
      "What is your measured mean-time-to-recover on a SEVERE event (region loss, ransomware, major data corruption) — proven by exercise, not asserted — and your DR test pass rate?",
      "How many single points of failure on critical services have you actually enumerated and mitigated, and how complete is the dependency map behind that count?",
      "Which operational-resilience regimes apply to you (DORA/FFIEC/ISO 22301), and can you produce audit-grade evidence of important services, impact tolerances, severe-scenario testing, and tested recovery — not just policy?",
      "How frequently do you re-prove recovery for each critical service, and how do you keep recovery plans and automation current as the estate changes?",
      "For your critical third parties, do you have tested exit/substitution capability and resilience commitments — or do you inherit their resilience unverified?",
    ],
    maturitySignals: [
      "Recovery objectives are PROVEN by scheduled, criteria-based failover tests with measured RTO/RPO attainment — not declared on paper and assumed.",
      "A living dependency and concentration register enumerates SPOFs and single-region/provider/vendor concentration (including fourth parties) and drives them down.",
      "Resilience-test coverage spans the severe-but-plausible scenario set — including provider-loss and concentration scenarios most programs skip — with honest pass rates.",
      "Crisis command and out-of-band comms are exercised LIVE on a regular cadence, so severe-event response is rehearsed before it is real.",
      "Post-incident remediation actually lands (recurrence falling), and recovery plans/automation are re-proven as the estate changes — recoverability does not silently drift.",
    ],
    redFlags: [
      "Most critical services have a DR plan but a far smaller share have been TESTED end-to-end within the year — declared RTO/RPO are unvalidated hypotheses.",
      "'Multi-region redundancy' is claimed but it is all inside one provider/account/control plane, and critical concentrations and fourth-party dependencies are unmapped.",
      "DR tests 'pass' with no defined RTO/RPO success criteria or only with undocumented manual rescue, and crisis runbooks have never been rehearsed live.",
      "Resilience is reported as the existence of plans, backups, or a passed tabletop, with no measured failover, scenario breadth, or tested recovery behind the assurance.",
      "Severe-event recovery time and regulatory resilience are asserted from policy with no audit-grade tested-recovery evidence, impact tolerances, or concentration register.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "BCM / resilience-management platforms (Fusion, Castellan, Archer, ServiceNow BCM)",
        category: "Business-continuity, DR planning, exercise, and resilience-evidence platform of record",
        switchingCost:
          "Moderate-to-high — the BIA, recovery plans, critical-service taxonomy, " +
          "exercise history, and regulatory-evidence mappings accrete in the tool; " +
          "migrating means re-encoding the resilience program, which creates renewal stickiness.",
        renewalDynamics:
          "Module/seat subscriptions with rising operational-resilience and " +
          "regulatory-reporting (DORA) upsell; negotiate inclusion of scenario-testing " +
          "and third-party-register modules and avoid paying twice for GRC overlap.",
      },
      {
        vendorName: "DR orchestration & failover / backup vendors (Zerto, ASR, AWS Elastic DR, Rubrik, Cohesity, Veeam)",
        category: "Failover automation, replication, immutable backup, and recovery testing",
        switchingCost:
          "Moderate-to-high — replication topology, recovery runbooks, and immutable-" +
          "backup integration embed into the estate; the recovery tooling is more " +
          "replaceable than the hyperscaler beneath it but re-engineering failover is real work.",
        renewalDynamics:
          "Capacity/workload-based subscriptions; tie renewal to demonstrated " +
          "tested-recovery outcomes (measured RTO/RPO attainment) and ransomware-" +
          "recoverable immutable copies, not list capacity.",
      },
      {
        vendorName: "Cloud hyperscalers + multi-cloud/region capability (AWS/Azure/GCP)",
        category: "The infrastructure substrate critical-service resilience and concentration ride on",
        switchingCost:
          "Very high — architecture and data gravity make the hyperscaler itself " +
          "effectively non-switchable short-term; this very stickiness IS the " +
          "concentration risk, so the lever is exit/portability capability, not a swap.",
        renewalDynamics:
          "Enterprise discount and committed-use programs; the resilience lever is " +
          "negotiating cross-region/availability-zone resilience terms and provability " +
          "of exit, balancing concentration risk against the cost of true multi-provider portability.",
      },
      {
        vendorName: "Third-party / supply-chain resilience & TPRM tools (Prevalent, OneTrust, ProcessUnity)",
        category: "Third-party criticality, concentration, exit, and supply-chain resilience monitoring",
        switchingCost:
          "Moderate — the third-party register and assessment history migrate with " +
          "effort; continuous-monitoring integrations add stickiness but the layer is more portable than the BCM core.",
        renewalDynamics:
          "Per-vendor/assessment subscriptions; prioritize coverage of CRITICAL " +
          "third parties and fourth-party tracing over breadth, and tie renewal to " +
          "concentration-exposure reduction and tested exit/substitution evidence.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the hyperscaler substrate the resilience program " +
      "rides on — and that stickiness is itself the dominant concentration risk, " +
      "so the negotiable frontier is exit/portability capability and cross-region/" +
      "provider resilience terms, not a provider swap. The BCM platform of record " +
      "and DR orchestration are stickier than the TPRM and monitoring layers; the " +
      "value frontier is tying recovery/backup and resilience-monitoring commercials " +
      "to demonstrated tested-recovery and concentration-reduction outcomes, and " +
      "avoiding duplicate GRC/BCM module spend.",
    negotiationLevers: [
      "Tie DR/backup commercials to demonstrated tested-recovery outcomes (measured RTO/RPO attainment) and immutable, ransomware-recoverable copies — not list capacity",
      "Negotiate cloud cross-region/zone resilience terms and provable EXIT/portability capability to reduce concentration risk, not just price",
      "Include DORA/operational-resilience scenario-testing and third-party-register modules in the BCM platform agreement rather than as separate premium upsell",
      "Prioritize TPRM/monitoring coverage of CRITICAL third parties and fourth-party tracing, and tie renewal to concentration-exposure reduction",
      "Consolidate overlapping BCM/GRC and DR/backup tooling to kill duplicate-capability shelfware, and gate pilot-to-scale on a measured tested-DR-coverage graduation metric",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      recovery_capability_claim: [
        "DR/failover test records with measured RTO/RPO and defined success criteria",
        "tested-DR coverage against the critical-service / BIA list with last-good-test dates",
        "manual-intervention flag and pass/fail outcome (no rubber-stamp passes)",
      ],
      concentration_claim: [
        "dependency/architecture map reconciled to the critical-service list",
        "single-sourced critical capability by region/provider/vendor with fourth-party tracing",
        "tested alternative / exit-substitution status",
      ],
      resilience_test_claim: [
        "scenario library with dated exercise records across severe-but-plausible scenarios",
        "pass/fail against defined criteria and the manual-rescue flag",
        "discovered weaknesses tracked to remediation",
      ],
      severe_recovery_claim: [
        "crisis/major-incident or live-exercise records with measured mean-time-to-recover",
        "rehearsed incident command and proven out-of-band comms",
        "post-incident root cause with remediation landed (recurrence trend)",
      ],
      regulatory_resilience_claim: [
        "mapped important-business-service list and defined impact tolerances",
        "severe-scenario test evidence and critical ICT third-party / concentration register",
        "audit-grade tested-recovery evidence, not policy documents",
      ],
      value_projection: [
        "baseline operating metric (tested attainment, SPOF/concentration, MTTR)",
        "benchmark planning-range",
        "explicit haircut factors (untested-objective discount, avoided-loss attribution, concentration give-back, scenario-coverage ceiling)",
      ],
    },
    citationStandard:
      "Resilience claims cite the BCM/DR/observability/TPRM source, the period, the " +
      "critical-service scope, and the comparison basis (baseline + matched scope). " +
      "Recovery claims (RTO/RPO) MUST cite a MEASURED failover test with defined " +
      "success criteria — never a declared objective with no test behind it. " +
      "Concentration claims MUST cite an enumerated dependency map and third/fourth-" +
      "party register, not an assertion of 'redundancy'. Resilience-test claims cite " +
      "scenario breadth and honest pass rates, not a single comfortable scenario. " +
      "Severe-recovery and regulatory claims cite audit-grade tested-recovery " +
      "evidence, not policy. Value projections separate the FIRM part (measured " +
      "tested attainment, enumerated SPOF/concentration reduction) from the " +
      "PROBABILISTIC part (expected disruption-loss avoided), cite a labelled " +
      "planning range and the haircut factors applied — never a guaranteed-dollar " +
      "'outage prevented' number or the mere existence of a plan, backup, or tabletop.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has declared RTO/RPO but no measured failover test — frame recoverability as an UNVALIDATED objective and any recovery-time claim as a planning range, not their proven number.",
      "Concentration/dependency mapping is incomplete — flag that the SPOF and concentration figures likely understate reality, and treat 'redundancy' claims as conditional on an enumerated map.",
      "Resilience value is expressed as a guaranteed return — reframe disruption-loss reduction as probabilistic expected-loss-avoided, never booked savings, and note a calm period is not proof.",
      "Only comfortable scenarios have been tested — present resilience as proven for the tested set only, and flag the untested severe-but-plausible (provider-loss, concentration) scenarios as open exposure.",
      "Vendor-reported recovery/resilience figures or a crisis plan never exercised live are cited — mark as unproven pending tenant validation against a real or simulated failover.",
    ],
    inferenceLanguage: [
      "Across enterprise estates, tested recovery commonly undershoots the DECLARED RTO/RPO on first failover by...",
      "Without your enumerated dependency map, the industry pattern is that critical concentrations are higher than assumed and 'redundancy' often sits inside one provider/control plane.",
      "Treating this as expected disruption-loss-avoided rather than a guaranteed return...",
      "Peer programs at this maturity typically reach tested-DR coverage of... once failover is automated and re-tested, rather than the plan-coverage figure they start from.",
      "Treating this as a planning range rather than your measured, tested figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar saving or 'outage/loss prevented' figure for this tenant's resilience program",
      "This tenant's actual tested RTO/RPO attainment, mean-time-to-recover, SPOF count, or concentration exposure",
      "A claim that a critical service is recoverable within its RTO/RPO without a measured end-to-end failover test",
      "A claim that the estate is multi-region/multi-provider resilient without an enumerated dependency and concentration map",
      "A resilience or continuity improvement attributed to AI/automation without a tested baseline or matched comparison for this tenant",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "resilience posture scorecard / how resilient are our critical services",
      exhibitKind: "table",
      note: "RTO/RPO attainment, % critical services with tested DR, DR test frequency/pass rate, time-to-failover, critical-service availability, SPOF count, concentration exposure, mean-time-to-recover, recurrence, resilience-test coverage vs planning ranges and own baseline.",
    },
    {
      questionPattern: "declared vs tested recovery gap / where paper RTO/RPO breaks on real failover",
      exhibitKind: "chart",
      chartKind: "bar",
      chartBuilder: "bar",
      note: "Declared RTO/RPO and plan coverage alongside MEASURED attainment and tested-DR coverage per critical service, exposing the untested-DR gap so recovery is never read as proven without a test.",
    },
    {
      questionPattern: "resilience value bridge (baseline to assured, with haircuts)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from baseline disruption-loss exposure to assured continuity, showing avoided loss and each haircut (untested-objective discount, avoided-loss attribution, concentration give-back, scenario-coverage ceiling).",
    },
    {
      questionPattern: "which haircut / risk bites hardest (resilience value sensitivity)",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of untested-objective discount, avoided-loss attribution, concentration give-back, and scenario-coverage ceiling on realized resilience value.",
    },
    {
      questionPattern: "concentration / single-point-of-failure exposure map",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Critical services by provider/region/vendor concentration x business impact, surfacing single-sourced critical capability and unmitigated SPOFs (including fourth-party) where exposure concentrates.",
    },
    {
      questionPattern: "severe-event recovery sequence / crisis timeline and dependency order",
      exhibitKind: "chart",
      chartKind: "swimlane",
      chartBuilder: "swimlane",
      note: "Swimlane of the failover/recovery sequence across teams and dependencies for a severe scenario, showing time-to-failover, decision points, and where recovery stalls or improvises.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Recovery objectives are PROVEN by scheduled, criteria-based failover tests with measured RTO/RPO attainment before any resilience assurance is claimed",
      "A living dependency and concentration register enumerates SPOFs and single-region/provider/vendor concentration (including fourth parties) so exposure can be reduced",
      "Resilience-test coverage spans the severe-but-plausible scenario set, including provider-loss and concentration scenarios, not just comfortable ones",
      "Crisis command and out-of-band comms are exercised live on a regular cadence, so severe-event response is rehearsed before it is real",
      "Post-incident remediation actually lands and recovery plans/automation are re-proven as the estate changes, so recoverability does not silently drift",
    ],
    failureDrivers: [
      "Declaring RTO/RPO and recovery plans as resilience while a large share of critical services are never failed over end-to-end — the untested-DR plan, the dominant failure",
      "Claiming 'multi-region redundancy' that is all inside one provider/control plane, with critical concentrations and fourth-party dependencies unmapped",
      "Recovery theater: backups that restore in isolation, runbooks never rehearsed under crisis pressure, DR tests that 'pass' with no failure criteria or only by manual rescue",
      "Booking avoided loss as guaranteed savings; when a real event exposes the gap, board confidence in the resilience program collapses",
      "Treating resilience as a one-time certification rather than a continuously re-tested capability, letting recoverability decay as the estate changes",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Dependency and concentration mapping plus tested-DR coverage uplift adopt " +
      "first — the visible, regulator-driven gaps. AI-assisted dependency/" +
      "concentration mapping and third-party resilience monitoring follow as a " +
      "recommendations practice. DR runbook orchestration and automated failover " +
      "adopt steadily but cautiously, gated by dependency accuracy and the " +
      "human-approval discipline production failover demands. Chaos/resilience " +
      "scenario experiments and AI crisis copilots adopt last and most carefully — " +
      "gated by blast-radius control, out-of-band independence, and operator trust " +
      "that injecting failure or automating crisis response will not cause the very " +
      "outage they guard against. Regulatory pressure (DORA/FFIEC) is the recurring " +
      "accelerant that moves untested programs to tested evidence.",
    roiClarity: "medium",
    roiClarityBasis:
      "Resilience ROI is firmer on the OPERATIONAL half — tested RTO/RPO " +
      "attainment, time-to-failover, SPOF and concentration counts, and tested-DR " +
      "coverage are directly measurable once testing is real — but inherently " +
      "softer on the RISK-REDUCTION half: the prize is largely AVOIDED disruption " +
      "loss, which is real but probabilistic and cannot be proven via counterfactual " +
      "(a calm year is not proof of resilience). Clarity is further capped by the " +
      "untested-objective problem: a declared RTO/RPO no failover has validated is a " +
      "hypothesis, so value claimed on paper objectives must be discounted hard. " +
      "This is why the evidence and hedge rules anchor the case on MEASURED tested " +
      "recovery and enumerated concentration, frame risk reduction as " +
      "expected-loss-avoided, and refuse to book the existence of a plan, a backup, " +
      "or a passed tabletop as ROI.",
  },

  regulatoryFrame: {
    name: "Operational resilience: DORA, FFIEC, ISO 22301 and impact-tolerance regimes",
    relevance:
      "The dominant cross-cutting frame for the technology-resilience layer: DORA " +
      "(EU financial services) is the most prescriptive — mandating ICT risk " +
      "management, severe-but-plausible (threat-led) scenario testing, incident " +
      "reporting, and a register of critical ICT third parties and concentration; " +
      "FFIEC and US/UK operational-resilience guidance set continuity, recovery, " +
      "third-party, and impact-tolerance expectations for important business " +
      "services; and ISO 22301 is the dominant business-continuity-management " +
      "standard programs certify against. Across all of them the through-line is the " +
      "same as this expert's doctrine: regulators increasingly demand audit-grade " +
      "evidence of TESTED recovery, enumerated concentration, and exercised " +
      "severe-scenario response — not policy documents (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (cio)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
