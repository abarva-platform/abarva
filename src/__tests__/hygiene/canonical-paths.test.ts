/**
 * CLEAN1-4 canonical-path drift guard.
 *
 * Asserts that no TypeScript/TSX file in src/ imports from retired directories.
 * These directories were collapsed in CLEAN1-2 and must not be recreated.
 *
 * If this test fails, update your import to use the canonical path shown below:
 *   components/agents/* → @/components/agent/
 *   components/brand/*  → @/components/abarva/
 *   components/identity/* → @/components/abarva/
 *   lib/agents/*        → @/lib/agent/
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

const RETIRED_PATTERNS = [
  { pattern: /['"]([@./]*components\/agents)['"\/]/, replacement: '@/components/agent/' },
  { pattern: /['"]([@./]*components\/brand)['"\/]/, replacement: '@/components/abarva/' },
  { pattern: /['"]([@./]*components\/identity)['"\/]/, replacement: '@/components/abarva/' },
  { pattern: /['"]([@./]*lib\/agents)['"\/]/, replacement: '@/lib/agent/' },
];

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      // Skip the hygiene test dir itself to avoid false positive
      if (entry === 'hygiene') continue;
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('canonical-path drift guard (CLEAN1-4)', () => {
  const allFiles = collectTsFiles(SRC_DIR);

  for (const { pattern, replacement } of RETIRED_PATTERNS) {
    const retiredPath = pattern.source.match(/components\/\w+|lib\/\w+/)?.[0] ?? pattern.source;

    test(`no file imports from retired path matching ${retiredPath}`, () => {
      const violations: string[] = [];

      for (const file of allFiles) {
        const content = readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i]) && lines[i].includes('import')) {
            violations.push(`${file}:${i + 1} — use ${replacement} instead`);
          }
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Found ${violations.length} import(s) from retired path. Fix by updating to canonical:\n` +
          violations.join('\n')
        );
      }
    });
  }
});
