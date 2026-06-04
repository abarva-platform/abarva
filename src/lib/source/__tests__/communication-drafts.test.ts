import {
  buildSourceCommunicationDraft,
  isSourceCommunicationDraftType,
} from "../communication-drafts";

describe("Source communication drafts", () => {
  it("builds a BAFO request from event facts with review-only guardrails", () => {
    const draft = buildSourceCommunicationDraft({
      draftType: "bafo_request",
      clientName: "Apex Retail Group",
      eventName: "AMS Outsourcing 2026",
      eventSlug: "apex-retail-ams-outsourcing-2026",
      currentStage: "bafo",
      decisionOwner: "Carlos Rivera",
      valueAtStakeUsd: 35_000_000,
      scopeDescription: "SAP ECC, Sterling OMS, and NCR POS AMS scope.",
      recipientName: "Finalist vendors",
      note: "Ask for transition risk reduction.",
    });

    expect(draft.subject).toContain("best-and-final");
    expect(draft.body).toContain("Apex Retail Group");
    expect(draft.body).toContain("AMS Outsourcing 2026");
    expect(draft.body).toContain("$35,000,000");
    expect(draft.body).toContain("SAP ECC, Sterling OMS, and NCR POS");
    expect(draft.body).toContain("review before sending");
    expect(draft.disclaimer).toContain("Internal draft only");
  });

  it("validates the allowed draft types", () => {
    expect(isSourceCommunicationDraftType("qa_follow_up")).toBe(true);
    expect(isSourceCommunicationDraftType("bafo_request")).toBe(true);
    expect(isSourceCommunicationDraftType("award_notice")).toBe(true);
    expect(isSourceCommunicationDraftType("vendor_follow_up")).toBe(true);
    expect(isSourceCommunicationDraftType("send_email")).toBe(false);
  });
});
