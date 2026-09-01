import type {
  ChapterView,
  EnterpriseSignalPacket,
  GroundedClaim,
  Signal,
  VisualOpportunity,
} from "@/lib/home/preview/types";
import {
  ChapterHeader,
  ExposuresBand,
  FollowsBand,
  NotEstablishedBand,
  QuestionsSection,
  RecordBand,
} from "./bands";
import { Exhibit, ExhibitBars } from "./Exhibit";
import { splitChapterIntoBands } from "./chapter-bands";
import {
  FindingsBlock,
  PageShape,
  TableSet,
  UnsupportedViews,
} from "./TableSet";
import { RenewalTimeline } from "./RenewalTimeline";
import type { ChapterDepth } from "./chapter-page-content";
import { MONO, PAGE_X, SANS, SERIF, V4, eyebrow } from "./tokens";

/**
 * One chapter, rendered in v4's reading order: header, exhibit, then the bands in the order a
 * reader needs them -- what is counted, what follows, what is exposed, what is not established --
 * and the questions the chapter puts in their hands.
 *
 * Bands that hold nothing do not render. Real chapters in this corpus carry one, two, three or
 * four bands, and an empty heading reads as a broken page rather than as an honest absence, which
 * is the opposite of what this design is for.
 */
export function ChapterPage({
  chapter,
  chapterNumber,
  signalPacket,
  visualDatasets,
  exhibitMeta,
  depth,
  contracts,
  asOf,
  onOpenRows,
}: {
  chapter: ChapterView;
  chapterNumber: number;
  signalPacket: EnterpriseSignalPacket;
  visualDatasets: Record<string, Array<Record<string, unknown>>>;
  /** Per-dataset counts line, derived by the caller from real records. */
  exhibitMeta?: Record<string, string>;
  /** Tables and findings computed from the estate rows in the bundle -- no model, no packet claim.
   * Absent, or empty, renders nothing: a chapter whose rows produce no table has no table set. */
  depth?: ChapterDepth;
  /** Vendor rows, where this chapter reads them. The timeline renders only when they are here. */
  contracts?: Array<Record<string, unknown>>;
  /** The record's own as-of date, so a past term end means past relative to the record. */
  asOf?: string;
  /** Opens the rows behind a finding in the record browser. */
  onOpenRows?: (objectType: string, filter: string) => void;
}) {
  const bands = splitChapterIntoBands(chapter, signalPacket);
  const exhibits = chapter.visual_opportunities.filter((v) =>
    Boolean(visualDatasets[v.dataset_ref]),
  );
  const [lead, ...rest] = exhibits;

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          [data-chapter-readout], [data-leadership-strip] { grid-template-columns: 1fr !important; }
          [data-leadership-metrics] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <ChapterHeader
        eyebrowText={`Chapter ${String(chapterNumber).padStart(2, "0")} · ${chapter.title}`}
        guidingQuestion={chapter.guidingQuestion}
        headline={chapter.headline}
        standfirst={chapter.executive_synthesis}
      />

      <ChapterExecutiveReadout
        chapter={chapter}
        bands={bands}
        signalPacket={signalPacket}
      />

      {depth ? (
        <PageShape
          tables={depth.tables}
          findings={depth.findings}
          unsupported={depth.unsupported}
        />
      ) : null}
      {depth ? <TableSet tables={depth.tables} /> : null}
      {contracts && contracts.length > 0 ? (
        <RenewalTimeline contracts={contracts} asOf={asOf} />
      ) : null}
      {depth ? (
        <FindingsBlock findings={depth.findings} onOpenRows={onOpenRows} />
      ) : null}
      {depth ? <UnsupportedViews views={depth.unsupported} /> : null}

      {lead ? (
        <ExhibitFor
          visual={lead}
          index={1}
          signalPacket={signalPacket}
          visualDatasets={visualDatasets}
          meta={exhibitMeta?.[lead.dataset_ref]}
          dark
        />
      ) : null}

      <RecordBand claims={bands.record} signalPacket={signalPacket} />
      <FollowsBand claims={bands.follows} signalPacket={signalPacket} />

      {rest.map((visual, i) => (
        <ExhibitFor
          key={visual.dataset_ref}
          visual={visual}
          index={i + 2}
          signalPacket={signalPacket}
          visualDatasets={visualDatasets}
          meta={exhibitMeta?.[visual.dataset_ref]}
        />
      ))}

      <ExposuresBand claims={bands.exposures} signalPacket={signalPacket} />
      <NotEstablishedBand gaps={bands.gaps} />
      <QuestionsSection questions={bands.questions} />

      {bands.filledBandCount === 0 ? (
        <div style={{ padding: `44px ${PAGE_X}px 0` }}>
          <p
            style={{
              margin: 0,
              fontFamily: SANS,
              fontSize: 16,
              lineHeight: 1.6,
              color: V4.slate,
              maxWidth: "60ch",
            }}
          >
            This chapter is not ready for executive review. The current record
            does not yet connect enough verified statements to support this
            page&apos;s leadership question.
          </p>
        </div>
      ) : null}
    </>
  );
}

