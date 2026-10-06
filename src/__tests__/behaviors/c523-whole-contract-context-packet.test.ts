/**
 * Item C-523 — the whole-contract context packet, measured at the destination.
 *
 * WHAT THIS SUITE IS. It is a measurement, not a repair. The item says
 * "measure first; change no retrieval in this item", so nothing under `src/lib`
 * or `src/app` changes with it. What it commits is a baseline
 * (`docs/architecture/c523-whole-contract-context-packet.json`) that a later
 * retrieval change has something to move, plus the assertions that keep the
 * baseline honest in both directions.
 *
 * WHY IT DOES NOT ASSERT ON A BUILDER'S RETURN VALUE. The packet is assembled
 * in one place and formatted for the model in another, and the interesting loss
 * happens between them: a field the builder fetches is simply never read by the
 * formatter, so a builder-level assertion would report a rich packet while the
 * model receives six scalars. Every content assertion below therefore runs over
 * the DESTINATION — the prompt block string the model is handed — and the
 * packet is only ever used as the input that produced it.
 *
 * WHAT THE ITEM INHERITED AND WHAT IS ACTUALLY TRUE. `SOURCE_BACKLOG_MASTER`
 * §B7 records the packet as carrying "a document count only". Measured here, on
 * the server-built path there is no document count either: the dataset, cube and
 * top-vendor summaries all resolve to null, because the server builder does not
 * put the keys they read into the packet. A count would have been the better
 * outcome. The negative result the item expected is the one recorded, and it is
 * more negative than the item's own premise.
 *
 * THE DETECTOR IS PROVED BEFORE IT IS TRUSTED. A per-kind count of zero over a
 * block that mentions no contract objects is ambiguous between "no objects
 * reach the model" and "the counter cannot see objects at all". So the same
 * counter is driven through a REAL second code path — the direct Contract 360
 * reader, which accepts a free-text dataset summary — and each kind is asserted
 * to come back non-zero there. A blind counter fails that case.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

import { reachableFrom } from "../../../scripts/audit/lib/route-reachability.mjs";

// The read adapter and the tenant-access check are the packet's leaves. They are
// stubbed so the measurement runs with no data plane; `jest.config.ts` remaps
// `pg` to a boundary that fails by name, so an unstubbed read would be loud
// rather than silent. Everything between the leaves and the model — the packet
// builder, the prompt-block formatter and the surface retriever — is the real
// module, because those three are the subject.
const listContract360 = jest.fn();
const getContract360 = jest.fn();
const getContractOptimizationOpportunitySet = jest.fn();

jest.mock("@/lib/source/data-model/read-adapter", () => ({
  listContract360: (...args: unknown[]) => listContract360(...args),
  getContract360: (...args: unknown[]) => getContract360(...args),
  getContractOptimizationOpportunitySet: (...args: unknown[]) =>
    getContractOptimizationOpportunitySet(...args),
}));

jest.mock("@/lib/auth/tenant-access", () => ({
  checkTenantAccessByKey: async () => ({ ok: true }),
}));

jest.mock("@/lib/tenant/aliases", () => ({
  tenantAliasesFor: (key: string) => [key],
}));

// The contract-id resolver lives in a 1,700-line module whose other exports are
// not on this path; stubbing it keeps the resolution step out of the
// measurement, which is about the packet's CONTENT rather than about which
// contract got selected.
jest.mock("@/lib/source/ava/source-workspace-visual-answer", () => ({
  resolveSourceWorkspaceContractId: () => FIXTURE_CONTRACT_ID,
}));

// Trace classification is stubbed to a fixed verdict for the same reason: an
// opportunity's trace state does not change whether the opportunity reaches the
// model, which is what is being measured.
jest.mock("@/lib/source/data-model/contract-optimization-traceability", () => ({
  classifyOpportunityTrace: () => ({ state: "traced", label: "Traced" }),
}));

jest.mock("@/lib/source/facts/view/ava-contract-grounding-context", () => ({
  opportunityForAvaTrace: (opportunity: unknown) => opportunity,
}));

import {
  buildAuthorizedSourceContract360PromptBlock,
  buildServerSourceAnswerContext,
} from "@/lib/source/ava/server-contract-answer-context";
import {
  buildSourceContract360PromptBlock,
  readSelectedSourceContractContext,
} from "@/lib/source/ava/portfolio-fallback-answer";
import { retrieveSurfaceContextSources } from "@/lib/intelligence/ask/retrievers/surface-context";
import type { AskSurfaceContext } from "@/lib/intelligence/ask/types";

const FIXTURE_TENANT_KEY = "fixture-tenant";
const FIXTURE_TENANT_NAME = "Fixture Tenant";
const FIXTURE_CONTRACT_ID = "CTR-C523-0001";
const FIXTURE_VENDOR = "Fixture Platform Vendor";
const FIXTURE_CONTRACT_NAME = "Managed platform subscription";
const FIXTURE_ANNUAL_VALUE = 4_200_000;
const FIXTURE_ACTUAL_SPEND = 3_100_000;
const FIXTURE_END_DATE = "2027-03-31";
const FIXTURE_OPPORTUNITY_LABEL = "Rebalance committed capacity to observed use";
const FIXTURE_OPPORTUNITY_NEXT_ACTION =
  "Request the metering export for the last four quarters";
const FIXTURE_NEGOTIATION_LANGUAGE =
  "Reset the commitment to observed consumption at the same unit rate";

const ARTIFACT_PATH = path.join(
  process.cwd(),
  "docs/architecture/c523-whole-contract-context-packet.json",
);

const GOVERNANCE_SEAM_MODULE = "src/lib/governance/agent-context-bundle.ts";

/**
 * The object kinds the item names, each with the markers a reader of the block
 * would use. The markers come from the spec's own vocabulary (§12.3 "Agreement
 * set": amendments, schedules, definitions; §12.4 "For a clause question…") and
 * from the evidence-reference id shapes the loaders mint (`SRC-CLS-*` and
 * friends), rather than from a format invented here.
 */
