/**
 * The P5 Value Measurement Contract's declared structure.
 *
 * This deliverable is a `gateArtifact` whose sign-off a P5 hard-gate criterion
 * reads, and until this structure existed it was the only non-guide
 * client-facing phase deliverable with no declared structure — so
 * `composeBrief` returned null for it and the generic board brief was used,
 * resolving no archetype pack at all.
 *
 * The sibling guard (`moves-phase-deliverable-archetype-reach`) holds it to
 * the pack now that the structure exists. This suite pins the properties of
 * the structure ITSELF that would otherwise break silently:
 *
 *  - the declared evidence landing sites are load-bearing, because NONE of
 *    this structure's section keys is spelled the way `composeBrief`'s
 *    inferred rule matches;
 *  - its own phase-discipline list cannot delete one of its own sections;
 *  - its tables cannot collide with the pack's and lose the pack's copy;
 *  - it still satisfies its own quality profile and still mirrors the section
 *    spine the deliverable registry declares.
 *
 * Expectations are written out as literals rather than read off the structure
 * under test: an expectation derived from the declaration it checks cannot see
 * a rename.
 */
import { amsRfpRequest } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { GOVERNED_DATA_FOUNDATION_PACK } from "@/lib/deliverables/orchestrator/briefs/archetype-pack-governed-data-foundation";
import { getDeliverableStructure } from "@/lib/deliverables/orchestrator/briefs/deliverable-structures";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import type { DeliverableIntelligenceRequest } from "@/lib/deliverables/orchestrator/types";
import { getDeliverableSpec } from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";

const TYPE = "value_measurement_contract";
const ARCHETYPE = "governed_data_foundation";

/** Written out, not read from the structure. */
const SECTION_KEYS = [
  "commitment_summary",
  "committed_outcomes",
  "measurement_methodology",
  "accountability",
  "review_cadence",
  "measurement_gaps",
  "revision_conditions",
] as const;

/**
 * The sections that assert client facts, and so the ones the archetype's
 * evidence families must land on. The commitment summary is judgment and the
 * revision route is the client's own governance; neither pulls a use case's
 * baseline evidence.
 */
const EVIDENCE_SECTIONS = [
  "committed_outcomes",
  "measurement_methodology",
  "accountability",
  "review_cadence",
  "measurement_gaps",
] as const;

const TABLE_KEYS = [
  "committed_outcome_register",
  "measurement_method_register",
  "outcome_accountability",
] as const;

/**
 * `composeBrief`'s inferred landing-site rule, copied here deliberately. If
 * that rule is widened to match one of this structure's keys, this copy stops
 * agreeing with it and the "declared sites are load-bearing" case below says
 * so — which is the moment to decide whether the declared list is still needed.
 */
const INFERRED_SITE_RULE = /current_state|baseline|signal|findings|environment/;

function structure() {
  const s = getDeliverableStructure("moves", TYPE);
  if (!s) throw new Error(`no structure for moves::${TYPE}`);
  return s;
}

function brief() {
  const req: DeliverableIntelligenceRequest = {
    ...amsRfpRequest(),
    module: "moves",
    useCaseArchetype: ARCHETYPE,
    deliverableType: TYPE,
  };
  return getArtifactBrief(req);
}

