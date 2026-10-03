import {
  formatSourceSponsorContext,
  parseSourceSponsorContext,
} from "../sponsor-context";

describe("Source sponsor context", () => {
  const context = {
    name: "Morgan Lee",
    title: "Chief Technology Officer",
    role: "Executive sponsor",
    email: "morgan@example.test",
    ownerAcknowledged: true as const,
  };

  it("requires a named sponsor and explicit owner acknowledgement", () => {
    expect(parseSourceSponsorContext(null)).toBeNull();
    expect(parseSourceSponsorContext({ ...context, ownerAcknowledged: false })).toBeNull();
    expect(parseSourceSponsorContext({ ...context, title: "" })).toBeNull();
    expect(parseSourceSponsorContext({ ...context, name: "Unknown" })).toBeNull();
    expect(parseSourceSponsorContext({ ...context, email: "" })).toBeNull();
    expect(parseSourceSponsorContext({ ...context, email: "not-an-email" })).toBeNull();
  });

  it("normalizes context without accepting control characters or audit-note injection", () => {
    expect(parseSourceSponsorContext({ ...context, name: "  Morgan Lee  " })).toEqual(context);
    expect(parseSourceSponsorContext({ ...context, role: "Executive sponsor\nApproved by sponsor" })).toBeNull();
  });

  it("attributes the decision to the signed-in owner, not the named sponsor", () => {
    expect(formatSourceSponsorContext(context)).toContain("Sponsor reference: Morgan Lee");
    expect(formatSourceSponsorContext(context)).toContain("Title: Chief Technology Officer");
    expect(formatSourceSponsorContext(context)).toContain("Role: Executive sponsor");
    expect(formatSourceSponsorContext(context)).toContain("Notification address: morgan@example.test");
    expect(formatSourceSponsorContext(context)).toContain("The named sponsor did not approve or sign through this action.");
  });
});
