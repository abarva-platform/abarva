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

export interface ParsedApexOverlay {
  kpis: KpiSeed[];
  patternPacks: PatternPackSeed[];
  telemetrySources: TelemetrySourceSeed[];
  benchmarkCohorts: BenchmarkCohortSeed[];
  externalSources: ExternalSourceSeed[];
  externalEvents: ExternalEventSeed[];
  evidence: EvidenceSeed[];
  accessScopes: AccessScopeSeed[];
}

const APEX_OVERLAY_PATH = TENANTS.apex
  ? 'docs/specs/_meta/seed-data/apex-intelligence-layer-overlay.md'
  : '';

const KNOWN_PROGRAMS = [
  'Executive Advisory',
  'Finance Transformation',
  'Merchandising Transformation',
  'Customer Experience Transformation',
  'Digital Commerce',
  'Loyalty',
  'Marketing',
  'Store Operations',
  'Supply Chain',
  'Technology Transformation',
  'Cybersecurity Modernization',
  'AI Platform and Governance',
  'Loss Prevention',
  'HR Strategy',
  'Workforce Transformation',
];

const KNOWN_ROLES = [
  'CFO',
  'Chief Marketing and Customer Officer',
  'Chief Merchandising Officer',
  'Chief Information Officer',
  'Chief Stores Officer',
  'Chief Supply Chain Officer',
  'Chief Human Resources Officer',
  'SVP Store Operations',
  'SVP Data and Analytics',
];

const OWNER_NAME_ALIASES: Record<string, string> = {
  'David Morrison': 'Daniel Kovač',
  'Marcus Whitfield': 'Karel Jensen',
  'Rebecca Chen-Matsuda': 'Jordan Alkaev',
};

const KPI_BENCHMARK_OVERRIDES: Record<string, Partial<KpiSeed>> = {
  apex_same_day_fulfillment_pct: {
    ownerName: 'Karel Jensen',
    ownerRoleTitle: 'Chief Marketing and Customer Officer',
    businessUnitName: 'Customer and Marketing',
  },
  apex_click_collect_adoption: {
    ownerName: 'Karel Jensen',
    ownerRoleTitle: 'Chief Marketing and Customer Officer',
    businessUnitName: 'Customer and Marketing',
  },
  apex_sfs_volume: {
    ownerName: 'Karel Jensen',
    ownerRoleTitle: 'Chief Marketing and Customer Officer',
    businessUnitName: 'Customer and Marketing',
  },
};

