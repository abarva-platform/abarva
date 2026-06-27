"use client";

import type { CSSProperties } from "react";

export type AvaAskMarkVariant =
  | "wordmark-dark"
  | "wordmark-light"
  | "avatar-dark"
  | "avatar-light";

const AVA_MARK_ASSETS: Record<AvaAskMarkVariant, string> = {
  "wordmark-dark": "/brand/ava/ava-wordmark-2tone-dark.svg",
  "wordmark-light": "/brand/ava/ava-wordmark-2tone-light.svg",
  "avatar-dark": "/brand/ava/ava-avatar-dark.svg",
  "avatar-light": "/brand/ava/ava-avatar-light.svg",
};

const MARK_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  lineHeight: 1,
  minWidth: 54,
  width: "3.05em",
  maxWidth: 90,
  textAlign: "center",
};

const IMAGE_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  height: "auto",
  objectFit: "contain",
};

export function AvaAskMark({
  className = "",
  style,
  variant = "wordmark-dark",
}: {
  className?: string;
  style?: CSSProperties;
  variant?: AvaAskMarkVariant;
}) {
  return (
    <span
      aria-hidden="true"
      className={`avaAskMark ${className}`.trim()}
      data-ava-mark-variant={variant}
      data-testid="ava-ask-mark"
      style={{ ...MARK_STYLE, ...style }}
    >
      {/* Keep the aVa wordmark as a repo-stored asset so every surface shares one mark. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        aria-hidden="true"
        data-testid="ava-ask-wordmark"
        draggable={false}
        src={AVA_MARK_ASSETS[variant]}
        style={IMAGE_STYLE}
      />
    </span>
  );
}
