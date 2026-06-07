import {
  collectFailedIndexResults,
  countMismatches,
} from "@/lib/azure-search/index-results";

describe("collectFailedIndexResults", () => {
  it("returns the documents Azure Search rejected inside a 200 response", () => {
    const body = {
      value: [
        { key: "ok1", status: true, statusCode: 200 },
        {
          key: "bad1",
          status: false,
          statusCode: 400,
          errorMessage:
            "Field 'body' contains a term that is too large to process.",
        },
        { key: "ok2", status: true, statusCode: 201 },
        {
          key: "bad2",
          status: false,
          statusCode: 409,
          errorMessage: "conflict",
        },
      ],
    };
    const failed = collectFailedIndexResults(body);
    expect(failed).toHaveLength(2);
    expect(failed.map((f) => f.key)).toEqual(["bad1", "bad2"]);
    expect(failed[0].statusCode).toBe(400);
    expect(failed[0].errorMessage).toMatch(/too large/);
  });

  it("treats an all-success batch as zero failures", () => {
    expect(
      collectFailedIndexResults({ value: [{ key: "a", status: true }] }),
    ).toEqual([]);
  });

  it("is null/shape safe", () => {
    expect(collectFailedIndexResults(null)).toEqual([]);
    expect(collectFailedIndexResults({})).toEqual([]);
    expect(collectFailedIndexResults("nope")).toEqual([]);
  });
});

describe("countMismatches", () => {
  it("flags the off-by-k tenant (the search-verify gate failure shape)", () => {
    expect(
      countMismatches({ "meridian-health": 4376 }, { "meridian-health": 4369 }),
    ).toEqual(["meridian-health: expected 4376, got 4369"]);
  });

  it("returns empty when observed matches expected", () => {
    expect(
      countMismatches(
        { "meridian-health": 873, "skyharbor-air": 3240 },
        { "meridian-health": 873, "skyharbor-air": 3240 },
      ),
    ).toEqual([]);
  });

  it("treats a missing observed tenant as zero", () => {
    expect(countMismatches({ x: 5 }, {})).toEqual(["x: expected 5, got 0"]);
  });
});