function ChapterExecutiveReadout({
  chapter,
  bands,
  signalPacket,
}: {
  chapter: ChapterView;
  bands: ReturnType<typeof splitChapterIntoBands>;
  signalPacket: EnterpriseSignalPacket;
}) {
  const primaryRecord = firstStatement(bands.record);
  const primaryInference = firstStatement(bands.follows);
  const primaryExposure = firstStatement(bands.exposures);
  const primaryQuestion = chapter.questions_to_ask[0];
  const primaryGap = chapter.limitations[0];
  const proofCount =
    chapter.key_insights.length +
    chapter.tensions.length +
    chapter.what_to_watch.length;
  const leadershipSignals = leadershipSignalsForChapter(chapter, signalPacket);

  return (
    <section style={{ padding: `24px ${PAGE_X}px 0` }}>
      <div data-chapter-readout style={readoutShellStyle}>
        <div style={readoutLeadStyle}>
          <div>
            <span style={eyebrow(V4.green)}>CXO readout</span>
            <h2 style={readoutTitleStyle}>Decision this page supports</h2>
            <p style={readoutTextStyle}>
              {primaryInference ??
                primaryRecord ??
                "No executive decision should be taken from this chapter yet."}
            </p>
          </div>
          <div style={readoutMetaStyle}>
            <span>{proofCount.toLocaleString()} grounded statements</span>
            <span>
              {chapter.visual_opportunities.length.toLocaleString()} exhibits
            </span>
            <span>
              {chapter.questions_to_ask.length.toLocaleString()} questions
            </span>
            <span>{chapter.limitations.length.toLocaleString()} limits</span>
          </div>
        </div>
        <div style={readoutCardGridStyle}>
          <ReadoutCard
            label="Record signal"
            tone={V4.navy}
            value={
              primaryRecord ??
              "No evidence-backed statement is available for this chapter."
            }
          />
          <ReadoutCard
            label="Exposure to watch"
            tone={primaryExposure ? V4.red : V4.amber}
            value={
              primaryExposure ??
              primaryGap ??
              "No exposure has been established for this chapter."
            }
          />
          <ReadoutCard
            label="Question for the room"
            tone={V4.blue}
            value={
              primaryQuestion ??
              "No leadership question is ready for this chapter."
            }
          />
        </div>
        {leadershipSignals.length > 0 ? (
          <LeadershipVoiceStrip signals={leadershipSignals} />
        ) : null}
      </div>
    </section>
  );
}

