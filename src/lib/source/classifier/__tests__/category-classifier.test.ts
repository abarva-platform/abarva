import {
  classifySourcingEvent,
  type SourcingEventAttributes,
  type TenantContextSignals,
} from '../category-classifier';
import {
  SOURCE_CATEGORY_IDS,
  type SourceCategoryId,
  type TenantContextSegment,
} from '../../taxonomy/category-taxonomy';

const ALL_SEGMENTS: readonly TenantContextSegment[] = [
  'vendor_contracts',
  'it_landscape',
  'it_financials',
  'program_inventory',
  'operating_telemetry',
  'industry_context',
  'compliance',
];

/** All segments loaded — no evidence gaps for any category. */
const FULLY_LOADED: TenantContextSignals = { loadedSegments: ALL_SEGMENTS };
/** Nothing loaded — every required input is a gap. */
const NOTHING_LOADED: TenantContextSignals = { loadedSegments: [] };

function event(name: string, extra?: Partial<SourcingEventAttributes>): SourcingEventAttributes {
  return { name, ...extra };
}

describe('classifySourcingEvent — category coverage (all 9)', () => {
  const cases: Array<{ label: string; attrs: SourcingEventAttributes; expected: SourceCategoryId }> = [
    {
      label: 'AMS',
      attrs: event('AMS RFP — application support for the SAP estate, L2/L3 support'),
      expected: 'ams',
    },
    {
      label: 'data / AI platform',
      attrs: event('Customer Data Platform selection — CDP for activation'),
      expected: 'data_ai_platform',
    },
    {
      label: 'AI engineering partner',
      attrs: event('Select an AI engineering partner to build the contact-centre agent'),
      expected: 'ai_engineering_partner',
    },
    {
      label: 'SaaS renewal',
      attrs: event('Salesforce subscription renewal and license rationalization'),
      expected: 'saas_renewal',
    },
    {
      label: 'cloud / FinOps',
      attrs: event('AWS cloud commit renegotiation — FinOps rightsizing'),
      expected: 'cloud_finops',
    },
    {
      label: 'BPO / contact centre',
      attrs: event('Contact center outsourcing — BPO for tier-1 customer service'),
      expected: 'bpo_contact_centre',
    },
    {
      label: 'BPO / shared services',
      attrs: event(
        'Finance & accounting shared services BPO — payroll and accounts payable, procure-to-pay (P2P) and record-to-report',
      ),
      expected: 'bpo_shared_services',
    },
    {
      label: 'cyber / GRC',
      attrs: event('SIEM and security operations sourcing — MSSP evaluation'),
      expected: 'cyber_grc',
    },
    {
      label: 'staff aug vs managed service',
      attrs: event('Staff augmentation vs managed service — contingent labour decision'),
      expected: 'staff_aug_vs_managed_service',
    },
  ];

  for (const { label, attrs, expected } of cases) {
    it(`classifies "${label}" to ${expected}`, () => {
      const result = classifySourcingEvent(attrs, FULLY_LOADED);
      expect(result.categoryId).toBe(expected);
      expect(result.category.id).toBe(expected);
      expect(result.matchReasons.length).toBeGreaterThan(0);
      expect(result.classifierVersion).toBe('source-category-classifier/v1');
    });
  }

  it('covers every taxonomy category id in the test matrix', () => {
    const covered = new Set(cases.map((c) => c.expected));
    expect([...covered].sort()).toEqual([...SOURCE_CATEGORY_IDS].sort());
  });
});

describe('classifySourcingEvent — buying motion', () => {
  it('defaults a partner build to partner_selection', () => {
    const r = classifySourcingEvent(
      event('AI engineering partner for an agentic build'),
      FULLY_LOADED,
    );
    expect(r.buyingMotion).toBe('partner_selection');
  });

  it('forces renewal_renegotiation when the event text says renewal', () => {
    const r = classifySourcingEvent(
      event('Datadog renewal — observability platform'),
      FULLY_LOADED,
    );
    expect(r.buyingMotion).toBe('renewal_renegotiation');
  });

  it('forces demand_triage when the event asks whether to source at all', () => {
    const r = classifySourcingEvent(
      event('Should we source an AMS contract or insource the estate?'),
      FULLY_LOADED,
    );
    expect(r.buyingMotion).toBe('demand_triage');
    expect(r.matchReasons.join(' ')).toMatch(/demand_triage/);
  });

  it('defaults cloud/FinOps to framework_commitment', () => {
    const r = classifySourcingEvent(
      event('FinOps cloud savings plan analysis'),
      FULLY_LOADED,
    );
    expect(r.buyingMotion).toBe('framework_commitment');
  });
});

describe('classifySourcingEvent — evidence gap detection', () => {
  it('reports zero gaps when all required segments are loaded', () => {
    const r = classifySourcingEvent(event('AMS RFP for application support'), FULLY_LOADED);
    expect(r.evidenceGaps).toHaveLength(0);
  });

  it('reports every required segment as a gap when nothing is loaded', () => {
    const r = classifySourcingEvent(event('AMS RFP for application support'), NOTHING_LOADED);
    // AMS has 3 required evidence inputs.
    const requiredCount = r.category.evidenceInputs.filter((i) => i.required).length;
    expect(r.evidenceGaps).toHaveLength(requiredCount);
    expect(requiredCount).toBeGreaterThan(0);
    for (const gap of r.evidenceGaps) {
      expect(gap.whatItProves.length).toBeGreaterThan(0);
    }
  });

  it('reports only the missing required segment when others are loaded', () => {
    // AMS requires it_landscape, it_financials, vendor_contracts.
    const partial: TenantContextSignals = {
      loadedSegments: ['it_landscape', 'vendor_contracts'],
    };
    const r = classifySourcingEvent(event('AMS RFP for application support'), partial);
    expect(r.evidenceGaps.map((g) => g.segment)).toEqual(['it_financials']);
  });

  it('never reports an optional segment as a gap', () => {
    const r = classifySourcingEvent(event('AMS RFP for application support'), NOTHING_LOADED);
    const optionalSegments = r.category.evidenceInputs
      .filter((i) => !i.required)
      .map((i) => i.segment);
    for (const gap of r.evidenceGaps) {
      expect(optionalSegments).not.toContain(gap.segment);
    }
  });
});

