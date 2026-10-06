import { DISCOVERY_BLUEPRINT_CATALOG } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";
import { evaluateDiscoveryEvidenceReadiness } from "@/lib/programs/discovery/evidence-readiness";
import {
  UNAUTHORED_FAMILY_GUIDANCE,
  archetypeGuidanceCoverage,
  buildMoveEvidenceNeedPackets,
  resolveFamilyGuidance,
  type MoveEvidenceNeedPacket,
} from "@/lib/programs/evidence-readiness/move-evidence-need-packet";

/**
 * A Move's evidence guidance is chosen by the archetype the resolver DECLARED,
 * read off `readiness.blueprintId`. It used to be chosen by keyword-matching the
 * Move's NAME, which made an archetype's own authored guidance unreachable for
 * any Move not named in that archetype's vocabulary, and reachable for Moves
 * declared as a different archetype entirely.
 */

/** Trips none of the Move-name keyword lists in the module. */
const NEUTRAL_NAME = "Enterprise Modernization Initiative";
/** Trips the contact-center keyword list ("member service", "agent assist"). */
const AGENT_ASSIST_NAME = "Member Service Agent Assist";
/** Trips the treasury keyword list. */
const TREASURY_NAME = "Treasury Cash Visibility Uplift";
/** Trips the AP-invoice keyword list. */
const AP_INVOICE_NAME = "AP Invoice Exception Close";

/**
 * The family ids the generic guidance table serves. Derived from the general
 * archetype rather than hand-listed: the general case IS what the generic table
 * is written for, which the first case below asserts.
 */
const GENERIC_FAMILY_IDS = DISCOVERY_BLUEPRINT_CATALOG.general_default.evidenceFamilies.map(
  (family) => family.id,
);

function packetsFor(blueprintId: string, moveName: string): MoveEvidenceNeedPacket[] {
  const blueprint = DISCOVERY_BLUEPRINT_CATALOG[blueprintId];
  if (!blueprint) throw new Error(`no catalog archetype ${blueprintId}`);
  return buildMoveEvidenceNeedPackets({
    moveId: "move-1",
    moveName,
    currentPhase: 2,
    readiness: evaluateDiscoveryEvidenceReadiness({ blueprint, evidenceItems: [] }),
  });
}

function packetFor(
  blueprintId: string,
  moveName: string,
  familyId: string,
): MoveEvidenceNeedPacket {
  const found = packetsFor(blueprintId, moveName).find((p) => p.familyId === familyId);
  if (!found) throw new Error(`${blueprintId} asks for no family ${familyId}`);
  return found;
}

function guidanceOf(packet: MoveEvidenceNeedPacket) {
  return {
    exampleTemplate: packet.exampleTemplate,
    exampleContent: packet.exampleContent,
    whyItMatters: packet.whyItMatters,
    nextAction: packet.nextAction,
  };
}

function isUnauthored(packet: MoveEvidenceNeedPacket): boolean {
  return guidanceOf(packet).exampleTemplate === UNAUTHORED_FAMILY_GUIDANCE.exampleTemplate;
}

describe("a declared archetype reaches its own authored guidance", () => {
  it("serves every family of an archetype that has a guidance table, under a name that trips no keyword list", () => {
    const packets = packetsFor("healthcare_contact_center_agent_assist", NEUTRAL_NAME);
    expect(packets).toHaveLength(12);
    expect(packets.filter(isUnauthored).map((p) => p.familyId)).toEqual([]);
  });

  it("names what the family actually is, rather than the neutral fallback", () => {
    const packet = packetFor(
      "healthcare_contact_center_agent_assist",
      NEUTRAL_NAME,
      "call_recording_transcript_availability",
    );
    expect(packet.exampleTemplate).toBe("Call transcript/recording availability");
    expect(packet.nextAction).toContain("redacted transcripts");
  });

  it("gives the same guidance whatever the Move is called", () => {
    for (const blueprintId of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
      const named = (moveName: string) =>
        packetsFor(blueprintId, moveName)
          // A family served only by the generic table is still name-sensitive:
          // the Move-name heuristics specialise the generic families and are
          // deliberately preserved. See "the Move-name heuristics still cover
          // archetypes with no table of their own" below.
          .filter((p) => !GENERIC_FAMILY_IDS.includes(p.familyId))
          .map(guidanceOf);
      const neutral = named(NEUTRAL_NAME);
      // Each of these trips a different Move-name keyword list. Guidance the
      // declared archetype owns must not move when the Move is renamed.
      for (const moveName of [AGENT_ASSIST_NAME, TREASURY_NAME, AP_INVOICE_NAME]) {
        expect(named(moveName)).toEqual(neutral);
      }
    }
  });
});

