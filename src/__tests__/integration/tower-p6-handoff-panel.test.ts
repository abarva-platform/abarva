import { readFileSync } from 'node:fs';

describe('Tower legacy P6 handoff panel retirement', () => {
  it('does not keep the old P6 handoff panel on the primary Tower route', () => {
    const pageSource = readFileSync('src/app/(maestro)/tower/page.tsx', 'utf8');

    expect(pageSource).toContain('TowerCommandCenterAvaShell');
    expect(pageSource).not.toContain('TowerMainSubmenuStrip');
    expect(pageSource).not.toContain('tower-source-handoff-panel');
    expect(pageSource).not.toContain('tower-setup-initiatives-panel');
    expect(pageSource).not.toContain('resolveTowerTab');
  });
});
