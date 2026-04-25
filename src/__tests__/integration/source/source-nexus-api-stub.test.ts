import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  SOURCE_GOLDEN_EVENT_IDS,
  createSourceNexusApiStubResponse,
  normalizeSourceNexusApiRequestBody,
} from '@/lib/source';

const tenant = {
  tenantId: 'tenant-test',
  tenantName: 'Test Tenant',
};

const user = {
  id: 'user-test',
  email: 'source-test@example.com',
};

describe('Source Nexus API stub contract', () => {
  it('builds a seeded Data and AI event response with deterministic no-model output', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
      prompt: 'What should Nexus do next?',
      mode: 'event',
      userRole: 'sourcingLead',
      tenant,
      user,
    });

    expect(response.ok).toBe(true);
    expect(response.httpStatus).toBe(200);
    expect(response.noModel).toBe(true);
    expect(response.eventId).toBe(SOURCE_GOLDEN_EVENT_IDS.dataAiModernization);
    expect(response.prompt).toBe('What should Nexus do next?');
    expect(response.mode).toBe('event');
    expect(response.contextScope).toBe('event');
    expect(response.contextQuality).toBeTruthy();
    expect(response.context.eventName).toBe('Data & AI Modernization SI Selection');
    expect(response.answerStatus).toBe('blocked');
  });

  it('includes a complete deterministic multi-agent briefing', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
      prompt: 'Give me the Source command read.',
      tenant,
      user,
    });

    expect(response.multiAgentBriefing).toBeTruthy();
    expect(response.multiAgentBriefing?.nexus.agentName).toBe('nexus');
    expect(response.multiAgentBriefing?.sentinel.agentName).toBe('sentinel');
    expect(response.multiAgentBriefing?.atlas.agentName).toBe('atlas');
    expect(response.multiAgentBriefing?.steward.agentName).toBe('steward');
    expect(response.nexusSummary?.primaryFinding).toContain('cannot move cleanly');
    expect(response.summary).toContain('Briefing version source-multi-agent-briefing/v1');
  });

  it('returns validation summaries and suggested actions', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
      tenant,
      user,
    });

    expect(response.contextValidationSummary).toMatchObject({
      verdict: 'defer',
      total: 10,
      passCount: 8,
      deferCount: 2,
      rejectCount: 0,
    });
    expect(response.workflowValidationSummary).toMatchObject({
      verdict: 'defer',
      total: 12,
      deferCount: 1,
      blockCount: 11,
      failCount: 0,
      mismatchCount: 0,
    });
    expect(response.suggestedActions.length).toBeGreaterThanOrEqual(4);
    expect(response.suggestedActions.some((action) => action.actionType === 'askCustomQuestion')).toBe(true);
    expect(response.defers.length).toBeGreaterThan(0);
    expect(response.warnings).toContain('No model was called. Response is deterministic.');
  });

  it('returns a deterministic failure for missing event id', () => {
    const response = createSourceNexusApiStubResponse({
      prompt: 'What is happening?',
      tenant,
      user,
    });

    expect(response.ok).toBe(false);
    expect(response.httpStatus).toBe(400);
    expect(response.noModel).toBe(true);
    expect(response.answerStatus).toBe('error');
    expect(response.error).toMatchObject({
      code: 'missing_event_id',
      missingFields: ['eventId'],
    });
    expect(response.multiAgentBriefing).toBeNull();
  });

  it('returns a deterministic failure for unknown event id', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: 'evt-source-missing',
      prompt: 'What is happening?',
      tenant,
      user,
    });

    expect(response.ok).toBe(false);
    expect(response.httpStatus).toBe(404);
    expect(response.noModel).toBe(true);
    expect(response.answerStatus).toBe('error');
    expect(response.error).toMatchObject({
      code: 'event_not_found',
      missingFields: ['event:evt-source-missing'],
    });
    expect(response.cannotProceedReasons[0]).toContain('Sourcing event evt-source-missing was not found');
  });

  it('normalizes request shape without widening runtime behavior', () => {
    const body = normalizeSourceNexusApiRequestBody({
      prompt: '  Explain readiness  ',
      mode: 'workflow',
      focusArea: 'scope',
      userRole: 'sourcingLead',
      selectedAttachmentIds: [' attachment-1 ', '', 'attachment-1'],
      stageKey: 'scope',
      ignored: 'not part of the contract',
    });

    expect(body).toEqual({
      prompt: 'Explain readiness',
      mode: 'workflow',
      focusArea: 'scope',
      userRole: 'sourcingLead',
      selectedAttachmentIds: ['attachment-1'],
      stageKey: 'scope',
    });
  });

  it('does not import model providers, persistence, upload parsing, or program runtime', () => {
    const helperSource = readFileSync(resolve(process.cwd(), 'src/lib/source/nexus-api.ts'), 'utf8');
    const routeSource = readFileSync(
      resolve(process.cwd(), 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts'),
      'utf8',
    );
    const combined = `${helperSource}\n${routeSource}`;

    expect(combined).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    expect(combined).not.toMatch(/from ['"][^'"]*(supabase|threadRepository|turnRepository|upload|parse|programs\/mock|ProgramSurface)[^'"]*['"]/i);
    expect(combined).not.toContain('runPipeline');
    expect(combined).not.toContain('createThread');
    expect(combined).not.toContain('appendTurn');
  });
});
