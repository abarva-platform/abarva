import fs from "node:fs";
import path from "node:path";

type SourceStatus =
  | "complete"
  | "partial"
  | "thin"
  | "stranded"
  | "blocked"
  | "not_available";

type SourceDomainKey =
  | "enterprise_profile"
  | "business_functions"
  | "organization_ownership"
  | "workforce_personas"
  | "applications_systems"
  | "data_assets_data_products"
  | "integrations"
  | "vendors_contracts"
  | "spend_value"
  | "programs_initiatives"
  | "ai_initiatives"
  | "risks_controls"
  | "relationships"
  | "evidence_sources"
  | "metric_definitions"
  | "infrastructure_cloud_estate"
  | "source_event_pack"
  | "moves_program_pack"
  | "tower_outcome_pack"
  | "benchmark_industry_inputs";

export interface SourceFileFinding {
  tenantKey: string;
  tenantName: string;
  filePath: string;
  fileName: string;
  sourceLocation: "repo" | "downloads" | "external_observed";
  sourceRoot: string;
  domains: SourceDomainKey[];
  rowCount: number | null;
  isStructured: boolean;
  isTransformedTemplate: boolean;
  includedInCandidateManifest: boolean;
  includedInActiveHomeContext: boolean;
  adapterExists: boolean;
  mappingProfileExists: boolean;
  reasonIfExcluded: string | null;
}

export interface SourceDomainFinding {
  tenantKey: string;
  tenantName: string;
  domain: SourceDomainKey;
  label: string;
  sourceFilesDiscovered: number;
  transformedTemplatesDiscovered: number;
  candidateManifestIncluded: boolean;
  adapterExists: boolean;
  mappingProfileExists: boolean;
  canonicalRecordsGenerated: number;
  evidenceKeysAttached: number;
  relationshipOperationsPlanned: number;
  homeVisible: boolean;
  avaReadable: boolean;
  promotionBlocker: boolean;
  status: SourceStatus;
  reasonIfExcluded: string | null;
  richestSourceRows: number;
  activeHomeRows: number;
}

export interface TenantManifestProjectionFinding {
  tenantKey: string;
  displayName: string;
  aliases: string[];
  sourceFilesDiscovered: number;
  candidateManifestFilesDiscovered: number;
  candidateManifestIncludedFiles: number;
  transformedTemplatesDiscovered: number;
  sourceStructuredRows: number;
  candidateRecordsGenerated: number;
  relationshipOperationsPlanned: number;
  activeHomeContextRows: number;
  manifestCompletenessScore: number;
  sourceProjectionScore: number;
  adapterCoverageScore: number;
  mappingCoverageScore: number;
  candidateRepresentationScore: number;
  homeRepresentationScore: number;
  avaRepresentationScore: number;
  status: SourceStatus;
  blockers: string[];
  domains: SourceDomainFinding[];
}

export interface TenantManifestProjectionAudit {
  generatedAt: string;
  root: string;
  uploadPathAlignment: {
    targetProcess: string;
    canonicalLandingContainer: string;
    canonicalLandingPrefix: string;
    currentLoaderLandingContainer: string;
    currentLoaderLandingPrefix: string;
    legacyStagingContainer: string;
    adminUploadAlignment: "not_fully_aligned";
    loaderKickoff: string;
    requiredCorrection: string;
  };
  guardrails: {
    productionTenantDataWritten: false;
    candidatePromoted: false;
    activeTenantAccessLayerUpdated: false;
    moduleRuntimeBehaviorChanged: false;
    activeTenantTruthChanged: false;
  };
  excludedTenants: Array<{
    tenantKey: string;
    reason: string;
  }>;
  tenants: TenantManifestProjectionFinding[];
  sourceFiles: SourceFileFinding[];
  promotionBlockers: Array<{
    tenantKey: string;
    tenantName: string;
    blocker: string;
  }>;
  skyHarborRequiredFindings: Array<{
    label: string;
    path: string;
    accessible: boolean;
    includedInCandidateManifest: boolean;
    rowCount: number | null;
    note: string;
  }>;
}

