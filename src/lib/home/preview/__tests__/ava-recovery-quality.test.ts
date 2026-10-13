import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { validateAvaAnswerPacket } from "@/lib/ava-answer/validateAvaAnswerPacket";

import {
  answerHomeAvaQuestion,
  homeAvaAnswerFollowUpQuestions,
} from "../ava-answer";
import type {
  ChapterView,
  GroundedClaim,
  HomeContextVersion,
  HomeReviewBundle,
} from "../types";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const auditedClient = jest.mocked(getAuditedAnthropicClient);
const tenantKey = CANONICAL_TENANT_KEYS[0];
const graphQuestion =
  "Show me the graph of how risks, vendors, applications, data and programs connect.";
const maturityClaim =
  "The compiled assessment describes the reporting capability across selected applications, data assets, operating teams and planned programs using a declared reference scale that summarizes available evidence without demonstrating tested resilience, independently measured performance or accepted business outcomes; its lowest maturity level (1.4 of 5) is illustrative, not client-attested.";
const qualifiedValueClaim =
  "The compiled value assessment describes available measures across selected programs, applications, operating teams, reporting assets and business priorities, with owners expected to inspect the supporting records, assess source currency and establish the counting basis before making any decision about realized financial value. This summary is not Finance-attested and missing measures remain unknown, not zero.";

function chapter(
  statement: string,
  chapterId: ChapterView["chapterId"] = "technology_data",
  confidence: GroundedClaim["confidence"] = "medium",
): ChapterView {
  return {
    chapterId,
    title: "Reference context",
    guidingQuestion: "What does the selected record establish?",
    headline: "Inspect the evidence before acting.",
    executive_synthesis: "Compiled reference context with explicit limits.",
    key_insights: [
      {
        statement,
        confidence,
        evidence_ids: ["reference-evidence-1"],
        claim_type: "FACT",
      },
    ],
    tensions: [],
    what_to_watch: [],
    questions_to_ask: [],
    visual_opportunities: [],
    limitations: ["Source currency and owner acceptance are not established."],
  };
}

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

async function graphAnswer(chapters: ChapterView[] = [chapter(maturityClaim)]) {
  return answerHomeAvaQuestion({
    bundle: { chapters, declaredSyntheticDemo: true },
    tenantKey,
    question: graphQuestion,
    conversation: [
      { question: "Tell me about data analytics", citedClaimTags: ["TD-K1"] },
    ],
  });
}

function expectExactClaim(
  answer: AvaAnswerPacket,
  statement: string,
  id: string,
) {
  expect(answer.citations.find((citation) => citation.id === id)?.excerpt).toBe(
    statement,
  );
  expect(answer.relationshipsUsed).toEqual([]);
  expect(answer.artifacts).toEqual([]);
  expect(validateAvaAnswerPacket(answer).passed).toBe(true);
}

beforeEach(() => auditedClient.mockReset());

