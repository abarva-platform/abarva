#!/usr/bin/env node

/**
 * Validates a tenant's relationship graph against the declared ontology.
 *
 * The defect this exists to catch: an edge whose endpoint type has no home dimension.
 * Those edges look fine in the file, pass every row-count and column check, and resolve to
 * nothing at query time. One tenant carried 1,039 of them under a node type (`role`) that
 * meant two different things and lived in neither dimension.
 *
 * Checks, in order of how quietly they fail today:
 *   1. Every endpoint type is declared in the ontology.
 *   2. Every relationship type is declared.
 *   3. Every edge respects the declared domain and range for its type.
 *   4. Every endpoint name resolves in the home dimension for its type.
 *
 * Read-only. Writes a report, never a tenant file.
 *
 * Usage:
 *   node scripts/audit/validate-tenant-ontology.mjs --tenant skyharbor-air
 *   node scripts/audit/validate-tenant-ontology.mjs            # all active tenants
 */

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const ROOT = process.cwd();
const REGISTRY = 'datasets/tenant-inputs/tenant-input-registry.json';
const TEMPLATE_DIR = 'datasets/tenant-inputs/templates/universal/standard-2026-07-v3';
const OUT_DIR = 'reports/tenant-ontology';

const abs = (relative) => path.join(ROOT, relative);

function parseArgs(argv) {
  const args = { tenants: [], strict: false };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === '--tenant') {
      args.tenants.push(argv[index + 1]);
      index += 1;
    } else if (argv[index] === '--strict') {
      args.strict = true;
    }
  }
  return args;
}

function readCsv(file) {
  if (!fs.existsSync(abs(file))) return [];
  const parsed = Papa.parse(fs.readFileSync(abs(file), 'utf8').trim(), { header: true, skipEmptyLines: true });
  return parsed.data;
}

function resolveDimension(root, contractFile) {
  const prefix = /^(\d{2})_/.exec(contractFile)?.[1];
  if (!fs.existsSync(abs(root))) return '';
  const files = fs.readdirSync(abs(root)).filter((file) => file.endsWith('.csv'));
  return (
    files.find((file) => file === contractFile) ??
    files.find((file) => /^(\d{2})_/.exec(file)?.[1] === prefix) ??
    ''
  );
}

