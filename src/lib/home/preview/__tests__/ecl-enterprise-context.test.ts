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
      attributes_json: {
        ...item.attributes,
        source_as_of: item.source_as_of,
      },
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
    assert.equal(context.riskTriage.ownerIsConstant, true);
    assert.equal(context.riskTriage.attentionRisks.length, 24);
    assert.ok(context.riskTriage.attentionRisks.every((risk) =>
      risk.sourceRefs.length > 0 && risk.ownerRole && risk.functionName,
    ));
    assert.equal(context.riskTriage.attentionRisks[0].severity, "critical");
    assert.equal(context.riskTriage.attentionRisks[0].controlState, "unknown");
    assert.match(context.riskTriage.attentionRisks[0].title, /Recovery capacity gap/);
    assert.doesNotMatch(context.riskTriage.attentionRisks[0].title, /RISK-\d+/);
    const riskBrowser = buildTechnologyEstateFromHomeProjectionRows(rows)
      .recordTypes.find((recordType) => recordType.objectType === "risk_control");
    assert.ok(riskBrowser);
    assert.equal(riskBrowser.rows.length, 200);
    assert.ok(riskBrowser.rows.every((row) => row.controlOwner === context.riskTriage.attentionRisks[0].ownerRole));
    assert.equal(context.unlinkedPrograms.length, 1);
    assert.ok(context.unlinkedPrograms[0].sourceRefs.length > 0);
    assert.equal(context.valueProof.programCount, 24);
    assert.equal(context.valueProof.asOf, "2026-09-30");
    assert.equal(context.valueProof.approvedBudgetUsd, 302_800_000);
    assert.equal(context.valueProof.forecastUsd, 323_169_000);
    assert.equal(context.valueProof.overBudgetProgramCount, 15);
    assert.equal(context.valueProof.modelledClaimCount, 23);
    assert.equal(context.valueProof.unsupportedClaimCount, 1);
    assert.equal(context.valueProof.otherClaimCount, 0);
    assert.equal(context.valueProof.completedPeriodSpendLines, 360);
    assert.equal(context.valueProof.excludedSpendLines, 120);
    assert.equal(context.valueProof.priorities.length, 6);
    assert.equal(
      context.valueProof.priorities.reduce((sum, priority) => sum + priority.programCount, 0),
      24,
    );
    assert.ok(context.valueProof.priorities.every((priority) => priority.sourceRefs.length > 0));
    assert.equal(context.valueProof.priorities.at(-1)?.title, "No declared priority");
    assert.equal(context.valueProof.priorities.at(-1)?.programCount, 1);
    assert.equal(context.valueProof.priorities.at(-1)?.ownerRole, null);
    assert.ok(context.valueProof.priorities.slice(0, -1).every((priority) => priority.ownerRole));
    const total = (domain: string) =>
      context.segmentSpine.segments.reduce(
        (sum, segment) => sum + segment.domains[domain].count,
        0,
      ) + context.segmentSpine.unattributed[domain];
    assert.equal(total("applications"), 344);
    assert.equal(total("programs"), 24);
    assert.equal(total("spend"), 360);
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
    assert.deepEqual(fromServing?.valueProof, context.valueProof);
    const undatedRows = rows.map((row) =>
      row.row_type === "enterprise_profile"
        ? {
            ...row,
            display_payload_json: {
              ...row.display_payload_json,
              source_as_of: null,
            },
          }
        : row,
    );
    const undated = buildHomeEnterpriseContext(undatedRows, (row) => [
      `source-${row.row_key}`,
    ]);
    assert.equal(undated?.valueProof.completedPeriodSpendLines, 0);
    assert.equal(undated?.valueProof.excludedSpendLines, 480);
    assert.ok(undated?.segmentSpine.segments.every((segment) => segment.domains.spend === undefined));
    assert.ok(undated?.segmentSpine.shareVsRevenue.every((segment) => segment.shares.spend === undefined));
    const invalidDateRows = rows.map((row) =>
      row.row_type === "enterprise_profile"
        ? {
            ...row,
            display_payload_json: {
              ...row.display_payload_json,
              source_as_of: "2026-09-31",
            },
          }
        : row,
    );
    const invalidDateContext = buildHomeEnterpriseContext(invalidDateRows, (row) => [
      `source-${row.row_key}`,
    ]);
    assert.equal(invalidDateContext?.valueProof.completedPeriodSpendLines, 0);
    const missingActualRows = rows.map((row) =>
      row.row_key === "FIN-0008"
        ? {
            ...row,
            display_payload_json: {
              ...row.display_payload_json,
              actual_usd: null,
            },
          }
        : row,
    );
    const missingActual = buildHomeEnterpriseContext(missingActualRows, (row) => [
      `source-${row.row_key}`,
    ]);
    assert.equal(missingActual?.valueProof.completedPeriodSpendLines, 359);
    assert.equal(missingActual?.valueProof.excludedSpendLines, 121);
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
