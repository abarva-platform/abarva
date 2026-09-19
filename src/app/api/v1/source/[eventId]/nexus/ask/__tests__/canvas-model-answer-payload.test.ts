/**
 * The Source canvas chat route substitutes a Claude answer for the
 * deterministic briefing, but the structured payload that the canvas actually
 * renders was still the deterministic composer's.
 *
 * `AgentResponseBody` (src/components/shell/AgentColumn.tsx) renders
 * `AgentResponseParts` *instead of* the prose whenever parts are present, so
 * the three parts that describe the answer — the "Advisor answer" text, the
 * "Evidence used" citations, and the "Support" count of those citations — are
 * what a reader sees. They have to describe the answer that is shown.
 *
 * These cases drive the real route handler and read the payload it returns.
 * Only the route's collaborators are mocked; the substitution logic under test
 * is the route's own.
 */
import type { NextRequest } from "next/server";

import type { AgentResponsePart } from "@/lib/agent/response-parts";
import type { SourceAnswerEvidenceCitation } from "@/lib/source/source-answer-engine";

const DETERMINISTIC_ANSWER_TEXT =
  "Deterministic briefing: the event has two open inputs before award.";
const MODEL_ANSWER_TEXT =
  "The renewal is exposed on the indexation clause [E1], and the incumbent has not restated its SLA credits [E2].";

const DETERMINISTIC_CITATION: SourceAnswerEvidenceCitation = {
  id: "det-1",
  label: "Deterministic evidence card",
  segmentId: "seg-det",
  recordId: "rec-det",
  sourceDoc: "deterministic-composer.md",
  excerpt: "Composed by the deterministic answer engine, not by the model.",
  confidence: "medium",
};

const MODEL_CITATION_ONE: SourceAnswerEvidenceCitation = {
  id: "model-1",
  label: "[E1] Indexation clause",
  segmentId: "seg-contract",
  recordId: "rec-contract",
  sourceDoc: "master-agreement.pdf",
  excerpt: "Annual uplift is indexed with no cap.",
  confidence: "high",
};

const MODEL_CITATION_TWO: SourceAnswerEvidenceCitation = {
  id: "model-2",
  label: "[E2] SLA credit schedule",
  segmentId: "seg-sla",
  recordId: "rec-sla",
  sourceDoc: "sla-exhibit.pdf",
  excerpt: "Service credits were not restated in the renewal response.",
  confidence: "medium",
};

function deterministicParts(): AgentResponsePart[] {
  return [
    {
      type: "metricStrip",
      title: "aVa sourcing read",
      metrics: [
        { label: "Lens", value: "Event", tone: "info" },
        { label: "Confidence", value: "medium", tone: "info" },
        { label: "Support", value: "1", tone: "good" },
        { label: "Open inputs", value: "2", tone: "warning" },
      ],
    },
    { type: "text", title: "Advisor answer", text: DETERMINISTIC_ANSWER_TEXT },
    {
      type: "table",
      title: "Decision signals and sourcing implications",
      columns: ["Signal", "So what for sourcing"],
      rows: [["Renewal window opens in 60 days", "Start the market test now"]],
    },
    {
      type: "citations",
      title: "Evidence used",
      citations: [
        {
          label: DETERMINISTIC_CITATION.label,
          excerpt: DETERMINISTIC_CITATION.excerpt,
          confidence: DETERMINISTIC_CITATION.confidence,
        },
      ],
    },
    {
      type: "nextAction",
      label: "Recommended next action",
      detail: "Close the two open inputs before the gate review.",
      confidence: "medium",
    },
  ];
}

function deterministicStubResponse() {
  const parts = deterministicParts();
  return {
    ok: true,
    httpStatus: 200,
    requestId: "req-test",
    eventId: "evt-test",
    prompt: "what is our exposure on this renewal?",
    mode: "event",
    generatedAt: "2026-09-19T00:00:00.000Z",
    noModel: true,
    answer: DETERMINISTIC_ANSWER_TEXT,
    answerStatus: "ok",
    contextScope: "event",
    contextQuality: null,
    context: {
      missingInputs: [],
      blockers: [],
      selectedAttachmentIds: [],
    },
    sourceIntelligence: null,
    sourceAnswer: {
      engineVersion: "source-answer-engine/v1",
      mode: "event",
      title: "Event answer",
      answerText: DETERMINISTIC_ANSWER_TEXT,
      currentStateFindings: [],
      sourcingImplications: [],
      cxoGuidance: [],
      expertLens: [],
      riskTraps: [],
      missingData: [],
      recommendedNextAction: "Close the two open inputs before the gate review.",
      confidence: "medium",
      limits: ["Deterministic briefing; no model was called."],
      evidenceCitations: [DETERMINISTIC_CITATION],
      responseParts: parts,
    },
    agentResponseParts: parts,
    sentinelBriefing: null,
    multiAgentBriefing: null,
    nexusSummary: {
      title: "Event answer",
      summary: DETERMINISTIC_ANSWER_TEXT,
      primaryFinding: DETERMINISTIC_ANSWER_TEXT,
      recommendedNextAction: "Close the two open inputs before the gate review.",
      confidence: "medium",
    },
    warnings: [],
    suggestedActions: [],
  };
}

