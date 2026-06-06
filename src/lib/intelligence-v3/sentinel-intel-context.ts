import {
  APEX_RETAIL_BY_FN_ROWS,
  APEX_RETAIL_PEER_ROWS,
  APEX_RETAIL_SESSIONS,
  APEX_RETAIL_STRATEGY_BULLETS,
  APEX_RETAIL_VENDOR_SPEND,
  type AttentionItem,
  type PatternRow,
} from '@/components/intelligence-v3/cxo-fixtures';
import type { ArtOfPossibleData, RetailIntelligenceStatus, StageKey } from '@/components/intelligence-v3/types';
import type { EnterpriseContextOverview } from '@/lib/enterprise-context/intelligence-read-model';
import type { BriefData, MapData } from '@/lib/knowledge-corpus/types';

export interface BuildSentinelIntelContextArgs {
  activeClient: string;
  clientKey?: string | null;
  stage: StageKey;
  isApexBound: boolean;
  hasBoundCorpus?: boolean;
  status: RetailIntelligenceStatus | null;
  patterns: readonly PatternRow[];
  todayItems: readonly AttentionItem[];
  aopBands: ArtOfPossibleData;
  briefData?: BriefData | null;
  mapData?: MapData | null;
  enterpriseContext?: EnterpriseContextOverview | null;
}

export function buildSentinelIntelContext(args: BuildSentinelIntelContextArgs): Record<string, unknown> {
  const pageFacts = [
    `Tenant: ${args.activeClient}.`,
    `Active Intelligence tab: ${args.stage}.`,
    args.status
      ? `Readiness strip: ${args.status.patterns} retail patterns, ${args.status.summarizedSources}/${args.status.sources} summarized sources, ${args.status.useCases} Apex use cases, ${args.status.contradictions} open tensions, ${args.status.graphEdges} portfolio relationships.`
      : null,
    args.isApexBound
      ? 'This is the Apex Retail Intelligence layer. Keep answers scoped to retail strategy, CXO ownership, value capture, vendor leverage, and readiness.'
      : `This is the ${args.activeClient} Intelligence layer. Keep answers scoped to the active tenant, its Enterprise Context, and the evidence surfaced on this page.`,
  ].filter((fact): fact is string => Boolean(fact));

  const stageFacts = stageSurfaceFacts(args);
  const tenantFacts = tenant360Facts(args);
  const vendorFacts = args.isApexBound ? apexVendorFacts() : [];
  const useCaseFacts = args.isApexBound ? apexUseCaseFacts(args) : [];
  const graphFacts = args.isApexBound ? apexGraphFacts(args) : [];
  const riskFacts = args.isApexBound ? apexRiskFacts(args) : [];
  const strategyFacts = args.isApexBound ? apexStrategyFacts(args) : [];
  const sourceFacts = args.isApexBound ? apexSourceFacts(args) : [];
  const enterpriseFacts = enterpriseContextFacts(args.enterpriseContext);
  const qualityFacts = uniqueFacts([
    ...(args.isApexBound ? apexQualityFacts(args) : []),
    ...enterpriseQualityFacts(args.enterpriseContext),
  ]);
  const combinedTenantFacts = uniqueFacts([...tenantFacts, ...enterpriseFacts]);

  return {
    activeTab: args.stage,
    activeClient: args.activeClient,
    clientKey: args.clientKey ?? (args.isApexBound ? 'apexretail' : null),
    evidenceContext: buildEvidenceContext(args.enterpriseContext),
    substrate: args.status,
    pageFacts,
    stageFacts,
    tenantFacts: combinedTenantFacts,
    vendorFacts,
    useCaseFacts,
    graphFacts,
    riskFacts,
    strategyFacts,
    sourceFacts,
    qualityFacts,
    facts: uniqueFacts([
      ...pageFacts,
      ...stageFacts,
      ...combinedTenantFacts,
      ...riskFacts,
      ...strategyFacts,
      ...vendorFacts,
      ...useCaseFacts,
      ...graphFacts,
      ...sourceFacts,
      ...qualityFacts,
    ]),
  };
}

