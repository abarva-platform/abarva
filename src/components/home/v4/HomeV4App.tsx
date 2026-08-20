"use client";

import { useMemo, useState } from "react";

import { BrowseTheData } from "@/components/home/preview/BrowseTheData";
import { CurrentState } from "@/components/home/preview/CurrentState";
import { HomeAvaChat } from "@/components/home/preview/HomeAvaChat";
import { TechnologyEstateTable } from "@/components/home/preview/TechnologyEstateTable";
import { demoSafeClientText } from "@/lib/client-config";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";
import type { ChapterId, HomeReviewBundle, TechObjectType } from "@/lib/home/preview/types";
import { ChapterPage } from "./ChapterPage";
import { NotDraftedPage } from "./NotDraftedPage";
import { Rail, type RailGroup } from "./Rail";
import { SANS, V4 } from "./tokens";

/**
 * Home v4 -- "Record and Reading".
 *
 * A faithful translation of the approved Claude Design document into production components. The
 * information design is not re-litigated here: bands, their order, the reserved colours, and the
 * rail's contents are the design's decisions, and this file's job is to render them from the real
 * governed bundle rather than from the design's sample copy.
 */

const TENANT_LABEL: Record<HomePreviewTenantKey, string> = {
  "meridian-health": demoSafeClientText("Meridian Health"),
  "skyharbor-air": demoSafeClientText("SkyHarbor Air"),
};

type ActiveView = ChapterId | "current-state" | "browse-the-data" | `tech:${TechObjectType}`;

/** The evidence surfaces that exist as their own views today. Everything else in the estate is
 * reachable but not yet given a designed page, and the rail says so rather than implying the
 * record is thinner than it is. */
const DRAFTED_EVIDENCE_VIEWS: ReadonlySet<string> = new Set(["current-state", "browse-the-data"]);

export function HomeV4App({ bundle, tenantKey }: { bundle: HomeReviewBundle; tenantKey: HomePreviewTenantKey }) {
  const [activeView, setActiveView] = useState<ActiveView>("executive_brief");

  const chapters = bundle.chapters;
  const activeChapter = chapters.find((c) => c.chapterId === activeView);
  const activeIndex = chapters.findIndex((c) => c.chapterId === activeView);
  const techRecordTypes = useMemo(() => bundle.technologyEstate?.recordTypes ?? [], [bundle.technologyEstate]);
  const activeTechRecordType = activeView.startsWith("tech:")
    ? techRecordTypes.find((t) => `tech:${t.objectType}` === activeView)
    : undefined;

  const signalPacket = bundle.thesis.signalPacket;
  const visualDatasets = signalPacket.visualDatasets ?? {};

  /** Exhibit count lines, computed from the estate rather than asserted. An exhibit whose totals
   * cannot be derived shows no counts line at all -- an estimated total on a governed surface is
   * worse than a missing one. */
  const exhibitMeta = useMemo(() => {
    const meta: Record<string, string> = {};
    const contracts = techRecordTypes.find((t) => t.objectType === "vendor_contract");
    if (contracts) {
      const total = contracts.rows.reduce((sum, row) => sum + (Number(row.annualSpendUsd) || 0), 0);
      if (total > 0) {
        meta.vendor_spend_concentration = `${contracts.rows.length} contracts · $${(total / 1_000_000).toFixed(1)}M`;
      }
    }
    return meta;
  }, [techRecordTypes]);

  /** A chapter counts as drafted when the writer produced a headline for it. That is a property of
   * the generated record, not an inference from empty arrays -- a chapter can legitimately hold
   * few claims and still be drafted. */
  const isDrafted = (chapterId: ChapterId) => {
    const chapter = chapters.find((c) => c.chapterId === chapterId);
    return Boolean(chapter?.headline && !chapter.headline.endsWith("synthesis unavailable"));
  };

  const draftedCount = chapters.filter((c) => isDrafted(c.chapterId)).length;

  const groups: RailGroup[] = [
    {
      title: "The briefing",
      progress: `${draftedCount} of ${chapters.length} drafted`,
      items: chapters.map((c) => ({ id: c.chapterId, label: c.title, drafted: isDrafted(c.chapterId) })),
    },
    {
      title: "The evidence",
      progress: `${DRAFTED_EVIDENCE_VIEWS.size} of ${2 + techRecordTypes.length} drafted`,
      items: [
        { id: "current-state", label: "Current-state data flow", drafted: true },
        { id: "browse-the-data", label: "Browse the record", drafted: true },
        ...techRecordTypes.map((t) => ({
          id: `tech:${t.objectType}`,
          label: t.label,
          count: t.rows.length,
          drafted: true,
        })),
      ],
    },
  ];

  const provenance = bundle.provenance;
  const compiledLine = [
    new Date(provenance.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    `from ${signalPacket.signals.length} signals`,
    `and ${signalPacket.contextItems.length} governed facts`,
  ];

  return (
    <HomeAvaChat key={tenantKey} tenantKey={tenantKey} activeChapterId={activeChapter?.chapterId}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "250px minmax(min(100%,560px),1fr)",
          minHeight: "100vh",
          background: V4.paper,
          color: V4.ink,
          fontFamily: SANS,
          fontSize: 16,
          lineHeight: 1.6,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <Rail
          clientLabel={TENANT_LABEL[tenantKey]}
          groups={groups}
          activeId={activeView}
          onSelect={(id) => setActiveView(id as ActiveView)}
          compiledLine={compiledLine}
        />

        <main style={{ minWidth: 0, padding: "0 0 130px" }}>
          {activeChapter ? (
            isDrafted(activeChapter.chapterId) ? (
              <ChapterPage
                key={activeChapter.chapterId}
                chapter={activeChapter}
                chapterNumber={activeIndex + 1}
                signalPacket={signalPacket}
                visualDatasets={visualDatasets}
                exhibitMeta={exhibitMeta}
              />
            ) : (
              <NotDraftedPage
                chapterNumber={activeIndex + 1}
                title={activeChapter.title}
                guidingQuestion={activeChapter.guidingQuestion}
              />
            )
          ) : null}

          {activeView === "current-state" ? (
            <div style={{ padding: "54px 56px 0" }}>
              <CurrentState signalPacket={signalPacket} />
            </div>
          ) : null}

          {activeView === "browse-the-data" ? (
            <div style={{ padding: "54px 56px 0" }}>
              <BrowseTheData signalPacket={signalPacket} />
            </div>
          ) : null}

          {activeTechRecordType ? (
            <div style={{ padding: "54px 56px 0" }}>
              <TechnologyEstateTable key={activeTechRecordType.objectType} recordType={activeTechRecordType} />
            </div>
          ) : null}
        </main>
      </div>
    </HomeAvaChat>
  );
}