describe("one archetype's voice does not answer for another", () => {
  const SHARED_WITH_CONTACT_CENTER = "finance_baseline_value_plan";

  it("does not hand a different declared archetype the agent-assist wording of a shared family", () => {
    const packet = packetFor(
      "governed_data_foundation",
      AGENT_ASSIST_NAME,
      SHARED_WITH_CONTACT_CENTER,
    );
    // The archetype-specific wording for this family is scoped to queues and
    // handle time; the archetype-neutral reading is not.
    expect(packet.exampleContent.join(" ")).not.toMatch(/queue|handle time|containment/i);
    expect(packet.exampleContent.join(" ")).toContain("functions in scope");
  });

  it("still answers that family, rather than falling through to the neutral fallback", () => {
    const packet = packetFor(
      "governed_data_foundation",
      NEUTRAL_NAME,
      SHARED_WITH_CONTACT_CENTER,
    );
    expect(isUnauthored(packet)).toBe(false);
    expect(packet.exampleTemplate).toBe("Finance baseline and value measurement plan");
  });

  it("lets the archetype that authored its own wording for a shared family keep it", () => {
    const packet = packetFor(
      "healthcare_contact_center_agent_assist",
      NEUTRAL_NAME,
      "measurement_owner_cadence",
    );
    expect(packet.exampleContent.join(" ")).toMatch(/contact-center metric/i);
  });

  it("prefers the declared archetype over a Move name that matches a different one", () => {
    // Were the name heuristic still able to win, this would be served from the
    // contact-center table.
    const viaName = guidanceOf(
      packetFor("governed_data_foundation", AGENT_ASSIST_NAME, "change_adoption_owner"),
    );
    const viaNeutralName = guidanceOf(
      packetFor("governed_data_foundation", NEUTRAL_NAME, "change_adoption_owner"),
    );
    expect(viaName).toEqual(viaNeutralName);
    expect(viaName.exampleContent.join(" ")).not.toMatch(/frontline agent/i);
  });
});

describe("the Move-name heuristics still cover archetypes with no table of their own", () => {
  it("serves the general archetype's families, which is what makes it the generic set", () => {
    const packets = packetsFor("general_default", NEUTRAL_NAME);
    expect(packets.map((p) => p.familyId).sort()).toEqual([...GENERIC_FAMILY_IDS].sort());
    expect(packets.filter(isUnauthored)).toEqual([]);
  });

  it("keeps the name-specialised wording where the declared archetype authored none", () => {
    const packet = packetFor("general_default", TREASURY_NAME, "cost_baseline");
    expect(packet.exampleTemplate).toBe("Treasury cost and value baseline");
  });

  it("falls back to the generic wording when the name matches nothing", () => {
    const packet = packetFor("general_default", NEUTRAL_NAME, "cost_baseline");
    expect(packet.exampleTemplate).toBe("Cost and effort baseline packet");
  });
});

describe("a family with no authored guidance says so plainly", () => {
  it("uses the neutral fallback verbatim", () => {
    const packet = packetFor(
      "governed_data_foundation",
      NEUTRAL_NAME,
      "data_governance_ownership",
    );
    expect(guidanceOf(packet)).toEqual(UNAUTHORED_FAMILY_GUIDANCE);
  });
});