describe("the P5 value measurement contract's declared structure", () => {
  it("is the structure production asks for, under the key production sends", () => {
    // The registry key and the structure key are the same for this
    // deliverable — there is no spelling hop. Pinned because five of its
    // siblings DO hop, and a later rename that introduced one here would make
    // every case below describe a document production never requests.
    expect(orchestratorDeliverableType(TYPE)).toBe(TYPE);
    expect(structure().deliverableType).toBe(TYPE);
    expect(structure().module).toBe("moves");
  });

  it("declares the sections this suite was written against", () => {
    expect(structure().sections.map((s) => s.key)).toEqual([...SECTION_KEYS]);
  });

  it("still mirrors the spine the deliverable registry declares", () => {
    // The registry is the product's own statement of what this document
    // contains. It declares five sections; this structure keeps all five in
    // order and adds two — an executive opener and the measurement-gap
    // section its quality profile requires. A sixth registry section, or one
    // removed, should be a decision here rather than a silent divergence.
    const spec = getDeliverableSpec(TYPE);
    expect(spec?.phase).toBe(5);
    expect(spec?.gateArtifact).toBe(true);
    expect(spec?.sections).toHaveLength(5);
    expect(structure().sections).toHaveLength(7);
  });

  it("satisfies its own quality profile's section floor", () => {
    // The profile for this key is table-led and asks for six sections. A
    // structure that required fewer would be generating documents its own
    // quality bar then fails.
    const bar = resolveQualityBar("moves", TYPE);
    expect(bar.minSections).toBe(6);
    expect(structure().requiredSectionKeys.length).toBeGreaterThanOrEqual(
      bar.minSections,
    );
  });

  describe("the declared evidence landing sites", () => {
    it("are the only route the archetype's evidence has into this document", () => {
      // Not one of this structure's keys is spelled the way `composeBrief`
      // infers a landing site, so dropping `archetypeEvidenceSectionKeys`
      // would take the grounding to zero rather than to a smaller number.
      // This is what makes that field load-bearing here and not decorative.
      for (const key of SECTION_KEYS) {
        expect(INFERRED_SITE_RULE.test(key)).toBe(false);
      }
    });

    it("name sections this structure actually declares", () => {
      const declared = new Set(structure().sections.map((s) => s.key));
      for (const key of structure().archetypeEvidenceSectionKeys ?? []) {
        expect(declared).toContain(key);
      }
      expect(structure().archetypeEvidenceSectionKeys).toEqual([
        ...EVIDENCE_SECTIONS,
      ]);
    });

    it("carry every one of the archetype's evidence families", () => {
      const families = GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies;
      expect(families.length).toBeGreaterThan(0);
      const composed = brief().recommendedStructure;
      for (const key of EVIDENCE_SECTIONS) {
        const section = composed.find((s) => s.key === key);
        expect(section).toBeDefined();
        for (const family of families) {
          expect(section?.expectedEvidenceFamilies).toContain(family);
        }
      }
    });

    it("are the ONLY sections carrying them", () => {
      // The judgment sections must not pull a use case's baseline evidence.
      // Asserted as an exact set, so a landing site added to the executive
      // summary reads as a change rather than as more grounding.
      const families = new Set<string>(
        GOVERNED_DATA_FOUNDATION_PACK.keyEvidenceFamilies,
      );
      const carrying = brief()
        .recommendedStructure.filter((s) =>
          s.expectedEvidenceFamilies.some((f) => families.has(f)),
        )
        .map((s) => s.key);
      expect(carrying.sort()).toEqual([...EVIDENCE_SECTIONS].sort());
    });
  });

  it("cannot delete one of its own sections through phase discipline", () => {
    // `forbiddenSectionTopics` is matched case-insensitively against a
    // section's key and title, and the plan sanitizer DROPS what matches. A
    // forbidden topic that happened to appear in one of this document's own
    // section titles would silently remove that section from every generated
    // copy — including a required one.
    const topics = structure().forbiddenSectionTopics ?? [];
    expect(topics.length).toBeGreaterThan(0);
    for (const topic of topics) {
      const needle = topic.toLowerCase();
      for (const section of structure().sections) {
        expect(section.key.toLowerCase()).not.toContain(needle);
        expect(section.title.toLowerCase()).not.toContain(needle);
      }
    }
  });

  describe("the tables this artifact type is built around", () => {
    it("are declared, and reach the composed brief", () => {
      const carried = new Set(
        (brief().expectedTables ?? []).map((t) => t.key),
      );
      for (const key of TABLE_KEYS) {
        expect(carried).toContain(key);
      }
    });

    it("do not collide with the archetype pack's, which would drop the pack's copy", () => {
      // `composeArtifactAssets` joins structure-first and keeps the FIRST
      // entry per key, so a structure table sharing a key with a pack table
      // silently replaces the pack's definition of it.
      const packKeys = new Set(
        GOVERNED_DATA_FOUNDATION_PACK.tables.map((t) => t.key),
      );
      expect(packKeys.size).toBeGreaterThan(0);
      for (const key of TABLE_KEYS) {
        expect(packKeys).not.toContain(key);
      }
    });
  });

  it("asks the client for the revision route rather than inventing one", () => {
    // The one `client_to_complete` section. A revision/approval route is the
    // client's own governance; composing it as a required placeholder is how
    // the document asks for it instead of asserting a process that does not
    // exist.
    const composed = brief();
    expect(composed.requiredPlaceholders).toContain("revision_conditions");
    expect(composed.requiredClientDecisions).toContain("revision_conditions");
    // And nothing else is a placeholder: a committed baseline or a named
    // owner must come from governed evidence, never from a blank the client
    // fills in at signing.
    expect(composed.requiredPlaceholders).toEqual(["revision_conditions"]);
  });

  it("is a fixed instrument, not an open-ended report", () => {
    expect(structure().fixedStructure).toBe(true);
  });
});
