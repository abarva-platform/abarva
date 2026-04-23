import { TEST_USER_EMAIL_SUFFIX, TEST_USER_PASSWORD, TEST_USER_SPECS } from '@/testing/test-users/spec';

describe('test user specs', () => {
  test('defines exactly five personas', () => {
    expect(TEST_USER_SPECS).toHaveLength(5);
  });

  test('keeps all emails on the reserved local-test namespace', () => {
    for (const spec of TEST_USER_SPECS) {
      expect(spec.email.endsWith(TEST_USER_EMAIL_SUFFIX)).toBe(true);
    }
  });

  test('uses a single deterministic password for repeatable login verification', () => {
    for (const spec of TEST_USER_SPECS) {
      expect(spec.password).toBe(TEST_USER_PASSWORD);
    }
  });

  test('contains one public-only external persona', () => {
    const external = TEST_USER_SPECS.filter((spec) => spec.appRole === 'external');
    expect(external).toHaveLength(1);
    expect(external[0]?.expectations.publicOnly).toBe(true);
    expect(external[0]?.person).toBeUndefined();
  });

  test('keeps Marcus locked to Apex with approval authority intent', () => {
    const marcus = TEST_USER_SPECS.find((spec) => spec.key === 'marcus-apex-cfo');
    expect(marcus?.memberships).toEqual([{ clientKey: 'apexretail', role: 'client_viewer' }]);
    expect(marcus?.sponsorGrant?.programName).toBe('Morrison Owned Brand Margin Recovery');
    expect(marcus?.expectations.canApprove).toBe(true);
  });

  test('keeps Jake multi-tenant as the investor persona', () => {
    const jake = TEST_USER_SPECS.find((spec) => spec.key === 'jake-anthology-analyst');
    expect(jake?.appRole).toBe('investor');
    expect(jake?.expectations.visibleClientKeys).toEqual(['meridian', 'arcturus', 'apexretail', 'keystone']);
  });
});
