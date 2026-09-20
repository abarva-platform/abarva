import fs from "node:fs";
import path from "node:path";

import {
  countUnenforcedRetentionPolicies,
  getPilotRetentionPolicy,
  PILOT_LEGAL_HOLD_POSTURE,
  PILOT_RETENTION_POLICIES,
} from "@/lib/admin/pilot-data-plane-security-policy";

/**
 * Seven retention policies are declared here, with windows from 14 days to
 * seven years and delete triggers written in prose. Outside this module's own
 * test, **nothing reads any of them** — no purge job, no expiry sweep, no code
 * path that consults `retainDays` before keeping or deleting a file.
 *
 * A table of retention windows that nothing acts on is worse than no table,
 * because it reads as a control to anyone who finds it, and the person most
 * likely to find it is a customer doing diligence.
 *
 * These cases make that state structural. The one that matters is the last
 * pair: a policy may only claim enforcement if it names a module that exists,
 * which is the same rule as any other evidence citation — a claim whose
 * evidence is never resolved is a claim about nothing.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");

describe("retention is declared and not enforced, and says so", () => {
  it("makes every policy state whether anything acts on it", () => {
    expect(PILOT_RETENTION_POLICIES).toHaveLength(7);
    for (const policy of PILOT_RETENTION_POLICIES) {
      expect(["enforced", "declared_not_enforced"]).toContain(
        policy.enforcement.state,
      );
    }
  });

  it("counts the unenforced policies, so the gap is a number", () => {
    // Seven of seven. When this drops, something real was built; when it
    // rises, a new window was written that nothing honours.
    expect(countUnenforcedRetentionPolicies()).toBe(7);
    expect(countUnenforcedRetentionPolicies()).toBe(
      PILOT_RETENTION_POLICIES.length,
    );
  });

  it("makes an unenforced policy say what the customer loses", () => {
    // Without this a policy could be marked unenforced and mean nothing by
    // it. The gap text is the part a diligence answer is built from.
    for (const policy of PILOT_RETENTION_POLICIES) {
      if (policy.enforcement.state !== "declared_not_enforced") continue;
      expect(policy.enforcement.gap.trim().length).toBeGreaterThan(20);
    }
  });

  it("refuses an enforcement claim whose module does not exist", () => {
    // The rule that keeps this honest as things get built. A policy that
    // says `enforced` names the module doing it, and that path must resolve
    // — the same rule as any other evidence citation.
    const claimed = PILOT_RETENTION_POLICIES.filter(
      (policy) => policy.enforcement.state === "enforced",
    );

    for (const policy of claimed) {
      const modulePath = (
        policy.enforcement as { state: "enforced"; enforcedBy: string }
      ).enforcedBy;
      expect(fs.existsSync(path.join(REPO_ROOT, modulePath))).toBe(true);
    }
  });

  it("would catch an enforcement claim pointing at nothing", () => {
    // The case above is vacuous today, because nothing claims enforcement.
    // This is the same rule exercised against a claim that does exist, so
    // the rule is proven rather than merely present.
    const fabricated = {
      ...getPilotRetentionPolicy("raw_upload"),
      enforcement: {
        state: "enforced" as const,
        enforcedBy: "src/lib/admin/retention-sweeper-that-does-not-exist.ts",
      },
    };

    expect(
      fs.existsSync(path.join(REPO_ROOT, fabricated.enforcement.enforcedBy)),
    ).toBe(false);

    // And the resolver is looking somewhere real.
    expect(
      fs.existsSync(
        path.join(REPO_ROOT, "src/lib/admin/pilot-data-plane-security-policy.ts"),
      ),
    ).toBe(true);
  });

  it("records legal hold as a decision, not as an absence", () => {
    expect(PILOT_LEGAL_HOLD_POSTURE.state).toBe("out_of_scope_for_pilot");
    expect(PILOT_LEGAL_HOLD_POSTURE.costIfAsked).toContain("suspend deletion");
    expect(PILOT_LEGAL_HOLD_POSTURE.reopenTrigger).toContain("retention enforceable");
  });

  it("ties legal hold to retention, because the two stop being separable", () => {
    // The deferral is only safe while nothing deletes on a schedule. The day
    // a purge mechanism lands, a missing hold becomes a way to destroy
    // records somebody was obliged to keep — so the reopen trigger has to be
    // the arrival of enforcement, not a date.
    expect(countUnenforcedRetentionPolicies()).toBe(
      PILOT_RETENTION_POLICIES.length,
    );
    expect(PILOT_LEGAL_HOLD_POSTURE.whyDeferrable).toMatch(
      /nothing deletes on a schedule/i,
    );
  });
});
