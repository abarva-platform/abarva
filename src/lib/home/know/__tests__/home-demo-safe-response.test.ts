import {
  sanitizeHomeKnowVisiblePayload,
  sanitizeHomeKnowVisiblePayloadWithAudit,
} from "../home-demo-safe-response";

describe("home demo-safe response sanitizer", () => {
  it("converts old tenant names in user-visible Home KNOW payload strings", () => {
    const safe = sanitizeHomeKnowVisiblePayload({
      tenantKey: "skyharbor",
      route: "/api/home/know/ask",
      prose:
        "For SkyHarbor Air Group, the loaded context shows SkyHarbor Air operations.",
      facts: [
        {
          id: "fact-1",
          dimensionId: "enterprise_profile",
          label: "SkyHarbor Air business context",
          value: "SkyHarbor Airlines source packet",
          citationIds: ["citation-1"],
        },
      ],
      tables: [
        {
          id: "table-1",
          rows: [
            {
              client: "skyharbor",
              name: "SkyHarbor Air Group",
            },
          ],
        },
      ],
      citations: [
        {
          id: "citation-1",
          label: "Lakeshore Holdings comparison should be hidden",
          excerpt: "Apex Retail Group should also be hidden.",
        },
      ],
      safety: {
        composerTrace: {
          route: "/api/home/know/ask",
          promptSnapshot: {
            full: "SkyHarbor Air and Lakeshore Holdings appeared in the prompt.",
          },
        },
      },
    });

    expect(safe.tenantKey).toBe("skyharbor");
    expect(safe.route).toBe("/api/home/know/ask");
    expect(safe.tables[0].rows[0].client).toBe("skyharbor");
    expect(safe.prose).toContain("Airline Demo");
    expect(safe.facts[0].label).toContain("Airline Demo");
    expect(safe.facts[0].value).toContain("Airline Demo");
    expect(safe.tables[0].rows[0].name).toContain("Airline Demo");
    expect(safe.citations[0].label).toContain("Lakeshore Holdings");
    expect(safe.citations[0].excerpt).toContain("Retail Demo");
    expect(
      JSON.stringify({
        prose: safe.prose,
        facts: safe.facts,
        tables: safe.tables,
        citations: safe.citations,
      }),
    ).not.toMatch(
      /SkyHarbor Air Group|SkyHarbor Air|SkyHarbor Airlines|Apex Retail Group/i,
    );
    expect(safe.safety.composerTrace.promptSnapshot.full).toBe(
      "Airline Demo and Lakeshore Holdings appeared in the prompt.",
    );
  });

  it("collapses duplicate demo tenant openings after name sanitization", () => {
    const { payload: safe, audit } = sanitizeHomeKnowVisiblePayloadWithAudit({
      prose:
        "For SkyHarbor Air, For SkyHarbor Air, the enterprise profile is strong enough to orient leadership.",
    });

    expect(safe.prose).toBe(
      "For Airline Demo, the enterprise profile is strong enough to orient leadership.",
    );
    expect(audit).toEqual({
      sanitizerApplied: true,
      sanitizerReason: "duplicate_tenant_opening",
      semanticLoss: false,
      changedFields: ["$.prose"],
      beforePrefix:
        "For Airline Demo, For Airline Demo, the enterprise profile is strong enough to orient leadership",
      afterPrefix:
        "For Airline Demo, the enterprise profile is strong enough to orient leadership.",
    });
  });

  it("removes markdown emphasis from user-visible Home answer prose", () => {
    const { payload: safe, audit } = sanitizeHomeKnowVisiblePayloadWithAudit({
      prose: [
        "For Lakeshore Holdings Industries, three facts frame the CFO view.",
        "- **What this means:** portfolio revenue rolls up to $7.12B.",
        "- **Why it matters:** the holding company has no direct revenue.",
        "### Where next",
        "Use Intelligence for advisory options.",
      ].join("\n"),
      safety: {
        composerTrace: {
          route: "/api/home/know/ask",
          promptSnapshot: {
            full: "Keep **raw trace emphasis** available to operators.",
          },
        },
      },
    });

    expect(safe.prose).toContain("- What this means:");
    expect(safe.prose).toContain("- Why it matters:");
    expect(safe.prose).toContain("Where next");
    expect(safe.prose).not.toMatch(/\*\*|^#{1,6}\s/m);
    expect(
      safe.safety.composerTrace.promptSnapshot.full,
    ).not.toContain("**");
    expect(audit.sanitizerApplied).toBe(true);
    expect(audit.sanitizerReason).toBe("markdown_markup");
    expect(audit.changedFields).toContain("$.prose");
  });

  it("collapses variant tenant openings at the start of visible prose", () => {
    const { payload: safe, audit } = sanitizeHomeKnowVisiblePayloadWithAudit({
      prose:
        "For Lakeshore Holdings Industries, For Lakeshore Holdings, the IT organization reflects the structural logic of a holding company.",
    });

    expect(safe.prose).toBe(
      "For Lakeshore Holdings Industries, the IT organization reflects the structural logic of a holding company.",
    );
    expect(audit.sanitizerApplied).toBe(true);
    expect(audit.sanitizerReason).toBe("duplicate_tenant_opening");
    expect(audit.changedFields).toContain("$.prose");
  });

  it("rephrases implementation-detail language into executive source wording", () => {
    const { payload: safe, audit } = sanitizeHomeKnowVisiblePayloadWithAudit({
      prose:
        "For Lakeshore Holdings Industries, the question touches implementation detail, so Home should explain the boundary.",
    });

    expect(safe.prose).toContain("source trail and evidence ownership");
    expect(safe.prose).not.toMatch(/implementation detail/i);
    expect(audit.sanitizerApplied).toBe(true);
    expect(audit.sanitizerReason).toBe("executive_wording");
    expect(audit.changedFields).toContain("$.prose");
  });

  it("reports no visible sanitizer change when duplicate openings are absent", () => {
    const { payload: safe, audit } = sanitizeHomeKnowVisiblePayloadWithAudit({
      prose:
        "For Lakeshore Holdings, the enterprise profile is strong enough to orient leadership.",
    });

    expect(safe.prose).toBe(
      "For Lakeshore Holdings, the enterprise profile is strong enough to orient leadership.",
    );
    expect(audit).toEqual({
      sanitizerApplied: false,
      sanitizerReason: "none",
      semanticLoss: false,
      changedFields: [],
    });
  });
});