const OBJECT_KIND_MARKERS: Readonly<Record<string, RegExp>> = {
  clause: /\bclauses?\b/gi,
  definition: /\bdefinitions?\b/gi,
  schedule: /\bschedules?\b/gi,
  amendment: /\bamendments?\b/gi,
  evidence_reference: /\bSRC-[A-Z]{2,4}-\d+\b|\bevidence (?:reference|ref)s?\b/gi,
};

const OBJECT_KINDS = Object.keys(OBJECT_KIND_MARKERS);

/**
 * The eight components §12.3 requires of a Contract Context Packet, each with
 * the marker that would show it had reached the model. Recorded as
 * present/absent so a later change moves a named component rather than a total.
 */
const SPEC_COMPONENT_MARKERS: Readonly<Record<string, RegExp>> = {
  identity_and_time: /\bdataset version\b|\breporting_as_of_date\b|\bsimulation_as_of_date\b/i,
  agreement_set:
    /\border forms?\b|\bSOWs?\b|\bamendments?\b|\bschedules?\b|\bdefinitions?\b|\bprecedence\b/i,
  commercial_position: /\bannual value\b|\bcommitment\b|\bnotice\b|\brenewal\b/i,
  operating_evidence: /\binvoice line\b|\bsettlement\b|\bcredit\b|\bticket\b|\bSLA observation\b/i,
  enterprise_relationships: /\blinked (?:function|application|workload|owner|program)/i,
  computed_intelligence: /\bcontract_insight\b|\bcalculation run\b|\bdenominator\b/i,
  advisory_material: /\bopportunity_claim\b|\bplaybook rule\b|\bbenchmark\b/i,
  coverage_and_conflicts: /\bmissing document\b|\bincomplete period\b|\bunresolved discrepanc/i,
};

const SPEC_COMPONENTS = Object.keys(SPEC_COMPONENT_MARKERS);

function countObjectKinds(blockText: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const kind of OBJECT_KINDS) {
    const marker = new RegExp(
      OBJECT_KIND_MARKERS[kind].source,
      OBJECT_KIND_MARKERS[kind].flags,
    );
    counts[kind] = blockText.match(marker)?.length ?? 0;
  }
  return counts;
}

function specComponentsPresent(blockText: string): Record<string, boolean> {
  const present: Record<string, boolean> = {};
  for (const component of SPEC_COMPONENTS) {
    present[component] = SPEC_COMPONENT_MARKERS[component].test(blockText);
  }
  return present;
}

