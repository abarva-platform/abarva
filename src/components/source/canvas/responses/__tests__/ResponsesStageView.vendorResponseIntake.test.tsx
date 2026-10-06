/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import type { SourceShellArtifactLike } from "@/lib/source/source-event-shell-v2";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import { ResponsesStageView } from "../ResponsesStageView";

const readiness = {
  eventId: "event-1",
  eventName: "Synthetic sourcing event",
  generatedAt: "2026-09-22T00:00:00.000Z",
  stage: "responses",
  records: [
    {
      vendorId: "vendor-northstar",
      vendorName: "Northstar Services",
      responseStatus: "not_started",
      receivedAt: null,
      requiredSections: [],
      submittedSections: [],
      missingSections: [],
      assumptions: [],
      exclusions: [],
      pricingTemplateStatus: "not_started",
      transitionPlanStatus: "not_started",
      securityResponseStatus: "not_started",
      automationRoadmapStatus: "not_started",
      evidenceStatus: "Missing",
      comparabilityStatus: "blocked",
      blockers: [],
      completenessStatus: "incomplete",
      rationale: [],
      recommendedNextAction: "Upload the response.",
      nexusGuidance: "Upload the response.",
      sentinelEvidenceNotes: [],
      stewardGateNotes: [],
      atlasExecutiveImplication: "No response is loaded.",
    },
  ],
  summary: {
    totalVendors: 1,
    complete: 0,
    partiallyComplete: 0,
    incomplete: 1,
    notComparable: 0,
    blocked: 0,
  },
  comparabilityReadiness: "incomplete",
  blockers: [],
  recommendedNextAction: "Upload the response.",
} as SourceVendorResponseCompleteness;

function artifact(
  overrides: Partial<SourceShellArtifactLike> = {},
): SourceShellArtifactLike {
  return {
    id: "artifact-1",
    sourceEventId: "event-1",
    stageKey: "responses",
    artifactFamily: "proposal",
    artifactKind: "vendor_response_pack:vendor-northstar",
    sourceOrigin: "uploaded",
    sourceFormat: "xlsx",
    originalName: "northstar-response.xlsx",
    parseStatus: "parsed",
    embeddingStatus: "pending",
    graphStatus: "pending",
    evidenceState: "parsed_uncited",
    approvalState: "in_review",
    ...overrides,
  };
}

describe("ResponsesStageView vendor response intake", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("binds a selected supplier to the governed response upload and keeps review separate", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        artifact: artifact({ approvalState: "draft" }),
        parseWarnings: [],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const onRegistryUploaded = jest.fn();

    render(
      <ResponsesStageView
        readiness={readiness}
        artifacts={[]}
        onResponseUploaded={onRegistryUploaded}
        documentWorkspace={<div>Documents</div>}
      />,
    );

    expect(
      screen.getByRole("button", { name: /upload response workbook/i }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/supplier/i), {
      target: { value: "vendor-northstar" },
    });
    fireEvent.change(
      screen.getByLabelText("Response workbook", { selector: "input" }),
      {
        target: {
          files: [
            new File(["response"], "northstar-response.xlsx", {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
          ],
        },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /upload response workbook/i }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/source/event-1/artifacts/upload",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("vendorId")).toBe("vendor-northstar");
    expect(body.get("vendorName")).toBe("Northstar Services");
    expect(body.get("artifactKind")).toBe(
      "vendor_response_pack:vendor-northstar",
    );
    expect(body.get("artifactFamily")).toBe("proposal");
    expect(body.get("stageKey")).toBe("responses");
    expect(body.get("artifactCode")).toBeNull();
    const row = await screen.findByTestId("response-intake-vendor-northstar");
    expect(within(row).getByText(/Northstar Services/i)).toBeInTheDocument();
    expect(within(row).getByText(/parser parsed/i)).toBeInTheDocument();
    expect(
      within(row).getByText(/availability review not recorded/i),
    ).toBeInTheDocument();
    expect(
      within(row).getByText(/formal approval not recorded/i),
    ).toBeInTheDocument();
    expect(
      within(row).getByText(/complete the proposal availability review/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(onRegistryUploaded).toHaveBeenCalledTimes(1);
    expect(
      within(screen.getByTestId("source-vendor-response-intake")).queryByText(
        /accepted|contact|invite|score|bafo|award|client.?final/i,
      ),
    ).not.toBeInTheDocument();
  });

  it("does not derive availability review from formal artifact approval", () => {
    render(
      <ResponsesStageView
        readiness={readiness}
        artifacts={[artifact({ approvalState: "approved" })]}
        documentWorkspace={<div>Documents</div>}
      />,
    );

    const row = screen.getByTestId("response-intake-vendor-northstar");
    expect(within(row).getByText("Northstar Services")).toBeInTheDocument();
    expect(within(row).getByText(/parser parsed/i)).toBeInTheDocument();
    expect(
      within(row).getByText(/availability review not recorded/i),
    ).toBeInTheDocument();
    expect(
      within(row).getByText(/formal approval approved/i),
    ).toBeInTheDocument();
    expect(
      within(row).getByText(/complete the proposal availability review/i),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("source-vendor-response-intake")).queryByText(
        /accepted|contact|invite|score|bafo|award|client.?final/i,
      ),
    ).not.toBeInTheDocument();
  });

  it("uses the governed proposal evidence state for availability readiness", () => {
    render(
      <ResponsesStageView
        readiness={readiness}
        artifacts={[artifact({ approvalState: "draft" })]}
        responseProposalAvailabilityState="Available"
        documentWorkspace={<div>Documents</div>}
      />,
    );

    const row = screen.getByTestId("response-intake-vendor-northstar");
    expect(
      within(row).getByText(/stage availability available/i),
    ).toBeInTheDocument();
    expect(
      within(row).getByText(/formal approval not recorded/i),
    ).toBeInTheDocument();
    expect(
      within(row).getByText(/continue governed response review/i),
    ).toBeInTheDocument();
  });
});
