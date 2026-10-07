"use client";

// PhaseApproveAndBuild — the phase-level "Approve & Build" action.
//
// Replaces per-deliverable generate buttons with ONE governed action that builds
// every deliverable in the phase as a batch. It POSTs once to
// /api/v1/deliverables/generate-phase (enqueue-only → durable worker drains), then
// polls each returned run via GET /api/v1/deliverables/runs/{id} and shows a
// read-only status row per document (queued → running % → succeeded / below-gate).
//
// There is no isolated regenerate here: if an input changes, you re-run the phase
// (re-click Approve & Build) and re-approve — consistent with the staleness model.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  PHASE_CANONICAL_KEYS,
  DELIVERABLE_REGISTRY,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import { AI_DECISION_SUPPORT_WATERMARK } from "@/lib/ai-liability/human-decision-controls";
import {
  MOVES_AI_DRAFT_LABEL,
  MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT,
} from "@/lib/programs/deliverable-canvas-polish-view";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { GateApprovalConfirmDialog } from "@/components/strategic-moves/GateApprovalConfirmDialog";
import { currentPhaseRequiredEvidenceGaps } from "@/lib/programs/phase-progress-readiness";
import type { SettledDeliverable } from "@/lib/programs/phase-build-settlement";
import {
  deliverableRunObservationKey,
  describeDeliverableRunHandOff,
  planDeliverableRunPoll,
} from "@/lib/programs/deliverable-run-poll-plan";

const NAVY = "#1B2B5C";
const INK = "#1A1A18";
const MUTED = "#9AA3B2";
const LINE = "#e5e5e5";
const FRESH = "#3F7A5B"; // succeeded
const ATTENTION = "#B5852A"; // blocked / below gate
const STALE = "#B4513C"; // error / failed
const RUNNING = "#1D4ED8"; // queued / running