function LeadershipVoiceStrip({ signals }: { signals: Signal[] }) {
  const [lead, ...rest] = signals;
  const consensus = signals.filter(
    (signal) => signal.kind === "consensus",
  ).length;
  const testimony = signals.filter(
    (signal) => signal.kind === "testimony",
  ).length;
  const contradiction = signals.filter(
    (signal) => signal.kind === "contradiction",
  ).length;
  return (
    <div data-leadership-strip style={voiceStripStyle}>
      <div style={{ minWidth: 0 }}>
        <span style={eyebrow(V4.amber)}>Leadership voice</span>
        <p style={voiceLeadStyle}>{stripDoubleQuotes(lead.statement)}</p>
      </div>
      <div data-leadership-metrics style={voiceMetricGridStyle}>
        <VoiceMetric value={consensus} label="consensus themes" />
        <VoiceMetric value={testimony} label="testimony excerpts" />
        <VoiceMetric value={contradiction} label="record conflicts" />
      </div>
      {rest.length > 0 ? (
        <div style={voiceQuoteGridStyle}>
          {rest.slice(0, 2).map((signal) => (
            <p key={signal.id} style={voiceQuoteStyle}>
              {stripDoubleQuotes(signal.statement)}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VoiceMetric({ value, label }: { value: number; label: string }) {
  return (
    <div style={voiceMetricStyle}>
      <span>{value.toLocaleString()}</span>
      <strong>{label}</strong>
    </div>
  );
}

function ReadoutCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <article style={{ ...readoutCardStyle, borderTopColor: tone }}>
      <span style={eyebrow(tone)}>{label}</span>
      <p style={readoutCardTextStyle} title={value}>
        {compact(value, 190)}
      </p>
    </article>
  );
}

function firstStatement(claims: GroundedClaim[]): string | null {
  return claims[0]?.statement ?? null;
}

function leadershipSignalsForChapter(
  chapter: ChapterView,
  signalPacket: EnterpriseSignalPacket,
): Signal[] {
  const ids = new Set(
    [...chapter.key_insights, ...chapter.tensions, ...chapter.what_to_watch]
      .flatMap((claim) => claim.evidence_ids)
      .filter((id) => id.startsWith("sig_")),
  );
  const direct = signalPacket.signals.filter(
    (signal) =>
      ids.has(signal.id) &&
      signal.domains.includes("ai_value_interview_evidence"),
  );
  if (direct.length > 0) return rankLeadershipSignals(direct).slice(0, 4);
  if (chapter.chapterId === "leadership_perspective") {
    return rankLeadershipSignals(
      signalPacket.signals.filter((signal) =>
        signal.domains.includes("ai_value_interview_evidence"),
      ),
    ).slice(0, 5);
  }
  return [];
}

function rankLeadershipSignals(signals: Signal[]): Signal[] {
  const rank: Record<string, number> = {
    testimony: 0,
    consensus: 1,
    contradiction: 2,
    dissent: 3,
    gap: 4,
  };
  return [...signals].sort(
    (a, b) =>
      (rank[a.kind] ?? 9) - (rank[b.kind] ?? 9) || a.id.localeCompare(b.id),
  );
}

function stripDoubleQuotes(value: string): string {
  return value.replace(/\"\"/g, '"');
}

function compact(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const cut = value.slice(0, limit);
  return `${cut.slice(0, Math.max(0, cut.lastIndexOf(" ")))}...`;
}

function ExhibitFor({
  visual,
  index,
  signalPacket,
  visualDatasets,
  meta,
  dark,
}: {
  visual: VisualOpportunity;
  index: number;
  signalPacket: EnterpriseSignalPacket;
  visualDatasets: Record<string, Array<Record<string, unknown>>>;
  meta?: string;
  dark?: boolean;
}) {
  const rows = visualDatasets[visual.dataset_ref];
  if (!rows || rows.length === 0) return null;
  return (
    <Exhibit
      index={index}
      visual={visual}
      signalPacket={signalPacket}
      meta={meta}
      dark={dark}
    >
      <ExhibitBars rows={rows} dark={dark} />
    </Exhibit>
  );
}

const readoutShellStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(280px,0.86fr) minmax(0,1.14fr)",
  gap: "clamp(18px,2.4vw,34px)",
  alignItems: "stretch",
  border: `1px solid ${V4.rule}`,
  borderTop: `5px solid ${V4.green}`,
  borderRadius: 10,
  background:
    "linear-gradient(120deg,rgba(255,255,255,0.94),rgba(245,241,235,0.72))",
  padding: "20px clamp(18px,2vw,26px)",
  boxShadow: "0 16px 36px rgba(12,26,58,0.045)",
} as const;

const readoutLeadStyle = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 18,
} as const;

const readoutTitleStyle = {
  margin: "8px 0 0",
  fontFamily: SERIF,
  fontSize: "clamp(22px,1.9vw,30px)",
  lineHeight: 1.14,
  letterSpacing: "-0.026em",
  fontWeight: 500,
  color: V4.ink,
} as const;

const readoutTextStyle = {
  margin: "10px 0 0",
  fontFamily: SANS,
  fontSize: 15,
  lineHeight: 1.58,
  color: V4.inkSoft,
  maxWidth: "62ch",
} as const;

const readoutMetaStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px 14px",
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: V4.slate,
} as const;

const readoutCardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,190px),1fr))",
  gap: 10,
} as const;

const readoutCardStyle = {
  minWidth: 0,
  border: `1px solid ${V4.rule}`,
  borderTop: "4px solid",
  borderRadius: 8,
  background: V4.surface,
  padding: "14px 15px 15px",
} as const;

const readoutCardTextStyle = {
  margin: "10px 0 0",
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.5,
  color: V4.inkSoft,
  textWrap: "pretty",
} as const;

const voiceStripStyle = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "minmax(260px,0.9fr) minmax(210px,0.42fr)",
  gap: "clamp(16px,2vw,28px)",
  borderTop: `1px solid ${V4.rule}`,
  paddingTop: 16,
} as const;

const voiceLeadStyle = {
  margin: "9px 0 0",
  fontFamily: SERIF,
  fontSize: "clamp(18px,1.5vw,23px)",
  lineHeight: 1.34,
  letterSpacing: "-0.018em",
  color: V4.ink,
  textWrap: "pretty",
} as const;

const voiceMetricGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
  gap: 1,
  border: `1px solid ${V4.rule}`,
  background: V4.rule,
} as const;

const voiceMetricStyle = {
  minWidth: 0,
  background: V4.surface,
  padding: "11px 12px",
  display: "grid",
  gap: 5,
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: V4.slate,
} as const;

const voiceQuoteGridStyle = {
  gridColumn: "1 / -1",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))",
  gap: 10,
} as const;

const voiceQuoteStyle = {
  margin: 0,
  borderLeft: `3px solid ${V4.amber}`,
  background: "rgba(186,117,23,0.045)",
  padding: "10px 12px",
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.48,
  color: V4.inkSoft,
} as const;
