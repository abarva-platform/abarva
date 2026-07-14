import type { EntityProfile, EvidenceRef, RelationshipEdge } from "../contracts";
import type { ContextAssemblyInput } from "./fixture-input";

export function buildRelationshipSlice(
  input: ContextAssemblyInput,
  profiles: EntityProfile[],
  evidenceRefs: EvidenceRef[],
): RelationshipEdge[] {
  const functionProfile =
    profiles.find((profile) => profile.entityType === "function") ?? profiles[0];
  return profiles
    .filter((profile) => profile.profileId !== functionProfile.profileId)
    .map((profile, index) => ({
      relationshipId: `${input.blueprint.catalogKey}-assembler-edge-${index + 1}`,
      tenantKey: input.blueprint.tenantKey,
      sourceEntityId: functionProfile.profileId,
      sourceEntityType: functionProfile.entityType,
      targetEntityId: profile.profileId,
      targetEntityType: profile.entityType,
      relationshipType:
        profile.entityType === "metric"
          ? "measures"
          : profile.entityType === "risk"
            ? "risks"
            : profile.entityType === "vendor"
              ? "supports"
              : index % 2 === 0
                ? "depends_on"
                : "uses",
      businessMeaning: `${functionProfile.entityName} connects to ${profile.entityName} for the ${input.intent.archetypeKey} request.`,
      evidenceRefs: [evidenceRefs[index % evidenceRefs.length]].filter(Boolean),
      truthStatus: "synthetic_review",
      readiness: "candidate",
      confidence: 0.74,
      caveats: ["Dry-run relationship candidate; not validated active graph truth."],
    }));
}
