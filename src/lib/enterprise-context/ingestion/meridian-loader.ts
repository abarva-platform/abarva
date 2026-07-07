import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

import {
  ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS,
  type EnterpriseContextTemplateWorkbook,
} from '../template-schema';

export type EnterpriseContextCsvRow = Record<string, string>;

export interface EnterpriseContextDatasetManifest {
  tenantKey: string;
  tenantSlug: string;
  displayName: string;
  generatedAt: string;
  fictional: boolean;
  noPhi: boolean;
  seed: string;
  templateVersion: string;
  workbookCount: number;
  totalRows: number;
  validation: { unresolvedReferences: number };
  datasets: Array<{
    key: string;
    title: string;
    csv: string;
    xlsx: string;
    rows: number;
    columns: string[];
  }>;
}

export interface ParsedEnterpriseContextDataset {
  rootDir: string;
  manifest: EnterpriseContextDatasetManifest;
  tables: Record<string, EnterpriseContextCsvRow[]>;
}

export interface EnterpriseContextValidationIssue {
  issueKey: string;
  issueType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceFile: string;
  sourceSheet: string;
  sourceRowNumber: number;
  message: string;
}

export interface PlannedEnterpriseContextRecord {
  tenantKey: string;
  canonicalRecordId: string;
  recordType: string;
  title: string;
  sourceSystem: string;
  sourceRecordId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRowNumber: number;
  owner: string;
  lastValidatedAt: string;
  confidence: number;
  freshnessStatus: 'fresh' | 'attention' | 'stale' | 'unknown';
  evidencePointer: string;
  lifecycleState: 'active' | 'superseded' | 'inactive';
  payloadHash: string;
  payload: EnterpriseContextCsvRow;
}

export interface PlannedEnterpriseContextFact {
  tenantKey: string;
  canonicalRecordId: string;
  factKey: string;
  factType: string;
  factValue: unknown;
  factText: string;
  sourceSystem: string;
  sourceRecordId: string;
  sourceFile: string;
  sourceSheet: string;
  sourceRowNumber: number;
  owner: string;
  lastValidatedAt: string;
  confidence: number;
  freshnessStatus: 'fresh' | 'attention' | 'stale' | 'unknown';
  evidencePointer: string;
  lifecycleState: 'active' | 'superseded' | 'inactive';
  valueHash: string;
}

export interface EnterpriseContextIngestionPlan {
  tenantKey: string;
  sourceRoot: string;
  sources: Array<{ sourceSystem: string; sourceKey: string; displayName: string; sourceOwner: string }>;
  sourceFiles: Array<{ sourceFileId: string; sourceSystem: string; sourceFile: string; workbookName: string; rowCount: number }>;
  records: PlannedEnterpriseContextRecord[];
  facts: PlannedEnterpriseContextFact[];
  relationships: Array<{
    tenantKey: string;
    relationshipKey: string;
    relationshipType: string;
    fromExternalId: string;
    toExternalId: string;
    sourceSystem: string;
    sourceRecordId: string;
    sourceFile: string;
    sourceSheet: string;
    sourceRowNumber: number;
    owner: string;
    lastValidatedAt: string;
    confidence: number;
    freshnessStatus: 'fresh' | 'attention' | 'stale' | 'unknown';
    evidencePointer: string;
    properties: Record<string, unknown>;
  }>;
  evidence: Array<{
    tenantKey: string;
    evidenceKey: string;
    evidenceType: string;
    canonicalRecordId: string;
    citationLabel: string;
    citationLocator: string;
    evidencePointer: string;
    sourceSystem: string;
    sourceRecordId: string;
    sourceFile: string;
    sourceSheet: string;
    sourceRowNumber: number;
    owner: string;
    evidenceUsable: boolean;
    confidence: number;
    freshnessStatus: 'fresh' | 'attention' | 'stale' | 'unknown';
  }>;
  qualityIssues: EnterpriseContextValidationIssue[];
  stewardshipTasks: Array<EnterpriseContextValidationIssue & { taskKey: string; title: string; assignedOwner: string }>;
  chunkQueue: Array<{ queueKey: string; canonicalRecordId: string; operation: 'upsert'; sourceSystem: string; sourceRecordId: string }>;
  summary: Record<string, number>;
}

