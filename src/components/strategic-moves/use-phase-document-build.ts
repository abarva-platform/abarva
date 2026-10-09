"use client";

// The phase document build, shared by every surface that offers it: the gate
// step's "Approve & Build" control and the step page's gate documents. It POSTs
// once to /api/v1/deliverables/generate-phase (enqueue-only; a durable worker
// drains), then polls each returned run via GET /api/v1/deliverables/runs/{id}.
//
// Moved here verbatim from `PhaseApproveAndBuild` so both surfaces build through
// one path. `onBuildSettled` fires once per batch, only after every queued run
// reached a terminal status; a surface that separates building from submitting
// simply does not pass it.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DeliverableSpec } from "@/lib/programs/deliverable-registry";
import { describeRequiredEvidenceRefusal } from "@/lib/programs/evidence-readiness/required-evidence-refusal";
import {
  heldArtifactBlocker,
  heldArtifactStatus,
  type SettledDeliverable,
} from "@/lib/programs/phase-build-settlement";
import {
  deliverableRunObservationKey,
  describeDeliverableRunHandOff,
  planDeliverableRunPoll,
} from "@/lib/programs/deliverable-run-poll-plan";

/** One seeded artifact: the subset of `PhaseBuildArtifact` the build reads. */
export interface PhaseBuildSeedArtifact {
  artifactId: string;
  deliverableTypeKey: string;
  documentTitle: string;
  phase: number | null;
  status: string;
  version: number;
  downloadUrl: string;
}

export interface BuildSettledResult {
  /** deliverableTypeKeys that reached status "succeeded". */
  succeededKeys: string[];
  /** deliverableTypeKeys that reached "blocked", "failed", or "error". */
  failedKeys: string[];
  /** Total deliverables in this batch (succeeded + failed + anything else terminal). */
  total: number;
  /**
   * The same two sets, each key carrying the registry's `gateArtifact` flag.
   * The bare key lists above cannot tell a phase gate document apart from a
   * working document beside it, and only the gate documents are what a phase
   * gate check reads — see `classifyPhaseBuildSettlement`.
   */
  succeeded: SettledDeliverable[];
  failed: SettledDeliverable[];
  /**
   * Where this settlement came from. "build" is the tail of a fresh batch.
   * "existing_documents" is a re-submission of documents already on the record,
   * which is the only way to submit a gate whose HARD checks read a sign-off
   * recorded after the build — see `planPhaseGateSubmitWithoutBuild`.
   */
  source?: "build" | "existing_documents";
  /**
   * The approver's own rationale, recorded as the gate's human rationale. A
   * surface that collects one (the gate step page) passes it; without it the
   * submission records the standing build-and-submit sentence.
   */
  humanRationale?: string;
}

export type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "blocked"
  | "failed"
  | "error"
  // Not a run outcome: the browser stopped following a run the server is still
  // working on. Distinct from every terminal status so the settle path cannot
  // read it as either a success or a failure.
  | "handed_off";

export interface DeliverableRow {
  deliverableTypeKey: string;
  documentTitle: string;
  gateArtifact: boolean;
  runId: string | null;
  status: RunStatus | "idle";
  progressPct: number;
  progressLabel: string | null;
  artifactId: string | null;
  blobUrl: string | null;
  packageReadiness: PackageReadiness | null;
  blockers: string[];
  error?: string;
}

export interface EnqueueResponse {
  phase: number;
  phaseLabel: string;
  queued: number;
  total: number;
  adaptiveDepth?: {
    complexityTier?: string;
    signalBasis?: string;
    resolutionConfidence?: string;
  };
  omittedDeliverables?: OmittedDeliverable[];
  deliverables: Array<{
    deliverableTypeKey: string;
    documentTitle: string;
    gateArtifact: boolean;
    runId: string | null;
    status: "queued" | "error";
    error?: string;
  }>;
}

export interface OmittedDeliverable {
  deliverableTypeKey: string;
  documentTitle: string;
  applicability: string;
  reason: string;
  mergeInto?: string;
}

export interface RunStatusResponse {
  status: RunStatus;
  artifactId: string | null;
  blobUrl: string | null;
  progressPct?: number;
  progressLabel?: string | null;
  blockers?: string[];
  error?: string | null;
  packageReadiness?: PackageReadiness | null;
}

