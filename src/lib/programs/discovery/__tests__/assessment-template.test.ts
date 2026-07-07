import {
  emptyDiscoveryShape,
  captureField,
  planFromShape,
} from '../discovery-intake';
import { buildAssessmentTemplate } from '../assessment-template';

function planForDomains(domains: string[]) {
  const s = emptyDiscoveryShape();
  s.foundationIntent = captureField(s.foundationIntent, 'rides_existing', 'chat');
  s.engagementMode = captureField(s.engagementMode, 'point_use_case', 'chat');
  s.dataDomains = captureField(s.dataDomains, domains, 'chat');
  return planFromShape(s); // narrow (4-dimension) scope
}

describe('buildAssessmentTemplate', () => {
  it('produces one sheet per domain plus a maturity summary', () => {
    const plan = planForDomains(['Epic Clarity', 'Claims']);
    const tpl = buildAssessmentTemplate(plan, { moveLabel: 'Risk Stratification' });
    expect(tpl.title).toContain('Risk Stratification');
    // summary + 2 domain sheets
    expect(tpl.sheets.map((s) => s.name)).toEqual([
      'Maturity summary',
      'Epic Clarity',
      'Claims',
    ]);
  });

  it('uses the use-case-scoped dimension set as rows', () => {
    const plan = planForDomains(['Epic Clarity']);
    const tpl = buildAssessmentTemplate(plan, { moveLabel: 'X' });
    const domainSheet = tpl.sheets.find((s) => s.domain === 'Epic Clarity')!;
    // narrow scope = 4 dimensions
    expect(domainSheet.rows).toHaveLength(4);
    expect(domainSheet.columns.map((c) => c.key)).toContain('current');
    expect(domainSheet.columns.map((c) => c.key)).toContain('evidence');
    expect(domainSheet.rows.every((r) => 'dimension' in r)).toBe(true);
  });

  it('leaves filler cells blank (the client fills them)', () => {
    const plan = planForDomains(['Epic Clarity']);
    const tpl = buildAssessmentTemplate(plan, { moveLabel: 'X' });
    const row = tpl.sheets[1].rows[0];
    expect(row.volumetrics).toBe('');
    expect(row.owner).toBe('');
  });
});
