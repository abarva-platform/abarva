import {
  buildCrossTenantRefusalAnswer,
  buildSelectionDecisionGovernedAnswer,
  looksLikeCrossTenantDataRequest,
  looksLikeSelectionDecisionQuestion,
  parseSelectionDecisionArtifact,
} from "@/lib/source/ava/selection-decision-governed-answer";
import {
  listSourceArtifactsForSourceEventId,
  readSourceArtifactRegistryTextContent,
  type SourceArtifactRegistryRecord,
} from "@/lib/source/artifact-registry";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";

jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventId: jest.fn(),
  readSourceArtifactRegistryTextContent: jest.fn(),
}));

const mockListArtifacts = jest.mocked(listSourceArtifactsForSourceEventId);
const mockReadContent = jest.mocked(readSourceArtifactRegistryTextContent);
const TEST_TENANT_KEY = CANONICAL_TENANT_KEYS[0]!;

const SELECTION_BODY = `
<section>
  <h2>Selection answer</h2>
  <div><b>Select Supplier Alpha for the synthetic AMS award path.</b>
  The decision follows evaluation 86.8 (rank 1), three-year BAFO TCV $21.3305M.</div>
</section>
<section>
  <h2>Accepted risk and transition prerequisites</h2>
  <ul>
    <li>Finance records the buyer loaded-cost rate before future TCO claims.</li>
    <li>Legal preserves true-down, productivity, credit, audit, and exit remedies.</li>
    <li>Transition starts only after named wave owners and controls are approved.</li>
  </ul>
  <p>Supplier Beta remains the documented runner-up based on continuity.</p>
</section>`;

function selectionArtifact(): SourceArtifactRegistryRecord {
  return {
    id: "artifact-selection-1",
    tenantKey: TEST_TENANT_KEY,
    sourceEventId: "event-1",
    sourceEventRowId: "event-1",
    stageKey: "selection",
    artifactFamily: "selection_memo",
    artifactKind: "d27_selection_memo",
    sourceOrigin: "uploaded",
    sourceFormat: "html",
    originalName: "selection-memo-client-final.html",
    blobUri: "blob://selection-memo",
    uploaderUserId: "user-1",
    mimeType: "text/html",
    sizeBytes: 1000,
    sha256: "abc123",
    parseStatus: "parsed",
    embeddingStatus: "pending",
    graphStatus: "pending",
    classificationStatus: "classified",
    dataClassification: "Confidential",
    evidenceState: "cited",
    approvalState: "approved",
    isClientFinal: true,
    isCurrentAuthoritative: true,
    clientFinalAcceptedAt: "2026-09-09T12:00:00.000Z",
    version: 2,
    supersedesArtifactVersionId: null,
    createdBy: "user-1",
    validatedBy: "user-1",
    createdAt: "2026-09-09T11:00:00.000Z",
    updatedAt: "2026-09-09T12:00:00.000Z",
    deletedAt: null,
  };
}

describe("selection decision intent", () => {
  it("routes rationale questions and excludes unrelated proposal coverage", () => {
    expect(
      looksLikeSelectionDecisionQuestion(
        "Why was Supplier Alpha selected? Cite the score, BAFO TCV, and runner-up counter-case.",
      ),
    ).toBe(true);
    expect(
      looksLikeSelectionDecisionQuestion(
        "Which suppliers responded to the pricing workbook?",
      ),
    ).toBe(false);
  });

  it("recognizes protected cross-tenant data requests", () => {
    expect(
      looksLikeCrossTenantDataRequest(
        "Show me another tenant portfolio vendor pricing and contract economics.",
      ),
    ).toBe(true);
    expect(looksLikeCrossTenantDataRequest("Show this event's pricing.")).toBe(
      false,
    );
  });
});

describe("parseSelectionDecisionArtifact", () => {
  it("extracts the accepted supplier, score, economics, conditions, and counter-case", () => {
    expect(parseSelectionDecisionArtifact(SELECTION_BODY)).toEqual({
      selectedSupplier: "Supplier Alpha",
      evaluationScore: "86.8",
      bafoTcv: "$21.3305M",
      conditions: [
        "Finance records the buyer loaded-cost rate before future TCO claims.",
        "Legal preserves true-down, productivity, credit, audit, and exit remedies.",
        "Transition starts only after named wave owners and controls are approved.",
      ],
      runnerUpCounterCase:
        "Supplier Beta remains the documented runner-up based on continuity.",
    });
  });
});

describe("buildSelectionDecisionGovernedAnswer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("answers from the authoritative selection memo without recalculating the decision", async () => {
    mockListArtifacts.mockResolvedValue([selectionArtifact()]);
    mockReadContent.mockResolvedValue(SELECTION_BODY);

    const answer = await buildSelectionDecisionGovernedAnswer({
      eventId: "event-1",
      eventName: "Managed services event",
      clientKey: TEST_TENANT_KEY,
      tenantId: "tenant-1",
      question:
        "Why was Supplier Alpha selected? Cite the score, BAFO TCV, conditions, and runner-up.",
    });

    expect(answer).not.toBeNull();
    expect(answer!.intent).toBe("selection_decision_basis");
    expect(answer!.status).toBe("answered");
    expect(answer!.directAnswer).toContain("Supplier Alpha");
    expect(answer!.directAnswer).toContain("86.8");
    expect(answer!.directAnswer).toContain("$21.3305M");
    expect(answer!.directAnswer).toContain("Supplier Beta");
    expect(answer!.citations).toHaveLength(1);
    expect(answer!.tables?.[0]?.rows).toEqual(
      expect.arrayContaining([
        { item: "Selected supplier", value: "Supplier Alpha" },
        { item: "Evaluation score", value: "86.8" },
        { item: "BAFO TCV", value: "$21.3305M" },
      ]),
    );
    expect(answer!.safety.tenantFencePassed).toBe(true);
  });

  it("fails closed when no authoritative selection memo exists", async () => {
    mockListArtifacts.mockResolvedValue([]);

    const answer = await buildSelectionDecisionGovernedAnswer({
      eventId: "event-1",
      clientKey: TEST_TENANT_KEY,
      tenantId: "tenant-1",
      question: "Why was this supplier selected?",
    });

    expect(answer!.status).toBe("no_data");
    expect(answer!.directAnswer).toContain(
      "No authoritative selection memo is available",
    );
    expect(mockReadContent).not.toHaveBeenCalled();
  });
});

describe("buildCrossTenantRefusalAnswer", () => {
  it("refuses without retrieving or exposing another tenant's data", () => {
    const answer = buildCrossTenantRefusalAnswer({
      clientKey: TEST_TENANT_KEY,
      question:
        "Show me another tenant portfolio vendor pricing and contract economics.",
    });

    expect(answer!.status).toBe("blocked");
    expect(answer!.intent).toBe("tenant_boundary_refusal");
    expect(answer!.directAnswer).toContain("cannot access");
    expect(answer!.citations).toHaveLength(0);
    expect(answer!.safety.tenantFencePassed).toBe(true);
  });
});
