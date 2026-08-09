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
import { usePathname, useSearchParams } from "next/navigation";

import { formatCount } from "@/lib/tower/command-center/format";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";

import { AiInitiativeDrawer } from "./drawers/AiInitiativeDrawer";
import { ActionDrawer } from "./drawers/ActionDrawer";
import { EvidenceGapDrawer } from "./drawers/EvidenceGapDrawer";
import { ProgramDrawer } from "./drawers/ProgramDrawer";
import { Dot, cx } from "./primitives";
import styles from "./TowerCommandCenter.module.css";
import {
  CommandCenterView,
  commandCenterAttention,
} from "./views/CommandCenterView";
import {
  AiPortfolioView,
  type AiFilter,
  type AiSubView,
} from "./views/AiPortfolioView";
import {
  DecisionLanesView,
  type LanesSubView,
} from "./views/DecisionLanesView";
import { EvidenceView, type EvidenceQuestion } from "./views/EvidenceView";
import { RecommendedActionsView } from "./views/RecommendedActionsView";
import { ValueProofView } from "./views/ValueProofView";

export type TowerTab =
  | "command"
  | "funnel"
  | "lanes"
  | "ai"
  | "evidence"
  | "actions";

const TABS: ReadonlyArray<{ id: TowerTab; label: string }> = [
  { id: "command", label: "Command Center" },
  { id: "funnel", label: "Value Proof" },
  { id: "lanes", label: "Decision Lanes" },
  { id: "ai", label: "AI Portfolio" },
  { id: "evidence", label: "Evidence" },
  { id: "actions", label: "Recommended Actions" },
];

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

type DrawerState =
  | { kind: "program"; id: string }
  | { kind: "ai"; n: number }
  | { kind: "gap"; id: string }
  | { kind: "action"; id: string }
  | null;

