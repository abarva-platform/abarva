import {
  findMissingUpstreamCodes,
  getPromptTemplate,
  listSupportedGenerationCodes,
} from '@/lib/source/agent-generation';
import type { SourceGenerationContext } from '@/lib/source/agent-generation';

describe('Source agent generation prompt registry', () => {
  it('supports the P0 Value Target Brief as a generated artifact', () => {
    const template = getPromptTemplate('d02_value_target');

    expect(template?.artifactCode).toBe('d02_value_target');
    expect(template?.maxTokens).toBeGreaterThanOrEqual(48_000);
    expect(template?.upstreamRequired).toEqual([]);
    expect(template?.upstreamOptional).toContain('d01_strategy_memo');
    expect(listSupportedGenerationCodes()).toContain('d02_value_target');
  });

  it('does not advertise legacy prompt aliases as generation targets', () => {
    expect(listSupportedGenerationCodes()).not.toContain(
      'd02_value_target_legacy',
    );
    expect(listSupportedGenerationCodes()).not.toContain(
      'd03_archetype_decision_legacy',
    );
  });

  it('binds next-stage guidebook context into generated artifact prompts', () => {
    const template = getPromptTemplate('d02_value_target');
    expect(template).not.toBeNull();

    const ctx: SourceGenerationContext = {
      tenantKey: 'demo',
      tenantName: 'Demo Tenant',
      event: {
        id: 'evt-1',
        code: 'SRC-DEMO-001',
        name: 'Demo Sourcing Event',
        archetype: 'AMS',
        rigor: 'standard',
        currentStageKey: 'strategy',
        statusLabel: 'Active',
        owner: 'CIO',
        triggerDescription: 'Renewal and service pressure.',
        scopeDescription: 'Scope boundary: Finance and HR support.',
        estimatedValueUsd: 1_200_000,
      },
      artifactStates: [],
      gateCriteria: [],
      evidence: [],
      currentStageGuidebook: {
        id: 'guidebook-strategy',
        stageKey: 'strategy',
        clientKey: null,
        title: 'Strategy approval workshop',
        purpose: 'Confirm why this sourcing event should proceed.',
        durationMinutes: 30,
        status: 'published',
        sections: [
          {
            type: 'agenda',
            title: 'Sponsor decision agenda',
            body: 'Confirm why now, decision owner, scope anchor, and value thesis.',
            timeBoxMinutes: 30,
          },
        ],
        version: 1,
        createdBy: null,
        updatedBy: null,
        publishedAt: '2026-08-10T00:00:00.000Z',
        createdAt: '2026-08-10T00:00:00.000Z',
        updatedAt: '2026-08-10T00:00:00.000Z',
      },
      nextStageGuidebook: {
        id: 'guidebook-scope',
        stageKey: 'scope',
        clientKey: null,
        title: 'Scope evidence collection workshop',
        purpose:
          'Collect volumetrics, SLA history, application inventory, and contract terms before Scope approval.',
        durationMinutes: 45,
        status: 'published',
        sections: [
          {
            type: 'worksheet',
            title: 'Template collection plan',
            body: 'Point owners to the volumetrics, SLA baseline, application inventory, and commercial terms templates.',
            timeBoxMinutes: null,
          },
        ],
        version: 1,
        createdBy: null,
        updatedBy: null,
        publishedAt: '2026-08-10T00:00:00.000Z',
        createdAt: '2026-08-10T00:00:00.000Z',
        updatedAt: '2026-08-10T00:00:00.000Z',
      },
    };

    const message = template!.buildUserMessage(ctx, {});

    expect(message).toContain('Next-stage evidence-collection guidebook');
    expect(message).toContain('Scope evidence collection workshop');
    expect(message).toContain('volumetrics, SLA history');
    expect(message).toContain('template');
  });

  it('does not block d02 generation when the strategy memo is not authored yet', () => {
    const template = getPromptTemplate('d02_value_target');
    expect(template).not.toBeNull();

    const ctx: SourceGenerationContext = {
      tenantKey: 'demo',
      tenantName: 'Demo Tenant',
      event: {
        id: 'evt-1',
        code: 'SRC-DEMO-001',
        name: 'Demo Sourcing Event',
        archetype: 'AMS',
        rigor: 'standard',
        currentStageKey: 'strategy',
        statusLabel: 'Active',
        owner: 'CIO',
        triggerDescription: 'Renewal and service pressure.',
        scopeDescription: 'Scope boundary: Finance and HR support.',
        estimatedValueUsd: 1_200_000,
      },
      artifactStates: [],
      gateCriteria: [],
      evidence: [],
    };

    expect(findMissingUpstreamCodes(template!, ctx)).toEqual([]);
  });
});
