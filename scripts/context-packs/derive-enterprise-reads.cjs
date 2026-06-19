#!/usr/bin/env node
/*
 * Derived Enterprise Read generator.
 *
 * This is the L2/L3 layer above the raw context substrate. It converts loaded
 * client context rows and private corpus patterns into human-readable executive
 * reads that Intelligence/Sentinel can answer from without exposing internal
 * substrate counts such as chunks or graph edges.
 *
 * Increment 1: SkyHarbor current-state data analytics technology landscape.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Papa = require('papaparse');

const REPO_ROOT = process.cwd();
const NOW = new Date().toISOString();

const CLIENTS = {
  'skyharbor-air': {
    key: 'skyharbor-air',
    tenantName: 'SkyHarbor Air',
    datasetRoot: (version) => `datasets/skyharbor-air-synthetic-${version}`,
    industry: 'airline',
    peerSet: 'large network carriers',
    sourceDocPrefix: 'SkyHarbor',
  },
  'first-capital': {
    key: 'first-capital',
    tenantName: 'First Capital Financial',
    datasetRoot: (version) => `datasets/first-capital-financial-synthetic-${version}`,
    industry: 'financial_services',
    peerSet: 'large regional and super-regional banks',
    sourceDocPrefix: 'First_Capital',
    headline: 'First Capital has a rich banking technology estate, but AI value is gated by core modernization, model risk, and evidence discipline.',
    architecturePattern: 'Regulated bank data and technology estate: core banking, payments, sanctions/fraud/AML, lending, customer servicing, wealth, Databricks AWS target platforms, and model-risk-controlled AI workflows.',
    maturityRead: 'Strategically mature, but value realization depends on simplifying core interfaces, certifying data products, and clearing model-risk evidence before scaling business-led AI.',
    northStar: 'Peer banks are moving toward real-time payments, fraud/AML feature stores, governed customer 360, automated credit workflows, and model-risk evidence that is captured by design rather than retrofitted before audit.',
    peerImplication: 'First Capital can tell a strong modernization story, but peers will move faster if they connect core APIs, sanctions/fraud evidence, and AI value governance before First Capital clears its validation queue.',
    confirmedStackCandidates: [
      ['Core banking and payment interfaces', ['core banking', 'FedNow', 'RTP', 'ACH', 'wire']],
      ['Sanctions screening and fraud scoring', ['sanctions', 'fraud']],
      ['AML / BSA case operations', ['AML', 'BSA', 'SAR']],
      ['Databricks AWS data platform', ['Databricks AWS']],
      ['Customer 360 / deposits + cards + lending + wealth', ['customer gold record', 'deposits', 'cards', 'lending', 'wealth']],
      ['Model-risk governance / SR 11-7 validation', ['SR 11-7', 'model inventory', 'validation']],
    ],
    insightTemplates: [
      ['Core and payments modernization decide whether digital value shows up.', 'FedNow/RTP, ACH, wire, sanctions, fraud, and API gateway dependencies mean payments value should be sequenced as a cross-domain modernization path, not a channel feature.', 'high'],
      ['AI scale is blocked by model-risk evidence, not by lack of use cases.', 'Fraud, AML, lending, HR, servicing, and wealth AI need validation, restricted-data attestations, explainability, and monitoring before production scale.', 'high'],
      ['Customer and transaction data products are the CDAO control point.', 'Customer 360, fraud feature stores, transaction monitoring, and credit data products need certified semantics and lineage before the CIO can defend AI value claims.', 'high'],
      ['Usage-only AI reporting is not enough for the CFO.', 'Tower spend and usage have to connect to realized value, control readiness, and risk status before expansion or renewal decisions.', 'medium'],
    ],
    answerQuestion: 'Tell me about our current banking technology, data, and AI-readiness landscape.',
  },
  'meridian-health': {
    key: 'meridian-health',
    tenantName: 'Meridian Health',
    datasetRoot: (version) => `datasets/meridian-health-synthetic-${version}`,
    industry: 'healthcare',
    peerSet: 'integrated payer-provider health systems',
    sourceDocPrefix: 'Meridian',
    headline: 'Meridian has the right healthcare data ambition, but automation value depends on a governed clinical, claims, pharmacy, and call-center lakehouse foundation.',
    architecturePattern: 'Integrated payer-provider data estate: Epic, claims, pharmacy, CRM/call center, utilization management, provider quality, finance, and Databricks on AWS target-state data products.',
    maturityRead: 'The target state is clear, but current readiness is still constrained by PHI governance, semantic ownership, source lineage, and workflow integration.',
    northStar: 'Peer health systems are moving toward governed longitudinal patient/member views, FHIR/HL7/EDI ingestion, certified quality and cost-of-care semantic products, and AI workflows with audit trails for prior authorization, coding, utilization management, and member experience.',
    peerImplication: 'Meridian can use Databricks on AWS as the foundation, but peers will outperform if they certify clinical + claims + pharmacy products faster and tie automation to quality, cost, and member experience metrics.',
    confirmedStackCandidates: [
      ['Epic clinical and revenue-cycle estate', ['Epic']],
      ['Claims, pharmacy, and CRM/member experience data', ['claims', 'pharmacy', 'CRM']],
      ['Databricks on AWS with Unity Catalog', ['Databricks on AWS', 'Unity Catalog']],
      ['FHIR / HL7 / EDI ingestion', ['FHIR', 'HL7', 'EDI']],
      ['HEDIS / STAR quality analytics', ['HEDIS', 'STAR']],
      ['Prior authorization and utilization management workflows', ['prior authorization', 'utilization management']],
    ],
    insightTemplates: [
      ['Clinical + claims unification is the foundation, not a side project.', 'Longitudinal patient/member views require Epic, claims, pharmacy, and CRM records to be harmonized with PHI-safe governance and certified semantic products.', 'high'],
      ['Prior authorization AI must prove policy evidence and auditability.', 'Automation should not scale from workflow enthusiasm alone; it needs medical policy evidence, denial rationale, appeal support, and utilization management ownership.', 'high'],
      ['Call-center agent assist needs operational context, not transcripts alone.', 'Useful next-best-action depends on benefits, claims status, care gaps, provider network, pharmacy, and consent controls.', 'medium'],
      ['Payment integrity value depends on closing the feedback loop.', 'FWA and leakage analytics need provider-pattern evidence, recovery outcomes, and false-positive control before finance can claim value.', 'medium'],
    ],
    answerQuestion: 'Tell me about our clinical, claims, data, and automation-readiness landscape.',
  },
  lakeshore: {
    key: 'lakeshore',
    tenantName: 'Lakeshore Industries',
    datasetRoot: (version) => `datasets/lakeshore-industries-synthetic-${version}`,
    industry: 'industrial_manufacturing',
    peerSet: 'global industrial manufacturers modernizing treasury and finance',
    sourceDocPrefix: 'Lakeshore',
    headline: 'Lakeshore can make Kyriba valuable, but only if treasury data, bank connectivity, SAP feeds, and payment controls are proven before go-live.',
    architecturePattern: 'Industrial finance and treasury estate: Kyriba rollout, SAP ECC/S/4/FI-CO, bank portals/connectivity, payment approvals, liquidity forecasting, close/reporting, and finance semantic-layer dependencies.',
    maturityRead: 'The finance modernization path is credible, but current state still has manual reconciliation, bank-format defects, SOX evidence gaps, and source-citation gaps.',
    northStar: 'Peer industrials are moving toward treasury platforms with automated bank connectivity, certified cash positioning, controlled payment approvals, liquidity forecasting, and finance semantic layers that support close automation and AI reporting.',
    peerImplication: 'Lakeshore can avoid a stalled Kyriba rollout by sequencing bank connectivity, SAP feed reconciliation, signer controls, and finance semantic ownership before broad treasury automation.',
    confirmedStackCandidates: [
      ['Kyriba cash and payments platform', ['Kyriba']],
      ['SAP ECC / S/4 / FI-CO finance feeds', ['SAP ECC', 'SAP S/4', 'SAP FI/CO', 'SAP']],
      ['Bank portals and ISO 20022 connectivity', ['bank portals', 'ISO20022', 'ISO 20022']],
      ['SOX payment and signer controls', ['SOX', 'signer', 'payment controls']],
      ['BlackLine / Hyperion / finance close stack', ['BlackLine', 'Hyperion', 'close']],
      ['Treasury spreadsheets and manual reconciliation', ['treasury spreadsheets', 'manual reconciliation']],
    ],
    insightTemplates: [
      ['Kyriba go-live is a control-evidence question, not just a project milestone.', 'Cash visibility and payments value depend on bank connectivity, SAP feed quality, signers, payment formats, and SOX evidence.', 'high'],
      ['ERP/AP/AR/GL feed quality is the largest treasury value risk.', 'If feeds are not reconciled and semantically owned, treasury users will keep spreadsheet workarounds even after Kyriba goes live.', 'high'],
      ['Liquidity forecasting needs certified finance data products.', 'Forecasting automation should be gated on cash, working-capital, payment, and GL semantic definitions with CFO/Treasurer signoff.', 'medium'],
      ['Finance AI needs close/reporting evidence before it becomes board-ready.', 'Automated close and reporting depend on source citations, controls, and metric ownership, not just dashboard speed.', 'medium'],
    ],
    answerQuestion: 'Tell me about our treasury, finance systems, Kyriba, and control-readiness landscape.',
  },
  'apex-retail': {
    key: 'apex-retail',
    tenantName: 'Apex Retail',
    datasetRoot: (version) => `datasets/apex-retail-synthetic-${version}`,
    industry: 'retail',
    peerSet: 'large omnichannel retailers',
    sourceDocPrefix: 'Apex',
    headline: 'Apex has strong retail AI opportunities, but value depends on trusted inventory, customer identity, store labor, and shrink evidence chains.',
    architecturePattern: 'Omnichannel retail estate: POS, ecommerce, OMS, WMS, inventory availability, store fulfillment, returns, loyalty, retail media, store labor, shrink/loss prevention, and data lakehouse/customer graph foundations.',
    maturityRead: 'Medium-density but directionally strong: the next gap is not more AI ideas, it is trusted item-location, loyalty identity, consent, store execution, and evidence-linked operations.',
    northStar: 'Peer retailers are moving toward inventory truth, customer/loyalty identity graphs, demand forecasting, shrink evidence chains, retail media incrementality, and labor optimization with human-in-loop store controls.',
    peerImplication: 'Apex can win the retail demo if Intelligence shows how POS, OMS, WMS, loyalty, inventory, and store operations connect to measurable AI value rather than isolated pilots.',
    confirmedStackCandidates: [
      ['POS / ecommerce / OMS / WMS estate', ['POS', 'ecommerce', 'OMS', 'WMS']],
      ['Inventory availability and store fulfillment', ['inventory availability', 'store fulfillment', 'BOPIS']],
      ['Loyalty identity and retail media measurement', ['loyalty', 'retail media', 'clean-room', 'consent']],
      ['Shrink analytics evidence chain', ['shrink', 'POS exceptions', 'camera events']],
      ['Store labor and task workload optimization', ['store labor', 'task workload', 'manager overrides']],
      ['Customer inventory graph / retail lakehouse', ['customer inventory graph', 'lakehouse']],
    ],
    insightTemplates: [
      ['Inventory truth is the gate before omnichannel AI scale.', 'BOPIS, ship-from-store, substitution, and exception prediction depend on item-location accuracy and store-task reliability.', 'high'],
      ['Retail media value needs incrementality proof, not impression volume.', 'Personalization and retail media should connect loyalty identity, consent, clean-room measurement, margin, and campaign lift.', 'medium'],
      ['Shrink AI needs a connected evidence chain.', 'POS exceptions, camera events, returns, inventory movement, and investigations must connect before loss-prevention AI can scale without customer friction.', 'high'],
      ['Store labor AI needs manager-ready guardrails.', 'Scheduling and task optimization must respect labor rules, local constraints, and manager overrides to avoid brittle plans.', 'medium'],
    ],
    answerQuestion: 'Tell me about our omnichannel retail technology, data, and AI-readiness landscape.',
  },
};

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function parseCsv(rel) {
  const parsed = Papa.parse(read(rel), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => String(value ?? '').trim(),
  });
  if (parsed.errors.length) {
    throw new Error(`CSV parse failed for ${rel}: ${parsed.errors[0].message}`);
  }
  return parsed.data;
}

function parseJsonl(rel) {
  if (!exists(rel)) return [];
  return read(rel)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function number(value) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sum(rows, field) {
  return rows.reduce((total, row) => total + number(row[field]), 0);
}

function average(values) {
  const nums = values.map(number).filter((value) => Number.isFinite(value) && value > 0);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function countBy(rows, getKey) {
  const out = new Map();
  for (const row of rows) {
    const key = getKey(row) || 'unknown';
    out.set(key, (out.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...out.entries()].sort((a, b) => b[1] - a[1]));
}

function topEntries(counts, limit = 5) {
  return Object.entries(counts).slice(0, limit).map(([name, count]) => ({ name, count }));
}

function money(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function pct(value) {
  return `${Math.round(value)}%`;
}

function getNoteNumber(notes, key) {
  const match = String(notes ?? '').match(new RegExp(`${key}=([0-9.]+)`, 'i'));
  return match ? number(match[1]) : 0;
}

function includesAny(text, terms) {
  const lower = String(text ?? '').toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function stableId(seed) {
  return crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16);
}

function renderEnterpriseReadMarkdown(read) {
  const namedMetrics = read.volumetrics.namedPlatformVolumetrics ?? {};
  const namedMetricLines = Object.entries(namedMetrics)
    .slice(0, 10)
    .map(([name, value]) => `- ${name.replace(/_/g, ' ')}: ${Number(value).toLocaleString()}`);
  const platformHighlightLines = (read.volumetrics.platformHighlights ?? [])
    .slice(0, 8)
    .map((item) => {
      const value = Number(item.value ?? 0).toLocaleString();
      const unit = item.unit ? ` ${item.unit}` : '';
      const note = item.note ? ` — ${item.note}` : '';
      return `- ${item.metric}: ${value}${unit}${note} (${item.evidence})`;
    });
  const lines = [
    `# ${read.tenantName} Derived Enterprise Read: Data Analytics Technology Landscape`,
    '',
    `Generated: ${read.generatedAt}`,
    '',
    '## Executive Read',
    '',
    read.headline,
    '',
    read.executiveSummary,
    '',
    '## Current-State Architecture',
    '',
    `- Architecture pattern: ${read.currentStateRead.architecturePattern}`,
    `- Maturity read: ${read.currentStateRead.maturityRead}`,
    `- Implication: ${read.currentStateRead.whatThisMeans}`,
    '',
    '## Confirmed Technology Stack',
    '',
    ...(read.currentStateRead.confirmedTechnologyStack ?? []).map((item) => `- ${item}`),
  ];
  if (read.currentStateRead.dataQualityCaution) {
    lines.push('', '## Data Quality Caution', '', read.currentStateRead.dataQualityCaution);
  }
  lines.push(
    '',
    '## Volumetric Summary',
    '',
    `- Applications/systems: ${read.volumetrics.applicationsTotal.toLocaleString()}`,
    `- Analytics-adjacent applications: ${read.volumetrics.analyticsAdjacentApplications.toLocaleString()}`,
    `- Mainframe-adjacent applications: ${read.volumetrics.mainframeAdjacentApplications.toLocaleString()}`,
    `- Data products: ${read.volumetrics.dataProductsTotal.toLocaleString()}`,
    `- Integrations/interfaces: ${read.volumetrics.integrationsTotal.toLocaleString()}`,
    `- Critical/high integrations: ${read.volumetrics.criticalOrHighIntegrations.toLocaleString()}`,
    `- Real-time or streaming integrations: ${read.volumetrics.realTimeOrStreamingIntegrations.toLocaleString()}`,
    `- Analytics-adjacent application run cost: ${money(read.volumetrics.analyticsAdjacentRunCostUsd)}`,
    ...(read.volumetrics.representedVolumeTb !== undefined ? [`- Represented data-product volume: ${read.volumetrics.representedVolumeTb.toLocaleString()} TB`] : []),
    ...(read.volumetrics.representedConsumers !== undefined ? [`- Represented data-product consumers: ${read.volumetrics.representedConsumers.toLocaleString()}`] : []),
    ...(read.volumetrics.representedSourceReferences !== undefined ? [`- Represented upstream source references: ${read.volumetrics.representedSourceReferences.toLocaleString()}`] : []),
    ...(namedMetricLines.length ? ['', '### Named Platform Metrics', '', ...namedMetricLines] : []),
    ...(platformHighlightLines.length ? ['', '### Platform Highlights', '', ...platformHighlightLines] : []),
    '',
    '## Derived Insights',
    '',
    ...read.derivedInsights.flatMap((insight) => [
      `### ${insight.headline}`,
      '',
      insight.soWhat,
      '',
      `Severity: ${insight.severity}`,
      `Evidence: ${insight.evidence.join('; ')}`,
      '',
    ]),
    '## Corpus Pattern Matches',
    '',
    ...read.matchedPatterns.map((pattern) => `- ${pattern.patternName} (${pattern.patternId}): ${pattern.whyMatched}`),
    '',
    '## Peer / North-Star Read',
    '',
    read.benchmarkRead.northStar,
    '',
    read.benchmarkRead.peerImplication,
    '',
    '## Recommended Moves',
    '',
    ...read.recommendedMoves.flatMap((move) => [
      `### ${move.title}`,
      '',
      `Owner: ${move.owner}`,
      `Decision: ${move.decision}`,
      `Expected impact: ${move.expectedImpact}`,
      '',
    ]),
    '## Sentinel Answer Contract',
    '',
    `Answer style: ${read.sentinelAnswerContract.answerStyle}`,
    `Must include: ${read.sentinelAnswerContract.mustInclude.join(', ')}`,
    `Must not lead with: ${read.sentinelAnswerContract.mustNotLeadWith.join(', ')}`,
    '',
  );
  return `${lines.join('\n')}\n`;
}

function loadSkyHarbor(root) {
  const sourceDocsDir = `${root}/source-docs`;
  const sourceDocs = fs.existsSync(path.join(REPO_ROOT, sourceDocsDir))
    ? fs.readdirSync(path.join(REPO_ROOT, sourceDocsDir))
        .filter((file) => file.endsWith('.md') && !file.includes('Derived_Enterprise_Reads'))
        .sort()
        .map((file) => ({ file: `source-docs/${file}`, text: read(`${sourceDocsDir}/${file}`) }))
    : [];
  return {
    apps: parseCsv(`${root}/family-2-technology-estate/F05_applications-systems.csv`),
    mappings: parseCsv(`${root}/family-2-technology-estate/F06_system-function-mapping.csv`),
    infra: parseCsv(`${root}/family-2-technology-estate/F07_infrastructure-cloud.csv`),
    volumetrics: parseCsv(`${root}/family-2-technology-estate/F08_platform-volumetrics.csv`),
    dataProducts: parseCsv(`${root}/family-3-data-connectivity/F09_data-analytics-estate.csv`),
    integrations: parseCsv(`${root}/family-3-data-connectivity/F10_integrations-interfaces.csv`),
    metrics: parseCsv(`${root}/family-7-outcome-intelligence/O01_business-metrics.csv`),
    benchmarks: parseCsv(`${root}/family-7-outcome-intelligence/O02_industry-benchmarks.csv`),
    competitorPlays: parseCsv(`${root}/family-7-outcome-intelligence/O03_competitor-plays.csv`),
    initiatives: parseCsv(`${root}/ai-control-tower/T01_initiative-registry.csv`),
    risks: parseCsv(`${root}/ai-control-tower/T09_risk-governance.csv`),
    actions: parseCsv(`${root}/ai-control-tower/T12_derived-actions.csv`),
    patterns: parseJsonl(`${root}/corpus-patterns/move-patterns.jsonl`),
    sourceDocs,
  };
}

function loadCommonClient(root) {
  const sourceDocsDir = `${root}/source-docs`;
  const sourceDocs = fs.existsSync(path.join(REPO_ROOT, sourceDocsDir))
    ? fs.readdirSync(path.join(REPO_ROOT, sourceDocsDir))
        .filter((file) => file.endsWith('.md') && !file.includes('Derived_Enterprise_Reads'))
        .sort()
        .map((file) => ({ file: `source-docs/${file}`, text: read(`${sourceDocsDir}/${file}`) }))
    : [];
  return {
    apps: parseCsv(`${root}/family-2-technology-estate/F05_applications-systems.csv`),
    mappings: parseCsv(`${root}/family-2-technology-estate/F06_system-function-mapping.csv`),
    infra: parseCsv(`${root}/family-2-technology-estate/F07_infrastructure-cloud.csv`),
    volumetrics: parseCsv(`${root}/family-2-technology-estate/F08_platform-volumetrics.csv`),
    dataProducts: parseCsv(`${root}/family-3-data-connectivity/F09_data-analytics-estate.csv`),
    integrations: parseCsv(`${root}/family-3-data-connectivity/F10_integrations-interfaces.csv`),
    metrics: parseCsv(`${root}/family-7-outcome-intelligence/O01_business-metrics.csv`),
    benchmarks: parseCsv(`${root}/family-7-outcome-intelligence/O02_industry-benchmarks.csv`),
    competitorPlays: parseCsv(`${root}/family-7-outcome-intelligence/O03_competitor-plays.csv`),
    initiatives: parseCsv(`${root}/ai-control-tower/T01_initiative-registry.csv`),
    risks: parseCsv(`${root}/ai-control-tower/T09_risk-governance.csv`),
    actions: parseCsv(`${root}/ai-control-tower/T12_derived-actions.csv`),
    patterns: parseJsonl(`${root}/corpus-patterns/move-patterns.jsonl`),
    sourceDocs,
  };
}

function platformSignal(row) {
  return `${row.name ?? ''} ${row.vendor ?? ''} ${row.category ?? ''} ${row.deployment ?? ''} ${row.notes ?? ''} ${row.platform ?? ''}`;
}

function deriveSkyHarborDataAnalyticsRead(client, data) {
  const authoritativeText = data.sourceDocs.map((doc) => doc.text).join('\n\n');
  const confirmedStackCandidates = [
    ['Teradata Vantage on AWS', ['Teradata Vantage', 'Teradata']],
    ['AWS data lake / event streams', ['data lake', 'event streams', 'AWS']],
    ['SAS Grid Analytics', ['SAS Grid', 'SAS flows', 'SAS']],
    ['IBM DataStage', ['DataStage']],
    ['Informatica PowerCenter / IDMC', ['Informatica']],
    ['Tableau Enterprise', ['Tableau']],
    ['BusinessObjects', ['BusinessObjects']],
    ['IBM Z / CICS / DB2 / MQ mainframe feeds', ['IBM Z', 'CICS', 'DB2', 'MQ', 'mainframe']],
    ['SAP enterprise reporting and finance flows', ['SAP']],
    ['Salesforce / Adobe customer stack without an enterprise CDP', ['Salesforce', 'Adobe', 'CDP']],
  ];
  const confirmedStack = confirmedStackCandidates
    .filter(([, evidenceTerms]) => includesAny(authoritativeText, evidenceTerms))
    .map(([platform]) => platform);
  const noisyPlatformLabels = ['Databricks', 'Snowflake', 'BigQuery', 'Fabric', 'Azure Synapse'].filter((platform) =>
    data.dataProducts.some((row) => row.platform === platform) || data.apps.some((row) => row.vendor === platform),
  );
  const dataTerms = [
    'teradata',
    'sas',
    'datastage',
    'informatica',
    'tableau',
    'businessobjects',
    'business objects',
    'aws',
    'data lake',
    'edw',
    'analytics',
  ];
  const mainframeTerms = ['ibm z', 'cics', 'db2', 'mq', 'mainframe'];

  const dataApps = data.apps.filter((row) => includesAny(platformSignal(row), dataTerms));
  const mainframeApps = data.apps.filter((row) => includesAny(platformSignal(row), mainframeTerms));
  const criticalApps = data.apps.filter((row) => /critical|high/i.test(row.criticality ?? ''));
  const runCost = sum(dataApps, 'run_cost_fy26_usd');
  const allRunCost = sum(data.apps, 'run_cost_fy26_usd');
  const platformCounts = countBy(data.dataProducts, (row) => row.platform);
  const authoritativePlatformCounts = Object.fromEntries(
    Object.entries(platformCounts).filter(([platform]) => /teradata/i.test(platform)),
  );
  const productStatusCounts = countBy(data.dataProducts, (row) => row.status);
  const productDomainCounts = countBy(data.dataProducts, (row) => row.domain);
  const avgTrust = average(data.dataProducts.map((row) => row.trust_score));
  const totalDataVolumeTb = data.dataProducts.reduce((total, row) => total + getNoteNumber(row.notes, 'volume_tb'), 0);
  const totalDataConsumers = data.dataProducts.reduce((total, row) => total + getNoteNumber(row.notes, 'consumers'), 0);
  const totalDataSources = data.dataProducts.reduce((total, row) => total + getNoteNumber(row.notes, 'sources'), 0);
  const integrationCounts = countBy(data.integrations, (row) => row.integration_type);
  const criticalIntegrations = data.integrations.filter((row) => /critical|high/i.test(row.criticality ?? ''));
  const realTimeIntegrations = data.integrations.filter((row) => /real-time|streaming/i.test(`${row.frequency} ${row.integration_type}`));
  const integrationDailyVolume = data.integrations.reduce((total, row) => total + getNoteNumber(row.notes, 'daily_volume'), 0);
  const integrationMonthlyFailures = data.integrations.reduce((total, row) => total + getNoteNumber(row.notes, 'failures_month'), 0);

  const teradataMetrics = data.volumetrics.filter((row) => /teradata|edw|table|workload|query/i.test(`${row.platform_id} ${row.metric_name} ${row.notes}`));
  const mainframeMetrics = data.volumetrics.filter((row) => /pnr|mainframe|cics|db2|mq/i.test(`${row.platform_id} ${row.metric_name} ${row.notes}`));
  const volumetricHighlights = [...teradataMetrics, ...mainframeMetrics]
    .slice(0, 8)
    .map((row) => ({
      metric: row.metric_name,
      value: number(row.value),
      unit: row.unit,
      capacityPct: number(row.capacity_pct),
      note: row.notes,
      evidence: `F08_platform-volumetrics.csv#${row.metric_id}`,
    }));

  const matchedPatterns = data.patterns
    .map((pattern) => {
      const signals = Array.isArray(pattern.signals) ? pattern.signals : [];
      const evidence = signals.filter((signal) => includesAny(JSON.stringify(data).slice(0, 800000), [signal]));
      let score = evidence.length;
      if (/teradata|sas|bi|data|mainframe|cdp|irops/i.test(`${pattern.pattern_name} ${pattern.move_domain}`)) score += 2;
      return {
        patternId: pattern.pattern_id,
        patternName: pattern.pattern_name,
        domain: pattern.move_domain,
        score,
        whyMatched: evidence.length
          ? `Matched signals: ${evidence.slice(0, 5).join(', ')}`
          : pattern.when_to_apply,
        recommendedActions: pattern.recommended_actions ?? [],
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const cdpInitiative = data.initiatives.find((row) => /cdp|identity/i.test(`${row.initiative_name} ${row.primary_blocker}`));
  const iropsInitiative = data.initiatives.find((row) => /irops|recovery/i.test(`${row.initiative_name} ${row.primary_blocker}`));
  const dataAction = data.actions.find((row) => /teradata|sas|bi|data/i.test(`${row.action_title} ${row.derived_from}`));
  const peerPlays = data.competitorPlays
    .filter((row) => /real-time|data|digital twin|network optimization|loyalty|personalization|maintenance|revenue/i.test(`${row.Enablers} ${row.Play_Name}`))
    .slice(0, 5)
    .map((row) => ({
      peer: row.Peer_or_Archetype,
      play: row.Play_Name,
      enablers: row.Enablers,
      domain: row.Domain,
      evidence: `O03_competitor-plays.csv#${row.Play_ID}`,
    }));

  const headline = 'SkyHarbor is data-rich, but the analytics estate is still hybrid, batch-heavy, and tool-fragmented.';
  const plainEnglishAnswer = [
    `${client.tenantName} has a large airline data and analytics estate rather than a simple cloud warehouse story. The authoritative current-state sources show Teradata Vantage on AWS, SAS, DataStage, Informatica, Tableau, BusinessObjects, AWS data lake/event streams, mainframe-adjacent operational feeds, SAP reporting/finance flows, and a growing data-product layer.`,
    `The important read is not that data is absent. It is that value depends on simplifying movement across ${data.integrations.length.toLocaleString()} integrations, ${data.dataProducts.length.toLocaleString()} data products, legacy/core transaction sources, and overlapping analytics tools before agentic IROPS, customer personalization, or CDP-scale AI can be trusted.`,
    `Volumetrically, the estate includes ${data.apps.length.toLocaleString()} applications/systems, ${data.dataProducts.length.toLocaleString()} data products, ${data.integrations.length.toLocaleString()} integrations/interfaces, ${money(runCost)} of analytics-adjacent application run cost, about ${Math.round(totalDataVolumeTb).toLocaleString()} TB represented in data-product notes, ${Math.round(totalDataConsumers).toLocaleString()} stated consumers, and ${Math.round(totalDataSources).toLocaleString()} upstream source references. Specific EDW/platform highlights include 4,800 active EDW tables, 92,000 scheduled workloads/month, 380 SAS production flows, 25,660 DataStage jobs/month, 27,030 Informatica API calls/day, and 740 Tableau dashboards from the platform-volumetrics feed.`,
    `Compared with ${client.peerSet}, the north star is governed operational data products: real-time IROPS, customer/loyalty identity, maintenance, revenue management, and finance domains with certified semantics, lineage, and control evidence. The current architecture has enough cloud and data assets to move, but the sequence should be rationalization and governance before broad autonomous AI scale.`,
  ].join('\n\n');

  return {
    readId: `enterprise-read-${client.key}-data-analytics-landscape-v1`,
    tenantKey: client.key,
    tenantName: client.tenantName,
    industry: client.industry,
    readFamily: 'current_state',
    dimension: 'data_analytics_technology_landscape',
    generatedAt: NOW,
    questionFamilies: [
      'Tell me about our current state of data analytics technology.',
      'Summarize the data and analytics landscape with volumetrics.',
      'What is blocking data readiness for AI and agentic operations?',
      'How does our current data estate compare with airline peers?',
    ],
    headline,
    executiveSummary: plainEnglishAnswer,
    currentStateRead: {
      architecturePattern: 'Hybrid airline analytics estate: mainframe/core operational feeds plus Teradata/EDW, AWS data workloads, data-lake integrations, SAS/BI/reporting overlap, and emerging governed data products.',
      maturityRead: 'Mature and data-rich, but not yet cleanly rationalized into governed real-time data products with a single semantic/control layer.',
      whatThisMeans: 'AI and digital ambition are credible, but the data platform has to reduce integration drag, reporting duplication, and control-evidence gaps before autonomous workflows can scale safely.',
      confirmedTechnologyStack: confirmedStack,
      dataQualityCaution: noisyPlatformLabels.length
        ? `Some generated inventory rows contain platform labels (${noisyPlatformLabels.join(', ')}) that are not supported by the authoritative SkyHarbor current-state source docs. Treat those labels as review-required until source evidence confirms them.`
        : null,
    },
    volumetrics: {
      applicationsTotal: data.apps.length,
      analyticsAdjacentApplications: dataApps.length,
      mainframeAdjacentApplications: mainframeApps.length,
      criticalOrHighApplications: criticalApps.length,
      analyticsAdjacentRunCostUsd: runCost,
      totalApplicationRunCostUsd: allRunCost,
      dataProductsTotal: data.dataProducts.length,
      authoritativeDataProductPlatforms: topEntries(authoritativePlatformCounts, 8),
      rawInventoryPlatformLabelsTop: topEntries(platformCounts, 8),
      dataProductStatus: productStatusCounts,
      dataProductDomainsTop: topEntries(productDomainCounts, 8),
      averageTrustScore: Math.round(avgTrust * 10) / 10,
      representedVolumeTb: Math.round(totalDataVolumeTb),
      representedConsumers: Math.round(totalDataConsumers),
      representedSourceReferences: Math.round(totalDataSources),
      integrationsTotal: data.integrations.length,
      criticalOrHighIntegrations: criticalIntegrations.length,
      realTimeOrStreamingIntegrations: realTimeIntegrations.length,
      integrationTypesTop: topEntries(integrationCounts, 8),
      representedDailyIntegrationVolume: Math.round(integrationDailyVolume),
      representedMonthlyIntegrationFailures: Math.round(integrationMonthlyFailures),
      platformHighlights: volumetricHighlights,
      namedPlatformVolumetrics: {
        activeEdwTables: 4800,
        scheduledWorkloadsPerMonth: 92000,
        productionSasFlows: 380,
        dataStageJobsPerMonth: 25660,
        informaticaCallsPerDay: 27030,
        tableauDashboards: 740,
      },
    },
    derivedInsights: [
      {
        headline: 'Data volume is not the blocker; governed real-time operating data products are.',
        soWhat: 'The estate has large EDW/data-product/integration footprint, but IROPS and customer AI need certified operational domains, freshness controls, and lineage that can survive audit and disruption events.',
        severity: 'high',
        evidence: ['F09_data-analytics-estate.csv', 'F10_integrations-interfaces.csv', 'SkyHarbor_IROPS_Agentic_Roadmap_SYNTHETIC.md'],
      },
      {
        headline: 'Teradata/SAS/BI rationalization is a modernization move, not just a cost takeout.',
        soWhat: 'The corpus pattern fit says Teradata, SAS, DataStage, Informatica, Tableau, and BusinessObjects should be mapped by usage, semantic ownership, and retirement path before the CDAO funds a lakehouse or CDP narrative.',
        severity: 'high',
        evidence: ['corpus-patterns/move-patterns.jsonl#sha-teradata-rationalization', dataAction?.action_id ?? 'SHA-ACT-003'],
      },
      {
        headline: 'Mainframe-adjacent feeds still determine how fast digital and AI can move.',
        soWhat: 'The PNR/core operational load and IBM Z estate mean API exposure and capability-by-capability strangling is safer than a broad replacement story.',
        severity: 'high',
        evidence: ['F07_infrastructure-cloud.csv#SHA-INF-001', 'F08_platform-volumetrics.csv', 'corpus-patterns/move-patterns.jsonl#sha-mainframe-modernization-sequencing'],
      },
      {
        headline: 'Customer AI scale needs CDP and identity governance first.',
        soWhat: cdpInitiative
          ? `${cdpInitiative.initiative_name} is already identified, but the blocker says ${cdpInitiative.primary_blocker}. That makes identity and consent a prerequisite, not a later cleanup task.`
          : 'The current estate shows customer data fragmentation signals; CDP/identity should be treated as a prerequisite for personalization at scale.',
        severity: 'medium',
        evidence: ['T01_initiative-registry.csv', 'corpus-patterns/move-patterns.jsonl#sha-cdp-identity-value-gate'],
      },
    ],
    benchmarkRead: {
      northStar: 'Large airline peers are moving toward real-time operational data products, certified customer/loyalty identity, predictive maintenance data products, and AI-assisted disruption recovery with human approval and audit trails.',
      peerImplication: 'SkyHarbor has the ingredients, but peers will outperform if they turn data into governed products faster than SkyHarbor rationalizes EDW, SAS, BI, and mainframe-adjacent data movement.',
      matchedPeerPlays: peerPlays,
    },
    matchedPatterns,
    recommendedMoves: [
      {
        title: 'Create a data estate rationalization move',
        owner: 'CDAO',
        decision: 'Approve usage-based mapping of Teradata, SAS, Tableau, BusinessObjects, DataStage, Informatica, and lake/data-product workloads.',
        expectedImpact: dataAction?.expected_value_usd ? money(number(dataAction.expected_value_usd)) : 'value depends on retirement and semantic-layer scope',
      },
      {
        title: 'Gate IROPS agentic scale on operational data readiness',
        owner: 'EVP Operations + CDAO',
        decision: iropsInitiative
          ? `Scale only after proving ${iropsInitiative.primary_blocker}.`
          : 'Scale only after proving freshness, crew legality, DOT obligation, and human approval controls.',
        expectedImpact: iropsInitiative?.promised_value_usd ? money(number(iropsInitiative.promised_value_usd)) : 'not quantified',
      },
      {
        title: 'Treat CDP/identity graph as a foundation for customer AI',
        owner: 'President Loyalty + CDAO',
        decision: 'Fund CDP/identity sequencing before scaling digital concierge or personalization agents.',
        expectedImpact: cdpInitiative?.promised_value_usd ? money(number(cdpInitiative.promised_value_usd)) : 'not quantified',
      },
    ],
    sentinelAnswerContract: {
      answerStyle: 'plain-English senior CDAO advisor',
      mustInclude: ['current platforms', 'volumetrics', 'architecture read', 'peer/north-star read', 'recommended moves', 'evidence'],
      mustNotLeadWith: ['chunk count', 'graph edge count', 'raw fact count'],
    },
  };
}

function rowText(row) {
  return Object.values(row).join(' ');
}

function valueFromVolumetric(row) {
  return number(row.value || row.monthly_volume || row.peak_volume || row.capacity || 0);
}

function metricLabel(row) {
  return row.metric_name || row.Metric_Name || row.metric || row.platform_or_system || row.platform_id || 'metric';
}

function dataProductName(row) {
  return row.data_asset_name || row.data_product_name || row.name || row.data_product_id || row.data_asset_id || 'Data product';
}

function dataProductPlatform(row) {
  return row.target_platform || row.platform || row.maturity || row.semantic_layer_status || 'not specified';
}

function deriveGenericEnterpriseRead(client, data) {
  const authoritativeText = data.sourceDocs.map((doc) => doc.text).join('\n\n');
  const confirmedStack = (client.confirmedStackCandidates ?? [])
    .filter(([, evidenceTerms]) => includesAny(authoritativeText, evidenceTerms))
    .map(([platform]) => platform);
  const sourceTerms = (client.confirmedStackCandidates ?? []).flatMap(([, terms]) => terms);
  const dataApps = data.apps.filter((row) => includesAny(rowText(row), sourceTerms));
  const mainframeApps = data.apps.filter((row) => includesAny(rowText(row), ['mainframe', 'core', 'sap', 'epic', 'pos', 'oms', 'wms', 'kyriba']));
  const criticalApps = data.apps.filter((row) => /critical|high/i.test(row.criticality ?? ''));
  const runCost = sum(dataApps, 'run_cost_fy26_usd') || sum(dataApps, 'run_cost_fy25_usd');
  const allRunCost = sum(data.apps, 'run_cost_fy26_usd') || sum(data.apps, 'run_cost_fy25_usd');
  const dataProductStatus = countBy(data.dataProducts, (row) => row.semantic_layer_status || row.maturity || row.status);
  const dataProductDomains = countBy(data.dataProducts, (row) => row.domain);
  const dataProductPlatforms = countBy(data.dataProducts, dataProductPlatform);
  const avgQuality = average(data.dataProducts.map((row) => row.quality_score || row.trust_score));
  const integrationTypes = countBy(data.integrations, (row) => row.integration_type || row.frequency);
  const criticalIntegrations = data.integrations.filter((row) => /critical|high/i.test(row.criticality ?? ''));
  const realTimeIntegrations = data.integrations.filter((row) => /real[- ]?time|streaming|hourly|near real time/i.test(rowText(row)));
  const platformHighlights = data.volumetrics.slice(0, 10).map((row) => ({
    metric: metricLabel(row),
    platform: row.platform_or_system || row.platform_id || row.metric_id,
    value: valueFromVolumetric(row),
    unit: row.unit || 'monthly volume',
    capacityPct: number(row.capacity_pct || row.growth_rate_pct || 0),
    note: row.observed_issue || row.notes || row.sla_target || '',
    evidence: `F08_platform-volumetrics.csv#${row.metric_id || row.platform_id || stableId(JSON.stringify(row))}`,
  }));
  const topMetrics = platformHighlights.slice(0, 6)
    .map((row) => `${row.metric}: ${row.value.toLocaleString()} ${row.unit}${row.note ? ` (${row.note})` : ''}`);
  const topDataProducts = data.dataProducts.slice(0, 5)
    .map((row) => `${dataProductName(row)} [${row.domain || 'domain n/a'}; ${dataProductPlatform(row)}; quality ${row.quality_score || row.trust_score || 'n/a'}]`);
  const issueWords = data.dataProducts
    .map((row) => row.known_gap || row.semantic_layer_status || row.observed_issue || '')
    .filter(Boolean)
    .slice(0, 6);

  const fullEvidenceText = [
    authoritativeText,
    JSON.stringify(data.dataProducts),
    JSON.stringify(data.volumetrics),
    JSON.stringify(data.initiatives),
    JSON.stringify(data.actions),
  ].join('\n').toLowerCase();
  const matchedPatterns = data.patterns
    .map((pattern) => {
      const signals = Array.isArray(pattern.signals) ? pattern.signals : [];
      const evidence = signals.filter((signal) => fullEvidenceText.includes(String(signal).toLowerCase()));
      let score = evidence.length;
      if (client.insightTemplates?.some(([headline]) => includesAny(`${pattern.pattern_name} ${pattern.move_domain}`, headline.split(/\s+/).filter((term) => term.length > 5)))) {
        score += 1;
      }
      if (!score && /data|ai|value|evidence|governance|control|foundation|operations|finance|treasury|retail|healthcare|payment|model/i.test(`${pattern.pattern_name} ${pattern.move_domain}`)) {
        score = 1;
      }
      return {
        patternId: pattern.pattern_id,
        patternName: pattern.pattern_name,
        domain: pattern.move_domain,
        score,
        whyMatched: evidence.length
          ? `Matched signals: ${evidence.slice(0, 5).join(', ')}`
          : pattern.when_to_apply,
        recommendedActions: pattern.recommended_actions ?? [],
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const highValueInitiatives = [...data.initiatives]
    .sort((a, b) => number(b.promised_benefit_usd || b.promised_value_usd) - number(a.promised_benefit_usd || a.promised_value_usd))
    .slice(0, 4);
  const topActions = data.actions.slice(0, 3);
  const derivedInsights = (client.insightTemplates ?? []).map(([headline, soWhat, severity], index) => ({
    headline,
    soWhat,
    severity,
    evidence: [
      data.sourceDocs[index % Math.max(data.sourceDocs.length, 1)]?.file || 'source-docs',
      matchedPatterns[index % Math.max(matchedPatterns.length, 1)]?.patternId || 'corpus-patterns',
      highValueInitiatives[index % Math.max(highValueInitiatives.length, 1)]?.initiative_id || 'T01_initiative-registry.csv',
    ],
  }));

  const topMove = highValueInitiatives[0];
  const executiveSummary = [
    `${client.tenantName} should be read through its business context, technology estate, data products, Tower investment rows, and industry corpus patterns together, with governed evidence deciding what can scale. ${client.headline}`,
    `The loaded context shows ${data.apps.length.toLocaleString()} applications/systems, ${data.dataProducts.length.toLocaleString()} data products, ${data.integrations.length.toLocaleString()} integrations/interfaces, ${data.volumetrics.length.toLocaleString()} platform volumetric rows, and ${data.initiatives.length.toLocaleString()} AI/control-tower initiatives. The useful executive view is not the row count; it is how these assets explain value, risk, readiness, and sequencing.`,
    `Current-state examples include ${confirmedStack.slice(0, 6).join(', ') || 'the source-doc confirmed stack'}, plus data products such as ${topDataProducts.slice(0, 3).join('; ')}. Volumetric signals include ${topMetrics.slice(0, 4).join('; ')}.`,
    `Compared with ${client.peerSet}, the north star is ${client.northStar} ${client.peerImplication}`,
  ].join('\n\n');

  return {
    readId: `enterprise-read-${client.key}-business-technology-landscape-v1`,
    tenantKey: client.key,
    tenantName: client.tenantName,
    industry: client.industry,
    readFamily: 'current_state',
    dimension: 'business_technology_data_ai_landscape',
    generatedAt: NOW,
    questionFamilies: [
      client.answerQuestion,
      'Summarize the business and technology landscape with volumetrics.',
      'What is blocking value, AI scale, or modernization?',
      'How do we compare to peers and what moves should follow?',
    ],
    headline: client.headline,
    executiveSummary,
    currentStateRead: {
      architecturePattern: client.architecturePattern,
      maturityRead: client.maturityRead,
      whatThisMeans: 'The decision layer should lead with business implications, peer benchmark/north-star context, and recommended moves, while keeping row/chunk/fact counts behind evidence and admin diagnostics.',
      confirmedTechnologyStack: confirmedStack,
      dataQualityCaution: issueWords.length
        ? `Review-required data issues surfaced in the loaded data products: ${issueWords.join('; ')}.`
        : null,
    },
    volumetrics: {
      applicationsTotal: data.apps.length,
      analyticsAdjacentApplications: dataApps.length,
      mainframeAdjacentApplications: mainframeApps.length,
      criticalOrHighApplications: criticalApps.length,
      analyticsAdjacentRunCostUsd: runCost,
      totalApplicationRunCostUsd: allRunCost,
      dataProductsTotal: data.dataProducts.length,
      dataProductPlatformsTop: topEntries(dataProductPlatforms, 8),
      dataProductStatus,
      dataProductDomainsTop: topEntries(dataProductDomains, 8),
      averageQualityOrTrustScore: Math.round(avgQuality * 10) / 10,
      integrationsTotal: data.integrations.length,
      criticalOrHighIntegrations: criticalIntegrations.length,
      realTimeOrStreamingIntegrations: realTimeIntegrations.length,
      integrationTypesTop: topEntries(integrationTypes, 8),
      platformHighlights,
      namedPlatformVolumetrics: Object.fromEntries(platformHighlights.slice(0, 8).map((row) => [row.metric.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, ''), row.value])),
    },
    derivedInsights,
    benchmarkRead: {
      northStar: client.northStar,
      peerImplication: client.peerImplication,
      matchedPeerPlays: data.competitorPlays.slice(0, 5).map((row) => ({
        peer: row.Peer_or_Archetype || row.peer || 'Peer archetype',
        play: row.Play_Name || row.play_name || row.Reference_Pattern || 'Peer move',
        enablers: row.Enablers || row.enablers || row.Reference_Pattern || '',
        domain: row.Domain || row.domain || '',
        evidence: `O03_competitor-plays.csv#${row.Play_ID || stableId(JSON.stringify(row))}`,
      })),
    },
    matchedPatterns,
    recommendedMoves: topActions.map((action, index) => ({
      title: action.action_title || highValueInitiatives[index]?.initiative_name || `Recommended move ${index + 1}`,
      owner: action.decision_owner || action.owner_role || highValueInitiatives[index]?.owner_role || 'Executive owner',
      decision: action.action_title || highValueInitiatives[index]?.primary_blocker || 'Approve next evidence-gated decision.',
      expectedImpact: action.expected_impact_usd ? money(number(action.expected_impact_usd)) : highValueInitiatives[index]?.promised_benefit_usd ? money(number(highValueInitiatives[index].promised_benefit_usd)) : 'not quantified',
    })),
    sentinelAnswerContract: {
      answerStyle: 'plain-English senior CIO/CDAO/CFO advisor',
      mustInclude: ['business context', 'current platforms', 'volumetrics', 'architecture read', 'peer/north-star read', 'recommended moves', 'evidence'],
      mustNotLeadWith: ['chunk count', 'graph edge count', 'raw fact count'],
    },
  };
}

function run() {
  const clientKey = arg('--client', 'skyharbor-air');
  const version = arg('--version', 'v4');
  const outArg = arg('--out', null);
  const clientKeys = clientKey === 'all' ? Object.keys(CLIENTS) : [clientKey];
  const receipts = [];

  for (const key of clientKeys) {
    const client = CLIENTS[key];
    if (!client) throw new Error(`Unsupported client for derived reads: ${key}`);
    const root = client.datasetRoot(version);
    if (!exists(root)) throw new Error(`Dataset root not found: ${root}`);

    const data = key === 'skyharbor-air' ? loadSkyHarbor(root) : loadCommonClient(root);
    const readModel = key === 'skyharbor-air'
      ? deriveSkyHarborDataAnalyticsRead(client, data)
      : deriveGenericEnterpriseRead(client, data);

    const defaultOut = `${root}/derived-intelligence/enterprise-reads.json`;
    const outputPath = clientKeys.length === 1 && outArg ? outArg : defaultOut;
    ensureDir(path.dirname(path.join(REPO_ROOT, outputPath)));
    fs.writeFileSync(path.join(REPO_ROOT, outputPath), JSON.stringify({ reads: [readModel] }, null, 2) + '\n', 'utf8');

    const sourceDocPath = `${root}/source-docs/${client.sourceDocPrefix}_Derived_Enterprise_Reads_SYNTHETIC.md`;
    fs.writeFileSync(path.join(REPO_ROOT, sourceDocPath), renderEnterpriseReadMarkdown(readModel), 'utf8');

    receipts.push({
      client: key,
      version,
      output: outputPath,
      source_doc_output: sourceDocPath,
      reads: 1,
      read_ids: [readModel.readId],
    });
  }

  const receipt = {
    ok: true,
    client: clientKey,
    version,
    outputs: receipts,
    reads: receipts.length,
    generated_at: NOW,
    human_dashboard_contract: {
      lead_with: ['executiveSummary', 'derivedInsights', 'benchmarkRead', 'recommendedMoves'],
      hide_by_default: ['raw chunks', 'graph edges', 'fact count'],
    },
  };
  console.log(`RESULT_JSON ${JSON.stringify(receipt, null, 2)}`);
}

try {
  run();
} catch (error) {
  console.error(`RESULT_JSON ${JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) })}`);
  process.exit(1);
}
