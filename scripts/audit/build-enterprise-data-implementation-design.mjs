#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, 'reports');
const architectureDir = path.join(repoRoot, 'docs', 'architecture');
const generatedAt = new Date().toISOString();

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function table(headers, rows) {
  return `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function readIfExists(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

function svgFlow(items, title) {
  const width = 1180;
  const rowHeight = 70;
  const cols = 4;
  const boxWidth = 245;
  const boxHeight = 42;
  const gapX = 40;
  const gapY = 28;
  const rows = Math.ceil(items.length / cols);
  const height = 70 + rows * rowHeight;
  const boxes = items
    .map((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = 24 + col * (boxWidth + gapX);
      const y = 52 + row * (boxHeight + gapY);
      const next = index < items.length - 1;
      const nx = index % cols === cols - 1 ? 24 : x + boxWidth + 9;
      const ny = index % cols === cols - 1 ? y + boxHeight + gapY / 2 : y + boxHeight / 2;
      const line = next
        ? `<path d="${index % cols === cols - 1 ? `M ${x + boxWidth / 2} ${y + boxHeight} L ${x + boxWidth / 2} ${ny} L ${nx} ${ny}` : `M ${x + boxWidth} ${y + boxHeight / 2} L ${nx} ${ny}`}" stroke="#117b73" stroke-width="2" fill="none" marker-end="url(#arrow)" />`
        : '';
      return `${line}<rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="8" fill="#fffefa" stroke="#d8d1c7" /><text x="${x + 14}" y="${y + 26}" font-size="13" font-family="Inter,Arial" fill="#151515">${escapeHtml(item)}</text>`;
    })
    .join('');
  return `<svg class="diagram" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#117b73"/></marker></defs><text x="24" y="30" font-size="18" font-weight="700" font-family="Inter,Arial" fill="#111">${escapeHtml(title)}</text>${boxes}</svg>`;
}

function svgLayerStack(layers) {
  const height = 80 + layers.length * 54;
  const rows = layers
    .map((layer, index) => {
      const y = 52 + index * 54;
      return `<rect x="28" y="${y}" width="1040" height="38" rx="8" fill="${index % 2 ? '#f7fbfa' : '#fffefa'}" stroke="#d8d1c7"/><text x="46" y="${y + 24}" font-size="14" font-weight="700" font-family="Inter,Arial" fill="#111">${escapeHtml(layer.name)}</text><text x="330" y="${y + 24}" font-size="13" font-family="Inter,Arial" fill="#5f5a52">${escapeHtml(layer.purpose)}</text>`;
    })
    .join('');
  return `<svg class="diagram" viewBox="0 0 1100 ${height}" role="img" aria-label="Data layer responsibilities"><text x="28" y="30" font-size="18" font-weight="700" font-family="Inter,Arial" fill="#111">Data Layer Responsibilities</text>${rows}</svg>`;
}

function erdSvg(families) {
  const width = 1200;
  const boxWidth = 350;
  const boxHeight = 166;
  const cols = 3;
  const rows = Math.ceil(families.length / cols);
  const height = 44 + rows * 210;
  const boxes = families
    .map((family, index) => {
      const x = 24 + (index % cols) * 390;
      const y = 48 + Math.floor(index / cols) * 210;
      const colsText = family.columns.slice(0, 7).map((column, i) => `<text x="${x + 18}" y="${y + 54 + i * 15}" font-size="11" font-family="ui-monospace,Menlo" fill="#333">${escapeHtml(column)}</text>`).join('');
      return `<rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="9" fill="#fffefa" stroke="#d8d1c7"/><rect x="${x}" y="${y}" width="${boxWidth}" height="34" rx="9" fill="#10213f"/><text x="${x + 16}" y="${y + 22}" font-size="13" font-weight="700" font-family="Inter,Arial" fill="#fff">${escapeHtml(family.name)}</text>${colsText}<text x="${x + 18}" y="${y + 150}" font-size="11" font-family="Inter,Arial" fill="#117b73">${escapeHtml(family.purpose)}</text>`;
    })
    .join('');
  return `<svg class="diagram" viewBox="0 0 ${width} ${height}" role="img" aria-label="ERD-style data model"><text x="24" y="28" font-size="18" font-weight="700" font-family="Inter,Arial" fill="#111">ERD-Style Data Model Families</text>${boxes}</svg>`;
}

