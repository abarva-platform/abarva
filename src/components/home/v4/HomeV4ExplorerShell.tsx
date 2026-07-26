"use client";

import { useState } from "react";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import { HomeV4ApplicationsGrid } from "./HomeV4ApplicationsGrid";
import { HomeV4BookOverview, HomeV4BookOverviewStyles, HomeV4GraphBindingSummary } from "./HomeV4BookOverview";
import { HomeV4Explorer, type HomeV4ExplorerGroup } from "./HomeV4Explorer";
import {
  CandidateUseCasesPage,
  EnterpriseChangeThesesPage,
  HomeV4ChangeTransformationStyles,
  IndustryMovementsPage,
  NewWaysOfOperatingPage,
  TransformationDependenciesPage,
} from "./HomeV4ChangeTransformationPages";
import { HomeV4VisualRenderer } from "./HomeV4VisualRenderer";
import type { HomeV4Candidate } from "./homeV4Visual";

const CHANGE_TRANSFORMATION_GROUP: HomeV4ExplorerGroup = {
  title: "Change & Transformation",
  defaultOpen: true,
  items: [
    { key: "industry_movements", label: "Industry Movements", tone: "green" },
    { key: "new_ways_of_operating", label: "New Ways of Operating", tone: "green" },
    { key: "change_theses", label: "Enterprise Change Theses", tone: "green" },
    { key: "use_cases", label: "Candidate Use Cases", tone: "green" },
    { key: "transformation_dependencies", label: "Transformation Dependencies", tone: "amber" },
  ],
};

// Book mode (candidate.enterprise_book present) never populates
// industry_change/use_cases/relationships -- those 4 passes are explicitly
// skipped (see bookModeExecutionTrace() in the generator). Showing their nav
// items would just be dead links, so book mode gets its own group instead of
// CHANGE_TRANSFORMATION_GROUP -- explicit degradation, not a silent gap.
const BOOK_OVERVIEW_GROUP: HomeV4ExplorerGroup = {
  title: "Executive Book",
  defaultOpen: true,
  items: [{ key: "book_overview", label: "Executive Narrative", tone: "green" }],
};

// The real chapter structure the generator already guarantees complete
// (DIMENSION_BOOK_CHAPTERS in build-home-knowledge-v4-review-pack.mjs, one
// entry for every one of the 38 catalog dimensions, load-time-checked for
// coverage). A flat 38-item list buried the book's actual narrative
// structure; this renders the real chapters as a numbered table of
// contents instead -- the generated content already has this shape, the
// nav was just never built to reflect it. `enterprise_narrative`'s one
// dimension (enterprise_thesis) is folded into the Executive Book group
// above rather than getting its own single-item chapter.
const BOOK_CHAPTER_ORDER: Array<{ chapter: string; title: string; numeral: string }> = [
  { chapter: "business_context", title: "Enterprise Context", numeral: "I" },
  { chapter: "operating_model", title: "Operating Model", numeral: "II" },
  { chapter: "capabilities", title: "Capabilities", numeral: "III" },
  { chapter: "value_streams", title: "Value Streams", numeral: "IV" },
  { chapter: "technology_context", title: "Technology", numeral: "V" },
  { chapter: "data_context", title: "Data Foundation", numeral: "VI" },
  { chapter: "applications_context", title: "Applications & Systems", numeral: "VII" },
  { chapter: "vendor_context", title: "Vendors & Economics", numeral: "VIII" },
  { chapter: "risk_context", title: "Risk & Controls", numeral: "IX" },
  { chapter: "evidence_context", title: "Evidence & Confidence", numeral: "X" },
  { chapter: "ai_opportunity_context", title: "AI Opportunity", numeral: "XI" },
  { chapter: "portfolio_context", title: "Portfolio & Investment", numeral: "XII" },
  { chapter: "relationships_context", title: "Relationships", numeral: "XIII" },
];

// Pure and exported so its output can be asserted directly against real
// fixture content without depending on the explorer's collapse/expand DOM
// state (chapter groups default closed, same as the legacy flat group did,
// so a static-markup snapshot alone can't prove every dimension landed in
// the right chapter -- this can).
export function buildBookChapterGroups(dimensions: HomeV4Candidate["dimensions"]): HomeV4ExplorerGroup[] {
  return BOOK_CHAPTER_ORDER.map(({ chapter, title, numeral }) => {
    const chapterDimensions = dimensions.filter((d) => d.chapter === chapter);
    return {
      title,
      numberLabel: numeral,
      variant: "toc" as const,
      defaultOpen: false,
      items: chapterDimensions.map((dimension) => ({
        key: `dimension:${dimension.dimension_key}`,
        label: dimension.executive_title,
        // A dimension with no headline has none of its own gap/advantage/
        // conclusion content (see pickDimensionHeadline in the generator)
        // -- an honest visual signal in the TOC itself, not decoration.
        tone: (dimension.headline ? "green" : "quiet") as "green" | "quiet",
      })),
    };
  }).filter((group) => group.items.length > 0);
}

