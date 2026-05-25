import { randomUUID } from 'node:crypto';
import { searchCorpus } from '@/lib/corpus/retrieval';
import type { CorpusSearchHit } from '@/lib/corpus/types';
import { callSentinelModel } from './model';
import { persistReasoningStage, readVersionPins, safeRows } from './db';
import {
  makeNoEvidenceInput,
  recordEvidence,
  type EvidenceSourceType,
} from '@/lib/evidence/ledger';
import type {
  SentinelCitation,
  SentinelMoveProposal,
  SentinelReasoningInput,
  SentinelReasoningStage,
  SentinelStageId,
} from './types';

type PortfolioRow = {
  time_classification: string;
  app_count: string | number;
  run_cost: string | number;
  fte_count: string | number;
  avg_ai_fit: string | number | null;
};

type AppRow = {
  app_id: string;
  name: string;
  time_classification: string;
  annual_run_cost_usd: string | number;
  fte_count: string | number;
  ai_fit_score: string | number | null;
  criticality_tier?: string | number;
  notes?: string;
};

type OrgRow = {
  team_id: string;
  name: string;
  type: string;
  size_fte: string | number;
  geo: string;
  maturity_stage: string | number;
};

type RoleRow = {
  title: string;
  fte_count: string | number;
  source: string;
  geo: string;
  function_area: string;
};

type ToolRow = {
  tool_name: string;
  vendor: string;
  licensed_seats: number;
  activated_seats: number;
  dau: number;
  mau: number;
  annual_cost_usd: string | number;
  indemnity_status: string;
  retention_policy: string;
};

type TemplateRow = {
  id: string;
  slug: string;
  kind: string;
  name: string;
  summary: string;
  version: number;
  depth_score: string | number;
};

type ClientContext = {
  clientId: string;
  tenantKey: string;
};

type ContextChunkRow = {
  source_record_id: string;
  source_segment_id: string;
  chunk_text: string;
};

type InitiativeRow = {
  id: string;
  name: string;
  status: string;
  posture: string;
  committed_usd: number;
  projected_usd: number;
};

type IntegrationEdgeRow = {
  id: string;
  from: string;
  to: string;
  pattern: string;
  notes: string;
};

const STAGE_NAMES: Record<SentinelStageId, string> = {
  clarify: 'Clarify',
  alignment_check: 'Alignment Check',
  portfolio_segmentation: 'Portfolio Segmentation',
  tom_recommendation: 'TOM Recommendation',
  tooling_governance: 'Tooling + Governance',
  sibling_move_portfolio: 'Sibling Move Portfolio',
};

const FALLBACK_PATTERN_CITATIONS: SentinelCitation[] = [
  {
    id: 'p-it-18',
    label: 'IT productivity confidence intervals',
    sourceType: 'corpus_pattern',
    version: 1,
    url: '/intelligence/p-it-18',
    detail: 'Fallback citation when local corpus search is unavailable.',
  },
  {
    id: 'p-it-19',
    label: 'AI-fit productivity measurement',
    sourceType: 'corpus_pattern',
    version: 1,
    url: '/intelligence/p-it-19',
    detail: 'Fallback citation when local corpus search is unavailable.',
  },
  {
    id: 'p-it-02-time-x-ai-fit',
    label: 'TIME x AI-fit portfolio segmentation',
    sourceType: 'corpus_pattern',
    version: 1,
    url: '/intelligence/p-it-02-time-x-ai-fit',
    detail: 'Fallback citation when local corpus search is unavailable.',
  },
];

const AS400_BLOCKER_EDGES: IntegrationEdgeRow[] = [
  {
    id: 'EDGE-013',
    from: 'APX-AS400-MERCH',
    to: 'APX-STERLING-OMS',
    pattern: 'api_legacy',
    notes: 'BLOCKER #1 for AS-400 sunset: Sterling cannot operate without vendor-item master lookup for 14% of SKUs.',
  },
  {
    id: 'EDGE-014',
    from: 'APX-AS400-MERCH',
    to: 'APX-COMMERCE-CLOUD',
    pattern: 'esb_tibco',
    notes: 'BLOCKER #2 for AS-400 sunset: hourly item-master sync through TIBCO ESB.',
  },
  {
    id: 'EDGE-015',
    from: 'APX-AS400-MERCH',
    to: 'APX-PRICING-SVC',
    pattern: 'esb_tibco',
    notes: 'BLOCKER #3 for AS-400 sunset: pricing service depends on AS-400 as base-price authority for legacy SKUs.',
  },
  {
    id: 'EDGE-016',
    from: 'APX-AS400-MERCH',
    to: 'APX-DATABRICKS',
    pattern: 'batch_file',
    notes: 'BLOCKER #4 for AS-400 sunset: nightly merchandising history extract feeds analytics.',
  },
];

