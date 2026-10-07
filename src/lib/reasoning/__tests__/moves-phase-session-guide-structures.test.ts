/**
 * The two later working-session guides, and the brief they are actually served.
 *
 * A Move's P4 Mobilization Workshop Guide and P5 Execution Kickoff Guide had no
 * declared structure, so `composeBrief` returned null for both and the registry
 * fell through to `defaultBrief` — a twelve-section executive board paper with
 * no per-section length guidance, no `fixedStructure`, no
 * `forbiddenSectionTopics` and no `prohibitedContent`. Each guide's own quality
 * profile says the opposite of that document ("Working guide, not the formal
 * gate artifact"), and the generic brief grounded none of the archetype's
 * evidence families, so a Move could collect and approve its required evidence
 * through Discover and still produce two P4/P5 guides that could not cite any
 * of it.
 *
 * What is pinned here, and why each part is not provable from the sibling suite
 * (`moves-phase-deliverable-archetype-reach`), which pins the structureless SET
 * and the pack join but says nothing about what a structure contains:
 *
 *  - The guides are served their own structure, measured through
 *    `getArtifactBrief` at the key PRODUCTION sends, not read off the catalog.
 *    A resolver that short-circuits before `composeBrief` would make a declared
 *    structure inert with nothing to say so.
 *  - The served brief is phase-disciplined: fixed shape, forbidden topics,
 *    prohibitions. This is the whole difference from the generic fallback, and
 *    it is what the quality profile's acceptance checks need.
 *  - Every section carries a length cap. Twelve uncapped sections are the
 *    plausible cause of the over-length blocks both guides hit on the last live
 *    phase build, so an uncapped section is a regression toward it.
 *  - The archetype's evidence families land on the sections that ENUMERATE
 *    accepted facts, and not on the question set or the readiness checklist,
 *    whose families become a retrieval query for evidence they do not cite.
 *  - The pack's exhibits and tables are withheld, like their P2 precedent.
 *
 * Section keys and titles are written out as literals rather than read off the
 * structures under test: an expectation derived from its own subject cannot see
 * a rename. The spines themselves come from `DELIVERABLE_REGISTRY`, which is
 * checked against here so a registry edit fails once rather than silently
 * leaving a guide shaped around a spine the product no longer declares.
 */
import { amsRfpRequest } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import {
  ARCHETYPE_ASSET_WITHHELD,
  archetypeAssetWithholdingReason,
  withholdsArchetypeAssets,
} from "@/lib/deliverables/orchestrator/briefs/archetype-asset-withholding";
import { GOVERNED_DATA_FOUNDATION_PACK } from "@/lib/deliverables/orchestrator/briefs/archetype-pack-governed-data-foundation";
import { getDeliverableStructure } from "@/lib/deliverables/orchestrator/briefs/deliverable-structures";
import type { DeliverableIntelligenceRequest } from "@/lib/deliverables/orchestrator/types";
import { DELIVERABLE_REGISTRY } from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";

const ARCHETYPE = "governed_data_foundation";

/** The generic fallback's `moves` spine, written out so a fall-through is visible. */
const GENERIC_MOVES_SECTION_KEYS = [
  "exec_summary",
  "decision_required",
  "problem_opportunity",
  "current_state",
  "objectives",
  "scope",
  "value_hypothesis",
  "operating_model",
  "risks",
  "phase_gates",
  "evidence_gaps",
  "recommendation",
] as const;

interface GuideExpectation {
  registryKey: string;
  phase: number;
  /** Sections in declared order. */
  sectionKeys: string[];
  /** The sections whose stated job is to enumerate accepted facts. */
  groundingSectionKeys: string[];
  /** Sections that must NOT carry the archetype's families. */
  ungroundedSectionKeys: string[];
}

