import {
  homePublicAnswerLeakIssues,
  operationalEvidenceInsufficiencyLead,
  scrubHomePublicAnswerText,
} from "../home-public-answer-scrub";

describe("home public answer scrub", () => {
  it("removes internal semantic inventory language from client-facing text", () => {
    const scrubbed = scrubHomePublicAnswerText(
      "Canonical entities: 80; Loaded facts: 160; Relationship maps: 120; semantic rows: 12. No blocking gap.",
    );

    expect(scrubbed).not.toMatch(
      /canonical entities|loaded facts|\bfacts?\b|relationship maps?|semantic|rows?|no blocking gap/i,
    );
    expect(homePublicAnswerLeakIssues(scrubbed)).toEqual([]);
  });

  it("requires finance and Treasury automation answers to lead with operational evidence insufficiency", () => {
    expect(
      operationalEvidenceInsufficiencyLead(
        "What evidence supports finance close automation?",
      ),
    ).toMatch(/does not yet support an operational-process automation case/i);
    expect(
      operationalEvidenceInsufficiencyLead(
        "Do we have enough evidence for Treasury/Kyriba automation?",
      ),
    ).toMatch(/Treasury, or Kyriba automation priority/i);
  });
});

