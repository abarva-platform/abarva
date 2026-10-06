/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { TaskChecklist } from "../TaskChecklist";
import type { StageTaskView } from "../view-model";

const task: StageTaskView = {
  id: "strategy.confirm",
  title: "Confirm strategy",
  subtitle: "Mandate and value thesis",
  type: "confirm",
  state: "todo",
  guide: "Review the current mandate and value thesis.",
  cta: "Record confirmation",
  confirmationVersion: "version-1",
};

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

describe("Strategy confirmation checklist", () => {
  it("posts the version-bound owner decision before showing done", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, receiptId: "r1" }) });
    global.fetch = fetchMock as typeof fetch;
    const { rerender } = render(<TaskChecklist tasks={[task]} eventId="event-1" stageKey="strategy" />);
    fireEvent.click(screen.getByRole("button", { name: "Record confirmation" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByText("0 / 1 complete")).toBeInTheDocument();
    rerender(<TaskChecklist tasks={[{ ...task, evidenceComplete: true }]} eventId="event-1" stageKey="strategy" />);
    expect(screen.getByText("✓ Done")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/source/event-1/strategy-confirmation",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ version: "version-1", confirmed: true }) }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("does not turn a rejected save or missing version green", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, json: async () => ({ error: "stale_strategy", detail: "Reload and review the strategy." }),
    }) as typeof fetch;
    const { rerender } = render(<TaskChecklist tasks={[task]} eventId="event-1" stageKey="strategy" />);
    fireEvent.click(screen.getByRole("button", { name: "Record confirmation" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Reload and review");
    expect(screen.getByText("0 / 1 complete")).toBeInTheDocument();

    rerender(<TaskChecklist tasks={[{ ...task, confirmationVersion: undefined }]} eventId="event-1" stageKey="strategy" />);
    expect(screen.queryByRole("button", { name: "Record confirmation" })).not.toBeInTheDocument();
    expect(screen.getByText(/requires the governed Event Owner approval path/)).toBeInTheDocument();
    expect(screen.getByText("0 / 1 complete")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
