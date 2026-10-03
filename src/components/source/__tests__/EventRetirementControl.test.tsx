/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EventRetirementControl } from "../approval/EventRetirementControl";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("EventRetirementControl", () => {
  beforeEach(() => {
    push.mockClear();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as jest.Mock;
  });

  it("requires a reason and acknowledgement before retiring without approving a stage", async () => {
    render(<EventRetirementControl eventId="event-1" eventCode="SRC-001" />);

    fireEvent.click(screen.getByRole("button", { name: "Retire event" }));
    const confirm = screen.getByRole("button", { name: "Confirm retirement" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason for retirement"), { target: { value: "Short" } });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason for retirement"), {
      target: { value: "Superseded by a replacement synthetic event." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/source/events/event-1/approve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "reject", notes: "Superseded by a replacement synthetic event." }),
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/source/new"));
  });

  it("keeps the event visible and reports a server refusal", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Retirement was not recorded." }),
    }) as jest.Mock;
    render(<EventRetirementControl eventId="event-1" eventCode="SRC-001" />);
    fireEvent.click(screen.getByRole("button", { name: "Retire event" }));
    fireEvent.change(screen.getByLabelText("Reason for retirement"), {
      target: { value: "Superseded by a replacement synthetic event." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm retirement" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Retirement was not recorded.");
    expect(push).not.toHaveBeenCalled();
  });
});
