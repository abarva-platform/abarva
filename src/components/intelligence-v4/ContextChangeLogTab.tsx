"use client";

// ContextChangeLogTab · Change Log tab
//
// Filter chips: All / Strategy / Vendor / Ops
// Table: When | Change | Handling | Surface

import { useEffect, useMemo, useState } from "react";

import type { ContextRefreshEvent } from "@/lib/intelligence/refresh-events";

const C = {
  panel: "#FFFFFF",
  ink: "#1B1A17",
  muted: "#6F6A61",
  line: "#E6E2DA",
  line2: "#EFECE5",
  chip: "#F1EEE7",
  fresh: "#3F7A5B",
  freshBg: "#3F7A5B14",
  attention: "#B5852A",
  attentionBg: "#B5852A18",
  stale: "#B4513C",
  staleBg: "#B4513C16",
  review: "#7A5BA8",
  reviewBg: "#7A5BA814",
};

type ChangeTag = "all" | "strategy" | "vendor" | "ops";
type ReviewFilter = "all" | "review";
type ReviewType = "review" | "auto";

interface ChangeEntry {
  t: string;
  src: string;
  ty: string;
  mat: "high" | "medium";
  sf: string;
  rev: ReviewType;
  tag: Exclude<ChangeTag, "all">;
  txt: string;
}

interface RefreshEventsResponse {
  events: ContextRefreshEvent[];
  errors: string[];
}

const CHANGES: ChangeEntry[] = [
  {
    t: "Jun 15",
    src: "AMS Board Memo",
    ty: "new claim",
    mat: "high",
    sf: "Insights",
    rev: "review",
    tag: "strategy",
    txt: "CIO names AMS consolidation top-3 FY27 priority.",
  },
  {
    t: "Jun 12",
    src: "AI Initiative Register",
    ty: "updated",
    mat: "medium",
    sf: "Insights",
    rev: "auto",
    tag: "strategy",
    txt: "Dev Productivity AI moved Pilot → Scaling.",
  },
  {
    t: "Jun 03",
    src: "Operating telemetry",
    ty: "updated",
    mat: "medium",
    sf: "Tower",
    rev: "auto",
    tag: "vendor",
    txt: "Copilot active users 31% (was 27%) — period preserved.",
  },
  {
    t: "May 28",
    src: "Vendor Contracts",
    ty: "changed",
    mat: "high",
    sf: "Insights",
    rev: "review",
    tag: "vendor",
    txt: "Kyndryl AMS renewal risk raised to High.",
  },
  {
    t: "Apr 30",
    src: "Operating telemetry",
    ty: "updated",
    mat: "medium",
    sf: "Insights",
    rev: "auto",
    tag: "ops",
    txt: "MTTR worsened 22% QoQ, breaching P2 SLA on 3 services.",
  },
];

const FILTER_TABS: { key: ChangeTag; label: string }[] = [
  { key: "all", label: "All" },
  { key: "strategy", label: "Strategy" },
  { key: "vendor", label: "Vendor" },
  { key: "ops", label: "Ops" },
];

function eventTag(event: ContextRefreshEvent): Exclude<ChangeTag, "all"> {
  if (event.triggeredBy === "csv_upload") return "vendor";
  if (event.triggeredBy === "source_artifact") return "strategy";
  return "ops";
}

function eventText(event: ContextRefreshEvent): string {
  if (event.triggeredBy === "csv_upload") {
    return `${event.rowsAccepted} context row${event.rowsAccepted === 1 ? "" : "s"} accepted from upload.`;
  }
  if (event.triggeredBy === "source_artifact") {
    return "Source artifact accepted for review and downstream context processing.";
  }
  if (event.triggeredBy === "move_artifact") {
    return "Move artifact generated and linked back to the context surface.";
  }
  return "Context refresh recorded.";
}

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapEvent(event: ContextRefreshEvent): ChangeEntry {
  const hasReview = event.approvalRequired || event.rowsRejected > 0;
  return {
    t: formatEventDate(event.createdAt),
    src: event.sourceLabel ?? event.triggeredBy.replace(/_/g, " "),
    ty: event.triggeredBy.replace(/_/g, " "),
    mat: hasReview ? "high" : "medium",
    sf: event.affectedSurfaces[0] ?? "Insights",
    rev: hasReview ? "review" : "auto",
    tag: eventTag(event),
    txt: eventText(event),
  };
}

interface Props {
  tenantKey: string;
}

