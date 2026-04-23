import { writeCycleDeltaReport } from '@/testing/findings/compare';

const args = process.argv.slice(2);
const previous = readArg('--previous');
const current = readArg('--current');
const rootDir = readArg('--root');

if (!previous || !current) {
  throw new Error(
    'Usage: npx tsx src/scripts/testing/compare-findings-cycles.ts --previous=cycle-YYYY-MM-DD-N --current=cycle-YYYY-MM-DD-N [--root=/abs/path]',
  );
}

const result = writeCycleDeltaReport(previous, current, { rootDir });
console.log(JSON.stringify({ path: result.path, summary: result.report.summary }, null, 2));

function readArg(flag: string): string | undefined {
  const prefix = `${flag}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}
