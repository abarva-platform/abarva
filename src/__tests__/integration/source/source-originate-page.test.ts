/**
 * @jest-environment jsdom
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  SourceOriginatePage,
  buildEventName,
} from "@/components/source/SourceOriginatePage";

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

  it("renders intake basics before the optional category selector", () => {
    expect(html).toContain("Intake basics");
    expect(html).toContain("Category");
    expect(html.indexOf("Intake basics")).toBeLessThan(
      html.indexOf("Category"),
    );
  });

  it("renders the optional category selector with five canonical archetypes", () => {
    expect(html).toContain("Category");
    expect(html).toContain(
      "aVa can infer this after the intake facts are clear",
    );
    expect(html).toContain("Application Managed Services");
    expect(html).toContain("Cloud &amp; Infrastructure");
    expect(html).toContain("Data, Analytics &amp; AI");
    expect(html).toContain("Enterprise Software");
    expect(html).toContain("Custom / Multi-tower");
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
    expect(screen.getByText("Captured facts checklist")).toBeTruthy();
  });

  it("wires intake submission to persisted Source event creation", () => {
    expect(source).toContain("/api/v1/source/events");
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
    expect(
      screen.getByText("Capture the five basics to open the approval route."),
    ).toBeTruthy();
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

  it("opens completed intake events on the approval page, not the canvas", async () => {
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
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/source/events/event-123/approval",
      );
    });
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
    expect(
      screen.getByText("Capture the five basics to open the approval route."),
    ).toBeTruthy();
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
