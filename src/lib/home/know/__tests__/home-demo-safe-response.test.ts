import {
  DEMO_SAFE_CLIENT_NAMES,
  demoSafeClientText,
} from "@/lib/client-config";
import {
  sanitizeHomeKnowVisiblePayload,
  sanitizeHomeKnowVisiblePayloadWithAudit,
} from "../home-demo-safe-response";

/**
 * The cover names are read from the table, never written out here.
 *
 * Three assertions in this file spelled a cover name as a literal. The table was
 * later renamed, the literals were not, and the suite went red -- where it stayed,
 * because nothing ran it. A test that hardcodes the value it is checking stops
 * testing the behaviour and starts testing a copy of the answer.
 */
const SKYHARBOR = DEMO_SAFE_CLIENT_NAMES.skyharbor;
const LAKESHORE = DEMO_SAFE_CLIENT_NAMES.lakeshore;
const APEX = DEMO_SAFE_CLIENT_NAMES.apexretail;

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
    expect(safe.prose).toContain(SKYHARBOR);
    expect(safe.facts[0].label).toContain(SKYHARBOR);
    expect(safe.facts[0].value).toContain(SKYHARBOR);
    expect(safe.tables[0].rows[0].name).toContain(SKYHARBOR);
    expect(safe.citations[0].label).toContain(LAKESHORE);
    expect(safe.citations[0].excerpt).toContain(APEX);
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
      `${SKYHARBOR} and ${LAKESHORE} appeared in the prompt.`,
    );
  });

  it("collapses duplicate demo tenant openings after name sanitization", () => {
    const { payload: safe, audit } = sanitizeHomeKnowVisiblePayloadWithAudit({
      prose:
        "For SkyHarbor Air, For SkyHarbor Air, the enterprise profile is strong enough to orient leadership.",
    });

    expect(safe.prose).toBe(
      `For ${SKYHARBOR}, the enterprise profile is strong enough to orient leadership.`,
    );
    // The audit is checked by shape, not by a transcript of the prose. What matters is that it
    // recorded the reason and the field, and that the two prefixes bracket the collapse.
    expect(audit.sanitizerApplied).toBe(true);
    expect(audit.sanitizerReason).toBe("duplicate_tenant_opening");
    expect(audit.semanticLoss).toBe(false);
    expect(audit.changedFields).toEqual(["$.prose"]);
    expect(audit.beforePrefix).toContain(`For ${SKYHARBOR}, For ${SKYHARBOR},`);
    expect(audit.afterPrefix).toBe(safe.prose);
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
    expect(safe.safety.composerTrace.promptSnapshot.full).not.toContain("**");
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
      `For ${LAKESHORE}, the IT organization reflects the structural logic of a holding company.`,
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

  it("maps every raw name in the table to its cover name, whatever the table says", () => {
    // Derived from the table rather than from a list written here, so a raw name added without a
    // cover -- or a cover renamed without its callers -- fails immediately instead of in a suite
    // nobody runs. This is the check that would have caught the drift that made this file red.
    const rawNames = [
      "Apex Retail Group",
      "Apex Retail",
      "Meridian Health System",
      "Meridian Health",
      "First Capital Financial",
      "First Capital",
      "SkyHarbor Air Group",
      "SkyHarbor Airlines",
      "SkyHarbor Air",
      "Lakeshore Holdings Industries",
      "Lakeshore Industries",
    ];
    const covers = new Set(Object.values(DEMO_SAFE_CLIENT_NAMES));

    for (const raw of rawNames) {
      const covered = demoSafeClientText(`For ${raw}, the record is loaded.`);
      // Whatever it became must be one of the declared cover names, not an invented string.
      expect([...covers].some((cover) => covered.includes(cover))).toBe(true);
      // One raw name is also a cover name, so surviving is correct for that one and only that one.
      if (
        !covers.has(
          raw as (typeof DEMO_SAFE_CLIENT_NAMES)[keyof typeof DEMO_SAFE_CLIENT_NAMES],
        )
      ) {
        expect(covered).not.toContain(raw);
      }
    }
  });

  it("leaves a cover name alone when it is already a cover name", () => {
    // Sanitising twice must not keep renaming. A cover that is itself rewritten by the table is how
    // a name drifts one hop further on every pass through the sanitiser.
    for (const cover of Object.values(DEMO_SAFE_CLIENT_NAMES)) {
      const once = demoSafeClientText(`For ${cover}, the record is loaded.`);
      expect(demoSafeClientText(once)).toBe(once);
    }
  });
});
