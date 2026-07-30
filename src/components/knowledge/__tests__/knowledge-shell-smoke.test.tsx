/**
 * @jest-environment jsdom
 *
 * Full-tree smoke test for the activated Home Knowledge route mount. The route
 * itself resolves Clerk metadata on the server; this client test proves the
 * browser mount is wired to the real HTTP consumption provider, not fixtures.
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PROJECTION_CONTRACT_VERSION } from "@/lib/knowledge/consumption-contracts";
import { KnowledgeAppMount } from "../KnowledgeAppMount";

const TENANT_KEY = "airline-demo-new";
const BASELINE_REF = "kb-airline-foundation-live";

function envelope(path: string, data: unknown) {
  const projectionName = path.includes("explore")
    ? "consumption.domain_summary_v1"
    : path.includes("relationships")
      ? "consumption.relationship_edge_v1"
      : path.includes("evidence-gaps")
        ? "consumption.evidence_gap_v1"
        : path.includes("suggested-questions")
          ? "consumption.module_knowledge_packet_v1"
          : "consumption.enterprise_brief_v1";

  return {
    tenantKey: TENANT_KEY,
    knowledgeBaselineRef: BASELINE_REF,
    domainPublicationVersions: { enterprise: "v1", technology: "v1" },
    projectionName,
    projectionContractVersion: PROJECTION_CONTRACT_VERSION,
    asOf: "2026-07-30T00:00:00.000Z",
    contentHash: "hash-airline-foundation",
    authorityState: "published",
    availabilityState: "available",
    freshnessState: "fresh",
    data,
    evidenceRefs: ["ev-airline-1"],
    knownGapRefs: [],
    warnings: [],
  };
}

function briefData() {
  return {
    identity: {
      organizationId: "ORG-AIR",
      displayName: "Airline Demo New",
      industry: "Airline",
      revenue: null,
      employees: null,
      footprint: "Lab foundation proof tenant",
      footprintState: "available",
    },
    headlineMetrics: [],
    interpretation: {
      id: "interp-1",
      contentClass: "abarva_interpretation",
      availabilityState: "available",
      evidenceRefs: ["ev-airline-1"],
      headline: "Crew operations data is available with open evidence gaps.",
      body: "The active foundation baseline has enough governed context for route proof while preserving not-loaded sections.",
      pinnedBaselineRef: BASELINE_REF,
    },
    perspectives: [],
    benchmarks: [],
    targets: [],
    domains: [
      {
        domainKey: "systems_and_technology",
        label: "Systems and technology",
        availabilityState: "available",
        evidenceCoverage: 0.72,
        entityCount: null,
        openGapCount: 1,
        summary: "Core airline operations systems are loaded.",
      },
    ],
    topGapRefs: [],
  };
}

function exploreData() {
  return {
    domainKey: "systems_and_technology",
    domains: briefData().domains,
    entities: [
      {
        entityRef: "APP-CREW-SCHEDULING",
        entityType: "application",
        displayName: "Crew Scheduling System",
        domainKey: "systems_and_technology",
        availabilityState: "available",
        fields: [
          {
            key: "owner",
            label: "Owner",
            value: "Crew operations",
            availabilityState: "available",
            evidenceRefs: ["ev-airline-1"],
          },
        ],
        evidenceRefs: ["ev-airline-1"],
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 25,
  };
}

function relationshipsData() {
  return {
    focalEntityRefs: [],
    nodes: [],
    edges: [],
    evidenceByEdge: {},
    truncated: false,
    aggregationApplied: false,
    omittedNodeCount: 0,
    acceptedEdgeCount: 0,
    candidateEdgeCount: 0,
    openGapCount: 0,
  };
}

function evidenceGapsData() {
  return {
    domainKey: null,
    gaps: [],
    overallEvidenceCoverage: 0,
    severityCounts: { low: 0, medium: 0, high: 0, critical: 0 },
  };
}

describe("KnowledgeAppMount full-tree smoke render (HTTP provider)", () => {
  const originalFetch = globalThis.fetch;
  let requests: string[];

  beforeEach(() => {
    requests = [];
    globalThis.fetch = jest.fn(async (url: string | URL | Request) => {
      const path = String(url);
      requests.push(path);
      const data = path.includes("explore")
        ? exploreData()
        : path.includes("relationships")
          ? relationshipsData()
          : path.includes("evidence-gaps")
            ? evidenceGapsData()
            : path.includes("suggested-questions")
              ? []
              : briefData();
      return {
        ok: true,
        status: 200,
        json: async () => envelope(path, data),
      };
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("mounts the product shell with the authorized tenant, not the fixture namespace", async () => {
    render(<KnowledgeAppMount tenantKey={TENANT_KEY} />);

    expect(screen.getByText("AbarVa")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Knowledge" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Brief" })).toBeInTheDocument();
    expect(screen.getByText(TENANT_KEY)).toBeInTheDocument();
    expect(
      screen.queryByText(/fixture-airline-demo-new/i),
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/airline demo new/i)).toBeInTheDocument(),
    );
    expect(
      requests.some((path) =>
        path.includes("/api/knowledge/consumption/enterprise-brief"),
      ),
    ).toBe(true);
  });

  it("switches to Explore mode and renders rows returned by the HTTP API", async () => {
    render(<KnowledgeAppMount tenantKey={TENANT_KEY} />);
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));

    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
    expect(screen.getByText("Crew Scheduling System")).toBeInTheDocument();
    expect(
      requests.some((path) =>
        path.includes("/api/knowledge/consumption/explore"),
      ),
    ).toBe(true);
  });

  it("switches to every mode without reintroducing fixture fallback", async () => {
    render(<KnowledgeAppMount tenantKey={TENANT_KEY} />);

    for (const mode of [
      "Brief",
      "Explore",
      "Relationships",
      "Evidence & gaps",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: mode }));
      expect(screen.getByRole("button", { name: mode })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }

    await waitFor(() =>
      expect(
        requests.some((path) => path.includes("/api/knowledge/consumption")),
      ).toBe(true),
    );
    expect(
      screen.queryByText(/fixture-airline-demo-new/i),
    ).not.toBeInTheDocument();
  });
});
