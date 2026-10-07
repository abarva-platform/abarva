// A deliverable's source register must resolve every citation its body makes.
//
// `citationsUsed` is the model's self-report (or the architect plan's
// `evidenceCitations` when the section response omits it). The deterministic
// citation repair appends `[n]` to the body AFTER that report is taken, so a
// register built from the report alone can leave a cited source unlisted —
// and, when nothing was reported, can be empty on a document that does cite,
// which the quality gate blocks as `no source register`. That blocker names
// no control a human can use: the register is derived, not authored.
//
// The end-to-end cases drive the real orchestrator so the repair that inserts
// the citation is the one that runs, not a hand-built body.

import {
  citationsCarriedBySections,
  citationsInText,
} from "../rendered-section-citations";
import { buildSourceRegister } from "../section-generation";
import { runDeliverableOrchestration, type ModelCaller } from "../orchestrator";
import { amsRfpRequest, goodPlan } from "../__fixtures__/ams-rfp";
import type {
  DeliverableIntelligenceRequest,
  GovernedEvidenceItem,
  RenderableSection,
} from "../types";

describe("citationsInText", () => {
  it("reads every [n] marker, including adjacent ones", () => {
    expect(citationsInText("A fact [1] and another [2][3].")).toEqual([1, 2, 3]);
  });

  it("is not fooled by the placeholder tags the repairs also append", () => {
    // These share the bracket syntax and must never become register rows.
    expect(
      citationsInText(
        "A figure [ASSUMPTION TO VALIDATE: confirm] and [CLIENT TO COMPLETE: weights] and [EVIDENCE MISSING].",
      ),
    ).toEqual([]);
  });

  it("does not read a markdown link whose text happens to be a number", () => {
    expect(citationsInText("See [1](https://example.test) and [2]: ref")).toEqual(
      [],
    );
  });

  it("reads nothing from empty or absent text", () => {
    expect(citationsInText(undefined)).toEqual([]);
    expect(citationsInText("")).toEqual([]);
  });
});

describe("citationsCarriedBySections", () => {
  it("unions the reported citations with the ones the rendered body makes", () => {
    const carried = citationsCarriedBySections([
      { bodyMarkdown: "Repaired fact [4].", citationsUsed: [1] },
    ]);
    expect([...carried].sort()).toEqual([1, 4]);
  });

  it("reads the raw body too, because the gate judges that one", () => {
    const carried = citationsCarriedBySections([
      { bodyMarkdown: "Sanitized.", rawBodyMarkdown: "Raw fact [7]." },
    ]);
    expect([...carried]).toEqual([7]);
  });

  it("still carries a reported citation the body does not spell out", () => {
    // Narrowing the register to the body alone would be a NEW refusal; this
    // change only ever adds a row the document already needs.
    const carried = citationsCarriedBySections([
      { bodyMarkdown: "Prose with no marker.", citationsUsed: [2] },
    ]);
    expect([...carried]).toEqual([2]);
  });
});

describe("buildSourceRegister", () => {
  const evidence: GovernedEvidenceItem[] = [
    {
      citationNumber: 1,
      label: "Service tower scope",
      statement: "7 in-scope towers.",
      evidenceFamily: "service_tower_scope",
      confidence: "high",
      asOf: "FY2026",
      disclosureTier: "vendor_facing",
      provenanceRef: "ev-1",
    },
    {
      citationNumber: 4,
      label: "Ticket volumes",
      statement: "15,600 L1 tickets/month.",
      evidenceFamily: "ticket_volumes",
      confidence: "medium",
      asOf: "2026-05",
      disclosureTier: "vendor_facing",
      provenanceRef: "ev-4",
    },
  ];
  const section = (over: Partial<RenderableSection>): RenderableSection =>
    ({
      key: "a",
      title: "A",
      bodyMarkdown: "",
      groundingMode: "mixed",
      ...over,
    }) as RenderableSection;

  it("lists a source the body cites but the section never reported", () => {
    const register = buildSourceRegister(evidence, [
      section({ bodyMarkdown: "Tickets run at 15,600/month [4].", citationsUsed: [] }),
    ]);
    expect(register.map((r) => r.citationNumber)).toEqual([4]);
    expect(register[0]?.label).toBe("Ticket volumes");
  });

  it("cannot list evidence that is not in the bundle it was handed", () => {
    // Audience filtering happens upstream; a marker for an excluded item must
    // not reintroduce it.
    const register = buildSourceRegister(evidence, [
      section({ bodyMarkdown: "An excluded source [5]." }),
    ]);
    expect(register).toEqual([]);
  });

  it("stays empty when the document cites nothing at all", () => {
    // The `no source register` blocker still has a case to fire on.
    const register = buildSourceRegister(evidence, [
      section({ bodyMarkdown: "Prose with no citation and no figures." }),
    ]);
    expect(register).toEqual([]);
  });
});

