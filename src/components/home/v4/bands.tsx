import type { CSSProperties } from "react";

import type { EnterpriseSignalPacket, GroundedClaim } from "@/lib/home/preview/types";
import { claimSource } from "./source-label";
import { MONO, PAGE_X, SANS, SERIF, V4, bandHeading, eyebrow } from "./tokens";

/**
 * The four content bands of a v4 chapter.
 *
 * v4's central move: the epistemic status of a claim is stated ONCE, by which band it sits in,
 * instead of ~70 per-claim `Fact · High confidence` labels per tenant. That is not a styling
 * preference -- the per-claim labels were unreadable at volume and taught the reader to skip them,
 * which is the opposite of what an honesty mechanism should do. Preserve the band split.
 *
 * Each band also carries a one-line rubric under its heading saying what kind of statement lives
 * there. That sentence is what makes the distinction legible without labelling every item.
 */

function BandHeading({
  title,
  rubric,
  color = V4.ink,
  ruleColor = V4.rule,
  style,
}: {
  title: string;
  rubric: string;
  color?: string;
  ruleColor?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={style}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <h2 style={bandHeading(color)}>{title}</h2>
        <span style={{ flex: 1, height: 1, background: ruleColor }} />
      </div>
      <p style={{ margin: "10px 0 0", fontFamily: SANS, fontSize: 14, lineHeight: 1.55, color: V4.slate, maxWidth: "48ch" }}>
        {rubric}
      </p>
    </div>
  );
}

/** Claim text on the left with a coloured spine, its source named in the margin beside it.
 * Evidence is adjacent rather than behind a disclosure -- the reader sees what a statement rests
 * on without having to ask for it. */
function ClaimRow({
  claim,
  signalPacket,
  spine,
  first,
  severityLabel,
}: {
  claim: GroundedClaim;
  signalPacket: EnterpriseSignalPacket;
  spine: string;
  first: boolean;
  severityLabel?: string;
}) {
  const source = claimSource(claim, signalPacket);
  const topRule = first ? undefined : `1px solid ${V4.ruleSoft}`;
  return (
    <>
      <div style={{ padding: "26px 0 26px 22px", borderLeft: `2px solid ${spine}`, borderTop: topRule }}>
        {severityLabel ? (
          <div style={{ ...eyebrow(spine), letterSpacing: "0.11em", marginBottom: 10 }}>{severityLabel}</div>
        ) : null}
        <p style={{ margin: 0, fontFamily: SANS, fontSize: 18, lineHeight: 1.54, color: V4.ink, maxWidth: "46ch", textWrap: "pretty" }}>
          {claim.statement}
        </p>
      </div>
      <aside style={{ padding: "26px 0", borderTop: topRule, maxWidth: 520 }}>
        <div style={{ ...eyebrow(V4.navy), letterSpacing: "0.11em" }}>{source.label}</div>
        <p style={{ margin: "5px 0 0", fontFamily: MONO, fontSize: 11, color: V4.slate, letterSpacing: "0.02em" }}>
          {source.ids}
          {source.hasUnresolved ? " · one citation does not resolve" : ""}
        </p>
      </aside>
    </>
  );
}

const CLAIM_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(30rem,46%)),1fr))",
  gap: "0 clamp(20px,2.6vw,56px)",
  marginTop: 14,
};

/** Band 1 -- counted from the client's own systems and interviews. */
export function RecordBand({ claims, signalPacket }: { claims: GroundedClaim[]; signalPacket: EnterpriseSignalPacket }) {
  if (claims.length === 0) return null;
  return (
    <div style={{ padding: `0 ${PAGE_X}px` }}>
      <BandHeading
        title="What the record shows"
        rubric="Counted from this enterprise's own systems and interviews. Sources named alongside."
        style={{ margin: "58px 0 0" }}
      />
      <div style={CLAIM_GRID}>
        {claims.map((claim, i) => (
          <ClaimRow key={claim.statement} claim={claim} signalPacket={signalPacket} spine={V4.navy} first={i === 0} />
        ))}
      </div>
    </div>
  );
}

