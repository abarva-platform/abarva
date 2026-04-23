import { ingestCycleFromDrop } from '@/testing/findings/drop';

const args = process.argv.slice(2);
const cycleId = readArg('--cycle');
const rootDir = readArg('--root');

if (!cycleId) {
  throw new Error('Usage: npx tsx src/scripts/testing/ingest-findings-drop.ts --cycle=cycle-YYYY-MM-DD-N [--root=/abs/path]');
}

const result = ingestCycleFromDrop(cycleId, { rootDir });
console.log(JSON.stringify(result, null, 2));

function readArg(flag: string): string | undefined {
  const prefix = `${flag}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}
