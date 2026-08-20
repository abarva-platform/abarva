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
import type { TechnologyEstateBundle, TechRecordType, TechObjectType } from "../../../../scripts/data-build/technology-estate";
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
  TechnologyEstateBundle,
  TechRecordType,
  TechObjectType,
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
  /** Real, structured technology-estate records (applications, vendor contracts, infrastructure
   * platforms, data assets/integrations) -- raw canonical CSV fields, not derived signals. Feeds
   * the Technology Estate tree-nav explorer, distinct from Browse the Data's flat signal list.
   * Optional, not required: a golden snapshot generated before this field existed genuinely won't
   * have it, and every reader of this field must degrade gracefully (hide the tree section) rather
   * than assume it's always present -- there is no runtime schema validation on the JSON these
   * types describe, so "optional in the type" here is honest about what "old fixture" looks like
   * at runtime, not just a formality. */
  technologyEstate?: TechnologyEstateBundle;
}
