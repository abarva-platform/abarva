import fs from 'node:fs/promises';
import path from 'node:path';

import type { CanonicalIngestionRecord } from '../contracts/canonical-ingestion';
import type { MappingCoverageReport } from '../contracts/mapping-registry';
import type { SourceAdapterFinding } from '../contracts/source-adapter';
import type { TenantPacketManifest } from '../contracts/tenant-packet';
import { CsvSourceAdapter } from '../source-adapters/csv-source-adapter';

export interface TenantPacketDryRunOptions {
  repoRoot: string;
  manifestPath: string;
  outputDir: string;
  generatedAt?: string;
}

export interface TenantPacketQuarantineReport {
  sourcePath: string;
  quarantinedRecordCount: number;
  findings: SourceAdapterFinding[];
}

export interface TenantPacketDryRunSummary {
  packetId: string;
  tenantKey: string;
  manifestPath: string;
  generatedAt: string;
  dryRunOnly: true;
  filesProcessed: number;
  canonicalRecordCount: number;
  quarantinedRecordCount: number;
  minimumMappingCoveragePercent: number;
  minimumObservedMappingCoveragePercent: number;
  qualityGateStatus: 'pass' | 'fail';
  proofBundlePath: string;
}

export interface TenantPacketDryRunResult {
  manifest: TenantPacketManifest;
  records: CanonicalIngestionRecord[];
  coverageReports: MappingCoverageReport[];
  quarantineReports: TenantPacketQuarantineReport[];
  summary: TenantPacketDryRunSummary;
}

export async function runTenantPacketDryRun(options: TenantPacketDryRunOptions): Promise<TenantPacketDryRunResult> {
  const manifest = await loadManifest(options.manifestPath);
  const generatedAt = options.generatedAt ?? `${manifest.effectiveDate}T00:00:00.000Z`;
  const packetRoot = path.dirname(options.manifestPath);
  const adapter = new CsvSourceAdapter();
  const records: CanonicalIngestionRecord[] = [];
  const coverageReports: MappingCoverageReport[] = [];
  const quarantineReports: TenantPacketQuarantineReport[] = [];

  for (const packetFile of manifest.files) {
    if (packetFile.adapterKey !== adapter.adapterKey) {
      quarantineReports.push({
        sourcePath: packetFile.path,
        quarantinedRecordCount: 0,
        findings: [
          {
            severity: 'error',
            code: 'adapter_not_available',
            message: `Adapter ${packetFile.adapterKey} is not available in the PR3 dry-run skeleton.`,
          },
        ],
      });
      continue;
    }

    const sourcePath = path.resolve(packetRoot, packetFile.path);
    const result = await adapter.parse({
      tenantKey: manifest.tenantKey,
      packetId: manifest.packetId,
      packetVersion: manifest.contractVersion,
      sourcePath,
      packetFile,
      sourceProfile: packetFile.sourceProfile,
      parserVersion: adapter.adapterVersion,
      mappingProfile: packetFile.mappingProfile,
      observedAt: generatedAt,
    });
    records.push(...result.records);
    coverageReports.push({
      mappingProfile: packetFile.mappingProfile,
      sourceClass: packetFile.sourceClass,
      mappedFieldCount: result.mappedFieldCount,
      unmappedFieldCount: result.unmappedFields.length,
      requiredFieldCount: result.requiredFieldCount,
      missingRequiredFieldCount: result.missingRequiredFieldCount,
      coveragePercent: result.mappingCoveragePercent,
    });
    quarantineReports.push({
      sourcePath: packetFile.path,
      quarantinedRecordCount: result.quarantinedRecordCount,
      findings: result.findings,
    });
  }

  const minimumObservedMappingCoveragePercent = coverageReports.length === 0
    ? 0
    : Math.min(...coverageReports.map((report) => report.coveragePercent));
  const quarantinedRecordCount = quarantineReports.reduce((sum, report) => sum + report.quarantinedRecordCount, 0);
  const qualityGateStatus = minimumObservedMappingCoveragePercent >= manifest.qualityGates.minimumMappingCoveragePercent
    && (manifest.qualityGates.allowQuarantinedRecords || quarantinedRecordCount === 0)
    ? 'pass'
    : 'fail';
  const proofBundlePath = options.outputDir;
  const summary: TenantPacketDryRunSummary = {
    packetId: manifest.packetId,
    tenantKey: manifest.tenantKey,
    manifestPath: path.relative(options.repoRoot, options.manifestPath),
    generatedAt,
    dryRunOnly: true,
    filesProcessed: manifest.files.length,
    canonicalRecordCount: records.length,
    quarantinedRecordCount,
    minimumMappingCoveragePercent: manifest.qualityGates.minimumMappingCoveragePercent,
    minimumObservedMappingCoveragePercent,
    qualityGateStatus,
    proofBundlePath,
  };

  await writeProofBundle(path.resolve(options.repoRoot, options.outputDir), {
    manifest,
    records,
    coverageReports,
    quarantineReports,
    summary,
  });

  return {
    manifest,
    records,
    coverageReports,
    quarantineReports,
    summary,
  };
}

