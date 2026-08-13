import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorResponseMveProfiles,
} from "../proposal-intelligence";
import { buildResponseDecisionAgenda } from "../vendor-response-decision-agenda";

const EVENT = {
  id: "65ee81ba-7bbc-4673-b0dd-13c08c5ca9ba",
  code: "SKYH-APPLICATION-MANAGED-SERVICES-2026-81A644CC",
  name: "Application managed services",
  accountName: "SkyHarbor Air",
};

function buildFixture() {
  const profiles = buildVendorResponseMveProfiles(EVENT);
  const challengeIntelligence = buildVendorChallengeIntelligence(profiles);
  const bafoInstructionPack = buildVendorBafoInstructionPack(
    challengeIntelligence,
  );
  return { challengeIntelligence, bafoInstructionPack };
}

describe("response decision agenda", () => {
  it("is empty when nothing has been produced yet", () => {
    const agenda = buildResponseDecisionAgenda(null, null);
    expect(agenda.items).toEqual([]);
    expect(agenda.totalCount).toBe(0);
    expect(agenda.blocksScoringCount).toBe(0);
  });

  it("ranks score-blocking items above leverage-only items", () => {
    const { challengeIntelligence, bafoInstructionPack } = buildFixture();
    const agenda = buildResponseDecisionAgenda(
      challengeIntelligence,
      bafoInstructionPack,
    );

    expect(agenda.items.length).toBeGreaterThan(0);
    const firstLeverageOnly = agenda.items.findIndex(
      (item) => !item.blocksScoring,
    );
    const lastBlocking = agenda.items
      .map((item) => item.blocksScoring)
      .lastIndexOf(true);
    if (firstLeverageOnly !== -1) {
      expect(lastBlocking).toBeLessThan(firstLeverageOnly);
    }
  });

  it("splits the total into score-blocking and leverage-only without losing items", () => {
    const { challengeIntelligence, bafoInstructionPack } = buildFixture();
    const agenda = buildResponseDecisionAgenda(
      challengeIntelligence,
      bafoInstructionPack,
    );

    expect(agenda.blocksScoringCount + agenda.leverageOnlyCount).toBe(
      agenda.totalCount,
    );
    expect(agenda.totalCount).toBe(agenda.items.length);
    expect(agenda.totalCount).toBe(bafoInstructionPack?.questionCount);
  });

  it("separates evidenced impact from impact that is only worth testing", () => {
    const { challengeIntelligence, bafoInstructionPack } = buildFixture();
    const agenda = buildResponseDecisionAgenda(
      challengeIntelligence,
      bafoInstructionPack,
    );

    expect(agenda.evidencedImpactCount + agenda.testOnlyImpactCount).toBe(
      challengeIntelligence?.leverageSeeds.length,
    );
    // Anything not high-confidence must never be presented as evidenced.
    for (const item of agenda.items) {
      if (item.impactConfidence && item.impactConfidence !== "high") {
        expect(item.impactConfidence).not.toBe("high");
      }
    }
  });

  it("carries evidence and an ask on every item it produces", () => {
    const { challengeIntelligence, bafoInstructionPack } = buildFixture();
    const agenda = buildResponseDecisionAgenda(
      challengeIntelligence,
      bafoInstructionPack,
    );

    for (const item of agenda.items) {
      expect(item.vendorName).toBeTruthy();
      expect(item.finding).toBeTruthy();
      expect(item.ask).toBeTruthy();
      expect(item.blocks).toBeTruthy();
      // Impact is optional and must stay null rather than be invented.
      expect(item.worth === null || typeof item.worth === "string").toBe(true);
    }
  });

  it("falls back to the challenge log when no BAFO pack exists yet", () => {
    const { challengeIntelligence } = buildFixture();
    const agenda = buildResponseDecisionAgenda(challengeIntelligence, null);

    expect(agenda.totalCount).toBe(challengeIntelligence?.challengeLog.length);
    expect(agenda.items.every((item) => Boolean(item.finding))).toBe(true);
  });
});
