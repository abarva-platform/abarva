/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";

import { ContextInsightsFeed } from "../ContextInsightsFeed";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe("ContextInsightsFeed", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("evaluates empty live insights once and repaints from context_insights rows", async () => {
    const liveInsight = {
      id: "insight-1",
      clientId: "client-skyharbor",
      tenantKey: "skyharbor-air",
      headline: "Live renewal risk is now visible",
      soWhat: "The row came from context_insights, not a fixture card.",
      domain: "Vendor",
      materiality: "high",
      derivedFromRecordIds: ["record-1"],
      derivedFromFactIds: ["fact-1"],
      ruleId: "renewal-window-no-benchmark",
      evidence: "context_insights row",
      confidence: "high",
      freshnessStatus: "fresh",
      lifecycleState: "active",
      action: "Shape into Move",
      entityName: "Kyndryl",
      entityType: "vendor",
      createdAt: "2026-06-17T00:00:00.000Z",
      updatedAt: "2026-06-17T00:00:00.000Z",
    };
    const fetchMock = jest
      .fn<Promise<Response>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(jsonResponse({ insights: [], errors: [] }))
      .mockResolvedValueOnce(
        jsonResponse({
          tenantKey: "skyharbor-air",
          evaluated: 6,
          fired: 1,
          written: 1,
          superseded: 0,
          errors: [],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ insights: [liveInsight], errors: [] }));
    global.fetch = fetchMock;

    render(<ContextInsightsFeed tenantKey="skyharbor-air-test" />);

    await waitFor(() =>
      expect(screen.getByText("Live renewal risk is now visible")).toBeVisible(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/intelligence/insights/evaluate",
      expect.objectContaining({ method: "POST" }),
    );
    expect(
      screen.queryByText(/auto-renew a \$4\.2M AMS contract/i),
    ).not.toBeInTheDocument();
  });
});
