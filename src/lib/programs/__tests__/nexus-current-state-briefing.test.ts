import { buildProgramsContextBundle } from "@/lib/programs/programs-broker-adapter";
import {
  buildNexusCurrentStateBriefing,
  serializeNexusCurrentStateBriefing,
} from "@/lib/programs/nexus-current-state-briefing";
import type { ProgramCore, TenancyCtx } from "@/lib/programs/types.db";

const ctx: TenancyCtx = {
  clientId: "client-apex",
  userId: "person-carlos",
  role: "cxo",
  email: "cio@apex-retail.example.com",
};

const program: ProgramCore = {
  id: "move-contact-center-ai-routing",
  clientId: "client-apex",
  name: "Contact Center AI Routing",
  sponsorPersonId: "person-carlos",
  problemStatement:
    "Repeat transfers and repeat contacts are rising across Apex Retail care queues.",
  targetOutcome:
    "Reduce repeat-transfer rate by 25% and seven-day repeat contact by 15%.",
  timelineHorizon: "P3 design review in May 2026.",
  valueProjectedLowUsd: 1800000,
  valueProjectedHighUsd: 3200000,
  valueVerifiedUsd: null,
  valueVerifiedStatus: "pending",
  valueCurrency: "USD",
  valueAssumptions: { basis: "Contact-center baseline" },
  archetype: "ai_product_enablement",
  originSource: "intelligence_promoted",
  originSourceRef: null,
  status: "active",
  lifecycleState: "approved",
  currentPhase: 3,
  currentModuleKey: "p3_traceability_matrix",
  maestroOversightLevel: "full",
  founderApprovalRequired: true,
  phaseLockedAt: null,
  phaseLockedByUserId: null,
  dataResidencyRegion: "us",
  retentionPolicyYears: 7,
  archivedAt: null,
  deletedAt: null,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-09T00:00:00.000Z",
  charter: null,
  functionPackKey: null,
  functionPackConfidence: null,
  gatesPassed: [],
};

function apexCurrentStateBundle() {
  return buildProgramsContextBundle({
    tenantKey: "apex-retail",
    programId: program.id,
    agentName: "Nexus",
    requestedDomains: [
      "people_org",
      "program_lifecycle",
      "system_landscape",
      "vendor_contracts",
      "financials",
      "evidence_provenance",
    ],
  });
}

describe("buildNexusCurrentStateBriefing", () => {
  it("builds a cited CXO current-state brief across org, tech, financials, vendors, and guidance", async () => {
    const briefing = await buildNexusCurrentStateBriefing({
      ctx,
      tenantKey: "apex-retail",
      program,
      generatedAt: "2026-05-09T15:00:00.000Z",
      bundle: apexCurrentStateBundle(),
    });

    expect(briefing.briefingVersion).toBe("nexus-current-state-briefing/v1");
    expect(briefing.executiveRead).toContain("Contact Center AI Routing");
    expect(briefing.move.phaseLabel).toContain("P3");
    expect(briefing.sections.map((section) => section.id)).toEqual([
      "org",
      "programs",
      "technology",
      "vendors",
      "financials",
      "evidence",
      "guidance",
    ]);
    expect(
      briefing.sections.find((section) => section.id === "technology")
        ?.facts[0],
    ).not.toMatch(/^No /);
    expect(
      briefing.sections.find((section) => section.id === "financials")
        ?.facts[0],
    ).not.toMatch(/^No /);
    expect(briefing.citations.length).toBeGreaterThan(0);
  });

  it("answers CXO questions from the matching current-state section with citations", async () => {
    const briefing = await buildNexusCurrentStateBriefing({
      ctx,
      tenantKey: "apex-retail",
      program,
      generatedAt: "2026-05-09T15:00:00.000Z",
      bundle: apexCurrentStateBundle(),
    });

    const orgAnswer = briefing.answerQuestion(
      "Who owns the decision rights for this Move?",
    );
    const techAnswer = briefing.answerQuestion(
      "What systems constrain the design?",
    );
    const dataAnalyticsAnswer = briefing.answerQuestion(
      "Talk to me about current state of data analytics and technologies we have today.",
    );
    const financeAnswer = briefing.answerQuestion(
      "What financial baseline should Carlos trust?",
    );

    expect(orgAnswer.confidence).not.toBe("low");
    expect(orgAnswer.citationIds.length).toBeGreaterThan(0);
    expect(techAnswer.answer).toMatch(
      /system|technology|landscape|dependency/i,
    );
    expect(dataAnalyticsAnswer.answer).toMatch(
      /system|technology|landscape|dependency/i,
    );
    expect(dataAnalyticsAnswer.citationIds.length).toBeGreaterThan(0);
    expect(financeAnswer.answer).toMatch(
      /financial|baseline|value|metric|KPI/i,
    );
  });

  it("serializes without leaking the answer function into API JSON", async () => {
    const briefing = await buildNexusCurrentStateBriefing({
      ctx,
      tenantKey: "apex-retail",
      program,
      generatedAt: "2026-05-09T15:00:00.000Z",
      bundle: apexCurrentStateBundle(),
    });

    const serialized = serializeNexusCurrentStateBriefing(briefing);
    expect("answerQuestion" in serialized).toBe(false);
    expect(serialized.sections.length).toBeGreaterThan(0);
  });
});
