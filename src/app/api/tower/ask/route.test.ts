import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { answerCurrentTowerQuestion } from "@/lib/tower/current-layer-answer";

import { buildAvaTowerAskPrompt, POST } from "./route";

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(),
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(),
  tenancyErrorResponse: jest.fn(() =>
    Response.json({ error: "tenancy" }, { status: 403 }),
  ),
}));

jest.mock("@/lib/tower/current-layer-answer", () => ({
  answerCurrentTowerQuestion: jest.fn(),
}));

jest.mock("@/lib/tower/metric-packet", () => ({
  canonicalCioTowerTenantDisplayName: jest.fn(
    ({ name }: { name?: string | null }) => name ?? null,
  ),
  canonicalCioTowerTenantKey: jest.fn((value: string) => value),
}));

jest.mock("@/lib/client-config", () => ({
  demoSafeClientText: jest.fn((value: string | null) => value),
}));

jest.mock("@/lib/agent/all-agent-doctrine", () => ({
  composeAllAgentDoctrineBlock: jest.fn(() => "agent doctrine"),
}));

jest.mock("@/lib/agent/demo-context", () => ({
  AGENT_DEMO_SYSTEM_BLOCK: "demo context",
}));

jest.mock("@/lib/intelligence/synthesis/instructionLayer", () => ({
  FOUR_LAYER_REASONING_INSTRUCTIONS: "four-layer reasoning",
}));

jest.mock("@/lib/intelligence/ask/response-policy", () => ({
  CONSULTANT_ANSWER_SHAPE_CONTRACT:
    "CONSULTANT ANSWER SHAPE active tenant display name direct recommendation or judgment specific tenant facts executive decision and the next useful action Do not print visible section labels",
}));

const mockGetActiveClientRow = jest.mocked(getActiveClientRow);
const mockRequireTenancy = jest.mocked(requireTenancy);
const mockAnswerCurrentTowerQuestion = jest.mocked(answerCurrentTowerQuestion);

describe("Tower Ava ask prompt", () => {
  it("inherits the shared consultant answer shape", () => {
    const prompt = buildAvaTowerAskPrompt("USER CONTEXT");

    expect(prompt).toContain("CONSULTANT ANSWER SHAPE");
    expect(prompt).toContain("active tenant display name");
    expect(prompt).toContain("direct recommendation or judgment");
    expect(prompt).toContain("specific tenant facts");
    expect(prompt).toContain("executive decision and the next useful action");
    expect(prompt).toContain("Do not print visible section labels");
  });
});

describe("POST /api/tower/ask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireTenancy.mockResolvedValue({
      clientId: "session-client-id",
      clientKey: "session-client",
      userId: "user-1",
    });
    mockGetActiveClientRow.mockResolvedValue({
      id: "selected-client-id",
      key: "selected-client",
      name: "Selected Client",
      industry_code: null,
    });
    mockAnswerCurrentTowerQuestion.mockResolvedValue({
      response: "Tower answer.",
      modelOutputRaw: "{}",
      modelOutput: {
        version: "cio_tower_visible_answer_v1",
        answer: "Tower answer.",
        tables: [],
        tabs: [],
        visualContract: null,
        followUpQuestion: null,
      },
      promptPackageKey: "prompt-1",
      traceKey: "trace-1",
      promptHash: "hash-1",
      model: "tower-current-layer-deterministic-v2",
      validationStatus: "passed",
      validationErrors: [],
      latencyMs: 1,
      metricCards: [],
      gaps: [],
      v6VisibleOutputAudit: {
        passed: true,
        version: "visible_answer_contract_v1",
        violations: [],
      },
    });
  });

  it("keeps the selected Tower tenant candidate set on the legacy ask path", async () => {
    const response = await POST(
      new Request("https://example.test/api/tower/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Show me the tool rollouts",
          clientKey: "selected-client",
          pageContext: {
            activeTab: "tools",
            activeView: "rollouts",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockGetActiveClientRow).toHaveBeenCalledWith("selected-client");
    expect(mockAnswerCurrentTowerQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "session-client-id",
        tenantKey: "session-client",
        tenantKeyCandidates: [
          "selected-client",
          "selected-client-id",
          "Selected Client",
          "selected-client",
          "session-client",
          "session-client-id",
        ],
        tenantName: "Selected Client",
        question: "Show me the tool rollouts",
        pageContext: {
          activeTab: "tools",
          activeView: "rollouts",
        },
      }),
    );
  });
});
