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
  canonicalInputRoot: string;
  packets: Packet[];
};

type Registry = {
  schemaVersion: number;
  canonicalRoot: string;
  activeRoot: string;
  archiveRoot: string;
  policy: Record<string, boolean>;
  universalTemplateSet: {
    templateSetId: string;
    root: string;
    manifest: string;
    qualityDepthRules: string;
  };
  activeTenants: Tenant[];
  retiredTenants: Array<{
    tenantKey: string;
    displayName: string;
    status: string;
    archivePaths: string[];
    reason: string;
  }>;
  legacyRootsPendingArchiveCleanup: string[];
  legacyRootsArchived?: Array<{ from: string; to: string }>;
};

type FileSummary = {
  relativePath: string;
  extension: string;
  rows: number | null;
  sizeBytes: number;
};

type TemplateManifest = {
  templateSetId: string;
  templates: Array<{ file: string; required: boolean; columns: string[] }>;
};

const root = process.cwd();
const registryPath = path.join(root, "datasets/tenant-inputs/tenant-input-registry.json");
const outDir = path.join(root, "reports/canonical-tenant-inputs/latest");

function readRegistry(): Registry {
  return JSON.parse(fs.readFileSync(registryPath, "utf8")) as Registry;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function isUnder(child: string, parent: string): boolean {
  const relative = path.relative(path.resolve(root, parent), path.resolve(root, child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function countCsvRows(file: string): number | null {
  if (!file.toLowerCase().endsWith(".csv")) return null;
  const text = fs.readFileSync(file, "utf8").trim();
  if (!text) return 0;
  const lines = text.split(/\r?\n/);
  return Math.max(0, lines.length - 1);
}

function summarizePacket(packetPath: string): FileSummary[] {
  return walkFiles(path.join(root, packetPath))
    .filter((file) => /\.(csv|json|md|xlsx|xls|pdf|docx|pptx)$/i.test(file))
    .map((file) => ({
      relativePath: path.relative(path.join(root, packetPath), file),
      extension: path.extname(file).toLowerCase(),
      rows: countCsvRows(file),
      sizeBytes: fs.statSync(file).size,
    }))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function readTemplateManifest(registry: Registry): TemplateManifest {
  return JSON.parse(fs.readFileSync(path.join(root, registry.universalTemplateSet.manifest), "utf8")) as TemplateManifest;
}

function activeCurrentFiles(tenant: Tenant): string[] {
  return walkFiles(path.join(root, tenant.canonicalInputRoot))
    .map((file) => path.relative(path.join(root, tenant.canonicalInputRoot), file))
    .sort((left, right) => left.localeCompare(right));
}

function disallowedActiveFile(relativePath: string): boolean {
  return /(^|\/)(V[0-9]+_|.*current-state-pack.*|.*rich-enterprise-pack.*|.*rich-substrate-pack.*|.*upgrade-candidate-pack.*|.*enterprise-pack.*|.*holdco-pack.*)/i.test(
    relativePath,
  );
}

function escapeMarkdown(value: unknown): string {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function writeMarkdown(file: string, lines: string[]): void {
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function run(): void {
  const registry = readRegistry();
  const templateManifest = readTemplateManifest(registry);
  const requiredUniversalFiles = templateManifest.templates
    .filter((template) => template.required)
    .map((template) => template.file)
    .sort((left, right) => left.localeCompare(right));
  ensureDir(outDir);

  const failures: string[] = [];
  const tenantReports = registry.activeTenants.map((tenant) => {
    if (!isUnder(tenant.canonicalInputRoot, registry.activeRoot)) {
      failures.push(`${tenant.tenantKey}: canonicalInputRoot is outside ${registry.activeRoot}`);
    }
    if (!fs.existsSync(path.join(root, tenant.canonicalInputRoot))) {
      failures.push(`${tenant.tenantKey}: missing canonical root ${tenant.canonicalInputRoot}`);
    }
    if (tenant.packets.length !== 1 || tenant.packets[0]?.path !== tenant.canonicalInputRoot) {
      failures.push(
        `${tenant.tenantKey}: active registry must point to exactly one current-universal packet at ${tenant.canonicalInputRoot}`,
      );
    }

    const currentFiles = activeCurrentFiles(tenant);
    const currentCsvFiles = currentFiles.filter((file) => file.toLowerCase().endsWith(".csv"));
    const nestedFiles = currentFiles.filter((file) => file.includes(path.sep) || file.includes("/"));
    const disallowedFiles = currentFiles.filter(disallowedActiveFile);
    const missingUniversalFiles = requiredUniversalFiles.filter((file) => !currentCsvFiles.includes(file));
    const extraCsvFiles = currentCsvFiles.filter((file) => !requiredUniversalFiles.includes(file));
    if (nestedFiles.length > 0) {
      failures.push(`${tenant.tenantKey}: active current root contains nested files: ${nestedFiles.join(", ")}`);
    }
    if (disallowedFiles.length > 0) {
      failures.push(`${tenant.tenantKey}: active current root contains legacy/versioned files: ${disallowedFiles.join(", ")}`);
    }
    if (missingUniversalFiles.length > 0) {
      failures.push(`${tenant.tenantKey}: missing universal active files: ${missingUniversalFiles.join(", ")}`);
    }
    if (extraCsvFiles.length > 0) {
      failures.push(`${tenant.tenantKey}: extra active CSV files outside universal template set: ${extraCsvFiles.join(", ")}`);
    }

    const packets = tenant.packets.map((packet) => {
      if (!isUnder(packet.path, registry.activeRoot)) {
        failures.push(`${tenant.tenantKey}/${packet.packetId}: packet is outside ${registry.activeRoot}`);
      }
      if (!fs.existsSync(path.join(root, packet.path))) {
        failures.push(`${tenant.tenantKey}/${packet.packetId}: missing packet path ${packet.path}`);
      }
      const files = summarizePacket(packet.path);
      if (files.length === 0) {
        failures.push(`${tenant.tenantKey}/${packet.packetId}: packet has no input files`);
      }
      const csvRows = files.reduce((sum, file) => sum + (file.rows ?? 0), 0);
      return {
        ...packet,
        files,
        fileCount: files.length,
        csvFileCount: files.filter((file) => file.extension === ".csv").length,
        csvRows,
      };
    });

    return {
      ...tenant,
      packets,
      currentCsvFiles,
      requiredUniversalFileCount: requiredUniversalFiles.length,
      fileCount: packets.reduce((sum, packet) => sum + packet.fileCount, 0),
      csvRows: packets.reduce((sum, packet) => sum + packet.csvRows, 0),
    };
  });

  for (const retired of registry.retiredTenants) {
    for (const archivePath of retired.archivePaths) {
      if (!isUnder(archivePath, registry.archiveRoot)) {
        failures.push(`${retired.tenantKey}: archive path is outside ${registry.archiveRoot}`);
      }
      if (!fs.existsSync(path.join(root, archivePath))) {
        failures.push(`${retired.tenantKey}: missing archive path ${archivePath}`);
      }
    }
  }

  const northstarActive = registry.activeTenants.some((tenant) =>
    tenant.tenantKey.toLowerCase().includes("northstar"),
  );
  if (northstarActive) failures.push("Northstar appears in activeTenants but is retired/excluded.");

  const report = {
    generatedAt: new Date().toISOString(),
    guardrails: {
      activeLoaderInputsMustBeUnderCanonicalRoot: true,
      oneUniversalFilePerDomainPerTenant: true,
      noVersionedFilesUnderActiveCurrent: true,
      noNestedPacketFoldersUnderActiveCurrent: true,
      northstarActive: northstarActive,
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeBehaviorChanged: false,
    },
    registry,
    tenants: tenantReports,
    failures,
  };

  fs.writeFileSync(path.join(outDir, "canonical-tenant-inputs.json"), `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    "# Canonical Tenant Inputs",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Guardrails",
    "",
    `- productionTenantDataWritten: ${report.guardrails.productionTenantDataWritten}`,
    `- activeTenantAccessLayerUpdated: ${report.guardrails.activeTenantAccessLayerUpdated}`,
    `- moduleRuntimeBehaviorChanged: ${report.guardrails.moduleRuntimeBehaviorChanged}`,
    `- oneUniversalFilePerDomainPerTenant: ${report.guardrails.oneUniversalFilePerDomainPerTenant}`,
    `- noVersionedFilesUnderActiveCurrent: ${report.guardrails.noVersionedFilesUnderActiveCurrent}`,
    `- noNestedPacketFoldersUnderActiveCurrent: ${report.guardrails.noNestedPacketFoldersUnderActiveCurrent}`,
    `- northstarActive: ${report.guardrails.northstarActive}`,
    "",
    "## Active Tenant Input Roots",
    "",
    "| Tenant | Canonical root | Packets | Universal CSV files | Files | CSV rows |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    ...tenantReports.map(
      (tenant) =>
        `| ${tenant.displayName} | \`${tenant.canonicalInputRoot}\` | ${tenant.packets.length} | ${tenant.currentCsvFiles.length}/${tenant.requiredUniversalFileCount} | ${tenant.fileCount.toLocaleString()} | ${tenant.csvRows.toLocaleString()} |`,
    ),
    "",
    "## Packet Detail",
    "",
    "| Tenant | Packet | Path | CSV files | CSV rows | Status |",
    "| --- | --- | --- | ---: | ---: | --- |",
    ...tenantReports.flatMap((tenant) =>
      tenant.packets.map(
        (packet) =>
          `| ${tenant.displayName} | ${packet.packetId} | \`${packet.path}\` | ${packet.csvFileCount.toLocaleString()} | ${packet.csvRows.toLocaleString()} | ${packet.status} |`,
      ),
    ),
    "",
    "## Retired / Archived Tenants",
    "",
    "| Tenant | Status | Archive paths | Reason |",
    "| --- | --- | --- | --- |",
    ...registry.retiredTenants.map(
      (tenant) =>
        `| ${tenant.displayName} | ${tenant.status} | ${tenant.archivePaths.map((p) => `\`${p}\``).join("<br>")} | ${escapeMarkdown(tenant.reason)} |`,
    ),
    "",
    "## Legacy Roots Pending Mechanical Cleanup",
    "",
    ...(registry.legacyRootsPendingArchiveCleanup.length > 0
      ? registry.legacyRootsPendingArchiveCleanup.map((legacyRoot) => `- \`${legacyRoot}\``)
      : ["None."]),
    "",
    "## Legacy Roots Archived",
    "",
    "| From | To |",
    "| --- | --- |",
    ...((registry.legacyRootsArchived ?? []).map(
      (legacyRoot) => `| \`${legacyRoot.from}\` | \`${legacyRoot.to}\` |`,
    )),
    "",
  ];

  if (failures.length > 0) {
    lines.push("## Failures", "", ...failures.map((failure) => `- ${failure}`), "");
  }

  writeMarkdown(path.join(outDir, "canonical-tenant-inputs.md"), lines);

  const inventoryLines = [
    "# Tenant Source File Inventory",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "This is the deterministic list of active tenant input files declared under the canonical root.",
    "",
    "| Tenant | Packet | File | Type | CSV rows |",
    "| --- | --- | --- | --- | ---: |",
    ...tenantReports.flatMap((tenant) =>
      tenant.packets.flatMap((packet) =>
        packet.files.map(
          (file) =>
            `| ${tenant.displayName} | ${packet.packetId} | \`${packet.path}/${file.relativePath}\` | ${file.extension.replace(".", "") || "none"} | ${file.rows === null ? "" : file.rows.toLocaleString()} |`,
        ),
      ),
    ),
    "",
    "## Retired / Excluded Inputs",
    "",
    ...registry.retiredTenants.flatMap((tenant) => [
      `### ${tenant.displayName}`,
      "",
      `Status: ${tenant.status}`,
      "",
      ...tenant.archivePaths.map((archivePath) => `- \`${archivePath}\``),
      "",
    ]),
  ];

  writeMarkdown(path.join(outDir, "tenant-source-file-inventory.md"), inventoryLines);

  if (failures.length > 0) {
    console.error(`canonical tenant input audit failed with ${failures.length} failure(s)`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`Canonical tenant input audit passed: ${tenantReports.length} active tenants`);
  console.log(path.relative(root, path.join(outDir, "canonical-tenant-inputs.md")));
}

run();
