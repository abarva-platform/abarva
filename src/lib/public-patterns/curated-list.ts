import { loadCorpus } from '@/lib/intelligence/loader';
import type { PatternDomain, PatternSeed, PatternTier } from '@/lib/intelligence/seed-types';

export const PUBLIC_PATTERN_IDS = [
  'PAT-AI-005',
  'PAT-CDP-001',
  'PAT-AI-010',
  'PAT-AI-008',
  'PAT-IND-RET-001',
  'PAT-ARCH-008',
  'PAT-META-M6',
] as const;

export type PublicPatternId = (typeof PUBLIC_PATTERN_IDS)[number];

export interface PublicPattern {
  id: PublicPatternId;
  slug: string;
  title: string;
  domain: PatternDomain;
  domainLabel: string;
  tier: PatternTier;
  tierLabel: string;
  confidencePercent: number;
  observationLabel: string;
  provenanceRibbon: string;
  publicSummary: string;
  whyItMatters: string;
  whereItApplies: string;
  atlasQuestion: string;
  safeguards: string[];
  connections: string[];
  source: {
    corpusId: PublicPatternId;
    corpusSlug: string;
    corpusVersion: string;
    createdFrom: PatternSeed['createdFrom'];
  };
}

interface PublicPatternCopy {
  publicSummary: string;
  whyItMatters: string;
  whereItApplies: string;
  atlasQuestion: string;
  connections: string[];
}

const DOMAIN_LABELS: Record<PatternDomain, string> = {
  meta: 'Operating model',
  sourcing: 'Sourcing',
  cdp: 'Data activation',
  ai_programs: 'AI programs',
  architecture: 'Product architecture',
  industry_specific: 'Industry pattern',
  compliance: 'Compliance',
  future_of_work: 'Future of work',
};

const TIER_LABELS: Record<PatternTier, string> = {
  M: 'Meta pattern',
  authoritative: 'Authoritative pattern',
  validated: 'Validated pattern',
};

const PUBLIC_COPY: Record<PublicPatternId, PublicPatternCopy> = {
  'PAT-AI-005': {
    publicSummary:
      'A governance pattern for finding AI usage that entered through unofficial channels and moving it into a reviewable inventory, policy, and access model.',
    whyItMatters:
      'Leaders cannot manage AI risk, spend, or data exposure when usage is invisible. This pattern turns discovery into a repeatable control loop instead of a one-time audit.',
    whereItApplies:
      'Use when AI tools are spreading through personal accounts, embedded product features, direct purchases, or teams moving faster than central governance can observe.',
    atlasQuestion:
      'Which usage channels are visible, which are inferred, and what evidence would move an unsanctioned tool into a governed path?',
    connections: ['AI governance', 'tool inventory', 'policy enforcement'],
  },
  'PAT-CDP-001': {
    publicSummary:
      'A readiness model for deciding whether a customer-data activation effort has the sequencing, evidence, and operating inputs required to advance.',
    whyItMatters:
      'Data-platform programs often move forward on ambition alone. This pattern asks whether gates, owners, commercial assumptions, and activation evidence are strong enough to support the next phase.',
    whereItApplies:
      'Use before committing to a major activation roadmap, especially when data quality, audience design, measurement, or decision rights are still unsettled.',
    atlasQuestion:
      'What must be true about data quality, ownership, and activation evidence before this program should proceed?',
    connections: ['CDP readiness', 'activation gates', 'data commercialization'],
  },
  'PAT-AI-010': {
    publicSummary:
      'A value-attribution pattern that requires every AI outcome claim to state the measurement method behind it before portfolio comparisons are made.',
    whyItMatters:
      'AI value claims become misleading when self-reported savings, experiments, and observed operational outcomes are treated as equivalent. This pattern keeps evidence quality visible.',
    whereItApplies:
      'Use when comparing AI initiatives with different evidence bases, value types, adoption levels, or measurement maturity.',
    atlasQuestion:
      'Which value claims are measured, which are modeled, and which need an evidence haircut before they can guide investment?',
    connections: ['ROI attribution', 'evidence weighting', 'portfolio economics'],
  },
  'PAT-AI-008': {
    publicSummary:
      'A portfolio-health pattern for defining when AI initiatives should continue, be redesigned, or stop instead of remaining permanently in pilot status.',
    whyItMatters:
      'Healthy AI portfolios need explicit stop rules. Without them, weak initiatives consume budget, leadership attention, and scarce data or engineering capacity.',
    whereItApplies:
      'Use when many AI efforts are in flight and leaders need consistent criteria for adoption, value, risk, and feasibility.',
    atlasQuestion:
      'Which initiatives have enough evidence to continue, and which are missing the proof required to earn the next tranche of investment?',
    connections: ['portfolio governance', 'pilot discipline', 'investment focus'],
  },
  'PAT-IND-RET-001': {
    publicSummary:
      'A retail margin pattern for treating owned-brand growth as an integrated analytics, sourcing, pricing, and assortment program rather than a merchandising side project.',
    whyItMatters:
      'Owned-brand economics can compound when margin, supplier leverage, SKU rationalization, and customer demand signals are managed together.',
    whereItApplies:
      'Use with retailers that have meaningful private-label exposure, uneven category economics, limited SKU-level visibility, or underpowered launch analytics.',
    atlasQuestion:
      'Where do margin, assortment, supplier, and demand signals agree that owned-brand intervention is worth prioritizing?',
    connections: ['retail margin', 'owned brand', 'assortment analytics'],
  },
  'PAT-ARCH-008': {
    publicSummary:
      'A product-architecture pattern for exposing clear answers and next-useful state while keeping retrieval machinery and internal evidence plumbing below the surface.',
    whyItMatters:
      'Users need confidence and momentum, not a tour of every system component. This pattern keeps complex intelligence legible without hiding provenance entirely.',
    whereItApplies:
      'Use for decision surfaces, intelligence workspaces, and executive views that must feel expert while preserving traceability.',
    atlasQuestion:
      'What should the user see immediately, and what evidence should remain available only when deeper provenance is needed?',
    connections: ['UI architecture', 'provenance design', 'decision surfaces'],
  },
  'PAT-META-M6': {
    publicSummary:
      'An outcome-reconciliation pattern that compares projected value with realized value, attributes variance, and feeds the learning back into future work.',
    whyItMatters:
      'Transformation systems improve when commitments and outcomes live in the same accountability loop. Reconciliation turns delivery history into reusable pattern capital.',
    whereItApplies:
      'Use after an initiative has measurable post-launch results or when a partial closeout needs to preserve what was projected, what happened, and why.',
    atlasQuestion:
      'What changed between projected and realized value, and which variance causes should inform the next recommendation?',
    connections: ['outcome ledger', 'variance attribution', 'learning loop'],
  },
};

