/**
 * KnowledgeUiViewModelAssembler — query composition, nine-lens mapping,
 * missing-data behavior, current/target separation, candidate/proposed
 * exclusion, and the SOURCE_INCOMPLETE leadership-content proof.
 *
 * Uses the REAL fixture provider (createFixtureRuntime) against the REAL,
 * clearly-labeled synthetic fixture tenant "fixture-airline-demo-new" — never
 * SkyHarbor, Meridian, or any other tenant's fixture as a stand-in (per
 * AGENTS.md and the task brief). The one hand-built envelope in this file
 * (§ "real sparse airline-demo-new") is explicitly labeled as mirroring what
 * consumption-server/reader.ts + shape.ts actually return today for the real
 * tenant — not a fixture, and never presented as one.
 */

import { createKnowledgeUiViewModelAssembler } from "../assembler";
import type { AssemblerQuery } from "../types";
import { createFixtureRuntime } from "../../consumption-client";
import type { ConsumptionRuntime } from "../../consumption-client";
import type {
  ConsumptionEnvelope,
  KnowledgeConsumptionProvider,
} from "../../consumption-contracts";
import { PROJECTION_CONTRACT_VERSION } from "../../consumption-contracts";
import type { EnterpriseBriefV1 } from "../../consumption-contracts";

const FIXTURE_TENANT = "fixture-airline-demo-new";
const assembler = createKnowledgeUiViewModelAssembler();

function baseQuery(runtime: ConsumptionRuntime): AssemblerQuery {
  return { runtime, tenantKey: FIXTURE_TENANT };
}

describe("getEnterpriseBrief / getEnterpriseProfile", () => {
  const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");

  it("composes identity, headlineMetrics, domains and topGapRefs from a single getEnterpriseBrief call", async () => {
    const vm = await assembler.getEnterpriseBrief(baseQuery(runtime));
    expect(vm.data).not.toBeNull();
    expect(vm.data?.identity.displayName).toBe("Airline Demo New");
    expect(vm.data?.domains.length).toBe(6);
    expect(vm.data?.topGapRefs).toEqual([
      "gap-airline-cloud",
      "gap-airline-risk-conflict",
      "gap-airline-programs",
    ]);
  });

  it("never coerces a not_measured headline metric to zero", async () => {
    const vm = await assembler.getEnterpriseBrief(baseQuery(runtime));
    const cloud = vm.data?.headlineMetrics.find(
      (m) => m.metricKey === "enterprise.cloud_pct",
    );
    expect(cloud?.value).toBeNull();
    expect(cloud?.availabilityState).toBe("not_measured");
  });

  it("getEnterpriseProfile projects the same identity field", async () => {
    const vm = await assembler.getEnterpriseProfile(baseQuery(runtime));
    expect(vm.data?.organizationId).toBe("org-airline-demo-new");
  });
});

