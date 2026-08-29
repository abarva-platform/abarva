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

  it("renders the four attached-contract tabs as a real tablist", () => {
    renderPage();
    const labels = screen.getAllByRole("tab").map((node) =>
      (node.textContent ?? "")
        .replace(/needs attention/g, "")
        .replace(/\d+/g, "")
        .trim(),
    );
    expect(labels).toEqual([
      "Executive View",
      "Value Proof",
      "AI Portfolio",
      "Evidence & Actions",
    ]);
    expect(tab(/Executive View/)).toHaveAttribute("aria-selected", "true");
  });

  it("opens on the attached-design Executive View", () => {
    renderPage();
    expect(
      screen.getByText("IT Investment Tower · FY26 · Today's verdict"),
    ).toBeInTheDocument();
    expect(screen.getByText("Decisions for this review")).toBeInTheDocument();
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

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "not loaded approved",
    );
    expect(screen.queryByText(/\$492\.5M approved/)).not.toBeInTheDocument();
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
      // 160 of 230 measured, matching the real tenant shape. This previously read 230, which made
      // the outcome gap exactly zero and let the assertion below pass on the string "the 0 claims"
      // — an action targeting nothing. The point of this test is that claim arithmetic uses 230 and
      // not 969, so it should assert a real gap derived from 230.
      outcomeMeasuredClaimCount: 160,
      economicReviewQueueCount: 969,
      claimableUsd: 0,
      usageSupportedUsd: 0,
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "$703.1M approved. $0 board-claimable",
    );
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent(
      "gate",
    );
    expect(screen.queryByText(/\$492\.5M approved/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/0 of 230 claims attested by Finance/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Backfill measured outcome on the 70 claims/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Close usage-to-value gaps on 230 claims"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("$210.6M").length).toBeGreaterThan(0);
    expect(container).toHaveTextContent(/open evidence actions/);
    expect(screen.queryByText(/1,619 open tasks/)).not.toBeInTheDocument();
  });

  it("moves between tabs with arrow keys and reflects the tab in the URL", () => {
    renderPage();
    const first = tab(/Executive View/);
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(tab(/Value Proof/)).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith("/tower/command?tab=funnel", {
      scroll: false,
    });
  });

  it("does not let a stale URL tab value undo a local tab click", () => {
    mockedSearchParams = new URLSearchParams("tab=executive&proof=stale");
    renderPage();

    fireEvent.click(tab(/Value Proof/));

    expect(tab(/Value Proof/)).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=funnel&proof=stale",
      { scroll: false },
    );
  });

  it("normalizes stale tab URLs into the new four-tab contract", () => {
    mockedSearchParams = new URLSearchParams("tab=evidence&client=demo");
    renderPage();
    expect(tab(/Evidence & Actions/)).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith(
      "/tower/command?tab=actions&client=demo",
      { scroll: false },
    );
  });

  it("renders the Value Proof tab-specific contract layout", () => {
    renderPage();
    fireEvent.click(tab(/Value Proof/));
    expect(screen.getByText("Value proof")).toBeInTheDocument();
    expect(
      screen.getByText("Investment to value conversion"),
    ).toBeInTheDocument();
    expect(screen.getByText("No substitution between states")).toBeInTheDocument();
    expect(screen.queryByText("Seven gates · in order")).not.toBeInTheDocument();
    expect(screen.getByText("Eight-quarter trajectory")).toBeInTheDocument();
    expect(screen.getByText("Claim ledger")).toBeInTheDocument();
    expect(screen.getByText("Value case lanes")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders the AI Portfolio tab-specific contract layout", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
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
    // The base fixture carries no value claims, so the review decisions - and therefore the Review
    // buttons this test drives - are correctly suppressed. Give it a claim set with a real gap at
    // every gate so all three decisions render.
    renderWithSummary({
      valueClaimCount: 230,
      knownValueClaimCount: 230,
      usageSupportedClaimCount: 40,
      outcomeMeasuredClaimCount: 160,
      financeAttestedClaimCount: 0,
    });

    const reviewButtons = screen.getAllByRole("button", { name: /Review/ });
    fireEvent.click(reviewButtons[0]);
    expect(tab(/AI Portfolio/)).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(tab(/Executive View/));
    fireEvent.click(screen.getAllByRole("button", { name: /Review/ })[1]);
    expect(tab(/Value Proof/)).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(tab(/Executive View/));
    fireEvent.click(screen.getAllByRole("button", { name: /Review/ })[2]);
    expect(tab(/Evidence & Actions/)).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the Evidence & Actions tab-specific contract layout", () => {
    const { container } = renderPage();
    fireEvent.click(tab(/Evidence & Actions/));
    expect(
      screen.getByText("Three populations, three names"),
    ).toBeInTheDocument();
    expect(screen.getByText("Action campaigns")).toBeInTheDocument();
    expect(container).toHaveTextContent(
      /open tasks · campaigns show affected records/,
    );
    expect(container).not.toHaveTextContent(/1–3 sequential/);
    expect(screen.getByText("Assets")).toBeInTheDocument();
    expect(screen.getAllByText("Claims").length).toBeGreaterThan(0);
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText("Rows")).toBeInTheDocument();
    expect(screen.getByText("Evidence-owner queue")).toBeInTheDocument();
    expect(screen.getByText("Projection reconciliation")).toBeInTheDocument();
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
    fireEvent.click(tab(/Evidence & Actions/));

    expect(screen.getByText("Source contract actions")).toBeInTheDocument();
    expect(
      screen.getByText("Archive dormant source licenses before true-up"),
    ).toBeInTheDocument();
    expect(screen.getByText("$99M")).toBeInTheDocument();
  });

  it("opens the program drawer from Value Proof decision lanes", () => {
    renderPage();
    fireEvent.click(tab(/Value Proof/));
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
    fireEvent.click(tab(/AI Portfolio/));
    const firstAi = [...view.allInitiatives].sort(
      (a, b) => b.aiSpendUsd - a.aiSpendUsd || b.riskScore - a.riskScore,
    )[0]!;
    clickFirstButtonContaining(firstAi.name);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Value potential")).toBeInTheDocument();
    expect(within(drawer).getAllByText(/\/100/).length).toBeGreaterThan(0);
  });

  it("opens the evidence gap drawer from the owner queue", () => {
    renderPage();
    fireEvent.click(tab(/Evidence & Actions/));
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
    fireEvent.click(tab(/Evidence & Actions/));
    fireEvent.click(
      screen.getByRole("button", { name: /Usage telemetry connection/ }),
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
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });
});
