import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const loadedRoot = path.join(repoRoot, 'docs/build/lakeshore/loaded');
const manifestPath = path.join(loadedRoot, 'manifest.json');
const outputPath = path.join(loadedRoot, 'CORPUS_COVERAGE_MAP.md');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const templateCoverage = {
  'enterprise-profile': {
    covers: ['Holdco profile', 'Opco profiles', 'Revenue and employee scale', 'Countries and sectors', 'Ownership model'],
    agents: ['Home', 'Tower', 'Sentinel'],
    notes: 'Identity spine used by every client-scoped surface.',
  },
  'financial-kpi-workbook': {
    covers: ['IT financials', 'Finance KPIs', 'Treasury KPIs', 'Working-capital trends', 'Quarterly time series'],
    agents: ['Home', 'Moves', 'Tower', 'Sentinel'],
    notes: 'Makes value, readiness, and CFO questions answerable with numbers.',
  },
  'annual-quarterly-reports': {
    covers: ['Board reporting', 'Quarterly performance narrative', 'Segment context', 'Executive commentary'],
    agents: ['Home', 'Tower', 'Sentinel'],
    notes: 'Document evidence for financial and strategic context.',
  },
  'market-signals': {
    covers: ['Industry context', 'Competitive pressure', 'Macroeconomic signals', 'Demand and supply-chain signals'],
    agents: ['Moves', 'Source', 'Sentinel'],
    notes: 'Provides outside-in context without pretending it is client-owned fact.',
  },
  'strategy-memo': {
    covers: ['Strategic priorities', 'M&A integration backlog', 'Operating-model tension', 'Transformation rationale'],
    agents: ['Home', 'Moves', 'Sentinel'],
    notes: 'Explains why the portfolio is changing, not just what exists.',
  },
  'segment-pnl': {
    covers: ['Opco P&L', 'Segment margin', 'Revenue mix', 'EBITDA context'],
    agents: ['Home', 'Moves', 'Tower'],
    notes: 'Connects technology work to operating-company economics.',
  },
  'product-portfolio': {
    covers: ['Product lines', 'DTC mix', 'Supply-chain product families', 'Marketing service offers'],
    agents: ['Moves', 'Source', 'Sentinel'],
    notes: 'Keeps opco-specific recommendations from becoming generic.',
  },
  'site-and-plant-inventory': {
    covers: ['Sites', 'Plants', 'Warehouses', 'Geography', 'Operational footprint'],
    agents: ['Tower', 'Source', 'Sentinel'],
    notes: 'Grounds logistics, network, and regional deployment questions.',
  },
  'erp-landscape-workbook': {
    covers: ['ERP estate', 'Finance systems', 'Procurement systems', 'Supply-chain systems', 'Legacy modernization targets'],
    agents: ['Moves', 'Source', 'Tower'],
    notes: 'Primary systems-of-record view for modernization and sourcing.',
  },
  'application-portfolio': {
    covers: ['CMDB/application portfolio', 'Owners', 'Lifecycle', 'Criticality', 'Hosting and stack'],
    agents: ['Moves', 'Source', 'Tower', 'Sentinel'],
    notes: 'Main inventory for modernization, risk, and prioritization decisions.',
  },
  'integration-topology': {
    covers: ['APIs', 'EDI', 'Middleware', 'Data flows', 'Source-to-target dependencies'],
    agents: ['Moves', 'Source', 'Tower'],
    notes: 'Prevents migration and sourcing advice from ignoring dependency risk.',
  },
  'vendor-contracts': {
    covers: ['Vendor contracts', 'Kyriba contract', 'SI implementation partner', 'Renewals', 'Commercial terms'],
    agents: ['Source', 'Moves', 'Tower', 'Sentinel'],
    notes: 'Backbone for sourcing, renewal, and value-realization questions.',
  },
  'initiative-portfolio': {
    covers: ['Kyriba rollout', 'AI initiatives', 'Modernization programs', 'Gates', 'Budget and value targets'],
    agents: ['Home', 'Moves', 'Tower'],
    notes: 'Turns the corpus into governed work, not static inventory.',
  },
  'org-roles': {
    covers: ['Org structure', 'Decision rights', 'Global CIO', 'Opco CIOs', 'CFO/Treasury', 'Surekha buyer persona'],
    agents: ['Home', 'Source', 'Sentinel'],
    notes: 'Defines who owns, approves, and is accountable for decisions.',
  },
  'dora-baseline': {
    covers: ['Delivery telemetry', 'DORA metrics', 'Change failure rate', 'Lead time', 'Deployment frequency'],
    agents: ['Moves', 'Tower', 'Sentinel'],
    notes: 'Evidence for delivery maturity and modernization risk.',
  },
  'qms-events': {
    covers: ['Quality events', 'Compliance events', 'Control issues', 'Remediation queue'],
    agents: ['Tower', 'Sentinel', 'Source'],
    notes: 'Risk and control context for regulated and customer-impacting work.',
  },
  'ai-tool-footprint': {
    covers: ['AI tool inventory', 'Shadow AI', 'Responsible AI policy fit', 'Skills and governance gaps'],
    agents: ['Sentinel', 'Moves', 'Tower'],
    notes: 'Grounds AI-readiness and hallucination-control conversations.',
  },
  'incidents-change-history': {
    covers: ['Incident history', 'Change history', 'ITSM evidence', 'SLA patterns', 'Operational risk'],
    agents: ['Tower', 'Moves', 'Sentinel'],
    notes: 'Makes operational-risk answers evidence-linked rather than anecdotal.',
  },
};

