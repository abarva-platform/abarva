"use client";

import { useState, type ReactNode } from "react";

type UploadTabId = "add" | "loaded" | "advanced";

interface UploadTabDefinition {
  id: UploadTabId;
  label: string;
  eyebrow: string;
  summary: string;
  content: ReactNode;
}

interface ContextUploadsTabsProps {
  addData: ReactNode;
  loadedFiles: ReactNode;
  advancedTools: ReactNode;
  sourceFileCount: number;
}

const COLORS = {
  ink: "#111318",
  muted: "#5D6572",
  faint: "#7A8190",
  surface: "#FFFEFB",
  soft: "#F1EFE8",
  border: "#D9D6CD",
  blue: "#2563EB",
};

const FONT = {
  body: "DM Sans, Inter, system-ui, sans-serif",
  mono: "JetBrains Mono, ui-monospace, monospace",
  serif: "Fraunces, Georgia, serif",
};

export function ContextUploadsTabs({
  addData,
  loadedFiles,
  advancedTools,
  sourceFileCount,
}: ContextUploadsTabsProps) {
  const tabs: UploadTabDefinition[] = [
    {
      id: "add",
      label: "Add data",
      eyebrow: "Start here",
      summary:
        "Choose files first. The loader keeps the original source, checks the tenant, and commits only after the governed gates pass.",
      content: addData,
    },
    {
      id: "loaded",
      label: "Loaded files",
      eyebrow: "Evidence review",
      summary:
        "Review source documents, chunk counts, load timestamps, and direct evidence-map links for the active client.",
      content: loadedFiles,
    },
    {
      id: "advanced",
      label: "Advanced",
      eyebrow: "IT and operator tools",
      summary:
        "Use only when IT or an operator needs package-level mapping, Azure landing-zone handling, or governed industry-corpus import.",
      content: advancedTools,
    },
  ];
  const [activeTabId, setActiveTabId] = useState<UploadTabId>(
    "add",
  );
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        background: COLORS.surface,
        padding: 18,
        boxShadow: "0 18px 48px rgba(17, 19, 24, 0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 260, flex: "1 1 360px" }}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: COLORS.faint,
              marginBottom: 6,
            }}
          >
            {activeTab.eyebrow}
          </div>
          <h2
            style={{
              margin: 0,
              color: COLORS.ink,
              fontFamily: FONT.serif,
              fontSize: 26,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            {activeTab.label}
          </h2>
          <p
            style={{
              margin: "8px 0 0",
              maxWidth: 640,
              color: COLORS.muted,
              fontFamily: FONT.body,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {activeTab.summary}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Context upload sections"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4,
            flex: "0 1 auto",
            padding: 4,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            background: COLORS.soft,
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                id={`context-upload-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`context-upload-panel-${tab.id}`}
                onClick={() => setActiveTabId(tab.id)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  background: active ? COLORS.ink : "transparent",
                  color: active ? "#FFFFFF" : COLORS.muted,
                  cursor: "pointer",
                  fontFamily: FONT.body,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0,
                  minHeight: 34,
                  padding: "0 12px",
                  whiteSpace: "nowrap",
                  transition: "background 140ms ease, color 140ms ease",
                }}
              >
                {tab.label}
                {tab.id === "loaded" ? (
                  <span
                    style={{
                      marginLeft: 7,
                      color: active ? "rgba(255,255,255,0.74)" : COLORS.faint,
                      fontFamily: FONT.mono,
                      fontSize: 10,
                    }}
                  >
                    {sourceFileCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`context-upload-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`context-upload-tab-${activeTab.id}`}
        style={{
          display: "grid",
          gap: 16,
          minWidth: 0,
        }}
      >
        {activeTab.content}
      </div>
    </div>
  );
}
