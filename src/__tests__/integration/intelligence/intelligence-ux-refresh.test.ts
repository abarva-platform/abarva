// DES4 · Intelligence UX refresh tests.

import { COLORS } from '@/lib/design/abarva-theme';

describe('Intelligence UX refresh · static-source assertions', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const activePath = path.resolve(
    __dirname,
    '../../../components/intelligence/SentinelActivePatterns.tsx',
  );
  const detailPath = path.resolve(
    __dirname,
    '../../../components/intelligence/SentinelPatternDetail.tsx',
  );
  const contentPath = path.resolve(
    __dirname,
    '../../../components/intelligence/SentinelPatternContentPanel.tsx',
  );
  const activeSrc = fs.readFileSync(activePath, 'utf8');
  const detailSrc = fs.readFileSync(detailPath, 'utf8');
  const contentSrc = fs.readFileSync(contentPath, 'utf8');

  it.each([
    ['SentinelActivePatterns', activeSrc],
    ['SentinelPatternDetail', detailSrc],
    ['SentinelPatternContentPanel', contentSrc],
  ])('%s imports the AbarVa theme module', (_name, src) => {
    expect(src).toMatch(/from '@\/lib\/design\/abarva-theme'/);
  });

  it.each([
    ['SentinelActivePatterns', activeSrc],
    ['SentinelPatternDetail', detailSrc],
    ['SentinelPatternContentPanel', contentSrc],
  ])('%s carries the data-abarva-refreshed marker', (_name, src) => {
    expect(src).toMatch(/data-abarva-refreshed="des4"/);
  });

  it.each([
    ['SentinelActivePatterns', activeSrc],
    ['SentinelPatternDetail', detailSrc],
    ['SentinelPatternContentPanel', contentSrc],
  ])('%s no longer hard-codes the retired teal accent', (_name, src) => {
    expect(src).not.toMatch(/#0E9F8C/i);
  });

  it('NAVY (brand accent) is reachable through the theme', () => {
    expect(COLORS.navy.toLowerCase()).toBe('#1b2b5c');
  });
});
