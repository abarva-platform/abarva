#!/usr/bin/env tsx
import { loadDepthExemplars } from '@/lib/depth/exemplars';
import { scoreArtifact } from '@/lib/depth/lint-service';
import { assertRubricType } from '@/lib/depth/rubrics/shared';
import type { DepthLintResult, DepthRubricType } from '@/lib/depth/types';

interface CliArgs {
  all: boolean;
  type?: DepthRubricType;
  id?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.filter((arg) => arg !== '--');
  const parsed: CliArgs = { all: false };

  for (const arg of args) {
    if (arg === '--all') parsed.all = true;
    if (arg.startsWith('--type=')) parsed.type = assertRubricType(arg.slice('--type='.length));
    if (arg.startsWith('--id=')) parsed.id = arg.slice('--id='.length);
  }

  return parsed;
}

async function scoreAll(): Promise<DepthLintResult[]> {
  const exemplars = await loadDepthExemplars();
  return Promise.all(
    exemplars.map((exemplar) =>
      scoreArtifact(exemplar.rubric_type, exemplar.content, { artifactId: exemplar.artifact_id }),
    ),
  );
}

async function scoreOne(type: DepthRubricType, id: string): Promise<DepthLintResult[]> {
  const exemplars = await loadDepthExemplars();
  const exemplar = exemplars.find((candidate) => candidate.rubric_type === type && candidate.artifact_id === id);
  if (!exemplar) {
    throw new Error(`No exemplar artifact found for type=${type} id=${id}.`);
  }
  return [await scoreArtifact(type, exemplar.content, { artifactId: exemplar.artifact_id })];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const results = args.all
    ? await scoreAll()
    : args.type && args.id
      ? await scoreOne(args.type, args.id)
      : (() => {
          throw new Error('Usage: npm run lint:depth -- --all OR npm run lint:depth -- --type=pattern --id=<artifact_id>');
        })();

  const totalEstimatedCost = results.reduce((sum, result) => sum + (result.estimated_cost_usd ?? 0), 0);
  const output = args.all
    ? { results, pass: results.every((result) => result.pass), estimated_cost_usd: Number(totalEstimatedCost.toFixed(4)) }
    : results[0];

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);

  const failed = results.filter((result) => !result.pass);
  if (failed.length > 0 || totalEstimatedCost > 5) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
