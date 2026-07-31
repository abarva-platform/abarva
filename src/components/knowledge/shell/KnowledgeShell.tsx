"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { EvidenceDrawer } from "../EvidenceDrawer";
import { AvaDock } from "../ava/AvaDock";
import { ModuleHandoffModal } from "../handoff/ModuleHandoffModal";
import { LensPicker } from "./LensPicker";
import { ModeTabs } from "./ModeTabs";
import { ConditionBanner } from "./ConditionBanner";
import { BriefMode } from "../brief/BriefMode";
import { ExploreMode } from "../explore/ExploreMode";
import { RelationshipsMode } from "../relationships/RelationshipsMode";
import { EvidenceMode } from "../evidence/EvidenceMode";

/**
 * Top-level Knowledge page controls. Global product navigation is owned by
 * MaestroChrome/NexusTopNav; this component may render only page controls
 * such as lens, mode tabs, dock, drawer, and handoff modal.
 */
export function KnowledgeShell() {
  const { mode, dockPosition, dockState, drawer, closeDrawer } = useKnowledgeApp();

  const dockIsSide =
    dockState !== "hidden" &&
    (dockPosition === "left" || dockPosition === "right");
  const dockIsBottom = dockState !== "hidden" && dockPosition === "bottom";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden bg-[#faf7f1]">
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
