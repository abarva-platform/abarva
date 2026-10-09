import { tenancyOrNamedErrorResponse } from "../tenancy-catch-response";

class FakeTenancyError extends Error {}

/** Stands in for the real helper: answers its own errors, re-throws the rest. */
function respond(err: unknown): Response {
  if (err instanceof FakeTenancyError) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  throw err;
}

describe("tenancyOrNamedErrorResponse", () => {
  it("returns the tenancy answer untouched when there is one", async () => {
    const res = tenancyOrNamedErrorResponse(
      new FakeTenancyError("nope"),
      respond,
      { code: "named", detail: "A sentence a reader can act on." },
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthenticated" });
  });

  it("answers the named refusal when the responder re-throws", async () => {
    const res = tenancyOrNamedErrorResponse(
      new Error("insert failed"),
      respond,
      {
        code: "write_unconfirmed",
        detail: "A sentence a reader can act on.",
      },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "write_unconfirmed",
      detail: "A sentence a reader can act on.",
    });
  });

  it("does not let the re-thrown error escape the catch", () => {
    // This is the whole defect: the bare `return tenancyErrorResponse(err)`
    // throws a SECOND time from inside the route's catch, the handler rejects,
    // and the framework answers with no body for a client to render.
    expect(() =>
      tenancyOrNamedErrorResponse(new Error("boom"), respond, {
        code: "named",
        detail: "A sentence a reader can act on.",
      }),
    ).not.toThrow();
    expect(() => respond(new Error("boom"))).toThrow("boom");
  });

  it("honours a caller's status when the failure is not a server fault", async () => {
    const res = tenancyOrNamedErrorResponse(new Error("boom"), respond, {
      code: "conflict",
      detail: "A sentence a reader can act on.",
      status: 409,
    });

    expect(res.status).toBe(409);
  });

  it("defaults to 500 for an unhandled failure", () => {
    const res = tenancyOrNamedErrorResponse(new Error("boom"), respond, {
      code: "named",
      detail: "A sentence a reader can act on.",
    });

    expect(res.status).toBe(500);
  });

  it("answers a thrown non-Error the same way", async () => {
    const res = tenancyOrNamedErrorResponse("just a string", respond, {
      code: "named",
      detail: "A sentence a reader can act on.",
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ error: "named" });
  });
});
