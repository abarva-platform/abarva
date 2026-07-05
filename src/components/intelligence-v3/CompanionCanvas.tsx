"use client";

// Intelligence · Companion Canvas — the structured "decision companion" that
// renders beside every Intelligence answer.
//
// The honesty model is the point: a Signal tile may legally have NO value.
// Absence is a first-class, renderable state ("we are not instrumented here —
// load X"), never a fabricated number. The three evidence states MUST read as
// visually distinct so an exec never mistakes a benchmark/inference for a
// measured tenant number.
//
// Design system is LOCKED — this reuses existing tokens only.

import { useEffect, useMemo, useState } from "react";
import type {
  CompanionCanvasPayload,
  CompanionExhibit,
  CompanionLensKey,
  SignalTile,
} from "@/lib/intelligence/ask/companion-canvas";
import { COMPANION_LENS_META } from "@/lib/intelligence/ask/companion-canvas";

// ── locked design tokens ─────────────────────────────────────────────────
const C = {
  surface: "#F8F7F4",
  panel: "#ffffff",
  body: "#374151",
  muted: "#9ca3af",
  subtle: "#6b7280",
  border: "#e4e1d9",
  teal: "#0f766e",
  tealSoft: "#0f766e14",
  amber: "#b45309",
  amberSoft: "#b4530914",
} as const;

const F_SERIF = "Georgia, 'Times New Roman', serif";
const F_BODY = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const F_MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

const EYEBROW: React.CSSProperties = {
  fontFamily: F_MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: C.muted,
};

// Provenance → accent, used by the visual exhibits.
function provColor(prov: string): string {
  if (prov === "enterprise-evidence") return C.teal;
  if (prov === "industry-context") return C.amber;
  return C.muted; // inference
}

