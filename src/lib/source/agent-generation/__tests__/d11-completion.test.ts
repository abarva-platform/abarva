import { runDocumentQA } from "../../documentation-standards/source-documentation-standards";
import { completeD11ResponseControlSections } from "../d11-completion";

describe("completeD11ResponseControlSections", () => {
  it("adds the missing automation commitment and supplier certification controls", () => {
    const completed = completeD11ResponseControlSections({
      artifactCode: "d11_response_checklist",
      body: [
        "# Vendor Response Control Pack",
        "",
        "## Why This Pack Exists",
        "Vendors must complete the controlled response workbook.",
      ].join("\n"),
    });

    expect(completed).toContain("## Automation / Productivity Commitment Table");
    expect(completed).toContain("Baseline and measurement source");
    expect(completed).toContain("Commercial treatment");
    expect(completed).toContain("## Submission Certification");
    expect(completed).toContain("authorized representative");
  });

  it("makes a substantively complete response-control body pass document QA", () => {
    const body = [
      "# Vendor Response Control Pack",
      "",
      "## Why This Pack Exists",
      "Vendors must complete and submit the controlled response workbook.",
      "",
      "Response compliance mandate.",
      "Vendor Claim Register.",
      "Pricing Response Tab.",
      "Staffing and Location Model.",
      "SLA Commitment Table.",
      "Assumptions and Exclusions Log.",
      "Transition Plan Template.",
      "Commercial Exceptions Table.",
      "Commercial Leverage Readiness Matrix.",
    ].join("\n");
    const completed = completeD11ResponseControlSections({
      artifactCode: "d11_response_checklist",
      body,
    });
    const report = runDocumentQA({ artifactCode: "d11", content: completed });

    expect(report.blockers).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it("is idempotent and leaves other artifacts unchanged", () => {
    const body = "# Response Control";
    const once = completeD11ResponseControlSections({
      artifactCode: "d11_response_checklist",
      body,
    });
    const twice = completeD11ResponseControlSections({
      artifactCode: "d11_response_checklist",
      body: once,
    });

    expect(twice).toBe(once);
    expect(
      completeD11ResponseControlSections({
        artifactCode: "d09_rfp_pack",
        body,
      }),
    ).toBe(body);
  });
});
