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

import { generateArtifact } from "@/lib/deliverables/generate-artifact";
import { createMovesGenerateArtifactDeps } from "@/lib/deliverables/moves-generate-deps";
import { runDeliverableForTenant } from "@/lib/deliverables/orchestrator/generate-service";
import { persistMoveGeneratedArtifact } from "@/lib/deliverables/persist-move-generated-artifact";
import { validateDeliverableTenantInvariant } from "@/lib/deliverables/orchestrator/tenant-invariant";
import {
  claimNextDeliverableRun,
  blockRunsWithFailedDependencies,
  completeDeliverableRun,
  getDeliverableRun,
  sweepStaleDeliverableRuns,
  updateDeliverableRunProgress,
  type DeliverableRunRecord,
  type MovesPremiumArtifactRunJobPayload,
  type OrchestratorDeliverableRunJobPayload,
} from "@/lib/deliverables/orchestrator/runs-repository";
import { getProgramById } from "@/lib/programs/queries";
import { getGeneratedArtifactById } from "@/lib/artifacts/repository";
import type { TenancyCtx } from "@/lib/programs/types.db";
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
  if (fromArg)
    return (
      fromArg.slice("--worker-id=".length).trim() || `worker:${process.pid}`
    );
  const host = process.env.HOSTNAME?.trim() || "host";
  const pid = process.pid;
  const tick =
    typeof process.hrtime === "function"
      ? process.hrtime.bigint().toString()
      : String(pid);
  return `deliverable-worker:${host}:${pid}:${tick}`;
}

function resolveBatchSize(): number {
  const raw = process.env.ABARVA_DELIVERABLE_WORKER_BATCH?.trim();
  if (!raw) return DEFAULT_BATCH;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_BATCH;
  return Math.min(parsed, 50);
}

function isMovesPremiumArtifactPayload(
  payload: DeliverableRunRecord["jobPayload"],
): payload is MovesPremiumArtifactRunJobPayload {
  return payload?.kind === "moves_premium_artifact";
}

function workerCtxForRun(run: DeliverableRunRecord): TenancyCtx {
  return {
    clientId: run.clientId,
    clientKey: run.tenantKey,
    userId: run.userId,
    tenantRole: "tenant_admin",
    role: "client_admin",
    email: null,
  };
}

async function runMovesPremiumArtifact(
  run: DeliverableRunRecord,
  payload: MovesPremiumArtifactRunJobPayload,
  workerId: string,
): Promise<void> {
  const ctx = workerCtxForRun(run);
  try {
    await updateDeliverableRunProgress(run.id, {
      pct: 5,
      label: "Claimed by private operator",
      pass: "claim",
      workerId,
    }).catch(() => {});

    const program = await getProgramById(ctx, payload.sourceArtifactRef);
    if (!program) {
      await completeDeliverableRun(run.id, {
        status: "failed",
        error: "move not found for queued tenant",
      }).catch(() => {});
      return;
    }

    await updateDeliverableRunProgress(run.id, {
      pct: 12,
      label: "Assembling premium Move context",
      pass: "context",
      workerId,
    }).catch(() => {});

    const result = await generateArtifact(
      {
        moveId: payload.sourceArtifactRef,
        tenantKey: run.tenantKey,
        phase: payload.phase,
        artifact: payload.artifact,
        allowApprovedRetry: true,
        generationMode: payload.generationMode,
        useCaseQuery: payload.useCaseQuery,
      },
      createMovesGenerateArtifactDeps(ctx),
    );

    if (result.status === "blocked_gate") {
      await completeDeliverableRun(run.id, {
        status: "blocked",
        blockers: result.blockers.map((blocker) => blocker.reason),
        error: "generation gate blocked",
      }).catch(() => {});
      return;
    }
    if (result.status === "blocked_context") {
      await completeDeliverableRun(run.id, {
        status: "blocked",
        blockers: result.missing,
        error: "generation context blocked",
      }).catch(() => {});
      return;
    }
    if (result.status === "blocked_quality") {
      await completeDeliverableRun(run.id, {
        status: "blocked",
        blockers: result.goldenBar.reasons,
        warnings: [
          `golden_bar_pass=false`,
          `word_count=${result.goldenBar.wordCount}`,
          `svg_count=${result.goldenBar.svgCount}`,
        ],
        sectionCount: result.goldenBar.wordCount,
        error: "golden bar failed",
      }).catch(() => {});
      return;
    }

    await updateDeliverableRunProgress(run.id, {
      pct: 90,
      label: "Persisting artifact and quality record",
      pass: "persist",
      workerId,
    }).catch(() => {});

    const persisted = await persistMoveGeneratedArtifact({
      ctx,
      program,
      phase: payload.phase,
      artifact: payload.artifact,
      title: payload.title,
      result,
    });

    await completeDeliverableRun(run.id, {
      status: "succeeded",
      artifactId: persisted.artifactId,
      sectionCount: result.goldenBar.wordCount,
      retrievedEvidence: result.goldenBar.svgCount,
      warnings: [
        `golden_bar_pass=${result.goldenBar.pass}`,
        `word_count=${result.goldenBar.wordCount}`,
        `svg_count=${result.goldenBar.svgCount}`,
        `artifact_version=${persisted.artifactVersion}`,
        `artifact_blob_stored=${persisted.artifactBlobStored}`,
        ...(result.draftOnly ? ["draft_only=true"] : []),
      ],
    });
  } catch (err) {
    await completeDeliverableRun(run.id, {
      status: "failed",
      error: (err instanceof Error ? err.message : String(err)).slice(0, 600),
    }).catch(() => {});
  }
}

