import {
  classifyTenantScope,
  canonicalSemantic2TenantKey,
  type Semantic2RuntimeTenantKey,
} from "./dossiers";

export {
  SEMANTIC2_RUNTIME_TENANT_KEYS,
  type Semantic2RuntimeTenantKey,
} from "./dossiers";

export const SEMANTIC2_CROWN_JEWEL_PROMPT_VERSION =
  "semantic2-l3-enriched-buildtime-claude-v2";

export const SEMANTIC2_CROWN_JEWEL_TABLES = [
  "semantic2_source_rows",
  "semantic2_entities",
  "semantic2_facts",
  "semantic2_relationships",
  "semantic2_evidence_refs",
  "semantic2_metrics",
  "semantic2_question_contracts",
  "semantic2_dossiers",
] as const;

export const LEGACY_SEMANTIC_LAYER_TABLES = [
  "semantic_dimensions",
  "semantic_fields",
  "semantic_metrics",
  "semantic_join_paths",
  "semantic_question_templates",
  "semantic_query_plans",
  "semantic_query_results",
  "tenant_data_volumetrics",
  "tenant_dimension_coverage",
  "tenant_metric_coverage",
  "tenant_question_readiness",
] as const;

export type Semantic2RuntimeContractCode =
  | "noncanonical_tenant"
  | "legacy_semantic_layer"
  | "stale_dossier"
  | "missing_active_dossier";

export class Semantic2RuntimeContractError extends Error {
  constructor(
    message: string,
    public readonly code: Semantic2RuntimeContractCode,
    public readonly context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "Semantic2RuntimeContractError";
  }
}

export function normalizeSemantic2RuntimeTenantKey(
  value: string | null | undefined,
  context = "semantic2-runtime",
): Semantic2RuntimeTenantKey {
  const canonicalTenantKey = canonicalSemantic2TenantKey(value);
  const scope = classifyTenantScope(canonicalTenantKey);
  if (!scope.surfaceEligible) {
    throw new Semantic2RuntimeContractError(
      `${context} tenant "${String(value ?? "").trim() || "unknown"}" resolves to "${scope.canonicalTenantKey}" and is not eligible for runtime answers: ${scope.reason}`,
      "noncanonical_tenant",
      {
        context,
        inputTenantKey: value,
        canonicalTenantKey: scope.canonicalTenantKey,
        scopeType: scope.scopeType,
        reason: scope.reason,
      },
    );
  }
  return scope.canonicalTenantKey as Semantic2RuntimeTenantKey;
}

export function isLegacySemanticLayerTable(tableName: string): boolean {
  const normalized = tableName.trim().toLowerCase();
  if ((LEGACY_SEMANTIC_LAYER_TABLES as readonly string[]).includes(normalized)) {
    return true;
  }
  return /^semantic_(?!2)/.test(normalized);
}

export function assertNotLegacySemanticLayerTable(
  tableName: string,
  context = "semantic2-runtime",
): void {
  if (!isLegacySemanticLayerTable(tableName)) return;
  throw new Semantic2RuntimeContractError(
    `${context} attempted to read legacy semantic table "${tableName}". Use semantic2 dossier/readiness tables instead.`,
    "legacy_semantic_layer",
    { context, tableName },
  );
}

export function isSemantic2CrownJewelTable(tableName: string): boolean {
  return (SEMANTIC2_CROWN_JEWEL_TABLES as readonly string[]).includes(
    tableName.trim().toLowerCase(),
  );
}
