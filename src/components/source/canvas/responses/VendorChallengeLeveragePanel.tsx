"use client";

import type { CSSProperties } from "react";
import type { VendorChallengeIntelligence } from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

export function VendorChallengeLeveragePanel({
  intelligence,
}: {
  intelligence?: VendorChallengeIntelligence | null;
}) {
  if (!intelligence) return null;
  const challenges = intelligence.challengeLog.slice(0, 8);
  const seeds = intelligence.leverageSeeds.slice(0, 8);
  if (challenges.length === 0 && seeds.length === 0) return null;

  return (
    <section
      data-testid="source-vendor-challenge-leverage"
      style={CARD}
      aria-label="Vendor Challenge Log and Commercial Leverage Seeds"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Challenge before scoring</div>
          <h3 style={TITLE}>
            Vendor Challenge Log + Commercial Leverage Seeds
          </h3>
          <p style={COPY}>
            Source turns normalized response profiles into the questions,
            scoring caveats, and BAFO asks procurement should use before
            evaluation hardens.
          </p>
        </div>
        <div style={COUNT_WRAP}>
          <Count label="Challenges" value={intelligence.challengeCount} />
          <Count label="Levers" value={intelligence.leverageSeedCount} />
        </div>
      </div>

      <NegotiationLeverageCockpit seeds={seeds} />

      <div style={GRID}>
        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <div style={EYEBROW}>Vendor Challenge Log</div>
            <p style={MINI_COPY}>
              What must be questioned, clarified, or held conditional before
              scoring.
            </p>
          </div>
          <div style={ROW_LIST}>
            {challenges.map((challenge) => (
              <article key={challenge.challengeId} style={ROW}>
                <div style={ROW_TOP}>
                  <strong style={ROW_VENDOR}>{challenge.vendorName}</strong>
                  <span
                    style={{ ...PILL, ...severityTone(challenge.severity) }}
                  >
                    {challenge.severity}
                  </span>
                </div>
                <div style={ROW_CATEGORY}>
                  {challenge.issueCategory.replaceAll("_", " ")}
                </div>
                <p style={ROW_FINDING}>{challenge.finding}</p>
                <dl style={DETAILS}>
                  <Detail label="Evidence" value={challenge.evidenceLabel} />
                  <Detail label="Ask" value={challenge.clarificationQuestion} />
                  <Detail
                    label="Scoring"
                    value={challenge.scoringImplication}
                  />
                </dl>
              </article>
            ))}
          </div>
        </div>

        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <div style={EYEBROW}>Commercial Leverage Seeds</div>
            <p style={MINI_COPY}>
              BAFO-ready deal points derived from profile issues, not generic
              negotiation prose.
            </p>
          </div>
          <div style={ROW_LIST}>
            {seeds.map((seed) => (
              <article key={seed.seedId} style={ROW}>
                <div style={ROW_TOP}>
                  <strong style={ROW_VENDOR}>{seed.vendorName}</strong>
                  <span style={LEVER_TYPE}>
                    {seed.leverType.replaceAll("_", " ")}
                  </span>
                </div>
                <p style={ROW_FINDING}>{seed.finding}</p>
                <dl style={DETAILS}>
                  <Detail label="Buyer risk" value={seed.buyerRisk} />
                  <Detail label="Recommended ask" value={seed.recommendedAsk} />
                  <Detail label="BAFO language" value={seed.bafoLanguage} />
                </dl>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NegotiationLeverageCockpit({
  seeds,
}: {
  seeds: VendorChallengeIntelligence["leverageSeeds"];
}) {
  if (seeds.length === 0) return null;
  const evidenced = seeds.filter((seed) => seed.confidence === "high");
  const opportunity = seeds.filter((seed) => seed.confidence !== "high");

  return (
    <div style={COCKPIT}>
      <div style={COCKPIT_HEADER}>
        <div>
          <div style={EYEBROW}>Negotiation leverage cockpit</div>
          <p style={MINI_COPY}>
            Turns proposal gaps into vendor pressure without booking unproven
            savings. Every ask stays tied to evidence, confidence, impact, and a
            value guardrail.
          </p>
        </div>
        <div style={LEVER_SUMMARY}>
          <Count label="Evidenced asks" value={evidenced.length} />
          <Count label="Test only" value={opportunity.length} />
        </div>
      </div>
      <div style={LEVER_CARD_GRID}>
        {seeds.slice(0, 6).map((seed) => (
          <article key={seed.seedId} style={LEVER_CARD}>
            <div style={ROW_TOP}>
              <strong style={ROW_VENDOR}>{seed.vendorName}</strong>
              <span style={{ ...PILL, ...confidenceTone(seed.confidence) }}>
                {seed.confidence}
              </span>
            </div>
            <div style={ROW_CATEGORY}>
              {seed.leverType.replaceAll("_", " ")}
            </div>
            <p style={ROW_FINDING}>{seed.finding}</p>
            <div style={LEVER_FIELD_GRID}>
              <LeverageField
                label="Impact signal"
                value={seed.estimatedImpact}
              />
              <LeverageField label="BAFO ask" value={seed.recommendedAsk} />
              <LeverageField
                label="Value guardrail"
                value={valueGuardrail(seed.confidence)}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LeverageField({ label, value }: { label: string; value: string }) {
  return (
    <div style={LEVER_FIELD}>
      <span style={LEVER_FIELD_LABEL}>{label}</span>
      <strong style={LEVER_FIELD_VALUE}>{value}</strong>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div style={COUNT}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={DETAIL}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function severityTone(
  severity: VendorChallengeIntelligence["challengeLog"][number]["severity"],
): CSSProperties {
  if (severity === "high") return BAD;
  if (severity === "medium") return WARN;
  return GOOD;
}

function confidenceTone(
  confidence: VendorChallengeIntelligence["leverageSeeds"][number]["confidence"],
): CSSProperties {
  if (confidence === "high") return GOOD;
  if (confidence === "medium") return WARN;
  return BAD;
}

function valueGuardrail(
  confidence: VendorChallengeIntelligence["leverageSeeds"][number]["confidence"],
): string {
  if (confidence === "high") {
    return "Use as BAFO pressure; book value only after revised pricing or contract exhibit.";
  }
  return "Opportunity to test; do not count as savings until the vendor prices and cites it.";
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 14,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 16,
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
  margin: "4px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 23,
  lineHeight: 1.12,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 820,
};

const MINI_COPY: CSSProperties = {
  margin: "5px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const COUNT_WRAP: CSSProperties = {
  display: "flex",
  gap: 8,
};

const COUNT: CSSProperties = {
  minWidth: 86,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  padding: "7px 10px",
  display: "grid",
  gap: 2,
  textAlign: "right",
  color: CANVAS.INK,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: 12,
};

const COCKPIT: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(255,255,255,0.56)",
  padding: 12,
  display: "grid",
  gap: 10,
};

const COCKPIT_HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 14,
  alignItems: "start",
};

const LEVER_SUMMARY: CSSProperties = {
  display: "flex",
  gap: 8,
};

const LEVER_CARD_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
  gap: 10,
};

const LEVER_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 11,
  display: "grid",
  gap: 8,
};

const LEVER_FIELD_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const LEVER_FIELD: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 7,
  display: "grid",
  gap: 4,
  color: CANVAS.INK,
  fontSize: CANVAS.T_MICRO_SMALL,
  lineHeight: 1.35,
};

const LEVER_FIELD_LABEL: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const LEVER_FIELD_VALUE: CSSProperties = {
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.38,
};

const PANEL: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(255,255,255,0.5)",
  padding: 12,
  display: "grid",
  gap: 11,
};

const PANEL_HEAD: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  paddingBottom: 9,
};

const ROW_LIST: CSSProperties = {
  display: "grid",
  gap: 9,
};

const ROW: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.CARD,
  padding: 10,
  display: "grid",
  gap: 7,
};

const ROW_TOP: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "start",
};

const ROW_VENDOR: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 13,
  lineHeight: 1.25,
};

const ROW_CATEGORY: CSSProperties = {
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const ROW_FINDING: CSSProperties = {
  margin: 0,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const DETAILS: CSSProperties = {
  margin: 0,
  display: "grid",
  gap: 5,
};

const DETAIL: CSSProperties = {
  display: "grid",
  gap: 2,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const PILL: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 800,
};

const LEVER_TYPE: CSSProperties = {
  ...PILL,
  color: CANVAS.ACTIVE,
  borderColor: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
  maxWidth: 180,
  whiteSpace: "normal",
  textAlign: "right",
};

const GOOD: CSSProperties = {
  color: CANVAS.ACTIVE,
  borderColor: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
};

const WARN: CSSProperties = {
  color: CANVAS.WAITING,
  borderColor: CANVAS.WAITING,
  background: "rgba(186,117,23,0.06)",
};

const BAD: CSSProperties = {
  color: CANVAS.BLOCKED,
  borderColor: CANVAS.BLOCKED,
  background: "rgba(163,45,45,0.06)",
};
