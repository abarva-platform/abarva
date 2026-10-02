import assert from "node:assert/strict";
import { test } from "node:test";
import { rm } from "node:fs/promises";
import { generatePack } from "../load_synthetic_enterprise_v1";
import {
  buildSyntheticHomeRows,
  persistedProjectedRow,
  projectedRowsHash,
  type CanonicalHomeObject,
  type ProjectedHomeRow,
} from "../synthetic_enterprise_home_rows";
import { assertWorkflowTriggersCover } from "./synthetic_enterprise_gate_fixtures";

function object(
  key: string,
  type: string,
  attributes: Record<string, unknown>,
): CanonicalHomeObject {
  return {
    id: key,
    object_key: key,
    object_type: type,
    display_name: key,
    source_record_id: `source-${key}`,
    value_state: "known",
    attributes_json: attributes,
  };
}

test("projection preserves logical application grain and declared segment identity", () => {
  const rows = buildSyntheticHomeRows([
    object("ENT-1", "enterprise", {
      business_model: "Integrated health services",
      source: { internal: true },
    }),
    object("SEG-1", "business_segment", { segment_name: "Health Plan" }),
    object("FUNC-1", "business_function", { business_segment_id: "SEG-1" }),
    object("FUNC-2", "business_function", { business_segment_id: "" }),
    object("APP-1", "application", {
      application_grain: "logical_service",
      source: { internal: true },
    }),
    object("APP-2", "application_module", { parent_application_id: "APP-1" }),
  ]);
  assert.equal(rows.filter((row) => row.row_type === "application").length, 1);
  assert.equal(
    rows.find((row) => row.row_key === "ENT-1")?.display_payload_json
      .business_model,
    "Integrated health services",
  );
  assert.equal(
    rows.find((row) => row.row_key === "ENT-1")?.display_payload_json.source,
    undefined,
  );
  assert.equal(
    rows.some((row) => row.row_key === "APP-2"),
    false,
  );
  assert.equal(
    rows.find((row) => row.row_key === "FUNC-1")?.display_payload_json
      .business_segment_key,
    "SEG-1",
  );
  // A function that declares no segment has none: no label is written for it.
  const shared = rows.find((row) => row.row_key === "FUNC-2");
  assert.equal(shared?.display_payload_json.business_segment, null);
  assert.equal(shared?.display_payload_json.business_segment_key, null);
  assert.equal(
    rows.find((row) => row.row_key === "FUNC-1")?.display_payload_json
      .business_segment,
    "SEG-1",
  );
  assert.ok(
    rows.every((row) => row.source_record_id && row.source_hash.length === 64),
  );
  assert.equal(
    rows.find((row) => row.row_key === "APP-1")?.display_payload_json.source,
    undefined,
  );
  assert.throws(
    () =>
      buildSyntheticHomeRows([
        object("FUNC-3", "business_function", {
          business_segment_id: "missing",
        }),
      ]),
    /Unresolved declared segment/,
  );
});

