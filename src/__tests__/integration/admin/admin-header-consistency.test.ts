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
    expect(read(adminHome)).toContain('ADMIN_PAGE_HEADER_STYLES.title');
    expect(read(customerAdmin)).toContain('ADMIN_PAGE_HEADER_STYLES.title');
  });
});
