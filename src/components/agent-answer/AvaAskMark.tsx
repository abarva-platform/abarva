"use client";

import type { CSSProperties } from "react";

const MARK_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  lineHeight: 1,
  minWidth: 54,
  textAlign: "center",
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
      <svg
        aria-hidden="true"
        className="avaAskMark-svg"
        data-testid="ava-ask-wordmark"
        focusable="false"
        viewBox="0 0 180 72"
        style={{
          display: "block",
          width: "100%",
          maxWidth: "3.2em",
          height: "auto",
          overflow: "visible",
        }}
      >
        <text
          data-testid="ava-ask-leading-a"
          x="2"
          y="53"
          fill="#111827"
          fontFamily="var(--font-geist-sans), Inter, Arial Black, Arial, sans-serif"
          fontSize="58"
          fontWeight="900"
          letterSpacing="-5"
        >
          a
        </text>
        <g
          data-testid="ava-ask-v-mark"
          transform="translate(53 5) scale(0.62)"
          fill="none"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        >
          <path d="M18 80 L50 20 L82 80" stroke="#111827" strokeWidth="14" />
          <path d="M62 55 L82 80 L110 20" stroke="#22AEEA" strokeWidth="14" />
          <path
            d="M48 52 L74 52 L83 61 L57 61 Z"
            fill="#22AEEA"
            opacity="0.58"
            stroke="none"
          />
          <path
            d="M62 55 L74 52 L83 61 L70 65 Z"
            fill="#0A76D8"
            opacity="0.38"
            stroke="none"
          />
        </g>
        <text
          x="128"
          y="53"
          fill="#111827"
          fontFamily="var(--font-geist-sans), Inter, Arial Black, Arial, sans-serif"
          fontSize="58"
          fontWeight="900"
          letterSpacing="-5"
        >
          a
        </text>
      </svg>
    </span>
  );
}
