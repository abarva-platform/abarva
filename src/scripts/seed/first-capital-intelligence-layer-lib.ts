import fs from 'node:fs';
import path from 'node:path';
import { TENANTS, slugify } from './seed-wave-lib';

export interface AccessScopeSeed {
  id: string;
  summary: string;
  scopeType: 'broad' | 'program' | 'role' | 'maestro' | 'regulatory_restricted';
  programIds: string[];
  roleFilter: string[];
  maestroFilter: string[];
  outputModeFilter: 'chat_only' | 'artifacts_only' | 'both' | 'reasoning_only';
  regulatoryConstraints: string[];
  conditions: string[];
  auditRequired: boolean;
  scopePayload: Record<string, unknown>;
}

export interface BenchmarkCohortSeed {
  id: string;
  name: string;
  sector: string;
  subsector: string;
  sizeBand: string;
  geography: string;
  businessModel: string;
  maturity: string;
  peerCount: number;
  isPrimary: boolean;
  peerCompanies: string[];
  methodologyNotes: string;
  confidenceLevel: string;
  asOfDate: string;
  metadata: Record<string, unknown>;
}

export interface ExternalSourceSeed {
  id: string;
  name: string;
  description: string;
  sourceTier: string;
  sourceType: string;
  publisher: string;
  sourceUrl: string | null;
  geographyScope: string[];
  topicScope: string[];
  confidenceLevel: string;
  asOfDate: string;
  metadata: Record<string, unknown>;
}

export interface ExternalEventSeed {
  id: string;
  sourceId: string;
  title: string;
  summary: string;
  eventType: string;
  eventDate: string;
  entities: string[];
  topics: string[];
  geography: string[];
  significance: string;
  reasoningScopeSummary: string;
  disclosureScopeSummary: string;
  confidenceLevel: string;
  asOfDate: string;
  eventPayload: Record<string, unknown>;
}

export interface KpiSeed {
  id: string;
  ordinalRef: string;
  name: string;
  shortName: string;
  definition: string | null;
  category: string | null;
  subcategory: string | null;
  sectorApplicability: string[];
  ownerName: string | null;
  ownerRoleTitle: string | null;
  businessUnitName: string | null;
  strategicPriorityRef: string | null;
  targetText: string | null;
  targetValue: number | null;
  targetUnit: string | null;
  targetAsOfDate: string | null;
  targetPeriod: string | null;
  currentText: string | null;
  currentValue: number | null;
  currentUnit: string | null;
  currentAsOfDate: string | null;
  trendDirection: string | null;
  trendMagnitudePct: number | null;
  trendPeriod: string | null;
  trendSummary: string | null;
  benchmarkMedian: number | null;
  benchmarkTopQuartile: number | null;
  benchmarkBottomQuartile: number | null;
  benchmarkPeerCohortId: string | null;
  benchmarkAsOfDate: string | null;
  benchmarkConfidence: string | null;
  gapToMedianPct: number | null;
  gapToTopQuartilePct: number | null;
  peerPositionQuartile: string | null;
  linkedInitiativeRefs: string[];
  linkedPatternIds: string[];
  dataSource: string | null;
  dataSourceType: string | null;
  freshnessSla: string | null;
  confidenceLevel: string | null;
  whyItMatters: string | null;
  methodologyNotes: string | null;
  reasoningScopeSummary: string;
  disclosureScopeSummary: string;
  rawMarkdown: string;
  metadata: Record<string, unknown>;
}

export interface PatternPackSeed {
  id: string;
  ordinalRef: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  category: string | null;
  sectorApplicability: string[];
  crossIndustry: boolean;
  variantOf: string | null;
  triggerSymptoms: string[];
  detectionSignals: string[];
  likelyRootCauses: string[];
  interventionOptions: string[];
  phaseDeliverables: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
    phase4: string[];
  };
  expectedOutcomes: string[];
  requiredSponsorProfile: string | null;
  linkedKpiIds: string[];
  linkedKpiNames: string[];
  evidenceSummary: string | null;
  confidenceLevel: string;
  version: string;
  author: string;
  reasoningScopeSummary: string;
  disclosureScopeSummary: string;
  rawMarkdown: string;
  metadata: Record<string, unknown>;
}

export interface TelemetrySourceSeed {
  id: string;
  name: string;
  description: string;
  modality: string;
  connectorType: string | null;
  sourceLocation: string | null;
  credentialsReference: string | null;
  refreshSchedule: string | null;
  kpiIdsPopulated: string[];
  scopeDescription: string | null;
  dataFormat: string | null;
  residencyMode: string | null;
  retentionPolicy: string | null;
  complianceTags: string[];
  regulatoryNotes: string | null;
  reasoningScopeSummary: string;
  disclosureScopeSummary: string;
  programAssociation: string[];
  confidenceLevel: string;
  asOfDate: string;
  rawMarkdown: string;
  metadata: Record<string, unknown>;
}

export interface EvidenceSeed {
  id: string;
  sourceId: string | null;
  title: string;
  summary: string;
  evidenceType: string;
  relatedEntityType: string;
  relatedEntityId: string;
  observedAt: string;
  methodologyNotes: string | null;
  reasoningScopeSummary: string;
  disclosureScopeSummary: string;
  confidenceLevel: string;
  asOfDate: string;
  evidencePayload: Record<string, unknown>;
}

export interface ParsedFirstCapitalOverlay {
  kpis: KpiSeed[];
  patternPacks: PatternPackSeed[];
  telemetrySources: TelemetrySourceSeed[];
  benchmarkCohorts: BenchmarkCohortSeed[];
  externalSources: ExternalSourceSeed[];
  externalEvents: ExternalEventSeed[];
  evidence: EvidenceSeed[];
  accessScopes: AccessScopeSeed[];
}

const FIRST_CAPITAL_OVERLAY_PATH = TENANTS.first_capital
  ? 'docs/specs/_meta/seed-data/first-capital-intelligence-layer-overlay.md'
  : '';

