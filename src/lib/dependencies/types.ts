export type DependencyNodeKind = 'move_instance' | 'source_workflow_instance';
export type DependencyRelationType = 'depends_on' | 'triggers' | 'informs' | 'blocks';
export type DependencyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'retired';

export interface DependencyNode {
  id: string;
  kind: DependencyNodeKind;
  templateId: string;
  templateSlug: string;
  templateName: string;
  templateKind: 'Move' | 'SourceWorkflow';
  clientId: string;
  engagementId: string | null;
  status: DependencyStatus;
  currentGate: string | null;
  sponsor: string | null;
  dollarImpactUsd: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DependencyEdge {
  id: string;
  clientId: string;
  fromNodeId: string;
  toNodeId: string;
  fromNodeKind: DependencyNodeKind;
  toNodeKind: DependencyNodeKind;
  relationType: DependencyRelationType;
  note: string | null;
  estimatedImpactUsd: number | null;
  metadata: Record<string, unknown>;
  acceptedBy: string | null;
  acceptedAt: string | null;
  declinedBy: string | null;
  declinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MoveDAGFilters {
  statuses?: DependencyStatus[];
  sponsors?: string[];
  minDollarImpactUsd?: number;
}

export interface MoveDAG {
  clientId: string;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  filters: {
    statuses: DependencyStatus[];
    sponsors: string[];
    minDollarImpactUsd: number | null;
  };
}

export interface AddDependencyInput {
  clientId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: DependencyRelationType;
  note?: string | null;
  estimatedImpactUsd?: number | null;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
}

export interface RemoveDependencyInput {
  clientId: string;
  dependencyId?: string;
  fromNodeId?: string;
  toNodeId?: string;
  relationType?: DependencyRelationType;
  actorId?: string | null;
}

export interface SiblingMoveRecommendation {
  id: string;
  templateSlug: string;
  templateId: string | null;
  templateName: string;
  sponsor: string;
  rationale: string;
  relationType: DependencyRelationType;
  dollarImpactUsd: number;
  defaultDecision: 'accept' | 'decline';
}

export interface SourceWorkflowRecommendation {
  id: string;
  templateSlug: string;
  templateId: string | null;
  templateName: string;
  sponsor: string;
  rationale: string;
  relationType: DependencyRelationType;
  dollarImpactUsd: number;
  defaultDecision: 'accept' | 'decline';
}

/**
 * Stable P10/P11/P12 contract.
 *
 * `siblingMoves` are Move templates to instantiate beside the parent Move.
 * `sourceWorkflows` are Source workflow templates to instantiate and link.
 * `edges` names template slugs, not instance ids; the accept flow resolves
 * slugs to the parent/new instances and writes `move_dependencies` rows.
 */
export interface SiblingMoveProposal {
  parentMoveTemplateId: string;
  parentTemplateSlug: string | null;
  parentTemplateName: string | null;
  siblingMoves: SiblingMoveRecommendation[];
  sourceWorkflows: SourceWorkflowRecommendation[];
  edges: Array<{
    id: string;
    fromTemplateSlug: string;
    toTemplateSlug: string;
    relationType: DependencyRelationType;
    note: string;
    estimatedImpactUsd: number;
  }>;
}

export interface SiblingDecision {
  recommendationId: string;
  decision: 'accept' | 'decline';
}

export interface AcceptSiblingRecommendationsInput {
  clientId: string;
  parentMoveInstanceId: string;
  decisions?: SiblingDecision[];
  acceptAll?: boolean;
  includeSourceWorkflows?: boolean;
  actorId?: string | null;
}

export interface AcceptSiblingRecommendationsResult {
  parentMoveInstanceId: string;
  createdInstances: DependencyNode[];
  reusedInstances: DependencyNode[];
  declinedRecommendationIds: string[];
  edges: DependencyEdge[];
}
