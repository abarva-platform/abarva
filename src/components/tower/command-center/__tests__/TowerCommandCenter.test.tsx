/**
 * @jest-environment jsdom
 */

// Behaviour test for the Command Center client root: every tab, every sub-view
// and every drawer, driven against the design fixture through the real
// mart → view-model mapper.

import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenter } from "../TowerCommandCenter";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: (...args: unknown[]) => replace(...args) }),
  usePathname: () => "/tower/command",
  useSearchParams: () => new URLSearchParams(),
}));

// Recharts measures its container; jsdom reports 0×0, so ResponsiveContainer
// renders nothing. Stub it to a fixed box so the figures actually mount and a
// crash inside a chart is caught here rather than only in the browser.
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={800} height={400}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

const view = buildTowerCommandCenterView(designFixtureMart(), {
  tenantName: "Fixture Tenant",
});

function renderPage() {
  return render(
    <TowerCommandCenter
      view={view}
      tenantName="Fixture Tenant"
      refreshedOn="2026-07-23"
    />,
  );
}

function tab(name: RegExp) {
  return screen.getByRole("tab", { name });
}

describe("TowerCommandCenter", () => {
  beforeEach(() => replace.mockClear());

  it("renders the six tabs as a real tablist", () => {
    renderPage();
    const tabs = screen.getAllByRole("tab");
    const label = (t: HTMLElement) =>
      (t.textContent ?? "")
        .replace(/needs attention/g, "")
        .replace(/\d+/g, "")
        .trim();
    expect(tabs.map(label)).toEqual([
      "Command Center",
      "Value Proof",
      "Decision Lanes",
      "AI Portfolio",
      "Evidence",
      "Recommended Actions",
    ]);
    expect(tab(/Command Center/)).toHaveAttribute("aria-selected", "true");
  });

  it("opens on Command Center with the four posture tiles", () => {
    renderPage();
    expect(screen.getByText("Spend posture")).toBeInTheDocument();
    expect(screen.getByText("Value posture")).toBeInTheDocument();
    expect(screen.getByText("Risk posture")).toBeInTheDocument();
    expect(screen.getByText("Decision posture")).toBeInTheDocument();
    // $650M budget, $0 claimable — both read from the mart, not recomputed.
    // Appears twice by design: the Spend posture hero and the week-read line.
    expect(screen.getAllByText("$650M").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
  });

  it("moves between tabs with arrow keys and reflects the tab in the URL", () => {
    renderPage();
    const first = tab(/Command Center/);
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(tab(/Value Proof/)).toHaveAttribute("aria-selected", "true");
    expect(replace).toHaveBeenCalledWith("/tower/command?tab=funnel", {
      scroll: false,
    });
  });

  it("renders the Value Proof blockers table sorted by blocked dollars", () => {
    renderPage();
    fireEvent.click(tab(/Value Proof/));
    expect(screen.getByText("Where the value disappears")).toBeInTheDocument();
    const table = screen.getByRole("table");
    const openButtons = within(table).getAllByRole("button", {
      name: /^Open /,
    });
    expect(openButtons[0]).toHaveAccessibleName("Open Risk & Compliance AI");
    expect(openButtons).toHaveLength(5);
  });

  it("switches Decision Lanes between its three sub-views", () => {
    renderPage();
    fireEvent.click(tab(/Decision Lanes/));
    expect(
      screen.getByText("All programs — the decision table"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Kanban lanes" }));
    expect(
      screen.getByRole("region", { name: "Fund lane" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Stop lane" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Portfolio heatmap" }));
    expect(screen.getByText("Programs")).toBeInTheDocument();
  });

  it("reclassifies a funded line with no promised value into the Watch bucket", () => {
    renderPage();
    fireEvent.click(tab(/Decision Lanes/));
    const row = screen.getByRole("row", { name: /Core Banking Platform/ });
    expect(within(row).getByText("Watch")).toBeInTheDocument();
  });

  it("switches AI Portfolio between its four sub-views and applies the type filter", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
    expect(
      screen.getByRole("region", { name: /Candidate Pipeline/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 shown of 5 candidates")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Usage & Value Proof" }));
    expect(screen.getByText("Initiatives")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Fraud Graph Analytics v2/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Governance" }));
    expect(
      screen.queryByRole("button", { name: /Fraud Graph Analytics v2/ }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /Data Lineage & Governance/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Candidate Pipeline" }));
    // The Top-5 cap caption repeats per candidate row, so assert presence, not uniqueness.
    expect(
      screen.getAllByText(/Top 5 by governed value\/readiness policy/).length,
    ).toBeGreaterThan(0);
  });

  it("hides the type filter on Spend Attribution, which is a whole-portfolio view", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
    expect(
      screen.getByRole("radiogroup", { name: "AI spend type filter" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Spend Attribution" }));
    expect(
      screen.queryByRole("radiogroup", { name: "AI spend type filter" }),
    ).toBeNull();
  });

  it("answers one Evidence question at a time", () => {
    renderPage();
    fireEvent.click(tab(/Evidence/));
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("radio", { name: /Who owns the missing proof/ }),
    );
    expect(screen.getByText("Question 3 of 4")).toBeInTheDocument();
    // Business evidence gaps resolve to the owning role the mart records for
    // the program (finance owner for validation/claim gaps), so every gap has a
    // named owner rather than falling to "Unassigned".
    expect(screen.getAllByText(/gaps? to close/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Unassigned")).toBeNull();
  });

  it('answers "what is missing" from the claim chain, not the ETL backlog', () => {
    renderPage();
    fireEvent.click(tab(/Evidence/));
    fireEvent.click(screen.getByRole("radio", { name: /What is missing/ }));

    // Every answer names a program and the dollar it holds up. None of them is
    // a pipeline instruction — "rerun the projection" must never reach a CXO.
    expect(screen.getByText(/at stake/)).toBeInTheDocument();
    expect(
      screen.queryByText(/rerun the governed Tower mart projection/i),
    ).toBeNull();
    expect(screen.queryByText("Data Office")).toBeNull();
  });

  it("groups Recommended Actions into five owner columns and loses none", () => {
    renderPage();
    fireEvent.click(tab(/Recommended Actions/));
    for (const label of [
      "CFO",
      "CIO",
      "CDAO",
      "Model Risk Office",
      "Procurement & business owners",
    ]) {
      expect(screen.getByRole("region", { name: label })).toBeInTheDocument();
    }
    const cards = screen
      .getAllByRole("button")
      .filter(
        (b) =>
          b.textContent?.includes("Linked") ||
          b.textContent?.includes("Routes to"),
      );
    expect(cards).toHaveLength(designFixtureMart().cxoActions.length);
  });

  it("opens the program drawer with its value proof chain, and closes on Escape", () => {
    renderPage();
    fireEvent.click(tab(/Decision Lanes/));
    fireEvent.click(
      screen.getByRole("button", { name: "Open Risk & Compliance AI" }),
    );

    const drawer = screen.getByRole("dialog");
    expect(
      within(drawer).getByText("Risk & Compliance AI"),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("Value proof chain")).toBeInTheDocument();
    // 'Finance-validated' and 'Claimable' appear twice by design — once in the
    // 4-up stat grid, once as a proof-chain row.
    for (const stage of [
      "Promised",
      "Usage-supported",
      "Finance-validated",
      "Claimable",
      "Blocked",
    ]) {
      expect(within(drawer).getAllByText(stage).length).toBeGreaterThan(0);
    }

    // Escape closes it: the panel goes aria-hidden, so it leaves the
    // accessibility tree entirely rather than lingering as an off-screen dialog.
    fireEvent.keyDown(drawer, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Value proof chain")).toBeNull();
  });

  it("opens the AI initiative drawer from the active portfolio legend", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
    fireEvent.click(screen.getByRole("radio", { name: "Usage & Value Proof" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Fraud Graph Analytics v2/ }),
    );

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Value potential")).toBeInTheDocument();
    expect(within(drawer).getByText("92/100")).toBeInTheDocument();
  });

  it("opens the evidence gap drawer with its audit trace", () => {
    renderPage();
    fireEvent.click(tab(/Evidence/));
    fireEvent.click(screen.getByRole("radio", { name: /What is missing/ }));
    const [firstGap] = screen.getAllByText("View audit trace →");
    fireEvent.click(firstGap);

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText("Audit trace")).toBeInTheDocument();
    expect(within(drawer).getByText("Why it matters")).toBeInTheDocument();
  });

  it("disables Approve & route, because no governed Tower → Moves path exists", () => {
    renderPage();
    fireEvent.click(tab(/Recommended Actions/));
    fireEvent.click(screen.getAllByText(/Attest the avoidance method/)[0]);

    const drawer = screen.getByRole("dialog");
    const approve = within(drawer).getByRole("button", {
      name: /Approve & route/,
    });
    expect(approve).toBeDisabled();
    expect(
      within(drawer).getByText(/Routing is not available yet/),
    ).toBeInTheDocument();

    // And it must NOT show a confirmation for work that did not happen.
    fireEvent.click(approve);
    expect(within(drawer).queryByText(/Routed to/)).toBeNull();
  });
});

describe("TowerCommandCenter — empty tenant", () => {
  it("renders an honest empty state instead of zeros", () => {
    render(
      <TowerCommandCenter
        view={null}
        tenantName="Empty Tenant"
        refreshedOn="2026-07-23"
      />,
    );
    expect(
      screen.getByText("No governed Tower data for this tenant"),
    ).toBeInTheDocument();
    expect(screen.getByText(/a zero would be a claim/)).toBeInTheDocument();
    // The shell still renders — header and tabs stay usable.
    expect(screen.getAllByRole("tab")).toHaveLength(6);
  });
});
