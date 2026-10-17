/** @jest-environment jsdom */
import { fireEvent, render, waitFor, within } from "@testing-library/react";

import { RateCardManager, type RateCardRead } from "../RateCardManager";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

const CODES = {
  providerClasses: [{ code: "SI-T1", label: "Global system integrator" }],
  locations: [{ code: "LOC-DALLAS", label: "Dallas (onshore)" }],
  levels: [{ code: "LVL-07", label: "Senior Consultant" }],
};

const line = (rateValue: number, extra: Record<string, unknown> = {}) => ({
  identityKey: `ROL-037|LVL-07|${String(extra.providerRef ?? "")}`,
  roleOrBandRef: "ROL-037",
  level: "LVL-07",
  providerRef: null,
  locationRef: null,
  rateBasis: "client_negotiated",
  unit: "hour",
  rateValue,
  currency: "USD",
  validFrom: "2026-11-01",
  validTo: null,
  ...extra,
});

const READY: RateCardRead = {
  status: "ready",
  current: { version: 2, approvedAt: "2026-10-01T00:00:00.000Z", approvalRationale: "FY26 rates" },
  lines: [{ roleOrBandRef: "ROL-037", level: "LVL-07", providerRef: "SI-T1", locationRef: null, unit: "hour", rateValue: 310, currency: "USD" }],
  history: [
    { version: 2, status: "approved", approvedAt: "2026-10-01T00:00:00.000Z" },
    { version: 1, status: "superseded", approvedAt: "2026-07-01T00:00:00.000Z" },
  ],
};

function preview(overrides: Record<string, unknown> = {}) {
  return {
    currentVersion: 2,
    parseErrors: [],
    validationErrors: [],
    validRowCount: 1,
    diff: { added: [], changed: [{ before: line(310, { providerRef: "SI-T1" }), after: line(330, { providerRef: "SI-T1" }) }], unchanged: [], removed: [] },
    linesToCommit: [line(330, { providerRef: "SI-T1" })],
    ...overrides,
  };
}

let fetchMock: jest.Mock;
function mockFetch(importReply: { status: number; body: unknown }, approveReply?: { status: number; body: unknown }) {
  fetchMock = jest.fn(async (url: string) => {
    const reply = url.endsWith("/import") ? importReply : approveReply ?? { status: 500, body: {} };
    return { ok: reply.status >= 200 && reply.status < 300, status: reply.status, json: async () => reply.body };
  });
  (global as { fetch?: unknown }).fetch = fetchMock;
}

function upload(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(["csv"], "card.csv", { type: "text/csv" })] } });
  fireEvent.click(within(container).getByRole("button", { name: "Check the file" }));
}

const approveButton = (container: HTMLElement) =>
  within(container).getByRole("button", { name: /Approve as version/ }) as HTMLButtonElement;

beforeEach(() => {
  mockRefresh.mockReset();
});

describe("RateCardManager — the current card", () => {
  it("shows the approved version and its lines", () => {
    const { getByTestId } = render(<RateCardManager tenantName="Meridian Health" card={READY} codes={CODES} />);
    // Dates are the stored UTC date, never shifted by the viewer's timezone.
    expect(getByTestId("rate-card-current").textContent).toContain("Version 2, approved Oct 1, 2026");
    expect(getByTestId("rate-card-current-lines").textContent).toContain("SI-T1");
    expect(getByTestId("rate-card-current-lines").textContent).toContain("$310.00");
  });

  it("never reads a failed load as 'no card loaded'", () => {
    const { getByTestId, queryByTestId } = render(<RateCardManager tenantName="M" card={{ status: "error" }} codes={CODES} />);
    expect(getByTestId("rate-card-read-error").textContent).toContain("does not mean no card is loaded");
    expect(queryByTestId("rate-card-none")).toBeNull();
  });

  it("says estimates use reference rates when no card is loaded", () => {
    const { getByTestId } = render(
      <RateCardManager tenantName="M" card={{ status: "ready", current: null, lines: [], history: [] }} codes={CODES} />,
    );
    expect(getByTestId("rate-card-none").textContent).toContain("AbarVa reference rates");
  });

  it("lists INTERNAL among the provider codes", () => {
    const { getByTestId } = render(<RateCardManager tenantName="M" card={READY} codes={CODES} />);
    expect(getByTestId("rate-card-codes").textContent).toContain("INTERNAL · Your own staff");
  });
});