/**
 * The prompt block carries a fixed instruction footer — an answer-format
 * section naming paragraphs, charts and the words "pricing, BAFO, award". Those
 * words are the block's instructions to the model, not contract objects
 * retrieved for it, so counting them as packet content would report a packet
 * that is not there. The footer starts at its own heading, and everything from
 * that heading down is excluded before any kind is counted.
 *
 * MEASURED, and stated rather than implied: this exclusion is PRECAUTIONARY, not
 * load-bearing today. Removing it leaves all 46 cases green, because the current
 * footer wording happens to contain none of the five kind markers. It is kept
 * because the footer is prose that someone will reword, and a footer that gains
 * the word "schedule" would otherwise be counted as a schedule reaching the
 * model. A guard that no mutation can kill is not evidence of anything, so it is
 * not counted among the mutations this item caught.
 */
const ANSWER_FORMAT_HEADING = "SOURCE AVA CONTRACT ANSWER FORMAT:";

function packetPortionOf(blockText: string): string {
  const cut = blockText.indexOf(ANSWER_FORMAT_HEADING);
  return cut === -1 ? blockText : blockText.slice(0, cut);
}

function contract360Row() {
  // A partial row, cast at the boundary: `SourceContract360Row` carries dozens
  // of columns and the packet builder reads eleven of them. Naming all of them
  // would add fixture surface that asserts nothing.
  return {
    tenant_key: FIXTURE_TENANT_KEY,
    contract_id: FIXTURE_CONTRACT_ID,
    vendor_name: FIXTURE_VENDOR,
    contract_name: FIXTURE_CONTRACT_NAME,
    annual_value: FIXTURE_ANNUAL_VALUE,
    annual_value_conflict_flag: false,
    committed_annual_spend: FIXTURE_ANNUAL_VALUE,
    actual_annual_spend: FIXTURE_ACTUAL_SPEND,
    total_committed_value: 12_600_000,
    total_committed_value_conflict_flag: false,
    resolved_total_committed_value: 12_600_000,
    end_date: FIXTURE_END_DATE,
    renewal_notice_date: "2026-12-31",
    notice_deadline: null,
    notice_period_days: 90,
    auto_renew: true,
    renewal_owner_ref: "OWNER-001",
    scope_summary: "Platform subscription with managed support",
    scoped_application_count: 14,
  };
}

function opportunitySet() {
  return {
    tenantKey: FIXTURE_TENANT_KEY,
    contractId: FIXTURE_CONTRACT_ID,
    recommendationDetail: FIXTURE_OPPORTUNITY_NEXT_ACTION,
    baseline: { status: "recorded" },
    claims: [],
    opportunities: [
      {
        opportunityId: "OPP-C523-01",
        contractId: FIXTURE_CONTRACT_ID,
        label: FIXTURE_OPPORTUNITY_LABEL,
        valueType: "cost_reduction",
        amountUsd: 610_000,
        amountState: "exact",
        stage: "validate",
        evidenceGrade: "B",
        confidence: 0.6,
        blockingGap: null,
        nextAction: FIXTURE_OPPORTUNITY_NEXT_ACTION,
        owner: "Sourcing lead",
        evidenceRefs: [{ tableName: "source.contract_usage_metering" }],
        negotiationDetail: {
          buyerAsk: "Right-size the committed capacity",
          negotiationLanguage: FIXTURE_NEGOTIATION_LANGUAGE,
          vendorConcession: "Unit rate held at current level",
          timingDependency: "Before the notice date",
          priority: "high",
          riskIfIgnored: "The unused commitment renews",
        },
      },
    ],
  };
}

async function buildRealServerPacket(): Promise<AskSurfaceContext> {
  listContract360.mockResolvedValue([contract360Row()]);
  getContract360.mockResolvedValue(contract360Row());
  getContractOptimizationOpportunitySet.mockResolvedValue(opportunitySet());

  const packet = await buildServerSourceAnswerContext({
    query: `What should we do about ${FIXTURE_CONTRACT_ID} before renewal?`,
    requestContext: {
      module: "Source",
      clientKey: FIXTURE_TENANT_KEY,
      contractId: FIXTURE_CONTRACT_ID,
    } as AskSurfaceContext,
    tenantKey: FIXTURE_TENANT_KEY,
    tenantDisplayName: FIXTURE_TENANT_NAME,
  });
  if (!packet) throw new Error("the packet builder returned null under stubbed reads");
  return packet;
}

