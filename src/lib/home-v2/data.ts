import { readFile } from 'node:fs/promises';
import path from 'node:path';

import yaml from 'js-yaml';
import Papa from 'papaparse';

import { ALL_CLIENTS, type ClientKey } from '@/lib/client-config';

type Row = Record<string, string | undefined>;
type Tone = 'teal' | 'amber' | 'red';
type Format = 'v4' | 'northstar-v1';

type HomeV2ClientPack = {
  key: ClientKey;
  aliases: string[];
  datasetDir: string;
  tenantName: string;
  format: Format;
};

type SectionSchema = {
  id: string;
  nav: string;
  title: string;
  sub: string;
  v4File: string;
  northstarFile: string;
  chapter: string;
  keywords: RegExp;
  leverage: number;
  play: 'P1' | 'P2' | 'P3';
  gates: string[];
};

type DatasetSummary = {
  contextRows: number;
  towerRows: number;
  sourceDocs: number;
  relationshipEdges: number;
  applications: number;
  integrations: number;
  vendors: number;
  dataProducts: number;
  initiatives: number;
  generatedAt: string;
  revenueUsd: number | null;
  employees: number | null;
};

type EnterpriseRead = {
  headline?: string;
  executiveSummary?: string;
  currentStateRead?: {
    architecturePattern?: string;
    maturityRead?: string;
    whatThisMeans?: string;
    dataQualityCaution?: string;
  };
  derivedInsights?: Array<{
    headline?: string;
    soWhat?: string;
    severity?: string;
    evidence?: string[];
  }>;
  volumetrics?: {
    applicationsTotal?: number;
    integrationsTotal?: number;
    dataProductsTotal?: number;
    platformHighlights?: Array<{
      metric?: string;
      platform?: string;
      value?: number;
      unit?: string;
      note?: string;
      evidence?: string;
    }>;
  };
};

export const HOME_V2_CLIENT_PACKS: HomeV2ClientPack[] = [
  {
    key: 'apexretail',
    aliases: ['apexretail', 'apex-retail', 'apex retail', 'apex retail group'],
    datasetDir: 'apex-retail-synthetic-v4',
    tenantName: 'Apex Retail Group',
    format: 'v4',
  },
  {
    key: 'arcturus',
    aliases: ['arcturus', 'firstcapital', 'first-capital', 'first capital', 'first capital financial'],
    datasetDir: 'first-capital-financial-synthetic-v4',
    tenantName: 'First Capital Financial',
    format: 'v4',
  },
  {
    key: 'lakeshore',
    aliases: ['lakeshore', 'lakeshore-holdings', 'lakeshore holdings'],
    datasetDir: 'lakeshore-industries-synthetic-v4',
    tenantName: 'Lakeshore Holdings',
    format: 'v4',
  },
  {
    key: 'meridian',
    aliases: ['meridian', 'meridian-health', 'meridian health', 'meridian health system'],
    datasetDir: 'meridian-health-synthetic-v4',
    tenantName: 'Meridian Health System',
    format: 'v4',
  },
  {
    key: 'northstar',
    aliases: ['northstar', 'northstar-clinical', 'northstar clinical technologies'],
    datasetDir: 'northstar-clinical-tech-synthetic-v1',
    tenantName: 'Northstar Clinical Technologies',
    format: 'northstar-v1',
  },
  {
    key: 'skyharbor',
    aliases: ['skyharbor', 'skyharbor-air', 'skyharbor air'],
    datasetDir: 'skyharbor-air-synthetic-v4',
    tenantName: 'SkyHarbor Air',
    format: 'v4',
  },
];