interface TenantAuditConfig {
  tenantKey: string;
  displayName: string;
  appClientKey: string;
  aliases: string[];
  canonicalInputRoot: string | null;
  registryPacketCount: number;
  activeHomeDataset: string | null;
  externalObservedPaths?: Array<{
    label: string;
    filePath: string;
    note: string;
  }>;
}

interface CandidateManifestEvidence {
  files: Set<string>;
  manifestCount: number;
  canonicalRecordsGenerated: number;
  relationshipOperationsPlanned: number;
}

interface BuildOptions {
  root?: string;
  includeDownloads?: boolean;
}

interface TenantInputRegistry {
  activeTenants?: Array<{
    tenantKey: string;
    displayName?: string;
    canonicalInputRoot?: string;
    packets?: Array<{ path?: string }>;
  }>;
  retiredTenants?: Array<{
    tenantKey: string;
    reason?: string;
  }>;
}

const SOURCE_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".jsonl",
  ".yaml",
  ".yml",
  ".xlsx",
  ".xls",
  ".md",
  ".pdf",
  ".docx",
  ".pptx",
]);

const STRUCTURED_EXTENSIONS = new Set([
  ".csv",
  ".json",
  ".jsonl",
  ".yaml",
  ".yml",
  ".xlsx",
  ".xls",
]);

const DOMAINS: Array<{
  key: SourceDomainKey;
  label: string;
  patterns: RegExp[];
}> = [
  {
    key: "enterprise_profile",
    label: "Enterprise profile",
    patterns: [
      /enterprise[_-]?profile/i,
      /00[-_]?profile/i,
      /portfolio[_-]?entity/i,
    ],
  },
  {
    key: "business_functions",
    label: "Business functions",
    patterns: [
      /business[_-]?functions/i,
      /business[-_]?org[-_]?functions/i,
      /capabilities[-_]?value/i,
      /function_capacity/i,
    ],
  },
  {
    key: "organization_ownership",
    label: "Organization / ownership",
    patterns: [
      /org[_-]?ownership/i,
      /it[-_]?org/i,
      /org[-_]?topology/i,
      /leadership[-_]?org/i,
      /executive[-_]?org/i,
      /team[-_]?application[-_]?ownership/i,
    ],
  },
  {
    key: "workforce_personas",
    label: "Workforce / personas",
    patterns: [
      /workforce/i,
      /personas?/i,
      /roles[-_]?inventory/i,
      /headcount/i,
      /capacity[-_]?baseline/i,
    ],
  },
  {
    key: "applications_systems",
    label: "Applications / systems",
    patterns: [
      /applications?[_-]?systems?/i,
      /application[-_]?portfolio/i,
      /systems?[-_]?landscape/i,
      /technology[_-]?inventory/i,
      /tech(?:nology)?[_-]?stack/i,
    ],
  },
  {
    key: "data_assets_data_products",
    label: "Data assets / data products",
    patterns: [
      /data[_-]?assets?/i,
      /data[-_]?analytics/i,
      /data[-_]?products?/i,
      /data[-_]?platform/i,
      /data[-_]?readiness/i,
    ],
  },
  {
    key: "integrations",
    label: "Integrations",
    patterns: [
      /integrations?/i,
      /interfaces?/i,
      /topology/i,
      /lineage/i,
      /fhir/i,
      /hl7/i,
    ],
  },
  {
    key: "vendors_contracts",
    label: "Vendors / contracts",
    patterns: [
      /vendors?/i,
      /contracts?/i,
      /licenses?/i,
      /renewal/i,
      /baa/i,
      /incumbent/i,
    ],
  },
  {
    key: "spend_value",
    label: "Spend / value",
    patterns: [
      /spend/i,
      /budget/i,
      /financial/i,
      /run[-_]?cost/i,
      /pricing/i,
      /rate[_-]?card/i,
      /pnl/i,
      /value[_-]?model/i,
      /benefit/i,
    ],
  },
  {
    key: "programs_initiatives",
    label: "Programs / initiatives",
    patterns: [
      /programs?/i,
      /initiatives?/i,
      /charters?/i,
      /roadmap/i,
      /project/i,
    ],
  },
  {
    key: "ai_initiatives",
    label: "AI initiatives",
    patterns: [
      /ai[_-]?initiatives?/i,
      /ai[-_]?tool/i,
      /model[-_]?inventory/i,
      /agent[-_]?outcomes/i,
      /automation/i,
    ],
  },
  {
    key: "risks_controls",
    label: "Risks / controls",
    patterns: [
      /risk/i,
      /controls?/i,
      /compliance/i,
      /regulatory/i,
      /security/i,
      /guardrail/i,
      /hipaa/i,
    ],
  },
  {
    key: "relationships",
    label: "Relationships",
    patterns: [
      /relationships?/i,
      /graph/i,
      /edges?/i,
      /dependency/i,
      /service[-_]?map/i,
      /bridge/i,
    ],
  },
  {
    key: "evidence_sources",
    label: "Evidence sources",
    patterns: [
      /evidence/i,
      /source[_-]?evidence/i,
      /registry/i,
      /provenance/i,
      /source[_-]?files/i,
    ],
  },
  {
    key: "metric_definitions",
    label: "Metric definitions",
    patterns: [
      /metric/i,
      /kpi/i,
      /baseline/i,
      /dora/i,
      /outcome/i,
      /scorecard/i,
    ],
  },
  {
    key: "infrastructure_cloud_estate",
    label: "Infrastructure / cloud estate",
    patterns: [
      /infrastructure/i,
      /cloud/i,
      /datacenter/i,
      /data[-_ ]center/i,
      /network/i,
      /mainframe/i,
      /platform[-_]?volumetrics/i,
    ],
  },
  {
    key: "source_event_pack",
    label: "Source event pack",
    patterns: [
      /source[-_]?event/i,
      /source_uploads/i,
      /rfp/i,
      /vendor[-_]?responses?/i,
      /sourcing/i,
      /evaluation[_-]?criteria/i,
    ],
  },
  {
    key: "moves_program_pack",
    label: "Moves program pack",
    patterns: [
      /moves?/i,
      /strategic[-_]?moves?/i,
      /phase/i,
      /workshop/i,
      /deliverables?/i,
    ],
  },
  {
    key: "tower_outcome_pack",
    label: "Tower outcome pack",
    patterns: [
      /tower/i,
      /benefit[-_]?realization/i,
      /value[-_]?realization/i,
      /outcome[-_]?tracker/i,
    ],
  },
  {
    key: "benchmark_industry_inputs",
    label: "Benchmark / industry inputs",
    patterns: [
      /benchmark/i,
      /industry/i,
      /market/i,
      /peer/i,
      /corpus[-_]?patterns?/i,
      /expert[-_]?lenses?/i,
    ],
  },
];

