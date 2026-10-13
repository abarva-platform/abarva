import { hasUnqualifiedReferenceTestimony } from "../reference-testimony";

describe("hasUnqualifiedReferenceTestimony", () => {
  it.each([
    "Original interview transcripts are not verified in this Home record.",
    "Original interview evidence is missing from this Home record.",
    "Interview testimony is unavailable in the supplied record.",
    "Leadership interview transcripts are unverified here.",
    "No verified interview testimony is available in this Home record.",
    "Interviews are not yet loaded into this record.",
    "Interview evidence for 12 leaders is not verified here.",
    "The record does not establish that leaders raised concerns.",
    "Interview evidence does not verify whether members reported delays.",
    "No evidence confirms that leaders raised concerns.",
    "Discovery should interview members.",
    "Discovery should interview 12 leaders.",
    "Plan to interview 12 leaders during discovery.",
    "Interview 12 leaders before deciding.",
    "We will interview members during discovery.",
    "We need to interview executives before making a decision.",
    "Leaders will be interviewed during discovery.",
    "12 leaders will be interviewed during discovery.",
    "Interviews will be conducted during discovery.",
    "Schedule future interviews with members.",
    "Request original interview transcripts for verification.",
    "Which interview evidence should we verify before acting?",
    "The interviews and testimony require verification.",
  ])("admits a bounded evidence gap or future request: %s", (passage) => {
    expect(hasUnqualifiedReferenceTestimony([passage], true)).toBe(false);
  });

  it.each([
    "12 of 18 leaders raised data trust concerns.",
    "Data trust concerns appear across 12 of 18 leaders.",
    "12 leaders have expressed concern.",
    "Most executives reported delays.",
    "Leaders said that reporting was inconsistent.",
    "Members reported long waits.",
    "Participants agreed that ownership was unclear.",
    "Interviewees flagged data quality concerns.",
    "The platform carries a leadership-reported trust gap.",
    "The interviews confirm an ownership gap.",
    "Interview testimony shows that members reported delays.",
    "Original interview transcripts reveal unresolved concerns.",
    "We interviewed members about their experience.",
    "Member interviews were conducted during discovery.",
    "No leaders raised concern.",
    "No members reported delays.",
    "The leaders did not report concern.",
    "No interviews were conducted.",
    "Members were interviewed during discovery.",
    "Members were not interviewed during discovery.",
    "Discovery should interview 12 leaders who already raised concerns.",
  ])("rejects unqualified actual or attributed testimony: %s", (passage) => {
    expect(hasUnqualifiedReferenceTestimony([passage], true)).toBe(true);
  });

  it.each([
    "Modelled responses: 12 of 18 leaders raised data trust concerns.",
    "Modeled responses show 12 leaders raised data trust concerns.",
    "Synthetic reference: members reported long waits.",
    "Simulated interviews indicate unresolved ownership concerns.",
    "No leaders raised concern in modelled responses.",
    "12 of 18 leaders raised concerns in synthetic interviews.",
    "**Leadership:** Modelled responses: 12 of 18 leaders raised concerns.",
    "**Synthetic:** 12 of 18 leaders raised concerns.",
    "Synthetic: 12 of 18 leaders raised concerns.",
    "12 of 18 leaders raised concerns (modelled).",
  ])("admits testimony with its local declared reference basis: %s", (passage) => {
    expect(hasUnqualifiedReferenceTestimony([passage], true)).toBe(false);
  });

  it.each([
    "The data is trusted by few leaders.",
    "Most leaders trust the data.",
    "Many executives trust the data.",
    "All leaders trust the data.",
    "No leaders trust the data.",
    "12 of 18 leaders trust the data.",
    "The data is trusted by 12 of 18 leaders.",
    "Modelled responses show data is trusted by few leaders.",
    "Synthetic reference: most leaders trust the data.",
    "50% of leaders trust the data.",
    "The data is trusted by 50% of leaders.",
    "Modelled responses: 50% of leaders trust the data.",
  ])("does not license an unsupported trust population: %s", (passage) => {
    expect(hasUnqualifiedReferenceTestimony([passage], true)).toBe(true);
  });

  it.each([
    "Original interview transcripts are not verified here. 12 of 18 leaders raised concerns.",
    "Original interview transcripts are not verified here; 12 of 18 leaders raised concerns.",
    "Original interview transcripts are not verified here, but 12 of 18 leaders raised concerns.",
    "Original interview transcripts are not verified here and 12 of 18 leaders raised concerns.",
    "Original interview transcripts are not verified here, 12 of 18 leaders raised concerns.",
    "Discovery should interview members; 12 of 18 leaders already reported concerns.",
    "Discovery should interview members, concerns appear across 12 of 18 leaders.",
    "Discovery should interview 12 leaders, concerns appear across 18 leaders.",
    "Modelled responses are available. 12 of 18 leaders raised concerns.",
    "Synthetic reference evidence is unavailable; leaders said reporting was inconsistent.",
    "Modelled responses raised concerns, but 12 of 18 leaders reported actual delays.",
    "- Modelled responses raised concerns.\n- 12 of 18 leaders raised concerns.",
    "These are not modelled responses: 12 of 18 leaders raised concerns.",
    "**Not synthetic:** 12 of 18 leaders raised concerns.",
  ])("does not borrow a gap, plan or qualification for an actual assertion: %s", (passage) => {
    expect(hasUnqualifiedReferenceTestimony([passage], true)).toBe(true);
  });

  it("does not borrow a qualification from another answer field", () => {
    expect(
      hasUnqualifiedReferenceTestimony(
        [
          "Modelled responses: 12 of 18 leaders raised concerns.",
          "Leaders said that reporting was inconsistent.",
        ],
        true,
      ),
    ).toBe(true);
  });

  it.each([false, undefined])("does not activate without a declared synthetic demo (%s)", (declared) => {
    expect(
      hasUnqualifiedReferenceTestimony(
        ["12 of 18 leaders raised concerns.", "The data is trusted by few leaders."],
        declared,
      ),
    ).toBe(false);
  });

  it("accepts an empty passage list", () => {
    expect(hasUnqualifiedReferenceTestimony([], true)).toBe(false);
  });
});
