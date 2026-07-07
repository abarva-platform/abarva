import type { ClientKey } from "@/lib/client-config";
import { getClientOption } from "@/lib/client-config";
import {
  SEGMENT_KEYS,
  parseIngestionMessage,
  type SegmentKey,
} from "@/lib/ingestion/azure-landing-zone-types";
import { evaluateSensitiveUpload } from "@/lib/security/sensitive-upload-guard";
import {
  NORTHSTAR_CONTEXT_TEMPLATES,
  SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  type ContextTemplateDefinition,
} from "@/lib/context-ingestion/template-registry";
import { validateExtractedFacts } from "@/lib/context-ingestion/validation-engine";
import type {
  FileClassification,
  ExtractedContextFact,
} from "@/lib/context-ingestion/types";
import {
  ENTERPRISE_CONTEXT_TEMPLATE_TENANTS,
  ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
  ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS,
  type EnterpriseContextTemplateWorkbook,
} from "@/lib/enterprise-context/template-schema";
import {
  buildPilotIngestionAuditOnlyWritePlan,
  evaluatePilotIngestionCommitReadiness,
  getPilotIngestionLedgerTables,
  planPilotIngestionRollback,
} from "@/lib/admin/pilot-ingestion-ledger";
import apexManifest from "../../../docs/enterprise-context/templates/apexretail/manifest.json";
import meridianManifest from "../../../docs/enterprise-context/templates/meridian/manifest.json";
import arcturusManifest from "../../../docs/enterprise-context/templates/arcturus/manifest.json";

export type DataLoadGateStatus = "ready" | "needs_configuration" | "monitored";
export type PilotVerifierHopStatus =
  | "live_ready"
  | "stub_fail_closed"
  | "blocked";

export interface DataLoadRehearsalGate {
  id: string;
  label: string;
  objective: string;
  proof: string;
  existingPath: string;
  status: DataLoadGateStatus;
}

export interface DataLoadTemplateRow {
  id: string;
  family: "Context registry" | "Day One workbook";
  dimension: string;
  title: string;
  formats: string;
  requiredFields: string;
  optionalFields: string;
  ownerOrSource: string;
  cadenceOrDomain: string;
  unlocks: string;
}

export interface DataLoadDimensionCatalogItem {
  id: string;
  dimension: string;
  label: string;
  summary: string;
  completenessPercent: number;
  currentGate: string;
  nextAction: string;
  unlocks: string;
  templateCount: number;
  formats: ReadonlyArray<string>;
  templates: ReadonlyArray<string>;
  requiredFields: ReadonlyArray<string>;
  ownerOrSource: string;
  primaryAction: {
    label: string;
    href: string;
  };
}

export interface EnterpriseContextManifestWorkbook {
  key: string;
  title: string;
  path: string;
  columns: string[];
}

export interface EnterpriseContextTemplateManifest {
  tenantKey: string;
  tenantSlug: string;
  displayName: string;
  version: string;
  generatedAt: string;
  workbookCount: number;
  commonColumns: string[];
  workbooks: EnterpriseContextManifestWorkbook[];
}

