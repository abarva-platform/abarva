const mockEvidenceRead = jest.fn();
const mockAzureSelect = jest.fn();

jest.mock("../evidence-context", () => ({
  listProgramEvidenceForPrompt: (...args: unknown[]) => mockEvidenceRead(...args),
}));
jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: { select: (...args: unknown[]) => mockAzureSelect(...args) },
}));

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { appClientKeyForTenant } from "@/lib/tenant/aliases";
import { POLICY_VERSION } from "@/lib/governance/context-corpus-policy";
import type { MoveAdmissionSource } from "../move-agent-admission";
import { loadProgramEvidenceForAgent } from "../evidence-agent-context";
import type { ProgramEvidencePromptItem } from "../evidence-context";

const CTX = {
  clientId: "client-1",
  clientKey: appClientKeyForTenant(CANONICAL_TENANT_KEYS[0])!,
  userId: "user-1",
};
const approvedAt = "2026-10-12T10:00:00.000Z";
const verifiedAt = "2026-10-12T11:00:00.000Z";
function source(over: Partial<MoveAdmissionSource> = {}): MoveAdmissionSource {
  return { objectTable: "program_evidence_items", objectId: "evidence-1", clientKey: CANONICAL_TENANT_KEYS[0], tenantId: CTX.clientId, sourceLayer: "uploaded_evidence", sourceFile: "synthetic-source.pdf", changedAt: approvedAt, binding: { version: 1, move_id: "move-1", phase: 2, source_revision_sha256: "a".repeat(64) }, citations: ["page 2"], ...over };
}

function evidence(over: Partial<ProgramEvidencePromptItem> = {}): ProgramEvidencePromptItem {
  return {
    id: "evidence-1", title: "Synthetic source", evidenceType: "document", phase: 2,
    summary: "Reviewed source statement", parseMethod: "reviewed", extractedText: null,
    structuredSignals: ["A source-backed hypothesis"], createdAt: approvedAt, approvedAt,
    observations: [], assumptions: [], openQuestions: [],
    citations: [{ quote: "The source statement", locator: "page 2" }], admissionSource: source({ objectId: over.id ?? "evidence-1" }), ...over,
  };
}

function admission(over: Record<string, unknown> = {}) {
  return {
    object_table: "program_evidence_items", object_id: "evidence-1",
    client_key: CANONICAL_TENANT_KEYS[0], tenant_id: CTX.clientId,
    source_layer: "uploaded_evidence", classification: "internal",
    agent_readiness_status: "agent_ready", retrievability: "fts_indexed",
    source_basis: "synthetic-source.pdf", confidence_level: "high",
    cited_render_verified_at: verifiedAt, policy_version: POLICY_VERSION,
    policy_validation_status: "pass", policy_validated_at: verifiedAt,
    provenance: { source_file: "synthetic-source.pdf", indexed_at: verifiedAt, move_source_binding: source().binding },
    ...over,
  };
}

