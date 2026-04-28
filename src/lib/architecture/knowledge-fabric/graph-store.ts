import {
  KnowledgeFabricWriteOptions,
  KnowledgeFabricWriteResult,
  createKnowledgeFabricWriteResult,
  resolveKnowledgeFabricWriteMode,
} from "./feature-flag";

export type GraphKnowledgeNode = {
  id: string;
  label: string;
  properties: Record<string, unknown>;
  updatedAt: string;
};

export type GraphKnowledgeEdge = {
  id: string;
  fromId: string;
  toId: string;
  relationship: string;
  properties: Record<string, unknown>;
  updatedAt: string;
};

export type GraphKnowledgeNodeInput = {
  id: string;
  label: string;
  properties?: Record<string, unknown>;
};

export type GraphKnowledgeEdgeInput = {
  id: string;
  fromId: string;
  toId: string;
  relationship: string;
  properties?: Record<string, unknown>;
};

export class GraphKnowledgeStore {
  private readonly nodes = new Map<string, GraphKnowledgeNode>();
  private readonly edges = new Map<string, GraphKnowledgeEdge>();
  private readonly writesEnabled?: boolean;

  constructor(options: KnowledgeFabricWriteOptions = {}) {
    this.writesEnabled = options.writesEnabled;
  }

  upsertNode(
    input: GraphKnowledgeNodeInput,
    options: KnowledgeFabricWriteOptions = {},
  ): KnowledgeFabricWriteResult<GraphKnowledgeNode> {
    const mode = resolveKnowledgeFabricWriteMode({
      writesEnabled: options.writesEnabled ?? this.writesEnabled,
    });
    const record: GraphKnowledgeNode = {
      id: input.id,
      label: input.label,
      properties: input.properties ?? {},
      updatedAt: new Date().toISOString(),
    };

    if (mode.writesEnabled) {
      this.nodes.set(record.id, record);
    }

    return createKnowledgeFabricWriteResult({
      store: "graph",
      operation: "upsertNode",
      id: record.id,
      mode,
      record,
      timestamp: record.updatedAt,
    });
  }

  upsertEdge(
    input: GraphKnowledgeEdgeInput,
    options: KnowledgeFabricWriteOptions = {},
  ): KnowledgeFabricWriteResult<GraphKnowledgeEdge> {
    const mode = resolveKnowledgeFabricWriteMode({
      writesEnabled: options.writesEnabled ?? this.writesEnabled,
    });
    const record: GraphKnowledgeEdge = {
      id: input.id,
      fromId: input.fromId,
      toId: input.toId,
      relationship: input.relationship,
      properties: input.properties ?? {},
      updatedAt: new Date().toISOString(),
    };

    if (mode.writesEnabled) {
      this.edges.set(record.id, record);
    }

    return createKnowledgeFabricWriteResult({
      store: "graph",
      operation: "upsertEdge",
      id: record.id,
      mode,
      record,
      timestamp: record.updatedAt,
    });
  }

  getNode(id: string): GraphKnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): GraphKnowledgeEdge | undefined {
    return this.edges.get(id);
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edgeCount(): number {
    return this.edges.size;
  }
}