export interface SetupDataLoadCenterModel {
  tenant: {
    clientId: string;
    clientKey: ClientKey;
    tenantName: string;
    vertical: string;
  };
  singleClientBoundary: {
    label: string;
    assertion: string;
    activeClientId: string;
    activeClientKey: ClientKey;
    denialRule: string;
  };
  metrics: {
    rehearsalGates: number;
    setupSegments: number;
    contextRegistryTemplates: number;
    dayOneWorkbooks: number;
  };
  privateDataPlane: {
    queueSchema: "abarva.ingestion.v1";
    sampleSegment: SegmentKey;
    sampleMessageAccepted: boolean;
    uploadGuardDecision: "allow" | "quarantine";
    validationProbeFindings: number;
  };
  pilotVerifier: {
    schema: "abarva.pilot-data-plane-verification.v1";
    mode: "stub-aware";
    command: "npm run verify:pilot-data-plane";
    liveCommand: "npm run verify:pilot-data-plane -- --live";
    posture: DataLoadGateStatus;
    summary: {
      liveReady: number;
      stubFailClosed: number;
      blocked: number;
      exitCode: 0 | 1;
    };
    hops: ReadonlyArray<{
      id: string;
      label: string;
      status: PilotVerifierHopStatus;
      configuredKeyCount: number;
      missingKeyGroupCount: number;
      nextAction: string;
    }>;
  };
  loaderReadiness: ReadonlyArray<{
    id: string;
    label: string;
    status: DataLoadGateStatus;
    detail: string;
    nextAction: string;
    href: string | null;
  }>;
  launchActions: ReadonlyArray<{
    id: string;
    label: string;
    detail: string;
    href: string;
    kind: "primary" | "secondary";
  }>;
  tenantManifest: EnterpriseContextTemplateManifest | null;
  manifestCoverage: ReadonlyArray<{
    tenantKey: string;
    displayName: string;
    workbookCount: number;
    version: string;
  }>;
  rehearsalGates: ReadonlyArray<DataLoadRehearsalGate>;
  workflowControls: ReadonlyArray<{
    id: string;
    label: string;
    stage: string;
    operatorAction: string;
    control: string;
    href: string | null;
    apiPath: string;
    status: DataLoadGateStatus;
  }>;
  reloadCommandPlan: ReadonlyArray<{
    id: string;
    stage: string;
    operatorAction: string;
    azureOrSystemAction: string;
    requiredCheck: string;
    approvalOrCommunication: string;
    status: DataLoadGateStatus;
  }>;
  exceptionIntake: {
    supportedFormats: ReadonlyArray<string>;
    metadataRequirements: ReadonlyArray<string>;
    rule: string;
    clarificationQueueHref: string;
  };
  dimensionCatalog: ReadonlyArray<DataLoadDimensionCatalogItem>;
  templateRows: ReadonlyArray<DataLoadTemplateRow>;
  dimensionReadiness: ReadonlyArray<{
    dimension: string;
    completenessPercent: number;
    currentGate: string;
    nextAction: string;
    unlocks: string;
  }>;
  workQueue: ReadonlyArray<{
    id: string;
    title: string;
    detail: string;
    severity: "ready" | "attention" | "blocked";
  }>;
}

const ENTERPRISE_CONTEXT_MANIFESTS = [
  apexManifest,
  meridianManifest,
  arcturusManifest,
] as readonly EnterpriseContextTemplateManifest[];

const MANIFEST_KEY_BY_CLIENT_KEY: Partial<Record<ClientKey, string>> = {
  apexretail: "apexretail",
  meridian: "meridian",
  arcturus: "arcturus",
};

const REHEARSAL_GATES: ReadonlyArray<DataLoadRehearsalGate> = [
  {
    id: "sso",
    label: "SSO and admin access",
    objective:
      "Admin enters through Clerk and the tenant resolver before seeing setup controls.",
    proof:
      "resolveAdminTenant and requireTenancy keep the page pinned to the active client.",
    existingPath: "src/lib/admin/admin-tenant.ts",
    status: "ready",
  },
  {
    id: "consent",
    label: "Consent and role boundary",
    objective:
      "Only upload-capable admins can send files into tenant data lanes.",
    proof:
      "Tower upload enforces tenant match and upload permission before storage.",
    existingPath: "src/app/api/tower/upload/route.ts",
    status: "ready",
  },
  {
    id: "storage",
    label: "Client-scoped landing zone",
    objective: "Pilot files land as tenant-keyed Azure landing-zone events.",
    proof:
      "Queue messages carry tenantClientKey, segmentKey, storage path, hash, and producer metadata.",
    existingPath: "src/lib/ingestion/azure-landing-zone-types.ts",
    status: "ready",
  },
  {
    id: "quarantine",
    label: "Sensitive upload guard",
    objective:
      "PHI, PII, and financial identifiers are stopped before storage/indexing.",
    proof:
      "evaluateSensitiveUpload runs before context CSV and Tower persistence.",
    existingPath: "src/lib/security/sensitive-upload-guard.ts",
    status: "ready",
  },
  {
    id: "processing",
    label: "Queue processing",
    objective:
      "Landing-zone events can be downloaded, scanned, audited, and routed to the pipeline.",
    proof:
      "consumeOneMessage returns accepted, quarantined, rejected, or transient failure outcomes.",
    existingPath: "src/lib/ingestion/azure-landing-zone-consumer.ts",
    status: "monitored",
  },
  {
    id: "validation",
    label: "Template validation",
    objective:
      "Loaded rows must satisfy the matching template before approval.",
    proof:
      "validation-engine checks required fields, numeric values, owners, and enum values.",
    existingPath: "src/lib/context-ingestion/validation-engine.ts",
    status: "ready",
  },
  {
    id: "availability",
    label: "Available to assistants",
    objective:
      "Approved context becomes evidence-backed substrate for Source, Moves, Tower, and Intelligence.",
    proof:
      "Context upload connector persists tenant facts and evidence rows through the existing context layer.",
    existingPath: "src/app/api/admin/context-layer/csv-upload/route.ts",
    status: "needs_configuration",
  },
];

