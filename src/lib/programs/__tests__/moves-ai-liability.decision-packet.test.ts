/**
 * Behavioral test for the `moves-decision-evidence-packet` control declared in
 * docs/security/ai-surface-control-catalog.json.
 *
 * The packet is what a reviewer reads back months later to understand a phase
 * decision. Three controls sit on it: the AI label naming the agent and the
 * human attestation, the citation of the evidence the decision rested on, and
 * the confidence disclosure — the assumptions made and the alternatives
 * considered.
 *
 * The catalog checker proves those field names appear in the file. It cannot
 * prove a packet ever carries them, or that a packet missing them is rejected
 * rather than quietly shipped. This calls the real builder.
 */

import {
  buildMovesPhaseDecisionAuditRefs,
  buildMovesPhaseDecisionEvidencePacket,
} from "../moves-ai-liability";

const RATIONALE =
  "The sponsor reviewed the gate evidence and accepted the advance at the Tuesday review.";

function decision(extra: Record<string, unknown> = {}) {
  return {
    programId: "PRG-1",
    tenantName: "Tenant A",
    decisionOwner: "sponsor@example.com",
    fromPhase: 2,
    toPhase: 3,
    gateCriterion: "Data readiness attested",
    humanRationale: RATIONALE,
    ...extra,
  } as never;
}

describe("moves phase decision evidence packet", () => {
  it("records who decided and on what, not just that a decision happened", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket(decision());

    expect(packet.agentName).toBe("Nexus");
    expect(packet.decisionOwner).toBe("sponsor@example.com");
    expect(packet.humanRationale).toContain("sponsor reviewed the gate evidence");
    expect(packet.evidenceIds.length).toBeGreaterThan(0);
  });

  it("states the assumptions and the alternatives, so the decision can be argued with later", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket(decision());

    // A packet that records only the chosen path reads as inevitability. The
    // alternatives are what make it a decision rather than a record.
    expect(packet.assumptions.length).toBeGreaterThan(0);
    expect(packet.alternativesConsidered.length).toBeGreaterThan(0);
    expect(packet.alternativesConsidered.join(" ")).toMatch(/hold|reject/i);
  });

  it("says plainly when the reviewer declared no missing inputs", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket(decision());

    // Silence and "nothing was missing" are different claims; the packet must
    // not let an empty list read as a clean bill of health.
    expect(packet.missingInputs.length).toBeGreaterThan(0);
    expect(packet.missingInputs.join(" ")).toMatch(/did not declare/i);
  });

  it("keeps the caller's own evidence, assumptions and alternatives when given", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket(
      decision({
        evidenceIds: ["EV-1", "EV-2"],
        assumptions: ["The migration freeze holds through Q4."],
        alternativesConsidered: ["Split the phase and advance only the pilot."],
        missingInputs: ["Vendor SOC 2 report not yet received."],
      }),
    );

    expect(packet.evidenceIds).toEqual(expect.arrayContaining(["EV-1", "EV-2"]));
    expect(packet.assumptions).toContain("The migration freeze holds through Q4.");
    expect(packet.alternativesConsidered).toContain(
      "Split the phase and advance only the pilot.",
    );
    expect(packet.missingInputs).toContain(
      "Vendor SOC 2 report not yet received.",
    );
  });

  it("refuses to build a packet with no named decision owner", () => {
    // A packet is evidence. One that looks complete but names nobody is worse
    // than none, so the builder throws rather than returning it.
    expect(() =>
      buildMovesPhaseDecisionEvidencePacket(decision({ decisionOwner: "" })),
    ).toThrow(/validation/i);
  });

  it("does not let the packet say an agent approved the advance", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket(
      decision({ gateCriterion: "Nexus approved the advance" }),
    );

    // The scrub runs before validation, and validation re-checks it, so a
    // recommendation claiming an agent approved cannot reach the record.
    expect(packet.sanitizedRecommendationText).not.toMatch(/Nexus approved/i);
    expect(packet.sanitizedRecommendationText).toMatch(
      /recommended for human review/i,
    );
  });

  it("documents a gap: the scrub covers decision verbs, not action verbs", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket(
      decision({ gateCriterion: "Nexus executed the advance" }),
    );

    // Recorded, not asserted as desired behaviour. The replacement table
    // matches decided/approved/selected/authorized/signed off after an agent
    // name; "executed", "sent", "committed" and "awarded" pass through. This
    // test will fail the day someone widens the table — which is the point:
    // the change should be deliberate, because widening a scrub that rewrites
    // user-visible prose risks garbling legitimate sentences such as "the
    // migration executed successfully".
    expect(packet.sanitizedRecommendationText).toMatch(/Nexus executed/i);
  });

  it("does NOT enforce the rationale minimum — that lives in the callers", () => {
    // Recorded deliberately rather than asserted as a defect. The route, the
    // button and the tool each reject a short rationale; the packet builder
    // does not. A future caller that skips those checks would record a
    // one-word rationale as evidence, and nothing here would stop it.
    const packet = buildMovesPhaseDecisionEvidencePacket(
      decision({ humanRationale: "ok" }),
    );
    expect(packet.humanRationale).toBe("ok");
  });

  it("audit refs point back at the decision and every cited item, without duplicates", () => {
    const packet = buildMovesPhaseDecisionEvidencePacket(
      decision({ evidenceIds: ["EV-1", "EV-1", "EV-2"] }),
    );
    const refs = buildMovesPhaseDecisionAuditRefs(packet);

    expect(refs).toContain(packet.recommendationId);
    expect(refs).toEqual(Array.from(new Set(refs)));
    expect(refs).toEqual(expect.arrayContaining(["EV-1", "EV-2"]));
  });
});
