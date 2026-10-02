import assert from "node:assert/strict";
import { afterAll, beforeAll, describe, test } from "@jest/globals";
import { rm } from "node:fs/promises";
import {
  generatePack,
  type GeneratedPack,
} from "../../../../../scripts/ecl/load_synthetic_enterprise_v1";
import { buildSyntheticHomeRows } from "../../../../../scripts/ecl/synthetic_enterprise_home_rows";
import {
  buildHomeEnterpriseContext,
  type HomeEnterpriseContext,
} from "../ecl-enterprise-context";
import {
  buildHomeReviewBundleFromEclProjectionRows,
  buildTechnologyEstateFromHomeProjectionRows,
  type HomeProjectionRow,
} from "../ecl-projection-bundle";
import {
  HOME_PREVIEW_TENANT_KEYS,
  getHomeReviewBundle,
} from "../golden-snapshot";

/**
 * The enterprise context, held to the generated source it is read from.
 *
 * Every expected figure below is counted here from the generated objects' own declared
 * identifiers -- not read back from the builder under test -- and the figures a reader sees first
 * are also written out as numbers. A count that is only compared with itself, or a total that is
 * the same however its parts are attributed, proves the builder ran and nothing about what it said.
 */

type SourceObject = GeneratedPack["normalized"]["objects"][number];

let pack: GeneratedPack;
let rows: HomeProjectionRow[];
let context: HomeEnterpriseContext;

const cite = (row: HomeProjectionRow) => [`source-${row.row_key}`];
const attribute = (object: SourceObject, key: string) =>
  String(object.attributes[key] ?? "").trim();
const objectsOf = (type: string) =>
  pack.normalized.objects.filter((object) => object.type === type);

/** Rows with one row's payload replaced, for asking what the builder does when a value is absent. */
function edited(
  matches: (row: HomeProjectionRow) => boolean,
  patch: Record<string, unknown>,
  limit = Number.POSITIVE_INFINITY,
): HomeProjectionRow[] {
  let changed = 0;
  return rows.map((row) =>
    matches(row) && changed++ < limit
      ? {
          ...row,
          display_payload_json: {
            ...(row.display_payload_json ?? {}),
            ...patch,
          },
        }
      : row,
  );
}

function build(input: HomeProjectionRow[] = rows, refs = cite) {
  return buildHomeEnterpriseContext(input, refs);
}

function built(input: HomeProjectionRow[] = rows, refs = cite) {
  const result = build(input, refs);
  assert.ok(result, "the enterprise context was not built");
  return result;
}

/** Segment ids in the order the source declares them, and each function's declared segment. */
function declaredStructure() {
  const segmentIds = objectsOf("business_segment").map((segment) =>
    attribute(segment, "segment_id"),
  );
  const segmentOfFunction = new Map(
    objectsOf("business_function").map((fn) => [
      attribute(fn, "function_id"),
      attribute(fn, "business_segment_id"),
    ]),
  );
  return { segmentIds, segmentOfFunction };
}

/** One object type split by the segment of the function each object names. */
function expectedSplit(
  type: string | string[],
  functionKey: string,
  amountKey?: string,
  include: (object: SourceObject) => boolean = () => true,
) {
  const { segmentIds, segmentOfFunction } = declaredStructure();
  const types = Array.isArray(type) ? type : [type];
  const objects = types.flatMap(objectsOf).filter(include);
  const inSegment = (segmentId: string) =>
    objects.filter(
      (object) =>
        segmentOfFunction.get(attribute(object, functionKey)) === segmentId,
    );
  const amount = (list: SourceObject[]) =>
    list.reduce(
      (sum, object) => sum + Number(attribute(object, amountKey!)),
      0,
    );
  return {
    total: objects.length,
    perSegment: segmentIds.map((segmentId) => inSegment(segmentId).length),
    underFunctionsWithoutSegment: inSegment("").length,
    amountPerSegment: amountKey
      ? segmentIds.map((segmentId) => amount(inSegment(segmentId)))
      : undefined,
  };
}

function actualSplit(domain: string, from = context) {
  return {
    perSegment: from.segmentSpine.segments.map(
      (segment) => segment.domains[domain].count,
    ),
    outsideSegments: from.segmentSpine.unattributed[domain],
    amountPerSegment: from.segmentSpine.segments.map(
      (segment) => segment.domains[domain].money,
    ),
  };
}

