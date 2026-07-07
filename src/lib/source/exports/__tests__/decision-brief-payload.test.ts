import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import { buildNarrativeHtml } from "../renderers/narrative-html";
import { DECISION_BRIEF_DOCX_CONFIG } from "../renderers/narrative-docx";
import {
  buildDecisionBriefPayloadFromContext,
  buildEvaluationDecisionBriefMarkdown,
  DECISION_BRIEF_FORBIDDEN_PATTERNS,
  DECISION_BRIEF_REQUIRED_SECTIONS,
} from "../payloads/decision-brief-payload";
import { buildNarrativeDocxPayloadFromContext } from "../payloads/narrative-docx-payload";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";

function makeContext(
  overrides: Partial<SourceGenerationContext> = {},
): SourceGenerationContext {
  return {
    tenantKey: "skyharbor-air",
    tenantName: "Airline Demo",
    event: {
      id: "76a42ef7-ce5b-4e7c-a540-2f73cebb730f",
      code: "SKYH-NORMALIZE-THE-SECTIONED-2026",
      name: "SKYH-NORMALIZE-THE-SECTIONED-2026",
      archetype: "outsourcing",
      classifiedCategory: "application_management_services",
      rigor: "strategic",
      currentStageKey: "evaluation",
      statusLabel: "active",
      owner: "Steward sign-off",
      triggerDescription: null,
      scopeDescription: null,
      estimatedValueUsd: null,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
    ...overrides,
  };
}

function expectNoForbiddenTerms(text: string): void {
  const hits = DECISION_BRIEF_FORBIDDEN_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).map((pattern) => pattern.source);
  expect(hits).toEqual([]);
}

describe("Source decision brief export payload", () => {
  it("builds an authored D24 decision brief from the evaluation view, not the scaffold", () => {
    const payload = buildDecisionBriefPayloadFromContext(
      makeContext(),
      "2026-07-01T12:00:00.000Z",
    );

    expect(payload.bodyIsAuthored).toBe(true);
    expect(payload.tenantName).toBe("Aviation Client");
    expect(payload.eventCode).toBe("SKYH-AMS-RFP-2026");
    expect(payload.eventName).toBe("AMS RFP Decision Brief");
    expect(payload.body).toContain("AMS RFP Decision Brief");
    expect(payload.body).toContain("Vendor comparison, BAFO posture");
    expect(payload.body).toContain("> **Recommendation:**");
    expect(payload.body).toContain("### Vendor A");
    expect(payload.body).toContain("### Vendor B");
    expect(payload.body).toContain("### Vendor C");
    expect(payload.body).toContain("Scorecard rationale:");
    expect(payload.body).toContain("> **Decision required:**");
    expect(payload.body).not.toContain("Airline Demo");
    for (const section of DECISION_BRIEF_REQUIRED_SECTIONS) {
      expect(payload.body).toContain(`## ${section}`);
    }
    for (const vendor of ["Vendor A", "Vendor B", "Vendor C"]) {
      expect(payload.body).toContain(vendor);
    }
    expectNoForbiddenTerms(payload.body);
  });

  it("routes the generic narrative binder through the D24 decision brief builder", () => {
    const payload = buildNarrativeDocxPayloadFromContext(
      makeContext(),
      "d24_decision_brief",
      "2026-07-01T12:00:00.000Z",
    );

    expect(payload.bodyIsAuthored).toBe(true);
    expect(payload.body).toContain("## Weighted Evaluation Scorecard");
    expect(payload.body).toContain("## Evidence / Source Note");
    expectNoForbiddenTerms(payload.body);
  });

  it("uses the active client and event identity for non-SkyHarbor D24 exports", () => {
    const payload = buildDecisionBriefPayloadFromContext(
      makeContext({
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
        event: {
          ...makeContext().event,
          id: "lake-shared-services-ams-2026",
          code: "LAKE-SHARED-SERVICES-AMS-2026",
          name: "Lakeshore Shared Services AMS Sourcing Event",
          owner: "CIO Office",
        },
      }),
      "2026-07-01T12:00:00.000Z",
    );

    expect(payload.bodyIsAuthored).toBe(true);
    expect(payload.tenantName).toBe("Lakeshore Holdings");
    expect(payload.eventCode).toBe("LAKE-SHARED-SERVICES-AMS-2026");
    expect(payload.eventName).toBe(
      "Lakeshore Shared Services AMS Sourcing Event Decision Brief",
    );
    expect(payload.body).toContain("Prepared for Lakeshore Holdings.");
    expect(payload.body).toContain(
      "# Lakeshore Shared Services AMS Sourcing Event Decision Brief",
    );
    expect(payload.body).not.toContain("Aviation Client");
    expect(payload.body).not.toContain("AMS RFP Decision Brief");
  });

  it("blocks D24 export instead of falling back to a scaffold when no decision view or authored body exists", () => {
    expect(() =>
      buildDecisionBriefPayloadFromContext(
        makeContext({
          tenantName: "Example Client",
          event: {
            ...makeContext().event,
            id: "event-1",
            code: "EXAMPLE-2026",
            name: "Example sourcing event",
            owner: null,
          },
        }),
        "2026-07-01T12:00:00.000Z",
      ),
    ).toThrow("authored evaluation decision content is required");
  });

  it("keeps the rendered HTML companion free of D24 scaffold and internal labels", () => {
    const payload = buildDecisionBriefPayloadFromContext(
      makeContext(),
      "2026-07-01T12:00:00.000Z",
    );
    const html = buildNarrativeHtml(payload, DECISION_BRIEF_DOCX_CONFIG);

    expect(html).toContain("AMS RFP Decision Brief");
    expect(html).toContain("AbarVa Source");
    expectNoForbiddenTerms(html);
  });

  it("generates the brief from the same proposal-intelligence chain as the UI", () => {
    const profiles = buildVendorResponseMveProfiles({
      id: "76a42ef7-ce5b-4e7c-a540-2f73cebb730f",
      code: "SKYH-AMS-RFP-2026",
      name: "SkyHarbor Air AMS Outsourcing RFP",
      accountName: "SkyHarbor Air",
    });
    const challengeIntelligence = buildVendorChallengeIntelligence(profiles);
    const bafoPack = buildVendorBafoInstructionPack(challengeIntelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profiles,
      challengeIntelligence,
      bafoPack,
    );

    expect(profiles).not.toBeNull();
    expect(challengeIntelligence).not.toBeNull();
    expect(bafoPack).not.toBeNull();
    expect(decisionView).not.toBeNull();

    const body = buildEvaluationDecisionBriefMarkdown({
      decisionView: decisionView!,
      challengeIntelligence: challengeIntelligence!,
      bafoPack: bafoPack!,
      profiles: profiles!.profiles,
      generatedAt: "2026-07-01T12:00:00.000Z",
    });

    expect(body).toContain(decisionView!.finalistRecommendation);
    expect(body).toContain("Vendor A");
    expect(body).toContain("Vendor B");
    expect(body).toContain("Vendor C");
    expect(body).toContain("Lead BAFO lane");
    expect(body).toContain("Executive actions:");
    expectNoForbiddenTerms(body);
  });
});
