import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  buildLoadRows,
  generatePack,
  sourceRows,
  type LoadTable,
} from "../load_synthetic_enterprise_v1";

/**
 * What each registered source version has already published: the bytes of its
 * source pack and adapter output, and the id of every row a load of it writes.
 * A load approval is bound to the source-set hash, and loaded rows keep their
 * ids, so none of these may move. A deliberate change is a new source version.
 *
 * Every value below was read from a load made before the loader resolved
 * identity from the registry, not computed by the code under test.
 */
const published = {
  v1: {
    source_set_hash:
      "5f1a7933630ffedbdb6997625bdb199e0435f903af440729c2939f976144272e",
    files: {
      "pack/enterprise_manifest.json":
        "e9767428591a17c7f89dd74b1b2db5b7e2e30a22cf611f07a21f6a872fe4698f",
      "pack/dense_source_room_manifest.csv":
        "95da98583bb4dd487991670c76a7790da63798d24372af03ee58088ee0371318",
      "adapter/normalized_enterprise.json":
        "fef0f2ae2959eeaadd467ef80201e6d905ed9d89a3aa54b42647acb7dfb9e019",
    },
    // Rows, and the sha256 of their ids sorted and joined one per line.
    rows: {
      source_file: [
        22,
        "ebc39dfea3f6f95de28850479a6690650978f705b57a01e61ef399cde97da28a",
      ],
      source_record: [
        16416,
        "98d7228f0566a97312a467c6fd68a9708744e132f9154f02513b167e74459636",
      ],
      object: [
        5759,
        "bc668921a060d631714201903b7ebca4976b99773a50865e0c3da634b505d459",
      ],
      relationship: [
        10619,
        "4e2a3b4fcc566f3a7b9b3f8dd4acb44e955748f34b97baeda6fe09da02b05d6b",
      ],
    },
    ids: {
      source_file: {
        SP03_CMDB: "411636d9-f696-47cb-bbc3-11b37a01e752",
        SP17_Relationships: "fdd13700-b3b9-498f-b980-e79f5bb4655a",
      },
      source_record: {
        "SP03_CMDB/APP-0001": "56719259-af41-47b7-9ee6-ddf0a8838ca2",
        "SP10_KPI_Operations/MET-0004-ALT":
          "a10f8416-c68c-43ee-a882-2f370545618d",
        "SP17_Relationships/REL-00001": "6a5a730b-6120-438c-b5c1-514ee5a8e80a",
      },
      object: {
        "APP-0001": "07cbc6ce-93fb-4c51-be3a-e0c137d50796",
        "APP-0025": "8f2da5bc-6657-4785-9b55-6dd49517b6ec",
        "ENT-0001": "4ab90ddd-67a6-4e27-854b-45891355f712",
        "VEN-0001": "0f0ec152-48e2-482b-a77f-e2d4434f1005",
      },
      relationship: {
        "REL-00001": "716ef13a-c3e7-408f-8ce1-bfe3a5aeba10",
        "REL-10000": "34ea04cf-4176-4423-bfa8-bb5f4b86ce89",
      },
    },
    // One relationship's ends, which are object ids.
    edge: {
      "REL-00001": [
        "4ab90ddd-67a6-4e27-854b-45891355f712",
        "048f9ad4-c94d-4dd0-898e-07e6a2cae1a2",
      ],
    },
  },
  v2: {
    source_set_hash:
      "deb504f6d34d3381dd2f09d323f352302d106076c96fa182b5d485084fd93829",
    files: {
      "pack/enterprise_manifest.json":
        "b3504e844297248f523e7813b158519c2faa1564723ba39a25cefbe18de11e24",
      "pack/dense_source_room_manifest.csv":
        "439ff8a13343db8fbe46158dfb1779ac23fdecc0399987a936e45ed026238fdb",
      "adapter/normalized_enterprise.json":
        "415c37faf5cd19ffa216f17eee420bcba62c43a0eec49d372d154259d1caa742",
    },
    rows: {
      source_file: [
        22,
        "76b2b3fc2f9f933b100545cbff2611b57d1b3177a62843ca385df4da1a5c8e61",
      ],
      source_record: [
        17844,
        "7ef45787a1810efc79527f52fa3454276efd3b34587ab6bc283cdfdbe0d12e89",
      ],
      object: [
        6079,
        "7067b154099f640cf537e66e62a047c50925005dce102c7ad8e309630b7fda85",
      ],
      relationship: [
        11727,
        "bf10da1ed3a448b7df542ddb878c38af34cdd3afaf7dadd7c6f066993b778fe1",
      ],
    },
    ids: {
      source_file: {
        SP03_CMDB: "57894be4-226f-4757-9cf3-00b9e57ec815",
        SP17_Relationships: "51f4f836-605a-4e51-aa2e-e733bc47b755",
      },
      source_record: {
        "SP03_CMDB/APP-0001": "df79631e-525d-443d-a57f-7cac97e8c6e7",
        "SP03_CMDB/APP-0751": "6ad25298-18b8-4f0f-826a-a5a59cc6a7a2",
        "SP10_KPI_Operations/MET-0004-ALT":
          "75b3120e-0b2e-4b41-81cf-259d0aa8ade8",
        "SP17_Relationships/REL-00001": "54a5999a-104e-4976-bb8d-d86ea44a01bf",
      },
      object: {
        "APP-0001": "8ecd78c6-4a53-4815-b6b2-bae4f63a0cb6",
        "APP-0025": "f40be319-4216-4ad6-8ada-caa8ad393a8f",
        "APP-0751": "a6291f59-43ad-4467-b335-0aa740a92233",
        "ENT-0001": "57fbd810-027c-4f26-b95a-8db79c9369e9",
        "VEN-0001": "182e7c76-adac-439b-9071-94a40e1dc23b",
      },
      relationship: {
        "REL-00001": "d36558ce-b6c3-492a-8c6c-d466a2fa65c8",
        "REL-10000": "40f39623-d927-4fb7-905c-055f04df9301",
      },
    },
    edge: {
      "REL-00001": [
        "57fbd810-027c-4f26-b95a-8db79c9369e9",
        "24c3ee36-c92d-42e7-be5a-7f3e8bd0d05f",
      ],
    },
  },
} as const;

