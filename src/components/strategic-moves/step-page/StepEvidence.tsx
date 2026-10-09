"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PendingEvidenceReview } from "@/components/strategic-moves/CurrentStateReadinessPanel";
import { StepEvidenceReviewForm } from "./StepEvidenceReviewForm";
import { describeEvidenceCabinetReadback } from "@/lib/programs/evidence-cabinet-readback";
import { describeMoveUploadOutcome } from "@/lib/programs/move-artifact-storage-state";
import { getPhaseLabel } from "@/lib/programs/phase-labels";
import {
  decideMoveEvidence,
  fetchMoveEvidence,
  uploadMoveEvidence,
} from "@/lib/programs/move-evidence-client";
import type { StepPageRow } from "./MovesStepPage";
import styles from "./MovesStepPage.module.css";

/**
 * Evidence uploaded inside a step (template v1.4, "Upload in the step").
 * Files go straight into the workflow, never through aVa: the step's Context
 * line carries the upload control, and an extraction that needs review
 * becomes a "Needs your decision" row in that step, reviewed with the same
 * governed editor the Files library uses. Until it is approved, nothing from
 * the file counts as evidence, and the step cannot be ready.
 */

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

/**
 * A file named for a sentence: no extension, nothing after a comma, lower-case
 * first letter ("Duplicate-match report, EHR x claims.xlsx" → "duplicate-match
 * report") (template v1.6).
 */
export function fileLabel(title: string): string {
  const base = title
    .replace(/\.[A-Za-z0-9]{2,5}$/, "")
    .split(",")[0]
    .trim();
  return `${base.charAt(0).toLowerCase()}${base.slice(1)}`;
}

export interface StepEvidence {
  /** Extractions for this phase awaiting review, oldest first. */
  pending: PendingEvidenceReview[];
  approvedCount: number;
  /** False when the evidence read failed: no claim about counts is made. */
  readable: boolean;
  /** The last upload's or decision's sentence, for the Context line. */
  message: string | null;
  uploading: boolean;
  upload: (file: File, onUploaded?: (label: string) => void) => Promise<void>;
  /** Open the file picker for one row; `onUploaded` gets the file's label. */
  pickFor: (onUploaded: (label: string) => void) => void;
  /** Labels of this phase's files awaiting review. */
  pendingLabels: string[];
  /** The review row id for a pending file's label, for links from other rows. */
  rowIdFor: (label: string) => string | null;
  /** The Context line's evidence item; a failed read offers a retry. */
  summary: ReactNode;
  /** Leading clauses for the next-action sentence, one per pending review. */
  clauses: string[];
  /** Decision rows for pending reviews. */
  rows: StepPageRow[];
  /** The Context line's upload control. */
  uploadControl: ReactNode;
}

