"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type {
  StageNextMoveActionTarget,
  StageNextMoveView,
} from "@/lib/source/stage-next-move";
import { CANVAS } from "./canvas-tokens";
import { StageNextMoveCard } from "./StageNextMoveCard";

export type WorkspaceTabKey = 'document' | 'decision' | 'gate' | 'evidence' | 'log';

interface WorkspaceTab {
  key: WorkspaceTabKey;
  label: string;
  /** Optional badge — number or string. */
  badge?: string;
  content: ReactNode;
}

interface EventWorkspaceProps {
  tabs: WorkspaceTab[];
  defaultTab?: WorkspaceTabKey;
  nextMove?: StageNextMoveView;
  onNextMoveAdvance?: () => void;
  onDraftWithSentinel?: (code: string) => void;
  workspaceHref?: string;
}

/**
 * Right pane of the universal canvas. Tab strip + active panel.
 * Tabs are independent surfaces that swap based on what the user wants to see;
 * the chat conversation drives the agent, the workspace shows what's being assembled.
 */
export function EventWorkspace({
  tabs,
  defaultTab,
  nextMove,
  onNextMoveAdvance,
  onDraftWithSentinel,
  workspaceHref,
}: EventWorkspaceProps) {
  const [active, setActive] = useState<WorkspaceTabKey>(
    defaultTab ?? tabs[0]?.key ?? "document",
  );
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];
  const handleNextMoveAction = (target: StageNextMoveActionTarget) => {
    if (target === "advance") {
      onNextMoveAdvance?.();
      return;
    }
    if (target === "document" && workspaceHref) {
      window.location.assign(workspaceHref);
      return;
    }
    if (tabs.some((tab) => tab.key === target)) {
      setActive(target);
    }
  };

  return (
    <section
      data-testid="source-canvas-workspace"
      data-active-tab={active}
      aria-label="Workspace"
      style={WORKSPACE_STYLE}
    >
      {nextMove ? (
        <div style={NEXT_MOVE_WRAP_STYLE}>
          <StageNextMoveCard
            nextMove={nextMove}
            onPrimary={() => {
              if (nextMove.draftArtifactCode && onDraftWithSentinel) {
                onDraftWithSentinel(nextMove.draftArtifactCode);
              } else {
                handleNextMoveAction(nextMove.primaryTarget);
              }
            }}
            onSecondary={
              nextMove.secondaryTarget
                ? () => handleNextMoveAction(nextMove.secondaryTarget!)
                : undefined
            }
          />
        </div>
      ) : null}
      <div role="tablist" aria-label="Workspace panels" style={TAB_STRIP_STYLE}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              data-testid={`source-canvas-tab-${tab.key}`}
              style={{
                ...TAB_BUTTON_STYLE,
                color: isActive
                  ? CANVAS.TAB_ACTIVE_INK
                  : CANVAS.TAB_INACTIVE_INK,
                borderBottomColor: isActive ? CANVAS.INK : "transparent",
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <span>{tab.label}</span>
              {tab.badge ? <span style={BADGE_STYLE}>{tab.badge}</span> : null}
            </button>
          );
        })}
      </div>
      <div style={PANEL_STYLE}>{activeTab?.content ?? null}</div>
    </section>
  );
}

const WORKSPACE_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: CANVAS.PAGE_BG,
  minHeight: 0,
};

const TAB_STRIP_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "8px 24px 0",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  background: CANVAS.PAGE_BG,
};

const NEXT_MOVE_WRAP_STYLE: CSSProperties = {
  padding: "20px 0 16px",
  background: CANVAS.PAGE_BG,
};

const TAB_BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px 12px",
  background: "transparent",
  border: "none",
  borderBottom: "2px solid transparent",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  cursor: "pointer",
  transition: "color 120ms ease, border-color 120ms ease",
};

const BADGE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.04em",
  fontWeight: 600,
  padding: "2px 6px",
  borderRadius: 999,
  background: "rgba(10,10,11,0.06)",
  color: CANVAS.INK,
};

const PANEL_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "24px 24px 32px",
};
