/** @jest-environment node */
import { createHash } from "node:crypto";
import JSZip from "jszip";
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
let mockP2Enabled = false;
const mockArtifactById = new Map<string, Record<string, unknown>>();
const mockOriginalBytes = new Map<string, { bytes: Buffer; fileName: string; fileFormat: string }>();
const mockPackageSensitivity = jest.fn();
const policy = { canUploadArtifacts: true, canGenerateDeliverables: true, programIdsAllowed: null as string[] | null };
const mockSave = jest.fn(); const mockExtract = jest.fn(); const mockParse = jest.fn();
const mockProtection = jest.fn(); const mockWrite = jest.fn(); const mockDownload = jest.fn();
const mockProgram = jest.fn(); const mockPolicy = jest.fn(); const mockSnapshot = jest.fn();
const mockCanStore = jest.fn(); const mockCurrent = jest.fn();
jest.mock("@/app/api/v1/programs/_auth", () => ({ requireTenancy: async () => ({ clientId: "client-1", clientKey: "meridian", userId: "operator-1" }), tenancyErrorResponse: (e: unknown) => { throw e; } }));
jest.mock("@/lib/features/is-feature-enabled", () => ({ isFeatureEnabled: (_ctx: unknown, key: string) => key === "moves_authored_p2_draft_upload_v1" ? mockP2Enabled : flag }));
jest.mock("@/lib/auth/program-access-policy", () => ({ loadUserProgramAccessPolicy: (...a: unknown[]) => mockPolicy(...a) }));
jest.mock("@/lib/agent/restricted-output-policy", () => ({ sanitizeRestrictedFinancialText: (...a: unknown[]) => mockCanStore(...a) }));
jest.mock("@/lib/programs/queries", () => ({ getProgramById: (...a: unknown[]) => mockProgram(...a) }));
jest.mock("@/lib/ingestion/document-upload-parser", () => ({ parseIngestionDocument: (...a: unknown[]) => mockParse(...a) }));
jest.mock("@/lib/programs/current-state-doc-ingest", () => ({ assessMoveUploadSensitivity: (...a: unknown[]) => mockProtection(...a), assessExtractedTextSensitivity: (...a: unknown[]) => mockPackageSensitivity(...a) }));
jest.mock("@/lib/programs/evidence-ingestion", () => ({ extractProgramEvidenceFromUploadBuffer: (...a: unknown[]) => mockExtract(...a) }));
jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({ loadApprovedMoveEvidenceSnapshot: (...a: unknown[]) => mockSnapshot(...a), approvedMoveEvidenceRevisionForPhase: () => "b".repeat(64), isApprovedMoveEvidenceBasisCurrent: (...a: unknown[]) => mockCurrent(...a) }));
jest.mock("@/lib/data-plane/write-adapters/programsWriteAdapter", () => ({ createAzureProgramsWriteAdapter: () => ({ runInitialAuthoredDeliverable: (...a: unknown[]) => mockWrite(...a) }) }));
jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({ saveMoveArtifact: (...a: unknown[]) => mockSave(...a), getMoveArtifactForTenant: async (_ctx: unknown, id: string) => mockArtifactById.get(id) ?? artifact, downloadArtifactOutcome: (...a: unknown[]) => mockDownload(...a) }));
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
  jest.clearAllMocks(); rows = []; inventoryError = null; retained = null; flag = true; mockP2Enabled = false; mockArtifactById.clear(); mockOriginalBytes.clear(); mockPackageSensitivity.mockReturnValue({ decision: "allow" });
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


