import type { EnrichmentProposal } from "./enrichment-proposals";
import type { MergedRecord } from "./canonical-overlay-merge";

/**
 * The gate between a built snapshot and a promoted one.
 *
 * Everything upstream of here is reversible. A proposal can be rejected, a merge can be rerun, a
 * bad classification can be corrected while it sits in a build. Promotion is where content starts
 * reaching people, and after that a wrong derived value is loose in decks, answers and exports
 * that nobody can recall.
 *
 * So this gate REFUSES. It does not repair, it does not drop the offending attribute and continue,
 * and it does not downgrade an error to a warning when the count is small. Every one of those
 * would let a promotion succeed while quietly meaning something different from what the operator
 * asked for.
 *
 * The failures it looks for all have the same shape: an approval that was true when it was given
 * and is not true now.
 */

export type PromotionBlockCode =
  | "invalidated_proposal_merged"
  | "stale_approval"
  | "unapproved_proposal_merged"
  | "unknown_basis_attribute"
  | "schema_version_drift"
  | "no_reviewer_recorded";

export interface PromotionBlock {
  code: PromotionBlockCode;
  /** What an operator has to do about it, in their words rather than ours. */
  message: string;
  tenantKey: string;
  sourceRowId?: string;
  attribute?: string;
  count?: number;
}

export interface PromotionGateInput {
  tenantKey: string;
  /** The records the snapshot would promote. */
  records: MergedRecord[];
  /** Every proposal in the run, whatever its status. */
  proposals: EnrichmentProposal[];
  /** Schema version the merge was built against, per template file. */
  mergedSchemaVersions: Record<string, string>;
  /** Schema version currently declared for each template file. */
  currentSchemaVersions: Record<string, string>;
}

export interface PromotionGateResult {
  ok: boolean;
  blocks: PromotionBlock[];
  /** Counts an operator can read without opening the snapshot. */
  summary: {
    recordCount: number;
    attributesByBasis: Record<string, number>;
    proposalsByStatus: Record<string, number>;
  };
}

/**
 * Freshness, stated as a question rather than a duration.
 *
 * An approval does not go stale because time passed. It goes stale because the thing it was given
 * about changed. Expiring approvals on a clock would churn correct decisions and, worse, would
 * imply that an unexpired one is still valid when its evidence has moved.
 */
export function isApprovalStale(input: {
  proposal: EnrichmentProposal;
  currentSchemaVersion: string | undefined;
}): { stale: boolean; reason?: string } {
  if (input.proposal.status === "invalidated") {
    return { stale: true, reason: input.proposal.invalidationReason ?? "the evidence it cited has changed" };
  }
  if (input.currentSchemaVersion && input.currentSchemaVersion !== input.proposal.schemaVersion) {
    return {
      stale: true,
      reason: `it was approved against schema ${input.proposal.schemaVersion}, and ${input.currentSchemaVersion} is now declared`,
    };
  }
  return { stale: false };
}

