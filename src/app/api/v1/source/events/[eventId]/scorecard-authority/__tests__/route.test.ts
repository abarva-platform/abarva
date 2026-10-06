import type { NextRequest } from "next/server";
import { getActiveClientRow } from "@/lib/active-client";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";
import { readSourceScorecardAuthorityRecords } from "@/lib/source/proposal-intelligence/scorecard-authority-store";
import {
  approveScorecardCriterion,
  createScorecardCriterion,
  lockEvaluatorScore,
  recordEvaluatorScore,
  retireDraftCriterion,
} from "@/lib/source/proposal-intelligence/scorecard-authority-store";
import { readAcceptedCandidatesForEvent } from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { GET, POST } from "../route";

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({ userId: "user-1", clientKey: "tenant-1" })),
  tenancyErrorResponse: jest.fn(() => Response.json({ error: "unauthorized" }, { status: 401 })),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "tenant-1", name: "Tenant 1" })),
}));
jest.mock("@/lib/source/queries", () => ({
  getSourcingEventForResolvedClient: jest.fn(async () => ({ id: "event-1" })),
}));
jest.mock("@/lib/source/proposal-intelligence/scorecard-authority-store", () => ({
  readSourceScorecardAuthorityRecords: jest.fn(async () => ({
    kind: "available",
    criteria: [],
    scores: [],
  })),
  approveScorecardCriterion: jest.fn(async () => ({ ok: true })),
  createScorecardCriterion: jest.fn(async () => ({ ok: true })),
  recordEvaluatorScore: jest.fn(async () => ({ ok: true })),
  lockEvaluatorScore: jest.fn(async () => ({ ok: true })),
  retireDraftCriterion: jest.fn(async () => ({ ok: true })),
}));
jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => ({ personId: "person-1", name: "Reviewer One" })),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canApproveSourceStages: true,
    sourceEventIdsAllowed: ["event-1"],
  })),
}));
jest.mock("@/lib/source/candidate-suppliers/event-candidate-authority-repository", () => ({
  readAcceptedCandidatesForEvent: jest.fn(async () => ({
    registryAvailable: true,
    acceptedSupplierIds: ["supplier-1"],
    acceptedCandidates: [{ supplierId: "supplier-1", legalName: "Supplier One" }],
  })),
}));

const activeClient = jest.mocked(getActiveClientRow);
const getEvent = jest.mocked(getSourcingEventForResolvedClient);
const readAuthority = jest.mocked(readSourceScorecardAuthorityRecords);
const createCriterion = jest.mocked(createScorecardCriterion);
const approveCriterion = jest.mocked(approveScorecardCriterion);
const recordScore = jest.mocked(recordEvaluatorScore);
const lockScore = jest.mocked(lockEvaluatorScore);
const retireCriterion = jest.mocked(retireDraftCriterion);
const readCandidates = jest.mocked(readAcceptedCandidatesForEvent);
const currentUser = jest.mocked(getCurrentUser);
const accessPolicy = jest.mocked(loadUserSourceAccessPolicy);

function request() {
  return new Request(
    "https://app.abarva.ai/api/v1/source/events/event-1/scorecard-authority",
  ) as NextRequest;
}

function context(eventId = "event-1") {
  return { params: Promise.resolve({ eventId }) };
}

describe("GET Source event scorecard authority", () => {
  beforeEach(() => {
    activeClient.mockClear();
    getEvent.mockClear();
    readAuthority.mockClear();
    activeClient.mockResolvedValue({ key: "tenant-1", name: "Tenant 1" } as never);
    getEvent.mockResolvedValue({ id: "event-1" } as never);
    readAuthority.mockResolvedValue({
      kind: "available",
      criteria: [],
      scores: [],
    });
    accessPolicy.mockResolvedValue({ canApproveSourceStages: true, sourceEventIdsAllowed: ["event-1"] } as never);
    currentUser.mockResolvedValue({ personId: "person-1", name: "Reviewer One" } as never);
    readCandidates.mockResolvedValue({
      registryAvailable: true,
      acceptedSupplierIds: ["supplier-1"],
      acceptedCandidates: [{ supplierId: "supplier-1", legalName: "Supplier One" }],
    } as never);
  });

  it("reads authority only after the requested event resolves in the active tenant", async () => {
    const response = await GET(request(), context());
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(getEvent).toHaveBeenCalledWith("event-1", {
      activeClientKey: "tenant-1",
      activeClientName: "Tenant 1",
      tenancy: expect.objectContaining({ userId: "user-1", clientKey: "tenant-1" }),
    });
    expect(readAuthority).toHaveBeenCalledWith("event-1", "tenant-1");
    expect(await response.json()).toEqual(
      expect.objectContaining({
        eventId: "event-1",
        clientKey: "tenant-1",
        authority: expect.objectContaining({ state: "blocked" }),
      }),
    );
  });

  it("does not query authority for an absent or opposite-tenant event", async () => {
    getEvent.mockResolvedValueOnce(null);
    const response = await GET(request(), context("other-event"));
    expect(response.status).toBe(404);
    expect(readAuthority).not.toHaveBeenCalled();
  });

  it("fails closed when the schema or authority read is unavailable", async () => {
    readAuthority.mockResolvedValueOnce({ kind: "unavailable" });
    const response = await GET(request(), context());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "authority_unavailable" });
  });

  it("exposes write controls only at Evaluation for a scoped named reviewer", async () => {
    getEvent.mockResolvedValueOnce({ id: "event-1", currentStageKey: "evaluation" } as never);
    const response = await GET(request(), context());
    expect(await response.json()).toEqual(expect.objectContaining({
      canWrite: true,
      supplierOptions: [{ id: "supplier-1", name: "Supplier One" }],
    }));
    getEvent.mockResolvedValueOnce({ id: "event-1", currentStageKey: "scope" } as never);
    const blocked = await GET(request(), context());
    expect(await blocked.json()).toEqual(expect.objectContaining({ canWrite: false, supplierOptions: [] }));
  });
});

