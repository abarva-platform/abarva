import {
  ACTIVE_ROUTE_OWNERSHIP_MAP,
  TARGET_ROUTE_PATTERNS,
  buildActiveRouteOwnershipMap,
} from '@/lib/qa/active-route-ownership-map';

describe('active route ownership map', () => {
  it('covers every target route pattern', () => {
    const map = buildActiveRouteOwnershipMap();
    const patterns = new Set(map.map((entry) => entry.routePattern));
    for (const target of TARGET_ROUTE_PATTERNS) {
      expect(patterns.has(target)).toBe(true);
    }
  });

  it('contains canonical shell and remediation for each route', () => {
    const map = buildActiveRouteOwnershipMap();
    for (const entry of map) {
      expect(entry.expectedCanonicalShell.trim().length).toBeGreaterThan(0);
      expect(entry.requiredRemediation.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses only valid compliance states', () => {
    const allowed = new Set(['unknown', 'legacy', 'partial', 'compliant']);
    for (const entry of ACTIVE_ROUTE_OWNERSHIP_MAP) {
      expect(allowed.has(entry.compliance)).toBe(true);
    }
  });

  it('produces deterministic output order', () => {
    const first = buildActiveRouteOwnershipMap();
    const second = buildActiveRouteOwnershipMap();
    expect(first).toEqual(second);
    expect(first.map((entry) => entry.routePattern)).toEqual([...TARGET_ROUTE_PATTERNS]);
  });
});

