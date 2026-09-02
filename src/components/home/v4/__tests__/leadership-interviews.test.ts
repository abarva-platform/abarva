/**
 * The Leadership Perspective chapter, held to the record it reads.
 *
 * The interview family arrives as one row per question per role, carrying the executive area, the
 * priority theme, the response, and — the half that makes it more than a transcript — the system,
 * risk, metric and initiative each answer names. Those named objects are the only place on this
 * page where leadership opinion meets the estate by name.
 *
 * Two rules this suite exists to hold. Agreement is counted by AREA and never by row, because one
 * area asked eight questions is not eight people agreeing. And a modelled response is never
 * presented as testimony.
 */
import {
  interviewTables,
  interviewFindings,
  type EstateRow,
} from "../page-tables";

function answer(
  executiveArea: string,
  priorityTheme: string,
  extra: EstateRow = {},
): EstateRow {
  return {
    executiveArea,
    stakeholderRole: `${executiveArea} lead`,
    priorityTheme,
    question: "What is holding this back?",
    response: "A modelled answer.",
    responseBasis: "modelled — not a transcript",
    ...extra,
  };
}

/** Three areas: two themes shared by all, one raised by a single area. */
const record = (): EstateRow[] => [
  answer("CFO / Finance", "data", {
    systemOrVendorMentioned: "Reporting marts",
  }),
  answer("CIO / Technology", "data", {
    systemOrVendorMentioned: "Reporting marts",
  }),
  answer("CISO / Security", "data", {
    systemOrVendorMentioned: "Reporting marts",
  }),
  answer("CFO / Finance", "vendor", {
    riskOrControlMentioned: "Concentration",
  }),
  answer("CIO / Technology", "vendor"),
  answer("CISO / Security", "vendor", {
    riskOrControlMentioned: "Access review",
  }),
  answer("CFO / Finance", "funding boundary"),
];

const table = (rows: EstateRow[], caption: string) =>
  interviewTables(rows).find((t) => t.caption === caption);

describe("where leadership diverges", () => {
  it("leads with the least-shared theme, not the most", () => {
    // Sorted the other way, a record where most themes are universal shows identical rows and the
    // reader never reaches the ones that differ -- which is the question the chapter asks.
    const diverges = table(record(), "Where leadership diverges");
    expect(diverges).toBeDefined();
    expect(diverges!.rows[0]).toEqual(["Funding boundary", 1, 3, 1]);
  });

  it("counts areas, never answers", () => {
    // Six answers about data from three areas is three areas agreeing, not six.
    const rows = [
      ...record(),
      answer("CFO / Finance", "data"),
      answer("CFO / Finance", "data"),
    ];
    const diverges = table(rows, "Where leadership diverges");
    const data = diverges!.rows.find((r) => r[0] === "Data");
    expect(data?.[1]).toBe(3);
    expect(data?.[3]).toBe(5);
  });

  it("is not drawn when only one area was interviewed", () => {
    const rows = record().map((r) => ({
      ...r,
      executiveArea: "CFO / Finance",
    }));
    expect(table(rows, "Where leadership diverges")).toBeUndefined();
  });
});

describe("systems leadership keeps returning to", () => {
  it("lists only systems more than one area named", () => {
    const named = table(record(), "Systems leadership keeps returning to");
    expect(named!.rows).toEqual([["Reporting marts", 3, 3, 1]]);
  });

  it("says the system was named by the interviewee, not matched from the estate", () => {
    const named = table(record(), "Systems leadership keeps returning to");
    expect(named!.note).toContain(
      "Named by the interviewee, not matched from the estate",
    );
  });

  it("is not drawn when no system is named twice", () => {
    const rows = record().map((r, i) => ({
      ...r,
      systemOrVendorMentioned: `System ${i}`,
    }));
    expect(
      table(rows, "Systems leadership keeps returning to"),
    ).toBeUndefined();
  });
});

describe("what the interview record is, before what it says", () => {
  it("states that every response is modelled rather than transcribed", () => {
    // The most damaging thing this page could do is render a modelled answer under a named role as
    // something a person said. This finding has to fire before any quotation is read.
    const found = interviewFindings(record()).find((f) =>
      f.claim.includes("modelled, not transcribed"),
    );
    expect(found).toMatchObject({ kind: "absence" });
    expect(found!.because).toContain("should be read as testimony");
  });

  it("counts the mixture when only some responses are modelled", () => {
    const rows = record();
    rows[0] = { ...rows[0], responseBasis: "attributed" };
    const claims = interviewFindings(rows).map((f) => f.claim);
    expect(claims).toContain(
      "6 of 7 interview responses are modelled rather than transcribed.",
    );
  });

  it("says nothing about basis when every response is attributed", () => {
    const rows = record().map((r) => ({ ...r, responseBasis: "attributed" }));
    expect(
      interviewFindings(rows).some((f) => f.claim.includes("modelled")),
    ).toBe(false);
  });
});

describe("agreement and divergence", () => {
  it("reports a theme every area raises as consensus", () => {
    const found = interviewFindings(record()).find((f) =>
      f.claim.includes("raised by every one of"),
    );
    expect(found).toMatchObject({ kind: "established" });
    expect(found!.claim).toContain(
      "2 themes are raised by every one of the 3 executive areas",
    );
  });

  it("reports a theme one area raises as an exposure, and says why it is ambiguous", () => {
    const found = interviewFindings(record()).find((f) =>
      f.claim.includes("raised by a single area"),
    );
    expect(found).toMatchObject({ kind: "exposure" });
    // Local problem, or the only part of the business that can see it. The record cannot tell.
    expect(found!.because).toContain("opposite ways");
  });

  it("names the system the most areas raise", () => {
    const found = interviewFindings(record()).find((f) =>
      f.claim.includes("Reporting marts"),
    );
    expect(found!.claim).toBe(
      "Reporting marts is named by 3 of the 3 executive areas.",
    );
  });

  it("counts risks leadership raises unprompted", () => {
    const found = interviewFindings(record()).find((f) =>
      f.claim.includes("distinct risks"),
    );
    expect(found!.claim).toBe(
      "Leadership names 2 distinct risks or controls unprompted.",
    );
  });

  it("says nothing about agreement when too few areas were interviewed", () => {
    const rows = record().filter((r) => r.executiveArea !== "CISO / Security");
    const claims = interviewFindings(rows).map((f) => f.claim);
    expect(claims.some((c) => c.includes("raised by every one of"))).toBe(
      false,
    );
    expect(claims.some((c) => c.includes("raised by a single area"))).toBe(
      false,
    );
  });
});
