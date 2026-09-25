export {};

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { DELIVERABLE_MODEL, DELIVERABLE_MAX_TOKENS, deliverableModel } from '../model-policy';

const ROOT = path.join(process.cwd(), 'src/lib/deliverables');
const POLICY_FILE = path.join(ROOT, 'model-policy.ts');
// Matches any Claude model id literal.
const MODEL_LITERAL = /['"`]claude-[a-z0-9.\-]+['"`]/g;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  (function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = path.join(d, entry);
      if (statSync(full).isDirectory()) {
        if (entry === '__tests__' || entry === '__fixtures__') continue;
        walk(full);
      } else if (/\.tsx?$/.test(entry)) out.push(full);
    }
  })(dir);
  return out;
}

describe('deliverable model policy', () => {
  it('names a model from the Claude 5 family or later', () => {
    expect(DELIVERABLE_MODEL).toMatch(/^claude-(opus|sonnet)-5/);
  });

  // The defect this file exists to prevent: opus-4-7 survived on one path for
  // two PRs because five literals were updated and a sixth was not.
  it('is the ONLY place in the deliverables tree that names a model', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(ROOT)) {
      if (file === POLICY_FILE) continue;
      const src = readFileSync(file, 'utf8');
      const hits = src.match(MODEL_LITERAL);
      if (hits) offenders.push(`${path.relative(ROOT, file)}: ${[...new Set(hits)].join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('no deliverable path is left on a pre-5 model', () => {
    const stale: string[] = [];
    for (const file of sourceFiles(ROOT)) {
      const src = readFileSync(file, 'utf8');
      for (const m of src.match(MODEL_LITERAL) ?? []) {
        if (/claude-(opus|sonnet)-[0-4]/.test(m)) stale.push(`${path.relative(ROOT, file)}: ${m}`);
      }
    }
    expect(stale).toEqual([]);
  });

  it('honours an env override for a controlled rollback, and falls back cleanly', () => {
    const prev = process.env.ABARVA_DELIVERABLE_MODEL;
    process.env.ABARVA_DELIVERABLE_MODEL = 'claude-opus-4-8';
    expect(deliverableModel()).toBe('claude-opus-4-8');
    process.env.ABARVA_DELIVERABLE_MODEL = '   ';
    expect(deliverableModel()).toBe(DELIVERABLE_MODEL);
    delete process.env.ABARVA_DELIVERABLE_MODEL;
    expect(deliverableModel()).toBe(DELIVERABLE_MODEL);
    if (prev !== undefined) process.env.ABARVA_DELIVERABLE_MODEL = prev;
  });

  it('keeps the token budgets where a reader can find them', () => {
    expect(DELIVERABLE_MAX_TOKENS.major).toBe(32_000);
    expect(DELIVERABLE_MAX_TOKENS.minor).toBe(4_000);
  });
});
