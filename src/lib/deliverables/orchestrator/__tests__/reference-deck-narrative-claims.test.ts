import { referenceNarrativeIssue } from "../reference-deck-model";

const noBaseline = { baselineAvailable: false };
const noOwners = { acceptedOwnersAvailable: false };

describe("referenceNarrativeIssue: a missing basis framed as a prerequisite", () => {
  // The repair instruction for both rules asks the model to "describe confirmation
  // as a prerequisite". Each of these is that form and must not be refused.
  it.each([
    "Without a measured baseline, the value stays provisional.",
    "No measured baseline exists for handle time.",
    "The case needs a measured baseline before value can be credited.",
    "Until a measured baseline is agreed, savings remain an estimate.",
    "A measured baseline is the first prerequisite.",
    "Value is credited only after a measured baseline is agreed with finance.",
    "The measured baseline has not been confirmed.",
    "The baseline hasn't been verified by finance.",
  ])("passes a baseline prerequisite: %s", (sentence) => {
    expect(referenceNarrativeIssue(sentence, noBaseline)).toBeNull();
  });

  it.each([
    "Decision rights take effect once owners are agreed.",
    "Owners must be agreed before decisions are assigned.",
    "Decision owners are not yet assigned.",
    "Decision owners have not been accepted.",
    "Decision rights start only when owners are accepted.",
  ])("passes an owner prerequisite: %s", (sentence) => {
    expect(referenceNarrativeIssue(sentence, noOwners)).toBeNull();
  });
});

describe("referenceNarrativeIssue: a missing estimate or value framed as a prerequisite", () => {
  const noEstimateOrValue = { estimateAvailable: false, valueAvailable: false };
  // A panel slide's title ("…still needs an approved estimate") reaches the writer, which echoes it.
  it.each([
    "The shared foundation needs an approved estimate before its effort can be shared.",
    "Without an approved estimate, effort and duration cannot be sized.",
    "Release sequencing depends on an approved estimate.",
    "Until the annual value is confirmed, savings remain provisional.",
    "This estimate is pending approval by the delivery team.",
    "The annual value has not been confirmed.",
  ])("passes: %s", (sentence) => {
    expect(referenceNarrativeIssue(sentence, noEstimateOrValue)).toBeNull();
  });

  it.each([
    ["The approved estimate is the funding basis for the build.", "unavailable_estimate_claim"],
    ["Delivery follows this estimate across three releases.", "unavailable_estimate_claim"],
    ["The annual value covers the investment within three years.", "unavailable_value_claim"],
    ["Finance raised no objection, and the credited value is counted.", "unavailable_value_claim"],
  ])("still refuses: %s", (sentence, rule) => {
    expect(referenceNarrativeIssue(sentence, noEstimateOrValue)).toBe(rule);
  });
});

describe("referenceNarrativeIssue: an asserted claim is still refused", () => {
  it.each([
    "The measured current-state baseline is the basis for this review.",
    "The baseline is confirmed by finance.",
    "We have a measured baseline for handle time.",
    // A negation that is not a confirmation verb does not frame the claim.
    "The measured baseline is not disputed.",
    // A frame in another clause does not excuse this one.
    "Finance raised no objection, and the measured baseline is confirmed.",
    "There is no doubt; the baseline was verified.",
    // A condition after the claim does not frame it.
    "The measured baseline shows handle time falls once the change lands.",
  ])("refuses a baseline assertion: %s", (sentence) => {
    expect(referenceNarrativeIssue(sentence, noBaseline)).toBe("unavailable_baseline_claim");
  });

  it.each([
    "Each decision has been mapped to the user who holds authority for it.",
    "Decision owners are already assigned.",
    "Following this review, every decision owner was accepted.",
    "Owners raised no concerns, and every decision was assigned.",
    "Decision owners were accepted once the workshop closed.",
  ])("refuses an owner assertion: %s", (sentence) => {
    expect(referenceNarrativeIssue(sentence, noOwners)).toBe("unaccepted_owner_claim");
  });

  it("refuses nothing when the basis exists", () => {
    expect(referenceNarrativeIssue("The baseline is confirmed by finance.", { baselineAvailable: true })).toBeNull();
    expect(referenceNarrativeIssue("Decision owners are already assigned.", { acceptedOwnersAvailable: true })).toBeNull();
  });
});
