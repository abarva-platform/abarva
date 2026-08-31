import { useState } from "react";
import { quotability, traceLine, type FactLineage } from "./fact-lineage";
import { MONO, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * A figure that shows its own working.
 *
 * Collapsed it reads as a number with a one-word standing. Opened it gives the grain, the files,
 * the rule, and — when another surface reports something different for the same subject — that
 * other figure and the reason, side by side. The reason is what turns a contradiction into an
 * explanation, and rendering both is what a portal cannot do.
 */
const TONE: Record<string, { color: string; word: string }> = {
  single_source: { color: V4.amber, word: "one source" },
  corroborated: { color: V4.green, word: "corroborated" },
  conflict: { color: V4.red, word: "counts differ" },
};

export function LineageFigure({ lineage, size = 38 }: { lineage: FactLineage; size?: number }) {
  const [open, setOpen] = useState(false);
  const standing = quotability(lineage);
  const tone = TONE[standing.tone];

  return (
    <div data-home-lineage={standing.tone} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontFamily: SERIF, fontSize: size, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {typeof lineage.value === "number" ? lineage.value.toLocaleString() : lineage.value}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 13, color: V4.slate, lineHeight: 1.4 }}>{lineage.label}</span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-home-lineage-toggle
        style={{
          all: "unset",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          alignSelf: "flex-start",
          padding: "3px 0",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: tone.color, display: "inline-block" }} />
        <span style={{ ...eyebrow(V4.slate), fontSize: 10 }}>{tone.word}</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: V4.blue }}>{open ? "hide working" : "show working"}</span>
      </button>

      {open ? (
        <div
          data-home-lineage-detail
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderTop: `1px solid ${V4.rule}`,
            paddingTop: 11,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={eyebrow(V4.stone)}>What one row means</span>
            <span style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.5 }}>{lineage.grain}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={eyebrow(V4.stone)}>Where it comes from</span>
            <span style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.65, color: V4.inkSoft }}>{traceLine(lineage)}</span>
          </div>

          {(lineage.disagreements ?? []).map((other) => (
            <div
              key={`${other.source}-${other.value}`}
              style={{
                borderLeft: `2px solid ${other.reconciled ? V4.amber : V4.red}`,
                paddingLeft: 11,
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <span style={eyebrow(other.reconciled ? V4.amber : V4.red)}>
                {other.reconciled ? "Another surface counts differently" : "Unexplained disagreement"}
              </span>
              <span style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.5 }}>
                <strong style={{ fontWeight: 600 }}>
                  {typeof other.value === "number" ? other.value.toLocaleString() : other.value}
                </strong>{" "}
                from the {other.source}. {other.reason}
              </span>
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={eyebrow(V4.stone)}>Standing</span>
            <span style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: standing.quotable ? V4.inkSoft : V4.red }}>
              {standing.qualifier}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