it("retains the complete graph fallback assertion, decimal and late qualification beyond 42 words", async () => {
  expect(words(maturityClaim)).toBeGreaterThan(42);
  expect(words(maturityClaim)).toBeLessThanOrEqual(70);
  const answer = await graphAnswer();
  expect(answer.prose).toContain(`- ${maturityClaim}`);
  expect(answer.prose).not.toMatch(/1\.\s+4|level \(1\.(?:\s|$)/);
  expect(answer.citations[0].confidence).toBe("medium");
  expectExactClaim(answer, maturityClaim, "TD-K1");
  expect(auditedClient).not.toHaveBeenCalled();
});

it("preserves the later uncertainty sentence in a cited recovery answer", async () => {
  auditedClient.mockRejectedValue(new Error("unavailable"));
  expect(words(qualifiedValueClaim)).toBeGreaterThan(42);
  const answer = await answerHomeAvaQuestion({
    bundle: {
      chapters: [chapter(qualifiedValueClaim, "performance_value")],
      declaredSyntheticDemo: true,
    },
    tenantKey,
    question: "What value risk should the CFO review?",
  });
  expect(answer.status).toBe("partial");
  expect(answer.prose).toContain(`- ${qualifiedValueClaim}`);
  expect(answer.prose).toContain("missing measures remain unknown, not zero");
  expect(answer.prose).toContain("Synthetic reference, not client-attested");
  expectExactClaim(answer, qualifiedValueClaim, "PV-K1");
});

it.each(["graph", "recovery"])(
  "quarantines overlong %s claims with the full original citation",
  async (mode) => {
    const statement = `${"The compiled summary still requires source-owner review. ".repeat(12)}This is not independently verified or Finance-attested value.`;
    const chapters = [chapter(statement, "performance_value")];
    const original = JSON.stringify(chapters);
    auditedClient.mockRejectedValue(new Error("unavailable"));
    const answer =
      mode === "graph"
        ? await graphAnswer(chapters)
        : await answerHomeAvaQuestion({
            bundle: { chapters },
            tenantKey,
            question: "What value risk should the CFO review?",
          });
    expect(answer.prose).toContain("needs its full context and qualifications");
    expect(answer.prose).not.toContain("The compiled summary still requires");
    expect(answer.prose).not.toContain(
      "requires source-owner review. The compiled",
    );
    expect(JSON.stringify(chapters)).toBe(original);
    expectExactClaim(answer, statement, "PV-K1");
  },
);

it("names the requested typed scopes without claiming those links are absent from the source", async () => {
  const answer = await graphAnswer();
  const gap = answer.gaps.find(
    (item) => item.id === "home-ava-relationship-scope-gap",
  )!;
  for (const scope of [
    "risk-to-application",
    "vendor/contract-to-application",
    "application-to-data asset",
    "program-to-application",
  ]) {
    expect(gap.detail).toContain(scope);
  }
  expect(gap.detail).toContain("not verified here");
  expect(gap.detail).toContain(
    "does not establish that these links are absent",
  );
  expect(gap.detail).toContain(
    "Endpoint IDs, declared relationship types and source evidence",
  );
  expect(answer.prose).toContain("relationship confidence is not established");
  expect(answer.caveats.map((item) => item.detail).join(" ")).toContain(
    "summary evidence, not inspected relationship records",
  );
  expect(answer.prose).toContain(
    "Source currency and owner acceptance are not established",
  );
  expect(answer.prose).toContain("Synthetic reference, not client-attested");
});

it("leaves graph evidence unknown when no cited claims are available", async () => {
  const answer = await graphAnswer([]);
  expect(answer.status).toBe("no_data");
  expect(answer.citations).toEqual([]);
  expect(answer.prose).toContain("No cited Home claims are available");
  expect(answer.prose).not.toContain("I can answer from cited Home claims");
  expect(answer.quality.confidence).toBe("low");
  expect(validateAvaAnswerPacket(answer).passed).toBe(true);
});

it("quarantines unqualified synthetic testimony in the graph fallback", async () => {
  const statement =
    "All 12 leaders interviewed said the program had delivered accepted value.";
  const answer = await graphAnswer([
    chapter(statement, "leadership_perspective"),
  ]);
  expect(answer.prose).not.toContain(statement);
  expect(answer.prose).toContain("lacks a qualified synthetic reference basis");
  expectExactClaim(answer, statement, "LP-K1");
});

it("retains the existing synthetic qualification gate for overlong recovery claims", async () => {
  const statement = `${"All 12 leaders interviewed said the program delivered value. ".repeat(9)}Independent testimony was not supplied.`;
  auditedClient.mockRejectedValue(new Error("unavailable"));
  const answer = await answerHomeAvaQuestion({
    bundle: {
      chapters: [chapter(statement, "leadership_perspective")],
      declaredSyntheticDemo: true,
    },
    tenantKey,
    question: "What should leadership verify before acting?",
  });
  expect(answer.status).toBe("no_data");
  expect(answer.prose).toBeUndefined();
  expectExactClaim(answer, statement, "LP-K1");
});

it("preserves the existing authority filter for contradictory compiled counts", async () => {
  const statement =
    "All 12 vendor contracts have pricing evidence; owner acceptance is unknown.";
  const answer = await answerHomeAvaQuestion({
    bundle: {
      chapters: [chapter(statement)],
      technologyEstate: {
        recordTypes: [
          {
            objectType: "vendor_contract",
            label: "Contracts",
            columns: ["vendorName"],
            rows: [{ vendorName: "Supplier Alpha" }],
            primaryDimension: "vendorName",
            dimensionCounts: [],
          },
        ],
      },
    },
    tenantKey,
    question: graphQuestion,
  });
  expect(answer.status).toBe("no_data");
  expect(answer.citations).toEqual([]);
  expect(answer.prose).not.toContain(statement);
  expect(answer.prose).not.toContain(
    "All 1 vendor contracts have pricing evidence",
  );
  expect(validateAvaAnswerPacket(answer).passed).toBe(true);
});

it("does not fall back to legacy summary claims when a current accepted record has no graph proof", async () => {
  const version: HomeContextVersion = {
    assessmentId: "reference-assessment",
    projectionContentHash: "reference-projection",
    sourceSetHash: "reference-source-set",
    sourceLineageHash: "reference-lineage",
    deterministicPacketHash: "reference-deterministic",
    narrativePacketHash: "reference-narrative",
    narrativeGeneratedAt: null,
    dataAsOf: null,
    coherence: "coherent",
    sourceCoverage: { totalRecordRows: 1, linkedRecordRows: 1, families: [] },
    sourceFileReview: {
      totalFiles: 1,
      acceptedFiles: 1,
      partialFiles: 0,
      blockedFiles: 0,
      supersededFiles: 0,
    },
  };
  // This branch returns before inspecting context fields when dependencyProof is absent.
  const thesis = {
    signalPacket: { homeEnterpriseContext: {} },
  } as unknown as HomeReviewBundle["thesis"];
  const answer = await answerHomeAvaQuestion({
    bundle: {
      chapters: [chapter(maturityClaim)],
      thesis,
      contextVersion: version,
      declaredSyntheticDemo: true,
    },
    tenantKey,
    question: graphQuestion,
  });
  expect(answer.status).toBe("no_data");
  expect(answer.citations).toEqual([]);
  expect(answer.prose).toBeUndefined();
  expect(answer.gaps.map((gap) => gap.detail).join(" ")).toContain(
    "risk-to-application",
  );
  expect(answer.caveats[0].detail).toContain(
    "Synthetic reference, not client-attested",
  );
  expect(auditedClient).not.toHaveBeenCalled();
  expect(validateAvaAnswerPacket(answer).passed).toBe(true);
});

it("keeps low-confidence source claims low-confidence in the graph fallback", async () => {
  const first = chapter(
    "Recorded application exposure requires review; independent impact is unknown.",
    "technology_data",
    "low",
  );
  const second = chapter(
    "Recorded program risk requires review; owner acceptance is unknown.",
    "what_needs_attention",
    "low",
  );
  const answer = await graphAnswer([first, second]);
  expect(answer.citations).toHaveLength(2);
  expect(
    answer.citations.every((citation) => citation.confidence === "low"),
  ).toBe(true);
  expect(answer.quality.confidence).toBe("low");
  expect(answer.prose).toContain("Confidence: low for cited claims only");
});

it("selects graph follow-ups from the latest question and relationship gaps despite earlier data intent", async () => {
  const answer = await graphAnswer();
  const questions = homeAvaAnswerFollowUpQuestions(answer);
  expect(questions).toHaveLength(3);
  expect(questions[0]).toContain("risk-to-application");
  expect(questions[0]).toContain("program-to-application");
  expect(questions[1]).toContain(
    "endpoint IDs and declared relationship types",
  );
  expect(questions[2]).toContain("connections remain unverified");
  expect(questions.join(" ")).not.toContain(
    "CFO prioritize in data and analytics",
  );
});

it("refreshes follow-ups when the latest answer and gap shift to financial value", async () => {
  const previous = await graphAnswer();
  const latest: AvaAnswerPacket = {
    ...previous,
    question: "Why does that matter?",
    directAnswer: "Financial value requires confirmation.",
    prose: "Financial value is a compiled summary, not Finance-attested.",
    citations: [
      {
        id: "PV-K1",
        label: "Value basis",
        sourceClass: "tenant-fact",
        excerpt: qualifiedValueClaim,
        confidence: "medium",
      },
    ],
    gaps: [
      {
        id: "value-proof-gap",
        label: "Evidence limit",
        detail: "Financial value still needs Finance confirmation.",
      },
    ],
    caveats: [],
  };
  const questions = homeAvaAnswerFollowUpQuestions(latest);
  expect(questions).toHaveLength(3);
  expect(questions.join(" ")).toContain("financial value");
  expect(questions.join(" ")).not.toMatch(
    /graph|data and analytics|risk-to-application/,
  );
  expect(questions).not.toEqual(homeAvaAnswerFollowUpQuestions(previous));
});

it("keeps latest-question focus while surfacing a different evidence gap", async () => {
  const graph = await graphAnswer();
  const questions = homeAvaAnswerFollowUpQuestions({
    ...graph,
    question: "What financial value does this establish?",
    directAnswer: "Value is not yet attested.",
    prose: "Compiled value summary.",
    gaps: [
      {
        id: "owner-gap",
        label: "Missing ownership",
        detail: "Operating ownership evidence is not verified.",
      },
    ],
    caveats: [],
  });
  expect(questions[0]).toContain("financial value");
  expect(questions[1]).toContain("operating ownership");
});

it("offers useful questions about missing graph evidence without implying cited summaries exist", async () => {
  const answer = await graphAnswer([]);
  const questions = homeAvaAnswerFollowUpQuestions(answer);
  expect(questions).toHaveLength(3);
  expect(questions.join(" ")).not.toContain("cited summaries");
  expect(questions[2]).toContain("records would provide source evidence");
});

it("offers at most three distinct questions and excludes a normalized repeat", async () => {
  const answer = await graphAnswer();
  const [first] = homeAvaAnswerFollowUpQuestions(answer);
  const questions = homeAvaAnswerFollowUpQuestions({
    ...answer,
    question: first.toUpperCase().replace(/\?/g, ""),
  });
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  expect(questions.length).toBeLessThanOrEqual(3);
  expect(questions.length).toBeGreaterThan(0);
  expect(new Set(questions.map(normalize)).size).toBe(questions.length);
  expect(questions.map(normalize)).not.toContain(normalize(first));
  expect(questions.every((question) => question.endsWith("?"))).toBe(true);
});