export function CompanionCanvas({
  canvas,
  loading,
}: {
  canvas: CompanionCanvasPayload | null;
  loading?: boolean;
}) {
  const lensOrder: CompanionLensKey[] =
    canvas?.lensOrder && canvas.lensOrder.length > 0
      ? canvas.lensOrder
      : ["evidence", "decision", "visual", "industryContext", "nextMoves"];

  const [active, setActive] = useState<CompanionLensKey>(lensOrder[0]);

  // Keep the active tab valid when a new payload reorders the lenses.
  useEffect(() => {
    if (!lensOrder.includes(active)) setActive(lensOrder[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  const showSkeleton = loading && !canvas;

  const summary = useMemo(() => {
    if (!canvas) return "Decision companion is preparing.";
    const tiles = canvas.tabs.evidence;
    const measured = tiles.filter((t) => t.state === "measured").length;
    const gaps = tiles.filter(
      (t) => t.state === "expected_uncaptured",
    ).length;
    return `Decision companion. ${measured} measured signal${
      measured === 1 ? "" : "s"
    }, ${gaps} not instrumented. ${canvas.tabs.decision.judgment}.`;
  }, [canvas]);

  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        fontFamily: F_BODY,
        color: C.body,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <ShimmerStyle />
      <h2 className="sr-only" style={SR_ONLY}>
        {summary}
      </h2>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Decision companion"
        style={{
          display: "flex",
          gap: 2,
          padding: "10px 12px 0",
          borderBottom: `1px solid ${C.border}`,
          flexWrap: "wrap",
        }}
      >
        {lensOrder.map((key) => {
          const isActive = key === active && !showSkeleton;
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={showSkeleton}
              onClick={() => setActive(key)}
              style={{
                appearance: "none",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${isActive ? C.teal : "transparent"}`,
                padding: "6px 10px 8px",
                margin: 0,
                cursor: showSkeleton ? "default" : "pointer",
                fontFamily: F_BODY,
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? C.teal : C.subtle,
                letterSpacing: "0.01em",
              }}
            >
              {COMPANION_LENS_META[key].label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div
        role="tabpanel"
        style={{
          padding: 16,
          overflowY: "auto",
          minHeight: 0,
          flex: 1,
        }}
      >
        {showSkeleton ? (
          <SkeletonBody lensOrder={lensOrder} />
        ) : canvas ? (
          <LensBody lens={active} canvas={canvas} />
        ) : (
          <MutedNote>Ask a question to open the decision companion.</MutedNote>
        )}
      </div>
    </div>
  );
}

// ── lens router ───────────────────────────────────────────────────────────

function LensBody({
  lens,
  canvas,
}: {
  lens: CompanionLensKey;
  canvas: CompanionCanvasPayload;
}) {
  switch (lens) {
    case "evidence":
      return <EvidenceLens tiles={canvas.tabs.evidence} />;
    case "decision":
      return <DecisionLens view={canvas.tabs.decision} />;
    case "visual":
      return (
        <VisualLens
          exhibit={canvas.tabs.visual}
          unverified={canvas.meta.unverified}
        />
      );
    case "industryContext":
      return <IndustryLens ctx={canvas.tabs.industryContext} />;
    case "nextMoves":
      return <NextMovesLens moves={canvas.tabs.nextMoves} />;
    default:
      return null;
  }
}

// ── Evidence lens · the honesty ladder ──────────────────────────────────────

function EvidenceLens({ tiles }: { tiles: SignalTile[] }) {
  if (tiles.length === 0) {
    return <MutedNote>No signals surfaced for this question.</MutedNote>;
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
        gap: 12,
      }}
    >
      {tiles.map((tile, i) => (
        <SignalCard key={`${tile.label}-${i}`} tile={tile} />
      ))}
    </div>
  );
}

function SignalCard({ tile }: { tile: SignalTile }) {
  const prov = <ProvenanceCaption provenance={tile.provenance} />;

  // ── measured: solid card, teal left border, value in Georgia ──
  if (tile.state === "measured") {
    return (
      <TileFrame accent={C.teal} solid>
        <TileLabel>{tile.label}</TileLabel>
        {tile.value ? (
          <div
            style={{
              fontFamily: F_SERIF,
              fontSize: 26,
              lineHeight: 1.05,
              color: C.body,
              margin: "2px 0 4px",
            }}
          >
            {tile.value}
          </div>
        ) : null}
        {tile.context ? <TileContext>{tile.context}</TileContext> : null}
        {prov}
        <WhyItMatters>{tile.whyItMatters}</WhyItMatters>
      </TileFrame>
    );
  }

  // ── benchmark: amber left border, value shown as industry range ──
  if (tile.state === "benchmark") {
    return (
      <TileFrame accent={C.amber} solid>
        <TileLabel>{tile.label}</TileLabel>
        {tile.value ? (
          <div
            style={{
              fontFamily: F_SERIF,
              fontSize: 22,
              lineHeight: 1.1,
              color: C.amber,
              margin: "2px 0 4px",
            }}
          >
            {tile.value}
          </div>
        ) : null}
        <div
          style={{
            fontSize: 11,
            color: C.amber,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          industry range · your value unknown
        </div>
        {tile.context ? <TileContext>{tile.context}</TileContext> : null}
        <WhyItMatters>{tile.whyItMatters}</WhyItMatters>
      </TileFrame>
    );
  }

  // ── expected_uncaptured: DASHED muted border, no bold number ──
  if (tile.state === "expected_uncaptured") {
    return (
      <TileFrame accent={C.muted} dashed>
        <TileLabel>{tile.label}</TileLabel>
        <div
          style={{
            fontStyle: "italic",
            fontSize: 14,
            color: C.muted,
            margin: "2px 0 4px",
          }}
        >
          Not instrumented
        </div>
        {tile.context ? <TileContext>{tile.context}</TileContext> : null}
        <WhyItMatters>{tile.whyItMatters}</WhyItMatters>
        {tile.loadHint ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              fontWeight: 600,
              color: C.teal,
            }}
          >
            ↳ Load {tile.loadHint}
          </div>
        ) : null}
      </TileFrame>
    );
  }

  // ── none: minimal muted row ──
  return (
    <div
      style={{
        borderTop: `1px solid ${C.border}`,
        padding: "8px 2px",
        fontSize: 12,
        color: C.muted,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{tile.label}</div>
      <WhyItMatters>{tile.whyItMatters}</WhyItMatters>
    </div>
  );
}

function TileFrame({
  accent,
  solid,
  dashed,
  children,
}: {
  accent: string;
  solid?: boolean;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: solid ? C.panel : "transparent",
        border: dashed
          ? `1px dashed ${C.border}`
          : `1px solid ${C.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 3,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

function TileLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...EYEBROW, color: C.subtle, marginBottom: 2 }}>
      {children}
    </div>
  );
}

function TileContext({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: C.subtle, marginBottom: 4 }}>
      {children}
    </div>
  );
}

function ProvenanceCaption({ provenance }: { provenance: string }) {
  const label =
    provenance === "enterprise-evidence"
      ? "provenance · enterprise evidence"
      : provenance === "industry-context"
        ? "provenance · industry context"
        : "provenance · inference";
  return (
    <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</div>
  );
}

function WhyItMatters({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: "auto",
        paddingTop: 6,
        fontSize: 12,
        lineHeight: 1.4,
        color: C.body,
      }}
    >
      {children}
    </div>
  );
}

// ── Decision lens ───────────────────────────────────────────────────────────

function DecisionLens({
  view,
}: {
  view: CompanionCanvasPayload["tabs"]["decision"];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ ...EYEBROW, marginBottom: 4 }}>The call</div>
        <div
          style={{
            fontFamily: F_SERIF,
            fontSize: 22,
            lineHeight: 1.2,
            color: C.body,
            fontWeight: 700,
          }}
        >
          {view.judgment}
        </div>
      </div>
      <Field label="Tradeoff">{view.tradeoff}</Field>
      {view.owner ? <Field label="Owner">{view.owner}</Field> : null}
      <Field label="Consequence of waiting" accent={C.amber}>
        {view.consequenceOfWaiting}
      </Field>
    </div>
  );
}

function Field({
  label,
  accent,
  children,
}: {
  label: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${accent ?? C.border}`,
        paddingLeft: 10,
      }}
    >
      <div style={{ ...EYEBROW, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: C.body }}>
        {children}
      </div>
    </div>
  );
}

// ── Visual lens · the native exhibits ───────────────────────────────────────

function VisualLens({
  exhibit,
  unverified,
}: {
  exhibit: CompanionExhibit | null;
  unverified: boolean;
}) {
  if (!exhibit) {
    return <MutedNote>No exhibit for this question.</MutedNote>;
  }
  const band = unverified || exhibit.unverified;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {band ? (
        <div
          style={{
            background: C.amberSoft,
            border: `1px solid ${C.amber}33`,
            borderRadius: 3,
            padding: "6px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: C.amber,
          }}
        >
          Estimated — connect data to confirm
        </div>
      ) : null}
      <ExhibitRenderer exhibit={exhibit} />
    </div>
  );
}

function ExhibitRenderer({ exhibit }: { exhibit: CompanionExhibit }) {
  switch (exhibit.canvasType) {
    case "investmentSequencingMap":
      return <SequencingMap exhibit={exhibit} />;
    case "valueReadinessMatrix":
      return <ReadinessMatrix exhibit={exhibit} />;
    case "gateToValueRoadmap":
      return <GateRoadmap exhibit={exhibit} />;
    case "proofBoundary":
      return <ProofBoundary exhibit={exhibit} />;
    default:
      return null;
  }
}

const SEQUENCING_BANDS: Array<{
  key: "scale_now" | "certify_then_scale" | "fund_readiness" | "hold_discovery";
  label: string;
}> = [
  { key: "scale_now", label: "Scale now" },
  { key: "certify_then_scale", label: "Certify, then scale" },
  { key: "fund_readiness", label: "Fund readiness" },
  { key: "hold_discovery", label: "Hold · discovery" },
];

function SequencingMap({
  exhibit,
}: {
  exhibit: Extract<CompanionExhibit, { canvasType: "investmentSequencingMap" }>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {SEQUENCING_BANDS.map((band) => {
        const items = exhibit.items.filter((it) => it.band === band.key);
        return (
          <div
            key={band.key}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                ...EYEBROW,
                color: C.subtle,
                background: C.surface,
                padding: "5px 10px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {band.label} · {items.length}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: items.length ? 8 : "8px 10px",
              }}
            >
              {items.length === 0 ? (
                <span style={{ fontSize: 11, color: C.muted }}>—</span>
              ) : (
                items.map((it, i) => (
                  <span
                    key={`${it.label}-${i}`}
                    style={{
                      fontSize: 11,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderLeft: `3px solid ${provColor(it.provenance)}`,
                      borderRadius: 2,
                      padding: "3px 8px",
                      color: C.body,
                    }}
                  >
                    {it.label}
                    {it.value ? (
                      <span style={{ color: C.subtle }}> · {it.value}</span>
                    ) : null}
                  </span>
                ))
              )}
            </div>
          </div>
        );
      })}
      <ProvenanceLegend />
    </div>
  );
}

function ReadinessMatrix({
  exhibit,
}: {
  exhibit: Extract<CompanionExhibit, { canvasType: "valueReadinessMatrix" }>;
}) {
  const W = 320;
  const H = 260;
  const pad = 34;
  const plot = (v: number, axis: "x" | "y") => {
    const clamped = Math.max(0, Math.min(100, v));
    if (axis === "x") return pad + (clamped / 100) * (W - pad - 12);
    return H - pad - (clamped / 100) * (H - pad - 12);
  };
  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label={`Value versus readiness matrix. ${exhibit.points.length} initiatives.`}
      >
        {/* quadrant grid */}
        <line
          x1={pad}
          y1={plot(50, "y")}
          x2={W - 12}
          y2={plot(50, "y")}
          stroke={C.border}
          strokeDasharray="3 3"
        />
        <line
          x1={plot(50, "x")}
          y1={12}
          x2={plot(50, "x")}
          y2={H - pad}
          stroke={C.border}
          strokeDasharray="3 3"
        />
        {/* axes */}
        <line x1={pad} y1={H - pad} x2={W - 12} y2={H - pad} stroke={C.subtle} />
        <line x1={pad} y1={12} x2={pad} y2={H - pad} stroke={C.subtle} />
        {/* points */}
        {exhibit.points.map((p, i) => {
          const cx = plot(p.value, "x");
          const cy = plot(p.readiness, "y");
          return (
            <g key={`${p.label}-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill={provColor(p.provenance)}
                fillOpacity={0.85}
              />
              <text
                x={cx + 7}
                y={cy + 3}
                fontSize={9}
                fontFamily={F_BODY}
                fill={C.body}
              >
                {p.label}
              </text>
            </g>
          );
        })}
        <text
          x={(W + pad) / 2}
          y={H - 6}
          fontSize={9}
          fontFamily={F_MONO}
          fill={C.muted}
          textAnchor="middle"
        >
          {exhibit.axes.x} →
        </text>
        <text
          x={12}
          y={(H - pad) / 2}
          fontSize={9}
          fontFamily={F_MONO}
          fill={C.muted}
          textAnchor="middle"
          transform={`rotate(-90 12 ${(H - pad) / 2})`}
        >
          {exhibit.axes.y} →
        </text>
      </svg>
      <ProvenanceLegend />
    </div>
  );
}

