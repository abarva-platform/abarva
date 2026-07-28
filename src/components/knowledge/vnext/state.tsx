"use client";

/**
 * Knowledge vNext shell state. Holds the global controls (mode, depth, lens,
 * current/target scope), the focal entity selection, active filters, the
 * evidence-drawer target and the aVa dock state. Depth is GLOBAL — one control
 * changes detail across the whole page, not a per-card toggle.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  DepthLevel,
  EvidenceDescriptor,
  KnowledgeLens,
  KnowledgeMode,
} from "@/lib/knowledge/consumption-contracts";

export interface EvidenceDrawerTarget {
  title: string;
  /** Descriptors to show; may be one or several. */
  descriptors: EvidenceDescriptor[];
  /** Optional context line (e.g. "Graph edge: feeds"). */
  context?: string;
}

/** Evidence/fact/gap refs the active mode has in view — handed to aVa's packet. */
export interface AvaContextRefs {
  evidenceRefs: string[];
  acceptedFactRefs: string[];
  knownGapRefs: string[];
  blockedSourceRefs: string[];
}

const EMPTY_AVA_CONTEXT: AvaContextRefs = {
  evidenceRefs: [],
  acceptedFactRefs: [],
  knownGapRefs: [],
  blockedSourceRefs: [],
};

interface ShellState {
  mode: KnowledgeMode;
  setMode: (m: KnowledgeMode) => void;
  depth: DepthLevel;
  setDepth: (d: DepthLevel) => void;
  lens: KnowledgeLens;
  setLens: (l: KnowledgeLens) => void;
  scope: "current" | "target" | "both";
  setScope: (s: "current" | "target" | "both") => void;

  focalEntityRefs: string[];
  setFocalEntityRefs: (refs: string[]) => void;

  filters: Record<string, string[]>;
  setFilters: (f: Record<string, string[]>) => void;

  drawer: EvidenceDrawerTarget | null;
  openEvidence: (t: EvidenceDrawerTarget) => void;
  closeEvidence: () => void;

  avaOpen: boolean;
  setAvaOpen: (v: boolean) => void;

  avaContext: AvaContextRefs;
  setAvaContext: (c: AvaContextRefs) => void;

  /** A question queued for the aVa dock (e.g. a suggested decision question). */
  avaPrefill: string | null;
  /** Open the aVa dock and pre-fill a question; the answer still comes from aVa. */
  askAva: (question: string) => void;
  /** Consumed by the aVa dock after it applies the prefill. */
  clearAvaPrefill: () => void;

  leftOpen: boolean;
  setLeftOpen: (v: boolean) => void;
}

const Ctx = createContext<ShellState | null>(null);

export function KnowledgeShellStateProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<KnowledgeMode>("brief");
  const [depth, setDepth] = useState<DepthLevel>("executive");
  const [lens, setLens] = useState<KnowledgeLens>("none");
  const [scope, setScope] = useState<"current" | "target" | "both">("current");
  const [focalEntityRefs, setFocalEntityRefs] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [drawer, setDrawer] = useState<EvidenceDrawerTarget | null>(null);
  const [avaOpen, setAvaOpen] = useState<boolean>(true);
  const [avaContext, setAvaContext] = useState<AvaContextRefs>(EMPTY_AVA_CONTEXT);
  const [avaPrefill, setAvaPrefill] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState<boolean>(false);

  const openEvidence = useCallback((t: EvidenceDrawerTarget) => setDrawer(t), []);
  const closeEvidence = useCallback(() => setDrawer(null), []);
  const askAva = useCallback((question: string) => {
    setAvaPrefill(question);
    setAvaOpen(true);
  }, []);
  const clearAvaPrefill = useCallback(() => setAvaPrefill(null), []);

  const value = useMemo<ShellState>(
    () => ({
      mode, setMode, depth, setDepth, lens, setLens, scope, setScope,
      focalEntityRefs, setFocalEntityRefs, filters, setFilters,
      drawer, openEvidence, closeEvidence, avaOpen, setAvaOpen,
      avaContext, setAvaContext, avaPrefill, askAva, clearAvaPrefill, leftOpen, setLeftOpen,
    }),
    [mode, depth, lens, scope, focalEntityRefs, filters, drawer, avaOpen, avaContext, avaPrefill, askAva, clearAvaPrefill, leftOpen, openEvidence, closeEvidence],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShell(): ShellState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShell must be used within KnowledgeShellStateProvider");
  return ctx;
}

/** Depth ordering helper: is the current depth at least the given threshold? */
const DEPTH_ORDER: Record<DepthLevel, number> = { executive: 0, analytical: 1, proof: 2 };
export function atLeastDepth(current: DepthLevel, threshold: DepthLevel): boolean {
  return DEPTH_ORDER[current] >= DEPTH_ORDER[threshold];
}
