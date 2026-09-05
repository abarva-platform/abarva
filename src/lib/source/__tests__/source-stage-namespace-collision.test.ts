import {
  PAT_SRC_AMS_001,
  PAT_SRC_DECOM_001,
  PAT_SRC_FRAMEWORK_001,
  PAT_SRC_RENEWAL_001,
  PAT_SRC_RFP_001,
  PAT_SRC_SOLE_001,
} from "@/lib/intelligence/source-lifecycle-patterns";
import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from "../constants";

/**
 * Two Source stage vocabularies exist and both are legitimate.
 *
 *  - The product's sourcing-event stage machine (SOURCE_STAGE_ORDER).
 *  - Industry lifecycle patterns, where each sourcing archetype declares its
 *    own stages (AMS runs Plan -> ... -> Award -> Onboard; a framework call-off
 *    runs Mini-Tender). These are corpus knowledge, not the product's stages.
 *
 * They are not interchangeable, and a handful of words appear in both meaning
 * different things. An answer that mixes them reads as coherent precisely
 * because of that overlap, which is what makes the confusion dangerous rather
 * than obvious.
 *
 * This guard does not force the vocabularies to converge — that would destroy
 * the corpus semantics. It pins the overlap so a NEW collision has to be an
 * explicit decision rather than an accident.
 */
const PATTERNS = [
  PAT_SRC_AMS_001,
  PAT_SRC_RFP_001,
  PAT_SRC_SOLE_001,
  PAT_SRC_FRAMEWORK_001,
  PAT_SRC_RENEWAL_001,
  PAT_SRC_DECOM_001,
];

/** Words that legitimately exist in both namespaces today. */
const KNOWN_SHARED_WORDS = ["BAFO", "Evaluation", "RFP", "Selection"] as const;

function productStageLabels(): Set<string> {
  return new Set(SOURCE_STAGE_ORDER.map((key) => SOURCE_STAGE_LABELS[key]));
}

function patternStageLabels(): Set<string> {
  const out = new Set<string>();
  for (const pattern of PATTERNS) {
    for (const stage of pattern.stages ?? []) {
      out.add(stage.label);
      out.add(String(stage.id));
    }
  }
  return out;
}

describe("Source stage namespaces stay distinguishable", () => {
  it("keeps the overlap between product stages and pattern stages to the known set", () => {
    const product = productStageLabels();
    const shared = [...patternStageLabels()].filter((label) =>
      product.has(label),
    );
    expect([...shared].sort()).toEqual([...KNOWN_SHARED_WORDS].sort());
  });

  it("still has pattern stages that are not product stages", () => {
    // If this ever emptied out, the two vocabularies would have merged and the
    // guard above would be trivially satisfied while meaning nothing.
    const product = productStageLabels();
    const patternOnly = [...patternStageLabels()].filter(
      (label) => !product.has(label),
    );
    expect(patternOnly.length).toBeGreaterThan(10);
  });

  it("keeps every product stage reachable from the canonical order", () => {
    for (const key of SOURCE_STAGE_ORDER) {
      expect([key, typeof SOURCE_STAGE_LABELS[key]]).toEqual([key, "string"]);
    }
  });
});
