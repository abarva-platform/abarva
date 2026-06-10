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
} from './types';

export interface BuildRequestParams {
  module: DeliverableModule;
  useCaseArchetype: string;
  deliverableType: string;
  audience?: AudienceRole[];
  decisionContext: string;
  clientDisplayName: string;
  initiativeDisplayName: string;
  outputFormats?: OutputFormat[];
}

const DEFAULT_AUDIENCE: Record<DeliverableModule, AudienceRole[]> = {
  source: ['cio', 'cpo', 'procurement', 'steering_committee'],
  moves: ['ceo', 'cio', 'cfo', 'steering_committee'],
  tower: ['cio', 'cto', 'steering_committee'],
  intelligence: ['cio', 'steering_committee'],
};

export function buildDeliverableRequest(
  params: BuildRequestParams,
  evidence: GovernedEvidenceItem[],
  sourceRegister: SourceRegisterEntry[],
): DeliverableIntelligenceRequest {
  return {
    module: params.module,
    useCaseArchetype: params.useCaseArchetype,
    phaseOrStage: 'build',
    deliverableType: params.deliverableType,
    audience: params.audience?.length ? params.audience : DEFAULT_AUDIENCE[params.module],
    decisionContext: params.decisionContext,
    governedEvidenceBundle: evidence,
    sourceRegister,
    missingEvidence: [],
    clientCompleteItems: [],
    approvedAssumptions: [],
    artifactStandard: 'ABARVA_BOARD_GRADE_DELIVERABLE_STANDARD',
    outputFormats: params.outputFormats?.length ? params.outputFormats : ['docx', 'xlsx'],
    formattingProfile: {
      bodyPointSize: 11,
      headingStyle: 'numbered',
      tableStyle: 'banded',
      wideDataToExcelCompanion: true,
      includeCoverPage: true,
      includeTableOfContents: true,
      includeSourceRegisterSection: true,
    },
    qualityBar: {
      minSections: 6,
      minBodyWords: 600,
      requiresCitations: true,
      requiresDecisionSection: true,
      requiresRecommendation: true,
      requiresRiskTable: true,
      requiresSourceRegister: true,
      requiresClientCompleteChecklistWhenGaps: true,
      tone: 'board_grade_consulting',
    },
    clientDisplayName: params.clientDisplayName,
    initiativeDisplayName: params.initiativeDisplayName,
  };
}
