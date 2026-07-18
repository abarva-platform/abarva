import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  buildTenantManifestProjectionAudit,
  type TenantManifestProjectionAudit,
} from "@/lib/admin/tenant-manifest-projection-audit";

export type DataJourneySectionId =
  | "overview"
  | "input-files"
  | "tenant-packet"
  | "evidence"
  | "parsing-extraction"
  | "validation"
  | "known-facts"
  | "relationships"
  | "insights"
  | "candidate-preview"
  | "promotion-readiness"
  | "active-access"
  | "module-usage"
  | "outcome-ledger"
  | "benchmarks"
  | "page-mapping"
  | "quality-checks"
  | "guardrails";

export interface DataJourneySection {
  id: DataJourneySectionId;
  navLabel: string;
  title: string;
  plainEnglish: string;
  goesIn: string[];
  comesOut: string[];
  exampleRecords: string[];
  qualityChecks: string[];
  currentStatus: string;
  usedBy: string[];
  whatCanGoWrong: string[];
  guardrails: string[];
  internalName?: string;
}

export interface DataJourneyInputCategory {
  id: string;
  label: string;
  purpose: string;
  owner: string;
  acceptedFileTypes: string[];
  requiredFields: string[];
  optionalFields: string[];
  sampleRow: Record<string, string>;
  mappedLayer: string;
  moduleImpact: string[];
  readinessImpact: string;
}

export interface DataJourneyPipelineStep {
  order: number;
  label: string;
  explanation: string;
  produces: string;
  guardrail: string;
}

export interface DataJourneyPageMapping {
  page: string;
  readsFrom: string[];
  writesTo: string[];
  doesNotWriteTo: string[];
  dependsOn: string[];
  guardrails: string[];
  currentWiringStatus: string;
  caveats: string[];
}

export interface DataJourneyQualityCheck {
  id: string;
  label: string;
  purpose: string;
  appliesTo: string[];
  currentStatus: string;
  failureMode: string;
}

export interface DataJourneyGuardrail {
  id: string;
  statement: string;
  reason: string;
  enforcedBy: string[];
  status: "implemented" | "expected" | "documented";
}

export interface DataJourneyInsightPolicy {
  allowedInsights: string[];
  cannotClaim: string[];
}

export interface DataLayerExplorerReferenceAudit {
  tenantKey: string;
  tenantDisplayName: string;
  status: "review_required" | "pass";
  sourceRichness: {
    label: string;
    value: string;
    evidence: string;
  }[];
  candidateCoverage: {
    label: string;
    value: string;
    evidence: string;
    status: "covered" | "gap" | "review_required";
  }[];
  qualitySignals: {
    severity: "high" | "medium" | "low";
    finding: string;
    evidence: string;
    recommendedAction: string;
  }[];
}

export interface DataLayerExplorerModel {
  generatedFor: string;
  title: string;
  subtitle: string;
  truthSplit: {
    implemented: string[];
    notImplemented: string[];
  };
  sections: DataJourneySection[];
  inputCategories: DataJourneyInputCategory[];
  pipelineSteps: DataJourneyPipelineStep[];
  pageMappings: DataJourneyPageMapping[];
  insightPolicy: DataJourneyInsightPolicy;
  qualityChecks: DataJourneyQualityCheck[];
  guardrails: DataJourneyGuardrail[];
  referenceDataAudit: DataLayerExplorerReferenceAudit;
  manifestProjectionAudit: TenantManifestProjectionAudit;
}

export interface DataLayerExplorerProofOutput {
  model: DataLayerExplorerModel;
  outputPaths: {
    sectionMapPath: string;
    pageLayerMapPath: string;
    qualityChecksPath: string;
    guardrailsPath: string;
    referenceDataAuditPath: string;
    manifestProjectionAuditPath: string;
    summaryPath: string;
  };
}

const ACTIVE_GUARDRAILS = [
  "Uploaded files do not become active facts by being present.",
  "Parsed rows remain candidates until validation and approval complete.",
  "Candidate data is inactive by default.",
  "Promotion requires explicit operator approval and rollback posture.",
  "Module preview is not runtime readiness.",
  "Proposed value is not realized value.",
  "Active Home context is not active tenant truth unless the active pointer is wired and proven.",
];

export function buildAdminDataLayerExplorerModel(
  generatedFor = "Admin Data Layer Explorer",
): DataLayerExplorerModel {
  const inputCategories = buildInputCategories();
  const pipelineSteps = buildPipelineSteps();
  const insightPolicy = buildInsightPolicy();
  const qualityChecks = buildQualityChecks();
  const guardrails = buildGuardrails();
  const sections = buildSections(
    inputCategories,
    pipelineSteps,
    insightPolicy,
    qualityChecks,
    guardrails,
  );
  const pageMappings = buildPageMappings();
  const manifestProjectionAudit = buildTenantManifestProjectionAudit();

  return {
    generatedFor,
    title: "Data Layer Explorer",
    subtitle:
      "A read-only map of how client files become evidence-backed facts, relationships, insights, candidate previews, and eventually active module context.",
    truthSplit: {
      implemented: [
        "Read-only Admin page.",
        "Left-rail data journey navigation.",
        "Input category catalogue.",
        "Input-to-layer flow explanation.",
        "Page-to-layer mapping.",
        "Quality check catalogue.",
        "Guardrail catalogue.",
        "Current status and caveats where runtime wiring is not available.",
        "Generated proof artifacts for section, page, quality, guardrail, and summary review.",
      ],
      notImplemented: [
        "No upload execution.",
        "No validation execution.",
        "No candidate creation.",
        "No candidate promotion.",
        "No production tenant data writes.",
        "No Active Tenant Access update.",
        "No module runtime behavior change.",
        "No chat-led Admin flow.",
      ],
    },
    sections,
    inputCategories,
    pipelineSteps,
    pageMappings,
    insightPolicy,
    qualityChecks,
    guardrails,
    referenceDataAudit: buildReferenceDataAudit(),
    manifestProjectionAudit,
  };
}

export function buildSectionMap(model: DataLayerExplorerModel) {
  return {
    generatedFor: model.generatedFor,
    sectionCount: model.sections.length,
    sections: model.sections.map((section) => ({
      id: section.id,
      navLabel: section.navLabel,
      title: section.title,
      internalName: section.internalName ?? null,
      goesIn: section.goesIn,
      comesOut: section.comesOut,
      usedBy: section.usedBy,
      currentStatus: section.currentStatus,
      guardrails: section.guardrails,
    })),
    pipelineSteps: model.pipelineSteps,
    inputCategoryCount: model.inputCategories.length,
  };
}

export function buildPageLayerMap(model: DataLayerExplorerModel) {
  return {
    generatedFor: model.generatedFor,
    pageCount: model.pageMappings.length,
    pages: model.pageMappings,
  };
}

export function buildQualityChecksReport(model: DataLayerExplorerModel) {
  return {
    generatedFor: model.generatedFor,
    qualityCheckCount: model.qualityChecks.length,
    checks: model.qualityChecks,
    insightPolicy: model.insightPolicy,
  };
}

export function buildGuardrailsReport(model: DataLayerExplorerModel) {
  return {
    generatedFor: model.generatedFor,
    guardrailCount: model.guardrails.length,
    guardrails: model.guardrails,
    truthSplit: model.truthSplit,
    hardRuntimeBooleans: {
      productionTenantDataWritten: false,
      candidateCreated: false,
      candidatePromoted: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeConsumptionChanged: false,
      moduleReadsCandidateByDefault: false,
    },
  };
}

export function buildReferenceDataAuditReport(model: DataLayerExplorerModel) {
  return {
    generatedFor: model.generatedFor,
    audit: model.referenceDataAudit,
    hardRuntimeBooleans: {
      productionTenantDataWritten: false,
      candidateCreated: false,
      candidatePromoted: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeConsumptionChanged: false,
    },
  };
}

