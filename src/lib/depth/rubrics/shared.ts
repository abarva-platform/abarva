import type {
  DepthCriterion,
  DepthRubricDefinition,
  DepthRubricType,
  DepthStructuralResult,
} from '../types';

const SECTION_HEADING_RE = /^#{1,4}\s+(.+)$/gm;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function hasTerm(content: string, term: string): boolean {
  return normalize(content).includes(normalize(term));
}

export function createStructuralCheck(criteria: readonly DepthCriterion[], requiredSections: readonly string[]) {
  return (content: string): DepthStructuralResult => {
    const headings = Array.from(content.matchAll(SECTION_HEADING_RE)).map((match) => match[1] ?? '');
    const missingRequiredSections = requiredSections.filter(
      (section) => !headings.some((heading) => hasTerm(heading, section)) && !hasTerm(content, section),
    );

    const criterionScores = criteria.map((criterion) => {
      const structural_hits = criterion.evidence.filter((term) => hasTerm(content, term));
      const score = structural_hits.length > 0 ? 1 : 0;
      return {
        criterion_id: criterion.id,
        label: criterion.label,
        score,
        reasoning: score === 1
          ? `Found evidence for ${criterion.label}: ${structural_hits.slice(0, 3).join(', ')}.`
          : `Missing explicit evidence for ${criterion.label}.`,
        structural_hits,
      };
    });

    const weighted = criterionScores.reduce((sum, item) => {
      const criterion = criteria.find((candidate) => candidate.id === item.criterion_id);
      return sum + item.score * (criterion?.weight ?? 1);
    }, 0);

    return {
      criterionScores,
      missingRequiredSections,
      structuralScore: Number(weighted.toFixed(2)),
    };
  };
}

export function createSemanticPrompt(rubric: Pick<DepthRubricDefinition, 'type' | 'code' | 'title' | 'criteria'>) {
  return (content: string, structural: DepthStructuralResult): string => {
    return [
      `You are scoring AbarVa depth rubric ${rubric.code}: ${rubric.title}.`,
      'Return strict JSON with criterion_scores and reasoning. Score each criterion 0 or 1.',
      'Do not reward vague consulting prose. Require concrete sections, numbers, owners, evidence, and decision artifacts.',
      '',
      'RUBRIC_JSON:',
      JSON.stringify({ type: rubric.type, code: rubric.code, criteria: rubric.criteria }, null, 2),
      '',
      'STRUCTURAL_RESULT_JSON:',
      JSON.stringify(structural, null, 2),
      '',
      'ARTIFACT:',
      content,
    ].join('\n');
  };
}

export function defineRubric(args: Omit<DepthRubricDefinition, 'structuralCheck' | 'semanticPrompt'>): DepthRubricDefinition {
  const base = {
    ...args,
    structuralCheck: createStructuralCheck(args.criteria, args.requiredSections),
  };
  return {
    ...base,
    semanticPrompt: createSemanticPrompt(base),
  };
}

export function assertRubricType(value: string): DepthRubricType {
  if (
    value === 'template'
    || value === 'workshop'
    || value === 'instrument'
    || value === 'pattern'
    || value === 'gate'
    || value === 'sentinel'
  ) {
    return value;
  }
  throw new Error(`Unknown depth rubric type: ${value}`);
}
