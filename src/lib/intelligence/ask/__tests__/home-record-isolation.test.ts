jest.mock("server-only", () => ({}));
jest.mock("../classifier", () => ({
  classifyIntent: jest.fn(async () => ({
    intent: "general_synthesis",
    entities: [],
    confidence: 0.8,
  })),
}));
jest.mock("../router", () => ({
  route: jest.fn(async () => ({
    sources: [
      {
        type: "PATTERN",
        id: "reference-pattern",
        name: "Reference approach",
        detail: "Test process ownership before choosing an approach.",
        confidence: 0.5,
      },
      {
        type: "TENANT",
        id: "other-version",
        name: "Another assessment",
        detail: "WRONG_RECORD_SECRET",
        confidence: 0.5,
      },
    ],
  })),
}));
jest.mock("../synthesizer", () => ({
  isExplicitConciseAsk: jest.fn(() => false),
  synthesizeStream: jest.fn(async function* () {
    yield "Validate recorded workflow constraints before choosing an approach.";
  }),
  chunkAskText: (text: string) => [text],
}));
jest.mock("../followups", () => ({
  generateFollowups: jest.fn(async () => []),
  normalizeGeneratedFollowup: (text: string) => text,
}));
jest.mock("../retrievers/worldview", () => ({
  retrieveWorldview: jest.fn(async () => ({ sources: [] })),
}));
jest.mock("../retrievers/surface-context", () => ({
  retrieveSurfaceContextSources: jest.fn(),
}));
jest.mock("../retrievers/ecl-serving-context", () => ({
  retrieveEclServingContextSources: jest.fn(),
  isEclProjectionProvider: jest.fn(() => false),
}));
jest.mock("../retrievers/curated-dossier", () => ({
  retrieveCuratedDossierSources: jest.fn(),
}));
jest.mock("../retrievers/retail-overlay", () => ({
  retrieveRetailOverlaySources: jest.fn(),
}));
jest.mock("@/lib/knowledge/tenant-enterprise-context", () => ({
  retrieveTenantEnterpriseSources: jest.fn(),
  retrieveTenantStructuredFacts: jest.fn(),
}));
jest.mock("@/lib/knowledge/tenant-technology-context", () => ({
  retrieveTenantTechnologySources: jest.fn(),
}));
jest.mock("../canonical-landscape-source", () => ({
  buildCanonicalLandscapeSource: jest.fn(),
}));
jest.mock("../tenant-fact-fingerprint", () => ({
  getTenantFactFingerprint: jest.fn(),
  formatTenantFactAvailabilityBlock: jest.fn(),
}));

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { askIntelligence } from "../index";
import { classifyIntent } from "../classifier";
import { synthesizeStream } from "../synthesizer";
import { retrieveSurfaceContextSources } from "../retrievers/surface-context";
import { retrieveEclServingContextSources } from "../retrievers/ecl-serving-context";
import { retrieveCuratedDossierSources } from "../retrievers/curated-dossier";
import { retrieveRetailOverlaySources } from "../retrievers/retail-overlay";
import {
  retrieveTenantEnterpriseSources,
  retrieveTenantStructuredFacts,
} from "@/lib/knowledge/tenant-enterprise-context";
import { retrieveTenantTechnologySources } from "@/lib/knowledge/tenant-technology-context";
import { buildCanonicalLandscapeSource } from "../canonical-landscape-source";
import { getTenantFactFingerprint } from "../tenant-fact-fingerprint";

const tenantKey = CANONICAL_TENANT_KEYS[0];
const homeRecordContext = {
  tenantKey,
  recordToken: "a".repeat(64),
  sources: [
    {
      type: "TENANT" as const,
      id: "selected-home-evidence",
      name: "Recorded Home evidence",
      detail:
        "SELECTED_RECORD_MARKER: recorded ownership gaps need validation.",
      confidence: 0.5,
    },
  ],
};

beforeEach(() => jest.clearAllMocks());

it("uses selected Home facts and industry references, never another tenant assessment or prior conversation", async () => {
  const events = [];
  for await (const event of askIntelligence(
    "Which approach should we validate first?",
    {
      tenantId: "test-tenant",
      tenantInventoryKey: tenantKey,
      modelAuthoredOutput: true,
      homeRecordContext,
      conversationContextBlock: "PRIOR_RECORD_SECRET",
      surfaceContext: {
        activeTab: "intelligence",
        facts: ["CLIENT_FACT_SECRET"],
      },
    },
  ))
    events.push(event);
  expect(events.some((event) => event.type === "error")).toBe(false);
  expect(events.some((event) => event.type === "done")).toBe(true);
  expect(synthesizeStream).toHaveBeenCalledTimes(1);
  const input = (synthesizeStream as jest.Mock).mock.calls[0][0];
  expect(JSON.stringify(input.sources)).toContain("SELECTED_RECORD_MARKER");
  expect(JSON.stringify(input.sources)).toContain(
    "Industry/reference context only",
  );
  expect(JSON.stringify(input)).not.toContain("SECRET");
  for (const reader of [
    retrieveSurfaceContextSources,
    retrieveEclServingContextSources,
    retrieveCuratedDossierSources,
    retrieveRetailOverlaySources,
    retrieveTenantEnterpriseSources,
    retrieveTenantStructuredFacts,
    retrieveTenantTechnologySources,
    buildCanonicalLandscapeSource,
    getTenantFactFingerprint,
  ])
    expect(reader).not.toHaveBeenCalled();
});

it("refuses a cross-tenant or non-executive handoff before classification or model work", async () => {
  for (const options of [
    { tenantInventoryKey: "another-enterprise", modelAuthoredOutput: true },
    { tenantInventoryKey: tenantKey, modelAuthoredOutput: false },
  ]) {
    const events = [];
    for await (const event of askIntelligence("Which approach fits?", {
      ...options,
      homeRecordContext,
    }))
      events.push(event);
    expect(events.map((event) => event.type)).toEqual(["error"]);
  }
  expect(classifyIntent).not.toHaveBeenCalled();
  expect(synthesizeStream).not.toHaveBeenCalled();
});