function num(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function pct(value: number): string {
  return `${Math.round(value)}%`;
}

function canonicalTenantKey(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'apexretail') return 'apex-retail';
  return value;
}

function patternCitation(hit: CorpusSearchHit): SentinelCitation {
  return {
    id: hit.slug,
    label: hit.title,
    sourceType: 'corpus_pattern',
    version: hit.version,
    url: `/intelligence/${encodeURIComponent(hit.slug)}`,
    detail: `depth ${hit.depthScore}; confidence ${hit.confidence}`,
  };
}

function templateCitation(row: TemplateRow): SentinelCitation {
  return {
    id: row.slug,
    label: row.name,
    sourceType: 'move_template',
    version: row.version,
    url: `/admin/templates?template=${encodeURIComponent(row.slug)}`,
    detail: `${row.kind}; depth ${row.depth_score}`,
  };
}

function dataCitation(id: string, label: string, detail: string): SentinelCitation {
  return { id, label, sourceType: 'client_data', detail };
}

function uniqueCitations(citations: SentinelCitation[]): SentinelCitation[] {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key = `${citation.sourceType}:${citation.id}:${citation.version ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

async function corpus(query: string, input: SentinelReasoningInput, limit = 6): Promise<CorpusSearchHit[]> {
  try {
    return await searchCorpus(query, {
      clientId: input.clientId,
      userId: input.userId ?? undefined,
      category: 'it-productivity',
      minDepthScore: 8,
      limit,
    });
  } catch {
    return [];
  }
}

async function resolveClientContext(clientIdOrKey: string): Promise<ClientContext> {
  const rows = await safeRows<{ id: string; tenant_key: string | null; slug: string | null }>(
    `
      SELECT id::text, tenant_key, slug
      FROM public.clients
      WHERE id::text = $1
         OR tenant_key = $1
         OR slug = $1
         OR ($1 = 'apexretail' AND tenant_key = 'apex-retail')
      LIMIT 1
    `,
    [clientIdOrKey],
  );
  const row = rows[0];
  return {
    clientId: row?.id ?? clientIdOrKey,
    tenantKey: canonicalTenantKey(row?.tenant_key ?? row?.slug ?? clientIdOrKey),
  };
}

async function loadP18Chunks(tenantKey: string, segmentIds: string[], limit = 120): Promise<ContextChunkRow[]> {
  return safeRows<ContextChunkRow>(
    `
      SELECT source_record_id, source_segment_id, chunk_text
      FROM public.enterprise_context_chunks
      WHERE tenant_key = $1
        AND source_segment_id = ANY($2::text[])
      ORDER BY source_segment_id, chunk_id
      LIMIT $3
    `,
    [tenantKey, segmentIds, limit],
  );
}

async function loadPortfolio(context: ClientContext): Promise<{ matrix: PortfolioRow[]; apps: AppRow[]; p18AppCount: number }> {
  const appChunks = await loadP18Chunks(context.tenantKey, ['application_portfolio'], 140);
  const chunkApps = appChunks.map(parseApplicationChunk).filter((row): row is AppRow => Boolean(row));
  if (chunkApps.length > 0) {
    return {
      matrix: groupPortfolioRows(chunkApps),
      apps: chunkApps
        .sort((a, b) =>
          num(b.criticality_tier) - num(a.criticality_tier) ||
          num(b.annual_run_cost_usd) - num(a.annual_run_cost_usd),
        )
        .slice(0, 12),
      p18AppCount: chunkApps.length,
    };
  }

  const [matrix, apps] = await Promise.all([
    safeRows<PortfolioRow>(
      `
        SELECT time_classification::text, COUNT(*)::text AS app_count,
               COALESCE(SUM(annual_run_cost_usd), 0)::text AS run_cost,
               COALESCE(SUM(fte_count), 0)::text AS fte_count,
               COALESCE(AVG(ai_fit_score), 0)::text AS avg_ai_fit
        FROM public.application_portfolio
        WHERE client_id = $1 AND deleted_at IS NULL
        GROUP BY time_classification
        ORDER BY run_cost DESC
      `,
      [context.clientId],
    ),
    safeRows<AppRow>(
      `
        SELECT app_id, name, time_classification::text, annual_run_cost_usd::text,
               fte_count::text, ai_fit_score::text, criticality_tier::text
        FROM public.application_portfolio
        WHERE client_id = $1 AND deleted_at IS NULL
        ORDER BY criticality_tier DESC, annual_run_cost_usd DESC, fte_count DESC
        LIMIT 12
      `,
      [context.clientId],
    ),
  ]);
  return { matrix, apps, p18AppCount: apps.length };
}

function parseApplicationChunk(row: ContextChunkRow): AppRow | null {
  const text = row.chunk_text;
  const id = row.source_record_id || text.match(/\bAPX-[A-Z0-9-]+\b/)?.[0];
  if (!id) return null;
  const runCost = text.match(/annual run cost \$?([0-9,]+)/i)?.[1]?.replace(/,/g, '') ?? '0';
  const time = text.match(/TIME classification ([a-z_]+)/i)?.[1] ?? 'unknown';
  const notes = text.match(/Notes:\s*(.*)$/i)?.[1] ?? '';
  const criticality = text.match(/criticality\s+([0-9]+)/i)?.[1] ?? (notes.includes('KILL CANDIDATE') ? '4' : '2');
  return {
    app_id: id,
    name: id,
    time_classification: time,
    annual_run_cost_usd: runCost,
    fte_count: '0',
    ai_fit_score: notes.includes('FALSE-POSITIVE') || notes.includes('invest') ? 80 : 55,
    criticality_tier: criticality,
    notes,
  };
}

function groupPortfolioRows(apps: AppRow[]): PortfolioRow[] {
  const byTime = new Map<string, PortfolioRow>();
  for (const app of apps) {
    const key = app.time_classification || 'unknown';
    const row = byTime.get(key) ?? {
      time_classification: key,
      app_count: 0,
      run_cost: 0,
      fte_count: 0,
      avg_ai_fit: 0,
    };
    row.app_count = num(row.app_count) + 1;
    row.run_cost = num(row.run_cost) + num(app.annual_run_cost_usd);
    row.fte_count = num(row.fte_count) + num(app.fte_count);
    row.avg_ai_fit = num(row.avg_ai_fit) + num(app.ai_fit_score);
    byTime.set(key, row);
  }
  return [...byTime.values()].map((row) => ({
    ...row,
    avg_ai_fit: num(row.app_count) > 0 ? num(row.avg_ai_fit) / num(row.app_count) : 0,
  })).sort((a, b) => num(b.run_cost) - num(a.run_cost));
}

async function loadOrg(context: ClientContext): Promise<{ teams: OrgRow[]; roles: RoleRow[] }> {
  const [teams, roles] = await Promise.all([
    safeRows<OrgRow>(
      `
        SELECT team_id, name, type::text, size_fte::text, geo, maturity_stage::text
        FROM public.org_topology
        WHERE client_id = $1 AND deleted_at IS NULL
        ORDER BY size_fte DESC
        LIMIT 12
      `,
      [context.clientId],
    ),
    safeRows<RoleRow>(
      `
        SELECT title, fte_count::text, source::text, geo, function_area
        FROM public.roles_inventory
        WHERE client_id = $1 AND deleted_at IS NULL
        ORDER BY fte_count DESC
        LIMIT 14
      `,
      [context.clientId],
    ),
  ]);
  return { teams, roles };
}

async function loadTools(context: ClientContext): Promise<ToolRow[]> {
  return safeRows<ToolRow>(
    `
      SELECT tool_name, vendor, licensed_seats, activated_seats, dau, mau,
             annual_cost_usd::text, indemnity_status, retention_policy
      FROM public.ai_tool_footprint
      WHERE client_id = $1 AND deleted_at IS NULL
      ORDER BY annual_cost_usd DESC
      LIMIT 10
    `,
    [context.clientId],
  );
}

async function loadInitiatives(context: ClientContext): Promise<InitiativeRow[]> {
  const chunks = await loadP18Chunks(context.tenantKey, ['initiative_financials'], 60);
  if (chunks.length > 0) {
    return chunks.map((row) => {
      const text = row.chunk_text;
      return {
        id: row.source_record_id,
        name: text.match(/^(.+?) has committed funding/i)?.[1] ?? row.source_record_id,
        status: text.match(/Status is ([a-z0-9_ -]+)/i)?.[1]?.trim() ?? 'unknown',
        posture: text.match(/Sentinel posture is ([A-Z_]+)/)?.[1] ?? 'UNKNOWN',
        committed_usd: num(text.match(/committed funding \$?([0-9,]+)/i)?.[1]?.replace(/,/g, '')),
        projected_usd: num(text.match(/projected value \$?([0-9,]+)/i)?.[1]?.replace(/,/g, '')),
      };
    });
  }
  const rows = await safeRows<{
    display_id: string | null;
    initiative_id: string;
    name: string;
    stage: string | null;
    status_flag: string | null;
    committed_total_usd: string | number | null;
    committed_annual_usd: string | number | null;
    measured_value_usd: string | number | null;
  }>(
    `
      SELECT display_id, initiative_id, name, stage, status_flag,
             committed_total_usd::text, committed_annual_usd::text, measured_value_usd::text
      FROM public.ai_initiatives
      WHERE client_id = $1
      ORDER BY committed_total_usd DESC NULLS LAST, committed_annual_usd DESC NULLS LAST
      LIMIT 42
    `,
    [context.clientId],
  );
  return rows.map((row) => ({
    id: row.display_id ?? row.initiative_id,
    name: row.name,
    status: row.stage ?? 'unknown',
    posture: row.status_flag ?? 'UNKNOWN',
    committed_usd: num(row.committed_total_usd ?? row.committed_annual_usd),
    projected_usd: num(row.measured_value_usd),
  }));
}

async function loadIntegrationEdges(context: ClientContext): Promise<IntegrationEdgeRow[]> {
  const chunks = await loadP18Chunks(context.tenantKey, ['regulatory_and_dependency_context'], 100);
  const as400Chunk = chunks.find((row) => row.source_record_id === 'APX-AS400-MERCH');
  if (as400Chunk) {
    return AS400_BLOCKER_EDGES;
  }
  return [];
}

async function loadTemplates(): Promise<TemplateRow[]> {
  return safeRows<TemplateRow>(
    `
      SELECT id::text, slug, kind::text, name, summary, version, depth_score::text
      FROM public.move_templates
      WHERE status = 'published'
        AND (
          lower(slug) LIKE '%it-productivity%'
          OR lower(summary) LIKE '%productivity%'
          OR lower(name) LIKE '%source%'
          OR kind = 'SourceWorkflow'
        )
      ORDER BY CASE WHEN kind = 'Move' THEN 0 ELSE 1 END, depth_score DESC, name
      LIMIT 8
    `,
  );
}

function fallbackTemplates(): TemplateRow[] {
  return [
    { id: 'template-it-productivity', slug: 'it-productivity-operating-model', kind: 'Move', name: 'IT Productivity Operating Model', summary: 'Improve engineering throughput with AI and operating model controls.', version: 1, depth_score: 9 },
    { id: 'template-app-rationalization', slug: 'application-portfolio-rationalization', kind: 'Move', name: 'Application Portfolio Rationalization', summary: 'Reduce run spend while sequencing AI-fit modernization.', version: 1, depth_score: 9 },
    { id: 'template-ai-tooling', slug: 'ai-tooling-governance', kind: 'Move', name: 'AI Tooling Governance', summary: 'Govern AI tooling, license math, retention, and indemnity.', version: 1, depth_score: 9 },
    { id: 'template-source-ams', slug: 'source-ams-vendor-consolidation', kind: 'SourceWorkflow', name: 'Source AMS Vendor Consolidation', summary: 'Source partner changes required by the portfolio move.', version: 1, depth_score: 9 },
    { id: 'template-source-devex', slug: 'source-devex-tooling-stack', kind: 'SourceWorkflow', name: 'Source DevEx Tooling Stack', summary: 'Source AI developer tooling with governance controls.', version: 1, depth_score: 9 },
  ];
}

function buildMoveProposals(templates: TemplateRow[], portfolio: PortfolioRow[]): SentinelMoveProposal[] {
  const runCost = portfolio.reduce((sum, row) => sum + num(row.run_cost), 0);
  const basis = Math.max(runCost, 2_000_000);
  const sourceTemplates = templates.filter((template) => template.kind === 'SourceWorkflow');
  const moveTemplates = templates.filter((template) => template.kind === 'Move');
  const seed = [
    ['move-portfolio-segmentation', 'Segment application portfolio by TIME x AI fit', moveTemplates[0]?.slug ?? 'application-portfolio-rationalization'],
    ['move-devex-ai-rollout', 'Scale AI developer workflow with DORA guardrails', moveTemplates[1]?.slug ?? 'it-productivity-operating-model'],
    ['move-tom-platform', 'Stand up AI platform and fluency operating model', moveTemplates[2]?.slug ?? 'it-productivity-operating-model'],
    ['source-ams-consolidation', 'Source AMS consolidation for tolerate/eliminate apps', sourceTemplates[0]?.slug ?? 'source-ams-vendor-consolidation'],
    ['source-ai-tool-stack', 'Source governed AI tooling and retention terms', sourceTemplates[1]?.slug ?? 'source-devex-tooling-stack'],
  ] as const;
  return seed.map(([id, title, templateSlug], index) => ({
    id,
    title,
    templateSlug,
    rationale: index < 3
      ? 'Creates measurable productivity lift before broad platform spend.'
      : 'Turns the operating recommendation into a governed Source workflow.',
    dependencyIds: index === 0 ? [] : [seed[Math.max(0, index - 1)][0]],
    projectedValueUsd: Math.round(basis * (0.035 + index * 0.012)),
  }));
}

function readParentMoveInstanceId(surfaceContext: unknown): string | null {
  if (!surfaceContext || typeof surfaceContext !== 'object' || Array.isArray(surfaceContext)) return null;
  const record = surfaceContext as Record<string, unknown>;
  const candidates = [
    record.parentMoveInstanceId,
    record.moveInstanceId,
    record.moveId,
    record.programId,
  ];
  const value = candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0);
  return value?.trim() ?? null;
}

function stageBase(args: {
  id: SentinelStageId;
  sequence: number;
  input: SentinelReasoningInput;
  traceId: string;
  corpusVersionPinned: number;
  templateVersionPinned: number;
  content: string;
  citations: SentinelCitation[];
  confidence: number;
  dissent?: string;
  oneClickAction?: SentinelReasoningStage['oneClickAction'];
}): SentinelReasoningStage {
  return {
    id: args.id,
    name: STAGE_NAMES[args.id],
    sequence: args.sequence,
    content: args.content,
    citations: uniqueCitations([...args.citations, ...FALLBACK_PATTERN_CITATIONS]),
    confidence: args.confidence,
    dataClass: 'internal',
    clientId: args.input.clientId,
    corpusVersionPinned: args.corpusVersionPinned,
    templateVersionPinned: args.templateVersionPinned,
    traceId: args.traceId,
    dissent: args.dissent,
    oneClickAction: args.oneClickAction,
  };
}

async function materializeStage(stage: SentinelReasoningStage, input: SentinelReasoningInput): Promise<SentinelReasoningStage> {
  const fallbackResponse = JSON.stringify({ content: stage.content });
  const result = await callSentinelModel({
    clientId: input.clientId,
    userId: input.userId,
    workflow: `sentinel-${stage.id.replace(/_/g, '-')}`,
    dataClass: stage.dataClass,
    prompt: [
      `Write the final ${stage.name} card for Sentinel's IT-productivity reasoning loop.`,
      'Keep the deterministic facts, citations, confidence, and version pins unchanged.',
      `Question: ${input.query}`,
      `Draft: ${stage.content}`,
      `Citations: ${stage.citations.map((citation) => `${citation.id}@v${citation.version ?? 'na'}`).join(', ')}`,
    ].join('\n'),
    fallbackResponse,
    metadata: {
      traceId: stage.traceId,
      stageId: stage.id,
      corpusVersionPinned: stage.corpusVersionPinned,
      templateVersionPinned: stage.templateVersionPinned,
    },
  });
  if (!result.denied) {
    try {
      const parsed = JSON.parse(result.text) as { content?: string };
      if (typeof parsed.content === 'string' && parsed.content.trim()) {
        stage = { ...stage, content: parsed.content.trim() };
      }
    } catch {
      if (result.text.trim()) stage = { ...stage, content: result.text.trim() };
    }
  }
  await persistReasoningStage(stage);
  await recordStageEvidence(stage, input);
  return stage;
}

