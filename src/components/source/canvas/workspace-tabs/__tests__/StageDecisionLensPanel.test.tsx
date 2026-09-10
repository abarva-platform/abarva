/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
} from "@/lib/source/proposal-intelligence";
import { deriveVendorResponseProfilesFromNormalized } from "@/lib/source/vendor-response-completeness-from-normalized";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";
import { StageDecisionLensPanel } from "../StageDecisionLensPanel";

function eventProfiles() {
  const packages: NormalizedVendorResponsePackage[] = [
    normalizedPackage("accenture", "Accenture"),
    normalizedPackage("cognizant", "Cognizant Technology Solutions"),
  ];
  const profileSet = deriveVendorResponseProfilesFromNormalized({
    packages,
    event: { id: "event-1", name: "Application managed services sourcing" },
    tenantKey: "tenant-a",
  });
  if (!profileSet) throw new Error("Expected normalized profiles");
  return profileSet;
}

function normalizedPackage(
  vendorId: string,
  vendorName: string,
): NormalizedVendorResponsePackage {
  return {
    artifactId: `${vendorId}-response`,
    originalName: `${vendorId}-response.xlsx`,
    receivedAt: "2026-09-09T00:00:00.000Z",
    vendorId,
    vendorName,
    syntheticDemo: true,
    rows: [
      {
        requirementId: "RFP-COM-001",
        category: "commercial and pricing",
        section: "Commercial response",
        requirement: "Submit a complete pricing workbook.",
        requirementLevel: "Mandatory",
        responseType: "Pricing",
        evidenceRequired: true,
        evaluationCriterionId: "commercial-value",
        responseDisposition: "Exception",
        responseNarrative:
          "Pricing workbook submitted; transition assumptions remain conditional.",
        pricingRef: "Pricing schedule P-1",
        exceptionRef: "Commercial exception CE-1",
        evidenceRefs: ["Pricing schedule P-1"],
        vendorOwner: "Commercial lead",
      },
      {
        requirementId: "RFP-TRN-001",
        category: "transition",
        section: "Transition plan",
        requirement: "Provide transition milestones and accountable owners.",
        requirementLevel: "Scored",
        responseType: "Transition",
        evidenceRequired: true,
        evaluationCriterionId: "transition-readiness",
        responseDisposition: "Comply",
        responseNarrative:
          "A 16-week transition with weekly governance is proposed.",
        evidenceRefs: ["Transition plan T-1"],
        vendorOwner: "Transition lead",
      },
    ],
    analytics: {
      requirementCount: 2,
      requirementCoverageScore: 100,
      mandatoryCompletenessScore: 100,
      evidenceCoverageScore: 100,
      pricingTraceabilityScore: 100,
      slaTraceabilityScore: 0,
      exceptionDisclosureScore: 100,
      criterionLinkageScore: 100,
      readyForEvaluation: "conditional",
      nonConformances: ["Mandatory pricing exception remains open."],
      clarificationQuestions: ["Resolve transition pricing assumptions."],
    },
    parserWarnings: [],
  };
}

describe("StageDecisionLensPanel", () => {
  it("renders only event response vendors and withholds missing pricing", () => {
    render(
      <StageDecisionLensPanel stage="pricing" profileSet={eventProfiles()} />,
    );

    expect(screen.getByTestId("source-stage-decision-lens")).toHaveTextContent(
      "Compare what vendors actually submitted",
    );
    expect(
      screen.getByTestId("source-pricing-completeness-summary"),
    ).toHaveTextContent("0/2");
    expect(screen.getByText("Accenture")).toBeInTheDocument();
    expect(
      screen.getByText("Cognizant Technology Solutions"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Not established")).toHaveLength(6);
    expect(screen.queryByText("Vendor A")).not.toBeInTheDocument();
    expect(screen.queryByText("$2.1M")).not.toBeInTheDocument();
    expect(screen.getByTestId("source-stage-decision-lens")).toHaveTextContent(
      "No sample vendors, modeled bid medians, or savings amounts",
    );
  });

  it("fails closed when pricing has no normalized response profiles", () => {
    render(<StageDecisionLensPanel stage="pricing" profileSet={null} />);

    expect(
      screen.getByTestId("source-stage-decision-lens-empty"),
    ).toHaveTextContent(
      "sample vendors and fixture bids are never substituted",
    );
  });

  it("uses the event evaluation decision for selection", () => {
    const profileSet = eventProfiles();
    const challenges = buildVendorChallengeIntelligence(profileSet);
    const bafo = buildVendorBafoInstructionPack(challenges);
    const decision = buildVendorEvaluationDecisionView(
      profileSet,
      challenges,
      bafo,
    );

    render(
      <StageDecisionLensPanel
        stage="selection"
        profileSet={profileSet}
        decisionView={decision}
      />,
    );

    expect(screen.getByText("Accenture")).toBeInTheDocument();
    expect(
      screen.getByText("Cognizant Technology Solutions"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Vendor A")).not.toBeInTheDocument();
  });

  it("renders proposal commitments with a transition-readiness guardrail", () => {
    render(
      <StageDecisionLensPanel
        stage="transition"
        profileSet={eventProfiles()}
      />,
    );

    expect(screen.getByTestId("source-stage-decision-lens")).toHaveTextContent(
      "Proposal commitments are not execution readiness",
    );
    expect(screen.getByTestId("source-stage-decision-lens")).toHaveTextContent(
      "accepted transition packet and approval record",
    );
    expect(screen.getByTestId("source-stage-decision-lens")).not.toHaveTextContent(
      "readiness remains blocked",
    );
    expect(screen.getByText("Accenture")).toBeInTheDocument();
  });

  it("does not render on non-decision-lens stages", () => {
    const { container } = render(<StageDecisionLensPanel stage="scope" />);
    expect(container).toBeEmptyDOMElement();
  });
});
