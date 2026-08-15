#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

type Packet = {
  packetId: string;
  path: string;
  classification: string;
  status: string;
  note?: string;
};

type Tenant = {
  tenantKey: string;
  displayName: string;
  companySizeBand: string;
  canonicalInputRoot: string;
  packets: Packet[];
};

type Registry = {
  canonicalRoot: string;
  activeRoot: string;
  archiveRoot: string;
  universalTemplateSet: {
    templateSetId: string;
    root: string;
    manifest: string;
    qualityDepthRules: string;
    azureLanding: Record<string, string>;
  };
  activeTenants: Tenant[];
  retiredTenants: Array<{ tenantKey: string; status: string }>;
};

type TemplateManifest = {
  templateSetId: string;
  templates: Array<{ file: string; required: boolean; columns: string[] }>;
};

type ColumnContractWaiver = {
  tenantKey: string;
  reason: string;
  owner: string;
  expires: string;
  remediation: string;
};

type HollowRowWaiver = {
  tenantKey: string;
  files: string[];
  reason: string;
  owner: string;
  expires: string;
  remediation: string;
};

type QualityRules = {
  companySizeBands: Record<string, { minRows: Record<string, number> }>;
  columnContractWaivers?: ColumnContractWaiver[];
  hollowRowWaivers?: HollowRowWaiver[];
};

type ColumnConformance = {
  contractFile: string;
  resolvedFile: string;
  state: "conformant" | "naming-drift" | "column-gap" | "absent";
  /** Independent of state: a file can drift in name *and* be missing columns. */
  nameDrifted: boolean;
  missingColumns: string[];
  /** Declared columns that carry a value somewhere in the file. */
  populatedColumns: number;
  /** Declared columns present in the header but blank in every row. */
  emptyColumns: string[];
};

type SourceFile = {
  tenantKey: string;
  packetId: string;
  relativePath: string;
  absolutePath: string;
  csvRows: number;
  domain: string | null;
};

const repoRoot = process.cwd();
const registryPath = path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json");
const defaultOutDir = path.join(repoRoot, "reports/canonical-tenant-inputs/latest");

type Args = {
  outDir: string;
};

function parseArgs(argv: string[]): Args {
  let outDir = defaultOutDir;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out-dir" && argv[index + 1]) {
      outDir = path.resolve(repoRoot, argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--out-dir=")) {
      outDir = path.resolve(repoRoot, arg.slice("--out-dir=".length));
    } else if (arg === "--help" || arg === "-h") {
      console.log("usage: tenant-input-quality-depth [--out-dir <path>]");
      process.exit(0);
    }
  }
  return { outDir };
}

const domainMatchers: Array<{ domain: string; patterns: RegExp[] }> = [
  {
    domain: "enterprise_profile",
    patterns: [/enterprise[_-]profile/i, /portfolio[_-]entity[_-]registry/i, /entity[_-]hierarchy/i],
  },
  {
    domain: "business_functions",
    patterns: [/business[_-]functions/i, /business[_-]capabilities/i],
  },
  {
    domain: "org_ownership",
    patterns: [/org[_-]ownership/i, /org[_-]roles/i, /team[_-]topology/i],
  },
  {
    domain: "workforce_roles",
    patterns: [/workforce[_-](roles|personas)/i, /personas/i, /roles/i],
  },
  {
    domain: "applications_systems",
    patterns: [/applications[_-]systems/i, /application[_-]portfolio/i, /apps?[_-]systems?/i],
  },
  {
    domain: "data_assets_integrations",
    patterns: [/data[_-]assets?[_-]integrations?/i, /integration[_-]topology/i, /data[_-]inventory/i],
  },
  {
    domain: "infrastructure_platforms",
    patterns: [/infrastructure/i, /cloud[_-]estate/i, /data[_-]center/i, /platforms?/i],
  },
  {
    domain: "vendors_contracts",
    patterns: [/vendors?[_-]contracts?/i, /vendor[_-]contracts?/i],
  },
  {
    domain: "spend_value",
    patterns: [
      /spend[_-]value/i,
      /it[_-]financials/i,
      /financial[_-]kpi/i,
      /dashboard[_-]metric[_-]map/i,
      /rate[_-]card/i,
      /cost[_-]basis/i,
    ],
  },
  {
    domain: "programs_initiatives",
    patterns: [/programs?[_-]initiatives?/i, /(^|\/)initiatives\.csv$/i, /business[_-]priorities/i],
  },
  {
    domain: "ai_automation_use_cases",
    patterns: [/ai[_-](automation[_-])?use[_-]cases/i, /ai[_-]initiatives/i, /ai[_-]tooling/i],
  },
  {
    domain: "risks_controls",
    patterns: [/risks?[_-]controls?/i, /operations[_-]risk[_-]controls/i, /qms/i, /controls?/i],
  },
  {
    domain: "relationships",
    patterns: [/relationships?/i, /graph[_-]edges?/i, /bridge/i],
  },
  {
    domain: "metrics_outcomes",
    patterns: [/metrics?[_-]outcomes?/i, /metric[_-]definitions/i, /dora[_-]baseline/i, /sla[_-]register/i],
  },
  {
    domain: "evidence_sources",
    patterns: [/evidence[_-]sources/i, /source[_-]evidence[_-]registry/i, /chunk[_-]retrieval[_-]registry/i],
  },
  {
    domain: "industry_context_patterns",
    patterns: [
      /industry[_-](context|corpus|market|knowledge)[_-]patterns/i,
      /industry[_-]market[_-]knowledge[_-]patterns/i,
      /market[_-]corpus/i,
    ],
  },
  {
    domain: "expert_lenses",
    patterns: [/expert[_-]lenses/i],
  },
  {
    domain: "service_scope_managed_services",
    patterns: [/service[_-](scope|tower)[_-]managed[_-]services/i, /managed[_-]services[_-]scope/i],
  },
  {
    domain: "operational_process_evidence",
    patterns: [/operational[_-]process[_-]evidence/i, /operational[_-]evidence/i, /process[_-]intelligence/i, /incidents/i],
  },
];

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8")) as T;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    if (entry.isFile()) files.push(full);
  }
  return files;
}