export function buildSummaryMarkdown(model: DataLayerExplorerModel): string {
  const implemented = model.truthSplit.implemented
    .map((item) => `- ${item}`)
    .join("\n");
  const notImplemented = model.truthSplit.notImplemented
    .map((item) => `- ${item}`)
    .join("\n");
  const sections = model.sections
    .map((section) => `- ${section.navLabel}: ${section.currentStatus}`)
    .join("\n");
  const pages = model.pageMappings
    .map((page) => `- ${page.page}: ${page.currentWiringStatus}`)
    .join("\n");

  return `# Admin Data Layer Explorer Proof

## Purpose

${model.subtitle}

## Truth Split

Implemented:

${implemented}

Not implemented:

${notImplemented}

## Inventory

- Sections: ${model.sections.length}
- Input categories: ${model.inputCategories.length}
- Pipeline steps: ${model.pipelineSteps.length}
- Page mappings: ${model.pageMappings.length}
- Quality checks: ${model.qualityChecks.length}
    - Guardrails: ${model.guardrails.length}
    - Reference data audit: ${model.referenceDataAudit.status}
    - Manifest projection audit tenants: ${model.manifestProjectionAudit.tenants.length}
    - Manifest projection blockers: ${model.manifestProjectionAudit.promotionBlockers.length}

## Section Status

${sections}

## Page Wiring Status

${pages}

## Runtime Guardrails

- productionTenantDataWritten: false
- candidateCreated: false
- candidatePromoted: false
- activeTenantAccessLayerUpdated: false
- moduleRuntimeConsumptionChanged: false
- moduleReadsCandidateByDefault: false

## Reference Data Audit

Tenant: ${model.referenceDataAudit.tenantDisplayName}

Source richness:

${model.referenceDataAudit.sourceRichness
  .map((item) => `- ${item.label}: ${item.value} (${item.evidence})`)
  .join("\n")}

Candidate coverage:

${model.referenceDataAudit.candidateCoverage
  .map(
    (item) =>
      `- ${item.label}: ${item.value} — ${item.status} (${item.evidence})`,
  )
  .join("\n")}

Quality signals:

${model.referenceDataAudit.qualitySignals
  .map(
    (signal) =>
      `- ${signal.severity}: ${signal.finding} Recommended action: ${signal.recommendedAction}`,
  )
  .join("\n")}

## Tenant Manifest Completeness And Source Projection

Upload path alignment: ${model.manifestProjectionAudit.uploadPathAlignment.adminUploadAlignment}

${model.manifestProjectionAudit.tenants
  .map(
    (tenant) =>
      `- ${tenant.displayName}: ${tenant.status}; source files ${tenant.sourceFilesDiscovered}; structured rows ${tenant.sourceStructuredRows}; candidate records ${tenant.candidateRecordsGenerated}; blockers ${tenant.blockers.length}`,
  )
  .join("\n")}

Excluded tenants:

${model.manifestProjectionAudit.excludedTenants
  .map((tenant) => `- ${tenant.tenantKey}: ${tenant.reason}`)
  .join("\n")}
`;
}

export function writeAdminDataLayerExplorerProof(args: {
  repoRoot: string;
  outputDir?: string;
  generatedFor?: string;
}): DataLayerExplorerProofOutput {
  const model = buildAdminDataLayerExplorerModel(args.generatedFor);
  const outputDir =
    args.outputDir ??
    path.join(args.repoRoot, "reports/admin-data-layer-explorer/latest");
  mkdirSync(outputDir, { recursive: true });

  const sectionMapPath = path.join(outputDir, "section-map.json");
  const pageLayerMapPath = path.join(outputDir, "page-layer-map.json");
  const qualityChecksPath = path.join(outputDir, "quality-checks.json");
  const guardrailsPath = path.join(outputDir, "guardrails.json");
  const referenceDataAuditPath = path.join(
    outputDir,
    "reference-data-audit.json",
  );
  const manifestProjectionAuditPath = path.join(
    outputDir,
    "tenant-manifest-projection-audit.json",
  );
  const summaryPath = path.join(outputDir, "summary.md");

  writeJson(sectionMapPath, buildSectionMap(model));
  writeJson(pageLayerMapPath, buildPageLayerMap(model));
  writeJson(qualityChecksPath, buildQualityChecksReport(model));
  writeJson(guardrailsPath, buildGuardrailsReport(model));
  writeJson(referenceDataAuditPath, buildReferenceDataAuditReport(model));
  writeJson(manifestProjectionAuditPath, model.manifestProjectionAudit);
  writeFileSync(summaryPath, buildSummaryMarkdown(model), "utf8");

  return {
    model,
    outputPaths: {
      sectionMapPath,
      pageLayerMapPath,
      qualityChecksPath,
      guardrailsPath,
      referenceDataAuditPath,
      manifestProjectionAuditPath,
      summaryPath,
    },
  };
}

function buildReferenceDataAudit(): DataLayerExplorerReferenceAudit {
  return {
    tenantKey: "skyharbor-air",
    tenantDisplayName: "Airline Demo",
    status: "review_required",
    sourceRichness: [
      {
        label: "Applications and systems",
        value: "900 structured rows",
        evidence: "F05_applications-systems.csv",
      },
      {
        label: "Data products",
        value: "420 structured rows",
        evidence: "F09_data-analytics-estate.csv",
      },
      {
        label: "Integrations and interfaces",
        value: "1,800 structured rows",
        evidence: "F10_integrations-interfaces.csv",
      },
      {
        label: "Platform volumetrics",
        value:
          "79 metric rows, including EDW tables, scheduled workloads, SAS, DataStage, Informatica, and Tableau metrics",
        evidence: "F08_platform-volumetrics.csv",
      },
      {
        label: "Mainframe and SAP estate",
        value:
          "IBM Z, CICS, COBOL, DB2, IMS, MQ, CA7, Control-M, RACF, Connect:Direct, and SAP finance/reporting evidence",
        evidence: "SkyHarbor_Mainframe_and_SAP_Current_State_SYNTHETIC.md",
      },
      {
        label: "Teradata and analytics estate",
        value:
          "Teradata Vantage on AWS, SAS, DataStage, Informatica, Tableau, BusinessObjects, AWS data lake, and event streams",
        evidence: "SkyHarbor_Teradata_AWS_Data_Estate_SYNTHETIC.md",
      },
    ],
    candidateCoverage: [
      {
        label: "Candidate manifest files",
        value: "2 declared files",
        evidence:
          "reports/tenant-candidate-generation/skyharbor/packet/tenant-manifest.yaml",
        status: "gap",
      },
      {
        label: "Canonical records",
        value: "53 candidate records",
        evidence:
          "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json",
        status: "review_required",
      },
      {
        label: "Relationship plan",
        value: "0 relationship operations planned",
        evidence:
          "reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json",
        status: "gap",
      },
      {
        label: "Rich source pack projection",
        value:
          "Applications, data products, integrations, volumetrics, mainframe/SAP, and Teradata evidence are not represented in the current candidate manifest",
        evidence: "source pack inventory versus PR10 candidate packet",
        status: "gap",
      },
    ],
    qualitySignals: [
      {
        severity: "high",
        finding:
          "Candidate proof is structurally green but materially thin for SkyHarbor because it only processes the minimal enterprise profile and evidence registry.",
        evidence:
          "file-to-canonical-stage reports 2 files and 53 canonical records while source inventory contains 900 systems, 420 data products, and 1,800 integrations.",
        recommendedAction:
          "Expand the SkyHarbor candidate packet and mapping profiles to include systems, data estate, integrations, platform volumetrics, source documents, Moves artifacts, Source events, and Tower outcomes before any active promotion.",
      },
      {
        severity: "high",
        finding:
          "The current relationship plan does not represent the dependency graph expected for a rich existing tenant.",
        evidence:
          "Candidate version record reports 0 relationship operations planned despite system, data-product, integration, vendor, and outcome evidence existing in the source pack.",
        recommendedAction:
          "Add relationship mappings for system-to-owner, system-to-data-product, integration-to-system, vendor-to-system, program-to-outcome, and evidence-to-claim edges.",
      },
      {
        severity: "medium",
        finding:
          "Some structured inventory rows look generated rather than operationally curated.",
        evidence:
          "Examples include cloud/data-platform vendor labels combined with mainframe deployment or legacy-mainframe category assignments.",
        recommendedAction:
          "Run a domain consistency validator before candidate promotion and quarantine rows whose vendor, category, deployment, owner, and source evidence do not agree.",
      },
      {
        severity: "medium",
        finding:
          "The narrative source documents carry better current-state truth than the current candidate projection.",
        evidence:
          "Derived enterprise reads explicitly name Teradata Vantage on AWS, SAS, DataStage, Informatica, Tableau, BusinessObjects, IBM Z, CICS, DB2, MQ, and SAP flows.",
        recommendedAction:
          "Promote narrative-derived facts only after mapping them to canonical objects with citations and confidence, not as loose summary text.",
      },
    ],
  };
}

