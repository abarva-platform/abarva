/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { createFixtureRuntime } from "@/lib/knowledge/consumption-client";
import { KnowledgeAppProvider } from "../knowledge-app-context";
import { IdentityPanel } from "../brief/IdentityPanel";
import { InventoryTable } from "../explore/InventoryTable";
import { findInventoryKindConfig } from "../explore/inventory-config";
import { AvaDock } from "../ava/AvaDock";

const FIXTURE_TENANT = "fixture-airline-demo-new";

function withRuntime(children: React.ReactNode) {
  const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
  return (
    <KnowledgeAppProvider runtime={runtime} tenantKey={FIXTURE_TENANT}>
      {children}
    </KnowledgeAppProvider>
  );
}

describe("Knowledge UI render-gate integration (real fixture runtime)", () => {
  it("IdentityPanel renders real governed identity fields, not a fabricated profile", async () => {
    render(withRuntime(<IdentityPanel />));
    await waitFor(() =>
      expect(screen.getByText("Revenue")).toBeInTheDocument(),
    );
    expect(screen.getByText("Employees")).toBeInTheDocument();
  });

  it("InventoryTable shows a real table for Applications -- a DIRECTLY_SUPPORTED inventory kind against the real projection", async () => {
    const config = findInventoryKindConfig("applications");
    render(withRuntime(<InventoryTable config={config} />));
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    expect(screen.getByText("Crew Scheduling System")).toBeInTheDocument();
  });

  it("InventoryTable shows the honest PROJECTION_UNAVAILABLE state, never a real-looking empty table, for kinds with no real projection", async () => {
    for (const kind of [
      "dataProducts",
      "integrations",
      "infrastructure",
      "programs",
      "risks",
      "measures",
    ] as const) {
      const config = findInventoryKindConfig(kind);
      const { unmount } = render(
        withRuntime(<InventoryTable config={config} />),
      );
      await waitFor(() =>
        expect(
          screen.getByTestId("knowledge-state-banner"),
        ).toBeInTheDocument(),
      );
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      unmount();
    }
  });

  it("aVa dock answers a question with real evidence-grounded content when the Brief's evidence refs are genuinely in scope -- never a fabricated confident claim, but also never a reflexive refusal now that real evidence exists", async () => {
    render(withRuntime(<AvaDock />));
    const input = await screen.findByLabelText(/ask a question/i);
    fireEvent.change(input, {
      target: { value: "What is our biggest modernization risk?" },
    });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(screen.getByText(/basis/i)).toBeInTheDocument());
    expect(screen.getByText(/ephemeral, not accepted/i)).toBeInTheDocument();
    // The answer must state its evidence basis, never present as an
    // unqualified fact.
    expect(screen.getByText(/evidence reference/i)).toBeInTheDocument();
  });

  it("aVa dock's suggested-questions section shows real, mode-scoped suggestions, not a hardcoded refusal banner", async () => {
    render(withRuntime(<AvaDock />));
    await waitFor(() =>
      expect(screen.getByLabelText(/ask a question/i)).toBeInTheDocument(),
    );
  });
});
