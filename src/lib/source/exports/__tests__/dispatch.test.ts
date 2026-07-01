import { renderSourceDeliverable } from "../dispatch";
import type { SourceDeliverableSpec } from "../types";

const COMMON_BASE = {
  tenantKey: "meridian",
  sourceEventId: "event-1",
  title: "Meridian Cloud Sourcing",
  generatedAt: "2026-05-08T03:30:00.000Z",
};

const NARRATIVE_PAYLOAD = {
  eventCode: "MERI-CLOUD-2026",
  eventName: "Meridian Health Cloud & Infrastructure",
  issuedBy: "Janet Fischer, VP IT Ops",
  body: "# Sample\n\nLine one.\n\n## Section\n\n- bullet 1\n- bullet 2",
  bodyIsAuthored: true,
};

function makeSpec(
  kind: SourceDeliverableSpec["kind"],
  payloadOverride?: Record<string, unknown>,
): SourceDeliverableSpec {
  return {
    ...COMMON_BASE,
    kind,
    payload: (payloadOverride ?? NARRATIVE_PAYLOAD) as unknown as Record<
      string,
      unknown
    >,
  };
}

describe("renderSourceDeliverable · narrative kinds", () => {
  for (const kind of [
    "strategy-memo",
    "scope-memo",
    "rfp-package",
    "vendor-response-pack",
    "decision-brief",
    "selection-memo",
  ] as const) {
    describe(kind, () => {
      it("returns docx by default with valid ZIP magic", async () => {
        const result = await renderSourceDeliverable(makeSpec(kind));
        expect(result.format).toBe("docx");
        expect(result.buffer[0]).toBe(0x50);
        expect(result.buffer[1]).toBe(0x4b);
        expect(result.contentType).toContain("wordprocessing");
      });

      it("returns html when requested", async () => {
        const result = await renderSourceDeliverable(makeSpec(kind), "html");
        expect(result.format).toBe("html");
        expect(result.buffer.toString("utf8")).toContain("<!DOCTYPE html>");
      });

      it("throws on xlsx (not allowed for narrative kinds)", async () => {
        await expect(
          renderSourceDeliverable(makeSpec(kind), "xlsx"),
        ).rejects.toThrow(/Format "xlsx" is not allowed/);
      });
    });
  }
});

describe("renderSourceDeliverable · structured-data kinds (xlsx + docx)", () => {
  it("app-inventory renders xlsx by default", async () => {
    const payload = {
      tenantName: "Meridian",
      eventCode: "MERI-CLOUD-2026",
      eventName: "Meridian Health Cloud",
      generatedAt: COMMON_BASE.generatedAt,
      tierDefinitions: [
        {
          tier: 1,
          label: "Mission-critical",
          criterion: "Outage halts revenue.",
          recoveryObjective: "RTO < 4h",
          examples: "Epic CIS",
        },
        {
          tier: 2,
          label: "Important",
          criterion: "Productivity impact.",
          recoveryObjective: "RTO < 24h",
          examples: "ITSM",
        },
        {
          tier: 3,
          label: "Standard",
          criterion: "Tolerable for days.",
          recoveryObjective: "RTO < 72h",
          examples: "Archive",
        },
      ],
      rows: [
        {
          id: "A-EPIC-01",
          name: "Epic CIS",
          tier: 1,
          owner: "Karen Liu",
          techStack: "Cache MUMPS",
          hostingToday: "Newark colo",
          annualWorkloadCount: 24000,
          inScope: true,
        },
      ],
    };
    const result = await renderSourceDeliverable(
      makeSpec("app-inventory", payload),
    );
    expect(result.format).toBe("xlsx");
    expect(result.buffer[0]).toBe(0x50);
    expect(result.buffer[1]).toBe(0x4b);
  });

  it("app-inventory also renders docx when requested", async () => {
    const payload = {
      tenantName: "Meridian",
      eventCode: "MERI-CLOUD-2026",
      eventName: "Meridian Health Cloud",
      generatedAt: COMMON_BASE.generatedAt,
      tierDefinitions: [
        {
          tier: 1,
          label: "M",
          criterion: "x",
          recoveryObjective: "y",
          examples: "z",
        },
      ],
      rows: [],
    };
    const result = await renderSourceDeliverable(
      makeSpec("app-inventory", payload),
      "docx",
    );
    expect(result.format).toBe("docx");
    expect(result.contentType).toContain("wordprocessing");
  });

  it("scorecard renders xlsx + docx", async () => {
    const payload = {
      tenantName: "Meridian",
      eventCode: "MERI-CLOUD-2026",
      eventName: "Meridian Health Cloud",
      generatedAt: COMMON_BASE.generatedAt,
      criteria: [
        {
          id: "C-FIT",
          label: "Functional fit",
          weightPercent: 100,
          description: "d04 coverage.",
        },
      ],
      vendors: ["Acme"],
      scoreGuidance: [
        { score: 3 as const, label: "Meets", rubric: "Fully meets." },
      ],
    };
    const xlsxResult = await renderSourceDeliverable(
      makeSpec("scorecard", payload),
    );
    expect(xlsxResult.format).toBe("xlsx");
    const docxResult = await renderSourceDeliverable(
      makeSpec("scorecard", payload),
      "docx",
    );
    expect(docxResult.format).toBe("docx");
  });

  it("response-checklist renders xlsx + docx", async () => {
    const payload = {
      tenantName: "Meridian",
      eventCode: "MERI-CLOUD-2026",
      eventName: "Meridian Health Cloud",
      generatedAt: COMMON_BASE.generatedAt,
      mandatoryItems: [
        { id: "M-EXEC-01", section: "Exec", requirement: "Exec summary." },
      ],
      optionalItems: [],
      formatExpectations: [{ topic: "PDF", requirement: "searchable" }],
      certifications: ["Officer authorized."],
    };
    const xlsxResult = await renderSourceDeliverable(
      makeSpec("response-checklist", payload),
    );
    expect(xlsxResult.format).toBe("xlsx");
    const docxResult = await renderSourceDeliverable(
      makeSpec("response-checklist", payload),
      "docx",
    );
    expect(docxResult.format).toBe("docx");
  });
});

