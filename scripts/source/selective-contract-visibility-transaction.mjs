import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const canonical = (v) =>
  Array.isArray(v)
    ? v.map(canonical)
    : v !== null && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([k, x]) => [k, canonical(x)]),
        )
      : v;
export const selectiveVisibilityHash = (v) =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(canonical(v)))
    .digest("hex");
const same = (a, b) => isDeepStrictEqual(canonical(a), canonical(b));
const sorted = (rows) =>
  rows
    .slice()
    .sort((a, b) =>
      JSON.stringify(canonical(a)).localeCompare(JSON.stringify(canonical(b))),
    );
const identifier = (s) => {
  check(/^[a-z_][a-z0-9_]*$/.test(s), "Catalog identifier refused");
  return `"${s}"`;
};
const targetsAllowed = ["source.contract", "source.contract_scope"];
const withoutAuditTimestamp = (row) => {
  const rest = { ...row };
  delete rest.updated_at;
  return rest;
};

export function validateSelectiveVisibilityTransactionPlan(plan, planSha256) {
  check(
    planSha256 === selectiveVisibilityHash(plan),
    "Exact reviewed plan hash required",
  );
  check(
    plan.contractVersion === "source-selective-visibility-review-plan/v1" &&
      plan.executionEnabled === false,
    "Review-only plan required",
  );
  check(
    plan.targets?.length === 2 &&
      plan.targets.every((t, i) => t.table === targetsAllowed[i]),
    "Exactly two allowed target tables required",
  );
  check(
    typeof plan.tenantKey === "string" &&
      /^[A-Za-z0-9._-]{1,100}$/.test(plan.tenantKey),
    "Declared tenant required",
  );
  check(
    /^[a-f0-9]{64}$/.test(plan.sourceProofSha256),
    "Sealed native source proof required",
  );
  const auditPolicy = plan.auditTimestampPolicy ?? "preserve";
  check(
    ["preserve", "database_transaction_timestamp"].includes(auditPolicy),
    "Supported explicit audit timestamp policy required",
  );
  for (const t of plan.targets) {
    check(
      t.before?.id &&
        t.before.tenant_key === plan.tenantKey &&
        t.before.contract_id === plan.contractId,
      "Exact original target identity required",
    );
    check(
      t.before.load_run_id && t.before.load_run_id !== plan.overlay.load_run_id,
      "New lineage reference required",
    );
    check(
      same(
        t.allowedColumns,
        auditPolicy === "preserve"
          ? ["load_run_id"]
          : ["load_run_id", "updated_at"],
      ) &&
        same(t.after, { ...t.before, load_run_id: plan.overlay.load_run_id }),
      "Exact lineage-only after-image required",
    );
    check(
      t.beforeSha256 === selectiveVisibilityHash(t.before),
      "Full before-image hash mismatch",
    );
    if (auditPolicy === "database_transaction_timestamp")
      check(
        typeof t.before.updated_at === "string" &&
          Number.isFinite(Date.parse(t.before.updated_at)),
        "Known native audit timestamp required",
      );
    const key =
      t.table === "source.contract"
        ? { tenant_key: plan.tenantKey, contract_id: plan.contractId }
        : {
            tenant_key: plan.tenantKey,
            contract_scope_id: t.before.contract_scope_id,
          };
    check(same(t.key, key), "Exact declared target key required");
  }
  check(
    plan.targets[1].before.scope_type === "application" &&
      /^APP-[A-Za-z0-9._-]+$/.test(plan.targets[1].before.scope_ref),
    "Explicit application identity required",
  );
  check(
    same(
      Object.keys(plan.overlay).sort(),
      [
        "tenant_key",
        "load_run_id",
        "dataset_version",
        "input_source_version",
        "idempotency_key",
        "overlay_role",
        "raw_payload",
      ].sort(),
    ),
    "Exact owned overlay fields required",
  );
  check(
    plan.overlay.tenant_key === plan.tenantKey &&
      plan.overlay.input_source_version === plan.sourceProofSha256 &&
      plan.overlay.overlay_role === "selective_canonical_visibility",
    "Owned selector provenance required",
  );
  for (const k of ["load_run_id", "dataset_version", "idempotency_key"])
    check(
      typeof plan.overlay[k] === "string" &&
        /^[A-Za-z0-9:._-]{1,240}$/.test(plan.overlay[k]),
      "Bounded declared overlay identifiers required",
    );
  check(
    plan.selectorBaselineSha256 ===
      selectiveVisibilityHash(plan.selectorBaseline),
    "All-selector baseline hash mismatch",
  );
  check(
    Array.isArray(plan.selectorBaseline.base) &&
      Array.isArray(plan.selectorBaseline.overlays),
    "Complete selector baseline required",
  );
  check(
    [...plan.selectorBaseline.base, ...plan.selectorBaseline.overlays].every(
      (r) =>
        r.tenant_key === plan.tenantKey &&
        r.load_run_id !== plan.overlay.load_run_id &&
        !plan.targets.some((t) => t.before.load_run_id === r.load_run_id),
    ),
    "Existing run must remain excluded",
  );
}

