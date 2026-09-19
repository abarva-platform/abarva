import { buildSourceNewRequestTriage } from "./request-triage";

describe("Source New request triage", () => {
  it("is ready for Define only when the five governed intake facts are recorded", () => {
    expect(
      buildSourceNewRequestTriage({
        trigger: "Confirm the sourcing path.",
        decisionOwner: "Technology sponsor",
        scope:
          "Scope boundary: Platform operations\nValue target: Establish the decision baseline\nBaseline owner: Technology finance",
      }),
    ).toEqual({
      requested: "Confirm the sourcing path.",
      missing: [],
      nextActor: "Technology sponsor",
      readyForDefine: true,
      actionLabel: "Review for Define",
    });
  });

  it("names absent facts without inferring values or an owner", () => {
    expect(
      buildSourceNewRequestTriage({
        trigger: null,
        decisionOwner: null,
        scope: "Scope boundary: Platform operations",
      }),
    ).toEqual({
      requested: "Request description not recorded",
      missing: [
        "Request description",
        "Decision owner",
        "Value target",
        "Baseline owner",
      ],
      nextActor: "Decision owner not recorded",
      readyForDefine: false,
      actionLabel: "Complete request",
    });
  });
});