function writeJson(filePath: string, value: unknown) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildSections(
  inputCategories: DataJourneyInputCategory[],
  pipelineSteps: DataJourneyPipelineStep[],
  insightPolicy: DataJourneyInsightPolicy,
  qualityChecks: DataJourneyQualityCheck[],
  guardrails: DataJourneyGuardrail[],
): DataJourneySection[] {
  return [
    {
      id: "overview",
      navLabel: "Overview",
      title: "How the data journey works",
      plainEnglish:
        "AbarVa separates client inputs, evidence, candidate data, approval, and active module context so leaders can see what is trusted, what is only proposed, and what still needs proof.",
      goesIn: [
        "Client files",
        "templates",
        "setup-control status",
        "candidate proof metadata",
      ],
      comesOut: [
        "A shared map of layers, pages, checks, caveats, and guardrails",
      ],
      exampleRecords: [
        "Enterprise profile row",
        "contract attribute",
        "program baseline",
        "promotion blocker",
      ],
      qualityChecks: [
        "Read-only route check",
        "no production-write controls",
        "page-to-layer map completeness",
      ],
      currentStatus:
        "Read-only explorer implemented; live data execution is intentionally out of scope.",
      usedBy: ["Admin", "Implementation teams", "Client operators"],
      whatCanGoWrong: [
        "Uploaded files are mistaken for active truth",
        "candidate preview is mistaken for runtime readiness",
      ],
      guardrails: ACTIVE_GUARDRAILS,
    },
    {
      id: "input-files",
      navLabel: "Input Files",
      title: "Input files and tenant source packs",
      plainEnglish:
        "Input files are the raw materials. They can describe the enterprise, systems, vendors, spend, programs, risks, Source events, Moves work, and Tower outcomes.",
      goesIn: inputCategories.map((category) => category.label),
      comesOut: [
        "Typed source records",
        "file inventory",
        "template coverage",
        "quarantine candidates",
      ],
      exampleRecords: inputCategories
        .slice(0, 4)
        .map(
          (category) =>
            `${category.label}: ${Object.values(category.sampleRow)[0]}`,
        ),
      qualityChecks: [
        "file type",
        "required fields",
        "accepted values",
        "tenant isolation",
        "evidence attachment",
      ],
      currentStatus:
        "Catalogue implemented; upload and validation execution are not implemented on this page.",
      usedBy: [
        "Admin Overview",
        "Data Intake Library",
        "Tenant Packet Builder",
      ],
      whatCanGoWrong: [
        "Thin files leave answer gaps",
        "wrong owners reduce accountability",
        "unsupported fields become stranded data",
      ],
      guardrails: [
        "A file is not a fact.",
        "A file count is not data quality.",
        "Unsupported inputs must be quarantined or mapped before use.",
      ],
    },
    {
      id: "tenant-packet",
      navLabel: "Tenant Packet",
      title: "Tenant packet",
      plainEnglish:
        "The tenant packet is the structured contract that says which files belong to the tenant, what type each file is, which adapter should parse it, and what evidence lineage must be preserved.",
      goesIn: [
        "input file manifest",
        "template type",
        "tenant identity",
        "packet version",
        "adapter version",
      ],
      comesOut: [
        "packet manifest",
        "adapter routing",
        "mapping coverage",
        "proof fingerprint",
      ],
      exampleRecords: [
        "packetId: tenant-onboarding-001",
        "sourceType: applications-and-systems",
        "adapter: spreadsheet",
      ],
      qualityChecks: [
        "manifest completeness",
        "tenant key from canonical source",
        "adapter availability",
        "mapping version present",
      ],
      currentStatus:
        "Contract exists in the data runway; this Admin page explains it and does not create packets.",
      usedBy: [
        "Tenant Packet Builder",
        "Candidate Preview",
        "Data Layer Explorer",
      ],
      whatCanGoWrong: [
        "source files are present but not declared",
        "wrong adapter selected",
        "packet version is not linked to proof",
      ],
      guardrails: [
        "No packet means no governed ingestion.",
        "Packet selection does not mean validation passed.",
      ],
      internalName: "Tenant Packet Contract",
    },
    {
      id: "evidence",
      navLabel: "Evidence",
      title: "Evidence",
      plainEnglish:
        "Evidence is the traceable source support behind a claim, fact, relationship, or insight. It answers: where did this come from?",
      goesIn: [
        "source files",
        "document sections",
        "spreadsheet rows",
        "source references",
      ],
      comesOut: [
        "evidence items",
        "source citations",
        "lineage links",
        "evidence gaps",
      ],
      exampleRecords: [
        "sourceDoc: applications.csv",
        "rowRef: R17",
        "claimSupported: contract renewal date",
      ],
      qualityChecks: [
        "source attachment",
        "citation availability",
        "tenant isolation",
        "blocked-object filtering",
      ],
      currentStatus:
        "Existing read models can expose evidence summaries where wired; missing fields should show Not available yet.",
      usedBy: ["Home", "Intelligence", "Moves", "Source", "Tower"],
      whatCanGoWrong: [
        "answers cite no source",
        "evidence belongs to another tenant",
        "summary loses source lineage",
      ],
      guardrails: [
        "No raw context to models.",
        "Evidence-backed claims must retain provenance.",
      ],
      internalName: "Evidence Registry",
    },
    {
      id: "parsing-extraction",
      navLabel: "Parsing & Extraction",
      title: "Parsing and extraction",
      plainEnglish:
        "Parsing turns files into candidate records. Extraction pulls relevant objects and fields from tables and documents before they are trusted.",
      goesIn: pipelineSteps.slice(0, 4).map((step) => step.label),
      comesOut: [
        "candidate records",
        "normalized fields",
        "unmapped field list",
        "quarantine queue",
      ],
      exampleRecords: [
        "applicationName: Claims Portal",
        "vendorName: Cloud vendor",
        "programName: Customer recovery",
      ],
      qualityChecks: [
        "schema fit",
        "field normalization",
        "duplicate detection",
        "quarantine rules",
      ],
      currentStatus:
        "Explained here; execution belongs to ingestion dry-run and future Admin validation flows.",
      usedBy: [
        "Data Intake Library",
        "Tenant Packet Builder",
        "Candidate Preview",
      ],
      whatCanGoWrong: [
        "document sections are missed",
        "numeric fields parse as text",
        "same object appears twice",
      ],
      guardrails: [
        "Parsed row does not equal promoted truth.",
        "Bad records must be quarantined instead of silently accepted.",
      ],
    },
    {
      id: "validation",
      navLabel: "Validation",
      title: "Validation",
      plainEnglish:
        "Validation checks whether candidate records have the fields, values, evidence, tenant scope, and lineage needed before they can feed candidate versions.",
      goesIn: [
        "candidate records",
        "template schema",
        "accepted values",
        "required field dictionary",
        "evidence references",
      ],
      comesOut: [
        "validated candidates",
        "blocked candidates",
        "quality report",
        "readiness gaps",
      ],
      exampleRecords: [
        "required owner missing",
        "accepted status value passed",
        "duplicate vendor quarantined",
      ],
      qualityChecks: [
        "required fields",
        "accepted values",
        "evidence attachment",
        "tenant isolation",
        "duplicate checks",
      ],
      currentStatus:
        "Quality catalogue implemented; validation execution is intentionally out of scope for this page.",
      usedBy: ["Candidate Preview", "Promotion Readiness", "Module Usage"],
      whatCanGoWrong: [
        "thin records pass because only file count was checked",
        "missing evidence is ignored",
      ],
      guardrails: [
        "Uploaded-file count is not quality.",
        "Validation must produce blockers, not hidden assumptions.",
      ],
    },
    {
      id: "known-facts",
      navLabel: "Known Facts",
      title: "Known Facts",
      plainEnglish:
        "Known Facts are clean, validated statements about the tenant, backed by evidence and mapped to a business object.",
      goesIn: [
        "validated candidates",
        "evidence links",
        "mapping rules",
        "fact version metadata",
      ],
      comesOut: [
        "tenant facts",
        "fact versions",
        "fact confidence",
        "fact gaps",
      ],
      exampleRecords: [
        "application owner",
        "contract renewal date",
        "program sponsor",
        "metric definition",
      ],
      qualityChecks: [
        "evidence present",
        "confidence present",
        "source basis present",
        "fact version present",
      ],
      currentStatus:
        "Summaries are available where read models are wired; absent fields should be reported as Not wired yet.",
      usedBy: ["Home", "Intelligence", "Moves", "Source", "Tower"],
      whatCanGoWrong: [
        "candidate fact used before approval",
        "confidence is omitted",
        "stale fact is not superseded",
      ],
      guardrails: [
        "Known Fact requires validation, mapping, and evidence.",
        "Candidate facts stay inactive until promotion.",
      ],
      internalName: "Canonical Fact Store",
    },
    {
      id: "relationships",
      navLabel: "Relationships",
      title: "Relationships",
      plainEnglish:
        "Relationships connect the enterprise: systems to owners, vendors to contracts, programs to outcomes, risks to controls, and modules to readiness.",
      goesIn: [
        "validated objects",
        "relationship rows",
        "evidence links",
        "relationship type dictionary",
      ],
      comesOut: [
        "relationship candidates",
        "graph plan",
        "unresolved relationships",
        "relationship gaps",
      ],
      exampleRecords: [
        "Application depends on data asset",
        "Vendor supports contract",
        "Program targets metric",
      ],
      qualityChecks: [
        "valid relationship type",
        "both endpoints present",
        "evidence attached",
        "tenant scoped",
      ],
      currentStatus:
        "Graph plans and summaries are part of the data runway; this page exposes the business meaning.",
      usedBy: ["Home", "Intelligence", "Moves", "Source", "Tower"],
      whatCanGoWrong: [
        "free-text note becomes a relationship type",
        "missing endpoint creates a dangling edge",
      ],
      guardrails: [
        "Relationship verbs must come from the governed dictionary.",
        "Relationships explain context; they do not calculate value.",
      ],
      internalName: "Enterprise Relationship Graph",
    },
    {
      id: "insights",
      navLabel: "Insights",
      title: "Insights",
      plainEnglish:
        "Insights are derived signals that help users see gaps, readiness, leverage, execution risk, and answerability. They are not realized business outcomes.",
      goesIn: [
        "known facts",
        "relationships",
        "evidence coverage",
        "module readiness checks",
        "candidate proof",
      ],
      comesOut: insightPolicy.allowedInsights,
      exampleRecords: [
        "evidence gap",
        "readiness gap",
        "sourcing leverage signal",
        "promotion blocker",
      ],
      qualityChecks: [
        "source trace",
        "no unsupported value claims",
        "module readiness proof",
        "candidate inactive check",
      ],
      currentStatus:
        "Insight types are catalogued; live insight generation remains governed by the existing module paths.",
      usedBy: ["Home", "Intelligence", "Moves", "Source", "Tower"],
      whatCanGoWrong: [
        "proposed savings reported as realized",
        "candidate-only signal shown as active truth",
      ],
      guardrails: insightPolicy.cannotClaim,
      internalName: "Derived Intelligence Store",
    },
    {
      id: "candidate-preview",
      navLabel: "Candidate Preview",
      title: "Candidate preview",
      plainEnglish:
        "Candidate Preview lets operators inspect an inactive data version before anything becomes active tenant truth.",
      goesIn: [
        "candidate version metadata",
        "proof bundle",
        "module preview packets",
        "quality checks",
      ],
      comesOut: [
        "read-only preview",
        "module readiness summary",
        "blocker list",
      ],
      exampleRecords: [
        "candidateVersionId",
        "modulePreview: Home",
        "blocker: missing rollback proof",
      ],
      qualityChecks: [
        "explicit preview request",
        "inactive banner",
        "no default module reads",
        "guardrail booleans false",
      ],
      currentStatus:
        "Preview runway exists; this page documents it and does not open preview sessions.",
      usedBy: [
        "Candidate Preview",
        "Home preview",
        "Intelligence preview",
        "Moves preview",
        "Source preview",
        "Tower preview",
      ],
      whatCanGoWrong: [
        "preview data is confused with active runtime",
        "default modules read candidate data",
      ],
      guardrails: [
        "Candidate data is inactive.",
        "Preview requires explicit selection.",
        "Candidate is not promoted by preview.",
      ],
    },
    {
      id: "promotion-readiness",
      navLabel: "Promotion Readiness",
      title: "Promotion readiness",
      plainEnglish:
        "Promotion Readiness is the approval gate that determines whether a candidate version is blocked, eligible, or ready for operator approval.",
      goesIn: [
        "candidate proof",
        "quality checks",
        "module readiness",
        "rollback plan",
        "operator approval requirement",
      ],
      comesOut: [
        "promotion decision record",
        "passed checks",
        "blockers",
        "rollback plan",
      ],
      exampleRecords: [
        "operatorApprovalRequired: true",
        "rollbackPlanRequired: true",
        "promotionEnabled: false",
      ],
      qualityChecks: [
        "rollback posture",
        "module readiness",
        "no active pointer update",
        "no production write",
      ],
      currentStatus:
        "Promotion gate proof exists in the data runway; this page is read-only and never promotes.",
      usedBy: ["Candidate Preview", "Admin Overview", "Promotion controls"],
      whatCanGoWrong: [
        "eligible is misread as active",
        "rollback is missing",
        "approval is skipped",
      ],
      guardrails: [
        "Promotion requires approval.",
        "Promotion readiness is not promotion.",
        "Rollback plan is required.",
      ],
      internalName: "Promotion Gate",
    },
    {
      id: "active-access",
      navLabel: "Active Access",
      title: "Active Home context and Active Access",
      plainEnglish:
        "Active Access is the governed pointer that says which tenant data version modules may read by default. Home context can show useful current state, but it is not active tenant truth unless that pointer is wired and proven.",
      goesIn: [
        "approved promotion decision",
        "active version pointer",
        "rollback metadata",
        "post-promotion proof",
      ],
      comesOut: [
        "default module context",
        "active source status",
        "runtime read proof",
      ],
      exampleRecords: [
        "activeVersionId",
        "lastPromotedAt",
        "postPromotionProofId",
      ],
      qualityChecks: [
        "active pointer present",
        "post-promotion module read proof",
        "rollback proof",
        "tenant isolation",
      ],
      currentStatus:
        "Show Not wired yet where active pointer evidence is not available.",
      usedBy: ["Home", "Intelligence", "Moves", "Source", "Tower"],
      whatCanGoWrong: [
        "Home context is treated as active truth without pointer proof",
        "rollback path is missing",
      ],
      guardrails: [
        "Active pointer must be explicit.",
        "Default module reads must be proven after promotion.",
      ],
      internalName: "Active Tenant Access Layer",
    },
    {
      id: "module-usage",
      navLabel: "Module Usage",
      title: "Module usage",
      plainEnglish:
        "Module Usage explains which layers each product surface can read, what it can write, and which claims it must not make.",
      goesIn: [
        "active context",
        "module memory",
        "evidence",
        "known facts",
        "relationships",
        "insights",
      ],
      comesOut: [
        "answers",
        "work plans",
        "sourcing recommendations",
        "outcome views",
        "module readiness",
      ],
      exampleRecords: [
        "Home summary",
        "Intelligence answer",
        "Moves phase readiness",
        "Source leverage signal",
        "Tower outcome metric",
      ],
      qualityChecks: [
        "page wiring",
        "claim support",
        "module readiness",
        "no candidate default read",
      ],
      currentStatus:
        "Mapped in this page; module runtime behavior is unchanged.",
      usedBy: ["Home", "Intelligence", "Moves", "Source", "Tower"],
      whatCanGoWrong: [
        "module makes unsupported claim",
        "module writes to the wrong layer",
        "candidate data appears by default",
      ],
      guardrails: [
        "Modules must declare reads and writes.",
        "No unsupported executive claims.",
        "No realized value without measured proof.",
      ],
      internalName: "Module Context and Module Memory",
    },
    {
      id: "outcome-ledger",
      navLabel: "Outcome Ledger",
      title: "Outcome ledger",
      plainEnglish:
        "The Outcome Ledger tracks promised versus measured value, adoption, risk, leakage, and operational impact after approval.",
      goesIn: [
        "approved value model",
        "measured outcomes",
        "baseline metrics",
        "control evidence",
      ],
      comesOut: [
        "promised value",
        "measured value",
        "variance",
        "leakage",
        "adoption status",
      ],
      exampleRecords: [
        "baseline: cost-to-serve",
        "measured: cycle time",
        "variance: pending measurement",
      ],
      qualityChecks: [
        "baseline present",
        "measurement source present",
        "time window present",
        "no proxy-as-realized claim",
      ],
      currentStatus:
        "Ledger concept is mapped; module-specific measured data must come from Tower/read models where wired.",
      usedBy: ["Tower", "Moves", "Home"],
      whatCanGoWrong: [
        "proposal is reported as realized",
        "proxy metric is treated as board-grade outcome",
      ],
      guardrails: [
        "Proposed value is not realized value.",
        "Tower owns measured outcome reporting.",
      ],
    },
    {
      id: "benchmarks",
      navLabel: "Benchmarks",
      title: "Benchmarks",
      plainEnglish:
        "Benchmarks provide comparison context for industry norms, performance ranges, cost ranges, maturity, and readiness thresholds.",
      goesIn: [
        "industry inputs",
        "metric definitions",
        "tenant facts",
        "external benchmark references",
      ],
      comesOut: [
        "comparison ranges",
        "maturity bands",
        "gap indicators",
        "caveats",
      ],
      exampleRecords: [
        "benchmarkFamily: contact center",
        "metric: first call resolution",
        "range: reference only",
      ],
      qualityChecks: [
        "source basis",
        "fit-to-client caveat",
        "no unsupported precision",
        "date/version present",
      ],
      currentStatus:
        "Benchmark inputs are catalogued; live benchmark rendering depends on module wiring.",
      usedBy: ["Home", "Intelligence", "Moves", "Source", "Tower"],
      whatCanGoWrong: [
        "generic benchmark treated as client measurement",
        "range lacks source basis",
      ],
      guardrails: [
        "Benchmarks are comparison context, not measured tenant truth.",
      ],
    },
    {
      id: "page-mapping",
      navLabel: "Page Mapping",
      title: "Page-to-layer mapping",
      plainEnglish:
        "This map tells operators which data layers each page reads, what each page is allowed to write, and which claims are blocked.",
      goesIn: [
        "page contract",
        "data layer contract",
        "guardrails",
        "current wiring status",
      ],
      comesOut: ["page-layer matrix", "write boundary", "caveats"],
      exampleRecords: [
        "Home reads active context",
        "Candidate Preview reads inactive candidate",
        "Tower reads outcome ledger",
      ],
      qualityChecks: [
        "page wiring checks",
        "write boundary checks",
        "claim boundary checks",
      ],
      currentStatus: "Implemented as a static read-only map on this page.",
      usedBy: ["Admin", "Implementation teams", "QA"],
      whatCanGoWrong: [
        "surface reads an unapproved layer",
        "page writes to production unexpectedly",
      ],
      guardrails: [
        "Every page must have a read/write boundary.",
        "Current wiring caveats must be visible.",
      ],
    },
    {
      id: "quality-checks",
      navLabel: "Quality Checks",
      title: "Quality checks",
      plainEnglish:
        "Quality checks explain what must be true before data moves from raw input to candidate, preview, promotion readiness, and active use.",
      goesIn: [
        "schemas",
        "accepted values",
        "evidence rules",
        "tenant rules",
        "module readiness rules",
      ],
      comesOut: ["passed checks", "failed checks", "blockers", "quarantines"],
      exampleRecords: qualityChecks.slice(0, 4).map((check) => check.label),
      qualityChecks: qualityChecks.map((check) => check.label),
      currentStatus:
        "Catalogue implemented; this page does not execute validations.",
      usedBy: ["Admin", "Candidate Preview", "Promotion Readiness"],
      whatCanGoWrong: [
        "quality is inferred from upload count",
        "missing evidence is not blocked",
      ],
      guardrails: [
        "Quality checks must produce explicit pass, fail, or Not wired yet status.",
      ],
    },
    {
      id: "guardrails",
      navLabel: "Guardrails",
      title: "Guardrails",
      plainEnglish:
        "Guardrails keep the platform honest about what has been uploaded, parsed, validated, previewed, promoted, measured, and proven.",
      goesIn: [
        "runtime booleans",
        "quality checks",
        "proof bundles",
        "release records",
        "operator approvals",
      ],
      comesOut: [
        "blocked actions",
        "visible caveats",
        "audit records",
        "safe wording",
      ],
      exampleRecords: guardrails.map((guardrail) => guardrail.statement),
      qualityChecks: [
        "no production write",
        "no candidate promotion",
        "no active pointer update",
        "no module runtime change",
      ],
      currentStatus:
        "Guardrail catalogue implemented for read-only visibility.",
      usedBy: ["Admin", "QA", "Release control", "All modules"],
      whatCanGoWrong: [
        "status language overclaims",
        "safe refusal is scored as failure",
        "candidate ready is called active ready",
      ],
      guardrails: ACTIVE_GUARDRAILS,
    },
  ];
}

