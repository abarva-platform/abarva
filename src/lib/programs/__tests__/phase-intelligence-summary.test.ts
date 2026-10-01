import type { TenancyCtx } from "@/lib/programs/types.db";

jest.mock("server-only", () => ({}));

const getThreadForArtifact = jest.fn();
const getDecisionThreadDossier = jest.fn();
const getStrategicMoveById = jest.fn();
const buildGateCriteria = jest.fn();
const loadDiscoveryEvidenceReadiness = jest.fn();

jest.mock("@/lib/decisions/auto-linker", () => ({
  getDecisionThreadDossier: (...args: unknown[]) => getDecisionThreadDossier(...args),
  getThreadForArtifact: (...args: unknown[]) => getThreadForArtifact(...args),
}));

jest.mock("@/lib/programs/queries", () => ({
  getStrategicMoveById: (...args: unknown[]) => getStrategicMoveById(...args),
}));

jest.mock("@/lib/programs/transformers", () => ({
  buildGateCriteria: (...args: unknown[]) => buildGateCriteria(...args),
}));

jest.mock("@/lib/programs/discovery/evidence-readiness", () => ({
  loadDiscoveryEvidenceReadiness: (...args: unknown[]) =>
    loadDiscoveryEvidenceReadiness(...args),
}));

const ctx: TenancyCtx = {
  clientId: "tenant-meridian",
  clientKey: "meridian",
  userId: "user-1",
};

function mockMove(overrides: Record<string, unknown> = {}) {
  return {
    id: "move-1",
    displayCode: "MOVE-1",
    name: "Member Service Agent Assist",
    currentPhase: 2,
    gateCriteria: [
      {
        id: "charter_signed_off",
        label: "Discovery report signed off",
        severity: "hard",
        completed: false,
        verified: true,
      },
      {
        id: "sponsor_assigned",
        label: "Sponsor assigned",
        severity: "hard",
        completed: true,
        verified: true,
      },
      {
        id: "baseline_captured",
        label: "Baseline captured",
        severity: "soft",
        completed: false,
        verified: true,
      },
    ],
    tenant: {
      id: "tenant-meridian",
      name: "Healthcare Demo",
      industryCode: "healthcare_idn",
    },
    charter: { functionPackKey: "member_service_agent_assist" },
    functionPackKey: "member_service_agent_assist",
    phaseLabel: "Discover & Diagnose",
    status: {
      text: "In progress",
      description: "Move is in progress.",
    },
    ...overrides,
  };
}

