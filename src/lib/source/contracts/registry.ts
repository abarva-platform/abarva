// Public surface for the SourceArtifactContract registry (PR 4A). Routes,
// generation, review, export, and context-binding code should import from
// here — never reach into canonical-specs/artifact-specs.ts,
// agent-generation/prompt-registry.ts, or documentation-standards/
// source-artifact-profiles.ts directly for eligibility/authority decisions;
// this module is the single join point.

import { SOURCE_STAGE_ORDER } from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";
import { SOURCE_ARTIFACT_CONTRACT_REGISTRY } from "./build-registry";
import type { SourceArtifactContract } from "./types";

export type { SourceArtifactContract } from "./types";
export { SourceArtifactContractSchema } from "./schema";

/** All contracts, in artifact-specs.ts's declared order (stage order, then within-stage order). */
export function listSourceArtifactContracts(): SourceArtifactContract[] {
  return Array.from(SOURCE_ARTIFACT_CONTRACT_REGISTRY.values());
}

export function getSourceArtifactContract(
  code: string,
): SourceArtifactContract | null {
  return SOURCE_ARTIFACT_CONTRACT_REGISTRY.get(code) ?? null;
}

export function requireSourceArtifactContract(
  code: string,
): SourceArtifactContract {
  const contract = getSourceArtifactContract(code);
  if (!contract) {
    throw new Error(
      `source-artifact-contract: no contract registered for code "${code}"`,
    );
  }
  return contract;
}

export function contractsForStage(
  stage: SourceStageKey,
): SourceArtifactContract[] {
  return listSourceArtifactContracts().filter(
    (c) => c.sourcingStage === stage,
  );
}

/**
 * True iff `eventStage` is at or after the artifact's earliest eligible
 * stage — contract rule "An artifact cannot generate before its earliest
 * eligible stage." Once eligible, an artifact stays eligible at every later
 * stage too (allowedGenerationStages), matching current real behavior where
 * nothing today blocks generating an earlier-stage artifact from a later
 * stage — this only newly blocks generating BEFORE eligibility, which
 * nothing currently checks at all.
 */
export function isArtifactEligibleAtStage(
  code: string,
  eventStage: SourceStageKey,
): boolean {
  const contract = getSourceArtifactContract(code);
  if (!contract) return false;
  return contract.allowedGenerationStages.includes(eventStage);
}

export interface UpstreamRequirementCheck {
  code: string;
  satisfied: boolean;
}

/**
 * Given the set of upstream codes that currently have an accepted
 * authoritative body (caller-resolved — this function is pure and does not
 * itself decide what "accepted authoritative" means), report which of this
 * artifact's REQUIRED upstream codes are missing. Empty array means
 * generation may proceed on upstream grounds (stage eligibility is a
 * separate check, see isArtifactEligibleAtStage).
 */
export function missingRequiredUpstream(
  code: string,
  authoritativeUpstreamCodes: ReadonlySet<string>,
): string[] {
  const contract = requireSourceArtifactContract(code);
  return contract.requiredUpstreamArtifacts.filter(
    (upstream) => !authoritativeUpstreamCodes.has(upstream),
  );
}

/** Re-exported for callers that need the raw stage order without importing constants.ts directly. */
export const SOURCE_ARTIFACT_CONTRACT_STAGE_ORDER: readonly SourceStageKey[] =
  SOURCE_STAGE_ORDER;
