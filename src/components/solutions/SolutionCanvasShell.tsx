// SolutionCanvasShell.tsx — SOL10
//
// Server Component shell for the Solution Canvas surface.
// Renders the outer chrome: breadcrumbs, header metadata card, and
// tab strip. The slot for the canvas content (SolutionCanvas / SOL11)
// is passed as children.
//
// Server-only: no 'use client', no React hooks, no local hex literals,
// no font literals — every visual token resolves through the AbarVa
// design system.

import type { CSSProperties, ReactNode } from 'react';
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  TYPE,
} from '@/lib/design/abarva-theme';
import {
  buildSolutionCanvasShellView,
  getActiveTabItem,
  getEnabledTabs,
  type CanvasShellTab,
  type CanvasShellLoadState,
  type CanvasShellMetadata,
} from '@/lib/solutions/solution-canvas-shell-view';

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageWrapStyle: CSSProperties = {
  fontFamily: FONT.body,
  color: COLORS.ink,
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING.lg,
};

const breadcrumbRowStyle: CSSProperties = {
  display: 'flex',
  gap: SPACING.xs,
  alignItems: 'center',
  ...TYPE.caption,
  color: COLORS.muted,
};

const breadcrumbSepStyle: CSSProperties = {
  color: COLORS.muted,
};

const breadcrumbLinkStyle: CSSProperties = {
  color: COLORS.muted,
  textDecoration: 'none',
};

const breadcrumbCurrentStyle: CSSProperties = {
  color: COLORS.ink,
};

const headerCardStyle: CSSProperties = {
  background: COLORS.card,
  border: BORDER.hairline,
  borderRadius: RADIUS.md,
  padding: SPACING.xl,
  display: 'grid',
  gap: SPACING.xs,
};

const eyebrowStyle: CSSProperties = {
  ...TYPE.eyebrow,
  color: COLORS.navy,
};

const titleStyle: CSSProperties = {
  ...TYPE.h2,
  margin: 0,
};

const metaRowStyle: CSSProperties = {
  display: 'flex',
  gap: SPACING.md,
  ...TYPE.caption,
  color: COLORS.muted,
};

const tabStripStyle: CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: BORDER.hairline,
};

const tabStyle = (isActive: boolean, isDisabled: boolean): CSSProperties => ({
  ...TYPE.body,
  fontWeight: isActive ? 600 : 400,
  color: isActive ? COLORS.ink : isDisabled ? COLORS.muted : COLORS.ink,
  borderBottom: isActive ? `2px solid ${COLORS.ink}` : '2px solid transparent',
  cursor: isDisabled ? 'not-allowed' : 'pointer',
  opacity: isDisabled ? 0.4 : 1,
  textDecoration: 'none',
  background: 'none',
  border: 'none',
  paddingTop: SPACING.sm,
  paddingBottom: SPACING.sm,
  paddingLeft: SPACING.md,
  paddingRight: SPACING.md,
  whiteSpace: 'nowrap',
});

const emptyStateStyle: CSSProperties = {
  background: COLORS.card,
  border: BORDER.hairline,
  borderRadius: RADIUS.md,
  padding: SPACING.xxl,
  textAlign: 'center',
  display: 'grid',
  gap: SPACING.sm,
  justifyItems: 'center',
};

const emptyHeadlineStyle: CSSProperties = {
  ...TYPE.h3,
  margin: 0,
};

const emptySubtextStyle: CSSProperties = {
  ...TYPE.body,
  color: COLORS.muted,
  maxWidth: 480,
};

