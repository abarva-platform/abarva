import fs from "node:fs/promises";
import path from "node:path";

type SourceFile = {
  tenantKey: string;
  tenantDisplayName: string;
  packetId: string;
  packetPath: string;
  relativePath: string;
  repoRelativePath: string;
  classification: string;
  domain: string | null;
  rowCount: number;
  contentFingerprint: string;
};

type TenantBuild = {
  tenantKey: string;
  displayName: string;
  companySizeBand: string;
  packets: Array<{
    packetId: string;
    path: string;
    classification: string;
    status: string;
    note?: string;
  }>;
  sourceFiles: SourceFile[];
};

type TemplateManifest = {
  templateSetId: string;
  root: string;
  description: string;
  templates: Array<{
    file: string;
    required: boolean;
    columns: string[];
  }>;
  azureLanding: {
    container: string;
    prefixPattern: string;
    validatedPrefixPattern: string;
    archivePrefixPattern: string;
    fileNamePattern: string;
  };
};

const repoRoot = path.resolve(__dirname, "../..");
const reportDir = path.join(repoRoot, "reports/data-layer-design");

function rel(filePath: string): string {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function domainLabel(domain: string | null): string {
  return domain ?? "unmapped_or_supporting_file";
}

function mdEscape(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function readJson<T>(repoRelativePath: string): Promise<T> {
  return JSON.parse(
    await fs.readFile(path.join(repoRoot, repoRelativePath), "utf8"),
  ) as T;
}

async function main() {
  await fs.mkdir(reportDir, { recursive: true });

  const [tenantBuilds, templateManifest] = await Promise.all([
    readJson<TenantBuild[]>(
      "reports/canonical-data-build/latest/tenant-build-index.json",
    ),
    readJson<TemplateManifest>(
      "datasets/tenant-inputs/templates/universal/standard-2026-07-v3/template-manifest.json",
    ),
  ]);

  const generatedAt = new Date().toISOString();
  const inventory = {
    generatedAt,
    source: "reports/canonical-data-build/latest/tenant-build-index.json",
    rule: {
      oneTemplateStandard: templateManifest.templateSetId,
      oneTemplateLocation: templateManifest.root,
      oneActiveInputLocation: "datasets/tenant-inputs/active",
      oneProcess:
        "build:canonical-tenant-data -> build:candidate-version -> audit:active-module-context-promotion -> module context serving",
      note:
        "Current active files may retain historical filename prefixes as compatibility identifiers; the governing template standard is the universal template set.",
    },
    azureLanding: templateManifest.azureLanding,
    templates: templateManifest.templates.map((template) => ({
      file: template.file,
      required: template.required,
      columnCount: template.columns.length,
      columns: template.columns,
    })),
    tenants: tenantBuilds.map((tenant) => {
      const sourceRows = tenant.sourceFiles.reduce(
        (sum, file) => sum + file.rowCount,
        0,
      );
      return {
        tenantKey: tenant.tenantKey,
        displayName: tenant.displayName,
        companySizeBand: tenant.companySizeBand,
        packets: tenant.packets,
        sourceFileCount: tenant.sourceFiles.length,
        sourceRows,
        domains: Object.fromEntries(
          Array.from(
            tenant.sourceFiles.reduce((map, file) => {
              const key = domainLabel(file.domain);
              const current = map.get(key) ?? { files: 0, rows: 0 };
              current.files += 1;
              current.rows += file.rowCount;
              map.set(key, current);
              return map;
            }, new Map<string, { files: number; rows: number }>()),
          ).sort(([a], [b]) => a.localeCompare(b)),
        ),
        sourceFiles: tenant.sourceFiles.map((file) => ({
          tenantKey: tenant.tenantKey,
          displayName: tenant.displayName,
          packetId: file.packetId,
          classification: file.classification,
          domain: domainLabel(file.domain),
          rowCount: file.rowCount,
          repoRelativePath: file.repoRelativePath,
          packetPath: file.packetPath,
          contentFingerprint: file.contentFingerprint,
        })),
      };
    }),
  };

  await fs.writeFile(
    path.join(reportDir, "active-input-file-inventory.json"),
    `${JSON.stringify(inventory, null, 2)}\n`,
  );

  const lines: string[] = [];
  lines.push("# Active Tenant Input File Inventory");
  lines.push("");
  lines.push(`Generated: \`${generatedAt}\``);
  lines.push("");
  lines.push("## Standard");
  lines.push("");
  lines.push(
    `- Universal template standard: \`${templateManifest.templateSetId}\``,
  );
  lines.push(`- Universal template location: \`${templateManifest.root}\``);
  lines.push("- Active tenant input location: `datasets/tenant-inputs/active`");
  lines.push(
    "- Process: `build:canonical-tenant-data` -> `build:candidate-version` -> `audit:active-module-context-promotion` -> module context serving",
  );
  lines.push(
    "- Legacy labels in current filenames are compatibility identifiers, not architecture names.",
  );
  lines.push("");
  lines.push("## Azure Landing Convention");
  lines.push("");
  lines.push(`- Container: \`${templateManifest.azureLanding.container}\``);
  lines.push(`- Raw: \`${templateManifest.azureLanding.prefixPattern}\``);
  lines.push(
    `- Validated: \`${templateManifest.azureLanding.validatedPrefixPattern}\``,
  );
  lines.push(
    `- Archive: \`${templateManifest.azureLanding.archivePrefixPattern}\``,
  );
  lines.push(
    `- Filename: \`${templateManifest.azureLanding.fileNamePattern}\``,
  );
  lines.push("");
  lines.push("## Universal Template Files");
  lines.push("");
  lines.push("| Template | Required | Columns |");
  lines.push("| --- | --- | ---: |");
  for (const template of templateManifest.templates) {
    lines.push(
      `| \`${template.file}\` | ${template.required ? "yes" : "no"} | ${
        template.columns.length
      } |`,
    );
  }
  lines.push("");
  lines.push("## Tenant Summary");
  lines.push("");
  lines.push("| Tenant | Packets | Active input files | Source rows | Domains |");
  lines.push("| --- | ---: | ---: | ---: | ---: |");
  for (const tenant of inventory.tenants) {
    lines.push(
      `| ${mdEscape(tenant.displayName)} (\`${tenant.tenantKey}\`) | ${
        tenant.packets.length
      } | ${tenant.sourceFileCount} | ${tenant.sourceRows.toLocaleString()} | ${
        Object.keys(tenant.domains).length
      } |`,
    );
  }
  lines.push("");
  lines.push("## Actual Files Used By The Canonical Build");
  lines.push("");
  for (const tenant of inventory.tenants) {
    lines.push(`### ${tenant.displayName} (\`${tenant.tenantKey}\`)`);
    lines.push("");
    lines.push("| Packet | Domain | Rows | Classification | File | Fingerprint |");
    lines.push("| --- | --- | ---: | --- | --- | --- |");
    for (const file of tenant.sourceFiles) {
      lines.push(
        `| \`${mdEscape(file.packetId)}\` | \`${mdEscape(file.domain)}\` | ${
          file.rowCount
        } | \`${mdEscape(file.classification)}\` | \`${mdEscape(
          file.repoRelativePath,
        )}\` | \`${file.contentFingerprint.slice(0, 12)}...\` |`,
      );
    }
    lines.push("");
  }

  await fs.writeFile(
    path.join(reportDir, "active-input-file-inventory.md"),
    `${trimTrailingEmptyLines(lines).join("\n")}\n`,
  );

  console.log(
    `Generated ${rel(path.join(reportDir, "active-input-file-inventory.md"))}`,
  );
  console.log(
    `Generated ${rel(path.join(reportDir, "active-input-file-inventory.json"))}`,
  );
}

function trimTrailingEmptyLines(lines: string[]): string[] {
  const trimmed = [...lines];
  while (trimmed.at(-1) === "") trimmed.pop();
  return trimmed;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
