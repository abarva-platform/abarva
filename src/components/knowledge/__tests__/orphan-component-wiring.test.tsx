/**
 * @jest-environment jsdom
 *
 * Regression coverage for a real defect found during runtime stabilization
 * (2026-07-30): CurrentVsTargetPanel and DecisionReadinessQuadrant were built
 * and typed but never mounted anywhere in the component tree -- confirmed by
 * exhaustive grep across src/. Both are wired in (EvidenceDrawer via a real
 * entityId on node-click; EvidenceMode's "Decision readiness" section) and
 * PR B kept them wired while migrating their data source onto the real
 * KnowledgeUiViewModelAssembler / fixture ConsumptionRuntime.
 */
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { createFixtureRuntime } from "@/lib/knowledge/consumption-client";
import { KnowledgeAppProvider } from "../knowledge-app-context";
import { EvidenceDrawer } from "../EvidenceDrawer";
import { EvidenceMode } from "../evidence/EvidenceMode";

const FIXTURE_TENANT = "fixture-airline-demo-new";

function withRuntime(children: React.ReactNode) {
  const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
  return (
    <KnowledgeAppProvider runtime={runtime} tenantKey={FIXTURE_TENANT}>
      {children}
    </KnowledgeAppProvider>
  );
}

describe("Orphan-component wiring (CurrentVsTargetPanel, DecisionReadinessQuadrant)", () => {
  it("EvidenceDrawer mounts CurrentVsTargetPanel and renders the real Brief-level target comparison when an entityId is passed", async () => {
    render(
      withRuntime(
        <EvidenceDrawer
          open
          onClose={() => {}}
          kind="Application"
          title="Crew Legality Engine"
          evidence={[]}
          entityId="app-crew-sched"
        />,
      ),
    );

    expect(screen.getByText(/current vs\. target/i)).toBeInTheDocument();
    // The fixture's one Brief-level target is "Cloud-hosted workloads" --
    // getCurrentVsTarget falls back to the first real target when the
    // passed entityId does not match a target id (Brief-level only today,
    // per the reconciliation matrix).
    await waitFor(() =>
      expect(
        screen.getAllByText(/cloud-hosted workloads/i).length,
      ).toBeGreaterThan(0),
    );
    // The real target value (70 percent) renders in the Target panel.
    expect(screen.getByText(/70percent/i)).toBeInTheDocument();
  });

  it("EvidenceDrawer does NOT render a current-vs-target section when no entityId is available", () => {
    render(
      withRuntime(
        <EvidenceDrawer
          open
          onClose={() => {}}
          kind="Application"
          title="Some Row"
          evidence={[]}
        />,
      ),
    );
    expect(screen.queryByText(/current vs\. target/i)).not.toBeInTheDocument();
  });

  it("EvidenceMode mounts DecisionReadinessQuadrant and it renders its honest PROJECTION_UNAVAILABLE state (no Tower value-at-stake computation)", async () => {
    render(withRuntime(<EvidenceMode />));
    expect(
      await screen.findByText(/decision-readiness quadrant/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/value-at-stake belongs to tower/i),
    ).toBeInTheDocument();
  });
});
