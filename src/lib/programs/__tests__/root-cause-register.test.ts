import {
  isRootCauseRegisterComplete,
  parseRootCauseRegister,
  rankedRootCauses,
  rootCauseCaptureText,
  rootCauseDigestLines,
  rootCauseRegisterToText,
  serializeRootCauseRegister,
  type RootCauseEntry,
  type RootCauseRegister,
} from "@/lib/programs/root-cause-register";
import { evaluatePhaseCapture } from "@/lib/programs/phase-capture-contract";

const cause = (
  id: string,
  overrides: Partial<RootCauseEntry> = {},
): RootCauseEntry => ({
  id,
  cause: `Cause ${id}`,
  status: "accepted",
  ...overrides,
});

const register = (
  causes: RootCauseEntry[],
  confirmed = true,
): RootCauseRegister => ({
  kind: "root_cause_register",
  version: 1,
  causes,
  ...(confirmed
    ? { orderConfirmedAt: "2026-10-02", orderConfirmedBy: "The consultant" }
    : {}),
});

const sample = () =>
  register([
    cause("RC-2", {
      cause: "Metric definitions conflict across sources",
      drives: "Priority measures certified",
      evidence: ["Data quality profile", "Measure register"],
      confidence: "high",
    }),
    cause("RC-1", {
      cause: "No accountable ownership",
      evidence: ["Steward interviews"],
    }),
    cause("RC-4", {
      cause: "Identity not resolved across EHR and claims",
      status: "known_gap",
      owner: "Master-data program lead",
    }),
    cause("RC-5", {
      cause: "Out of scope cause",
      status: "out_of_scope",
      owner: "Sponsor",
    }),
    cause("S-1", {
      cause: "Reports don't match between departments",
      status: "symptom",
      symptomOf: "RC-2",
    }),
  ]);

describe("parseRootCauseRegister", () => {
  it("reads a serialized register back exactly", () => {
    const original = sample();
    expect(
      parseRootCauseRegister(serializeRootCauseRegister(original)),
    ).toEqual(original);
  });

  it.each([
    ["free text", "Ownership is unclear and definitions conflict."],
    ["a JSON array", '[{"metric":"x","value":"1","source":"s"}]'],
    [
      "JSON without the kind marker",
      '{"causes":[{"id":"RC-1","cause":"x","status":"accepted"}]}',
    ],
    [
      "another version",
      '{"kind":"root_cause_register","version":2,"causes":[]}',
    ],
    ["malformed JSON", '{"kind":"root_cause_register",'],
    ["empty", ""],
  ])("returns null for %s", (_name, raw) => {
    expect(parseRootCauseRegister(raw)).toBeNull();
  });

  it("drops malformed entries and duplicate ids", () => {
    const parsed = parseRootCauseRegister(
      JSON.stringify({
        kind: "root_cause_register",
        version: 1,
        causes: [
          { id: "RC-1", cause: "Kept", status: "accepted" },
          { id: "RC-1", cause: "Duplicate", status: "accepted" },
          { id: "RC-2", cause: "Bad status", status: "approved" },
          { id: "RC-3", cause: "  ", status: "draft" },
        ],
      }),
    );
    expect(parsed?.causes.map((c) => c.cause)).toEqual(["Kept"]);
  });
});

describe("ranking and completeness", () => {
  it("ranks everything except symptoms and out-of-scope causes, in stored order", () => {
    expect(rankedRootCauses(sample()).map((c) => c.id)).toEqual([
      "RC-2",
      "RC-1",
      "RC-4",
    ]);
  });

  it("is complete when every ranked cause is settled and the order is confirmed", () => {
    expect(isRootCauseRegisterComplete(sample())).toBe(true);
  });

  it.each([
    ["an unconfirmed order", register([cause("RC-1")], false)],
    [
      "a draft cause",
      register([cause("RC-1"), cause("RC-2", { status: "draft" })]),
    ],
    [
      "a cause with no evidence",
      register([cause("RC-1", { status: "no_evidence" })]),
    ],
    [
      "a known gap without an owner",
      register([cause("RC-1", { status: "known_gap" })]),
    ],
    ["no ranked cause at all", register([cause("S-1", { status: "symptom" })])],
  ])("is not complete with %s", (_name, value) => {
    expect(isRootCauseRegisterComplete(value)).toBe(false);
  });

  it("holds P2 capture completeness on the register, and leaves free text judged as before", () => {
    const incomplete = serializeRootCauseRegister(
      register([cause("RC-1", { status: "draft" })]),
    );
    const status = (value: string) =>
      evaluatePhaseCapture(2, { gaps_root_causes: value }).sections.find(
        (s) => s.key === "gaps_root_causes",
      )?.complete;
    expect(status(incomplete)).toBe(false);
    expect(status(serializeRootCauseRegister(sample()))).toBe(true);
    expect(status("Ownership is unclear.")).toBe(true);
  });
});

describe("text for the gate, the build and generation", () => {
  it("returns any non-register value exactly as written", () => {
    const legacy = "Ownership is unclear.\nDefinitions conflict.";
    expect(rootCauseCaptureText(legacy)).toBe(legacy);
    expect(rootCauseDigestLines(legacy)).toEqual([legacy]);
  });

  it("renders the register as a ranked, cited list with no JSON", () => {
    const text = rootCauseRegisterToText(sample());
    expect(text).toBe(
      [
        "Root causes, in the consultant's confirmed order:",
        "1. RC-2: Metric definitions conflict across sources (accepted) · drives baseline: Priority measures certified · evidence: Data quality profile; Measure register · confidence: high",
        "2. RC-1: No accountable ownership (accepted) · evidence: Steward interviews",
        "3. RC-4: Identity not resolved across EHR and claims (carried as a known gap) · owner: Master-data program lead",
        "Ruled out of scope: RC-5 Out of scope cause (owner: Sponsor)",
        "Set aside as symptoms, not causes: Reports don't match between departments (effect of RC-2)",
      ].join("\n"),
    );
    expect(rootCauseCaptureText(serializeRootCauseRegister(sample()))).toBe(
      text,
    );
  });

  it("names drafts and unevidenced causes as open, and an unconfirmed order as such", () => {
    const text = rootCauseRegisterToText(
      register(
        [
          cause("RC-1", { status: "draft" }),
          cause("RC-2", { status: "no_evidence" }),
        ],
        false,
      ),
    );
    expect(text).toContain("Root causes (order not yet confirmed):");
    expect(text).toContain("1. RC-1: Cause RC-1 (draft, not yet accepted)");
    expect(text).toContain("2. RC-2: Cause RC-2 (no approved evidence yet)");
  });

  it("gives generation only settled causes, keeping the consultant's rank numbers", () => {
    const lines = rootCauseDigestLines(
      serializeRootCauseRegister(
        register([
          cause("RC-1", { status: "draft" }),
          cause("RC-2", { evidence: ["Profile"] }),
          cause("RC-3", { status: "known_gap", owner: "Owner A" }),
        ]),
      ),
    );
    expect(lines).toEqual([
      "2. Cause RC-2 · evidence: Profile",
      "3. Cause RC-3 · (known gap, owner Owner A)",
    ]);
  });
});
