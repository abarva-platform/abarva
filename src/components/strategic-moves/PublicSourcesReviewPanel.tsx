"use client";

// ── Outside public sources awaiting review ──────────────────────────────────
// The review queue for public web pages the research step found for this Move
// (`moves_public_source_research`, flag-gated). A public source is a program
// rule, a payment rule or a published study — never a fact about the client —
// and no deliverable cites one until an authorized workspace user approves it
// here. Kept apart from the client's own evidence on purpose: different
// section, different words, different route.
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
  type PublicSourceReviewItem,
} from "@/lib/deliverables/public-research/review-contract";

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

async function readDetail(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    detail?: unknown;
  } | null;
  return typeof body?.detail === "string" && body.detail.trim()
    ? body.detail
    : fallback;
}

export function PublicSourcesReviewPanel({
  programId,
  enabled,
  canDecide,
}: PublicSourcesReviewPanelProps) {
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/programs/${encodeURIComponent(programId)}/public-sources?decision=pending`,
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
        sources: (body.sources as PublicSourceReviewItem[]).filter(
          (source) => source.decision === "pending",
        ),
      });
    } catch {
      setList({ status: "error", detail: PUBLIC_SOURCE_LIST_UNNAMED_FAILURE });
    }
  }, [programId]);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  const decide = useCallback(
    async (
      source: PublicSourceReviewItem,
      decision: "approved" | "rejected",
    ) => {
      setBusyId(source.id);
      setFailure(null);
      setRecorded(null);
      const note = (notes[source.id] ?? "").trim();
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
          setList((current) =>
            current.status === "ready"
              ? {
                  status: "ready",
                  sources: current.sources.filter((s) => s.id !== source.id),
                }
              : current,
          );
          setRecorded(
            `${decision === "approved" ? "Approved" : "Rejected"}: ${source.title}`,
          );
          return;
        }
        const body = (await res.json().catch(() => null)) as {
          error?: unknown;
          detail?: unknown;
        } | null;
        const detail =
          typeof body?.detail === "string" && body.detail.trim()
            ? body.detail
            : PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE;
        setFailure(detail);
        // The server says this source is decided: it is no longer offered.
        if (
          typeof body?.error === "string" &&
          NO_LONGER_PENDING.has(body.error)
        ) {
          setList((current) =>
            current.status === "ready"
              ? {
                  status: "ready",
                  sources: current.sources.filter((s) => s.id !== source.id),
                }
              : current,
          );
        }
      } catch {
        setFailure(PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE);
      } finally {
        setBusyId(null);
      }
    },
    [notes, programId],
  );

  if (!enabled) return null;

  return (
    <section
      aria-label="Outside public sources"
      data-testid="public-sources-review"
      style={{
        margin: "14px 0",
        padding: 12,
        border: "1px solid #c9d3e3",
        borderRadius: 6,
        background: "#f8fafd",
      }}
    >
      <h3 style={{ margin: 0, fontSize: 14, color: "#23344f" }}>
        Outside public sources
      </h3>
      <p style={{ margin: "4px 0 8px", fontSize: 12, color: "#4d5b70" }}>
        Not facts about the client. These are public web pages — program rules,
        payment rules, published studies — found while researching this Move.
        None is cited in a deliverable until an authorized workspace user
        approves it; a rejected source is never cited.
      </p>

      {failure && (
        <p
          role="alert"
          style={{
            margin: "6px 0",
            padding: "8px 10px",
            border: "1px solid #e6b5b1",
            borderRadius: 6,
            background: "#fff7f6",
            color: "#9b2c24",
            fontSize: 12,
          }}
        >
          {failure}
        </p>
      )}
      {recorded && (
        <p
          role="status"
          style={{ margin: "6px 0", fontSize: 12, color: "#1f5134" }}
        >
          {recorded}
        </p>
      )}

      {list.status === "loading" && (
        <p style={{ margin: 0, fontSize: 12, color: "#4d5b70" }}>
          Loading outside sources…
        </p>
      )}
      {list.status === "error" && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: "#9b2c24" }}>
          {list.detail}
        </p>
      )}
      {list.status === "ready" && list.sources.length === 0 && (
        <p style={{ margin: 0, fontSize: 12, color: "#4d5b70" }}>
          No outside sources are awaiting review.
        </p>
      )}
      {list.status === "ready" && list.sources.length > 0 && (
        <ul
          aria-label="Outside sources awaiting review"
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gap: 8,
          }}
        >
          {list.sources.map((source) => {
            const href = publicSourceHref(source.url);
            const busy = busyId === source.id;
            return (
              <li
                key={source.id}
                data-testid="public-source-row"
                style={{
                  border: "1px solid #c9d3e3",
                  borderRadius: 6,
                  padding: 10,
                  background: "#fff",
                }}
              >
                <strong style={{ fontSize: 12 }}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {source.title}
                    </a>
                  ) : (
                    source.title
                  )}
                </strong>
                <p
                  style={{ margin: "2px 0 0", fontSize: 11, color: "#4d5b70" }}
                >
                  {source.publisher ?? "Publisher not stated"} · Published{" "}
                  {source.publishedAt ?? "date not stated"} · Retrieved{" "}
                  {source.retrievedAt.slice(0, 10)}
                  {source.confidence
                    ? ` · Confidence: ${source.confidence}`
                    : ""}
                </p>
                <blockquote
                  style={{
                    margin: "6px 0",
                    padding: "4px 8px",
                    borderLeft: "3px solid #c9d3e3",
                    fontSize: 12,
                    color: "#23344f",
                  }}
                >
                  {source.excerpt}
                </blockquote>
                {source.claim && (
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 12,
                      color: "#4d5b70",
                    }}
                  >
                    Supports: {source.claim}
                  </p>
                )}
                {canDecide ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="text"
                      aria-label={`Note on ${source.title} (optional)`}
                      placeholder="Note (optional)"
                      maxLength={PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS}
                      value={notes[source.id] ?? ""}
                      disabled={busyId !== null}
                      onChange={(event) => {
                        const value = event.target.value;
                        setNotes((current) => ({
                          ...current,
                          [source.id]: value,
                        }));
                      }}
                      style={{
                        flex: "1 1 180px",
                        fontSize: 12,
                        padding: "4px 6px",
                      }}
                    />
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void decide(source, "approved")}
                    >
                      {busy ? "Saving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => void decide(source, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: "#4d5b70" }}>
                    Awaiting review by an authorized workspace user.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
