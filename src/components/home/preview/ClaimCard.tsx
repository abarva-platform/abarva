"use client";

import { useId, useState } from "react";

import { HOME_HEX } from "./visuals/home-chart-kit";
import { resolveEvidence } from "./evidence-resolver";
import type { EnterpriseSignalPacket, GroundedClaim } from "@/lib/home/preview/types";

/** Reader-facing wording, not the internal taxonomy. A CXO does not need to know a claim is a
 * CROSS_DOMAIN_INSIGHT; they need to know whether they are being told a fact about their own
 * business or being given our judgement. The distinction is kept because it is the honesty
 * mechanism -- the vocabulary is what changes. */
const CLAIM_TYPE_LABEL: Record<GroundedClaim["claim_type"], string> = {
  FACT: "Fact",
  OBSERVATION: "Observation",
  CROSS_DOMAIN_INSIGHT: "Analysis",
  ADVISORY_INFERENCE: "Our interpretation",
};

const CONFIDENCE_LABEL: Record<GroundedClaim["confidence"], string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

/** One claim, rendered as executive prose with a quiet "why do we believe this" affordance --
 * evidence provenance one click away, per the workstream's own bar ("elegant, not like an audit
 * log pasted into the UI"). Collapsed by default: the narrative reads clean; the evidence is
 * there the moment someone asks for it, not printed whether they want it or not. */
export function ClaimCard({
  claim,
  signalPacket,
  tone = "neutral",
}: {
  claim: GroundedClaim;
  signalPacket: EnterpriseSignalPacket;
  tone?: "neutral" | "tension";
}) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const evidence = resolveEvidence(claim.evidence_ids, signalPacket);

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 8,
        border: `1px solid ${HOME_HEX.border}`,
        borderLeft: `3px solid ${tone === "tension" ? HOME_HEX.amber : HOME_HEX.navy}`,
        background: "#FFFFFF",
      }}
    >
      <p style={{ margin: 0, fontFamily: "var(--font-body-sans)", fontSize: 14, lineHeight: 1.55, color: HOME_HEX.textPrimary }}>
        {claim.statement}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <span style={{ fontFamily: "var(--font-body-sans)", fontSize: 11, color: HOME_HEX.textDisabled }}>
          {CLAIM_TYPE_LABEL[claim.claim_type]} · {CONFIDENCE_LABEL[claim.confidence]}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={detailId}
          style={{
            marginLeft: "auto",
            border: "none",
            background: "none",
            padding: 0,
            fontFamily: "var(--font-body-sans)",
            fontSize: 11.5,
            fontWeight: 600,
            color: HOME_HEX.teal,
            cursor: "pointer",
          }}
        >
          {expanded ? "Hide evidence" : `Why do we believe this? (${claim.evidence_ids.length})`}
        </button>
      </div>
      {expanded ? (
        <ul id={detailId} style={{ listStyle: "none", margin: "10px 0 0", padding: 0, borderTop: `1px solid ${HOME_HEX.border}`, paddingTop: 10 }}>
          {evidence.map((item) => (
            <li key={item.id} style={{ marginBottom: 8, fontFamily: "var(--font-body-sans)", fontSize: 12.5 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                <span
                  style={{
                    fontFamily: "var(--font-body-mono)",
                    fontSize: 10.5,
                    color: item.unresolved ? HOME_HEX.red : HOME_HEX.textDisabled,
                    flexShrink: 0,
                  }}
                >
                  {item.id}
                </span>
                {item.signalKind === "testimony" ? (
                  <span style={{ fontSize: 10, color: HOME_HEX.indigo, fontWeight: 600 }}>From leadership interviews</span>
                ) : item.origin === "context" ? (
                  <span style={{ fontSize: 10, color: HOME_HEX.textDisabled, fontWeight: 600 }}>From your systems</span>
                ) : null}
              </div>
              <p style={{ margin: "2px 0 0", color: item.unresolved ? HOME_HEX.red : HOME_HEX.textSecondary, lineHeight: 1.5 }}>
                {item.statement}
              </p>
              {item.evidenceRefs && item.evidenceRefs.length > 0 ? (
                <p style={{ margin: "2px 0 0", color: HOME_HEX.textDisabled, fontSize: 11 }}>
                  Records: {item.evidenceRefs.join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
