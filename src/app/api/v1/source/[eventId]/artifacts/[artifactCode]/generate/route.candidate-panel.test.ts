import { generateSourceArtifactDraft } from "./route";
import { readAcceptedCandidatesForEvent } from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";
import { findUnsatisfiedRequiredUpstream } from "@/lib/source/contracts/upstream-satisfaction";

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
  getPromptTemplate: jest.fn((artifactCode: string) => ({
    artifactCode,
    systemPrompt: "draft",
    upstreamRequired: ["d09_rfp_pack"],
    upstreamOptional: [],
    model: "test-model",
    maxTokens: 1000,
  })),
  buildSourceGenerationContext: jest.fn(async () => ({
    event: { id: "event-1", code: "SYN-1", currentStageKey: "rfp" },
    tenantKey: "synthetic-tenant",
    artifactStates: [],
  })),
  collectUpstreamBodies: jest.fn(() => ({})),
}));
jest.mock("@/lib/source/contracts/current-client-final", () => ({
  findCurrentAcceptedClientFinal: jest.fn(async () => null),
}));
jest.mock("@/lib/source/contracts/upstream-satisfaction", () => ({
  findUnsatisfiedRequiredUpstream: jest.fn(async () => ["d09_rfp_pack"]),
  findUnsatisfiedDraftableUpstream: jest.fn(() => ["d09_rfp_pack"]),
}));
jest.mock("@/lib/source/candidate-suppliers/event-candidate-authority-repository", () => ({
  readAcceptedCandidatesForEvent: jest.fn(),
}));

const readCandidates = jest.mocked(readAcceptedCandidatesForEvent);
const upstream = jest.mocked(findUnsatisfiedRequiredUpstream);

async function generate(artifactCode = "d12_vendor_shortlist") {
  return generateSourceArtifactDraft(
    new Request("https://app.example.test/generate", { method: "POST", body: "{}" }),
    { params: Promise.resolve({ eventId: "event-1", artifactCode }) },
  );
}

beforeEach(() => {
  readCandidates.mockReset();
  upstream.mockClear();
});

it("refuses a shortlist draft when the event has no accepted candidate panel", async () => {
  readCandidates.mockResolvedValue({ registryAvailable: true, acceptedSupplierIds: [], acceptedCandidates: [] });
  const response = await generate();
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ error: "candidate_panel_required" });
  expect(readCandidates).toHaveBeenCalledWith({ clientKey: "synthetic-tenant", eventId: "event-1" });
  expect(upstream).not.toHaveBeenCalled();
});

it("refuses a shortlist draft when candidate authority cannot be read", async () => {
  readCandidates.mockResolvedValue({ registryAvailable: false, acceptedSupplierIds: [], acceptedCandidates: [] });
  const response = await generate();
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ error: "candidate_authority_unavailable" });
  expect(upstream).not.toHaveBeenCalled();
});

it("continues to the document prerequisite when an accepted candidate exists", async () => {
  readCandidates.mockResolvedValue({
    registryAvailable: true,
    acceptedSupplierIds: ["vendor-1"],
    acceptedCandidates: [{
      authorityId: "authority-1",
      supplierId: "vendor-1",
      legalEntityId: "vendor-1",
      legalName: "Example Supplier",
      acceptedByName: "Procurement Reviewer",
      acceptedAt: "2026-09-30T00:00:00Z",
      acceptanceRationale: "Relevant to the event scope",
      evidenceReference: "registry-1",
    }],
  });
  const response = await generate();
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ error: "upstream_required" });
  expect(upstream).toHaveBeenCalledTimes(1);
});

it("does not require the candidate panel for other artifact drafts", async () => {
  const response = await generate("d09_rfp_pack");
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ error: "upstream_required" });
  expect(readCandidates).not.toHaveBeenCalled();
});
