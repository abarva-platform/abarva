/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import { HomeV4App } from "../HomeV4App";

jest.mock("@/components/home/preview/HomeAvaChat", () => ({
  HomeAvaChat: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const bundle = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "src/lib/home/preview/golden-snapshots/meridian-health.json",
      ),
      "utf8",
    ),
  ) as HomeReviewBundle;

/**
 * Cell provenance is what turns "every figure is a filter over a named file" from a promise into a
 * control. A reader who doubts a number reaches its rows in one move, and arrives knowing the view
 * is filtered rather than looking at a narrowed table nobody told them about.
 */
describe("a figure opens the rows behind it", () => {
  function openTechnologyChapter() {
    window.location.hash = "#technology_data";
    return render(<HomeV4App bundle={bundle()} tenantKey="meridian-health" />);
  }

  it("offers the control on a finding that names the rows it came from", () => {
    openTechnologyChapter();
    fireEvent.click(
      document.querySelectorAll("[data-home-lineage-trigger]")[0],
    );
    expect(
      document.querySelector("[data-home-lineage-open-rows]"),
    ).toBeInTheDocument();
  });

  it("lands on the record browser with the filter applied and stated", () => {
    openTechnologyChapter();
    fireEvent.click(
      document.querySelectorAll("[data-home-lineage-trigger]")[0],
    );
    fireEvent.click(
      document.querySelector("[data-home-lineage-open-rows]") as HTMLElement,
    );

    const banner = document.querySelector("[data-record-arrived-filtered]");
    expect(banner).toBeInTheDocument();
    expect(banner?.textContent).toMatch(/rows behind a figure you came from/);
    expect(banner?.textContent).toMatch(/local_accounts/);
  });

  // A reader who narrowed the view must be able to widen it, and must be told the full size.
  it("offers a way back to every row", () => {
    openTechnologyChapter();
    fireEvent.click(
      document.querySelectorAll("[data-home-lineage-trigger]")[0],
    );
    fireEvent.click(
      document.querySelector("[data-home-lineage-open-rows]") as HTMLElement,
    );
    const clear = screen.getByText(/Show all/);
    expect(clear.textContent).toMatch(/Show all 306/);
    fireEvent.click(clear);
    expect(
      document.querySelector("[data-record-arrived-filtered]"),
    ).not.toBeInTheDocument();
  });

  it("shows no arrival banner when the browser was opened directly", () => {
    window.location.hash = "#tech:application_system";
    render(<HomeV4App bundle={bundle()} tenantKey="meridian-health" />);
    expect(
      document.querySelector("[data-record-arrived-filtered]"),
    ).not.toBeInTheDocument();
  });
});
