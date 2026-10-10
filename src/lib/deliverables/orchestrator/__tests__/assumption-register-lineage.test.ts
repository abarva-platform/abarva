// Assumptions register — figure lineage in the generation pipeline.
//
// Product rule: aVa may use a working figure only as a labelled register
// assumption cited `[A:ID]`. Under the register a figure in a generated
// document must trace to evidence `[n]` or to a register row whose figure
// matches; a bare `[ASSUMPTION TO VALIDATE]` no longer launders a number.
//
// Every enforced case is paired with the flag-off behaviour: with
// `assumptionRegisterEnforced` absent the gate, the repairs and the prompt are
// exactly what they were before the register existed.

import { validateDeliverableQuality } from "../quality-validator";
import {
  extractUnsupportedFigureClaims,
  repairEvidenceBackedUncitedFigures,
  repairUncitedFigures,
  REGISTER_UNTRACED_FIGURE_TAG,
  assembleDeliverable,
} from "../section-generation";
import {
  LEGACY_FIGURE_LINEAGE,
  REGISTER_CITATION_RE,
  figureLineagePolicy,
  judgeFigureSentence,
  registerCitationIds,
  supportedMarkerRe,
} from "../numeric-lineage-tokens";
import {
  REGISTER_FIGURE_RULE,
  artifactHonestyDiscipline,
  buildPassPrompt,
  buildSystemPrompt,
} from "../prompt-builder";
import { getArtifactBrief } from "../artifact-brief-registry";
import { buildDeliverableRequest } from "../build-request";
import { runDeliverableForTenant } from "../generate-service";
import { REGISTER_UNAVAILABLE_DETAIL } from "@/lib/programs/assumption-register/model";
import { amsRfpRequest, goodDocument, goodPlan } from "../__fixtures__/ams-rfp";
import { runDeliverableOrchestration, type ModelCaller } from "../orchestrator";
import type {
  ApprovedAssumption,
  DeliverableIntelligenceRequest,
  RenderableDeliverable,
} from "../types";

const LEGACY_TAG =
  "[ASSUMPTION TO VALIDATE: numeric/date/value claim requires client confirmation or cited source before it is treated as committed.]";

function registerRow(
  overrides: Partial<ApprovedAssumption> = {},
): ApprovedAssumption {
  return {
    key: "V3",
    statement: "Handle time falls after the change",
    basis: "Contact-centre ops review",
    mustValidate: true,
    registerId: "V3",
    figure: "$2.4M",
    ownerRole: "CFO office",
    confidence: 3,
    status: "open",
    ...overrides,
  };
}

function enforcedRequest(
  rows: ApprovedAssumption[] = [registerRow()],
  overrides: Partial<DeliverableIntelligenceRequest> = {},
): DeliverableIntelligenceRequest {
  return amsRfpRequest({
    approvedAssumptions: rows,
    assumptionRegisterEnforced: true,
    ...overrides,
  });
}

/** A known-good document with one extra section holding the sentence under test. */
function docWith(bodyMarkdown: string): RenderableDeliverable {
  const doc = goodDocument();
  return {
    ...doc,
    generatedSections: [
      ...doc.generatedSections.map((s) => ({
        ...s,
        rawBodyMarkdown: s.bodyMarkdown,
      })),
      {
        key: "investment_case",
        title: "Investment case",
        bodyMarkdown: bodyMarkdown,
        rawBodyMarkdown: bodyMarkdown,
        groundingMode: "mixed",
        citationsUsed: [1],
      },
    ],
  };
}

function blockers(
  bodyMarkdown: string,
  req: DeliverableIntelligenceRequest,
): string[] {
  return validateDeliverableQuality(docWith(bodyMarkdown), req).blockers;
}

function unsupportedBlocker(
  bodyMarkdown: string,
  req: DeliverableIntelligenceRequest,
): string | undefined {
  return blockers(bodyMarkdown, req).find((b) => /unsupported/i.test(b));
}

function unknownIdBlocker(
  bodyMarkdown: string,
  req: DeliverableIntelligenceRequest,
): string | undefined {
  return blockers(bodyMarkdown, req).find((b) =>
    b.startsWith("cites assumptions-register row(s)"),
  );
}

const TAGGED_MATCHING = "Savings reach $2.4M in year one [A:V3].";
const UNTAGGED = "Savings reach $2.4M in year one.";
const BARE_ASSUMPTION =
  "Savings reach $2.4M in year one [ASSUMPTION TO VALIDATE: savings estimate].";
