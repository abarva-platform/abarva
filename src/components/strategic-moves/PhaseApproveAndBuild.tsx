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

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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

const NAVY = "#1B2B5C";
const INK = "#1A1A18";
const MUTED = "#9AA3B2";
const LINE = "#e5e5e5";
const FRESH = "#3F7A5B"; // succeeded
const ATTENTION = "#B5852A"; // blocked / below gate
const STALE = "#B4513C"; // error / failed
const RUNNING = "#1D4ED8"; // queued / running

type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "blocked"
  | "failed"
  | "error";

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
  error?: string;
}

interface EnqueueResponse {
  phase: number;
  phaseLabel: string;
  queued: number;
  total: number;
  deliverables: Array<{
    deliverableTypeKey: string;
    documentTitle: string;
    gateArtifact: boolean;
    runId: string | null;
    status: "queued" | "error";
    error?: string;
  }>;
}

interface RunStatusResponse {
  status: RunStatus;
  artifactId: string | null;
  blobUrl: string | null;
  progressPct?: number;
  progressLabel?: string | null;
  blockers?: string[];
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
}

export interface BuildSettledResult {
  /** deliverableTypeKeys that reached status "succeeded". */
  succeededKeys: string[];
  /** deliverableTypeKeys that reached "blocked", "failed", or "error". */
  failedKeys: string[];
  /** Total deliverables in this batch (succeeded + failed + anything else terminal). */
  total: number;
}

const POLL_MS = 4000;
const MAX_MS = 15 * 60 * 1000;

const STATUS_COLOR: Record<RunStatus | "idle", string> = {
  idle: MUTED,
  queued: RUNNING,
  running: RUNNING,
  succeeded: FRESH,
  blocked: ATTENTION,
  failed: STALE,
  error: STALE,
};