// ── G7 parity: d19 / d20 / d22 now render xlsx + docx + pdf ────────────────
//
// Each renders the artifact's actual content into a non-empty, valid
// buffer for every newly-supported format. ZIP magic (0x50 0x4B) for
// xlsx + docx; PDF magic (%PDF) for pdf.

const PRICING_TEMPLATE_PAYLOAD = {
  tenantName: "Meridian",
  eventCode: "MERI-CLOUD-2026",
  eventName: "Meridian Health Cloud",
  generatedAt: COMMON_BASE.generatedAt,
  assumptions: [
    { key: "Term", value: "3 years", rationale: "Standard buyer commit." },
  ],
  lineItems: [
    {
      id: "L-CMP-01",
      category: "Platform",
      description: "Compute",
      unit: "unit-month",
      annualQuantity: 280,
    },
  ],
  tcoYears: 3,
  escalator: 0.04,
};

const PRICING_COMPARISON_PAYLOAD = {
  tenantName: "Meridian",
  eventCode: "MERI-CLOUD-2026",
  eventName: "Meridian Health Cloud",
  generatedAt: COMMON_BASE.generatedAt,
  lineItems: [
    {
      id: "L-CMP-01",
      category: "Platform",
      description: "Compute",
      unit: "unit-month",
      annualQuantity: 280,
    },
  ],
  assumptions: [{ key: "Term", value: "3 years" }],
  escalator: 0.04,
  tcoYears: 3,
  submissions: [
    {
      vendorName: "Acme",
      submittedAt: COMMON_BASE.generatedAt,
      unitPricesById: { "L-CMP-01": 120 },
      pricingNotes: "Volume discount available beyond 400 units.",
      assumptionDeviations: [
        {
          assumptionKey: "Term",
          proposedAlternative: "5 years",
          severity: "medium" as const,
        },
      ],
    },
  ],
};

const TRAP_LOG_PAYLOAD = {
  tenantName: "Meridian",
  eventCode: "MERI-CLOUD-2026",
  eventName: "Meridian Health Cloud",
  generatedAt: COMMON_BASE.generatedAt,
  severityDefinitions: [
    { severity: "P0" as const, label: "Deal-shaping", rubric: "Material." },
  ],
  rows: [
    {
      id: "T-EGR-01",
      severity: "P0" as const,
      category: "Egress",
      description: "Egress overage.",
      surfacedFor: "all",
      surfacedBy: "Sentinel",
    },
  ],
};