const callSourceCanvasChatModelMock = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({
    clientId: "client-1",
    clientKey: "example-tenant",
    userId: "user-1",
  })),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("tenancy error path should not be reached in this suite");
  }),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    id: "client-1",
    name: "Example Tenant",
    industry_code: null,
    key: "example-tenant",
  })),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(() => false),
}));

jest.mock("@/lib/source/queries", () => ({
  getSourcingEvent: jest.fn(async () => null),
  getSourcingEventForResolvedClient: jest.fn(async () => ({
    id: "evt-test",
    code: "SRC-TEST-001",
    name: "Renewal test event",
    accountName: "Example Tenant",
    currentStageKey: "responses",
    stage: "responses",
    status: "active",
    owner: "Category lead",
    problemStatement: "The renewal window opens in 60 days.",
    synopsis: "Managed services renewal, multi-year.",
    scorecard: { decisionOwner: "Category lead", criteria: [] },
  })),
  sourceEventRowToDetail: jest.fn(() => null),
}));

// A fluent read client that answers every query with no rows. The event has no
// artifacts, chunks or facts, which is the state that isolates the route's own
// substitution logic from anything the read model would contribute.
jest.mock("@/lib/data-plane/postgresCompat", () => {
  const emptyResult = { data: [], error: null };
  const builder: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "in",
    "order",
    "limit",
    "is",
    "not",
    "or",
    "filter",
    "neq",
    "gte",
    "lte",
  ]) {
    builder[method] = () => builder;
  }
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(emptyResult).then(resolve);
  builder.maybeSingle = async () => ({ data: null, error: null });
  builder.single = async () => ({ data: null, error: null });
  return {
    getAzureReadFluentClient: jest.fn(() => ({ from: () => builder })),
  };
});

jest.mock("@/lib/source/contract-evidence/read-model", () => ({
  loadContractEvidenceRuntimeSummary: jest.fn(async () => ({
    eventId: "evt-test",
    tenantKey: "example-tenant",
    manifests: [],
    families: [],
    metrics: [],
    findings: [],
    missingFamilies: [],
    warnings: [],
    userFacingSummary: "",
  })),
}));

jest.mock("@/lib/source/adapters/apex-retail-adapter", () => ({
  APEX_RETAIL_BROKER_TENANT_KEY: "apex-retail-broker",
  APEX_RETAIL_CLIENT_KEY: "apex-retail",
  buildApexRetailSourceContextAssemblyInput: jest.fn(async () => null),
  toApexRetailLiveTenantContextSnapshot: jest.fn(() => null),
}));

jest.mock("@/lib/source/nexus-api", () => {
  const actual = jest.requireActual("@/lib/source/nexus-api");
  return {
    ...actual,
    createSourceNexusApiStubResponse: jest.fn(() => deterministicStubResponse()),
  };
});

