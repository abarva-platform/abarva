import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { TenantPacketModule, TenantPacketSourceClass } from '../contracts/tenant-packet';
import { parseCsv } from '../source-adapters/csv-source-adapter';

type CandidateLayer = 'source_template' | 'target_candidate' | 'derived_candidate' | 'loader_payload' | 'manifest' | 'documentation';

interface SkyHarborGeneratedManifest {
  datasetId: string;
  tenantKey: string;
  tenantName: string;
  sourceBasis: string;
  rowCounts: Record<string, number>;
  generatedAt: string;
  notAllowedClaims: string[];
  commonKnownGaps: string[];
}

export interface SkyHarborSourceFileInventory {
  relativePath: string;
  layer: CandidateLayer;
  sourceClass: TenantPacketSourceClass | 'loader_payload' | 'manifest' | 'documentation' | 'unknown';
  declaredRowCount?: number;
  observedRowCount?: number;
  contentFingerprint: string;
  compatibilityRole: string;
}

export interface SkyHarborCandidateSignal {
  sourceFile: string;
  sourceObjectId: string;
  label: string;
  category: string;
  readinessSignal: string;
  evidenceBasis: string;
  knownGaps: string[];
}

export interface SkyHarborModuleReadiness {
  module: TenantPacketModule;
  readyForActiveConsumption: false;
  reason: string;
  requiredProof: string;
}

export interface SkyHarborCompatibilitySnapshotSummary {
  tenantKey: string;
  tenantDisplayName: string;
  datasetId: string;
  generatedAt: string;
  sourceRoot: string;
  dryRunOnly: true;
  compatibilityOnly: true;
  sourceFilesEvaluated: number;
  declaredRows: number;
  observedRows: number;
  candidateSignalsCaptured: number;
  guardrailsCaptured: number;
  knownGapsCaptured: number;
  writesPhysicalTables: false;
  activeTenantAccessLayerUpdated: false;
  moduleConsumptionProven: false;
  promotionApproved: false;
  qualityGateStatus: 'pass' | 'fail';
}

export interface SkyHarborCompatibilitySnapshot {
  summary: SkyHarborCompatibilitySnapshotSummary;
  sourceBasis: string;
  sourceFiles: SkyHarborSourceFileInventory[];
  candidateSignals: SkyHarborCandidateSignal[];
  notAllowedClaims: string[];
  knownGaps: string[];
  moduleReadiness: SkyHarborModuleReadiness[];
  upgradeCandidateControls: {
    candidateSnapshotGenerated: true;
    promoteAutomatically: false;
    productionDataClaimsAllowed: false;
    requiresHumanPromotionApproval: true;
    requiresPersistenceProofBeforeActivation: true;
    requiresModuleConsumptionProofBeforeActivation: true;
  };
}

export interface SkyHarborCompatibilitySnapshotOptions {
  repoRoot: string;
  sourceRoot?: string;
  outputDir: string;
  generatedAt?: string;
}