const STATUS_LABEL: Record<RunStatus | "idle", string> = {
  idle: "Not built",
  queued: "Queued",
  running: "Building",
  succeeded: "Gate-ready",
  blocked: "Not gate-ready",
  failed: "Failed",
  error: "Could not start",
};

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
  onBeforeBuild,
  onBuildSettled,
  disabledReason = null,
  approverLabel = null,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const specs = (PHASE_CANONICAL_KEYS[phaseNum] ?? [])
    .map((key) =>
      DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key),
    )
    .filter(Boolean) as DeliverableSpec[];

  const [rows, setRows] = useState<DeliverableRow[]>(() =>
    specs.map((s) => ({
      deliverableTypeKey: s.deliverableTypeKey,
      documentTitle: s.documentTitle,
      gateArtifact: s.gateArtifact,
      runId: null,
      status: "idle",
      progressPct: 0,
      progressLabel: null,
      artifactId: null,
      blobUrl: null,
      packageReadiness: null,
    })),
  );
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const startedAt = useRef<number>(0);
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
          });
          if (Date.now() - startedAt.current < MAX_MS) {
            timers.current[key] = setTimeout(
              () => void poll(key, runId),
              POLL_MS,
            );
          }
          return;
        }
        // terminal
        patchRow(key, {
          status: data.status,
          progressPct: 100,
          artifactId: data.artifactId,
          blobUrl: data.blobUrl,
          packageReadiness: data.packageReadiness ?? null,
        });
      } catch {
        // transient — back off and retry within the window
        if (Date.now() - startedAt.current < MAX_MS) {
          timers.current[key] = setTimeout(
            () => void poll(key, runId),
            POLL_MS * 2,
          );
        }
      }
    },
    [patchRow],
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
    const stillPending = relevant.some(
      (r) => r.status === "queued" || r.status === "running",
    );
    if (stillPending) return;

    runInFlight.current = false;
    setBuilding(false);
    const succeededKeys = relevant
      .filter((r) => r.status === "succeeded")
      .map((r) => r.deliverableTypeKey);
    const failedKeys = relevant
      .filter(
        (r) =>
          r.status === "blocked" ||
          r.status === "failed" ||
          r.status === "error",
      )
      .map((r) => r.deliverableTypeKey);
    void onBuildSettled?.({
      succeededKeys,
      failedKeys,
      total: relevant.length,
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
      for (const d of data.deliverables) {
        patchRow(d.deliverableTypeKey, {
          runId: d.runId,
          status: d.status === "error" ? "error" : "queued",
          error: d.error,
          packageReadiness: null,
        });
        if (d.runId && d.status === "queued") {
          // Poll immediately for first status, then the poll loop self-schedules.
          void poll(d.deliverableTypeKey, d.runId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve & Build failed");
      setRows((prev) => prev.map((r) => ({ ...r, status: "idle" })));
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
    patchRow,
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
  const gateCount = specs.filter((s) => s.gateArtifact).length;
  const requiredGaps = evidenceNeedPackets.filter(
    (packet) => packet.priority === "required" && packet.status !== "covered",
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Governance + readiness header */}
      <div
        style={{
          padding: "10px 12px",
          backgroundColor: "rgba(27,43,92,0.04)",
          border: "1px solid rgba(27,43,92,0.14)",
          borderRadius: 6,
          color: NAVY,
          fontSize: 11,
          lineHeight: 1.45,
        }}
      >
        <strong>{AI_DECISION_SUPPORT_WATERMARK}</strong>
        <div>{MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT}</div>
        <div style={{ marginTop: 4, color: "#525866" }}>
          Approve &amp; Build generates every {phaseLabel} deliverable in one
          governed batch — planning the structure, writing each document section
          by section, then assembling and quality-checking it. Documents below
          the board-grade bar are held back, not shipped. There is no
          per-document regenerate: if an input changes, re-run the phase and
          re-approve.
        </div>
        <div
          style={{
            marginTop: 6,
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            fontSize: 11,
            color: "#525866",
          }}
        >
          <span>
            {specs.length} deliverables ({gateCount} gate)
          </span>
          {typeof inputCount === "number" && (
            <span>
              {inputCount} input{inputCount === 1 ? "" : "s"} available
            </span>
          )}
          <span>
            {builtCount}/{specs.length} gate-ready
          </span>
          {hasEvidenceGuidanceGaps && (
            <span style={{ color: ATTENTION }}>
              {requiredGaps.length} required next-phase prep item
              {requiredGaps.length === 1 ? "" : "s"}
            </span>
          )}
          {hasParentBlocker && (
            <span style={{ color: ATTENTION }}>{disabledReason}</span>
          )}
        </div>
        {hasEvidenceGuidanceGaps && (
          <div style={{ marginTop: 6, color: ATTENTION }}>
            These items are carried forward as next-phase preparation. They do
            not block this phase&apos;s governed build unless the phase
            explicitly marks them as current-phase blockers.
          </div>
        )}
        {hasParentBlocker && (
          <div style={{ marginTop: 6, color: ATTENTION }}>{disabledReason}</div>
        )}
      </div>

      {/* The single phase action */}
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={building || anyRunning || hasRequiredGaps || hasParentBlocker}
        style={{
          alignSelf: "flex-start",
          padding: "9px 16px",
          background:
            building || anyRunning || hasRequiredGaps || hasParentBlocker
              ? "#C9C7BE"
              : NAVY,
          color: "#FFFFFF",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor:
            building || anyRunning || hasRequiredGaps || hasParentBlocker
              ? "default"
              : "pointer",
          fontFamily: "Fraunces, Georgia, serif",
        }}
      >
        {anyRunning ? `Building ${phaseLabel}…` : buildLabel}
      </button>

      <GateApprovalConfirmDialog
        open={confirmOpen}
        title={`Approve & build ${phaseLabel}?`}
        summary={`This generates all ${specs.length} ${phaseLabel} deliverable${specs.length === 1 ? "" : "s"} in one governed batch and closes the phase gate once every document reaches a terminal state. There is no per-document regenerate afterward — if an input changes, you'll re-run and re-approve the whole phase.`}
        approverLabel={approverLabel}
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
              gridTemplateColumns: "8px minmax(0, 1fr) auto auto",
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
                href={r.blobUrl}
                style={{ fontSize: 11, color: NAVY, fontWeight: 600 }}
                target="_blank"
              >
                Open →
              </Link>
            )}
            {r.status === "blocked" && r.packageReadiness && (
              <div
                style={{
                  gridColumn: "2 / -1",
                  marginTop: 2,
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(181,133,42,0.28)",
                  background: "rgba(181,133,42,0.07)",
                  color: "#5C4320",
                  fontSize: 11.5,
                  lineHeight: 1.45,
                }}
              >
                <div style={{ fontWeight: 700, color: ATTENTION }}>
                  Output is not gate-ready
                </div>
                <div>{r.packageReadiness.headline}</div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  <ReadinessMetric
                    label="Evidence"
                    value={`${r.packageReadiness.retrievedEvidence}/${r.packageReadiness.minimumEvidenceItems}`}
                    detail={`${r.packageReadiness.evidenceCoveragePct}% covered`}
                  />
                  <ReadinessMetric
                    label="Readiness"
                    value={`${r.packageReadiness.executiveReadinessPct}%`}
                    detail={r.packageReadiness.confidenceLabel}
                  />
                </div>
                {r.packageReadiness.missing.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontWeight: 700 }}>Missing: </span>
                    {r.packageReadiness.missing.join("; ")}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontWeight: 700 }}>Next: </span>
                  {r.packageReadiness.recommendedNextStep}
                </div>
              </div>
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

function ReadinessMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: "4px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(181,133,42,0.18)",
        display: "inline-flex",
        alignItems: "baseline",
        gap: 5,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#8A6728",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: INK,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#6F6047", overflowWrap: "anywhere" }}>{detail}</div>
    </div>
  );
}