const WORKFLOW_CONTROLS: SetupDataLoadCenterModel["workflowControls"] = [
  {
    id: "upload-context-csv",
    label: "Load structured context",
    stage: "Upload",
    operatorAction:
      "Choose a dimension and template, then upload the matching tenant context file.",
    control: "Context upload workspace",
    href: "/admin/context-layer/uploads",
    apiPath: "/api/admin/context-layer/csv-upload",
    status: "ready",
  },
  {
    id: "upload-operational-file",
    label: "Load operational file",
    stage: "Upload",
    operatorAction:
      "Send Excel, PDF, JSON, or billing-style extracts through classification and ingest.",
    control: "Data console upload workflow",
    href: "/platform/data/new",
    apiPath: "/api/data/upload",
    status: "ready",
  },
  {
    id: "landing-zone-worker",
    label: "Process landing-zone event",
    stage: "Scan and process",
    operatorAction:
      "Private workers scan, audit, and route the tenant-keyed file before validation.",
    control: "Private processing lane",
    href: null,
    apiPath: "src/lib/ingestion/azure-landing-zone-consumer.ts",
    status: "monitored",
  },
  {
    id: "quarantine-review",
    label: "Review quarantine",
    stage: "Quarantine",
    operatorAction:
      "Release or delete files held by sensitive-data and malware controls before parsing continues.",
    control: "Quarantine review",
    href: "/platform/admin/quarantine",
    apiPath: "/api/admin/quarantine/[id]/release",
    status: "needs_configuration",
  },
  {
    id: "template-validation",
    label: "Validate template fit",
    stage: "Validate",
    operatorAction:
      "Check required fields, schema mismatches, unknown columns, and evidence locators before approval.",
    control: "Template validation",
    href: "/admin/context-layer/approval-queue",
    apiPath: "src/lib/context-ingestion/validation-engine.ts",
    status: "ready",
  },
  {
    id: "approval-queue",
    label: "Approve for use",
    stage: "Approve",
    operatorAction:
      "Send blocked loads to the named approval queue before assistants can use the evidence.",
    control: "Approval queue",
    href: "/admin/programs/approvals",
    apiPath: "/api/admin/programs/approvals",
    status: "ready",
  },
  {
    id: "commit-ledger",
    label: "Commit or roll back",
    stage: "Commit",
    operatorAction:
      "Commit only when quarantine, clarification, approval, and idempotency gates are clean.",
    control: "Load ledger",
    href: "/admin/data-trust",
    apiPath: "src/lib/admin/pilot-ingestion-ledger.ts",
    status: "monitored",
  },
];

function buildReloadCommandPlan(): SetupDataLoadCenterModel["reloadCommandPlan"] {
  return [
    {
      id: "scope-client",
      stage: "1",
      operatorAction:
        "Confirm the active client at the top of Admin before selecting any dimension.",
      azureOrSystemAction:
        "Tenant resolver pins every load run to the active client id and client key.",
      requiredCheck:
        "Reject any request whose submitted client id differs from the active Admin tenant.",
      approvalOrCommunication:
        "Show the client name in every load, approval, notification, and export.",
      status: "ready",
    },
    {
      id: "choose-template",
      stage: "2",
      operatorAction:
        "Pick a dimension template, or mark the file as a controlled exception.",
      azureOrSystemAction:
        "Template registry selects row parser, workbook parser, JSON parser, document fact parser, slide fact parser, or archive manifest path.",
      requiredCheck:
        "Canonical fields, owner, cadence, sensitivity, and parser mode must be known before upload can proceed.",
      approvalOrCommunication:
        "Exception files pause in the clarification queue until metadata is complete.",
      status: "ready",
    },
    {
      id: "attest-upload",
      stage: "3",
      operatorAction:
        "Accept the data-load disclaimer, declare sensitivity, and upload files for this client only.",
      azureOrSystemAction:
        "Azure Blob landing-zone event carries tenantClientKey, segmentKey, storage path, hash, classification, and producer metadata.",
      requiredCheck:
        "Attestation, uploader, timestamp, file hash, and dimension are written before processing starts.",
      approvalOrCommunication:
        "Uploader sees the accepted/quarantined state and the approver receives an in-app/email notification when configured.",
      status: "monitored",
    },
    {
      id: "scan-parse",
      stage: "4",
      operatorAction:
        "Review quarantine holds or processing anomalies before any parse is committed.",
      azureOrSystemAction:
        "Defender/Purview-style malware and restricted-data scans run before native parsers and Azure Document Intelligence-style document extraction.",
      requiredCheck:
        "PHI, PII, payment-card, DOB, malware, schema drift, and parser confidence gates must be clean or triaged.",
      approvalOrCommunication:
        "Quarantine and anomaly cases notify data reviewer and block commit while open.",
      status: "needs_configuration",
    },
    {
      id: "approve-commit",
      stage: "5",
      operatorAction:
        "Preview extracted rows/facts, answer schema clarifications, then approve commit with rationale.",
      azureOrSystemAction:
        "Approved data commits to the client-scoped Postgres/search substrate with provenance, freshness, sensitivity, and source locators.",
      requiredCheck:
        "No open quarantine, no unresolved schema clarification, approval captured, and idempotency conflict cleared.",
      approvalOrCommunication:
        "Admins are notified when processing is done; outputs and deliverables become visible from Admin explorers.",
      status: "monitored",
    },
  ];
}

