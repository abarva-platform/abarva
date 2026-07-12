jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

import { azureRead } from "@/lib/data-plane/azureRead";
import { readDeliverableContentSignals } from "../deliverable-content-signals";

const mockQuery = azureRead.query as jest.Mock;

// Synthetic fixture, shaped like the real golden-artifact decks (heading +
// table pattern seen in docs/build/golden-artifacts/) — NOT a verbatim
// excerpt. extract-content-extractor.test.ts already covers the verbatim
// real-deck case; this fixture exercises the DB-read + multi-signal path.
const SYNTHETIC_ROADMAP_HTML = `
  <section class="slide">
    <div class="row"><h2>Workstream Breakdown</h2></div>
    <table>
      <tr><th>Workstream</th><th>Lead</th><th>Owner</th></tr>
      <tr><td>Data platform migration</td><td>J. Alvarez</td><td>CTO</td></tr>
      <tr><td>Clinical workflow cutover</td><td>R. Chen</td><td>CMIO</td></tr>
    </table>
  </section>
  <section class="slide">
    <div class="row"><h2>KPI Trajectory</h2></div>
    <p>Cycle time drops from 14 days to 3 days by month 6; exception rate falls from 9% to 2%.</p>
  </section>
`;

describe("readDeliverableContentSignals", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("returns real extracted signals from the latest generated deliverable version", async () => {
    mockQuery.mockResolvedValueOnce([{ content: SYNTHETIC_ROADMAP_HTML, version: 2 }]);

    const signals = await readDeliverableContentSignals("move-1", "execution_roadmap");

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY dv.version DESC"),
      ["move-1", "execution_roadmap"],
      { missingTable: "empty" },
    );

    const byKey = Object.fromEntries(signals.map((s) => [s.key, s]));
    expect(byKey.workstreams?.snippet).toContain("Data platform migration");
    expect(byKey.metrics?.heading).toBe("KPI Trajectory");
    expect(byKey.metrics?.snippet).toContain("Cycle time drops");
    // No RACI heading/table in this fixture — must be honestly absent, not invented.
    expect(byKey.owners).toBeUndefined();
  });

  it("returns an empty array when the deliverable has not been generated yet", async () => {
    mockQuery.mockResolvedValueOnce([]);
    const signals = await readDeliverableContentSignals("move-2", "execution_roadmap");
    expect(signals).toEqual([]);
  });

  it("returns an empty array when the latest version has no usable content", async () => {
    mockQuery.mockResolvedValueOnce([{ content: "", version: 1 }]);
    const signals = await readDeliverableContentSignals("move-3", "execution_roadmap");
    expect(signals).toEqual([]);
  });

  it("never fabricates a signal absent from the real content", async () => {
    mockQuery.mockResolvedValueOnce([
      { content: "<h2>Executive Summary</h2><p>Nothing structured here.</p>", version: 1 },
    ]);
    const signals = await readDeliverableContentSignals("move-4", "execution_roadmap");
    expect(signals).toEqual([]);
  });

  it("falls back through a signal's other real keywords when the primary one is absent", async () => {
    mockQuery.mockResolvedValueOnce([
      {
        content: `
          <h2>Roadmap Overview</h2>
          <p>Phase 1 platform migration, phase 2 clinical cutover, phase 3 legacy decommission.</p>
          <h2>Decision Record</h2>
          <p>Selected the phased platform + operating-model shift over a big-bang rewrite.</p>
        `,
        version: 1,
      },
    ]);

    const signals = await readDeliverableContentSignals("move-5", "target_state_architecture");
    const byKey = Object.fromEntries(signals.map((s) => [s.key, s]));

    // No literal "workstream" heading — matched via the "roadmap" fallback keyword instead.
    expect(byKey.workstreams?.heading).toBe("Roadmap Overview");
    expect(byKey.workstreams?.snippet).toContain("platform migration");
    expect(byKey.decisions?.heading).toBe("Decision Record");
    expect(byKey.decisions?.snippet).toContain("phased platform");
  });

  it("matches real headings observed live in a generated target_state_architecture artifact", async () => {
    // Real heading text captured from a live-generated CANARY (Move 37ee2d85)
    // target_state_architecture artifact — the premium generation path says
    // "Implementation waves" and "AI decision & control flow", never the
    // literal words "workstream" or "decision record".
    mockQuery.mockResolvedValueOnce([
      {
        content: `
          <h2>Architecture thesis</h2>
          <p>Consolidate IROPS recovery onto one governed decision surface.</p>
          <h2>AI decision & control flow</h2>
          <p>Human dispatchers retain override on any recommendation above the risk threshold.</p>
          <h2>Implementation waves</h2>
          <p>Wave 1 stands up the recovery console; wave 2 adds predictive rebooking; wave 3 retires the legacy tool.</p>
        `,
        version: 1,
      },
    ]);

    const signals = await readDeliverableContentSignals("move-6", "target_state_architecture");
    const byKey = Object.fromEntries(signals.map((s) => [s.key, s]));

    expect(byKey.workstreams?.heading).toBe("Implementation waves");
    expect(byKey.workstreams?.snippet).toContain("Wave 1 stands up");
    expect(byKey.decisions?.heading).toBe("AI decision & control flow");
    expect(byKey.decisions?.snippet).toContain("Human dispatchers retain override");
  });
});
