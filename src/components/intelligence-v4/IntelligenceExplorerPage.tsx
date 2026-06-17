"use client";

// IntelligenceExplorerPage · Context & Corpus Explorer main page component
//
// Layout: flex row, 100vh minus nav height.
//   Left: SentinelExplorerRail (386px fixed)
//   Right: tab strip (Insights / Explore / Change Log / Coverage & Trust / Corpus) + content
//
// Tenant header strip: tenant name, live insight count, dimensions loaded, context date.

import { useEffect, useState } from "react";
import { SentinelExplorerRail } from "./SentinelExplorerRail";
import { ContextInsightsFeed } from "./ContextInsightsFeed";
import { ContextExploreTab } from "./ContextExploreTab";
import { ContextChangeLogTab } from "./ContextChangeLogTab";
import { ContextCoverageTrustTab } from "./ContextCoverageTrustTab";
import { ContextCorpusTab } from "./ContextCorpusTab";
import type { ContextReadModelResult } from "@/lib/intelligence/context-read-model";

const C = {
  bg: "#F8F7F4",
  panel: "#FFFFFF",
  ink: "#1B1A17",
  muted: "#6F6A61",
  line: "#E6E2DA",
  attention: "#B5852A",
};

type TabKey = "insights" | "explore" | "change" | "trust" | "corpus";

const TABS: { key: TabKey; label: string; group: string }[] = [
  { key: "insights", label: "Insights", group: "Meaning · L2" },
  { key: "explore", label: "Explore", group: "Facts · L1" },
  { key: "change", label: "Change Log", group: "Context" },
  { key: "trust", label: "Coverage & Trust", group: "Plumbing · L0" },
  { key: "corpus", label: "Corpus", group: "Global" },
];

export interface IntelligenceExplorerPageProps {
  tenantKey: string;
  tenantName: string;
}

export function IntelligenceExplorerPage({
  tenantKey,
  tenantName,
}: IntelligenceExplorerPageProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("insights");
  const [contextSummary, setContextSummary] =
    useState<ContextReadModelResult | null>(null);
  // When "See the facts" is clicked from an insight, switch to Explore
  // and pass the entity name so the row auto-expands.
  const [exploreEntity, setExploreEntity] = useState<string | null>(null);

  const handleSeeTheFacts = (entityName: string) => {
    setExploreEntity(entityName);
    setActiveTab("explore");
  };

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    if (key !== "explore") {
      setExploreEntity(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/intelligence/context-summary?tenantKey=${encodeURIComponent(tenantKey)}`,
      {
        signal: controller.signal,
        cache: "no-store",
      },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`context-summary ${response.status}`);
        return response.json() as Promise<ContextReadModelResult>;
      })
      .then((summary) => {
        setContextSummary(summary);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.warn(
          "[IntelligenceExplorerPage] context-summary failed",
          error,
        );
      });
    return () => controller.abort();
  }, [tenantKey]);

  const liveInsightCount = contextSummary?.insightCount;
  const liveDimensionsLoaded = contextSummary?.dimensionsLoaded;
  const contextDate = contextSummary?.latestUpdatedAt
    ? new Date(contextSummary.latestUpdatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      data-testid="intelligence-explorer-page"
      data-tenant-key={tenantKey}
      style={{
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Tenant header strip */}
      <div
        style={{
          height: 54,
          borderBottom: `1px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          background: C.bg,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: `1.5px solid ${C.ink}`,
              borderRadius: 5,
              display: "grid",
              placeItems: "center",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            A
          </div>
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 16,
              fontWeight: 400,
              color: C.ink,
            }}
          >
            Intelligence
          </span>
          <span style={{ color: C.muted, fontSize: 12.5, marginLeft: 2 }}>
            · {tenantName}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
            fontSize: 12.5,
            color: C.muted,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.4px",
              textTransform: "uppercase" as const,
              color: C.attention,
              border: `1px solid ${C.attention}55`,
              borderRadius: 20,
              padding: "2px 9px",
            }}
          >
            Feature-gated explorer
          </span>
          <span>
            <strong style={{ color: C.ink }}>
              {typeof liveInsightCount === "number" ? liveInsightCount : "reading"}
            </strong>{" "}
            live insights
          </span>
          <span>
            <strong style={{ color: C.ink }}>
              {typeof liveDimensionsLoaded === "number"
                ? `${liveDimensionsLoaded}/14`
                : "reading"}
            </strong>{" "}
            dimensions loaded
          </span>
          <span>
            context as of{" "}
            <strong style={{ color: C.ink }}>{contextDate ?? "reading"}</strong>
          </span>
        </div>
      </div>

      {/* Main shell: rail + dashboard */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left: Sentinel rail */}
        <SentinelExplorerRail tenantKey={tenantKey} />

        {/* Right: tab strip + content */}
        <section
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Tab strip */}
          <nav
            style={{
              display: "flex",
              gap: 1,
              padding: "0 20px",
              borderBottom: `1px solid ${C.line}`,
              background: C.bg,
              flexShrink: 0,
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                style={{
                  appearance: "none" as const,
                  background: "none",
                  border: "none",
                  padding: "12px 13px 10px",
                  fontSize: 13,
                  color: activeTab === tab.key ? C.ink : C.muted,
                  borderBottom:
                    activeTab === tab.key
                      ? `2px solid ${C.ink}`
                      : "2px solid transparent",
                  marginBottom: -1,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.6px",
                    display: "block",
                    marginBottom: 2,
                    opacity: 0.7,
                  }}
                >
                  {tab.group}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 28px 70px",
            }}
          >
            <div style={{ maxWidth: 1080 }}>
              {activeTab === "insights" && (
                <ContextInsightsFeed
                  tenantKey={tenantKey}
                  onSeeTheFacts={handleSeeTheFacts}
                />
              )}
              {activeTab === "explore" && (
                <ContextExploreTab
                  initialEntityName={exploreEntity}
                  contextSummary={contextSummary}
                />
              )}
              {activeTab === "change" && (
                <ContextChangeLogTab tenantKey={tenantKey} />
              )}
              {activeTab === "trust" && (
                <ContextCoverageTrustTab contextSummary={contextSummary} />
              )}
              {activeTab === "corpus" && <ContextCorpusTab />}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