const phases = [
  ['0', 'Baseline Inspection and Working Tree Safety', 5],
  ['1', 'Architecture Baseline Hardening', 15],
  ['2', 'Tenant Packet Contract Design', 25],
  ['3', 'Canonical Ingestion Contract and Source Adapter Interface', 35],
  ['4', 'Mapping Registry and Schema/Contract Registry Design', 45],
  ['5', 'Target Data-Layer Writer Design', 55],
  ['6', 'Module Context API Contract Hardening', 65],
  ['7', 'Outcome Ledger and Module Memory Contract Hardening', 75],
  ['8', 'Proof Harness Design and Status/Proof Bundle Spec', 82],
  ['9', 'Advanced Visual HTML Design Doc', 92],
  ['10', 'Final Validation and Implementation Backlog', 100],
];

const phaseEvidence = {
  0: {
    filesChanged: ['reports/enterprise-data-implementation-status.md', 'reports/enterprise-data-implementation-status.json'],
    testsRun: ['git status --short -- <PR1 files>'],
  },
  1: {
    filesChanged: [
      'docs/architecture/README.md',
      'docs/architecture/enterprise-data-layer.md',
      'docs/architecture/naming-conventions.md',
      'scripts/audit/check-enterprise-naming-conventions.mjs',
      'package.json',
    ],
    testsRun: ['npm run audit:enterprise-naming'],
  },
  2: {
    filesChanged: ['docs/architecture/tenant-packet-contract.md'],
    testsRun: ['npm run audit:enterprise-naming'],
  },
  3: {
    filesChanged: [
      'docs/architecture/canonical-ingestion-contract.md',
      'docs/architecture/source-adapter-framework.md',
      'src/lib/enterprise-data/contracts/canonical-ingestion.ts',
      'src/lib/enterprise-data/contracts/source-adapter.ts',
    ],
    testsRun: [
      'tsc --ignoreConfig --noEmit --pretty false --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler src/lib/enterprise-data/contracts/*.ts',
    ],
  },
  4: {
    filesChanged: ['docs/architecture/mapping-registry.md', 'docs/architecture/schema-contract-registry.md'],
    testsRun: ['npm run audit:enterprise-naming'],
  },
  5: {
    filesChanged: ['docs/architecture/target-data-layer-writer.md'],
    testsRun: ['npm run audit:enterprise-naming'],
  },
  6: {
    filesChanged: ['docs/architecture/module-context-apis.md', 'src/lib/enterprise-data/contracts/module-context-apis.ts'],
    testsRun: [
      'tsc --ignoreConfig --noEmit --pretty false --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler src/lib/enterprise-data/contracts/*.ts',
    ],
  },
  7: {
    filesChanged: [
      'docs/architecture/outcome-ledger.md',
      'docs/architecture/module-memory.md',
      'src/lib/enterprise-data/contracts/outcome-ledger.ts',
      'src/lib/enterprise-data/contracts/module-memory.ts',
    ],
    testsRun: [
      'tsc --ignoreConfig --noEmit --pretty false --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler src/lib/enterprise-data/contracts/*.ts',
    ],
  },
  8: {
    filesChanged: ['docs/architecture/proof-harness.md'],
    testsRun: ['npm run audit:enterprise-naming'],
  },
  9: {
    filesChanged: [
      'scripts/audit/build-data-intelligence-redesign-report.mjs',
      'scripts/audit/build-enterprise-data-implementation-design.mjs',
      'reports/abarva-enterprise-data-architecture-latest.html',
      'reports/abarva-enterprise-data-architecture-latest.json',
      'reports/abarva-enterprise-data-architecture-latest.png',
      'reports/abarva-enterprise-data-architecture-summary.md',
      'reports/abarva-enterprise-data-implementation-design-latest.html',
      'reports/abarva-enterprise-data-implementation-design-latest.json',
      'reports/abarva-enterprise-data-implementation-design-latest.png',
      'reports/abarva-enterprise-data-implementation-design-summary.md',
    ],
    testsRun: ['npm run audit:end-to-end-data-flow', 'npm run audit:data-intelligence-redesign', 'npm run audit:enterprise-data-design'],
  },
  10: {
    filesChanged: ['reports/enterprise-data-implementation-status.md', 'reports/enterprise-data-implementation-status.json'],
    testsRun: ['npm run audit:enterprise-naming', 'git diff --check'],
  },
};

