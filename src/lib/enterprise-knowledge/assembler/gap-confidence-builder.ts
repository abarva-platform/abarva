import type {
  ContextConfidenceSummary,
  ContextGap,
  ModuleContextRequest,
  UnsupportedClaim,
} from "../contracts";
import type { ContextAssemblyInput } from "./fixture-input";

export function buildContextGaps(input: ContextAssemblyInput): ContextGap[] {
  const { blueprint, semanticCluster } = input;
  const issueGaps = semanticCluster.issues.map((issue, index) => ({
    gapId: `${blueprint.catalogKey}-issue-gap-${index + 1}`,
    tenantKey: blueprint.tenantKey,
    category: "missing_evidence" as const,
    severity: index === 0 ? ("blocker" as const) : ("warning" as const),
    title: `${blueprint.clusterName} issue ${index + 1}`,
    description: issue,
    affectedEntityIds: [`${blueprint.catalogKey}-function`],
    requiredEvidence: [
      "source-owner attestation",
      "validated metric baseline",
      "relationship review",
    ],
    truthStatus: "synthetic_review" as const,
    evidenceRefs: [],
    blocksActivePromotion: true,
    blocksModuleAnswer: index === 0,
  }));

  const relationshipGap: ContextGap = {
    gapId: `${blueprint.catalogKey}-relationship-validation-gap`,
    tenantKey: blueprint.tenantKey,
    category: "missing_relationship",
    severity: "warning",
    title: "Relationship validation required",
    description:
      "Relationship candidates are preserved for context assembly, but are not treated as validated active graph truth.",
    affectedEntityIds: [`${blueprint.catalogKey}-function`],
    requiredEvidence: ["SME relationship validation", "lineage evidence"],
    truthStatus: "synthetic_review",
    evidenceRefs: [],
    blocksActivePromotion: true,
    blocksModuleAnswer: false,
  };

  return [...issueGaps, relationshipGap];
}

export function buildConfidenceSummary(
  input: ContextAssemblyInput,
): ContextConfidenceSummary {
  const breadth = Math.min(95, 60 + input.blueprint.systems.length * 3);
  const depth = Math.min(90, 58 + input.semanticCluster.rowsMatched / 4);
  const relationshipCoverage = Math.min(
    82,
    45 + input.semanticCluster.relationshipsPresent,
  );
  const evidenceCoverage = Math.min(
    88,
    55 + input.semanticCluster.evidenceItems.length * 6,
  );
  const answerability = Math.min(84, Math.round((breadth + depth + evidenceCoverage) / 3));
  return {
    breadth,
    depth: Math.round(depth),
    relationshipCoverage,
    evidenceCoverage,
    answerability,
    overall: answerability >= 75 ? "good" : "limited",
    rationale:
      "The cluster has enough semantic depth for dry-run context assembly, but remains synthetic review context with candidate relationship edges.",
  };
}

export function unsupportedClaimsForRequest(
  input: ContextAssemblyInput,
): UnsupportedClaim[] {
  const base: UnsupportedClaim[] = [
    {
      claimId: `${input.blueprint.catalogKey}-active-truth-claim`,
      description: "This dry-run fixture is active tenant truth.",
      reason: "candidate_only" as const,
    },
    {
      claimId: `${input.blueprint.catalogKey}-validated-relationship-claim`,
      description: "Relationship candidates are validated active graph dependencies.",
      reason: "requires_relationship_validation" as const,
    },
  ];
  if (requiresMeasuredValue(input.request)) {
    base.push({
      claimId: `${input.blueprint.catalogKey}-realized-value-claim`,
      description: "This dry-run fixture proves realized value or savings.",
      reason: "requires_measured_value" as const,
    });
  }
  return base;
}

function requiresMeasuredValue(request: ModuleContextRequest): boolean {
  return request.moduleKey === "tower" || request.moduleKey === "source";
}
