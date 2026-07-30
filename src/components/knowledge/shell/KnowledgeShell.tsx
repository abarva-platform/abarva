"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { EvidenceDrawer } from "../EvidenceDrawer";
import { AvaDock } from "../ava/AvaDock";
import { ModuleHandoffModal } from "../handoff/ModuleHandoffModal";
import { ModuleSwitcher } from "./ModuleSwitcher";
import { LensPicker } from "./LensPicker";
import { ModeTabs } from "./ModeTabs";
import { ConditionBanner } from "./ConditionBanner";
import { BriefMode } from "../brief/BriefMode";
import { ExploreMode } from "../explore/ExploreMode";
import { RelationshipsMode } from "../relationships/RelationshipsMode";
import { EvidenceMode } from "../evidence/EvidenceMode";

/**
 * Top-level page chrome: module switcher, lens picker, mode tabs, aVa dock
 * toggle, condition banner, plus the globally-mounted evidence drawer and
 * handoff modal (both driven off knowledge-app-context so any mode can open
 * them without prop-drilling). This is a standalone product shell rather than
 * nested inside the shared AppShell -- the Knowledge prototype's own design
 * is a self-contained page with its own dense chrome (module switcher, lens
 * picker, four-position aVa dock), which AppShell's generic top bar does not
 * model. Documented as a deliberate choice, not an oversight.
 */
export function KnowledgeShell() {
  const { mode, dockPosition, dockState, drawer, closeDrawer, tenantKey } =
    useKnowledgeApp();

  const dockIsSide =
    dockState !== "hidden" &&
    (dockPosition === "left" || dockPosition === "right");
  const dockIsBottom = dockState !== "hidden" && dockPosition === "bottom";

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-[#faf7f1]">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1a3a] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-6">
          <span className="text-sm font-semibold text-white">AbarVa</span>
          <ModuleSwitcher />
        </div>
        <div className="shrink-0 text-xs text-white/60">{tenantKey}</div>
      </header>

      <div className="flex min-w-0 flex-col gap-2 border-b border-[rgba(10,10,11,0.1)] bg-white px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <LensPicker />
        <ModeTabs />
      </div>

      <ConditionBanner />

      <div
        className={`flex min-w-0 flex-1 overflow-x-hidden ${
          dockIsBottom ? "flex-col" : "flex-col xl:flex-row"
        }`}
      >
        <main
          className={`min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 ${dockPosition === "left" && dockIsSide ? "xl:order-2" : "order-1"}`}
        >
          {mode === "brief" ? <BriefMode /> : null}
          {mode === "explore" ? <ExploreMode /> : null}
          {mode === "relationships" ? <RelationshipsMode /> : null}
          {mode === "evidence" ? <EvidenceMode /> : null}
        </main>
        <div
          className={
            dockPosition === "left" && dockIsSide ? "order-2 xl:order-1" : "order-2"
          }
        >
          <AvaDock />
        </div>
      </div>

      <EvidenceDrawer
        open={Boolean(drawer)}
        onClose={closeDrawer}
        kind={drawer?.kind ?? ""}
        title={drawer?.title ?? ""}
        subtitle={drawer?.subtitle}
        attributes={drawer?.attributes}
        evidence={drawer?.evidence ?? []}
        gaps={drawer?.gaps}
        entityId={drawer?.entityId}
        onAskAva={() => {
          closeDrawer();
        }}
        onRequestAccess={() => {
          // Access-request routing is not built yet -- closing the drawer here
          // is honest about that rather than pretending a request was filed.
          closeDrawer();
        }}
      />

      <ModuleHandoffModal />
    </div>
  );
}