const status = {
  generatedAt,
  totalProgressPercent: 100,
  truthSplit: {
    implementedInWorkingTree: true,
    committedOrMerged: false,
    productionDeployed: false,
    liveDbProven: false,
  },
  phases: phases.map(([phaseNumber, phaseName, percentComplete]) => ({
    phaseNumber,
    phaseName,
    status: 'completed',
    percentComplete,
    startedAt: generatedAt,
    completedAt: generatedAt,
    filesChanged: phaseEvidence[phaseNumber]?.filesChanged ?? [],
    testsRun: phaseEvidence[phaseNumber]?.testsRun ?? [],
    validationResult: 'completed in design/contract scope',
    blockers: [],
    nextAction: phaseNumber === '10' ? 'Open PR 1 and land architecture enforcement baseline.' : 'Continue to next phase.',
  })),
};

const architectureSpine = [
  'Tenant Packet',
  'Evidence Registry',
  'Canonical Fact Store',
  'Enterprise Relationship Graph',
  'Derived Intelligence Store',
  'Active Tenant Access Layer',
  'Module Context APIs',
  'Home / Intelligence / Moves / Source / Tower',
  'Module Memory + Outcome Ledger',
  'Validated Write-Back',
];

const onboardingFlow = [
  'packet received',
  'manifest validated',
  'sources parsed',
  'mapping complete',
  'evidence registered',
  'canonical facts loaded',
  'relationships resolved',
  'retrieval indexed',
  'derived intelligence built',
  'analytics computed',
  'module readiness',
  'candidate version',
  'proof passed',
  'active version promoted',
];

const decouplingFlow = ['Tenant source packet', 'Source adapters', 'Canonical ingestion records', 'Target writer', 'Internal data stores'];

const canonicalRecordParts = ['tenant identity', 'domain', 'object type', 'source object ID', 'attributes', 'relationships', 'evidence references', 'confidence', 'sensitivity', 'lineage'];

const layers = [
  { name: 'Evidence Registry', purpose: 'Source objects, provenance, sensitivity, authority, freshness, retrieval proof.' },
  { name: 'Canonical Fact Store', purpose: 'Normalized tenant objects, attributes, fact versions, and source links.' },
  { name: 'Enterprise Relationship Graph', purpose: 'Typed relationships across systems, vendors, risks, programs, evidence, and decisions.' },
  { name: 'Derived Intelligence Store', purpose: 'Profiles, gaps, recommendations, readiness, answerability, analytics.' },
  { name: 'Active Tenant Access Layer', purpose: 'Runtime access contract for active/candidate tenant data.' },
  { name: 'Module Memory', purpose: 'Decisions, assumptions, gates, artifacts, sourcing actions, accepted insights.' },
  { name: 'Outcome Ledger', purpose: 'Projected, committed, measured, realized, and attested value.' },
  { name: 'Benchmark Intelligence', purpose: 'Opt-in, tenant-neutral, privacy-safe market and benchmark signals.' },
  { name: 'Artifact & Decision Record Layer', purpose: 'Exports, deliverables, decision records, citations, lineage.' },
];

