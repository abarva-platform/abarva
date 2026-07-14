import type { EvidenceRef, KnowledgeTruthStatus } from "./evidence-ref";

export type RelationshipReadiness =
  | "validated"
  | "candidate"
  | "needs_review"
  | "not_ready";

export type RelationshipVerb =
  | "owns"
  | "uses"
  | "supports"
  | "depends_on"
  | "feeds"
  | "measures"
  | "controls"
  | "funds"
  | "delivers"
  | "governs"
  | "risks"
  | "modernizes";

export interface RelationshipEdge {
  relationshipId: string;
  tenantKey: string;
  sourceEntityId: string;
  sourceEntityType: string;
  targetEntityId: string;
  targetEntityType: string;
  relationshipType: RelationshipVerb;
  businessMeaning: string;
  evidenceRefs: EvidenceRef[];
  truthStatus: KnowledgeTruthStatus;
  readiness: RelationshipReadiness;
  confidence: number;
  caveats: string[];
}
