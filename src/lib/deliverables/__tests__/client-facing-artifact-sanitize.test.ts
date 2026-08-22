import {
  sanitizeClientFacingArtifactHtml,
  sanitizeClientFacingArtifactMarkdown,
} from "../client-facing-artifact-sanitize";

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
    expect(html).toContain(
      "enterprise data foundation should support agent assist",
    );
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

  it("removes Source Register machinery from prose while preserving the appendix heading", () => {
    const html = sanitizeClientFacingArtifactHtml(`
      <p>Treat facts as evidenced when tied to the Source Register.</p>
      <p>Verify the claim in the evidence appendix (Source Register), entry [3].</p>
      <h2>Appendix A — Source Register</h2>
    `);

    expect(html).toContain("tied to cited evidence");
    expect(html).toContain("evidence appendix, entry [3]");
    expect(html).toContain("Appendix A — Source Register");
    expect(html.match(/Source Register/g)).toHaveLength(1);
  });

  it("redacts a labeled internal actor UUID from client-facing text but never structural ids or URLs", () => {
    const html = sanitizeClientFacingArtifactHtml(`
      <div id="d15d16a8-e5ad-4a0a-a1cf-93e06a3936d0">
        <p>Approved decision — approver id d15d16a8-e5ad-4a0a-a1cf-93e06a3936d0.</p>
        <p>Approved by d15d16a8-e5ad-4a0a-a1cf-93e06a3936d0 on FY2026.</p>
        <a href="/api/v1/artifacts/48dc0b3f-0531-4a83-82a6-1ead302753df">Open</a>
      </div>
    `);
    // The leaked actor id in visible text is redacted…
    expect(html).toContain("(audit reference on file)");
    expect(html).not.toMatch(
      /approver id\s+d15d16a8-e5ad-4a0a-a1cf-93e06a3936d0/i,
    );
    expect(html).not.toMatch(
      /Approved by\s+d15d16a8-e5ad-4a0a-a1cf-93e06a3936d0/i,
    );
    // …while the element id and the download URL (both UUIDs) are untouched.
    expect(html).toContain('id="d15d16a8-e5ad-4a0a-a1cf-93e06a3936d0"');
    expect(html).toContain(
      "/api/v1/artifacts/48dc0b3f-0531-4a83-82a6-1ead302753df",
    );
  });

  it("redacts bare UUIDs in generated markdown body text without corrupting markdown URLs", () => {
    const markdown = sanitizeClientFacingArtifactMarkdown(`
      The architecture context referenced 2c5b4757-2bc5-4efc-8fdd-02b9b2f38a12 in prose.
      Keep the durable artifact link /api/v1/artifacts/48dc0b3f-0531-4a83-82a6-1ead302753df intact.
    `);

    expect(markdown).toContain("(internal reference on file) in prose");
    expect(markdown).not.toMatch(
      /referenced\s+2c5b4757-2bc5-4efc-8fdd-02b9b2f38a12/i,
    );
    expect(markdown).toContain(
      "/api/v1/artifacts/48dc0b3f-0531-4a83-82a6-1ead302753df",
    );
  });

  it("removes residual internal vocabulary and bare phase shorthand without corrupting references", () => {
    const html = sanitizeClientFacingArtifactHtml(`
      <p>P2 should verify enterprise_context_chunks against the Source Register.</p>
      <p>Use the Client-to-Complete Checklist and retain 08_p2_controls.csv plus DP2.</p>
      <h2>Appendix A — Source Register</h2>
    `);

    expect(html).toContain(
      "discovery should verify enterprise evidence against the evidence appendix",
    );
    expect(html).toContain("Client Input Checklist");
    expect(html).toContain("08_p2_controls.csv");
    expect(html).toContain("DP2");
    expect(html).toContain("Appendix A — Source Register");
    expect(html.match(/Source Register/g)).toHaveLength(1);
  });
});
