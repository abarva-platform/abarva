#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputPath = process.argv[2];
if (!outputPath) {
  throw new Error(
    "Usage: generate-ams-rfp-requirement-matrix.mjs <output.csv>",
  );
}

const sections = [
  {
    family: "service_scope",
    category: "service scope",
    title: "Service scope and accountability",
    criterion: "service_capability",
    responseType: "Evidence",
    requirements: [
      "Confirm end-to-end accountability for the 48 in-scope analytics applications, including the named service boundary for each application and interface.",
      "Map every in-scope application to L1, L2, L3, enhancement, release, data-pipeline, reporting, and platform-support responsibilities using a completed responsibility matrix.",
      "Define the boundary between base run service, minor enhancement, project work, and chargeable change order, including at least five worked classification examples.",
      "Describe 24x7 support coverage for Tier 1 services and business-hours coverage for lower tiers, with escalation ownership and handoff controls.",
      "Commit to absorbing recurring incident and service-request categories into the base service when they meet the agreed recurrence threshold.",
      "Provide a tower-by-tower service catalogue with measurable units, inclusions, exclusions, dependencies, and the commercial treatment of volume movement.",
      "Explain how shared platform work is allocated across applications without double charging or creating orphan responsibilities.",
      "Identify all subcontracted or affiliate-delivered scope and state which contractual obligations remain with the prime supplier.",
      "Describe optional services the buyer may activate during the term, including activation lead time and unit-price basis.",
      "List buyer-retained activities and the minimum buyer capacity assumed for successful service delivery.",
    ],
  },
  {
    family: "service_management",
    category: "service management",
    title: "Service management and operating controls",
    criterion: "service_capability",
    responseType: "Evidence",
    requirements: [
      "Provide the incident, problem, change, request, release, knowledge, and configuration-management operating model, including accountable roles and system-of-record fields.",
      "Define severity assignment rules and demonstrate how supplier and buyer classifications are reconciled before SLA measurement begins.",
      "Commit to problem records for repeat incidents and to root-cause analysis within the specified time by severity.",
      "Describe major-incident command, communications cadence, executive escalation, and post-incident review deliverables.",
      "Provide the change-success, emergency-change, rollback, and failed-release controls used for the in-scope estate.",
      "Explain how the supplier will maintain knowledge articles, known-error records, runbooks, and operational procedures through transition and steady state.",
      "Provide a sample monthly service report that reconciles ticket volumes, SLA clocks, exclusions, reopenings, backlog aging, and credits.",
      "Describe integration with the buyer's ITSM platform, including required fields, APIs, retention, access controls, and audit export.",
      "State the proposed continuous-service-improvement backlog method and how benefits are verified before closure.",
      "Identify the service-management tooling assumptions that would change price, staffing, or implementation duration.",
    ],
  },
  {
    family: "staffing",
    category: "staffing and location",
    title: "Staffing, skills, and location model",
    criterion: "service_capability",
    responseType: "Staffing",
    requirements: [
      "Provide named-role staffing by service tower, skill, grade, location, shift, productive FTE, and month for transition and steady state.",
      "State the onshore, nearshore, and offshore mix by role and identify all roles that may not be moved offshore without buyer approval.",
      "Provide loaded annual cost and bill rate by role, plus the proposed blended rate and reconciliation to the commercial schedule.",
      "Identify key personnel, minimum experience, certifications, replacement controls, and buyer interview or approval rights.",
      "Commit to vacancy, attrition, backfill, knowledge-transfer, and overlap service levels with defined remedies.",
      "Demonstrate that staffing capacity reconciles to the supplied ticket, batch, report, release, and enhancement volumetrics rather than a top-down FTE estimate.",
      "Explain shift coverage, on-call rotations, holiday coverage, surge capacity, and fatigue controls for critical services.",
      "Provide the productivity assumptions used to reduce effort over the term and show which roles or activities change in each year.",
      "Describe workforce continuity protections for transition, including rebadging, incumbent knowledge retention, and critical-skill concentration.",
      "List optional skill pools and rate-card roles that are not included in the committed base service.",
    ],
  },
  {
    family: "sla",
    category: "SLA and performance",
    title: "SLA, KPI, and service-credit regime",
    criterion: "service_capability",
    responseType: "SLA / KPI",
    requirements: [
      "Accept the issued SLA definitions, measurement sources, service hours, pause rules, exclusions, and monthly calculation method, or disclose each exception explicitly.",
      "Commit to automatic calculation and application of earned service credits without requiring a separate buyer claim.",
      "Provide proposed targets and credits for incident response, incident restoration, batch completion, report timeliness, data quality, change success, and backlog aging.",
      "State aggregate and per-SLA credit caps and confirm that chronic failure, earn-back, and termination rights operate independently of the monthly cap.",
      "Define chronic-failure thresholds and the buyer remedies triggered by repeated misses across rolling measurement periods.",
      "Provide twelve months of comparable-client performance for the proposed delivery unit using the same metric definitions as the response.",
      "Explain the reconciliation process for disputed clocks, exclusions, force-majeure claims, buyer-caused delays, and missing source records.",
      "Describe executive service-health reporting that links SLA outcomes to affected applications, business processes, and root causes.",
      "Propose leading operational indicators that predict SLA failure before the contractual metric is missed.",
      "List any metric for which the supplier cannot provide system-generated measurement and state the interim control.",
    ],
  },
  {
    family: "transition",
    category: "transition",
    title: "Transition and transformation",
    criterion: "transition",
    responseType: "Transition",
    requirements: [
      "Provide a week-by-week transition plan from notice to service commencement with workstreams, milestones, owners, dependencies, entry criteria, exit criteria, and acceptance evidence.",
      "Define discovery, knowledge capture, shadow, reverse-shadow, parallel-run, cutover, and stabilization activities for every service tower.",
      "Map the 48 applications into transition waves using criticality, dependency, batch-calendar, release-calendar, and knowledge-risk evidence.",
      "State the transition fee, payment milestones, amounts at risk, and commercial remedy for supplier-caused milestone delay.",
      "Provide a quantified knowledge-transfer plan covering runbooks, code, jobs, interfaces, reports, operational contacts, credentials, and known errors.",
      "Identify incumbent dependencies and describe the contingency if incumbent resources, documentation, or access are late or incomplete.",
      "Provide cutover and rollback decision rights, business blackout constraints, and hypercare staffing by transition wave.",
      "Describe the Day 1 control environment for privileged access, change control, incident response, data handling, and service reporting.",
      "Provide a transition risk register with probability, impact, mitigation, owner, trigger, and residual-risk fields.",
      "State the earliest credible service-commencement date and the assumptions that could move it.",
    ],
  },
  {
    family: "security",
    category: "security and compliance",
    title: "Security, privacy, and compliance",
    criterion: "risk",
    responseType: "Security",
    requirements: [
      "Confirm compliance with the buyer's security schedule, healthcare privacy obligations, data-classification controls, and breach-notification timeframes.",
      "Describe privileged-access management, joiner-mover-leaver controls, segregation of duties, emergency access, and quarterly recertification.",
      "Provide the delivery-location and data-access model, including restrictions on production data, screenshots, logs, downloads, and removable media.",
      "Describe vulnerability, patch, endpoint, malware, secrets, certificate, and dependency-management controls for supported platforms.",
      "Provide evidence of independent security assurance and identify all material exceptions, remediation dates, and compensating controls.",
      "Explain security-incident integration with the buyer, including detection sources, triage, evidence preservation, regulatory support, and root-cause reporting.",
      "Describe secure software-development and release controls for enhancements, scripts, data pipelines, reports, and automation.",
      "List subcontractors and hosting locations that may access buyer systems or data and state how flow-down obligations are enforced.",
      "Provide the proposed audit-evidence calendar and retention period for access, change, incident, vulnerability, and compliance records.",
      "Identify any buyer policy requirement the supplier cannot meet at service commencement and the dated remediation plan.",
    ],
  },
  {
    family: "architecture",
    category: "architecture and tooling",
    title: "Architecture, platforms, and tooling",
    criterion: "service_capability",
    responseType: "Evidence",
    requirements: [
      "Provide an architecture view connecting each in-scope application to data stores, interfaces, batch dependencies, reporting tools, cloud services, and monitoring controls.",
      "Describe support for the mixed SQL Server, SAS, Tableau, Power BI, SSIS, AWS, and Databricks estate and identify unsupported versions or specialist dependencies.",
      "Define CMDB reconciliation, dependency mapping, ownership, and data-quality controls for the in-scope configuration items.",
      "Describe observability coverage for application, integration, database, batch, report, and cloud-consumption failure modes.",
      "Explain how supplier tools integrate with the buyer's ITSM, monitoring, CI/CD, identity, security, and evidence-retention platforms.",
      "Provide a tooling responsibility and license matrix identifying included licenses, buyer-provided licenses, usage limits, and exit obligations.",
      "Describe environment management, release orchestration, test-data controls, and production deployment approvals.",
      "State how technical debt, unsupported components, resilience gaps, and end-of-life risks are identified, prioritized, and governed.",
      "Propose architecture rationalization opportunities but separate committed run-service obligations from optional transformation work.",
      "List technical prerequisites that are not included in the commercial proposal and quantify any expected buyer investment.",
    ],
  },
  {
    family: "automation",
    category: "automation and productivity",
    title: "Automation and productivity commitments",
    criterion: "productivity",
    responseType: "Evidence",
    requirements: [
      "Provide a three-year productivity glide path by service tower, with baseline units, committed reductions, timing, accountable initiatives, and price realization.",
      "Identify automation candidates from the supplied ticket and batch evidence and quantify the addressable volume without treating it as realized value.",
      "Commit that verified automation benefits reduce the buyer's charge through unit-rate, resource-unit, or volume-band adjustments.",
      "Provide benefit-calculation formulas, source-system fields, baselines, exclusions, validation owners, and finance-confirmation gates for each productivity claim.",
      "Describe automation governance for design approval, security, testing, rollback, monitoring, ownership, and intellectual-property rights.",
      "State minimum annual productivity commitments and the credits or price adjustments triggered if the commitment is missed.",
      "Differentiate supplier-funded continuous improvement from separately chargeable transformation and enhancement work.",
      "Provide three comparable managed-services examples with baseline, intervention, measured outcome, elapsed time, and client-verifiable evidence.",
      "Describe how AI-assisted operations will be controlled for accuracy, data use, human approval, explainability, and auditability.",
      "List productivity ideas excluded from the committed price and the evidence needed before they could become binding.",
    ],
  },
  {
    family: "pricing",
    category: "commercial and pricing",
    title: "Commercial and pricing response",
    criterion: "price",
    responseType: "Pricing",
    requirements: [
      "Complete the issued pricing schedule with annual and monthly charges by service tower, resource pool, unit, location, transition, tooling, and optional service.",
      "Reconcile the total annual price to staffing quantities, loaded role rates, service units, transition charges, and all other cost components without unexplained residuals.",
      "Provide volume bands and downward price flex for ticket, batch, report, application, and enhancement volumes, including dead bands and rebasing rules.",
      "State all indexation, COLA, foreign-exchange, tax, travel, pass-through, overtime, and third-party assumptions and the applicable caps.",
      "Provide transition pricing separately and identify amounts at risk against milestone acceptance and stabilization outcomes.",
      "Commit to open-book audit rights for pass-through costs, subcontractor charges, consumption charges, and gainshare calculations.",
      "Price termination assistance, extension periods, data export, knowledge transfer, and exit support using capped rates available throughout the term.",
      "Identify every commercial exception and quantify its expected price impact using the issued baseline assumptions.",
      "Provide a three-year total-contract-value schedule with invoice timing, credits, rebates, one-time charges, and committed productivity reductions.",
      "List optional innovation or transformation offers separately from the compliant base bid so they do not distort normalized comparison.",
    ],
  },
  {
    family: "governance",
    category: "governance",
    title: "Governance, reporting, and decision rights",
    criterion: "service_capability",
    responseType: "Narrative",
    requirements: [
      "Provide the operational, tactical, executive, commercial, risk, security, architecture, and continuous-improvement governance forums with cadence and decision rights.",
      "Define the supplier and buyer RACI for service acceptance, SLA disputes, change approval, security incidents, demand prioritization, and invoice certification.",
      "Provide sample operational, monthly, quarterly, and annual reports linked to the source systems and evidence retained for audit.",
      "Describe action, decision, issue, risk, dependency, and benefit registers, including aging, escalation, and closure evidence.",
      "Define the invoice-review process and how charges reconcile to staffing, service units, performance credits, change orders, and approved pass-throughs.",
      "Describe demand forecasting and quarterly rebasing across applications, ticket volumes, batch workloads, releases, and cloud consumption.",
      "State executive escalation paths and cure periods for service, staffing, security, transition, and commercial failure.",
      "Explain how the retained organization receives data access, analytical transparency, and the ability to independently reproduce material calculations.",
      "Provide the proposed first-100-day governance calendar and the deliverables due at each forum.",
      "Identify governance activities dependent on buyer resources and the effort assumed from each buyer role.",
    ],
  },
  {
    family: "value",
    category: "innovation and value",
    title: "Innovation, value, and contractual protections",
    criterion: "productivity",
    responseType: "Evidence",
    requirements: [
      "Provide a value plan separating price reduction, cost avoidance, recoverable leakage, productivity, service improvement, and optional transformation benefits.",
      "For every value claim, state the baseline, formula, data source, evidence owner, confidence, timing, dependencies, and finance-confirmation state.",
      "Commit to annual benchmarking rights with an independent benchmark process and a contractual remedy when pricing is materially above market.",
      "Accept termination-assistance, data portability, knowledge-transfer, step-in, audit, and transition-support protections that preserve buyer leverage.",
      "Provide a contractual mechanism that converts validated recurring change-order work into base scope or a capped service catalogue.",
      "Describe an innovation-fund or gainshare model that excludes benefits already funded through the base fee and prevents double counting.",
      "Provide a quarterly value register that ties initiatives to evidence, action owners, contractual mechanisms, realized cash impact, and finance approval.",
      "State which proposed benefits are committed, which are targets, which are illustrative, and which require additional buyer evidence.",
      "Describe the supplier's approach to modernization sequencing across the legacy analytics estate without compromising run-service accountability.",
      "List the three highest-value opportunities the supplier would validate during transition and the evidence required before any amount could be claimed.",
    ],
  },
];