describe("archetypeGuidanceCoverage", () => {
  it("reports what each catalog archetype has authored, and what it still owes", () => {
    const byId = new Map(archetypeGuidanceCoverage().map((c) => [c.blueprintId, c]));
    expect([...byId.keys()].sort()).toEqual(
      Object.keys(DISCOVERY_BLUEPRINT_CATALOG).sort(),
    );
    const shape = (id: string) => {
      const c = byId.get(id);
      if (!c) throw new Error(`no coverage row for ${id}`);
      return [c.authored.length, c.authored.length + c.unauthored.length];
    };
    expect(shape("healthcare_contact_center_agent_assist")).toEqual([12, 12]);
    expect(shape("general_default")).toEqual([5, 5]);
    expect(shape("governed_data_foundation")).toEqual([4, 12]);
    expect(shape("financial_services_commercial_lending_agent_assist")).toEqual([1, 8]);
    expect(shape("ai_operations_customer_digital")).toEqual([1, 12]);
  });

  it("counts a family as authored exactly when the build does not fall back", () => {
    for (const coverage of archetypeGuidanceCoverage()) {
      const packets = packetsFor(coverage.blueprintId, NEUTRAL_NAME);
      const fellBack = packets.filter(isUnauthored).map((p) => p.familyId);
      expect(fellBack.sort()).toEqual([...coverage.unauthored].sort());
    }
  });

  it("names every family its archetype asks for, exactly once", () => {
    for (const coverage of archetypeGuidanceCoverage()) {
      const blueprint = DISCOVERY_BLUEPRINT_CATALOG[coverage.blueprintId];
      const reported = [...coverage.authored, ...coverage.unauthored];
      expect(new Set(reported).size).toBe(reported.length);
      expect(reported.sort()).toEqual(
        blueprint.evidenceFamilies.map((f) => f.id).sort(),
      );
    }
  });
});

describe("the cross-archetype table earns its place", () => {
  /** Family ids the catalog itself gives to more than one archetype. */
  const sharedFamilyIds = (() => {
    const owners = new Map<string, Set<string>>();
    for (const blueprint of Object.values(DISCOVERY_BLUEPRINT_CATALOG)) {
      for (const family of blueprint.evidenceFamilies) {
        owners.set(
          family.id,
          (owners.get(family.id) ?? new Set()).add(blueprint.blueprintId),
        );
      }
    }
    return [...owners.entries()].filter(([, o]) => o.size > 1).map(([id]) => id);
  })();

  it("is derived from the catalog, not from a hand-kept list", () => {
    expect(sharedFamilyIds.sort()).toEqual([
      "change_adoption_owner",
      "finance_baseline_value_plan",
      "it_systems_landscape",
      "measurement_owner_cadence",
      "model_risk_responsible_ai_controls",
    ]);
  });

  it("answers every shared family for every archetype that asks for it", () => {
    for (const coverage of archetypeGuidanceCoverage()) {
      for (const familyId of sharedFamilyIds) {
        const blueprint = DISCOVERY_BLUEPRINT_CATALOG[coverage.blueprintId];
        if (!blueprint.evidenceFamilies.some((f) => f.id === familyId)) continue;
        expect(coverage.authored).toContain(familyId);
      }
    }
  });

  it("keeps the shared reading free of any one archetype's vocabulary", () => {
    for (const familyId of sharedFamilyIds) {
      for (const coverage of archetypeGuidanceCoverage()) {
        const blueprint = DISCOVERY_BLUEPRINT_CATALOG[coverage.blueprintId];
        if (!blueprint.evidenceFamilies.some((f) => f.id === familyId)) continue;
        if (coverage.blueprintId === "healthcare_contact_center_agent_assist") continue;
        const packet = packetFor(coverage.blueprintId, NEUTRAL_NAME, familyId);
        const text = [
          packet.exampleTemplate,
          ...packet.exampleContent,
          packet.whyItMatters,
          packet.nextAction,
        ].join(" ");
        expect(text).not.toMatch(
          /agent[- ]assist|frontline agent|contact[- ]center|member service|CCaaS/i,
        );
      }
    }
  });
});

/**
 * Every packet now says WHICH link in the guidance chain authored its wording.
 * The reason is the product's first rule — identity is declared, never inferred
 * — and one link breaks it: a Move-NAME keyword table reads the Move's title.
 * Before this, a title-matched reading and a declared one were indistinguishable
 * in the packet, so a surface could present an inference as a declaration.
 */
