import { withDependencyTransaction } from './db';
import type {
  DependencyRelationType,
  SiblingMoveProposal,
  SiblingMoveRecommendation,
  SourceWorkflowRecommendation,
} from './types';

export const IT_PRODUCTIVITY_TEMPLATE_SLUG = 'it-productivity-ai-enabled-program';

const SIBLING_RECOMMENDATIONS: Omit<SiblingMoveRecommendation, 'templateId'>[] = [
  {
    id: 'data-foundation-for-ai',
    templateSlug: 'data-foundation-for-ai',
    templateName: 'Data Foundation for AI',
    sponsor: 'CTO + CDO',
    relationType: 'blocks',
    dollarImpactUsd: 2_400_000,
    defaultDecision: 'accept',
    rationale: 'Productivity measurement, retrieval quality, and SDLC telemetry need governed data foundations before scale.',
  },
  {
    id: 'ai-governance-and-policy',
    templateSlug: 'ai-governance-and-policy',
    templateName: 'AI Governance & Policy',
    sponsor: 'CISO + GC + CTO',
    relationType: 'blocks',
    dollarImpactUsd: 1_200_000,
    defaultDecision: 'accept',
    rationale: 'Tooling, retention, IP, and model-use policy must clear before broad engineering rollout.',
  },
  {
    id: 'app-portfolio-rationalization-time',
    templateSlug: 'app-portfolio-rationalization-time',
    templateName: 'Application Portfolio Rationalization (TIME)',
    sponsor: 'CIO + CFO',
    relationType: 'informs',
    dollarImpactUsd: 3_100_000,
    defaultDecision: 'accept',
    rationale: 'TIME classification tells the productivity Move where AI tooling converts to real value instead of local activity.',
  },
  {
    id: 'talent-strategy-ai-fluent-engineering-org',
    templateSlug: 'talent-strategy-ai-fluent-engineering-org',
    templateName: 'Talent Strategy - AI-Fluent Engineering Org',
    sponsor: 'HPeople + CTO',
    relationType: 'triggers',
    dollarImpactUsd: 1_650_000,
    defaultDecision: 'accept',
    rationale: 'Career ladder, fluency coaching, and role design determine whether hours saved become durable capability.',
  },
  {
    id: 'mainframe-modernization-sequenced',
    templateSlug: 'mainframe-modernization-sequenced',
    templateName: 'Mainframe Modernization (sequenced)',
    sponsor: 'CIO + BU sponsor',
    relationType: 'informs',
    dollarImpactUsd: 2_000_000,
    defaultDecision: 'accept',
    rationale: 'Legacy/mainframe estates need a separate sequencing Move so AI productivity claims are not averaged across mismatched delivery systems.',
  },
];

const SOURCE_RECOMMENDATIONS: Omit<SourceWorkflowRecommendation, 'templateId'>[] = [
  {
    id: 'source-ams-portfolio-optimization',
    templateSlug: 'source-ams-portfolio-optimization',
    templateName: 'AMS Portfolio Optimization',
    sponsor: 'Procurement + GC + CFO + CIO',
    relationType: 'informs',
    dollarImpactUsd: 4_250_000,
    defaultDecision: 'accept',
    rationale: 'AMS vendor economics and AI-fluency clauses directly inform the IT-productivity value case, but stay in Source.',
  },
];

