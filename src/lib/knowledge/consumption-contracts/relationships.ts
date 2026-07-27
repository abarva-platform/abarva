/**
 * Relationship (graph) query + projection contract.
 *
 * The UI is independent of Apache AGE and Cypher. It queries a relational
 * projection shape (relationship_node_v1 / relationship_edge_v1 /
 * relationship_evidence_v1). The browser never receives SQL, recursive-query
 * details, or unrestricted graph-query capability. One hop by default; a
 * controlled two-hop expansion on request. Accepted edges are solid; candidate
 * edges are dashed; empty graphs are never filled with speculative relationships.
 */

import type { AuthorityState, AvailabilityState } from "./states";
import type { EvidenceDescriptor } from "./core";

export type RelationshipDirection = "outbound" | "inbound" | "both";

export interface RelationshipQuery {
  knowledgeBaselineRef: string;
  focalEntityRefs: string[];

  direction: RelationshipDirection;
  hopDepth: 1 | 2;

  relationshipTypes?: string[];
  entityTypes?: string[];

  /** A target-state edge must never be shown as a current-state edge. */
  currentTargetScope: "current" | "target" | "both";
  /** Active graph shows accepted/published only; candidates are opt-in and dashed. */
  authorityMinimum: "accepted" | "published";

  maxNodes: number;
  maxEdges: number;

  filters?: Record<string, string[]>;
  /** Opt-in: include candidate (dashed) edges alongside accepted ones. */
  includeCandidates?: boolean;
}

export interface RelationshipNodeV1 {
  nodeId: string;
  nodeType: string;
  label: string;
  authorityState: AuthorityState;
  availabilityState: AvailabilityState;
  /** Hop distance from the focal set (0 = focal, 1 = one hop, 2 = two hops). */
  hop: 0 | 1 | 2;
  evidenceRefs: string[];
}

export interface RelationshipEdgeV1 {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: string;
  /** Accepted/published render solid; candidate renders dashed. */
  authorityState: AuthorityState;
  availabilityState: AvailabilityState;
  scope: "current" | "target";
  evidenceRefs: string[];
}

export interface RelationshipEvidenceV1 extends EvidenceDescriptor {
  edgeId: string;
}

export interface RelationshipProjectionV1 {
  focalEntityRefs: string[];
  nodes: RelationshipNodeV1[];
  edges: RelationshipEdgeV1[];
  /** Evidence descriptors keyed by edgeId, for the edge evidence drawer. */
  evidenceByEdge: Record<string, RelationshipEvidenceV1[]>;

  /** Node/edge caps were hit; UI must say so rather than imply completeness. */
  truncated: boolean;
  aggregationApplied: boolean;
  omittedNodeCount: number;

  acceptedEdgeCount: number;
  candidateEdgeCount: number;
  openGapCount: number;
}
