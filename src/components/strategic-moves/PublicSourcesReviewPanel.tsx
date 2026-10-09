"use client";

// ── Public sources (Files tab, below the file library) ──────────────────────
// Step page template v1.9, review 5: the review queue for public web pages the
// research step found for this Move (`moves_public_source_research`,
// flag-gated). A public source is a program rule, a payment rule or a
// published study — never a fact about the client. Only an approved source can
// be cited, and only as a public source (`[S:n]`, the muted PUBLIC SOURCE
// tag), never as FACT. A source is decided once, through an inline confirm.
//
// Every stored field is untrusted text from the public web. It is rendered as
// text only (React escapes it), the excerpt is the ≤300-character quotation the
// store keeps and nothing more of the page, and the link out is offered only
// for an https URL, in a new tab, with no opener and no referrer.

import { useCallback, useEffect, useState } from "react";
import {
  PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
  PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS,
  PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
  publicSourceCiteNumbers,
  type PublicSourceReviewItem,
} from "@/lib/deliverables/public-research/review-contract";
import type { PublicSourceReviewDecision } from "@/lib/deliverables/public-research/types";
import { SourceLine } from "@/components/strategic-moves/step-page/MovesStepPage";
import styles from "@/components/strategic-moves/step-page/MovesStepPage.module.css";

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

export interface PublicSourcesReviewPanelProps {
  programId: string;
  /** `moves_public_source_research`, resolved server-side. Off ⇒ nothing renders and nothing is fetched. */
  enabled: boolean;
  /** The same authority the evidence review uses (`canApproveGates`). */
  canDecide: boolean;
}

type ListState =
  | { status: "loading" }
  | { status: "ready"; sources: PublicSourceReviewItem[] }
  | { status: "error"; detail: string };

/** The open inline confirm: one source, one decision, an optional note. */
interface ConfirmState {
  id: string;
  decision: PublicSourceReviewDecision;
  note: string;
}

/** Refusals after which the source is, by the server's own word, not pending. */
const NO_LONGER_PENDING = new Set([
  "already_decided",
  "decided_by_another_reviewer",
]);

