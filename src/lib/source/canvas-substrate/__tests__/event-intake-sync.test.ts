import { repairLegacyClientStatedTriggerEvidence } from "../event-intake-sync";

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

describe("repairLegacyClientStatedTriggerEvidence", () => {
  const input = {
    sourceEventId: "event-1",
    tenantKey: "client-a",
  };

  it("leaves the scaffolded trigger open when intake narrative exists", async () => {
    const { db, writes } = fakeDb({ current_state: "Not Requested" });
    await expect(repairLegacyClientStatedTriggerEvidence(input, db)).resolves.toBe(false);
    expect(writes).toHaveLength(0);
  });

  it("does not create evidence when the scaffold row is missing", async () => {
    const { db, writes } = fakeDb(null);
    await expect(repairLegacyClientStatedTriggerEvidence(input, db)).resolves.toBe(false);
    expect(writes).toHaveLength(0);
  });

  it("never downgrades stronger reviewed evidence", async () => {
    const { db, writes } = fakeDb({
      current_state: "Usable Evidence",
      source_artifact_id: "artifact-trigger-1",
    });
    await expect(repairLegacyClientStatedTriggerEvidence(input, db)).resolves.toBe(false);
    expect(writes).toHaveLength(0);
  });

  it("does not create evidence when only intake narrative is present", async () => {
    const { db, writes } = fakeDb(null);
    await expect(repairLegacyClientStatedTriggerEvidence(input, db)).resolves.toBe(false);
    expect(writes).toHaveLength(0);
  });

  it("repairs the legacy client-stated Available row back to open", async () => {
    const { db, writes } = fakeDb({
      current_state: "Available",
      source_artifact_id: null,
      notes:
        "Client-stated sourcing trigger captured in the governed event intake; explicit human review is required before a hard gate can clear.",
    });
    await expect(repairLegacyClientStatedTriggerEvidence(input, db)).resolves.toBe(true);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toEqual(
      expect.objectContaining({
        op: "update",
        payload: expect.objectContaining({
          current_state: "Not Requested",
          notes: expect.stringContaining("not record-backed evidence"),
        }),
      }),
    );
    expect(writes[0]?.payload).not.toHaveProperty("source_artifact_id");
  });

  it("preserves available evidence linked to an uploaded artifact", async () => {
    const { db, writes } = fakeDb({
      current_state: "Available",
      source_artifact_id: "artifact-trigger-1",
      notes: "Parsed trigger artifact reviewed by the sourcing lead.",
    });
    await expect(repairLegacyClientStatedTriggerEvidence(input, db)).resolves.toBe(false);
    expect(writes).toHaveLength(0);
  });
});
