import type { NextRequest } from "next/server";

import { POST } from "../route";
import { answerHomeAvaQuestion } from "@/lib/home/preview/ava-answer";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "@/lib/home/preview/ecl-projection-bundle";
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
  };
}

beforeEach(() => {
  jest.clearAllMocks();
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
    }),
  );

  const json = await response.json();
  expect(response.status).toBe(200);
  expect(json.recordSource).toEqual({
    kind: "reviewed_snapshot_fallback",
    canonicalSnapshotHash: "reviewed:snapshot:hash",
  });
});