const KNOWN_PROGRAMS = [
  'Executive Advisory',
  'Finance Transformation',
  'Risk Management',
  'BSA/AML Modernization',
  'Commercial Banking',
  'Consumer Banking',
  'Wealth Management',
  'Digital Transformation',
  'Technology Transformation',
  'Cybersecurity Modernization',
  'AI Platform and Governance',
  'Operating Model Modernization',
];

const KNOWN_ROLES = [
  'CFO',
  'Chief Risk Officer',
  'Chief Compliance Officer',
  'Chief Information Officer',
  'Chief Digital Officer',
  'Head of Wealth',
  'Head Capital Markets',
  'Chief Legal Officer',
  'Executive Advisory',
];

const OWNER_NAME_ALIASES: Record<string, string> = {
  'CFO': 'Elaine Burakovsky-Park',
  'Chief Compliance Officer': 'Marcus Blythe',
  'Chief Risk Officer': 'Dr. Vikram Shah',
  'Chief Information Officer': 'Angela Okafor-Hill',
  'Chief Digital Officer': 'Jasmine Taylor-Vance',
  'Head of Wealth': 'Sophia Delaney',
};

const KPI_BENCHMARK_OVERRIDES: Record<string, Partial<KpiSeed>> = {};

export function loadFirstCapitalOverlay(cwd = process.cwd()): ParsedFirstCapitalOverlay {
  const markdown = fs.readFileSync(path.resolve(cwd, FIRST_CAPITAL_OVERLAY_PATH), 'utf8');
  const sections = collectSections(markdown);
  const kpis = parseKpis(sections['Part 2'] ?? '');
  const kpiByOrdinal = new Map(kpis.map((kpi) => [kpi.ordinalRef, kpi]));
  const patternPacks = parsePatternPacks(sections['Part 3'] ?? '', kpiByOrdinal);
  const telemetrySources = parseTelemetrySources(sections['Part 5'] ?? '', kpiByOrdinal);
  const benchmarkCohorts = buildBenchmarkCohorts();
  const externalSources = buildExternalSources();
  const externalEvents = buildExternalEvents();
  const evidence = buildEvidence(kpis, patternPacks, telemetrySources, externalEvents);
  const accessScopes = buildAccessScopes(kpis, patternPacks, telemetrySources, externalEvents, evidence);

  return {
    kpis,
    patternPacks,
    telemetrySources,
    benchmarkCohorts,
    externalSources,
    externalEvents,
    evidence,
    accessScopes,
  };
}

function collectSections(markdown: string): Record<string, string> {
  const parts: Record<string, string> = {};
  const regex = /^## (Part \d+ · .+)$/gm;
  const matches = [...markdown.matchAll(regex)];
  for (let i = 0; i < matches.length; i += 1) {
    const title = matches[i][1];
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? markdown.length) : markdown.length;
    parts[title.split(' · ')[0]] = markdown.slice(start, end).trim();
  }
  return parts;
}