function buildInputCategories(): DataJourneyInputCategory[] {
  const commonFileTypes = ["CSV", "XLSX", "DOCX", "PDF", "MD"];
  return [
    inputCategory(
      "enterprise-profile",
      "Enterprise Profile",
      "Establish the tenant identity, operating model, industries, regions, and enterprise context.",
      "Executive sponsor / implementation lead",
      commonFileTypes,
      ["tenant_name", "industry", "operating_model", "regions"],
      ["strategic_priorities", "known_constraints"],
      {
        tenant_name: "Example Enterprise",
        industry: "Utility",
        operating_model: "regulated operations",
      },
      "Known Facts",
      ["Home", "Intelligence"],
      "Improves executive summary, industry framing, and tenant-safe answer context.",
    ),
    inputCategory(
      "business-functions",
      "Business Functions",
      "Map the major business functions, service lines, and capability areas.",
      "Business architecture lead",
      commonFileTypes,
      ["function_name", "owner", "business_purpose"],
      ["criticality", "pain_points"],
      {
        function_name: "Customer operations",
        owner: "COO",
        business_purpose: "Service recovery",
      },
      "Known Facts",
      ["Home", "Moves", "Tower"],
      "Clarifies which areas are ready for diagnosis or value tracking.",
    ),
    inputCategory(
      "organization-ownership",
      "Organization / Ownership",
      "Identify sponsors, accountable owners, decision rights, and governance bodies.",
      "Program sponsor / PMO",
      commonFileTypes,
      ["owner_name", "role", "decision_right"],
      ["delegates", "approval_forum"],
      {
        owner_name: "Example Leader",
        role: "CIO",
        decision_right: "technology investment approval",
      },
      "Relationships",
      ["Home", "Moves", "Source"],
      "Reduces approval ambiguity and phase-gate blockers.",
    ),
    inputCategory(
      "workforce-personas",
      "Workforce & Personas",
      "Describe teams, roles, capacity, work patterns, and affected personas.",
      "HR / operating model lead",
      commonFileTypes,
      ["persona", "team", "work_type"],
      ["fte_count", "location", "skills"],
      {
        persona: "Service agent",
        team: "Contact center",
        work_type: "case resolution",
      },
      "Known Facts",
      ["Moves", "Source", "Tower"],
      "Supports operating model, labor baseline, and adoption readiness.",
    ),
    inputCategory(
      "applications-systems",
      "Applications & Systems",
      "Inventory core applications, platforms, ownership, lifecycle, and dependencies.",
      "Enterprise architecture lead",
      ["CSV", "XLSX", "JSON", "DOCX"],
      ["application_name", "owner", "business_function", "status"],
      ["vendor", "hosting_model", "lifecycle_stage"],
      {
        application_name: "Customer portal",
        owner: "Digital",
        business_function: "Customer operations",
      },
      "Known Facts",
      ["Home", "Intelligence", "Moves", "Source"],
      "Improves systems grounding and modernization dependency mapping.",
    ),
    inputCategory(
      "data-assets-integrations",
      "Data Assets & Integrations",
      "Map datasets, marts, interfaces, integration flows, owners, and quality constraints.",
      "Data architecture lead",
      ["CSV", "XLSX", "JSON", "DOCX"],
      ["data_asset", "owner", "source_system", "consumer"],
      ["refresh_cadence", "quality_issue", "sensitivity"],
      {
        data_asset: "Claims mart",
        owner: "Analytics",
        source_system: "Core platform",
      },
      "Relationships",
      ["Home", "Intelligence", "Moves"],
      "Identifies automation readiness and data foundation blockers.",
    ),
    inputCategory(
      "vendors-contracts",
      "Vendors & Contracts",
      "Capture vendor, contract, service, renewal, SLA, and commercial structure.",
      "Procurement / vendor management",
      ["CSV", "XLSX", "DOCX", "PDF"],
      ["vendor_name", "contract_name", "service_scope", "renewal_date"],
      ["annual_spend", "sla", "termination_terms"],
      {
        vendor_name: "Managed services provider",
        contract_name: "Analytics support",
        service_scope: "Run support",
      },
      "Known Facts",
      ["Source", "Tower", "Intelligence"],
      "Supports sourcing leverage, renewal risk, and spend opportunity analysis.",
    ),
    inputCategory(
      "spend-value",
      "Spend & Value",
      "Provide cost baselines, budget areas, value pools, and financial ownership.",
      "Finance / FP&A",
      ["CSV", "XLSX"],
      ["cost_area", "amount", "time_period", "owner"],
      ["budget_type", "value_driver", "confidence"],
      {
        cost_area: "Application support",
        amount: "planning estimate",
        time_period: "annual",
      },
      "Outcome Ledger",
      ["Home", "Source", "Tower"],
      "Enables value-at-stake framing without claiming realized savings.",
    ),
    inputCategory(
      "programs-initiatives",
      "Programs & Initiatives",
      "Inventory transformation programs, objectives, sponsors, status, risks, and dependencies.",
      "PMO / transformation office",
      commonFileTypes,
      ["program_name", "sponsor", "objective", "status"],
      ["budget", "milestones", "dependency"],
      {
        program_name: "Customer recovery modernization",
        sponsor: "COO",
        objective: "Improve recovery speed",
      },
      "Known Facts",
      ["Home", "Moves", "Tower"],
      "Feeds Moves candidates, readiness, and execution risk.",
    ),
    inputCategory(
      "ai-initiatives",
      "AI Initiatives",
      "Capture AI ideas, experiments, dependencies, risks, expected value, and governance state.",
      "AI office / technology lead",
      commonFileTypes,
      ["initiative_name", "business_problem", "owner", "status"],
      ["model_type", "data_dependency", "risk"],
      {
        initiative_name: "Agent assist",
        business_problem: "Reduce handle time",
        owner: "Customer technology",
      },
      "Insights",
      ["Home", "Intelligence", "Moves"],
      "Turns ideas into governed execution candidates and risk-aware prioritization.",
    ),
    inputCategory(
      "risks-controls",
      "Risks & Controls",
      "Map operational, security, compliance, data, vendor, and program risks to controls.",
      "Risk / compliance lead",
      commonFileTypes,
      ["risk_name", "risk_owner", "control_name", "severity"],
      ["control_status", "evidence_ref", "mitigation"],
      {
        risk_name: "Data quality drift",
        risk_owner: "Data governance",
        control_name: "quality gate",
      },
      "Relationships",
      ["Home", "Intelligence", "Moves", "Tower"],
      "Improves safe recommendations and gate readiness.",
    ),
    inputCategory(
      "relationships",
      "Relationships",
      "Explicitly connect objects such as applications, owners, vendors, contracts, data assets, programs, risks, and metrics.",
      "Enterprise architecture / data governance",
      ["CSV", "XLSX"],
      ["source_object", "relationship_type", "target_object"],
      ["evidence_ref", "confidence"],
      {
        source_object: "Customer portal",
        relationship_type: "depends on",
        target_object: "Customer profile data",
      },
      "Relationships",
      ["Home", "Intelligence", "Moves", "Source"],
      "Improves dependency reasoning and reduces stranded facts.",
    ),
    inputCategory(
      "evidence-sources",
      "Evidence Sources",
      "Register source documents, systems, workshops, decisions, and files that support facts and claims.",
      "Implementation lead / records owner",
      commonFileTypes,
      ["source_name", "source_type", "owner", "date"],
      ["system_of_record", "confidence", "access_notes"],
      {
        source_name: "Workshop notes",
        source_type: "SME session",
        owner: "Program lead",
      },
      "Evidence",
      ["All modules"],
      "Improves claim support and auditability.",
    ),
    inputCategory(
      "metric-definitions",
      "Metric Definitions",
      "Define KPIs, formulas, owners, units, cadence, baselines, and measurement sources.",
      "Performance management / finance",
      ["CSV", "XLSX", "DOCX"],
      ["metric_name", "definition", "owner", "unit"],
      ["baseline", "target", "source_system"],
      {
        metric_name: "Cycle time",
        definition: "elapsed time from intake to close",
        owner: "Operations",
      },
      "Outcome Ledger",
      ["Moves", "Tower", "Home"],
      "Prevents proxy metrics from being treated as measured outcomes.",
    ),
    inputCategory(
      "industry-benchmark-inputs",
      "Industry / Benchmark Inputs",
      "Provide approved external or internal benchmark references for comparison context.",
      "Strategy / benchmarking lead",
      commonFileTypes,
      ["benchmark_name", "metric", "source_basis", "date"],
      ["range", "peer_group", "caveat"],
      {
        benchmark_name: "Service benchmark",
        metric: "response time",
        source_basis: "industry study",
      },
      "Benchmarks",
      ["Home", "Intelligence", "Tower"],
      "Adds comparison context while preserving caveats.",
    ),
    inputCategory(
      "infrastructure-cloud-estate",
      "Infrastructure & Cloud Estate",
      "Inventory hosting, cloud, network, security, platform, and environment constraints.",
      "Infrastructure / cloud lead",
      ["CSV", "XLSX", "JSON", "DOCX"],
      ["platform", "owner", "environment", "criticality"],
      ["region", "security_zone", "constraint"],
      {
        platform: "Data platform",
        owner: "Infrastructure",
        environment: "production",
      },
      "Known Facts",
      ["Intelligence", "Moves", "Source"],
      "Shows feasibility blockers for automation and modernization.",
    ),
    inputCategory(
      "source-event-pack",
      "Source Event Pack",
      "Capture sourcing event scope, vendors, requirements, pricing, evaluation, approvals, and transition state.",
      "Sourcing lead",
      ["CSV", "XLSX", "DOCX", "PDF"],
      ["event_name", "scope", "supplier", "stage"],
      ["price_scenario", "risk", "approval_status"],
      {
        event_name: "Managed services sourcing",
        scope: "analytics support",
        supplier: "Vendor A",
      },
      "Module Memory",
      ["Source", "Tower"],
      "Enables end-to-end sourcing flow and value tracking.",
    ),
    inputCategory(
      "moves-program-pack",
      "Moves Program Pack",
      "Capture Move charter, phase evidence, gates, deliverables, decisions, risks, and readiness.",
      "Transformation lead / Move owner",
      ["CSV", "XLSX", "DOCX", "PDF", "MD"],
      ["move_name", "phase", "sponsor", "gate_status"],
      ["deliverable", "risk", "value_range"],
      {
        move_name: "AI recovery command",
        phase: "Design",
        sponsor: "Technology executive",
      },
      "Module Memory",
      ["Moves", "Tower"],
      "Supports governed phase execution and handoff.",
    ),
    inputCategory(
      "tower-outcome-pack",
      "Tower Outcome Pack",
      "Capture baselines, commitments, measurements, adoption, risk, leakage, and value tracking.",
      "Value office / finance",
      ["CSV", "XLSX", "DOCX"],
      ["outcome_name", "baseline", "measure", "period"],
      ["target", "actual", "confidence", "evidence_ref"],
      {
        outcome_name: "Cost-to-serve",
        baseline: "current baseline",
        measure: "monthly actual",
      },
      "Outcome Ledger",
      ["Tower", "Home"],
      "Separates proposed value from measured value after approval.",
    ),
  ];
}

