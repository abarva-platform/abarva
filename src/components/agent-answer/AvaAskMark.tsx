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
  minWidth: 54,
  textAlign: "center",
};

const A_STYLE: CSSProperties = { color: "#23B8E6" };
const V_MARK_STYLE: CSSProperties = {
  width: "0.9em",
  height: "1.05em",
  marginLeft: "-0.06em",
  marginRight: "-0.1em",
  transform: "translateY(0.03em)",
  overflow: "visible",
  flexShrink: 0,
};

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
      <svg
        aria-hidden="true"
        className="avaAskMark-v"
        data-testid="ava-ask-v-mark"
        focusable="false"
        role="presentation"
        style={V_MARK_STYLE}
        viewBox="55 15 60 72"
      >
        <path
          d="M62 55 L82 80 L110 20"
          fill="none"
          stroke="#22AEEA"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeWidth="14"
        />
        <path
          d="M62 55 L74 52 L83 61 L70 65 Z"
          fill="#0A76D8"
          opacity="0.38"
        />
        <path
          d="M74 52 L83 61 L76 61 L70 65 Z"
          fill="#22AEEA"
          opacity="0.42"
        />
      </svg>
      <span className="avaAskMark-a" style={A_STYLE}>a</span>
    </span>
  );
}
