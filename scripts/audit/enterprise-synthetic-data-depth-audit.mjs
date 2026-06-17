#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs/build/data-quality');
const OUT_JSON = path.join(OUT_DIR, 'enterprise-synthetic-data-depth-audit.json');
const OUT_MD = path.join(OUT_DIR, 'enterprise-synthetic-data-depth-audit.md');

const PACKS = [
  {
    key: 'first-capital',
    label: 'First Capital Financial',
    root: 'datasets/first-capital-financial-synthetic-v1',
    loaderRegistered: true,
    tenantKey: 'first-capital',
    target: 'banking-grade 50B+ regional/super-regional financial institution',
  },
  {
    key: 'meridian-health',
    label: 'Meridian Health',
    root: 'datasets/meridian-health-synthetic-v1',
    loaderRegistered: true,
    tenantKey: 'meridian-health',
    target: 'large integrated healthcare delivery network / plan strategy substrate',
  },
  {
    key: 'lakeshore',
    label: 'Lakeshore Kyriba Source Pack',
    root: 'datasets/lakeshore-kyriba-synthetic-v1',
    loaderRegistered: false,
    tenantKey: 'lakeshore',
    target: 'large treasury transformation evidence pack for Source generation',
  },
  {
    key: 'apex-retail',
    label: 'Apex Retail',
    root: 'datasets/apex-retail-synthetic-v1',
    loaderRegistered: true,
    tenantKey: 'apex-retail',
    target: 'large specialty retail enterprise',
  },
  {
    key: 'northstar-clinical',
    label: 'Northstar Clinical Tech',
    root: 'datasets/northstar-clinical-tech-synthetic-v1',
    loaderRegistered: true,
    tenantKey: 'northstar-clinical',
    target: 'global medtech / regulated manufacturer',
  },
  {
    key: 'skyharbor-air',
    label: 'SkyHarbor Air',
    root: 'datasets/skyharbor-air-synthetic-v1',
    loaderRegistered: true,
    tenantKey: 'skyharbor-air',
    target: 'large airline technology estate',
  },
];

const DIMENSIONS = [
  { key: 'scale', label: 'Enterprise Scale' },
  { key: 'itComplexity', label: 'IT Complexity' },
  { key: 'financialDepth', label: 'Financial / Run-Cost Depth' },
  { key: 'orgDepth', label: 'Org / Ownership Depth' },
  { key: 'vendorDepth', label: 'Vendor / Contract Depth' },
  { key: 'opsDepth', label: 'Ops / DORA / Incident Depth' },
  { key: 'regulatoryDepth', label: 'Regulatory / Risk Depth' },
  { key: 'evidenceDepth', label: 'Evidence / Lineage Depth' },
  { key: 'corpusDepth', label: 'Retrieval Corpus Depth' },
  { key: 'generationQuality', label: 'No-Fixture Generation Quality' },
  { key: 'loadReadiness', label: 'Load Readiness' },
];

const IT_TERMS = [
  'mainframe', 'sap', 'oracle', 'workday', 'servicenow', 'snowflake', 'databricks',
  'kafka', 'mulesoft', 'boomi', 'hl7', 'fhir', 'epic', 'cerner', 'pacs', 'claims',
  'ach', 'fedwire', 'fednow', 'rtp', 'swift', 'kyriba', 'mft', 'sftp', 'iam',
  'active directory', 'entra', 'sso', 'api', 'batch', 'etl', 'edw', 'data lake',
  'crm', 'salesforce', 'genesys', 'azure', 'aws', 'gcp', 'vmware', 'kubernetes',
];

const RISK_TERMS = [
  'occ', 'ffiec', 'glba', 'bsa', 'aml', 'finra', 'model risk', 'mra', 'hipaa',
  'phi', 'hitrust', 'fda', 'qms', 'sox', 'pci', 'gdpr', 'retention', 'audit',
  'control', 'downtime', 'rto', 'rpo', 'baa', 'regulator', 'consent order',
];

const FIXTURE_PATTERNS = [
  /synthetic tenant evidence/i,
  /demo fixture/i,
  /seed data/i,
  /placeholder/i,
  /sample only/i,
  /lorem ipsum/i,
  /closed .* wave \d+/i,
  /evidence chunk \d+/i,
  /source file is part of the .* context layer/i,
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}