function post(action: Record<string, unknown>) {
  return new Request(
    "https://app.abarva.ai/api/v1/source/events/event-1/scorecard-authority",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) },
  ) as NextRequest;
}

describe("POST Source event scorecard authority", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeClient.mockResolvedValue({ key: "tenant-1", name: "Tenant 1" } as never);
    getEvent.mockResolvedValue({ id: "event-1", currentStageKey: "evaluation" } as never);
    currentUser.mockResolvedValue({ personId: "person-1", name: "Reviewer One" } as never);
    accessPolicy.mockResolvedValue({
      canApproveSourceStages: true,
      sourceEventIdsAllowed: ["event-1"],
    } as never);
    readCandidates.mockResolvedValue({
      registryAvailable: true,
      acceptedSupplierIds: ["supplier-1"],
      acceptedCandidates: [{ supplierId: "supplier-1", legalName: "Supplier One" }],
    } as never);
    createCriterion.mockResolvedValue({ ok: true });
    approveCriterion.mockResolvedValue({ ok: true });
    recordScore.mockResolvedValue({ ok: true });
    lockScore.mockResolvedValue({ ok: true });
    retireCriterion.mockResolvedValue({ ok: true });
  });

  it("refuses to write before Evaluation even when the request names an evaluator", async () => {
    getEvent.mockResolvedValueOnce({ id: "event-1", currentStageKey: "scope" } as never);
    const response = await POST(post({ action: "create_criterion", criterionId: "quality", criterionVersion: "v1", label: "Quality", weight: 100 }), context());
    expect(response.status).toBe(409);
    expect(createCriterion).not.toHaveBeenCalled();
  });

  it("requires active-tenant event scope, approval authority and a linked named human", async () => {
    accessPolicy.mockResolvedValueOnce({ canApproveSourceStages: true, sourceEventIdsAllowed: ["other-event"] } as never);
    expect((await POST(post({ action: "create_criterion", criterionId: "quality", criterionVersion: "v1", label: "Quality", weight: 100 }), context())).status).toBe(403);
    currentUser.mockResolvedValueOnce(null);
    expect((await POST(post({ action: "create_criterion", criterionId: "quality", criterionVersion: "v1", label: "Quality", weight: 100 }), context())).status).toBe(409);
    getEvent.mockResolvedValueOnce(null);
    expect((await POST(post({ action: "create_criterion", criterionId: "quality", criterionVersion: "v1", label: "Quality", weight: 100 }), context())).status).toBe(404);
    expect(createCriterion).not.toHaveBeenCalled();
  });

  it("creates and approves exact-version criteria with the session actor", async () => {
    expect((await POST(post({ action: "create_criterion", criterionId: "quality", criterionVersion: "v1", label: "Quality", weight: 100, approvedBy: "spoofed" }), context())).status).toBe(200);
    expect(createCriterion).toHaveBeenCalledWith({
      clientKey: "tenant-1", eventId: "event-1", criterionId: "quality", criterionVersion: "v1", label: "Quality", weight: 100,
    });
    expect((await POST(post({ action: "approve_criterion", criterionId: "quality", criterionVersion: "v1" }), context())).status).toBe(200);
    expect(approveCriterion).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: "tenant-1", eventId: "event-1", criterionId: "quality", criterionVersion: "v1", actorId: "person-1", actorName: "Reviewer One",
    }));
  });

  it("retires only an exact-version draft through the scoped action", async () => {
    expect((await POST(post({ action: "retire_criterion", criterionId: "quality", criterionVersion: "v1" }), context())).status).toBe(200);
    expect(retireCriterion).toHaveBeenCalledWith({ clientKey: "tenant-1", eventId: "event-1", criterionId: "quality", criterionVersion: "v1" });
  });

  it("only scores an accepted event supplier and ignores forged evaluator identity", async () => {
    expect((await POST(post({ action: "record_score", vendorId: "supplier-2", criterionId: "quality", criterionVersion: "v1", score: 8, evidenceReference: "artifact-1:v1" }), context())).status).toBe(409);
    expect(recordScore).not.toHaveBeenCalled();
    const response = await POST(post({ action: "record_score", vendorId: "supplier-1", vendorName: "Spoofed", criterionId: "quality", criterionVersion: "v1", score: 8, evidenceReference: "artifact-1:v1", evaluatorId: "spoofed" }), context());
    expect(response.status).toBe(200);
    expect(recordScore).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: "tenant-1", eventId: "event-1", vendorId: "supplier-1", vendorName: "Supplier One", criterionId: "quality", criterionVersion: "v1", score: 8, evidenceReference: "artifact-1:v1", actorId: "person-1", actorName: "Reviewer One",
    }));
  });

  it("locks only the session evaluator's exact score and rejects malformed inputs", async () => {
    expect((await POST(post({ action: "record_score", vendorId: "supplier-1", criterionId: "quality", criterionVersion: "v1", score: "8", evidenceReference: "artifact-1:v1" }), context())).status).toBe(400);
    expect(recordScore).not.toHaveBeenCalled();
    expect((await POST(post({ action: "lock_score", vendorId: "supplier-1", criterionId: "quality", criterionVersion: "v1" }), context())).status).toBe(200);
    expect(lockScore).toHaveBeenCalledWith(expect.objectContaining({
      clientKey: "tenant-1", eventId: "event-1", vendorId: "supplier-1", criterionId: "quality", criterionVersion: "v1", actorId: "person-1", actorName: "Reviewer One",
    }));
  });
});
