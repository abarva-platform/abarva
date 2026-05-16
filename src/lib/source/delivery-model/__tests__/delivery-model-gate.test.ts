import {
  runDeliveryModelGate,
  type DeliveryModel,
  type DeliveryModelSignals,
} from '../delivery-model-gate';
import {
  classifySourcingEvent,
  type CategoryClassification,
  type SourcingEventAttributes,
  type TenantContextSignals,
} from '../../classifier/category-classifier';
import type { TenantContextSegment } from '../../taxonomy/category-taxonomy';

const ALL_SEGMENTS: readonly TenantContextSegment[] = [
  'vendor_contracts',
  'it_landscape',
  'it_financials',
  'program_inventory',
  'operating_telemetry',
  'industry_context',
  'compliance',
];

const FULLY_LOADED: TenantContextSignals = { loadedSegments: ALL_SEGMENTS };

function classify(
  name: string,
  extra?: Partial<SourcingEventAttributes>,
  signals: TenantContextSignals = FULLY_LOADED,
): CategoryClassification {
  return classifySourcingEvent({ name, ...extra }, signals);
}

// ---------------------------------------------------------------------------
// Tenant behavior examples (per the execution plan, Slice 1.2 acceptance)
// ---------------------------------------------------------------------------

describe('runDeliveryModelGate — tenant behavior examples', () => {
  it('Apex CDP — owned covering platform forces an overlap question, gate blocked', () => {
    const classification = classify('Customer Data Platform selection — CDP for activation');
    expect(classification.categoryId).toBe('data_ai_platform');

    const signals: DeliveryModelSignals = {
      ownsCoveringCapability: true, // Apex already runs overlapping data platforms.
      isCoreDifferentiator: false, // A CDP is bought, not a differentiator to build.
      internalCapability: 'partial',
      loadedSegments: ALL_SEGMENTS,
    };
    const gate = runDeliveryModelGate(classification, signals);

    expect(gate.recommendedModel).toBe('buy');
    expect(gate.gateStatus).toBe('blocked_open_questions');
    expect(gate.openQuestions.some((q) => /overlap|rationaliz/i.test(q.question))).toBe(true);
    // Build is disqualified — a CDP is undifferentiated commodity.
    expect(gate.disqualifiedModels.find((d) => d.model === 'build')).toBeDefined();
    expect(gate.gateVersion).toBe('source-delivery-model-gate/v1');
  });

  it('Meridian ambient — core differentiator + strong capability recommends build', () => {
    const classification = classify(
      'Select an AI engineering partner to build an ambient clinical documentation agent',
    );
    expect(classification.categoryId).toBe('ai_engineering_partner');

    const signals: DeliveryModelSignals = {
      isCoreDifferentiator: true, // Ambient clinical AI is a strategic differentiator.
      internalCapability: 'strong',
      workShape: 'one_off_delivery',
      loadedSegments: ALL_SEGMENTS,
    };
    const gate = runDeliveryModelGate(classification, signals);

    expect(gate.recommendedModel).toBe('build');
    expect(gate.reasoning.join(' ')).toMatch(/core differentiator/i);
    // SI was the category default; it must appear in the reasoning trail.
    expect(gate.disqualifiedModels.map((d) => d.model)).toContain('si');
  });

  it('Meridian ambient — without internal capability, build is disqualified', () => {
    const classification = classify(
      'Select an AI engineering partner to build an ambient clinical documentation agent',
    );
    const signals: DeliveryModelSignals = {
      isCoreDifferentiator: true,
      internalCapability: 'none', // No internal AI engineering bench.
      loadedSegments: ALL_SEGMENTS,
    };
    const gate = runDeliveryModelGate(classification, signals);

    expect(gate.recommendedModel).not.toBe('build');
    expect(gate.disqualifiedModels.find((d) => d.model === 'build')).toBeDefined();
  });

  it('First Capital model-risk — incumbent contract forces a renegotiation question', () => {
    const classification = classify(
      'Model-risk governance and compliance tooling sourcing — GRC platform evaluation',
    );
    expect(classification.categoryId).toBe('cyber_grc');

    const signals: DeliveryModelSignals = {
      hasIncumbentContract: true, // First Capital runs an incumbent GRC suite.
      isCoreDifferentiator: false,
      internalCapability: 'partial',
      loadedSegments: ALL_SEGMENTS,
    };
    const gate = runDeliveryModelGate(classification, signals);

    expect(gate.recommendedModel).toBe('buy');
    expect(gate.gateStatus).toBe('blocked_open_questions');
    expect(
      gate.openQuestions.some((q) => /incumbent|renegotiat/i.test(q.question)),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Category priors
// ---------------------------------------------------------------------------

describe('runDeliveryModelGate — category priors', () => {
  const expectations: Array<{ name: string; expected: DeliveryModel }> = [
    { name: 'AMS RFP — application support for the SAP estate', expected: 'partner' },
    { name: 'Customer Data Platform selection — CDP', expected: 'buy' },
    { name: 'Contact center outsourcing — BPO for tier-1 customer service', expected: 'partner' },
    { name: 'SIEM and security operations sourcing — MSSP cyber evaluation', expected: 'buy' },
  ];

  for (const { name, expected } of expectations) {
    it(`defaults "${name}" toward ${expected}`, () => {
      const gate = runDeliveryModelGate(classify(name));
      expect(gate.recommendedModel).toBe(expected);
    });
  }

  it('every category yields a recommendation with a label and reasoning', () => {
    const gate = runDeliveryModelGate(classify('AMS RFP for application support'));
    expect(gate.recommendedModelLabel.length).toBeGreaterThan(0);
    expect(gate.reasoning.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Disqualified options
// ---------------------------------------------------------------------------

describe('runDeliveryModelGate — disqualified options', () => {
  it('rules out exactly three models (the non-recommended ones) each with a reason', () => {
    const gate = runDeliveryModelGate(classify('AMS RFP for application support'), {
      internalCapability: 'partial',
    });
    expect(gate.disqualifiedModels).toHaveLength(3);
    expect(gate.disqualifiedModels.map((d) => d.model)).not.toContain(
      gate.recommendedModel,
    );
    for (const d of gate.disqualifiedModels) {
      expect(d.reason.length).toBeGreaterThan(0);
    }
  });

  it('structurally excludes build and SI for a SaaS renewal', () => {
    const gate = runDeliveryModelGate(classify('Salesforce subscription renewal'));
    expect(gate.recommendedModel).toBe('buy');
    const excluded = gate.disqualifiedModels.map((d) => d.model);
    expect(excluded).toContain('build');
    expect(excluded).toContain('si');
  });

  it('disqualifies SI for steady-state run work', () => {
    const gate = runDeliveryModelGate(classify('AMS RFP for application support'), {
      workShape: 'steady_state_run',
      internalCapability: 'partial',
    });
    const si = gate.disqualifiedModels.find((d) => d.model === 'si');
    expect(si?.reason).toMatch(/steady-state/i);
  });
});

// ---------------------------------------------------------------------------
// Gate status, evidence, and over-scoped-SI guard
// ---------------------------------------------------------------------------

describe('runDeliveryModelGate — gate status and evidence', () => {
  it('blocks on insufficient evidence when nothing is loaded and no signals given', () => {
    const classification = classify('AMS RFP for application support', undefined, {
      loadedSegments: [],
    });
    const gate = runDeliveryModelGate(classification, { loadedSegments: [] });
    expect(gate.gateStatus).toBe('blocked_insufficient_evidence');
  });

  it('clears the gate when signals are decisive and no questions remain', () => {
    const classification = classify('AMS RFP for application support');
    const gate = runDeliveryModelGate(classification, {
      internalCapability: 'partial',
      isCoreDifferentiator: false,
      workShape: 'steady_state_run',
      ownsCoveringCapability: false,
      hasIncumbentContract: false,
      loadedSegments: ALL_SEGMENTS,
    });
    expect(gate.gateStatus).toBe('cleared');
    expect(gate.openQuestions).toHaveLength(0);
    expect(gate.confidence).toBe('high');
  });

  it('carries classifier evidence gaps through as blocking open questions', () => {
    // Nothing loaded — AMS has 3 required evidence inputs => 3 gaps.
    const classification = classify('AMS RFP for application support', undefined, {
      loadedSegments: [],
    });
    expect(classification.evidenceGaps.length).toBeGreaterThan(0);
    const gate = runDeliveryModelGate(classification, {
      internalCapability: 'partial',
    });
    const gapQuestions = gate.openQuestions.filter((q) =>
      /Required evidence/i.test(q.question),
    );
    expect(gapQuestions.length).toBe(classification.evidenceGaps.length);
  });

  it('over-scoped SI guard — recommends partner, not SI, for a steady-state run', () => {
    const classification = classify(
      'Select an AI engineering partner to build and run agentic copilots',
    );
    expect(classification.categoryId).toBe('ai_engineering_partner');
    const gate = runDeliveryModelGate(classification, {
      workShape: 'steady_state_run',
      internalCapability: 'partial',
      loadedSegments: ALL_SEGMENTS,
    });
    expect(gate.recommendedModel).toBe('partner');
    expect(gate.reasoning.join(' ')).toMatch(/steady-state/i);
  });

  it('emits a confirmation question when no decision signals are supplied', () => {
    const gate = runDeliveryModelGate(classify('AMS RFP for application support'), {
      loadedSegments: ALL_SEGMENTS,
    });
    expect(gate.openQuestions.some((q) => /Confirm the delivery model/i.test(q.question))).toBe(
      true,
    );
    expect(gate.confidence).toBe('low');
  });

  it('is a pure function — identical inputs yield identical output', () => {
    const classification = classify('Customer Data Platform selection — CDP');
    const signals: DeliveryModelSignals = { isCoreDifferentiator: false };
    const a = runDeliveryModelGate(classification, signals);
    const b = runDeliveryModelGate(classification, signals);
    expect(a).toEqual(b);
  });
});
