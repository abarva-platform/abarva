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

function envelope(path: string, data: unknown, projectionNameOverride?: string) {
  const projectionName = path.includes("explore")
    ? (projectionNameOverride ?? "consumption.application_inventory_v1")
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

function exploreData(domainKey = "technology") {
  if (domainKey === "technology_estate") {
    return {
      domainKey,
      domains: briefData().domains,
      entities: [
        {
          entityRef: "TECH-AIRPORT-CLOUD-001",
          entityType: "technology_estate",
          displayName: "Airport cloud platform 001",
          domainKey,
          availabilityState: "available",
          fields: [],
          evidenceRefs: ["ev-airline-1"],
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 25,
    };
  }
  if (domainKey === "data_products") {
    return {
      domainKey,
      domains: briefData().domains,
      entities: [
        {
          entityRef: "DATA-AIRPORT-OPS-MART-001",
          entityType: "data_product",
          displayName: "Airport operations mart 001",
          domainKey,
          availabilityState: "available",
          fields: [],
          evidenceRefs: ["ev-airline-1"],
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 25,
    };
  }
  return {
    domainKey,
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

function suggestedQuestionsData() {
  return [
    {
      id: "airline-brief-question-1",
      question: "Which governed gaps should leadership close first?",
      mode: "brief",
      requiresModel: true,
    },
  ];
}

describe("KnowledgeAppMount full-tree smoke render (HTTP provider)", () => {
  const originalFetch = globalThis.fetch;
  let requests: string[];

  beforeEach(() => {
    requests = [];
    globalThis.fetch = jest.fn(async (
      url: string | URL | Request,
      init?: RequestInit,
    ) => {
      const path = String(url);
      requests.push(path);
      const body =
        typeof init?.body === "string"
          ? (JSON.parse(init.body) as { domainKey?: string | null })
          : {};
      const domainKey = body.domainKey ?? "technology";
      const data = path.includes("explore")
        ? exploreData(domainKey)
        : path.includes("relationships")
          ? relationshipsData()
          : path.includes("evidence-gaps")
        ? evidenceGapsData()
        : path.includes("suggested-questions")
          ? suggestedQuestionsData()
          : briefData();
      const exploreProjection =
        domainKey === "technology_estate"
          ? "consumption.technology_estate_v1"
          : domainKey === "data_products"
            ? "consumption.data_product_inventory_v1"
            : "consumption.application_inventory_v1";
      return {
        ok: true,
        status: 200,
        json: async () =>
          envelope(path, data, path.includes("explore") ? exploreProjection : undefined),
      };
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("mounts the product shell with the authorized tenant, not the fixture namespace", async () => {
    render(<KnowledgeAppMount tenantKey={TENANT_KEY} />);

    expect(screen.queryByRole("navigation", { name: "Product modules" })).not.toBeInTheDocument();
    expect(screen.queryByText("AbarVa")).not.toBeInTheDocument();
    expect(screen.queryByText(TENANT_KEY)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Brief" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Relationships" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evidence & gaps" })).toBeInTheDocument();
    expect(screen.queryByText("Models off")).not.toBeInTheDocument();
    expect(screen.queryAllByText(/All model providers are disabled/i)).toHaveLength(0);
    expect(screen.getByText("Reasoning unavailable")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Suggested questions")).toBeInTheDocument(),
    );
    const suggestedQuestion = screen.getByRole("button", {
      name: "Which governed gaps should leadership close first?",
    });
    expect(suggestedQuestion).toBeDisabled();
    expect(screen.getByText("Purpose and priorities not yet published")).toBeInTheDocument();
    expect(screen.getByText("Goals not yet published")).toBeInTheDocument();
    expect(
      screen.getAllByTestId("knowledge-governed-state-panel").length,
    ).toBeGreaterThanOrEqual(2);
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
    expect(
      requests.some((path) =>
        path.includes("/api/knowledge/consumption/suggested-questions"),
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

  it("renders projection-backed data products and infrastructure Explore tabs", async () => {
    render(<KnowledgeAppMount tenantKey={TENANT_KEY} />);
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));

    fireEvent.click(await screen.findByRole("button", { name: "Data products" }));
    await waitFor(() =>
      expect(screen.getByText("Airport operations mart 001")).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/data_product_inventory_v1 projection is registered/i),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Infrastructure and cloud" }));
    await waitFor(() =>
      expect(screen.getByText("Airport cloud platform 001")).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/technology_estate_v1 projection is registered/i),
    ).not.toBeInTheDocument();
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