describe("C-523 · the packet the server builds for one authorized contract", () => {
  it("returns a packet whose only contract payload is selectedContract and optimizationOpportunities", async () => {
    const packet = await buildRealServerPacket();
    const sourceV4 = packet.sourceV4 as Record<string, unknown>;

    // Per key, not a count: a key swapped for another key leaves a count alone.
    expect(Object.keys(sourceV4).sort()).toEqual([
      "optimizationOpportunities",
      "selectedContract",
    ]);
    // The keys the prompt-block formatter reads and the builder never writes.
    // Each is asserted absent by name, because the consequence below depends on
    // exactly these being missing.
    for (const unwritten of [
      "executivePortfolio",
      "contextCoverage",
      "valueProof",
      "contractDirectory",
      "contractOpportunityDirectory",
    ]) {
      expect(sourceV4[unwritten]).toBeUndefined();
    }
    for (const unwritten of ["pageFacts", "groundingStatus", "evidence"]) {
      expect((packet as Record<string, unknown>)[unwritten]).toBeUndefined();
    }
  });

  it("carries the richest part of the packet, which nothing downstream reads", async () => {
    const packet = await buildRealServerPacket();
    const sourceV4 = packet.sourceV4 as Record<string, unknown>;
    const opportunities = (
      sourceV4.optimizationOpportunities as { opportunities: unknown[] }
    ).opportunities as Array<Record<string, unknown>>;

    // Asserted at BOTH ends: present here, absent at the destination below. One
    // end alone cannot tell a field that was never fetched from a field that was
    // fetched and dropped.
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0].label).toBe(FIXTURE_OPPORTUNITY_LABEL);
    expect(opportunities[0].nextAction).toBe(FIXTURE_OPPORTUNITY_NEXT_ACTION);
    expect(opportunities[0].negotiationLanguage).toBe(FIXTURE_NEGOTIATION_LANGUAGE);
  });
});

describe("C-523 · what reaches the model, measured on the prompt block", () => {
  it("carries no object of any kind the item names", async () => {
    const packet = await buildRealServerPacket();
    const block = buildSourceContract360PromptBlock(
      packet as unknown as Record<string, unknown>,
      FIXTURE_TENANT_NAME,
    );
    expect(block).not.toBe("");

    const counts = countObjectKinds(packetPortionOf(block));
    // Per kind. A single `expect(total).toBe(0)` is satisfied by a sibling: one
    // kind appearing while another vanishes leaves the total at zero.
    for (const kind of OBJECT_KINDS) {
      expect(counts[kind]).toBe(0);
    }
  });

  it("carries exactly six contract scalars, each asserted by value", async () => {
    const packet = await buildRealServerPacket();
    const block = buildSourceContract360PromptBlock(
      packet as unknown as Record<string, unknown>,
      FIXTURE_TENANT_NAME,
    );

    expect(block).toContain(FIXTURE_CONTRACT_ID);
    expect(block).toContain(FIXTURE_VENDOR);
    expect(block).toContain(FIXTURE_CONTRACT_NAME);
    expect(block).toContain("$4.2M");
    expect(block).toContain("$3.1M");
    expect(block).toContain(FIXTURE_END_DATE);
  });

  it("tells the model the evidence posture and next action are not established, while the builder held a next action", async () => {
    const packet = await buildRealServerPacket();
    const block = buildSourceContract360PromptBlock(
      packet as unknown as Record<string, unknown>,
      FIXTURE_TENANT_NAME,
    );

    expect(block).toContain("Evidence posture: not established in page context.");
    expect(block).toContain("Page next action: not established in page context.");
    // The dropped fields, named individually at the destination.
    expect(block).not.toContain(FIXTURE_OPPORTUNITY_LABEL);
    expect(block).not.toContain(FIXTURE_OPPORTUNITY_NEXT_ACTION);
    expect(block).not.toContain(FIXTURE_NEGOTIATION_LANGUAGE);
    expect(block).not.toContain("Contract dataset:");
    expect(block).not.toContain("Contract cubes:");
    expect(block).not.toContain("Top vendor cube:");
  });

  it("satisfies one of the eight components §12.3 requires, and the absent seven are named", async () => {
    const packet = await buildRealServerPacket();
    const block = buildSourceContract360PromptBlock(
      packet as unknown as Record<string, unknown>,
      FIXTURE_TENANT_NAME,
    );
    const present = specComponentsPresent(packetPortionOf(block));

    // Per component. `commercial_position` is the one that lands, and only
    // through the annual-value line.
    expect(present.commercial_position).toBe(true);
    for (const component of SPEC_COMPONENTS.filter(
      (name) => name !== "commercial_position",
    )) {
      expect(present[component]).toBe(false);
    }
  });
});

