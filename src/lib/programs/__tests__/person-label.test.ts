import {
  parsePersonLabelForOrigination,
  parsePersonMentionsForOrigination,
} from "@/lib/programs/person-label";

describe("parsePersonLabelForOrigination", () => {
  it("extracts the primary human from a compound sponsor label", () => {
    expect(
      parsePersonLabelForOrigination(
        "Maria Reyes (COO, primary); David Okafor (CCO, co-sponsor) — both named by user",
      ),
    ).toEqual({
      lookupLabel: "Maria Reyes",
      placeholderName: "Maria Reyes",
      placeholderRole: "COO",
      relationship: "primary",
    });
  });

  it("keeps the co-sponsor from a compound sponsor label", () => {
    expect(
      parsePersonMentionsForOrigination(
        "Maria Reyes (COO, primary); David Okafor (CCO, co-sponsor) — both named by user",
      ),
    ).toEqual([
      {
        lookupLabel: "Maria Reyes",
        placeholderName: "Maria Reyes",
        placeholderRole: "COO",
        relationship: "primary",
      },
      {
        lookupLabel: "David Okafor",
        placeholderName: "David Okafor",
        placeholderRole: "CCO",
        relationship: "co_sponsor",
      },
    ]);
  });

  it("does not invent a placeholder for a role-only label", () => {
    expect(parsePersonLabelForOrigination("COO sponsor")).toEqual({
      lookupLabel: "COO",
      placeholderName: null,
      placeholderRole: "COO",
      relationship: "primary",
    });
  });
});
