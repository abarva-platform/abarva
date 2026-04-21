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

export interface ParsedKeystoneOverlay {
  kpis: KpiSeed[];
  patternPacks: PatternPackSeed[];
  telemetrySources: TelemetrySourceSeed[];
  benchmarkCohorts: BenchmarkCohortSeed[];
  externalSources: ExternalSourceSeed[];
  externalEvents: ExternalEventSeed[];
  evidence: EvidenceSeed[];
  accessScopes: AccessScopeSeed[];
}

const KEYSTONE_OVERLAY_PATH = TENANTS.keystone
  ? 'docs/specs/_meta/seed-data/keystone-intelligence-layer-overlay.md'
  : '';

const KNOWN_PROGRAMS = [
  'Executive Advisory',
  'Finance Transformation',
  'Regulatory Strategy',
  'Transmission Capital',
  'Customer Experience Transformation',
  'Customer Affordability',
  'Operational Excellence',
  'Storm Response Coordination',
  'Cloud Migration',
  'Cybersecurity Modernization',
  'AI Platform',
  'HR Strategy',
  'Workforce Transformation',
  'Rate Case Strategy',
  'Regulatory Affairs',
  'Safety',
];

const KNOWN_ROLES = [
  'CFO',
  'SVP Finance',
  'AbarVa program lead',
  'CEO-direct-reports',
  'CX VP',
];

const KPI_BENCHMARK_OVERRIDES: Record<string, Partial<KpiSeed>> = {
  keystone_allowed_roe_wtd_avg: {
    benchmarkMedian: 9.6,
    benchmarkConfidence: 'high',
    benchmarkPeerCohortId: 'keystone_primary_peer_cohort',
    benchmarkAsOfDate: '2026-04-21',
  },
};

export function loadKeystoneOverlay(cwd = process.cwd()): ParsedKeystoneOverlay {
  const markdown = fs.readFileSync(path.resolve(cwd, KEYSTONE_OVERLAY_PATH), 'utf8');
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

    const ownerName = ownerLine ? ownerLine.split('(')[0].trim() : null;
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
    const benchmarkPeerCohortId = benchmarkMedian !== null ? 'keystone_primary_peer_cohort' : null;

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
      id: extractBacktickValue(body, 'ID:') ?? `keystone_${slugify(name)}`,
      ordinalRef,
      name,
      shortName: name,
      definition: extractSegment(body, 'Definition:'),
      category,
      subcategory,
      sectorApplicability: ['utility'],
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
      linkedPatternIds: normalizeList(linkedPatterns).map((item) => `keystone_pattern_${slugify(item)}`),
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
      id: `keystone_pattern_${slugify(name)}`,
      ordinalRef,
      name,
      shortDescription: extractLeadParagraph(block),
      longDescription: extractLeadParagraph(block),
      category: extractInlineClassificationField(classification, 'Category'),
      sectorApplicability: normalizeList(extractInlineClassificationField(classification, 'Sector applicability') ?? 'utility'),
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
      evidenceSummary: extractBoldValue(block, 'Keystone evidence'),
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
      id: stripBackticks(extractBulletField(block, 'ID')) ?? `keystone_telemetry_${slugify(name)}`,
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
      id: 'keystone_primary_peer_cohort',
      name: 'Primary regulated T&D utility peers',
      sector: 'utility',
      subsector: 'regulated transmission and distribution',
      sizeBand: '$15B-$35B revenue',
      geography: 'United States / PJM and adjacent jurisdictions',
      businessModel: 'regulated utility holding company',
      maturity: 'incumbent',
      peerCount: 9,
      isPrimary: true,
      peerCompanies: ['Exelon', 'Xcel Energy', 'PPL', 'DTE Energy', 'Ameren', 'ConEd', 'Eversource', 'NiSource', 'WEC Energy Group'],
      methodologyNotes: 'Primary peer cohort drawn from Keystone base seed Part 10 with tight comparable utility holding companies.',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'primary', source: 'Keystone base seed Part 10' },
    },
    {
      id: 'keystone_extended_grid_modernization_cohort',
      name: 'Extended grid modernization peers',
      sector: 'utility',
      subsector: 'regulated utility with large capital programs',
      sizeBand: '$15B-$50B revenue',
      geography: 'United States',
      businessModel: 'regulated utility / hybrid utility',
      maturity: 'incumbent',
      peerCount: 14,
      isPrimary: false,
      peerCompanies: ['Exelon', 'Xcel Energy', 'PPL', 'DTE Energy', 'Ameren', 'ConEd', 'Eversource', 'NiSource', 'WEC Energy Group', 'Duke Energy', 'Southern Company', 'Dominion Energy', 'American Electric Power', 'Edison International'],
      methodologyNotes: 'Extended comparison set for grid modernization, capital recovery, and clean energy transition dimensions.',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'extended', dimension: 'grid_modernization' },
    },
    {
      id: 'keystone_customer_experience_cohort',
      name: 'Utility customer-experience peers',
      sector: 'utility',
      subsector: 'regulated customer operations',
      sizeBand: '$10B-$35B revenue',
      geography: 'United States',
      businessModel: 'regulated distribution utility',
      maturity: 'incumbent',
      peerCount: 10,
      isPrimary: false,
      peerCompanies: ['Exelon', 'DTE Energy', 'Ameren', 'ConEd', 'Eversource', 'NiSource', 'WEC Energy Group', 'Duke Energy', 'Southern Company', 'Dominion Energy'],
      methodologyNotes: 'Customer-experience cohort used for JD Power, first-call resolution, and self-service comparisons.',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: { cohort_kind: 'dimension_specific', dimension: 'customer_experience' },
    },
  ];
}

