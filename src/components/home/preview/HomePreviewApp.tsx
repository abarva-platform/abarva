"use client";

import { useState } from "react";

import { BrowseTheData } from "./BrowseTheData";
import { ChapterSection } from "./ChapterSection";
import { CurrentState } from "./CurrentState";
import { HomeAvaChat } from "./HomeAvaChat";
import { TechnologyEstateTable } from "./TechnologyEstateTable";
import { HOME_HEX } from "./visuals/home-chart-kit";
import { StateBadge } from "@/components/knowledge/state/StateBanner";
import { demoSafeClientText } from "@/lib/client-config";
import type { ChapterId, HomeReviewBundle, TechObjectType } from "@/lib/home/preview/types";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";

/** Routed through demoSafeClientText so the client-facing label comes from the canonical
 * DEMO_SAFE_CLIENT_NAMES map rather than a hand-typed string. The physical/source label
 * ("SkyHarbor Air") must never render on an AbarVa-facing page -- only the demo-safe name. */
const TENANT_LABEL: Record<HomePreviewTenantKey, string> = {
  "meridian-health": demoSafeClientText("Meridian Health"),
  "skyharbor-air": demoSafeClientText("SkyHarbor Air"),
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
}: {
  bundle: HomeReviewBundle;
  tenantKey: HomePreviewTenantKey;
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
    <HomeAvaChat key={tenantKey} tenantKey={tenantKey} activeChapterId={activeChapter?.chapterId}>
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
        {/* One client, named. No cross-tenant control: a client-facing surface must never imply
            another client's data is one click away. Tenant is chosen by URL for review, and the
            page only ever loads the one tenant's bundle. */}
        <div>
          <p style={{ margin: "0 0 5px", fontFamily: "var(--font-body-mono)", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: HOME_HEX.textDisabled }}>
            Demo client · synthetic data
          </p>
          <h1 style={{ margin: "0 0 7px", fontFamily: "var(--font-body-serif)", fontSize: 19, fontWeight: 600, color: HOME_HEX.textPrimary, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {TENANT_LABEL[tenantKey]}
          </h1>
          <StateBadge tone="candidate" label="Candidate — not yet reviewed" />
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

      {/* Left-aligned, not centered: centering a fixed container inside the space left over
          after the sidebar split the slack into two dead gutters -- one between the sidebar and
          the content, one after it. Content now starts right after the rail and any leftover
          collects as a single right margin. */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ width: "100%", maxWidth: 1340 }}>
          {activeView === "current-state" ? (
            <CurrentState signalPacket={bundle.thesis.signalPacket} />
          ) : activeView === "browse-the-data" ? (
            <BrowseTheData signalPacket={bundle.thesis.signalPacket} />
          ) : activeTechRecordType ? (
            <TechnologyEstateTable key={activeTechRecordType.objectType} recordType={activeTechRecordType} />
          ) : activeChapter ? (
            <ChapterSection chapter={activeChapter} signalPacket={bundle.thesis.signalPacket} visualDatasets={bundle.thesis.signalPacket.visualDatasets} />
          ) : null}
        </div>
      </main>
    </div>
    </HomeAvaChat>
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