function buildExceptionIntake(): SetupDataLoadCenterModel["exceptionIntake"] {
  const metadata = new Set<string>();
  for (const template of NORTHSTAR_CONTEXT_TEMPLATES) {
    for (const requirement of template.exceptionMetadataRequirements ?? []) {
      metadata.add(requirement.label);
    }
  }

  return {
    supportedFormats: SUPPORTED_CONTEXT_UPLOAD_FORMATS.map((format) =>
      format.toUpperCase(),
    ),
    metadataRequirements: [...metadata],
    rule:
      "A nonmatching client file can be accepted only as a controlled exception; processing pauses until owner, sensitivity, parser instructions, field/page/sheet mapping, and authoritative source context are complete.",
    clarificationQueueHref: "/admin/context-layer/approval-queue",
  };
}

const PILOT_VERIFIER_HOPS = [
  {
    id: "sso",
    label: "SSO and role binding",
    required: [["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"], ["CLERK_SECRET_KEY"]],
  },
  {
    id: "blob",
    label: "Private Azure Blob landing zone",
    required: [
      [
        "AZURE_BLOB_CONNECTION_STRING",
        "DATA_PLANE_OBJECT_STORE_CONNECTION_STRING",
        "AZURE_OBJECT_STORAGE_CONNECTION_STRING",
        "AZURE_STORAGE_CONNECTION_STRING",
      ],
      [
        "AZURE_BLOB_LANDING_CONTAINER",
        "DATA_PLANE_OBJECT_STORE_CONTAINER",
        "AZURE_OBJECT_STORAGE_CONTAINER",
      ],
    ],
  },
  {
    id: "queue",
    label: "Durable processing queue",
    required: [
      [
        "AZURE_QUEUE_CONNECTION_STRING",
        "AZURE_SERVICE_BUS_CONNECTION_STRING",
        "VERCEL_QUEUE_TOKEN",
      ],
      [
        "AZURE_QUEUE_NAME",
        "AZURE_SERVICE_BUS_QUEUE_NAME",
        "VERCEL_QUEUE_INGESTION_TOPIC",
      ],
    ],
  },
  {
    id: "database",
    label: "Client-scoped Postgres data plane",
    required: [["DATABASE_URL"]],
  },
  {
    id: "audit",
    label: "Immutable audit and ingestion ledger",
    required: [["DATABASE_URL"]],
  },
  {
    id: "scan",
    label: "Malware and restricted-data scan gate",
    required: [["AZURE_DEFENDER_SCAN_MODE"]],
  },
  {
    id: "search",
    label: "Approved-data search index",
    required: [
      ["AZURE_SEARCH_ENDPOINT", "AZURE_AI_SEARCH_ENDPOINT"],
      ["AZURE_SEARCH_INDEX_NAME", "AZURE_AI_SEARCH_INDEX_NAME"],
    ],
  },
  {
    id: "notifications",
    label: "In-app and email notification fan-out",
    required: [["RESEND_API_KEY"], ["RESEND_FROM"]],
  },
  {
    id: "admin_access",
    label: "Role-gated admin access",
    required: [["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"], ["CLERK_SECRET_KEY"]],
  },
] as const;

type EnvMap = Record<string, string | undefined>;

function compactList(values: ReadonlyArray<string>, limit = 4): string {
  if (values.length <= limit) return values.join(", ");
  return `${values.slice(0, limit).join(", ")} +${values.length - limit}`;
}

