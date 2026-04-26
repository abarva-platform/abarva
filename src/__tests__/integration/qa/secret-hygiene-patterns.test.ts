import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  CREATED_FROM_DETERMINISTIC_SECRET_HYGIENE_SEED,
  LIKELY_SECRET_VALUE_PATTERNS,
  assertNoLikelySecretValues,
  containsLikelySecretValue,
  listLikelySecretFindings,
} from '@/lib/qa/secret-hygiene-patterns';

const moduleSourcePath = resolve(
  __dirname,
  '../../../lib/qa/secret-hygiene-patterns.ts',
);

// ---------------------------------------------------------------------
// Positive cases — must flag.
// ---------------------------------------------------------------------

const POSITIVE_CASES: ReadonlyArray<{
  label: string;
  text: string;
  expectedPattern: string;
}> = [
  {
    label: 'github classic PAT (40 chars after prefix)',
    text: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789xy',
    expectedPattern: 'github_pat_classic',
  },
  {
    label: 'real-shape Anthropic key',
    text: 'sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    expectedPattern: 'openai_or_anthropic_key',
  },
  {
    label: 'OpenAI shape key',
    text: 'sk-1234567890abcdefghijklmnopqrstuvwx',
    expectedPattern: 'openai_or_anthropic_key',
  },
  {
    label: 'Slack bot token',
    text: 'xoxb-1234567890-1234567890-AbCdEfGhIjKlMnOpQrStUvWx',
    expectedPattern: 'slack_bot_token',
  },
  {
    label: 'JWT three-segment shape',
    text: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abc123def456ghi789jkl012',
    expectedPattern: 'jwt',
  },
  {
    label: 'KEY=value with real-shape token',
    text: 'GITHUB_STATUS_TOKEN="ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
    expectedPattern: 'github_pat_classic',
  },
  {
    label: 'AWS access key',
    text: 'AKIAIOSFODNN7EXAMPLE',
    expectedPattern: 'aws_access_key_id',
  },
];

// ---------------------------------------------------------------------
// Negative cases — must NOT flag (honest documentation).
// ---------------------------------------------------------------------

const NEGATIVE_CASES: ReadonlyArray<{ label: string; text: string }> = [
  {
    label: 'env var name only, no value',
    text: '"SUPABASE_SERVICE_ROLE_KEY"',
  },
  {
    label: 'URL string in disclaimer',
    text: '"no call to api.github.com is performed"',
  },
  {
    label: 'documentation referencing env var name detected via process.env',
    text: '"GITHUB_STATUS_TOKEN env var name detected via process.env"',
  },
  {
    label: 'liveStatus configuration note',
    text: '"liveStatus is configured when tokens present"',
  },
  {
    label: 'placeholder',
    text: '"<replace-me>"',
  },
  {
    label: 'lab placeholder',
    text: '"lab_only_change_me"',
  },
  {
    label: 'short non-real key shape',
    text: '"sk-not-a-real-key"',
  },
];

describe('QA13 secret-hygiene patterns · public surface', () => {
  it('exports the deterministic createdFrom seed constant', () => {
    expect(CREATED_FROM_DETERMINISTIC_SECRET_HYGIENE_SEED).toBe(
      'deterministic_secret_hygiene_seed',
    );
  });

  it('exports a non-empty pattern catalog with name + pattern + description', () => {
    expect(LIKELY_SECRET_VALUE_PATTERNS.length).toBeGreaterThan(0);
    for (const entry of LIKELY_SECRET_VALUE_PATTERNS) {
      expect(typeof entry.name).toBe('string');
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.pattern).toBeInstanceOf(RegExp);
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('exposes every documented pattern name', () => {
    const names = new Set(LIKELY_SECRET_VALUE_PATTERNS.map((p) => p.name));
    for (const expected of [
      'github_pat_classic',
      'github_pat_fine_grained',
      'github_app_token',
      'vercel_api_token',
      'openai_or_anthropic_key',
      'slack_bot_token',
      'slack_user_token',
      'aws_access_key_id',
      'jwt',
      'env_var_assignment_with_long_opaque',
    ]) {
      expect(names.has(expected)).toBe(true);
    }
  });
});

describe('QA13 containsLikelySecretValue · positives', () => {
  for (const c of POSITIVE_CASES) {
    it(`flags ${c.label}`, () => {
      expect(containsLikelySecretValue(c.text)).toBe(true);
    });
  }
});

describe('QA13 containsLikelySecretValue · negatives', () => {
  for (const c of NEGATIVE_CASES) {
    it(`does not flag ${c.label}`, () => {
      expect(containsLikelySecretValue(c.text)).toBe(false);
    });
  }

  it('returns false for empty string', () => {
    expect(containsLikelySecretValue('')).toBe(false);
  });
});

describe('QA13 listLikelySecretFindings', () => {
  it('returns empty array for honest documentation', () => {
    for (const c of NEGATIVE_CASES) {
      expect(listLikelySecretFindings(c.text)).toEqual([]);
    }
  });

  it('returns at least one finding tagged with the expected pattern for each positive case', () => {
    for (const c of POSITIVE_CASES) {
      const findings = listLikelySecretFindings(c.text);
      expect(findings.length).toBeGreaterThan(0);
      const names = findings.map((f) => f.patternName);
      expect(names).toContain(c.expectedPattern);
    }
  });

  it('truncates the match field so the full secret is never persisted', () => {
    const longSecret = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789xy';
    const findings = listLikelySecretFindings(longSecret);
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      // 8-char prefix + "..." == 11 chars max for any non-trivial match.
      expect(f.match.length).toBeLessThanOrEqual(11);
      expect(f.match.endsWith('...')).toBe(true);
      expect(f.match).not.toBe(longSecret);
    }
  });

  it('records the index where each match begins', () => {
    const text = `prefix:::${'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789xy'}`;
    const findings = listLikelySecretFindings(text);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].index).toBe('prefix:::'.length);
  });
});

