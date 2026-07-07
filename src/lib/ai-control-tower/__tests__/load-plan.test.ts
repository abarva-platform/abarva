import canonicalPackage from '../../../../docs/build/ai-control-tower-template/ai-control-tower-synthetic-canonical-v1.json';
import { buildAiControlTowerLoadPlan } from '../load-plan';

describe('AI Control Tower load plan', () => {
  it('maps the canonical template package into substrate rows and context rows', () => {
    const plan = buildAiControlTowerLoadPlan({
      clientId: '00000000-0000-0000-0000-000000000001',
      clientKey: 'firstcapital',
      package: canonicalPackage,
    });

    expect(plan.diagnostics.filter((diagnostic) => diagnostic.level === 'error')).toEqual([]);
    expect(plan.refreshRun).toMatchObject({
      refresh_run_key: 'RUN-2026-05-MONTHLY',
      run_type: 'template_upload',
      status: 'parsed',
      reporting_period_start: '2026-05-01',
      reporting_period_end: '2026-05-31',
    });
    expect(plan.rowCounts.ai_control_sources).toBe(10);
    expect(plan.rowCounts.ai_control_initiatives).toBe(7);
    expect(plan.rowCounts.ai_control_context_facts).toBe(108);
    expect(plan.sourceKeyById['SRC-M365-COPILOT-MAY']).toBe('SRC-M365-COPILOT-MAY');
  });

  it('derives actions from evidence instead of requiring an action sheet', () => {
    const plan = buildAiControlTowerLoadPlan({
      clientId: '00000000-0000-0000-0000-000000000001',
      package: canonicalPackage,
    });

    expect(plan.rowCounts.system_derived_actions).toBeGreaterThan(0);
    expect(plan.derivedActions.every((action) => action.payload.source === 'system_derived')).toBe(true);
    expect(plan.derivedActions.some((action) => action.payload.derivation_rule === 'risk_severity_or_governance_gate')).toBe(true);
    expect(plan.derivedActions.some((action) => action.payload.derivation_rule === 'benefit_not_realized_or_low_confidence')).toBe(true);
    expect(plan.derivedActions.some((action) => action.payload.derivation_rule === 'low_adoption_with_material_spend')).toBe(true);
    expect(plan.tableRows.ai_control_actions).toHaveLength(plan.derivedActions.length);
  });

  it('keeps missing required source data as a parse diagnostic, not a false load claim', () => {
    const plan = buildAiControlTowerLoadPlan({
      clientId: '00000000-0000-0000-0000-000000000001',
      package: {
        package_id: 'empty-package',
        sheets: {
          source_manifest: [],
        },
      },
    });

    expect(plan.diagnostics.some((diagnostic) => diagnostic.code === 'missing_required_sheet_rows')).toBe(true);
    expect(plan.refreshRun.status).toBe('received');
    expect(plan.rowCounts.system_derived_actions).toBe(0);
  });
});
