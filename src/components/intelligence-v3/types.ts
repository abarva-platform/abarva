// Intelligence v3 · shared types.
//
// Spec: docs/design-canon/wireframe-intelligence-v3-2026-05-07.html
// + docs/build/intelligence/INTELLIGENCE_DESIGN_INTENT_2026-05-07.md
//
// v3 reframe (2026-05-07): Intelligence is a pattern-to-Move funnel
// surface where Sentinel chat is first-class (three layout modes). Page
// content mutates as the conversation progresses. Move cards organize
// by office layer (Experience / Decision / Operations).

export type ChatMode = 'side-rail' | 'dock-expanded' | 'dock-collapsed';

export const STAGE_KEYS = [
  // PR-K2: Brief + Map promoted to the front of the stage list.
  // These are the canonical corpus-grounded surfaces (the "WOW
  // impact" pair). Today/by-function/etc. follow as the deeper
  // exploration stages.
  'brief',
  'map',
  'art-of-possible',
  'today',
  'by-function',
  'patterns',
  'vendors',
  'peer-activity',
  'my-strategy',
  'sessions',
] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export interface StageDef {
  key: StageKey;
  label: string;
  /** Maturity tier shown on the tab pill. */
  stage: 1 | 2 | 3;
  /** When true, render with elevated treatment (the canonical pair). */
  primary?: boolean;
}

export const STAGES: ReadonlyArray<StageDef> = [
  { key: 'brief', label: 'The Brief', stage: 1, primary: true },
  { key: 'map', label: 'The Map', stage: 1, primary: true },
  { key: 'art-of-possible', label: 'Art of Possible', stage: 1, primary: true },
  { key: 'today', label: 'Today', stage: 1 },
  { key: 'by-function', label: 'By function', stage: 2 },
  { key: 'patterns', label: 'Patterns', stage: 1 },
  { key: 'vendors', label: 'Vendors', stage: 3 },
  { key: 'peer-activity', label: 'Peer activity', stage: 3 },
  { key: 'my-strategy', label: 'My strategy', stage: 2 },
  { key: 'sessions', label: 'Sessions', stage: 1 },
];

// Art of Possible · honest-asymmetry band model (PR-K2.3).
//
// Each band is one outcome category for the tenant (e.g. workforce
// productivity, margin, clinical care, foundation). Bands are ordered by
// the tenant's actual portfolio weight — heavy categories at the top,
// empty categories visible (whitespace stays whitespace · we don't pretend
// every category is filled). The band's bar shows in-flight / candidate /
// risk / empty proportions out of "$ possible."

export type OutcomeBandTone = 'heavy' | 'thin' | 'gap' | 'foundation';

export interface OutcomeBand {
  key: string;
  /** Display name of the outcome category, e.g. "Workforce productivity". */
  label: string;
  /** Tone drives the accent color · heavy=teal · thin=amber · gap=red · foundation=navy. */
  tone: OutcomeBandTone;
  /** Total $ possible if the category were fully addressed. */
  possibleUsd: string;
  /** $ currently in flight against this band. */
  capturingUsd: string;
  /** Stacked-bar proportions · must sum to 100. */
  segments: {
    inFlight: number;
    candidate: number;
    risk: number;
    empty: number;
  };
  /** One-line verdict for CXO (e.g. "Over-indexed · 3 active programs"). */
  verdict: string;
  /** Optional dependency call-out (e.g. "MH-07 blocks clinical"). */
  blocker?: string;
}

export interface ArtOfPossibleData {
  /** Total possible across all bands · "$60-150M possible". */
  totalPossibleLabel: string;
  /** What the tenant is actually capturing today · "~$13M capturing (~12%)". */
  totalCapturingLabel: string;
  /** CXO frame line at the bottom of the canvas. */
  cxoFrame: string;
  bands: ReadonlyArray<OutcomeBand>;
}

export type LayerKey = 'experience' | 'decision' | 'operations';

export interface MoveCard {
  id: string;
  name: string;
  rationale: string;
  /** When set, the card receives the dynamic-surface treatment. */
  surfaceState?: 'surfaced-in-thread' | 'newly-surfaced';
}

export interface LayerColumn {
  key: LayerKey;
  name: string;
  parenthetical: string;
  gating: string;
  moves: ReadonlyArray<MoveCard>;
  /** When true, the column receives the focus treatment (gold border). */
  focused?: boolean;
}

export interface PressureCard {
  severity: 'HIGH' | 'MEDIUM' | 'WATCH';
  title: string;
  body: string;
}

export interface ChatMessage {
  role: 'agent' | 'user';
  text: string;
  /** Substrate references shown on agent messages. */
  refs?: ReadonlyArray<string>;
  /** When true, the message has an "Expand to read full response" affordance. */
  hasExpand?: boolean;
}

export interface IntelligenceV3PageData {
  tenantName: string;
  industry: string;
  /** Last-refreshed label, pre-computed server-side ("14m ago"). */
  refreshedLabel: string;
  stats: {
    patterns: number;
    contradictions: number;
    syntheses: number;
  };
  substrate: {
    /** "What we know about you" — n / 23 segments loaded. */
    tenantLoaded: number;
    tenantTotal: number;
    /** "What patterns exist" — corpus counts: failure modes / pattern records / anchors. */
    corpus: { failureModes: number; patternRecords: number; researchAnchors: number };
  };
  aiTrajectory: { headline: string; body: string };
  pressureCards: ReadonlyArray<PressureCard>;
  conversationContext: { activeThread: string; layerFocus: string };
  artOfThePossible: ReadonlyArray<LayerColumn>;
  /**
   * Honest-asymmetry band view of the same Art of Possible (PR-K2.3).
   * When present, the dedicated `art-of-possible` stage tab renders this
   * instead of the legacy 3-column layer grid. Optional · falls back to
   * a stub when missing so existing tenants continue to render.
   */
  aopBands?: ArtOfPossibleData;
  whatWeCantSee: ReadonlyArray<string>;
  sentinelOpener: string;
  conversation: ReadonlyArray<ChatMessage>;
}
