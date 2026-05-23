import { scoreArtifact } from '@/lib/depth/lint-service';
import type { WorkshopAssetRecord, WorkshopDepthLintResult, WorkshopTemplateRecord } from './types';

const ASSET_LABELS: Record<WorkshopAssetRecord['assetType'], string> = {
  pre_read: 'Pre-read',
  agenda: 'Agenda',
  facilitator_brief: 'Facilitator brief',
  worksheet: 'Worksheets',
  decision_capture: 'Decision capture',
  pre_mortem: 'Pre-mortem',
  post_read: 'Post-read',
  stakeholder_map: 'Stakeholder map',
};

export function workshopDepthContent(template: WorkshopTemplateRecord): string {
  const lines = [
    `Workshop: ${template.name}`,
    `Duration: ${template.durationMinutes} minutes`,
    `Hypothesis to test: ${template.hypothesisToTest || 'Not provided'}`,
    `Vertical overlays: ${template.verticalOverlays.join(', ') || 'none'}`,
    `Stakeholder map: ${JSON.stringify(template.stakeholderMap)}`,
    `Facilitation tactics: ${JSON.stringify(template.facilitatorTactics)}`,
    '',
  ];

  for (const asset of template.assets.slice().sort((a, b) => a.sequenceIndex - b.sequenceIndex)) {
    lines.push(`## ${ASSET_LABELS[asset.assetType]}: ${asset.name}`);
    if (asset.timeBoxMinutes != null) lines.push(`Time box: ${asset.timeBoxMinutes} min`);
    lines.push(asset.contentText ?? asset.contentBlobRef ?? '');
    lines.push('');
  }

  return lines.join('\n');
}

export async function lintWorkshopTemplateDepth(
  template: WorkshopTemplateRecord,
  userId?: string,
): Promise<WorkshopDepthLintResult> {
  const result = await scoreArtifact('workshop', workshopDepthContent(template), {
    artifactId: template.id,
    userId,
  });
  return {
    score: result.total_score,
    pass: result.pass,
    findings: result.criterion_scores
      .filter((criterion) => criterion.score < 1)
      .map((criterion) => `${criterion.criterion_id}: ${criterion.label}`),
    reasoning: result.reasoning,
  };
}
