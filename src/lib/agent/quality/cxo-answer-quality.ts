export type CxoTenantKey = 'apex-retail' | 'meridian-health' | 'skyharbor-air';

export type CxoAnswerSeverity = 'high' | 'medium' | 'low';

export interface CxoTenantContext {
  tenantKey: CxoTenantKey;
  tenantDisplayName: string;
  allowedDisplayNames?: string[];
}

export interface CxoAnswerValidationInput {
  text: string;
  tenant?: CxoTenantContext;
  mode?: 'live' | 'fallback' | null;
  expectedActionable?: boolean;
  allowCrossTenantDenial?: boolean;
  allowQuotedUserPrompt?: string;
}

export interface CxoAnswerIssue {
  code:
    | 'empty_answer'
    | 'fallback_mode'
    | 'timeout_or_system_failure'
    | 'raw_internal_id'
    | 'implementation_leak'
    | 'foreign_tenant_reference'
    | 'banned_phrase'
    | 'no_next_action'
    | 'vague_next_action'
    | 'wall_of_text';
  severity: CxoAnswerSeverity;
  message: string;
  evidence?: string;
}

export interface CxoAnswerValidationResult {
  passed: boolean;
  issues: CxoAnswerIssue[];
}

const TENANT_DISPLAY_NAMES: Record<CxoTenantKey, string[]> = {
  'apex-retail': ['Apex Retail', 'Apex Retail Group', 'Carlos Rivera'],
  'meridian-health': [
    'Meridian Health',
    'Meridian Health System',
    'Dr. Anita Krishnamurthy',
  ],
  'skyharbor-air': ['SkyHarbor', 'SkyHarbor Air'],
};

const HONEST_CROSS_TENANT_DENIAL =
  /\b(no such|not in your scope|outside your scope|cannot retrieve|did not retrieve cross-tenant|not available in your tenant)\b/i;

const RAW_INTERNAL_ID_PATTERNS: Array<{ code: string; re: RegExp }> = [
  {
    code: 'portfolio signal id',
    re: /\bsignal:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  },
  {
    code: 'portfolio signal token',
    re: /\b(?:sig|signal):[a-z0-9:_-]{8,}\b/i,
  },
  {
    code: 'uuid',
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  },
  {
    code: 'internal corpus token',
    re: /\bworldview:W\d+:\d{3}\b/i,
  },
  {
    code: 'database id field',
    re: /\b(?:client_id|tenant_id|user_id|engagement_id|initiative_id)\b/i,
  },
];

const IMPLEMENTATION_LEAK_PATTERNS = [
  /\bquery_[a-z0-9_]+\b/i,
  /\btool\s+that\s+does\s+not\s+exist\b/i,
  /\b(routeType|fallbackReason|atlasMode|x-atlas-mode)\s*=/i,
  /\bstack trace\b/i,
  /\bTypeError|ReferenceError|Unhandled Runtime Error\b/,
];

const BANNED_PHRASES = [
  /\bindustry\s+standard\b/i,
  /\beveryone\s+is\s+doing\b/i,
  /\bbest\s+practice\b/i,
];

const ACTION_CUES =
  /(?:\b(next step|next move|recommend|open|review|validate|pause|approve|reshape|escalate|assign|decide|close|measure|baseline|owner|by the next|before the next)\b|(?:^|\n)\s*-?\s*Next:)/i;

const VAGUE_ACTION =
  /\b(consider exploring|consider looking|keep an eye|monitor this|review as needed|circle back)\b/i;

