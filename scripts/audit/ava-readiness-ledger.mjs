#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const DEFAULT_OUT = 'reports/ava-readiness-ledger/current-main';
const REGISTRY = 'datasets/tenant-inputs/tenant-input-registry.json';
const CURRENT_LAYER_STATUS_REPORT = 'reports/layer-refresh-status/current-main-v2/layer-refresh-status-v2.json';
const LAYER_REPORT_DIR = 'reports/layer-reconciliation-2026-08';
const GRAPH_REPORT_DIR = 'reports/graph-reconciliation-2026-08';
const NOT_ACTIVE =
  'ava_readiness_ledger_report_only_no_index_no_retrieval_no_runtime_claim_no_agent_ready_promotion';

const READINESS_STATES = {
  verified: 'verified',
  notVerified: 'not_verified',
  blocked: 'blocked',
};

const AVA_SURFACES = ['home', 'intelligence', 'moves', 'source', 'tower'];

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function parseArgs(argv) {
  const args = { includeTenantKeys: false, out: DEFAULT_OUT, sourceSha: '', tenants: [] };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--out') {
      args.out = argv[index + 1];
      index += 1;
    } else if (value === '--source-sha') {
      args.sourceSha = argv[index + 1];
      index += 1;
    } else if (value === '--tenant') {
      args.tenants.push(argv[index + 1]);
      index += 1;
    } else if (value === '--include-tenant-keys') {
      args.includeTenantKeys = true;
    } else if (value === '--help') {
      console.log(
        'Usage: node scripts/audit/ava-readiness-ledger.mjs [--tenant <key>|all] [--out <dir>] [--source-sha <sha>] [--include-tenant-keys]',
      );
      process.exit(0);
    }
  }
  return args;
}

const abs = (relativePath) => path.resolve(ROOT, relativePath);

