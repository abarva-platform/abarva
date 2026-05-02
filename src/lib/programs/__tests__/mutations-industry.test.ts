import {
  buildEngagementGraphNodeId,
  resolveProgramClassificationCodes,
  resolveProgramIndustryCode,
} from '../mutations';

describe('buildEngagementGraphNodeId', () => {
  it('creates a stable legacy-compatible engagement graph node prefix from the program name', () => {
    expect(buildEngagementGraphNodeId('Healthcare Data Analytics Modernization')).toMatch(
      /^eng_healthcare_data_analytics_modernization_[a-z0-9]+$/,
    );
  });
});

describe('resolveProgramIndustryCode', () => {
  it('uses the explicit client industry code when present', () => {
    expect(
      resolveProgramIndustryCode({
        name: 'Apex Retail',
        industry_code: 'retail',
      }),
    ).toBe('RETAIL');
  });

  it('falls back from a blank Apex client row to the canonical retail code', () => {
    expect(
      resolveProgramIndustryCode({
        name: 'Apex Retail',
        industry_code: null,
      }),
    ).toBe('RETAIL');
  });

  it('falls back from a blank Meridian client row to the canonical healthcare code', () => {
    expect(
      resolveProgramIndustryCode({
        name: 'Meridian Health System',
        industry_code: '',
      }),
    ).toBe('HEALTHCARE_IDN');
  });

  it('uses the request hint before UNKNOWN for non-demo clients', () => {
    expect(
      resolveProgramIndustryCode(
        {
          name: 'Unmapped Client',
          industry_code: null,
        },
        'industrial',
      ),
    ).toBe('INDUSTRIAL');
  });
});

describe('resolveProgramClassificationCodes', () => {
  it('classifies patient-facing growth programs as front-office growth', () => {
    expect(
      resolveProgramClassificationCodes({
        name: 'Patient Digital Front Door',
        useCase: 'Lift patient acquisition and portal conversion.',
      }),
    ).toEqual({
      functionCode: 'FRONT_OFFICE',
      objectiveCode: 'GROW',
      topicCode: 'patient_digital_front_door',
    });
  });

  it('classifies revenue cycle compliance programs as back-office control', () => {
    expect(
      resolveProgramClassificationCodes({
        name: 'Revenue Cycle Governance Reset',
        useCase: 'Control audit risk and compliance exposure in RCM.',
      }),
    ).toMatchObject({
      functionCode: 'BACK_OFFICE',
      objectiveCode: 'CONTROL',
    });
  });

  it('uses an accepted pattern key as the topic code when present', () => {
    expect(
      resolveProgramClassificationCodes({
        name: 'AI Assisted Engineering Productivity',
        useCase: 'Improve internal SDLC DORA metrics.',
        acceptedPatternKey: 'PAT-PRG-AI-CODING-001',
      }).topicCode,
    ).toBe('pat_prg_ai_coding_001');
  });
});