function rel(file) {
  return path.relative(ROOT, file);
}

function ext(file) {
  return path.extname(file).toLowerCase().replace(/^\./, '') || 'none';
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  const headers = rows[0]?.map((h) => h.trim()) ?? [];
  return {
    headers,
    records: rows.slice(1).map((values) => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))),
  };
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseJsonl(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const records = [];
  const errors = [];
  lines.forEach((line, index) => {
    const parsed = tryJson(line);
    if (parsed) records.push(parsed);
    else errors.push(index + 1);
  });
  return { records, errors };
}

function uniq(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && String(value).trim() !== ''))];
}

function countHits(text, terms) {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term.toLowerCase())).length;
}

function clampScore(value) {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function scoreThreshold(value, thresholds) {
  let score = 0;
  for (const [limit, points] of thresholds) {
    if (value >= limit) score = points;
  }
  return score;
}

function detectManifestClaims(files) {
  const claims = {};
  files
    .filter((file) => ['README.md', 'manifest.yaml', 'manifest.json'].some((name) => file.endsWith(name)))
    .forEach((file) => {
      const text = fs.readFileSync(file, 'utf8');
      const matches = [...text.matchAll(/([0-9][0-9,]*)\s+(application|app|integration|edge|initiative|vendor|contract|team|role|source file|retrieval chunk|chunk|fact|template|scenario|upload)/gi)];
      claims[rel(file)] = matches.slice(0, 20).map((match) => `${match[1]} ${match[2]}`);
    });
  return claims;
}

function extractIntegrationEdges(jsonLike) {
  if (!jsonLike || typeof jsonLike !== 'object') return 0;
  if (Array.isArray(jsonLike)) return jsonLike.length;
  for (const key of ['edges', 'integrations', 'relationships', 'topology', 'links']) {
    if (Array.isArray(jsonLike[key])) return jsonLike[key].length;
  }
  if (Number.isFinite(jsonLike.edge_count)) return Number(jsonLike.edge_count);
  return 0;
}

function rowCountForPath(pathName, parsed) {
  if (parsed?.records) return parsed.records.length;
  if (Array.isArray(parsed)) return parsed.length;
  return 0;
}

function auditPack(pack) {
  const root = path.join(ROOT, pack.root);
  const files = walk(root);
  const textFiles = files.filter((file) => ['csv', 'json', 'jsonl', 'md', 'yaml', 'yml'].includes(ext(file)));
  const allText = textFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const byExt = {};
  for (const file of files) byExt[ext(file)] = (byExt[ext(file)] ?? 0) + 1;

  const parsedCsv = new Map();
  const parsedJson = new Map();
  const parsedJsonl = new Map();
  const jsonErrors = [];
  for (const file of files) {
    const kind = ext(file);
    if (!['csv', 'json', 'jsonl'].includes(kind)) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (kind === 'csv') parsedCsv.set(file, parseCsv(text));
    if (kind === 'json') {
      const parsed = tryJson(text);
      if (parsed) parsedJson.set(file, parsed);
      else jsonErrors.push(rel(file));
    }
    if (kind === 'jsonl') {
      const parsed = parseJsonl(text);
      parsedJsonl.set(file, parsed);
      if (parsed.errors.length) jsonErrors.push(`${rel(file)} lines ${parsed.errors.join(',')}`);
    }
  }

  const csvSummaries = [...parsedCsv.entries()].map(([file, parsed]) => ({
    path: rel(file),
    localPath: path.relative(root, file),
    rows: parsed.records.length,
    headers: parsed.headers,
  }));
  const jsonlSummaries = [...parsedJsonl.entries()].map(([file, parsed]) => ({
    path: rel(file),
    localPath: path.relative(root, file),
    rows: parsed.records.length,
    errors: parsed.errors,
  }));

  const appRows = csvSummaries
    .filter((f) => /application-portfolio|cmdb|system.*landscape|technology.*landscape/i.test(f.localPath))
    .reduce((sum, f) => sum + f.rows, 0);
  const appIds = uniq([...parsedCsv.entries()].flatMap(([file, parsed]) => {
    if (!/application-portfolio|cmdb/i.test(file)) return [];
    return parsed.records.flatMap((row) => [row.app_id, row.application_id, row.system_name, row.name]);
  }));
  const vendorRows = csvSummaries
    .filter((f) => /vendor|contract/i.test(f.localPath))
    .reduce((sum, f) => sum + f.rows, 0);
  const initiativeRows = csvSummaries
    .filter((f) => /initiative|roadmap/i.test(f.localPath))
    .reduce((sum, f) => sum + f.rows, 0);
  const orgRows = csvSummaries
    .filter((f) => /org|role|team|workforce|persona/i.test(f.localPath))
    .reduce((sum, f) => sum + f.rows, 0);
  const financialRows = csvSummaries
    .filter((f) => /financial|cost|capex|opex|run-cost|budget|renewal|pnl|spend|volume|rate-card/i.test(f.localPath))
    .reduce((sum, f) => sum + f.rows, 0);
  const incidentRows = csvSummaries
    .filter((f) => /incident|change|dora|problem|qms|downtime/i.test(f.localPath))
    .reduce((sum, f) => sum + f.rows, 0);
  const regulatoryRows = csvSummaries
    .filter((f) => /regulatory|risk|control|security|qms|evidence|guardrail|privacy/i.test(f.localPath))
    .reduce((sum, f) => sum + f.rows, 0);
  const sourceDocCount = files.filter((file) => /source-files|source_uploads|reports|contracts|strategy/i.test(file) && ['md', 'pdf', 'docx', 'xlsx'].includes(ext(file))).length;
  const corpusRows = jsonlSummaries
    .filter((f) => /corpus|chunk|pattern|fact|evidence/i.test(f.localPath))
    .reduce((sum, f) => sum + f.rows, 0);
  const uploadTemplateRows = csvSummaries
    .filter((f) => /upload-template|upload_templates|17-upload-templates|source_uploads|pilot-strategy/i.test(f.localPath))
    .reduce((sum, f) => sum + Math.max(1, f.rows), 0)
    + files.filter((file) => /upload|scenario|template/i.test(file) && ['md', 'xlsx', 'docx', 'pdf'].includes(ext(file))).length;

  let integrationEdges = 0;
  for (const [file, parsed] of parsedJson.entries()) {
    if (/integration|topology|landscape|wardley/i.test(path.relative(root, file))) integrationEdges += extractIntegrationEdges(parsed);
  }
  for (const [file, parsed] of parsedCsv.entries()) {
    if (/integration|api|file-transfer|erp-feed|landscape/i.test(path.relative(root, file))) integrationEdges += parsed.records.length;
  }
  const integrationCountFromApps = [...parsedCsv.entries()].flatMap(([file, parsed]) => {
    if (!/application-portfolio/i.test(file)) return [];
    return parsed.records.map((row) => Number(row.integration_count)).filter(Number.isFinite);
  });
  const averageAppIntegrationCount = integrationCountFromApps.length
    ? integrationCountFromApps.reduce((sum, n) => sum + n, 0) / integrationCountFromApps.length
    : null;

  const fixtureHits = [];
  for (const file of textFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const hits = FIXTURE_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
    if (hits.length) fixtureHits.push({ path: rel(file), hits: hits.length });
  }

  const namedSystems = uniq(IT_TERMS.filter((term) => allText.toLowerCase().includes(term)));
  const riskTerms = uniq(RISK_TERMS.filter((term) => allText.toLowerCase().includes(term)));
  const manifestClaims = detectManifestClaims(files);

  const tableRowTotal = csvSummaries.reduce((sum, f) => sum + f.rows, 0)
    + jsonlSummaries.reduce((sum, f) => sum + f.rows, 0);
  const parseableRows = {
    total: tableRowTotal,
    applications: appRows,
    integrations: integrationEdges,
    vendors: vendorRows,
    initiatives: initiativeRows,
    org: orgRows,
    financial: financialRows,
    ops: incidentRows,
    regulatory: regulatoryRows,
    corpus: corpusRows,
    uploadTemplatesAndScenarios: uploadTemplateRows,
  };

  const scores = {
    scale: scoreThreshold(tableRowTotal, [[100, 3], [500, 5], [1000, 7], [2500, 9], [5000, 10]]),
    itComplexity: clampScore(
      scoreThreshold(appRows, [[25, 2], [75, 4], [125, 6], [175, 8], [250, 10]])
      + scoreThreshold(integrationEdges, [[25, 1], [100, 2], [250, 3], [400, 4]])
      + scoreThreshold(namedSystems.length, [[10, 1], [18, 2], [28, 3]])
      + (averageAppIntegrationCount && averageAppIntegrationCount > 20 ? 1 : 0),
    ),
    financialDepth: scoreThreshold(financialRows, [[5, 2], [25, 4], [75, 6], [150, 8], [300, 10]]),
    orgDepth: scoreThreshold(orgRows, [[5, 2], [25, 4], [100, 6], [500, 8], [1000, 10]]),
    vendorDepth: scoreThreshold(vendorRows, [[5, 2], [20, 4], [50, 7], [100, 9], [200, 10]]),
    opsDepth: scoreThreshold(incidentRows, [[5, 2], [25, 4], [75, 7], [150, 9], [300, 10]]),
    regulatoryDepth: clampScore(scoreThreshold(regulatoryRows, [[3, 2], [10, 4], [25, 6], [50, 8], [100, 10]]) + scoreThreshold(riskTerms.length, [[5, 1], [10, 2], [18, 3]])),
    evidenceDepth: clampScore(scoreThreshold(sourceDocCount, [[3, 2], [15, 4], [40, 7], [75, 9], [120, 10]]) + (Object.keys(manifestClaims).length ? 1 : 0)),
    corpusDepth: scoreThreshold(corpusRows, [[25, 2], [100, 4], [250, 7], [500, 9], [1000, 10]]),
    generationQuality: clampScore(10 - scoreThreshold(fixtureHits.length, [[1, 1], [10, 3], [40, 5], [80, 7], [120, 8]]) - (jsonErrors.length ? 1 : 0)),
    loadReadiness: clampScore((pack.loaderRegistered ? 6 : 2) + (corpusRows > 0 ? 2 : 0) + (sourceDocCount > 0 ? 1 : 0) + (jsonErrors.length === 0 ? 1 : 0)),
  };
  const overall = clampScore(Object.values(scores).reduce((sum, value) => sum + value, 0) / Object.values(scores).length);

  const gaps = [];
  if (appRows < 125) gaps.push('Application / CMDB depth below large-enterprise threshold; add system-of-record, middleware, IAM, data, branch/site, network, and control-plane rows.');
  if (integrationEdges < 250) gaps.push('Integration topology is thin for a 50B+ enterprise; add API, batch, event, MFT/SFTP, data replication, and third-party connectivity edges.');
  if (vendorRows < 50) gaps.push('Vendor and contract surface is too small for enterprise concentration-risk analysis.');
  if (orgRows < 100) gaps.push('Ownership model lacks enough roles/teams for realistic accountability and escalation.');
  if (incidentRows < 50) gaps.push('Ops history is too small to support real DORA, reliability, and risk tradeoff analysis.');
  if (corpusRows < 100) gaps.push('Retrieval corpus has too few chunks/facts to be considered live intelligence substrate.');
  if (fixtureHits.length > 0) gaps.push('Fixture-like phrasing detected; rows can be synthetic, but loaded evidence should read like enterprise records, not generated boilerplate.');
  if (!pack.loaderRegistered) gaps.push('No standard tenant-substrate loader registration found; live population needs a governed load path before this pack can be treated as deployed context.');
  if (jsonErrors.length) gaps.push('JSON/JSONL parse errors found; fix before load.');

  const archiveCandidates = [];
  if (fixtureHits.length > 20) {
    archiveCandidates.push({
      scope: 'source evidence files or chunks',
      reason: 'fixture_boilerplate_detected',
      action: 'Archive or regenerate rows whose loaded text is generated boilerplate instead of enterprise source evidence.',
      examples: fixtureHits.slice(0, 8).map((hit) => hit.path),
    });
  }
  if (!pack.loaderRegistered) {
    archiveCandidates.push({
      scope: 'live Source events created from this pack before loader registration',
      reason: 'ungoverned_source_pack_path',
      action: 'Do not load as canonical tenant substrate until a tenant registry entry, evidence receipt, and retrieval proof exist.',
      examples: [pack.root],
    });
  }

  const augmentation = [];
  if (appRows < 150 || integrationEdges < 300) {
    augmentation.push('Add IT estate spine: CMDB/application rows, integration edges, identity/IAM, network/security, data platforms, ERP, observability, workplace, service management, and branch/site technology.');
  }
  if (financialRows < 150) {
    augmentation.push('Add run-cost and value spine: app-level run cost, infra consumption, vendor allocation, project commitments, renewals, cloud cost, labor mix, and depreciation/capex treatment.');
  }
  if (incidentRows < 150) {
    augmentation.push('Add operational history: incidents, changes, problems, DORA time series, DR tests, SLA exceptions, audit findings, and remediation backlog.');
  }
  if (sourceDocCount < 40 || corpusRows < 250) {
    augmentation.push('Add evidence spine: board packs, architecture memos, service owner notes, control evidence, source-file ledger, chunk/fact corpus, and expected Q&A proof.');
  }
  if (fixtureHits.length > 0) {
    augmentation.push('Regenerate source docs/chunks in document-native voices: board memo, architecture record, finance workbook excerpt, risk register, vendor renewal brief, audit evidence, and operations review.');
  }

  return {
    ...pack,
    exists: fs.existsSync(root),
    files: files.length,
    byExt,
    parseableRows,
    averageAppIntegrationCount: averageAppIntegrationCount ? Math.round(averageAppIntegrationCount * 10) / 10 : null,
    namedSystems,
    riskTerms,
    csvSummaries,
    jsonlSummaries,
    jsonErrors,
    manifestClaims,
    fixtureHits,
    scores,
    overall,
    gaps,
    augmentation,
    archiveCandidates,
    decision:
      overall >= 8 && gaps.length <= 2 ? 'load_ready_after_live_proof'
      : overall >= 6 ? 'augment_before_broad_load'
      : 'hold_and_rebuild_before_load',
  };
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\n/g, '<br>')).join(' | ')} |`),
  ].join('\n');
}

function renderMarkdown(result) {
  const lines = [];
  lines.push('# Enterprise Synthetic Data Depth Audit');
  lines.push('');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push('');
  lines.push('## Executive Judgment');
  lines.push('');
  lines.push('The bar for these packs is not "seed data exists." The bar is a synthetic but enterprise-real context substrate: enough systems, dependencies, financials, owners, vendor constraints, incidents, controls, source evidence, and retrieval chunks that Sentinel/Source/Tower answers behave like they are advising a real 50B+ enterprise.');
  lines.push('');
  lines.push(mdTable(
    ['Pack', 'Decision', 'Overall', 'Rows', 'Apps/CMDB', 'Integration edges', 'Vendors', 'Ops rows', 'Corpus', 'Source docs', 'Loader'],
    result.packs.map((pack) => [
      pack.label,
      pack.decision,
      pack.overall,
      pack.parseableRows.total,
      pack.parseableRows.applications,
      pack.parseableRows.integrations,
      pack.parseableRows.vendors,
      pack.parseableRows.ops,
      pack.parseableRows.corpus,
      pack.parseableRows.uploadTemplatesAndScenarios + pack.byExt.md + (pack.byExt.pdf ?? 0) + (pack.byExt.docx ?? 0),
      pack.loaderRegistered ? 'registered' : 'not registered',
    ]),
  ));
  lines.push('');
  lines.push('## Dimension Scores');
  lines.push('');
  lines.push(mdTable(
    ['Pack', ...DIMENSIONS.map((d) => d.label)],
    result.packs.map((pack) => [pack.label, ...DIMENSIONS.map((d) => pack.scores[d.key])]),
  ));
  lines.push('');
  for (const pack of result.packs) {
    lines.push(`## ${pack.label}`);
    lines.push('');
    lines.push(`Target: ${pack.target}. Decision: ${pack.decision}.`);
    lines.push('');
    lines.push('Key measurements:');
    lines.push('');
    lines.push(mdTable(
      ['Metric', 'Value'],
      [
        ['Files', pack.files],
        ['File types', Object.entries(pack.byExt).map(([k, v]) => `${k}:${v}`).join(', ')],
        ['Parseable rows', pack.parseableRows.total],
        ['Application / CMDB rows', pack.parseableRows.applications],
        ['Integration edges', pack.parseableRows.integrations],
        ['Average integration count on app rows', pack.averageAppIntegrationCount ?? 'n/a'],
        ['Vendor / contract rows', pack.parseableRows.vendors],
        ['Financial rows', pack.parseableRows.financial],
        ['Org / role rows', pack.parseableRows.org],
        ['Ops / DORA / incident rows', pack.parseableRows.ops],
        ['Regulatory / risk rows', pack.parseableRows.regulatory],
        ['Corpus / pattern rows', pack.parseableRows.corpus],
        ['Named IT systems detected', pack.namedSystems.slice(0, 20).join(', ') || 'none'],
        ['Risk/control terms detected', pack.riskTerms.slice(0, 20).join(', ') || 'none'],
        ['Fixture-like files', pack.fixtureHits.length],
      ],
    ));
    lines.push('');
    lines.push('Gaps:');
    lines.push('');
    if (pack.gaps.length) pack.gaps.forEach((gap) => lines.push(`- ${gap}`));
    else lines.push('- No major source-file gap detected by the static audit.');
    lines.push('');
    lines.push('Required augmentation before this is treated as enterprise-grade loaded intelligence:');
    lines.push('');
    if (pack.augmentation.length) pack.augmentation.forEach((item) => lines.push(`- ${item}`));
    else lines.push('- No augmentation required beyond live load/retrieval/insight proof.');
    lines.push('');
    lines.push('Archive candidates / holds:');
    lines.push('');
    if (pack.archiveCandidates.length) {
      pack.archiveCandidates.forEach((candidate) => {
        lines.push(`- ${candidate.scope}: ${candidate.reason}. ${candidate.action}`);
        if (candidate.examples?.length) lines.push(`  Examples: ${candidate.examples.join(', ')}`);
      });
    } else {
      lines.push('- No immediate archive candidate from static files. Live Moves and Source rows still need DB provenance checks.');
    }
    lines.push('');
  }
  lines.push('## Live Data Gate');
  lines.push('');
  lines.push('Do not call any client populated until the live data plane proves each state separately: source artifact generated, parse/preflight passed, product loader accepted, object storage staged, parser extracted cited facts/chunks, rows committed to tenant context tables, embeddings/search refreshed, insights evaluated, and signed-in QA retrieved tenant-specific answers.');
  lines.push('');
  lines.push('Minimum read-only live checks before any additional load or archive action:');
  lines.push('');
  lines.push('- Counts by tenant for enterprise_context_sources, enterprise_context_source_files, enterprise_context_records, enterprise_context_facts, enterprise_context_evidence, enterprise_context_chunks, enterprise_context_quality_issues, context_refresh_events, and context_insights.');
  lines.push('- Embedding coverage by tenant: total chunks, embedded chunks, pending/failed chunks, vector/index presence where available.');
  lines.push('- Source/Moves provenance: source_events and engagements counts by lifecycle_state, generated artifact counts, evidence/artifact links, orphaned rows, client_key/client_id mismatches, and rows with fixture/demo text.');
  lines.push('- Retrieval proof: tenant-scoped QA questions over app risk, integration dependency, vendor renewal, run cost, incidents, regulatory controls, and executive decision posture.');
  lines.push('');
  lines.push('## Archive Policy');
  lines.push('');
  lines.push('Moves can be archived today through the existing reversible soft-archive model on engagements. Source events should not be bulk archived without provenance columns or a separate archive ledger; they can be hidden by lifecycle_state, but the audit trail is thinner than Moves. Candidate criteria: generated in the wrong tenant, no evidence/source artifact linkage, fixture/demo boilerplate, orphaned from the tenant substrate, duplicate event_code, or produced outside the governed generation path.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const result = {
  generatedAt: new Date().toISOString(),
  packs: PACKS.map(auditPack),
};
fs.writeFileSync(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(OUT_MD, renderMarkdown(result));
console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