// No CLI or product caller: a separately reviewed ACA wrapper supplies authority,
// the exact released code/plan binding, runtime witness and immutable Blob sink.
export async function runSelectiveVisibilityTransaction(
  db,
  input,
  persistImmutable,
) {
  const { plan, mode, runId, applied, planSha256 } = input;
  const generatedAuditTimestamp =
    plan.auditTimestampPolicy === "database_transaction_timestamp";
  validateSelectiveVisibilityTransactionPlan(plan, planSha256);
  check(
    ["preflight", "apply", "restore"].includes(mode) && runId,
    "Explicit operation and run ID required",
  );
  check(
    typeof persistImmutable === "function",
    "Private immutable proof sink required",
  );
  if (mode === "restore") {
    check(
      applied?.committed === true &&
        applied.planSha256 === planSha256 &&
        applied.tenantKey === plan.tenantKey &&
        applied.contractId === plan.contractId &&
        applied.afterRows?.length === 2 &&
        applied.ownedOverlay &&
        applied.selectorBaseline,
      "Exact committed apply packet required for restore",
    );
    check(
      same(
        applied.afterRows.map((r) =>
          generatedAuditTimestamp ? withoutAuditTimestamp(r) : r,
        ),
        plan.targets.map((t) =>
          generatedAuditTimestamp ? withoutAuditTimestamp(t.after) : t.after,
        ),
      ),
      "Reviewed full after-images required for restore",
    );
    if (generatedAuditTimestamp)
      check(
        typeof applied.transactionTimestamp === "string" &&
          applied.afterRows.every(
            (r) => r.updated_at === applied.transactionTimestamp,
          ),
        "Recorded generated audit timestamps required for restore",
      );
    check(
      same(applied.selectorBaseline, plan.selectorBaseline),
      "Reviewed original selectors required for restore",
    );
  }
  const proof = {
    operation: "selective_contract_visibility",
    mode,
    runId,
    planSha256,
    tenantKey: plan.tenantKey,
    contractId: plan.contractId,
    committed: false,
    commitAttempted: false,
    commitOutcome: "not_attempted",
    rollbackAttempted: false,
    rollbackOutcome: "not_attempted",
    recoveryRequired: false,
    retryAllowed: false,
    updatedRows: 0,
    overlayRows: 0,
    afterRows: [],
    selectorBaseline: plan.selectorBaseline,
  };
  const save = async (stage) => {
    const body = { ...proof, stage };
    const receipt = await persistImmutable(body);
    check(
      receipt?.uri && receipt.sha256 === selectiveVisibilityHash(body),
      "Immutable proof acknowledgement mismatch",
    );
    return receipt;
  };
  const rows = async (sql, args = []) =>
    (await db.query(sql, args)).rows.map((r) => r.row);
  const selectors = async () => ({
    base: await rows(
      "SELECT to_jsonb(t) AS row FROM source.l4_cube_active_load_run t WHERE tenant_key=$1 ORDER BY to_jsonb(t)::text" +
        (mode === "preflight" ? "" : " FOR UPDATE"),
      [plan.tenantKey],
    ),
    overlays: await rows(
      "SELECT to_jsonb(t) AS row FROM source.l4_cube_active_load_run_overlay t WHERE tenant_key=$1 ORDER BY to_jsonb(t)::text" +
        (mode === "preflight" ? "" : " FOR UPDATE"),
      [plan.tenantKey],
    ),
  });
  const baselineEqual = (a, b) =>
    same(sorted(a.base), sorted(b.base)) &&
    same(sorted(a.overlays), sorted(b.overlays));
  try {
    await db.query(
      "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE" +
        (mode === "preflight" ? " READ ONLY" : ""),
    );
    proof.transactionReadOnly = (
      await db.query("SHOW transaction_read_only")
    ).rows[0].transaction_read_only;
    check(
      proof.transactionReadOnly === (mode === "preflight" ? "on" : "off"),
      "Exact transaction mode required",
    );
    proof.transactionTimestamp = (
      await db.query("SELECT to_jsonb(transaction_timestamp()) AS timestamp")
    ).rows[0].timestamp;
    await db.query("SET LOCAL lock_timeout='5s'");
    await db.query("SET LOCAL statement_timeout='30s'");
    await db.query("SELECT set_config('app.tenant_key',$1,true)", [
      plan.tenantKey,
    ]);
    const access = (
      await db.query(
        "SELECT source.can_read_sourcing_tenant($1) AS target,source.can_read_sourcing_tenant('__unrelated_visibility_control__') AS unrelated",
        [plan.tenantKey],
      )
    ).rows[0];
    check(
      access?.target === true && access.unrelated === false,
      "Target-only tenant access required",
    );
    // Selector insertion must be serialized too; row locks cannot lock an absent key.
    if (mode !== "preflight")
      await db.query(
        "LOCK TABLE source.contract,source.contract_scope,source.l4_cube_active_load_run,source.l4_cube_active_load_run_overlay IN SHARE ROW EXCLUSIVE MODE",
      );
    const tables = (
      await db.query(`SELECT n.nspname AS schema,c.relname AS name,EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attname='load_run_id' AND NOT a.attisdropped) AS has_run
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('source','doc') AND c.relkind IN ('r','p')
      AND NOT EXISTS(SELECT 1 FROM pg_inherits i WHERE i.inhrelid=c.oid)
      AND EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attname='tenant_key' AND NOT a.attisdropped)
      ORDER BY n.nspname,c.relname`)
    ).rows;
    check(
      tables.length > 0 && tables.length <= 300,
      "Complete bounded canonical catalog required",
    );
    const fingerprints = async () => {
      const values = {};
      for (const t of tables) {
        const table = `${identifier(t.schema)}.${identifier(t.name)}`;
        let exclude = "";
        const args = [plan.tenantKey];
        if (targetsAllowed.includes(`${t.schema}.${t.name}`)) {
          exclude = " AND id::text<>$2";
          args.push(
            String(
              plan.targets[targetsAllowed.indexOf(`${t.schema}.${t.name}`)]
                .before.id,
            ),
          );
        }
        if (
          t.schema === "source" &&
          t.name === "l4_cube_active_load_run_overlay"
        ) {
          exclude = " AND NOT(load_run_id=$2 AND dataset_version=$3)";
          args.push(plan.overlay.load_run_id, plan.overlay.dataset_version);
        }
        values[`${t.schema}.${t.name}`] = (
          await db.query(
            `SELECT count(*)::text AS rows,md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'' ORDER BY to_jsonb(t)::text),'')) AS digest FROM ${table} t WHERE tenant_key=$1${exclude}`,
            args,
          )
        ).rows[0];
      }
      return values;
    };
    proof.collateralBefore = await fingerprints();
    for (const t of tables.filter((t) => t.has_run)) {
      const matches = (
        await db.query(
          `SELECT count(*)::text AS n FROM ${identifier(t.schema)}.${identifier(t.name)} WHERE tenant_key=$1 AND load_run_id=$2`,
          [plan.tenantKey, plan.overlay.load_run_id],
        )
      ).rows[0];
      const ownTable =
        targetsAllowed.includes(`${t.schema}.${t.name}`) ||
        (t.schema === "source" && t.name === "l4_cube_active_load_run_overlay");
      check(
        matches.n === String(mode === "restore" && ownTable ? 1 : 0),
        "Scoped new-run collision or unexpected target count",
      );
    }
    const currentSelectors = await selectors();
    proof.selectorBefore = currentSelectors;
    let owned;
    if (mode === "restore") {
      const candidates = currentSelectors.overlays.filter(
        (r) =>
          r.load_run_id === plan.overlay.load_run_id &&
          r.dataset_version === plan.overlay.dataset_version,
      );
      check(
        candidates.length === 1 && same(candidates[0], applied.ownedOverlay),
        "Full owned overlay after-image mismatch",
      );
      owned = candidates[0];
      check(
        baselineEqual(
          {
            base: currentSelectors.base,
            overlays: currentSelectors.overlays.filter((r) => r !== owned),
          },
          plan.selectorBaseline,
        ),
        "Unrelated selector drift prevents restore",
      );
    } else
      check(
        baselineEqual(currentSelectors, plan.selectorBaseline),
        "Current selector baseline drift",
      );
    proof.beforeRows = [];
    for (const [index, t] of plan.targets.entries()) {
      const expected = mode === "restore" ? applied.afterRows[index] : t.before;
      const key =
        t.table === "source.contract" ? "contract_id" : "contract_scope_id";
      const read = await rows(
        `SELECT to_jsonb(t) AS row FROM ${t.table} t WHERE tenant_key=$1 AND ${key}=$2 AND id::text=$3` +
          (mode === "preflight" ? "" : " FOR UPDATE"),
        [plan.tenantKey, t.key[key], String(t.before.id)],
      );
      check(
        read.length === 1 && same(read[0], expected),
        mode === "restore"
          ? "Full target after-image mismatch"
          : "Current full before-image mismatch",
      );
      // SQL JSON equality refuses numeric precision loss in the supplied packet.
      const exact = await db.query(
        `SELECT 1 FROM ${t.table} t WHERE tenant_key=$1 AND id::text=$2 AND to_jsonb(t)=$3::jsonb`,
        [plan.tenantKey, String(t.before.id), JSON.stringify(expected)],
      );
      check(exact.rowCount === 1, "Native full-row comparison mismatch");
      proof.beforeRows.push(read[0]);
    }
    proof.preparedAfterRows = plan.targets.map((t) => ({
      ...(mode === "restore" ? t.before : t.after),
      ...(generatedAuditTimestamp
        ? { updated_at: proof.transactionTimestamp }
        : {}),
    }));
    proof.auditTimestampPolicy = plan.auditTimestampPolicy ?? "preserve";
    proof.backup = await save("before_first_write");
    if (mode === "preflight") {
      proof.rollbackAttempted = true;
      proof.rollbackOutcome = "unknown";
      await db.query("ROLLBACK");
      proof.rollbackOutcome = "acknowledged";
      return { ...proof, rolledBack: true };
    }
    for (const [index, t] of plan.targets.entries()) {
      const expected = mode === "restore" ? applied.afterRows[index] : t.before;
      const desired = proof.preparedAfterRows[index];
      const result = await db.query(
        `UPDATE ${t.table} t SET load_run_id=$1${generatedAuditTimestamp ? ",updated_at=transaction_timestamp()" : ""} WHERE tenant_key=$2 AND id::text=$3 AND to_jsonb(t)=$4::jsonb RETURNING to_jsonb(t) AS row`,
        [
          desired.load_run_id,
          plan.tenantKey,
          String(t.before.id),
          JSON.stringify(expected),
        ],
      );
      check(
        result.rowCount === 1 && same(result.rows[0].row, desired),
        "Exact single-row after-image mismatch",
      );
      proof.updatedRows += result.rowCount;
      proof.afterRows.push(result.rows[0].row);
    }
    if (mode === "apply") {
      const o = plan.overlay;
      const result = await db.query(
        "INSERT INTO source.l4_cube_active_load_run_overlay(tenant_key,load_run_id,dataset_version,input_source_version,idempotency_key,overlay_role,raw_payload) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING to_jsonb(l4_cube_active_load_run_overlay) AS row",
        [
          o.tenant_key,
          o.load_run_id,
          o.dataset_version,
          o.input_source_version,
          o.idempotency_key,
          o.overlay_role,
          JSON.stringify(o.raw_payload),
        ],
      );
      check(
        result.rowCount === 1 &&
          same(
            { ...result.rows[0].row, activated_at: undefined },
            { ...o, activated_at: undefined },
          ),
        "Owned overlay insert mismatch",
      );
      proof.ownedOverlay = result.rows[0].row;
      proof.overlayRows = 1;
    } else {
      const result = await db.query(
        "DELETE FROM source.l4_cube_active_load_run_overlay t WHERE tenant_key=$1 AND load_run_id=$2 AND dataset_version=$3 AND to_jsonb(t)=$4::jsonb",
        [
          plan.tenantKey,
          owned.load_run_id,
          owned.dataset_version,
          JSON.stringify(owned),
        ],
      );
      check(result.rowCount === 1, "Exact owned overlay delete required");
      proof.overlayRows = 1;
    }
    proof.collateralAfter = await fingerprints();
    check(
      same(proof.collateralBefore, proof.collateralAfter),
      "Collateral canonical row change refused",
    );
    const finalSelectors = await selectors();
    const expectedSelectors = {
      base: plan.selectorBaseline.base,
      overlays:
        mode === "apply"
          ? [...plan.selectorBaseline.overlays, proof.ownedOverlay]
          : plan.selectorBaseline.overlays,
    };
    check(
      baselineEqual(finalSelectors, expectedSelectors),
      "All-selector after-image mismatch",
    );
    proof.selectedContract = await rows(
      "SELECT to_jsonb(t) AS row FROM source.contract_360 t WHERE tenant_key=$1 AND contract_id=$2",
      [plan.tenantKey, plan.contractId],
    );
    proof.selectedScope = await rows(
      "SELECT to_jsonb(t) AS row FROM source.contract_application_scope t WHERE tenant_key=$1 AND contract_id=$2",
      [plan.tenantKey, plan.contractId],
    );
    if (mode === "apply") {
      check(
        proof.selectedContract.length === 1 &&
          proof.selectedContract[0].load_run_id === plan.overlay.load_run_id,
        "Exact selected contract readback required",
      );
      check(
        proof.selectedScope.length === 1 &&
          proof.selectedScope[0].application_ref ===
            plan.targets[1].before.scope_ref &&
          proof.selectedScope[0].load_run_id === plan.overlay.load_run_id,
        "Exact selected application scope readback required",
      );
    } else
      check(
        proof.selectedContract.length === 0 && proof.selectedScope.length === 0,
        "Restore must return original excluded visibility",
      );
    check(
      proof.updatedRows === 2 && proof.overlayRows === 1,
      "Exact two rows and one overlay required",
    );
    proof.preCommitProof = await save("before_commit");
    // Once COMMIT is sent, a lost transport acknowledgement cannot prove rollback.
    proof.commitAttempted = true;
    proof.commitOutcome = "unknown";
    proof.committed = null;
    await db.query("COMMIT");
    proof.committed = true;
    proof.commitOutcome = "acknowledged";
    try {
      proof.finalProof = await save("after_commit");
    } catch (error) {
      proof.postCommitProofError = String(error.message);
    }
    return proof;
  } catch (error) {
    proof.attemptedRows = proof.updatedRows;
    proof.attemptedOverlayRows = proof.overlayRows;
    if (proof.commitAttempted) {
      proof.committed = null;
      proof.commitOutcome = "unknown";
      proof.updatedRows = null;
      proof.overlayRows = null;
      proof.recoveryRequired = true;
    } else {
      proof.rollbackAttempted = true;
      proof.rollbackOutcome = "unknown";
      try {
        await db.query("ROLLBACK");
        proof.rollbackOutcome = "acknowledged";
        proof.committed = false;
        proof.updatedRows = 0;
        proof.overlayRows = 0;
      } catch {
        proof.committed = null;
        proof.updatedRows = null;
        proof.overlayRows = null;
        proof.recoveryRequired = true;
      }
    }
    try {
      proof.failureProof = await save(
        proof.commitAttempted ? "commit_outcome_unknown" : "transaction_failed",
      );
    } catch {
      proof.failureProofUnavailable = true;
    }
    const failure =
      error instanceof Error
        ? error
        : new Error("Visibility transaction failed without a structured error");
    failure.visibilityProof = { ...proof };
    throw failure;
  }
}
