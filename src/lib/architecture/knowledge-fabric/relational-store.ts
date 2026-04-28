import {
  KnowledgeFabricWriteOptions,
  KnowledgeFabricWriteResult,
  createKnowledgeFabricWriteResult,
  resolveKnowledgeFabricWriteMode,
} from "./feature-flag";

export type RelationalKnowledgeRecord = {
  id: string;
  entityType: string;
  fields: Record<string, unknown>;
  sourceId?: string;
  updatedAt: string;
};

export type RelationalKnowledgeRecordInput = {
  id: string;
  entityType: string;
  fields?: Record<string, unknown>;
  sourceId?: string;
};

export class RelationalKnowledgeStore {
  private readonly records = new Map<string, RelationalKnowledgeRecord>();
  private readonly writesEnabled?: boolean;

  constructor(options: KnowledgeFabricWriteOptions = {}) {
    this.writesEnabled = options.writesEnabled;
  }

  upsertEntity(
    input: RelationalKnowledgeRecordInput,
    options: KnowledgeFabricWriteOptions = {},
  ): KnowledgeFabricWriteResult<RelationalKnowledgeRecord> {
    const mode = resolveKnowledgeFabricWriteMode({
      writesEnabled: options.writesEnabled ?? this.writesEnabled,
    });
    const record: RelationalKnowledgeRecord = {
      id: input.id,
      entityType: input.entityType,
      fields: input.fields ?? {},
      sourceId: input.sourceId,
      updatedAt: new Date().toISOString(),
    };

    if (mode.writesEnabled) {
      this.records.set(record.id, record);
    }

    return createKnowledgeFabricWriteResult({
      store: "relational",
      operation: "upsertEntity",
      id: record.id,
      mode,
      record,
      timestamp: record.updatedAt,
    });
  }

  getEntity(id: string): RelationalKnowledgeRecord | undefined {
    return this.records.get(id);
  }

  listEntities(): RelationalKnowledgeRecord[] {
    return Array.from(this.records.values());
  }

  count(): number {
    return this.records.size;
  }
}