/** An https link out, or null — never a javascript:, data: or http: href. */
function publicSourceHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `2026-01-15…` → `Jan 15, 2026` (the stored calendar day); anything else as stored. */
function day(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${month} ${Number(match[3])}, ${match[1]}` : value;
}

/** Confidence is words, never dots or colours (review 5, clutter flag 3). */
const CONFIDENCE_WORDS: Record<string, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  unverified: "Confidence unverified",
};

function confidenceWords(confidence: string | null): string {
  return (
    (confidence && CONFIDENCE_WORDS[confidence]) || "Confidence not stated"
  );
}

async function readDetail(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    detail?: unknown;
  } | null;
  return typeof body?.detail === "string" && body.detail.trim()
    ? body.detail
    : fallback;
}

/** A returned source the panel can trust to replace the one it decided. */
function isDecidedSource(
  value: unknown,
  id: string,
  decision: PublicSourceReviewDecision,
): value is PublicSourceReviewItem {
  const source = value as Partial<PublicSourceReviewItem> | null;
  return (
    !!source &&
    typeof source === "object" &&
    source.id === id &&
    source.decision === decision
  );
}

export function PublicSourcesReviewPanel({
  programId,
  enabled,
  canDecide,
}: PublicSourcesReviewPanelProps) {
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [busy, setBusy] = useState(false);
  /** The route's refusal, verbatim, against the source it was about. */
  const [failure, setFailure] = useState<{
    id: string;
    detail: string;
  } | null>(null);
  const [recorded, setRecorded] = useState<{
    id: string;
    title: string;
    decision: PublicSourceReviewDecision;
  } | null>(null);
  /** Sources this viewer decided here: "by you" is known only for these. */
  const [decidedByYou, setDecidedByYou] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/programs/${encodeURIComponent(programId)}/public-sources`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        setList({
          status: "error",
          detail: await readDetail(res, PUBLIC_SOURCE_LIST_UNNAMED_FAILURE),
        });
        return;
      }
      const body = (await res.json().catch(() => null)) as {
        sources?: unknown;
      } | null;
      if (!body || !Array.isArray(body.sources)) {
        setList({
          status: "error",
          detail: PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
        });
        return;
      }
      setList({
        status: "ready",
        // A source outside the three decisions falls in no group and is not shown.
        sources: body.sources as PublicSourceReviewItem[],
      });
    } catch {
      setList({ status: "error", detail: PUBLIC_SOURCE_LIST_UNNAMED_FAILURE });
    }
  }, [programId]);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  const decide = useCallback(
    async (source: PublicSourceReviewItem, form: ConfirmState) => {
      const { decision } = form;
      setBusy(true);
      setFailure(null);
      setRecorded(null);
      const note = form.note.trim();
      try {
        const res = await fetch(
          `/api/v1/programs/${encodeURIComponent(programId)}/public-sources/${encodeURIComponent(source.id)}/review`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(note ? { decision, note } : { decision }),
          },
        );
        if (res.ok) {
          const body = (await res.json().catch(() => null)) as {
            source?: unknown;
          } | null;
          setConfirm(null);
          setDecidedByYou((current) => new Set(current).add(source.id));
          setRecorded({ id: source.id, title: source.title, decision });
          if (isDecidedSource(body?.source, source.id, decision)) {
            const decided = body.source;
            setList((current) =>
              current.status === "ready"
                ? {
                    status: "ready",
                    sources: current.sources.map((s) =>
                      s.id === source.id ? decided : s,
                    ),
                  }
                : current,
            );
          } else {
            // Recorded, but the stored row did not come back: read it, never guess it.
            void load();
          }
          return;
        }
        const body = (await res.json().catch(() => null)) as {
          error?: unknown;
          detail?: unknown;
        } | null;
        setFailure({
          id: source.id,
          detail:
            typeof body?.detail === "string" && body.detail.trim()
              ? body.detail
              : PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
        });
        // The server says this source is decided: stop offering it, and read
        // the decision that stands.
        if (
          typeof body?.error === "string" &&
          NO_LONGER_PENDING.has(body.error)
        ) {
          setConfirm(null);
          void load();
        }
      } catch {
        setFailure({
          id: source.id,
          detail: PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
        });
      } finally {
        setBusy(false);
      }
    },
    [load, programId],
  );

  if (!enabled) return null;

  const sources = list.status === "ready" ? list.sources : [];
  const pending = sources.filter((s) => s.decision === "pending");
  const citeNumbers = publicSourceCiteNumbers(sources);
  // Approved sources read in citation order: [S:1] first.
  const approved = sources
    .filter((s) => s.decision === "approved")
    .sort(
      (a, b) => (citeNumbers.get(a.id) ?? 0) - (citeNumbers.get(b.id) ?? 0),
    );
  const rejected = sources.filter((s) => s.decision === "rejected");
  const citeAs = (id: string) => {
    const n = citeNumbers.get(id);
    return n ? `cite as [S:${n}]` : null;
  };

  const item = (source: PublicSourceReviewItem) => {
    const href = publicSourceHref(source.url);
    const form = confirm?.id === source.id ? confirm : null;
    // `Approved by you, Oct 8, 2026` or `Approved Oct 8, 2026`: the list
    // carries no reviewer, so a name is stated only when it is this viewer.
    const byYou = decidedByYou.has(source.id) ? " by you," : "";
    const when = source.reviewedAt ? ` ${day(source.reviewedAt)}` : "";
    const cite = citeAs(source.id);
    const settled =
      source.decision === "approved"
        ? `Approved${byYou}${when}${cite ? ` · ${cite}` : ""}`
        : source.decision === "rejected"
          ? `Rejected${byYou}${when}`
          : null;
    return (
      <li key={source.id} data-testid="public-source-row">
        <span>
          <span className={cx("item-name")}>
            {source.publisher ?? "Publisher not stated"} · {source.title}
          </span>
          <span className={cx("item-note")}>
            Published{" "}
            {source.publishedAt ? day(source.publishedAt) : "date not stated"} ·
            retrieved {day(source.retrievedAt)} ·{" "}
            {confidenceWords(source.confidence)}
          </span>
          <blockquote className={cx("excerpt")}>“{source.excerpt}”</blockquote>
          <SourceLine
            source={{
              kind: "public",
              text: source.claim
                ? `Supports: ${source.claim}`
                : "Supports: no claim stated",
            }}
          />
          <span className={cx("reg-meta")}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                Open source →
              </a>
            ) : (
              "No link offered: the address is not https."
            )}
          </span>
          {settled && (
            <span className={cx("when-settled")}>
              {settled}
              {source.reviewNote ? ` · ${source.reviewNote}` : ""}
            </span>
          )}
          {form && (
            <div
              className={cx("warn-inline")}
              role="group"
              aria-label={`${form.decision === "approved" ? "Approve" : "Reject"} ${source.title}`}
            >
              <span>
                <span className={cx("lead")}>
                  {form.decision === "approved" ? "Approve" : "Reject"} this
                  source?
                </span>{" "}
                A source is decided once; it can’t be changed later.
              </span>
              {failure?.id === source.id && (
                <p role="alert" className={cx("refusal")}>
                  {failure.detail}
                </p>
              )}
              <div className={cx("form-grid")}>
                <label className={cx("span2")}>
                  Note (optional)
                  <input
                    type="text"
                    className={cx("cell-input")}
                    maxLength={PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS}
                    placeholder="e.g. Directional only; no figure used"
                    value={form.note}
                    disabled={busy}
                    onChange={(event) => {
                      const note = event.target.value;
                      setConfirm((current) =>
                        current ? { ...current, note } : current,
                      );
                    }}
                  />
                </label>
              </div>
              <span className={cx("item-actions")}>
                <button
                  type="button"
                  className={cx(
                    form.decision === "approved" ? "btn-ink" : "btn-line",
                  )}
                  disabled={busy}
                  onClick={() => void decide(source, form)}
                >
                  {busy
                    ? "Saving…"
                    : form.decision === "approved"
                      ? "Approve source"
                      : "Reject source"}
                </button>
                <button
                  type="button"
                  className={cx("link-btn")}
                  disabled={busy}
                  onClick={() => setConfirm(null)}
                >
                  Cancel
                </button>
              </span>
            </div>
          )}
        </span>
        <span className={cx("item-actions")}>
          {source.decision === "pending" && canDecide && !form && (
            <>
              <button
                type="button"
                className={cx("btn-ink")}
                disabled={busy}
                aria-label={`Approve ${source.title}…`}
                onClick={() => {
                  setFailure(null);
                  setConfirm({ id: source.id, decision: "approved", note: "" });
                }}
              >
                Approve…
              </button>
              <button
                type="button"
                className={cx("link-btn")}
                disabled={busy}
                aria-label={`Reject ${source.title}…`}
                onClick={() => {
                  setFailure(null);
                  setConfirm({ id: source.id, decision: "rejected", note: "" });
                }}
              >
                Reject…
              </button>
            </>
          )}
        </span>
      </li>
    );
  };

  const group = (
    key: string,
    title: string,
    rows: PublicSourceReviewItem[],
    open: boolean,
  ) =>
    rows.length > 0 && (
      <details
        className={cx("disc", "list", "phase-group")}
        data-testid={`public-sources-${key}`}
        open={open || undefined}
      >
        <summary>
          <span className={cx("eyebrow")}>
            {title} · {rows.length}
          </span>
          <span className={cx("disc-toggle")}>
            <span className={cx("when-closed")}>Show</span>
            <span className={cx("when-open")}>Hide</span>
          </span>
        </summary>
        <ul className={cx("items")} aria-label={title}>
          {rows.map(item)}
        </ul>
      </details>
    );

  const recordedCite = recorded ? citeAs(recorded.id) : null;

  return (
    <section
      className={cx("root", "sources-panel")}
      aria-labelledby="public-sources-title"
      data-testid="public-sources-review"
    >
      <header className={cx("panel-head")}>
        <span className={cx("eyebrow")}>Files · public sources</span>
        <h2 id="public-sources-title" className={cx("panel-title")}>
          Public sources
        </h2>
        <p className={cx("panel-intro")}>
          Found by research. Not facts about the client: only approved sources
          can be cited, and only as public sources, never as FACT.
        </p>
        {!canDecide && (
          <p className={cx("carry")}>
            Only an authorized workspace user can approve or reject a source.
          </p>
        )}
      </header>

      {/* A refusal whose confirm closed (the source is decided elsewhere) is
          stated here; one whose confirm is still open is stated inside it. */}
      {failure && confirm?.id !== failure.id && (
        <p role="alert" className={cx("refusal")}>
          {failure.detail}
        </p>
      )}
      {recorded && (
        <p role="status" className={cx("carry")}>
          {recorded.decision === "approved" ? "Approved" : "Rejected"}:{" "}
          {recorded.title}
          {recordedCite ? ` · ${recordedCite}` : ""}
        </p>
      )}

      <div className={cx("work")}>
        {list.status === "loading" && (
          <div className={cx("list")}>
            <p className={cx("empty-note")}>Loading public sources…</p>
          </div>
        )}
        {list.status === "error" && (
          <p role="alert" className={cx("refusal")}>
            {list.detail}
          </p>
        )}
        {list.status === "ready" && (
          <>
            {group("pending", "To review", pending, true) || (
              <div className={cx("list")}>
                <p className={cx("empty-note")}>
                  Nothing to review. New research findings appear here.
                </p>
              </div>
            )}
            {group("approved", "Approved · citable", approved, false)}
            {group("rejected", "Rejected", rejected, false)}
          </>
        )}
      </div>
    </section>
  );
}