function buildExternalSources(): ExternalSourceSeed[] {
  return [
    {
      id: 'keystone_ext_source_sec_filings',
      name: 'SEC filings and earnings materials',
      description: '10-K, 10-Q, 8-K, proxy, earnings slides, and transcripts for Keystone and peer utilities.',
      sourceTier: 'tier_1_public_disclosure',
      sourceType: 'public_filing',
      publisher: 'SEC EDGAR / investor relations',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['financial performance', 'capital deployment', 'strategic priorities'],
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'keystone_ext_source_state_pucs',
      name: 'State PUC rate case records',
      description: 'Illinois, Maryland, Pennsylvania, New Jersey, Delaware, and DC public utility commission materials.',
      sourceTier: 'tier_1_public_disclosure',
      sourceType: 'regulatory_filing',
      publisher: 'State public utility commissions',
      sourceUrl: null,
      geographyScope: ['Illinois', 'Maryland', 'Pennsylvania', 'New Jersey', 'Delaware', 'District of Columbia'],
      topicScope: ['rate cases', 'allowed ROE', 'customer affordability'],
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'keystone_ext_source_ferc_pjm',
      name: 'FERC and PJM proceedings',
      description: 'Federal and regional rulemakings affecting transmission planning, interconnection, and tariff design.',
      sourceTier: 'tier_1_public_disclosure',
      sourceType: 'regulatory_filing',
      publisher: 'FERC / PJM',
      sourceUrl: null,
      geographyScope: ['United States', 'PJM states'],
      topicScope: ['interconnection', 'large load management', 'capacity markets'],
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'keystone_ext_source_rating_agencies',
      name: 'Rating agency commentary',
      description: 'S&P, Moody’s, and Fitch commentary on utility capital deployment pace and credit outlook.',
      sourceTier: 'tier_2_third_party_research',
      sourceType: 'rating_agency',
      publisher: 'S&P / Moody’s / Fitch',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['capital structure', 'credit outlook'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'keystone_ext_source_epri_eei',
      name: 'Industry association benchmarks',
      description: 'EEI and EPRI benchmark materials for reliability, operations, and utility AI adoption.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'industry_dataset',
      publisher: 'EEI / EPRI',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['reliability', 'grid modernization', 'utility AI'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'keystone_ext_source_doe_nerc',
      name: 'DOE and NERC publications',
      description: 'Policy publications, standards updates, and reliability guidance relevant to Keystone.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'government_publication',
      publisher: 'DOE / NERC',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['reliability', 'NERC CIP', 'interconnection'],
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'keystone_ext_source_analyst_research',
      name: 'Analyst and sector research',
      description: 'Sell-side and sector research used as contextual input for utility peer movements and investor sentiment.',
      sourceTier: 'tier_2_third_party_research',
      sourceType: 'analyst_research',
      publisher: 'Utility sector analysts',
      sourceUrl: null,
      geographyScope: ['United States'],
      topicScope: ['investor sentiment', 'peer moves', 'valuation'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
    {
      id: 'keystone_ext_source_weather_events',
      name: 'Extreme weather and outage reporting',
      description: 'Industry-level event stream for storms, restoration complexity, and resilience implications.',
      sourceTier: 'tier_3_specialized_data',
      sourceType: 'event_stream',
      publisher: 'NOAA / industry operations reports',
      sourceUrl: null,
      geographyScope: ['Midwest', 'Mid-Atlantic'],
      topicScope: ['storm response', 'resilience', 'customer communications'],
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      metadata: {},
    },
  ];
}

function buildExternalEvents(): ExternalEventSeed[] {
  return [
    {
      id: 'keystone_event_role_launch_jonathan_aldridge',
      sourceId: 'keystone_ext_source_sec_filings',
      title: 'Jonathan Aldridge appointed EVP and Chief Customer and Technology Officer',
      summary: 'Keystone unified customer strategy, customer operations, enterprise technology, and digital under Jonathan Aldridge in February 2026, signaling Phase 4 integrated transformation.',
      eventType: 'executive_move',
      eventDate: '2026-02-01',
      entities: ['Jonathan Aldridge', 'Keystone Energy Holdings'],
      topics: ['customer experience transformation', 'technology modernization'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Keystone base seed Part 2 / Part 4' },
    },
    {
      id: 'keystone_event_illinois_large_load_tariff_filing',
      sourceId: 'keystone_ext_source_state_pucs',
      title: 'Illinois large-load tariff filing submitted',
      summary: 'Riverbend submitted its large-load tariff filing in March 2026, advancing Keystone’s strategy to allocate data-center load costs more explicitly.',
      eventType: 'regulatory_filing',
      eventDate: '2026-03-15',
      entities: ['Riverbend Electric Company', 'Illinois Commerce Commission'],
      topics: ['large load management', 'rate design', 'interconnection'],
      geography: ['Illinois'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Keystone base seed Part 6 / pattern 7.2' },
    },
    {
      id: 'keystone_event_multistate_rate_case_cycle',
      sourceId: 'keystone_ext_source_state_pucs',
      title: 'Four active rate cases entered peak decision cycle',
      summary: 'As of April 2026, Keystone had active rate case proceedings in Illinois, Maryland, New Jersey, and Delaware with decisions expected between Q2 and Q4 2026.',
      eventType: 'regulatory_cycle',
      eventDate: '2026-04-01',
      entities: ['Elena Vosburgh', 'Danielle Westergaard', 'Keystone Energy Holdings'],
      topics: ['rate cases', 'allowed ROE', 'capital recovery'],
      geography: ['Illinois', 'Maryland', 'New Jersey', 'Delaware'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Keystone base seed Part 1 / Part 6' },
    },
    {
      id: 'keystone_event_q1_capital_plan_deployment',
      sourceId: 'keystone_ext_source_sec_filings',
      title: 'Grid modernization capital plan at 22% of full-year pace through Q1',
      summary: 'Grid Modernization 2030 Phase 2 had deployed 22% of annual plan through Q1 2026, increasing scrutiny on rate recovery timing and capital sequencing.',
      eventType: 'financial_update',
      eventDate: '2026-03-31',
      entities: ['Grid Modernization 2030', 'Elena Vosburgh', 'Nicole Hargrave-Park'],
      topics: ['capital deployment', 'grid modernization', 'rate recovery'],
      geography: ['United States'],
      significance: 'medium',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Keystone base seed Part 6.1.1' },
    },
    {
      id: 'keystone_event_pjm_large_load_rulemaking',
      sourceId: 'keystone_ext_source_ferc_pjm',
      title: 'PJM and FERC large-load rulemaking intensified',
      summary: 'Federal-state tension on large-load interconnection remained elevated after the December 2025 PJM/FERC rulemaking activity, increasing uncertainty for Keystone’s 32 GW queue strategy.',
      eventType: 'rulemaking',
      eventDate: '2026-01-15',
      entities: ['PJM Interconnection', 'FERC', 'Angela Yamamoto'],
      topics: ['interconnection', 'federal-state jurisdiction', 'large load management'],
      geography: ['PJM states'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'medium',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Keystone overlay pattern 3.2 / base seed Part 7.2' },
    },
    {
      id: 'keystone_event_shadow_ai_governance_gap',
      sourceId: 'keystone_ext_source_analyst_research',
      title: 'Shadow AI governance exposure surfaced across 17 teams',
      summary: 'Composite signal synthesis identified 11 AI-adjacent tools across 17 teams, with four tools carrying unreviewed data-sharing posture and seven set to auto-renew, escalating governance urgency.',
      eventType: 'internal_signal',
      eventDate: '2026-04-10',
      entities: ['Jonathan Aldridge', 'Hideki Tanaka', 'Keystone Energy Holdings'],
      topics: ['AI governance', 'shadow AI', 'NERC CIP sensitivity'],
      geography: ['United States'],
      significance: 'high',
      reasoningScopeSummary: 'broad',
      disclosureScopeSummary: 'broad',
      confidenceLevel: 'high',
      asOfDate: '2026-04-21',
      eventPayload: { source_note: 'Keystone overlay pattern 3.1' },
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
  const regulatoryConstraints = ['NERC CIP', 'SOX', 'MNPI', 'state privacy laws', 'legal-privileged', 'PII', 'labor relations']
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
    id: `keystone_scope_${slugify(normalized).slice(0, 90)}`,
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
  return phases;
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
  if (disclosure && /NERC CIP|privileged|PII|never disclosable/i.test(disclosure)) {
    return disclosure;
  }
  return null;
}

function chooseEvidenceSourceId(dataSource: string | null): string | null {
  if (!dataSource) return null;
  const lower = dataSource.toLowerCase();
  if (lower.includes('j.d. power')) return 'keystone_ext_source_analyst_research';
  if (lower.includes('interconnection')) return 'keystone_ext_source_ferc_pjm';
  if (lower.includes('rate case')) return 'keystone_ext_source_state_pucs';
  if (lower.includes('dashboard') || lower.includes('system')) return null;
  return 'keystone_ext_source_sec_filings';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
