import { existsSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const coverageDirectory = "coverage/behavior-gate";
const summaryPath = `${coverageDirectory}/coverage-summary.json`;

const thresholds = {
  lines: 90,
  statements: 90,
  functions: 60,
  branches: 50,
};

rmSync(coverageDirectory, { recursive: true, force: true });

const jest = spawnSync(
  "npx",
  [
    "jest",
    "src/__tests__/behaviors",
    "--coverage",
    "--coverageReporters=json-summary",
    `--coverageDirectory=${coverageDirectory}`,
    "--runInBand",
  ],
  { stdio: "inherit" },
);

if (jest.status !== 0) {
  process.exit(jest.status ?? 1);
}

if (!existsSync(summaryPath)) {
  console.error(`Coverage summary not found at ${summaryPath}`);
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
const total = summary.total ?? {};
const failures = [];

for (const [metric, threshold] of Object.entries(thresholds)) {
  const rawPct = total[metric]?.pct;
  const pct = typeof rawPct === "number" ? rawPct : Number(rawPct);
  if (!Number.isFinite(pct)) {
    failures.push(`${metric}: missing coverage percentage`);
    continue;
  }
  if (pct < threshold) {
    failures.push(`${metric}: ${pct}% < ${threshold}%`);
  }
}

const observed = Object.fromEntries(
  Object.keys(thresholds).map((metric) => [metric, total[metric]?.pct ?? null]),
);

console.log(
  JSON.stringify(
    {
      gate: "behavior-coverage",
      thresholds,
      observed,
      summaryPath,
    },
    null,
    2,
  ),
);

if (failures.length > 0) {
  console.error(`Behavior coverage gate failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