beforeAll(async () => {
  pack = await generatePack("v2");
  rows = buildSyntheticHomeRows(
    pack.normalized.objects.map((item) => ({
      id: item.id,
      object_key: item.id,
      object_type: item.type,
      display_name: item.name,
      source_record_id: `source-${item.id}`,
      value_state: "known",
      attributes_json: item.attributes,
    })),
  ).map((row) => ({
    page_key: row.page_key,
    row_key: row.row_key,
    row_type: row.row_type,
    title: row.title,
    summary: row.summary,
    display_payload_json: row.display_payload_json,
  }));
  context = built();
}, 60_000);

afterAll(async () => {
  if (pack) await rm(pack.dir, { recursive: true, force: true });
});

describe("the enterprise context read from the generated source", () => {
  test("declares its evidence class and builds only for the synthetic reference basis", () => {
    assert.equal(context.evidenceClass, "synthetic_reference");
    const isProfile = (row: HomeProjectionRow) =>
      row.row_type === "enterprise_profile";

    // Any other declared basis, or none, is not this context's to describe.
    for (const business_model_basis of [
      "client_declared_and_attested",
      "synthetic_reference",
      "",
    ]) {
      assert.equal(build(edited(isProfile, { business_model_basis })), null);
    }
    assert.equal(build(edited(isProfile, { business_model: "" })), null);
    // Exactly one profile: two are two enterprises, and none is no enterprise.
    const profile = rows.find(isProfile);
    assert.ok(profile);
    assert.equal(build([...rows, { ...profile, row_key: "ENT-EXTRA" }]), null);
    assert.equal(build(rows.filter((row) => !isProfile(row))), null);

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
    // A profile nothing links to a source is not a profile the page may speak from.
    assert.equal(
      build(rows, (row) => (isProfile(row) ? [] : cite(row))),
      null,
    );
    assert.equal(
      build(rows, () => []),
      null,
    );
    assert.equal(
      build(rows.filter((row) => row.row_type !== "business_segment")),
      null,
    );
    assert.equal(
      build(rows.filter((row) => row.row_type !== "business_function")),
      null,
    );
    // A function that names a segment the record does not hold is a broken record, not a gap.
    const firstFunction = rows.find(
      (row) => row.row_type === "business_function",
    );
    assert.ok(firstFunction);
    assert.equal(
      build(
        edited((row) => row === firstFunction, {
          business_segment_key: "SEG-NOT-IN-RECORD",
        }),
      ),
      null,
    );
  });

  test("reads the business model and revenue as the source declares them", () => {
    const [enterprise] = objectsOf("enterprise");
    assert.equal(
      context.profile.businessModel,
      attribute(enterprise, "business_model"),
    );
    assert.equal(
      context.profile.annualRevenueUsd,
      Number(attribute(enterprise, "annual_revenue_usd")),
    );
    assert.equal(context.profile.annualRevenueUsd, 20_000_000_000);
    assert.ok(context.profile.sourceRefs.length > 0);

    const segments = objectsOf("business_segment");
    assert.equal(context.segmentSpine.segments.length, segments.length);
    assert.equal(segments.length, 3);
    for (const [index, segment] of segments.entries()) {
      const key = attribute(segment, "segment_id");
      const row = context.segmentSpine.segments[index];
      assert.equal(row.segmentKey, key);
      assert.equal(row.segmentName, segment.name);
      assert.equal(row.pnlOwnerRole, attribute(segment, "pnl_owner_role"));
      assert.equal(row.revenueUsd, Number(attribute(segment, "revenue_usd")));
      assert.equal(
        row.revenueSharePct,
        Number(attribute(segment, "revenue_share_pct")),
      );
      assert.equal(
        context.segmentFacts[key].revenueUsd,
        Number(attribute(segment, "revenue_usd")),
      );
      assert.equal(
        context.segmentFacts[key].revenueSharePct,
        Number(attribute(segment, "revenue_share_pct")),
      );
      assert.ok(context.segmentFacts[key].sourceRefs.length > 0);
    }
    assert.deepEqual(
      context.segmentSpine.segments.map(
        (segment) => context.segmentFacts[segment.segmentKey].revenueUsd,
      ),
      [7_600_000_000, 8_800_000_000, 3_600_000_000],
    );
    assert.deepEqual(
      context.segmentSpine.segments.map(
        (segment) => context.segmentFacts[segment.segmentKey].revenueSharePct,
      ),
      [38, 44, 18],
    );
  });

  test("attributes each family to a segment through the function it names", () => {
    // [domain, generated object type(s), the field that names the function, which objects]
    const families: Array<
      [string, string | string[], string, ((object: SourceObject) => boolean)?]
    > = [
      ["applications", "application", "business_function_id"],
      ["programs", "program", "sponsor_function_id"],
      ["risks", "risk", "business_function_id"],
      ["data assets", "data_product", "function_id"],
      [
        "platforms",
        ["infrastructure", "data_platform"],
        "business_function_id",
      ],
      [
        "workforce roles",
        "persona",
        "function_id",
        (persona) => Boolean(attribute(persona, "role_id")),
      ],
      ["KPIs", "metric", "business_function_id"],
      ["data flows", "data_flow", "source_function_id"],
      ["AI use cases", "ai_use_case", "business_function_id"],
    ];
    for (const [domain, type, functionKey, include] of families) {
      const expected = expectedSplit(type, functionKey, undefined, include);
      const actual = actualSplit(domain);
      assert.deepEqual(actual.perSegment, expected.perSegment, domain);
      assert.equal(
        actual.outsideSegments,
        expected.underFunctionsWithoutSegment,
        domain,
      );
      // Nothing is lost between the segments and the remainder.
      assert.equal(
        actual.perSegment.reduce((sum, count) => sum + count, 0) +
          actual.outsideSegments,
        expected.total,
        domain,
      );
      assert.deepEqual(
        context.attributionGaps[domain],
        {
          functionWithoutSegment: expected.underFunctionsWithoutSegment,
          functionNotInRecord: 0,
          noFunctionRecorded: 0,
        },
        domain,
      );
    }
    assert.deepEqual(context.segmentSpine.unresolvedByDomain, {});

    // The figures on the page, as numbers.
    assert.deepEqual(actualSplit("applications").perSegment, [105, 67, 36]);
    assert.equal(actualSplit("applications").outsideSegments, 136);
    assert.deepEqual(actualSplit("programs").perSegment, [4, 7, 2]);
    assert.equal(actualSplit("programs").outsideSegments, 11);
    assert.deepEqual(actualSplit("risks").perSegment, [45, 35, 33]);
    assert.equal(actualSplit("risks").outsideSegments, 87);
    // Applications also declare their own segment. The two declarations agree.
    assert.deepEqual(
      actualSplit("applications").perSegment,
      declaredStructure().segmentIds.map(
        (segmentId) =>
          objectsOf("application").filter(
            (application) => attribute(application, "segment_id") === segmentId,
          ).length,
      ),
    );
    // Data assets name their function by a different field than applications do. A join on the
    // field they do not carry attributes none of them and reports nothing wrong.
    assert.deepEqual(actualSplit("data assets").perSegment, [92, 47, 47]);
    assert.equal(actualSplit("data assets").outsideSegments, 174);
  });

  test("totals spend from the amounts the lines record, and only those", () => {
    const expected = expectedSplit(
      "spend_line",
      "business_function_id",
      "actual_usd",
    );
    const actual = actualSplit("spend");
    assert.deepEqual(actual.perSegment, expected.perSegment);
    assert.equal(actual.outsideSegments, expected.underFunctionsWithoutSegment);
    assert.deepEqual(actual.amountPerSegment, expected.amountPerSegment);
    assert.deepEqual(actual.perSegment, [142, 75, 66]);
    assert.deepEqual(
      actual.amountPerSegment,
      [612_255_573, 310_572_708, 281_142_585],
    );
    assert.equal(context.unrecordedSpendAmounts, 0);

    // A hundred lines with no amount: still counted, adding nothing, and said to be so.
    const withoutAmounts = built(
      edited((row) => row.row_type === "spend_line", { actual_usd: "" }, 100),
    );
    assert.equal(withoutAmounts.unrecordedSpendAmounts, 100);
    assert.deepEqual(
      actualSplit("spend", withoutAmounts).perSegment,
      [142, 75, 66],
    );
    assert.ok(
      actualSplit("spend", withoutAmounts).amountPerSegment.every(
        (amount, index) =>
          typeof amount === "number" &&
          amount < expected.amountPerSegment![index],
      ),
    );
    // No line records an amount: no total at all, rather than a total of zero.
    const noAmounts = built(
      edited((row) => row.row_type === "spend_line", { actual_usd: "" }),
    );
    assert.equal(noAmounts.unrecordedSpendAmounts, expected.total);
    assert.deepEqual(actualSplit("spend", noAmounts).amountPerSegment, [
      undefined,
      undefined,
      undefined,
    ]);
  });

  test("counts each function's applications, programs and risks", () => {
    const functions = objectsOf("business_function");
    assert.equal(context.functions.length, functions.length);
    assert.equal(functions.length, 14);
    const countNaming = (type: string, key: string, functionId: string) =>
      objectsOf(type).filter((object) => attribute(object, key) === functionId)
        .length;
    for (const fn of functions) {
      const functionId = attribute(fn, "function_id");
      const actual = context.functions.find(
        (candidate) => candidate.functionId === functionId,
      );
      assert.ok(actual, functionId);
      assert.equal(actual.title, fn.name);
      assert.equal(
        actual.segmentKey,
        attribute(fn, "business_segment_id") || null,
      );
      assert.equal(actual.executiveOwner, attribute(fn, "executive_owner"));
      assert.equal(
        actual.applicationCount,
        countNaming("application", "business_function_id", functionId),
        functionId,
      );
      assert.equal(
        actual.programCount,
        countNaming("program", "sponsor_function_id", functionId),
        functionId,
      );
      assert.equal(
        actual.riskCount,
        countNaming("risk", "business_function_id", functionId),
        functionId,
      );
    }
    assert.deepEqual(
      context.functions.map((fn) => [
        fn.applicationCount,
        fn.programCount,
        fn.riskCount,
      ]),
      [
        [36, 2, 18],
        [29, 1, 6],
        [20, 1, 8],
        [20, 0, 13],
        [39, 6, 18],
        [28, 1, 17],
        [16, 1, 13],
        [20, 1, 20],
        [21, 3, 15],
        [31, 4, 16],
        [29, 1, 17],
        [16, 2, 10],
        [22, 1, 18],
        [17, 0, 11],
      ],
    );
    // Functions that declare no segment are listed, by the identifier the source gives them.
    assert.deepEqual(
      context.sharedFunctionIds,
      functions
        .filter((fn) => !attribute(fn, "business_segment_id"))
        .map((fn) => attribute(fn, "function_id"))
        .sort(),
    );
    assert.equal(context.sharedFunctionIds.length, 6);
  });

  test("counts each priority's programs, programs at risk and measures", () => {
    const priorities = objectsOf("strategic_priority");
    assert.equal(context.priorities.length, priorities.length);
    assert.equal(priorities.length, 5);
    const ownerRole = new Map(
      objectsOf("persona")
        .filter((persona) => attribute(persona, "owner_id"))
        .map((persona) => [
          attribute(persona, "owner_id"),
          attribute(persona, "owner_role"),
        ]),
    );
    for (const priority of priorities) {
      const priorityId = attribute(priority, "priority_id");
      const programs = objectsOf("program").filter(
        (program) => attribute(program, "priority_id") === priorityId,
      );
      const actual = context.priorities.find(
        (candidate) => candidate.priorityId === priorityId,
      );
      assert.ok(actual, priorityId);
      assert.equal(actual.title, priority.name);
      assert.equal(actual.targetOutcome, attribute(priority, "target_outcome"));
      assert.equal(
        actual.ownerRole,
        ownerRole.get(attribute(priority, "owner_id")),
      );
      assert.ok(actual.ownerRole);
      assert.equal(actual.programCount, programs.length, priorityId);
      assert.equal(
        actual.atRiskProgramCount,
        programs.filter((program) => attribute(program, "status") === "at_risk")
          .length,
        priorityId,
      );
      assert.equal(
        actual.metricCount,
        objectsOf("metric").filter(
          (metric) => attribute(metric, "priority_id") === priorityId,
        ).length,
        priorityId,
      );
      assert.ok(actual.sourceRefs.length > 0);
    }
    assert.deepEqual(
      context.priorities.map((priority) => [
        priority.programCount,
        priority.atRiskProgramCount,
        priority.metricCount,
      ]),
      [
        [4, 0, 11],
        [6, 2, 10],
        [5, 0, 4],
        [4, 1, 6],
        [4, 0, 5],
      ],
    );

    // A program that names no priority in the record is named, not folded into one.
    const priorityIds = new Set(
      priorities.map((priority) => attribute(priority, "priority_id")),
    );
    const unlinked = objectsOf("program").filter(
      (program) => !priorityIds.has(attribute(program, "priority_id")),
    );
    assert.deepEqual(
      context.unlinkedPrograms.map((program) => program.programId),
      unlinked.map((program) => attribute(program, "program_id")),
    );
    assert.equal(context.unlinkedPrograms.length, 1);
    assert.equal(context.unlinkedPrograms[0].title, unlinked[0].name);
    assert.ok(context.unlinkedPrograms[0].sourceRefs.length > 0);
    assert.equal(
      context.priorities.reduce(
        (sum, priority) => sum + priority.programCount,
        0,
      ) + context.unlinkedPrograms.length,
      objectsOf("program").length,
    );
  });

  test("leaves out a row with no source link, and says how many", () => {
    assert.equal(context.excludedUncitedRows, 0);
    const unlinked = new Set([
      ...rows
        .filter((row) => row.row_type === "application")
        .slice(0, 5)
        .map((row) => row.row_key),
      ...rows
        .filter((row) => row.row_type === "program")
        .slice(0, 1)
        .map((row) => row.row_key),
    ]);
    const partial = built(rows, (row) =>
      unlinked.has(row.row_key) ? [] : cite(row),
    );
    assert.equal(partial.excludedUncitedRows, 6);
    const total = (domain: string) =>
      actualSplit(domain, partial).perSegment.reduce(
        (sum, count) => sum + count,
        0,
      ) + actualSplit(domain, partial).outsideSegments;
    assert.equal(total("applications"), objectsOf("application").length - 5);
    assert.equal(total("programs"), objectsOf("program").length - 1);

    // What a narrative build writes about the record is not part of the record. It links to no
    // source by design, and is not a row that was left out.
    const withNarrativeRows = built(
      [
        ...rows,
        ...["summary", "chapter_claim", "story_plan"].map((row_type) => ({
          page_key: "executive_brief",
          row_key: `narrative-${row_type}`,
          row_type,
          title: "Written about the record",
          summary: null,
          display_payload_json: {},
        })),
      ],
      (row) => (row.page_key === "executive_brief" ? [] : cite(row)),
    );
    assert.equal(withNarrativeRows.excludedUncitedRows, 0);
  });

  test("keeps a value the source does not record apart from zero", () => {
    const lastSegment = attribute(
      objectsOf("business_segment")[2],
      "segment_id",
    );
    const withoutRevenue = built(
      edited((row) => row.row_key === lastSegment, {
        revenue_usd: "",
        revenue_share_pct: "",
      }),
    );
    assert.equal(withoutRevenue.segmentFacts[lastSegment].revenueUsd, null);
    assert.equal(
      withoutRevenue.segmentFacts[lastSegment].revenueSharePct,
      null,
    );
    // No comparison is offered against a revenue share nobody recorded.
    assert.deepEqual(
      withoutRevenue.segmentSpine.shareVsRevenue.map(
        (entry) => entry.segmentKey,
      ),
      declaredStructure().segmentIds.slice(0, 2),
    );
    assert.equal(context.segmentSpine.shareVsRevenue.length, 3);
    // The other segments are untouched.
    assert.equal(
      withoutRevenue.segmentFacts[declaredStructure().segmentIds[0]].revenueUsd,
      7_600_000_000,
    );

    const withoutAnnualRevenue = built(
      edited((row) => row.row_type === "enterprise_profile", {
        annual_revenue_usd: "",
      }),
    );
    assert.equal(withoutAnnualRevenue.profile.annualRevenueUsd, null);

    const priority = rows.find((row) => row.row_type === "priority");
    assert.ok(priority);
    const withoutOwner = built(
      edited((row) => row === priority, { owner_id: "OWNER-NOT-IN-RECORD" }),
    );
    assert.equal(
      withoutOwner.priorities.find(
        (candidate) => candidate.rowKey === priority.row_key,
      )?.ownerRole,
      null,
    );
  });

  test("tells a function with no segment from a link that does not resolve", () => {
    const isApplication = (row: HomeProjectionRow) =>
      row.row_type === "application";
    const expected = expectedSplit("application", "business_function_id");

    const namingUnknownFunction = built(
      edited(isApplication, { business_function_id: "FUNC-NOT-IN-RECORD" }, 7),
    );
    const namingNoFunction = built(
      edited(isApplication, { business_function_id: "" }, 3),
    );
    for (const [changed, gap] of [
      [
        namingUnknownFunction,
        { functionNotInRecord: 7, noFunctionRecorded: 0 },
      ],
      [namingNoFunction, { functionNotInRecord: 0, noFunctionRecorded: 3 }],
    ] as const) {
      const gaps = changed.attributionGaps.applications;
      assert.equal(gaps.functionNotInRecord, gap.functionNotInRecord);
      assert.equal(gaps.noFunctionRecorded, gap.noFunctionRecorded);
      // The three reasons account for everything outside the segments, and no more.
      assert.equal(
        gaps.functionWithoutSegment +
          gaps.functionNotInRecord +
          gaps.noFunctionRecorded,
        changed.segmentSpine.unattributed.applications,
      );
      assert.ok(
        gaps.functionWithoutSegment <= expected.underFunctionsWithoutSegment,
      );
    }
    assert.deepEqual(
      namingUnknownFunction.segmentSpine.unresolvedByDomain.applications,
      ["FUNC-NOT-IN-RECORD"],
    );
  });

  test("joins on the identifiers the rows declare, not on the keys the rows are stored under", () => {
    // Every row stored under a key that says nothing, and one program whose declared identifier
    // differs from the key it had. The figures and the identifiers handed on must not move.
    const unlinkedKey = context.unlinkedPrograms[0].rowKey;
    const rekeyed = rows.map((row, index) => ({
      ...row,
      row_key: `stored-${index}`,
      display_payload_json:
        row.row_key === unlinkedKey
          ? {
              ...(row.display_payload_json ?? {}),
              program_id: "PROGRAM-AS-DECLARED",
            }
          : row.display_payload_json,
    }));
    const fromRekeyed = built(rekeyed);
    assert.deepEqual(fromRekeyed.segmentSpine, context.segmentSpine);
    assert.deepEqual(fromRekeyed.attributionGaps, context.attributionGaps);
    assert.deepEqual(
      fromRekeyed.functions.map((fn) => [
        fn.functionId,
        fn.applicationCount,
        fn.programCount,
        fn.riskCount,
      ]),
      context.functions.map((fn) => [
        fn.functionId,
        fn.applicationCount,
        fn.programCount,
        fn.riskCount,
      ]),
    );
    assert.deepEqual(
      fromRekeyed.priorities.map((priority) => [
        priority.priorityId,
        priority.programCount,
        priority.atRiskProgramCount,
        priority.metricCount,
      ]),
      context.priorities.map((priority) => [
        priority.priorityId,
        priority.programCount,
        priority.atRiskProgramCount,
        priority.metricCount,
      ]),
    );
    assert.deepEqual(
      fromRekeyed.priorities.map((priority) => priority.priorityId),
      objectsOf("strategic_priority").map((priority) =>
        attribute(priority, "priority_id"),
      ),
    );
    assert.deepEqual(
      fromRekeyed.unlinkedPrograms.map((program) => program.programId),
      ["PROGRAM-AS-DECLARED"],
    );
    assert.ok(fromRekeyed.unlinkedPrograms[0].rowKey.startsWith("stored-"));
  });

  test("reads the same context from rows shaped as the serving view returns them", () => {
    const servingRows = rows.map((row) => ({
      ...row,
      display_payload_json: { display_payload_json: row.display_payload_json },
    }));
    const fromServing = built(servingRows);
    assert.deepEqual(fromServing.segmentSpine, context.segmentSpine);
    assert.deepEqual(fromServing.priorities, context.priorities);
    assert.deepEqual(fromServing.functions, context.functions);
    assert.deepEqual(fromServing.attributionGaps, context.attributionGaps);
    assert.deepEqual(fromServing.riskTriage, context.riskTriage);
  });
});

