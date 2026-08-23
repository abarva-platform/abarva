// Every rule gets a positive AND a negative case.
//
// The negatives matter more. A scanner people stop trusting is worse than no
// scanner, because it launders real findings into ignorable noise.

import { scanClientReadiness } from "../client-readiness-scan";

const CLEAN_PROSE =
  "SkyHarbor Global should instrument turnaround delay at the stand before " +
  "committing to a predictive model. Today no owner is named for the delay-" +
  "volume source, so no baseline can be certified. The recommendation is an " +
  "owner-attested baseline with an accountable steward, reviewed weekly by " +
  "the SVP Flight Operations.";

function kinds(text: string) {
  return scanClientReadiness(text).findings.map((f) => f.kind);
}

describe("clean client prose", () => {
  it("reports nothing on a document that reads like consulting output", () => {
    const result = scanClientReadiness(CLEAN_PROSE);
    expect(result.findings).toEqual([]);
    expect(result.clean).toBe(true);
    expect(result.blockers).toBe(0);
  });

  it("handles empty and degenerate input without throwing", () => {
    expect(scanClientReadiness("").clean).toBe(true);
    expect(scanClientReadiness(null as unknown as string).clean).toBe(true);
  });
});

describe("identifiers that must never reach a client", () => {
  it("catches a UUID", () => {
    const text = `Traceability record 5bbf2d7c-328c-41e0-8a69-50094cd15f75 refers.`;
    expect(kinds(text)).toContain("uuid");
    expect(scanClientReadiness(text).blockers).toBeGreaterThan(0);
  });

  it("catches a content hash", () => {
    expect(kinds("Snapshot d66cbb39f61461dd0a1b was promoted.")).toContain(
      "content_hash",
    );
  });

  it("does not flag a long run of digits", () => {
    // An account number or a large unseparated figure is not a hash.
    expect(
      kinds("Reference 90210904471255311829 on the invoice."),
    ).not.toContain("content_hash");
  });

  it("does not flag an ordinary word made of hex letters", () => {
    expect(kinds("The deface added no value.")).not.toContain("content_hash");
  });

  it("does not flag a short hex-like token", () => {
    // Colours, part numbers and year codes are common in real documents.
    expect(kinds("Brand navy is #1B2B5C throughout.")).not.toContain(
      "content_hash",
    );
  });
});

describe("implementation detail", () => {
  it.each(["claude-sonnet-5", "GPT-4o", "gemini-2.0"])(
    "catches the model name %s",
    (model) => {
      expect(kinds(`Narrative generated with ${model}.`)).toContain(
        "model_name",
      );
    },
  );

  it("does not flag ordinary prose about models", () => {
    expect(
      kinds("The predictive model forecasts turnaround delay."),
    ).not.toContain("model_name");
  });

  it.each(["engagement_id", "tenant_key", "intelligence_v6", "state_jsonb"])(
    "catches the schema identifier %s",
    (identifier) => {
      expect(kinds(`Joined on ${identifier} for each record.`)).toContain(
        "schema_identifier",
      );
    },
  );

  it("does not flag snake_case that is ordinary domain language", () => {
    // Observed live in a real architecture document and correctly benign:
    // both describe governance behaviour to the reader.
    const text =
      "A human_approval flow precedes certification, and the figure stays " +
      "tagged external_benchmark until the client confirms it.";
    expect(kinds(text)).not.toContain("schema_identifier");
  });

  it("blocks generated-artifact enum pairs in client-facing source registers", () => {
    const result = scanClientReadiness(
      "Source Register: Delivery Handoff Pack generated_artifact:handoff_package high.",
    );
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "internal_enum_pair",
          match: "generated_artifact:handoff_package",
          severity: "blocker",
        }),
      ]),
    );
    expect(result.blockers).toBeGreaterThan(0);
  });

  it.each(["exec_summary", "dependencies_risks", "tower_metrics_plan"])(
    "blocks the internal artifact or section type key %s",
    (key) => {
      const result = scanClientReadiness(
        `The package section ${key} is ready.`,
      );
      expect(result.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "internal_type_key",
            match: key,
            severity: "blocker",
          }),
        ]),
      );
      expect(result.blockers).toBeGreaterThan(0);
    },
  );

  it("does not treat ordinary colon labels as enum pairs", () => {
    expect(
      kinds("Owner: Finance. Next action: approve the baseline."),
    ).not.toContain("internal_enum_pair");
  });

  it("does not treat URLs as enum pairs", () => {
    expect(
      kinds("Reference site: https://example.com/source-register."),
    ).not.toContain("internal_enum_pair");
  });
});

