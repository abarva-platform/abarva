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
    const html = renderToStaticMarkup(<VerdictPanel view={fixtureView()} />);
    expect(html).toContain("The loaded claims project");
    expect(html).toContain("cleared the reporting gate in the loaded months");
    expect(html).toContain("Amount hidden until it matches the current source files");
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
    expect(html).toContain("Pipeline field gaps (ops)");
    expect(html).toContain("Separate, overlapping populations");
    expect(html).not.toContain("rows, both ways");
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
    expect(html).toContain("its value remains unknown");
    expect(html).toContain("No value claims are loaded for this comparison");
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
    expect(html).toContain("Value cleared for reporting is not loaded");
    expect(html).not.toContain("$0 has cleared reporting");
  });
});
