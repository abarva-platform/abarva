import { clearContentHashParseCacheForTests } from "../../ingestion/content-hash-parse-cache";
import {
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
      },
    });
  });
});
