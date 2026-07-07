import {
  LOADER_DIMENSION_TO_CONTEXT,
  resolveTemplateId,
  proposalToManifestFile,
  synthesizeManifest,
  planCommit,
  commitAcceptedProposals,
  type CommitDeps,
} from "@/lib/context-ingestion/loader/commit-adapter";
import {
  LOADER_DIMENSIONS,
  type LoaderDimension,
  type MappingProposal,
  type PreservedSourceFile,
} from "@/lib/context-ingestion/loader/contract";
import { getTemplateForDimension } from "@/lib/context-ingestion/template-registry";
import type {
  BulkContextUploadManifest,
  BulkContextUploadResult,
} from "@/lib/context-ingestion/bulk-context-upload";

const TENANT = "apex-retail";

function makeSource(
  overrides: Partial<PreservedSourceFile> = {},
): PreservedSourceFile {
  return {
    tenantKey: TENANT,
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
    dimensionConfidence: 0.92,
    fieldMappings: [
      { sourceColumn: "Name", canonicalField: "person.name", confidence: 0.95 },
      {
        sourceColumn: "Title",
        canonicalField: "person.title",
        confidence: 0.9,
      },
    ],
    reviewRequired: false,
    ...overrides,
  };
}

/** A bulk result stub — only the fields the adapter passes through matter. */
function fakeResult(
  overrides: Partial<BulkContextUploadResult> = {},
): BulkContextUploadResult {
  return {
    ok: true,
    mode: "stage_and_enqueue",
    loadName: "test-load",
    filesReceived: 1,
    filesProcessed: 1,
    rowsParsed: 0,
    chunksQueued: 0,
    recordsPromoted: 0,
    factsPromoted: 0,
    blobBucket: "context-uploads",
    workflow: {
      jobId: "job-1",
      summary: "staged",
      status: { persisted: false, bucket: null, path: null, pollable: false },
      steps: [],
    },
    results: [],
    persistence: { status: "staged_and_enqueued", detail: "ok" },
    ...overrides,
  };
}

describe("LOADER_DIMENSION_TO_CONTEXT", () => {
  it("maps every non-unknown loader dimension to a registered context dimension", () => {
    // Every loader dimension (except 'unknown') has an entry…
    for (const dim of LOADER_DIMENSIONS) {
      if (dim === "unknown") continue;
      expect(LOADER_DIMENSION_TO_CONTEXT[dim]).toBeTruthy();
    }
    // …and every mapped context dimension is a real, template-backed member of
    // the ContextDimension union (runtime proof against the template registry).
    for (const contextDimension of Object.values(LOADER_DIMENSION_TO_CONTEXT)) {
      expect(getTemplateForDimension(contextDimension, {})).not.toBeNull();
    }
  });
});

describe("resolveTemplateId", () => {
  it("returns a template id for leadership_org and applications_systems", () => {
    expect(resolveTemplateId("leadership_org", { tenantKey: TENANT })).toEqual(
      expect.any(String),
    );
    expect(
      resolveTemplateId("applications_systems", { tenantKey: TENANT }),
    ).toEqual(expect.any(String));
    // Default tenant (no key) also resolves via the NORTHSTAR registry.
    expect(resolveTemplateId("leadership_org", {})).toEqual(expect.any(String));
  });

  it("returns null for unknown", () => {
    expect(resolveTemplateId("unknown", { tenantKey: TENANT })).toBeNull();
  });
});

describe("proposalToManifestFile", () => {
  it("builds fieldMappings (sourceColumn -> canonicalField) and drops ask-confidence mappings", () => {
    const proposal = makeProposal({
      fieldMappings: [
        {
          sourceColumn: "Name",
          canonicalField: "person.name",
          confidence: 0.95,
        },
        {
          sourceColumn: "Title",
          canonicalField: "person.title",
          confidence: 0.7,
        },
        // confidence < CONFIRM (0.6) => 'ask' => dropped
        {
          sourceColumn: "Guess",
          canonicalField: "person.guess",
          confidence: 0.2,
        },
      ],
    });

    const file = proposalToManifestFile(proposal, { tenantKey: TENANT });

    expect(file.path).toBe("org-chart.csv");
    expect(file.templateId).toEqual(expect.any(String));
    expect(file.dataClassification).toBe("confidential");
    expect(file.fieldMappings).toEqual({
      Name: "person.name",
      Title: "person.title",
    });
    expect(file.fieldMappings).not.toHaveProperty("Guess");
  });

  it("throws when no template resolves for the dimension", () => {
    const proposal = makeProposal({
      dimension: "unknown" as LoaderDimension,
    });
    expect(() =>
      proposalToManifestFile(proposal, { tenantKey: TENANT }),
    ).toThrow("loader_commit_no_template_for_dimension:unknown");
  });
});

