import { clearContentHashParseCacheForTests } from "../../ingestion/content-hash-parse-cache";
import {
  buildRawModeEscape,
  classifySmallPdfNativeShortcut,
  estimateRawModeTokens,
  extractAgentAttachmentParseResult,
  extractAgentAttachmentText,
} from "../attachments";

const mockPdfDestroy = jest.fn(async () => undefined);
const mockPdfGetText = jest.fn(async () => ({
  text: "PDF parse fallback body",
  total: 5,
}));
const mockPdfGetTable = jest.fn(async () => ({
  pages: [{ tables: [[["A", "B"]]] }, { tables: [[["C", "D"]], [["E", "F"]]] }],
}));

jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockPdfGetText,
    getTable: mockPdfGetTable,
    destroy: mockPdfDestroy,
  })),
}));

const mockDocumentIntelligencePost = jest.fn();
const mockDocumentIntelligencePath = jest.fn(() => ({
  post: mockDocumentIntelligencePost,
}));
const mockDocumentIntelligence = jest.fn(
  (...args: [endpoint?: unknown, credential?: unknown, options?: unknown]) => {
    void args;
    return { path: mockDocumentIntelligencePath };
  },
);
const mockDocumentIntelligencePollUntilDone = jest.fn();
const mockDocumentIntelligencePoller = jest.fn(
  (...args: [client?: unknown, response?: unknown, options?: unknown]) => {
    void args;
    return { pollUntilDone: mockDocumentIntelligencePollUntilDone };
  },
);

jest.mock("@azure-rest/ai-document-intelligence", () => ({
  __esModule: true,
  default: (endpoint: unknown, credential: unknown, options?: unknown) =>
    mockDocumentIntelligence(endpoint, credential, options),
  isUnexpected: (response: { status: string }) => response.status !== "202",
  getLongRunningPoller: (
    client: unknown,
    response: unknown,
    options?: unknown,
  ) => mockDocumentIntelligencePoller(client, response, options),
}));

