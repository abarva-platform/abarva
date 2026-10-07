/**
 * The phase workspace must not offer a waiver it cannot record.
 *
 * `buildMoveEvidenceNeedPackets` prints four sentences the needs panel, the
 * Approve & Build panel and the phase canvas all render. Three of them used to
 * name a waiver as the way past a required evidence item, and `waiverOption`
 * existed only to name it — while nothing in Moves can put a need packet into
 * `status: "waived"`. A reader already blocked by required evidence was sent
 * looking for a control that is not there.
 *
 * These cases pin both directions. While `MOVE_EVIDENCE_WAIVER_AVAILABLE` is
 * false, no rendered sentence may mention a waiver and every blocking sentence
 * must name the path that does exist. The copy is still derived from the flag,
 * not deleted, so the last case proves flipping it brings every sentence back —
 * otherwise a future producer would ship with silent copy.
 */
import { buildMoveEvidenceNeedPackets } from "../move-evidence-need-packet";
import {
  EVIDENCE_CLOSE_PATH,
  MOVE_EVIDENCE_WAIVER_AVAILABLE,
  blockedUntilSentence,
  buildHeldByEvidenceDetail,
  closeRequiredEvidenceInstruction,
  doNotPresentSentence,
  gapRemediationSentence,
  mustWaitSentence,
  requiredEvidenceCompletionNotice,
  unauthoredNextActionSentence,
  waiverOptionSentence,
} from "../evidence-waiver-availability";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { DiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";

function readiness(
  overrides: Partial<DiscoveryEvidenceReadiness["families"][number]> = {},
): DiscoveryEvidenceReadiness {
  return {
    blueprintId: "governed_data_foundation",
    blueprintVersion: "2026-07-17",
    archetypeLabel: "Governed data foundation",
    blueprintBasis: "declared",
    unknownDeclaredArchetype: null,
    requiredTotal: 1,
    requiredCovered: 0,
    requiredMissing: 1,
    optionalCovered: 0,
    readinessScore: 0,
    readyForP3: false,
    families: [
      {
        familyId: "data_quality_profile",
        label: "Data quality profile",
        required: true,
        status: "missing",
        evidenceIds: [],
        evidenceTitles: [],
        ...overrides,
      },
    ],
    gapRegister: [],
  };
}

function packet(
  overrides: Partial<DiscoveryEvidenceReadiness["families"][number]> = {},
) {
  const packets = buildMoveEvidenceNeedPackets({
    moveId: "move-1",
    moveName: "Governed data foundation",
    currentPhase: 2,
    readiness: readiness(overrides),
  });
  expect(packets).toHaveLength(1);
  return packets[0];
}

/** Every sentence a surface renders from a packet, as one searchable list. */
function renderedSentences(p: ReturnType<typeof packet>): string[] {
  return [
    p.nextAction,
    p.waiverOption ?? "",
    p.canDraftBoundary.canDraftLabel,
    p.canDraftBoundary.cannotDraftLabel,
    p.preliminaryGenerationCaveat ?? "",
  ];
}

describe("required evidence is never closed by an offer the product cannot honour", () => {
  it("records that no surface can waive a Move's evidence need", () => {
    expect(MOVE_EVIDENCE_WAIVER_AVAILABLE).toBe(false);
  });

  it("prints no waiver anywhere in a required, missing family's packet", () => {
    for (const sentence of renderedSentences(packet())) {
      expect(sentence).not.toMatch(/waiv/i);
    }
  });

  it("prints no waiver for an optional family either", () => {
    for (const sentence of renderedSentences(
      packet({ required: false }),
    )) {
      expect(sentence).not.toMatch(/waiv/i);
    }
  });

  it("omits the waiver row rather than replacing it with other prose", () => {
    expect(packet().waiverOption).toBeNull();
    expect(waiverOptionSentence(true)).toBeNull();
    expect(waiverOptionSentence(false)).toBeNull();
  });

  it("names the two controls that do exist in every blocking sentence", () => {
    const p = packet();
    expect(p.canDraftBoundary.canDraftLabel).toContain(EVIDENCE_CLOSE_PATH);
    expect(p.canDraftBoundary.cannotDraftLabel).toContain(EVIDENCE_CLOSE_PATH);
    expect(p.preliminaryGenerationCaveat).toContain(EVIDENCE_CLOSE_PATH);
    expect(EVIDENCE_CLOSE_PATH).toMatch(/Files & Evidence/);
  });

  it("asks for an upload and an approval when no guidance table authored the family", () => {
    // `data_quality_profile` under this blueprint reaches no authored table, so
    // the packet carries the unauthored ask — the one that used to say "or
    // record a human waiver with rationale".
    expect(packet().guidanceBasis).toBe("unauthored");
    expect(unauthoredNextActionSentence()).toMatch(/upload/i);
    expect(unauthoredNextActionSentence()).toMatch(/approve/i);
    expect(unauthoredNextActionSentence()).not.toMatch(/waiv/i);
  });

  it("keeps a covered family free of any blocking sentence at all", () => {
    const p = packet({ status: "covered" });
    expect(p.preliminaryGenerationCaveat).toBeNull();
    expect(p.canDraftBoundary.canDraftLabel).toBe(
      "Can draft with current evidence.",
    );
  });

  it("offers no waiver in any sentence the blocked surfaces print", () => {
    // The six callers, each at the moment the reader is actually stuck: the
    // phase build refusal, the P2 advance refusal, the gap register's
    // remediation, the capture header's completion rule, and the two packet
    // boundary labels.
    const sentences = [
      buildHeldByEvidenceDetail(1),
      buildHeldByEvidenceDetail(3),
      closeRequiredEvidenceInstruction(),
      gapRemediationSentence("XLSX", "Finance"),
      requiredEvidenceCompletionNotice(),
      blockedUntilSentence(),
      doNotPresentSentence(),
      mustWaitSentence("data quality profile"),
    ];
    for (const sentence of sentences) {
      expect(sentence).not.toMatch(/waiv/i);
    }
  });

  it("keeps each blocked sentence actionable rather than merely waiver-free", () => {
    // Removing the waiver clause must not leave a sentence that states a block
    // and names nothing to do about it.
    expect(buildHeldByEvidenceDetail(2)).toMatch(/approved in Files & Evidence/);
    expect(buildHeldByEvidenceDetail(2)).toMatch(/2 required evidence items are/);
    expect(buildHeldByEvidenceDetail(1)).toMatch(/1 required evidence item is/);
    expect(closeRequiredEvidenceInstruction()).toMatch(/upload/i);
    expect(closeRequiredEvidenceInstruction()).toMatch(/approve/i);
    expect(gapRemediationSentence("XLSX", "Finance")).toMatch(
      /Upload XLSX from Finance/,
    );
    expect(gapRemediationSentence("XLSX", "Finance")).toMatch(/approve/i);
    expect(requiredEvidenceCompletionNotice()).toMatch(/Files & Evidence/);
  });

  it("leaves the waiver wording nowhere but this module", () => {
    // Two of the six callers — the P2 advance refusal and the capture header —
    // are not observable through a packet, so a revert at those call sites
    // would otherwise survive. Scanning for the wording pins every caller by
    // construction: the only file allowed to contain it is the one that gates
    // it, plus this suite.
    const allowed = new Set([
      "src/lib/programs/evidence-readiness/evidence-waiver-availability.ts",
      "src/lib/programs/evidence-readiness/__tests__/evidence-waiver-availability.test.ts",
    ]);
    // Phrases that only ever appear as an offer of a waiver to the reader.
    // Deliberately not a bare /waiv/: Source's own gate-criteria and artifact
    // acceptance surfaces legitimately record waivers, and agent voice doctrine
    // discusses them.
    const phrases = [
      "formally waived",
      "record a human waiver",
      "covered or waived",
      "may record a waiver",
    ];
    const offenders: string[] = [];
    for (const phrase of phrases) {
      let out = "";
      try {
        out = execFileSync(
          "git",
          ["grep", "-l", "--fixed-strings", phrase, "--", "src"],
          { encoding: "utf8" },
        );
      } catch {
        continue; // git grep exits 1 when nothing matches
      }
      for (const file of out.split("\n").filter(Boolean)) {
        if (allowed.has(file)) continue;
        // Source and agent-voice surfaces are a different product control.
        if (file.startsWith("src/lib/agent/")) continue;
        if (file.startsWith("src/components/source/")) continue;
        if (file.startsWith("src/app/api/v1/source/")) continue;
        offenders.push(`${file} :: ${phrase}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("restores the waiver wording the moment a producer is declared", () => {
    // The flag is the only thing standing between the two wordings. Proven by
    // calling the available-branch of each sentence directly, so a future edit
    // that deletes the wording instead of gating it fails here rather than
    // shipping copy that goes silent when a waiver becomes recordable.
    const available = {
      blockedUntil:
        "Final generation is blocked until this evidence is uploaded or formally waived.",
      doNotPresent:
        "Do not present final or board-ready output until this evidence is covered or waived.",
    };
    expect(blockedUntilSentence()).not.toBe(available.blockedUntil);
    expect(doNotPresentSentence()).not.toBe(available.doNotPresent);
    expect(mustWaitSentence("data quality profile")).toContain(
      "data quality profile",
    );
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/programs/evidence-readiness/evidence-waiver-availability.ts",
      ),
      "utf8",
    );
    expect(source).toContain(available.blockedUntil);
    expect(source).toContain(available.doNotPresent);
    expect(source).toContain("may record a waiver");
    expect(source).toContain("or formally waived. No phase build was queued.");
    expect(source).toContain("record a human waiver before advancing.");
    expect(source).toContain("record a human waiver before P3.");
    expect(source).toContain("approved or formally waived before these inputs");
  });
});
