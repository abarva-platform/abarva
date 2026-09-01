// Surface proof: governed-evidence assembly, request building, and the generate
// service wire together correctly — with the vendor-facing exclusion and the quality
// gate honored — all without Azure/Claude/DB (collaborators injected).
import { buildDeliverableRequest } from "../build-request";
import { assembleGovernedEvidence } from "../evidence-assembler";
import {
  buildSectionDrivenEvidenceQueries,
  runDeliverableForTenant,
} from "../generate-service";
import { getArtifactBrief } from "../artifact-brief-registry";
import { FIRST_CAPITAL_ARCHITECTURE } from "@/lib/visual-system/__fixtures__/first-capital-architecture";
import type { GovernedEvidenceItem, OrchestrationResult } from "../index";
import type { TenantContextChunk } from "@/lib/azure-search/tenant-context-retriever";
import type { DeliverablePlan } from "@/lib/deliverables/planning/deliverable-plan";

function chunk(over: Partial<TenantContextChunk>): TenantContextChunk {
  return {
    tenantKey: "skyharbor-air",
    chunkId: "c1",
    text: "baseline fact",
    embeddingStatus: "embedded",
    sourceDoc: "Run-cost baseline",
    sourceBasis: "run_cost_baseline",
    classification: "internal",
    vectorScore: 0.9,
    ...over,
  };
}

