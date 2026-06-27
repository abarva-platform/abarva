import type { CSSProperties } from "react";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";

const INK = "#1A1A18";
const MUTED = "#6B7280";
const LINE = "#e5e5e5";
const BG = "#FBFAF7";
const WARN = "#B5852A";
const OK = "#3F7A5B";
const BAD = "#B4513C";

function statusMeta(packet: MoveEvidenceNeedPacket): {
  label: string;
  color: string;
  bg: string;
} {
  if (packet.status === "covered") {
    return { label: "Covered", color: OK, bg: "rgba(63,122,91,0.09)" };
  }
  if (packet.status === "waived") {
    return { label: "Waived", color: WARN, bg: "rgba(181,133,42,0.1)" };
  }
  if (packet.priority === "required") {
    return { label: "Required missing", color: BAD, bg: "rgba(180,81,60,0.09)" };
  }
  return { label: "Optional gap", color: WARN, bg: "rgba(181,133,42,0.1)" };
}

function chipStyle(color: string, bg: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 7px",
    borderRadius: 999,
    backgroundColor: bg,
    color,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontFamily: "JetBrains Mono, monospace",
    whiteSpace: "nowrap",
  };
}

function formatBlocked(packet: MoveEvidenceNeedPacket): string {
  if (packet.blockedArtifacts.length === 0) return "No artifact block mapped";
  const visible = packet.blockedArtifacts.slice(0, 3);
  const names = visible.map((artifact) => artifact.title).join(", ");
  const more = packet.blockedArtifacts.length - visible.length;
  return more > 0 ? `${names} + ${more} more` : names;
}

export function MoveEvidenceNeedsPanel({
  packets,
  title = "What We Need Next",
  compact = false,
}: {
  packets: MoveEvidenceNeedPacket[];
  title?: string;
  compact?: boolean;
}) {
  if (packets.length === 0) return null;
  const missing = packets.filter((packet) => packet.status !== "covered");
  const visible = (missing.length > 0 ? missing : packets).slice(0, compact ? 4 : 8);

  return (
    <section
      data-testid="moves-evidence-needs-panel"
      style={{
        marginBottom: compact ? 16 : 22,
        padding: compact ? "12px" : "14px",
        border: `1px solid ${LINE}`,
        borderRadius: 8,
        background: BG,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: compact ? 15 : 17,
              color: INK,
              marginBottom: 2,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
            Missing inputs are shown as client actions, with the artifact impact
            and draft boundary made explicit.
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={chipStyle(BAD, "rgba(180,81,60,0.09)")}>
            {missing.filter((packet) => packet.priority === "required").length} required
          </span>
          <span style={chipStyle(WARN, "rgba(181,133,42,0.1)")}>
            {missing.filter((packet) => packet.priority !== "required").length} optional
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((packet) => {
          const meta = statusMeta(packet);
          return (
            <article
              key={packet.familyId}
              style={{
                background: "#FFFFFF",
                border: `1px solid ${LINE}`,
                borderLeft: `3px solid ${meta.color}`,
                borderRadius: 7,
                padding: compact ? "10px" : "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 5,
                }}
              >
                <div style={{ minWidth: 220, flex: "1 1 280px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>
                    {packet.evidenceSlot}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    Owner/source: {packet.ownerSource} · Formats:{" "}
                    {packet.acceptedFormats.join(", ")}
                  </div>
                </div>
                <span style={chipStyle(meta.color, meta.bg)}>{meta.label}</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: compact ? "1fr" : "1.15fr 1fr",
                  gap: compact ? 6 : 12,
                }}
              >
                <div style={{ fontSize: 12, color: "#333", lineHeight: 1.45 }}>
                  <strong>Ask:</strong> {packet.nextAction}
                  <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                    {packet.exampleContent.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ fontSize: 12, color: "#333", lineHeight: 1.45 }}>
                  <div>
                    <strong>Why it matters:</strong> {packet.whyItMatters}
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <strong>Blocks:</strong> {formatBlocked(packet)}
                  </div>
                  <div style={{ marginTop: 5 }}>
                    <strong>Draft boundary:</strong>{" "}
                    {packet.canDraftBoundary.canDraftLabel}{" "}
                    {packet.canDraftBoundary.cannotDraftLabel}
                  </div>
                  {packet.preliminaryGenerationCaveat && (
                    <div style={{ marginTop: 5, color: WARN }}>
                      <strong>Preliminary caveat:</strong>{" "}
                      {packet.preliminaryGenerationCaveat}
                    </div>
                  )}
                  {packet.waiverOption && (
                    <div style={{ marginTop: 5, color: MUTED }}>
                      <strong>Waiver:</strong> {packet.waiverOption}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
