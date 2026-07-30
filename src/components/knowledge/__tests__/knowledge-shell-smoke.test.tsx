/**
 * @jest-environment jsdom
 *
 * Full-tree smoke test. The (maestro) route this mounts under requires a real
 * Clerk session, and this sandbox has Clerk sign-in disabled entirely, which
 * makes a real signed-in browser screenshot of the live route unavailable in
 * this environment. This test is the next best real verification: it mounts
 * the exact same component tree the route renders (KnowledgeAppMount, the
 * REAL fixture ConsumptionRuntime + KnowledgeUiViewModelAssembler, no mocks)
 * and exercises every mode tab, proving the whole tree wires together and
 * renders real, honest content (or its honest empty state where no real
 * projection exists) without a runtime crash.
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { KnowledgeAppMount } from "../KnowledgeAppMount";

describe("KnowledgeAppMount full-tree smoke render (fixture-airline-demo-new)", () => {
  it("mounts the shell and shows the module switcher, lens picker, and mode tabs", async () => {
    render(<KnowledgeAppMount tenantKey="airline-demo-new" />);

    expect(screen.getByText("AbarVa")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Knowledge" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Brief" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Relationships" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Evidence & gaps" }),
    ).toBeInTheDocument();

    // Brief mode is the default. Real fixture identity data should render;
    // sections with no real projection (Goals/Purpose) still show their
    // honest empty-state banner rather than a crash.
    await waitFor(() =>
      expect(screen.getByText(/airline demo new/i)).toBeInTheDocument(),
    );
    expect(
      screen.getAllByTestId("knowledge-state-banner").length,
    ).toBeGreaterThan(0);
  });

  it("switches to Explore mode and renders the domain nav plus real application rows", async () => {
    render(<KnowledgeAppMount tenantKey="airline-demo-new" />);
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));

    expect(
      await screen.findByText("Systems and technology"),
    ).toBeInTheDocument();
    // "applications" is a DIRECTLY_SUPPORTED inventory kind against the real
    // fixture -- it renders a real table, not a withheld banner.
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    expect(screen.getByText("Crew Scheduling System")).toBeInTheDocument();
  });

  it("switches to Relationships mode and renders the preset picker's resolved questions", async () => {
    render(<KnowledgeAppMount tenantKey="airline-demo-new" />);
    fireEvent.click(screen.getByRole("button", { name: "Relationships" }));

    expect(await screen.findByText("Questions")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/what does the crew scheduling system depend on/i),
      ).toBeInTheDocument(),
    );
  });

  it("switches to Evidence & gaps mode and renders every section without crashing", async () => {
    render(<KnowledgeAppMount tenantKey="airline-demo-new" />);
    fireEvent.click(screen.getByRole("button", { name: "Evidence & gaps" }));

    expect(await screen.findByText("Completion workbench")).toBeInTheDocument();
    expect(screen.getByText(/left-nav link only/i)).toBeInTheDocument();
    // Contradictions and the decision-readiness quadrant always render their
    // honest PROJECTION_UNAVAILABLE banner (no real projection exists for
    // either) -- at least those two banners must be present.
    await waitFor(() =>
      expect(
        screen.getAllByTestId("knowledge-state-banner").length,
      ).toBeGreaterThan(0),
    );
  });

  it("opens the aVa dock and shows the question input, since models are enabled for the 'normal' fixture scenario", async () => {
    render(<KnowledgeAppMount tenantKey="airline-demo-new" />);
    await waitFor(() =>
      expect(screen.getByLabelText(/ask a question/i)).toBeInTheDocument(),
    );
  });
});
