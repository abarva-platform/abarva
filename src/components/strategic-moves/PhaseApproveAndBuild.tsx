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

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { DeliverableApprovalAction } from "@/components/strategic-moves/DeliverableApprovalAction";
import { currentPhaseRequiredEvidenceGaps } from "@/lib/programs/phase-progress-readiness";
import { resolvePhaseBuildBlock } from "@/lib/programs/phase-build-action-state";
import { describeGateSignOffReadback } from "@/lib/programs/gate-sign-off-readback";
import { planPhaseGateSubmitWithoutBuild } from "@/lib/programs/phase-build-settlement";
import {
  usePhaseDocumentBuild,
  type BuildSettledResult,
  type DeliverableRow,
  type RunStatus,
} from "@/components/strategic-moves/use-phase-document-build";

const NAVY = "#1B2B5C";
const INK = "#1A1A18";
const MUTED = "#9AA3B2";
const LINE = "#e5e5e5";
const FRESH = "#3F7A5B"; // succeeded
const ATTENTION = "#B5852A"; // blocked / below gate
const STALE = "#B4513C"; // error / failed
const RUNNING = "#1D4ED8"; // queued / running
const SIGNED_TEAL = "#1d9e75"; // gate deliverable signed off (v3 locked-light teal)
const AMBER = "#ba7517"; // sign-off still owed (v3 locked-light amber)

