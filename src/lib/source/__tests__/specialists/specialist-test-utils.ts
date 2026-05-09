import {
  SOURCE_GOLDEN_EVENT_IDS,
} from '@/lib/source/constants';
import {
  buildSourceContextAssemblyResultFromSeed,
} from '@/lib/source/context-builder';
import {
  getSourceContextValidationReadableReport,
} from '@/lib/source/agent-validation-report';
import {
  getSourceWorkflowValidationReadableReport,
} from '@/lib/source/workflow-validation-report';
import {
  buildSentinelSourceBriefing,
} from '../../sentinel-source-orchestrator';
import type {
  SourceAgentBriefingInput,
  SpecialistContribution,
} from '../../multi-agent-types';

const tenant = {
  tenantId: 'apex-retail',
  tenantKey: 'apexretail',
  tenantName: 'Apex Retail Group',
  activeClientId: 'apexretail',
  activeClientName: 'Apex Retail Group',
};

const user = { id: 'user-specialist-test', email: 'source-specialist@example.com' };

export const generatedAt = '2026-05-09T00:00:00.000Z';

export function buildSpecialistInput(
  eventId: string = SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026,
): SourceAgentBriefingInput {
  const contextResult = buildSourceContextAssemblyResultFromSeed({
    tenant,
    user,
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: `/source/events/${eventId}`,
    surface: 'nexusPanel',
    userPrompt: 'What should happen next?',
    eventId,
    selectedAttachmentIds: [],
  });

  return {
    contextBundle: contextResult.bundle!,
    contextValidationReport: getSourceContextValidationReadableReport({ generatedAt }),
    workflowValidationReport: getSourceWorkflowValidationReadableReport({ generatedAt }),
    generatedAt,
  };
}

export function getSpecialistContribution(
  specialistId: string,
  input: SourceAgentBriefingInput = buildSpecialistInput(),
): SpecialistContribution {
  const briefing = buildSentinelSourceBriefing(input);
  const contribution = briefing.specialistContributions.find((item) =>
    item.specialistId === specialistId,
  );

  if (!contribution) {
    throw new Error(`Missing specialist contribution: ${specialistId}`);
  }

  return contribution;
}

describe('specialist test utilities', () => {
  it('builds a default specialist input fixture', () => {
    expect(buildSpecialistInput().contextBundle.sourcingEvent?.id).toBe(
      SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026,
    );
  });
});
