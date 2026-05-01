import { readFileSync } from 'fs';
import { join } from 'path';

const appRailSource = readFileSync(
  join(process.cwd(), 'src/components/shell/AppRail.tsx'),
  'utf8',
);

describe('AppRail navigation contract', () => {
  it('exposes Home as a first-class authenticated app rail item', () => {
    expect(appRailSource).toContain("{ key: 'home'");
    expect(appRailSource).toContain("label: 'Home'");
    expect(appRailSource).toContain("href: '/home'");
  });

  it('detects /home and /dashboard as the Home surface', () => {
    expect(appRailSource).toContain("pathname === '/home'");
    expect(appRailSource).toContain("pathname.startsWith('/home/')");
    expect(appRailSource).toContain("pathname === '/dashboard'");
  });
});