export async function buildSkyHarborCompatibilitySnapshot(
  options: SkyHarborCompatibilitySnapshotOptions,
): Promise<SkyHarborCompatibilitySnapshot> {
  const sourceRoot = options.sourceRoot ?? 'datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710';
  const absoluteSourceRoot = path.resolve(options.repoRoot, sourceRoot);
  const manifestPath = path.join(absoluteSourceRoot, 'V6_V7_GENERATED_MANIFEST.json');
  const manifest = await readJson<SkyHarborGeneratedManifest>(manifestPath);
  const allFiles = await listFiles(absoluteSourceRoot);
  const sourceFiles = await buildFileInventory({
    repoRoot: options.repoRoot,
    sourceRoot,
    absoluteSourceRoot,
    files: allFiles,
    rowCounts: manifest.rowCounts,
  });
  const candidateSignals = await buildCandidateSignals(absoluteSourceRoot);
  const generatedAt = options.generatedAt ?? manifest.generatedAt;
  const declaredRows = Object.values(manifest.rowCounts).reduce((sum, value) => sum + value, 0);
  const observedRows = sourceFiles.reduce((sum, file) => sum + (file.observedRowCount ?? 0), 0);
  const qualityGateStatus = manifest.tenantKey === 'skyharbor-air'
    && manifest.notAllowedClaims.length > 0
    && manifest.commonKnownGaps.length > 0
    && candidateSignals.length > 0
    ? 'pass'
    : 'fail';
  const snapshot: SkyHarborCompatibilitySnapshot = {
    summary: {
      tenantKey: manifest.tenantKey,
      tenantDisplayName: manifest.tenantName,
      datasetId: manifest.datasetId,
      generatedAt,
      sourceRoot,
      dryRunOnly: true,
      compatibilityOnly: true,
      sourceFilesEvaluated: sourceFiles.length,
      declaredRows,
      observedRows,
      candidateSignalsCaptured: candidateSignals.length,
      guardrailsCaptured: manifest.notAllowedClaims.length,
      knownGapsCaptured: manifest.commonKnownGaps.length,
      writesPhysicalTables: false,
      activeTenantAccessLayerUpdated: false,
      moduleConsumptionProven: false,
      promotionApproved: false,
      qualityGateStatus,
    },
    sourceBasis: manifest.sourceBasis,
    sourceFiles,
    candidateSignals,
    notAllowedClaims: manifest.notAllowedClaims,
    knownGaps: manifest.commonKnownGaps,
    moduleReadiness: buildModuleReadiness(),
    upgradeCandidateControls: {
      candidateSnapshotGenerated: true,
      promoteAutomatically: false,
      productionDataClaimsAllowed: false,
      requiresHumanPromotionApproval: true,
      requiresPersistenceProofBeforeActivation: true,
      requiresModuleConsumptionProofBeforeActivation: true,
    },
  };

  await writeSnapshot(path.resolve(options.repoRoot, options.outputDir), snapshot);
  return snapshot;
}

