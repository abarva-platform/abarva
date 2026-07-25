import {
  resolveAuthoritativeArchitecture,
  architectureLineageNote,
  type PriorDeliverable,
} from "../prior-deliverable-precedence";

const SCOPE = { moveId: "move-1", tenantKey: "meridian" };

function arch(over: Partial<PriorDeliverable> = {}): PriorDeliverable {
  return {
    deliverableTypeKey: "target_state_architecture",
    acceptance: "accepted",
    engagementId: "move-1",
    tenantKey: "meridian",
    digest: {
      architecture:
        "Governed agent-assist layer over the ITSM system of record.",
    },
    lineageRef: "deliv-arch-1",
    ...over,
  };
}

describe("resolveAuthoritativeArchitecture — authoritative context precedence", () => {
  it("accepts a signed-off same-Move, same-tenant P3 architecture and carries lineage", () => {
    const r = resolveAuthoritativeArchitecture([arch()], SCOPE);
    expect(r).not.toBeNull();
    expect(r?.architecture).toMatch(/governed agent-assist/i);
    expect(r?.lineageRef).toBe("deliv-arch-1");
    expect(architectureLineageNote(r!)).toMatch(
      /accepted P3 architecture deliverable/i,
    );
    expect(architectureLineageNote(r!)).toMatch(/deliv-arch-1/);
  });

  it("accepts solution_design as an architecture-bearing type", () => {
    const r = resolveAuthoritativeArchitecture(
      [
        arch({
          deliverableTypeKey: "solution_design",
          digest: { solutionDesign: "Design detail." },
        }),
      ],
      SCOPE,
    );
    expect(r?.architecture).toMatch(/design detail/i);
  });

  it("EXCLUDES an unreviewed (draft) architecture", () => {
    expect(
      resolveAuthoritativeArchitecture([arch({ acceptance: "draft" })], SCOPE),
    ).toBeNull();
  });

  it("EXCLUDES a candidate architecture", () => {
    expect(
      resolveAuthoritativeArchitecture(
        [arch({ acceptance: "candidate" })],
        SCOPE,
      ),
    ).toBeNull();
  });

  it("EXCLUDES a rejected architecture", () => {
    expect(
      resolveAuthoritativeArchitecture(
        [arch({ acceptance: "rejected" })],
        SCOPE,
      ),
    ).toBeNull();
  });

  it("EXCLUDES a superseded architecture", () => {
    expect(
      resolveAuthoritativeArchitecture(
        [arch({ acceptance: "superseded" })],
        SCOPE,
      ),
    ).toBeNull();
  });

  it("EXCLUDES a cross-Move architecture (different engagement)", () => {
    expect(
      resolveAuthoritativeArchitecture(
        [arch({ engagementId: "other-move" })],
        SCOPE,
      ),
    ).toBeNull();
  });

  it("EXCLUDES a cross-tenant architecture", () => {
    expect(
      resolveAuthoritativeArchitecture([arch({ tenantKey: "apex" })], SCOPE),
    ).toBeNull();
  });

  it("returns null when an accepted architecture carries no actual architecture content", () => {
    expect(
      resolveAuthoritativeArchitecture(
        [arch({ digest: { chosenOption: "Option B" } })],
        SCOPE,
      ),
    ).toBeNull();
  });

  it("prefers the accepted architecture even when a draft one is also present", () => {
    const r = resolveAuthoritativeArchitecture(
      [
        arch({
          acceptance: "draft",
          digest: { architecture: "stale draft arch" },
          lineageRef: "draft-1",
        }),
        arch({
          digest: { architecture: "accepted arch" },
          lineageRef: "accepted-1",
        }),
      ],
      SCOPE,
    );
    expect(r?.architecture).toBe("accepted arch");
    expect(r?.lineageRef).toBe("accepted-1");
  });
});