function inputCategory(
  id: string,
  label: string,
  purpose: string,
  owner: string,
  acceptedFileTypes: string[],
  requiredFields: string[],
  optionalFields: string[],
  sampleRow: Record<string, string>,
  mappedLayer: string,
  moduleImpact: string[],
  readinessImpact: string,
): DataJourneyInputCategory {
  return {
    id,
    label,
    purpose,
    owner,
    acceptedFileTypes,
    requiredFields,
    optionalFields,
    sampleRow,
    mappedLayer,
    moduleImpact,
    readinessImpact,
  };
}

function buildPipelineSteps(): DataJourneyPipelineStep[] {
  return [
    pipelineStep(
      1,
      "Upload file",
      "A user or operator stages a file for review.",
      "uploaded source item",
      "Upload is not active truth.",
    ),
    pipelineStep(
      2,
      "Identify template/type",
      "The system classifies the file against known input categories.",
      "source type",
      "Unknown files need mapping before use.",
    ),
    pipelineStep(
      3,
      "Parse rows/document sections",
      "Rows, tabs, and document sections are extracted.",
      "parsed content",
      "Parsing does not imply validation.",
    ),
    pipelineStep(
      4,
      "Extract candidate records",
      "Business objects and fields are identified as candidates.",
      "candidate records",
      "Candidates are inactive.",
    ),
    pipelineStep(
      5,
      "Normalize fields",
      "Names, dates, statuses, amounts, and IDs are made consistent.",
      "normalized candidates",
      "Normalization must preserve original evidence.",
    ),
    pipelineStep(
      6,
      "Validate required fields",
      "Required fields and accepted values are checked.",
      "passed and failed validation",
      "Missing required fields block readiness.",
    ),
    pipelineStep(
      7,
      "Map to known object types",
      "Records are mapped to business object types and layers.",
      "mapped candidates",
      "Unmapped fields are stranded until remediated.",
    ),
    pipelineStep(
      8,
      "Attach evidence references",
      "Records keep links back to source files and rows.",
      "lineage links",
      "Unsupported claims must not pass through.",
    ),
    pipelineStep(
      9,
      "Quarantine bad records",
      "Records with missing, conflicting, or unsafe data are isolated.",
      "quarantine list",
      "Quarantine is safer than silent acceptance.",
    ),
    pipelineStep(
      10,
      "Generate known fact candidates",
      "Validated object attributes become candidate facts.",
      "fact candidates",
      "Candidate facts are not active facts.",
    ),
    pipelineStep(
      11,
      "Generate relationship candidates",
      "Valid object links become candidate relationships.",
      "relationship candidates",
      "Relationships require valid endpoints.",
    ),
    pipelineStep(
      12,
      "Generate insight candidates",
      "Coverage and readiness signals become candidate insights.",
      "insight candidates",
      "Insights cannot claim realized value.",
    ),
    pipelineStep(
      13,
      "Create inactive candidate version",
      "A complete candidate data version is persisted as inactive metadata.",
      "candidate version metadata",
      "No active pointer is updated.",
    ),
    pipelineStep(
      14,
      "Preview",
      "Operators inspect candidate data through explicit preview mode.",
      "preview packet",
      "Preview requires visible inactive-candidate caveats.",
    ),
    pipelineStep(
      15,
      "Promote only after approval",
      "Promotion is gated by approval, proof, and rollback readiness.",
      "promotion decision record",
      "Approval is required before active use.",
    ),
    pipelineStep(
      16,
      "Roll back if needed",
      "Operators can return to the prior active version after promotion.",
      "rollback plan",
      "Rollback posture must be known before activation.",
    ),
  ];
}

