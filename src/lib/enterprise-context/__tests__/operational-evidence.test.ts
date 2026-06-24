import {
  OPERATIONAL_CONTEXT_EVIDENCE_TYPES,
  OPERATIONAL_EVIDENCE_RECORD_TYPES,
  automationOpportunityToMoveEvidenceItem,
  contextEvidenceTypeForSource,
  moveEvidenceTypeForOperationalContext,
  shouldStoreRawOperationalPayload,
  type AutomationOpportunity,
} from '../operational-evidence';
import {
  ENTERPRISE_CONTEXT_RECORD_TYPES,
  ENTERPRISE_CONTEXT_SOURCE_SYSTEMS,
} from '../schema';

describe('operational evidence context contract', () => {
  it('extends enterprise context vocabulary without creating a Moves-only silo', () => {
    expect(ENTERPRISE_CONTEXT_RECORD_TYPES).toEqual(
      expect.arrayContaining(OPERATIONAL_EVIDENCE_RECORD_TYPES),
    );
    expect(ENTERPRISE_CONTEXT_SOURCE_SYSTEMS).toEqual(
      expect.arrayContaining(['servicenow', 'jira', 'splunk', 'datadog', 'azure_monitor', 'app_log', 'cmdb']),
    );
    expect(OPERATIONAL_CONTEXT_EVIDENCE_TYPES).toEqual(
      expect.arrayContaining([
        'ticket_evidence',
        'delivery_evidence',
        'observability_evidence',
        'process_evidence',
        'automation_opportunity_evidence',
        'control_evidence',
        'value_evidence',
        'ownership_evidence',
      ]),
    );
  });

  it('maps operational source types into reusable context evidence subtypes', () => {
    expect(contextEvidenceTypeForSource('servicenow')).toBe('ticket_evidence');
    expect(contextEvidenceTypeForSource('jira')).toBe('delivery_evidence');
    expect(contextEvidenceTypeForSource('observability')).toBe('observability_evidence');
    expect(contextEvidenceTypeForSource('cmdb')).toBe('process_evidence');
  });

  it('maps operational context evidence into existing Moves readiness categories', () => {
    expect(moveEvidenceTypeForOperationalContext('ticket_evidence')).toBe('current_state_systems_data');
    expect(moveEvidenceTypeForOperationalContext('automation_opportunity_evidence')).toBe('solution_options_decision');
    expect(moveEvidenceTypeForOperationalContext('control_evidence')).toBe('data_quality_governance');
    expect(moveEvidenceTypeForOperationalContext('value_evidence')).toBe('kpi_value_baseline');
  });

  it('turns automation opportunities into Move evidence items with traceability', () => {
    const opportunity: AutomationOpportunity = {
      id: 'opp-1',
      tenantId: 'tenant-1',
      opportunityName: 'Incident triage assistant',
      opportunityType: 'triage',
      sourcePatterns: ['recurring_incident_cluster'],
      affectedProcess: 'Incident management',
      affectedApplications: ['claims-api'],
      affectedTeams: ['L2 support'],
      currentPain: 'High-volume incidents require repeated manual classification.',
      proposedAiCapability: 'Summarize incident context and recommend route/priority.',
      humanRole: 'Approve priority and routing recommendation.',
      agentRole: 'Summarize, classify, and recommend.',
      automationLevel: 'recommend',
      valueScore: 8,
      feasibilityScore: 7,
      riskScore: 3,
      readinessScore: 6,
      priority: 'P1',
      requiredControls: ['human_approval', 'audit_log'],
      evidenceRefs: ['servicenow:INC001', 'cmdb:claims-api'],
      confidence: 0.82,
    };

    const item = automationOpportunityToMoveEvidenceItem(opportunity);

    expect(item.evidenceType).toBe('automation_opportunity_evidence');
    expect(item.slotIds).toEqual(
      expect.arrayContaining([
        'p3_operational_automation_opportunities',
        'p4_operational_opportunity_backlog',
        'p4_operational_value_estimate',
      ]),
    );
    expect(item.citation).toContain('servicenow:INC001');
    expect(item.structuredFields?.automation_level).toBe('recommend');
  });

  it('does not store raw operational payloads unless explicitly safe and approved', () => {
    expect(shouldStoreRawOperationalPayload({
      approvedForSensitiveText: true,
      containsSecretsOrCredentials: true,
      piiPhiFlag: false,
    })).toBe(false);
    expect(shouldStoreRawOperationalPayload({
      approvedForSensitiveText: false,
      containsSecretsOrCredentials: false,
      piiPhiFlag: true,
    })).toBe(false);
    expect(shouldStoreRawOperationalPayload({
      approvedForSensitiveText: true,
      containsSecretsOrCredentials: false,
      piiPhiFlag: false,
    })).toBe(true);
  });
});
