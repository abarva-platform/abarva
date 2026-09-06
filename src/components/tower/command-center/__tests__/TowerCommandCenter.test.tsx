/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { formatUsdM } from "@/lib/tower/command-center/format";
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
    expect(screen.getByTestId("tower-tenant-identity")).toHaveTextContent(
      "Fixture Tenant",
    );
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
      "What must happen next",
      "Foundations",
    ]);
    expect(tab(TAB.verdict)).toHaveAttribute("aria-selected", "true");
  });

  it("opens on the designed Verdict panel", () => {
    renderPage();
    expect(screen.getByText("Total IT budget")).toBeInTheDocument();
    expect(screen.getByText("Board claimable YTD")).toBeInTheDocument();
    expect(
      screen.getByText("The three rules behind every number on this page"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Asserted value, and what survives each gate"),
    ).toBeInTheDocument();
  });

  it("keeps the decision rail and the value-loss waterfall reachable", () => {
    // The design puts decisions under their own tab rather than on the verdict. The content is
    // unchanged; only its home moved, and it must stay reachable.
    renderPage();
    goTo(TAB.decisions, /Decisions for this review/);
    expect(screen.getByText("Where the value is lost")).toBeInTheDocument();
    expect(screen.getByText("The drop is the finding")).toBeInTheDocument();
    expect(
      screen.getByText("Ceiling on any sign-off today"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(formatUsdM(view.summary.claimableUsd)).length,
    ).toBeGreaterThan(0);
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
    const budget = screen.getByText("Total IT budget").parentElement;
    expect(budget?.textContent).toContain("Not loaded");
    expect(budget?.textContent).not.toContain("$492.5M");

    // The claim population is stated on the decision rail, which is where it now lives.
    goTo(TAB.decisions, /Decisions for this review/);
    expect(screen.queryByText(/969 claims/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/230 claims/).length).toBeGreaterThan(0);
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
    const budget = screen.getByText("Total IT budget").parentElement;
    expect(budget?.textContent).toContain("Not loaded");

    // The populations must stay distinct on the rail: 230 value claims, never the 969-row queue.
    goTo(TAB.decisions, /Decisions for this review/);
    expect(screen.getAllByText(/230 claims/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/969 claims/)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,619 open tasks/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Close usage-to-value gaps on 230 claims"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("$210.6M").length).toBeGreaterThan(0);
    expect(container).toHaveTextContent(/open evidence actions/);
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

    goTo(TAB.initiatives, /Value proof/);

    expect(tab(TAB.initiatives)).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=initiatives&proof=stale&view=proof",
      { scroll: false },
    );
  });

  it("opens AI Bets on Value proof by default", () => {
    renderPage();
    fireEvent.click(tab(TAB.initiatives));

    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=initiatives&view=proof",
      { scroll: false },
    );
    expect(screen.getByRole("tab", { name: /Value proof/ })).toHaveAttribute(
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
    goTo(TAB.initiatives, /Value proof/);
    expect(screen.getAllByText("Value proof").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Investment to value conversion"),
    ).toBeInTheDocument();
    expect(screen.getByText("No substitution between states")).toBeInTheDocument();
    expect(screen.queryByText("Seven gates · in order")).not.toBeInTheDocument();
    expect(screen.getByText("Eight-quarter trajectory")).toBeInTheDocument();
    expect(screen.getByText("Claim ledger")).toBeInTheDocument();
    expect(screen.getByText("Value case lanes")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Stacked" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "2 × 2" })).not.toBeInTheDocument();
  });

  it("renders the AI Portfolio tab-specific contract layout", () => {
    renderPage();
    goTo(TAB.tools, /AI portfolio/);
    expect(screen.getByText("AI initiatives and tool rollouts")).toBeInTheDocument();
    expect(screen.getByText("All AI initiatives and tools")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /All initiatives\/tools/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("tab", { name: /Cost lens/ }));
    expect(screen.getByText("Attributed spend by category")).toBeInTheDocument();
    expect(screen.getByText("Cost findings · evidenced")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Risk lens/ }));
    expect(
      screen.getByText("Top value evidence gaps by amount at stake"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Adoption lens/ }));
    expect(
      screen.getByText("Tool rollouts ranked by recorded usage evidence"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /All initiatives\/tools/ }));
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
    expect(screen.getByRole("heading", { name: /No value claims loaded/ })).toBeInTheDocument();
    expect(screen.getByText("Usage evidence mapped").parentElement).toHaveTextContent("Not loaded");
    expect(document.body.textContent).not.toContain("0 of 0");
    expect(document.body.textContent).not.toContain("$0 board-claimable");
    expect(document.body.textContent).not.toContain("0 value claims and the gate");
    expect(document.body.textContent).not.toContain("Every value claim has usage-to-value support");
    expect(screen.getByText("Value claims not loaded →")).toBeInTheDocument();

    expect(screen.getByText("No review decisions loaded")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Review/ })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("Backfill measured outcome on the 0 claims");
  });

  it("renders the Evidence & Actions tab-specific contract layout", () => {
    const { container } = renderPage();
    goTo(TAB.decisions, /Evidence queue/);
    expect(
      screen.getByText("Three populations, three names"),
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
    expect(screen.getByText("Projection reconciliation")).toBeInTheDocument();
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
    goTo(TAB.decisions, /Evidence queue/);

    expect(screen.getByText("Capture actuals")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("measured_outcome");
  });

  it("opens the AI initiative drawer from the all-cases table", () => {
    renderPage();
    goTo(TAB.initiatives, /All cases/);
    const firstAi = [...view.allInitiatives].sort(
      (a, b) => b.aiSpendUsd - a.aiSpendUsd || a.name.localeCompare(b.name),
    )[0]!;
    clickFirstButtonContaining(firstAi.name);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Value type")).toBeInTheDocument();
    expect(within(drawer).getByText("Control blocker")).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: /Back to list/ })).toBeInTheDocument();
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
    expect(within(drawer).getByText("Tool spend")).toBeInTheDocument();
    expect(within(drawer).getByText("self-service analytics assistance")).toBeInTheDocument();
    expect(within(drawer).getByText("2,300")).toBeInTheDocument();
    expect(within(drawer).getByText("1,035")).toBeInTheDocument();
    expect(within(drawer).getByText("690")).toBeInTheDocument();
    expect(within(drawer).getByText("16 pts")).toBeInTheDocument();
    expect(within(drawer).getByText("AI Portfolio and Business Case Tracker")).toBeInTheDocument();
    expect(within(drawer).getByText("TOOL-MER-007")).toBeInTheDocument();
    expect(within(drawer).getByText("2026-08-24")).toBeInTheDocument();
    expect(within(drawer).getByText("monthly")).toBeInTheDocument();
    expect(within(drawer).getByText("synthetic_review_ready")).toBeInTheDocument();
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
        },
      ],
    });
    goTo(TAB.decisions, /Evidence queue/);

    expect(screen.getByText("Source contract actions")).toBeInTheDocument();
    expect(
      screen.getByText("Archive dormant source licenses before true-up"),
    ).toBeInTheDocument();
    expect(screen.getByText("$99M")).toBeInTheDocument();
  });

  it("opens the program drawer from Value Proof decision lanes", () => {
    renderPage();
    goTo(TAB.initiatives, /Value proof/);
    const firstProgram = [...view.programs].sort(
      (a, b) => b.blockedUsd - a.blockedUsd,
    )[0]!;
    clickFirstButtonContaining(firstProgram.name);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(firstProgram.name)).toBeInTheDocument();
    expect(within(drawer).getByText("Value proof chain")).toBeInTheDocument();
  });

  it("opens the AI initiative drawer from the portfolio table", () => {
    renderPage();
    goTo(TAB.tools, /AI portfolio/);
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
    goTo(TAB.decisions, /Evidence queue/);
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
    goTo(TAB.decisions, /Evidence queue/);
    const firstAction = [...view.actions].sort(
      (a, b) => a.sequence - b.sequence,
    )[0]!;
    clickFirstButtonContaining(firstAction.title.replace(/^FIX PROOF:\s*/i, ""));

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
