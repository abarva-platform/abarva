import type { NextRequest } from "next/server";

import { POST } from "../route";
import { answerHomeAvaQuestion } from "@/lib/home/preview/ava-answer";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "@/lib/home/preview/ecl-projection-bundle";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import type {
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";

jest.mock("@/lib/auth/platform-admin-session", () => ({
  isPlatformAdminSession: jest.fn(async () => true),
}));

jest.mock("@/lib/auth/foundation-preview-session", () => ({
  isFoundationPreviewOperatorSession: jest.fn(async () => false),
}));

jest.mock("@/lib/home/preview/golden-snapshot", () => ({
  isHomePreviewTenantKey: (value: string) =>
    value === "meridian-health" || value === "skyharbor-air",
  getHomeReviewBundle: jest.fn(() => {
    throw new Error(
      "Home aVa route must not read the golden snapshot directly.",
    );
  }),
}));

jest.mock("@/lib/home/preview/ecl-projection-bundle", () => ({
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource: jest.fn(),
}));

jest.mock("@/lib/home/preview/ava-answer", () => ({
  answerHomeAvaQuestion: jest.fn(async () => ({
    surface: "home",
    mode: "KNOW",
    status: "answered",
    directAnswer: "Use the served Home record.",
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    citations: [],
    gaps: [],
    caveats: [],
    nextSteps: [],
    artifacts: [],
    quality: {
      confidence: "high",
      evidenceStrength: "strong",
      tenantGrounding: "complete",
      answerCompleteness: "complete",
    },
    safety: {
      policyChecked: true,
      disclosureLevel: "tenant-confidential",
      containsRestrictedContent: false,
      redactionsApplied: [],
    },
  })),
}));

const mockedResolveBundle = jest.mocked(
  getHomeEclProjectionBundleOrReviewedSnapshotWithSource,
);
const mockedAnswerHomeAvaQuestion = jest.mocked(answerHomeAvaQuestion);
const mockedGetHomeReviewBundle = jest.mocked(getHomeReviewBundle);

function makeRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

function rows(count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: `row-${index}` }));
}

function homeBundle(): HomeReviewBundle {
  return {
    tenantKey: "meridian-health",
    provenance: {
      canonical_snapshot_hash:
        "ecl:assessment-dense-source-room-20260823:serving.home_*:3317",
      generated_at: "2026-09-23T00:00:00.000Z",
    },
    executiveStoryPlan: undefined,
    chapters: [],
    thesis: {
      signalPacket: {
        signals: [],
        contextItems: [],
        sourceSummaries: [],
      },
      publishedGeneration: {},
      verificationLedger: [],
      structuralIssues: [],
    },
    technologyEstate: {
      recordTypes: [
        {
          objectType: "vendor_contract",
          label: "Vendor Contracts",
          columns: [],
          rows: rows(230),
          primaryDimension: "serviceCategory",
          dimensionCounts: [],
        },
        {
          objectType: "data_asset_or_integration",
          label: "Data Assets & Integrations",
          columns: [],
          rows: rows(1710),
          primaryDimension: "dataDomain",
          dimensionCounts: [],
        },
      ],
    },
  } as unknown as HomeReviewBundle;
}

