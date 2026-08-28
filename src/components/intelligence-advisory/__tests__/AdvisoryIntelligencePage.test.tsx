/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { AdvisoryIntelligencePage } from "../AdvisoryIntelligencePage";
import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";

describe("AdvisoryIntelligencePage", () => {
  const viewModel = getEnterpriseLandscapeViewModel({
    clientKey: "skyharbor",
    tenantName: "SkyHarbor Air",
  });

  it("renders Intelligence as a chat-only advisor surface", () => {
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);

    expect(screen.getByTestId("agent-dock-chat-only-shell")).toBeTruthy();
    expect(screen.queryByTestId("agent-dock-side-rail-shell")).toBeNull();
    expect(screen.getAllByText("Intelligence advisor").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Ask aVa anything.")).toBeTruthy();
    expect(screen.queryByLabelText("Intelligence briefing")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Industry Outlook/i }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /Future Trends/i })).toBeNull();
    expect(screen.queryByText(/<<<TAB:/i)).toBeNull();
    expect(screen.queryByText(/grounding:/i)).toBeNull();
  });

  it("keeps vertical starter questions visible in chat-only mode", () => {
    render(<AdvisoryIntelligencePage viewModel={viewModel} />);

    expect(
      screen.getByText(
        "What are the top AI opportunities for SkyHarbor Global, grounded only in the loaded context?",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Which current-state technology, data, or operating-model gaps should a CXO care about first?",
      ),
    ).toBeTruthy();
  });
});
