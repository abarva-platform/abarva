const mockAzureSelect = jest.fn();
jest.mock("@/lib/data-plane/azureRead", () => ({ azureRead: { select: (...args: unknown[]) => mockAzureSelect(...args) } }));
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { POLICY_VERSION } from "@/lib/governance/context-corpus-policy";
import { admitMoveSources, moveSourceRevision, reviewedEvidenceAdmissionSource, type MoveAdmissionSource } from "../move-agent-admission";
import { assembleGovernedEvidence } from "@/lib/deliverables/orchestrator/evidence-assembler";

const key = CANONICAL_TENANT_KEYS[0];
const scope = { clientKey: key, tenantId: "client-1", moveId: "move-1", phase: 2 };
const at = "2026-10-12T10:00:00.000Z";
const later = "2026-10-12T11:00:00.000Z";
const extraction = { version: 1, summary: "Reviewed source statement", structured: { decisions: [], risks: [], baselineCandidates: [], actionItems: [], observations: [], assumptions: [], openQuestions: [], citations: [{ quote: "Source statement", locator: "page 2" }] } };
function nativeRows() {
  return {
    evidence: { id: "evidence-1", tenant_key: key, program_id: "move-1", phase: 2, title: "Source", summary: "Raw summary", extracted_text: "Unreviewed text", extracted_structured: {}, evidence_type: "document", confidence: 0.8, created_at: at },
    review: { id: "review-1", tenant_key: key, program_id: "move-1", phase: 2, evidence_id: "evidence-1", decision: "approved", reviewed_at: at, updated_at: at, source_ref: { move_artifact_id: "source-1", reviewed_extraction: structuredClone(extraction) } },
    artifact: { artifact_id: "source-1", tenant_id: "client-1", tenant_key: key, move_id: "move-1", phase: 2, version: 1, blob_sha256: "a".repeat(64), blob_path: "private/source-v1.pdf", lifecycle_state: "current", metadata: { sha256: "a".repeat(64), storage: "azure_blob" }, updated_at: at },
  };
}
function uploadedSource(rows = nativeRows()) { return reviewedEvidenceAdmissionSource({ clientKey: key, tenantId: scope.tenantId, moveId: scope.moveId, ...rows })!; }
function readiness(source: MoveAdmissionSource, overrides: Record<string, unknown> = {}) {
  return { object_table: source.objectTable, object_id: source.objectId, client_key: key, tenant_id: scope.tenantId, source_layer: source.sourceLayer, source_basis: source.sourceFile, classification: "internal", agent_readiness_status: "agent_ready", retrievability: "fts_indexed", confidence_level: "high", cited_render_verified_at: later, policy_version: POLICY_VERSION, policy_validation_status: "pass", policy_validated_at: later, provenance: { source_file: source.sourceFile, indexed_at: later, move_source_binding: source.binding }, ...overrides };
}
function dbFor(tables: Record<string, unknown[]>) {
  return { from(table: string) { const q: Record<string, unknown> = {}; for (const method of ["select", "eq", "lte", "in", "is", "order", "limit"]) q[method] = () => q; q.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: tables[table] ?? [], error: null }).then(resolve); return q; } } as never;
}
const params = { tenantClientKey: key, clientId: scope.tenantId, sourceArtifactRef: scope.moveId, phase: 2, requireMoveAdmission: true };
const emptyQuery = (async () => []) as never;

