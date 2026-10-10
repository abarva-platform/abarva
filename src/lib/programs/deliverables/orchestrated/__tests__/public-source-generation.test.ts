import { buildMoveDeliverableRequest } from "../build-request";
import { runOrchestratedMoveDeliverable } from "../run-orchestrated-move-deliverable";
import type { MoveBusinessCaseInput } from "../../../move-business-case";
import type { PublicSource } from "@/lib/deliverables/public-research/types";
import { PUBLIC_SOURCES_UNAVAILABLE_DETAIL } from "@/lib/deliverables/public-research/generation-feed";
import { loadPublicSourcesForGeneration } from "@/lib/deliverables/public-research/generation-feed";
import { listApprovedPublicSources } from "@/lib/deliverables/public-research/repository";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { runDeliverableForTenant } from "@/lib/deliverables/orchestrator/generate-service";
import type { DeliverableIntelligenceRequest } from "@/lib/deliverables/orchestrator/types";

jest.mock("@/lib/deliverables/public-research/repository", () => ({ listApprovedPublicSources: jest.fn() }));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: jest.fn((_ctx, key) => key === "moves_public_source_research") }));

const MOVE_ID = "12345678-1234-4234-8234-123456789abc";
const OTHER_MOVE_ID = "22345678-1234-4234-8234-123456789abc";
const BASE: MoveBusinessCaseInput = {
  industry_code: "general",
  name: "Demo Move",
  charter: { scope: "Review the program rule." },
  baseline_metrics: [],
  tenant_key: "meridian",
};
const OPTIONS = {
  deliverableType: "business_case",
  phaseOrStage: "P4_business_case",
  artifactStandard: "moves.board_grade.costed_business_case",
  decisionContext: "Fund or hold.",
};

function source(overrides: Partial<PublicSource> = {}): PublicSource {
  return {
    id: "s-1",
    tenantKey: "meridian",
    programId: MOVE_ID,
    runId: "r-1",
    kind: "public_source",
    sourceClass: "public_source",
    url: "https://example.org/rule",
    title: "Public rule",
    publisher: "Public agency",
    publishedAt: "2026-01-02",
    retrievedAt: "2026-10-10T10:00:00Z",
    excerpt: "The public rule says 20%.",
    claim: "Public threshold",
    confidence: "high",
    decision: "approved",
    reviewedByUserId: "u-1",
    reviewedAt: "2026-10-10T11:00:00Z",
    reviewNote: null,
    createdAt: "2026-10-10T10:00:00Z",
    ...overrides,
  };
}

