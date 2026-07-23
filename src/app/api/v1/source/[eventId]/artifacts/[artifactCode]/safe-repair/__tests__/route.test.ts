const tenancy = {
  clientId: "client-1",
  clientKey: "skyharbor-air",
  userId: "clerk-user-1",
  role: "maestro",
};

const currentUser = {
  personId: "person-1",
  clerkUserId: "clerk-user-1",
  email: "anand.sundaram+skyharbor@thesundaram.com",
  name: "Anand Sundaram",
  primaryRole: "maestro",
  metadataClientKey: "skyharbor-air",
};

const eventRow = {
  id: "11111111-1111-1111-1111-111111111111",
  client_key: "skyharbor-air",
};

const blockerBody = [
  "Document: d01_strategy_memo",
  "Company: SkyHarbor Air",
  "",
  "This AI generated auto-draft references the d01 artifact_code and substrate.",
].join("\n");

const artifactStateRow = {
  id: "state-row-1",
  source_event_id: eventRow.id,
  tenant_key: "skyharbor-air",
  artifact_code: "d01_strategy_memo",
  stage_key: "strategy",
  artifact_family: "strategy",
  tier: "outline",
  status: "locked",
  requirement_level: "required",
  gate_defining: true,
  linked_artifact_id: null,
  notes: null,
  body: blockerBody,
  body_format: "markdown",
  body_authored_by: "clerk-user-old",
  body_updated_at: "2026-07-01T00:00:00.000Z",
  body_generation_metadata: { model: "claude-opus-4-8" },
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

const updateArtifactBody = jest.fn(async (input: { columns: Record<string, unknown> }) => ({
  ok: true,
  data: {
    ...artifactStateRow,
    ...input.columns,
  },
}));
const insertActivityLog = jest.fn(async () => ({ ok: true }));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("tenancy error");
  }),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    key: "skyharbor-air",
    name: "SkyHarbor Air",
  })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => currentUser),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canUploadSourceArtifacts: true,
  })),
}));

jest.mock("@/lib/source/queries", () => ({
  scaffoldNewEventSubstrate: jest.fn(async () => undefined),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => ({
    updateArtifactBody,
    insertActivityLog,
  })),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => fakeFluentClient()),
}));

import { sha256Text } from "@/lib/source/artifact-safe-repair";
import { POST } from "../route";

function fakeFluentClient() {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return chain;
        },
        maybeSingle: async () => {
          if (table === "source_events") {
            return filters.id === eventRow.id
              ? { data: eventRow, error: null }
              : { data: null, error: null };
          }
          if (table === "source_event_artifact_states") {
            const matches =
              filters.id === artifactStateRow.id &&
              filters.source_event_id === eventRow.id &&
              filters.artifact_code === artifactStateRow.artifact_code;
            return {
              data: matches ? artifactStateRow : null,
              error: null,
            };
          }
          return { data: null, error: null };
        },
      };
      return chain;
    },
  };
}

function request(body: unknown): import("next/server").NextRequest {
  return { json: async () => body } as unknown as import("next/server").NextRequest;
}

const ctx = {
  params: Promise.resolve({
    eventId: eventRow.id,
    artifactCode: artifactStateRow.artifact_code,
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  updateArtifactBody.mockImplementation(async (input) => ({
    ok: true,
    data: {
      ...artifactStateRow,
      ...input.columns,
    },
  }));
  insertActivityLog.mockResolvedValue({ ok: true });
});

describe("POST /api/v1/source/:eventId/artifacts/:artifactCode/safe-repair", () => {
  it("dry-runs a selected artifact without writing and returns before/after content QA", async () => {
    const res = await POST(
      request({
        artifactStateId: artifactStateRow.id,
        mode: "dry_run",
      }),
      ctx,
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      receipt: {
        beforeSha256: string;
        beforeBannedTermMatches: string[];
        afterBannedTermMatches: string[];
        diff: { changed: boolean; removedBannedTerms: string[] };
      };
      confirmationRequired: boolean;
      confirmationPhrase: string;
    };
    expect(json.confirmationRequired).toBe(true);
    expect(json.confirmationPhrase).toBe("SAFE REPAIR d01_strategy_memo");
    expect(json.receipt.beforeSha256).toBe(sha256Text(blockerBody));
    expect(json.receipt.beforeBannedTermMatches).toEqual(
      expect.arrayContaining(["AI generated", "auto-draft", "d01"]),
    );
    expect(json.receipt.afterBannedTermMatches).toEqual([]);
    expect(json.receipt.diff.changed).toBe(true);
    expect(json.receipt.diff.removedBannedTerms).toEqual(
      expect.arrayContaining(["AI generated", "auto-draft", "d01"]),
    );
    expect(updateArtifactBody).not.toHaveBeenCalled();
    expect(insertActivityLog).not.toHaveBeenCalled();
  });

  it("refuses to apply safe repair without explicit confirmation", async () => {
    const res = await POST(
      request({
        artifactStateId: artifactStateRow.id,
        mode: "apply",
        expectedBodySha256: sha256Text(blockerBody),
      }),
      ctx,
    );

    expect(res.status).toBe(409);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("confirmation_required");
    expect(updateArtifactBody).not.toHaveBeenCalled();
    expect(insertActivityLog).not.toHaveBeenCalled();
  });

  it("applies confirmed safe repair, keeps terminal status, and writes an audit receipt", async () => {
    const res = await POST(
      request({
        artifactStateId: artifactStateRow.id,
        mode: "apply",
        confirmApply: true,
        confirmationPhrase: "SAFE REPAIR d01_strategy_memo",
        expectedBodySha256: sha256Text(blockerBody),
      }),
      ctx,
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      receipt: {
        artifactStateId: string;
        afterBannedTermMatches: string[];
        diff: { summary: string };
      };
      artifact: { status: string; bodyGenerationMetadata: Record<string, unknown> };
    };
    expect(json.receipt.artifactStateId).toBe(artifactStateRow.id);
    expect(json.receipt.afterBannedTermMatches).toEqual([]);
    expect(json.receipt.diff.summary).toContain("content-blocker scan is clean");
    expect(json.artifact.status).toBe("locked");
    expect(updateArtifactBody).toHaveBeenCalledWith({
      artifactRowId: artifactStateRow.id,
      columns: expect.objectContaining({
        body: expect.not.stringContaining("AI generated"),
        body_generation_metadata: expect.objectContaining({
          latestSafeRepairReceipt: expect.objectContaining({
            artifactStateId: artifactStateRow.id,
            afterBannedTermMatches: [],
          }),
          safeRepairReceipts: [
            expect.objectContaining({
              artifactStateId: artifactStateRow.id,
              afterBannedTermMatches: [],
            }),
          ],
        }),
      }),
    });
    expect(insertActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: eventRow.id,
        clientKey: "skyharbor-air",
        actionType: "artifact_safe_repair_applied",
        artifactCode: "d01_strategy_memo",
        metadata: expect.objectContaining({
          receipt: expect.objectContaining({
            artifactStateId: artifactStateRow.id,
            afterBannedTermMatches: [],
          }),
        }),
      }),
    );
  });
});
