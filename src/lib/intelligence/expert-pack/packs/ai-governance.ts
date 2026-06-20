// Consilium expert — AI Governance & Model Risk (cross-cutting, middle office).
//
// W3 wave2 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It owns the
// middle-office question every board is now forced to answer: "how do we govern
// the AI/GenAI we are deploying — what models do we even have, how risky are
// they, what controls and human gates sit on them, and can we prove all of it to
// a regulator or an auditor?"
//
// CORE DOCTRINE — GOVERNANCE IS RISK-ADJUSTED ENABLEMENT, NOT A BRAKE. The honest
// framing this expert insists on: governance creates value as RISK AVOIDANCE
// (incidents not had, fines not paid, trust not lost) plus FASTER SAFE ADOPTION
// (a clear lane lets the business ship confidently) — not as direct revenue.
// Governance bolted on late, or applied as a uniform heavy-handed gate on every
// use case, becomes the single biggest drag on AI adoption: shadow AI routes
// around it, approval queues stall the portfolio, and the program loses
// credibility. The discipline is RISK-TIERING — proportionate controls matched to
// model risk (a marketing-copy assistant is not an underwriting model) — so the
// few high-risk models get deep validation and human gates while low-risk ones
// move fast. Anchors to the standard frames (NIST AI RMF, EU AI Act, SR 11-7 for
// regulated model risk) without locking to any one. Excludes the workforce-
// adoption layer (Future of Work expert) and AI-platform sourcing depth (separate
// sourcing experts) beyond the governance-tooling layer.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const aiGovernanceExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.ai-governance",
    expertName: "AI Governance & Model Risk Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "ai-governance",
    scopeNote:
      "Cross-cutting middle-office governance of the enterprise AI/GenAI estate: " +
      "model & use-case inventory and risk tiering; model risk management " +
      "(independent validation, monitoring, drift, performance decay); policy & " +
      "controls and policy-as-code; human-in-the-loop / approval gates; " +
      "responsible-AI (bias/fairness, explainability, transparency); data " +
      "governance for AI (lineage, consent, retention, PII); audit & evidence; " +
      "and regulatory readiness (EU AI Act, NIST AI RMF, SR 11-7 / model risk, " +
      "sector rules). Doctrine: governance as RISK-ADJUSTED ENABLEMENT via " +
      "proportionate risk-tiering — not a uniform brake. Excludes the workforce " +
      "AI-adoption layer (Future of Work expert), function-specific operating " +
      "depth, and the deep IT-platform sourcing of the AI stack (separate " +
      "sourcing experts) beyond the governance-tooling layer.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "model_inventory_coverage",
        name: "Model / AI use-case inventory coverage",
        definition:
          "Share of in-use AI/ML/GenAI models and use cases that are recorded " +
          "in the central inventory with an owner, purpose, and risk tier — vs " +
          "the estimated true population (including shadow and embedded-in-vendor " +
          "AI).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Observed inventory completeness; early programs capture the obvious " +
            "models but miss shadow GenAI and AI embedded in SaaS, so true " +
            "coverage lags the registry count",
          label: "planning-range",
        },
        dataSource:
          "Model registry / AI inventory cross-checked against discovery scans " +
          "(SaaS, code repos, cloud AI services) and procurement records",
        whyItMatters:
          "You cannot govern what you cannot see. Inventory coverage is the " +
          "foundational gate on every other control — an uninventoried model is " +
          "an ungoverned risk, and the gap between registry count and true " +
          "population is where incidents originate.",
      },
      {
        key: "high_risk_model_validation_rate",
        name: "High-risk model validation rate",
        definition:
          "Share of models classified high-risk that have completed independent " +
          "validation (effective challenge by a function separate from the " +
          "developer) and carry a current, unexpired validation sign-off.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "SR 11-7-aligned model-risk programs; mature banks approach full " +
            "coverage of tiered-high models, while newer GenAI estates lag " +
            "because validation capacity has not scaled to model volume",
          label: "planning-range",
        },
        dataSource:
          "Model risk management workflow (validation status, sign-off date, " +
          "expiry) joined to the inventory risk tier",
        whyItMatters:
          "The core model-risk control. Independent validation is what " +
          "distinguishes a governed high-risk model from a developer's untested " +
          "claim; a low rate means high-consequence models are running on faith.",
      },
      {
        key: "model_monitoring_coverage",
        name: "Production model monitoring coverage",
        definition:
          "Share of production models with active, automated monitoring of " +
          "performance, data drift, and output quality against defined thresholds " +
          "and alerting — vs deployed-and-forgotten.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 85,
          basis:
            "MLOps maturity surveys; many models are validated at launch but " +
            "left unmonitored in production, so coverage trails the deployed count",
          label: "planning-range",
        },
        dataSource:
          "MLOps / model-monitoring platform (which production models emit " +
          "monitored metrics) joined to the deployed-model list",
        whyItMatters:
          "A model that passed validation a year ago is not the model running " +
          "today — data shifts and behaviour decays. Monitoring coverage is the " +
          "difference between catching drift and discovering it via a customer " +
          "complaint or a regulator.",
      },
      {
        key: "drift_detection_coverage",
        name: "Drift detection coverage (high-risk models)",
        definition:
          "Share of high-risk production models with automated data-/concept-" +
          "drift detection and a defined retrain/escalation trigger, vs those " +
          "monitored only for uptime or not at all.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 80,
          basis:
            "Drift-detection adoption ranges; statistical drift monitoring on " +
            "high-risk models is materially less common than basic performance " +
            "monitoring",
          label: "planning-range",
        },
        dataSource:
          "Model-monitoring platform drift configuration joined to the " +
          "high-risk-tier inventory",
        whyItMatters:
          "Drift is the silent failure mode of deployed AI: accuracy erodes as " +
          "the world moves away from the training distribution. Without drift " +
          "detection, a high-risk model degrades unnoticed until the harm is real.",
      },
      {
        key: "hitl_coverage_high_risk",
        name: "Human-in-the-loop coverage on high-risk use cases",
        definition:
          "Share of high-risk AI use cases (consequential decisions about " +
          "people, money, safety) that have a defined, enforced human review or " +
          "approval gate before the AI output takes effect.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 100,
          basis:
            "Responsible-AI control adoption; high-risk human-oversight is a " +
            "near-universal target for consequential decisions but enforcement " +
            "(vs policy-on-paper) varies widely",
          label: "planning-range",
        },
        dataSource:
          "Use-case control register / workflow configuration (which high-risk " +
          "use cases have an enforced human gate)",
        whyItMatters:
          "Human oversight on consequential decisions is the control regulators " +
          "and courts care about most. The gap between a policy that says " +
          "'human reviews it' and a workflow that enforces it is where " +
          "accountability evaporates.",
      },
      {
        key: "policy_compliance_rate",
        name: "AI policy / control compliance rate",
        definition:
          "Share of in-scope models and use cases that pass their required " +
          "policy controls (risk assessment completed, approvals in place, " +
          "documentation current, data-handling attested) at the latest check.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Control-compliance attainment in maturing governance programs; " +
            "manual attestation tends to lag where controls are not automated " +
            "(policy-as-code)",
          label: "planning-range",
        },
        dataSource:
          "GRC / governance platform control-test results across the model and " +
          "use-case population",
        whyItMatters:
          "The board-level health number for the control framework. A high rate " +
          "with weak controls is theater; the metric is only meaningful when the " +
          "controls themselves are risk-tiered and tested, not box-ticked.",
      },
      {
        key: "time_to_approval",
        name: "Time-to-approval for AI use cases",
        definition:
          "Median elapsed business days from a submitted AI use-case / model " +
          "request to a governance decision (approve, approve-with-conditions, " +
          "or reject), by risk tier.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 60,
          basis:
            "Governance-throughput experience; low-risk fast lanes can clear in " +
            "days, while undifferentiated heavy review of every use case stretches " +
            "to many weeks and drives shadow AI",
          label: "planning-range",
        },
        dataSource:
          "Governance intake / approval workflow timestamps, segmented by risk " +
          "tier",
        whyItMatters:
          "The honest measure of whether governance enables or blocks. Slow, " +
          "undifferentiated approval is the top reason the business routes around " +
          "governance — proportionate fast lanes for low-risk are the cure, not " +
          "an exception.",
      },
      {
        key: "ai_incident_rate",
        name: "AI incident rate",
        definition:
          "Count of AI-related incidents (harmful/biased output, data leak, " +
          "material model error, prohibited use, hallucination causing customer " +
          "or financial harm) per period, normalized per active model or use case.",
        unit: "incidents / model / year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 2,
          basis:
            "Indicative incident frequency; a near-zero rate with mature " +
            "detection is the target, while an apparent zero with no reporting " +
            "channel usually means incidents go uncaptured",
          label: "planning-range",
        },
        dataSource:
          "AI incident register / responsible-AI reporting channel joined to the " +
          "active-model population",
        whyItMatters:
          "The outcome metric the whole framework exists to move. A rising rate " +
          "signals control failure; a suspiciously zero rate usually signals no " +
          "reporting culture rather than no incidents — read it with detection " +
          "coverage.",
      },
      {
        key: "time_to_remediate",
        name: "Time-to-remediate governance / model findings",
        definition:
          "Median elapsed days from a raised governance, validation, or audit " +
          "finding (e.g. failed control, drift breach, missing documentation) to " +
          "its verified closure, weighted by severity.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 180,
          basis:
            "Issue-management closure ranges; high-severity model findings " +
            "should close in weeks, but aging backlogs of low-severity items are " +
            "common",
          label: "planning-range",
        },
        dataSource:
          "Issue / finding management workflow (raised-to-closed timestamps with " +
          "severity) in the GRC or MRM platform",
        whyItMatters:
          "Finding things is only half of governance; closing them is the half " +
          "auditors and regulators score. A long remediation tail means known " +
          "risks stay live and the framework is detecting more than it can fix.",
      },
      {
        key: "audit_finding_count",
        name: "Open AI / model-risk audit findings",
        definition:
          "Number of open internal-audit, regulatory-exam, or validation " +
          "findings related to AI governance and model risk, weighted by severity " +
          "and age.",
        unit: "weighted findings",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 15,
          basis:
            "Indicative open-finding load for a governance function; depends on " +
            "scope, audit cadence, and estate maturity rather than a hard norm",
          label: "planning-range",
        },
        dataSource:
          "Internal audit / regulatory finding tracker filtered to AI-governance " +
          "and model-risk scope",
        whyItMatters:
          "The external scorecard on the program. A growing weighted-and-aged " +
          "finding load is the clearest signal that governance is behind the " +
          "estate it is meant to control — and the number the board hears first.",
      },
      {
        key: "explainability_documentation_rate",
        name: "Explainability & model-documentation rate",
        definition:
          "Share of in-scope models with current, sufficient documentation — " +
          "intended use, data lineage, limitations, and an explainability / " +
          "interpretability artifact appropriate to the model's risk tier.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Model-documentation completeness ranges; documentation discipline " +
            "is strong for legacy regulated models and weakest for fast-moving " +
            "GenAI use cases",
          label: "planning-range",
        },
        dataSource:
          "Model registry documentation fields / model-card store joined to the " +
          "risk-tiered inventory",
        whyItMatters:
          "Explainability and documentation are what make a model auditable, " +
          "contestable, and defensible. The gap is sharpest for GenAI, where " +
          "opacity is highest and the documentation habits of classic model risk " +
          "have not yet transferred.",
      },
    ],

    painThemes: [
      {
        key: "shadow_uninventoried_ai",
        name: "Shadow & uninventoried AI",
        description:
          "Models and GenAI use cases proliferate faster than the inventory " +
          "captures them — built in business units, embedded inside SaaS, or run " +
          "on consumer tools — so a large part of the real AI estate is " +
          "ungoverned and invisible to risk.",
        detectionSignal:
          "Inventory count well below discovery-scan estimates; AI features " +
          "found in procured SaaS that no one registered; business units naming " +
          "use cases the governance team has never seen.",
        diagnosticQuestion:
          "How do you discover AI you didn't build — embedded vendor AI and " +
          "business-unit GenAI — and how big is the gap between your registry and " +
          "the true population?",
      },
      {
        key: "governance_as_blocker",
        name: "Governance-as-blocker (one-size-fits-all gate)",
        description:
          "A single heavy review process is applied to every use case " +
          "regardless of risk, so approval queues stall, the business sees " +
          "governance as the obstacle, and people route around it — the late, " +
          "bolted-on framework that slows adoption instead of enabling it.",
        detectionSignal:
          "Long, undifferentiated time-to-approval across all tiers; no fast " +
          "lane for low-risk; rising shadow-AI signals; business leaders citing " +
          "governance as the reason a program stalled.",
        diagnosticQuestion:
          "Is your review proportionate to risk — is there a fast lane for " +
          "low-risk use cases — or does every model face the same heavy gate, and " +
          "what is your time-to-approval by tier?",
      },
      {
        key: "deploy_and_forget",
        name: "Deploy-and-forget (no monitoring or drift detection)",
        description:
          "Models are validated at launch and then left unmonitored in " +
          "production, so performance decay and data/concept drift go undetected " +
          "until accuracy has eroded and harm has occurred — governance treated " +
          "as a launch gate rather than a lifecycle.",
        detectionSignal:
          "Monitoring coverage far below deployed-model count; high-risk models " +
          "with no drift trigger; incidents traced to a model that 'used to work'; " +
          "no defined retrain cadence.",
        diagnosticQuestion:
          "For your production models, what share have active performance and " +
          "drift monitoring with a retrain/escalation trigger — and how would you " +
          "know today if a model had quietly degraded?",
      },
      {
        key: "unclear_accountability",
        name: "Unclear accountability & ownership",
        description:
          "No one clearly owns AI risk end-to-end: model owners, data owners, " +
          "the second-line risk function, and IT each assume someone else has " +
          "it, so risk decisions fall between the seams and there is no named " +
          "accountable executive when something goes wrong.",
        detectionSignal:
          "No designated Chief AI Officer or accountable owner per model; " +
          "three-lines-of-defense roles undefined for AI; disputes over who signs " +
          "off; governance policy with no named decision-rights.",
        diagnosticQuestion:
          "Who is the single accountable owner for AI risk enterprise-wide, and " +
          "for each high-risk model, who owns it, who validates it independently, " +
          "and who approves its use?",
      },
      {
        key: "bias_explainability_gaps",
        name: "Bias, fairness & explainability gaps",
        description:
          "Models that affect people (credit, hiring, claims, pricing) are " +
          "deployed without systematic bias/fairness testing or an " +
          "explainability artifact, leaving the firm unable to demonstrate the " +
          "decision was fair or to explain it to an affected person or regulator.",
        detectionSignal:
          "No fairness testing on people-affecting models; no adverse-impact " +
          "analysis; black-box models in high-stakes use with no interpretability; " +
          "inability to produce a reason for an automated decision.",
        diagnosticQuestion:
          "For models that make consequential decisions about people, what " +
          "bias/fairness testing and explainability do you have — and could you " +
          "explain an individual decision if challenged?",
      },
      {
        key: "audit_evidence_scramble",
        name: "Audit-evidence scramble",
        description:
          "When an auditor or regulator asks, evidence — risk assessments, " +
          "validation reports, approvals, monitoring logs, data lineage — is " +
          "scattered across teams and reassembled manually under deadline, so " +
          "every exam becomes a fire drill and gaps surface only under scrutiny.",
        detectionSignal:
          "Evidence collected ad hoc per request; no central, query-able " +
          "control-and-evidence store; long lead times to produce an audit pack; " +
          "findings about missing or inconsistent documentation.",
        diagnosticQuestion:
          "If a regulator asked tomorrow for full evidence on your highest-risk " +
          "model — risk tier, validation, approvals, monitoring, lineage — how " +
          "long would it take, and would it be complete?",
      },
      {
        key: "genai_specific_risk_blindspot",
        name: "GenAI-specific risk blind spot",
        description:
          "Classic model-risk practice (built for statistical models) does not " +
          "cover GenAI's distinctive failure modes — hallucination, prompt " +
          "injection, data leakage through prompts, IP/copyright exposure, " +
          "non-determinism — so GenAI use cases are governed with controls that " +
          "miss their actual risks.",
        detectionSignal:
          "GenAI use cases assessed with a classic-model checklist; no testing " +
          "for hallucination, jailbreak, or prompt-injection; no output-grounding " +
          "or guardrail controls; vendor-LLM data-handling unexamined.",
        diagnosticQuestion:
          "Do your controls address GenAI-specific risks — hallucination, prompt " +
          "injection, data leakage, IP exposure — or are you applying a classic " +
          "statistical-model framework to generative systems?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "automated_model_discovery_inventory",
        name: "Automated model discovery & inventory",
        valueMechanism:
          "Continuously scan SaaS, cloud AI services, code repos, and " +
          "procurement to discover AI/ML/GenAI in use and auto-populate the " +
          "inventory with owner, purpose, and a provisional risk tier — closing " +
          "the shadow-AI gap so governance can see (and therefore control) the " +
          "true estate rather than only what teams self-register.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Discovery feeds: SaaS/CASB, cloud AI service logs, code-repo scans, procurement records",
          "An inventory schema with owner, purpose, and risk-tier fields",
          "A risk-tiering rubric to assign provisional tiers",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-assigned risk tiers are provisional — a human must confirm before they drive controls",
          "Discovery scans themselves touch sensitive systems and must respect access and privacy limits",
        ],
        metricsMoved: [
          "model_inventory_coverage",
          "policy_compliance_rate",
          "audit_finding_count",
        ],
      },
      {
        key: "continuous_model_monitoring_drift",
        name: "Continuous monitoring & drift detection",
        valueMechanism:
          "Instrument production models with automated performance, data-drift, " +
          "and output-quality monitoring against thresholds, with alerting and a " +
          "defined retrain/escalation trigger — catching decay before it causes " +
          "harm and converting governance from a launch gate into a lifecycle " +
          "control.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Production inference logs, ground-truth/outcome feedback, and reference distributions",
          "Defined performance and drift thresholds per model and tier",
          "An alerting/escalation path into incident and retrain workflows",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Drift/threshold breaches must escalate to a human owner — not silently auto-retrain into an unvalidated state",
          "Outcome feedback used for monitoring may carry PII and must be governed",
        ],
        metricsMoved: [
          "model_monitoring_coverage",
          "drift_detection_coverage",
          "ai_incident_rate",
        ],
      },
      {
        key: "policy_as_code_controls",
        name: "Policy-as-code controls & guardrails",
        valueMechanism:
          "Encode governance policy as automated, risk-tiered checks and runtime " +
          "guardrails in the ML/deployment pipeline — blocking unapproved or " +
          "untiered models from production and enforcing controls (PII handling, " +
          "approval status, documentation) as code — so compliance is continuous " +
          "and proportionate rather than a manual after-the-fact attestation.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Machine-readable policy/control library mapped to risk tiers",
          "Pipeline / deployment hooks (CI/CD, model registry gates) to enforce checks",
          "Inventory and approval status as the source of truth for gating",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Automated blocks on production deployment are high-impact — exception/override paths need human approval and an audit trail",
          "Policy-as-code only governs what flows through the pipeline; out-of-band deployments bypass it",
        ],
        metricsMoved: [
          "policy_compliance_rate",
          "time_to_approval",
          "hitl_coverage_high_risk",
        ],
      },
      {
        key: "automated_evidence_audit_packs",
        name: "Automated evidence & audit-pack generation",
        valueMechanism:
          "Continuously collect and link control evidence — risk assessments, " +
          "validation reports, approvals, monitoring logs, data lineage — into a " +
          "central store and assemble an audit/regulatory pack on demand per " +
          "model, turning the audit-evidence scramble into a query and shrinking " +
          "exam preparation from weeks to hours.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Linked evidence sources: MRM, GRC, MLOps, registry, and approval workflows",
          "A control framework mapping each control to its evidence artifact",
          "Model/use-case identity to bind evidence to the right asset",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Generated packs must be reviewed before submission — completeness is asserted by a human, not the tool",
          "Evidence aggregation centralizes sensitive control data and must be access-controlled",
        ],
        metricsMoved: [
          "audit_finding_count",
          "time_to_remediate",
          "policy_compliance_rate",
        ],
      },
      {
        key: "bias_fairness_explainability_testing",
        name: "Bias / fairness & explainability testing",
        valueMechanism:
          "Run systematic fairness/adverse-impact testing and generate " +
          "explainability artifacts (feature importance, model cards, reason " +
          "codes) for people-affecting models — making decisions demonstrably " +
          "fair, contestable, and explainable to an affected person or regulator, " +
          "and producing the documentation high-risk tiers require.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Model inputs/outputs with protected-attribute or proxy data for fairness analysis",
          "Held-out / production samples and ground-truth outcomes",
          "A defined fairness-metric and explainability standard per use case",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Fairness findings are judgement calls — a human (responsible-AI lead) interprets and dispositions them, the test does not auto-approve",
          "Using protected attributes for testing is itself privacy-sensitive and must be tightly scoped and lawful",
        ],
        metricsMoved: [
          "explainability_documentation_rate",
          "high_risk_model_validation_rate",
          "ai_incident_rate",
        ],
      },
      {
        key: "genai_guardrail_redteam",
        name: "GenAI guardrails & red-teaming",
        valueMechanism:
          "Apply GenAI-specific controls — output grounding/citation, " +
          "input/output guardrails, prompt-injection and jailbreak red-teaming, " +
          "data-leakage and IP checks — so generative use cases are governed for " +
          "their actual failure modes rather than a classic-model checklist, " +
          "reducing hallucination- and misuse-driven incidents.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Representative prompts/outputs and known attack/jailbreak corpora",
          "Grounding sources and an output-evaluation rubric",
          "Vendor-LLM data-handling and retention terms",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Guardrails reduce but do not eliminate GenAI risk — high-stakes outputs still require human review",
          "Red-team findings on prompt injection / leakage must route to remediation, not be treated as one-time pass/fail",
        ],
        metricsMoved: [
          "ai_incident_rate",
          "hitl_coverage_high_risk",
          "explainability_documentation_rate",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "risk_tiered_governance_framework",
        name: "Risk-tiered AI governance framework",
        description:
          "A single enterprise framework that classifies every AI use case into " +
          "risk tiers (e.g. prohibited / high / limited / minimal, aligned to EU " +
          "AI Act and NIST AI RMF) and matches PROPORTIONATE controls to each " +
          "tier — deep validation and human gates for high-risk, a fast lane for " +
          "low-risk — so governance enables rather than uniformly blocks.",
        boundary:
          "Owns the tiering rubric, the control catalog per tier, and the " +
          "decision-rights; does not build or validate individual models, and " +
          "does not own the business decision to pursue a use case (it scopes the " +
          "controls that decision must meet).",
        humanAccountabilityPoint: "Chief AI Officer (chairing the AI governance / risk committee)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "three_lines_model_risk_management",
        name: "Three-lines model risk management (SR 11-7 style)",
        description:
          "An operating model separating model development/use (first line), " +
          "independent validation and challenge plus governance (second line), " +
          "and audit assurance (third line) — extending the SR 11-7 model-risk " +
          "discipline of independent effective challenge across the full AI/GenAI " +
          "estate, not just regulated statistical models.",
        boundary:
          "Owns the independence and challenge process and the validation " +
          "standard; does not own model development (first line) or the audit " +
          "opinion (third line), and is deliberately separate from the teams " +
          "whose models it validates.",
        humanAccountabilityPoint: "Chief Risk Officer / Head of Model Risk Management",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "ai_lifecycle_control_plane",
        name: "AI lifecycle control plane (registry + MLOps + monitoring)",
        description:
          "A tooling backbone where the model registry, deployment pipeline, and " +
          "monitoring are integrated so a model cannot reach production without a " +
          "risk tier, approval, and documentation, and once live is continuously " +
          "monitored — making governance a lifecycle control plane rather than a " +
          "launch-day checklist.",
        boundary:
          "Owns the technical enforcement of inventory, gating, and monitoring; " +
          "does not set policy (the governance framework does) and does not make " +
          "approval decisions (it enforces and records them).",
        humanAccountabilityPoint: "Head of MLOps / AI Platform (with the model-risk function)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "responsible_ai_review_board",
        name: "Responsible-AI review board & human-gate workflow",
        description:
          "A standing cross-functional board (risk, legal, ethics, business, " +
          "data) plus an enforced human-gate workflow that reviews high-risk and " +
          "novel use cases for fairness, explainability, legal, and ethical " +
          "concerns before approval — the human-judgement layer that policy-as-" +
          "code and validation feed but cannot replace.",
        boundary:
          "Owns the responsible-AI disposition of high-risk/novel cases and the " +
          "ethics judgement; does not own routine low-risk approvals (delegated " +
          "to the fast lane) or technical validation (model-risk function).",
        humanAccountabilityPoint: "Responsible-AI Lead / Chief AI Ethics Officer (board chair)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "AI governance creates value as RISK-ADJUSTED ENABLEMENT, not direct " +
        "revenue — and being honest about that is what keeps the case credible. " +
        "The value is two-sided: (1) RISK AVOIDANCE — incidents not had, fines " +
        "and regulatory actions avoided, legal and remediation cost not incurred, " +
        "and brand/customer trust preserved (an avoided-loss, probabilistic " +
        "value, hard to point-estimate); and (2) FASTER SAFE ADOPTION — a clear, " +
        "proportionate, risk-tiered lane lets the business ship more AI " +
        "confidently and sooner, so governance ACCELERATES the value of the AI " +
        "portfolio rather than gating it. The trap is heavy-handed, late, " +
        "one-size-fits-all governance: it slows adoption, drives shadow AI, and " +
        "produces compliance theater. The durable curve-bender is risk-tiering " +
        "(deep controls where consequences are high, a fast lane where they are " +
        "low) executed on a lifecycle control plane so controls are continuous " +
        "and proportionate. Because the benefit is largely avoided-loss and " +
        "enablement, the value MODEL is sized as risk-reduction and cycle-time, " +
        "and any hard-dollar claim must be hedged heavily — this is the lowest-" +
        "ROI-clarity domain of the back-office set, and the honest expert says so.",
      dominantHaircutFactors: [
        {
          factor: "Risk-avoidance value is probabilistic, not booked",
          rationale:
            "The largest benefit — incidents and fines avoided — is an expected " +
            "value over uncertain events, not a realized P&L line. It must be " +
            "discounted heavily and framed as risk reduction, never as a " +
            "guaranteed saving.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "Gap between modeled expected-loss-avoided and what finance will " +
              "credit as a hard benefit for probabilistic risk reduction",
            label: "planning-range",
          },
        },
        {
          factor: "Governance drag on adoption (over-control)",
          rationale:
            "Heavy, undifferentiated controls slow the AI portfolio and push " +
            "work to shadow AI, eroding the very enablement benefit — so the net " +
            "value is below the gross unless controls are proportionate and fast-" +
            "laned.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Observed adoption slowdown and shadow-AI leakage when governance " +
              "is applied uniformly rather than risk-tiered",
            label: "planning-range",
          },
        },
        {
          factor: "Inventory & tooling incompleteness",
          rationale:
            "Governance only protects what it can see and instrument; an " +
            "incomplete inventory, unmonitored models, and manual evidence leave " +
            "real risk uncovered, so realized risk reduction trails the designed " +
            "framework.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Coverage gap between the designed control framework and the " +
              "share of the true estate actually inventoried and monitored",
            label: "planning-range",
          },
        },
        {
          factor: "Organizational adoption & accountability gaps",
          rationale:
            "Without clear ownership, embedded controls, and a culture of " +
            "reporting, policies sit on paper, findings age unremediated, and " +
            "incidents go uncaptured — so paper compliance overstates real " +
            "protection.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Distance between policy-on-paper compliance and enforced, owned, " +
              "remediated control operation",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Incident / loss-event frequency reduction",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Relative reduction in AI incident frequency where monitoring, " +
              "guardrails, and human gates are in place vs ungoverned deployment",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in ai_incident_rate (expected-loss-avoided, " +
            "probabilistic — not a booked saving)",
        },
        {
          lever: "Approval cycle-time compression (safe-adoption speed)",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reduction in time-to-approval for low-/limited-risk use cases " +
              "when a proportionate fast lane replaces a uniform heavy gate",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in time_to_approval for non-high-risk tiers " +
            "(enablement value, not cost saving)",
        },
        {
          lever: "Audit / evidence preparation effort reduction",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reduction in manual effort and elapsed time to assemble audit/" +
              "regulatory evidence when evidence is continuously linked vs " +
              "scrambled per request",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in evidence-assembly effort/time feeding " +
            "time_to_remediate and audit_finding_count",
        },
      ],
      timeToValueBand:
        "Inventory + risk-tiering framework: 1-2 quarters to first usable " +
        "coverage and a working fast lane. Monitoring/drift and evidence " +
        "automation: 2-4 quarters to meaningful coverage. Full three-lines model-" +
        "risk operating model with policy-as-code across the estate: 12-24+ " +
        "months, and risk-reduction value compounds slowly because it is realized " +
        "as incidents and findings that do NOT happen.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Model registry / AI inventory",
          role:
            "System of record for every model and AI use case — owner, purpose, " +
            "risk tier, lifecycle status, documentation, and lineage; the spine " +
            "all controls bind to.",
          examples: [
            "MLflow Model Registry",
            "Azure ML model registry",
            "Databricks Unity Catalog (models)",
            "SageMaker Model Registry",
          ],
        },
        {
          name: "MLOps / model-monitoring platform",
          role:
            "Deploys, serves, and monitors production models for performance, " +
            "data drift, and output quality — the runtime control surface.",
          examples: [
            "Arize",
            "Fiddler",
            "WhyLabs",
            "Azure ML / SageMaker Model Monitor",
          ],
        },
        {
          name: "GRC / AI governance platform",
          role:
            "Holds the control framework, risk assessments, approval workflows, " +
            "policy mappings, and audit evidence across the AI estate.",
          examples: [
            "ServiceNow (GRC / AI governance)",
            "Credo AI",
            "Holistic AI",
            "OneTrust AI Governance",
            "IBM watsonx.governance",
          ],
        },
        {
          name: "Data catalog / lineage & governance",
          role:
            "Tracks the data feeding models — lineage, classification, consent, " +
            "and retention — the data-governance-for-AI substrate.",
          examples: ["Collibra", "Alation", "Microsoft Purview", "Unity Catalog"],
        },
        {
          name: "AI incident & issue register",
          role:
            "Captures AI incidents, validation/audit findings, and their " +
            "remediation lifecycle; the source for incident and finding metrics.",
          examples: [
            "ServiceNow IRM/issue management",
            "Archer",
            "MRM workflow issue logs",
          ],
        },
      ],
      roles: [
        {
          title: "Chief AI Officer (CAIO)",
          accountability:
            "Enterprise-wide accountability for AI strategy AND AI risk — owns " +
            "the governance framework, the risk-tiering rubric, and the " +
            "enable-vs-control balance; the single named owner when AI risk is " +
            "questioned.",
        },
        {
          title: "Chief Risk Officer (CRO) / Head of Model Risk Management",
          accountability:
            "Second-line independent validation and effective challenge, the " +
            "model-risk standard, and assurance that high-risk models are " +
            "validated and monitored (SR 11-7-style discipline).",
        },
        {
          title: "Responsible-AI / AI Ethics Lead",
          accountability:
            "Bias/fairness, explainability, transparency, and ethical review of " +
            "people-affecting and novel use cases; chairs the responsible-AI " +
            "review board.",
        },
        {
          title: "Model owner / developer (first line)",
          accountability:
            "Correct development, documentation, intended-use definition, and " +
            "day-to-day operation of a specific model, including responding to " +
            "monitoring alerts and validation findings.",
        },
        {
          title: "Chief Data Officer / Data Governance Lead",
          accountability:
            "Data governance for AI — lineage, classification, consent, " +
            "residency, and retention of the data models are trained on and use.",
        },
      ],
      regulatoryFrames: [
        {
          name: "EU AI Act",
          relevance:
            "Risk-based regulation classifying AI into prohibited / high-risk / " +
            "limited / minimal tiers with binding obligations (risk management, " +
            "data governance, human oversight, transparency, logging) on high-" +
            "risk systems — the dominant external driver of the risk-tiering " +
            "framework.",
        },
        {
          name: "NIST AI Risk Management Framework (AI RMF)",
          relevance:
            "Voluntary but widely adopted framework (Govern / Map / Measure / " +
            "Manage) that structures how an enterprise organizes AI risk; the " +
            "common reference for the governance operating model and control set.",
        },
        {
          name: "SR 11-7 / model risk management guidance",
          relevance:
            "Supervisory guidance for regulated financial institutions on model " +
            "risk — development standards, independent validation/effective " +
            "challenge, and ongoing monitoring — the template extended from " +
            "statistical models to the full AI/GenAI estate.",
        },
        {
          name: "Sector & data-protection rules (GDPR, ECOA/fair-lending, EEOC, sectoral)",
          relevance:
            "Domain rules that bind specific use cases — automated-decision and " +
            "explainability rights (GDPR), fair-lending/adverse-impact " +
            "(ECOA, EEOC), and sector supervisors — shaping the controls a given " +
            "high-risk model must meet.",
        },
      ],
      canonicalTerms: [
        {
          term: "Model risk tiering",
          definition:
            "Classifying each AI use case by the consequence and likelihood of " +
            "harm (e.g. prohibited / high / limited / minimal) so controls are " +
            "proportionate to risk rather than uniform.",
        },
        {
          term: "Model inventory",
          definition:
            "The complete, owned register of every AI/ML/GenAI model and use " +
            "case in production or development — the foundation of governance; " +
            "what is not inventoried is not governed.",
        },
        {
          term: "Drift",
          definition:
            "Degradation of a deployed model's accuracy as live data (data " +
            "drift) or the underlying relationship (concept drift) diverges from " +
            "the training distribution — the silent failure mode monitoring " +
            "exists to catch.",
        },
        {
          term: "Human-in-the-loop (HITL)",
          definition:
            "A control where a human reviews or must approve an AI output before " +
            "it takes effect on a consequential decision — distinct from human-" +
            "on-the-loop (oversight/monitoring without per-decision approval).",
        },
        {
          term: "Explainability",
          definition:
            "The ability to describe why a model produced a given output in " +
            "terms a human can scrutinize — feature importance, reason codes, or " +
            "model cards — sufficient to contest, audit, and defend the decision.",
        },
        {
          term: "Effective challenge / independent validation",
          definition:
            "Critical review of a model by a competent party independent of its " +
            "developers (the SR 11-7 standard) — the core second-line control " +
            "distinguishing a governed high-risk model from an untested claim.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Model inventory coverage / shadow-AI gap",
        authoritativeSource:
          "Model registry / AI inventory cross-checked against discovery scans " +
          "(SaaS/CASB, cloud AI services, code repos) and procurement records",
        whatGoodEvidenceLooksLike:
          "Registry count reconciled against an independent discovery estimate, " +
          "with named owner and risk tier per asset and the residual unknown gap " +
          "quantified.",
        weakEvidenceToReject:
          "A self-reported registry count presented as full coverage with no " +
          "discovery cross-check or estimate of the shadow/embedded-AI population.",
      },
      {
        claim: "High-risk model validation and monitoring status",
        authoritativeSource:
          "Model risk management workflow (validation sign-off and expiry) and " +
          "the MLOps monitoring platform, joined to the risk-tiered inventory",
        whatGoodEvidenceLooksLike:
          "Per high-risk model: independent-validation date and expiry, active " +
          "monitoring/drift configuration, and a defined retrain/escalation " +
          "trigger — traceable to the second-line function.",
        weakEvidenceToReject:
          "A blanket 'our models are validated and monitored' with no per-model " +
          "status, sign-off dates, or independence of the validator shown.",
      },
      {
        claim: "Bias/fairness and explainability for people-affecting models",
        authoritativeSource:
          "Responsible-AI testing records (fairness/adverse-impact results) and " +
          "explainability artifacts / model cards in the registry",
        whatGoodEvidenceLooksLike:
          "Defined fairness metric and result, adverse-impact analysis, and a " +
          "risk-tier-appropriate explainability artifact, with a responsible-AI " +
          "disposition of findings.",
        weakEvidenceToReject:
          "An assertion that 'the model is fair / unbiased' with no fairness " +
          "metric, no protected-attribute analysis, and no explainability artifact.",
      },
      {
        claim: "Control compliance, findings, and audit evidence",
        authoritativeSource:
          "GRC / AI governance platform control-test results and the issue/" +
          "finding register with raised-to-closed timestamps and severity",
        whatGoodEvidenceLooksLike:
          "Control-test pass/fail by model with linked evidence artifacts, and " +
          "open findings by severity and age with remediation status.",
        weakEvidenceToReject:
          "A single headline compliance percentage or 'no open findings' with no " +
          "underlying control tests, evidence links, or finding-aging detail.",
      },
      {
        claim: "Time-to-approval and governance throughput by risk tier",
        authoritativeSource:
          "Governance intake / approval workflow timestamps segmented by risk " +
          "tier",
        whatGoodEvidenceLooksLike:
          "Median elapsed approval time by tier showing a genuine fast lane for " +
          "low-risk and proportionate depth for high-risk, with queue/aging data.",
        weakEvidenceToReject:
          "A single average approval time with no tier breakdown, hiding whether " +
          "low-risk use cases are needlessly stuck behind heavy review.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your AI/ML/GenAI estate is inventoried with an owner and risk tier — and how do you discover shadow AI and AI embedded in vendor SaaS?",
      "Is your governance risk-tiered with a genuine fast lane for low-risk use cases, or does every model face the same heavy gate — and what is your time-to-approval by tier?",
      "For high-risk models, what share have current independent validation, and is the validator genuinely independent of the developer?",
      "What share of production models have active performance and drift monitoring with a defined retrain/escalation trigger?",
      "For models that make consequential decisions about people, what bias/fairness testing and explainability do you have, and could you explain an individual decision if challenged?",
      "Who is the single accountable owner for AI risk enterprise-wide, and are first-/second-/third-line roles defined for each high-risk model?",
      "If a regulator asked tomorrow for full evidence on your highest-risk model, how long would it take to assemble and would it be complete?",
      "Do your controls address GenAI-specific risks — hallucination, prompt injection, data leakage, IP exposure — or are you applying a classic statistical-model framework?",
    ],
    maturitySignals: [
      "Governance is risk-tiered against a recognized frame (EU AI Act / NIST AI RMF) with a fast lane for low-risk, so it enables rather than uniformly blocks.",
      "The inventory is reconciled against independent discovery, so the shadow-AI gap is known and shrinking rather than assumed away.",
      "High-risk models carry current independent validation and active drift monitoring; governance operates as a lifecycle, not a launch gate.",
      "Three-lines accountability is defined with a named Chief AI Officer, and findings are remediated on a tracked clock.",
      "Control evidence is continuously linked so an audit pack is a query, not a fire drill, and GenAI-specific risks have their own controls.",
    ],
    redFlags: [
      "No discovery process for shadow or embedded AI — the inventory is whatever teams chose to self-register, and the true population is unknown.",
      "One heavy review process applied to every use case regardless of risk, with long undifferentiated approval times and rising shadow-AI signals.",
      "Production models validated at launch but unmonitored — no drift detection, no retrain trigger, decay caught only via complaints or incidents.",
      "No named accountable owner for AI risk; first-/second-/third-line roles undefined, and validation done by the same team that built the model.",
      "People-affecting models in production with no fairness testing or explainability, unable to justify or contest an individual decision.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "AI governance / GRC platforms (Credo AI, Holistic AI, OneTrust, IBM watsonx.governance)",
        category: "AI governance, risk-tiering, policy, and evidence management",
        switchingCost:
          "Moderate-to-high — the control framework, risk assessments, policy mappings, and accumulated evidence are configured into the platform; migrating that governance state is the real cost.",
        renewalDynamics:
          "Fast-evolving category racing to map to EU AI Act / NIST RMF; favor short terms and regulatory-coverage commitments over multi-year lock-in while the space and the regulations are still moving.",
      },
      {
        vendorName: "Model monitoring / observability vendors (Arize, Fiddler, WhyLabs)",
        category: "Production model monitoring, drift detection, and ML observability",
        switchingCost:
          "Moderate — integrates via inference/feedback feeds and is replaceable with instrumentation effort, but baselines, thresholds, and monitoring history accrete stickiness.",
        renewalDynamics:
          "Usage/volume-based pricing common; negotiate against model count and inference volume and watch for coverage gaps on GenAI vs classic ML.",
      },
      {
        vendorName: "MLOps / platform-native governance (Databricks, Azure ML, SageMaker, MLflow)",
        category: "Registry, deployment gating, and native model governance in the ML platform",
        switchingCost:
          "High — fused to the data/ML platform and pipelines; governance native to the platform is hard to separate from the platform decision itself.",
        renewalDynamics:
          "Bundled into the cloud/ML platform agreement; governance increasingly upsold as a native tier — leverage the bundle but verify it covers third-party and GenAI models, not just platform-native ones.",
      },
      {
        vendorName: "Validation / responsible-AI testing & advisory (specialist firms and tools)",
        category: "Independent validation, bias/fairness testing, red-teaming, and assurance",
        switchingCost:
          "Low-to-moderate — services and point tools are re-sourceable; the asset is the validation methodology and evidence they leave behind, so contract for capability transfer.",
        renewalDynamics:
          "Project/outcome-based; structure to build in-house second-line capability rather than create a standing dependency, and require independence from any first-line build work.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is governance native to the ML/data platform (and the accumulated control-and-evidence state in a GRC platform); standalone monitoring and validation tooling is more portable. The negotiable frontier is in the governance/monitoring layer around the platform — keeping it model-agnostic so it covers third-party and GenAI models, not just platform-native ones — and in re-sourcing validation/red-team services as in-house capability matures.",
    negotiationLevers: [
      "Require regulatory-coverage commitments (EU AI Act / NIST RMF mappings kept current) given the fast-moving regulations — favor short terms over multi-year lock-in",
      "Insist governance/monitoring tooling be model-agnostic (covers third-party, embedded-vendor, and GenAI models), not just platform-native ones",
      "Usage-/model-count-based pricing for monitoring tied to actual estate size rather than a flat enterprise fee",
      "Data export, audit-log, and evidence-portability rights so accumulated governance state is not held hostage at renewal",
      "Contract validation/red-team services for capability transfer and independence from first-line build work; pilot-to-scale gating before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      inventory_claim: [
        "model registry / inventory record",
        "independent discovery-scan cross-check",
        "named owner and risk tier per asset",
      ],
      model_risk_claim: [
        "independent-validation sign-off and expiry",
        "validator independence from the developer",
        "active monitoring / drift configuration and trigger",
      ],
      responsible_ai_claim: [
        "defined fairness metric and adverse-impact result",
        "risk-tier-appropriate explainability artifact / model card",
        "responsible-AI disposition of findings",
      ],
      compliance_audit_claim: [
        "GRC control-test pass/fail per model",
        "linked evidence artifacts",
        "open findings by severity and age",
      ],
      value_projection: [
        "baseline metric (incident rate / approval time / finding load)",
        "benchmark planning-range",
        "explicit haircut factors (probabilistic risk-avoidance, over-control drag, coverage gap)",
        "framing as risk-reduction / enablement, not booked revenue",
      ],
    },
    citationStandard:
      "AI-governance claims cite the registry/MRM/GRC/monitoring source, the " +
      "model or use case, its risk tier, and the period. Model-risk claims cite " +
      "independent-validation status (and the validator's independence) and " +
      "monitoring/drift configuration per model — never a blanket 'validated and " +
      "monitored'. Value projections cite a baseline plus a labelled planning " +
      "range and the haircut factors applied, and are framed as probabilistic " +
      "risk reduction and faster safe adoption — never a single asserted hard-" +
      "dollar ROI from avoided incidents.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no reconciled inventory — frame coverage and shadow-AI exposure as an industry pattern, not their measured number.",
      "A hard-dollar ROI is requested — model the benefit as probabilistic risk-avoidance plus faster safe adoption, and hedge the conversion to booked dollars heavily.",
      "Validation or monitoring status is asserted in aggregate — flag that per-model status and validator independence are needed before relying on it.",
      "GenAI use cases are governed with a classic-model checklist — flag the GenAI-specific risk blind spot before assessing adequacy.",
      "Vendor-reported governance coverage or compliance is cited — mark as a provider claim pending tenant validation.",
    ],
    inferenceLanguage: [
      "Across enterprise AI estates at this scale, inventory coverage and shadow AI typically run...",
      "Without your per-model validation status, the industry pattern is that high-risk validation lags model volume by...",
      "Peer governance programs commonly see time-to-approval compress by... once a proportionate fast lane replaces a uniform gate...",
      "This is a probabilistic risk-reduction figure, not a booked saving — treat it as a planning range, not your measured outcome.",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI or hard saving for this tenant's governance program",
      "This tenant's actual inventory coverage, validation rate, or incident rate",
      "A claim that a specific model is validated, monitored, fair, or compliant without per-model evidence",
      "An assertion that the AI estate is fully inventoried with no shadow or embedded AI",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "AI risk exposure across the estate / which models are riskiest",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Risk heatmap of models/use cases by likelihood × consequence (or risk tier × control gap) to show where governance attention must concentrate.",
    },
    {
      questionPattern:
        "control coverage by risk tier / governance gaps",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      chartBuilder: "stackedBar",
      note: "Stacked bar of models per risk tier split by control status (validated/monitored/HITL vs gap) to expose where high-risk coverage is missing.",
    },
    {
      questionPattern:
        "time-to-approval by tier / is governance a blocker",
      exhibitKind: "chart",
      chartKind: "bar",
      chartBuilder: "bar",
      note: "Median time-to-approval by risk tier to show whether a proportionate fast lane exists or low-risk is stuck behind heavy review.",
    },
    {
      questionPattern:
        "value sensitivity / which haircut bites the governance case hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of probabilistic risk-avoidance, over-control drag, coverage gap, and adoption/accountability haircuts on realized value.",
    },
    {
      questionPattern: "AI governance maturity scorecard",
      exhibitKind: "table",
      note: "Inventory coverage, high-risk validation rate, monitoring/drift coverage, HITL coverage, policy compliance, time-to-approval, incident rate, open findings, explainability rate vs planning ranges.",
    },
    {
      questionPattern: "audit / regulatory evidence pack for a model or use case",
      exhibitKind: "table",
      note: "Per model: risk tier, validation status, approvals, monitoring/drift config, data lineage, open findings — the assembled evidence pack.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Governance is risk-tiered with a genuine fast lane for low-risk, so it enables adoption rather than uniformly blocking it",
      "A named Chief AI Officer owns AI risk end-to-end with defined first-/second-/third-line accountability per high-risk model",
      "Governance runs as a lifecycle on a control plane (registry + gating + monitoring), not a launch-day checklist, with active drift detection",
      "Inventory is reconciled against independent discovery so shadow and embedded AI are surfaced rather than assumed away",
      "Control evidence is continuously linked and GenAI-specific risks have purpose-built controls, so audits are queries not fire drills",
    ],
    failureDrivers: [
      "Governance bolted on late and applied uniformly — heavy, slow approval drives shadow AI and the business treats it as the obstacle",
      "Inventory incomplete and shadow/embedded AI ungoverned, so the framework protects only the visible minority of the estate",
      "Models deployed and forgotten — validated at launch, never monitored, decay caught only after harm",
      "No clear accountability — risk decisions fall between the seams and validation is done by the team that built the model",
      "Compliance theater — high paper-compliance over weak, box-ticked controls, with aging unremediated findings and unreported incidents",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Regulated functions (financial model risk, credit, claims) adopt first " +
      "because the discipline and regulatory pressure already exist — they " +
      "extend SR 11-7-style practice to new models. The broad GenAI estate is " +
      "harder: it proliferates faster than governance scales, so coverage chases " +
      "the estate. Adoption accelerates when governance is experienced as a fast " +
      "enabling lane rather than a brake; it stalls and breeds shadow AI when " +
      "controls are uniform and slow. The hardest, latest adoption is genuine " +
      "monitoring/drift and GenAI-specific controls across the long tail.",
    roiClarity: "low",
    roiClarityBasis:
      "This is the lowest-ROI-clarity domain of the back-office set, and the " +
      "honest expert says so. The dominant benefit — incidents, fines, and " +
      "reputational loss AVOIDED — is probabilistic and counterfactual: you are " +
      "valuing events that did not happen, which finance will not book as a hard " +
      "saving. The enablement benefit (faster safe adoption) is real but " +
      "indirect, realized through the AI portfolio it unblocks rather than on " +
      "governance's own line. The measurable wins — approval cycle-time and " +
      "audit-evidence effort — are genuine but modest relative to the risk story. " +
      "So ROI is sized as risk reduction and cycle-time, hedged heavily, and " +
      "never promised as a hard-dollar return on avoided incidents.",
  },

  regulatoryFrame: {
    name: "EU AI Act, NIST AI RMF & SR 11-7 (model risk)",
    relevance:
      "The dominant regulatory frame for this expert: the EU AI Act's risk-" +
      "based tiering and high-risk obligations (risk management, data " +
      "governance, human oversight, transparency, logging) set the binding bar; " +
      "NIST AI RMF (Govern/Map/Measure/Manage) structures the operating model; " +
      "and SR 11-7 supplies the model-risk discipline of independent validation " +
      "and ongoing monitoring extended across the AI/GenAI estate. Sector and " +
      "data-protection rules (GDPR automated-decision/explainability rights, " +
      "ECOA/EEOC fair-lending and adverse-impact) bind specific high-risk use " +
      "cases (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (W3 wave2)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
