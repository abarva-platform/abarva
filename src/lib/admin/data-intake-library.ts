import type {
  AdminControlStatus,
  AdminSetupControlResponse,
  AdminSetupControlSourceFile,
} from "@/lib/admin/setup-control";

export type AdminTemplateStatus =
  | "not-uploaded"
  | "uploaded"
  | "parsed"
  | "mapped"
  | "validated"
  | "candidate-ready"
  | "active";

export type AdminTemplateRequirement = "required" | "recommended" | "optional";

export interface AdminTemplateCatalogItem {
  id: string;
  name: string;
  family: "enterprise" | "technology" | "governance" | "module-pack";
  purpose: string;
  requirement: AdminTemplateRequirement;
  expectedOwner: string;
  acceptedFileTypes: string[];
  requiredFields: string[];
  exampleRowsAvailable: boolean;
  moduleImpact: string[];
  validationRules: string[];
  mappingTarget: string;
  readinessImpact: string;
  fileMatchTerms: string[];
}

export interface AdminTemplateCatalogViewItem extends AdminTemplateCatalogItem {
  status: AdminTemplateStatus;
  statusDetail: string;
  matchedSourceFiles: string[];
}

export interface AdminTemplateFieldDefinition {
  fieldName: string;
  description: string;
  requirement: "required" | "optional";
  acceptedValues: string;
  example: string;
  mappingTarget: string;
  validationRule: string;
  moduleImpact: string[];
}

export interface AdminTemplateArtifact {
  template: AdminTemplateCatalogItem;
  fields: AdminTemplateFieldDefinition[];
  sampleRows: Record<string, string>[];
  guideId: string;
  downloadFileName: string;
}

export interface AdminDataIntakeGuide {
  id: string;
  title: string;
  detail: string;
  stepCount: number;
  entryPoint: string;
}

export interface AdminDataIntakeLibraryView {
  catalog: AdminTemplateCatalogViewItem[];
  guides: AdminDataIntakeGuide[];
  guardrails: string[];
  statusCounts: Record<AdminTemplateStatus, number>;
}

const SHARED_FILE_TYPES = ["XLSX", "CSV"];
const MODULES_ALL = ["Home", "Intelligence", "Moves", "Source", "Tower"];

const TEMPLATE_GUIDE_BY_FAMILY: Record<AdminTemplateCatalogItem["family"], string> = {
  enterprise: "new-tenant-onboarding",
  governance: "new-tenant-onboarding",
  technology: "new-tenant-onboarding",
  "module-pack": "moves-program-setup",
};

const TEMPLATE_GUIDE_BY_ID: Record<string, string> = {
  "source-event-pack": "source-event-setup",
  "moves-program-pack": "moves-program-setup",
  "tower-outcome-pack": "tower-outcome-tracking",
  "vendors-contracts": "contract-optimization",
  "spend-value": "tower-outcome-tracking",
  "metric-definitions": "tower-outcome-tracking",
};

