export type ArchitectureEvidenceState =
  | "evidenced"
  | "inferred"
  | "unresolved"
  | "proposed_target_state";

export type ArchitectureLayer =
  | "business"
  | "source"
  | "integration"
  | "data_platform"
  | "transformation"
  | "consumption"
  | "ai_and_decision";

export type ArchitectureNodeKind =
  | "business_capability"
  | "business_process"
  | "source_system"
  | "application"
  | "integration_tool"
  | "interface"
  | "data_pipeline"
  | "database"
  | "data_platform"
  | "analytics_platform"
  | "reporting_tool"
  | "ai_platform"
  | "external_provider"
  | "vendor";

export type ArchitectureEdgeKind =
  | "feeds"
  | "extracts_from"
  | "transforms"
  | "replicates_to"
  | "publishes_to"
  | "consumed_by"
  | "integrates_with"
  | "hosts"
  | "operated_by"
  | "contracted_through"
  | "supports";

export interface ArchitectureScope {
  tenantKey: string;
  datasetId: string;
  perspective:
    | "executive_landscape"
    | "full_data_ai_architecture"
    | "application_integration"
    | "vendor_sourcing"
    | "ai_activation"
    | "current_to_target";
}

export interface ArchitectureGroup {
  groupRef: string;
  label: string;
  groupKind:
    | "layer"
    | "business_function"
    | "ownership"
    | "hosting"
    | "lifecycle"
    | "vendor";
  order: number;
}

export interface ArchitectureNode {
  nodeRef: string;
  nodeKind: ArchitectureNodeKind;
  label: string;
  shortLabel?: string;
  layer: ArchitectureLayer;
  domain?: string;
  businessFunction?: string;
  businessCapability?: string;
  ownerRole?: string;
  ownershipType?: string;
  vendorRef?: string;
  vendorName?: string;
  applicationRef?: string;
  platformRef?: string;
  contractRefs?: string[];
  hostingModel?: string;
  cloudProvider?: string;
  location?: string;
  environment?: string;
  criticality?: string;
  lifecycleState?: string;
  modernizationState?: string;
  applicationType?: string;
  technology?: string;
  annualCost?: number;
  currency?: string;
  userCount?: number;
  reportCount?: number;
  interfaceCount?: number;
  dataVolume?: number;
  dataVolumeUnit?: string;
  incidentVolume?: number;
  changeVolume?: number;
  evidenceState: Exclude<ArchitectureEvidenceState, "proposed_target_state">;
  confidence?: number;
  evidenceRefs: string[];
}

export interface ArchitectureEdge {
  edgeRef: string;
  fromNodeRef: string;
  toNodeRef: string;
  edgeKind: ArchitectureEdgeKind;
  interfaceType?: string;
  direction?: string;
  frequency?: string;
  latency?: string;
  dataVolume?: number;
  dataVolumeUnit?: string;
  criticality?: string;
  vendorRef?: string;
  contractRef?: string;
  evidenceState: ArchitectureEvidenceState;
  confidence?: number;
  evidenceRefs: string[];
}

export interface ArchitectureOverlay {
  overlayRef: string;
  label: string;
  metricKey: string;
  appliesTo: "node" | "edge";
  supported: boolean;
  unit?: string;
  description: string;
}

export interface ArchitectureMetric {
  metricRef: string;
  subjectRef: string;
  label: string;
  value?: number;
  valueText?: string;
  unit?: string;
  evidenceState: ArchitectureEvidenceState;
  evidenceRefs: string[];
}

export interface ArchitectureEvidenceGap {
  gapRef: string;
  severity: "high" | "medium" | "low";
  subjectRef?: string;
  area: string;
  gap: string;
  implication: string;
  evidenceRefs: string[];
}

export interface ArchitectureFinding {
  findingRef: string;
  severity: "high" | "medium" | "low";
  headline: string;
  body: string;
  affectedRefs: string[];
  evidenceRefs: string[];
}

