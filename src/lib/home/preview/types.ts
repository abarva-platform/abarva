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
  TechnologyEstateBundle,
  TechRecordType,
  TechObjectType,
  ConstantColumn,
} from "../../../../scripts/data-build/technology-estate";
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
import type { HomeEnterpriseContext } from "./ecl-enterprise-context";

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
  ConstantColumn,
};

export type EnterpriseSignalPacket = ReturnType<
  typeof buildEnterpriseSignalPacket
> & { homeEnterpriseContext?: HomeEnterpriseContext | null };

export type HomeExecutiveStoryTerminalState =
  | "published"
  | "refused"
  | "deferred";

export type HomeExecutiveStorySectionId =
  | "enterprise"
  | "bets"
  | "runs-on"
  | "costs-returns"
  | "exposed"
  | "attention";

export interface HomeExecutiveStorySectionPlan {
  sectionId: HomeExecutiveStorySectionId;
  state: HomeExecutiveStoryTerminalState;
  leadClaimRef: string | null;
  supportingClaimRefs: string[];
  reasonCode: string | null;
}

export interface HomeExecutiveStoryPlanV1 {
  contractVersion: "home-executive-story-plan/v1";
  tenantKey: string;
  assessmentId: string;
  snapshotId: string | null;
  openingThesisClaimRef: string | null;
  openingSupportingClaimRefs: string[];
  scaleFactRef: string | null;
  decisions: Array<{
    decisionId: string;
    question: string;
    whyNowClaimRefs: string[];
    ownerRef: string | null;
    handoffModule: "moves" | "source" | "tower" | "intelligence" | null;
    evidenceNeeded: string[];
  }>;
  sectionOrder: HomeExecutiveStorySectionId[];
  sections: HomeExecutiveStorySectionPlan[];
  chapterStates: Record<
    ChapterId,
    {
      state: HomeExecutiveStoryTerminalState;
      reasonCode: string | null;
    }
  >;
  heroVisualDatasetRef: string | null;
  overallEvidenceBoundary: string;
  sourceClaimRefs: string[];
  storyPlanHash: string;
}

/** One tenant's persisted golden snapshot -- the full review bundle described in the workstream's
 * spec: thesis, all eight chapter payloads, published claims, verification ledger, visual specs,
 * and visual datasets, plus generation lineage. This is what a JSON file under
 * `src/lib/home/preview/golden-snapshots/<tenantKey>.json` deserializes to. */
export interface HomeReviewBundle {
  tenantKey: string;
  /**
   * Whether the tenant input registry declares every input of this tenant to be synthetic
   * demonstration data. Set where the bundle is loaded. Absent means nothing was declared, and
   * a surface must then make no statement about the tenant being a demonstration.
   */
  declaredSyntheticDemo?: boolean;
  provenance: HomeReviewBundleProvenance;
  /** Read-time lineage for a served projection. Absent on stored snapshots. */
  contextVersion?: HomeContextVersion;
  executiveStoryPlan?: HomeExecutiveStoryPlanV1;
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

export type HomeRecordSourceKind =
  | "ecl_serving_projection"
  | "reviewed_snapshot"
  | "reviewed_snapshot_fallback";

export interface HomeContextVersion {
  assessmentId: string;
  projectionContentHash: string;
  /** Null until every citable serving row has admitted source references and a source hash. */
  sourceSetHash?: string | null;
  /** Changes when verified row-level source links change, even while coverage is incomplete. */
  sourceLineageHash: string;
  sourceCoverage: {
    totalRecordRows: number;
    linkedRecordRows: number;
    families: Array<{ pageKey: string; totalRows: number; linkedRows: number }>;
  };
  /** Null when the source catalog cannot be read. Changes when a file's state, or the approval
   * recorded for its load, changes. */
  sourceCatalogHash?: string | null;
  sourceFileReview?: {
    totalFiles: number;
    /** Files in the accepted state whose load carries a recorded approval. */
    acceptedFiles: number;
    /** Files in the accepted state with no recorded approval: registered, and reviewed by no one
     * on record. Absent on a version built before this was counted. */
    notReviewedFiles?: number;
    partialFiles: number;
    blockedFiles: number;
    supersededFiles: number;
  } | null;
  /** Registered file dates, not an attestation that the underlying data is current. */
  sourceDateCoverage?: {
    earliest: string;
    latest: string;
    datedFiles: number;
    totalFiles: number;
  } | null;
  deterministicPacketHash: string;
  narrativePacketHash: string | null;
  narrativeGeneratedAt: string | null;
  /** Not inferred from the narrative build time. */
  dataAsOf: string | null;
  coherence: "coherent" | "stored_narrative" | "unverified";
}

export interface HomeRecordRenderSource {
  kind: HomeRecordSourceKind;
  canonicalSnapshotHash: string;
  contextVersion?: HomeContextVersion;
}
