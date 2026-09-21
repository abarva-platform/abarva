/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";

import {
  ContractBriefingHeader,
  ContractCaseThreadStrip,
  ContractStoryBriefing,
} from "../Contract360Surfaces";
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
    contractEducation: {
      archetypeLabel: "Cloud consumption commitment",
      facetRequirements: { Performance: { state: "required" } },
    },
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

describe("ContractStoryBriefing", () => {
  it("renders an explicit review state instead of composing an unreviewed purpose", () => {
    render(
      <ContractStoryBriefing
        contract={contract}
        coverage={null}
        scopeRows={[]}
        vm={vmWith(null)}
      />,
    );

    expect(screen.getByText("Purpose review needed")).toBeTruthy();
    expect(
      screen.getByText("No reviewed contract-purpose extraction is available."),
    ).toBeTruthy();
    expect(screen.queryByText(/This is .*Test Vendor/i)).toBeNull();
  });

  it("does not call an inapplicable performance lane missing evidence", () => {
    const vm = {
      ...vmWith(null),
      detail: {
        contractTabIntelligence: [{
          tab_key: "Story",
          supporting_evidence_summary:
            "12 spend rows; SLA history not loaded; Contract clauses available",
        }],
      },
      contractEducation: {
        archetypeLabel: "Cloud consumption commitment",
        facetRequirements: { Performance: { state: "not_required" } },
      },
    } as unknown as SourceWorkspaceVM;

    render(
      <ContractStoryBriefing
        contract={contract}
        coverage={null}
        scopeRows={[]}
        vm={vm}
      />,
    );

    expect(screen.getByText(/12 spend rows; Contract clauses available/)).toBeTruthy();
    expect(screen.queryByText(/SLA history not loaded/)).toBeNull();
    expect(screen.getByText("Not required")).toBeTruthy();
  });
});

describe("ContractCaseThreadStrip", () => {
  it("shows persisted case state and its next action, with a path to Optimize", () => {
    const onOpenOptimize = jest.fn();
    const vm = {
      opportunityView: {
        caseThread: {
          state: "Evidence Review",
          caseCount: 2,
          owner: "Category Management",
          nextAction: "Attach the reviewed pricing schedule.",
        },
      },
    } as unknown as SourceWorkspaceVM;

    render(<ContractCaseThreadStrip vm={vm} onOpenOptimize={onOpenOptimize} />);
    expect(screen.getByText("Evidence Review")).toBeTruthy();
    expect(screen.getByText("Latest of 2 cases")).toBeTruthy();
    expect(screen.getByText("Category Management")).toBeTruthy();
    expect(screen.getByText("Attach the reviewed pricing schedule.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open Optimize" }));
    expect(onOpenOptimize).toHaveBeenCalledTimes(1);
  });

  it("does not invent an optimization case from loaded opportunities", () => {
    const vm = { opportunityView: { caseThread: null } } as unknown as SourceWorkspaceVM;
    render(<ContractCaseThreadStrip vm={vm} onOpenOptimize={() => undefined} />);
    expect(screen.getByText("No case opened")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open Optimize" })).toBeTruthy();
    expect(screen.queryByText("Evidence Review")).toBeNull();
  });

  it("does not repeat the navigation action on the Optimize tab", () => {
    const vm = { opportunityView: { caseThread: null } } as unknown as SourceWorkspaceVM;
    render(<ContractCaseThreadStrip vm={vm} onOpenOptimize={() => undefined} isOptimizeTab />);
    expect(screen.queryByRole("button", { name: "Open Optimize" })).toBeNull();
  });

  it("does not render a case line without a contract opportunity read", () => {
    const { container } = render(
      <ContractCaseThreadStrip vm={vmWith(null)} onOpenOptimize={() => undefined} />,
    );
    expect(container.querySelector(".sw-c3-case-thread")).toBeNull();
  });
});
