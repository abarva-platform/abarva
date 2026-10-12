/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenter } from "../TowerCommandCenter";

const replace = jest.fn();
let mockedSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: (...args: unknown[]) => replace(...args) }),
  usePathname: () => "/tower/command",
  useSearchParams: () => mockedSearchParams,
}));

jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={1200} height={420}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

const view = buildTowerCommandCenterView(designFixtureMart(), {
  tenantName: "Fixture Tenant",
})!;

function renderPage() {
  return render(<TowerCommandCenter view={view} tenantName="Fixture Tenant" />);
}

function renderCustomView(nextView: typeof view): ReturnType<typeof render> {
  return render(
    <TowerCommandCenter view={nextView} tenantName="Fixture Tenant" />,
  );
}

function renderWithSummary(
  summary: Partial<typeof view.summary>,
): ReturnType<typeof render> {
  const nextView = {
    ...view,
    summary: {
      ...view.summary,
      ...summary,
    },
  };
  return render(
    <TowerCommandCenter view={nextView} tenantName="Fixture Tenant" />,
  );
}

function tab(name: RegExp) {
  return screen.getByRole("tab", { name });
}

/**
 * The shell now carries the design's six tabs, several with sub-tabs. These helpers keep the
 * behavioural assertions below anchored to *what* is being tested rather than to where it happens
 * to sit, so a future move of a panel breaks one helper instead of a dozen tests.
 */
const TAB = {
  verdict: /Today's verdict/,
  budget: /Where the money goes/,
  initiatives: /AI bets/,
  tools: /Tools/,
  decisions: /What must happen next/,
  foundations: /Foundations/,
} as const;

function goTo(name: RegExp, sub?: RegExp) {
  fireEvent.click(screen.getByRole("tab", { name }));
  if (sub) fireEvent.click(screen.getByRole("tab", { name: sub }));
}

function clickFirstButtonContaining(text: string) {
  const button = screen
    .getAllByRole("button")
    .find((candidate) => candidate.textContent?.includes(text));
  if (!button) throw new Error(`No button containing ${text}`);
  fireEvent.click(button);
}

