import { readFileSync } from 'node:fs';

describe('Tower date rendering guards', () => {
  const detailRouteSource = readFileSync('src/app/api/tower/initiative-detail/route.ts', 'utf8');

  it('fails soft when supporting detail substrate is unavailable', () => {
    expect(detailRouteSource).toContain("console.warn('[tower initiative detail] supporting substrate unavailable'");
    expect(detailRouteSource).toContain("return NextResponse.json({ ok: false, error: 'Initiative detail unavailable' })");
    expect(detailRouteSource).not.toContain("return NextResponse.json({ ok: false, error: 'Initiative detail not found' }, { status: 404 })");
  });
});
