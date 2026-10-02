import { azureRead } from "@/lib/data-plane/azureRead";
import { selectedHomeAssessmentId } from "../home-assessment-selection";

describe("Home active assessment declaration", () => {
  afterEach(() => jest.restoreAllMocks());

  it("keeps the existing assessment when no declaration exists", async () => {
    const query = jest.spyOn(azureRead, "query").mockResolvedValue([]);
    expect(await selectedHomeAssessmentId("meridian-health")).toBe(
      "assessment-dense-source-room-20260823",
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("state = 'active'"),
      ["meridian-health"],
      { missingTable: "empty" },
    );
  });

  it("selects only the tenant's declared active assessment", async () => {
    jest.spyOn(azureRead, "query").mockResolvedValue([
      { assessment_id: "assessment-synthetic-enterprise-v2" },
    ]);
    expect(await selectedHomeAssessmentId("meridian-health")).toBe(
      "assessment-synthetic-enterprise-v2",
    );
  });

  it("refuses ambiguous active declarations", async () => {
    jest.spyOn(azureRead, "query").mockResolvedValue([
      { assessment_id: "one" },
      { assessment_id: "two" },
    ]);
    await expect(selectedHomeAssessmentId("meridian-health")).rejects.toThrow(
      "multiple declared active assessments",
    );
  });
});
