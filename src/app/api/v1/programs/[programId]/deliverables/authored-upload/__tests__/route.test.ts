/** @jest-environment node */
import { createHash } from "node:crypto";
const move = "10000000-0000-4000-8000-000000000001";
const fileId = "20000000-0000-4000-8000-000000000001";
const documentId = "30000000-0000-4000-8000-000000000001";
const versionId = "40000000-0000-4000-8000-000000000001";
const requestId = "50000000-0000-4000-8000-000000000001";
const bytes = Buffer.from("Synthetic editable DOCX parser fixture");
const sha = createHash("sha256").update(bytes).digest("hex");
let rows: unknown[] | null = [];
let inventoryError: unknown = null;
let retained: unknown = null;
let artifact: Record<string, unknown>;
let flag = true;
const policy = { canUploadArtifacts: true, canGenerateDeliverables: true, programIdsAllowed: null as string[] | null };
const mockSave = jest.fn(); const mockExtract = jest.fn(); const mockParse = jest.fn();
const mockProtection = jest.fn(); const mockWrite = jest.fn(); const mockDownload = jest.fn();
const mockProgram = jest.fn(); const mockPolicy = jest.fn(); const mockSnapshot = jest.fn();
const mockCanStore = jest.fn(); const mockCurrent = jest.fn();
jest.mock("@/app/api/v1/programs/_auth", () => ({ requireTenancy: async () => ({ clientId: "client-1", clientKey: "meridian", userId: "operator-1" }), tenancyErrorResponse: (e: unknown) => { throw e; } }));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: () => flag }));
jest.mock("@/lib/auth/program-access-policy", () => ({ loadUserProgramAccessPolicy: (...a: unknown[]) => mockPolicy(...a) }));
jest.mock("@/lib/agent/restricted-output-policy", () => ({ sanitizeRestrictedFinancialText: (...a: unknown[]) => mockCanStore(...a) }));
jest.mock("@/lib/programs/queries", () => ({ getProgramById: (...a: unknown[]) => mockProgram(...a) }));
jest.mock("@/lib/ingestion/document-upload-parser", () => ({ parseIngestionDocument: (...a: unknown[]) => mockParse(...a) }));
jest.mock("@/lib/programs/current-state-doc-ingest", () => ({ assessMoveUploadSensitivity: (...a: unknown[]) => mockProtection(...a) }));
jest.mock("@/lib/programs/evidence-ingestion", () => ({ extractProgramEvidenceFromUploadBuffer: (...a: unknown[]) => mockExtract(...a) }));
jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({ loadApprovedMoveEvidenceSnapshot: (...a: unknown[]) => mockSnapshot(...a), approvedMoveEvidenceRevisionForPhase: () => "b".repeat(64), isApprovedMoveEvidenceBasisCurrent: (...a: unknown[]) => mockCurrent(...a) }));
jest.mock("@/lib/data-plane/write-adapters/programsWriteAdapter", () => ({ createAzureProgramsWriteAdapter: () => ({ runInitialAuthoredDeliverable: (...a: unknown[]) => mockWrite(...a) }) }));
jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({ saveMoveArtifact: (...a: unknown[]) => mockSave(...a), getMoveArtifactForTenant: async () => artifact, downloadArtifactOutcome: (...a: unknown[]) => mockDownload(...a) }));
jest.mock("@/lib/data-plane/postgresCompat", () => ({ getAzureWriteFluentClient: () => ({ from: (table: string) => {
  const result = () => table === "deliverables_v2" ? { data: rows, error: inventoryError } : { data: retained, error: null };
  const q = { select: () => q, eq: () => q, maybeSingle: async () => result(), then: (resolve: (v: unknown) => unknown) => Promise.resolve(result()).then(resolve) }; return q;
} }) }));

import { POST } from "../route";
import { verifyAuthoredApproval, type AuthoredUploadReceipt } from "@/lib/programs/authored-deliverable-upload";
const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
function receipt(): AuthoredUploadReceipt { return { source: "authored_docx_upload", origin: "abarva_uploaded", tenantKey: "meridian-health", storageTenantKey: "meridian", moveId: move, deliverableTypeKey: "charter", phase: 1,
  requestId, sha256: sha, artifactId: fileId, artifactVersion: 1, uploadedBy: "operator-1", authoringBasis: "abarva_authored_unsigned", delegatedReviewReference: null,
  originalFileName: "charter.docx", parseMethod: "docx-parser", evidenceSnapshotHash: "a".repeat(64), phaseEvidenceSnapshotHash: "b".repeat(64), evidenceSnapshotScope: "phase", observedAt: "2026-10-12T18:00:00Z" }; }