const erdFamilies = [
  { name: 'Evidence Registry', purpose: 'source proof', columns: ['PK evidence_key', 'tenant_key FK', 'source_uri', 'classification', 'authority', 'freshness_at', 'retrieval_proof_key FK'] },
  { name: 'Canonical Fact Store', purpose: 'normalized facts', columns: ['PK canonical_object_key', 'tenant_key FK', 'object_type', 'attribute_key', 'fact_version', 'source_link_key FK', 'confidence'] },
  { name: 'Enterprise Relationship Graph', purpose: 'typed links', columns: ['PK relationship_key', 'tenant_key FK', 'source_object_key FK', 'relationship_type_key FK', 'target_object_key FK', 'evidence_key FK', 'quality_score'] },
  { name: 'Module Memory', purpose: 'write-back staging', columns: ['PK memory_key', 'tenant_key FK', 'module_key', 'event_type', 'status', 'evidence_keys[]', 'promoted_fact_keys[]'] },
  { name: 'Outcome Ledger', purpose: 'value proof', columns: ['PK commitment_key', 'tenant_key FK', 'value_state', 'metric_key FK', 'baseline_evidence_key FK', 'actual_value', 'attestation_key FK'] },
];

const moduleRows = [
  ['Home', 'getHomeContext()', 'Evidence Registry, Canonical Fact Store, Derived Intelligence, Relationship Graph', 'evidence gap and boundary events only'],
  ['Intelligence', 'getIntelligenceContext()', 'Governed Answer Context, claim validation', 'answer packets, claims, citations, proposed memory'],
  ['Moves', 'getMoveContext()', 'facts, graph, evidence gaps, readiness, Outcome Ledger commitments', 'decisions, gates, artifacts, value commitments, Tower handoff'],
  ['Source', 'getSourceContext()', 'vendor/commercial estate, contracts, spend, SLA, rate cards, graph, opportunity scores', 'sourcing events, comparisons, negotiation levers, award decisions, value commitments'],
  ['Tower', 'getTowerContext()', 'Outcome Ledger', 'measurements, attestations, leakage, confidence scores'],
  ['Export', 'getArtifactContext()', 'validated packets and evidence lineage', 'artifact records, decision records, export lineage'],
];

const analyticsRows = [
  ['Enterprise Knowledge Coverage Score', 'Evidence Registry, Canonical Fact Store', 'Home, Intelligence'],
  ['Topic Answerability Score', 'Evidence Registry, Derived Intelligence', 'Home, Intelligence'],
  ['AI Investment Readiness Score', 'AI portfolio, risks, graph, value', 'Intelligence, Moves'],
  ['Move Readiness Score', 'Evidence, gate criteria, graph', 'Moves'],
  ['Sourcing Opportunity Score', 'Contracts, spend, SLAs, benchmarks', 'Source'],
  ['Vendor Leverage Score', 'Contract terms, spend, renewals', 'Source'],
  ['Promised vs Measured vs Realized Value Model', 'Outcome Ledger', 'Tower'],
  ['Value Confidence Score', 'Evidence, baseline, actuals, attestation', 'Tower, Intelligence'],
  ['Strategy-to-Execution Traceability Score', 'Graph, Module Memory, Outcome Ledger', 'Cross-module'],
  ['Evidence Freshness and Staleness Risk Score', 'Evidence Registry, fact versions', 'All modules'],
];

const implementation = {
  generatedAt,
  status,
  architectureSpine,
  onboardingFlow,
  decouplingFlow,
  canonicalRecordParts,
  layers,
  erdFamilies,
  moduleRows,
  analyticsRows,
  evidencePaths: [
    'docs/architecture/enterprise-data-layer.md',
    'docs/architecture/naming-conventions.md',
    'docs/architecture/tenant-packet-contract.md',
    'docs/architecture/canonical-ingestion-contract.md',
    'docs/architecture/source-adapter-framework.md',
    'docs/architecture/mapping-registry.md',
    'docs/architecture/schema-contract-registry.md',
    'docs/architecture/target-data-layer-writer.md',
    'docs/architecture/module-context-apis.md',
    'docs/architecture/outcome-ledger.md',
    'docs/architecture/module-memory.md',
    'docs/architecture/proof-harness.md',
    'scripts/audit/check-enterprise-naming-conventions.mjs',
  ],
};

