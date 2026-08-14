#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const DEFAULT_OUT = 'reports/ava-readiness-ledger-2026-08';
const REGISTRY = 'datasets/tenant-inputs/tenant-input-registry.json';
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
  const args = { out: DEFAULT_OUT, tenants: [] };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--out') {
      args.out = argv[index + 1];
      index += 1;
    } else if (value === '--tenant') {
      args.tenants.push(argv[index + 1]);
      index += 1;
    } else if (value === '--help') {
      console.log('Usage: node scripts/audit/ava-readiness-ledger.mjs [--tenant <key>|all] [--out <dir>]');
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

function localProofForTenant(tenantKey) {
  const layerSummary = readJson(`${LAYER_REPORT_DIR}/summary.json`, null);
  const graphSummary = readJson(`${GRAPH_REPORT_DIR}/summary.json`, null);
  const layerTenant = layerSummary?.perTenant?.[tenantKey] ?? null;
  const graphTenant = graphSummary?.perTenant?.[tenantKey] ?? null;
  return {
    layer2ProfilesThatWouldRun: layerTenant?.layer2?.profilesThatWouldRun ?? 0,
    layer2DimensionFailures: layerTenant?.layer2?.dimensionFailures ?? null,
    graphRelationshipCandidates: graphTenant?.relationshipCandidates ?? 0,
    graphQuarantinedRelationships: graphTenant?.quarantinedRelationships ?? null,
    proofArtifacts: [
      `${LAYER_REPORT_DIR}/${tenantKey}/layer2-adapter-reconciliation.csv`,
      `${LAYER_REPORT_DIR}/${tenantKey}/layer3-canonical-refresh-summary.json`,
      `${GRAPH_REPORT_DIR}/${tenantKey}/graph-reconciliation-summary.json`,
    ].filter((file) => fs.existsSync(abs(file))),
  };
}

function buildAvaReadinessRow({ tenantKey, surface, localProof }) {
  const blockers = [
    'data-plane loaded readback not captured in this lane',
    'Azure-native index proof not captured in this lane',
    'retrieval query proof not captured in this lane',
    'cite-render verification not captured in this lane',
  ];
  if (Number(localProof.layer2DimensionFailures ?? 0) > 0) blockers.push('Layer 2 dimension dry-run failures remain');
  if (Number(localProof.graphQuarantinedRelationships ?? 0) > 0) blockers.push('graph relationship quarantine remains');

  return {
    tenantKey,
    surface,
    sourceEvidenceState: localProof.proofArtifacts.length > 0 ? READINESS_STATES.verified : READINESS_STATES.notVerified,
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
    proofArtifacts: localProof.proofArtifacts.join('; '),
    blockers: blockers.join('; '),
    mode: NOT_ACTIVE,
  };
}

function buildAvaReadinessLedger(tenants) {
  const rows = [];
  for (const tenant of tenants) {
    const localProof = localProofForTenant(tenant.tenantKey);
    for (const surface of AVA_SURFACES) {
      rows.push(buildAvaReadinessRow({ tenantKey: tenant.tenantKey, surface, localProof }));
    }
  }
  return rows;
}

function summarize(rows) {
  return {
    tenants: [...new Set(rows.map((row) => row.tenantKey))].length,
    surfaces: AVA_SURFACES.length,
    rows: rows.length,
    loadedVerified: rows.filter((row) => row.loadedState === READINESS_STATES.verified).length,
    indexedVerified: rows.filter((row) => row.indexedState === READINESS_STATES.verified).length,
    retrievableVerified: rows.filter((row) => row.retrievableState === READINESS_STATES.verified).length,
    citedVerified: rows.filter((row) => row.citedState === READINESS_STATES.verified).length,
    agentReady: rows.filter((row) => row.agentReady).length,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const tenants = readActiveTenants(args.tenants);
  if (tenants.length === 0) throw new Error(`No active tenants matched: ${args.tenants.join(', ')}`);
  const rows = buildAvaReadinessLedger(tenants);
  const outDir = abs(args.out);
  const summary = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/ava-readiness-ledger.mjs',
    mode: NOT_ACTIVE,
    truthRule: 'loaded, indexed, retrievable, and cited are independent states; agent_ready requires all proof gates.',
    summary: summarize(rows),
    tenants: tenants.map((tenant) => tenant.tenantKey),
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

export { AVA_SURFACES, READINESS_STATES, buildAvaReadinessLedger, buildAvaReadinessRow, summarize };
