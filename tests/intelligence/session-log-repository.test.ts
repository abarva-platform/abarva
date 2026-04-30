import {
  modeRequiresTenant,
  toModeToggleInsert,
  toSessionLogInsert,
} from '../../src/lib/intelligence/db/sessionLogRepository';

describe('Intelligence surface session log data contract', () => {
  it('allows cold corpus-grounded turns without tenant identifiers', () => {
    const row = toSessionLogInsert({
      sessionId: 'sess_cold_1',
      queryText: 'How are enterprises handling AI governance?',
      responseMode: 'corpus_grounded',
      availableModes: ['generic', 'corpus_grounded'],
      retrievedPatternIds: ['PAT-AI-006'],
      retrievedContradictionIds: ['CON-005'],
      provenanceRendered: [
        {
          claimText: 'Governance committees fail when controls are not operationalized.',
          groundingChain: [
            {
              sourceType: 'pattern',
              sourceId: 'PAT-AI-006',
              sourceTitle: 'AI Governance Operating Model',
              confidence: 0.87,
              sourceBasis: 'source_code_seed',
              lastUpdated: '2026-04-30T00:00:00.000Z',
            },
          ],
        },
      ],
      tenantDataUsed: false,
      authState: 'cold',
      engagementState: 'conversation_active',
      latencyMs: 480,
      toolNames: ['search_corpus', 'compose_mode_comparison'],
    });

    expect(row).toMatchObject({
      client_id: null,
      user_id: null,
      response_mode: 'corpus_grounded',
      tenant_data_used: false,
      retrieved_pattern_ids: ['PAT-AI-006'],
      retrieved_contradiction_ids: ['CON-005'],
    });
  });

  it('requires tenant identifiers for tenant-grounded or cross-corpus modes', () => {
    expect(modeRequiresTenant('generic')).toBe(false);
    expect(modeRequiresTenant('corpus_grounded')).toBe(false);
    expect(modeRequiresTenant('tenant_grounded')).toBe(true);
    expect(modeRequiresTenant('cross_corpus')).toBe(true);

    expect(() =>
      toSessionLogInsert({
        sessionId: 'sess_tenant_missing',
        queryText: 'Which of our programs are at risk?',
        responseMode: 'tenant_grounded',
        authState: 'authenticated_with_programs',
        engagementState: 'conversation_active',
      }),
    ).toThrow('tenant-bound mode requires clientId and userId');
  });

  it('records tenant-bound rows when tenant identifiers are present', () => {
    const row = toSessionLogInsert({
      tenantKey: 'apex-retail',
      clientId: 'bb8ed961-a049-4d0c-a38f-f8912138fceb',
      userId: '170215ba-a263-4674-8ebd-e18b223c3a70',
      sessionId: 'sess_apex_1',
      queryText: 'Which of our programs are at risk of the pilot-to-production gap?',
      responseMode: 'cross_corpus',
      availableModes: ['generic', 'corpus_grounded', 'tenant_grounded', 'cross_corpus'],
      retrievedPatternIds: ['PAT-CDP-007'],
      retrievedEvidenceIds: ['program:apex-cdp-2026'],
      retrievedContradictionIds: ['CON-003'],
      retrievedSignalIds: ['signal_arch_review_gap'],
      provenanceRendered: [],
      tenantDataUsed: true,
      authState: 'authenticated_with_programs',
      engagementState: 'conversation_active',
      latencyMs: 2100,
      toolNames: ['reason_across_tenant'],
      metadata: { surfacedStage: 'J4' },
    });

    expect(row).toMatchObject({
      tenant_key: 'apex-retail',
      client_id: 'bb8ed961-a049-4d0c-a38f-f8912138fceb',
      user_id: '170215ba-a263-4674-8ebd-e18b223c3a70',
      response_mode: 'cross_corpus',
      tenant_data_used: true,
      metadata_jsonb: { surfacedStage: 'J4' },
    });
  });

  it('requires tenant identifiers for tenant-bound mode toggles', () => {
    expect(() =>
      toModeToggleInsert({
        sessionId: 'sess_toggle_missing',
        previousMode: 'corpus_grounded',
        nextMode: 'tenant_grounded',
      }),
    ).toThrow('tenant-bound mode requires clientId and userId');

    expect(
      toModeToggleInsert({
        sessionLogId: '11111111-1111-1111-1111-111111111111',
        sessionId: 'sess_toggle_ok',
        clientId: 'bb8ed961-a049-4d0c-a38f-f8912138fceb',
        userId: '170215ba-a263-4674-8ebd-e18b223c3a70',
        previousMode: 'corpus_grounded',
        nextMode: 'tenant_grounded',
        dwellMs: 12000,
      }),
    ).toMatchObject({
      session_log_id: '11111111-1111-1111-1111-111111111111',
      next_mode: 'tenant_grounded',
      dwell_ms: 12000,
    });
  });
});
