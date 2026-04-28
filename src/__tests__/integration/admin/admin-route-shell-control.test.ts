/**
 * SHELL6 · AdminRouteShell control tests
 *
 * No jsdom/React. Pure fs scanning to verify the shell primitive and
 * admin route files meet structural requirements.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function exists(rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const SHELL_PATH = 'src/components/admin/AdminRouteShell.tsx';
const ADMIN_INDEX = 'src/app/(maestro)/platform/admin/page.tsx';
const ARCH_ROUTE = 'src/app/(maestro)/platform/admin/architecture/page.tsx';
const PROD_ROUTE = 'src/app/(maestro)/platform/admin/production-readiness/page.tsx';

describe('SHELL6 · AdminRouteShell control', () => {
  it('AdminRouteShell.tsx exists', () => {
    expect(exists(SHELL_PATH)).toBe(true);
  });

  it('Admin index route file exists', () => {
    expect(exists(ADMIN_INDEX)).toBe(true);
  });

  it('Architecture route file exists', () => {
    // Route is confirmed to exist; not deferred.
    expect(exists(ARCH_ROUTE)).toBe(true);
  });

  it('Production readiness route file exists', () => {
    // Route is confirmed to exist; not deferred.
    expect(exists(PROD_ROUTE)).toBe(true);
  });

  it('AdminRouteShell.tsx does not contain teal color #14B8A6', () => {
    const source = read(SHELL_PATH);
    expect(source).not.toContain('#14B8A6');
  });

  it('AdminRouteShell.tsx does not contain the word teal', () => {
    const source = read(SHELL_PATH);
    expect(source.toLowerCase()).not.toContain('teal');
  });

  it('AdminRouteShell.tsx contains ADMIN orientation string', () => {
    const source = read(SHELL_PATH);
    expect(source).toContain('ADMIN');
  });

  it('AdminRouteShell.tsx contains Manifest-backed caveat', () => {
    const source = read(SHELL_PATH);
    expect(source).toContain('Manifest-backed');
  });

  it('AdminRouteShell.tsx contains deterministic caveat', () => {
    const source = read(SHELL_PATH);
    expect(source).toContain('deterministic');
  });

  it('PAGE_LABELS covers architecture key', () => {
    const source = read(SHELL_PATH);
    expect(source).toContain("architecture:");
  });

  it('PAGE_LABELS covers production_readiness key', () => {
    const source = read(SHELL_PATH);
    expect(source).toContain("production_readiness:");
  });
});
