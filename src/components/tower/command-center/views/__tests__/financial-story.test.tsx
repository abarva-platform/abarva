import { renderToStaticMarkup } from "react-dom/server";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { CommandCenterView } from "../CommandCenterView";
import { EvidenceActionsContractView, ValueProofContractView } from "../ContractTabs";
import { VerdictPanel } from "../VerdictPanel";
import { evidenceGapAmount } from "../evidence-gap-amount";

function fixtureView() {
  const view = buildTowerCommandCenterView(designFixtureMart(), {
    tenantName: "Fixture Tenant",
  });
  if (!view) throw new Error("Fixture Tower view did not build");
  return {
    ...view,
    summary: {
      ...view.summary,
      valueClaimCount: 2,
      outcomeMeasuredClaimCount: 1,
    },
  };
}

describe("Tower financial story boundaries", () => {
  it("separates annual assertions from year-to-date claims and flags unreconciled budget", () => {
    const view = fixtureView();
    const html = renderToStaticMarkup(<VerdictPanel view={{
      ...view,
      summary: { ...view.summary, claimableAmountLoaded: true, claimableClaimCount: 1, claimableUsd: 1_000_000 },
    }} />);
    expect(html).toContain("The loaded benefit claims project");
    expect(html).toContain("is cleared for reporting across loaded benefit claims");
    expect(html).toContain("Approved FY26 AI project funding");
    expect(html).toContain("Not verified");
    expect(html).not.toContain("of asserted value is claimable");
    expect(html).not.toContain("Foundation rows carry no direct value");
  });

  it("uses separate planning and YTD Finance groups without an invented measured ceiling", () => {
    const html = renderToStaticMarkup(
      <CommandCenterView
        view={fixtureView()}
        onOpenGap={() => undefined}
        onGoToFunnel={() => undefined}
        onGoToAi={() => undefined}
        onGoToActions={() => undefined}
      />,
    );
    expect(html).toContain("Planning and adoption evidence");
    expect(html).toContain("Finance review · loaded months");
    expect(html).toContain("Outcome evidence gap");
    expect(html).not.toContain("No benefit|asserted");
    expect(html).not.toContain("evidence-backed ceiling");
    expect(html).not.toContain("of asserted benefit has no measured amount");
  });

  it("states loaded trajectory coverage and keeps usage apart from measured outcomes", () => {
    const view = fixtureView();
    const html = renderToStaticMarkup(
      <ValueProofContractView
        view={{ ...view, valueTrajectory: view.valueTrajectory.slice(0, 1) }}
        onOpenProgram={() => undefined}
      />,
    );
    expect(html).toContain("Quarterly plan and recorded results");
    expect(html).toContain("1 quarter loaded");
    expect(html).toContain("A case can have usage evidence without a measured dollar benefit");
    expect(html).not.toContain("Eight-quarter trajectory");
    expect(html).not.toContain("Not yet proven");
  });

  it("names the AI risk lens and pipeline gaps as distinct populations", () => {
    const html = renderToStaticMarkup(
      <EvidenceActionsContractView
        view={fixtureView()}
        onOpenAction={() => undefined}
        onOpenGap={() => undefined}
      />,
    );
    expect(html).toContain("AI risk lens evidence gaps");
    expect(html).toContain("Records needing source details or proof");
    expect(html).toContain("These groups can overlap; do not add their counts");
    expect(html).not.toContain("rows, both ways");
  });

  it("names three overlapping count bases without adding them or calling review rows missing values", () => {
    const view = fixtureView();
    const firstSourceFollowUp = view.pipelineGaps[0];
    if (!firstSourceFollowUp) throw new Error("Fixture needs a source follow-up");
    const withCounts = {
      ...view,
      unknownSlots: ["detail one", "detail two"],
      pipelineGaps: [
        firstSourceFollowUp,
        { ...firstSourceFollowUp, id: "follow-up-two" },
        { ...firstSourceFollowUp, id: "follow-up-three" },
      ],
      summary: {
        ...view.summary,
        economicReviewQueueCount: 7,
        unknownValueClaimCount: 0,
      },
    };
    const overview = renderToStaticMarkup(
      <CommandCenterView
        view={withCounts}
        onOpenGap={() => undefined}
        onGoToFunnel={() => undefined}
        onGoToAi={() => undefined}
        onGoToActions={() => undefined}
      />,
    );
    expect(overview).toContain("2 Tower details not available");
    expect(overview).toContain("3 records need source details or proof");
    expect(overview).not.toContain("5 Tower projection gaps");

    const proof = renderToStaticMarkup(
      <EvidenceActionsContractView
        view={withCounts}
        onOpenAction={() => undefined}
        onOpenGap={() => undefined}
      />,
    );
    expect(proof).toContain("<strong>7</strong><span>Rows flagged for review</span>");
    expect(proof).toContain("<span>Records needing source details or proof</span><strong>3</strong>");
    expect(proof).toContain("marked gated or blocked before a claim can be reported");
    expect(proof).toContain("its dollar value may already be present");
    expect(proof).not.toContain("Unreviewed economic rows");
    expect(proof).not.toContain("Rows with no known value yet");
  });

  it("renders absent claim amounts as unknown rather than zero", () => {
    const view = fixtureView();
    const html = renderToStaticMarkup(
      <VerdictPanel
        view={{
          ...view,
          summary: {
            ...view.summary,
            valueClaimCount: 0,
            promisedBenefitLoaded: false,
            promisedUsd: 0,
            claimableUsd: 0,
          },
        }}
      />,
    );
    expect(html).toContain("No yearly benefit estimate is loaded");
    expect(html).toContain("No yearly benefit estimate is loaded");
    expect(html).toContain("No yearly case-benefit amounts are loaded for this comparison");
  });

  it("keeps yearly projected benefit separate from Finance-reviewed value in loaded months", () => {
    const gap = fixtureView().gaps[0];
    const amount = {
      ...gap,
      valueAtStakeUsd: 120_000_000,
      promisedValueExposedUsd: 120_000_000,
      validatedValueHeldUsd: 4_000_000,
    };
    expect(evidenceGapAmount({ ...amount, gapStage: "usage" }).label).toBe(
      "Projected yearly benefit affected",
    );
    expect(evidenceGapAmount({ ...amount, gapStage: "claim_gate" }).label).toBe(
      "Finance-reviewed amount held in loaded months",
    );
    expect(evidenceGapAmount({ ...amount, gapStage: "usage" }).value).not.toBe(
      evidenceGapAmount({ ...amount, gapStage: "claim_gate" }).value,
    );
  });

  it("does not turn missing claims into a cleared zero", () => {
    const view = fixtureView();
    const html = renderToStaticMarkup(
      <CommandCenterView
        view={{ ...view, summary: { ...view.summary, valueClaimCount: 0, claimableUsd: 0 } }}
        onOpenGap={() => undefined}
        onGoToFunnel={() => undefined}
        onGoToAi={() => undefined}
        onGoToActions={() => undefined}
      />,
    );
    expect(html).toContain("No benefit claims are loaded, so cleared value is unknown");
    expect(html).not.toContain("$0 has cleared reporting");
  });

  it("shows an unverified cleared amount differently from a recorded zero", () => {
    const view = fixtureView();
    const unknown = renderToStaticMarkup(
      <VerdictPanel view={{
        ...view,
        summary: { ...view.summary, claimableUsd: 0, claimableClaimCount: 0, claimableAmountLoaded: false },
      }} />,
    );
    const recordedZero = renderToStaticMarkup(
      <VerdictPanel view={{
        ...view,
        summary: { ...view.summary, claimableUsd: 0, claimableClaimCount: 0, claimableAmountLoaded: true },
      }} />,
    );
    expect(unknown).toContain("A cleared value amount is not verified");
    expect(unknown).toContain("Not verified");
    expect(recordedZero).toContain("$0.0M is cleared for reporting across loaded benefit claims");
    expect(recordedZero).not.toContain("A cleared value amount is not verified");
  });

  it("does not turn Finance status counts into verified zero-dollar totals", () => {
    const view = fixtureView();
    const summary = {
      ...view.summary,
      financeAttestedClaimCount: 2,
      financeValidatedUsd: 0,
      financeValidatedAmountLoaded: undefined,
      claimableClaimCount: 1,
      claimableUsd: 0,
      claimableAmountLoaded: undefined,
    };
    const verdict = renderToStaticMarkup(<VerdictPanel view={{ ...view, summary }} />);
    const contract = renderToStaticMarkup(<CommandCenterView
      view={{ ...view, summary }}
      onOpenGap={() => undefined}
      onGoToFunnel={() => undefined}
      onGoToAi={() => undefined}
      onGoToActions={() => undefined}
    />);
    const proof = renderToStaticMarkup(<ValueProofContractView
      view={{ ...view, summary }}
      onOpenProgram={() => undefined}
    />);

    expect(verdict).toContain("A cleared value amount is not verified for the loaded months");
    expect(verdict).not.toContain("$0.0M is cleared for reporting");
    expect(contract).toContain("A cleared amount is not verified for the loaded months");
    expect(contract).toMatch(/Finance validated<\/span><strong[^>]*>Not verified<\/strong>/);
    expect(contract).not.toContain("$0.0M cleared for reporting in loaded months");
    expect(proof).toContain("Cleared amount not verified");
    expect(proof).not.toContain("$0.0M cleared for reporting in loaded months");
  });

  it("withholds the Finance-case estimate when case status or yearly estimates are missing", () => {
    const view = fixtureView();
    const cases = view.allInitiatives
      .filter((item) => item.populationKind === "ai_case")
      .map((item) => ({ ...item, financeStatus: null, promisedBenefitLoaded: false, promisedUsd: 0 }));
    const html = renderToStaticMarkup(<VerdictPanel view={{
      ...view,
      allInitiatives: cases,
      summary: { ...view.summary, promisedBenefitLoaded: true, promisedUsd: 12_000_000 },
    }} />);

    expect(cases.length).toBeGreaterThan(0);
    expect(html).toContain("No complete yearly estimate is loaded for Finance-validated AI cases, so that comparison is withheld");
    expect(html).not.toContain("Estimate on Finance-reviewed cases");
    expect(html).not.toContain("$0.0M</text>");
  });

  it("shows zero claim coverage as an empty bar", () => {
    const view = fixtureView();
    const html = renderToStaticMarkup(<ValueProofContractView
      view={{ ...view, summary: { ...view.summary, valueClaimCount: 2, baselineLinkedClaimCount: 0 } }}
      onOpenProgram={() => undefined}
    />);

    expect(html).toMatch(/Baseline linked<\/span><div[^>]*><i[^>]*style="width:0%"/);
    expect(html).not.toMatch(/Baseline linked<\/span><div[^>]*><i[^>]*style="width:2%"/);
  });
});
