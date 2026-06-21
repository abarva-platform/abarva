import type { CSSProperties } from "react";
import Link from "next/link";

import { AppShell } from "@/components/shell/AppShell";
import { SHELL } from "@/lib/shell/shell-tokens";
import type { HomeBrief } from "@/lib/home/home-brief";

const C = {
  paper: "#F6F1EA",
  panel: "#FFFFFF",
  panelSoft: "#FBF8F2",
  ink: "#0C1A3A",
  body: "#27324A",
  muted: "#69758A",
  faint: "#8B95A8",
  line: "#E6DFD6",
  lineStrong: "#D0C5B8",
  amber: "#9A5A00",
  red: "#9F3E3B",
  green: "#0E7668",
};

const toneColor: Record<HomeBrief["portfolio"][number]["tone"], string> = {
  ok: C.green,
  risk: C.red,
  gate: C.amber,
};

// ── Tiny insight accent — the calm successor to the old constellation.
// Kept deliberately small (a single quiet signal mark) so Home stays an
// insight surface without a decorative graphic hogging the first fold.
function InsightConstellation() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      aria-hidden
      style={{ flex: "none" }}
    >
      <circle cx="11" cy="11" r="3" fill={C.ink} />
      <circle cx="4" cy="5" r="1.5" fill={C.faint} />
      <circle cx="18" cy="6" r="1.5" fill={C.faint} />
      <circle cx="17" cy="17" r="1.5" fill={C.faint} />
      <line x1="11" y1="11" x2="4" y2="5" stroke={C.line} strokeWidth="1" />
      <line x1="11" y1="11" x2="18" y2="6" stroke={C.line} strokeWidth="1" />
      <line x1="11" y1="11" x2="17" y2="17" stroke={C.line} strokeWidth="1" />
    </svg>
  );
}

