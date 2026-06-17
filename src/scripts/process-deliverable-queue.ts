#!/usr/bin/env -S npx tsx
// Durable deliverable generation worker · process-deliverable-queue
//
// The POST /api/v1/deliverables/generate route now only ENQUEUES a run row
// (status='queued') carrying a self-contained job payload. It does no model work,
// because on Azure Container Apps the web replica (minReplicas:0/maxReplicas:1) is
// recycled right after the 202 returns — which used to kill the detached generation
// promise mid-run and strand the run at 'running' forever.
//
// This script is the worker an ACA Job runs (on a cron / scale-to-zero schedule):
//   1. Sweep stale runs (hard deadline reaper) so nothing can be stuck non-terminal.
//   2. Loop, claiming the next runnable row atomically (FOR UPDATE SKIP LOCKED), and
//      run the generation deterministically from the row's job_payload + identity
//      columns — exactly the GenerateDeliverableServiceInput the route used to build.
//   3. Complete the run (succeeded | blocked | failed) with the same mapping the route
//      used, heartbeating on every progress pass so a long-but-alive run keeps its lease.
//   4. Process up to N runs per invocation, then exit 0 so the cron re-fires.
//
// Identity is already deterministic end to end: runDeliverableForTenant and everything
// below take explicit clientId/tenantKey/userId with no request-scoped reads, so the
// run is reproducible from the persisted row alone. Server-only, self-contained.

import "server-only";

import { runDeliverableForTenant } from "@/lib/deliverables/orchestrator/generate-service";
import {
  claimNextDeliverableRun,
  completeDeliverableRun,
  sweepStaleDeliverableRuns,
  updateDeliverableRunProgress,
  type DeliverableRunRecord,
} from "@/lib/deliverables/orchestrator/runs-repository";
import type {
  AudienceRole,
  DeliverableModule,
  OutputFormat,
} from "@/lib/deliverables/orchestrator/types";

/** Max runs processed per invocation; the cron re-fires for the rest. */
const DEFAULT_BATCH = 5;

/**
 * Unique worker id for this invocation. Date.now()/Math.random can be unavailable or
 * frozen in some sandboxed contexts, so build it from real process facts (hostname +
 * pid) plus the high-resolution monotonic clock, with an env/arg override for ACA.
 */
function resolveWorkerId(): string {
  const fromEnv = process.env.ABARVA_DELIVERABLE_WORKER_ID?.trim();
  if (fromEnv) return fromEnv;
  const fromArg = process.argv.find((a) => a.startsWith("--worker-id="));
  if (fromArg) return fromArg.slice("--worker-id=".length).trim() || `worker:${process.pid}`;
  const host = process.env.HOSTNAME?.trim() || "host";
  const pid = process.pid;
  const tick = typeof process.hrtime === "function" ? process.hrtime.bigint().toString() : String(pid);
  return `deliverable-worker:${host}:${pid}:${tick}`;
}

function resolveBatchSize(): number {
  const raw = process.env.ABARVA_DELIVERABLE_WORKER_BATCH?.trim();
  if (!raw) return DEFAULT_BATCH;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_BATCH;
  return Math.min(parsed, 50);
}

/** Run one claimed row to terminal state. Errors are caught and recorded as 'failed'. */
async function runClaimed(run: DeliverableRunRecord, workerId: string): Promise<void> {
  const payload = run.jobPayload;
  if (!payload) {
    await completeDeliverableRun(run.id, {
      status: "failed",
      error: "job_payload missing on claimed run — cannot reconstruct generation input",
    }).catch(() => {});
    return;
  }

  try {
    const result = await runDeliverableForTenant({
      module: payload.module as DeliverableModule,
      useCaseArchetype: payload.useCaseArchetype,
      deliverableType: payload.deliverableType,
      audience: payload.audience as AudienceRole[] | undefined,
      decisionContext: payload.decisionContext,
      clientDisplayName: payload.clientDisplayName || "Client",
      initiativeDisplayName: payload.initiativeDisplayName || payload.useCaseArchetype,
      sourceArtifactRef: payload.sourceArtifactRef,
      evidenceQuery: payload.evidenceQuery,
      outputFormats: payload.outputFormats as OutputFormat[] | undefined,
      ...(payload.model ? { model: payload.model } : {}),
      tenantClientKey: run.tenantKey,
      clientId: run.clientId,
      userId: run.userId,
      // Live progress band + heartbeat: every pass persists {pct,label} AND bumps the
      // lease (workerId) so a long-but-alive run is not reclaimed. Best-effort — a failed
      // progress write must never abort the generation.
      onProgress: (p) => {
        void updateDeliverableRunProgress(run.id, {
          pct: p.pct,
          label: p.nextLabel ?? p.label,
          pass: p.pass,
          workerId,
        }).catch(() => {});
      },
    });

    // Same completion mapping the route used before it became enqueue-only.
    await completeDeliverableRun(
      run.id,
      result.ok
        ? {
            status: "succeeded",
            artifactId: result.artifactId ?? null,
            sectionCount: result.sectionCount ?? null,
            retrievedEvidence: result.retrievedEvidence ?? null,
            warnings: result.warnings ?? [],
          }
        : {
            status: "blocked",
            blockers: result.blockers ?? [],
            retrievedEvidence: result.retrievedEvidence ?? null,
            sectionCount: result.sectionCount ?? null,
            error: result.blockedReason ?? null,
          },
    );
  } catch (err) {
    await completeDeliverableRun(run.id, {
      status: "failed",
      error: (err instanceof Error ? err.message : String(err)).slice(0, 600),
    }).catch(() => {});
  }
}

export async function processDeliverableQueue(
  opts: { batchSize?: number; workerId?: string } = {},
): Promise<{ workerId: string; reclaimed: string[]; processed: string[] }> {
  const workerId = opts.workerId ?? resolveWorkerId();
  const batchSize = opts.batchSize ?? resolveBatchSize();

  // 1 · hard-deadline reaper for anything stuck non-terminal past the give-up bound.
  const reclaimed = await sweepStaleDeliverableRuns().catch((err) => {
    console.error("[process-deliverable-queue] sweep failed", err);
    return [] as string[];
  });
  if (reclaimed.length > 0) {
    console.warn(`[process-deliverable-queue] reclaimed ${reclaimed.length} stale run(s): ${reclaimed.join(", ")}`);
  }

  // 2 · bounded claim loop.
  const processed: string[] = [];
  for (let i = 0; i < batchSize; i++) {
    const run = await claimNextDeliverableRun(workerId);
    if (!run) break; // queue empty — let the cron re-fire later.
    console.log(`[process-deliverable-queue] claimed run ${run.id} (tenant=${run.tenantKey}, module=${run.module})`);
    await runClaimed(run, workerId);
    processed.push(run.id);
  }

  return { workerId, reclaimed, processed };
}

async function main(): Promise<void> {
  const result = await processDeliverableQueue();
  console.log(
    `[process-deliverable-queue] done · worker=${result.workerId} reclaimed=${result.reclaimed.length} processed=${result.processed.length}`,
  );
}

// Run only as a script (not when imported by tests).
const isEntrypoint = (() => {
  try {
    const argv1 = process.argv[1] ?? "";
    return argv1.includes("process-deliverable-queue");
  } catch {
    return false;
  }
})();

if (isEntrypoint) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[process-deliverable-queue] fatal", err);
      process.exit(1);
    });
}