const stageByFamily = {
  service_scope: "scope",
  service_management: "responses",
  staffing: "responses",
  sla: "rfp",
  transition: "rfp",
  security: "evaluation",
  architecture: "scope",
  automation: "evaluation",
  pricing: "pricing",
  governance: "responses",
  value: "bafo",
};

const rows = [];
let requirementNumber = 1;
for (const section of sections) {
  section.requirements.forEach((requirement, index) => {
    const requirementLevel =
      index < 5 ? "Mandatory" : index < 8 ? "Scored" : "Informational";
    rows.push({
      tenant_key: "meridian-health",
      contract_id: "MER-TECH-LAAMS-001",
      vendor_name: "Cognizant Technology Solutions",
      as_of_date: "2027-06-30",
      synthetic_policy: "synthetic_demo_only_not_client_truth",
      requirement_id: `REQ-LAAMS-${String(requirementNumber).padStart(3, "0")}`,
      stage: stageByFamily[section.family],
      requirement_family: section.family,
      rfp_section: section.title,
      requirement_category: section.category,
      requirement_text: requirement,
      requirement_level: requirementLevel,
      mandatory_flag: requirementLevel === "Informational" ? "false" : "true",
      response_type: section.responseType,
      evaluation_criterion_id: section.criterion,
      source_evidence_required:
        requirementLevel === "Informational" ? "false" : "true",
      dataset_version: "meridian-laams-new-event-rich-v2-20260908",
    });
    requirementNumber += 1;
  });
}