function buildEvidenceContext(overview: EnterpriseContextOverview | null | undefined): Record<string, unknown> | null {
  if (!overview || overview.evidenceUsableCount <= 0) return null;
  return {
    kind: 'enterprise_context',
    tenantKey: overview.tenantKey,
    recordCount: overview.counts.records,
    factCount: overview.counts.facts,
    relationshipCount: overview.counts.relationships,
    evidenceCount: overview.counts.evidence,
    usableEvidenceCount: overview.evidenceUsableCount,
    sourceCount: overview.counts.sources,
    sourceSystems: overview.sourceSystems.slice(0, 12),
  };
}

function stageSurfaceFacts(args: BuildSentinelIntelContextArgs): string[] {
  if (args.stage === 'enterprise-context') return enterpriseContextFacts(args.enterpriseContext);
  if (!args.isApexBound && !args.hasBoundCorpus) return [];
  switch (args.stage) {
    case 'brief':
      return briefFacts(args.briefData);
    case 'map':
      return mapFacts(args.mapData);
    case 'vendors':
      return apexVendorFacts();
    case 'patterns':
      return args.patterns.slice(0, 12).map((pattern) =>
        `${pattern.id} ${pattern.name}: ${pattern.description} Failure without controls ${pattern.failureRatePct ?? pattern.withoutPct}%; binds to ${pattern.bindsTo}.`,
      );
    case 'today':
      return args.todayItems.map((item) =>
        `${item.toneLabel}: ${item.title}. ${item.body}${item.dependency ? ` Dependency: ${item.dependency}` : ''}`,
      );
    case 'by-function':
      return [
        'By-function matrix shows front-office loyalty, personalization, commerce, and clienteling concentration; middle-office demand, inventory, replenishment, supply-chain, and shrink pressure; and back-office finance, workforce, loss-prevention, and platform modernization dependencies.',
        `Front-office active refs: ${refsForByFunction('front-office').join(', ')}.`,
        `Middle-office active refs: ${refsForByFunction('middle-office').join(', ')}.`,
        `Back-office active refs: ${refsForByFunction('back-office').join(', ')}.`,
      ];
    case 'peer-activity':
      return APEX_RETAIL_PEER_ROWS.slice(0, 8).map((row) =>
        `${row.cohort}: ${row.outcome}; adoption ${row.adoptionPct}%; ${row.delta}.`,
      );
    case 'my-strategy':
      return apexStrategyFacts(args);
    case 'sessions':
      return APEX_RETAIL_SESSIONS.slice(0, 8).map((row) =>
        `${row.thread}: ${row.lastTurn}; ${row.exchanges} exchanges; ${row.ageLabel}; ${row.pinned ? 'pinned' : 'unpinned'}.`,
      );
    case 'art-of-possible':
      return [
        `Art of Possible: ${args.aopBands.totalPossibleLabel}; ${args.aopBands.totalCapturingLabel}.`,
        args.aopBands.cxoFrame,
        ...args.aopBands.bands.map((band) =>
          `${band.label}: ${band.verdict}; possible ${band.possibleUsd}; capturing ${band.capturingUsd}; ${band.blocker ?? 'no named blocker'}.`,
        ),
      ];
    default:
      return [];
  }
}

function tenant360Facts(args: BuildSentinelIntelContextArgs): string[] {
  if (args.enterpriseContext && !args.isApexBound) {
    return [
      `Tenant 360: ${args.activeClient} has an Enterprise Context layer loaded from internal client data. Use this before generic corpus guidance for current-state questions.`,
      ...enterpriseContextFacts(args.enterpriseContext).slice(0, 8),
    ];
  }
  if (!args.isApexBound) return [];
  const facts = [
    'Tenant 360: Apex Retail is the active retail client. Do not use Meridian Healthcare, Epic EHR, IDN, CMIO, HIPAA, or clinical AI facts unless the user explicitly asks for healthcare examples.',
    'Executive posture: CMO wants loyalty and personalization outcomes, CTO owns platform/CDP plumbing, CFO wants cost-takeout evidence, CIO is sequencing platform modernization.',
    'Current strategic center: resolve customer identity and consent, decide the integration hub, sequence demand sensing through item-location readiness, and prevent AI pilots from outrunning data readiness.',
  ];
  if (args.status) {
    facts.push(
      `Intelligence coverage: ${args.status.patterns} retail patterns, ${args.status.sources} knowledge sources, ${args.status.useCases} Apex use cases, ${args.status.contradictions} open tensions, ${args.status.graphEdges} portfolio relationships.`,
    );
  }
  if (args.briefData?.synthesis) facts.push(`Brief synthesis: ${args.briefData.synthesis}`);
  return facts;
}

