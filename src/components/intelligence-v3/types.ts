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
  { key: 'today', label: 'Today', stage: 1 },
  { key: 'by-function', label: 'By function', stage: 2 },
  { key: 'patterns', label: 'Patterns', stage: 1 },
  { key: 'vendors', label: 'Vendors', stage: 3 },
  { key: 'peer-activity', label: 'Peer activity', stage: 3 },
  { key: 'my-strategy', label: 'My strategy', stage: 2 },
  { key: 'sessions', label: 'Sessions', stage: 1 },
];

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
  whatWeCantSee: ReadonlyArray<string>;
  sentinelOpener: string;
  conversation: ReadonlyArray<ChatMessage>;
}
