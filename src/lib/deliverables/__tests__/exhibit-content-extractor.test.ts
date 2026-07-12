import { extractExhibitContent } from "../exhibit-content-extractor";

// Real excerpt (headings + body copy verbatim) from
// docs/build/golden-artifacts/Target-State-Architecture.html — the manually
// authored reference deck golden-bar.ts measures generated artifacts against.
// This is authentic board-grade HTML shape, not a hand-crafted fixture.
const GOLDEN_ARCHITECTURE_EXCERPT = `
  <section class="slide">
    <div class="slide-head">
      <div class="eyebrow">Target State · Security &amp; Governance</div>
      <div class="row"><h2>Compliance built into the platform</h2></div>
      <p class="sub">In healthcare, governance can't be a layer you add at the dashboard. PHI protection, HIPAA alignment, and least-privilege access are enforced once, centrally, and inherited everywhere.</p>
    </div>
    <div class="grid g4">
      <div class="card"><h3>Unity Catalog</h3><p>One permission model across all data and AI assets.</p></div>
    </div>
  </section>
  <section class="slide">
    <div class="slide-head">
      <div class="eyebrow">Target State · Intelligence</div>
      <div class="row"><h2>Agentic &amp; AI workloads on trusted data</h2></div>
      <p class="sub">Because Gold data is governed and science-ready, AI is a first-class workload — not a side project.</p>
    </div>
  </section>
  <section class="slide">
    <div class="slide-head">
      <div class="row"><h2>A phased path, value at every step</h2></div>
      <p class="sub">We modernize incrementally — standing up the platform, migrating in waves, and decommissioning legacy only once parity arrives.</p>
    </div>
  </section>
`;

// Synthetic (not from a real deck) — used only to exercise the table-match
// branch, since the golden architecture deck uses card grids, not <table>.
const SYNTHETIC_TABLE_HTML = `
  <h2>Workstream Breakdown</h2>
  <table>
    <tr><th>Workstream</th><th>Lead</th><th>Owner</th></tr>
    <tr><td>Data platform migration</td><td>J. Alvarez</td><td>CTO</td></tr>
    <tr><td>Clinical workflow cutover</td><td>R. Chen</td><td>CMIO</td></tr>
  </table>
`;

describe("extractExhibitContent — heading match against real generated-artifact HTML", () => {
  it("finds a single-word keyword and returns the real heading + body text", () => {
    const result = extractExhibitContent(GOLDEN_ARCHITECTURE_EXCERPT, "compliance");
    expect(result).not.toBeNull();
    expect(result?.heading).toBe("Compliance built into the platform");
    expect(result?.snippet).toContain("PHI protection, HIPAA alignment");
  });

  it("finds a multi-word keyword via word-level fallback, not just substring", () => {
    const result = extractExhibitContent(GOLDEN_ARCHITECTURE_EXCERPT, "phased path");
    expect(result).not.toBeNull();
    expect(result?.heading).toBe("A phased path, value at every step");
    expect(result?.snippet).toContain("standing up the platform");
  });

  it("does not fabricate a match for a keyword absent from the content", () => {
    expect(extractExhibitContent(GOLDEN_ARCHITECTURE_EXCERPT, "raci")).toBeNull();
    expect(extractExhibitContent(GOLDEN_ARCHITECTURE_EXCERPT, "financial model")).toBeNull();
  });

  it("stops the snippet at the next heading, not the rest of the document", () => {
    const result = extractExhibitContent(GOLDEN_ARCHITECTURE_EXCERPT, "agentic");
    expect(result?.snippet).toContain("first-class workload");
    expect(result?.snippet).not.toContain("phased path");
    expect(result?.snippet).not.toContain("modernize incrementally");
  });
});

describe("extractExhibitContent — table match", () => {
  it("extracts real table content when no matching heading precedes it", () => {
    const result = extractExhibitContent(SYNTHETIC_TABLE_HTML, "raci");
    expect(result).toBeNull();
  });

  it("matches a table by its header row and returns its real cell content", () => {
    const html = SYNTHETIC_TABLE_HTML.replace("<h2>Workstream Breakdown</h2>", "");
    const result = extractExhibitContent(html, "workstream");
    expect(result).not.toBeNull();
    expect(result?.snippet).toContain("Data platform migration");
    expect(result?.snippet).toContain("Clinical workflow cutover");
  });
});

describe("extractExhibitContent — edge cases", () => {
  it("returns null for empty html or empty keyword", () => {
    expect(extractExhibitContent("", "compliance")).toBeNull();
    expect(extractExhibitContent(GOLDEN_ARCHITECTURE_EXCERPT, "")).toBeNull();
    expect(extractExhibitContent(GOLDEN_ARCHITECTURE_EXCERPT, "   ")).toBeNull();
  });

  it("truncates very long snippets rather than returning unbounded text", () => {
    const longBody = "x".repeat(2000);
    const html = `<h2>Long Section</h2><p>${longBody}</p><h2>Next</h2><p>y</p>`;
    const result = extractExhibitContent(html, "long section");
    expect(result?.snippet.length).toBeLessThan(650);
    expect(result?.snippet.endsWith("…")).toBe(true);
  });
});