function GateRoadmap({
  exhibit,
}: {
  exhibit: Extract<CompanionExhibit, { canvasType: "gateToValueRoadmap" }>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {exhibit.gates.map((g, i) => (
        <div
          key={`${g.label}-${i}`}
          style={{ display: "flex", alignItems: "stretch", gap: 8 }}
        >
          <div
            style={{
              width: 22,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: F_MONO,
                fontSize: 10,
                fontWeight: 700,
                color: provColor(g.provenance),
              }}
            >
              {i + 1}
            </span>
            {i < exhibit.gates.length - 1 ? (
              <span
                style={{
                  flex: 1,
                  width: 1,
                  background: C.border,
                  marginTop: 2,
                }}
              />
            ) : null}
          </div>
          <div
            style={{
              flex: 1,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${provColor(g.provenance)}`,
              borderRadius: 3,
              padding: "8px 10px",
              marginBottom: 2,
            }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}
            >
              {g.label}
            </div>
            <div style={{ fontSize: 11, color: C.subtle, lineHeight: 1.4 }}>
              <span style={{ color: C.muted }}>needs</span> {g.prerequisite}
            </div>
            <div style={{ fontSize: 11, color: C.teal, lineHeight: 1.4 }}>
              <span style={{ color: C.muted }}>unlocks</span> {g.unlocks}
            </div>
          </div>
        </div>
      ))}
      <ProvenanceLegend />
    </div>
  );
}

const PROOF_STATUS: Record<
  "proven" | "partial" | "unproven" | "uncaptured",
  { label: string; color: string; dashed?: boolean }
> = {
  proven: { label: "Proven", color: C.teal },
  partial: { label: "Partial", color: C.amber },
  unproven: { label: "Unproven", color: C.muted },
  uncaptured: { label: "Uncaptured", color: C.muted, dashed: true },
};

function ProofBoundary({
  exhibit,
}: {
  exhibit: Extract<CompanionExhibit, { canvasType: "proofBoundary" }>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
        gap: 8,
      }}
    >
      {exhibit.dimensions.map((d, i) => {
        const s = PROOF_STATUS[d.status];
        return (
          <div
            key={`${d.label}-${i}`}
            style={{
              border: s.dashed
                ? `1px dashed ${C.border}`
                : `1px solid ${C.border}`,
              borderTop: `3px solid ${s.color}`,
              borderRadius: 3,
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 3,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600 }}>{d.label}</span>
              <span
                style={{
                  ...EYEBROW,
                  color: s.color,
                  fontSize: 9,
                }}
              >
                {s.label}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.subtle, lineHeight: 1.4 }}>
              {d.note}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProvenanceLegend() {
  const items: Array<[string, string]> = [
    ["Enterprise evidence", C.teal],
    ["Industry context", C.amber],
    ["Inference", C.muted],
  ];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 4,
        fontSize: 10,
        color: C.muted,
      }}
    >
      {items.map(([label, color]) => (
        <span
          key={label}
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: color,
              display: "inline-block",
            }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Industry lens ───────────────────────────────────────────────────────────

function IndustryLens({
  ctx,
}: {
  ctx: CompanionCanvasPayload["tabs"]["industryContext"];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: C.body }}>
        {ctx.note}
      </div>
      {ctx.series && ctx.series.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {ctx.series.map((s, i) => (
            <div
              key={`${s.label}-${i}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "7px 2px",
                borderTop: `1px solid ${C.border}`,
                fontSize: 12,
              }}
            >
              <span style={{ color: C.subtle }}>{s.label}</span>
              <span
                style={{
                  fontFamily: F_MONO,
                  color: C.amber,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {s.range}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Next moves lens ─────────────────────────────────────────────────────────

function NextMovesLens({
  moves,
}: {
  moves: CompanionCanvasPayload["tabs"]["nextMoves"];
}) {
  if (moves.length === 0) {
    return <MutedNote>No adjacent moves lined up.</MutedNote>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {moves.map((m, i) => (
        <div
          key={`${m.action}-${i}`}
          style={{
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${C.teal}`,
            borderRadius: 3,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {m.action}
          </div>
          <div style={{ fontSize: 11, color: C.subtle, lineHeight: 1.45 }}>
            <span style={{ color: C.muted }}>unlocks</span> {m.unlocks}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            {m.owner ? (
              <span style={{ ...EYEBROW, color: C.muted }}>{m.owner}</span>
            ) : (
              <span />
            )}
            {m.moveHref ? (
              <a
                href={m.moveHref}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.teal,
                  textDecoration: "none",
                }}
              >
                Open move ↗
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── skeleton ────────────────────────────────────────────────────────────────

function SkeletonBody({ lensOrder }: { lensOrder: CompanionLensKey[] }) {
  const first = lensOrder[0];
  const copy = COMPANION_LENS_META[first].skeleton;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: C.subtle }}>{copy}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
          gap: 12,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${C.border}`,
              borderRadius: 3,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <ShimmerBar w="55%" h={9} />
            <ShimmerBar w="80%" h={18} />
            <ShimmerBar w="100%" h={9} />
            <ShimmerBar w="90%" h={9} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShimmerBar({ w, h }: { w: string; h: number }) {
  return (
    <div
      className="cc-shimmer"
      style={{
        width: w,
        height: h,
        borderRadius: 2,
      }}
    />
  );
}

function ShimmerStyle() {
  return (
    <style>{`
      .cc-shimmer {
        background: linear-gradient(90deg, ${C.surface} 25%, ${C.border} 50%, ${C.surface} 75%);
        background-size: 200% 100%;
        animation: cc-shimmer 1.4s ease-in-out infinite;
      }
      @keyframes cc-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .cc-shimmer { animation: none; }
      }
    `}</style>
  );
}

// ── primitives ──────────────────────────────────────────────────────────────

function MutedNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: C.muted,
        fontStyle: "italic",
        padding: "8px 2px",
      }}
    >
      {children}
    </div>
  );
}

const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};