const SECTION_SCHEMAS: SectionSchema[] = [
  {
    id: 'profile',
    nav: 'Enterprise Profile',
    title: 'Enterprise Profile',
    sub: 'Who this enterprise is, and the shape of the technology challenge.',
    v4File: 'family-1-enterprise-operating-model/F01_enterprise-profile.yaml',
    northstarFile: '00-profile/enterprise-profile.yaml',
    chapter: 'Who you are',
    keywords: /profile|company|enterprise|who|size|revenue|employee/i,
    leverage: 1,
    play: 'P1',
    gates: [],
  },
  {
    id: 'business',
    nav: 'Business & Operating Model',
    title: 'Business & Operating Model',
    sub: 'The functions, ownership, and where operating complexity concentrates.',
    v4File: 'family-1-enterprise-operating-model/F02_business-org-functions.csv',
    northstarFile: '03-business-units/business-units.csv',
    chapter: 'Who you are',
    keywords: /business|function|operating|owner|unit/i,
    leverage: 2,
    play: 'P1',
    gates: ['capabilities', 'budget'],
  },
  {
    id: 'workforce',
    nav: 'Workforce & Personas',
    title: 'Workforce & Personas',
    sub: 'The people the platform has to serve, and where AI leverage sits.',
    v4File: 'D19-personas-workforce/D19_personas-workforce.csv',
    northstarFile: '11-org-roles/org-roles.csv',
    chapter: 'Who you are',
    keywords: /workforce|persona|role|people|org/i,
    leverage: 2,
    play: 'P2',
    gates: ['ai'],
  },
  {
    id: 'customers',
    nav: 'Business Metrics',
    title: 'Business Metrics',
    sub: 'The outcome metrics and demand signals that define success.',
    v4File: 'family-7-outcome-intelligence/O01_business-metrics.csv',
    northstarFile: '01-financials/segment-pnl-workbook.csv',
    chapter: 'Who you are',
    keywords: /customer|metric|segment|market|revenue|margin/i,
    leverage: 2,
    play: 'P1',
    gates: ['initiatives'],
  },
  {
    id: 'capabilities',
    nav: 'Capabilities & Value Streams',
    title: 'Capabilities & Value Streams',
    sub: 'The business capabilities that transformation and AI are meant to lift.',
    v4File: 'family-1-enterprise-operating-model/F04_capabilities-value-streams.csv',
    northstarFile: '04-product-portfolio/product-portfolio.csv',
    chapter: 'Who you are',
    keywords: /capability|value|stream|product/i,
    leverage: 3,
    play: 'P1',
    gates: ['applications', 'initiatives'],
  },
  {
    id: 'applications',
    nav: 'Applications & Core Systems',
    title: 'Applications & Core Systems',
    sub: 'The application estate, systems of record, and modernization pressure.',
    v4File: 'family-2-technology-estate/F05_applications-systems.csv',
    northstarFile: '07-application-portfolio/application-portfolio.csv',
    chapter: 'What you run',
    keywords: /application|system|core|portfolio|modernization/i,
    leverage: 3,
    play: 'P2',
    gates: ['integrations', 'security'],
  },
  {
    id: 'infrastructure',
    nav: 'Infrastructure & Cloud',
    title: 'Infrastructure & Cloud',
    sub: 'The hosting, platform, and capacity posture behind the estate.',
    v4File: 'family-2-technology-estate/F07_infrastructure-cloud.csv',
    northstarFile: '06-erp-landscape/erp-landscape-workbook.csv',
    chapter: 'What you run',
    keywords: /infra|cloud|hosting|erp|capacity|platform/i,
    leverage: 2,
    play: 'P2',
    gates: ['applications', 'operations'],
  },
  {
    id: 'data',
    nav: 'Data & Analytics Estate',
    title: 'Data & Analytics Estate',
    sub: 'The data products, analytics platforms, and readiness caveats.',
    v4File: 'family-3-data-connectivity/F09_data-analytics-estate.csv',
    northstarFile: '16-market-corpus/named-entity-facts.jsonl',
    chapter: 'What you run',
    keywords: /data|analytics|quality|lineage|corpus/i,
    leverage: 3,
    play: 'P1',
    gates: ['ai', 'benchmarks'],
  },
  {
    id: 'integrations',
    nav: 'Integrations & Interfaces',
    title: 'Integrations & Interfaces',
    sub: 'The APIs, interfaces, and integration topology connecting the estate.',
    v4File: 'family-3-data-connectivity/F10_integrations-interfaces.csv',
    northstarFile: '08-integration-topology/integration-topology.json',
    chapter: 'What you run',
    keywords: /integration|interface|api|edge|topology/i,
    leverage: 2,
    play: 'P2',
    gates: ['applications'],
  },
  {
    id: 'security',
    nav: 'Security & Compliance',
    title: 'Security & Compliance',
    sub: 'The risk, compliance, and control evidence shaping what can scale.',
    v4File: 'family-6-governance-ai-evidence/F16_security-risk-compliance.csv',
    northstarFile: '13-regulatory-qms/qms-events.csv',
    chapter: 'What you run',
    keywords: /security|compliance|risk|control|qms|regulatory/i,
    leverage: 3,
    play: 'P3',
    gates: ['ai', 'initiatives'],
  },
  {
    id: 'vendors',
    nav: 'Vendors & Contracts',
    title: 'Vendors & Contracts',
    sub: 'The vendor base, renewal calendar, and commercial concentration.',
    v4File: 'family-4-financial-commercial/F11_vendors-contracts-licenses.csv',
    northstarFile: '09-vendors-contracts/vendor-contracts.csv',
    chapter: 'What it costs',
    keywords: /vendor|contract|renewal|license|partner/i,
    leverage: 3,
    play: 'P3',
    gates: ['budget'],
  },
  {
    id: 'budget',
    nav: 'IT Budget & Financials',
    title: 'IT Budget & Financials',
    sub: 'The run, change, AI/data, labor, vendor, and cloud cost shape.',
    v4File: 'family-4-financial-commercial/F12_it-budget-financials.csv',
    northstarFile: '01-financials/financial-kpi-workbook.csv',
    chapter: 'What it costs',
    keywords: /budget|spend|cost|financial|margin|run|change/i,
    leverage: 3,
    play: 'P3',
    gates: ['initiatives'],
  },
  {
    id: 'ai',
    nav: 'AI & Automation Footprint',
    title: 'AI & Automation Footprint',
    sub: 'The tools, models, gates, and adoption evidence for AI scale.',
    v4File: 'family-6-governance-ai-evidence/F17_ai-automation-footprint.csv',
    northstarFile: '14-ai-models-tools/ai-tool-footprint.csv',
    chapter: "What you're building",
    keywords: /ai|automation|model|tool|copilot|genai/i,
    leverage: 3,
    play: 'P1',
    gates: ['security', 'policies'],
  },
  {
    id: 'initiatives',
    nav: 'Initiatives & Roadmap',
    title: 'Initiatives & Roadmap',
    sub: 'The active portfolio of initiatives, promised value, dependencies, and risk.',
    v4File: 'family-5-execution-operations/F13_initiatives-portfolio.csv',
    northstarFile: '10-initiatives/initiatives-active.csv',
    chapter: "What you're building",
    keywords: /initiative|roadmap|program|portfolio|project/i,
    leverage: 3,
    play: 'P1',
    gates: ['budget', 'operations'],
  },
  {
    id: 'change',
    nav: 'Benefits Realization',
    title: 'Benefits Realization',
    sub: 'The evidence of value, benefits, and change outcomes.',
    v4File: 'family-7-outcome-intelligence/O04_benefits-realization.csv',
    northstarFile: '10-initiatives/initiatives-closed.csv',
    chapter: "What you're building",
    keywords: /benefit|value|change|realization|outcome/i,
    leverage: 2,
    play: 'P1',
    gates: ['initiatives'],
  },
  {
    id: 'risk',
    nav: 'Risk & RAID Log',
    title: 'Risk & RAID Log',
    sub: 'The open risks, assumptions, issues, dependencies, and constraints.',
    v4File: 'family-7-outcome-intelligence/O05_raid-log.csv',
    northstarFile: '15-incidents-ops/incidents.csv',
    chapter: 'How you are governed',
    keywords: /risk|raid|issue|incident|dependency|constraint/i,
    leverage: 3,
    play: 'P3',
    gates: ['operations', 'security'],
  },
  {
    id: 'operations',
    nav: 'Operations & Service',
    title: 'Operations & Service',
    sub: 'The operational service-management evidence and delivery health.',
    v4File: 'family-5-execution-operations/F14_operations-service-management.csv',
    northstarFile: '12-delivery-devex/dora-baseline.csv',
    chapter: 'How you are governed',
    keywords: /operation|service|delivery|dora|incident|ops/i,
    leverage: 2,
    play: 'P2',
    gates: ['initiatives'],
  },
  {
    id: 'policies',
    nav: 'AI Governance & Policy',
    title: 'AI Governance & Policy',
    sub: 'The responsible-AI, policy, HITL, monitoring, and model-gate posture.',
    v4File: 'family-7-outcome-intelligence/O06_ai-governance.csv',
    northstarFile: '20-evidence-ledger-fixtures/evidence-rows.jsonl',
    chapter: 'How you are governed',
    keywords: /governance|policy|hitl|drift|bias|evidence/i,
    leverage: 3,
    play: 'P3',
    gates: ['ai'],
  },
  {
    id: 'benchmarks',
    nav: 'Industry Benchmarks',
    title: 'Industry Benchmarks',
    sub: 'How the enterprise reads against outside-in peer and market patterns.',
    v4File: 'family-7-outcome-intelligence/O02_industry-benchmarks.csv',
    northstarFile: '17-upload-templates/competitor-benchmark.md',
    chapter: 'Outside-in',
    keywords: /benchmark|peer|industry|competitor|market/i,
    leverage: 2,
    play: 'P1',
    gates: [],
  },
];