const ctaButtonStyle: CSSProperties = {
  display: 'inline-block',
  padding: `${SPACING.sm} ${SPACING.lg}`,
  background: COLORS.ink,
  borderRadius: RADIUS.sm,
  textDecoration: 'none',
  ...TYPE.body,
  color: COLORS.surface,
  fontWeight: 600,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface BreadcrumbProps {
  label: string;
  href: string | null;
  isCurrent: boolean;
}

function Breadcrumb({ label, href, isCurrent }: BreadcrumbProps) {
  if (isCurrent || href === null) {
    return <span style={breadcrumbCurrentStyle}>{label}</span>;
  }
  return (
    <a href={href} style={breadcrumbLinkStyle}>
      {label}
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SolutionCanvasShellProps {
  title: string;
  solutionSlug: string;
  activeTab?: CanvasShellTab;
  loadState?: CanvasShellLoadState;
  metadata?: Partial<CanvasShellMetadata>;
  basePath?: string;
  children?: ReactNode;
}

export default function SolutionCanvasShell({
  title,
  solutionSlug,
  activeTab = 'canvas',
  loadState = 'loaded',
  metadata,
  basePath = '/solutions',
  children,
}: SolutionCanvasShellProps) {
  const view = buildSolutionCanvasShellView(
    title,
    solutionSlug,
    activeTab,
    loadState,
    metadata,
    basePath,
  );

  const activeTabItem = getActiveTabItem(view);
  const enabledTabs = getEnabledTabs(view);

  return (
    <div style={pageWrapStyle}>
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" style={breadcrumbRowStyle}>
        {view.breadcrumbs.map((crumb, i) => (
          <span key={crumb.label} style={{ display: 'contents' }}>
            {i > 0 && <span style={breadcrumbSepStyle}>/</span>}
            <Breadcrumb
              label={crumb.label}
              href={crumb.href}
              isCurrent={crumb.isCurrent}
            />
          </span>
        ))}
      </nav>

      {/* Header card */}
      <div style={headerCardStyle}>
        <span style={eyebrowStyle}>{view.metadata.solutionTypeLabel}</span>
        <h1 style={titleStyle}>{view.title}</h1>
        <div style={metaRowStyle}>
          {view.metadata.archetypeLabel && (
            <span>Archetype: {view.metadata.archetypeLabel}</span>
          )}
          <span>Owner: {view.metadata.ownerLabel}</span>
        </div>
      </div>

      {/* Tab strip */}
      <nav aria-label="Solution canvas navigation" style={tabStripStyle}>
        {view.tabs.map((tab) =>
          tab.isDisabled ? (
            <span
              key={tab.tab}
              style={tabStyle(tab.isActive, tab.isDisabled)}
              aria-disabled="true"
              title={tab.disabledReason ?? undefined}
            >
              {tab.label}
            </span>
          ) : (
            <a
              key={tab.tab}
              href={tab.href}
              style={tabStyle(tab.isActive, false)}
              aria-current={tab.isActive ? 'page' : undefined}
            >
              {tab.label}
            </a>
          ),
        )}
      </nav>

      {/* Content slot */}
      {view.loadState === 'empty' ? (
        <div style={emptyStateStyle}>
          <p style={emptyHeadlineStyle}>{view.emptyState.headline}</p>
          <p style={emptySubtextStyle}>{view.emptyState.subtext}</p>
          <a href={view.emptyState.ctaHref} style={ctaButtonStyle}>
            {view.emptyState.ctaLabel}
          </a>
        </div>
      ) : view.loadState === 'error' ? (
        <div style={emptyStateStyle}>
          <p style={emptyHeadlineStyle}>Unable to load canvas</p>
          <p style={emptySubtextStyle}>
            The solution canvas could not be loaded. Please try refreshing the
            page or contact your Steward.
          </p>
        </div>
      ) : (
        children
      )}

      {/* Disabled tab hint (shown only when a deferred tab is active) */}
      {activeTabItem?.isDisabled === true && (
        <div style={{ ...emptyStateStyle, paddingTop: SPACING.lg, paddingBottom: SPACING.lg }}>
          <p style={emptySubtextStyle}>
            {activeTabItem.disabledReason ??
              'This surface is not yet available.'}
          </p>
        </div>
      )}
    </div>
  );
}
