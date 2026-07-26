/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ArtifactBlockerList } from "../ArtifactBlockerList";

describe("ArtifactBlockerList", () => {
  it("renders nothing when there are no blockers", () => {
    const { container } = render(<ArtifactBlockerList blockers={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders every blocker's real detail sentence and short label, not just the first one", () => {
    render(
      <ArtifactBlockerList
        blockers={[
          { code: "not_accepted", detail: "Has not been accepted yet." },
          {
            code: "governance_stage_below_export_minimum",
            detail: "Below the required approval minimum.",
          },
        ]}
        testIdPrefix="export"
      />,
    );
    expect(screen.getByText("Has not been accepted yet.")).toBeInTheDocument();
    expect(
      screen.getByText("Below the required approval minimum."),
    ).toBeInTheDocument();
    expect(screen.getByText("Acceptance")).toBeInTheDocument();
    expect(screen.getByText("Approval")).toBeInTheDocument();
    expect(screen.getByTestId("export-blockers")).toBeInTheDocument();
    expect(
      screen.getByTestId("export-blocker-not_accepted"),
    ).toBeInTheDocument();
  });
});
