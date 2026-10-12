const authMock = jest.fn();
const clerkCurrentUserMock = jest.fn();
const cookiesMock = jest.fn();
const getCurrentPersonMock = jest.fn();
const getAzureReadFluentClientMock = jest.fn();
const mockOperatorFlag = { enabled: true };
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: () => mockOperatorFlag.enabled }));

jest.mock("@clerk/nextjs/server", () => ({
  auth: (...args: unknown[]) => authMock(...args),
  currentUser: (...args: unknown[]) => clerkCurrentUserMock(...args),
}));

jest.mock("next/headers", () => ({
  cookies: (...args: unknown[]) => cookiesMock(...args),
}));

jest.mock("@/lib/auth/private-browser-proof-session", () => ({
  PRIVATE_BROWSER_PROOF_SESSION_COOKIE: "proof-session",
  readPrivateBrowserProofSessionValue: jest.fn(async () => null),
}));

jest.mock("@/lib/auth/maestro", () => ({
  getCurrentPerson: (...args: unknown[]) => getCurrentPersonMock(...args),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: (...args: unknown[]) =>
    getAzureReadFluentClientMock(...args),
}));

import { getCurrentUser } from "@/lib/auth/current-user";

beforeEach(() => {
  mockOperatorFlag.enabled = true;
  authMock.mockReset();
  clerkCurrentUserMock.mockReset();
  cookiesMock.mockReset().mockResolvedValue({
    get: jest.fn(() => undefined),
  });
  getCurrentPersonMock.mockReset().mockResolvedValue(null);
  getAzureReadFluentClientMock.mockReset().mockImplementation(() => {
    throw new Error("The no-person test path must not query the data plane.");
  });
});

