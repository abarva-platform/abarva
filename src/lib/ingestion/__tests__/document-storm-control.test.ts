import {
  DOCUMENT_STORM_LIMITS,
  buildDocumentStormFixture,
  planDocumentStorm,
  summarizeDocumentStormFairness,
  type DocumentStormUpload,
} from "../document-storm-control";

describe("document storm control", () => {
  it("builds the required 100 upload / 10 user storm fixture", () => {
    const fixture = buildDocumentStormFixture();
    const users = new Set(fixture.map((upload) => upload.userId));

    expect(fixture).toHaveLength(100);
    expect(users.size).toBe(10);
    expect(
      fixture.every(
        (upload) =>
          upload.fileName.endsWith(".pdf") &&
          upload.sizeBytes === 18 * 1024 * 1024 &&
          upload.pageCount === 120,
      ),
    ).toBe(true);
  });

  it("admits only the safe concurrent parser window and defers the rest", () => {
    const plan = planDocumentStorm(buildDocumentStormFixture());

    expect(plan.admitted).toHaveLength(
      DOCUMENT_STORM_LIMITS.maxConcurrentParses,
    );
    expect(plan.deferred).toHaveLength(80);
    expect(plan.rejected).toHaveLength(0);
    expect(plan.admitted.map((assignment) => assignment.parserSlot)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
  });

  it("enforces per-user fairness under the storm", () => {
    const plan = planDocumentStorm(buildDocumentStormFixture());
    const fairness = summarizeDocumentStormFairness(plan);

    expect(fairness).toMatchObject({
      admittedCount: 20,
      deferredCount: 80,
      rejectedCount: 0,
      maxObservedAdmittedPerUser: 2,
      usersWithAdmittedWork: 10,
    });
  });

  it("rejects a 1000-page document before queue admission", () => {
    const storm = buildDocumentStormFixture();
    const pageAbuse: DocumentStormUpload = {
      ...storm[0],
      id: "thousand-page",
      pageCount: 1_000,
    };

    const plan = planDocumentStorm([pageAbuse]);

    expect(plan.rejected).toEqual([
      expect.objectContaining({
        uploadId: "thousand-page",
        decision: "reject",
        reason: "page_count_too_high",
      }),
    ]);
    expect(plan.admitted).toHaveLength(0);
  });

  it("rejects byte-size abuse before queue admission", () => {
    const storm = buildDocumentStormFixture();
    const oversized: DocumentStormUpload = {
      ...storm[0],
      id: "oversized",
      sizeBytes: DOCUMENT_STORM_LIMITS.maxPdfBytes + 1,
    };

    const plan = planDocumentStorm([oversized]);

    expect(plan.rejected).toEqual([
      expect.objectContaining({
        uploadId: "oversized",
        decision: "reject",
        reason: "file_too_large",
      }),
    ]);
    expect(plan.admitted).toHaveLength(0);
  });
});