describe("synthesizeManifest", () => {
  it("maps accepted proposals to manifest files", () => {
    const manifest = synthesizeManifest({
      loadName: "apex-org",
      accepted: [makeProposal()],
      tenantKey: TENANT,
    });

    expect(manifest.loadName).toBe("apex-org");
    expect(manifest.defaultDataClassification).toBe("confidential");
    expect(manifest.files).toHaveLength(1);
    expect(manifest.files[0].fieldMappings).toEqual({
      Name: "person.name",
      Title: "person.title",
    });
  });

  it("throws loader_commit_no_accepted_files when accepted is empty", () => {
    expect(() =>
      synthesizeManifest({
        loadName: "empty",
        accepted: [],
        tenantKey: TENANT,
      }),
    ).toThrow("loader_commit_no_accepted_files");
  });
});

describe("planCommit", () => {
  it("filters out reviewRequired proposals and lists them in skippedReviewRequired", () => {
    const committable = makeProposal({
      source: makeSource({ filename: "kpis.csv" }),
      dimension: "kpis",
      fieldMappings: [
        {
          sourceColumn: "Metric",
          canonicalField: "kpi.metric",
          confidence: 0.95,
        },
      ],
    });
    const reviewed = makeProposal({
      source: makeSource({ filename: "board-deck.pdf" }),
      dimension: "leadership_org",
      reviewRequired: true,
    });

    const { manifest, skippedReviewRequired } = planCommit({
      loadName: "mixed",
      accepted: [committable, reviewed],
      tenantKey: TENANT,
    });

    expect(skippedReviewRequired).toEqual(["board-deck.pdf"]);
    expect(manifest.files).toHaveLength(1);
    expect(manifest.files[0].path).toBe("kpis.csv");
  });
});

describe("commitAcceptedProposals", () => {
  it("calls injected runBulk once with the synthesized manifest and returns its result + skipped list", async () => {
    const result = fakeResult();
    let captured: Parameters<CommitDeps["runBulk"]>[0] | undefined;
    const runBulk = jest.fn(
      async (input: Parameters<CommitDeps["runBulk"]>[0]) => {
        captured = input;
        return result;
      },
    ) as unknown as CommitDeps["runBulk"];

    const committable = makeProposal();
    const reviewed = makeProposal({
      source: makeSource({ filename: "evidence.pdf" }),
      reviewRequired: true,
    });

    const out = await commitAcceptedProposals({
      loadName: "apex-load",
      accepted: [committable, reviewed],
      tenantKey: TENANT,
      clientId: "apexretail",
      uploadedBy: "admin@apex-retail",
      attestation: { acknowledged: true } as never,
      mode: "stage_and_enqueue",
      files: [
        { name: "org-chart.csv", type: "text/csv", bytes: new ArrayBuffer(8) },
      ],
      deps: { runBulk },
    });

    expect(runBulk).toHaveBeenCalledTimes(1);
    expect(out.result).toBe(result);
    expect(out.skippedReviewRequired).toEqual(["evidence.pdf"]);

    const manifest = captured?.manifest as BulkContextUploadManifest;
    expect(captured?.clientId).toBe("apexretail");
    expect(captured?.tenantKey).toBe(TENANT);
    expect(captured?.mode).toBe("stage_and_enqueue");
    expect(manifest.loadName).toBe("apex-load");
    expect(manifest.files).toHaveLength(1);
    expect(manifest.files[0].path).toBe("org-chart.csv");
  });

  it("propagates the empty-accepted error", async () => {
    await expect(
      commitAcceptedProposals({
        loadName: "empty",
        accepted: [],
        tenantKey: TENANT,
        clientId: "apexretail",
        uploadedBy: "admin@apex-retail",
        attestation: {} as never,
        mode: "validate_only",
        files: [],
        deps: { runBulk: jest.fn() as unknown as CommitDeps["runBulk"] },
      }),
    ).rejects.toThrow("loader_commit_no_accepted_files");
  });
});
