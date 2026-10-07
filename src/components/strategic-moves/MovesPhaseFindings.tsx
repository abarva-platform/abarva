"use client";

import { type ReactNode } from "react";
import type {
  FindingReviewState,
  FindingsReviewSummary,
  InputGeneratedRow,
  InputGeneratedStatus,
  PhaseFinding,
  PhaseFindingsModel,
} from "@/lib/programs/moves-phase-findings";

/**
 * The v2 OUTCOME findings surface (Increment 2). Presentational only: it renders
 * the findings model the host derives (`buildPhaseFindings`) — an input-vs-
 * generated split (the generated side read-only), the list of discrete finding
 * cards (statement · detail · evidence chip · benchmark-source tag · confidence
 * · Accept/Challenge), and the structural headline — and reports each review
 * decision up through `onReview`.
 *
 * It owns NO review state and NO persistence: the accept/challenge decision is
 * a presentation control the host holds (and the gate reads). This is
 * deliberate — Increment 2 introduces no new persistence path for findings
 * review; the toggle feeds the gate's honesty, nothing more. When a real
 * findings-attestation store exists it can own `review`/`onReview` without this
 * surface changing.
 *
 * Charts are out of scope for this increment (they arrive in Increment 3).
 */
export interface MovesPhaseFindingsProps {
  model: PhaseFindingsModel;
  /** Current review decision per finding id. Absent = awaiting. */
  review: Readonly<Record<string, FindingReviewState>>;
  onReview: (id: string, state: FindingReviewState) => void;
  /** Whether the viewer may record a review (gate authorization). */
  canReview: boolean;
}

const STATUS_COPY: Record<InputGeneratedStatus, string> = {
  reviewed: "Reviewed",
  partial: "Partial",
  pending: "On attest",
};