/** Band 2 -- readings of band 1, on a white ground so the shift from counted to interpreted is
 * visible before a word is read. Each carries the evidence it follows from, so it stays
 * contestable on the record rather than on authority. */
export function FollowsBand({ claims, signalPacket }: { claims: GroundedClaim[]; signalPacket: EnterpriseSignalPacket }) {
  if (claims.length === 0) return null;
  return (
    <section
      style={{
        margin: "60px 0 0",
        background: V4.surface,
        borderTop: `1px solid ${V4.rule}`,
        borderBottom: `1px solid ${V4.rule}`,
        padding: `48px ${PAGE_X}px 46px`,
      }}
    >
      <BandHeading
        title="What follows from it"
        rubric="Readings of the evidence above, not further findings. Each one is contestable on the record it cites."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,340px),1fr))",
          gap: "0 clamp(20px,3vw,56px)",
          marginTop: 20,
        }}
      >
        {claims.map((claim) => (
          <div key={claim.statement} style={{ padding: "26px 0", borderTop: `1px solid rgba(136,135,128,0.22)` }}>
            <p
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: "clamp(19px,1.6vw,23px)",
                fontWeight: 500,
                letterSpacing: "-0.018em",
                lineHeight: 1.36,
                color: V4.ink,
                maxWidth: "40ch",
                textWrap: "pretty",
              }}
            >
              {claim.statement}
            </p>
            <p style={{ margin: "12px 0 0", fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", color: V4.slate }}>
              FOLLOWS FROM {claimSource(claim, signalPacket).ids}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Band 3 -- exposures the client's own risk register already rates high. Red is reserved for
 * exactly this and is never used for emphasis; if it appeared decoratively it would stop meaning
 * "your own register says this is severe". */
export function ExposuresBand({ claims, signalPacket }: { claims: GroundedClaim[]; signalPacket: EnterpriseSignalPacket }) {
  if (claims.length === 0) return null;
  return (
    <div style={{ padding: `0 ${PAGE_X}px` }}>
      <BandHeading
        title="Open exposures"
        rubric="Carried here from this enterprise's own risk and dependency records."
        color={V4.red}
        ruleColor="rgba(163,45,45,0.32)"
        style={{ margin: "52px 0 0" }}
      />
      <div style={CLAIM_GRID}>
        {claims.map((claim, i) => (
          <ClaimRow key={claim.statement} claim={claim} signalPacket={signalPacket} spine={V4.red} first={i === 0} />
        ))}
      </div>
    </div>
  );
}

/** Band 4 -- what the chapter deliberately does not assert.
 *
 * This band gets full `h2` billing and each gap its own `h3` sentence. Gaps are findings, not
 * apologies, and the closing line says why plainly: a blank here is a reported gap, an invented
 * number would not be. Demoting this to a footnote (as the previous Home did) is the one change
 * that would defeat the whole design.
 *
 * The design also specifies a Missing / Why / To close it breakdown per gap. The contract carries
 * a gap as a single sentence, so that breakdown renders only when structured detail exists --
 * see `GapDetail`. An absent breakdown is left absent rather than filled with restated headline.
 */
export interface GapDetail {
  missing?: string;
  why?: string;
  toClose?: string;
}

export function NotEstablishedBand({
  gaps,
  details,
}: {
  gaps: string[];
  details?: Record<string, GapDetail>;
}) {
  if (gaps.length === 0) return null;
  return (
    <div style={{ padding: `0 ${PAGE_X}px` }}>
      <BandHeading
        title="Not established"
        rubric="What this chapter deliberately does not assert, and why."
        color={V4.amber}
        ruleColor="rgba(186,117,23,0.35)"
        style={{ margin: "52px 0 0" }}
      />
      {gaps.map((gap, i) => {
        const detail = details?.[gap];
        const cells = [
          ["Missing", detail?.missing],
          ["Why", detail?.why],
          ["To close it", detail?.toClose],
        ].filter(([, v]) => Boolean(v)) as Array<[string, string]>;
        return (
          <div
            key={gap}
            style={{
              margin: i === 0 ? "20px 0 0" : "16px 0 0",
              border: "1px solid rgba(186,117,23,0.4)",
              borderLeft: `2px solid ${V4.amber}`,
              borderRadius: 8,
              background: "rgba(186,117,23,0.045)",
              padding: "30px 32px 28px",
            }}
          >
            <h3
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(20px,1.7vw,26px)",
                fontWeight: 500,
                letterSpacing: "-0.022em",
                lineHeight: 1.26,
                margin: 0,
                maxWidth: "48ch",
                textWrap: "balance",
              }}
            >
              {gap}
            </h3>
            {cells.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))",
                  gap: "clamp(18px,2vw,32px)",
                  marginTop: 26,
                  paddingTop: 22,
                  borderTop: "1px solid rgba(186,117,23,0.3)",
                }}
              >
                {cells.map(([label, value]) => (
                  <div key={label}>
                    <div style={{ ...eyebrow(V4.slate), marginBottom: 9 }}>{label}</div>
                    <p style={{ margin: 0, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.58, color: V4.inkSoft }}>{value}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {i === 0 ? (
              <p
                style={{
                  margin: "24px 0 0",
                  paddingTop: 18,
                  borderTop: "1px solid rgba(186,117,23,0.3)",
                  fontFamily: SANS,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: V4.slate,
                  maxWidth: "58ch",
                }}
              >
                A blank here is a reported gap. An invented number would not be.
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Closing section -- the questions this chapter puts in the reader's hands. Absent on chapters
 * whose thesis produced none, and absent means the section does not render at all: a heading with
 * nothing under it reads as a loading failure. */
export function QuestionsSection({ questions }: { questions: string[] }) {
  if (questions.length === 0) return null;
  return (
    <section
      style={{
        margin: "58px 0 0",
        background: V4.cream,
        borderTop: `1px solid ${V4.rule}`,
        padding: `46px ${PAGE_X}px 48px`,
      }}
    >
      <span style={eyebrow(V4.slate)}>Questions worth asking</span>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(26px,2.4vw,34px)",
          fontWeight: 500,
          letterSpacing: "-0.026em",
          margin: "14px 0 30px",
        }}
      >
        Take these into the room.
      </h2>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,340px),1fr))",
          gap: "0 clamp(20px,3vw,56px)",
        }}
      >
        {questions.map((q, i) => (
          <li
            key={q}
            style={{
              display: "grid",
              gridTemplateColumns: "36px minmax(0,1fr)",
              gap: 4,
              padding: "18px 0",
              borderTop: "1px solid rgba(136,135,128,0.3)",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 11, color: V4.slate, paddingTop: 5 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.56, color: V4.inkSoft, maxWidth: "52ch", textWrap: "pretty" }}>{q}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ChapterHeader({
  eyebrowText,
  guidingQuestion,
  headline,
  standfirst,
}: {
  eyebrowText: string;
  guidingQuestion: string;
  headline: string;
  standfirst?: string;
}) {
  return (
    <header style={{ padding: `54px ${PAGE_X}px 0` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap" }}>
        <span style={eyebrow(V4.blue)}>{eyebrowText}</span>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: V4.slate, letterSpacing: "-0.01em" }}>
          {guidingQuestion}
        </span>
      </div>
      {/* Two columns, always. The design pairs the headline with the lede across the full canvas and
          bottom-aligns them; collapsing to a single column leaves the right half of a wide screen
          empty, which is exactly the dead canvas this layout exists to avoid. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,max(30rem,46%)),1fr))",
          gap: "clamp(20px,3vw,56px)",
          alignItems: "end",
          marginTop: 24,
        }}
      >
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: "clamp(27px,2.3vw,38px)",
            lineHeight: 1.16,
            letterSpacing: "-0.026em",
            margin: 0,
            textWrap: "pretty",
          }}
        >
          {headline}
        </h1>
        {standfirst ? (
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 17, lineHeight: 1.62, color: V4.slate, maxWidth: "52ch", textWrap: "pretty" }}>
            {standfirst}
          </p>
        ) : null}
      </div>
    </header>
  );
}
