import assert from "node:assert/strict";
import { test } from "@jest/globals";
import { rm } from "node:fs/promises";
import { generatePack } from "../../../../../scripts/ecl/load_synthetic_enterprise_v1";
import { buildSyntheticHomeRows } from "../../../../../scripts/ecl/synthetic_enterprise_home_rows";
import { buildHomeEnterpriseContext } from "../ecl-enterprise-context";
import {
  buildHomeReviewBundleFromEclProjectionRows,
  buildTechnologyEstateFromHomeProjectionRows,
  type HomeProjectionRow,
} from "../ecl-projection-bundle";
import { getHomeReviewBundle } from "../golden-snapshot";

test("V2 enterprise context reuses declared IDs and preserves shared/unresolved work", async () => {
  const pack = await generatePack("v2");
  try {
    const canonical = pack.normalized.objects.map((item) => ({
      id: item.id,
      object_key: item.id,
      object_type: item.type,
      display_name: item.name,
      source_record_id: `source-${item.id}`,
      value_state: "known",
      attributes_json: item.attributes,
    }));
    const rows: HomeProjectionRow[] = buildSyntheticHomeRows(canonical).map(
      (row) => ({
        page_key: row.page_key,
        row_key: row.row_key,
        row_type: row.row_type,
        title: row.title,
        summary: row.summary,
        display_payload_json: row.display_payload_json,
      }),
    );
    const context = buildHomeEnterpriseContext(rows, (row) => [
      `source-${row.row_key}`,
    ]);
    assert.ok(context);
    assert.equal(context.evidenceClass, "synthetic_reference");
    assert.equal(context.segmentSpine.segments.length, 3);
    assert.equal(context.functions.length, 14);
    assert.equal(context.sharedFunctionIds.length, 6);
    assert.equal(context.priorities.length, 5);
    assert.equal(context.riskTriage.totalRisks, 200);
    assert.equal(context.riskTriage.highOrCritical, 62);
    assert.equal(context.riskTriage.partialControl, 19);
    assert.equal(context.riskTriage.unknownControl, 5);
    assert.equal(context.riskTriage.attentionRisks.length, 24);
    assert.ok(context.riskTriage.attentionRisks.every((risk) =>
      risk.sourceRefs.length > 0 && risk.ownerRole && risk.functionName,
    ));
    assert.equal(context.riskTriage.attentionRisks[0].severity, "critical");
    assert.equal(context.riskTriage.attentionRisks[0].controlState, "unknown");
    const riskBrowser = buildTechnologyEstateFromHomeProjectionRows(rows)
      .recordTypes.find((recordType) => recordType.objectType === "risk_control");
    assert.ok(riskBrowser);
    assert.equal(riskBrowser.rows.length, 200);
    assert.ok(riskBrowser.rows.every((row) => row.controlOwner === context.riskTriage.attentionRisks[0].ownerRole));
    assert.equal(context.unlinkedPrograms.length, 1);
    assert.ok(context.unlinkedPrograms[0].sourceRefs.length > 0);
    const total = (domain: string) =>
      context.segmentSpine.segments.reduce(
        (sum, segment) => sum + segment.domains[domain].count,
        0,
      ) + context.segmentSpine.unattributed[domain];
    assert.equal(total("applications"), 344);
    assert.equal(total("programs"), 24);
    assert.equal(total("spend"), 480);
    assert.equal(total("risks"), 200);
    assert.equal(
      context.segmentSpine.unresolvedByDomain.applications,
      undefined,
    );
    assert.equal(context.excludedUncitedRows, 0);
    assert.ok(context.profile.sourceRefs.length > 0);
    assert.ok(
      context.priorities.every((priority) => priority.sourceRefs.length > 0),
    );
    assert.equal(
      buildHomeEnterpriseContext(rows, () => []),
      null,
    );
    const servingRows = rows.map((row) => ({
      ...row,
      display_payload_json: { display_payload_json: row.display_payload_json },
    }));
    const fromServing = buildHomeEnterpriseContext(servingRows, (row) => [
      `source-${row.row_key}`,
    ]);
    assert.deepEqual(fromServing?.segmentSpine, context.segmentSpine);
    assert.deepEqual(fromServing?.priorities, context.priorities);
    assert.deepEqual(fromServing?.riskTriage, context.riskTriage);
    const sourceHash = "a".repeat(64);
    const bundleRows = servingRows
      .filter((row) =>
        ["enterprise_profile", "business_segment", "business_function"].includes(
          row.row_type,
        ),
      )
      .map((row, index) => ({
        ...row,
        projection_entry_id: `entry-${index}`,
        source_hash: sourceHash,
        source_refs_json: [`source-${row.row_key}`],
        admission_status: "admitted",
      }));
    const verifiedRefs = new Map(
      bundleRows.map((row) => [
        row.projection_entry_id,
        new Map([[sourceHash, new Set([`source-${row.row_key}`])]]),
      ]),
    );
    const base = getHomeReviewBundle("meridian-health");
    assert.ok(base);
    const bundle = buildHomeReviewBundleFromEclProjectionRows(
      base,
      bundleRows,
      pack.manifest.assessment_id,
      verifiedRefs,
    );
    assert.equal(
      bundle.thesis.signalPacket.homeEnterpriseContext?.segmentSpine.segments.length,
      3,
    );
    assert.equal(
      buildHomeEnterpriseContext(
        servingRows.filter((row) => row.row_type !== "enterprise_profile"),
        (row) => [`source-${row.row_key}`],
      ),
      null,
    );
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
});