jest.mock("@/lib/source/source-canvas-chat", () => ({
  SOURCE_CANVAS_CHAT_MODEL: "claude-sonnet-4-6",
  callSourceCanvasChatModel: (...args: unknown[]) =>
    callSourceCanvasChatModelMock(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require("@/app/api/v1/source/[eventId]/nexus/ask/route") as {
  POST: (
    request: NextRequest,
    context: { params: Promise<{ eventId: string }> },
  ) => Promise<Response>;
};

async function askCanvas(): Promise<{
  agentResponseParts: AgentResponsePart[];
  sourceAnswer: {
    answerText: string;
    evidenceCitations: SourceAnswerEvidenceCitation[];
    responseParts: AgentResponsePart[];
  } | null;
  summary: string;
  warnings: string[];
}> {
  const request = {
    headers: new Headers({ "content-type": "application/json" }),
    text: async () =>
      JSON.stringify({
        prompt: "what is our exposure on this renewal?",
        mode: "event",
      }),
  } as unknown as NextRequest;

  const response = await POST(request, {
    params: Promise.resolve({ eventId: "evt-test" }),
  });
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<ReturnType<typeof askCanvas>>;
}

function citationsPart(parts: AgentResponsePart[]) {
  return parts.find(
    (part): part is Extract<AgentResponsePart, { type: "citations" }> =>
      part.type === "citations",
  );
}

function advisorAnswerPart(parts: AgentResponsePart[]) {
  return parts.find(
    (part): part is Extract<AgentResponsePart, { type: "text" }> =>
      part.type === "text" && part.title === "Advisor answer",
  );
}

function supportMetric(parts: AgentResponsePart[]) {
  const strip = parts.find(
    (part): part is Extract<AgentResponsePart, { type: "metricStrip" }> =>
      part.type === "metricStrip",
  );
  return strip?.metrics.find((metric) => metric.label === "Support");
}

beforeEach(() => {
  callSourceCanvasChatModelMock.mockReset();
});

describe("Source canvas chat · the rendered payload describes the answer that is shown", () => {
  it("carries the citations the model actually used, not the deterministic composer's", async () => {
    callSourceCanvasChatModelMock.mockResolvedValue({
      text: MODEL_ANSWER_TEXT,
      evidenceCitations: [MODEL_CITATION_ONE, MODEL_CITATION_TWO],
      warnings: [],
    });

    const body = await askCanvas();

    expect(body.sourceAnswer?.evidenceCitations.map((c) => c.id)).toEqual([
      "model-1",
      "model-2",
    ]);
    expect(body.sourceAnswer?.evidenceCitations).not.toContainEqual(
      DETERMINISTIC_CITATION,
    );
  });

  it("shows the model's citations in the rendered Evidence used card", async () => {
    callSourceCanvasChatModelMock.mockResolvedValue({
      text: MODEL_ANSWER_TEXT,
      evidenceCitations: [MODEL_CITATION_ONE, MODEL_CITATION_TWO],
      warnings: [],
    });

    const part = citationsPart((await askCanvas()).agentResponseParts);

    expect(part?.citations.map((c) => c.label)).toEqual([
      MODEL_CITATION_ONE.label,
      MODEL_CITATION_TWO.label,
    ]);
    expect(part?.citations.map((c) => c.label)).not.toContain(
      DETERMINISTIC_CITATION.label,
    );
  });

  it("renders the model's prose as the advisor answer, since the parts replace the text", async () => {
    callSourceCanvasChatModelMock.mockResolvedValue({
      text: MODEL_ANSWER_TEXT,
      evidenceCitations: [MODEL_CITATION_ONE],
      warnings: [],
    });

    const body = await askCanvas();

    expect(advisorAnswerPart(body.agentResponseParts)?.text).toBe(
      MODEL_ANSWER_TEXT,
    );
    expect(body.sourceAnswer?.answerText).toBe(MODEL_ANSWER_TEXT);
  });

  it("counts the citations it is showing, not the ones it replaced", async () => {
    callSourceCanvasChatModelMock.mockResolvedValue({
      text: MODEL_ANSWER_TEXT,
      evidenceCitations: [MODEL_CITATION_ONE, MODEL_CITATION_TWO],
      warnings: [],
    });

    expect(supportMetric((await askCanvas()).agentResponseParts)?.value).toBe(
      "2",
    );
  });

  it("removes the deterministic Evidence used card when the model cited nothing", async () => {
    callSourceCanvasChatModelMock.mockResolvedValue({
      text: "I cannot answer that from the evidence loaded for this event.",
      evidenceCitations: [],
      warnings: ["The answer cites no loaded evidence."],
    });

    const body = await askCanvas();

    expect(citationsPart(body.agentResponseParts)).toBeUndefined();
    expect(body.sourceAnswer?.evidenceCitations).toEqual([]);
    expect(supportMetric(body.agentResponseParts)?.value).toBe("0");
  });

  // Guardrail. A fix that simply drops the structured parts whenever a model
  // answers would satisfy every case above and lose the event's own read.
  it("keeps the parts that describe the event rather than the answer", async () => {
    callSourceCanvasChatModelMock.mockResolvedValue({
      text: MODEL_ANSWER_TEXT,
      evidenceCitations: [MODEL_CITATION_ONE],
      warnings: [],
    });

    const parts = (await askCanvas()).agentResponseParts;

    expect(
      parts.some(
        (part) =>
          part.type === "table" &&
          part.title === "Decision signals and sourcing implications",
      ),
    ).toBe(true);
    expect(parts.some((part) => part.type === "nextAction")).toBe(true);
    expect(supportMetric(parts)).toBeDefined();
  });

  // Guardrail. When no model answer was produced the deterministic briefing is
  // what is being shown, so its own citations are the honest ones.
  it("leaves the deterministic payload untouched when the model call fails", async () => {
    callSourceCanvasChatModelMock.mockRejectedValue(
      new Error("egress blocked: policy"),
    );

    const body = await askCanvas();

    expect(advisorAnswerPart(body.agentResponseParts)?.text).toBe(
      DETERMINISTIC_ANSWER_TEXT,
    );
    expect(citationsPart(body.agentResponseParts)?.citations[0]?.label).toBe(
      DETERMINISTIC_CITATION.label,
    );
    expect(body.sourceAnswer?.evidenceCitations).toEqual([
      DETERMINISTIC_CITATION,
    ]);
    expect(body.warnings.join(" ")).toContain(
      "fell back to the deterministic briefing",
    );
  });
});