const REGISTRY_PATH = "datasets/tenant-inputs/tenant-input-registry.json";

const KNOWN_TENANT_ALIASES: Record<string, string[]> = {
  "apex-retail": ["apexretail", "apex", "retail demo"],
  "first-capital-financial": [
    "first-capital",
    "firstcapital",
    "arcturus",
    "financial services demo",
  ],
  "lakeshore-holdings": ["lakeshore"],
  "lakeshore-industries": ["lakeshore-industries"],
  "meridian-health": ["meridian", "healthcare demo"],
  "skyharbor-air": ["skyharbor", "airline demo"],
};

const APP_CLIENT_KEYS: Record<string, string> = {
  "apex-retail": "apexretail",
  "first-capital-financial": "arcturus",
  "lakeshore-holdings": "lakeshore",
  "lakeshore-industries": "lakeshore-industries",
  "meridian-health": "meridian",
  "skyharbor-air": "skyharbor",
};

const LEGACY_HOME_DATASETS: Record<string, string> = {
  "apex-retail": "datasets/apex-retail-synthetic-v6/templates",
  "first-capital-financial":
    "datasets/first-capital-financial-synthetic-v6/templates",
  "lakeshore-holdings": "datasets/lakeshore-holdings-synthetic-v6/templates",
  "meridian-health": "datasets/meridian-health-synthetic-v6/templates",
  "skyharbor-air": "datasets/skyharbor-air-synthetic-v6/templates",
};

