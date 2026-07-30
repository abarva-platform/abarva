/**
 * @jest-environment jsdom
 *
 * Regression coverage for a real defect found during runtime stabilization
 * (2026-07-30): CurrentVsTargetPanel and DecisionReadinessQuadrant were built
 * and typed but never mounted anywhere in the component tree -- confirmed by
 * exhaustive grep across src/. Both are now wired in (EvidenceDrawer via a
 * real entityId on node-click; EvidenceMode's "Decision readiness" section).
 *
 * The live app's honest stub provider withholds everything for
 * airline-demo-new today, so an E2E click-through can never actually reach
 * these components with real data (there is none, by design -- see
 * reports/airline-knowledge-ui-binding-2026-07-29/). This test proves the
 * WIRING is correct using a mock provider with real comparison data,
 * independent of whether airline-demo-new's data is reconciled yet.
 */
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  createUnreconciledGovernedKnowledgeProvider,
  type GovernedKnowledgeProvider,
} from "@/lib/knowledge/providers/governed-knowledge-provider";
import type {
  BaselineMetadata,
  ConsumptionEnvelope,
} from "@/lib/knowledge/providers/types";
import { KnowledgeAppProvider } from "../knowledge-app-context";
import { EvidenceDrawer } from "../EvidenceDrawer";
import { EvidenceMode } from "../evidence/EvidenceMode";

const CTX = {
  tenantKey: "airline-demo-new",
  knowledgeBaselineRef: "test-baseline",
};

const RECONCILED_META: BaselineMetadata = {
  tenantKey: CTX.tenantKey,
  knowledgeBaselineRef: CTX.knowledgeBaselineRef,
  domainPublicationRef: "test-publication",
  projectionContractVersion: "test-v1",
  asOfDate: "2026-07-30T00:00:00.000Z",
  authorityState: "accepted",
  freshnessState: "current",
  availabilityState: "available",
  evidenceCoverage: 1,
  contentHash: "test-hash",
};

function envelope<T>(data: T): ConsumptionEnvelope<T> {
  return {
    data,
    availabilityState: "available",
    authorityState: "accepted",
    freshnessState: "current",
    evidence: [],
    knownGaps: [],
    warnings: [],
    meta: RECONCILED_META,
  };
}

function withProvider(
  provider: GovernedKnowledgeProvider,
  children: React.ReactNode,
) {
  return (
    <KnowledgeAppProvider provider={provider} providerCtx={CTX}>
      {children}
    </KnowledgeAppProvider>
  );
}

describe("Orphan-component wiring (CurrentVsTargetPanel, DecisionReadinessQuadrant)", () => {
  it("EvidenceDrawer mounts CurrentVsTargetPanel and calls the provider with the real entityId when one is passed", async () => {
    const getCurrentVsTargetComparison = jest.fn().mockResolvedValue(
      envelope({
        entityId: "node-crew-legality-001",
        current: {
          label: "Current",
          stateScope: "current" as const,
          targetApprovalState: null,
          headline:
            "Crew legality enforced in one system, reasoned about in three",
          lines: [{ key: "Systems", value: "3" }],
        },
        target: null,
      }),
    );
    const provider: GovernedKnowledgeProvider = {
      ...createUnreconciledGovernedKnowledgeProvider(),
      getCurrentVsTargetComparison,
    };

    render(
      withProvider(
        provider,
        <EvidenceDrawer
          open
          onClose={() => {}}
          kind="Application"
          title="Crew Legality Engine"
          evidence={[]}
          entityId="node-crew-legality-001"
        />,
      ),
    );

    await waitFor(() =>
      expect(getCurrentVsTargetComparison).toHaveBeenCalledWith(
        CTX,
        "node-crew-legality-001",
      ),
    );
    expect(
      await screen.findByText(/crew legality enforced in one system/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/current vs\. target/i)).toBeInTheDocument();
  });

  it("EvidenceDrawer does NOT render a current-vs-target section when no entityId is available", () => {
    const provider = createUnreconciledGovernedKnowledgeProvider();
    render(
      withProvider(
        provider,
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

  it("EvidenceMode mounts DecisionReadinessQuadrant and it renders an honest withheld state against the real stub provider", async () => {
    const provider = createUnreconciledGovernedKnowledgeProvider();
    render(withProvider(provider, <EvidenceMode />));
    // Both the existing ReadinessTiles gate and the newly-wired quadrant gate
    // must resolve to real withheld banners -- not zero, not a fabricated chart.
    const banners = await screen.findAllByTestId("knowledge-state-banner");
    expect(banners.length).toBeGreaterThanOrEqual(2);
  });
});