const UNKNOWN_ID = "Savings reach $2.4M in year one [A:V9].";
const MISMATCHED = "Savings reach $3.1M in year one [A:V3].";

describe("the baseline document passes the gate in both modes", () => {
  it("has no blocker the register could have introduced", () => {
    const off = validateDeliverableQuality(goodDocument(), amsRfpRequest());
    const on = validateDeliverableQuality(goodDocument(), enforcedRequest());
    expect(on.blockers).toEqual(off.blockers);
  });
});

describe("validator — register enforced", () => {
  it("passes a figure tagged with a register row whose figure matches", () => {
    expect(
      unsupportedBlocker(TAGGED_MATCHING, enforcedRequest()),
    ).toBeUndefined();
    expect(
      unknownIdBlocker(TAGGED_MATCHING, enforcedRequest()),
    ).toBeUndefined();
  });

  it("matches the figure through the shared normalisation (case, $, separators)", () => {
    const req = enforcedRequest([registerRow({ figure: "$2,400K" })]);
    expect(
      unsupportedBlocker("Savings reach $ 2400k in year one [A:V3].", req),
    ).toBeUndefined();
    expect(
      unsupportedBlocker("Savings reach $ 2500k in year one [A:V3].", req),
    ).toBeDefined();
  });

  it("blocks an untagged figure", () => {
    expect(unsupportedBlocker(UNTAGGED, enforcedRequest())).toContain(
      "Savings reach $2.4M in year one.",
    );
  });

  it("blocks a figure carrying only a bare [ASSUMPTION TO VALIDATE] tag", () => {
    expect(unsupportedBlocker(BARE_ASSUMPTION, enforcedRequest())).toContain(
      "Savings reach $2.4M",
    );
  });

  it("blocks a citation of an ID the register does not hold, naming it", () => {
    expect(unknownIdBlocker(UNKNOWN_ID, enforcedRequest())).toBe(
      "cites assumptions-register row(s) that are not in this Move's citable register: [A:V9]",
    );
    // and the unknown citation supports nothing, so the figure is unsupported too
    expect(unsupportedBlocker(UNKNOWN_ID, enforcedRequest())).toBeDefined();
  });

  it("does not let an unknown ID support even an evidence-backed figure", () => {
    // $280M is in the governed evidence; the citation names no register row.
    expect(
      unsupportedBlocker(
        "Incumbent spend runs at $280M [A:V9].",
        enforcedRequest(),
      ),
    ).toBeDefined();
  });

  it("still needs a citation for a figure the evidence backs", () => {
    expect(
      unsupportedBlocker("Tickets run at 15,600 a month.", enforcedRequest()),
    ).toBeDefined();
  });

  it("blocks an unknown ID even on a sentence with no figure", () => {
    expect(
      unknownIdBlocker(
        "The adoption curve is the open question [A:A7].",
        enforcedRequest(),
      ),
    ).toContain("[A:A7]");
  });

  it("blocks a figure that is not the cited row's figure, naming row and figure", () => {
    const blocker = unsupportedBlocker(MISMATCHED, enforcedRequest());
    expect(blocker).toContain(
      "[figures matching neither evidence nor the cited register row(s) [A:V3]: $3.1M]",
    );
    expect(blocker).toContain("matching register citation [A:ID]");
  });

  it("lets a register-cited sentence also carry a figure the evidence backs", () => {
    // $280M is in the governed evidence [5]; $2.4M is V3's figure.
    expect(
      unsupportedBlocker(
        "Against a $280M incumbent, savings reach $2.4M [A:V3].",
        enforcedRequest(),
      ),
    ).toBeUndefined();
  });

  it("still accepts an evidence citation [n] exactly as before", () => {
    expect(
      unsupportedBlocker(
        "Tier-1 critical applications number 41 of 320 [2].",
        enforcedRequest(),
      ),
    ).toBeUndefined();
  });

  it("treats an empty register as no working figures, not as no rule", () => {
    expect(
      unsupportedBlocker(TAGGED_MATCHING, enforcedRequest([])),
    ).toBeDefined();
    expect(unknownIdBlocker(TAGGED_MATCHING, enforcedRequest([]))).toContain(
      "[A:V3]",
    );
  });

  it("ignores assumptions that are not register rows when resolving citations", () => {
    const req = enforcedRequest([
      registerRow({ registerId: undefined, key: "V3" }),
    ]);
    expect(unknownIdBlocker(TAGGED_MATCHING, req)).toContain("[A:V3]");
  });
});

