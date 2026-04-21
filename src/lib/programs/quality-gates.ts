// Nexus quality gates · Packet 8 §8.7.
// Applied to any Nexus-generated draft before it renders or lands as a
// deliverable version. Five gates:
//   1 · provenance check — every substantive claim has ≥1 source signal
//   2 · voice filter — forbidden phrases stripped
//   3 · pattern adherence — output shape matches expected render pattern
//   4 · length check — within module-type bounds
//   5 · consistency check — deferred to async Contradiction agent
//
// Returns `{ pass, issues, cleanedContent }`. Callers (nexus.ts · draft
// API route) should surface issues to the user when pass=false; Maestro
// may still accept with override.

export interface QualityGateResult {
  pass: boolean;
  issues: Array<{ gate: string; severity: 'hard' | 'soft'; message: string }>;
  cleanedContent: string;
  metadata: {
    forbiddenPhrasesStripped: number;
    provenanceHints: number;
    wordCount: number;
  };
}

const FORBIDDEN_PHRASES = [
  /\bas an AI (language )?model\b/gi,
  /\bI think\b/gi,
  /\bI believe\b/gi,
  /\bI feel\b/gi,
  /\bgreat question[!.]?/gi,
  /\blet me know if you need anything else\b/gi,
  /\bhope that helps[!.]?/gi,
  /\bI apologize\b/gi,
  /\bI'm sorry\b/gi,
  /\bI'll try my best\b/gi,
];

const PROVENANCE_HINTS = [
  /\bpattern [a-z0-9_-]+\b/gi,
  /\bKLAS\b/g,
  /\bNEJM\b/g,
  /\bsource: /gi,
  /\bper (the )?(pattern|playbook|spec)\b/gi,
  /\bv\d+\.\d+\b/g,
  /\bbaseline\b/gi,
  /\bcohort n=\d+\b/gi,
  /\b\$\d+(\.\d+)?[MBk]?\b/g,
];

const MIN_WORDS = 30;
const MAX_WORDS = 4000;

export function runQualityGates(
  content: string,
  opts: { expectedShape?: 'brief' | 'memo' | 'charter' | 'design' | 'outcome' | 'free' } = {},
): QualityGateResult {
  const issues: QualityGateResult['issues'] = [];

  // Gate 2 · voice filter (strip + flag)
  let cleaned = content;
  let forbiddenHits = 0;
  for (const pattern of FORBIDDEN_PHRASES) {
    const matches = cleaned.match(pattern);
    if (matches) {
      forbiddenHits += matches.length;
      cleaned = cleaned.replace(pattern, '');
    }
  }
  if (forbiddenHits > 0) {
    issues.push({
      gate: 'voice_filter',
      severity: 'soft',
      message: `Stripped ${forbiddenHits} forbidden phrase${forbiddenHits === 1 ? '' : 's'}`,
    });
    // Clean up any resulting double-spaces or orphan punctuation
    cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
  }

  // Gate 1 · provenance check
  let provenanceHits = 0;
  for (const pattern of PROVENANCE_HINTS) {
    const matches = cleaned.match(pattern);
    if (matches) provenanceHits += matches.length;
  }
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  const minProvenance = wordCount > 400 ? 2 : 1;
  if (provenanceHits < minProvenance) {
    issues.push({
      gate: 'provenance',
      severity: 'hard',
      message: `Only ${provenanceHits} provenance signal${provenanceHits === 1 ? '' : 's'} detected (expected ≥${minProvenance}) — Nexus draft must cite patterns, baselines, cohort data, or external sources`,
    });
  }

  // Gate 4 · length check
  if (wordCount < MIN_WORDS) {
    issues.push({
      gate: 'length',
      severity: 'hard',
      message: `Output too short (${wordCount} words, minimum ${MIN_WORDS}) — likely hollow draft; caller should gather more context`,
    });
  } else if (wordCount > MAX_WORDS) {
    issues.push({
      gate: 'length',
      severity: 'soft',
      message: `Output long (${wordCount} words, soft-cap ${MAX_WORDS}) — consider splitting`,
    });
  }

  // Gate 3 · pattern adherence (heuristic per expected shape)
  if (opts.expectedShape === 'charter' && !/scope|outcome|sponsor|phase/i.test(cleaned)) {
    issues.push({
      gate: 'pattern_adherence',
      severity: 'hard',
      message: 'Charter draft missing required anchors (scope / outcome / sponsor / phase)',
    });
  }
  if (opts.expectedShape === 'outcome' && !/(baseline|delta|verified|attested|outcome)/i.test(cleaned)) {
    issues.push({
      gate: 'pattern_adherence',
      severity: 'hard',
      message: 'Outcome report missing attestation language (baseline / delta / verified / attested)',
    });
  }

  const hardIssues = issues.filter((i) => i.severity === 'hard');
  return {
    pass: hardIssues.length === 0,
    issues,
    cleanedContent: cleaned,
    metadata: {
      forbiddenPhrasesStripped: forbiddenHits,
      provenanceHints: provenanceHits,
      wordCount,
    },
  };
}
