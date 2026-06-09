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

const usd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${Math.round(n / 1000)}k`;

// Families with a wired deterministic CSV ingest (matches the ingest route).
const INGEST_WIRED = new Set<string>(["eng_performance_dora"]);

const STATUS_LABEL: Record<ReadinessStatus, string> = {
  committed: "Committed",
  parsing: "Parsing",
  staged: "Staged",
  missing: "Missing",
};
const STATUS_COLOR: Record<ReadinessStatus, string> = {
  committed: "#2e7d32",
  parsing: "#b26a00",
  staged: "#b26a00",
  missing: "var(--abarva-stone)",
};

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

  async function provide(family: string, file: File) {
    setBusy(family);
    setNote(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("family", family);
      fd.append("provenance", "representative_synthetic");
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
      </div>

      {recommendation && recommendation.ranking.length > 0 && (
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
          <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
            {recommendation.ranking.map((t) => (
              <li
                key={t.teamArchetype}
                style={{
                  fontSize: 12,
                  color: "var(--abarva-slate)",
                  padding: "3px 0",
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                }}
                title={`AI-applicability ${t.aiApplicability} × readiness ${t.normalizedReadiness} × gap-upside ${t.gapUpside}`}
              >
                <span style={{ fontWeight: 700, flexShrink: 0 }}>
                  #{t.rank}
                </span>
                <span style={{ flex: 1 }}>{t.label}</span>
                <span
                  style={{
                    fontFamily: "var(--abarva-mono)",
                    fontSize: 11,
                    color: "var(--abarva-stone)",
                  }}
                >
                  {t.aiApplicability}×{t.normalizedReadiness}×{t.gapUpside} ={" "}
                  {t.score}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan && plan.roadmap.phases.length > 0 && (
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
              <div
                style={{
                  fontSize: 12,
                  color: "var(--abarva-slate)",
                  lineHeight: 1.45,
                }}
              >
                {i.whyNeeded}
              </div>
              {i.status !== "committed" && (
                <div style={{ marginTop: 2 }}>
                  {wired ? (
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
                        ? "Deterministic CSV ingest coming — supply via Nexus for now."
                        : "Captured in the charter with Nexus."}
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