export function loadApexOverlay(cwd = process.cwd()): ParsedApexOverlay {
  const markdown = fs.readFileSync(path.resolve(cwd, APEX_OVERLAY_PATH), 'utf8');
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
    const benchmarkMedianText = extractSegment(body, 'Benchmark median:') ?? extractSegment(body, 'Benchmark:');
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

    const ownerName = ownerLine ? normalizeOwnerName(ownerLine.split('(')[0].trim()) : null;
    const ownerRoleTitle = ownerLine && ownerLine.includes('(')
      ? ownerLine.slice(ownerLine.indexOf('(') + 1, ownerLine.indexOf(')')).trim()
      : null;
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
    const benchmarkPeerCohortId = benchmarkMedian !== null ? 'apex_primary_peer_cohort' : null;

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
      id: extractBacktickValue(body, 'ID:') ?? `apex_${slugify(name)}`,
      ordinalRef,
      name,
      shortName: name,
      definition: extractSegment(body, 'Definition:'),
      category,
      subcategory,
      sectorApplicability: ['retail'],
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
      linkedPatternIds: normalizeList(linkedPatterns).map((item) => `apex_pattern_${slugify(item)}`),
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
      id: `apex_pattern_${slugify(name)}`,
      ordinalRef,
      name,
      shortDescription: extractLeadParagraph(block),
      longDescription: extractLeadParagraph(block),
      category: extractInlineClassificationField(classification, 'Category'),
      sectorApplicability: normalizeList(extractInlineClassificationField(classification, 'Sector applicability') ?? 'retail'),
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
      evidenceSummary: extractBoldValue(block, 'Apex evidence'),
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
    const kpisText = extractBulletField(block, 'KPIs populated');
    const reasoningScopeSummary = extractBulletField(block, 'Reasoning scope') ?? 'broad';
    const disclosureScopeSummary = extractBulletField(block, 'Disclosure scope') ?? 'broad';

    sources.push({
      id: stripBackticks(extractBulletField(block, 'ID')) ?? `apex_telemetry_${slugify(name)}`,
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
      residencyMode: extractBulletField(block, 'Residency mode'),
      retentionPolicy: 'Client-governed per north star Part 9',
      complianceTags: normalizeList(extractBulletField(block, 'Compliance tags')),
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
      id: 'apex_primary_peer_cohort',
      name: 'Primary mass-market retail peer cohort',
      sector: 'retail',
      subsector: 'mass-market multi-category retail',
      sizeBand: '$40B-$700B revenue',
      geography: 'United States',
      businessModel: 'store-led omnichannel retailer',
      maturity: 'incumbent',
      peerCount: 6,
      isPrimary: true,
      peerCompanies: ['Target', 'Walmart', 'Costco', 'Kroger', 'Amazon (retail segment)', 'Best Buy'],
      methodologyNotes: 'Primary cohort from Apex base seed Part 10 focused on national omnichannel retailers used for comp-sales, digital, and margin comparisons.',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'primary', source: 'Apex base seed Part 10' },
    },
    {
      id: 'apex_owned_brand_and_margin_cohort',
      name: 'Owned brand and merchandise productivity peers',
      sector: 'retail',
      subsector: 'owned-brand-led general merchandise retail',
      sizeBand: '$10B-$700B revenue',
      geography: 'United States',
      businessModel: 'multi-category retailer with material private-label mix',
      maturity: 'incumbent',
      peerCount: 8,
      isPrimary: false,
      peerCompanies: ['Target', 'Costco', 'Trader Joe\'s', 'TJX', 'Kroger', 'Whole Foods', 'Aldi', 'Dollar General'],
      methodologyNotes: 'Used for owned-brand penetration, gross-margin capture, and merchandise turn comparisons where assortment architecture matters as much as scale.',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'dimension_specific', dimension: 'owned_brand_margin' },
    },
    {
      id: 'apex_customer_experience_cohort',
      name: 'Retail customer experience and loyalty peers',
      sector: 'retail',
      subsector: 'omnichannel customer and loyalty operations',
      sizeBand: '$10B-$700B revenue',
      geography: 'United States',
      businessModel: 'membership or loyalty-led retail operator',
      maturity: 'incumbent',
      peerCount: 9,
      isPrimary: false,
      peerCompanies: ['Target', 'Amazon (retail segment)', 'Costco', 'Best Buy', 'Sephora', 'REI', 'Kroger', 'Walmart', 'Trader Joe\'s'],
      methodologyNotes: 'Customer-experience cohort used for NPS, self-service adoption, loyalty premium, conversion, and fulfillment experience comparisons.',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'dimension_specific', dimension: 'customer_experience' },
    },
  ];
}

