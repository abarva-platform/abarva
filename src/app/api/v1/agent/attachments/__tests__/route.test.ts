/**
 * @jest-environment node
 */

// /api/v1/agent/attachments · POST tests
//
// We mock Clerk currentUser, getActiveClientRow, object storage,
// and the text-extraction helper so the route
// runs end-to-end without a live Supabase or Clerk session.

const currentUserMock = jest.fn();
jest.mock("@clerk/nextjs/server", () => ({
  currentUser: () => currentUserMock(),
}));

const getActiveClientRowMock = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));

const extractAgentAttachmentTextMock = jest.fn();
jest.mock("@/lib/agent/attachments", () => {
  const actual = jest.requireActual("@/lib/agent/attachments");
  return {
    ...actual,
    extractAgentAttachmentParseResult: (args: {
      filename: string;
      mimeType: string;
      buffer: Buffer;
    }) =>
      extractAgentAttachmentTextMock(args).then((text: string) => ({
        text,
        metadata: {
          pageCount: args.mimeType === "application/pdf" ? 4 : null,
          tableCount: args.mimeType === "application/pdf" ? 2 : null,
          parserId: "mock-parser",
          smallDocumentShortcut:
            args.mimeType === "application/pdf"
              ? {
                  eligible: false,
                  route: "parser",
                  reason: "over_page_threshold",
                  byteSize: args.buffer.byteLength,
                  pageCount: 4,
                  thresholds: {
                    maxBytes: 500 * 1024,
                    maxPagesExclusive: 4,
                  },
                }
              : null,
          rawModeEscape:
            args.mimeType === "application/pdf"
              ? {
                  eligible: true,
                  requiresUserApproval: true,
                  route: "claude-native-pdf",
                  reason: "pdf_native_last_resort",
                  estimatedTokensPerTurn: 342,
                  parserBugTicketId: "parser-bug-mock",
                  costWarning:
                    "Raw mode will send the original PDF to the model and may use about 1k tokens per chat turn. Use only if the parsed preview looks garbled or incomplete.",
                }
              : null,
          economics: {
            documentKey: `sha256:mock-${args.buffer.byteLength}`,
            documentHash: `mock-${args.buffer.byteLength}`,
            documentLabel: args.filename,
            originalFilename: args.filename,
            mimeType: args.mimeType,
            byteSize: args.buffer.byteLength,
            parserId: "mock-parser",
            parseProvider: "local-parser",
            parseCostUsd: 0,
            parseCostBasis: "local_or_unmetered_parser",
            parseUnitCount: args.mimeType === "application/pdf" ? 4 : 1,
            parseUnit: args.mimeType === "application/pdf" ? "page" : "file",
            pageCount: args.mimeType === "application/pdf" ? 4 : null,
            tableCount: args.mimeType === "application/pdf" ? 2 : null,
          },
        },
      })),
  };
});

type UploadArgs = [string, string, unknown, unknown];
const storageUploadMock = jest.fn<Promise<void>, UploadArgs>(
  async () => undefined,
);
const storageRemoveMock = jest.fn<Promise<void>, [string, string[]]>(
  async () => undefined,
);
const insertMock = jest.fn<
  Promise<{ error: null | { message: string } }>,
  [Record<string, unknown>]
>(async () => ({ error: null }));

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: () => ({
    upload: (bucket: string, path: string, body: unknown, opts: unknown) =>
      storageUploadMock(bucket, path, body, opts),
    remove: (bucket: string, paths: string[]) =>
      storageRemoveMock(bucket, paths),
  }),
}));

jest.mock("@/lib/data-plane/write-adapters/attachmentsWriteAdapter", () => ({
  selectAttachmentsWriteAdapter: () => ({
    insertAgentAttachment: (row: Record<string, unknown>) =>
      insertMock(row).then((result) => {
        if (result.error) throw new Error(result.error.message);
      }),
  }),
}));

// Import AFTER mocks
import { POST } from "@/app/api/v1/agent/attachments/route";

