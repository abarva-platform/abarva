import assert from "node:assert/strict";
import { test } from "node:test";
import { rm } from "node:fs/promises";
import { generatePack } from "../load_synthetic_enterprise_v1";
import {
  buildSyntheticHomeRows,
  type CanonicalHomeObject,
} from "../synthetic_enterprise_home_rows";

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
    rows.some((row) => row.row_key === "APP-2"),
    false,
  );
  assert.equal(
    rows.find((row) => row.row_key === "FUNC-1")?.display_payload_json
      .business_segment_key,
    "SEG-1",
  );
  assert.equal(
    rows.find((row) => row.row_key === "FUNC-2")?.display_payload_json
      .business_segment,
    "Enterprise shared function",
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
    assert.equal(count("contract"), 230);
    assert.equal(count("business_segment"), 3);
    assert.equal(count("business_function"), 14);
    assert.equal(count("program"), 24);
    assert.equal(count("metric"), 36);
    assert.equal(count("workforce_role"), 72);
    assert.equal(count("organization_ownership"), 7);
    assert.equal(count("data_flow"), 1350);
    assert.equal(count("data_analytics_workload"), 360);
    assert.equal(
      rows.filter(
        (row) =>
          row.row_type === "business_function" &&
          row.display_payload_json.business_segment ===
            "Enterprise shared function",
      ).length,
      6,
    );
    assert.ok(
      rows.every((row) => row.primary_object_id && row.source_record_id),
    );
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
});
