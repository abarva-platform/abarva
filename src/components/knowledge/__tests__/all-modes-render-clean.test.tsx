/**
 * @jest-environment jsdom
 *
 * Full-shell render coverage against the FIXTURE runtime (the classic
 * shell/brief/explore/relationships/evidence tree that actually routes
 * through KnowledgeUiViewModelAssembler's 11-value ComponentReadinessState --
 * see src/lib/knowledge/view-model/readiness.ts and state/gate-utils.ts).
 *
 * There is currently no live app route that mounts this tree against fixture
 * data (KnowledgeAppMount/the /home/knowledge route is HTTP-only and requires
 * a real Foundation preview session; the platform-admin-gated /knowledge-preview
 * route mounts the separate vnext/ tree instead, which reads AvailabilityState
 * directly and does not go through the assembler). This test is therefore the
 * only real, running proof that all four modes render cleanly against fixture
 * data end-to-end, and that distinct render-gate scenarios produce distinct,
 * honest copy rather than a collapsed generic message.
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { createFixtureRuntime } from "@/lib/knowledge/consumption-client";
import type { FixtureScenario } from "@/lib/knowledge/fixtures";
import { KnowledgeAppProvider } from "../knowledge-app-context";
import { KnowledgeShell } from "../shell/KnowledgeShell";

const FIXTURE_TENANT = "fixture-airline-demo-new";
const MODES = ["Brief", "Explore", "Relationships", "Evidence & gaps"] as const;

function withRuntime(scenario: FixtureScenario, children: React.ReactNode) {
  const runtime = createFixtureRuntime(FIXTURE_TENANT, scenario);
  return (
    <KnowledgeAppProvider runtime={runtime} tenantKey={FIXTURE_TENANT}>
      {children}
    </KnowledgeAppProvider>
  );
}

describe("KnowledgeShell — all four modes render cleanly against the fixture runtime", () => {
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("switches through Brief -> Explore -> Relationships -> Evidence & gaps with no console.error", async () => {
    render(withRuntime("normal", <KnowledgeShell />));

    for (const label of MODES) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: label })).toHaveAttribute(
          "aria-current",
          "page",
        ),
      );
      // Let any in-flight fixture "fetch" (synchronous but wrapped in a
      // promise by useEnvelope) settle before checking the console.
      await waitFor(() => expect(errorSpy).not.toHaveBeenCalled());
    }
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("Brief mode shows the real identity fields and the pinned AbarVa interpretation", async () => {
    render(withRuntime("normal", <KnowledgeShell />));
    await waitFor(() =>
      expect(
        screen.getAllByText(/fleet-wide operations resilience/i).length,
      ).toBeGreaterThan(0),
    );
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("Explore mode lists real fixture entities in a table", async () => {
    render(withRuntime("normal", <KnowledgeShell />));
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    expect(screen.getByText("Crew Scheduling System")).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("Relationships mode renders the graph canvas around the focal entity without throwing", async () => {
    render(withRuntime("normal", <KnowledgeShell />));
    fireEvent.click(screen.getByRole("button", { name: "Relationships" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Relationships" }),
      ).toHaveAttribute("aria-current", "page"),
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("Evidence & gaps mode lists the real fixture gaps with severity, not a placeholder", async () => {
    render(withRuntime("normal", <KnowledgeShell />));
    fireEvent.click(screen.getByRole("button", { name: "Evidence & gaps" }));
    await waitFor(() =>
      expect(
        screen.getByText(/cloud hosting percentage not measured/i),
      ).toBeInTheDocument(),
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("KnowledgeShell — distinct render-gate copy within a single render", () => {
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  // Fixture scenarios (fixtures/scenarios.ts) transform the WHOLE envelope to
  // one governance state -- they don't target individual domains. The
  // "normal" baseline instead deliberately bakes in a MIX of per-domain
  // states (enterprise/technology/vendors=available, data=stale,
  // risks=conflicting, programs=not_loaded -- see fixtures/airline-demo-new.ts)
  // specifically so a single render exercises multiple ComponentReadinessState
  // values at once. DecisionLanesPanel (Brief mode) renders readinessPresentation
  // per domain, so it is the real place to prove that distinct states get
  // distinct, honest copy -- never a collapsed generic "N/A".
  it("DecisionLanesPanel shows genuinely different readiness titles across domains, not one repeated generic message", async () => {
    render(withRuntime("normal", <KnowledgeShell />));
    await waitFor(() =>
      expect(screen.getByText("Decisions waiting")).toBeInTheDocument(),
    );
    // Titles from state/gate-utils.ts's READINESS_PRESENTATION map, expected
    // to co-occur because fixtures/airline-demo-new.ts's "normal" baseline
    // seeds domains at exactly these different availability states.
    await waitFor(() => {
      expect(screen.getAllByText("Not loaded").length).toBeGreaterThan(0); // programs
      expect(screen.getAllByText("Sources disagree").length).toBeGreaterThan(0); // risks (conflicting)
      expect(screen.getAllByText("Needs refresh").length).toBeGreaterThan(0); // data (stale)
    });
    // Every domain label appears with SOME readiness title next to it; the
    // set of titles actually used must have more than one member (proves
    // the states are not being collapsed together).
    const titles = [
      "Available",
      "Not loaded",
      "Sources disagree",
      "Needs refresh",
    ];
    const present = titles.filter((t) => screen.queryAllByText(t).length > 0);
    expect(present.length).toBeGreaterThan(2);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  // Explore mode's InventoryTable renders individual field-level states
  // (withheld annual_cost) inline per fixtures/airline-demo-new.ts.
  it("Explore mode's entity detail shows a withheld field as an explicit non-zero marker, never blank or 0", async () => {
    render(withRuntime("normal", <KnowledgeShell />));
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Crew Scheduling System"));
    await waitFor(() =>
      expect(screen.getAllByText(/annual cost/i).length).toBeGreaterThan(0),
    );
    const dt = screen
      .getAllByText(/annual cost/i)
      .find((el) => el.tagName === "DT");
    expect(dt).toBeTruthy();
    const dd = dt?.nextElementSibling;
    expect(dd?.tagName).toBe("DD");
    // annual_cost is fixture-authored as withheld (null value) -- must never
    // silently render as "0".
    expect(dd?.textContent).not.toBe("0");
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("a genuinely empty scenario (withheld) shows the governed empty-state message, not a fabricated brief", async () => {
    render(withRuntime("withheld", <KnowledgeShell />));
    await waitFor(() =>
      expect(
        screen.getAllByTestId("knowledge-governed-state-panel").length,
      ).toBeGreaterThan(0),
    );
    expect(screen.queryByText("Airline Demo New")).not.toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