function pipelineStep(
  order: number,
  label: string,
  explanation: string,
  produces: string,
  guardrail: string,
): DataJourneyPipelineStep {
  return { order, label, explanation, produces, guardrail };
}

function buildInsightPolicy(): DataJourneyInsightPolicy {
  return {
    allowedInsights: [
      "evidence gaps",
      "readiness gaps",
      "relationship gaps",
      "answerability",
      "module readiness",
      "sourcing leverage signals",
      "program execution gaps",
      "outcome measurement gaps",
      "risk/control coverage gaps",
      "candidate promotion blockers",
    ],
    cannotClaim: [
      "no realized savings without measured proof",
      "no active tenant truth without active pointer",
      "no candidate data in default Home",
      "no runtime readiness without proof",
      "no uploaded-file count as data quality",
    ],
  };
}

function buildPageMappings(): DataJourneyPageMapping[] {
  return [
    pageMapping(
      "Admin Overview",
      [
        "setup-control read model",
        "upload state",
        "candidate status",
        "promotion readiness",
      ],
      ["setup notes where explicitly supported"],
      [
        "production tenant data",
        "candidate promotion",
        "Active Access pointer",
      ],
      ["tenant access", "setup-control availability"],
      ["uploaded files are not active facts"],
      "Partially wired; caveats should show when active pointer is unavailable.",
      ["Current status can be Not wired yet when proof metadata is absent."],
    ),
    pageMapping(
      "Data Intake Library",
      ["template catalogue", "guide artifacts", "field dictionary"],
      ["template selection metadata where supported"],
      ["validated facts", "active tenant truth", "promotion decision"],
      ["template registry", "guide artifacts"],
      ["downloaded template does not mean data loaded"],
      "Templates and guidance available; validation execution is out of scope.",
      ["A template is a contract, not evidence."],
    ),
    pageMapping(
      "Tenant Packet Builder",
      ["tenant packet contract", "template mappings", "source file manifest"],
      ["draft packet metadata where supported"],
      ["production tenant data", "active pointer", "module memory"],
      ["source adapters", "mapping versions"],
      ["selected templates are not validated records"],
      "Contract described; packet creation controls remain separate.",
      ["Packet exists only after explicit builder flow creates it."],
    ),
    pageMapping(
      "Candidate Preview",
      [
        "candidate version metadata",
        "preview packets",
        "proof bundle",
        "module readiness",
      ],
      ["preview audit event where implemented"],
      ["active tenant truth", "production data", "default module context"],
      ["explicit preview request", "inactive candidate banner"],
      ["candidate is inactive"],
      "Preview path exists; this explorer does not create preview sessions.",
      ["Preview-ready is not active-runtime-ready."],
    ),
    pageMapping(
      "Home",
      [
        "active Home context",
        "setup-control summary",
        "known facts",
        "gaps",
        "sources",
        "relationships",
      ],
      ["user-facing navigation state only"],
      [
        "candidate data by default",
        "production tenant data",
        "candidate promotion",
      ],
      ["active pointer proof where available", "safe caveats"],
      ["do not claim active tenant truth unless active pointer is wired"],
      "Home can show context; active truth status must remain caveated unless proven.",
      ["Active Home context is not enough by itself."],
    ),
    pageMapping(
      "Intelligence",
      [
        "governed answer context",
        "evidence",
        "known facts",
        "relationships",
        "insights",
      ],
      ["answer traces and citations where supported"],
      [
        "production tenant data",
        "candidate promotion",
        "unsupported executive claims",
      ],
      ["validated context bundle", "cite-render proof"],
      ["no raw context to models", "no unsupported claims"],
      "Runtime path unchanged by this PR.",
      ["Answers must cite or caveat."],
    ),
    pageMapping(
      "Moves",
      [
        "program memory",
        "phase evidence",
        "readiness",
        "relationships",
        "value baseline",
      ],
      ["phase artifacts and approvals where workflow supports them"],
      ["active data promotion", "realized value without Tower measurement"],
      ["phase gate contract", "evidence coverage"],
      ["execution state must be proven"],
      "Runtime path unchanged by this PR.",
      ["Gate readiness is not business outcome realization."],
    ),
    pageMapping(
      "Source",
      [
        "sourcing memory",
        "vendors/contracts",
        "requirements",
        "pricing evidence",
        "leverage insights",
      ],
      ["sourcing artifacts where workflow supports them"],
      [
        "production tenant data",
        "candidate promotion",
        "unsupported savings claims",
      ],
      ["Source event pack", "contract evidence"],
      ["no savings unless supported"],
      "Runtime path unchanged by this PR.",
      ["Addressable spend is not realized savings."],
    ),
    pageMapping(
      "Tower",
      [
        "outcome ledger",
        "metric definitions",
        "measured values",
        "controls",
        "variance",
      ],
      ["outcome reports where supported"],
      [
        "candidate promotion",
        "source file mutation",
        "unmeasured value claims",
      ],
      ["baseline proof", "measurement proof", "control evidence"],
      ["no realized value unless measured"],
      "Runtime path unchanged by this PR.",
      ["Tower must distinguish promised, projected, and measured values."],
    ),
  ];
}

