"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

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
  sectionId,
} from "./TableSet";
import type { TableSpec } from "./page-tables";
import { RenewalTimeline } from "./RenewalTimeline";
import { cxoText, isGeneratorDeferral, launderChapter } from "./cxo-language";
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
  chapter: rawChapter,
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
  // One gate, at the top, before any of this chapter's text is drawn.
  const chapter = launderChapter(rawChapter);
  const bands = splitChapterIntoBands(chapter, signalPacket);
  const exhibits = chapter.visual_opportunities.filter((v) =>
    Boolean(visualDatasets[v.dataset_ref]),
  );
  const [lead, ...rest] = exhibits;

  // When the generator declined to write this chapter, the rows still answer it. Lead with the
  // strongest thing they say rather than with the generator's status.
  const deferred = isGeneratorDeferral(chapter.headline);
  const strongest = depth?.findings?.[0];
  const headline = deferred
    ? (strongest?.claim ??
      `${chapter.title} is not yet answered by this record.`)
    : chapter.headline;
  const standfirst = deferred
    ? strongest
      ? strongest.because
      : `Nothing in the loaded record speaks to this question yet. The chapters either side of it draw on families that are present; this one draws on families that are not, and that absence is reported here rather than filled.`
    : chapter.executive_synthesis;

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          [data-chapter-readout], [data-leadership-strip] { grid-template-columns: 1fr !important; }
          [data-leadership-metrics] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <DeclaredProvenance signalPacket={signalPacket} />
      <ChapterHeader
        eyebrowText={`Chapter ${String(chapterNumber).padStart(2, "0")} · ${chapter.title}`}
        guidingQuestion={chapter.guidingQuestion}
        headline={headline}
        standfirst={standfirst}
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
      {depth ? <ChapterSpine tables={depth.tables} /> : null}
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
  // Signals come from the packet, not the chapter, so they miss the chapter gate above.
  const leadershipSignals = leadershipSignalsForChapter(
    chapter,
    signalPacket,
  ).map((signal) => ({
    ...signal,
    statement: cxoText(signal.statement ?? ""),
  }));

  return (
    <section style={{ padding: `24px ${PAGE_X}px 0` }}>
      <div data-chapter-readout style={readoutShellStyle}>
        <div style={readoutLeadStyle}>
          <div>
            <h2 style={readoutTitleStyle}>Decision this page supports</h2>
            <p style={readoutTextStyle}>
              {primaryInference ??
                primaryRecord ??
                "No executive decision should be taken from this chapter yet."}
            </p>
          </div>
        </div>
        {primaryRecord || primaryExposure || primaryGap || primaryQuestion ? (
          <div style={readoutCardGridStyle}>
            {primaryRecord ? (
              <ReadoutCard
                label="Record signal"
                tone={V4.navy}
                value={primaryRecord}
              />
            ) : null}
            {(primaryExposure ?? primaryGap) ? (
              <ReadoutCard
                label="Exposure to watch"
                tone={primaryExposure ? V4.red : V4.amber}
                value={(primaryExposure ?? primaryGap) as string}
              />
            ) : null}
            {primaryQuestion ? (
              <ReadoutCard
                label="Question for the room"
                tone={V4.blue}
                value={primaryQuestion}
              />
            ) : null}
          </div>
        ) : null}
        {leadershipSignals.length > 0 ? (
          chapter.chapterId === "leadership_perspective" ? (
            <LeadershipVoiceFull signals={leadershipSignals} />
          ) : (
            <LeadershipVoiceStrip signals={leadershipSignals.slice(0, 4)} />
          )
        ) : null}
      </div>
    </section>
  );
}

/** The role that said it, taken from the sentence the packet built. */
function roleOf(signal: Signal): string {
  return /^A (.+?) said/.exec(signal.statement ?? "")?.[1] ?? "Unattributed";
}

/**
 * The words, separated from the sentence built around them.
 *
 * Grouped under the speaker's name, "A President & Chief Executive Officer said, on the theme of
 * X:" repeats what the heading above already says on every line. What is left is the quote and the
 * subject it was about.
 */