describe("getLeadershipAgenda — SOURCE_INCOMPLETE proof", () => {
  it("fixture-airline-demo-new (populated CIO/COO quotes) resolves to DATA_RECONCILED_BUT_UI_UNPROVEN, NOT SOURCE_INCOMPLETE", async () => {
    const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
    const vm = await assembler.getLeadershipAgenda(baseQuery(runtime));
    expect(vm.readiness).toBe("DATA_RECONCILED_BUT_UI_UNPROVEN");
    expect(vm.data?.perspectives.length).toBe(2);
  });

  it("the real sparse airline-demo-new case (mirrors consumption-server/reader.ts + shape.ts's actual empty output today) resolves to SOURCE_INCOMPLETE with data: null", async () => {
    // NOT a fixture — this hand-built envelope mirrors exactly what
    // shapeEnterpriseBrief() hardcodes today (perspectives: [], interpretation:
    // null) inside an otherwise "available" envelope, per
    // reports/airline-knowledge-provider-reconciliation-2026-07-30/
    // SOURCE_INCOMPLETE_COMPONENTS.md. Labeled here, not used anywhere else.
    const realSparseEnvelope: ConsumptionEnvelope<EnterpriseBriefV1> = {
      tenantKey: "airline-demo-new",
      knowledgeBaselineRef:
        "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1",
      domainPublicationVersions: {},
      projectionName: "consumption.enterprise_brief_v1",
      projectionContractVersion: PROJECTION_CONTRACT_VERSION,
      asOf: "2026-07-29T07:55:00.000Z",
      contentHash:
        "135d860b9b104b2a2891fd108ea57286dc28bc057327498c63934c6552425549",
      authorityState: "published",
      availabilityState: "available",
      freshnessState: "fresh",
      data: {
        identity: {
          organizationId: "airline-demo-new",
          displayName: null,
          industry: null,
          revenue: null,
          employees: null,
          footprint: null,
          footprintState: "available",
        },
        headlineMetrics: [],
        interpretation: null,
        perspectives: [],
        benchmarks: [],
        targets: [],
        domains: [],
        topGapRefs: [],
      },
      evidenceRefs: [],
      knownGapRefs: [],
      warnings: [],
    };
    const stubProvider: Pick<
      KnowledgeConsumptionProvider,
      "getEnterpriseBrief"
    > = {
      getEnterpriseBrief: async () => realSparseEnvelope,
    };
    const runtime: ConsumptionRuntime = {
      provider: stubProvider as KnowledgeConsumptionProvider,
      ava: {
        isAvailable: () => false,
        ask: async () => {
          throw new Error("not used");
        },
      },
      binding: { kind: "http_consumption_api", tenantKey: "airline-demo-new" },
      baselineRef:
        "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1",
      domainPublicationVersions: {},
      modelsEnabled: false,
      resolveEvidence: () => [],
    };
    const vm = await assembler.getLeadershipAgenda(baseQuery(runtime));
    expect(vm.readiness).toBe("SOURCE_INCOMPLETE");
    expect(vm.data).toBeNull();
    expect(vm.unavailableReason).not.toBeNull();
  });
});

describe("listAirlineLenses — nine-lens mapping", () => {
  it("returns exactly the 9 airline lenses, with resolution driven by real explore-domain availability", async () => {
    const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
    const lenses = await assembler.listAirlineLenses(baseQuery(runtime));
    expect(lenses.length).toBe(9);
    const byId = Object.fromEntries(lenses.map((l) => [l.lensId, l.resolved]));
    // technology + vendors are "available" in the fixture's exploreLanding.domains;
    // data is "stale" and risks is "conflicting" (neither counts as available).
    expect(byId.crew).toBe(true);
    expect(byId.baggage).toBe(true);
    expect(byId.mro).toBe(true);
    // revenue's primary domains are enterprise/data — enterprise isn't in
    // exploreLanding.domains at all, and data is stale, so revenue stays unresolved.
    expect(byId.revenue).toBe(false);
  });
});

describe("getRelationshipNeighborhood — candidate exclusion", () => {
  it("a candidate-authority edge never reaches ENABLED_AND_PROVEN; an accepted edge does", async () => {
    const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
    const vm = await assembler.getRelationshipNeighborhood({
      ...baseQuery(runtime),
      focalEntityRefs: ["app-crew-sched"],
      hopDepth: 2,
    });
    expect(vm.data).not.toBeNull();
    const candidateEdge = vm.data?.edges.find((e) => e.edgeId === "e4");
    const acceptedEdge = vm.data?.edges.find((e) => e.edgeId === "e1");
    expect(candidateEdge?.authorityState).toBe("candidate");
    expect(candidateEdge?.readiness).not.toBe("ENABLED_AND_PROVEN");
    expect(candidateEdge?.readiness).toBe("DATA_RECONCILED_BUT_UI_UNPROVEN");
    expect(acceptedEdge?.readiness).toBe("ENABLED_AND_PROVEN");
  });

  it("a target-scope candidate edge (e5) is still surfaced, never silently dropped, and never rendered as accepted", async () => {
    const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
    const vm = await assembler.getRelationshipNeighborhood({
      ...baseQuery(runtime),
      focalEntityRefs: ["app-crew-sched"],
      hopDepth: 2,
    });
    const e5 = vm.data?.edges.find((e) => e.edgeId === "e5");
    expect(e5).toBeDefined();
    expect(e5?.scope).toBe("target");
    expect(e5?.readiness).not.toBe("ENABLED_AND_PROVEN");
  });
});

