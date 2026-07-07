#!/usr/bin/env -S npx tsx
// Durable Source artifact generation worker · process-source-artifact-generation-queue
//
// The POST /api/v1/source/:eventId/artifacts/:artifactCode/generate route runs
// synchronously with a 110s rewrite budget. Board-grade artifacts (e.g. d09_rfp_pack)
// take 450-550s to generate — the budget is always exhausted before the quality-gate
// rewrite can fire, capping quality at 7/10.
//
// This worker drains the `source_artifact_generation_jobs` queue with no web-request
// deadline. The generate route detects the X-Source-Worker-Call header and resets the
// rewrite budget clock, so the rewrite always runs.
//
// ACA Job pattern: run as a cron or on-demand job, process up to N jobs per
// invocation, then exit 0 so the scheduler re-fires.

import "server-only";

import {
  findNextQueuedSourceArtifactGenerationJob,
  processSourceArtifactGenerationJob,
  sweepStaleSourceArtifactGenerationJobs,
} from "@/lib/source/artifact-generation-queue";

const DEFAULT_BATCH = 3;

function resolveWorkerId(): string {
  const fromEnv = process.env.ABARVA_SOURCE_ARTIFACT_WORKER_ID?.trim();
  if (fromEnv) return fromEnv;
  const fromArg = process.argv.find((a) => a.startsWith("--worker-id="));
  if (fromArg) return fromArg.slice("--worker-id=".length).trim() || `worker:${process.pid}`;
  const host = process.env.HOSTNAME?.trim() || "host";
  const tick =
    typeof process.hrtime === "function"
      ? process.hrtime.bigint().toString()
      : String(process.pid);
  return `source-artifact-worker:${host}:${process.pid}:${tick}`;
}

function resolveBatchSize(): number {
  const raw = process.env.ABARVA_SOURCE_ARTIFACT_WORKER_BATCH?.trim();
  if (!raw) return DEFAULT_BATCH;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_BATCH;
  return Math.min(parsed, 20);
}

export async function processSourceArtifactQueue(
  opts: { batchSize?: number; workerId?: string } = {},
): Promise<{ workerId: string; reclaimed: string[]; processed: string[] }> {
  const workerId = opts.workerId ?? resolveWorkerId();
  const batchSize = opts.batchSize ?? resolveBatchSize();

  // 1 · stale reaper — recover any jobs stuck in 'running' past the hard deadline.
  const reclaimed = await sweepStaleSourceArtifactGenerationJobs().catch(
    (err) => {
      console.error("[process-source-artifact-generation-queue] sweep failed", err);
      return [] as string[];
    },
  );
  if (reclaimed.length > 0) {
    console.warn(
      `[process-source-artifact-generation-queue] reclaimed ${reclaimed.length} stale job(s): ${reclaimed.join(", ")}`,
    );
  }

  // 2 · bounded drain loop.
  const processed: string[] = [];
  for (let i = 0; i < batchSize; i++) {
    const job = await findNextQueuedSourceArtifactGenerationJob().catch(() => null);
    if (!job) break; // queue empty

    console.log(
      `[process-source-artifact-generation-queue] claiming job ${job.id} (event=${job.source_event_id} artifact=${job.artifact_code} attempt=${job.attempt_count + 1}/${job.max_attempts})`,
    );

    const result = await processSourceArtifactGenerationJob(
      { jobId: job.id, workerId },
    );
    processed.push(job.id);

    if (result.ok) {
      console.log(
        `[process-source-artifact-generation-queue] job ${job.id} succeeded (${job.artifact_code})`,
      );
    } else {
      console.error(
        `[process-source-artifact-generation-queue] job ${job.id} failed (${job.artifact_code}): ${result.error}`,
      );
    }
  }

  return { workerId, reclaimed, processed };
}

async function main(): Promise<void> {
  const result = await processSourceArtifactQueue();
  console.log(
    `[process-source-artifact-generation-queue] done · worker=${result.workerId} reclaimed=${result.reclaimed.length} processed=${result.processed.length}`,
  );
}

const isEntrypoint = (() => {
  try {
    return (process.argv[1] ?? "").includes("process-source-artifact-generation-queue");
  } catch {
    return false;
  }
})();

if (isEntrypoint) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[process-source-artifact-generation-queue] fatal", err);
      process.exit(1);
    });
}
