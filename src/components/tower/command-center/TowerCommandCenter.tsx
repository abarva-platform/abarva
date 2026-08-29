"use client";

// Tower Command Center v2 — client root.
//
// Owns tab state, per-tab sub-view state and drawer state, and renders the
// standing header + tab bar + body region transcribed from the design shell
// (design file lines 519–550).
//
// Note what this component does NOT do: it never sets `100vh`. AppShell already
// owns the fixed viewport; the design's `.app { height:100vh }` rule is the one
// rule deliberately dropped (see the CSS module header).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatCount } from "@/lib/tower/command-center/format";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";

import { AiInitiativeDrawer } from "./drawers/AiInitiativeDrawer";
import { ActionDrawer } from "./drawers/ActionDrawer";
import { EvidenceGapDrawer } from "./drawers/EvidenceGapDrawer";
import { ProgramDrawer } from "./drawers/ProgramDrawer";
import { cx } from "./primitives";
import styles from "./TowerCommandCenter.module.css";
import { CommandCenterView } from "./views/CommandCenterView";
import { BudgetDomainPanel } from "./views/BudgetDomainPanel";
import { BudgetShapePanel } from "./views/BudgetShapePanel";
import { ConstraintPanel } from "./views/ConstraintPanel";
import { FoundationsPanel } from "./views/FoundationsPanel";
import { InitiativesDistributionPanel } from "./views/InitiativesDistributionPanel";
import { InitiativesTablePanel } from "./views/InitiativesTablePanel";
import { QueueOwnerPanel } from "./views/QueueOwnerPanel";
import { ToolsTablePanel } from "./views/ToolsTablePanel";
import { ToolsVendorPanel } from "./views/ToolsVendorPanel";
import { VerdictPanel } from "./views/VerdictPanel";
import {
  AiPortfolioContractView,
  EvidenceActionsContractView,
  ValueProofContractView,
} from "./views/ContractTabs";

/**
 * The six tabs of the approved design, replacing the four the shell shipped with.
 *
 * The tab *chrome* is untouched — same grid, 6px gap and radius, #f1efe8 resting and #0f6e56
 * filled, 14.5px 500 to 700, 120ms transition. Only the set and the labels change, from surface
 * names to the questions a CXO is actually asking.
 *
 * Every old tab id still resolves through TAB_ALIASES, so existing links and the sunset URLs keep
 * working rather than silently landing on the default.
 */
export type TowerTab =
  | "verdict"
  | "budget"
  | "initiatives"
  | "tools"
  | "decisions"
  | "foundations";

const TABS: ReadonlyArray<{ id: TowerTab; label: string }> = [
  { id: "verdict", label: "Today's verdict" },
  { id: "budget", label: "Where the money goes" },
  { id: "initiatives", label: "AI bets" },
  { id: "tools", label: "Tools" },
  { id: "decisions", label: "What must happen next" },
  { id: "foundations", label: "Foundations" },
];

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

const TAB_ALIASES: Readonly<Record<string, TowerTab>> = {
  // Pre-redesign ids, kept so existing links and the sunset URLs still land somewhere sensible.
  actions: "decisions",
  ai: "initiatives",
  command: "verdict",
  decision_lanes: "initiatives",
  evidence: "decisions",
  executive: "verdict",
  funnel: "initiatives",
  lanes: "initiatives",
  recommended_actions: "decisions",
  value: "initiatives",
  value_proof: "initiatives",
};

/**
 * Sub-tabs within a tab. The design nests panels this way, and the nesting is information: a tab
 * is a question, and its sub-tabs are the ways of answering it. Tabs with a single panel declare
 * no sub-tabs and render it directly.
 */
type SubTab = { readonly id: string; readonly label: string };

const SUB_TABS: Readonly<Record<TowerTab, readonly SubTab[]>> = {
  verdict: [],
  budget: [
    { id: "shape", label: "Run, change, transform" },
    { id: "domain", label: "By domain" },
  ],
  initiatives: [
    { id: "constraint", label: "What blocks value" },
    { id: "table", label: "All cases" },
    { id: "distribution", label: "Distribution" },
    { id: "proof", label: "Value proof" },
  ],
  tools: [
    { id: "rollouts", label: "Rollouts" },
    { id: "vendor", label: "Vendor exposure" },
    { id: "portfolio", label: "AI portfolio" },
  ],
  decisions: [
    // CommandCenterView carries the decision rail and the value-loss waterfall. The design puts
    // decisions under their own tab rather than on the verdict, so this is where it lives now.
    { id: "review", label: "Decisions for this review" },
    { id: "queue", label: "Evidence queue" },
    { id: "owner", label: "By owner" },
  ],
  foundations: [],
};

