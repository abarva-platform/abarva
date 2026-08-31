import fs from "node:fs";
import path from "node:path";
import type { EnterpriseSignalPacket } from "@/lib/home/preview/types";
import { buildBusinessBriefing } from "../business-briefing";

const ROOT = path.resolve(__dirname, "../../../..");
const packet: EnterpriseSignalPacket = JSON.parse(
  fs.readFileSync(path.join(ROOT, "lib/home/preview/golden-snapshots/meridian-health.json"), "utf8"),
).thesis.signalPacket;

describe("the first-ten-minutes briefing", () => {
  const briefing = buildBusinessBriefing(packet);
  const heading = (name: string) => briefing.sections.find((s) => s.heading === name);

  it("answers how the business makes money before anything about technology", () => {
    expect(briefing.sections[0].heading).toBe("How this business makes money");
    expect(briefing.sections[0].standfirst).toMatch(/\$25B revenue/);
    expect(briefing.sections[0].items[0].text).toMatch(/hospitals/i);
  });

  it("carries the declared priorities verbatim and in the record's own order", () => {
    const doing = heading("What it is trying to do");
    expect(doing?.items[0].text).toMatch(/Star Rating from 3\.5 to 4\.5/);
    expect(doing?.items).toHaveLength(5);
    // The numbering prefix is the record's, not a rank this page invented.
    for (const item of doing?.items ?? []) expect(item.text).not.toMatch(/^\d\)/);
  });

  it("reports the leadership position as counts, never as characterisation", () => {
    const says = heading("What the leadership says");
    expect(says?.items.some((i) => /44 of 44 interviewed leaders/.test(i.text))).toBe(true);
    expect(says?.items.some((i) => i.detail === "Minority view")).toBe(true);
    expect(says?.items.some((i) => /contradict the system-of-record/.test(i.text))).toBe(true);
  });

  it("attributes every quote to a role so a reader can weigh it", () => {
    const words = heading("In their own words");
    expect(words?.items.length).toBeGreaterThan(2);
    for (const item of words?.items ?? []) {
      expect(item.attribution).toBeTruthy();
      expect(item.text).not.toMatch(/^"|"$/);
    }
  });

  // The section that matters most on a briefing: what it cannot tell you.
  it("names the questions the record cannot answer rather than omitting them", () => {
    expect(briefing.notInTheRecord.length).toBeGreaterThanOrEqual(3);
    expect(briefing.notInTheRecord[0].question).toMatch(/competitors/i);
    expect(briefing.notInTheRecord[0].why).toMatch(/collection gap, not a finding/);
    for (const gap of briefing.notInTheRecord) expect(gap.why.length).toBeGreaterThan(60);
  });

  it("says the industry patterns arrive as titles only, because they do", () => {
    expect(briefing.notInTheRecord.some((g) => /why does each industry pattern apply/i.test(g.question))).toBe(true);
  });

  // Planted failure: an empty packet must produce no sections, never headings over nothing.
  it("renders no section it has no evidence for", () => {
    const empty = buildBusinessBriefing({ signals: [] } as unknown as EnterpriseSignalPacket);
    expect(empty.sections).toEqual([]);
    // The blind spots still stand -- they are true of an empty record too.
    expect(empty.notInTheRecord.length).toBeGreaterThan(0);
  });

  it("drops a testimony signal that carries no quotable text", () => {
    const noQuote = {
      signals: [{ id: "s1", kind: "testimony", statement: "A CFO said something unquoted.", domains: [], evidenceRefs: [] }],
    } as unknown as EnterpriseSignalPacket;
    expect(buildBusinessBriefing(noQuote).sections.find((s) => s.heading === "In their own words")).toBeUndefined();
  });
});
