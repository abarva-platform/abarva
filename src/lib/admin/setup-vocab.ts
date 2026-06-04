/**
 * setup-vocab — translation between shipped substrate vocabulary
 * and the Setup Redesign Package's data-binding catalog vocabulary.
 *
 * Substrate (data_inventory_segments):
 *   - health_state: 'complete' | 'partial' | 'sparse' | 'not_started' | 'attention' | 'critical'
 *   - coverage_score: NUMERIC 0..100
 *
 * Catalog (DATA_BINDING_CATALOG.md §1, §2, §5):
 *   - trust rung labels: Loaded / Available / Usable evidence / Agent-usable / Decision-grade
 *   - capability depth: deep / partial / thin / empty
 *   - readiness vocabulary: blank / thin / partial / decision-grade
 *   - bucket health: green / amber / red
 *
 * Centralizing the translation here so PR A / PR B / PR C don't
 * each duplicate the mapping.
 */

import type { ClientKey } from "@/lib/client-config";
import type { InventorySegmentRollup } from "@/lib/admin/setup-acts-registry";

export type HealthState =
  | "complete"
  | "partial"
  | "sparse"
  | "not_started"
  | "attention"
  | "critical";

export type CapabilityDepthState = "deep" | "partial" | "thin" | "empty";

export type TrustRung =
  | "Decision-grade"
  | "Agent-usable"
  | "Usable evidence"
  | "Available"
  | "Loaded"
  | "Empty";

export type BucketHealth = "green" | "amber" | "red";

export type AgentLevel = "decision-grade" | "partial" | "thin" | "blank";

const HEALTH_TO_DEPTH: Record<HealthState, CapabilityDepthState> = {
  complete: "deep",
  partial: "partial",
  sparse: "thin",
  not_started: "empty",
  attention: "thin",
  critical: "empty",
};

export function depthFromHealth(state: HealthState): CapabilityDepthState {
  return HEALTH_TO_DEPTH[state];
}

export function trustRungFromHealth(
  state: HealthState,
  recordCount: number,
): TrustRung {
  if (state === "complete") return "Decision-grade";
  if (state === "partial") return "Usable evidence";
  if (state === "sparse") return recordCount > 0 ? "Available" : "Loaded";
  if (state === "attention") return "Available";
  if (state === "critical") return "Empty";
  return "Empty";
}

export function bucketHealthFromStates(states: HealthState[]): BucketHealth {
  if (states.length === 0) return "red";
  const allComplete = states.every((s) => s === "complete" || s === "partial");
  if (allComplete) return "green";
  const anyLoaded = states.some(
    (s) =>
      s === "complete" ||
      s === "partial" ||
      s === "sparse" ||
      s === "attention",
  );
  return anyLoaded ? "amber" : "red";
}

export function readinessPercent(segments: InventorySegmentRollup[]): number {
  if (segments.length === 0) return 0;
  let total = 0;
  for (const s of segments) {
    const state = s.healthState as HealthState;
    if (state === "complete") total += 1;
    else if (state === "partial") total += 0.5;
    else if (state === "sparse" || state === "attention") total += 0.25;
  }
  return Math.round((total / 14) * 100);
}

const CAPABILITY_TRACKS = [
  "cite-evidence",
  "model-run-rate",
  "detect-risk",
  "synthesize-cross-program",
  "advance-lifecycle",
  "audit-govern",
] as const;

export type CapabilityVerb = (typeof CAPABILITY_TRACKS)[number];

const VERB_TO_DEPENDENT_FAMILIES: Record<CapabilityVerb, number[]> = {
  "cite-evidence": [1, 2, 3, 9, 12, 13],
  "model-run-rate": [4, 5, 10],
  "detect-risk": [1, 9, 10, 11, 12, 13],
  "synthesize-cross-program": [6, 8, 14],
  "advance-lifecycle": [6, 7, 8, 10],
  "audit-govern": [1, 9, 12],
};

export function blockedCapabilityTrackCount(
  segments: InventorySegmentRollup[],
): number {
  let blocked = 0;
  for (const verb of CAPABILITY_TRACKS) {
    const families = VERB_TO_DEPENDENT_FAMILIES[verb];
    const relevant = segments.filter((s) => families.includes(s.familyNumber));
    if (relevant.length === 0) {
      blocked += 1;
      continue;
    }
    const allEmpty = relevant.every(
      (s) =>
        s.healthState === "not_started" ||
        s.healthState === "critical" ||
        s.healthState === "sparse",
    );
    if (allEmpty) blocked += 1;
  }
  return blocked;
}

export function agentLevelFromReadiness(pct: number): AgentLevel {
  if (pct >= 75) return "decision-grade";
  if (pct >= 40) return "partial";
  if (pct > 0) return "thin";
  return "blank";
}

