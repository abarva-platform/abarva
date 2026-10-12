/** @jest-environment jsdom */
import {
  homeIntelligenceHref,
  homeQuestionStorageKey,
  parseHomeIntelligenceRequest,
  rememberHomeQuestion,
  takeHomeQuestion,
} from "../intelligence-handoff";

const request = {
  tenantKey: "reference-enterprise",
  recordToken: "a".repeat(64),
  chapterId: "technology_data" as const,
  requestedProvider: "ecl",
};

describe("Home Intelligence continuation", () => {
  beforeEach(() => sessionStorage.clear());
  it("binds a link to a client, record and focus without putting a question in the URL", () => {
    const url = new URL(homeIntelligenceHref(request), "https://example.test");
    expect(url.pathname).toBe("/intelligence");
    expect(url.searchParams.get("client")).toBe(request.tenantKey);
    expect(url.searchParams.get("homeContext")).toBe(request.recordToken);
    expect(url.searchParams.get("homeChapter")).toBe("technology_data");
    expect(url.searchParams.get("homeProvider")).toBe("ecl");
    expect(url.searchParams.has("question")).toBe(false);
  });
  it("moves the selected question through session storage once, scoped to tenant and record", () => {
    rememberHomeQuestion(request, "  What should we investigate first?  ");
    expect(
      takeHomeQuestion({ ...request, tenantKey: "another-enterprise" }),
    ).toBeNull();
    expect(
      takeHomeQuestion({ ...request, recordToken: "b".repeat(64) }),
    ).toBeNull();
    expect(takeHomeQuestion(request)).toBe("What should we investigate first?");
    expect(sessionStorage.getItem(homeQuestionStorageKey(request))).toBeNull();
    expect(takeHomeQuestion(request)).toBeNull();
  });
  it("accepts only the bounded continuation fields", () => {
    expect(
      parseHomeIntelligenceRequest({ ...request, facts: ["untrusted"] }),
    ).toEqual(request);
    for (const invalid of [
      null,
      [],
      { ...request, recordToken: "wrong" },
      { ...request, chapterId: "unknown" },
      { ...request, requestedProvider: "../../etc" },
      { ...request, tenantKey: "bad/tenant" },
    ]) {
      expect(parseHomeIntelligenceRequest(invalid)).toBeNull();
    }
  });
});
