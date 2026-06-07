import {
  buildStewardPrompt,
  makeStewardReviewer,
  parseStewardFindings,
  type StewardModel,
} from "@/lib/context-ingestion/loader/steward-reviewer";
import type {
  MappingProposal,
  PreservedSourceFile,
} from "@/lib/context-ingestion/loader/contract";

function makeSource(
  overrides: Partial<PreservedSourceFile> = {},
): PreservedSourceFile {
  return {
    tenantKey: "apex-retail",
    filename: "org-chart.csv",
    container: "landing",
    objectKey: "landing/apex-retail/inbox/abc-org-chart.csv",
    blobUrl: "https://blob.example/landing/apex-retail/inbox/abc-org-chart.csv",
    fileHash: "a".repeat(64),
    bytes: 1234,
    contentType: "text/csv",
    uploadedBy: "admin@apex-retail",
    ingestedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  };
}

function makeProposal(
  overrides: Partial<MappingProposal> = {},
): MappingProposal {
  return {
    source: makeSource(),
    dimension: "leadership_org",
    dimensionConfidence: 0.9,
    fieldMappings: [
      {
        sourceColumn: "Name",
        canonicalField: "person.name",
        confidence: 0.95,
        citation: "column:Name",
      },
      {
        sourceColumn: "Title",
        canonicalField: "person.title",
        confidence: 0.9,
        citation: "column:Title",
      },
    ],
    sampleRows: [
      { Name: "Jane Doe", Title: "CFO" },
      { Name: "John Roe", Title: "CFO" },
    ],
    reviewRequired: false,
    ...overrides,
  };
}

/** A model stub that returns whatever canned string it is given. */
function cannedModel(output: string): StewardModel {
  return { review: jest.fn(async () => output) };
}

const TWO_VALID = JSON.stringify([
  {
    kind: "conflict",
    severity: "warn",
    message: "Two people are titled CFO — confirm which one is current.",
    rowRef: "rows 1, 2",
    suggestedAction: "Mark one as former or remove it.",
  },
  {
    kind: "realism",
    severity: "info",
    message: "The reported IT budget looks unusually small for this company.",
  },
]);

describe("parseStewardFindings", () => {
  it("parses a JSON array of 2 valid findings and stamps source: agent", () => {
    const findings = parseStewardFindings(TWO_VALID);
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.source === "agent")).toBe(true);
    expect(findings[0]).toEqual({
      kind: "conflict",
      severity: "warn",
      message: "Two people are titled CFO — confirm which one is current.",
      rowRef: "rows 1, 2",
      suggestedAction: "Mark one as former or remove it.",
      source: "agent",
    });
    expect(findings[1]).toEqual({
      kind: "realism",
      severity: "info",
      message: "The reported IT budget looks unusually small for this company.",
      source: "agent",
    });
  });

  it("extracts findings wrapped in ```json fences with surrounding prose", () => {
    const raw = [
      "Here is what Steward found after reviewing the upload:",
      "```json",
      TWO_VALID,
      "```",
      "Let me know if you want more detail.",
    ].join("\n");
    const findings = parseStewardFindings(raw);
    expect(findings).toHaveLength(2);
    expect(findings.map((f) => f.kind)).toEqual(["conflict", "realism"]);
  });

  it("drops items with invalid kind or severity", () => {
    const raw = JSON.stringify([
      {
        kind: "made_up_kind",
        severity: "warn",
        message: "invalid kind dropped",
      },
      {
        kind: "duplicate",
        severity: "catastrophic",
        message: "invalid severity dropped",
      },
      { kind: "duplicate", severity: "warn", message: "this one is valid" },
      { kind: "orphan", severity: "block" }, // missing message → dropped
    ]);
    const findings = parseStewardFindings(raw);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual({
      kind: "duplicate",
      severity: "warn",
      message: "this one is valid",
      source: "agent",
    });
  });

  it("returns [] on garbage / non-array / unparseable input", () => {
    expect(parseStewardFindings("not json at all")).toEqual([]);
    expect(parseStewardFindings('{ "kind": "conflict" }')).toEqual([]); // object, not array
    expect(parseStewardFindings("[ { broken ")).toEqual([]);
    expect(parseStewardFindings("")).toEqual([]);
  });
});

describe("makeStewardReviewer", () => {
  it("returns 2 agent findings from a stub model", async () => {
    const reviewer = makeStewardReviewer(cannedModel(TWO_VALID));
    const findings = await reviewer(makeProposal());
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.source === "agent")).toBe(true);
  });

  it("returns [] when the model returns garbage (never throws)", async () => {
    const reviewer = makeStewardReviewer(
      cannedModel("lorem ipsum dolor sit amet"),
    );
    await expect(reviewer(makeProposal())).resolves.toEqual([]);
  });

  it("returns [] when the model throws (never throws)", async () => {
    const throwingModel: StewardModel = {
      review: jest.fn(async () => {
        throw new Error("anthropic egress failed");
      }),
    };
    const reviewer = makeStewardReviewer(throwingModel);
    await expect(reviewer(makeProposal())).resolves.toEqual([]);
  });
});

describe("buildStewardPrompt", () => {
  it("includes the proposed dimension and at least one source column", () => {
    const prompt = buildStewardPrompt({ proposal: makeProposal() });
    expect(prompt).toContain("leadership_org");
    expect(prompt).toContain("Name");
    expect(prompt).toContain("Steward");
  });

  it("includes optional parsed document text when provided", () => {
    const prompt = buildStewardPrompt({
      proposal: makeProposal(),
      parsedText: "UNIQUE_DOC_MARKER_12345",
    });
    expect(prompt).toContain("UNIQUE_DOC_MARKER_12345");
  });
});
