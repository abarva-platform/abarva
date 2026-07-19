import {
  buildClientGroundingPacketSource,
  isClientGroundingQuestion,
} from "../client-grounding-packet";
import type { AskSource } from "../types";

function source(name: string, detail: string): AskSource {
  return {
    type: "TENANT",
    name,
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    detail,
    confidence: 0.84,
  };
}

describe("client grounding packet", () => {
  it("detects AI strategy and use-case questions that need client grounding", () => {
    expect(
      isClientGroundingQuestion(
        "Should Meridian prioritize AI agent assist in the contact center?",
      ),
    ).toBe(true);
    expect(
      isClientGroundingQuestion(
        "What are the industry AI trends and where should we invest?",
      ),
    ).toBe(true);
    expect(isClientGroundingQuestion("What is your name?")).toBe(false);
  });

  it("assembles one client-specific packet from active V7 and suppressed legacy sources", () => {
    const packet = buildClientGroundingPacketSource({
      query:
        "Should Healthcare Demo prioritize AI agent assist for member service?",
      tenantKey: "meridian",
      tenantName: "Healthcare Demo",
      sources: [
        source(
          "Healthcare Demo active context dossier",
          "Healthcare Demo has a readback-validated active enterprise context pack. Boundary: demo-depth planning context until client validated.",
        ),
        source(
          "AI initiatives",
          "Member Service Agent Assist — production status: candidate; data readiness: weak; model risk tier: medium; decision needed: validate interaction data, escalation model, and claims-status access.",
        ),
        source(
          "Loaded context chunks matching the question",
          "Executive interview signal: contact-center optimization is a top candidate priority, but owners want proof of deflection, quality, and escalation safety before funding.",
        ),
        source(
          "Applications and systems",
          "Contact center CRM, telephony, claims marts, knowledge base, and service case management support the member service workflow.",
        ),
        source(
          "Operational process evidence",
          "Member intake and resolution show process bottlenecks around claims-status lookup, prior authorization status, and handoff escalation.",
        ),
        source(
          "Org ownership and decision rights",
          "Business owner: VP Member Services. Technology owner: CIO delegate. Budget authority requires CFO and CIO approval for production expansion.",
        ),
        source(
          "External benchmark and market corpus",
          "Healthcare agent-assist benchmarks show ambient clinical AI has faster adoption than claims lakehouse AI; apply only as industry pattern, not tenant fact.",
        ),
      ],
    });

    expect(packet).toEqual(
      expect.objectContaining({
        type: "TENANT",
        name: "Client grounding packet (Healthcare Demo)",
        id: "meridian:client-grounding-packet",
      }),
    );
    expect(packet?.detail).toMatch(/CLIENT GROUNDING PACKET/i);
    expect(packet?.detail).toMatch(/CXO specificity checklist/i);
    expect(packet?.detail).toMatch(/Executive interview/i);
    expect(packet?.detail).toMatch(/Contact center CRM/i);
    expect(packet?.detail).toMatch(/claims-status lookup/i);
    expect(packet?.detail).toMatch(/CFO and CIO approval/i);
    expect(packet?.detail).toMatch(/industry pattern/i);
    expect(packet?.detail).toMatch(/separate tenant-loaded facts/i);
  });
});
