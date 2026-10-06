import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin page header consistency', () => {
  const headerStyles = 'src/components/admin/admin-page-header-styles.ts';
  const editorialCanvas = 'src/components/admin/EditorialCanvas.tsx';
  const adminHome = 'src/app/(maestro)/admin/page.tsx';
  const customerAdmin = 'src/app/(maestro)/admin/customer/page.tsx';

  it('locks a restrained shared admin title scale', () => {
    const source = read(headerStyles);

    expect(source).toContain('TYPOGRAPHY.serif');
    expect(source).toContain('fontSize: 40');
    expect(source).toContain('fontWeight: 600');
    expect(source).toContain('letterSpacing: 0');
    expect(source).not.toContain("letterSpacing: '-");
  });

  it('routes shared header treatment through reusable styles', () => {
    expect(read(editorialCanvas)).toContain('ADMIN_PAGE_HEADER_STYLES.title');
    expect(read(customerAdmin)).toContain('ADMIN_PAGE_HEADER_STYLES.title');
  });

  // 2026-09-19 (T-032) - the third subject of the case above used to be
  // /admin, and it was stale. fb561b85e ("make setup the canonical admin
  // experience") re-pointed the route at AdminSetupExperience rendered through
  // AppShell, and that surface carries its own chrome rather than an
  // ADMIN_PAGE_HEADER_STYLES title. Asserting the shared style on a page that
  // no longer renders an admin page header tests nothing. What the case is
  // protecting is that no admin route invents a bespoke page title, so that is
  // what is asserted here: /admin delegates, and does not grow a header of its
  // own.
  it('leaves /admin delegating its chrome instead of inventing a page header', () => {
    const source = read(adminHome);

    expect(source).toContain('AdminSetupExperience');
    expect(source).toContain('AppShell');
    expect(source).not.toContain('<h1');
    expect(source).not.toMatch(/fontSize:\s*40/);
  });
});
