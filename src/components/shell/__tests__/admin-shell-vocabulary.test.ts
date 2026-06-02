import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

describe('Admin shell vocabulary', () => {
  it('labels the rail Admin without reviving Setup as visible navigation copy', () => {
    const appRail = readRepoFile('src/components/shell/AppRail.tsx');

    expect(appRail).toContain("label: 'Admin'");
    expect(appRail).toContain("glyph: 'Ad'");
    expect(appRail).toContain('Admin workspace');
    expect(appRail).not.toContain("label: 'Setup'");
    expect(appRail).not.toContain('Setup / Admin');
  });

  it('uses canonical Admin command palette destinations', () => {
    const commandPalette = readRepoFile('src/components/shell/CommandPalette.tsx');

    expect(commandPalette).toContain("label: 'Admin · Overview', path: '/admin'");
    expect(commandPalette).toContain("label: 'Admin · Connectors', path: '/admin/connectors'");
    expect(commandPalette).toContain("label: 'Admin · Users & Access', path: '/admin/users-access'");
    expect(commandPalette).toContain("label: 'Admin · Policies', path: '/admin/policies'");
    expect(commandPalette).toContain("label: 'Admin · Tenant profile', path: '/admin?tab=tenant'");

    expect(commandPalette).not.toContain('Setup ·');
    expect(commandPalette).not.toContain("surface: 'Setup'");
    expect(commandPalette).not.toContain("path: '/admin/users'");
  });
});
