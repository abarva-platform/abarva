// DES5 · AI Control Tower UX refresh tests.

import { COLORS } from '@/lib/design/abarva-theme';

describe('Tower UX refresh · static-source assertions', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const sourcePath = path.resolve(
    __dirname,
    '../../../components/tower/ProgramPressureCards.tsx',
  );
  const src = fs.readFileSync(sourcePath, 'utf8');

  it('ProgramPressureCards imports the AbarVa theme module', () => {
    expect(src).toMatch(/from '@\/lib\/design\/abarva-theme'/);
  });

  it('ProgramPressureCards carries the data-abarva-refreshed marker', () => {
    expect(src).toMatch(/data-abarva-refreshed="des5"/);
  });

  it('teal accent is no longer hard-coded', () => {
    expect(src).not.toMatch(/#0E9F8C/i);
  });

  it('NAVY (brand accent) is reachable through the theme', () => {
    expect(COLORS.navy.toLowerCase()).toBe('#1b2b5c');
  });
});
