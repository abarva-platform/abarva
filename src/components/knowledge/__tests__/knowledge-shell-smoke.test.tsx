/**
 * @jest-environment jsdom
 *
 * Full-tree smoke test. The (maestro) route this mounts under requires a real
 * Clerk session, and this sandbox has Clerk sign-in disabled entirely
 * (ACCESSIBILITY_AXE_DISABLE_CLERK=1 only bypasses Clerk on already-public
 * routes -- src/proxy.ts's shouldBypassClerkForAxe -- it does not open
 * /home/knowledge, which stays behind the auth allowlist by design). That
 * makes a real signed-in browser screenshot of the live route unavailable in
 * this environment. This test is the next best real verification: it mounts
 * the exact same component tree the route renders (KnowledgeAppMount, the
 * real createUnreconciledGovernedKnowledgeProvider, no mocks) and exercises
 * every mode tab, proving the whole tree wires together and renders its
 * honest empty state without a runtime crash.
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { KnowledgeAppMount } from "../KnowledgeAppMount";

describe("KnowledgeAppMount full-tree smoke render", () => {
  it("mounts the shell for airline-demo-new and shows the module switcher, lens picker, and mode tabs", async () => {
    render(
      <KnowledgeAppMount
        tenantKey="airline-demo-new"
        knowledgeBaselineRef="test-baseline"
      />,
    );

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

    // Brief mode is the default and must show real gated content, not a crash.
    await waitFor(() =>
      expect(
        screen.getAllByTestId("knowledge-state-banner").length,
      ).toBeGreaterThan(0),
    );
  });

  it("switches to Explore mode and renders the domain nav + a withheld inventory panel", async () => {
    render(
      <KnowledgeAppMount
        tenantKey="airline-demo-new"
        knowledgeBaselineRef="test-baseline"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));

    expect(
      await screen.findByText("Systems and technology"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/withheld pending pipeline/i),
      ).toBeInTheDocument(),
    );
  });

  it("switches to Relationships mode and renders the preset picker's withheld state", async () => {
    render(
      <KnowledgeAppMount
        tenantKey="airline-demo-new"
        knowledgeBaselineRef="test-baseline"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Relationships" }));

    expect(await screen.findByText("Questions")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getAllByTestId("knowledge-state-banner").length,
      ).toBeGreaterThan(0),
    );
  });

  it("switches to Evidence & gaps mode and renders every section's withheld state without crashing", async () => {
    render(
      <KnowledgeAppMount
        tenantKey="airline-demo-new"
        knowledgeBaselineRef="test-baseline"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Evidence & gaps" }));

    expect(await screen.findByText("Completion workbench")).toBeInTheDocument();
    expect(screen.getByText(/left-nav link only/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getAllByTestId("knowledge-state-banner").length,
      ).toBeGreaterThan(3),
    );
  });

  it("opens the aVa dock and shows the packet-not-available banner instead of proceeding silently", async () => {
    render(
      <KnowledgeAppMount
        tenantKey="airline-demo-new"
        knowledgeBaselineRef="test-baseline"
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByText(/knowledge packet not yet available for this tenant/i),
      ).toBeInTheDocument(),
    );
  });
});