const RATING = {
  Strong: [88, 'teal'],
  Mature: [82, 'teal'],
  Proven: [85, 'teal'],
  Developing: [55, 'amber'],
  Uneven: [48, 'amber'],
  Constrained: [40, 'amber'],
  'High opportunity': [45, 'amber'],
  'At risk': [30, 'red'],
  Deficient: [25, 'red'],
  'Not ready': [22, 'red'],
  Critical: [20, 'red'],
} as const;

const PLAYS = [
  {
    id: 'P1',
    t: 'Turn context into sequenced executive moves',
    d: 'Use the strongest context signals to decide which business and AI moves deserve leadership attention first.',
  },
  {
    id: 'P2',
    t: 'Modernize the operating spine before scaling automation',
    d: 'Clear the application, data, integration, and operations constraints that cap reliable execution.',
  },
  {
    id: 'P3',
    t: 'Tighten governance and commercial control',
    d: 'Use risk, policy, vendor, and budget evidence to stop drift before spend and AI scale amplify it.',
  },
] as const;

const WEIGHT_COEF = { severity: 3.0, urgency: 2.0, leverage: 2.5, breadth: 1.5 } as const;

export function resolveHomeV2ClientPack(clientKey?: string | null, tenantName?: string | null): HomeV2ClientPack {
  const key = clientKey?.trim().toLowerCase();
  if (key) {
    const byExactKey = HOME_V2_CLIENT_PACKS.find((entry) => entry.key === key);
    if (byExactKey) return byExactKey;
  }

  const probe = `${clientKey ?? ''} ${tenantName ?? ''}`.toLowerCase();
  const match = HOME_V2_CLIENT_PACKS.find((entry) =>
    entry.aliases.some((alias) => probe.includes(alias)),
  );
  if (match) return match;

  throw new Error(`home_v2_client_pack_not_configured:${clientKey ?? 'null'}:${tenantName ?? 'null'}`);
}

