/**
 * Source language canon — regression guard for the audit's internal-jargon
 * leaks (reports/2026-06-03-source-simplicity-audit/, Tier 3).
 *
 * The buyer-facing Source surface must not expose internal vocabulary. This
 * test locks the specific, high-severity fixes made in milestone M3 so they
 * cannot silently regress, and forward-guards against the dev-command leak the
 * audit caught on a sibling branch.
 *
 * Scope note: this guard is deliberately narrow and precise (no broad term
 * banning, which produces false positives). The pervasive "deterministic"
 * cleanup is a separate, larger pass (M3 pass-2) and is intentionally not
 * enforced here yet.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC_SOURCE = join(process.cwd(), 'src/components/source');

function allTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      out.push(...allTsxFiles(full));
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('Source language canon', () => {
  it('the new-event intake does not label fields with agent codenames', () => {
    const src = readFileSync(
      join(SRC_SOURCE, 'SourceOriginatePage.tsx'),
      'utf8',
    );
    // The leak rendered "Sentinel needs" / "Steward needs" / "Atlas needs" as
    // a field-status chip. The buyer doesn't know who Steward is — use "Needed".
    expect(src).not.toContain('} needs`');
    expect(src).not.toMatch(/\b(Sentinel|Steward|Atlas) needs\b/);
  });

  it('the Document tab empty state uses buyer language, not build jargon', () => {
    const src = readFileSync(
      join(SRC_SOURCE, 'canvas/workspace-tabs/DocumentTab.tsx'),
      'utf8',
    );
    // Empty-state copy must not expose "substrate" / "scaffolded" internals.
    expect(src).not.toContain('No artifacts scaffolded for');
    expect(src).not.toContain('canvas substrate for this stage is empty');
  });

  it('no Source component leaks a developer command into the UI', () => {
    const offenders: string[] = [];
    for (const file of allTsxFiles(SRC_SOURCE)) {
      const src = readFileSync(file, 'utf8');
      if (/\bnpm run\b/.test(src) || /\bdb:backfill\b/.test(src)) {
        offenders.push(file.replace(process.cwd() + '/', ''));
      }
    }
    expect(offenders).toEqual([]);
  });
});
