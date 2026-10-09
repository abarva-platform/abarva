/**
 * The research brief is the only thing about a Move that reaches the public
 * web, so these cases feed it fixtures that DO carry figures, tenant names and
 * free client text, and assert none of it survives into the brief, its hash
 * input or the rendered prompt. Tenant names come from the registry in code,
 * never a hand-typed list.
 */
import {
  BRIEF_REGISTER_QUESTIONS_MAX,
  BRIEF_VALUE_LEVERS_MAX,
  buildResearchBrief,
  hashResearchBrief,
  registryDeniedNames,
  renderResearchBrief,
  RESEARCH_BRIEF_FIELDS,
} from "../public-research/research-brief";
import {
  CANONICAL_TENANT_KEYS,
  resolveTenantAlias,
} from "@/lib/tenant/aliases";

const CLIENT_NAME = "Northwind Regional Care";

const clean = {
  industry: "HEALTHCARE_IDN",
  archetype: "ambient_clinical_documentation",
  useCase: "clinical note drafting",
  valueLevers: ["cycle time", "cost reduction"],
  registerQuestions: [
    "Which payer rules govern reimbursement for ambient documentation?",
  ],
};

const dirty = {
  industry: "Healthcare (8 hospitals)",
  archetype: `${CLIENT_NAME} ambient`,
  useCase:
    "Our clinicians spend far too long writing notes after every single shift and we want that fixed",
  valueLevers: [
    "cycle time",
    "$4.2M savings",
    "reduce 30% of after-hours charting",
    "meridian health throughput",
  ],
  registerQuestions: [
    "What did the 2025 board approve?",
    "Which rules apply to Northwind Regional Care?",
    "Tell me everything about our payer contracts",
  ],
  deniedNames: [CLIENT_NAME],
};