describe("RateCardManager — checking and approving a file", () => {
  it("lists every problem row and refuses to approve a partial card", async () => {
    mockFetch({
      status: 200,
      body: {
        ok: true,
        preview: preview({
          validationErrors: [{ rowNumber: 3, field: "provider_ref", code: "unresolved_provider_ref", message: '"Big4" is not a provider class' }],
          parseErrors: [{ rowNumber: 1, field: "rate_value", code: "invalid_number", message: "rate_value must be a number" }],
        }),
      },
    });
    const { container, getByTestId } = render(<RateCardManager tenantName="M" card={READY} codes={CODES} />);
    upload(container);
    await waitFor(() => expect(getByTestId("rate-card-errors").textContent).toContain("2 problem rows"));
    expect(getByTestId("rate-card-errors").textContent).toMatch(/Row 1 \(rate_value\).*Row 3 \(provider_ref\)/);
    fireEvent.change(container.querySelector("textarea")!, { target: { value: "FY27" } });
    expect(approveButton(container).disabled).toBe(true);
    expect(getByTestId("rate-card-approve-blocker").textContent).toContain("never with rows left out");
    expect(fetchMock.mock.calls[0][1].body).toBeInstanceOf(FormData);
  });

  it("requires a reason, then approves exactly the checked lines and refreshes", async () => {
    mockFetch(
      { status: 200, body: { ok: true, preview: preview() } },
      { status: 200, body: { ok: true, result: { action: "new_version", version: 3, previousVersion: 2 } } },
    );
    const { container, getByTestId } = render(<RateCardManager tenantName="M" card={READY} codes={CODES} />);
    upload(container);
    await waitFor(() => expect(getByTestId("rate-card-changed").textContent).toBe("ROL-037 LVL-07 SI-T1: $310.00 → $330.00 per hour"));
    expect(approveButton(container).disabled).toBe(true);
    expect(getByTestId("rate-card-approve-blocker").textContent).toContain("Give a reason");
    fireEvent.change(container.querySelector("textarea")!, { target: { value: "  FY27 MSA rates  " } });
    expect(approveButton(container).textContent).toBe("Approve as version 3");
    fireEvent.click(approveButton(container));
    await waitFor(() => expect(getByTestId("rate-card-done").textContent).toContain("Approved as version 3"));
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/admin/pricing/rate-cards/ENTERPRISE/approve");
    expect(JSON.parse(init.body)).toEqual({ lines: preview().linesToCommit, approvalRationale: "FY27 MSA rates" });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("has nothing to approve when the file matches the current card", async () => {
    mockFetch({
      status: 200,
      body: { ok: true, preview: preview({ diff: { added: [], changed: [], unchanged: [line(310)], removed: [] } }) },
    });
    const { container, getByTestId } = render(<RateCardManager tenantName="M" card={READY} codes={CODES} />);
    upload(container);
    await waitFor(() => expect(getByTestId("rate-card-approve-blocker").textContent).toContain("nothing to approve"));
  });

  it("warns before removing lines and about rates that are not hourly", async () => {
    mockFetch({
      status: 200,
      body: {
        ok: true,
        preview: preview({
          diff: { added: [line(2400, { unit: "day" })], changed: [], unchanged: [], removed: [line(310, { providerRef: "SI-T1" })] },
          linesToCommit: [line(2400, { unit: "day" })],
        }),
      },
    });
    const { container, getByTestId } = render(<RateCardManager tenantName="M" card={READY} codes={CODES} />);
    upload(container);
    await waitFor(() => expect(getByTestId("rate-card-removed").textContent).toContain("Approving removes it"));
    expect(getByTestId("rate-card-non-hourly").textContent).toContain("1 line is priced per day or year");
  });

  it("shows the server's sentence when the user is not a workspace admin", async () => {
    mockFetch({
      status: 403,
      body: { ok: false, error: "rate_card_admin_required", detail: "Only a workspace admin can load or approve this workspace's rate card." },
    });
    const { container, getByTestId, queryByTestId } = render(<RateCardManager tenantName="M" card={READY} codes={CODES} />);
    upload(container);
    await waitFor(() => expect(getByTestId("rate-card-problem").textContent).toContain("Only a workspace admin"));
    expect(queryByTestId("rate-card-preview")).toBeNull();
  });

  it("does not claim nothing was saved when the approval cannot be confirmed", async () => {
    mockFetch({ status: 200, body: { ok: true, preview: preview() } });
    const { container, getByTestId } = render(<RateCardManager tenantName="M" card={READY} codes={CODES} />);
    upload(container);
    await waitFor(() => expect(getByTestId("rate-card-preview")).toBeTruthy());
    fireEvent.change(container.querySelector("textarea")!, { target: { value: "FY27" } });
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/approve")) throw new Error("network");
      return { ok: true, status: 200, json: async () => ({}) };
    });
    fireEvent.click(approveButton(container));
    await waitFor(() => expect(getByTestId("rate-card-problem").textContent).toContain("it may have been saved"));
  });
});
