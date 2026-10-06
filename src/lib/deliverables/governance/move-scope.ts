/**
 * The Move Scope Contract, and the evidence admission engine above it.
 *
 * This is the first control in the stack because it defines the evidence
 * universe a Move is allowed to reason over at all. Everything downstream —
 * which artifact is eligible, what the model is told, what the gates check — is
 * downstream of getting this wrong.
 *
 * Measured defect this exists to prevent: a P2 assessment for one contact-centre
 * capability was generated from 159 governed evidence items, of which 103 had no
 * connection to the Move — enterprise IT budget lines, other use cases' risks,
 * and the economics of seven unrelated AI programmes. Twenty reached the
 * rendered deck. The planner wrote an enterprise AI portfolio story because that
 * is what it was handed.
 *
 * The inversion:
 *
 *     no admission path → no evidence admission
 *
 * A relevance score may rank INSIDE the admitted set. It may never expand it,
 * and it has no standing over Move-process uploads at all. "It is also about AI"
 * is topic similarity, and topic similarity is what put a Copilot comparison in
 * a pack addressed to the VP of Member Services.
 */

export type AdmissionBasis = 'move_upload' | 'move_scope' | 'named_object' | 'enterprise_anchor' | 'benchmark';
export type TraversalDepth = 0 | 1 | 2;

/** Declared from governed intake using IDs. Never inferred from text. */
export interface MoveScope {
  moveId: string;
  version: number;
  capabilityIds: string[];
  programmeIds: string[];
  systemIds: string[];
  dataDomains: string[];
  businessFunctions: string[];
  accountableOwnerIds: string[];
  vendorIds: string[];
}

/**
 * Scope changes are governed decisions, never silent inference.
 *
 * Scope is the one place this whole control can be defeated: adding an
 * enterprise domain to a Move would make its evidence admissible and the engine
 * would correctly accept it. A control whose bypass is one unlogged field edit
 * is not a control.
 */
export interface ScopeAmendment {
  moveId: string;
  fromVersion: number;
  toVersion: number;
  actorId: string;
  reason: string;
  at: string;
  changes: { field: keyof Omit<MoveScope, 'moveId' | 'version'>; added: string[]; removed: string[] }[];
}

export interface GraphEdge {
  fromId: string;
  relationshipType: string;
  toId: string;
}

/** One governed record offered for admission. */
export interface EvidenceCandidate {
  evidenceId: string;
  family: string;
  /** Governed object ids this record is about. */
  objectIds: string[];
  /** True when loaded through the Move's own intake at any phase. */
  fromMoveUpload?: boolean;
  /** The phase that loaded it, for reporting. */
  uploadedAtPhase?: string;
}

export interface EvidenceAdmissionPolicy {
  policyVersion: string;
  artifactType: string;
  archetype: string;
  required: { family: string; minItems: number; requiredEvidenceKeys?: string[]; maxDepth: TraversalDepth }[];
  permitted: { family: string; maxDepth: TraversalDepth; maxItems?: number }[];
  benchmark: { family: string; appendixOnly: true; mustBeLabelled: true }[];
  excluded: string[];
  /** Which edge types are legal at each depth. "Two hops away" is not a specification. */
  legalEdges: { depth: 1 | 2; relationshipTypes: string[] }[];
  /**
   * Families that are not evidence ABOUT the Move and so are not subject to
   * admission at all.
   *
   * The first shadow run excluded the artifact's own claim-boundary record,
   * correctly by the rules as written and absurdly in effect: a constraint on
   * what may be claimed names no system and sits on no edge, so it failed to
   * find a path and was dropped. Constraints govern the artifact; they are not
   * candidates for inclusion in it.
   */
  alwaysAdmit?: string[];
}

export interface EvidenceAdmissionDecision {
  evidenceId: string;
  admitted: boolean;
  artifactType: string;
  policyVersion: string;
  family: string;
  admittedBy: AdmissionBasis | null;
  traversalDepth: TraversalDepth | null;
  traversalPath: GraphEdge[];
  reason: string;
}

function scopeObjectIds(scope: MoveScope): Set<string> {
  return new Set([
    ...scope.capabilityIds,
    ...scope.programmeIds,
    ...scope.systemIds,
    ...scope.dataDomains,
    ...scope.businessFunctions,
    ...scope.accountableOwnerIds,
    ...scope.vendorIds,
  ]);
}

/**
 * Shortest legal path from any scope object to any of the candidate's objects.
 *
 * Legality is per depth AND per relationship type. A depth budget alone would
 * admit anything two hops away through any edge, which in a richly connected
 * tenant graph is most of the estate.
 */
function findPath(
  candidate: EvidenceCandidate,
  scope: MoveScope,
  edges: GraphEdge[],
  maxDepth: TraversalDepth,
  legalEdges: EvidenceAdmissionPolicy['legalEdges'],
): { depth: TraversalDepth; path: GraphEdge[] } | null {
  const targets = new Set(candidate.objectIds);
  const roots = scopeObjectIds(scope);

  for (const id of candidate.objectIds) {
    if (roots.has(id)) return { depth: 0, path: [] };
  }
  if (maxDepth === 0) return null;

  const legalAt = (depth: 1 | 2) =>
    new Set(legalEdges.find((l) => l.depth === depth)?.relationshipTypes ?? []);

  // Breadth-first, one depth at a time, so the recorded depth is the shortest
  // legal one rather than whichever the traversal happened to find.
  let frontier: { id: string; path: GraphEdge[] }[] = [...roots].map((id) => ({ id, path: [] }));
  const seen = new Set(roots);

  for (let depth = 1 as 1 | 2; depth <= maxDepth; depth = (depth + 1) as 1 | 2) {
    const allowed = legalAt(depth);
    const next: { id: string; path: GraphEdge[] }[] = [];
    for (const node of frontier) {
      for (const edge of edges) {
        if (!allowed.has(edge.relationshipType)) continue;
        const step = edge.fromId === node.id ? edge.toId : edge.toId === node.id ? edge.fromId : null;
        if (!step || seen.has(step)) continue;
        const path = [...node.path, edge];
        if (targets.has(step)) return { depth: depth as TraversalDepth, path };
        seen.add(step);
        next.push({ id: step, path });
      }
    }
    frontier = next;
  }
  return null;
}