function enterpriseContextFacts(overview: EnterpriseContextOverview | null | undefined): string[] {
  if (!overview) return [];
  return [
    ...overview.sentinelFacts,
    ...overview.cards.slice(0, 8).map((card) =>
      `${card.title}: ${card.whatWeKnow} Why it matters: ${card.whyItMatters} Owner: ${card.owner}; freshness ${card.freshness}; confidence ${card.confidence}; sources ${card.sourceSystems.join(', ') || 'internal context'}.`,
    ),
  ];
}

function enterpriseQualityFacts(overview: EnterpriseContextOverview | null | undefined): string[] {
  if (!overview) return [];
  return [
    `Enterprise Context quality: ${overview.counts.qualityIssues} open quality issues and ${overview.counts.stewardshipTasks} stewardship tasks; ${overview.evidenceUsableCount}/${overview.counts.evidence} evidence rows are usable.`,
    `Enterprise Context freshness: ${overview.freshnessCounts.fresh ?? 0} fresh records, ${overview.freshnessCounts.attention ?? 0} attention records, ${overview.freshnessCounts.stale ?? 0} stale records, ${overview.freshnessCounts.unknown ?? 0} unknown records.`,
  ];
}

function briefFacts(data: BriefData | null | undefined): string[] {
  if (!data) return [];
  return [
    `Brief: ${data.bets.length} ranked bets above the line, ${data.belowTheLine?.length ?? 0} below the line, ${data.patternsTriggered.length} triggered patterns.`,
    data.synthesis ? `Brief synthesis: ${data.synthesis}` : null,
    ...data.bets.slice(0, 4).map((bet) =>
      `Brief bet ${bet.rank}: ${bet.useCase.name}; score ${bet.score}; decision ${bet.decision?.label ?? 'review'}; state ${bet.engagementState}; patterns ${bet.bindingPatterns.map((p) => p.pattern.id).join(', ') || 'none'}.`,
    ),
    ...(data.belowTheLine ?? []).slice(0, 4).map((bet) =>
      `Below the line ${bet.rank}: ${bet.useCaseName}; ${bet.valueLabel}; ${bet.ttvLabel}; ${bet.hint}.`,
    ),
  ].filter((fact): fact is string => Boolean(fact));
}

function mapFacts(data: MapData | null | undefined): string[] {
  if (!data) return [];
  const atRisk = data.nodes.filter((node) => node.engagementState === 'at_risk');
  const inFlight = data.nodes.filter((node) => node.engagementState === 'in_flight');
  const candidate = data.nodes.filter((node) => node.engagementState === 'not_started');
  return [
    `Map: ${data.totalUseCases} use cases; ${inFlight.length} in flight, ${atRisk.length} at risk, ${candidate.length} candidates; refreshed ${data.refreshedLabel}.`,
    ...data.whatChanged.slice(0, 5).map((change) =>
      `Map change ${change.entityId}: ${change.summary} from ${change.source}.`,
    ),
    ...data.nodes.slice(0, 10).map((node) =>
      `${node.initiativeDisplayId ?? node.useCase.id}: ${node.useCase.name}; ${node.engagementState}; lifecycle ${node.useCase.lifecycleStage}; value ${node.useCase.businessValueRanges.perCompanySize.veryLarge ?? node.useCase.businessValueRanges.perCompanySize.large ?? 'not specified'}; patterns ${node.useCase.successPatterns.map((p) => p.patternId).join(', ') || 'none'}.`,
    ),
  ];
}

