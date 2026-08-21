"use client";

import type { ArchitectureViewRefusal } from "@/lib/visual-system/resolveArchitectureView";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

export function ArchitectureRefusal({ refusal }: { refusal: ArchitectureViewRefusal }) {
  return (
    <div style={{ padding: `46px ${PAGE_X}px 72px` }}>
      <header style={{ maxWidth: 980 }}>
        <span style={eyebrow(V4.amber)}>Architecture view not established</span>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: "clamp(30px,3vw,46px)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            margin: "16px 0 0",
            color: V4.ink,
            textWrap: "balance",
          }}
        >
          This record cannot answer the requested architecture question yet.
        </h1>
      </header>

      <section
        style={{
          marginTop: 24,
          border: `1px solid rgba(186,117,23,0.36)`,
          borderRadius: 10,
          background: "linear-gradient(90deg,#fff8eb,rgba(255,255,255,0.86))",
          padding: 22,
          maxWidth: 1060,
        }}
      >
        <div style={{ ...eyebrow(V4.amber), marginBottom: 8 }}>Requested question</div>
        <p style={{ margin: 0, fontFamily: SERIF, fontSize: 22, lineHeight: 1.34, color: V4.ink }}>
          {refusal.question}
        </p>
      </section>

      <section
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))",
          gap: 1,
          maxWidth: 1060,
          border: `1px solid ${V4.rule}`,
          background: V4.rule,
        }}
      >
        <GateMetric value={refusal.failedRules.length.toLocaleString()} label="failed rules" />
        <GateMetric value={refusal.evidenceNeeded.length.toLocaleString()} label="evidence requests" />
        <GateMetric value={refusal.supportedAlternatives.length.toLocaleString()} label="safe alternatives" />
      </section>

      <section style={{ marginTop: 34, display: "grid", gap: 14, maxWidth: 1120 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h2 style={sectionTitleStyle}>Admission rules failed</h2>
          <span style={{ flex: 1, height: 1, background: "rgba(186,117,23,0.32)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 12 }}>
          {refusal.failedRules.map((rule) => (
            <article key={rule.ruleId} style={cardStyle}>
              <span style={codeStyle}>{rule.ruleId}</span>
              <strong style={{ fontFamily: SERIF, fontSize: 20, lineHeight: 1.2, color: V4.ink }}>
                {rule.headline}
              </strong>
              <p style={bodyStyle}>{rule.detail}</p>
              {rule.measurement ? <p style={measurementStyle}>{rule.measurement}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 34, display: "grid", gap: 14, maxWidth: 1120 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h2 style={sectionTitleStyle}>What the record needs</h2>
          <span style={{ flex: 1, height: 1, background: V4.rule }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 12 }}>
          {refusal.evidenceNeeded.map((request) => (
            <article key={request.evidenceType} style={cardStyle}>
              <span style={codeStyle}>{request.evidenceType}</span>
              <p style={bodyStyle}>{request.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 34, maxWidth: 1120 }}>
        <div style={{ ...eyebrow(V4.slate), marginBottom: 12 }}>Supported alternatives</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {refusal.supportedAlternatives.map((format) => (
            <span
              key={format}
              style={{
                border: `1px solid ${V4.rule}`,
                borderRadius: 999,
                padding: "7px 11px",
                background: V4.surface,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: V4.blue,
              }}
            >
              {format.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function GateMetric({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: V4.surface, padding: "14px 16px" }}>
      <span style={{ display: "block", fontFamily: SERIF, fontSize: 27, lineHeight: 1, color: V4.ink }}>
        {value}
      </span>
      <span style={{ display: "block", marginTop: 7, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: V4.slate }}>
        {label}
      </span>
    </div>
  );
}

const sectionTitleStyle = {
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: "clamp(21px,1.8vw,28px)",
  letterSpacing: "-0.024em",
  margin: 0,
  color: V4.ink,
} satisfies React.CSSProperties;

const cardStyle = {
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  background: V4.surface,
  padding: 18,
  display: "grid",
  gap: 9,
} satisfies React.CSSProperties;

const codeStyle = {
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: V4.blue,
} satisfies React.CSSProperties;

const bodyStyle = {
  margin: 0,
  fontFamily: SANS,
  fontSize: 14.5,
  lineHeight: 1.62,
  color: V4.inkSoft,
} satisfies React.CSSProperties;

const measurementStyle = {
  margin: "2px 0 0",
  fontFamily: MONO,
  fontSize: 11.5,
  lineHeight: 1.55,
  color: V4.amber,
} satisfies React.CSSProperties;
