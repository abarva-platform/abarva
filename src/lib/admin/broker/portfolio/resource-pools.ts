import type { ProgramInstance } from '@/lib/programs/program-instance';

export interface ResourcePool {
  id: string;
  kind: 'gcc' | 'sponsor' | 'vendor' | 'governance';
  capacityPerQuarter: number;
  committedByMoveId: Record<string, number>;
  availableForNewWork: number;
}

export interface BuildResourcePoolsInput {
  clientKey: string;
  programs: ReadonlyArray<ProgramInstance>;
  capacityOverrides?: Partial<Record<string, number>>;
}

interface PoolDraft {
  id: string;
  kind: ResourcePool['kind'];
  capacityPerQuarter: number;
  committedByMoveId: Record<string, number>;
}

const DEFAULT_CAPACITY: Record<ResourcePool['kind'], number> = {
  gcc: 6,
  sponsor: 2,
  vendor: 3,
  governance: 4,
};

const VENDOR_TOKENS = [
  'adobe',
  'aws',
  'blue yonder',
  'cohere',
  'epic',
  'genesys',
  'ibm',
  'microsoft',
  'nuance',
  'oracle',
  'salesforce',
  'sap',
  'segment',
  'servicenow',
  'ukg',
  'vendor c',
  'workday',
];

const GCC_RULES: Array<{ id: string; terms: string[]; capacity: number }> = [
  { id: 'gcc:data-engineering', terms: ['data', 'pipeline', 'source system', 'quality', 'cdp', 'fabric'], capacity: 4 },
  { id: 'gcc:solution-architecture', terms: ['architecture', 'integration', 'system', 'platform', 'api'], capacity: 4 },
  { id: 'gcc:change-management', terms: ['adoption', 'change', 'training', 'workflow', 'workforce'], capacity: 6 },
  { id: 'gcc:analytics-and-ai', terms: ['ai', 'model', 'copilot', 'automation', 'inference'], capacity: 5 },
  { id: 'gcc:operations', terms: ['operations', 'store', 'clinical', 'crew', 'contact center', 'revenue cycle'], capacity: 5 },
];

const GOVERNANCE_TERMS = [
  'ai governance',
  'attestation',
  'ciso',
  'compliance',
  'dlp',
  'governance',
  'privacy',
  'risk',
  'security',
];

export function buildResourcePools(input: BuildResourcePoolsInput): ResourcePool[] {
  const drafts = new Map<string, PoolDraft>();

  for (const program of input.programs) {
    if (program.currentPhase >= 6) continue;
    const text = programText(program);
    const moveCommitment = commitmentFor(program);

    addCommitment(
      drafts,
      {
        id: `sponsor:${slugify(program.sponsor.id || program.sponsor.name)}`,
        kind: 'sponsor',
        capacityPerQuarter: capacityFor(input, `sponsor:${slugify(program.sponsor.id || program.sponsor.name)}`, DEFAULT_CAPACITY.sponsor),
      },
      program.id,
      moveCommitment,
    );

    for (const vendor of collectTokens(text, VENDOR_TOKENS)) {
      addCommitment(
        drafts,
        {
          id: `vendor:${slugify(vendor)}`,
          kind: 'vendor',
          capacityPerQuarter: capacityFor(input, `vendor:${slugify(vendor)}`, DEFAULT_CAPACITY.vendor),
        },
        program.id,
        moveCommitment,
      );
    }

    for (const rule of GCC_RULES) {
      if (!rule.terms.some((term) => text.includes(term))) continue;
      addCommitment(
        drafts,
        {
          id: rule.id,
          kind: 'gcc',
          capacityPerQuarter: capacityFor(input, rule.id, rule.capacity),
        },
        program.id,
        moveCommitment,
      );
    }

    if (GOVERNANCE_TERMS.some((term) => text.includes(term))) {
      addCommitment(
        drafts,
        {
          id: 'governance:ai-council',
          kind: 'governance',
          capacityPerQuarter: capacityFor(input, 'governance:ai-council', DEFAULT_CAPACITY.governance),
        },
        program.id,
        moveCommitment,
      );
    }
  }

  return [...drafts.values()]
    .map((draft) => {
      const committed = Object.values(draft.committedByMoveId).reduce((sum, value) => sum + value, 0);
      return {
        ...draft,
        availableForNewWork: Math.max(0, roundOne(draft.capacityPerQuarter - committed)),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function addCommitment(
  drafts: Map<string, PoolDraft>,
  pool: Omit<PoolDraft, 'committedByMoveId'>,
  moveId: string,
  commitment: number,
): void {
  const draft = drafts.get(pool.id) ?? {
    ...pool,
    committedByMoveId: {},
  };
  draft.committedByMoveId[moveId] = roundOne((draft.committedByMoveId[moveId] ?? 0) + commitment);
  drafts.set(pool.id, draft);
}

function commitmentFor(program: ProgramInstance): number {
  if (program.currentPhase <= 1) return 0.5;
  if (program.currentPhase >= 5) return 1.25;
  return 1;
}

function capacityFor(input: BuildResourcePoolsInput, id: string, fallback: number): number {
  return input.capacityOverrides?.[id] ?? fallback;
}

function programText(program: ProgramInstance): string {
  return [
    program.id,
    program.displayId,
    program.name,
    program.patternId,
    program.sponsor.name,
    program.sponsor.title,
    ...program.deliverables.flatMap((item) => [item.label, item.owner ?? '']),
    ...program.evidence.map((item) => item.citation),
    ...program.flags.map((item) => item.description),
    ...program.linkedSourceEvents.flatMap((item) => [item.sourceEventName, item.description]),
    ...program.linkedPrograms.flatMap((item) => [item.programName, item.description]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function collectTokens(text: string, tokens: ReadonlyArray<string>): string[] {
  return tokens.filter((token) => text.includes(token)).sort((a, b) => a.localeCompare(b));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