const BAFO_PAYLOAD = {
  tenantName: "Meridian",
  eventCode: "MERI-CLOUD-2026",
  eventName: "Meridian Health Cloud",
  generatedAt: COMMON_BASE.generatedAt,
  roundLabel: "BAFO Round 1",
  vendors: ["Acme"],
  trapQuestions: [
    {
      id: "TQ-01",
      source: "T-EGR-01",
      severity: "P0" as const,
      question: "Resolve egress?",
      responseFormat: "y/n",
    },
  ],
  valueQuestions: [
    {
      id: "VQ-01",
      source: "Innovation",
      severity: "n/a" as const,
      question: "Roadmap?",
      responseFormat: "milestones",
    },
  ],
};

function expectZip(buffer: Buffer): void {
  expect(buffer.byteLength).toBeGreaterThan(1000);
  expect(buffer[0]).toBe(0x50);
  expect(buffer[1]).toBe(0x4b);
}

function expectPdf(buffer: Buffer): void {
  expect(buffer.byteLength).toBeGreaterThan(1000);
  expect(buffer.toString("latin1", 0, 5)).toBe("%PDF-");
}

describe("renderSourceDeliverable · structured artifacts render every format (G7)", () => {
  const cases: ReadonlyArray<{
    kind:
      | "pricing-template"
      | "pricing-comparison"
      | "trap-log"
      | "bafo-question-pack";
    payload: Record<string, unknown>;
  }> = [
    { kind: "pricing-template", payload: PRICING_TEMPLATE_PAYLOAD },
    { kind: "pricing-comparison", payload: PRICING_COMPARISON_PAYLOAD },
    { kind: "trap-log", payload: TRAP_LOG_PAYLOAD },
    { kind: "bafo-question-pack", payload: BAFO_PAYLOAD },
  ];

  for (const { kind, payload } of cases) {
    describe(kind, () => {
      it("renders xlsx by default with valid ZIP magic", async () => {
        const result = await renderSourceDeliverable(makeSpec(kind, payload));
        expect(result.format).toBe("xlsx");
        expectZip(result.buffer);
      });

      it("renders a non-empty docx when requested", async () => {
        const result = await renderSourceDeliverable(
          makeSpec(kind, payload),
          "docx",
        );
        expect(result.format).toBe("docx");
        expect(result.contentType).toContain("wordprocessing");
        expectZip(result.buffer);
      });

      it("renders a non-empty pdf when requested", async () => {
        const result = await renderSourceDeliverable(
          makeSpec(kind, payload),
          "pdf",
        );
        expect(result.format).toBe("pdf");
        expect(result.contentType).toBe("application/pdf");
        expectPdf(result.buffer);
      });
    });
  }

  it("app-inventory / response-checklist / scorecard also render pdf", async () => {
    const appInv = await renderSourceDeliverable(
      makeSpec("app-inventory", {
        tenantName: "Meridian",
        eventCode: "MERI-CLOUD-2026",
        eventName: "Meridian Health Cloud",
        generatedAt: COMMON_BASE.generatedAt,
        tierDefinitions: [
          {
            tier: 1,
            label: "M",
            criterion: "x",
            recoveryObjective: "y",
            examples: "z",
          },
        ],
        rows: [
          {
            id: "A-01",
            name: "Epic",
            tier: 1,
            owner: "K",
            techStack: "T",
            hostingToday: "H",
            annualWorkloadCount: 100,
            inScope: true,
          },
        ],
      }),
      "pdf",
    );
    expect(appInv.format).toBe("pdf");
    expectPdf(appInv.buffer);
  });

  it("renders an explicit empty state — never invents rows — when payload sections are empty", async () => {
    // trap-log with zero rows: the docx + pdf must still produce a
    // valid document carrying the empty-state copy, not fabricated traps.
    const emptyTrapLog = {
      ...TRAP_LOG_PAYLOAD,
      rows: [] as ReadonlyArray<never>,
    };
    const docx = await renderSourceDeliverable(
      makeSpec("trap-log", emptyTrapLog),
      "docx",
    );
    expect(docx.format).toBe("docx");
    expectZip(docx.buffer);
    const pdf = await renderSourceDeliverable(
      makeSpec("trap-log", emptyTrapLog),
      "pdf",
    );
    expect(pdf.format).toBe("pdf");
    expectPdf(pdf.buffer);
  });

  it("renders pricing-template html as a buyer-readable summary", async () => {
    const result = await renderSourceDeliverable(
      makeSpec("pricing-template", PRICING_TEMPLATE_PAYLOAD),
      "html",
    );
    const html = result.buffer.toString("utf8");
    expect(result.format).toBe("html");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Pricing Workbook Summary");
    expect(html).toContain("d19 · Pricing Workbook Summary");
  });
});
