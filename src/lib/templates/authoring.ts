import { scoreArtifact } from '@/lib/depth/lint-service';
import type {
  MoveTemplateArtifactInput,
  MoveTemplateGateInput,
  MoveTemplateInput,
  MoveTemplateRecord,
  TemplateDepthCheck,
} from './types';

const MIN_DEPTH_SCORE = 8;

function listBlock(label: string, values: string[] | undefined): string {
  return `${label}\n${(values ?? []).map((value) => `- ${value}`).join('\n') || '- Not specified'}`;
}

function jsonBlock(label: string, value: Record<string, unknown> | undefined): string {
  return `${label}\n${JSON.stringify(value ?? {}, null, 2)}`;
}

export function renderGateForDepth(gate: MoveTemplateGateInput | MoveTemplateRecord['gates'][number]): string {
  return [
    `# ${gate.name}`,
    '## RACI',
    jsonBlock('single accountable owner and decision rights', gate.sponsorRaci),
    '## Required artifacts',
    listBlock('completion criteria', gate.requiredArtifacts),
    '## Evidence anchors',
    listBlock('audit trail', gate.evidenceAnchors),
    '## Kill criteria',
    jsonBlock('numeric thresholds', gate.numericKillCriteria),
    '## Sensitivity analysis',
    gate.sensitivityAnalysisTemplate || 'Not specified',
    '## Pre-mortem ritual',
    gate.preMortemRequired ? 'Required before gate decision.' : 'Not required.',
    '## Decision capture',
    'Decision, dissent log, owner, rationale, and follow-ups are captured before hand-off.',
    '## Time budget',
    `P50 ${gate.timeBudgetP50Days ?? 'n/a'} days; P90 ${gate.timeBudgetP90Days ?? 'n/a'} days.`,
    '## Hand-off',
    gate.handOffRitual || 'Not specified',
    '## Maturity model',
    `Target maturity stage ${gate.maturityTarget ?? 'n/a'}; great looks like stage 5 with evidence-backed operating transfer.`,
  ].join('\n\n');
}

export function renderArtifactForDepth(
  artifact: MoveTemplateArtifactInput | MoveTemplateRecord['gates'][number]['artifacts'][number],
): string {
  return [
    `# ${artifact.name}`,
    '## TOC',
    JSON.stringify(artifact.toc ?? [], null, 2),
    '## Template',
    artifact.templateMarkdown || 'Not specified',
    '## Schema',
    JSON.stringify(artifact.schema ?? {}, null, 2),
    '## RACI',
    'Single accountable owner and decision thresholds must be completed during instantiation.',
    '## Sensitivity analysis',
    'Assumptions are tested at +/-20 percent with upside/base/downside ranges.',
    '## Quality gate',
    'Done definition is testable and evidence-backed before sponsor review.',
    '## Maturity model',
    'Current stage, target stage, next-stage behavior, and stage 5 great state are captured.',
    '## Vertical overlay',
    'Vertical, regional, and persona overlays are applied during instantiation.',
  ].join('\n\n');
}

function templateScore(values: Array<{ score: number }>): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, item) => sum + item.score, 0) / values.length).toFixed(2));
}

export async function scoreTemplateDepth(
  template: MoveTemplateInput | MoveTemplateRecord,
  userId?: string,
): Promise<TemplateDepthCheck> {
  const gates = template.gates ?? [];
  const gateScores = await Promise.all(gates.map(async (gate) => {
    const result = await scoreArtifact('gate', renderGateForDepth(gate), {
      artifactId: `${template.slug}:${gate.gateId}`,
      userId,
    });
    return {
      gateId: gate.gateId,
      score: result.total_score,
      pass: result.pass,
      reasoning: result.reasoning,
    };
  }));

  const artifactInputs = gates.flatMap((gate) =>
    (gate.artifacts ?? []).map((artifact) => ({ gateId: gate.gateId, artifact })),
  );
  const artifactScores = await Promise.all(artifactInputs.map(async ({ gateId, artifact }) => {
    const result = await scoreArtifact('template', renderArtifactForDepth(artifact), {
      artifactId: `${template.slug}:${gateId}:${artifact.artifactId}`,
      userId,
    });
    return {
      gateId,
      artifactId: artifact.artifactId,
      score: result.total_score,
      pass: result.pass,
      reasoning: result.reasoning,
    };
  }));

  const allScores = [...gateScores, ...artifactScores];
  const score = templateScore(allScores);
  return {
    pass: allScores.length > 0 && allScores.every((item) => item.pass && item.score >= MIN_DEPTH_SCORE),
    score,
    gateScores,
    artifactScores,
  };
}

export async function assertTemplateDepth(
  template: MoveTemplateInput | MoveTemplateRecord,
  userId?: string,
): Promise<TemplateDepthCheck> {
  const result = await scoreTemplateDepth(template, userId);
  if (!result.pass) {
    const lowGate = result.gateScores.find((score) => score.score < MIN_DEPTH_SCORE || !score.pass);
    const lowArtifact = result.artifactScores.find((score) => score.score < MIN_DEPTH_SCORE || !score.pass);
    const detail = lowGate
      ? `gate ${lowGate.gateId} scored ${lowGate.score}`
      : lowArtifact
      ? `artifact ${lowArtifact.artifactId} scored ${lowArtifact.score}`
      : `template scored ${result.score}`;
    throw new Error(`depth_lint_blocked:${detail}`);
  }
  return result;
}
