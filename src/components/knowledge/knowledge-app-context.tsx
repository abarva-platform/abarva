/**
 * Root React context for the Knowledge UI: the governed provider + tenant
 * context (data side) and the page-level UI state -- active mode, lens,
 * aVa dock, evidence drawer -- that every mode/shell component reads from.
 * Kept as one context to avoid prop-drilling through ~40 components; the two
 * concerns (data binding vs. UI chrome state) are still modeled as distinct
 * fields so a component can depend on one without implying the other.
 */
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  GovernedKnowledgeProvider,
  KnowledgeProviderContext,
} from "@/lib/knowledge/providers/governed-knowledge-provider";
import type { EvidenceDrawerAttribute } from "./EvidenceDrawer";
import type { EvidenceRef, KnownGapRef } from "@/lib/knowledge/providers/types";

export type KnowledgeMode = "brief" | "explore" | "relationships" | "evidence";

export type KnowledgeDockPosition = "left" | "right" | "bottom" | "float";
export type KnowledgeDockState = "open" | "rail" | "hidden";

export interface KnowledgeDrawerState {
  readonly kind: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly attributes?: readonly EvidenceDrawerAttribute[];
  readonly evidence: readonly EvidenceRef[];
  readonly gaps?: readonly KnownGapRef[];
  /** Real canonical object id for the row/node this drawer was opened for --
   * when present, the drawer offers a current-vs-target comparison scoped to
   * this exact entity. Omit rather than guess when no real id is available;
   * CurrentVsTargetPanel must never render against a fabricated id. */
  readonly entityId?: string;
}

export interface KnowledgeAppContextValue {
  readonly provider: GovernedKnowledgeProvider;
  readonly providerCtx: KnowledgeProviderContext;

  readonly mode: KnowledgeMode;
  readonly setMode: (mode: KnowledgeMode) => void;

  readonly lensId: string;
  readonly setLensId: (lensId: string) => void;

  readonly exploreInventoryKind: string;
  readonly setExploreInventoryKind: (kind: string) => void;

  readonly relationshipPresetId: string | null;
  readonly setRelationshipPresetId: (id: string | null) => void;
  readonly relationshipHops: 1 | 2;
  readonly setRelationshipHops: (hops: 1 | 2) => void;
  readonly showCandidateRelationships: boolean;
  readonly setShowCandidateRelationships: (v: boolean) => void;
  readonly showTargetState: boolean;
  readonly setShowTargetState: (v: boolean) => void;

  readonly dockPosition: KnowledgeDockPosition;
  readonly setDockPosition: (pos: KnowledgeDockPosition) => void;
  readonly dockState: KnowledgeDockState;
  readonly setDockState: (state: KnowledgeDockState) => void;
  readonly dockLocked: boolean;
  readonly toggleDockLocked: () => void;

  readonly drawer: KnowledgeDrawerState | null;
  readonly openDrawer: (drawer: KnowledgeDrawerState) => void;
  readonly closeDrawer: () => void;

  readonly handoffTarget: string | null;
  readonly openHandoff: (target: string) => void;
  readonly closeHandoff: () => void;
}

const KnowledgeAppContext = createContext<KnowledgeAppContextValue | null>(
  null,
);

export function KnowledgeAppProvider({
  provider,
  providerCtx,
  children,
}: {
  readonly provider: GovernedKnowledgeProvider;
  readonly providerCtx: KnowledgeProviderContext;
  readonly children: ReactNode;
}) {
  const [mode, setMode] = useState<KnowledgeMode>("brief");
  const [lensId, setLensId] = useState("understand");
  const [exploreInventoryKind, setExploreInventoryKind] =
    useState("applications");
  const [relationshipPresetId, setRelationshipPresetId] = useState<
    string | null
  >(null);
  const [relationshipHops, setRelationshipHops] = useState<1 | 2>(1);
  const [showCandidateRelationships, setShowCandidateRelationships] =
    useState(false);
  const [showTargetState, setShowTargetState] = useState(false);
  const [dockPosition, setDockPosition] =
    useState<KnowledgeDockPosition>("right");
  const [dockState, setDockState] = useState<KnowledgeDockState>("rail");
  const [dockLocked, setDockLocked] = useState(false);
  const [drawer, setDrawer] = useState<KnowledgeDrawerState | null>(null);
  const [handoffTarget, setHandoffTarget] = useState<string | null>(null);

  const value = useMemo<KnowledgeAppContextValue>(
    () => ({
      provider,
      providerCtx,
      mode,
      setMode,
      lensId,
      setLensId,
      exploreInventoryKind,
      setExploreInventoryKind,
      relationshipPresetId,
      setRelationshipPresetId,
      relationshipHops,
      setRelationshipHops,
      showCandidateRelationships,
      setShowCandidateRelationships,
      showTargetState,
      setShowTargetState,
      dockPosition,
      setDockPosition,
      dockState,
      setDockState,
      dockLocked,
      toggleDockLocked: () => setDockLocked((v) => !v),
      drawer,
      openDrawer: setDrawer,
      closeDrawer: () => setDrawer(null),
      handoffTarget,
      openHandoff: setHandoffTarget,
      closeHandoff: () => setHandoffTarget(null),
    }),
    [
      provider,
      providerCtx,
      mode,
      lensId,
      exploreInventoryKind,
      relationshipPresetId,
      relationshipHops,
      showCandidateRelationships,
      showTargetState,
      dockPosition,
      dockState,
      dockLocked,
      drawer,
      handoffTarget,
    ],
  );

  return (
    <KnowledgeAppContext.Provider value={value}>
      {children}
    </KnowledgeAppContext.Provider>
  );
}

export function useKnowledgeApp(): KnowledgeAppContextValue {
  const ctx = useContext(KnowledgeAppContext);
  if (!ctx) {
    throw new Error(
      "useKnowledgeApp must be used within a KnowledgeAppProvider",
    );
  }
  return ctx;
}