function makeMultipartRequest(
  filename: string,
  mime: string,
  bytes: number,
  fields: Record<string, string> = {},
): Request {
  const fd = new FormData();
  fd.append(
    "file",
    new File([new Uint8Array(bytes)], filename, { type: mime }),
  );
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return new Request("http://localhost/api/v1/agent/attachments", {
    method: "POST",
    body: fd,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  currentUserMock.mockResolvedValue({
    id: "user_123",
    primaryEmailAddress: { emailAddress: "a@b.test" },
    emailAddresses: [],
    publicMetadata: {},
  });
  getActiveClientRowMock.mockResolvedValue({
    id: "tenant-uuid-1",
    name: "Apex Retail",
    industry_code: "retail",
    key: "apexretail",
  });
  extractAgentAttachmentTextMock.mockResolvedValue("extracted text");
  storageUploadMock.mockResolvedValue(undefined);
  insertMock.mockResolvedValue({ error: null });
});

describe("POST /api/v1/agent/attachments", () => {
  it("rejects unauthenticated callers with 401", async () => {
    currentUserMock.mockResolvedValue(null);
    const req = makeMultipartRequest("a.pdf", "application/pdf", 100, {
      surface: "source/new",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(401);
  });

  it("returns 400 when surface is missing", async () => {
    const req = makeMultipartRequest("a.pdf", "application/pdf", 100);
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
  });

  it("returns 415 for an unsupported mime", async () => {
    const req = makeMultipartRequest("x.exe", "application/x-msdownload", 100, {
      surface: "source/new",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(415);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unsupported_mime");
  });

  it("returns 413 when the file exceeds the size cap", async () => {
    const req = makeMultipartRequest(
      "huge.pdf",
      "application/pdf",
      26 * 1024 * 1024,
      {
        surface: "source/new",
      },
    );
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(413);
  });

  it("returns 404 when no active tenant is bound", async () => {
    getActiveClientRowMock.mockResolvedValue(null);
    const req = makeMultipartRequest("a.pdf", "application/pdf", 100, {
      surface: "source/new",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(404);
  });

  it("accepts a PDF and returns the extracted text preview", async () => {
    extractAgentAttachmentTextMock.mockResolvedValue("PDF text body");
    const req = makeMultipartRequest("handbook.pdf", "application/pdf", 1024, {
      surface: "source/new",
      agent: "sentinel",
      dataClassification: "confidential_business",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      file_name: string;
      mime: string;
      bytes: number;
      storage_path: string;
      extracted_text_preview: string;
      parse_metadata: {
        page_count: number | null;
        table_count: number | null;
        parser_id: string | null;
        document_key: string | null;
        document_hash: string | null;
        document_label: string | null;
        original_filename: string;
        parse_provider: string | null;
        parse_cost_usd: number | null;
        parse_cost_basis: string | null;
        parse_unit_count: number | null;
        parse_unit: string | null;
        byte_size: number;
        small_doc_shortcut: {
          eligible: boolean;
          route: string;
          reason: string;
          byte_size: number;
          page_count: number | null;
          thresholds: {
            max_bytes: number;
            max_pages_exclusive: number;
          };
        } | null;
        raw_mode_escape: {
          eligible: boolean;
          requires_user_approval: boolean;
          route: string;
          reason: string;
          estimated_tokens_per_turn: number;
          parser_bug_ticket_id: string | null;
          cost_warning: string;
        } | null;
      };
      dataProtection: { decision: string; evidenceExtractionAllowed: boolean };
    };
    expect(body.file_name).toBe("handbook.pdf");
    expect(body.mime).toBe("application/pdf");
    expect(body.bytes).toBe(1024);
    expect(body.storage_path).toMatch(/^tenant-uuid-1\/user_123\//);
    expect(body.extracted_text_preview).toBe("PDF text body");
    expect(body.parse_metadata).toEqual({
      page_count: 4,
      table_count: 2,
      parser_id: "mock-parser",
      document_key: "sha256:mock-1024",
      document_hash: "mock-1024",
      document_label: "handbook.pdf",
      original_filename: "handbook.pdf",
      parse_provider: "local-parser",
      parse_cost_usd: 0,
      parse_cost_basis: "local_or_unmetered_parser",
      parse_unit_count: 4,
      parse_unit: "page",
      byte_size: 1024,
      small_doc_shortcut: {
        eligible: false,
        route: "parser",
        reason: "over_page_threshold",
        byte_size: 1024,
        page_count: 4,
        thresholds: {
          max_bytes: 500 * 1024,
          max_pages_exclusive: 4,
        },
      },
      raw_mode_escape: {
        eligible: true,
        requires_user_approval: true,
        route: "claude-native-pdf",
        reason: "pdf_native_last_resort",
        estimated_tokens_per_turn: 342,
        parser_bug_ticket_id: "parser-bug-mock",
        cost_warning:
          "Raw mode will send the original PDF to the model and may use about 1k tokens per chat turn. Use only if the parsed preview looks garbled or incomplete.",
      },
    });
    expect(body.dataProtection).toMatchObject({
      decision: "allow",
      evidenceExtractionAllowed: true,
    });
    expect(storageUploadMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
    const insertedRow = insertMock.mock.calls[0][0];
    expect(insertedRow).toMatchObject({
      tenant_id: "tenant-uuid-1",
      user_id: "user_123",
      surface: "source/new",
      agent: "sentinel",
      file_name: "handbook.pdf",
      mime: "application/pdf",
      bytes: 1024,
      extracted_text: "PDF text body",
    });
    expect(insertedRow.parse_metadata).toEqual(body.parse_metadata);
  });

  it("quarantines suspected PHI before blob upload, extraction, or metadata persistence", async () => {
    const req = makeMultipartRequest("clinical-notes.csv", "text/csv", 0, {
      surface: "source/new",
      dataClassification: "confidential_business",
    });
    const fd = await req.formData();
    fd.set(
      "file",
      new File(
        [
          new TextEncoder().encode(
            "Patient ID: MH123456\nDOB: 01/03/1972\nrisk_gap,0.14\n",
          ),
        ],
        "clinical-notes.csv",
        { type: "text/csv" },
      ),
    );
    const guardedReq = new Request(
      "http://localhost/api/v1/agent/attachments",
      {
        method: "POST",
        body: fd,
      },
    );

    const res = await POST(guardedReq as unknown as Parameters<typeof POST>[0]);

    expect(res.status).toBe(422);
    const body = (await res.json()) as {
      error: string;
      dataProtection: {
        decision: string;
        suspectedPhi: boolean;
        storageAllowed: boolean;
        evidenceExtractionAllowed: boolean;
        matchedRules: Array<{ ruleId: string }>;
      };
    };
    expect(body.error).toBe("sensitive_data_quarantined");
    expect(body.dataProtection).toMatchObject({
      decision: "quarantine",
      suspectedPhi: true,
      storageAllowed: false,
      evidenceExtractionAllowed: false,
    });
    expect(body.dataProtection.matchedRules.map((rule) => rule.ruleId)).toEqual(
      expect.arrayContaining(["phi.mrn", "phi.dob"]),
    );
    expect(storageUploadMock).not.toHaveBeenCalled();
    expect(extractAgentAttachmentTextMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("quarantines explicit regulated classifications before storage even without pattern hits", async () => {
    const req = makeMultipartRequest("aggregate.csv", "text/csv", 100, {
      surface: "source/new",
      dataProtectionClassification: "regulated_phi_pii_suspected",
    });

    const res = await POST(req as unknown as Parameters<typeof POST>[0]);

    expect(res.status).toBe(422);
    const body = (await res.json()) as {
      dataProtection: { decision: string; declaredClassification: string };
    };
    expect(body.dataProtection).toMatchObject({
      decision: "quarantine",
      declaredClassification: "regulated_phi_pii_suspected",
    });
    expect(storageUploadMock).not.toHaveBeenCalled();
    expect(extractAgentAttachmentTextMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "note.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    [
      "table.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    ["rows.csv", "text/csv"],
    ["readme.txt", "text/plain"],
    ["notes.md", "text/markdown"],
    ["screenshot.png", "image/png"],
  ])("accepts %s (%s)", async (filename, mime) => {
    const req = makeMultipartRequest(filename, mime, 256, {
      surface: "source/new",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mime: string };
    expect(body.mime).toBe(mime);
  });

  it("rolls back the blob if the metadata insert fails", async () => {
    insertMock.mockResolvedValue({ error: { message: "unique violation" } });
    const req = makeMultipartRequest("a.pdf", "application/pdf", 100, {
      surface: "source/new",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(500);
    expect(storageRemoveMock).toHaveBeenCalledTimes(1);
  });

  it("falls through with empty extracted_text_preview when extraction yields empty", async () => {
    extractAgentAttachmentTextMock.mockResolvedValue("");
    const req = makeMultipartRequest("photo.png", "image/png", 200, {
      surface: "source/new",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { extracted_text_preview: string };
    expect(body.extracted_text_preview).toBe("");
    const insertedRow = insertMock.mock.calls[0][0];
    expect(insertedRow.extracted_text).toBeNull();
  });

  // Move-detail surface · linked_move_id stamping. The dock threads
  // `surfaceContext` as a JSON form field; the route extracts moveId
  // and stamps it on the row at insert. Unwired today (no migration
  // chip yet), but here so future per-event linkage chips don't
  // forget to mirror this contract.
  it("stamps linked_move_id when surfaceContext.moveId is a valid UUID", async () => {
    const moveUuid = "11111111-2222-3333-4444-555555555555";
    const req = makeMultipartRequest("deck.pdf", "application/pdf", 1024, {
      surface: "moves/detail",
      agent: "nexus",
      surfaceContext: JSON.stringify({
        moveId: moveUuid,
        moveCode: "APX-CDP-2026",
      }),
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const insertedRow = insertMock.mock.calls[0][0];
    expect(insertedRow.linked_move_id).toBe(moveUuid);
    expect(insertedRow.surface).toBe("moves/detail");
    expect(insertedRow.agent).toBe("nexus");
  });

  it("leaves linked_move_id null when surfaceContext is absent", async () => {
    const req = makeMultipartRequest("deck.pdf", "application/pdf", 1024, {
      surface: "source/new",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const insertedRow = insertMock.mock.calls[0][0];
    expect(insertedRow.linked_move_id).toBeNull();
  });

  it("rejects a malformed surfaceContext.moveId rather than crashing the insert", async () => {
    const req = makeMultipartRequest("deck.pdf", "application/pdf", 1024, {
      surface: "moves/detail",
      surfaceContext: JSON.stringify({ moveId: "not-a-uuid" }),
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const insertedRow = insertMock.mock.calls[0][0];
    expect(insertedRow.linked_move_id).toBeNull();
  });

  it("tolerates unparseable surfaceContext JSON", async () => {
    const req = makeMultipartRequest("deck.pdf", "application/pdf", 1024, {
      surface: "moves/detail",
      surfaceContext: "{not json",
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const insertedRow = insertMock.mock.calls[0][0];
    expect(insertedRow.linked_move_id).toBeNull();
  });
});