describe("C-523 · the counter is proved able to see what it reports absent", () => {
  /**
   * The positive control, and it runs through a REAL second reader rather than a
   * hand-made string: `readSelectedSourceContractContext` also accepts a direct
   * Contract 360 page context, whose dataset summary is free text. A page that
   * names contract objects therefore reaches the same block through the same
   * formatter, and a blind counter fails here while reporting a clean zero above.
   */
  const contractBookContext = {
    sourceContract360Mode: true,
    contractId: FIXTURE_CONTRACT_ID,
    contractName: FIXTURE_CONTRACT_NAME,
    vendorName: FIXTURE_VENDOR,
    annualValue: FIXTURE_ANNUAL_VALUE,
    contractDatasetSummary:
      "48 clauses / 12 definitions / 6 schedules / 3 amendments / evidence references SRC-CLS-0007, SRC-TKT-0103",
  };

  it("resolves the direct page context through the same reader", () => {
    const resolved = readSelectedSourceContractContext(contractBookContext);
    expect(resolved?.contractId).toBe(FIXTURE_CONTRACT_ID);
    expect(resolved?.datasetSummary).toContain("48 clauses");
  });

  it("reports a non-zero count for every kind when the kind is present", () => {
    const block = buildSourceContract360PromptBlock(
      contractBookContext,
      FIXTURE_TENANT_NAME,
    );
    const counts = countObjectKinds(packetPortionOf(block));
    for (const kind of OBJECT_KINDS) {
      expect(counts[kind]).toBeGreaterThan(0);
    }
  });

  it("reports the agreement-set component present when the kinds are present", () => {
    const block = buildSourceContract360PromptBlock(
      contractBookContext,
      FIXTURE_TENANT_NAME,
    );
    expect(specComponentsPresent(packetPortionOf(block)).agreement_set).toBe(true);
  });
});

describe("C-523 · the surface retriever never reads the packet", () => {
  it("yields no source from a packet that carries a contract", async () => {
    const packet = await buildRealServerPacket();
    expect(
      retrieveSurfaceContextSources(packet, "what is the renewal exposure"),
    ).toEqual([]);
  });

  it("yields a source from the same context once a fact bucket it does read is present", async () => {
    // The negative control's independent truth: the empty result above is about
    // `sourceV4` being unread, not about a call that returns nothing whatever it
    // is handed.
    const packet = await buildRealServerPacket();
    const withPageFacts = {
      ...packet,
      pageFacts: ["Portfolio totals: 14 contracts"],
    } as AskSurfaceContext;
    const sources = retrieveSurfaceContextSources(
      withPageFacts,
      "what is the renewal exposure",
    );
    expect(sources).toHaveLength(1);
    expect(sources[0].detail).toContain("Portfolio totals: 14 contracts");
  });
});

