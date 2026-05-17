// Tower · Regulatory-scoped risk lens · Wave C1 · tests.
//
// Exercises risk-kind classification, the regulatory subset extraction,
// privileged disclosure scoping, and summary reconciliation.

import {
  buildRegulatoryRiskLensView,
  classifyRiskLine,
  regulatoryRegimeLabel,
  summarizeRegulatoryRisk,
  type TowerRiskLineInput,
} from '../index';

function line(overrides: Partial<TowerRiskLineInput> = {}): TowerRiskLineInput {
  return {
    id: 'R-1',
    subjectRef: 'MOVE-1',
    title: 'A risk',
    detail: 'Some detail.',
    severity: 'moderate',
    ...overrides,
  };
}

describe('classifyRiskLine', () => {
  it('classifies a line with a regulatory regime as regulatory', () => {
    const c = classifyRiskLine(
      line({
        title: 'SR 11-7 model validation gate unresolved',
        regime: 'sr_11_7_model_risk',
        severity: 'critical',
      }),
    );
    expect(c.kind).toBe('regulatory');
    expect(c.isRegulatory).toBe(true);
    expect(c.regime).toBe('sr_11_7_model_risk');
    expect(c.executiveReadout).toMatch(/regulatory control gap/);
    expect(c.executiveReadout).toMatch(/not a delivery slip/);
  });

  it('a regime overrides a conflicting caller-supplied kind', () => {
    const c = classifyRiskLine(
      line({ kind: 'delivery', regime: 'consent_order' }),
    );
    expect(c.kind).toBe('regulatory');
  });

  it('keeps a non-regulatory line on its supplied kind', () => {
    const c = classifyRiskLine(line({ kind: 'delivery' }));
    expect(c.kind).toBe('delivery');
    expect(c.isRegulatory).toBe(false);
    expect(c.regime).toBeNull();
  });

  it('defaults a line with neither kind nor regime to delivery', () => {
    expect(classifyRiskLine(line()).kind).toBe('delivery');
  });

  it('carries legal-privileged disclosure scoping onto the risk line', () => {
    const c = classifyRiskLine(
      line({
        regime: 'consent_order',
        disclosure: 'privileged_and_confidential',
      }),
    );
    expect(c.privileged).toBe(true);
    expect(c.executiveReadout).toMatch(/legal-privileged/);
  });

  it('a non-privileged disclosure does not flag the line', () => {
    expect(classifyRiskLine(line({ disclosure: 'none' })).privileged).toBe(false);
  });
});

describe('buildRegulatoryRiskLensView', () => {
  it('extracts the regulatory subset, severity-sorted, and reconciles', () => {
    const view = buildRegulatoryRiskLensView({
      portfolioRef: 'firstcapital',
      riskLines: [
        line({ id: 'R-delivery', kind: 'delivery', severity: 'high' }),
        line({
          id: 'R-reg-high',
          regime: 'sr_11_7_model_risk',
          severity: 'high',
        }),
        line({
          id: 'R-reg-critical',
          regime: 'bsa_aml',
          severity: 'critical',
          disclosure: 'attorney_client',
        }),
        line({ id: 'R-commercial', kind: 'commercial', severity: 'low' }),
      ],
    });

    expect(view.allLines).toHaveLength(4);
    expect(view.regulatoryLines).toHaveLength(2);
    // Most severe first.
    expect(view.regulatoryLines[0].id).toBe('R-reg-critical');
    expect(view.regulatoryLines[1].id).toBe('R-reg-high');

    const s = view.summary;
    expect(s.totalRiskLines).toBe(4);
    expect(s.regulatoryLineCount).toBe(2);
    expect(s.elevatedRegulatoryCount).toBe(2);
    expect(s.privilegedRegulatoryCount).toBe(1);
    expect(s.byRegime).toEqual({ sr_11_7_model_risk: 1, bsa_aml: 1 });

    // Reconciliation: severity buckets sum to the regulatory count.
    const severitySum = Object.values(s.bySeverity).reduce((a, b) => a + b, 0);
    expect(severitySum).toBe(s.regulatoryLineCount);
  });

  it('summarizeRegulatoryRisk over an all-non-regulatory set is zero', () => {
    const lines = [
      classifyRiskLine(line({ id: 'A', kind: 'delivery' })),
      classifyRiskLine(line({ id: 'B', kind: 'operational' })),
    ];
    const s = summarizeRegulatoryRisk(lines);
    expect(s.regulatoryLineCount).toBe(0);
    expect(s.elevatedRegulatoryCount).toBe(0);
    expect(s.byRegime).toEqual({});
  });
});

describe('regulatoryRegimeLabel', () => {
  it('labels every regime', () => {
    expect(regulatoryRegimeLabel('sr_11_7_model_risk')).toMatch(/SR 11-7/);
    expect(regulatoryRegimeLabel('bsa_aml')).toBe('BSA/AML');
  });
});