export const ADMIN_TEMPLATE_CATALOG: AdminTemplateCatalogItem[] = [
  {
    id: "enterprise-profile",
    name: "Enterprise Profile",
    family: "enterprise",
    purpose:
      "Capture the tenant profile, operating model, portfolio-company hierarchy, revenue scale, employee scale, and technology budget baseline.",
    requirement: "required",
    expectedOwner: "Corporate CIO office, CFO staff, enterprise architecture",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Enterprise or portfolio company",
      "Operating model",
      "Revenue",
      "Employees",
      "Technology budget",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: MODULES_ALL,
    validationRules: [
      "Every business entity needs a parent or portfolio-company classification.",
      "Financial values must include currency and scale.",
      "Executive-use fields require a named evidence source.",
    ],
    mappingTarget: "Tenant Packet, Evidence Registry, Canonical Facts",
    readinessImpact:
      "Sets the enterprise context used by Home and sizes follow-on decisions in Intelligence, Moves, Source, and Tower.",
    fileMatchTerms: ["enterprise", "profile", "company", "portfolio"],
  },
  {
    id: "business-functions",
    name: "Business Functions",
    family: "enterprise",
    purpose:
      "Map corporate and portfolio-company functions, owners, criticality, capabilities, and shared-services coverage.",
    requirement: "required",
    expectedOwner: "Business operations, shared services, finance transformation",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Company or unit",
      "Function name",
      "Executive owner role",
      "Capabilities",
      "Criticality",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Moves", "Tower"],
    validationRules: [
      "Each function must belong to a company or corporate shared-services unit.",
      "Critical functions require an owner role.",
      "Capabilities must be business-readable, not system field names.",
    ],
    mappingTarget: "Tenant Packet, Canonical Facts, Module Readiness",
    readinessImpact:
      "Improves answerability for operating-model, back-office transformation, and portfolio-company questions.",
    fileMatchTerms: ["business", "function", "capability"],
  },
  {
    id: "organization-ownership",
    name: "Organization / Ownership",
    family: "enterprise",
    purpose:
      "Identify executive roles, business owners, data owners, approval roles, and decision rights by entity and function.",
    requirement: "required",
    expectedOwner: "CHRO staff, CIO office, transformation office",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Company or unit",
      "Role title",
      "Named owner or placeholder role",
      "Decision right",
      "Function",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Moves", "Source"],
    validationRules: [
      "Approval roles must be distinguishable from informed stakeholders.",
      "Named people are optional; role titles are required.",
      "Every owner must connect to a function or system area.",
    ],
    mappingTarget: "Tenant Packet, Relationships, Promotion Gate",
    readinessImpact:
      "Lets AbarVa explain who must approve, certify, or own the next step.",
    fileMatchTerms: ["org", "organization", "ownership", "owner", "role"],
  },
  {
    id: "workforce-personas",
    name: "Workforce & Personas",
    family: "enterprise",
    purpose:
      "Describe workforce groups, user personas, work volume, location, role family, and process participation.",
    requirement: "recommended",
    expectedOwner: "HR operations, shared-services leads, process owners",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Persona",
      "Role family",
      "Company or function",
      "User count",
      "Work activity",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Moves", "Tower"],
    validationRules: [
      "Headcount and user counts must be labeled separately.",
      "Personas should describe work performed, not just job titles.",
      "Automation use cases require a work activity or volume field.",
    ],
    mappingTarget: "Canonical Facts, Derived Intelligence, Module Readiness",
    readinessImpact:
      "Supports workforce impact, adoption, and shared-services redesign questions.",
    fileMatchTerms: ["workforce", "persona", "user", "headcount"],
  },
  {
    id: "applications-systems",
    name: "Applications & Systems",
    family: "technology",
    purpose:
      "Capture applications, platforms, systems, owners, business functions, lifecycle, criticality, vendors, and integrations.",
    requirement: "required",
    expectedOwner: "Enterprise architecture, application owners, IT operations",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Application name",
      "Company or unit",
      "Business function",
      "Owner",
      "Criticality",
      "Lifecycle",
      "Vendor",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: MODULES_ALL,
    validationRules: [
      "Every application must map to a business function or shared platform.",
      "Portfolio-company applications must be distinguishable from corporate IT platforms.",
      "Critical systems require owner and lifecycle fields.",
    ],
    mappingTarget: "Canonical Facts, Relationships, Module Readiness",
    readinessImpact:
      "Improves system-specific answers, dependency mapping, vendor leverage, and Tower traceability.",
    fileMatchTerms: ["application", "applications", "systems", "cmdb", "platform"],
  },
  {
    id: "data-assets-integrations",
    name: "Data Assets & Integrations",
    family: "technology",
    purpose:
      "Map data products, integrations, interfaces, source systems, consuming systems, ownership, quality, and freshness.",
    requirement: "required",
    expectedOwner: "Data office, enterprise architecture, integration teams",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Data asset or integration",
      "Source system",
      "Target system",
      "Owner",
      "Freshness",
      "Quality status",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Moves", "Tower"],
    validationRules: [
      "Every integration must have a direction or source/target relationship.",
      "Data quality claims need source evidence.",
      "AI-readiness use cases require freshness and ownership fields.",
    ],
    mappingTarget: "Evidence Registry, Relationships, Derived Intelligence",
    readinessImpact:
      "Makes readiness, dependency, and data-quality gates visible before AI or automation is scaled.",
    fileMatchTerms: ["data", "integration", "interface", "api", "file transfer"],
  },
  {
    id: "vendors-contracts",
    name: "Vendors & Contracts",
    family: "technology",
    purpose:
      "Capture vendors, contracts, spend category, supported systems, term, renewal window, SLA obligations, and commercial owner.",
    requirement: "required",
    expectedOwner: "Procurement, vendor management, IT finance",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Vendor",
      "Contract or service",
      "Supported system",
      "Annual spend",
      "Renewal date",
      "Commercial owner",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Source", "Tower"],
    validationRules: [
      "Spend values must include currency and period.",
      "Renewal dates must not be inferred without evidence.",
      "Contracts should connect to systems, services, or functions.",
    ],
    mappingTarget: "Evidence Registry, Canonical Facts, Source readiness",
    readinessImpact:
      "Enables sourcing leverage, renewal-risk, vendor concentration, and run-cost questions.",
    fileMatchTerms: ["vendor", "contract", "supplier", "renewal", "procurement"],
  },
  {
    id: "spend-value",
    name: "Spend & Value",
    family: "enterprise",
    purpose:
      "Collect budget, run cost, initiative cost, committed value, proven value, benefit owner, and measurement evidence.",
    requirement: "required",
    expectedOwner: "CFO office, IT finance, value office",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Spend or value item",
      "Company or function",
      "Amount",
      "Currency",
      "Period",
      "Owner",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Moves", "Tower"],
    validationRules: [
      "Amounts must include currency, time period, and whether they are actual, budget, or estimate.",
      "Value claims require owner and evidence status.",
      "Directional assumptions must be labeled as assumptions.",
    ],
    mappingTarget: "Canonical Facts, Derived Intelligence, Tower outcome ledger",
    readinessImpact:
      "Separates budget visibility from finance-attested value and prevents ROI overclaiming.",
    fileMatchTerms: ["spend", "budget", "value", "roi", "cost", "finance"],
  },
  {
    id: "programs-initiatives",
    name: "Programs, Initiatives & Business Priorities",
    family: "enterprise",
    purpose:
      "Capture active programs, strategic priorities, initiative owners, stage, dependency, business case, and expected outcome.",
    requirement: "required",
    expectedOwner: "Transformation office, CIO office, strategy office",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Program or initiative",
      "Business priority",
      "Owner",
      "Stage",
      "Value hypothesis",
      "Dependency",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Intelligence", "Moves", "Tower"],
    validationRules: [
      "Every initiative must have an owner role and stage.",
      "Value hypotheses must be separated from proven outcomes.",
      "Dependencies should connect to systems, data, vendors, or roles when known.",
    ],
    mappingTarget: "Tenant Packet, Derived Intelligence, Moves readiness",
    readinessImpact:
      "Lets AbarVa shape decision paths and create Moves only from grounded initiative context.",
    fileMatchTerms: ["program", "initiative", "priority", "roadmap", "move"],
  },
  {
    id: "ai-initiatives",
    name: "AI Initiatives",
    family: "enterprise",
    purpose:
      "Track AI and automation use cases, value pool, readiness, risk, data dependency, model boundary, and scaling gate.",
    requirement: "recommended",
    expectedOwner: "CIO, CDAO, VP Innovation, AI governance council",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "AI initiative",
      "Business function",
      "Value pool",
      "Readiness gate",
      "Risk level",
      "Data dependency",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Intelligence", "Moves", "Tower"],
    validationRules: [
      "Value pools must be labeled as proven, committed, or directional.",
      "High-risk AI requires governance and data-readiness gates.",
      "Use cases must connect to a function, process, or system.",
    ],
    mappingTarget: "Derived Intelligence, Module Readiness, Promotion Gate",
    readinessImpact:
      "Powers scale/certify/fund-readiness/hold recommendations without treating assumptions as facts.",
    fileMatchTerms: ["ai", "automation", "copilot", "model", "agent"],
  },
  {
    id: "risks-controls",
    name: "Risks & Controls",
    family: "governance",
    purpose:
      "Capture enterprise risks, controls, control owners, audit evidence, open gaps, exceptions, and remediation dates.",
    requirement: "required",
    expectedOwner: "Risk, compliance, security, internal audit",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Risk or control",
      "Control owner",
      "Affected function",
      "Status",
      "Remediation",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Moves", "Source"],
    validationRules: [
      "Controls must have owners and status.",
      "Open risk must not be hidden by readiness scoring.",
      "Remediation dates require evidence or must be marked as planned.",
    ],
    mappingTarget: "Evidence Registry, Governance, Promotion Gate",
    readinessImpact:
      "Keeps governance, legal, security, and model-risk caveats visible in executive answers.",
    fileMatchTerms: ["risk", "control", "compliance", "audit", "security"],
  },
  {
    id: "relationships",
    name: "Relationships",
    family: "enterprise",
    purpose:
      "Define relationships between companies, functions, systems, data assets, vendors, owners, initiatives, and metrics.",
    requirement: "required",
    expectedOwner: "Enterprise architecture, data office, transformation office",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "From object",
      "Relationship type",
      "To object",
      "Strength",
      "Company or unit",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: MODULES_ALL,
    validationRules: [
      "Relationship type must use a governed business verb.",
      "Evidence notes must not be stored as relationship verbs.",
      "Tenant scope is required for every relationship.",
    ],
    mappingTarget: "Relationships, Evidence Registry, Module Context APIs",
    readinessImpact:
      "Creates the connected context needed for dependency analysis, sourcing leverage, and executive drill-down.",
    fileMatchTerms: ["relationship", "dependency", "edge", "graph"],
  },
  {
    id: "evidence-sources",
    name: "Evidence Sources",
    family: "governance",
    purpose:
      "Register source documents, system extracts, owner attestations, source dates, sensitivity, and usage boundaries.",
    requirement: "required",
    expectedOwner: "Data governance, security, tenant setup lead",
    acceptedFileTypes: ["XLSX", "CSV", "PDF", "DOCX"],
    requiredFields: [
      "Evidence source",
      "Source type",
      "Owner",
      "Date received",
      "Sensitivity",
      "Allowed use",
      "Review status",
    ],
    exampleRowsAvailable: true,
    moduleImpact: MODULES_ALL,
    validationRules: [
      "Every evidence source requires owner, date, sensitivity, and allowed use.",
      "Restricted material must be quarantined from model-ready context.",
      "Source lineage must survive into rendered citations.",
    ],
    mappingTarget: "Evidence Registry, Governance, Promotion Gate",
    readinessImpact:
      "Provides the audit spine for what AbarVa may cite, use, quarantine, or send to advisory synthesis.",
    fileMatchTerms: ["evidence", "source", "document", "lineage"],
  },
  {
    id: "metric-definitions",
    name: "Metric Definitions",
    family: "enterprise",
    purpose:
      "Define KPIs, formulas, dimensions, owners, refresh cadence, source systems, and board-grade evidence status.",
    requirement: "recommended",
    expectedOwner: "FP&A, data office, business analytics",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Metric name",
      "Definition",
      "Formula",
      "Owner",
      "Source system",
      "Refresh cadence",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Moves", "Tower"],
    validationRules: [
      "Metrics must distinguish actuals, targets, forecasts, and assumptions.",
      "Formula and source system are required before board-grade use.",
      "Owner role is required for attestation.",
    ],
    mappingTarget: "Canonical Facts, Derived Intelligence, Tower outcome ledger",
    readinessImpact:
      "Lets AbarVa explain performance, proof gaps, and outcome tracking without inventing KPI math.",
    fileMatchTerms: ["metric", "kpi", "measure", "definition"],
  },
  {
    id: "industry-benchmark-inputs",
    name: "Industry / Benchmark Inputs",
    family: "enterprise",
    purpose:
      "Capture approved external benchmarks, assumptions, industry ranges, source dates, and when they may be used.",
    requirement: "optional",
    expectedOwner: "Strategy, value office, external advisory lead",
    acceptedFileTypes: ["XLSX", "CSV", "PDF"],
    requiredFields: [
      "Benchmark topic",
      "Industry or peer group",
      "Range or metric",
      "Source",
      "Source date",
      "Usage caveat",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Intelligence", "Moves", "Tower"],
    validationRules: [
      "Benchmarks must be labeled as external context, not tenant facts.",
      "Source and date are required.",
      "Usage caveats must be visible in advisory output.",
    ],
    mappingTarget: "Derived Intelligence, Evidence Registry, Module Readiness",
    readinessImpact:
      "Allows AbarVa to show useful industry context while keeping tenant facts separate.",
    fileMatchTerms: ["industry", "benchmark", "peer", "market"],
  },
  {
    id: "infrastructure-cloud-estate",
    name: "Infrastructure & Cloud Estate",
    family: "technology",
    purpose:
      "Capture hosting, cloud accounts, infrastructure platforms, data centers, resilience posture, cost drivers, and platform ownership.",
    requirement: "recommended",
    expectedOwner: "Infrastructure, cloud platform, security architecture",
    acceptedFileTypes: SHARED_FILE_TYPES,
    requiredFields: [
      "Platform or asset",
      "Hosting model",
      "Company or unit",
      "Owner",
      "Criticality",
      "Cost driver",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Home", "Intelligence", "Moves", "Tower"],
    validationRules: [
      "Infrastructure assets must connect to applications, data assets, or business services when known.",
      "Cost drivers need period and currency when quantified.",
      "Critical assets require owner and resilience status.",
    ],
    mappingTarget: "Canonical Facts, Relationships, Module Readiness",
    readinessImpact:
      "Supports modernization, cloud-cost, resiliency, and platform-dependency decisions.",
    fileMatchTerms: ["infrastructure", "cloud", "hosting", "network", "platform"],
  },
  {
    id: "source-event-pack",
    name: "Source Event Pack",
    family: "module-pack",
    purpose:
      "Package sourcing event goals, scope, requirements, vendor list, evidence, pricing, SLAs, exceptions, and approval checkpoints.",
    requirement: "optional",
    expectedOwner: "Procurement, legal, sourcing lead, business sponsor",
    acceptedFileTypes: ["XLSX", "DOCX", "PDF", "ZIP"],
    requiredFields: [
      "Event name",
      "Scope",
      "Requirements",
      "Vendors",
      "Pricing basis",
      "Decision owner",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Source", "Intelligence", "Tower"],
    validationRules: [
      "Vendor-facing material must be separated from internal notes.",
      "Commercial terms must not be hallucinated.",
      "Decision artifacts need source evidence and approval status.",
    ],
    mappingTarget: "Source readiness, Evidence Registry, Promotion Gate",
    readinessImpact:
      "Prepares a sourcing workspace without making vendor analysis active before evidence is validated.",
    fileMatchTerms: ["source", "sourcing", "rfp", "vendor response"],
  },
  {
    id: "moves-program-pack",
    name: "Moves Program Pack",
    family: "module-pack",
    purpose:
      "Package a transformation use case, business case, workstreams, decisions, dependencies, risks, resources, and proof plan.",
    requirement: "optional",
    expectedOwner: "Program sponsor, transformation office, PMO",
    acceptedFileTypes: ["XLSX", "DOCX", "PDF", "ZIP"],
    requiredFields: [
      "Move name",
      "Business outcome",
      "Workstream",
      "Decision",
      "Dependency",
      "Owner",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Moves", "Intelligence", "Tower"],
    validationRules: [
      "Moves must state the business outcome and decision owner.",
      "Dependencies must be reviewable before execution claims.",
      "Proof plan must separate assumptions from measured outcomes.",
    ],
    mappingTarget: "Moves readiness, Outcome ledger, Module Readiness",
    readinessImpact:
      "Turns a use case into a governed execution path with dependencies and proof gates.",
    fileMatchTerms: ["moves", "program", "transformation", "workstream"],
  },
  {
    id: "tower-outcome-pack",
    name: "Tower Outcome Pack",
    family: "module-pack",
    purpose:
      "Package portfolio budget, outcomes, value proof, vendors, risks, initiatives, and executive metrics for Tower.",
    requirement: "optional",
    expectedOwner: "CIO office, IT finance, value office",
    acceptedFileTypes: ["XLSX", "CSV", "PDF"],
    requiredFields: [
      "Outcome",
      "Metric",
      "Budget",
      "Committed value",
      "Proven value",
      "Owner",
      "Evidence source",
    ],
    exampleRowsAvailable: true,
    moduleImpact: ["Tower", "Home", "Intelligence"],
    validationRules: [
      "Budget, committed value, and proven value must be distinct fields.",
      "Proven value requires finance-attested evidence.",
      "Portfolio-company and corporate values must be sliceable.",
    ],
    mappingTarget: "Tower outcome ledger, Canonical Facts, Derived Intelligence",
    readinessImpact:
      "Prevents Tower from showing value gaps as fake numbers and enables portfolio-level slicing.",
    fileMatchTerms: ["tower", "outcome", "portfolio", "value proof"],
  },
];

export const ADMIN_DATA_INTAKE_GUIDES: AdminDataIntakeGuide[] = [
  {
    id: "new-tenant-onboarding",
    title: "New tenant onboarding guide",
    detail:
      "Start with enterprise profile, business functions, systems, evidence sources, spend, and relationships before module packs.",
    stepCount: 15,
    entryPoint: "Download full Tenant Packet",
  },
  {
    id: "existing-tenant-refresh",
    title: "Existing tenant refresh guide",
    detail:
      "Refresh changed templates, validate deltas, create an inactive candidate, then compare preview readiness before promotion.",
    stepCount: 9,
    entryPoint: "View refresh checklist",
  },
  {
    id: "source-event-setup",
    title: "Source event setup guide",
    detail:
      "Prepare sourcing scope, requirement registry, vendor response package, pricing basis, and approval evidence.",
    stepCount: 11,
    entryPoint: "View Source packet",
  },
  {
    id: "moves-program-setup",
    title: "Moves program setup guide",
    detail:
      "Turn a use case into outcome, workstream, dependency, risk, resource, and proof-plan inputs.",
    stepCount: 10,
    entryPoint: "View Moves packet",
  },
  {
    id: "tower-outcome-tracking",
    title: "Tower outcome tracking setup guide",
    detail:
      "Load budget, committed value, proven value, vendors, initiatives, risks, and metric definitions for portfolio review.",
    stepCount: 8,
    entryPoint: "View Tower packet",
  },
  {
    id: "contract-optimization",
    title: "Contract optimization setup guide",
    detail:
      "Assemble contracts, service baselines, invoice history, demand signals, SLAs, and negotiation evidence.",
    stepCount: 9,
    entryPoint: "View optimization packet",
  },
];

export const ADMIN_DATA_INTAKE_GUARDRAILS = [
  "Uploading a completed template does not make it active tenant truth.",
  "Completed templates must pass validation, mapping, candidate preview, and promotion gates.",
  "Legacy controlled imports are labeled; they are not candidate promotion.",
  "Template contracts are business-facing and must not expose internal schema or version labels.",
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function matchedSourceFiles(
  item: AdminTemplateCatalogItem,
  sourceFiles: AdminSetupControlSourceFile[],
): string[] {
  const terms = item.fileMatchTerms.map(normalize);
  return sourceFiles
    .map((file) => file.source_doc)
    .filter((sourceDoc) => {
      const normalizedSource = normalize(sourceDoc);
      return terms.some((term) => normalizedSource.includes(term.trim()));
    });
}

function templateStatusFromControl(args: {
  item: AdminTemplateCatalogItem;
  setupControl?: AdminSetupControlResponse | null;
  matches: string[];
}): Pick<AdminTemplateCatalogViewItem, "status" | "statusDetail"> {
  const { setupControl, matches } = args;
  if (!setupControl) {
    return {
      status: "not-uploaded",
      statusDetail:
        "Template contract defined; setup-control status is unavailable.",
    };
  }

  if (matches.length === 0) {
    return {
      status: "not-uploaded",
      statusDetail:
        "Template contract defined - downloadable file not yet generated.",
    };
  }

  if (setupControl.candidateTenantDataVersion.status === "ready") {
    return {
      status: "candidate-ready",
      statusDetail: "Evidence matched; candidate readiness must still be proven.",
    };
  }

  const uploadState = setupControl.uploadState;
  const stagedStatus: Array<[number, AdminTemplateStatus, string]> = [
    [
      uploadState.validatedFiles,
      "validated",
      "Matched evidence exists and setup-control reports validated files.",
    ],
    [
      uploadState.mappedFiles,
      "mapped",
      "Matched evidence exists and setup-control reports mapped files.",
    ],
    [
      uploadState.parsedFiles,
      "parsed",
      "Matched evidence exists and setup-control reports parsed files.",
    ],
  ];
  const advanced = stagedStatus.find(([count]) => count > 0);
  if (advanced) {
    return {
      status: advanced[1],
      statusDetail: advanced[2],
    };
  }

  return {
    status: "uploaded",
    statusDetail:
      "Evidence source is visible; parsing, mapping, validation, and candidate promotion are not proven here.",
  };
}

function emptyStatusCounts(): Record<AdminTemplateStatus, number> {
  return {
    "not-uploaded": 0,
    uploaded: 0,
    parsed: 0,
    mapped: 0,
    validated: 0,
    "candidate-ready": 0,
    active: 0,
  };
}

export function buildAdminDataIntakeLibraryView(args: {
  setupControl?: AdminSetupControlResponse | null;
  sourceFiles?: AdminSetupControlSourceFile[];
}): AdminDataIntakeLibraryView {
  const sourceFiles = args.sourceFiles ?? [];
  const catalog = ADMIN_TEMPLATE_CATALOG.map((item) => {
    const matches = matchedSourceFiles(item, sourceFiles);
    const status = templateStatusFromControl({
      item,
      setupControl: args.setupControl,
      matches,
    });
    return {
      ...item,
      ...status,
      matchedSourceFiles: matches,
    };
  });

  const statusCounts = emptyStatusCounts();
  for (const item of catalog) {
    statusCounts[item.status] += 1;
  }

  return {
    catalog,
    guides: ADMIN_DATA_INTAKE_GUIDES,
    guardrails: ADMIN_DATA_INTAKE_GUARDRAILS,
    statusCounts,
  };
}

export function adminTemplateStatusToControlStatus(
  status: AdminTemplateStatus,
): AdminControlStatus {
  if (status === "active") return "ready";
  if (status === "candidate-ready" || status === "validated") {
    return "preview-ready";
  }
  if (status === "mapped" || status === "parsed" || status === "uploaded") {
    return "partially-ready";
  }
  return "not-created";
}

export function getAdminTemplateById(
  templateId: string,
): AdminTemplateCatalogItem | undefined {
  return ADMIN_TEMPLATE_CATALOG.find((template) => template.id === templateId);
}

export function getAdminGuideById(
  guideId: string,
): AdminDataIntakeGuide | undefined {
  return ADMIN_DATA_INTAKE_GUIDES.find((guide) => guide.id === guideId);
}

function csvEscape(value: string | number | boolean | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: Array<Record<string, string | number | boolean>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0] ?? {});
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

function sentenceFromField(fieldName: string, template: AdminTemplateCatalogItem): string {
  const normalized = fieldName.toLowerCase();
  if (normalized.includes("evidence")) {
    return "Named source file, system extract, attestation, or document that supports this row.";
  }
  if (normalized.includes("owner") || normalized.includes("role")) {
    return "Business-readable accountable owner role; named people are optional unless approved.";
  }
  if (normalized.includes("currency")) {
    return "Currency code for any monetary value, such as USD.";
  }
  if (normalized.includes("amount") || normalized.includes("budget") || normalized.includes("value") || normalized.includes("spend")) {
    return "Numeric business value with scale and period clearly labeled.";
  }
  if (normalized.includes("company") || normalized.includes("unit") || normalized.includes("enterprise")) {
    return "Holding company, portfolio company, corporate shared service, or operating unit.";
  }
  if (normalized.includes("status") || normalized.includes("stage")) {
    return "Current business state using the accepted values for this template.";
  }
  return `Business-readable ${fieldName} used to populate ${template.mappingTarget}.`;
}

function acceptedValuesForField(fieldName: string, template: AdminTemplateCatalogItem): string {
  const normalized = fieldName.toLowerCase();
  if (normalized.includes("criticality")) return "critical | high | medium | low";
  if (normalized.includes("status")) return "active | planned | retired | blocked | open | closed";
  if (normalized.includes("stage")) return "idea | approved | in-flight | launched | measured | closed";
  if (normalized.includes("currency")) return "ISO currency code, for example USD";
  if (normalized.includes("sensitivity")) return "public | internal | confidential | restricted";
  if (normalized.includes("allowed use")) return "home | intelligence | moves | source | tower | restricted";
  if (normalized.includes("strength")) return "strong | directional | weak | unknown";
  if (normalized.includes("risk")) return "low | medium | high | critical";
  if (normalized.includes("date")) return "YYYY-MM-DD";
  if (normalized.includes("amount") || normalized.includes("budget") || normalized.includes("value") || normalized.includes("spend")) {
    return "number plus currency/scale in adjacent fields";
  }
  return template.acceptedFileTypes.includes("DOCX")
    ? "business-readable text"
    : "business-readable text or approved controlled value";
}

function exampleForField(fieldName: string): string {
  const normalized = fieldName.toLowerCase();
  if (normalized.includes("enterprise")) return "Lakeshore Holdings";
  if (normalized.includes("portfolio company") || normalized.includes("company")) return "Forge & Field";
  if (normalized.includes("function")) return "Corporate Finance";
  if (normalized.includes("owner")) return "CFO / Treasurer";
  if (normalized.includes("application")) return "SAP S/4HANA";
  if (normalized.includes("vendor")) return "Microsoft";
  if (normalized.includes("currency")) return "USD";
  if (normalized.includes("date")) return "2026-09-30";
  if (normalized.includes("amount") || normalized.includes("budget") || normalized.includes("spend")) return "12500000";
  if (normalized.includes("value")) return "6200000";
  if (normalized.includes("evidence")) return "finance-baseline-fy26.xlsx";
  if (normalized.includes("status")) return "active";
  if (normalized.includes("criticality")) return "high";
  if (normalized.includes("risk")) return "medium";
  return "Client-provided value";
}

export function buildAdminTemplateFieldDictionary(
  template: AdminTemplateCatalogItem,
): AdminTemplateFieldDefinition[] {
  const fields = [
    ...template.requiredFields.map((fieldName) => ({
      fieldName,
      requirement: "required" as const,
    })),
    {
      fieldName: "Client validation status",
      requirement: "optional" as const,
    },
    {
      fieldName: "Notes / assumptions",
      requirement: "optional" as const,
    },
  ];

  return fields.map(({ fieldName, requirement }, index) => ({
    fieldName,
    requirement,
    description: sentenceFromField(fieldName, template),
    acceptedValues: acceptedValuesForField(fieldName, template),
    example: exampleForField(fieldName),
    mappingTarget: template.mappingTarget,
    validationRule:
      template.validationRules[index % template.validationRules.length] ??
      "Value must be client-supplied or visibly marked as missing.",
    moduleImpact: template.moduleImpact,
  }));
}

export function buildAdminTemplateArtifact(
  template: AdminTemplateCatalogItem,
): AdminTemplateArtifact {
  const fields = buildAdminTemplateFieldDictionary(template);
  const sampleRow = Object.fromEntries(
    fields.map((field) => [field.fieldName, field.example]),
  ) as Record<string, string>;

  return {
    template,
    fields,
    sampleRows: [
      sampleRow,
      Object.fromEntries(
        fields.map((field) => [
          field.fieldName,
          field.requirement === "required"
            ? `${field.example} - second example`
            : "",
        ]),
      ) as Record<string, string>,
    ],
    guideId: TEMPLATE_GUIDE_BY_ID[template.id] ?? TEMPLATE_GUIDE_BY_FAMILY[template.family],
    downloadFileName: `${template.id}.csv`,
  };
}

export function buildAdminTemplateCsv(template: AdminTemplateCatalogItem): string {
  return toCsv(buildAdminTemplateArtifact(template).sampleRows);
}

export function buildAdminFieldDictionaryCsv(
  template: AdminTemplateCatalogItem,
): string {
  return toCsv(
    buildAdminTemplateFieldDictionary(template).map((field) => ({
      "Field name": field.fieldName,
      Requirement: field.requirement,
      Description: field.description,
      "Accepted values": field.acceptedValues,
      Example: field.example,
      "Mapping target": field.mappingTarget,
      "Validation rule": field.validationRule,
      "Module impact": field.moduleImpact.join("; "),
    })),
  );
}

export function buildAdminGuideMarkdown(guide: AdminDataIntakeGuide): string {
  const relatedTemplates = ADMIN_TEMPLATE_CATALOG.filter((template) => {
    const artifact = buildAdminTemplateArtifact(template);
    return artifact.guideId === guide.id;
  });

  return [
    `# ${guide.title}`,
    "",
    guide.detail,
    "",
    "## Operating principle",
    "",
    "Uploaded evidence is not active tenant truth. Complete the packet, validate it, preview it as inactive candidate data, then promote only with approval and cite-render proof.",
    "",
    "## Workflow",
    "",
    "1. Choose the setup path and required templates.",
    "2. Populate business-facing fields with client-owned evidence.",
    "3. Keep missing values visible instead of inventing them.",
    "4. Upload and validate in the later dry-run lane.",
    "5. Inspect candidate preview before any active tenant access changes.",
    "6. Promote only with approval, rollback, and module proof.",
    "",
    "## Related templates",
    "",
    ...(relatedTemplates.length
      ? relatedTemplates.map(
          (template) =>
            `- ${template.name}: ${template.purpose} Module impact: ${template.moduleImpact.join(", ")}.`,
        )
      : ["- No direct templates are assigned to this guide yet."]),
    "",
    "## Guardrails",
    "",
    ...ADMIN_DATA_INTAKE_GUARDRAILS.map((guardrail) => `- ${guardrail}`),
    "",
  ].join("\n");
}

export function buildAdminTenantPacketManifest() {
  return {
    packetName: "AbarVa Tenant Packet",
    version: "admin-pr4-read-only-artifacts",
    generatedFrom: "ADMIN_TEMPLATE_CATALOG",
    truthSplit: {
      uploadEnabled: false,
      validationExecuted: false,
      candidateCreated: false,
      candidatePromoted: false,
      activeTenantAccessUpdated: false,
      moduleRuntimeConsumptionChanged: false,
    },
    templates: ADMIN_TEMPLATE_CATALOG.map((template) => {
      const artifact = buildAdminTemplateArtifact(template);
      return {
        id: template.id,
        name: template.name,
        requirement: template.requirement,
        expectedOwner: template.expectedOwner,
        acceptedFileTypes: template.acceptedFileTypes,
        moduleImpact: template.moduleImpact,
        mappingTarget: template.mappingTarget,
        templateFile: `templates/${artifact.downloadFileName}`,
        fieldDictionaryFile: `field-dictionaries/${template.id}-field-dictionary.csv`,
        guideFile: `guides/${artifact.guideId}.md`,
      };
    }),
    guides: ADMIN_DATA_INTAKE_GUIDES.map((guide) => ({
      id: guide.id,
      title: guide.title,
      stepCount: guide.stepCount,
      file: `guides/${guide.id}.md`,
    })),
    guardrails: ADMIN_DATA_INTAKE_GUARDRAILS,
  };
}
