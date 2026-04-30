export type ProvisioningMembershipRole = 'maestro' | 'client_viewer' | 'observer';
export type ProvisioningAppRole = 'client' | 'investor' | 'external';

// Clerk rejects bare `.local` domains. We preserve the requested namespace
// under a valid reserved suffix so the addresses remain clearly test-only.
export const TEST_USER_EMAIL_SUFFIX = '@abarva-test.example.com';

export interface TestUserSpec {
  key: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  appRole: ProvisioningAppRole;
  publicMetadata: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
  person?: {
    graphNodeId: string;
    name: string;
    role: string;
    organization: string;
    primaryRole: ProvisioningMembershipRole;
  };
  memberships?: Array<{
    clientKey: 'meridian' | 'apexretail';
    role: ProvisioningMembershipRole;
  }>;
  sponsorGrant?: {
    programName: string;
    clientKey: 'meridian' | 'apexretail';
  };
  expectations: {
    visibleClientKeys: Array<'meridian' | 'apexretail'>;
    publicOnly: boolean;
    canApprove: boolean;
    canCreatePrograms: boolean;
    towerAccess: boolean;
  };
}

export const TEST_USER_PASSWORD = 'AbarVaTest2026!';

export const TEST_USER_SPECS: TestUserSpec[] = [
  {
    key: 'marcus-apex-cfo',
    email: `marcus-apex-cfo-test${TEST_USER_EMAIL_SUFFIX}`,
    password: TEST_USER_PASSWORD,
    firstName: 'Marcus',
    lastName: 'T.',
    appRole: 'client',
    publicMetadata: {
      role: 'client',
      clientId: 'apexretail',
      defaultClientId: 'apexretail',
      clientLocked: true,
      clientName: 'Apex Retail Group',
      personaKey: 'marcus-t-apex-cfo',
    },
    person: {
      graphNodeId: 'test_person_marcus_apex_cfo',
      name: 'Marcus T.',
      role: 'CFO',
      organization: 'Apex Retail Group',
      primaryRole: 'client_viewer',
    },
    memberships: [{ clientKey: 'apexretail', role: 'client_viewer' }],
    sponsorGrant: {
      programName: 'Morrison Owned Brand Margin Recovery',
      clientKey: 'apexretail',
    },
    expectations: {
      visibleClientKeys: ['apexretail'],
      publicOnly: false,
      canApprove: true,
      canCreatePrograms: true,
      towerAccess: true,
    },
  },
  {
    key: 'dr-l-meridian-cmio',
    email: `dr-l-meridian-cmio-test${TEST_USER_EMAIL_SUFFIX}`,
    password: TEST_USER_PASSWORD,
    firstName: 'Dr. L.',
    lastName: 'Morales',
    appRole: 'client',
    publicMetadata: {
      role: 'client',
      clientId: 'meridian',
      defaultClientId: 'meridian',
      clientLocked: true,
      clientName: 'Meridian Health System',
      personaKey: 'dr-l-meridian-cmio',
    },
    person: {
      graphNodeId: 'test_person_dr_l_meridian_cmio',
      name: 'Dr. L. Morales',
      role: 'CMIO',
      organization: 'Meridian Health System',
      primaryRole: 'client_viewer',
    },
    memberships: [{ clientKey: 'meridian', role: 'client_viewer' }],
    expectations: {
      visibleClientKeys: ['meridian'],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: true,
      towerAccess: true,
    },
  },
  {
    key: 'jake-anthology-analyst',
    email: `jake-anthology-analyst-test${TEST_USER_EMAIL_SUFFIX}`,
    password: TEST_USER_PASSWORD,
    firstName: 'Jake',
    lastName: 'Anthology',
    appRole: 'investor',
    publicMetadata: {
      role: 'investor',
      clientIds: ['meridian', 'apexretail'],
      defaultClientId: 'meridian',
      clientLocked: false,
      personaKey: 'jake-anthology-analyst',
    },
    expectations: {
      visibleClientKeys: ['meridian', 'apexretail'],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: false,
      towerAccess: true,
    },
  },
  {
    key: 'dara-platform-vp',
    email: `dara-platform-vp-test${TEST_USER_EMAIL_SUFFIX}`,
    password: TEST_USER_PASSWORD,
    firstName: 'Dara',
    lastName: 'Platform',
    appRole: 'external',
    publicMetadata: {
      role: 'external',
      personaKey: 'dara-platform-vp',
      publicOnly: true,
    },
    expectations: {
      visibleClientKeys: [],
      publicOnly: true,
      canApprove: false,
      canCreatePrograms: false,
      towerAccess: false,
    },
  },
  {
    key: 'mike-fortune40-cio',
    email: `mike-fortune40-cio-test${TEST_USER_EMAIL_SUFFIX}`,
    password: TEST_USER_PASSWORD,
    firstName: 'Mike',
    lastName: 'Fortune',
    appRole: 'client',
    publicMetadata: {
      role: 'client',
      clientId: 'meridian',
      defaultClientId: 'meridian',
      clientLocked: true,
      clientName: 'Meridian Health System',
      personaKey: 'mike-fortune40-cio',
      scenario: 'fortune40-composite-fallback-meridian',
    },
    person: {
      graphNodeId: 'test_person_mike_fortune40_cio',
      name: 'Mike Fortune',
      role: 'CIO',
      organization: 'Meridian Health System',
      primaryRole: 'client_viewer',
    },
    memberships: [{ clientKey: 'meridian', role: 'client_viewer' }],
    expectations: {
      visibleClientKeys: ['meridian'],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: false,
      towerAccess: true,
    },
  },
];
