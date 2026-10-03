import { scopeExclusionBasis } from "@/lib/source/facts/scope-exclusion-decision";

it("does not bind an exclusions decision to a different requirement's artifact", () => {
  expect(scopeExclusionBasis({
    requirementId: "EVID-SRC-SCOPE-WORKFORCE",
    currentState: "Available",
    sourceArtifactId: "workforce-v1",
  })).toBeNull();
});
