import { azureRead } from "@/lib/data-plane/azureRead";
import { DENSE_ECL_ASSESSMENT_IDS } from "@/lib/ecl/denseAssessment";
import {
  resetStructuredLogSinkForTests,
  setStructuredLogSinkForTests,
} from "@/lib/observability/structured-logger";
import { selectHomeAssessment } from "../home-assessment-selection";
import { HomeProjectionFault } from "../home-projection-fault";

// Tenant keys and their default assessments are read from the code that declares them, so a
// tenant added there is covered here without this file naming it.
const DEFAULTS = Object.entries(DENSE_ECL_ASSESSMENT_IDS);

const BOUND_DECLARATION = {
  assessment_id: "assessment-declared",
  projection_hash: "a".repeat(64),
  source_set_hash: "b".repeat(64),
  manifest_id: "11111111-1111-4111-8111-111111111111",
  projection_version: 3,
  row_count: 42,
};

describe("Home active assessment declaration", () => {
  const sink = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    setStructuredLogSinkForTests(sink);
  });

  afterEach(() => {
    resetStructuredLogSinkForTests();
    jest.restoreAllMocks();
  });

  it("keeps each tenant's own default assessment when no declaration exists", async () => {
    // The case only means something if two tenants would be told apart.
    expect(DEFAULTS.length).toBeGreaterThan(1);
    expect(new Set(DEFAULTS.map(([, id]) => id)).size).toBe(DEFAULTS.length);

    for (const [tenantKey, defaultAssessmentId] of DEFAULTS) {
      const query = jest.spyOn(azureRead, "query").mockResolvedValue([]);
      await expect(selectHomeAssessment(tenantKey)).resolves.toEqual({
        assessmentId: defaultAssessmentId,
        declared: null,
      });
      expect(query.mock.calls[0]?.[1]?.[0]).toBe(tenantKey);
      query.mockRestore();
    }
    expect(sink.error).not.toHaveBeenCalled();
  });

  it("returns what the declaration names, not only its assessment", async () => {
    const [tenantKey] = DEFAULTS[0]!;
    jest.spyOn(azureRead, "query").mockResolvedValue([BOUND_DECLARATION]);

    await expect(selectHomeAssessment(tenantKey)).resolves.toEqual({
      assessmentId: BOUND_DECLARATION.assessment_id,
      declared: {
        manifestId: BOUND_DECLARATION.manifest_id,
        projectionVersion: BOUND_DECLARATION.projection_version,
        projectionHash: BOUND_DECLARATION.projection_hash,
        sourceSetHash: BOUND_DECLARATION.source_set_hash,
        rowCount: BOUND_DECLARATION.row_count,
      },
    });
  });

  it("refuses ambiguous active declarations", async () => {
    const [tenantKey] = DEFAULTS[0]!;
    jest
      .spyOn(azureRead, "query")
      .mockResolvedValue([
        BOUND_DECLARATION,
        { ...BOUND_DECLARATION, assessment_id: "assessment-declared-twice" },
      ]);

    const refusal = selectHomeAssessment(tenantKey);
    await expect(refusal).rejects.toThrow(
      "multiple declared active assessments",
    );
    await expect(refusal).rejects.toMatchObject({
      reason: "multiple_active_declarations",
    });
  });

  it("selects nothing when the declaration is not bound to its manifest", async () => {
    const [tenantKey] = DEFAULTS[0]!;
    // What the join yields when the manifest is absent, belongs to another tenant or assessment,
    // is not a Home projection, or no longer carries the declared hashes.
    jest.spyOn(azureRead, "query").mockResolvedValue([
      {
        ...BOUND_DECLARATION,
        manifest_id: null,
        projection_version: null,
        row_count: null,
      },
    ]);

    // A refusal: neither the declared assessment nor the default one is handed back.
    const refusal = selectHomeAssessment(tenantKey);
    await expect(refusal).rejects.toBeInstanceOf(HomeProjectionFault);
    await expect(refusal).rejects.toMatchObject({
      reason: "declaration_not_bound_to_manifest",
      assessmentId: BOUND_DECLARATION.assessment_id,
    });
  });

  it("serves each tenant's own default assessment, and says so, when the declarations table does not exist", async () => {
    for (const [tenantKey, defaultAssessmentId] of DEFAULTS) {
      sink.error.mockClear();
      const query = jest.spyOn(azureRead, "query").mockRejectedValue(
        Object.assign(new Error("relation does not exist"), {
          code: "42P01",
        }),
      );

      await expect(selectHomeAssessment(tenantKey)).resolves.toEqual({
        assessmentId: defaultAssessmentId,
        declared: null,
      });
      expect(sink.error).toHaveBeenCalledTimes(1);
      expect(JSON.parse(sink.error.mock.calls[0]?.[0] as string)).toMatchObject(
        {
          level: "error",
          event: "home_projection_fault",
          surface: "home",
          metadata: {
            tenantKey,
            reason: "declaration_table_missing",
            served: "default_assessment",
            assessmentId: defaultAssessmentId,
          },
        },
      );
      query.mockRestore();
    }
  });

  it("does not turn a failed selection query into the default assessment", async () => {
    const [tenantKey] = DEFAULTS[0]!;
    const failure = Object.assign(new Error("permission denied"), {
      code: "42501",
    });
    jest.spyOn(azureRead, "query").mockRejectedValue(failure);

    const refusal = selectHomeAssessment(tenantKey);
    await expect(refusal).rejects.toMatchObject({
      reason: "selection_query_error",
      cause: failure,
    });
    // The path that falls back reports it, once, with what it served.
    expect(sink.error).not.toHaveBeenCalled();
  });
});
