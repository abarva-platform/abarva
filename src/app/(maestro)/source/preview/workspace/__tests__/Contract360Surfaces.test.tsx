/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import { ContractBriefingHeader } from "../Contract360Surfaces";
import type { SourceContract360Row } from "@/lib/source/data-model/types";
import type { SourceWorkspaceVM } from "../buildViewModel";

/**
 * These pin three defects found by live proof rather than by the suite: a
 * long-form headline concatenated into the page heading, an alarm-red notice
 * chip announcing a deadline nearly four years away, and a not-required lane
 * still carrying the zero the state exists to replace.
 */

const contract = {
  contract_id: "MER-TEST-001",
  contract_name: "Test Enterprise Agreement",
  vendor_name: "Test Vendor, Inc.",
  annual_value: 1_000_000,
  end_date: "2030-10-14",
} as unknown as SourceContract360Row;

const vmWith = (headline: string | null) =>
  ({
    detail: {
      contractTabIntelligence: headline
        ? [
            {
              tab_key: "Story",
              headline,
              allowed_executive_statement: "Statement.",
              supporting_evidence_summary: "12 spend rows",
              confidence_level: "high",
              review_status: "reviewed",
            },
          ]
        : [],
    },
    contractEducation: { archetypeLabel: "Cloud consumption commitment" },
    optWorkflow: null,
  }) as unknown as SourceWorkspaceVM;

describe("ContractBriefingHeader", () => {
  it("keeps long-form governed prose out of the page heading", () => {
    const prose =
      "Databricks-on-AWS consumption commitment for lakehouse, SQL warehouse, " +
      "model serving and pilot analytics workloads. The agreement buys committed " +
      "platform capacity ahead of current consumption.";

    const { container } = render(
      <ContractBriefingHeader
        contract={contract}
        noticeDays={30}
        onBack={() => undefined}
        vm={vmWith(prose)}
      />,
    );

    const heading = container.querySelector(".sw-c3-title");
    expect(heading?.textContent).toBe("Test Enterprise Agreement");
    expect(heading?.textContent).not.toContain("lakehouse");
  });

  it("takes a genuinely short clause as the grey second half", () => {
    const { container } = render(
      <ContractBriefingHeader
        contract={contract}
        noticeDays={30}
        onBack={() => undefined}
        vm={vmWith("Commitment timing, not price.")}
      />,
    );

    const heading = container.querySelector(".sw-c3-title");
    expect(heading?.textContent).toContain("Test Enterprise Agreement");
    expect(heading?.textContent).toContain("Commitment timing, not price.");
  });

  it("raises the notice window in alarm only when it is close", () => {
    const { container } = render(
      <ContractBriefingHeader
        contract={contract}
        noticeDays={35}
        onBack={() => undefined}
        vm={vmWith(null)}
      />,
    );

    expect(container.querySelector(".sw-c3-pill-alert")).toBeTruthy();
    expect(screen.getByText(/Notice window — 35 days/)).toBeTruthy();
  });

  it("states a distant notice window quietly instead of in alarm", () => {
    // 1404 days out is not urgent. Rendering it in the loudest treatment on the
    // page teaches a reader to ignore the chip by the time it matters.
    const { container } = render(
      <ContractBriefingHeader
        contract={contract}
        noticeDays={1404}
        onBack={() => undefined}
        vm={vmWith(null)}
      />,
    );

    expect(container.querySelector(".sw-c3-pill-alert")).toBeNull();
    expect(container.querySelector(".sw-c3-pill-quiet")).toBeTruthy();
    expect(screen.getByText(/opens in 1404 days/)).toBeTruthy();
  });

  it("renders no notice chip at all when the dates are not recorded", () => {
    const { container } = render(
      <ContractBriefingHeader
        contract={contract}
        noticeDays={null}
        onBack={() => undefined}
        vm={vmWith(null)}
      />,
    );

    expect(container.querySelector(".sw-c3-pill-alert")).toBeNull();
    expect(container.querySelector(".sw-c3-pill-quiet")).toBeNull();
  });
});