export function evaluatePromotion(input: PromotionGateInput): PromotionGateResult {
  const blocks: PromotionBlock[] = [];

  const attributesByBasis: Record<string, number> = {};
  const proposalsByStatus: Record<string, number> = {};
  for (const proposal of input.proposals) {
    proposalsByStatus[proposal.status] = (proposalsByStatus[proposal.status] ?? 0) + 1;
  }

  const proposalsByCell = new Map<string, EnrichmentProposal>();
  for (const proposal of input.proposals) {
    proposalsByCell.set(`${proposal.sourceRowId}::${proposal.targetAttribute}`, proposal);
  }

  for (const record of input.records) {
    for (const [attribute, meta] of Object.entries(record.attributeMetadata)) {
      attributesByBasis[meta.basis] = (attributesByBasis[meta.basis] ?? 0) + 1;
      if (meta.basis === "recorded") continue;
      if (meta.basis === "deterministic") continue;

      const proposal = proposalsByCell.get(`${record.sourceRowId}::${attribute}`);

      if (!proposal) {
        blocks.push({
          code: "unapproved_proposal_merged",
          tenantKey: input.tenantKey,
          sourceRowId: record.sourceRowId,
          attribute,
          message: `A ${meta.basis} value is in the snapshot with no proposal behind it. Something merged content that never went through review; do not promote until the merge is rerun from the approved overlay.`,
        });
        continue;
      }

      if (proposal.status === "invalidated") {
        blocks.push({
          code: "invalidated_proposal_merged",
          tenantKey: input.tenantKey,
          sourceRowId: record.sourceRowId,
          attribute,
          message: `This value was approved and has since been invalidated: ${proposal.invalidationReason ?? "the evidence it cited changed"}. Re-run enrichment for this row and review it again — the approval cannot simply be re-applied, because it was given about different evidence.`,
        });
        continue;
      }

      if (proposal.status !== "approved") {
        blocks.push({
          code: "unapproved_proposal_merged",
          tenantKey: input.tenantKey,
          sourceRowId: record.sourceRowId,
          attribute,
          message: `This value is in the snapshot with status "${proposal.status}". Only approved proposals may merge; rerun the merge from the approved overlay.`,
        });
        continue;
      }

      if (!proposal.reviewedBy || !proposal.approvalId) {
        blocks.push({
          code: "no_reviewer_recorded",
          tenantKey: input.tenantKey,
          sourceRowId: record.sourceRowId,
          attribute,
          message: `This value is marked approved but names no reviewer. An approval that cannot be attributed is not one; re-review this cell.`,
        });
        continue;
      }

      const staleness = isApprovalStale({
        proposal,
        currentSchemaVersion: input.currentSchemaVersions[proposal.templateFile],
      });
      if (staleness.stale) {
        blocks.push({
          code: "stale_approval",
          tenantKey: input.tenantKey,
          sourceRowId: record.sourceRowId,
          attribute,
          message: `This approval no longer holds: ${staleness.reason}. Review it again rather than promoting on the strength of the earlier decision.`,
        });
      }
    }

    // An attribute present with no provenance entry at all.
    for (const attribute of Object.keys(record.attributes)) {
      if (record.attributeMetadata[attribute]) continue;
      blocks.push({
        code: "unknown_basis_attribute",
        tenantKey: input.tenantKey,
        sourceRowId: record.sourceRowId,
        attribute,
        message: `This attribute has no provenance entry, so nothing downstream can tell whether it is something the client stated or something we concluded. Do not promote a value nobody can characterise.`,
      });
    }
  }

  for (const [templateFile, mergedVersion] of Object.entries(input.mergedSchemaVersions)) {
    const current = input.currentSchemaVersions[templateFile];
    if (current && current !== mergedVersion) {
      blocks.push({
        code: "schema_version_drift",
        tenantKey: input.tenantKey,
        message: `${templateFile} was merged against schema ${mergedVersion} but ${current} is now declared. Rebuild the snapshot: a schema change can add, remove or re-scope a column, and the old merge cannot be assumed to still mean the same thing.`,
      });
    }
  }

  return {
    ok: blocks.length === 0,
    blocks,
    summary: {
      recordCount: input.records.length,
      attributesByBasis,
      proposalsByStatus,
    },
  };
}

/**
 * A short operator-readable statement of why a promotion was refused.
 *
 * Grouped by cause rather than listed per cell: three hundred rows blocked by one changed source
 * column is one problem with one fix, and printing it three hundred times obscures that.
 */
export function describeRefusal(result: PromotionGateResult): string {
  if (result.ok) return "No blocks. This snapshot may be promoted.";

  const byCode = new Map<PromotionBlockCode, PromotionBlock[]>();
  for (const block of result.blocks) {
    const list = byCode.get(block.code) ?? [];
    list.push(block);
    byCode.set(block.code, list);
  }

  const lines = [`Promotion refused. ${result.blocks.length} blocks across ${byCode.size} causes.`];
  for (const [code, blocks] of byCode) {
    const rows = new Set(blocks.map((b) => b.sourceRowId).filter(Boolean));
    const scope = rows.size ? ` (${rows.size} rows)` : "";
    lines.push(`\n${code}${scope}\n  ${blocks[0].message}`);
  }
  return lines.join("\n");
}
