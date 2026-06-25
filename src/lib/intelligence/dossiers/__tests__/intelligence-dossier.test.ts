jest.mock("server-only", () => ({}));

import { buildIntelligenceDossier, routeIntelligenceQuestion } from "@/lib/intelligence/dossiers";
import { formatIntelligenceDossierForPrompt } from "@/lib/intelligence/compose-intelligence-answer";
import type { AskSource, IntentClassification } from "@/lib/intelligence/ask/types";

const classification: IntentClassification = {
  intent: "general_synthesis",
  entities: ["AI", "operations"],
  confidence: 82,
};

const sources: AskSource[] = [
  {
    type: "TENANT",
    name: "SkyHarbor loaded initiative evidence",
    id: "tenant-init-1",
    detail:
      "Loaded tenant evidence: MRO predictive maintenance has certified operational loop; IROPS recovery depends on mainframe API exposure and customer identity readiness.",
    confidence: 0.91,
  },
  {
    type: "SURFACE",
    name: "SkyHarbor live Intelligence surface",
    id: "surface-1",
    detail:
      "Surface facts: four AI initiatives are loaded with maturity, owner, value, and gate status fields visible.",
    confidence: 0.99,
    structured: {
      tables: [
        {
          id: "initiatives",
          title: "Initiatives",
          columns: [{ key: "name", label: "Name" }],
          rows: [{ name: "MRO predictive maintenance" }],
        },
      ],
    },
  },
  {
    type: "PATTERN",
    name: "Airline operational AI sequencing pattern",
    id: "pattern-airline-ops",
    detail:
      "Airline operations pattern: scale bounded operational loops before write-back-heavy disruption recovery automation.",
    confidence: 0.84,
  },
  {
    type: "WORLDVIEW",
    name: "Airline AI market context",
    id: "worldview-airline-ai",
    detail:
      "Worldview context: irregular operations automation needs strong data freshness, integration, and human escalation controls.",
    confidence: 0.72,
  },
];

describe("Intelligence dossier framework", () => {
  it("routes advisory investment questions to a decision-grade intent", () => {
    const route = routeIntelligenceQuestion({
      tenantKey: "skyharbor-air",
      question: "Where should this enterprise invest next in AI?",
    });

    expect(route.intelligenceIntent).toBe("investment_prioritization");
    expect(route.decisionFrameRequired).toBe(true);
    expect(route.expectedArtifacts).toContain("option_matrix");
    expect(route.handoffTargets).toContain("moves");
  });

  it("builds a bounded advisory packet with separated tenant, corpus, and expert sections", () => {
    const dossier = buildIntelligenceDossier({
      tenantKey: "skyharbor-air",
      tenantName: "SkyHarbor Air",
      question: "Which AI initiatives should be scaled, held, or stopped?",
      classification,
      sources,
    });

    expect(dossier.tenantEvidenceDossier.confidence).toBe("partial");
    expect(dossier.tenantEvidenceDossier.sections.length).toBeGreaterThan(0);
    expect(dossier.corpusPatternDossier.patternsIncluded.length).toBe(1);
    expect(dossier.expertCouncilDossier.selectedExperts.length).toBeGreaterThan(0);
    expect(dossier.expertCouncilDossier.selectedExperts.length).toBeLessThanOrEqual(7);
    expect(dossier.decisionOptionsDossier.options.length).toBeGreaterThanOrEqual(3);
    expect(dossier.evidenceBoundary.tenantFacts.join(" ")).toContain("Loaded tenant evidence");
    expect(dossier.evidenceBoundary.corpusPatterns.join(" ")).toContain("Airline operations pattern");
  });

  it("formats Claude context as a bounded dossier rather than raw dumps", () => {
    const dossier = buildIntelligenceDossier({
      tenantKey: "skyharbor-air",
      tenantName: "SkyHarbor Air",
      question: "Which AI initiatives should be scaled, held, or stopped?",
      classification,
      sources,
    });
    const prompt = formatIntelligenceDossierForPrompt(dossier);

    expect(prompt).toContain("INTELLIGENCE DOSSIER");
    expect(prompt).toContain("Tenant evidence — use as proof");
    expect(prompt).toContain("Corpus patterns — use as precedent/comparison");
    expect(prompt).toContain("Expert council — synthesize these lenses");
    expect(prompt).toContain("Do not say corpus evidence is tenant fact.");
    expect(prompt).not.toContain("all 200");
  });

  it("names missing tenant evidence instead of hiding thin evidence", () => {
    const dossier = buildIntelligenceDossier({
      tenantKey: "lakeshore-industries",
      tenantName: "Lakeshore Industries",
      question: "What is the exact ROI for ITSM automation?",
      classification,
      sources: [
        {
          type: "PATTERN",
          name: "ITSM automation pattern",
          id: "itsm-pattern",
          detail: "ITSM automation pattern: handle repetitive tickets only when queue and resolution data exists.",
          confidence: 0.8,
        },
      ],
    });

    expect(dossier.tenantEvidenceDossier.confidence).toBe("thin");
    expect(dossier.qualityFlags).toContain("no_tenant_evidence");
    expect(dossier.evidenceBoundary.cannotConclude.join(" ")).toContain("Exact ROI");
  });
});