export interface PackageReadiness {
  label: string;
  headline: string;
  evidenceCoveragePct: number;
  executiveReadinessPct: number;
  minimumEvidenceItems: number;
  retrievedEvidence: number;
  confidenceTier: "bronze" | "silver" | "gold" | "board";
  confidenceLabel: string;
  canShareExternally: boolean;
  missing: string[];
  recommendedNextStep: string;
}

export function buildInitialRows(
  specs: DeliverableSpec[],
  initialArtifacts: readonly PhaseBuildArtifact[],
): DeliverableRow[] {
  const artifactByKey = new Map<string, PhaseBuildArtifact>();
  for (const artifact of initialArtifacts) {
    if (!artifact.deliverableTypeKey) continue;
    if (!artifactByKey.has(artifact.deliverableTypeKey)) {
      artifactByKey.set(artifact.deliverableTypeKey, artifact);
    }
  }

  return specs.map((s) => {
    const artifact = artifactByKey.get(s.deliverableTypeKey);
    const documentTitle = artifact?.documentTitle ?? s.documentTitle;
    // An artifact that EXISTS is not the same as a document that BUILT. A
    // quarantined, blocked or superseded artifact is present on the record and
    // is not a usable build, and seeding it as "succeeded" from its mere
    // existence is what made it render as "Built" beside a withdrawn gate
    // submission. `heldArtifactStatus` is the same rule the submission plan
    // screens with, so the row and the control now agree.
    const heldStatus = artifact ? heldArtifactStatus(artifact.status) : null;
    return {
      deliverableTypeKey: s.deliverableTypeKey,
      documentTitle,
      gateArtifact: s.gateArtifact,
      runId: null,
      status: !artifact ? "idle" : heldStatus ? "blocked" : "succeeded",
      progressPct: artifact && !heldStatus ? 100 : 0,
      progressLabel: null,
      artifactId: artifact?.artifactId ?? null,
      blobUrl: artifact?.downloadUrl ?? null,
      packageReadiness: null,
      blockers: heldStatus
        ? [heldArtifactBlocker({ documentTitle, heldStatus })]
        : [],
    };
  });
}