describe("internal reference codes", () => {
  it.each(["SRC-4F2A1B", "RUN_9d8c1", "DLV-00123"])("catches %s", (code) => {
    expect(kinds(`See ${code} for provenance.`)).toContain(
      "internal_reference_code",
    );
  });

  it("does not flag ordinary hyphenated capitals", () => {
    expect(
      kinds("This is an AI-DRIVEN, END-TO-END operating model."),
    ).not.toContain("internal_reference_code");
  });

  it("does not flag a code without a digit", () => {
    expect(kinds("The SRC-ALPHA workstream.")).not.toContain(
      "internal_reference_code",
    );
  });
});

describe("pipeline vocabulary", () => {
  it.each(["canonical build", "golden bar", "quality score", "read model"])(
    "flags %j for review",
    (phrase) => {
      const result = scanClientReadiness(`The ${phrase} was refreshed.`);
      expect(result.findings.map((f) => f.kind)).toContain(
        "pipeline_vocabulary",
      );
      // Advisory, not a blocker: some of these have legitimate client
      // meanings in context and a human should judge.
      expect(result.blockers).toBe(0);
      expect(result.reviewItems).toBeGreaterThan(0);
    },
  );
});

describe("placeholders", () => {
  it.each(["{{sponsor_name}}", "[TBD]", "[INSERT CLIENT NAME]", "Lorem ipsum"])(
    "catches %j as a blocker",
    (placeholder) => {
      const result = scanClientReadiness(`The sponsor is ${placeholder}.`);
      expect(result.findings.map((f) => f.kind)).toContain(
        "unresolved_placeholder",
      );
      expect(result.blockers).toBeGreaterThan(0);
    },
  );

  it("does not flag our deliberate evidence-gap marker", () => {
    // Saying plainly that a fact is missing is the behaviour we want, and it
    // must never be mistaken for an unfilled template.
    expect(
      kinds("Annual delay cost is [EVIDENCE MISSING — no approved extract]."),
    ).not.toContain("unresolved_placeholder");
  });

  it.each([
    "[ASSUMPTION TO VALIDATE: named sponsoring executive]",
    "[CLIENT TO COMPLETE: confirm final evaluation weights]",
  ])("does not flag governed uncertainty marker %j", (marker) => {
    expect(kinds(`Open item: ${marker}.`)).not.toContain(
      "unresolved_placeholder",
    );
  });
});

describe("client-facing implementation vocabulary", () => {
  it("flags client_judgment as implementation vocabulary for review", () => {
    const result = scanClientReadiness(
      "Client input required: accountable owner (client_judgment).",
    );
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "pipeline_vocabulary",
          match: "client_judgment",
        }),
      ]),
    );
    expect(result.blockers).toBe(0);
  });
});

describe("filler", () => {
  it("flags padding for review", () => {
    const result = scanClientReadiness(
      "In today's rapidly evolving aviation market, a holistic approach to " +
        "turnaround is required.",
    );
    expect(result.findings.map((f) => f.kind)).toContain("filler_language");
    expect(result.blockers).toBe(0);
  });

  it("does not flag ordinary business language", () => {
    expect(kinds(CLEAN_PROSE)).not.toContain("filler_language");
  });
});

describe("report shape", () => {
  it("reports each distinct leak once, however often it repeats", () => {
    const uuid = "5bbf2d7c-328c-41e0-8a69-50094cd15f75";
    const result = scanClientReadiness(
      `${uuid} appears here. And ${uuid} again. And once more: ${uuid}.`,
    );
    expect(result.findings.filter((f) => f.kind === "uuid")).toHaveLength(1);
  });

  it("still reports two different leaks of the same kind separately", () => {
    const result = scanClientReadiness(
      "Records 5bbf2d7c-328c-41e0-8a69-50094cd15f75 and " +
        "296fe820-5347-4268-9112-6c006babcef7 differ.",
    );
    expect(result.findings.filter((f) => f.kind === "uuid")).toHaveLength(2);
  });

  it("gives a reviewer enough context to judge without opening the file", () => {
    const finding = scanClientReadiness(
      `${CLEAN_PROSE} The record is engagement_id on every row.`,
    ).findings[0];
    expect(finding.context).toContain("«engagement_id»");
    expect(finding.why.length).toBeGreaterThan(20);
  });

  it("counts blockers and review items separately", () => {
    const result = scanClientReadiness(
      "See engagement_id. The quality score was 80.",
    );
    expect(result.blockers).toBe(1);
    expect(result.reviewItems).toBe(1);
    expect(result.clean).toBe(false);
  });
});