export interface ArchitectureLineage {
  evidenceRef: string;
  table: string;
  sourceFile?: string;
  sourceSheet?: string;
  sourceRowNumber?: string;
  rowHash?: string;
  description: string;
}

export interface ArchitectureGraph {
  scope: ArchitectureScope;
  title: string;
  asOfDate: string;
  inputFingerprint: string;
  groups: ArchitectureGroup[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  overlays: ArchitectureOverlay[];
  metrics: ArchitectureMetric[];
  evidenceGaps: ArchitectureEvidenceGap[];
  deterministicFindings: ArchitectureFinding[];
  lineage: ArchitectureLineage[];
}

export interface AdvisoryStatement {
  headline: string;
  body: string;
  evidenceRefs: string[];
  confidence: "high" | "moderate" | "low";
}

export interface AdvisoryCallout extends AdvisoryStatement {
  anchorRef: string;
  calloutType: "strength" | "constraint" | "risk" | "opportunity" | "decision";
  businessImplication: string;
}

export interface ArchitecturePattern extends AdvisoryStatement {
  patternType:
    | "operating_model"
    | "integration"
    | "data"
    | "application"
    | "ai_activation";
  affectedRefs: string[];
}

export interface ArchitectureDependency extends AdvisoryStatement {
  dependencyRef: string;
  fromRef?: string;
  toRef?: string;
  riskLevel: "high" | "medium" | "low";
}

export interface TransformationPriority extends AdvisoryStatement {
  priorityRef: string;
  recommendedAction:
    | "scale"
    | "accelerate"
    | "redesign"
    | "fix"
    | "consolidate"
    | "pause"
    | "stop"
    | "discover";
  firstStep: string;
  affectedRefs: string[];
}

export interface TargetStatePrinciple extends AdvisoryStatement {
  principleRef: string;
}

export interface LeadershipDecision extends AdvisoryStatement {
  decisionRef: string;
  decisionOwnerRole: string;
  decisionNeededBy: string;
}

export interface NodeEmphasis {
  nodeRef: string;
  emphasis: "halo" | "warning" | "fade" | "focus";
  rationale: string;
  evidenceRefs: string[];
}

export interface EdgeEmphasis {
  edgeRef: string;
  emphasis: "warning" | "focus" | "fade";
  rationale: string;
  evidenceRefs: string[];
}

export interface DiagramCallout extends AdvisoryCallout {
  placement: "top" | "right" | "bottom" | "left";
}

export interface AdvisoryEvidenceGap extends ArchitectureEvidenceGap {
  recommendedEvidenceRequest: string;
}

export interface ArchitectureAdvisory {
  title: string;
  executiveThesis: string;
  strengths: AdvisoryCallout[];
  constraints: AdvisoryCallout[];
  businessImplications: AdvisoryStatement[];
  architecturePatterns: ArchitecturePattern[];
  criticalDependencies: ArchitectureDependency[];
  duplicationAndConsolidationOpportunities: AdvisoryStatement[];
  aiReadinessImplications: AdvisoryStatement[];
  transformationPriorities: TransformationPriority[];
  targetStatePrinciples: TargetStatePrinciple[];
  leadershipDecisions: LeadershipDecision[];
  nodeEmphasis: NodeEmphasis[];
  edgeEmphasis: EdgeEmphasis[];
  diagramCallouts: DiagramCallout[];
  assumptions: AdvisoryStatement[];
  evidenceGaps: AdvisoryEvidenceGap[];
}

export interface ArchitectureSnapshot {
  snapshotId: string;
  tenantKey: string;
  scope: string;
  graphInputFingerprint: string;
  graphJson: ArchitectureGraph;
  advisoryInputFingerprint: string;
  advisoryJson: ArchitectureAdvisory;
  layoutVersion: string;
  rendererVersion: string;
  renderedSvg?: string;
  thumbnailUri?: string;
  generatedAt: string;
  publishedAt?: string;
  staleAt?: string;
  staleReason?: string;
}
