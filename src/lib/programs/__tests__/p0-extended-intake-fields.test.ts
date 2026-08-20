import {
  applyExtendedIntakeFieldsIfEnabled,
  embedExtendedIntakeFieldsInCharter,
  readExtendedIntakeFieldsFromCharter,
} from "../p0-extended-intake-fields";

describe("p0-extended-intake-fields", () => {
  const fields = {
    businessSegment: "Health Plan Operations",
    officeLens: "Middle Office",
    careType: "Clinical",
    valueHypothesisQuant: "$2-4M/yr recoverable revenue",
    valueHypothesisQual: "Coding team trusts the data more",
    stakeholders: "Coding team lead; Actuarial; Compliance",
  };

  it("embeds the bundle under its own key without disturbing existing charter content", () => {
    const charter = { existing: "value" };
    const next = embedExtendedIntakeFieldsInCharter(charter, fields);
    expect(next).toEqual({
      existing: "value",
      p0_extended_intake_fields_v1: fields,
    });
    // Original charter object is untouched (pure function).
    expect(charter).toEqual({ existing: "value" });
  });

  it("is a no-op when fields is null/undefined", () => {
    const charter = { existing: "value" };
    expect(embedExtendedIntakeFieldsInCharter(charter, null)).toBe(charter);
    expect(embedExtendedIntakeFieldsInCharter(charter, undefined)).toBe(
      charter,
    );
  });

  it("is a no-op when every field is empty/blank", () => {
    const charter = { existing: "value" };
    const empty = {
      businessSegment: "",
      officeLens: null,
      careType: undefined,
      valueHypothesisQuant: "   ",
      valueHypothesisQual: null,
      stakeholders: null,
    };
    expect(embedExtendedIntakeFieldsInCharter(charter, empty)).toBe(charter);
  });

  it("reads the bundle back out of a charter", () => {
    const charter = embedExtendedIntakeFieldsInCharter({}, fields);
    expect(readExtendedIntakeFieldsFromCharter(charter)).toEqual(fields);
  });

  it("returns null for a legacy/malformed/missing charter", () => {
    expect(readExtendedIntakeFieldsFromCharter(null)).toBeNull();
    expect(readExtendedIntakeFieldsFromCharter({})).toBeNull();
    expect(
      readExtendedIntakeFieldsFromCharter({
        p0_extended_intake_fields_v1: "not-an-object",
      }),
    ).toBeNull();
  });

  describe("applyExtendedIntakeFieldsIfEnabled", () => {
    it("is byte-identical (same reference) when the flag is off, regardless of fields", () => {
      const charter = { existing: "value" };
      expect(applyExtendedIntakeFieldsIfEnabled(charter, fields, false)).toBe(
        charter,
      );
    });

    it("is byte-identical (same reference) when fields is null, regardless of the flag", () => {
      const charter = { existing: "value" };
      expect(applyExtendedIntakeFieldsIfEnabled(charter, null, true)).toBe(
        charter,
      );
    });

    it("embeds the bundle only when the flag is on AND fields are present", () => {
      const charter = { existing: "value" };
      const next = applyExtendedIntakeFieldsIfEnabled(charter, fields, true);
      expect(next).toEqual({
        existing: "value",
        p0_extended_intake_fields_v1: fields,
      });
    });
  });
});
