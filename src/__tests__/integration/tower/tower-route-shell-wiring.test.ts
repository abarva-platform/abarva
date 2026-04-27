/**
 * TOWER1 — Control Tower Route Shell Wiring
 * Deterministic filesystem checks; no jsdom, no network, no model calls.
 */

import * as fs from 'fs';
import * as path from 'path';

// __dirname = src/__tests__/integration/tower
// ../../../  = src/
const SRC_ROOT = path.resolve(__dirname, '../../../');

const SHELL_PATH = path.resolve(SRC_ROOT, 'components/tower/TowerRouteShell.tsx');

const ROUTE_PATH = path.resolve(
  SRC_ROOT,
  'app/(maestro)/tenant/[tenantSlug]/tower/page.tsx',
);

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

describe('TOWER1 — Control Tower Route Shell Wiring', () => {
  it('TowerRouteShell.tsx exists', () => {
    expect(fs.existsSync(SHELL_PATH)).toBe(true);
  });

  it('Tower route page file exists', () => {
    expect(fs.existsSync(ROUTE_PATH)).toBe(true);
  });

  it('TowerRouteShell.tsx contains CONTROL TOWER orientation string', () => {
    const content = readFile(SHELL_PATH);
    expect(content).toMatch(/CONTROL TOWER/);
  });

  it('TowerRouteShell.tsx contains Atlas or ATLAS agent label', () => {
    const content = readFile(SHELL_PATH);
    expect(content).toMatch(/Atlas|ATLAS/);
  });

  it('TowerRouteShell.tsx contains Deterministic caveat', () => {
    const content = readFile(SHELL_PATH);
    expect(content).toMatch(/Deterministic/);
  });

  it('TowerRouteShell.tsx does NOT contain #14B8A6', () => {
    const content = readFile(SHELL_PATH);
    expect(content).not.toMatch(/#14B8A6/i);
  });

  it('TowerRouteShell.tsx does NOT reference Ask Atlas as primary affordance', () => {
    const content = readFile(SHELL_PATH);
    // Ask Atlas must not appear rendered as a primary button in the shell orientation strip.
    // Simple substring checks are sufficient — the shell renders plain JSX without dynamic button labels.
    const hasAskAtlasButton = content.includes('>Ask Atlas<') || content.includes(">Ask Atlas<");
    expect(hasAskAtlasButton).toBe(false);
  });
});