const CONFIDENCE_COPY: Record<PhaseFinding["confidence"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function SplitPanel({
  title,
  caption,
  rows,
}: {
  title: string;
  caption: string;
  rows: InputGeneratedRow[];
}): ReactNode {
  return (
    <div className="mpf-panel">
      <h3>{title}</h3>
      <p className="mpf-panel-caption">{caption}</p>
      {rows.length === 0 ? (
        <p className="mpf-panel-empty">Nothing yet.</p>
      ) : (
        rows.map((row) => (
          <div className="mpf-prow" key={row.key}>
            <span>{row.label}</span>
            <span className={`mpf-st mpf-st-${row.status}`}>
              {STATUS_COPY[row.status]}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function FindingCard({
  finding,
  state,
  onReview,
  canReview,
}: {
  finding: PhaseFinding;
  state: FindingReviewState;
  onReview: (id: string, state: FindingReviewState) => void;
  canReview: boolean;
}): ReactNode {
  const statusLabel =
    state === "accepted"
      ? "Accepted"
      : state === "challenged"
        ? "Challenged"
        : "Awaiting review";
  return (
    <article
      className={`mpf-finding${state === "accepted" ? " is-accepted" : ""}${
        state === "challenged" ? " is-challenged" : ""
      }`}
      data-testid={`finding-${finding.id}`}
      data-review={state}
    >
      <span className="mpf-kind">{finding.kind}</span>
      <h4 className="mpf-stmt">{finding.statement}</h4>
      {finding.detail ? <p className="mpf-detail">{finding.detail}</p> : null}
      <div className="mpf-meta">
        <span className="mpf-ev">{finding.evidenceLabel}</span>
        <span className="mpf-bench">{finding.benchmarkLabel}</span>
        <span className={`mpf-conf mpf-conf-${finding.confidence}`}>
          Confidence <b>{CONFIDENCE_COPY[finding.confidence]}</b>
        </span>
      </div>
      <div className="mpf-act">
        <button
          type="button"
          className={`mpf-accept${state === "accepted" ? " is-on" : ""}`}
          aria-pressed={state === "accepted"}
          disabled={!canReview}
          onClick={() =>
            onReview(finding.id, state === "accepted" ? "awaiting" : "accepted")
          }
        >
          {state === "accepted" ? "Accepted" : "Accept"}
        </button>
        <button
          type="button"
          className={`mpf-challenge${state === "challenged" ? " is-on" : ""}`}
          aria-pressed={state === "challenged"}
          disabled={!canReview}
          onClick={() =>
            onReview(
              finding.id,
              state === "challenged" ? "awaiting" : "challenged",
            )
          }
        >
          {state === "challenged" ? "Challenged" : "Challenge"}
        </button>
        <span className="mpf-status">{statusLabel}</span>
      </div>
    </article>
  );
}

export function MovesPhaseFindings({
  model,
  review,
  onReview,
  canReview,
}: MovesPhaseFindingsProps) {
  return (
    <section className="mpf" data-testid="moves-phase-findings">
      <style>{MPF_CSS}</style>
      <div className="mpf-head">
        <span className="mcf-eyebrow">Outcome · what we found</span>
        <h2 className="mpf-heading">{model.heading}</h2>
        <p className="mpf-sub">{model.subhead}</p>
      </div>

      {model.pending ? (
        <div className="mpf-pending" data-testid="findings-pending">
          <h3>No diagnosis generated yet</h3>
          <p>
            Findings appear here once the phase inputs are provided and aVa has
            produced the diagnosis from them. Nothing is shown until there is
            governed content to review — this surface never invents findings.
          </p>
        </div>
      ) : (
        <>
          <div className="mpf-split">
            <SplitPanel
              title="Inputs — you provided"
              caption="Human-provided evidence"
              rows={model.inputs}
            />
            <SplitPanel
              title="Generated — aVa produces (read-only)"
              caption="Never user-filled"
              rows={model.generated}
            />
          </div>

          <div className="mpf-findings">
            {model.findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                state={review[finding.id] ?? "awaiting"}
                onReview={onReview}
                canReview={canReview}
              />
            ))}
          </div>

          {model.structuralHeadline ? (
            <p className="mpf-headline">{model.structuralHeadline}</p>
          ) : null}
          {model.confidenceNote ? (
            <p className="mpf-illus">{model.confidenceNote}</p>
          ) : null}
          {!canReview ? (
            <p className="mpf-illus">
              Reviewing findings is available to an authorized workspace user.
              The gate reads these reviews.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

/**
 * The GATE-step honesty line for the findings review. Rendered beside the
 * governed approve control (passed through the flow's `gateExtras`), it states
 * the accepted/challenged/awaiting tally and names the SPECIFIC finding that
 * blocks — the still-open one, or a challenged one to resolve — so the gate
 * reflects the review honestly and never reads as closed while a finding is
 * unreviewed. Pure presentation over the same summary the surface's review
 * feeds (`summarizePhaseFindingsReview`); it records no decision of its own.
 */
export function FindingsReviewGateSummary({
  summary,
}: {
  summary: FindingsReviewSummary;
}) {
  if (summary.total === 0) return null;
  const blocked = summary.awaiting > 0 || summary.challenged > 0;
  const tally = `${summary.accepted} accepted · ${summary.challenged} challenged · ${summary.awaiting} awaiting`;
  const openName =
    summary.openFinding?.statement ?? summary.challengedFinding?.statement;
  return (
    <div
      className={`mpf-gate${blocked ? " is-blocked" : " is-ok"}`}
      data-testid="findings-gate-summary"
      data-blocked={blocked ? "true" : "false"}
    >
      <span className="mpf-gate-box" aria-hidden>
        {blocked ? "" : "✓"}
      </span>
      <div className="mpf-gate-copy">
        <span className="mpf-gate-title">
          {blocked
            ? "Findings not fully resolved"
            : "All findings reviewed"}
        </span>
        <span className="mpf-gate-sub">
          {summary.total} finding{summary.total === 1 ? "" : "s"} · {tally}
          {blocked && openName
            ? summary.awaiting > 0
              ? ` — resolve "${openName}"`
              : ` — "${openName}" is challenged; confirm or down-rate it`
            : ""}
        </span>
      </div>
    </div>
  );
}

/* Scoped to .mpf; inherits the v2 locked-light tokens (--mcf-*) from the
 * surrounding .mcf-v2 container the slot renders inside. */
const MPF_CSS = `
.mpf{display:flex;flex-direction:column;gap:18px}
.mpf-head{display:flex;flex-direction:column;gap:6px}
.mpf-heading{font-family:var(--mcf-serif);font-weight:500;font-size:22px;color:var(--mcf-ink);margin:2px 0 0}
.mpf-sub{font-size:13.5px;color:var(--mcf-muted);margin:0;max-width:78ch}
.mpf-pending{border:1px solid var(--mcf-line);border-radius:12px;background:var(--mcf-surface);padding:22px}
.mpf-pending h3{font-family:var(--mcf-serif);font-weight:500;font-size:18px;margin:0 0 6px;color:var(--mcf-ink)}
.mpf-pending p{margin:0;font-size:13.5px;color:var(--mcf-muted);max-width:70ch}
.mpf-split{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.mpf-panel{border:1px solid var(--mcf-line);border-radius:11px;background:var(--mcf-surface);padding:14px 16px}
.mpf-panel h3{font-family:var(--mcf-mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mcf-muted);margin:0 0 3px;font-weight:500}
.mpf-panel-caption{font-size:11.5px;color:var(--mcf-faint);margin:0 0 10px}
.mpf-panel-empty{font-size:12.5px;color:var(--mcf-faint);font-style:italic;margin:0}
.mpf-prow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--mcf-line);font-size:13.5px;color:var(--mcf-ink)}
.mpf-prow:last-child{border-bottom:0}
.mpf-st{font-family:var(--mcf-mono);font-size:10px;letter-spacing:.04em;text-transform:uppercase}
.mpf-st-reviewed{color:var(--mcf-teal)}
.mpf-st-partial{color:#ba7517}
.mpf-st-pending{color:var(--mcf-faint)}
.mpf-findings{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px}
.mpf-finding{border:1px solid var(--mcf-line);border-radius:11px;background:var(--mcf-bg);padding:15px 16px;display:flex;flex-direction:column}
.mpf-finding.is-accepted{border-color:var(--mcf-teal)}
.mpf-finding.is-challenged{border-color:#ba7517}
.mpf-kind{font-family:var(--mcf-mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--mcf-faint)}
.mpf-stmt{font-weight:600;color:var(--mcf-ink);font-size:15px;margin:6px 0 0}
.mpf-detail{color:var(--mcf-muted);font-size:13px;margin:5px 0 0}
.mpf-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}
.mpf-ev{font-family:var(--mcf-mono);font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--mcf-muted);background:var(--mcf-surface);border:1px solid var(--mcf-line);padding:3px 7px;border-radius:6px}
.mpf-bench{font-family:var(--mcf-mono);font-size:10px;letter-spacing:.03em;text-transform:uppercase;color:var(--mcf-accent);background:rgba(27,43,92,.07);padding:3px 7px;border-radius:6px}
.mpf-conf{font-size:11.5px;color:var(--mcf-muted)}
.mpf-conf b{color:var(--mcf-teal);font-weight:600}
.mpf-conf-medium b,.mpf-conf-low b{color:#ba7517}
.mpf-act{margin-top:12px;display:flex;gap:7px;align-items:center}
.mpf-act button{font-size:12px;border:1px solid var(--mcf-line-strong);background:var(--mcf-surface);color:var(--mcf-muted);border-radius:7px;padding:6px 12px;cursor:pointer}
.mpf-act button:disabled{cursor:not-allowed;opacity:.55}
.mpf-act button:hover:not(:disabled){border-color:var(--mcf-faint)}
.mpf-act .mpf-accept.is-on{border-color:var(--mcf-teal);color:#fff;background:var(--mcf-teal)}
.mpf-act .mpf-challenge.is-on{border-color:#ba7517;color:#fff;background:#ba7517}
.mpf-status{margin-left:auto;font-family:var(--mcf-mono);font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--mcf-faint)}
.mpf-finding.is-accepted .mpf-status{color:var(--mcf-teal)}
.mpf-finding.is-challenged .mpf-status{color:#ba7517}
.mpf-headline{font-family:var(--mcf-serif);font-size:18px;color:var(--mcf-ink);line-height:1.3;margin:4px 0 0}
.mpf-illus{font-size:12px;color:var(--mcf-muted);margin:0;max-width:80ch}
.mpf-gate{display:flex;align-items:flex-start;gap:11px;border:1px solid var(--mcf-line-strong);border-radius:10px;background:var(--mcf-surface);padding:12px 14px}
.mpf-gate.is-blocked{border-color:#ba7517}
.mpf-gate-box{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--mcf-line-strong);flex:0 0 auto;display:grid;place-items:center;color:#fff;font-size:11px;margin-top:1px}
.mpf-gate.is-ok .mpf-gate-box{background:var(--mcf-teal);border-color:var(--mcf-teal)}
.mpf-gate.is-blocked .mpf-gate-box{border-color:#ba7517}
.mpf-gate-copy{display:flex;flex-direction:column;gap:2px}
.mpf-gate-title{font-size:13.5px;font-weight:600;color:var(--mcf-ink)}
.mpf-gate-sub{font-size:12px;color:var(--mcf-muted)}
`;
