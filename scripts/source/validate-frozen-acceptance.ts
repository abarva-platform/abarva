import fs from "node:fs";
import { evaluateFrozenDatasetAcceptance } from "../../src/lib/source/acceptance/frozen-dataset-protocol";

const [baselinePath, observationPath] = process.argv.slice(2);
if (!baselinePath || !observationPath) {
  process.stderr.write("usage: npx tsx scripts/source/validate-frozen-acceptance.ts <baseline.json> <observation.json>\n");
  process.exit(2);
}

try {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const observation = JSON.parse(fs.readFileSync(observationPath, "utf8"));
  const result = evaluateFrozenDatasetAcceptance(baseline, observation);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.status === "valid" ? 0 : 1);
} catch {
  process.stderr.write("Cannot read a valid baseline and observation JSON pair.\n");
  process.exit(2);
}
