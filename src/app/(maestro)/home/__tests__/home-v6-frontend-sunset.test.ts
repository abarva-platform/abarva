import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('/home V6 frontend sunset guard', () => {
  it('renders the V6 EnterpriseLandscapeHome route and does not reattach legacy HomeSurface', () => {
    const pageSource = readFileSync(path.join(process.cwd(), 'src/app/(maestro)/home/page.tsx'), 'utf8');
    const legacySource = readFileSync(path.join(process.cwd(), 'src/components/home/HomeSurface.tsx'), 'utf8');

    expect(pageSource).toContain('EnterpriseLandscapeHome');
    expect(pageSource).not.toContain('HomeSurface');
    expect(legacySource).toContain('SUNSET 2026-06-28');
  });
});