describe("buildResearchBrief", () => {
  it("admits only the allowlisted fields, normalized as labels", () => {
    const built = buildResearchBrief(clean);
    expect(Object.keys(built.brief).sort()).toEqual(
      [...RESEARCH_BRIEF_FIELDS].sort(),
    );
    expect(built.brief).toEqual({
      industry: "healthcare idn",
      archetype: "ambient clinical documentation",
      useCase: "clinical note drafting",
      valueLevers: ["cost reduction", "cycle time"],
      registerQuestions: [
        "Which payer rules govern reimbursement for ambient documentation?",
      ],
    });
    expect(built.empty).toBe(false);
    expect(built.dropped).toEqual([]);
  });

  it("ignores any field outside the allowlist", () => {
    const built = buildResearchBrief({
      ...clean,
      decisionContext: "Approve the 2026 budget for Northwind",
      clientDisplayName: CLIENT_NAME,
    } as never);
    expect(JSON.stringify(built.brief)).not.toMatch(/budget|Northwind|2026/);
  });

  it("drops figures, names and free text whole, and says which field and why", () => {
    const built = buildResearchBrief(dirty);
    expect(built.brief.industry).toBeNull();
    expect(built.brief.archetype).toBeNull();
    expect(built.brief.useCase).toBeNull();
    expect(built.brief.valueLevers).toEqual(["cycle time"]);
    expect(built.brief.registerQuestions).toEqual([]);
    expect(built.dropped).toEqual([
      { field: "industry", reason: "figure" },
      { field: "archetype", reason: "name" },
      { field: "useCase", reason: "free_text" },
      { field: "valueLevers", reason: "figure" },
      { field: "valueLevers", reason: "figure" },
      { field: "valueLevers", reason: "name" },
      { field: "registerQuestions", reason: "figure" },
      { field: "registerQuestions", reason: "name" },
      { field: "registerQuestions", reason: "free_text" },
    ]);
  });

  it("renders a prompt with no digits, no names and no free text", () => {
    const built = buildResearchBrief(dirty);
    const prompt = renderResearchBrief(built.brief);
    const serialized = `${prompt}\n${JSON.stringify(built.brief)}`;
    expect(serialized).not.toMatch(/\p{Nd}/u);
    expect(serialized).not.toMatch(/[$%]/);
    expect(serialized.toLowerCase()).not.toContain("northwind");
    expect(serialized.toLowerCase()).not.toContain("meridian");
    expect(serialized).not.toContain("clinicians spend");
    expect(serialized).not.toContain("payer contracts");
    expect(prompt).toBe("Value levers: cycle time");
  });

  it("drops every tenant name the registry knows, including display names", () => {
    expect(CANONICAL_TENANT_KEYS.length).toBeGreaterThan(1);
    const names = registryDeniedNames();
    for (const key of CANONICAL_TENANT_KEYS) {
      const profile = resolveTenantAlias(key)!;
      expect(names).toContain(profile.displayName);
      for (const value of [profile.displayName, key, profile.appClientKey]) {
        const built = buildResearchBrief({ useCase: `${value} intake` });
        expect(built.brief.useCase).toBeNull();
        expect(built.dropped).toEqual([{ field: "useCase", reason: "name" }]);
      }
    }
  });

  it("drops a caller-supplied name in any spelling", () => {
    for (const spelling of [
      "northwind_regional_care rollout",
      "NORTHWIND-REGIONAL-CARE rollout",
    ]) {
      const built = buildResearchBrief({
        archetype: spelling,
        deniedNames: [CLIENT_NAME],
      });
      expect(built.brief.archetype).toBeNull();
    }
    // Without the caller's name the same words are a label.
    expect(
      buildResearchBrief({ archetype: "regional care rollout" }).brief
        .archetype,
    ).toBe("regional care rollout");
  });

  it("drops a currency or percent sign as a figure even without digits", () => {
    expect(
      buildResearchBrief({ valueLevers: ["upside in $", "share %"] }).dropped,
    ).toEqual([
      { field: "valueLevers", reason: "figure" },
      { field: "valueLevers", reason: "figure" },
    ]);
  });

  it("spells hyphenated and underscored identifiers as words", () => {
    expect(
      buildResearchBrief({ useCase: "after-hours_coverage" }).brief.useCase,
    ).toBe("after hours coverage");
  });

  it("ignores a one-letter denied name instead of denying every such word", () => {
    expect(
      buildResearchBrief({ useCase: "a b rule", deniedNames: ["A", ""] }).brief
        .useCase,
    ).toBe("a b rule");
  });

  it("drops a term over the label length as free text", () => {
    expect(
      buildResearchBrief({ useCase: "one two three four five six" }).brief
        .useCase,
    ).toBe("one two three four five six");
    expect(
      buildResearchBrief({ useCase: "one two three four five six seven" })
        .dropped,
    ).toEqual([{ field: "useCase", reason: "free_text" }]);
    expect(buildResearchBrief({ useCase: "a".repeat(61) }).dropped).toEqual([
      { field: "useCase", reason: "free_text" },
    ]);
    expect(buildResearchBrief({ useCase: "a".repeat(60) }).brief.useCase).toBe(
      "a".repeat(60),
    );
    expect(buildResearchBrief({ useCase: "notes: urgent" }).dropped).toEqual([
      { field: "useCase", reason: "free_text" },
    ]);
  });

  it("admits one short question and drops statements and long questions", () => {
    const long = `Which ${"a ".repeat(24)}rule applies?`;
    const built = buildResearchBrief({
      registerQuestions: [
        "Which payer rules apply?",
        "Payer rules apply.",
        "Which rules apply? And who decides?",
        long,
        `Which ${"x".repeat(200)} rules apply?`,
      ],
    });
    expect(built.brief.registerQuestions).toEqual(["Which payer rules apply?"]);
    expect(built.dropped).toEqual([
      { field: "registerQuestions", reason: "free_text" },
      { field: "registerQuestions", reason: "free_text" },
      { field: "registerQuestions", reason: "free_text" },
      { field: "registerQuestions", reason: "free_text" },
    ]);
  });

  it("caps value levers and register questions, deduped", () => {
    const levers = Array.from(
      { length: BRIEF_VALUE_LEVERS_MAX + 2 },
      (_, i) => `lever ${"abcdefghij"[i]}`,
    );
    const questions = Array.from(
      { length: BRIEF_REGISTER_QUESTIONS_MAX + 1 },
      (_, i) => `Which rule ${"abcdefghij"[i]} applies?`,
    );
    const built = buildResearchBrief({
      valueLevers: [...levers, levers[0]!],
      registerQuestions: questions,
    });
    expect(built.brief.valueLevers).toHaveLength(BRIEF_VALUE_LEVERS_MAX);
    expect(built.brief.registerQuestions).toHaveLength(
      BRIEF_REGISTER_QUESTIONS_MAX,
    );
    expect(built.dropped).toEqual([
      { field: "valueLevers", reason: "over_limit" },
      { field: "valueLevers", reason: "over_limit" },
      { field: "registerQuestions", reason: "over_limit" },
    ]);
  });

  it("is empty when no allowlisted field survives", () => {
    expect(buildResearchBrief({}).empty).toBe(true);
    expect(buildResearchBrief(dirty).empty).toBe(false);
    expect(
      buildResearchBrief({ industry: "8 hospitals", valueLevers: ["$1"] })
        .empty,
    ).toBe(true);
    expect(
      buildResearchBrief({ registerQuestions: ["Which rule?"] }).empty,
    ).toBe(false);
  });
});

describe("briefHash", () => {
  it("is a sha256 of the screened brief, independent of input order", () => {
    const a = buildResearchBrief(clean);
    const b = buildResearchBrief({
      ...clean,
      valueLevers: [...clean.valueLevers].reverse(),
    });
    expect(a.briefHash).toMatch(/^[0-9a-f]{64}$/);
    expect(b.briefHash).toBe(a.briefHash);
    expect(hashResearchBrief(a.brief)).toBe(a.briefHash);
  });

  it("changes when any field changes, and ignores dropped values", () => {
    const base = buildResearchBrief(clean).briefHash;
    for (const over of [
      { industry: "RETAIL" },
      { archetype: "claims automation" },
      { useCase: "prior authorization" },
      { valueLevers: ["risk reduction"] },
      { registerQuestions: ["Which standard applies?"] },
    ]) {
      expect(buildResearchBrief({ ...clean, ...over }).briefHash).not.toBe(
        base,
      );
    }
    expect(
      buildResearchBrief({
        ...clean,
        valueLevers: [...clean.valueLevers, "$9M upside"],
      }).briefHash,
    ).toBe(base);
  });
});

describe("renderResearchBrief", () => {
  it("states each surviving field on its own line", () => {
    expect(renderResearchBrief(buildResearchBrief(clean).brief)).toBe(
      [
        "Industry: healthcare idn",
        "Archetype: ambient clinical documentation",
        "Use case: clinical note drafting",
        "Value levers: cost reduction; cycle time",
        "Open questions:",
        "- Which payer rules govern reimbursement for ambient documentation?",
      ].join("\n"),
    );
  });
});
