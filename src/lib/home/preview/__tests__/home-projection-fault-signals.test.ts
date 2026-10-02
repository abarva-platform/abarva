/**
 * Every path on which Home serves something other than the projection it selected says so.
 *
 * The record a path falls back to is unchanged by these cases and is asserted alongside the
 * signal, so a change to either one is seen here. The reader's own queries are stubbed; the
 * tenant fence itself is held against a real database in
 * `scripts/ecl/__tests__/test_home_selection_tenant_fence.ts`.
 */
import fs from "node:fs";

const query = jest.fn();
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { query: (...args: unknown[]) => query(...args) },
}));
const selectHomeAssessment = jest.fn();
jest.mock("../home-assessment-selection", () => ({
  selectHomeAssessment: (...args: unknown[]) => selectHomeAssessment(...args),
}));

import {
  resetStructuredLogSinkForTests,
  setStructuredLogSinkForTests,
} from "@/lib/observability/structured-logger";
import {
  getHomeEclProjectionBundle,
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
} from "../ecl-projection-bundle";
import {
  getHomeReviewBundle,
  HOME_PREVIEW_TENANT_KEYS,
} from "../golden-snapshot";
import {
  HomeProjectionFault,
  type HomeProjectionFaultReason,
} from "../home-projection-fault";

const TENANT = HOME_PREVIEW_TENANT_KEYS[0];

const DECLARED = {
  manifestId: "11111111-1111-4111-8111-111111111111",
  projectionVersion: 3,
  projectionHash: "a".repeat(64),
  sourceSetHash: "b".repeat(64),
  rowCount: 1,
};

const ROW = {
  page_key: "applications_systems",
  row_key: "app-1",
  row_type: "application",
  title: "Application one",
  summary: null,
  display_payload_json: { application_name: "Application one" },
};

/** Every serving view the reader names, as the catalogue would report them. */
function everyServingView() {
  const source = fs.readFileSync(
    "src/lib/home/preview/ecl-projection-bundle.ts",
    "utf8",
  );
  const block = source.slice(
    source.indexOf("const HOME_SERVING_VIEWS"),
    source.indexOf("] as const;"),
  );
  return [...block.matchAll(/"(serving\.home_[a-z_]+)"/g)].map((m) => ({
    full_name: m[1],
  }));
}

const sink = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

function signals() {
  return sink.error.mock.calls.map(
    ([line]) => JSON.parse(line as string) as Record<string, unknown>,
  );
}

function expectOneSignal(expected: {
  reason: HomeProjectionFaultReason;
  served: string;
}) {
  expect(signals()).toHaveLength(1);
  expect(signals()[0]).toMatchObject({
    level: "error",
    event: "home_projection_fault",
    surface: "home",
    metadata: { tenantKey: TENANT, ...expected },
  });
}

async function expectReviewedSnapshot() {
  const served =
    await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(TENANT);
  expect(served.recordSource.kind).toBe("reviewed_snapshot_fallback");
  expect(served.bundle).toBe(getHomeReviewBundle(TENANT));
}

beforeEach(() => {
  query.mockReset();
  selectHomeAssessment.mockReset();
  jest.clearAllMocks();
  setStructuredLogSinkForTests(sink);
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  resetStructuredLogSinkForTests();
  jest.restoreAllMocks();
});

describe("a selection that refuses", () => {
  const refusals: HomeProjectionFaultReason[] = [
    "selection_query_error",
    "multiple_active_declarations",
    "declaration_not_bound_to_manifest",
  ];

  it.each(refusals)(
    "%s serves the reviewed snapshot, reads no rows, and reports itself",
    async (reason) => {
      selectHomeAssessment.mockRejectedValue(
        new HomeProjectionFault(reason, `refused: ${reason}`, {
          assessmentId: "assessment-declared",
        }),
      );

      await expectReviewedSnapshot();

      // Nothing was read for the tenant under any assessment, so nothing else can have been served.
      expect(query).not.toHaveBeenCalled();
      expectOneSignal({ reason, served: "reviewed_snapshot" });
      expect(signals()[0]?.metadata).toMatchObject({
        assessmentId: "assessment-declared",
        detail: `refused: ${reason}`,
      });
      // A refusal names its reason; only an unclassified error needs its stack.
      expect(signals()[0]?.metadata).not.toHaveProperty("stack");
    },
  );
});

