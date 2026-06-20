// Consilium expert — Enterprise Risk, Compliance & Internal Audit (cross-cutting,
// the broad GRC / second-and-third-line layer).
//
// W3 wave2 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It owns the broad
// corporate GRC question the audit committee and the board lives with: "do we
// know what could hurt us, are the controls that should prevent it actually
// working, can we prove compliance to a regulator, and are our audit findings
// and ESG disclosures something we'd stake our name on?"
//
// CORE DOCTRINE — RISK & COMPLIANCE IS RISK-ADJUSTED ASSURANCE, NOT A BLOCKER —
// AND THE HONEST EXPERT ADMITS IT IS USUALLY SEEN AS ONE. The truth this expert
// insists on: the function is overwhelmingly perceived as a cost center and a
// brake on the business — "the department of no" — because its value is
// avoided-loss (incidents not had, fines not paid, restatements not filed) plus
// faster confident operation, never booked revenue. Three structural honesty
// points the expert leads with: (1) AUDIT FINDINGS LAG — internal audit works
// on a cycle, so findings surface the state of controls months ago, not today,
// and the same findings repeat year after year (repeat-finding rate is the tell);
// (2) CONTROLS ARE OFTEN DESIGNED, NOT OPERATING — a control that exists on
// paper and a control that is tested and passing are different states, and SOX
// exists precisely because the gap is real; (3) ESG / SUSTAINABILITY DATA
// ASSURANCE IS IMMATURE — most ESG disclosure is unaudited or limited-assurance
// at best, the data is scattered and estimated, and the assurance bar (and the
// regulation: CSRD, SEC climate, ISSB) is rising faster than the data quality.
// The discipline is RISK-PROPORTIONATE assurance: concentrate scarce control,
// testing, and audit effort on the few key risks and key controls, automate the
// routine, and stop treating every policy and every control as equally
// important. Anchors to the standard frames (COSO ERM & Internal Control,
// SOX, ISO 31000, the IIA three-lines model, NIST/ISO for the IT-control
// overlap, CSRD/ISSB/SEC for ESG) without locking to any one. DISTINCT from the
// Cybersecurity expert (security operations / threat) and the AI Governance &
// Model Risk expert (model risk) — this is the broad enterprise-risk, regulatory-
// compliance, internal-audit, controls/SOX, policy, ESG-reporting, and third-
// party-risk layer. It consumes those specialist domains as risk inputs rather
// than owning them.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const enterpriseRiskComplianceExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.enterprise-risk-compliance-audit",
    expertName: "Enterprise Risk, Compliance & Internal Audit Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "enterprise-risk-compliance-audit",
    scopeNote:
      "Cross-cutting GRC / second-and-third-line assurance of the enterprise: " +
      "enterprise risk management (ERM) and the risk register / key-risk " +
      "indicators; regulatory compliance and policy management (policy " +
      "lifecycle, attestation, training, regulatory-change tracking); internal " +
      "controls and SOX (control design, testing, deficiency remediation); " +
      "internal audit (plan, fieldwork, findings, follow-up, the three-lines " +
      "model); third-party / vendor risk; and ESG / sustainability reporting and " +
      "its assurance. Doctrine: risk-adjusted ASSURANCE via risk-proportionate " +
      "effort on key risks and key controls — and honest that the function is " +
      "usually seen as a cost/blocker, that audit findings lag the live state, " +
      "and that ESG data assurance is immature. DISTINCT from the Cybersecurity " +
      "expert (security operations) and the AI Governance & Model Risk expert " +
      "(model risk): this owns the broad GRC/audit/compliance/ESG layer and " +
      "consumes those specialist domains as risk inputs. Excludes deep " +
      "function-specific operating depth and the technical security/model " +
      "controls those specialist experts own.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "open_audit_findings",
        name: "Open internal-audit findings",
        definition:
          "Number of internal-audit, regulatory-exam, and SOX findings that are " +
          "raised and not yet verified-closed, weighted by severity and age — " +
          "the live backlog of known control gaps.",
        unit: "weighted findings",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 80,
          basis:
            "Indicative open-finding load for an enterprise audit function; " +
            "depends heavily on audit scope, cadence, and estate size rather " +
            "than a hard norm, so it is read as a trend and an aging profile, " +
            "not an absolute target",
          label: "planning-range",
        },
        dataSource:
          "Internal-audit / issue-management workflow (raised-to-closed status " +
          "with severity and age) in the GRC or audit-management platform",
        whyItMatters:
          "The audit committee's headline scorecard. A growing weighted-and-aged " +
          "backlog says the organization is finding control gaps faster than it " +
          "fixes them — and an aging tail of unremediated highs is the number a " +
          "regulator and the board react to first.",
      },
      {
        key: "findings_remediated_on_time",
        name: "Findings remediated on time",
        definition:
          "Share of audit / compliance findings closed by their committed " +
          "remediation due date, weighted by severity — the discipline of " +
          "actually fixing what was found.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 92,
          basis:
            "On-time remediation attainment in maturing assurance programs; " +
            "high-severity items should close on time near-universally, while " +
            "lower-severity backlogs commonly slip and drag the blended rate down",
          label: "planning-range",
        },
        dataSource:
          "Issue-management workflow due-date vs verified-closure timestamps, " +
          "segmented by severity",
        whyItMatters:
          "Finding a problem is the easy half; closing it on time is the half " +
          "auditors and regulators score. A low on-time rate means known risks " +
          "stay live and the function is detecting more than the business is " +
          "willing or able to fix.",
      },
      {
        key: "control_test_pass_rate",
        name: "Control test pass rate",
        definition:
          "Share of key controls (SOX and other in-scope) that pass their " +
          "operating-effectiveness test in the current cycle — controls that are " +
          "demonstrably operating, not merely designed.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 99,
          basis:
            "SOX / control-testing experience; mature programs clear most key " +
            "controls but never 100% — a suspiciously perfect rate usually means " +
            "weak testing rather than flawless controls",
          label: "planning-range",
        },
        dataSource:
          "Control-testing workpapers / GRC control-test results joined to the " +
          "key-control register",
        whyItMatters:
          "The difference between a control that exists on paper and one that " +
          "actually works. A high pass rate over weakly-tested controls is " +
          "comfort theater; the metric is only meaningful when the controls are " +
          "key-risk-relevant and the testing is rigorous and independent.",
      },
      {
        key: "kri_coverage",
        name: "Key-risk-indicator (KRI) coverage",
        definition:
          "Share of the enterprise's top / key risks on the risk register that " +
          "have at least one defined, monitored, threshold-bearing key-risk " +
          "indicator — vs risks tracked only by qualitative judgement.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "ERM maturity ranges; many programs name their top risks but few " +
            "have leading, quantified KRIs with thresholds for most of them, so " +
            "coverage trails the register count",
          label: "planning-range",
        },
        dataSource:
          "Risk register joined to the KRI library / risk-monitoring dashboard " +
          "in the ERM or GRC platform",
        whyItMatters:
          "KRIs turn risk from a periodic qualitative exercise into something " +
          "monitored. Low coverage means most top risks are watched by opinion " +
          "and re-scored annually rather than tracked by a leading signal that " +
          "could warn before the loss event.",
      },
      {
        key: "compliance_training_completion",
        name: "Compliance training completion rate",
        definition:
          "Share of required employees who have completed mandatory compliance " +
          "training (code of conduct, anti-bribery, privacy, sector rules) by " +
          "the due date for the current cycle.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 99,
          basis:
            "Compliance-training completion norms; high completion is an " +
            "expectation rather than an achievement, and the meaningful question " +
            "is whether the last few percent (often higher-risk roles) close",
          label: "planning-range",
        },
        dataSource:
          "Learning-management / compliance-training system completion records " +
          "joined to the required-population roster",
        whyItMatters:
          "A baseline regulator-and-board expectation and a defensibility " +
          "control. High completion alone proves attendance, not understanding — " +
          "but a low or stalled rate, especially in high-risk roles, is an " +
          "immediate exam finding and a culture signal.",
      },
      {
        key: "policy_attestation_rate",
        name: "Policy attestation rate",
        definition:
          "Share of required employees who have read-and-attested to in-scope " +
          "policies (those requiring acknowledgement) within the attestation " +
          "window for the current cycle.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 98,
          basis:
            "Policy-attestation completion ranges; like training, high " +
            "attestation is expected, and the signal is in the laggards and in " +
            "whether attestation is tied to current policy versions",
          label: "planning-range",
        },
        dataSource:
          "Policy-management platform attestation records joined to the " +
          "required-population and current policy versions",
        whyItMatters:
          "Attestation is the evidentiary spine of policy management — proof an " +
          "employee was put on notice of an obligation. A low rate, or " +
          "attestations against superseded policy versions, undermines the " +
          "defensibility the whole policy program exists to provide.",
      },
      {
        key: "third_party_risk_coverage",
        name: "Third-party risk assessment coverage",
        definition:
          "Share of in-scope third parties / vendors (especially those handling " +
          "data, money, or critical services) with a completed, current risk " +
          "assessment and a defined risk tier — vs onboarded-and-unassessed.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 85,
          basis:
            "Third-party-risk-management maturity ranges; programs typically " +
            "assess the obvious critical vendors but lag on the long tail and on " +
            "reassessment cadence, so current-coverage trails the vendor count",
          label: "planning-range",
        },
        dataSource:
          "Third-party / vendor-risk-management platform assessment status " +
          "joined to the vendor master and contract/spend records",
        whyItMatters:
          "Outsourced risk is still owned risk — a vendor breach, failure, or " +
          "compliance lapse lands on the enterprise. Low or stale coverage means " +
          "a large part of the risk surface lives outside the walls and outside " +
          "the assessment, which is where many of the largest incidents originate.",
      },
      {
        key: "time_to_remediate",
        name: "Time-to-remediate findings",
        definition:
          "Median elapsed days from a raised finding (audit, compliance, " +
          "control deficiency, vendor issue) to its verified closure, weighted " +
          "by severity.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 180,
          basis:
            "Issue-closure ranges across assurance programs; high-severity " +
            "items should close in weeks, but aging backlogs of medium- and " +
            "low-severity items routinely stretch the median",
          label: "planning-range",
        },
        dataSource:
          "Issue / finding-management workflow raised-to-closed timestamps with " +
          "severity in the GRC or audit platform",
        whyItMatters:
          "A long remediation clock means known risks stay open longer and the " +
          "function is accumulating, not retiring, exposure. It is also the " +
          "metric that most directly drives the open-finding backlog and the " +
          "repeat-finding rate.",
      },
      {
        key: "repeat_finding_rate",
        name: "Repeat-finding rate",
        definition:
          "Share of new findings in a period that are recurrences of a " +
          "previously-raised (and supposedly remediated or accepted) issue — the " +
          "tell that fixes are cosmetic or root causes are untouched.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Repeat-finding incidence in audit programs; a low rate signals " +
            "durable remediation while a high rate signals symptom-patching, " +
            "weak root-cause analysis, or risk-acceptance dressed as a fix",
          label: "planning-range",
        },
        dataSource:
          "Finding-management workflow with recurrence / linkage flags relating " +
          "new findings to prior ones",
        whyItMatters:
          "The honest measure of whether remediation is real. A high repeat rate " +
          "is the single clearest sign that findings are being closed on paper " +
          "without fixing the underlying cause — and it is exactly what erodes " +
          "audit-committee and regulator confidence.",
      },
      {
        key: "risk_appetite_breach_count",
        name: "Risk-appetite / KRI breach count",
        definition:
          "Count of periods in which a monitored key risk breached its defined " +
          "risk-appetite threshold or KRI limit without a timely, documented " +
          "response — the gap between stated appetite and actual exposure.",
        unit: "breaches / period",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 12,
          basis:
            "Indicative breach frequency; some breaches are healthy evidence the " +
            "appetite framework is calibrated and monitored, while a persistent " +
            "or unresponded pattern signals appetite-on-paper",
          label: "planning-range",
        },
        dataSource:
          "ERM / KRI monitoring dashboard threshold-breach log joined to the " +
          "appetite statement and the response/escalation record",
        whyItMatters:
          "Whether the board's stated risk appetite actually constrains the " +
          "business. Repeated unresponded breaches mean the appetite framework " +
          "is a document, not a control — and a suspicious zero usually means " +
          "thresholds are set so loose they never trip.",
      },
      {
        key: "esg_disclosure_assurance_level",
        name: "ESG disclosure assurance level",
        definition:
          "The level of external/independent assurance over reported ESG / " +
          "sustainability metrics, expressed as the share of material disclosed " +
          "metrics covered by at least limited (vs none) and the share at " +
          "reasonable assurance.",
        unit: "% of material metrics assured",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 60,
          basis:
            "ESG-assurance maturity; most ESG disclosure today is unassured or " +
            "at limited assurance, with reasonable assurance rare — the bar is " +
            "rising under CSRD/ISSB faster than data quality, so coverage is low " +
            "and uneven",
          label: "planning-range",
        },
        dataSource:
          "ESG / sustainability-reporting platform and assurance engagement " +
          "records mapped to the materiality assessment and disclosed metrics",
        whyItMatters:
          "ESG numbers are increasingly going into regulated filings, but the " +
          "data is scattered, estimated, and largely unassured — a structural " +
          "honesty gap. Low assurance coverage means disclosed metrics carry " +
          "materially more uncertainty than the financial statements beside them.",
      },
      {
        key: "regulatory_incident_count",
        name: "Regulatory incident / breach count",
        definition:
          "Count of regulatory incidents per period — reportable breaches, " +
          "exam deficiencies escalated to formal action, fines, consent orders, " +
          "or material compliance failures — weighted by severity.",
        unit: "weighted incidents / period",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 6,
          basis:
            "Indicative regulatory-incident frequency; a near-zero rate with " +
            "active monitoring is the target, while an apparent zero with no " +
            "reporting channel usually means incidents go uncaptured rather than " +
            "unoccurred",
          label: "planning-range",
        },
        dataSource:
          "Compliance incident register / regulatory-interaction log joined to " +
          "the enforcement and remediation record",
        whyItMatters:
          "The outcome metric the whole framework exists to move. A rising " +
          "weighted count signals control failure reaching the regulator; a " +
          "suspicious zero usually signals no reporting culture rather than no " +
          "incidents — read it alongside detection and self-reporting rates.",
      },
    ],

    painThemes: [
      {
        key: "function_seen_as_cost_blocker",
        name: "Risk/compliance seen as a cost center and blocker",
        description:
          "The function is perceived as the 'department of no' — a cost that " +
          "slows the business and produces paperwork rather than value — because " +
          "its benefit is avoided-loss it can never fully prove, so it is " +
          "under-funded, brought in late, and routed around when it is " +
          "inconvenient.",
        detectionSignal:
          "Risk/compliance engaged after decisions are made rather than during; " +
          "the function described in budget reviews as overhead; business units " +
          "treating attestations and assessments as box-ticking; second line " +
          "with no seat at the strategy table.",
        diagnosticQuestion:
          "Is risk/compliance brought in early as a partner that lets the " +
          "business move confidently, or late as a gate — and how does the " +
          "organization actually talk about the function's value?",
      },
      {
        key: "audit_findings_lag",
        name: "Audit findings lag the live state (and repeat)",
        description:
          "Internal audit works on a cycle, so findings describe the state of " +
          "controls months ago, not today, and because root causes go untouched " +
          "the same findings recur year after year — assurance that is " +
          "backward-looking and repetitive rather than current and durable.",
        detectionSignal:
          "Long gap between control failure and its discovery in audit; a high " +
          "repeat-finding rate; findings closed by management assertion without " +
          "verification; annual audit plan unchanged despite a shifting risk " +
          "profile.",
        diagnosticQuestion:
          "How current is your assurance — how long between a control failing " +
          "and audit finding it — and what share of this year's findings are " +
          "repeats of prior ones?",
      },
      {
        key: "controls_designed_not_operating",
        name: "Controls designed on paper but not operating",
        description:
          "A control documented in the framework and a control that is tested " +
          "and demonstrably operating are different states routinely collapsed " +
          "into 'we have a control', so deficiencies surface only at test time " +
          "or after an incident — the exact gap SOX exists to expose.",
        detectionSignal:
          "Control inventory far larger than the tested-control population; key " +
          "controls without an owner or an evidence trail; control descriptions " +
          "that don't match what staff actually do; clean self-assessments " +
          "contradicted by test results.",
        diagnosticQuestion:
          "For your key controls, what share are actually tested for operating " +
          "effectiveness — not just documented — and how often do test results " +
          "contradict the self-assessment?",
      },
      {
        key: "esg_data_assurance_immature",
        name: "ESG data and disclosure assurance is immature",
        description:
          "ESG / sustainability data is scattered across systems and " +
          "spreadsheets, heavily estimated, and largely unassured, yet it is " +
          "increasingly going into regulated filings under a rising bar " +
          "(CSRD, ISSB, SEC climate) — so disclosure outruns data quality and " +
          "assurance.",
        detectionSignal:
          "ESG metrics owned in spreadsheets with no lineage; emissions and " +
          "supply-chain figures estimated with undocumented assumptions; no or " +
          "only limited external assurance; finance and sustainability teams " +
          "with separate, reconcilable-with-difficulty numbers.",
        diagnosticQuestion:
          "For the ESG metrics you disclose, where does the data come from, how " +
          "much is estimated, and what level of independent assurance sits over " +
          "it relative to the regulation you're now subject to?",
      },
      {
        key: "siloed_grc_no_single_view",
        name: "Siloed GRC with no single risk view",
        description:
          "Risk, compliance, SOX, audit, vendor-risk, and ESG each run their " +
          "own tools, taxonomies, and registers, so the same risk is assessed " +
          "differently in different places, evidence is duplicated, and no one " +
          "can produce a single enterprise view of risk and control health.",
        detectionSignal:
          "Multiple overlapping risk registers; incompatible risk taxonomies " +
          "across functions; the same control tested by several teams; an " +
          "enterprise risk report assembled manually from spreadsheets each " +
          "quarter.",
        diagnosticQuestion:
          "Can you produce one current, reconciled enterprise view of your top " +
          "risks and the health of the controls over them — or is it stitched " +
          "together by hand from separate registers each cycle?",
      },
      {
        key: "manual_evidence_audit_scramble",
        name: "Manual control-testing and audit-evidence scramble",
        description:
          "Control testing and evidence collection are largely manual and " +
          "sample-based, so testers reconcile spreadsheets and chase artifacts, " +
          "coverage is thin, and every exam becomes a fire drill to reassemble " +
          "evidence that should already be linked and current.",
        detectionSignal:
          "Control testing done in spreadsheets on small judgemental samples; " +
          "evidence gathered ad hoc per request; long lead times to produce an " +
          "audit pack; findings about missing or inconsistent documentation; " +
          "testers spending more time gathering than analyzing.",
        diagnosticQuestion:
          "How much of your control testing and evidence collection is manual " +
          "and sample-based — and if a regulator asked tomorrow for full " +
          "evidence on a key control, how long would it take to assemble?",
      },
      {
        key: "risk_appetite_on_paper",
        name: "Risk appetite stated but not operationalized",
        description:
          "The board approves a risk-appetite statement that never reaches the " +
          "front line as enforced limits or monitored KRIs, so appetite is a " +
          "document referenced at board meetings rather than a control that " +
          "shapes day-to-day risk-taking.",
        detectionSignal:
          "Appetite statement disconnected from KRIs and limits; breaches " +
          "tracked nowhere or with no response; business decisions made without " +
          "reference to appetite; thresholds set so loose they never trip.",
        diagnosticQuestion:
          "Does your risk-appetite statement translate into monitored KRIs and " +
          "enforced limits that actually constrain decisions — and what happens " +
          "operationally when a threshold is breached?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "continuous_controls_monitoring",
        name: "Continuous controls monitoring & automated testing",
        valueMechanism:
          "Instrument key controls to test continuously against full " +
          "transaction populations (not periodic judgemental samples) — flagging " +
          "exceptions, broken controls, and anomalies as they occur — so control " +
          "assurance shifts from a backward-looking annual sample to a current, " +
          "near-complete signal, raising the real pass rate and shrinking the gap " +
          "between a control failing and someone noticing.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "System logs and full transaction populations from the in-scope source systems (ERP, HR, finance)",
          "A key-control register mapping each control to a testable rule and threshold",
          "An exception/issue workflow to route flagged items",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Automated exceptions still require human disposition — a flag is not a confirmed deficiency until investigated",
          "Continuous monitoring touches sensitive financial and HR data and must respect access and segregation-of-duties limits",
        ],
        metricsMoved: [
          "control_test_pass_rate",
          "open_audit_findings",
          "time_to_remediate",
        ],
      },
      {
        key: "ai_audit_workpaper_analytics",
        name: "AI-assisted audit analytics & workpaper drafting",
        valueMechanism:
          "Use analytics over full data populations to risk-rank where auditors " +
          "look, and use generative drafting to assemble workpapers, test " +
          "narratives, and finding write-ups from evidence — letting scarce audit " +
          "capacity cover more of the estate, surface issues sooner, and reduce " +
          "the lag between a control failing and audit catching it.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Access to source-system data and prior audit workpapers / finding history",
          "The audit plan, risk-assessment scoring, and control framework",
          "Document/evidence repository the drafting can cite from",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI-drafted workpapers and findings are a draft — the auditor owns the conclusion and the evidence citation, and must verify before issuance",
          "Auditor independence and confidentiality require the analytics environment be governed and access-controlled",
        ],
        metricsMoved: [
          "open_audit_findings",
          "time_to_remediate",
          "repeat_finding_rate",
        ],
      },
      {
        key: "regulatory_change_intelligence",
        name: "Regulatory-change tracking & policy impact mapping",
        valueMechanism:
          "Continuously ingest regulatory and rule changes, classify relevance " +
          "to the enterprise, and map each change to the affected policies, " +
          "controls, and obligations — so compliance stops manually scanning " +
          "regulators and instead works a prioritized, mapped change queue, " +
          "closing the window in which the firm is out of step with a new rule.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Regulatory-change feeds and the regulators/jurisdictions in scope",
          "A policy and obligation library mapped to controls and owners",
          "Business-footprint metadata to assess applicability",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Applicability and interpretation are legal judgement calls — a compliance/legal owner confirms before changes drive policy or control updates",
          "A missed or misclassified change is a compliance exposure, so coverage and false-negative rate must be monitored",
        ],
        metricsMoved: [
          "regulatory_incident_count",
          "policy_attestation_rate",
          "open_audit_findings",
        ],
      },
      {
        key: "intelligent_third_party_risk",
        name: "Intelligent third-party / vendor risk assessment",
        valueMechanism:
          "Automate vendor risk intake, enrich it with external risk signals " +
          "(financial, security, sanctions, adverse media), and risk-tier the " +
          "population so assessment effort concentrates on the riskiest vendors " +
          "and the long tail gets continuous monitoring rather than a one-time " +
          "questionnaire — raising current coverage across a surface too large to " +
          "assess manually.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Vendor master, contracts, and spend joined to data/criticality classification",
          "External risk-signal feeds (financial health, breach, sanctions, adverse media)",
          "A risk-tiering rubric and assessment workflow",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "External signals and auto-tiering inform but do not replace human assessment of critical vendors",
          "Adverse-media and external scoring can be noisy or unfair — a human dispositions before it drives a vendor decision",
        ],
        metricsMoved: [
          "third_party_risk_coverage",
          "regulatory_incident_count",
          "time_to_remediate",
        ],
      },
      {
        key: "policy_compliance_copilot",
        name: "Policy & compliance copilot (GenAI Q&A and authoring)",
        valueMechanism:
          "Ground a GenAI assistant on the policy and regulatory corpus so " +
          "employees get cited answers to 'what's the rule / am I allowed' in the " +
          "flow of work, and policy teams draft and update policies against " +
          "current regulation faster — lifting attestation and training " +
          "effectiveness by making policy usable rather than a binder no one reads.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Current, version-controlled policy and regulatory corpus with citations",
          "Role/jurisdiction context to scope answers to the right obligations",
          "Attestation and training records to target gaps",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "A wrong or uncited compliance answer is a real exposure — answers must cite the source policy and a human owns ambiguous interpretations",
          "The corpus must be current and version-controlled or the copilot confidently cites superseded policy",
        ],
        metricsMoved: [
          "policy_attestation_rate",
          "compliance_training_completion",
          "regulatory_incident_count",
        ],
      },
      {
        key: "esg_data_lineage_assurance",
        name: "ESG data lineage, controls & assurance-readiness",
        valueMechanism:
          "Bring scattered, estimated ESG data into a governed pipeline with " +
          "lineage, documented assumptions, and financial-grade controls, and " +
          "automate evidence assembly for assurance — so disclosed sustainability " +
          "metrics become auditable and assurance-ready, closing the gap between " +
          "rising disclosure regulation and immature ESG data quality.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "ESG/sustainability source systems and the spreadsheets where data currently lives",
          "The materiality assessment and the metric definitions/methodologies being disclosed",
          "A control framework and evidence store extendable to ESG metrics",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Estimation methodologies and assumptions are judgement that a human owns and documents — the tool tracks lineage, it does not bless the estimate",
          "ESG data feeding regulated filings inherits financial-reporting-grade control expectations and false precision is a real disclosure risk",
        ],
        metricsMoved: [
          "esg_disclosure_assurance_level",
          "control_test_pass_rate",
          "regulatory_incident_count",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "integrated_grc_platform",
        name: "Integrated GRC platform with a common risk taxonomy",
        description:
          "A single GRC backbone where risk register, controls/SOX, policy, " +
          "compliance, audit, vendor-risk, and ESG share one risk taxonomy, one " +
          "control library, and one evidence store — so a risk is assessed once, " +
          "a control tested once serves many obligations, and an enterprise risk " +
          "view is a query rather than a manual spreadsheet assembly.",
        boundary:
          "Owns the common taxonomy, the integrated registers, and the shared " +
          "evidence store; does not make the risk-acceptance or remediation " +
          "decisions (the first and second line do) and does not own the " +
          "underlying source systems it pulls control evidence from.",
        humanAccountabilityPoint:
          "Chief Risk Officer / Chief Compliance Officer (jointly, with the audit committee)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "three_lines_operating_model",
        name: "Three-lines operating model (IIA)",
        description:
          "An operating model separating risk ownership in the business (first " +
          "line), risk and compliance oversight and challenge (second line), and " +
          "independent internal-audit assurance (third line) — with clear " +
          "decision rights so risk decisions don't fall between the seams and " +
          "audit's independence is structurally protected.",
        boundary:
          "Owns the accountability split and the oversight/challenge and " +
          "assurance processes; does not own the business's risk-taking " +
          "decisions (first line) and deliberately keeps third-line audit " +
          "independent of the second-line functions it assures.",
        humanAccountabilityPoint:
          "Chief Audit Executive (reporting to the audit committee) for the third line",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "continuous_assurance_control_plane",
        name: "Continuous-assurance control plane (CCM + analytics)",
        description:
          "A tooling layer that continuously monitors key controls against full " +
          "data populations and feeds audit analytics, so control assurance is " +
          "current and near-complete rather than periodic and sample-based — " +
          "turning audit and SOX from a backward-looking cycle into a live " +
          "control-health signal feeding the GRC backbone.",
        boundary:
          "Owns the automated testing, exception generation, and analytics; does " +
          "not set which controls are key (the framework does) and does not " +
          "disposition exceptions or close findings (humans do).",
        humanAccountabilityPoint:
          "Head of Internal Audit / SOX (with the control owners)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "esg_reporting_assurance_framework",
        name: "ESG reporting & assurance-readiness framework",
        description:
          "A governed ESG data pipeline plus a disclosure-controls framework " +
          "that brings sustainability metrics under financial-reporting-grade " +
          "lineage, assumptions documentation, and control testing — making " +
          "disclosed ESG metrics auditable and ready for external assurance under " +
          "CSRD / ISSB / SEC, the maturity step the function most lacks.",
        boundary:
          "Owns the ESG data lineage, controls, and assurance-evidence " +
          "assembly; does not own the sustainability strategy or the estimation " +
          "methodologies (it documents and controls them) and does not provide " +
          "the external assurance opinion itself.",
        humanAccountabilityPoint:
          "Chief Sustainability Officer / Controller (with external assurance provider)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "policy_lifecycle_attestation_engine",
        name: "Policy lifecycle & attestation engine",
        description:
          "A managed policy lifecycle — authoring, review, approval, " +
          "versioning, publication, role-targeted attestation and training, and " +
          "regulatory-change linkage — so policies stay current, the right people " +
          "attest to the right versions, and the evidentiary trail of who was put " +
          "on notice is automatic rather than reconstructed.",
        boundary:
          "Owns the policy lifecycle, attestation, and the evidence trail; does " +
          "not own the policy content decisions (the policy owners do) or the " +
          "legal interpretation of the obligations the policies implement.",
        humanAccountabilityPoint:
          "Chief Compliance Officer (with policy owners)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Enterprise risk, compliance, and internal audit create value as " +
        "RISK-ADJUSTED ASSURANCE — and the honest expert leads by admitting the " +
        "function is usually experienced as a cost center and a blocker. The " +
        "value is overwhelmingly avoided-loss: fines, enforcement actions, " +
        "restatements, litigation, and reputational damage that did NOT happen, " +
        "plus the productivity and confidence of a business that can move " +
        "knowing its controls hold. None of that is booked revenue, so finance " +
        "credits it grudgingly. There ARE measurable, hard-ish wins — automation " +
        "of control testing, audit, evidence collection, vendor assessment, and " +
        "policy/regulatory tracking reduces real effort and cycle time, and is " +
        "where the defensible dollar case lives. But the dominant prize " +
        "(incidents and fines avoided) is probabilistic and counterfactual and " +
        "must be hedged heavily. Three honesty discounts shape the model: audit " +
        "findings LAG (so today's assurance reflects the past and repeat findings " +
        "erode it), controls are often DESIGNED not OPERATING (so the framework " +
        "overstates protection until tested), and ESG data assurance is IMMATURE " +
        "(so disclosed sustainability value carries materially more uncertainty " +
        "than the financials). The durable curve-bender is risk-PROPORTIONATE " +
        "assurance — concentrate scarce testing and audit effort on the few key " +
        "risks and key controls, automate the routine, and stop treating every " +
        "policy and control as equal. Hard-dollar claims sit on the efficiency " +
        "levers; the risk-reduction prize is sized as expected-loss-avoided and " +
        "labelled as such.",
      dominantHaircutFactors: [
        {
          factor: "Risk-avoidance value is probabilistic, not booked",
          rationale:
            "The largest benefit — fines, restatements, enforcement, and " +
            "reputational loss avoided — is an expected value over uncertain " +
            "events, not a realized P&L line. Finance discounts it heavily and " +
            "it must be framed as risk reduction, never a guaranteed saving.",
          typicalHaircut: {
            low: 0.35,
            high: 0.75,
            basis:
              "Gap between modeled expected-loss-avoided and what finance will " +
              "credit as a hard benefit for probabilistic risk reduction in a " +
              "function already viewed as overhead",
            label: "planning-range",
          },
        },
        {
          factor: "Findings lag and remediation is the bottleneck",
          rationale:
            "Detecting more does not reduce risk if remediation lags and " +
            "findings repeat — the value of better detection is capped by the " +
            "organization's willingness and capacity to fix and to fix the root " +
            "cause, not the symptom.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Observed gap between detection improvement and realized risk " +
              "reduction where remediation backlogs and repeat findings persist",
            label: "planning-range",
          },
        },
        {
          factor: "Controls designed vs operating (coverage/effectiveness gap)",
          rationale:
            "Realized assurance trails the documented framework because many " +
            "controls are designed but untested or weakly tested — so paper " +
            "control coverage overstates the protection actually operating.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Distance between the documented control framework and the share " +
              "of key controls rigorously tested and demonstrably operating",
            label: "planning-range",
          },
        },
        {
          factor: "ESG / data quality and assurance immaturity",
          rationale:
            "ESG and other emerging-disclosure value depends on data that is " +
            "scattered, estimated, and largely unassured — so any value resting " +
            "on ESG metrics carries materially more uncertainty until the data " +
            "and assurance mature.",
          typicalHaircut: {
            low: 0.2,
            high: 0.6,
            basis:
              "Uncertainty premium on ESG-linked value given immature lineage, " +
              "estimation, and assurance relative to financial-reporting data",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Control-testing & audit effort reduction (automation)",
          range: {
            low: 0.25,
            high: 0.6,
            basis:
              "Reduction in manual control-testing, evidence-collection, and " +
              "audit-fieldwork effort when continuous monitoring and analytics " +
              "replace periodic sampling — the hard-dollar efficiency lever",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in testing/audit effort and time, raising " +
            "control_test_pass_rate visibility and cutting time_to_remediate " +
            "(efficiency saving, partially bookable)",
        },
        {
          lever: "Regulatory incident / loss-event frequency reduction",
          range: {
            low: 0.15,
            high: 0.5,
            basis:
              "Relative reduction in regulatory incidents and control failures " +
              "where assurance is current, controls operate, and remediation is " +
              "durable vs a lagging, sample-based program",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in regulatory_incident_count and " +
            "repeat_finding_rate (expected-loss-avoided, probabilistic — not a " +
            "booked saving)",
        },
        {
          lever: "Evidence / assurance preparation effort reduction",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reduction in manual effort and elapsed time to assemble audit, " +
              "exam, and assurance evidence when it is continuously linked vs " +
              "scrambled per request",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in evidence-assembly effort/time feeding " +
            "time_to_remediate and open_audit_findings (efficiency, partially " +
            "bookable)",
        },
      ],
      timeToValueBand:
        "Common risk taxonomy + integrated register and a working policy/" +
        "attestation engine: 1-2 quarters to first usable single view. " +
        "Continuous controls monitoring, audit analytics, and third-party-risk " +
        "automation: 2-4 quarters to meaningful coverage on key controls and " +
        "critical vendors. Full three-lines continuous-assurance operating model " +
        "and ESG assurance-readiness across the estate: 12-24+ months, and the " +
        "risk-reduction value compounds slowly because it is realized as " +
        "incidents, fines, and restatements that do NOT happen.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Integrated GRC / risk & compliance platform",
          role:
            "System of record for the risk register, controls, policies, " +
            "compliance obligations, and issues — the spine the assurance " +
            "functions bind to and the source of the enterprise risk view.",
          examples: [
            "ServiceNow IRM/GRC",
            "Archer",
            "MetricStream",
            "AuditBoard",
            "LogicGate",
          ],
        },
        {
          name: "Internal-audit management platform",
          role:
            "Manages the audit universe, risk assessment, plan, fieldwork, " +
            "workpapers, findings, and follow-up — the third-line system of " +
            "record.",
          examples: [
            "AuditBoard",
            "TeamMate+",
            "Workiva (audit)",
            "Diligent (audit)",
          ],
        },
        {
          name: "Policy & training / attestation system",
          role:
            "Holds the policy lifecycle, version control, role-targeted " +
            "attestation, and mandatory-training completion — the evidentiary " +
            "trail of who was put on notice of which obligation.",
          examples: [
            "NAVEX (PolicyTech / EthicsPoint)",
            "Convercent",
            "LMS-integrated compliance training (Cornerstone, Workday Learning)",
          ],
        },
        {
          name: "Third-party / vendor-risk-management platform",
          role:
            "Inventories third parties, runs assessments and tiering, and " +
            "monitors vendor risk over the lifecycle — the source for " +
            "third-party-risk coverage.",
          examples: [
            "ProcessUnity",
            "Prevalent",
            "OneTrust (third-party risk)",
            "ServiceNow VRM",
          ],
        },
        {
          name: "ESG / sustainability reporting platform",
          role:
            "Collects, calculates, and reports sustainability metrics and " +
            "maps them to disclosure frameworks and the materiality assessment " +
            "— the (often immature) source for ESG disclosure and assurance.",
          examples: [
            "Workiva ESG",
            "Watershed",
            "Persefoni",
            "Microsoft Sustainability Manager",
          ],
        },
      ],
      roles: [
        {
          title: "Chief Risk Officer (CRO)",
          accountability:
            "Owns the enterprise risk management framework, the risk register, " +
            "risk appetite and KRIs, and second-line oversight and challenge of " +
            "risk-taking across the enterprise.",
        },
        {
          title: "Chief Compliance Officer (CCO)",
          accountability:
            "Owns regulatory compliance, the policy program, training and " +
            "attestation, regulatory-change management, and the relationship " +
            "with regulators on compliance matters.",
        },
        {
          title: "Chief Audit Executive (CAE) / Head of Internal Audit",
          accountability:
            "Owns independent third-line assurance — the audit plan, fieldwork, " +
            "findings and follow-up — reporting functionally to the audit " +
            "committee to protect independence.",
        },
        {
          title: "Controller / SOX lead",
          accountability:
            "Owns internal control over financial reporting — control design, " +
            "testing, deficiency evaluation and remediation — and increasingly " +
            "the disclosure controls extending to ESG.",
        },
        {
          title: "Audit committee of the board",
          accountability:
            "Provides board-level oversight of risk, control, compliance, and " +
            "audit; receives findings and the enterprise risk view and holds " +
            "management accountable for remediation.",
        },
        {
          title: "Chief Sustainability Officer (CSO) / ESG controller",
          accountability:
            "Owns sustainability strategy and ESG disclosure, the materiality " +
            "assessment, and ESG data quality and assurance-readiness as the " +
            "disclosure bar rises.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Sarbanes-Oxley (SOX) / internal control over financial reporting",
          relevance:
            "Requires management to assess and external auditors to attest to " +
            "the operating effectiveness of internal controls over financial " +
            "reporting — the legal driver of the design-vs-operating distinction " +
            "and most key-control testing.",
        },
        {
          name: "COSO ERM & COSO Internal Control / ISO 31000",
          relevance:
            "The dominant frameworks for enterprise risk management and " +
            "internal control — they structure the risk taxonomy, the control " +
            "framework, risk appetite, and the assessment methodology most " +
            "programs adopt.",
        },
        {
          name: "IIA International Standards & the Three Lines Model",
          relevance:
            "The professional standards for internal audit and the operating " +
            "model separating risk ownership, oversight, and independent " +
            "assurance — the spine of how the assurance functions are organized.",
        },
        {
          name: "CSRD / ISSB / SEC climate (ESG disclosure & assurance)",
          relevance:
            "The rising regulatory bar for sustainability disclosure and its " +
            "assurance — moving ESG from voluntary narrative to controlled, " +
            "assured, filed data and driving the ESG data-quality and " +
            "assurance-readiness agenda.",
        },
      ],
      canonicalTerms: [
        {
          term: "Key risk / key control",
          definition:
            "The risks material enough to demand active management and the " +
            "controls that most reduce them — the focus of risk-proportionate " +
            "assurance, so scarce testing and audit effort concentrate where it " +
            "matters rather than spreading evenly.",
        },
        {
          term: "Design vs operating effectiveness",
          definition:
            "Two distinct control states: a control properly designed to " +
            "address a risk, and a control demonstrably operating as designed " +
            "over the period. SOX requires both; collapsing them into 'we have a " +
            "control' is the core honesty gap.",
        },
        {
          term: "Three lines model",
          definition:
            "The IIA operating model: first line owns and manages risk in the " +
            "business, second line (risk/compliance) provides oversight and " +
            "challenge, third line (internal audit) provides independent " +
            "assurance.",
        },
        {
          term: "Risk appetite & KRI",
          definition:
            "The board-stated amount of risk the enterprise will accept, " +
            "operationalized through key risk indicators with thresholds that " +
            "warn before a limit is breached — appetite as a control, not a " +
            "document.",
        },
        {
          term: "Repeat finding",
          definition:
            "A finding that recurs after a prior one was supposedly remediated " +
            "or accepted — the clearest signal that remediation was cosmetic or " +
            "the root cause was untouched.",
        },
        {
          term: "Limited vs reasonable assurance",
          definition:
            "Two levels of external assurance: limited assurance gives only " +
            "negative comfort ('nothing came to our attention'), reasonable " +
            "assurance is the higher, positive-opinion bar financial statements " +
            "carry — most ESG disclosure sits at limited or none.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Control operating effectiveness / SOX control health",
        authoritativeSource:
          "Control-testing workpapers / GRC control-test results joined to the " +
          "key-control register, with tester independence and evidence trail",
        whatGoodEvidenceLooksLike:
          "Per key control: a documented test of operating effectiveness over " +
          "the period, sample or population basis, result, and any deficiency " +
          "with severity — traceable to an independent tester, not a self-" +
          "assessment.",
        weakEvidenceToReject:
          "A control inventory or a self-assessment asserting controls 'are in " +
          "place' with no operating-effectiveness test, no evidence trail, and " +
          "no independence shown.",
      },
      {
        claim: "Audit finding backlog, remediation, and repeat rate",
        authoritativeSource:
          "Internal-audit / issue-management workflow with raised-to-closed " +
          "timestamps, severity, due dates, verification, and recurrence linkage",
        whatGoodEvidenceLooksLike:
          "Open findings by severity and age, on-time-remediation rate, and a " +
          "repeat-finding rate computed from linked recurrences — with closure " +
          "verified independently of management assertion.",
        weakEvidenceToReject:
          "A single 'we closed our findings' or an open-count with no aging, no " +
          "severity, no on-time/repeat breakdown, and closures asserted by " +
          "management without verification.",
      },
      {
        claim: "Policy, training, and attestation compliance",
        authoritativeSource:
          "Policy-management and LMS records joined to the required-population " +
          "roster and the current policy versions",
        whatGoodEvidenceLooksLike:
          "Completion and attestation rates against the correct required " +
          "population and current policy versions, with laggards identifiable " +
          "(especially in high-risk roles) and a clear due-date basis.",
        weakEvidenceToReject:
          "A headline completion percentage with no population denominator, no " +
          "version control, or attestations against superseded policies " +
          "presented as current compliance.",
      },
      {
        claim: "Third-party / vendor risk coverage and status",
        authoritativeSource:
          "Third-party-risk-management platform assessment status joined to the " +
          "vendor master, criticality classification, and contract/spend",
        whatGoodEvidenceLooksLike:
          "Per in-scope vendor: a current risk assessment, a risk tier, and " +
          "reassessment cadence, with coverage measured against the full " +
          "critical-vendor population including the long tail.",
        weakEvidenceToReject:
          "A count of assessed vendors with no denominator of in-scope " +
          "vendors, no currency/reassessment date, or coverage claimed on a " +
          "subset that excludes the long tail.",
      },
      {
        claim: "ESG / sustainability metric and its assurance level",
        authoritativeSource:
          "ESG reporting platform with metric methodology, data lineage, " +
          "documented assumptions, and the external assurance engagement record",
        whatGoodEvidenceLooksLike:
          "A disclosed ESG metric with traceable lineage to source data, " +
          "documented estimation methodology and assumptions, and an explicit " +
          "assurance level (none / limited / reasonable) mapped to materiality.",
        weakEvidenceToReject:
          "An ESG figure presented as fact with no lineage, undocumented " +
          "estimation, no stated assurance level, or implying audit-grade " +
          "assurance the metric does not actually carry.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Is risk/compliance brought in early as a partner that lets the business move confidently, or late as a gate — and how does the organization actually talk about the function's value?",
      "For your key controls, what share are actually tested for operating effectiveness (not just documented), and how often do test results contradict the self-assessment?",
      "How current is your assurance — how long between a control failing and audit finding it — and what share of this year's findings are repeats of prior ones?",
      "What share of your top risks have monitored, threshold-bearing KRIs, and what happens operationally when a risk-appetite threshold is breached?",
      "What share of your in-scope third parties have a current risk assessment and tier — including the long tail, not just the obvious critical vendors?",
      "For the ESG metrics you disclose, where does the data come from, how much is estimated, and what level of independent assurance sits over it relative to the regulation you're now subject to?",
      "Can you produce one current, reconciled enterprise view of your top risks and the health of the controls over them — or is it stitched together by hand each cycle?",
      "How much of your control testing and evidence collection is manual and sample-based — and if a regulator asked tomorrow for full evidence on a key control, how long would it take?",
    ],
    maturitySignals: [
      "Assurance is risk-proportionate against a recognized frame (COSO/ISO 31000) — effort concentrates on key risks and key controls, and the function is experienced as an enabler, not just a brake.",
      "Key controls are continuously monitored against full populations, so control assurance is current rather than a backward-looking annual sample, and the design-vs-operating gap is actively closed.",
      "Findings are remediated on time at the root cause, with a low and falling repeat-finding rate and independently-verified closure.",
      "Risk appetite is operationalized into monitored KRIs and enforced limits with a defined response to breaches — appetite as a control, not a board document.",
      "Risk, compliance, SOX, audit, vendor-risk, and ESG share one taxonomy and one GRC backbone, so the enterprise risk view is a query and ESG data is on a governed, assurance-ready pipeline.",
    ],
    redFlags: [
      "The function is engaged after decisions are made and described in budget reviews as overhead — brought in late and routed around when inconvenient.",
      "A large control inventory with only a fraction tested for operating effectiveness, and self-assessments that contradict test results — controls on paper, not operating.",
      "A high or rising repeat-finding rate with findings closed by management assertion — fixes are cosmetic and root causes go untouched.",
      "Risk appetite stated by the board but disconnected from KRIs and limits, with breaches tracked nowhere or drawing no response.",
      "ESG metrics owned in spreadsheets with no lineage, heavily estimated, and unassured while going into regulated filings under a rising disclosure bar.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Integrated GRC platforms (ServiceNow IRM, Archer, MetricStream, AuditBoard, LogicGate)",
        category: "Enterprise GRC — risk register, controls/SOX, policy, compliance, issues, vendor-risk",
        switchingCost:
          "High — the risk taxonomy, control library, workflows, and years of accumulated assessments, test results, and evidence are configured into the platform; migrating that governance state, not the license, is the real cost.",
        renewalDynamics:
          "Sticky multi-module suites where each added module deepens lock-in; negotiate at suite level, watch module-creep pricing, and secure data-and-evidence export rights before consolidating onto one platform.",
      },
      {
        vendorName: "Internal-audit management tools (AuditBoard, TeamMate+, Workiva, Diligent)",
        category: "Audit universe, planning, workpapers, findings, and follow-up",
        switchingCost:
          "Moderate-to-high — audit history, workpaper templates, and the finding-tracking trail accrete; the methodology and history are the asset, the tool is replaceable with migration effort.",
        renewalDynamics:
          "Often converging with the broader GRC suite (AuditBoard, Workiva) — leverage the consolidation question, but verify auditor-independence and access-segregation are preserved in a combined platform.",
      },
      {
        vendorName: "Policy, training & ethics-line vendors (NAVEX, Convercent, LMS-integrated)",
        category: "Policy lifecycle, attestation, mandatory training, and whistleblower/ethics line",
        switchingCost:
          "Moderate — the policy corpus and attestation history are portable with effort, but the version-controlled trail of who attested to what is sensitive and disruptive to migrate.",
        renewalDynamics:
          "Per-employee/seat pricing common; negotiate against active population and bundle policy with training where it lowers total cost, and require attestation-history export.",
      },
      {
        vendorName: "Third-party-risk and ESG platforms (ProcessUnity, Prevalent, OneTrust; Workiva ESG, Watershed, Persefoni)",
        category: "Vendor-risk assessment/monitoring and ESG data collection, calculation, and disclosure",
        switchingCost:
          "Low-to-moderate — newer, fast-moving categories with portable data; the asset is the assessment/methodology library and the data lineage, so contract for export and methodology transfer.",
        renewalDynamics:
          "Immature, rapidly-evolving categories (especially ESG) racing to keep pace with regulation; favor short terms and regulatory-coverage commitments (CSRD/ISSB mappings kept current) over multi-year lock-in.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the integrated GRC backbone (and the internal-audit history fused to it): the risk taxonomy, control library, and accumulated assessment, test, and evidence state are far stickier than the license. Policy/attestation history is sensitive but portable; third-party-risk and ESG tooling is the most replaceable, but ESG methodology and data lineage are the asset to protect. The negotiable frontier is the consolidation decision (one suite vs best-of-breed), regulatory-coverage currency in the fast-moving compliance and ESG layers, and evidence/data-export rights so governance state is never held hostage at renewal.",
    negotiationLevers: [
      "Negotiate GRC at suite level against module-creep, since each added module deepens lock-in — and price to actual scope (key controls, in-scope entities), not a flat enterprise fee",
      "Require data-, evidence-, and audit-history export and portability rights so the accumulated governance state is not held hostage at renewal",
      "Demand regulatory-coverage currency commitments (SOX, CSRD/ISSB, sector rules kept mapped) in the fast-moving compliance and ESG layers, and favor short terms there over multi-year lock-in",
      "For ESG and third-party-risk (immature categories), pilot-to-scale gating and methodology-transfer terms before enterprise commitment",
      "Verify auditor-independence and access-segregation are contractually preserved when consolidating audit into a combined GRC suite",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      control_effectiveness_claim: [
        "operating-effectiveness test result over the period (not just design)",
        "tester independence and evidence trail",
        "deficiency severity where the control failed",
      ],
      audit_finding_claim: [
        "open findings by severity and age",
        "on-time-remediation and repeat-finding rates",
        "independently-verified closure (not management assertion)",
      ],
      compliance_claim: [
        "completion/attestation rate against the correct required population",
        "current policy versions and a due-date basis",
        "laggard identification, especially in high-risk roles",
      ],
      third_party_risk_claim: [
        "current risk assessment and tier per in-scope vendor",
        "coverage denominator including the long tail",
        "reassessment cadence / currency date",
      ],
      esg_claim: [
        "data lineage to source and documented estimation methodology/assumptions",
        "explicit assurance level (none / limited / reasonable)",
        "mapping to the materiality assessment and disclosure framework",
      ],
      value_projection: [
        "baseline metric (finding load / incident count / testing effort)",
        "benchmark planning-range",
        "explicit haircut factors (probabilistic risk-avoidance, remediation lag, design-vs-operating, ESG immaturity)",
        "framing as risk-reduction plus efficiency, not booked revenue",
      ],
    },
    citationStandard:
      "Risk/compliance/audit claims cite the GRC/audit/policy/vendor/ESG source, " +
      "the specific risk, control, finding, vendor, or metric, its severity or " +
      "tier, and the period. Control claims cite an operating-effectiveness test " +
      "and the tester's independence — never a design-only or self-assessed 'we " +
      "have a control'. Finding claims cite aging, severity, and independently-" +
      "verified closure — never an asserted 'closed'. ESG claims cite lineage, " +
      "estimation methodology, and the explicit assurance level — never an ESG " +
      "figure implying assurance it does not carry. Value projections cite a " +
      "baseline plus a labelled planning range and the haircut factors applied, " +
      "framed as probabilistic risk reduction plus efficiency — never a single " +
      "asserted hard-dollar ROI from avoided fines or incidents.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no integrated risk view or tested-control population — frame control health and risk coverage as an industry pattern, not their measured number.",
      "A hard-dollar ROI is requested — anchor the bookable case on the efficiency levers (testing/audit/evidence automation) and model the risk-reduction prize as probabilistic expected-loss-avoided, hedged heavily.",
      "Control coverage is asserted from a framework or self-assessment — flag that operating-effectiveness testing and tester independence are needed before relying on it.",
      "ESG metrics or value are cited — flag the data-quality and assurance immaturity and the assurance level before treating any ESG figure as audit-grade.",
      "Findings are reported as closed in aggregate — flag that aging, repeat rate, and independently-verified closure are needed before crediting remediation.",
      "Vendor-reported GRC/compliance coverage is cited — mark as a provider claim pending tenant validation.",
    ],
    inferenceLanguage: [
      "Across enterprises at this scale, the gap between documented controls and tested-and-operating controls typically runs...",
      "Without your per-finding aging and repeat rate, the industry pattern is that on-time remediation and repeat findings tend to...",
      "Peer programs commonly see control-testing and audit effort fall by... once continuous monitoring and analytics replace periodic sampling...",
      "ESG disclosure at this maturity is usually unassured or limited-assurance — treat any ESG-linked figure as carrying materially more uncertainty than the financials.",
      "This is a probabilistic risk-reduction figure (expected-loss-avoided), not a booked saving — treat it as a planning range, not your measured outcome.",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI or hard saving from avoided fines, incidents, or restatements for this tenant",
      "This tenant's actual control pass rate, finding backlog, repeat rate, or regulatory-incident count",
      "A claim that a specific control is operating effectively, a finding is durably remediated, or the firm is compliant — without per-item tested evidence",
      "An assertion that an ESG metric is accurate or assured beyond the assurance level it actually carries",
      "A claim that the third-party population is fully assessed with no unassessed long tail",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "enterprise risk exposure / which risks and controls are weakest",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Risk heatmap of top risks by likelihood × impact (or risk tier × control gap) to show where assurance attention must concentrate.",
    },
    {
      questionPattern:
        "control coverage and health / design vs operating gaps",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      chartBuilder: "stackedBar",
      note: "Stacked bar of key controls split by status (tested-passing / tested-failing / designed-untested) by risk area to expose where operating effectiveness is unproven.",
    },
    {
      questionPattern:
        "finding backlog and remediation aging / are we fixing what we find",
      exhibitKind: "chart",
      chartKind: "bar",
      chartBuilder: "bar",
      note: "Open findings by severity and age bucket (with on-time and repeat-finding overlays) to show whether remediation is keeping pace and durable.",
    },
    {
      questionPattern:
        "value sensitivity / which haircut bites the assurance case hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of probabilistic risk-avoidance, remediation-lag, design-vs-operating, and ESG-immaturity haircuts on realized value.",
    },
    {
      questionPattern: "enterprise risk & compliance scorecard",
      exhibitKind: "table",
      note: "Open findings, on-time remediation, control pass rate, KRI coverage, training/attestation rates, third-party coverage, repeat-finding rate, risk-appetite breaches, ESG assurance level, and regulatory incidents vs planning ranges.",
    },
    {
      questionPattern: "audit / regulatory evidence pack for a key control or finding",
      exhibitKind: "table",
      note: "Per control or finding: risk linkage, test/result, severity, owner, remediation status and due date, verification, and recurrence — the assembled evidence pack.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Assurance is risk-proportionate — scarce testing, audit, and policy effort concentrates on key risks and key controls rather than treating everything as equal",
      "The function is positioned as an enabler that lets the business move confidently, with a seat early in decisions rather than a late gate",
      "Continuous controls monitoring and audit analytics make assurance current, so the lag between a control failing and audit finding it shrinks",
      "Remediation fixes root causes with independently-verified closure, driving a low and falling repeat-finding rate",
      "One taxonomy and one GRC backbone give a single enterprise risk view, and ESG data is moved onto a governed, assurance-ready pipeline",
    ],
    failureDrivers: [
      "The function stays a late-stage cost/blocker — under-funded, routed around, and unable to prove its avoided-loss value, so it loses influence",
      "Controls remain designed on paper but untested or weakly tested, so the framework overstates protection until an incident or a regulator exposes the gap",
      "Findings lag and repeat — closed by management assertion without fixing root causes — so assurance is backward-looking and confidence erodes",
      "Risk appetite stays a board document disconnected from KRIs and limits, so it never constrains actual risk-taking",
      "ESG disclosure outruns immature, unassured data, creating a misstatement and credibility exposure as the regulatory bar rises",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "SOX-regulated control testing and financial-reporting controls adopt " +
      "automation first because the discipline, the mandate, and the data are " +
      "already there — continuous monitoring extends an existing practice. " +
      "Audit analytics and regulatory-change and third-party-risk automation " +
      "follow as the function proves capacity gains. The hardest and latest " +
      "adoption is genuine risk-appetite operationalization (KRIs that bite) and " +
      "ESG assurance-readiness, because the data is immature and the cultural " +
      "shift — from box-ticking and 'department of no' to a current, enabling, " +
      "risk-proportionate partner — is what actually limits the pace, more than " +
      "the technology.",
    roiClarity: "low",
    roiClarityBasis:
      "ROI clarity is low and the honest expert says so. The dominant benefit — " +
      "fines, enforcement, restatements, litigation, and reputational loss " +
      "AVOIDED — is probabilistic and counterfactual: you are valuing events " +
      "that did not happen, which finance will not book as a hard saving, in a " +
      "function already viewed as overhead. There IS a defensible hard-dollar " +
      "case on the efficiency levers (automating control testing, audit, " +
      "evidence, vendor assessment, and policy/regulatory tracking), but it is " +
      "modest next to the risk story. Three structural discounts deepen the " +
      "uncertainty: audit findings lag the live state, controls are often " +
      "designed rather than operating, and ESG data assurance is immature. So " +
      "ROI is sized as efficiency plus probabilistic risk reduction, hedged " +
      "heavily, and never promised as a hard-dollar return on avoided fines or " +
      "incidents.",
  },

  regulatoryFrame: {
    name: "SOX, COSO ERM/Internal Control, ISO 31000, IIA Three Lines & CSRD/ISSB/SEC (ESG)",
    relevance:
      "The dominant regulatory and standards frame for this expert: SOX " +
      "mandates assessed-and-attested internal control over financial reporting " +
      "(the design-vs-operating distinction and most key-control testing); COSO " +
      "ERM/Internal Control and ISO 31000 supply the risk and control " +
      "frameworks, taxonomy, and appetite methodology; the IIA Standards and " +
      "Three Lines Model define internal-audit independence and the assurance " +
      "operating model; and CSRD / ISSB / SEC climate set the rising ESG " +
      "disclosure-and-assurance bar. Sector and conduct rules (anti-bribery/FCPA, " +
      "privacy, sector supervisors) bind specific compliance obligations (see " +
      "vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (shared-svcs)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
