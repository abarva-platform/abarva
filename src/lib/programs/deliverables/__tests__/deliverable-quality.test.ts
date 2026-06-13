import { describe, it, expect } from "@jest/globals";
import {
  resolveSourceLabel,
  buildSourceRegister,
  findForbiddenTags,
  applyCitationsToBody,
  scrubInternalSourceTags,
} from "../source-labels";
import { validateDeliverableQuality } from "../quality-validator";

describe("source-labels — internal id → human-readable citation", () => {
  it("maps known ids to clean titles (no raw id)", () => {
    expect(resolveSourceLabel("tower_dora_metrics").title).toMatch(
      /DORA|Delivery/,
    );
    expect(
      resolveSourceLabel("document_extract:stakeholder_map").title,
    ).toMatch(/Stakeholder/);
    expect(resolveSourceLabel("tower_cmdb_cis").title).toMatch(
      /Application|Systems/,
    );
  });

  it("humanizes unknown ids deterministically (no leak)", () => {
    const l = resolveSourceLabel("document_extract:vendor_contracts");
    expect(l.title).not.toMatch(/document_extract|:/);
    expect(l.title.toLowerCase()).toContain("vendor");
  });

  it("buildSourceRegister assigns stable [n] + citation map", () => {
    const { register, citationMap } = buildSourceRegister([
      "tower_dora_metrics",
      "document_extract:stakeholder_map",
      "tower_dora_metrics",
    ]);
    expect(register).toHaveLength(2);
    expect(register[0].ref).toBe(1);
    expect(citationMap["tower_dora_metrics"]).toBe(1);
    expect(citationMap["document_extract:stakeholder_map"]).toBe(2);
    // register never prints the raw id in title
    for (const r of register)
      expect(r.title).not.toMatch(/tower_|document_extract:/);
  });
});

describe("forbidden-tag detection", () => {
  it("catches every internal tag class", () => {
    expect(
      findForbiddenTags("see document_extract:stakeholder_map").length,
    ).toBeGreaterThan(0);
    expect(findForbiddenTags("rows in tower_cmdb_cis").length).toBeGreaterThan(
      0,
    );
    expect(findForbiddenTags("chunk_id 5").length).toBeGreaterThan(0);
    expect(findForbiddenTags("fact_key abc").length).toBeGreaterThan(0);
    expect(findForbiddenTags("source_segment_id x").length).toBeGreaterThan(0);
  });
  it("clean prose passes", () => {
    expect(
      findForbiddenTags("The delivery baseline shows 9 deploys/month [2]."),
    ).toEqual([]);
  });
});

describe("scrubInternalSourceTags — final rendering pass (no [n] map)", () => {
  it("replaces an inline [source: tower_*] tag with its human label", () => {
    const out = scrubInternalSourceTags(
      "IT systems in scope [source: tower_cmdb_cis] are committed.",
    );
    expect(findForbiddenTags(out)).toEqual([]);
    expect(out).toMatch(/Application|Systems/);
    expect(out).not.toContain("tower_cmdb_cis");
  });

  it("scrubs every internal id class an LLM might echo", () => {
    const out = scrubInternalSourceTags(
      "From tower_workforce and tower_dora_metrics, plus document_extract:stakeholder_map and method:maturity_scoring.",
    );
    expect(findForbiddenTags(out)).toEqual([]);
    expect(out).not.toMatch(/tower_|document_extract:|method:/);
  });

  it("scrubs a raw table id embedded in claim/digest TEXT (not just the citation)", () => {
    // Regression: the readiness digest used to read "N records committed to
    // tower_cmdb_cis", leaking the raw table into the deterministic card body.
    const out = scrubInternalSourceTags(
      "IT systems & application landscape: 4 records committed to tower_cmdb_cis.",
    );
    expect(findForbiddenTags(out)).toEqual([]);
    expect(out).not.toContain("tower_cmdb_cis");
    expect(out).toMatch(/Application & Systems Inventory/);
  });

  it("is idempotent on already-clean prose", () => {
    const clean = "The delivery baseline shows 9 deploys/month [2].";
    expect(scrubInternalSourceTags(clean)).toBe(clean);
  });
});

