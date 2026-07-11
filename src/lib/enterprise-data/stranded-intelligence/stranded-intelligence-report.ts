import fs from 'node:fs/promises';
import path from 'node:path';

import type { CanonicalIngestionRecord } from '../contracts/canonical-ingestion';
import type {
  CandidateTenantDataVersionPlan,
  TargetPersistenceMapping,
  TargetWriteOperation,
  TargetWriterDryRunSummary,
} from '../contracts/target-writer';

export type StrandedReason =
  | 'target_write_planned_not_persisted'
  | 'candidate_version_not_persisted'
  | 'module_readiness_not_proven'
  | 'derived_intelligence_not_materialized'
  | 'graph_not_materialized';

export interface StrandedRecordFinding {
  canonicalObjectKey?: string;
  sourceObjectId: string;
  objectType: string;
  domain: string;
  targetStoresPlanned: string[];
  reasons: StrandedReason[];
  nextProofNeeded: string;
}

export interface StrandedIntelligenceSummary {
  tenantKey: string;
  packetId: string;
  generatedAt: string;
  dryRunOnly: true;
  canonicalRecordsEvaluated: number;
  targetOperationsEvaluated: number;
  strandedRecordCount: number;
  targetWritePhysicalTables: false;
  candidateVersionPersisted: false;
  activePromotionProven: false;
  moduleConsumptionProven: false;
  qualityGateStatus: 'pass' | 'fail';
}

export interface StrandedIntelligenceReport {
  summary: StrandedIntelligenceSummary;
  findings: StrandedRecordFinding[];
  persistenceMappings: TargetPersistenceMapping[];
  candidateVersion: CandidateTenantDataVersionPlan;
  targetWriterSummary: TargetWriterDryRunSummary;
}

export interface StrandedIntelligenceReportOptions {
  repoRoot: string;
  sourceProofBundlePath: string;
  targetProofBundlePath: string;
  outputDir: string;
}

export async function buildStrandedIntelligenceReport(
  options: StrandedIntelligenceReportOptions,
): Promise<StrandedIntelligenceReport> {
  const sourceBundlePath = path.resolve(options.repoRoot, options.sourceProofBundlePath);
  const targetBundlePath = path.resolve(options.repoRoot, options.targetProofBundlePath);
  const sourceRecords = await readJson<CanonicalIngestionRecord[]>(
    path.join(sourceBundlePath, 'canonical-ingestion-records.json'),
  );
  const targetOperations = await readJson<TargetWriteOperation[]>(path.join(targetBundlePath, 'target-write-plan.json'));
  const persistenceMappings = await readJson<TargetPersistenceMapping[]>(path.join(targetBundlePath, 'persistence-mapping.json'));
  const candidateVersion = await readJson<CandidateTenantDataVersionPlan>(
    path.join(targetBundlePath, 'candidate-version-plan.json'),
  );
  const targetWriterSummary = await readJson<TargetWriterDryRunSummary>(
    path.join(targetBundlePath, 'dry-run-summary.json'),
  );
  const findings = sourceRecords.map((record) => buildFinding(record, targetOperations));
  const summary: StrandedIntelligenceSummary = {
    tenantKey: targetWriterSummary.tenantKey,
    packetId: targetWriterSummary.packetId,
    generatedAt: targetWriterSummary.generatedAt,
    dryRunOnly: true,
    canonicalRecordsEvaluated: sourceRecords.length,
    targetOperationsEvaluated: targetOperations.length,
    strandedRecordCount: findings.length,
    targetWritePhysicalTables: false,
    candidateVersionPersisted: false,
    activePromotionProven: false,
    moduleConsumptionProven: false,
    qualityGateStatus: findings.length === sourceRecords.length ? 'pass' : 'fail',
  };
  const report: StrandedIntelligenceReport = {
    summary,
    findings,
    persistenceMappings,
    candidateVersion,
    targetWriterSummary,
  };

  await writeReport(path.resolve(options.repoRoot, options.outputDir), report);
  return report;
}

function buildFinding(
  record: CanonicalIngestionRecord,
  targetOperations: TargetWriteOperation[],
): StrandedRecordFinding {
  const operationsForRecord = targetOperations.filter((operation) => operation.sourceObjectId === record.sourceObjectId);
  const targetStoresPlanned = [...new Set(operationsForRecord.map((operation) => operation.targetStore))].sort();
  const reasons: StrandedReason[] = [
    'target_write_planned_not_persisted',
    'candidate_version_not_persisted',
    'module_readiness_not_proven',
    'derived_intelligence_not_materialized',
  ];

  if (record.relationships.length > 0 || targetStoresPlanned.includes('enterprise_relationship_graph')) {
    reasons.push('graph_not_materialized');
  }

  return {
    canonicalObjectKey: record.canonicalObjectKey,
    sourceObjectId: record.sourceObjectId,
    objectType: record.objectType,
    domain: record.domain,
    targetStoresPlanned,
    reasons,
    nextProofNeeded: 'Run a persistence writer proof, candidate-version proof, and module-readiness proof before this intelligence is considered active.',
  };
}

async function writeReport(outputDir: string, report: StrandedIntelligenceReport): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'stranded-intelligence-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'stranded-intelligence-report.md'), toMarkdown(report));
}

function toMarkdown(report: StrandedIntelligenceReport): string {
  const rows = report.findings
    .map((finding) => `| ${finding.sourceObjectId} | ${finding.objectType} | ${finding.targetStoresPlanned.join(', ')} | ${finding.reasons.join(', ')} |`)
    .join('\n');

  return `# Stranded Intelligence Report

Tenant: \`${report.summary.tenantKey}\`
Packet: \`${report.summary.packetId}\`
Generated: \`${report.summary.generatedAt}\`

This report is dry-run only. It identifies canonical intelligence that has been parsed and planned,
but is not yet persisted, promoted, derived, graphed, or proven through module consumption.

## Summary

- Canonical records evaluated: ${report.summary.canonicalRecordsEvaluated}
- Target operations evaluated: ${report.summary.targetOperationsEvaluated}
- Stranded records: ${report.summary.strandedRecordCount}
- Target writes physical tables: ${report.summary.targetWritePhysicalTables}
- Candidate version persisted: ${report.summary.candidateVersionPersisted}
- Active promotion proven: ${report.summary.activePromotionProven}
- Module consumption proven: ${report.summary.moduleConsumptionProven}
- Quality gate: ${report.summary.qualityGateStatus}

## Findings

| Source object | Object type | Planned stores | Why stranded |
| --- | --- | --- | --- |
${rows}
`;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}
