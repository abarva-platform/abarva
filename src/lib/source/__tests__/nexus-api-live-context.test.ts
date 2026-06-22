import { createSourceNexusApiStubResponse } from '../nexus-api';
import { sourceEventRowToDetail, type SourceEventRow } from '../queries';
import type { SourceLiveTenantContextSnapshot } from '../agent-context';

const liveEventRow: SourceEventRow = {
  id: 'apx-src-cdp-2026',
  client_key: 'apexretail',
  event_code: 'APX-SRC-CDP-2026',
  event_name: 'CDP Vendor Selection',
  event_type: 'platform_selection',
  current_stage_key: 'evaluation',
  lifecycle_state: 'active',
  linked_program_id: 'APX-CDP-2026',
  estimated_value_usd: 2_400_000,
  trigger_description: 'Unify customer data activation before loyalty and media budget planning.',
  scope_description: 'CDP vendor selection, implementation partner fit, integration scope, and value case.',
  decision_owner: 'Chief Digital Officer',
  created_by_user_id: 'user-apex-source',
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-09T00:00:00.000Z',
};

const liveTenantContext: SourceLiveTenantContextSnapshot = {
  clientKey: 'apexretail',
  brokerTenantKey: 'apex-retail',
  inventoryRecordCount: 403,
  contextChunkCount: 935,
  embeddedContextChunkCount: 935,
  sourceEventFound: true,
  segments: [
    { segmentId: 'org_structure', inventoryRecords: 36, contextChunks: 36, embeddedChunks: 36 },
    { segmentId: 'it_financials', inventoryRecords: 71, contextChunks: 71, embeddedChunks: 71 },
    { segmentId: 'it_landscape', inventoryRecords: 96, contextChunks: 96, embeddedChunks: 96 },
    { segmentId: 'vendor_contracts', inventoryRecords: 38, contextChunks: 38, embeddedChunks: 38 },
  ],
  currentStateAreas: ['Org Structure', 'IT Financials', 'IT Landscape', 'Vendor Contracts'],
  evidenceBasis: [
    'It Landscape: 96 records, 96 chunks, 96 embedded',
    'It Financials: 71 records, 71 chunks, 71 embedded',
    'Vendor Contracts: 38 records, 38 chunks, 38 embedded',
    'Org Structure: 36 records, 36 chunks, 36 embedded',
  ],
  retrievedEvidence: [
    {
      id: 'chunk:it_landscape:cdp',
      segmentId: 'it_landscape',
      recordId: 'it_landscape:cdp',
      title: 'CDP integration baseline',
      sourceType: 'contextChunk',
      sourceDoc: 'CDP-Round-1-Selection-Memo-2026-04-15.pdf',
      excerpt: 'claim: Deloitte Digital was selected as CDP implementation partner; Treasure Data and Segment advanced to BAFO.',
      confidence: 'high',
      score: 12,
    },
    {
      id: 'chunk:evidence_ledger:identity',
      segmentId: 'evidence_ledger',
      recordId: 'evidence_ledger:identity',
      title: 'Identity match baseline',
      sourceType: 'contextChunk',
      sourceDoc: 'data-quality-baseline-2026-q1.xlsx',
      excerpt: 'claim: Identity match rate across customer source systems is currently 71%.',
      confidence: 'high',
      score: 11,
    },
  ],
  warnings: [],
};