describe("a generated deliverable whose citations came from the repair", () => {
  // The repair fires on a sentence whose every numeric token appears in one
  // governed evidence item — here "15,600", which is evidence [4]'s own figure.
  const REPAIRABLE =
    "We recommend approving the decision. The estate carries 15,600 L1 service-desk tickets/month across the towers.";

  function callerFor(plannedCitations: number[]): ModelCaller {
    const plan = {
      ...goodPlan(),
      sectionPlan: [
        {
          key: "a",
          title: "Executive Overview",
          groundingMode: "mixed",
          evidenceCitations: plannedCitations,
          assumptionsUsed: [],
          placeholders: [],
          rationale: "Frame the decision.",
        },
      ],
    };
    return async (prompt) => {
      switch (prompt.pass) {
        case "architect":
          return { text: JSON.stringify(plan) };
        case "section_draft":
          return {
            text: JSON.stringify({
              key: "a",
              title: "Executive Overview",
              bodyMarkdown: REPAIRABLE,
              groundingMode: "mixed",
              // citationsUsed deliberately absent: the model omitted it, which
              // is the condition the repair exists to correct.
            }),
          };
        case "synthesis":
          return {
            text: JSON.stringify({
              title: "Probe",
              recommendation:
                "We recommend approving the decision given the validated scope and the costed range.",
              nextActions: ["Issue the pack"],
              tables: [
                {
                  key: "risk_register",
                  title: "Risk / Issues / Dependencies",
                  columns: ["Item", "Owner"],
                  rows: [["Transition", "PMO"]],
                },
              ],
              clientCompleteChecklist: [],
            }),
          };
        default:
          return { text: "{}" };
      }
    };
  }

  const requestWith = (): DeliverableIntelligenceRequest => {
    const base = amsRfpRequest();
    return {
      ...base,
      // The moves phase path builds its request with both lists empty.
      missingEvidence: [],
      clientCompleteItems: [],
      qualityBar: { ...base.qualityBar, minSections: 1, minBodyWords: 10 },
    };
  };

  it("registers the source the repair cited, so no marker is left dangling", async () => {
    const result = await runDeliverableOrchestration(
      requestWith(),
      callerFor([1]),
      { enforcePlanGate: false },
    );
    const doc = result.document;
    expect(doc).toBeDefined();
    const body = doc!.generatedSections.map((s) => s.bodyMarkdown).join("\n");
    expect(body).toContain("[4]");
    const registered = doc!.sourceRegister.map((r) => r.citationNumber).sort();
    // The planned [1] is kept and the repaired [4] is now resolvable.
    expect(registered).toEqual([1, 4]);
    for (const cited of citationsInText(body)) {
      expect(registered).toContain(cited);
    }
  });

  it("is not quarantined for an empty register when its body does cite", async () => {
    // Nothing reported anywhere: before this change the register came back
    // empty and the gate blocked a document that cites approved evidence.
    const result = await runDeliverableOrchestration(
      requestWith(),
      callerFor([]),
      { enforcePlanGate: false },
    );
    expect(result.document?.sourceRegister.map((r) => r.citationNumber)).toEqual(
      [4],
    );
    expect(result.quality?.blockers ?? []).not.toContain("no source register");
    expect(result.ok).toBe(true);
  });
});