describe("exact stored Move admission", () => {
  beforeEach(() => mockAzureSelect.mockReset());
  it("binds original bytes, source version and reviewed extraction; accepts PG timestamps", async () => {
    const rows = nativeRows(); rows.review.reviewed_at = new Date(at) as never;
    rows.review.updated_at = new Date(at) as never;
    const source = uploadedSource(rows);
    expect(source.binding).toMatchObject({ source_blob_sha256: "a".repeat(64), source_artifact_version: 1, review_id: "review-1", reviewed_extraction_sha256: moveSourceRevision(extraction) });
    const stored = readiness(source, { cited_render_verified_at: new Date(later), policy_validated_at: new Date(later) });
    mockAzureSelect.mockResolvedValue([stored]);
    const original = { source, statement: "Exact reviewed statement", citations: source.citations };
    const out = await admitMoveSources([original], item => item.source, scope);
    expect(out.items[0]).toBe(original);
    expect(out.diagnostics[0].state).toBe("admitted");
  });
  it.each([
    ["evidence", "program_id", "other-move"], ["review", "program_id", "other-move"], ["artifact", "move_id", "other-move"],
    ["evidence", "tenant_key", "unknown"], ["review", "tenant_key", "unknown"], ["artifact", "tenant_id", "other-client"],
    ["evidence", "phase", 3], ["review", "decision", "pending"], ["review", "id", null], ["review", "updated_at", null],
    ["artifact", "version", 0], ["artifact", "blob_sha256", "b".repeat(64)], ["artifact", "lifecycle_state", "superseded"],
  ])("rejects missing or mismatched native binding %s.%s", (table, field, value) => {
    const rows = nativeRows(); (rows[table as keyof typeof rows] as Record<string, unknown>)[field] = value;
    expect(uploadedSource(rows)).toBeNull();
  });
  it.each(["absent", "unreadable", "unbound", "stale", "blocked"])("reports %s distinctly and excludes content", async (state) => {
    const source = uploadedSource();
    if (state === "absent") mockAzureSelect.mockResolvedValue([]);
    if (state === "unreadable") mockAzureSelect.mockRejectedValue(new Error("unavailable"));
    if (state === "unbound") mockAzureSelect.mockResolvedValue([readiness(source, { provenance: { source_file: source.sourceFile, indexed_at: later } })]);
    if (state === "stale") mockAzureSelect.mockResolvedValue([readiness(source, { provenance: { source_file: source.sourceFile, indexed_at: later, move_source_binding: { ...source.binding, source_blob_sha256: "b".repeat(64) } } })]);
    if (state === "blocked") mockAzureSelect.mockResolvedValue([readiness(source, { classification: "restricted" })]);
    const out = await admitMoveSources([source], item => item, scope);
    expect(out.items).toEqual([]); expect(out.diagnostics[0].state).toBe(state);
  });
  it("invalidates readiness after the extraction changes under the same source ID", async () => {
    const previous = uploadedSource(); const rows = nativeRows(); rows.review.source_ref.reviewed_extraction.summary = "Changed review";
    const current = uploadedSource(rows); mockAzureSelect.mockResolvedValue([readiness(previous)]);
    expect((await admitMoveSources([current], item => item, scope)).diagnostics[0].state).toBe("stale");
  });
  it("rejects a current revision when its indexing predates the current review", async () => {
    const source = uploadedSource(); mockAzureSelect.mockResolvedValue([readiness(source, { provenance: { source_file: source.sourceFile, indexed_at: "2026-10-11T00:00:00Z", move_source_binding: source.binding } })]);
    expect((await admitMoveSources([source], item => item, scope)).diagnostics[0].state).toBe("stale");
  });
  it("does not admit a source for another Move or a future phase", async () => {
    const source = uploadedSource(); mockAzureSelect.mockResolvedValue([readiness(source)]);
    expect((await admitMoveSources([source], item => item, { ...scope, moveId: "other-move" })).items).toEqual([]);
    expect((await admitMoveSources([source], item => item, { ...scope, phase: 1 })).items).toEqual([]);
    expect(mockAzureSelect).not.toHaveBeenCalled();
  });
});