describe("model-bound program evidence admission", () => {
  beforeEach(() => {
    mockEvidenceRead.mockReset().mockResolvedValue([evidence()]);
    mockAzureSelect.mockReset().mockResolvedValue([admission()]);
  });

  it("preserves the exact reviewed source and citations after canonical admission", async () => {
    const source = evidence();
    mockEvidenceRead.mockResolvedValue([source]);
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", 2)).items).toEqual([source]);
    expect(mockEvidenceRead).toHaveBeenCalledWith(CTX, "move-1", 2, { modelAdmission: true });
    expect(mockAzureSelect).toHaveBeenCalledWith(expect.objectContaining({
      table: "governed_object_readiness",
      where: { object_table: "program_evidence_items", object_id: { op: "in", value: [source.id] },
        client_key: CANONICAL_TENANT_KEYS[0], tenant_id: CTX.clientId },
    }));
  });

  it("excludes approved files without a readiness record", async () => {
    mockAzureSelect.mockResolvedValue([]);
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", 2)).items).toEqual([]);
  });

  it("fails closed when the readiness read is unavailable", async () => {
    mockAzureSelect.mockRejectedValue(new Error("read unavailable"));
    expect(await loadProgramEvidenceForAgent(CTX, "move-1", 2)).toMatchObject({ items: [], unavailable: true, diagnostics: [expect.objectContaining({ state: "unreadable" })] });
  });

  it.each([
    { agent_readiness_status: "not_reviewed" },
    { agent_readiness_status: "blocked" },
    { agent_readiness_status: "retired" },
    { classification: "phi" },
    { classification: "restricted" },
    { retrievability: "committed_not_indexed" },
    { confidence_level: null },
    { source_basis: null },
    { cited_render_verified_at: null },
    { provenance: null },
    { source_layer: "tenant_context" },
    { policy_validation_status: "block" },
    { policy_version: "old-policy" },
    { tenant_id: "another-client" },
    { client_key: CANONICAL_TENANT_KEYS[1] },
    { object_table: "another-store" },
    { object_id: "another-source" },
  ])("excludes a policy or identity failure %j", async (over) => {
    mockAzureSelect.mockResolvedValue([admission(over)]);
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", 2)).items).toEqual([]);
  });

  it.each([
    { policy_validated_at: "2026-10-11T00:00:00.000Z" },
    { cited_render_verified_at: "2026-10-11T00:00:00.000Z" },
    { provenance: { source_file: "synthetic-source.pdf", indexed_at: "2026-10-11T00:00:00.000Z" } },
    { provenance: {} },
  ])("excludes verification preceding the current review %j", async (over) => {
    mockAzureSelect.mockResolvedValue([admission(over)]);
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", 2)).items).toEqual([]);
  });

  it.each([null, -1, 6, 1.5])("does not read evidence for an unresolved or invalid phase %s", async (phase) => {
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", phase)).items).toEqual([]);
    expect(mockEvidenceRead).not.toHaveBeenCalled();
  });

  it("rejects a wrong-phase row even when a reader returns it", async () => {
    mockEvidenceRead.mockResolvedValue([evidence({ phase: 3 })]);
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", 2)).items).toEqual([]);
  });

  it("rejects source text without a current approved extraction", async () => {
    mockEvidenceRead.mockResolvedValue([evidence({ approvedAt: null, extractedText: "Unreviewed content" })]);
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", 2)).items).toEqual([]);
  });

  it("does not expose original unreviewed text alongside an approval timestamp", async () => {
    mockEvidenceRead.mockResolvedValue([evidence({ extractedText: "Original unreviewed text" })]);
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", 2)).items).toEqual([]);
  });

  it("rejects ambiguous duplicate admission rows", async () => {
    mockAzureSelect.mockResolvedValue([admission(), admission({ classification: "restricted" })]);
    expect((await loadProgramEvidenceForAgent(CTX, "move-1", 2)).items).toEqual([]);
  });

  it("distinguishes no approved evidence from failed admission", async () => {
    mockEvidenceRead.mockResolvedValue([]);
    expect(await loadProgramEvidenceForAgent(CTX, "move-1", 2)).toEqual({ items: [], unavailable: false });
    expect(mockAzureSelect).not.toHaveBeenCalled();
  });

  it("preserves admitted sources while excluding another unready source", async () => {
    mockEvidenceRead.mockResolvedValue([evidence(), evidence({ id: "unready-source" })]);
    expect(await loadProgramEvidenceForAgent(CTX, "move-1", 2)).toMatchObject({ items: [evidence()], unavailable: false });
  });

  it.each(CANONICAL_TENANT_KEYS)("uses canonical admission for the declared tenant %s", async (key) => {
    const ctx = { ...CTX, clientKey: appClientKeyForTenant(key)! };
    mockAzureSelect.mockResolvedValue([admission({ client_key: key })]);
    const item = evidence({ admissionSource: source({ clientKey: key }) });
    mockEvidenceRead.mockResolvedValue([item]);
    expect((await loadProgramEvidenceForAgent(ctx, "move-1", 2)).items).toEqual([item]);
  });
});
