import type { CorpusPatternRecord, DepthLintResult } from './types';
import { scoreArtifact } from '@/lib/depth/lint-service';

export async function lintCorpusPatternDepth(pattern: CorpusPatternRecord): Promise<DepthLintResult> {
  const endpoint = process.env.DEPTH_LINT_SERVICE_URL?.trim();
  if (!endpoint) {
    const result = await scoreArtifact('pattern', [
      `# ${pattern.title}`,
      '',
      `Slug: ${pattern.slug}`,
      `Category: ${pattern.category}`,
      `Confidence: ${pattern.confidence}`,
      '',
      pattern.markdownBody,
      '',
      '## Structured Claims',
      JSON.stringify(pattern.claims, null, 2),
      '',
      '## Evidence',
      JSON.stringify(pattern.evidence, null, 2),
      '',
      '## Counterarguments',
      JSON.stringify(pattern.counterarguments, null, 2),
      '',
      '## Synthesis',
      JSON.stringify(pattern.synthesis, null, 2),
    ].join('\n'), {
      artifactId: pattern.id,
      userId: pattern.primaryAuthorId ?? undefined,
    });
    return {
      score: result.total_score,
      pass: result.pass,
      findings: result.criterion_scores
        .filter((criterion) => criterion.score < 1)
        .map((criterion) => `${criterion.criterion_id}: ${criterion.reasoning}`),
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rubric: 'P',
      pattern: {
        slug: pattern.slug,
        title: pattern.title,
        category: pattern.category,
        markdownBody: pattern.markdownBody,
        claims: pattern.claims,
        evidence: pattern.evidence,
        counterarguments: pattern.counterarguments,
        synthesis: pattern.synthesis,
        verticalOverlays: pattern.verticalOverlays,
        regionOverlays: pattern.regionOverlays,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`depth-lint-service failed: ${response.status} ${await response.text()}`);
  }
  const json = await response.json() as Partial<DepthLintResult>;
  const score = typeof json.score === 'number' ? json.score : 0;
  return {
    score,
    pass: json.pass === true || score >= 8,
    findings: Array.isArray(json.findings) ? json.findings.filter((item): item is string => typeof item === 'string') : [],
  };
}