function fromContextTemplate(
  template: ContextTemplateDefinition,
): DataLoadTemplateRow {
  return {
    id: `context:${template.id}`,
    family: "Context registry",
    dimension: template.dimension,
    title: template.label,
    formats: template.acceptedFormats.join(", "),
    requiredFields: compactList(template.requiredFields, 5),
    optionalFields: compactList(template.optionalFields, 4) || "None",
    ownerOrSource: template.ownerRole,
    cadenceOrDomain: template.refreshCadence,
    unlocks: compactList(template.unlocks, 2),
  };
}

function fromEnterpriseWorkbook(
  workbook: EnterpriseContextTemplateWorkbook,
): DataLoadTemplateRow {
  const requiredFields = workbook.columns
    .filter((column) => column.required)
    .map((column) => column.key);
  const optionalFields = workbook.columns
    .filter((column) => !column.required)
    .map((column) => column.key);

  return {
    id: `day-one:${workbook.key}`,
    family: "Day One workbook",
    dimension: workbook.domain,
    title: workbook.title,
    formats: "xlsx, csv",
    requiredFields: compactList(requiredFields, 5),
    optionalFields: compactList(optionalFields, 4) || "None",
    ownerOrSource: compactList(workbook.sourceSystems, 3),
    cadenceOrDomain: workbook.domain,
    unlocks: workbook.description,
  };
}

function buildTemplateRows(): DataLoadTemplateRow[] {
  return [
    ...NORTHSTAR_CONTEXT_TEMPLATES.map(fromContextTemplate),
    ...ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.map(fromEnterpriseWorkbook),
  ].sort(
    (a, b) =>
      a.family.localeCompare(b.family) || a.title.localeCompare(b.title),
  );
}

function buildDimensionReadiness(): SetupDataLoadCenterModel["dimensionReadiness"] {
  return [
    {
      dimension: "Application portfolio",
      completenessPercent: 72,
      currentGate: "Template validation",
      nextAction: "Resolve 2 owner fields",
      unlocks: "Intelligence, Moves, Tower",
    },
    {
      dimension: "Vendor contracts",
      completenessPercent: 100,
      currentGate: "Committed",
      nextAction: "None",
      unlocks: "Source, Tower",
    },
    {
      dimension: "ERP landscape",
      completenessPercent: 48,
      currentGate: "Upload scan",
      nextAction: "Retry malware scan",
      unlocks: "Moves, Tower",
    },
    {
      dimension: "Org roles and teams",
      completenessPercent: 81,
      currentGate: "Approval",
      nextAction: "Approver signoff",
      unlocks: "All assistants",
    },
  ];
}

const DIMENSION_COPY: Record<string, { label: string; summary: string }> = {
  application_portfolio: {
    label: "Application portfolio",
    summary:
      "Systems, owners, lifecycle, criticality, and service relationships.",
  },
  "Application portfolio": {
    label: "Application portfolio",
    summary:
      "Systems, owners, lifecycle, criticality, and service relationships.",
  },
  vendor_contracts: {
    label: "Vendor contracts",
    summary:
      "Supplier agreements, renewal dates, spend terms, and contract controls.",
  },
  "Vendor contracts": {
    label: "Vendor contracts",
    summary:
      "Supplier agreements, renewal dates, spend terms, and contract controls.",
  },
  erp_landscape: {
    label: "ERP landscape",
    summary:
      "Finance, procurement, inventory, and operational system extracts.",
  },
  "ERP landscape": {
    label: "ERP landscape",
    summary:
      "Finance, procurement, inventory, and operational system extracts.",
  },
  org_roles_teams: {
    label: "Org roles and teams",
    summary: "Named owners, approvers, teams, and accountable operating roles.",
  },
  "Org roles and teams": {
    label: "Org roles and teams",
    summary: "Named owners, approvers, teams, and accountable operating roles.",
  },
};

const DAY_ONE_DIMENSION_ALIASES: Record<string, string> = {
  application_portfolio: "application_portfolio",
  application_portfolio_: "application_portfolio",
  application_portfolio_and_services: "application_portfolio",
  vendor_contracts: "vendor_contracts",
  erp_landscape: "erp_landscape",
  org_roles_and_teams: "org_roles_teams",
  org_roles_teams: "org_roles_teams",
  applications: "application_portfolio",
  cmdb: "application_portfolio",
  vendor_management: "vendor_contracts",
  vendor: "vendor_contracts",
  contracts: "vendor_contracts",
  finance: "erp_landscape",
  financial: "erp_landscape",
  procurement: "erp_landscape",
  organization: "org_roles_teams",
  org: "org_roles_teams",
  people: "org_roles_teams",
};

function normalizeDimensionKey(dimension: string): string {
  const key = dimension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  return DAY_ONE_DIMENSION_ALIASES[key] ?? key;
}

