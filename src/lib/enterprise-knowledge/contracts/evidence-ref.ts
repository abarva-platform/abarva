export type KnowledgeTruthStatus =
  | "active"
  | "candidate"
  | "synthetic_review"
  | "source_adapter"
  | "excluded";

export type EvidenceAuthority =
  | "authoritative"
  | "supporting"
  | "self_reported"
  | "derived"
  | "synthetic";

export type CitationStatus = "citable" | "needs_review" | "not_citable";

export interface EvidenceRef {
  evidenceId: string;
  tenantKey: string;
  sourceLabel: string;
  sourceType:
    | "tenant_input"
    | "source_adapter"
    | "workshop"
    | "system_extract"
    | "metric_extract"
    | "contract"
    | "generated_fixture";
  authority: EvidenceAuthority;
  truthStatus: KnowledgeTruthStatus;
  sourcePath?: string;
  sourceObjectId?: string;
  sourceField?: string;
  excerpt?: string;
  asOfDate?: string;
  sourceOwner?: string;
  sensitivity?: "public" | "internal" | "confidential" | "restricted";
  confidence: number;
  citationStatus: CitationStatus;
}