describe("getCurrentUser authoritative Clerk profile", () => {
  const operatorProfile = {
    accountType: "synthetic_e2e_operator", automated: true,
    approvalRef: "private-approval-reference", role: "client",
    clientId: "meridian", defaultClientId: "meridian", clientLocked: true,
    moduleAccess: ["programs"], programScope: "assigned_programs_only",
    programCapabilities: {
      accessLevel: "program_member", canAdminUsers: false,
      canApproveGates: true, canCreatePrograms: true,
      canGenerateDeliverables: true, canPublishDeliverables: true,
      canUploadArtifacts: true, financialVisibility: true,
    }, tenantRoles: { meridian: "viewer" },
  };

  it.each([undefined, { clientId: "meridian", role: "client" }])(
    "recognizes the exact server operator profile with incomplete session metadata %p",
    async (publicMetadata) => {
      authMock.mockResolvedValue({ userId: "user_fixture_operator", sessionClaims: { publicMetadata } });
      clerkCurrentUserMock.mockResolvedValue({
        id: "user_fixture_operator", fullName: "Automated Proof",
        primaryEmailAddress: { emailAddress: "proof@synthetic.invalid" },
        publicMetadata: operatorProfile,
      });
      const user = await getCurrentUser();
      expect(user).toMatchObject({
        clerkUserId: "user_fixture_operator", syntheticE2eOperator: true,
        syntheticE2eApprovalRef: "private-approval-reference",
        primaryRole: "client_viewer", metadataClientKey: "meridian",
        syntheticE2eAuthority: {
          source: "authenticated_clerk_profile", clerkUserId: "user_fixture_operator",
          email: "proof@synthetic.invalid", approvalRef: "private-approval-reference",
        },
      });
      expect(clerkCurrentUserMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { ...operatorProfile, programScope: "all_client_programs" },
    { ...operatorProfile, moduleAccess: ["programs", "source"] },
    { ...operatorProfile, programCapabilities: { ...operatorProfile.programCapabilities, canAdminUsers: true } },
  ])("refuses a malformed authoritative dedicated profile %p", async (publicMetadata) => {
    authMock.mockResolvedValue({ userId: "user_fixture_operator", sessionClaims: {} });
    clerkCurrentUserMock.mockResolvedValue({
      id: "user_fixture_operator", fullName: "Automated Proof",
      primaryEmailAddress: { emailAddress: "proof@synthetic.invalid" }, publicMetadata,
    });
    await expect(getCurrentUser()).rejects.toMatchObject({ code: "synthetic_profile_refused" });
    expect(getCurrentPersonMock).not.toHaveBeenCalled();
  });

  it("refuses a different authoritative actor instead of adopting its profile", async () => {
    authMock.mockResolvedValue({ userId: "user_fixture_operator", sessionClaims: {} });
    clerkCurrentUserMock.mockResolvedValue({
      id: "user_other_actor", fullName: "Automated Proof",
      primaryEmailAddress: { emailAddress: "proof@synthetic.invalid" }, publicMetadata: operatorProfile,
    });
    await expect(getCurrentUser()).rejects.toMatchObject({ code: "synthetic_profile_refused" });
  });

  it("does not use claims email as the dedicated actor's identity authority", async () => {
    authMock.mockResolvedValue({ userId: "user_fixture_operator", sessionClaims: {
      email: "other@synthetic.invalid", firstName: "Other", publicMetadata: operatorProfile,
    } });
    clerkCurrentUserMock.mockResolvedValue({
      id: "user_fixture_operator", fullName: "Automated Proof",
      primaryEmailAddress: { emailAddress: "proof@synthetic.invalid" }, publicMetadata: operatorProfile,
    });
    expect((await getCurrentUser())?.email).toBe("proof@synthetic.invalid");
  });

  it("keeps an unreadable authoritative profile unavailable", async () => {
    authMock.mockResolvedValue({ userId: "user_fixture_operator", sessionClaims: {} });
    clerkCurrentUserMock.mockRejectedValue(new Error("profile service unavailable"));
    await expect(getCurrentUser()).rejects.toMatchObject({ code: "profile_unavailable" });
  });

  it("keeps a claimed or email-resolved person outside dedicated identity authority", async () => {
    authMock.mockResolvedValue({ userId: "user_fixture_operator", sessionClaims: {
      publicMetadata: { person_id: "00000000-0000-4000-8000-000000000999" },
    } });
    clerkCurrentUserMock.mockResolvedValue({ id: "user_fixture_operator", fullName: "Automated Proof",
      primaryEmailAddress: { emailAddress: "proof@synthetic.invalid" }, publicMetadata: operatorProfile });
    getCurrentPersonMock.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000999", role: "maestro" });
    expect(await getCurrentUser()).toMatchObject({ personId: null, accessibleClients: [], primaryRole: "client_viewer" });
    expect(getCurrentPersonMock).not.toHaveBeenCalled();
    expect(getAzureReadFluentClientMock).not.toHaveBeenCalled();
  });

  it("does not retain a dedicated claim after the authoritative profile withdraws it", async () => {
    authMock.mockResolvedValue({ userId: "user_fixture_operator", sessionClaims: { publicMetadata: operatorProfile } });
    clerkCurrentUserMock.mockResolvedValue({ id: "user_fixture_operator", publicMetadata: {},
      primaryEmailAddress: { emailAddress: "proof@synthetic.invalid" } });
    await expect(getCurrentUser()).rejects.toMatchObject({ code: "synthetic_profile_refused" });
  });

  it("keeps a valid dedicated profile denied when the operator flag is off", async () => {
    mockOperatorFlag.enabled = false;
    authMock.mockResolvedValue({ userId: "user_fixture_operator", sessionClaims: {} });
    clerkCurrentUserMock.mockResolvedValue({ id: "user_fixture_operator", publicMetadata: operatorProfile,
      primaryEmailAddress: { emailAddress: "proof@synthetic.invalid" } });
    await expect(getCurrentUser()).rejects.toMatchObject({ code: "synthetic_profile_refused" });
    expect(getCurrentPersonMock).not.toHaveBeenCalled();
  });

  it("uses the authenticated Clerk profile name when JWT name claims are absent", async () => {
    authMock.mockResolvedValue({
      userId: "user_prod_qa",
      sessionClaims: {
        email: "prod-qa@abarva.example.com",
        publicMetadata: {
          clientId: "example-tenant",
          role: "admin",
        },
      },
    });
    clerkCurrentUserMock.mockResolvedValue({
      fullName: "AbarVa Prod QA",
      firstName: "AbarVa Prod",
      lastName: "QA",
      primaryEmailAddress: {
        emailAddress: "prod-qa@abarva.example.com",
      },
      emailAddresses: [],
      publicMetadata: {},
    });

    const user = await getCurrentUser();

    expect(user).toMatchObject({
      personId: null,
      clerkUserId: "user_prod_qa",
      name: "AbarVa Prod QA",
      email: "prod-qa@abarva.example.com",
      primaryRole: "maestro",
    });
    expect(clerkCurrentUserMock).toHaveBeenCalledTimes(1);
  });

  it("does not let a stored placeholder name override the authenticated Clerk profile", async () => {
    authMock.mockResolvedValue({
      userId: "user_prod_qa",
      sessionClaims: {
        email: "prod-qa@abarva.example.com",
        publicMetadata: {
          clientId: "example-tenant",
          person_id: "00000000-0000-4000-8000-000000000111",
          role: "admin",
        },
      },
    });
    clerkCurrentUserMock.mockResolvedValue({
      fullName: "AbarVa Prod QA",
      firstName: "AbarVa Prod",
      lastName: "QA",
      primaryEmailAddress: {
        emailAddress: "prod-qa@abarva.example.com",
      },
      emailAddresses: [],
      publicMetadata: {},
    });
    getAzureReadFluentClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === "persons") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "00000000-0000-4000-8000-000000000111",
                    name: "User",
                    email: "prod-qa@abarva.example.com",
                    primary_role: "maestro",
                  },
                }),
              }),
            }),
          };
        }
        if (table === "clients") {
          return {
            select: () => ({
              order: async () => ({ data: [] }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });

    const user = await getCurrentUser();

    expect(user).toMatchObject({
      personId: "00000000-0000-4000-8000-000000000111",
      name: "AbarVa Prod QA",
      email: "prod-qa@abarva.example.com",
    });
  });

  it("keeps a valid stored person name authoritative", async () => {
    authMock.mockResolvedValue({
      userId: "user_prod_qa",
      sessionClaims: {
        email: "prod-qa@abarva.example.com",
        publicMetadata: {
          clientId: "example-tenant",
          person_id: "00000000-0000-4000-8000-000000000111",
          role: "admin",
        },
      },
    });
    clerkCurrentUserMock.mockResolvedValue({
      fullName: "AbarVa Prod QA",
      firstName: "AbarVa Prod",
      lastName: "QA",
      primaryEmailAddress: {
        emailAddress: "prod-qa@abarva.example.com",
      },
      emailAddresses: [],
      publicMetadata: {},
    });
    getAzureReadFluentClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === "persons") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "00000000-0000-4000-8000-000000000111",
                    name: "Named Reviewer",
                    email: "prod-qa@abarva.example.com",
                    primary_role: "maestro",
                  },
                }),
              }),
            }),
          };
        }
        if (table === "clients") {
          return {
            select: () => ({
              order: async () => ({ data: [] }),
            }),
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    });

    const user = await getCurrentUser();

    expect(user?.name).toBe("Named Reviewer");
  });
});
