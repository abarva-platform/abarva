import { buildTemplateSchemaPreflight } from '../schema-preflight';

describe('template schema preflight', () => {
  it('maps required and optional fields from uploaded headers', () => {
    const preflight = buildTemplateSchemaPreflight({
      templateId: 'application-portfolio',
      headers: ['app_id', 'name', 'criticality', 'owner_role', 'system_of_record', 'ams_vendor'],
    });

    expect(preflight.clarificationRequired).toBe(false);
    expect(preflight.mappedRequiredFields).toEqual([
      'app_id',
      'name',
      'criticality',
      'owner_role',
      'system_of_record',
    ]);
    expect(preflight.mappedOptionalFields).toEqual(['ams_vendor']);
    expect(preflight.missingRequiredFields).toEqual([]);
    expect(preflight.unknownColumns).toEqual([]);
  });

  it('creates clarification requests for missing required fields and unknown columns', () => {
    const preflight = buildTemplateSchemaPreflight({
      templateId: 'vendor-contracts',
      headers: ['vendor_id', 'vendor_name', 'renewal_date', 'mystery_clause'],
    });

    expect(preflight.clarificationRequired).toBe(true);
    expect(preflight.missingRequiredFields).toEqual(['annual_value_usd']);
    expect(preflight.unknownColumns).toEqual(['mystery_clause']);
    expect(preflight.clarificationRequests).toEqual([
      {
        action: 'supply_missing_required_field',
        field: 'annual_value_usd',
        message: 'Supply or map the required field annual_value_usd before this file can be committed.',
      },
      {
        action: 'map_unknown_column',
        field: 'mystery_clause',
        message: 'Map mystery_clause to a template field or mark it evidence-only before commit.',
        allowedTargets: [
          'vendor_id',
          'vendor_name',
          'annual_value_usd',
          'renewal_date',
          'exit_terms',
          'ai_clauses',
          'data_rights',
        ],
      },
    ]);
  });

  it('normalizes punctuation and case before comparing fields', () => {
    const preflight = buildTemplateSchemaPreflight({
      templateId: 'financial-kpi-workbook',
      headers: ['Period', 'Metric', 'Value', 'Currency Or Unit', 'Segment'],
    });

    expect(preflight.clarificationRequired).toBe(false);
    expect(preflight.missingRequiredFields).toEqual([]);
  });

  it('throws for unknown templates so callers do not silently pass files', () => {
    expect(() =>
      buildTemplateSchemaPreflight({
        templateId: 'not-real',
        headers: ['id'],
      }),
    ).toThrow('unknown_context_template:not-real');
  });
});