function main() {
  const args = parseArgs(process.argv);
  const ontology = JSON.parse(fs.readFileSync(abs(`${TEMPLATE_DIR}/ontology.json`), 'utf8'));
  const registry = JSON.parse(fs.readFileSync(abs(REGISTRY), 'utf8'));

  const nodeTypes = new Map(ontology.nodeTypes.map((entry) => [entry.type, entry]));
  const edgeTypes = new Map(ontology.relationshipTypes.map((entry) => [entry.type, entry]));

  // Synonyms are resolved before checking. A tenant calling an accountable party `leader`
  // rather than `org_unit` is using a different word for the same thing, and failing it for
  // that would be measuring vocabulary rather than correctness.
  const nodeSynonyms = new Map(Object.entries(ontology.synonyms?.nodeTypes ?? {}));
  const edgeSynonyms = new Map(Object.entries(ontology.synonyms?.relationshipTypes ?? {}));
  const canonicalNode = (t) => nodeSynonyms.get(t) ?? t;
  const canonicalEdge = (t) => edgeSynonyms.get(t) ?? t;

  const tenants = (registry.activeTenants ?? []).filter(
    (tenant) => args.tenants.length === 0 || args.tenants.includes(tenant.tenantKey),
  );

  const report = [];
  let anyFailure = false;

  for (const tenant of tenants) {
    const root = tenant.canonicalInputRoot;
    const relFile = resolveDimension(root, '12_relationships.csv');
    if (!relFile) continue;
    const edges = readCsv(`${root}/${relFile}`);

    // Build the resolvable name universe for each declared node type.
    const universe = new Map();
    for (const [type, spec] of nodeTypes) {
      const file = resolveDimension(root, spec.homeDimension);
      if (!file) {
        universe.set(type, new Set());
        continue;
      }
      const rows = readCsv(`${root}/${file}`);
      const columns = [spec.keyColumn, ...(spec.alternateKeyColumns ?? [])];
      const names = new Set();
      for (const row of rows) {
        for (const column of columns) {
          const value = String(row[column] ?? '').trim();
          if (value) names.add(value);
        }
      }
      universe.set(type, names);
    }

    const findings = {
      undeclaredNodeType: new Map(),
      undeclaredEdgeType: new Map(),
      domainRangeViolation: new Map(),
      unresolvedEndpoint: new Map(),
      expectedExternalEndpoint: new Map(),
    };
    const bump = (bucket, key, sample) => {
      if (!bucket.has(key)) bucket.set(key, { count: 0, samples: [] });
      const entry = bucket.get(key);
      entry.count += 1;
      if (entry.samples.length < 3 && sample) entry.samples.push(sample);
    };

    let endpoints = 0;
    for (const edge of edges) {
      const edgeType = canonicalEdge(String(edge.relationship_type ?? '').trim());
      const spec = edgeTypes.get(edgeType);
      if (!spec) bump(findings.undeclaredEdgeType, edgeType || '(blank)', '');

      for (const side of ['from', 'to']) {
        const type = canonicalNode(String(edge[`${side}_object_type`] ?? '').trim());
        const name = String(edge[`${side}_object_name`] ?? '').trim();
        if (!type || !name) continue;
        endpoints += 1;

        if (!nodeTypes.has(type)) {
          bump(findings.undeclaredNodeType, type, name);
          continue;
        }
        if (spec) {
          const allowed = side === 'from' ? spec.from : spec.to;
          if (Array.isArray(allowed) && !allowed.includes(type)) {
            bump(findings.domainRangeViolation, `${edgeType}.${side} got ${type}`, name);
          }
        }
        if (!universe.get(type)?.has(name)) {
          // A node type whose evidence lives outside the active package can never resolve
          // against a canonical dimension. Report it, but do not count it as a violation --
          // otherwise the gate can never go green and stops being read.
          const bucket =
            nodeTypes.get(type)?.resolutionMode === 'external-evidence-root'
              ? findings.expectedExternalEndpoint
              : findings.unresolvedEndpoint;
          bump(bucket, type, name);
        }
      }
    }

    const total =
      [...findings.undeclaredNodeType.values()].reduce((sum, entry) => sum + entry.count, 0) +
      [...findings.undeclaredEdgeType.values()].reduce((sum, entry) => sum + entry.count, 0) +
      [...findings.domainRangeViolation.values()].reduce((sum, entry) => sum + entry.count, 0) +
      [...findings.unresolvedEndpoint.values()].reduce((sum, entry) => sum + entry.count, 0);
    // expectedExternalEndpoint is deliberately excluded from the violation total.

    if (total > 0) anyFailure = true;

    report.push({
      tenantKey: tenant.tenantKey,
      edges: edges.length,
      endpoints,
      violations: total,
      integrity: endpoints ? `${Math.round((100 * (endpoints - [...findings.unresolvedEndpoint.values()].reduce((s, e) => s + e.count, 0))) / endpoints)}%` : 'n/a',
      detail: Object.fromEntries(
        Object.entries(findings).map(([key, bucket]) => [
          key,
          [...bucket.entries()].map(([name, entry]) => ({ key: name, count: entry.count, samples: entry.samples })),
        ]),
      ),
    });
  }

  fs.mkdirSync(abs(OUT_DIR), { recursive: true });
  fs.writeFileSync(abs(`${OUT_DIR}/ontology-validation.json`), `${JSON.stringify({ ontologyId: ontology.ontologyId, tenants: report }, null, 2)}\n`);

  for (const entry of report) {
    console.log(`${entry.tenantKey}: ${entry.edges} edges, ${entry.endpoints} endpoints, integrity ${entry.integrity}, violations ${entry.violations}`);
    for (const [kind, items] of Object.entries(entry.detail)) {
      for (const item of items) {
        console.log(`    ${kind}: ${item.key} x${item.count} ${item.samples.length ? `e.g. ${item.samples[0]}` : ''}`);
      }
    }
  }
  console.log(`\nreport: ${OUT_DIR}/ontology-validation.json`);

  if (args.strict && anyFailure) process.exit(1);
}

main();
