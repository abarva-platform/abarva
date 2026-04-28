/**
 * Cascade formatter tests — REASON-31
 *
 * Deterministic: same inputs always produce the same outputs.
 */

import {
  formatCascadeRow,
  severityDotToken,
  severityAriaLabel,
  LINK_TYPE_LABEL,
} from '@/lib/reasoning/cascade-formatters';
import type { CascadeImpact } from '@/lib/reasoning/types';

const baseImpact: CascadeImpact = {
  sourceInstanceId: 'SRC-AMS-2026',
  targetInstanceId: 'APX-CDP-2026',
  linkType: 'unblocks',
  impact: 'AMS award unblocks APX-CDP-2026 P3 Design gate',
  severity: 'blocking',
  impactSeverity: 'high',
  targetInstanceName: 'Apex Retail CDP Activation',
};

describe('severityDotToken', () => {
  test('maps high → RUST_TEXT, medium → AMBER_DOT, low/undefined → INK_MUTED', () => {
    expect(severityDotToken('high')).toBe('RUST_TEXT');
    expect(severityDotToken('medium')).toBe('AMBER_DOT');
    expect(severityDotToken('low')).toBe('INK_MUTED');
    expect(severityDotToken(undefined)).toBe('INK_MUTED');
  });
});

describe('severityAriaLabel', () => {
  test('returns a stable human-readable label per severity tier', () => {
    expect(severityAriaLabel('high')).toBe('High impact severity');
    expect(severityAriaLabel('medium')).toBe('Medium impact severity');
    expect(severityAriaLabel('low')).toBe('Low impact severity');
    expect(severityAriaLabel(undefined)).toBe('Impact severity unknown');
  });
});

describe('formatCascadeRow', () => {
  test('formats a high-severity blocking row with target name', () => {
    const row = formatCascadeRow(baseImpact);
    expect(row).toEqual({
      source: 'SRC-AMS-2026',
      target: 'APX-CDP-2026 · Apex Retail CDP Activation',
      linkLabel: 'unblocks',
      severityLabel: 'Blocking',
      severityDotToken: 'RUST_TEXT',
      description: 'AMS award unblocks APX-CDP-2026 P3 Design gate',
    });
  });

  test('omits the target-name suffix when the impact has no targetInstanceName', () => {
    const { targetInstanceName: _omit, ...rest } = baseImpact;
    void _omit;
    const row = formatCascadeRow(rest);
    expect(row.target).toBe('APX-CDP-2026');
  });

  test('uses dependency link label and gray dot for low-severity informational rows', () => {
    const row = formatCascadeRow({
      ...baseImpact,
      linkType: 'depends-on',
      severity: 'informational',
      impactSeverity: 'low',
    });
    expect(row.linkLabel).toBe(LINK_TYPE_LABEL['depends-on']);
    expect(row.severityLabel).toBe('Informational');
    expect(row.severityDotToken).toBe('INK_MUTED');
  });

  test('handles missing impact text by emitting an empty description string', () => {
    const row = formatCascadeRow({ ...baseImpact, impact: '' });
    expect(row.description).toBe('');
  });
});
