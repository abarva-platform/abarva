"use client";

import { usePathname } from "next/navigation";
import { SubNavStrip } from "@/components/shell/SubNavStrip";
import { SHELL } from "@/lib/shell/shell-tokens";
import { isSourceIaV2 } from "@/lib/source/source-ia-v2";

/**
 * Source surface secondary navigation — a Snowflake-style sticky strip that
 * sits directly below the main product nav so the top-level Source views are
 * one click apart.
 *
 * Why this exists: the Source redesign made `/source` redirect straight to
 * `/source/queue` (the Decision Queue). That orphaned the sourcing-events
 * portfolio at `/source/events` — it still works, but nothing in the Source
 * UI linked to it. This strip restores that path.
 *
 * Three tabs, deliberately lean (the redesign's whole point was a *less* busy
 * Source). Renewals are intentionally absent — they have no standalone index
 * route and are surfaced as cards inside the Queue.
 */

interface SourceSubNavTab {
  key: string;
  label: string;
  href: string;
}

/**
 * Legacy three-tab set (IA v1). Retained for `NEXT_PUBLIC_SOURCE_IA_V2=0`
 * rollback. Queue + Events + Portfolio are three peer views of the same event
 * set — the overlap the audit flagged.
 */
export const SOURCE_SUBNAV_TABS: readonly SourceSubNavTab[] = [
  { key: "queue", label: "Queue", href: "/source/queue" },
  { key: "events", label: "Events", href: "/source/events" },
  { key: "capabilities", label: "Capabilities", href: "/source/capabilities" },
  { key: "portfolio", label: "Portfolio", href: "/source/portfolio" },
] as const;

/**
 * IA v2 (audit 2026-06-03, Tier 1): two surfaces. "Decisions" is the act-mode
 * Decision Queue (the landing); "Portfolio" is the analyze-mode event table
 * (which absorbs the retired Events surface). Default tab set.
 */
export const SOURCE_SUBNAV_TABS_V2: readonly SourceSubNavTab[] = [
  { key: "queue", label: "Decisions", href: "/source/queue" },
  { key: "approvals", label: "Approvals", href: "/source/approvals" },
  { key: "portfolio", label: "Portfolio", href: "/source/portfolio" },
  { key: "capabilities", label: "Capabilities", href: "/source/capabilities" },
  // "Deliverables" removed as a top-nav destination: generating a deliverable
  // detached from any event is the context-free anti-pattern the Workspace
  // reset replaces. Deliverables are now generated in-event-context via the
  // event's Generate chip + the per-event Workspace/Document Explorer.
  { key: "setup", label: "Setup", href: "/source/setup" },
] as const;

/** The tab set in effect for the current IA flag state. */
export function activeSourceSubNavTabs(): readonly SourceSubNavTab[] {
  return isSourceIaV2() ? SOURCE_SUBNAV_TABS_V2 : SOURCE_SUBNAV_TABS;
}

/**
 * Resolve which tab is active for a given pathname.
 *
 * A tab is active when the pathname starts with its href, so detail routes
 * such as `/source/events/[eventId]` keep the "Events" tab lit. The longest
 * matching href wins (defensive — the three canonical hrefs do not nest, but
 * this keeps the rule robust if tabs are ever added).
 *
 * Renewal cockpit routes (`/source/renewal/...`) and any other Source path
 * with no matching tab fall back to "queue", since renewals belong to the
 * Decision Queue.
 *
 * Exported for unit testing.
 */
export function resolveActiveSourceTab(
  pathname: string | null | undefined,
): string {
  const path = pathname ?? "";
  // IA v2: event-detail pages (/source/events/[eventId]) belong to the
  // Portfolio surface, since the standalone Events index folded into it.
  if (
    isSourceIaV2() &&
    (path === "/source/events" || path.startsWith("/source/events/"))
  ) {
    return "portfolio";
  }
  let bestKey = "queue";
  let bestLen = -1;
  for (const tab of activeSourceSubNavTabs()) {
    if (
      (path === tab.href || path.startsWith(tab.href + "/")) &&
      tab.href.length > bestLen
    ) {
      bestKey = tab.key;
      bestLen = tab.href.length;
    }
  }
  return bestKey;
}

export function SourceSubNav() {
  const pathname = usePathname();
  const activeKey = resolveActiveSourceTab(pathname);

  const items = activeSourceSubNavTabs().map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: tab.href,
    active: tab.key === activeKey,
  }));

  return (
    <nav
      aria-label="Source sections"
      style={{
        minHeight: 44,
        background: SHELL.PAPER_SOFT,
        borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "0 24px",
        gap: 18,
        flexShrink: 0,
      }}
    >
      {/* Section name, left */}
      <span
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: SHELL.INK_MUTED,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        Source
      </span>

      {/* Tab links, right */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <SubNavStrip items={items} />
      </div>
    </nav>
  );
}
