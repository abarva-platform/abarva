// Build a DeliverableIntelligenceRequest from surface inputs + assembled evidence.
//
// Pure (no I/O) so it is unit-tested directly. The route assembles governed evidence
// and a clean source register, then hands them here with the user's choices (module,
// archetype, deliverable type, audience, decision) to produce the orchestrator request
// with board-grade defaults.

import type {
  AudienceRole,
  DeliverableIntelligenceRequest,
  DeliverableModule,
  GovernedEvidenceItem,
  OutputFormat,
  SourceRegisterEntry,
} from "./types";
import type { AdaptiveDepthDecision } from "@/lib/deliverables/adaptive-depth";
import { resolveQualityBar } from "./quality-bar-registry";

export interface BuildRequestParams {
  module: DeliverableModule;
  useCaseArchetype: string;
  deliverableType: string;
  audience?: AudienceRole[];
  decisionContext: string;
  clientDisplayName: string;
  initiativeDisplayName: string;
  outputFormats?: OutputFormat[];
  adaptiveDepth?: AdaptiveDepthDecision;
}

const DEFAULT_AUDIENCE: Record<DeliverableModule, AudienceRole[]> = {
  source: ["cio", "cpo", "procurement", "steering_committee"],
  moves: ["ceo", "cio", "cfo", "steering_committee"],
  tower: ["cio", "cto", "steering_committee"],
  intelligence: ["cio", "steering_committee"],
};

export function buildDeliverableRequest(
  params: BuildRequestParams,
  evidence: GovernedEvidenceItem[],
  sourceRegister: SourceRegisterEntry[],
): DeliverableIntelligenceRequest {
  return {
    module: params.module,
    useCaseArchetype: params.useCaseArchetype,
    phaseOrStage: "build",
    deliverableType: params.deliverableType,
    audience: params.audience?.length
      ? params.audience
      : DEFAULT_AUDIENCE[params.module],
    decisionContext: params.decisionContext,
    governedEvidenceBundle: evidence,
    sourceRegister,
    missingEvidence: [],
    clientCompleteItems: [],
    approvedAssumptions: [],
    artifactStandard: "ABARVA_BOARD_GRADE_DELIVERABLE_STANDARD",
    outputFormats: params.outputFormats?.length
      ? params.outputFormats
      : ["docx", "xlsx"],
    formattingProfile: {
      bodyPointSize: 11,
      headingStyle: "numbered",
      tableStyle: "banded",
      wideDataToExcelCompanion: true,
      includeCoverPage: true,
      includeTableOfContents: true,
      includeSourceRegisterSection: true,
    },
    qualityBar: {
      ...resolveQualityBar(params.module, params.deliverableType),
      // A source register is a register OF governed evidence. Require it only
      // when there is governed evidence to register — with an empty bundle there
      // is nothing to cite, so blocking on a missing register is a false gate
      // (it made, e.g., a P1 charter on a Move with no ingested evidence
      // impossible to sign off even though the charter is grounded in the
      // human-entered capture). When evidence IS present the register stays
      // mandatory, so grounded deliverables (a discovery report with real
      // evidence) are unchanged and must still cite what they were built on.
      requiresSourceRegister: evidence.length > 0,
    },
    adaptiveDepth: params.adaptiveDepth,
    clientDisplayName: params.clientDisplayName,
    initiativeDisplayName: params.initiativeDisplayName,
  };
}
