"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { quotability, traceLine, type FactLineage } from "./fact-lineage";
import { MONO, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * A figure that shows its own working.
 *
 * The interaction is Tower's, deliberately: a small trailing icon on the value, click opens a
 * floating panel, outside-click and Escape close it. That contract was locked for Tower's CFO view
 * and a reader who learns it there should not have to learn a second one on Home -- inventing a
 * parallel affordance for the same job is how a product stops feeling like one product.
 *
 * What differs is the content, because the question differs. Tower explains how a metric was
 * calculated and where it will come from at day N. Home explains what one row means, which file the
 * figure came from, and -- when another surface reports a different number for the same subject --
 * that number and the reason. Grain leads, because grouping decides the answer before any
 * arithmetic happens.
 */
const TONE: Record<string, { color: string; word: string }> = {
  single_source: { color: V4.amber, word: "one source" },
  corroborated: { color: V4.green, word: "corroborated" },
  conflict: { color: V4.red, word: "counts differ" },
};

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ ...eyebrow(V4.stone), fontSize: 9.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: SANS, fontSize: 12, lineHeight: 1.5, color: V4.inkSoft }}>{children}</div>
    </div>
  );
}

/** The trailing icon and its panel. Wraps any rendered value. */
export function LineageMark({ lineage, children }: { lineage: FactLineage; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const standing = quotability(lineage);
  const tone = TONE[standing.tone];

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      data-home-lineage={standing.tone}
      style={{ display: "inline-flex", alignItems: "baseline", gap: 4, position: "relative" }}
    >
      {children}
      <button
        type="button"
        aria-label={`Where ${lineage.label} comes from`}
        aria-expanded={open}
        data-home-lineage-trigger
        onClick={(event) => {
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 14,
          height: 14,
          padding: 0,
          marginLeft: 2,
          // The ring carries the standing, so a figure whose sources disagree is visible before it
          // is opened. Amber and red keep their reserved meanings: absence, and a rated problem.
          border: `1px solid ${tone.color}`,
          borderRadius: "50%",
          background: "transparent",
          color: V4.slate,
          fontSize: 9,
          fontFamily: SANS,
          fontWeight: 700,
          lineHeight: 1,
          cursor: "pointer",
          transition: "background 120ms ease, color 120ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = V4.cream;
          e.currentTarget.style.color = V4.ink;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = V4.slate;
        }}
      >
        ⓘ
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={`${lineage.label} — where it comes from`}
          data-home-lineage-panel
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 50,
            width: 340,
            background: V4.surface,
            border: `1px solid ${V4.ruleStrong}`,
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(10,12,18,0.12), 0 2px 6px rgba(10,12,18,0.06)",
            padding: 14,
            textAlign: "left",
          }}
        >
          <div style={{ ...eyebrow(V4.navy), fontSize: 10, letterSpacing: "0.14em", marginBottom: 9 }}>
            {lineage.label} · where it comes from
          </div>

          {/* Grain leads. It is the single most common reason two honest counts differ. */}
          <Section label="What one row means">{lineage.grain}</Section>

          <Section label="Source and rule">
            <span style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.6 }}>{traceLine(lineage)}</span>
          </Section>

          {(lineage.disagreements ?? []).map((other) => (
            <div
              key={`${other.source}-${other.value}`}
              style={{
                borderLeft: `2px solid ${other.reconciled ? V4.amber : V4.red}`,
                paddingLeft: 10,
                marginBottom: 10,
              }}
            >
              <div style={{ ...eyebrow(other.reconciled ? V4.amber : V4.red), fontSize: 9.5, marginBottom: 3 }}>
                {other.reconciled ? "Another surface counts differently" : "Unexplained disagreement"}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, lineHeight: 1.5, color: V4.inkSoft }}>
                <strong style={{ fontWeight: 600, color: V4.ink }}>
                  {typeof other.value === "number" ? other.value.toLocaleString() : other.value}
                </strong>{" "}
                from the {other.source}. {other.reason}
              </div>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${V4.ruleSoft}`, paddingTop: 9 }}>
            <div style={{ ...eyebrow(V4.stone), fontSize: 9.5, marginBottom: 3 }}>Standing</div>
            <div
              style={{
                fontFamily: SANS,
                fontSize: 12,
                lineHeight: 1.5,
                color: standing.quotable ? V4.inkSoft : V4.red,
              }}
            >
              {tone.word} — {standing.qualifier}
            </div>
          </div>
        </div>
      ) : null}
    </span>
  );
}

/** A hero-scale figure with its label and the mark trailing the number. */
export function LineageFigure({ lineage, size = 38 }: { lineage: FactLineage; size?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <LineageMark lineage={lineage}>
        <span style={{ fontFamily: SERIF, fontSize: size, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {typeof lineage.value === "number" ? lineage.value.toLocaleString() : lineage.value}
        </span>
      </LineageMark>
      <span style={{ fontFamily: SANS, fontSize: 13, color: V4.slate, lineHeight: 1.4 }}>{lineage.label}</span>
    </div>
  );
}