export function TowerCommandCenter({
  view,
  tenantName,
  refreshedOn,
}: {
  /** `null` when the tenant has no governed Tower read-model rows. */
  view: TowerCommandCenterView | null;
  tenantName: string;
  /** ISO date the Tower read model was read. */
  refreshedOn: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTab = searchParams?.get("tab");
  const [tab, setTab] = useState<TowerTab>(
    urlTab && TAB_IDS.has(urlTab) ? (urlTab as TowerTab) : "command",
  );
  const [lanesView, setLanesView] = useState<LanesSubView>("heatmap");
  const [aiView, setAiView] = useState<AiSubView>("overview");
  const [aiFilter, setAiFilter] = useState<AiFilter>("all");
  const [aiSearch, setAiSearch] = useState("");
  const [evidenceQ, setEvidenceQ] = useState<EvidenceQuestion>("missing");
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Reflect the active tab in `?tab=` so a link can deep-link into a tab and an
  // E2E spec can address one directly. This is local UI state, so use the
  // browser history API instead of App Router navigation; otherwise rapid tab
  // clicks can let older `router.replace` responses arrive late and snap the
  // visible tab backward.
  const goToTab = useCallback(
    (next: TowerTab) => {
      setTab(next);
      const params = new URLSearchParams(
        typeof window === "undefined"
          ? (searchParams?.toString() ?? "")
          : window.location.search,
      );
      params.set("tab", next);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `${pathname}?${params}`);
      }
    },
    [pathname, searchParams],
  );

  // A tab landed on from the URL (back/forward, or a pasted link) must win.
  useEffect(() => {
    if (urlTab && TAB_IDS.has(urlTab) && urlTab !== tab)
      setTab(urlTab as TowerTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab]);

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
        ? (view?.ai.find((a) => a.n === drawer.n) ?? null)
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
  const headerScope = view
    ? `${formatCount(view.summary.boardScopeProgramCount)} board-scope value cases · ${formatCount(view.summary.totalProgramSubjectCount)} tracked program subjects · ${formatCount(view.summary.aiInitiativeCount)} AI tools, agents and linked capabilities`
    : "no governed rows";

  const body = (() => {
    if (!view) {
      return (
        <div className={styles.view}>
          <div className={styles.emptyPanel}>
            <h2>No governed Tower data for this tenant</h2>
            <p>
              The <code>tower</code> read model carries no rows for {tenantName}
              . This page renders nothing rather than showing zeros — a zero
              would be a claim that the budget, promised value and claimable
              value are all nil, which is not what absent data means. Load
              governed Tower metric observations, claims and provenance for this
              tenant to populate it.
            </p>
          </div>
        </div>
      );
    }

    switch (tab) {
      case "funnel":
        return (
          <ValueProofView
            view={view}
            onOpenProgram={(id) => setDrawer({ kind: "program", id })}
          />
        );
      case "lanes":
        return (
          <DecisionLanesView
            view={view}
            subView={lanesView}
            onSubView={setLanesView}
            onOpenProgram={(id) => setDrawer({ kind: "program", id })}
          />
        );
      case "ai":
        return (
          <AiPortfolioView
            view={view}
            subView={aiView}
            onSubView={setAiView}
            filter={aiFilter}
            onFilter={setAiFilter}
            search={aiSearch}
            onSearch={setAiSearch}
            onOpenAi={(n) => setDrawer({ kind: "ai", n })}
          />
        );
      case "evidence":
        return (
          <EvidenceView
            view={view}
            question={evidenceQ}
            onQuestion={setEvidenceQ}
            onOpenGap={(id) => setDrawer({ kind: "gap", id })}
          />
        );
      case "actions":
        return (
          <RecommendedActionsView
            view={view}
            onOpenAction={(id) => setDrawer({ kind: "action", id })}
          />
        );
      case "command":
      default:
        return (
          <CommandCenterView
            view={view}
            onOpenProgram={(id) => setDrawer({ kind: "program", id })}
            onGoToFunnel={() => goToTab("funnel")}
          />
        );
    }
  })();

  return (
    <div className={styles.root} data-testid="tower-command-center">
      <div className={styles.stage}>
        <div className={cx(styles.wrap, styles.dash)}>
          <div className={styles.dashTop}>
            <div className={styles.dashId}>
              <div className={styles.eyebrow}>
                IT Investment Tower · FY26 · {tenantName}
              </div>
              <h1>
                {view?.summary.decisionQuestion ? (
                  view.summary.decisionQuestion
                ) : (
                  <>
                    Funded ahead of proof.{" "}
                    <span className={styles.thin}>
                      Value is the constraint.
                    </span>
                  </>
                )}
              </h1>
            </div>
            <div className={styles.dashRight}>
              <div className={styles.when}>
                Refreshed {refreshedOn}
                <br />
                {headerScope}
              </div>
              {view && commandCenterAttention(view) ? (
                <div className={styles.flag}>
                  <Dot tone="red" /> Value proof — Critical
                </div>
              ) : null}
            </div>
          </div>

          <nav
            className={styles.tabs}
            role="tablist"
            aria-label="Tower Command Center sections"
          >
            {TABS.map((t, i) => {
              const selected = t.id === tab;
              const count =
                t.id === "actions" ? (view?.actions.length ?? 0) : null;
              const tabLabel =
                t.id === "actions" && count !== null
                  ? `${t.label}, ${formatCount(count)} total evidence actions`
                  : t.label;
              const attn =
                (t.id === "funnel" && attention.funnel) ||
                (t.id === "evidence" && attention.evidence);
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tcc-tab-${t.id}`}
                  aria-label={tabLabel}
                  aria-selected={selected}
                  aria-controls="tcc-panel"
                  tabIndex={selected ? 0 : -1}
                  className={cx(styles.tab, selected && styles.on)}
                  onClick={() => goToTab(t.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                >
                  {t.label}
                  {count !== null ? (
                    <span className={styles.tnum}>
                      {formatCount(count)} total
                    </span>
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