const SKYHARBOR_EXTERNAL_OBSERVED_PATHS: TenantAuditConfig["externalObservedPaths"] =
  [
    {
      label: "412-app portfolio CSV from Downloads",
      filePath:
        "/Users/anand/Downloads/SkyHarbor-E2E-Data/01-evidence-uploads/01_Application_Portfolio_InScope_412Apps.csv",
      note: "Operator-observed rich source evidence; include only when accessible in the local/test environment.",
    },
    {
      label: "900-row older app/system estate",
      filePath:
        "datasets/skyharbor-air-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv",
      note: "Older rich source estate that must be reconciled before candidate promotion.",
    },
    {
      label: "956-row transformed app/system template",
      filePath:
        "datasets/skyharbor-air-synthetic-v6/templates/V6_05_applications_systems.csv",
      note: "Transformed template used by active Home fallback/read model.",
    },
    {
      label: "13-row current upgrade candidate app/system file",
      filePath:
        "datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_05_applications_systems.csv",
      note: "Known thin candidate source from prior runway; may be absent from this checkout.",
    },
  ];

const EXCLUDED_TENANTS = [
  {
    tenantKey: "northstar-clinical",
    reason:
      "Retired/excluded per operator instruction for this data-layer proof; do not process as an active tenant.",
  },
];

const CANDIDATE_SEARCH_ROOTS = ["reports", "audit-artifacts"];

const DOWNLOAD_SOURCE_ROOTS = [
  "/Users/anand/Downloads/SkyHarbor-E2E-Data",
  "/Users/anand/Downloads/SkyHarbor_IROPS_Care_Evidence",
  "/Users/anand/Downloads/SkyHarbor_Move_Test_Kit",
  "/Users/anand/Downloads/Meridian-Move-Input-Output-Review-20260623T160716/inputs",
  "/Users/anand/Downloads/abarva-v7-synthetic-client-data-v2-20260703",
  "/Users/anand/Downloads/Lakeshore Legal Contract Intake Demo Pack",
  "/Users/anand/Downloads/FirstCapital-AITradeFinance-Engagement/02-inputs-evidence",
];

function readTenantRegistry(root: string): TenantInputRegistry {
  const registryPath = path.join(root, REGISTRY_PATH);
  try {
    return JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch {
    return { activeTenants: [] };
  }
}

function activeTenantConfigs(root: string): TenantAuditConfig[] {
  const registry = readTenantRegistry(root);
  return (registry.activeTenants ?? []).map((tenant) => {
    const aliases = Array.from(
      new Set([
        tenant.tenantKey,
        tenant.displayName ?? tenant.tenantKey,
        ...(KNOWN_TENANT_ALIASES[tenant.tenantKey] ?? []),
      ]),
    );
    return {
      tenantKey: tenant.tenantKey,
      displayName: tenant.displayName ?? tenant.tenantKey,
      appClientKey: APP_CLIENT_KEYS[tenant.tenantKey] ?? tenant.tenantKey,
      aliases,
      canonicalInputRoot: tenant.canonicalInputRoot ?? null,
      registryPacketCount: tenant.packets?.length ?? 0,
      activeHomeDataset: LEGACY_HOME_DATASETS[tenant.tenantKey] ?? null,
      externalObservedPaths:
        tenant.tenantKey === "skyharbor-air"
          ? SKYHARBOR_EXTERNAL_OBSERVED_PATHS
          : undefined,
    };
  });
}

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const rel = (root: string, filePath: string): string =>
  path.isAbsolute(filePath)
    ? path.relative(root, filePath) || filePath
    : filePath;

function safeExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function walkFiles(dir: string, maxDepth = 8): string[] {
  if (!safeExists(dir) || maxDepth < 0) return [];
  if (dir.split(path.sep).includes("data-remediation")) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === ".next"
    )
      continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, maxDepth - 1));
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

function countCsvRows(filePath: string): number | null {
  try {
    const text = fs.readFileSync(filePath, "utf8").trim();
    if (!text) return 0;
    let rows = 0;
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"' && quoted && next === '"') {
        i += 1;
      } else if (ch === '"') {
        quoted = !quoted;
      } else if (ch === "\n" && !quoted) {
        rows += 1;
      }
    }
    return Math.max(0, rows);
  } catch {
    return null;
  }
}