async function upload(fields: Partial<Record<string, string>> = {}, options: { name?: string; mime?: string; body?: Buffer } = {}) {
  const f = new FormData(); f.set("file", new File([new Uint8Array(options.body ?? bytes)], options.name ?? "charter.docx", { type: options.mime ?? mime }));
  for (const [k,v] of Object.entries({ deliverableTypeKey: "charter", expectedState: "absent", expectedFileSha256: sha, requestId, ...fields })) if (typeof v === "string") f.set(k,v);
  return POST(new Request("http://localhost/upload", { method: "POST", body: f }), { params: Promise.resolve({ programId: move }) });
}
beforeEach(() => {
  jest.clearAllMocks(); rows = []; inventoryError = null; retained = null; flag = true;
  policy.canUploadArtifacts = true; policy.canGenerateDeliverables = true; policy.programIdsAllowed = null;
  mockPolicy.mockResolvedValue(policy); mockProgram.mockResolvedValue({ id: move, current_phase: 1 });
  mockCanStore.mockImplementation(text => text); mockParse.mockResolvedValue({ text: "Authored text" });
  mockProtection.mockResolvedValue({ decision: "allow" });
  mockExtract.mockResolvedValue({ extractedText: "Authored text", extractedStructured: { parse_method: "docx-parser" } });
  mockSnapshot.mockResolvedValue({ revision: "a".repeat(64) }); mockCurrent.mockReturnValue(true);
  mockDownload.mockResolvedValue({ ok: true, file: { bytes, fileName: "charter.docx", fileFormat: "docx" } });
  artifact = { artifact_id: fileId, move_id: move, phase: 1, file_format: "docx", version: 1,
    metadata: { storage: "azure_blob", sha256: sha, authoredRequestId: requestId, canonicalDeliverableKey: "charter", authoredOrigin: "abarva_uploaded" } };
  mockSave.mockResolvedValue({ artifactId: fileId, version: 1, blobStored: true });
  mockWrite.mockImplementation(input => Promise.resolve({ ok: true, data: { kind: "created", deliverableId: documentId, versionId, version: 1, currentVersion: 1, receipt: input.receipt } }));
});