const INDUSTRY_PHRASE: Record<string, string> = {
  RETAIL: "a national specialty retailer",
  FINSERV: "a regulated financial-services bank",
  HEALTHCARE_IDN: "a healthcare integrated delivery network",
  ENERGY: "an integrated energy holding company",
  DIVERSIFIED: "a diversified private holding company",
};

export function industryPhraseForClient(args: {
  industryCode?: string | null;
  clientKey?: ClientKey | string | null;
}): string | null {
  const code = args.industryCode?.trim().toUpperCase();
  if (code && INDUSTRY_PHRASE[code]) return INDUSTRY_PHRASE[code];
  return null;
}

const BUCKETS: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  segmentFamilies: number[];
}> = [
  {
    id: "who-you-are",
    label: "Who you are",
    description: "Legal entity, business lines, regulators",
    segmentFamilies: [1, 2, 13],
  },
  {
    id: "what-you-run-on",
    label: "What you run on",
    description: "System inventory, vendors, contracts",
    segmentFamilies: [3, 11],
  },
  {
    id: "what-rules-apply",
    label: "What rules apply",
    description: "Compliance posture, regulatory framework",
    segmentFamilies: [12],
  },
  {
    id: "how-you-measure",
    label: "How you measure performance",
    description: "Financials, KPIs, operating telemetry",
    segmentFamilies: [4, 5, 10],
  },
  {
    id: "in-flight",
    label: "What you have in flight",
    description: "Programs, deliverables, decisions",
    segmentFamilies: [6, 8, 14, 7, 9],
  },
];

export interface BucketRow {
  id: string;
  label: string;
  description: string;
  health: BucketHealth;
  segmentNames: string[];
}

export function buildPlainLanguageBuckets(
  segments: InventorySegmentRollup[],
): BucketRow[] {
  const byFamily = new Map<number, InventorySegmentRollup>();
  for (const s of segments) byFamily.set(s.familyNumber, s);
  return BUCKETS.map((b) => {
    const states: HealthState[] = b.segmentFamilies
      .map((f) => byFamily.get(f)?.healthState as HealthState | undefined)
      .filter((s): s is HealthState => Boolean(s));
    const segmentNames = b.segmentFamilies
      .map((f) => byFamily.get(f)?.segmentName)
      .filter((n): n is string => Boolean(n));
    return {
      id: b.id,
      label: b.label,
      description: b.description,
      health: bucketHealthFromStates(states),
      segmentNames,
    };
  });
}

const SEGMENT_UNLOCKS: Record<number, string> = {
  1: "Steward can anchor the tenant to legal entity, regulators, and strategic priorities",
  2: "Decision-rights mapping — Nexus identifies sponsors and approvers per program",
  3: "Atlas can reason about authoritative systems for customer / account / risk data",
  4: "Run-rate modeling — variance vs plan, cost attribution",
  5: "Outcome attribution — Nexus ties programs to measured KPIs",
  6: "Nexus phase-gate reasoning across active programs",
  7: "Sentinel reasoning across vendor responses, RFPs, evaluations",
  8: "Charter / OKR / design-brief grounding for each program",
  9: "Citation discipline — every claim resolves to evidence",
  10: "Workflow-change detection, milestone telemetry, gate-readiness",
  11: "Renewal calendar, contract-term reasoning, vendor risk",
  12: "Steward gating on AI / sourcing / programs against control requirements",
  13: "Industry-pattern overlay on Sentinel and Atlas reasoning",
  14: "SME conflict detection, dependency reasoning, portfolio risk",
};

export function unlocksCopy(familyNumber: number, segmentName: string): string {
  return (
    SEGMENT_UNLOCKS[familyNumber] ??
    `Loading ${segmentName} would deepen agent capability for this segment.`
  );
}

/**
 * Per-segment unlock preview — concrete question + citation example.
 *
 * Used on Data Trust to show, for every sparse / unloaded segment,
 * what a user-visible answer would look like once the substrate is
 * loaded. Tied to the 14 canonical segments (`familyNumber` 1–14)
 * authored in `data-trust-composer.ts:SEGMENT_NAME_BY_FAMILY`.
 *
 * Per audit `SETUP_AUDIT_2026-05-30_VERDICT.md` §7 Wave 3 PR 2:
 *  "every sparse segment shows a concrete preview: Load this and
 *   Sentinel can answer X with citation Y."
 *
 * Schema invariant: every segment in 1..14 must define a preview.
 * `setup-vocab.test.ts` enforces this.
 */
export interface UnlocksPreview {
  /** The plain-language question an operator could ask the agent. */
  question: string;
  /** A representative citation the agent would surface once loaded. */
  citationExample: string;
  /** The primary agent that would answer with this substrate. */
  agent?: "sentinel" | "atlas" | "nexus" | "steward";
}

