"use client";

/**
 * Retired Source secondary navigation.
 *
 * The old top-right Source strip (Decisions / Approvals / Portfolio /
 * Capabilities / Setup) predates the event shell redesign and now creates a
 * second workflow model beside the left journey rail. Keep this compatibility
 * module so older pages do not need a broad import cleanup, but render no UI.
 * Supported Source navigation now lives in:
 *   - the portfolio/book page for event discovery;
 *   - the event shell left rail for stage/workspace movement;
 *   - explicit route links for approvals, files, and setup actions.
 */

interface SourceSubNavTab {
  key: string;
  label: string;
  href: string;
}

export const SOURCE_SUBNAV_TABS: readonly SourceSubNavTab[] = [] as const;
export const SOURCE_SUBNAV_TABS_V2: readonly SourceSubNavTab[] = [] as const;

export function activeSourceSubNavTabs(): readonly SourceSubNavTab[] {
  return [];
}

export function resolveActiveSourceTab(
  pathname: string | null | undefined,
): string {
  void pathname;
  return "archived";
}

export function SourceSubNav() {
  return null;
}