const PUBLIC_SAFEGUARDS = [
  'No tenant names',
  'No source document paths',
  'No customer-specific decisions',
  'No raw corpus body text',
];

const publicCorpus = loadCorpus({ loadedAt: '2026-04-28T00:00:00.000Z' });

function getPatternSeed(id: PublicPatternId): PatternSeed {
  const pattern = publicCorpus.patternsById.get(id);

  if (!pattern) {
    throw new Error(`Public pattern sample references missing KF-1 corpus pattern: ${id}`);
  }

  return pattern;
}

function formatObservationLabel(instanceCount: number): string {
  if (instanceCount === 1) return '1 anonymized observation';
  return `${instanceCount} anonymized observations`;
}

function toPublicPattern(id: PublicPatternId): PublicPattern {
  const pattern = getPatternSeed(id);
  const copy = PUBLIC_COPY[id];

  return {
    id,
    slug: pattern.slug,
    title: pattern.title,
    domain: pattern.domain,
    domainLabel: DOMAIN_LABELS[pattern.domain],
    tier: pattern.tier,
    tierLabel: TIER_LABELS[pattern.tier],
    confidencePercent: Math.round(pattern.confidence * 100),
    observationLabel: formatObservationLabel(pattern.instanceCount),
    provenanceRibbon: `KF-1 corpus | ${id} | ${TIER_LABELS[pattern.tier]}`,
    publicSummary: copy.publicSummary,
    whyItMatters: copy.whyItMatters,
    whereItApplies: copy.whereItApplies,
    atlasQuestion: copy.atlasQuestion,
    safeguards: PUBLIC_SAFEGUARDS,
    connections: copy.connections,
    source: {
      corpusId: id,
      corpusSlug: pattern.slug,
      corpusVersion: pattern.version,
      createdFrom: pattern.createdFrom,
    },
  };
}

export function getPublicPatternSample(): PublicPattern[] {
  return PUBLIC_PATTERN_IDS.map(toPublicPattern);
}

export function getPublicPatternBySlug(slug: string): PublicPattern | null {
  const normalized = slug.trim().toLowerCase();
  return getPublicPatternSample().find((pattern) => pattern.slug === normalized) ?? null;
}