function readJson(relativePath, fallback = null) {
  const filePath = abs(relativePath);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(filePath, headers, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${body}\n`);
}

function readActiveTenants(selectedTenants) {
  const registry = readJson(REGISTRY, { activeTenants: [] });
  const tenants = registry.activeTenants ?? [];
  if (selectedTenants.length === 0 || selectedTenants.includes('all')) return tenants;
  return tenants.filter((tenant) => selectedTenants.includes(tenant.tenantKey));
}

function currentLayerStatusForTenant(tenantAlias) {
  const status = readJson(CURRENT_LAYER_STATUS_REPORT, null);
  if (!status) return null;
  const tenantStatus = status.tenantStatuses?.find((tenant) => tenant.tenant === tenantAlias) ?? null;
  const graphStatus = status.layer3?.graph?.perTenant?.find((tenant) => tenant.tenant === tenantAlias) ?? null;
  return { graphStatus, tenantStatus };
}

function localProofForTenant(tenantKey, tenantAlias) {
  const currentStatus = currentLayerStatusForTenant(tenantAlias);
  if (currentStatus?.tenantStatus) {
    return {
      layer2ProfilesThatWouldRun: currentStatus.tenantStatus.layer2WouldRunRows ?? 0,
      layer2DimensionFailures: currentStatus.tenantStatus.layer2DryRunFailures ?? null,
      graphRelationshipCandidates: currentStatus.graphStatus?.candidateEdges ?? 0,
      graphQuarantinedRelationships: currentStatus.graphStatus?.quarantinedEdges ?? null,
      proofArtifactTypes: ['layer_refresh_status_current_main_v2'],
    };
  }

  const layerSummary = readJson(`${LAYER_REPORT_DIR}/summary.json`, null);
  const graphSummary = readJson(`${GRAPH_REPORT_DIR}/summary.json`, null);
  const layerTenant = layerSummary?.perTenant?.[tenantKey] ?? null;
  const graphTenant = graphSummary?.perTenant?.[tenantKey] ?? null;
  const proofArtifacts = [
    {
      type: 'layer2_adapter_reconciliation',
      file: `${LAYER_REPORT_DIR}/${tenantKey}/layer2-adapter-reconciliation.csv`,
    },
    {
      type: 'layer3_canonical_refresh_summary',
      file: `${LAYER_REPORT_DIR}/${tenantKey}/layer3-canonical-refresh-summary.json`,
    },
    {
      type: 'graph_reconciliation_summary',
      file: `${GRAPH_REPORT_DIR}/${tenantKey}/graph-reconciliation-summary.json`,
    },
  ].filter((artifact) => fs.existsSync(abs(artifact.file)));
  return {
    layer2ProfilesThatWouldRun: layerTenant?.layer2?.profilesThatWouldRun ?? 0,
    layer2DimensionFailures: layerTenant?.layer2?.dimensionFailures ?? null,
    graphRelationshipCandidates: graphTenant?.relationshipCandidates ?? 0,
    graphQuarantinedRelationships: graphTenant?.quarantinedRelationships ?? null,
    proofArtifactTypes: proofArtifacts.map((artifact) => artifact.type),
  };
}

function buildAvaReadinessRow({ includeTenantKey = false, tenantAlias, tenantKey, surface, localProof }) {
  const blockers = [
    'data-plane loaded readback not captured in this lane',
    'Azure-native index proof not captured in this lane',
    'retrieval query proof not captured in this lane',
    'cite-render verification not captured in this lane',
  ];
  if (Number(localProof.layer2DimensionFailures ?? 0) > 0) blockers.push('Layer 2 dimension dry-run failures remain');
  if (Number(localProof.graphQuarantinedRelationships ?? 0) > 0) blockers.push('graph relationship quarantine remains');

  const row = {
    tenant: tenantAlias,
    surface,
    sourceEvidenceState:
      localProof.proofArtifactTypes.length > 0 ? READINESS_STATES.verified : READINESS_STATES.notVerified,
    loadedState: READINESS_STATES.notVerified,
    indexedState: READINESS_STATES.notVerified,
    retrievableState: READINESS_STATES.notVerified,
    citedState: READINESS_STATES.notVerified,
    agentReady: false,
    mayReachAva: false,
    layer2ProfilesThatWouldRun: localProof.layer2ProfilesThatWouldRun,
    layer2DimensionFailures: localProof.layer2DimensionFailures ?? '',
    graphRelationshipCandidates: localProof.graphRelationshipCandidates,
    graphQuarantinedRelationships: localProof.graphQuarantinedRelationships ?? '',
    proofArtifactTypes: localProof.proofArtifactTypes.join('; '),
    blockers: blockers.join('; '),
    mode: NOT_ACTIVE,
  };
  if (includeTenantKey) row.tenantKey = tenantKey;
  return row;
}

function anonymizeTenants(tenantKeys) {
  return new Map(tenantKeys.map((tenantKey, index) => [tenantKey, `tenant-${String(index + 1).padStart(2, '0')}`]));
}

function buildAvaReadinessLedger(tenants, options = {}) {
  const tenantAliases = anonymizeTenants(tenants.map((tenant) => tenant.tenantKey));
  const rows = [];
  for (const tenant of tenants) {
    const tenantAlias = tenantAliases.get(tenant.tenantKey);
    const localProof = localProofForTenant(tenant.tenantKey, tenantAlias);
    for (const surface of AVA_SURFACES) {
      rows.push(
        buildAvaReadinessRow({
          includeTenantKey: options.includeTenantKeys === true,
          tenantAlias,
          tenantKey: tenant.tenantKey,
          surface,
          localProof,
        }),
      );
    }
  }
  return rows;
}

function summarize(rows) {
  return {
    tenants: [...new Set(rows.map((row) => row.tenant))].length,
    surfaces: AVA_SURFACES.length,
    rows: rows.length,
    loadedVerified: rows.filter((row) => row.loadedState === READINESS_STATES.verified).length,
    indexedVerified: rows.filter((row) => row.indexedState === READINESS_STATES.verified).length,
    retrievableVerified: rows.filter((row) => row.retrievableState === READINESS_STATES.verified).length,
    citedVerified: rows.filter((row) => row.citedState === READINESS_STATES.verified).length,
    agentReady: rows.filter((row) => row.agentReady).length,
  };
}

function refusalTests() {
  return [
    {
      promptClass: 'conflict_metric',
      proofState: READINESS_STATES.notVerified,
      expectedBehavior: 'refuse_or_explain_not_available_until_fact_authority_decision_exists',
      runtimeTestRun: false,
    },
    {
      promptClass: 'undeclared_segment',
      proofState: READINESS_STATES.notVerified,
      expectedBehavior: 'refuse_or_explain_not_available_until_source_contract_decision_exists',
      runtimeTestRun: false,
    },
  ];
}

async function main() {
  const args = parseArgs(process.argv);
  const tenants = readActiveTenants(args.tenants);
  if (tenants.length === 0) throw new Error(`No active tenants matched: ${args.tenants.join(', ')}`);
  const rows = buildAvaReadinessLedger(tenants, { includeTenantKeys: args.includeTenantKeys });
  const outDir = abs(args.out);
  const summary = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/ava-readiness-ledger.mjs',
    sourceSha: args.sourceSha || 'not-specified',
    mode: NOT_ACTIVE,
    publicDisclosure:
      args.includeTenantKeys === true
        ? 'Tenant keys included by explicit operator flag.'
        : 'Tenant identifiers are anonymized. Proof paths are summarized by artifact type.',
    truthRule: 'loaded, indexed, retrievable, and cited are independent states; agent_ready requires all proof gates.',
    summary: summarize(rows),
    tenantAliases: [...new Set(rows.map((row) => row.tenant))],
    refusalTests: refusalTests(),
  };
  writeJson(path.join(outDir, 'summary.json'), summary);
  writeCsv(path.join(outDir, 'ava-readiness-ledger.csv'), Object.keys(rows[0]), rows);
  console.log(
    `ava-readiness-ledger: ${summary.summary.tenants} tenant(s), ${summary.summary.rows} ledger row(s), ${summary.summary.agentReady} agent-ready`,
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
  AVA_SURFACES,
  READINESS_STATES,
  anonymizeTenants,
  buildAvaReadinessLedger,
  buildAvaReadinessRow,
  refusalTests,
  summarize,
};
