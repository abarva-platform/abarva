import { sanitizeClientFacingArtifactHtml } from "../client-facing-artifact-sanitize";

describe("sanitizeClientFacingArtifactHtml", () => {
  it("rewrites priority shorthand without removing the evidence appendix", () => {
    const html = sanitizeClientFacingArtifactHtml(`
      <h2>Open Inputs Required</h2>
      <p>Priority is defined as: <strong>P1</strong> — blocks the decision; P2 inputs improve sizing.</p>
      <p>The enterprise substrate should support agent assist.</p>
      <h2>Appendix A — Source Register</h2>
      <p>[1] Approved call-center metrics.</p>
    `);

    expect(html).toContain("<strong>Priority 1</strong> — blocks the decision");
    expect(html).toContain("Priority 2 inputs improve sizing");
    expect(html).toContain("enterprise data foundation should support agent assist");
    expect(html).toContain("Appendix A — Source Register");
    expect(html).not.toMatch(/\bP1\b/);
    expect(html).not.toMatch(/\bP2 inputs\b/i);
    expect(html).not.toMatch(/\bsubstrate\b/i);
  });

  it("rewrites client-completion placeholders into normal evidence-gap language", () => {
    const html = sanitizeClientFacingArtifactHtml(`
      <p>[CLIENT TO COMPLETE: validation owner]</p>
      <p>Cycle time baseline is TBC and the escalation owner is to be confirmed.</p>
      <p>CLIENT TO COMPLETE: business signoff.</p>
    `);

    expect(html).toContain("Client input required: validation owner");
    expect(html).toContain("Cycle time baseline requires confirmation");
    expect(html).toContain("escalation owner requires confirmation");
    expect(html).toContain("Client input required: business signoff");
    expect(html).not.toMatch(/CLIENT TO COMPLETE/i);
    expect(html).not.toMatch(/\bTBC\b/i);
    expect(html).not.toMatch(/\[CLIENT TO COMPLETE:/i);
  });

  it("rewrites phase-owner shorthand without touching filenames or appendix rows", () => {
    const html = sanitizeClientFacingArtifactHtml(`
      <p>Design needs the authoritative source P2 Compliance / Chief Risk Office (open input — see Open Inputs Required).</p>
      <p>Review 08_p2_kyc_control_defect_log.csv in the appendix.</p>
    `);

    expect(html).toContain(
      "authoritative source Priority 2 owner: Compliance / Chief Risk Office (open input",
    );
    expect(html).toContain("08_p2_kyc_control_defect_log.csv");
    expect(html).not.toMatch(/\bP2 Compliance\b/);
  });
});
