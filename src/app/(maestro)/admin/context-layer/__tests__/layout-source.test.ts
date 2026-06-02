import { readFileSync } from 'node:fs';
import path from 'node:path';

const layoutSource = readFileSync(
  path.join(process.cwd(), 'src/app/(maestro)/admin/context-layer/layout.tsx'),
  'utf8',
);

const pageFiles = [
  'src/app/(maestro)/admin/context-layer/page.tsx',
  'src/app/(maestro)/admin/context-layer/templates/page.tsx',
  'src/app/(maestro)/admin/context-layer/uploads/page.tsx',
  'src/app/(maestro)/admin/context-layer/approval-queue/page.tsx',
  'src/app/(maestro)/admin/context-layer/syncs/page.tsx',
  'src/app/(maestro)/admin/context-layer/evidence-map/page.tsx',
] as const;

describe('admin context-layer shell contract', () => {
  it('wraps every context-layer page in the canonical Admin shell', () => {
    expect(layoutSource).toContain('AdminContextLayerLayout');
    expect(layoutSource).toContain('resolveAdminTenant');
    expect(layoutSource).toContain('<AdminCanonShellV2 tenantName={tenant.tenantName}>');
  });

  it('keeps context-layer pages sized for the Admin scroll frame', () => {
    for (const file of pageFiles) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source).toContain("minHeight: '100%'");
      expect(source).not.toContain("minHeight: '100vh'");
    }
  });
});
