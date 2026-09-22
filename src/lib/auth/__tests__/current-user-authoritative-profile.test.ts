const authMock = jest.fn();
const clerkCurrentUserMock = jest.fn();
const cookiesMock = jest.fn();
const getCurrentPersonMock = jest.fn();

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
  getAzureReadFluentClient: jest.fn(() => {
    throw new Error("The no-person test path must not query the data plane.");
  }),
}));

import { getCurrentUser } from "@/lib/auth/current-user";

beforeEach(() => {
  authMock.mockReset();
  clerkCurrentUserMock.mockReset();
  cookiesMock.mockReset().mockResolvedValue({
    get: jest.fn(() => undefined),
  });
  getCurrentPersonMock.mockReset().mockResolvedValue(null);
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
});
