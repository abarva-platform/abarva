'use client';

// WorkingPaneContainer · Shell Layout Spec v2 §7.2
//
// Reads the current (surface, stage, surfaceContext) triple from
// AtlasPageState and calls the supplied shapeResolver to obtain a
// WorkingPaneShape.  If the resolver returns null it falls back to
// rendering raw children — preserving backward compat during the Wave 5/6
// rollout.
//
// Usage:
//   <WorkingPaneContainer shapeResolver={programsShapeResolver}>
//     {/* fallback content — rendered when resolver returns null */}
//   </WorkingPaneContainer>
//
// Shell Layout Spec v2 §7.2 · April 2026

import type { ReactNode } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { useAtlasPageState } from '@/components/shell/AtlasPageStateProvider';
import type { WorkingPaneShapeResolver } from '@/lib/shell/working-pane-shape';
import { nullWorkingPaneShapeResolver } from '@/lib/shell/working-pane-shape';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface WorkingPaneContainerProps {
  /**
   * Surface-specific shape resolver.  Defaults to nullWorkingPaneShapeResolver
   * so the container is safe to mount before Waves 5/6 implement it.
   */
  shapeResolver?: WorkingPaneShapeResolver;
  /** Fallback content rendered when shapeResolver returns null. */
  children?: ReactNode;
  /** Additional CSS for the outer container div. */
  style?: React.CSSProperties;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkingPaneContainer({
  shapeResolver = nullWorkingPaneShapeResolver,
  children,
  style,
}: WorkingPaneContainerProps) {
  const pageState = useAtlasPageState();

  // If no AtlasPageState is available (e.g. rendered outside provider),
  // fall through to children.
  if (!pageState) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', ...style }}>
        {children}
      </div>
    );
  }

  const { surface, stage, surfaceContext } = pageState;
  const shape = shapeResolver(surface, stage, surfaceContext);

  // No shape resolved — render fallback children.
  if (!shape) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', ...style }}>
        {children}
      </div>
    );
  }

  // Shape resolved — render the structured pane.
  // primaryArtifact is optional: if absent, render children in that slot.
  const primaryContent = shape.primaryArtifact ?? children;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Stage label breadcrumb strip */}
      <div
        style={{
          padding: '5px 20px',
          background: SHELL.PAPER_SOFT,
          borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          height: 28,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: SHELL.INK_MUTED,
            lineHeight: 1,
          }}
        >
          {shape.stageLabel}
        </span>
        {shape.isGateStage && (
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 8.5,
              letterSpacing: '0.08em',
              color: SHELL.PEACH_TEXT,
              background: SHELL.PEACH_BG,
              padding: '2px 7px',
              borderRadius: 8,
              lineHeight: 1,
            }}
          >
            Gate stage
          </span>
        )}
      </div>

      {/* Primary slot — fills available space */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {primaryContent}
      </div>

      {/* Secondary artifact — optional, rendered below primary */}
      {shape.secondaryArtifact && (
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
            maxHeight: '40%',
            overflowY: 'auto',
          }}
        >
          {shape.secondaryArtifact}
        </div>
      )}

      {/* Stage transition affordance — pinned at bottom */}
      {shape.stageTransitionAffordance && (
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${SHELL.CARD_LINE}`,
            padding: '12px 20px',
            background: SHELL.PAPER,
          }}
        >
          {shape.stageTransitionAffordance}
        </div>
      )}
    </div>
  );
}
