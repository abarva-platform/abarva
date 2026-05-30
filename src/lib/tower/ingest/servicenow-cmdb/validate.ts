import type { CmdbCiRow, CmdbDependencyRow } from './schema';

export interface CmdbValidationIssue {
  kind:
    | 'duplicate_ci_sys_id'
    | 'duplicate_edge'
    | 'orphan_dependency_source'
    | 'orphan_dependency_target'
    | 'retired_ci_referenced';
  message: string;
  ciSysId?: string;
  edge?: CmdbDependencyRow;
}

export interface CmdbValidationResult {
  ok: boolean;
  ciCount: number;
  dependencyCount: number;
  issues: CmdbValidationIssue[];
}

/**
 * Cross-sheet validation:
 *   1. CI sys_ids are unique.
 *   2. Every dependency edge references CIs that exist in the
 *      Configuration Items sheet (FK validation).
 *   3. Duplicate edges (same source/target/type triple) are flagged.
 *   4. Edges that point to a CI whose lifecycle_state is `retired` are
 *      reported as informational warnings — Atlas surfaces these as
 *      "dangling dependency on retired CI" hotspots.
 *
 * The first three are blocking (`ok = false`); the retired-CI warning is
 * not. The caller can decide how to react to the warning class.
 */
export function validateCmdbExtract(args: {
  cis: CmdbCiRow[];
  dependencies: CmdbDependencyRow[];
}): CmdbValidationResult {
  const issues: CmdbValidationIssue[] = [];

  // (1) CI sys_id uniqueness ------------------------------------------------
  const ciBySysId = new Map<string, CmdbCiRow>();
  for (const ci of args.cis) {
    const existing = ciBySysId.get(ci.ciSysId);
    if (existing) {
      issues.push({
        kind: 'duplicate_ci_sys_id',
        message: `Duplicate ci_sys_id "${ci.ciSysId}" — names "${existing.ciName}" and "${ci.ciName}".`,
        ciSysId: ci.ciSysId,
      });
    } else {
      ciBySysId.set(ci.ciSysId, ci);
    }
  }

  // (2) FK + (3) duplicate edge --------------------------------------------
  const seenEdge = new Set<string>();
  for (const edge of args.dependencies) {
    const edgeKey = `${edge.sourceCiSysId}::${edge.targetCiSysId}::${edge.dependencyType}`;
    if (seenEdge.has(edgeKey)) {
      issues.push({
        kind: 'duplicate_edge',
        message: `Duplicate dependency edge (${edge.sourceCiSysId} -> ${edge.targetCiSysId}, ${edge.dependencyType}).`,
        edge,
      });
      continue;
    }
    seenEdge.add(edgeKey);

    const sourceCi = ciBySysId.get(edge.sourceCiSysId);
    const targetCi = ciBySysId.get(edge.targetCiSysId);

    if (!sourceCi) {
      issues.push({
        kind: 'orphan_dependency_source',
        message: `Dependency references unknown source CI "${edge.sourceCiSysId}".`,
        edge,
      });
    }
    if (!targetCi) {
      issues.push({
        kind: 'orphan_dependency_target',
        message: `Dependency references unknown target CI "${edge.targetCiSysId}".`,
        edge,
      });
    }
    // (4) retired-CI warning -- informational
    if (sourceCi?.lifecycleState === 'retired' || targetCi?.lifecycleState === 'retired') {
      issues.push({
        kind: 'retired_ci_referenced',
        message: `Dependency edge touches a retired CI (${edge.sourceCiSysId} -> ${edge.targetCiSysId}).`,
        edge,
      });
    }
  }

  const blocking = issues.some(
    (issue) =>
      issue.kind === 'duplicate_ci_sys_id' ||
      issue.kind === 'duplicate_edge' ||
      issue.kind === 'orphan_dependency_source' ||
      issue.kind === 'orphan_dependency_target',
  );

  return {
    ok: !blocking,
    ciCount: args.cis.length,
    dependencyCount: args.dependencies.length,
    issues,
  };
}