describe("a packet declares where its wording came from", () => {
  /** Trips BOTH the treasury and the AP-invoice keyword lists. */
  const TREASURY_AND_AP_NAME = "Treasury Payment Exception Close";

  it("reports the declared archetype's own table as the declared basis", () => {
    const packet = packetFor(
      "healthcare_contact_center_agent_assist",
      NEUTRAL_NAME,
      "contact_center_kpis",
    );
    expect(packet.guidanceBasis).toBe("declared_archetype");
  });

  it("reports the generic table as the generic basis, not as a declaration", () => {
    const packet = packetFor("general_default", NEUTRAL_NAME, "cost_baseline");
    expect(packet.guidanceBasis).toBe("generic");
    expect(isUnauthored(packet)).toBe(false);
  });

  it("reports an unauthored family as unauthored rather than as a table reading", () => {
    const coverage = archetypeGuidanceCoverage().find(
      (entry) => entry.blueprintId === "ai_operations_customer_digital",
    );
    expect(coverage?.unauthored.length).toBeGreaterThan(0);
    const packet = packetFor(
      "ai_operations_customer_digital",
      NEUTRAL_NAME,
      coverage!.unauthored[0],
    );
    expect(packet.guidanceBasis).toBe("unauthored");
    expect(isUnauthored(packet)).toBe(true);
  });

  it("marks a reading the Move's TITLE unlocked as inferred, not declared", () => {
    const named = packetFor("general_default", TREASURY_NAME, "cost_baseline");
    const unnamed = packetFor("general_default", NEUTRAL_NAME, "cost_baseline");
    // Same declaration, same family — only the Move's name differs.
    expect(named.guidanceBasis).toBe("move_name");
    expect(unnamed.guidanceBasis).toBe("generic");
    expect(guidanceOf(named)).not.toEqual(guidanceOf(unnamed));
  });

  it("lets the declared archetype's table beat a name match", () => {
    const packet = packetFor(
      "healthcare_contact_center_agent_assist",
      AGENT_ASSIST_NAME,
      "contact_center_kpis",
    );
    expect(packet.guidanceBasis).toBe("declared_archetype");
  });

  it("keeps the shared table ahead of a name match", () => {
    // Derived from the chain rather than from a family list: every family that
    // the cross-archetype table answers must keep answering it under a title
    // that trips two keyword lists.
    let checked = 0;
    for (const blueprintId of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
      for (const family of DISCOVERY_BLUEPRINT_CATALOG[blueprintId].evidenceFamilies) {
        const declaredPath = resolveFamilyGuidance({
          familyId: family.id,
          moveName: "",
          blueprintId,
        });
        if (declaredPath.basis !== "cross_archetype") continue;
        const named = resolveFamilyGuidance({
          familyId: family.id,
          moveName: TREASURY_AND_AP_NAME,
          blueprintId,
        });
        expect(named.basis).toBe("cross_archetype");
        expect(named.guidance).toEqual(declaredPath.guidance);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("resolves the name tables in a fixed order when a title trips two", () => {
    // Every family the treasury table authors, the AP-invoice table authors too,
    // so a title tripping both lists is decided by the declared precedence.
    const both = packetFor("general_default", TREASURY_AND_AP_NAME, "cost_baseline");
    const treasuryOnly = packetFor("general_default", TREASURY_NAME, "cost_baseline");
    const apOnly = packetFor("general_default", AP_INVOICE_NAME, "cost_baseline");
    expect(guidanceOf(apOnly)).not.toEqual(guidanceOf(treasuryOnly));
    expect(guidanceOf(both)).toEqual(guidanceOf(treasuryOnly));
    expect(both.guidanceBasis).toBe("move_name");
  });

  it("gives every family of every catalog archetype a basis", () => {
    for (const blueprintId of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
      for (const packet of packetsFor(blueprintId, NEUTRAL_NAME)) {
        expect([
          "declared_archetype",
          "cross_archetype",
          "move_name",
          "generic",
          "unauthored",
          "packet_specific",
        ]).toContain(packet.guidanceBasis);
      }
    }
  });

  it("never reports a name basis for a Move whose title trips no list", () => {
    for (const blueprintId of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
      for (const packet of packetsFor(blueprintId, NEUTRAL_NAME)) {
        expect(packet.guidanceBasis).not.toBe("move_name");
      }
    }
  });
});

/**
 * The coverage report is computed THROUGH the same chain a packet uses, so the
 * declared-path reading it publishes cannot drift from what a Move receives.
 */
describe("the coverage report and a packet agree on the declared path", () => {
  it("agrees family by family, for every catalog archetype", () => {
    for (const coverage of archetypeGuidanceCoverage()) {
      for (const packet of packetsFor(coverage.blueprintId, NEUTRAL_NAME)) {
        const expectAuthored = packet.guidanceBasis !== "unauthored";
        expect(coverage.authored.includes(packet.familyId)).toBe(expectAuthored);
        expect(coverage.unauthored.includes(packet.familyId)).toBe(!expectAuthored);
      }
    }
  });

  it("reads the declared path even for an archetype a Move name could specialise", () => {
    // An empty Move name is what makes the report declaration-only; pin that no
    // keyword list matches it, because the report depends on it.
    for (const blueprintId of Object.keys(DISCOVERY_BLUEPRINT_CATALOG)) {
      const blueprint = DISCOVERY_BLUEPRINT_CATALOG[blueprintId];
      for (const family of blueprint.evidenceFamilies) {
        expect(
          resolveFamilyGuidance({ familyId: family.id, moveName: "", blueprintId }).basis,
        ).not.toBe("move_name");
      }
    }
  });
});

/**
 * `nameSpecialised` is the backlog of wording that EXISTS and that no
 * declaration can reach. It is not the same as `unauthored`: the declared path
 * answers these families generically, and a better reading sits in a Move-name
 * table behind a title match.
 */
describe("guidance reachable only by a Move's title is reported", () => {
  it("names the families whose specialised wording a declaration cannot reach", () => {
    const byBlueprint = new Map(
      archetypeGuidanceCoverage().map((entry) => [entry.blueprintId, entry]),
    );
    // Every family the treasury/AP tables author belongs to the general archetype,
    // which is why the declared path answers it generically rather than not at all.
    expect(
      byBlueprint.get("general_default")?.nameSpecialised.map((e) => e.familyId).sort(),
    ).toEqual(["cost_baseline", "current_state_process", "it_systems_landscape", "kpi_baseline"]);
    expect(
      byBlueprint.get("ai_operations_customer_digital")?.nameSpecialised,
    ).toEqual([{ familyId: "it_systems_landscape", nameTableIds: ["treasury", "ap_invoice"] }]);
  });

  it("lists every name table that authors the family, not just the winning one", () => {
    for (const coverage of archetypeGuidanceCoverage()) {
      for (const entry of coverage.nameSpecialised) {
        expect(entry.nameTableIds.length).toBeGreaterThan(0);
        expect(new Set(entry.nameTableIds).size).toBe(entry.nameTableIds.length);
      }
    }
  });

  it("reports a specialisation only where the declared path is not the archetype's own", () => {
    for (const coverage of archetypeGuidanceCoverage()) {
      for (const entry of coverage.nameSpecialised) {
        const declaredPath = resolveFamilyGuidance({
          familyId: entry.familyId,
          moveName: "",
          blueprintId: coverage.blueprintId,
        });
        expect(declaredPath.basis).not.toBe("declared_archetype");
      }
    }
  });

  it("proves each reported specialisation is actually reachable by a title", () => {
    const titleFor: Record<string, string> = {
      treasury: TREASURY_NAME,
      ap_invoice: AP_INVOICE_NAME,
      contact_center_agent_assist: AGENT_ASSIST_NAME,
    };
    let proven = 0;
    for (const coverage of archetypeGuidanceCoverage()) {
      for (const entry of coverage.nameSpecialised) {
        for (const nameTableId of entry.nameTableIds) {
          const resolved = resolveFamilyGuidance({
            familyId: entry.familyId,
            moveName: titleFor[nameTableId],
            blueprintId: coverage.blueprintId,
          });
          expect(resolved.basis).toBe("move_name");
          proven += 1;
        }
      }
    }
    expect(proven).toBe(10);
  });
});
