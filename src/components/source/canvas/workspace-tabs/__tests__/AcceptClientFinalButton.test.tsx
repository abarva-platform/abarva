/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CLIENT_FINAL_GOVERNANCE_MESSAGE } from "@/lib/source/client-final-artifacts";
import { AcceptClientFinalButton } from "../AcceptClientFinalButton";

const props = {
  eventId: "synthetic-event",
  artifactCode: "d01_strategy_memo",
  artifactName: "Sourcing Strategy Memo",
};

describe("AcceptClientFinalButton", () => {
  it("describes authority as a future effect before a file is accepted", () => {
    render(<AcceptClientFinalButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Accept Client Final" }));

    expect(screen.queryByText(CLIENT_FINAL_GOVERNANCE_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByText(/confirming this file makes it the authoritative version/i)).toBeInTheDocument();
  });

  it("does not claim a final was accepted after the upload is rejected", async () => {
    const priorFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "unreadable_client_final",
        detail: "This file has no readable text.",
      }),
    }) as typeof fetch;
    const onAccepted = jest.fn();
    try {
      render(<AcceptClientFinalButton {...props} onAccepted={onAccepted} />);
      fireEvent.click(screen.getByRole("button", { name: "Accept Client Final" }));
      fireEvent.change(screen.getByLabelText("Client-approved file"), {
        target: {
          files: [new File(["   "], "invalid-final.txt", { type: "text/plain" })],
        },
      });
      fireEvent.change(screen.getByLabelText("Approval rationale"), {
        target: { value: "Negative QA; not an approval." },
      });
      fireEvent.submit(screen.getByTestId("source-accept-client-final-panel-d01_strategy_memo"));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("This file has no readable text.");
      });
      expect(screen.queryByText(CLIENT_FINAL_GOVERNANCE_MESSAGE)).not.toBeInTheDocument();
      expect(onAccepted).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = priorFetch;
    }
  });
});
