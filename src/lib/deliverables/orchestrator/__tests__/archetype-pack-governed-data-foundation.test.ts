/**
 * The governed-data-foundation archetype has a pack, and the pack asks for the
 * evidence its blueprint actually collects.
 *
 * The defect these cases close: the archetype was declared in the discovery
 * blueprint catalog and NOT in the artifact pack catalog. `composeBrief` falls
 * through to a generic one-row risk register when `getArchetypePack` answers
 * nothing, so a Move declaring this archetype collected eleven required
 * families of discovery evidence through P2 and then produced P3/P4/P5
 * deliverables that grounded none of it and carried none of its exhibits —
 * measured as 21 of 21 shipped deliverable structures, in both directions.
 */
import { archetypeEvidenceLandingReport } from "../artifact-brief-registry";
import {
  ArchetypePackSchema,
  getArchetypePack,
  validateBuiltInArchetypePackCatalog,
} from "../briefs/archetype-packs";
import { GOVERNED_DATA_FOUNDATION_PACK } from "../briefs/archetype-pack-governed-data-foundation";
import { getDiscoveryBlueprint } from "../briefs/discovery-blueprint";

const DECLARED = "governed_data_foundation";

const requiredBlueprintFamilies = () =>
  getDiscoveryBlueprint("", DECLARED)
    .evidenceFamilies.filter((family) => family.required)
    .map((family) => family.id);

const report = () =>
  archetypeEvidenceLandingReport({
    useCaseArchetype: DECLARED,
    audience: "executive",
    decisionContext: "whether to proceed",
  } as never);

describe("the governed-data-foundation artifact pack", () => {
  it("resolves off the id the Move declares, not the id the catalog is keyed by", () => {
    // The pack catalog is keyed UPPER_SNAKE and a Move declares lower_snake.
    // Asserting on the declared spelling is the only version of this case that
    // would have failed before `archetype-identity.ts` existed.
    expect(getArchetypePack(DECLARED)).toBe(GOVERNED_DATA_FOUNDATION_PACK);
    expect(getArchetypePack("GOVERNED_DATA_FOUNDATION")).toBe(
      GOVERNED_DATA_FOUNDATION_PACK,
    );
  });

  it("asks for exactly the families the gate requires, written out", () => {
    // Both directions, as a list. A length check passes on eleven wrong ids,
    // and a subset check passes on a pack that quietly drops one — and a
    // dropped family is a section grounded against nothing, since
    // `composeBrief` writes the pack's whole set onto a landing site.
    expect([...GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies].sort()).toEqual(
      [
        "data_governance_ownership",
        "data_lineage_audit_trail",
        "data_quality_rules",
        "finance_baseline_value_plan",
        "master_identity_resolution",
        "measurement_owner_cadence",
        "model_risk_responsible_ai_controls",
        "platform_architecture_readiness",
        "privacy_security_controls",
        "semantic_layer_certification",
        "source_system_data_access",
      ],
    );
    expect([...GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies].sort()).toEqual(
      [...requiredBlueprintFamilies()].sort(),
    );
  });

  it("leaves the blueprint's optional family out of the retrieval ask", () => {
    // `keyEvidenceFamilies` becomes the TEXT of a retrieval query. Naming a
    // family the P2 gate never requires asks the corpus for evidence a
    // compliant Move was never asked to supply, and the answer comes back
    // plausible.
    const optional = getDiscoveryBlueprint("", DECLARED)
      .evidenceFamilies.filter((family) => !family.required)
      .map((family) => family.id);
    expect(optional).toEqual(["change_adoption_owner"]);
    for (const id of optional)
      expect(GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies).not.toContain(
        id,
      );
  });

  it("passes the pack contract the config loader validates configured packs by", () => {
    // The built-in catalog and a configured one are held to one contract, so
    // a shipped pack that would be rejected as config is a contract that only
    // outsiders have to keep.
    expect(
      ArchetypePackSchema.safeParse(GOVERNED_DATA_FOUNDATION_PACK).success,
    ).toBe(true);
    expect(validateBuiltInArchetypePackCatalog()).toEqual([]);
  });

  it("carries no declaresEvidenceFamilies escape hatch", () => {
    // That field is for a configured archetype bringing families the shipped
    // vocabulary does not declare. A built-in pack using it would pass the
    // schema while leaving its families undocumented in the vocabulary that
    // gives them labels.
    expect(
      GOVERNED_DATA_FOUNDATION_PACK.declaresEvidenceFamilies,
    ).toBeUndefined();
  });

  it("lands the archetype's evidence in all but the charter, which withholds it", () => {
    // The measured before/after. Every number here was 21 before the pack
    // existed. The charter grounds nothing on purpose: its own sections
    // instruct the model not to assert P2 findings, so the archetype's
    // families would only widen its retrieval.
    //
    // The design workshop guide was on this list too, on the reasoning that it
    // is "a facilitation template". That conflated two separate questions and
    // the guide is the opposite case from the charter: its purpose line is
    // "using accepted discovery evidence", and two of its sections exist to
    // enumerate that evidence. It now declares those two as landing sites, so
    // it grounds — while `composeBrief` still withholds the pack's EXHIBITS
    // and TABLES from it by name, which is the second list below and is the
    // part of "facilitation template" that was right.
    const rows = report();
    expect(rows).toHaveLength(22);
    expect(
      rows.filter((r) => r.landsNowhere).map((r) => r.deliverableType),
    ).toEqual(["charter"]);
    expect(
      rows.filter((r) => r.archetypeAssetsWithheld).map((r) => r.deliverableType),
    ).toEqual(["charter", "discovery_plan", "design_workshop_guide"]);
  });

  it("grounds every fact-asserting section it covers in the whole family set", () => {
    // Not "some of them": a section holding a strict subset is a partial
    // spread, and the report would still call the deliverable grounded.
    const families = GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies;
    for (const row of report())
      for (const key of row.coveredSectionKeys)
        expect(row.factAssertingSectionKeys).toContain(key);
    expect(families.length).toBe(11);
  });

  it("gives the pack exhibits and tables of its own, not another archetype's", () => {
    const other = getArchetypePack("ANALYTICS_CAPABILITY_REPATRIATION")!;
    const otherExhibits = new Set(other.exhibits.map((e) => e.key));
    for (const exhibit of GOVERNED_DATA_FOUNDATION_PACK.exhibits)
      expect(otherExhibits.has(exhibit.key)).toBe(false);
    expect(GOVERNED_DATA_FOUNDATION_PACK.exhibits.length).toBeGreaterThanOrEqual(
      4,
    );
    expect(GOVERNED_DATA_FOUNDATION_PACK.tables.length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("keeps the generic risk register alongside the archetype's own tables", () => {
    // `composeBrief` substitutes a one-row risk register ONLY when there is no
    // pack. A pack that forgot to carry one would drop risks, issues and
    // dependencies out of every deliverable for this archetype.
    expect(
      GOVERNED_DATA_FOUNDATION_PACK.tables.map((table) => table.key),
    ).toContain("risk_register");
  });

  it("states a governance boundary that names what must not be claimed", () => {
    const note = GOVERNED_DATA_FOUNDATION_PACK.governanceNote ?? "";
    expect(note).toMatch(/certified/i);
    expect(note).toMatch(/attested/i);
    // The blueprint's own rule: value is quantified after the baselines sign
    // off, so the boundary has to say so where the model reads it.
    expect(note).toMatch(/do not quantify value before/i);
  });
});
