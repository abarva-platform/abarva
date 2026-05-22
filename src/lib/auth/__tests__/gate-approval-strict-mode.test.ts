/** GATE_APPROVAL_STRICT_MODE helper tests — audit 2026-05-22, P1-4. */

import {
  isGateApprovalStrictMode,
  isStrictModeApprovalRole,
  passesSeparationOfDuties,
} from '../gate-approval-strict-mode';

const ORIGINAL = process.env.GATE_APPROVAL_STRICT_MODE;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.GATE_APPROVAL_STRICT_MODE;
  } else {
    process.env.GATE_APPROVAL_STRICT_MODE = ORIGINAL;
  }
});

describe('isGateApprovalStrictMode', () => {
  it('is off by default / when unset', () => {
    delete process.env.GATE_APPROVAL_STRICT_MODE;
    expect(isGateApprovalStrictMode()).toBe(false);
  });

  it('recognizes truthy flag values', () => {
    for (const v of ['1', 'true', 'on', 'YES', 'True']) {
      process.env.GATE_APPROVAL_STRICT_MODE = v;
      expect(isGateApprovalStrictMode()).toBe(true);
    }
  });

  it('treats other values as off', () => {
    for (const v of ['0', 'false', 'off', '']) {
      process.env.GATE_APPROVAL_STRICT_MODE = v;
      expect(isGateApprovalStrictMode()).toBe(false);
    }
  });
});

describe('isStrictModeApprovalRole', () => {
  it('accepts admin / maestro family roles', () => {
    for (const r of ['admin', 'maestro', 'client_admin', 'abarva_super_admin', 'founder']) {
      expect(isStrictModeApprovalRole(r)).toBe(true);
    }
  });

  it('rejects sponsor / approver / member / null in strict mode', () => {
    for (const r of ['sponsor', 'approver', 'program_member', null, undefined, '']) {
      expect(isStrictModeApprovalRole(r)).toBe(false);
    }
  });
});

describe('passesSeparationOfDuties', () => {
  it('is a no-op when strict mode is off (pilot allows self-approval)', () => {
    delete process.env.GATE_APPROVAL_STRICT_MODE;
    expect(
      passesSeparationOfDuties({ requestedByUserId: 'u1', approverUserId: 'u1' }),
    ).toBe(true);
  });

  it('blocks self-approval when strict mode is on', () => {
    process.env.GATE_APPROVAL_STRICT_MODE = '1';
    expect(
      passesSeparationOfDuties({ requestedByUserId: 'u1', approverUserId: 'u1' }),
    ).toBe(false);
    expect(
      passesSeparationOfDuties({ requestedByUserId: 'u1', approverUserId: 'u2' }),
    ).toBe(true);
  });
});
