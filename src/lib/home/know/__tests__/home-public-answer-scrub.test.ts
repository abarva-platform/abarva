import {
  enforceHomePublicParagraphCap,
  homePublicAnswerLeakIssues,
  operationalEvidenceInsufficiencyLead,
  scrubHomePublicAnswerText,
} from "../home-public-answer-scrub";

describe("home public answer scrub", () => {
  it("removes internal semantic inventory language from client-facing text", () => {
    const scrubbed = scrubHomePublicAnswerText(
      "Canonical entities: 80; Loaded facts: 160; Relationship maps: 120; semantic rows: 12. Current-state context. Loaded context. Source context. No blocking gap.",
    );

    expect(scrubbed).not.toMatch(
      /canonical entities|loaded facts|\bfacts?\b|relationship maps?|semantic|rows?|current-state context|loaded context|source context|no blocking gap/i,
    );
    expect(homePublicAnswerLeakIssues(scrubbed)).toEqual([]);
  });

  it("requires finance and Treasury automation answers to lead with operational evidence insufficiency", () => {
    expect(
      operationalEvidenceInsufficiencyLead(
        "What evidence supports finance close automation?",
      ),
    ).toMatch(/does not yet have enough operational-process source support/i);
    expect(
      operationalEvidenceInsufficiencyLead(
        "Do we have enough evidence for Treasury/Kyriba automation?",
      ),
    ).toMatch(/Treasury, or Kyriba automation priority/i);
  });

  it("does not create a second-generation forbidden phrase while scrubbing", () => {
    const scrubbed = scrubHomePublicAnswerText(
      "Missing evidence and needed evidence were stored in the semantic packet from earlier turns.",
    );

    expect(scrubbed).not.toMatch(
      /missing source support|source context|semantic packet|earlier turns|semantic/i,
    );
    expect(homePublicAnswerLeakIssues(scrubbed)).toEqual([]);
  });

  it("splits long operational paragraphs into three-sentence chunks", () => {
    const capped = enforceHomePublicParagraphCap(
      "Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six. Sentence seven.",
    );

    const sentenceCounts = capped
      .split(/\n{2,}/)
      .map((paragraph) => (paragraph.match(/[.!?](?:\s|$)/g) ?? []).length);

    expect(sentenceCounts).toEqual([3, 3, 1]);
  });

  it("does not exempt long bullet items from the paragraph cap", () => {
    const capped = enforceHomePublicParagraphCap(
      "- Application systems — the applications behind these processes. One caveat on scope: finance functions do not yet have ticket-pattern depth. For those areas there are no work-item extracts. If you want an investment view, use an advisory surface.",
    );

    const sentenceCounts = capped
      .split(/\n{2,}/)
      .map((paragraph) => (paragraph.match(/[.!?](?:\s|$)/g) ?? []).length);

    expect(sentenceCounts).toEqual([3, 1]);
  });
});
