import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { answerCurrentTowerQuestion } from "@/lib/tower/current-layer-answer";

import { POST } from "./route";

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
  canonicalCioTowerTenantKey: jest.fn((value: string) => value),
}));

jest.mock("@/lib/tower/visual-contract", () => ({
  towerProgressEventsForQuestion: jest.fn(() => []),
}));

const mockGetActiveClientRow = jest.mocked(getActiveClientRow);
const mockRequireTenancy = jest.mocked(requireTenancy);
const mockAnswerCurrentTowerQuestion = jest.mocked(answerCurrentTowerQuestion);

describe("POST /api/tower/chat", () => {
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

  it("uses the selected client key when resolving the Tower answer context", async () => {
    const response = await POST(
      new Request("https://example.test/api/tower/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What value is claimable?",
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
        tenantId: "selected-client-id",
        tenantKey: "selected-client",
        tenantKeyCandidates: [
          "selected-client",
          "selected-client-id",
          "Selected Client",
          "selected-client",
          "session-client",
          "session-client-id",
        ],
        tenantName: "Selected Client",
        question: "What value is claimable?",
        pageContext: {
          activeTab: "tools",
          activeView: "rollouts",
        },
      }),
    );
  });
});
