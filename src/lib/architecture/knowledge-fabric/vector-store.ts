import {
  KnowledgeFabricWriteOptions,
  KnowledgeFabricWriteResult,
  createKnowledgeFabricWriteResult,
  resolveKnowledgeFabricWriteMode,
} from "./feature-flag";

export type VectorKnowledgeRecord = {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  updatedAt: string;
};

export type VectorKnowledgeRecordInput = {
  id: string;
  text: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
};

export class VectorKnowledgeStore {
  private readonly records = new Map<string, VectorKnowledgeRecord>();
  private readonly writesEnabled?: boolean;

  constructor(options: KnowledgeFabricWriteOptions = {}) {
    this.writesEnabled = options.writesEnabled;
  }

  upsertVector(
    input: VectorKnowledgeRecordInput,
    options: KnowledgeFabricWriteOptions = {},
  ): KnowledgeFabricWriteResult<VectorKnowledgeRecord> {
    const mode = resolveKnowledgeFabricWriteMode({
      writesEnabled: options.writesEnabled ?? this.writesEnabled,
    });
    const record: VectorKnowledgeRecord = {
      id: input.id,
      text: input.text,
      embedding: input.embedding ?? deterministicEmbedding(input.text),
      metadata: input.metadata ?? {},
      updatedAt: new Date().toISOString(),
    };

    if (mode.writesEnabled) {
      this.records.set(record.id, record);
    }

    return createKnowledgeFabricWriteResult({
      store: "vector",
      operation: "upsertVector",
      id: record.id,
      mode,
      record,
      timestamp: record.updatedAt,
    });
  }

  getVector(id: string): VectorKnowledgeRecord | undefined {
    return this.records.get(id);
  }

  listVectors(): VectorKnowledgeRecord[] {
    return Array.from(this.records.values());
  }

  count(): number {
    return this.records.size;
  }
}

export function deterministicEmbedding(text: string, dimensions = 8): number[] {
  const vector = Array.from({ length: dimensions }, () => 0);

  for (let index = 0; index < text.length; index += 1) {
    vector[index % dimensions] += text.charCodeAt(index) / 1000;
  }

  return vector.map((value) => Number(value.toFixed(6)));
}
