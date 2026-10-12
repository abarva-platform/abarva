import crypto from "node:crypto";
import { CANONICAL_TENANT_KEYS } from "@/lib/tenant/aliases";

type Row = Record<string, unknown>;
type Section = { state: string; rows: Row[] | null };
export interface VisibilityBeforeImageProof {
  operation: string;
  runId: string;
  tenant: string;
  contractIds: string[];
  databaseWrites: boolean;
  rolledBack: boolean;
  errors: unknown[];
  transaction: { read_only: string; snapshot: string };
  sections: Record<string, Section>;
}
export interface VisibilityPlanOptions {
  contractId: string;
  scopeId: string;
  applicationRef: string;
  newLoadRunId: string;
  datasetVersion: string;
  idempotencyKey: string;
  proofSha256: string;
  auditTimestampPolicy?: "preserve" | "database_transaction_timestamp";
}
const requireFact = (condition: unknown, message: string): void => {
  if (!condition) throw new Error(message);
};
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}
export const visibilityHash = (value: unknown): string =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");

// This builds a review packet only. It does not connect, execute SQL, or grant authority.
export function buildSelectiveVisibilityPlan(
  proof: VisibilityBeforeImageProof,
  options: VisibilityPlanOptions,
) {
  requireFact(
    proof.operation === "contract_repair_beforeimages_readonly" && proof.runId,
    "Exact before-image operation required",
  );
  requireFact(
    CANONICAL_TENANT_KEYS.includes(proof.tenant),
    "Declared canonical tenant required",
  );
  requireFact(
    proof.contractIds.length === 1 &&
      proof.contractIds[0] === options.contractId,
    "Exact contract scope required",
  );
  requireFact(
    proof.databaseWrites === false &&
      proof.rolledBack === true &&
      proof.transaction.read_only === "on" &&
      proof.transaction.snapshot,
    "Successful read-only rollback required",
  );
  const sections = Object.values(proof.sections);
  requireFact(
    proof.errors.length === 0 &&
      sections.length === 42 &&
      sections.every(
        (section) =>
          section.state === "read" &&
          Array.isArray(section.rows) &&
          section.rows.length <= 200,
      ),
    "Complete bounded before-image proof required",
  );
  const rows = (key: string): Row[] => {
    const section = proof.sections[key];
    requireFact(
      section?.state === "read" && Array.isArray(section.rows),
      `Required proof section ${key} missing`,
    );
    return section.rows!;
  };
  const one = (key: string): Row => {
    const values = rows(key);
    requireFact(values.length === 1, `Exactly one ${key} required`);
    const value = values[0].row;
    requireFact(
      value !== null && typeof value === "object" && !Array.isArray(value),
      "Full canonical before-image required",
    );
    return value as Row;
  };
  const access = rows("tenant_access");
  requireFact(
    access.length === 1 &&
      access[0].target_access === true &&
      access[0].unrelated_control === false,
    "Target-only access control required",
  );
  const contract = one("contract_before_contract");
  const scope = one("contract_before_contract_scope");
  requireFact(
    contract.tenant_key === proof.tenant &&
      contract.contract_id === options.contractId &&
      contract.id,
    "Contract identity mismatch",
  );
  requireFact(
    scope.tenant_key === proof.tenant &&
      scope.contract_id === options.contractId &&
      scope.contract_scope_id === options.scopeId &&
      scope.scope_ref === options.applicationRef &&
      scope.scope_type === "application" &&
      scope.id,
    "Declared scope identity mismatch",
  );
  for (const value of [
    options.contractId,
    options.scopeId,
    options.applicationRef,
    options.newLoadRunId,
    options.datasetVersion,
    options.idempotencyKey,
  ]) {
    requireFact(
      typeof value === "string" && /^[A-Za-z0-9:._-]{1,240}$/.test(value),
      "Declared bounded identifiers required",
    );
  }
  requireFact(
    /^[a-f0-9]{64}$/.test(options.proofSha256),
    "Sealed proof hash required",
  );
  const auditTimestampPolicy = options.auditTimestampPolicy ?? "preserve";
  requireFact(
    ["preserve", "database_transaction_timestamp"].includes(
      auditTimestampPolicy,
    ),
    "Explicit supported audit timestamp policy required",
  );
  if (auditTimestampPolicy === "database_transaction_timestamp")
    requireFact(
      [contract, scope].every(
        (row) =>
          typeof row.updated_at === "string" &&
          Number.isFinite(Date.parse(row.updated_at)),
      ),
      "Known native audit timestamps required",
    );
  const base = rows("l4_cube_active_load_run").map((row) => row.row as Row);
  const overlays = rows("l4_cube_active_load_run_overlay").map(
    (row) => row.row as Row,
  );
  requireFact(
    [...base, ...overlays].every(
      (row) =>
        row &&
        typeof row === "object" &&
        row.tenant_key === proof.tenant &&
        typeof row.load_run_id === "string",
    ),
    "Complete target-tenant selector rows required",
  );
  requireFact(
    [contract, scope].every(
      (row) =>
        typeof row.load_run_id === "string" &&
        row.load_run_id &&
        row.load_run_id !== options.newLoadRunId,
    ),
    "Known original lineage and a new run required",
  );
  requireFact(
    [...base, ...overlays].every(
      (row) =>
        row.load_run_id !== options.newLoadRunId &&
        ![contract.load_run_id, scope.load_run_id].includes(row.load_run_id),
    ),
    "Original rows must remain excluded; new run must not collide with selectors",
  );
  const expectedColumns: Record<string, string> = {
    tenant_key: "text",
    load_run_id: "text",
    dataset_version: "text",
    input_source_version: "text",
    idempotency_key: "text",
    overlay_role: "text",
    activated_at: "timestamp with time zone",
    raw_payload: "jsonb",
  };
  const columns = rows("selector_schema");
  requireFact(
    columns.length === 8 &&
      new Set(columns.map((column) => column.attname)).size === 8 &&
      columns.every(
        (column) =>
          column.attnotnull === true &&
          expectedColumns[String(column.attname)] === column.type,
      ),
    "Existing selector schema mismatch",
  );
  requireFact(
    rows("selector_constraints").some(
      (row) =>
        row.definition ===
        "PRIMARY KEY (tenant_key, load_run_id, dataset_version)",
    ),
    "Existing selector primary key mismatch",
  );
  const targets = [
    {
      table: "source.contract",
      key: { tenant_key: proof.tenant, contract_id: options.contractId },
      before: contract,
    },
    {
      table: "source.contract_scope",
      key: { tenant_key: proof.tenant, contract_scope_id: options.scopeId },
      before: scope,
    },
  ].map((target) => ({
    ...target,
    allowedColumns:
      auditTimestampPolicy === "preserve"
        ? ["load_run_id"]
        : ["load_run_id", "updated_at"],
    beforeSha256: visibilityHash(target.before),
    after: { ...target.before, load_run_id: options.newLoadRunId },
  }));
  const selectorBaseline = { base, overlays };
  return {
    contractVersion: "source-selective-visibility-review-plan/v1",
    executionEnabled: false,
    auditTimestampPolicy,
    tenantKey: proof.tenant,
    contractId: options.contractId,
    sourceProofRunId: proof.runId,
    sourceProofSha256: options.proofSha256,
    targets,
    selectorBaseline,
    selectorBaselineSha256: visibilityHash(selectorBaseline),
    overlay: {
      tenant_key: proof.tenant,
      load_run_id: options.newLoadRunId,
      dataset_version: options.datasetVersion,
      input_source_version: options.proofSha256,
      idempotency_key: options.idempotencyKey,
      overlay_role: "selective_canonical_visibility",
      raw_payload: {
        operation: "existing_rows_visibility_recovery",
        original_load_runs: targets.map((target) => target.before.load_run_id),
        before_image_proof_sha256: options.proofSha256,
      },
    },
    requiredBeforeExecution: [
      "independently_reviewed_execution_binding",
      "locked_current_full_before_images",
      "new_run_absent_from_all_canonical_row_tables",
      "unchanged_all_selector_baseline",
      "immutable_private_backup_before_first_write",
      "exact_two_row_and_one_overlay_counts",
      "no_business_column_or_unrelated_row_change",
      "selected_view_readback_before_commit",
      "conditional_full_after_image_restore",
      "repo_main_digest_and_worker_runtime_proof",
      "independent_native_after_readback_and_signed_in_acceptance",
    ],
  };
}

export function buildSelectiveVisibilityPlanFromBytes(
  bytes: Uint8Array,
  options: VisibilityPlanOptions,
) {
  requireFact(
    crypto.createHash("sha256").update(bytes).digest("hex") ===
      options.proofSha256,
    "Native proof bytes do not match the reviewed hash",
  );
  const proof = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  ) as VisibilityBeforeImageProof;
  return buildSelectiveVisibilityPlan(proof, options);
}
