/**
 * /api/v1/atlas tenancy boundary — behavioural.
 *
 * This suite used to assert the boundary by reading `_auth.ts` as text and
 * grepping it for `requestedClientId !== tenancy.clientKey` and
 * `throw new TenancyError('no_client')`. Two things were wrong with that.
 * It failed on current `main` only because the source had been reformatted to
 * double quotes while the control itself was intact, and — the reason it is
 * rewritten rather than requoted — a text match cannot tell a live guard from
 * the same words in a comment. That is the exact gate shape this backlog
 * exists to remove.
 *
 * Every case below calls `requireAtlasTenancy` and asserts what it does.
 */

import { requireTenancy } from "@/lib/auth/tenancy";

import { TenancyError } from "@/app/api/v1/_intel-auth";

import { requireAtlasTenancy } from "../_auth";

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(),
}));

const requireTenancyMock = requireTenancy as jest.MockedFunction<
  typeof requireTenancy
>;

const ACTIVE = {
  clientId: "client-meridian",
  clientKey: "meridian",
  userId: "00000000-0000-4000-8000-000000000001",
};

describe("/api/v1/atlas tenancy boundary", () => {
  beforeEach(() => {
    requireTenancyMock.mockReset();
    requireTenancyMock.mockResolvedValue({ ...ACTIVE });
  });

  it("refuses a clientId the caller's active tenant does not own", async () => {
    await expect(requireAtlasTenancy("client-apex")).rejects.toMatchObject({
      code: "no_client",
    });
    await expect(requireAtlasTenancy("client-apex")).rejects.toBeInstanceOf(
      TenancyError,
    );
  });

  it("refuses a tenant key the caller's active tenant does not own", async () => {
    await expect(requireAtlasTenancy("apexretail")).rejects.toMatchObject({
      code: "no_client",
    });
  });

  it("accepts the active tenant's own id and returns that tenant, not the request's", async () => {
    await expect(requireAtlasTenancy("client-meridian")).resolves.toEqual({
      clientId: "client-meridian",
      clientKey: "meridian",
      userId: ACTIVE.userId,
    });
  });

  it("accepts the active tenant's own key", async () => {
    await expect(requireAtlasTenancy("meridian")).resolves.toEqual({
      clientId: "client-meridian",
      clientKey: "meridian",
      userId: ACTIVE.userId,
    });
  });

  it("resolves the active tenant when the caller names none", async () => {
    await expect(requireAtlasTenancy(null)).resolves.toMatchObject({
      clientId: "client-meridian",
    });
    await expect(requireAtlasTenancy("   ")).resolves.toMatchObject({
      clientId: "client-meridian",
    });
  });

  it("never lets the caller's string reach the returned tenancy", async () => {
    const ctx = await requireAtlasTenancy("meridian");

    expect(ctx.clientId).toBe(ACTIVE.clientId);
    expect(ctx.clientId).not.toBe("meridian");
  });

  it("surfaces an unauthenticated session as a tenancy refusal, not a 500", async () => {
    requireTenancyMock.mockRejectedValue(new Error("unauthenticated"));

    await expect(requireAtlasTenancy(null)).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });

  it("surfaces a missing active client as a tenancy refusal", async () => {
    requireTenancyMock.mockRejectedValue(new Error("no_client"));

    await expect(requireAtlasTenancy(null)).rejects.toMatchObject({
      code: "no_client",
    });
  });
});
