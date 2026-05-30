// Atlas Fix A (2026-05-30) — P0 cross-tenant leak invariants for
// /api/tower/synthesis. Static-grep guards against the regressions
// flagged by the CXO-quality audit
// (docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md).
//
// What this catches:
//   - The route NO LONGER imports APEX_RETAIL_PROGRAM_INSTANCES directly.
//   - The route NO LONGER ships the hardcoded "Apex Retail Group" string
//     in the synthesis user message.
//   - The Apex demo fixture flows through `loadTenantTowerPortfolio` so
//     the gating logic (tenant key + feature flag) cannot be bypassed.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const routeSrc = readFileSync(join(__dirname, 'route.ts'), 'utf8');

// Strip comments — historical references to Apex in commentary are fine,
// it's runtime code paths we're locking down.
const routeCode = routeSrc
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('Tower synthesis route — P0 cross-tenant invariants', () => {
  it('does NOT import APEX_RETAIL_PROGRAM_INSTANCES directly', () => {
    expect(routeCode).not.toMatch(/APEX_RETAIL_PROGRAM_INSTANCES/);
  });

  it('does NOT contain the hardcoded "Apex Retail Group" string', () => {
    expect(routeCode).not.toMatch(/Apex Retail Group/);
  });

  it('does NOT contain any literal "Apex Retail" reference in runtime code', () => {
    // Belt-and-braces — even "for Apex Retail:" without "Group" would
    // leak the tenant identity into the model context.
    expect(routeCode).not.toMatch(/Apex Retail/);
  });

  it('loads the portfolio via the tenant-scoped helper', () => {
    expect(routeCode).toMatch(/loadTenantTowerPortfolio/);
  });

  it('caches synthesis under a tenant-scoped key', () => {
    // The cache key must include the tenant. Otherwise a cached Apex
    // synthesis could be served to a different tenant.
    expect(routeCode).toMatch(/clientKey/);
    expect(routeCode).toMatch(/cacheKey/);
  });

  it('reads the active client display name from the tenancy seam', () => {
    expect(routeCode).toMatch(/getActiveClientRow/);
  });
});
