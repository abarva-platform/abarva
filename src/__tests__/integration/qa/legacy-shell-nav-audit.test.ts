import {
  buildLegacyShellNavAuditReport,
  type LegacyShellAuditCategory,
} from '@/lib/qa/legacy-shell-nav-audit';

describe('buildLegacyShellNavAuditReport', () => {
  it('includes at least one target category and deterministic metadata', () => {
    const report = buildLegacyShellNavAuditReport();
    expect(report.deterministic).toBe(true);
    expect(report.generatedAt).toBe('deterministic-static-audit-v1');
    expect(report.targetCategories.length).toBeGreaterThan(0);
  });

  it('contains banned design patterns and non-empty recommendations', () => {
    const report = buildLegacyShellNavAuditReport();
    expect(report.bannedDesignPatterns).toEqual(
      expect.arrayContaining([
        'dark-toolbar-dominant',
        'teal-heavy-accent',
        'purple-heavy-accent',
      ]),
    );
    report.entries.forEach((entry) => {
      expect(entry.recommendedSafeChange.trim().length).toBeGreaterThan(0);
      expect(entry.canonicalReplacementCandidate.trim().length).toBeGreaterThan(0);
    });
  });

  it('only emits valid categories and performs no destructive behavior', () => {
    const report = buildLegacyShellNavAuditReport();
    const validCategories = new Set<LegacyShellAuditCategory>([
      'legacy_shell_component',
      'legacy_toolbar_pattern',
      'legacy_nav_pattern',
      'legacy_color_pattern',
      'legacy_route_binding',
    ]);

    report.entries.forEach((entry) => {
      expect(validCategories.has(entry.category)).toBe(true);
      expect(entry.finding.toLowerCase()).not.toContain('delete immediately');
    });
  });
});