const headers = Object.keys(rows[0]);
const encode = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv =
  [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => encode(row[header])).join(","),
    ),
  ].join("\n") + "\n";
writeFileSync(resolve(outputPath), csv, "utf8");

const markdownOutputPath = process.argv[3];
if (markdownOutputPath) {
  const escapeCell = (value) =>
    String(value ?? "")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
  const matrixHeaders = [
    "Requirement ID",
    "Requirement category",
    "RFP section",
    "Requirement statement",
    "Requirement level",
    "Response type",
    "Evaluation criterion ID",
    "Evidence required",
  ];
  const matrix = [
    "## Requirement Response Matrix",
    "",
    "The following 110 rows are the controlled response and evaluation contract. Mandatory and scored rows must be complete before a proposal is evaluation-ready. Informational rows remain normalized for comparison but are not submission gates.",
    "",
    `| ${matrixHeaders.join(" | ")} |`,
    `| ${matrixHeaders.map(() => "---").join(" | ")} |`,
    ...rows.map(
      (row) =>
        `| ${[
          row.requirement_id,
          row.requirement_category,
          row.rfp_section,
          row.requirement_text,
          row.requirement_level,
          row.response_type,
          row.evaluation_criterion_id,
          row.source_evidence_required === "true" ? "Yes" : "No",
        ]
          .map(escapeCell)
          .join(" | ")} |`,
    ),
  ].join("\n");
  writeFileSync(resolve(markdownOutputPath), matrix + "\n", "utf8");
}

const counts = rows.reduce((acc, row) => {
  acc[row.requirement_level] = (acc[row.requirement_level] ?? 0) + 1;
  return acc;
}, {});
console.log(
  JSON.stringify(
    {
      outputPath: resolve(outputPath),
      markdownOutputPath: markdownOutputPath
        ? resolve(markdownOutputPath)
        : null,
      rows: rows.length,
      levels: counts,
    },
    null,
    2,
  ),
);