function apexVendorFacts(): string[] {
  const totalSpend = APEX_RETAIL_VENDOR_SPEND.reduce((sum, row) => sum + row.spendUsdM, 0);
  const risk = APEX_RETAIL_VENDOR_SPEND.filter((row) => row.health === 'risk');
  const watch = APEX_RETAIL_VENDOR_SPEND.filter((row) => row.health === 'watch');
  const analytics = APEX_RETAIL_VENDOR_SPEND.filter((row) =>
    /data|analytics|cdp|ml|cloud|identity|integration|personalization|demand/i.test(
      `${row.vendor} ${row.subcategory} ${row.takeaway}`,
    ),
  );

  return [
    `Vendors: $${totalSpend.toFixed(1)}M annualized spend across ${APEX_RETAIL_VENDOR_SPEND.length} active vendors; ${risk.length} at risk and ${watch.length} on watch.`,
    categoryFact('software-saas', 'Software / SaaS'),
    categoryFact('hardware-cloud', 'Hardware / cloud'),
    categoryFact('services-si', 'Services / SI'),
    `At-risk vendors: ${risk.map((row) => `${row.vendor} (${row.spendLabel}; ${row.takeaway})`).join('; ')}.`,
    `Watch vendors: ${watch.map((row) => `${row.vendor} (${row.spendLabel}; renews in ${row.renewsInMonths ?? 'n/a'}mo; ${row.takeaway})`).join('; ')}.`,
    `Data and analytics landscape: ${analytics.map((row) => `${row.vendor} ${row.spendLabel} - ${row.subcategory}; ${row.takeaway}`).join('; ')}.`,
    'CXO read: Adobe Experience Platform, Salesforce Commerce + Marketing Cloud, and Accenture Retail are all implicated in the integration-hub decision; Snowflake and Databricks are useful AI/data foundations but need governance, FinOps, and readiness sequencing before scale.',
  ];
}

function apexUseCaseFacts(args: BuildSentinelIntelContextArgs): string[] {
  const fromBrief = args.briefData
    ? [
        ...args.briefData.bets.map((bet) =>
          `${bet.initiativeDisplayId ?? bet.useCase.id}: ${bet.useCase.name}; ${bet.engagementState}; decision ${bet.decision?.label ?? 'review'}; ${bet.useCase.problemStatement}`,
        ),
        ...(args.briefData.belowTheLine ?? []).map((bet) =>
          `${bet.initiativeDisplayId ?? bet.useCaseId}: ${bet.useCaseName}; ${bet.state}; ${bet.valueLabel}; ${bet.ttvLabel}; ${bet.hint}`,
        ),
      ]
    : [];
  const fromPatterns = args.patterns.flatMap((pattern) =>
    (pattern.useCaseNames ?? []).slice(0, 3).map((name) =>
      `${name}: bound to ${pattern.id} ${pattern.name}; failure rate ${pattern.failureRatePct ?? pattern.withoutPct}%.`,
    ),
  );
  return uniqueFacts([...fromBrief, ...fromPatterns]).slice(0, 18);
}

function apexGraphFacts(args: BuildSentinelIntelContextArgs): string[] {
  const patternEdges = args.patterns.slice(0, 14).flatMap((pattern) => [
    ...(pattern.useCaseNames ?? []).slice(0, 3).map((name) => `Relationship: ${name} binds to ${pattern.id} ${pattern.name}.`),
    ...(pattern.sourceTitles ?? []).slice(0, 2).map((title) => `Evidence: ${pattern.id} is supported by ${title}.`),
    ...(pattern.contradictionTitles ?? []).slice(0, 2).map((title) => `Tension: ${title} pressure-tests ${pattern.id}.`),
  ]);
  return uniqueFacts([
    'Portfolio relationship: CMO loyalty outcome ownership contradicts CTO CDP/platform control; impacts Salesforce, Adobe Experience Platform, identity, consent, and loyalty AI.',
    'Portfolio relationship: Adobe Experience Platform, Salesforce Commerce + Marketing Cloud, and Accenture Retail all claim integration-hub adjacency to the same customer data layer.',
    'Portfolio relationship: AI timeline depends on data readiness; item-location, identity stitching, consent, promo history, and substitution history are gating inputs.',
    'Portfolio relationship: sustainability KPIs conflict with omnichannel fulfillment speed and split-shipment promises.',
    ...patternEdges,
  ]).slice(0, 24);
}

