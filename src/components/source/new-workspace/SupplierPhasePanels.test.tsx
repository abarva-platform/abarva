/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { SupplierPhasePanels, type SourceNewEventView } from "./SourceNewWorkspace";
import type { SourceNewStage04VendorPanel } from "@/lib/source/new-workspace/stage04-vendor-panel";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));

const panel: SourceNewStage04VendorPanel = {
  status: "blocked",
  blockers: ["The candidate authority could not be read."],
  rows: [],
  counts: {
    eligible_candidate: 0,
    selected_respondent: 0,
    existing_contract_vendor: 0,
  },
  notRecorded: [],
  suggestions: {
    status: "blocked",
    blockers: ["The governed candidate-supplier registry is unavailable."],
    rows: [],
    excludedCount: 0,
  },
  asOf: "2026-03-10",
};

const coverage: SourceNewStage05NdaCoverage = {
  status: "blocked",
  asOf: "2026-10-02T00:00:00Z",
  publishedTemplateVersions: [],
  suppliers: [],
  nextAction: { label: "Resolve NDA coverage", detail: "Record evidence." },
};

const event = {
  id: "event-1",
  clientKey: "meridian-health",
} as SourceNewEventView;

const renderAt = (phase: Parameters<typeof SupplierPhasePanels>[0]["phase"]) =>
  render(
    <SupplierPhasePanels
      phase={phase}
      event={event}
      panel={panel}
      coverage={coverage}
      eventHref="/source/new/event-1"
      files={[]}
    />,
  );

describe("SupplierPhasePanels", () => {
  it("renders the supplier panels in the supplier phase", () => {
    renderAt("suppliers");
    expect(screen.getByLabelText("Stage 05 NDA readiness")).toBeTruthy();
  });

  // The guard used to be repeated at four call sites. Concentrating it means a
  // single edit can now leak supplier data into every phase, so the leak is
  // what this asserts — not merely that the panels can render.
  it.each(["request", "define", "rfi"] as const)(
    "renders nothing in the %s phase",
    (phase) => {
      const { container } = renderAt(phase);
      expect(screen.queryByLabelText("Stage 05 NDA readiness")).toBeNull();
      expect(container.innerHTML).toBe("");
    },
  );
});