function countRows(file: string): number {
  const text = fs.readFileSync(file, "utf8").trim();
  if (!text) return 0;
  return Math.max(0, text.split(/\r?\n/).length - 1);
}

function detectDomain(relativePath: string): string | null {
  for (const matcher of domainMatchers) {
    if (matcher.patterns.some((pattern) => pattern.test(relativePath))) return matcher.domain;
  }
  return null;
}

/**
 * Header row of a CSV, honouring quoted fields so a comma inside a column name
 * cannot silently split it into two.
 */
function readHeaderColumns(file: string): string[] {
  const text = fs.readFileSync(file, "utf8");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const columns: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < firstLine.length; index += 1) {
    const character = firstLine[index];
    if (character === '"') {
      if (inQuotes && firstLine[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      columns.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  columns.push(current.trim());
  return columns.filter((column) => column.length > 0).map((column) => column.replace(/^﻿/, ""));
}

/**
 * A file whose rows end inconsistently — some CRLF, some LF — parses differently depending on
 * which reader opens it. One tenant carried this and it hid a vendor, four workforce roles and
 * 503 ticket rows from one parser while another read them fine. The symptoms surfaced as four
 * unrelated defects; the cause was a handful of bytes.
 *
 * Every active tenant is consistent today, so this can be strict from the outset.
 */
/**
 * Rows that carry provenance but no payload.
 *
 * Depth counts rows. Conformance counts columns. Neither catches a file that has the right
 * columns and the right number of rows where the payload columns are empty — one tenant's
 * spend file conforms to the contract and has 71 rows, and 69 of them carry no spend at all.
 *
 * Only conformant files are checked. An off-contract file has few contract columns by
 * definition, so measuring payload there would re-report the conformance gap under a second
 * name and inflate the count with something already tracked.
 */
const ROW_METADATA_COLUMNS = new Set(['tenant_key', 'source_file', 'source_date', 'confidence', 'known_gaps']);

function hollowRows(file: string, declaredColumns: string[]): { hollow: number; total: number } {
  const text = fs.readFileSync(file, 'utf8').trim();
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return { hollow: 0, total: 0 };
  const header = readHeaderColumns(file);
  const payload = declaredColumns.filter((c) => header.includes(c) && !ROW_METADATA_COLUMNS.has(c));
  if (payload.length < 3) return { hollow: 0, total: 0 };
  const indexes = payload.map((c) => header.indexOf(c));

  let hollow = 0;
  let total = 0;
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    total += 1;
    const cells = splitCsvLine(line);
    if (!indexes.some((i) => (cells[i] ?? '').trim() !== '')) hollow += 1;
  }
  return { hollow, total };
}

function mixedLineEndings(file: string): number {
  const raw = fs.readFileSync(file);
  let crlf = 0;
  let bare = 0;
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] !== 0x0a) continue;
    if (i > 0 && raw[i - 1] === 0x0d) crlf += 1;
    else if (i < raw.length - 1) bare += 1; // a trailing newline at EOF is harmless
  }
  return crlf > 0 && bare > 0 ? bare : 0;
}

