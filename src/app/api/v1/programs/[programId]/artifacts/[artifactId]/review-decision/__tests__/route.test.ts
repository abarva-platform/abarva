const tenancy = {
  clientId: "client-test-tenant",
  clientKey: "test-tenant",
  userId: "reviewer-1",
  email: "reviewer@example.test",
};
let callerRole = "workspace_member";

const htmlArtifact = {
  artifact_id: "html-artifact",
  move_id: "move-1",
  phase: 2,
  artifact_type: "discovery_report",
  artifact_family: "generated_deliverable",
  title: "Current Work Diagnostic",
  file_name: "diagnostic.html",
  file_format: "html",
  blob_container: "context-drops",
  blob_path: "moves/test-tenant/move-1/generated/p2/diagnostic.html",
  file_size: 42000,
  version: 10,
  status: "review_required",
  generated_by: "agent",
  generated_at: "2026-06-28T00:00:00Z",
  quality_score: 82,
  unsupported_claims_count: 0,
  lifecycle_state: "current",
  created_at: "2026-06-28T00:00:00Z",
  metadata: {
    outputRole: "html_visual_review_companion",
    openItems: ["Sponsor/signoff gates remain unresolved."],
  },
};

const docxArtifact = {
  ...htmlArtifact,
  artifact_id: "docx-artifact",
  artifact_type: "discovery_report_editable_docx",
  title: "Current Work Diagnostic — Editable Deliverable",
  file_name: "diagnostic.docx",
  file_format: "docx",
  version: 2,
  metadata: {
    outputRole: "docx_editable_phase_record",
    pairedVisualCompanionArtifactId: "html-artifact",
  },
};

let insertedDecision: Record<string, unknown> | null = null;
let latestDecision: Record<string, unknown> | null = null;
let mockCanApproveGates = true;
const tenantSetFilters: Array<[string, string, unknown[]]> = [];
const tenantEqFilters: Array<[string, string, unknown]> = [];

function builder(table: string) {
  const state: { insertPayload?: Record<string, unknown> } = {};
  const api: Record<string, jest.Mock> = {};
  api.select = jest.fn(() => api);
  api.eq = jest.fn((column: string, value: unknown) => {
    if (column === "tenant_key") tenantEqFilters.push([table, column, value]);
    return api;
  });
  api.in = jest.fn((column: string, values: unknown[]) => {
    if (column === "tenant_key") tenantSetFilters.push([table, column, values]);
    return api;
  });
  api.order = jest.fn(() => api);
  api.limit = jest.fn(() => api);
  api.insert = jest.fn((payload: Record<string, unknown>) => {
    state.insertPayload = payload;
    return api;
  });
  api.maybeSingle = jest.fn(async () => {
    if (table === "move_artifacts") return { data: docxArtifact, error: null };
    if (table === "move_artifact_review_decisions") {
      return { data: latestDecision, error: null };
    }
    return { data: null, error: null };
  });
  api.single = jest.fn(async () => {
    insertedDecision = {
      id: "decision-1",
      created_at: "2026-06-28T01:00:00Z",
      ...(state.insertPayload ?? {}),
    };
    latestDecision = insertedDecision;
    return { data: insertedDecision, error: null };
  });
  return api;
}

jest.mock("../../../../../_auth", () => ({
  requireTenancy: jest.fn(async () => ({ ...tenancy, role: callerRole })),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("not a tenancy error");
  }),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  getMoveArtifactForTenant: jest.fn(async (_ctx, artifactId: string) =>
    artifactId === "docx-artifact" ? docxArtifact : htmlArtifact,
  ),
  downloadArtifactBytes: jest.fn(async () => ({
    bytes: Buffer.from(
      "<html><body><p>1,872 monthly exceptions and 2,345 manual touch hours per month. AI assist with human approval.</p></body></html>",
    ),
    fileName: "diagnostic.html",
    fileFormat: "html",
  })),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(() => ({
    from: (table: string) => builder(table),
  })),
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: jest.fn(async () => ({
    canApproveGates: mockCanApproveGates,
  })),
}));

jest.mock("@/lib/programs/tenant-key-filter", () => ({
  tenantKeyReadValues: (key: string) => [key, `${key}-canonical`],
}));

import { GET, POST } from "../route";
import { tenantKeyReadValues } from "@/lib/programs/tenant-key-filter";

function req(body: Record<string, unknown>) {
  return {
    json: jest.fn(async () => body),
  } as never;
}

function params(programId = "move-1", artifactId = "html-artifact") {
  return { params: Promise.resolve({ programId, artifactId }) };
}