describe("applyCitationsToBody — scrub raw ids to [n]", () => {
  const map = { tower_dora_metrics: 2, "document_extract:stakeholder_map": 1 };
  it("rewrites (source: id) and bare ids to [n]", () => {
    const out = applyCitationsToBody(
      "DORA baseline (source: tower_dora_metrics); gates from document_extract:stakeholder_map.",
      map,
    );
    expect(out).toContain("[2]");
    expect(out).toContain("[1]");
    expect(findForbiddenTags(out)).toEqual([]);
  });
});

describe("validateDeliverableQuality — the export gate", () => {
  const goodRegister = buildSourceRegister(["tower_dora_metrics"]).register;
  const base = {
    title: "Program Charter — X",
    version: "0.1",
    date: "2026-06-10",
    sourceRegister: goodRegister,
    requiredSections: ["Executive Summary", "Risks"],
    requiredTableSections: ["Risks"],
    bodyFontPt: 11,
  };

  it("FAILS on internal tag leakage", () => {
    const r = validateDeliverableQuality({
      ...base,
      bodyMarkdown:
        "## Executive Summary\nUses tower_dora_metrics [1].\n## Risks\n| Risk |\n| --- |\n| x |",
      openItems: [],
    });
    expect(r.pass).toBe(false);
    expect(r.errors.join(" ")).toMatch(/Internal source tags/);
  });

  it("FAILS when a required section is missing", () => {
    const r = validateDeliverableQuality({
      ...base,
      bodyMarkdown: "## Executive Summary\nClean text [1].",
    });
    expect(r.pass).toBe(false);
    expect(r.errors.join(" ")).toMatch(/Missing required sections/);
  });

  it("FAILS when evidence gaps exist but no client-to-complete items", () => {
    const r = validateDeliverableQuality({
      ...base,
      bodyMarkdown:
        "## Executive Summary\nClean [1].\n## Risks\n| Risk |\n| --- |\n| x |",
      openItems: ["Value baseline missing"],
    });
    expect(r.pass).toBe(false);
    expect(r.errors.join(" ")).toMatch(/client-to-complete/);
  });

  it("PASSES a clean, structured, cited, placeholder-bearing doc", () => {
    const r = validateDeliverableQuality({
      ...base,
      bodyMarkdown:
        "## Executive Summary\nDelivery baseline is strong [1]. [CLIENT TO CONFIRM: value target].\n## Risks\n| Risk | Severity |\n| --- | --- |\n| Data maturity | High |",
      openItems: ["Value baseline"],
    });
    expect(r.pass).toBe(true);
    expect(r.qualityScore).toBeGreaterThanOrEqual(80);
  });
});

import { resolveArtifactBrief, expertRoleLine } from "../artifact-briefs";

describe("artifact intelligence briefs — per use case, expert latitude", () => {
  it("AI-PDLC charter brief carries AI-PDLC exhibits + expert latitude", () => {
    const b = resolveArtifactBrief({
      archetypeId: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
      deliverableType: "program_charter",
    });
    expect(b.module).toBe("moves");
    expect(b.expectedExhibits.join(" ")).toMatch(/DORA/i);
    expect(b.allowedExpertKnowledge.length).toBeGreaterThan(3);
    expect(expertRoleLine(b.archetypeId)).toMatch(/senior|partner|expert/i);
  });
  it("AMS sourcing brief differs by use case (vendor/SLA exhibits)", () => {
    const b = resolveArtifactBrief({
      archetypeId: "IT_SOURCING_EVENT",
      deliverableType: "rfp_package",
    });
    expect(b.module).toBe("source");
    expect(b.expectedExhibits.join(" ")).toMatch(/vendor|SLA/i);
    expect(b.label).toMatch(/RFP/i);
  });
  it("unknown archetype falls back without throwing", () => {
    const b = resolveArtifactBrief({
      archetypeId: "UNKNOWN_X",
      deliverableType: "business_case",
    });
    expect(b.expectedExhibits.length).toBeGreaterThan(0);
    expect(b.label).toMatch(/Business Case/i);
  });
});
