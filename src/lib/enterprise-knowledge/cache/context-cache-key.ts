import type {
  ContextPackMode,
  KnowledgeModuleKey,
  ModuleContextRequest,
  RequestedKnowledgeDomain,
} from "../contracts";

export interface ContextCacheKey {
  tenantKey: string;
  cacheScope: string;
  moduleKey?: KnowledgeModuleKey;
  mode: ContextPackMode;
  purpose?: ModuleContextRequest["purpose"];
  requestedDomains: RequestedKnowledgeDomain[];
  sourceVersion: string;
  contextVersion: string;
  depth?: number;
  entityType?: string;
  entityName?: string;
}

export function buildContextCacheKey(key: ContextCacheKey): string {
  return [
    key.tenantKey,
    key.cacheScope,
    key.moduleKey ?? "shared",
    key.mode,
    key.purpose ?? "any",
    key.requestedDomains.slice().sort().join("+"),
    key.sourceVersion,
    key.contextVersion,
    key.depth ?? "d0",
    key.entityType ?? "any",
    key.entityName ? slug(key.entityName) : "any",
  ].join("::");
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
