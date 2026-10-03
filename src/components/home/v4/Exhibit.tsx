import type { ReactNode } from "react";

import type {
  EnterpriseSignalPacket,
  VisualOpportunity,
} from "@/lib/home/preview/types";
import { cxoText } from "./cxo-language";
import { sourceForIds } from "./source-label";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * A v4 exhibit is full-bleed, not a card. It carries its own headline in the same serif as the
 * chapter, states its own source, and -- crucially -- states its own truncation rule on the
 * surface rather than silently showing a top-N.
 */

/**
 * The exhibit eyebrow names the exhibit's *subject* in two or three words.
 *
 * It deliberately does not use `visual.purpose`, which is written for the pipeline and reads like
 * it: "Show vendor spend concentration to support the single-vendor dependency narrative". Telling
 * a CXO that an exhibit exists to support a narrative is both jargon and a bad look -- it frames
 * their own data as evidence assembled for an argument. The subject label is what belongs on the
 * page; the purpose string stays internal.
 */
export const DATASET_SUBJECT: Record<string, string> = {
  vendor_spend_concentration: "Third-party spend",
  technology_spend_mix: "Technology spend",
  application_landscape_by_function: "Application estate",
  program_investment_distribution: "Program investment",
  stalled_programs: "Program delivery",
  metric_target_attainment: "Metric attainment",
  leadership_theme_frequency: "Leadership themes",
  leadership_evidence_alignment: "Testimony against record",
  risk_system_concentration: "Risk concentration",
};

export function Exhibit({
  index,
  visual,
  signalPacket,
  meta,
  dark = false,
  children,
}: {
  index: number;
  visual: VisualOpportunity;
  signalPacket: EnterpriseSignalPacket;
  /** Right-hand counts line, derived by the caller from real records. Omitted when unavailable --
   * never estimated. */
  meta?: string;
  dark?: boolean;
  children: ReactNode;
}) {
  const source = sourceForIds(visual.evidence_ids, signalPacket);
  const title = cxoText(visual.title);
  const keyMessage = cxoText(visual.key_message);
  const fg = dark ? "rgba(250,247,241,0.86)" : V4.slate;
  const eyebrowColor = dark ? "rgba(250,247,241,0.62)" : V4.blue;

  return (
    <figure
      style={{
        margin: 0,
        background: dark ? V4.navy : V4.paper,
        padding: `48px ${PAGE_X}px 44px`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          paddingRight: 70,
        }}
      >
        <span style={eyebrow(eyebrowColor)}>
          Exhibit {String(index).padStart(2, "0")}
          {DATASET_SUBJECT[visual.dataset_ref]
            ? ` · ${DATASET_SUBJECT[visual.dataset_ref]}`
            : ""}
        </span>
        {meta ? (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.08em",
              color: fg,
            }}
          >
            {meta}
          </span>
        ) : null}
      </div>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(26px,2.4vw,36px)",
          fontWeight: 500,
          letterSpacing: "-0.026em",
          lineHeight: 1.16,
          margin: "14px 0 34px",
          maxWidth: "46ch",
          textWrap: "balance",
          color: dark ? V4.paper : V4.ink,
        }}
      >
        {keyMessage}
      </h2>
      {children}
      <figcaption
        style={{
          margin: "30px 0 0",
          paddingTop: 20,
          borderTop: `1px solid ${dark ? "rgba(250,247,241,0.18)" : V4.rule}`,
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(min(100%,max(24rem,40%)),1fr))",
          gap: "clamp(20px,3vw,48px)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: SANS,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: fg,
            maxWidth: "54ch",
            textWrap: "pretty",
          }}
        >
          {title}
        </p>
        <div>
          <div style={{ ...eyebrow(fg), marginBottom: 9 }}>Source</div>
          <p
            style={{
              margin: 0,
              fontFamily: MONO,
              fontSize: 11,
              lineHeight: 1.7,
              color: fg,
            }}
          >
            {source.label}
            <br />
            {source.ids}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