function countJsonRows(filePath: string): number | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (Array.isArray(parsed)) return parsed.length;
    for (const key of [
      "records",
      "rows",
      "items",
      "files",
      "edges",
      "nodes",
      "templates",
    ]) {
      const value = parsed?.[key];
      if (Array.isArray(value)) return value.length;
    }
    return 1;
  } catch {
    return null;
  }
}

function rowCount(filePath: string): number | null {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") return countCsvRows(filePath);
  if (ext === ".json") return countJsonRows(filePath);
  if (ext === ".jsonl") {
    try {
      return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean)
        .length;
    } catch {
      return null;
    }
  }
  return null;
}

function domainsForPath(filePath: string): SourceDomainKey[] {
  const normalizedPath = filePath.toLowerCase();
  const domains = DOMAINS.filter((domain) =>
    domain.patterns.some((pattern) => pattern.test(normalizedPath)),
  ).map((domain) => domain.key);
  return Array.from(new Set(domains));
}

function isTransformedTemplate(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.includes("/templates/") ||
    /v[0-9]+[_-][0-9]+/.test(lower) ||
    lower.includes("generated_manifest")
  );
}

function tenantOwnsPath(tenant: TenantAuditConfig, filePath: string): boolean {
  const normalizedPath = normalize(filePath);
  return tenant.aliases.some((alias) =>
    normalizedPath.includes(normalize(alias)),
  );
}

function discoverTenantSourceFiles(
  root: string,
  tenant: TenantAuditConfig,
  includeDownloads: boolean,
): string[] {
  const roots = tenant.canonicalInputRoot
    ? [path.join(root, tenant.canonicalInputRoot)]
    : [path.join(root, "datasets")];
  if (includeDownloads && !tenant.canonicalInputRoot) {
    roots.push(
      ...DOWNLOAD_SOURCE_ROOTS.filter((sourceRoot) => safeExists(sourceRoot)),
    );
  }
  const files = roots.flatMap((sourceRoot) =>
    walkFiles(sourceRoot, sourceRoot.includes("Downloads") ? 6 : 8),
  );
  return Array.from(
    new Set(files.filter((file) => tenantOwnsPath(tenant, file))),
  );
}