function csvHeader(relPath) {
  const csvPath = path.join(loadedRoot, relPath);
  const firstLine = readFileSync(csvPath, 'utf8').split(/\r?\n/, 1)[0] ?? '';
  return firstLine.split(',').map((item) => item.trim()).filter(Boolean);
}

function opcoCoverage(relPath) {
  const content = readFileSync(path.join(loadedRoot, relPath), 'utf8');
  return manifest.opcos
    .filter((opco) => [opco.id, opco.name, opco.shortName].some((token) => token && content.includes(token)))
    .map((opco) => opco.id);
}

function formatList(items) {
  return items.length > 0 ? items.join(', ') : '-';
}

function documentSummary() {
  const byKind = new Map();
  for (const doc of manifest.documents ?? []) {
    byKind.set(doc.kind, (byKind.get(doc.kind) ?? 0) + 1);
  }
  return [...byKind.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kind, count]) => `- ${kind}: ${count}`)
    .join('\n');
}

function rowFor(file) {
  const coverage = templateCoverage[file.templateId] ?? { covers: [file.dimension], agents: ['Sentinel'], notes: 'Template coverage metadata not classified yet.' };
  const headers = csvHeader(file.path).slice(0, 8);
  const opcos = opcoCoverage(file.path);
  return [
    `| ${file.templateId}`,
    file.rows,
    file.acceptedFormats.join(', '),
    formatList(opcos),
    coverage.covers.join('<br>'),
    coverage.agents.join(', '),
    `${headers.join(', ')}${headers.length >= 8 ? ', ...' : ''}`,
    `${coverage.notes} |`,
  ].join(' | ');
}

