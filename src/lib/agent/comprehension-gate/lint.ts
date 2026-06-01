import { COMPREHENSION_PATTERNS, EXECUTIVE_ACRONYMS } from './id-patterns';

export interface ComprehensionGateIssue {
  kind: 'raw_id' | 'internal_code' | 'code_identifier' | 'unexplained_acronym';
  original: string;
  substitution: string;
}

export interface ComprehensionGateResult {
  blocked: boolean;
  blockReason: string | null;
  cleaned: string;
  detectedIssues: ComprehensionGateIssue[];
}

export function gate(answer: string, _context: { tenantKey: string }): ComprehensionGateResult {
  void _context;

  let cleaned = answer;
  const detectedIssues: ComprehensionGateIssue[] = [];

  for (const item of COMPREHENSION_PATTERNS) {
    cleaned = cleaned.replace(item.pattern, (original) => {
      const substitution = item.describe(original);
      detectedIssues.push({ kind: item.kind, original, substitution });
      return substitution;
    });
  }

  for (const acronym of answer.match(/\b[A-Z]{2,6}\b/g) ?? []) {
    if (EXECUTIVE_ACRONYMS.has(acronym)) continue;
    detectedIssues.push({
      kind: 'unexplained_acronym',
      original: acronym,
      substitution: `${acronym} (define before use)`,
    });
  }

  const blocked = detectedIssues.some((issue) => issue.kind === 'unexplained_acronym');
  return {
    blocked,
    blockReason: blocked ? 'Answer contains unexplained acronyms that must be defined before rendering.' : null,
    cleaned,
    detectedIssues,
  };
}
