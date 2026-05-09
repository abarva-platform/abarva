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

  it('includes a complete Sentinel-orchestrated briefing with specialist trace', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
      prompt: 'Give me the Source command read.',
      tenant,
      user,
    });

    // Sentinel orchestrator is now the primary surface.
    expect(response.sentinelBriefing).toBeTruthy();
    expect(response.sentinelBriefing?.primaryVoice.agentName).toBe('sentinel');
    expect(response.sentinelBriefing?.specialistContributions.length).toBeGreaterThan(0);
    // Specialist contributions retain flavor attribution for trace drawer.
    const flavors = response.sentinelBriefing?.specialistContributions.map((c) => c.specialistFlavor);
    expect(flavors).toContain('nexus');
    expect(flavors).toContain('atlas');
    expect(flavors).toContain('steward');
    // Back-compat adapter preserves per-agent shapes for downstream consumers still migrating.
    expect(response.multiAgentBriefing).toBeTruthy();
    expect(response.multiAgentBriefing?.nexus.agentName).toBe('nexus');
    expect(response.multiAgentBriefing?.sentinel.agentName).toBe('sentinel');
    expect(response.multiAgentBriefing?.atlas.agentName).toBe('atlas');
    expect(response.multiAgentBriefing?.steward.agentName).toBe('steward');
    // nexusSummary reads from primaryVoice (Sentinel-orchestrated).
    expect(response.nexusSummary?.primaryFinding).toBeTruthy();
    // summary is the combined sentinel briefing summary.
    expect(response.summary).toBe(response.sentinelBriefing?.combinedSummary);
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

  it('turns a concise IT sourcing intake prompt into minimum event facts', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
      prompt: 'Technology application managed services outsourcing',
      tenant,
      user,
    });

    expect(response.ok).toBe(true);
    expect(response.noModel).toBe(true);
    expect(response.intakeGuidance).toMatchObject({
      detectedIntent: 'it_sourcing_event_intake',
      eventType: 'Technology application managed services outsourcing',
    });
    expect(response.intakeGuidance?.facts.map((fact) => fact.id)).toEqual([
      'why-now',
      'scope-boundary',
      'value-target',
      'baseline-owner',
      'approval-owner',
    ]);
    expect(response.summary).toContain('event-specific gaps');
    expect(response.summary).toContain('Why now');
    expect(response.summary).toContain('Scope boundary');
    expect(response.summary).toContain('Value/savings target');
    expect(response.summary).toContain('Required baseline/data owner');
    expect(response.summary).toContain('Approval owner');
    expect(response.summary).not.toMatch(/\b(chatbot|ask me|happy to help|as an ai|company|leadership|executive sponsor|embedding_status|vector embeddings are live|parse-failed|\[\[artifact:)/i);
    expect(response.summary.length).toBeLessThan(700);
    expect(response.nexusSummary?.recommendedNextAction).toBe(
      'Open Intake once the baseline/data owner and approval owner are named.',
    );
  });

  it('keeps richer command-read prompts on the existing briefing path', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
      prompt: 'Give me the Source command read.',
      tenant,
      user,
    });

    expect(response.intakeGuidance).toBeUndefined();
    // Summary is now the Sentinel-orchestrated combinedSummary, not the old multi-agent version string.
    expect(response.summary).toBeTruthy();
    expect(response.summary).toBe(response.sentinelBriefing?.combinedSummary);
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

  it('does not import model providers, upload parsing, or program runtime', () => {
    const helperSource = readFileSync(resolve(process.cwd(), 'src/lib/source/nexus-api.ts'), 'utf8');
    const routeSource = readFileSync(
      resolve(process.cwd(), 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts'),
      'utf8',
    );
    const combined = `${helperSource}\n${routeSource}`;

    // The deterministic stub MUST NOT call any model.
    expect(combined).not.toMatch(/from ['"][^'"]*(openai|anthropic|@anthropic-ai\/sdk|ai\/react|ai)['"]/i);
    // The runtime helper MUST stay free of persistence so it can be
    // exercised by tests with no Supabase deps. The ROUTE handler is
    // allowed to do bounded persistence (e.g. AgentDock canvas migration
    // links agent_attachment.linked_event_id before invoking the runtime
    // — server-side, tenant-scoped via getServerSupabase).
    expect(helperSource).not.toMatch(/from ['"][^'"]*(supabase|threadRepository|turnRepository|upload|parse|programs\/mock|ProgramSurface)[^'"]*['"]/i);
    expect(combined).not.toMatch(/from ['"][^'"]*(threadRepository|turnRepository|upload|parse|programs\/mock|ProgramSurface)[^'"]*['"]/i);
    expect(combined).not.toContain('runPipeline');
    expect(combined).not.toContain('createThread');
    expect(combined).not.toContain('appendTurn');
  });
});