export function useStepEvidence({
  moveId,
  phase,
  canReview,
  onEvidenceChanged,
  uploadLabel = "Upload evidence",
}: {
  moveId: string;
  phase: number;
  canReview: boolean;
  /** An approval changed what counts as evidence; the host re-reads it. */
  onEvidenceChanged?: () => void;
  /**
   * The upload control's words: "Upload evidence" on an evidence step, "Add
   * session output" on a design step (template v1.7).
   */
  uploadLabel?: string;
}): StepEvidence {
  const [pending, setPending] = useState<PendingEvidenceReview[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [readable, setReadable] = useState(false);
  // Until the first read settles, the line says it is reading rather than
  // claiming the read failed.
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [openReview, setOpenReview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pickCallback = useRef<((label: string) => void) | null>(null);

  const load = useCallback(async () => {
    try {
      const body = await fetchMoveEvidence(moveId);
      const readback = describeEvidenceCabinetReadback({
        evidenceReviewStatus: body.evidenceReviewStatus,
      });
      const forPhase = (item: { phase?: number | null }) =>
        item.phase === phase;
      const queue = Array.isArray(body.pendingEvidenceReviews)
        ? (body.pendingEvidenceReviews as PendingEvidenceReview[]).filter(
            forPhase,
          )
        : [];
      const reviewed = Array.isArray(body.reviewedEvidence)
        ? (body.reviewedEvidence as Array<{ phase?: number | null }>).filter(
            forPhase,
          )
        : [];
      setPending(queue);
      setApprovedCount(reviewed.length);
      setReadable(readback.queueIsCurrent);
    } catch {
      setReadable(false);
    }
    setLoaded(true);
  }, [moveId, phase]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(
    async (file: File, onUploaded?: (label: string) => void) => {
      setUploading(true);
      setMessage(`Uploading ${file.name}…`);
      try {
        const body = await uploadMoveEvidence({
          moveId,
          file,
          phase,
          family: "uploaded_evidence",
        });
        const outcome = describeMoveUploadOutcome({
          blobStored: body.blobStored,
          evidence: body.evidence as Parameters<
            typeof describeMoveUploadOutcome
          >[0]["evidence"],
          fileName: file.name,
          phaseLabel: getPhaseLabel(phase),
          sessionFile: false,
        });
        setMessage(outcome.message);
        if (!outcome.needsAction) onUploaded?.(fileLabel(file.name));
        await load();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "The upload failed.",
        );
      } finally {
        setUploading(false);
      }
    },
    [load, moveId, phase],
  );

  const decide = useCallback(
    async (
      review: PendingEvidenceReview,
      decision: "approved" | "rejected",
      extraction?: PendingEvidenceReview["extraction"],
      rationale?: string,
    ) => {
      setDeciding(review.evidenceId);
      try {
        await decideMoveEvidence({
          moveId,
          evidenceId: review.evidenceId,
          decision,
          extraction,
          rationale,
        });
        setOpenReview(null);
        setMessage(
          decision === "approved"
            ? `${review.title} is approved evidence.`
            : `${review.title} was rejected; nothing from it counts as evidence.`,
        );
        await load();
        if (decision === "approved") onEvidenceChanged?.();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "The review was not recorded.",
        );
      } finally {
        setDeciding(null);
      }
    },
    [load, moveId, onEvidenceChanged],
  );

  const rows: StepPageRow[] = pending.map((review, index) => ({
    id: `EV-${index + 1}`,
    rank: -10 + index,
    shortName: review.title,
    eyebrow: "Evidence",
    subject: review.title,
    state: "decision",
    clause: `review the ${fileLabel(review.title)} extraction`,
    wide: openReview === review.evidenceId,
    facts: [
      { kind: "team", text: "Uploaded in this step · extraction needs review" },
    ],
    middle:
      openReview === review.evidenceId && canReview ? (
        <StepEvidenceReviewForm
          review={review}
          programId={moveId}
          busy={deciding === review.evidenceId}
          disabled={deciding !== null || !readable}
          onDecision={(decision, extraction, rationale) =>
            void decide(review, decision, extraction, rationale)
          }
          onCancel={() => setOpenReview(null)}
        />
      ) : (
        <p className={cx("proposal")}>
          <span className={cx("lead")}>
            {review.extraction?.summary?.trim() || "Extraction needs review."}
          </span>{" "}
          Until it is approved, nothing from this file counts as evidence.
        </p>
      ),
    actions: !canReview ? (
      <span className={cx("item-state")}>Awaiting review</span>
    ) : openReview === review.evidenceId ? null : (
      <button
        type="button"
        className={cx("btn-ink")}
        disabled={!readable}
        onClick={() => setOpenReview(review.evidenceId)}
      >
        Review extraction
      </button>
    ),
  }));

  const summary: ReactNode = !loaded ? (
    "Reading evidence…"
  ) : !readable ? (
    <>
      Evidence status could not be read ·{" "}
      <button
        type="button"
        className={cx("link-btn", "inline")}
        onClick={() => void load()}
      >
        Try again
      </button>
    </>
  ) : pending.length > 0 ? (
    `${approvedCount} approved file${approvedCount === 1 ? "" : "s"} · ${pending.length} in review`
  ) : (
    `${approvedCount} approved file${approvedCount === 1 ? "" : "s"}`
  );

  const uploadControl = (
    <span>
      <button
        type="button"
        className={cx("link-btn", "inline")}
        disabled={uploading}
        onClick={() => {
          pickCallback.current = null;
          fileInput.current?.click();
        }}
      >
        {uploading ? "Uploading…" : uploadLabel}
      </button>
      <input
        ref={fileInput}
        type="file"
        className={cx("sr-only")}
        aria-label={`${uploadLabel} for this step`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          const onUploaded = pickCallback.current ?? undefined;
          pickCallback.current = null;
          if (file) void upload(file, onUploaded);
          event.currentTarget.value = "";
        }}
      />
      {message ? (
        <span role="status" className={cx("item-note")}>
          {" "}
          {message}
        </span>
      ) : null}
    </span>
  );

  return {
    pending,
    approvedCount,
    readable,
    message,
    uploading,
    upload,
    summary,
    clauses: pending.map(
      (review) => `review the ${fileLabel(review.title)} extraction`,
    ),
    pendingLabels: pending.map((review) => fileLabel(review.title)),
    rowIdFor: (label: string) => {
      const index = pending.findIndex(
        (review) => fileLabel(review.title) === label,
      );
      return index < 0 ? null : `EV-${index + 1}`;
    },
    pickFor: (onUploaded: (label: string) => void) => {
      pickCallback.current = onUploaded;
      fileInput.current?.click();
    },
    rows,
    uploadControl,
  };
}
