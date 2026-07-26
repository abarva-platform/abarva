"use client";

import type { CSSProperties } from "react";
import { blockerLabel, type ArtifactBlockerLike } from "@/lib/source/contracts/blocker-copy";
import { CANVAS } from "./canvas-tokens";

// Shared "why can't I do this yet" renderer (PR 4D, ADR-0015). Every surface
// that can hit a contract-driven 409 (generate, accept, export) renders its
// blockers through this one component, so a multi-blocker response always
// shows every reason — not just the first sentence a caller happened to
// keep — and every surface reads the same visually. `detail` strings are
// already full, human-written sentences written server-side specifically to
// be read by a person; this component adds a short scannable label per
// blocker, it does not rewrite the prose.

interface ArtifactBlockerListProps {
  blockers: ArtifactBlockerLike[];
  testIdPrefix?: string;
}

export function ArtifactBlockerList({
  blockers,
  testIdPrefix,
}: ArtifactBlockerListProps) {
  if (blockers.length === 0) return null;
  return (
    <ul
      role="alert"
      data-testid={testIdPrefix ? `${testIdPrefix}-blockers` : undefined}
      style={LIST_STYLE}
    >
      {blockers.map((blocker, index) => (
        <li
          key={`${blocker.code}-${index}`}
          data-testid={
            testIdPrefix ? `${testIdPrefix}-blocker-${blocker.code}` : undefined
          }
          style={ITEM_STYLE}
        >
          <span style={LABEL_STYLE}>{blockerLabel(blocker.code)}</span>
          <span>{blocker.detail}</span>
        </li>
      ))}
    </ul>
  );
}

const LIST_STYLE: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: 6,
};

const ITEM_STYLE: CSSProperties = {
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: "1px solid rgba(186,117,23,0.30)",
  background: "rgba(186,117,23,0.06)",
  padding: "8px 10px",
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  color: "#A66400",
  lineHeight: 1.5,
  display: "flex",
  gap: 8,
  alignItems: "baseline",
};

const LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#8a5200",
  flexShrink: 0,
};