jest.mock("@azure/identity", () => ({
  DefaultAzureCredential: jest.fn().mockImplementation(() => ({})),
}));

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
  delete process.env.DOCUMENT_INTELLIGENCE_API_KEY;
  clearContentHashParseCacheForTests();
  mockPdfGetText.mockClear();
  mockPdfGetTable.mockClear();
  mockPdfDestroy.mockClear();
  mockDocumentIntelligencePost.mockReset();
  mockDocumentIntelligencePath.mockClear();
  mockDocumentIntelligence.mockClear();
  mockDocumentIntelligencePollUntilDone.mockReset();
  mockDocumentIntelligencePoller.mockClear();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("agent attachment parsing", () => {
  it("uses Azure AI Document Intelligence for PDF text when configured", async () => {
    process.env.DOCUMENT_INTELLIGENCE_ENDPOINT = "https://doc-intel.example";
    process.env.DOCUMENT_INTELLIGENCE_API_KEY = "secret";
    mockDocumentIntelligencePost.mockResolvedValue({ status: "202", body: {} });
    mockDocumentIntelligencePollUntilDone.mockResolvedValue({
      body: {
        analyzeResult: {
          content: "Azure DI markdown body",
          contentFormat: "markdown",
          pages: [{ pageNumber: 1 }],
          tables: [{ rowCount: 3 }],
        },
      },
    });

    const result = await extractAgentAttachmentParseResult({
      filename: "brief.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7"),
      cacheScope: "client-a",
    });

    expect(result).toEqual({
      text: "Azure DI markdown body",
      metadata: {
        pageCount: 1,
        tableCount: 1,
        parserId: "azure-document-intelligence-layout",
        smallDocumentShortcut: {
          eligible: true,
          route: "claude-native-pdf",
          reason: "small_pdf_under_configured_thresholds",
          byteSize: Buffer.from("%PDF-1.7").byteLength,
          pageCount: 1,
          thresholds: {
            maxBytes: 500 * 1024,
            maxPagesExclusive: 4,
          },
        },
        rawModeEscape: {
          eligible: true,
          requiresUserApproval: true,
          route: "claude-native-pdf",
          reason: "pdf_native_last_resort",
          estimatedTokensPerTurn: 3,
          parserBugTicketId: "parser-bug-86edbaa24831",
          costWarning:
            "Raw mode will send the original PDF to the model and may use about 1k tokens per chat turn. Use only if the parsed preview looks garbled or incomplete.",
        },
        economics: {
          documentKey:
            "sha256:86edbaa24831badfa0a8b04bb410141e2ee4182b6d0014493fe262a7a331c20b",
          documentHash:
            "86edbaa24831badfa0a8b04bb410141e2ee4182b6d0014493fe262a7a331c20b",
          documentLabel: "brief.pdf",
          originalFilename: "brief.pdf",
          mimeType: "application/pdf",
          byteSize: Buffer.from("%PDF-1.7").byteLength,
          parserId: "azure-document-intelligence-layout",
          parseProvider: "azure-document-intelligence",
          parseCostUsd: 0.01,
          parseCostBasis:
            "configured_azure_document_intelligence_page_estimate",
          parseUnitCount: 1,
          parseUnit: "page",
          pageCount: 1,
          tableCount: 1,
        },
      },
    });
    expect(mockDocumentIntelligencePost).toHaveBeenCalledTimes(1);
    expect(mockPdfGetText).not.toHaveBeenCalled();
  });

  it("falls back to pdf-parse when Azure AI Document Intelligence fails", async () => {
    process.env.DOCUMENT_INTELLIGENCE_ENDPOINT = "https://doc-intel.example";
    process.env.DOCUMENT_INTELLIGENCE_API_KEY = "secret";
    mockDocumentIntelligencePost.mockRejectedValue(
      new Error("service unavailable"),
    );

    const text = await extractAgentAttachmentText({
      filename: "brief.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7"),
      cacheScope: "client-a",
    });

    expect(text).toBe("PDF parse fallback body");
    expect(mockPdfGetText).toHaveBeenCalledTimes(1);
    expect(mockPdfGetTable).toHaveBeenCalledTimes(1);
    expect(mockPdfDestroy).toHaveBeenCalledTimes(1);
  });

  it("returns pdf-parse page and table metadata when using fallback parsing", async () => {
    const result = await extractAgentAttachmentParseResult({
      filename: "brief.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7"),
      cacheScope: "client-a",
    });

    expect(result).toEqual({
      text: "PDF parse fallback body",
      metadata: {
        pageCount: 5,
        tableCount: 3,
        parserId: "pdf-parse",
        smallDocumentShortcut: {
          eligible: false,
          route: "parser",
          reason: "over_page_threshold",
          byteSize: Buffer.from("%PDF-1.7").byteLength,
          pageCount: 5,
          thresholds: {
            maxBytes: 500 * 1024,
            maxPagesExclusive: 4,
          },
        },
        rawModeEscape: {
          eligible: true,
          requiresUserApproval: true,
          route: "claude-native-pdf",
          reason: "pdf_native_last_resort",
          estimatedTokensPerTurn: 3,
          parserBugTicketId: "parser-bug-86edbaa24831",
          costWarning:
            "Raw mode will send the original PDF to the model and may use about 1k tokens per chat turn. Use only if the parsed preview looks garbled or incomplete.",
        },
        economics: {
          documentKey:
            "sha256:86edbaa24831badfa0a8b04bb410141e2ee4182b6d0014493fe262a7a331c20b",
          documentHash:
            "86edbaa24831badfa0a8b04bb410141e2ee4182b6d0014493fe262a7a331c20b",
          documentLabel: "brief.pdf",
          originalFilename: "brief.pdf",
          mimeType: "application/pdf",
          byteSize: Buffer.from("%PDF-1.7").byteLength,
          parserId: "pdf-parse",
          parseProvider: "local-parser",
          parseCostUsd: 0,
          parseCostBasis: "local_or_unmetered_parser",
          parseUnitCount: 5,
          parseUnit: "page",
          pageCount: 5,
          tableCount: 3,
        },
      },
    });
  });

  it("builds deterministic document economics metadata for parser output", () => {
    const result = extractAgentAttachmentParseResult({
      filename: "brief.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7"),
      cacheScope: "client-a",
    });

    return expect(result).resolves.toMatchObject({
      metadata: {
        economics: {
          documentKey:
            "sha256:86edbaa24831badfa0a8b04bb410141e2ee4182b6d0014493fe262a7a331c20b",
          originalFilename: "brief.pdf",
          mimeType: "application/pdf",
          parseProvider: "local-parser",
          parseCostUsd: 0,
          parseCostBasis: "local_or_unmetered_parser",
        },
      },
    });
  });

  it("classifies PDFs under the configured size and page thresholds as native-ready", () => {
    expect(
      classifySmallPdfNativeShortcut({
        mimeType: "application/pdf",
        byteSize: 499 * 1024,
        pageCount: 3,
      }),
    ).toEqual({
      eligible: true,
      route: "claude-native-pdf",
      reason: "small_pdf_under_configured_thresholds",
      byteSize: 499 * 1024,
      pageCount: 3,
      thresholds: {
        maxBytes: 500 * 1024,
        maxPagesExclusive: 4,
      },
    });
  });

  it("keeps the default PDF shortcut strict at under 4 pages and under 500KB", () => {
    expect(
      classifySmallPdfNativeShortcut({
        mimeType: "application/pdf",
        byteSize: 500 * 1024,
        pageCount: 3,
      }).reason,
    ).toBe("over_size_threshold");

    expect(
      classifySmallPdfNativeShortcut({
        mimeType: "application/pdf",
        byteSize: 499 * 1024,
        pageCount: 4,
      }).reason,
    ).toBe("over_page_threshold");
  });

  it("lets operators tune PDF shortcut thresholds without code changes", () => {
    expect(
      classifySmallPdfNativeShortcut({
        mimeType: "application/pdf",
        byteSize: 700 * 1024,
        pageCount: 5,
        env: {
          ...process.env,
          AGENT_SMALL_DOC_NATIVE_PDF_MAX_BYTES: String(750 * 1024),
          AGENT_SMALL_DOC_NATIVE_PDF_MAX_PAGES: "6",
        },
      }),
    ).toMatchObject({
      eligible: true,
      route: "claude-native-pdf",
      thresholds: {
        maxBytes: 750 * 1024,
        maxPagesExclusive: 6,
      },
    });
  });

  it("builds a PDF raw-mode escape hatch with explicit approval and cost warning", () => {
    expect(estimateRawModeTokens(9_001)).toBe(3001);
    expect(
      buildRawModeEscape({
        mimeType: "application/pdf",
        byteSize: 9_001,
        contentHash: "abc123def4567890",
      }),
    ).toEqual({
      eligible: true,
      requiresUserApproval: true,
      route: "claude-native-pdf",
      reason: "pdf_native_last_resort",
      estimatedTokensPerTurn: 3001,
      parserBugTicketId: "parser-bug-abc123def456",
      costWarning:
        "Raw mode will send the original PDF to the model and may use about 4k tokens per chat turn. Use only if the parsed preview looks garbled or incomplete.",
    });
  });

  it("does not offer raw mode for non-PDF uploads", () => {
    expect(
      buildRawModeEscape({
        mimeType: "text/plain",
        byteSize: 1_000,
        contentHash: "abc123def4567890",
      }),
    ).toBeNull();
  });
});
