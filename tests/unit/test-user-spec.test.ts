import { CANONICAL_AUTH_EMAILS, CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { TEST_USER_PASSWORD, TEST_USER_SPECS } from '@/testing/test-users/spec';

describe('test user specs', () => {
  test('defines the canonical 21 client-bound auth personas', () => {
    expect(TEST_USER_SPECS).toHaveLength(21);
    expect(TEST_USER_SPECS.map((spec) => spec.email).sort()).toEqual([...CANONICAL_AUTH_EMAILS].sort());
  });

  test('pins every user to exactly one client', () => {
    for (const spec of TEST_USER_SPECS) {
      expect(spec.appRole).toBe('client');
      expect(spec.expectations.visibleClientKeys).toHaveLength(1);
      expect(spec.publicMetadata.clientLocked).toBe(true);
      expect(spec.publicMetadata.clientId).toBe(spec.expectations.visibleClientKeys[0]);
      expect(spec.publicMetadata.defaultClientId).toBe(spec.expectations.visibleClientKeys[0]);
    }
  });

  test('uses a single deterministic password for repeatable login verification', () => {
    for (const spec of TEST_USER_SPECS) {
      expect(spec.password).toBe(TEST_USER_PASSWORD);
    }
  });

  test('keeps exactly one scoped admin per client', () => {
    const admins = TEST_USER_SPECS.filter((spec) => CANONICAL_CLIENT_ADMIN_EMAILS.includes(
      spec.email as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
    ));

    expect(admins).toHaveLength(3);
    for (const admin of admins) {
      expect(admin.memberships?.[0]?.accessLevel).toBe('client_admin');
      expect(admin.memberships?.[0]?.canAdminUsers).toBe(true);
      expect(admin.expectations.visibleClientKeys).toHaveLength(1);
    }
  });

  test('keeps financial visibility off for every canonical user', () => {
    for (const spec of TEST_USER_SPECS) {
      for (const membership of spec.memberships ?? []) {
        expect(membership.financialVisibility).toBe(false);
      }
      for (const programAssignment of spec.programAssignments ?? []) {
        expect(programAssignment.canViewFinancial).toBe(false);
      }
      for (const sourceAssignment of spec.sourceAssignments ?? []) {
        expect(sourceAssignment.canViewFinancial).toBe(false);
      }
    }
  });

  test('has one unassigned Programs creator and one unassigned Source creator per client', () => {
    for (const clientKey of ['meridian', 'apexretail', 'arcturus']) {
      const programsCreators = TEST_USER_SPECS.filter((spec) =>
        spec.expectations.visibleClientKeys[0] === clientKey &&
        spec.memberships?.[0]?.accessLevel === 'program_member' &&
        spec.programAssignments?.length === 0,
      );
      const sourceCreators = TEST_USER_SPECS.filter((spec) =>
        spec.expectations.visibleClientKeys[0] === clientKey &&
        spec.memberships?.[0]?.accessLevel === 'source_member' &&
        spec.sourceAssignments?.length === 0,
      );

      expect(programsCreators).toHaveLength(1);
      expect(programsCreators[0]?.expectations.canCreatePrograms).toBe(true);
      expect(sourceCreators).toHaveLength(1);
      expect(sourceCreators[0]?.expectations.canCreateSourceEvents).toBe(true);
    }
  });
});