function datasetPath(datasetDir: string, relativePath: string): string {
  return path.join(process.cwd(), 'datasets', datasetDir, relativePath);
}

async function readText(datasetDir: string, relativePath: string): Promise<string> {
  return readFile(datasetPath(datasetDir, relativePath), 'utf8');
}

async function readCsv(datasetDir: string, relativePath: string): Promise<Row[]> {
  const csv = await readText(datasetDir, relativePath);
  const parsed = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true });
  return parsed.data;
}

async function readYaml<T>(datasetDir: string, relativePath: string): Promise<T> {
  return yaml.load(await readText(datasetDir, relativePath)) as T;
}

async function readJson<T>(datasetDir: string, relativePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readText(datasetDir, relativePath)) as T;
  } catch {
    return null;
  }
}

async function countRecords(datasetDir: string, relativePath: string): Promise<{ rows: Row[]; count: number; kind: string }> {
  try {
    if (relativePath.endsWith('.csv')) {
      const rows = await readCsv(datasetDir, relativePath);
      return { rows, count: rows.length, kind: 'structured CSV' };
    }
    if (relativePath.endsWith('.jsonl')) {
      const lines = (await readText(datasetDir, relativePath)).split(/\r?\n/).filter((line) => line.trim());
      return { rows: lines.slice(0, 8).map((line) => JSON.parse(line) as Row), count: lines.length, kind: 'JSONL evidence' };
    }
    if (relativePath.endsWith('.json')) {
      const parsed = JSON.parse(await readText(datasetDir, relativePath)) as unknown;
      if (Array.isArray(parsed)) return { rows: parsed.slice(0, 8) as Row[], count: parsed.length, kind: 'JSON' };
      if (parsed && typeof parsed === 'object') {
        return { rows: [parsed as Row], count: Object.keys(parsed).length, kind: 'JSON object' };
      }
    }
    if (relativePath.endsWith('.yaml') || relativePath.endsWith('.yml')) {
      const parsed = yaml.load(await readText(datasetDir, relativePath)) as Record<string, unknown>;
      return { rows: [Object.fromEntries(Object.entries(parsed ?? {}).map(([k, v]) => [k, String(v ?? '')]))], count: Object.keys(parsed ?? {}).length, kind: 'YAML profile' };
    }
    const text = await readText(datasetDir, relativePath);
    return { rows: [{ excerpt: text.replace(/\s+/g, ' ').slice(0, 220) }], count: text.length > 0 ? 1 : 0, kind: 'document' };
  } catch {
    return { rows: [], count: 0, kind: 'missing source' };
  }
}

