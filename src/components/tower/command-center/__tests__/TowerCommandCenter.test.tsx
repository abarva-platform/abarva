/**
 * @jest-environment jsdom
 */

// Behaviour test for the Command Center client root: every tab, every sub-view
// and every drawer, driven against the design fixture through the real
// mart → view-model mapper.

import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { formatUsdM } from "@/lib/tower/command-center/format";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenter } from "../TowerCommandCenter";
import { topVendorAttribution } from "../views/AiPortfolioView";

const replace = jest.fn();
const replaceState = jest.spyOn(window.history, "replaceState");

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
if (!view) {
  throw new Error("design fixture must build a Tower command-center view");
}

function renderPage() {
  return render(
    <TowerCommandCenter
      view={view}
      tenantName="Fixture Tenant"
      refreshedOn="2026-07-23"
    />,
  );
}

function renderDenseAiPage() {
  const denseAi = Array.from({ length: 14 }, (_, i) => {
    const base = view!.ai[i % view!.ai.length];
    return {
      ...base,
      id: `dense-ai-${i + 1}`,
      n: i + 1,
      name:
        i === 13
          ? "Workflow Prior Authorization AI"
          : `Dense AI Initiative ${String(i + 1).padStart(2, "0")}`,
      valueScore: 100 - i,
      readinessScore: 90 - i,
    };
  });

  return render(
    <TowerCommandCenter
      view={{ ...view!, ai: denseAi }}
      tenantName="Fixture Tenant"
      refreshedOn="2026-07-23"
    />,
  );
}

function tab(name: RegExp) {
  return screen.getByRole("tab", { name });
}