it.each(["charter", "discovery_plan"])("admits actual %s original bytes as an unsigned authored version", async key => {
  artifact.metadata = { ...(artifact.metadata as object), canonicalDeliverableKey: key };
  const res = await upload({ deliverableTypeKey: key, origin: "ai_generated" });
  expect(res.status).toBe(201); expect(await res.json()).toMatchObject({ origin: "abarva_uploaded", currentVersion: 1, artifactId: fileId, sha256: sha });
  const [ctx, file] = mockSave.mock.calls[0]; expect(ctx.clientKey).toBe("meridian");
  expect(file).toMatchObject({ phase: 1, status: "draft", citationReady: false, requireBlobStored: true, body: bytes });
  expect(file.artifactType).toContain(requestId); expect(file.artifactType).not.toBe(key);
  expect(mockWrite.mock.calls[0][0]).toMatchObject({ content: "Authored text", receipt: { deliverableTypeKey: key, phase: 1, origin: "abarva_uploaded", uploadedBy: "operator-1", authoringBasis: "abarva_authored_unsigned" } });
});
it.each(["canUploadArtifacts", "canGenerateDeliverables"] as const)("refuses missing %s before storing", async cap => {
  policy[cap] = false; expect((await upload()).status).toBe(403); expect(mockSave).not.toHaveBeenCalled();
});
it("refuses a different allowed Move", async () => { policy.programIdsAllowed = ["other"]; expect((await upload()).status).toBe(403); expect(mockSave).not.toHaveBeenCalled(); });
it("keeps the new endpoint unavailable when its flag is off", async () => { flag = false; expect((await upload()).status).toBe(404); expect(mockProgram).not.toHaveBeenCalled(); });
it("refuses an unreadable Move or failed policy read", async () => {
  mockProgram.mockResolvedValue(null); expect((await upload()).status).toBe(404);
  mockProgram.mockResolvedValue({ id: move }); mockPolicy.mockRejectedValue(new Error("read failed")); expect((await upload()).status).toBe(503); expect(mockSave).not.toHaveBeenCalled();
});
it.each(["discovery_report", "unknown"])("refuses an undeclared initial P1 key %s", async key => { expect((await upload({ deliverableTypeKey: key })).status).toBe(422); expect(mockSave).not.toHaveBeenCalled(); });
it.each([{ expectedState: "present" }, { requestId: "not-an-id" }, { expectedFileSha256: "" }])("requires a complete absence/hash/request receipt %j", async fields => { expect((await upload(fields)).status).toBe(400); expect(mockSave).not.toHaveBeenCalled(); });
it("refuses a reviewed-byte hash mismatch", async () => { expect((await upload({ expectedFileSha256: "0".repeat(64) })).status).toBe(409); expect(mockSave).not.toHaveBeenCalled(); });
it("refuses another format and a malformed DOCX package", async () => {
  expect((await upload({}, { name: "file.pdf", mime: "application/pdf" })).status).toBe(415);
  mockParse.mockRejectedValue(new Error("not DOCX")); expect((await upload()).status).toBe(422); expect(mockSave).not.toHaveBeenCalled();
});
it("preserves sensitivity and restricted financial visibility refusals", async () => {
  mockProtection.mockResolvedValue({ decision: "quarantine" }); expect((await upload()).status).toBe(422);
  mockProtection.mockResolvedValue({ decision: "allow" }); mockCanStore.mockReturnValue("redacted"); expect((await upload()).status).toBe(403); expect(mockSave).not.toHaveBeenCalled();
});
it("refuses empty extracted text", async () => { mockExtract.mockResolvedValue({ extractedText: "", extractedStructured: {} }); expect((await upload()).status).toBe(422); expect(mockSave).not.toHaveBeenCalled(); });
it.each([null, [{ id: documentId }, { id: "second" }]])("fails closed on incomplete inventory %j", async value => { rows = value; expect((await upload()).status).toBe(503); expect(mockSave).not.toHaveBeenCalled(); });
it("fails closed on an inventory error", async () => { inventoryError = { message: "unavailable" }; expect((await upload()).status).toBe(503); expect(mockSave).not.toHaveBeenCalled(); });
it("keeps an existing or signed document untouched", async () => { rows = [{ id: documentId, current_version: 4, signed_off_version: 4, deliverable_versions: [] }]; expect((await upload()).status).toBe(409); expect(mockSave).not.toHaveBeenCalled(); expect(mockWrite).not.toHaveBeenCalled(); });
it("replays a recorded receipt with byte proof and no storage/version write", async () => {
  rows = [{ id: documentId, current_version: 1, deliverable_versions: [{ id: versionId, version: 1, structured_data: { authoredUpload: receipt() } }] }];
  expect((await upload()).status).toBe(200); expect(mockDownload).toHaveBeenCalled(); expect(mockSave).not.toHaveBeenCalled(); expect(mockWrite).not.toHaveBeenCalled();
});
it("does not reuse another uploader's request", async () => {
  rows = [{ id: documentId, current_version: 1, deliverable_versions: [{ id: versionId, version: 1, structured_data: { authoredUpload: { ...receipt(), uploadedBy: "other" } } }] }];
  expect((await upload()).status).toBe(409); expect(mockSave).not.toHaveBeenCalled();
});
it("resumes retained-but-unadmitted original storage using the same request", async () => {
  retained = { artifact_id: fileId, version: 1, blob_sha256: sha, metadata: { authoredUploadedBy: "operator-1", storage: "azure_blob" } };
  expect((await upload()).status).toBe(201); expect(mockSave).not.toHaveBeenCalled(); expect(mockWrite).toHaveBeenCalledTimes(1);
});
it("requires confirmed stored original bytes", async () => {
  mockSave.mockResolvedValue({ artifactId: fileId, version: 1, blobStored: false });
  const res = await upload(); expect(res.status).toBe(503); expect(mockWrite).not.toHaveBeenCalled();
  expect(await res.json()).toMatchObject({ storedArtifactId: fileId, admissionConfirmed: false });
});
it("reports retained bytes honestly when download hash or admission fails", async () => {
  mockDownload.mockResolvedValue({ ok: true, file: { bytes: Buffer.from("different"), fileName: "charter.docx", fileFormat: "docx" } });
  const first = await upload(); expect(first.status).toBe(503); expect(await first.json()).toMatchObject({ storedArtifactId: fileId, admissionConfirmed: false }); expect(mockWrite).not.toHaveBeenCalled();
  mockDownload.mockResolvedValue({ ok: true, file: { bytes, fileName: "charter.docx", fileFormat: "docx" } }); mockWrite.mockResolvedValue({ ok: false });
  const second = await upload(); expect(second.status).toBe(503); expect(await second.json()).toMatchObject({ storedArtifactId: fileId, admissionConfirmed: false });
});
it("reports a concurrent row without claiming admission", async () => { mockWrite.mockResolvedValue({ ok: true, data: { kind: "conflict" } }); const res = await upload(); expect(res.status).toBe(409); expect(await res.json()).toMatchObject({ storedArtifactId: fileId, admissionConfirmed: false }); });
it("permits a draft with an explicitly unknown evidence basis, withholding approval", async () => {
  mockSnapshot.mockResolvedValue(null); expect((await upload()).status).toBe(201);
  expect(mockWrite.mock.calls[0][0].receipt.phaseEvidenceSnapshotHash).toBeNull();
  await expect(verifyAuthoredApproval({ clientId: "client-1", clientKey: "meridian", userId: "operator-1" }, { moveId: move, key: "charter", content: "Authored text", receipt: { ...receipt(), phaseEvidenceSnapshotHash: null } })).rejects.toMatchObject({ code: "authored_evidence_basis_not_current" });
});
it.each(["file", "text", "basis", "scope"])("authored approval refuses %s drift", async drift => {
  if (drift === "file") artifact.version = 2;
  if (drift === "basis") mockCurrent.mockReturnValue(false);
  const promise = verifyAuthoredApproval({ clientId: "client-1", clientKey: "meridian", userId: "operator-1" }, { moveId: move, key: drift === "scope" ? "discovery_plan" : "charter", content: drift === "text" ? "changed" : "Authored text", receipt: receipt() });
  await expect(promise).rejects.toMatchObject({ status: 409 });
});
