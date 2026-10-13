import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  formatHomeAdvisorAnswer,
  homeConversationSchema,
  homeFollowUpQuestions,
} from "../conversation";

const answer = {
  question: "Tell me about data analytics",
  directAnswer: "Analytics value is partially validated.",
  prose:
    "Analytics value is partially validated.\n\nThe platform is below its recorded target.\n\nData trust needs attention.",
  status: "answered",
  citations: [{ id: "TD-K1" }],
  artifacts: [],
} as unknown as AvaAnswerPacket;
const source = {
  kind: "reviewed_snapshot",
  canonicalSnapshotHash: "reviewed-a",
} as const;

it("offers three relevant questions without fabricating facts or actions", () => {
  const questions = homeFollowUpQuestions(answer);
  expect(questions).toHaveLength(3);
  expect(questions.every((question) => question.endsWith("?"))).toBe(true);
  expect(questions.join(" ")).toMatch(/data.*analytics/);
  expect(questions.join(" ")).toContain("CFO");
});

it.each([
  "vendor contracts",
  "strategic programs",
  "security risk",
  "business revenue",
  "leadership priorities",
])("offers three next questions for %s", (question) => {
  expect(
    homeFollowUpQuestions({
      ...answer,
      question,
      directAnswer: "This record has useful evidence.",
    }),
  ).toHaveLength(3);
});

it("keeps unknown evidence unknown in its follow-ups", () => {
  expect(
    homeFollowUpQuestions({ ...answer, status: "no_data" }).join(" "),
  ).toContain("missing evidence");
});

it.each([
  "What should the CFO prioritize in data and analytics, and why?",
  "WHAT SHOULD THE CFO PRIORITIZE IN DATA AND ANALYTICS AND WHY",
  "What can the available record tell us?",
  "What should leadership prioritize first, and why?",
])("offers three distinct next questions without repeating %s", (question) => {
  const status = question.includes("available record") ? "no_data" : "answered";
  const questions = homeFollowUpQuestions({
    ...answer,
    question,
    status,
    directAnswer: "Review the available evidence.",
  });
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  expect(questions).toHaveLength(3);
  expect(new Set(questions.map(normalize)).size).toBe(3);
  expect(questions.map(normalize)).not.toContain(normalize(question));
});

it("formats a bottom line and supporting bullets while retaining all facts and source state", () => {
  const formatted = formatHomeAdvisorAnswer(answer, source);
  expect(formatted.prose).toContain("**Bottom line**");
  expect(
    formatted.prose?.match(/Analytics value is partially validated/g),
  ).toHaveLength(1);
  expect(formatted.prose).toContain(
    "- The platform is below its recorded target.",
  );
  expect(formatted.prose).toContain("- Data trust needs attention.");
  expect(formatted.prose).toContain("Reviewed stored record");
  expect(formatted.prose).toContain("currency is not independently attested");
  expect(formatted.citations).toEqual(answer.citations);
  expect(formatted.artifacts).toEqual(answer.artifacts);
});

it("preserves structured bullets and caveats rather than cutting them to fit", () => {
  const prose =
    "- **Capability:** Below target.\n- **Value:** Partially validated.\n\n**Implication:** Verify before acting.";
  expect(formatHomeAdvisorAnswer({ ...answer, prose }, source).prose).toContain(
    prose,
  );
});

it.each([true, false, undefined])(
  "renders the declared synthetic basis only when supplied (%s)",
  (declared) => {
    const formatted = formatHomeAdvisorAnswer(answer, source, declared);
    expect(
      formatted.prose?.includes("Synthetic reference, not client-attested"),
    ).toBe(declared === true);
    expect(formatted.citations).toEqual(answer.citations);
    expect(formatted.prose).toContain("Reviewed stored record");
  },
);

it("bounds conversation and rejects assistant prose and arbitrary extra fields", () => {
  const turn = { question: "Why does that matter?", citedClaimTags: ["TD-K1"] };
  expect(homeConversationSchema.safeParse([turn]).success).toBe(true);
  expect(homeConversationSchema.safeParse(Array(5).fill(turn)).success).toBe(
    false,
  );
  expect(
    homeConversationSchema.safeParse([
      { ...turn, answer: "Unverified old facts" },
    ]).success,
  ).toBe(false);
  expect(
    homeConversationSchema.safeParse([{ ...turn, question: "x".repeat(1201) }])
      .success,
  ).toBe(false);
});
