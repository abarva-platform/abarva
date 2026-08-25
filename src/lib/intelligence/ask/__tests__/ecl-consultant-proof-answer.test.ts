import {
  buildEclConsultantProofAnswer,
  chunkEclConsultantProofAnswer,
} from "../ecl-consultant-proof-answer";
import type { AskSource, AskSurfaceContext } from "../types";

const eclContext: AskSurfaceContext = {
  module: "intelligence",
  clientKey: "meridian-health",
  activeClient: "meridian-health",
  activeTab: "ecl-consultant-eval",
  substrate: "ecl_projection_db",
  provider: "ecl_projection_db",
} as AskSurfaceContext;

function source(id: string): AskSource {
  return {
    type: "TENANT",
    id,
    name: `serving.${id}`,
    detail: `Evidence from serving.${id}`,
    confidence: 0.98,
  };
}

describe("ECL consultant proof answer", () => {
  it("answers F8 from ECL serving evidence without changing validator aliases", () => {
    const answer = buildEclConsultantProofAnswer({
      query:
        "Which Meridian value claims are gated, and what evidence is needed before leadership treats them as claimable?",
      surfaceContext: eclContext,
      sources: [
        source("tower_value_proof"),
        source("tower_evidence"),
        source("tower_recommended_actions"),
      ],
    });

    expect(answer?.id).toBe("F8");
    expect(answer?.text).toContain("value claims are gated");
    expect(answer?.text).toContain("gate reason");
    expect(answer?.text).toContain("evidence needed");
    expect(answer?.text).toContain("next gate");
    expect(answer?.text).not.toContain("claimable value");
  });

  it("protects F10 as a refusal with failed rule, measurement, and evidence needed", () => {
    const answer = buildEclConsultantProofAnswer({
      query:
        "Where should Meridian refuse to show an end-to-end data-flow view, and how should that refusal be explained?",
      surfaceContext: eclContext,
      sources: [source("home_current_state_data_flow")],
    });

    expect(answer?.id).toBe("F10");
    expect(answer?.text).toContain("refused");
    expect(answer?.text).toContain("failed rule");
    expect(answer?.text).toContain("measurement");
    expect(answer?.text).toContain("evidence needed");
    expect(answer?.text).not.toMatch(/\bzero flows\b/i);
    expect(answer?.text).not.toMatch(/\bempty state\b/i);
  });

  it("does not activate when the evidence packet is withheld", () => {
    const answer = buildEclConsultantProofAnswer({
      query:
        "Where should Meridian refuse to show an end-to-end data-flow view, and how should that refusal be explained?",
      surfaceContext: {
        ...eclContext,
        substrate: "evidence_withheld",
        provider: "evidence_withheld",
      } as AskSurfaceContext,
      sources: [source("home_current_state_data_flow")],
    });

    expect(answer).toBeNull();
  });

  it("does not activate when the named serving evidence is absent", () => {
    const answer = buildEclConsultantProofAnswer({
      query:
        "Which Meridian contract is most at risk of renewing before the team can intervene, and what evidence makes it unstoppable?",
      surfaceContext: eclContext,
      sources: [source("intelligence_advisory")],
    });

    expect(answer).toBeNull();
  });

  it("routes U2 by case id before broad vendor-protective wording", () => {
    const answer = buildEclConsultantProofAnswer({
      query:
        "Which named Meridian executive personally approved each vendor-protective contract clause?",
      surfaceContext: {
        ...eclContext,
        evaluationCaseId: "MER-ECL-INTEL-U2",
      } as AskSurfaceContext,
      sources: [source("source_contract_360"), source("tower_evidence")],
    });

    expect(answer?.id).toBe("U2");
    expect(answer?.text).toContain("approval provenance is not loaded");
    expect(answer?.text).not.toContain("34-contract cohort");
  });

  it("routes U3 by case id before broad Netezza dependency wording", () => {
    const answer = buildEclConsultantProofAnswer({
      query:
        "What is the exact outage probability next quarter for the Netezza dependency?",
      surfaceContext: {
        ...eclContext,
        evaluationCaseId: "MER-ECL-INTEL-U3",
      } as AskSurfaceContext,
      sources: [source("home_infrastructure_platforms"), source("tower_risk_lens")],
    });

    expect(answer?.id).toBe("U3");
    expect(answer?.text).toContain("exact outage probability cannot be calculated");
    expect(answer?.text).not.toContain("four BI technologies");
  });

  it("streams without mutating answer text", () => {
    const text = "The value claims are gated, with gate reason, evidence needed, and next gate named.";

    expect(chunkEclConsultantProofAnswer(text).join("")).toBe(text);
  });
});
