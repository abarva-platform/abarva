/**
 * Where a declared archetype's key evidence families actually land.
 *
 * `composeBrief` enriches sections with the archetype pack's
 * `keyEvidenceFamilies`. Until `archetypeEvidenceSectionKeys` existed it chose
 * those sections by SPELLING — a key had to contain current_state, baseline,
 * signal, findings or environment. Eight of the 21 shipped structures have no
 * such key, so a Move with a perfectly good declared archetype contributed no
 * evidence grounding to them at all, and nothing said so. Four of the eight
 * declare no families on any section of their own either, so they were going
 * to the model with none.
 *
 * These cases pin the landing sites per section, not per structure: a
 * container-wide "the families are in here somewhere" assertion is satisfied
 * by whichever section the inferred rule happened to match.
 */
import { getArtifactBrief } from "../artifact-brief-registry";
import { DELIVERABLE_STRUCTURES } from "../briefs/deliverable-structures";
import { getArchetypePack } from "../briefs/archetype-packs";
import type { DeliverableIntelligenceRequest } from "../types";

const ARCHETYPE = "AMS_IT_OUTSOURCING";
const PACK_FAMILIES = getArchetypePack(ARCHETYPE)!.keyEvidenceFamilies;

function brief(deliverableType: string) {
  return getArtifactBrief({
    module: "moves",
    deliverableType,
    useCaseArchetype: ARCHETYPE,
    audience: "executive",
    decisionContext: "whether to proceed",
  } as unknown as DeliverableIntelligenceRequest);
}

function familiesOf(deliverableType: string, sectionKey: string): string[] {
  const section = brief(deliverableType).recommendedStructure.find(
    (s) => s.key === sectionKey,
  );
  if (!section) throw new Error(`no section ${deliverableType}/${sectionKey}`);
  return section.expectedEvidenceFamilies;
}

function structureFor(deliverableType: string) {
  const s = DELIVERABLE_STRUCTURES.find(
    (d) => d.module === "moves" && d.deliverableType === deliverableType,
  );
  if (!s) throw new Error(`no structure ${deliverableType}`);
  return s;
}

// The pack contributes nine families; asserting on all of them (not "at least
// one") is what catches a partial spread.
const expectAllPackFamilies = (families: string[]) => {
  for (const f of PACK_FAMILIES) expect(families).toContain(f);
};

describe("a declared archetype's evidence families reach the declared sections", () => {
  // Each pair below had ZERO landing sites before `archetypeEvidenceSectionKeys`.
  const CASES: Array<[string, string[]]> = [
    ["root_cause_worksheet", ["symptom_cause_table", "root_cause_tree"]],
    [
      "solution_design",
      ["journey_workflow", "solution_components", "controls_operability"],
    ],
    ["operating_model", ["work_split_controls", "roles_cadence"]],
    ["sourcing_strategy", ["scope_options", "delivery_risks"]],
    [
      "readiness_and_change_plan",
      ["stakeholders_decision_rights", "dependencies_risks"],
    ],
  ];

  it.each(CASES)("%s carries them on each declared section", (type, keys) => {
    for (const key of keys) expectAllPackFamilies(familiesOf(type, key));
  });

  it.each(CASES)(
    "%s leaves its judgment sections alone",
    (type, declaredKeys) => {
      const structure = structureFor(type);
      const untouched = structure.sections
        .map((s) => s.key)
        .filter(
          (k) =>
            !declaredKeys.includes(k) &&
            !/current_state|baseline|signal|findings|environment/.test(k),
        );
      // Guards the declaration against being read as "enrich everything": the
      // recommendation and executive-verdict sections are judgment over the
      // evidence, not assertions of client fact.
      expect(untouched.length).toBeGreaterThan(0);
      for (const key of untouched) {
        const families = familiesOf(type, key);
        for (const f of PACK_FAMILIES) expect(families).not.toContain(f);
      }
    },
  );

  it("keeps the inferred landing site for a structure that declares none", () => {
    // business_case declares no archetypeEvidenceSectionKeys and relies on the
    // spelling rule. Removing that rule must not silently empty it.
    expect(structureFor("business_case").archetypeEvidenceSectionKeys).toBeUndefined();
    expectAllPackFamilies(familiesOf("business_case", "current_state"));
  });

  it("adds nothing when the archetype resolves to no pack", () => {
    const section = getArtifactBrief({
      module: "moves",
      deliverableType: "solution_design",
      useCaseArchetype: "NOT_A_REAL_ARCHETYPE",
      audience: "executive",
      decisionContext: "whether to proceed",
    } as unknown as DeliverableIntelligenceRequest).recommendedStructure.find(
      (s) => s.key === "solution_components",
    )!;
    expect(section.expectedEvidenceFamilies).toEqual([]);
  });
});

describe("the declaration itself", () => {
  it("only names section keys the structure actually declares", () => {
    // A key with no section is silent today — it enriches nothing and nothing
    // reports it. This is the gate that makes a typo fail instead.
    const offenders: string[] = [];
    for (const structure of DELIVERABLE_STRUCTURES) {
      const own = new Set(structure.sections.map((s) => s.key));
      for (const key of structure.archetypeEvidenceSectionKeys ?? [])
        if (!own.has(key))
          offenders.push(`${structure.module}/${structure.deliverableType}:${key}`);
    }
    expect(offenders).toEqual([]);
  });

  it("names no section twice", () => {
    for (const structure of DELIVERABLE_STRUCTURES) {
      const declared = structure.archetypeEvidenceSectionKeys ?? [];
      expect(declared).toHaveLength(new Set(declared).size);
    }
  });
});