function defaultSubTab(tab: TowerTab): string {
  return SUB_TABS[tab][0]?.id ?? "";
}

function normalizeTowerTab(raw: string | null | undefined): TowerTab {
  if (raw && TAB_IDS.has(raw)) return raw as TowerTab;
  if (raw && TAB_ALIASES[raw]) return TAB_ALIASES[raw];
  return "verdict";
}

type DrawerState =
  | { kind: "program"; id: string }
  | { kind: "ai"; n: number }
  | { kind: "gap"; id: string }
  | { kind: "action"; id: string }
  | null;

export function TowerCommandCenter({
  view,
  tenantName,
}: {
  /** `null` when the tenant has no governed Tower mart rows. */
  view: TowerCommandCenterView | null;
  tenantName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab = searchParams?.get("tab");
  const [tab, setTab] = useState<TowerTab>(normalizeTowerTab(urlTab));
  // Sub-tab is per-tab and resets on tab change, so a tab never opens on a panel from another one.
  const [subTab, setSubTab] = useState<string>(() =>
    defaultSubTab(normalizeTowerTab(urlTab)),
  );
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Starts null so the first run always evaluates: a stale alias in the URL must be normalised
  // once. After that the raw value is remembered, so the effect is idempotent per URL value.
  const syncedUrlTabRef = useRef<string | null>(null);

  // Reflect the active tab in `?tab=` so a link can deep-link into a tab and an
  // E2E spec can address one directly. Sub-view / filter / question stay client
  // state, exactly as the design has them.
  const goToTab = useCallback(
    (next: TowerTab) => {
      setTab(next);
      setSubTab(defaultSubTab(next));
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("tab", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // A tab landed on from the URL (back/forward, or a pasted link) must win.
  useEffect(() => {
    if (!urlTab) {
      syncedUrlTabRef.current = null;
      return;
    }
    const normalized = normalizeTowerTab(urlTab);
    // Track the RAW url value, not the normalized one. With aliases, a stale id like `executive`
    // never equals its normalized form, so a guard comparing normalized values never early-returns
    // — and because `useRouter()` hands back a new object each render, the effect re-fires and
    // resets the tab on every render, making the page unclickable from any old link.
    if (urlTab === syncedUrlTabRef.current) return;
    syncedUrlTabRef.current = urlTab;
    setTab((current) => (current === normalized ? current : normalized));
    if (urlTab !== normalized) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("tab", normalized);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams, urlTab]);

  const closeDrawer = useCallback(() => setDrawer(null), []);

  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = TABS.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft")
      nextIndex = index === 0 ? last : index - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = last;
    if (nextIndex === null) return;
    event.preventDefault();
    goToTab(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const selectedProgram = useMemo(
    () =>
      drawer?.kind === "program"
        ? (view?.programs.find((p) => p.id === drawer.id) ?? null)
        : null,
    [drawer, view],
  );
  const selectedAi = useMemo(
    () =>
      drawer?.kind === "ai"
        ? (view?.allInitiatives.find((a) => a.n === drawer.n) ?? null)
        : null,
    [drawer, view],
  );
  const selectedGap = useMemo(
    () =>
      drawer?.kind === "gap"
        ? (view?.gaps.find((g) => g.id === drawer.id) ?? null)
        : null,
    [drawer, view],
  );
  const selectedAction = useMemo(
    () =>
      drawer?.kind === "action"
        ? (view?.actions.find((a) => a.id === drawer.id) ?? null)
        : null,
    [drawer, view],
  );

  const blockedValue = view ? view.summary.blockedUsd : 0;
  const attention = {
    funnel: blockedValue > 0,
    evidence: (view?.gaps.length ?? 0) > 0,
  };

  const body = (() => {
    if (!view) {
      return (
        <div className={styles.view}>
          <div className={styles.emptyPanel}>
            <h2>No governed Tower data for this tenant</h2>
            <p>
              The <code>cio_tower.mart_*</code> read models carry no rows for{" "}
              {tenantName}. This page renders nothing rather than showing zeros
              — a zero would be a claim that the budget, promised value and
              claimable value are all nil, which is not what absent data means.
              Run the Tower mart projection job for this tenant to populate it.
            </p>
          </div>
        </div>
      );
    }

    const sub = subTab || defaultSubTab(tab);

    switch (tab) {
      case "budget":
        return sub === "domain" ? (
          <BudgetDomainPanel view={view} />
        ) : (
          <BudgetShapePanel view={view} />
        );
      case "initiatives":
        if (sub === "table") return <InitiativesTablePanel view={view} />;
        if (sub === "distribution")
          return <InitiativesDistributionPanel view={view} />;
        if (sub === "proof")
          return (
            <ValueProofContractView
              view={view}
              onOpenProgram={(id) => setDrawer({ kind: "program", id })}
            />
          );
        return <ConstraintPanel view={view} />;
      case "tools":
        if (sub === "vendor") return <ToolsVendorPanel view={view} />;
        if (sub === "portfolio")
          return (
            <AiPortfolioContractView
              view={view}
              onOpenAi={(n) => setDrawer({ kind: "ai", n })}
              onOpenAction={(id) => setDrawer({ kind: "action", id })}
              onOpenGap={(id) => setDrawer({ kind: "gap", id })}
            />
          );
        return <ToolsTablePanel view={view} />;
      case "decisions":
        if (sub === "owner") return <QueueOwnerPanel view={view} />;
        if (sub === "review")
          return (
            <CommandCenterView
              view={view}
              onOpenGap={(id) => setDrawer({ kind: "gap", id })}
              onGoToFunnel={() => goToTab("initiatives")}
              onGoToAi={() => goToTab("tools")}
              onGoToActions={() => goToTab("decisions")}
            />
          );
        return (
          <EvidenceActionsContractView
            view={view}
            onOpenAction={(id) => setDrawer({ kind: "action", id })}
            onOpenGap={(id) => setDrawer({ kind: "gap", id })}
          />
        );
      case "foundations":
        return <FoundationsPanel view={view} />;
      case "verdict":
      default:
        return <VerdictPanel view={view} />;
    }
  })();

  return (
    <div className={styles.root} data-testid="tower-command-center">
      <div className={styles.stage}>
        <div className={cx(styles.wrap, styles.executiveTabsShell)}>
          <nav
            className={styles.executiveTabs}
            role="tablist"
            aria-label="Tower Command Center sections"
          >
            {TABS.map((t, i) => {
              const selected = t.id === tab;
              const count =
                t.id === "initiatives"
                  ? (view?.summary.valueClaimCount ?? null)
                  : t.id === "tools"
                    ? (view?.summary.aiInitiativeCount ??
                      view?.ai.length ??
                      null)
                    : t.id === "decisions"
                      ? (view?.actions.length ?? null)
                      : null;
              const attn =
                (t.id === "initiatives" && attention.funnel) ||
                (t.id === "decisions" && attention.evidence);
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tcc-tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls="tcc-panel"
                  tabIndex={selected ? 0 : -1}
                  className={cx(styles.executiveTab, selected && styles.on)}
                  onClick={() => goToTab(t.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                >
                  {t.label}
                  {count !== null ? (
                    <span className={styles.tnum}>{formatCount(count)}</span>
                  ) : null}
                  {attn ? (
                    <>
                      <span className={styles.adot} aria-hidden />
                      <span className={styles.srOnly}>needs attention</span>
                    </>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        <div className={styles.bodyregion}>
          <div className={styles.wrap}>
            <div
              id="tcc-panel"
              role="tabpanel"
              aria-labelledby={`tcc-tab-${tab}`}
              tabIndex={-1}
              style={{ height: "100%" }}
            >
              {SUB_TABS[tab].length > 0 ? (
                <nav
                  className={styles.contractSegments}
                  role="tablist"
                  aria-label={`${TABS.find((t) => t.id === tab)?.label ?? "Tower"} views`}
                >
                  {SUB_TABS[tab].map((st) => {
                    const on = (subTab || defaultSubTab(tab)) === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        className={cx(on && styles.segmentOn)}
                        onClick={() => setSubTab(st.id)}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </nav>
              ) : null}
              {body}
            </div>
          </div>
        </div>
      </div>

      <ProgramDrawer
        program={selectedProgram}
        onClose={closeDrawer}
        onSeeAction={() => {
          closeDrawer();
          goToTab("decisions");
        }}
      />
      <AiInitiativeDrawer item={selectedAi} onClose={closeDrawer} />
      <EvidenceGapDrawer
        gap={selectedGap}
        onClose={closeDrawer}
        onRouteToAction={() => {
          closeDrawer();
          goToTab("decisions");
        }}
      />
      {/* canRoute stays false until a governed Tower → Moves create path exists.
          See the header comment in ActionDrawer.tsx. */}
      <ActionDrawer
        action={selectedAction}
        canRoute={false}
        onClose={closeDrawer}
      />
    </div>
  );
}