function pageMapping(
  page: string,
  readsFrom: string[],
  writesTo: string[],
  doesNotWriteTo: string[],
  dependsOn: string[],
  guardrails: string[],
  currentWiringStatus: string,
  caveats: string[],
): DataJourneyPageMapping {
  return {
    page,
    readsFrom,
    writesTo,
    doesNotWriteTo,
    dependsOn,
    guardrails,
    currentWiringStatus,
    caveats,
  };
}

function buildQualityChecks(): DataJourneyQualityCheck[] {
  return [
    qualityCheck(
      "template-schema",
      "Template/schema validation",
      "Checks whether the file matches a known contract.",
      ["Input Files", "Tenant Packet"],
      "Expected before candidate generation.",
      "Wrong template produces stranded or misread fields.",
    ),
    qualityCheck(
      "required-fields",
      "Required-field validation",
      "Confirms the minimum fields needed for safe use.",
      ["Validation", "Known Facts"],
      "Expected before readiness.",
      "Thin records pass without enough context.",
    ),
    qualityCheck(
      "accepted-values",
      "Accepted-value validation",
      "Checks fields such as status, criticality, and phase against allowed values.",
      ["Validation"],
      "Expected before mapping.",
      "Uncontrolled vocabulary breaks downstream grouping.",
    ),
    qualityCheck(
      "evidence-attachment",
      "Evidence attachment",
      "Ensures records keep source references.",
      ["Evidence", "Known Facts", "Insights"],
      "Required for agent-ready context.",
      "Unsupported claims reach users.",
    ),
    qualityCheck(
      "quarantine",
      "Quarantine checks",
      "Blocks records with missing, conflicting, unsafe, or unmapped data.",
      ["Parsing & Extraction", "Validation"],
      "Expected for bad records.",
      "Bad records are silently accepted.",
    ),
    qualityCheck(
      "duplicate-detection",
      "Duplicate detection",
      "Identifies repeated objects and conflicting records.",
      ["Known Facts", "Relationships"],
      "Available where object keys are present.",
      "Duplicate systems or vendors inflate counts.",
    ),
    qualityCheck(
      "tenant-isolation",
      "Tenant isolation",
      "Confirms all objects are scoped to the active tenant.",
      ["All layers"],
      "Required.",
      "Cross-tenant leakage.",
    ),
    qualityCheck(
      "candidate-inactive",
      "Candidate inactive checks",
      "Confirms candidate data does not become active by default.",
      ["Candidate Preview", "Promotion Readiness"],
      "Required.",
      "Preview data is read by default modules.",
    ),
    qualityCheck(
      "promotion-readiness",
      "Promotion readiness",
      "Checks proof, blockers, approval, and rollback posture.",
      ["Promotion Readiness"],
      "Required before promotion.",
      "Eligible candidate is mistaken for promoted data.",
    ),
    qualityCheck(
      "rollback-posture",
      "Rollback posture",
      "Confirms prior active state and rollback plan are documented.",
      ["Promotion Readiness", "Active Access"],
      "Required before active switch.",
      "No safe return path after promotion.",
    ),
    qualityCheck(
      "module-readiness",
      "Module readiness",
      "Checks whether modules can safely inspect or read the layer.",
      ["Module Usage"],
      "Required before module claims.",
      "Runtime-ready is overclaimed.",
    ),
    qualityCheck(
      "page-wiring",
      "Page wiring checks",
      "Confirms each page reads and writes only approved layers.",
      ["Page Mapping"],
      "Expected for new surfaces.",
      "Page writes to the wrong layer.",
    ),
    qualityCheck(
      "no-example-as-live",
      "No example data as live facts",
      "Ensures illustrative rows are labeled as examples and not reported as tenant truth.",
      ["All UI sections"],
      "Required.",
      "Example content becomes a live claim.",
    ),
    qualityCheck(
      "no-retired-version-labels",
      "No retired version-label UI language",
      "Keeps user-facing data-layer language business-readable.",
      ["Admin UI", "Reports"],
      "Required for this explorer.",
      "Users see implementation history instead of product meaning.",
    ),
  ];
}