describe("TowerCommandCenter", () => {
  beforeEach(() => {
    replace.mockClear();
    mockedSearchParams = new URLSearchParams();
  });

  it("renders the six designed tabs as a real tablist", () => {
    renderPage();
    const labels = screen.getAllByRole("tab").map((node) =>
      (node.textContent ?? "")
        .replace(/needs attention/g, "")
        .replace(/\d+/g, "")
        .trim(),
    );
    expect(labels).toEqual([
      "Today's verdict",
      "Where the money goes",
      "AI bets",
      "Tools",
      "Foundations",
      "What must happen next",
    ]);
    expect(tab(TAB.verdict)).toHaveAttribute("aria-selected", "true");
  });

  it("labels declared synthetic records as an illustrative scenario", () => {
    const first = view.allInitiatives[0]!;
    renderCustomView({
      ...view,
      allInitiatives: [
        { ...first, sourceQualityState: "synthetic_review_ready" },
        ...view.allInitiatives.slice(1),
      ],
    });
    expect(screen.getByRole("note")).toHaveTextContent(
      "sample scenario, not verified client results",
    );
  });

  it("opens on the designed Verdict panel", () => {
    renderPage();
    expect(screen.getByText("Approved FY26 IT budget")).toBeInTheDocument();
    expect(screen.getByText("Cleared value in loaded months")).toBeInTheDocument();
    expect(
      screen.getByText("The three rules behind every number on this page"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Yearly benefit estimates on cases checked by Finance"),
    ).toBeInTheDocument();
  });

  it("keeps the decision rail and period-scoped value evidence reachable", () => {
    renderPage();
    goTo(TAB.decisions, /Decisions for this review/);
    expect(screen.getByText("Value by evidence state")).toBeInTheDocument();
    expect(screen.getByText("Outcome evidence gap")).toBeInTheDocument();
    expect(
      screen.getByText("Finance review gap"),
    ).toBeInTheDocument();
    expect(document.body).toHaveTextContent("No amount cleared");
  });

  it("does not substitute promised benefit when approved investment is not loaded", () => {
    renderWithSummary({
      approvedInvestmentUsd: null,
      budgetUsd: null,
      promisedUsd: 492_500_000,
      valueClaimCount: 230,
      unknownValueClaimCount: 969,
    });

    // The guarantee is unchanged: an absent budget must never borrow the benefit figure. It is
    // now asserted on the Verdict panel's cards rather than the old headline.
    const budget = screen.getByText("Approved FY26 IT budget").parentElement;
    expect(budget?.textContent).toContain("Not verified");
    expect(budget?.textContent).not.toContain("$492.5M");

    // The claim population is stated on the decision rail, which is where it now lives.
    goTo(TAB.decisions, /Decisions for this review/);
    expect(screen.queryByText(/969 claims/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/230 value records/).length).toBeGreaterThan(0);
  });

  it("keeps approved investment, benefit, and claim populations distinct", () => {
    const { container } = renderWithSummary({
      approvedInvestmentUsd: 703_100_000,
      budgetUsd: null,
      promisedUsd: 492_500_000,
      valueClaimCount: 230,
      unknownValueClaimCount: 969,
      financeAttestedClaimCount: 0,
      outcomeMeasuredClaimCount: 230,
      economicReviewQueueCount: 969,
      claimableUsd: 0,
      usageSupportedUsd: 0,
    });

    // The populations must stay distinct: 230 value claims, never the 969-row economic queue.
    // budgetUsd is null here, so the Verdict panel's budget card must say so rather than borrow
    // the approved-investment figure.
    const budget = screen.getByText("Approved FY26 IT budget").parentElement;
    expect(budget?.textContent).toContain("Not verified");

    // The populations must stay distinct on the rail: 230 value claims, never the 969-row queue.
    goTo(TAB.decisions, /Decisions for this review/);
    expect(screen.getAllByText(/230 value records/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/969 claims/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,619 open tasks/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Match each benefit claim to the proof it needs"),
    ).toBeInTheDocument();
    expect(container).toHaveTextContent("Approved FY26 project funding");
    expect(container).toHaveTextContent(/recorded evidence actions|Evidence actions not loaded/);
  });

  it("moves between tabs with arrow keys and reflects the tab in the URL", () => {
    renderPage();
    const first = tab(TAB.verdict);
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(tab(TAB.budget)).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=budget&view=shape",
      { scroll: false },
    );
  });

  it("does not let a stale URL tab value undo a local tab click", () => {
    mockedSearchParams = new URLSearchParams("tab=executive&proof=stale");
    renderPage();

    goTo(TAB.initiatives, /Results and proof/);

    expect(tab(TAB.initiatives)).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=initiatives&proof=stale&view=proof",
      { scroll: false },
    );
  });

  it("opens AI Bets on Results and proof by default", () => {
    renderPage();
    fireEvent.click(tab(TAB.initiatives));

    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=initiatives&view=proof",
      { scroll: false },
    );
    expect(screen.getByRole("tab", { name: /Results and proof/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("normalizes stale tab URLs into the six-tab contract", () => {
    mockedSearchParams = new URLSearchParams("tab=evidence&client=demo");
    renderPage();
    expect(tab(TAB.decisions)).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=decisions&client=demo",
      { scroll: false },
    );
  });

  it("renders the Value Proof tab-specific contract layout", () => {
    renderPage();
    goTo(TAB.initiatives, /Results and proof/);
    expect(screen.getAllByText("Results and proof").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Portfolio amounts by measure"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Approved funding, yearly plans and loaded-month results are different measures"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Seven gates · in order"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Quarterly plan and recorded results")).toBeInTheDocument();
    expect(screen.getByText("Evidence recorded for each value claim")).toBeInTheDocument();
    expect(screen.getByText("Cases awaiting a decision")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Stacked" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "2 × 2" }),
    ).not.toBeInTheDocument();
  });

  it("renders the AI Portfolio tab-specific contract layout", () => {
    renderPage();
    goTo(TAB.tools, /All tools and cases/);
    expect(
      screen.getByText("AI initiatives and tool rollouts"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("All AI initiatives and tools"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /All initiatives\/tools/ }),
    ).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: /Funding and cost/ }));
    expect(
      screen.getByText("Approved AI funding by recorded type"),
    ).toBeInTheDocument();
    expect(screen.getByText("Funding and evidence gaps")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Risk lens/ }));
    expect(
      screen.getByText(/evidence gaps by priority/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Adoption lens/ }));
    expect(
      screen.getByText("Tool rollouts ranked by recorded usage evidence"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("tab", { name: /All initiatives\/tools/ }),
    );
    expect(
      screen.getByText("All AI initiatives and tools"),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("routes executive review buttons to distinct review surfaces", () => {
    // The review buttons belong to the decision rail, which now sits under the decisions tab.
    renderWithSummary({
      valueClaimCount: 230,
      usageSupportedClaimCount: 0,
      outcomeMeasuredClaimCount: 160,
      financeAttestedClaimCount: 0,
      promisedUsd: 492_500_000,
      claimableUsd: 0,
    });

    // Each review button routes to a different surface, and none of them opens a drawer.
    goTo(TAB.decisions, /Decisions for this review/);
    fireEvent.click(screen.getAllByRole("button", { name: /Review/ })[0]);
    expect(tab(TAB.tools)).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    goTo(TAB.decisions, /Decisions for this review/);
    fireEvent.click(screen.getAllByRole("button", { name: /Review/ })[1]);
    expect(tab(TAB.initiatives)).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    goTo(TAB.decisions, /Decisions for this review/);
    fireEvent.click(screen.getAllByRole("button", { name: /Review/ })[2]);
    expect(tab(TAB.decisions)).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a zero claim denominator as a gap, not a complete proof state", () => {
    renderWithSummary({
      valueClaimCount: 0,
      claimableClaimCount: 0,
      usageSupportedClaimCount: 0,
      outcomeMeasuredClaimCount: 0,
      financeAttestedClaimCount: 0,
      promisedUsd: 0,
      claimableUsd: 0,
    });

    goTo(TAB.decisions, /Decisions for this review/);
    expect(
      screen.getByRole("heading", { name: /No review decisions loaded/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Claims with usage evidence").parentElement,
    ).toHaveTextContent("Not loaded");
    expect(document.body.textContent).not.toContain("0 of 0");
    expect(document.body.textContent).not.toContain("$0 board-claimable");
    expect(document.body.textContent).not.toContain(
      "0 value claims and the gate",
    );
    expect(document.body.textContent).not.toContain(
      "Every value claim has usage-to-value support",
    );
    expect(screen.getByText("Value claims not loaded →")).toBeInTheDocument();

    expect(screen.getByText("No review decisions loaded")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Review/ }),
    ).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain(
      "Backfill measured outcome on the 0 claims",
    );
  });

  it("renders the Evidence & Actions tab-specific contract layout", () => {
    const { container } = renderPage();
    goTo(TAB.decisions, /What proof is missing/);
    expect(
      screen.getByText("Distinct review populations"),
    ).toBeInTheDocument();
    expect(screen.getByText("Action campaigns")).toBeInTheDocument();
    expect(container).toHaveTextContent(
      /open tasks · campaigns show affected records/,
    );
    expect(container).not.toHaveTextContent(/1–3 sequential/);
    expect(screen.getAllByText("Task").length).toBeGreaterThan(0);
    expect(container).not.toHaveTextContent(/Usage telemetry connection/);
    expect(container).not.toHaveTextContent(/Vendor leverage review/);
    expect(screen.getAllByText("Next step").length).toBeGreaterThan(0);
    expect(screen.getByText("Evidence-owner queue")).toBeInTheDocument();
    expect(screen.getByText("Projection population counts")).toBeInTheDocument();
  });

  it("renders evidence campaign due keys as short next-step labels", () => {
    renderCustomView({
      ...view,
      actions: [
        {
          ...view.actions[0]!,
          id: "fixture::action::short-due",
          sequence: 1,
          title: "FIX PROOF: Capture monthly actuals",
          why: "The proof step is loaded as a machine key, but the row must read like a next step.",
          due: "measured_outcome",
          amountExposedUsd: 12_000_000,
        },
      ],
    });
    goTo(TAB.decisions, /What proof is missing/);

    expect(screen.getByText("Capture actuals")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("measured_outcome");
  });

  it("opens the AI initiative drawer from the business-cases table", () => {
    renderCustomView({
      ...view,
      allInitiatives: view.allInitiatives.map((item) => ({
        ...item,
        sourceFile: "22_ai_business_cases.csv",
      })),
    });
    goTo(TAB.initiatives, /Business cases/);
    const firstAi = [...view.allInitiatives].sort(
      (a, b) => b.aiSpendUsd - a.aiSpendUsd || a.name.localeCompare(b.name),
    )[0]!;
    clickFirstButtonContaining(firstAi.name);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Value type")).toBeInTheDocument();
    expect(within(drawer).getByText("Control blocker")).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: /Back to list/ }),
    ).toBeInTheDocument();
  });

  it("opens the AI initiative drawer from the tools rollout table", () => {
    renderCustomView({
      ...view,
      allInitiatives: [
        {
          ...view.allInitiatives[0]!,
          n: 88,
          id: "TOOL-DETAIL",
          name: "Power BI Copilot",
          sourceFile: "23_ai_tool_rollout.csv",
          aiAmountBasis: "annualized_tool_cost",
          usageHeadline: "Usage evidence exists",
          usageBars: [
            { label: "Adoption", valueText: "30%", pct: 30, tone: "amber" },
          ],
          rolloutGoal: "self-service analytics assistance",
          rolloutStage: "pilot",
          rolloutTargetUsers: 2300,
          enabledUsers: 1035,
          monthlyActiveUsers: 690,
          adoptionActualPct: 30,
          adoptionTargetPct: 46,
          linkedBusinessCaseCount: 0,
          sourceSystem: "AI Portfolio and Business Case Tracker",
          sourceRecordId: "TOOL-MER-007",
          sourceAsOfDate: "2026-08-24",
          refreshCadence: "monthly",
          sourceQualityState: "synthetic_review_ready",
        },
      ],
    });
    goTo(TAB.tools, /Rollouts/);
    clickFirstButtonContaining("Power BI Copilot");

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(/AI tool rollout/)).toBeInTheDocument();
    expect(within(drawer).getByText("Tool rollout detail")).toBeInTheDocument();
    expect(within(drawer).getByText("Yearly tool cost")).toBeInTheDocument();
    expect(
      within(drawer).getByText("self-service analytics assistance"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("2,300")).toBeInTheDocument();
    expect(within(drawer).getByText("1,035")).toBeInTheDocument();
    expect(within(drawer).getByText("690")).toBeInTheDocument();
    expect(within(drawer).getByText("16 pts")).toBeInTheDocument();
    expect(
      within(drawer).getByText("AI Portfolio and Business Case Tracker"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("TOOL-MER-007")).toBeInTheDocument();
    expect(within(drawer).getByText("2026-08-24")).toBeInTheDocument();
    expect(within(drawer).getByText("monthly")).toBeInTheDocument();
    expect(
      within(drawer).getByText("synthetic_review_ready"),
    ).toBeInTheDocument();
  });

  it("surfaces Source contract actions without dumping the full action queue", () => {
    renderCustomView({
      ...view,
      actions: [
        ...view.actions,
        {
          ...view.actions[0]!,
          id: "fixture::action::source-contract",
          sequence: 99,
          title: "FIX PROOF: Archive dormant source licenses before true-up",
          why: "Microsoft contract has a sourced optimization opportunity, but finance confirmation and evidence review must close before Tower treats it as realized value.",
          amountExposedUsd: 99_000_000,
          moduleHandoff: "Source",
          handoffEntityId: "MER-TECH-IMS-001",
        },
      ],
    });
    goTo(TAB.decisions, /What proof is missing/);

    expect(screen.getByText("Source contract actions")).toBeInTheDocument();
    expect(
      screen.getByText("Archive dormant source licenses before true-up"),
    ).toBeInTheDocument();
    expect(screen.getByText("$99M / year potential")).toBeInTheDocument();

    clickFirstButtonContaining(
      "Archive dormant source licenses before true-up",
    );
    const drawer = screen.getByRole("dialog");
    expect(
      within(drawer).getByRole("link", { name: "View in Source" }),
    ).toHaveAttribute(
      "href",
      "/source?contractId=MER-TECH-IMS-001&contractTab=Optimize",
    );
    expect(within(drawer).getByText("MER-TECH-IMS-001")).toBeInTheDocument();
  });

  it("opens the program drawer from Value Proof decision lanes", () => {
    renderPage();
    goTo(TAB.initiatives, /Results and proof/);
    const firstProgram = [...view.programs].sort(
      (a, b) => b.blockedUsd - a.blockedUsd,
    )[0]!;
    clickFirstButtonContaining(firstProgram.name);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(firstProgram.name)).toBeInTheDocument();
    expect(within(drawer).getByText("Steps to report a benefit")).toBeInTheDocument();
  });

  it("opens the AI initiative drawer from the portfolio table", () => {
    renderPage();
    goTo(TAB.tools, /All tools and cases/);
    const firstAi = [...view.allInitiatives].sort(
      (a, b) => b.aiSpendUsd - a.aiSpendUsd || a.name.localeCompare(b.name),
    )[0]!;
    clickFirstButtonContaining(firstAi.name);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Value potential")).toBeInTheDocument();
    expect(within(drawer).getAllByText(/\/100/).length).toBeGreaterThan(0);
  });

  it("opens the evidence gap drawer from the owner queue", () => {
    renderPage();
    goTo(TAB.decisions, /What proof is missing/);
    const firstGap = [...view.gaps].sort(
      (a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0),
    )[0]!;
    clickFirstButtonContaining(firstGap.missing);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Audit trace")).toBeInTheDocument();
    expect(within(drawer).getByText("Why it matters")).toBeInTheDocument();
  });

  it("opens the action drawer from an action campaign and keeps routing disabled", () => {
    renderPage();
    goTo(TAB.decisions, /What proof is missing/);
    const firstAction = [...view.actions].sort(
      (a, b) => a.sequence - b.sequence,
    )[0]!;
    clickFirstButtonContaining(
      firstAction.title.replace(/^FIX PROOF:\s*/i, ""),
    );

    const drawer = screen.getByRole("dialog");
    const approve = within(drawer).getByRole("button", {
      name: /Approve & route/,
    });
    expect(approve).toBeDisabled();
    expect(
      within(drawer).getByText(/Routing is not available yet/),
    ).toBeInTheDocument();
  });
});

describe("TowerCommandCenter — empty tenant", () => {
  it("renders an honest empty state instead of zeros", () => {
    render(<TowerCommandCenter view={null} tenantName="Empty Tenant" />);
    expect(
      screen.getByText("No governed Tower data for this tenant"),
    ).toBeInTheDocument();
    expect(screen.getByText(/a zero would be a claim/)).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(6);
  });
});