async function buildFileInventory(input: {
  repoRoot: string;
  sourceRoot: string;
  absoluteSourceRoot: string;
  files: string[];
  rowCounts: Record<string, number>;
}): Promise<SkyHarborSourceFileInventory[]> {
  const inventory: SkyHarborSourceFileInventory[] = [];

  for (const absoluteFilePath of input.files) {
    const relativeToSource = path.relative(input.absoluteSourceRoot, absoluteFilePath).replaceAll(path.sep, '/');
    const relativePath = `${input.sourceRoot}/${relativeToSource}`;
    const content = await fs.readFile(absoluteFilePath, 'utf8');
    const isCsv = relativeToSource.endsWith('.csv');
    const parsed = isCsv ? parseCsv(content) : undefined;
    inventory.push({
      relativePath,
      layer: classifyLayer(relativeToSource),
      sourceClass: classifySourceClass(relativeToSource),
      declaredRowCount: input.rowCounts[relativeToSource],
      observedRowCount: parsed?.rows.length,
      contentFingerprint: fingerprint(content),
      compatibilityRole: describeCompatibilityRole(relativeToSource),
    });
  }

  return inventory.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function buildCandidateSignals(absoluteSourceRoot: string): Promise<SkyHarborCandidateSignal[]> {
  const signals: SkyHarborCandidateSignal[] = [];
  const systemsPath = path.join(absoluteSourceRoot, 'v7', 'V7_05_applications_systems.csv');
  const evidencePath = path.join(absoluteSourceRoot, 'v7', 'V7_13_source_evidence_registry.csv');
  const findingsPath = path.join(absoluteSourceRoot, 'derived', 'skyharbor_air_moves_current_state_findings.csv');

  signals.push(...readSystemsSignals(systemsPath, await fs.readFile(systemsPath, 'utf8')));
  signals.push(...readEvidenceSignals(evidencePath, await fs.readFile(evidencePath, 'utf8')));
  signals.push(...readFindingSignals(findingsPath, await fs.readFile(findingsPath, 'utf8')));

  return signals;
}

function readSystemsSignals(sourcePath: string, content: string): SkyHarborCandidateSignal[] {
  return parseCsv(content).rows.slice(0, 8).map((row) => ({
    sourceFile: normalizedFile(sourcePath),
    sourceObjectId: row.system_id || row.entity_id,
    label: row.system_name,
    category: row.system_category || 'application_system',
    readinessSignal: row.ai_data_readiness || row.lifecycle_status || 'not_stated',
    evidenceBasis: row.source_artifact_name || 'candidate_system_inventory',
    knownGaps: splitGaps(row.known_gaps),
  }));
}

function readEvidenceSignals(sourcePath: string, content: string): SkyHarborCandidateSignal[] {
  return parseCsv(content).rows.map((row) => ({
    sourceFile: normalizedFile(sourcePath),
    sourceObjectId: row.evidence_id,
    label: row.source_artifact_label,
    category: row.evidence_purpose || 'evidence',
    readinessSignal: row.source_validation_status || row.validation_status || 'not_stated',
    evidenceBasis: row.source_artifact_uri,
    knownGaps: splitGaps(row.known_gaps),
  }));
}

function readFindingSignals(sourcePath: string, content: string): SkyHarborCandidateSignal[] {
  return parseCsv(content).rows.slice(0, 8).map((row) => ({
    sourceFile: normalizedFile(sourcePath),
    sourceObjectId: row.finding_id,
    label: row.move_name,
    category: row.data_domain,
    readinessSignal: row.current_state_finding,
    evidenceBasis: row.evidence_refs,
    knownGaps: [row.business_implication, row.recommended_next_step].filter(Boolean),
  }));
}

function buildModuleReadiness(): SkyHarborModuleReadiness[] {
  return [
    {
      module: 'home',
      readyForActiveConsumption: false,
      reason: 'Candidate profile exists, but the active tenant access layer has not been updated.',
      requiredProof: 'Promote a persisted candidate version and prove Home reads only the promoted slice.',
    },
    {
      module: 'intelligence',
      readyForActiveConsumption: false,
      reason: 'Candidate evidence exists, but retrieval and citation against the promoted slice are not proven.',
      requiredProof: 'Run signed-in answer proof with candidate evidence citations and stale-source suppression checks.',
    },
    {
      module: 'moves',
      readyForActiveConsumption: false,
      reason: 'Move findings and golden questions exist, but phase workspace consumption is not proven.',
      requiredProof: 'Run file-to-canonical-to-Moves readiness proof with phase and gate evidence checks.',
    },
    {
      module: 'source',
      readyForActiveConsumption: false,
      reason: 'Vendor and AMS signals exist, but sourcing workflow consumption is not proven.',
      requiredProof: 'Run Source compatibility proof for scope, evidence, vendor economics, and safe non-claims.',
    },
    {
      module: 'tower',
      readyForActiveConsumption: false,
      reason: 'Outcome and value signals are planning-grade; no realized outcome ledger proof exists.',
      requiredProof: 'Run Tower outcome-ledger proof before any value realization or ROI claim.',
    },
    {
      module: 'export',
      readyForActiveConsumption: false,
      reason: 'Executive artifacts have not been generated from the promoted candidate version.',
      requiredProof: 'Export a cited artifact from the promoted slice and verify source-event wording.',
    },
  ];
}

async function writeSnapshot(outputDir: string, snapshot: SkyHarborCompatibilitySnapshot): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'skyharbor-compatibility-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'skyharbor-compatibility-snapshot.md'), toMarkdown(snapshot));
}

function toMarkdown(snapshot: SkyHarborCompatibilitySnapshot): string {
  const sourceRows = snapshot.sourceFiles
    .map((file) => `| ${file.relativePath} | ${file.layer} | ${file.sourceClass} | ${file.observedRowCount ?? ''} | ${file.compatibilityRole} |`)
    .join('\n');
  const signalRows = snapshot.candidateSignals
    .map((signal) => `| ${signal.sourceObjectId} | ${signal.label} | ${signal.category} | ${signal.readinessSignal} |`)
    .join('\n');
  const moduleRows = snapshot.moduleReadiness
    .map((readiness) => `| ${readiness.module} | ${readiness.readyForActiveConsumption} | ${readiness.reason} | ${readiness.requiredProof} |`)
    .join('\n');
  const guardrails = snapshot.notAllowedClaims.map((claim) => `- ${claim}`).join('\n');
  const gaps = snapshot.knownGaps.map((gap) => `- ${gap}`).join('\n');

  return `# SkyHarbor Compatibility Snapshot

Tenant: \`${snapshot.summary.tenantKey}\`
Dataset: \`${snapshot.summary.datasetId}\`
Generated: \`${snapshot.summary.generatedAt}\`

This is a dry-run compatibility snapshot for an existing-tenant upgrade candidate.
It does not write production data, promote an active tenant version, or change module runtime behavior.

## Summary

- Source files evaluated: ${snapshot.summary.sourceFilesEvaluated}
- Declared rows: ${snapshot.summary.declaredRows}
- Observed CSV rows: ${snapshot.summary.observedRows}
- Candidate signals captured: ${snapshot.summary.candidateSignalsCaptured}
- Guardrails captured: ${snapshot.summary.guardrailsCaptured}
- Known gaps captured: ${snapshot.summary.knownGapsCaptured}
- Writes physical tables: ${snapshot.summary.writesPhysicalTables}
- Active tenant access layer updated: ${snapshot.summary.activeTenantAccessLayerUpdated}
- Module consumption proven: ${snapshot.summary.moduleConsumptionProven}
- Promotion approved: ${snapshot.summary.promotionApproved}
- Quality gate: ${snapshot.summary.qualityGateStatus}

## Non-Claim Guardrails

${guardrails}

## Known Gaps

${gaps}

## Candidate Signals

| Source object | Label | Category | Readiness signal |
| --- | --- | --- | --- |
${signalRows}

## Module Readiness

| Module | Ready | Reason | Required proof |
| --- | --- | --- | --- |
${moduleRows}

## Source Inventory

| Source file | Layer | Source class | Observed rows | Compatibility role |
| --- | --- | --- | --- | --- |
${sourceRows}
`;
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}

