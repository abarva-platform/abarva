import { scoreArtifact } from '@/lib/depth/lint-service';
import type { InstrumentDepthLintResult, InstrumentTemplateRecord } from './types';

function instrumentDepthContent(template: InstrumentTemplateRecord): string {
  return [
    `# ${template.name}`,
    '',
    `Slug: ${template.slug}`,
    `Category: ${template.category}`,
    `Format: ${template.format}`,
    `T-tier: ${template.tTier}`,
    `Owner role: ${template.ownerRole}`,
    '',
    '## Sample size',
    JSON.stringify(template.sampleSizeMath, null, 2),
    '',
    '## Bias controls',
    JSON.stringify(template.biasControls, null, 2),
    '',
    '## Privacy',
    template.privacyBlock,
    '',
    '## Validation rules',
    JSON.stringify(template.validationRules, null, 2),
    '',
    '## Triangulation',
    JSON.stringify(template.triangulationPlan, null, 2),
    '',
    '## Calibration questions',
    JSON.stringify(template.schema.calibrationQuestions ?? template.schema.calibration_questions ?? [], null, 2),
    '',
    '## Data-cleaning checklist',
    JSON.stringify(template.schema.dataCleaningChecklist ?? template.schema.data_cleaning_checklist ?? [], null, 2),
    '',
    '## Edge-case handling',
    JSON.stringify(template.edgeCaseGuide, null, 2),
    '',
    '## Missing data sensitivity',
    JSON.stringify(template.schema.missingDataSensitivity ?? template.schema.missing_data_sensitivity ?? {}, null, 2),
    '',
    '## Refresh cadence',
    template.refreshCadence,
    '',
    '## Content template',
    template.contentTemplateText,
  ].join('\n');
}

export async function lintInstrumentTemplateDepth(
  template: InstrumentTemplateRecord,
): Promise<InstrumentDepthLintResult> {
  const result = await scoreArtifact('instrument', instrumentDepthContent(template), {
    artifactId: template.id,
    userId: template.primaryAuthorId ?? undefined,
  });
  return {
    score: result.total_score,
    pass: result.pass,
    findings: result.criterion_scores
      .filter((criterion) => criterion.score < 1)
      .map((criterion) => `${criterion.criterion_id}: ${criterion.reasoning}`),
  };
}
