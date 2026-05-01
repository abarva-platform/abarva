export type ProvisioningMembershipRole = 'maestro' | 'client_viewer' | 'observer';
export type ProvisioningAppRole = 'client' | 'investor' | 'external';
export type ProvisioningClientKey = 'meridian' | 'arcturus' | 'apexretail' | 'keystone';
export type ProvisioningAccessLevel =
  | 'client_admin'
  | 'program_member'
  | 'program_viewer'
  | 'source_member'
  | 'source_viewer';

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
    clientKey: ProvisioningClientKey;
    role: ProvisioningMembershipRole;
    accessLevel?: ProvisioningAccessLevel;
    financialVisibility?: boolean;
    canAdminUsers?: boolean;
    canCreatePrograms?: boolean;
    canApproveGates?: boolean;
    canCreateSourceEvents?: boolean;
    canApproveSourceStages?: boolean;
    canApproveAward?: boolean;
    canUploadSourceArtifacts?: boolean;
    canGenerateSourcingArtifacts?: boolean;
    canPublishSourcingArtifacts?: boolean;
  }>;
  sponsorGrant?: {
    programName: string;
    clientKey: ProvisioningClientKey;
  };
  sourceAssignments?: Array<{
    clientKey: ProvisioningClientKey;
    sourceEventId: string;
    sourceAccessLevel: 'source_member' | 'source_viewer';
    approvalAuthority?: 'contributor' | 'reviewer' | 'approver' | 'award_approver';
    canViewFinancial?: boolean;
    canUploadSourceArtifacts?: boolean;
    canGenerateSourcingArtifacts?: boolean;
    canPublishSourcingArtifacts?: boolean;
    canApproveSourceStages?: boolean;
    canApproveAward?: boolean;
  }>;
  expectations: {
    visibleClientKeys: ProvisioningClientKey[];
    publicOnly: boolean;
    canApprove: boolean;
    canCreatePrograms: boolean;
    canCreateSourceEvents?: boolean;
    canApproveSourceStages?: boolean;
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
    memberships: [{
      clientKey: 'apexretail',
      role: 'client_viewer',
      accessLevel: 'source_member',
      financialVisibility: false,
      canCreateSourceEvents: true,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
    }],
    sponsorGrant: {
      programName: 'Morrison Owned Brand Margin Recovery',
      clientKey: 'apexretail',
    },
    sourceAssignments: [{
      clientKey: 'apexretail',
      sourceEventId: 'apex-retail-ams-outsourcing-2026',
      sourceAccessLevel: 'source_member',
      approvalAuthority: 'contributor',
      canViewFinancial: false,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
    }],
    expectations: {
      visibleClientKeys: ['apexretail'],
      publicOnly: false,
      canApprove: true,
      canCreatePrograms: true,
      canCreateSourceEvents: true,
      canApproveSourceStages: false,
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
    memberships: [{
      clientKey: 'meridian',
      role: 'client_viewer',
      accessLevel: 'source_member',
      financialVisibility: false,
      canCreateSourceEvents: true,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
    }],
    expectations: {
      visibleClientKeys: ['meridian'],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: true,
      canCreateSourceEvents: true,
      canApproveSourceStages: false,
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
      clientIds: ['meridian', 'arcturus', 'apexretail', 'keystone'],
      defaultClientId: 'meridian',
      clientLocked: false,
      personaKey: 'jake-anthology-analyst',
    },
    expectations: {
      visibleClientKeys: ['meridian', 'arcturus', 'apexretail', 'keystone'],
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
    memberships: [{
      clientKey: 'meridian',
      role: 'maestro',
      accessLevel: 'client_admin',
      financialVisibility: false,
      canAdminUsers: true,
      canCreatePrograms: true,
      canApproveGates: true,
      canCreateSourceEvents: true,
      canApproveSourceStages: true,
      canApproveAward: true,
      canPublishSourcingArtifacts: true,
    }],
    expectations: {
      visibleClientKeys: ['meridian'],
      publicOnly: false,
      canApprove: true,
      canCreatePrograms: true,
      canCreateSourceEvents: true,
      canApproveSourceStages: true,
      towerAccess: true,
    },
  },
  {
    key: 'rowan-firstcapital-source-lead',
    email: `rowan-firstcapital-source-lead-test${TEST_USER_EMAIL_SUFFIX}`,
    password: TEST_USER_PASSWORD,
    firstName: 'Rowan',
    lastName: 'Shah',
    appRole: 'client',
    publicMetadata: {
      role: 'client',
      clientId: 'arcturus',
      defaultClientId: 'arcturus',
      clientLocked: true,
      clientName: 'First Capital',
      personaKey: 'rowan-firstcapital-source-lead',
    },
    person: {
      graphNodeId: 'test_person_rowan_firstcapital_source_lead',
      name: 'Rowan Shah',
      role: 'Strategic Sourcing Lead',
      organization: 'First Capital',
      primaryRole: 'client_viewer',
    },
    memberships: [{
      clientKey: 'arcturus',
      role: 'client_viewer',
      accessLevel: 'source_member',
      financialVisibility: false,
      canCreateSourceEvents: true,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
    }],
    expectations: {
      visibleClientKeys: ['arcturus'],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: false,
      canCreateSourceEvents: true,
      canApproveSourceStages: false,
      towerAccess: true,
    },
  },
  {
    key: 'sara-apex-source-operator',
    email: `sara-apex-source-operator-test${TEST_USER_EMAIL_SUFFIX}`,
    password: TEST_USER_PASSWORD,
    firstName: 'Sara',
    lastName: 'Patel',
    appRole: 'client',
    publicMetadata: {
      role: 'client',
      clientId: 'apexretail',
      defaultClientId: 'apexretail',
      clientLocked: true,
      clientName: 'Apex Retail Group',
      personaKey: 'sara-apex-source-operator',
      moduleAccess: ['source'],
      sourceScope: 'assigned_source_events_only',
      canCreateSourceEvents: true,
    },
    person: {
      graphNodeId: 'test_person_sara_apex_source_operator',
      name: 'Sara Patel',
      role: 'Sourcing Operator',
      organization: 'Apex Retail Group',
      primaryRole: 'client_viewer',
    },
    memberships: [{
      clientKey: 'apexretail',
      role: 'client_viewer',
      accessLevel: 'source_member',
      financialVisibility: false,
      canCreateSourceEvents: true,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
    }],
    sourceAssignments: [{
      clientKey: 'apexretail',
      sourceEventId: 'apex-retail-ams-outsourcing-2026',
      sourceAccessLevel: 'source_member',
      approvalAuthority: 'contributor',
      canViewFinancial: false,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
    }],
    expectations: {
      visibleClientKeys: ['apexretail'],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: false,
      canCreateSourceEvents: true,
      canApproveSourceStages: false,
      towerAccess: true,
    },
  },
  {
    key: 'noah-meridian-source-operator',
    email: `noah-meridian-source-operator-test${TEST_USER_EMAIL_SUFFIX}`,
    password: TEST_USER_PASSWORD,
    firstName: 'Noah',
    lastName: 'Reed',
    appRole: 'client',
    publicMetadata: {
      role: 'client',
      clientId: 'meridian',
      defaultClientId: 'meridian',
      clientLocked: true,
      clientName: 'Meridian Health System',
      personaKey: 'noah-meridian-source-operator',
      moduleAccess: ['source'],
      sourceScope: 'assigned_source_events_only',
      canCreateSourceEvents: true,
    },
    person: {
      graphNodeId: 'test_person_noah_meridian_source_operator',
      name: 'Noah Reed',
      role: 'Sourcing Operator',
      organization: 'Meridian Health System',
      primaryRole: 'client_viewer',
    },
    memberships: [{
      clientKey: 'meridian',
      role: 'client_viewer',
      accessLevel: 'source_member',
      financialVisibility: false,
      canCreateSourceEvents: true,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
    }],
    expectations: {
      visibleClientKeys: ['meridian'],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: false,
      canCreateSourceEvents: true,
      canApproveSourceStages: false,
      towerAccess: true,
    },
  },
];
