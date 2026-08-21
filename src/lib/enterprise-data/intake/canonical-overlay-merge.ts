import {
  dependencyHash,
  type EnrichmentBasis,
} from "./enrichment-firewall";
import type { EnrichmentProposal } from "./enrichment-proposals";

/**
 * Merging an approved overlay into canonical state.
 *
 * The hard part is not the merge. It is that after the merge, every consumer -- Tower metrics,
 * Home chapters, Source answers, an exported deck -- must still be able to tell what a value IS.
 * A derived classification that reads exactly like a recorded one is the failure this file exists
 * to prevent, because by the time it reaches a client slide nobody can tell them apart.
 *
 * Three rules do that work:
 *
 *   1  ONE LOGICAL KEY.  A recorded `architecture_role` and a derived one occupy the same
 *      attribute. Without this we accumulate architectureRole / drvArchitectureRole /
 *      augArchitectureRole and every consumer invents its own precedence.
 *
 *   2  RECORDED ALWAYS WINS.  A proposal fills a gap; it never overwrites what the client stated.
 *      When both exist the proposal is superseded and kept, not deleted -- "we inferred X, the
 *      client later said Y" is worth being able to show.
 *
 *   3  BASIS TRAVELS WITH THE VALUE.  Every merged attribute has a metadata entry naming its
 *      basis, its evidence, who approved it and against which run. Consumers read the metadata,
 *      not a naming convention.
 */

/** Higher wins. Recorded is the client's own statement and outranks anything we produced. */
const BASIS_PRECEDENCE: Record<EnrichmentBasis, number> = {
  recorded: 4,
  deterministic: 3,
  derived: 2,
  augmented: 1,
};

export interface AttributeProvenance {
  basis: EnrichmentBasis;
  /** Recorded fields the value rests on. Empty for a recorded value: it rests on itself. */
  evidenceFields: string[];
  evidenceDependencyHash?: string;
  enrichmentRunId?: string;
  model?: string;
  promptVersion?: string;
  approvedBy?: string;
  approverRole?: string;
  approvalId?: string;
  approvedAt?: string;
  /** Set when a recorded value later displaced this one. */
  supersededByRecorded?: boolean;
}

export interface MergedRecord {
  sourceRowId: string;
  attributes: Record<string, unknown>;
  /** Parallel to `attributes`, keyed by the same logical attribute name. */
  attributeMetadata: Record<string, AttributeProvenance>;
}

export interface MergeResult {
  records: MergedRecord[];
  applied: number;
  /** Proposals a recorded value displaced. Kept for audit, not dropped. */
  supersededByRecorded: EnrichmentProposal[];
  /** Proposals whose cited evidence no longer matches the current recorded row. */
  staleAtMerge: EnrichmentProposal[];
  notes: string[];
}

/**
 * Merges approved proposals onto recorded rows.
 *
 * Re-checks the dependency hash at merge time rather than trusting approval. Approval and merge
 * are separated in time -- a client can correct a cited field in between -- and a proposal whose
 * evidence moved is no longer the thing that was approved.
 */
export function mergeApprovedOverlay(input: {
  recordedRows: Array<{ sourceRowId: string; attributes: Record<string, unknown> }>;
  approvedProposals: EnrichmentProposal[];
}): MergeResult {
  const supersededByRecorded: EnrichmentProposal[] = [];
  const staleAtMerge: EnrichmentProposal[] = [];
  const notes: string[] = [];
  let applied = 0;

  const byRow = new Map<string, EnrichmentProposal[]>();
  for (const p of input.approvedProposals) {
    if (p.status !== "approved") continue;
    const list = byRow.get(p.sourceRowId) ?? [];
    list.push(p);
    byRow.set(p.sourceRowId, list);
  }

  const records: MergedRecord[] = input.recordedRows.map((row) => {
    const attributes: Record<string, unknown> = { ...row.attributes };
    const attributeMetadata: Record<string, AttributeProvenance> = {};

    for (const [key, value] of Object.entries(row.attributes)) {
      if (value === undefined || value === null || value === "") continue;
      attributeMetadata[key] = { basis: "recorded", evidenceFields: [] };
    }

    for (const proposal of byRow.get(row.sourceRowId) ?? []) {
      const currentHash = dependencyHash(row.attributes, proposal.evidenceFields);
      if (currentHash !== proposal.evidenceDependencyHash) {
        // Approved against a version of the row that no longer exists.
        staleAtMerge.push(proposal);
        continue;
      }

      const existing = attributeMetadata[proposal.targetAttribute];
      if (existing && BASIS_PRECEDENCE[existing.basis] >= BASIS_PRECEDENCE[proposal.basis]) {
        if (existing.basis === "recorded") {
          existing.supersededByRecorded = true;
          supersededByRecorded.push(proposal);
        }
        continue;
      }

      attributes[proposal.targetAttribute] = proposal.proposedValue;
      attributeMetadata[proposal.targetAttribute] = {
        basis: proposal.basis,
        evidenceFields: proposal.evidenceFields,
        evidenceDependencyHash: proposal.evidenceDependencyHash,
        enrichmentRunId: proposal.enrichmentRunId,
        model: proposal.model,
        promptVersion: proposal.promptVersion,
        approvedBy: proposal.reviewedBy,
        approverRole: proposal.reviewerRole,
        approvalId: proposal.approvalId,
        approvedAt: proposal.reviewedAt,
      };
      applied += 1;
    }

    return { sourceRowId: row.sourceRowId, attributes, attributeMetadata };
  });

  if (supersededByRecorded.length) {
    notes.push(
      `${supersededByRecorded.length} approved proposals were superseded by a recorded value. The client's own statement outranks anything we derived; the proposals are kept so the difference can be shown.`,
    );
  }
  if (staleAtMerge.length) {
    notes.push(
      `${staleAtMerge.length} approved proposals cited evidence that has since changed and were not merged. Approval and merge are separated in time, so evidence is re-checked here rather than trusted.`,
    );
  }

  return { records, applied, supersededByRecorded, staleAtMerge, notes };
}