function liveRecordSource(): HomeRecordRenderSource {
  return {
    kind: "ecl_serving_projection",
    canonicalSnapshotHash:
      "ecl:assessment-dense-source-room-20260823:serving.home_*:3317",
    contextVersion: {
      assessmentId: "assessment-dense-source-room-20260823",
      projectionContentHash: "projection-content-a",
      sourceSetHash: null,
      deterministicPacketHash: "packet-a",
      narrativePacketHash: "narrative-old",
      narrativeGeneratedAt: "2026-08-21T00:00:00.000Z",
      dataAsOf: null,
      coherence: "stored_narrative",
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE;
  mockedResolveBundle.mockResolvedValue({
    bundle: homeBundle(),
    recordSource: liveRecordSource(),
  });
});

it("answers from the same served Home bundle source that renders the page", async () => {
  const response = await POST(
    makeRequest({
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed?",
      activeChapterId: "technology_data",
      expectedRecordSource: liveRecordSource(),
    }),
  );

  expect(response.status).toBe(200);
  expect(mockedResolveBundle).toHaveBeenCalledWith("meridian-health");
  expect(mockedAnswerHomeAvaQuestion).toHaveBeenCalledWith(
    expect.objectContaining({
      tenantKey: "meridian-health",
      activeChapterId: "technology_data",
    }),
  );
  const answerInput = mockedAnswerHomeAvaQuestion.mock.calls[0][0];
  const technologyEstate = answerInput.bundle.technologyEstate;
  expect(technologyEstate).toBeDefined();
  expect(technologyEstate?.recordTypes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        label: "Vendor Contracts",
        rows: expect.arrayContaining([expect.any(Object)]),
      }),
      expect.objectContaining({
        label: "Data Assets & Integrations",
        rows: expect.arrayContaining([expect.any(Object)]),
      }),
    ]),
  );
  expect(
    technologyEstate?.recordTypes.find(
      (recordType) => recordType.objectType === "vendor_contract",
    )?.rows,
  ).toHaveLength(230);
  expect(
    technologyEstate?.recordTypes.find(
      (recordType) => recordType.objectType === "data_asset_or_integration",
    )?.rows,
  ).toHaveLength(1710);

  const json = await response.json();
  expect(json.recordSource).toEqual(liveRecordSource());
});

it("keeps the reviewed fallback visible to the API caller", async () => {
  mockedResolveBundle.mockResolvedValueOnce({
    bundle: homeBundle(),
    recordSource: {
      kind: "reviewed_snapshot_fallback",
      canonicalSnapshotHash: "reviewed:snapshot:hash",
    },
  });

  const response = await POST(
    makeRequest({
      tenantKey: "meridian-health",
      question: "What is on screen?",
      expectedRecordSource: {
        kind: "reviewed_snapshot_fallback",
        canonicalSnapshotHash: "reviewed:snapshot:hash",
      },
    }),
  );

  const json = await response.json();
  expect(response.status).toBe(200);
  expect(json.recordSource).toEqual({
    kind: "reviewed_snapshot_fallback",
    canonicalSnapshotHash: "reviewed:snapshot:hash",
  });
});

it("uses the reviewed bundle when the page selected the legacy provider", async () => {
  process.env.ECL_PRODUCT_ALLOW_LEGACY_QUERY_OVERRIDE = "true";
  const reviewed = homeBundle();
  reviewed.provenance.canonical_snapshot_hash = "reviewed:snapshot:hash";
  mockedGetHomeReviewBundle.mockReturnValueOnce(reviewed);

  const response = await POST(
    makeRequest({
      tenantKey: "meridian-health",
      question: "What is on screen?",
      requestedProvider: "legacy",
      expectedRecordSource: {
        kind: "reviewed_snapshot",
        canonicalSnapshotHash: "reviewed:snapshot:hash",
      },
    }),
  );

  expect(response.status).toBe(200);
  expect(mockedResolveBundle).not.toHaveBeenCalled();
  expect(mockedAnswerHomeAvaQuestion).toHaveBeenCalledWith(
    expect.objectContaining({ bundle: reviewed }),
  );
  expect((await response.json()).recordSource.kind).toBe("reviewed_snapshot");
});

it("refuses to answer if the projection content changed without a row-count change", async () => {
  const expected = liveRecordSource();
  expected.contextVersion = {
    ...expected.contextVersion!,
    projectionContentHash: "projection-content-before",
  };

  const response = await POST(
    makeRequest({
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed?",
      expectedRecordSource: expected,
    }),
  );

  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: "home_context_changed" });
  expect(mockedAnswerHomeAvaQuestion).not.toHaveBeenCalled();
});

it("requires the rendered record marker before answering", async () => {
  const response = await POST(
    makeRequest({
      tenantKey: "meridian-health",
      question: "Where are we commercially exposed?",
    }),
  );

  expect(response.status).toBe(400);
  expect(mockedResolveBundle).not.toHaveBeenCalled();
  expect(mockedAnswerHomeAvaQuestion).not.toHaveBeenCalled();
});
