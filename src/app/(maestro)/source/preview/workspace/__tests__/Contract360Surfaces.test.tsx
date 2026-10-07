/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import {
  ContractBriefingHeader,
  ContractCaseThreadStrip,
  ContractStoryBriefing,
} from "../Contract360Surfaces";
import type { SourceContract360Row } from "@/lib/source/data-model/types";
import type { SourceWorkspaceVM } from "../buildViewModel";
import {
  ContractOptimizeContent,
  contractValueTypeSummary,
} from "../WorkspaceExecutiveShell";

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

/**
 * C-610. `Open Optimize` used to call `logic.select("contract", id, "Optimize")`
 * -- the Contract 360 Optimize TAB, not the dedicated seven-step journey at
 * `/source/optimize`. Three cases below therefore changed shape rather than
 * being added beside the old ones: the first pinned the tab-select callback as
 * correct, and two others named the affordance by the role a callback button
 * carries. The assertions they were written for -- a persisted case is shown
 * and never invented, and the affordance is not repeated on the tab it points
 * at -- are each kept, on the element the component now renders.
 *
 * `optCtaHref` is the governed journey href the view model already builds
 * through `contractOptimizationIntakeHref`; `buildViewModel.numeric.test.ts`
 * asserts separately that it resolves to `/source/optimize` carrying the
 * selected contract. This suite asserts the strip renders THAT href and
 * nothing it composed itself, so the two suites together carry the chain.
 */
const JOURNEY_HREF =
  "/source/optimize?contractId=MER-TEST-001&opportunityId=OPP-9";

const caseThreadVm = (optCtaHref: string | null) =>
  ({
    opportunityView: {
      caseThread: {
        state: "Evidence Review",
        caseCount: 2,
        owner: "Category Management",
        nextAction: "Attach the reviewed pricing schedule.",
      },
    },
    optCtaHref,
  }) as unknown as SourceWorkspaceVM;