export function validateCxoAnswer(
  input: CxoAnswerValidationInput,
): CxoAnswerValidationResult {
  const text = normalize(input.text);
  const issues: CxoAnswerIssue[] = [];

  if (!text) {
    issues.push({
      code: 'empty_answer',
      severity: 'high',
      message: 'Answer is empty.',
    });
    return { passed: false, issues };
  }

  if (input.mode === 'fallback') {
    issues.push({
      code: 'fallback_mode',
      severity: 'high',
      message: 'Answer was served in fallback mode and must not be presented as live model output.',
    });
  }

  if (/timed out before|something went wrong|an error occurred|try one\b/i.test(text)) {
    const evidence = firstMatch(
      text,
      /timed out before|something went wrong|an error occurred|try one\b/i,
    );
    issues.push({
      code: 'timeout_or_system_failure',
      severity: 'high',
      message: 'Answer exposes a timeout or system failure instead of a decision-grade response.',
      ...(evidence ? { evidence } : {}),
    });
  }

  for (const pattern of RAW_INTERNAL_ID_PATTERNS) {
    const evidence = firstMatch(text, pattern.re);
    if (evidence) {
      issues.push({
        code: 'raw_internal_id',
        severity: 'high',
        message: `Visible answer leaks a raw internal ${pattern.code}.`,
        evidence,
      });
    }
  }

  for (const re of IMPLEMENTATION_LEAK_PATTERNS) {
    const evidence = firstMatch(text, re);
    if (evidence) {
      issues.push({
        code: 'implementation_leak',
        severity: 'medium',
        message: 'Visible answer exposes implementation details instead of user-facing language.',
        evidence,
      });
    }
  }

  const textWithoutUserQuote = stripAllowedUserPrompt(text, input.allowQuotedUserPrompt);
  for (const re of BANNED_PHRASES) {
    const evidence = firstMatch(textWithoutUserQuote, re);
    if (evidence) {
      issues.push({
        code: 'banned_phrase',
        severity: 'medium',
        message: 'Answer uses a banned appeal-to-consensus phrase.',
        evidence,
      });
    }
  }

  if (input.tenant) {
    const foreign = findForeignTenantReference(text, input.tenant);
    const denialOk =
      input.allowCrossTenantDenial === true && HONEST_CROSS_TENANT_DENIAL.test(text);
    if (foreign && !denialOk) {
      issues.push({
        code: 'foreign_tenant_reference',
        severity: 'high',
        message: `Answer references ${foreign} while scoped to ${input.tenant.tenantDisplayName}.`,
        evidence: foreign,
      });
    }
  }

  if (input.expectedActionable !== false) {
    if (!ACTION_CUES.test(text)) {
      issues.push({
        code: 'no_next_action',
        severity: 'medium',
        message: 'Answer does not contain a concrete next action.',
      });
    }
    const evidence = firstMatch(text, VAGUE_ACTION);
    if (evidence) {
      issues.push({
        code: 'vague_next_action',
        severity: 'medium',
        message: 'Answer uses a vague next action instead of an executable step.',
        evidence,
      });
    }
  }

  const longParagraph = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => isHardToScanParagraph(part));
  if (longParagraph) {
    issues.push({
      code: 'wall_of_text',
      severity: 'low',
      message: 'Answer contains a long paragraph that is hard for a CXO to scan.',
      evidence: trimWords(longParagraph, 18),
    });
  }

  return { passed: issues.length === 0, issues };
}

function findForeignTenantReference(
  text: string,
  tenant: CxoTenantContext,
): string | null {
  const allowed = new Set([
    tenant.tenantDisplayName,
    ...(tenant.allowedDisplayNames ?? []),
    ...TENANT_DISPLAY_NAMES[tenant.tenantKey],
  ]);
  for (const [key, names] of Object.entries(TENANT_DISPLAY_NAMES) as Array<
    [CxoTenantKey, string[]]
  >) {
    if (key === tenant.tenantKey) continue;
    for (const name of names) {
      if (allowed.has(name)) continue;
      if (new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text)) return name;
    }
  }
  return null;
}

function stripAllowedUserPrompt(text: string, prompt: string | undefined): string {
  if (!prompt) return text;
  let stripped = text;
  for (const phrase of BANNED_PHRASES) {
    const promptHit = firstMatch(prompt, phrase);
    if (!promptHit) continue;
    stripped = stripped.replace(new RegExp(escapeRegExp(promptHit), 'gi'), '');
  }
  return stripped;
}

function firstMatch(text: string, re: RegExp): string | null {
  return text.match(re)?.[0] ?? null;
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isHardToScanParagraph(text: string): boolean {
  if (wordCount(text) <= 95) return false;
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const isStructured = lines.length >= 2 && lines.every((line) => /^([-*·]\s+|\d+\.\s+|\|.+\|$)/.test(line));
  if (!isStructured) return true;
  return lines.some((line) => wordCount(line) > 45);
}

function trimWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? text : `${words.slice(0, maxWords).join(' ')}...`;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
