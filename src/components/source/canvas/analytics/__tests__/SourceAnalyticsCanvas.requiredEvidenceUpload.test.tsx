/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import type { SourcingEventSummary } from "@/lib/source/types";

const EVENT = {
  id: "evt-1",
  code: "SYN-001",
  name: "Synthetic service event",
  accountName: "Test tenant",
  leadAgent: "Sentinel",
  archetype: "AMS",
  rigor: "standard",
  status: "active",
  statusLabel: "Active",
  priority: "high",
  currentStageKey: "strategy",
  currentStageLabel: "Strategy",
  openAlerts: 0,
  owner: "Event Owner",
  agingDays: 0,
  blocker: null,
  nextAction: "Review trigger",
  isAtRisk: false,
  valueAtStakeUsd: 0,
  projectedValueUsd: 0,
  realizedValueUsd: 0,
  nextDecision: "Review strategy",
} as SourcingEventSummary;

const TRIGGER_ID = "EVID-SRC-STR-TRIGGER";
const originalFetch = global.fetch;

afterEach(() => {
  jest.restoreAllMocks();
  if (originalFetch) global.fetch = originalFetch;
  else delete (global as { fetch?: typeof fetch }).fetch;
});

it("opens the selected requirement picker and submits its ID with the file", async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, artifact: { id: "artifact-1", originalName: "owner-note.csv" } }),
  });
  global.fetch = fetchMock;
  const pickerClick = jest.spyOn(HTMLInputElement.prototype, "click");
  render(<SourceAnalyticsCanvas event={EVENT} viewStage="strategy" tenantName="Test tenant" initialWorkspace="files" />);

  const row = screen.getByTestId(`source-stage-evidence-checklist-row-${TRIGGER_ID}`);
  fireEvent.click(within(row).getByRole("button", { name: "Upload" }));
  expect(pickerClick).toHaveBeenCalled();

  const input = screen.getByTestId(`source-required-evidence-input-${TRIGGER_ID}`);
  const file = new File(["synthetic trigger"], "owner-note.csv", { type: "text/csv" });
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => {
    const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/artifacts/upload"));
    expect(call).toBeDefined();
    const body = call?.[1]?.body as FormData;
    expect(body.get("evidenceRequirementId")).toBe(TRIGGER_ID);
    expect(body.get("stageKey")).toBe("strategy");
    expect((body.get("file") as File).name).toBe("owner-note.csv");
  });
  expect(await screen.findByTestId(`source-required-evidence-status-${TRIGGER_ID}`))
    .toHaveTextContent("Captured owner-note.csv");
});

it("keeps the requirement open and shows an upload error", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 400,
    json: async () => ({ error: "invalid_evidence_file_type" }),
  } as Response);
  render(<SourceAnalyticsCanvas event={EVENT} viewStage="strategy" tenantName="Test tenant" initialWorkspace="files" />);
  const row = screen.getByTestId(`source-stage-evidence-checklist-row-${TRIGGER_ID}`);
  fireEvent.change(screen.getByTestId(`source-required-evidence-input-${TRIGGER_ID}`), {
    target: { files: [new File(["bad"], "bad.csv", { type: "text/csv" })] },
  });
  expect(await within(row).findByRole("alert")).toHaveTextContent("invalid_evidence_file_type");
  expect(within(row).getByText("Open")).toBeInTheDocument();
});
