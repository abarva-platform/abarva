"use client";

import Image from "next/image";
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
      <Image
        alt=""
        aria-hidden="true"
        className="avaAskMark-img"
        data-testid="ava-ask-v-mark"
        height={72}
        src="/brand/ava/aVa_FINAL_20pct_closer_dark_transparent.svg"
        unoptimized
        width={180}
        style={{
          display: "block",
          width: "100%",
          maxWidth: "3.2em",
          height: "auto",
        }}
      />
    </span>
  );
}
