import { resolvePhaseGateActorPersonId } from "../phase-gate-actor";

describe("resolvePhaseGateActorPersonId", () => {
  it("uses an existing UUID persons id without lookup", async () => {
    const lookup = jest.fn();

    await expect(
      resolvePhaseGateActorPersonId(
        {
          clientId: "client-skyharbor",
          clientKey: "skyharbor",
          userId: "00000000-0000-4000-8000-000000000001",
          email: "anand.sundaram+skyharbor@thesundaram.com",
        },
        { lookup },
      ),
    ).resolves.toEqual({
      ok: true,
      personId: "00000000-0000-4000-8000-000000000001",
    });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("resolves Clerk-only sessions through a tenant-scoped persons row", async () => {
    const lookup = jest
      .fn()
      .mockResolvedValue("00000000-0000-4000-8000-00000000c700");

    await expect(
      resolvePhaseGateActorPersonId(
        {
          clientId: "client-skyharbor",
          clientKey: "skyharbor",
          userId: "clerk:user_123",
          email: "ANAND.SUNDARAM+SKYHARBOR@THESUNDARAM.COM",
        },
        { lookup },
      ),
    ).resolves.toEqual({
      ok: true,
      personId: "00000000-0000-4000-8000-00000000c700",
    });
    expect(lookup).toHaveBeenCalledWith(
      "anand.sundaram+skyharbor@thesundaram.com",
      "client-skyharbor",
    );
  });

  it("returns a setup error instead of letting UUID-backed writes 500", async () => {
    await expect(
      resolvePhaseGateActorPersonId(
        {
          clientId: "client-skyharbor",
          clientKey: "skyharbor",
          userId: "clerk:user_123",
          email: "anand.sundaram+skyharbor@thesundaram.com",
        },
        { lookup: jest.fn().mockResolvedValue(null) },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: "person_row_required",
    });
  });
});
