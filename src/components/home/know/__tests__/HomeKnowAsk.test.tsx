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
  prose: "Finance applications are loaded with owners and source records.",
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
    window.sessionStorage.clear();
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
    expect(screen.getByTestId("ava-ask-mark")).toBeInTheDocument();
    expect(screen.getByTestId("ava-ask-wordmark")).toHaveAttribute(
      "src",
      "/brand/ava/ava-wordmark-2tone-dark.svg",
    );
    fireEvent.change(input, {
      target: { value: "Show apps owned by Finance" },
    });
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

  it("keeps the rail focused on the latest question", async () => {
    const secondResponse: HomeKnowResponse = {
      ...response,
      question: "Which vendors support data platforms?",
      prose: "Data platform vendors are loaded with supporting context.",
      tables: [
        {
          id: "vendors",
          title: "Data platform vendors",
          dimensionId: "vendors_contracts",
          columns: [
            { key: "vendor", label: "Vendor" },
            { key: "support", label: "Support" },
          ],
          rows: [{ vendor: "Databricks", support: "Lakehouse" }],
          citationIds: ["c1"],
        },
      ],
    };
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => response,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse,
      } as Response);
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchMock,
    });

    render(<HomeKnowAsk tenantKey="apex-retail" />);

    const input = screen.getByLabelText("Ask Home KNOW");
    fireEvent.change(input, {
      target: { value: "Show apps owned by Finance" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await screen.findByText("Finance applications");
    expect(input).toHaveValue("");
    expect(input).not.toBeDisabled();
    expect(screen.getByText("Conversation history")).toBeInTheDocument();
    expect(screen.getByText("You · Question 1")).toBeInTheDocument();
    expect(screen.getByText("Show apps owned by Finance")).toBeInTheDocument();

    fireEvent.change(input, {
      target: { value: "Which vendors support data platforms?" },
    });
    expect(input).toHaveValue("Which vendors support data platforms?");
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await screen.findByText("Data platform vendors");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(input).toHaveValue("");
    expect(input).not.toBeDisabled();
    expect(screen.getByText("You · Question 1")).toBeInTheDocument();
    expect(
      screen.getByText("Which vendors support data platforms?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Show apps owned by Finance"),
    ).not.toBeInTheDocument();
  });

  it("clears old tenant session history instead of restoring stale questions", async () => {
    const storedTurn = {
      id: "turn-1",
      question: "What did I ask before?",
      response,
      fetching: false,
      error: null,
    };
    window.sessionStorage.setItem(
      "abarva.homeKnow.thread.apex-retail",
      JSON.stringify([storedTurn]),
    );

    render(<HomeKnowAsk tenantKey="apex-retail" />);

    expect(screen.queryByText("Conversation history")).not.toBeInTheDocument();
    expect(
      screen.queryByText("What did I ask before?"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Finance applications")).not.toBeInTheDocument();
    expect(
      window.sessionStorage.getItem("abarva.homeKnow.thread.apex-retail"),
    ).toBeNull();
  });
});
