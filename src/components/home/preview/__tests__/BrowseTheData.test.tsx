/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { BrowseTheData } from "../BrowseTheData";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";

describe("BrowseTheData", () => {
  const bundle = getHomeReviewBundle("meridian-health")!;

  it("shows a slice/dice browser with every signal and context item available", () => {
    render(<BrowseTheData signalPacket={bundle.thesis.signalPacket} />);
    const total = bundle.thesis.signalPacket.signals.length + bundle.thesis.signalPacket.contextItems.length;
    expect(screen.getByText("Slice / dice viewer")).toBeInTheDocument();
    expect(screen.getByLabelText("Slice by")).toBeInTheDocument();
    expect(screen.getByLabelText("Dice by")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Fact ID" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Statement" })).toBeInTheDocument();
    const metrics = screen.getByText("facts in packet").closest("section");
    expect(metrics).not.toBeNull();
    expect(within(metrics as HTMLElement).getByText(total.toLocaleString())).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === `${total} of ${total} facts shown`,
      ),
    ).toBeInTheDocument();
  });

  it("narrows results on search text", () => {
    render(<BrowseTheData signalPacket={bundle.thesis.signalPacket} />);
    const target = bundle.thesis.signalPacket.signals[0];
    const searchTerm = target.statement.split(" ").find((w) => w.length > 5) ?? target.statement.slice(0, 8);
    fireEvent.change(screen.getByLabelText("Search facts"), { target: { value: searchTerm } });
    expect(screen.getAllByText(target.statement).length).toBeGreaterThan(0);
  });

  it("shows an honest empty state for a search matching nothing", () => {
    render(<BrowseTheData signalPacket={bundle.thesis.signalPacket} />);
    fireEvent.change(screen.getByLabelText("Search facts"), { target: { value: "zzz_no_such_fact_zzz" } });
    expect(screen.getByText("No facts match the current filters.")).toBeInTheDocument();
  });

  it("narrows by a selected dimension value", () => {
    render(<BrowseTheData signalPacket={bundle.thesis.signalPacket} />);
    fireEvent.change(screen.getByLabelText("Slice value"), { target: { value: "vendor_contract" } });
    expect(screen.getByText((_, element) => element?.textContent === "4 of 114 facts shown")).toBeInTheDocument();
  });

  it("shows source-family coverage when the producer supplies source summaries", () => {
    render(
      <BrowseTheData
        signalPacket={{
          ...bundle.thesis.signalPacket,
          sourceSummaries: [
            {
              sourcePath: "serving.home_applications_systems",
              domain: "application_system",
              objectTypes: ["application_system"],
              recordCount: 750,
              canonicalRecordCount: 750,
              sourceKind: "serving_projection",
              basis: ["deterministic_ecl_projection"],
              authority: ["serving.home_applications_systems"],
              qualityStates: ["projection_row_read"],
              materialFields: ["systemName", "businessFunction", "annualCostUsd"],
              exampleRecords: ["Epic Tapestry"],
            },
            {
              sourcePath: "serving.home_vendor_contracts",
              domain: "vendor_contract",
              objectTypes: ["vendor_contract"],
              recordCount: 230,
              canonicalRecordCount: 230,
              sourceKind: "serving_projection",
              basis: ["deterministic_ecl_projection"],
              authority: ["serving.home_vendor_contracts"],
              qualityStates: ["projection_row_read"],
              materialFields: ["vendorName", "annualSpendUsd"],
              exampleRecords: ["Epic Systems Corporation"],
            },
          ],
        }}
      />,
    );

    expect(screen.getByLabelText("Source family coverage")).toBeInTheDocument();
    expect(screen.getByText("serving.home_applications_systems")).toBeInTheDocument();
    expect(screen.getByText("2 source families · 980 records summarized")).toBeInTheDocument();
    expect(screen.queryByText("Source-file rollup not supplied in this packet")).not.toBeInTheDocument();
  });
});
