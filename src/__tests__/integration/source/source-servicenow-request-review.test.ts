/**
 * @jest-environment jsdom
 */

import { createElement } from "react";
import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SourceOriginatePage } from "@/components/source/SourceOriginatePage";
import type { SourceIntakeRequestSummary } from "@/lib/source/intake/servicenow-sourcing-request-repository";

const mockRouterPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/source/new",
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

const importedRequest: SourceIntakeRequestSummary = {
  requestId: "snow:REQ0012345",
  requestNumber: "REQ0012345",
  sourceSystem: "ServiceNow",
  sourceStatus: "approved_for_triage",
  sourceVersion: "version-3",
  extractedAt: "2026-09-22T12:00:00.000Z",
  updatedAt: "2026-09-22T11:45:00.000Z",
  title: "Cloud consumption optimization",
  description: "Stand up a sourcing event for cloud commitment and rate optimization.",
  trigger: "Cloud commitment renewal is due within six months.",
  requestedOutcome: "Reduce annual run rate by $1.2M while preserving resilience.",
  requestedFor: "Enterprise Technology",
  businessDomain: "enterprise",
  businessFunction: "Cloud operations",
  decisionOwner: "Jordan Lee, VP Infrastructure",
  baselineOwner: "FinOps owns the CUR and commitment baseline.",
  scopeIncluded: "AWS consumption, commitments, discounts, and support tiers.",
  scopeExcluded: "Application modernization and data-center exit work.",
  securityReviewNeeded: false,
  legalReviewNeeded: true,
  value: { amount: 1_200_000, currency: "USD", validated: false },
  requiredFactGaps: [],
  mappingProposal: {
    categoryId: "cloud_finops",
    archetypeId: "CLOUD_FINOPS",
    confidence: "high",
    reasons: [
      "The request names cloud consumption and commitment optimization.",
      "FinOps owns the required baseline.",
    ],
  },
  mappingDecision: null,
  eventLink: null,
};

describe("ServiceNow request review handoff", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("blocks event creation until a person accepts the proposed route with rationale", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ event: { id: "event-from-request" } }),
    });
    global.fetch = fetchMock;

    render(
      createElement(SourceOriginatePage, {
        clientName: "Example Organization",
        clientShortName: "Example",
        clientKey: "example",
        sourceRequest: importedRequest,
      }),
    );

    expect(screen.getByLabelText("Imported request review")).toBeTruthy();
    expect(screen.getByDisplayValue(importedRequest.trigger ?? "")).toBeTruthy();
    expect(screen.getByDisplayValue(importedRequest.decisionOwner ?? "")).toBeTruthy();
    expect(screen.getByDisplayValue(/AWS consumption, commitments/)).toBeTruthy();
    expect(screen.getByDisplayValue(/Reduce annual run rate/)).toBeTruthy();
    expect(screen.getByDisplayValue(importedRequest.baselineOwner ?? "")).toBeTruthy();

    const createButton = screen.getByTestId("source-intake-open-event");
    expect(createButton.hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByText(
        "Accept the proposed route or choose an override, then record the review rationale.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Accept proposed routing" }));
    expect(createButton.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByLabelText("Mapping review rationale"), {
      target: {
        value: "The cloud category matches the recorded scope and baseline owner.",
      },
    });
    expect(createButton.hasAttribute("disabled")).toBe(false);
    fireEvent.click(createButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = fetchMock.mock.calls[0]?.[1] as { body?: string };
    const payload = JSON.parse(request.body ?? "{}") as Record<string, unknown>;

    expect(payload).toEqual({
      sourceRequest: {
        requestId: importedRequest.requestId,
        sourceVersion: importedRequest.sourceVersion,
        decisionState: "accepted",
        rationale: "The cloud category matches the recorded scope and baseline owner.",
      },
    });
    expect(mockRouterPush).toHaveBeenCalledWith("/source/new/event-from-request");
  });
});
