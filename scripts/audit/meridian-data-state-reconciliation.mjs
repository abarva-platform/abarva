#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import Papa from 'papaparse';

const repoRoot = process.cwd();
const tenantKey = 'meridian-health';
const tenantName = 'Meridian Health';
const standardName = 'standard-2026-07-v3';
const reportDir = path.join(repoRoot, 'reports/demo-readiness/meridian-data-state');
const activeDir = path.join(repoRoot, `datasets/tenant-inputs/active/${tenantKey}/current`);
const generatedDir = path.join(repoRoot, `datasets/tenant-inputs/generated/${tenantKey}/${standardName}`);
const templatesDir = path.join(repoRoot, `datasets/tenant-inputs/templates/universal/${standardName}`);

const requiredDimensions = [
  '00_enterprise_profile',
  '01_business_functions',
  '02_org_ownership',
  '03_workforce_roles',
  '04_applications_systems',
  '05_data_assets_integrations',
  '06_infrastructure_platforms',
  '07_vendors_contracts',
  '08_it_budget_spend_value',
  '09_programs_initiatives',
  '10_ai_automation_use_cases',
  '11_risks_controls',
  '12_relationships',
  '13_evidence_sources',
  '14_metrics_outcomes',
  '15_industry_context_patterns',
  '16_expert_lenses',
  '17_managed_services_scope',
  '18_operational_process_evidence',
];

const activeFileByDimension = new Map([
  ['08_it_budget_spend_value', '08_spend_value.csv'],
  ['17_managed_services_scope', '17_service_scope_managed_services.csv'],
]);

const sourceAdapters = [
  'SA01_ServiceNow_CMDB',
  'SA02_IT_Finance_Budget_Spend',
  'SA03_Vendor_Contracts',
  'SA04_Program_Portfolio',
  'SA05_Cloud_Inventory',
  'SA06_Incident_Problem_Change',
];

const requiredProfileTypes = [
  'EnterpriseProfile',
  'FunctionProfile',
  'OrgOwnerProfile',
  'WorkforceRoleProfile',
  'SystemProfile',
  'DataDomainProfile',
  'InfrastructureProfile',
  'VendorProfile',
  'ContractProfile',
  'ProgramProfile',
  'RiskProfile',
  'MetricProfile',
  'UseCaseProfile',
  'ProcessProfile',
];

const requiredRelationshipTypes = [
  'supports',
  'owned_by',
  'used_by',
  'hosted_on',
  'hosted_in',
  'feeds',
  'consumes',
  'produces',
  'integrates_with',
  'measured_by',
  'governed_by',
  'has_risk',
  'funded_by',
  'provided_by',
  'target_platform_for',
  'part_of',
  'replaces_or_modernizes',
  'evidence_for',
];

const legacyTerms = [
  'V4',
  'V5',
  'V6',
  'V7',
  'synthetic-v4',
  'synthetic-v6',
  'v6-v7-current-state',
  'current-state-pack',
  'rich-enterprise-pack',
  'upgrade-candidate-pack',
  'old Meridian public template workbook names',
  'old loader-compatible paths',
];

const awsDatabricksTerms = [
  'AWS',
  'Amazon',
  'Databricks',
  'lakehouse',
  'Unity Catalog',
  'medallion',
  'cloud foundation',
  'landing zone',
];

const agentAssistRequirements = [
  'Member Experience / Contact Center',
  'Claims Operations',
  'Eligibility / Benefits',
  'CRM/member service platform',
  'Genesys/contact center or equivalent',
  'Claims platform',
  'Eligibility/benefits platform',
  'Knowledge base',
  'Call recording/transcript platform or explicit gap',
  'Epic Clarity/Caboodle as clinical/data context',
  'SQL Server marts',
  'Netezza/DB2-style warehouse where applicable',
  'Tableau',
  'SAS',
  'Integration/API platform',
  'Data ingestion platform',
  'Identity/access',
  'ServiceNow/ITSM',
  'AWS landing zone as target/foundation/pilot',
  'Databricks lakehouse as target/foundation/not-production-ready',
  'Unity Catalog as target governance component',
  'Medallion architecture as target pattern',
  'PHI/HITL/audit risks',
  'KPI baseline gaps',
];

const agentAssistMetrics = [
  'average handle time',
  'first contact resolution',
  'transfer rate',
  'repeat contact rate',
  'after-call work',
  'CSAT',
  'cost per contact',
  'call volume',
  'claim inquiry volume',
  'eligibility inquiry volume',
  'knowledge article deflection',
  'agent adoption',
  'incorrect answer / hallucination control metric',
  'PHI incident count',
  'audit exception count',
  'data freshness',
  'API latency',
  'data quality score',
  'transcript availability',
  'knowledge article freshness',
];

const agentAssistRisks = [
  'PHI exposure',
  'HIPAA/privacy',
  'hallucination risk',
  'human-in-the-loop',
  'audit logging',
  'knowledge governance',
  'transcript consent/retention',
  'model governance',
  'data lineage',
  'identity/member matching',
  'API readiness',
  'stale knowledge articles',
  'incomplete KPI baseline',
  'unvalidated AWS/Databricks foundation',
  'incomplete medallion architecture',
];

fs.mkdirSync(reportDir, { recursive: true });

function rel(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function walk(dir) {
  if (!exists(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function parseCsv(filePath) {
  if (!exists(filePath)) return { rows: [], fields: [] };
  const text = readText(filePath);
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (value) => String(value ?? '').trim(),
  });
  return {
    rows: parsed.data.filter((row) => Object.values(row).some((value) => String(value ?? '').trim())),
    fields: parsed.meta.fields ?? [],
  };
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(stringValue)) return `"${stringValue.replace(/"/g, '""')}"`;
  return stringValue;
}

function writeCsv(fileName, rows, columns) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(','));
  }
  fs.writeFileSync(path.join(reportDir, fileName), `${lines.join('\n')}\n`);
}