const GUIDES: GuideExpectation[] = [
  {
    registryKey: "mobilization_workshop_guide",
    phase: 4,
    sectionKeys: [
      "plan_carry_forward",
      "mobilization_session_plan",
      "mobilization_evidence",
      "facilitation_guide",
      "handoff_gate_readiness",
    ],
    groundingSectionKeys: ["plan_carry_forward", "mobilization_evidence"],
    ungroundedSectionKeys: ["facilitation_guide", "handoff_gate_readiness"],
  },
  {
    registryKey: "execution_kickoff_guide",
    phase: 5,
    sectionKeys: [
      "execution_ready_recap",
      "kickoff_session_plan",
      "execution_evidence_checklist",
      "governance_facilitation",
      "first_review_readiness",
    ],
    groundingSectionKeys: [
      "execution_ready_recap",
      "execution_evidence_checklist",
    ],
    ungroundedSectionKeys: ["governance_facilitation", "first_review_readiness"],
  },
];

function briefForProductionKey(registryKey: string) {
  const req: DeliverableIntelligenceRequest = {
    ...amsRfpRequest(),
    module: "moves",
    deliverableType: orchestratorDeliverableType(registryKey),
    useCaseArchetype: ARCHETYPE,
  };
  return getArtifactBrief(req);
}

describe("the P4 and P5 working-session guides are served their own structure", () => {
  it.each(GUIDES)(
    "$registryKey still declares the five-section spine this suite was written against",
    ({ registryKey, phase }) => {
      // The spine is the registry's, so a registry edit has to fail here rather
      // than leaving the structure shaped around a list the product dropped.
      const spec = DELIVERABLE_REGISTRY.find(
        (entry) => entry.deliverableTypeKey === registryKey,
      );
      expect(spec).toBeDefined();
      expect(spec?.phase).toBe(phase);
      expect(spec?.gateArtifact).toBe(false);
      expect(spec?.sections).toHaveLength(5);
    },
  );

  it.each(GUIDES)(
    "$registryKey resolves a declared structure at the key production sends",
    ({ registryKey }) => {
      const producedType = orchestratorDeliverableType(registryKey);
      expect(getDeliverableStructure("moves", producedType)).toBeDefined();
    },
  );

  it.each(GUIDES)(
    "$registryKey is served its own sections, not the generic board spine",
    ({ registryKey, sectionKeys }) => {
      const served = briefForProductionKey(registryKey).recommendedStructure.map(
        (section) => section.key,
      );
      expect(served).toEqual(sectionKeys);
      // Stated separately: equality above would still pass if the generic spine
      // were ever renamed to these keys, and this is the claim that matters.
      for (const genericKey of GENERIC_MOVES_SECTION_KEYS) {
        if (sectionKeys.includes(genericKey)) continue;
        expect(served).not.toContain(genericKey);
      }
    },
  );

  it.each(GUIDES)(
    "$registryKey is served every one of its sections as required",
    ({ registryKey, sectionKeys }) => {
      const brief = briefForProductionKey(registryKey);
      expect([...brief.requiredSections].sort()).toEqual([...sectionKeys].sort());
      expect(brief.optionalSections).toEqual([]);
    },
  );
});

describe("the served guide brief is phase-disciplined", () => {
  it.each(GUIDES)("$registryKey is served a fixed shape", ({ registryKey }) => {
    expect(briefForProductionKey(registryKey).fixedStructure).toBe(true);
  });

  it.each(GUIDES)(
    "$registryKey is served forbidden topics and prohibitions",
    ({ registryKey }) => {
      const brief = briefForProductionKey(registryKey);
      expect(brief.forbiddenSectionTopics?.length ?? 0).toBeGreaterThan(0);
      expect(brief.prohibitedContent?.length ?? 0).toBeGreaterThan(0);
    },
  );

  it.each(GUIDES)(
    "$registryKey forbids the gate artifacts it prepares sessions about",
    ({ registryKey }) => {
      const forbidden = (
        briefForProductionKey(registryKey).forbiddenSectionTopics ?? []
      ).map((topic) => topic.toLowerCase());
      // Each guide's registry hint names the artifacts it must not become. A
      // guide that may re-tell the roadmap or the business case is the generic
      // board paper again under a different name.
      expect(forbidden).toContain("execution roadmap");
      expect(forbidden).toContain("business case");
    },
  );

  it.each(GUIDES)(
    "$registryKey caps the length of every section it is served",
    ({ registryKey }) => {
      // The generic fallback gives each of its twelve sections the same
      // uncapped latitude sentence. An uncapped section here is a regression
      // toward the over-length build.
      for (const section of briefForProductionKey(registryKey)
        .recommendedStructure) {
        expect(section.expertLatitude).toMatch(/keep under \d+ words/i);
      }
    },
  );
});