describe("bounded initial P2 original Office packages", () => {
  const companionId = "20000000-0000-4000-8000-000000000002";
  const currentScope = async () => jest.requireMock("@/app/api/v1/programs/_auth").requireTenancy();
  const pptxMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  async function office(format: "pptx" | "docx", text = "Synthetic authored body", part?: [string, string]) {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>');
    zip.file(format === "pptx" ? "ppt/slides/slide1.xml" : "word/document.xml", `<text>${text}</text>`);
    if (part) zip.file(part[0], part[1]);
    return zip.generateAsync({ type: "nodebuffer" });
  }
  beforeEach(() => {
    mockP2Enabled = true;
    mockProgram.mockResolvedValue({ id: move, currentPhase: 2 });
    mockParse.mockResolvedValue({ text: "Authored text", parseMethod: "office-parser", metadata: { truncated: false }, warnings: [] });
    mockSave.mockImplementation(async (_ctx, file) => {
      const id = file.metadata.authoredFileRole === "diagnostic_word" ? companionId : fileId;
      mockArtifactById.set(id, { artifact_id: id, move_id: move, phase: 2, file_format: file.fileFormat, version: 1,
        metadata: { ...file.metadata, storage: "azure_blob", sha256: createHash("sha256").update(file.body).digest("hex") } });
      mockOriginalBytes.set(id, { bytes: file.body, fileName: file.fileName, fileFormat: file.fileFormat });
      return { artifactId: id, version: 1, blobStored: true };
    });
    mockDownload.mockImplementation(async (_ctx, id) => ({ ok: true, file: mockOriginalBytes.get(id) }));
  });
  async function p2(key: string, options: { companion?: boolean; format?: "pptx" | "docx"; fields?: Record<string, string>; primary?: Buffer; word?: Buffer } = {}) {
    const format = options.format ?? (key === "design_workshop_guide" ? "docx" : "pptx");
    const primary = options.primary ?? await office(format);
    const f = new FormData();
    f.set("file", new File([new Uint8Array(primary)], `synthetic.${format}`, { type: format === "docx" ? mime : pptxMime }));
    for (const [k,v] of Object.entries({ phase: "2", deliverableTypeKey: key, expectedState: "absent", requestId,
      expectedFileSha256: createHash("sha256").update(primary).digest("hex"), ...options.fields })) f.set(k,v);
    if (options.companion ?? key === "discovery_report") {
      const word = options.word ?? await office("docx", "Synthetic diagnostic original");
      f.set("companionFile", new File([new Uint8Array(word)], "diagnostic.docx", { type: mime }));
      f.set("companionFileSha256", createHash("sha256").update(word).digest("hex"));
    }
    return POST(new Request("http://localhost/upload", { method: "POST", body: f }), { params: Promise.resolve({ programId: move }) });
  }
  it.each(["discovery_report", "root_cause_worksheet", "design_workshop_guide"])("admits declared %s with every original independently receipted", async key => {
    const res = await p2(key); const body = await res.json(); expect(res.status).toBe(201);
    expect(body).toMatchObject({ origin: "abarva_uploaded", artifactId: fileId, sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
    const written = mockWrite.mock.calls[0][0]; expect(written.receipt).toMatchObject({ phase: 2, deliverableTypeKey: key, fileRole: "primary", fileFormat: key === "design_workshop_guide" ? "docx" : "pptx" });
    expect(mockSave).toHaveBeenCalledTimes(key === "discovery_report" ? 2 : 1);
    if (key === "discovery_report") {
      expect(body.companionOriginal).toMatchObject({ artifactId: companionId });
      expect(written.receipt.companion).toMatchObject({ artifactId: companionId, fileFormat: "docx", fileRole: "diagnostic_word", requestId });
      expect(written.content).toBe("## Authored presentation\nAuthored text\n\n## Current-state Word record\nAuthored text");
    }
    const { readAuthoredUploadReceipt } = await import("@/lib/programs/authored-deliverable-receipt");
    expect(readAuthoredUploadReceipt(written.receipt)).not.toBeNull();
  });
  it("does not let the P2 flag expose a P1 admission while P1 is disabled", async () => {
    flag = false; expect((await upload()).status).toBe(404); expect(mockSave).not.toHaveBeenCalled();
  });
  it.each(["uploader","role","text"])("rejects changed P2 original %s metadata before version admission", async field => {
    const store = mockSave.getMockImplementation()!;
    mockSave.mockImplementation(async (...args) => {
      const result = await store(...args); const artifact = mockArtifactById.get(result.artifactId)!;
      artifact.metadata = { ...(artifact.metadata as object), ...(field === "uploader" ? { authoredUploadedBy:"another-author" } : field === "role" ? { authoredFileRole:"other" } : { authoredTextSha256:"0".repeat(64) }) };
      return result;
    });
    expect((await p2("root_cause_worksheet")).status).toBe(503); expect(mockWrite).not.toHaveBeenCalled();
  });
  it("replays all exact original receipts without another file/version write and refuses a changed companion", async () => {
    const primary = await office("pptx"); const word = await office("docx","First diagnostic");
    expect((await p2("discovery_report",{primary,word})).status).toBe(201);
    const admitted = mockWrite.mock.calls[0][0]; const recorded = admitted.receipt;
    rows = [{ id:documentId, current_version:1, deliverable_versions:[{id:versionId,version:1,content:admitted.content,structured_data:{authoredUpload:recorded}}] }];
    mockSave.mockClear();mockWrite.mockClear();
    expect((await p2("discovery_report",{primary,word})).status).toBe(200);
    expect(mockSave).not.toHaveBeenCalled();expect(mockWrite).not.toHaveBeenCalled();
    expect((await p2("discovery_report",{primary,word:await office("docx","Changed diagnostic")})).status).toBe(409);
    expect(mockSave).not.toHaveBeenCalled();expect(mockWrite).not.toHaveBeenCalled();
  });
  it("retains the complete P2 authored text beyond the legacy evidence excerpt limit", async () => {
    const full = "Synthetic bounded full Office text. ".repeat(900);
    mockParse.mockResolvedValue({text:full,parseMethod:"pptx-parser",metadata:{truncated:false},warnings:[]});
    expect((await p2("root_cause_worksheet")).status).toBe(201);
    expect(mockWrite.mock.calls[0][0].content).toBe(full.trim());
    expect(mockWrite.mock.calls[0][0].receipt.textSha256).toBe(createHash("sha256").update(full.trim()).digest("hex"));
    expect(mockExtract).not.toHaveBeenCalled();
  });
  it.each([{text:"",parseMethod:"pptx-parser"},{text:"Body",parseMethod:undefined}])("requires full text and parser identity %j", async missing => {
    mockParse.mockResolvedValue({...missing,metadata:{truncated:false},warnings:[]});
    expect((await p2("root_cause_worksheet")).status).toBe(422); expect(mockSave).not.toHaveBeenCalled();
  });
  it("requires the phase-specific flag even while P1 remains enabled", async () => { mockP2Enabled = false; expect((await p2("root_cause_worksheet")).status).toBe(404); expect(mockSave).not.toHaveBeenCalled(); });
  it.each([1, 3, undefined])("requires actual current P2 rather than phase %s", async phase => { mockProgram.mockResolvedValue({ id: move, currentPhase: phase }); expect((await p2("root_cause_worksheet")).status).toBe(409); expect(mockSave).not.toHaveBeenCalled(); });
  it.each(["charter", "discovery_plan", "unknown"])("refuses undeclared P2 key %s", async key => { expect((await p2(key)).status).toBe(422); expect(mockSave).not.toHaveBeenCalled(); });
  it("requires the diagnostic Word companion without accepting it on another type", async () => {
    expect((await p2("discovery_report", { companion: false })).status).toBe(422);
    expect((await p2("root_cause_worksheet", { companion: true })).status).toBe(422); expect(mockSave).not.toHaveBeenCalled();
  });
  it("retains each type's exact original Office format", async () => { expect((await p2("root_cause_worksheet", { format: "docx" })).status).toBe(415); expect((await p2("design_workshop_guide", { format: "pptx" })).status).toBe(415); expect(mockSave).not.toHaveBeenCalled(); });
  it("refuses incomplete extraction and malformed packages before storage", async () => {
    mockParse.mockResolvedValue({ text: "Authored text", parseMethod: "office-parser", metadata: { truncated: true }, warnings: [] });
    const incomplete = await p2("root_cause_worksheet");
    expect(incomplete.status).toBe(422); expect(await incomplete.json()).toMatchObject({ error: "authored_extraction_incomplete" });
    expect(mockSave).not.toHaveBeenCalled();
    mockParse.mockRejectedValue(new Error("invalid Office package")); expect((await p2("root_cause_worksheet")).status).toBe(422); expect(mockSave).not.toHaveBeenCalled();
  });
  it.each(["ppt/notesSlides/notesSlide1.xml", "ppt/comments/comment1.xml"])("inspects decoded hidden financial text in %s", async part => {
    mockCanStore.mockImplementation(text => text.includes("$500") ? "restricted" : text);
    const body = await office("pptx", "Allowed visible text", [part, '<text>&#36;&#53;00</text>']);
    expect((await p2("root_cause_worksheet", { primary: body })).status).toBe(403); expect(mockSave).not.toHaveBeenCalled();
  });
  it("passes full decoded package text through the existing sensitivity policy", async () => {
    mockPackageSensitivity.mockImplementation(text => ({ decision: text.includes("restricted-note") ? "quarantine" : "allow" }));
    const body = await office("pptx", "Allowed visible text", ["ppt/comments/comment1.xml", '<comment authorName="restricted-note">Safe body</comment>']);
    expect((await p2("root_cause_worksheet", { primary: body })).status).toBe(422); expect(mockSave).not.toHaveBeenCalled();
  });
  it("reports partial package retention without admitting a version", async () => {
    mockSave.mockImplementationOnce(async (_ctx, file) => { mockOriginalBytes.set(fileId, { bytes: file.body, fileName: file.fileName, fileFormat: file.fileFormat }); return { artifactId: fileId, version: 1, blobStored: true }; }).mockRejectedValueOnce(new Error("companion storage unavailable"));
    const res = await p2("discovery_report"); expect(res.status).toBe(503); expect(await res.json()).toMatchObject({ admissionConfirmed: false, retainedOriginals: [{ artifactId: fileId, fileRole: "primary", blobStored: true }] }); expect(mockWrite).not.toHaveBeenCalled();
  });
  it("refuses a changed retained companion before atomic document admission", async () => {
    mockDownload.mockImplementation(async (_ctx, id) => ({ ok: true, file: id === companionId ? { ...mockOriginalBytes.get(id), bytes: Buffer.from("different") } : mockOriginalBytes.get(id) }));
    const res = await p2("discovery_report"); expect(res.status).toBe(503); expect(mockWrite).not.toHaveBeenCalled(); expect((await res.json()).retainedOriginals).toHaveLength(2);
  });
  it("approves only a complete receipt and current original/evidence package", async () => {
    await p2("discovery_report"); const input = mockWrite.mock.calls[0][0];
    expect(await verifyAuthoredApproval(await currentScope(), { moveId: move, key: "discovery_report", content: input.content, receipt: input.receipt, canStoreText: () => true })).toEqual(input.receipt);
    await expect(verifyAuthoredApproval(await currentScope(), { moveId: move, key: "discovery_report", content: input.content, receipt: { ...input.receipt, companion: undefined }, canStoreText: () => true })).rejects.toMatchObject({ code: "authored_file_receipt_invalid" });
    mockCurrent.mockReturnValue(false); await expect(verifyAuthoredApproval(await currentScope(), { moveId: move, key: "discovery_report", content: input.content, receipt: input.receipt, canStoreText: () => true })).rejects.toMatchObject({ code: "authored_evidence_basis_not_current" });
  });
});