describe("native Move assembly admission before citation packing", () => {
  beforeEach(() => mockAzureSelect.mockReset().mockResolvedValue([]));
  const capture = { id: "capture-1", engagement_id: scope.moveId, module_key: "phase_2_findings", phase_number: 2, module_name: "Saved findings", status: "completed", state_jsonb: { value: "Saved observation" }, completed_at: at };
  const ledger = { id: "ledger-1", client_id: scope.tenantId, surface: "moves", claim_text: "Recorded claim", source_ref: { moveId: scope.moveId, phase: 2, family: "baseline" }, freshness_at: at };
  it("excludes saved capture, ledger and approved upload without readiness", async () => {
    const rows = nativeRows();
    const out = await assembleGovernedEvidence(params, { queryTenantContext: emptyQuery, db: dbFor({ engagements: [{ id: scope.moveId, client_id: scope.tenantId }], program_modules: [capture], evidence_ledger: [ledger], program_evidence_reviews: [rows.review], program_evidence_items: [rows.evidence], move_artifacts: [rows.artifact] }) });
    expect(out.evidence).toEqual([]); expect(out.sourceRegister).toEqual([]);
    expect(new Set(out.admission?.map(item => item.objectTable))).toEqual(new Set(["program_modules", "evidence_ledger", "program_evidence_items"]));
    expect(out.admission?.every(item => item.state === "absent")).toBe(true);
  });
  it("preserves an admitted reviewed source and its citation register", async () => {
    const rows = nativeRows(); mockAzureSelect.mockResolvedValue([readiness(uploadedSource(rows))]);
    const out = await assembleGovernedEvidence(params, { queryTenantContext: emptyQuery, db: dbFor({ engagements: [{ id: scope.moveId, client_id: scope.tenantId }], program_evidence_reviews: [rows.review], program_evidence_items: [rows.evidence], move_artifacts: [rows.artifact] }) });
    expect(out.evidence).toHaveLength(1); expect(out.evidence[0].statement).toContain("Reviewed source statement"); expect(out.evidence[0].statement).not.toContain("Unreviewed text");
    expect(out.evidence[0].statement).toContain('Source reference: "Source statement" (page 2)');
    expect(out.sourceRegister).toHaveLength(1); expect(out.sourceRegister[0].citationNumber).toBe(out.evidence[0].citationNumber);
  });
  it("binds saved captures to their actual stored content and excludes changed content", async () => {
    const source: MoveAdmissionSource = { objectTable: "program_modules", objectId: capture.id, clientKey: key, tenantId: scope.tenantId, sourceLayer: "move", sourceFile: `program_modules:${capture.id}`, changedAt: at, binding: { version: 1, move_id: scope.moveId, phase: 2, source_revision_sha256: moveSourceRevision(capture) }, citations: [capture.id] };
    mockAzureSelect.mockResolvedValue([readiness(source)]);
    const tables = { engagements: [{ id: scope.moveId, client_id: scope.tenantId }], program_modules: [capture] };
    expect((await assembleGovernedEvidence(params, { queryTenantContext: emptyQuery, db: dbFor(tables) })).evidence[0].statement).toContain("Saved observation");
    expect((await assembleGovernedEvidence(params, { queryTenantContext: emptyQuery, db: dbFor({ ...tables, program_modules: [{ ...capture, state_jsonb: { value: "Changed observation" } }] }) })).evidence).toEqual([]);
  });
  it.each([false, true])("requires canonical admission for the exact signed prior artifact (ready=%s)", async ready => {
    const artifact = { id: "generated-1", client_id: scope.tenantId, quality_score: 0.9, rendered_at: at, source_artifact_ref: scope.moveId, superseded_by: null, quarantine_reason: null, metadata: { title: "Approved prior conclusion", deliverableTypeKey: "charter" } };
    const approval = { id: "deliverable-1", status: "approved", signed_off_version: 1 };
    const version = { deliverable_id: approval.id, version: 1, structured_data: { generated_artifact_id: artifact.id } };
    const source: MoveAdmissionSource = { objectTable: "generated_artifacts", objectId: artifact.id, clientKey: key, tenantId: scope.tenantId, sourceLayer: "artifact", sourceFile: `generated_artifacts:${artifact.id}`, changedAt: at, binding: { version: 1, move_id: scope.moveId, phase: 1, source_revision_sha256: moveSourceRevision({ artifact, approvedVersions: [version], approvals: [approval] }) }, citations: [artifact.id] };
    mockAzureSelect.mockResolvedValue(ready ? [readiness(source)] : []);
    const out = await assembleGovernedEvidence(params, { queryTenantContext: emptyQuery, db: dbFor({ engagements: [{ id: scope.moveId, client_id: scope.tenantId }], deliverables_v2: [approval], deliverable_versions: [version], generated_artifacts: [artifact] }) });
    expect(out.evidence).toHaveLength(ready ? 1 : 0);
    expect(out.admission?.[0]).toMatchObject({ objectTable: "generated_artifacts", objectId: artifact.id, state: ready ? "admitted" : "absent" });
  });
  it("excludes retrieved tenant chunks without a declared native source admission", async () => {
    const query = (async () => [{ tenantKey: key, chunkId: "chunk-1", text: "Not admitted", embeddingStatus: "embedded" }]) as never;
    const out = await assembleGovernedEvidence(params, { queryTenantContext: query, db: dbFor({ engagements: [{ id: scope.moveId, client_id: scope.tenantId }] }) });
    expect(out.evidence).toEqual([]); expect(out.admission?.[0].state).toBe("unbound");
  });
  it("keeps the existing non-Moves retrieval path unchanged", async () => {
    const query = (async () => [{ tenantKey: key, chunkId: "chunk-1", text: "Existing tenant context", embeddingStatus: "embedded" }]) as never;
    const out = await assembleGovernedEvidence({ tenantClientKey: key }, { queryTenantContext: query });
    expect(out.evidence[0].statement).toBe("Existing tenant context"); expect(out.admission).toBeUndefined(); expect(mockAzureSelect).not.toHaveBeenCalled();
  });
});