function classifyLayer(relativePath: string): CandidateLayer {
  if (relativePath === 'V6_V7_GENERATED_MANIFEST.json') return 'manifest';
  if (relativePath === 'README.md') return 'documentation';
  if (relativePath.startsWith('templates/')) return 'source_template';
  if (relativePath.startsWith('v7/')) return 'target_candidate';
  if (relativePath.startsWith('derived/')) return 'derived_candidate';
  if (relativePath.startsWith('azure/')) return 'loader_payload';
  return 'documentation';
}

function classifySourceClass(relativePath: string): SkyHarborSourceFileInventory['sourceClass'] {
  const lower = relativePath.toLowerCase();
  if (lower.endsWith('.json') && lower.includes('manifest')) return 'manifest';
  if (lower.includes('load-payload')) return 'loader_payload';
  if (lower.endsWith('.md')) return 'documentation';
  if (lower.includes('enterprise_profile') || lower.includes('portfolio_entity_registry')) return 'enterprise_profile';
  if (lower.includes('business_functions') || lower.includes('org_ownership') || lower.includes('workforce_personas')) return 'organization_functions';
  if (lower.includes('applications_systems') || lower.includes('infrastructure_cloud_estate')) return 'applications_systems';
  if (lower.includes('data_assets_integrations') || lower.includes('retrieval_registry')) return 'data_assets_integrations';
  if (lower.includes('vendors_contracts') || lower.includes('rate_card') || lower.includes('service_tower')) return 'vendors_contracts';
  if (lower.includes('spend_value')) return 'spend_value';
  if (lower.includes('programs') || lower.includes('ai_initiatives') || lower.includes('business_priorities')) return 'programs_priorities';
  if (lower.includes('risk_controls') || lower.includes('process_intelligence')) return 'risks_controls';
  if (lower.includes('metric_definitions')) return 'metric_definitions';
  if (lower.includes('evidence')) return 'evidence_registry';
  if (lower.includes('industry') || lower.includes('benchmark') || lower.includes('expert_lenses')) return 'benchmark_context';
  if (lower.includes('relationship') || lower.includes('graph')) return 'module_memory';
  if (lower.includes('outcome')) return 'outcome_measurements';
  return 'unknown';
}

function describeCompatibilityRole(relativePath: string): string {
  const layer = classifyLayer(relativePath);
  if (layer === 'source_template') return 'Legacy source-template input retained for migration compatibility and row-count comparison.';
  if (layer === 'target_candidate') return 'Candidate target-layer table used for snapshot inspection only.';
  if (layer === 'derived_candidate') return 'Derived candidate evidence used for readiness and non-claim checks.';
  if (layer === 'loader_payload') return 'Loader payload inventory only; this PR does not execute it.';
  if (layer === 'manifest') return 'Generated manifest used to preserve guardrails, row counts, and known gaps.';
  return 'Documentation or supporting artifact.';
}

function splitGaps(value?: string): string[] {
  return (value ?? '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizedFile(filePath: string): string {
  const marker = 'datasets/';
  const index = filePath.indexOf(marker);
  return index >= 0 ? filePath.slice(index) : filePath;
}

function fingerprint(value: string): string {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}
