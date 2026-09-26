/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { SponsorDelegationControl } from "../TaskChecklist";

const originalFetch = global.fetch;
const originalConfirm = window.confirm;
const artifact = { id: "scope-file", sha256: "a".repeat(64) };

afterEach(() => {
  global.fetch = originalFetch;
  window.confirm = originalConfirm;
  jest.clearAllMocks();
});

it("requires a named delegate action and browser confirmation before POST", async () => {
  const fetchMock = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      verified: false, available: true, sponsorAssigned: true, sponsorName: "Sam Sponsor", recipientReady: true,
      canDelegate: true, scopeArtifact: artifact, currentStage: "scope",
    }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ verified: true, notification: "email_sent" }) });
  global.fetch = fetchMock as unknown as typeof fetch;
  window.confirm = jest.fn().mockReturnValue(true);
  render(<SponsorDelegationControl eventId="event-1" />);
  const button = await screen.findByRole("button", { name: "Acknowledge and notify sponsor" });
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(button);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("not the sponsor's signature"));
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("notify Sam Sponsor"));
  expect(fetchMock).toHaveBeenLastCalledWith(
    "/api/v1/source/events/event-1/sponsor-delegation",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ acknowledged: true, scopeArtifactId: artifact.id, scopeArtifactSha256: artifact.sha256 }),
    }),
  );
  expect(await screen.findByText("Your delegated acknowledgement is recorded and the sponsor email was sent.")).toBeInTheDocument();
  expect(refresh).toHaveBeenCalled();
});

it("keeps a logged-only email visibly pending", async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      verified: false, available: true, sponsorAssigned: true, sponsorName: "Sam Sponsor", recipientReady: true,
      canDelegate: true, scopeArtifact: artifact, currentStage: "scope",
    }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ verified: false, notification: "logged_fallback" }) }) as unknown as typeof fetch;
  window.confirm = jest.fn().mockReturnValue(true);
  render(<SponsorDelegationControl eventId="event-1" />);
  fireEvent.click(await screen.findByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Acknowledge and notify sponsor" }));
  expect(await screen.findByText("Acknowledgement recorded, but email was only logged. Scope remains blocked.")).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();
});

it("hides the action when the server has no signed delegation authority", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
    verified: false, available: false, sponsorAssigned: true, sponsorName: "Sam Sponsor", recipientReady: false,
    canDelegate: false, scopeArtifact: artifact, currentStage: "scope",
  }) }) as unknown as typeof fetch;
  render(<SponsorDelegationControl eventId="event-1" />);
  expect(await screen.findByText("Delegated acknowledgement is not configured in this environment.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Acknowledge and notify sponsor" })).not.toBeInTheDocument();
});

it("does not offer acknowledgement when sponsor email cannot be sent", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
    verified: false, available: true, sponsorAssigned: true,
    sponsorName: "Sam Sponsor", recipientReady: false,
    canDelegate: false, scopeArtifact: artifact, currentStage: "scope",
  }) }) as unknown as typeof fetch;
  render(<SponsorDelegationControl eventId="event-1" />);
  expect(await screen.findByText("Sponsor email is not enabled for this environment.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Acknowledge and notify sponsor" })).not.toBeInTheDocument();
});