describe("Move public-source generation boundary", () => {
  const queuedInput = {
    module: "moves" as const,
    useCaseArchetype: "general",
    deliverableType: "business_case",
    decisionContext: "Fund or hold.",
    clientDisplayName: "Demo Client",
    initiativeDisplayName: "Demo Move",
    tenantClientKey: "meridian",
    clientId: "client-1",
    userId: "user-1",
    sourceArtifactRef: MOVE_ID,
  };
  const assemble = jest.fn(async () => ({
    evidence: [],
    sourceRegister: [],
    retrievedCount: 0,
    coverage: {
      approvedAvailable: 0,
      retrieved: 0,
      packed: 0,
      droppedForBudget: 0,
      unreadable: 0,
      cited: 0,
      coverageRatio: null,
      coverageState: "no_approved_evidence",
      requiresAttention: false,
      usedTokens: 0,
      evidenceTokenBudget: 1000,
    },
  }));

  beforeEach(() => {
    jest.mocked(isFeatureEnabled).mockImplementation((_ctx, key) => key === "moves_public_source_research");
    jest.mocked(listApprovedPublicSources).mockReset();
    assemble.mockClear();
  });

  it("reads the authenticated tenant and exact Move, then rejects cross-Move and unapproved rows", async () => {
    jest.mocked(listApprovedPublicSources).mockResolvedValue({
      ok: true,
      sources: [
        source(),
        source({ id: "s-2", programId: OTHER_MOVE_ID }),
        source({ id: "s-3", tenantKey: "another-tenant" }),
        source({ id: "s-4", decision: "pending" }),
      ],
    });
    const found = await loadPublicSourcesForGeneration(
      { clientKey: "meridian" } as never,
      MOVE_ID,
      "meridian",
    );
    expect(listApprovedPublicSources).toHaveBeenCalledWith({ tenantKey: "meridian", programId: MOVE_ID });
    expect(found?.map((row) => row.id)).toEqual(["s-1"]);
  });

  it("makes no source read when the flag is off", async () => {
    jest.mocked(isFeatureEnabled).mockReturnValue(false);
    expect(await loadPublicSourcesForGeneration({ clientKey: "meridian" } as never, MOVE_ID, "meridian")).toBeNull();
    expect(listApprovedPublicSources).not.toHaveBeenCalled();
  });

  it("throws on a failed approved-source read instead of treating it as empty", async () => {
    jest.mocked(listApprovedPublicSources).mockResolvedValue({
      ok: false,
      reason: "read_failed",
      detail: "unavailable",
    });
    await expect(
      loadPublicSourcesForGeneration({ clientKey: "meridian" } as never, MOVE_ID, "meridian"),
    ).rejects.toThrow(PUBLIC_SOURCES_UNAVAILABLE_DETAIL);
  });

  it("loads approved sources before queued research and passes them into the Move request", async () => {
    const order: string[] = [];
    const seen: DeliverableIntelligenceRequest[] = [];
    const result = await runDeliverableForTenant(queuedInput, {
      loadPublicSources: async () => { order.push("source-read"); return [source()]; },
      research: (async () => { order.push("research"); return { status: "skipped", origin: "not_run", runId: null, briefHash: null, pendingSources: 0, recorded: false, auditId: null, note: "No outside sources" }; }) as never,
      assemble: (async () => { order.push("assemble"); return assemble(); }) as never,
      loadAssumptionRegister: async () => null,
      generate: (async (req: DeliverableIntelligenceRequest) => { seen.push(req); return { ok: false, blockedReason: "stop", quality: { pass: false, blockers: [], warnings: [] } }; }) as never,
    });
    expect(result.ok).toBe(false);
    expect(order).toEqual(["source-read", "research", "assemble"]);
    expect(seen[0].publicSources?.[0]).toMatchObject({ citationNumber: 1, title: "Public rule" });
  });

  it("blocks a queued build on source-read failure before either model call", async () => {
    const research = jest.fn();
    const generate = jest.fn();
    const result = await runDeliverableForTenant(queuedInput, {
      loadPublicSources: async () => { throw new Error("read failed"); },
      research: research as never,
      generate: generate as never,
      assemble: assemble as never,
    });
    expect(result.blockedReason).toBe(`public_sources_unavailable: ${PUBLIC_SOURCES_UNAVAILABLE_DETAIL}`);
    expect(research).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
    expect(assemble).not.toHaveBeenCalled();
  });

  it("does not reinterpret a missing flagged read as an empty approval set", async () => {
    const generate = jest.fn();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const result = await runDeliverableForTenant(queuedInput, {
        loadPublicSources: async () => null,
        generate: generate as never,
      });
      expect(result.blockedReason).toContain("public_sources_unavailable");
      expect(generate).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("leaves the request byte identical when the flag is off", () => {
    const before = buildMoveDeliverableRequest(BASE, OPTIONS).request;
    const after = buildMoveDeliverableRequest({ ...BASE, publicSourceResearch: undefined }, OPTIONS).request;
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
    expect("publicSources" in before).toBe(false);
  });

  it("feeds approved sources only and numbers them within the Move", () => {
    const input: MoveBusinessCaseInput = {
      ...BASE,
      publicSourceResearch: {
        status: "loaded",
        sources: [source(), source({ id: "s-2", decision: "pending" }), source({ id: "s-3", decision: "rejected" })],
      },
    };
    const { request } = buildMoveDeliverableRequest(input, OPTIONS);
    expect(request.publicSources).toEqual([expect.objectContaining({ citationNumber: 1, title: "Public rule" })]);
    expect(JSON.stringify(request.publicSources)).not.toContain("reviewedByUserId");
  });

  it("uses the review panel's stable approval-order citation numbers", () => {
    const older = source({ id: "s-old", reviewedAt: "2026-10-08T11:00:00Z", title: "Older" });
    const newer = source({ id: "s-new", reviewedAt: "2026-10-10T11:00:00Z", title: "Newer" });
    const { request } = buildMoveDeliverableRequest(
      { ...BASE, publicSourceResearch: { status: "loaded", sources: [newer, older] } },
      OPTIONS,
    );
    expect(request.publicSources?.map((item) => [item.citationNumber, item.title])).toEqual([
      [1, "Older"],
      [2, "Newer"],
    ]);
  });

  it("refuses a failed source read before model invocation", async () => {
    const modelCaller = jest.fn();
    const result = await runOrchestratedMoveDeliverable({
      ...OPTIONS,
      moveInput: { ...BASE, publicSourceResearch: { status: "unavailable" } },
      moveId: MOVE_ID,
      tenantId: "meridian",
      generatedOn: "2026-10-10",
      modelCaller: modelCaller as never,
    });
    expect(result.ok).toBe(false);
    expect(result.blockedReason).toBe(`public_sources_unavailable: ${PUBLIC_SOURCES_UNAVAILABLE_DETAIL}`);
    expect(modelCaller).not.toHaveBeenCalled();
  });

  it("retains only the approved source's public fields", () => {
    const { request } = buildMoveDeliverableRequest(
      { ...BASE, publicSourceResearch: { status: "loaded", sources: [source()] } },
      OPTIONS,
    );
    expect(request.publicSources?.[0]).toEqual({
      citationNumber: 1,
      url: "https://example.org/rule",
      title: "Public rule",
      publisher: "Public agency",
      publishedAt: "2026-01-02",
      retrievedAt: "2026-10-10T10:00:00Z",
      excerpt: "The public rule says 20%.",
      claim: "Public threshold",
    });
  });
});
