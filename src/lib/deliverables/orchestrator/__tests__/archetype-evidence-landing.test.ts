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
import {
  archetypeEvidenceLandingReport,
  getArtifactBrief,
} from "../artifact-brief-registry";
import { buildSectionDrivenEvidenceQueries } from "../generate-service";
import { DELIVERABLE_STRUCTURES } from "../briefs/deliverable-structures";
import { ARCHETYPE_PACKS, getArchetypePack } from "../briefs/archetype-packs";
import { getDiscoveryBlueprint } from "../briefs/discovery-blueprint";
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
    // Added later than the rest: this one was classified as deliberately
    // ungrounded rather than as a missed landing site. See the structure.
    [
      "design_workshop_guide",
      ["discovery_carry_forward", "evidence_carry_forward"],
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

// ── The report over the brief that is actually served ──
//
// Everything above reads one (type × section) pair at a time. These cases read
// `archetypeEvidenceLandingReport`, which asks the resolver the same question
// for every shipped deliverable at once. The difference matters: a declaration
// only takes effect for a deliverable that `getArtifactBrief` hands to
// `composeBrief`, and two deliverable types are served by their own builders
// before it is ever reached.

const PROBE_BASE = {
  phaseOrStage: "P2",
  audience: ["executive"],
  decisionContext: "whether to proceed",
  governedEvidenceBundle: [],
  sourceRegister: [],
  missingEvidence: [],
  clientCompleteItems: [],
  approvedAssumptions: [],
  artifactStandard: "abarva-artifact-standard",
  outputFormats: ["docx"],
  formattingProfile: {},
  qualityBar: {},
  clientDisplayName: "Cover Name",
};

const probe = (useCaseArchetype: string) =>
  ({ ...PROBE_BASE, useCaseArchetype }) as unknown as Omit<
    DeliverableIntelligenceRequest,
    "module" | "deliverableType"
  >;

const row = (archetype: string, module: string, deliverableType: string) => {
  const found = archetypeEvidenceLandingReport(probe(archetype)).find(
    (r) => r.module === module && r.deliverableType === deliverableType,
  );
  if (!found) throw new Error(`no row for ${module}/${deliverableType}`);
  return found;
};

const PACK_ARCHETYPES = Object.keys(ARCHETYPE_PACKS);

describe("the archetype evidence landing report", () => {
  it("covers every shipped structure, for every archetype that has a pack", () => {
    expect(PACK_ARCHETYPES.length).toBeGreaterThan(1);
    for (const archetype of PACK_ARCHETYPES)
      expect(archetypeEvidenceLandingReport(probe(archetype))).toHaveLength(
        DELIVERABLE_STRUCTURES.length,
      );
  });

  it("splits a deliverable's fact-asserting sections into grounded and not", () => {
    // solution_design declares three landing sites and marks six sections as
    // asserting client facts, so the row must separate them rather than report
    // a single "has evidence" verdict.
    const r = row(ARCHETYPE, "moves", "solution_design");
    expect(r.factAssertingSectionKeys).toHaveLength(6);
    expect(r.coveredSectionKeys).toEqual([
      "journey_workflow",
      "solution_components",
      "controls_operability",
    ]);
    expect(r.uncoveredSectionKeys).toEqual([
      "exec_decision",
      "acceptance_traceability",
      "recommendation",
    ]);
    expect(r.landsNowhere).toBe(false);
  });

  it("reports a deliverable grounded from another vocabulary as grounded by none of the pack", () => {
    // The discovery plan's own builder grounds `evidence_requests` in the
    // discovery BLUEPRINT's families, whose ids share nothing with the pack's,
    // so the report must read it as carrying none of the pack's — not as
    // covered because it has evidence of some kind.
    const r = row(ARCHETYPE, "moves", "discovery_plan");
    expect(r.coveredSectionKeys).toEqual([]);
    expect(r.uncoveredSectionKeys).toEqual(r.factAssertingSectionKeys);
  });

  it("splits every fact-asserting section into exactly one of the two lists", () => {
    // Covered and uncovered partition the fact-asserting sections: a section
    // that appears in neither is one the report has quietly dropped, which is
    // how an undercount would read as good news.
    for (const archetype of PACK_ARCHETYPES)
      for (const r of archetypeEvidenceLandingReport(probe(archetype))) {
        expect(
          [...r.coveredSectionKeys, ...r.uncoveredSectionKeys].sort(),
        ).toEqual([...r.factAssertingSectionKeys].sort());
        expect(
          r.coveredSectionKeys.filter((k) =>
            r.uncoveredSectionKeys.includes(k),
          ),
        ).toEqual([]);
      }
  });

  it("never carries the archetype's assets into a deliverable it grounds nowhere", () => {
    // The silent state #9067 found, stated in the one direction that IS a
    // defect: the pack's exhibits and tables arrive while none of its families
    // reach a section, so the deliverable looks archetype-shaped and asserts
    // client facts from nothing. A new structure whose section keys match
    // nothing would land back in it. Holds for every archetype without
    // exception, including one whose pack shares ids with its blueprint.
    const offenders: string[] = [];
    for (const archetype of PACK_ARCHETYPES)
      for (const r of archetypeEvidenceLandingReport(probe(archetype)))
        if (r.landsNowhere && !r.archetypeAssetsWithheld)
          offenders.push(`${archetype} ${r.module}/${r.deliverableType}`);
    expect(offenders).toEqual([]);
  });

  it("grounds without the assets only where that is the stated shape", () => {
    // The other direction — grounded sections, no pack assets — is legitimate
    // in exactly two shapes, and both are a decision somewhere in the source
    // rather than an accident:
    //
    //  1. moves/discovery_plan. `getArtifactBrief` sends it to its own builder,
    //     which grounds `evidence_requests` from the discovery BLUEPRINT and
    //     picks its own assets. That reads as grounded-by-the-pack only for an
    //     archetype whose pack NAMES the blueprint's family ids, which is a
    //     product decision one archetype has taken (see the pack header).
    //
    //  2. The three facilitation guides with a structure — the P2 design
    //     workshop guide, the P4 mobilization workshop guide and the P5
    //     execution kickoff guide — for EVERY archetype. `composeBrief`
    //     withholds the pack's exhibits and tables from each by name
    //     (`withholdsArchetypeAssets`, archetype-asset-withholding.ts) because
    //     a session plan is not a deck — while each one's carry-forward and
    //     evidence sections do assert client facts out of accepted evidence and
    //     so declare landing sites. The two questions are independent, and
    //     these rows are what that looks like. The P3 planning workshop guide
    //     is absent because it has no structure at all and so never reaches
    //     `composeBrief`.
    //
    // Written out per archetype rather than filtered, so a composed brief
    // silently losing its assets cannot hide here.
    const groundedWithoutAssets: string[] = [];
    for (const archetype of PACK_ARCHETYPES)
      for (const r of archetypeEvidenceLandingReport(probe(archetype)))
        if (!r.landsNowhere && r.archetypeAssetsWithheld)
          groundedWithoutAssets.push(
            `${archetype} ${r.module}/${r.deliverableType}`,
          );
    expect(groundedWithoutAssets).toEqual([
      "AMS_IT_OUTSOURCING moves/design_workshop_guide",
      "AMS_IT_OUTSOURCING moves/mobilization_workshop_guide",
      "AMS_IT_OUTSOURCING moves/execution_kickoff_guide",
      "ERP_SI_SELECTION moves/design_workshop_guide",
      "ERP_SI_SELECTION moves/mobilization_workshop_guide",
      "ERP_SI_SELECTION moves/execution_kickoff_guide",
      "CLOUD_MODERNIZATION moves/design_workshop_guide",
      "CLOUD_MODERNIZATION moves/mobilization_workshop_guide",
      "CLOUD_MODERNIZATION moves/execution_kickoff_guide",
      "AI_PDLC moves/design_workshop_guide",
      "AI_PDLC moves/mobilization_workshop_guide",
      "AI_PDLC moves/execution_kickoff_guide",
      "ANALYTICS_CAPABILITY_REPATRIATION moves/design_workshop_guide",
      "ANALYTICS_CAPABILITY_REPATRIATION moves/mobilization_workshop_guide",
      "ANALYTICS_CAPABILITY_REPATRIATION moves/execution_kickoff_guide",
      "GOVERNED_DATA_FOUNDATION moves/discovery_plan",
      "GOVERNED_DATA_FOUNDATION moves/design_workshop_guide",
      "GOVERNED_DATA_FOUNDATION moves/mobilization_workshop_guide",
      "GOVERNED_DATA_FOUNDATION moves/execution_kickoff_guide",
    ]);
  });

  it("names the deliverables an archetype deliberately does not ground", () => {
    for (const archetype of PACK_ARCHETYPES) {
      const nowhere = archetypeEvidenceLandingReport(probe(archetype))
        .filter((r) => r.landsNowhere)
        .map((r) => `${r.module}/${r.deliverableType}`);
      // Only two shapes belong here, and the charter is the only one that is
      // deliberate for its own sake: it authorizes discovery and its sections
      // instruct the model not to assert P2 findings, so the archetype's
      // families would only widen its retrieval. The discovery plan is here
      // because it is grounded by the discovery BLUEPRINT instead, from its
      // own builder. Anything else appearing here is an archetype reaching a
      // client-fact section with nothing.
      //
      // The design workshop guide used to sit on this list as "a facilitation
      // template". That lumped it with the charter, and the two are opposites:
      // the guide's purpose line is "using accepted discovery evidence" and
      // two of its sections exist to enumerate that evidence. It now declares
      // those two as landing sites and so is absent here. Withholding the
      // pack's EXHIBITS from a facilitation document is still right and still
      // holds; it is the case above.
      //
      // The discovery plan drops off this list for the one archetype whose
      // pack names the blueprint's own family ids: its evidence_requests
      // section genuinely carries all eleven, so reporting it as grounded
      // nowhere would be false. Written out per archetype rather than
      // filtered, so a NEW archetype cannot join the shared-id case silently.
      expect(nowhere).toEqual(
        archetype === "GOVERNED_DATA_FOUNDATION"
          ? ["moves/charter"]
          : ["moves/charter", "moves/discovery_plan"],
      );
    }
  });

  it("grounds the discovery plan from the discovery blueprint, not the artifact pack", () => {
    // `getArtifactBrief` sends moves/discovery_plan to its own builder before
    // `composeBrief`, so `archetypeEvidenceSectionKeys` on that structure would
    // be inert. Recorded here so the next change does not declare one and
    // believe it took effect.
    const blueprintFamilies = getDiscoveryBlueprint(
      ARCHETYPE,
    ).evidenceFamilies.map((f) => f.id);
    const families = familiesOf("discovery_plan", "evidence_requests");
    expect(families).toEqual(blueprintFamilies);
    for (const f of PACK_FAMILIES) expect(families).not.toContain(f);
  });

  it("an archetype contributes its families and its assets all or not at all", () => {
    // Why the report can call a section grounded with one containment test: a
    // section that carries any of the pack's families carries all of them, and
    // a brief that carries any of its assets carries all of them. Both halves
    // are written from the pack in one go. If a partial contribution ever
    // becomes possible, the report's reading of "grounded" and of "assets
    // withheld" both need revisiting, and this is the case that says so.
    const partialFamilies: string[] = [];
    const partialAssets: string[] = [];
    let fullFamilies = 0;
    let fullAssets = 0;
    for (const archetype of PACK_ARCHETYPES) {
      const pack = getArchetypePack(archetype)!;
      const assetKeys = [
        ...pack.exhibits.map((e) => e.key),
        ...pack.tables.map((t) => t.key),
      ];
      for (const structure of DELIVERABLE_STRUCTURES) {
        const where = `${archetype} ${structure.module}/${structure.deliverableType}`;
        const served = getArtifactBrief({
          ...PROBE_BASE,
          useCaseArchetype: archetype,
          module: structure.module,
          deliverableType: structure.deliverableType,
        } as unknown as DeliverableIntelligenceRequest);
        for (const section of served.recommendedStructure) {
          const held = pack.keyEvidenceFamilies.filter((f) =>
            section.expectedEvidenceFamilies.includes(f),
          ).length;
          if (held === 0) continue;
          if (held === pack.keyEvidenceFamilies.length) fullFamilies += 1;
          else partialFamilies.push(`${where}:${section.key} ${held}`);
        }
        const servedKeys = [
          ...served.expectedExhibits,
          ...served.expectedTables,
        ].map((a) => a.key);
        const heldAssets = assetKeys.filter((k) =>
          servedKeys.includes(k),
        ).length;
        if (heldAssets === 0) continue;
        if (heldAssets === assetKeys.length) fullAssets += 1;
        else
          partialAssets.push(`${where} ${heldAssets} of ${assetKeys.length}`);
      }
    }
    expect(partialFamilies).toEqual([]);
    expect(partialAssets).toEqual([]);
    // Non-vacuous: the all-or-nothing claim is made about cases that occur.
    expect(fullFamilies).toBeGreaterThan(0);
    expect(fullAssets).toBeGreaterThan(0);
  });

  it("reports no landing at all for an archetype that resolves to no pack", () => {
    // With no pack there are no families to land, so every row reads
    // `landsNowhere`. Pinned so the vacuous case is declared rather than read
    // as 21 defects.
    const rows = archetypeEvidenceLandingReport(probe("NOT_A_REAL_ARCHETYPE"));
    expect(rows.filter((r) => r.landsNowhere)).toHaveLength(rows.length);
    expect(rows.flatMap((r) => r.coveredSectionKeys)).toEqual([]);
  });

  it("records the deliverables whose client-fact sections are still mostly ungrounded", () => {
    // The remaining half of the gap, as a list and not a count: these ship with
    // exactly ONE landing site — the one the spelling rule finds — while
    // marking two to seven sections as asserting client facts. Declaring a
    // landing site on any of them must shorten this list, which is why it is
    // pinned by name.
    const stillOne = archetypeEvidenceLandingReport(probe(ARCHETYPE))
      .filter((r) => r.coveredSectionKeys.length === 1)
      .map(
        (r) =>
          `${r.module}/${r.deliverableType} ${r.coveredSectionKeys.length} of ${r.factAssertingSectionKeys.length}`,
      );
    expect(stillOne).toEqual([
      "moves/business_case 1 of 6",
      "moves/roadmap 1 of 7",
      "moves/target_state_architecture 1 of 7",
      "moves/estimate_model 1 of 6",
      "moves/mobilization_plan 1 of 6",
      "moves/handoff_pack 1 of 7",
      "moves/executive_playback 1 of 6",
      "source/sourcing_strategy_memo 1 of 7",
      "source/evaluation_workbook 1 of 2",
      "source/executive_recommendation 1 of 6",
    ]);
  });
});

describe("the landing sites declared for a deliverable that already had one", () => {
  // Unlike the five in the first block, each of these already had an inferred
  // landing site and still left the rest of its client-fact sections
  // ungrounded. The declaration is additive on top of the spelling rule.
  const CASES: Array<[string, string[]]> = [
    ["discovery_report", ["maturity_gaps"]],
    ["requirements_traceability", ["evidence_design_trace", "gaps_controls"]],
    ["value_model", ["value_pools"]],
  ];

  it.each(CASES)("%s carries them on each declared section", (type, keys) => {
    for (const key of keys) expectAllPackFamilies(familiesOf(type, key));
  });

  it.each(CASES)("%s keeps its inferred landing site too", (type) => {
    const inferred = structureFor(type)
      .sections.map((s) => s.key)
      .filter((k) =>
        /current_state|baseline|signal|findings|environment/.test(k),
      );
    expect(inferred).toHaveLength(1);
    expectAllPackFamilies(familiesOf(type, inferred[0]));
  });

  it.each(CASES)(
    "%s leaves its judgment sections alone",
    (type, declaredKeys) => {
      const untouched = structureFor(type)
        .sections.map((s) => s.key)
        .filter(
          (k) =>
            !declaredKeys.includes(k) &&
            !/current_state|baseline|signal|findings|environment/.test(k),
        );
      expect(untouched.length).toBeGreaterThan(0);
      for (const key of untouched) {
        const families = familiesOf(type, key);
        for (const f of PACK_FAMILIES) expect(families).not.toContain(f);
      }
    },
  );
});

// ── The declaration has to reach the retriever, not just the brief ──
//
// A landing site is only worth declaring because a section's families are one
// of the inputs `buildSectionDrivenEvidenceQueries` builds that section's
// retrieval query from. Asserting on the brief alone would pass on a change
// that stopped feeding families to the retriever at all, which is the whole
// point of them: the approved P2 evidence is filed under the archetype's
// family ids, so a query that does not name them asks the corpus for
// `source_register` / `evidence_gaps` / `baseline_metrics` instead and comes
// back with a plausible answer that cites none of the Move's evidence.
describe("the design workshop guide's retrieval reaches the archetype's evidence", () => {
  const GDF = "governed_data_foundation";
  // Written out rather than mapped off the pack, so a renamed or dropped
  // family in the pack fails here instead of quietly changing what is asserted.
  const GDF_FAMILIES = [
    "data_governance_ownership",
    "semantic_layer_certification",
    "data_lineage_audit_trail",
    "data_quality_rules",
    "source_system_data_access",
    "platform_architecture_readiness",
    "master_identity_resolution",
    "privacy_security_controls",
    "model_risk_responsible_ai_controls",
    "measurement_owner_cadence",
    "finance_baseline_value_plan",
  ];

  const briefFor = (archetype: string, deliverableType: string) =>
    getArtifactBrief({
      module: "moves",
      deliverableType,
      useCaseArchetype: archetype,
      audience: "executive",
      decisionContext: "whether to proceed",
    } as unknown as DeliverableIntelligenceRequest);

  const queriesFor = (archetype: string, deliverableType: string) =>
    buildSectionDrivenEvidenceQueries(
      { deliverableType, useCaseArchetype: archetype },
      briefFor(archetype, deliverableType),
    );

  it("names every one of the declared archetype's families in its searches", () => {
    const queries = queriesFor(GDF, "design_workshop_guide").join("\n");
    for (const family of GDF_FAMILIES) expect(queries).toContain(family);
  });

  it("keeps the guide's own generic families alongside them", () => {
    // The enrichment is additive. A section losing `source_register` while
    // gaining eleven archetype families would read as a success above.
    const families = familiesOf("design_workshop_guide", "evidence_carry_forward");
    for (const own of [
      "source_register",
      "evidence_gaps",
      "baseline_metrics",
      "technology_landscape",
    ])
      expect(families).toContain(own);
  });

  it("leaves the guide's logistics and gate sections out of the retrieval widening", () => {
    // `design_session_plan` plans sessions and `design_gate_readiness` states
    // what is still missing. Neither enumerates accepted evidence, so neither
    // should pull eleven families of it. Asserted on the SECTION's families
    // rather than the joined query, because the archetype id is in every
    // query's prefix and would make a substring check on the query pass
    // trivially for the wrong reason.
    for (const key of ["design_session_plan", "design_gate_readiness"]) {
      const families = familiesOf("design_workshop_guide", key);
      for (const family of GDF_FAMILIES) expect(families).not.toContain(family);
    }
  });

  it("does not widen the charter's searches the same way", () => {
    // The contrast that makes the guide's case a decision rather than a sweep.
    // The charter's sections instruct the model not to assert P2 findings, so
    // it stays ungrounded by the pack — and its retrieval stays narrow with it.
    const queries = queriesFor(GDF, "charter").join("\n");
    for (const family of GDF_FAMILIES) expect(queries).not.toContain(family);
  });

  it("still withholds the archetype's exhibits and tables from the guide", () => {
    // Grounding and asset-carrying are separate decisions; this one is
    // unchanged. A facilitation document does not carry a deck's exhibits.
    const served = briefFor(GDF, "design_workshop_guide");
    const packAssetKeys = [
      ...getArchetypePack(GDF)!.exhibits.map((e) => e.key),
      ...getArchetypePack(GDF)!.tables.map((t) => t.key),
    ];
    expect(packAssetKeys.length).toBeGreaterThan(0);
    const servedKeys = [
      ...served.expectedExhibits,
      ...served.expectedTables,
    ].map((a) => a.key);
    for (const key of packAssetKeys) expect(servedKeys).not.toContain(key);
  });
});