function text(value: unknown, fallback = ''): string {
  const next = String(value ?? '').trim();
  return next || fallback;
}

function num(value: unknown): number {
  const parsed = Number(String(value ?? '').replace(/[$,%\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function compactNumber(value: number | null | undefined): string {
  const next = Number(value ?? 0);
  if (!Number.isFinite(next) || next <= 0) return '—';
  if (next >= 1_000_000_000) return `${Math.round((next / 1_000_000_000) * 10) / 10}B`;
  if (next >= 1_000_000) return `${Math.round((next / 1_000_000) * 10) / 10}M`;
  if (next >= 1_000) return `${Math.round((next / 1_000) * 10) / 10}K`;
  return String(Math.round(next));
}

function sentence(value: string, max = 260): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const clipped = clean.slice(0, max);
  const last = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('; '));
  return `${clipped.slice(0, last > 80 ? last + 1 : max).trim()}…`;
}

function inferTone(rows: Row[], count: number): Tone {
  const haystack = rows
    .slice(0, 80)
    .map((row) => Object.values(row).join(' '))
    .join(' ')
    .toLowerCase();
  if (/critical|blocked|kill|deficient|overdue|severe|red|p1|high-risk/.test(haystack)) return 'red';
  if (/partial|medium|watch|hold|restructure|manual|not_ready|constraint|amber|p2/.test(haystack)) return 'amber';
  if (count === 0) return 'amber';
  return 'teal';
}

function confidenceFor(format: Format, count: number): 'high' | 'partial' {
  return format === 'v4' && count > 0 ? 'high' : 'partial';
}

function sampleSignal(rows: Row[]): string {
  const row = rows.find((candidate) => Object.values(candidate).some(Boolean));
  if (!row) return 'No structured rows were available for this dimension.';
  const entries = Object.entries(row)
    .filter(([, value]) => text(value))
    .slice(0, 4)
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${text(value)}`);
  return entries.length ? sentence(entries.join(' · '), 220) : 'Structured source loaded, but no displayable sample fields were present.';
}

function rowsForSummary(summary: DatasetSummary): number {
  return summary.contextRows || summary.sourceDocs || 0;
}

function displayDate(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value || 'current refresh';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(parsed));
}

async function loadSummary(client: HomeV2ClientPack): Promise<DatasetSummary> {
  const expected = (await readJson<Record<string, unknown>>(client.datasetDir, '99-verification/expected-row-counts.json')) ?? {};
  const manifest = await readYaml<Record<string, unknown>>(client.datasetDir, 'manifest.yaml').catch(
    () => ({} as Record<string, unknown>),
  );
  const manifestSummary = (manifest.summary ?? manifest.counts ?? {}) as Record<string, unknown>;
  const profilePath = client.format === 'v4'
    ? 'family-1-enterprise-operating-model/F01_enterprise-profile.yaml'
    : '00-profile/enterprise-profile.yaml';
  const profile = await readYaml<Record<string, unknown>>(client.datasetDir, profilePath).catch(
    () => ({} as Record<string, unknown>),
  );

  return {
    contextRows: num(expected.context_rows ?? manifestSummary.context_rows ?? manifestSummary.corpusChunks),
    towerRows: num(expected.tower_rows ?? manifestSummary.tower_rows),
    sourceDocs: num(expected.source_docs ?? expected.sourceFiles ?? manifestSummary.source_docs ?? manifestSummary.sourceFiles),
    relationshipEdges: num(expected.relationship_edges ?? expected.integrationEdges ?? manifestSummary.relationship_edges ?? manifestSummary.integrationEdges),
    applications: num(expected.applications ?? expected.applicationPortfolioRows ?? manifestSummary.applications ?? manifestSummary.applicationPortfolioRows),
    integrations: num(expected.integrations ?? expected.integrationEdges ?? manifestSummary.integrations ?? manifestSummary.integrationEdges),
    vendors: num(expected.vendors ?? expected.vendorContracts ?? manifestSummary.vendors ?? manifestSummary.vendorContracts),
    dataProducts: num(expected.data_products ?? manifestSummary.data_products),
    initiatives: num(expected.initiatives ?? expected.activeInitiatives ?? manifestSummary.initiatives ?? manifestSummary.activeInitiatives),
    generatedAt: text(manifest.generated_at ?? manifest.generatedAt, '2026-06-18T00:00:00Z'),
    revenueUsd: num(profile.revenue_fy25_usd ?? profile.revenue_usd) || null,
    employees: num(profile.employees_fte ?? profile.orgRoles) || null,
  };
}

async function loadEnterpriseRead(client: HomeV2ClientPack): Promise<EnterpriseRead | null> {
  const payload = await readJson<{ reads?: EnterpriseRead[] }>(client.datasetDir, 'derived-intelligence/enterprise-reads.json');
  return payload?.reads?.[0] ?? null;
}

async function buildSection(client: HomeV2ClientPack, schema: SectionSchema) {
  const relativeFile = client.format === 'v4' ? schema.v4File : schema.northstarFile;
  const { rows, count, kind } = await countRecords(client.datasetDir, relativeFile);
  const tone = inferTone(rows, count);
  const confidence = confidenceFor(client.format, count);
  const severity = tone === 'red' ? 3 : tone === 'amber' ? 2 : 1;
  const urgency = tone === 'red' ? 3 : tone === 'amber' ? 2 : 1;
  const breadth = count > 150 ? 3 : count > 40 ? 2 : 1;
  const sample = sampleSignal(rows);

  return {
    id: schema.id,
    nav: schema.nav,
    risk: tone,
    find: `${schema.nav} is bound to ${relativeFile}.`,
    title: schema.title,
    sub: schema.sub,
    summary: `${schema.nav} for ${client.tenantName} is rendered from <b>${relativeFile}</b>. The adapter found ${count} ${kind} record${count === 1 ? '' : 's'} and keeps this dimension on the same 19-part assessment schema used by every client.`,
    currentState: [
      ['Source binding', count > 0 ? 'teal' : 'amber', `${count} ${kind} record${count === 1 ? '' : 's'} loaded from ${relativeFile}.`],
      ['Primary signal', tone, sample],
      ['Evidence confidence', confidence === 'high' ? 'teal' : 'amber', confidence === 'high' ? 'Structured v4 pack source is present for this dimension.' : 'Older or document-shaped source is present; treat this as directional until refreshed into the v4 schema.'],
      ['Dataset root', 'teal', `Bound to datasets/${client.datasetDir}; no cross-client fallback is used.`],
    ],
    implications: [
      {
        h: `${schema.nav} changes the read when its source changes`,
        means: `This panel is generated from ${relativeFile}, not static design copy.`,
        matters: 'All clients use the same schema, so differences in the page reflect differences in the tenant substrate.',
        risk: count > 0 ? 'The risk is interpretation, not missing binding; source trail remains visible for challenge.' : 'This dimension has weak source coverage and should not be over-read.',
        inspect: relativeFile,
      },
    ],
    maturity: [
      ['Source coverage', count > 80 ? 'Strong' : count > 0 ? 'Developing' : 'Not ready'],
      ['Schema consistency', 'Strong'],
      ['Evidence confidence', confidence === 'high' ? 'Mature' : 'Developing'],
      ['Leadership readiness', tone === 'red' ? 'At risk' : tone === 'amber' ? 'Uneven' : 'Proven'],
    ],
    focus: [
      `Use ${schema.nav} as the sourced view for ${client.tenantName}.`,
      count > 0 ? `Challenge the top signal against ${relativeFile}.` : `Load or refresh ${relativeFile} before making decisions from this dimension.`,
      `Carry this read into Intelligence only with the source trail attached.`,
    ],
    leadership: `${schema.nav} is a tenant-bound read for ${client.tenantName}. It is safe to compare across clients because the schema is common, but the values and source trail are specific to datasets/${client.datasetDir}.`,
    sources: [
      [relativeFile, `${schema.nav} source used for this panel.`, confidence],
      ['manifest.yaml', `Dataset root and refresh metadata for ${client.tenantName}.`, client.format === 'v4' ? 'high' : 'partial'],
    ],
    factors: {
      severity,
      urgency,
      leverage: schema.leverage,
      breadth,
      trend: tone === 'red' ? 'up' : tone === 'amber' ? 'flat' : 'down',
      play: schema.play,
      gates: schema.gates,
      why: `${schema.nav} carries ${count} record${count === 1 ? '' : 's'} from ${relativeFile}.`,
    },
  };
}

function buildChapters() {
  const chapterOrder = ['Who you are', 'What you run', 'What it costs', "What you're building", 'How you are governed', 'Outside-in'];
  return chapterOrder.map((chapter) => ({
    t: chapter,
    d: {
      'Who you are': 'The institution, its functions, people, metrics, and capabilities.',
      'What you run': 'The systems, data, integrations, and controls.',
      'What it costs': 'The spend, partners, renewals, and budget shape.',
      "What you're building": 'The AI footprint, initiatives, and value realization.',
      'How you are governed': 'Controls, reliability, policy, and operating evidence.',
      'Outside-in': 'How the enterprise reads against peer and market patterns.',
    }[chapter],
    ids: SECTION_SCHEMAS.filter((section) => section.chapter === chapter).map((section) => section.id),
  }));
}

function buildRouteToDimFunction(): string {
  return `function routeToDim(q) {
  const l = q.toLowerCase();
  const map = [
    [/profile|company|enterprise|who|revenue|employee/, 'profile'],
    [/business|function|operating|owner|unit/, 'business'],
    [/workforce|persona|role|people|org/, 'workforce'],
    [/customer|metric|segment|market|revenue|margin/, 'customers'],
    [/capabilit|value stream|product/, 'capabilities'],
    [/app|system|core|modern/, 'applications'],
    [/infra|cloud|hosting|erp|platform/, 'infrastructure'],
    [/data|analytics|quality|lineage|corpus/, 'data'],
    [/integration|interface|api|topology/, 'integrations'],
    [/security|compliance|control|qms|regulatory/, 'security'],
    [/vendor|contract|renewal|license|partner/, 'vendors'],
    [/budget|spend|cost|financial|run|change/, 'budget'],
    [/ai|automation|model|tool|copilot|genai/, 'ai'],
    [/initiative|roadmap|program|portfolio|project/, 'initiatives'],
    [/benefit|value|change|realization|outcome/, 'change'],
    [/risk|raid|issue|incident|dependency|constraint/, 'risk'],
    [/operation|service|delivery|dora|incident|ops/, 'operations'],
    [/governance|policy|hitl|drift|bias|evidence/, 'policies'],
    [/benchmark|peer|industry|competitor|market/, 'benchmarks'],
  ];
  const hit = map.find(([re]) => re.test(l));
  return hit ? hit[1] : 'profile';
}`;
}

function buildStory(client: HomeV2ClientPack, summary: DatasetSummary, read: EnterpriseRead | null, sections: Awaited<ReturnType<typeof buildSection>>[]) {
  const topRed = sections.filter((section) => section.risk === 'red').slice(0, 2);
  const topDrivers = sections
    .map((section) => ({ section, score: section.factors.severity * 3 + section.factors.urgency * 2 + section.factors.leverage * 2.5 + section.factors.breadth * 1.5 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ section }) => section.nav.toLowerCase());
  const executiveSummary = sentence(read?.executiveSummary ?? '', 560);
  const headline = read?.headline ?? `${client.tenantName} has ${summary.applications || 'loaded'} application records, ${summary.initiatives || 'loaded'} initiatives, and ${summary.vendors || 'loaded'} vendor records in its context pack.`;
  const readText = executiveSummary || `${client.tenantName} is rendered from datasets/${client.datasetDir}. The Home read is driven by ${topDrivers.join(', ') || 'the loaded context substrate'}, with every dimension tracing to a named source file.`;

  return {
    who: client.tenantName,
    ticker: `${client.format === 'v4' ? 'v4 context pack' : 'v1 context pack'} · ${client.key}`,
    kind: read?.currentStateRead?.architecturePattern ? sentence(read.currentStateRead.architecturePattern, 120) : `Synthetic ${client.format} enterprise context pack`,
    oneLine: sentence(headline, 150),
    read: readText,
    thesis: 'the source trail is here; the discipline is to interpret it tenant by tenant',
    whoWhat: [
      {
        k: 'Who you are',
        v: summary.revenueUsd
          ? `${client.tenantName} · ${compactNumber(summary.revenueUsd)} FY revenue reference · ${summary.employees ? `${compactNumber(summary.employees)} employees/FTE` : 'profile bound'}.`
          : `${client.tenantName} · profile bound from datasets/${client.datasetDir}.`,
      },
      {
        k: 'What you run',
        v: `${summary.applications || '—'} application records · ${summary.integrations || '—'} integration records · ${summary.dataProducts || '—'} data-product records.`,
      },
      {
        k: 'Where you stand',
        v: topRed.length
          ? `Highest-pressure dimensions now read as ${topRed.map((section) => section.nav).join(' and ')}.`
          : `No red dimension dominated the sourced read; top drivers are ${topDrivers.join(', ')}.`,
      },
    ],
    stats: [
      { l: 'Applications', v: compactNumber(summary.applications), d: 'source application records' },
      { l: 'Initiatives', v: compactNumber(summary.initiatives), d: 'active / portfolio records' },
      { l: 'Vendors', v: compactNumber(summary.vendors), d: 'contract or vendor rows' },
      { l: 'Context loaded', v: compactNumber(rowsForSummary(summary)), d: `${summary.sourceDocs || '—'} source docs/files · ${summary.relationshipEdges || '—'} graph/integration edges` },
    ],
  };
}

export async function buildHomeV2DataScript(args: {
  clientKey?: string | null;
  tenantName?: string | null;
}): Promise<{ script: string; tenantName: string; root: string; footer: string; generatedAt: string }> {
  const client = resolveHomeV2ClientPack(args.clientKey, args.tenantName);
  const [summary, read] = await Promise.all([loadSummary(client), loadEnterpriseRead(client)]);
  const sectionsList = await Promise.all(SECTION_SCHEMAS.map((schema) => buildSection(client, schema)));
  const sections = Object.fromEntries(sectionsList.map((section) => [
    section.id,
    {
      nav: section.nav,
      risk: section.risk,
      find: section.find,
      title: section.title,
      sub: section.sub,
      summary: section.summary,
      currentState: section.currentState,
      implications: section.implications,
      maturity: section.maturity,
      focus: section.focus,
      leadership: section.leadership,
      sources: section.sources,
    },
  ]));
  const factors = Object.fromEntries(sectionsList.map((section) => [section.id, section.factors]));
  const generatedAt = displayDate(summary.generatedAt);
  const footer = `Synthetic reference dataset · ${client.tenantName} · not a real customer · ${SECTION_SCHEMAS.length} dimensions · data pack datasets/${client.datasetDir} · refresh ${generatedAt}`;
  const binding = {
    source: `datasets/${client.datasetDir}`,
    tenantName: client.tenantName,
    clientKey: client.key,
    format: client.format,
    dimensions: SECTION_SCHEMAS.length,
    generatedAt,
    footer,
    verification: client.format === 'v4' ? 'structured v4 pack' : 'older v1 pack; partial derived-read coverage',
  };
  const script = `/* AbarVa Home v2 data generated from datasets/${client.datasetDir}. Synthetic, not real customer data. */
const HOME_META = ${JSON.stringify(binding)};
const STORY = ${JSON.stringify(buildStory(client, summary, read, sectionsList))};
const CHAPTERS = ${JSON.stringify(buildChapters())};
const RATING = ${JSON.stringify(RATING)};
const SECTIONS = ${JSON.stringify(sections)};
const PLAYS = ${JSON.stringify(PLAYS)};
const WEIGHT_COEF = ${JSON.stringify(WEIGHT_COEF)};
const FACTORS = ${JSON.stringify(factors)};
window.ABARVA_HOME_V2_BINDING = HOME_META;
${buildRouteToDimFunction()}
`;

  if (ALL_CLIENTS.length !== HOME_V2_CLIENT_PACKS.length) {
    throw new Error('home_v2_client_pack_count_mismatch');
  }

  return {
    script,
    tenantName: client.tenantName,
    root: `datasets/${client.datasetDir}`,
    footer,
    generatedAt,
  };
}

export function homeV2SectionIds(): string[] {
  return SECTION_SCHEMAS.map((section) => section.id);
}