const INTERNAL_EDGES: SiblingMoveProposal['edges'] = [
  {
    id: 'data-foundation-blocks-it-productivity',
    fromTemplateSlug: 'data-foundation-for-ai',
    toTemplateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
    relationType: 'blocks',
    estimatedImpactUsd: 2_400_000,
    note: 'Data Foundation is an upstream scale prerequisite for IT productivity telemetry and retrieval quality.',
  },
  {
    id: 'ai-governance-blocks-it-productivity',
    fromTemplateSlug: 'ai-governance-and-policy',
    toTemplateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
    relationType: 'blocks',
    estimatedImpactUsd: 1_200_000,
    note: 'AI Governance must clear IP, security, retention, and model-use policy before scaled rollout.',
  },
  {
    id: 'portfolio-rationalization-informs-it-productivity',
    fromTemplateSlug: 'app-portfolio-rationalization-time',
    toTemplateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
    relationType: 'informs',
    estimatedImpactUsd: 3_100_000,
    note: 'TIME classification informs where productivity tooling creates value.',
  },
  {
    id: 'talent-strategy-triggers-it-productivity',
    fromTemplateSlug: 'talent-strategy-ai-fluent-engineering-org',
    toTemplateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
    relationType: 'triggers',
    estimatedImpactUsd: 1_650_000,
    note: 'Talent strategy work is triggered by Wave 0 and shapes adoption durability.',
  },
  {
    id: 'mainframe-informs-it-productivity',
    fromTemplateSlug: 'mainframe-modernization-sequenced',
    toTemplateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
    relationType: 'informs',
    estimatedImpactUsd: 2_000_000,
    note: 'Mainframe sequencing informs which productivity cohorts should be measured separately.',
  },
  {
    id: 'data-foundation-informs-ai-governance',
    fromTemplateSlug: 'data-foundation-for-ai',
    toTemplateSlug: 'ai-governance-and-policy',
    relationType: 'informs',
    estimatedImpactUsd: 900_000,
    note: 'Data classification and lineage shape policy scope.',
  },
  {
    id: 'portfolio-rationalization-triggers-mainframe',
    fromTemplateSlug: 'app-portfolio-rationalization-time',
    toTemplateSlug: 'mainframe-modernization-sequenced',
    relationType: 'triggers',
    estimatedImpactUsd: 1_400_000,
    note: 'TIME results identify the mainframe modernization queue.',
  },
  {
    id: 'talent-strategy-informs-ai-governance',
    fromTemplateSlug: 'talent-strategy-ai-fluent-engineering-org',
    toTemplateSlug: 'ai-governance-and-policy',
    relationType: 'informs',
    estimatedImpactUsd: 650_000,
    note: 'Role and ladder changes inform acceptable-use policy and training gates.',
  },
  {
    id: 'ams-source-informs-it-productivity',
    fromTemplateSlug: 'source-ams-portfolio-optimization',
    toTemplateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
    relationType: 'informs',
    estimatedImpactUsd: 4_250_000,
    note: 'AMS Optimization stays in Source and informs the IT-productivity business case.',
  },
];

type TemplateLookupRow = {
  id: string;
  slug: string;
  name: string;
};

function hydrateRecommendation<T extends { templateSlug: string }>(
  item: T,
  lookup: Map<string, TemplateLookupRow>,
): T & { templateId: string | null; templateName: string } {
  const row = lookup.get(item.templateSlug);
  const currentName = 'templateName' in item && typeof item.templateName === 'string' ? item.templateName : row?.name ?? item.templateSlug;
  return {
    ...item,
    templateId: row?.id ?? null,
    templateName: row?.name ?? currentName,
  };
}

export function buildStaticSiblingProposal(parentMoveTemplateId: string): SiblingMoveProposal {
  return {
    parentMoveTemplateId,
    parentTemplateSlug: IT_PRODUCTIVITY_TEMPLATE_SLUG,
    parentTemplateName: 'AI-Enabled IT Productivity Program',
    siblingMoves: SIBLING_RECOMMENDATIONS.map((item) => ({ ...item, templateId: null })),
    sourceWorkflows: SOURCE_RECOMMENDATIONS.map((item) => ({ ...item, templateId: null })),
    edges: INTERNAL_EDGES,
  };
}

export async function proposeSiblingMoves(parentMoveTemplateId: string): Promise<SiblingMoveProposal> {
  const slugs = [
    IT_PRODUCTIVITY_TEMPLATE_SLUG,
    ...SIBLING_RECOMMENDATIONS.map((item) => item.templateSlug),
    ...SOURCE_RECOMMENDATIONS.map((item) => item.templateSlug),
  ];

  return withDependencyTransaction(async (client) => {
    const { rows } = await client.query<TemplateLookupRow>(
      `
        SELECT id, slug, name
        FROM public.move_templates
        WHERE id::text = $1 OR slug = ANY($2::text[])
      `,
      [parentMoveTemplateId, slugs],
    );
    const lookup = new Map(rows.map((row) => [row.slug, row]));
    const parent = rows.find((row) => row.id === parentMoveTemplateId || row.slug === parentMoveTemplateId)
      ?? lookup.get(IT_PRODUCTIVITY_TEMPLATE_SLUG)
      ?? null;

    return {
      parentMoveTemplateId,
      parentTemplateSlug: parent?.slug ?? (parentMoveTemplateId === IT_PRODUCTIVITY_TEMPLATE_SLUG ? IT_PRODUCTIVITY_TEMPLATE_SLUG : null),
      parentTemplateName: parent?.name ?? (parentMoveTemplateId === IT_PRODUCTIVITY_TEMPLATE_SLUG ? 'AI-Enabled IT Productivity Program' : null),
      siblingMoves: SIBLING_RECOMMENDATIONS.map((item) => hydrateRecommendation(item, lookup)),
      sourceWorkflows: SOURCE_RECOMMENDATIONS.map((item) => hydrateRecommendation(item, lookup)),
      edges: INTERNAL_EDGES,
    };
  });
}

export function relationWeight(relationType: DependencyRelationType): number {
  if (relationType === 'blocks') return 4;
  if (relationType === 'depends_on') return 3;
  if (relationType === 'triggers') return 2;
  return 1;
}