function parseKpis(section: string): KpiSeed[] {
  const matches = [...section.matchAll(/\*\*(\d+\.\d+\.\d+)\s+—\s+(.+?)\*\*\n([\s\S]*?)(?=\n\*\*\d+\.\d+\.\d+\s+—|\n### |\n---|$)/g)];
  const kpis: KpiSeed[] = [];

  for (const match of matches) {
    const ordinalRef = match[1].trim();
    const name = match[2].trim();
    const body = match[3].trim();

    const categoryLine = extractSegment(body, 'Category:');
    const ownerLine = extractSegment(body, 'Owner:');
    const targetText = extractSegment(body, 'Target:');
    const currentText = extractSegment(body, 'Current:');
    const trendText = extractSegment(body, 'Trend:');
    const benchmarkMedianText = extractSegment(body, 'Benchmark median:')
      ?? extractSegmentByPattern(body, /Benchmark median(?:\s*\([^)]+\))?:/i)
      ?? extractSegment(body, 'Benchmark:');
    const topQuartileText = extractSegment(body, 'Top quartile:');
    const dataSource = extractSegment(body, 'Data source:');
    const freshnessSla = extractSegment(body, 'Freshness SLA:') ?? extractSegment(body, 'Freshness:');
    const confidenceLevel = extractSegment(body, 'Confidence:');
    const strategicPriorityRef = extractSegment(body, 'Strategic priority:');
    const whyItMatters = extractSegment(body, 'Why it matters:');
    const peerPosition = extractSegment(body, 'Peer position:');
    const linkedInitiatives = extractSegment(body, 'Linked initiatives:')
      ?? extractSegment(body, 'Linked initiatives and patterns:');
    const linkedPatterns = extractSegment(body, 'Linked patterns:')
      ?? extractSegment(body, 'Linked initiatives and patterns:');
    const reasoningScopeSummary = extractSegment(body, 'Reasoning scope:') ?? 'broad';
    const disclosureScopeSummary = extractSegment(body, 'Disclosure scope:') ?? 'broad';

    const { ownerName, ownerRoleTitle } = parseOwnerInfo(ownerLine);
    const category = categoryLine ? categoryLine.split('·')[0]?.trim() ?? null : null;
    const subcategory = categoryLine
      ? categoryLine
          .split('·')
          .map((item) => item.trim())
          .find((item) => item.toLowerCase().startsWith('subcategory:'))
          ?.replace(/^subcategory:\s*/i, '')
          ?? null
      : null;

    const benchmarkMedian = parseNumericValue(benchmarkMedianText);
    const benchmarkTopQuartile = parseNumericValue(topQuartileText);
    const currentValue = parseNumericValue(currentText);
    const targetValue = parseNumericValue(targetText);
    const trendMagnitudePct = parseTrendMagnitude(trendText);
    const benchmarkPeerCohortId = benchmarkMedian !== null ? 'firstcap_primary_peer_cohort' : null;

    const metadata: Record<string, unknown> = {
      target_text: targetText,
      current_text: currentText,
      benchmark_text: benchmarkMedianText,
      top_quartile_text: topQuartileText,
      peer_position: peerPosition,
      owner_line: ownerLine,
      raw_block: body,
    };

    const base: KpiSeed = {
      id: extractBacktickValue(body, 'ID:') ?? `firstcap_${slugify(name)}`,
      ordinalRef,
      name,
      shortName: name,
      definition: extractSegment(body, 'Definition:'),
      category,
      subcategory,
      sectorApplicability: ['financial_services'],
      ownerName,
      ownerRoleTitle,
      businessUnitName: extractBusinessUnit(ownerLine),
      strategicPriorityRef,
      targetText,
      targetValue,
      targetUnit: inferUnit(targetText),
      targetAsOfDate: inferDate(targetText),
      targetPeriod: inferPeriod(targetText),
      currentText,
      currentValue,
      currentUnit: inferUnit(currentText),
      currentAsOfDate: inferDate(currentText),
      trendDirection: inferTrendDirection(trendText),
      trendMagnitudePct,
      trendPeriod: inferTrendPeriod(trendText),
      trendSummary: trendText,
      benchmarkMedian,
      benchmarkTopQuartile,
      benchmarkBottomQuartile: null,
      benchmarkPeerCohortId,
      benchmarkAsOfDate: benchmarkMedian !== null ? '2026-04-21' : null,
      benchmarkConfidence: benchmarkMedian !== null ? 'medium' : null,
      gapToMedianPct: currentValue !== null && benchmarkMedian !== null && benchmarkMedian !== 0
        ? Number((((currentValue - benchmarkMedian) / benchmarkMedian) * 100).toFixed(2))
        : null,
      gapToTopQuartilePct: currentValue !== null && benchmarkTopQuartile !== null && benchmarkTopQuartile !== 0
        ? Number((((currentValue - benchmarkTopQuartile) / benchmarkTopQuartile) * 100).toFixed(2))
        : null,
      peerPositionQuartile: peerPosition,
      linkedInitiativeRefs: normalizeList(linkedInitiatives),
      linkedPatternIds: normalizeList(linkedPatterns).map((item) => `firstcap_pattern_${slugify(item)}`),
      dataSource,
      dataSourceType: inferDataSourceType(dataSource),
      freshnessSla,
      confidenceLevel,
      whyItMatters,
      methodologyNotes: extractSegment(body, 'Note:') ?? extractSegment(body, 'Subsidiary range:'),
      reasoningScopeSummary,
      disclosureScopeSummary,
      rawMarkdown: `**${ordinalRef} — ${name}**\n${body}`,
      metadata,
    };

    const enriched = { ...base, ...(KPI_BENCHMARK_OVERRIDES[base.id] ?? {}) };
    kpis.push(enriched);
  }

  return kpis;
}

function parsePatternPacks(section: string, kpiByOrdinal: Map<string, KpiSeed>): PatternPackSeed[] {
  const matches = [...section.matchAll(/^### (3\.\d+)\s+·\s+(.+)$/gm)];
  const patterns: PatternPackSeed[] = [];

  for (let i = 0; i < matches.length; i += 1) {
    const ordinalRef = matches[i][1].trim();
    const name = matches[i][2].trim();
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? section.length) : section.length;
    const block = section.slice(start, end).trim();

    const classification = extractBoldValue(block, 'Classification');
    const linkedKpisText = extractBoldValue(block, 'Linked KPIs') ?? '';
    const linkedKpiIds = parseOrdinalRefs(linkedKpisText)
      .map((ref) => kpiByOrdinal.get(ref)?.id)
      .filter((value): value is string => Boolean(value));
    const linkedKpiNames = parseOrdinalRefs(linkedKpisText)
      .map((ref) => kpiByOrdinal.get(ref)?.name)
      .filter((value): value is string => Boolean(value));

    patterns.push({
      id: `firstcap_pattern_${slugify(name)}`,
      ordinalRef,
      name,
      shortDescription: extractLeadParagraph(block),
      longDescription: extractLeadParagraph(block),
      category: extractInlineClassificationField(classification, 'Category'),
      sectorApplicability: normalizeList(extractInlineClassificationField(classification, 'Sector applicability') ?? 'financial_services'),
      crossIndustry: /cross-industry:\s*yes/i.test(classification ?? ''),
      variantOf: extractInlineClassificationField(classification, 'Variant of'),
      triggerSymptoms: extractListSection(block, 'Detection signals'),
      detectionSignals: extractListSection(block, 'Detection signals'),
      likelyRootCauses: normalizeList(extractBoldValue(block, 'Likely root causes')),
      interventionOptions: extractListSection(block, 'Intervention options'),
      phaseDeliverables: parsePhaseDeliverables(block),
      expectedOutcomes: normalizeList(extractBoldValue(block, 'Expected outcomes')),
      requiredSponsorProfile: extractBoldValue(block, 'Required sponsor profile'),
      linkedKpiIds,
      linkedKpiNames,
      evidenceSummary: extractBoldValue(block, 'First Capital evidence'),
      confidenceLevel: 'high',
      version: '1.0',
      author: 'AbarVa North Star overlay',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      rawMarkdown: block,
      metadata: {
        classification,
        linked_kpis_text: linkedKpisText,
      },
    });
  }

  return patterns;
}

function parseTelemetrySources(section: string, kpiByOrdinal: Map<string, KpiSeed>): TelemetrySourceSeed[] {
  const matches = [...section.matchAll(/^### (5\.\d+)\s+·\s+(.+)$/gm)];
  const sources: TelemetrySourceSeed[] = [];

  for (let i = 0; i < matches.length; i += 1) {
    const name = matches[i][2].trim();
    if (/telemetry source summary/i.test(name)) continue;
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? section.length) : section.length;
    const block = section.slice(start, end).trim();
    const modalityText = extractBulletField(block, 'Modality');
    const kpisText = extractBulletField(block, 'KPIs populated')
      ?? extractBulletField(block, 'KPIs');
    const reasoningScopeSummary = extractBulletField(block, 'Reasoning scope') ?? 'broad';
    const disclosureScopeSummary = extractBulletField(block, 'Disclosure scope') ?? 'broad';

    sources.push({
      id: stripBackticks(extractBulletField(block, 'ID')) ?? `firstcap_telemetry_${slugify(name)}`,
      name,
      description: extractBulletField(block, 'Description') ?? name,
      modality: inferTelemetryModality(modalityText),
      connectorType: extractConnectorType(modalityText),
      sourceLocation: null,
      credentialsReference: null,
      refreshSchedule: inferRefreshSchedule(modalityText),
      kpiIdsPopulated: expandOrdinalRefs(parseOrdinalRefs(kpisText), kpiByOrdinal)
        .map((ref) => kpiByOrdinal.get(ref)?.id)
        .filter((value): value is string => Boolean(value)),
      scopeDescription: kpisText,
      dataFormat: inferDataFormat(modalityText),
      residencyMode: extractBulletField(block, 'Residency mode')
        ?? extractBulletField(block, 'Residency'),
      retentionPolicy: 'Client-governed per north star Part 9',
      complianceTags: normalizeList(
        extractBulletField(block, 'Compliance tags')
          ?? extractBulletField(block, 'Compliance'),
      ),
      regulatoryNotes: extractRegulatoryNotes(block),
      reasoningScopeSummary,
      disclosureScopeSummary,
      programAssociation: extractProgramIds(`${reasoningScopeSummary} ${disclosureScopeSummary}`),
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      rawMarkdown: block,
      metadata: {
        modality_text: modalityText,
        kpis_text: kpisText,
      },
    });
  }

  return sources;
}

function buildBenchmarkCohorts(): BenchmarkCohortSeed[] {
  return [
    {
      id: 'firstcap_primary_peer_cohort',
      name: 'Super-regional bank primary peer cohort',
      sector: 'financial_services',
      subsector: 'super-regional banking',
      sizeBand: '$150B-$600B assets',
      geography: 'United States',
      businessModel: 'diversified regional bank with consumer, commercial, and wealth franchises',
      maturity: 'incumbent',
      peerCount: 6,
      isPrimary: true,
      peerCompanies: ['Truist', 'PNC', 'Fifth Third', 'Citizens', 'KeyCorp', 'Regions'],
      methodologyNotes: 'Primary cohort for NIM, efficiency, credit, capital, deposit, and digital-banking comparisons.',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'primary', source: 'First Capital overlay Part 2 + banking benchmarks' },
    },
    {
      id: 'firstcap_credit_and_capital_cohort',
      name: 'Credit, capital, and regulatory-risk peers',
      sector: 'financial_services',
      subsector: 'regulated bank risk and balance-sheet peers',
      sizeBand: '$100B-$600B assets',
      geography: 'United States',
      businessModel: 'prudentially supervised banks with material CRE and treasury exposure',
      maturity: 'incumbent',
      peerCount: 8,
      isPrimary: false,
      peerCompanies: ['Truist', 'PNC', 'Citizens', 'M&T Bank', 'Regions', 'KeyCorp', 'Huntington', 'Comerica'],
      methodologyNotes: 'Used for CRE concentration, NCO, CET1, LCR, and deposit-franchise comparisons.',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'dimension_specific', dimension: 'credit_capital' },
    },
    {
      id: 'firstcap_wealth_and_digital_cohort',
      name: 'Wealth and digital-customer peers',
      sector: 'financial_services',
      subsector: 'wealth-enabled regional banks',
      sizeBand: '$50B-$600B assets',
      geography: 'United States',
      businessModel: 'regional banks with strong advisor and digital-acquisition channels',
      maturity: 'incumbent',
      peerCount: 9,
      isPrimary: false,
      peerCompanies: ['PNC', 'Truist', 'Citizens', 'Fifth Third', 'U.S. Bank', 'KeyCorp', 'M&T Bank', 'Regions', 'Huntington'],
      methodologyNotes: 'Used for AUM growth, advisor productivity, digital adoption, CSAT, and household-growth comparisons.',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'dimension_specific', dimension: 'wealth_digital' },
    },
  ];
}

function buildExternalSources(): ExternalSourceSeed[] {
  return [
    {
      id: 'firstcap_ext_source_sec_filings',
      name: 'SEC filings and earnings materials',
      description: '10-K, 10-Q, earnings decks, investor presentations, and public management remarks for First Capital and peers.',
      sourceTier: 'tier_1_public_disclosure',
      sourceType: 'public_filing',
      publisher: 'SEC EDGAR / investor relations',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['financial performance', 'capital allocation', 'deposits', 'digital strategy'],
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'firstcap_ext_source_earnings_transcripts',
      name: 'Bank earnings call transcripts',
      description: 'Quarterly earnings transcripts and investor Q&A across First Capital and super-regional peers.',
      sourceTier: 'tier_1_public_disclosure',
      sourceType: 'earnings_transcript',
      publisher: 'Investor relations / transcript providers',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['rate environment', 'deposit competition', 'wealth growth', 'operating efficiency'],
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'firstcap_ext_source_banking_trade_press',
      name: 'Banking trade press and market reporting',
      description: 'Trade reporting used to track executive moves, product shifts, and franchise repositioning across regional banks.',
      sourceTier: 'tier_2_third_party_research',
      sourceType: 'trade_press',
      publisher: 'American Banker / industry press',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['executive moves', 'deposit competition', 'wealth strategy', 'AI adoption'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'firstcap_ext_source_rating_agencies',
      name: 'Rating agency and capital-market commentary',
      description: 'S&P, Moody’s, and Fitch commentary on First Capital’s balance-sheet posture, liquidity, and risk profile.',
      sourceTier: 'tier_2_third_party_research',
      sourceType: 'rating_agency',
      publisher: 'S&P / Moody’s / Fitch',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['credit outlook', 'capital structure', 'deposit franchise', 'regulatory pressure'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'firstcap_ext_source_bank_benchmarks',
      name: 'Bank benchmark and peer datasets',
      description: 'Banking and wealth benchmark feeds for margin, balance-sheet, customer, and productivity metrics.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'industry_dataset',
      publisher: 'S&P Global / FDIC / FFIEC / JD Power',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['NIM', 'efficiency ratio', 'deposit pricing', 'customer satisfaction'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'firstcap_ext_source_macro_rate_and_credit_signals',
      name: 'Macro rate and credit signals',
      description: 'Rate, credit, and economic signals used to contextualize balance-sheet and credit performance.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'market_dataset',
      publisher: 'Federal Reserve / macro data providers',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['yield curve', 'credit trend', 'commercial real estate', 'deposit behavior'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'firstcap_ext_source_analyst_research',
      name: 'Sell-side and sector research',
      description: 'Sector research used for franchise positioning, earnings expectations, and regulatory posture analysis.',
      sourceTier: 'tier_2_third_party_research',
      sourceType: 'analyst_research',
      publisher: 'Banking sector analysts',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['investor sentiment', 'peer moves', 'valuation', 'earnings quality'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'firstcap_ext_source_regulatory_and_risk_watch',
      name: 'Regulatory, AML, and cybersecurity watch',
      description: 'External monitoring of prudential, AML, privacy, cyber, and enforcement developments relevant to First Capital.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'event_stream',
      publisher: 'Regulatory notices / risk intelligence providers',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['BSA/AML', 'consent orders', 'privacy', 'cybersecurity incidents'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
  ];
}

function buildExternalEvents(): ExternalEventSeed[] {
  return [
    {
      id: 'firstcap_event_cfo_transition_elaine',
      sourceId: 'firstcap_ext_source_sec_filings',
      title: 'Elaine Burakovsky-Park joined as CFO with explicit margin and capital mandate',
      summary: 'First Capital installed Elaine Burakovsky-Park as CFO in 2025 to tighten financial discipline, capital allocation, and investor communication.',
      eventType: 'executive_move',
      eventDate: '2025-05-01',
      entities: ['Elaine Burakovsky-Park', 'First Capital Financial'],
      topics: ['margin protection', 'capital allocation', 'finance transformation'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'First Capital base seed Part 2 / Part 4' },
    },
    {
      id: 'firstcap_event_rate_env_pressure',
      sourceId: 'firstcap_ext_source_earnings_transcripts',
      title: 'Rate-cycle pressure sharpened scrutiny on deposit cost and NIM durability',
      summary: 'Recent earnings cycles reinforced how deposit competition and mix shift are pressuring franchise economics across super-regionals, including First Capital.',
      eventType: 'market_shift',
      eventDate: '2026-01-24',
      entities: ['Elaine Burakovsky-Park', 'First Capital Financial'],
      topics: ['NIM', 'deposit competition', 'margin protection'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'First Capital earnings and external-rate context' },
    },
    {
      id: 'firstcap_event_consent_order_context',
      sourceId: 'firstcap_ext_source_regulatory_and_risk_watch',
      title: 'Consent-order remediation remains the defining regulatory operating context',
      summary: 'BSA/AML modernization, exam cadence, and regulator-facing timelines continue to anchor First Capital’s highest-sensitivity operating work.',
      eventType: 'regulatory_action',
      eventDate: '2026-02-07',
      entities: ['Marcus Blythe', 'Dr. Vikram Shah', 'First Capital Financial'],
      topics: ['BSA/AML', 'consent order', 'regulatory remediation'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'program-scoped (BSA/AML Modernization, Compliance, Legal, Executive Advisory)',
      disclosureScopeSummary: 'program-scoped + legal-privileged',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'First Capital overlay legal-privileged context' },
    },
    {
      id: 'firstcap_event_cre_regulatory_attention',
      sourceId: 'firstcap_ext_source_regulatory_and_risk_watch',
      title: 'Commercial real-estate concentration drew heavier supervisory attention',
      summary: 'Regulators increased scrutiny on concentration management across the peer set, keeping First Capital’s 268% CRE concentration in focus.',
      eventType: 'regulatory_action',
      eventDate: '2026-03-03',
      entities: ['Dr. Vikram Shah', 'First Capital Financial'],
      topics: ['CRE concentration', 'risk management', 'supervisory pressure'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'program-scoped',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'First Capital credit and concentration context' },
    },
    {
      id: 'firstcap_event_shadow_ai_fs_gap',
      sourceId: 'firstcap_ext_source_analyst_research',
      title: 'Shadow AI governance exposure surfaced across lending and customer operations',
      summary: 'Composite synthesis identified 12 AI tools, including credit-adjacent and customer-facing use cases ahead of current governance coverage.',
      eventType: 'internal_signal',
      eventDate: '2026-04-10',
      entities: ['Jasmine Taylor-Vance', 'Angela Okafor-Hill', 'First Capital Financial'],
      topics: ['AI governance', 'shadow AI', 'fair lending risk'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'First Capital overlay pattern 3.3' },
    },
    {
      id: 'firstcap_event_peer_wealth_push',
      sourceId: 'firstcap_ext_source_banking_trade_press',
      title: 'Peer super-regionals accelerated wealth and cross-franchise relationship plays',
      summary: 'Peer announcements raised the bar on using consumer and commercial relationships to drive advisor-led AUM growth and fee mix improvement.',
      eventType: 'peer_move',
      eventDate: '2026-04-16',
      entities: ['Sophia Delaney', 'First Capital Financial'],
      topics: ['wealth management', 'cross-franchise growth', 'fee income'],
      geography: ['United States'],
      significance: 'medium',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'First Capital wealth and digital peer envelope' },
    },
  ];
}

function buildEvidence(
  kpis: KpiSeed[],
  patterns: PatternPackSeed[],
  telemetrySources: TelemetrySourceSeed[],
  externalEvents: ExternalEventSeed[],
): EvidenceSeed[] {
  const evidence: EvidenceSeed[] = [];

  for (const kpi of kpis) {
    evidence.push({
      id: `evidence_${kpi.id}`,
      sourceId: chooseEvidenceSourceId(kpi.dataSource),
      title: `${kpi.name} evidence`,
      summary: [kpi.currentText, kpi.dataSource, kpi.whyItMatters].filter(Boolean).join(' · '),
      evidenceType: 'metric',
      relatedEntityType: 'kpi',
      relatedEntityId: kpi.id,
      observedAt: kpi.currentAsOfDate ?? '2026-04-21',
      methodologyNotes: kpi.methodologyNotes,
      reasoningScopeSummary: kpi.reasoningScopeSummary,
      disclosureScopeSummary: kpi.disclosureScopeSummary,
      confidenceLevel: kpi.confidenceLevel ?? 'measured',
      asOfDate: kpi.currentAsOfDate ?? '2026-04-21',
      evidencePayload: {
        benchmark_median: kpi.benchmarkMedian,
        target_text: kpi.targetText,
      },
    });
  }

  for (const pattern of patterns) {
    evidence.push({
      id: `evidence_${pattern.id}`,
      sourceId: null,
      title: `${pattern.name} evidence`,
      summary: pattern.evidenceSummary ?? pattern.shortDescription ?? pattern.name,
      evidenceType: 'pattern',
      relatedEntityType: 'pattern_pack',
      relatedEntityId: pattern.id,
      observedAt: '2026-04-21',
      methodologyNotes: null,
      reasoningScopeSummary: pattern.reasoningScopeSummary,
      disclosureScopeSummary: pattern.disclosureScopeSummary,
      confidenceLevel: pattern.confidenceLevel,
      asOfDate: '2026-04-21',
      evidencePayload: {
        linked_kpis: pattern.linkedKpiIds,
      },
    });
  }

  for (const telemetry of telemetrySources) {
    evidence.push({
      id: `evidence_${telemetry.id}`,
      sourceId: null,
      title: `${telemetry.name} registration evidence`,
      summary: `${telemetry.description} · ${telemetry.modality} · ${telemetry.residencyMode ?? 'residency unspecified'}`,
      evidenceType: 'telemetry_registration',
      relatedEntityType: 'telemetry_source',
      relatedEntityId: telemetry.id,
      observedAt: telemetry.asOfDate,
      methodologyNotes: telemetry.regulatoryNotes,
      reasoningScopeSummary: telemetry.reasoningScopeSummary,
      disclosureScopeSummary: telemetry.disclosureScopeSummary,
      confidenceLevel: telemetry.confidenceLevel,
      asOfDate: telemetry.asOfDate,
      evidencePayload: {
        compliance_tags: telemetry.complianceTags,
        kpi_ids: telemetry.kpiIdsPopulated,
      },
    });
  }

  for (const event of externalEvents) {
    evidence.push({
      id: `evidence_${event.id}`,
      sourceId: event.sourceId,
      title: `${event.title} evidence`,
      summary: event.summary,
      evidenceType: 'external_event',
      relatedEntityType: 'external_event',
      relatedEntityId: event.id,
      observedAt: event.eventDate,
      methodologyNotes: null,
      reasoningScopeSummary: event.reasoningScopeSummary,
      disclosureScopeSummary: event.disclosureScopeSummary,
      confidenceLevel: event.confidenceLevel,
      asOfDate: event.asOfDate,
      evidencePayload: event.eventPayload,
    });
  }

  return evidence;
}

function buildAccessScopes(
  kpis: KpiSeed[],
  patterns: PatternPackSeed[],
  telemetrySources: TelemetrySourceSeed[],
  externalEvents: ExternalEventSeed[],
  evidence: EvidenceSeed[],
): AccessScopeSeed[] {
  const uniqueSummaries = new Set<string>();
  const scopes: AccessScopeSeed[] = [];
  const allSummaries = [
    ...kpis.flatMap((item) => [item.reasoningScopeSummary, item.disclosureScopeSummary]),
    ...patterns.flatMap((item) => [item.reasoningScopeSummary, item.disclosureScopeSummary]),
    ...telemetrySources.flatMap((item) => [item.reasoningScopeSummary, item.disclosureScopeSummary]),
    ...externalEvents.flatMap((item) => [item.reasoningScopeSummary, item.disclosureScopeSummary]),
    ...evidence.flatMap((item) => [item.reasoningScopeSummary, item.disclosureScopeSummary]),
  ];

  for (const summary of allSummaries) {
    const normalized = summary.trim();
    if (uniqueSummaries.has(normalized)) continue;
    uniqueSummaries.add(normalized);
    scopes.push(buildAccessScope(normalized));
  }

  return scopes;
}

export function buildAccessScope(summary: string): AccessScopeSeed {
  const normalized = summary.trim();
  const lower = normalized.toLowerCase();
  const programIds = extractProgramIds(normalized);
  const roleFilter = KNOWN_ROLES.filter((role) => normalized.includes(role));
  const regulatoryConstraints = ['SOX', 'MNPI', 'state privacy laws', 'CCPA', 'legal-privileged', 'PII', 'labor relations', 'law enforcement', 'supplier-confidential', 'competitively-sensitive', 'cybersecurity-sensitive', 'GLBA', 'FFIEC', 'PCI', 'BSA/AML', 'FinCEN', 'SR 11-7', 'regulatory confidentiality']
    .filter((item) => normalized.toLowerCase().includes(item.toLowerCase()));
  const outputModeFilter = lower.includes('reasoning-only') || lower.includes('never disclose')
    ? 'reasoning_only'
    : 'both';

  let scopeType: AccessScopeSeed['scopeType'] = 'program';
  if (lower === 'broad' || lower.startsWith('broad ')) scopeType = 'broad';
  else if (regulatoryConstraints.length > 0) scopeType = 'regulatory_restricted';
  else if (lower.includes('maestro')) scopeType = 'maestro';
  else if (roleFilter.length > 0 && programIds.length === 0) scopeType = 'role';

  return {
    id: `firstcap_scope_${slugify(normalized).slice(0, 90)}`,
    summary: normalized,
    scopeType,
    programIds,
    roleFilter,
    maestroFilter: lower.includes('maestro') ? ['program_maestro'] : [],
    outputModeFilter,
    regulatoryConstraints,
    conditions: deriveScopeConditions(normalized),
    auditRequired: true,
    scopePayload: {
      raw_summary: normalized,
      program_ids: programIds,
      role_filter: roleFilter,
      regulatory_constraints: regulatoryConstraints,
    },
  };
}

export function getScopeId(summary: string): string {
  return buildAccessScope(summary).id;
}

function extractProgramIds(summary: string): string[] {
  const programIds = KNOWN_PROGRAMS
    .filter((program) => summary.includes(program))
    .map((program) => slugify(program));

  if (/all maestros at tenant/i.test(summary) || /^broad/i.test(summary)) {
    return programIds;
  }

  return Array.from(new Set(programIds));
}

function deriveScopeConditions(summary: string): string[] {
  const conditions: string[] = [];
  if (/reasoning-only/i.test(summary)) conditions.push('reasoning_only_boundary');
  if (/specific values never disclosed/i.test(summary)) conditions.push('specific_values_never_disclosed');
  if (/aggregate/i.test(summary) && /never disclosable/i.test(summary)) conditions.push('aggregate_only_disclosure');
  if (/no customer-specific data disclosable/i.test(summary)) conditions.push('customer_level_redaction');
  if (/supplier-level/i.test(summary) || /competitive/i.test(summary)) conditions.push('competitive_detail_redaction');
  return conditions;
}

function extractLeadParagraph(block: string): string | null {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const first = lines.find((line) => !line.startsWith('###') && !line.startsWith('**'));
  return first ?? null;
}

function extractBoldValue(block: string, label: string): string | null {
  const regex = new RegExp(`\\*\\*${escapeRegex(label)}.*?\\.\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|\\n### |\\n---|$)`);
  const match = block.match(regex);
  return match?.[1]?.trim() ?? null;
}

function extractBulletField(block: string, label: string): string | null {
  const regex = new RegExp(`^- \\*\\*${escapeRegex(label)}:?\\*\\*\\s*(.+)$`, 'm');
  const match = block.match(regex);
  return match?.[1]?.trim() ?? null;
}

function extractListSection(block: string, label: string): string[] {
  const value = extractBoldValue(block, label);
  return normalizeList(value);
}

function parsePhaseDeliverables(block: string): PatternPackSeed['phaseDeliverables'] {
  const section = extractBoldValue(block, 'Phase-mapped deliverables') ?? '';
  const phases = {
    phase1: [] as string[],
    phase2: [] as string[],
    phase3: [] as string[],
    phase4: [] as string[],
  };

  const phaseMatches = [...section.matchAll(/\*Phase (\d).*?\.\*\s*([^\n]+)/g)];
  for (const match of phaseMatches) {
    const phase = Number(match[1]);
    const items = normalizeList(match[2]);
    if (phase === 1) phases.phase1 = items;
    if (phase === 2) phases.phase2 = items;
    if (phase === 3) phases.phase3 = items;
    if (phase === 4) phases.phase4 = items;
  }
  if (
    phases.phase1.length === 0 &&
    phases.phase2.length === 0 &&
    phases.phase3.length === 0 &&
    phases.phase4.length === 0
  ) {
    return deriveFallbackPhaseDeliverables(block);
  }
  return phases;
}

function deriveFallbackPhaseDeliverables(block: string): PatternPackSeed['phaseDeliverables'] {
  const interventions = extractListSection(block, 'Intervention options');
  const detections = extractListSection(block, 'Detection signals');
  return {
    phase1: detections.slice(0, 3),
    phase2: interventions.slice(0, 5),
    phase3: [
      'Decision package with sponsor tradeoffs',
      'Sequenced roadmap with KPI guardrails',
      'Operating model and ownership alignment',
    ],
    phase4: [
      'Execution plan and workstream mobilization',
      'Change management and adoption tracking',
      'KPI instrumentation and cadence reviews',
    ],
  };
}

function extractInlineClassificationField(line: string | null, label: string): string | null {
  if (!line) return null;
  const regex = new RegExp(`${escapeRegex(label)}:\\s*([^·]+)`, 'i');
  const match = line.match(regex);
  return match?.[1]?.trim() ?? null;
}

function parseOrdinalRefs(text: string | null): string[] {
  if (!text) return [];
  return Array.from(new Set((text.match(/\d+\.\d+\.\d+(?:-\d+\.\d+\.\d+)?/g) ?? [])));
}

function expandOrdinalRefs(refs: string[], kpiByOrdinal: Map<string, KpiSeed>): string[] {
  const expanded: string[] = [];
  for (const ref of refs) {
    if (!ref.includes('-')) {
      expanded.push(ref);
      continue;
    }
    const [start, end] = ref.split('-');
    const startParts = start.split('.').map(Number);
    const endParts = end.split('.').map(Number);
    if (startParts.length !== 3 || endParts.length !== 3) continue;
    if (startParts[0] !== endParts[0] || startParts[1] !== endParts[1]) continue;
    for (let item = startParts[2]; item <= endParts[2]; item += 1) {
      const candidate = `${startParts[0]}.${startParts[1]}.${item}`;
      if (kpiByOrdinal.has(candidate)) expanded.push(candidate);
    }
  }
  return Array.from(new Set(expanded));
}

function extractSegment(body: string, label: string): string | null {
  const idx = body.indexOf(label);
  if (idx < 0) return null;
  const rest = body.slice(idx + label.length);
  const breakpoints = [' · ', '\n- ', '\n**', '\n###', '\n\n'];
  let end = rest.length;
  for (const marker of breakpoints) {
    const markerIdx = rest.indexOf(marker);
    if (markerIdx >= 0 && markerIdx < end) end = markerIdx;
  }
  return rest.slice(0, end).trim().replace(/\*+/g, '');
}

function extractSegmentByPattern(body: string, pattern: RegExp): string | null {
  const match = pattern.exec(body);
  if (!match || match.index < 0) return null;
  const rest = body.slice(match.index + match[0].length);
  const breakpoints = [' · ', '\n- ', '\n**', '\n###', '\n\n'];
  let end = rest.length;
  for (const marker of breakpoints) {
    const markerIdx = rest.indexOf(marker);
    if (markerIdx >= 0 && markerIdx < end) end = markerIdx;
  }
  return rest.slice(0, end).trim().replace(/\*+/g, '');
}

function extractBacktickValue(body: string, label: string): string | null {
  const regex = new RegExp(`${escapeRegex(label)}\\s*\`([^\\\`]+)\``);
  const match = body.match(regex);
  return match?.[1]?.trim() ?? null;
}

function normalizeList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/ · | \| |, (?=[A-Z0-9(])/)
    .map((item) => item.replace(/^- /, '').trim())
    .filter(Boolean);
}

function stripBackticks(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/`/g, '').trim();
}

function parseNumericValue(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, '');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseTrendMagnitude(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/(-?\d+(?:\.\d+)?)%\s*(?:YoY|YTD|qoq|QoQ)?/i);
  return match ? Number(match[1]) : null;
}

function inferUnit(value: string | null): string | null {
  if (!value) return null;
  if (value.includes('%')) return '%';
  if (/\$/.test(value)) return '$';
  if (/\bminutes?\b/i.test(value)) return 'minutes';
  if (/\bmonthly\b/i.test(value)) return 'monthly';
  if (/\bmonths?\b/i.test(value)) return 'months';
  if (/\bdays?\b/i.test(value)) return 'days';
  if (/\bevents?\b/i.test(value)) return 'events';
  if (/percentile/i.test(value)) return 'percentile';
  return null;
}

function inferDate(value: string | null): string | null {
  if (!value) return null;
  const yearMatch = value.match(/(20\d{2})/);
  if (!yearMatch) return null;
  return `${yearMatch[1]}-12-31`;
}

function inferPeriod(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/\(([^)]+)\)/);
  return match?.[1]?.trim() ?? null;
}

function inferTrendDirection(value: string | null): string | null {
  if (!value) return null;
  if (/up/i.test(value)) return 'up';
  if (/down/i.test(value)) return 'down';
  if (/flat/i.test(value)) return 'flat';
  return null;
}

function inferTrendPeriod(value: string | null): string | null {
  if (!value) return null;
  if (/YoY/i.test(value)) return 'ytd';
  return null;
}

function inferDataSourceType(value: string | null): string | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes('dashboard') || lower.includes('system') || lower.includes('oms')) return 'client_dashboard';
  if (lower.includes('j.d. power') || lower.includes('syndicated')) return 'external';
  if (lower.includes('composite')) return 'composite';
  return 'client_report';
}

function extractBusinessUnit(ownerLine: string | null): string | null {
  if (!ownerLine) return null;
  const match = ownerLine.match(/business unit:\s*([^·]+)/i);
  return match?.[1]?.trim() ?? null;
}

function inferTelemetryModality(value: string | null): string {
  if (!value) return 'human';
  const lower = value.toLowerCase();
  if (lower.includes('api')) return 'api';
  if (lower.includes('share-link')) return 'share_link';
  if (lower.includes('export')) return 'export';
  return 'human';
}

function extractConnectorType(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/\(([^)]+)\)/);
  return match?.[1]?.trim() ?? null;
}

function inferRefreshSchedule(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/·\s*([^·]+)$/);
  return match?.[1]?.trim() ?? null;
}

function inferDataFormat(value: string | null): string | null {
  if (!value) return null;
  const connector = extractConnectorType(value);
  if (connector) return connector;
  if (/powerpoint|pdf/i.test(value)) return 'pptx/pdf';
  if (/excel/i.test(value)) return 'xlsx';
  return null;
}

function extractRegulatoryNotes(block: string): string | null {
  const disclosure = extractBulletField(block, 'Disclosure scope');
  if (disclosure && /privileged|PII|MNPI|SOX|law enforcement|cybersecurity|supplier|never disclosable/i.test(disclosure)) {
    return disclosure;
  }
  return null;
}

function chooseEvidenceSourceId(dataSource: string | null): string | null {
  if (!dataSource) return null;
  const lower = dataSource.toLowerCase();
  if (lower.includes('fdic') || lower.includes('ffiec') || lower.includes('j.d. power')) return 'firstcap_ext_source_bank_benchmarks';
  if (lower.includes('analyst') || lower.includes('sell-side') || lower.includes('rating')) return 'firstcap_ext_source_analyst_research';
  if (lower.includes('earnings') || lower.includes('transcript')) return 'firstcap_ext_source_earnings_transcripts';
  if (lower.includes('press') || lower.includes('trade')) return 'firstcap_ext_source_banking_trade_press';
  if (lower.includes('fed') || lower.includes('macro') || lower.includes('yield')) return 'firstcap_ext_source_macro_rate_and_credit_signals';
  if (lower.includes('dashboard') || lower.includes('system')) return null;
  return 'firstcap_ext_source_sec_filings';
}

function parseOwnerInfo(ownerLine: string | null): { ownerName: string | null; ownerRoleTitle: string | null } {
  if (!ownerLine) return { ownerName: null, ownerRoleTitle: null };

  const beforeParen = ownerLine.includes('(') ? ownerLine.slice(0, ownerLine.indexOf('(')).trim() : ownerLine.trim();
  const insideParen = ownerLine.includes('(') && ownerLine.includes(')')
    ? ownerLine.slice(ownerLine.indexOf('(') + 1, ownerLine.indexOf(')')).trim()
    : null;
  const looksLikeRole = /chief|head|president|officer|cfo|cro|cco|cio|cdo|svp|evp|legal/i.test(beforeParen);
  const looksLikeRoleInParen = insideParen ? /chief|head|president|officer|cfo|cro|cco|cio|cdo|svp|evp|legal/i.test(insideParen) : false;

  if (insideParen && looksLikeRole && !looksLikeRoleInParen) {
    return { ownerName: normalizeOwnerName(insideParen), ownerRoleTitle: beforeParen };
  }
  if (insideParen) {
    return { ownerName: normalizeOwnerName(beforeParen), ownerRoleTitle: insideParen };
  }
  if (looksLikeRole) {
    return { ownerName: normalizeOwnerName(beforeParen), ownerRoleTitle: beforeParen };
  }
  return { ownerName: normalizeOwnerName(beforeParen), ownerRoleTitle: null };
}

function normalizeOwnerName(name: string): string {
  const trimmed = name.trim();
  return OWNER_NAME_ALIASES[trimmed] ?? trimmed;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