function splitCsvList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.toUpperCase());
}

function firstRequiredFields(
  rows: ReadonlyArray<DataLoadTemplateRow>,
): string[] {
  const fields = new Set<string>();
  for (const row of rows) {
    for (const field of row.requiredFields.split(",")) {
      const clean = field.trim();
      if (!clean || clean.startsWith("+")) continue;
      fields.add(clean);
      if (fields.size >= 5) return [...fields];
    }
  }
  return [...fields];
}

function buildDimensionCatalog(
  templateRows: ReadonlyArray<DataLoadTemplateRow>,
  readinessRows: SetupDataLoadCenterModel["dimensionReadiness"],
): DataLoadDimensionCatalogItem[] {
  return readinessRows.map((readiness) => {
    const dimensionKey = normalizeDimensionKey(readiness.dimension);
    const relatedTemplates = templateRows.filter((template) => {
      const templateDimension = normalizeDimensionKey(template.dimension);
      return (
        templateDimension === dimensionKey ||
        templateDimension === normalizeDimensionKey(readiness.dimension)
      );
    });
    const formatSet = new Set<string>();
    relatedTemplates.forEach((template) => {
      splitCsvList(template.formats).forEach((format) => formatSet.add(format));
    });
    const copy =
      DIMENSION_COPY[dimensionKey] ?? DIMENSION_COPY[readiness.dimension];

    return {
      id: dimensionKey.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
      dimension: dimensionKey,
      label: copy?.label ?? readiness.dimension,
      summary:
        copy?.summary ??
        "Template-backed records that determine what assistants can safely use.",
      completenessPercent: readiness.completenessPercent,
      currentGate: readiness.currentGate,
      nextAction: readiness.nextAction,
      unlocks: readiness.unlocks,
      templateCount: relatedTemplates.length,
      formats: [...formatSet].sort(),
      templates: relatedTemplates.slice(0, 4).map((template) => template.title),
      requiredFields: firstRequiredFields(relatedTemplates),
      ownerOrSource: compactList(
        [
          ...new Set(
            relatedTemplates.map((template) => template.ownerOrSource),
          ),
        ],
        2,
      ),
      primaryAction: {
        label:
          readiness.currentGate === "Committed" ? "Review load" : "Start load",
        href: "/admin/context-layer/uploads",
      },
    };
  });
}

function buildWorkQueue(): SetupDataLoadCenterModel["workQueue"] {
  return [
    {
      id: "approve-org-roles",
      title: "Approve org roles preview",
      detail: "81% complete. No quarantine cases. Approver action required.",
      severity: "attention",
    },
    {
      id: "answer-application-owner-gaps",
      title: "Answer application owner gaps",
      detail: "2 required fields missing before the load can commit.",
      severity: "blocked",
    },
    {
      id: "retry-erp-malware-scan",
      title: "Retry ERP malware scan",
      detail: "Scan failed. Parsing is blocked until clean.",
      severity: "blocked",
    },
  ];
}

function hasEnv(env: EnvMap, key: string): boolean {
  return typeof env[key] === "string" && env[key]?.trim().length > 0;
}

function buildPilotVerifierPosture(
  env: EnvMap,
): SetupDataLoadCenterModel["pilotVerifier"] {
  const hops: SetupDataLoadCenterModel["pilotVerifier"]["hops"] =
    PILOT_VERIFIER_HOPS.map((hop) => {
    const missingGroups = hop.required.filter(
      (group) => !group.some((key) => hasEnv(env, key)),
    );
    const configuredKeyCount = hop.required.filter((group) =>
      group.some((key) => hasEnv(env, key)),
    ).length;
    const scanStubbed =
      hop.id === "scan" && env.AZURE_DEFENDER_SCAN_MODE?.trim() === "stub";
    const status: PilotVerifierHopStatus =
      missingGroups.length > 0 || scanStubbed
        ? "stub_fail_closed"
        : "live_ready";

    return {
      id: hop.id,
      label: hop.label,
      status,
      configuredKeyCount,
      missingKeyGroupCount: missingGroups.length,
      nextAction:
        status === "live_ready"
          ? "Run live verifier before commit-ready pilot use."
          : "Configure required key group or keep this hop fail-closed.",
    };
  });
  const liveReady = hops.filter((hop) => hop.status === "live_ready").length;
  const stubFailClosed = hops.filter(
    (hop) => hop.status === "stub_fail_closed",
  ).length;
  const blocked = hops.filter((hop) => hop.status === "blocked").length;

  return {
    schema: "abarva.pilot-data-plane-verification.v1",
    mode: "stub-aware",
    command: "npm run verify:pilot-data-plane",
    liveCommand: "npm run verify:pilot-data-plane -- --live",
    posture:
      blocked > 0 || stubFailClosed > 0 ? "needs_configuration" : "ready",
    summary: {
      liveReady,
      stubFailClosed,
      blocked,
      exitCode: blocked > 0 ? 1 : 0,
    },
    hops,
  };
}

