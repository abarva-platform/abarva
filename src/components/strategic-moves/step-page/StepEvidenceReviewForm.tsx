"use client";

import {
  useEvidenceReviewForm,
  type PendingEvidenceReview,
} from "@/components/strategic-moves/CurrentStateReadinessPanel";
import type { ReviewedEvidenceExtraction } from "@/lib/programs/evidence-review-contract";
import styles from "./MovesStepPage.module.css";

/**
 * The governed evidence review, inside a step's evidence row, in the step
 * page's canon (template v1.6): canonical labels and inputs, the parsed
 * lists, the source text behind a disclosure, and Approve extraction /
 * Reject / Cancel at the foot. The form's rules come from the same
 * `useEvidenceReviewForm` the Files library's editor uses.
 */

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

export function StepEvidenceReviewForm({
  review,
  programId,
  busy,
  disabled,
  onDecision,
  onCancel,
}: {
  review: PendingEvidenceReview;
  programId: string;
  busy: boolean;
  disabled: boolean;
  onDecision: (
    decision: "approved" | "rejected",
    extraction?: ReviewedEvidenceExtraction,
    rationale?: string,
  ) => void;
  onCancel: () => void;
}) {
  const form = useEvidenceReviewForm(review);
  const approveBlocked = disabled || busy || !form.formVerdict.canApprove;
  const id = (suffix: string) => `ev-${review.evidenceId}-${suffix}`;
  return (
    <div>
      {review.sourceArtifactId ? (
        <p className={cx("form-note")}>
          <a
            href={`/api/v1/programs/${programId}/artifacts/${review.sourceArtifactId}/download?inline=1`}
            target="_blank"
            rel="noreferrer"
          >
            Open the file
          </a>
        </p>
      ) : null}
      <div className={cx("field")}>
        <label className={cx("q-label")} htmlFor={id("summary")}>
          What the file says
        </label>
        <textarea
          id={id("summary")}
          className={cx("q-input")}
          rows={3}
          value={form.extraction.summary}
          onChange={(event) => form.setSummary(event.target.value)}
        />
      </div>
      {form.fieldLabels.map(([field, label]) => (
        <div className={cx("field")} key={field}>
          <label className={cx("q-label")} htmlFor={id(field)}>
            {label}
          </label>
          <textarea
            id={id(field)}
            className={cx("q-input")}
            rows={2}
            placeholder="One item per line"
            value={form.signalText[field]}
            onChange={(event) => form.setSignalLines(field, event.target.value)}
          />
        </div>
      ))}
      <div className={cx("field")}>
        <label className={cx("q-label")} htmlFor={id("citations")}>
          Where it says so
        </label>
        <textarea
          id={id("citations")}
          className={cx("q-input")}
          rows={2}
          placeholder="Quoted text | page, slide or section"
          value={form.citationText}
          onChange={(event) => form.setCitationText(event.target.value)}
        />
      </div>
      <details className={cx("disc", "basis")}>
        <summary>
          <span className={cx("disc-toggle")}>
            <span className={cx("when-closed")}>
              Show the parsed source text
            </span>
            <span className={cx("when-open")}>Hide the parsed source text</span>
          </span>
        </summary>
        <div className={cx("basis-body")}>
          <p>
            {review.sourceTextPreview ||
              "No text was extracted from this file."}
          </p>
        </div>
      </details>
      <div className={cx("field")}>
        <label className={cx("q-label")} htmlFor={id("rationale")}>
          Why you approve or reject it
        </label>
        <textarea
          id={id("rationale")}
          className={cx("q-input")}
          rows={2}
          value={form.reviewRationale}
          onChange={(event) => form.setReviewRationale(event.target.value)}
        />
      </div>
      {!form.formVerdict.canApprove ? (
        <ul
          className={cx("items")}
          aria-label={`${review.title} approval blockers`}
        >
          {form.formVerdict.blockers.map((blocker) => (
            <li
              key={
                blocker.kind === "list_over_limit"
                  ? `${blocker.kind}:${blocker.field}`
                  : blocker.kind
              }
            >
              <span>{blocker.sentence}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className={cx("form-note")}>
        Approving stores this reviewed version; the original file and the
        parser&apos;s output stay unchanged.
      </p>
      <span className={cx("item-actions")}>
        <button
          type="button"
          className={cx("btn-ink")}
          disabled={approveBlocked}
          onClick={() =>
            onDecision(
              "approved",
              form.approvedExtraction(),
              form.reviewRationale.trim() || undefined,
            )
          }
        >
          {busy ? "Saving…" : "Approve extraction"}
        </button>
        <button
          type="button"
          className={cx("btn-line")}
          disabled={disabled || busy}
          onClick={() =>
            onDecision(
              "rejected",
              undefined,
              form.reviewRationale.trim() || undefined,
            )
          }
        >
          Reject
        </button>
        <button type="button" className={cx("link-btn")} onClick={onCancel}>
          Cancel
        </button>
      </span>
    </div>
  );
}