export function HomeV4ExplorerShell({ candidate }: { candidate: HomeV4Candidate }) {
  const isBookMode = Boolean(candidate.enterprise_book);

  // Non-book candidates keep the old flat single-group nav (that shape,
  // legacy V1 dimensions, has no `chapter` field to group by).
  const enterpriseContextGroup: HomeV4ExplorerGroup = {
    title: "Enterprise Context",
    defaultOpen: false,
    items: candidate.dimensions.map((dimension) => ({
      key: `dimension:${dimension.dimension_key}`,
      label: dimension.executive_title,
      tone: "blue",
    })),
  };

  const chapterGroups = buildBookChapterGroups(candidate.dimensions);

  const groups = isBookMode ? [BOOK_OVERVIEW_GROUP, ...chapterGroups] : [CHANGE_TRANSFORMATION_GROUP, enterpriseContextGroup];

  const [selectedKey, setSelectedKey] = useState(isBookMode ? "book_overview" : "industry_movements");
  const businessChangeImpact = candidate.relationships?.graph_projections.find(
    (p) => p.projection_type === "business_change_impact",
  );

  return (
    <div className="heb-v4-explorer-shell">
      <HomeV4Explorer
        groups={groups}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
      />
      <main className="heb-v4-explorer-main">
        {selectedKey === "book_overview" && candidate.enterprise_book ? (
          <HomeV4BookOverview book={candidate.enterprise_book} />
        ) : null}
        {selectedKey === "industry_movements" && candidate.industry_change ? (
          <IndustryMovementsPage industryChange={candidate.industry_change} />
        ) : null}
        {selectedKey === "new_ways_of_operating" && candidate.industry_change ? (
          <NewWaysOfOperatingPage industryChange={candidate.industry_change} />
        ) : null}
        {selectedKey === "change_theses" && candidate.industry_change ? (
          <EnterpriseChangeThesesPage industryChange={candidate.industry_change} />
        ) : null}
        {selectedKey === "use_cases" && candidate.use_cases ? (
          <CandidateUseCasesPage batches={candidate.use_cases} />
        ) : null}
        {selectedKey === "transformation_dependencies" && businessChangeImpact ? (
          <TransformationDependenciesPage projection={businessChangeImpact} />
        ) : null}
        {selectedKey.startsWith("dimension:")
          ? candidate.dimensions
              .filter((d) => `dimension:${d.dimension_key}` === selectedKey)
              .map((dimension) => (
                <div key={dimension.dimension_key} className="heb-v4-ct-page">
                  <h1>{dimension.executive_title}</h1>
                  {dimension.summary_tab?.executive_read ? (
                    <p className="heb-v4-preview-summary">{dimension.summary_tab.executive_read}</p>
                  ) : null}
                  {dimension.headline && !dimension.summary_tab ? (
                    <p className="heb-v4-preview-summary">
                      <strong>{dimension.headline}</strong>
                      {dimension.executive_takeaway ? ` -- ${dimension.executive_takeaway}` : ""}
                    </p>
                  ) : null}
                  {dimension.primary_visual ? <HomeV4VisualRenderer visual={dimension.primary_visual} /> : null}
                  {dimension.data_tab?.full_rows?.length ? (
                    <HomeV4ApplicationsGrid rows={dimension.data_tab.full_rows} />
                  ) : null}
                  {dimension.graph_binding ? <HomeV4GraphBindingSummary binding={dimension.graph_binding} /> : null}
                </div>
              ))
          : null}
      </main>
      <HomeV4ChangeTransformationStyles />
      <HomeV4BookOverviewStyles />
      <style jsx global>{`
        .heb-v4-explorer-shell {
          display: flex;
          min-height: 100vh;
          background: ${COLORS.page};
        }
        .heb-v4-explorer-main {
          flex: 1;
          min-width: 0;
          padding: 28px 32px 64px;
        }
        .heb-v4-preview-summary {
          margin: 0 0 16px;
          font-size: 13px;
          color: ${COLORS.muted};
          max-width: 74ch;
        }
        .heb-v4-preview-tenant-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 32px;
          background: ${COLORS.rail};
          border-bottom: 1px solid ${COLORS.line};
        }
        .heb-v4-preview-tabs {
          display: flex;
          gap: 8px;
        }
        .heb-v4-preview-tab {
          padding: 4px 10px;
          border: 1px solid ${COLORS.line};
          border-radius: 999px;
          font-size: 11px;
          color: ${COLORS.muted};
          text-decoration: none;
          background: ${COLORS.surface};
        }
        .heb-v4-preview-tab.active {
          background: ${COLORS.ink};
          color: #fffdf8;
          border-color: ${COLORS.ink};
        }
      `}</style>
    </div>
  );
}
