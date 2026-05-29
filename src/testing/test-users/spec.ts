export type ProvisioningMembershipRole = 'maestro' | 'client_viewer' | 'observer';
export type ProvisioningAppRole = 'client' | 'investor' | 'external';
export type ProvisioningClientKey = 'meridian' | 'arcturus' | 'apexretail' | 'northstar' | 'skyharbor';
export type ProvisioningAccessLevel =
  | 'client_admin'
  | 'program_member'
  | 'program_viewer'
  | 'source_member'
  | 'source_viewer';

export type ProvisioningProductModule = 'setup' | 'programs' | 'source' | 'intelligence' | 'tower';

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
  programAssignments?: Array<{
    clientKey: ProvisioningClientKey;
    allExistingClientPrograms?: boolean;
    programNames?: string[];
    programAccessLevel?: 'program_member' | 'program_viewer';
    approvalAuthority?: 'contributor' | 'reviewer' | 'approver' | 'sponsor';
    canViewFinancial?: boolean;
    canUpload?: boolean;
    canGenerateDeliverables?: boolean;
    canPublishDeliverables?: boolean;
    canApprovePhaseGates?: boolean;
  }>;
  sponsorGrant?: {
    programName: string;
    clientKey: ProvisioningClientKey;
  };
  sourceAssignments?: Array<{
    clientKey: ProvisioningClientKey;
    sourceEventId?: string;
    allExistingClientSourceEvents?: boolean;
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

export const TEST_USER_PASSWORD = 'Demo2026!';

interface CanonicalClientFixture {
  key: ProvisioningClientKey;
  clientId: ProvisioningClientKey;
  name: string;
  emailDomain: string;
  organization: string;
}

const CLIENTS = {
  meridian: {
    key: 'meridian',
    clientId: 'meridian',
    name: 'Meridian Health System',
    emailDomain: 'meridian-health.example.com',
    organization: 'Meridian Health System',
  },
  apexretail: {
    key: 'apexretail',
    clientId: 'apexretail',
    name: 'Apex Retail Group',
    emailDomain: 'apex-retail.example.com',
    organization: 'Apex Retail Group',
  },
  arcturus: {
    key: 'arcturus',
    clientId: 'arcturus',
    name: 'First Capital',
    emailDomain: 'firstcapital.example.com',
    organization: 'First Capital',
  },
  northstar: {
    key: 'northstar',
    clientId: 'northstar',
    name: 'Northstar Clinical Technologies',
    emailDomain: 'northstar-clinical.example.com',
    organization: 'Northstar Clinical Technologies',
  },
  skyharbor: {
    key: 'skyharbor',
    clientId: 'skyharbor',
    name: 'SkyHarbor Air',
    emailDomain: 'skyharbor-air.example.com',
    organization: 'SkyHarbor Air',
  },
} as const satisfies Record<string, CanonicalClientFixture>;

function email(localPart: string, client: CanonicalClientFixture): string {
  return `${localPart}@${client.emailDomain}`;
}

function metadata(args: {
  client: CanonicalClientFixture;
  personaKey: string;
  moduleAccess: ProvisioningProductModule[];
  scope: 'client_admin' | 'programs_assigned' | 'programs_unassigned_create' | 'source_assigned' | 'source_unassigned_create';
}) {
  return {
    role: 'client',
    clientId: args.client.clientId,
    defaultClientId: args.client.clientId,
    clientLocked: true,
    clientName: args.client.name,
    personaKey: args.personaKey,
    moduleAccess: args.moduleAccess,
    accessScope: args.scope,
  };
}

function person(args: {
  client: CanonicalClientFixture;
  graphNodeId: string;
  name: string;
  role: string;
  primaryRole?: ProvisioningMembershipRole;
}) {
  return {
    graphNodeId: args.graphNodeId,
    name: args.name,
    role: args.role,
    organization: args.client.organization,
    primaryRole: args.primaryRole ?? 'client_viewer',
  };
}

function adminUser(args: {
  client: CanonicalClientFixture;
  key: string;
  localPart: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  graphNodeId: string;
}): TestUserSpec {
  return {
    key: args.key,
    email: email(args.localPart, args.client),
    password: TEST_USER_PASSWORD,
    firstName: args.firstName,
    lastName: args.lastName,
    appRole: 'client',
    publicMetadata: metadata({
      client: args.client,
      personaKey: args.key,
      moduleAccess: ['setup', 'programs', 'source', 'intelligence', 'tower'],
      scope: 'client_admin',
    }),
    person: person({
      client: args.client,
      graphNodeId: args.graphNodeId,
      name: args.name,
      role: args.role,
      primaryRole: 'maestro',
    }),
    memberships: [{
      clientKey: args.client.key,
      role: 'maestro',
      accessLevel: 'client_admin',
      financialVisibility: false,
      canAdminUsers: true,
      canCreatePrograms: true,
      canApproveGates: true,
      canCreateSourceEvents: true,
      canApproveSourceStages: true,
      canApproveAward: true,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
      canPublishSourcingArtifacts: true,
    }],
    expectations: {
      visibleClientKeys: [args.client.key],
      publicOnly: false,
      canApprove: true,
      canCreatePrograms: true,
      canCreateSourceEvents: true,
      canApproveSourceStages: true,
      towerAccess: true,
    },
  };
}

function programsUser(args: {
  client: CanonicalClientFixture;
  key: string;
  localPart: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  graphNodeId: string;
  assignedExistingPrograms: boolean;
}): TestUserSpec {
  return {
    key: args.key,
    email: email(args.localPart, args.client),
    password: TEST_USER_PASSWORD,
    firstName: args.firstName,
    lastName: args.lastName,
    appRole: 'client',
    publicMetadata: metadata({
      client: args.client,
      personaKey: args.key,
      moduleAccess: ['programs', 'intelligence', 'tower'],
      scope: args.assignedExistingPrograms ? 'programs_assigned' : 'programs_unassigned_create',
    }),
    person: person({
      client: args.client,
      graphNodeId: args.graphNodeId,
      name: args.name,
      role: args.role,
    }),
    memberships: [{
      clientKey: args.client.key,
      role: 'client_viewer',
      accessLevel: 'program_member',
      financialVisibility: false,
      canAdminUsers: false,
      canCreatePrograms: true,
      canApproveGates: false,
    }],
    programAssignments: args.assignedExistingPrograms
      ? [{
        clientKey: args.client.key,
        allExistingClientPrograms: true,
        programAccessLevel: 'program_member',
        approvalAuthority: 'contributor',
        canViewFinancial: false,
        canUpload: true,
        canGenerateDeliverables: true,
        canPublishDeliverables: false,
        canApprovePhaseGates: false,
      }]
      : [],
    expectations: {
      visibleClientKeys: [args.client.key],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: true,
      canCreateSourceEvents: false,
      canApproveSourceStages: false,
      towerAccess: true,
    },
  };
}

function sourceUser(args: {
  client: CanonicalClientFixture;
  key: string;
  localPart: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  graphNodeId: string;
  assignedExistingSourceEvents: boolean;
}): TestUserSpec {
  return {
    key: args.key,
    email: email(args.localPart, args.client),
    password: TEST_USER_PASSWORD,
    firstName: args.firstName,
    lastName: args.lastName,
    appRole: 'client',
    publicMetadata: metadata({
      client: args.client,
      personaKey: args.key,
      moduleAccess: ['source', 'intelligence', 'tower'],
      scope: args.assignedExistingSourceEvents ? 'source_assigned' : 'source_unassigned_create',
    }),
    person: person({
      client: args.client,
      graphNodeId: args.graphNodeId,
      name: args.name,
      role: args.role,
    }),
    memberships: [{
      clientKey: args.client.key,
      role: 'client_viewer',
      accessLevel: 'source_member',
      financialVisibility: false,
      canAdminUsers: false,
      canCreatePrograms: false,
      canApproveGates: false,
      canCreateSourceEvents: true,
      canApproveSourceStages: false,
      canApproveAward: false,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
      canPublishSourcingArtifacts: false,
    }],
    sourceAssignments: args.assignedExistingSourceEvents
      ? [{
        clientKey: args.client.key,
        allExistingClientSourceEvents: true,
        sourceAccessLevel: 'source_member',
        approvalAuthority: 'contributor',
        canViewFinancial: false,
        canUploadSourceArtifacts: true,
        canGenerateSourcingArtifacts: true,
        canPublishSourcingArtifacts: false,
        canApproveSourceStages: false,
        canApproveAward: false,
      }]
      : [],
    expectations: {
      visibleClientKeys: [args.client.key],
      publicOnly: false,
      canApprove: false,
      canCreatePrograms: false,
      canCreateSourceEvents: true,
      canApproveSourceStages: false,
      towerAccess: true,
    },
  };
}

export const TEST_USER_SPECS: TestUserSpec[] = [
  adminUser({
    client: CLIENTS.meridian,
    key: 'meridian-admin-nina-patel',
    localPart: 'nina.patel',
    firstName: 'Nina',
    lastName: 'Patel',
    name: 'Nina Patel',
    role: 'Director, IT Procurement',
    graphNodeId: 'person:meridian:nina-patel',
  }),
  programsUser({
    client: CLIENTS.meridian,
    key: 'meridian-programs-elena-rivera',
    localPart: 'elena.rivera',
    firstName: 'Elena',
    lastName: 'Rivera',
    name: 'Elena Rivera',
    role: 'Director, Digital Product Management',
    graphNodeId: 'person:meridian:elena-rivera',
    assignedExistingPrograms: true,
  }),
  programsUser({
    client: CLIENTS.meridian,
    key: 'meridian-programs-caleb-nguyen',
    localPart: 'caleb.nguyen',
    firstName: 'Caleb',
    lastName: 'Nguyen',
    name: 'Caleb Nguyen',
    role: 'Director, Clinical Product Operations',
    graphNodeId: 'person:meridian:caleb-nguyen',
    assignedExistingPrograms: true,
  }),
  programsUser({
    client: CLIENTS.meridian,
    key: 'meridian-programs-marcus-chen-unassigned',
    localPart: 'marcus.chen',
    firstName: 'Marcus',
    lastName: 'Chen',
    name: 'Marcus Chen',
    role: 'VP, Data and Analytics',
    graphNodeId: 'person:meridian:marcus-chen',
    assignedExistingPrograms: false,
  }),
  sourceUser({
    client: CLIENTS.meridian,
    key: 'meridian-source-omar-rahman',
    localPart: 'omar.rahman',
    firstName: 'Omar',
    lastName: 'Rahman',
    name: 'Omar Rahman',
    role: 'Director, Vendor Management and Contracts',
    graphNodeId: 'person:meridian:omar-rahman',
    assignedExistingSourceEvents: true,
  }),
  sourceUser({
    client: CLIENTS.meridian,
    key: 'meridian-source-david-henderson',
    localPart: 'david.henderson',
    firstName: 'David',
    lastName: 'Henderson',
    name: 'David Henderson',
    role: 'Director, RCM Innovation',
    graphNodeId: 'person:meridian:david-henderson',
    assignedExistingSourceEvents: true,
  }),
  sourceUser({
    client: CLIENTS.meridian,
    key: 'meridian-source-rebecca-hollings-unassigned',
    localPart: 'rebecca.hollings',
    firstName: 'Rebecca',
    lastName: 'Hollings',
    name: 'Rebecca Hollings',
    role: 'General Counsel',
    graphNodeId: 'person:meridian:rebecca-hollings',
    assignedExistingSourceEvents: false,
  }),

  adminUser({
    client: CLIENTS.apexretail,
    key: 'apex-admin-carlos-rivera',
    localPart: 'carlos.rivera',
    firstName: 'Carlos',
    lastName: 'Rivera',
    name: 'Carlos Rivera',
    role: 'CIO',
    graphNodeId: 'person:apexretail:carlos-rivera',
  }),
  programsUser({
    client: CLIENTS.apexretail,
    key: 'apex-programs-priya-iyer',
    localPart: 'priya.iyer',
    firstName: 'Priya',
    lastName: 'Iyer',
    name: 'Priya Iyer',
    role: 'VP Digital & E-commerce Technology',
    graphNodeId: 'person:apexretail:priya-iyer',
    assignedExistingPrograms: true,
  }),
  programsUser({
    client: CLIENTS.apexretail,
    key: 'apex-programs-brandon-hayes',
    localPart: 'brandon.hayes',
    firstName: 'Brandon',
    lastName: 'Hayes',
    name: 'Brandon Hayes',
    role: 'Acting VP Store Technology',
    graphNodeId: 'person:apexretail:brandon-hayes',
    assignedExistingPrograms: true,
  }),
  programsUser({
    client: CLIENTS.apexretail,
    key: 'apex-programs-james-wright-unassigned',
    localPart: 'james.wright',
    firstName: 'James',
    lastName: 'Wright',
    name: 'James Wright',
    role: 'VP Data Engineering & Platform',
    graphNodeId: 'person:apexretail:james-wright',
    assignedExistingPrograms: false,
  }),
  sourceUser({
    client: CLIENTS.apexretail,
    key: 'apex-source-nathan-kohl',
    localPart: 'nathan.kohl',
    firstName: 'Nathan',
    lastName: 'Kohl',
    name: 'Nathan Kohl',
    role: 'VP IT Procurement & Vendor Management',
    graphNodeId: 'person:apexretail:nathan-kohl',
    assignedExistingSourceEvents: true,
  }),
  sourceUser({
    client: CLIENTS.apexretail,
    key: 'apex-source-michael-tanaka',
    localPart: 'michael.tanaka',
    firstName: 'Michael',
    lastName: 'Tanaka',
    name: 'Michael Tanaka',
    role: 'Chief Supply Chain Officer',
    graphNodeId: 'person:apexretail:michael-tanaka',
    assignedExistingSourceEvents: true,
  }),
  sourceUser({
    client: CLIENTS.apexretail,
    key: 'apex-source-lynne-stratham-unassigned',
    localPart: 'lynne.stratham',
    firstName: 'Lynne',
    lastName: 'Stratham',
    name: 'Lynne Stratham',
    role: 'CDO',
    graphNodeId: 'person:apexretail:lynne-stratham',
    assignedExistingSourceEvents: false,
  }),

  adminUser({
    client: CLIENTS.arcturus,
    key: 'firstcapital-admin-ethan-brooks',
    localPart: 'ethan.brooks',
    firstName: 'Ethan',
    lastName: 'Brooks',
    name: 'Ethan Brooks',
    role: 'Director, IT Sourcing',
    graphNodeId: 'person:firstcapital:ethan-brooks',
  }),
  programsUser({
    client: CLIENTS.arcturus,
    key: 'firstcapital-programs-lena-ortiz',
    localPart: 'lena.ortiz',
    firstName: 'Lena',
    lastName: 'Ortiz',
    name: 'Lena Ortiz',
    role: 'Director, Payments Program Management',
    graphNodeId: 'person:firstcapital:lena-ortiz',
    assignedExistingPrograms: true,
  }),
  programsUser({
    client: CLIENTS.arcturus,
    key: 'firstcapital-programs-rachel-kim',
    localPart: 'rachel.kim',
    firstName: 'Rachel',
    lastName: 'Kim',
    name: 'Rachel Kim',
    role: 'Director, Digital Product Management',
    graphNodeId: 'person:firstcapital:rachel-kim',
    assignedExistingPrograms: true,
  }),
  programsUser({
    client: CLIENTS.arcturus,
    key: 'firstcapital-programs-priya-mehta-unassigned',
    localPart: 'priya.mehta',
    firstName: 'Priya',
    lastName: 'Mehta',
    name: 'Priya Mehta',
    role: 'Chief Product Officer, Digital Banking',
    graphNodeId: 'person:firstcapital:priya-mehta',
    assignedExistingPrograms: false,
  }),
  sourceUser({
    client: CLIENTS.arcturus,
    key: 'firstcapital-source-nadia-rahman',
    localPart: 'nadia.rahman',
    firstName: 'Nadia',
    lastName: 'Rahman',
    name: 'Nadia Rahman',
    role: 'Chief Procurement Officer',
    graphNodeId: 'person:firstcapital:nadia-rahman',
    assignedExistingSourceEvents: true,
  }),
  sourceUser({
    client: CLIENTS.arcturus,
    key: 'firstcapital-source-james-park',
    localPart: 'james.park',
    firstName: 'James',
    lastName: 'Park',
    name: 'James Park',
    role: 'Chief Risk Officer',
    graphNodeId: 'person:firstcapital:james-park',
    assignedExistingSourceEvents: true,
  }),
  sourceUser({
    client: CLIENTS.arcturus,
    key: 'firstcapital-source-kevin-walsh-unassigned',
    localPart: 'kevin.walsh',
    firstName: 'Kevin',
    lastName: 'Walsh',
    name: 'Kevin Walsh',
    role: 'Head of Commercial Banking',
    graphNodeId: 'person:firstcapital:kevin-walsh',
    assignedExistingSourceEvents: false,
  }),

  adminUser({
    client: CLIENTS.northstar,
    key: 'northstar-admin-maya-rangan',
    localPart: 'ceo',
    firstName: 'Maya',
    lastName: 'Rangan',
    name: 'Maya Rangan',
    role: 'Chief Executive Officer',
    graphNodeId: 'person:northstar:maya-rangan',
  }),
  adminUser({
    client: CLIENTS.northstar,
    key: 'northstar-admin-daniel-okafor',
    localPart: 'cfo',
    firstName: 'Daniel',
    lastName: 'Okafor',
    name: 'Daniel Okafor',
    role: 'Chief Financial Officer',
    graphNodeId: 'person:northstar:daniel-okafor',
  }),
  adminUser({
    client: CLIENTS.northstar,
    key: 'northstar-admin-priya-mehta',
    localPart: 'cio',
    firstName: 'Priya',
    lastName: 'Mehta',
    name: 'Priya Mehta',
    role: 'Chief Information Officer',
    graphNodeId: 'person:northstar:priya-mehta',
  }),
  programsUser({
    client: CLIENTS.northstar,
    key: 'northstar-programs-elena-kovacs',
    localPart: 'cqo',
    firstName: 'Elena',
    lastName: 'Kovacs',
    name: 'Elena Kovacs',
    role: 'Chief Quality Officer',
    graphNodeId: 'person:northstar:elena-kovacs',
    assignedExistingPrograms: true,
  }),
  sourceUser({
    client: CLIENTS.northstar,
    key: 'northstar-source-marcus-lee',
    localPart: 'evp-his',
    firstName: 'Marcus',
    lastName: 'Lee',
    name: 'Marcus Lee',
    role: 'EVP Health Information Systems',
    graphNodeId: 'person:northstar:marcus-lee',
    assignedExistingSourceEvents: true,
  }),
];