/* -- consumer basis policy ------------------------------------------------------------------- */

/**
 * What each consumer may read.
 *
 * This is the rule that keeps a derived classification out of a number. Tower's figures are
 * deterministic by contract; a derived value entering a metric would make a model judgement look
 * like a measurement. Narrative surfaces may USE derived content, but only when the surface can
 * label its basis -- which is exactly what Home v4's band structure does.
 */
export type ConsumerSurface =
  | "tower_metric"
  | "home_fact_band"
  | "home_inference_band"
  | "source_answer"
  | "graph_edge"
  | "client_export";

export interface BasisPolicy {
  allowed: EnrichmentBasis[];
  /** True when the surface must render the basis next to the value. */
  requiresVisibleBasis: boolean;
  rationale: string;
}

export const CONSUMER_BASIS_POLICY: Record<ConsumerSurface, BasisPolicy> = {
  tower_metric: {
    allowed: ["recorded", "deterministic"],
    requiresVisibleBasis: false,
    rationale:
      "Tower figures are deterministic by contract. A derived value inside a metric turns a model judgement into a measurement, and no downstream reader can undo that.",
  },
  home_fact_band: {
    allowed: ["recorded", "deterministic"],
    requiresVisibleBasis: false,
    rationale:
      "The fact band asserts what the record shows. Only what the client stated, or what follows arithmetically from it, belongs there.",
  },
  home_inference_band: {
    allowed: ["recorded", "deterministic", "derived"],
    requiresVisibleBasis: true,
    rationale:
      "The inference band exists to carry reasoning, and already labels it as inference. Derived content is admissible precisely because the band names what it is.",
  },
  source_answer: {
    allowed: ["recorded", "deterministic", "derived"],
    requiresVisibleBasis: true,
    rationale:
      "An answer may reason from derived context provided the citation names the basis, so a reader can tell a classification from a client statement.",
  },
  graph_edge: {
    allowed: ["recorded", "deterministic"],
    requiresVisibleBasis: false,
    rationale:
      "An edge is structure. A derived edge would make an inferred dependency indistinguishable from an observed integration, and every consumer downstream would inherit it as fact.",
  },
  client_export: {
    allowed: ["recorded", "deterministic", "derived"],
    requiresVisibleBasis: true,
    rationale:
      "A document leaving the building must carry its own basis marks, because the reader cannot come back and ask.",
  },
};

export interface BasisFilterResult<T> {
  admitted: T[];
  withheld: Array<{ item: T; attribute: string; basis: EnrichmentBasis; reason: string }>;
}

/**
 * Filters attributes for a consumer.
 *
 * Inclusion-only, like the approval overlay: a filter written as "remove what is not allowed"
 * silently admits any basis a future change forgets to list.
 */
export function filterForConsumer(input: {
  record: MergedRecord;
  surface: ConsumerSurface;
}): { attributes: Record<string, unknown>; withheld: Array<{ attribute: string; basis: EnrichmentBasis; reason: string }> } {
  const policy = CONSUMER_BASIS_POLICY[input.surface];
  const attributes: Record<string, unknown> = {};
  const withheld: Array<{ attribute: string; basis: EnrichmentBasis; reason: string }> = [];

  for (const [attribute, value] of Object.entries(input.record.attributes)) {
    const meta = input.record.attributeMetadata[attribute];
    // An attribute with no provenance entry is not treated as recorded by default. Absent
    // provenance means we do not know what it is, and "unknown basis" must never read as fact.
    const basis = meta?.basis;
    if (!basis) {
      withheld.push({
        attribute,
        basis: "augmented",
        reason: "no provenance recorded; an attribute of unknown basis cannot be presented as anything",
      });
      continue;
    }
    if (policy.allowed.includes(basis)) {
      attributes[attribute] = value;
      continue;
    }
    withheld.push({ attribute, basis, reason: policy.rationale });
  }

  return { attributes, withheld };
}

/** True when a surface is about to render a value whose basis it cannot show. */
export function violatesVisibleBasis(input: {
  surface: ConsumerSurface;
  basis: EnrichmentBasis;
  basisIsRendered: boolean;
}): boolean {
  const policy = CONSUMER_BASIS_POLICY[input.surface];
  if (!policy.requiresVisibleBasis) return false;
  if (input.basis === "recorded") return false;
  return !input.basisIsRendered;
}
