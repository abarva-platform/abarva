"use client";

import type { CSSProperties } from "react";

const MARK_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontFamily: "var(--font-geist-sans), Inter, system-ui, sans-serif",
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: "-0.08em",
  lineHeight: 1,
  minWidth: 50,
  textAlign: "center",
};

const A_STYLE: CSSProperties = { color: "#23B8E6" };
const V_STYLE: CSSProperties = { color: "#12AFCB" };

export function AvaAskMark({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`avaAskMark ${className}`.trim()}
      data-testid="ava-ask-mark"
      style={{ ...MARK_STYLE, ...style }}
    >
      <span className="avaAskMark-a" style={A_STYLE}>a</span>
      <span className="avaAskMark-v" style={V_STYLE}>V</span>
      <span className="avaAskMark-a" style={A_STYLE}>a</span>
    </span>
  );
}
