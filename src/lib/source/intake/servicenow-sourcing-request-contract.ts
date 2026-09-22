import type {
  BuyingMotion,
  EvidenceGap,
  RiskSeverity,
} from "../classifier/category-classifier";
import type {
  SourceCategoryId,
  TenantContextSegment,
} from "../taxonomy/category-taxonomy";

export type SourceRequestBusinessDomain =
  | "plan"
  | "delivery"
  | "enterprise"
  | "it";

export type SourceRequestMappingDecision = {
  state: "accepted" | "overridden" | "unmapped";
  categoryId: SourceCategoryId | null;
  archetypeId: string | null;
  decidedByUserId: string;
  decidedByName: string;
  decidedAt: string;
  rationale: string;
  sourceVersion: string;
};

export type SourceRequestMappingProposal = {
  categoryId: SourceCategoryId;
  buyingMotion: BuyingMotion;
  archetypeId: string | null;
  confidence: RiskSeverity;
  reasons: readonly string[];
  alternatives: readonly SourceCategoryId[];
  evidenceGaps: readonly EvidenceGap[];
  classifierVersion: string;
  proposalVersion: "servicenow-request-mapping/v1";
};

export type CanonicalSourceIntakeRequest = {
  tenantKey: string;
  requestId: string;
  lifecycle: "imported_request";
  source: {
    system: "servicenow";
    table: string;
    recordId: string;
    requestNumber: string;
    row: number;
    extractedAt: string;
    version: string;
  };
  rawSource: Readonly<Record<string, string>>;
  sourceStatus: string;
  openedAt: string | null;
  updatedAt: string | null;
  requestedBy: {
    userId: string | null;
    displayName: string | null;
  };
  organization: {
    requestedFor: string | null;
    businessDomain: SourceRequestBusinessDomain;
    businessFunction: string | null;
    costCenter: string | null;
    assignmentGroup: string | null;
  };
  title: string;
  description: string;
  businessJustification: string | null;
  trigger: string | null;
  requestedOutcome: string | null;
  timing: {
    neededBy: string | null;
    targetDecisionDate: string | null;
    contractEndDate: string | null;
  };
  value: {
    amount: number;
    currency: string;
    basis: string;
    validated: false;
  } | null;
  incumbent: {
    supplierName: string | null;
    contractReference: string | null;
  };
  scope: {
    included: string | null;
    excluded: string | null;
    geography: string | null;
    serviceCriticality: string | null;
  };
  governance: {
    regulatedDataFlags: readonly string[];
    dataSystemOwner: string | null;
    budgetStatus: string | null;
    decisionOwner: string | null;
    baselineOwner: string | null;
    securityReviewNeeded: boolean | null;
    legalReviewNeeded: boolean | null;
  };
  attachments: readonly string[];
  requiredFactGaps: readonly (
    | "trigger"
    | "decision_owner"
    | "scope_boundary"
    | "value_target"
    | "baseline_owner"
  )[];
  loadedSegments: readonly TenantContextSegment[];
  mappingProposal: SourceRequestMappingProposal;
  mappingDecision: SourceRequestMappingDecision | null;
  eventLink: null | {
    eventId: string;
    linkedAt: string;
    linkedByUserId: string;
  };
};