function qualityCheck(
  id: string,
  label: string,
  purpose: string,
  appliesTo: string[],
  currentStatus: string,
  failureMode: string,
): DataJourneyQualityCheck {
  return { id, label, purpose, appliesTo, currentStatus, failureMode };
}

function buildGuardrails(): DataJourneyGuardrail[] {
  return [
    guardrail(
      "uploaded-not-active",
      "Uploaded file does not equal active fact.",
      "Files are raw evidence until parsed, validated, mapped, and accepted.",
      ["Data Intake Library", "Quality checks"],
      "documented",
    ),
    guardrail(
      "parsed-not-promoted",
      "Parsed row does not equal promoted truth.",
      "Parsing creates candidates, not active data.",
      ["Parsing & Extraction", "Validation"],
      "documented",
    ),
    guardrail(
      "candidate-inactive",
      "Candidate data is inactive.",
      "Candidate versions must not be read by default modules.",
      ["Candidate Preview", "Promotion Readiness"],
      "implemented",
    ),
    guardrail(
      "approval-required",
      "Promotion requires approval.",
      "Operator approval and rollback posture protect active truth.",
      ["Promotion Readiness"],
      "implemented",
    ),
    guardrail(
      "preview-not-runtime",
      "Module preview does not mean runtime-ready.",
      "Preview proves inspection, not default module consumption.",
      ["Candidate Preview", "Module Usage"],
      "implemented",
    ),
    guardrail(
      "proposed-not-realized",
      "Proposed value does not mean realized value.",
      "Measured outcomes require Tower/read-model proof.",
      ["Outcome Ledger", "Tower"],
      "documented",
    ),
    guardrail(
      "home-context-caveat",
      "Home active context is not active tenant truth unless the active pointer is wired and proven.",
      "A useful Home view can still be upstream of active data promotion.",
      ["Home", "Active Access"],
      "documented",
    ),
    guardrail(
      "no-production-write",
      "This explorer does not write production tenant data.",
      "The page is for explanation, not execution.",
      ["Admin Data Layer Explorer"],
      "implemented",
    ),
    guardrail(
      "no-runtime-change",
      "This explorer does not change module runtime behavior.",
      "Product modules continue to use their existing approved paths.",
      ["Home", "Intelligence", "Moves", "Source", "Tower"],
      "implemented",
    ),
  ];
}

function guardrail(
  id: string,
  statement: string,
  reason: string,
  enforcedBy: string[],
  status: DataJourneyGuardrail["status"],
): DataJourneyGuardrail {
  return { id, statement, reason, enforcedBy, status };
}
