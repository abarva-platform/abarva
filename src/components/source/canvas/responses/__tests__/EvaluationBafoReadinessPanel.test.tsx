import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildEvaluationBafoReadinessView,
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { EvaluationBafoReadinessPanel } from "../EvaluationBafoReadinessPanel";

describe("EvaluationBafoReadinessPanel", () => {
  it("renders received/comparable/blocker posture and the deterministic guardrail", () => {
    const profileSet = buildVendorResponseMveProfiles({
      id: "skyh-test-event",
      code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
      name: "SkyHarbor AMS Outsourcing RFP",
      accountName: "SkyHarbor Air",
    });
    const intelligence = buildVendorChallengeIntelligence(profileSet);
    const bafoPack = buildVendorBafoInstructionPack(intelligence);
    const decisionView = buildVendorEvaluationDecisionView(
      profileSet,
      intelligence,
      bafoPack,
    );
    const view = buildEvaluationBafoReadinessView({
      profileSet,
      challengeIntelligence: intelligence,
      bafoInstructionPack: bafoPack,
      decisionView,
    });

    const html = renderToStaticMarkup(
      createElement(EvaluationBafoReadinessPanel, { view }),
    );

    expect(html).toContain("Stage 07 decision support");
    expect(html).toContain("Next action");
    expect(html).toContain("Received");
    expect(html).toContain("Comparable");
    expect(html).toContain("Blockers and evidence gaps");
    expect(html).toContain("Vendor A");
    expect(html).toContain("Vendor B");
    expect(html).toContain("Vendor C");
    expect(html).toContain("Deterministic read");
    expect(html).toContain("does not select a winner");
    expect(html).not.toMatch(/award approved|guaranteed savings|industry benchmark/i);
  });

  it("renders an honest empty state when no records exist", () => {
    const view = buildEvaluationBafoReadinessView({});

    const html = renderToStaticMarkup(
      createElement(EvaluationBafoReadinessPanel, { view }),
    );

    expect(html).toContain("No records");
    expect(html).toContain("No governed response profiles loaded.");
    expect(html).toContain(
      "Load normalized vendor response packages before comparing vendors.",
    );
  });
});
