// FM-02 data-readiness validator

import {
  validateDataReadiness,
  type DataReadinessInput,
  type ReadinessDimension,
} from '@/lib/workflow/dataReadiness';

function validFixture(): DataReadinessInput {
  const dims: ReadinessDimension[] = ['availability', 'quality', 'governance', 'skills', 'integration'];
  return {
    programCode: 'APX-01',
    dimensions: dims.map((d) => ({
      dimension: d,
      status: 'ready',
      owner: 'Jamie Chen, Head of Data Engineering',
      note: 'Production warehouse carries the SKU and margin tables at hourly freshness.',
    })),
    posture: 'We commit to sustained SLO against this data layer for the duration of Phase 2 and beyond with the named owners above.',
  };
}

describe('data readiness validator', () => {
  test('valid fixture returns no errors', () => {
    expect(validateDataReadiness(validFixture())).toEqual([]);
  });

  test('missing programCode flagged', () => {
    const input = { ...validFixture(), programCode: '' };
    const errors = validateDataReadiness(input);
    expect(errors.some((e) => e.field === 'programCode')).toBe(true);
  });

  test('missing dimension flagged', () => {
    const input = validFixture();
    input.dimensions = input.dimensions.slice(0, 3);
    const errors = validateDataReadiness(input);
    expect(errors.some((e) => e.field === 'dimensions' && e.reason === 'required_all_five')).toBe(true);
  });

  test('duplicate dimension flagged', () => {
    const input = validFixture();
    input.dimensions[1].dimension = 'availability';
    const errors = validateDataReadiness(input);
    expect(errors.some((e) => e.field === 'dimensions' && e.reason === 'duplicate_dimension')).toBe(true);
  });

  test('unowned dimension flagged with specific dimension', () => {
    const input = validFixture();
    input.dimensions[2].owner = '';
    const errors = validateDataReadiness(input);
    expect(errors).toContainEqual({ field: 'dimension_owner', reason: 'required', dimension: 'governance' });
  });

  test('gap dimension with vague note flagged', () => {
    const input = validFixture();
    input.dimensions[0].status = 'gaps';
    input.dimensions[0].note = 'Things are fine-ish overall for now we think.';
    const errors = validateDataReadiness(input);
    expect(errors.some((e) => e.field === 'dimension_note' && e.reason === 'gap_needs_specifics')).toBe(true);
  });

  test('gap dimension with specific gap word passes', () => {
    const input = validFixture();
    input.dimensions[0].status = 'gaps';
    input.dimensions[0].note = 'Governance has an unowned access control gap pending SecOps review.';
    expect(validateDataReadiness(input)).toEqual([]);
  });

  test('short posture flagged', () => {
    const input = { ...validFixture(), posture: 'looks good' };
    const errors = validateDataReadiness(input);
    expect(errors.some((e) => e.field === 'posture')).toBe(true);
  });
});