const COMMON_COLUMNS = new Set([
  'source_system',
  'source_record_id',
  'source_owner',
  'last_validated_date',
  'confidence',
  'evidence_usable',
  'notes_gaps',
]);

const PRIMARY_KEY_BY_TEMPLATE: Record<string, string> = {
  org_decision_rights: 'person_or_group_id',
  facilities_business_units: 'facility_id',
  cmdb_applications_services: 'ci_id',
  ci_relationships_dependencies: 'relationship_id',
  vendors_contract_inventory: 'contract_id',
  renewal_calendar: 'renewal_id',
  spend_baseline: 'spend_id',
  policies_procedures: 'policy_id',
  incidents: 'incident_id',
  problems: 'problem_id',
  changes: 'change_id',
  slas: 'sla_id',
  initiative_portfolio: 'initiative_id',
  data_domains_stewardship: 'data_domain_id',
  risk_compliance_register: 'risk_id',
};

const TITLE_COLUMNS = [
  'name',
  'facility_name',
  'ci_name',
  'vendor_name',
  'contract_name',
  'policy_name',
  'short_description',
  'initiative_name',
  'domain_name',
  'risk_title',
  'sla_name',
  'business_service',
];

export function parseMeridianEnterpriseContextDataset(rootDir: string): ParsedEnterpriseContextDataset {
  const manifest = JSON.parse(readFileSync(path.join(rootDir, 'manifest.json'), 'utf8')) as EnterpriseContextDatasetManifest;
  const tables: Record<string, EnterpriseContextCsvRow[]> = {};
  for (const dataset of manifest.datasets) {
    const parsed = Papa.parse<EnterpriseContextCsvRow>(readFileSync(path.join(rootDir, dataset.csv), 'utf8'), {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length) {
      throw new Error(`${dataset.csv}: ${parsed.errors.map((error) => error.message).join('; ')}`);
    }
    tables[dataset.key] = parsed.data;
  }
  return { rootDir, manifest, tables };
}

export function buildMeridianEnterpriseContextIngestionPlan(
  parsed: ParsedEnterpriseContextDataset,
): EnterpriseContextIngestionPlan {
  const templates = new Map(ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.map((template) => [template.key, template]));
  const qualityIssues: EnterpriseContextValidationIssue[] = [];
  const records: PlannedEnterpriseContextRecord[] = [];
  const facts: PlannedEnterpriseContextFact[] = [];
  const relationships: EnterpriseContextIngestionPlan['relationships'] = [];
  const evidence: EnterpriseContextIngestionPlan['evidence'] = [];
  const chunkQueue: EnterpriseContextIngestionPlan['chunkQueue'] = [];
  const sourceSystems = new Map<string, { sourceSystem: string; sourceKey: string; displayName: string; sourceOwner: string }>();
  const sourceFiles: EnterpriseContextIngestionPlan['sourceFiles'] = [];

  sourceSystems.set('day_one_template', {
    sourceSystem: 'day_one_template',
    sourceKey: 'day-one-template',
    displayName: `${parsed.manifest.displayName} Day One enterprise context templates`,
    sourceOwner: 'Enterprise Context Stewardship',
  });

  for (const dataset of parsed.manifest.datasets) {
    const template = templates.get(dataset.key);
    if (!template) throw new Error(`No template definition for ${dataset.key}`);
    const rows = parsed.tables[dataset.key] ?? [];
    sourceFiles.push({
      sourceFileId: `${parsed.manifest.tenantKey}:${dataset.key}`,
      sourceSystem: 'day_one_template',
      sourceFile: dataset.csv,
      workbookName: dataset.xlsx,
      rowCount: rows.length,
    });

    rows.forEach((row, index) => {
      const sourceSystem = row.source_system || 'day_one_template';
      if (!sourceSystems.has(sourceSystem)) {
        sourceSystems.set(sourceSystem, {
          sourceSystem,
          sourceKey: slugify(sourceSystem),
          displayName: sourceSystem,
          sourceOwner: row.source_owner || 'Unknown source owner',
        });
      }

      const sourceRowNumber = index + 2;
      const primaryKey = PRIMARY_KEY_BY_TEMPLATE[dataset.key];
      const sourceRecordId = row.source_record_id || row[primaryKey] || `${dataset.key}:${sourceRowNumber}`;
      const canonicalRecordId = `${parsed.manifest.tenantKey}:${dataset.key}:${row[primaryKey] || sourceRecordId}`;
      const confidence = Number(row.confidence || '0');
      const owner = ownerFor(row);
      const evidenceUsable = row.evidence_usable === 'true';
      const evidencePointer = `${dataset.csv}#Data!${sourceRowNumber}`;
      const payloadHash = hashJson(row);
      const record: PlannedEnterpriseContextRecord = {
        tenantKey: parsed.manifest.tenantKey,
        canonicalRecordId,
        recordType: dataset.key,
        title: titleFor(row, template, sourceRecordId),
        sourceSystem,
        sourceRecordId,
        sourceFile: dataset.csv,
        sourceSheet: 'Data',
        sourceRowNumber,
        owner,
        lastValidatedAt: row.last_validated_date || '2026-05-01',
        confidence,
        freshnessStatus: freshnessFor(row.last_validated_date),
        evidencePointer,
        lifecycleState: 'active',
        payloadHash,
        payload: row,
      };
      records.push(record);

      for (const column of template.columns) {
        if (COMMON_COLUMNS.has(column.key)) continue;
        const raw = row[column.key];
        if (raw === undefined || raw === '') continue;
        facts.push({
          tenantKey: parsed.manifest.tenantKey,
          canonicalRecordId,
          factKey: `${canonicalRecordId}:${column.key}`,
          factType: column.key,
          factValue: coerceValue(raw),
          factText: String(raw),
          sourceSystem,
          sourceRecordId,
          sourceFile: dataset.csv,
          sourceSheet: 'Data',
          sourceRowNumber,
          owner,
          lastValidatedAt: record.lastValidatedAt,
          confidence,
          freshnessStatus: record.freshnessStatus,
          evidencePointer,
          lifecycleState: 'active',
          valueHash: hashJson({ column: column.key, value: raw }),
        });
      }

      if (dataset.key === 'ci_relationships_dependencies') {
        relationships.push({
          tenantKey: parsed.manifest.tenantKey,
          relationshipKey: row.relationship_id,
          relationshipType: row.relationship_type,
          fromExternalId: row.from_ci_id,
          toExternalId: row.to_ci_id,
          sourceSystem,
          sourceRecordId,
          sourceFile: dataset.csv,
          sourceSheet: 'Data',
          sourceRowNumber,
          owner,
          lastValidatedAt: record.lastValidatedAt,
          confidence,
          freshnessStatus: record.freshnessStatus,
          evidencePointer,
          properties: row,
        });
      }

      evidence.push({
        tenantKey: parsed.manifest.tenantKey,
        evidenceKey: `${canonicalRecordId}:row-evidence`,
        evidenceType: 'template_row',
        canonicalRecordId,
        citationLabel: `${template.title} row ${sourceRowNumber}`,
        citationLocator: `Data!${sourceRowNumber}`,
        evidencePointer,
        sourceSystem,
        sourceRecordId,
        sourceFile: dataset.csv,
        sourceSheet: 'Data',
        sourceRowNumber,
        owner,
        evidenceUsable,
        confidence,
        freshnessStatus: record.freshnessStatus,
      });

      chunkQueue.push({
        queueKey: `${canonicalRecordId}:chunk`,
        canonicalRecordId,
        operation: 'upsert',
        sourceSystem,
        sourceRecordId,
      });

      qualityIssues.push(...qualityIssuesForRow(row, dataset.csv, sourceRowNumber, owner, confidence, evidenceUsable));
    });
  }

  qualityIssues.push(...referenceIssues(parsed));
  const stewardshipTasks = qualityIssues.map((issue) => ({
    ...issue,
    taskKey: `${issue.issueKey}:task`,
    title: `Resolve ${issue.issueType}`,
    assignedOwner: issue.message.includes('owner') ? 'Context Stewardship Office' : 'Source owner',
  }));

  return {
    tenantKey: parsed.manifest.tenantKey,
    sourceRoot: parsed.rootDir,
    sources: [...sourceSystems.values()],
    sourceFiles,
    records,
    facts,
    relationships,
    evidence,
    qualityIssues,
    stewardshipTasks,
    chunkQueue,
    summary: {
      sources: sourceSystems.size,
      sourceFiles: sourceFiles.length,
      records: records.length,
      facts: facts.length,
      relationships: relationships.length,
      evidence: evidence.length,
      qualityIssues: qualityIssues.length,
      stewardshipTasks: stewardshipTasks.length,
      chunkQueue: chunkQueue.length,
    },
  };
}

export function retargetEnterpriseContextIngestionPlan(
  plan: EnterpriseContextIngestionPlan,
  targetTenantKey: string,
): EnterpriseContextIngestionPlan {
  const tenantKey = targetTenantKey.trim();
  if (!tenantKey) throw new Error('target_tenant_key_required');
  if (tenantKey === plan.tenantKey) return plan;
  const replaceTenantPrefix = (value: string) =>
    value.startsWith(`${plan.tenantKey}:`) ? `${tenantKey}:${value.slice(plan.tenantKey.length + 1)}` : value;

  return {
    ...plan,
    tenantKey,
    sourceFiles: plan.sourceFiles.map((sourceFile) => ({
      ...sourceFile,
      sourceFileId: replaceTenantPrefix(sourceFile.sourceFileId),
    })),
    records: plan.records.map((record) => ({
      ...record,
      tenantKey,
      canonicalRecordId: replaceTenantPrefix(record.canonicalRecordId),
    })),
    facts: plan.facts.map((fact) => ({
      ...fact,
      tenantKey,
      canonicalRecordId: replaceTenantPrefix(fact.canonicalRecordId),
      factKey: replaceTenantPrefix(fact.factKey),
    })),
    relationships: plan.relationships.map((relationship) => ({
      ...relationship,
      tenantKey,
    })),
    evidence: plan.evidence.map((evidence) => ({
      ...evidence,
      tenantKey,
      evidenceKey: replaceTenantPrefix(evidence.evidenceKey),
      canonicalRecordId: replaceTenantPrefix(evidence.canonicalRecordId),
    })),
    chunkQueue: plan.chunkQueue.map((queued) => ({
      ...queued,
      queueKey: replaceTenantPrefix(queued.queueKey),
      canonicalRecordId: replaceTenantPrefix(queued.canonicalRecordId),
    })),
  };
}

function qualityIssuesForRow(
  row: EnterpriseContextCsvRow,
  sourceFile: string,
  sourceRowNumber: number,
  owner: string,
  confidence: number,
  evidenceUsable: boolean,
): EnterpriseContextValidationIssue[] {
  const issues: EnterpriseContextValidationIssue[] = [];
  const issueBase = `${sourceFile}:row:${sourceRowNumber}`;
  if (!owner || owner === 'Unknown owner') {
    issues.push({
      issueKey: `${issueBase}:missing-owner`,
      issueType: 'missing_owner',
      severity: 'high',
      sourceFile,
      sourceSheet: 'Data',
      sourceRowNumber,
      message: 'Row lacks a usable owner.',
    });
  }
  if (confidence < 0.8) {
    issues.push({
      issueKey: `${issueBase}:low-confidence`,
      issueType: 'low_confidence',
      severity: 'medium',
      sourceFile,
      sourceSheet: 'Data',
      sourceRowNumber,
      message: `Confidence ${confidence} is below the 0.80 ingestion threshold.`,
    });
  }
  if (!evidenceUsable) {
    issues.push({
      issueKey: `${issueBase}:evidence-unusable`,
      issueType: 'evidence_unusable',
      severity: 'medium',
      sourceFile,
      sourceSheet: 'Data',
      sourceRowNumber,
      message: 'Row is not yet usable as cited evidence.',
    });
  }
  return issues;
}

function referenceIssues(parsed: ParsedEnterpriseContextDataset): EnterpriseContextValidationIssue[] {
  const systems = new Set((parsed.tables.cmdb_applications_services ?? []).map((row) => row.ci_id));
  const contracts = new Set((parsed.tables.vendors_contract_inventory ?? []).map((row) => row.contract_id));
  const policies = new Set((parsed.tables.policies_procedures ?? []).map((row) => row.policy_id));
  const issues: EnterpriseContextValidationIssue[] = [];

  function add(issueKey: string, sourceFile: string, sourceRowNumber: number, message: string) {
    issues.push({ issueKey, issueType: 'unresolved_reference', severity: 'critical', sourceFile, sourceSheet: 'Data', sourceRowNumber, message });
  }

  (parsed.tables.ci_relationships_dependencies ?? []).forEach((row, index) => {
    if (!systems.has(row.from_ci_id)) add(`${row.relationship_id}:from`, '04-ci-relationships-dependencies.csv', index + 2, `Unknown from_ci_id ${row.from_ci_id}`);
    if (!systems.has(row.to_ci_id)) add(`${row.relationship_id}:to`, '04-ci-relationships-dependencies.csv', index + 2, `Unknown to_ci_id ${row.to_ci_id}`);
  });
  (parsed.tables.initiative_portfolio ?? []).forEach((row, index) => {
    for (const ciId of row.dependent_ci_ids.split('|')) {
      if (ciId && !systems.has(ciId)) add(`${row.initiative_id}:ci:${ciId}`, '13-initiative-portfolio.csv', index + 2, `Unknown dependent_ci_id ${ciId}`);
    }
    for (const contractId of row.dependent_contract_ids.split('|')) {
      if (contractId && !contracts.has(contractId)) add(`${row.initiative_id}:contract:${contractId}`, '13-initiative-portfolio.csv', index + 2, `Unknown dependent_contract_id ${contractId}`);
    }
    for (const policyId of row.policy_constraints.split('|')) {
      if (policyId && !policies.has(policyId)) add(`${row.initiative_id}:policy:${policyId}`, '13-initiative-portfolio.csv', index + 2, `Unknown policy_constraint ${policyId}`);
    }
  });
  return issues;
}

function ownerFor(row: EnterpriseContextCsvRow): string {
  return row.owner
    || row.source_owner
    || row.technical_owner
    || row.application_owner
    || row.relationship_owner
    || row.contract_owner
    || row.policy_owner
    || row.initiative_owner
    || row.data_owner
    || 'Unknown owner';
}

function titleFor(row: EnterpriseContextCsvRow, template: EnterpriseContextTemplateWorkbook, fallback: string): string {
  for (const column of TITLE_COLUMNS) {
    if (row[column]) return row[column];
  }
  return `${template.title} ${fallback}`;
}

function coerceValue(raw: string): unknown {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  const numeric = Number(raw);
  if (raw.trim() !== '' && Number.isFinite(numeric)) return numeric;
  if (raw.includes('|')) return raw.split('|').filter(Boolean);
  return raw;
}

function freshnessFor(date: string | undefined): 'fresh' | 'attention' | 'stale' | 'unknown' {
  if (!date) return 'unknown';
  const parsed = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed)) return 'unknown';
  const asOf = Date.parse('2026-05-11T00:00:00Z');
  const days = (asOf - parsed) / 86_400_000;
  if (days <= 90) return 'fresh';
  if (days <= 180) return 'attention';
  return 'stale';
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