describe("TowerCommandCenter", () => {
  beforeEach(() => {
    replace.mockClear();
    replaceState.mockClear();
    window.history.replaceState(null, "", "/tower/command");
  });

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
      "Recommended Actions total",
    ]);
    expect(tab(/Command Center/)).toHaveAttribute("aria-selected", "true");
  });

  it("opens on Command Center with the CFO outcome proof cockpit", () => {
    renderPage();
    expect(screen.getByText("Board value posture")).toBeInTheDocument();
    expect(screen.getByText("Claimable today")).toBeInTheDocument();
    expect(
      screen.getByText("Finance validated but blocked"),
    ).toBeInTheDocument();
    expect(screen.getByText("Read model scope")).toBeInTheDocument();
    expect(
      screen.getByText("Investment to value conversion"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Eight-quarter value trajectory"),
    ).toBeInTheDocument();
    expect(screen.getByText("Portfolio decision matrix")).toBeInTheDocument();
    expect(screen.getByText("Proof operations")).toBeInTheDocument();
    expect(screen.getByLabelText("Evidence-owner queue")).toBeInTheDocument();
    expect(screen.getByLabelText("Source trust rail")).toBeInTheDocument();
    expect(
      screen.getAllByText(/board-scope value cases/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/tracked program subjects/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/AI tools, agents and linked capabilities/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/total evidence actions/)).toBeInTheDocument();
    expect(screen.getByText(/current priority actions/)).toBeInTheDocument();
    expect(screen.getByText(/grouped action campaigns/)).toBeInTheDocument();
    expect(screen.queryByText("Proof gate summary")).not.toBeInTheDocument();
    expect(screen.queryByText("aVa synthesis strip")).not.toBeInTheDocument();
    expect(
      screen.getAllByText(formatUsdM(view.summary.claimableUsd)).length,
    ).toBeGreaterThan(0);
  });

  it("moves between tabs with arrow keys and reflects the tab in the URL", () => {
    renderPage();
    const first = tab(/Command Center/);
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(tab(/Value Proof/)).toHaveAttribute("aria-selected", "true");
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/tower/command?tab=funnel",
    );
  });

  it("renders the Value Proof blockers table sorted by blocked dollars", () => {
    renderPage();
    fireEvent.click(tab(/Value Proof/));
    expect(screen.getByText("Outcome proof waterfall")).toBeInTheDocument();
    expect(screen.getByText("Source-backed benefit chain")).toBeInTheDocument();
    expect(
      screen.getByText("Finance-calculated but blocked"),
    ).toBeInTheDocument();
    expect(screen.getByText("Top evidence blockers")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("Missing baseline")).toBeInTheDocument();
  });

  it("switches Decision Lanes between its three sub-views", () => {
    renderPage();
    fireEvent.click(tab(/Decision Lanes/));
    expect(screen.getByText("Portfolio decision topology")).toBeInTheDocument();
    expect(screen.getByText("Programs")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Program table" }));
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
    fireEvent.click(screen.getByRole("radio", { name: "Program table" }));
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
    expect(
      screen.getByText("Tools, agents and capabilities"),
    ).toBeInTheDocument();
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

  it("keeps dense AI bubble matrices to the top 10 while the side list remains complete", () => {
    renderDenseAiPage();
    fireEvent.click(tab(/AI Portfolio/));
    fireEvent.click(screen.getByRole("radio", { name: "Usage & Value Proof" }));

    expect(
      screen.getByText(/10 on matrix .* 14 in filtered list/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /14 Workflow Prior Authorization AI/,
      }),
    ).toBeInTheDocument();
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
    expect(screen.getByText("Question 2 of 4")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("radio", { name: /Who owns the missing proof/ }),
    );
    expect(screen.getByText("Question 3 of 4")).toBeInTheDocument();
    // Evidence ownership is grouped by accountable role rather than rendering
    // repetitive per-program "Unknown" rows.
    expect(screen.getByText(/accountable owner groups/)).toBeInTheDocument();
    expect(screen.getAllByText(/claim-gate gaps/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Unassigned")).toBeNull();

    fireEvent.click(
      screen.getByRole("radio", { name: /What decision is blocked/ }),
    );
    expect(screen.getByText("Question 4 of 4")).toBeInTheDocument();
    expect(
      screen.getByText(/Scale, fund, freeze, and stop decisions wait/),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Proof work before decision/).length,
    ).toBeGreaterThan(0);
  });

  it('answers "what is missing" from the claim chain, not the ETL backlog', () => {
    renderPage();
    fireEvent.click(tab(/Evidence/));
    fireEvent.click(screen.getByRole("radio", { name: /What is missing/ }));

    // Every answer names a program and the dollar it holds up. None of them is
    // a pipeline instruction — "rerun the projection" must never reach a CXO.
    expect(screen.getByText(/at stake/)).toBeInTheDocument();
    expect(
      screen.queryByText(/rerun the governed Tower value-model projection/i),
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

  it("reaches beyond the Top-10 default via capability inventory + search", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));

    // The executive default caps the matrix at 10. Table mode must expose the
    // whole portfolio, otherwise rows 11+ are unreachable in the UI even
    // though the mart holds them.
    fireEvent.click(
      screen.getByRole("radio", { name: "Capability inventory" }),
    );
    const rows = within(screen.getByRole("table")).getAllByRole("button", {
      name: /^Open /,
    });
    expect(rows.length).toBeGreaterThan(10);

    // Search narrows to a specific capability without scrolling the table.
    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Search AI tools, agents and capabilities",
      }),
      { target: { value: "fraud graph" } },
    );
    const narrowed = within(screen.getByRole("table")).getAllByRole("button", {
      name: /^Open /,
    });
    expect(narrowed).toHaveLength(1);
    expect(narrowed[0]).toHaveAccessibleName("Open Fraud Graph Analytics v2");
  });

  it("searches vendor and system, not just the capability name", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
    fireEvent.click(
      screen.getByRole("radio", { name: "Capability inventory" }),
    );
    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Search AI tools, agents and capabilities",
      }),
      { target: { value: "Vendor H" } },
    );
    const hits = within(screen.getByRole("table")).getAllByRole("button", {
      name: /^Open /,
    });
    expect(hits).toHaveLength(1);
    expect(hits[0]).toHaveAccessibleName("Open Cloud AI Services");
  });

  it("reports how much of the portfolio a search matched", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "Search AI tools, agents and capabilities",
      }),
      { target: { value: "copilot" } },
    );
    expect(screen.getByText(/of \d+ capabilities match/)).toBeInTheDocument();
  });

  it("surfaces vendor attribution on the default AI Portfolio overview", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));

    const vendorStrip = screen.getByLabelText("Top attributed AI vendors");
    const [topVendor] = topVendorAttribution(view!.allInitiatives);
    expect(vendorStrip).toBeInTheDocument();
    expect(within(vendorStrip).getByText(topVendor.vendor)).toBeInTheDocument();
    expect(
      within(vendorStrip).getByText(formatUsdM(topVendor.spendUsd)),
    ).toBeInTheDocument();
  });

  it("opens the program drawer with its value proof chain, and closes on Escape", () => {
    renderPage();
    fireEvent.click(tab(/Decision Lanes/));
    fireEvent.click(screen.getByRole("radio", { name: "Program table" }));
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
      "Explicit benefit",
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

  it("opens the AI capability drawer from the active portfolio legend", () => {
    renderPage();
    fireEvent.click(tab(/AI Portfolio/));
    fireEvent.click(screen.getByRole("radio", { name: "Usage & Value Proof" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Fraud Graph Analytics v2/ }),
    );

    const drawer = screen.getByRole("dialog");
    expect(within(drawer).getByText(/AI capability/)).toBeInTheDocument();
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