test("pinned V2 canonical graph projects the intended executive families", async () => {
  const pack = await generatePack("v2");
  try {
    const objects: CanonicalHomeObject[] = pack.normalized.objects.map(
      (item) => ({
        id: item.id,
        object_key: item.id,
        object_type: item.type,
        display_name: item.name,
        source_record_id: `source-${item.id}`,
        value_state: "known",
        attributes_json: item.attributes,
      }),
    );
    const rows = buildSyntheticHomeRows(objects);
    const count = (type: string) =>
      rows.filter((row) => row.row_type === type).length;
    assert.equal(count("application"), 344);
    assert.equal(count("enterprise_profile"), 1);
    assert.equal(count("contract"), 230);
    assert.equal(count("business_segment"), 3);
    assert.equal(count("business_function"), 14);
    assert.equal(count("program"), 24);
    assert.equal(count("metric"), 36);
    assert.equal(count("workforce_role"), 72);
    assert.equal(count("organization_ownership"), 7);
    assert.equal(count("data_flow"), 1350);
    assert.equal(count("data_analytics_workload"), 360);
    // Six functions declare no segment. Each carries none, and no row of the
    // projection carries a label the source does not hold.
    const functions = rows.filter(
      (row) => row.row_type === "business_function",
    );
    assert.equal(
      functions.filter(
        (row) =>
          row.display_payload_json.business_segment === null &&
          row.display_payload_json.business_segment_key === null,
      ).length,
      6,
    );
    assert.equal(
      functions.filter(
        (row) =>
          typeof row.display_payload_json.business_segment === "string" &&
          typeof row.display_payload_json.business_segment_key === "string",
      ).length,
      8,
    );
    assert.equal(
      rows.filter((row) =>
        JSON.stringify(row.display_payload_json).includes(
          "Enterprise shared function",
        ),
      ).length,
      0,
    );
    // The pinned source set holds every count the mapper reads, so neither
    // rule about a missing count changes any of its rows.
    assert.ok(
      rows
        .filter((row) => row.row_type === "data_analytics_workload")
        .every(
          (row) => typeof row.display_payload_json.workload_count === "number",
        ),
    );
    assert.ok(
      rows
        .filter((row) => row.row_type === "workforce_role")
        .every(
          (row) => typeof row.display_payload_json.role_count === "number",
        ),
    );
    assert.ok(
      rows.every((row) => row.primary_object_id && row.source_record_id),
    );
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
});

test("a count the source does not hold stays missing", () => {
  const payload = (
    key: string,
    type: string,
    attributes: Record<string, unknown>,
  ) =>
    buildSyntheticHomeRows([object(key, type, attributes)])[0]
      .display_payload_json;
  // A workload the source does not count is not one workload.
  assert.equal(payload("DP-1", "data_product", {}).workload_count, null);
  assert.equal(
    payload("DP-2", "data_product", { workload_count: null }).workload_count,
    null,
  );
  assert.equal(
    payload("DP-3", "data_product", { workload_count: 7 }).workload_count,
    7,
  );
  assert.equal(
    payload("DP-4", "data_product", { workload_count: 0 }).workload_count,
    0,
  );
  // A total of two counts exists only when the source holds both.
  const role = (attributes: Record<string, unknown>) =>
    payload("ROLE-1", "persona", { role_id: "ROLE-1", ...attributes })
      .role_count;
  assert.equal(role({ employee_count: 40, contractor_count: 2 }), 42);
  assert.equal(role({ employee_count: "40", contractor_count: "2" }), 42);
  assert.equal(role({ employee_count: 40, contractor_count: 0 }), 40);
  assert.equal(role({ employee_count: 0, contractor_count: 0 }), 0);
  assert.equal(role({ employee_count: 40 }), null);
  assert.equal(role({ contractor_count: 2 }), null);
  assert.equal(role({ employee_count: 40, contractor_count: null }), null);
  assert.equal(role({ employee_count: "", contractor_count: 2 }), null);
  assert.equal(role({ employee_count: "many", contractor_count: 2 }), null);
  assert.equal(role({}), null);
});

test("the hash of projected rows covers every served field and nothing else", () => {
  const row = (over: Partial<ProjectedHomeRow> = {}): ProjectedHomeRow => ({
    page_key: "applications_systems",
    row_key: "APP-1",
    row_type: "application",
    section_key: "applications_systems",
    title: "Fixture application",
    summary: null,
    primary_object_id: "00000000-0000-4000-8000-000000000001",
    source_record_id: "00000000-0000-4000-8000-000000000002",
    source_hash: "a".repeat(64),
    value_state: "known",
    display_payload_json: {
      name: "Fixture application",
      tier: 1,
      tags: ["a", "b"],
      owners: [{ role: "lead", id: "u1" }],
    },
    ...over,
  });
  const other = row({ row_key: "APP-2", title: "Another" });
  const hashed = projectedRowsHash([row(), other]);
  assert.match(hashed, /^[a-f0-9]{64}$/);
  // The order rows arrive in, and the order a payload's keys arrive in, are
  // not part of what is served.
  assert.equal(projectedRowsHash([other, row()]), hashed);
  assert.equal(
    projectedRowsHash([
      row({
        display_payload_json: {
          tags: ["a", "b"],
          tier: 1,
          name: "Fixture application",
          owners: [{ role: "lead", id: "u1" }],
        },
      }),
      other,
    ]),
    hashed,
  );
  assert.equal(
    projectedRowsHash([
      row({
        display_payload_json: {
          ...row().display_payload_json,
          absent: undefined,
        },
      }),
      other,
    ]),
    hashed,
  );
  // Keys inside an array element are ordered too.
  assert.equal(
    projectedRowsHash([
      row({
        display_payload_json: {
          ...row().display_payload_json,
          owners: [{ id: "u1", role: "lead" }],
        },
      }),
      other,
    ]),
    hashed,
  );
  // But a changed value inside an array element moves the hash.
  assert.notEqual(
    projectedRowsHash([
      row({
        display_payload_json: {
          ...row().display_payload_json,
          owners: [{ role: "lead", id: "u2" }],
        },
      }),
      other,
    ]),
    hashed,
  );
  // Every projected field is.
  for (const change of [
    { page_key: "vendor_contracts" },
    { row_key: "APP-9" },
    { row_type: "contract" },
    { section_key: "vendor_contracts" },
    { title: "Fixture application." },
    { summary: "" },
    { primary_object_id: "00000000-0000-4000-8000-000000000009" },
    { source_record_id: "00000000-0000-4000-8000-000000000009" },
    { source_hash: "b".repeat(64) },
    { value_state: "estimated" },
    { display_payload_json: { ...row().display_payload_json, tier: 2 } },
    { display_payload_json: { ...row().display_payload_json, tier: null } },
    {
      display_payload_json: { ...row().display_payload_json, tags: ["b", "a"] },
    },
    { display_payload_json: { ...row().display_payload_json, added: null } },
  ] satisfies Partial<ProjectedHomeRow>[]) {
    assert.notEqual(
      projectedRowsHash([row(change), other]),
      hashed,
      JSON.stringify(change),
    );
  }
  assert.notEqual(projectedRowsHash([row()]), hashed);
  assert.notEqual(
    projectedRowsHash([row(), other, row({ row_key: "APP-3" })]),
    hashed,
  );

  // A row read back from the table hashes as the row that was written.
  // The table holds the reference as `source_refs_json`, and no column for it.
  const persisted = (source_refs_json: unknown) => {
    const stored: Partial<ProjectedHomeRow> = row();
    delete stored.source_record_id;
    return persistedProjectedRow({
      ...(stored as Omit<ProjectedHomeRow, "source_record_id">),
      source_refs_json,
    });
  };
  assert.deepEqual(
    persisted([{ source_record_id: row().source_record_id }]),
    row(),
  );
  // Any other shape of source reference is not the one a projection wrote.
  for (const refs of [
    [],
    null,
    [{ source_record_id: row().source_record_id }, { source_record_id: "x" }],
    [{ source_record_id: row().source_record_id, role: "added" }],
    [{ record_id: row().source_record_id }],
    [row().source_record_id],
    { source_record_id: row().source_record_id },
  ]) {
    assert.notEqual(
      projectedRowsHash([persisted(refs), other]),
      hashed,
      JSON.stringify(refs),
    );
  }
});

test("the admission workflow runs when a file this test loads changes", () => {
  assertWorkflowTriggersCover([]);
});