export function usePhaseDocumentBuild({
  moveId,
  phaseNum,
  phaseLabel,
  archetype,
  moveName,
  clientDisplayName,
  specs,
  initialArtifacts,
  onBeforeBuild,
  onBuildSettled,
}: {
  moveId: string;
  phaseNum: number;
  phaseLabel: string;
  archetype: string;
  moveName: string;
  clientDisplayName: string;
  specs: DeliverableSpec[];
  initialArtifacts: readonly PhaseBuildSeedArtifact[];
  onBeforeBuild?: () => Promise<void>;
  onBuildSettled?: (result: BuildSettledResult) => Promise<void>;
}) {
  const [rows, setRows] = useState<DeliverableRow[]>(() =>
    buildInitialRows(specs, initialArtifacts),
  );
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [omittedDeliverables, setOmittedDeliverables] = useState<
    OmittedDeliverable[]
  >([]);
  const [adaptiveSummary, setAdaptiveSummary] = useState<{
    complexityTier?: string;
    signalBasis?: string;
    resolutionConfidence?: string;
  } | null>(null);
  const [handOffSentence, setHandOffSentence] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const startedAt = useRef<number>(0);
  // Last time each run's observable state changed, and the last state seen, so
  // the poll interval can back off on a run that is sitting still (queued behind
  // a serial worker) without backing off one that is actively advancing.
  const lastChangeAt = useRef<Record<string, number>>({});
  const lastSeenState = useRef<Record<string, string>>({});
  const initialArtifactSignature = initialArtifacts
    .map((artifact) =>
      [
        artifact.artifactId,
        artifact.deliverableTypeKey,
        artifact.documentTitle,
        artifact.phase,
        artifact.status,
        artifact.version,
        artifact.downloadUrl,
      ].join(":"),
    )
    .join("|");
  const rowSourceSignature = `${phaseNum}::${initialArtifactSignature}`;
  const lastRowSourceSignature = useRef(rowSourceSignature);
  // Set true only while a real batch is in flight, so the settle-detection
  // effect below never fires from the component's initial idle render or
  // from unrelated row updates.
  const runInFlight = useRef(false);

  useEffect(() => {
    const t = timers.current;
    return () => {
      Object.values(t).forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (runInFlight.current) return;
    if (lastRowSourceSignature.current === rowSourceSignature) return;
    lastRowSourceSignature.current = rowSourceSignature;
    setRows(buildInitialRows(specs, initialArtifacts));
  }, [initialArtifacts, rowSourceSignature, specs]);

  const patchRow = useCallback(
    (key: string, patch: Partial<DeliverableRow>) => {
      setRows((prev) =>
        prev.map((r) =>
          r.deliverableTypeKey === key ? { ...r, ...patch } : r,
        ),
      );
    },
    [],
  );

  // Stop following a run the server is still working on, and say so. Not a
  // failure and not a success: the row leaves the pending set (so the action is
  // usable again) without entering the settle path, and the in-flight guard is
  // released so a later artifact refresh can repair the view in place.
  const handOffRun = useCallback(
    (key: string) => {
      patchRow(key, { status: "handed_off" });
      runInFlight.current = false;
      setBuilding(false);
      setHandOffSentence(describeDeliverableRunHandOff(phaseLabel));
    },
    [patchRow, phaseLabel],
  );

  const scheduleNextPoll = useCallback(
    (key: string, runId: string, lastPollFailed: boolean, next: () => void) => {
      const now = Date.now();
      const plan = planDeliverableRunPoll({
        elapsedMs: now - startedAt.current,
        unchangedMs: now - (lastChangeAt.current[key] ?? startedAt.current),
        lastPollFailed,
      });
      if (plan.kind === "hand_off") {
        handOffRun(key);
        return;
      }
      timers.current[key] = setTimeout(next, plan.delayMs);
    },
    [handOffRun],
  );

  const poll = useCallback(
    async (key: string, runId: string) => {
      try {
        const res = await fetch(`/api/v1/deliverables/runs/${runId}`, {
          credentials: "include",
        });
        const data = (await res.json()) as RunStatusResponse & {
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        if (data.status === "queued" || data.status === "running") {
          patchRow(key, {
            status: data.status,
            progressPct: data.progressPct ?? 0,
            progressLabel: data.progressLabel ?? null,
            packageReadiness: data.packageReadiness ?? null,
            blockers: data.blockers ?? [],
          });
          const seen = deliverableRunObservationKey({
            status: data.status,
            progressPct: data.progressPct ?? 0,
            progressLabel: data.progressLabel ?? null,
          });
          if (lastSeenState.current[key] !== seen) {
            lastSeenState.current[key] = seen;
            lastChangeAt.current[key] = Date.now();
          }
          scheduleNextPoll(key, runId, false, () => void poll(key, runId));
          return;
        }
        // terminal
        patchRow(key, {
          status: data.status,
          progressPct: 100,
          artifactId: data.artifactId,
          blobUrl: data.blobUrl,
          packageReadiness: data.packageReadiness ?? null,
          blockers: data.blockers ?? [],
          error: data.error ?? undefined,
        });
      } catch {
        // A failed READ of the run says nothing about the run. Back off once and
        // keep following it.
        scheduleNextPoll(key, runId, true, () => void poll(key, runId));
      }
    },
    [patchRow, scheduleNextPoll],
  );

  // Fires onBuildSettled exactly once per batch, only after every queued run
  // has reached a terminal status. Never fires while anything is still
  // "queued" or "running" — this is the fix for the sequencing bug where the
  // parent used to submit gate approval the instant jobs were queued, before
  // generation had actually finished (or failed).
  useEffect(() => {
    if (!runInFlight.current) return;
    const relevant = rows.filter(
      (r) => r.runId !== null || r.status === "error",
    );
    if (relevant.length === 0) return;
    // A handed-off row has no verdict: the server may still be building it.
    // Settling on it would submit the phase gate approval against a partial
    // build set. (`handOffRun` also closes the batch by clearing the in-flight
    // ref above, so today this membership is belt-and-braces rather than the
    // branch that fires — it states the rule where the rule is read.)
    const stillPending = relevant.some(
      (r) =>
        r.status === "queued" ||
        r.status === "running" ||
        r.status === "handed_off",
    );
    if (stillPending) return;

    runInFlight.current = false;
    setBuilding(false);
    const succeeded: SettledDeliverable[] = relevant
      .filter((r) => r.status === "succeeded")
      .map((r) => ({
        deliverableTypeKey: r.deliverableTypeKey,
        gateArtifact: r.gateArtifact,
      }));
    const failed: SettledDeliverable[] = relevant
      .filter(
        (r) =>
          r.status === "blocked" ||
          r.status === "failed" ||
          r.status === "error",
      )
      .map((r) => ({
        deliverableTypeKey: r.deliverableTypeKey,
        gateArtifact: r.gateArtifact,
      }));
    void onBuildSettled?.({
      succeededKeys: succeeded.map((entry) => entry.deliverableTypeKey),
      failedKeys: failed.map((entry) => entry.deliverableTypeKey),
      total: relevant.length,
      succeeded,
      failed,
      source: "build",
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Gate approval failed");
    });
  }, [rows, onBuildSettled]);

  const approveAndBuild = useCallback(async () => {
    setError(null);
    setBuilding(true);
    runInFlight.current = true;
    startedAt.current = Date.now();
    // reset rows to queued-pending
    setOmittedDeliverables([]);
    setAdaptiveSummary(null);
    setHandOffSentence(null);
    lastChangeAt.current = {};
    lastSeenState.current = {};
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        runId: null,
        status: "queued",
        progressPct: 0,
        progressLabel: null,
        artifactId: null,
        blobUrl: null,
        packageReadiness: null,
        error: undefined,
      })),
    );

    try {
      await onBeforeBuild?.();
      const res = await fetch("/api/v1/deliverables/generate-phase", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          moveId,
          phase: phaseNum,
          useCaseArchetype: archetype,
          moveName,
          clientDisplayName,
        }),
      });
      const data = (await res.json()) as EnqueueResponse & {
        detail?: string;
        error?: string;
        requiredEvidenceGaps?: unknown;
      };
      if (!res.ok || !Array.isArray(data.deliverables)) {
        // `required_evidence_open` carries the open slots by name. Falling
        // straight to `detail` reported only their count, so the one item
        // holding the build was named nowhere.
        throw new Error(
          describeRequiredEvidenceRefusal(data) ??
            data.detail ??
            data.error ??
            `HTTP ${res.status}`,
        );
      }
      setAdaptiveSummary(data.adaptiveDepth ?? null);
      setOmittedDeliverables(data.omittedDeliverables ?? []);
      setRows(
        data.deliverables.map((d) => ({
          deliverableTypeKey: d.deliverableTypeKey,
          documentTitle: d.documentTitle,
          gateArtifact: d.gateArtifact,
          runId: d.runId,
          status: d.status === "error" ? "error" : "queued",
          progressPct: 0,
          progressLabel: null,
          artifactId: null,
          blobUrl: null,
          packageReadiness: null,
          blockers: [],
          error: d.error,
        })),
      );
      for (const d of data.deliverables) {
        if (d.runId && d.status === "queued") {
          // Poll immediately for first status, then the poll loop self-schedules.
          void poll(d.deliverableTypeKey, d.runId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve & Build failed");
      setRows((prev) => prev.map((r) => ({ ...r, status: "idle" })));
      setOmittedDeliverables([]);
      setAdaptiveSummary(null);
      runInFlight.current = false;
      setBuilding(false);
      return;
    }
    // Do NOT call onBuildSettled here — jobs were only just queued, not
    // completed. The settle-detection effect above fires it once every row
    // in this batch reaches a terminal status, reading from the same
    // persisted run-status polling this component already does.
  }, [
    moveId,
    phaseNum,
    archetype,
    moveName,
    clientDisplayName,
    onBeforeBuild,
    poll,
  ]);

  return {
    rows,
    building,
    error,
    setError,
    omittedDeliverables,
    adaptiveSummary,
    handOffSentence,
    approveAndBuild,
  };
}
