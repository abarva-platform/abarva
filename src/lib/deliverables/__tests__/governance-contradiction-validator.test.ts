import {
  validateGovernanceConsistency,
  type AuthoritativeGovernanceState,
} from "../governance-contradiction-validator";

const STATE: AuthoritativeGovernanceState = {
  phase: 4,
  charterSignedOff: true,
  architectureAccepted: true,
  isFinal: false,
  isReviewDraft: true,
};

describe("validateGovernanceConsistency — blocking governance contradictions", () => {
  it("passes a consistent review-draft artifact", () => {
    const html = `<p>Review draft generated after Phase 4 entry and capture completion. Phase 4 exit approval and final sponsor acceptance remain pending.</p>`;
    expect(validateGovernanceConsistency(html, STATE)).toEqual([]);
  });

  it("blocks a stale charter-signoff claim when the charter IS signed off", () => {
    const html = `<p>Open items: charter signoff is still required.</p>`;
    const v = validateGovernanceConsistency(html, STATE);
    expect(v.map((x) => x.code)).toContain("stale_charter_signoff_claim");
  });

  it("does NOT flag a charter-signoff claim when the charter is genuinely NOT signed off", () => {
    const html = `<p>charter signoff is still required.</p>`;
    const v = validateGovernanceConsistency(html, {
      ...STATE,
      charterSignedOff: false,
    });
    expect(v.map((x) => x.code)).not.toContain("stale_charter_signoff_claim");
  });

  it("blocks a stale architecture claim when architecture IS accepted", () => {
    const html = `<p>architecture is not captured or approved for final use.</p>`;
    const v = validateGovernanceConsistency(html, STATE);
    expect(v.map((x) => x.code)).toContain("stale_architecture_claim");
  });

  it("does NOT flag the architecture claim when architecture is genuinely not accepted", () => {
    const html = `<p>architecture is not captured or approved.</p>`;
    const v = validateGovernanceConsistency(html, {
      ...STATE,
      architectureAccepted: false,
    });
    expect(v.map((x) => x.code)).not.toContain("stale_architecture_claim");
  });

  it("blocks a false finality claim on a review draft", () => {
    const html = `<p>This roadmap is final and board-approved.</p>`;
    const v = validateGovernanceConsistency(html, STATE);
    expect(v.map((x) => x.code)).toContain("false_finality_claim");
  });

  it("does NOT flag finality language on an actually-final artifact", () => {
    const html = `<p>This roadmap is final.</p>`;
    const v = validateGovernanceConsistency(html, {
      ...STATE,
      isFinal: true,
      isReviewDraft: false,
    });
    expect(v.map((x) => x.code)).not.toContain("false_finality_claim");
  });

  it("blocks the self-contradictory 'no generation until the gate is approved'", () => {
    const html = `<p>Phase 4 gate is not approved — no generation until the gate is approved.</p>`;
    const v = validateGovernanceConsistency(html, STATE);
    expect(v.map((x) => x.code)).toContain(
      "prohibited_generation_contradiction",
    );
  });

  it("blocks a leaked internal actor UUID in client-facing text", () => {
    const html = `<p>approver id d15d16a8-e5ad-4a0a-a1cf-93e06a3936d0</p>`;
    const v = validateGovernanceConsistency(html, STATE);
    expect(v.map((x) => x.code)).toContain("internal_identifier_leak");
  });

  it("does NOT flag a UUID that is a structural element id or URL, not client text", () => {
    const html = `<div id="d15d16a8-e5ad-4a0a-a1cf-93e06a3936d0"><a href="/api/v1/artifacts/48dc0b3f-0531-4a83-82a6-1ead302753df">Open</a></div>`;
    const v = validateGovernanceConsistency(html, STATE);
    expect(v.map((x) => x.code)).not.toContain("internal_identifier_leak");
  });

  it("reports multiple violations together", () => {
    const html = `<p>charter signoff is still required; architecture is not approved; no generation until the gate is approved.</p>`;
    const v = validateGovernanceConsistency(html, STATE);
    expect(v.length).toBeGreaterThanOrEqual(3);
  });
});