function excerptOf(signal: Signal): { quote: string; theme: string | null } {
  const statement = signal.statement ?? "";
  const theme = /on the theme of "([^"]+)"/.exec(statement)?.[1] ?? null;
  const quote = /:\s*"([\s\S]+)"\s*$/.exec(statement)?.[1];
  // The packet wraps an already-quoted phrase, so the capture can arrive with its own quote marks.
  const bare = (quote ?? stripDoubleQuotes(statement))
    .replace(/^"+|"+$/g, "")
    .trim();
  return { quote: bare, theme };
}

/**
 * Every excerpt on the chapter that exists to carry them, grouped by who spoke.
 *
 * The strip below shows a lead quote and two more, which is right on a chapter that mentions
 * leadership in passing. On this chapter it meant forty-four interviewed leaders were represented
 * by two quotes from one office.
 */
function LeadershipVoiceFull({ signals }: { signals: Signal[] }) {
  const testimony = signals.filter((signal) => signal.kind === "testimony");
  const themes = signals.filter(
    (signal) => signal.kind === "consensus" || signal.kind === "dissent",
  );
  const conflicts = signals.filter((signal) => signal.kind === "contradiction");
  const byRole = new Map<string, Signal[]>();
  for (const signal of testimony) {
    const role = roleOf(signal);
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role)!.push(signal);
  }
  const roles = [...byRole.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
  return (
    <div
      data-leadership-full
      style={{ display: "grid", gap: 22, marginTop: 20 }}
    >
      <div data-leadership-metrics style={voiceMetricGridStyle}>
        <VoiceMetric value={testimony.length} label="excerpts on the record" />
        <VoiceMetric value={roles.length} label="offices quoted" />
        <VoiceMetric value={themes.length} label="themes counted" />
        <VoiceMetric value={conflicts.length} label="record conflicts" />
      </div>
      {roles.map(([role, said]) => (
        <div key={role} style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.amber)}>{role}</span>
          <div style={{ display: "grid", gap: 10, marginTop: 9 }}>
            {said.map((signal) => {
              const { quote, theme } = excerptOf(signal);
              return (
                <blockquote key={signal.id} style={excerptStyle}>
                  <p style={{ margin: 0 }}>&ldquo;{quote}&rdquo;</p>
                  {theme ? (
                    <footer style={excerptThemeStyle}>on {theme}</footer>
                  ) : null}
                </blockquote>
              );
            })}
          </div>
        </div>
      ))}
      {themes.length > 0 ? (
        <div style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.slate)}>
            Counted across every recorded response
          </span>
          <div style={voiceQuoteGridStyle}>
            {themes.map((signal) => (
              <p key={signal.id} style={voiceQuoteStyle}>
                {stripDoubleQuotes(signal.statement)}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
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

/**
 * What this briefing is built from, said before anything it asserts.
 *
 * The synthetic-data disclosure currently travels as a context item -- filed among the client's own
 * evidence, counted as one of their governed facts, and read at the same weight as a finding about
 * their enterprise. It is the honest sentence on the page and it is in the wrong place.
 *
 * It is a declaration about the record, so it renders as one: at the head, in its own form, and
 * never counted as a finding.
 */
function DeclaredProvenance({
  signalPacket,
}: {
  signalPacket: EnterpriseSignalPacket;
}) {
  const items = (signalPacket.contextItems ?? []) as Array<{
    id?: string;
    statement?: string;
  }>;
  const declared = items.find(
    (item) =>
      typeof item.statement === "string" &&
      /not client-attested|synthetic assessment record/i.test(item.statement),
  );
  if (!declared?.statement) return null;
  return (
    <aside data-home-declared-provenance style={provenanceStyle}>
      <span style={{ ...eyebrow(V4.stone), fontSize: 10 }}>
        Declared provenance
      </span>
      <p style={provenanceTextStyle}>{cxoText(declared.statement)}</p>
    </aside>
  );
}

const provenanceStyle = {
  margin: `18px ${PAGE_X}px 0`,
  padding: "11px 0 12px",
  borderBottom: `1px solid ${V4.rule}`,
} as const;

const provenanceTextStyle = {
  margin: "5px 0 0",
  fontFamily: SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: V4.slate,
  maxWidth: "78ch",
} as const;

/**
 * The chapter's sections, pinned to the top of the scroll.
 *
 * The measured defect was not length -- it was that length had no landmarks. This answers "where am
 * I and how much is left" at any depth, which is the question a ten-screen chapter otherwise leaves
 * a reader to answer by scrolling.
 *
 * Renders nothing on a chapter with fewer than two sections: a spine over one destination is
 * furniture.
 */
function ChapterSpine({ tables }: { tables: TableSpec[] }) {
  const names: string[] = [];
  for (const table of tables) {
    if (table.section && !names.includes(table.section))
      names.push(table.section);
  }
  const [active, setActive] = useState<string | null>(names[0] ?? null);
  const key = names.join("|");

  // Which section the reader is actually in, not the one they last clicked. A spine that goes stale
  // on scroll answers "where am I" only until they move, which is the moment they ask.
  useEffect(() => {
    const sectionNames = key ? key.split("|") : [];
    if (sectionNames.length < 2) return;
    // Absent in jsdom and during server render; the spine simply keeps its opening selection.
    if (typeof IntersectionObserver === "undefined") return;
    const targets = sectionNames
      .map((name) => document.getElementById(sectionId(name)))
      .filter((node): node is HTMLElement => Boolean(node));
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        const id = visible?.target.id;
        if (!id) return;
        const match = sectionNames.find((name) => sectionId(name) === id);
        if (match) setActive(match);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );
    targets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [key]);

  if (names.length < 2) return null;
  return (
    <nav
      data-home-chapter-spine={names.length}
      aria-label="Sections in this chapter"
      style={spineStyle}
    >
      {names.map((name, index) => {
        const isActive = name === active;
        return (
          <a
            key={name}
            href={`#${sectionId(name)}`}
            aria-current={isActive ? "true" : undefined}
            data-home-spine-active={isActive ? "true" : undefined}
            onClick={() => setActive(name)}
            style={spineChipStyle(isActive)}
          >
            <span
              style={{ color: isActive ? "rgba(255,255,255,0.62)" : V4.stone }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>{" "}
            {name}
          </a>
        );
      })}
    </nav>
  );
}

const spineStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 5,
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "0 22px",
  alignItems: "baseline",
  margin: `26px ${PAGE_X}px 0`,
  padding: "11px 0",
  borderTop: `1px solid ${V4.rule}`,
  borderBottom: `1px solid ${V4.rule}`,
  background: V4.paper,
};

/**
 * The selected section lights up, the way Tower's chips and Source's tabs do.
 *
 * Tower fills its active chip with the pressure-card orange; that palette is Tower's own drift and
 * is not adopted here. The form is Tower's, the colour is this surface's reserved navy -- the same
 * value Source uses for an active tab.
 */
function spineChipStyle(active: boolean): CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    textDecoration: "none",
    padding: "5px 10px",
    borderRadius: 999,
    border: `1px solid ${active ? V4.navy : "transparent"}`,
    background: active ? V4.navy : "transparent",
    color: active ? "#ffffff" : V4.slate,
    whiteSpace: "nowrap",
  };
}

const excerptStyle = {
  margin: 0,
  padding: "0 0 0 14px",
  borderLeft: `2px solid ${V4.rule}`,
  fontFamily: SERIF,
  fontSize: 16.5,
  lineHeight: 1.42,
  color: V4.ink,
  maxWidth: "74ch",
} as const;

const excerptThemeStyle = {
  marginTop: 6,
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: V4.stone,
} as const;

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
  // The leadership chapter is checked first. Reaching the chapter-evidence branch below returned
  // whichever four signals its own claims happened to cite -- one office, on the chapter whose
  // whole subject is what forty-four leaders said.
  if (chapter.chapterId === "leadership_perspective") {
    return rankLeadershipSignals(
      signalPacket.signals.filter((signal) =>
        signal.domains.includes("ai_value_interview_evidence"),
      ),
    );
  }
  const direct = signalPacket.signals.filter(
    (signal) =>
      ids.has(signal.id) &&
      signal.domains.includes("ai_value_interview_evidence"),
  );
  if (direct.length > 0) return rankLeadershipSignals(direct).slice(0, 4);
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