const numericPrefixOf = (file: string): string => /^(\d{2})_/.exec(path.basename(file))?.[1] ?? "";

/**
 * How many declared columns actually carry a value somewhere in the file.
 *
 * Shape conformance on its own can be satisfied by adding the declared columns and
 * leaving every one of them blank, which would look like remediation while changing
 * nothing. Fill rate makes that visible. It is reported, never enforced: legitimately
 * empty columns exist, and an arbitrary threshold would only invite padding.
 */
function populationOf(file: string, declaredColumns: string[]): { populatedColumns: number; emptyColumns: string[] } {
  const text = fs.readFileSync(file, "utf8").trim();
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return { populatedColumns: 0, emptyColumns: [...declaredColumns] };

  const header = readHeaderColumns(file);
  const present = declaredColumns.filter((column) => header.includes(column));
  const seen = new Set<string>();

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = splitCsvLine(line);
    for (const column of present) {
      if (seen.has(column)) continue;
      const value = cells[header.indexOf(column)];
      if (value !== undefined && value.trim() !== "") seen.add(column);
    }
    if (seen.size === present.length) break;
  }

  return {
    populatedColumns: seen.size,
    emptyColumns: present.filter((column) => !seen.has(column)),
  };
}

/** Quote-aware split shared by the header reader and the population scan. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current);
  return cells;
}

/**
 * Depth alone passed a package whose columns did not match the declared contract: the
 * files were present and full of rows, but carried a different schema, so adapters keyed
 * on the contract found nothing. This checks the shape as well as the volume.
 */
function columnConformanceForTenant(tenant: Tenant, manifest: TemplateManifest): ColumnConformance[] {
  const files = sourceFilesForTenant(tenant);
  const byBasename = new Map(files.map((file) => [path.basename(file.relativePath), file]));

  return manifest.templates.map((template) => {
    const exact = byBasename.get(template.file);
    const prefix = numericPrefixOf(template.file);
    const byPrefix = prefix
      ? files.find(
          (file) =>
            file.relativePath.toLowerCase().endsWith(".csv") &&
            numericPrefixOf(file.relativePath) === prefix,
        )
      : undefined;
    const resolved = exact ?? byPrefix;

    if (!resolved) {
      return {
        contractFile: template.file,
        resolvedFile: "",
        state: "absent" as const,
        nameDrifted: false,
        missingColumns: template.columns,
        populatedColumns: 0,
        emptyColumns: [],
      };
    }

    const columns = readHeaderColumns(resolved.absolutePath);
    const missingColumns = template.columns.filter((column) => !columns.includes(column));
    const resolvedName = path.basename(resolved.relativePath);
    const nameDrifted = resolvedName !== template.file;
    const { populatedColumns, emptyColumns } = populationOf(resolved.absolutePath, template.columns);

    if (missingColumns.length > 0) {
      return {
        contractFile: template.file,
        resolvedFile: resolvedName,
        state: "column-gap" as const,
        nameDrifted,
        missingColumns,
        populatedColumns,
        emptyColumns,
      };
    }
    if (nameDrifted) {
      return {
        contractFile: template.file,
        resolvedFile: resolvedName,
        state: "naming-drift" as const,
        nameDrifted,
        missingColumns: [],
        populatedColumns,
        emptyColumns,
      };
    }
    return {
      contractFile: template.file,
      resolvedFile: resolvedName,
      state: "conformant" as const,
      nameDrifted,
      missingColumns: [],
      populatedColumns,
      emptyColumns,
    };
  });
}

function sourceFilesForTenant(tenant: Tenant): SourceFile[] {
  return tenant.packets.flatMap((packet) => {
    const packetRoot = path.join(repoRoot, packet.path);
    return walk(packetRoot)
      .filter((file) => file.toLowerCase().endsWith(".csv"))
      .map((absolutePath) => {
        const relativePath = path.relative(packetRoot, absolutePath);
        return {
          tenantKey: tenant.tenantKey,
          packetId: packet.packetId,
          relativePath,
          absolutePath,
          csvRows: countRows(absolutePath),
          domain: detectDomain(relativePath),
        };
      });
  });
}