function apexRiskFacts(args: BuildSentinelIntelContextArgs): string[] {
  return uniqueFacts([
    ...args.todayItems.map((item) => `${item.toneLabel}: ${item.title}. ${item.body}`),
    'Risk: CFO cost-takeout expectations conflict with CIO platform-first sequencing unless cost proof is attached to each AI move.',
    'Risk: loyalty AI, personalization, and clienteling cannot scale safely until customer identity, consent, and CDP ownership are settled.',
    'Risk: shrink analytics needs a store intervention protocol; detection without action does not create outcome change.',
  ]).slice(0, 16);
}

function apexStrategyFacts(args: BuildSentinelIntelContextArgs): string[] {
  return uniqueFacts([
    ...APEX_RETAIL_STRATEGY_BULLETS.map((bullet) => `${bullet.number}. ${bullet.title}: ${bullet.body} Evidence: ${bullet.evidence}`),
    ...(args.briefData?.bets ?? []).slice(0, 3).map((bet) =>
      `Strategic bet ${bet.rank}: ${bet.useCase.name}; Sentinel decision ${bet.decision?.label ?? 'review'} because ${bet.decision?.reason ?? 'evidence needs review'}.`,
    ),
  ]);
}

function apexSourceFacts(args: BuildSentinelIntelContextArgs): string[] {
  const sourceTitles = args.patterns.flatMap((pattern) => pattern.sourceTitles ?? []);
  return uniqueFacts([
    ...sourceTitles.map((title) => `Summarized knowledge source: ${title}.`),
    'Retail knowledge coverage includes NRF retail tech adoption, retail AI analyst coverage, McKinsey/Deloitte/BCG retail AI and GenAI findings, FTC dark-pattern enforcement, PCI DSS v4.0, CCPA retail consumer data, CDP for retail, retail AI investment benchmarks, demand sensing, workforce AI, supply-chain AI, loyalty economics, and retail ESG plus AI governance.',
  ]).slice(0, 18);
}

function apexQualityFacts(args: BuildSentinelIntelContextArgs): string[] {
  const summaryCount = args.status?.summarizedSources ?? 0;
  const sourceCount = args.status?.sources ?? 0;
  return [
    'Quality gate: if a query names Apex Retail, do not answer from Meridian, Epic, healthcare, IDN, clinical, or CMIO fixtures.',
    'Quality gate: current-state answers must start from the visible surface, tenant facts, and portfolio relationships before generic knowledge.',
    'Answering style: for simple executive questions, answer directly in plain strategic language first; use numbers only when they change the decision.',
    'Answering style: never expose implementation plumbing such as database names, runtimes, seed labels, graph internals, or markdown syntax to the user.',
    sourceCount > 0
      ? `Quality gate: ${summaryCount}/${sourceCount} retail sources have summaries available to the synthesizer.`
      : 'Quality gate: no retail source count is available in the current payload.',
  ];
}

function categoryFact(category: string, label: string): string {
  const rows = APEX_RETAIL_VENDOR_SPEND.filter((row) => row.category === category);
  const spend = rows.reduce((sum, row) => sum + row.spendUsdM, 0);
  return `${label}: $${spend.toFixed(1)}M across ${rows.length} vendors; top vendors ${rows.slice(0, 4).map((row) => `${row.vendor} ${row.spendLabel}`).join(', ')}.`;
}

function refsForByFunction(section: 'front-office' | 'middle-office' | 'back-office'): string[] {
  const rows = APEX_RETAIL_BY_FN_ROWS.filter((row) => {
    const key = row.function.toLowerCase();
    if (section === 'front-office') return /loyalty|personalization|commerce|clienteling|customer/.test(key);
    if (section === 'middle-office') return /demand|inventory|supply|shrink|replenishment/.test(key);
    return /finance|workforce|loss|platform|it/.test(key);
  });
  return rows.flatMap((row) => row.cells.map((cell) => cell.ref).filter((ref): ref is string => Boolean(ref)));
}

function uniqueFacts(facts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const fact of facts) {
    const cleaned = fact.replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}