describe("the archetype's evidence lands on the sections that enumerate facts", () => {
  const packFamilies = new Set<string>(
    GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies,
  );

  it("the pack still declares families for these cases to land", () => {
    expect(packFamilies.size).toBeGreaterThan(0);
  });

  it.each(GUIDES)(
    "$registryKey grounds its carry-forward and evidence sections",
    ({ registryKey, groundingSectionKeys }) => {
      const served = briefForProductionKey(registryKey).recommendedStructure;
      for (const key of groundingSectionKeys) {
        const section = served.find((entry) => entry.key === key);
        expect(section).toBeDefined();
        const landed = (section?.expectedEvidenceFamilies ?? []).filter(
          (family) => packFamilies.has(family),
        );
        // Every family, not merely one: the section's retrieval query is built
        // from this list, so a partial landing asks for part of the evidence.
        expect(new Set(landed).size).toBe(packFamilies.size);
      }
    },
  );

  it.each(GUIDES)(
    "$registryKey keeps the question set and the readiness check ungrounded",
    ({ registryKey, ungroundedSectionKeys }) => {
      const served = briefForProductionKey(registryKey).recommendedStructure;
      for (const key of ungroundedSectionKeys) {
        const section = served.find((entry) => entry.key === key);
        expect(section).toBeDefined();
        const landed = (section?.expectedEvidenceFamilies ?? []).filter(
          (family) => packFamilies.has(family),
        );
        expect(landed).toEqual([]);
      }
    },
  );
});

describe("archetype assets are withheld from the facilitation guides", () => {
  const packExhibits = GOVERNED_DATA_FOUNDATION_PACK.exhibits.map((e) => e.key);
  const packTables = GOVERNED_DATA_FOUNDATION_PACK.tables.map((t) => t.key);

  it("the withheld set is exactly the four it declares", () => {
    expect(ARCHETYPE_ASSET_WITHHELD.map((entry) => entry.deliverableType)).toEqual(
      [
        "charter",
        "design_workshop_guide",
        "mobilization_workshop_guide",
        "execution_kickoff_guide",
      ],
    );
  });

  it("every withheld type states a reason", () => {
    for (const entry of ARCHETYPE_ASSET_WITHHELD) {
      expect(entry.reason.length).toBeGreaterThan(40);
      expect(archetypeAssetWithholdingReason(entry.deliverableType)).toBe(
        entry.reason,
      );
    }
  });

  it("a type outside the set is not withheld and has no reason", () => {
    expect(withholdsArchetypeAssets("discovery_report")).toBe(false);
    expect(archetypeAssetWithholdingReason("discovery_report")).toBeNull();
  });

  it.each(GUIDES)(
    "$registryKey is served none of the archetype's exhibits or tables",
    ({ registryKey }) => {
      const brief = briefForProductionKey(registryKey);
      const exhibitKeys = (brief.expectedExhibits ?? []).map((e) => e.key);
      const tableKeys = (brief.expectedTables ?? []).map((t) => t.key);
      for (const key of packExhibits) expect(exhibitKeys).not.toContain(key);
      for (const key of packTables) expect(tableKeys).not.toContain(key);
    },
  );

  it("a deliverable outside the withheld set still receives the pack", () => {
    // The complement, so the withholding cannot be read as the join being
    // broken for everyone.
    const brief = briefForProductionKey("discovery_report");
    const exhibitKeys = (brief.expectedExhibits ?? []).map((e) => e.key);
    for (const key of packExhibits) expect(exhibitKeys).toContain(key);
  });
});
