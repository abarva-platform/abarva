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
    const labels = screen
      .getAllByRole("tab")
      .map((node) =>
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
    expect(screen.getByText("IT Investment Tower · FY26 · Today's verdict")).toBeInTheDocument();
    expect(screen.getByText("Decisions for this review")).toBeInTheDocument();
    expect(screen.getByText("Where the value is lost")).toBeInTheDocument();
    expect(screen.getByText("The drop is the finding")).toBeInTheDocument();
    expect(screen.getByText("Ceiling on any sign-off today")).toBeInTheDocument();
    expect(screen.getAllByText(formatUsdM(view.summary.claimableUsd)).length).toBeGreaterThan(0);
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
    expect(screen.getByText("Investment to value conversion")).toBeInTheDocument();
    expect(screen.getByText("Eight-quarter trajectory")).toBeInTheDocument();
    expect(screen.getByText("Claim ledger")).toBeInTheDocument();
    expect(screen.getByText("Decision lanes")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders the AI Portfolio tab-specific contract layout", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
    expect(screen.getByText("AI portfolio")).toBeInTheDocument();
    expect(screen.getByText("Attributed spend by vendor")).toBeInTheDocument();
    expect(screen.getByText("Cost findings · evidenced")).toBeInTheDocument();
    expect(screen.getByText(/Cost lens/)).toBeInTheDocument();
  });

  it("renders the Evidence & Actions tab-specific contract layout", () => {
    renderPage();
    fireEvent.click(tab(/Evidence & Actions/));
    expect(screen.getByText("Three populations, three names")).toBeInTheDocument();
    expect(screen.getByText("Action campaigns")).toBeInTheDocument();
    expect(screen.getByText("Evidence-owner queue")).toBeInTheDocument();
    expect(screen.getByText("Projection reconciliation")).toBeInTheDocument();
  });

  it("opens the program drawer from Value Proof decision lanes", () => {
    renderPage();
    fireEvent.click(tab(/Value Proof/));
    const firstProgram = [...view.programs].sort((a, b) => b.blockedUsd - a.blockedUsd)[0]!;
    clickFirstButtonContaining(firstProgram.name);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(firstProgram.name)).toBeInTheDocument();
    expect(within(drawer).getByText("Value proof chain")).toBeInTheDocument();
  });

  it("opens the AI initiative drawer from the portfolio spend list", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
    clickFirstButtonContaining("exposed at review");

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
    fireEvent.click(screen.getByRole("button", { name: /Usage telemetry connection/ }));

    const drawer = screen.getByRole("dialog");
    const approve = within(drawer).getByRole("button", {
      name: /Approve & route/,
    });
    expect(approve).toBeDisabled();
    expect(within(drawer).getByText(/Routing is not available yet/)).toBeInTheDocument();
  });
});

describe("TowerCommandCenter — empty tenant", () => {
  it("renders an honest empty state instead of zeros", () => {
    render(<TowerCommandCenter view={null} tenantName="Empty Tenant" />);
    expect(screen.getByText("No governed Tower data for this tenant")).toBeInTheDocument();
    expect(screen.getByText(/a zero would be a claim/)).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });
});