function finalDownloadUrl(url: string): string {
  if (!url.startsWith("/api/v1/artifacts/")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}format=docx`;
}

type RunStatus =
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

interface DeliverableRow {
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

interface EnqueueResponse {
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

interface OmittedDeliverable {
  deliverableTypeKey: string;
  documentTitle: string;
  applicability: string;
  reason: string;
  mergeInto?: string;
}

interface RunStatusResponse {
  status: RunStatus;
  artifactId: string | null;
  blobUrl: string | null;
  progressPct?: number;
  progressLabel?: string | null;
  blockers?: string[];
  error?: string | null;
  packageReadiness?: PackageReadiness | null;
}

interface PackageReadiness {
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

interface Props {
  moveId: string;
  phaseNum: number;
  phaseLabel: string;
  archetype: string;
  moveName: string;
  clientDisplayName: string;
  /** Optional readiness signal — number of Move-specific inputs uploaded for the phase. */
  inputCount?: number;
  /** Evidence gaps shown as phase/readiness guidance. Not a build blocker unless explicitly requested. */
  evidenceNeedPackets?: MoveEvidenceNeedPacket[];
  /** Some older callers pass current-phase evidence blockers. The phase workspace passes next-phase readiness, so default false. */
  blockOnEvidenceGaps?: boolean;
  /** Render the single build action in the active step header instead of beside the output list. */
  actionPortalTargetId?: string;
  /** Parent-owned prerequisite work, such as phase capture finalization. */
  onBeforeBuild?: () => Promise<void>;
  /**
   * Parent-owned phase-gate approval trigger. Fires ONCE every queued run in
   * this batch has reached a terminal status (succeeded/blocked/failed/error)
   * — never while a job is still queued or running. This is deliberate:
   * phase advancement must never be attempted while generation is still in
   * flight, and a failed/blocked deliverable must visibly block advancement
   * rather than being silently skipped. Completion is read from the same
   * persisted run-status rows the poll loop below reads, not from any
   * optimistic UI state.
   */
  onBuildSettled?: (result: BuildSettledResult) => Promise<void>;
  /** User-facing blocker owned by the parent, such as incomplete visible capture inputs. */
  disabledReason?: string | null;
  /** Display label for the signed-in session (e.g. "jane@client.com · Client admin"),
   *  shown in the pre-commit confirmation dialog. Purely a display of who the
   *  server already resolves the session to — never sent to the mutation itself. */
  approverLabel?: string | null;
  /** Current generated deliverables from the artifact registry, preloaded server-side. */
  initialArtifacts?: PhaseBuildArtifact[];
  /** Server-confirmed route-specific package, when the parent has one. */
  deliverableKeys?: readonly string[];
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
}

export interface PhaseBuildArtifact {
  artifactId: string;
  deliverableTypeKey: string;
  documentTitle: string;
  phase: number | null;
  status: string;
  version: number;
  downloadUrl: string;
}

const STATUS_COLOR: Record<RunStatus | "idle", string> = {
  idle: MUTED,
  queued: RUNNING,
  running: RUNNING,
  succeeded: FRESH,
  blocked: ATTENTION,
  failed: STALE,
  error: STALE,
  handed_off: ATTENTION,
};

const STATUS_LABEL: Record<RunStatus | "idle", string> = {
  idle: "Not built",
  queued: "Queued",
  running: "Building",
  succeeded: "Built",
  blocked: "Build blocked",
  failed: "Failed",
  error: "Could not start",
  handed_off: "Still building on the server",
};

function buildInitialRows(
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
    return {
      deliverableTypeKey: s.deliverableTypeKey,
      documentTitle: artifact?.documentTitle ?? s.documentTitle,
      gateArtifact: s.gateArtifact,
      runId: null,
      status: artifact ? "succeeded" : "idle",
      progressPct: artifact ? 100 : 0,
      progressLabel: null,
      artifactId: artifact?.artifactId ?? null,
      blobUrl: artifact?.downloadUrl ?? null,
      packageReadiness: null,
      blockers: [],
    };
  });
}

export function PhaseApproveAndBuild({
  moveId,
  phaseNum,
  phaseLabel,
  archetype,
  moveName,
  clientDisplayName,
  inputCount,
  evidenceNeedPackets = [],
  blockOnEvidenceGaps = false,
  actionPortalTargetId,
  onBeforeBuild,
  onBuildSettled,
  disabledReason = null,
  approverLabel = null,
  initialArtifacts = [],
  deliverableKeys,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionPortalTarget, setActionPortalTarget] =
    useState<HTMLElement | null>(null);
  const specs = useMemo(
    () =>
      (deliverableKeys ?? PHASE_CANONICAL_KEYS[phaseNum] ?? [])
        .map((key) =>
          DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key),
        )
        .filter(Boolean) as DeliverableSpec[],
    [deliverableKeys, phaseNum],
  );

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
  useEffect(() => {
    if (!actionPortalTargetId) return;
    setActionPortalTarget(
      document.getElementById(actionPortalTargetId) as HTMLElement | null,
    );
  }, [actionPortalTargetId]);
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
      };
      if (!res.ok || !Array.isArray(data.deliverables)) {
        throw new Error(data.detail ?? data.error ?? `HTTP ${res.status}`);
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

  if (specs.length === 0) {
    return (
      <div style={{ fontSize: 12, color: MUTED, fontStyle: "italic" }}>
        No deliverables configured for this phase.
      </div>
    );
  }

  const anyRunning = rows.some(
    (r) => r.status === "queued" || r.status === "running",
  );
  const builtCount = rows.filter((r) => r.status === "succeeded").length;
  const blockedCount = rows.filter(
    (r) =>
      r.status === "blocked" || r.status === "failed" || r.status === "error",
  ).length;
  const gateCount = specs.filter((s) => s.gateArtifact).length;
  const requiredGaps = currentPhaseRequiredEvidenceGaps(
    evidenceNeedPackets,
    phaseNum,
  );
  const hasEvidenceGuidanceGaps = requiredGaps.length > 0;
  const hasRequiredGaps = blockOnEvidenceGaps && hasEvidenceGuidanceGaps;
  const hasParentBlocker = Boolean(disabledReason);
  const buildLabel = hasRequiredGaps
    ? "Final build blocked by required evidence"
    : hasParentBlocker
      ? "Complete phase inputs before build"
      : builtCount > 0
        ? `Re-run & Build ${phaseLabel} →`
        : `Approve & Build ${phaseLabel} →`;
  const phaseStatusLine = handOffSentence
    ? handOffSentence
    : anyRunning
      ? `Building ${phaseLabel}. Keep this page open while the governed batch finishes.`
      : hasParentBlocker
        ? String(disabledReason)
        : hasRequiredGaps
          ? `${requiredGaps.length} required evidence item${requiredGaps.length === 1 ? "" : "s"} must be covered before final build.`
          : blockedCount > 0
            ? `${blockedCount} output${blockedCount === 1 ? "" : "s"} blocked by evidence or build-quality checks before the phase can advance.`
            : builtCount === specs.length
              ? `${phaseLabel} documents are built. Review them before relying on them.`
              : "Capture is separate from gate readiness. Build once the record is ready for review.";

  const buildActionButton = (
    <button
      type="button"
      onClick={() => setConfirmOpen(true)}
      disabled={building || anyRunning || hasRequiredGaps || hasParentBlocker}
      className="mxw-phase-progress-button"
      style={{
        padding: "10px 16px",
        background:
          building || anyRunning || hasParentBlocker ? "#D8DDE5" : "#147C5B",
        color:
          building || anyRunning || hasParentBlocker ? "#596579" : "#FFFFFF",
        border: "1px solid transparent",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 800,
        cursor:
          building || anyRunning || hasRequiredGaps || hasParentBlocker
            ? "default"
            : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {anyRunning ? `Building ${phaseLabel}…` : buildLabel}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* One clear phase action panel. Detailed evidence stays available below. */}
      <div
        style={{
          padding: "14px 16px",
          backgroundColor: "rgba(27,43,92,0.04)",
          border: "1px solid rgba(27,43,92,0.14)",
          borderRadius: 8,
          color: NAVY,
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ minWidth: 220, flex: "1 1 320px" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#61708D",
              }}
            >
              Phase build
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 15,
                fontWeight: 700,
                color: INK,
              }}
            >
              {phaseStatusLine}
            </div>
            <div style={{ marginTop: 6, color: "#525866" }}>
              {AI_DECISION_SUPPORT_WATERMARK}.{" "}
              {MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <StatusPill tone={builtCount === specs.length ? "good" : "neutral"}>
              {builtCount}/{specs.length} built
            </StatusPill>
            <StatusPill tone="neutral">
              {gateCount} gate artifact{gateCount === 1 ? "" : "s"}
            </StatusPill>
            {typeof inputCount === "number" && (
              <StatusPill tone="neutral">
                {inputCount} input{inputCount === 1 ? "" : "s"}
              </StatusPill>
            )}
          </div>
        </div>
        {hasEvidenceGuidanceGaps && (
          <details style={{ marginTop: 10, color: "#5C4320" }}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>
              {hasRequiredGaps
                ? `${requiredGaps.length} required evidence item${requiredGaps.length === 1 ? "" : "s"} open`
                : `${requiredGaps.length} prep item${requiredGaps.length === 1 ? "" : "s"} carrying forward`}
            </summary>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {hasRequiredGaps ? (
                <p style={{ margin: 0 }}>
                  Final build stays blocked until each required item is reviewed
                  and covered.
                </p>
              ) : (
                <p style={{ margin: 0 }}>
                  These items inform the next phase and do not block this phase
                  build.
                </p>
              )}
              {requiredGaps.map((packet) => {
                const acceptedFormats =
                  packet.acceptedFormats?.filter(Boolean) ?? [];
                const evidenceTitles =
                  packet.evidenceTitles?.filter(Boolean) ?? [];
                const exampleContent =
                  packet.exampleContent?.filter(Boolean) ?? [];
                const title = packet.evidenceSlot || packet.familyId;

                return (
                  <section
                    key={`${packet.familyId}-${packet.phase ?? "unphased"}-${packet.artifactType ?? "evidence"}`}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#FFFFFF",
                      border: `1px solid ${LINE}`,
                      borderRadius: 6,
                      color: INK,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 6,
                      }}
                    >
                      <strong>{title}</strong>
                      <span
                        style={{
                          color: ATTENTION,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {hasRequiredGaps
                          ? "Required · Not yet covered"
                          : "Preparation · Not yet covered"}
                      </span>
                    </div>
                    {packet.nextAction && (
                      <p style={{ margin: "7px 0 0", lineHeight: 1.45 }}>
                        <strong>Next action:</strong> {packet.nextAction}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px 16px",
                        marginTop: 6,
                        color: "#525866",
                        fontSize: 11,
                      }}
                    >
                      {packet.ownerSource && (
                        <span>Likely source owner: {packet.ownerSource}</span>
                      )}
                      {acceptedFormats.length > 0 && (
                        <span>
                          Accepted formats: {acceptedFormats.join(", ")}
                        </span>
                      )}
                    </div>
                    {evidenceTitles.length > 0 && (
                      <p
                        style={{
                          margin: "6px 0 0",
                          color: "#525866",
                          fontSize: 11,
                        }}
                      >
                        On file, not yet cleared: {evidenceTitles.join(", ")}
                      </p>
                    )}
                    {(packet.whyItMatters ||
                      packet.exampleTemplate ||
                      exampleContent.length > 0) && (
                      <details style={{ marginTop: 7 }}>
                        <summary
                          style={{
                            cursor: "pointer",
                            color: NAVY,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Why this matters and examples
                        </summary>
                        <div
                          style={{
                            marginTop: 6,
                            color: "#525866",
                            fontSize: 11,
                          }}
                        >
                          {packet.whyItMatters && (
                            <p style={{ margin: "0 0 6px" }}>
                              {packet.whyItMatters}
                            </p>
                          )}
                          {packet.exampleTemplate && (
                            <p style={{ margin: "0 0 4px" }}>
                              Example format: {packet.exampleTemplate}
                            </p>
                          )}
                          {exampleContent.length > 0 && (
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {exampleContent.map((example) => (
                                <li key={example}>{example}</li>
                              ))}
                            </ul>
                          )}
                          <p style={{ margin: "6px 0 0", fontStyle: "italic" }}>
                            Examples are guidance, not client evidence.
                          </p>
                        </div>
                      </details>
                    )}
                  </section>
                );
              })}
            </div>
          </details>
        )}
        {omittedDeliverables.length > 0 && (
          <details style={{ marginTop: 10, color: "#3D4A60" }}>
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>
              Package adjusted: {omittedDeliverables.length} artifact
              {omittedDeliverables.length === 1 ? "" : "s"} merged or omitted
            </summary>
            <div style={{ marginTop: 6 }}>
              {adaptiveSummary?.complexityTier && (
                <div style={{ marginBottom: 6 }}>
                  Depth: {adaptiveSummary.complexityTier}
                  {adaptiveSummary.resolutionConfidence
                    ? ` · ${adaptiveSummary.resolutionConfidence} confidence`
                    : ""}
                  {adaptiveSummary.signalBasis
                    ? ` · ${adaptiveSummary.signalBasis.replace(/_/g, " ")}`
                    : ""}
                </div>
              )}
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {omittedDeliverables.map((item) => (
                  <li key={item.deliverableTypeKey}>
                    <strong>{item.documentTitle}</strong>:{" "}
                    {item.applicability === "merge_into_parent" &&
                    item.mergeInto
                      ? `merged into ${item.mergeInto.replace(/_/g, " ")}`
                      : item.applicability.replace(/_/g, " ")}
                    . {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}
      </div>

      {/* Evidence gaps suppress the progression action; the step header still explains why. */}
      {actionPortalTargetId
        ? !hasRequiredGaps &&
          actionPortalTarget &&
          createPortal(buildActionButton, actionPortalTarget)
        : buildActionButton}

      <GateApprovalConfirmDialog
        open={confirmOpen}
        title={`Approve & build ${phaseLabel}?`}
        summary={`This authorizes a governed build of all ${specs.length} ${phaseLabel} deliverable${specs.length === 1 ? "" : "s"} in one batch. It does not approve the generated document${specs.length === 1 ? "" : "s"} or the phase gate. The authorized Move user reviews each required deliverable in Files & Evidence, then approves the ready phase gate. There is no per-document regenerate afterward — if an input changes, you'll re-run the whole phase build.`}
        approverLabel={approverLabel}
        actorLabelPrefix="Authorizing build as"
        confirmLabel="Approve & Build"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void approveAndBuild();
        }}
      />

      {error && <div style={{ fontSize: 12, color: STALE }}>{error}</div>}

      {/* Read-only per-deliverable status — no isolated generate buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r) => (
          <div
            key={r.deliverableTypeKey}
            style={{
              display: "grid",
              gridTemplateColumns: "8px minmax(0, 1fr) auto",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              background: "#FFFFFF",
              border: `1px solid ${LINE}`,
              borderLeft: `3px solid ${r.gateArtifact ? NAVY : LINE}`,
              borderRadius: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: STATUS_COLOR[r.status],
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>
                  {r.documentTitle}
                </span>
                {r.gateArtifact && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      color: NAVY,
                      backgroundColor: "rgba(27,43,92,0.07)",
                      border: "1px solid rgba(27,43,92,0.18)",
                      padding: "1px 5px",
                      borderRadius: 3,
                      fontFamily: "JetBrains Mono, monospace",
                      textTransform: "uppercase",
                    }}
                  >
                    Gate
                  </span>
                )}
              </div>
              {(r.status === "running" || r.status === "queued") && (
                <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>
                  {r.progressLabel ?? STATUS_LABEL[r.status]}
                  {r.status === "running" ? ` · ${r.progressPct}%` : ""}
                </div>
              )}
              {r.status === "error" && r.error && (
                <div style={{ fontSize: 10.5, color: STALE, marginTop: 2 }}>
                  {r.error}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: STATUS_COLOR[r.status],
              }}
            >
              {STATUS_LABEL[r.status]}
            </span>
            {r.status === "succeeded" && r.blobUrl && (
              <Link
                href={finalDownloadUrl(r.blobUrl)}
                style={{
                  gridColumn: "2 / -1",
                  justifySelf: "start",
                  fontSize: 11,
                  color: NAVY,
                  fontWeight: 600,
                }}
                target="_blank"
              >
                Download final →
              </Link>
            )}
            {r.status === "blocked" &&
              (r.packageReadiness || r.blockers.length > 0 || r.error) && (
                <details
                  style={{
                    gridColumn: "2 / -1",
                    marginTop: 2,
                    color: "#5C4320",
                    fontSize: 11.5,
                    lineHeight: 1.45,
                  }}
                >
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                    Why this output is blocked
                  </summary>
                  <div
                    style={{
                      marginTop: 8,
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: "1px solid rgba(181,133,42,0.24)",
                      background: "rgba(181,133,42,0.06)",
                    }}
                  >
                    {r.packageReadiness && (
                      <>
                        <div style={{ color: ATTENTION, fontWeight: 700 }}>
                          {r.packageReadiness.headline}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          Evidence retrieved:{" "}
                          {r.packageReadiness.retrievedEvidence}/
                          {r.packageReadiness.minimumEvidenceItems} · Readiness:{" "}
                          {r.packageReadiness.executiveReadinessPct}%
                        </div>
                      </>
                    )}
                    {(r.blockers.length > 0 || r.error) && (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontWeight: 700 }}>Build blocker: </span>
                        {r.blockers.length > 0
                          ? r.blockers.join("; ")
                          : r.error}
                      </div>
                    )}
                    {r.packageReadiness?.missing.length ? (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontWeight: 700 }}>Evidence gaps: </span>
                        {r.packageReadiness.missing.slice(0, 3).join("; ")}
                        {r.packageReadiness.missing.length > 3 ? "…" : ""}
                      </div>
                    ) : null}
                    {r.packageReadiness?.recommendedNextStep && (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontWeight: 700 }}>Next: </span>
                        {r.packageReadiness.recommendedNextStep}
                      </div>
                    )}
                  </div>
                </details>
              )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: MUTED }}>
        <span>{MOVES_AI_DRAFT_LABEL}</span> — review and edit every document
        before it informs a decision.
      </div>
    </div>
  );
}

function StatusPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "good" | "neutral";
}) {
  return (
    <span
      style={{
        borderRadius: 999,
        border:
          tone === "good"
            ? "1px solid rgba(63,122,91,0.24)"
            : "1px solid rgba(27,43,92,0.14)",
        background:
          tone === "good" ? "rgba(63,122,91,0.08)" : "rgba(255,255,255,0.78)",
        color: tone === "good" ? FRESH : NAVY,
        fontSize: 11,
        fontWeight: 700,
        padding: "5px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
