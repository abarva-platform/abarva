export interface IntelligenceV3PageData {
  tenantName: string;
  industry: string;
  refreshedLabel?: string;
  stats: { patterns: number; contradictions: number; syntheses: number };
  substrate?: {
    tenantLoaded: number;
    tenantTotal: number;
    corpus: { failureModes: number; patternRecords: number; researchAnchors: number };
  };
  aiTrajectory: { headline: string; body: string };
  pressureCards: ReadonlyArray<{
    severity: string;
    title: string;
    body: string;
  }>;
  conversationContext?: { activeThread: string; layerFocus: string };
  artOfThePossible: ReadonlyArray<{
    key?: string;
    name: string;
    parenthetical: string;
    gating: string;
    moves: ReadonlyArray<{ id?: string; name: string; rationale: string }>;
    focused?: boolean;
  }>;
  whatWeCantSee: ReadonlyArray<string>;
  sentinelOpener?: string;
  conversation?: unknown[];
}