describe('QA13 assertNoLikelySecretValues', () => {
  it('does not throw for honest documentation', () => {
    for (const c of NEGATIVE_CASES) {
      expect(() => assertNoLikelySecretValues(c.text)).not.toThrow();
    }
  });

  it('throws an Error containing the finding list when a positive is supplied', () => {
    for (const c of POSITIVE_CASES) {
      let thrown: unknown = null;
      try {
        assertNoLikelySecretValues(c.text);
      } catch (err) {
        thrown = err;
      }
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toContain('assertNoLikelySecretValues');
      expect((thrown as Error).message).toContain(c.expectedPattern);
    }
  });

  it('does not include the full untruncated secret in the thrown message', () => {
    const fullSecret = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789xy';
    let thrown: Error | null = null;
    try {
      assertNoLikelySecretValues(fullSecret);
    } catch (err) {
      thrown = err as Error;
    }
    expect(thrown).not.toBeNull();
    expect(thrown!.message).not.toContain(fullSecret);
  });
});

function stripCommentsAndStrings(src: string): string {
  // Drop block comments first.
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
  // Drop line comments.
  const noLine = noBlock
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  // Drop string literal contents (single, double, and backtick) so
  // that descriptive prose like "OpenAI- or Anthropic-shaped" inside
  // a description string never trips the import / provider check.
  return noLine
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

describe('QA13 module hygiene', () => {
  it('does not import live runtime, model providers, auth, source, or supabase', () => {
    const src = readFileSync(moduleSourcePath, 'utf8');
    const stripped = stripCommentsAndStrings(src);
    expect(stripped).not.toMatch(/from\s+['"]@\/lib\/source\//);
    expect(stripped).not.toMatch(/from\s+['"]@\/lib\/nexus\//);
    expect(stripped).not.toMatch(/from\s+['"]@\/lib\/sentinel\//);
    expect(stripped).not.toMatch(/from\s+['"]@\/lib\/atlas\//);
    expect(stripped).not.toMatch(/from\s+['"]@\/lib\/agent\//);
    expect(stripped).not.toMatch(/from\s+['"]@\/lib\/auth\//);
    expect(stripped).not.toMatch(/from\s+['"]@\/lib\/supabase/);
    expect(stripped).not.toMatch(/from\s+['"]anthropic['"]/i);
    expect(stripped).not.toMatch(/from\s+['"]@anthropic/i);
    expect(stripped).not.toMatch(/from\s+['"]openai['"]/i);
    expect(stripped).not.toMatch(/from\s+['"]@openai/i);
  });

  it('does not use Date.now, Math.random, new Date, or fetch', () => {
    const src = readFileSync(moduleSourcePath, 'utf8');
    const stripped = stripCommentsAndStrings(src);
    expect(stripped).not.toMatch(/Date\.now\s*\(/);
    expect(stripped).not.toMatch(/Math\.random\s*\(/);
    expect(stripped).not.toMatch(/new\s+Date\s*\(/);
    expect(stripped).not.toMatch(/\bfetch\s*\(/);
  });
});
