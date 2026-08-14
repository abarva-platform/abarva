#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

const ROOT = process.cwd();
const DEFAULT_OUT = 'reports/graph-reconciliation-2026-08';
const REGISTRY = 'datasets/tenant-inputs/tenant-input-registry.json';
const RELATIONSHIP_FILE = '12_relationships.csv';
const NOT_ACTIVE =
  'graph_reconciliation_quarantine_first_report_only_no_db_write_no_graph_materialization_no_product_use';

const legacyCompatibilityProfiles = new Set([
  'applications-systems-estate/v1',
  'enterprise-profile-foundation/v1',
  'enterprise-profile-minimal/v1',
  'evidence-registry-minimal/v1',
]);

const profileContractFiles = {
  'enterprise-profile-v3/v1': '00_enterprise_profile.csv',
  'organization-business-functions/v1': '01_business_functions.csv',
  'organization-ownership/v1': '02_org_ownership.csv',
  'organization-workforce-roles/v1': '03_workforce_roles.csv',
  'applications-systems-v3/v1': '04_applications_systems.csv',
  'data-assets-integrations/v1': '05_data_assets_integrations.csv',
  'infrastructure-platforms/v1': '06_infrastructure_platforms.csv',
  'vendor-contracts/v1': '07_vendors_contracts.csv',
  'spend-value/v1': '08_spend_value.csv',
  'programs-initiatives/v1': '09_programs_initiatives.csv',
  'ai-automation-use-cases/v1': '10_ai_automation_use_cases.csv',
  'risks-controls/v1': '11_risks_controls.csv',
  'evidence-sources-v3/v1': '13_evidence_sources.csv',
  'metrics-outcomes/v1': '14_metrics_outcomes.csv',
  'industry-context-patterns/v1': '15_industry_context_patterns.csv',
  'expert-lenses/v1': '16_expert_lenses.csv',
  'managed-services-scope/v1': '17_service_scope_managed_services.csv',
  'operational-process-evidence/v1': '18_operational_process_evidence.csv',
};

const endpointObjectTypeAliases = {
  ai_candidate: 'ai_use_case',
  ai_use_case: 'ai_use_case',
  application: 'application_system',
  application_system: 'application_system',
  business_function: 'business_function',
  contract: 'vendor_contract',
  control: 'risk_control',
  corporate_shared_system: 'application_system',
  data_asset: 'data_asset',
  data_domain: 'data_asset',
  dependency: 'program_initiative',
  expert_lens: 'expert_lens',
  function: 'business_function',
  holding_company: 'enterprise_profile',
  infrastructure: 'infrastructure_platform',
  infrastructure_platform: 'infrastructure_platform',
  interview: 'evidence_source',
  leader: 'workforce_role',
  managed_service: 'managed_service_scope',
  metric: 'metric_outcome',
  org_unit: 'organization_unit',
  owner: 'workforce_role',
  platform: 'infrastructure_platform',
  portfolio_company: 'enterprise_profile',
  process: 'operational_process',
  program: 'program_initiative',
  program_initiative: 'program_initiative',
  risk: 'risk_control',
  risk_control: 'risk_control',
  risk_or_control: 'risk_control',
  role: 'workforce_role',
  system: 'application_system',
  tower_initiative: 'program_initiative',
  vendor: 'vendor_contract',
  vendor_contract: 'vendor_contract',
  workforce_role: 'workforce_role',
};

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function parseArgs(argv) {
  const args = { tenants: [], out: DEFAULT_OUT };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--tenant') {
      args.tenants.push(argv[index + 1]);
      index += 1;
    } else if (value === '--out') {
      args.out = argv[index + 1];
      index += 1;
    } else if (value === '--help') {
      console.log('Usage: node scripts/audit/tenant-graph-reconciliation.mjs [--tenant <key>|all] [--out <dir>]');
      process.exit(0);
    }
  }
  return args;
}

const abs = (relativePath) => path.resolve(ROOT, relativePath);

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  return {
    rows: parsed.data,
    fields: parsed.meta.fields ?? [],
    errors: parsed.errors,
    fingerprint: `sha256:${crypto.createHash('sha256').update(text).digest('hex')}`,
  };
}

