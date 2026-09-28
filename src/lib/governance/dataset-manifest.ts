// =============================================================================
// Context & Corpus Governance — dataset onboarding manifest (PR-8, pure core)
// -----------------------------------------------------------------------------
// Every NEW context/corpus dataset must declare a manifest BEFORE it loads — no
// matter which agent (Codex or Claude Code) or operator runs the load. The
// manifest names the owner, tenant, classification, source basis, ingestion
// method, and retrieval plan up front, so a dataset can never be loaded "and
// governed later." CI (validate:context-corpus manifests) validates every
// manifest under docs/governance/dataset-manifests/. This module is the pure,
// DB-free validator.
// =============================================================================

import { z } from "zod";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  CLASSIFICATIONS,
  CORPUS_GLOBAL_SCOPE,
  SOURCE_LAYERS,
} from "./context-corpus-policy";

const SCOPE_VALUES = [CORPUS_GLOBAL_SCOPE, ...CANONICAL_TENANT_KEYS] as const;
const TENANT_SCOPE_MODES = ["canonical_tenant", "corpus_global", "move_registry"] as const;

export const INGESTION_METHODS = [
  "admin_bulk_loader",
  "structured_promotion",
  "operator_aca_job",
  "api_upload",
  "seed_migration",
] as const;

export const RETRIEVAL_PLANS = [
  "postgres_fts",
  "azure_ai_search",
  "fts_plus_search",
  "move_scoped_prompt_context",
  "not_retrievable",
] as const;

export const DatasetManifestSchema = z
  .object({
    dataset_id: z.string().min(3),
    title: z.string().min(3),
    /** Concrete scope for fixed datasets; null when resolved from a selected Move. */
    client_key: z
      .enum(SCOPE_VALUES as unknown as [string, ...string[]])
      .nullable()
      .optional(),
    /** Move-scoped uploads resolve tenancy from the authenticated Move registry. */
    tenant_scope: z.enum(TENANT_SCOPE_MODES).optional(),
    source_layer: z.enum(SOURCE_LAYERS),
    classification: z.enum(CLASSIFICATIONS),
    owner: z.string().min(1),
    source_basis: z.string().min(3),
    ingestion_method: z.enum(INGESTION_METHODS),
    retrieval_plan: z.enum(RETRIEVAL_PLANS),
    /** Whether live signed-in retrieval proof is required before agent_ready. */
    retrieval_proof_required: z.boolean(),
    /** How PII/PHI is handled; required (non-trivial) when classification is sensitive. */
    pii_phi_handling: z.string().nullable().optional(),
    expected_object_count: z.number().int().nonnegative().nullable().optional(),
    approved_by: z.string().min(1),
    approved_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "approved_at must be YYYY-MM-DD"),
    notes: z.string().nullable().optional(),
  })
  .strict();
export type DatasetManifest = z.infer<typeof DatasetManifestSchema>;

export interface ManifestValidation {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const SENSITIVE = new Set(["pii", "phi", "restricted"]);

/** Validate one manifest (already-parsed JSON). */
export function validateManifest(raw: unknown): ManifestValidation {
  const parsed = DatasetManifestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      ),
      warnings: [],
    };
  }
  const m = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];

  const scopeMode = m.tenant_scope ??
    (m.client_key === CORPUS_GLOBAL_SCOPE ? "corpus_global" : "canonical_tenant");
  if (scopeMode === "move_registry" && m.client_key !== null) {
    errors.push("move_registry scope must not pin a client_key");
  }
  if (scopeMode === "canonical_tenant" && !m.client_key) {
    errors.push("canonical_tenant scope requires a client_key");
  }
  if (scopeMode === "corpus_global" && m.client_key !== CORPUS_GLOBAL_SCOPE) {
    errors.push('corpus_global scope requires client_key "corpus_global"');
  }
  if (m.tenant_scope === "corpus_global" && m.client_key !== CORPUS_GLOBAL_SCOPE) {
    errors.push('tenant_scope "corpus_global" requires client_key "corpus_global"');
  }
  if (m.tenant_scope === "canonical_tenant" && (!m.client_key || m.client_key === CORPUS_GLOBAL_SCOPE)) {
    errors.push("canonical_tenant scope requires a canonical tenant client_key");
  }

  // Sensitive data in shared corpus is never allowed.
  if (scopeMode === "corpus_global" && SENSITIVE.has(m.classification)) {
    errors.push(
      `classification "${m.classification}" cannot be loaded into corpus_global (shared corpus)`,
    );
  }
  // Sensitive data must declare how PII/PHI is handled.
  if (SENSITIVE.has(m.classification) && !m.pii_phi_handling) {
    errors.push(
      `classification "${m.classification}" requires a pii_phi_handling description`,
    );
  }
  // A dataset that claims it needs no retrieval proof but plans to be retrievable
  // is suspicious — agent-usable context must be provable.
  if (m.retrieval_plan !== "not_retrievable" && !m.retrieval_proof_required) {
    warnings.push(
      "retrieval_plan is set but retrieval_proof_required is false — agent-usable context should be retrieval-proven",
    );
  }
  return { ok: errors.length === 0, errors, warnings };
}