function buildLoaderReadiness(): SetupDataLoadCenterModel["loaderReadiness"] {
  const auditPlan = buildPilotIngestionAuditOnlyWritePlan({
    tenantKey: "pilot-rehearsal",
    segmentKey: "enterprise_profile",
    storage: {
      accountName: "pilotstorage",
      containerName: "landing",
      blobPath: "pilot-rehearsal/enterprise_profile/sample.csv",
      sizeBytes: 128,
      contentType: "text/csv",
      sha256: "pilot-rehearsal-sha256",
    },
    producedAt: "2026-06-02T00:00:00.000Z",
    auditRowId: "pilot-rehearsal-audit",
    outcome: { status: "accepted", chunksWritten: 0 },
    protectionDecision: "allow",
  });
  const commitReadiness = evaluatePilotIngestionCommitReadiness({
    uploadStatus: auditPlan.uploadRun.status,
    openQuarantineCases: 0,
    openClarificationRequests: 0,
    approvalDecision: null,
    idempotencyConflict: false,
  });
  const rollbackPlan = planPilotIngestionRollback({
    commitStatus: "committed",
    activeCommitItems: 1,
    alreadyUnloadedItems: 0,
  });
  const ledgerTables = getPilotIngestionLedgerTables();

  return [
    {
      id: "loader-entrypoint",
      label: "Admin entrypoint",
      status: "ready",
      detail: "Setup resolves the active client and opens the governed load plan.",
      nextAction: "Start from the active-client Data Load Center.",
      href: "/admin/setup",
    },
    {
      id: "ledger-contract",
      label: "Audit-only ingestion ledger",
      status: "monitored",
      detail: `${ledgerTables.length} tenant-scoped ledger tables are defined for T357-T360; current hook records audit-only load plans.`,
      nextAction: "Use audit-only evidence until durable commit tables land.",
      href: "/admin/data-trust",
    },
    {
      id: "commit-readiness",
      label: "Commit readiness",
      status: commitReadiness.ready ? "ready" : "needs_configuration",
      detail: commitReadiness.ready
        ? "Preview, quarantine, clarification, approval, and idempotency gates are clean."
        : commitReadiness.blockers[0] ?? "Commit is not ready.",
      nextAction: "Clear preview approval before enabling commit.",
      href: "/admin/programs/approvals",
    },
    {
      id: "rollback-plan",
      label: "Rollback and unload",
      status: rollbackPlan.reversible ? "monitored" : "needs_configuration",
      detail: rollbackPlan.actions[0],
      nextAction: "Keep rollback evidence linked to every committed batch.",
      href: "/admin/data-trust",
    },
  ];
}

function buildLaunchActions(): SetupDataLoadCenterModel["launchActions"] {
  return [
    {
      id: "start-governed-load",
      label: "Start governed load",
      detail: "Open the upload workspace for the active client's first or next load.",
      href: "/admin/context-layer/uploads",
      kind: "primary",
    },
    {
      id: "run-verifier",
      label: "Run verifier",
      detail: "Check live/stub-fail-closed posture before pilot data-plane use.",
      href: "/admin/setup#pilot-verifier",
      kind: "secondary",
    },
    {
      id: "review-quarantine",
      label: "Review quarantine",
      detail: "Resolve sensitive upload holds before parse and approval continue.",
      href: "/platform/admin/quarantine",
      kind: "secondary",
    },
  ];
}

function findTenantManifest(
  clientKey: ClientKey,
): EnterpriseContextTemplateManifest | null {
  const manifestKey = MANIFEST_KEY_BY_CLIENT_KEY[clientKey];
  if (!manifestKey) return null;
  return (
    ENTERPRISE_CONTEXT_MANIFESTS.find(
      (manifest) => manifest.tenantKey === manifestKey,
    ) ?? null
  );
}