function candidateEvidenceForTenant(
  root: string,
  tenant: TenantAuditConfig,
): CandidateManifestEvidence {
  const evidence: CandidateManifestEvidence = {
    files: new Set(),
    manifestCount: tenant.registryPacketCount,
    canonicalRecordsGenerated: 0,
    relationshipOperationsPlanned: 0,
  };

  if (tenant.canonicalInputRoot) {
    const fullRoot = path.join(root, tenant.canonicalInputRoot);
    const activeFiles = walkFiles(fullRoot, 2);
    for (const file of activeFiles) {
      const relativePath = rel(root, file);
      const basename = path.basename(file);
      evidence.files.add(relativePath);
      evidence.files.add(basename);
      const rows = rowCount(file);
      if (STRUCTURED_EXTENSIONS.has(path.extname(file).toLowerCase())) {
        evidence.canonicalRecordsGenerated += rows ?? 0;
      }
      if (domainsForPath(file).includes("relationships")) {
        evidence.relationshipOperationsPlanned += rows ?? 0;
      }
    }
  }

  for (const searchRoot of CANDIDATE_SEARCH_ROOTS) {
    const fullRoot = path.join(root, searchRoot);
    const files = walkFiles(fullRoot, 7).filter((file) =>
      tenantOwnsPath(tenant, file),
    );
    for (const file of files) {
      const name = path.basename(file).toLowerCase();
      if (!/manifest|summary|candidate|record|dry-run|gate|version/.test(name))
        continue;
      let text = "";
      try {
        text = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }
      evidence.manifestCount += /manifest/.test(name) ? 1 : 0;
      for (const match of text.matchAll(/sources\/[^"',\]\s]+/g)) {
        evidence.files.add(path.basename(match[0]));
        evidence.files.add(match[0]);
      }
      const canonicalMatch =
        text.match(/"canonicalRecordCount"\s*:\s*(\d+)/) ??
        text.match(/"canonicalRecordsGenerated"\s*:\s*(\d+)/);
      if (canonicalMatch?.[1]) {
        evidence.canonicalRecordsGenerated = Math.max(
          evidence.canonicalRecordsGenerated,
          Number(canonicalMatch[1]),
        );
      }
      const relationshipMatch =
        text.match(/"relationshipOperationCount"\s*:\s*(\d+)/) ??
        text.match(/"relationshipOperationsPlanned"\s*:\s*(\d+)/);
      if (relationshipMatch?.[1]) {
        evidence.relationshipOperationsPlanned = Math.max(
          evidence.relationshipOperationsPlanned,
          Number(relationshipMatch[1]),
        );
      }
    }
  }

  return evidence;
}

function activeHomeSourceFiles(
  root: string,
  tenant: TenantAuditConfig,
): Set<string> {
  if (!tenant.activeHomeDataset) return new Set();
  const full = path.join(root, tenant.activeHomeDataset);
  return new Set(walkFiles(full, 2).map((file) => path.basename(file)));
}

function score(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function statusFromScores(
  blockers: string[],
  manifestScore: number,
  candidateScore: number,
): SourceStatus {
  if (blockers.length > 0 && candidateScore === 0) return "blocked";
  if (blockers.length > 0 && manifestScore < 35) return "stranded";
  if (candidateScore < 35) return "thin";
  if (manifestScore < 75) return "partial";
  return "complete";
}

export function buildTenantManifestProjectionAudit(
  options: BuildOptions = {},
): TenantManifestProjectionAudit {
  const root = options.root ?? process.cwd();
  const includeDownloads =
    options.includeDownloads ?? safeExists("/Users/anand/Downloads");
  const tenantConfigs = activeTenantConfigs(root);
  const sourceFiles: SourceFileFinding[] = [];
  const tenants: TenantManifestProjectionFinding[] = [];
  const promotionBlockers: TenantManifestProjectionAudit["promotionBlockers"] =
    [];
  const skyHarborRequiredFindings: TenantManifestProjectionAudit["skyHarborRequiredFindings"] =
    [];

  for (const tenant of tenantConfigs) {
    const candidateEvidence = candidateEvidenceForTenant(root, tenant);
    const homeFiles = activeHomeSourceFiles(root, tenant);
    const discovered = discoverTenantSourceFiles(
      root,
      tenant,
      includeDownloads,
    );
    const fileFindings: SourceFileFinding[] = discovered.map((filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const basename = path.basename(filePath);
      const relativePath = rel(root, filePath);
      const domains = domainsForPath(filePath);
      const includedInCandidateManifest =
        candidateEvidence.files.has(basename) ||
        candidateEvidence.files.has(relativePath) ||
        Array.from(candidateEvidence.files).some(
          (candidateFile) => normalize(candidateFile) === normalize(basename),
        );
      const includedInActiveHomeContext = homeFiles.has(basename);
      const structured = STRUCTURED_EXTENSIONS.has(ext);
      const mappingProfileExists =
        includedInCandidateManifest || includedInActiveHomeContext;
      return {
        tenantKey: tenant.tenantKey,
        tenantName: tenant.displayName,
        filePath: relativePath,
        fileName: basename,
        sourceLocation: filePath.startsWith("/Users/anand/Downloads")
          ? "downloads"
          : "repo",
        sourceRoot: filePath.startsWith("/Users/anand/Downloads")
          ? "/Users/anand/Downloads"
          : "datasets",
        domains,
        rowCount: rowCount(filePath),
        isStructured: structured,
        isTransformedTemplate: isTransformedTemplate(filePath),
        includedInCandidateManifest,
        includedInActiveHomeContext,
        adapterExists: structured,
        mappingProfileExists,
        reasonIfExcluded: includedInCandidateManifest
          ? null
          : "Source file is discoverable but not referenced by a candidate manifest in this checkout.",
      };
    });

    sourceFiles.push(...fileFindings);

    if (tenant.tenantKey === "skyharbor-air") {
      for (const item of tenant.externalObservedPaths ?? []) {
        const resolved = path.isAbsolute(item.filePath)
          ? item.filePath
          : path.join(root, item.filePath);
        const accessible = safeExists(resolved);
        const basename = path.basename(item.filePath);
        skyHarborRequiredFindings.push({
          label: item.label,
          path: item.filePath,
          accessible,
          includedInCandidateManifest:
            candidateEvidence.files.has(basename) ||
            Array.from(candidateEvidence.files).some(
              (candidateFile) =>
                normalize(candidateFile) === normalize(basename),
            ),
          rowCount: accessible ? rowCount(resolved) : null,
          note: item.note,
        });
      }
    }

    const domainFindings: SourceDomainFinding[] = DOMAINS.map((domain) => {
      const domainFiles = fileFindings.filter((file) =>
        file.domains.includes(domain.key),
      );
      const activeHomeRows = domainFiles
        .filter((file) => file.includedInActiveHomeContext)
        .reduce((sum, file) => sum + (file.rowCount ?? 0), 0);
      const richestSourceRows = Math.max(
        0,
        ...domainFiles.map((file) => file.rowCount ?? 0),
      );
      const candidateFiles = domainFiles.filter(
        (file) => file.includedInCandidateManifest,
      );
      const candidateRows = candidateFiles.reduce(
        (sum, file) => sum + (file.rowCount ?? 0),
        0,
      );
      const sourceExists = domainFiles.length > 0;
      const transformedExists = domainFiles.some(
        (file) => file.isTransformedTemplate,
      );
      const manifestIncluded = candidateFiles.length > 0;
      const adapterExists = domainFiles.some((file) => file.adapterExists);
      const mappingProfileExists = domainFiles.some(
        (file) => file.mappingProfileExists,
      );
      const homeVisible = activeHomeRows > 0;
      const avaReadable = homeVisible;
      const thinHome =
        sourceExists &&
        homeVisible &&
        richestSourceRows > 0 &&
        activeHomeRows < richestSourceRows;
      const blocker =
        (sourceExists && !manifestIncluded) ||
        (transformedExists && !manifestIncluded) ||
        thinHome ||
        (domain.key === "relationships" &&
          sourceExists &&
          candidateEvidence.relationshipOperationsPlanned === 0);
      const reasonIfExcluded = !sourceExists
        ? "No source file discovered for this domain."
        : !manifestIncluded
          ? "Source domain exists upstream but is not included in the candidate manifest."
          : thinHome
            ? "Active Home context shows fewer records than the richest discovered source for this domain."
            : null;
      const statusValue: SourceStatus = !sourceExists
        ? "not_available"
        : blocker
          ? "stranded"
          : manifestIncluded && mappingProfileExists
            ? "complete"
            : "partial";

      return {
        tenantKey: tenant.tenantKey,
        tenantName: tenant.displayName,
        domain: domain.key,
        label: domain.label,
        sourceFilesDiscovered: domainFiles.length,
        transformedTemplatesDiscovered: domainFiles.filter(
          (file) => file.isTransformedTemplate,
        ).length,
        candidateManifestIncluded: manifestIncluded,
        adapterExists,
        mappingProfileExists,
        canonicalRecordsGenerated: candidateRows,
        evidenceKeysAttached: candidateRows,
        relationshipOperationsPlanned:
          domain.key === "relationships"
            ? candidateEvidence.relationshipOperationsPlanned
            : 0,
        homeVisible,
        avaReadable,
        promotionBlocker: blocker,
        status: statusValue,
        reasonIfExcluded,
        richestSourceRows,
        activeHomeRows,
      };
    });

    const blockers = domainFindings
      .filter((domain) => domain.promotionBlocker)
      .map((domain) => `${domain.label}: ${domain.reasonIfExcluded}`);

    for (const blocker of blockers) {
      promotionBlockers.push({
        tenantKey: tenant.tenantKey,
        tenantName: tenant.displayName,
        blocker,
      });
    }

    const requiredDomains = DOMAINS.filter((domain) =>
      domainFindings.some(
        (finding) =>
          finding.domain === domain.key && finding.sourceFilesDiscovered > 0,
      ),
    );
    const includedDomains = domainFindings.filter(
      (domain) => domain.candidateManifestIncluded,
    ).length;
    const adapterDomains = domainFindings.filter(
      (domain) => domain.adapterExists,
    ).length;
    const mappingDomains = domainFindings.filter(
      (domain) => domain.mappingProfileExists,
    ).length;
    const manifestScore = score(
      includedDomains,
      Math.max(requiredDomains.length, 1),
    );
    const sourceProjectionScore = score(
      fileFindings.filter((file) => file.includedInCandidateManifest).length,
      Math.max(fileFindings.length, 1),
    );
    const candidateRecords = candidateEvidence.canonicalRecordsGenerated;
    const activeHomeRows = domainFindings.reduce(
      (sum, domain) => sum + domain.activeHomeRows,
      0,
    );
    const structuredRows = fileFindings.reduce(
      (sum, file) => sum + (file.isStructured ? (file.rowCount ?? 0) : 0),
      0,
    );
    const candidateRepresentation = score(
      candidateRecords,
      Math.max(structuredRows, 1),
    );
    const homeRepresentation = score(
      activeHomeRows,
      Math.max(structuredRows, 1),
    );

    tenants.push({
      tenantKey: tenant.tenantKey,
      displayName: tenant.displayName,
      aliases: tenant.aliases,
      sourceFilesDiscovered: fileFindings.length,
      candidateManifestFilesDiscovered: candidateEvidence.manifestCount,
      candidateManifestIncludedFiles: fileFindings.filter(
        (file) => file.includedInCandidateManifest,
      ).length,
      transformedTemplatesDiscovered: fileFindings.filter(
        (file) => file.isTransformedTemplate,
      ).length,
      sourceStructuredRows: structuredRows,
      candidateRecordsGenerated: candidateRecords,
      relationshipOperationsPlanned:
        candidateEvidence.relationshipOperationsPlanned,
      activeHomeContextRows: activeHomeRows,
      manifestCompletenessScore: manifestScore,
      sourceProjectionScore,
      adapterCoverageScore: score(
        adapterDomains,
        Math.max(requiredDomains.length, 1),
      ),
      mappingCoverageScore: score(
        mappingDomains,
        Math.max(requiredDomains.length, 1),
      ),
      candidateRepresentationScore: candidateRepresentation,
      homeRepresentationScore: homeRepresentation,
      avaRepresentationScore: homeRepresentation,
      status: statusFromScores(
        blockers,
        manifestScore,
        candidateRepresentation,
      ),
      blockers,
      domains: domainFindings,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    root,
    uploadPathAlignment: {
      targetProcess:
        "Admin creates a tenant-scoped upload session, files land in Azure Blob, an ACA data-build job reads that exact session, and the proof bundle records every accepted/quarantined source file.",
      canonicalLandingContainer: "context-landing",
      canonicalLandingPrefix:
        "landing/<uploadSessionId>/<segmentKey>/<fileName>",
      currentLoaderLandingContainer: "context-landing",
      currentLoaderLandingPrefix: "landing/<tenantKey>/inbox/<uuid>-<fileName>",
      legacyStagingContainer: "context-drops",
      adminUploadAlignment: "not_fully_aligned",
      loaderKickoff:
        "The current loader can scan context-landing under landing/<tenantKey>/, while legacy manifest-load paths stage committed files to context-drops.",
      requiredCorrection:
        "Make admin upload, tenant packet manifest, source projection audit, and ACA data-build job use the same upload session id, segment key, source manifest, and proof bundle before any candidate regeneration or promotion.",
    },
    guardrails: {
      productionTenantDataWritten: false,
      candidatePromoted: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeBehaviorChanged: false,
      activeTenantTruthChanged: false,
    },
    excludedTenants: EXCLUDED_TENANTS,
    tenants,
    sourceFiles,
    promotionBlockers,
    skyHarborRequiredFindings,
  };
}

export function domainLabels(): Array<{ key: SourceDomainKey; label: string }> {
  return DOMAINS.map(({ key, label }) => ({ key, label }));
}
