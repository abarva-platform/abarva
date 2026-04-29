/**
 * cli-report-formatters tests.
 *
 * Deterministic: same inputs always produce the same outputs.
 */

import {
  formatFixtureLintLine,
  formatCoverageLine,
  formatPatternUsageLine,
  formatHealthLine,
  formatRiskLine,
  truncate,
} from '@/lib/reasoning/cli-report-formatters';
import type { FixtureLintSummary } from '@/lib/reasoning/fixture-quality-lint';
import type { CoverageSummary } from '@/lib/reasoning/template-coverage-audit';
import type { PatternUsageRow } from '@/lib/reasoning/pattern-usage-analytics';
import type { InstanceHealth } from '@/lib/reasoning/instance-health';
import type { RiskItem } from '@/lib/reasoning/risk-register';

describe('formatFixtureLintLine', () => {
  test('reports clean corpus when there are no issues', () => {
    const summary: FixtureLintSummary = {
      totalInstances: 12,
      errors: [],
      warnings: [],
    };
    expect(formatFixtureLintLine(summary)).toBe(
      '0 errors, 0 warnings — corpus clean',
    );
  });

  test('reports needs-attention when any errors are present', () => {
    const summary: FixtureLintSummary = {
      totalInstances: 12,
      errors: [
        { instanceId: 'X', severity: 'error', message: 'broken' },
      ],
      warnings: [
        { instanceId: 'Y', severity: 'warning', message: 'odd' },
        { instanceId: 'Z', severity: 'warning', message: 'odd' },
      ],
    };
    expect(formatFixtureLintLine(summary)).toBe(
      '1 error, 2 warnings — needs attention',
    );
  });
});

describe('formatCoverageLine', () => {
  test('renders bound and overall ratios as rounded percentages', () => {
    const bound: CoverageSummary = {
      totalTemplates: 32,
      coveredTemplates: 24,
      coverageRatio: 24 / 32,
    };
    const overall: CoverageSummary = {
      totalTemplates: 64,
      coveredTemplates: 24,
      coverageRatio: 24 / 64,
    };
    expect(formatCoverageLine('Contradictions', bound, overall)).toBe(
      'Contradictions: 75% (24/32) bound, 38% (24/64) overall',
    );
  });

  test('handles empty totals without NaN', () => {
    const empty: CoverageSummary = {
      totalTemplates: 0,
      coveredTemplates: 0,
      coverageRatio: 0,
    };
    expect(formatCoverageLine('Failure modes', empty, empty)).toBe(
      'Failure modes: 0% (0/0) bound, 0% (0/0) overall',
    );
  });
});

describe('formatPatternUsageLine', () => {
  test('pads pattern id and pluralises instance/event counts', () => {
    const row: PatternUsageRow = {
      patternId: 'PAT-SRC-AMS-001',
      patternLabel: 'AMS',
      patternSlug: 'ams',
      family: 'source-event',
      instanceCount: 12,
      instanceIds: [],
      contradictionTemplateCount: 0,
      contradictionTemplatesCovered: 0,
      contradictionCoverageRatio: 0,
      failureModeTemplateCount: 0,
      failureModesCovered: 0,
      failureModeCoverageRatio: 0,
      synthesisEventCount: 0,
      synthesisEventCountLast24h: 0,
      cascadeAsSourceCount: 0,
      cascadeAsTargetCount: 0,
      totalEvents: 8,
    };
    expect(formatPatternUsageLine(row)).toBe(
      'PAT-SRC-AMS-001      · 12 instances · 8 events',
    );
  });

  test('singularises 1 instance / 1 event', () => {
    const row: PatternUsageRow = {
      patternId: 'PAT-PRG-CDP-001',
      patternLabel: 'CDP',
      patternSlug: 'cdp',
      family: 'program',
      instanceCount: 1,
      instanceIds: [],
      contradictionTemplateCount: 0,
      contradictionTemplatesCovered: 0,
      contradictionCoverageRatio: 0,
      failureModeTemplateCount: 0,
      failureModesCovered: 0,
      failureModeCoverageRatio: 0,
      synthesisEventCount: 0,
      synthesisEventCountLast24h: 0,
      cascadeAsSourceCount: 0,
      cascadeAsTargetCount: 0,
      totalEvents: 1,
    };
    expect(formatPatternUsageLine(row)).toBe(
      'PAT-PRG-CDP-001      · 1 instance · 1 event',
    );
  });
});

describe('formatHealthLine', () => {
  test('pads id and grade so columns line up', () => {
    const entry = {
      instanceId: 'APX-CDP-2026',
      health: {
        grade: 'amber' as const,
        score: 65,
        reasons: [],
        summary: '',
      } satisfies InstanceHealth,
    };
    expect(formatHealthLine(entry)).toBe(
      'APX-CDP-2026         · amber · 65',
    );
  });

  test('respects custom id width', () => {
    const entry = {
      instanceId: 'A',
      health: {
        grade: 'green' as const,
        score: 92,
        reasons: [],
        summary: '',
      } satisfies InstanceHealth,
    };
    expect(formatHealthLine(entry, 4)).toBe('A    · green · 92');
  });
});

describe('truncate', () => {
  test('returns the input unchanged when shorter than max', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  test('clips with an ellipsis when longer than max', () => {
    expect(truncate('this is a long sentence', 10)).toBe('this is a…');
  });
});

describe('formatRiskLine', () => {
  test('renders index, severity, kind, instance label, and label', () => {
    const risk: RiskItem = {
      id: 'CT-1',
      kind: 'contradiction',
      label: 'Vendor lock-in concern',
      severity: 'high',
      confidence: 0.9,
      instanceId: 'APX-CDP-2026',
      instanceLabel: 'APX-CDP-2026',
      tenantId: 'apex-retail',
      mitigation: '',
    };
    expect(formatRiskLine(1, risk)).toBe(
      '1. high   · contradiction · APX-CDP-2026 · Vendor lock-in concern',
    );
  });
});
