/**
 * Pattern usage analytics tests.
 *
 * Deterministic: every case passes explicit `synthesisEvents`, `cascadeEvents`,
 * and `now` so the in-memory ring buffers do not affect outcomes. The
 * analytics module is pure aggregation — same inputs always produce the same
 * report.
 */

import { computePatternUsage } from '@/lib/reasoning/pattern-usage-analytics';
import type { SynthesisTelemetryEvent } from '@/lib/reasoning/synthesis-telemetry';
import type { CascadeTelemetryEvent } from '@/lib/reasoning/cascade-telemetry';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

const FIXED_NOW = Date.parse('2026-04-28T12:00:00.000Z');

function synth(
  partial: Partial<SynthesisTelemetryEvent> & { id: string; patternId: string | null; timestamp: string },
): SynthesisTelemetryEvent {
  return {
    surface: 'source',
    instanceId: partial.instanceId ?? 'inst-x',
    cacheHit: false,
    latencyMs: 100,
    citationCount: 0,
    contradictionCount: 0,
    failureModeCount: 0,
    gateCount: 0,
    ...partial,
  } as SynthesisTelemetryEvent;
}

function cascade(
  partial: Partial<CascadeTelemetryEvent> & {
    id: string;
    sourceInstanceId: string;
    targetInstanceId: string;
  },
): CascadeTelemetryEvent {
  return {
    timestamp: '2026-04-28T11:00:00.000Z',
    linkType: 'unblocks',
    severity: 'medium',
    buildContext: 'source-synthesis',
    ...partial,
  } as CascadeTelemetryEvent;
}

