import type { ChapterView, EnterpriseSignalPacket, VisualOpportunity } from "@/lib/home/preview/types";
import { ChapterHeader, ExposuresBand, FollowsBand, NotEstablishedBand, QuestionsSection, RecordBand } from "./bands";
import { Exhibit, ExhibitBars } from "./Exhibit";
import { splitChapterIntoBands } from "./chapter-bands";
import { PAGE_X, SANS, V4 } from "./tokens";

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
}: {
  chapter: ChapterView;
  chapterNumber: number;
  signalPacket: EnterpriseSignalPacket;
  visualDatasets: Record<string, Array<Record<string, unknown>>>;
  /** Per-dataset counts line, derived by the caller from real records. */
  exhibitMeta?: Record<string, string>;
}) {
  const bands = splitChapterIntoBands(chapter, signalPacket);
  const exhibits = chapter.visual_opportunities.filter((v) => Boolean(visualDatasets[v.dataset_ref]));
  const [lead, ...rest] = exhibits;

  return (
    <>
      <ChapterHeader
        eyebrowText={`Chapter ${String(chapterNumber).padStart(2, "0")} · ${chapter.title}`}
        guidingQuestion={chapter.guidingQuestion}
        headline={chapter.headline}
        standfirst={chapter.executive_synthesis}
      />

      {lead ? <ExhibitFor visual={lead} index={1} signalPacket={signalPacket} visualDatasets={visualDatasets} meta={exhibitMeta?.[lead.dataset_ref]} dark /> : null}

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
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 16, lineHeight: 1.6, color: V4.slate, maxWidth: "60ch" }}>
            No verified claims were routed to this chapter from the current record. That is a coverage gap in the
            build, not a statement that nothing is happening here.
          </p>
        </div>
      ) : null}
    </>
  );
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
    <Exhibit index={index} visual={visual} signalPacket={signalPacket} meta={meta} dark={dark}>
      <ExhibitBars rows={rows} dark={dark} />
    </Exhibit>
  );
}