describe("the enterprise context on the served Home bundle", () => {
  const sourceHash = "a".repeat(64);
  const admitted = (input: HomeProjectionRow[]) =>
    input.map((row, index) => ({
      ...row,
      display_payload_json: { display_payload_json: row.display_payload_json },
      projection_entry_id: `entry-${index}`,
      source_hash: sourceHash,
      source_refs_json: [`source-${row.row_key}`],
      admission_status: "admitted",
    }));
  const linksFor = (input: HomeProjectionRow[]) =>
    new Map(
      input.map((row) => [
        row.projection_entry_id as string,
        new Map([[sourceHash, new Set([`source-${row.row_key}`])]]),
      ]),
    );
  const servedBundle = (
    input: HomeProjectionRow[],
    links = linksFor(input),
  ) => {
    const base = getHomeReviewBundle(HOME_PREVIEW_TENANT_KEYS[0]);
    assert.ok(base);
    return buildHomeReviewBundleFromEclProjectionRows(
      base,
      input,
      pack.manifest.assessment_id,
      links,
    );
  };
  const served = (
    input: HomeProjectionRow[],
    links = linksFor(input),
  ): HomeEnterpriseContext | null | undefined =>
    servedBundle(input, links).thesis.signalPacket.homeEnterpriseContext;
  const profileIsAFact = (input: HomeProjectionRow[]) =>
    servedBundle(input).thesis.signalPacket.contextItems.some(
      (item) =>
        item.domains.includes("enterprise_profile") &&
        (item.evidenceRefs ?? []).length > 0,
    );

  test("is attached with the same figures the builder gives", () => {
    const attached = served(admitted(rows));
    assert.ok(attached);
    assert.deepEqual(attached.segmentSpine, context.segmentSpine);
    assert.deepEqual(
      attached.priorities.map((priority) => priority.programCount),
      [4, 6, 5, 4, 4],
    );
    assert.equal(attached.excludedUncitedRows, 0);
  });

  test("is withheld when the profile is missing or not admitted", () => {
    const all = admitted(rows);
    assert.equal(
      served(all.filter((row) => row.row_type !== "enterprise_profile")),
      null,
    );
    assert.equal(
      served(
        all.map((row) =>
          row.row_type === "enterprise_profile"
            ? { ...row, admission_status: "pending" }
            : row,
        ),
      ),
      null,
    );
  });

  test("admits a profile as a fact only when it carries a business model and its basis", () => {
    const all = admitted(rows);
    assert.equal(profileIsAFact(all), true);
    for (const missing of ["business_model", "business_model_basis"]) {
      const without = all.map((row) =>
        row.row_type === "enterprise_profile"
          ? {
              ...row,
              display_payload_json: {
                display_payload_json: {
                  ...(row.display_payload_json.display_payload_json ?? {}),
                  [missing]: "",
                },
              },
            }
          : row,
      );
      assert.equal(profileIsAFact(without), false, missing);
      assert.equal(served(without), null, missing);
    }
  });

  test("counts a row only through a source link the record verifies", () => {
    const all = admitted(rows);
    // Every row names a source. None of those names is verified: nothing may be counted.
    assert.equal(served(all, new Map()), null);
    // One application's link is not verified: it is left out, and reported as left out.
    const application = all.find((row) => row.row_type === "application");
    assert.ok(application);
    const links = linksFor(all);
    links.delete(application.projection_entry_id);
    const withoutOne = served(all, links);
    assert.ok(withoutOne);
    assert.equal(withoutOne.excludedUncitedRows, 1);
    assert.equal(
      withoutOne.segmentSpine.segments.reduce(
        (sum, segment) => sum + segment.domains.applications.count,
        0,
      ) + withoutOne.segmentSpine.unattributed.applications,
      objectsOf("application").length - 1,
    );
  });

  test("does not count a row the record withholds", () => {
    const all = admitted(rows);
    const firstFunction = objectsOf("business_function")[0];
    const functionId = attribute(firstFunction, "function_id");
    const applications = objectsOf("application").filter(
      (application) =>
        attribute(application, "business_function_id") === functionId,
    ).length;
    assert.ok(applications > 0);
    // A function row that does not carry a function name is withheld from Home's record. Its
    // applications then name a function that is not in the record, and are reported that way.
    const withheld = served(
      all.map((row) =>
        row.row_key === functionId
          ? {
              ...row,
              display_payload_json: {
                display_payload_json: {
                  ...(row.display_payload_json.display_payload_json ?? {}),
                  function_name: "",
                },
              },
            }
          : row,
      ),
    );
    assert.ok(withheld);
    assert.equal(
      withheld.functions.length,
      objectsOf("business_function").length - 1,
    );
    assert.equal(
      withheld.attributionGaps.applications.functionNotInRecord,
      applications,
    );
    assert.equal(
      withheld.attributionGaps.applications.functionWithoutSegment,
      context.attributionGaps.applications.functionWithoutSegment,
    );
  });
});
