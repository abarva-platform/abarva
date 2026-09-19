/**
 * @jest-environment jsdom
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  SourceOriginatePage,
  buildEventName,
  extractEstimatedValue,
} from "@/components/source/SourceOriginatePage";
import { SOURCE_CATEGORIES } from "@/lib/source/taxonomy/category-taxonomy";

const mockRouterPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => "/source/new",
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({
    children,
    onArtifact,
  }: {
    children: ReactNode;
    onArtifact?: (artifact: unknown) => void;
  }) =>
    createElement(
      "div",
      null,
      createElement(
        "button",
        {
          type: "button",
          "data-testid": "emit-source-brief-progress",
          onClick: () =>
            onArtifact?.({
              type: "brief-progress",
              fieldsTotal: 5,
              fieldsFilled: 5,
              fields: [
                {
                  id: "trigger",
                  label: "Why now / trigger",
                  status: "filled",
                  value:
                    "Contract renewal plus 20% cost-reduction target and AI operating model exploration.",
                },
                {
                  id: "decisionOwner",
                  label: "Decision owner",
                  status: "filled",
                  value:
                    "Anita Krishnamurthy as CDIO with Finance and Research Operations as approvers.",
                },
                {
                  id: "scopeBoundary",
                  label: "Scope boundary",
                  status: "filled",
                  value:
                    "In: AMS, cloud operations, Epic integration support. Out: deskside and security operations.",
                },
                {
                  id: "valueTarget",
                  label: "Value target",
                  status: "filled",
                  value:
                    "$8M run-rate savings and higher platform reliability.",
                },
                {
                  id: "baselineOwner",
                  label: "Baseline owner",
                  status: "filled",
                  value:
                    "Finance owns spend baseline; ServiceNow owner owns ticket-volume extract.",
                },
              ],
            }),
        },
        "Emit brief progress",
      ),
      children,
    ),
}));

const SOURCE_FILE = resolve(
  __dirname,
  "../../../components/source/SourceOriginatePage.tsx",
);

describe("SourceOriginatePage (SRC-FLW-INTAKE)", () => {
  let html: string;
  let source: string;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    window.localStorage.clear();
    (global.fetch as jest.Mock | undefined)?.mockReset?.();
  });

  beforeAll(() => {
    source = readFileSync(SOURCE_FILE, "utf8");
    html = renderToStaticMarkup(
      createElement(SourceOriginatePage, {
        clientName: "Apex Retail Group",
        clientShortName: "Apex Retail",
        clientKey: "apexretail",
      }),
    );
  });

  it("marks the file as a client component with 'use client'", () => {
    expect(source).toMatch(/^["']use client["'];?/);
  });

  it("renders the five required intake facts", () => {
    expect(html).toContain("Why now / trigger");
    expect(html).toContain("Decision owner");
    expect(html).toContain("Scope boundary");
    expect(html).toContain("Value or savings target");
    expect(html).toContain("Minimum data / baseline owner");
  });

  it("renders the required intake facts before the optional category selector", () => {
    expect(html.indexOf("Why now / trigger")).toBeGreaterThanOrEqual(0);
    expect(html.indexOf("Why now / trigger")).toBeLessThan(
      html.indexOf("Category"),
    );
  });

  it("projects every canonical sourcing category into the optional selector", () => {
    render(
      createElement(SourceOriginatePage, {
        clientName: "Apex Retail Group",
        clientShortName: "Apex Retail",
        clientKey: "apexretail",
      }),
    );

    expect(screen.getByText("Category")).toBeTruthy();
    for (const category of SOURCE_CATEGORIES) {
      expect(screen.getByText(category.label)).toBeTruthy();
    }
  });

  it("renders agent guidance without generic chatbot copy", () => {
    expect(html).toContain("How to use this");
    // Founder feedback 2026-05-10 reshaped Source intake to be chat-driven
    // (the right pane fills from Sentinel's brief-progress artifacts) so
    // the guidance labels were rewritten to reflect that posture.
    expect(html).toContain("Chat-driven brief");
    expect(html).toContain("Five fields");
    expect(html).toContain("Evidence caution");
    // Substantive guidance copy: the brief is filled by chatting.
    expect(html).toContain("the brief on the right fills as you talk");
  });

  it("augments AppShell with onArtifact wiring + sourceIntakeMode signal", () => {
    // Without these, Sentinel never emits brief-progress artifacts on
    // /source/new and the right pane never auto-fills (the bug behind
    // the founder's 'why have a form when you have agent interface'
    // feedback). Guard against silent regression.
    expect(source).toContain("handleArtifact");
    expect(source).toMatch(/artifact\.type !== ["']brief-progress["']/);
    expect(source).toContain("sourceIntakeMode: true");
    expect(source).toContain("onArtifact={handleArtifact}");
  });

  it("binds Sentinel brief-progress artifacts from chat into the right-pane capture fields", () => {
    render(
      createElement(SourceOriginatePage, {
        clientName: "Meridian Health",
        clientShortName: "Meridian Health",
        clientKey: "meridian",
      }),
    );

    fireEvent.click(screen.getByTestId("emit-source-brief-progress"));

    expect(
      screen.getByDisplayValue(
        "Contract renewal plus 20% cost-reduction target and AI operating model exploration.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByDisplayValue(
        "Anita Krishnamurthy as CDIO with Finance and Research Operations as approvers.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByDisplayValue(
        "In: AMS, cloud operations, Epic integration support. Out: deskside and security operations.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByDisplayValue(
        "$8M run-rate savings and higher platform reliability.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByDisplayValue(
        "Finance owns spend baseline; ServiceNow owner owns ticket-volume extract.",
      ),
    ).toBeTruthy();
    expect(screen.getAllByText("From chat")).toHaveLength(5);
    expect(screen.getByTestId("source-intake-completion-footer")).toBeTruthy();
    expect(screen.getByText("5 of 5 facts captured")).toBeTruthy();
    expect(screen.getByText("Open event for approval")).toBeTruthy();
    expect(
      within(screen.getByTestId("source-intake-completion-footer")).getByText(
        "Minimum approval packet",
      ),
    ).toBeTruthy();
  });

  it("wires intake submission to persisted Source event creation", () => {
    expect(source).toContain("/api/v1/source/events");
    expect(source).toContain("sourcingMotion");
    expect(source).toContain("/approval");
    expect(source).not.toContain("Opening event canvas");
    expect(html).not.toContain("Open event for approval");
  });

  it("does not reveal the approval footer before all five facts are captured", () => {
    render(
      createElement(SourceOriginatePage, {
        clientName: "Apex Retail Group",
        clientShortName: "Apex Retail",
        clientKey: "apexretail",
      }),
    );

    expect(screen.queryByTestId("source-intake-completion-footer")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "five minimum approval facts",
    );
    expect(screen.getByRole("status").textContent).toContain(
      "placeholders do not count",
    );
  });

  it("saves a completed intake draft without posting a lifecycle event", () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;
    render(
      createElement(SourceOriginatePage, {
        clientName: "Meridian Health",
        clientShortName: "Meridian Health",
        clientKey: "meridian",
      }),
    );
    fireEvent.click(screen.getByTestId("emit-source-brief-progress"));
    fireEvent.click(screen.getByTestId("source-intake-save-draft"));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(
      window.localStorage.getItem(
        "abarva.source.originate.explicit-draft.meridian",
      ),
    ).toContain("Contract renewal");
    expect(
      screen.getByText("Draft saved. No lifecycle action has run."),
    ).toBeTruthy();
  });

  it("opens normal completed intake events in the Source New workspace", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        event: { id: "event-123" },
        eventUrl: "/source/events/event-123?stage=Strategy",
      }),
    });

    render(
      createElement(SourceOriginatePage, {
        clientName: "Apex Retail Group",
        clientShortName: "Apex Retail",
        clientKey: "apexretail",
      }),
    );
    fireEvent.click(screen.getByTestId("emit-source-brief-progress"));
    fireEvent.click(screen.getByTestId("source-intake-open-event"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/source/events",
        expect.any(Object),
      );
      expect(mockRouterPush).toHaveBeenCalledWith("/source/new/event-123");
    });
  });

  it("surfaces Source event creation network failures instead of silently staying on intake", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

    render(
      createElement(SourceOriginatePage, {
        clientName: "Apex Retail Group",
        clientShortName: "Apex Retail",
        clientKey: "apexretail",
      }),
    );
    fireEvent.click(screen.getByTestId("emit-source-brief-progress"));
    fireEvent.click(screen.getByTestId("source-intake-open-event"));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("network down");
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("submits raw intake fields once so approval readback can render clean facts", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        event: { id: "event-123" },
        eventUrl: "/source/events/event-123?stage=Strategy",
      }),
    });
    global.fetch = fetchMock;

    render(
      createElement(SourceOriginatePage, {
        clientName: "Lakeshore Holdings",
        clientShortName: "Lakeshore",
        clientKey: "lakeshore",
      }),
    );
    fireEvent.click(screen.getByTestId("emit-source-brief-progress"));
    fireEvent.click(screen.getByTestId("source-intake-open-event"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const request = fetchMock.mock.calls[0]?.[1] as { body?: string };
    const payload = JSON.parse(request.body ?? "{}") as {
      eventName?: string;
      scopeDescription?: string;
      valueTargetDescription?: string;
      baselineOwnerDescription?: string;
      creationRequestId?: string;
    };

    expect(payload.eventName).toBe("Lakeshore AMS Sourcing Event");
    expect(payload.scopeDescription).toBe(
      "In: AMS, cloud operations, Epic integration support. Out: deskside and security operations.",
    );
    expect(payload.scopeDescription).not.toContain("Value target:");
    expect(payload.scopeDescription).not.toContain("Baseline owner:");
    expect(payload.valueTargetDescription).toBe(
      "$8M run-rate savings and higher platform reliability.",
    );
    expect(payload.baselineOwnerDescription).toBe(
      "Finance owns spend baseline; ServiceNow owner owns ticket-volume extract.",
    );
    expect(payload.creationRequestId).toEqual(expect.any(String));
    expect(payload.creationRequestId).not.toHaveLength(0);
    expect(payload.eventName).not.toContain(payload.creationRequestId ?? "");
  });

  it("creates contract-optimization events without rerunning diagnosis for a known contract", async () => {
    mockSearchParams = new URLSearchParams({
      intent: "contract-optimization",
      contractId: "CTR-090",
      contractName: "Crestline AMS Master Services Agreement",
      vendorName: "Crestline",
    });
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        event: { id: "event-door1" },
        eventUrl: "/source/events/event-door1?stage=Strategy",
      }),
    });
    global.fetch = fetchMock;

    render(
      createElement(SourceOriginatePage, {
        clientName: "SkyHarbor Global",
        clientShortName: "SkyHarbor",
        clientKey: "skyharbor_global",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByDisplayValue(
          "Optimize Crestline AMS Master Services Agreement with Crestline. Contract ref: CTR-090.",
        ),
      ).toBeTruthy();
    });
    expect(screen.getByText("Optimize an existing contract")).toBeTruthy();
    expect(screen.getByLabelText("Contract optimization ledgers")).toBeTruthy();
    expect(screen.getByText("Recoverable leakage")).toBeTruthy();
    expect(screen.getByText("Avoided cost")).toBeTruthy();
    expect(screen.getByText("Negotiated improvement")).toBeTruthy();
    expect(screen.getByText("Realized value")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Negotiation decision owner/i), {
      target: { value: "CIO and procurement sponsor" },
    });
    fireEvent.change(screen.getByLabelText(/Contract scope and boundaries/i), {
      target: { value: "AMS run support and integration fixes in scope." },
    });
    fireEvent.change(screen.getByLabelText(/Recovery hypothesis/i), {
      target: { value: "$3M-$4M recoverable range to test" },
    });
    fireEvent.click(screen.getByTestId("source-intake-open-event"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/source/workspace/contract/CTR-090/optimization",
        { method: "POST" },
      ),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/v1/source/events",
      expect.anything(),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/v1/source/event-door1/door1/diagnose",
      expect.anything(),
    );
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/source/events/event-door1/approval",
    );
  });

  it("names integration-fabric events as a clean commercial-control event instead of echoing the scope clause", () => {
    expect(
      buildEventName("Apex Retail", {
        trigger:
          "Renewal pressure is mounting across Adobe, Salesforce, and Accenture.",
        decisionOwner: "Carlos Rivera",
        scopeBoundary:
          "In scope: integration fabric platform and SI layer touching Five9, Sterling Commerce, Snowflake, Adobe, Salesforce, Accenture.",
        valueTarget:
          "Avoid duplicate integration build and prevent renewal lock-in; no base-case savings yet.",
        baselineOwner: "Nathan Kohl owns the commercial baseline.",
      }),
    ).toBe("Apex Retail Integration Fabric Commercial Control Event");
  });

  it("strips the bare 'In:'/'Out:' prefix the scope-boundary placeholder itself models, not just 'in scope:'", () => {
    // The field's own placeholder text reads "In: AMS for SAP and eCommerce.
    // Out: security operations and deskside support...", so users naturally
    // follow that exact convention. The sanitizer previously only stripped
    // "in scope:"/"out of scope:", leaving a raw "In:" leaking into the
    // auto-generated event title (e.g. "Acme In: EHR application
    // management... Sourcing Event").
    expect(
      buildEventName("Acme Health", {
        trigger: "Incumbent contract expires in 7 months.",
        decisionOwner: "CIO",
        scopeBoundary:
          "In: EHR application management and integration engine support. Out: network operations and end-user helpdesk.",
        valueTarget: "Target 18% run-cost reduction.",
        baselineOwner: "Finance owns the baseline.",
      }),
    ).not.toMatch(/^Acme Health In:/);
  });

  it("threads the tenant name into the page header without hard-coding Apex", () => {
    const meridianHtml = renderToStaticMarkup(
      createElement(SourceOriginatePage, {
        clientName: "Meridian Health System",
        clientShortName: "Meridian Health",
        clientKey: "meridian",
      }),
    );
    expect(meridianHtml).toContain("Meridian Health System");
    expect(meridianHtml).not.toContain("Apex Retail");
  });

  it("starts new sourcing events clean and clears legacy autosaved drafts", () => {
    window.localStorage.setItem(
      "abarva.source.originate.intake.meridian",
      JSON.stringify({
        intake: {
          trigger:
            "Contract renewal plus 20% cost-reduction target and AI operating model exploration",
          decisionOwner: "Stale owner",
          scopeBoundary: "Stale scope",
          valueTarget: "$8M stale target",
          baselineOwner: "Stale baseline owner",
        },
        categoryId: "ams",
        savedAt: "2026-05-10T00:00:00.000Z",
      }),
    );

    render(
      createElement(SourceOriginatePage, {
        clientName: "Meridian Health",
        clientShortName: "Meridian Health",
        clientKey: "meridian",
      }),
    );

    expect(
      screen.queryByDisplayValue(
        "Contract renewal plus 20% cost-reduction target and AI operating model exploration",
      ),
    ).toBeNull();
    expect(screen.queryByText("Draft restored from autosave")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain(
      "five minimum approval facts",
    );
    expect(
      window.localStorage.getItem("abarva.source.originate.intake.meridian"),
    ).toBeNull();

    // Keep the legacy key around only as a cleanup target. The page should not
    // restore old browser residue into a new intake. Explicit Save draft uses a
    // separate key and is tested above.
    expect(source).toMatch(
      /AUTOSAVE_KEY_PREFIX = ["']abarva\.source\.originate\.intake["']/,
    );
    expect(source).toMatch(/autosaveKey\(clientKey\)/);
    expect(source).toContain("clearLegacyAutosavedDraft(clientKey)");
    expect(source).not.toContain("readAutosavedDraft(clientKey)");
    expect(source).not.toContain("source-originate-draft-restored");
    expect(source).toMatch(/typeof window === ["']undefined["']/);
  });

  it("uses the resizable splitter shell — full-bleed, no max-width cap, drag handle present", () => {
    // Splitter from the canvas package wraps both panes, exposing a known testid.
    expect(html).toContain("source-canvas-splitter");
    expect(html).toContain("source-originate-canvas");
    // Page chrome must NOT impose a hard width cap any longer — the splitter
    // distributes space across the full viewport.
    expect(source).not.toContain("maxWidth: 1440");
    // Full-viewport pin so the chat input stays sticky without page scroll.
    expect(source).toMatch(/height: ["']calc\(100vh - 64px\)["']/);
    // Drag-resize handle in the splitter component.
    expect(html).toMatch(/role="separator"[^>]*aria-orientation="vertical"/);
  });
});

describe("extractEstimatedValue (SRC-FLW-INTAKE value parsing)", () => {
  // Defect guarded (live): the FIRST number in a free-text value target was
  // treated as USD. "Target 15-20% run-cost reduction" captured "15" and stored
  // $15 as the event baseline, producing garbage like "$15" / "305,654,347% of
  // baseline" in the value-type-waterfall header. A number becomes a dollar
  // amount ONLY with a currency signal — a `$` prefix OR a magnitude suffix.
  it("rejects a percentage range target — '15-20% run-cost reduction' → undefined", () => {
    expect(
      extractEstimatedValue("Target 15-20% run-cost reduction via repricing"),
    ).toBeUndefined();
  });

  it("rejects a bare percentage — '15%' → undefined", () => {
    expect(extractEstimatedValue("15% unit cost improvement")).toBeUndefined();
  });

  it("rejects a bare count with no currency signal — '3 vendors' → undefined", () => {
    expect(
      extractEstimatedValue("Consolidate to top 3 vendors"),
    ).toBeUndefined();
    expect(extractEstimatedValue("15")).toBeUndefined();
  });

  it("parses a $-signalled millions amount — '$4M savings' → 4_000_000", () => {
    expect(extractEstimatedValue("$4M savings")).toBe(4_000_000);
  });

  it("parses a $-signalled thousands amount — 'target $500k' → 500_000", () => {
    expect(extractEstimatedValue("target $500k")).toBe(500_000);
  });

  it("parses a billions amount — '$1.2bn' → 1_200_000_000", () => {
    expect(extractEstimatedValue("$1.2bn run-rate")).toBe(1_200_000_000);
    expect(extractEstimatedValue("$2 billion baseline")).toBe(2_000_000_000);
  });

  it("returns the FIRST currency-signalled candidate, skipping a trailing rate — '$4M savings, 15% unit cost' → 4_000_000", () => {
    expect(extractEstimatedValue("target $4M savings, 15% unit cost")).toBe(
      4_000_000,
    );
  });

  it("still parses a bare magnitude suffix with no $ — '4M run-rate' → 4_000_000", () => {
    expect(extractEstimatedValue("4M run-rate savings")).toBe(4_000_000);
  });
});