describe('computePatternUsage — shape and deterministic baseline', () => {
  it('emits one row per lifecycle pattern (13 total)', () => {
    const report = computePatternUsage({
      synthesisEvents: [],
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    expect(report.rows).toHaveLength(13);
    expect(report.totalPatterns).toBe(13);
  });

  it('covers every patternId from getAllLifecyclePatterns()', () => {
    const report = computePatternUsage({
      synthesisEvents: [],
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    const reportIds = report.rows.map((r) => r.patternId).sort();
    const catalogueIds = getAllLifecyclePatterns()
      .map((p) => p.patternId)
      .sort();
    expect(reportIds).toEqual(catalogueIds);
  });

  it('marks family correctly for source-event vs program patterns', () => {
    const report = computePatternUsage({
      synthesisEvents: [],
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    for (const row of report.rows) {
      if (row.patternId.startsWith('PAT-PRG-')) {
        expect(row.family).toBe('program');
      } else {
        expect(row.family).toBe('source-event');
      }
    }
  });

  it('reports a non-zero totalBound (fixtures exist for most patterns)', () => {
    const report = computePatternUsage({
      synthesisEvents: [],
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    expect(report.totalBound).toBeGreaterThan(0);
    expect(report.totalBound).toBeLessThanOrEqual(report.totalPatterns);
  });
});

describe('computePatternUsage — coverage ratios', () => {
  it('returns coverage ratios in [0, 1] with safe handling when no templates declared', () => {
    const report = computePatternUsage({
      synthesisEvents: [],
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    for (const row of report.rows) {
      expect(row.contradictionCoverageRatio).toBeGreaterThanOrEqual(0);
      expect(row.contradictionCoverageRatio).toBeLessThanOrEqual(1);
      expect(row.failureModeCoverageRatio).toBeGreaterThanOrEqual(0);
      expect(row.failureModeCoverageRatio).toBeLessThanOrEqual(1);
      // covered count never exceeds template count
      expect(row.contradictionTemplatesCovered).toBeLessThanOrEqual(
        row.contradictionTemplateCount,
      );
      expect(row.failureModesCovered).toBeLessThanOrEqual(row.failureModeTemplateCount);
    }
  });

  it('meanCoverageRatio is in [0, 1]', () => {
    const report = computePatternUsage({
      synthesisEvents: [],
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    expect(report.meanCoverageRatio).toBeGreaterThanOrEqual(0);
    expect(report.meanCoverageRatio).toBeLessThanOrEqual(1);
  });
});

describe('computePatternUsage — synthesis telemetry counting', () => {
  it('counts synthesis events per pattern and respects the 24h window', () => {
    const events: SynthesisTelemetryEvent[] = [
      synth({
        id: 'e1',
        patternId: 'PAT-SRC-AMS-001',
        timestamp: '2026-04-28T11:30:00.000Z', // within 24h
      }),
      synth({
        id: 'e2',
        patternId: 'PAT-SRC-AMS-001',
        timestamp: '2026-04-27T13:00:00.000Z', // within 24h
      }),
      synth({
        id: 'e3',
        patternId: 'PAT-SRC-AMS-001',
        timestamp: '2026-04-25T12:00:00.000Z', // older than 24h
      }),
      synth({
        id: 'e4',
        patternId: 'PAT-SRC-RFP-001',
        timestamp: '2026-04-28T11:00:00.000Z',
      }),
    ];
    const report = computePatternUsage({
      synthesisEvents: events,
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    const ams = report.rows.find((r) => r.patternId === 'PAT-SRC-AMS-001');
    const rfp = report.rows.find((r) => r.patternId === 'PAT-SRC-RFP-001');
    expect(ams).toBeDefined();
    expect(ams!.synthesisEventCount).toBe(3);
    expect(ams!.synthesisEventCountLast24h).toBe(2);
    expect(rfp!.synthesisEventCount).toBe(1);
    expect(rfp!.synthesisEventCountLast24h).toBe(1);
  });

  it('ignores synthesis events with null patternId', () => {
    const events: SynthesisTelemetryEvent[] = [
      synth({
        id: 'e1',
        patternId: null,
        timestamp: '2026-04-28T11:00:00.000Z',
        surface: 'tower',
        instanceId: 'tower',
      }),
    ];
    const report = computePatternUsage({
      synthesisEvents: events,
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    for (const row of report.rows) {
      expect(row.synthesisEventCount).toBe(0);
      expect(row.synthesisEventCountLast24h).toBe(0);
    }
  });
});

describe('computePatternUsage — cascade telemetry counting', () => {
  it('attributes cascade events to the patterns of their source/target instances', () => {
    // apex-retail-ams-outsourcing-2026 → PAT-SRC-AMS-001
    // APX-CDP-2026 → PAT-PRG-CDP-001
    const events: CascadeTelemetryEvent[] = [
      cascade({
        id: 'c1',
        sourceInstanceId: 'apex-retail-ams-outsourcing-2026',
        targetInstanceId: 'APX-CDP-2026',
      }),
      cascade({
        id: 'c2',
        sourceInstanceId: 'apex-retail-ams-outsourcing-2026',
        targetInstanceId: 'APX-CDP-2026',
      }),
    ];
    const report = computePatternUsage({
      synthesisEvents: [],
      cascadeEvents: events,
      now: FIXED_NOW,
    });
    const ams = report.rows.find((r) => r.patternId === 'PAT-SRC-AMS-001');
    const cdp = report.rows.find((r) => r.patternId === 'PAT-PRG-CDP-001');
    expect(ams!.cascadeAsSourceCount).toBe(2);
    expect(ams!.cascadeAsTargetCount).toBe(0);
    expect(cdp!.cascadeAsSourceCount).toBe(0);
    expect(cdp!.cascadeAsTargetCount).toBe(2);
  });

  it('ignores cascade events whose instance ids are not bound to any pattern', () => {
    const events: CascadeTelemetryEvent[] = [
      cascade({
        id: 'c1',
        sourceInstanceId: 'unknown-instance-a',
        targetInstanceId: 'unknown-instance-b',
      }),
    ];
    const report = computePatternUsage({
      synthesisEvents: [],
      cascadeEvents: events,
      now: FIXED_NOW,
    });
    for (const row of report.rows) {
      expect(row.cascadeAsSourceCount).toBe(0);
      expect(row.cascadeAsTargetCount).toBe(0);
    }
  });
});

describe('computePatternUsage — sorting and totals', () => {
  it('sorts rows by totalEvents desc with patternId asc as deterministic tie-break', () => {
    const synthesisEvents: SynthesisTelemetryEvent[] = [
      synth({
        id: 'e1',
        patternId: 'PAT-SRC-RFP-001',
        timestamp: '2026-04-28T11:00:00.000Z',
      }),
      synth({
        id: 'e2',
        patternId: 'PAT-SRC-RFP-001',
        timestamp: '2026-04-28T11:01:00.000Z',
      }),
      synth({
        id: 'e3',
        patternId: 'PAT-SRC-RFP-001',
        timestamp: '2026-04-28T11:02:00.000Z',
      }),
      synth({
        id: 'e4',
        patternId: 'PAT-SRC-AMS-001',
        timestamp: '2026-04-28T11:00:00.000Z',
      }),
    ];
    const report = computePatternUsage({
      synthesisEvents,
      cascadeEvents: [],
      now: FIXED_NOW,
    });
    expect(report.rows[0].patternId).toBe('PAT-SRC-RFP-001');
    expect(report.rows[0].totalEvents).toBe(3);
    expect(report.rows[1].patternId).toBe('PAT-SRC-AMS-001');
    expect(report.rows[1].totalEvents).toBe(1);
    // Tie-break: zero-event patterns sort by patternId asc
    const tied = report.rows.filter((r) => r.totalEvents === 0).map((r) => r.patternId);
    const tiedSorted = [...tied].sort();
    expect(tied).toEqual(tiedSorted);
  });

  it('totalEvents equals synthesisEventCount + cascadeAsSourceCount + cascadeAsTargetCount', () => {
    const synthesisEvents: SynthesisTelemetryEvent[] = [
      synth({
        id: 'e1',
        patternId: 'PAT-SRC-AMS-001',
        timestamp: '2026-04-28T11:00:00.000Z',
      }),
    ];
    const cascadeEvents: CascadeTelemetryEvent[] = [
      cascade({
        id: 'c1',
        sourceInstanceId: 'apex-retail-ams-outsourcing-2026',
        targetInstanceId: 'APX-CDP-2026',
      }),
    ];
    const report = computePatternUsage({
      synthesisEvents,
      cascadeEvents,
      now: FIXED_NOW,
    });
    for (const row of report.rows) {
      expect(row.totalEvents).toBe(
        row.synthesisEventCount + row.cascadeAsSourceCount + row.cascadeAsTargetCount,
      );
    }
  });
});

describe('computePatternUsage — purity', () => {
  it('produces identical output for identical inputs (deterministic)', () => {
    const synthesisEvents: SynthesisTelemetryEvent[] = [
      synth({
        id: 'e1',
        patternId: 'PAT-SRC-AMS-001',
        timestamp: '2026-04-28T11:00:00.000Z',
      }),
    ];
    const cascadeEvents: CascadeTelemetryEvent[] = [
      cascade({
        id: 'c1',
        sourceInstanceId: 'apex-retail-ams-outsourcing-2026',
        targetInstanceId: 'APX-CDP-2026',
      }),
    ];
    const a = computePatternUsage({ synthesisEvents, cascadeEvents, now: FIXED_NOW });
    const b = computePatternUsage({ synthesisEvents, cascadeEvents, now: FIXED_NOW });
    expect(a).toEqual(b);
  });
});
