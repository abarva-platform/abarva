import { syncEventIntakeEvidence } from "../event-intake-sync";

function fakeDb(existing: Record<string, unknown> | null) {
  const writes: Array<{ op: string; payload: Record<string, unknown> }> = [];
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.maybeSingle = async () => ({ data: existing, error: null });
  builder.update = (payload: Record<string, unknown>) => {
    writes.push({ op: "update", payload });
    return builder;
  };
  builder.insert = (payload: Record<string, unknown>) => {
    writes.push({ op: "insert", payload });
    return Promise.resolve({ error: null });
  };
  builder.then = (
    resolve: (result: { error: null }) => unknown,
  ): Promise<unknown> => Promise.resolve({ error: null }).then(resolve);
  return {
    db: { from: () => builder } as never,
    writes,
  };
}

describe("syncEventIntakeEvidence", () => {
  const input = {
    sourceEventId: "event-1",
    tenantKey: "client-a",
    triggerDescription: "A renewal and service-quality trigger was captured.",
  };

  it("upgrades a scaffolded trigger to client-stated Available", async () => {
    const { db, writes } = fakeDb({ current_state: "Not Requested" });
    await expect(syncEventIntakeEvidence(input, db)).resolves.toBe(true);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toEqual(
      expect.objectContaining({
        op: "update",
        payload: expect.objectContaining({ current_state: "Available" }),
      }),
    );
  });

  it("does not create evidence when the event trigger is empty", async () => {
    const { db, writes } = fakeDb(null);
    await expect(
      syncEventIntakeEvidence({ ...input, triggerDescription: "  " }, db),
    ).resolves.toBe(false);
    expect(writes).toHaveLength(0);
  });

  it("never downgrades stronger reviewed evidence", async () => {
    const { db, writes } = fakeDb({ current_state: "Usable Evidence" });
    await expect(syncEventIntakeEvidence(input, db)).resolves.toBe(false);
    expect(writes).toHaveLength(0);
  });

  it("inserts the canonical Strategy requirement when the row is absent", async () => {
    const { db, writes } = fakeDb(null);
    await expect(syncEventIntakeEvidence(input, db)).resolves.toBe(true);
    expect(writes[0]).toEqual(
      expect.objectContaining({
        op: "insert",
        payload: expect.objectContaining({
          requirement_id: "EVID-SRC-STR-TRIGGER",
          stage_key: "strategy",
          current_state: "Available",
          source_artifact_id: null,
        }),
      }),
    );
  });
});