describe("getCurrentVsTarget — current/target separation", () => {
  it("current and target are independently readiness-tagged; a not_measured current never borrows the target's value", async () => {
    const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
    const vm = await assembler.getCurrentVsTarget(baseQuery(runtime));
    expect(vm.data).not.toBeNull();
    expect(vm.data?.current.readiness).toBe("NOT_MEASURED");
    expect(vm.data?.current.value).toBeNull();
    expect(vm.data?.target.value?.value).toBe(70);
    expect(vm.data?.target.readiness).not.toBe(vm.data?.current.readiness);
  });
});

describe("getDecisionReadiness — composition of 2+ real queries", () => {
  it("calls both getEnterpriseBrief and getEvidenceAndGaps, and per-domain readiness reflects each domain's own state", async () => {
    const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
    const briefSpy = jest.spyOn(runtime.provider, "getEnterpriseBrief");
    const gapsSpy = jest.spyOn(runtime.provider, "getEvidenceAndGaps");
    const vm = await assembler.getDecisionReadiness(baseQuery(runtime));
    expect(briefSpy).toHaveBeenCalledTimes(1);
    expect(gapsSpy).toHaveBeenCalledTimes(1);
    const byDomain = Object.fromEntries(
      (vm.data?.domains ?? []).map((d) => [d.domainKey, d.readiness]),
    );
    expect(byDomain.programs).toBe("PROJECTION_UNAVAILABLE");
    expect(byDomain.risks).toBe("DISPUTED");
    expect(byDomain.data).toBe("STALE");
  });
});

describe("getEvidenceAndGaps", () => {
  it("passes through gaps and severity counts unchanged", async () => {
    const runtime = createFixtureRuntime(FIXTURE_TENANT, "normal");
    const vm = await assembler.getEvidenceAndGaps(baseQuery(runtime));
    expect(vm.data?.gaps.length).toBe(5);
    expect(vm.data?.severityCounts).toEqual({
      low: 0,
      medium: 3,
      high: 1,
      critical: 1,
    });
  });
});

describe("getAvaContext", () => {
  it("modelsEnabled reflects the runtime, not a fabricated value", async () => {
    const normalRuntime = createFixtureRuntime(FIXTURE_TENANT, "normal");
    const disabledRuntime = createFixtureRuntime(
      FIXTURE_TENANT,
      "models_disabled",
    );
    const normalVm = await assembler.getAvaContext({
      ...baseQuery(normalRuntime),
      mode: "brief",
    });
    const disabledVm = await assembler.getAvaContext({
      ...baseQuery(disabledRuntime),
      mode: "brief",
    });
    expect(normalVm.data?.modelsEnabled).toBe(true);
    expect(disabledVm.data?.modelsEnabled).toBe(false);
  });
});

describe("never-fabricate invariant across fixture scenarios", () => {
  const scenarios = [
    "normal",
    "withheld",
    "not_loaded",
    "not_measured",
    "conflicting",
    "stale",
  ] as const;

  it.each(scenarios)(
    "getEnterpriseBrief(%s): data is null whenever readiness is not renderable",
    async (scenario) => {
      const runtime = createFixtureRuntime(FIXTURE_TENANT, scenario);
      const vm = await assembler.getEnterpriseBrief(baseQuery(runtime));
      const renderable =
        vm.readiness === "ENABLED_AND_PROVEN" ||
        vm.readiness === "DATA_RECONCILED_BUT_UI_UNPROVEN";
      if (!renderable) {
        expect(vm.data).toBeNull();
        expect(vm.unavailableReason).not.toBeNull();
      }
    },
  );
});