function hasRiskyCurrentTargetBlend(file: SourceFile): boolean {
  if (!/current[_-]state|current-state|current\//i.test(file.absolutePath)) return false;
  if (!file.domain || !["applications_systems", "data_assets_integrations", "infrastructure_platforms"].includes(file.domain)) {
    return false;
  }
  const text = fs.readFileSync(file.absolutePath, "utf8").toLowerCase();
  return (
    text.includes("databricks on aws") ||
    text.includes("target lakehouse") ||
    text.includes("future target") ||
    text.includes("foundation is not yet")
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function writeMarkdown(file: string, lines: string[]): void {
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8")) as Registry;
  const manifest = readJson<TemplateManifest>(registry.universalTemplateSet.manifest);
  const rules = readJson<QualityRules>(registry.universalTemplateSet.qualityDepthRules);
  const outDir = args.outDir;
  ensureDir(outDir);

  const failures: string[] = [];
  const templateRoot = path.join(repoRoot, registry.universalTemplateSet.root);
  const missingTemplates = manifest.templates
    .filter((template) => template.required)
    .filter((template) => !fs.existsSync(path.join(templateRoot, template.file)))
    .map((template) => template.file);
  if (missingTemplates.length > 0) {
    failures.push(`Missing required universal templates: ${missingTemplates.join(", ")}`);
  }

  if (registry.activeTenants.some((tenant) => tenant.tenantKey.toLowerCase().includes("northstar"))) {
    failures.push("Northstar is present in active tenants but must remain retired/excluded.");
  }

  const waivers = new Map((rules.columnContractWaivers ?? []).map((waiver) => [waiver.tenantKey, waiver]));
  const today = new Date().toISOString().slice(0, 10);
  for (const waiver of waivers.values()) {
    if (!registry.activeTenants.some((tenant) => tenant.tenantKey === waiver.tenantKey)) {
      failures.push(`Column contract waiver names "${waiver.tenantKey}", which is not an active tenant. Remove the stale waiver.`);
      continue;
    }
    if (waiver.expires < today) {
      failures.push(
        `Column contract waiver for ${waiver.tenantKey} expired on ${waiver.expires}. Bring the package onto the contract or renew the waiver with a new expiry and owner. Remediation: ${waiver.remediation}`,
      );
    }
  }

  const tenantReports = registry.activeTenants.map((tenant) => {
    const files = sourceFilesForTenant(tenant);

    const inconsistentTerminators = files
      .map((file) => ({ path: `${file.packetId}/${file.relativePath}`, count: mixedLineEndings(file.absolutePath) }))
      .filter((entry) => entry.count > 0);
    if (inconsistentTerminators.length > 0) {
      failures.push(
        `${tenant.tenantKey}: ${inconsistentTerminators.length} file(s) mix CRLF and LF row terminators ` +
          `(${inconsistentTerminators.slice(0, 3).map((e) => `${e.path} x${e.count}`).join('; ')}). ` +
          'Readers disagree on how many rows such a file has, so rows go missing silently. ' +
          'Normalise with scripts/data/normalise-csv-line-endings.mjs.',
      );
    }
    const columnConformance = columnConformanceForTenant(tenant, manifest);

    const hollow = columnConformance
      .filter((entry) => entry.state === 'conformant' && entry.resolvedFile)
      .map((entry) => {
        const match = files.find((f) => path.basename(f.relativePath) === entry.resolvedFile);
        const declared = manifest.templates.find((t) => t.file === entry.contractFile)?.columns ?? [];
        if (!match) return { file: entry.resolvedFile, hollow: 0, total: 0 };
        return { file: entry.resolvedFile, ...hollowRows(match.absolutePath, declared) };
      })
      .filter((entry) => entry.hollow > 0);

    const hollowWaiver = (rules.hollowRowWaivers ?? []).find((w) => w.tenantKey === tenant.tenantKey);
    if (hollowWaiver && hollowWaiver.expires < today) {
      failures.push(
        `Hollow-row waiver for ${hollowWaiver.tenantKey} expired on ${hollowWaiver.expires}. ${hollowWaiver.remediation}`,
      );
    }
    for (const entry of hollow) {
      const share = Math.round((100 * entry.hollow) / Math.max(1, entry.total));
      if (hollowWaiver?.files.includes(entry.file)) continue;
      if (share >= 50) {
        failures.push(
          `${tenant.tenantKey}: ${entry.file} conforms to the contract and has ${entry.total} rows, ` +
            `but ${entry.hollow} of them (${share}%) carry no payload in any declared column. ` +
            'Row count and column conformance both pass; the file is largely empty.',
        );
      }
    }
    const nonConformant = columnConformance.filter((entry) => entry.state !== "conformant");
    const waiver = waivers.get(tenant.tenantKey);

    if (nonConformant.length > 0 && !waiver) {
      const detail = nonConformant
        .slice(0, 6)
        .map((entry) =>
          entry.state === "column-gap"
            ? `${entry.resolvedFile} missing ${entry.missingColumns.length} declared column(s)`
            : entry.state === "naming-drift"
              ? `${entry.contractFile} carried as ${entry.resolvedFile}`
              : `${entry.contractFile} absent`,
        )
        .join("; ");
      failures.push(
        `${tenant.tenantKey}: ${nonConformant.length} canonical dimension(s) do not match the declared column contract (${detail}${nonConformant.length > 6 ? "; …" : ""}). Fix the package, or add a dated waiver to quality-depth-rules.json.`,
      );
    }

    if (waiver && nonConformant.length === 0) {
      failures.push(
        `Column contract waiver for ${tenant.tenantKey} is no longer needed — the package is fully conformant. Remove it so the gate stays honest.`,
      );
    }

    const domainRows = new Map<string, number>();
    const domainFiles = new Map<string, Set<string>>();
    const unmappedFiles = files.filter((file) => file.domain === null && file.csvRows > 0);
    const currentTargetWarnings = files.filter(hasRiskyCurrentTargetBlend);

    for (const file of files) {
      if (!file.domain) continue;
      domainRows.set(file.domain, (domainRows.get(file.domain) ?? 0) + file.csvRows);
      if (!domainFiles.has(file.domain)) domainFiles.set(file.domain, new Set());
      domainFiles.get(file.domain)?.add(`${file.packetId}/${file.relativePath}`);
    }

    const thresholds = rules.companySizeBands[tenant.companySizeBand]?.minRows ?? {};
    const domainDepth = Object.entries(thresholds).map(([domain, minimumRows]) => {
      const rows = domainRows.get(domain) ?? 0;
      return {
        domain,
        rows,
        minimumRows,
        sourceFiles: Array.from(domainFiles.get(domain) ?? []),
        status: rows >= minimumRows ? "pass" : "blocker",
      };
    });

    return {
      tenantKey: tenant.tenantKey,
      displayName: tenant.displayName,
      companySizeBand: tenant.companySizeBand,
      packets: tenant.packets.map((packet) => packet.packetId),
      csvFileCount: files.length,
      csvRows: files.reduce((sum, file) => sum + file.csvRows, 0),
      mappedCsvRows: files.filter((file) => file.domain).reduce((sum, file) => sum + file.csvRows, 0),
      domainDepth,
      inconsistentLineEndingFiles: inconsistentTerminators.length,
      hollowRowFiles: hollow,
      columnContract: {
        declared: columnConformance.length,
        conformant: columnConformance.length - nonConformant.length,
        namingDrift: columnConformance.filter((entry) => entry.nameDrifted).length,
        columnGaps: columnConformance.filter((entry) => entry.state === "column-gap").length,
        absent: columnConformance.filter((entry) => entry.state === "absent").length,
        declaredColumnsTotal: columnConformance.reduce(
          (sum, entry) => sum + entry.populatedColumns + entry.emptyColumns.length + entry.missingColumns.length,
          0,
        ),
        declaredColumnsPopulated: columnConformance.reduce((sum, entry) => sum + entry.populatedColumns, 0),
        waived: Boolean(waiver),
        waiverExpires: waiver?.expires ?? "",
        nonConformantDetail: nonConformant,
      },
      blockers: domainDepth.filter((domain) => domain.status === "blocker"),
      warnings: [
        ...unmappedFiles.slice(0, 25).map((file) => `Unmapped source file: ${file.packetId}/${file.relativePath}`),
        ...currentTargetWarnings.map(
          (file) => `Potential current/target blend: ${file.packetId}/${file.relativePath}`,
        ),
      ],
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    truthSplit: {
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeBehaviorChanged: false,
      candidateRegenerated: false,
      sourceFilesStandardizedOnly: true,
    },
    universalTemplateSet: registry.universalTemplateSet,
    templates: {
      requiredCount: manifest.templates.filter((template) => template.required).length,
      missingRequired: missingTemplates,
    },
    tenants: tenantReports,
    retiredTenants: registry.retiredTenants,
    failures,
  };

  fs.writeFileSync(path.join(outDir, "tenant-input-quality-depth.json"), `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    "# Tenant Input Quality And Depth",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Truth Split",
    "",
    "- This report audits source-file standardization and depth only.",
    "- It does not regenerate candidates, write production data, update Active Tenant Access, or change module runtime behavior.",
    "",
    "## Universal Template Set",
    "",
    `- Template set: \`${registry.universalTemplateSet.templateSetId}\``,
    `- Template root: \`${registry.universalTemplateSet.root}\``,
    `- Azure container: \`${registry.universalTemplateSet.azureLanding.container}\``,
    `- Raw prefix: \`${registry.universalTemplateSet.azureLanding.rawPrefix}\``,
    `- Validated prefix: \`${registry.universalTemplateSet.azureLanding.validatedPrefix}\``,
    `- Archive prefix: \`${registry.universalTemplateSet.azureLanding.archivePrefix}\``,
    `- File naming: \`${registry.universalTemplateSet.azureLanding.fileNamePattern}\``,
    "",
    "## All-Tenant Depth Matrix",
    "",
    "| Tenant | Size band | CSV files | CSV rows | Mapped rows | Depth blockers | Warnings |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ...tenantReports.map(
      (tenant) =>
        `| ${tenant.displayName} | ${tenant.companySizeBand} | ${formatNumber(tenant.csvFileCount)} | ${formatNumber(tenant.csvRows)} | ${formatNumber(tenant.mappedCsvRows)} | ${tenant.blockers.length} | ${tenant.warnings.length} |`,
    ),
    "",
    "## Column Contract Conformance",
    "",
    "Depth says a dimension has enough rows. Conformance says those rows carry the columns the",
    "contract declares. A package can pass depth and still be unreadable to every adapter, so both",
    "are checked.",
    "",
    "| Tenant | Declared | Conformant | Naming drift | Column gaps | Absent | Contract fields carrying data | Waived until |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...tenantReports.map(
      (tenant) =>
        `| ${tenant.displayName} | ${tenant.columnContract.declared} | ${tenant.columnContract.conformant} | ${tenant.columnContract.namingDrift} | ${tenant.columnContract.columnGaps} | ${tenant.columnContract.absent} | ${tenant.columnContract.declaredColumnsPopulated}/${tenant.columnContract.declaredColumnsTotal} (${Math.round((100 * tenant.columnContract.declaredColumnsPopulated) / Math.max(1, tenant.columnContract.declaredColumnsTotal))}%) | ${tenant.columnContract.waiverExpires || "—"} |`,
    ),
    "",
    "## Domain Depth By Tenant",
    "",
  ];

  for (const tenant of tenantReports) {
    lines.push(`### ${tenant.displayName}`, "");
    lines.push("| Domain | Rows | Minimum | Status | Source files |");
    lines.push("| --- | ---: | ---: | --- | --- |");
    for (const domain of tenant.domainDepth) {
      lines.push(
        `| ${domain.domain} | ${formatNumber(domain.rows)} | ${formatNumber(domain.minimumRows)} | ${domain.status} | ${domain.sourceFiles.map((file) => `\`${file}\``).join("<br>") || "none"} |`,
      );
    }
    if (tenant.warnings.length > 0) {
      lines.push("", "Warnings:", "", ...tenant.warnings.map((warning) => `- ${warning}`));
    }
    lines.push("");
  }

  lines.push("## Retired / Excluded", "");
  for (const tenant of registry.retiredTenants) {
    lines.push(`- ${tenant.tenantKey}: ${tenant.status}`);
  }
  lines.push("");

  if (failures.length > 0) {
    lines.push("## Failures", "", ...failures.map((failure) => `- ${failure}`), "");
  }

  writeMarkdown(path.join(outDir, "tenant-input-quality-depth.md"), lines);

  if (failures.length > 0) {
    console.error(`tenant input quality audit failed with ${failures.length} failure(s)`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`Tenant input quality audit passed: ${tenantReports.length} active tenants audited`);
  console.log(path.relative(repoRoot, path.join(outDir, "tenant-input-quality-depth.md")));
}

run();