const sha256 = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");

/** The name a pinned id is listed under, per table. */
const pinnedName: Record<LoadTable, (row: Record<string, unknown>) => string> =
  {
    source_file: (row) => String(row.source_owner),
    source_record: (row) => `${row.record_type}/${row.native_id}`,
    object: (row) => String(row.object_key),
    relationship: (row) =>
      String(
        (row.attributes_json as Record<string, unknown>).native_relationship_id,
      ),
  };

for (const [version, pinned] of Object.entries(published)) {
  test(`source version ${version} still publishes the same bytes and the same row ids`, async () => {
    const pack = await generatePack(version);
    try {
      assert.equal(pack.manifest.source_set_hash, pinned.source_set_hash);
      assert.equal(pack.normalized.source_set_hash, pinned.source_set_hash);
      for (const [file, hash] of Object.entries(pinned.files)) {
        assert.equal(
          sha256(await readFile(path.join(pack.dir, file))),
          hash,
          `${version} ${file}`,
        );
      }
      // Reads every source file and refuses one whose bytes are not the hash
      // the manifest lists, which is what the source-set hash is made of.
      const nativeRows = await sourceRows(pack);
      const rows = buildLoadRows(pack, nativeRows, new Map());
      for (const table of Object.keys(pinned.rows) as LoadTable[]) {
        const [count, digest] = pinned.rows[table];
        const ids = rows[table].map((row) => row.id).sort();
        assert.equal(ids.length, count, `${version} ${table} rows`);
        assert.equal(
          new Set(ids).size,
          count,
          `${version} ${table} ids repeat`,
        );
        assert.equal(
          sha256(`${ids.join("\n")}\n`),
          digest,
          `${version} ${table}: a persisted row id moved`,
        );
        const byName = new Map(
          rows[table].map((row) => [pinnedName[table](row), row.id]),
        );
        for (const [name, id] of Object.entries(pinned.ids[table])) {
          assert.equal(byName.get(name), id, `${version} ${table} ${name}`);
        }
      }
      for (const [name, ends] of Object.entries(pinned.edge)) {
        const edge = rows.relationship.find(
          (row) => pinnedName.relationship(row) === name,
        );
        assert.deepEqual(
          [edge?.from_object_id, edge?.to_object_id],
          ends,
          `${version} relationship ${name} ends`,
        );
      }
    } finally {
      await rm(pack.dir, { recursive: true, force: true });
    }
  });
}
