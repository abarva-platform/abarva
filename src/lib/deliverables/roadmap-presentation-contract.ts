// PR4 — the shared, renderer-neutral roadmap presentation contract.
//
// HTML (preview), DOCX (detail) and PPTX (executive deck) must not become
// independently generated versions of the roadmap. They render from ONE
// structured contract carrying the same executive conclusion, horizons +
// outcomes, gates, value milestones, dependencies, evidence statuses, governance
// (lifecycle) state, risks, lineage and appendix detail. Every output stamps the
// contract VERSION and a deterministic CONTENT HASH, so the three formats can be
// proven to derive from the same source (PR7).

import { createHash } from "node:crypto";

import type { RoadmapLifecycleState } from "./roadmap-lifecycle";

/** Bump on any breaking change to the contract shape. */
export const ROADMAP_CONTRACT_VERSION = "1.0.0";

/** Per-item evidence discipline — an uncertain sequence must never look committed. */
export type RoadmapEvidenceStatus =
  | "approved"
  | "recommended"
  | "illustrative"
  | "client_decision_required"
  | "evidence_required";

export interface RoadmapHorizon {
  /** Fixed horizon name (Mobilize / Establish Foundation / …). */
  name: string;
  /** The state ACHIEVED in this horizon (outcome-led, not an activity list). */
  outcome: string;
  /** Supporting activities — may appear beneath the outcome, never in place of it. */
  activities?: string[];
}

export interface RoadmapDecisionGate {
  name: string;
  /** e.g. "Mobilize → Establish Foundation". */
  betweenHorizons?: string;
  criteria?: string;
}

export interface RoadmapValueMilestone {
  name: string;
  horizon?: string;
}

export interface RoadmapDependency {
  item: string;
  evidenceStatus: RoadmapEvidenceStatus;
  note?: string;
}

export interface RoadmapWorkstreamItem {
  workstream: string;
  horizon: string;
  outcome: string;
  evidenceStatus: RoadmapEvidenceStatus;
}

export interface RoadmapLineage {
  moveId: string;
  tenantKey: string;
  /** Audit ref of the accepted P3 architecture this roadmap builds on, if any. */
  architectureRef?: string;
}

/** The renderer-neutral contract. `contentHash` is derived, never hand-set. */
export interface RoadmapPresentationContract {
  contractVersion: string;
  lifecycleState: RoadmapLifecycleState;
  phase: number;
  /** The message-led executive conclusion (the sequencing thesis). */
  executiveConclusion: string;
  /** The specific decision the sponsor is asked to make. */
  sponsorDecision: string;
  horizons: RoadmapHorizon[];
  decisionGates: RoadmapDecisionGate[];
  valueMilestones: RoadmapValueMilestone[];
  dependencies: RoadmapDependency[];
  workstreamItems: RoadmapWorkstreamItem[];
  risks: string[];
  caveats: string[];
  lineage: RoadmapLineage;
  /** Detailed supporting content that belongs in the DOCX appendix, not the exec deck. */
  appendix: string[];
  /** Deterministic hash over the semantic content (excludes this field). */
  contentHash: string;
}

/** Everything hashed — the contract minus the derived hash. */
export type RoadmapContractSeed = Omit<
  RoadmapPresentationContract,
  "contentHash"
>;

/** Stable stringify: object keys sorted recursively so the hash is order-independent. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Deterministic content hash — the same semantic contract always hashes the same,
 * regardless of key order; any content change changes the hash. Used to prove the
 * HTML/DOCX/PPTX outputs derive from the same contract.
 */
export function roadmapContentHash(seed: RoadmapContractSeed): string {
  const canonical = JSON.stringify(canonicalize(seed));
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

/** Build a complete contract from a seed, stamping the version + derived hash. */
export function buildRoadmapPresentationContract(
  seed: Omit<RoadmapContractSeed, "contractVersion">,
): RoadmapPresentationContract {
  const withVersion: RoadmapContractSeed = {
    ...seed,
    contractVersion: ROADMAP_CONTRACT_VERSION,
  };
  return { ...withVersion, contentHash: roadmapContentHash(withVersion) };
}

/** A compact provenance stamp every rendered output embeds (HTML/DOCX/PPTX). */
export function roadmapContractStamp(
  contract: RoadmapPresentationContract,
): string {
  return `roadmap-contract v${contract.contractVersion} · ${contract.contentHash}`;
}
