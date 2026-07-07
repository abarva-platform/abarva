import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

import { runAgentAnswerEvalHarness } from "@/lib/intelligence/answer/evals/harness";

interface Args {
  out: string;
  failOnRegression: boolean;
}

function parseArgs(argv: string[]): Args {
  let out = "reports/scb/w5-1-agent-answer-golden-eval.json";
  let failOnRegression = true;

  for (const arg of argv) {
    if (arg.startsWith("--out=")) out = arg.slice("--out=".length);
    else if (arg === "--no-fail") failOnRegression = false;
    else if (arg === "--fail-on-regression") failOnRegression = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return { out, failOnRegression };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await runAgentAnswerEvalHarness();
  const outPath = resolve(process.cwd(), args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `SCB W5.1 golden eval: ${report.passCount}/${report.total} pass ` +
      `(golden=${report.goldenPassCount}/${report.total}, ` +
      `answerQuality=${report.answerQualityPassCount}/${report.total})`,
  );
  console.log(`Report: ${outPath}`);

  const failures = report.results.filter((result) => !result.pass);
  for (const failure of failures) {
    console.error(`[FAIL] ${failure.id}: ${failure.notes.join("; ") || "unknown failure"}`);
  }

  if (args.failOnRegression && failures.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
