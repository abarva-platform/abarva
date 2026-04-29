import {
  EvidenceLedger,
  GraphKnowledgeStore,
  ObjectKnowledgeStore,
  RelationalKnowledgeStore,
  VectorKnowledgeStore,
  areKnowledgeFabricWritesEnabled,
  createKnowledgeFabric,
} from "../../src/lib/architecture/knowledge-fabric";
import {
  KnowledgePrimitive,
  corpusToPrimitives,
  indexCorpus,
  indexPrimitives,
} from "../../src/lib/intelligence/indexer";

describe("knowledge fabric", () => {
  const originalFlag = process.env.KNOWLEDGE_FABRIC_WRITES_ENABLED;

  afterEach(() => {
    if (typeof originalFlag === "undefined") {
      delete process.env.KNOWLEDGE_FABRIC_WRITES_ENABLED;
    } else {
      process.env.KNOWLEDGE_FABRIC_WRITES_ENABLED = originalFlag;
    }
  });

  it("keeps writes disabled by default and returns no-op dry-run writes", () => {
    delete process.env.KNOWLEDGE_FABRIC_WRITES_ENABLED;
    const fabric = createKnowledgeFabric();

    const relational = fabric.relational.upsertEntity({
      id: "primitive-1",
      entityType: "pattern",
      fields: { title: "Flag off" },
    });
    const vector = fabric.vector.upsertVector({ id: "primitive-1:v", text: "Flag off" });
    const graph = fabric.graph.upsertNode({ id: "primitive-1", label: "pattern" });
    const object = fabric.object.putObject({ id: "primitive-1:o", body: "{}" });
    const ledger = fabric.ledger.append({ primitiveId: "primitive-1", eventType: "indexed" });

    expect(areKnowledgeFabricWritesEnabled()).toBe(false);
    expect([relational, vector, graph, object, ledger]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dryRun: true, written: false }),
      ]),
    );
    expect(fabric.relational.count()).toBe(0);
    expect(fabric.vector.count()).toBe(0);
    expect(fabric.graph.nodeCount()).toBe(0);
    expect(fabric.object.count()).toBe(0);
    expect(fabric.ledger.count()).toBe(0);
  });

  it("supports each store write API when writes are explicitly enabled", () => {
    const relational = new RelationalKnowledgeStore({ writesEnabled: true });
    const vector = new VectorKnowledgeStore({ writesEnabled: true });
    const graph = new GraphKnowledgeStore({ writesEnabled: true });
    const object = new ObjectKnowledgeStore({ writesEnabled: true });
    const ledger = new EvidenceLedger({ writesEnabled: true });

    expect(
      relational.upsertEntity({ id: "entity-1", entityType: "account", fields: { name: "Apex" } }),
    ).toEqual(expect.objectContaining({ dryRun: false, written: true }));
    expect(vector.upsertVector({ id: "vector-1", text: "Apex expansion signal" })).toEqual(
      expect.objectContaining({ dryRun: false, written: true }),
    );
    expect(graph.upsertNode({ id: "node-1", label: "Company" })).toEqual(
      expect.objectContaining({ dryRun: false, written: true }),
    );
    expect(
      graph.upsertEdge({ id: "edge-1", fromId: "node-1", toId: "entity-1", relationship: "EVIDENCES" }),
    ).toEqual(expect.objectContaining({ dryRun: false, written: true }));
    expect(object.putObject({ id: "object-1", body: JSON.stringify({ ok: true }) })).toEqual(
      expect.objectContaining({ dryRun: false, written: true }),
    );
    expect(ledger.append({ primitiveId: "entity-1", eventType: "indexed" })).toEqual(
      expect.objectContaining({ dryRun: false, written: true }),
    );

    expect(relational.getEntity("entity-1")?.fields.name).toBe("Apex");
    expect(vector.getVector("vector-1")?.embedding.length).toBeGreaterThan(0);
    expect(graph.getNode("node-1")?.label).toBe("Company");
    expect(graph.getEdge("edge-1")?.relationship).toBe("EVIDENCES");
    expect(object.getObject("object-1")?.contentType).toBe("application/json");
    expect(ledger.count()).toBe(1);
  });

  it("appends evidence ledger entries in immutable sequence order", () => {
    const ledger = new EvidenceLedger({ writesEnabled: true });

    const first = ledger.append({ primitiveId: "p-1", eventType: "observed" });
    const second = ledger.append({ primitiveId: "p-1", eventType: "indexed" });

    expect(first.record?.sequenceNumber).toBe(1);
    expect(second.record?.sequenceNumber).toBe(2);
    expect(ledger.entries().map((entry) => entry.eventType)).toEqual(["observed", "indexed"]);
  });

  it("dry-runs indexCorpus across 139 primitives without mutating stores", () => {
    delete process.env.KNOWLEDGE_FABRIC_WRITES_ENABLED;
    const primitives = corpusToPrimitives();
    const result = indexCorpus();

    expect(primitives).toHaveLength(139);
    expect(result).toEqual(
      expect.objectContaining({
        corpusSize: 139,
        dryRun: true,
        writesEnabled: false,
        attemptedWrites: 695,
        writtenWrites: 0,
      }),
    );
    expect(result.results).toHaveLength(695);
    expect(result.fabric.relational.count()).toBe(0);
    expect(result.fabric.vector.count()).toBe(0);
    expect(result.fabric.graph.nodeCount()).toBe(0);
    expect(result.fabric.object.count()).toBe(0);
    expect(result.fabric.ledger.count()).toBe(0);
  });

  it("keeps a lower-level primitive indexer for synthetic fixtures", () => {
    const corpus: KnowledgePrimitive[] = [
      {
        id: "primitive-1",
        kind: "pattern",
        title: "Synthetic primitive",
        content: "Synthetic primitive used to validate direct indexing.",
        sourceId: "kf-2-test-corpus",
      },
    ];

    const result = indexPrimitives(corpus);

    expect(result.corpusSize).toBe(1);
    expect(result.attemptedWrites).toBe(5);
    expect(result.writtenWrites).toBe(0);
  });
});
