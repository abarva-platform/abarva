import {
  buildIntelligenceAdvisorComposerBlock,
  chooseAdvisorTokenBudget,
  chooseAdvisorWordCap,
  isAirlineIropsAiRoiQuestion,
  routeIntelligenceAdvisorQuestion,
} from "../../src/lib/intelligence/ask/advisor-composer";
import { chooseSynthesisTokenBudget } from "../../src/lib/intelligence/ask/synthesizer";
import type { AskSource } from "../../src/lib/intelligence/ask/types";

const GOLDEN_QUESTION =
  "What are airlines doing with IROPS? Give me trends and ROI if such AI investments. Charts or tables will be nice.";

const sources: AskSource[] = [
  {
    type: "TENANT",
    name: "SkyHarbor operations technology facts",
    id: "tenant-skyharbor-ops",
    detail:
      "SkyHarbor uses IBM Z, passenger service, crew, baggage, and airport operations systems; IROPS recovery initiative evidence is loaded but realized value is incomplete.",
    confidence: 0.98,
  },
  {
    type: "PATTERN",
    name: "Airline IROPS recovery orchestration pattern",
    id: "airline-irops-pattern",
    detail:
      "Airline AI value concentrates in disruption recovery, passenger reaccommodation, crew recovery, predictive maintenance, and contact-center deflection.",
    confidence: 0.88,
  },
  {
    type: "GRAPH",
    name: "SkyHarbor dependency graph",
    id: "skyharbor-graph",
    detail:
      "Operations Control Center depends on passenger, crew, aircraft, gate, and maintenance event streams.",
    confidence: 0.82,
  },
];

describe("Golden IROPS Intelligence advisor composer", () => {
  it("routes the airline IROPS ROI benchmark to a dedicated advisor route", () => {
    expect(routeIntelligenceAdvisorQuestion(GOLDEN_QUESTION)).toBe(
      "airline_irops_ai_roi",
    );
    expect(isAirlineIropsAiRoiQuestion(GOLDEN_QUESTION)).toBe(true);
    expect(
      routeIntelligenceAdvisorQuestion(
        "What do we know about Apex merchandising spend?",
      ),
    ).toBeNull();
  });

  it("builds a consultant-grade case-team brief for Claude", () => {
    const result = buildIntelligenceAdvisorComposerBlock({
      query: GOLDEN_QUESTION,
      tenantClientKey: "skyharbor-air",
      sources,
      richText: true,
    });

    expect(result).not.toBeNull();
    const prompt = result?.promptBlock ?? "";

    expect(prompt).toContain("Route: airline_irops_ai_roi");
    expect(prompt).toContain("senior airline operations and enterprise-AI consultant");
    expect(prompt).toContain("Use SkyHarbor / tenant read-model facts first");
    expect(prompt).toContain("passenger reaccommodation");
    expect(prompt).toContain("crew, aircraft, gates, maintenance");
    expect(prompt).toContain("named examples table");
    expect(prompt).toContain("ROI / value pool table");
    expect(prompt).toContain("SkyHarbor relevance panel");
    expect(prompt).toContain("crew legality data");
    expect(prompt).toContain("real-time aircraft/crew/passenger event streams");
    expect(prompt).toContain("PSS/DCS/crew/ops integrations");
    expect(prompt).toContain("do not invent named public facts");
    expect(prompt).toContain("Do not start with row counts");
    expect(prompt).toContain("Do not expose raw internal IDs");
    expect(prompt).toContain("Do not fabricate tenant ROI");

    expect(result?.expertNames).toEqual(
      expect.arrayContaining([
        "Airline Operations & Revenue Management Expert",
        "Airline Ground & Airport Operations Expert",
        "Airline Network & Schedule Planning + Commercial Expert",
        "Enterprise Architecture & Technology Strategy Expert",
        "AI Governance & Model Risk Expert",
        "Enterprise Value Office & AI Enablement Expert",
      ]),
    );
    expect(result?.selectedSourceSummary).toMatchObject({
      tenantEvidenceCount: 1,
      corpusEvidenceCount: 1,
      graphEvidenceCount: 1,
    });
  });

  it("widens only the advisor route budget and word cap", () => {
    expect(chooseAdvisorTokenBudget(GOLDEN_QUESTION, 600)).toBe(1800);
    expect(chooseAdvisorWordCap(GOLDEN_QUESTION, 240)).toBe(950);
    expect(chooseSynthesisTokenBudget(GOLDEN_QUESTION)).toBe(1800);

    const ordinary = "What is the current state of our vendors?";
    expect(chooseAdvisorTokenBudget(ordinary, 600)).toBe(600);
    expect(chooseAdvisorWordCap(ordinary, 240)).toBe(240);
    expect(chooseSynthesisTokenBudget(ordinary)).toBe(600);
  });
});
