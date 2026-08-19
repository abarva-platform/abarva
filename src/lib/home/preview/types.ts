/**
 * Type-only re-exports from the data-build layer. Every type here is erased at compile time
 * (`import type`), so nothing from `scripts/data-build/**` -- pg, papaparse, node built-ins --
 * ever reaches a client or server bundle. This keeps the preview route reading the exact contract
 * the generator produces instead of a hand-duplicated shadow copy that can drift.
 */

import type {
  ChapterId,
  ChapterView,
  HomeReviewBundleProvenance,
} from "../../../../scripts/data-build/build-home-chapters";
import type {
  EnterpriseThesis,
  GroundedClaim,
  StructuralIssue,
  VerificationLedgerEntry,
  VisualOpportunity,
  VisualType,
} from "../../../../scripts/data-build/build-enterprise-thesis";
import type {
  ContextItem,
  Signal,
  buildEnterpriseSignalPacket,
} from "../../../../scripts/data-build/enterprise-signal-packet";

export type {
  ChapterId,
  ChapterView,
  HomeReviewBundleProvenance,
  EnterpriseThesis,
  GroundedClaim,
  StructuralIssue,
  VerificationLedgerEntry,
  VisualOpportunity,
  VisualType,
  ContextItem,
  Signal,
};

export type EnterpriseSignalPacket = ReturnType<typeof buildEnterpriseSignalPacket>;

/** One tenant's persisted golden snapshot -- the full review bundle described in the workstream's
 * spec: thesis, all eight chapter payloads, published claims, verification ledger, visual specs,
 * and visual datasets, plus generation lineage. This is what a JSON file under
 * `src/lib/home/preview/golden-snapshots/<tenantKey>.json` deserializes to. */
export interface HomeReviewBundle {
  tenantKey: string;
  provenance: HomeReviewBundleProvenance;
  chapters: ChapterView[];
  thesis: {
    signalPacket: EnterpriseSignalPacket;
    publishedGeneration: EnterpriseThesis;
    verificationLedger: VerificationLedgerEntry[];
    structuralIssues: StructuralIssue[];
  };
}
