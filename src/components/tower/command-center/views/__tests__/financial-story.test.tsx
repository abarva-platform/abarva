import { renderToStaticMarkup } from "react-dom/server";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { CommandCenterView } from "../CommandCenterView";
import { EvidenceActionsContractView, ValueProofContractView } from "../ContractTabs";
import { VerdictPanel } from "../VerdictPanel";

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
    expect(html).toContain("annual benefit asserted");
    expect(html).toContain("claimable year to date");
    expect(html).toContain("amount withheld until reconciled");
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
    expect(html).toContain("Finance review · year to date");
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
    expect(html).toContain("Loaded quarterly trajectory");
    expect(html).toContain("1 quarter loaded");
    expect(html).toContain("not a measured financial outcome");
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
    expect(html).toContain("Annual benefit assertion is not loaded");
    expect(html).toContain("its value remains unknown");
    expect(html).toContain("No value claims are loaded for this comparison");
  });
});