function buildExternalSources(): ExternalSourceSeed[] {
  return [
    {
      id: 'apex_ext_source_sec_filings',
      name: 'SEC filings and earnings materials',
      description: '10-K, 10-Q, 8-K, proxy, earnings slides, and investor materials for Apex and public retail peers.',
      sourceTier: 'tier_1_public_disclosure',
      sourceType: 'public_filing',
      publisher: 'SEC EDGAR / investor relations',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['financial performance', 'strategic priorities', 'capital allocation'],
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'apex_ext_source_earnings_transcripts',
      name: 'Retail earnings call transcripts',
      description: 'Quarterly earnings call transcripts and analyst Q&A across Apex and key peers.',
      sourceTier: 'tier_1_public_disclosure',
      sourceType: 'earnings_transcript',
      publisher: 'Investor relations / transcript providers',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['strategy shifts', 'same-store sales', 'inventory posture', 'AI investment'],
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'apex_ext_source_trade_press',
      name: 'Retail trade press and market reporting',
      description: 'Retail-focused reporting used to track executive moves, store-format tests, vendor partnerships, and competitive positioning.',
      sourceTier: 'tier_2_third_party_research',
      sourceType: 'trade_press',
      publisher: 'Retail industry press',
      sourceUrl: null,
      geographyScope: ['United States', 'Canada', 'Mexico'],
      topicScope: ['executive moves', 'store format innovation', 'retail media', 'competitive moves'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'apex_ext_source_rating_agencies',
      name: 'Rating agency commentary',
      description: 'S&P, Moody’s, and Fitch commentary on Apex capital allocation, margin defense, and credit outlook.',
      sourceTier: 'tier_2_third_party_research',
      sourceType: 'rating_agency',
      publisher: 'S&P / Moody’s / Fitch',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['capital structure', 'credit outlook', 'cost reduction pacing'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'apex_ext_source_retail_benchmarks',
      name: 'Retail benchmark and syndicated data providers',
      description: 'Syndicated benchmark feeds for retail performance, category dynamics, and customer experience metrics.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'industry_dataset',
      publisher: 'NRF / Placer.ai / Circana / J.D. Power',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['customer experience', 'traffic', 'conversion', 'retail performance'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'apex_ext_source_consumer_signals',
      name: 'Consumer spend and sentiment signals',
      description: 'Macro consumer, loyalty, and spend datasets used to contextualize Apex pricing and basket-size performance.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'market_dataset',
      publisher: 'Consumer and payments intelligence providers',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['consumer behavior shifts', 'inflation and pricing', 'basket dynamics'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'apex_ext_source_analyst_research',
      name: 'Analyst and sector research',
      description: 'Sell-side and sector research used for peer positioning, margin outlook, and AI-in-retail sentiment.',
      sourceTier: 'tier_2_third_party_research',
      sourceType: 'analyst_research',
      publisher: 'Retail sector analysts',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['investor sentiment', 'peer moves', 'valuation', 'owned brand strategy'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'apex_ext_source_risk_and_compliance_watch',
      name: 'Risk, labor, and cybersecurity watch',
      description: 'External monitoring of organized retail crime, labor actions, state privacy enforcement, and material cyber events across retail.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'event_stream',
      publisher: 'Risk intelligence providers / public notices',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['shrinkage and ORC', 'labor actions', 'privacy regulation', 'cybersecurity incidents'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
  ];
}

function buildExternalEvents(): ExternalEventSeed[] {
  return [
    {
      id: 'apex_event_cfo_transition_kovac',
      sourceId: 'apex_ext_source_sec_filings',
      title: 'Daniel Kovač joined as CFO with explicit working-capital and capital-allocation mandate',
      summary: 'Apex installed Daniel Kovač as CFO in Q2 2025, sharpening the enterprise margin-defense and working-capital agenda after a period of interim finance leadership.',
      eventType: 'executive_move',
      eventDate: '2025-05-01',
      entities: ['Daniel Kovač', 'Apex Retail Group'],
      topics: ['margin defense', 'capital allocation', 'finance transformation'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Apex base seed Part 2 / Part 4' },
    },
    {
      id: 'apex_event_ai_strategy_announcement',
      sourceId: 'apex_ext_source_earnings_transcripts',
      title: 'Apex announced a three-year $400M AI operations investment',
      summary: 'The FY2025 Q3 earnings cycle introduced Apex\'s $400M AI-enabled retail operations agenda spanning merchandising intelligence, supply chain optimization, personalization, and store operations.',
      eventType: 'strategy_announcement',
      eventDate: '2025-11-15',
      entities: ['Vincent Okafor', 'Priya Sethi', 'Apex Retail Group'],
      topics: ['AI in retail', 'operational excellence', 'investor scrutiny'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Apex base seed recent developments / Part 3.4' },
    },
    {
      id: 'apex_event_supply_chain_incident_jan_2026',
      sourceId: 'apex_ext_source_trade_press',
      title: 'Vendor bankruptcy exposed East Region supply concentration risk',
      summary: 'A January 2026 supply disruption affected roughly 12% of East Region stores for about three weeks, surfacing vendor concentration and logistics resilience risk inside Apex\'s supply chain network.',
      eventType: 'operational_incident',
      eventDate: '2026-01-20',
      entities: ['Maria Delgado', 'Apex Retail Group', 'East Region'],
      topics: ['supply chain resilience', 'vendor concentration', 'inventory precision'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Apex base seed recent developments' },
    },
    {
      id: 'apex_event_activist_investor_engagement',
      sourceId: 'apex_ext_source_sec_filings',
      title: 'Activist fund disclosed 3.4% stake and pushed owned-brand monetization',
      summary: 'An activist investor engagement in February 2026 increased pressure on Apex to accelerate owned-brand monetization, rationalize the store fleet, and strengthen board-level AI governance.',
      eventType: 'investor_event',
      eventDate: '2026-02-14',
      entities: ['Vincent Okafor', 'Apex Retail Group', 'Technology and Risk Committee'],
      topics: ['owned brand growth', 'board AI governance', 'store fleet rationalization'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Apex base seed recent developments / board context' },
    },
    {
      id: 'apex_event_analyst_day_targets',
      sourceId: 'apex_ext_source_earnings_transcripts',
      title: 'Analyst day reaffirmed ambitious 2027 margin and digital targets',
      summary: 'At the March 2026 analyst day Apex reaffirmed 27% owned-brand penetration, 25% e-commerce penetration, and 5.8% operating margin targets, with finance and technology leaders tying delivery to AI-enabled decision velocity.',
      eventType: 'analyst_day',
      eventDate: '2026-03-12',
      entities: ['Vincent Okafor', 'Daniel Kovač', 'Priya Sethi', 'Apex Retail Group'],
      topics: ['operating margin', 'digital commerce', 'owned brand growth'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Apex base seed recent developments / Part 3.5' },
    },
    {
      id: 'apex_event_shadow_ai_governance_gap',
      sourceId: 'apex_ext_source_analyst_research',
      title: 'Shadow AI governance exposure surfaced across 17 teams',
      summary: 'Composite signal synthesis identified 11 AI-adjacent tools across 17 teams, with four tools carrying unreviewed data-sharing posture and seven set to auto-renew, escalating governance urgency.',
      eventType: 'internal_signal',
      eventDate: '2026-04-10',
      entities: ['Priya Sethi', 'Karel Jensen', 'Jordan Alkaev', 'Apex Retail Group'],
      topics: ['AI governance', 'shadow AI', 'retail workflow sprawl'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Apex overlay pattern 3.1' },
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
  const regulatoryConstraints = ['SOX', 'MNPI', 'state privacy laws', 'CCPA', 'legal-privileged', 'PII', 'labor relations', 'law enforcement', 'supplier-confidential', 'competitively-sensitive', 'cybersecurity-sensitive']
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
    id: `apex_scope_${slugify(normalized).slice(0, 90)}`,
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
  if (/minutes?/i.test(value)) return 'minutes';
  if (/months?/i.test(value)) return 'months';
  if (/days?/i.test(value)) return 'days';
  if (/events?/i.test(value)) return 'events';
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
  if (lower.includes('j.d. power') || lower.includes('circana') || lower.includes('placer')) return 'apex_ext_source_retail_benchmarks';
  if (lower.includes('analyst') || lower.includes('sell-side')) return 'apex_ext_source_analyst_research';
  if (lower.includes('earnings') || lower.includes('transcript')) return 'apex_ext_source_earnings_transcripts';
  if (lower.includes('press') || lower.includes('trade')) return 'apex_ext_source_trade_press';
  if (lower.includes('dashboard') || lower.includes('system')) return null;
  return 'apex_ext_source_sec_filings';
}

function normalizeOwnerName(name: string): string {
  return OWNER_NAME_ALIASES[name] ?? name;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