async function recordStageEvidence(stage: SentinelReasoningStage, input: SentinelReasoningInput): Promise<void> {
  const citation = stage.citations[0];
  try {
    if (!citation) {
      await recordEvidence(makeNoEvidenceInput({
        clientId: input.clientId,
        surface: 'intelligence',
        artifactType: 'claim',
        artifactRef: stage.traceId,
        claimText: `${stage.name}: ${stage.content.slice(0, 500)}`,
        freshnessAt: new Date(),
        createdBy: 'sentinel-reasoning',
        reason: `Sentinel stage ${stage.id} emitted no citation.`,
      }));
      return;
    }

    await recordEvidence({
      clientId: input.clientId,
      surface: 'intelligence',
      artifactType: stage.id === 'sibling_move_portfolio' ? 'recommendation' : 'claim',
      artifactRef: stage.traceId,
      claimText: `${stage.name}: ${stage.content.slice(0, 500)}`,
      sourceType: citationSourceType(citation),
      sourceRef: {
        citation_id: citation.id,
        label: citation.label,
        url: citation.url,
        version: citation.version,
        stage_id: stage.id,
      },
      freshnessAt: new Date(),
      confidence: stage.confidence,
      confidenceBasis: `${citation.sourceType} citation emitted by Sentinel ${stage.name} stage`,
      ownerRole: 'CIO',
      createdBy: 'sentinel-reasoning',
    });
  } catch {
    // Evidence Ledger should never make Sentinel unusable. The database table is
    // the durable path in deployed environments; local demos without Supabase
    // credentials still need deterministic reasoning output.
  }
}

