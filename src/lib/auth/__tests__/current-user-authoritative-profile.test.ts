const authMock = jest.fn();
const clerkCurrentUserMock = jest.fn();
const cookiesMock = jest.fn();
const getCurrentPersonMock = jest.fn();
const getAzureReadFluentClientMock = jest.fn();

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
