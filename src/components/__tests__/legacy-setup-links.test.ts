import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  resolvePathStatus,
  SHARED_PATH_DISPOSITIONS,
} from '@/lib/qa/path-disposition';

/**
 * This guard walked a list of three surfaces and read each one.
 *
 * The legacy surface sunset at 0c6a86c51 deleted the first two, so the read
 * threw on iteration one — and the third surface, which still exists, was
 * never checked again. A red test is visible; a red test that also silently
 * stops checking everything after it is not, and that is what this was. The
 * `/setup` link it guards against could have come back in the surviving
 * surface at any point since and nothing would have said so.
 *
 * The list is now partitioned before anything is read: surfaces that exist
 * are checked, and surfaces that are gone must say why, through the same
 * register the QA verifiers use. An absence nobody has declared fails here
 * rather than taking the rest of the run down with it.
 */

const SURFACES = [
  'src/components/intelligence/decision/IntelligenceEmptyState.tsx',
  'src/components/intelligence/IntelligenceLensTabs.tsx',
  'src/components/source/SourceEmptyState.tsx',
] as const;

const present = SURFACES.filter((f) => existsSync(join(process.cwd(), f)));
const absent = SURFACES.filter((f) => !existsSync(join(process.cwd(), f)));

describe('legacy setup links', () => {
  it('has at least one surface left to check', () => {
    // Without this the suite passes by having nothing to do. Every surface
    // being deleted is a real state, and it should be loud rather than green.
    expect(present.length).toBeGreaterThan(0);
  });

  it.each(present)('%s routes setup CTAs through canonical Admin setup', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    expect(source).toContain('/admin/setup');
    expect(source).not.toContain('href="/setup"');
    expect(source).not.toContain("href: '/setup'");
    expect(source).not.toContain('href: "/setup"');
  });

  it('still names the surfaces the sunset removed', () => {
    // Without this the file goes green by deleting the two dead names, which
    // is the one repair T-049 rules out: the loss has to stay visible, and a
    // list that quietly forgets what it used to cover is how a surface stops
    // being guarded without anyone deciding to stop guarding it.
    //
    // Proven necessary: dropping both names from SURFACES left all cases
    // passing until this one existed.
    expect(SURFACES).toContain(
      'src/components/intelligence/decision/IntelligenceEmptyState.tsx',
    );
    expect(SURFACES).toContain('src/components/intelligence/IntelligenceLensTabs.tsx');
    expect(absent.length).toBe(2);
  });

  it('every surface that is gone says which commit removed it', () => {
    // The T-049 shape: mark it removed rather than deleting the entry, so the
    // loss stays visible. Deleting the two dead names would have made this
    // file green and taken the record of the sunset with it.
    for (const file of absent) {
      const resolved = resolvePathStatus(
        file,
        false,
        SHARED_PATH_DISPOSITIONS,
        'SHARED_PATH_DISPOSITIONS in src/lib/qa/path-disposition.ts',
      );
      expect(resolved.status).toBe('removed');
      expect(resolved.detail).toContain('0c6a86c51');
    }
  });

  it('an absence nobody declared is a failure, not a skipped surface', () => {
    // The negative control. Without it the case above is satisfied by an
    // empty `absent` list, and the partition could quietly swallow a file
    // that went missing for no recorded reason.
    const resolved = resolvePathStatus(
      'src/components/source/SurfaceNobodyRemoved.tsx',
      false,
      SHARED_PATH_DISPOSITIONS,
      'SHARED_PATH_DISPOSITIONS in src/lib/qa/path-disposition.ts',
    );
    expect(resolved.status).toBe('fail');
  });
});