function finalDownloadUrl(url: string): string {
  if (!url.startsWith("/api/v1/artifacts/")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}format=docx`;
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
  /** Whether the signed-in session may approve gates. Gates the sign-off
   *  buttons in the in-workspace attestation ledger: a non-approver sees
   *  sign-off state only, never a disabled approve button. */
  canApproveGates?: boolean;
  /**
   * Health of the read that supplied the sign-off columns on `initialArtifacts`
   * (`deliverableId` / `currentVersion` / `signedOffVersion`). Those columns
   * come only from `GET .../artifacts`, which reads the deliverables_v2
   * projection separately and reports it as `deliverableSignOffStatus`.
   *
   * Absent means no such read has completed for these rows — which is the
   * truth for a host that passes the server-rendered artifact list, since that
   * list carries no sign-off columns at all. Treating absence as a successful
   * read is what let the ledger report every gate document as having no
   * sign-off tracked. See `gate-sign-off-readback.ts`.
   */
  signOffReadback?: {
    completed?: boolean;
    loadFailed?: boolean;
    deliverableSignOffStatus?: unknown;
  };
}

export type { BuildSettledResult } from "@/components/strategic-moves/use-phase-document-build";

export interface PhaseBuildArtifact {
  artifactId: string;
  deliverableTypeKey: string;
  documentTitle: string;
  phase: number | null;
  status: string;
  version: number;
  downloadUrl: string;
  /** deliverables_v2.id — the row DeliverableApprovalAction signs off against. */
  deliverableId?: string | null;
  /** deliverables_v2.signed_off_version — equals currentVersion once signed. */
  signedOffVersion?: number | null;
  /** deliverables_v2.current_version — the version a sign-off must match. */
  currentVersion?: number | null;
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
  canApproveGates = false,
  signOffReadback,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gateSubmitConfirmOpen, setGateSubmitConfirmOpen] = useState(false);
  const [submittingGate, setSubmittingGate] = useState(false);
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

  const {
    rows,
    building,
    error,
    setError,
    omittedDeliverables,
    adaptiveSummary,
    handOffSentence,
    approveAndBuild,
  } = usePhaseDocumentBuild({
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
  });
  useEffect(() => {
    if (!actionPortalTargetId) return;
    setActionPortalTarget(
      document.getElementById(actionPortalTargetId) as HTMLElement | null,
    );
  }, [actionPortalTargetId]);

  // The gate approval must be submittable WITHOUT a rebuild. Rebuilding is the
  // one thing that undoes the sign-off two HARD gate checks are waiting for, so
  // "re-run Approve & Build" cannot be the only forward control once the
  // documents exist. `planPhaseGateSubmitWithoutBuild` owns the decision and the
  // wording; this component only reports what it knows about each document.
  const artifactStatusByKey = useMemo(() => {
    const byKey = new Map<string, string | null>();
    for (const artifact of initialArtifacts) {
      if (!artifact.deliverableTypeKey) continue;
      if (byKey.has(artifact.deliverableTypeKey)) continue;
      byKey.set(artifact.deliverableTypeKey, artifact.status ?? null);
    }
    return byKey;
  }, [initialArtifacts]);
  const gateSubmitPlan = useMemo(
    () =>
      planPhaseGateSubmitWithoutBuild({
        phase: phaseNum,
        phaseLabel,
        documents: specs.map((spec) => ({
          deliverableTypeKey: spec.deliverableTypeKey,
          documentTitle: spec.documentTitle,
          gateArtifact: spec.gateArtifact,
        })),
        states: rows.map((row) => ({
          deliverableTypeKey: row.deliverableTypeKey,
          status: row.status,
          // A row carrying a runId was watched in this session, so its status is
          // the fresher fact; the seeded artifact status would be stale.
          artifactStatus: row.runId
            ? null
            : (artifactStatusByKey.get(row.deliverableTypeKey) ?? null),
        })),
        buildInFlight:
          building ||
          rows.some(
            (row) => row.status === "queued" || row.status === "running",
          ),
      }),
    [phaseNum, phaseLabel, specs, rows, artifactStatusByKey, building],
  );

  // Per-deliverable sign-off state from the deliverables_v2 projection the
  // artifacts route now carries through each PhaseBuildArtifact. Keyed like the
  // other initialArtifacts maps so the gate attestation ledger can show
  // sign-off state inline. A row the projection does not cover has null
  // version fields, which the ledger treats as "no sign-off record to target"
  // (not as unsigned) — so it never blocks a submission the way a known-unsigned
  // built gate document does.
  //
  // That null shape is reached BOTH by a projection that holds no row and by a
  // projection nothing read, and the two are not the same claim. Which one it
  // is comes from `signOffReadback`, not from these rows — see
  // `signOffReadbackState` below.
  const signOffByKey = useMemo(() => {
    const byKey = new Map<
      string,
      {
        deliverableId: string | null;
        signedOffVersion: number | null;
        currentVersion: number | null;
      }
    >();
    for (const artifact of initialArtifacts) {
      if (!artifact.deliverableTypeKey) continue;
      if (byKey.has(artifact.deliverableTypeKey)) continue;
      byKey.set(artifact.deliverableTypeKey, {
        deliverableId: artifact.deliverableId ?? null,
        signedOffVersion: artifact.signedOffVersion ?? null,
        currentVersion: artifact.currentVersion ?? null,
      });
    }
    return byKey;
  }, [initialArtifacts]);

  if (specs.length === 0) {
    return (
      <div style={{ fontSize: 12, color: MUTED, fontStyle: "italic" }}>
        No deliverables configured for this phase.
      </div>
    );
  }

  // What the sign-off column beside each gate document is allowed to assert.
  // The columns ride on `initialArtifacts` and only one read supplies them, so
  // their absence is ambiguous: no record, or no read. An absent prop is the
  // un-read case, never the healthy one.
  const signOffReadbackState = describeGateSignOffReadback(
    signOffReadback ?? {},
  );

  const anyRunning = rows.some(
    (r) => r.status === "queued" || r.status === "running",
  );
  const builtCount = rows.filter((r) => r.status === "succeeded").length;
  const blockedCount = rows.filter(
    (r) =>
      r.status === "blocked" || r.status === "failed" || r.status === "error",
  ).length;
  const gateCount = specs.filter((s) => s.gateArtifact).length;

  // The attestation ledger: ONE entry per gate deliverable actually in the
  // current build set (so a merged/omitted deliverable is not listed), joining
  // its build row (status / download) with its deliverables_v2 sign-off state.
  // This is the in-workspace equivalent of the /evidence page's "Signed off"
  // badge + DeliverableApprovalAction, so a presenter can sign off without
  // leaving the gate step. Reading from `rows` rather than `specs` keeps the
  // ledger in step with what the build produced.
  const gateLedgerEntries = rows
    .filter((row) => row.gateArtifact)
    .map((row) => {
      const signOff = signOffByKey.get(row.deliverableTypeKey);
      const currentVersion = signOff?.currentVersion ?? null;
      const signedOffVersion = signOff?.signedOffVersion ?? null;
      const deliverableId = signOff?.deliverableId ?? null;
      const built = row.status === "succeeded";
      const hasSignOffRecord = currentVersion != null && Boolean(deliverableId);
      const isSigned = hasSignOffRecord && signedOffVersion === currentVersion;
      // State the ledger renders. "unverified" = built but the row carries no
      // deliverables_v2 sign-off record (nothing to show and nothing to block
      // on). Whether that means the projection HOLDS no record or that nothing
      // read it is `signOffReadbackState`'s job, and it decides what this state
      // is allowed to say. "draft" = built, has a record, not signed.
      const state: "signed" | "draft" | "unverified" | "blocked" = isSigned
        ? "signed"
        : built && hasSignOffRecord
          ? "draft"
          : built
            ? "unverified"
            : "blocked";
      return {
        deliverableTypeKey: row.deliverableTypeKey,
        documentTitle: row.documentTitle,
        state,
        deliverableId,
        signedVersion: currentVersion,
        row,
      };
    });
  const ledgerGateCount = gateLedgerEntries.length;
  const signedCount = gateLedgerEntries.filter(
    (entry) => entry.state === "signed",
  ).length;
  // Only a known-unsigned built document holds the submit control here.
  // Unverified and not-yet-built rows still fall through to the existing
  // server gate/build-set checks, but neither is a recorded sign-off.
  const knownUnsignedCount = gateLedgerEntries.filter(
    (entry) => entry.state === "draft",
  ).length;
  // The submission must not read as actionable while a built gate document is
  // sitting unsigned. This narrows the existing submit control's feedback only
  // — it never widens WHEN the gate POST fires beyond refusing an unsigned set.
  const needsGateSignOff = knownUnsignedCount > 0;

  const requiredGaps = currentPhaseRequiredEvidenceGaps(
    evidenceNeedPackets,
    phaseNum,
  );
  const hasEvidenceGuidanceGaps = requiredGaps.length > 0;
  const hasRequiredGaps = blockOnEvidenceGaps && hasEvidenceGuidanceGaps;
  const hasParentBlocker = Boolean(disabledReason);
  // One resolution of what holds the build, for the control's disabled state,
  // its colours, its cursor, its label and the sentence beside it. The colours
  // used to read a SHORTER condition than the attribute — they omitted the
  // required-evidence term — so an inert button was painted in the live
  // primary green. See `phase-build-action-state`.
  const buildBlock = resolvePhaseBuildBlock({
    building,
    anyRunning,
    parentBlockerText: disabledReason,
    requiredEvidenceGapCount: hasRequiredGaps ? requiredGaps.length : 0,
    phaseLabel,
  });
  const buildHeld = buildBlock !== null;
  const buildLabel =
    buildBlock?.actionLabel ??
    // A document already on the record makes this a re-run, whether that
    // document built or is held below gate. A held row's own blocker
    // sentence tells the reader to re-run, so the control it names has to
    // read as a re-run rather than as a first build.
    (builtCount > 0 || blockedCount > 0
      ? `Re-run & Build ${phaseLabel} →`
      : `Approve & Build ${phaseLabel} →`);
  const phaseStatusLine =
    handOffSentence ??
    buildBlock?.statusLine ??
    (blockedCount > 0
      ? `${blockedCount} output${blockedCount === 1 ? "" : "s"} blocked by evidence or build-quality checks before the phase can advance.`
      : builtCount === specs.length
        ? `${phaseLabel} documents are built. Review them before relying on them.`
        : "Capture is separate from gate readiness. Build once the record is ready for review.");

  const submitGateWithoutBuild = async () => {
    if (!gateSubmitPlan.submittable) return;
    // A built gate document that is not signed off holds the submission. The
    // sign-off control lives in the ledger below; submitting here would only
    // bounce off the gate's HARD sign-off check.
    if (needsGateSignOff) return;
    setError(null);
    setSubmittingGate(true);
    try {
      await onBuildSettled?.({
        succeededKeys: gateSubmitPlan.settled.map(
          (entry) => entry.deliverableTypeKey,
        ),
        failedKeys: [],
        total: gateSubmitPlan.total,
        succeeded: gateSubmitPlan.settled,
        failed: [],
        source: "existing_documents",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gate approval failed");
    } finally {
      setSubmittingGate(false);
    }
  };

  const submitUnsignedCount = knownUnsignedCount;
  const gateSubmitDisabled =
    submittingGate || hasParentBlocker || needsGateSignOff;
  const gateSubmitActionButton = gateSubmitPlan.submittable ? (
    <button
      type="button"
      onClick={() => setGateSubmitConfirmOpen(true)}
      disabled={gateSubmitDisabled}
      style={{
        padding: "10px 16px",
        background: gateSubmitDisabled ? "#D8DDE5" : "#FFFFFF",
        color: gateSubmitDisabled ? "#596579" : NAVY,
        border: `1px solid ${gateSubmitDisabled ? "#D8DDE5" : "rgba(27,43,92,0.35)"}`,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: gateSubmitDisabled ? "default" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {submittingGate
        ? "Submitting gate approval…"
        : needsGateSignOff
          ? `Sign off ${submitUnsignedCount} document${submitUnsignedCount === 1 ? "" : "s"} to submit →`
          : gateSubmitPlan.actionLabel}
    </button>
  ) : null;

  // Amber reason line travelling with the submit button whenever a built gate
  // document is still unsigned, pointing the user at the ledger that holds the
  // sign-off control.
  const gateSubmitBlockedReason =
    gateSubmitPlan.submittable && needsGateSignOff ? (
      <div
        role="note"
        style={{
          fontSize: 11.5,
          lineHeight: 1.45,
          color: AMBER,
          fontWeight: 600,
          maxWidth: 520,
        }}
      >
        {submitUnsignedCount} gate document
        {submitUnsignedCount === 1 ? "" : "s"} still{" "}
        {submitUnsignedCount === 1 ? "needs" : "need"} sign-off. Approve{" "}
        {submitUnsignedCount === 1 ? "it" : "them"} in the sign-off ledger on
        this step before the gate can be submitted.
      </div>
    ) : null;

  const buildActionButton = (
    <button
      type="button"
      onClick={() => setConfirmOpen(true)}
      disabled={buildHeld}
      className="mxw-phase-progress-button"
      style={{
        padding: "10px 16px",
        background: buildHeld ? "#D8DDE5" : "#147C5B",
        color: buildHeld ? "#596579" : "#FFFFFF",
        border: "1px solid transparent",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 800,
        cursor: buildHeld ? "default" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {buildLabel}
    </button>
  );

  // Both forward actions travel together: whichever host renders them (inline or
  // through the step-header portal) must show the no-rebuild submission beside
  // the build, or the only visible control is the one that clears a sign-off.
  const phaseActionButtons = gateSubmitActionButton ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {buildActionButton}
        {gateSubmitActionButton}
      </div>
      {gateSubmitBlockedReason}
    </div>
  ) : (
    buildActionButton
  );

  // In-workspace attestation ledger: one row per gate deliverable, carrying the
  // sign-off state and, for a built-but-unsigned document, the SAME
  // DeliverableApprovalAction the /evidence page mounts. A presenter signs off
  // here instead of leaving the gate step. Non-approvers see state only.
  const gateSignOffLedger =
    ledgerGateCount > 0 ? (
      <section
        aria-label="Gate deliverable sign-off"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "14px 16px",
          background: "#FFFFFF",
          border: `1px solid ${LINE}`,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#61708D",
              }}
            >
              Gate sign-off
            </div>
            <div style={{ marginTop: 3, fontSize: 13, color: INK }}>
              Sign off each gate deliverable here before submitting the phase
              gate.
            </div>
          </div>
          <StatusPill
            tone={
              signOffReadbackState.canStateSignedCount &&
              signedCount >= ledgerGateCount
                ? "good"
                : "neutral"
            }
          >
            {signOffReadbackState.canStateSignedCount
              ? `${signedCount}/${ledgerGateCount} signed off`
              : signOffReadbackState.countLabel}
          </StatusPill>
        </div>
        {signOffReadbackState.warning ? (
          <div
            role="status"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: ATTENTION,
              background: "rgba(181,133,42,0.08)",
              border: "1px solid rgba(181,133,42,0.28)",
              borderRadius: 6,
              padding: "8px 10px",
            }}
          >
            {signOffReadbackState.warning}
          </div>
        ) : null}
        {gateLedgerEntries.map((entry) => (
          <div
            key={entry.deliverableTypeKey}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "10px 12px",
              background: "#FFFFFF",
              border: `1px solid ${LINE}`,
              borderLeft: `3px solid ${NAVY}`,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>
                {entry.documentTitle}
              </span>
              {entry.state === "signed" ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: SIGNED_TEAL,
                    background: "rgba(29,158,117,0.1)",
                    border: "1px solid rgba(29,158,117,0.32)",
                    borderRadius: 999,
                    padding: "3px 9px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Signed off · v{entry.signedVersion ?? "?"}
                </span>
              ) : entry.state === "draft" ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: AMBER,
                    background: "rgba(186,117,23,0.1)",
                    border: "1px solid rgba(186,117,23,0.32)",
                    borderRadius: 999,
                    padding: "3px 9px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Draft · awaiting sign-off
                </span>
              ) : (
                // Ledger-specific wording so these states never collide with
                // the per-deliverable status list's own "Built"/"Build blocked"
                // labels (the status list already carries the build state).
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: entry.state === "unverified" ? MUTED : ATTENTION,
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.state === "unverified"
                    ? signOffReadbackState.noRecordLabel
                    : "Not on record"}
                </span>
              )}
            </div>
            {entry.state === "draft" && (
              <>
                {entry.row?.blobUrl && (
                  <Link
                    href={finalDownloadUrl(entry.row.blobUrl)}
                    style={{ fontSize: 11, color: NAVY, fontWeight: 600 }}
                    target="_blank"
                  >
                    Download / preview →
                  </Link>
                )}
                {canApproveGates && entry.deliverableId ? (
                  <DeliverableApprovalAction
                    moveId={moveId}
                    deliverableId={entry.deliverableId}
                    alreadyApproved={false}
                  />
                ) : (
                  <span style={{ fontSize: 11, color: MUTED }}>
                    Sign-off is available to an authorized workspace user.
                  </span>
                )}
              </>
            )}
            {entry.state === "unverified" && (
              <span style={{ fontSize: 11, color: MUTED }}>
                {signOffReadbackState.noRecordNote}
              </span>
            )}
            {entry.state === "blocked" && entry.row && (
              <BlockedOutputDisclosure row={entry.row} />
            )}
          </div>
        ))}
      </section>
    ) : null;

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
          createPortal(phaseActionButtons, actionPortalTarget)
        : phaseActionButtons}

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

      {gateSubmitPlan.submittable && (
        <GateApprovalConfirmDialog
          open={gateSubmitConfirmOpen}
          title={`Submit the ${phaseLabel} gate approval?`}
          summary={gateSubmitPlan.summary}
          approverLabel={approverLabel}
          actorLabelPrefix="Submitting as"
          confirmLabel="Submit gate approval"
          onCancel={() => setGateSubmitConfirmOpen(false)}
          onConfirm={() => {
            setGateSubmitConfirmOpen(false);
            void submitGateWithoutBuild();
          }}
        />
      )}

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
            {/* A gate row's blocked-output detail is shown once, in the gate
                sign-off ledger below, so it is not duplicated here. */}
            {!r.gateArtifact && (
              <BlockedOutputDisclosure row={r} spanGridColumns />
            )}
          </div>
        ))}
      </div>

      {gateSignOffLedger}

      <div style={{ fontSize: 10.5, color: MUTED }}>
        <span>{MOVES_AI_DRAFT_LABEL}</span> — review and edit every document
        before it informs a decision.
      </div>
    </div>
  );
}

// The "Why this output is blocked" disclosure, extracted so the per-deliverable
// status list and the gate attestation ledger show the SAME blocked-output
// explanation from one definition rather than two copies that can drift.
function BlockedOutputDisclosure({
  row,
  spanGridColumns = false,
}: {
  row: DeliverableRow;
  spanGridColumns?: boolean;
}) {
  if (
    row.status !== "blocked" ||
    !(row.packageReadiness || row.blockers.length > 0 || row.error)
  ) {
    return null;
  }
  return (
    <details
      style={{
        ...(spanGridColumns ? { gridColumn: "2 / -1" } : {}),
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
        {row.packageReadiness && (
          <>
            <div style={{ color: ATTENTION, fontWeight: 700 }}>
              {row.packageReadiness.headline}
            </div>
            <div style={{ marginTop: 6 }}>
              Evidence retrieved: {row.packageReadiness.retrievedEvidence}/
              {row.packageReadiness.minimumEvidenceItems} · Readiness:{" "}
              {row.packageReadiness.executiveReadinessPct}%
            </div>
          </>
        )}
        {(row.blockers.length > 0 || row.error) && (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontWeight: 700 }}>Build blocker: </span>
            {row.blockers.length > 0 ? row.blockers.join("; ") : row.error}
          </div>
        )}
        {row.packageReadiness?.missing.length ? (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontWeight: 700 }}>Evidence gaps: </span>
            {row.packageReadiness.missing.slice(0, 3).join("; ")}
            {row.packageReadiness.missing.length > 3 ? "…" : ""}
          </div>
        ) : null}
        {row.packageReadiness?.recommendedNextStep && (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontWeight: 700 }}>Next: </span>
            {row.packageReadiness.recommendedNextStep}
          </div>
        )}
      </div>
    </details>
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
