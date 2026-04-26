// QA13 - Secret Hygiene Value-Pattern Helpers
//
// Deterministic, file-pure helpers that detect *real* secret VALUES in
// arbitrary text (typically the JSON-serialized response of an API
// route, or a stringified manifest payload) without producing
// false positives on honest documentation strings. The goal is to make
// hygiene MORE precise, not weaker:
//
//   - Documentation that names an env var (`SUPABASE_SERVICE_ROLE_KEY`,
//     `GITHUB_STATUS_TOKEN`) is NOT a leak. Env var NAMES are public.
//   - A disclaimer that says "no call to api.github.com is performed"
//     is NOT a leak. URL strings inside honest text must not trip
//     hygiene.
//   - A real GitHub PAT (`ghp_...`), Anthropic / OpenAI key
//     (`sk-ant-...` / `sk-...`), Slack token (`xoxb-...`), AWS access
//     key (`AKIA...`), JWT (`eyJ...`), or `KEY="long_opaque_value"`
//     pair IS a leak and MUST be flagged.
//
// This module is consumed by integration tests (e.g. the production-
// readiness live-refresh hygiene assertions) and by future QA gates.
//
// Module hygiene contract (asserted by the companion test):
//   - No `Date.now`, no `Math.random`, no `new Date()` calls.
//   - No `fetch` calls.
//   - No imports from anthropic, openai, agent runtime, auth, source,
//     supabase, or any other live system.
//   - Pure, deterministic, side-effect-free.
//
// Provenance: every public surface is traceable to the constant
// `CREATED_FROM_DETERMINISTIC_SECRET_HYGIENE_SEED` exported below.

export const CREATED_FROM_DETERMINISTIC_SECRET_HYGIENE_SEED =
  'deterministic_secret_hygiene_seed' as const;

// ---------------------------------------------------------------------
// Likely-secret VALUE patterns.
//
// Each entry pairs a stable `name` (used in finding output) with a
// regex that matches a real-shape secret VALUE. These patterns are
// intentionally conservative: they only fire on the *value* shapes
// that real providers issue, never on bare env var names like
// `GITHUB_STATUS_TOKEN` or on URL substrings like `api.github.com`.
// ---------------------------------------------------------------------

export interface SecretValuePattern {
  readonly name: string;
  readonly pattern: RegExp;
  readonly description: string;
}

export const LIKELY_SECRET_VALUE_PATTERNS: ReadonlyArray<SecretValuePattern> = [
  {
    name: 'github_pat_classic',
    pattern: /ghp_[A-Za-z0-9]{36,}/,
    description:
      'GitHub personal access token, classic shape (ghp_ prefix + 36+ alphanumerics).',
  },
  {
    name: 'github_pat_fine_grained',
    pattern: /github_pat_[A-Za-z0-9_]{60,}/,
    description:
      'GitHub fine-grained personal access token (github_pat_ prefix + 60+ chars).',
  },
  {
    name: 'github_app_token',
    pattern: /ghs_[A-Za-z0-9]{36,}/,
    description: 'GitHub App / installation token (ghs_ prefix + 36+ alphanumerics).',
  },
  {
    name: 'vercel_api_token',
    pattern: /vercel_[A-Za-z0-9]{24,}/,
    description: 'Vercel API token shape (vercel_ prefix + 24+ alphanumerics).',
  },
  {
    name: 'openai_or_anthropic_key',
    pattern: /sk-(ant-)?[A-Za-z0-9_-]{32,}/,
    description:
      'OpenAI- or Anthropic-shaped API key (sk- or sk-ant- prefix + 32+ chars).',
  },
  {
    name: 'slack_bot_token',
    pattern: /xoxb-[0-9]+-[0-9]+-[A-Za-z0-9]{24,}/,
    description: 'Slack bot token (xoxb-NUM-NUM-OPAQUE).',
  },
  {
    name: 'slack_user_token',
    pattern: /xoxp-[0-9]+-[0-9]+-[0-9]+-[A-Za-z0-9]{32,}/,
    description: 'Slack user token (xoxp-NUM-NUM-NUM-OPAQUE).',
  },
  {
    name: 'aws_access_key_id',
    pattern: /AKIA[0-9A-Z]{16}/,
    description: 'AWS access key id (AKIA + 16 uppercase alphanumerics).',
  },
  {
    name: 'jwt',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/,
    description:
      'JWT (three base64url segments joined by dots; first two start with eyJ).',
  },
  {
    name: 'env_var_assignment_with_long_opaque',
    pattern:
      /[A-Z][A-Z0-9_]+_(?:KEY|TOKEN|SECRET|PASSWORD)\s*[:=]\s*["'`][A-Za-z0-9_+\/=-]{16,}["'`]/,
    description:
      'KEY|TOKEN|SECRET|PASSWORD env-var-style assignment with a 16+ char opaque value (assignment, not bare name).',
  },
];

// ---------------------------------------------------------------------
// Public detection helpers.
// ---------------------------------------------------------------------

export interface SecretValueFinding {
  readonly patternName: string;
  readonly match: string;
  readonly index: number;
}

const TRUNCATE_PREFIX_LENGTH = 8;

function truncateMatch(raw: string): string {
  if (raw.length <= TRUNCATE_PREFIX_LENGTH) {
    return raw;
  }
  return `${raw.slice(0, TRUNCATE_PREFIX_LENGTH)}...`;
}

/**
 * Returns true if the input text contains at least one real-shape
 * secret value. Returns false for honest documentation strings such
 * as bare env var names, URL substrings, or short placeholders.
 */
export function containsLikelySecretValue(text: string): boolean {
  if (typeof text !== 'string' || text.length === 0) {
    return false;
  }
  for (const entry of LIKELY_SECRET_VALUE_PATTERNS) {
    // Build a per-call regex with the global flag so we never share
    // mutable lastIndex state across callers.
    const globalRegex = new RegExp(entry.pattern.source, 'g');
    if (globalRegex.test(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the list of all matches found across every pattern. The
 * `match` field is truncated to a short prefix + ellipsis so we never
 * persist the full secret in test logs or CI output.
 */
export function listLikelySecretFindings(text: string): SecretValueFinding[] {
  const findings: SecretValueFinding[] = [];
  if (typeof text !== 'string' || text.length === 0) {
    return findings;
  }
  for (const entry of LIKELY_SECRET_VALUE_PATTERNS) {
    const globalRegex = new RegExp(entry.pattern.source, 'g');
    let match: RegExpExecArray | null = globalRegex.exec(text);
    while (match !== null) {
      findings.push({
        patternName: entry.name,
        match: truncateMatch(match[0]),
        index: match.index,
      });
      // Guard against zero-width matches creating an infinite loop.
      if (match.index === globalRegex.lastIndex) {
        globalRegex.lastIndex += 1;
      }
      match = globalRegex.exec(text);
    }
  }
  return findings;
}

/**
 * Throws an Error with a structured finding list if the input text
 * contains any likely-secret value. Intended for use inside Jest tests
 * (for example: `assertNoLikelySecretValues(JSON.stringify(response))`).
 */
export function assertNoLikelySecretValues(text: string): void {
  const findings = listLikelySecretFindings(text);
  if (findings.length === 0) {
    return;
  }
  const summary = findings
    .map((f) => `${f.patternName}@${f.index}=${f.match}`)
    .join('; ');
  throw new Error(
    `assertNoLikelySecretValues: ${findings.length} likely-secret value(s) detected: ${summary}`,
  );
}