/** Run one claimed row to terminal state. Errors are caught and recorded as 'failed'. */
async function runClaimed(
  run: DeliverableRunRecord,
  workerId: string,
): Promise<void> {
  const payload = run.jobPayload;
  if (!payload) {
    await completeDeliverableRun(run.id, {
      status: "failed",
      error:
        "job_payload missing on claimed run — cannot reconstruct generation input",
    }).catch(() => {});
    return;
  }
  if (isMovesPremiumArtifactPayload(payload)) {
    await runMovesPremiumArtifact(run, payload, workerId);
    return;
  }

  const orchestratorPayload = payload as OrchestratorDeliverableRunJobPayload;

  try {
    const tenantInvariant = await validateDeliverableTenantInvariant({
      module: orchestratorPayload.module as DeliverableModule,
      sourceArtifactRef: orchestratorPayload.sourceArtifactRef,
      clientId: run.clientId,
      tenantKey: run.tenantKey,
    });
    if (!tenantInvariant.ok) {
      await completeDeliverableRun(run.id, {
        status: "failed",
        error: `tenant invariant failed: ${tenantInvariant.code}; ${tenantInvariant.detail}`,
        blockers: [
          `${tenantInvariant.sourceKind}:${tenantInvariant.sourceId} expected tenant ${tenantInvariant.expectedTenantKey} but resolved ${tenantInvariant.actualTenantKey ?? "none"}`,
        ],
      }).catch(() => {});
      return;
    }

    if (orchestratorPayload.decisionLineage) {
      const { loadApprovedSolutionApproach } =
        await import("@/lib/programs/approved-solution-approach");
      const current = await loadApprovedSolutionApproach({
        moveId: orchestratorPayload.sourceArtifactRef,
        clientId: run.clientId,
      });
      if (
        !current ||
        current.decisionHash !==
          orchestratorPayload.decisionLineage.decisionHash
      ) {
        await completeDeliverableRun(run.id, {
          status: "blocked",
          error: "stale_decision_basis",
          blockers: [
            "The approved solution approach changed after this architecture batch was queued. Rebuild from the current approved decision.",
          ],
        }).catch(() => {});
        return;
      }
      const { loadCurrentMoveContextExtractFreshness } =
        await import("@/lib/programs/move-context-extract-freshness");
      const freshness = await loadCurrentMoveContextExtractFreshness({
        tenantKey: run.tenantKey,
        moveId: orchestratorPayload.sourceArtifactRef,
        phase: 3,
      });
      if (
        !freshness ||
        freshness.evidenceFingerprint !==
          orchestratorPayload.decisionLineage.contextSnapshotHash
      ) {
        await completeDeliverableRun(run.id, {
          status: "blocked",
          error: "stale_context_snapshot",
          blockers: [
            "Move evidence changed after this architecture batch was queued. Refresh the Context Extract and rebuild from the approved evidence snapshot.",
          ],
        }).catch(() => {});
        return;
      }
    }

    let upstreamArtifactContext = "";
    if (run.dependsOnRunId) {
      const predecessor = await getDeliverableRun(
        run.dependsOnRunId,
        run.clientId,
      );
      if (!predecessor?.artifactId || predecessor.status !== "succeeded") {
        await completeDeliverableRun(run.id, {
          status: "blocked",
          error: "dependency_not_satisfied",
          blockers: [
            "The required upstream P3 artifact is not successfully persisted.",
          ],
        }).catch(() => {});
        return;
      }
      const artifact = await getGeneratedArtifactById(predecessor.artifactId, {
        clientId: run.clientId,
      });
      if (!artifact) {
        await completeDeliverableRun(run.id, {
          status: "blocked",
          error: "dependency_artifact_missing",
          blockers: [
            "The upstream run succeeded but its persisted artifact could not be loaded.",
          ],
        }).catch(() => {});
        return;
      }
      const renderable = artifact.metadata.renderableDoc;
      upstreamArtifactContext = [
        "APPROVED P3 ASSEMBLY PREDECESSOR - PRESERVE ITS DECISIONS",
        JSON.stringify(
          renderable ?? artifact.metadata.renderedHtml ?? artifact.metadata,
        ).slice(0, 18000),
      ].join("\n");
    }

    const result = await runDeliverableForTenant({
      module: orchestratorPayload.module as DeliverableModule,
      useCaseArchetype: orchestratorPayload.useCaseArchetype,
      ...(orchestratorPayload.deliverableTypeKey
        ? { deliverableTypeKey: orchestratorPayload.deliverableTypeKey }
        : {}),
      deliverableType: orchestratorPayload.deliverableType,
      audience: orchestratorPayload.audience as AudienceRole[] | undefined,
      decisionContext: [
        orchestratorPayload.decisionContext,
        upstreamArtifactContext,
      ]
        .filter(Boolean)
        .join("\n\n"),
      approvedSolutionApproach: orchestratorPayload.approvedSolutionApproach,
      decisionLineage: orchestratorPayload.decisionLineage,
      clientDisplayName: orchestratorPayload.clientDisplayName || "Client",
      initiativeDisplayName:
        orchestratorPayload.initiativeDisplayName ||
        orchestratorPayload.useCaseArchetype,
      sourceArtifactRef: orchestratorPayload.sourceArtifactRef,
      evidenceQuery: orchestratorPayload.evidenceQuery,
      outputFormats: orchestratorPayload.outputFormats as
        | OutputFormat[]
        | undefined,
      adaptiveDepth: orchestratorPayload.adaptiveDepth,
      ...(orchestratorPayload.model
        ? { model: orchestratorPayload.model }
        : {}),
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

    if (result.ok && !result.artifactId) {
      await completeDeliverableRun(run.id, {
        status: "failed",
        error: "generation_succeeded_without_persisted_artifact",
        blockers: [
          "Generation returned success without an artifact id; downstream assembly cannot continue.",
        ],
      });
      return;
    }

    // Same completion mapping the route used before it became enqueue-only.
    await completeDeliverableRun(
      run.id,
      result.ok
        ? {
            status: "succeeded",
            artifactId: result.artifactId ?? null,
            sectionCount: result.sectionCount ?? null,
            retrievedEvidence: result.retrievedEvidence ?? null,
            contextCoverage: result.contextCoverage ?? null,
            warnings: result.warnings ?? [],
          }
        : {
            status: "blocked",
            blockers: result.blockers ?? [],
            retrievedEvidence: result.retrievedEvidence ?? null,
            contextCoverage: result.contextCoverage ?? null,
            sectionCount: result.sectionCount ?? null,
            error: result.blockedReason ?? null,
          },
    );
  } catch (err) {
    console.error(
      `[process-deliverable-queue] run ${run.id} failed`,
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
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
    console.warn(
      `[process-deliverable-queue] reclaimed ${reclaimed.length} stale run(s): ${reclaimed.join(", ")}`,
    );
  }
  await blockRunsWithFailedDependencies().catch((err) => {
    console.error("[process-deliverable-queue] dependency sweep failed", err);
  });

  // 2 · bounded claim loop.
  const processed: string[] = [];
  for (let i = 0; i < batchSize; i++) {
    const run = await claimNextDeliverableRun(workerId);
    if (!run) break; // queue empty — let the cron re-fire later.
    console.log(
      `[process-deliverable-queue] claimed run ${run.id} (tenant=${run.tenantKey}, module=${run.module})`,
    );
    await runClaimed(run, workerId);
    await blockRunsWithFailedDependencies().catch((err) => {
      console.error(
        "[process-deliverable-queue] dependency cascade failed",
        err,
      );
    });
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