describe("C-523 · the governance seam, measured per module", () => {
  const packetChain = [
    "src/lib/source/ava/server-contract-answer-context.ts",
    "src/lib/source/ava/portfolio-fallback-answer.ts",
    "src/lib/intelligence/ask/retrievers/surface-context.ts",
    "src/lib/source/ava/module-expert.ts",
  ];

  it.each(packetChain)(
    "%s cannot reach buildValidatedAgentContextBundle at all",
    (module) => {
      const closure = reachableFrom(process.cwd(), module) as Set<string>;
      const rel = [...closure].map((file) =>
        path.relative(process.cwd(), file).split(path.sep).join("/"),
      );
      // Containment, not a count: the seam module being absent from the closure
      // means the function cannot be called from this module under static
      // imports, which is the stronger statement.
      expect(rel).not.toContain(GOVERNANCE_SEAM_MODULE);
    },
  );

  it.each(packetChain)(
    "%s contains no dynamic import, so its closure is complete",
    (module) => {
      // An import closure is blind to `await import(...)` and to `require(...)`
      // built from a path at run time. Without this case the four verdicts above
      // would be "no static path", quoted as "no path".
      const source = fs.readFileSync(path.join(process.cwd(), module), "utf8");
      expect(source).not.toMatch(/\bimport\s*\(/);
      expect(source).not.toMatch(/\brequire\s*\(/);
    },
  );

  it("records the route-level verdict, which is NOT evidence about the packet", () => {
    // This is the trap the acceptance's "assert at the destination" guards
    // against, and it is real here rather than hypothetical: one of the two
    // routes reaches the seam module through unrelated code, so a route-level
    // audit would answer "yes, governed" for a packet that never touches it.
    const agentRoute = [
      ...(reachableFrom(
        process.cwd(),
        "src/app/api/chat/agent/route.ts",
      ) as Set<string>),
    ].map((file) => path.relative(process.cwd(), file).split(path.sep).join("/"));
    const askRoute = [
      ...(reachableFrom(
        process.cwd(),
        "src/app/api/intelligence/ask/route.ts",
      ) as Set<string>),
    ].map((file) => path.relative(process.cwd(), file).split(path.sep).join("/"));

    expect(agentRoute).toContain(GOVERNANCE_SEAM_MODULE);
    expect(askRoute).not.toContain(GOVERNANCE_SEAM_MODULE);
  });
});

describe("C-523 · the committed baseline agrees with the measurement, in both directions", () => {
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8")) as {
    item: string;
    objectKindCounts: Record<string, number>;
    specComponentsPresent: Record<string, boolean>;
    packetSurfaceKeys: string[];
    packetKeysNeverWritten: string[];
    governanceSeamReachableFrom: Record<string, boolean>;
    surfaceRetrieverSourcesFromPacket: number;
  };

  it("names the item", () => {
    expect(artifact.item).toBe("C-523");
  });

  it.each(OBJECT_KINDS)(
    "records the measured count for %s and no other value",
    async (kind) => {
      const packet = await buildRealServerPacket();
      const counts = countObjectKinds(
        packetPortionOf(
          buildSourceContract360PromptBlock(
            packet as unknown as Record<string, unknown>,
            FIXTURE_TENANT_NAME,
          ),
        ),
      );
      expect(artifact.objectKindCounts[kind]).toBe(counts[kind]);
    },
  );

  it.each(SPEC_COMPONENTS)("records the measured verdict for %s", async (component) => {
    const packet = await buildRealServerPacket();
    const present = specComponentsPresent(
      packetPortionOf(
        buildSourceContract360PromptBlock(
          packet as unknown as Record<string, unknown>,
          FIXTURE_TENANT_NAME,
        ),
      ),
    );
    expect(artifact.specComponentsPresent[component]).toBe(present[component]);
  });

  it("records no kind or component the measurement does not produce", () => {
    // The other direction. An artifact carrying a stale kind, or a component
    // this measurement no longer measures, goes red here rather than sitting
    // unread beside a green suite.
    expect(Object.keys(artifact.objectKindCounts).sort()).toEqual(
      [...OBJECT_KINDS].sort(),
    );
    expect(Object.keys(artifact.specComponentsPresent).sort()).toEqual(
      [...SPEC_COMPONENTS].sort(),
    );
  });

  it("records the packet's own key set", async () => {
    const packet = await buildRealServerPacket();
    expect(artifact.packetSurfaceKeys.sort()).toEqual(
      Object.keys(packet.sourceV4 as Record<string, unknown>).sort(),
    );
  });

  it.each([
    "executivePortfolio",
    "contextCoverage",
    "valueProof",
    "contractDirectory",
    "contractOpportunityDirectory",
  ])("records %s as a key the formatter reads and the builder never writes", async (key) => {
    const packet = await buildRealServerPacket();
    // Both halves, per key: the artifact must list it, and it must still be
    // absent from the packet. A field the builder starts writing retires this
    // entry, and the entry cannot outlive the defect it describes.
    expect(artifact.packetKeysNeverWritten).toContain(key);
    expect((packet.sourceV4 as Record<string, unknown>)[key]).toBeUndefined();
  });

  it.each([
    "src/lib/source/ava/server-contract-answer-context.ts",
    "src/lib/source/ava/portfolio-fallback-answer.ts",
    "src/lib/intelligence/ask/retrievers/surface-context.ts",
    "src/lib/source/ava/module-expert.ts",
  ])("records the seam verdict for %s", (module) => {
    const closure = [
      ...(reachableFrom(process.cwd(), module) as Set<string>),
    ].map((file) => path.relative(process.cwd(), file).split(path.sep).join("/"));
    expect(artifact.governanceSeamReachableFrom[module]).toBe(
      closure.includes(GOVERNANCE_SEAM_MODULE),
    );
  });

  it("records the surface-retriever source count", async () => {
    const packet = await buildRealServerPacket();
    expect(artifact.surfaceRetrieverSourcesFromPacket).toBe(
      retrieveSurfaceContextSources(packet, "what is the renewal exposure").length,
    );
  });
});

describe("C-525 · request contract facts cannot become authoritative prompt facts", () => {
  const conflictingRequest = {
    module: "Source",
    contractId: FIXTURE_CONTRACT_ID,
    sourceContract360Mode: true,
    annualValue: 987_654_321,
    actualAnnualSpend: 876_543_210,
    contractDatasetSummary: "UNTRUSTED_DATASET_SUMMARY",
    contractCubeSummary: "UNTRUSTED_CUBE_SUMMARY",
    sourceV4: {
      selectedContract: {
        contractId: FIXTURE_CONTRACT_ID,
        annualValueUsd: 987_654_321,
      },
    },
  } as unknown as AskSurfaceContext;

  beforeEach(() => {
    listContract360.mockReset().mockResolvedValue([contract360Row()]);
    getContract360.mockReset().mockResolvedValue(contract360Row());
    getContractOptimizationOpportunitySet.mockReset().mockResolvedValue(null);
  });

  it("ask-route packet discards conflicting request values before the real formatter", async () => {
    const packet = await buildServerSourceAnswerContext({
      query: `What is the annual value of ${FIXTURE_CONTRACT_ID}?`,
      requestContext: conflictingRequest,
      tenantKey: FIXTURE_TENANT_KEY,
      tenantDisplayName: FIXTURE_TENANT_NAME,
    });
    const block = buildSourceContract360PromptBlock(
      packet as Record<string, unknown>,
      FIXTURE_TENANT_NAME,
    );
    expect(block).toContain("$4.2M");
    expect(block).not.toContain("$987.7M");
    expect(block).not.toContain("UNTRUSTED_DATASET_SUMMARY");
    expect(block).not.toContain("UNTRUSTED_CUBE_SUMMARY");
  });

  it("agent-route resolver formats only tenant-checked canonical facts", async () => {
    const block = await buildAuthorizedSourceContract360PromptBlock({
      query: `What is the annual value of ${FIXTURE_CONTRACT_ID}?`,
      requestContext: conflictingRequest,
      tenantKey: FIXTURE_TENANT_KEY,
      tenantDisplayName: FIXTURE_TENANT_NAME,
    });
    expect(block).toContain("$4.2M");
    expect(block).not.toContain("$987.7M");
    expect(block).not.toContain("UNTRUSTED_DATASET_SUMMARY");
    expect(block).not.toContain("UNTRUSTED_CUBE_SUMMARY");
    expect(getContract360).toHaveBeenCalledWith(
      FIXTURE_TENANT_KEY,
      FIXTURE_CONTRACT_ID,
    );
  });

  it("agent-route refuses a contract with no authorized record", async () => {
    getContract360.mockResolvedValue(null);
    const block = await buildAuthorizedSourceContract360PromptBlock({
      query: `What is the annual value of ${FIXTURE_CONTRACT_ID}?`,
      requestContext: conflictingRequest,
      tenantKey: FIXTURE_TENANT_KEY,
      tenantDisplayName: FIXTURE_TENANT_NAME,
    });
    expect(block).toBe("");
  });

  it("agent-route refuses a row belonging to another tenant", async () => {
    getContract360.mockResolvedValue({
      ...contract360Row(),
      tenant_key: "other-fixture-tenant",
    });
    const block = await buildAuthorizedSourceContract360PromptBlock({
      query: `What is the annual value of ${FIXTURE_CONTRACT_ID}?`,
      requestContext: conflictingRequest,
      tenantKey: FIXTURE_TENANT_KEY,
      tenantDisplayName: FIXTURE_TENANT_NAME,
    });
    expect(block).toBe("");
  });

  it("agent route wires the authorized resolver, not raw surfaceContext, to the prompt", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/chat/agent/route.ts"),
      "utf8",
    );
    const source = ts.createSourceFile("route.ts", route, ts.ScriptTarget.Latest, true);
    const declarations: ts.VariableDeclaration[] = [];
    const visit = (node: ts.Node) => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "sourceContract360PromptBlock"
      ) {
        declarations.push(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    expect(declarations).toHaveLength(1);
    const initializer = declarations[0].initializer;
    expect(initializer).toBeDefined();
    expect(initializer?.getText(source)).toContain(
      "buildAuthorizedSourceContract360PromptBlock",
    );
    expect(initializer?.getText(source)).not.toContain(
      "buildSourceContract360PromptBlock(surfaceContext",
    );
    const refusal = route.indexOf("I cannot verify that contract from the current authorized Source records.");
    const fallback = route.indexOf("const sourcePortfolioFallbackAnswer =");
    expect(refusal).toBeGreaterThan(route.indexOf("const sourceContract360PromptBlock ="));
    expect(refusal).toBeLessThan(fallback);
    expect(route.slice(refusal - 155, refusal)).toContain("!sourceContract360PromptBlock");
  });

  it("the committed destination inventory names both server-built routes", () => {
    const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8")) as {
      destinations: Array<{
        id: string;
        packetBuilder: string | null;
        packetProvenance: string;
      }>;
    };
    expect(artifact.destinations.map((destination) => destination.id)).toEqual([
      "ask-route-server-built",
      "agent-route-server-built",
    ]);
    expect(
      artifact.destinations.find(
        (destination) => destination.id === "agent-route-server-built",
      )?.packetBuilder,
    ).toBe("src/lib/source/ava/server-contract-answer-context.ts");
    expect(
      artifact.destinations.find(
        (destination) => destination.id === "agent-route-server-built",
      )?.packetProvenance,
    ).toContain("request contract fields discarded");
  });
});

