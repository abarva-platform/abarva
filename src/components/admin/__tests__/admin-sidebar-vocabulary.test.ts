import fs from 'node:fs';
import path from 'node:path';

const sidebarSource = fs.readFileSync(
  path.join(process.cwd(), 'src/components/admin/AdminSidebar.tsx'),
  'utf8',
);

describe('AdminSidebar vocabulary', () => {
  it('uses Admin workspace as the visible sidebar header', () => {
    expect(sidebarSource).toContain('Admin workspace');
    expect(sidebarSource).toContain('Control plane · tenant readiness');
    expect(sidebarSource).not.toContain('Setup · Admin');
    expect(sidebarSource).not.toContain('tenant setup &amp; readiness');
  });
});
