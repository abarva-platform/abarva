/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import {
  AdvisoryIntelligencePage,
  buildStarterPrompts,
} from "../AdvisoryIntelligencePage";
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

    // Assert against the builder rather than pinned copy: the wording is
    // covered by intelligence-starter-prompts.test.ts, which checks the answer
    // mode each starter reaches. What matters here is that they all render.
    const prompts = buildStarterPrompts(viewModel);
    expect(prompts.length).toBeGreaterThan(0);
    for (const prompt of prompts) {
      expect(screen.getByText(prompt)).toBeTruthy();
    }
  });
});
