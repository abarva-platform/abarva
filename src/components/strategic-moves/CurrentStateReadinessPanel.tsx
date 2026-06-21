"use client";

// Current-state readiness panel — renders the estate-derived current-state
// instruments for a Move at a phase (committed vs missing), why each is needed,
// and a "Provide…" CSV upload for the families whose deterministic ingest is
// wired. Honest ladder: a family flips to "Committed" only after rows land in its
// tower_* table (the server resolver re-reads on reload).

import { useState } from "react";
import type {
  ReadinessReport,
  ReadinessStatus,
} from "@/lib/programs/current-state-readiness";
import type { CurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import type { CurrentStatePlan } from "@/lib/programs/current-state-plan";
import { resolveSourceLabel } from "@/lib/programs/deliverables/source-labels";

const usd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${Math.round(n / 1000)}k`;

// Families with a wired deterministic CSV ingest (matches the ingest route).
const INGEST_WIRED = new Set<string>([
  "eng_performance_dora",
  "it_systems_landscape",
  "it_org_structure",
]);

const STATUS_LABEL: Record<ReadinessStatus, string> = {
  committed: "Committed",
  review_required: "Review required",
  parsing: "Parsing",
  staged: "Staged",
  missing: "Missing",
};
const STATUS_COLOR: Record<ReadinessStatus, string> = {
  committed: "#3a6a4f", // sober, earned — not a celebratory green
  review_required: "#b26a00", // parsed but not yet promoted — amber, honest
  parsing: "#b26a00",
  staged: "#b26a00",
  missing: "var(--abarva-stone)",
};

// The full governed evidence ladder. v1 reaches `committed`; the governed states
// (indexed → agent_ready) require the promotion workflow (PR-4) and are NEVER
// auto-advanced — shown here so the user sees the honest distance to agent-ready.
const FULL_LADDER = [
  "missing",
  "staged",
  "parsing",
  "committed",
  "indexed",
  "retrievable",
  "citation_ready",
  "promotion_candidate",
  "agent_ready",
] as const;
const LADDER_LABEL: Record<string, string> = {
  missing: "Missing",
  staged: "Staged",
  parsing: "Parsing",
  committed: "Committed",
  indexed: "Indexed",
  retrievable: "Retrievable",
  citation_ready: "Cited",
  promotion_candidate: "Promotable",
  agent_ready: "Agent-ready",
};
const PROMOTION_BOUNDARY = FULL_LADDER.indexOf("indexed"); // governed beyond committed

/** The honest ladder as a sober progress track — the hero of each evidence row. */
function LadderTrack({ status }: { status: ReadinessStatus }) {
  // 'review_required' is a document-path state that sits AFTER parsing but BEFORE
  // committed — it is parsed, pending governed promotion. Map it onto the ladder
  // at 'parsing' so committed stays honestly unfilled until approval.
  const reached =
    status === "review_required"
      ? FULL_LADDER.indexOf("parsing")
      : FULL_LADDER.indexOf(status);
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {FULL_LADDER.map((stage, idx) => {
          const filled = idx <= reached && reached >= 0;
          const governed = idx >= PROMOTION_BOUNDARY;
          return (
            <span
              key={stage}
              title={
                LADDER_LABEL[stage] + (governed ? " (governed promotion)" : "")
              }
              style={{
                width: idx === reached ? 16 : 10,
                height: 5,
                borderRadius: 2,
                flexShrink: 0,
                background: filled
                  ? "var(--abarva-ink, #0a0a0a)"
                  : governed
                    ? "transparent"
                    : "var(--abarva-mist, #e2ded5)",
                border:
                  governed && !filled
                    ? "1px dashed var(--abarva-stone)"
                    : "none",
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          marginTop: 3,
          fontSize: 9,
          fontFamily: "var(--abarva-mono)",
          letterSpacing: "0.06em",
          color: "var(--abarva-stone)",
        }}
      >
        {status === "review_required"
          ? "Review required · parsed, pending approval"
          : `${LADDER_LABEL[status]} · stage ${reached + 1}/9`}{" "}
        · governed promotion beyond committed (no auto agent-ready)
      </div>
    </div>
  );
}

/**
 * "Where to start" — the ranked team-archetype recommendation. Extracted
 * verbatim from the readiness panel body so the phase workspace can collapse
 * it as its own progressive-disclosure panel. Pure presentational.
 */
export function WhereToStartBlock({
  recommendation,
}: {
  recommendation: CurrentStateRecommendation;
}) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 6,
        background: "rgba(0,102,204,0.04)",
        border: "1px solid rgba(0,102,204,0.16)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--abarva-mono)",
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "var(--abarva-slate)",
          marginBottom: 6,
        }}
      >
        Where to start
        <span
          style={{
            marginLeft: 8,
            fontWeight: 400,
            textTransform: "none",
            color: "var(--abarva-stone)",
          }}
        >
          &mdash; confidence:{" "}
          {recommendation.overallConfidence.replace(/_/g, " ")}
        </span>
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--abarva-ink)",
          lineHeight: 1.5,
        }}
      >
        {recommendation.whereToStart}
      </div>
      {/* Level 1: ranked rows. Level 2: the leverage breakdown. Level 3: each term's basis. */}
      <div style={{ margin: "8px 0 0" }}>
        {recommendation.ranking.map((t) => {
          const terms = [
            {
              k: "AI-applicability",
              v: t.aiApplicability,
              basis: t.aiApplicabilityBasis,
            },
            {
              k: "Readiness",
              v: t.normalizedReadiness,
              basis: t.readinessBasis,
            },
            { k: "Gap-upside", v: t.gapUpside, basis: t.gapUpsideBasis },
          ];
          return (
            <details key={t.teamArchetype} style={{ padding: "2px 0" }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--abarva-slate)",
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                  listStyle: "none",
                }}
              >
                <span style={{ fontWeight: 700 }}>#{t.rank}</span>
                <span style={{ flex: 1 }}>{t.label}</span>
                <span
                  style={{
                    fontFamily: "var(--abarva-mono)",
                    fontSize: 11,
                    color: "var(--abarva-stone)",
                  }}
                >
                  {t.aiApplicability}×{t.normalizedReadiness}×{t.gapUpside} ={" "}
                  <strong style={{ color: "var(--abarva-ink)" }}>
                    {t.score}
                  </strong>{" "}
                  · {t.confidence.replace(/_/g, " ")}
                </span>
              </summary>
              <div style={{ paddingLeft: 18, marginTop: 4 }}>
                {terms.map((term) => (
                  <details key={term.k} style={{ padding: "1px 0" }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        fontSize: 11,
                        color: "var(--abarva-slate)",
                        listStyle: "none",
                      }}
                    >
                      {term.k}:{" "}
                      <span
                        style={{
                          fontFamily: "var(--abarva-mono)",
                          color: "var(--abarva-ink)",
                        }}
                      >
                        {term.v}
                      </span>
                    </summary>
                    <div
                      style={{
                        paddingLeft: 14,
                        fontSize: 11,
                        color: "var(--abarva-stone)",
                        lineHeight: 1.4,
                      }}
                    >
                      {term.basis}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

/**
 * "Indicative plan & cost" — the roadmap-phase cost ladder. Extracted verbatim
 * from the readiness panel body so the phase workspace can collapse it as its
 * own progressive-disclosure panel. Pure presentational.
 */
export function IndicativePlanBlock({ plan }: { plan: CurrentStatePlan }) {
  return (
    <div
      style={{
        marginBottom: 12,
        padding: "10px 12px",
        borderRadius: 6,
        background: "rgba(0,0,0,0.02)",
        border: "1px solid var(--abarva-mist, #e6e3dc)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--abarva-mono)",
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "var(--abarva-slate)",
          marginBottom: 6,
        }}
      >
        Indicative plan &amp; cost
        <span
          style={{
            marginLeft: 8,
            fontWeight: 400,
            textTransform: "none",
            color: "var(--abarva-ink)",
          }}
        >
          &mdash; {usd(plan.estimate.totalCost.low)}–
          {usd(plan.estimate.totalCost.high)}
        </span>
      </div>
      <ol style={{ margin: "4px 0 0", paddingLeft: 18 }}>
        {plan.roadmap.phases.map((ph) => (
          <li
            key={ph.id}
            style={{
              fontSize: 12,
              color: "var(--abarva-slate)",
              padding: "2px 0",
            }}
          >
            {ph.label}
            <span
              style={{
                color: "var(--abarva-stone)",
                fontFamily: "var(--abarva-mono)",
                fontSize: 11,
              }}
            >
              {" "}
              — {usd(ph.cost.low)}–{usd(ph.cost.high)}
              {ph.isFoundational ? " · enablement" : ""}
            </span>
          </li>
        ))}
      </ol>
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          color: "var(--abarva-stone)",
          lineHeight: 1.4,
        }}
      >
        {plan.note} Rate card: {plan.rateCardProvenance}
      </div>
    </div>
  );
}

export function CurrentStateReadinessPanel({
  readiness,
  recommendation,
  plan,
  programId,
}: {
  readiness: ReadinessReport | null;
  recommendation?: CurrentStateRecommendation | null;
  plan?: CurrentStatePlan | null;
  programId: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  if (!readiness || readiness.instruments.length === 0) return null;

  // The hard gaps as a ranked "what's the cheapest thing to do next" list —
  // wired CSV ingest (upload) ranks cheapest, then CSV-coming, then chat-captured.
  const unblockGaps = readiness.instruments
    .filter((i) => i.severity === "hard" && i.status !== "committed")
    .map((i) => {
      const wired = INGEST_WIRED.has(i.key) && !!i.backingTable;
      // Document families: status review_required (parsed, awaiting approval)
      // ranks ahead of missing — the cheapest next move is to approve.
      const effort = wired
        ? 0
        : i.documentFamily
          ? i.status === "review_required"
            ? 0
            : 1
          : i.backingTable
            ? 1
            : 2;
      const path = wired
        ? `Upload ${i.sourceDocHint}`
        : i.documentFamily
          ? i.status === "review_required"
            ? "Approve parsed document below"
            : "Upload document (review-required)"
          : i.backingTable
            ? "CSV ingest coming — supply via Ava"
            : "Capture with Ava";
      return { i, effort, path, wired };
    })
    .sort((a, b) => a.effort - b.effort);

  async function provide(family: string, file: File) {
    setBusy(family);
    setNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("family", family);
      fd.append("provenance", "representative_synthetic");
      if (readiness?.archetypeId) {
        fd.append("archetypeId", readiness.archetypeId);
      }
      const res = await fetch(
        `/api/v1/programs/${programId}/current-state/ingest`,
        { method: "POST", body: fd },
      );
      const j = await res.json();
      if (res.ok && j.committedRows > 0) {
        setNote(
          `${family}: committed ${j.committedRows} of ${j.parsedRows} parsed rows — refreshing…`,
        );
        setTimeout(() => window.location.reload(), 900);
      } else {
        setNote(
          `${family}: ${(j.errors && j.errors.join("; ")) || j.error || "parse/commit failed"} (parsed ${j.parsedRows ?? 0})`,
        );
      }
    } catch {
      setNote(`${family}: upload failed`);
    } finally {
      setBusy(null);
    }
  }

  // Document path: PDF/PPTX/DOCX/XLSX/CSV → parse → review_required (or auto-commit
  // for a schema-validated KPI table). Never silently committed.
  async function provideDoc(family: string, file: File) {
    setBusy(family);
    setNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("family", family);
      fd.append("phase", String(readiness?.phase ?? 1));
      // The family must be looked up in the SAME archetype this readiness
      // report was resolved against (e.g. ops families don't exist in AI-PDLC).
      if (readiness?.archetypeId) {
        fd.append("archetypeId", readiness.archetypeId);
      }
      const res = await fetch(
        `/api/v1/programs/${programId}/current-state/ingest-doc`,
        { method: "POST", body: fd },
      );
      const j = await res.json();
      if (res.ok && j.ok) {
        setNote(
          j.autoPromoted
            ? `${family}: structured KPI table validated and committed — refreshing…`
            : `${family}: parsed via ${j.parseMethod} (confidence ${Math.round((j.confidence ?? 0) * 100)}%) — review required before it counts as committed. Refreshing…`,
        );
        setTimeout(() => window.location.reload(), 1100);
      } else {
        setNote(`${family}: ${j.error || j.detail || "parse failed"}`);
      }
    } catch {
      setNote(`${family}: upload failed`);
    } finally {
      setBusy(null);
    }
  }

  // The governed promotion: approve/reject a pending document review. Approval is
  // what turns review_required → committed.
  async function decide(
    family: string,
    evidenceId: string,
    decision: "approved" | "rejected",
  ) {
    setBusy(`${family}:${evidenceId}`);
    setNote(null);
    try {
      const res = await fetch(
        `/api/v1/programs/${programId}/current-state/evidence/${evidenceId}/approve`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const j = await res.json();
      if (res.ok && j.ok) {
        setNote(
          `${family}: evidence ${decision} — ${decision === "approved" ? "now committed" : "rejected, not committed"}. Refreshing…`,
        );
        setTimeout(() => window.location.reload(), 900);
      } else {
        setNote(`${family}: ${j.error || "review action failed"}`);
      }
    } catch {
      setNote(`${family}: review action failed`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      id="ws-canvas-current-state-readiness"
      style={{
        border: "1px solid var(--abarva-mist, #e6e3dc)",
        borderRadius: 8,
        padding: "14px 16px",
        background: "#fff",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontFamily: "var(--abarva-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "var(--abarva-slate)",
          marginBottom: 10,
        }}
      >
        Current-state readiness
        <span style={{ marginLeft: 8, fontWeight: 400, textTransform: "none" }}>
          &mdash; {readiness.coverageScore}% collected
          {readiness.hardGaps.length > 0 &&
            ` · ${readiness.hardGaps.length} hard gap${readiness.hardGaps.length > 1 ? "s" : ""}`}
        </span>
        <span
          style={{
            float: "right",
            fontWeight: 400,
            fontSize: 9,
            color: "var(--abarva-stone)",
            textTransform: "none",
          }}
        >
          {readiness.archetypeName} · v{readiness.archetypeVersion}
        </span>
      </div>

      {readiness.hardGaps.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            borderRadius: 6,
            background: "rgba(179,38,30,0.04)",
            border: "1px solid rgba(179,38,30,0.18)",
            fontSize: 12,
            color: "var(--abarva-slate)",
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: "var(--canon-red, #b3261e)" }}>
            {readiness.hardGaps.length} hard current-state gap
            {readiness.hardGaps.length > 1 ? "s" : ""}.
          </strong>{" "}
          Charter claims that rest on this evidence will be unsourced until it
          is provided and committed — the engine will say so rather than
          fabricate.
        </div>
      )}

      {unblockGaps.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 6,
            background: "#fff",
            borderLeft: "3px solid var(--abarva-ink, #0a0a0a)",
            border: "1px solid var(--abarva-mist, #e6e3dc)",
            borderLeftWidth: 3,
            borderLeftColor: "var(--abarva-ink, #0a0a0a)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--abarva-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--abarva-ink)",
              marginBottom: 6,
            }}
          >
            To unblock this charter
            <span
              style={{
                marginLeft: 8,
                fontWeight: 400,
                textTransform: "none",
                color: "var(--abarva-stone)",
              }}
            >
              &mdash; {unblockGaps.length} hard gap
              {unblockGaps.length > 1 ? "s" : ""}, cheapest first
            </span>
          </div>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              counterReset: "g",
            }}
          >
            {unblockGaps.map((g) => (
              <li
                key={g.i.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 0",
                  borderTop: "1px solid var(--abarva-mist, #efece5)",
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontWeight: 600,
                    color: "var(--abarva-ink)",
                  }}
                >
                  {g.i.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--abarva-mono)",
                    fontSize: 10,
                    color: "var(--abarva-stone)",
                  }}
                >
                  {g.i.backingTable
                    ? resolveSourceLabel(g.i.backingTable).title
                    : "charter"}
                </span>
                {g.wired ? (
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                      background: "var(--abarva-ink, #0a0a0a)",
                      borderRadius: 5,
                      padding: "3px 10px",
                      cursor: busy ? "default" : "pointer",
                      opacity: busy ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {busy === g.i.key ? "Uploading…" : g.path}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      hidden
                      disabled={busy !== null}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) provide(g.i.key, f);
                      }}
                    />
                  </label>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--abarva-stone)",
                      fontStyle: "italic",
                      flexShrink: 0,
                    }}
                  >
                    {g.path}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {recommendation && recommendation.ranking.length > 0 && (
        <WhereToStartBlock recommendation={recommendation} />
      )}

      {plan && plan.roadmap.phases.length > 0 && (
        <IndicativePlanBlock plan={plan} />
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {readiness.instruments.map((i) => {
          const wired = INGEST_WIRED.has(i.key);
          return (
            <li
              key={i.key}
              style={{
                padding: "8px 0",
                borderTop: "1px solid var(--abarva-mist, #efece5)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--abarva-mono)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: STATUS_COLOR[i.status],
                    border: `1px solid ${STATUS_COLOR[i.status]}`,
                    borderRadius: 4,
                    padding: "1px 6px",
                    flexShrink: 0,
                  }}
                >
                  {STATUS_LABEL[i.status]}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                  {i.label}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--abarva-mono)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color:
                      i.severity === "hard"
                        ? "var(--canon-red, #b3261e)"
                        : "var(--abarva-stone)",
                    flexShrink: 0,
                  }}
                >
                  {i.severity}
                </span>
              </div>
              <LadderTrack status={i.status} />
              <div
                style={{
                  fontSize: 12,
                  color: "var(--abarva-slate)",
                  lineHeight: 1.45,
                }}
              >
                {i.whyNeeded}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--abarva-stone)",
                  lineHeight: 1.4,
                }}
              >
                {i.rationale}
                {i.backingTable
                  ? ` · committed to ${resolveSourceLabel(i.backingTable).title}`
                  : ""}
              </div>
              {/* Pending document reviews — the governed promotion control. */}
              {i.documentFamily && i.pendingReviews.length > 0 && (
                <div
                  style={{
                    marginTop: 4,
                    padding: "6px 8px",
                    borderRadius: 5,
                    background: "rgba(178,106,0,0.05)",
                    border: "1px solid rgba(178,106,0,0.22)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--abarva-mono)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "#8a5200",
                      marginBottom: 4,
                    }}
                  >
                    {i.pendingReviews.length} parsed document
                    {i.pendingReviews.length > 1 ? "s" : ""} awaiting review
                  </div>
                  {i.pendingReviews.map((p) => (
                    <div
                      key={p.evidenceId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "3px 0",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ flex: 1, color: "var(--abarva-slate)" }}>
                        {p.title}
                        <span
                          style={{
                            color: "var(--abarva-stone)",
                            fontFamily: "var(--abarva-mono)",
                            fontSize: 10,
                          }}
                        >
                          {" "}
                          · {p.parseMethod} · {Math.round(p.confidence * 100)}%
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => decide(i.key, p.evidenceId, "approved")}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#fff",
                          background: "var(--abarva-ink, #0a0a0a)",
                          border: "none",
                          borderRadius: 5,
                          padding: "3px 10px",
                          cursor: busy ? "default" : "pointer",
                          opacity: busy ? 0.5 : 1,
                        }}
                      >
                        {busy === `${i.key}:${p.evidenceId}`
                          ? "Working…"
                          : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => decide(i.key, p.evidenceId, "rejected")}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--abarva-slate)",
                          background: "transparent",
                          border: "1px solid var(--abarva-mist, #d8d4ca)",
                          borderRadius: 5,
                          padding: "3px 10px",
                          cursor: busy ? "default" : "pointer",
                          opacity: busy ? 0.5 : 1,
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {i.status !== "committed" && (
                <div style={{ marginTop: 2 }}>
                  {i.documentFamily ? (
                    <label
                      style={{
                        display: "inline-block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--abarva-ink, #0a0a0a)",
                        border: "1px solid var(--abarva-ink, #0a0a0a)",
                        borderRadius: 5,
                        padding: "4px 10px",
                        cursor: busy ? "default" : "pointer",
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      {busy === i.key
                        ? "Uploading…"
                        : "Provide document (PDF / PPTX / DOCX / XLSX)"}
                      <input
                        type="file"
                        accept=".pdf,.pptx,.docx,.xlsx,.csv,application/pdf"
                        hidden
                        disabled={busy !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) provideDoc(i.key, f);
                        }}
                      />
                    </label>
                  ) : wired ? (
                    <label
                      style={{
                        display: "inline-block",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--abarva-ink, #0a0a0a)",
                        border: "1px solid var(--abarva-ink, #0a0a0a)",
                        borderRadius: 5,
                        padding: "4px 10px",
                        cursor: busy ? "default" : "pointer",
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      {busy === i.key
                        ? "Uploading…"
                        : `Provide ${i.sourceDocHint}`}
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        hidden
                        disabled={busy !== null}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) provide(i.key, f);
                        }}
                      />
                    </label>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--abarva-stone)",
                        fontStyle: "italic",
                      }}
                    >
                      {i.backingTable
                        ? "Deterministic CSV ingest coming — supply via Ava for now."
                        : "Captured in the charter with Ava."}
                    </span>
                  )}
                  {i.documentFamily && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        color: "var(--abarva-stone)",
                        fontStyle: "italic",
                      }}
                    >
                      Free-form docs enter review-required; only a
                      schema-validated KPI table auto-commits.
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {note && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "var(--abarva-slate)",
          }}
        >
          {note}
        </div>
      )}
      <div
        style={{
          marginTop: 10,
          fontSize: 10,
          color: "var(--abarva-stone)",
          lineHeight: 1.4,
        }}
      >
        Representative/synthetic datasets enter via the governed upload path and
        are recorded as <code>document_extract</code> in the evidence ledger —
        never labelled a real client export.
      </div>
    </section>
  );
}