describe('Source Nexus API live context', () => {
  it('answers persisted Apex source events with live current-state intelligence instead of seed-only event lookup', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: 'APX-SRC-CDP-2026',
      prompt: 'What is the current state and how should the CXO shape this sourcing event?',
      tenant: {
        tenantId: 'apex-retail',
        tenantKey: 'apexretail',
        tenantName: 'Apex Retail Group',
        activeClientId: 'apexretail',
        activeClientName: 'Apex Retail Group',
      },
      user: { id: 'user-apex-source' },
      userRole: 'cio',
      liveEventDetail: sourceEventRowToDetail(liveEventRow, 'Apex Retail Group'),
      liveTenantContext,
    });

    expect(response.ok).toBe(true);
    expect(response.httpStatus).toBe(200);
    expect(response.error).toBeUndefined();
    expect(response.context.eventName).toBe('CDP Vendor Selection');
    expect(response.sourceIntelligence).toEqual({
      liveContextAvailable: true,
      sourceEventFound: true,
      inventoryRecordCount: 403,
      contextChunkCount: 935,
      embeddedContextChunkCount: 935,
      currentStateAreas: ['Org Structure', 'IT Financials', 'IT Landscape', 'Vendor Contracts'],
      evidenceBasis: liveTenantContext.evidenceBasis,
      warnings: [],
    });
    expect(response.sourceAnswer).toMatchObject({
      engineVersion: 'source-answer-engine/v1',
      mode: 'cxo_guidance',
      confidence: 'medium',
      recommendedNextAction: 'Lock CDP scoring around identity, activation, integration ownership, governance, and full TCO before BAFO.',
    });
    expect(response.sourceAnswer?.answerText).toContain('CXO guidance');
    expect(response.answerQuality).toMatchObject({
      renderable: true,
      evidenceLedgerCheck: { passed: true },
      readiness: { readinessVerdict: 'sufficient' },
    });
    expect(response.answerQuality?.evidenceLedger.dataUsed.length).toBeGreaterThanOrEqual(2);
    expect(response.sourceAnswer?.evidenceCitations.map((citation) => citation.sourceDoc)).toEqual(
      expect.arrayContaining([
        'CDP-Round-1-Selection-Memo-2026-04-15.pdf',
        'data-quality-baseline-2026-q1.xlsx',
      ]),
    );
    expect(response.agentResponseParts.some((part) => part.type === 'table')).toBe(true);
    expect(response.agentResponseParts.some((part) => part.type === 'barChart')).toBe(true);
    expect(response.summary).toBe(response.sourceAnswer?.answerText);
    expect(response.sentinelBriefing?.primaryVoice.contextUsed[0]?.deterministicFieldsUsed).toEqual(
      expect.arrayContaining(['sourcingEvent', 'workflowStage', 'liveTenantContext']),
    );
    expect(response.sentinelBriefing?.primaryVoice.evidenceNotes).toEqual(
      expect.arrayContaining([
        'Live Apex context: 403 inventory records, 935 context chunks, 935 embedded chunks.',
      ]),
    );
  });

  it('answers RFI or BAFO pressure from persisted event intake without a generic unavailable-context response', () => {
    const response = createSourceNexusApiStubResponse({
      eventId: 'APX-INTEGRATION-FABRIC-2026',
      prompt: 'Should I issue an RFI or invite Adobe, Salesforce, and Accenture to BAFO now given renewal pressure?',
      tenant: {
        tenantId: 'apex-retail',
        tenantKey: 'apexretail',
        tenantName: 'Apex Retail Group',
        activeClientId: 'apexretail',
        activeClientName: 'Apex Retail Group',
      },
      user: { id: 'user-apex-cio' },
      userRole: 'cio',
      liveEventDetail: sourceEventRowToDetail({
        ...liveEventRow,
        id: 'apx-integration-fabric-2026',
        event_code: 'APX-INTEGRATION-FABRIC-2026',
        event_name: 'Apex Retail Integration Fabric Commercial Control Event',
        event_type: 'other',
        estimated_value_usd: null,
        trigger_description: 'Renewal pressure across Adobe, Salesforce, Accenture and integration platforms risks locking Apex into the wrong topology.',
        scope_description: 'Scope boundary: customer-data integration contracts and hub-decision architecture. Value basis: no base-case savings until commercial baseline is confirmed. Baseline owner: Nathan Kohl.',
        decision_owner: 'Carlos Rivera; Linda Mwangi owns buyer architecture boundary; Nathan Kohl owns commercial baseline.',
      }, 'Apex Retail Group'),
      liveTenantContext: {
        ...liveTenantContext,
        retrievedEvidence: [
          {
            id: 'source-event:trigger',
            segmentId: 'sourcing_artifacts',
            recordId: 'trigger',
            title: 'Source intake trigger',
            sourceType: 'contextChunk',
            sourceDoc: 'source_events',
            excerpt: 'Trigger: Renewal pressure across Adobe, Salesforce, Accenture and integration platforms risks locking Apex into the wrong topology.',
            confidence: 'high',
            score: 20,
          },
          {
            id: 'source-event:scope',
            segmentId: 'sourcing_artifacts',
            recordId: 'scope',
            title: 'Source intake scope',
            sourceType: 'contextChunk',
            sourceDoc: 'source_events',
            excerpt: 'Scope boundary: customer-data integration contracts and hub-decision architecture. Value basis: no base-case savings until commercial baseline is confirmed. Baseline owner: Nathan Kohl.',
            confidence: 'high',
            score: 19,
          },
        ],
        evidenceBasis: ['Persisted Source intake: trigger, scope, value basis, decision owner and gate criteria from source_events.'],
        warnings: [],
      },
    });

    expect(response.ok).toBe(true);
    expect(response.sourceAnswer?.answerText).toMatch(/do not issue an RFI/i);
    expect(response.sourceAnswer?.answerText).toMatch(/buyer architecture and commercial baseline first/i);
    expect(response.sourceAnswer?.answerText).toMatch(/Nathan Kohl|commercial baseline|hub-decision architecture/i);
    expect(response.sourceAnswer?.answerText).not.toMatch(/current-state inventory records are unavailable/i);
    expect(response.sourceAnswer?.answerText).not.toMatch(/^Workflow gates contain blockers/m);
    expect(response.answerQuality?.renderable).toBe(true);
  });
});
