import fs from 'node:fs';
import path from 'node:path';

function read(filePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

describe('DESROUTE3 admin shell enforcement', () => {
  const adminRoute = 'src/app/(maestro)/platform/admin/page.tsx';
  const architectureRoute = 'src/app/(maestro)/platform/admin/architecture/page.tsx';
  const productionRoute = 'src/app/(maestro)/platform/admin/production-readiness/page.tsx';
  const buildProgressRoute = 'src/app/(maestro)/platform/admin/build-progress/page.tsx';

  it('admin route files use AdminCanonShell or an approved canonical wrapper', () => {
    [adminRoute, architectureRoute, productionRoute, buildProgressRoute].forEach((file) => {
      const source = read(file);
      expect(source).toContain('AdminCanonShell');
    });
  });

  it('active admin route avoids known legacy rail shell import', () => {
    const source = read(adminRoute);
    expect(source).not.toContain('StewardAdminRail');
  });

  it('architecture and production readiness routes continue to exist', () => {
    expect(fs.existsSync(path.join(process.cwd(), architectureRoute))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), productionRoute))).toBe(true);
  });

  it('admin routes include canon workflow orientation markers', () => {
    const source = read(adminRoute);
    expect(source).toContain("primaryAgent: 'steward'");
    expect(source).toContain('pageQuestion');
    expect(source).toContain('recommendedNextAction');
    expect(source.toLowerCase()).toContain('deterministic');
  });

  it('does not introduce new auth libraries in admin route files', () => {
    const productionSource = read(productionRoute);
    const buildSource = read(buildProgressRoute);
    expect(productionSource).toContain("@clerk/nextjs/server");
    expect(buildSource).toContain("@clerk/nextjs/server");
    expect(productionSource).not.toContain('next-auth');
    expect(buildSource).not.toContain('next-auth');
  });
});