function runQueueShapeProbe(): boolean {
  try {
    const parsed = parseIngestionMessage({
      schema: "abarva.ingestion.v1",
      tenantClientKey: "pilot-rehearsal",
      segmentKey: "enterprise_profile",
      storage: {
        accountName: "pilotstorage",
        containerName: "context-ingestion",
        blobPath: "pilot-rehearsal/enterprise_profile/sample.csv",
        sizeBytes: 128,
        contentType: "text/csv",
        sha256: "pilot-rehearsal-sha256",
      },
      declaredClassification: "confidential_business",
      producedAt: "2026-06-01T00:00:00.000Z",
      metadata: { rehearsal: true },
    });
    return parsed.segmentKey === "enterprise_profile";
  } catch {
    return false;
  }
}

function runValidationProbe(): number {
  const classification: FileClassification = {
    templateType: "application-portfolio",
    dimension: "application_portfolio",
    format: "csv",
    likelySourceSystem: "pilot-rehearsal",
    confidence: 0.95,
    extractionStrategy: "structured_rows",
    requiredApprovalRole: "VP Enterprise Architecture",
    llmExtractionNeeded: false,
  };
  const facts: ExtractedContextFact[] = [
    {
      id: "pilot-rehearsal-fact-1",
      tenantKey: "northstar",
      dimension: "application_portfolio",
      entityType: "application",
      entityKey: "APP-PILOT-1",
      field: "app_id",
      value: "APP-PILOT-1",
      valueText: "APP-PILOT-1",
      sourceFileId: "pilot-rehearsal-file",
      sourceLocator: { fileName: "pilot-rehearsal.csv", row: 2 },
      confidence: 0.95,
      extractionMethod: "deterministic",
      requiresApproval: true,
      approvalRole: "VP Enterprise Architecture",
      validationFindings: [],
    },
  ];
  return validateExtractedFacts({ classification, facts }).length;
}

export function buildSetupDataLoadCenterModel(args: {
  clientId: string;
  clientKey: ClientKey;
  tenantName: string;
}, env: EnvMap = process.env): SetupDataLoadCenterModel {
  const tenantOption = getClientOption(args.clientKey);
  const tenantManifest = findTenantManifest(args.clientKey);
  const templateRows = buildTemplateRows();
  const dimensionReadiness = buildDimensionReadiness();
  const guardProbe = evaluateSensitiveUpload({
    filename: "pilot-rehearsal.csv",
    mimeType: "text/csv",
    bytes: new TextEncoder().encode(
      "source_system,source_record_id\nmanual_attestation,SYS-1",
    ),
    declaredClassification: "confidential_business",
  });

  return {
    tenant: {
      clientId: args.clientId,
      clientKey: args.clientKey,
      tenantName: args.tenantName,
      vertical: tenantOption.vertical,
    },
    singleClientBoundary: {
      label: `${args.tenantName} only`,
      assertion:
        "Data loading is strictly limited to the active client. No cross-client batch load, shared staging selection, or tenant override is exposed from Admin.",
      activeClientId: args.clientId,
      activeClientKey: args.clientKey,
      denialRule:
        "If submitted client identity does not match the resolved Admin tenant, the request must fail before storage, parsing, indexing, notification, or commit.",
    },
    metrics: {
      rehearsalGates: REHEARSAL_GATES.length,
      setupSegments: SEGMENT_KEYS.length,
      contextRegistryTemplates: NORTHSTAR_CONTEXT_TEMPLATES.length,
      dayOneWorkbooks:
        tenantManifest?.workbookCount ??
        ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.length,
    },
    privateDataPlane: {
      queueSchema: "abarva.ingestion.v1",
      sampleSegment: "enterprise_profile",
      sampleMessageAccepted: runQueueShapeProbe(),
      uploadGuardDecision: guardProbe.decision,
      validationProbeFindings: runValidationProbe(),
    },
    pilotVerifier: buildPilotVerifierPosture(env),
    loaderReadiness: buildLoaderReadiness(),
    launchActions: buildLaunchActions(),
    tenantManifest,
    manifestCoverage: ENTERPRISE_CONTEXT_TEMPLATE_TENANTS.map((tenant) => {
      const manifest = ENTERPRISE_CONTEXT_MANIFESTS.find(
        (candidate) => candidate.tenantKey === tenant.tenantKey,
      );
      return {
        tenantKey: tenant.tenantKey,
        displayName: tenant.displayName,
        workbookCount: manifest?.workbookCount ?? 0,
        version: manifest?.version ?? ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
      };
    }),
    rehearsalGates: REHEARSAL_GATES,
    workflowControls: WORKFLOW_CONTROLS,
    reloadCommandPlan: buildReloadCommandPlan(),
    exceptionIntake: buildExceptionIntake(),
    dimensionCatalog: buildDimensionCatalog(templateRows, dimensionReadiness),
    templateRows,
    dimensionReadiness,
    workQueue: buildWorkQueue(),
  };
}
