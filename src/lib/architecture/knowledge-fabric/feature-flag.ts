export const KNOWLEDGE_FABRIC_WRITES_ENABLED_ENV = "KNOWLEDGE_FABRIC_WRITES_ENABLED";
export const KNOWLEDGE_FABRIC_WRITES_ENABLED_DEFAULT = false;

export type KnowledgeFabricWriteOptions = {
  writesEnabled?: boolean;
};

export type KnowledgeFabricWriteMode = {
  writesEnabled: boolean;
  dryRun: boolean;
  reason: string;
};

export type KnowledgeFabricWriteResult<TRecord = unknown> = {
  store: "relational" | "vector" | "graph" | "object" | "evidence-ledger";
  operation: string;
  id: string;
  dryRun: boolean;
  written: boolean;
  record?: TRecord;
  reason: string;
  timestamp: string;
};

const truthyFlagValues = new Set(["1", "true", "yes", "on", "enabled"]);

export function areKnowledgeFabricWritesEnabled(
  value: string | boolean | undefined = process.env[KNOWLEDGE_FABRIC_WRITES_ENABLED_ENV],
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return KNOWLEDGE_FABRIC_WRITES_ENABLED_DEFAULT;
  }

  return truthyFlagValues.has(value.trim().toLowerCase());
}

export function resolveKnowledgeFabricWriteMode(
  options: KnowledgeFabricWriteOptions = {},
): KnowledgeFabricWriteMode {
  const writesEnabled =
    typeof options.writesEnabled === "boolean"
      ? options.writesEnabled
      : areKnowledgeFabricWritesEnabled();

  return {
    writesEnabled,
    dryRun: !writesEnabled,
    reason: writesEnabled
      ? "KNOWLEDGE_FABRIC_WRITES_ENABLED enabled writes"
      : "KNOWLEDGE_FABRIC_WRITES_ENABLED false; returning dry-run write result",
  };
}

export function createKnowledgeFabricWriteResult<TRecord>(params: {
  store: KnowledgeFabricWriteResult<TRecord>["store"];
  operation: string;
  id: string;
  mode: KnowledgeFabricWriteMode;
  record?: TRecord;
  timestamp?: string;
}): KnowledgeFabricWriteResult<TRecord> {
  return {
    store: params.store,
    operation: params.operation,
    id: params.id,
    dryRun: params.mode.dryRun,
    written: params.mode.writesEnabled,
    record: params.mode.writesEnabled ? params.record : undefined,
    reason: params.mode.reason,
    timestamp: params.timestamp ?? new Date().toISOString(),
  };
}