describe("assembleGovernedEvidence", () => {
  it("maps tenant context chunks to clean citation-numbered evidence", async () => {
    const fakeQuery = (async () => [
      chunk({
        chunkId: "c1",
        sourceDoc: "SLA baseline",
        sourceBasis: "sla_baseline",
        vectorScore: 0.95,
      }),
      chunk({
        chunkId: "c2",
        sourceDoc: "App inventory",
        sourceBasis: "application_inventory",
        vectorScore: 0.6,
      }),
    ]) as never;
    const out = await assembleGovernedEvidence(
      { tenantClientKey: "skyharbor-air", query: "q" },
      { queryTenantContext: fakeQuery },
    );
    expect(out.retrievedCount).toBe(2);
    expect(out.evidence[0].citationNumber).toBe(1);
    expect(out.evidence[0].confidence).toBe("high"); // 0.95
    expect(out.evidence[1].confidence).toBe("medium"); // 0.6
    expect(out.sourceRegister).toHaveLength(2);
    expect(out.coverage.retrieved).toBe(2);
    expect(out.coverage.packed).toBe(2);
    expect(out.coverage.coverageRatio).toBeNull();
    expect(out.coverage.coverageState).toBe("no_approved_evidence");
    expect(out.coverage.requiresAttention).toBe(false);
    // internal ids stay in provenanceRef (audit-only); never in the body-facing fields
    for (const e of out.evidence) {
      expect(e.label).not.toMatch(/c1|c2/);
      expect(e.statement).not.toMatch(/c1|c2/);
    }
    // the source register the document exposes carries no provenance handle at all
    expect(JSON.stringify(out.sourceRegister)).not.toMatch(/c1|c2/);
  });

  it("runs section-driven retrieval queries and dedupes chunks by chunkId", async () => {
    const queries: string[] = [];
    const fakeQuery = (async (input: { query: string }) => {
      queries.push(input.query);
      return [
        chunk({
          chunkId: "same",
          sourceDoc: `Doc for ${input.query}`,
          text: `Evidence for ${input.query}`,
        }),
      ];
    }) as never;
    const out = await assembleGovernedEvidence(
      {
        tenantClientKey: "skyharbor-air",
        queries: ["Architecture current state", "Architecture target state"],
      },
      { queryTenantContext: fakeQuery },
    );

    expect(queries).toEqual([
      "Architecture current state",
      "Architecture target state",
    ]);
    expect(out.retrievedCount).toBe(1);
    expect(out.evidence).toHaveLength(1);
  });

  it("excludes confidential evidence for a vendor-facing audience (no incumbent-spend leak)", async () => {
    const fakeQuery = (async (input: {
      filters?: { sensitivity?: string[] };
    }) => {
      // simulate the index honoring the sensitivity allowlist the assembler passes
      const allow = input.filters?.sensitivity ?? [];
      const all = [
        chunk({
          chunkId: "pub",
          sourceBasis: "sla_baseline",
          classification: "internal",
        }),
        chunk({
          chunkId: "conf",
          sourceBasis: "contract_baseline",
          classification: "confidential",
        }),
      ];
      return all.filter((c) => allow.includes(c.classification as string));
    }) as never;
    const vendor = await assembleGovernedEvidence(
      {
        tenantClientKey: "skyharbor-air",
        query: "q",
        audienceIsVendorFacing: true,
      },
      { queryTenantContext: fakeQuery },
    );
    expect(
      vendor.evidence.some((e) => e.evidenceFamily === "contract_baseline"),
    ).toBe(false);
    expect(
      vendor.evidence.some((e) => e.evidenceFamily === "Sla Baseline"),
    ).toBe(true);
  });

  it("adds approved move current-state evidence when tenant context retrieval is empty", async () => {
    const fakeQuery = (async () => []) as never;
    const fakeDb = {
      from(table: string) {
        if (table === "evidence_ledger") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [
                        {
                          id: "ledger-1",
                          claim_text:
                            "IT organization baseline ingested: 14 workforce records.",
                          source_ref: {
                            moveId: "move-1",
                            family: "it_org_structure",
                            fileRef: "01_it_org_structure.csv",
                          },
                          freshness_at: "2026-06-21T00:00:00Z",
                          confidence: 0.8,
                        },
                      ],
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "program_evidence_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: () => ({ in: async () => ({ data: [] }) }) };
      },
    } as never;

    const out = await assembleGovernedEvidence(
      {
        tenantClientKey: "skyharbor-air",
        clientId: "client-1",
        sourceArtifactRef: "move-1",
        query: "charter current state",
      },
      { queryTenantContext: fakeQuery, db: fakeDb },
    );

    expect(out.retrievedCount).toBe(1);
    expect(out.evidence[0].statement).toMatch(/IT organization baseline/);
    expect(out.evidence[0].label).toBe("01 It Org Structure.csv");
    expect(out.sourceRegister).toHaveLength(1);
  });

  it("prioritizes move phase-capture evidence ahead of broad tenant context", async () => {
    const fakeQuery = (async () => [
      chunk({
        chunkId: "tenant-ai-portfolio",
        sourceDoc: "First Capital AI portfolio",
        sourceBasis: "enterprise_ai_portfolio",
        text: "First Capital has several AI assets in financial crimes, regulatory change, and marketing operations.",
        vectorScore: 0.92,
      }),
    ]) as never;
    const fakeDb = {
      from(table: string) {
        if (table === "program_modules") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [
                        {
                          id: "pm-1",
                          module_key: "phase_1_scope_boundary",
                          module_name: "Scope boundary",
                          phase_number: 1,
                          module_order: 1,
                          status: "completed",
                          state_jsonb: {
                            capture_section_key: "scope_boundary",
                            label: "Scope boundary",
                            value:
                              "Commercial loan onboarding from banker intake through KYC review, credit package assembly, covenant setup, and servicing handoff.",
                          },
                          completed_at: "2026-07-22T12:00:00Z",
                        },
                      ],
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "evidence_ledger") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "program_evidence_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    } as never;

    const out = await assembleGovernedEvidence(
      {
        tenantClientKey: "arcturus",
        clientId: "client-1",
        sourceArtifactRef: "move-1",
        query: "charter current state",
      },
      { queryTenantContext: fakeQuery, db: fakeDb },
    );

    expect(out.retrievedCount).toBe(2);
    expect(out.evidence[0].evidenceFamily).toBe("Scope Boundary");
    expect(out.evidence[0].statement).toMatch(/Commercial loan onboarding/);
    expect(out.evidence[1].evidenceFamily).toBe("Enterprise Ai Portfolio");
  });

  it("uses current generated Move artifacts as internal evidence for later phases", async () => {
    const fakeQuery = (async () => []) as never;
    const fakeDb = {
      from(table: string) {
        if (table === "program_modules") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "evidence_ledger") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "program_evidence_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "generated_artifacts") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  is: () => ({
                    is: () => ({
                      order: () => ({
                        limit: async () => ({
                          data: [
                            {
                              id: "artifact-business-case",
                              quality_score: 0.92,
                              rendered_at: "2026-08-21T12:00:00Z",
                              metadata: {
                                title: "Business Case",
                                deliverableTypeKey: "business_case",
                                generationMetrics: {
                                  sectionCount: 7,
                                  bodyWordCount: 2200,
                                },
                                renderableDoc: {
                                  executiveSummary:
                                    "Proceed only with readiness setup; do not claim savings until internal volume evidence is approved.",
                                  generatedSections: [
                                    {
                                      title: "Value boundary",
                                      bodyMarkdown:
                                        "The $98.41/min benchmark is external and sensitivity-only. Internal volume is not approved for ROI, NPV, or payback claims.",
                                    },
                                  ],
                                  sourceRegister: [
                                    { label: "Approved P4 business case" },
                                    { label: "Approved P4 financial model" },
                                  ],
                                },
                              },
                            },
                          ],
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    } as never;

    const out = await assembleGovernedEvidence(
      {
        tenantClientKey: "skyharbor-air",
        clientId: "client-1",
        sourceArtifactRef: "move-1",
        query: "P5 value measurement contract",
      },
      { queryTenantContext: fakeQuery, db: fakeDb },
    );

    expect(out.retrievedCount).toBe(1);
    expect(out.evidence[0].evidenceFamily).toBe("Business Case");
    expect(out.evidence[0].statement).toMatch(/sensitivity-only/);
    expect(out.evidence[0].disclosureTier).toBe("internal_only");
    expect(out.sourceRegister[0].label).toBe("Business Case");
  });

  it("does not use unreviewed program evidence items as move citations", async () => {
    const fakeQuery = (async () => []) as never;
    const fakeDb = {
      from(table: string) {
        if (table === "evidence_ledger") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "program_evidence_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    limit: async () => ({ data: [] }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "program_evidence_items") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [
                        {
                          id: "evidence-1",
                          title: "SkyHarbor IROPS workshop decision ledger",
                          summary:
                            "Client approved the two-plane architecture and triage-to-recovery operating model.",
                          extracted_structured: {
                            decisions: [
                              "Approve operational command center as the first release.",
                            ],
                            risks: [
                              "Manual airport rebooking workarounds remain fragile.",
                            ],
                          },
                          evidence_type: "architecture_approval",
                          confidence: 0.82,
                          created_at: "2026-06-22T16:00:00Z",
                        },
                      ],
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      },
    } as never;

    const out = await assembleGovernedEvidence(
      {
        tenantClientKey: "skyharbor-air",
        clientId: "client-1",
        sourceArtifactRef: "move-1",
        query: "target architecture evidence",
      },
      { queryTenantContext: fakeQuery, db: fakeDb },
    );

    expect(out.retrievedCount).toBe(0);
    expect(out.sourceRegister).toHaveLength(0);
    expect(out.evidence).toHaveLength(0);
    expect(out.coverage.coverageRatio).toBeNull();
    expect(out.coverage.coverageState).toBe("no_approved_evidence");
    expect(out.coverage.requiresAttention).toBe(false);
  });
});

describe("buildDeliverableRequest", () => {
  const evidence: GovernedEvidenceItem[] = [
    {
      citationNumber: 1,
      label: "SLA",
      statement: "99.9%",
      evidenceFamily: "sla_baseline",
      confidence: "high",
      disclosureTier: "vendor_facing",
      provenanceRef: "p1",
    },
  ];
  it("produces a board-grade request with sane defaults and the supplied evidence", () => {
    const req = buildDeliverableRequest(
      {
        module: "source",
        useCaseArchetype: "AMS_IT_OUTSOURCING",
        deliverableType: "rfp_package",
        decisionContext: "approve issuance",
        clientDisplayName: "SkyHarbor Air",
        initiativeDisplayName: "AMS 2026",
      },
      evidence,
      [
        {
          citationNumber: 1,
          label: "SLA",
          evidenceFamily: "sla_baseline",
          confidence: "high",
        },
      ],
    );
    expect(req.governedEvidenceBundle).toHaveLength(1);
    expect(req.qualityBar.tone).toBe("board_grade_consulting");
    expect(req.formattingProfile.bodyPointSize).toBe(11);
    expect(req.audience.length).toBeGreaterThan(0); // module default applied
    expect(req.outputFormats).toContain("docx");
  });

  it("requires a source register when governed evidence is present", () => {
    const req = buildDeliverableRequest(
      {
        module: "moves",
        useCaseArchetype: "CONTRACT_OBLIGATION_CONTROL",
        deliverableType: "discovery_report",
        decisionContext: "approve discovery gate",
        clientDisplayName: "Lakeshore Holdings",
        initiativeDisplayName: "Contract Control",
      },
      evidence,
      [
        {
          citationNumber: 1,
          label: "SLA",
          evidenceFamily: "sla_baseline",
          confidence: "high",
        },
      ],
    );
    expect(req.qualityBar.requiresSourceRegister).toBe(true);
  });

  it("does NOT require a source register when there is no governed evidence to register", () => {
    // A source register is a register OF governed evidence; with an empty bundle
    // there is nothing to cite, so the quality gate must not block on its absence
    // (e.g. a P1 charter grounded only in human-entered capture).
    const req = buildDeliverableRequest(
      {
        module: "moves",
        useCaseArchetype: "CONTRACT_OBLIGATION_CONTROL",
        deliverableType: "charter",
        decisionContext: "approve charter gate",
        clientDisplayName: "Lakeshore Holdings",
        initiativeDisplayName: "Contract Control",
      },
      [],
      [],
    );
    expect(req.qualityBar.requiresSourceRegister).toBe(false);
    // The rest of the board-grade bar is unchanged.
    expect(req.qualityBar.requiresRecommendation).toBe(true);
    expect(req.qualityBar.requiresDecisionSection).toBe(true);
  });
});

describe("buildSectionDrivenEvidenceQueries", () => {
  it("builds distinct searches from artifact sections, expected exhibits, and tables", () => {
    const req = buildDeliverableRequest(
      {
        module: "moves",
        useCaseArchetype: "AI_PDLC",
        deliverableType: "target_state_architecture",
        decisionContext: "approve target state",
        clientDisplayName: "Client",
        initiativeDisplayName: "AI platform",
      },
      [],
      [],
    );
    const queries = buildSectionDrivenEvidenceQueries(
      {
        deliverableType: req.deliverableType,
        useCaseArchetype: req.useCaseArchetype,
      },
      getArtifactBrief(req),
    );

    expect(queries.length).toBeGreaterThan(1);
    expect(new Set(queries).size).toBe(queries.length);
    expect(queries.join("\n")).toMatch(/architecture|target state/i);
  });

  it("honors an explicit evidenceQuery override", () => {
    const req = buildDeliverableRequest(
      {
        module: "source",
        useCaseArchetype: "AMS_IT_OUTSOURCING",
        deliverableType: "rfp_package",
        decisionContext: "approve issuance",
        clientDisplayName: "Client",
        initiativeDisplayName: "AMS",
      },
      [],
      [],
    );

    expect(
      buildSectionDrivenEvidenceQueries(
        {
          deliverableType: req.deliverableType,
          useCaseArchetype: req.useCaseArchetype,
          evidenceQuery: "bespoke retrieval string",
        },
        getArtifactBrief(req),
      ),
    ).toEqual(["bespoke retrieval string"]);
  });
});

describe("runDeliverableForTenant", () => {
  const baseInput = {
    module: "source" as const,
    useCaseArchetype: "AMS_IT_OUTSOURCING",
    deliverableType: "rfp_package",
    decisionContext: "approve issuance",
    clientDisplayName: "SkyHarbor Air",
    initiativeDisplayName: "AMS 2026",
    tenantClientKey: "skyharbor-air",
    clientId: "client-uuid",
    userId: "u1",
    sourceArtifactRef: "evt-1",
  };
  const assemble = (async () => ({
    evidence: [
      {
        citationNumber: 1,
        label: "SLA",
        statement: "99.9%",
        evidenceFamily: "sla_baseline",
        confidence: "high",
        disclosureTier: "vendor_facing",
        provenanceRef: "p1",
      },
    ],
    sourceRegister: [
      {
        citationNumber: 1,
        label: "SLA",
        evidenceFamily: "sla_baseline",
        confidence: "high",
      },
    ],
    retrievedCount: 1,
    coverage: {
      approvedAvailable: 1,
      retrieved: 1,
      packed: 1,
      droppedForBudget: 0,
      unreadable: 0,
      cited: 0,
      coverageRatio: 1,
      coverageState: "packed",
      requiresAttention: false,
      usedTokens: 12,
      evidenceTokenBudget: 1000,
    },
  })) as never;
  const loadPolicy = (async () => ({
    tenantId: "skyharbor-air",
    policy: {},
  })) as never;

  it("persists and returns the artifact when generation passes the gates", async () => {
    const generate = (async () =>
      ({
        ok: true,
        brief: {} as never,
        document: { generatedSections: [{}, {}] } as never,
        quality: { pass: true, warnings: ["minor"] } as never,
        passTrace: [],
      }) as OrchestrationResult) as never;
    const persist = (async () => ({
      id: "art-9",
      blobUrl: "/api/v1/artifacts/art-9",
    })) as never;
    const out = await runDeliverableForTenant(baseInput, {
      assemble,
      loadPolicy,
      generate,
      persist,
    });
    expect(out.ok).toBe(true);
    expect(out.artifactId).toBe("art-9");
    expect(out.sectionCount).toBe(2);
    expect(out.retrievedEvidence).toBe(1);
    expect(out.contextCoverage?.packed).toBe(1);
    expect(out.contextCoverage?.cited).toBe(0);
  });

  it("returns blocked when persistence quarantines the generated artifact", async () => {
    const generate = (async () =>
      ({
        ok: true,
        brief: {} as never,
        document: { generatedSections: [{}, {}, {}] } as never,
        quality: { pass: true, warnings: [] } as never,
        passTrace: [],
      }) as OrchestrationResult) as never;
    const persist = (async () => ({
      id: "art-quarantine",
      blobUrl: "/api/v1/artifacts/art-quarantine",
      quarantineReason:
        "blocked_storyline: architecture_completeness, missing_input_handling",
    })) as never;
    const out = await runDeliverableForTenant(baseInput, {
      assemble,
      loadPolicy,
      generate,
      persist,
    });
    expect(out.ok).toBe(false);
    expect(out.artifactId).toBe("art-quarantine");
    expect(out.qualityPass).toBe(false);
    expect(out.blockedReason).toMatch(/quality gate blocked export/);
    expect(out.blockers).toContain(
      "blocked_storyline: architecture_completeness, missing_input_handling",
    );
  });

  it("returns blockers (and does NOT persist) when the quality gate refuses", async () => {
    let persisted = false;
    const generate = (async () =>
      ({
        ok: false,
        brief: {} as never,
        quality: { pass: false, blockers: ["no source register"] } as never,
        passTrace: [],
        blockedReason: "quality gate blocked export",
      }) as OrchestrationResult) as never;
    const persist = (async () => {
      persisted = true;
      return { id: "x" };
    }) as never;
    const out = await runDeliverableForTenant(baseInput, {
      assemble,
      loadPolicy,
      generate,
      persist,
    });
    expect(out.ok).toBe(false);
    expect(out.blockers).toContain("no source register");
    expect(persisted).toBe(false);
  });

  it("always generates the structured model required by the Target Architecture contract", async () => {
    delete process.env.ABARVA_FEATURE_DELIVERABLE_STRUCTURED_EXHIBITS_TENANTS;
    let persistOpts: Record<string, unknown> | undefined;
    const generate = (async () =>
      ({
        ok: true,
        brief: {
          deliverableType: "target_architecture",
          module: "moves",
        } as never,
        document: {
          generatedSections: [
            { title: "Current state", bodyMarkdown: "mainframe-bound today" },
          ],
          clientDisplayName: "SkyHarbor Air",
          initiativeDisplayName: "IROPS Agentic Response",
        } as never,
        quality: { pass: true, warnings: [] } as never,
        passTrace: [],
      }) as OrchestrationResult) as never;
    const persist = (async (_r: unknown, opts: unknown) => {
      persistOpts = opts as Record<string, unknown>;
      return { id: "art-arch" };
    }) as never;
    const plan: DeliverablePlan = {
      artifactType: "target_state_architecture",
      audience: "cio",
      decisionPurpose: "Align on target architecture.",
      storyline:
        "Current fragmentation must become a governed decision system.",
      currentStateInterpretation:
        "Today is fragmented and manually coordinated.",
      majorGaps: [
        {
          id: "g1",
          observation: "Current state is fragmented.",
          gap: "Shared decision context is missing.",
          designImplication: "Create a governed context and decision layer.",
        },
      ],
      targetStateHypothesis:
        "A governed AI-assisted decision system changes the workflow.",
      requiredDecisions: ["Approve the target architecture."],
      requiredExhibits: [
        {
          exhibit: "current_state_architecture",
          purpose: "Show current fragmentation.",
          soWhat: "The target must solve the workflow, not only add AI.",
        },
      ],
      narrativeSequence: [
        { id: "b1", point: "Current state fragments decisions." },
        { id: "b2", point: "The gap is missing shared context." },
        { id: "b3", point: "The target state creates governed decisions." },
      ],
      evidenceNeeded: [],
      missingInputs: [],
      assumptions: [],
      risks: [],
      readerTakeaway: "The reader understands the current-to-target chain.",
    };
    const calls: string[] = [];
    const generatePlan = (async () => {
      calls.push("plan");
      return { plan };
    }) as never;
    let calledWith: { engagement?: string; contextText?: string } = {};
    const generateArchitecture = (async (req: {
      engagement: string;
      contextText: string;
    }) => {
      calls.push("architecture");
      calledWith = req;
      return { model: FIRST_CAPITAL_ARCHITECTURE };
    }) as never;

    const out = await runDeliverableForTenant(
      {
        ...baseInput,
        module: "moves" as const,
        deliverableType: "target_architecture",
        tenantClientKey: "arcturus",
        approvedSolutionApproach:
          "APPROVED SOLUTION APPROACH - AUTHORITATIVE INPUT\nChosen option: Option B - governed commercial lending agent assist",
      },
      {
        assemble,
        loadPolicy,
        generate,
        persist,
        generatePlan,
        generateArchitecture,
      },
    );

    expect(out.ok).toBe(true);
    expect(calls).toEqual(["plan", "architecture"]);
    expect(calledWith.engagement).toBe("AMS 2026");
    expect(calledWith.contextText).toContain("Structured Architecture Brief");
    expect(calledWith.contextText).toContain(
      "Chosen option: Option B - governed commercial lending agent assist",
    );
    expect(persistOpts?.renderViaProfile).toBe(true);
    expect(
      (persistOpts?.structuredModels as { architectureModel?: unknown })
        ?.architectureModel,
    ).toBeDefined();
    expect(
      (
        persistOpts?.structuredModels as {
          structuredArchitectureBrief?: unknown;
        }
      )?.structuredArchitectureBrief,
    ).toEqual(plan);
  });

  it("blocks Target Architecture when the structured model is incomplete", async () => {
    process.env.ABARVA_FEATURE_DELIVERABLE_STRUCTURED_EXHIBITS_TENANTS =
      "skyharbor-air";
    let fallbackModel:
      | {
          current?: unknown;
          target?: unknown;
          architectureLevels?: unknown;
          openInputs?: string[];
        }
      | undefined;
    const generate = (async () =>
      ({
        ok: true,
        brief: {
          deliverableType: "target_architecture",
          module: "moves",
        } as never,
        document: {
          generatedSections: [
            {
              title: "Current state",
              bodyMarkdown:
                "SkyHarbor Air recovery decisions are fragmented across operations teams.",
            },
          ],
          clientDisplayName: "SkyHarbor Air",
          initiativeDisplayName: "IROPS Agentic Response",
        } as never,
        quality: { pass: true, warnings: [] } as never,
        passTrace: [],
      }) as OrchestrationResult) as never;
    const persist = (async (_r: unknown, opts: unknown) => {
      fallbackModel = (
        opts as {
          structuredModels?: { architectureModel?: typeof fallbackModel };
        }
      ).structuredModels?.architectureModel;
      return { id: "art-fallback" };
    }) as never;
    const plan: DeliverablePlan = {
      artifactType: "target_state_architecture",
      audience: "cio",
      decisionPurpose: "Approve the target recovery command architecture.",
      storyline:
        "Current fragmentation must become a governed decision system.",
      currentStateInterpretation:
        "Recovery decisions are manually coordinated today.",
      majorGaps: [
        {
          id: "g1",
          observation: "Decisions are fragmented.",
          gap: "Shared context is missing.",
          designImplication: "Create a governed context layer.",
        },
      ],
      targetStateHypothesis:
        "A governed AI-assisted decision loop improves recovery command.",
      requiredDecisions: ["Approve the target architecture."],
      requiredExhibits: [],
      narrativeSequence: [
        { id: "b1", point: "Current state fragments decisions." },
        { id: "b2", point: "A governed context gap remains." },
        { id: "b3", point: "Target state creates governed approvals." },
      ],
      evidenceNeeded: [],
      missingInputs: ["Confirm integration protocols."],
      assumptions: [],
      risks: [],
      readerTakeaway: "The reader can explain the target architecture.",
    };
    const generateArchitecture = (async () => {
      throw new Error("Missing current architecture state.");
    }) as never;

    const out = await runDeliverableForTenant(
      {
        ...baseInput,
        module: "moves" as const,
        deliverableType: "target_architecture",
      },
      {
        assemble,
        loadPolicy,
        generate,
        persist,
        generatePlan: (async () => ({ plan })) as never,
        generateArchitecture,
      },
    );

    expect(out.ok).toBe(false);
    expect(out.blockedReason).toMatch(/architecture_assembly_failed/);
    expect(fallbackModel).toBeUndefined();
    delete process.env.ABARVA_FEATURE_DELIVERABLE_STRUCTURED_EXHIBITS_TENANTS;
  });
});
