"use client";

import { useState } from "react";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import { HomeV4ApplicationsGrid } from "./HomeV4ApplicationsGrid";
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

export function HomeV4ExplorerShell({ candidate }: { candidate: HomeV4Candidate }) {
  const enterpriseContextGroup: HomeV4ExplorerGroup = {
    title: "Enterprise Context",
    defaultOpen: false,
    items: candidate.dimensions.map((dimension) => ({
      key: `dimension:${dimension.dimension_key}`,
      label: dimension.executive_title,
      tone: "blue",
    })),
  };

  const [selectedKey, setSelectedKey] = useState("industry_movements");
  const businessChangeImpact = candidate.relationships?.graph_projections.find(
    (p) => p.projection_type === "business_change_impact",
  );

  return (
    <div className="heb-v4-explorer-shell">
      <HomeV4Explorer
        groups={[CHANGE_TRANSFORMATION_GROUP, enterpriseContextGroup]}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
      />
      <main className="heb-v4-explorer-main">
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
                  <HomeV4VisualRenderer visual={dimension.primary_visual} />
                  {dimension.data_tab?.full_rows?.length ? (
                    <HomeV4ApplicationsGrid rows={dimension.data_tab.full_rows} />
                  ) : null}
                </div>
              ))
          : null}
      </main>
      <HomeV4ChangeTransformationStyles />
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
