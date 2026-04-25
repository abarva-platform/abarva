// DES3 · Programs UX refresh tests.

import { COLORS } from '@/lib/design/abarva-theme';

describe('Programs UX refresh · static-source assertions', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const indexPath = path.resolve(
    __dirname,
    '../../../components/programs/ProgramsCanonicalIndex.tsx',
  );
  const detailPath = path.resolve(
    __dirname,
    '../../../components/programs/ProgramCanonicalDetail.tsx',
  );
  const indexSrc = fs.readFileSync(indexPath, 'utf8');
  const detailSrc = fs.readFileSync(detailPath, 'utf8');

  it('ProgramsCanonicalIndex imports the AbarVa theme module', () => {
    expect(indexSrc).toMatch(/from '@\/lib\/design\/abarva-theme'/);
  });

  it('ProgramCanonicalDetail imports the AbarVa theme module', () => {
    expect(detailSrc).toMatch(/from '@\/lib\/design\/abarva-theme'/);
  });

  it('ProgramsCanonicalIndex carries the data-abarva-refreshed marker', () => {
    expect(indexSrc).toMatch(/data-abarva-refreshed="des3"/);
  });

  it('ProgramCanonicalDetail carries the data-abarva-refreshed marker', () => {
    expect(detailSrc).toMatch(/data-abarva-refreshed="des3"/);
  });

  it('teal accent is no longer hard-coded in either file', () => {
    expect(indexSrc).not.toMatch(/#0E9F8C/i);
    expect(detailSrc).not.toMatch(/#0E9F8C/i);
  });

  it('NAVY (brand accent) is reachable through the theme', () => {
    expect(COLORS.navy.toLowerCase()).toBe('#1b2b5c');
  });
});