describe("validator — flag off is unchanged", () => {
  it("still accepts a bare [ASSUMPTION TO VALIDATE] figure", () => {
    expect(
      unsupportedBlocker(BARE_ASSUMPTION, amsRfpRequest()),
    ).toBeUndefined();
  });

  it("raises no register blocker for any [A:ID] token", () => {
    expect(unknownIdBlocker(UNKNOWN_ID, amsRfpRequest())).toBeUndefined();
  });

  it("keeps the legacy blocker wording", () => {
    expect(unsupportedBlocker(UNTAGGED, amsRfpRequest())).toBe(
      '1 unsupported client-fact claim(s) (number/date/$/% with no [n], assumption, or placeholder): "Savings reach $2.4M in year one. [figures with no match in evidence: $2.4M]"',
    );
  });

  it("does not let a register citation support a figure", () => {
    expect(unsupportedBlocker(TAGGED_MATCHING, amsRfpRequest())).toBeDefined();
  });
});

describe("lineage tokens", () => {
  it("reads register citations once each, in order", () => {
    expect(
      registerCitationIds("a [A:V3] b [A:DL12] c [A:V3] [A:X1] [A:V0]"),
    ).toEqual(["V3", "DL12"]);
    expect("[A:DL2]".replace(REGISTER_CITATION_RE, "$1|$2")).toBe("DL|2");
  });

  it("builds the legacy marker regex unchanged and drops only the assumption tag when enforced", () => {
    expect(supportedMarkerRe(LEGACY_FIGURE_LINEAGE).source).toBe(
      /\[\d+\]|\[ASSUMPTION TO VALIDATE|\[CLIENT TO COMPLETE|\[EVIDENCE MISSING|\(open input\s*[–—-]\s*see Open Inputs Required\)/i
        .source,
    );
    const enforced = supportedMarkerRe(figureLineagePolicy(enforcedRequest()));
    expect(enforced.test("[ASSUMPTION TO VALIDATE: x]")).toBe(false);
    for (const marker of [
      "[4]",
      "[CLIENT TO COMPLETE: x]",
      "[EVIDENCE MISSING: x]",
      "(open input — see Open Inputs Required)",
    ]) {
      expect(enforced.test(marker)).toBe(true);
    }
  });

  it("derives no policy for a request that does not declare enforcement", () => {
    expect(figureLineagePolicy(amsRfpRequest())).toBe(LEGACY_FIGURE_LINEAGE);
    expect(
      figureLineagePolicy(amsRfpRequest({ assumptionRegisterEnforced: false })),
    ).toBe(LEGACY_FIGURE_LINEAGE);
  });

  it("judges a row with no figure as supporting no number", () => {
    const policy = figureLineagePolicy(
      enforcedRequest([registerRow({ figure: null })]),
    );
    expect(judgeFigureSentence(TAGGED_MATCHING, policy)).toEqual({
      supported: false,
      unknownRegisterIds: [],
      citedRegisterIds: ["V3"],
      unmatchedFigures: ["$2.4M"],
    });
  });
});

describe("section repairs", () => {
  const policy = figureLineagePolicy(enforcedRequest());

  it("tags an untraced figure [EVIDENCE MISSING …] under the register", () => {
    expect(repairUncitedFigures(UNTAGGED, policy)).toBe(
      `Savings reach $2.4M in year one ${REGISTER_UNTRACED_FIGURE_TAG}.`,
    );
    expect(REGISTER_UNTRACED_FIGURE_TAG.startsWith("[EVIDENCE MISSING:")).toBe(
      true,
    );
  });

  it("re-tags a bare-assumption figure and leaves a matching register figure alone", () => {
    expect(repairUncitedFigures(BARE_ASSUMPTION, policy)).toContain(
      REGISTER_UNTRACED_FIGURE_TAG,
    );
    expect(repairUncitedFigures(TAGGED_MATCHING, policy)).toBe(TAGGED_MATCHING);
  });

  it("is idempotent: a tagged sentence is not tagged twice", () => {
    const once = repairUncitedFigures(UNTAGGED, policy);
    expect(repairUncitedFigures(once, policy)).toBe(once);
  });

  it("keeps the legacy tag when the flag is off", () => {
    expect(repairUncitedFigures(UNTAGGED)).toBe(
      `Savings reach $2.4M in year one ${LEGACY_TAG}.`,
    );
    expect(repairUncitedFigures(BARE_ASSUMPTION)).toBe(BARE_ASSUMPTION);
  });

  it("extracts the claims the gate would block, per mode", () => {
    expect(extractUnsupportedFigureClaims(BARE_ASSUMPTION, policy)).toEqual([
      BARE_ASSUMPTION,
    ]);
    expect(extractUnsupportedFigureClaims(BARE_ASSUMPTION)).toEqual([]);
    expect(extractUnsupportedFigureClaims(TAGGED_MATCHING, policy)).toEqual([]);
  });

  it("cites evidence for a bare-assumption figure the evidence backs", () => {
    const sentence =
      "Tickets run at 15,600 a month [ASSUMPTION TO VALIDATE: volume].";
    const evidence = amsRfpRequest().governedEvidenceBundle;
    expect(
      repairEvidenceBackedUncitedFigures(sentence, evidence, policy),
    ).toContain("[4]");
    expect(repairEvidenceBackedUncitedFigures(sentence, evidence)).toBe(
      sentence,
    );
  });
});

describe("prompt", () => {
  function contextPrompt(req: DeliverableIntelligenceRequest): string {
    return buildPassPrompt("full_draft", {
      req,
      brief: getArtifactBrief(req),
      evidence: req.governedEvidenceBundle,
      approvedPlanJson: "{}",
    }).user;
  }

  it("renders each register row with ID, figure, confidence, owner role and status", () => {
    const prompt = contextPrompt(
      enforcedRequest([
        registerRow(),
        registerRow({
          key: "D2",
          registerId: "D2",
          statement: "Ticket data covers twelve months",
          figure: "12 months",
          confidence: 5,
          ownerRole: "Service desk lead",
          status: "confirmed",
          mustValidate: false,
        }),
        registerRow({
          key: "DL1",
          registerId: "DL1",
          statement:
            "Cutover completes by quarter end — corrected: two quarters",
          figure: "2 quarters",
          confidence: 1,
          ownerRole: "PMO",
          status: "corrected",
          mustValidate: false,
        }),
      ]),
    );
    expect(prompt).toContain(
      "ASSUMPTIONS REGISTER (cite a row as [A:ID]; its figure is a labelled working assumption, never a fact):",
    );
    expect(prompt).toContain(
      "- [A:V3] Handle time falls after the change — working figure $2.4M (confidence 3; owner: CFO office; open → VALIDATE)",
    );
    expect(prompt).toContain(
      "- [A:D2] Ticket data covers twelve months — working figure 12 months (confidence 5; owner: Service desk lead; confirmed)",
    );
    expect(prompt).toContain(
      "- [A:DL1] Cutover completes by quarter end — corrected: two quarters — working figure 2 quarters (confidence 1; owner: PMO; corrected)",
    );
    expect(prompt).toContain(REGISTER_FIGURE_RULE);
    expect(prompt).not.toContain("APPROVED ASSUMPTIONS (use, labelled):");
  });

  it("lists only register rows under the register", () => {
    const prompt = contextPrompt(
      enforcedRequest([
        registerRow(),
        registerRow({
          registerId: undefined,
          key: "legacy",
          statement: "Legacy row",
        }),
      ]),
    );
    expect(prompt).not.toContain("Legacy row");
    expect(prompt).not.toContain("[A:undefined]");
  });

  it("says plainly when the register has no citable rows", () => {
    expect(contextPrompt(enforcedRequest([]))).toContain(
      "(no register rows — a figure not in the governed evidence may not appear)",
    );
  });

  it("keeps the legacy assumptions block when the flag is off", () => {
    const prompt = contextPrompt(amsRfpRequest());
    expect(prompt).toContain("APPROVED ASSUMPTIONS (use, labelled):");
    expect(prompt).toContain(
      "- Resource-unit pricing with a productivity glidepath. (basis: Standard for enterprise AMS at this scale.; VALIDATE)",
    );
    expect(prompt).not.toContain("REGISTER RULE");
    expect(prompt).not.toContain("[A:");
  });

  it("never tells the model to put [ASSUMPTION TO VALIDATE: …] on a figure under the register", () => {
    const types = [
      ["source", "rfp_package"],
      ["moves", "business_case"],
      ["moves", "estimate_model"],
      ["moves", "roadmap"],
      ["moves", "value_measurement_contract"],
      ["moves", "sourcing_strategy"],
      ["moves", "discovery_report"],
      ["moves", "charter"],
    ] as const;
    for (const [module, deliverableType] of types) {
      const req = enforcedRequest([registerRow()], { module, deliverableType });
      const discipline = artifactHonestyDiscipline(req);
      expect(discipline).toContain(REGISTER_FIGURE_RULE);
      expect(discipline).not.toMatch(/\[ASSUMPTION TO VALIDATE:/);
      expect(discipline).not.toMatch(/labell?ed as (an )?assumptions?/);
      const legacy = artifactHonestyDiscipline({
        ...req,
        assumptionRegisterEnforced: undefined,
      });
      expect(legacy).not.toContain("REGISTER RULE");
      expect(legacy).not.toContain("[A:ID]");
    }
    const system = buildSystemPrompt(enforcedRequest());
    expect(system).toContain(
      "it may appear only as an assumptions-register working figure cited [A:ID]; never put [ASSUMPTION TO VALIDATE] on a figure",
    );
    expect(buildSystemPrompt(amsRfpRequest())).toContain(
      "If not grounded, label it [ASSUMPTION TO VALIDATE: ...] or route it to Open Inputs Required.",
    );
  });

  it("swaps the section-draft and discovery figure instructions only under the register", () => {
    const req = enforcedRequest([registerRow()], {
      module: "moves",
      deliverableType: "discovery_report",
    });
    const brief = getArtifactBrief(req);
    const section = brief.recommendedStructure[0];
    const draft = (r: DeliverableIntelligenceRequest) =>
      buildPassPrompt("section_draft", {
        req: r,
        brief,
        evidence: r.governedEvidenceBundle,
        section: {
          key: section.key,
          title: section.title,
          rationale: section.intent,
          groundingMode: section.groundingMode,
          evidenceCitations: [],
        } as never,
        outlineSummary: "",
        plannedSectionKeys: [section.key],
      }).user;
    const on = draft(req);
    expect(on).toContain(
      "use an assumptions-register working figure cited [A:ID] (never [ASSUMPTION TO VALIDATE] on a figure)",
    );
    expect(on).not.toContain("write [ASSUMPTION TO VALIDATE: <what>]");
    const off = draft({ ...req, assumptionRegisterEnforced: undefined });
    expect(off).toContain("write [ASSUMPTION TO VALIDATE: <what>]");
    const system = buildSystemPrompt(req) + contextPrompt(req);
    const discovery = (text: string) =>
      text.slice(text.indexOf("DISCOVERY METRIC DISCIPLINE"));
    expect(discovery(system)).toContain(
      "assumptions-register citation [A:ID] whose working figure it states",
    );
    expect(
      discovery(
        buildSystemPrompt({ ...req, assumptionRegisterEnforced: undefined }) +
          contextPrompt({ ...req, assumptionRegisterEnforced: undefined }),
      ),
    ).toContain("[ASSUMPTION TO VALIDATE: ...], [EVIDENCE MISSING: ...]");
  });
});

describe("generic build path", () => {
  const baseParams = {
    module: "moves" as const,
    useCaseArchetype: "STRATEGIC_MOVE",
    deliverableType: "business_case",
    decisionContext: "Fund or hold.",
    clientDisplayName: "Client",
    initiativeDisplayName: "Move",
  };

  it("fills approvedAssumptions and enforces when register rows are given", () => {
    const rows = [registerRow()];
    const req = buildDeliverableRequest(
      { ...baseParams, approvedAssumptions: rows },
      [],
      [],
    );
    expect(req.approvedAssumptions).toEqual(rows);
    expect(req.assumptionRegisterEnforced).toBe(true);
    const empty = buildDeliverableRequest(
      { ...baseParams, approvedAssumptions: [] },
      [],
      [],
    );
    expect(empty.approvedAssumptions).toEqual([]);
    expect(empty.assumptionRegisterEnforced).toBe(true);
  });

  it("stays [] with no enforcement key when no register is given", () => {
    const req = buildDeliverableRequest(baseParams, [], []);
    expect(req.approvedAssumptions).toEqual([]);
    expect("assumptionRegisterEnforced" in req).toBe(false);
  });

  describe("runDeliverableForTenant", () => {
    const serviceInput = {
      ...baseParams,
      tenantClientKey: "meridian",
      clientId: "client-uuid-1",
      userId: "u-1",
      sourceArtifactRef: "move-1",
    };
    const assemble = (async () => ({
      evidence: [],
      sourceRegister: [],
      retrievedCount: 0,
      coverage: {
        approvedAvailable: 0,
        retrieved: 0,
        packed: 0,
        droppedForBudget: 0,
        unreadable: 0,
        cited: 0,
        coverageRatio: 0,
        coverageState: "empty",
        requiresAttention: false,
        usedTokens: 0,
        evidenceTokenBudget: 1000,
      },
    })) as never;
    const loadPolicy = (async () => ({ tenantId: "t", policy: {} })) as never;
    const persist = (async () => ({ id: "art-1", blobUrl: "/a" })) as never;

    function capture() {
      const seen: DeliverableIntelligenceRequest[] = [];
      const generate = (async (req: DeliverableIntelligenceRequest) => {
        seen.push(req);
        return {
          ok: true,
          brief: {},
          document: { generatedSections: [] },
          quality: { pass: true, warnings: [] },
          passTrace: [],
        };
      }) as never;
      return { seen, generate };
    }

    it("loads the register for a Move and feeds it into the request", async () => {
      const { seen, generate } = capture();
      const loadAssumptionRegister = jest.fn(async () => [registerRow()]);
      await runDeliverableForTenant(serviceInput, {
        assemble,
        loadPolicy,
        generate,
        persist,
        loadAssumptionRegister,
      });
      expect(loadAssumptionRegister).toHaveBeenCalledWith({
        tenantClientKey: "meridian",
        clientId: "client-uuid-1",
        userId: "u-1",
        programId: "move-1",
      });
      expect(seen[0].approvedAssumptions).toEqual([registerRow()]);
      expect(seen[0].assumptionRegisterEnforced).toBe(true);
    });

    it("builds the request exactly as before when the register does not govern (null)", async () => {
      const { seen, generate } = capture();
      await runDeliverableForTenant(serviceInput, {
        assemble,
        loadPolicy,
        generate,
        persist,
        loadAssumptionRegister: async () => null,
      });
      expect(seen[0].approvedAssumptions).toEqual([]);
      expect("assumptionRegisterEnforced" in seen[0]).toBe(false);
    });

    it("never reads the register for a non-Moves deliverable", async () => {
      const { generate } = capture();
      const loadAssumptionRegister = jest.fn(async () => [registerRow()]);
      await runDeliverableForTenant(
        { ...serviceInput, module: "source" as const },
        { assemble, loadPolicy, generate, persist, loadAssumptionRegister },
      );
      expect(loadAssumptionRegister).not.toHaveBeenCalled();
    });

    it("blocks the run, before generating, when the register cannot be read", async () => {
      const { seen, generate } = capture();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const out = await runDeliverableForTenant(serviceInput, {
        assemble,
        loadPolicy,
        generate,
        persist,
        loadAssumptionRegister: async () => {
          throw new Error("connection reset");
        },
      });
      errorSpy.mockRestore();
      expect(seen).toHaveLength(0);
      expect(out.ok).toBe(false);
      expect(out.blockers).toEqual([REGISTER_UNAVAILABLE_DETAIL]);
      expect(out.blockedReason).toBe(
        `assumption_register_unavailable: ${REGISTER_UNAVAILABLE_DETAIL}`,
      );
      expect(JSON.stringify(out)).not.toContain("connection reset");
    });

    it("uses the flag-gated default loader: off for a tenant outside the flag", async () => {
      const { seen, generate } = capture();
      await runDeliverableForTenant(
        { ...serviceInput, tenantClientKey: "apexretail" },
        { assemble, loadPolicy, generate, persist },
      );
      expect(seen[0].approvedAssumptions).toEqual([]);
      expect("assumptionRegisterEnforced" in seen[0]).toBe(false);
    });
  });
});

describe("orchestration threads the register through every repair", () => {
  const FIGURE_SENTENCE =
    "Savings reach $2.4M in year one [ASSUMPTION TO VALIDATE: savings]. Run cost is $7.5M today.";
  const stub: ModelCaller = async (prompt) => {
    switch (prompt.pass) {
      case "architect":
        return { text: JSON.stringify(goodPlan()), responseId: "r1" };
      case "section_draft":
        return {
          text: JSON.stringify({
            key: "sec",
            title: "Section",
            bodyMarkdown:
              `## Detail\nWe recommend proceeding. The baseline is supported by governed evidence [1]. ${FIGURE_SENTENCE} ` +
              "This section is complete and grounded. ".repeat(40),
            groundingMode: "mixed",
            citationsUsed: [1],
          }),
          responseId: "rs",
        };
      case "synthesis":
        return {
          text: JSON.stringify({
            title: "Airline Demo — AMS RFP",
            recommendation:
              "We recommend issuing the RFP given the validated scope and a $5.0M transition budget.",
            nextActions: [
              "Confirm the $5.0M transition budget",
              "Brief vendors",
            ],
            tables: [
              {
                key: "risk_register",
                title: "Risk / Issues / Dependencies",
                columns: ["Risk", "Owner"],
                rows: [["Transition overrun above $5.0M", "PMO"]],
              },
            ],
            clientCompleteChecklist: [
              {
                key: "budget",
                label: "Budget",
                owner: "cfo",
                reason: "client_judgment",
                placeholderText: "Confirm the $5.0M transition budget.",
              },
            ],
          }),
          responseId: "ry",
        };
      default:
        return { text: "{}" };
    }
  };

  async function run(req: DeliverableIntelligenceRequest) {
    const res = await runDeliverableOrchestration(req, stub, {
      enforceQualityGate: false,
    });
    const doc = res.document as RenderableDeliverable;
    const rendered = JSON.stringify({
      sections: doc.generatedSections.map((s) => s.bodyMarkdown),
      tables: doc.tables,
      recommendation: doc.recommendation,
      nextActions: doc.nextActions,
      checklist: doc.clientCompleteChecklist,
    });
    return { res, doc, rendered };
  }

  it("under the register: tags every untraced figure EVIDENCE MISSING and the gate blocks the bare tag", async () => {
    const { res, doc, rendered } = await run(enforcedRequest());
    expect(res.quality?.blockers.join(" ")).toMatch(/unsupported client-fact/);
    expect(doc.generatedSections[0].bodyMarkdown).toContain(
      REGISTER_UNTRACED_FIGURE_TAG,
    );
    expect(doc.recommendation).toContain(REGISTER_UNTRACED_FIGURE_TAG);
    expect(doc.nextActions[0]).toContain(REGISTER_UNTRACED_FIGURE_TAG);
    expect(JSON.stringify(doc.tables)).toContain(REGISTER_UNTRACED_FIGURE_TAG);
    expect(doc.clientCompleteChecklist[0].placeholderText).toContain(
      REGISTER_UNTRACED_FIGURE_TAG,
    );
    const openInputs = doc.tables.find((t) => t.key === "open_inputs_required");
    expect(JSON.stringify(openInputs?.rows)).toContain(
      REGISTER_UNTRACED_FIGURE_TAG,
    );
    expect(rendered).not.toContain(LEGACY_TAG);
  });

  it("flag off: the bare-tag figure passes the claim check and the legacy tag is kept", async () => {
    const { res, rendered } = await run(amsRfpRequest());
    const joined = res.quality?.blockers.join(" ") ?? "";
    // the bare-tag $2.4M passes; only the untagged $7.5M is unsupported
    expect(joined).toMatch(/unsupported client-fact/);
    expect(joined).toContain("$7.5M");
    expect(joined).not.toContain("$2.4M");
    expect(rendered).toContain(LEGACY_TAG);
    expect(rendered).not.toContain(REGISTER_UNTRACED_FIGURE_TAG);
  });
});

describe("assembleDeliverable repairs the rendered body under the register", () => {
  it("tags an untraced figure that reaches assembly untagged", () => {
    const req = enforcedRequest();
    const doc = assembleDeliverable(
      req,
      [
        {
          key: "value",
          title: "Value",
          bodyMarkdown: "We recommend proceeding. Run cost is $7.5M today.",
          groundingMode: "mixed",
          citationsUsed: [],
        },
      ],
      { title: "T", recommendation: "", nextActions: [], tables: [] } as never,
      req.governedEvidenceBundle,
    );
    expect(doc.generatedSections[0].bodyMarkdown).toContain(
      REGISTER_UNTRACED_FIGURE_TAG,
    );
    expect(doc.generatedSections[0].bodyMarkdown).not.toContain(LEGACY_TAG);
  });
});