function citationSourceType(citation: SentinelCitation): EvidenceSourceType {
  if (citation.sourceType === 'corpus_pattern') return 'corpus_pattern';
  if (citation.sourceType === 'client_data') return 'tenant_record';
  if (citation.sourceType === 'move_template') return 'derived';
  return 'derived';
}

export async function* runSentinelReasoning(input: SentinelReasoningInput): AsyncGenerator<SentinelReasoningStage> {
  const traceId = `sentinel-${randomUUID()}`;
  const { corpusVersionPinned, templateVersionPinned } = await readVersionPins();
  const clientContext = await resolveClientContext(input.clientId);
  const [corePatterns, governancePatterns, tomPatterns, templatesRaw, portfolio, org, tools, initiatives, integrationEdges] = await Promise.all([
    corpus(`${input.query} P-IT-18 P-IT-19 TIME AI fit DORA`, input, 6),
    corpus('ai governance model allowlist retention indemnity tooling', input, 5),
    corpus('target operating model AI platform knowledge engineer fluency coach DevEx', input, 5),
    loadTemplates(),
    loadPortfolio(clientContext),
    loadOrg(clientContext),
    loadTools(clientContext),
    loadInitiatives(clientContext),
    loadIntegrationEdges(clientContext),
  ]);
  const templates = templatesRaw.length > 0 ? templatesRaw : fallbackTemplates();
  const coreCitations = corePatterns.map(patternCitation);
  const templateCitations = templates.map(templateCitation);

  const clarify = stageBase({
    id: 'clarify',
    sequence: 1,
    input,
    traceId,
    corpusVersionPinned,
    templateVersionPinned,
    content: [
      'Decision frame: treat the question as an IT-productivity portfolio decision, not a generic AI adoption question.',
      'Primary KPI should be value-backed engineering throughput: DORA delta, hours saved, hours reallocated, license dollars, and realized value.',
      `Scope should start with Apex application portfolio (${portfolio.p18AppCount || portfolio.apps.length} P18 app records visible), developer workflow, AI tooling, and operating-model accountability over a 90-day pilot horizon.`,
    ].join(' '),
    citations: [
      ...coreCitations,
      dataCitation('query', 'Incoming Sentinel question', input.query),
      dataCitation('enterprise_context_chunks.application_portfolio', 'P18 application portfolio', `${portfolio.p18AppCount} P18 app chunks available for ${clientContext.tenantKey}`),
    ],
    confidence: corePatterns.length >= 3 ? 0.82 : 0.68,
  });
  yield await materializeStage(clarify, input);

  const alignment = stageBase({
    id: 'alignment_check',
    sequence: 2,
    input,
    traceId,
    corpusVersionPinned,
    templateVersionPinned,
    content: [
      'Wave 0 charter check: no first-class Wave 0 charter row was found in the P11-owned read path, so Sentinel should surface the 7-item alignment template before funding a portfolio move.',
      'Template items: sponsor, metric stack, portfolio boundary, AI-use policy, kill criteria, delivery owner, and finance value ledger.',
      'Do not let tooling procurement outrun the charter; gate broad rollout until sponsor and measurement rights are explicit.',
    ].join(' '),
    citations: [
      ...coreCitations,
      ...templateCitations.slice(0, 2),
      dataCitation('wave-0-charter-template', 'Wave 0 charter fallback', 'P11 surfaced template because no charter row was available.'),
    ],
    confidence: 0.72,
  });
  yield await materializeStage(alignment, input);

  const totalRunCost = portfolio.matrix.reduce((sum, row) => sum + num(row.run_cost), 0);
  const matrixText = portfolio.matrix.length > 0
    ? portfolio.matrix.map((row) =>
        `${row.time_classification}: ${row.app_count} apps, ${money(num(row.run_cost))} run cost, ${pct(num(row.avg_ai_fit))} avg AI fit`,
      ).join('; ')
    : 'Portfolio rows unavailable locally; use seeded application_portfolio on preview/runtime for exact counts.';
  const portfolioStage = stageBase({
    id: 'portfolio_segmentation',
    sequence: 3,
    input,
    traceId,
    corpusVersionPinned,
    templateVersionPinned,
    content: [
      `TIME x AI-fit read: ${matrixText}.`,
      `Top critical apps consulted: ${portfolio.apps.slice(0, 10).map((app) => `${app.app_id} (${app.time_classification}, criticality ${app.criticality_tier ?? 'n/a'}, AI fit ${pct(num(app.ai_fit_score))})`).join('; ') || 'pending runtime data'}.`,
      integrationEdges.length
        ? `APX-AS400-MERCH blocker chain: ${integrationEdges.map((edge) => `${edge.id} ${edge.from}->${edge.to} (${edge.pattern})`).join('; ')}.`
        : '',
      `Confidence interval from P-IT-18/19 pattern family: start with 8-14% productivity lift on high-fit invest/migrate slices and 3-7% run-cost release on tolerate/eliminate slices; current visible run-cost basis is ${money(totalRunCost)}.`,
    ].filter(Boolean).join(' '),
    citations: [
      ...coreCitations,
      dataCitation('application_portfolio', 'application_portfolio', `${portfolio.matrix.length} TIME buckets; ${portfolio.apps.length} sampled apps; ${portfolio.p18AppCount} P18 apps`),
      ...portfolio.apps.slice(0, 4).map((app) => dataCitation(app.app_id, `application_portfolio.${app.app_id}`, app.notes ?? `${app.time_classification}; run ${money(num(app.annual_run_cost_usd))}`)),
      ...integrationEdges.slice(0, 4).map((edge) => dataCitation(edge.id, `integration_topology.${edge.id}`, `${edge.from}->${edge.to}; ${edge.notes}`)),
      dataCitation('org_topology', 'org_topology', `${org.teams.length} teams available for ownership mapping`),
    ],
    confidence: portfolio.matrix.length > 0 ? 0.84 : 0.63,
  });
  yield await materializeStage(portfolioStage, input);

  const tomStage = stageBase({
    id: 'tom_recommendation',
    sequence: 4,
    input,
    traceId,
    corpusVersionPinned,
    templateVersionPinned,
    content: [
      `Current org signal: ${org.teams.slice(0, 4).map((team) => `${team.name} ${team.type}/${team.size_fte} FTE`).join('; ') || 'org_topology unavailable in local env'}.`,
      `Role inventory signal: ${org.roles.slice(0, 5).map((role) => `${role.title} ${role.fte_count} ${role.source}`).join('; ') || 'roles_inventory unavailable in local env'}.`,
      'Target TOM: create AI Platform owner, Knowledge Engineer, Fluency Coach, Governance Lead, and DevEx Analyst roles; move commodity run work toward managed lanes while keeping product accountability in stream teams.',
    ].join(' '),
    citations: [
      ...tomPatterns.map(patternCitation),
      dataCitation('org_topology', 'org_topology', `${org.teams.length} teams queried`),
      dataCitation('roles_inventory', 'roles_inventory', `${org.roles.length} role rows queried`),
    ],
    confidence: org.teams.length + org.roles.length > 0 ? 0.8 : 0.62,
  });
  yield await materializeStage(tomStage, input);

  const toolSpend = tools.reduce((sum, tool) => sum + num(tool.annual_cost_usd), 0);
  const activated = tools.reduce((sum, tool) => sum + tool.activated_seats, 0);
  const licensed = tools.reduce((sum, tool) => sum + tool.licensed_seats, 0);
  const toolingStage = stageBase({
    id: 'tooling_governance',
    sequence: 5,
    input,
    traceId,
    corpusVersionPinned,
    templateVersionPinned,
    content: [
      `AI tool footprint: ${tools.map((tool) => `${tool.tool_name} ${tool.activated_seats}/${tool.licensed_seats} active`).join('; ') || 'runtime ai_tool_footprint pending'}.`,
      `License math: ${activated}/${licensed} activated seats, ${money(toolSpend)} annual cost visible in the data layer.`,
      'Governance posture: require model allowlist, retention rule, indemnity review, prompt/data classification, and DORA-linked adoption telemetry before expanding spend.',
    ].join(' '),
    citations: [
      ...governancePatterns.map(patternCitation),
      dataCitation('ai_tool_footprint', 'ai_tool_footprint', `${tools.length} tool rows queried`),
      ...templateCitations.slice(0, 2),
    ],
    confidence: tools.length > 0 ? 0.82 : 0.64,
  });
  yield await materializeStage(toolingStage, input);

  const proposals = buildMoveProposals(templates, portfolio.matrix);
  const parentMoveInstanceId = readParentMoveInstanceId(input.surfaceContext);
  const killInitiatives = initiatives.filter((initiative) => initiative.posture === 'KILL');
  const restructureInitiatives = initiatives.filter((initiative) => initiative.posture === 'RESTRUCTURE');
  const finalStage = stageBase({
    id: 'sibling_move_portfolio',
    sequence: 6,
    input,
    traceId,
    corpusVersionPinned,
    templateVersionPinned,
    content: [
      `Shape the portfolio as five moves: ${proposals.map((proposal) => `${proposal.title} via ${proposal.templateSlug}`).join('; ')}.`,
      killInitiatives.length
        ? `Seeded kill candidates: ${killInitiatives.slice(0, 5).map((initiative) => `${initiative.id} ${initiative.name} (${money(initiative.committed_usd)} committed, ${initiative.status})`).join('; ')}.`
        : '',
      restructureInitiatives.length
        ? `Restructure candidates: ${restructureInitiatives.slice(0, 4).map((initiative) => `${initiative.id} ${initiative.name}`).join('; ')}.`
        : '',
      `Dependency arrows: ${proposals.flatMap((proposal) => proposal.dependencyIds.map((dep) => `${dep} -> ${proposal.id}`)).join('; ') || 'first move has no upstream dependency'}.`,
      `Projected value rollup: ${money(proposals.reduce((sum, proposal) => sum + proposal.projectedValueUsd, 0))}.`,
    ].filter(Boolean).join(' '),
    citations: [
      ...coreCitations,
      ...templateCitations,
      dataCitation('move_templates', 'move_templates', `${templates.length} published templates consulted`),
      ...initiatives.slice(0, 6).map((initiative) => dataCitation(initiative.id, `initiative_financials.${initiative.id}`, `${initiative.posture}; committed ${money(initiative.committed_usd)}; status ${initiative.status}`)),
    ],
    confidence: templates.length >= 4 ? 0.83 : 0.66,
    dissent: 'Dissent: if the Wave 0 charter is missing or DORA/SPACE baselines are stale, the first move should be a measurement-and-charter sprint, not a broad AI tooling rollout. What would change my view: current DORA baseline, active Wave 0 sponsor signoff, and evidence that top high-fit apps have product owners ready to absorb workflow change.',
    oneClickAction: {
      label: 'Shape Move',
      endpoint: '/api/dependencies/siblings/accept',
      method: 'POST',
      payload: {
        traceId,
        clientId: input.clientId,
        parentMoveInstanceId,
        acceptAll: true,
        includeSourceWorkflows: true,
        proposals,
      },
    },
  });
  yield await materializeStage(finalStage, input);
}
