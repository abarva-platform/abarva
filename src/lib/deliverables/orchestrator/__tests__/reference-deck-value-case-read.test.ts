import { valueCaseRead } from "../reference-deck-value-case-read";

describe("reference deck value-case read states", () => {
  it("uses only the value route's named absent-model refusal as empty", async () => {
    const empty = Response.json({ ok: false, error: "value_model_absent" }, { status: 404 });
    expect(await valueCaseRead(Promise.resolve(empty), "synthetic-move")).toEqual({
      status: "empty", detail: "No value levers yet; add them in P4 Step 3.",
    });
  });

  it("keeps auth, other refusals and network exceptions as failed reads", async () => {
    const auth = Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    expect((await valueCaseRead(Promise.resolve(auth), "synthetic-move")).status).toBe("failed");
    const invalid = Response.json({ ok: false, error: "value_model_invalid" }, { status: 409 });
    expect((await valueCaseRead(Promise.resolve(invalid), "synthetic-move")).status).toBe("failed");
    expect((await valueCaseRead(Promise.reject(new Error("network")), "synthetic-move")).status).toBe("failed");
  });

  it("accepts only a successful response for the requested Move", async () => {
    const ready = Response.json({ ok: true, programId: "synthetic-move", case: {} });
    expect((await valueCaseRead(Promise.resolve(ready), "synthetic-move")).status).toBe("ready");
    const wrong = Response.json({ ok: true, programId: "another-move", case: {} });
    expect((await valueCaseRead(Promise.resolve(wrong), "synthetic-move")).status).toBe("failed");
  });
});
