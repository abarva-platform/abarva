import {
  getDocumentIntelligenceConfig,
  parsePdfWithDocumentIntelligenceLayout,
} from "../document-intelligence-layout";

const mockPost = jest.fn();
const mockPath = jest.fn(() => ({ post: mockPost }));
const mockDocumentIntelligence = jest.fn(
  (...args: [endpoint?: unknown, credential?: unknown, options?: unknown]) => {
    void args;
    return { path: mockPath };
  },
);
const mockIsUnexpected = jest.fn(
  (response: { status: string }) => response.status !== "202",
);
const mockPollUntilDone = jest.fn();
const mockGetLongRunningPoller = jest.fn(
  (...args: [client?: unknown, response?: unknown, options?: unknown]) => {
    void args;
    return { pollUntilDone: mockPollUntilDone };
  },
);
const mockDefaultAzureCredential = jest.fn().mockImplementation(() => ({
  credential: "default-azure-credential",
}));

jest.mock("@azure-rest/ai-document-intelligence", () => ({
  __esModule: true,
  default: (endpoint: unknown, credential: unknown, options?: unknown) =>
    mockDocumentIntelligence(endpoint, credential, options),
  isUnexpected: (response: { status: string }) => mockIsUnexpected(response),
  getLongRunningPoller: (
    client: unknown,
    response: unknown,
    options?: unknown,
  ) => mockGetLongRunningPoller(client, response, options),
}));

jest.mock("@azure/identity", () => ({
  DefaultAzureCredential: mockDefaultAzureCredential,
}));

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
  delete process.env.DOCUMENT_INTELLIGENCE_API_KEY;
  delete process.env.DOCUMENT_INTELLIGENCE_USE_AAD;
  delete process.env.DOCUMENT_INTELLIGENCE_LOCALE;
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;
  mockPost.mockReset();
  mockPath.mockClear();
  mockDocumentIntelligence.mockClear();
  mockIsUnexpected.mockClear();
  mockPollUntilDone.mockReset();
  mockGetLongRunningPoller.mockClear();
  mockDefaultAzureCredential.mockClear();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("Document Intelligence layout parser", () => {
  it("requires endpoint plus either API key or explicit AAD mode", () => {
    expect(getDocumentIntelligenceConfig()).toBeNull();

    process.env.DOCUMENT_INTELLIGENCE_ENDPOINT = "https://doc-intel.example";
    expect(getDocumentIntelligenceConfig()).toBeNull();

    process.env.DOCUMENT_INTELLIGENCE_API_KEY = "secret";
    expect(getDocumentIntelligenceConfig()).toMatchObject({
      endpoint: "https://doc-intel.example",
      apiKey: "secret",
      useAad: false,
    });
  });

  it("calls prebuilt-layout with markdown output and API-key auth", async () => {
    process.env.DOCUMENT_INTELLIGENCE_ENDPOINT = "https://doc-intel.example";
    process.env.DOCUMENT_INTELLIGENCE_API_KEY = "secret";
    process.env.DOCUMENT_INTELLIGENCE_LOCALE = "en-US";
    mockPost.mockResolvedValue({ status: "202", body: {} });
    mockPollUntilDone.mockResolvedValue({
      body: {
        analyzeResult: {
          content: "# Parsed content\n\nAttendees: Sarah Chen",
          contentFormat: "markdown",
          pages: [{ pageNumber: 1 }, { pageNumber: 2 }],
          tables: [{ rowCount: 3 }],
        },
      },
    });

    const result = await parsePdfWithDocumentIntelligenceLayout(
      Buffer.from("%PDF-1.7"),
    );

    expect(result).toEqual({
      text: "# Parsed content\n\nAttendees: Sarah Chen",
      warnings: [],
      pageCount: 2,
      tableCount: 1,
      contentFormat: "markdown",
    });
    expect(mockDocumentIntelligence).toHaveBeenCalledWith(
      "https://doc-intel.example",
      {
        key: "secret",
      },
      undefined,
    );
    expect(mockPath).toHaveBeenCalledWith(
      "/documentModels/{modelId}:analyze",
      "prebuilt-layout",
    );
    expect(mockPost).toHaveBeenCalledWith({
      contentType: "application/json",
      body: {
        base64Source: Buffer.from("%PDF-1.7").toString("base64"),
      },
      queryParameters: {
        locale: "en-US",
        outputContentFormat: "markdown",
      },
    });
  });

  it("supports explicit AAD mode without an API key", async () => {
    process.env.DOCUMENT_INTELLIGENCE_ENDPOINT = "https://doc-intel.example";
    process.env.DOCUMENT_INTELLIGENCE_USE_AAD = "true";
    mockPost.mockResolvedValue({ status: "202", body: {} });
    mockPollUntilDone.mockResolvedValue({
      body: {
        analyzeResult: {
          content: "Parsed with AAD",
          contentFormat: "markdown",
          pages: [],
        },
      },
    });

    await parsePdfWithDocumentIntelligenceLayout(Buffer.from("%PDF-1.7"));

    expect(mockDefaultAzureCredential).toHaveBeenCalledTimes(1);
    expect(mockDocumentIntelligence).toHaveBeenCalledWith(
      "https://doc-intel.example",
      expect.objectContaining({ credential: "default-azure-credential" }),
      undefined,
    );
  });
});
