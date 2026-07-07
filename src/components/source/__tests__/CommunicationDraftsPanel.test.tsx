/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CommunicationDraftsPanel } from "../canvas/workspace-tabs/CommunicationDraftsPanel";

describe("CommunicationDraftsPanel", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("creates a review-only communication draft without exposing a send action", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        draft: {
          draftType: "bafo_request",
          subject: "Apex Retail Group AMS Outsourcing 2026: best-and-final request",
          body: "Hello Finalist vendors,\n\nAbarVa draft status: review before sending.",
          disclaimer:
            "Internal draft only. Review, approve, and send through the client's procurement or communication system.",
        },
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <CommunicationDraftsPanel
        eventId="apex-retail-ams-outsourcing-2026"
        stage="bafo"
      />,
    );

    expect(screen.getByText(/Draft only/i)).toBeInTheDocument();
    expect(screen.getByText(/AbarVa does not send external messages/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^send$/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/recipient or group/i), {
      target: { value: "Finalist vendors" },
    });
    fireEvent.change(screen.getByLabelText(/Maestro note/i), {
      target: { value: "Ask for a transition risk reduction." },
    });
    fireEvent.click(screen.getByRole("button", { name: /create internal draft/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/source/apex-retail-ams-outsourcing-2026/communications/draft",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: expect.stringContaining("bafo_request"),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        recipientName: "Finalist vendors",
        note: "Ask for a transition risk reduction.",
      }),
    );
    expect(await screen.findByTestId("source-communication-draft")).toHaveTextContent(
      "best-and-final request",
    );
    expect(screen.getByRole("button", { name: /copy text/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download text/i })).toBeInTheDocument();
  });

  it("does not render on stages without communication drafts", () => {
    const { container } = render(
      <CommunicationDraftsPanel eventId="source-event-1" stage="strategy" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