beforeEach(() => {
  insertedDecision = null;
  latestDecision = null;
  mockCanApproveGates = true;
  tenantSetFilters.length = 0;
  tenantEqFilters.length = 0;
  callerRole = "workspace_member";
});

describe("artifact review decision route", () => {
  it("returns P2 draft readiness false before a decision and includes package ids", async () => {
    const res = await GET({} as never, params());
    const json = (await res.json()) as {
      ok: boolean;
      reviewPackage: Record<string, unknown>;
      packet: {
        diagnosticThesis: string;
        quantifiedFacts: string[];
        strongestEvidence: string[];
        knownLimitations: string[];
      };
      readiness: { readyForP3Draft: boolean; readyForP3Final: boolean };
    };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.reviewPackage).toMatchObject({
      htmlVisualCompanionArtifactId: "html-artifact",
      docxEditableArtifactId: "docx-artifact",
      reviewedArtifactIds: ["html-artifact", "docx-artifact"],
    });
    expect(json.readiness).toMatchObject({
      readyForP3Draft: false,
      readyForP3Final: false,
    });
    expect(json.packet.quantifiedFacts).toEqual([]);
    expect(json.packet.strongestEvidence).toEqual([]);
    expect(
      [json.packet.diagnosticThesis, ...json.packet.knownLimitations]
        .join(" ")
        .toLowerCase(),
    ).not.toMatch(/invoice|payment|accounts payable/);
  });

  it("persists approve-for-P3-draft without marking P2 or P3 final", async () => {
    const res = await POST(
      req({
        decision: "approve_for_p3_draft",
        rationale:
          "P2 is sufficient to begin P3 draft shaping; final gates remain open.",
      }),
      params(),
    );
    const json = (await res.json()) as {
      ok: boolean;
      readiness: {
        readyForP3Draft: boolean;
        readyForP3Final: boolean;
        p2FinalApproved: boolean;
      };
    };

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.readiness).toMatchObject({
      readyForP3Draft: true,
      readyForP3Final: false,
      p2FinalApproved: false,
    });
    expect(insertedDecision).toMatchObject({
      tenant_key: "test-tenant",
      move_id: "move-1",
      phase: 2,
      artifact_id: "html-artifact",
      artifact_version: 10,
      html_visual_companion_artifact_id: "html-artifact",
      docx_editable_artifact_id: "docx-artifact",
      reviewed_artifact_ids: JSON.stringify(["html-artifact", "docx-artifact"]),
      allowed_next_action: "generate_p3_draft",
      ready_for_p3_draft: true,
      ready_for_p3_final: false,
      p2_final_approved: false,
    });
    expect(insertedDecision?.carried_forward_caveats).toBe("[]");
    expect(insertedDecision?.missing_evidence).toBe("[]");
  });

  it("looks the paired editable record up under every spelling of the tenant key", async () => {
    const res = await POST(
      req({
        decision: "approve_for_p3_draft",
        rationale: "Paired record lookup must not depend on one spelling of the tenant key.",
      }),
      params(),
    );
    expect(res.status).toBe(200);
    // The paired docx lookup is the only move_artifacts read this route makes
    // itself; it must filter on the per-tenant alias set, never one spelling.
    expect(tenantSetFilters.filter(([table]) => table === "move_artifacts")).toEqual([
      ["move_artifacts", "tenant_key", tenantKeyReadValues(tenancy.clientKey)],
    ]);
    // The alias module is mocked to answer a two-spelling set for any key, so a
    // route that bypassed it and filtered on the one spelling it holds fails here.
    expect(tenantSetFilters[0]?.[2]).toEqual(["test-tenant", "test-tenant-canonical"]);
    expect(tenantEqFilters.filter(([table]) => table === "move_artifacts")).toEqual([]);
  });

  it("keeps P3 draft blocked when reviewer requests revisions", async () => {
    const res = await POST(
      req({
        decision: "request_revisions",
        rationale: "Revise the P2 diagnostic before P3 draft shaping.",
      }),
      params(),
    );
    const json = (await res.json()) as {
      readiness: { readyForP3Draft: boolean; allowedNextAction: string };
    };

    expect(res.status).toBe(200);
    expect(json.readiness).toMatchObject({
      readyForP3Draft: false,
      allowedNextAction: "regenerate_p2",
    });
  });

  it("denies review decisions to a listed contact without approval authority", async () => {
    mockCanApproveGates = false;
    callerRole = "founder";
    const res = await POST(
      req({
        decision: "approve_for_p3_draft",
        rationale: "A listed contact cannot record a Nexus approval.",
      }),
      params(),
    );
    const json = (await res.json()) as { error: string };

    expect(res.status).toBe(403);
    expect(json.error).toBe("forbidden");
    expect(insertedDecision).toBeNull();
  });
});
