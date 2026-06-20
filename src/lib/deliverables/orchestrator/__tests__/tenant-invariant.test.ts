import { validateDeliverableTenantInvariant } from "../tenant-invariant";

function fakeDb(row: Record<string, unknown> | null) {
  const cap: { table?: string; filters: Array<[string, unknown]> } = { filters: [] };
  const builder: Record<string, unknown> = {};
  builder.from = (table: string) => {
    cap.table = table;
    return builder;
  };
  builder.select = () => builder;
  builder.eq = (key: string, value: unknown) => {
    cap.filters.push([key, value]);
    return builder;
  };
  builder.maybeSingle = async () => ({ data: row, error: null });
  return { db: builder as never, cap };
}

describe("validateDeliverableTenantInvariant", () => {
  it("passes when a Move belongs to the active client and tenant alias family", async () => {
    const { db, cap } = fakeDb({
      id: "move-1",
      client_id: "client-fc",
      tenant_key: "firstcapital",
    });

    const result = await validateDeliverableTenantInvariant(
      {
        module: "moves",
        sourceArtifactRef: "move:move-1:charter",
        clientId: "client-fc",
        tenantKey: "arcturus",
      },
      db,
    );

    expect(result).toMatchObject({ ok: true, sourceKind: "move", sourceId: "move-1" });
    expect(cap.table).toBe("engagements");
    expect(cap.filters).toContainEqual(["graph_node_id", "move-1"]);
  });

  it("resolves UUID Move references against engagements.id", async () => {
    const moveId = "11111111-1111-4111-8111-111111111111";
    const { db, cap } = fakeDb({
      id: moveId,
      graph_node_id: "move-graph-1",
      client_id: "client-fc",
      tenant_key: "first-capital",
    });

    const result = await validateDeliverableTenantInvariant(
      {
        module: "moves",
        sourceArtifactRef: `move:${moveId}:charter`,
        clientId: "client-fc",
        tenantKey: "arcturus",
      },
      db,
    );

    expect(result).toMatchObject({ ok: true, sourceKind: "move", sourceId: moveId });
    expect(cap.filters).toContainEqual(["id", moveId]);
  });

  it("blocks a Move owned by another client before generation can retrieve evidence", async () => {
    const { db } = fakeDb({
      id: "move-fc",
      client_id: "client-first-capital",
      tenant_key: "arcturus",
    });

    const result = await validateDeliverableTenantInvariant(
      {
        module: "moves",
        sourceArtifactRef: "move-fc",
        clientId: "client-lakeshore",
        tenantKey: "lakeshore",
      },
      db,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "tenant_mismatch",
      sourceKind: "move",
      sourceId: "move-fc",
      expectedTenantKey: "lakeshore-holdings",
      actualTenantKey: "first-capital",
      actualClientId: "client-first-capital",
    });
  });

  it("fails closed when a Move source ref does not resolve", async () => {
    const { db } = fakeDb(null);
    const result = await validateDeliverableTenantInvariant(
      {
        module: "moves",
        sourceArtifactRef: "missing-move",
        clientId: "client-1",
        tenantKey: "skyharbor",
      },
      db,
    );

    expect(result).toMatchObject({
      ok: false,
      code: "source_not_found",
      sourceId: "missing-move",
      expectedTenantKey: "skyharbor-air",
    });
  });

  it("checks Source events against the tenant key when source module is used", async () => {
    const { db, cap } = fakeDb({ id: "evt-1", client_key: "skyharbor" });
    const result = await validateDeliverableTenantInvariant(
      {
        module: "source",
        sourceArtifactRef: "source:evt-1",
        clientId: "client-1",
        tenantKey: "skyharbor-air",
      },
      db,
    );

    expect(result).toMatchObject({ ok: true, sourceKind: "source_event", sourceId: "evt-1" });
    expect(cap.table).toBe("source_events");
    expect(cap.filters).toContainEqual(["event_code", "evt-1"]);
  });

  it("resolves UUID Source event references against source_events.id", async () => {
    const sourceEventId = "22222222-2222-4222-8222-222222222222";
    const { db, cap } = fakeDb({ id: sourceEventId, event_code: "SRC-SKY-1", client_key: "skyharbor-air" });
    const result = await validateDeliverableTenantInvariant(
      {
        module: "source",
        sourceArtifactRef: `source:${sourceEventId}`,
        clientId: "client-1",
        tenantKey: "skyharbor",
      },
      db,
    );

    expect(result).toMatchObject({ ok: true, sourceKind: "source_event", sourceId: sourceEventId });
    expect(cap.filters).toContainEqual(["id", sourceEventId]);
  });
});