async function writeProofBundle(
  outputDir: string,
  result: Omit<TenantPacketDryRunResult, 'summary'> & { summary: TenantPacketDryRunSummary },
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'manifest.normalized.json'), `${JSON.stringify(result.manifest, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'canonical-ingestion-records.json'), `${JSON.stringify(result.records, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'mapping-coverage.json'), `${JSON.stringify(result.coverageReports, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'quarantine-report.json'), `${JSON.stringify(result.quarantineReports, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'dry-run-summary.json'), `${JSON.stringify(result.summary, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'README.md'), proofReadme(result.summary));
}

function proofReadme(summary: TenantPacketDryRunSummary): string {
  return `# Tenant Packet Dry-Run Proof Bundle

Packet: \`${summary.packetId}\`
Tenant: \`${summary.tenantKey}\`
Generated: \`${summary.generatedAt}\`

This proof bundle was generated in dry-run mode. It contains canonical ingestion candidates,
mapping coverage, and quarantine findings only. It does not write to production DB, does not
mutate tenant data, and does not change module runtime behavior.

## Result

- Files processed: ${summary.filesProcessed}
- Canonical records: ${summary.canonicalRecordCount}
- Quarantined records: ${summary.quarantinedRecordCount}
- Minimum required mapping coverage: ${summary.minimumMappingCoveragePercent}%
- Minimum observed mapping coverage: ${summary.minimumObservedMappingCoveragePercent}%
- Quality gate: ${summary.qualityGateStatus}
`;
}

async function loadManifest(manifestPath: string): Promise<TenantPacketManifest> {
  const text = await fs.readFile(manifestPath, 'utf8');
  return parseSimpleManifestYaml(text) as unknown as TenantPacketManifest;
}

function parseScalar(value: string): string | number | boolean {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function parseSimpleManifestYaml(text: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  const stack: Array<{ indent: number; value: Record<string, unknown> | unknown[] }> = [{ indent: -1, value: root }];
  const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trimStart().startsWith('#'));

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const indent = line.match(/^ */)?.[0].length ?? 0;
    const trimmed = line.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;

    if (trimmed.startsWith('- ')) {
      if (!Array.isArray(parent)) throw new Error(`Unexpected list item: ${trimmed}`);
      const itemText = trimmed.slice(2);
      if (itemText.includes(':')) {
        const [rawKey, ...rest] = itemText.split(':');
        const item: Record<string, unknown> = {};
        const value = rest.join(':').trim();
        item[rawKey.trim()] = value ? parseScalar(value) : {};
        parent.push(item);
        stack.push({ indent, value: item });
      } else {
        parent.push(parseScalar(itemText));
      }
      continue;
    }

    const [rawKey, ...rest] = trimmed.split(':');
    const key = rawKey.trim();
    const value = rest.join(':').trim();
    if (!value) {
      const nextLine = lines[lineIndex + 1]?.trim();
      const container: Record<string, unknown> | unknown[] = nextLine?.startsWith('- ') ? [] : {};
      (parent as Record<string, unknown>)[key] = container;
      stack.push({ indent, value: container });
    } else {
      (parent as Record<string, unknown>)[key] = parseScalar(value);
    }
  }

  return root;
}
