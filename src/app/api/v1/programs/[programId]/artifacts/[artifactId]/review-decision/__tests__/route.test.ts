const tenancy = {
  clientId: "client-lakeshore",
  clientKey: "lakeshore",
  userId: "reviewer-1",
  email: "cio@lakeshore-holdings.example.com",
};

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
  blob_path: "moves/lakeshore/move-1/generated/p2/diagnostic.html",
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

function builder(table: string) {
  const state: { insertPayload?: Record<string, unknown> } = {};
  const api: Record<string, jest.Mock> = {};
  api.select = jest.fn(() => api);
  api.eq = jest.fn(() => api);
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
  requireTenancy: jest.fn(async () => tenancy),
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

import { GET, POST } from "../route";

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
});

describe("artifact review decision route", () => {
  it("returns P2 draft readiness false before a decision and includes package ids", async () => {
    const res = await GET({} as never, params());
    const json = (await res.json()) as {
      ok: boolean;
      reviewPackage: Record<string, unknown>;
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
      tenant_key: "lakeshore",
      move_id: "move-1",
      phase: 2,
      artifact_id: "html-artifact",
      artifact_version: 10,
      html_visual_companion_artifact_id: "html-artifact",
      docx_editable_artifact_id: "docx-artifact",
      reviewed_artifact_ids: ["html-artifact", "docx-artifact"],
      allowed_next_action: "generate_p3_draft",
      ready_for_p3_draft: true,
      ready_for_p3_final: false,
      p2_final_approved: false,
    });
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
});
