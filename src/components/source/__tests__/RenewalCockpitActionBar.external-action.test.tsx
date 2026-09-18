/** @jest-environment jsdom */

/**
 * Behavioral test for the `source-renewal-cockpit-external-action` control
 * declared in docs/security/ai-surface-control-catalog.json.
 *
 * Two controls sit on this surface. The approval gate stops an external action
 * being created without a human rationale. The AI label stops a generated
 * vendor email reading as something that was sent.
 *
 * The catalog checker proves the control's strings appear in the file. It
 * cannot prove the button is actually disabled, or that the request carries
 * what the screen promised. This renders the real component and drives it.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RenewalCockpitActionBar } from "../RenewalCockpitActionBar";
import { SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS } from "@/lib/source/external-action-gate";

const RATIONALE =
  "Counsel reviewed the auto-renewal clause and the CFO approved declining it before the notice window closes.";

const cockpit = {
  clientKey: "tenant-a",
  contractId: "CONTRACT-1",
  vendorName: "Vendor One",
  product: "Platform subscription",
  generatedAt: "2026-09-18T00:00:00Z",
  currentAnnualSpendUsd: 1_000_000,
  timing: { summary: "The notice window closes in 30 days." },
  usage: {},
  shouldCost: {},
  leverage: {},
  alternatives: [],
  recommendedPosture: "decline_renewal",
  postureLabel: "Decline renewal",
  postureRationale: "Usage does not support the committed tier.",
} as never;

function openServeNotice() {
  render(<RenewalCockpitActionBar cockpit={cockpit} />);
  fireEvent.click(screen.getByRole("button", { name: "Serve notice" }));
}

function serveNoticeButton() {
  return screen.getByRole("button", {
    name: /Create serve-notice work item/,
  }) as HTMLButtonElement;
}

describe("renewal cockpit · external action control", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ ok: true, workItem: { id: "wi-1" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("cannot fire an external action before a human writes a rationale", () => {
    openServeNotice();

    expect(serveNoticeButton().disabled).toBe(true);

    fireEvent.click(serveNoticeButton());
    // A disabled control that still posts would satisfy the catalog and
    // defeat the gate, so the absence of the request is the assertion.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("stays disabled for a rationale shorter than the stated minimum", () => {
    openServeNotice();
    fireEvent.change(screen.getByPlaceholderText(/Summarize the business/), {
      target: { value: "x".repeat(SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS - 1) },
    });

    expect(serveNoticeButton().disabled).toBe(true);
  });

  it("sends exactly what the screen promised once a rationale is written", async () => {
    openServeNotice();
    fireEvent.change(screen.getByPlaceholderText(/Summarize the business/), {
      target: { value: RATIONALE },
    });

    expect(serveNoticeButton().disabled).toBe(false);
    fireEvent.click(serveNoticeButton());

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toContain("/api/v1/source/work-items");
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body).toMatchObject({
      kind: "serve_notice",
      humanConfirmed: true,
      humanJustification: RATIONALE,
    });
    // The evidence the operator is attesting to, not a placeholder.
    expect(body.evidenceRefs).toEqual(
      expect.arrayContaining(["contract:CONTRACT-1", "vendor:Vendor One"]),
    );
  });

  it("labels a generated vendor email as a draft that was not sent", () => {
    render(<RenewalCockpitActionBar cockpit={cockpit} />);
    fireEvent.click(screen.getByRole("button", { name: /email/i }));

    expect(screen.getByText(/draft, not sent/)).toBeTruthy();
  });
});
