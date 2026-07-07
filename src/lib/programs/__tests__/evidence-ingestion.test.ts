import {
  evidenceForUnsupportedAttachment,
  extractProgramEvidenceFromUploadBuffer,
  extractProgramEvidenceFromText,
} from "../evidence-ingestion";
import { clearContentHashParseCacheForTests } from "../../ingestion/content-hash-parse-cache";

let mockMammothExtractRawTextResult = {
  value:
    "Attendees: Sarah Chen, Rick Stewart\nDecision: Sponsor approves P1 baseline workshop.\nBaseline: Data lineage completeness is 62%.",
  messages: [] as Array<{ message: string }>,
};

jest.mock("mammoth", () => ({
  extractRawText: jest.fn(async () => mockMammothExtractRawTextResult),
}));

const mockEachRow = jest.fn((cb: (row: { values: unknown[] }) => void) => {
  cb({ values: [undefined, "Attendees", "Sarah Chen", "Rick Stewart"] });
  cb({ values: [undefined, "Decision", "ARB review required before P3"] });
  cb({ values: [undefined, "Baseline", "Analytics cycle time is 21 days"] });
});
const mockEachSheet = jest.fn(
  (cb: (worksheet: { name: string; eachRow: typeof mockEachRow }) => void) => {
    cb({ name: "Workshop Notes", eachRow: mockEachRow });
  },
);

jest.mock("exceljs", () => ({
  __esModule: true,
  default: {
    Workbook: jest.fn().mockImplementation(() => ({
      xlsx: { load: jest.fn(async () => undefined) },
      eachSheet: mockEachSheet,
    })),
  },
}));

const mockPdfDestroy = jest.fn(async () => undefined);
const mockPdfGetText = jest.fn(async () => ({
  text: "Attendees: Sarah Chen\nAction: Finance validates VBC measure latency.\nRisk: Prior authorization automation baseline missing.",
}));

