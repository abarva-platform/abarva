import type { AvaMode, AvaSurface } from "@/lib/ava-answer/contract";

export type AvaRetrievalSubstrate =
  | "semantic2"
  | "module_read_model"
  | "production_view"
  | "chunk"
  | "corpus"
  | "expert_pack";

export interface AvaRetrievalPolicy {
  surface: AvaSurface;
  mode: AvaMode;
  orderedSubstrates: AvaRetrievalSubstrate[];
  corpusAllowed: boolean;
  expertsAllowed: boolean;
  tenantFactsRequiredForTenantClaims: boolean;
  chunksOnlyForNarrativeSupport: boolean;
}

const SHARED_ORDER: AvaRetrievalSubstrate[] = [
  "semantic2",
  "module_read_model",
  "production_view",
  "chunk",
];

export function retrievalPolicyForSurface(
  surface: AvaSurface,
  mode: AvaMode,
): AvaRetrievalPolicy {
  const advisorySurface = surface === "intelligence" || surface === "source";
  return {
    surface,
    mode,
    orderedSubstrates: advisorySurface
      ? [...SHARED_ORDER, "corpus", "expert_pack"]
      : SHARED_ORDER,
    corpusAllowed: advisorySurface,
    expertsAllowed: advisorySurface,
    tenantFactsRequiredForTenantClaims: true,
    chunksOnlyForNarrativeSupport: true,
  };
}

export function assertRetrievalPolicy(input: {
  surface: AvaSurface;
  mode: AvaMode;
  corpusUsed?: unknown[];
  expertsUsed?: unknown[];
}): string[] {
  const policy = retrievalPolicyForSurface(input.surface, input.mode);
  const violations: string[] = [];
  if (!policy.corpusAllowed && (input.corpusUsed?.length ?? 0) > 0) {
    violations.push(
      `${input.surface} cannot use corpus content as answer material.`,
    );
  }
  if (!policy.expertsAllowed && (input.expertsUsed?.length ?? 0) > 0) {
    violations.push(
      `${input.surface} cannot render expert-pack participation.`,
    );
  }
  return violations;
}
