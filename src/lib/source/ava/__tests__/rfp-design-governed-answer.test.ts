import {
  buildRfpDesignGovernedAnswer,
  looksLikeRfpDesignQuestion,
  parseRfpDesignArtifacts,
} from "@/lib/source/ava/rfp-design-governed-answer";
import {
  listSourceArtifactsForSourceEventId,
  readSourceArtifactRegistryTextContent,
  type SourceArtifactRegistryRecord,
} from "@/lib/source/artifact-registry";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventId: jest.fn(),
  readSourceArtifactRegistryTextContent: jest.fn(),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const mockListArtifacts = jest.mocked(listSourceArtifactsForSourceEventId);
const mockReadContent = jest.mocked(readSourceArtifactRegistryTextContent);
const mockGetReadClient = jest.mocked(getAzureReadFluentClient);
const TEST_TENANT_KEY = CANONICAL_TENANT_KEYS[0]!;

const RFP_BODY = `
<h1>Request for proposal</h1>
<p>This package issues 110 issued requirements across service scope, service management,
SLA and service credits, staffing and productivity, security and compliance, cloud and data,
transition, commercial and pricing, governance and reporting, and value measurement.</p>
<p>88 mandatory requirements require evidence.</p>
<table><tr><th>Requirement ID</th><th>Requirement category</th><th>RFP section</th>
<th>Requirement statement</th><th>Requirement level</th><th>Response type</th>
<th>Evaluation criterion ID</th><th>Evidence required</th></tr>
<tr><td>REQ-SCOPE-001</td><td>Service scope</td><td>4.1</td><td>Describe coverage.</td>
<td>Mandatory</td><td>Narrative</td><td>EVAL-01</td><td>Service matrix</td></tr></table>`;

const RESPONSE_CONTROL_BODY = `
<h1>Vendor response control pack</h1>
<p>Use only Comply, Partially Comply, Exception, or Not Applicable.</p>
<table><tr><th>Requirement ID</th><th>Response disposition</th><th>Response narrative</th>
<th>Evidence reference(s)</th><th>Pricing reference</th><th>SLA / KPI reference</th>
<th>Assumption / exception reference</th><th>Vendor owner</th></tr></table>`;

function artifact(
  kind: "d09_rfp_pack" | "d11_response_checklist",
): SourceArtifactRegistryRecord {
  return {
    id: `artifact-${kind}`,
    tenantKey: TEST_TENANT_KEY,
    sourceEventId: "event-1",
    sourceEventRowId: "event-1",
    stageKey: "rfp",
    artifactFamily: kind === "d09_rfp_pack" ? "rfp" : "response_checklist",
    artifactKind: kind,
    sourceOrigin: "uploaded",
    sourceFormat: "html",
    originalName:
      kind === "d09_rfp_pack"
        ? "rfp-package-client-final.html"
        : "response-control-client-final.html",
    blobUri: `blob://${kind}`,
    uploaderUserId: "user-1",
    mimeType: "text/html",
    sizeBytes: 1000,
    sha256: `sha-${kind}`,
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

describe("RFP design intent", () => {
  it("routes the live RFP design question ahead of response coverage", () => {
    expect(
      looksLikeRfpDesignQuestion(
        "What normalized response categories and mandatory requirements did this RFP require vendors to answer, and what evidence made the responses scorable?",
      ),
    ).toBe(true);
    expect(
      looksLikeRfpDesignQuestion(
        "Which vendors responded to every value lever?",
      ),
    ).toBe(false);
  });
});

describe("parseRfpDesignArtifacts", () => {
  it("extracts the accepted requirement counts, taxonomy, dispositions, and evidence fields", () => {
    const snapshot = parseRfpDesignArtifacts(
      RFP_BODY,
      RESPONSE_CONTROL_BODY,
    );

    expect(snapshot.requirementCount).toBe(110);
    expect(snapshot.mandatoryRequirementCount).toBe(88);
    expect(snapshot.dispositions).toEqual([
      "Comply",
      "Partially Comply",
      "Exception",
      "Not Applicable",
    ]);
    expect(snapshot.categories).toEqual(
      expect.arrayContaining([
        "Service scope",
        "SLA and service credits",
        "Commercial and pricing",
        "Value measurement",
      ]),
    );
    expect(snapshot.responseFields).toEqual(
      expect.arrayContaining([
        "Requirement ID",
        "Evaluation criterion ID",
        "Evidence reference(s)",
        "Pricing reference",
        "SLA / KPI reference",
        "Assumption / exception reference",
      ]),
    );
    expect(snapshot.conflicts).toEqual([]);
  });

  it("fails closed on conflicting accepted counts", () => {
    const snapshot = parseRfpDesignArtifacts(
      "The RFP has 110 issued requirements.",
      "The control pack has 109 requirements.",
    );
    expect(snapshot.requirementCount).toBeNull();
    expect(snapshot.conflicts[0]).toContain("110, 109");
  });

  it("counts requirement rows when an accepted artifact has no summary sentence", () => {
    const snapshot = parseRfpDesignArtifacts(
      "<table><tr><td>REQ-001</td><td>Mandatory</td></tr><tr><td>REQ-002</td><td>Scored</td></tr></table>",
      "",
    );
    expect(snapshot.requirementCount).toBe(2);
    expect(snapshot.mandatoryRequirementCount).toBe(1);
  });
});

describe("buildRfpDesignGovernedAnswer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetReadClient.mockReturnValue({} as never);
  });

  it("answers only from accepted RFP and response-control artifacts", async () => {
    const rfp = artifact("d09_rfp_pack");
    const control = artifact("d11_response_checklist");
    mockListArtifacts.mockResolvedValue([rfp, control]);
    mockReadContent.mockImplementation(async (record) =>
      record.artifactKind === "d09_rfp_pack"
        ? RFP_BODY
        : RESPONSE_CONTROL_BODY,
    );

    const answer = await buildRfpDesignGovernedAnswer({
      eventId: "event-1",
      eventName: "Application services sourcing event",
      clientKey: TEST_TENANT_KEY,
      tenantId: "tenant-1",
      question:
        "What normalized response categories and mandatory requirements did this RFP require vendors to answer?",
    });

    expect(answer?.intent).toBe("rfp_design_controls");
    expect(answer?.status).toBe("answered");
    expect(answer?.directAnswer).toContain("110 issued requirements");
    expect(answer?.directAnswer).toContain("88 mandatory requirements");
    expect(answer?.directAnswer).toContain("Partially Comply");
    expect(answer?.tables?.[0]?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ control: "Requirement grain" }),
        expect.objectContaining({ control: "Normalized disposition" }),
        expect.objectContaining({ control: "Scoring and evidence fields" }),
      ]),
    );
    expect(answer?.citations).toHaveLength(2);
    expect(answer?.safety.tenantFencePassed).toBe(true);
  });

  it("fails closed when an accepted response-control artifact is missing", async () => {
    mockListArtifacts.mockResolvedValue([artifact("d09_rfp_pack")]);

    const answer = await buildRfpDesignGovernedAnswer({
      eventId: "event-1",
      clientKey: TEST_TENANT_KEY,
      tenantId: "tenant-1",
      question: "How did the RFP make vendor responses scorable?",
    });

    expect(answer?.status).toBe("no_data");
    expect(answer?.directAnswer).toContain(
      "accepted vendor response control pack",
    );
    expect(mockReadContent).not.toHaveBeenCalled();
  });
});
