import { apexRetail } from "../index";
import { apexRetailAI } from "../ai";
import { apexInterviews } from "../interviews";
import { apexLeadership } from "../leadership";
import { APEX_EXECUTIVE_BENCH } from "../org-structure";
import { apexRetailTechInventory } from "../technology_inventory";
import { buildApexEnterpriseDataRoom } from "@/lib/knowledge/enterprise-data-room";

const canonicalNames = APEX_EXECUTIVE_BENCH.map((executive) => executive.name);
const deprecatedApexNames = [
  "Thomas Reeves",
  "James Okafor",
  "Robert Martinez",
  "Marcus Johnson",
  "Priya Nair",
  "Lisa Chen",
  "David Kim",
  "Sandra Williams",
  "David Park",
  "Lisa Thompson",
  "Evelyn Brooks",
  "Aria Shah",
];

function flatten(value: unknown): string {
  return JSON.stringify(value);
}

function hasExecutive(value: unknown): value is { executive: string } {
  return value !== null && typeof value === "object" && "executive" in value;
}

describe("Apex Retail roster consistency", () => {
  it("keeps leadership fixtures aligned to the canonical org structure", () => {
    expect(apexLeadership.executives.map((executive) => executive.name)).toStrictEqual(canonicalNames);
    expect(apexRetail.leadership.executives.map((executive) => executive.name)).toStrictEqual(canonicalNames);
  });

  it("keeps interview and AI brief executives on the canonical roster", () => {
    const interviewNames = (Object.values(apexInterviews) as unknown[])
      .filter(hasExecutive)
      .map((interview) => interview.executive);
    const aiInterviewNames = Object.values(apexRetailAI.interviews).map((interview) => interview.name);

    expect(interviewNames).toEqual(
      expect.arrayContaining([
        "Robert Vance",
        "Carlos Rivera",
        "Lynne Stratham",
        "Margaret Chen",
        "Thomas Brennan",
        "Michael Tanaka",
      ]),
    );
    expect(aiInterviewNames).toEqual(expect.arrayContaining(["Robert Vance", "Carlos Rivera", "Margaret Chen", "Jennifer Park"]));
  });

  it("does not leak deprecated Apex roster names into active Apex fixtures", () => {
    const fixtureText = flatten({
      apexRetail,
      apexRetailAI,
      apexInterviews,
      apexLeadership,
      apexRetailTechInventory,
    });

    for (const deprecatedName of deprecatedApexNames) {
      expect(fixtureText).not.toContain(deprecatedName);
    }
    expect(fixtureText).not.toContain("VACANT");
    expect(fixtureText).not.toContain("CDO not hired");
  });

  it("builds enterprise data-room people with org-chart reporting lines", () => {
    const room = buildApexEnterpriseDataRoom();
    const peopleByName = new Map(room.people.map((person) => [person.name, person]));

    expect(peopleByName.get("Robert Vance")?.reportsToRole).toBeUndefined();
    expect(peopleByName.get("Carlos Rivera")?.reportsToRole).toBe("COO");
    expect(peopleByName.get("Sarah Whitfield")?.reportsToRole).toBe("CIO");
    expect(peopleByName.get("Michael Tanaka")?.reportsToRole).toBe("COO");
  });
});
