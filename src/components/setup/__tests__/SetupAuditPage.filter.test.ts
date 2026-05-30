/**
 * SetupAuditPage source-filter helpers · Wave 1 PR-6
 *
 * Light-touch test for the `?source=` query param wiring without
 * pulling in the full AppShell / SubNavStrip render tree (those are
 * client-only and not the contract under test here).
 *
 * Validates:
 *  - `isAuditSourceFilter` rejects unknown / falsy values.
 *  - `isAuditSourceFilter` accepts every TrustSpine source label.
 */

import { isAuditSourceFilter } from '../SetupAuditPage';

describe('isAuditSourceFilter', () => {
  it('accepts every TrustSpine source label', () => {
    for (const source of [
      'substrate',
      'auth',
      'policy',
      'connector',
      'invite',
      'approval',
    ]) {
      expect(isAuditSourceFilter(source)).toBe(true);
    }
  });

  it('rejects unknown values', () => {
    expect(isAuditSourceFilter('')).toBe(false);
    expect(isAuditSourceFilter(null)).toBe(false);
    expect(isAuditSourceFilter(undefined)).toBe(false);
    expect(isAuditSourceFilter('engineering')).toBe(false);
    expect(isAuditSourceFilter('SUBSTRATE')).toBe(false);
  });
});
