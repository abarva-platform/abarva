import { loadJsonlGraphEdges } from "../jsonl-graph-loader";

function createGraphDbMock() {
  const upserts: unknown[] = [];
  return {
    upserts,
    db: {
      from(table: string) {
        if (table === "enterprise_context_records") {
          return {
            select() {
              return {
                eq() {
                  return {
                    eq() {
                      return {
                        limit() {
                          return Promise.resolve({
                            data: [
                              {
                                id: "record-app-1",
                                canonical_record_id: "app:1",
                                source_record_id: "source:LAK-APP-001",
                                payload: { app_id: "LAK-APP-001" },
                              },
                              {
                                id: "record-app-2",
                                canonical_record_id: "app:2",
                                source_record_id: "source:LAK-APP-002",
                                payload: { app_id: "LAK-APP-002" },
                              },
                            ],
                            error: null,
                          });
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }

        if (table === "enterprise_context_relationships") {
          return {
            upsert(payload: unknown) {
              upserts.push(payload);
              return {
                select() {
                  return Promise.resolve({
                    data: [{ id: "relationship-row" }],
                    error: null,
                  });
                },
              };
            },
          };
        }

        throw new Error(`unexpected table:${table}`);
      },
    },
  };
}

describe("jsonl graph loader", () => {
  it("loads legacy relationship graph rows", async () => {
    const { db, upserts } = createGraphDbMock();

    const result = await loadJsonlGraphEdges({
      tenantKey: "lakeshore-holdings",
      db: db as never,
      jsonlText: JSON.stringify({
        relationship_key: "REL-001",
        relationship_type: "depends_on",
        from_record_key: "LAK-APP-001",
        to_record_key: "LAK-APP-002",
      }),
    });

    expect(result).toEqual({
      edgesWritten: 1,
      edgesByType: { depends_on: 1 },
      fkResolutionErrors: 0,
    });
    expect(upserts).toEqual([
      expect.objectContaining({
        tenant_key: "lakeshore-holdings",
        relationship_key: "REL-001",
        relationship_type: "depends_on",
        from_record_id: "record-app-1",
        to_record_id: "record-app-2",
        from_external_id: "LAK-APP-001",
        to_external_id: "LAK-APP-002",
      }),
    ]);
  });

  it("loads v4 relationship graph rows", async () => {
    const { db, upserts } = createGraphDbMock();

    const result = await loadJsonlGraphEdges({
      tenantKey: "lakeshore-holdings",
      db: db as never,
      jsonlText: JSON.stringify({
        edge_id: "LAKESHORE-EDGE-00001",
        from: "LAK-APP-001",
        to: "LAK-APP-002",
        type: "supports",
        relationship: "supports",
        domain: "medium",
        confidence: 0.76,
        evidence: "lakeshore-EVID-0001",
      }),
    });

    expect(result).toEqual({
      edgesWritten: 1,
      edgesByType: { supports: 1 },
      fkResolutionErrors: 0,
    });
    expect(upserts).toEqual([
      expect.objectContaining({
        tenant_key: "lakeshore-holdings",
        relationship_key: "LAKESHORE-EDGE-00001",
        relationship_type: "supports",
        from_record_id: "record-app-1",
        to_record_id: "record-app-2",
        from_external_id: "LAK-APP-001",
        to_external_id: "LAK-APP-002",
        source_file: "context-relationships.jsonl",
        properties: {
          domain: "medium",
          confidence: 0.76,
          evidence: "lakeshore-EVID-0001",
        },
      }),
    ]);
  });
});
