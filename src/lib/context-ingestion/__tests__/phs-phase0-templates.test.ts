import {
  buildPHSPhase0TemplatePreflight,
  getPHSPhase0Template,
  getRequiredPHSPhase0TemplateIds,
  PHS_PHASE0_TEMPLATE_DEFINITIONS,
} from '../phs-phase0-templates';

describe('PHS phase 0 loader templates', () => {
  it('defines one required template for every manifest object family', () => {
    expect(getRequiredPHSPhase0TemplateIds()).toEqual([
      'phs-evidence-register',
      'phs-uploaded-artifacts',
      'phs-workload-inventory',
      'phs-rate-card',
      'phs-gate-criteria',
      'phs-approval-records',
    ]);
    expect(PHS_PHASE0_TEMPLATE_DEFINITIONS.map((template) => template.objectType)).toEqual([
      'evidence_item',
      'uploaded_artifact',
      'workload_record',
      'rate_card_row',
      'gate_criterion',
      'approval_record',
    ]);
  });

  it('preflights a valid workload inventory header row', () => {
    const template = getPHSPhase0Template('phs-workload-inventory');
    expect(template?.ownerRole).toBe('CIO delegate');

    const result = buildPHSPhase0TemplatePreflight({
      templateId: 'phs-workload-inventory',
      headers: [
        'workload_id',
        'workload_name',
        'domain',
        'current_platform',
        'data_sources',
        'phi_level',
        'owner',
        'business_criticality',
        'modernization_disposition',
        'effort_size',
        'risk',
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.missingRequiredFields).toEqual([]);
    expect(result.unknownColumns).toEqual([]);
  });

  it('blocks missing citation keys in the evidence register template', () => {
    const result = buildPHSPhase0TemplatePreflight({
      templateId: 'phs-evidence-register',
      headers: [
        'title',
        'source_type',
        'owner',
        'evidence_date',
        'sensitivity',
        'confidence',
        'summary',
        'usable_by_surface',
        'random_column',
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.missingRequiredFields).toEqual(['citation_key']);
    expect(result.unknownColumns).toEqual(['random_column']);
  });
});