describe("ContractCaseThreadStrip", () => {
  it("shows persisted case state and its next action, with a path to Optimize", () => {
    render(<ContractCaseThreadStrip vm={caseThreadVm(JOURNEY_HREF)} />);
    expect(screen.getByText("Evidence Review")).toBeTruthy();
    expect(screen.getByText("Latest of 2 cases")).toBeTruthy();
    expect(screen.getByText("Category Management")).toBeTruthy();
    expect(screen.getByText("Attach the reviewed pricing schedule.")).toBeTruthy();
  });

  it("hands the selected contract to the dedicated journey, not to the Contract 360 tab", () => {
    render(<ContractCaseThreadStrip vm={caseThreadVm(JOURNEY_HREF)} />);

    const link = screen.getByRole("link", { name: "Open Optimize" });
    const href = link.getAttribute("href");
    // The strip renders the governed href verbatim; it composes no URL itself.
    expect(href).toBe(JOURNEY_HREF);

    const url = new URL(href!, "https://app.abarva.ai");
    expect(url.pathname).toBe("/source/optimize");
    expect(url.searchParams.get("contractId")).toBe("MER-TEST-001");
    // The defect: selecting the tab keeps the workspace path and writes
    // `contractTab=Optimize` into the address bar. A journey href carries
    // neither, so this pair fails on a return to the tab-select.
    expect(url.pathname).not.toContain("/preview/workspace");
    expect(url.searchParams.get("contractTab")).toBeNull();

    // A real anchor, so the browser owns Back to the originating contract.
    expect(link.tagName).toBe("A");
    expect(screen.queryByRole("button", { name: "Open Optimize" })).toBeNull();
  });

  it("offers no journey affordance when the view model holds no governed contract href", () => {
    render(<ContractCaseThreadStrip vm={caseThreadVm(null)} />);
    // The case line itself still renders -- only the handoff is withheld.
    expect(screen.getByText("Evidence Review")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open Optimize" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Open Optimize" })).toBeNull();
    // Never a contract-less journey: an empty handoff is no handoff.
    expect(
      document.querySelector('.sw-c3-case-thread a[href="/source/optimize"]'),
    ).toBeNull();
  });

  it("does not invent an optimization case from loaded opportunities", () => {
    const vm = {
      opportunityView: { caseThread: null },
      optCtaHref: JOURNEY_HREF,
    } as unknown as SourceWorkspaceVM;
    render(<ContractCaseThreadStrip vm={vm} />);
    expect(screen.getByText("No case opened")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open Optimize" })).toBeTruthy();
    expect(screen.queryByText("Evidence Review")).toBeNull();
  });

  it("does not repeat the navigation action on the Optimize tab", () => {
    const vm = {
      opportunityView: { caseThread: null },
      optCtaHref: JOURNEY_HREF,
    } as unknown as SourceWorkspaceVM;
    render(<ContractCaseThreadStrip vm={vm} isOptimizeTab />);
    expect(screen.queryByRole("link", { name: "Open Optimize" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Open Optimize" })).toBeNull();
  });

  it("does not render a case line without a contract opportunity read", () => {
    const { container } = render(<ContractCaseThreadStrip vm={vmWith(null)} />);
    expect(container.querySelector(".sw-c3-case-thread")).toBeNull();
  });
});

describe("Contract 360 Optimize presentation", () => {
  it("shows one governed next action when opportunity signals have no negotiation content", () => {
    const vm = {
      c: { id: "TEST-001" },
      detail: { cloudCommitmentPeerCoverage: [] },
      opportunityView: {
        opportunities: [{ id: "SIGNAL-1", label: "Scope review", stageRaw: "signal" }],
        recommendation: "Collect the missing service-scope evidence.",
        recommendationDetail: "Confirm the run catalog before a buyer ask is written.",
        potential: {
          recoverable: "Not sized",
          avoidable: "Not sized",
          negotiable: "Not sized",
        },
        financeConfirmed: "Not established",
      },
    } as unknown as SourceWorkspaceVM;

    render(<ContractOptimizeContent vm={vm} />);

    expect(screen.getByText("Next action")).toBeTruthy();
    expect(screen.getByText("Collect the missing service-scope evidence.")).toBeTruthy();
    expect(screen.getByText("Confirm the run catalog before a buyer ask is written.")).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Levers" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Sequence" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Comparator" })).toBeNull();
    expect(screen.queryByText("No negotiation text is loaded for this contract.")).toBeNull();
  });

  it("retains recorded value even when negotiation text is absent", () => {
    const vm = {
      c: { id: "TEST-002" },
      detail: { cloudCommitmentPeerCoverage: [] },
      opportunityView: {
        opportunities: [{ id: "SIGNAL-2", label: "Invoice review", stageRaw: "signal" }],
        recommendation: "Reconcile the invoices before a vendor ask.",
        potential: {
          recoverable: "$37K",
          avoidable: "$151K",
          negotiable: "Not established",
        },
        financeConfirmed: "Not established",
      },
    } as unknown as SourceWorkspaceVM;

    render(<ContractOptimizeContent vm={vm} />);

    expect(screen.getByText("$37K")).toBeTruthy();
    expect(screen.getByText("$151K")).toBeTruthy();
    expect(screen.getByText("Reconcile the invoices before a vendor ask.")).toBeTruthy();
    expect(screen.queryByText("A negotiation position and value are not established yet.")).toBeNull();
  });

  it("does not promote unsized placeholders to established value", () => {
    const summary = contractValueTypeSummary({
      potential: {
        recoverable: "Not sized",
        avoidable: "Not sized",
        negotiable: "Not sized",
      },
      financeConfirmed: "Not established",
    });

    expect(summary.established).toEqual([]);
    expect(summary.unpriced).toEqual(["recoverable", "avoidable", "negotiable"]);
    expect(summary.confirmed).toBeNull();
  });

  it("does not present a discount signal with no loaded rate as a comparator", () => {
    const vm = {
      c: { id: "TEST-001" },
      detail: { cloudCommitmentPeerCoverage: [] },
      opportunityView: {
        opportunities: [{ id: "DISCOUNT-1", label: "Discount band review", stageRaw: "signal" }],
        recommendation: "Collect the accepted price schedule.",
        potential: {
          recoverable: "Not sized",
          avoidable: "Not sized",
          negotiable: "Not sized",
        },
        financeConfirmed: "Not established",
      },
    } as unknown as SourceWorkspaceVM;

    render(<ContractOptimizeContent vm={vm} />);

    expect(screen.getByText("Collect the accepted price schedule.")).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Comparator" })).toBeNull();
    expect(screen.queryByText(/No loaded discount percentage/)).toBeNull();
  });

  it("keeps an authored ask and hides the unsupported comparator", () => {
    const vm = {
      c: { id: "TEST-001" },
      detail: { cloudCommitmentPeerCoverage: [] },
      opportunityView: {
        opportunities: [{
          id: "ASK-1",
          label: "Scope review",
          shortLabel: "Re-base scope",
          buyerAsk: "Move recurring change orders into the base service catalog.",
          owner: "Sourcing",
          stageRaw: "signal",
          amountUsd: null,
        }],
      },
    } as unknown as SourceWorkspaceVM;

    render(<ContractOptimizeContent vm={vm} />);

    expect(screen.getByText("Move recurring change orders into the base service catalog.")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Sequence" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Comparator" })).toBeNull();
    expect(screen.queryByText("No negotiation text is loaded for this contract.")).toBeNull();
  });
});
