const getProgramByIdMock = jest.fn();
const fromMock = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  __esModule: true,
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

jest.mock("../queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

jest.mock("../audit-log", () => ({
  __esModule: true,
  writeProgramAuditLogBestEffort: jest.fn(),
}));

import { signOffDeliverable } from "../mutations";

function selectDeliverable(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

function insertVersion(payloads: unknown[]) {
  return {
    insert: jest.fn((payload) => {
      payloads.push(payload);
      return { error: null };
    }),
  };
}

function updateDeliverable(payloads: unknown[]) {
  return {
    update: jest.fn((payload) => {
      payloads.push(payload);
      return {
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: "deliverable-1" },
          error: null,
        }),
      };
    }),
  };
}

describe("signOffDeliverable", () => {
  beforeEach(() => {
    fromMock.mockReset();
    getProgramByIdMock.mockReset();
    getProgramByIdMock.mockResolvedValue({ id: "move-1" });
  });

  it("turns an uploaded client-approved replacement into the signed-off authoritative version", async () => {
    const versionPayloads: unknown[] = [];
    const updatePayloads: unknown[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === "deliverables_v2") {
        const deliverableCalls = fromMock.mock.calls.filter(([t]) => t === "deliverables_v2").length;
        if (deliverableCalls === 1) {
          return selectDeliverable({
            data: { current_version: 2 },
            error: null,
          });
        }
        return updateDeliverable(updatePayloads);
      }
      if (table === "deliverable_versions") return insertVersion(versionPayloads);
      throw new Error(`Unexpected table ${table}`);
    });

    const ok = await signOffDeliverable(
      {
        clientId: "client-1",
        userId: "person-1",
        email: "approver@example.com",
      },
      "move-1",
      "deliverable-1",
      {
        approvedArtifactId: "artifact-approved-1",
        approvedContent: {
          content: "Client-approved charter text after human edits.",
          fileName: "charter-client-approved.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          parseMethod: "docx-mammoth",
          warnings: [],
        },
      },
    );

    expect(ok).toBe(true);
    expect(versionPayloads).toEqual([
      expect.objectContaining({
        deliverable_id: "deliverable-1",
        version: 3,
        content: "Client-approved charter text after human edits.",
        structured_data: expect.objectContaining({
          source: "client_approved_upload",
          approved_artifact_id: "artifact-approved-1",
          uploaded_file_name: "charter-client-approved.docx",
          human_approved: true,
          replaces_ai_draft: true,
        }),
      }),
    ]);
    expect(updatePayloads[0]).toEqual(
      expect.objectContaining({
        status: "signed_off",
        current_version: 3,
        signed_off_version: 3,
        approved_artifact_id: "artifact-approved-1",
      }),
    );
  });
});
