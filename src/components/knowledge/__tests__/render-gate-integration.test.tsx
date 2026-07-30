/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { createUnreconciledGovernedKnowledgeProvider } from "@/lib/knowledge/providers/governed-knowledge-provider";
import { KnowledgeAppProvider } from "../knowledge-app-context";
import { IdentityPanel } from "../brief/IdentityPanel";
import { InventoryTable } from "../explore/InventoryTable";
import { findInventoryKindConfig } from "../explore/inventory-config";
import { AvaDock } from "../ava/AvaDock";

const CTX = {
  tenantKey: "airline-demo-new",
  knowledgeBaselineRef: "test-baseline",
};

function withProvider(children: React.ReactNode) {
  const provider = createUnreconciledGovernedKnowledgeProvider();
  return (
    <KnowledgeAppProvider provider={provider} providerCtx={CTX}>
      {children}
    </KnowledgeAppProvider>
  );
}

describe("Knowledge UI render-gate integration (real stub provider)", () => {
  it("IdentityPanel never renders fleet/departure numbers when the identity projection is withheld", async () => {
    render(withProvider(<IdentityPanel />));
    await waitFor(() =>
      expect(screen.getByTestId("knowledge-state-banner")).toBeInTheDocument(),
    );
    // No fabricated stat values from the prototype's mock data may leak through.
    expect(screen.queryByText(/142 aircraft/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,180/)).not.toBeInTheDocument();
  });

  it("InventoryTable shows 'withheld pending pipeline', never a real-looking empty table, for Applications", async () => {
    const config = findInventoryKindConfig("applications");
    render(withProvider(<InventoryTable config={config} />));
    await waitFor(() =>
      expect(screen.getByTestId("knowledge-state-banner")).toBeInTheDocument(),
    );
    expect(screen.getByText(/withheld pending pipeline/i)).toBeInTheDocument();
    // A real table element must not be rendered for withheld data.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Passenger service system/i),
    ).not.toBeInTheDocument();
  });

  it("InventoryTable shows the same honest withheld state for every inventory kind", async () => {
    for (const kind of [
      "dataProducts",
      "integrations",
      "infrastructure",
      "vendors",
      "programs",
      "risks",
      "measures",
    ] as const) {
      const config = findInventoryKindConfig(kind);
      const { unmount } = render(
        withProvider(<InventoryTable config={config} />),
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

  it("aVa dock asks a question and returns a real refusal card, never a fabricated confident answer", async () => {
    render(withProvider(<AvaDock />));
    const input = await screen.findByLabelText(/ask a question/i);
    fireEvent.change(input, {
      target: { value: "What is our cost per mishandled bag?" },
    });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(screen.getByText(/not answerable yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/declined -- insufficient evidence/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/what we will not do/i)).toBeInTheDocument();
    // The refusal card must not claim a governed answer exists.
    expect(screen.queryByText(/^answer$/i)).not.toBeInTheDocument();
  });

  it("aVa dock's packet banner shows 'not yet available for this tenant' rather than silently proceeding", async () => {
    render(withProvider(<AvaDock />));
    await waitFor(() =>
      expect(
        screen.getByText(/knowledge packet not yet available for this tenant/i),
      ).toBeInTheDocument(),
    );
  });
});