describe("C-530 · server DATE values reach the selected-contract answer", () => {
  beforeEach(() => {
    listContract360.mockReset().mockResolvedValue([contract360Row()]);
    getContract360.mockReset();
    getContractOptimizationOpportunitySet.mockReset().mockResolvedValue(null);
  });

  const requestContext = {
    module: "Source",
    clientKey: FIXTURE_TENANT_KEY,
    contractId: FIXTURE_CONTRACT_ID,
    endDate: "2099-12-31",
  } as AskSurfaceContext;

  it("formats PostgreSQL DATE objects from the authorized row at the prompt destination", async () => {
    getContract360.mockResolvedValue({
      ...contract360Row(),
      end_date: new Date(2027, 2, 31),
      renewal_notice_date: new Date(2026, 11, 31),
    });
    const block = await buildAuthorizedSourceContract360PromptBlock({
      query: `When does ${FIXTURE_CONTRACT_ID} end?`,
      requestContext,
      tenantKey: FIXTURE_TENANT_KEY,
      tenantDisplayName: FIXTURE_TENANT_NAME,
    });
    expect(block).toContain("end date 2027-03-31");
    expect(block).not.toContain("2099-12-31");
    expect(block).not.toContain("end date not established");
    expect(block).not.toContain("2027-03-31T00:00:00");
  });

  it("does not turn an invalid date or another tenant's row into a date claim", async () => {
    getContract360.mockResolvedValue({
      ...contract360Row(),
      end_date: new Date(Number.NaN),
    });
    const invalidBlock = await buildAuthorizedSourceContract360PromptBlock({
      query: `When does ${FIXTURE_CONTRACT_ID} end?`,
      requestContext,
      tenantKey: FIXTURE_TENANT_KEY,
      tenantDisplayName: FIXTURE_TENANT_NAME,
    });
    expect(invalidBlock).not.toContain("end date ");

    getContract360.mockResolvedValue({
      ...contract360Row(),
      end_date: "2027-02-30",
    });
    const impossibleDateBlock = await buildAuthorizedSourceContract360PromptBlock({
      query: `When does ${FIXTURE_CONTRACT_ID} end?`,
      requestContext,
      tenantKey: FIXTURE_TENANT_KEY,
      tenantDisplayName: FIXTURE_TENANT_NAME,
    });
    expect(impossibleDateBlock).not.toContain("end date ");

    getContract360.mockResolvedValue({
      ...contract360Row(),
      tenant_key: "other-fixture-tenant",
      end_date: new Date(2027, 2, 31),
    });
    const foreignBlock = await buildAuthorizedSourceContract360PromptBlock({
      query: `When does ${FIXTURE_CONTRACT_ID} end?`,
      requestContext,
      tenantKey: FIXTURE_TENANT_KEY,
      tenantDisplayName: FIXTURE_TENANT_NAME,
    });
    expect(foreignBlock).toBe("");
  });
});
