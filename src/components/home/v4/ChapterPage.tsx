"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import type {
  ChapterView,
  EnterpriseSignalPacket,
  GroundedClaim,
  Signal,
} from "@/lib/home/preview/types";
import {
  ChapterHeader,
  ExposuresBand,
  FollowsBand,
  NotEstablishedBand,
  QuestionsSection,
  RecordBand,
} from "./bands";
import { CockpitChartGrid } from "./CockpitChartGrid";
import { TechCockpit } from "./TechCockpit";
import { splitChapterIntoBands } from "./chapter-bands";
import {
  FindingsBlock,
  PageShape,
  TableSet,
  UnsupportedViews,
  sectionId,
} from "./TableSet";
import type { EstateRow, Finding, TableSpec } from "./page-tables";
import { DecisionQueue } from "./DecisionQueue";
import { MetricDistance } from "./MetricDistance";
import { RenewalTimeline } from "./RenewalTimeline";
import { cxoText, isGeneratorDeferral, launderChapter } from "./cxo-language";
import type { ChapterDepth } from "./chapter-page-content";
import { MONO, PAGE_X, SANS, SERIF, V4, bandHeading, eyebrow } from "./tokens";

export interface BriefingOpening {
  headline: string;
  standfirst: string;
  readoutHeading: string;
  readoutText: string;
  cards: Array<{
    label: string;
    tone: string;
    value: string;
  }>;
}

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
  depth,
  contracts,
  asOf,
  onOpenRows,
  metrics,
  queue,
  estate,
  briefingOpening,
}: {
  chapter: ChapterView;
  chapterNumber: number;
  signalPacket: EnterpriseSignalPacket;
  visualDatasets: Record<string, Array<Record<string, unknown>>>;
  /** Tables and findings computed from the estate rows in the bundle -- no model, no packet claim.
   * Absent, or empty, renders nothing: a chapter whose rows produce no table has no table set. */
  depth?: ChapterDepth;
  /** Vendor rows, where this chapter reads them. The timeline renders only when they are here. */
  contracts?: Array<Record<string, unknown>>;
  /** The record's own as-of date, so a past term end means past relative to the record. */
  asOf?: string;
  /** Opens the rows behind a finding in the record browser. */
  onOpenRows?: (objectType: string, filter: string) => void;
  /** Outcome measures, where this chapter reasons from them. */
  metrics?: EstateRow[];
  /** The families a decision queue is assembled from, on the chapter that asks for one. */
  queue?: {
    risks?: EstateRow[];
    programs?: EstateRow[];
    contracts?: EstateRow[];
  };
  /** The technology estate the cross-dimensional cockpit pivots over, passed only on the chapter
   * that renders it. Every row is a canonical application/vendor record the bundle already carries;
   * the pivot re-projects them and invents nothing. Absent elsewhere, so the cockpit draws on no
   * other chapter. */
  estate?: {
    applications?: EstateRow[];
    vendors?: EstateRow[];
    dataAssetCount?: number;
  };
  /**
   * Briefing chapters answer an enterprise-orientation question. They should never promote a
   * specialist finding into the opening simply because authored claims are absent.
   */
  briefingOpening?: BriefingOpening;
}) {
  // One gate, at the top, before any of this chapter's text is drawn.
  const chapter = launderChapter(rawChapter);
  const bands = splitChapterIntoBands(chapter, signalPacket);
  const exhibits = chapter.visual_opportunities.filter((v) =>
    Boolean(visualDatasets[v.dataset_ref]),
  );
  // The Technology & Data chapter is dense enough to explore, not only read: it swaps the exhibit
  // grid for the cross-dimensional estate cockpit. Every other chapter renders its generator-proposed
  // exhibits as a responsive dashboard grid.
  const isTechChapter = chapter.chapterId === "technology_data";

  // When the generator declined to write this chapter, the rows still answer it. Lead with the
  // strongest thing they say rather than with the generator's status.
  const deferred = isGeneratorDeferral(chapter.headline);
  const strongest = depth?.findings?.[0];
  const headline = briefingOpening
    ? briefingOpening.headline
    : deferred
      ? (strongest?.claim ??
        `${chapter.title} is not yet answered by this record.`)
      : chapter.headline;
  const standfirst = briefingOpening
    ? briefingOpening.standfirst
    : deferred
      ? strongest
        ? strongest.because
        : `Nothing in the loaded record speaks to this question yet. The chapters either side of it draw on families that are present; this one draws on families that are not, and that absence is reported here rather than filled.`
      : chapter.executive_synthesis;

  // The cockpit reading order. The gate above is unchanged -- this reorganises what a drafted
  // chapter LOOKS like, not when it is drawn: a compact header, an executive readout, a KPI rail
  // counted from the rows, the governed exhibits, the deterministic evidence the rows support, and
  // a tabbed narrative that swaps the authored bands in place instead of stacking them down a scroll.
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
        // On a drafted chapter the synthesis moves into the Insights tab, where it flows across the
        // full canvas. A briefing chapter has no tab workspace, so its standfirst stays in the head.
        standfirst={briefingOpening ? standfirst : undefined}
      />

      {briefingOpening ? (
        <BriefingExecutiveReadout opening={briefingOpening} />
      ) : (
        <ChapterExecutiveReadout
          chapter={chapter}
          bands={bands}
          signalPacket={signalPacket}
          depth={depth}
        />
      )}

      {/* The KPI rail. Every number is counted from the props already on this chapter -- the
          deterministic depth, the band split, the vendor/metric/queue rows. A tile whose number
          cannot be derived without inventing one is omitted, never filled with a placeholder. */}
      <CockpitKpiRail
        tiles={deriveChapterKpis({
          bands,
          depth,
          contracts,
          metrics,
          queue,
          estate,
          signalPacket,
        })}
      />

      {/* The exhibits, through the governed chart path: every bar is a value the deterministic dataset
          already carries, and the model supplies no plotted figure. The Technology & Data chapter
          reads its estate as an interactive pivot instead -- same governance, denser evidence. */}
      {isTechChapter ? (
        <TechCockpit
          applications={estate?.applications}
          vendors={estate?.vendors}
          dataAssetCount={estate?.dataAssetCount}
          onOpenRows={onOpenRows}
        />
      ) : (
        <CockpitChartGrid
          visuals={exhibits}
          signalPacket={signalPacket}
          visualDatasets={visualDatasets}
        />
      )}

      {/* The deterministic evidence stays visible rather than hidden behind a tab: the findings a
          reader must act on, the tables the rows support, and the honesty markers for what the rows
          cannot say are governance affordances, and a governance affordance a reader has to go
          looking for is one they will not find. */}
      {depth ? (
        <PageShape
          tables={depth.tables}
          findings={depth.findings}
          unsupported={depth.unsupported}
        />
      ) : null}
      {queue ? (
        <DecisionQueue
          risks={queue.risks}
          programs={queue.programs}
          contracts={queue.contracts}
          asOf={asOf}
          onOpenRows={onOpenRows}
        />
      ) : null}
      {depth ? <ChapterSpine tables={depth.tables} /> : null}
      {depth ? <TableSet tables={depth.tables} /> : null}
      {contracts && contracts.length > 0 ? (
        <RenewalTimeline contracts={contracts} asOf={asOf} />
      ) : null}
      <MetricDistance metrics={metrics} />
      {depth ? (
        <FindingsBlock findings={depth.findings} onOpenRows={onOpenRows} />
      ) : null}
      {depth ? <UnsupportedViews views={depth.unsupported} /> : null}

      {/* The authored narrative, tabbed. A briefing chapter answers its question through the
          readout above and carries no band workspace. */}
      {briefingOpening ? null : (
        <CockpitNarrative
          synthesis={standfirst}
          bands={bands}
          signalPacket={signalPacket}
        />
      )}

      {!briefingOpening && bands.filledBandCount === 0 ? (
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

      {/* Industry context: the sector lenses the record carries, shown once, on the chapter that
          orients a new executive. It is kept to this chapter deliberately -- the same orientation
          repeated down every chapter is clutter, and the content is qualitative, so it sits after
          the counted evidence and names, in words, that it is not a benchmark. The band renders
          nothing when the record carries no lens. */}
      {chapter.chapterId === "executive_brief" ? (
        <IndustryContextSection signalPacket={signalPacket} />
      ) : null}
    </>
  );
}

/** One KPI tile: a number counted from the chapter's props, and the prose that names it. */
interface KpiTile {
  value: string;
  label: string;
  /** Reserved tones only: risk is the red the register spends on severity, absence is the amber
   * for what the record does not carry. A plain count takes neither. */
  tone?: "risk" | "absence" | "blue";
}

/**
 * The KPI rail's numbers, every one counted from props the chapter already holds.
 *
 * Nothing here is authored or estimated: counts come from the deterministic depth (the findings and
 * tables the rows produced), the band split, and the vendor/metric/queue row sets the caller passed.
 * A tile whose number is not derivable without inventing it is not emitted -- the alternative, a
 * hardcoded figure, is the one thing a governed surface must never put behind a big numeral. The
 * rail is capped so it reads as a rail and not a table; the order puts what a reader acts on first.
 */
function deriveChapterKpis({
  bands,
  depth,
  contracts,
  metrics,
  queue,
  estate,
  signalPacket,
}: {
  bands: ReturnType<typeof splitChapterIntoBands>;
  depth?: ChapterDepth;
  contracts?: Array<Record<string, unknown>>;
  metrics?: EstateRow[];
  queue?: {
    risks?: EstateRow[];
    programs?: EstateRow[];
    contracts?: EstateRow[];
  };
  /** Estate scale the chapter already carries. On a briefing/prose chapter -- one with no
   * deterministic depth -- these counted estate figures lead the rail instead of the provenance
   * counts below, so the opening numbers are about the enterprise, not the evidence bookkeeping.
   * Every value is the length of a governed estate row set the bundle already holds. */
  estate?: {
    applications?: EstateRow[];
    vendors?: EstateRow[];
    dataAssetCount?: number;
  };
  signalPacket: EnterpriseSignalPacket;
}): KpiTile[] {
  const n = (value: number) => value.toLocaleString();
  const exposureCount = depth
    ? depth.findings.filter((finding) => finding.kind === "exposure").length
    : 0;
  const candidates: Array<KpiTile | null> = [
    exposureCount > 0
      ? {
          value: n(exposureCount),
          label:
            exposureCount === 1
              ? "exposure the record rates as wrong now"
              : "exposures the record rates as wrong now",
          tone: "risk",
        }
      : null,
    queue?.risks
      ? { value: n(queue.risks.length), label: "risk entries in the register" }
      : null,
    queue?.programs
      ? { value: n(queue.programs.length), label: "programs in view" }
      : null,
    contracts && contracts.length > 0
      ? { value: n(contracts.length), label: "vendor contracts in view" }
      : null,
    metrics && metrics.length > 0
      ? { value: n(metrics.length), label: "measures tracked" }
      : null,
    bands.record.length > 0
      ? { value: n(bands.record.length), label: "counted from the record" }
      : null,
    depth && depth.tables.length > 0
      ? {
          value: n(depth.tables.length),
          label:
            depth.tables.length === 1 ? "evidence table" : "evidence tables",
        }
      : null,
    depth && depth.findings.length > 0
      ? {
          value: n(depth.findings.length),
          label:
            depth.findings.length === 1
              ? "finding in the evidence"
              : "findings in the evidence",
        }
      : null,
    depth && depth.unsupported.length > 0
      ? {
          value: n(depth.unsupported.length),
          label:
            depth.unsupported.length === 1
              ? "evidence view pending"
              : "evidence views pending",
          tone: "absence",
        }
      : null,
    bands.questions.length > 0
      ? {
          value: n(bands.questions.length),
          label: "questions for the room",
          tone: "blue",
        }
      : null,
    // Estate scale, where this chapter carries it. On a chapter with deterministic depth the depth
    // tiles above already fill the rail, so these surface on the briefing/prose chapters -- which is
    // exactly where the opening numbers should be the enterprise's scale, not the evidence count.
    estate?.applications && estate.applications.length > 0
      ? {
          value: n(estate.applications.length),
          label:
            estate.applications.length === 1
              ? "application in the estate"
              : "applications in the estate",
        }
      : null,
    estate?.vendors && estate.vendors.length > 0
      ? {
          value: n(estate.vendors.length),
          label:
            estate.vendors.length === 1
              ? "vendor in the estate"
              : "vendors in the estate",
        }
      : null,
    typeof estate?.dataAssetCount === "number" && estate.dataAssetCount > 0
      ? {
          value: n(estate.dataAssetCount),
          label: "data & integration records",
        }
      : null,
    // Prose and briefing chapters carry no depth; the record's own scale is still a counted fact.
    // These stay as the last resort, below the estate scale, for a chapter that carries no estate.
    {
      value: n(signalPacket.signals?.length ?? 0),
      label: "signals on the record",
    },
    {
      value: n(signalPacket.contextItems?.length ?? 0),
      label: "governed facts",
    },
  ];
  return candidates
    .filter((tile): tile is KpiTile => tile !== null)
    .slice(0, 5);
}

function kpiNumberColor(tone: KpiTile["tone"]): string {
  if (tone === "risk") return V4.red;
  if (tone === "absence") return V4.amber;
  if (tone === "blue") return V4.blue;
  return V4.navy;
}

/**
 * The rail: a row of big-number tiles, serif numerals over mono labels, on the connected-strip
 * treatment the design uses for a counts band. Renders nothing when no tile is derivable, because
 * an empty rail reads as a load that failed rather than as a chapter with nothing to count.
 */
function CockpitKpiRail({ tiles }: { tiles: KpiTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <section
      data-home-kpi-rail={tiles.length}
      style={{ padding: `22px ${PAGE_X}px 0` }}
    >
      <div style={kpiRailGridStyle}>
        {tiles.map((tile) => (
          <div key={tile.label} style={kpiTileStyle}>
            <div
              style={{ ...kpiNumberStyle, color: kpiNumberColor(tile.tone) }}
            >
              {tile.value}
            </div>
            <div style={kpiLabelStyle}>{tile.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const kpiRailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))",
  gap: 1,
  background: V4.ruleSoft,
  border: `1px solid ${V4.ruleSoft}`,
} as const;

const kpiTileStyle = {
  background: V4.paper,
  padding: "14px clamp(12px,1.3vw,18px) 13px",
  minWidth: 0,
} as const;

const kpiNumberStyle = {
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: "clamp(20px,2.1vw,27px)",
  lineHeight: 1,
  letterSpacing: "-0.025em",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap" as const,
} as const;

const kpiLabelStyle = {
  marginTop: 8,
  fontFamily: MONO,
  fontSize: 10.5,
  lineHeight: 1.35,
  letterSpacing: "0.02em",
  color: V4.slate,
} as const;

type NarrativeTabKey = "insights" | "open-items" | "watch" | "questions";

/**
 * The authored bands, organised into a tabbed workspace that swaps one view in for another in
 * place of the long vertical stack they used to form.
 *
 * The bands themselves are reused unchanged -- each still states its own epistemic status by which
 * band it is, names its sources, and treats absence as a finding. A tab appears only when its band
 * carries something, so an empty tab never offers a reader a view with nothing behind it. Insights
 * leads with the synthesis, flowed across the full canvas in reading-width columns rather than
 * stacked in one tall measure.
 *
 * Every panel is in the DOM; the inactive ones are hidden. Nothing a reader relies on -- a source
 * line, a not-established note, a question's rubric -- is removed by switching tabs, only the view.
 */
function CockpitNarrative({
  synthesis,
  bands,
  signalPacket,
}: {
  synthesis?: string;
  bands: ReturnType<typeof splitChapterIntoBands>;
  signalPacket: EnterpriseSignalPacket;
}) {
  const insightsCount = bands.record.length + bands.follows.length;
  const hasSynthesis = Boolean(synthesis && synthesis.trim().length > 0);
  const tabs: Array<{ key: NarrativeTabKey; label: string; count: number }> = [
    insightsCount > 0 || hasSynthesis
      ? { key: "insights", label: "Insights", count: insightsCount }
      : null,
    bands.exposures.length > 0
      ? {
          key: "open-items",
          label: "Open items",
          count: bands.exposures.length,
        }
      : null,
    bands.gaps.length > 0
      ? { key: "watch", label: "Watch", count: bands.gaps.length }
      : null,
    bands.questions.length > 0
      ? { key: "questions", label: "Questions", count: bands.questions.length }
      : null,
  ].filter(
    (tab): tab is { key: NarrativeTabKey; label: string; count: number } =>
      tab !== null,
  );

  const [active, setActive] = useState<NarrativeTabKey>(
    tabs[0]?.key ?? "insights",
  );
  if (tabs.length === 0) return null;
  // A band can empty out between renders; fall back to the first available tab rather than show a
  // panel for a tab that no longer exists.
  const current = tabs.some((tab) => tab.key === active) ? active : tabs[0].key;

  return (
    <section data-home-cockpit-workspace style={{ margin: "32px 0 0" }}>
      <div role="tablist" aria-label="Chapter narrative" style={tabListStyle}>
        {tabs.map((tab) => {
          const isActive = tab.key === current;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-home-cockpit-tab={tab.key}
              onClick={() => setActive(tab.key)}
              style={tabButtonStyle(isActive)}
            >
              {tab.label}
              <span style={tabCountStyle}>{tab.count}</span>
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => {
        const isActive = tab.key === current;
        return (
          <div
            key={tab.key}
            role="tabpanel"
            data-home-cockpit-panel={tab.key}
            hidden={!isActive}
            style={{ display: isActive ? undefined : "none", paddingTop: 4 }}
          >
            {tab.key === "insights" ? (
              <>
                {hasSynthesis ? (
                  <p data-home-cockpit-synthesis style={synthesisStyle}>
                    {synthesis}
                  </p>
                ) : null}
                <RecordBand claims={bands.record} signalPacket={signalPacket} />
                <FollowsBand
                  claims={bands.follows}
                  signalPacket={signalPacket}
                />
              </>
            ) : null}
            {tab.key === "open-items" ? (
              <ExposuresBand
                claims={bands.exposures}
                signalPacket={signalPacket}
              />
            ) : null}
            {tab.key === "watch" ? (
              <NotEstablishedBand gaps={bands.gaps} />
            ) : null}
            {tab.key === "questions" ? (
              <QuestionsSection questions={bands.questions} />
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

const tabListStyle = {
  display: "flex",
  gap: 2,
  flexWrap: "nowrap" as const,
  overflowX: "auto" as const,
  borderBottom: `1px solid ${V4.rule}`,
  padding: `0 ${PAGE_X}px`,
} as const;

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    font: "inherit",
    fontFamily: SANS,
    fontSize: 13,
    fontWeight: 600,
    color: active ? V4.navy : V4.slate,
    background: "none",
    border: 0,
    borderBottom: `2px solid ${active ? V4.navy : "transparent"}`,
    padding: "11px 13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "baseline",
    gap: 5,
  };
}

const tabCountStyle = {
  fontFamily: MONO,
  fontSize: 10,
  color: V4.stone,
} as const;

/**
 * The synthesis, flowed across the whole canvas in reading-width columns.
 *
 * The explicit correction this answers: a synthesis set in one ~72ch measure runs as a tall thin
 * ribbon down a wide page. `column-width` lays it into as many columns of this width as the canvas
 * holds -- two on a wide screen, one when narrow -- so the prose uses the width it has been given
 * without any line growing past a readable measure.
 */
const synthesisStyle = {
  margin: `20px ${PAGE_X}px 0`,
  columnWidth: "34rem",
  columnGap: "clamp(28px,3.5vw,56px)",
  fontFamily: SANS,
  fontSize: 16,
  lineHeight: 1.62,
  color: V4.inkSoft,
  textWrap: "pretty" as const,
} as const;

/**
 * The analytical lenses the record carries, grouped by the kind it files them under.
 *
 * This is qualitative sector orientation for a new executive -- the patterns and expert lenses used
 * to read a payer-provider like this one. It is NOT this enterprise's attested fact and it is NOT a
 * peer benchmark: nothing here says how this enterprise compares to anyone, and the record holds no
 * competitor or peer figure to compare against. The record carries each lens as a label under a
 * kind, and that -- the label and the kind -- is all this section shows. It states no number, no
 * applicability it was not given, and no business-versus-technology column, because none of that is
 * in the record and inventing it is the model supplying a fact. The grouping is the record's own
 * `kind`; the lens content itself already spans business and technology, so both are present without
 * a fabricated split.
 *
 * The raw `kind` is a machine token (e.g. the underscore-joined identifier the record stores). It
 * never reaches the reader: every heading and tag is a human label, so a client surface carries no
 * machine vocabulary. A kind the dictionary does not name is still shown, under a label derived from
 * it, so no lens the record carries is ever silently dropped.
 */
type IndustryLens = { kind: string; label: string };

const INDUSTRY_LENS_GROUPS: ReadonlyArray<{
  kind: string;
  heading: string;
  tag: string;
}> = [
  {
    kind: "industry_pattern",
    heading: "Industry patterns",
    tag: "Industry pattern",
  },
  { kind: "expert_lens", heading: "Expert lenses", tag: "Expert lens" },
];

/** A kind the dictionary does not name, rendered as a human label and never as the raw token -- a
 * machine identifier on a client surface is the one thing the vocabulary gate reads for. */
function humanizeLensKind(kind: string): string {
  const words = kind.split(/[_\s]+/).filter(Boolean);
  if (words.length === 0) return "Lens";
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}

/** The lenses on the packet, kept to the two fields the record actually carries. The field is read
 * off the packet the same way the business briefing reads it: it rides on the serialized record and
 * is absent on a record that predates it, in which case this section does not render at all. */
function readAnalyticalLenses(
  signalPacket: EnterpriseSignalPacket,
): IndustryLens[] {
  const raw =
    (signalPacket as { analyticalLenses?: Array<Partial<IndustryLens>> })
      .analyticalLenses ?? [];
  return raw.filter(
    (lens): lens is IndustryLens =>
      Boolean(lens) &&
      typeof lens.kind === "string" &&
      lens.kind.trim().length > 0 &&
      typeof lens.label === "string" &&
      lens.label.trim().length > 0,
  );
}

function IndustryContextSection({
  signalPacket,
}: {
  signalPacket: EnterpriseSignalPacket;
}) {
  const lenses = readAnalyticalLenses(signalPacket);
  if (lenses.length === 0) return null;

  // Group by the record's own kind: the dictionary kinds first, in their stated order, then any kind
  // the dictionary does not name, in first-seen order. Nothing the record carries is dropped.
  const order: string[] = [];
  const seen = new Set<string>();
  const remember = (kind: string) => {
    if (!seen.has(kind)) {
      seen.add(kind);
      order.push(kind);
    }
  };
  for (const group of INDUSTRY_LENS_GROUPS) {
    if (lenses.some((lens) => lens.kind === group.kind)) remember(group.kind);
  }
  for (const lens of lenses) remember(lens.kind);
  const groups = order.map((kind) => {
    const known = INDUSTRY_LENS_GROUPS.find((group) => group.kind === kind);
    return {
      kind,
      heading: known?.heading ?? humanizeLensKind(kind),
      tag: known?.tag ?? humanizeLensKind(kind),
      items: lenses.filter((lens) => lens.kind === kind),
    };
  });

  return (
    <section
      data-home-industry-context={lenses.length}
      style={{ padding: `0 ${PAGE_X}px`, margin: "58px 0 0" }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <h2 style={bandHeading(V4.ink)}>Industry context</h2>
        <span style={{ flex: 1, height: 1, background: V4.rule }} />
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontFamily: SANS,
          fontSize: 14,
          lineHeight: 1.55,
          color: V4.slate,
          maxWidth: "58ch",
        }}
      >
        The forces shaping payer-providers like this one.
      </p>

      {/* The absence stated in words before any pattern is shown: patterns beside an enterprise's own
          figures read as a comparison, and the record holds none. The same discipline the
          perspective layer keeps, so the layout cannot assert what the record does not. */}
      <aside
        data-home-industry-provenance
        style={{
          margin: "16px 0 0",
          borderTop: `1px solid ${V4.rule}`,
          borderBottom: `1px solid ${V4.rule}`,
          padding: "13px 0",
        }}
      >
        <span style={{ ...eyebrow(V4.amber), fontSize: 10 }}>
          How to read this
        </span>
        <p
          style={{
            margin: "6px 0 0",
            fontFamily: SANS,
            fontSize: 13.5,
            lineHeight: 1.55,
            color: V4.inkSoft,
            maxWidth: "80ch",
          }}
        >
          Analytical lenses and sector patterns the record carries as
          qualitative orientation &mdash; not this enterprise&apos;s attested
          facts, and not a peer benchmark. Nothing here says how this enterprise
          compares to anyone; the record holds no competitor or peer figure.
          Each lens is shown as the record holds it: a short label, under the
          kind it is filed under.
        </p>
      </aside>

      <div style={{ display: "grid", gap: 26, marginTop: 24 }}>
        {groups.map((group) => (
          <div key={group.kind} style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <span style={eyebrow(V4.slate)}>{group.heading}</span>
              <span
                style={{ fontFamily: MONO, fontSize: 10.5, color: V4.stone }}
              >
                {group.items.length}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gap: 1,
                background: V4.rule,
                border: `1px solid ${V4.rule}`,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {group.items.map((lens, index) => (
                <div
                  key={`${group.kind}-${index}-${lens.label}`}
                  data-home-industry-row={group.kind}
                  style={{
                    background: V4.surface,
                    padding: "13px 16px",
                  }}
                >
                  {/* The group heading and its count already name the kind; a per-row kind tag
                      repeated down every row of the group is noise, so the row carries only the
                      lens label (same decluttering the leadership spread made). */}
                  <p
                    style={{
                      margin: 0,
                      fontFamily: SANS,
                      fontSize: 15,
                      lineHeight: 1.5,
                      color: V4.ink,
                      maxWidth: "76ch",
                      textWrap: "pretty",
                    }}
                  >
                    {lens.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BriefingExecutiveReadout({ opening }: { opening: BriefingOpening }) {
  return (
    <section style={{ padding: `24px ${PAGE_X}px 0` }}>
      <div data-home-briefing-opening style={readoutShellStyle}>
        <div style={readoutLeadStyle}>
          <div>
            <h2 style={readoutTitleStyle}>{opening.readoutHeading}</h2>
            <p style={readoutTextStyle}>{opening.readoutText}</p>
          </div>
        </div>
        <div style={readoutCardGridStyle}>
          {opening.cards.map((card) => (
            <ReadoutCard
              key={card.label}
              label={card.label}
              tone={card.tone}
              value={card.value}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ChapterExecutiveReadout({
  chapter,
  bands,
  signalPacket,
  depth,
}: {
  chapter: ChapterView;
  bands: ReturnType<typeof splitChapterIntoBands>;
  signalPacket: EnterpriseSignalPacket;
  depth?: ChapterDepth;
}) {
  const primaryRecord = firstStatement(bands.record);
  const primaryInference = firstStatement(bands.follows);
  const primaryExposure = firstStatement(bands.exposures);
  const primaryQuestion = chapter.questions_to_ask[0];
  // The readout is named after the band its sentence came from.
  //
  // The heading was fixed at "Decision this page supports" over `primaryInference ?? primaryRecord`,
  // and neither of those is a decision. `follows` holds interpretation -- the band beneath it is
  // titled "What follows from it" -- and `record` holds a counted fact. So on a chapter with an
  // interpretation the heading over-promised, and on a chapter without one it promised a decision
  // over an excerpt.
  //
  // Nothing in this record declares a decision. Writing one is authored advice about a client's
  // situation, and inventing a heading for it is how the page ends up asserting judgement it does
  // not have. Until a decision is declared or authored, the readout says what it is.
  // Which band opens the chapter, decided by where the chapter's weight actually is.
  //
  // Taking the interpretation whenever one exists skipped past four counted findings on the
  // leadership chapter -- "all 44 interviewed leaders raised value realisation as a concern" -- to
  // reach a lone cross-domain remark about the programme portfolio. The chapter's strongest
  // material was passed over precisely because it was well enough evidenced to be classed as fact.
  //
  // So interpretation leads only where it outnumbers the record. On a tie the record leads: a page
  // whose whole claim is that it does not assert more than its evidence should open with the
  // evidence when the two are level.
  const leadWithInference =
    Boolean(primaryInference) && bands.follows.length > bands.record.length;
  const readout = leadWithInference
    ? { heading: "What follows from it", statement: primaryInference! }
    : primaryRecord
      ? { heading: "What the record shows", statement: primaryRecord }
      : primaryInference
        ? { heading: "What follows from it", statement: primaryInference }
        : {
            heading: "Nothing established here yet",
            statement:
              "No executive decision should be taken from this chapter yet.",
          };
  const primaryGap = chapter.limitations[0];
  // Signals come from the packet, not the chapter, so they miss the chapter gate above.
  const leadershipSignals = leadershipSignalsForChapter(
    chapter,
    signalPacket,
  ).map((signal) => ({
    ...signal,
    statement: cxoText(signal.statement ?? ""),
  }));
  const leadershipEvidenceNotice =
    chapter.chapterId === "leadership_perspective"
      ? leadershipBasisNotice(depth?.findings)
      : null;

  return (
    <section style={{ padding: `24px ${PAGE_X}px 0` }}>
      <div data-chapter-readout style={readoutShellStyle}>
        <div style={readoutLeadStyle}>
          <div>
            {/* The heading follows the sentence, never the other way round.
             *
             * It used to read "Decision this page supports" over `primaryInference ?? primaryRecord`
             * -- so a chapter with no inference put a plain statement of record under a heading
             * promising a decision. A reader takes the heading as the claim about what they are
             * reading, and on most chapters that claim was wrong: the body was an excerpt.
             *
             * Naming both cases keeps the decision framing where a decision exists, which a blanket
             * rename would lose. The sentence is drawn from a band, so the heading is that band's
             * own name -- a reader who scrolls to it finds the label they were given.
             */}
            <h2 style={readoutTitleStyle}>{readout.heading}</h2>
            <p style={readoutTextStyle}>{readout.statement}</p>
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
        {leadershipEvidenceNotice ? (
          <LeadershipEvidenceNotice text={leadershipEvidenceNotice} />
        ) : null}
        {/* On chapters that mention leadership in passing the strip stays inside the readout card: a
            lead quote and two more is the right weight there. */}
        {leadershipSignals.length > 0 &&
        chapter.chapterId !== "leadership_perspective" ? (
          <LeadershipVoiceStrip signals={leadershipSignals.slice(0, 4)} />
        ) : null}
      </div>
      {/* The leadership chapter -- the one whose whole subject is what the interviewed leaders said --
          earns a full-width editorial spread set BELOW the readout card, not boxed inside its narrow
          column. It answers the chapter's own question: who was on the record, what the interviews
          converged on, where a single voice stood apart, and where testimony and the system of record
          disagree. */}
      {leadershipSignals.length > 0 &&
      chapter.chapterId === "leadership_perspective" ? (
        <LeadershipVoiceFull signals={leadershipSignals} />
      ) : null}
    </section>
  );
}

function leadershipBasisNotice(findings: Finding[] | undefined): string | null {
  const basis = findings?.find((finding) =>
    /interview responses are modelled|modelled rather than transcribed/i.test(
      finding.claim,
    ),
  );
  if (!basis) return null;
  return `${basis.claim} Read the leadership chapter for patterns and named concerns; do not treat modelled responses as verbatim testimony.`;
}

function LeadershipEvidenceNotice({ text }: { text: string }) {
  return (
    <aside data-leadership-basis-note style={leadershipBasisNoticeStyle}>
      <span style={{ ...eyebrow(V4.amber), fontSize: 10 }}>
        Interview basis
      </span>
      <p style={leadershipBasisNoticeTextStyle}>{text}</p>
    </aside>
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

interface ConsensusStat {
  theme: string;
  raised: number;
  of: number;
}

/** Consensus and dissent arrive as `"<theme>" was raised by N of M interviewed leaders ...`. The
 * theme and the count are the whole of what the sentence says; the rest repeats down the list. Pull
 * the two out so the layout can rank and lead with them. Returns null on a sentence that does not
 * carry a count, so a shape the packet changes later is dropped rather than rendered half-parsed. */
function consensusStatOf(signal: Signal): ConsensusStat | null {
  const statement = signal.statement ?? "";
  const theme = /^"([^"]+)"/.exec(statement)?.[1];
  const count = /raised by (\d+) of (\d+)/.exec(statement);
  if (!theme || !count) return null;
  return { theme, raised: Number(count[1]), of: Number(count[2]) };
}

/** A dissent sentence names its theme the same way but states no denominator ("raised by exactly
 * one interviewed leader"), so only the theme is pulled. */
function dissentThemeOf(signal: Signal): string | null {
  return /^"([^"]+)"/.exec(signal.statement ?? "")?.[1] ?? null;
}

/** The contradiction count, as the `<n> of <m>` the sentence opens with. */
function conflictStatOf(signal: Signal): { raised: number; of: number } | null {
  const m = /^(\d+) of (\d+)/.exec(signal.statement ?? "");
  return m ? { raised: Number(m[1]), of: Number(m[2]) } : null;
}

/** Short acronyms that stay upper-case when a machine token is rendered as words. */
const THEME_ACRONYMS = new Set(["ai", "ml", "kpi", "roi", "ehr", "erp"]);

/** A machine theme token off the interview packet ("value_realisation") rendered as words. An
 * underscore identifier is machine vocabulary, the one thing a client surface must not show, and the
 * leadership footer used to print it verbatim. */
function humanizeTheme(raw: string): string {
  const words = raw.split(/[_\s-]+/).filter(Boolean);
  if (words.length === 0) return raw.trim();
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (THEME_ACRONYMS.has(lower)) return lower.toUpperCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

/**
 * The leadership chapter's full voice, as an editorial spread rather than a boxed list.
 *
 * The strip (used where a chapter mentions leadership in passing) shows a lead quote and two more.
 * On THIS chapter -- the one whose whole subject is what the interviewed leaders said -- that
 * collapsed five offices and sixteen counted themes into two quotes from one office. The full view
 * answers the chapter's own question in order of weight: what the interviews converged on, where a
 * single voice stood apart, where testimony and the system of record disagree, and then every office
 * on the record in its own words.
 *
 * Nothing here is authored. The quote, the office and the theme are parsed from the sentence the
 * packet already built; the agreement, dissent and conflict counts are the ones the packet states; a
 * machine theme token is rendered as words so no underscore identifier reaches the surface. The
 * layout ranks and sizes this material -- it adds none of it. Red and amber stay reserved: a
 * contradiction is a counted discrepancy, not a register severity, so it is shown in the counted
 * (navy) treatment, never in red.
 */
function LeadershipVoiceFull({ signals }: { signals: Signal[] }) {
  const testimony = signals.filter((signal) => signal.kind === "testimony");
  const consensus = signals
    .filter((signal) => signal.kind === "consensus")
    .map(consensusStatOf)
    .filter((stat): stat is ConsensusStat => stat !== null)
    .sort((a, b) => b.raised / b.of - a.raised / a.of || b.raised - a.raised);
  const dissent = signals
    .filter((signal) => signal.kind === "dissent")
    .map(dissentThemeOf)
    .filter((theme): theme is string => Boolean(theme));
  const conflicts = signals.filter((signal) => signal.kind === "contradiction");
  // The metric has always counted consensus and dissent together as "themes"; keep that total.
  const themeCount = consensus.length + dissent.length;

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
    <div data-leadership-full style={voiceFullStyle}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <span style={eyebrow(V4.navy)}>Leadership voice</span>
        <span style={{ flex: 1, height: 1, background: V4.rule }} />
      </div>

      <div data-leadership-metrics style={voiceScaleGridStyle}>
        <VoiceMetric value={testimony.length} label="excerpts on the record" />
        <VoiceMetric value={roles.length} label="offices quoted" />
        <VoiceMetric value={themeCount} label="themes counted" />
        <VoiceMetric value={conflicts.length} label="record conflicts" />
      </div>

      {consensus.length > 0 ? (
        <div style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.navy)}>Where the interviews converged</span>
          <p style={voiceSectionNoteStyle}>
            Each theme by how many of the interviewed leaders raised it, counted
            by office across the full set &mdash; strongest agreement first.
          </p>
          <div style={consensusGridStyle}>
            {consensus.map((stat) => (
              <div key={stat.theme} style={consensusRowStyle}>
                <span style={consensusThemeStyle}>
                  {humanizeTheme(stat.theme)}
                </span>
                <span style={consensusCountStyle}>
                  <strong style={consensusCountNumberStyle}>
                    {stat.raised}
                  </strong>
                  <span style={consensusCountOfStyle}>of {stat.of}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {dissent.length > 0 || conflicts.length > 0 ? (
        <div style={counterpointRowStyle}>
          {dissent.length > 0 ? (
            <div style={counterpointCardStyle}>
              <span style={eyebrow(V4.slate)}>Raised by a single leader</span>
              <p style={voiceSectionNoteStyle}>
                A minority view with no corroboration elsewhere in the interview
                set.
              </p>
              <div style={dissentTagWrapStyle}>
                {dissent.map((theme) => (
                  <span key={theme} style={dissentTagStyle}>
                    {humanizeTheme(theme)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {conflicts.map((signal) => {
            const stat = conflictStatOf(signal);
            return (
              <div key={signal.id} style={counterpointCardStyle}>
                <span style={eyebrow(V4.navy)}>Testimony against the record</span>
                {stat ? (
                  <p style={conflictStatLineStyle}>
                    <strong style={conflictStatNumberStyle}>
                      {stat.raised.toLocaleString()}
                    </strong>
                    <span style={conflictStatOfStyle}>
                      of {stat.of.toLocaleString()} responses
                    </span>
                  </p>
                ) : null}
                <p style={voiceSectionNoteStyle}>
                  Leadership responses that contradict the system-of-record
                  evidence on the same topic.
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {roles.length > 0 ? (
        <div style={{ minWidth: 0 }}>
          <span style={eyebrow(V4.navy)}>In their words</span>
          <p style={voiceSectionNoteStyle}>
            Every office on the record, not only the most-quoted.
          </p>
          <div style={voicesByOfficeStyle}>
            {roles.map(([role, said], roleIndex) => (
              <div key={role} style={{ minWidth: 0 }}>
                <span style={roleHeaderStyle}>{role}</span>
                <div style={officeQuotesStyle}>
                  {said.map((signal, quoteIndex) => {
                    const { quote, theme } = excerptOf(signal);
                    const hero = roleIndex === 0 && quoteIndex === 0;
                    return (
                      <blockquote
                        key={signal.id}
                        style={hero ? heroQuoteStyle : excerptStyle}
                      >
                        <p style={{ margin: 0 }}>&ldquo;{quote}&rdquo;</p>
                        {theme ? (
                          <footer style={excerptThemeStyle}>
                            on {humanizeTheme(theme)}
                          </footer>
                        ) : null}
                      </blockquote>
                    );
                  })}
                </div>
              </div>
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
        <span style={eyebrow(V4.navy)}>Leadership voice</span>
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
      <p style={provenanceTextStyle}>
        Synthetic demonstration record. This briefing is not client-attested.
      </p>
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

const leadershipBasisNoticeStyle = {
  gridColumn: "1 / -1",
  borderTop: `1px solid ${V4.rule}`,
  borderBottom: `1px solid ${V4.rule}`,
  padding: "12px 0",
} as const;

const leadershipBasisNoticeTextStyle = {
  margin: "6px 0 0",
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.55,
  color: V4.inkSoft,
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

/* The leadership chapter's full-width editorial voice spread. */

const voiceFullStyle = {
  marginTop: "clamp(30px,3.4vw,46px)",
  borderTop: `1px solid ${V4.ruleStrong}`,
  paddingTop: "clamp(24px,2.6vw,36px)",
  display: "grid",
  gap: "clamp(28px,3.2vw,44px)",
} as const;

const voiceScaleGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,160px),1fr))",
  gap: 1,
  border: `1px solid ${V4.rule}`,
  background: V4.rule,
} as const;

const voiceSectionNoteStyle = {
  margin: "8px 0 0",
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.55,
  color: V4.slate,
  maxWidth: "64ch",
} as const;

const consensusGridStyle = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,290px),1fr))",
  gap: "0 clamp(28px,3vw,56px)",
} as const;

const consensusRowStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) auto",
  gap: 16,
  alignItems: "baseline",
  padding: "13px 0",
  borderTop: `1px solid ${V4.ruleSoft}`,
} as const;

const consensusThemeStyle = {
  fontFamily: SERIF,
  fontSize: "clamp(16px,1.3vw,19px)",
  fontWeight: 500,
  letterSpacing: "-0.014em",
  color: V4.ink,
  textWrap: "pretty" as const,
} as const;

const consensusCountStyle = {
  display: "inline-flex",
  alignItems: "baseline",
  gap: 5,
  whiteSpace: "nowrap" as const,
} as const;

const consensusCountNumberStyle = {
  fontFamily: SERIF,
  fontSize: "clamp(18px,1.6vw,23px)",
  fontWeight: 500,
  color: V4.navy,
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
} as const;

const consensusCountOfStyle = {
  fontFamily: MONO,
  fontSize: 11,
  letterSpacing: "0.04em",
  color: V4.stone,
} as const;

const counterpointRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
  gap: "clamp(16px,2vw,24px)",
} as const;

const counterpointCardStyle = {
  minWidth: 0,
  border: `1px solid ${V4.rule}`,
  borderRadius: 10,
  background: V4.surface,
  padding: "18px 20px 20px",
} as const;

const dissentTagWrapStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
  marginTop: 14,
} as const;

const dissentTagStyle = {
  fontFamily: SANS,
  fontSize: 13.5,
  fontWeight: 500,
  color: V4.inkSoft,
  border: `1px solid ${V4.rule}`,
  borderRadius: 999,
  padding: "5px 12px",
} as const;

const conflictStatLineStyle = {
  margin: "12px 0 0",
  display: "flex",
  alignItems: "baseline",
  gap: 7,
  flexWrap: "wrap" as const,
} as const;

const conflictStatNumberStyle = {
  fontFamily: SERIF,
  fontSize: "clamp(27px,2.6vw,37px)",
  fontWeight: 500,
  letterSpacing: "-0.02em",
  color: V4.navy,
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
} as const;

const conflictStatOfStyle = {
  fontFamily: SANS,
  fontSize: 14,
  color: V4.slate,
} as const;

const voicesByOfficeStyle = {
  marginTop: 18,
  display: "grid",
  gap: "clamp(22px,2.6vw,34px)",
} as const;

const roleHeaderStyle = {
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: V4.navy,
  display: "inline-block",
  paddingBottom: 7,
  borderBottom: `2px solid ${V4.navy}`,
} as const;

const officeQuotesStyle = {
  marginTop: 14,
  display: "grid",
  gap: 14,
} as const;

const heroQuoteStyle = {
  margin: 0,
  padding: "2px 0 2px 20px",
  borderLeft: `3px solid ${V4.navy}`,
  fontFamily: SERIF,
  fontSize: "clamp(20px,1.9vw,27px)",
  fontWeight: 500,
  lineHeight: 1.32,
  letterSpacing: "-0.018em",
  color: V4.ink,
  maxWidth: "38ch",
  textWrap: "pretty" as const,
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
  borderLeft: `3px solid ${V4.navy}`,
  background: "rgba(12,26,58,0.04)",
  padding: "10px 12px",
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.48,
  color: V4.inkSoft,
} as const;
