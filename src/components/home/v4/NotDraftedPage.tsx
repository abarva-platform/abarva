import { FindingsBlock, TableSet } from "./TableSet";
import type { ChapterDepth } from "./chapter-page-content";
import { PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * The explicit not-drafted state.
 *
 * It exists because the alternative -- hiding an undrafted chapter, or rendering it empty -- both
 * lie in the same direction: they let a reader believe they have seen everything the record has to
 * say. Saying "not drafted yet" out loud is the same discipline as the Not established band, one
 * level up.
 *
 * What is missing here is the PROSE, not the record. The estate rows ship in the same bundle, so a
 * chapter with no drafted narrative still shows the tables and findings its own rows produce. That
 * is the difference between "we have not written this yet" -- true, and worth saying -- and "we
 * have nothing for you", which was never true and is what the page used to imply.
 */
export function NotDraftedPage({
  chapterNumber,
  title,
  guidingQuestion,
  depth,
}: {
  chapterNumber: number;
  title: string;
  guidingQuestion: string;
  /** Tables and findings computed from the bundle's estate rows. Renders nothing when empty. */
  depth?: ChapterDepth;
}) {
  return (
    <div style={{ padding: `54px ${PAGE_X}px 0` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap" }}>
        <span style={eyebrow(V4.blue)}>
          Chapter {String(chapterNumber).padStart(2, "0")} · {title}
        </span>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: V4.slate, letterSpacing: "-0.01em" }}>
          {guidingQuestion}
        </span>
      </div>

      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: "clamp(34px,3vw,50px)",
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: "24px 0 0",
          maxWidth: "44ch",
          textWrap: "balance",
        }}
      >
        This chapter is not drafted yet.
      </h1>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 19,
          lineHeight: 1.62,
          color: V4.slate,
          maxWidth: "60ch",
          margin: "26px 0 0",
          textWrap: "pretty",
        }}
      >
        The narrative is not written. The record is here, and everything below is computed from it —
        no prose, no interpretation, every figure a filter over rows you can open.
      </p>

      {depth && (depth.tables.length > 0 || depth.findings.length > 0) ? (
        <div data-home-undrafted-depth style={{ margin: "10px -" + PAGE_X + "px 0" }}>
          <TableSet tables={depth.tables} />
          <FindingsBlock findings={depth.findings} />
        </div>
      ) : null}

      <div
        style={{
          margin: "38px 0 0",
          maxWidth: 1000,
          border: "1px solid rgba(186,117,23,0.4)",
          borderLeft: `2px solid ${V4.amber}`,
          borderRadius: 8,
          background: "rgba(186,117,23,0.045)",
          padding: "30px 32px 28px",
        }}
      >
        <div style={{ ...eyebrow(V4.slate), marginBottom: 11 }}>What it will answer</div>
        <p
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: "clamp(20px,1.7vw,26px)",
            fontWeight: 500,
            letterSpacing: "-0.022em",
            lineHeight: 1.28,
            color: V4.ink,
            maxWidth: "44ch",
            textWrap: "pretty",
          }}
        >
          {guidingQuestion}
        </p>
      </div>
    </div>
  );
}
