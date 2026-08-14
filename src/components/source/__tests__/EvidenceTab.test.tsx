/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { EvidenceTab } from "../canvas/workspace-tabs/EvidenceTab";
import type { SourceEventEvidence } from "@/lib/source/canvas-substrate";

function evidenceRow(
  overrides: Partial<SourceEventEvidence> = {},
): SourceEventEvidence {
  return {
    id: "evidence-state-1",
    sourceEventId: "source-event-1",
    tenantKey: "apexretail",
    requirementId: "EVID-SRC-STR-INCUMBENT",
    stage: "strategy",
    currentState: "Not Requested",
    sourceArtifactId: null,
    notes: null,
    lastSyncedAt: null,
    createdAt: "2026-06-02T12:00:00.000Z",
    updatedAt: "2026-06-02T12:00:00.000Z",
    ...overrides,
  };
}

describe("EvidenceTab", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("opens a governed request panel and logs the request", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const onRequestSaved = jest.fn();

    render(
      <EvidenceTab
        stage="strategy"
        states={[evidenceRow()]}
        eventId="source-event-1"
        onRequestSaved={onRequestSaved}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^request$/i }));
    expect(
      screen.getByTestId("source-canvas-evidence-request-panel"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No email is sent from AbarVa/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/owner or source/i), {
      target: { value: "Procurement lead" },
    });
    fireEvent.change(screen.getByLabelText(/due date/i), {
      target: { value: "2026-06-12" },
    });
    fireEvent.change(screen.getByLabelText(/request note/i), {
      target: { value: "Please attach the signed incumbent contract." },
    });
    fireEvent.click(screen.getByRole("button", { name: /log request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/source/source-event-1/evidence-requests",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: expect.stringContaining("EVID-SRC-STR-INCUMBENT"),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        owner: "Procurement lead",
        dueDate: "2026-06-12",
        note: "Please attach the signed incumbent contract.",
        stage: "strategy",
      }),
    );
    await waitFor(() => expect(onRequestSaved).toHaveBeenCalledTimes(1));
  });

  it("does not show the request CTA once evidence is in progress", () => {
    render(
      <EvidenceTab
        stage="strategy"
        states={[evidenceRow({ currentState: "Loaded" })]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /^request$/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a compact upload checklist with required, source, format, and done signals", () => {
    render(
      <EvidenceTab
        stage="strategy"
        states={[
          evidenceRow({
            currentState: "Available",
            sourceArtifactId: "artifact-1",
          }),
        ]}
      />,
    );

    expect(screen.getByText(/Evidence checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Required ready/i)).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /Evidence required/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Incumbent contract package/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, DOCX, XLSX/i)).toBeInTheDocument();
    expect(screen.getAllByText("Uploaded").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Done").length).toBeGreaterThanOrEqual(1);
  });
});
