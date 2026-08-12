"use client";

import type { CSSProperties } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";

export interface ApprovalPerson {
  userId?: string | null;
  displayName: string;
  role: string;
}

interface ApprovalRoutingPanelProps {
  sponsor: ApprovalPerson;
  coApprover?: ApprovalPerson | null;
  lifecycleState: string;
  currentUserCanApprove: boolean;
}

export function ApprovalRoutingPanel({
  sponsor,
  coApprover,
  lifecycleState,
  currentUserCanApprove,
}: ApprovalRoutingPanelProps) {
  return (
    <section aria-label="Approval routing" style={PANEL_STYLE}>
      <div style={EYEBROW_STYLE}>Approval Route</div>
      <h2 style={TITLE_STYLE}>Who must say yes</h2>
      <div style={ROUTE_LIST_STYLE}>
        <RoutePerson label="Sponsor" person={sponsor} status="Primary" />
        {coApprover ? (
          <RoutePerson
            label="Co-approver"
            person={coApprover}
            status={
              lifecycleState === "waiting_on_co_approver"
                ? "Waiting"
                : "Optional"
            }
          />
        ) : (
          <div style={EMPTY_ROUTE_STYLE}>
            No co-approver has been routed yet.
          </div>
        )}
      </div>
      {!currentUserCanApprove ? (
        <p style={READ_ONLY_STYLE}>
          Read only. This event is pending the named approver before the canvas
          unlocks.
        </p>
      ) : null}
    </section>
  );
}

function RoutePerson({
  label,
  person,
  status,
}: {
  label: string;
  person: ApprovalPerson;
  status: string;
}) {
  return (
    <article style={ROUTE_PERSON_STYLE}>
      <div>
        <div style={PERSON_LABEL_STYLE}>{label}</div>
        <div style={PERSON_NAME_STYLE}>{person.displayName}</div>
        <div style={PERSON_ROLE_STYLE}>{person.role}</div>
      </div>
      <span style={STATUS_STYLE}>{status}</span>
    </article>
  );
}

const PANEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0,
  color: SHELL.INK_MUTED,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: 0,
  color: SHELL.INK,
  lineHeight: 1.22,
};

const ROUTE_LIST_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
};

const ROUTE_PERSON_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: "10px 11px",
};

const PERSON_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  color: SHELL.INK_MUTED,
};

const PERSON_NAME_STYLE: CSSProperties = {
  marginTop: 4,
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 700,
  color: SHELL.INK,
};

const PERSON_ROLE_STYLE: CSSProperties = {
  marginTop: 2,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};

const STATUS_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 999,
  padding: "4px 9px",
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  color: SHELL.INK,
  background: SHELL.PAPER_SOFT,
};

const EMPTY_ROUTE_STYLE: CSSProperties = {
  border: `1px dashed ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  padding: "10px 11px",
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  color: SHELL.INK_SOFT,
};

const READ_ONLY_STYLE: CSSProperties = {
  margin: 0,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  padding: "9px 10px",
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
  background: "#fbfaf7",
};