describe('classifySourcingEvent — risk profile', () => {
  it('flags high risk when a high-baseline category has unmet evidence', () => {
    const r = classifySourcingEvent(event('AMS RFP for application support'), NOTHING_LOADED);
    expect(r.riskProfile.severity).toBe('high');
    expect(r.riskProfile.dominantTraps.length).toBeGreaterThan(0);
    expect(r.riskProfile.rationale.length).toBeGreaterThan(0);
  });

  it('flags low risk when evidence is complete for a non-high-baseline category', () => {
    // cyber/GRC is not a high-baseline-risk category; with all evidence
    // loaded and a strong keyword match the risk is low.
    const r = classifySourcingEvent(
      event('SIEM and security operations sourcing — MSSP cyber evaluation'),
      FULLY_LOADED,
    );
    expect(r.categoryId).toBe('cyber_grc');
    expect(r.riskProfile.severity).toBe('low');
  });

  it('keeps a high-baseline category (AMS) at least medium even with full evidence', () => {
    const r = classifySourcingEvent(
      event('AMS RFP — application support, managed service, L2/L3 support'),
      FULLY_LOADED,
    );
    expect(r.riskProfile.severity).toBe('medium');
  });

  it('treats demand triage as a low-risk motion even with gaps', () => {
    const r = classifySourcingEvent(
      event('Should we source a CDP, or do we already own coverage?'),
      NOTHING_LOADED,
    );
    expect(r.buyingMotion).toBe('demand_triage');
    expect(r.riskProfile.severity).not.toBe('high');
  });

  it('surfaces taxonomy anti-patterns verbatim as dominant traps', () => {
    const r = classifySourcingEvent(event('AMS RFP for application support'), NOTHING_LOADED);
    const trapIds = r.riskProfile.dominantTraps.map((t) => t.id);
    expect(trapIds.every((id) => r.category.antiPatterns.some((ap) => ap.id === id))).toBe(true);
  });
});

describe('classifySourcingEvent — confidence and pattern binding', () => {
  it('returns high confidence when a lifecycle pattern is bound', () => {
    const r = classifySourcingEvent(
      event('Generic sourcing event', { patternId: 'PAT-SRC-AMS-001' }),
      FULLY_LOADED,
    );
    expect(r.categoryId).toBe('ams');
    expect(r.confidence).toBe('high');
  });

  it('a bound pattern overrides weak keyword signal', () => {
    // Name leans renewal, but the bound pattern is a FinOps category pattern.
    const r = classifySourcingEvent(
      event('cloud cost review', { patternId: 'PAT-SRC-CAT-FINOPS-001' }),
      FULLY_LOADED,
    );
    expect(r.categoryId).toBe('cloud_finops');
  });

  it('returns low confidence and defaults to AMS when no signal matches', () => {
    const r = classifySourcingEvent(event('Project Bluebird phase two'), FULLY_LOADED);
    expect(r.categoryId).toBe('ams');
    expect(r.confidence).toBe('low');
    expect(r.matchReasons.join(' ')).toMatch(/defaulted to AMS/i);
  });

  it('classifies a realistically-phrased AMS event at HIGH confidence (no bound pattern)', () => {
    // Regression for the keyword-table strengthening: an unmistakable AMS event
    // phrased the way a real RFP reads must score >=3 keyword hits → high, not
    // limp in at medium on a single keyword.
    const r = classifySourcingEvent(
      event(
        'Application Managed Services for Reservations & Airport Operations',
        {
          description:
            'Multi-tower application management and support (L1/L2/L3); seeking a ' +
            'managed-services partner with SLA-backed service levels and a service desk.',
        },
      ),
      FULLY_LOADED,
    );
    expect(r.categoryId).toBe('ams');
    expect(r.confidence).toBe('high');
    // matchReasons must be auditable and name multiple keywords, not one.
    expect(r.matchReasons.join(' ')).toMatch(/application management/);
    expect(r.matchReasons.join(' ')).toMatch(/managed-services partner/);
  });

  it('is a pure function — identical inputs yield identical output', () => {
    const attrs = event('Customer Data Platform selection — CDP');
    const a = classifySourcingEvent(attrs, FULLY_LOADED);
    const b = classifySourcingEvent(attrs, FULLY_LOADED);
    expect(a).toEqual(b);
  });
});

describe('classifySourcingEvent — expert mis-categorisation guard', () => {
  it('flags an AI engineering partner being run as an AMS RFP', () => {
    // The expert value case: the event is named like an AMS RFP but the
    // scope is really an AI engineering partner build.
    const r = classifySourcingEvent(
      event('RFP: select an AI engineering partner to build and run agentic copilots'),
      { loadedSegments: ['it_landscape'] },
    );
    expect(r.categoryId).toBe('ai_engineering_partner');
    expect(r.buyingMotion).toBe('partner_selection');
    // program_inventory + industry_context are required and unloaded.
    expect(r.evidenceGaps.map((g) => g.segment).sort()).toEqual([
      'industry_context',
      'program_inventory',
    ]);
  });
});
