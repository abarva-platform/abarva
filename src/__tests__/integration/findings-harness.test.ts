import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compareCycles } from '@/testing/findings/compare';
import { ingestCycleFromDrop } from '@/testing/findings/drop';
import { SAMPLE_CYCLES } from '@/testing/findings/sample-cycles';
import { readCycleBundle, writeCycleBundle } from '@/testing/findings/storage';

describe('findings harness', () => {
  it('validates every canonical write', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'findings-harness-'));
    const [cycle] = SAMPLE_CYCLES;
    expect(cycle).toBeDefined();

    writeCycleBundle(cycle, { rootDir });
    const stored = readCycleBundle(cycle!.cycle_id, { rootDir });

    expect(stored?.cycle_id).toBe(cycle!.cycle_id);
    expect(stored?.turn_events).toHaveLength(cycle!.turn_events.length);
    expect(stored?.session_assessment.overall_recommendation).toBe(cycle!.session_assessment.overall_recommendation);

    expect(() =>
      writeCycleBundle(
        {
          cycle_id: 'not-a-cycle',
          turn_events: cycle!.turn_events,
          session_assessment: cycle!.session_assessment,
        },
        { rootDir },
      ),
    ).toThrow(/cycle_id must match/);
  });

  it('ingests drop files into validated canonical storage', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'findings-drop-'));
    const [cycle] = SAMPLE_CYCLES;
    expect(cycle).toBeDefined();

    const incomingDir = join(rootDir, cycle!.cycle_id, 'incoming');
    mkdirSync(incomingDir, { recursive: true });
    writeFileSync(join(incomingDir, 'turn-events.json'), `${JSON.stringify(cycle!.turn_events, null, 2)}\n`);
    writeFileSync(join(incomingDir, 'session-assessment.json'), `${JSON.stringify(cycle!.session_assessment, null, 2)}\n`);

    const result = ingestCycleFromDrop(cycle!.cycle_id, { rootDir });
    const stored = JSON.parse(readFileSync(result.output.eventsPath, 'utf8')) as unknown[];

    expect(result.turnEventCount).toBe(cycle!.turn_events.length);
    expect(stored).toHaveLength(cycle!.turn_events.length);
  });

  it('produces resolved, persistent, regression, and new deltas on synthetic cycles', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'findings-delta-'));
    for (const cycle of SAMPLE_CYCLES) {
      writeCycleBundle(cycle, { rootDir });
    }

    const report = compareCycles('cycle-2026-04-23-1', 'cycle-2026-04-23-2', { rootDir });

    expect(report.summary).toEqual({
      resolved: 1,
      persistent: 1,
      regression: 2,
      new: 1,
    });
    expect(report.resolved[0]?.category).toBe('A');
    expect(report.persistent[0]?.category).toBe('B');
    expect(report.regression.map((entry) => entry.category).sort()).toEqual(['D', 'E']);
    expect(report.new[0]?.category).toBe('C');
  });
});
