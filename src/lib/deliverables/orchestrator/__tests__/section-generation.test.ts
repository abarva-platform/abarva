// Decomposed-generation helpers (Slice 0) — pure, no model.
import {
  mapWithConcurrency,
  extractUnsupportedFigureClaims,
  repairUncitedFigures,
  buildSourceRegister,
  assembleDeliverable,
  consolidateOpenInputPlaceholders,
  type SynthesisResult,
} from "../section-generation";
import { amsRfpRequest } from "../__fixtures__/ams-rfp";
import type { RenderableSection } from "../types";

describe("mapWithConcurrency", () => {
  it("preserves order and never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const out = await mapWithConcurrency(
      [1, 2, 3, 4, 5, 6, 7, 8],
      3,
      async (n) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
        return n * 2;
      },
    );
    expect(out).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });
});

describe("repairUncitedFigures", () => {
  it("labels an uncited figure as an assumption and leaves cited/figure-free prose alone", () => {
    expect(
      extractUnsupportedFigureClaims("Revenue grew 25% last year."),
    ).toEqual(["Revenue grew 25% last year."]);
    const repaired = repairUncitedFigures("Revenue grew 25% last year.");
    expect(repaired).toContain("[ASSUMPTION TO VALIDATE:");
    expect(extractUnsupportedFigureClaims(repaired)).toEqual([]);
    expect(
      repairUncitedFigures("Revenue grew 25% last year [3]."),
    ).not.toContain("[ASSUMPTION TO VALIDATE:");
    expect(repairUncitedFigures("We will modernise the platform.")).toBe(
      "We will modernise the platform.",
    );
  });

  it("recognizes the governed open-input pointer as supported after consolidation", () => {
    const text = "Target by FY2026 (open input — see Open Inputs Required).";
    expect(extractUnsupportedFigureClaims(text)).toEqual([]);
    expect(repairUncitedFigures(text)).toBe(text);
  });
});

describe("buildSourceRegister", () => {
  it("includes only evidence actually cited across the sections", () => {
    const req = amsRfpRequest();
    const sections: RenderableSection[] = [
      {
        key: "a",
        title: "A",
        bodyMarkdown: "x [1]",
        groundingMode: "mixed",
        citationsUsed: [1],
      },
      {
        key: "b",
        title: "B",
        bodyMarkdown: "y",
        groundingMode: "expert_template",
        citationsUsed: [],
      },
    ];
    expect(
      buildSourceRegister(req.governedEvidenceBundle, sections).map(
        (r) => r.citationNumber,
      ),
    ).toEqual([1]);
  });
});

