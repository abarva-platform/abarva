// FM-04 stakeholder-success + tension validation

import {
  validateProgramTension,
  validateStakeholderSuccess,
  type ProgramTensionInput,
  type StakeholderSuccessInput,
} from '@/lib/workflow/stakeholderSuccess';

function validSuccess(): StakeholderSuccessInput {
  return {
    programCode: 'MRD-01',
    stakeholderId: 'dr-larsson',
    stakeholderName: 'Dr. Larsson',
    stakeholderRole: 'CMO',
    successDefinition: 'Reduce documentation minutes per encounter from 22 to below 10 across attending physicians within 12 months.',
    metric: 'documentation minutes per encounter',
    target: '< 10 min by month 12',
    horizonMonths: 12,
  };
}

function validTension(): ProgramTensionInput {
  return {
    programCode: 'MRD-01',
    stakeholderId: 'dr-larsson',
    stakeholderName: 'Dr. Larsson',
    tension: 'Clinicians want the ambient tool enabled but the AI Council has not signed off on bias review for the specialty subgroup cuts.',
    category: 'political',
    resolutionPath: 'Schedule AI Council review of specialty-specific bias report before pilot expansion to cardiology and oncology.',
    owner: 'Dr. L. Morales, CMIO',
  };
}

describe('stakeholder success validator', () => {
  test('valid fixture returns no errors', () => {
    expect(validateStakeholderSuccess(validSuccess())).toEqual([]);
  });

  test('missing metric flagged', () => {
    const input = { ...validSuccess(), metric: '' };
    const errors = validateStakeholderSuccess(input);
    expect(errors).toContainEqual({ field: 'metric', reason: 'required' });
  });

  test('non-measurable definition flagged', () => {
    const input = { ...validSuccess(), successDefinition: 'We want clinicians to feel better about the documentation experience in general.' };
    const errors = validateStakeholderSuccess(input);
    expect(errors).toContainEqual({ field: 'successDefinition', reason: 'not_measurable' });
  });

  test('horizon zero or negative flagged', () => {
    const input = { ...validSuccess(), horizonMonths: 0 };
    const errors = validateStakeholderSuccess(input);
    expect(errors).toContainEqual({ field: 'horizonMonths', reason: 'must_be_positive' });
  });

  test('too short definition flagged', () => {
    const input = { ...validSuccess(), successDefinition: 'tbd' };
    const errors = validateStakeholderSuccess(input);
    expect(errors.some((e) => e.field === 'successDefinition')).toBe(true);
  });
});

describe('program tension validator', () => {
  test('valid fixture returns no errors', () => {
    expect(validateProgramTension(validTension())).toEqual([]);
  });

  test('missing owner flagged · tension must have named owner', () => {
    const input = { ...validTension(), owner: '' };
    const errors = validateProgramTension(input);
    expect(errors).toContainEqual({ field: 'owner', reason: 'required' });
  });

  test('invalid category flagged', () => {
    const input = { ...validTension(), category: 'vibes' as ProgramTensionInput['category'] };
    const errors = validateProgramTension(input);
    expect(errors).toContainEqual({ field: 'category', reason: 'invalid' });
  });

  test('short resolution path flagged', () => {
    const input = { ...validTension(), resolutionPath: 'tbd' };
    const errors = validateProgramTension(input);
    expect(errors).toContainEqual({ field: 'resolutionPath', reason: 'too_short' });
  });

  test('multiple errors returned in parallel', () => {
    const errors = validateProgramTension({ programCode: '', tension: '', resolutionPath: '' });
    const fields = new Set(errors.map((e) => e.field));
    expect(fields.size).toBeGreaterThanOrEqual(4);
  });
});
