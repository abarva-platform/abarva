export type VendorIntelligenceState =
  | "vendor_published"
  | "contract_confirmed"
  | "implementation_confirmed"
  | "client_observed"
  | "unknown"
  | "not_applicable";

export type VendorCapabilitySourceClass =
  | "vendor_published"
  | "independent_reference"
  | "contract_confirmed"
  | "client_observed";

export type VendorIntelligenceReviewStatus =
  | "draft"
  | "steward_reviewed"
  | "approved";

export interface EvidenceReference {
  refId: string;
  title: string;
  url: string;
  publisher: string;
  retrievedAt: string;
}

export interface VendorCapability {
  capabilityId: string;
  name: string;
  publicDescription: string;
  sourceClass: VendorCapabilitySourceClass;
  commonInputs: string[];
  commonProcessing: string[];
  commonOutputs: string[];
  discoveryQuestions: string[];
  evidenceRequests: string[];
  repatriationRisks: string[];
  confidence: "high" | "medium" | "low";
  sourceRefIds: string[];
}

export interface DataInputPattern {
  patternId: string;
  label: string;
  examples: string[];
}

export interface OutputPattern {
  patternId: string;
  label: string;
  examples: string[];
}

export interface OperatingPattern {
  patternId: string;
  label: string;
  questions: string[];
}

export interface DependencyPattern {
  patternId: string;
  label: string;
  risk: string;
}

export interface ExitRiskPattern {
  patternId: string;
  label: string;
  questions: string[];
}

export interface DiscoveryTrigger {
  triggerId: string;
  capabilityId?: string;
  questionSetId: string;
  condition: string;
  questions: string[];
  evidenceRequests: string[];
}

export interface VendorPlatformProfile {
  vendorId: string;
  vendorName: string;
  platformFamily: string;
  profileVersion: string;
  validAsOf: string;
  platformArchetype: "MANAGED_ANALYTICS_PLATFORM";
  capabilityFamilies: VendorCapability[];
  typicalInputs: DataInputPattern[];
  typicalOutputs: OutputPattern[];
  typicalOperatingModel: OperatingPattern[];
  commonHiddenDependencies: DependencyPattern[];
  contractAndExitRisks: ExitRiskPattern[];
  p2DiscoveryTriggers: DiscoveryTrigger[];
  sourceRefs: EvidenceReference[];
  reviewStatus: VendorIntelligenceReviewStatus;
}

export interface ClientDataFeed {
  feedId: string;
  label: string;
  sourceSystem?: string;
  status: VendorIntelligenceState;
}

export interface TransformationRecord {
  transformationId: string;
  capabilityId?: string;
  label: string;
  status: VendorIntelligenceState;
  evidenceRefs: string[];
}

export interface AugmentationRecord {
  augmentationId: string;
  label: string;
  status: VendorIntelligenceState;
  evidenceRefs: string[];
}

export interface ClientOutput {
  outputId: string;
  label: string;
  capabilityId?: string;
  status: VendorIntelligenceState;
  evidenceRefs: string[];
}

export interface ClientWorkflow {
  workflowId: string;
  label: string;
  capabilityId?: string;
  status: VendorIntelligenceState;
  evidenceRefs: string[];
}

export interface SupportModel {
  status: VendorIntelligenceState;
  description: string;
  evidenceRefs: string[];
}

export interface EvidenceBackedFact {
  factId: string;
  statement: string;
  evidenceRefs: string[];
}

export interface EvidenceGap {
  gapId: string;
  label: string;
  capabilityId?: string;
  status: "unknown";
}

export interface EvidenceConflict {
  conflictId: string;
  label: string;
  evidenceRefs: string[];
}

export interface ClientVendorDeploymentProfile {
  tenantKey: string;
  vendorId: string;
  contractRefs: string[];
  licensedModules: string[];
  implementedCapabilities: string[];
  unusedLicensedCapabilities: string[];
  clientInputs: ClientDataFeed[];
  knownTransformations: TransformationRecord[];
  knownAugmentations: AugmentationRecord[];
  outputs: ClientOutput[];
  workflows: ClientWorkflow[];
  supportModel: SupportModel | null;
  confirmedFacts: EvidenceBackedFact[];
  unknowns: EvidenceGap[];
  conflicts: EvidenceConflict[];
}

export interface ResolvedVendorCapabilityState {
  capabilityId: string;
  capabilityName: string;
  vendorPublished: boolean;
  contractConfirmed: boolean;
  implementationConfirmed: boolean;
  clientObserved: boolean;
  state: VendorIntelligenceState;
}

export interface VendorDiscoveryQuestionSet {
  questionSetId: string;
  capabilityId?: string;
  title: string;
  reason: string;
  questions: string[];
  evidenceRequests: string[];
  state: VendorIntelligenceState;
}

export interface VendorDiscoveryWorkbookTab {
  tabKey: string;
  title: string;
  purpose: string;
  capabilityIds: string[];
  questionSetIds: string[];
  questions: string[];
  evidenceRequests: string[];
}

export interface VendorDiscoveryPlan {
  vendorId: string;
  tenantKey: string;
  platformArchetype: "MANAGED_ANALYTICS_PLATFORM";
  summary: {
    capabilitiesPotentiallyRelevant: number;
    confirmedFromContract: number;
    confirmedInCurrentUse: number;
    needConfirmation: number;
    evidenceGaps: number;
  };
  capabilityStates: ResolvedVendorCapabilityState[];
  requiredQuestionSets: VendorDiscoveryQuestionSet[];
  workbookTabs: VendorDiscoveryWorkbookTab[];
}
