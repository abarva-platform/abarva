import {
  MINIMUM_OPERATIONAL_EVIDENCE_TEMPLATES,
  OPERATIONAL_EVIDENCE_TEMPLATE_LIBRARY,
  OPERATIONAL_SOURCE_SYSTEM_GUIDANCE,
  OPTIONAL_OPERATIONAL_EVIDENCE_TEMPLATES,
  generateSyntheticOperationalEvidencePack,
  operationalTemplateToJsonSchema,
} from '../operational-evidence-template-library';

describe('operational evidence template library', () => {
  it('defines the minimum viable operational evidence pack', () => {
    expect(MINIMUM_OPERATIONAL_EVIDENCE_TEMPLATES.map((template) => template.templateId)).toEqual([
      'operational_use_case_intake',
      'servicenow_ticket_extract',
      'jira_delivery_extract',
      'app_cmdb_inventory',
      'log_event_summary',
      'process_flow_observation',
      'ai_opportunity_backlog',
      'value_effort_estimate',
    ]);

    for (const template of MINIMUM_OPERATIONAL_EVIDENCE_TEMPLATES) {
      expect(template.requiredFields.length).toBeGreaterThan(5);
      expect(template.syntheticDataInstructions).toContain('Generate');
      expect(template.contextLayerEntityMappings.length).toBeGreaterThan(0);
      expect(template.movesArtifactConsumers.length).toBeGreaterThan(0);
      expect(template.qualityCompletenessScoringRules.length).toBeGreaterThan(0);
    }
  });

  it('keeps optional deep-dive templates non-blocking but mapped', () => {
    expect(OPTIONAL_OPERATIONAL_EVIDENCE_TEMPLATES.map((template) => template.templateId)).toEqual(
      expect.arrayContaining([
        'knowledge_article_gap',
        'change_release_risk',
        'security_privacy_constraint',
        'human_agent_responsibility_matrix',
        'governance_decision',
        'adoption_readiness',
        'data_quality_trust',
        'automation_control_guardrail',
        'benefits_realization',
        'operational_support_model',
        'integration_api_failure_pattern',
        'alert_noise_reduction',
      ]),
    );
    expect(OPTIONAL_OPERATIONAL_EVIDENCE_TEMPLATES.every((template) => template.pack === 'optional_deep_dive')).toBe(true);
    expect(OPERATIONAL_EVIDENCE_TEMPLATE_LIBRARY).toHaveLength(20);
  });

  it('contains source-system guidance for operational evidence requests', () => {
    expect(OPERATIONAL_SOURCE_SYSTEM_GUIDANCE.map((entry) => entry.sourceSystem)).toEqual(
      expect.arrayContaining([
        'ServiceNow / ITSM',
        'Jira / Delivery System',
        'Logs / Observability',
        'CMDB / App Inventory',
        'Knowledge Base',
      ]),
    );
    expect(OPERATIONAL_SOURCE_SYSTEM_GUIDANCE.find((entry) => entry.sourceSystem === 'Logs / Observability')?.safeCaptureGuidance).toContain(
      'raw payloads',
    );
  });

  it('generates JSON schema with required fields and AbarVa mappings', () => {
    const schema = operationalTemplateToJsonSchema('servicenow_ticket_extract');

    expect(schema).toMatchObject({
      title: 'ServiceNow Ticket Extract Template',
      type: 'object',
      'x-abarva-template-id': 'servicenow_ticket_extract',
    });
    expect(schema.required).toEqual(
      expect.arrayContaining(['ticket_id', 'ticket_type', 'short_description', 'assignment_group', 'sla_breached']),
    );
    expect(schema['x-abarva-context-layer-mappings']).toEqual(
      expect.arrayContaining(['work_item', 'process_flow_observation', 'operational_evidence_insight']),
    );
  });

  it('builds a synthetic demo pack with traceable opportunity explanations', () => {
    const pack = generateSyntheticOperationalEvidencePack({
      tenantId: 'morganstreet',
      useCaseName: 'Advisor Operations AI Opportunity Discovery',
      generatedAt: '2026-06-23T12:00:00.000Z',
    });

    expect(pack.sourceType).toBe('synthetic_demo');
    expect(pack.syntheticLabel).toContain('not client-approved production truth');
    expect(pack.templatesUsed).toHaveLength(8);

    const ticketIds = new Set(pack.records.serviceNowTickets.map((ticket) => String(ticket.ticket_id)));
    const eventIds = new Set(pack.records.logEventSummaries.map((event) => String(event.event_id)));
    const opportunityIds = new Set(pack.records.aiOpportunityBacklog.map((opportunity) => String(opportunity.opportunity_id)));

    expect(ticketIds.has('INC1048821')).toBe(true);
    expect(eventIds.has('EVT-2026-05-03-01')).toBe(true);
    expect(opportunityIds.has('AI-OPP-001')).toBe(true);

    const intakeAgent = pack.derivedOpportunityExplanations.find((opportunity) => opportunity.opportunityId === 'AI-OPP-001');
    expect(intakeAgent?.sourceEvidenceUsed).toEqual(expect.arrayContaining(['INC1048821', 'EVT-2026-05-03-01']));
    expect(intakeAgent?.requiredControls).toEqual(expect.arrayContaining(['Human approval for P1/P2', 'Audit log']));
    expect(intakeAgent?.estimatedValue).toContain('finance/client validation required');
  });

  it('throws for unknown template schema requests', () => {
    expect(() => operationalTemplateToJsonSchema('missing_template')).toThrow('Unknown operational evidence template');
  });
});
