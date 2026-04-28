/**
 * Tests for the `formatTopPatternsRow` helper used by TowerTopPatternsTile.
 *
 * Pure helper — no React, no rendering. We only verify:
 *   1. A known lifecycle pattern id resolves to its doctrine title.
 *   2. An unknown id falls back to the raw id, and the count label respects
 *      English plural agreement (`1 event` vs `N events`).
 */

import { formatTopPatternsRow } from '../TowerTopPatternsTile';

describe('formatTopPatternsRow', () => {
  test('resolves a known lifecycle pattern id to its doctrine title', () => {
    const row = formatTopPatternsRow({ patternId: 'PAT-SRC-AMS-001', count: 5 });
    expect(row.patternId).toBe('PAT-SRC-AMS-001');
    expect(row.title).toBe('Application Managed Services (AMS) Lifecycle');
    expect(row.countLabel).toBe('5 events');
  });

  test('falls back to the raw id when the pattern is unknown and singularises the count label', () => {
    const row = formatTopPatternsRow({ patternId: 'PAT-UNKNOWN-XYZ', count: 1 });
    expect(row.patternId).toBe('PAT-UNKNOWN-XYZ');
    expect(row.title).toBe('PAT-UNKNOWN-XYZ');
    expect(row.countLabel).toBe('1 event');
  });
});