describe("assembleDeliverable", () => {
  it("assembles sections + source register + synthesis fields in code", () => {
    const req = amsRfpRequest();
    const sections: RenderableSection[] = [
      {
        key: "a",
        title: "A",
        bodyMarkdown: "x [1]",
        groundingMode: "mixed",
        citationsUsed: [1],
      },
    ];
    const synth: SynthesisResult = {
      recommendation: "We recommend proceeding.",
      tables: [
        {
          key: "risk_register",
          title: "Risk",
          columns: [],
          rows: [],
          targetFormat: "docx",
        },
      ],
    };
    const doc = assembleDeliverable(
      req,
      sections,
      synth,
      req.governedEvidenceBundle,
    );
    expect(doc.generatedSections).toHaveLength(1);
    expect(doc.sourceRegister.map((r) => r.citationNumber)).toEqual([1]);
    expect(doc.tables[0]!.title).toBe("Risk");
    expect(doc.clientDisplayName).toBe(req.clientDisplayName);
  });

  it("adds conservative recommendation and risk-table fallbacks for concise Moves charters", () => {
    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "charter",
      missingEvidence: [],
      clientCompleteItems: [],
    });
    const sections: RenderableSection[] = [
      {
        key: "authorization_next_steps",
        title: "Authorization & Immediate Next Steps",
        bodyMarkdown:
          "Approve P2 Discovery with the charter scope, evidence families, and caveats carried forward as the governed source of truth.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];

    const doc = assembleDeliverable(
      req,
      sections,
      {},
      req.governedEvidenceBundle,
    );

    expect(doc.recommendation).toMatch(/approve discovery/i);
    expect(doc.recommendation.split(/\s+/).length).toBeGreaterThanOrEqual(12);
    expect(
      doc.tables.find((t) => /risk|issue|dependenc/i.test(t.title)),
    ).toMatchObject({
      key: "risk_register",
      title: "Risk / Issues / Dependencies",
    });
  });

  it("uses the explicit P3 decision section when synthesis is long but non-decisive", () => {
    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "target_state_architecture",
    });
    const sections: RenderableSection[] = [
      {
        key: "exec_summary",
        title: "Executive Summary",
        bodyMarkdown:
          "The future-state architecture frames the recovery control tower and its evidence-backed operating implications.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
      {
        key: "recommendation",
        title: "Recommendation & Next Actions",
        bodyMarkdown:
          "Choose Option B: governed recommendation workflow. It improves recovery prioritization and handoff visibility without over-building a command center or allowing autonomous customer-impacting actions.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];

    const doc = assembleDeliverable(
      req,
      sections,
      {
        recommendation:
          "The artifact should be reviewed by the sponsor before the next governed phase so the team can align on architecture implications.",
      },
      req.governedEvidenceBundle,
    );

    expect(doc.recommendation).toMatch(
      /^We recommend choosing Option B: governed recommendation workflow\./,
    );
  });

  it("scrubs bare internal UUIDs from generated body text while preserving raw model text for gates", () => {
    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "target_state_architecture",
    });
    const sections: RenderableSection[] = [
      {
        key: "logical_architecture",
        title: "Logical Architecture",
        bodyMarkdown:
          "The generated prose referenced move 2c5b4757-2bc5-4efc-8fdd-02b9b2f38a12 before describing the design.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];

    const doc = assembleDeliverable(
      req,
      sections,
      {
        recommendation:
          "We recommend choosing the governed design path because it preserves review controls and keeps operational decisions visible.",
      },
      req.governedEvidenceBundle,
    );

    expect(doc.generatedSections[0]!.bodyMarkdown).toContain(
      "(internal reference on file)",
    );
    expect(doc.generatedSections[0]!.bodyMarkdown).not.toMatch(
      /2c5b4757-2bc5-4efc-8fdd-02b9b2f38a12/,
    );
    expect(doc.generatedSections[0]!.rawBodyMarkdown).toMatch(
      /2c5b4757-2bc5-4efc-8fdd-02b9b2f38a12/,
    );
  });

  it("downgrades a business case title and consolidates unsupported figure claims into open inputs", () => {
    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "business_case",
    });
    const sections: RenderableSection[] = [
      {
        key: "value",
        title: "Value",
        bodyMarkdown: "Value is an assumption.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    const doc = assembleDeliverable(
      req,
      sections,
      {},
      req.governedEvidenceBundle,
      {
        unsupportedClaims: [
          {
            sectionKey: "value",
            sectionTitle: "Value",
            claim: "The program will generate $8.5M in year one.",
            treatment: "open_input_required",
          },
        ],
      },
    );
    expect(doc.title).toMatch(/^Business Case Readiness Memo/);
    expect(
      doc.tables.find((t) => t.key === "open_inputs_required")?.rows,
    ).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.stringContaining(
            "The program will generate $8.5M in year one.",
          ),
        ]),
      ]),
    );
    expect(
      doc.tables
        .find((t) => t.key === "open_inputs_required")
        ?.rows.flat()
        .join(" "),
    ).toContain("[ASSUMPTION TO VALIDATE:");
  });

  it("consolidates scattered per-section [CLIENT TO COMPLETE] tags into one Open Inputs table (regression 2026-07-08)", () => {
    // Each section independently follows its own "mark missing inputs inline"
    // instruction, so no single section scatters placeholders — but across N
    // sections the aggregated document previously still tripped the
    // whole-document "scattered placeholder" check and blocked export.
    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "business_case",
    });
    const sections: RenderableSection[] = [
      {
        key: "a",
        title: "Investment Summary",
        bodyMarkdown: "Total cost [CLIENT TO COMPLETE: capex range].",
        groundingMode: "mixed",
        citationsUsed: [],
      },
      {
        key: "b",
        title: "Financial Returns",
        bodyMarkdown: "Discount rate TBC.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
      {
        key: "c",
        title: "Scenario Analysis",
        bodyMarkdown: "Headcount assumption to be confirmed.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    const doc = assembleDeliverable(
      req,
      sections,
      {},
      req.governedEvidenceBundle,
    );

    const scatteredInBody = doc.generatedSections
      .map((s) => s.bodyMarkdown)
      .join("\n")
      .match(/\[CLIENT TO COMPLETE[^\]]*\]|\bTBC\b|\bto be confirmed\b/gi);
    expect(scatteredInBody).toBeNull();

    const openInputs = doc.tables.find((t) => t.key === "open_inputs_required");
    const rowText = (openInputs?.rows ?? [])
      .map((r) => r.join(" "))
      .join(" | ");
    expect(rowText).toMatch(/capex range/);
    expect(rowText).toMatch(/requires confirmation/i);
    expect(rowText).not.toMatch(
      /\[CLIENT TO COMPLETE[^\]]*\]|\bTBC\b|\bto be confirmed\b/gi,
    );
  });

  it("repairs unsupported figures that appear in synthesis tables, checklists, recommendation, and next actions", () => {
    const req = amsRfpRequest({
      module: "moves",
      deliverableType: "business_case",
      missingEvidence: [],
      clientCompleteItems: [],
    });
    const sections: RenderableSection[] = [
      {
        key: "current_state",
        title: "Current State",
        bodyMarkdown:
          "The current state is fragmented but evidence-backed [1].",
        groundingMode: "mixed",
        citationsUsed: [1],
      },
    ];
    const doc = assembleDeliverable(
      req,
      sections,
      {
        recommendation:
          "Approve the next validation gate after confirming the $5M benefit case.",
        nextActions: ["Confirm the 2026 operating baseline with Finance."],
        tables: [
          {
            key: "risk_register",
            title: "Risk",
            columns: ["Risk", "Implication"],
            rows: [
              [
                "Unproven benefit",
                "The value case assumes 12% productivity uplift.",
              ],
            ],
            targetFormat: "docx",
          },
        ],
        clientCompleteChecklist: [
          {
            key: "finance_baseline",
            label: "Confirm 2026 finance baseline",
            owner: "Finance",
            reason: "client_judgment",
            placeholderText: "Needed before claiming $5M benefit.",
          },
        ],
      },
      req.governedEvidenceBundle,
    );

    const visibleStructuredText = [
      doc.recommendation,
      ...doc.nextActions,
      ...doc.tables.flatMap((t) => t.rows.flat()),
      ...doc.clientCompleteChecklist.flatMap((c) => [
        c.label,
        String(c.owner),
        c.placeholderText ?? "",
      ]),
    ].join(" ");

    expect(visibleStructuredText).toContain("[ASSUMPTION TO VALIDATE:");
    expect(visibleStructuredText).toContain("$5M");
    expect(visibleStructuredText).toContain("12%");
    expect(visibleStructuredText).toContain("2026");
  });

  it("repairs the final assembled body after open-input consolidation", () => {
    const req = amsRfpRequest();
    const doc = assembleDeliverable(
      req,
      [
        {
          key: "target",
          title: "Target",
          bodyMarkdown:
            "Confirm the FY2026 target. [CLIENT TO COMPLETE: target owner]",
          groundingMode: "mixed",
          citationsUsed: [],
        },
      ],
      {},
      req.governedEvidenceBundle,
    );

    expect(
      extractUnsupportedFigureClaims(doc.generatedSections[0]!.bodyMarkdown),
    ).toEqual([]);
    expect(doc.generatedSections[0]!.bodyMarkdown).toContain("open input");
  });
});

describe("consolidateOpenInputPlaceholders", () => {
  it("leaves a section with no placeholders untouched (same reference)", () => {
    const sections: RenderableSection[] = [
      {
        key: "a",
        title: "A",
        bodyMarkdown: "Clean prose with no open items.",
        groundingMode: "mixed",
        citationsUsed: [],
      },
    ];
    const { sections: cleaned, harvested } =
      consolidateOpenInputPlaceholders(sections);
    expect(cleaned[0]).toBe(sections[0]);
    expect(harvested).toHaveLength(0);
  });
});
