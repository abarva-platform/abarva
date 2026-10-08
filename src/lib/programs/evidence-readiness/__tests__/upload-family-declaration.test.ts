import {
  declarableEvidenceUploadFamilies,
  evidenceUploadDeclarationState,
} from "../upload-family-declaration";

type Packet = Parameters<typeof declarableEvidenceUploadFamilies>[0][number];

function packet(
  familyId: string,
  evidenceSlot: string,
  priority: "required" | "recommended" = "required",
): Packet {
  return { familyId, evidenceSlot, priority };
}

describe("declarableEvidenceUploadFamilies", () => {
  it("offers each family once, in the order the packets name them", () => {
    expect(
      declarableEvidenceUploadFamilies([
        packet("data_governance_ownership", "Data governance ownership"),
        packet("semantic_layer_certification", "Semantic layer"),
        packet("data_governance_ownership", "Data governance ownership (again)"),
      ]),
    ).toEqual([
      { id: "data_governance_ownership", label: "Data governance ownership" },
      { id: "semantic_layer_certification", label: "Semantic layer" },
    ]);
  });

  it("keeps the first label when a family is named twice", () => {
    const options = declarableEvidenceUploadFamilies([
      packet("data_quality_rules", "Data quality rules"),
      packet("data_quality_rules", "Second mention"),
    ]);
    expect(options).toHaveLength(1);
    expect(options[0]!.label).toBe("Data quality rules");
  });

  it("skips a packet with no family id rather than offering a blank option", () => {
    expect(
      declarableEvidenceUploadFamilies([
        packet("", "Unnamed"),
        packet("privacy_security_controls", "Privacy and security controls"),
      ]),
    ).toEqual([
      { id: "privacy_security_controls", label: "Privacy and security controls" },
    ]);
  });

  it("offers nothing when the Move needs nothing", () => {
    expect(declarableEvidenceUploadFamilies([])).toEqual([]);
  });
});

describe("evidenceUploadDeclarationState", () => {
  const packets = [
    packet("data_governance_ownership", "Data governance ownership"),
    packet("semantic_layer_certification", "Semantic layer"),
    packet("change_adoption_owner", "Change adoption owner", "recommended"),
  ];

  it("reports no dead end when the surface offers every family it needs", () => {
    expect(evidenceUploadDeclarationState({ needPackets: packets })).toEqual({
      options: [
        { id: "data_governance_ownership", label: "Data governance ownership" },
        { id: "semantic_layer_certification", label: "Semantic layer" },
        { id: "change_adoption_owner", label: "Change adoption owner" },
      ],
      undeclarableRequiredFamilyIds: [],
    });
  });

  it("names every required family when the surface offers no picker at all", () => {
    // What a phase workspace did while its picker was gated on P1: the
    // checklist beside it listed the families and the control took files that
    // could not say which one they covered.
    expect(
      evidenceUploadDeclarationState({
        needPackets: packets,
        offeredFamilyIds: [],
      }).undeclarableRequiredFamilyIds,
    ).toEqual(["data_governance_ownership", "semantic_layer_certification"]);
  });

  it("names only the required families a partial picker leaves out", () => {
    expect(
      evidenceUploadDeclarationState({
        needPackets: packets,
        offeredFamilyIds: ["data_governance_ownership"],
      }).undeclarableRequiredFamilyIds,
    ).toEqual(["semantic_layer_certification"]);
  });

  it("does not call a missing recommended family a dead end", () => {
    expect(
      evidenceUploadDeclarationState({
        needPackets: packets,
        offeredFamilyIds: [
          "data_governance_ownership",
          "semantic_layer_certification",
        ],
      }).undeclarableRequiredFamilyIds,
    ).toEqual([]);
  });

  it("counts a twice-named required family once", () => {
    expect(
      evidenceUploadDeclarationState({
        needPackets: [
          packet("data_quality_rules", "Data quality rules"),
          packet("data_quality_rules", "Data quality rules"),
        ],
        offeredFamilyIds: [],
      }).undeclarableRequiredFamilyIds,
    ).toEqual(["data_quality_rules"]);
  });

  it("still offers the options it was given when a dead end is reported", () => {
    const state = evidenceUploadDeclarationState({
      needPackets: packets,
      offeredFamilyIds: [],
    });
    expect(state.options).toHaveLength(3);
  });
});
