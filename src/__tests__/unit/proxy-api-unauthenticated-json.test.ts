import { shouldAnswerUnauthenticatedApiWithJson } from "@/proxy";

// Live-found: with an expired session, every authenticated API probe failed as
// `TypeError: Failed to fetch`. Clerk's `auth.protect()` redirects to the HTML
// sign-in page, and a redirect to another document reaches `fetch()` as an
// opaque navigation — so "you are signed out" was indistinguishable from "the
// network is down" at every call site.
//
// The rule: API routes answer 401 JSON, pages still redirect.
describe("unauthenticated API requests answer JSON, not an HTML redirect", () => {
  it("answers with JSON for an API route with no session", () => {
    expect(shouldAnswerUnauthenticatedApiWithJson("/api/chat/agent", null)).toBe(
      true,
    );
    expect(
      shouldAnswerUnauthenticatedApiWithJson("/api/v1/source/events", undefined),
    ).toBe(true);
  });

  it("leaves an authenticated API request alone", () => {
    expect(
      shouldAnswerUnauthenticatedApiWithJson("/api/chat/agent", "user_123"),
    ).toBe(false);
  });

  it("still redirects a page route, so a human lands on sign-in", () => {
    expect(shouldAnswerUnauthenticatedApiWithJson("/source/optimize", null)).toBe(
      false,
    );
    expect(shouldAnswerUnauthenticatedApiWithJson("/", null)).toBe(false);
    expect(
      shouldAnswerUnauthenticatedApiWithJson("/source/events/abc", null),
    ).toBe(false);
  });

  it("does not treat a page path that merely mentions api as an API route", () => {
    // `/apiary` and `/docs/api` are pages; only the `/api/` prefix is the API.
    expect(shouldAnswerUnauthenticatedApiWithJson("/apiary", null)).toBe(false);
    expect(shouldAnswerUnauthenticatedApiWithJson("/docs/api", null)).toBe(false);
  });
});
