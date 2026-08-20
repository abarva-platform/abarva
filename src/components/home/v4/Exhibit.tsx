import type { ReactNode } from "react";

import type { EnterpriseSignalPacket, VisualOpportunity } from "@/lib/home/preview/types";
import { sourceForIds } from "./source-label";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * A v4 exhibit is full-bleed, not a card. It carries its own headline in the same serif as the
 * chapter, states its own source, and -- crucially -- states its own truncation rule on the
 * surface rather than silently showing a top-N.
 *
 * The chart itself is drawn here rather than through the Recharts kit used by the previous Home:
 * the design's bar treatment (label · bar · share, with a remainder line) is a deliberate
 * information design, and reproducing it through a charting library's defaults would lose the
 * part that matters -- the explicit accounting for everything not drawn.
 */

interface Row {
  label: string;
  sharePct: number;
}

/**
 * The exhibit eyebrow names the exhibit's *subject* in two or three words.
 *
 * It deliberately does not use `visual.purpose`, which is written for the pipeline and reads like
 * it: "Show vendor spend concentration to support the single-vendor dependency narrative". Telling
 * a CXO that an exhibit exists to support a narrative is both jargon and a bad look -- it frames
 * their own data as evidence assembled for an argument. The subject label is what belongs on the
 * page; the purpose string stays internal.
 */
const DATASET_SUBJECT: Record<string, string> = {
  vendor_spend_concentration: "Third-party spend",
  technology_spend_mix: "Technology spend",
  application_landscape_by_function: "Application estate",
  program_investment_distribution: "Program investment",
  stalled_programs: "Program delivery",
  metric_target_attainment: "Metric attainment",
  leadership_theme_frequency: "Leadership themes",
  leadership_evidence_alignment: "Testimony against record",
  risk_system_concentration: "Risk concentration",
};

/** Reads a dataset row into the shape the bar list needs, using the field names the deterministic
 * visual datasets actually publish. Returns null when a row cannot be read, so a malformed row is
 * dropped visibly rather than rendered as a zero-length bar that reads as "no spend". */
function readRow(row: Record<string, unknown>): Row | null {
  const labelKey = ["vendor", "system", "program", "theme", "function", "label", "name", "metric"].find(
    (k) => typeof row[k] === "string",
  );
  const shareKey = ["sharePct", "share_pct", "pct", "percent"].find((k) => typeof row[k] === "number");
  if (!labelKey || !shareKey) return null;
  return { label: row[labelKey] as string, sharePct: row[shareKey] as number };
}

export function ExhibitBars({ rows, dark = false }: { rows: Array<Record<string, unknown>>; dark?: boolean }) {
  const parsed = rows.map(readRow).filter((r): r is Row => r !== null);
  if (parsed.length === 0) return null;
  const widest = Math.max(...parsed.map((r) => r.sharePct));
  const shown = parsed.reduce((a, r) => a + r.sharePct, 0);
  const remainder = Math.max(0, 100 - shown);
  // Emphasis is computed, not chosen: a row is emphasised when its share exceeds the mean of the
  // rows drawn. That is what makes a concentration visible without anyone deciding per tenant
  // which names deserve weight.
  const mean = shown / parsed.length;
  // On the navy ground the cream track disappears and the navy fill vanishes into the background;
  // both invert so the same bar reads on either ground.
  const track = dark ? "rgba(250,247,241,0.16)" : V4.cream;
  const fillLead = dark ? V4.paper : V4.navy;
  const fillRest = dark ? "rgba(250,247,241,0.55)" : "rgba(12,26,58,0.55)";
  const labelLead = dark ? V4.paper : V4.ink;
  const labelRest = dark ? "rgba(250,247,241,0.72)" : V4.slate;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {parsed.map((row) => {
          const lead = row.sharePct > mean;
          return (
            <div
              key={row.label}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,240px) minmax(0,1fr) 84px",
                alignItems: "center",
                gap: "clamp(10px,1.4vw,20px)",
              }}
            >
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  fontWeight: lead ? 500 : 400,
                  color: lead ? labelLead : labelRest,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={row.label}
              >
                {row.label}
              </span>
              <span style={{ height: 30, background: track, display: "block" }}>
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${Math.max(0.5, (row.sharePct / widest) * 100)}%`,
                    background: lead ? fillLead : fillRest,
                  }}
                />
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, textAlign: "right", color: lead ? labelLead : labelRest }}>
                {row.sharePct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          margin: "18px 0 0",
          paddingTop: 14,
          borderTop: `1px dashed ${dark ? "rgba(250,247,241,0.35)" : V4.ruleStrong}`,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: SANS, fontSize: 14, color: dark ? "rgba(250,247,241,0.82)" : V4.slate }}>
          {remainder > 0.05 ? (
            <>
              Everything not drawn holds <strong style={{ color: dark ? V4.paper : V4.ink, fontWeight: 600 }}>{remainder.toFixed(1)}%</strong>{" "}
              between it. None of it exceeds {parsed[parsed.length - 1].sharePct.toFixed(1)}%.
            </>
          ) : (
            <>These are all of the records in this measure. Nothing is omitted.</>
          )}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: dark ? "rgba(250,247,241,0.75)" : V4.slate }}>
          BARS COMPARE THE {parsed.length} LARGEST ONLY
        </span>
      </div>
    </>
  );
}

export function Exhibit({
  index,
  visual,
  signalPacket,
  meta,
  dark = false,
  children,
}: {
  index: number;
  visual: VisualOpportunity;
  signalPacket: EnterpriseSignalPacket;
  /** Right-hand counts line, derived by the caller from real records. Omitted when unavailable --
   * never estimated. */
  meta?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  const source = sourceForIds(visual.evidence_ids, signalPacket);
  const fg = dark ? "rgba(250,247,241,0.86)" : V4.slate;
  const eyebrowColor = dark ? "rgba(250,247,241,0.62)" : V4.blue;

  return (
    <figure
      style={{
        margin: 0,
        background: dark ? V4.navy : V4.paper,
        padding: `48px ${PAGE_X}px 44px`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          paddingRight: 70,
        }}
      >
        <span style={eyebrow(eyebrowColor)}>
          Exhibit {String(index).padStart(2, "0")}
          {DATASET_SUBJECT[visual.dataset_ref] ? ` · ${DATASET_SUBJECT[visual.dataset_ref]}` : ""}
        </span>
        {meta ? (
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: fg }}>{meta}</span>
        ) : null}
      </div>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(26px,2.4vw,36px)",
          fontWeight: 500,
          letterSpacing: "-0.026em",
          lineHeight: 1.16,
          margin: "14px 0 34px",
          maxWidth: "46ch",
          textWrap: "balance",
          color: dark ? V4.paper : V4.ink,
        }}
      >
        {visual.key_message}
      </h2>
      {children}
      <figcaption
        style={{
          margin: "30px 0 0",
          paddingTop: 20,
          borderTop: `1px solid ${dark ? "rgba(250,247,241,0.18)" : V4.rule}`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(24rem,40%)),1fr))",
          gap: "clamp(20px,3vw,48px)",
        }}
      >
        <p style={{ margin: 0, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.6, color: fg, maxWidth: "76ch", textWrap: "pretty" }}>
          {visual.title}
        </p>
        <div>
          <div style={{ ...eyebrow(fg), marginBottom: 9 }}>Source</div>
          <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, lineHeight: 1.7, color: fg }}>
            {source.label}
            <br />
            {source.ids}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
