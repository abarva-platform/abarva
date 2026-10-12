import {
  fetchMoveEvidence,
  hasCompleteMoveEvidenceLists,
} from "../move-evidence-client";

describe("shared Move evidence read", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("does not treat a successful response with missing lists as an empty cabinet", () => {
    expect(
      hasCompleteMoveEvidenceLists({
        pendingEvidenceReviews: [],
        reviewedEvidence: [],
      }),
    ).toBe(true);
    expect(hasCompleteMoveEvidenceLists({ pendingEvidenceReviews: [] })).toBe(
      false,
    );
  });

  it("uses one request for simultaneous readers of the same Move", async () => {
    const body = { artifacts: [], evidenceReviewStatus: "available" };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => body,
    });
    global.fetch = fetchMock as typeof fetch;

    const [host, step] = await Promise.all([
      fetchMoveEvidence("shared-read-1"),
      fetchMoveEvidence("shared-read-1"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(host).toBe(body);
    expect(step).toBe(body);
  });

  it("reports one failed request to both readers", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    global.fetch = fetchMock as typeof fetch;

    const results = await Promise.allSettled([
      fetchMoveEvidence("shared-read-failed"),
      fetchMoveEvidence("shared-read-failed"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      { status: "rejected", reason: new Error("HTTP 503") },
      { status: "rejected", reason: new Error("HTTP 503") },
    ]);
  });
});
