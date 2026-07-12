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
});
