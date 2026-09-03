import type { AskSource, AskSurfaceContext } from '../types';

const QUERY_STAGE_HINTS: Record<string, readonly string[]> = {
  brief: ['brief', 'bet', 'above', 'below', 'line', 'priority', 'quarter', 'decision'],
  map: ['map', 'landscape', 'kanban', 'heatmap', 'node', 'use case', 'portfolio'],
  'enterprise-context': ['enterprise', 'context', 'org', 'cmdb', 'incident', 'problem', 'contract', 'renewal', 'spend', 'policy', 'stewardship'],
  vendors: ['vendor', 'spend', 'renewal', 'risk', 'platform', 'data', 'analytics', 'stack', 'technology'],
  patterns: ['pattern', 'failure', 'genome', 'control', 'success'],
  today: ['today', 'urgent', 'current', 'priority', 'attention', 'risk'],
  'by-function': ['function', 'office', 'front', 'middle', 'back', 'capability'],
  'peer-activity': ['peer', 'cohort', 'market', 'adoption', 'benchmark'],
  'my-strategy': ['strategy', 'sequence', 'roadmap', 'next', 'decision'],
  sessions: ['session', 'conversation', 'thread', 'history'],
  'art-of-possible': ['possible', 'opportunity', 'value', 'portfolio', 'band'],
};

export function retrieveSurfaceContextSources(
  context: AskSurfaceContext | null | undefined,
  query: string,
): AskSource[] {
  if (!context || typeof context !== 'object') return [];

  const pageFacts = sanitizeFacts(context.pageFacts);
  const stageFacts = sanitizeFacts(context.stageFacts);
  const allFacts = sanitizeFacts(context.facts);
  const surfaceFacts = uniqueFacts([
    ...stageFacts,
    ...pageFacts,
    ...(stageFacts.length === 0 && pageFacts.length === 0 ? allFacts : []),
  ]);
  const tenantDomains = buildTenantDomains(context);
  const tenantFacts = tenantDomains.flatMap((domain) => domain.items);
  const graphFacts = uniqueFacts(sanitizeFacts(context.graphFacts));
  const sourceClaimContractFacts = buildSourceClaimContractFacts(context);
  if (
    surfaceFacts.length === 0 &&
    tenantFacts.length === 0 &&
    graphFacts.length === 0 &&
    sourceClaimContractFacts.length === 0
  )
    return [];

  const activeTab = cleanString(context.activeTab) ?? 'current page';
  const activeClient = cleanString(context.activeClient) ?? 'active client';
  const activeModule = cleanString(context.module) ?? 'Intelligence';
  const sources: AskSource[] = [];

  if (surfaceFacts.length > 0) {
    const detail = [
      `Active ${activeModule} surface: ${activeTab}.`,
      `Active client: ${activeClient}.`,
      ...surfaceFacts.slice(0, 28),
    ].join('\n- ');

    sources.push({
      type: 'SURFACE',
      name: `${activeClient} live ${activeModule} surface`,
      id: activeTab,
      detail,
      confidence: stageMatchesQuery(activeTab, query) ? 0.99 : 0.92,
    });
  }

  if (tenantFacts.length > 0) {
    const detail = [
      `Tenant 360: ${activeClient}.`,
      `Current ${activeModule} surface: ${activeTab}.`,
      ...tenantDomains.flatMap((domain) =>
        domain.items.length > 0 ? [`${domain.label}:`, ...domain.items] : [],
      ),
    ].join('\n- ');

    sources.push({
      type: 'TENANT',
      name: `${activeClient} 360 ${activeModule} substrate`,
      id: cleanString(context.clientKey) ?? activeClient,
      detail,
      confidence: tenantMatchesQuery(query) ? 0.96 : 0.91,
    });
  }

  if (sourceClaimContractFacts.length > 0) {
    const detail = [
      `Active Source aVa contract: ${activeTab}.`,
      `Active client: ${activeClient}.`,
      ...sourceClaimContractFacts,
    ].join('\n- ');

    sources.push({
      type: 'SURFACE',
      name: `${activeClient} Source aVa claim contract`,
      id: 'source-ava-claim-contract',
      detail,
      confidence: 0.99,
    });
  }

  if (graphFacts.length > 0) {
    const detail = [
      `Graph view: ${activeClient}.`,
      `Current ${activeModule} surface: ${activeTab}.`,
      ...graphFacts.slice(0, 34),
    ].join('\n- ');

    sources.push({
      type: 'GRAPH',
      name: `${activeClient} ${activeModule} graph`,
      id: cleanString(context.clientKey) ?? activeClient,
      detail,
      confidence: graphMatchesQuery(query) ? 0.95 : 0.89,
    });
  }

  return sources;
}

