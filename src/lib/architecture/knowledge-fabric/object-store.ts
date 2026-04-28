import {
  KnowledgeFabricWriteOptions,
  KnowledgeFabricWriteResult,
  createKnowledgeFabricWriteResult,
  resolveKnowledgeFabricWriteMode,
} from "./feature-flag";

export type ObjectKnowledgeRecord = {
  id: string;
  contentType: string;
  body: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

export type ObjectKnowledgeRecordInput = {
  id: string;
  contentType?: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export class ObjectKnowledgeStore {
  private readonly records = new Map<string, ObjectKnowledgeRecord>();
  private readonly writesEnabled?: boolean;

  constructor(options: KnowledgeFabricWriteOptions = {}) {
    this.writesEnabled = options.writesEnabled;
  }

  putObject(
    input: ObjectKnowledgeRecordInput,
    options: KnowledgeFabricWriteOptions = {},
  ): KnowledgeFabricWriteResult<ObjectKnowledgeRecord> {
    const mode = resolveKnowledgeFabricWriteMode({
      writesEnabled: options.writesEnabled ?? this.writesEnabled,
    });
    const record: ObjectKnowledgeRecord = {
      id: input.id,
      contentType: input.contentType ?? "application/json",
      body: input.body,
      metadata: input.metadata ?? {},
      updatedAt: new Date().toISOString(),
    };

    if (mode.writesEnabled) {
      this.records.set(record.id, record);
    }

    return createKnowledgeFabricWriteResult({
      store: "object",
      operation: "putObject",
      id: record.id,
      mode,
      record,
      timestamp: record.updatedAt,
    });
  }

  getObject(id: string): ObjectKnowledgeRecord | undefined {
    return this.records.get(id);
  }

  listObjects(): ObjectKnowledgeRecord[] {
    return Array.from(this.records.values());
  }

  count(): number {
    return this.records.size;
  }
}
