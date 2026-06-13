"use client";

// Deliverable artifact card — renders a grounded deliverable (every claim cited
// inline or flagged [MISSING EVIDENCE]) + a refinement side-panel whose contract
// is explicit: it sharpens narrative/structure but cannot add a fact not in the
// evidence. Within the locked identity (IA/density/disclosure only).

import { useEffect, useState } from "react";
import type { GeneratedDeliverable } from "@/lib/programs/deliverable-refinement";
import {
  resolveSourceLabel,
  scrubInternalSourceTags,
} from "@/lib/programs/deliverables/source-labels";

const INTENTS = ["quality", "structure", "depth", "audience", "tone"] as const;

export function DeliverableArtifactCard({
  programId,
  deliverableKey = "program_charter",
}: {
  programId: string;
  deliverableKey?: string;
}) {
  const [doc, setDoc] = useState<GeneratedDeliverable | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [intent, setIntent] = useState<(typeof INTENTS)[number]>("quality");
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(
      `/api/v1/programs/${programId}/current-state/deliverable?key=${deliverableKey}`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((j) => {
        if (alive) {
          setDoc(j);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [programId, deliverableKey]);

  async function refine() {
    if (!prompt.trim() || refining) return;
    setRefining(true);
    try {
      const r = await fetch(
        `/api/v1/programs/${programId}/current-state/deliverable`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            key: deliverableKey,
            prompt,
            intent,
            scope: "whole",
          }),
        },
      );
      const j = await r.json();
      if (j && j.sections) {
        setDoc(j);
        setPrompt("");
      }
    } finally {
      setRefining(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    border: "1px solid var(--abarva-mist, #e6e3dc)",
    borderRadius: 8,
    padding: "14px 16px",
    background: "#fff",
    marginBottom: 16,
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--abarva-mono)",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: "var(--abarva-slate)",
  };

  if (loading) {
    return (
      <section style={cardStyle}>
        <div style={labelStyle}>Program Charter (grounded draft)</div>
        <div
          style={{ fontSize: 12, color: "var(--abarva-stone)", marginTop: 8 }}
        >
          Generating from committed evidence…
        </div>
      </section>
    );
  }
  if (!doc || !doc.sections) return null;
  const env = doc.envelope;

  return (
    <section style={cardStyle} id="ws-canvas-deliverable-charter">
      <div style={labelStyle}>
        Program Charter (grounded draft)
        <span
          style={{
            marginLeft: 8,
            fontWeight: 400,
            textTransform: "none",
            color: "var(--abarva-stone)",
          }}
        >
          &mdash; v{doc.version}
        </span>
      </div>

      {/* Grounding envelope strip */}
      <div
        style={{
          margin: "8px 0 12px",
          fontSize: 10,
          fontFamily: "var(--abarva-mono)",
          color: "var(--abarva-stone)",
          letterSpacing: "0.04em",
        }}
      >
        {env.tenantResolved} · {env.archetypeResolved} · confidence{" "}
        {env.confidence.replace(/_/g, " ")} · {env.citations.length} cited ·{" "}
        {env.missingEvidence.length} missing
        {env.unsupportedClaims.length === 0
          ? " · 0 unsupported"
          : ` · ${env.unsupportedClaims.length} UNSUPPORTED`}
      </div>

      {/* Sections */}
      {doc.sections.map((s) => (
        <div key={s.heading} style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--abarva-ink)",
              fontFamily: "var(--abarva-serif, Georgia, serif)",
              marginBottom: 3,
            }}
          >
            {s.heading}
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {s.claims.map((c, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--abarva-slate)",
                  lineHeight: 1.5,
                  padding: "2px 0",
                }}
              >
                {c.missingEvidence ? (
                  <span
                    style={{
                      color: "var(--canon-red, #b3261e)",
                      fontWeight: 600,
                    }}
                  >
                    [MISSING EVIDENCE: {resolveSourceLabel(c.missingEvidence).title}]{" "}
                    <span
                      style={{ fontWeight: 400, color: "var(--abarva-stone)" }}
                    >
                      {scrubInternalSourceTags(c.text)}
                    </span>
                  </span>
                ) : (
                  <span>
                    {scrubInternalSourceTags(c.text)}
                    {c.citation ? (
                      <span
                        style={{
                          marginLeft: 6,
                          fontFamily: "var(--abarva-mono)",
                          fontSize: 10,
                          color: "#3a6a4f",
                        }}
                      >
                        · {resolveSourceLabel(c.citation).title}
                      </span>
                    ) : null}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Refinement panel */}
      <div
        style={{
          marginTop: 12,
          padding: "10px 12px",
          borderRadius: 6,
          background: "rgba(0,0,0,0.02)",
          border: "1px solid var(--abarva-mist, #e6e3dc)",
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "var(--abarva-stone)",
            lineHeight: 1.4,
            marginBottom: 6,
            fontStyle: "italic",
          }}
        >
          Refinement sharpens narrative, structure, depth and audience — it
          cannot add a fact not in the evidence.
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Refine: e.g. sharpen the executive summary, go deeper on the baseline, reframe for the CFO…"
          rows={2}
          style={{
            width: "100%",
            fontSize: 12,
            fontFamily: "var(--abarva-sans, inherit)",
            padding: "6px 8px",
            border: "1px solid var(--abarva-mist, #e6e3dc)",
            borderRadius: 5,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <select
            value={intent}
            onChange={(e) =>
              setIntent(e.target.value as (typeof INTENTS)[number])
            }
            style={{
              fontSize: 11,
              padding: "3px 6px",
              borderRadius: 5,
              border: "1px solid var(--abarva-mist,#e6e3dc)",
            }}
          >
            {INTENTS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <button
            onClick={refine}
            disabled={refining || !prompt.trim()}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              background: "var(--abarva-ink, #0a0a0a)",
              border: "none",
              borderRadius: 5,
              padding: "5px 14px",
              cursor: refining || !prompt.trim() ? "default" : "pointer",
              opacity: refining || !prompt.trim() ? 0.5 : 1,
            }}
          >
            {refining ? "Refining…" : "Refine"}
          </button>
        </div>
      </div>

      {doc.refinementLog.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {doc.refinementLog.map((e) => (
            <div
              key={e.version}
              style={{
                fontSize: 10,
                color: "var(--abarva-stone)",
                lineHeight: 1.4,
              }}
            >
              {e.note}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
