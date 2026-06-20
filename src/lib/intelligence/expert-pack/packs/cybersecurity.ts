// Consilium expert — Cybersecurity & AI-Augmented SecOps (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A cross-cutting
// expert spanning the enterprise security estate: threat detection & response
// (SOC / SIEM / SOAR), vulnerability & exposure management, identity & access,
// cloud security posture, AI applied TO the SOC (alert triage, detection
// engineering, phishing defense) — and the dual mandate of securing AI ITSELF.
//
// CORE DOCTRINE — THE BINDING CONSTRAINT IS HUMAN, NOT TOOLING. Most enterprises
// are over-tooled and under-staffed. The two constraints that actually cap a
// security program are (1) ALERT FATIGUE — analysts drowning in low-fidelity
// signals so real incidents are missed in the noise — and (2) the TALENT
// SHORTAGE — too few skilled analysts, with high attrition burning out the ones
// you have. AI for the SOC is genuinely transformative against BOTH: triage
// automation collapses alert volume per analyst and detection-engineering
// copilots multiply scarce expertise. BUT honesty is mandatory: AI triage can
// auto-suppress a true positive (a missed breach), introduce a new attack
// surface (prompt injection, data exfiltration via the assistant), and dull the
// analyst skill it was meant to amplify. This expert sizes the relief AND the
// new risk, and never claims autonomous response where a wrong call is a breach.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const cybersecurityExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.cybersecurity",
    expertName: "Cybersecurity & AI-Augmented SecOps Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "cybersecurity",
    scopeNote:
      "Cross-cutting transformation of the enterprise security operation: threat " +
      "detection & response (SOC / SIEM / SOAR / EDR-XDR), vulnerability & " +
      "exposure management, identity & access management, and cloud security " +
      "posture (CSPM/CNAPP) — plus the two AI mandates that now run through all of " +
      "them: applying AI TO the SOC (alert triage, detection engineering, " +
      "phishing defense, investigation copilots) and SECURING AI itself (model, " +
      "data, prompt-injection, and agent-action risk). The governing reality is " +
      "that the binding constraints are human — alert fatigue and the analyst " +
      "talent shortage — not the size of the tool stack; AI both relieves and " +
      "complicates them. Excludes physical security, pure GRC/audit program " +
      "management, and product/application security architecture as deep " +
      "specialties (referenced, but owned by adjacent experts); this expert owns " +
      "the running security operation and its AI augmentation.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "mean_time_to_detect",
        name: "Mean time to detect (MTTD)",
        definition:
          "Average elapsed time from the moment an attacker activity first " +
          "generates a signal to the moment the SOC identifies it as a genuine " +
          "security incident.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 72,
          basis:
            "Industry IR/breach reporting (e.g. Mandiant dwell-time, Verizon DBIR " +
            "patterns); mature detection-engineered SOCs reach hours, undermanaged " +
            "estates run days-to-weeks",
          label: "planning-range",
        },
        dataSource:
          "SIEM/XDR first-signal timestamp vs incident-declared timestamp in the " +
          "case/ticketing system",
        whyItMatters:
          "The headline detection-efficacy number. Every hour of undetected dwell " +
          "is attacker freedom to move laterally and stage exfiltration; MTTD is " +
          "where AI triage and detection coverage either pay off or do not.",
      },
      {
        key: "mean_time_to_respond",
        name: "Mean time to respond / remediate (MTTR)",
        definition:
          "Average elapsed time from incident detection to containment and " +
          "remediation (threat neutralized, affected assets restored).",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 96,
          basis:
            "SOC/IR benchmarks; SOAR-automated containment reaches sub-hour for " +
            "common playbooks, manual response on complex incidents runs days",
          label: "planning-range",
        },
        dataSource:
          "Case-management timestamps (detected → contained → remediated) joined " +
          "to SOAR playbook execution logs",
        whyItMatters:
          "The response counterpart to MTTD and the part of dwell time the SOC " +
          "directly controls. SOAR automation compresses it on known playbooks; " +
          "the residual is the genuinely novel incidents that need scarce experts.",
      },
      {
        key: "alerts_per_analyst_per_day",
        name: "Alert volume per analyst per day",
        definition:
          "Number of security alerts routed to a human analyst queue per " +
          "front-line analyst per working day.",
        unit: "alerts / analyst / day",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 200,
          basis:
            "SOC operations surveys; sustainable human review sits in the low tens, " +
            "drowning SOCs push hundreds — the core alert-fatigue signal",
          label: "planning-range",
        },
        dataSource:
          "SIEM/XDR alert routing counts over analyst headcount on shift",
        whyItMatters:
          "The direct measure of alert fatigue — the binding human constraint. " +
          "Above a sustainable threshold, true positives get missed in the noise " +
          "regardless of headcount; AI triage's primary job is to bend this down.",
      },
      {
        key: "false_positive_rate",
        name: "Alert false-positive rate",
        definition:
          "Share of alerts that, on investigation, are not genuine security " +
          "events (benign or non-actionable).",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 25,
          high: 95,
          basis:
            "SOC tuning benchmarks; well-engineered detections approach 25-40% FP, " +
            "noisy out-of-the-box rule sets exceed 90%",
          label: "planning-range",
        },
        dataSource:
          "Case dispositions in the SIEM/SOAR (true-positive vs false-positive " +
          "closure codes) over total alerts",
        whyItMatters:
          "The quality side of alert volume — high FP rate is what makes analysts " +
          "tune out and risks alert-suppression of real threats. It is the metric " +
          "AI triage and detection engineering most directly improve, and the one " +
          "where over-aggressive auto-suppression creates the new missed-breach risk.",
      },
      {
        key: "critical_vulns_patched_in_sla",
        name: "% critical vulnerabilities remediated within SLA",
        definition:
          "Share of critical-severity vulnerabilities (and known-exploited CVEs) " +
          "remediated or mitigated within the policy SLA window.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 95,
          basis:
            "Vulnerability-management maturity benchmarks; mature risk-based VM " +
            "programs hit 90%+ on critical/KEV, immature scan-and-spreadsheet " +
            "programs lag below 50%",
          label: "planning-range",
        },
        dataSource:
          "Vulnerability-management platform remediation timestamps against the " +
          "per-severity SLA policy",
        whyItMatters:
          "The exposure-management efficacy number. Unpatched known-exploited " +
          "vulnerabilities are the most preventable breach vector; SLA attainment " +
          "shows whether prioritization and remediation actually close exposure.",
      },
      {
        key: "mean_time_to_patch",
        name: "Mean time to patch / remediate (MTTR-vuln)",
        definition:
          "Average elapsed time from a vulnerability being identified on an asset " +
          "to it being remediated or compensatingly mitigated.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 7,
          high: 120,
          basis:
            "VM operations benchmarks; risk-based programs remediate criticals in " +
            "days-to-low-weeks, broad estates with patch friction run months",
          label: "planning-range",
        },
        dataSource:
          "Vulnerability-management platform (detection date → remediation date) " +
          "joined to asset inventory",
        whyItMatters:
          "The speed of exposure closure independent of SLA policy. Long mean " +
          "time to patch widens the window attackers exploit; it exposes patch " +
          "friction (change windows, fragile assets) that prioritization alone " +
          "cannot fix.",
      },
      {
        key: "phishing_click_rate",
        name: "Phishing simulation click rate",
        definition:
          "Share of employees who click a link or open an attachment in a " +
          "controlled phishing simulation campaign.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 30,
          basis:
            "Security-awareness benchmarks; mature continuously-trained " +
            "populations sit low single digits, untrained baselines exceed 25-30%",
          label: "planning-range",
        },
        dataSource:
          "Security-awareness / phishing-simulation platform campaign results",
        whyItMatters:
          "The human-attack-surface gauge. Phishing remains the dominant initial " +
          "access vector; click rate trends whether awareness is working and " +
          "where targeted training is needed — but report rate matters as much as " +
          "click rate.",
      },
      {
        key: "edr_coverage_pct",
        name: "EDR / sensor coverage",
        definition:
          "Share of in-scope endpoints, servers, and workloads with a healthy, " +
          "reporting endpoint-detection-and-response (or equivalent) sensor " +
          "deployed.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 99,
          basis:
            "Security-operations coverage benchmarks; mature estates exceed 95% " +
            "healthy coverage, gaps concentrate in legacy/OT/unmanaged assets",
          label: "planning-range",
        },
        dataSource:
          "EDR/XDR console deployed-and-healthy sensor count reconciled against " +
          "the asset inventory / CMDB",
        whyItMatters:
          "Detection is blind on uncovered assets — coverage gaps are exactly " +
          "where attackers persist. It is a precondition for every downstream " +
          "detection and triage metric: you cannot triage signal you never collect.",
      },
      {
        key: "soc_analyst_attrition",
        name: "SOC analyst attrition rate",
        definition:
          "Annualized voluntary attrition rate among SOC analysts and detection/" +
          "response engineers.",
        unit: "% / year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "SOC staffing surveys; burnout-driven SOC attrition commonly runs " +
            "20-35%, well above general IT, with alert fatigue the leading cause",
          label: "planning-range",
        },
        dataSource: "HRIS attrition data scoped to the SOC/security-operations org",
        whyItMatters:
          "The talent-shortage constraint made measurable. High attrition resets " +
          "institutional detection knowledge and worsens coverage; reducing alert " +
          "fatigue through AI triage is the most direct lever on it.",
      },
      {
        key: "incidents_per_quarter",
        name: "Confirmed security incidents per quarter",
        definition:
          "Count of confirmed (true-positive) security incidents handled by the " +
          "SOC per quarter, by severity.",
        unit: "incidents / quarter",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 5,
          high: 60,
          basis:
            "Highly enterprise- and threat-environment-dependent; trended against " +
            "the org's own baseline rather than an external absolute",
          label: "planning-range",
        },
        dataSource:
          "Case-management system confirmed-incident records by severity and " +
          "category",
        whyItMatters:
          "The workload-and-threat-pressure gauge. Interpreted in-range and in " +
          "context: a sudden drop can mean improved prevention OR detection blind " +
          "spots, so it is read alongside coverage and detection metrics, never " +
          "alone as a 'fewer is better' number.",
      },
      {
        key: "assets_inventoried_pct",
        name: "% of assets inventoried (attack-surface visibility)",
        definition:
          "Share of the true asset estate (endpoints, servers, cloud workloads, " +
          "identities, SaaS, external-facing services) that is discovered and " +
          "tracked in the authoritative inventory.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 98,
          basis:
            "Attack-surface-management benchmarks; mature programs with active " +
            "discovery exceed 95%, CMDB-only estimates routinely overstate true " +
            "coverage by 20-40 points",
          label: "planning-range",
        },
        dataSource:
          "Asset/attack-surface-management discovery reconciled against the CMDB, " +
          "cloud accounts, and identity provider",
        whyItMatters:
          "You cannot protect what you cannot see — unknown assets are unmonitored " +
          "and unpatched by definition. It is the foundational denominator beneath " +
          "EDR coverage, vulnerability SLA, and exposure management.",
      },
      {
        key: "automation_triage_rate",
        name: "AI-automated triage / closure rate",
        definition:
          "Share of inbound alerts triaged, enriched, and dispositioned by " +
          "automation (AI triage + SOAR) without a human analyst manually working " +
          "them end to end.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 80,
          basis:
            "Emerging AI-SOC operating data; early adopters report 50-70% of " +
            "tier-1 triage automated, with conservative auto-CLOSE thresholds far " +
            "lower than auto-ENRICH",
          label: "planning-range",
        },
        dataSource:
          "SOAR / AI-triage platform disposition logs (automated vs " +
          "human-handled) over total alerts",
        whyItMatters:
          "The direct measure of the AI-SOC lever on alert fatigue. Every point " +
          "automated is analyst time returned to genuine investigation — but " +
          "auto-CLOSURE must be governed to avoid suppressing true positives, so " +
          "this metric is read with false-positive and missed-detection rates, " +
          "never maximized alone.",
      },
    ],

    painThemes: [
      {
        key: "alert_fatigue",
        name: "Alert fatigue & signal-to-noise collapse",
        description:
          "Analysts face hundreds of low-fidelity alerts per shift from noisy, " +
          "un-tuned detections, so genuine incidents are missed in the volume and " +
          "the team tunes out — the single binding human constraint on detection " +
          "efficacy, made worse, not better, by adding more tools.",
        detectionSignal:
          "High alerts-per-analyst-per-day, high false-positive rate, large " +
          "un-triaged backlog, true positives discovered late or by third parties.",
        diagnosticQuestion:
          "How many alerts per analyst per shift, what is your false-positive " +
          "rate, and how large is your un-triaged alert backlog?",
      },
      {
        key: "talent_shortage_and_burnout",
        name: "Analyst talent shortage & burnout-driven attrition",
        description:
          "Too few skilled analysts and detection engineers, with the ones you " +
          "have burning out on repetitive triage — so coverage suffers, " +
          "institutional knowledge resets on each departure, and the cycle " +
          "compounds. The second binding constraint: you cannot hire your way out.",
        detectionSignal:
          "SOC attrition well above general IT, chronic open requisitions, " +
          "over-reliance on a few key people, after-hours coverage gaps, rising " +
          "MTTD/MTTR as experienced staff leave.",
        diagnosticQuestion:
          "What is your SOC attrition rate and time-to-fill, and how concentrated " +
          "is your detection knowledge in a handful of people?",
      },
      {
        key: "tool_sprawl_low_integration",
        name: "Tool sprawl with low integration",
        description:
          "Dozens of overlapping point security tools generate siloed, " +
          "un-correlated signals; analysts swivel-chair between consoles, " +
          "correlation is manual, and spend rises faster than efficacy — the " +
          "over-tooled, under-integrated estate.",
        detectionSignal:
          "Large security tool count, overlapping capabilities, manual " +
          "cross-console correlation, low SOAR/automation maturity, rising license " +
          "spend without MTTD/MTTR improvement.",
        diagnosticQuestion:
          "How many distinct security tools are in your stack, how much overlaps, " +
          "and how much correlation is still manual across consoles?",
      },
      {
        key: "coverage_and_visibility_gaps",
        name: "Coverage & attack-surface visibility gaps",
        description:
          "Detection is blind on unmanaged endpoints, legacy/OT systems, " +
          "unsanctioned SaaS, and undiscovered cloud workloads — and the asset " +
          "inventory overstates true coverage — so attackers persist exactly where " +
          "no sensor reports.",
        detectionSignal:
          "EDR coverage and assets-inventoried below target, CMDB-vs-discovery " +
          "gaps, shadow IT, incidents originating on assets with no telemetry.",
        diagnosticQuestion:
          "What is your sensor coverage and inventoried-asset percentage from " +
          "active discovery — not the CMDB estimate — and where are the gaps?",
      },
      {
        key: "vuln_backlog_and_patch_friction",
        name: "Vulnerability backlog & patch friction",
        description:
          "Scanners surface far more vulnerabilities than the org can remediate; " +
          "without risk-based prioritization everything looks urgent, criticals " +
          "and known-exploited CVEs age past SLA, and patch friction (change " +
          "windows, fragile systems) stalls remediation.",
        detectionSignal:
          "Large open-vuln backlog, low critical-in-SLA attainment, long mean " +
          "time to patch, known-exploited CVEs unremediated, scan-and-spreadsheet " +
          "workflow.",
        diagnosticQuestion:
          "How do you prioritize remediation, what is your critical/KEV in-SLA " +
          "rate, and where does patch friction actually stall remediation?",
      },
      {
        key: "identity_attack_surface",
        name: "Identity sprawl & weak access governance",
        description:
          "Over-privileged accounts, dormant identities, weak MFA coverage, and " +
          "unmanaged service/non-human identities make identity the primary " +
          "attack path — credential theft and privilege escalation now eclipse " +
          "malware as the dominant breach mechanism.",
        detectionSignal:
          "Excessive standing privilege, gaps in MFA enforcement, stale/orphaned " +
          "accounts, sprawling service principals and tokens, weak " +
          "joiner-mover-leaver hygiene.",
        diagnosticQuestion:
          "What share of privileged access is standing vs just-in-time, how " +
          "complete is MFA enforcement, and how are non-human identities governed?",
      },
      {
        key: "ai_triage_misplaced_trust",
        name: "Misplaced trust in AI triage (the new risk)",
        description:
          "AI triage and auto-closure deployed without calibrated confidence " +
          "thresholds or human-in-the-loop review can silently suppress true " +
          "positives, dull analyst skill, and add an attack surface " +
          "(prompt injection, data leakage via the assistant) — the honest " +
          "downside of the very lever that relieves alert fatigue.",
        detectionSignal:
          "Aggressive auto-close thresholds with no sampling/QA, no measured " +
          "missed-detection rate on auto-closed alerts, the security copilot " +
          "granted broad data/action scope without guardrails, declining junior " +
          "analyst investigation skill.",
        diagnosticQuestion:
          "What is your measured missed-detection rate on AI-auto-closed alerts, " +
          "and what guardrails fence the security copilot's data and action scope?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_alert_triage",
        name: "AI alert triage & auto-enrichment",
        valueMechanism:
          "Cluster, correlate, enrich, and score inbound alerts so high-fidelity " +
          "signals surface and low-fidelity noise is suppressed or auto-closed " +
          "under calibrated thresholds — collapsing alert volume per analyst and " +
          "directing scarce attention at genuine threats, the primary relief on " +
          "alert fatigue.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Normalized alert/telemetry stream from the SIEM/XDR",
          "Historical alert dispositions (true- vs false-positive labels)",
          "Threat-intel and asset/identity context for enrichment",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-closure can suppress a true positive — thresholds must be conservative and sampled/QA'd",
          "Measure missed-detection rate on auto-closed alerts, not just volume reduction",
          "Triage model drift as attacker behavior changes requires retraining and monitoring",
        ],
        metricsMoved: [
          "alerts_per_analyst_per_day",
          "false_positive_rate",
          "automation_triage_rate",
          "mean_time_to_detect",
        ],
      },
      {
        key: "soar_automated_response",
        name: "SOAR automated response & containment",
        valueMechanism:
          "Encode known incident-response playbooks so containment actions " +
          "(isolate host, disable account, block indicator) execute automatically " +
          "or on one-click approval for well-understood incident types — " +
          "compressing response time and freeing scarce experts for the novel " +
          "incidents that genuinely need judgment.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Validated response playbooks per incident type",
          "Integrations/APIs to EDR, IdP, firewall, and ticketing for action",
          "Asset/identity criticality data to scope containment safely",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Automated containment can disrupt business (isolating a critical server) — scope and blast-radius controls required",
          "High-impact actions stay human-approval-required; only low-blast-radius actions auto-execute",
          "Playbooks must be tested and version-controlled as security-relevant change",
        ],
        metricsMoved: [
          "mean_time_to_respond",
          "automation_triage_rate",
          "incidents_per_quarter",
        ],
      },
      {
        key: "ai_detection_engineering",
        name: "AI-assisted detection engineering",
        valueMechanism:
          "A copilot drafts, tests, and tunes detection rules and correlation " +
          "logic from threat intel and observed gaps, and proposes false-positive " +
          "tuning from disposition history — multiplying a scarce detection " +
          "engineer's output and closing coverage gaps faster than hand-authoring.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Detection rule repository and existing correlation content",
          "Alert disposition history for false-positive tuning",
          "Threat-intel and MITRE ATT&CK technique mappings",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Auto-generated detections must be peer-reviewed and tested before production — a bad rule blinds or floods the SOC",
          "Tuning suggestions can over-suppress — validate against known-true-positive samples",
        ],
        metricsMoved: [
          "false_positive_rate",
          "mean_time_to_detect",
          "edr_coverage_pct",
        ],
      },
      {
        key: "ai_phishing_defense",
        name: "AI phishing detection & defense",
        valueMechanism:
          "Detect AI-crafted and business-email-compromise phishing through " +
          "language, behavioral, and relationship analysis that signature filters " +
          "miss, and personalize awareness training to the users and lures that " +
          "actually fool people — lowering click rate and the dominant initial-" +
          "access vector.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Email/collaboration message telemetry and sender reputation",
          "Phishing-simulation outcomes and per-user susceptibility data",
          "Historical confirmed-phishing corpus for model tuning",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Over-blocking legitimate mail creates business friction — false-positive cost is real",
          "Attackers also use AI to evade — defense must assume an adaptive adversary, not a static filter",
        ],
        metricsMoved: [
          "phishing_click_rate",
          "incidents_per_quarter",
          "mean_time_to_detect",
        ],
      },
      {
        key: "risk_based_exposure_prioritization",
        name: "AI risk-based exposure prioritization",
        valueMechanism:
          "Score vulnerabilities and exposures by real exploitability, " +
          "threat-intel signal (known-exploited / weaponized), asset criticality, " +
          "and reachability — so finite remediation capacity targets the small " +
          "fraction that is genuinely dangerous instead of chasing raw CVSS " +
          "counts, lifting critical-in-SLA attainment.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Vulnerability scan data across the estate",
          "Asset inventory with business-criticality and exposure context",
          "Exploit/threat-intel feeds (KEV, exploit availability)",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Prioritization that de-emphasizes a vuln still leaves residual risk — the rationale must be auditable",
          "Model can mis-score novel/zero-day exposure with no exploit history yet",
        ],
        metricsMoved: [
          "critical_vulns_patched_in_sla",
          "mean_time_to_patch",
          "assets_inventoried_pct",
        ],
      },
      {
        key: "investigation_copilot",
        name: "SOC investigation copilot & natural-language hunting",
        valueMechanism:
          "Let analysts query telemetry, pivot across data sources, summarize " +
          "incidents, and draft response notes in natural language — compressing " +
          "investigation time, lowering the skill floor so junior analysts work " +
          "more like seniors, and easing the talent constraint and burnout.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Queryable security data lake / SIEM with normalized schema",
          "Identity and access scoping for the copilot itself",
          "Incident/knowledge corpus for grounded summarization",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Prompt injection via attacker-controlled log/email content can manipulate the copilot — treat ingested data as untrusted",
          "Copilot data scope is a new exfiltration surface — least-privilege and audit on its access are mandatory",
          "Over-reliance can dull analyst investigation skill — keep humans deciding, not rubber-stamping",
        ],
        metricsMoved: [
          "mean_time_to_respond",
          "soc_analyst_attrition",
          "mean_time_to_detect",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "ai_augmented_soc",
        name: "AI-augmented SOC operating model",
        description:
          "A SOC where AI triage and SOAR handle high-volume tier-1 work " +
          "(enrich, correlate, auto-close low-fidelity, auto-contain " +
          "well-understood incidents) and human analysts are redeployed up the " +
          "stack to investigation, threat hunting, and detection engineering — " +
          "deflect the noise, retain the judgment, and treat alert fatigue as the " +
          "constraint to engineer down.",
        boundary:
          "Owns detection, triage, and response operations and the human/AI work " +
          "split; does not own risk acceptance, security strategy, or business " +
          "decisions on incident impact, which stay with the CISO and the business.",
        humanAccountabilityPoint:
          "SOC Manager / Head of Security Operations (accountable for what " +
          "automation is allowed to auto-close and auto-contain)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "continuous_exposure_management",
        name: "Continuous threat & exposure management (CTEM)",
        description:
          "A continuous loop — discover the attack surface, prioritize by real " +
          "exploitability and asset criticality, validate exposures, and mobilize " +
          "remediation — replacing periodic scan-and-spreadsheet vulnerability " +
          "management with risk-based, intel-driven exposure reduction.",
        boundary:
          "Owns exposure discovery, prioritization, and remediation tracking; " +
          "does not own the act of patching/config change itself (that is IT " +
          "operations) or risk acceptance (the business/CISO).",
        humanAccountabilityPoint:
          "Vulnerability / Exposure Management Lead (accountable for " +
          "prioritization rationale and SLA policy)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "zero_trust_identity",
        name: "Zero-trust identity & access architecture",
        description:
          "Identity as the control plane: strong phishing-resistant MFA, " +
          "least-privilege and just-in-time access, continuous verification, and " +
          "governance of human and non-human identities — shrinking the " +
          "credential-theft and privilege-escalation attack path that now " +
          "dominates breaches.",
        boundary:
          "Owns identity, authentication, and access-governance posture; does not " +
          "own application authorization logic or HR joiner-mover-leaver process " +
          "ownership, which it integrates with rather than replaces.",
        humanAccountabilityPoint:
          "Identity & Access Management Lead / IAM architect",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "secure_ai_controls",
        name: "Securing-AI control layer (AI-SPM / agent guardrails)",
        description:
          "Controls that protect the enterprise's OWN AI: model and data " +
          "inventory, prompt-injection and jailbreak defenses, output filtering, " +
          "least-privilege scoping of AI agents' data and action permissions, and " +
          "monitoring/audit of AI behavior — the discipline that makes the SOC's " +
          "own copilots and the wider AI estate safe to operate.",
        boundary:
          "Owns the security controls around AI systems (including the SOC's own " +
          "AI tools); does not own model development, AI governance policy, or " +
          "model accuracy/bias, which sit with AI governance and the model owners.",
        humanAccountabilityPoint:
          "CISO / AI Security Lead (accountable for the security posture of " +
          "deployed AI, including security's own copilots)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Cybersecurity value is realized as RISK REDUCTION plus OPERATIONAL " +
        "EFFICIENCY against two binding human constraints — alert fatigue and the " +
        "analyst talent shortage — not as a tooling-count increase. The dominant " +
        "AI lever attacks alert fatigue directly: triage automation and SOAR " +
        "collapse alert volume per analyst and compress MTTD/MTTR, returning " +
        "scarce analyst time to genuine investigation. The second lever multiplies " +
        "scarce expertise: detection-engineering and investigation copilots raise " +
        "junior output and lower attrition, easing the talent constraint you " +
        "cannot hire your way out of. The third is exposure reduction: risk-based " +
        "prioritization concentrates finite remediation on the small fraction of " +
        "vulnerabilities that are genuinely exploitable. BUT value must be sized " +
        "honestly on BOTH sides of the AI ledger — the same automation that " +
        "relieves fatigue can suppress a true positive (a missed breach), dull " +
        "analyst skill, and open a new attack surface (prompt injection, copilot " +
        "data exfiltration). The hardest part of the value case is attribution: " +
        "the prize is largely AVOIDED loss (breaches that did not happen), which " +
        "is real but inherently probabilistic, so efficiency gains (analyst hours, " +
        "MTTD/MTTR) anchor the firm part of the case and risk reduction is framed " +
        "as expected-loss-avoided, never as a guaranteed return.",
      dominantHaircutFactors: [
        {
          factor: "Avoided-loss attribution uncertainty",
          rationale:
            "The largest part of the prize is breaches that did not happen — " +
            "inherently probabilistic and hard to attribute to a specific " +
            "control. Forward value must be discounted because you cannot prove " +
            "the counterfactual, and a quiet quarter is not proof of efficacy.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between modeled expected-loss-avoided and what can be " +
              "defensibly attributed to a specific control in a security business case",
            label: "planning-range",
          },
        },
        {
          factor: "AI triage missed-detection & new-risk offset",
          rationale:
            "Efficiency gains from auto-triage/auto-close are partially offset by " +
            "the risk and cost of suppressed true positives and the new attack " +
            "surface the AI introduces (prompt injection, copilot data scope) — a " +
            "haircut that grows with auto-closure aggressiveness.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Observed give-back when AI-triage efficiency is netted against " +
              "missed-detection risk and the controls needed to secure the AI itself",
            label: "planning-range",
          },
        },
        {
          factor: "Coverage & data-quality gaps",
          rationale:
            "AI triage, detection, and exposure prioritization are only as good " +
            "as the telemetry and inventory beneath them; sensor gaps, dirty " +
            "asset data, and un-normalized logs cap the realizable efficacy below " +
            "the theoretical model.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Implementation experience where incomplete coverage and poor data " +
              "quality throttled AI-SOC and exposure-management results",
            label: "planning-range",
          },
        },
        {
          factor: "Analyst adoption, trust & skill transition",
          rationale:
            "Value requires analysts to trust and act on AI output, and to keep " +
            "investigation skill sharp as routine work automates; distrust, " +
            "over-reliance, or attrition during the transition leaves benefit on " +
            "the table.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "SOC change-management experience adopting AI triage and copilots " +
              "into established analyst workflows",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Alert-volume / triage-labor reduction",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reported reduction in manual tier-1 triage effort from AI triage " +
              "+ SOAR programs in early-adopter SOCs",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in analyst hours spent on manual alert triage " +
            "(and in alerts_per_analyst_per_day)",
        },
        {
          lever: "Detection & response time compression (MTTD/MTTR)",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Reported MTTD/MTTR improvement from automated triage, SOAR " +
              "containment, and investigation copilots",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in mean_time_to_detect and mean_time_to_respond " +
            "against the org's own baseline",
        },
        {
          lever: "Expected breach-loss avoided (risk reduction)",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Modeled reduction in expected annualized loss from improved " +
              "detection coverage and exposure remediation — probabilistic, not booked",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in modeled expected-loss (frequency x impact), " +
            "framed as avoided loss, not realized savings",
        },
      ],
      timeToValueBand:
        "AI triage / SOAR on existing telemetry: 1-3 quarters to measurable " +
        "alert-volume and MTTR relief. Risk-based exposure prioritization: 2-3 " +
        "quarters once inventory and intel feeds are wired. Detection-engineering " +
        "and investigation copilots: 2-4 quarters as analyst trust builds. Full " +
        "AI-augmented SOC operating-model shift (with secured-AI controls): " +
        "12-24 months, gated on coverage, data quality, and measured " +
        "missed-detection discipline.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "SIEM / security data lake",
          role:
            "Central aggregation, normalization, and correlation of security " +
            "telemetry; the system of record for alerts, detections, and the data " +
            "AI triage and hunting run on.",
          examples: [
            "Microsoft Sentinel",
            "Splunk Enterprise Security",
            "Google Security Operations (Chronicle)",
            "Elastic Security",
          ],
        },
        {
          name: "EDR / XDR endpoint & extended detection",
          role:
            "Endpoint, server, and workload telemetry and response actions; the " +
            "sensor layer detection coverage is measured on.",
          examples: [
            "CrowdStrike Falcon",
            "Microsoft Defender for Endpoint",
            "SentinelOne",
            "Palo Alto Cortex XDR",
          ],
        },
        {
          name: "SOAR / case management",
          role:
            "Orchestrates response playbooks and holds the case/incident record — " +
            "the system of record for MTTD/MTTR timestamps and automated actions.",
          examples: [
            "Palo Alto Cortex XSOAR",
            "Splunk SOAR",
            "Microsoft Sentinel automation",
            "Tines",
          ],
        },
        {
          name: "Vulnerability & exposure management platform",
          role:
            "Discovery, scanning, risk-based prioritization, and remediation " +
            "tracking for vulnerabilities and exposures across the estate.",
          examples: ["Tenable", "Qualys", "Rapid7 InsightVM", "Wiz (cloud exposure)"],
        },
        {
          name: "Identity provider & access governance (IdP / IGA / PAM)",
          role:
            "Authentication, authorization, privileged access, and identity " +
            "governance — the control plane for the identity attack surface.",
          examples: [
            "Microsoft Entra ID",
            "Okta",
            "CyberArk (PAM)",
            "SailPoint (IGA)",
          ],
        },
        {
          name: "Cloud security posture (CSPM / CNAPP)",
          role:
            "Discovers cloud assets and misconfigurations and assesses cloud " +
            "exposure across multi-cloud accounts.",
          examples: ["Wiz", "Palo Alto Prisma Cloud", "Microsoft Defender for Cloud"],
        },
      ],
      roles: [
        {
          title: "Chief Information Security Officer (CISO)",
          accountability:
            "Enterprise security posture, risk acceptance, the security strategy, " +
            "and the decision on how much autonomy AI is granted in detection and " +
            "response.",
        },
        {
          title: "SOC Manager / Head of Security Operations",
          accountability:
            "Detection and response operations, MTTD/MTTR, analyst staffing and " +
            "burnout, and what automation is permitted to auto-close and auto-contain.",
        },
        {
          title: "Detection Engineering Lead",
          accountability:
            "Detection coverage and quality — the rules, correlations, and tuning " +
            "that govern false-positive rate and what the SOC can see.",
        },
        {
          title: "Vulnerability / Exposure Management Lead",
          accountability:
            "Risk-based prioritization, SLA policy, and remediation tracking for " +
            "the exposure estate.",
        },
        {
          title: "Identity & Access Management Lead",
          accountability:
            "MFA coverage, least-privilege/just-in-time access, and governance of " +
            "human and non-human identities.",
        },
      ],
      regulatoryFrames: [
        {
          name: "NIST Cybersecurity Framework (CSF 2.0)",
          relevance:
            "The dominant control taxonomy (Govern/Identify/Protect/Detect/" +
            "Respond/Recover) most enterprise security programs map maturity and " +
            "investment against.",
        },
        {
          name: "Breach-notification & disclosure regimes (SEC, GDPR, state laws)",
          relevance:
            "Material-incident disclosure timelines and personal-data breach " +
            "notification obligations make MTTD/MTTR and accurate incident " +
            "classification legally consequential, not just operational.",
        },
        {
          name: "Sector frameworks (PCI DSS, HIPAA Security Rule, ISO 27001/2)",
          relevance:
            "Industry-specific control mandates that set minimum security " +
            "operations, access-control, and vulnerability-management requirements.",
        },
        {
          name: "AI security & governance frames (NIST AI RMF, EU AI Act, OWASP LLM Top 10)",
          relevance:
            "Govern the SECURING-AI mandate — model/data risk, prompt-injection " +
            "and agent-action controls — that the SOC's own copilots and the " +
            "wider AI estate must satisfy.",
        },
      ],
      canonicalTerms: [
        {
          term: "Dwell time",
          definition:
            "Total time an attacker is present in the environment before being " +
            "detected and evicted — the outcome MTTD and MTTR jointly drive down.",
        },
        {
          term: "Alert fatigue",
          definition:
            "The degraded vigilance and missed true-positives that result when " +
            "analysts face more (and noisier) alerts than they can meaningfully " +
            "review — the binding human constraint on the SOC.",
        },
        {
          term: "MITRE ATT&CK",
          definition:
            "A knowledge base of adversary tactics and techniques used to map " +
            "detection coverage and gaps technique by technique.",
        },
        {
          term: "Known-exploited vulnerability (KEV)",
          definition:
            "A vulnerability with confirmed active exploitation in the wild — the " +
            "highest-priority remediation class in risk-based exposure management.",
        },
        {
          term: "Prompt injection",
          definition:
            "An attack that smuggles adversarial instructions into the content an " +
            "AI processes (logs, emails) to manipulate its behavior — a core " +
            "securing-AI risk for SOC copilots ingesting untrusted data.",
        },
        {
          term: "Zero trust",
          definition:
            "A security model that never implicitly trusts a user, device, or " +
            "network location and continuously verifies, with identity as the " +
            "primary control plane.",
        },
        {
          term: "CTEM (continuous threat & exposure management)",
          definition:
            "A continuous discover-prioritize-validate-mobilize loop that replaces " +
            "periodic scanning with risk-based, intel-driven exposure reduction.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Detection and response time (MTTD / MTTR)",
        authoritativeSource:
          "SIEM/XDR first-signal timestamps and case-management detected/" +
          "contained/remediated timestamps joined to SOAR execution logs",
        whatGoodEvidenceLooksLike:
          "MTTD/MTTR computed from real incident timestamps over a trailing " +
          "period, segmented by incident type and severity, against the org's " +
          "own baseline.",
        weakEvidenceToReject:
          "A vendor-quoted 'reduce MTTR by 90%' with no link to the tenant's own " +
          "incident timestamps or baseline.",
      },
      {
        claim: "Alert fatigue (volume, false-positive, automation rate)",
        authoritativeSource:
          "SIEM/SOAR alert routing counts, true/false-positive closure codes, " +
          "and automated-vs-human disposition logs over analyst headcount",
        whatGoodEvidenceLooksLike:
          "Alerts-per-analyst-per-day, false-positive rate, and AI-automated " +
          "disposition rate from platform logs — WITH a measured missed-detection " +
          "rate on auto-closed alerts.",
        weakEvidenceToReject:
          "An automation rate cited as pure efficiency win with no measurement of " +
          "true positives suppressed by auto-closure.",
      },
      {
        claim: "Exposure posture (critical-in-SLA, mean time to patch)",
        authoritativeSource:
          "Vulnerability-management platform remediation timestamps against SLA " +
          "policy, joined to asset inventory and KEV/exploit intel",
        whatGoodEvidenceLooksLike:
          "Critical/KEV in-SLA attainment and mean time to patch by asset " +
          "criticality, with the open backlog and prioritization rationale shown.",
        weakEvidenceToReject:
          "A raw open-vulnerability count or CVSS distribution with no " +
          "exploitability/criticality context or SLA attainment.",
      },
      {
        claim: "Coverage & attack-surface visibility (EDR coverage, assets inventoried)",
        authoritativeSource:
          "EDR/XDR deployed-and-healthy sensor counts and attack-surface " +
          "discovery reconciled against the CMDB, cloud accounts, and IdP",
        whatGoodEvidenceLooksLike:
          "Active-discovery coverage and healthy-sensor percentage with the " +
          "CMDB-vs-discovery gap quantified and the uncovered asset classes named.",
        weakEvidenceToReject:
          "A CMDB-only 'we cover 100%' estimate with no active discovery " +
          "reconciliation.",
      },
      {
        claim: "AI-SOC value (efficiency + risk reduction)",
        authoritativeSource:
          "Analyst-hour and MTTD/MTTR deltas from platform logs, plus a modeled " +
          "expected-loss-avoided framed as probabilistic",
        whatGoodEvidenceLooksLike:
          "Firm efficiency deltas (analyst hours, alert volume, MTTD/MTTR) as the " +
          "anchored part, with risk reduction explicitly framed as " +
          "expected-loss-avoided and netted against AI-introduced risk.",
        weakEvidenceToReject:
          "A guaranteed-dollar 'breaches prevented' ROI with no counterfactual " +
          "and no offset for missed-detection or securing-AI cost.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "How many alerts per analyst per shift, what is your false-positive rate, and how large is your un-triaged backlog — i.e. how bad is alert fatigue?",
      "What is your SOC analyst attrition and time-to-fill, and how concentrated is your detection knowledge in a few key people?",
      "What is your MTTD and MTTR by incident type and severity, measured from real case timestamps against your own baseline?",
      "What is your sensor (EDR) coverage and actively-discovered inventoried-asset percentage — not the CMDB estimate — and where are the gaps?",
      "How do you prioritize remediation, what is your critical/KEV in-SLA rate and mean time to patch, and where does patch friction stall you?",
      "Where are you using AI triage/auto-closure today, what is the measured missed-detection rate on auto-closed alerts, and what guardrails fence your security copilot's data and action scope?",
      "How is the identity attack surface governed — MFA coverage, standing vs just-in-time privilege, and non-human identity management?",
    ],
    maturitySignals: [
      "Alert volume per analyst sits in a sustainable range and false-positive rate is actively engineered down, not just absorbed.",
      "AI triage/SOAR auto-disposition runs with calibrated thresholds AND a measured, sampled missed-detection rate — efficiency is netted against suppressed true positives.",
      "Coverage is measured by active discovery (not CMDB), and exposure is prioritized by real exploitability and asset criticality, not raw CVSS counts.",
      "The SOC's own AI tools are scoped least-privilege with prompt-injection and data-exfiltration guardrails — securing-AI is treated as part of the operation.",
    ],
    redFlags: [
      "Alert volume per analyst is hundreds per shift with a high false-positive rate and a growing un-triaged backlog — analysts are tuning out.",
      "AI auto-closure is aggressive with no sampling, no measured missed-detection rate — true positives may be silently suppressed.",
      "Coverage is asserted from the CMDB with no active discovery, so unknown/unmanaged assets are unmonitored and unpatched by definition.",
      "Security value is claimed as a guaranteed-dollar ROI on 'breaches prevented' with no counterfactual and no offset for AI-introduced risk.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "SIEM / security-analytics platforms (Sentinel, Splunk, Chronicle)",
        category: "Security data lake, correlation, and detection content",
        switchingCost:
          "High — detection content, dashboards, integrations, and historical " +
          "data accrete; migrating SIEMs is a multi-quarter re-engineering effort, and ingest-volume pricing locks in scale.",
        renewalDynamics:
          "Ingest-volume or compute-based pricing that scales with telemetry; AI/automation tiers increasingly upsold at renewal — watch data-volume cost growth.",
      },
      {
        vendorName: "EDR / XDR platforms (CrowdStrike, Microsoft, SentinelOne)",
        category: "Endpoint/extended detection and response",
        switchingCost:
          "High — agents deployed estate-wide, tuned detections, and analyst " +
          "muscle memory make re-platforming disruptive; platform consolidation deals add bundle lock-in.",
        renewalDynamics:
          "Per-endpoint/per-workload subscription, often bundled into platform suites; consolidation leverage at renewal as point tools fold in.",
      },
      {
        vendorName: "SOAR / automation platforms (XSOAR, Tines, native SIEM automation)",
        category: "Response orchestration and playbook automation",
        switchingCost:
          "Moderate-to-high — custom playbooks and integrations represent real " +
          "build investment, though logic is portable with effort.",
        renewalDynamics:
          "Action/automation-volume or seat pricing; value is in the playbook library built, so re-pricing leverage grows as automation matures.",
      },
      {
        vendorName: "Vulnerability / exposure & cloud-security platforms (Tenable, Qualys, Wiz)",
        category: "Vulnerability, exposure, and cloud security posture management",
        switchingCost:
          "Moderate — scan data and policy migrate with effort; cloud/CNAPP " +
          "platforms with deep account integrations are stickier.",
        renewalDynamics:
          "Asset- or workload-based subscription; cloud-exposure (CNAPP) is the fast-growing, premium-priced segment.",
      },
      {
        vendorName: "MSSP / MDR providers",
        category: "Managed/outsourced detection and response (the talent-shortage answer)",
        switchingCost:
          "High — the provider holds tuned detections, runbooks, and trained " +
          "analyst knowledge; re-transition risk and ramp time make switching disruptive.",
        renewalDynamics:
          "Per-endpoint, per-data-volume, or outcome-based pricing; the lever is shifting toward outcome/SLA terms as MDRs automate tier-1 with AI.",
      },
    ],
    switchingCosts:
      "The SIEM and EDR cores are effectively non-switchable in the short term " +
      "(data gravity, tuned content, analyst muscle memory), and MSSP/MDR " +
      "providers hold trained-analyst and detection knowledge — so the negotiable " +
      "frontier is consolidating overlapping point tools into platform bundles, " +
      "re-pricing MDR from per-endpoint toward outcome/SLA terms as AI absorbs " +
      "tier-1, and controlling SIEM data-volume cost growth.",
    negotiationLevers: [
      "Consolidate overlapping point tools into platform bundles (XDR/CNAPP/SIEM suites) to discipline aggregate spend and reduce integration tax",
      "Control SIEM ingest-volume cost growth with tiered storage, data-routing/filtering, and committed-volume terms",
      "Re-price MDR/MSSP from per-endpoint toward outcome/SLA-based terms as AI automates tier-1 triage — avoid paying for deflected work",
      "Tie AI/automation premium tiers to measured efficacy (false-positive reduction, MTTR lift) rather than flat per-seat uplift",
      "Secure audit, explainability, and data-portability rights on AI triage/detection models to prevent lock-in and satisfy securing-AI controls",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      detection_response_metric: [
        "SIEM/XDR and case-management timestamps (first-signal → detected → contained → remediated)",
        "segmentation by incident type and severity",
        "comparison to the org's own baseline",
      ],
      alert_fatigue_claim: [
        "alert routing counts over analyst headcount",
        "true/false-positive closure codes",
        "measured missed-detection rate on any auto-closed alerts",
      ],
      coverage_claim: [
        "EDR deployed-and-healthy sensor count",
        "active-discovery asset inventory reconciled to CMDB/cloud/IdP",
        "named uncovered asset classes",
      ],
      exposure_claim: [
        "vulnerability remediation timestamps against SLA",
        "exploitability/KEV and asset-criticality context",
        "open-backlog and prioritization rationale",
      ],
      ai_soc_value_projection: [
        "firm efficiency deltas (analyst hours, alert volume, MTTD/MTTR)",
        "risk reduction framed as expected-loss-avoided (probabilistic)",
        "explicit offset for AI-introduced risk (missed detection, securing-AI cost)",
        "labelled planning range and haircut factors",
      ],
    },
    citationStandard:
      "Quantitative security claims cite the system of record — SIEM/XDR, " +
      "case-management, vulnerability, EDR, or identity platform — over a stated " +
      "trailing period, segmented by severity/type, and compared to the org's own " +
      "baseline rather than an external absolute. AI-SOC value claims separate the " +
      "FIRM part (measured efficiency: analyst hours, alert volume, MTTD/MTTR) " +
      "from the PROBABILISTIC part (expected breach-loss avoided), cite a labelled " +
      "planning range and haircut factors, and ALWAYS net efficiency against the " +
      "missed-detection risk and securing-AI cost the automation introduces — " +
      "never a guaranteed-dollar 'breaches prevented' number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no measured baseline for MTTD/MTTR, alert volume, or coverage — frame metrics as industry planning ranges, not their numbers.",
      "AI-SOC efficiency is being cited without a measured missed-detection rate — flag that auto-closure efficiency is incomplete until the suppressed-true-positive risk is quantified.",
      "Security value is being expressed as a guaranteed return — reframe breach-loss reduction as probabilistic expected-loss-avoided, not booked savings.",
      "Coverage is asserted from the CMDB rather than active discovery — present the likely CMDB-vs-reality gap explicitly.",
      "Vendor or MDR-reported efficacy figures are cited — mark as provider claims pending validation against the tenant's own data.",
    ],
    inferenceLanguage: [
      "Across enterprise SOCs at this scale, alerts per analyst and false-positive rates typically run...",
      "Without your measured baseline, the industry pattern suggests AI triage commonly reduces tier-1 effort by roughly...",
      "Treating this as expected-loss-avoided rather than a guaranteed return...",
      "Peer security programs at this maturity commonly reach an EDR coverage of... once unmanaged-asset gaps are closed...",
      "Treating this as a planning range rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI or number of 'breaches prevented' for this tenant",
      "This tenant's actual MTTD, MTTR, alert-volume, coverage, or attrition figures",
      "A claim that AI triage/auto-closure is safe at a given threshold without a measured missed-detection rate",
      "A claim that a specific asset class or identity surface is fully covered without active discovery",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "security posture scorecard / how is the SOC and exposure program doing",
      exhibitKind: "table",
      note: "MTTD, MTTR, alerts/analyst, false-positive rate, EDR coverage, critical-in-SLA, mean time to patch, phishing click rate, attrition vs planning ranges and own baseline.",
    },
    {
      questionPattern:
        "AI-SOC value story / efficiency relief plus risk reduction with honest offsets",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current state to triage-automation efficiency to exposure/risk reduction to net value, showing the attribution and AI-introduced-risk haircuts explicitly.",
    },
    {
      questionPattern: "detection/response time trend / MTTD or MTTR over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend MTTD and MTTR against baseline and planning range to show whether AI triage/SOAR is bending the curve.",
    },
    {
      questionPattern:
        "exposure prioritization / where remediation capacity should go",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Vulnerabilities by exploitability (KEV/weaponized) x asset criticality, concentrating finite remediation on the genuinely dangerous fraction.",
    },
    {
      questionPattern:
        "alert funnel / how volume collapses from raw signal to true incident",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Raw alerts → auto-suppressed/enriched → AI-triaged → analyst-investigated → confirmed incidents, exposing where alert fatigue concentrates and what automation deflects.",
    },
    {
      questionPattern: "security tool / control coverage map",
      exhibitKind: "table",
      note: "Per control domain (detection, exposure, identity, cloud, securing-AI): tools in place, coverage %, gaps, and overlap/consolidation candidates.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Alert fatigue and analyst burnout are treated as the binding constraints to engineer down — AI triage is aimed at the human bottleneck, not at adding another tool",
      "AI triage/auto-closure runs with calibrated thresholds AND a measured, sampled missed-detection rate, so efficiency is honestly netted against suppressed true positives",
      "Coverage and data quality are real (active discovery, healthy sensors, normalized telemetry) before AI is layered on — you cannot triage signal you never collect",
      "The SOC's own AI tools are scoped least-privilege with prompt-injection and data-exfiltration guardrails — securing-AI is built in, not bolted on",
    ],
    failureDrivers: [
      "Aggressive AI auto-closure with no sampling or missed-detection measurement silently suppresses true positives — a missed breach dressed up as efficiency",
      "More tools are bought without integration or staffing, worsening alert fatigue and tool sprawl instead of relieving the human constraint",
      "Coverage is assumed from the CMDB, leaving unknown/unmanaged assets unmonitored where attackers persist",
      "Value is sold as guaranteed-dollar 'breaches prevented' ROI; when the counterfactual cannot be proven, board confidence in the next wave collapses",
      "The security copilot is granted broad data/action scope without guardrails, becoming a new attack surface (prompt injection, exfiltration)",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "SOAR automated response and AI phishing defense adopt first and fastest " +
      "because the playbooks are well-understood and the value is tangible. AI " +
      "alert triage and risk-based exposure prioritization follow as trust and " +
      "data quality build, gated on measuring missed detection. Investigation " +
      "copilots and natural-language hunting are still experimenting and adopt " +
      "last, as analyst trust and securing-AI guardrails mature. Throughout, " +
      "adoption hinges on analysts trusting AI output enough to act on it without " +
      "either rubber-stamping it or distrusting it into disuse.",
    roiClarity: "medium",
    roiClarityBasis:
      "Security ROI is firmer on the EFFICIENCY half (analyst hours, alert " +
      "volume, MTTD/MTTR are directly measurable in the SIEM/SOAR) but " +
      "inherently softer on the RISK-REDUCTION half: the prize is largely avoided " +
      "loss — breaches that did not happen — which is real but probabilistic and " +
      "cannot be proven via counterfactual. Clarity is further reduced by the " +
      "AI-triage paradox: the same automation that creates efficiency can suppress " +
      "true positives and add new risk, so net value must be measured with " +
      "missed-detection discipline. This is why the evidence and hedge rules " +
      "anchor the case on measured efficiency and frame risk reduction as " +
      "expected-loss-avoided, never as a guaranteed return.",
  },

  regulatoryFrame: {
    name: "NIST CSF + breach-disclosure regimes + AI security frames",
    relevance:
      "The governing frame is layered: NIST CSF 2.0 is the dominant control " +
      "taxonomy enterprises map maturity against; breach-notification regimes " +
      "(SEC material-incident disclosure, GDPR/state personal-data breach laws) " +
      "make MTTD/MTTR and accurate incident classification legally consequential; " +
      "sector mandates (PCI DSS, HIPAA Security Rule, ISO 27001) set minimum " +
      "controls; and AI security frames (NIST AI RMF, EU AI Act, OWASP LLM Top " +
      "10) govern the SECURING-AI mandate — model/data risk, prompt injection, " +
      "and agent-action controls — that the SOC's own copilots and the wider AI " +
      "estate must satisfy (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave3)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
