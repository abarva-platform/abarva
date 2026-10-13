/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";
import {
  SupplierPhasePanels,
  type SourceNewEventView,
} from "./SourceNewWorkspace";
import type { SourceNewStage04VendorPanel } from "@/lib/source/new-workspace/stage04-vendor-panel";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

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
  it("keeps accepted supplier restrictions visible and closes the audit detail by default", () => {
    render(
      <SupplierPhasePanels
        phase="suppliers"
        event={event}
        panel={{
          ...panel,
          status: "available",
          blockers: [],
          counts: {
            eligible_candidate: 1,
            existing_contract_vendor: 0,
            selected_respondent: 0,
          },
          rows: [
            {
              authorityId: "accepted-1",
              legalEntityId: "supplier-1",
              legalName: "Example Supplier LLC",
              group: "eligible_candidate",
              acceptedByName: "Named Buyer",
              acceptedAt: "2026-10-12T00:00:00Z",
              evidenceReference: "candidate-evidence-1",
              sourceReferences: ["registry-source-1"],
              contactPolicy: "do_not_contact",
              contactBlocker: "Contact authority has not been granted",
              activeContactCount: 1,
            },
          ],
          suggestions: { ...panel.suggestions, status: "empty", blockers: [] },
        }}
        coverage={coverage}
        eventHref="/source/new/event-1"
        files={[]}
      />,
    );
    const region = screen.getByLabelText("Stage 04 vendor panel");
    const row = within(region).getByText("Example Supplier LLC").closest("li")!;
    expect(
      within(row)
        .getByText(/Contact policy: do not contact/)
        .closest("details"),
    ).toBeNull();
    expect(
      within(row)
        .getByText(/Contact authority has not been granted/)
        .closest("details"),
    ).toBeNull();
    const audit = within(row)
      .getByText("Acceptance and sources")
      .closest("details")!;
    expect(audit).not.toBeNull();
    expect(audit.open).toBe(false);
    expect(audit.textContent).toContain("Accepted by Named Buyer");
    expect(audit.textContent).toContain("registry-source-1");
    const counts = within(region)
      .getByText("Accepted, not under contract")
      .closest("dl")!;
    const suggestions = within(region).getByText("Suggested for review");
    expect(
      counts.compareDocumentPosition(suggestions) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      within(region).queryByRole("button", { name: /send|contact|select/i }),
    ).toBeNull();
  });

  it("keeps the NDA blocker and next action visible while retaining evidence in a closed disclosure", () => {
    render(
      <SupplierPhasePanels
        phase="suppliers"
        event={event}
        panel={panel}
        coverage={{
          ...coverage,
          suppliers: [
            {
              legalEntityId: "supplier-1",
              legalName: "Uncovered Example LLC",
              state: "not_covered",
              reason: "No executed NDA or Legal waiver is recorded.",
              authorityReference: null,
              evidenceReference: "nda-candidate-evidence-1",
              evidenceCaveats: [
                "Template version list has not been independently verified.",
              ],
            },
          ],
          nextAction: {
            label: "Resolve NDA coverage",
            detail: "Record the executed agreement or Legal waiver.",
          },
        }}
        eventHref="/source/new/event-1"
        files={[]}
      />,
    );
    const region = screen.getByLabelText("Stage 05 NDA readiness");
    const row = within(region)
      .getByText("Uncovered Example LLC")
      .closest("article")!;
    expect(within(row).getByText("Not covered").closest("details")).toBeNull();
    expect(
      within(row)
        .getByText("No executed NDA or Legal waiver is recorded.")
        .closest("details"),
    ).toBeNull();
    const evidence = within(row)
      .getByText("Evidence and review notes")
      .closest("details")!;
    expect(evidence).not.toBeNull();
    expect(evidence.open).toBe(false);
    expect(evidence.textContent).toContain("nda-candidate-evidence-1");
    expect(evidence.textContent).toContain(
      "Template version list has not been independently verified.",
    );
    expect(
      within(region).getByText("Resolve NDA coverage").closest("details"),
    ).toBeNull();
  });

  it("renders the supplier panels in the supplier phase", () => {
    renderAt("suppliers");
    expect(screen.getByLabelText("Stage 05 NDA readiness")).toBeTruthy();
    const unavailable = screen
      .getByText("Registry unavailable")
      .closest("details")!;
    expect(unavailable.open).toBe(true);
    expect(unavailable.textContent).toContain(
      "The governed candidate-supplier registry is unavailable.",
    );
    expect(screen.queryByText("Registry matches (0)")).toBeNull();
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
