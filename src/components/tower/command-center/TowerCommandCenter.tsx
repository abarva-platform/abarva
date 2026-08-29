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
import {
  AiPortfolioContractView,
  EvidenceActionsContractView,
  ValueProofContractView,
} from "./views/ContractTabs";

export type TowerTab = "executive" | "funnel" | "ai" | "actions";

const TABS: ReadonlyArray<{ id: TowerTab; label: string }> = [
  { id: "executive", label: "Executive View" },
  { id: "funnel", label: "Value Proof" },
  { id: "ai", label: "AI Portfolio" },
  { id: "actions", label: "Evidence & Actions" },
];

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

const TAB_ALIASES: Readonly<Record<string, TowerTab>> = {
  ai: "ai",
  command: "executive",
  decision_lanes: "funnel",
  evidence: "actions",
  executive: "executive",
  funnel: "funnel",
  lanes: "funnel",
  recommended_actions: "actions",
  value: "funnel",
  value_proof: "funnel",
  actions: "actions",
};

function normalizeTowerTab(raw: string | null | undefined): TowerTab {
  if (raw && TAB_IDS.has(raw)) return raw as TowerTab;
  if (raw && TAB_ALIASES[raw]) return TAB_ALIASES[raw];
  return "executive";
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
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const syncedUrlTabRef = useRef<string | null>(urlTab ?? null);

  // Reflect the active tab in `?tab=` so a link can deep-link into a tab and an
  // E2E spec can address one directly. Sub-view / filter / question stay client
  // state, exactly as the design has them.
  const goToTab = useCallback(
    (next: TowerTab) => {
      setTab(next);
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
    if (urlTab === normalized && urlTab === syncedUrlTabRef.current) return;
    syncedUrlTabRef.current = normalized;
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

    switch (tab) {
      case "funnel":
        return (
          <ValueProofContractView
            view={view}
            onOpenProgram={(id) => setDrawer({ kind: "program", id })}
          />
        );
      case "ai":
        return (
          <AiPortfolioContractView
            view={view}
            onOpenAi={(n) => setDrawer({ kind: "ai", n })}
            onOpenAction={(id) => setDrawer({ kind: "action", id })}
            onOpenGap={(id) => setDrawer({ kind: "gap", id })}
          />
        );
      case "actions":
        return (
          <EvidenceActionsContractView
            view={view}
            onOpenAction={(id) => setDrawer({ kind: "action", id })}
            onOpenGap={(id) => setDrawer({ kind: "gap", id })}
          />
        );
      case "executive":
      default:
        return (
          <CommandCenterView
            view={view}
            onOpenGap={(id) => setDrawer({ kind: "gap", id })}
            onGoToFunnel={() => goToTab("funnel")}
            onGoToAi={() => goToTab("ai")}
            onGoToActions={() => goToTab("actions")}
          />
        );
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
                t.id === "funnel"
                  ? view
                    ? view.summary.valueClaimCount
                    : null
                  : t.id === "ai"
                    ? (view?.summary.aiInitiativeCount ??
                      view?.ai.length ??
                      null)
                    : t.id === "actions"
                      ? (view?.actions.length ?? null)
                      : null;
              const attn =
                (t.id === "funnel" && attention.funnel) ||
                (t.id === "actions" && attention.evidence);
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
          goToTab("actions");
        }}
      />
      <AiInitiativeDrawer item={selectedAi} onClose={closeDrawer} />
      <EvidenceGapDrawer
        gap={selectedGap}
        onClose={closeDrawer}
        onRouteToAction={() => {
          closeDrawer();
          goToTab("actions");
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
