// Northstar-specific control-plane purity regression.
//
// Per the 2026-05-26 architectural review: the app control plane (src/lib,
// src/app, src/components, excluding the canonical-registry allowlist and
// the src/data/** tenant-tagged data-plane subtree) must contain ZERO
// hardcoded references to the Northstar tenant. This is the cleanest
// example of the control-plane / data-plane segmentation discipline —
// Northstar is the newest composite and the only one whose control-plane
// debt is still at zero. Lock it in.
//
// Apex Retail (663 hits), Meridian Health (77), First Capital (57),
// Heliara (204), Arcturus Financial (1) all carry
// existing debt. Those tenants are policed via the baseline-diff in
// `scripts/audit/control-plane-tenant-purity.mjs` (run via
// `npm run audit:control-plane-purity:check`). This test exists because
// Northstar is at zero today and should stay there — a hard floor, not a
// soft ratchet.

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../..');

const NORTHSTAR_TERMS = [
  'Northstar Clinical',
  'Northstar MedTech',
];

// Mirror the allowlist from scripts/audit/control-plane-tenant-purity.mjs.
const FILE_ALLOWLIST = new Set<string>([
  'src/lib/client-config.ts',
  'src/lib/active-client.ts',
  'src/lib/auth/cxo-personas.ts',
  'src/lib/demo/demo-dataset-registry.ts',
  'src/lib/admin/release-ledger.ts',
  'src/lib/knowledge/synthetic-datasets.ts',
  'src/app/(maestro)/platform/admin/approvals/page.tsx',
  'src/app/(maestro)/platform/admin/data-governance/page.tsx',
]);

const PATH_ALLOWLIST_PREFIXES = [
  'src/data/',
  'src/lib/demo-data/',
  'src/lib/knowledge-corpus/fixtures/',
  'src/__tests__/',
  'src/__mocks__/',
  'src/exports-shared/__mocks__/',
];

const FILENAME_ALLOWLIST_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];

function isAllowlistedFile(relPath: string): boolean {
  if (FILE_ALLOWLIST.has(relPath)) return true;
  if (PATH_ALLOWLIST_PREFIXES.some((p) => relPath.startsWith(p))) return true;
  if (FILENAME_ALLOWLIST_SUFFIXES.some((s) => relPath.endsWith(s))) return true;
  if (relPath.includes('/__tests__/')) return true;
  if (relPath.includes('/__mocks__/')) return true;
  return false;
}

function* walk(rootRel: string): Generator<{ abs: string; rel: string }> {
  const root = path.join(REPO_ROOT, rootRel);
  if (!fs.existsSync(root)) return;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
        stack.push(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) continue;
      const rel = path.relative(REPO_ROOT, abs);
      yield { abs, rel };
    }
  }
}

describe('Control-plane tenant purity — Northstar', () => {
  it('keeps Northstar hardcoded references at zero across src/lib, src/app, src/components', () => {
    const hits: Array<{ rel: string; term: string; count: number }> = [];
    for (const root of ['src/lib/', 'src/app/', 'src/components/']) {
      for (const { abs, rel } of walk(root)) {
        if (isAllowlistedFile(rel)) continue;
        const contents = fs.readFileSync(abs, 'utf8');
        for (const term of NORTHSTAR_TERMS) {
          const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          const re = new RegExp(escaped, 'g');
          const matches = contents.match(re);
          if (matches && matches.length > 0) {
            hits.push({ rel, term, count: matches.length });
          }
        }
      }
    }

    if (hits.length > 0) {
      const summary = hits
        .map((h) => `  ${h.rel} — "${h.term}" × ${h.count}`)
        .join('\n');
      throw new Error(
        `Northstar tenant strings found in control-plane code. Move them to ` +
          `datasets/northstar-clinical-tech-synthetic-v1/, the Supabase corpus, ` +
          `or src/lib/client-config.ts (canonical registry) instead.\n${summary}`,
      );
    }
    expect(hits).toEqual([]);
  });
});
