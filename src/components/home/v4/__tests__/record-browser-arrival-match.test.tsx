/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import type { TechRecordType } from "@/lib/home/preview/types";
import { RecordBrowser } from "../RecordBrowser";

/**
 * A figure counted by joining on an identifier opens its rows by that identifier.
 *
 * Two things have to hold at once. The rows shown are exactly the rows counted -- an identifier
 * that is a prefix of another must not bring the other's rows with it. And the identifier itself
 * stays out of sight: it found the rows, and the reader is told the record's name for them.
 */

const programs: TechRecordType = {
  objectType: "program_initiative",
  label: "Programs & Initiatives",
  columns: ["programName", "status", "priorityId", "sponsorFunctionId"],
  primaryDimension: "status",
  dimensionCounts: [],
  rows: [
    {
      programName: "Intake redesign",
      status: "in_flight",
      priorityId: "PRI-1",
      sponsorFunctionId: "FUNC-1",
    },
    {
      programName: "Records cleanup",
      status: "at_risk",
      priorityId: "PRI-1",
      sponsorFunctionId: "FUNC-2",
    },
    {
      programName: "Network refresh",
      status: "in_flight",
      priorityId: "PRI-10",
      sponsorFunctionId: "FUNC-1",
    },
    {
      programName: "Access review",
      status: "approved",
      priorityId: "PRI-100",
      sponsorFunctionId: "FUNC-3",
    },
    {
      programName: "Unsponsored work",
      status: "proposed",
      priorityId: null,
      sponsorFunctionId: null,
    },
  ],
} as unknown as TechRecordType;

const shownRows = () =>
  document.querySelectorAll("table[data-records] tbody tr").length;
const tableText = () =>
  document.querySelector("table[data-records] tbody")?.textContent ?? "";
const banner = () => document.querySelector("[data-record-arrived-filtered]");
const searchBox = () =>
  document.querySelector('input[type="search"]') as HTMLInputElement;

describe("a record browser opened on the rows behind a counted figure", () => {
  it("shows exactly the rows carrying that identifier", () => {
    render(
      <RecordBrowser
        recordType={programs}
        initialMatch={{
          field: "priorityId",
          value: "PRI-1",
          label: "Faster intake",
        }}
      />,
    );
    // "PRI-1" is also the start of "PRI-10" and "PRI-100". Those are other priorities.
    expect(shownRows()).toBe(2);
    expect(tableText()).toContain("Intake redesign");
    expect(tableText()).toContain("Records cleanup");
    expect(document.body).not.toHaveTextContent("Network refresh");
    expect(document.body).not.toHaveTextContent("Access review");
  });

  it("says what it is filtered to by the record's name, never the identifier", () => {
    render(
      <RecordBrowser
        recordType={programs}
        initialMatch={{
          field: "priorityId",
          value: "PRI-1",
          label: "Faster intake",
        }}
      />,
    );
    expect(banner()).toHaveTextContent(
      "Showing the rows behind a figure you came from — filtered to Faster intake.",
    );
    expect(document.body).not.toHaveTextContent("PRI-1");
    expect(document.body).not.toHaveTextContent(
      /Priority Id|Sponsor Function Id/,
    );
    // The filter is not a search the reader typed, so the search box is theirs to use.
    expect(searchBox().value).toBe("");
  });

  it("gives every row back in one move, by either control", () => {
    const first = render(
      <RecordBrowser
        recordType={programs}
        initialMatch={{
          field: "priorityId",
          value: "PRI-1",
          label: "Faster intake",
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show all 5" }));
    expect(shownRows()).toBe(5);
    expect(banner()).not.toBeInTheDocument();
    first.unmount();

    render(
      <RecordBrowser
        recordType={programs}
        initialMatch={{
          field: "priorityId",
          value: "PRI-1",
          label: "Faster intake",
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(shownRows()).toBe(5);
    expect(banner()).not.toBeInTheDocument();
  });

  it("narrows further with a search without losing the match", () => {
    render(
      <RecordBrowser
        recordType={programs}
        initialMatch={{
          field: "sponsorFunctionId",
          value: "FUNC-1",
          label: "Claims",
        }}
      />,
    );
    expect(shownRows()).toBe(2);
    fireEvent.change(searchBox(), { target: { value: "network" } });
    expect(shownRows()).toBe(1);
    expect(banner()).toHaveTextContent("filtered to Claims.");
  });

  it("cannot be reached by typing an identifier into the search", () => {
    render(<RecordBrowser recordType={programs} />);
    expect(shownRows()).toBe(5);
    fireEvent.change(searchBox(), { target: { value: "PRI-1" } });
    expect(shownRows()).toBe(0);
    fireEvent.change(searchBox(), { target: { value: "FUNC-1" } });
    expect(shownRows()).toBe(0);
  });

  it("still states a typed-search arrival in the words that were searched", () => {
    render(<RecordBrowser recordType={programs} initialQuery="at_risk" />);
    expect(shownRows()).toBe(1);
    expect(banner()).toHaveTextContent("filtered to at_risk.");
    expect(searchBox().value).toBe("at_risk");
    fireEvent.click(screen.getByRole("button", { name: "Show all 5" }));
    expect(shownRows()).toBe(5);
    expect(searchBox().value).toBe("");
  });
});