jest.mock("pdf-parse", () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockPdfGetText,
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
const mockDocumentIntelligenceIsUnexpected = jest.fn(
  (response: { status: string }) => response.status !== "202",
);

jest.mock("@azure-rest/ai-document-intelligence", () => ({
  __esModule: true,
  default: (endpoint: unknown, credential: unknown, options?: unknown) =>
    mockDocumentIntelligence(endpoint, credential, options),
  isUnexpected: (response: { status: string }) =>
    mockDocumentIntelligenceIsUnexpected(response),
  getLongRunningPoller: (client: unknown, response: unknown, options?: unknown) =>
    mockDocumentIntelligencePoller(client, response, options),
}));

jest.mock("@azure/identity", () => ({
  DefaultAzureCredential: jest.fn().mockImplementation(() => ({})),
}));

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.DOCUMENT_INTELLIGENCE_ENDPOINT;
  delete process.env.DOCUMENT_INTELLIGENCE_API_KEY;
  delete process.env.DOCUMENT_INTELLIGENCE_USE_AAD;
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY;
  clearContentHashParseCacheForTests();
  mockMammothExtractRawTextResult = {
    value:
      "Attendees: Sarah Chen, Rick Stewart\nDecision: Sponsor approves P1 baseline workshop.\nBaseline: Data lineage completeness is 62%.",
    messages: [],
  };
  mockEachRow.mockClear();
  mockEachSheet.mockClear();
  mockPdfGetText.mockClear();
  mockPdfDestroy.mockClear();
  mockDocumentIntelligencePost.mockReset();
  mockDocumentIntelligencePath.mockClear();
  mockDocumentIntelligence.mockClear();
  mockDocumentIntelligencePollUntilDone.mockReset();
  mockDocumentIntelligencePoller.mockClear();
  mockDocumentIntelligenceIsUnexpected.mockClear();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("program evidence ingestion", () => {
  it("extracts structured meeting signals from uploaded notes text", () => {
    const evidence = extractProgramEvidenceFromText({
      filename: "P1 baseline workshop meeting notes.md",
      mimeType: "text/markdown",
      text: [
        "Attendees: Sarah Chen, Rick Stewart, Finance Lead",
        "Decision: DORA baseline will be the hard P1 exit criterion.",
        "Action: Rick Stewart to provide lead time and deployment frequency by Friday.",
        "Risk: Data platform team is already committed to another roadmap.",
        "Baseline: Deployment frequency is currently weekly.",
      ].join("\n"),
    });

    expect(evidence.evidenceType).toBe("meeting_notes");
    expect(evidence.extractedStructured.attendees).toEqual([
      "Sarah Chen",
      "Rick Stewart",
      "Finance Lead",
    ]);
    expect(evidence.extractedStructured.decisions[0]).toContain(
      "DORA baseline",
    );
    expect(evidence.extractedStructured.action_items[0]).toContain(
      "Rick Stewart",
    );
    expect(evidence.extractedStructured.risks[0]).toContain("Data platform");
    expect(evidence.extractedStructured.baseline_candidates[0]).toContain(
      "Deployment frequency",
    );
    expect(evidence.extractedStructured.parse_method).toBe(
      "markdown-line-parser",
    );
  });

  it("extracts structured signals from section-based workshop notes", () => {
    const evidence = extractProgramEvidenceFromText({
      filename: "P1 discovery workshop notes.txt",
      mimeType: "text/plain",
      text: [
        "Attendees: Ethan Brooks, Priya Mehta, Lena Ortiz",
        "Decisions:",
        "- Scope first cohort to digital banking product analytics.",
        "- Do not include core replacement execution in this program.",
        "Baseline candidates:",
        "- Analytics request-to-insight cycle time.",
        "- Payments/fraud signal latency.",
        "Actions:",
        "- Rachel Kim to provide analytics cycle-time and lineage extract.",
        "- James Park to provide payments/fraud signal latency sample.",
        "Risks:",
        "- Program could drift into core replacement.",
        "- Exact financial impact remains restricted.",
      ].join("\n"),
    });

    expect(evidence.evidenceType).toBe("meeting_notes");
    expect(evidence.extractedStructured.decisions).toEqual([
      "Scope first cohort to digital banking product analytics.",
      "Do not include core replacement execution in this program.",
    ]);
    expect(evidence.extractedStructured.baseline_candidates).toEqual([
      "Analytics request-to-insight cycle time.",
      "Payments/fraud signal latency.",
    ]);
    expect(evidence.extractedStructured.action_items).toEqual([
      "Rachel Kim to provide analytics cycle-time and lineage extract.",
      "James Park to provide payments/fraud signal latency sample.",
    ]);
    expect(evidence.extractedStructured.risks).toEqual([
      "Program could drift into core replacement.",
      "Exact financial impact remains restricted.",
    ]);
  });

  it("extracts baseline and decision bullets from natural consulting headings", () => {
    const evidence = extractProgramEvidenceFromText({
      filename: "P1 baseline attestation.txt",
      mimeType: "text/plain",
      text: [
        "Attendees: Ethan Brooks, Priya Mehta, Lena Ortiz",
        "Sponsor decision:",
        "- Priya Mehta approves PROCEED to P2 Synthesis once this addendum is saved.",
        "Attested baseline metrics:",
        "- Analytics request-to-insight cycle time: 21 business days current baseline.",
        "- Data lineage completeness: 62% current baseline.",
        "Risks:",
        "- Model-risk evidence may be incomplete before charter.",
      ].join("\n"),
    });

    expect(evidence.extractedStructured.decisions).toEqual([
      "Priya Mehta approves PROCEED to P2 Synthesis once this addendum is saved.",
    ]);
    expect(evidence.extractedStructured.baseline_candidates).toEqual([
      "Analytics request-to-insight cycle time: 21 business days current baseline.",
      "Data lineage completeness: 62% current baseline.",
    ]);
    expect(evidence.extractedStructured.risks).toEqual([
      "Model-risk evidence may be incomplete before charter.",
    ]);
  });

  it("extracts structured signals from DOCX upload bytes", async () => {
    const evidence = await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 sponsor workshop notes.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    });

    expect(evidence.evidenceType).toBe("meeting_notes");
    expect(evidence.extractedText).toContain("Data lineage completeness");
    expect(evidence.extractedStructured.parse_method).toBe("docx-mammoth");
    expect(evidence.extractedStructured.decisions[0]).toContain(
      "Sponsor approves",
    );
    expect(evidence.extractedStructured.baseline_candidates[0]).toContain(
      "Data lineage",
    );
  });

  it("extracts structured signals from PDF upload bytes", async () => {
    const evidence = await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 meeting notes.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7"),
    });

    expect(evidence.evidenceType).toBe("meeting_notes");
    expect(evidence.extractedStructured.parse_method).toBe("pdf-parse");
    expect(evidence.extractedStructured.action_items[0]).toContain(
      "Finance validates",
    );
    expect(evidence.extractedStructured.risks[0]).toContain(
      "Prior authorization",
    );
    expect(mockPdfDestroy).toHaveBeenCalledTimes(1);
  });

  it("uses Azure AI Document Intelligence as the primary PDF parser when configured", async () => {
    process.env.DOCUMENT_INTELLIGENCE_ENDPOINT = "https://doc-intel.example";
    process.env.DOCUMENT_INTELLIGENCE_API_KEY = "secret";
    mockDocumentIntelligencePost.mockResolvedValue({ status: "202", body: {} });
    mockDocumentIntelligencePollUntilDone.mockResolvedValue({
      body: {
        analyzeResult: {
          content: [
            "Attendees: Sarah Chen",
            "Decision: Sponsor approves Azure DI as primary PDF parser.",
            "Baseline: Parser output includes markdown tables.",
          ].join("\n"),
          contentFormat: "markdown",
          pages: [{ pageNumber: 1 }, { pageNumber: 2 }],
        },
      },
    });

    const evidence = await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 meeting notes.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7"),
      cacheScope: "client-a",
    });

    expect(evidence.extractedStructured.parse_method).toBe(
      "azure-document-intelligence-layout",
    );
    expect(evidence.extractedStructured.decisions[0]).toContain(
      "Sponsor approves Azure DI",
    );
    expect(evidence.extractedStructured.baseline_candidates[0]).toContain(
      "markdown tables",
    );
    expect(evidence.extractedStructured.warnings[0]).toContain("2 pages");
    expect(mockDocumentIntelligencePost).toHaveBeenCalledTimes(1);
    expect(mockPdfGetText).not.toHaveBeenCalled();
  });

  it("falls back to pdf-parse when Azure AI Document Intelligence fails", async () => {
    process.env.DOCUMENT_INTELLIGENCE_ENDPOINT = "https://doc-intel.example";
    process.env.DOCUMENT_INTELLIGENCE_API_KEY = "secret";
    mockDocumentIntelligencePost.mockRejectedValue(new Error("service unavailable"));

    const evidence = await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 meeting notes.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7"),
      cacheScope: "client-a",
    });

    expect(evidence.extractedStructured.parse_method).toBe("pdf-parse");
    expect(evidence.extractedStructured.warnings[0]).toContain(
      "Azure AI Document Intelligence failed",
    );
    expect(evidence.extractedStructured.action_items[0]).toContain(
      "Finance validates",
    );
    expect(mockPdfGetText).toHaveBeenCalledTimes(1);
    expect(mockPdfDestroy).toHaveBeenCalledTimes(1);
  });

  it("reuses scoped parsed PDF text for identical upload bytes", async () => {
    const buffer = Buffer.from("%PDF-1.7 same evidence");

    const first = await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 meeting notes.pdf",
      mimeType: "application/pdf",
      buffer,
      cacheScope: "client-a",
    });
    const second = await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 renamed meeting notes.pdf",
      mimeType: "application/pdf",
      buffer,
      cacheScope: "client-a",
    });

    expect(first.title).toBe("P1 meeting notes.pdf");
    expect(second.title).toBe("P1 renamed meeting notes.pdf");
    expect(second.extractedStructured.action_items[0]).toContain(
      "Finance validates",
    );
    expect(mockPdfGetText).toHaveBeenCalledTimes(1);
    expect(mockPdfDestroy).toHaveBeenCalledTimes(1);
  });

  it("does not reuse parsed PDF text across cache scopes", async () => {
    const buffer = Buffer.from("%PDF-1.7 tenant scoped evidence");

    await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 meeting notes.pdf",
      mimeType: "application/pdf",
      buffer,
      cacheScope: "client-a",
    });
    await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 meeting notes.pdf",
      mimeType: "application/pdf",
      buffer,
      cacheScope: "client-b",
    });

    expect(mockPdfGetText).toHaveBeenCalledTimes(2);
    expect(mockPdfDestroy).toHaveBeenCalledTimes(2);
  });

  it("extracts structured signals from XLSX workshop output bytes", async () => {
    const evidence = await extractProgramEvidenceFromUploadBuffer({
      filename: "P1 baseline workshop output.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    });

    expect(evidence.evidenceType).toBe("workshop_output");
    expect(evidence.extractedText).toContain("Worksheet: Workshop Notes");
    expect(evidence.extractedStructured.parse_method).toBe("exceljs-xlsx");
    expect(evidence.extractedStructured.decisions[0]).toContain("ARB review");
    expect(evidence.extractedStructured.baseline_candidates[0]).toContain(
      "Analytics cycle time",
    );
  });

  it("creates metadata-only evidence for unsupported binary attachments", () => {
    const evidence = evidenceForUnsupportedAttachment({
      filename: "steering deck.pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });

    expect(evidence.evidenceType).toBe("uploaded_artifact");
    expect(evidence.extractedText).toBeNull();
    expect(evidence.extractedStructured.parse_method).toBe("metadata-only");
    expect(evidence.extractedStructured.warnings[0]).toContain(
      "Structured parsing unavailable",
    );
  });
});
