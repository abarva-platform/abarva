"use client";

import type { CSSProperties } from "react";
import type {
  SourceTransitionSigner,
  SourceTransitionWorkstream,
} from "@/lib/source/transition/readiness-scoring";
import { CANVAS } from "../canvas-tokens";

const SOURCE_ACCENT = "#1d4ed8";

export function TransitionReadinessScorecard({
  workstreams,
  signers,
  readinessPercent,
  activeBlocker,
}: {
  workstreams: SourceTransitionWorkstream[];
  signers: SourceTransitionSigner[];
  readinessPercent: number;
  activeBlocker: string;
}) {
  return (
    <section data-testid="source-transition-readiness-scorecard" style={CARD}>
      <div style={HEAD}>
        <div>
          <div style={EYEBROW}>Go-live readiness</div>
          <h3 style={TITLE}>{readinessPercent}% ready for cutover</h3>
        </div>
        <div style={BADGE}>CIO + CDO + Vendor PM</div>
      </div>

      <div style={RAG_GRID}>
        {workstreams.map((workstream) => (
          <div
            key={workstream.id}
            data-status={workstream.status}
            style={{
              ...RAG_CARD,
              borderColor: colorFor(workstream.status),
              background: backgroundFor(workstream.status),
            }}
          >
            <div style={RAG_LABEL}>{workstream.label}</div>
            <div style={RAG_STATUS}>{workstream.status.toUpperCase()}</div>
            <p style={COPY}>{workstream.signal}</p>
            {workstream.blocker ? <p style={BLOCKER}>{workstream.blocker}</p> : null}
          </div>
        ))}
      </div>

      <div style={SIGNER_WRAP}>
        <div style={EYEBROW}>Required before cutover</div>
        {signers.map((signer) => (
          <div key={signer.id} style={SIGNER_ROW}>
            <span style={SIGNER_ROLE}>{signer.role}</span>
            <span>
              <strong>{signer.name}</strong> · {signer.requirement}
            </span>
            <span style={SIGNER_STATUS}>{signer.status}</span>
          </div>
        ))}
      </div>

      <div style={ACTION_BOX}>
        <strong>Active blocker</strong>
        <span>{activeBlocker}</span>
      </div>
    </section>
  );
}

function colorFor(status: SourceTransitionWorkstream["status"]): string {
  if (status === "green") return CANVAS.ACTIVE;
  if (status === "amber") return CANVAS.WAITING;
  return CANVAS.BLOCKED;
}

function backgroundFor(status: SourceTransitionWorkstream["status"]): string {
  if (status === "green") return "rgba(54,119,89,0.07)";
  if (status === "amber") return "rgba(186,117,23,0.07)";
  return "rgba(174,62,42,0.07)";
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
};

const HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "start",
};

const EYEBROW: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};

const TITLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  lineHeight: 1.1,
  color: CANVAS.INK,
  fontWeight: 400,
};

const BADGE: CSSProperties = {
  border: `1px solid ${SOURCE_ACCENT}`,
  borderRadius: 999,
  color: SOURCE_ACCENT,
  padding: "5px 9px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const RAG_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginTop: 13,
};

const RAG_CARD: CSSProperties = {
  border: "1px solid",
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: 11,
};

const RAG_LABEL: CSSProperties = {
  color: CANVAS.INK,
  fontWeight: 700,
  fontSize: CANVAS.T_BODY_SMALL,
};

const RAG_STATUS: CSSProperties = {
  marginTop: 4,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.1em",
  color: CANVAS.INK_MUTED,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const BLOCKER: CSSProperties = {
  margin: "6px 0 0",
  color: CANVAS.BLOCKED,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
  fontWeight: 700,
};

const SIGNER_WRAP: CSSProperties = {
  display: "grid",
  gap: 7,
  marginTop: 13,
  paddingTop: 12,
  borderTop: `1px solid ${CANVAS.RULE}`,
};

const SIGNER_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "72px minmax(0, 1fr) 72px",
  gap: 8,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  alignItems: "center",
};

const SIGNER_ROLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.1em",
  color: CANVAS.INK,
};

const SIGNER_STATUS: CSSProperties = {
  justifySelf: "end",
  color: CANVAS.WAITING,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const ACTION_BOX: CSSProperties = {
  marginTop: 12,
  border: `1px solid ${CANVAS.WAITING}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(186,117,23,0.06)",
  padding: 10,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
  display: "grid",
  gap: 4,
};