const SEGMENT_UNLOCKS_PREVIEW: Record<number, UnlocksPreview> = {
  1: {
    question:
      "Which legal entities sit under our holding company, and which regulator owns each?",
    citationExample:
      "Enterprise Profile §Entities: Primary operating entity — SEC, FTC",
    agent: "sentinel",
  },
  2: {
    question: "Who owns the loyalty P&L, and who approves CX programs?",
    citationExample:
      "Org Chart §Commercial: CMO → VP Customer Engagement (loyalty P&L owner)",
    agent: "nexus",
  },
  3: {
    question: "Which system of record holds authoritative customer identity?",
    citationExample:
      "IT Landscape §Customer: Salesforce CDP (system of record)",
    agent: "atlas",
  },
  4: {
    question:
      "Where are we vs plan on IT opex this quarter, and which initiative drove the variance?",
    citationExample:
      "IT Financials Q3: opex $48.2M vs $46.1M plan; +$2.1M from CDP migration",
    agent: "sentinel",
  },
  5: {
    question: "Why did same-store comp slow in Q3?",
    citationExample:
      "KPI Dictionary §SSC: comp-store basis — 13-month tenure, ex-fuel",
    agent: "sentinel",
  },
  6: {
    question:
      "Which programs are in flight this quarter, and which are gate-blocked?",
    citationExample:
      "Program Inventory: 4 active programs; CDP at Gate 3 (blocked on data trust)",
    agent: "nexus",
  },
  7: {
    question: "How did vendors score against the CDP RFP evaluation criteria?",
    citationExample:
      "Sourcing Artifacts §CDP-RFP-2026: Segment 91, mParticle 87, Tealium 82",
    agent: "sentinel",
  },
  8: {
    question: "What does the Contact Center AI program charter commit us to?",
    citationExample:
      "Contact Center AI Charter §3.2: 18% AHT reduction by EOY 2026",
    agent: "nexus",
  },
  9: {
    question:
      "What is the evidence behind the claim that CDP improves conversion 4%?",
    citationExample:
      "Evidence Ledger §EVD-2026-0312: pilot Aug-Sep 2026, n=42K sessions",
    agent: "sentinel",
  },
  10: {
    question:
      "Which workflows have crossed their gate-readiness SLA this month?",
    citationExample:
      "Operating Telemetry §Workflow: 2 of 11 programs over SLA (CDP, Demand Forecast)",
    agent: "atlas",
  },
  11: {
    question: "Is our CDP contract renewable in 90 days?",
    citationExample:
      "Vendor Register: Segment CDP renewal 2026-08-12 (76 days)",
    agent: "sentinel",
  },
  12: {
    question:
      "Which PCI controls apply to the new payment gateway, and who attests?",
    citationExample:
      "Compliance §PCI-DSS 4.0: req 3.5.1 attested by CISO 2026-04-30",
    agent: "steward",
  },
  13: {
    question: "How do peer retailers handle store-associate AI rollout?",
    citationExample:
      "Industry Context §Retail: 7 of 12 peers using clienteling AI in pilot phase",
    agent: "sentinel",
  },
  14: {
    question:
      "Which programs depend on the same SME, and where is the conflict?",
    citationExample:
      "Cross-Program Signals §SME-conflict: VP Data shared across 3 programs in Q3",
    agent: "nexus",
  },
};

/**
 * Returns the unlock preview for a canonical segment (familyNumber 1–14).
 * Falls back to a generic preview for unknown families so the surface
 * never renders bare; the schema test guarantees the 14 canonical
 * segments are always populated.
 */
export function unlocksPreview(
  familyNumber: number,
  segmentName: string,
): UnlocksPreview {
  return (
    SEGMENT_UNLOCKS_PREVIEW[familyNumber] ?? {
      question: `What does ${segmentName} let an agent answer?`,
      citationExample: `${segmentName}: loading this substrate enables grounded answers`,
    }
  );
}

/**
 * Test-only: full canonical preview map. Exposed so the schema test
 * can verify every segment in 1..14 is populated.
 */
export const CANONICAL_SEGMENT_UNLOCKS_PREVIEW = SEGMENT_UNLOCKS_PREVIEW;

const FAMILY_IMPACT_SCORE: Record<number, number> = {
  1: 100,
  2: 100,
  3: 100,
  12: 100,
  4: 80,
  5: 80,
  10: 80,
  6: 80,
  8: 80,
  14: 80,
  9: 90,
  11: 60,
  13: 60,
  7: 60,
};

export function impactScoreForSegment(familyNumber: number): number {
  return FAMILY_IMPACT_SCORE[familyNumber] ?? 30;
}

export type ActionImpact = "high" | "medium" | "low";

export function impactFromScore(score: number): ActionImpact {
  if (score >= 90) return "high";
  if (score >= 70) return "medium";
  return "low";
}