function buildSourceClaimContractFacts(context: AskSurfaceContext): string[] {
  const moduleName = cleanString(context.module)?.toLowerCase();
  const claimContract = asRecord(context.claimContract);
  const capabilities = asRecord(context.capabilities);
  const groundingStatus = asRecord(context.groundingStatus);
  const refusalExamples = Array.isArray(context.refusalExamples)
    ? context.refusalExamples
    : [];

  if (
    moduleName !== 'source' &&
    !claimContract &&
    !capabilities &&
    !groundingStatus &&
    refusalExamples.length === 0
  )
    return [];

  const facts: string[] = [];
  const posture = cleanString(claimContract?.posture);
  if (posture) facts.push(`Answer posture: ${posture}`);

  const coverage = summarizeGroundingStatus(groundingStatus);
  if (coverage) facts.push(`Row coverage: ${coverage}.`);

  appendNamedList(facts, 'Allowed Source claims', claimContract?.allowedClaims, 8);
  appendNamedList(facts, 'Forbidden Source claims', claimContract?.forbiddenClaims, 8);
  appendNamedList(
    facts,
    'Evidence required before Source claims',
    claimContract?.requiredEvidenceForClaims,
    8,
  );
  appendNamedList(facts, 'Required refusals', claimContract?.refusalTriggers, 8);
  appendNamedList(facts, 'Response shape', claimContract?.responseShape, 5);

  const source360 = asRecord(capabilities?.source360);
  appendNamedList(facts, 'Source 360 can answer', source360?.canAnswer, 6);
  appendNamedList(
    facts,
    'Source 360 cannot answer without more evidence',
    source360?.cannotAnswerWithoutMoreEvidence,
    6,
  );

  const optimize = asRecord(capabilities?.optimize);
  const optimizeRule = cleanString(optimize?.rule);
  if (optimizeRule) {
    const candidateRows = cleanNumber(optimize?.candidateRows);
    const claimCards = cleanNumber(optimize?.claimCards);
    const financeConfirmedRows = cleanNumber(optimize?.financeConfirmedRows);
    facts.push(
      [
        `Optimize boundary: ${optimizeRule}`,
        candidateRows == null ? null : `${candidateRows} candidate rows`,
        claimCards == null ? null : `${claimCards} claim cards`,
        financeConfirmedRows == null
          ? null
          : `${financeConfirmedRows} finance-confirmed rows`,
      ]
        .filter(Boolean)
        .join('; '),
    );
  }

  const newEvent = asRecord(capabilities?.newEvent);
  const newEventRule = cleanString(newEvent?.rule);
  if (newEventRule) facts.push(`New Event boundary: ${newEventRule}`);

  const refusals = refusalExamples
    .map((item) => {
      const row = asRecord(item);
      const userIntent = cleanString(row?.userIntent);
      const answerDiscipline = cleanString(row?.answerDiscipline);
      return userIntent && answerDiscipline
        ? `${userIntent}: ${answerDiscipline}`
        : null;
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 6);
  if (refusals.length > 0) {
    facts.push(`Source refusal examples: ${refusals.join(' | ')}`);
  }

  return facts.slice(0, 34);
}

function summarizeGroundingStatus(
  groundingStatus: Record<string, unknown> | null,
): string | null {
  if (!groundingStatus) return null;
  const fields: Array<[string, string]> = [
    ['contractRows', 'contract rows'],
    ['vendorRows', 'vendor rows'],
    ['scopeRows', 'scope rows'],
    ['invoiceLines', 'invoice lines'],
    ['performanceRows', 'performance rows'],
    ['usageRows', 'usage rows'],
    ['cloudRows', 'cloud rows'],
    ['actionCandidates', 'action candidates'],
    ['claimCards', 'claim cards'],
    ['avaGroundingBundles', 'aVa grounding bundles'],
  ];
  const parts = fields
    .map(([key, label]) => {
      const count = cleanNumber(groundingStatus[key]);
      return count == null ? null : `${count} ${label}`;
    })
    .filter((item): item is string => Boolean(item));
  const availableLenses = sanitizeFacts(groundingStatus.availableLenses).slice(0, 10);
  if (availableLenses.length > 0) {
    parts.push(`available lenses ${availableLenses.join(', ')}`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

function appendNamedList(
  facts: string[],
  label: string,
  value: unknown,
  cap: number,
): void {
  const items = sanitizeFacts(value).slice(0, cap);
  if (items.length === 0) return;
  facts.push(`${label}: ${items.join(' | ')}`);
}

/**
 * The tenant substrate is assembled from several typed buckets. It used to be
 * flattened into one list and cut at 34 items, so whichever bucket came last
 * in the merge order was silently starved -- a richer page payload could not
 * reach the model at all. Each domain now carries its own budget and its own
 * label, so every domain is represented and the model can tell an AI-footprint
 * fact from a vendor fact.
 */
const TENANT_DOMAINS: ReadonlyArray<{
  key: keyof AskSurfaceContext;
  label: string;
  cap: number;
}> = [
  { key: 'tenantFacts', label: 'Enterprise and operating context', cap: 14 },
  { key: 'strategyFacts', label: 'Strategy and priorities', cap: 8 },
  { key: 'vendorFacts', label: 'Vendors, contracts and spend', cap: 8 },
  { key: 'useCaseFacts', label: 'AI and automation footprint', cap: 8 },
  { key: 'riskFacts', label: 'Risk, controls and reliability', cap: 8 },
  { key: 'qualityFacts', label: 'Evidence quality and maturity', cap: 6 },
  { key: 'sourceFacts', label: 'Evidence sources', cap: 6 },
];

function buildTenantDomains(
  context: AskSurfaceContext,
): Array<{ label: string; items: string[] }> {
  // Dedupe across domains, not only within one, so a fact carried in two
  // buckets appears once, under the domain that claims it first.
  const seen = new Set<string>();
  return TENANT_DOMAINS.map((domain) => {
    const items: string[] = [];
    for (const fact of sanitizeFacts(context[domain.key])) {
      if (items.length >= domain.cap) break;
      const key = fact.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(fact);
    }
    return { label: domain.label, items };
  });
}

function tenantMatchesQuery(query: string): boolean {
  return /\b(current|state|tenant|apex|meridian|retail|priority|risk|strategy|vendor|use case|source|evidence|today|data|analytics|landscape|org|decision|cmdb|incident|problem|change|policy|contract|renewal|spend|stewardship)\b/i.test(query);
}

function graphMatchesQuery(query: string): boolean {
  return /\b(graph|edge|relationship|depend|block|support|contradict|contradiction|ownership|integration|hub|sequence|ready|readiness)\b/i.test(query);
}

function stageMatchesQuery(activeTab: string, query: string): boolean {
  const terms = QUERY_STAGE_HINTS[activeTab] ?? [];
  const normalized = query.toLowerCase();
  return terms.length === 0 || terms.some((term) => normalized.includes(term));
}

function sanitizeFacts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter((item) => item.length > 0)
    .slice(0, 60);
}

function uniqueFacts(facts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const fact of facts) {
    const key = fact.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fact);
  }
  return out;
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function cleanNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