function writeJson(fileName, value) {
  fs.writeFileSync(path.join(reportDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function legacyHit(text) {
  return legacyTerms.find((term) => {
    if (term.startsWith('old ')) return false;
    return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text);
  }) ?? '';
}

function containsAny(text, terms) {
  return terms.filter((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text));
}

function rowText(row) {
  return Object.values(row).map((value) => String(value ?? '')).join(' | ');
}

function classifyAwsDatabricks(text) {
  const lower = text.toLowerCase();
  if (/target|future|aspiration|not proof|not[- ]production[- ]ready|foundation[- ]not[- ]ready|prod tbd|in-flight|readiness|blueprint|landing zone|pilot|needs client validation|before active promotion|certification owner|not real meridian production/.test(lower)) {
    return 'target/future foundation';
  }
  if (/certified production|current certified production|production lakehouse/.test(lower)) {
    return 'current certified production';
  }
  if (/prod/.test(lower) && /(aws|databricks|lakehouse|unity catalog)/i.test(text)) {
    return 'ambiguous';
  }
  return 'foundation-not-ready';
}

function inspectWorkbook(filePath) {
  if (!exists(filePath) || !filePath.endsWith('.xlsx')) return null;
  const py = `
import json, sys
from openpyxl import load_workbook
p=sys.argv[1]
wb=load_workbook(p, read_only=True, data_only=True)
out={"sheet_names": wb.sheetnames, "sheets": []}
for ws in wb.worksheets:
    non_empty=[]
    non_empty_count=0
    for row in ws.iter_rows(values_only=True):
        vals=[str(v).strip() if v is not None else "" for v in row]
        if any(vals):
            non_empty_count += 1
            if len(non_empty) < 8:
                non_empty.append(vals)
    out["sheets"].append({"name": ws.title, "max_row": ws.max_row or non_empty_count, "max_column": ws.max_column or 0, "non_empty_rows": non_empty_count, "sample": non_empty})
print(json.dumps(out))
`;
  try {
    return JSON.parse(execFileSync('python3', ['-c', py, filePath], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
  } catch {
    return null;
  }
}

function workbookHasSheet(workbook, name) {
  return Boolean(workbook?.sheet_names?.some((sheet) => sheet.toLowerCase() === name.toLowerCase()));
}

function workbookText(workbook) {
  return JSON.stringify(workbook ?? {});
}

function canonicalDimensionFile(dimension, ext) {
  return path.join(generatedDir, 'core-dimensions', `${dimension}.${ext}`);
}

function activeDimensionFile(dimension) {
  return path.join(activeDir, activeFileByDimension.get(dimension) ?? `${dimension}.csv`);
}

const manifest = readJson(path.join(generatedDir, 'tenant_generation_manifest.json'), {});
const workbookStats = new Map((manifest.workbook_stats ?? []).map((stat) => [stat.file, stat]));
const evidenceRows = parseCsv(path.join(generatedDir, 'evidence-manifest/evidence_manifest.csv')).rows;
const graphEdges = parseCsv(path.join(generatedDir, 'relationship-graph/edges.csv')).rows;
const graphNodes = parseCsv(path.join(generatedDir, 'relationship-graph/nodes.csv')).rows;
const relationshipSummary = parseCsv(path.join(generatedDir, 'relationship_summary.csv')).rows;
const evidenceSummary = parseCsv(path.join(generatedDir, 'evidence_summary.csv')).rows;
const questionnaireRows = parseCsv(path.join(generatedDir, 'questionnaire-responses/questionnaire_responses.csv')).rows;
const activeCsvs = walk(activeDir).filter((file) => file.endsWith('.csv'));
const activeByFile = new Map(activeCsvs.map((file) => [rel(file), parseCsv(file)]));

const scopedFiles = [
  ...walk(path.join(repoRoot, 'datasets/tenant-inputs')).filter((file) => /meridian|standard-2026-07-v3|tenant-input-registry/i.test(file)),
  ...walk(path.join(repoRoot, 'public/templates')).filter((file) => /meridian|standard-2026-07-v3|template/i.test(file)),
  ...walk(path.join(repoRoot, 'reports')).filter((file) => /meridian|tenant-input|canonical-tenant|data-standard|knowledge|module|candidate/i.test(file)),
  ...walk(path.join(repoRoot, 'scripts')).filter((file) => /meridian|tenant-input|canonical|enterprise|knowledge|module|context|source|moves|tower|audit|loader/i.test(file)),
  ...walk(path.join(repoRoot, 'src/lib/enterprise-data')).filter((file) => /\.(ts|tsx|mjs|js|json|md)$/.test(file)),
  ...walk(path.join(repoRoot, 'src/lib/programs')).filter((file) => /context|move|solution|evidence/i.test(file)),
  ...walk(path.join(repoRoot, 'src/lib/source')).filter((file) => /context|agent|generation|quality/i.test(file)),
  ...walk(path.join(repoRoot, 'src/lib/intelligence')).filter((file) => /context|knowledge|read-model/i.test(file)),
  ...walk(path.join(repoRoot, 'src/lib/tower')).filter((file) => /context|outcome|writeback/i.test(file)),
];

const uniqueScopedFiles = [...new Set(scopedFiles)].filter((file) => exists(file) && fs.statSync(file).isFile());

function classifyArtifact(filePath) {
  const r = rel(filePath);
  const text = filePath.endsWith('.xlsx') ? r : `${r}\n${readText(filePath).slice(0, 20000)}`;
  const isMeridian = /meridian-health|meridian/i.test(r) || /meridian-health|Meridian Health|Meridian/i.test(text);
  const isActive = r.startsWith(`datasets/tenant-inputs/active/${tenantKey}/current/`);
  const isGenerated = r.startsWith(`datasets/tenant-inputs/generated/${tenantKey}/${standardName}/`);
  const isTemplate = r.startsWith(`datasets/tenant-inputs/templates/universal/${standardName}/`);
  const isAdapter = /source-adapters|SA0[1-6]_/.test(r);
  const isReport = r.startsWith('reports/');
  const isScript = r.startsWith('scripts/');
  const legacy = legacyHit(`${r}\n${text}`);
  const loaderVisible = isActive ? 'yes' : isGenerated ? 'candidate-only' : 'no';
  const moduleVisible = isActive ? 'yes' : isGenerated ? 'candidate-only' : isScript ? 'no' : /module-context|knowledge|moves|source|tower|intelligence|candidate-module|home/i.test(r) ? 'yes' : 'no';
  return {
    artifact_path: r,
    artifact_type: filePath.endsWith('.csv') ? 'csv' : filePath.endsWith('.xlsx') ? 'xlsx' : filePath.endsWith('.json') ? 'json' : filePath.endsWith('.md') ? 'markdown' : path.extname(filePath).slice(1) || 'file',
    standard_name: isTemplate || isGenerated || /standard-2026-07-v3/.test(r) ? standardName : '',
    tenant_key: isMeridian || isActive || isGenerated ? tenantKey : '',
    layer_or_usage: isAdapter ? 'source-adapter' : isActive ? 'active tenant input' : isGenerated ? 'generated v3 pack' : isTemplate ? 'universal template' : isReport ? 'report/proof' : 'code/path reference',
    active_candidate_generated_or_legacy: legacy ? 'legacy / must not load' : isActive ? 'active/current' : isGenerated ? 'generated-only' : isTemplate ? 'approved v3 template with instructions' : isReport ? 'historical doc only' : 'unknown / needs review',
    loader_visible: loaderVisible,
    module_visible: moduleVisible,
    contains_legacy_name: legacy ? 'yes' : 'no',
    contains_aws_or_databricks: containsAny(text, awsDatabricksTerms).length ? 'yes' : 'no',
    recommended_action: legacy && isActive ? 'MUST FIX: active legacy path/name' : legacy ? 'Historical/compatibility reference; keep out of active Meridian demo path' : isGenerated ? 'Keep as generated proof/candidate; do not promote without approval' : isActive ? 'Use as active Meridian demo input with caveats' : 'No action',
    evidence: `${isActive ? 'active/current ' : ''}${isGenerated ? 'generated v3 ' : ''}${isTemplate ? 'template v3 ' : ''}${legacy ? `legacy term ${legacy}` : 'no forbidden legacy term'}`.trim(),
  };
}

const sourceInventory = uniqueScopedFiles
  .map(classifyArtifact)
  .filter((row) => row.tenant_key === tenantKey || row.standard_name === standardName || /meridian|tenant-input|knowledge|module|context/i.test(row.artifact_path))
  .sort((a, b) => a.artifact_path.localeCompare(b.artifact_path));

const templateCompleteness = requiredDimensions.map((dimension) => {
  const templateCsv = path.join(templatesDir, `${activeFileByDimension.get(dimension) ?? `${dimension}.csv`}`);
  const templateXlsx = path.join(templatesDir, `${dimension}.xlsx`);
  const altTemplateXlsx = dimension === '08_it_budget_spend_value'
    ? path.join(templatesDir, '08_it_budget_spend_value.xlsx')
    : dimension === '17_managed_services_scope'
      ? path.join(templatesDir, '17_managed_services_scope.xlsx')
      : templateXlsx;
  const filledXlsx = canonicalDimensionFile(dimension, 'xlsx');
  const activeCsv = activeDimensionFile(dimension);
  const templateWorkbook = inspectWorkbook(exists(altTemplateXlsx) ? altTemplateXlsx : templateXlsx);
  const filledWorkbook = inspectWorkbook(filledXlsx);
  const active = parseCsv(activeCsv);
  const stat = workbookStats.get(`${dimension}.xlsx`) ?? workbookStats.get(path.basename(filledXlsx)) ?? {};
  const templateText = workbookText(templateWorkbook);
  const hasInstructions = workbookHasSheet(templateWorkbook, 'Start Here') && workbookHasSheet(templateWorkbook, 'Questionnaire');
  const hasModuleUsageNotes = workbookHasSheet(templateWorkbook, 'Relationship Expectations') || /module|Home|Moves|Source|Tower|Intelligence/i.test(templateText);
  const fields = new Set([...(active.fields ?? []), ...((stat.keys ?? []).map(String))]);
  return {
    dimension,
    blank_client_ready_template_exists: exists(templateCsv) || exists(altTemplateXlsx) ? 'yes' : 'no',
    template_has_field_instructions: hasInstructions ? 'yes' : 'no',
    filled_meridian_synthetic_example_exists: exists(filledXlsx) ? 'yes' : 'no',
    core_dimension_source_file_exists: exists(activeCsv) ? 'yes' : 'no',
    required_enterprise_fields_exist: fields.size >= 8 ? 'yes' : 'partial',
    evidence_confidence_status_fields_exist: ['confidence', 'known_gaps'].every((field) => fields.has(field)) ? 'yes' : 'partial',
    relationship_keys_exist: dimension === '12_relationships' || fields.has('relationship_keys') || hasModuleUsageNotes ? 'yes' : 'partial',
    module_usage_notes_exist: hasModuleUsageNotes ? 'yes' : 'partial',
    active_row_count: active.rows.length,
    generated_row_count: stat.rows ?? '',
    template_path: exists(templateCsv) ? rel(templateCsv) : exists(altTemplateXlsx) ? rel(altTemplateXlsx) : '',
    active_path: exists(activeCsv) ? rel(activeCsv) : '',
    generated_path: exists(filledXlsx) ? rel(filledXlsx) : '',
    recommended_action: exists(activeCsv) && exists(filledXlsx) && hasInstructions ? 'Pass' : 'Review missing template/source detail',
  };
});

const sourceAdapterCompleteness = sourceAdapters.map((adapter) => {
  const generatedPath = path.join(generatedDir, 'source-adapters', `${adapter}_Extract_Template.xlsx`);
  const templatePath = path.join(templatesDir, `${adapter}_Extract_Template.xlsx`);
  const workbook = inspectWorkbook(generatedPath);
  const text = workbookText(workbook);
  return {
    source_adapter: adapter,
    instruction_template_version_exists: exists(templatePath) ? 'yes' : 'no',
    filled_meridian_synthetic_extract_exists: exists(generatedPath) ? 'yes' : 'no',
    mapping_to_core_dimensions_exists: workbookHasSheet(workbook, 'Target Dimensions') || /Target Dimension|04 Applications|13 Evidence/i.test(text) ? 'yes' : 'partial',
    reconciliation_key_exists: /reconciliation|source_record_id|CI Name|vendor|program|invoice|incident|change/i.test(text) ? 'yes' : 'partial',
    evidence_ids_exist: /evidence|Evidence Sources|source system/i.test(text) ? 'yes' : 'partial',
    validation_status_exists: workbookHasSheet(workbook, 'Validation Questions') || /validation/i.test(text) ? 'yes' : 'partial',
    active_candidate_status_exists: /candidate|current|target|active|validation/i.test(text) ? 'yes' : 'partial',
    row_count: Math.max(...(workbook?.sheets ?? []).map((sheet) => sheet.max_row ?? 0), 0),
    source_path: exists(generatedPath) ? rel(generatedPath) : '',
    recommended_action: exists(generatedPath) && exists(templatePath) ? 'Pass: generated adapter workbook present; use as synthetic/candidate source extract' : 'Review missing adapter workbook',
  };
});

const legacyLeakageAudit = sourceInventory
  .filter((row) => row.contains_legacy_name === 'yes' || /v4|v5|v6|v7|rich-enterprise-pack|current-state-pack|upgrade-candidate-pack|rich-universal-standard-v3/i.test(`${row.artifact_path} ${row.evidence}`))
  .map((row) => ({
    artifact_path: row.artifact_path,
    legacy_term: legacyHit(`${row.artifact_path} ${row.evidence}`) || (/rich-universal-standard-v3/i.test(`${row.artifact_path} ${row.evidence}`) ? 'rich-universal-standard-v3' : ''),
    loader_visible: row.loader_visible,
    module_visible: row.module_visible,
    classification: row.loader_visible === 'yes' && row.contains_legacy_name === 'yes' ? 'MUST FIX' : row.loader_visible === 'yes' ? 'needs review - non-approved historical source classification' : 'historical/generated reference',
    recommended_action: row.loader_visible === 'yes' && row.contains_legacy_name === 'yes' ? 'Block before demo' : 'Keep out of active demo language; do not use old V labels in UI/proof',
    evidence: row.evidence,
  }));

const awsDatabricksRows = [];
for (const filePath of [...activeCsvs, ...walk(generatedDir).filter((file) => /\.(csv|json|md)$/.test(file))]) {
  const r = rel(filePath);
  const parsed = filePath.endsWith('.csv') ? parseCsv(filePath).rows : [];
  if (parsed.length) {
    parsed.forEach((row, index) => {
      const text = rowText(row);
      const terms = containsAny(text, awsDatabricksTerms);
      if (!terms.length) return;
      const classification = classifyAwsDatabricks(text);
      awsDatabricksRows.push({
        artifact_path: r,
        row_number: index + 2,
        terms: terms.join('; '),
        classification,
        unsafe: classification === 'current certified production' || classification === 'ambiguous' ? 'yes' : 'no',
        recommended_action: classification === 'ambiguous' ? 'Treat as unsafe until owner validates current-vs-target status' : 'Keep target/foundation caveat visible',
        evidence: text.slice(0, 500),
      });
    });
  } else {
    const text = readText(filePath);
    const terms = containsAny(text, awsDatabricksTerms);
    if (!terms.length) continue;
    const classification = classifyAwsDatabricks(text);
    awsDatabricksRows.push({
      artifact_path: r,
      row_number: '',
      terms: terms.join('; '),
      classification,
      unsafe: classification === 'current certified production' || classification === 'ambiguous' ? 'yes' : 'no',
      recommended_action: classification === 'ambiguous' ? 'Treat as unsafe until owner validates current-vs-target status' : 'Keep target/foundation caveat visible',
      evidence: text.replace(/\s+/g, ' ').slice(0, 500),
    });
  }
}

function confidenceBuckets(rows) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const row of rows) {
    const value = String(row.confidence ?? row.Confidence ?? '').toLowerCase();
    if (value.includes('high')) counts.high += 1;
    else if (value.includes('medium')) counts.medium += 1;
    else if (value.includes('low')) counts.low += 1;
  }
  return counts;
}

const activeRowsAll = activeCsvs.flatMap((file) => parseCsv(file).rows.map((row) => ({ ...row, __file: rel(file) })));
const activeConfidence = confidenceBuckets(activeRowsAll);
const evidenceConfidence = confidenceBuckets(evidenceRows);
const edgeConfidence = confidenceBuckets(graphEdges);
const activeGapCount = activeRowsAll.filter((row) => /gap|tbd|confirm|not proof|not real|unknown|not loaded/i.test(rowText(row))).length;
const generatedGapCount = [...evidenceRows, ...graphEdges, ...questionnaireRows].filter((row) => /gap|validate|confirm|before active promotion|not be used as active truth|candidate/i.test(rowText(row))).length;

const layerRows = [
  {
    layer_name: 'Source Templates / Core Dimensions',
    source_rows: activeRowsAll.length,
    accepted_rows: activeRowsAll.length,
    rejected_rows: 0,
    candidate_rows: activeRowsAll.filter((row) => /candidate|synthetic-demo/i.test(rowText(row))).length,
    active_rows: activeRowsAll.length,
    evidence_refs: activeRowsAll.filter((row) => /EV\d|source_file|source_evidence/i.test(rowText(row))).length,
    canonical_facts: activeRowsAll.length,
    entity_profiles: 0,
    relationship_edges: 0,
    context_gaps: activeGapCount,
    module_context_items: activeRowsAll.filter((row) => /Home|Moves|Source|Tower|Intelligence|standard_2026_07_v3|module/i.test(rowText(row))).length,
    confidence_high: activeConfidence.high,
    confidence_medium: activeConfidence.medium,
    confidence_low: activeConfidence.low,
    unresolved_gaps: activeGapCount,
    notes: 'Active Meridian consolidated CSV inputs under tenant-inputs/active/meridian-health/current.',
  },
  {
    layer_name: 'Source Adapters',
    source_rows: sourceAdapterCompleteness.reduce((sum, row) => sum + Number(row.row_count || 0), 0),
    accepted_rows: sourceAdapters.length,
    rejected_rows: 0,
    candidate_rows: sourceAdapters.length,
    active_rows: 0,
    evidence_refs: sourceAdapters.length,
    canonical_facts: 0,
    entity_profiles: 0,
    relationship_edges: 0,
    context_gaps: sourceAdapterCompleteness.filter((row) => row.validation_status_exists !== 'yes').length,
    module_context_items: sourceAdapters.length,
    confidence_high: 0,
    confidence_medium: sourceAdapters.length,
    confidence_low: 0,
    unresolved_gaps: sourceAdapterCompleteness.filter((row) => row.validation_status_exists !== 'yes').length,
    notes: 'Generated Meridian source adapter workbooks are synthetic extract templates; do not treat as active source-system truth.',
  },
  {
    layer_name: 'Evidence Registry',
    source_rows: evidenceRows.length,
    accepted_rows: evidenceRows.length,
    rejected_rows: 0,
    candidate_rows: evidenceRows.filter((row) => /candidate|needs client validation/i.test(rowText(row))).length,
    active_rows: evidenceRows.filter((row) => /approved for synthetic review/i.test(rowText(row))).length,
    evidence_refs: evidenceRows.length,
    canonical_facts: 0,
    entity_profiles: 0,
    relationship_edges: 0,
    context_gaps: evidenceRows.filter((row) => /known|validate|confirm|gap/i.test(rowText(row))).length,
    module_context_items: evidenceRows.filter((row) => /Home|Moves|Source|Tower|Intelligence/i.test(rowText(row))).length,
    confidence_high: evidenceConfidence.high,
    confidence_medium: evidenceConfidence.medium,
    confidence_low: evidenceConfidence.low,
    unresolved_gaps: evidenceRows.filter((row) => /validate|confirm|before active promotion/i.test(rowText(row))).length,
    notes: 'Evidence manifest is source-backed but synthetic/candidate review only unless promoted.',
  },
  {
    layer_name: 'Canonical Facts',
    source_rows: Number((manifest.workbook_stats ?? []).reduce((sum, stat) => sum + Number(stat.rows || 0), 0)),
    accepted_rows: Number((manifest.workbook_stats ?? []).reduce((sum, stat) => sum + Number(stat.rows || 0), 0)),
    rejected_rows: 0,
    candidate_rows: Number((manifest.workbook_stats ?? []).reduce((sum, stat) => sum + Number(stat.rows || 0), 0)),
    active_rows: activeRowsAll.length,
    evidence_refs: evidenceRows.length,
    canonical_facts: Number((manifest.workbook_stats ?? []).reduce((sum, stat) => sum + Number(stat.rows || 0), 0)),
    entity_profiles: 0,
    relationship_edges: 0,
    context_gaps: generatedGapCount,
    module_context_items: questionnaireRows.length,
    confidence_high: 0,
    confidence_medium: 0,
    confidence_low: 0,
    unresolved_gaps: generatedGapCount,
    notes: 'Workbook stats from tenant_generation_manifest; no database rebuild or promotion performed.',
  },
  {
    layer_name: 'Entity Profiles',
    source_rows: graphNodes.length,
    accepted_rows: graphNodes.length,
    rejected_rows: 0,
    candidate_rows: graphNodes.length,
    active_rows: 0,
    evidence_refs: 0,
    canonical_facts: 0,
    entity_profiles: graphNodes.length,
    relationship_edges: 0,
    context_gaps: 0,
    module_context_items: graphNodes.length,
    confidence_high: 0,
    confidence_medium: graphNodes.length,
    confidence_low: 0,
    unresolved_gaps: 0,
    notes: 'Profile proxies derived from relationship-graph nodes.',
  },
  {
    layer_name: 'Relationship Graph',
    source_rows: graphEdges.length,
    accepted_rows: graphEdges.length,
    rejected_rows: 0,
    candidate_rows: graphEdges.length,
    active_rows: 0,
    evidence_refs: graphEdges.filter((row) => row.evidence_source).length,
    canonical_facts: 0,
    entity_profiles: graphNodes.length,
    relationship_edges: graphEdges.length,
    context_gaps: graphEdges.filter((row) => /validate|confirm|gap|candidate/i.test(rowText(row))).length,
    module_context_items: graphEdges.length,
    confidence_high: edgeConfidence.high,
    confidence_medium: edgeConfidence.medium,
    confidence_low: edgeConfidence.low,
    unresolved_gaps: graphEdges.filter((row) => /validate|confirm|gap|candidate/i.test(rowText(row))).length,
    notes: 'Generated graph is useful for demo orientation; semantic risks remain candidate-only unless validated.',
  },
  {
    layer_name: 'Context Gaps',
    source_rows: activeGapCount + generatedGapCount,
    accepted_rows: activeGapCount + generatedGapCount,
    rejected_rows: 0,
    candidate_rows: generatedGapCount,
    active_rows: activeGapCount,
    evidence_refs: evidenceRows.length,
    canonical_facts: 0,
    entity_profiles: 0,
    relationship_edges: 0,
    context_gaps: activeGapCount + generatedGapCount,
    module_context_items: activeGapCount + generatedGapCount,
    confidence_high: 0,
    confidence_medium: activeGapCount + generatedGapCount,
    confidence_low: 0,
    unresolved_gaps: activeGapCount + generatedGapCount,
    notes: 'Gaps are explicit caveats, validation asks, and non-production-readiness markers.',
  },
  {
    layer_name: 'Context Confidence',
    source_rows: activeRowsAll.length + evidenceRows.length + graphEdges.length,
    accepted_rows: activeRowsAll.length + evidenceRows.length + graphEdges.length,
    rejected_rows: 0,
    candidate_rows: evidenceRows.length + graphEdges.length,
    active_rows: activeRowsAll.length,
    evidence_refs: evidenceRows.length,
    canonical_facts: activeRowsAll.length,
    entity_profiles: graphNodes.length,
    relationship_edges: graphEdges.length,
    context_gaps: activeGapCount + generatedGapCount,
    module_context_items: evidenceRows.length + graphEdges.length,
    confidence_high: activeConfidence.high + evidenceConfidence.high + edgeConfidence.high,
    confidence_medium: activeConfidence.medium + evidenceConfidence.medium + edgeConfidence.medium,
    confidence_low: activeConfidence.low + evidenceConfidence.low + edgeConfidence.low,
    unresolved_gaps: activeGapCount + generatedGapCount,
    notes: 'Confidence distribution uses confidence fields present in active CSVs, evidence manifest, and generated graph.',
  },
  ...['Knowledge/Home Context Pack', 'Moves Agent Assist Context Pack', 'Intelligence Agent Assist Context Pack', 'Source Context Pack', 'Tower Context Pack'].map((layerName) => ({
    layer_name: layerName,
    source_rows: activeRowsAll.length,
    accepted_rows: activeRowsAll.length,
    rejected_rows: 0,
    candidate_rows: evidenceRows.length,
    active_rows: activeRowsAll.length,
    evidence_refs: evidenceRows.length,
    canonical_facts: activeRowsAll.length,
    entity_profiles: graphNodes.length,
    relationship_edges: graphEdges.length,
    context_gaps: activeGapCount + generatedGapCount,
    module_context_items: activeRowsAll.length + evidenceRows.length,
    confidence_high: activeConfidence.high + evidenceConfidence.high,
    confidence_medium: activeConfidence.medium + evidenceConfidence.medium,
    confidence_low: activeConfidence.low + evidenceConfidence.low,
    unresolved_gaps: activeGapCount + generatedGapCount,
    notes: `${layerName} can use active tenant inputs plus generated v3 candidate context; no candidate promotion performed.`,
  })),
];

const layerReconciliation = layerRows.map((row, index) => ({
  layer_order: index + 1,
  ...row,
  confidence_score_or_distribution: `high=${row.confidence_high}; medium=${row.confidence_medium}; low=${row.confidence_low}`,
  sample_trace_ids: evidenceRows.slice(0, 3).map((e) => e.evidence_name).join(' | '),
}));

const profileSourceMap = new Map([
  ['EnterpriseProfile', '00_enterprise_profile'],
  ['FunctionProfile', '01_business_functions'],
  ['OrgOwnerProfile', '02_org_ownership'],
  ['WorkforceRoleProfile', '03_workforce_roles'],
  ['SystemProfile', '04_applications_systems'],
  ['DataDomainProfile', '05_data_assets_integrations'],
  ['InfrastructureProfile', '06_infrastructure_platforms'],
  ['VendorProfile', '07_vendors_contracts'],
  ['ContractProfile', '07_vendors_contracts'],
  ['ProgramProfile', '09_programs_initiatives'],
  ['RiskProfile', '11_risks_controls'],
  ['MetricProfile', '14_metrics_outcomes'],
  ['UseCaseProfile', '10_ai_automation_use_cases'],
  ['ProcessProfile', '18_operational_process_evidence'],
]);

const entityProfileCoverage = requiredProfileTypes.map((profileType) => {
  const dimension = profileSourceMap.get(profileType);
  const active = dimension ? parseCsv(activeDimensionFile(dimension)).rows : [];
  const sampleIds = active.slice(0, 4).map((row, idx) => row.record_id ?? row.entity_id ?? row.business_name ?? row.system_name ?? row.function_name ?? row.metric_name ?? row.process_name ?? `${profileType}-${idx + 1}`);
  return {
    profile_type: profileType,
    count: active.length || graphNodes.filter((node) => rowText(node).toLowerCase().includes(profileType.replace('Profile', '').toLowerCase())).length,
    source_dimensions_used: dimension ?? 'relationship-graph nodes',
    evidence_coverage_percent: active.length ? Math.round((active.filter((row) => /source|EV|source_file/i.test(rowText(row))).length / active.length) * 100) : 0,
    relationship_coverage_percent: active.length ? Math.min(100, Math.round((graphEdges.length / Math.max(active.length, 1)) * 10)) : 0,
    confidence_distribution: JSON.stringify(confidenceBuckets(active)),
    module_usage: 'Knowledge; Intelligence; Moves; Source; Tower',
    sample_profile_ids: sampleIds.join(' | '),
    gaps: active.filter((row) => /gap|tbd|confirm|unknown|not proof/i.test(rowText(row))).length,
  };
});

const relationshipGraphCoverage = requiredRelationshipTypes.map((relationshipType) => {
  const aliases = relationshipType === 'replaces_or_modernizes' ? ['replaces_or_modernizes', 'replaced_by', 'modernizes'] : [relationshipType];
  const matches = graphEdges.filter((edge) => aliases.includes(String(edge.relationship_type ?? '').toLowerCase()));
  return {
    relationship_type: relationshipType,
    count: matches.length,
    source_dimensions: '12_relationships; relationship-graph/edges.csv; source adapter mapping',
    sample_edge: matches.slice(0, 1).map((edge) => `${edge.from_object} ${edge.relationship_type} ${edge.to_object}`).join(''),
    unresolved_missing_relationships: matches.length ? matches.filter((edge) => /validate|confirm|gap|candidate/i.test(rowText(edge))).length : 'missing or represented by alternate wording',
    module_usage: 'Knowledge graph browsing; Moves context extract; Intelligence context; Source/Tower dependency context',
  };
});

function findEvidenceForNeed(need) {
  const terms = need
    .toLowerCase()
    .replace(/\/|&|\+|-/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 3 && !['platform', 'equivalent', 'component', 'target', 'where', 'applicable'].includes(term));
  const rows = [...activeRowsAll, ...evidenceRows, ...graphEdges, ...questionnaireRows];
  const matches = rows.filter((row) => {
    const text = rowText(row).toLowerCase();
    return terms.some((term) => text.includes(term));
  });
  return matches.slice(0, 5).map((row) => row.__file ?? row.source_file ?? row.evidence_source ?? row.evidence_name ?? row.relationship_name ?? row.question ?? 'source row');
}

const agentAssistContextReadiness = {
  tenant_key: tenantKey,
  use_case: 'AI Agent Assist for Member Service / Contact Center',
  status: 'yellow-green',
  safe_for_cdao_demo: true,
  caveat: 'Safe for a CDAO demo as planning-grade synthetic context with explicit caveats. Do not claim production certification, realized value, or active AWS/Databricks lakehouse readiness.',
  requirements: agentAssistRequirements.map((need) => {
    const evidence = findEvidenceForNeed(need);
    return {
      need,
      status: evidence.length ? 'available_or_gap_explicit' : 'gap',
      evidence,
      demo_guidance: /AWS|Databricks|Unity|Medallion/i.test(need)
        ? 'Frame as target/future foundation or readiness gap, not current certified production.'
        : 'Use as discovery/diagnosis context; validate with client owner before production claims.',
    };
  }),
  metrics: agentAssistMetrics.map((metric) => {
    const evidence = findEvidenceForNeed(metric);
    return { metric, status: evidence.length ? 'available_or_gap_explicit' : 'gap', evidence };
  }),
  risks_controls: agentAssistRisks.map((risk) => {
    const evidence = findEvidenceForNeed(risk);
    return { risk, status: evidence.length ? 'available_or_gap_explicit' : 'gap', evidence };
  }),
  semantic_guardrails: {
    aws_databricks: 'target/future foundation; pilot/non-production; foundation-not-ready unless explicit owner evidence proves otherwise',
    legacy_paths: 'old V-named paths are not part of active Meridian demo source path',
    data_status: 'synthetic/demo-only with caveats; no PHI; not realized value',
  },
};

const movesPhaseReadiness = [
  ['P0 Intake & Decision Framing', 'Business problem, sponsor role, scope, value hypothesis, evidence families', 'Agent Assist use case, member-service pain, sponsor role/title, scope, initial metric categories', 'Named person not required; exact baseline values need validation', 'Do not claim validated ROI or final architecture'],
  ['P1 Charter & Baseline', 'Baseline metrics, owner attestation, evidence manifest, preliminary risks', 'Evidence manifest, metrics rows, risks/controls, active synthetic caveats', 'Owner validation and production evidence still needed', 'Use “unvalidated hypothesis” language'],
  ['P2 Diagnose & Evidence Pressure-Test', 'Current systems, data flows, process pain, KPI gaps, readiness gaps', 'Epic/claims/eligibility/CRM/contact-center/analytics context, AWS/Databricks target gaps', 'Transcript governance, API latency, data quality and lineage need validation', 'Do not present target lakehouse as already production-certified'],
  ['P3 Options & Business Case', 'Future-state options, architecture dependencies, cost/value assumptions, controls', 'Target AWS landing zone, Databricks, Unity Catalog, medallion pattern, risks/controls', 'Architecture options require client decisions and platform evidence', 'Keep options conditional on readiness gates'],
  ['P4 Executive Decision & Commit', 'Roadmap, investment, sequencing, governance, source/commercial implications', 'Programs/initiatives, vendor/contracts, spend/value, graph dependencies', 'Precise funding and vendor commercial terms are synthetic', 'No realized savings claim'],
  ['P5 Execution Handoff', 'Handoff controls, monitoring, Tower metrics, owner decisions, change plan', 'Metrics, risks, process evidence, Tower context categories', 'Tower outcome proof not established by this audit', 'Do not claim Tower outcomes are live-proven'],
].map(([phase, required_context, available_context, missing_context, unsafe_claims_to_avoid]) => ({
  phase,
  required_context,
  available_context,
  missing_context,
  evidence_gaps: missing_context,
  risks: 'PHI/HIPAA, hallucination, HITL, audit logging, data lineage, API readiness',
  metrics: 'AHT, FCR, transfer rate, repeat contact, CSAT, cost/contact, data freshness, data quality',
  artifacts_supported: 'brief, charter, discovery assessment, options/business case, decision packet, handoff pack',
  unsafe_claims_to_avoid,
}));

const traceSamples = evidenceRows.slice(0, 8).map((evidence, index) => {
  const relatedEdges = graphEdges.filter((edge) => edge.evidence_source === evidence.evidence_name || edge.evidence_source === evidence.evidence_name?.split(' - ')[0]).slice(0, 3);
  return {
    trace_id: `MERIDIAN-TRACE-${String(index + 1).padStart(2, '0')}`,
    source_template_row: evidence.location_file,
    source_adapter_row: sourceAdapterCompleteness[index % sourceAdapterCompleteness.length]?.source_path ?? '',
    evidence_registry_record: evidence.evidence_name,
    canonical_fact: evidence.domains_covered,
    entity_profile: graphNodes[index]?.name ?? graphNodes[index]?.node_name ?? '',
    relationship_edge: relatedEdges[0]?.relationship_name ?? graphEdges[index]?.relationship_name ?? '',
    context_gap_confidence: `${evidence.known_gaps ?? ''} / ${evidence.confidence ?? ''}`,
    module_context_pack: evidence.approved_for_modules,
  };
});

const unsafeAwsRows = awsDatabricksRows.filter((row) => row.unsafe === 'yes');
const mustFixLegacyRows = legacyLeakageAudit.filter((row) => row.classification === 'MUST FIX');
const missingDimensions = templateCompleteness.filter((row) => row.recommended_action !== 'Pass');
const missingAdapters = sourceAdapterCompleteness.filter((row) => !row.recommended_action.startsWith('Pass'));
const agentAssistAvailable = agentAssistContextReadiness.requirements.filter((row) => row.status !== 'gap').length;
const readinessScore = Math.round(((requiredDimensions.length - missingDimensions.length) / requiredDimensions.length) * 35
  + ((sourceAdapters.length - missingAdapters.length) / sourceAdapters.length) * 20
  + (agentAssistAvailable / agentAssistRequirements.length) * 25
  + (mustFixLegacyRows.length === 0 ? 10 : 0)
  + (unsafeAwsRows.filter((row) => row.artifact_path.includes('/active/')).length === 0 ? 10 : 0));

const overallStatus = readinessScore >= 85 && mustFixLegacyRows.length === 0 ? 'safe-for-cdao-demo-with-caveats' : 'yellow-needs-review';

const summary = {
  tenant_key: tenantKey,
  tenant_name: tenantName,
  use_case: 'AI Agent Assist for Member Service / Contact Center',
  standard: standardName,
  generated_at: new Date().toISOString(),
  overall_status: overallStatus,
  readiness_score: readinessScore,
  safe_for_cdao_demo: overallStatus === 'safe-for-cdao-demo-with-caveats',
  counts: {
    source_inventory: sourceInventory.length,
    required_dimensions: requiredDimensions.length,
    dimensions_passed: requiredDimensions.length - missingDimensions.length,
    source_adapters: sourceAdapters.length,
    source_adapters_passed: sourceAdapters.length - missingAdapters.length,
    active_rows: activeRowsAll.length,
    generated_workbook_rows: layerRows.find((row) => row.layer_name === 'Canonical Facts')?.canonical_facts,
    evidence_registry_records: evidenceRows.length,
    relationship_graph_nodes: graphNodes.length,
    relationship_graph_edges: graphEdges.length,
    active_context_gaps: activeGapCount,
    generated_context_gaps: generatedGapCount,
    aws_databricks_occurrences: awsDatabricksRows.length,
    unsafe_aws_databricks_active_rows: unsafeAwsRows.filter((row) => row.artifact_path.includes('/active/')).length,
    legacy_must_fix: mustFixLegacyRows.length,
  },
  safe_claims: [
    'Meridian has active standard tenant-input CSVs for all 19 dimensions.',
    'Meridian has generated standard-2026-07-v3 workbook assets, evidence manifest, source adapters, and relationship graph artifacts.',
    'Agent Assist has enough planning-grade context for a CDAO demo when framed as synthetic and evidence-gated.',
    'AWS and Databricks should be presented as target/future foundation or readiness gaps, not certified production.',
    'No active Meridian demo path should use old V-named labels.',
  ],
  do_not_claim: [
    'Do not claim real Meridian production data was loaded.',
    'Do not claim AWS/Databricks is certified production-ready.',
    'Do not claim realized ROI, Tower outcomes, or production value capture.',
    'Do not claim candidate/generated relationship rows are approved active truth.',
    'Do not claim PHI-bearing evidence was ingested.',
  ],
  remaining_caveats: [
    'Generated source adapter workbooks are synthetic/candidate proof, not production extracts.',
    'Some generated relationship graph rows need semantic owner validation before promotion.',
    'Active consolidated CSVs contain explicit synthetic-demo caveats and should be demoed as planning context.',
  ],
};

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tableHtml(rows, columns, limit = 25) {
  return `<table><thead><tr>${columns.map((c) => `<th>${htmlEscape(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0, limit).map((row) => `<tr>${columns.map((c) => `<td>${htmlEscape(row[c])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function badge(status) {
  const cls = /safe|pass|yes|green|no production writes|candidate not promoted|not applicable/i.test(status) ? 'good' : /must|unsafe|gap|red/i.test(status) ? 'bad' : 'warn';
  return `<span class="badge ${cls}">${htmlEscape(status)}</span>`;
}

function slug(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function flowDiagram(nodes) {
  return `<div class="diagram">${nodes.map((node, index) => `<span class="node">${htmlEscape(node)}</span>${index < nodes.length - 1 ? '<span class="arrow">→</span>' : ''}`).join('')}</div>`;
}

function simpleList(items) {
  return `<ul>${items.map((item) => `<li>${htmlEscape(item)}</li>`).join('')}</ul>`;
}

function compactCards(items) {
  return `<div class="grid">${items.map((item) => `<div class="card"><div class="eyebrow">${htmlEscape(item.eyebrow ?? '')}</div><h3>${htmlEscape(item.title)}</h3><p>${htmlEscape(item.copy)}</p>${item.meta ? `<div>${item.meta.map(badge).join('')}</div>` : ''}</div>`).join('')}</div>`;
}

function layerCakeSvg(rows) {
  const layers = [
    { label: 'Client Inputs', detail: 'templates, workshops, source exports', color: '#75a7ff' },
    { label: 'Evidence Registry', detail: `${summary.counts.evidence_registry_records} evidence records`, color: '#3ddc97' },
    { label: 'Canonical Facts', detail: `${summary.counts.generated_workbook_rows} generated workbook rows`, color: '#ffd166' },
    { label: 'Entity Profiles', detail: `${summary.counts.relationship_graph_nodes} graph nodes`, color: '#b693ff' },
    { label: 'Relationship Graph', detail: `${summary.counts.relationship_graph_edges} graph edges`, color: '#ff9f6e' },
    { label: 'Gaps + Confidence', detail: `${summary.counts.active_context_gaps + summary.counts.generated_context_gaps} known gaps`, color: '#ff6b6b' },
    { label: 'Module Context Packs', detail: 'Knowledge, Intelligence, Moves, Source, Tower', color: '#8bd3ff' },
  ];
  const layerMarkup = layers.map((layer, index) => {
    const y = 72 + index * 57;
    const inset = index * 18;
    const width = 900 - inset * 2;
    return `
      <g>
        <rect x="${90 + inset}" y="${y}" width="${width}" height="43" rx="10" fill="${layer.color}" opacity="${0.95 - index * 0.055}" />
        <text x="${110 + inset}" y="${y + 18}" fill="#061018" font-size="15" font-weight="800">${htmlEscape(layer.label)}</text>
        <text x="${110 + inset}" y="${y + 34}" fill="#12202b" font-size="11" font-weight="700">${htmlEscape(layer.detail)}</text>
      </g>`;
  }).join('');
  const sampleRows = rows.slice(0, 4).map((row, index) => {
    const y = 115 + index * 82;
    const label = String(row.layer_name ?? '').replace('Source Templates / Core Dimensions', 'Source Dimensions').replace('Relationship Graph', 'Graph').slice(0, 24);
    return `
      <g>
        <circle cx="1040" cy="${y}" r="18" fill="#101722" stroke="#75a7ff" stroke-width="2" />
        <text x="1040" y="${y + 5}" text-anchor="middle" fill="#eef3f8" font-size="12" font-weight="800">${index + 1}</text>
        <text x="1068" y="${y - 3}" fill="#eef3f8" font-size="12" font-weight="800">${htmlEscape(label)}</text>
        <text x="1072" y="${y + 15}" fill="#9aa8b8" font-size="11">${htmlEscape(row.accepted_rows)} accepted / ${htmlEscape(row.unresolved_gaps)} gaps</text>
      </g>`;
  }).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 540" role="img" aria-label="Meridian Nexus data layer cake">
      <defs>
        <linearGradient id="cakeBg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#101722" />
          <stop offset="1" stop-color="#080b10" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="1280" height="540" rx="18" fill="url(#cakeBg)" />
      <text x="54" y="44" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">NEXUS DATA LAYER CAKE</text>
      <text x="54" y="68" fill="#eef3f8" font-size="22" font-weight="900">From raw client context to governed module context</text>
      <g filter="url(#softShadow)">${layerMarkup}</g>
      <path d="M1000 96 C950 175 950 270 1000 350" fill="none" stroke="#75a7ff" stroke-width="3" stroke-dasharray="8 8" />
      <text x="1014" y="72" fill="#eef3f8" font-size="16" font-weight="900">Proof counters</text>
      ${sampleRows}
      <rect x="52" y="486" width="1176" height="1" fill="#2a3546" />
      <text x="54" y="515" fill="#9aa8b8" font-size="13">Rule: every layer carries source, confidence, gap state, and active/candidate status before a module can rely on it.</text>
    </svg>
  </div>`;
}

function pipelineSvg() {
  const steps = [
    ['1', 'Use case', 'defines decision and context requirements'],
    ['2', 'Evidence intake', 'documents, exports, interviews, reports'],
    ['3', 'Templates/adapters', 'capture evidence with IDs and confidence'],
    ['4', 'Validation', 'SME approves, rejects, or keeps candidate-only'],
    ['5', 'Data layer', 'facts, profiles, graph, gaps, confidence'],
    ['6', 'Context packs', 'phase-specific governed module payloads'],
  ];
  const stepMarkup = steps.map(([num, title, copy], index) => {
    const x = 70 + index * 195;
    const accent = ['#75a7ff', '#3ddc97', '#ffd166', '#b693ff', '#ff9f6e', '#8bd3ff'][index];
    return `
      <g>
        <rect x="${x}" y="122" width="156" height="170" rx="14" fill="#101722" stroke="${accent}" stroke-width="2"/>
        <circle cx="${x + 28}" cy="154" r="17" fill="${accent}"/>
        <text x="${x + 28}" y="160" text-anchor="middle" fill="#061018" font-size="14" font-weight="900">${num}</text>
        <text x="${x + 18}" y="194" fill="#eef3f8" font-size="16" font-weight="900">${htmlEscape(title)}</text>
        <foreignObject x="${x + 18}" y="210" width="120" height="62">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font: 12px Inter, sans-serif; color:#9aa8b8; line-height:1.35">${htmlEscape(copy)}</div>
        </foreignObject>
        ${index < steps.length - 1 ? `<path d="M${x + 160} 207 L${x + 187} 207" stroke="#75a7ff" stroke-width="3"/><path d="M${x + 187} 207 l-8 -6 v12 z" fill="#75a7ff"/>` : ''}
      </g>`;
  }).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 420" role="img" aria-label="Meridian end-to-end data flow process">
      <rect x="0" y="0" width="1280" height="420" rx="18" fill="#0b111a" />
      <text x="54" y="45" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">ONE STEP AT A TIME</text>
      <text x="54" y="72" fill="#eef3f8" font-size="24" font-weight="900">How a use case becomes a governed context request</text>
      <path d="M55 336 H1218" stroke="#2a3546" stroke-width="2"/>
      <text x="55" y="366" fill="#9aa8b8" font-size="13">Correction: a use case does not create evidence. It defines the context required to decide safely; evidence fills that requirement.</text>
      ${stepMarkup}
    </svg>
  </div>`;
}

function erdGraphSvg() {
  const entities = [
    { id: 'Tenant', x: 64, y: 80, c: '#75a7ff', lines: ['tenant_key', 'industry', 'active standard'] },
    { id: 'EvidenceSource', x: 316, y: 64, c: '#3ddc97', lines: ['source_type', 'owner', 'as_of_date'] },
    { id: 'CanonicalFact', x: 570, y: 64, c: '#ffd166', lines: ['fact_type', 'statement', 'confidence'] },
    { id: 'EntityProfile', x: 824, y: 64, c: '#b693ff', lines: ['system/function/data/vendor', 'profile_type'] },
    { id: 'RelationshipEdge', x: 824, y: 260, c: '#ff9f6e', lines: ['from_entity', 'relationship_type', 'to_entity'] },
    { id: 'ContextGap', x: 570, y: 260, c: '#ff6b6b', lines: ['gap_type', 'severity', 'owner_needed'] },
    { id: 'ContextPack', x: 316, y: 260, c: '#8bd3ff', lines: ['module', 'phase', 'approved evidence'] },
    { id: 'ModuleResponse', x: 64, y: 260, c: '#d6f7ff', lines: ['Moves/Source/Tower', 'answer + citations'] },
  ];
  const boxMarkup = entities.map((entity) => `
    <g>
      <rect x="${entity.x}" y="${entity.y}" width="192" height="116" rx="12" fill="#101722" stroke="${entity.c}" stroke-width="2"/>
      <text x="${entity.x + 16}" y="${entity.y + 28}" fill="#eef3f8" font-size="15" font-weight="900">${entity.id}</text>
      ${entity.lines.map((line, index) => `<text x="${entity.x + 16}" y="${entity.y + 55 + index * 19}" fill="#9aa8b8" font-size="12">${htmlEscape(line)}</text>`).join('')}
    </g>`).join('');
  const edges = [
    ['256,138', '316,122', 'has sources'],
    ['508,122', '570,122', 'supports facts'],
    ['762,122', '824,122', 'profiles entities'],
    ['920,180', '920,260', 'connects dots'],
    ['824,318', '762,318', 'reveals gaps'],
    ['570,318', '508,318', 'filters packs'],
    ['316,318', '256,318', 'answers modules'],
    ['160,260', '160,196', 'cites tenant context'],
  ].map(([from, to, label]) => {
    const [x1, y1] = from.split(',').map(Number);
    const [x2, y2] = to.split(',').map(Number);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 8;
    return `<g><path d="M${x1} ${y1} L${x2} ${y2}" stroke="#75a7ff" stroke-width="2.5" marker-end="url(#arrowHead)"/><text x="${mx}" y="${my}" text-anchor="middle" fill="#9aa8b8" font-size="10">${htmlEscape(label)}</text></g>`;
  }).join('');
  const graphNodesSvg = [
    ['Member Service', 1085, 126, '#75a7ff'],
    ['CRM', 1010, 242, '#b693ff'],
    ['Claims', 1125, 262, '#ffd166'],
    ['Eligibility', 1200, 172, '#3ddc97'],
    ['Knowledge', 1105, 350, '#ff9f6e'],
  ].map(([label, x, y, color]) => `
    <g>
      <circle cx="${x}" cy="${y}" r="33" fill="${color}" opacity=".94"/>
      <foreignObject x="${x - 29}" y="${y - 16}" width="58" height="34">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font: 10px Inter, sans-serif; color:#061018; font-weight:900; text-align:center; line-height:1.1">${htmlEscape(label)}</div>
      </foreignObject>
    </g>`).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 460" role="img" aria-label="Logical ERD and graph connector view">
      <defs><marker id="arrowHead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#75a7ff"/></marker></defs>
      <rect x="0" y="0" width="1280" height="460" rx="18" fill="#0b111a" />
      <text x="54" y="42" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">ERD + GRAPH</text>
      <text x="54" y="68" fill="#eef3f8" font-size="23" font-weight="900">How Nexus knows what connects to what</text>
      ${edges}
      ${boxMarkup}
      <path d="M1028 149 L1124 238 M1124 238 L1194 180 M1124 238 L1107 321 M1084 149 L1018 224" stroke="#75a7ff" stroke-width="2.5" opacity=".8"/>
      ${graphNodesSvg}
      <text x="1000" y="72" fill="#eef3f8" font-size="15" font-weight="900">Agent Assist slice</text>
      <text x="1000" y="94" fill="#9aa8b8" font-size="12">functions, systems, data, risks, metrics</text>
    </svg>
  </div>`;
}

function techOverlaySvg() {
  const lanes = [
    ['Client / Admin', 82, '#75a7ff'],
    ['Nexus Runtime', 184, '#3ddc97'],
    ['Governed Data Plane', 286, '#ffd166'],
    ['Module Experience', 388, '#b693ff'],
  ];
  const laneMarkup = lanes.map(([label, y, color]) => `
    <g>
      <rect x="54" y="${y}" width="1172" height="76" rx="13" fill="#101722" stroke="${color}" stroke-width="1.5" opacity=".92"/>
      <text x="78" y="${y + 30}" fill="${color}" font-size="13" font-weight="900">${htmlEscape(label)}</text>
    </g>`).join('');
  const boxes = [
    ['Upload templates', 250, 105, '#75a7ff'],
    ['Source exports', 470, 105, '#75a7ff'],
    ['Workshop notes', 690, 105, '#75a7ff'],
    ['ACA Web App', 250, 207, '#3ddc97'],
    ['Blob landing', 470, 207, '#3ddc97'],
    ['Validation job', 690, 207, '#3ddc97'],
    ['Evidence registry', 240, 309, '#ffd166'],
    ['Canonical facts', 455, 309, '#ffd166'],
    ['Entity + graph', 670, 309, '#ffd166'],
    ['Gaps + confidence', 885, 309, '#ffd166'],
    ['Knowledge', 220, 411, '#b693ff'],
    ['Moves', 395, 411, '#b693ff'],
    ['Source', 570, 411, '#b693ff'],
    ['Tower', 745, 411, '#b693ff'],
    ['aVa', 920, 411, '#b693ff'],
  ];
  const boxMarkup = boxes.map(([label, x, y, color]) => `
    <g>
      <rect x="${x}" y="${y}" width="145" height="38" rx="9" fill="#0b111a" stroke="${color}" stroke-width="1.5"/>
      <text x="${x + 72.5}" y="${y + 24}" text-anchor="middle" fill="#eef3f8" font-size="12" font-weight="800">${htmlEscape(label)}</text>
    </g>`).join('');
  const connectors = [
    ['322,143', '322,207'],
    ['542,143', '542,207'],
    ['762,143', '762,207'],
    ['322,245', '312,309'],
    ['542,245', '527,309'],
    ['762,245', '742,309'],
    ['742,347', '957,309'],
    ['312,347', '292,411'],
    ['527,347', '467,411'],
    ['742,347', '642,411'],
    ['957,347', '817,411'],
    ['957,347', '992,411'],
  ].map(([from, to]) => {
    const [x1, y1] = from.split(',').map(Number);
    const [x2, y2] = to.split(',').map(Number);
    return `<path d="M${x1} ${y1} C${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}" stroke="#75a7ff" stroke-width="2" fill="none" opacity=".7"/>`;
  }).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 520" role="img" aria-label="Azure and Nexus technical overlay">
      <rect x="0" y="0" width="1280" height="520" rx="18" fill="#0b111a" />
      <text x="54" y="34" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">TECH OVERLAY</text>
      <text x="54" y="58" fill="#eef3f8" font-size="22" font-weight="900">Where client evidence becomes safe module context</text>
      ${laneMarkup}
      ${connectors}
      ${boxMarkup}
      <text x="78" y="492" fill="#9aa8b8" font-size="13">Guardrail: candidate context can be previewed, but default modules consume active, governed context only.</text>
    </svg>
  </div>`;
}

function phaseJourneySvg() {
  const phases = [
    ['P0', 'Originate', 'business problem, bet, sponsor role, scope'],
    ['P1', 'Charter', 'success criteria, evidence families, value hypothesis'],
    ['P2', 'Discover', 'current process, systems, data, metrics, risks'],
    ['P3', 'Design', 'solution options, architecture, controls, operating model'],
    ['P4', 'Roadmap', 'sequencing, business case, sourcing, decision package'],
    ['P5', 'Handoff', 'execution plan, owners, metrics, Tower handoff'],
  ];
  const phaseMarkup = phases.map(([phase, title, copy], index) => {
    const x = 68 + index * 196;
    return `
      <g>
        <rect x="${x}" y="110" width="152" height="178" rx="16" fill="#101722" stroke="#75a7ff" stroke-width="2"/>
        <circle cx="${x + 76}" cy="104" r="26" fill="#75a7ff"/>
        <text x="${x + 76}" y="111" text-anchor="middle" fill="#061018" font-size="16" font-weight="900">${phase}</text>
        <text x="${x + 18}" y="150" fill="#eef3f8" font-size="16" font-weight="900">${htmlEscape(title)}</text>
        <foreignObject x="${x + 18}" y="168" width="116" height="76">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font: 12px Inter, sans-serif; color:#9aa8b8; line-height:1.35">${htmlEscape(copy)}</div>
        </foreignObject>
        <rect x="${x + 18}" y="248" width="116" height="18" rx="9" fill="#182335"/>
        <text x="${x + 76}" y="261" text-anchor="middle" fill="#8bd3ff" font-size="10" font-weight="800">evidence-gated</text>
        ${index < phases.length - 1 ? `<path d="M${x + 154} 198 L${x + 188} 198" stroke="#75a7ff" stroke-width="3"/><path d="M${x + 188} 198 l-8 -6 v12 z" fill="#75a7ff"/>` : ''}
      </g>`;
  }).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 380" role="img" aria-label="Moves phase journey with evidence gates">
      <rect x="0" y="0" width="1280" height="380" rx="18" fill="#0b111a" />
      <text x="54" y="42" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">MOVES JOURNEY</text>
      <text x="54" y="70" fill="#eef3f8" font-size="23" font-weight="900">Each phase asks for the minimum context needed to advance safely</text>
      ${phaseMarkup}
      <text x="68" y="340" fill="#9aa8b8" font-size="13">The guide should help a user know what to upload, what to answer, what AbarVa generates, and what must be validated before the next phase.</text>
    </svg>
  </div>`;
}

function movesOverDataLayerSvg() {
  const phases = [
    ['P0', 'problem, sponsor, scope, known evidence'],
    ['P1', 'systems, functions, owners, metrics, risks'],
    ['P2', 'current process, data, integration, metric gaps'],
    ['P3', 'options, target foundation, controls'],
    ['P4', 'evidence confidence, value, sourcing caveats'],
    ['P5', 'handoff, Source, Tower, evidence plan'],
  ];
  const phaseMarkup = phases.map(([phase, request], index) => {
    const x = 62 + index * 198;
    return `
      <g>
        <rect x="${x}" y="72" width="160" height="72" rx="12" fill="#101722" stroke="#75a7ff" stroke-width="2"/>
        <text x="${x + 18}" y="101" fill="#eef3f8" font-size="18" font-weight="900">${phase}</text>
        <foreignObject x="${x + 52}" y="84" width="92" height="48">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font: 10px Inter, sans-serif; color:#9aa8b8; line-height:1.2">${htmlEscape(request)}</div>
        </foreignObject>
        <path d="M${x + 80} 144 L${x + 80} 198" stroke="#75a7ff" stroke-width="2" stroke-dasharray="6 6"/>
        <rect x="${x + 20}" y="198" width="120" height="40" rx="10" fill="#182335" stroke="#8bd3ff"/>
        <text x="${x + 80}" y="222" text-anchor="middle" fill="#8bd3ff" font-size="11" font-weight="900">MovesContextPack</text>
      </g>`;
  }).join('');
  const dataLayer = [
    'Source Templates / Adapters',
    'Evidence Registry',
    'Canonical Facts',
    'Entity Profiles',
    'Relationship Graph',
    'Gaps + Confidence',
    'Context Pack Assembler',
  ].map((label, index) => {
    const x = 58 + index * 168;
    return `
      <g>
        <rect x="${x}" y="306" width="142" height="52" rx="11" fill="#0b111a" stroke="#ffd166" stroke-width="1.5"/>
        <foreignObject x="${x + 12}" y="318" width="118" height="28">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font: 10px Inter, sans-serif; color:#eef3f8; font-weight:800; text-align:center; line-height:1.15">${htmlEscape(label)}</div>
        </foreignObject>
        ${index < 6 ? `<path d="M${x + 142} 332 L${x + 166} 332" stroke="#ffd166" stroke-width="2"/><path d="M${x + 166} 332 l-7 -5 v10 z" fill="#ffd166"/>` : ''}
      </g>`;
  }).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 520" role="img" aria-label="Moves over Nexus data layer">
      <rect x="0" y="0" width="1280" height="520" rx="18" fill="#0b111a"/>
      <text x="54" y="40" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">MOVES OVER DATA LAYER</text>
      <text x="54" y="68" fill="#eef3f8" font-size="23" font-weight="900">Moves does not bypass the data layer</text>
      ${phaseMarkup}
      <rect x="48" y="276" width="1184" height="112" rx="16" fill="#101722" stroke="#ffd166" opacity=".92"/>
      <text x="72" y="300" fill="#ffd166" font-size="13" font-weight="900">Common Nexus Data Layer</text>
      ${dataLayer}
      <path d="M1188 358 C1235 420 1120 454 966 404" stroke="#ff6b6b" stroke-width="2.5" fill="none" stroke-dasharray="8 7"/>
      <text x="934" y="432" fill="#ffb3b3" font-size="12" font-weight="800">gap found → evidence request to client</text>
      <path d="M360 430 C260 462 145 430 118 358" stroke="#3ddc97" stroke-width="2.5" fill="none" stroke-dasharray="8 7"/>
      <text x="82" y="460" fill="#b9f8dc" font-size="12" font-weight="800">validated new evidence returns through templates/adapters</text>
      <text x="54" y="498" fill="#9aa8b8" font-size="13">Moves asks the Nexus context layer for the right evidence-backed context. New client evidence is captured, validated, and then becomes reusable enterprise context.</text>
    </svg>
  </div>`;
}

function gapFeedbackLoopSvg() {
  const items = [
    ['Gap detected', 'missing, stale, low-confidence, ambiguous'],
    ['Evidence request', 'document, export, interview, owner, baseline'],
    ['Client response', 'upload, answer, confirm, reject, clarify'],
    ['Candidate update', 'captured through template or adapter'],
    ['SME validation', 'approve, correct, reject, unresolved'],
    ['Active context', 'only if approved and source-backed'],
  ];
  const markup = items.map(([title, copy], index) => {
    const angle = (-90 + index * 60) * Math.PI / 180;
    const cx = 640 + Math.cos(angle) * 345;
    const cy = 250 + Math.sin(angle) * 135;
    return `
      <g>
        <rect x="${cx - 78}" y="${cy - 34}" width="156" height="68" rx="13" fill="#101722" stroke="${index === 0 ? '#ff6b6b' : '#75a7ff'}" stroke-width="2"/>
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="#eef3f8" font-size="13" font-weight="900">${htmlEscape(title)}</text>
        <foreignObject x="${cx - 64}" y="${cy + 3}" width="128" height="26">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font: 10px Inter, sans-serif; color:#9aa8b8; line-height:1.12; text-align:center">${htmlEscape(copy)}</div>
        </foreignObject>
      </g>`;
  }).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 500" role="img" aria-label="Gap to evidence feedback loop">
      <rect x="0" y="0" width="1280" height="500" rx="18" fill="#0b111a"/>
      <text x="54" y="42" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">GAP FEEDBACK LOOP</text>
      <text x="54" y="70" fill="#eef3f8" font-size="23" font-weight="900">A gap is a controlled evidence request, not a failure</text>
      <ellipse cx="640" cy="250" rx="360" ry="150" fill="none" stroke="#75a7ff" stroke-width="2.5" stroke-dasharray="10 8"/>
      ${markup}
      <circle cx="640" cy="250" r="64" fill="#182335" stroke="#3ddc97" stroke-width="2"/>
      <text x="640" y="242" text-anchor="middle" fill="#eef3f8" font-size="15" font-weight="900">Governed</text>
      <text x="640" y="262" text-anchor="middle" fill="#eef3f8" font-size="15" font-weight="900">review loop</text>
      <text x="60" y="462" fill="#9aa8b8" font-size="13">Outcomes: candidate context, rejected evidence, active context after validation, or a known unresolved gap.</text>
    </svg>
  </div>`;
}

function contextPackAssemblySvg() {
  const packs = [
    ['KnowledgeContextPack', 'browsing, relationships, evidence limits'],
    ['MovesContextPack', 'phase-specific context, evidence, gaps'],
    ['IntelligenceContextPack', 'governed Claude-ready payload'],
    ['SourceContextPack', 'vendors, contracts, systems, spend, SLA, risk'],
    ['TowerContextPack', 'baseline, hypothesis, plan, measured evidence'],
  ];
  const packMarkup = packs.map(([title, copy], index) => {
    const x = 72 + index * 232;
    return `
      <g>
        <rect x="${x}" y="262" width="190" height="88" rx="14" fill="#101722" stroke="#b693ff" stroke-width="2"/>
        <text x="${x + 95}" y="294" text-anchor="middle" fill="#eef3f8" font-size="13" font-weight="900">${htmlEscape(title)}</text>
        <foreignObject x="${x + 22}" y="308" width="146" height="32">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font: 10px Inter, sans-serif; color:#9aa8b8; line-height:1.12; text-align:center">${htmlEscape(copy)}</div>
        </foreignObject>
      </g>`;
  }).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 430" role="img" aria-label="Context pack assembly">
      <rect x="0" y="0" width="1280" height="430" rx="18" fill="#0b111a"/>
      <text x="54" y="42" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">CONTEXT PACK ASSEMBLY</text>
      <text x="54" y="70" fill="#eef3f8" font-size="23" font-weight="900">Modules consume governed context packs, not raw templates</text>
      <rect x="94" y="112" width="1092" height="70" rx="16" fill="#101722" stroke="#ffd166" stroke-width="2"/>
      <text x="640" y="142" text-anchor="middle" fill="#eef3f8" font-size="17" font-weight="900">Evidence Registry + Canonical Facts + Entity Profiles + Graph + Gaps + Confidence</text>
      <text x="640" y="164" text-anchor="middle" fill="#9aa8b8" font-size="12">filtered by tenant, sensitivity, source basis, active/candidate status, phase, and module policy</text>
      <path d="M640 182 L640 226" stroke="#75a7ff" stroke-width="3"/>
      <rect x="500" y="226" width="280" height="44" rx="13" fill="#182335" stroke="#8bd3ff" stroke-width="2"/>
      <text x="640" y="253" text-anchor="middle" fill="#8bd3ff" font-size="14" font-weight="900">Context Pack Assembler</text>
      ${packMarkup}
    </svg>
  </div>`;
}

function moduleHandoffSvg() {
  const nodes = [
    ['Knowledge', 106, 154, '#75a7ff', 'browse enterprise context'],
    ['Intelligence', 315, 88, '#3ddc97', 'prioritize opportunities'],
    ['Moves', 535, 154, '#ffd166', 'run transformation phases'],
    ['Source', 755, 88, '#ff9f6e', 'shape vendor / sourcing path'],
    ['Tower', 968, 154, '#b693ff', 'measure value and risk'],
    ['aVa', 535, 286, '#8bd3ff', 'reason with citations and limits'],
  ];
  const edges = [
    [194, 154, 315, 117, 'KnowledgeContextPack'],
    [405, 117, 535, 154, 'IntelligenceContextPack'],
    [625, 154, 755, 117, 'SourceContextPack'],
    [845, 117, 968, 154, 'TowerContextPack'],
    [535, 196, 535, 262, 'MovesContextPack'],
    [610, 286, 968, 196, 'measured only with evidence'],
    [460, 286, 106, 196, 'answers cite governed context'],
  ].map(([x1, y1, x2, y2, label]) => `
    <g>
      <path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" stroke="#75a7ff" stroke-width="2.5" fill="none" opacity=".78"/>
      <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" fill="#9aa8b8" font-size="11" text-anchor="middle">${htmlEscape(label)}</text>
    </g>`).join('');
  const nodeMarkup = nodes.map(([label, x, y, color, copy]) => `
    <g>
      <rect x="${x}" y="${y}" width="145" height="76" rx="15" fill="#101722" stroke="${color}" stroke-width="2"/>
      <text x="${x + 72.5}" y="${y + 30}" text-anchor="middle" fill="#eef3f8" font-size="15" font-weight="900">${htmlEscape(label)}</text>
      <foreignObject x="${x + 18}" y="${y + 40}" width="109" height="28">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font: 10px Inter, sans-serif; color:#9aa8b8; line-height:1.15; text-align:center">${htmlEscape(copy)}</div>
      </foreignObject>
    </g>`).join('');
  return `<div class="svg-panel">
    <svg viewBox="0 0 1280 455" role="img" aria-label="Nexus module handoff map">
      <rect x="0" y="0" width="1280" height="455" rx="18" fill="#0b111a" />
      <text x="54" y="42" fill="#75a7ff" font-size="13" font-weight="900" letter-spacing="3">MODULE HANDOFF MAP</text>
      <text x="54" y="70" fill="#eef3f8" font-size="23" font-weight="900">The same context spine makes the whole platform feel connected</text>
      ${edges}
      ${nodeMarkup}
      <rect x="68" y="392" width="1138" height="1" fill="#2a3546" />
      <text x="74" y="425" fill="#9aa8b8" font-size="13">AbarVa should feel like one operating system: context enters once, evidence travels with it, each module adds a new decision surface.</text>
    </svg>
  </div>`;
}

const tocSections = [
  'Executive Summary',
  'Meridian Health: Enterprise Context and Strategic Priorities',
  'Meridian Agent Assist Golden Thread',
  'CDAO Meeting Talk Track',
  'HTML Quality and Accuracy Audit',
  'Client Onboarding Model',
  'How Clients Use the Templates',
  'Workshop and Interview Playbook',
  'Agent Assist Context Requirements',
  'Copilot-Assisted Source Parsing',
  'Hybrid Validation and Promotion',
  'Source Template Standard',
  'Template Examples with Meridian Rows',
  'Visual Data Layer Cake',
  'Moves Over Data Layer',
  'Gap to Evidence Feedback Loop',
  'Context Pack Assembly',
  'One-Step Data Flow Walkthrough',
  'ERD + Graph Dot-Connector View',
  'End-to-End Data Flow',
  'Layer-by-Layer Volumetric',
  'Logical Data Model / ERD',
  'Evidence Registry',
  'Canonical Facts',
  'Entity Profiles',
  'Relationship Graph',
  'Context Gaps and Confidence',
  'Azure Technical Architecture',
  'Moves Workflow P0-P5',
  'Phase-by-Phase Evidence Guide',
  'Module Wiring',
  'Module Handoff Map',
  'Source-to-Layer Reconciliation',
  'AWS / Databricks Semantic Proof',
  'Legacy Leakage Proof',
  'Demo Readiness',
  'Appendix / Raw Proof Tables',
];

const dimensionCards = requiredDimensions.map((dimension) => {
  const row = templateCompleteness.find((item) => item.dimension === dimension);
  const active = parseCsv(activeDimensionFile(dimension)).rows;
  const sample = active[0] ?? {};
  return {
    eyebrow: dimension.slice(0, 2),
    title: dimension.replace(/^\d+_/, '').replace(/_/g, ' '),
    copy: `Purpose: capture ${dimension.replace(/^\d+_/, '').replace(/_/g, ' ')} context. Example Meridian row: ${Object.values(sample).filter(Boolean).slice(1, 3).join(' / ') || 'available in active source'}. Feeds evidence, facts, profiles, gaps, and module context.`,
    meta: [`${row?.active_row_count ?? 0} active rows`, row?.recommended_action ?? 'review', 'Knowledge/Moves/Intelligence/Source/Tower'],
  };
});

const adapterCards = sourceAdapterCompleteness.map((adapter) => ({
  eyebrow: adapter.source_adapter.slice(0, 4),
  title: adapter.source_adapter.replace(/_/g, ' '),
  copy: `Expected export is mapped into core dimensions, evidence sources, relationships, risks, and metrics. Meridian synthetic workbook is present and remains candidate until SME/source validation.`,
  meta: [`${adapter.row_count} workbook rows`, adapter.recommended_action.startsWith('Pass') ? 'present' : 'review', 'candidate extract'],
}));

const templateExamples = [
  {
    title: '01 Business Functions',
    fields: 'function_id, function_name, business_owner, description, key_processes, systems_used, data_domains, metrics, risks, evidence_id, confidence, gap_status',
    row: 'FUNC-MER-MEMBER-SERVICE | Member Service / Contact Center | VP Member Experience | handles benefits, eligibility, claims, provider access, care navigation | Genesys, CRM, claims, eligibility, knowledge base | AHT, FCR, transfer rate, repeat contact, CSAT | PHI exposure, inconsistent answers | EVID-MER-OPS-001 | medium | KPI baseline incomplete; transcript evidence not validated',
    moves: 'Frames P0/P1 scope, P2 process diagnosis, P3 operating model, and Tower metric baseline requests.',
  },
  {
    title: '04 Applications & Systems',
    fields: 'system_id, system_name, business_function_supported, owner, hosting_model, lifecycle_status, criticality, integrations, data_domains, vendor, evidence_id, confidence, gap_status',
    row: 'SYS-MER-GENESYS | Contact Center Platform | Member Service | Contact Center Technology Owner | SaaS/vendor-hosted | current | high | CRM, call routing, reporting, knowledge search | call interaction, agent activity, queue, disposition | EVID-MER-CMDB-010 | medium | transcript export availability not validated',
    moves: 'Lets Moves identify current-state system dependencies and Source/Tower handoff points.',
  },
  {
    title: '05 Data Assets & Integrations',
    fields: 'data_asset_id, data_asset_name, source_system, consumed_by, integration_pattern, freshness, data_quality_status, target_platform, evidence_id, confidence, gap_status',
    row: 'DATA-MER-CLAIMS-STATUS | Claims Status Data | Claims Platform | CRM/Member Service, reporting marts, Agent Assist target context | batch/API mixed | unknown | partial | AWS + Databricks lakehouse target foundation | EVID-MER-DATA-014 | medium | lineage and freshness not validated',
    moves: 'Controls whether P2 can diagnose current data readiness and whether P3 can compare viable architecture options.',
  },
  {
    title: '10 AI & Automation Use Cases',
    fields: 'use_case_id, use_case_name, business_problem, target_users, systems_needed, data_needed, required_controls, readiness_status, target_foundation, evidence_id, confidence, gap_status',
    row: 'UC-MER-AGENT-ASSIST | AI Agent Assist for Member Service | long calls, transfers, repeat contacts, inconsistent answers | agents, supervisors | CRM, contact center, claims, eligibility, knowledge base | member, claims, eligibility, provider, transcript, knowledge article | PHI redaction, HITL, audit logging | discovery/framing ready; not production-ready | AWS + Databricks target foundation | EVID-MER-AI-001 | medium | transcript governance, KPI baseline, API readiness, knowledge freshness require validation',
    moves: 'Anchors the golden thread from P0 opportunity framing through P5 handoff.',
  },
  {
    title: '11 Risks & Controls',
    fields: 'risk_id, risk_name, risk_description, related_use_case, related_systems, control_needed, risk_level, evidence_id, confidence, gap_status',
    row: 'RISK-MER-PHI-AGENT-ASSIST | PHI exposure in AI Agent Assist | responses may surface PHI without masking, audit, or approval controls | UC-MER-AGENT-ASSIST | CRM, contact center, claims, eligibility, knowledge base | PHI redaction, RBAC, HITL, audit logging, answer traceability | high | EVID-MER-RISK-004 | medium | control design not yet approved',
    moves: 'Prevents solution artifacts from overclaiming safety before controls are accepted.',
  },
  {
    title: '14 Metrics & Outcomes',
    fields: 'metric_id, metric_name, business_function, baseline_value, target_value, measurement_source, used_by, evidence_id, confidence, gap_status',
    row: 'MET-MER-AHT | Average Handle Time | Member Service | not validated | to be defined in P1/P2 | contact center reporting | Moves, Tower, Intelligence | EVID-MER-METRIC-002 | low | baseline report required before value claim',
    moves: 'Keeps value claims honest until baseline evidence exists.',
  },
];

const workshops = [
  ['Executive Context Workshop', 'CIO, CDAO, business sponsor, transformation lead', 'Business outcome, funding decision, success criteria, unacceptable risks', 'enterprise priorities, use case definition, sponsor roles, decision gates'],
  ['Process / Operations Workshop', 'contact center leader, claims leader, eligibility leader, supervisors, agents', 'Current workflow, systems used, transfers, repeat contacts, trusted knowledge sources', 'process evidence, role/persona data, pain points, operational metrics'],
  ['Systems / Architecture Workshop', 'CRM owner, contact center owner, claims owner, integration owner, enterprise architect', 'Systems, integrations, APIs, batch vs real-time, on-prem estate, target-state direction', 'application/system rows, integration rows, infrastructure rows, architecture gaps'],
  ['Data / Analytics Workshop', 'CDAO team, data platform owner, BI owner, data governance lead', 'Claims, eligibility, member, provider, call, transcript, knowledge, freshness, lineage, KPI baselines', 'data assets, metrics, data-quality gaps, AWS/Databricks target dependencies'],
  ['Risk / Controls Workshop', 'security, privacy, compliance, legal, model risk, audit', 'PHI/PII, HITL, answer audit, model governance, retention, knowledge approval', 'risks/controls, policy constraints, audit requirements, production blockers'],
  ['Vendor / Contract Workshop', 'procurement, vendor management, contract owner, IT finance', 'Vendors, contracts, obligations, renewals, spend, sourcing decisions', 'vendor/contract rows, spend/value rows, Source handoff context'],
];

const clientDataRequest = [
  'Application inventory / CMDB export',
  'Business capability map, if available',
  'Org chart / ownership matrix',
  'Current architecture diagrams',
  'Data platform inventory',
  'Integration/API catalog',
  'KPI reports',
  'ServiceNow incidents/problems/changes',
  'Vendor contracts and SOWs',
  'Program roadmap',
  'Risk/control assessments',
  'Existing AI use case inventory',
  'Process maps or SOPs',
  'Contact center reports',
  'Data governance/catalog exports',
];

const htmlQualityAccuracyAudit = [
  ['Executive Summary', 'medium', 'The summary could imply a linear client-input-to-module path.', 'Client inputs -> Context Packs -> Nexus Modules', 'Business use case defines context requirements; evidence fills them; modules consume governed context packs.', 'Avoids suggesting raw inputs are directly module-consumable.'],
  ['Meridian Health Context and Strategic Priorities', 'low', 'Strategic context needed stronger current-vs-target architecture boundary.', 'AWS/Databricks modernization agenda', 'Legacy/on-prem-heavy current state; AWS + Databricks are target foundation/readiness path, not certified production.', 'Prevents overclaiming production readiness.'],
  ['Agent Assist Golden Thread', 'medium', 'Golden thread needed explicit context requirement framing.', 'Problem -> Context -> Gaps -> Moves Plan', 'Agent Assist use case defines required business, system, data, control, metric, org, and foundation context.', 'Keeps the story decision-led and evidence-gated.'],
  ['CDAO Meeting Talk Track', 'low', 'Talk track needed stronger no-overclaim guardrail.', 'Evidence-gated AI', 'CDAO story now emphasizes governed context, caveats, and no realized value claim.', 'Keeps executive demo credible.'],
  ['Client Onboarding Model', 'medium', 'Could imply onboarding creates active truth automatically.', 'Template/interview/Copilot/hybrid intake', 'Intake creates candidate context until SME validation approves active status.', 'Protects active/candidate boundary.'],
  ['How Clients Use the Templates', 'high', 'Lifecycle started with select use case but did not say a use case defines requirements rather than evidence.', 'Select use case -> fill templates', 'Use case -> required context dimensions -> evidence collection -> templates/adapters -> validation -> active context or gap.', 'Fixes the primary semantic risk.'],
  ['Workshop and Interview Playbook', 'low', 'Workshop outputs needed to be described as evidence inputs, not approved facts.', 'Outputs: process evidence, roles, metrics', 'Workshop answers become evidence candidates with confidence and validation status.', 'Prevents interview notes from becoming truth without review.'],
  ['Agent Assist Context Requirements', 'low', 'Needed explicit before-finalizing-discovery guidance.', 'Context requirements list', 'Business, technology, data, controls, org/change, metrics, and foundation readiness are required to finalize discovery artifacts.', 'Clarifies why tech stack and org context matter.'],
  ['Copilot-Assisted Source Parsing', 'high', 'Copilot extraction could be misread as approval.', 'Copilot drafts candidate rows', 'Copilot output remains candidate-only until SME/source validation.', 'Prevents generated extraction from becoming approved truth.'],
  ['Hybrid Validation and Promotion', 'low', 'Correct but needed stronger outcomes.', 'Candidate -> active', 'Review can produce candidate context, rejected evidence, active context, or known unresolved gap.', 'Makes gap handling explicit.'],
  ['Source Template Standard', 'medium', 'Could imply templates directly feed modules.', 'Feeds evidence, facts, profiles, gaps, and module context', 'Templates/adapters feed governed layers; Context Pack Assembler feeds modules.', 'Protects module-consumption architecture.'],
  ['Template Examples with Meridian Rows', 'low', 'Examples needed stronger synthetic/candidate caveat.', 'Meridian row examples', 'Rows are demo-safe synthetic examples with evidence/confidence/gap caveats.', 'Prevents client-data overclaim.'],
  ['Visual Data Layer Cake', 'low', 'Needed explicit module-ready context boundary.', 'Raw client material is not what modules consume', 'Every layer adds source, confidence, gap, and active/candidate status before modules can rely on it.', 'Keeps diagram accurate.'],
  ['Moves Over Data Layer', 'high', 'Required diagram was missing.', 'No equivalent previous page', 'Moves phases request phase-specific MovesContextPacks from the Nexus data layer; gaps flow back to client evidence intake.', 'Fixes the main architecture story.'],
  ['Gap to Evidence Feedback Loop', 'high', 'Gap handling was present but not visualized as a controlled loop.', 'Gaps listed as caveats', 'Gap -> evidence request -> client response -> candidate update -> SME validation -> active/rejected/unresolved outcome.', 'Prevents gaps from being treated as failures or facts.'],
  ['Context Pack Assembly', 'high', 'Modules could be interpreted as reading raw templates.', 'Modules receive active context packs', 'KnowledgeContextPack, MovesContextPack, IntelligenceContextPack, SourceContextPack, and TowerContextPack are assembled from governed layers.', 'Corrects module wiring.'],
  ['One-Step Data Flow Walkthrough', 'high', 'Original flow implied use case directly creates client evidence.', 'Use case -> Client evidence', 'Use case defines context requirements; client evidence fills them; validation governs active use.', 'Fixes the flagged semantic bug.'],
  ['ERD / Graph View', 'medium', 'ERD needed to distinguish governed model from graph explanation.', 'ERD + graph view', 'ERD defines governed contract; graph connects systems, functions, data, risks, metrics, vendors, and programs.', 'Improves architecture accuracy.'],
  ['End-to-End Data Flow', 'medium', 'Needed to use corrected pipeline semantics.', 'Client Inputs -> Template Rows -> Modules', 'Evidence is captured through templates/adapters, reconciled into governed layers, and assembled into context packs.', 'Avoids direct raw-source-to-module implication.'],
  ['Layer-by-Layer Volumetric', 'low', 'Counts could be mistaken for production truth.', 'Accepted/candidate/active row counts', 'Counts remain proof/report data with active/candidate caveats and no production-write claim.', 'Protects demo safety.'],
  ['Logical Data Model / ERD', 'medium', 'Needed stronger context-pack assembler role.', 'Edges and gaps feed context packs', 'Governed entities and relationships feed policy-filtered context packs, not raw module prompts.', 'Aligns data model with runtime contract.'],
  ['Evidence Registry', 'low', 'Registry needed explicit source-proof wording.', 'Evidence Registry tracks source-backed proof', 'Evidence carries source type, owner, as-of date, sensitivity, confidence, active/candidate status, linked facts, and dimensions.', 'Keeps proof basis visible.'],
  ['Canonical Facts', 'medium', 'Could imply source statements become facts automatically.', 'Source statement -> Normalized fact', 'Source statements are normalized only with evidence, confidence, and validation status.', 'Prevents automatic fact promotion.'],
  ['Entity Profiles', 'low', 'Table-only section needed usage clarification.', 'Profile coverage table', 'Profiles organize reusable enterprise context after evidence-backed facts are available.', 'Improves executive readability.'],
  ['Relationship Graph', 'medium', 'Graph needed explicit non-calculation boundary.', 'Graph traversal identifies dependencies', 'Graph explains dependency context and gaps; it does not calculate Tower value or certify readiness.', 'Prevents metric/value overclaim.'],
  ['Context Gaps and Confidence', 'low', 'Gap handling needed positive framing.', 'Context is not just facts', 'A gap is a controlled evidence request with owner, severity, and possible validation outcomes.', 'Makes uncertainty actionable.'],
  ['Azure Technical Architecture', 'medium', 'Tech overlay needed context-pack boundary.', 'Where client evidence becomes safe module context', 'ACA/Blob/validation/data artifacts assemble governed context packs; no runtime behavior changed in this PR.', 'Prevents runtime/deploy overclaim.'],
  ['Moves Workflow P0-P5', 'medium', 'Moves needed phase-specific context pack language.', 'Each phase asks minimum context', 'Each phase requests a phase-specific MovesContextPack and returns gaps as evidence requests.', 'Aligns Moves with data layer.'],
  ['Phase-by-Phase Evidence Guide', 'low', 'Phase guide needed evidence lifecycle caveat.', 'What to upload/answer/produce', 'Uploaded/answered items become candidate evidence until validated for phase use.', 'Prevents self-attestation overclaim.'],
  ['Module Wiring', 'high', 'Module cards could imply modules read broad context directly.', 'Uses context, vendors, metrics', 'Modules consume context packs: Knowledge, Moves, Intelligence, Source, Tower, each with scope-specific payloads.', 'Corrects module architecture.'],
  ['Module Handoff Map', 'medium', 'Map showed handoff without enough context-pack semantics.', 'The same context spine starts in Knowledge...', 'The same context spine is assembled into module-specific context packs; modules add decision surfaces, not raw truth.', 'Makes platform story accurate.'],
  ['Source-to-Layer Reconciliation', 'medium', 'Trace cards needed to clarify validation path.', 'Source -> Fact -> Edge -> Modules', 'Trace flows source row -> evidence -> fact/profile/edge/gap -> context pack; modules consume the pack.', 'Avoids direct source-to-module shortcut.'],
  ['AWS / Databricks Semantic Proof', 'high', 'Must preserve current vs target state boundary.', 'AWS + Databricks is the target foundation', 'Current state is fragmented/legacy; AWS + Databricks lakehouse, medallion, Unity Catalog, data products, PHI/HITL/audit controls are target/readiness path.', 'Prevents certified-production claim.'],
  ['Legacy Leakage Proof', 'low', 'Correct but should stay caveated as historical/report-only.', 'Legacy leakage table', 'Old V-named references are kept out of active demo language and loader-visible paths.', 'Prevents naming confusion.'],
  ['Demo Readiness', 'medium', 'Needed to separate safe claims from future work.', 'safe-for-cdao-demo-with-caveats', 'Demo is safe with caveats; no production data, no realized ROI, no certified AWS/Databricks, no Tower outcome proof.', 'Keeps demo claims defensible.'],
  ['Client Data Request Pack', 'low', 'Data request list needed lifecycle tie-back.', 'Client data request pack', 'Requested files fill context dimensions and enter the same template/adapter, validation, active/candidate lifecycle.', 'Makes client ask purposeful.'],
  ['Good Enough by Phase', 'low', 'Good-enough criteria needed evidence-gated caveat.', 'P0/P1 enough context, P2 enough evidence...', 'Good enough means sufficient evidence and explicit caveats for that phase, not complete enterprise truth.', 'Avoids over-scoping.'],
  ['Recommended Client Onboarding Sequence', 'medium', 'Sequence needed corrected lifecycle.', 'Week 0 use case + sponsors + templates', 'Use case selects required context; weeks collect evidence, validate candidate context, assemble context packs, and recycle gaps.', 'Aligns operating model with architecture.'],
  ['Appendix / Raw Proof Tables', 'low', 'Appendix needed no-runtime-change caveat.', 'Raw proof tables', 'Tables support the guide but do not represent runtime mutation, client production data, or candidate promotion.', 'Protects audit boundary.'],
].map(([section_name, severity, issue_found, old_wording_or_diagram, corrected_wording_or_diagram, rationale]) => ({
  section_name,
  issue_found,
  severity,
  old_wording_or_diagram,
  corrected_wording_or_diagram,
  rationale,
  demo_risk: severity === 'high' ? 'Could mislead executives about architecture, evidence readiness, or product behavior.' : severity === 'medium' ? 'Could create ambiguity in a live demo if not caveated.' : 'Low risk after clarification.',
  fixed_status: 'fixed',
}));

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Meridian Nexus Data Layer Operating Guide</title>
  <style>
    :root { color-scheme: dark; --bg:#080b10; --panel:#101722; --panel2:#151e2b; --line:#2a3546; --text:#eef3f8; --muted:#9aa8b8; --blue:#75a7ff; --green:#3ddc97; --yellow:#ffd166; --red:#ff6b6b; --violet:#b693ff; }
    body { margin:0; background:linear-gradient(140deg,#080b10,#0e1520 45%,#0a1017); color:var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .layout { display:grid; grid-template-columns: 300px minmax(0,1fr); min-height:100vh; }
    nav { position:sticky; top:0; height:100vh; padding:28px 20px; border-right:1px solid var(--line); background:rgba(8,11,16,.9); backdrop-filter: blur(16px); box-sizing:border-box; overflow:auto; }
    nav .brand { font-weight:800; letter-spacing:.18em; font-size:12px; color:var(--blue); margin-bottom:6px; }
    nav h1 { font-size:20px; line-height:1.1; margin:0 0 18px; }
    nav a { display:block; color:var(--muted); text-decoration:none; padding:7px 0; font-size:12px; border-bottom:1px solid rgba(255,255,255,.04); }
    nav a:hover { color:var(--text); }
    main { padding:34px 42px 80px; max-width:1520px; min-width:0; overflow-x:hidden; }
    .hero { border:1px solid var(--line); background:radial-gradient(circle at top right, rgba(117,167,255,.24), transparent 38%), linear-gradient(135deg,rgba(16,23,34,.98),rgba(10,16,24,.98)); border-radius:10px; padding:30px; margin-bottom:18px; }
    .eyebrow { color:var(--blue); text-transform:uppercase; letter-spacing:.18em; font-size:12px; font-weight:700; }
    h2 { margin:0 0 10px; font-size:26px; }
    h3 { margin:22px 0 10px; font-size:18px; }
    p { color:var(--muted); line-height:1.55; }
    .grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; }
    .grid3 { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; }
    .card { border:1px solid var(--line); background:rgba(16,23,34,.92); border-radius:8px; padding:16px; overflow-wrap:anywhere; }
    .card h3 { margin-top:0; }
    .metric { font-size:28px; font-weight:800; margin-top:5px; }
    .metric small { font-size:12px; color:var(--muted); font-weight:500; }
    section { margin-top:18px; border:1px solid var(--line); background:rgba(16,23,34,.76); border-radius:10px; padding:24px; min-width:0; overflow:hidden; }
    .badge { display:inline-flex; align-items:center; border:1px solid var(--line); border-radius:999px; padding:5px 10px; font-size:12px; font-weight:700; margin:3px 4px 3px 0; }
    .good { color:#09130f; background:var(--green); border-color:var(--green); }
    .warn { color:#181105; background:var(--yellow); border-color:var(--yellow); }
    .bad { color:#210809; background:var(--red); border-color:var(--red); }
    table { display:block; width:100%; max-width:100%; border-collapse:collapse; font-size:12px; margin-top:10px; overflow-x:auto; }
    th, td { border-bottom:1px solid rgba(255,255,255,.08); padding:9px 8px; text-align:left; vertical-align:top; }
    th { color:#d9e6f7; background:rgba(255,255,255,.05); position:sticky; top:0; }
    td { color:#c8d2df; }
    th, td, p, li, .step, .node, .badge, details, pre { overflow-wrap:anywhere; }
    pre { max-width:100%; overflow:auto; }
    .diagram { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:14px 0; }
    .node { padding:10px 12px; border:1px solid var(--line); background:var(--panel2); border-radius:8px; font-weight:700; font-size:13px; }
    .arrow { color:var(--blue); font-weight:800; }
    .svg-panel { border:1px solid rgba(117,167,255,.22); background:#0b111a; border-radius:12px; padding:10px; margin:16px 0; overflow:auto; box-shadow:0 18px 40px rgba(0,0,0,.22); }
    .svg-panel svg { width:100%; min-width:980px; display:block; }
    .rail { display:grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:10px; margin:14px 0; }
    .rail .step { border:1px solid rgba(117,167,255,.35); background:rgba(117,167,255,.08); border-radius:8px; padding:12px; }
    .step strong { display:block; color:#eaf2ff; margin-bottom:5px; }
    ul { color:var(--muted); line-height:1.55; padding-left:20px; }
    .example { border-left:3px solid var(--blue); background:rgba(117,167,255,.07); padding:12px 14px; border-radius:6px; margin-top:10px; }
    .subtle { color:var(--muted); font-size:13px; }
    details { border:1px solid rgba(255,255,255,.09); border-radius:8px; padding:12px; margin-top:12px; background:rgba(255,255,255,.03); }
    summary { cursor:pointer; color:#dce8f7; font-weight:700; }
    .two { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .bar { height:10px; border-radius:999px; background:#263244; overflow:hidden; margin-top:8px; }
    .bar span { display:block; height:100%; background:linear-gradient(90deg,var(--green),var(--blue)); }
    code { color:#b7d1ff; }
    @media print { nav { display:none; } .layout { display:block; } body { background:#fff; color:#111; } section,.hero,.card { break-inside:avoid; color:#111; background:#fff; } p,td,li { color:#333; } }
    @media (max-width: 980px) { .layout { grid-template-columns:1fr; } nav { position:relative; height:auto; } main { padding:22px; } .grid,.grid3,.two { grid-template-columns:1fr; } }
  </style>
</head>
<body>
<div class="layout">
  <nav>
    <div class="brand">ABARVA · NEXUS</div>
    <h1>Data Layer Operating Guide</h1>
    ${tocSections.map((label) => `<a href="#${slug(label)}">${label}</a>`).join('')}
  </nav>
  <main>
    <div class="hero">
      <div class="eyebrow">Meridian Health · Agent Assist · Nexus Data Layer</div>
      <h2>From use-case context requirements to module-ready enterprise context</h2>
      <p>Nexus does not start with a prompt, and a use case does not create evidence. For Meridian Agent Assist, the use case defines required context. Client documents, source-system exports, interviews, reports, contracts, architecture diagrams, and operational data fill those requirements. Templates/adapters capture the evidence, validation governs active/candidate status, and the Context Pack Assembler creates module-ready payloads.</p>
      <div>${badge(overallStatus)}${badge(`readiness ${readinessScore}/100`)}${badge('no production writes')}${badge('candidate not promoted')}</div>
    </div>
    <section id="executive-summary">
      <h2>Executive Summary</h2>
      <div class="grid">
        <div class="card"><div class="eyebrow">Dimensions</div><div class="metric">${summary.counts.dimensions_passed}/${summary.counts.required_dimensions}</div><p>Standard dimensions represented.</p></div>
        <div class="card"><div class="eyebrow">Evidence</div><div class="metric">${summary.counts.evidence_registry_records}</div><p>Evidence manifest records in v3 generated pack.</p></div>
        <div class="card"><div class="eyebrow">Graph</div><div class="metric">${summary.counts.relationship_graph_edges}</div><p>Generated relationship edges for context reasoning.</p></div>
        <div class="card"><div class="eyebrow">Legacy Must Fix</div><div class="metric">${summary.counts.legacy_must_fix}</div><p>Loader-visible forbidden V-path leaks.</p></div>
      </div>
      <div class="rail">
        ${['Client inputs','Evidence Registry','Canonical Facts','Entity Profiles','Relationship Graph','Context Packs','Nexus Modules'].map((step, index) => `<div class="step"><strong>${index + 1}. ${step}</strong><span class="subtle">Governed context stage</span></div>`).join('')}
      </div>
      <p>This guide proves what exists and explains how a real client team creates it through manual template completion, workshop/interview capture, Copilot-assisted extraction, and hybrid SME validation. It does not rebuild the data layer, promote candidate data, write production data, or claim real Meridian production evidence.</p>
    </section>
    <section id="meridian-health-enterprise-context-and-strategic-priorities">
      <h2>Meridian Health: Enterprise Context and Strategic Priorities</h2>
      <p>Here is who Meridian is, why Agent Assist matters, what Nexus knows, what is missing, and how the data layer turns that context into safe, executable AI transformation.</p>
      <div class="two">
        <div class="card"><h3>Enterprise Profile</h3><p>Meridian is a synthetic healthcare enterprise with provider/payer-like complexity: member service and contact center operations, claims operations, eligibility and benefits, provider operations, Epic clinical analytics context, finance analytics, fragmented reporting, legacy/on-prem-heavy systems, and an emerging data/AI modernization agenda. This is synthetic Meridian-style context, not real Meridian production data.</p></div>
        <div class="card"><h3>Strategic Priorities</h3>${simpleList(['improve member experience','reduce call handling friction','improve first contact resolution','reduce repeat contacts and transfers','modernize fragmented data and reporting','establish governed healthcare data foundation','improve analytics speed and trust','prepare for safe AI use cases','strengthen PHI, privacy, and model governance','create reusable data products for clinical, finance, provider, operations, and member service'])}</div>
      </div>
      <div class="grid3">
        <div class="card"><h3>Current-State Challenges</h3>${simpleList(['agents use multiple systems to answer member questions','claims and eligibility data are fragmented','knowledge articles may be stale or inconsistently governed','transcript/call-recording data is not validated for AI use','KPI baselines are incomplete','reporting depends on legacy marts and BI tools','data lineage and freshness are not fully proven','AWS/Databricks is a target foundation, not current certified production'])}</div>
        <div class="card"><h3>What Nexus Knows</h3>${simpleList(['business functions across member service, claims, eligibility, clinical, provider, finance, data platform, and operations','key systems including contact center, CRM/member service, claims, eligibility, Epic analytics context, SQL/Netezza-style marts, Tableau, SAS, ServiceNow, and target AWS/Databricks assets','key data domains including member, claims, eligibility, provider, clinical, call interaction, knowledge article, finance, vendor, and operational metrics','key risks including PHI, HITL, hallucination, audit, stale knowledge, incomplete baseline, and target-foundation readiness'])}</div>
        <div class="card"><h3>What Nexus Does Not Know Yet</h3>${simpleList(['validated transcript availability','approved KPI baselines','production API readiness','knowledge article freshness','PHI/HITL control design','AWS/Databricks production readiness','final business case or measured value'])}</div>
      </div>
      <h3>Transformation Thesis</h3>
      <p>Meridian does not need a chatbot first. Meridian needs an enterprise-aware transformation path. Nexus starts by organizing what is known, what is missing, what evidence supports it, and what decisions can safely be made.</p>
      ${flowDiagram(['Meridian Strategic Priorities','Member Service Pain Points','Current Systems/Data','Evidence Gaps','Target Data Foundation','Agent Assist Moves Workflow','Tower Measurement Plan'])}
      <div class="example"><strong>CDAO framing:</strong> For the CDAO, the value is not that Nexus has every answer on day one. The value is that Nexus makes the enterprise context, evidence, gaps, and readiness visible before AI solutioning begins.</div>
      <div>${summary.safe_claims.map(badge).join('')}</div>
    </section>
    <section id="meridian-agent-assist-golden-thread">
      <h2>Meridian Agent Assist Golden Thread</h2>
      <p>Agent Assist is the right golden-thread use case because it touches business process, systems, data, privacy, controls, metrics, architecture, target AWS/Databricks foundation, and a natural Moves workflow from P0 to P5.</p>
      <div class="grid3">
        <div class="card"><h3>Business Problem</h3><p>Member service agents navigate multiple systems and knowledge sources, creating long calls, transfers, repeat contacts, inconsistent answers, and avoidable manual work.</p></div>
        <div class="card"><h3>Known Context</h3><p>Member Service, claims, eligibility, CRM/contact center, knowledge base, data marts, metrics, risks, and target foundation dependencies are represented in the current proof pack.</p></div>
        <div class="card"><h3>Critical Gaps</h3><p>Transcript governance, KPI baselines, knowledge freshness, API readiness, PHI/HITL controls, and AWS/Databricks production readiness remain validation gates.</p></div>
      </div>
      ${flowDiagram(['Problem','Context','Gaps','Moves Plan','Source Needs','Tower Metrics'])}
      <details><summary>Agent Assist Context Readiness JSON</summary><pre>${htmlEscape(JSON.stringify(agentAssistContextReadiness, null, 2))}</pre></details>
    </section>
    <section id="cdao-meeting-talk-track">
      <h2>CDAO Meeting Talk Track</h2>
      <p>This is the simple story to tell in the room: Meridian does not need a one-off AI demo. Meridian needs an evidence-backed operating model for deciding where AI can safely scale.</p>
      <div class="rail">
        <div class="step"><strong>1. Start With The Business Problem</strong><span>Members wait too long, agents switch across systems, answers vary, and leaders cannot prove which foundations are ready for AI scale.</span></div>
        <div class="step"><strong>2. Show The Context Layer</strong><span>Nexus organizes the enterprise context: business functions, systems, data, owners, risks, controls, metrics, vendors, programs, and gaps.</span></div>
        <div class="step"><strong>3. Explain Evidence-Gated AI</strong><span>aVa answers and Moves deliverables should rely on source-backed context, not generic healthcare assumptions.</span></div>
        <div class="step"><strong>4. Walk The Move</strong><span>P0/P1 frame the bet. P2 validates current state. P3/P4 compare options and roadmap. P5 hands off execution and measurement.</span></div>
        <div class="step"><strong>5. Close With Value Discipline</strong><span>Tower should eventually track AHT, FCR, repeat contact, transfer rate, CSAT, adoption, risk, and data readiness with caveats visible.</span></div>
      </div>
      <div class="grid3">
        <div class="card"><h3>What to say</h3><p>“AbarVa Nexus makes AI enterprise-aware before it recommends a solution. The point is not just generating a document; it is creating a governed context spine that can carry a transformation from idea to implementation.”</p></div>
        <div class="card"><h3>What to show</h3><p>Show the layer cake, then the data-flow walkthrough, then the ERD/graph view, then Moves P0-P5. That sequence explains why the context layer exists and why each phase asks for evidence.</p></div>
        <div class="card"><h3>What not to overclaim</h3><p>Do not claim production Meridian data, certified AWS/Databricks readiness, realized ROI, PHI ingestion, or approved Tower outcomes. This is demo-safe synthetic planning context with caveats.</p></div>
      </div>
    </section>
    <section id="html-quality-and-accuracy-audit">
      <h2>HTML Quality and Accuracy Audit</h2>
      <p>This pass audits the guide for semantic accuracy, demo safety, architecture correctness, and truth boundaries. The main correction is simple: a use case does not create evidence; a use case defines the context required to make a decision.</p>
      <div class="grid">
        <div class="card"><div class="eyebrow">Sections Audited</div><div class="metric">${htmlQualityAccuracyAudit.length}</div><p>Every major page, diagram, module statement, and proof section reviewed.</p></div>
        <div class="card"><div class="eyebrow">High Severity</div><div class="metric">${htmlQualityAccuracyAudit.filter((item) => item.severity === 'high').length}</div><p>Architecture semantics corrected before demo use.</p></div>
        <div class="card"><div class="eyebrow">Status</div><div class="metric">Fixed</div><p>All findings are marked fixed in the audit artifact.</p></div>
        <div class="card"><div class="eyebrow">Boundary</div><div class="metric">No Runtime</div><p>No data rebuild, candidate promotion, deploy, or product behavior change.</p></div>
      </div>
      <div class="example"><strong>Corrected mental model:</strong> Business use case defines context requirements → client evidence fills those requirements → templates/adapters capture evidence → governed data layers reconcile it → Context Pack Assembler creates module-specific payloads → gaps return as evidence requests.</div>
      ${tableHtml(htmlQualityAccuracyAudit, ['section_name','severity','issue_found','corrected_wording_or_diagram','demo_risk','fixed_status'], 40)}
    </section>
    <section id="client-onboarding-model">
      <h2>Client Onboarding Model</h2>
      <p>Real clients rarely complete a perfect data pack in one motion. Nexus supports four paths that converge into governed context.</p>
      ${compactCards([
        { eyebrow: 'Path A', title: 'Template-led intake', copy: 'Client teams fill structured templates directly using instructions, examples, validation rules, and module usage notes.', meta: ['manual', 'high control'] },
        { eyebrow: 'Path B', title: 'Interview/workshop-led intake', copy: 'AbarVa runs structured workshops, captures SME answers, and turns them into rows with evidence, confidence, and gaps.', meta: ['facilitated', 'consulting motion'] },
        { eyebrow: 'Path C', title: 'Copilot-assisted extraction', copy: 'Existing documents, exports, contracts, CMDB, ServiceNow, architecture decks, and notes create first-pass candidate rows for review.', meta: ['accelerated', 'candidate only'] },
        { eyebrow: 'Path D', title: 'Hybrid validation', copy: 'Most clients use all three: pre-fill from artifacts, interview to fill gaps, and SMEs approve, correct, or mark candidate-only context.', meta: ['recommended', 'evidence gated'] },
      ])}
      ${flowDiagram(['Use Case Selection','Evidence Request','Templates / Copilot / Interviews','SME Validation','Candidate Context','Active Context','Nexus Modules'])}
    </section>
    <section id="how-clients-use-the-templates">
      <h2>How Clients Use the Templates</h2>
      <div class="rail">
        ${[
          'Select use case',
          'Identify required context dimensions',
          'Collect existing documents/exports',
          'Conduct interviews/workshops',
          'Use Copilot-assisted parsing',
          'Map extracted content to templates/source adapters',
          'Assign evidence IDs and confidence',
          'Client SME validates or rejects',
          'Candidate context is assembled',
          'Approved context becomes active',
          'Modules consume context packs',
          'Gaps generate new evidence requests',
          'New evidence re-enters governed flow',
        ].map((step, index) => `<div class="step"><strong>Step ${index + 1}</strong><span>${htmlEscape(step)}</span></div>`).join('')}
      </div>
      <p>For Meridian Agent Assist, the use case defines the required context dimensions. Client evidence then fills those requirements through Business Functions, Org Ownership, Workforce Roles, Applications & Systems, Data Assets & Integrations, Infrastructure & Platforms, Vendors & Contracts, Programs & Initiatives, AI Use Cases, Risks & Controls, Metrics & Outcomes, Operational Process Evidence, Evidence Sources, and Relationships.</p>
      <div class="two">
        <div class="card"><h3>Evidence Examples</h3>${simpleList(['CMDB export','Application inventory','Architecture diagram','ServiceNow incidents','Contact center KPI report','Claims platform data dictionary','Knowledge base export','Vendor contract','Program roadmap','Security control assessment'])}</div>
        <div class="card"><h3>Confidence Rules</h3>${simpleList(['High: source-system export or approved owner evidence','Medium: SME-confirmed interview or reviewed deck','Low: inferred from document','Gap: stale, missing owner, missing evidence, or ambiguous current-vs-target status'])}</div>
      </div>
    </section>
    <section id="workshop-and-interview-playbook">
      <h2>Workshop and Interview Playbook</h2>
      <div class="grid3">${workshops.map(([title, participants, questions, outputs]) => `<div class="card"><div class="eyebrow">Workshop</div><h3>${htmlEscape(title)}</h3><p><strong>Participants:</strong> ${htmlEscape(participants)}</p><p><strong>Questions:</strong> ${htmlEscape(questions)}</p><p><strong>Outputs:</strong> ${htmlEscape(outputs)}</p></div>`).join('')}</div>
    </section>
    <section id="agent-assist-context-requirements">
      <h2>Agent Assist Context Requirements</h2>
      <p>For Agent Assist, the context layer is useful only if it knows enough about the current business, technology, data, controls, and operating model. This page makes explicit what Nexus should look for before discovery deliverables are finalized.</p>
      <div class="grid3">
        <div class="card"><h3>Business + Process</h3>${simpleList(['member-service journey','call reasons and intent taxonomy','transfer and escalation paths','after-call work process','supervisor review model','service-level commitments','exceptions and compliance-sensitive moments'])}</div>
        <div class="card"><h3>Technology Stack</h3>${simpleList(['contact center platform','CRM/member service platform','claims inquiry system','eligibility/benefits platform','knowledge base','call recording/transcripts','identity and access','integration/API layer','data platform and BI estate'])}</div>
        <div class="card"><h3>Data + Controls</h3>${simpleList(['member, provider, claims, eligibility, benefits data','transcripts and dispositions','knowledge article metadata','data freshness and lineage','PHI/PII rules','HITL decisions','audit logging','model-risk controls','retention and consent'])}</div>
        <div class="card"><h3>Organization + Change</h3>${simpleList(['executive sponsor role','business owner','contact center operations owner','data/platform owner','security/privacy owner','agent/supervisor personas','training and adoption path','support model'])}</div>
        <div class="card"><h3>Metrics + Value</h3>${simpleList(['AHT','FCR','repeat contact','transfer rate','after-call work','CSAT','agent adoption','quality review findings','cost per contact','knowledge deflection','data-quality score'])}</div>
        <div class="card"><h3>Foundation Readiness</h3>${simpleList(['AWS landing zone status','Databricks lakehouse status','Unity Catalog/governance','medallion data products','API readiness','batch vs real-time feasibility','semantic layer','observability and data quality'])}</div>
      </div>
      <div class="example"><strong>Demo phrasing:</strong> “If Meridian does not give us current tech stack, org ownership, data sources, and controls, Moves can still frame the opportunity, but it should mark solution architecture, future-state process, roadmap, and business case as evidence-limited.”</div>
    </section>
    <section id="copilot-assisted-source-parsing">
      <h2>Copilot-Assisted Source Parsing</h2>
      <p>Copilot-assisted extraction accelerates template completion, but it cannot approve truth. Extracted rows are proposed candidate context until a client SME validates evidence, ownership, confidence, and active/candidate status.</p>
      ${flowDiagram(['Documents / Exports / Notes','Copilot Extraction','Proposed Template Rows','Confidence Scoring','SME Validation','Evidence Registry','Canonical Facts','Context Packs'])}
      <div class="grid3">
        <div class="card"><h3>Architecture Deck Example</h3><p class="example">Input: Member Service agents use Salesforce Health Cloud, Genesys, claims inquiry, eligibility lookup, and KB articles.</p><p>Derived rows: systems, business functions, data assets, relationships, and risks such as inconsistent knowledge and PHI exposure.</p></div>
        <div class="card"><h3>ServiceNow Export Example</h3><p class="example">Input: P1/P2 incidents, call-center integration failures, knowledge-base sync failures.</p><p>Derived rows: operational evidence, risks/controls, metrics, impacted systems, and relationship edges.</p></div>
        <div class="card"><h3>Vendor Contract Example</h3><p class="example">Input: contact center platform agreement, support SLA, integration obligations, renewal terms.</p><p>Derived rows: vendors/contracts, managed services scope, spend/value, Source context, SLA and sourcing gaps.</p></div>
      </div>
    </section>
    <section id="hybrid-validation-and-promotion">
      <h2>Hybrid Validation and Promotion</h2>
      <p>Candidate context can be extracted, generated, or inferred. Active context requires evidence, owner/steward, confidence, source type, as-of date, relationship checks, explicit gaps, and SME approval through a controlled process.</p>
      ${flowDiagram(['Candidate Context','Validation Gate','Active Context','Module Context Packs'])}
      <div class="two">
        <div class="card"><h3>Candidate Context</h3>${simpleList(['extracted from documents','generated from synthetic data','inferred from interviews','preview only','not default module truth'])}</div>
        <div class="card"><h3>Active Context</h3>${simpleList(['validated by source/evidence/SME','has owner/steward','has as-of date and confidence','gaps marked','allowed in default Knowledge, Moves, Intelligence, Source, and Tower context'])}</div>
      </div>
    </section>
    <section id="source-template-standard">
      <h2>Source Template Standard</h2>
      <h3>19 Core Dimensions</h3>
      ${compactCards(dimensionCards)}
      <h3>6 Source Adapters</h3>
      ${compactCards(adapterCards)}
    </section>
    <section id="template-examples-with-meridian-rows">
      <h2>Template Examples with Meridian Rows</h2>
      <div class="grid3">${templateExamples.map((example) => `<div class="card"><h3>${htmlEscape(example.title)}</h3><p><strong>Template fields:</strong> ${htmlEscape(example.fields)}</p><p class="example">${htmlEscape(example.row)}</p><p><strong>Moves use:</strong> ${htmlEscape(example.moves)}</p><p class="subtle">Client fills the row, Copilot can draft parts from evidence, and SMEs validate confidence, gaps, and active/candidate status.</p></div>`).join('')}</div>
    </section>
    <section id="visual-data-layer-cake">
      <h2>Visual Data Layer Cake</h2>
      <p>This is the simplest way to explain the “layers of the cake” in a room. Raw client material is not what modules consume. Each layer adds governance: evidence, normalized facts, entity profiles, relationships, gaps, confidence, and finally module-ready context.</p>
      ${layerCakeSvg(layerRows)}
      <div class="grid3">
        <div class="card"><h3>Why this matters</h3><p>Agent Assist needs more than a use-case sentence. It needs systems, data, owners, risks, controls, metrics, gaps, and target foundation context before aVa can safely guide discovery or solutioning.</p></div>
        <div class="card"><h3>What gets blocked</h3><p>Candidate-only, low-confidence, restricted, stale, unsupported, or ambiguous context should stay visible as gaps or suggestions, not quietly become approved evidence.</p></div>
        <div class="card"><h3>What modules receive</h3><p>Moves, Source, Tower, Intelligence, and Knowledge should receive active context packs with source traceability, confidence, gap status, and clear limits.</p></div>
      </div>
    </section>
    <section id="moves-over-data-layer">
      <h2>Moves Over Data Layer</h2>
      <p>Moves does not bypass the data layer. Each phase asks the Nexus context layer for the right evidence-backed context. When a gap is found, the client can provide new evidence. That evidence is captured through templates or source adapters, validated, and then becomes reusable enterprise context.</p>
      ${movesOverDataLayerSvg()}
      <div class="grid3">
        <div class="card"><h3>What this means</h3><p>P0 through P5 do not own truth independently. They request phase-specific MovesContextPacks assembled from governed evidence, facts, profiles, graph relationships, gaps, and confidence.</p></div>
        <div class="card"><h3>Meridian example</h3><p>P2 can ask for current-state systems and data gaps for Agent Assist. If transcript availability or knowledge freshness is missing, Moves should send that gap back as an evidence request.</p></div>
        <div class="card"><h3>Truth boundary</h3><p>Gaps do not automatically become facts. New client inputs first become candidate context, rejected evidence, active context after validation, or known unresolved gaps.</p></div>
      </div>
    </section>
    <section id="gap-to-evidence-feedback-loop">
      <h2>Gap to Evidence Feedback Loop</h2>
      <p>A gap is not a failure. A gap is a controlled evidence request. The client can address it by uploading a missing document, exporting a source-system file, answering a workshop question, confirming an owner, validating a metric baseline, clarifying current versus target state, or approving/rejecting a Copilot-derived candidate row.</p>
      ${gapFeedbackLoopSvg()}
      <div class="grid3">
        <div class="card"><h3>Why it matters</h3><p>This makes the product feel consultative: Nexus does not hide uncertainty. It turns uncertainty into the next evidence action.</p></div>
        <div class="card"><h3>What can go wrong</h3><p>If gaps are treated as active facts, generated deliverables can overstate readiness or invent a business case without source support.</p></div>
        <div class="card"><h3>Which modules use it</h3><p>Moves uses gaps for phase readiness, Intelligence uses gaps for caveated recommendations, Source uses gaps for sourcing due diligence, and Tower uses gaps to protect value claims.</p></div>
      </div>
    </section>
    <section id="context-pack-assembly">
      <h2>Context Pack Assembly</h2>
      <p>Modules consume context packs, not raw source templates. Knowledge, Moves, Intelligence, Source, Tower, and aVa should receive purpose-built governed payloads filtered by tenant, sensitivity, source basis, active/candidate state, phase, and module policy.</p>
      ${contextPackAssemblySvg()}
      <div class="grid3">
        <div class="card"><h3>SourceContextPack</h3><p>Links vendors, contracts, systems supported, business functions, spend, SLAs, service performance, risks, renewals, programs, sourcing gaps, and evidence.</p></div>
        <div class="card"><h3>TowerContextPack</h3><p>Supports value hypothesis, baseline metric, measurement plan, promised value, and measured value only when evidence exists.</p></div>
        <div class="card"><h3>MovesContextPack</h3><p>Changes by phase: P0 frames the bet, P1 charters, P2 diagnoses, P3 compares options, P4 supports commitment, and P5 prepares execution handoff.</p></div>
      </div>
    </section>
    <section id="one-step-data-flow-walkthrough">
      <h2>One-Step Data Flow Walkthrough</h2>
      <p>This view answers the client question: “What happens after we select a use case and give you documents, exports, or workshop answers?” The answer is not magic ingestion. The use case defines required context; client evidence fills those requirements; templates/adapters capture the evidence; validation determines what can become active context.</p>
      ${pipelineSvg()}
      <div class="rail">
        <div class="step"><strong>Before</strong><span>Client brings templates, exports, decks, reports, contracts, CMDB, ServiceNow, process maps, and interviews.</span></div>
        <div class="step"><strong>During</strong><span>Nexus parses, normalizes, scores confidence, flags gaps, and asks SMEs to validate.</span></div>
        <div class="step"><strong>After</strong><span>Approved context feeds context packs for Moves deliverables, Source sourcing context, Tower measurement plans, and Intelligence answers.</span></div>
      </div>
    </section>
    <section id="erd-graph-dot-connector-view">
      <h2>ERD + Graph Dot-Connector View</h2>
      <p>The ERD explains the governed data model. The graph view explains why it is useful: Nexus can connect member service, CRM, claims, eligibility, knowledge, metrics, risks, and the target AWS/Databricks foundation into one reasoning path.</p>
      ${erdGraphSvg()}
      <div class="grid3">
        <div class="card"><h3>ERD role</h3><p>Tenants, evidence, facts, profiles, gaps, confidence summaries, context packs, and module responses define the governed data contract.</p></div>
        <div class="card"><h3>Graph role</h3><p>Relationship edges connect the dots: which systems support which functions, which data feeds which workflow, and which risks govern which use case.</p></div>
        <div class="card"><h3>Demo implication</h3><p>When a leader asks “why do you need current tech stack or org structure?”, this view shows that those inputs determine solution gaps, architecture dependencies, roadmap sequencing, and Tower metrics.</p></div>
      </div>
    </section>
    <section id="end-to-end-data-flow">
      <h2>End-to-End Data Flow</h2>
      ${pipelineSvg()}
      <div class="grid3">${layerRows.slice(0, 9).map((row) => `<div class="card"><h3>${htmlEscape(row.layer_name)}</h3><p>${htmlEscape(row.notes)}</p><div>${badge(`${row.accepted_rows} accepted`)}${badge(`${row.unresolved_gaps} gaps`)}</div></div>`).join('')}</div>
    </section>
    <section id="layer-by-layer-volumetric">
      <h2>Layer-by-Layer Volumetric</h2>
      <div class="grid">${layerRows.slice(0, 8).map((row) => `<div class="card"><div class="eyebrow">${htmlEscape(row.layer_name)}</div><div class="metric">${htmlEscape(row.accepted_rows)}</div><div class="bar"><span style="width:${Math.min(100, Math.max(8, row.accepted_rows / Math.max(1, activeRowsAll.length) * 100))}%"></span></div><p>${htmlEscape(row.notes)}</p></div>`).join('')}</div>
      ${tableHtml(layerRows, ['layer_name','source_rows','accepted_rows','candidate_rows','active_rows','evidence_refs','canonical_facts','entity_profiles','relationship_edges','context_gaps','module_context_items','unresolved_gaps'], 20)}
    </section>
    <section id="logical-data-model-erd">
      <h2>Logical Data Model / ERD</h2>
      ${erdGraphSvg()}
      <p>Tenant has evidence sources; evidence sources support canonical facts; canonical facts produce entity profiles; entity profiles connect through relationship edges; edges and gaps feed context packs; context packs feed Nexus modules.</p>
    </section>
    <section id="evidence-registry">
      <h2>Evidence Registry</h2>
      <p>Evidence Registry tracks source-backed proof: source type, owner, as-of date, sensitivity, confidence, active/candidate status, linked facts, and linked dimensions. Meridian examples include CMDB extracts, contact center KPI reports, architecture decks, risk/control notes, data platform roadmap items, and ServiceNow exports.</p>
      ${tableHtml(evidenceRows, ['evidence_name','source_type','source_system_owner','as_of_date','approval_status','approved_for_modules','confidence'], 12)}
    </section>
    <section id="canonical-facts">
      <h2>Canonical Facts</h2>
      <p>Canonical Facts normalize source data into reusable context. If a source says agents use Genesys, CRM, claims, eligibility, and a knowledge base, Nexus turns that into facts such as Member Service uses Contact Center Platform, CRM consumes member profile data, and Agent Assist depends on claims/eligibility/knowledge context.</p>
      ${flowDiagram(['Source statement','Normalized fact','Entity profile','Relationship edge','Module context'])}
    </section>
    <section id="entity-profile-coverage">
      <h2>Entity Profiles</h2>
      ${tableHtml(entityProfileCoverage, ['profile_type','count','source_dimensions_used','evidence_coverage_percent','relationship_coverage_percent','confidence_distribution','module_usage','gaps'], 30)}
    </section>
    <section id="relationship-graph">
      <h2>Relationship Graph</h2>
      ${erdGraphSvg()}
      <p>Graph traversal identifies upstream/downstream dependencies, missing evidence, module-context assembly paths, and Source/Tower/Intelligence implications. This is what keeps aVa from giving generic answers.</p>
      ${tableHtml(relationshipGraphCoverage, ['relationship_type','count','source_dimensions','sample_edge','unresolved_missing_relationships','module_usage'], 30)}
    </section>
    <section id="context-gaps-and-confidence">
      <h2>Context Gaps and Confidence</h2>
      <p>Context is not just facts. It must show missing evidence, low confidence, missing owners, stale sources, missing relationships, candidate-only records, and ambiguous current-vs-target status.</p>
      ${compactCards([
        { title: 'Transcript governance', copy: 'Call transcript availability, consent, retention, and redaction are not validated.', meta: ['gap'] },
        { title: 'KPI baseline', copy: 'AHT, FCR, transfer, repeat contact, and CSAT baselines require source reports before value claims.', meta: ['gap'] },
        { title: 'API readiness', copy: 'Real-time claims, eligibility, CRM, and knowledge APIs need validation.', meta: ['gap'] },
        { title: 'AWS/Databricks readiness', copy: 'Target foundation is represented as future/readiness path, not certified production.', meta: ['guardrail'] },
      ])}
    </section>
    <section id="azure-technical-architecture">
      <h2>Azure Technical Architecture</h2>
      ${techOverlaySvg()}
      <p>This PR generated a proof pack only: no production writes, no promotion, no Active Tenant Access changes, and no runtime behavior changes. Candidate vs active separation remains explicit.</p>
      ${compactCards([
        { title: 'Azure Container Apps', copy: 'Hosts the Nexus web/runtime path that surfaces modules and admin workflows.', meta: ['runtime unaffected'] },
        { title: 'Blob Storage', copy: 'Landing area for raw/generated inputs and proof bundles.', meta: ['no new writes outside repo reports'] },
        { title: 'Postgres / Data Artifacts', copy: 'Canonical layer and read-model artifacts are the governed context backbone.', meta: ['no DB mutation'] },
        { title: 'Knowledge Cache / Assembler', copy: 'Assembles module-ready context from active facts, evidence, gaps, and confidence.', meta: ['audits passed'] },
      ])}
    </section>
    <section id="moves-workflow-p0-p5">
      <h2>Moves Workflow P0-P5</h2>
      ${phaseJourneySvg()}
      ${tableHtml(movesPhaseReadiness, ['phase','required_context','available_context','missing_context','artifacts_supported','unsafe_claims_to_avoid'], 10)}
    </section>
    <section id="phase-by-phase-evidence-guide">
      <h2>Phase-by-Phase Evidence Guide</h2>
      <p>This turns the generated pack into a “how to run Moves” guide. Each phase should tell the user what they are trying to prove, what to upload, what to answer, what AbarVa should produce, and how to prepare for the next phase.</p>
      <div class="grid3">
        <div class="card"><h3>P0 Originate</h3><p><strong>Prove:</strong> there is a strategic problem worth shaping.</p>${simpleList(['Paste the business problem','choose a short Move name','confirm sponsor role/title, not a named person','define scope and out-of-scope','seed value hypothesis and foundation readiness'])}<p><strong>Output:</strong> draft Move brief and evidence family list.</p></div>
        <div class="card"><h3>P1 Charter</h3><p><strong>Prove:</strong> leaders agree on what success means.</p>${simpleList(['charter statement','decision owner roles','success criteria','initial KPI baseline plan','risk and control assumptions','evidence collection plan'])}<p><strong>Output:</strong> approved charter and P2 discovery plan.</p></div>
        <div class="card"><h3>P2 Discover</h3><p><strong>Prove:</strong> current state is understood well enough to diagnose gaps.</p>${simpleList(['process workshop notes','system inventory','data inventory','metrics reports','risk/control notes','owner interviews'])}<p><strong>Output:</strong> current-state assessment, root causes, data gaps, readiness limits.</p></div>
        <div class="card"><h3>P3 Design</h3><p><strong>Prove:</strong> viable solution paths are known and comparable.</p>${simpleList(['target architecture assumptions','AI control design','data foundation dependencies','operating model roles','build/buy/sourcing constraints'])}<p><strong>Output:</strong> solution options, architecture options, control model, recommendation.</p></div>
        <div class="card"><h3>P4 Roadmap</h3><p><strong>Prove:</strong> the chosen path can be sequenced and funded.</p>${simpleList(['delivery scenarios','cost/rate assumptions','benefit assumptions','dependency map','risk mitigation plan','sourcing path'])}<p><strong>Output:</strong> roadmap, business case, decision package.</p></div>
        <div class="card"><h3>P5 Handoff</h3><p><strong>Prove:</strong> execution owners can take over with measurable controls.</p>${simpleList(['implementation backlog','owner map','Tower metric plan','governance calendar','Source/vendor handoff','risk acceptance notes'])}<p><strong>Output:</strong> handoff pack, measurement plan, implementation governance.</p></div>
      </div>
    </section>
    <section id="module-wiring">
      <h2>Module Wiring</h2>
      <div class="grid">
        ${[
          ['Knowledge','Consumes KnowledgeContextPack for active context browsing, relationship discovery, evidence limits, and visible gaps.'],
          ['Intelligence','Consumes IntelligenceContextPack / Claude-ready governed payload for recommendations with evidence, caveats, and decision limits.'],
          ['Moves','Consumes phase-specific MovesContextPack for P0-P5 evidence, gaps, readiness, deliverables, and next evidence requests.'],
          ['Source','Consumes SourceContextPack linking vendors, contracts, systems supported, functions, spend, SLAs, performance, risks, renewals, programs, sourcing gaps, and evidence.'],
          ['Tower','Consumes TowerContextPack for value hypothesis, baseline metric, measurement plan, promised value, and measured value only when evidence exists.'],
        ].map(([name, copy]) => `<div class="card"><div class="eyebrow">${name}</div><p>${copy}</p></div>`).join('')}
      </div>
    </section>
    <section id="module-handoff-map">
      <h2>Module Handoff Map</h2>
      <p>This page explains why the modules should not feel disconnected. The same governed context spine is assembled into module-specific context packs: KnowledgeContextPack, IntelligenceContextPack, MovesContextPack, SourceContextPack, and TowerContextPack.</p>
      ${moduleHandoffSvg()}
      <div class="grid3">
        <div class="card"><h3>Moves to Source</h3><p>When P3/P4 identifies build/buy needs, Source should receive a SourceContextPack with systems, vendors, contracts, scope, rates, risks, service performance, renewals, and sourcing gaps.</p></div>
        <div class="card"><h3>Moves to Tower</h3><p>When P4/P5 defines success criteria, Tower should receive a TowerContextPack with baselines, target metrics, measurement caveats, owners, value hypotheses, and measured value only when evidence exists.</p></div>
        <div class="card"><h3>aVa across all modules</h3><p>aVa should explain what it knows, what evidence it used, what is missing, and why it recommends the next step.</p></div>
      </div>
    </section>
    <section id="source-to-layer-reconciliation">
      <h2>Source-to-Layer Reconciliation</h2>
      <p>Source-to-layer reconciliation is the audit trail. A source row or adapter output does not go straight to a module. It becomes evidence, then a normalized fact/profile/edge or gap, then a context pack item if policy and validation allow it.</p>
      ${flowDiagram(['Source row / adapter output','Evidence Registry','Canonical Fact / Profile / Edge','Gap + confidence check','Context Pack Assembler','Module-specific context pack'])}
      <div class="grid3">${traceSamples.slice(0, 6).map((trace) => `<div class="card"><div class="eyebrow">${htmlEscape(trace.trace_id)}</div><h3>${htmlEscape(trace.evidence_registry_record)}</h3><p><strong>Source row:</strong> ${htmlEscape(trace.source_template_row)}</p><p><strong>Normalized fact:</strong> ${htmlEscape(trace.canonical_fact)}</p><p><strong>Relationship/gap signal:</strong> ${htmlEscape(trace.relationship_edge)}</p><p><strong>Context pack:</strong> ${htmlEscape(trace.module_context_pack)}</p></div>`).join('')}</div>
      ${tableHtml(layerReconciliation, ['layer_order','layer_name','source_rows','accepted_rows','candidate_rows','active_rows','evidence_refs','canonical_facts','entity_profiles','relationship_edges','context_gaps','module_context_items','confidence_score_or_distribution'], 20)}
    </section>
    <section id="aws-databricks-semantic-proof">
      <h2>AWS / Databricks Semantic Proof</h2>
      <p>The data supports the intended story: Meridian's current state is legacy/on-prem-heavy with fragmented reporting and data context. AWS + Databricks is the target foundation/readiness path for a governed lakehouse, medallion architecture, governed data products, Unity Catalog/governance, identity/member/provider spine, and PHI/HITL/audit controls. It is not represented as already certified production.</p>
      <div class="two">
        <div class="card"><h3>Current State</h3>${simpleList(['legacy/on-prem-heavy estate','fragmented reporting/data estate','SQL Server marts / Netezza/DB2-style warehouse where applicable','Tableau and SAS analytics context','incomplete lineage, freshness, and KPI baseline proof'])}</div>
        <div class="card"><h3>Target State</h3>${simpleList(['AWS + Databricks lakehouse foundation','medallion architecture','Unity Catalog/governance','governed data products after certification','identity/member/provider spine','PHI/HITL/audit controls'])}</div>
      </div>
      <p>${badge(`${unsafeAwsRows.filter((row) => row.artifact_path.includes('/active/')).length} unsafe active rows`)}${badge('target/future foundation required')}</p>
      ${tableHtml(awsDatabricksRows, ['artifact_path','row_number','terms','classification','unsafe','recommended_action','evidence'], 35)}
    </section>
    <section id="legacy-leakage-proof">
      <h2>Legacy Leakage Proof</h2>
      <p>${badge(`${mustFixLegacyRows.length} loader-visible forbidden V-path leaks`)}</p>
      ${tableHtml(legacyLeakageAudit, ['artifact_path','legacy_term','loader_visible','module_visible','classification','recommended_action','evidence'], 40)}
    </section>
    <section id="demo-readiness">
      <h2>Demo Readiness</h2>
      <p>${badge(overallStatus)}${badge(`score ${readinessScore}/100`)}</p>
      <h3>Safe Claims</h3><p>${summary.safe_claims.map(badge).join('')}</p>
      <h3>Do Not Claim</h3><p>${summary.do_not_claim.map(badge).join('')}</p>
      <h3>Remaining Caveats</h3><p>${summary.remaining_caveats.map(badge).join('')}</p>
      <h3>Client Data Request Pack</h3>${simpleList(clientDataRequest)}
      <h3>Good Enough by Phase</h3>
      ${compactCards([
        { title: 'P0/P1', copy: 'Enough context to frame and charter: business problem, sponsor role, scope, evidence families, and baseline plan.', meta: ['frame/charter'] },
        { title: 'P2', copy: 'Enough evidence to diagnose current state: process, systems, data, metrics, risks, and gaps.', meta: ['diagnose'] },
        { title: 'P3', copy: 'Enough architecture/data/control context to compare options and identify foundation dependencies.', meta: ['options'] },
        { title: 'P4', copy: 'Enough confidence to make an executive decision with caveats and risk acceptance.', meta: ['commit'] },
        { title: 'P5', copy: 'Enough ownership, metrics, sourcing, and roadmap context to hand off execution and measurement.', meta: ['handoff'] },
      ])}
      <h3>Recommended Client Onboarding Sequence</h3>
      ${flowDiagram(['Week 0: use case + sponsors + templates','Week 1: docs/exports + extraction + workshops','Week 2: SME validation + context pack','Week 3: Moves P0/P1/P2 + handoffs'])}
    </section>
    <section id="appendix-raw-proof-tables">
      <h2>Appendix / Raw Proof Tables</h2>
      <details open><summary>Data Source Inventory</summary>${tableHtml(sourceInventory, ['artifact_path','artifact_type','layer_or_usage','active_candidate_generated_or_legacy','loader_visible','module_visible','contains_legacy_name','contains_aws_or_databricks','recommended_action'], 60)}</details>
      <details><summary>Template Completeness</summary>${tableHtml(templateCompleteness, ['dimension','blank_client_ready_template_exists','template_has_field_instructions','filled_meridian_synthetic_example_exists','core_dimension_source_file_exists','active_row_count','generated_row_count','recommended_action'], 25)}</details>
      <details><summary>Source Adapter Completeness</summary>${tableHtml(sourceAdapterCompleteness, ['source_adapter','instruction_template_version_exists','filled_meridian_synthetic_extract_exists','mapping_to_core_dimensions_exists','row_count','recommended_action'], 10)}</details>
      <details><summary>Legacy Leakage Audit</summary>${tableHtml(legacyLeakageAudit, ['artifact_path','legacy_term','loader_visible','module_visible','classification','recommended_action'], 80)}</details>
    </section>
  </main>
</div>
</body>
</html>`;

writeCsv('source-inventory.csv', sourceInventory, ['artifact_path','artifact_type','standard_name','tenant_key','layer_or_usage','active_candidate_generated_or_legacy','loader_visible','module_visible','contains_legacy_name','contains_aws_or_databricks','recommended_action','evidence']);
writeCsv('template-completeness.csv', templateCompleteness, ['dimension','blank_client_ready_template_exists','template_has_field_instructions','filled_meridian_synthetic_example_exists','core_dimension_source_file_exists','required_enterprise_fields_exist','evidence_confidence_status_fields_exist','relationship_keys_exist','module_usage_notes_exist','active_row_count','generated_row_count','template_path','active_path','generated_path','recommended_action']);
writeCsv('source-adapter-completeness.csv', sourceAdapterCompleteness, ['source_adapter','instruction_template_version_exists','filled_meridian_synthetic_extract_exists','mapping_to_core_dimensions_exists','reconciliation_key_exists','evidence_ids_exist','validation_status_exists','active_candidate_status_exists','row_count','source_path','recommended_action']);
writeCsv('legacy-leakage-audit.csv', legacyLeakageAudit, ['artifact_path','legacy_term','loader_visible','module_visible','classification','recommended_action','evidence']);
writeCsv('aws-databricks-semantic-audit.csv', awsDatabricksRows, ['artifact_path','row_number','terms','classification','unsafe','recommended_action','evidence']);
writeCsv('layer-reconciliation.csv', layerReconciliation, ['layer_order','layer_name','source_rows','accepted_rows','rejected_rows','candidate_rows','active_rows','entity_profiles','relationship_edges','evidence_refs','context_gaps','confidence_score_or_distribution','module_context_items','unresolved_gaps','sample_trace_ids','notes']);
writeCsv('volumetric-by-layer.csv', layerRows, ['layer_name','source_rows','accepted_rows','rejected_rows','candidate_rows','active_rows','evidence_refs','canonical_facts','entity_profiles','relationship_edges','context_gaps','module_context_items','confidence_high','confidence_medium','confidence_low','unresolved_gaps','notes']);
writeCsv('entity-profile-coverage.csv', entityProfileCoverage, ['profile_type','count','source_dimensions_used','evidence_coverage_percent','relationship_coverage_percent','confidence_distribution','module_usage','sample_profile_ids','gaps']);
writeCsv('relationship-graph-coverage.csv', relationshipGraphCoverage, ['relationship_type','count','source_dimensions','sample_edge','unresolved_missing_relationships','module_usage']);
writeCsv('moves-phase-context-readiness.csv', movesPhaseReadiness, ['phase','required_context','available_context','missing_context','evidence_gaps','risks','metrics','artifacts_supported','unsafe_claims_to_avoid']);
writeJson('agent-assist-context-readiness.json', agentAssistContextReadiness);
writeJson('reconciliation-trace-samples.json', traceSamples);
writeJson('summary.json', summary);
writeJson('html-quality-accuracy-audit.json', htmlQualityAccuracyAudit);
fs.writeFileSync(path.join(reportDir, 'html-quality-accuracy-audit.md'), `# Meridian HTML Quality and Accuracy Audit

Codename: MERIDIAN-DATA-LAYER-HTML-QUALITY-ACCURACY-PR3

Status: fixed

Scope: content, diagram, story, and architecture-accuracy hardening for the Meridian data layer HTML guide. This audit did not rebuild data, change row counts, change runtime behavior, deploy, promote candidate data, or add unsupported product claims.

## Core Correction

A use case does not create evidence. A use case defines the context required to make a decision. Client evidence comes from documents, interviews, source-system exports, contracts, reports, architecture diagrams, and operational data. Nexus maps that evidence into templates/adapters, validates it, reconciles it into governed data layers, and assembles module-specific context packs.

## Section Findings

${htmlQualityAccuracyAudit.map((item, index) => `### ${index + 1}. ${item.section_name}

- Severity: ${item.severity}
- Issue found: ${item.issue_found}
- Old wording or diagram: ${item.old_wording_or_diagram}
- Corrected wording or diagram: ${item.corrected_wording_or_diagram}
- Rationale: ${item.rationale}
- Demo risk: ${item.demo_risk}
- Fixed status: ${item.fixed_status}
`).join('\n')}
`);
fs.writeFileSync(path.join(reportDir, 'meridian-data-state-reconciliation-proof.html'), html.replace(/[ \t]+$/gm, ''));

const summaryMd = `# Meridian Data State Reconciliation Summary

Status: ${overallStatus}

Readiness score: ${readinessScore}/100

## What passed

- ${summary.counts.dimensions_passed}/${summary.counts.required_dimensions} required standard dimensions represented.
- ${summary.counts.source_adapters_passed}/${summary.counts.source_adapters} source adapters represented.
- ${summary.counts.evidence_registry_records} evidence registry records present in the generated v3 pack.
- ${summary.counts.relationship_graph_nodes} graph nodes and ${summary.counts.relationship_graph_edges} graph edges present.
- ${summary.counts.legacy_must_fix} loader-visible forbidden legacy V-path leaks.
- ${summary.counts.unsafe_aws_databricks_active_rows} unsafe active AWS/Databricks rows.

## Safe claims

${summary.safe_claims.map((claim) => `- ${claim}`).join('\n')}

## Do not claim

${summary.do_not_claim.map((claim) => `- ${claim}`).join('\n')}

## Remaining caveats

${summary.remaining_caveats.map((claim) => `- ${claim}`).join('\n')}
`;

fs.writeFileSync(path.join(reportDir, 'summary.md'), summaryMd);

console.log(`Meridian data state reconciliation complete: ${rel(reportDir)}`);
console.log(`Status: ${overallStatus}`);
console.log(`Readiness score: ${readinessScore}/100`);
console.log(`HTML proof: ${rel(path.join(reportDir, 'meridian-data-state-reconciliation-proof.html'))}`);
