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

async function loadPortfolio(clientId: string): Promise<{ matrix: PortfolioRow[]; apps: AppRow[] }> {
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
      [clientId],
    ),
    safeRows<AppRow>(
      `
        SELECT app_id, name, time_classification::text, annual_run_cost_usd::text,
               fte_count::text, ai_fit_score::text
        FROM public.application_portfolio
        WHERE client_id = $1 AND deleted_at IS NULL
        ORDER BY annual_run_cost_usd DESC, fte_count DESC
        LIMIT 12
      `,
      [clientId],
    ),
  ]);
  return { matrix, apps };
}

async function loadOrg(clientId: string): Promise<{ teams: OrgRow[]; roles: RoleRow[] }> {
  const [teams, roles] = await Promise.all([
    safeRows<OrgRow>(
      `
        SELECT team_id, name, type::text, size_fte::text, geo, maturity_stage::text
        FROM public.org_topology
        WHERE client_id = $1 AND deleted_at IS NULL
        ORDER BY size_fte DESC
        LIMIT 12
      `,
      [clientId],
    ),
    safeRows<RoleRow>(
      `
        SELECT title, fte_count::text, source::text, geo, function_area
        FROM public.roles_inventory
        WHERE client_id = $1 AND deleted_at IS NULL
        ORDER BY fte_count DESC
        LIMIT 14
      `,
      [clientId],
    ),
  ]);
  return { teams, roles };
}

async function loadTools(clientId: string): Promise<ToolRow[]> {
  return safeRows<ToolRow>(
    `
      SELECT tool_name, vendor, licensed_seats, activated_seats, dau, mau,
             annual_cost_usd::text, indemnity_status, retention_policy
      FROM public.ai_tool_footprint
      WHERE client_id = $1 AND deleted_at IS NULL
      ORDER BY annual_cost_usd DESC
      LIMIT 10
    `,
    [clientId],
  );
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
  const [corePatterns, governancePatterns, tomPatterns, templatesRaw, portfolio, org, tools] = await Promise.all([
    corpus(`${input.query} P-IT-18 P-IT-19 TIME AI fit DORA`, input, 6),
    corpus('ai governance model allowlist retention indemnity tooling', input, 5),
    corpus('target operating model AI platform knowledge engineer fluency coach DevEx', input, 5),
    loadTemplates(),
    loadPortfolio(input.clientId),
    loadOrg(input.clientId),
    loadTools(input.clientId),
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
      'Scope should start with Apex application portfolio, developer workflow, AI tooling, and operating-model accountability over a 90-day pilot horizon.',
    ].join(' '),
    citations: [
      ...coreCitations,
      dataCitation('query', 'Incoming Sentinel question', input.query),
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
      `Top candidate apps: ${portfolio.apps.slice(0, 4).map((app) => `${app.name} (${app.time_classification}, AI fit ${pct(num(app.ai_fit_score))})`).join('; ') || 'pending runtime data'}.`,
      `Confidence interval from P-IT-18/19 pattern family: start with 8-14% productivity lift on high-fit invest/migrate slices and 3-7% run-cost release on tolerate/eliminate slices; current visible run-cost basis is ${money(totalRunCost)}.`,
    ].join(' '),
    citations: [
      ...coreCitations,
      dataCitation('application_portfolio', 'application_portfolio', `${portfolio.matrix.length} TIME buckets; ${portfolio.apps.length} sampled apps`),
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
  const finalStage = stageBase({
    id: 'sibling_move_portfolio',
    sequence: 6,
    input,
    traceId,
    corpusVersionPinned,
    templateVersionPinned,
    content: [
      `Shape the portfolio as five moves: ${proposals.map((proposal) => `${proposal.title} via ${proposal.templateSlug}`).join('; ')}.`,
      `Dependency arrows: ${proposals.flatMap((proposal) => proposal.dependencyIds.map((dep) => `${dep} -> ${proposal.id}`)).join('; ') || 'first move has no upstream dependency'}.`,
      `Projected value rollup: ${money(proposals.reduce((sum, proposal) => sum + proposal.projectedValueUsd, 0))}.`,
    ].join(' '),
    citations: [
      ...coreCitations,
      ...templateCitations,
      dataCitation('move_templates', 'move_templates', `${templates.length} published templates consulted`),
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