export function ImpactInsightsHome({
  activeTenantName,
  hasTenantKey,
  brief,
}: {
  activeTenantName: string;
  hasTenantKey: boolean;
  brief: HomeBrief;
}) {
  const { decision, portfolio, kpis, hasPortfolio, attention } = brief;

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName: activeTenantName,
        showLocked: hasTenantKey,
        context: "Home",
      }}
      hasTenantKey={hasTenantKey}
      middleStrip={
        <div
          data-testid="home-impact-strip"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: SHELL.INK_SOFT,
          }}
        >
          <span>Executive brief</span>
          <span style={{ color: SHELL.PEACH_TEXT }}>Decision-support only</span>
          <span>Evidence-linked</span>
          <span>Client locked</span>
        </div>
      }
    >
      <main
        data-testid="home-impact-insights"
        style={{
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          background: C.paper,
          color: C.body,
          fontFamily: SHELL.SANS,
        }}
      >
        {/* ── CLIENT IDENTITY BAND ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "30px clamp(22px, 4vw, 44px) 24px",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div
            aria-label={`${brief.tenantName} mark`}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              flex: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: brief.logoColor ?? C.ink,
              color: "#fff",
              fontFamily: SHELL.SANS,
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: "0.04em",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
            }}
          >
            {brief.initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: 26,
                fontWeight: 500,
                color: C.ink,
                lineHeight: 1.1,
                letterSpacing: 0,
              }}
            >
              {brief.tenantName}
            </div>
            <div style={{ marginTop: 3, fontSize: 13, color: C.muted }}>
              {brief.industryLabel ? `${brief.industryLabel} · ` : ""}Executive
              brief
            </div>
          </div>
          <div style={{ marginLeft: "auto", flex: "none" }}>
            <InsightConstellation />
          </div>
        </div>

        <div style={{ padding: "34px clamp(22px, 4vw, 44px) 48px" }}>
          {/* ── HERO (greeting binds to signed-in user) ── */}
          <h1
            style={{
              margin: "0 0 28px",
              maxWidth: 1120,
              fontFamily: SHELL.SERIF_DISPLAY,
              fontSize: 30,
              lineHeight: 1.2,
              fontWeight: 400,
              color: C.ink,
              letterSpacing: 0,
            }}
          >
            {brief.greeting}{" "}
            {decision ? (
              <strong style={{ fontWeight: 600 }}>
                One decision needs review today.
              </strong>
            ) : hasPortfolio ? (
              <strong style={{ fontWeight: 600 }}>
                Nothing needs you right now — here is where the portfolio
                stands.
              </strong>
            ) : (
              <strong style={{ fontWeight: 600 }}>
                This client has no initiatives in flight yet.
              </strong>
            )}
          </h1>

          {/* ── KPI STRIP (one borderless airy panel) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {kpis.map((k, i) => (
              <div
                key={k.label}
                style={{
                  padding: "22px 24px",
                  borderRight:
                    i < kpis.length - 1 ? `1px solid ${C.line}` : undefined,
                }}
              >
                <div style={kpiLabel}>{k.label}</div>
                <div style={kpiValue}>{k.value}</div>
                {k.note ? <div style={kpiNote}>{k.note}</div> : null}
              </div>
            ))}
          </div>

          {/* ── THE ONE DECISION (route-only; Home never decides inline) ── */}
          {decision ? (
            <>
              <div style={sectLabel}>The decision in front of you</div>
              <div
                style={{
                  background: C.ink,
                  color: "#fff",
                  borderRadius: 16,
                  padding: "32px 34px",
                }}
              >
                <div style={{ ...kpiLabel, color: "#9bc6ff" }}>
                  {decision.eyebrow}
                </div>
                <h2
                  style={{
                    margin: "12px 0 10px",
                    fontFamily: SHELL.SERIF_DISPLAY,
                    fontWeight: 500,
                    fontSize: 25,
                    lineHeight: 1.2,
                    maxWidth: 680,
                  }}
                >
                  {decision.question}
                </h2>
                <p
                  style={{
                    margin: "0 0 22px",
                    color: "#cdd6e4",
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    maxWidth: 680,
                  }}
                >
                  {decision.detail}
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link href={decision.href} style={primaryBtn}>
                    Open in the workspace — review &amp; decide →
                  </Link>
                  <Link href="/intelligence" style={ghostBtn}>
                    Ask Ava to brief me
                  </Link>
                </div>
              </div>
            </>
          ) : null}

          {/* ── PORTFOLIO + attention rail ── */}
          <div style={sectLabel}>Your portfolio</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.5fr)",
              gap: 28,
              alignItems: "start",
            }}
          >
            <div style={panel}>
              {hasPortfolio ? (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13.5,
                  }}
                >
                  <thead>
                    <tr>
                      {["Initiative", "Owner", "Value", "Stage", "Status"].map(
                        (h, i) => (
                          <th
                            key={h}
                            style={{
                              ...th,
                              textAlign: i >= 2 && i !== 3 ? "right" : "left",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map((row) => (
                      <tr key={row.name}>
                        <td style={{ ...td, fontWeight: 600 }}>{row.name}</td>
                        <td style={{ ...td, color: C.muted }}>{row.owner}</td>
                        <td
                          style={{
                            ...td,
                            textAlign: "right",
                            fontWeight: 600,
                            color: C.muted,
                          }}
                        >
                          {row.value}
                        </td>
                        <td style={{ ...td, color: C.muted }}>{row.stage}</td>
                        <td style={{ ...td, textAlign: "right" }}>
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 11px",
                              borderRadius: 999,
                              border: `1px solid ${toneColor[row.tone]}44`,
                              color: toneColor[row.tone],
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 28, textAlign: "center" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 600,
                      color: C.ink,
                    }}
                  >
                    No initiatives in flight yet
                  </h3>
                  <p
                    style={{
                      margin: "8px auto 0",
                      maxWidth: 380,
                      color: C.muted,
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    Once {activeTenantName}&rsquo;s initiatives are loaded, they
                    appear here with real value, stage, owner, and status —
                    never placeholder numbers.
                  </p>
                </div>
              )}
            </div>

            <div>
              <div style={{ ...sectLabel, marginTop: 0 }}>Needs attention</div>
              <div style={panel}>
                {attention.length > 0 ? (
                  attention.map((a, i) => (
                    <div
                      key={`${a.module}-${i}`}
                      style={{
                        padding: "13px 16px",
                        borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          fontFamily: SHELL.MONO,
                          fontSize: 9.5,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: C.faint,
                          marginBottom: 4,
                        }}
                      >
                        {a.module}
                      </span>
                      {a.text}
                    </div>
                  ))
                ) : (
                  <div
                    style={{ padding: "16px", color: C.muted, fontSize: 13 }}
                  >
                    Nothing needs attention — every initiative is healthy.
                  </div>
                )}
              </div>
              {/* Executive evidence read lives in Tower (value + grounding),
                  not the operator surfaces. Home stays a read/route surface. */}
              <p style={{ marginTop: 18, fontSize: 13, color: C.body }}>
                Client evidence ready ·{" "}
                <Link
                  href="/tower"
                  style={{
                    color: C.ink,
                    fontWeight: 600,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  View in Tower →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

const kpiLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: C.faint,
  fontWeight: 700,
} satisfies CSSProperties;

const kpiValue = {
  fontFamily: SHELL.SERIF_DISPLAY,
  fontSize: 32,
  fontWeight: 500,
  margin: "10px 0 4px",
  letterSpacing: "-0.02em",
  lineHeight: 1,
  color: C.ink,
} satisfies CSSProperties;

const kpiNote = {
  fontSize: 12,
  color: C.muted,
} satisfies CSSProperties;

const sectLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: C.faint,
  fontWeight: 700,
  margin: "40px 0 16px",
} satisfies CSSProperties;

const panel = {
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 14,
  padding: "6px 18px",
} satisfies CSSProperties;

const th = {
  fontFamily: SHELL.MONO,
  fontSize: 9.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: C.faint,
  padding: "14px 8px 12px",
  borderBottom: `1px solid ${C.line}`,
  fontWeight: 700,
} satisfies CSSProperties;

const td = {
  padding: "15px 8px",
  borderBottom: `1px solid ${C.line}`,
} satisfies CSSProperties;

const primaryBtn = {
  background: "#fff",
  color: C.ink,
  borderRadius: 8,
  padding: "11px 18px",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
} satisfies CSSProperties;

const ghostBtn = {
  border: "1px solid rgba(255,255,255,0.22)",
  background: "transparent",
  color: "#fff",
  borderRadius: 8,
  padding: "11px 18px",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
} satisfies CSSProperties;