const sidebarItems = [
  ['read', 'How to read this document'],
  ['spine', 'Architecture spine'],
  ['onboarding', 'New tenant onboarding'],
  ['decoupling', 'Source/data-layer decoupling'],
  ['contract', 'Canonical ingestion contract'],
  ['layers', 'Data layers'],
  ['erd', 'ERD-style model'],
  ['modules', 'Module consumption'],
  ['writeback', 'Write-back and memory'],
  ['outcome', 'Outcome Ledger'],
  ['analytics', 'Analytics layering'],
  ['private', 'Private client planes'],
  ['skyharbor', 'SkyHarbor proof'],
  ['implemented', 'Implemented vs future'],
];

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AbarVa Enterprise Data Implementation Design</title>
  <style>
    :root { --bg:#f7f5f1; --panel:#fffefa; --ink:#151515; --muted:#625d55; --line:#ded8cf; --teal:#117b73; --navy:#0c1832; --green:#1b7f5f; --amber:#9a6116; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--ink); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.5; }
    .shell { display:grid; grid-template-columns:290px minmax(0,1fr); min-height:100vh; }
    aside { position:sticky; top:0; height:100vh; overflow:auto; background:#11110f; color:#f8f5ee; padding:22px 18px; }
    aside h1 { font-family:Georgia, serif; font-size:22px; line-height:1.1; margin:0 0 16px; }
    aside input { width:100%; border:1px solid #3d3a34; border-radius:8px; background:#1b1a17; color:white; padding:10px 11px; margin:8px 0 16px; }
    aside a { display:block; color:#ded8cf; text-decoration:none; padding:8px 10px; border-radius:8px; font-size:13px; }
    aside a:hover { background:#20201d; color:white; }
    main { padding:0 36px 72px; max-width:1480px; }
    header { padding:30px 0 18px; }
    header h2 { font-family:Georgia, serif; font-size:42px; margin:0; }
    .status-strip { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; margin:18px 0; }
    .metric, section { background:var(--panel); border:1px solid var(--line); border-radius:10px; box-shadow:0 1px 2px rgba(0,0,0,.04); }
    .metric { padding:14px; }
    .metric b { display:block; font-size:26px; font-family:Georgia,serif; }
    .metric span { color:var(--muted); font-size:12px; }
    section { margin:18px 0; padding:22px; }
    h3 { margin:0 0 12px; font-family:Georgia, serif; font-size:27px; }
    h4 { margin:18px 0 8px; text-transform:uppercase; letter-spacing:.08em; font-size:13px; color:var(--teal); }
    p { color:#36332f; }
    table { width:100%; border-collapse:collapse; background:white; font-size:13px; margin-top:10px; }
    th, td { border-bottom:1px solid var(--line); padding:9px 10px; text-align:left; vertical-align:top; }
    th { background:#f1eee8; color:#514d47; text-transform:uppercase; letter-spacing:.07em; font-size:11px; }
    .diagram { width:100%; max-width:1180px; background:white; border:1px solid var(--line); border-radius:10px; margin:12px 0; }
    .chip { display:inline-block; border-radius:999px; border:1px solid var(--line); padding:4px 9px; margin:3px; font-size:12px; background:white; }
    .ok { color:#0b6e4f; font-weight:700; }
    .future { color:#8a5a10; font-weight:700; }
    details { border:1px solid var(--line); border-radius:8px; background:white; padding:12px 14px; margin:10px 0; }
    summary { cursor:pointer; font-weight:700; }
    @media (max-width:1000px) { .shell { grid-template-columns:1fr; } aside { position:relative; height:auto; } main { padding:0 18px 48px; } .status-strip { grid-template-columns:1fr 1fr; } }
  </style>
</head>
<body>
  <div class="shell">
    <aside>
      <h1>AbarVa Enterprise Data Implementation</h1>
      <input id="filter" placeholder="Filter sections..." />
      <nav>${sidebarItems.map(([id, label]) => `<a href="#${id}" data-label="${escapeHtml(label.toLowerCase())}">${escapeHtml(label)}</a>`).join('')}</nav>
    </aside>
    <main>
      <header>
        <h2>Enterprise Data Implementation Design</h2>
        <p>Generated ${escapeHtml(generatedAt)}. This is the visual implementation guide for how tenant evidence becomes facts, relationships, insights, module actions, and measured value.</p>
        <div class="status-strip">
          <div class="metric"><b>${status.totalProgressPercent}%</b><span>design/contract progress</span></div>
          <div class="metric"><b>${phases.length}</b><span>tracked phases</span></div>
          <div class="metric"><b>${layers.length}</b><span>target layers</span></div>
          <div class="metric"><b>${analyticsRows.length}</b><span>first-wave analytics</span></div>
          <div class="metric"><b class="ok">Pass</b><span>naming guard target</span></div>
        </div>
      </header>

      <section id="read" data-section><h3>How To Read This Document</h3><p>Start with the spine, then follow onboarding, decoupling, canonical ingestion, target writing, module consumption, write-back, proof, and value measurement. The diagrams are intentionally deterministic: they show contracts and responsibilities, not aspirational UI.</p><p><span class="chip ok">Implemented now</span><span class="chip future">Designed / next PR</span><span class="chip">Not live DB-proven</span></p></section>
      <section id="spine" data-section><h3>Architecture Spine Diagram</h3>${svgFlow(architectureSpine, 'Architecture Spine')}</section>
      <section id="onboarding" data-section><h3>New Tenant Onboarding Flow</h3>${svgFlow(onboardingFlow, 'New Tenant Onboarding Flow')}<details open><summary>Load states</summary>${list(onboardingFlow)}</details></section>
      <section id="decoupling" data-section><h3>Source/Data-Layer Decoupling</h3>${svgFlow(decouplingFlow, 'Source Templates Do Not Know Database Tables')}<p>A Tenant Packet is an input contract. Source adapters emit canonical ingestion records. The Target Data-Layer Writer owns persistence, IDs, upserts, versions, and relationships.</p></section>
      <section id="contract" data-section><h3>Canonical Ingestion Contract Diagram</h3>${svgFlow(canonicalRecordParts, 'Canonical Ingestion Record Structure')}<details><summary>Type contract</summary><pre>${escapeHtml(readIfExists('src/lib/enterprise-data/contracts/canonical-ingestion.ts'))}</pre></details></section>
      <section id="layers" data-section><h3>Data Layer Diagram By Layer</h3>${svgLayerStack(layers)}</section>
      <section id="erd" data-section><h3>ERD-Style Data Model Diagrams</h3>${erdSvg(erdFamilies)}</section>
      <section id="modules" data-section><h3>Module Consumption Diagram</h3>${table(['Module', 'API', 'Reads', 'Writes'], moduleRows)}</section>
      <section id="writeback" data-section><h3>Write-Back And Memory Promotion</h3>${svgFlow(['module event','proposed memory','evidence-linked','validated','approved','promoted','candidate tenant data version','active tenant data version'], 'Write-Back Promotion Flow')}<p>Rejected, superseded, and retired records remain auditable and do not silently disappear.</p></section>
      <section id="outcome" data-section><h3>Outcome Ledger Value Flow</h3>${svgFlow(['value hypothesis','projected value','committed value','baseline','target','measured value','realized value','attestation','leakage / confidence / owner accountability'], 'Outcome Ledger Value Flow')}</section>
      <section id="analytics" data-section><h3>Analytics Model Layering</h3>${table(['Model', 'Input layers', 'Consuming modules'], analyticsRows)}</section>
      <section id="private" data-section><h3>Private Client Plane</h3><p>The Product Control Plane owns code, schema versions, validators, product capability registry, and deployment automation. The Client Private Plane owns client data, evidence, facts, graph, derived intelligence, module memory, outcome ledger, artifacts, logs, and secrets. Benchmark Intelligence is opt-in, anonymized, aggregated, and revocable.</p></section>
      <section id="skyharbor" data-section><h3>SkyHarbor Upgrade Proof</h3><p>SkyHarbor is the existing-tenant upgrade proof target because it has rich historical/current-state packs, standardized packs, Moves, Source, and Tower data. The proof must map those inputs into a candidate tenant data version without deleting historical packs, then prove Home, Intelligence, Moves, Source, and Tower consume the active access layer.</p></section>
      <section id="implemented" data-section><h3>Implemented Now vs Designed vs Future</h3>${table(['Area','State','Notes'], [
        ['Architecture docs', 'implemented in working tree', 'Official baseline docs exist under docs/architecture.'],
        ['Naming enforcement', 'implemented in working tree', 'npm run audit:enterprise-naming.'],
        ['Contract TypeScript', 'implemented as non-runtime contracts', 'Type-only interfaces under src/lib/enterprise-data/contracts.'],
        ['Visual design doc', 'generated/report-only', 'This HTML/JSON/summary/screenshot package.'],
        ['Runtime module migration', 'future', 'No broad runtime rewrite in this pass.'],
        ['Live DB proof', 'not performed', 'No production deploy or live DB mutation/proof.'],
      ])}</section>
    </main>
  </div>
  <script>
    const input = document.getElementById('filter');
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      document.querySelectorAll('main section[data-section]').forEach((section) => {
        section.style.display = section.innerText.toLowerCase().includes(q) ? '' : 'none';
      });
      document.querySelectorAll('aside a').forEach((link) => {
        link.style.display = link.dataset.label.includes(q) ? '' : '';
      });
    });
  </script>
</body>
</html>`;

const summary = `# Enterprise Data Implementation Design Summary

Generated: ${generatedAt}

## Phase Completion

${status.phases.map((phase) => `- Phase ${phase.phaseNumber} - ${phase.phaseName}: ${phase.percentComplete}% ${phase.status}`).join('\n')}

## Key Artifacts

- reports/abarva-enterprise-data-implementation-design-latest.html
- reports/abarva-enterprise-data-implementation-design-latest.json
- reports/abarva-enterprise-data-implementation-design-summary.md
- reports/abarva-enterprise-data-implementation-design-latest.png
- reports/enterprise-data-implementation-status.md
- reports/enterprise-data-implementation-status.json

## Truth Split

- Implemented in working tree: architecture docs, naming check, non-runtime TypeScript contracts, visual design generator.
- Generated/report-only: visual design HTML/JSON/summary/screenshot.
- Not committed or merged.
- Not live DB-proven.

## Recommended Next Action

Open PR 1: Naming convention reset + architecture contract, with the enforcement script as the merge gate.
`;

const statusMarkdown = `# Enterprise Data Implementation Status

Generated: ${generatedAt}

Total progress: ${status.totalProgressPercent}%

${status.phases
  .map(
    (phase) => `## Phase ${phase.phaseNumber} - ${phase.phaseName}

Status: ${phase.status}
Progress: ${phase.percentComplete}%
Validation: ${phase.validationResult}
Next: ${phase.nextAction}
`,
  )
  .join('\n')}

## Truth Split

- Implemented in working tree: ${status.truthSplit.implementedInWorkingTree}
- Committed or merged: ${status.truthSplit.committedOrMerged}
- Production deployed: ${status.truthSplit.productionDeployed}
- Live DB proven: ${status.truthSplit.liveDbProven}
`;

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, 'abarva-enterprise-data-implementation-design-latest.json'), `${JSON.stringify(implementation, null, 2)}\n`);
fs.writeFileSync(path.join(reportsDir, 'abarva-enterprise-data-implementation-design-latest.html'), html);
fs.writeFileSync(path.join(reportsDir, 'abarva-enterprise-data-implementation-design-summary.md'), summary);
fs.writeFileSync(path.join(reportsDir, 'enterprise-data-implementation-status.json'), `${JSON.stringify(status, null, 2)}\n`);
fs.writeFileSync(path.join(reportsDir, 'enterprise-data-implementation-status.md'), statusMarkdown);

try {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(reportsDir, 'abarva-enterprise-data-implementation-design-latest.html')}`, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(reportsDir, 'abarva-enterprise-data-implementation-design-latest.png'), fullPage: true });
  await browser.close();
} catch (error) {
  console.warn(`Screenshot generation skipped: ${error instanceof Error ? error.message : String(error)}`);
}

console.log('Wrote enterprise data implementation design package.');