export function ContextChangeLogTab({ tenantKey }: Props) {
  const [filter, setFilter] = useState<ChangeTag>("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [liveRows, setLiveRows] = useState<ChangeEntry[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/intelligence/refresh-events?tenantKey=${encodeURIComponent(tenantKey)}`,
      {
        signal: controller.signal,
        cache: "no-store",
      },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`refresh-events ${response.status}`);
        return response.json() as Promise<RefreshEventsResponse>;
      })
      .then((payload) => {
        setLiveRows(payload.events.map(mapEvent));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.warn(
          "[ContextChangeLogTab] refresh-events fetch failed",
          error,
        );
        setLiveRows(null);
      });
    return () => controller.abort();
  }, [tenantKey]);

  const sourceRows = liveRows ?? CHANGES;
  const rows = useMemo(() => {
    return sourceRows.filter((entry) => {
      if (filter !== "all" && entry.tag !== filter) return false;
      if (reviewFilter === "review" && entry.rev !== "review") return false;
      return true;
    });
  }, [filter, reviewFilter, sourceRows]);

  return (
    <div>
      <h2
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 21,
          fontWeight: 400,
          margin: "0 0 2px",
          color: C.ink,
        }}
      >
        Change Log
      </h2>
      <p
        style={{
          color: C.muted,
          fontSize: 12.5,
          margin: "0 0 14px",
          maxWidth: 720,
        }}
      >
        What changed this period and what needs review before it&apos;s trusted.
      </p>

      {/* Filter chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap" as const,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            color: C.muted,
            alignSelf: "center",
            marginRight: 2,
            textTransform: "uppercase" as const,
            letterSpacing: "0.4px",
          }}
        >
          Filter
        </span>
        {FILTER_TABS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              fontSize: 11.5,
              border: `1px solid ${filter === f.key ? C.ink : C.line}`,
              background: filter === f.key ? C.ink : "#fff",
              borderRadius: 20,
              padding: "4px 10px",
              color: filter === f.key ? "#fff" : C.muted,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f.label}
          </button>
        ))}
        <span
          style={{
            fontSize: 10.5,
            color: C.muted,
            alignSelf: "center",
            marginLeft: 10,
            marginRight: 2,
            textTransform: "uppercase" as const,
            letterSpacing: "0.4px",
          }}
        >
          Review state
        </span>
        {[
          { key: "all" as ReviewFilter, label: "All" },
          { key: "review" as ReviewFilter, label: "Needs review" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setReviewFilter(f.key)}
            style={{
              fontSize: 11.5,
              border: `1px solid ${reviewFilter === f.key ? C.ink : C.line}`,
              background: reviewFilter === f.key ? C.ink : "#fff",
              borderRadius: 20,
              padding: "4px 10px",
              color: reviewFilter === f.key ? "#fff" : C.muted,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Change table */}
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}
        >
          <thead>
            <tr>
              {["When", "Change", "Handling", "→ Surface"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: 10,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.5px",
                    color: C.muted,
                    fontWeight: 600,
                    padding: "0 10px 8px",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((ch, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    padding: "9px 10px",
                    borderBottom:
                      idx < rows.length - 1 ? `1px solid ${C.line2}` : "none",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap" as const,
                    color: C.muted,
                    fontSize: 12,
                  }}
                >
                  {ch.t}
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    borderBottom:
                      idx < rows.length - 1 ? `1px solid ${C.line2}` : "none",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: ch.mat === "high" ? C.stale : C.attention,
                      display: "inline-block",
                      verticalAlign: "middle",
                      marginRight: 6,
                    }}
                  />
                  {ch.txt}
                  <br />
                  <span style={{ fontSize: 10.5, color: C.muted }}>
                    {ch.src} · {ch.ty}
                  </span>
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    borderBottom:
                      idx < rows.length - 1 ? `1px solid ${C.line2}` : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: ch.rev === "review" ? C.reviewBg : C.freshBg,
                      color: ch.rev === "review" ? C.review : C.fresh,
                    }}
                  >
                    {ch.rev === "review" ? "Needs review" : "Auto"}
                  </span>
                  {ch.rev === "review" && (
                    <a
                      href="/admin/context-layer/triage"
                      style={{
                        display: "block",
                        marginTop: 5,
                        color: C.review,
                        fontSize: 10.5,
                        textDecoration: "none",
                      }}
                    >
                      Open in Triage Queue
                    </a>
                  )}
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    borderBottom:
                      idx < rows.length - 1 ? `1px solid ${C.line2}` : "none",
                    color: C.muted,
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap" as const,
                    fontSize: 12,
                  }}
                >
                  {ch.sf}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "24px 10px",
                    color: C.muted,
                    textAlign: "center",
                  }}
                >
                  {liveRows
                    ? "No changes recorded yet. Changes appear here when context is refreshed."
                    : "No changes match this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          fontSize: 11.5,
          color: C.muted,
          marginTop: 10,
        }}
      >
        <strong>
          {sourceRows.filter((row) => row.rev === "review").length} changes
        </strong>{" "}
        awaiting review this month → Context Inbox.
      </div>
    </div>
  );
}
