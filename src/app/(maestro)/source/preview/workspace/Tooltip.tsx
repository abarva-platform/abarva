"use client";

import type { TipState } from "./viewModel";

export function Tooltip({ tip }: { tip: TipState | null }) {
  if (!tip) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: tip.left,
        top: tip.top,
        transform: "translate(-50%,-100%)",
        background: "#0a0a0b",
        color: "#fff",
        borderRadius: 7,
        padding: "12px 14px",
        minWidth: 250,
        maxWidth: 340,
        zIndex: 200,
        boxShadow: "0 8px 24px rgba(10,10,11,.28)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          marginBottom: 9,
          lineHeight: 1.35,
        }}
      >
        {tip.title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {tip.lines.map((l, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              fontSize: 11.5,
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: "rgba(255,255,255,.55)" }}>{l.k}</span>
            <span
              style={{
                marginLeft: "auto",
                textAlign: "right",
                color: "#fff",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
              }}
            >
              {l.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