describe("a selection that has nothing to serve", () => {
  it("reports a declared assessment with no rows under its manifest", async () => {
    selectHomeAssessment.mockResolvedValue({
      assessmentId: "assessment-declared",
      declared: DECLARED,
    });
    query.mockResolvedValueOnce(everyServingView()).mockResolvedValueOnce([]);

    await expectReviewedSnapshot();

    expectOneSignal({
      reason: "declared_assessment_has_no_rows",
      served: "reviewed_snapshot",
    });
  });

  it("reports a default assessment with no rows", async () => {
    selectHomeAssessment.mockResolvedValue({
      assessmentId: "assessment-default",
      declared: null,
    });
    query.mockResolvedValueOnce(everyServingView()).mockResolvedValueOnce([]);

    await expectReviewedSnapshot();

    expectOneSignal({
      reason: "default_assessment_has_no_rows",
      served: "reviewed_snapshot",
    });
  });

  it("reports rows none of which Home may show", async () => {
    selectHomeAssessment.mockResolvedValue({
      assessmentId: "assessment-default",
      declared: null,
    });
    query
      .mockResolvedValueOnce(everyServingView())
      .mockResolvedValueOnce([{ ...ROW, admission_status: "refused" }]);

    await expectReviewedSnapshot();

    expectOneSignal({
      reason: "no_admissible_rows",
      served: "reviewed_snapshot",
    });
  });

  it("reports a read that failed for a reason nothing classified", async () => {
    selectHomeAssessment.mockResolvedValue({
      assessmentId: "assessment-default",
      declared: null,
    });
    query
      .mockResolvedValueOnce(everyServingView())
      .mockRejectedValueOnce(new Error("connection reset"));

    await expectReviewedSnapshot();

    expectOneSignal({
      reason: "projection_read_error",
      served: "reviewed_snapshot",
    });
    expect(signals()[0]?.metadata).toMatchObject({
      detail: "connection reset",
      stack: expect.stringContaining("connection reset"),
    });
  });
});

describe("a declared projection whose row count is not the manifest's", () => {
  function declaredWith(rowCount: number) {
    selectHomeAssessment.mockResolvedValue({
      assessmentId: "assessment-declared",
      declared: { ...DECLARED, rowCount },
    });
  }

  it("is still served, and reported", async () => {
    declaredWith(2);
    query
      .mockResolvedValueOnce(everyServingView())
      .mockResolvedValueOnce([ROW])
      .mockResolvedValue([]);

    const served =
      await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(TENANT);

    expect(served.recordSource.kind).toBe("ecl_serving_projection");
    expectOneSignal({
      reason: "declared_row_count_differs",
      served: "declared_projection",
    });
    expect(signals()[0]?.metadata).toMatchObject({
      assessmentId: "assessment-declared",
      detail: "read 1 rows; the declared manifest records 2",
    });
  });

  it("is not reported when the count is the manifest's", async () => {
    declaredWith(1);
    query
      .mockResolvedValueOnce(everyServingView())
      .mockResolvedValueOnce([ROW])
      .mockResolvedValue([]);

    await getHomeEclProjectionBundle(TENANT);

    expect(signals()).toEqual([]);
  });

  it("is not judged when a serving view is absent, because the read is already known to be short", async () => {
    declaredWith(2);
    query
      .mockResolvedValueOnce(everyServingView().slice(1))
      .mockResolvedValueOnce([ROW])
      .mockResolvedValue([]);

    await getHomeEclProjectionBundle(TENANT);

    expect(signals()).toEqual([]);
  });
});

describe("a read with nothing wrong", () => {
  it("reports nothing", async () => {
    selectHomeAssessment.mockResolvedValue({
      assessmentId: "assessment-default",
      declared: null,
    });
    query
      .mockResolvedValueOnce(everyServingView())
      .mockResolvedValueOnce([ROW])
      .mockResolvedValue([]);

    const served =
      await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(TENANT);

    expect(served.recordSource.kind).toBe("ecl_serving_projection");
    expect(signals()).toEqual([]);
  });

  it("asks the selection for the tenant being read, and reads that tenant's rows", async () => {
    // The case only means something if there is a second tenant to confuse the first with.
    expect(new Set(HOME_PREVIEW_TENANT_KEYS).size).toBeGreaterThan(1);
    selectHomeAssessment.mockImplementation(async (tenantKey: string) => ({
      assessmentId: `assessment-of-${tenantKey}`,
      declared: null,
    }));

    for (const tenantKey of HOME_PREVIEW_TENANT_KEYS) {
      query.mockReset();
      query
        .mockResolvedValueOnce(everyServingView())
        .mockResolvedValueOnce([ROW])
        .mockResolvedValue([]);

      await getHomeEclProjectionBundle(tenantKey);

      expect(selectHomeAssessment).toHaveBeenLastCalledWith(tenantKey);
      expect(query.mock.calls[1]?.[1]).toEqual([
        tenantKey,
        `assessment-of-${tenantKey}`,
      ]);
    }
  });
});
