import { writeCycleDeltaReport } from '@/testing/findings/compare';
import { SAMPLE_CYCLES } from '@/testing/findings/sample-cycles';
import { writeCycleBundle } from '@/testing/findings/storage';

const rootDir = process.env.FINDINGS_ROOT;

for (const cycle of SAMPLE_CYCLES) {
  writeCycleBundle(cycle, { rootDir });
}

const [previousCycle, currentCycle] = SAMPLE_CYCLES;
if (!previousCycle || !currentCycle) {
  throw new Error('Expected at least two sample cycles to generate a delta report.');
}

const delta = writeCycleDeltaReport(previousCycle.cycle_id, currentCycle.cycle_id, { rootDir });

console.log(
  JSON.stringify(
    {
      cycles: SAMPLE_CYCLES.map((cycle) => cycle.cycle_id),
      deltaPath: delta.path,
      deltaSummary: delta.report.summary,
    },
    null,
    2,
  ),
);
