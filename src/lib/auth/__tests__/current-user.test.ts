const authMock = jest.fn();
const clerkCurrentUserMock = jest.fn();
const getCurrentPersonMock = jest.fn();
const getAzureReadFluentClientMock = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
  currentUser: () => clerkCurrentUserMock(),
}));

jest.mock("@/lib/auth/maestro", () => ({
  getCurrentPerson: () => getCurrentPersonMock(),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => getAzureReadFluentClientMock(),
}));

describe("getCurrentUser tenant membership mapping", () => {
  beforeEach(() => {
    jest.resetModules();
    authMock.mockReset();
    clerkCurrentUserMock.mockReset();
    getCurrentPersonMock.mockReset();
    getAzureReadFluentClientMock.mockReset();
  });

  it("keeps membership UUIDs while exposing tenant keys for access guards", async () => {
    authMock.mockResolvedValue({
      userId: "user_nina",
      sessionClaims: {
        publicMetadata: { person_id: "person-nina", role: "client" },
        email: "nina.patel@meridian-health.example.com",
      },
    });

    const sb = {
      from: jest.fn((table: string) => {
        if (table === "persons") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    id: "person-nina",
                    name: "Nina Patel",
                    email: "nina.patel@meridian-health.example.com",
                    primary_role: "client_viewer",
                  },
                }),
              })),
            })),
          };
        }

        if (table === "person_client_memberships") {
          return {
            select: jest.fn(() => ({
              eq: jest.fn().mockResolvedValue({
                data: [
                  {
                    role: "client_viewer",
                    client: {
                      id: "2b5b9e4a-3ee0-4a4a-8f17-2a2f8b919999",
                      name: "Meridian Health System",
                      tenant_key: "meridian-health",
                      slug: "meridian-health",
                    },
                  },
                ],
              }),
            })),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };
    getAzureReadFluentClientMock.mockReturnValue(sb);

    const { getCurrentUser, userCanAccessClient } = await import("../current-user");
    const user = await getCurrentUser();

    expect(user).toMatchObject({
      personId: "person-nina",
      defaultClientId: "meridian",
      accessibleClients: [
        {
          clientId: "2b5b9e4a-3ee0-4a4a-8f17-2a2f8b919999",
          clientKey: "meridian",
          name: "Meridian Health System",
          role: "client_viewer",
        },
      ],
    });
    expect(userCanAccessClient(user, "2b5b9e4a-3ee0-4a4a-8f17-2a2f8b919999")).toBe(true);
    expect(userCanAccessClient(user, "meridian")).toBe(true);
    expect(userCanAccessClient(user, "apexretail")).toBe(false);
  });

  it("normalizes Clerk metadata aliases for users without membership rows", async () => {
    authMock.mockResolvedValue({
      userId: "user_clerk_only",
      sessionClaims: {
        publicMetadata: { role: "client", clientId: "skyharbor-air" },
        email: "cto@skyharbor-air.example.com",
      },
    });
    getCurrentPersonMock.mockResolvedValue(null);

    const { getCurrentUser } = await import("../current-user");

    await expect(getCurrentUser()).resolves.toMatchObject({
      personId: null,
      clerkUserId: "user_clerk_only",
      metadataClientKey: "skyharbor",
      accessibleClients: [],
      defaultClientId: null,
    });
  });
});
