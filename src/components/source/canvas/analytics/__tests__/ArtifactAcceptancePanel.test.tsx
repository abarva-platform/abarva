/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ArtifactAcceptancePanel } from "../ArtifactAcceptancePanel";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";

const LATEST: ArtifactAcceptanceRecord = {
  id: "acceptance-1",
  artifactId: "artifact-1",
  eventId: "event-1",
  stageKey: "responses",
  artifactState: "approved_for_external_use",
  authoritativeVersionId: "artifact-1",
  artifactRole: "evidence",
  contentDriftStatus: "current",
  gatePreconditionStatus: "ready",
  downstreamContextPolicy: "restricted",
  diffSummary: "Added Cormorant IT's late response.",
  approvalRationale: "Coverage complete across all three bidders.",
  acceptedBy: "K. Oshima",
  acceptedAt: "2026-07-22T00:00:00.000Z",
  createdAt: "2026-07-22T00:00:00.000Z",
};

describe("ArtifactAcceptancePanel", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("shows nothing extra when the artifact has never been accepted", () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
      />,
    );
    expect(screen.queryByText(/Artifact status/i)).not.toBeInTheDocument();
    expect(screen.getByText("Accept as authoritative")).toBeInTheDocument();
  });

  it("renders the real latest acceptance — rationale, accepted-by, drift, gate precondition", () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={LATEST}
      />,
    );
    const panel = screen.getByTestId(
      "source-shell-artifact-status-d11_response_checklist",
    );
    expect(panel).toHaveTextContent("Accepted by K. Oshima");
    expect(panel).toHaveTextContent("Coverage complete across all three bidders.");
    expect(panel).toHaveTextContent("Added Cormorant IT's late response.");
    expect(panel).toHaveTextContent("current");
    expect(panel).toHaveTextContent("ready");
    expect(screen.getByText("Re-accept with a new reason")).toBeInTheDocument();
  });

  it("requires a rationale before submitting — never POSTs an empty reason", async () => {
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
      />,
    );
    fireEvent.click(screen.getByTestId("source-shell-artifact-accept-toggle-d11_response_checklist"));
    fireEvent.submit(
      screen.getByTestId("source-shell-artifact-accept-form-d11_response_checklist"),
    );
    await waitFor(() => {
      expect(
        screen.getByText("A reason for accepting this artifact is required."),
      ).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("POSTs the real form values to the accept route and calls onAccepted on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, acceptance: LATEST }),
    });
    const onAccepted = jest.fn();
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
        onAccepted={onAccepted}
      />,
    );
    fireEvent.click(screen.getByTestId("source-shell-artifact-accept-toggle-d11_response_checklist"));
    fireEvent.change(
      screen.getByPlaceholderText("Why is this version being accepted now?"),
      { target: { value: "Vendor coverage matrix reviewed and complete." } },
    );
    fireEvent.submit(
      screen.getByTestId("source-shell-artifact-accept-form-d11_response_checklist"),
    );

    await waitFor(() => expect(onAccepted).toHaveBeenCalledTimes(1));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/source/event-1/artifacts/d11_response_checklist/accept",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.approvalRationale).toBe(
      "Vendor coverage matrix reviewed and complete.",
    );
  });

  it("shows the server error message and does not call onAccepted on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "forbidden", detail: "Upload rights are required." }),
    });
    const onAccepted = jest.fn();
    render(
      <ArtifactAcceptancePanel
        eventId="event-1"
        artifactCode="d11_response_checklist"
        artifactName="Response coverage matrix"
        latestAcceptance={null}
        onAccepted={onAccepted}
      />,
    );
    fireEvent.click(screen.getByTestId("source-shell-artifact-accept-toggle-d11_response_checklist"));
    fireEvent.change(
      screen.getByPlaceholderText("Why is this version being accepted now?"),
      { target: { value: "Reviewed." } },
    );
    fireEvent.submit(
      screen.getByTestId("source-shell-artifact-accept-form-d11_response_checklist"),
    );

    await waitFor(() => {
      expect(screen.getByText("Upload rights are required.")).toBeInTheDocument();
    });
    expect(onAccepted).not.toHaveBeenCalled();
  });
});
