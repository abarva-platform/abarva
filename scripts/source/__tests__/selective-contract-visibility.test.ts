import { CANONICAL_TENANT_KEYS } from "@/lib/tenant/aliases";
import {
  buildSelectiveVisibilityPlan,
  buildSelectiveVisibilityPlanFromBytes,
  visibilityHash,
} from "../selective-contract-visibility";

const tenant = CANONICAL_TENANT_KEYS[0];
const options = {
  contractId: "CONTRACT-fixture",
  scopeId: "SCOPE-fixture",
  applicationRef: "APP-fixture",
  newLoadRunId: "visibility-fixture-new-run",
  datasetVersion: "visibility-fixture-version",
  idempotencyKey: "visibility-fixture-idempotency",
  proofSha256: "a".repeat(64),
};
function fixture(): any {
  const read = (rows: unknown[]) => ({ state: "read", rows });
  const sections: Record<string, unknown> = {
    tenant_access: read([{ target_access: true, unrelated_control: false }]),
    contract_before_contract: read([
      {
        row: {
          id: "stored-contract-uuid",
          tenant_key: tenant,
          contract_id: options.contractId,
          vendor_id: "VENDOR-fixture",
          load_run_id: "original-fixture-run",
          annual_value: 100,
          auto_renew: false,
          notice_deadline: "2027-12-30",
          quality_state: "reviewed",
          document_file_id: null,
          raw_payload: { sourceObjectId: "declared-fixture-row" },
        },
      },
    ]),
    contract_before_contract_scope: read([
      {
        row: {
          id: "stored-scope-uuid",
          tenant_key: tenant,
          contract_id: options.contractId,
          contract_scope_id: options.scopeId,
          scope_ref: options.applicationRef,
          scope_type: "application",
          load_run_id: "original-fixture-run",
          service_id: null,
          raw_payload: { hosting_model: "saas" },
        },
      },
    ]),
    l4_cube_active_load_run: read([
      {
        row: {
          tenant_key: tenant,
          load_run_id: "current-fixture-base",
        },
      },
    ]),
    l4_cube_active_load_run_overlay: read([
      {
        row: {
          tenant_key: tenant,
          load_run_id: "unrelated-fixture-overlay",
          dataset_version: "unrelated-version",
        },
      },
    ]),
    selector_schema: read([
      ...[
        "tenant_key",
        "load_run_id",
        "dataset_version",
        "input_source_version",
        "idempotency_key",
        "overlay_role",
      ].map((attname) => ({ attname, type: "text", attnotnull: true })),
      {
        attname: "activated_at",
        type: "timestamp with time zone",
        attnotnull: true,
      },
      { attname: "raw_payload", type: "jsonb", attnotnull: true },
    ]),
    selector_constraints: read([
      { definition: "PRIMARY KEY (tenant_key, load_run_id, dataset_version)" },
    ]),
  };
  for (let i = Object.keys(sections).length; i < 42; i++)
    sections[`other_fixed_probe_${i}`] = read([]);
  return {
    operation: "contract_repair_beforeimages_readonly",
    runId: "readonly-fixture-run",
    tenant,
    contractIds: [options.contractId],
    databaseWrites: false,
    rolledBack: true,
    errors: [],
    transaction: { read_only: "on", snapshot: "fixture-snapshot" },
    sections,
  };
}

test("proposes only two lineage columns and one new overlay; never enables execution", () => {
  const proof = fixture();
  const plan = buildSelectiveVisibilityPlan(proof, options);
  expect(plan.executionEnabled).toBe(false);
  expect(plan.targets).toHaveLength(2);
  for (const target of plan.targets) {
    expect(target.allowedColumns).toEqual(["load_run_id"]);
    expect(target.after).toEqual({
      ...target.before,
      load_run_id: options.newLoadRunId,
    });
    expect(target.beforeSha256).toBe(visibilityHash(target.before));
  }
  expect(plan.targets[0].after).toMatchObject({
    annual_value: 100,
    auto_renew: false,
    notice_deadline: "2027-12-30",
    quality_state: "reviewed",
    document_file_id: null,
  });
  expect(plan.overlay).toMatchObject({
    tenant_key: tenant,
    load_run_id: options.newLoadRunId,
    dataset_version: options.datasetVersion,
  });
  expect(plan.selectorBaseline).toEqual({
    base: proof.sections.l4_cube_active_load_run.rows.map((r: any) => r.row),
    overlays: proof.sections.l4_cube_active_load_run_overlay.rows.map(
      (r: any) => r.row,
    ),
  });
  expect(plan.requiredBeforeExecution).toContain(
    "independently_reviewed_execution_binding",
  );
  expect(plan.requiredBeforeExecution).toContain(
    "locked_current_full_before_images",
  );
});

