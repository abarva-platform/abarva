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

/**
 * Approval to load ONE exact version of a dataset through the data plane.
 *
 * The manifest's own `approved_by` approves declaring the dataset; it does not
 * approve loading it. A load is approved separately, by a named person, and the
 * approval names the assessment and the source-set hash it was given for, so it
 * cannot carry over to data that changed afterwards.
 */
export const LoadApprovalSchema = z
  .object({
    approved_by: z.string().min(1),
    approved_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "approved_at must be YYYY-MM-DD"),
    assessment_id: z.string().min(1),
    source_set_hash: z
      .string()
      .regex(/^[0-9a-f]{64}$/, "source_set_hash must be a sha256 hex digest"),
    release_record: z
      .string()
      .regex(
        /^docs\/releases\/records\/[A-Za-z0-9._-]+\.md$/,
        "release_record must be a docs/releases/records/*.md path",
      ),
  })
  .strict();
export type LoadApproval = z.infer<typeof LoadApprovalSchema>;

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
    /** Absent until a named person approves loading one exact version. */
    load_approval: LoadApprovalSchema.nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();
export type DatasetManifest = z.infer<typeof DatasetManifestSchema>;

// A load approver must be a person. This cannot prove that a person typed the
// name. It refuses a string that plainly names an agent, a team, a role or a
// delegation; what makes the approval reviewable is that it is a committed
// line, bound to one source-set hash, that a pull request has to show.
const PERSON_NAME =
  /^\p{Lu}[\p{L}'’.-]*(?: [\p{L}'’.-]+)* \p{Lu}[\p{L}'’.-]*$/u;
const NON_PERSON_APPROVER =
  /\b(?:codex|claude|cursor|copilot|gpt|gemini|agent|assistant|bot|automation|automated|operator|reviewer|owner|team|engineering|delegat\w*|authori[sz]\w*|approval)\b/i;

export function namesAPerson(value: string): boolean {
  return PERSON_NAME.test(value) && !NON_PERSON_APPROVER.test(value);
}

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
  if (m.load_approval && !namesAPerson(m.load_approval.approved_by)) {
    errors.push(
      "load_approval.approved_by must be a named person, not an agent, team, role or delegation",
    );
  }
  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Rules that no single manifest can check about itself: a dataset is declared
 * once, and the release record a load approval names is a file that exists.
 * A manifest that does not parse is skipped here; `validateManifest` reports it.
 */
export function validateManifestRegistry(
  entries: Array<{ file: string; raw: unknown }>,
  recordExists: (repoRelativePath: string) => boolean,
): string[] {
  const errors: string[] = [];
  const declaredBy = new Map<string, string>();
  for (const { file, raw } of entries) {
    const parsed = DatasetManifestSchema.safeParse(raw);
    if (!parsed.success) continue;
    const m = parsed.data;
    const first = declaredBy.get(m.dataset_id);
    if (first) {
      errors.push(
        `${file}: dataset_id ${m.dataset_id} is already declared by ${first}`,
      );
    } else {
      declaredBy.set(m.dataset_id, file);
    }
    if (m.load_approval && !recordExists(m.load_approval.release_record)) {
      errors.push(
        `${file}: load_approval.release_record ${m.load_approval.release_record} does not exist`,
      );
    }
  }
  return errors;
}

/** What a loader is about to write, stated by the loader from the data itself. */
export interface LoadBinding {
  dataset_id: string;
  tenant_key: string;
  assessment_id: string;
  source_set_hash: string;
  object_count: number;
  ingestion_method: (typeof INGESTION_METHODS)[number];
}

export type LoadApprovalDecision =
  | { approved: true; approval: LoadApproval }
  | { approved: false; reasons: string[] };

/**
 * Decide whether one exact dataset version may be loaded.
 *
 * `manifests` is every parsed manifest in the registry. The dataset is found by
 * the `dataset_id` it declares, never by a filename, and a load is approved
 * only when that one manifest is valid, describes what is being loaded, and
 * carries a load approval for this assessment and this source-set hash.
 */
export function resolveLoadApproval(
  manifests: unknown[],
  binding: LoadBinding,
): LoadApprovalDecision {
  const declared = manifests.filter(
    (raw) =>
      typeof raw === "object" &&
      raw !== null &&
      (raw as { dataset_id?: unknown }).dataset_id === binding.dataset_id,
  );
  if (declared.length !== 1) {
    return {
      approved: false,
      reasons: [
        `expected exactly one manifest declaring ${binding.dataset_id}, found ${declared.length}`,
      ],
    };
  }
  const validation = validateManifest(declared[0]);
  if (!validation.ok) {
    return {
      approved: false,
      reasons: validation.errors.map((e) => `manifest is invalid: ${e}`),
    };
  }
  const m = DatasetManifestSchema.parse(declared[0]);
  const reasons: string[] = [];
  if (m.client_key !== binding.tenant_key) {
    reasons.push("manifest client_key is not the tenant being loaded");
  }
  if (m.ingestion_method !== binding.ingestion_method) {
    reasons.push(
      `manifest declares ingestion_method ${m.ingestion_method}, not ${binding.ingestion_method}`,
    );
  }
  if (m.expected_object_count !== binding.object_count) {
    reasons.push(
      `manifest expects ${m.expected_object_count ?? "an undeclared number of"} objects, the load has ${binding.object_count}`,
    );
  }
  const approval = m.load_approval;
  if (!approval) {
    reasons.push("manifest carries no load_approval");
    return { approved: false, reasons };
  }
  if (approval.assessment_id !== binding.assessment_id) {
    reasons.push("load_approval is for a different assessment");
  }
  if (approval.source_set_hash !== binding.source_set_hash) {
    reasons.push("load_approval is for a different source-set hash");
  }
  return reasons.length > 0
    ? { approved: false, reasons }
    : { approved: true, approval };
}
