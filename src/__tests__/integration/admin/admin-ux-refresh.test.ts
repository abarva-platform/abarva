// ADM5 · Admin Setup / Dataset Explorer UX refresh tests.

import { COLORS } from '@/lib/design/abarva-theme';

describe('Admin UX refresh · static-source assertions', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path');

  const setupPath = path.resolve(
    __dirname,
    '../../../components/admin/StewardSetupControlCenter.tsx',
  );
  const explorerPath = path.resolve(
    __dirname,
    '../../../components/admin/DatasetExplorerPanel.tsx',
  );
  const setupSrc = fs.readFileSync(setupPath, 'utf8');
  const explorerSrc = fs.readFileSync(explorerPath, 'utf8');

  it.each([
    ['StewardSetupControlCenter', setupSrc],
    ['DatasetExplorerPanel', explorerSrc],
  ])('%s imports the AbarVa theme module', (_name, src) => {
    expect(src).toMatch(/from '@\/lib\/design\/abarva-theme'/);
  });

  it.each([
    ['StewardSetupControlCenter', setupSrc],
    ['DatasetExplorerPanel', explorerSrc],
  ])('%s carries the data-abarva-refreshed marker', (_name, src) => {
    expect(src).toMatch(/data-abarva-refreshed="adm5"/);
  });

  it.each([
    ['StewardSetupControlCenter', setupSrc],
    ['DatasetExplorerPanel', explorerSrc],
  ])('%s no longer hard-codes the retired teal accent', (_name, src) => {
    expect(src).not.toMatch(/#0E9F8C/i);
  });

  it('NAVY (brand accent) is reachable through the theme', () => {
    expect(COLORS.navy.toLowerCase()).toBe('#1b2b5c');
  });

  it('Modules block (which carries the Build Progress route) is preserved in StewardSetupControlCenter', () => {
    // The Build Progress link is data-driven via the modules array
    // from buildStewardSetupReadinessView; the file references the
    // AdminModuleReadiness type and renders modules through
    // RecommendedActionsBlock.
    expect(setupSrc).toMatch(/AdminModuleReadiness/);
    expect(setupSrc).toMatch(/RecommendedActionsBlock/);
    expect(setupSrc).toMatch(/modules\b/);
  });
});
