import { readFileSync } from 'node:fs';

describe('Tower date rendering guards', () => {
  const indexSource = readFileSync('src/components/tower/TowerIndexPage.tsx', 'utf8');
  const detailRouteSource = readFileSync('src/app/api/tower/initiative-detail/route.ts', 'utf8');

  it('formats DB date values before rendering inline detail text', () => {
    expect(indexSource).toContain('function formatDateLabel');
    expect(indexSource).toContain("formatDateLabel(decision.decisionDate, 'date pending')");
    expect(indexSource).toContain("formatDateLabel(vendor.renewalDate, 'No renewal date')");
    expect(indexSource).not.toContain("{decision.decisionDate ?? 'date pending'}");
    expect(indexSource).not.toContain("{vendor.renewalDate ?? 'No renewal date'}");
  });

  it('fails soft when supporting detail substrate is unavailable', () => {
    expect(detailRouteSource).toContain("console.warn('[tower initiative detail] supporting substrate unavailable'");
    expect(detailRouteSource).toContain("return NextResponse.json({ ok: false, error: 'Initiative detail unavailable' })");
    expect(detailRouteSource).not.toContain("return NextResponse.json({ ok: false, error: 'Initiative detail not found' }, { status: 404 })");
  });
});
