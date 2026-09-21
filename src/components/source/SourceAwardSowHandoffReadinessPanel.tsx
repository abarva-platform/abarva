import type { CSSProperties, ReactNode } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";
import type {
  SourceAwardSowHandoffCheckpointStatus,
  SourceAwardSowHandoffReadiness,
  SourceAwardSowHandoffReadinessStatus,
} from "@/lib/source/award-sow-handoff-readiness-types";

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

function statusColor(status: SourceAwardSowHandoffCheckpointStatus): string {
  if (status === "completed" || status === "ready") return SHELL.MINT_TEXT;
  if (status === "not_open") return SHELL.INK_MUTED;
  return SHELL.RUST_TEXT;
}

function verdictLabel(status: SourceAwardSowHandoffReadinessStatus): string {
  switch (status) {
    case "ready_for_contract360_handoff":
      return "Ready for Contract 360 handoff review";
    case "blocked_candidate_selection":
      return "Candidate selection blocked";
    case "blocked_approval_readiness":
      return "Approval readiness blocked";
    case "blocked_contract_formation_package":
      return "Contract formation package blocked";
    case "blocked_executed_agreement_sow":
      return "Executed agreement/SOW blocked";
    case "blocked_contract360_handoff":
      return "Contract 360 handoff blocked";
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={CARD}>
      <div style={sourceSectionLabel}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

export function SourceAwardSowHandoffReadinessPanel({
  readiness,
}: {
  readiness: SourceAwardSowHandoffReadiness;
}) {
  return (
    <section
      style={PANEL}
      aria-label="Stage 08 Award and SOW handoff readiness panel"
    >
      <div style={HEADER}>
        <div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>
            Stage 08 · Award & SOW handoff
          </div>
          <h4 style={{ margin: "4px 0 0", color: SHELL.INK }}>
            Ready for canonical Contract 360 handoff?
          </h4>
          <p style={BODY_MUTED}>
            Read-only readiness over Source event state. This panel does not
            create awards, approvals, contracts, SOWs, or Contract 360 records.
          </p>
        </div>
        <div style={POSTURE_BADGE}>
          <div style={sourceSectionLabel}>Readiness verdict</div>
          <div
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              lineHeight: 1.4,
              color: readiness.readyForContract360Handoff
                ? SHELL.MINT_TEXT
                : SHELL.RUST_TEXT,
            }}
          >
            {verdictLabel(readiness.readinessStatus)}
          </div>
          <div style={BODY_MUTED}>
            Handoff ready: {readiness.readyForContract360Handoff ? "yes" : "no"}
          </div>
          <div style={BODY_MUTED}>
            Contract formation: {readiness.contractFormationState.replaceAll("_", " ")}
          </div>
        </div>
      </div>

      <div style={CHECKPOINT_GRID}>
        {readiness.checkpoints.map((checkpoint) => (
          <Section key={checkpoint.key} title={checkpoint.label}>
            <div
              style={{
                ...sourceSectionLabel,
                color: statusColor(checkpoint.status),
              }}
            >
              {checkpoint.status.replaceAll("_", " ")}
            </div>
            <div style={{ ...sourceSectionLabel, marginTop: 8 }}>
              Completed evidence
            </div>
            <ul style={LIST}>
              {checkpoint.completedEvidence.length > 0 ? (
                checkpoint.completedEvidence.map((item) => (
                  <li key={item}>{item}</li>
                ))
              ) : (
                <li>No completed evidence recorded for this checkpoint.</li>
              )}
            </ul>
            <div style={{ ...sourceSectionLabel, marginTop: 8 }}>Blockers</div>
            <ul style={LIST}>
              {checkpoint.blockers.length > 0 ? (
                checkpoint.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))
              ) : (
                <li>No blockers recorded for this checkpoint.</li>
              )}
            </ul>
          </Section>
        ))}
      </div>

      <div style={BOTTOM_GRID}>
        <Section title="Exactly one next action">
          <div style={{ color: SHELL.INK }}>
            {readiness.recommendedNextAction}
          </div>
        </Section>
        <Section title="Authority and guardrails">
          <div style={BODY_MUTED}>Authority: {readiness.authority}</div>
          <div style={BODY_MUTED}>
            Sources: {readiness.sourceModulesUsed.join(", ")}
          </div>
          <div style={{ ...BODY_MUTED, marginTop: 8 }}>
            Candidate selection, approval readiness, executed agreement/SOW
            readiness, and Contract 360 handoff remain separate checkpoints.
          </div>
        </Section>
      </div>
    </section>
  );
}

const PANEL: CSSProperties = {
  display: "grid",
  gap: 12,
  border: "1px solid " + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: "16px 18px",
};

const HEADER: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
};

const POSTURE_BADGE: CSSProperties = {
  minWidth: 220,
  border: "1px solid " + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: "10px 12px",
};

const CHECKPOINT_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 10,
};

const BOTTOM_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
  gap: 10,
};

const CARD: CSSProperties = {
  display: "grid",
  gap: 8,
  border: "1px solid " + SHELL.CARD_LINE,
  borderRadius: 8,
  background: SHELL.PAPER_SOFT,
  padding: "12px",
};

const BODY_MUTED: CSSProperties = {
  margin: "7px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  color: SHELL.INK_MUTED,
};

const LIST: CSSProperties = {
  margin: "5px 0 0",
  paddingLeft: 18,
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: SHELL.INK_MUTED,
};
