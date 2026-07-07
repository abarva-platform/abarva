import { getPhsHealthPlanCorpusPatterns } from '@/lib/corpus/seeds/phs-health-plan-patterns';

const DISALLOWED_TERMS = [
  /\bpatient\s+name\b/i,
  /\bmember\s+name\b/i,
  /\bssn\b/i,
  /\bsocial\s+security\b/i,
  /\bdate\s+of\s+birth\b/i,
  /\bdob\b/i,
  /\bclaim\s+id\b/i,
  /\bmedical\s+record\s+number\b/i,
  /\bmrn\b/i,
];

const DEPTH_CRITERIA = [
  { id: 'P1', evidence: ['quantified claim', 'scope', 'horizon', '%'] },
  { id: 'P2', evidence: ['evidence chunk', 'primary citation', 'source'] },
  { id: 'P3', evidence: ['counterargument', 'steelman'] },
  { id: 'P4', evidence: ['calibrated confidence', 'confidence'] },
  { id: 'P5', evidence: ['boundary conditions', 'does not apply'] },
  { id: 'P6', evidence: ['failure mode', 'goes wrong when'] },
  { id: 'P7', evidence: ['maturity model', 'stage'] },
  { id: 'P8', evidence: ['vertical overlay', 'healthcare'] },
  { id: 'P9', evidence: ['related patterns', 'depends_on', 'reinforces'] },
  { id: 'P10', evidence: ['so what', 'synthesis'] },
];

function deterministicDepthScore(markdownBody: string): { score: number; pass: boolean; findings: string[] } {
  const normalized = markdownBody.toLowerCase();
  const findings: string[] = [];
  let score = 0;

  for (const criterion of DEPTH_CRITERIA) {
    const matches = criterion.evidence.filter((marker) => normalized.includes(marker)).length;
    if (matches > 0) {
      score += 1;
    } else {
      findings.push(`${criterion.id}: missing deterministic marker`);
    }
  }

  return {
    score,
    pass: score >= 8,
    findings,
  };
}

async function main() {
  const patterns = getPhsHealthPlanCorpusPatterns();
  const slugs = new Set<string>();
  const failures: string[] = [];
  const scores: Array<{ slug: string; score: number; pass: boolean; findings: string[] }> = [];

  if (patterns.length !== 7) {
    failures.push(`Expected 7 PHS health-plan patterns, found ${patterns.length}.`);
  }

  for (const pattern of patterns) {
    if (slugs.has(pattern.slug)) failures.push(`Duplicate slug: ${pattern.slug}`);
    slugs.add(pattern.slug);

    if (!pattern.slug.startsWith('health-plan-')) {
      failures.push(`${pattern.slug}: slug must start with health-plan-.`);
    }
    if (pattern.category !== 'payer_health_plan_strategy') {
      failures.push(`${pattern.slug}: category must be payer_health_plan_strategy.`);
    }
    if (!pattern.verticalOverlays?.includes('healthcare')) {
      failures.push(`${pattern.slug}: missing healthcare vertical overlay.`);
    }
    if (!pattern.regionOverlays?.includes('us_healthcare')) {
      failures.push(`${pattern.slug}: missing us_healthcare region overlay.`);
    }
    if ((pattern.confidence ?? 0) < 0.75) {
      failures.push(`${pattern.slug}: confidence must be at least 0.75.`);
    }
    if ((pattern.structured?.claims?.length ?? 0) < 2) {
      failures.push(`${pattern.slug}: expected at least 2 structured claims.`);
    }
    if ((pattern.structured?.evidence?.length ?? 0) < 3) {
      failures.push(`${pattern.slug}: expected at least 3 structured evidence entries.`);
    }
    if ((pattern.structured?.counterarguments?.length ?? 0) < 2) {
      failures.push(`${pattern.slug}: expected at least 2 structured counterarguments.`);
    }

    const serialized = JSON.stringify(pattern);
    for (const term of DISALLOWED_TERMS) {
      if (term.test(serialized)) {
        failures.push(`${pattern.slug}: contains disallowed sensitive-data marker ${term.source}.`);
      }
    }

    const lint = deterministicDepthScore(pattern.markdownBody);
    scores.push({
      slug: pattern.slug,
      score: lint.score,
      pass: lint.pass,
      findings: lint.findings ?? [],
    });
    if (!lint.pass || lint.score < 8) {
      failures.push(`${pattern.slug}: depth lint failed with score ${lint.score}.`);
    }
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ ok: false, failures, scores }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    pattern_count: patterns.length,
    category: 'payer_health_plan_strategy',
    status: 'review_ready',
    min_depth_score: Math.min(...scores.map((score) => score.score)),
    max_depth_score: Math.max(...scores.map((score) => score.score)),
    disallowed_sensitive_markers: 0,
    scores,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
