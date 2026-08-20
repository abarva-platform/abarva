"use client";

import { useState } from "react";

import { BrowseTheData } from "./BrowseTheData";
import { ChapterSection } from "./ChapterSection";
import { CurrentState } from "./CurrentState";
import { TechnologyEstateTable } from "./TechnologyEstateTable";
import { HOME_HEX } from "./visuals/home-chart-kit";
import { StateBadge } from "@/components/knowledge/state/StateBanner";
import type { ChapterId, HomeReviewBundle, TechObjectType } from "@/lib/home/preview/types";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";

const TENANT_LABEL: Record<HomePreviewTenantKey, string> = {
  "meridian-health": "Meridian Health",
  "skyharbor-air": "SkyHarbor Air",
};

type ActiveView = ChapterId | "current-state" | "browse-the-data" | `tech:${TechObjectType}`;

const SIDEBAR_WIDTH = 268;

/**
 * The full Home preview for one tenant: a persistent left rail (tenant identity, candidate
 * status, switcher, and every navigation destination) plus a single active view in the main pane
 * -- one chapter, the Current State survey, or Browse the Data -- rather than all eight chapters
 * concatenated into one continuously scrolling page. Switching the sidebar item is instant; only
 * the active view's own content can be long, not the whole app.
 */
export function HomePreviewApp({
  bundle,
  tenantKey,
  onTenantChange,
}: {
  bundle: HomeReviewBundle;
  tenantKey: HomePreviewTenantKey;
  onTenantChange: (next: HomePreviewTenantKey) => void;
}) {
  const [activeView, setActiveView] = useState<ActiveView>("executive_brief");
  const [techTreeExpanded, setTechTreeExpanded] = useState(true);
  const activeChapter = bundle.chapters.find((c) => c.chapterId === activeView);
  const techRecordTypes = bundle.technologyEstate?.recordTypes ?? [];
  const activeTechRecordType =
    activeView.startsWith("tech:")
      ? techRecordTypes.find((t) => `tech:${t.objectType}` === activeView)
      : undefined;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", background: "#FFFFFF", minHeight: "100%" }}>
      <aside
        style={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          borderRight: `1px solid ${HOME_HEX.border}`,
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-body-serif)", fontSize: 18, fontWeight: 600, color: HOME_HEX.textPrimary, lineHeight: 1.25 }}>
            {TENANT_LABEL[tenantKey]}
          </h1>
          <StateBadge tone="candidate" label="Candidate — not yet reviewed" />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(Object.keys(TENANT_LABEL) as HomePreviewTenantKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onTenantChange(key)}
              aria-pressed={key === tenantKey}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: 6,
                border: `1px solid ${key === tenantKey ? HOME_HEX.navy : HOME_HEX.border}`,
                background: key === tenantKey ? HOME_HEX.navy : "#FFFFFF",
                color: key === tenantKey ? "#FFFFFF" : HOME_HEX.textSecondary,
                fontFamily: "var(--font-body-sans)",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {TENANT_LABEL[key].split(" ")[0]}
            </button>
          ))}
        </div>

        <nav aria-label="Chapters" style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {bundle.chapters.map((c) => (
            <SidebarLink key={c.chapterId} label={c.title} active={activeView === c.chapterId} onClick={() => setActiveView(c.chapterId)} />
          ))}
        </nav>

        <div style={{ borderTop: `1px solid ${HOME_HEX.border}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 1 }}>
          <SidebarLink label="Current State" active={activeView === "current-state"} onClick={() => setActiveView("current-state")} accent />
          <SidebarLink label="Browse the Data" active={activeView === "browse-the-data"} onClick={() => setActiveView("browse-the-data")} accent />
          {techRecordTypes.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setTechTreeExpanded((v) => !v)}
                aria-expanded={techTreeExpanded}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 10px",
                  border: "none",
                  background: "transparent",
                  color: HOME_HEX.teal,
                  fontFamily: "var(--font-body-sans)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 10, width: 10, display: "inline-block" }}>{techTreeExpanded ? "▾" : "▸"}</span>
                Technology Estate
              </button>
              {techTreeExpanded ? (
                <div style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 1 }}>
                  {techRecordTypes.map((t) => (
                    <SidebarLink
                      key={t.objectType}
                      label={`${t.label} (${t.rows.length})`}
                      active={activeView === `tech:${t.objectType}`}
                      onClick={() => setActiveView(`tech:${t.objectType}`)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <ProvenanceLine bundle={bundle} />
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1280 }}>
          {activeView === "current-state" ? (
            <CurrentState signalPacket={bundle.thesis.signalPacket} />
          ) : activeView === "browse-the-data" ? (
            <BrowseTheData signalPacket={bundle.thesis.signalPacket} />
          ) : activeTechRecordType ? (
            <TechnologyEstateTable recordType={activeTechRecordType} />
          ) : activeChapter ? (
            <ChapterSection chapter={activeChapter} signalPacket={bundle.thesis.signalPacket} visualDatasets={bundle.thesis.signalPacket.visualDatasets} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ label, active, onClick, accent = false }: { label: string; active: boolean; onClick: () => void; accent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{
        textAlign: "left",
        padding: "7px 10px",
        borderRadius: 6,
        border: "none",
        background: active ? HOME_HEX.navyDim : "transparent",
        color: active ? HOME_HEX.navy : accent ? HOME_HEX.teal : HOME_HEX.textSecondary,
        fontFamily: "var(--font-body-sans)",
        fontSize: 13,
        fontWeight: active || accent ? 600 : 400,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function ProvenanceLine({ bundle }: { bundle: HomeReviewBundle }) {
  const p = bundle.provenance;
  const generatedDate = new Date(p.generated_at).toLocaleDateString("en-US", { dateStyle: "medium" });
  return (
    <p style={{ margin: 0, fontFamily: "var(--font-body-mono)", fontSize: 9.5, color: HOME_HEX.textDisabled, lineHeight: 1.5 }}>
      Generated {generatedDate}
      <br />
      contract {p.home_synthesis_contract_version}
      <br />
      model {p.model}
    </p>
  );
}
