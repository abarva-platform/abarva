jest.mock("server-only", () => ({}));
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(),
  tenancyErrorResponse: jest.fn(),
}));
import { validateSession } from "../validate-session";
import { modelAuthoredAnswerPacket } from "@/lib/intelligence/answer/model-authored-answer";
import { renderModelAuthoredSessionHtml } from "../render-model-authored-html";

function sessionFixture() {
  const raw =
    Array(60).fill("Unverified").join(" ") +
    '\n\n```table\n{"id":"support","title":"Evidence options","columns":[{"key":"option","label":"Source"},{"key":"action","label":"Action"}],"rows":[{"option":"Unknown baseline","action":"Validate"}]}\n```';
  const answer = modelAuthoredAnswerPacket(
    raw,
    "Which decision?",
    "fixture",
    [],
  );
  return {
    surface: "intelligence",
    turns: [
      { id: "q1", role: "user" as const, body: answer.question },
      {
        id: "a1",
        role: "agent" as const,
        body: answer.prose!,
        answer,
        reviewStatus: "complete" as const,
      },
    ],
    qualityReview: {
      suiteId: "test",
      startedAt: "2026-10-11T00:00:00Z",
      plannedQuestions: 10,
      completedQuestions: 10,
    },
  };
}

it("exports long, poorly supported answers unchanged for review and preserves every authored exhibit", () => {
  const raw = sessionFixture(),
    result = validateSession(raw);
  expect(result.error).toBeUndefined();
  expect(result.session!.turns[1].body).toBe(raw.turns[1].body);
  expect(result.session!.turns[1].answer).toEqual(raw.turns[1].answer);
  expect(result.session!.qualityReview?.completedQuestions).toBe(1);
  const html = renderModelAuthoredSessionHtml(result.session!);
  expect(html).toContain(raw.turns[1].body);
  expect(html).toContain("Evidence options");
  expect(html).toContain("Unknown baseline");
});

it("rejects altered prose and oversized content instead of silently changing the answer", () => {
  const altered = sessionFixture();
  altered.turns[1].body += " Added text.";
  expect(validateSession(altered).error?.status).toBe(400);
  const oversized = sessionFixture();
  oversized.turns[1].body = "x".repeat(100_001);
  expect(validateSession(oversized).error?.status).toBe(413);
});
