import {
  createIntelligenceLatencyTrace,
  summarizeTextPayload,
} from "../latency-trace";

describe("Intelligence latency trace", () => {
  it("emits compact timing events with request identity and clean metadata", () => {
    const trace = createIntelligenceLatencyTrace({
      requestId: "latency-proof-1",
      startedAt: Date.now() - 25,
    });

    const timing = trace.mark("retrieval.done", {
      sourceCount: 12,
      skipped: undefined,
      cacheHit: false,
    });

    expect(timing.requestId).toBe("latency-proof-1");
    expect(timing.stage).toBe("retrieval.done");
    expect(timing.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(timing.metadata).toEqual({
      sourceCount: 12,
      cacheHit: false,
    });
  });

  it("summarizes prompt and response payload size without storing content", () => {
    expect(summarizeTextPayload("one\ntwo")).toEqual({
      charCount: 7,
      approxTokens: 2,
      lineCount: 2,
    });
  });
});