describe("buildPhaseIntelligenceSummary", () => {
  beforeEach(() => {
    jest.resetModules();
    buildGateCriteria.mockClear();
    getThreadForArtifact.mockResolvedValue({
      id: "thread-1",
      client_id: "tenant-meridian",
      title: "Agent Assist approach",
      status: "decided",
    });
    getDecisionThreadDossier.mockResolvedValue({
      thread: { id: "thread-1", status: "decided", title: "Agent Assist approach" },
      links: [],
      options: [
        {
          label: "Process-only fixes",
          rationale_for: null,
          rationale_against: "Does not address fragmented knowledge retrieval.",
          is_selected: false,
        },
        {
          label: "Governed agent workspace",
          rationale_for: "Best balances productivity, PHI controls, and adoption.",
          rationale_against: null,
          is_selected: true,
        },
      ],
    });
    getStrategicMoveById.mockResolvedValue(mockMove());
    buildGateCriteria.mockResolvedValue([
      {
        id: "g1",
        label: "Evidence attached",
        severity: "hard",
        completed: false,
        verified: true,
      },
      {
        id: "g2",
        label: "Findings approved",
        severity: "hard",
        completed: false,
        verified: true,
      },
    ]);
    loadDiscoveryEvidenceReadiness.mockResolvedValue({
      readinessScore: 50,
      families: [
        {
          familyId: "contact_center_kpis",
          label: "Contact-center KPI baseline",
          required: true,
          status: "covered",
          evidenceTitles: ["KPI baseline"],
        },
        {
          familyId: "member_service_workflow",
          label: "Member-service workflow map",
          required: true,
          status: "missing",
          evidenceTitles: [],
        },
      ],
      gapRegister: [
        {
          familyId: "member_service_workflow",
          likelySource: "Operations lead",
          format: "DOCX",
        },
      ],
    });
  });

  it("uses the workspace gate projection for current-phase intelligence", async () => {
    const { buildPhaseIntelligenceSummary } =
      await import("@/lib/programs/phase-intelligence-summary");

    const summary = await buildPhaseIntelligenceSummary(ctx, {
      moveId: "move-1",
      phase: 2,
    });

    expect(summary.items).toHaveLength(3);
    expect(summary.items[0]).toEqual(
      expect.objectContaining({
        id: "decision",
        title: "Governed agent workspace",
        body: "Best balances productivity, PHI controls, and adoption.",
        href: "/dossier/thread-1",
      }),
    );
    expect(summary.items[1].sourceLabel).toBe("Member-service Agent Assist Function Pack");
    expect(summary.items[1].body).toContain("labeled planning range");
    expect(summary.items[1].body).toContain("not a committed target");
    expect(summary.items[2]).toEqual(
      expect.objectContaining({
        id: "gate_evidence",
        title: "1 hard gate open; 1 required evidence gap.",
        tone: "danger",
      }),
    );
    expect(summary.items[2].facts).toContain("1/2 hard gates met");
    expect(summary.items[2].facts).toContain("1/2 required evidence families covered");
    expect(getThreadForArtifact).toHaveBeenCalledWith(
      "moves",
      "move-1",
      "tenant-meridian",
    );
    expect(buildGateCriteria).not.toHaveBeenCalled();
  });

  it("evaluates a historical phase explicitly instead of borrowing the current gate", async () => {
    getStrategicMoveById.mockResolvedValue(
      mockMove({
        currentPhase: 3,
        gateCriteria: [
          {
            id: "design_approved",
            label: "Current phase gate",
            severity: "hard",
            completed: true,
            verified: true,
          },
        ],
      }),
    );
    buildGateCriteria.mockResolvedValue([
      {
        id: "discovery_report_signed_off",
        label: "Discovery synthesis report signed off",
        severity: "hard",
        completed: false,
        verified: true,
      },
      {
        id: "discovery_baseline_attested",
        label: "Discovery baseline attested",
        severity: "hard",
        completed: true,
        verified: true,
      },
    ]);

    const { buildPhaseIntelligenceSummary } = await import(
      "@/lib/programs/phase-intelligence-summary"
    );
    const summary = await buildPhaseIntelligenceSummary(ctx, {
      moveId: "move-1",
      phase: 2,
    });

    expect(buildGateCriteria).toHaveBeenCalledWith(ctx, "move-1", 2, {
      allowHistoricalPhase: true,
    });
    expect(summary.items[2].facts).toContain("1/2 hard gates met");
    expect(summary.items[2].title).toBe(
      "1 hard gate open; 1 required evidence gap.",
    );
  });

  it("degrades honestly when there is no KDD or function pack binding", async () => {
    getThreadForArtifact.mockResolvedValue(null);
    getStrategicMoveById.mockResolvedValue(
      mockMove({
        tenant: { id: "tenant-x", name: "Unknown", industryCode: null },
        charter: {},
        functionPackKey: null,
      }),
    );
    const { buildPhaseIntelligenceSummary } = await import(
      "@/lib/programs/phase-intelligence-summary"
    );

    const summary = await buildPhaseIntelligenceSummary(ctx, {
      moveId: "move-1",
      phase: 1,
    });

    expect(summary.items[0].title).toBe("No decision record captured yet.");
    expect(summary.items[1].title).toBe("No curated function pack is bound yet.");
    expect(summary.items[1].facts).toContain("Function key: not set");
  });

  it("uses the deterministic classifier as a read-only fallback for legacy Agent Assist moves", async () => {
    getStrategicMoveById.mockResolvedValue(
      mockMove({
        name: "Member Service Agent Assist",
        archetype: "ai_product_enablement",
        charter: {
          businessProblem:
            "Members experience long calls and inconsistent answers because agents navigate claims, eligibility, benefits, prior authorization, CRM history, and policy knowledge across multiple systems.",
          evidencePlan:
            "Member-service metrics, call transcripts, intent taxonomy, CRM history, claims/auth/benefits samples, knowledge base, systems inventory, and security/privacy controls.",
        },
        functionPackKey: null,
      }),
    );
    const { buildPhaseIntelligenceSummary } = await import(
      "@/lib/programs/phase-intelligence-summary"
    );

    const summary = await buildPhaseIntelligenceSummary(ctx, {
      moveId: "move-1",
      phase: 2,
    });

    expect(summary.items[1].sourceLabel).toBe("Member-service Agent Assist Function Pack");
    expect(summary.items[1].facts).toContain("Function key: member_service_agent_assist");
    expect(summary.items[1].facts.join(" ")).toContain(
      "Binding source: deterministic classifier fallback",
    );
  });

  it("binds short legacy Meridian Agent Assist names that use healthcare_provider industry code", async () => {
    getStrategicMoveById.mockResolvedValue(
      mockMove({
        name: "MEMBER AI ASSIST",
        displayCode: "MEMBER AI ASSIST",
        tenant: {
          id: "tenant-meridian",
          name: "Healthcare Demo",
          industryCode: "healthcare_provider",
        },
        charter: null,
        functionPackKey: null,
        status: {
          text: "In progress",
          description: "Current-state discovery for member service AI assist.",
        },
      }),
    );
    const { buildPhaseIntelligenceSummary } = await import(
      "@/lib/programs/phase-intelligence-summary"
    );

    const summary = await buildPhaseIntelligenceSummary(ctx, {
      moveId: "move-1",
      phase: 2,
    });

    expect(summary.items[1].sourceLabel).toBe("Member-service Agent Assist Function Pack");
    expect(summary.items[1].facts).toContain("Function key: member_service_agent_assist");
  });
});