function buildMarkdown() {
  const dataRows = manifest.dataFiles.map(rowFor).join('\n');
  return `# Lakeshore Holdings Corpus Coverage Map

Generated from \`docs/build/lakeshore/loaded/manifest.json\` generated at \`${manifest.generatedAt}\`.

## Executive Summary

Lakeshore's current package is a loader-ready corpus, not a single flat seed file.
It contains ${manifest.totals.structuredRecords.toLocaleString('en-US')} structured rows across ${manifest.totals.csvFiles} registry templates, ${manifest.totals.generatedDocuments} generated documents, ${manifest.opcos.length} operating companies / entities, a workbook bundle, how-to pages, and a one-time offline review ZIP.

The brief describes 50+ business dimensions. In the actual loader package, those dimensions are grouped into ${manifest.totals.csvFiles} templates so the Data Loads module can validate, approve, commit, and audit them through existing template contracts.

## Tenant Identity

| Field | Value |
| --- | --- |
| Display name | ${manifest.displayName} |
| Tenant key | \`${manifest.tenantKey}\` |
| Broker key | \`${manifest.brokerKey}\` |
| Synthetic notice | ${manifest.syntheticNotice} |

## Operating Company Coverage

| Opco | CIO | CFO | Platform count |
| --- | --- | --- | --- |
${manifest.opcos.map((opco) => `| ${opco.id} | ${opco.cio} | ${opco.cfo} | ${opco.platforms.length} |`).join('\n')}

## Template Coverage

| Template | Rows | Formats | Opco IDs Present | Business Dimensions Covered | Agent / Surface Use | Leading Columns | Notes |
| --- | ---: | --- | --- | --- | --- | --- | --- |
${dataRows}

## Document Coverage

${documentSummary()}

Document files are mapped to loader templates in the manifest. Contract PDFs primarily enrich \`vendor-contracts\`; policy, board, architecture, and performance documents enrich governance, strategy, financial, and integration questions.

## How Agents Use This Corpus

| Agent / Surface | What It Should Use | Hallucination Control |
| --- | --- | --- |
| Home | \`enterprise-profile\`, \`initiative-portfolio\`, \`financial-kpi-workbook\`, \`segment-pnl\` | Show only client-scoped facts; use honest empty states before live commit |
| Sentinel / Intelligence | All templates plus parsed documents | Cite file, row, or document evidence; say "not available" when missing |
| Moves | \`application-portfolio\`, \`erp-landscape-workbook\`, \`initiative-portfolio\`, \`financial-kpi-workbook\`, modernization/rate-card corpus | Separate Lakeshore facts from shared benchmark/pattern fallbacks |
| Source | \`vendor-contracts\`, \`org-roles\`, \`integration-topology\`, \`site-and-plant-inventory\`, parsed contracts | Use contract and owner evidence before making sourcing recommendations |
| Tower | \`dora-baseline\`, \`incidents-change-history\`, \`qms-events\`, \`integration-topology\`, \`financial-kpi-workbook\` | Keep operational risk and control status tied to tenant rows only |

## What Is Still Required Before Live Agent Grounding

1. PR #2997 must land so the governed load rehearsal/commit evidence is available.
2. PR #2998 must land so the CXO corpus activation plan and agent-grounding validation are on main.
3. Live secrets must be present for Clerk, data-plane commit, embeddings, and Azure AI Document Intelligence.
4. The package must be loaded through Data Loads, not inserted manually.
5. Embeddings must be generated for Lakeshore chunks.
6. Data Trust and tenant isolation must be verified in production with two Lakeshore CXO users.

## Offline Review Bundle

The one-time client-review bundle is:

\`docs/build/lakeshore/loaded/review-bundle/lakeshore-offline-review-bundle.zip\`

It includes the manifest, CSVs, workbook, how-to pages, documents, and research notes so a client can review the synthetic corpus outside the app before live activation.
`;
}

const markdown = buildMarkdown();

if (checkOnly) {
  if (!existsSync(outputPath)) {
    console.error(`Missing ${path.relative(repoRoot, outputPath)}`);
    process.exit(1);
  }
  const current = readFileSync(outputPath, 'utf8');
  if (current !== markdown) {
    console.error(`${path.relative(repoRoot, outputPath)} is stale. Run node scripts/lakeshore/generate-corpus-coverage-map.mjs`);
    process.exit(1);
  }
  console.log(`${path.relative(repoRoot, outputPath)} is current.`);
} else {
  writeFileSync(outputPath, markdown);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
}
