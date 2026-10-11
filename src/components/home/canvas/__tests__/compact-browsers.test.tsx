/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { RecordBrowser } from "../../v4/RecordBrowser";
import { BrowseTheData } from "../../preview/BrowseTheData";

const bundle: HomeReviewBundle = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      "src/lib/home/preview/golden-snapshots/meridian-health.json",
    ),
    "utf8",
  ),
);
const family = bundle.technologyEstate!.recordTypes.find(
  (record) => record.objectType === "application_system",
)!;

describe("preview-only compact evidence browsers", () => {
  it("makes every record accessible through pages without a second page title", () => {
    const { container } = render(
      <RecordBrowser recordType={family} presentation="canvas" />,
    );
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-records] tbody tr")).toHaveLength(
      20,
    );
    let total = 20;
    while (
      !(
        screen.getByRole("button", {
          name: "Next record page",
        }) as HTMLButtonElement
      ).disabled
    ) {
      fireEvent.click(screen.getByRole("button", { name: "Next record page" }));
      total += container.querySelectorAll("[data-records] tbody tr").length;
    }
    expect(total).toBe(family.rows.length);
  });
  it("resets to the first page on filtering and does not show a nonmatching detail", () => {
    const { container } = render(
      <RecordBrowser recordType={family} presentation="canvas" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next record page" }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "no-such-record-987654321" },
    });
    expect(container.querySelectorAll("[data-records] tbody tr")).toHaveLength(
      0,
    );
    expect(screen.queryByText("Selected record")).not.toBeInTheDocument();
  });
  it("keeps the current dossier browser at its existing presentation", () => {
    const { container } = render(<RecordBrowser recordType={family} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(container.querySelectorAll("[data-records] tbody tr")).toHaveLength(
      120,
    );
    expect(
      screen.queryByRole("button", { name: "Next record page" }),
    ).not.toBeInTheDocument();
  });
  it("makes all context facts accessible and retains selected evidence", () => {
    const { container } = render(
      <BrowseTheData
        signalPacket={bundle.thesis.signalPacket}
        presentation="canvas"
      />,
    );
    const totalFacts =
      bundle.thesis.signalPacket.signals.length +
      bundle.thesis.signalPacket.contextItems.length;
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    let total = container.querySelectorAll("[data-fact-table] tbody tr").length;
    while (
      !(
        screen.getByRole("button", {
          name: "Next fact page",
        }) as HTMLButtonElement
      ).disabled
    ) {
      fireEvent.click(screen.getByRole("button", { name: "Next fact page" }));
      total += container.querySelectorAll("[data-fact-table] tbody tr").length;
    }
    expect(total).toBe(totalFacts);
  });
  it("shows no unrelated context detail when no facts match", () => {
    render(
      <BrowseTheData
        signalPacket={bundle.thesis.signalPacket}
        presentation="canvas"
      />,
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "no-such-fact-987654321" },
    });
    expect(
      screen.getByText("No facts match the current filters."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Selected signal")).not.toBeInTheDocument();
    expect(screen.queryByText("Selected context fact")).not.toBeInTheDocument();
  });
});