export interface AdmissionInput {
  scope: MoveScope;
  policy: EvidenceAdmissionPolicy;
  candidates: EvidenceCandidate[];
  edges: GraphEdge[];
  /** Families that establish the enterprise frame; always permitted, capped. */
  enterpriseAnchorFamilies?: string[];
  enterpriseAnchorMaxItems?: number;
}

export function admitEvidence(input: AdmissionInput): EvidenceAdmissionDecision[] {
  const { scope, policy, candidates, edges } = input;
  const anchorFamilies = new Set(input.enterpriseAnchorFamilies ?? []);
  const anchorCap = input.enterpriseAnchorMaxItems ?? 3;

  const familyRule = (family: string) => {
    const required = policy.required.find((r) => r.family === family);
    if (required) return { kind: 'required' as const, maxDepth: required.maxDepth };
    const permitted = policy.permitted.find((p) => p.family === family);
    if (permitted) return { kind: 'permitted' as const, maxDepth: permitted.maxDepth, maxItems: permitted.maxItems };
    const benchmark = policy.benchmark.find((b) => b.family === family);
    if (benchmark) return { kind: 'benchmark' as const, maxDepth: 0 as TraversalDepth };
    return null;
  };

  const decide = (c: EvidenceCandidate, base: Omit<EvidenceAdmissionDecision, 'admitted' | 'admittedBy' | 'traversalDepth' | 'traversalPath' | 'reason'>): EvidenceAdmissionDecision => {
    // Tier A: loaded through the Move's own process. Admitted unconditionally —
    // it does not have to earn admission, it is the reason the Move has evidence.
    if (c.fromMoveUpload) {
      return {
        ...base,
        admitted: true,
        admittedBy: 'move_upload',
        traversalDepth: 0,
        traversalPath: [],
        reason: `uploaded through the Move process${c.uploadedAtPhase ? ` at ${c.uploadedAtPhase}` : ''}`,
      };
    }

    if (policy.excluded.includes(c.family)) {
      return { ...base, admitted: false, admittedBy: null, traversalDepth: null, traversalPath: [], reason: `family "${c.family}" is excluded by policy ${policy.policyVersion}` };
    }

    if ((policy.alwaysAdmit ?? []).includes(c.family)) {
      return { ...base, admitted: true, admittedBy: 'move_scope', traversalDepth: 0, traversalPath: [], reason: 'governs the artifact rather than being evidence within it' };
    }

    if (anchorFamilies.has(c.family)) {
      return { ...base, admitted: true, admittedBy: 'enterprise_anchor', traversalDepth: 0, traversalPath: [], reason: 'establishes the enterprise frame the assessment opens with' };
    }

    const rule = familyRule(c.family);
    if (!rule) {
      return { ...base, admitted: false, admittedBy: null, traversalDepth: null, traversalPath: [], reason: `family "${c.family}" appears in no clause of policy ${policy.policyVersion}` };
    }

    const found = findPath(c, scope, edges, rule.maxDepth, policy.legalEdges);
    if (!found) {
      return { ...base, admitted: false, admittedBy: null, traversalDepth: null, traversalPath: [], reason: `no legal path from declared scope within depth ${rule.maxDepth}` };
    }

    return {
      ...base,
      admitted: true,
      admittedBy: rule.kind === 'benchmark' ? 'benchmark' : found.depth === 0 ? 'move_scope' : 'named_object',
      traversalDepth: found.depth,
      traversalPath: found.path,
      reason:
        found.depth === 0
          ? 'names a declared scope object'
          : `reached from declared scope in ${found.depth} legal hop${found.depth === 1 ? '' : 's'}`,
    };
  };

  const decisions = candidates.map((c) =>
    decide(c, { evidenceId: c.evidenceId, artifactType: policy.artifactType, policyVersion: policy.policyVersion, family: c.family }),
  );

  // Caps applied after admission so the reason survives: an item cut for a cap
  // was admissible, which is different from inadmissible and is reported so.
  const seenInFamily = new Map<string, number>();
  for (const d of decisions) {
    if (!d.admitted || d.admittedBy === 'move_upload') continue;
    const cap = d.admittedBy === 'enterprise_anchor' ? anchorCap : familyRule(d.family)?.kind === 'permitted' ? (policy.permitted.find((p) => p.family === d.family)?.maxItems ?? Infinity) : Infinity;
    const used = (seenInFamily.get(d.family) ?? 0) + 1;
    seenInFamily.set(d.family, used);
    if (used > cap) {
      d.admitted = false;
      d.reason = `admissible, but family "${d.family}" is capped at ${cap} items for this artifact`;
      d.admittedBy = null;
      d.traversalDepth = null;
      d.traversalPath = [];
    }
  }

  return decisions;
}
