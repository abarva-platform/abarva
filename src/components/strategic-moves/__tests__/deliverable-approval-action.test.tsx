/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeliverableApprovalAction } from "../DeliverableApprovalAction";

function jsonResponse(body: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("DeliverableApprovalAction", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("surfaces readiness blockers and requires a second explicit acknowledgement before approval", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: "client_readiness_blockers",
            detail: "Client-readiness blockers found.",
            blockers: [
              {
                kind: "model_name",
                match: "claude-sonnet-5",
                why: "Internal model names are not client-facing.",
              },
            ],
            acknowledgeField: "acknowledgeReadinessBlockers",
          },
          422,
        ),
      )
      .mockReturnValueOnce(new Promise<Response>(() => undefined));
    global.fetch = fetchMock as typeof fetch;

    render(
      <DeliverableApprovalAction
        moveId="move-1"
        deliverableId="deliverable-1"
        alreadyApproved={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /approve as-is/i }));

    expect(
      await screen.findByText("Client-readiness blockers found."),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_content, element) =>
        Boolean(
          element?.tagName === "LI" &&
            element.textContent?.includes("model_name: claude-sonnet-5"),
        ),
      ),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("body");

    fireEvent.click(
      screen.getByRole("button", {
        name: /acknowledge blockers and approve/i,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ acknowledgeReadinessBlockers: true }),
    });
  });

  it("shows non-readiness sign-off errors as reviewer-visible messages", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        {
          error: "generated_artifact_not_scannable",
          detail:
            "A generated Office companion must be readable before this deliverable can be signed off.",
        },
        422,
      ),
    ) as typeof fetch;

    render(
      <DeliverableApprovalAction
        moveId="move-1"
        deliverableId="deliverable-1"
        alreadyApproved={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /approve as-is/i }));

    expect(
      await screen.findByText(
        "A generated Office companion must be readable before this deliverable can be signed off.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /acknowledge blockers and approve/i,
      }),
    ).not.toBeInTheDocument();
  });
});