test.each([
  [
    "partial proof",
    (p: any) => {
      p.errors.push({ label: "failed" });
    },
  ],
  [
    "missing query",
    (p: any) => {
      delete p.sections.other_fixed_probe_41;
    },
  ],
  [
    "failed section",
    (p: any) => {
      p.sections.other_fixed_probe_41.state = "query_failed";
    },
  ],
  [
    "unknown rows",
    (p: any) => {
      p.sections.other_fixed_probe_41.rows = null;
    },
  ],
  [
    "not read only",
    (p: any) => {
      p.transaction.read_only = "off";
    },
  ],
  [
    "not rolled back",
    (p: any) => {
      p.rolledBack = false;
    },
  ],
  [
    "write reported",
    (p: any) => {
      p.databaseWrites = true;
    },
  ],
  [
    "access denied",
    (p: any) => {
      p.sections.tenant_access.rows[0].target_access = false;
    },
  ],
  [
    "cross-tenant access",
    (p: any) => {
      p.sections.tenant_access.rows[0].unrelated_control = true;
    },
  ],
  [
    "duplicate contract",
    (p: any) => {
      p.sections.contract_before_contract.rows.push(
        p.sections.contract_before_contract.rows[0],
      );
    },
  ],
  [
    "wrong tenant",
    (p: any) => {
      p.sections.contract_before_contract.rows[0].row.tenant_key = "unrelated";
    },
  ],
  [
    "wrong contract",
    (p: any) => {
      p.sections.contract_before_contract.rows[0].row.contract_id = "another";
    },
  ],
  [
    "wrong application",
    (p: any) => {
      p.sections.contract_before_contract_scope.rows[0].row.scope_ref =
        "SYS-unproved";
    },
  ],
  [
    "wrong scope",
    (p: any) => {
      p.sections.contract_before_contract_scope.rows[0].row.contract_scope_id =
        "another";
    },
  ],
  [
    "scope from another contract",
    (p: any) => {
      p.sections.contract_before_contract_scope.rows[0].row.contract_id =
        "another";
    },
  ],
  [
    "unknown load run",
    (p: any) => {
      p.sections.contract_before_contract.rows[0].row.load_run_id = null;
    },
  ],
  [
    "already selected old run",
    (p: any) => {
      p.sections.l4_cube_active_load_run.rows[0].row.load_run_id =
        "original-fixture-run";
    },
  ],
  [
    "new run collision",
    (p: any) => {
      p.sections.l4_cube_active_load_run_overlay.rows[0].row.load_run_id =
        options.newLoadRunId;
    },
  ],
  [
    "unsupported selector schema",
    (p: any) => {
      p.sections.selector_schema.rows[0].attnotnull = false;
    },
  ],
  [
    "unsupported selector key",
    (p: any) => {
      p.sections.selector_constraints.rows[0].definition =
        "PRIMARY KEY (tenant_key, load_run_id)";
    },
  ],
  [
    "duplicate schema column",
    (p: any) => {
      p.sections.selector_schema.rows[7] = p.sections.selector_schema.rows[0];
    },
  ],
  [
    "unrelated selector",
    (p: any) => {
      p.sections.l4_cube_active_load_run_overlay.rows[0].row.tenant_key =
        "unrelated";
    },
  ],
])("refuses %s before producing a write plan", (_name, change) => {
  const proof = fixture();
  change(proof);
  expect(() => buildSelectiveVisibilityPlan(proof, options)).toThrow();
});

test("requires a sealed proof reference and a genuinely new run", () => {
  expect(() =>
    buildSelectiveVisibilityPlan(fixture(), {
      ...options,
      proofSha256: "unsealed",
    }),
  ).toThrow();
  expect(() =>
    buildSelectiveVisibilityPlan(fixture(), {
      ...options,
      newLoadRunId: "original-fixture-run",
    }),
  ).toThrow();
});

test("hashes canonical JSON ordering without hiding changed values", () => {
  expect(visibilityHash({ b: 2, a: { d: 4, c: 3 } })).toBe(
    visibilityHash({ a: { c: 3, d: 4 }, b: 2 }),
  );
  expect(visibilityHash({ a: 1 })).not.toBe(visibilityHash({ a: 2 }));
});

test("uses the exact sealed native bytes, not a same-meaning reserialization", () => {
  const bytes = Buffer.from(JSON.stringify(fixture()));
  const proofSha256 = require("node:crypto")
    .createHash("sha256")
    .update(bytes)
    .digest("hex");
  expect(
    buildSelectiveVisibilityPlanFromBytes(bytes, { ...options, proofSha256 })
      .targets,
  ).toHaveLength(2);
  expect(() =>
    buildSelectiveVisibilityPlanFromBytes(
      Buffer.from(JSON.stringify(fixture(), null, 2)),
      { ...options, proofSha256 },
    ),
  ).toThrow(/bytes/);
});