function writeCsv(filePath, headers, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${body}\n`);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function slug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isBlank(value) {
  return slug(value).length === 0 || ['unknown', 'none', 'not-loaded', 'not-provided', 'tbd'].includes(slug(value));
}

function activeProfiles(profiles) {
  return profiles.filter((profile) => !legacyCompatibilityProfiles.has(profile.mappingProfile));
}

function objectTypeForEndpoint(rawObjectType) {
  return endpointObjectTypeAliases[slug(rawObjectType).replace(/-/g, '_')];
}

function ruleForTargetAttribute(profile, targetAttribute) {
  return profile.rules.find((rule) => rule.targetAttribute === targetAttribute);
}

function buildNodeIndex({ tenantKey, activeRoot, profiles, objectRegistry }) {
  const objectByType = new Map(objectRegistry.map((entry) => [entry.objectType, entry]));
  const nodes = [];
  const byObjectAndName = new Map();

  for (const profile of activeProfiles(profiles)) {
    const contractFile = profileContractFiles[profile.mappingProfile];
    if (!contractFile) continue;
    const sourcePath = path.join(abs(activeRoot), contractFile);
    if (!fs.existsSync(sourcePath)) continue;

    const objectType = profile.rules[0]?.targetObjectType;
    const definition = objectByType.get(objectType);
    if (!definition) continue;
    const parsed = readCsv(sourcePath);
    const identitySourceFields = definition.identityAttributes
      .map((attribute) => ruleForTargetAttribute(profile, attribute)?.sourceField)
      .filter(Boolean);
    if (identitySourceFields.length === 0) continue;

    parsed.rows.forEach((row, rowIndex) => {
      const identityValues = identitySourceFields.map((field) => row[field]).filter((value) => !isBlank(value));
      if (identityValues.length === 0) return;
      const displayName = identityValues.join(' / ');
      const nodeId = `${tenantKey}:${objectType}:${slug(displayName)}`;
      const node = {
        tenantKey,
        nodeId,
        objectType,
        objectFamily: definition.objectFamily,
        displayName,
        sourceFile: `${activeRoot}/${contractFile}`,
        sourceRowNumber: rowIndex + 2,
        mappingProfile: profile.mappingProfile,
        materialized: 'no',
      };
      nodes.push(node);
      byObjectAndName.set(nodeLookupKey(objectType, displayName), node);
    });
  }

  return { nodes, byObjectAndName };
}

function nodeLookupKey(objectType, name) {
  return `${objectType}:${slug(name)}`;
}

function evaluateRelationshipRow({ tenantKey, row, rowNumber, nodeIndex, normalizeRelationshipType }) {
  const reasons = [];
  if (row.tenant_key !== tenantKey) reasons.push('tenant-key-mismatch');
  for (const field of ['from_object_type', 'from_object_name', 'relationship_type', 'to_object_type', 'to_object_name']) {
    if (isBlank(row[field])) reasons.push(`missing-${field.replaceAll('_', '-')}`);
  }
  if (isBlank(row.evidence_basis) && isBlank(row.evidence_id) && isBlank(row.source_file)) {
    reasons.push('missing-evidence-basis');
  }

  const fromObjectType = objectTypeForEndpoint(row.from_object_type);
  const toObjectType = objectTypeForEndpoint(row.to_object_type);
  if (!fromObjectType && !isBlank(row.from_object_type)) reasons.push(`unknown-from-object-type:${row.from_object_type}`);
  if (!toObjectType && !isBlank(row.to_object_type)) reasons.push(`unknown-to-object-type:${row.to_object_type}`);

  const relationship = normalizeRelationshipType(row.relationship_type ?? '');
  if (!relationship && !isBlank(row.relationship_type)) reasons.push(`unknown-relationship-type:${row.relationship_type}`);

  const fromNode = fromObjectType ? nodeIndex.get(nodeLookupKey(fromObjectType, row.from_object_name)) : undefined;
  const toNode = toObjectType ? nodeIndex.get(nodeLookupKey(toObjectType, row.to_object_name)) : undefined;
  if (fromObjectType && !fromNode && !isBlank(row.from_object_name)) reasons.push('unresolved-from-node');
  if (toObjectType && !toNode && !isBlank(row.to_object_name)) reasons.push('unresolved-to-node');

  const relationshipId = row.record_id || `${tenantKey}:relationship:${rowNumber}`;
  const base = {
    tenantKey,
    relationshipId,
    sourceRowNumber: rowNumber,
    rawRelationshipType: row.relationship_type ?? '',
    normalizedRelationshipType: relationship?.relationshipType ?? '',
    fromObjectType: fromObjectType ?? '',
    fromObjectName: row.from_object_name ?? '',
    fromNodeId: fromNode?.nodeId ?? '',
    toObjectType: toObjectType ?? '',
    toObjectName: row.to_object_name ?? '',
    toNodeId: toNode?.nodeId ?? '',
    evidenceBasis: row.evidence_basis || row.evidence_id || row.source_file || '',
    confidence: row.confidence ?? '',
    knownGaps: row.known_gaps ?? '',
  };

  if (reasons.length > 0) {
    return {
      candidate: null,
      quarantine: {
        ...base,
        quarantineReasons: reasons.join('; '),
        disposition: 'quarantined-no-graph-materialization',
      },
    };
  }

  return {
    candidate: {
      ...base,
      disposition: 'candidate-only-no-graph-materialization',
    },
    quarantine: null,
  };
}

function summarizeQuarantineReasons(rows) {
  const counts = new Map();
  for (const row of rows) {
    for (const reason of String(row.quarantineReasons ?? '').split(/;\s*/)) {
      if (!reason) continue;
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([reason, count]) => ({ reason, count }));
}

async function loadContracts() {
  const mappingModule = await import('../../src/lib/enterprise-data/source-adapters/mapping-profiles.ts');
  const layer3Module = await import('../../src/lib/enterprise-data/contracts/layer3-validation.ts');
  return {
    profiles: mappingModule.BUILT_IN_MAPPING_PROFILES ?? [],
    objectRegistry: layer3Module.CANONICAL_OBJECT_REGISTRY ?? [],
    normalizeRelationshipType: layer3Module.normalizeRelationshipType,
  };
}

function readRegistry() {
  const registry = JSON.parse(fs.readFileSync(abs(REGISTRY), 'utf8'));
  return registry.activeTenants ?? [];
}

async function reconcileTenant({ tenant, outDir, contracts }) {
  const activeRoot = tenant.canonicalInputRoot;
  const nodeIndex = buildNodeIndex({
    tenantKey: tenant.tenantKey,
    activeRoot,
    profiles: contracts.profiles,
    objectRegistry: contracts.objectRegistry,
  });
  const relationshipPath = path.join(abs(activeRoot), RELATIONSHIP_FILE);
  const candidates = [];
  const quarantine = [];
  const parseErrors = [];
  let relationshipRows = 0;

  if (fs.existsSync(relationshipPath)) {
    const parsed = readCsv(relationshipPath);
    relationshipRows = parsed.rows.length;
    parseErrors.push(...parsed.errors.map((error) => error.message));
    parsed.rows.forEach((row, index) => {
      const result = evaluateRelationshipRow({
        tenantKey: tenant.tenantKey,
        row,
        rowNumber: index + 2,
        nodeIndex: nodeIndex.byObjectAndName,
        normalizeRelationshipType: contracts.normalizeRelationshipType,
      });
      if (result.candidate) candidates.push(result.candidate);
      if (result.quarantine) quarantine.push(result.quarantine);
    });
  } else {
    quarantine.push({
      tenantKey: tenant.tenantKey,
      relationshipId: `${tenant.tenantKey}:relationships-file`,
      sourceRowNumber: '',
      rawRelationshipType: '',
      normalizedRelationshipType: '',
      fromObjectType: '',
      fromObjectName: '',
      fromNodeId: '',
      toObjectType: '',
      toObjectName: '',
      toNodeId: '',
      evidenceBasis: '',
      confidence: '',
      knownGaps: '',
      quarantineReasons: 'relationships-file-absent',
      disposition: 'quarantined-no-graph-materialization',
    });
  }

  const summary = {
    tenantKey: tenant.tenantKey,
    activeRoot,
    mode: NOT_ACTIVE,
    nodeCandidatesIndexed: nodeIndex.nodes.length,
    relationshipRows,
    relationshipCandidates: candidates.length,
    quarantinedRelationships: quarantine.length,
    topQuarantineReasons: summarizeQuarantineReasons(quarantine).slice(0, 15),
    parseErrors,
    graphTablesWritten: false,
    productReadModelsUpdated: false,
  };

  const tenantDir = path.join(outDir, tenant.tenantKey);
  writeJson(path.join(tenantDir, 'graph-reconciliation-summary.json'), summary);
  writeCsv(path.join(tenantDir, 'graph-node-index.csv'), Object.keys(nodeIndex.nodes[0] ?? nodeHeaders()), nodeIndex.nodes);
  writeCsv(path.join(tenantDir, 'graph-edge-candidates.csv'), Object.keys(candidates[0] ?? edgeHeaders()), candidates);
  writeCsv(path.join(tenantDir, 'graph-quarantine.csv'), Object.keys(quarantine[0] ?? quarantineHeaders()), quarantine);

  return { summary, nodes: nodeIndex.nodes, candidates, quarantine };
}

function nodeHeaders() {
  return {
    tenantKey: '',
    nodeId: '',
    objectType: '',
    objectFamily: '',
    displayName: '',
    sourceFile: '',
    sourceRowNumber: '',
    mappingProfile: '',
    materialized: '',
  };
}

function edgeHeaders() {
  return {
    tenantKey: '',
    relationshipId: '',
    sourceRowNumber: '',
    rawRelationshipType: '',
    normalizedRelationshipType: '',
    fromObjectType: '',
    fromObjectName: '',
    fromNodeId: '',
    toObjectType: '',
    toObjectName: '',
    toNodeId: '',
    evidenceBasis: '',
    confidence: '',
    knownGaps: '',
    disposition: '',
  };
}

function quarantineHeaders() {
  return {
    ...edgeHeaders(),
    quarantineReasons: '',
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const tenants = readRegistry();
  const selected =
    args.tenants.length === 0 || args.tenants.includes('all')
      ? tenants
      : tenants.filter((tenant) => args.tenants.includes(tenant.tenantKey));
  if (selected.length === 0) throw new Error(`No registry-declared active tenants matched: ${args.tenants.join(', ')}`);

  const outDir = abs(args.out);
  fs.mkdirSync(outDir, { recursive: true });
  const contracts = await loadContracts();
  const results = [];
  for (const tenant of selected) {
    results.push(await reconcileTenant({ tenant, outDir, contracts }));
  }

  const allNodes = results.flatMap((result) => result.nodes);
  const allCandidates = results.flatMap((result) => result.candidates);
  const allQuarantine = results.flatMap((result) => result.quarantine);
  const summary = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/tenant-graph-reconciliation.mjs',
    tenants: selected.map((tenant) => tenant.tenantKey),
    mode: NOT_ACTIVE,
    totals: {
      nodeCandidatesIndexed: allNodes.length,
      relationshipRows: results.reduce((sum, result) => sum + result.summary.relationshipRows, 0),
      relationshipCandidates: allCandidates.length,
      quarantinedRelationships: allQuarantine.length,
      topQuarantineReasons: summarizeQuarantineReasons(allQuarantine).slice(0, 25),
      graphTablesWritten: false,
      productReadModelsUpdated: false,
    },
    perTenant: Object.fromEntries(results.map((result) => [result.summary.tenantKey, result.summary])),
  };

  writeJson(path.join(outDir, 'summary.json'), summary);
  writeCsv(path.join(outDir, 'graph-node-index.csv'), Object.keys(allNodes[0] ?? nodeHeaders()), allNodes);
  writeCsv(path.join(outDir, 'graph-edge-candidates.csv'), Object.keys(allCandidates[0] ?? edgeHeaders()), allCandidates);
  writeCsv(path.join(outDir, 'graph-quarantine.csv'), Object.keys(allQuarantine[0] ?? quarantineHeaders()), allQuarantine);

  console.log(
    `tenant-graph-reconciliation: ${selected.length} tenant(s), ${summary.totals.relationshipRows} relationship row(s), ${summary.totals.relationshipCandidates} candidate(s), ${summary.totals.quarantinedRelationships} quarantined`,
  );
  console.log(`  report: ${outDir}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export {
  buildNodeIndex,
  evaluateRelationshipRow,
  objectTypeForEndpoint,
  profileContractFiles,
  reconcileTenant,
  slug,
};
