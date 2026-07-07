// Repository proof: insert/list/get map to the source_artifacts contract, list is
// tenant-scoped + current-only by default, supersede targets prior current rows.
import {
  insertSourceArtifact,
  listSourceArtifacts,
  getSourceArtifact,
  supersedePriorVersions,
} from "../repository";

interface Cap {
  table?: string;
  op?: string;
  payload?: Record<string, unknown>;
  filters: Array<[string, string, unknown]>;
  ordered?: string;
}

function fakeDb(
  rows: Record<string, unknown> | Record<string, unknown>[] | null,
) {
  const cap: Cap = { filters: [] };
  const b: Record<string, unknown> = {};
  b.from = (t: string) => {
    cap.table = t;
    return b;
  };
  b.insert = (p: Record<string, unknown>) => {
    cap.op = "insert";
    cap.payload = p;
    return b;
  };
  b.update = (p: Record<string, unknown>) => {
    cap.op = "update";
    cap.payload = p;
    return b;
  };
  b.select = () => b;
  b.eq = (k: string, v: unknown) => {
    cap.filters.push([k, "=", v]);
    return b;
  };
  b.neq = (k: string, v: unknown) => {
    cap.filters.push([k, "!=", v]);
    return b;
  };
  b.order = (c: string) => {
    cap.ordered = c;
    return Promise.resolve({ data: rows, error: null });
  };
  b.single = async () => ({
    data: Array.isArray(rows) ? rows[0] : rows,
    error: null,
  });
  b.maybeSingle = async () => ({
    data: Array.isArray(rows) ? rows[0] : rows,
    error: null,
  });
  b.then = (f: (r: { data: unknown; error: null }) => unknown) =>
    Promise.resolve({ data: rows, error: null }).then(f);
  return { db: b as never, cap };
}

const row = {
  id: "a1",
  client_id: "c1",
  tenant_key: "skyharbor-air",
  source_event_id: "evt-1",
  artifact_group: "generated",
  artifact_type: "rfp_package",
  title: "AMS RFP",
  file_name: "rfp.docx",
  file_format: "docx",
  blob_container: "source-events",
  blob_path: "p",
  version: 1,
  status: "preliminary",
  citation_ready: true,
  evidence_families_used: ["sla_baseline"],
  missing_inputs: [],
  client_complete_items: [],
  assumptions: [],
  lifecycle_state: "current",
  generated_at: "t",
  created_at: "t",
  updated_at: "t",
};

describe("insertSourceArtifact", () => {
  it("writes to source_artifacts as current and maps the row", async () => {
    const { db, cap } = fakeDb(row);
    const rec = await insertSourceArtifact(
      {
        clientId: "c1",
        tenantKey: "skyharbor-air",
        sourceEventId: "evt-1",
        sourcingStage: null,
        artifactGroup: "generated",
        artifactType: "rfp_package",
        artifactFamily: null,
        title: "AMS RFP",
        description: null,
        fileName: "rfp.docx",
        fileFormat: "docx",
        blobContainer: "source-events",
        blobPath: "p",
        fileSize: 5,
        version: 1,
        status: "preliminary",
        generatedBy: "u1",
        sourceBasis: null,
        confidence: null,
        citationReady: true,
        evidenceFamiliesUsed: ["sla_baseline"],
        sourceRegisterId: null,
        contextBundleTraceId: null,
        missingInputs: [],
        clientCompleteItems: [],
        assumptions: [],
        supersedesArtifactId: null,
        blobSha256: "sha",
      },
      db,
    );
    expect(cap.table).toBe("source_artifacts");
    expect(cap.payload?.lifecycle_state).toBe("current");
    expect(rec.citationReady).toBe(true);
    expect(rec.evidenceFamiliesUsed).toEqual(["sla_baseline"]);
  });

  it("serializes client-final JSONB metadata for the Postgres adapter", async () => {
    const { db, cap } = fakeDb({
      ...row,
      id: "final-1",
      artifact_group: "approval",
      status: "client_final",
      is_client_final: true,
      is_current_authoritative: true,
      client_final_change_summary:
        '{"summary":"Client final accepted","changeAnalysisCompleted":false}',
    });
    const rec = await insertSourceArtifact(
      {
        clientId: "c1",
        tenantKey: "skyharbor-air",
        sourceEventId: "evt-1",
        sourcingStage: "responses",
        artifactGroup: "approval",
        artifactType: "rfp_package",
        artifactFamily: "sourcing",
        title: "AMS RFP — Client Final",
        description: null,
        fileName: "rfp-final.docx",
        fileFormat: "docx",
        blobContainer: "source-events",
        blobPath: "p-final",
        fileSize: 5,
        version: 2,
        status: "client_final",
        generatedBy: null,
        sourceBasis: "client-final:state-1",
        confidence: "client-approved",
        citationReady: true,
        evidenceFamiliesUsed: ["sourcing"],
        sourceRegisterId: null,
        contextBundleTraceId: null,
        missingInputs: [],
        clientCompleteItems: [],
        assumptions: [],
        supersedesArtifactId: "draft-1",
        blobSha256: "sha-final",
        isClientFinal: true,
        isCurrentAuthoritative: true,
        sourceGeneratedArtifactId: "draft-1",
        clientFinalChangeSummary: {
          summary: "Client final accepted",
          changeAnalysisCompleted: false,
        },
      },
      db,
    );

    expect(cap.payload?.client_final_change_summary).toBe(
      '{"summary":"Client final accepted","changeAnalysisCompleted":false}',
    );
    expect(rec.clientFinalChangeSummary).toMatchObject({
      summary: "Client final accepted",
      changeAnalysisCompleted: false,
    });
  });
});

describe("listSourceArtifacts", () => {
  it("scopes to event + client and current-only by default", async () => {
    const { db, cap } = fakeDb([row]);
    const out = await listSourceArtifacts("evt-1", "c1", {}, db);
    expect(out).toHaveLength(1);
    expect(cap.filters).toContainEqual(["source_event_id", "=", "evt-1"]);
    expect(cap.filters).toContainEqual(["client_id", "=", "c1"]);
    expect(cap.filters).toContainEqual(["lifecycle_state", "=", "current"]);
    expect(cap.ordered).toBe("created_at");
  });
  it("includes history when requested (no lifecycle filter)", async () => {
    const { db, cap } = fakeDb([row]);
    await listSourceArtifacts("evt-1", "c1", { includeHistory: true }, db);
    expect(cap.filters.some((f) => f[0] === "lifecycle_state")).toBe(false);
  });
});

describe("supersedePriorVersions", () => {
  it("flips prior current rows (excluding the new id) to superseded", async () => {
    const { db, cap } = fakeDb(null);
    await supersedePriorVersions("evt-1", "rfp_package", "generated", "a2", db);
    expect(cap.op).toBe("update");
    expect(cap.payload?.lifecycle_state).toBe("superseded");
    expect(cap.payload?.superseded_by_artifact_id).toBe("a2");
    expect(cap.filters).toContainEqual(["lifecycle_state", "=", "current"]);
    expect(cap.filters).toContainEqual(["id", "!=", "a2"]);
  });
});

describe("getSourceArtifact", () => {
  it("reads by id scoped to client", async () => {
    const { db, cap } = fakeDb(row);
    const rec = await getSourceArtifact("a1", "c1", db);
    expect(rec?.id).toBe("a1");
    expect(cap.filters).toContainEqual(["id", "=", "a1"]);
    expect(cap.filters).toContainEqual(["client_id", "=", "c1"]);
  });
});
