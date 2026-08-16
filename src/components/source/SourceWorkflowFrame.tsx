"use client";

import type { CSSProperties, ReactNode } from "react";

export const SOURCE_WORKFLOW_RAIL_WIDTH_PX = 264;
export const SOURCE_WORKFLOW_GRID_TEMPLATE_COLUMNS = `${SOURCE_WORKFLOW_RAIL_WIDTH_PX}px minmax(0, 1fr)`;

const FRAME_BASE_STYLE: CSSProperties = {
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns: SOURCE_WORKFLOW_GRID_TEMPLATE_COLUMNS,
};

const PANE_BASE_STYLE: CSSProperties = {
  boxSizing: "border-box",
  minWidth: 0,
  width: "100%",
};

interface SourceWorkflowFrameProps {
  rail: ReactNode;
  children: ReactNode;
  testId?: string;
  paneTestId?: string;
  gap?: CSSProperties["gap"];
  minHeight?: CSSProperties["minHeight"];
  alignItems?: CSSProperties["alignItems"];
  style?: CSSProperties;
  paneStyle?: CSSProperties;
}

export function SourceWorkflowFrame({
  rail,
  children,
  testId,
  paneTestId,
  gap = 0,
  minHeight,
  alignItems,
  style,
  paneStyle,
}: SourceWorkflowFrameProps) {
  return (
    <div
      data-testid={testId}
      style={{
        ...FRAME_BASE_STYLE,
        gap,
        minHeight,
        alignItems,
        ...style,
      }}
    >
      {rail}
      <div
        data-testid={paneTestId}
        style={{
          ...PANE_BASE_STYLE,
          ...paneStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
