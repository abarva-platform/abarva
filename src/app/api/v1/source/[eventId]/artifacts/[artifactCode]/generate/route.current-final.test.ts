import { generateSourceArtifactDraft } from "./route";
import { findCurrentAcceptedClientFinal } from "@/lib/source/contracts/current-client-final";
import { readVerifiedClientFinalText } from "@/lib/source/contracts/verified-client-final-text";

const mockArtifactState = jest.fn();
const mockUpdateArtifactBody = jest.fn();
const mockReviewStream = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({ clientKey: "synthetic-tenant", userId: "owner-1" })),
  tenancyErrorResponse: jest.fn(),
}));
jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => ({ clerkUserId: "owner-1" })),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ id: "client-1", key: "synthetic-tenant" })),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({ canGenerateSourcingArtifacts: true })),
}));
jest.mock("@/lib/source/queries", () => ({
  ensurePersistedSourceEventForClient: jest.fn(async () => undefined),
  scaffoldNewEventSubstrate: jest.fn(async () => undefined),
}));
jest.mock("@/lib/source/agent-generation/server", () => ({
  getPromptTemplate: jest.fn(() => ({
    artifactCode: "d01_strategy_memo", systemPrompt: "draft",
    upstreamRequired: [], upstreamOptional: [], model: "test-model", maxTokens: 1000,
  })),
  collectUpstreamBodies: jest.fn(() => ({})),
  buildSourceGenerationContext: jest.fn(async () => ({
    event: { id: "event-1", code: "SYN-1", currentStageKey: "scope" },
    tenantKey: "synthetic-tenant", artifactStates: [],
  })),
}));
jest.mock("@/lib/source/contracts/current-client-final", () => ({
  findCurrentAcceptedClientFinal: jest.fn(async () => ({ id: "final-1" })),
}));
jest.mock("@/lib/source/contracts/verified-client-final-text", () => ({
  readVerifiedClientFinalText: jest.fn(async () => ({ text: "Accepted body", method: "text" })),
}));
jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({ updateArtifactBody: mockUpdateArtifactBody })),
}));
jest.mock("@/lib/integrations/ai-egress", () => ({
  preflightAnthropicDirectClient: jest.fn(async () => ({
    ok: true, client: { messages: { stream: mockReviewStream } },
  })),
}));
jest.mock("@/lib/source/agent-generation/quality-review", () => ({
  ...jest.requireActual("@/lib/source/agent-generation/quality-review"),
  requiresSourceConsultingGradeGate: jest.fn(() => true),
  shortSourceArtifactCode: jest.fn((code: string) => code),
  buildSourceQualitySourceContext: jest.fn(() => "source context"),
  buildSourceConsultingGradeReviewPrompt: jest.fn(() => "review prompt"),
  parseSourceConsultingGradeReview: jest.fn(() => ({ pass: false })),
  applyDeterministicSourceClaimGate: jest.fn((review: unknown) => review),
  findDeterministicSourceClaimViolations: jest.fn(() => []),
  buildSourceQualityGateMetadata: jest.fn(() => ({
    passed: false, finalSummary: "Review failed", rewriteAttempted: false,
  })),
}));
jest.mock("@/lib/source/contracts/upstream-satisfaction", () => ({
  findUnsatisfiedRequiredUpstream: jest.fn(async () => []),
  findUnsatisfiedDraftableUpstream: jest.fn(() => []),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: mockArtifactState }),
        }),
      }),
    }),
  })),
}));

it("rejects regeneration before AI or artifact writes when a Client Final is current", async () => {
  const response = await generateSourceArtifactDraft(
    new Request("http://localhost/generate", { method: "POST", body: "{}" }),
    { params: Promise.resolve({ eventId: "event-1", artifactCode: "d01_strategy_memo" }) },
  );
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ error: "client_final_current" });
  expect(findCurrentAcceptedClientFinal).toHaveBeenCalledWith(
    "event-1", "synthetic-tenant", "d01_strategy_memo",
  );
});

it("rejects quality review of a stale substrate link without replacing the accepted final", async () => {
  mockArtifactState.mockResolvedValueOnce({
    data: { id: "state-1", status: "approved", linked_artifact_id: "draft-1", body: "Draft body" },
    error: null,
  });
  const response = await generateSourceArtifactDraft(
    new Request("http://localhost/generate", {
      method: "POST", body: JSON.stringify({ reviewExistingBody: true }),
    }),
    { params: Promise.resolve({ eventId: "event-1", artifactCode: "d01_strategy_memo" }) },
  );
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ error: "client_final_link_restore_required" });
});

it("records a failed review of the verified final without writing body, status, or link", async () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "test-key";
  const state = {
    id: "state-1", source_event_id: "event-1", tenant_key: "synthetic-tenant",
    artifact_code: "d01_strategy_memo", stage_key: "strategy", tier: "full",
    status: "approved", linked_artifact_id: "final-1", body: "Accepted body",
    body_generation_metadata: { clientFinal: { artifactId: "final-1" } },
  };
  mockArtifactState.mockResolvedValueOnce({ data: state, error: null });
  mockReviewStream.mockReturnValueOnce({
    finalMessage: jest.fn(async () => ({ content: [{ type: "text", text: "{}" }] })),
  });
  mockUpdateArtifactBody.mockImplementationOnce(async ({ columns }: { columns: Record<string, unknown> }) => ({
    ok: true, data: { ...state, ...columns },
  }));
  try {
    const response = await generateSourceArtifactDraft(
      new Request("http://localhost/generate", {
        method: "POST", body: JSON.stringify({ reviewExistingBody: true }),
      }),
      { params: Promise.resolve({ eventId: "event-1", artifactCode: "d01_strategy_memo" }) },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, qualityGateFailed: true });
    expect(readVerifiedClientFinalText).toHaveBeenCalled();
    expect(mockReviewStream).toHaveBeenCalledTimes(1);
    expect(mockUpdateArtifactBody).toHaveBeenCalledTimes(1);
    const columns = mockUpdateArtifactBody.mock.calls[0]?.[0].columns;
    expect(Object.keys(columns).sort()).toEqual(["body_generation_metadata", "updated_at"]);
    expect(columns.body_generation_metadata).toMatchObject({
      reviewedClientFinal: { artifactId: "final-1" },
      qualityGate: { passed: false, rewriteAttempted: false },
    });
  } finally {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
});
