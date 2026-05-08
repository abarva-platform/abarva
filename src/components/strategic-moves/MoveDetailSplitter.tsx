'use client';

// MoveDetailSplitter — thin Client Component wrapper around ResizableSplitter
// for the Move detail page (chat pane ↔ right pane).
//
// The Server Component (StrategicMoveDetailView) passes chat and right pane
// content as ReactNode props; this Client Component provides the draggable
// handle. Preference is persisted to localStorage under 'move-detail-split-v1'.

import type { ReactNode } from 'react';
import { ResizableSplitter } from '@/components/source/canvas/ResizableSplitter';

interface Props {
  chatPane: ReactNode;
  rightPane: ReactNode;
}

export function MoveDetailSplitter({ chatPane, rightPane }: Props) {
  return (
    <ResizableSplitter
      left={chatPane}
      right={rightPane}
      defaultLeftPercent={38}
      minLeftPx={300}
      minRightPx={440}
      storageKey="move-detail-split-v1"
    />
  );
}
