/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomeKnowAsk } from "@/components/home/know/HomeKnowAsk";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

const response: HomeKnowResponse = {
  mode: "KNOW",
  tenantKey: "apex-retail",
  question: "Show apps owned by Finance",
  intent: "table",
  answerStatus: "answered",
  prose: "Finance applications are loaded with owners and source rows.",
  dimensionsUsed: ["applications_systems"],
  facts: [],
  tables: [
    {
      id: "apps",
      title: "Finance applications",
      dimensionId: "applications_systems",
      columns: [
        { key: "app", label: "Application" },
        { key: "owner", label: "Owner" },
      ],
      rows: [{ app: "ERP Finance", owner: "Finance Ops" }],
      citationIds: ["c1"],
    },
  ],
  charts: [],
  graphs: [],
  gaps: [],
  conflicts: [],
  citations: [
    {
      id: "c1",
      label: "Applications & Systems",
      sourceClass: "tenant-record",
      sourceFile: "F05_applications-systems.csv",
      sourceRowNumber: 3,
      excerpt: "ERP Finance",
      confidence: "high",
    },
  ],
  handoff: null,
  safety: {
    serverValidated: true,
    blockedExperts: true,
    blockedDecisionFrames: true,
    blockedInternalCodes: true,
    unsupportedClaimsRemoved: 0,
    frontendTripwireShouldFire: false,
  },
};

describe("HomeKnowAsk", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "fetch");
  });

  it("posts to the Home KNOW endpoint and renders the server response", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    } as Response);
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchMock,
    });

    render(<HomeKnowAsk tenantKey="apex-retail" />);

    const input = screen.getByLabelText("Ask Home KNOW");
    fireEvent.change(input, { target: { value: "Show apps owned by Finance" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/home/know/ask",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      question: "Show apps owned by Finance",
      tenantKey: "apex-retail",
    });
    expect(await screen.findByText("Finance applications")).toBeInTheDocument();
    expect(screen.getByText("ERP Finance")).toBeInTheDocument();
  });
});
